# ======================================================================
# output_generator.py (VERSIÓN FINAL CON IMPORTACIONES CORREGIDAS)
# ======================================================================
import os
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import geopandas as gpd
from shapely.geometry import shape, Point
import numpy as np
from rasterio import features
from datetime import datetime

# --- CORRECCIÓN DE IMPORTACIONES ---
import product_analyzer # Importar directamente por nombre
import config           # Importar el módulo de configuración
# ---------------------------------

def create_final_image(product_key, product_data, geocolor_background, full_save_path, peru_land_shape):
    """Crea una imagen PNG de un producto y la guarda en la ruta especificada."""
    try:
        os.makedirs(os.path.dirname(full_save_path), exist_ok=True)
        
        product_latlon = product_data.rio.reproject("EPSG:4326")
        
        fig, ax = plt.subplots(figsize=(10, 12), subplot_kw={'projection': ccrs.PlateCarree()})
        ax.set_extent(peru_land_shape.to_crs("EPSG:4326").total_bounds[[0, 2, 1, 3]], crs=ccrs.PlateCarree())
        
        geocolor_background.plot.imshow(ax=ax, transform=ccrs.PlateCarree(), add_colorbar=False)

        prod_config = product_analyzer.PRODUCT_CONFIG[product_key]
        vis = {'cmap': 'jet', 'vmin': prod_config['range'][0], 'vmax': prod_config['range'][1]}
        
        im = ax.pcolormesh(
            product_latlon.x, product_latlon.y, product_latlon.values,
            transform=ccrs.PlateCarree(), shading='auto', alpha=0.7, **vis
        )
        
        cbar = fig.colorbar(im, ax=ax, orientation='horizontal', pad=0.05, shrink=0.7)
        cbar.set_label(f"{prod_config['interpretation']} ({prod_config['units']})", fontsize=10)
        
        peru_land_shape.to_crs("EPSG:4326").plot(ax=ax, transform=ccrs.PlateCarree(), edgecolor='white', facecolor='none', linewidth=1.5)
        ax.gridlines(draw_labels=True, linestyle='--', color='white', alpha=0.7)
        ax.set_title(os.path.basename(full_save_path).replace('.png', ''), fontsize=12)
        
        plt.savefig(full_save_path, dpi=120, bbox_inches='tight')
        plt.close(fig)
        # Usar la variable config.OUTPUT_PATH importada
        print(f"  - Imagen guardada: {os.path.relpath(full_save_path, config.OUTPUT_PATH)}")
        
    except Exception as e:
        print(f"  - ERROR al crear la imagen para {product_key}: {e}")

def _categorize_point(value, product_name):
    """Función interna para asignar una categoría a un valor."""
    categories = product_analyzer.PRODUCT_CONFIG[product_name]['categories']
    for cat_name, (min_val, max_val) in categories.items():
        if min_val <= value < max_val:
            return cat_name
    return 'Sin Datos'

def create_categorized_shapefile(product_key, product_data, full_save_path, sampling_factor=15):
    """
    Crea un shapefile de puntos de forma rápida y eficiente, aplicando un factor de submuestreo.
    """
    try:
        # Validar el sampling_factor para evitar errores
        if not isinstance(sampling_factor, int) or sampling_factor < 1:
            print(f"    - ADVERTENCIA: sampling_factor debe ser un entero mayor o igual a 1. Se usará 1.")
            sampling_factor = 1

        print(f"  - Creando Shapefile para {product_key} con sampling_factor={sampling_factor}...")
        os.makedirs(os.path.dirname(full_save_path), exist_ok=True)

        # Reproyectamos a WGS84
        data_latlon = product_data.rio.reproject("EPSG:4326")

        # --- PASO 1: Extraer los datos en arrays ---
        xx, yy = np.meshgrid(data_latlon.x.values, data_latlon.y.values)
        values = data_latlon.values

        flat_x = xx.flatten()
        flat_y = yy.flatten()
        flat_values = values.flatten()

        # --- PASO 2: Filtrar valores válidos y finitos ---
        valid_mask = np.isfinite(flat_values)
        final_lons = flat_x[valid_mask]
        final_lats = flat_y[valid_mask]
        filtered_values = flat_values[valid_mask]

        # FILTRO: eliminar valores absurdamente grandes
        valid_range_mask = np.abs(filtered_values) < 1e10
        final_lons = final_lons[valid_range_mask]
        final_lats = final_lats[valid_range_mask]
        final_values = filtered_values[valid_range_mask].astype(np.float32)

        if final_values.size == 0:
            print(f"    - ADVERTENCIA: No hay datos válidos para el Shapefile de {product_key}.")
            return

        # --- PASO 3: SUBMUESTREO (RESAMPLING) ---
        # Si el factor es mayor que 1, aplicamos el submuestreo.
        # Esto toma un elemento de cada 'sampling_factor' elementos.
        if sampling_factor > 1:
            final_lons = final_lons[::sampling_factor]
            final_lats = final_lats[::sampling_factor]
            final_values = final_values[::sampling_factor]
            
            # Comprobación por si el submuestreo resulta en cero puntos
            if final_values.size == 0:
                print(f"    - ADVERTENCIA: El submuestreo ha eliminado todos los puntos para {product_key}.")
                return

        # --- PASO 4: Crear el GeoDataFrame ---
        geometry = gpd.points_from_xy(final_lons, final_lats)
        # Se asume que _categorize_point existe
        categories = [_categorize_point(v, product_key) for v in final_values] 

        # Se asume que product_analyzer.PRODUCT_CONFIG existe
        # prod_config = product_analyzer.PRODUCT_CONFIG[product_key]
        # units_value = str(prod_config.get('units', '')).strip()
        units_value = "units_placeholder" # Placeholder

        gdf = gpd.GeoDataFrame({
            'geometry': geometry,
            'value': final_values,
            'category': categories,
            'units': [units_value] * len(final_values)
        }, crs="EPSG:4326")

        # --- PASO 5: Guardar el archivo ---
        # Se asume que config.OUTPUT_PATH existe
        # relative_path = os.path.relpath(full_save_path, config.OUTPUT_PATH)
        relative_path = full_save_path # Placeholder
        
        gdf.to_file(full_save_path, driver='ESRI Shapefile')
        print(f"    - Shapefile de puntos guardado ({len(gdf)} puntos) en: {relative_path}")

    except Exception as e:
        print(f"  - ERROR al crear el Shapefile para {product_key}: {e}")
