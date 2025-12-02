# ======================================================================
# main.py (VERSIÓN FINAL CON LIMPIEZA AUTOMÁTICA DE DATOS ANTIGUOS)
# ======================================================================
import time
import os
import shutil
import geopandas as gpd
from datetime import datetime, timedelta  # timedelta es necesario para la nueva función
import gc

import config
import image_downloader
import raster_processor
import product_analyzer
import output_generator

# <<< --- NUEVA FUNCIÓN DE LIMPIEZA DE DISCO --- >>>
def limpiar_directorios_antiguos(base_path, products_to_clean, retention_days):
    """
    Escanea los directorios de productos y elimina las carpetas de fecha
    que son más antiguas que el período de retención especificado.
    """
    print(f"\n--- Iniciando limpieza de datos con más de {retention_days} días en: {base_path} ---")
    today = datetime.now()
    # Creamos un punto de corte: cualquier fecha anterior a esta será eliminada.
    cutoff_date = today - timedelta(days=retention_days)

    for product in products_to_clean:
        product_path = os.path.join(base_path, product)

        if not os.path.isdir(product_path):
            # Si el directorio del producto no existe, simplemente lo saltamos.
            continue

        # Listamos todas las carpetas dentro del directorio del producto (ej. '2025-08-21')
        for date_folder_name in os.listdir(product_path):
            full_folder_path = os.path.join(product_path, date_folder_name)

            if not os.path.isdir(full_folder_path):
                # Ignoramos si es un archivo y no una carpeta.
                continue
            
            try:
                # Intentamos convertir el nombre de la carpeta a un objeto de fecha.
                folder_date = datetime.strptime(date_folder_name, '%Y-%m-%d')
                
                # Comparamos si la fecha de la carpeta es anterior a nuestra fecha de corte.
                if folder_date < cutoff_date:
                    print(f"  - Eliminando directorio antiguo: {full_folder_path}")
                    try:
                        shutil.rmtree(full_folder_path)
                    except OSError as e:
                        print(f"    ERROR: No se pudo eliminar {full_folder_path}. Razón: {e}")

            except ValueError:
                # Si el nombre de la carpeta no es una fecha válida (ej. 'temp.txt'), la ignoramos.
                pass
    print("--- Limpieza de directorios antiguos finalizada. ---")


