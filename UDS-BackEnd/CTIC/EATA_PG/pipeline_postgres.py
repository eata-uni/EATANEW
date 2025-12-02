import os
import time
import logging
from datetime import datetime, timedelta
import geopandas as gpd
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# --- 1. CONFIGURACIÓN (Sin cambios) ---
RUTA_A_MONITOREAR = r"/home/ubuntu/CTIC/NewEATA/GOES_OUTPUT/vectors"
DB_USER = "postgres"
DB_PASSWORD = "nueva_clave"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "EATA"
DB_TABLE = "datos_goes"
DB_SCHEMA = "public"

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S')

# --- 2. LÓGICA DEL PIPELINE (Con modificaciones) ---

def crear_conexion_db():
    """Crea una conexión a la base de datos usando SQLAlchemy."""
    try:
        db_url = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        engine = create_engine(db_url)
        with engine.connect():
            logging.info(f"Conexión a la base de datos '{DB_NAME}' exitosa.")
        return engine
    except SQLAlchemyError as e:
        logging.error(f"Error al conectar con la base de datos: {e}")
        return None

def limpiar_datos_antiguos(engine):
    """
    Elimina registros que son más antiguos de 24 horas
    respecto al registro MÁS RECIENTE en la base de datos.
    """
    try:
        with engine.connect() as connection:
            with connection.begin(): # Transacción
                get_max_date_query = text(f"SELECT MAX(fecha_muestra) FROM {DB_SCHEMA}.{DB_TABLE}")
                max_date_result = connection.execute(get_max_date_query).scalar_one_or_none()

                if max_date_result is None:
                    logging.info("No hay datos en la tabla, no se realiza limpieza.")
                    return

                cutoff_time = max_date_result - timedelta(hours=24)
                logging.info(f"Fecha más reciente en DB: {max_date_result}. Limpiando datos de DB anteriores a {cutoff_time}.")

                delete_query = text(f"DELETE FROM {DB_SCHEMA}.{DB_TABLE} WHERE fecha_muestra < :cutoff")
                result = connection.execute(delete_query, {"cutoff": cutoff_time})
                if result.rowcount > 0:
                    logging.info(f"{result.rowcount} registros antiguos eliminados de la base de datos.")

    except SQLAlchemyError as e:
        logging.error(f"Error al limpiar datos antiguos de la DB: {e}")

# <<< --- NUEVA FUNCIÓN --- >>>
def eliminar_archivos_shapefile(ruta_shp):
    """
    Elimina un shapefile y todos sus archivos asociados (.shx, .dbf, .prj, etc.).
    """
    # Obtiene el nombre del archivo sin la extensión .shp
    nombre_base, _ = os.path.splitext(ruta_shp)
    # Obtiene el directorio donde se encuentran los archivos
    directorio = os.path.dirname(ruta_shp)
    # Obtiene solo el nombre del archivo base para la comparación
    nombre_archivo_base = os.path.basename(nombre_base)
    
    archivos_eliminados = 0
    logging.info(f"Iniciando limpieza de archivos para: {nombre_archivo_base}")
    
    # Itera sobre todos los archivos en el mismo directorio
    for archivo in os.listdir(directorio):
        # Si el nombre del archivo comienza con el nombre base (ej. 'ACHAF_20250824_1520')
        if archivo.startswith(nombre_archivo_base):
            ruta_completa_archivo = os.path.join(directorio, archivo)
            try:
                os.remove(ruta_completa_archivo)
                logging.info(f"  - Archivo eliminado: {archivo}")
                archivos_eliminados += 1
            except OSError as e:
                logging.error(f"  - Error al eliminar el archivo {ruta_completa_archivo}: {e}")
    
    if archivos_eliminados > 0:
        logging.info(f"Limpieza de archivos completada. Se eliminaron {archivos_eliminados} archivos.")

def check_if_data_exists(engine, producto, fecha_muestra):
    """Verifica si un registro para un producto y fecha ya existe."""
    query = text(f"""
        SELECT 1 FROM {DB_SCHEMA}.{DB_TABLE}
        WHERE producto = :prod AND fecha_muestra = :fecha
        LIMIT 1;
    """)
    try:
        with engine.connect() as connection:
            result = connection.execute(query, {"prod": producto, "fecha": fecha_muestra}).scalar_one_or_none()
            return result is not None
    except SQLAlchemyError as e:
        logging.error(f"Error al verificar la existencia de datos: {e}")
        return False

