# ======================================================================
# product_calculator.py (VERSIÓN FINAL CON NORMALIZACIÓN AVANZADA)
# ======================================================================
import numpy as np
import xarray as xr
from scipy.ndimage import gaussian_filter

def _normalize_array(arr):
    """Función auxiliar para normalizar un array a 0-255 de forma segura."""
    min_val, max_val = np.nanmin(arr.values), np.nanmax(arr.values)
    if max_val == min_val:  # Evitar división por cero si el array es plano
        return xr.full_like(arr, 128) # Devolver un gris medio
    
    normalized = (arr - min_val) / (max_val - min_val) * 255
    return normalized

def calculate_all_products(clipped_bands):
    """
    Calcula pseudo-productos a partir de valores de píxel (0-255) con
    normalización avanzada específica por producto.
    """
    print("\nCalculando productos normalizados a partir de bandas...")
    results = {}
    
    # Usamos .copy() para evitar modificar los datos originales
    BT = {band: data.copy().astype(np.float32) for band, data in clipped_bands.items()}
    required_for_all = [7, 8, 9, 10, 14, 15]
    
    if not all(k in BT for k in required_for_all):
        print("  - ADVERTENCIA: Faltan bandas para calcular todos los productos.")
        return {}

    # --- 1. Cloud Top Height (ACHAF) ---
    cloud_height = (255 - BT[14]) * 1.2
    results['ACHAF'] = xr.DataArray(
        np.clip(cloud_height.values, 0, 255),
        coords=BT[14].coords, dims=BT[14].dims,
        attrs={
            'long_name': 'Índice de Altura de Nubes',
            'units': 'Altura Normalizada (0-255)',
            'interpretation': '0=Bajo, 255=Alto'
        }
    )
    
    # --- 2. Cloud Top Temperature (ACHTF) ---
    cloud_temp = 255 - BT[14]
    results['ACHTF'] = xr.DataArray(
        cloud_temp.values, coords=BT[14].coords, dims=BT[14].dims,
        attrs={
            'long_name': 'Índice de Temp. de Cima de Nube',
            'units': 'Temperatura Normalizada (0-255)',
            'interpretation': '255=Frío, 0=Caliente'
        }
    )
    
    # --- 3. Land Surface Temperature (LSTF) ---
    day_night_factor = np.abs(BT[14] - BT[15]) / 10.0
    lst = BT[14] - day_night_factor
    results['LSTF'] = _normalize_array(lst)
    results['LSTF'].attrs = {
        'long_name': 'Índice de Temp. Superficie Terrestre',
        'units': 'Temperatura Normalizada (0-255)',
        'interpretation': '255=Caliente, 0=Frío'
    }
    
    # --- 4. Rainfall Rate (RRQPEF) ---
    convective_mask = (BT[14] < 150) & (BT[7] - BT[14] > 15)
    rain_intensity = xr.zeros_like(BT[14])
    rain_intensity.values[convective_mask.values] = 20 * np.sqrt(150 - BT[14].values[convective_mask.values])
    results['RRQPEF'] = _normalize_array(rain_intensity)
    results['RRQPEF'].attrs = {
        'long_name': 'Índice de Tasa de Lluvia',
        'units': 'Intensidad Normalizada (0-255)',
        'interpretation': '0=Sin Lluvia, 255=Lluvia Fuerte'
    }
    
    # --- 5. Total Precipitable Water (TPWF) ---
    diff_8_9 = BT[8] - BT[9]
    diff_9_10 = BT[9] - BT[10]
    moisture_index = 128 + 1.2 * diff_8_9 - 1.5 * diff_9_10
    results['TPWF'] = xr.DataArray(
        np.clip(moisture_index.values, 0, 255),
        coords=BT[8].coords, dims=BT[8].dims,
        attrs={
            'long_name': 'Índice de Agua Precipitable Total',
            'units': 'Humedad Normalizada (0-255)',
            'interpretation': '0=Seco, 255=Húmedo'
        }
    )
    
    print("  - Aplicando suavizado gaussiano adaptativo...")
    for key in results:
        sigma = 1.0
        if key in ['RRQPEF', 'TPWF']: sigma = 1.5
        elif key == 'ACHAF': sigma = 0.8
        
        smoothed_data = gaussian_filter(results[key].values, sigma=sigma)
        results[key].values = np.clip(smoothed_data, 0, 255)

    return results