def main_loop():
    """Bucle principal que ejecuta el pipeline de análisis avanzado de forma eficiente."""
    
    print("Cargando y preparando archivos de límites geográficos...")
    peru_land_shape = gpd.read_file(config.SHAPEFILES["peru_land"])
    peru_unified_geometry = peru_land_shape.union_all()
    
    while True:
        print("\n" + "="*80)
        print(f"INICIANDO CICLO DE PROCESAMIENTO: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80)

        # ... (La sección de descarga no cambia) ...
        if os.path.exists(config.TEMP_DOWNLOAD_PATH): shutil.rmtree(config.TEMP_DOWNLOAD_PATH)
        os.makedirs(config.TEMP_DOWNLOAD_PATH)
        downloaded_files = image_downloader.download_latest_band_images(
            config.SATELLITE, config.BASE_URL, config.REQUIRED_BANDS, config.TEMP_DOWNLOAD_PATH
        )
        if 'GeoColor' not in downloaded_files or len(downloaded_files) <= len(config.REQUIRED_BANDS):
            print("\nERROR: Faltan archivos base. Reintentando...")
            time.sleep(config.RUN_INTERVAL_MINUTES * 60)
            continue
        
        geocolor_path = downloaded_files.pop('GeoColor')
        print("\nProcesando imagen de fondo GeoColor (una sola vez)...")
        geocolor_full_disk = raster_processor.georeference_image(geocolor_path, config.GEOS_CENTRAL_LONGITUDE, is_geocolor=True)
        geocolor_peru = geocolor_full_disk.rio.clip([peru_unified_geometry], crs=peru_land_shape.crs, drop=True)
        
        timestamp_str = image_downloader.get_latest_timestamp()
        dt_object = datetime.strptime(timestamp_str, '%Y%j%H%M')

        # --- BUCLE PRINCIPAL POR PRODUCTO ---
        for product_key in config.PRODUCTS_TO_CALCULATE:
            clipped_bands_for_product = None
            calculated_product = None
            cleaned_product = None
            
            print(f"\n{'='*25} PROCESANDO PRODUCTO: {product_key} {'='*25}")
            
            try:
                required_bands_for_product = product_analyzer.PRODUCT_CONFIG[product_key]['required_bands']
                band_files_to_process = {
                    band: downloaded_files[band] for band in required_bands_for_product if band in downloaded_files
                }

                if len(band_files_to_process) != len(required_bands_for_product):
                    print(f"  - ADVERTENCIA: Faltan bandas para {product_key}. Saltando producto.")
                    continue

                clipped_bands_for_product = raster_processor.process_and_align_bands(
                    band_files_to_process, geocolor_full_disk, peru_unified_geometry, peru_land_shape.crs
                )
                if not clipped_bands_for_product: continue

                calculated_product = product_analyzer.calculate_single_product(product_key, clipped_bands_for_product)
                if calculated_product is None: continue

                print("\nLimpiando producto final para que coincida con el contorno de Perú...")
                cleaned_product = calculated_product.rio.clip(
                    [peru_unified_geometry], crs=peru_land_shape.crs, drop=True, all_touched=True
                )

                print(f"\nGenerando archivos de salida para {product_key}...")
                base_filename = f"{product_key}_{dt_object.strftime('%Y%m%d_%H%M')}"
                date_folder = dt_object.strftime('%Y-%m-%d')
                time_folder = dt_object.strftime('%H%M')

                img_save_path = os.path.join(config.OUTPUT_PATH, 'images', product_key, date_folder, time_folder, f"{base_filename}.png")
                output_generator.create_final_image(
                    product_key, cleaned_product, geocolor_peru, img_save_path, peru_land_shape
                )
                
                shp_save_path = os.path.join(config.OUTPUT_PATH, 'vectors', product_key, date_folder, time_folder, f"{base_filename}.shp")
                output_generator.create_categorized_shapefile(
                    product_key, cleaned_product, shp_save_path
                )
            
            except Exception as e:
                print(f"\n\nERROR INESPERADO durante el procesamiento del producto {product_key}: {e}")
                import traceback
                traceback.print_exc()
                print("Continuando con el siguiente producto...\n")
            
            finally:
                print(f"  - Liberando memoria para el producto {product_key}...")
                del clipped_bands_for_product
                del calculated_product
                del cleaned_product
                gc.collect()

        del geocolor_full_disk
        del geocolor_peru
        del downloaded_files
        gc.collect()

        print("\nLimpiando archivos temporales...")
        if os.path.exists(config.TEMP_DOWNLOAD_PATH):
            shutil.rmtree(config.TEMP_DOWNLOAD_PATH)
        
        # <<< --- LLAMADA A LA NUEVA FUNCIÓN DE LIMPIEZA DE DISCO --- >>>
        # Se ejecuta una vez por ciclo para limpiar las carpetas de imágenes y vectores.
        images_base_path = os.path.join(config.OUTPUT_PATH, 'images')
        vectors_base_path = os.path.join(config.OUTPUT_PATH, 'vectors')
        
        limpiar_directorios_antiguos(images_base_path, config.PRODUCTS_TO_CALCULATE, config.RETENTION_DAYS)
        limpiar_directorios_antiguos(vectors_base_path, config.PRODUCTS_TO_CALCULATE, config.RETENTION_DAYS)
        # <<< -------------------------------------------------------- >>>
        
        print(f"\nCiclo completado. Esperando {config.RUN_INTERVAL_MINUTES} minutos...")
        time.sleep(config.RUN_INTERVAL_MINUTES * 60)

if __name__ == "__main__":
    main_loop()