def procesar_shapefile(ruta_shp, engine, skip_duplicate_check=False):
    """
    Lee, procesa, carga un shapefile y LUEGO LO ELIMINA DEL DISCO si tiene éxito.
    """
    try:
        partes_ruta = ruta_shp.replace(RUTA_A_MONITOREAR, '').strip(os.sep).split(os.sep)
        if len(partes_ruta) < 4: return False

        producto = partes_ruta[0]
        fecha_str = partes_ruta[1]
        hora_str = partes_ruta[2]
        fecha_muestra = datetime.strptime(f"{fecha_str} {hora_str}", "%Y-%m-%d %H%M")

        if not skip_duplicate_check and check_if_data_exists(engine, producto, fecha_muestra):
            logging.warning(f"Dato ya existe en DB: {producto} @ {fecha_muestra}. Omitiendo carga.")
            # <<< --- MODIFICACIÓN IMPORTANTE --- >>>
            # Si el dato ya existe en la base de datos, eliminamos el archivo local para no ocupar espacio.
            eliminar_archivos_shapefile(ruta_shp)
            return False # Se considera "no procesado" en el sentido de que no hubo carga nueva.

        time.sleep(1) 
        gdf = gpd.read_file(ruta_shp)
        gdf.rename_geometry('geom', inplace=True)

        gdf['producto'] = producto
        gdf['fecha_muestra'] = fecha_muestra
        if gdf.crs is None:
            logging.warning("El shapefile no tiene un CRS definido. Asignando WGS84 (EPSG:4326).")
            gdf.set_crs("EPSG:4326", inplace=True)
        
        gdf.to_postgis(name=DB_TABLE, con=engine, schema=DB_SCHEMA, if_exists='append', index=False)
        logging.info(f"ÉXITO: {len(gdf)} registros de '{producto}' ({fecha_muestra}) cargados a la base de datos.")

        # <<< --- MODIFICACIÓN CLAVE --- >>>
        # Si la carga a la base de datos fue exitosa, procedemos a eliminar los archivos del disco.
        eliminar_archivos_shapefile(ruta_shp)
        # <<< --------------------------- >>>

        return True
    
    except Exception as e:
        logging.error(f"Fallo al procesar {ruta_shp}: {e}")
        return False

def carga_inicial(engine):
    """
    Escanea todo el directorio al iniciar, carga los archivos
    faltantes (y los elimina), y realiza una limpieza final en la DB.
    """
    logging.info("--- INICIANDO FASE DE CARGA INICIAL ---")
    archivos_procesados = 0
    todos_los_shps = []

    for root, _, files in os.walk(RUTA_A_MONITOREAR):
        for file in files:
            if file.lower().endswith('.shp'):
                todos_los_shps.append(os.path.join(root, file))
    
    if not todos_los_shps:
        logging.info("No se encontraron shapefiles en el directorio para la carga inicial.")
        return

    logging.info(f"Se encontraron {len(todos_los_shps)} shapefiles para analizar.")

    for ruta_shp in todos_los_shps:
        # La función 'procesar_shapefile' ahora se encarga de cargar y eliminar.
        if procesar_shapefile(ruta_shp, engine, skip_duplicate_check=True): # Omitimos el check inicial para forzar la carga
            archivos_procesados += 1
    
    logging.info(f"Carga inicial finalizada. {archivos_procesados} nuevos conjuntos de datos fueron procesados y eliminados del disco.")
    
    logging.info("Realizando limpieza general de la base de datos post-carga inicial...")
    limpiar_datos_antiguos(engine)
    logging.info("--- CARGA INICIAL COMPLETADA ---")

class ShapefileEventHandler(FileSystemEventHandler):
    """Manejador de eventos que procesa, elimina y luego limpia la DB."""
    def __init__(self, engine):
        self.engine = engine

    def on_created(self, event):
        if not event.is_directory and event.src_path.lower().endswith('.shp'):
            logging.info(f"Nuevo archivo detectado en tiempo real: {event.src_path}")
            # 'procesar_shapefile' ahora se encarga de cargar y eliminar.
            if procesar_shapefile(event.src_path, self.engine):
                # Si el archivo se cargó y eliminó correctamente, ejecutamos la limpieza de la DB.
                limpiar_datos_antiguos(self.engine)

# --- 3. EJECUCIÓN PRINCIPAL (Sin cambios en la lógica) ---

if __name__ == "__main__":
    db_engine = crear_conexion_db()

    if db_engine:
        carga_inicial(db_engine)

        event_handler = ShapefileEventHandler(db_engine)
        observer = Observer()
        observer.schedule(event_handler, RUTA_A_MONITOREAR, recursive=True)
        observer.start()
        
        logging.info(f"Pipeline en modo monitoreo. Escuchando cambios en: {RUTA_A_MONITOREAR}")
        logging.info("Presiona Ctrl+C para detener el script.")

        try:
            while True:
                time.sleep(5)
        except KeyboardInterrupt:
            observer.stop()
            logging.info("Observador detenido por el usuario.")
        
        observer.join()