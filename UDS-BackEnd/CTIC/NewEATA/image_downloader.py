# ======================================================================
# image_downloader.py (Versión con Reintentos Automáticos)
# ======================================================================
import os
import requests
from datetime import datetime, timedelta
from zipfile import ZipFile
import shutil
import time  # <<< NUEVO: Importamos el módulo time para las pausas

# <<< NUEVO: Constantes para la lógica de reintentos
MAX_RETRIES = 100  # Número máximo de intentos por archivo
RETRY_DELAY_SECONDS = 20  # Segundos a esperar entre intentos

def get_latest_timestamp(offset_minutes=20):
    """Genera el timestamp más reciente con un retraso para asegurar disponibilidad."""
    now_utc = datetime.utcnow() - timedelta(minutes=offset_minutes)
    latest_minute = (now_utc.minute // 10) * 10
    latest_time = now_utc.replace(minute=latest_minute, second=0, microsecond=0)
    return latest_time.strftime('%Y%j%H%M')

def download_latest_band_images(satellite, base_url, bands, save_dir):
    """Descarga las imágenes JPG más recientes con reintentos para manejar errores de red."""
    timestamp = get_latest_timestamp()
    downloaded_files = {}

    if os.path.exists(save_dir): shutil.rmtree(save_dir)
    os.makedirs(save_dir)
    print(f"Iniciando descargas para el timestamp: {timestamp}")

    sources_to_download = {f"Band_{b:02d}": f"{b:02d}" for b in bands}
    sources_to_download["GeoColor"] = "GEOCOLOR"

    for friendly_name, source_folder in sources_to_download.items():
        is_zip = (source_folder != "GEOCOLOR")
        
        filename_base = f"{timestamp}_{satellite}-ABI-FD-{source_folder}-10848x10848.jpg"
        url = f"{base_url}{source_folder}/{filename_base}"
        local_path = os.path.join(save_dir, os.path.basename(url))

        if is_zip:
            url += ".zip"
            local_path += ".zip"
        
        print(f"  - Preparando descarga de {friendly_name}...")
        
        # <<< --- INICIO DEL NUEVO BLOQUE DE REINTENTOS --- >>>
        for intento in range(MAX_RETRIES):
            try:
                print(f"    - Intento {intento + 1} de {MAX_RETRIES} para {os.path.basename(url)}")
                # Usamos un timeout para evitar que la conexión se quede colgada indefinidamente
                response = requests.get(url, stream=True, timeout=30) 
                response.raise_for_status()
                
                with open(local_path, 'wb') as f:
                    shutil.copyfileobj(response.raw, f)
                
                print(f"      > Descarga de {friendly_name} completada con éxito.")
                
                # Si la descarga fue exitosa, procesamos y salimos del bucle de reintentos
                if is_zip:
                    with ZipFile(local_path, 'r') as zip_ref:
                        unzipped_filename = zip_ref.namelist()[0]
                        zip_ref.extractall(save_dir)
                    os.remove(local_path)
                    band_num = int(source_folder)
                    downloaded_files[band_num] = os.path.join(save_dir, unzipped_filename)
                else:
                    downloaded_files[friendly_name] = local_path
                
                break  # Salimos del bucle for de reintentos porque tuvimos éxito

            # Capturamos excepciones de red más generales, que incluyen ProtocolError
            except requests.exceptions.RequestException as e:
                print(f"      > ERROR durante la descarga: {e}")
                if intento < MAX_RETRIES - 1:
                    print(f"      > Esperando {RETRY_DELAY_SECONDS} segundos antes de reintentar...")
                    time.sleep(RETRY_DELAY_SECONDS)
                else:
                    print(f"    - ERROR FATAL: No se pudo descargar {friendly_name} después de {MAX_RETRIES} intentos.")
        # <<< --- FIN DEL NUEVO BLOQUE DE REINTENTOS --- >>>

    return downloaded_files