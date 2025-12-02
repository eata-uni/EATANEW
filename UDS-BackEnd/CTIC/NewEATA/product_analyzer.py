# ======================================================================
# product_analyzer.py (VERSIÓN REFACTORIZADA)
# ======================================================================
import numpy as np
import xarray as xr
from scipy.ndimage import gaussian_filter, median_filter

# MODIFICADO: Se añade la clave 'required_bands' a cada producto.
# Esto es CRUCIAL para que el bucle principal sepa qué bandas procesar.
PRODUCT_CONFIG = {
    'ACHAF': { 'required_bands': [14], 'range': (0, 20000), 'units': 'm', 'categories': {'Muy Bajo': (0, 2000), 'Bajo': (2000, 6000), 'Medio': (6000, 10000), 'Alto': (10000, 15000), 'Muy Alto': (15000, 20000)}, 'filter_threshold': 500, 'interpretation': 'Altura de cima de nubes' },
    'ACHTF': { 'required_bands': [14], 'range': (-80, 40), 'units': '°C', 'categories': {'Muy Frío': (-80, -60), 'Frío': (-60, -30), 'Templado': (-30, 0), 'Cálido': (0, 40)}, 'filter_threshold': -75, 'interpretation': 'Temperatura de cima de nubes' },
    'LSTF': { 'required_bands': [14, 15], 'range': (-20, 60), 'units': '°C', 'categories': {'Muy Frío': (-20, 0), 'Frío': (0, 15), 'Templado': (15, 30), 'Cálido': (30, 45), 'Muy Cálido': (45, 60)}, 'filter_threshold': -15, 'interpretation': 'Temperatura de superficie terrestre' },
    'RRQPEF': { 'required_bands': [7, 14], 'range': (0, 100), 'units': 'mm/h', 'categories': {'Sin Lluvia': (0, 0.1), 'Ligera': (0.1, 2.5), 'Moderada': (2.5, 10), 'Fuerte': (10, 50), 'Muy Fuerte': (50, 100)}, 'filter_threshold': 0.05, 'interpretation': 'Tasa de precipitación' },
    'TPWF': { 'required_bands': [8, 9, 10], 'range': (0, 70), 'units': 'mm', 'categories': {'Muy Seco': (0, 10), 'Seco': (10, 25), 'Moderado': (25, 40), 'Húmedo': (40, 55), 'Muy Húmedo': (55, 70)}, 'filter_threshold': 2, 'interpretation': 'Agua precipitable total' }
}

def _pixel_to_bt(pixel_values):
    """Convierte valores de píxel (0-255) a Temp. de Brillo (K) aproximada."""
    return 180 + (pixel_values / 255.0) * 140

def _apply_quality_filters(data, product_name):
    # ... (esta función no necesita cambios)
    config = PRODUCT_CONFIG[product_name]
    min_val, max_val = config['range']
    data_values = data.values
    valid_mask = (data_values >= min_val) & (data_values <= max_val)
    median_data = median_filter(np.nan_to_num(data_values), size=3)
    spatial_diff = np.abs(data_values - median_data)
    spatial_threshold = np.nanstd(data_values) * 2
    spatial_mask = spatial_diff <= spatial_threshold
    final_mask = valid_mask & spatial_mask
    filtered_data = np.where(final_mask, data_values, np.nan)
    return data.copy(data=filtered_data)


# NUEVO: Función para calcular un único producto bajo demanda.
def calculate_single_product(product_key, clipped_bands):
    """
    Calcula un único producto a partir de las bandas pre-procesadas y necesarias.
    """
    print(f"\nCalculando producto específico: {product_key}...")
    
    BT_kelvin = {band: _pixel_to_bt(data) for band, data in clipped_bands.items()}
    
    result_data = None
    # --- Lógica de cálculo (sin cambios) ---
    if product_key == 'ACHAF':
        temp_c = BT_kelvin[14] - 273.15
        height = np.maximum(0, (15 - temp_c) / 6.5 * 1000)
        result_data = height
    elif product_key == 'ACHTF':
        temp_c = BT_kelvin[14] - 273.15
        result_data = temp_c
    elif product_key == 'LSTF':
        bt14_c, bt15_c = BT_kelvin[14] - 273.15, BT_kelvin[15] - 273.15
        lst = bt14_c + 0.7 * (bt14_c - bt15_c)
        result_data = lst
    elif product_key == 'RRQPEF':
        bt7_c, bt14_c = BT_kelvin[7] - 273.15, BT_kelvin[14] - 273.15
        rain_rate = np.zeros_like(bt14_c.values)
        cold_pixels = bt14_c.values < -20
        rain_rate[cold_pixels] = np.maximum(0, 2.0 * np.exp(-0.05 * (bt14_c.values[cold_pixels] + 20)))
        convective_mask = (bt14_c < -40) & ((bt7_c - bt14_c) > 10)
        rain_rate[convective_mask.values] *= 3.0
        result_data = xr.DataArray(rain_rate, coords=bt14_c.coords)
    elif product_key == 'TPWF':
        bt8, bt9, bt10 = BT_kelvin[8], BT_kelvin[9], BT_kelvin[10]
        tpw = 25 + 3.0 * (bt8 - bt9) - 2.5 * (bt9 - bt10)
        tpw = np.maximum(0, tpw)
        result_data = tpw

    if result_data is None:
        print(f"  - ADVERTENCIA: No hay lógica de cálculo para {product_key}")
        return None

    filtered_product = _apply_quality_filters(result_data, product_key)
    
    print("  - Aplicando suavizado final...")
    if not np.all(np.isnan(filtered_product.values)):
        sigma = 0.8 if product_key in ['RRQPEF'] else 0.5
        smoothed_values = gaussian_filter(np.nan_to_num(filtered_product.values), sigma=sigma)
        final_values = np.where(np.isnan(filtered_product.values), np.nan, smoothed_values)
        
        # =========================================================================== #
        # >>>>>>>>>>>>>>>>>>>>>>>>> INICIO DE LA CORRECCIÓN <<<<<<<<<<<<<<<<<<<<<<<<< #
        # =========================================================================== #
        # ANTES (Incorrecto): Se pasaba 'name' a copy(), lo que causaba el error.
        # return filtered_product.copy(data=final_values, name=product_key).assign_attrs(PRODUCT_CONFIG[product_key])

        # AHORA (Correcto): Creamos la copia con los nuevos datos, y LUEGO le asignamos el nombre y los atributos.
        final_product = filtered_product.copy(data=final_values)
        final_product.name = product_key
        return final_product.assign_attrs(PRODUCT_CONFIG[product_key])
        # =========================================================================== #
        # >>>>>>>>>>>>>>>>>>>>>>>>>> FIN DE LA CORRECCIÓN <<<<<<<<<<<<<<<<<<<<<<<<<<< #
        # =========================================================================== #

    # Si no se aplicó suavizado, solo asignamos atributos
    return filtered_product.assign_attrs(PRODUCT_CONFIG[product_key])