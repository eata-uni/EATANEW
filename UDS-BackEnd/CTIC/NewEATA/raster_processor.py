# ======================================================================
# raster_processor.py (VERSIÓN FINAL, SIMPLIFICADA Y CORRECTA)
# ======================================================================
import xarray as xr
import rioxarray
import os
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import numpy as np
import geopandas as gpd
def georeference_image(image_path, central_longitude, is_geocolor=False):
    """
    Función única y robusta para georreferenciar CUALQUIER imagen JPG de GOES.
    Maneja RGB (GeoColor) y Grayscale (Bandas).
    """
    image_data = plt.imread(image_path)
    height, width = image_data.shape[0], image_data.shape[1]

    # Si es una banda (no GeoColor) y es RGB, la convierte a Grayscale.
    if image_data.ndim == 3 and not is_geocolor:
        image_data = (0.21 * image_data[:,:,0] + 0.72 * image_data[:,:,1] + 0.07 * image_data[:,:,2])

    geos_proj = ccrs.Geostationary(
        central_longitude=central_longitude, satellite_height=35786023.0
    )
    x_coords = np.linspace(-5434894.88, 5434894.88, width)
    y_coords = np.linspace(5434894.88, -5434894.88, height)

    if image_data.ndim == 3: # GeoColor
        dims, coords = ("y", "x", "band"), {"y": y_coords, "x": x_coords, "band": [1, 2, 3]}
    else: # Bandas
        dims, coords = ("y", "x"), {"y": y_coords, "x": x_coords}

    raster = xr.DataArray(image_data, dims=dims, coords=coords)
    if 'band' in raster.dims:
        raster = raster.transpose('band', 'y', 'x')
    raster.rio.write_crs(geos_proj.proj4_init, inplace=True)
    return raster

def process_and_align_bands(band_files, master_grid, peru_unified_geometry, peru_crs):
    """
    Procesa, alinea y recorta todas las bandas a una grilla común.
    """
    print("\nProcesando, alineando y recortando bandas...")
    clipped_bands = {}
    
    # Reproyectar la forma de Perú a la proyección nativa de GOES para el recorte
    peru_shape_geos = gpd.GeoSeries([peru_unified_geometry], crs=peru_crs).to_crs(master_grid.rio.crs)

    for band_num, file_path in band_files.items():
        print(f"  - Procesando Banda {band_num:02d}...")
        
        # Georreferenciar la banda individualmente
        band_raster = georeference_image(file_path, master_grid.rio.crs.to_dict()['lon_0'])
        
        # Alinear la banda a la grilla del master (GeoColor)
        aligned_band = band_raster.rio.reproject_match(master_grid)
        
        # Recortar a Perú
        clipped = aligned_band.rio.clip(peru_shape_geos.geometry, drop=True)
        clipped_bands[band_num] = clipped
    
    return clipped_bands