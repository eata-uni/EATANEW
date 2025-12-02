# ======================================================================
# config.py (Versión de Cálculo por Bandas)
# ======================================================================

# --- Bandas y Productos ---
# Lista de las bandas ABI que necesitamos descargar como imágenes JPG.
REQUIRED_BANDS = [7, 8, 9, 10, 14, 15]

# Lista de los productos que vamos a CALCULAR a partir de las bandas.
# Estos nombres se usarán para las carpetas y archivos de salida.
PRODUCTS_TO_CALCULATE = [
    "LSTF",   # Land Surface Temperature (pseudo)
    "RRQPEF", # Rainfall Rate (pseudo)
    "ACHAF",  # Cloud Top Height (pseudo)
    "ACHTF",  # Cloud Top Temperature (pseudo)
    "TPWF"    # Total Precipitable Water (pseudo)
]

# --- Rutas Locales ---
OUTPUT_PATH = r'/home/ubuntu/CTIC/NewEATA/GOES_OUTPUT'
TEMP_DOWNLOAD_PATH = r'/home/ubuntu/CTIC/NewEATA/GOES_TEMP'

SHAPEFILES = {
    "peru_land": r"/home/ubuntu/CTIC/Boundaries/PER_adm/PER_adm2.shp"
}

# --- Configuración de Descarga ---
SATELLITE = 'GOES19' # Usando el satélite más nuevo como solicitaste
BASE_URL = f"https://cdn.star.nesdis.noaa.gov/{SATELLITE}/ABI/FD/"

# --- Configuración Geográfica ---
PERU_BOUNDS = [-85, -67.5, -20.5, 1.0]
# Longitud central correcta para GOES-19 en su fase de pruebas actual.
GEOS_CENTRAL_LONGITUDE =-75.0 

# --- Configuración del Proceso ---
RUN_INTERVAL_MINUTES = 12
RETENTION_DAYS = 4