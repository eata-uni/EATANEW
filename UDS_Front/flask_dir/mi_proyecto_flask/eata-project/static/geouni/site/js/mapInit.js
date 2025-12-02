// Inicialización del mapa y variables globales
let mapView;
let graphicsLayer;
let maskLayer; // Variable global para la capa de máscara

function initializeMap(locationData) {
  require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/GraphicsLayer"
  ], function(Map, MapView, GraphicsLayer) {
    // 1. Crear capa de gráficos PRINCIPAL (para marcadores, rutas, etc.)
    graphicsLayer = new GraphicsLayer();
    
    // 2. Crear capa de máscara (se agregará después, pero en orden inferior)
    maskLayer = new GraphicsLayer();
    
    // Crear el mapa con fondo satelital y las capas en orden correcto
    const map = new Map({
      basemap: "hybrid",
      layers: [maskLayer, graphicsLayer] // Máscara ABAJO, gráficos ARRIBA
    });
    
    // Crear la vista del mapa
    mapView = new MapView({
      container: "mapDiv",
      map: map,
      center: [-77.048371, -12.021060],
      zoom: 17,
      rotation: -90,
      minZoom: 20,
    });

    const userBtn = document.createElement("button");
    userBtn.className = "esri-widget esri-widget--button";
    userBtn.style.padding = "8px";
    userBtn.title = "Mi ubicación";
    userBtn.textContent = "📍";

    userBtn.addEventListener("click", () => {
      if (!window.userLocation) return;
      // toggle simple: si quieres toggle real, guarda un flag como en la opción A
      window.userLocation.startTrackingUserLocation();
    });

    mapView.ui.add(userBtn, "top-right");
    // Cuando se carga completamente la vista:
    mapView.when(() => {
      // Añadir marcadores y polígonos de ubicaciones
      addLocationGraphics(locationData);
      
      // Configurar el evento click
      setupClickEvents(locationData);

      // Añadir la máscara al mapa (se agregará a maskLayer que está debajo)
      addMapMask(map);
      
      applyViewLimits();
    });
  });
}


// Limitar la vista a un polígono específico (WKT dado)
function applyViewLimits() {
  require([
    "esri/geometry/Polygon"
  ], function(Polygon) {
    // Anillo del polígono (cerrado: primer y último punto iguales)
    const rings = [
      [-77.0466, -12.0264],
      [-77.0446, -12.0246],
      [-77.0489, -12.0099],
      [-77.0540, -12.0104],
      [-77.0509, -12.0230],
      [-77.0466, -12.0264] // cierre
    ];

    const limitPolygon = new Polygon({
      rings: [rings],
      spatialReference: { wkid: 4326 } // lon/lat
    });

    // 1) Forzar que la vista inicie encuadrada al polígono
    mapView.goTo(limitPolygon.extent).catch(() => {});

    // 2) Limitar la navegación (pan/zoom) al polígono
    mapView.constraints = {
      // Conserva lo que ya tengas (minZoom, etc.)
      minZoom: mapView.constraints?.minZoom ??  mapView?.minZoom ?? 20,
      maxZoom: mapView.constraints?.maxZoom,
      rotationEnabled: mapView.constraints?.rotationEnabled ?? false, // opcional
      snapToZoom: mapView.constraints?.snapToZoom ?? true,            // opcional
      geometry: limitPolygon
    };
  });
}

// Añadir la máscara al mapa (modificado para usar la capa global maskLayer)
function addMapMask(map) {
  require([
    "esri/Graphic",
    "esri/geometry/Polygon",
    "esri/symbols/SimpleFillSymbol"
  ], function(Graphic, Polygon, SimpleFillSymbol) {
    // Obtener datos de la máscara desde el archivo JSON
    fetch('data/polygonmask.json')
      .then(response => response.json())
      .then(data => {
        // Crear el polígono de máscara
        const maskPolygon = new Polygon({
          rings: [
            data.coordinates,
            data.worldmask
          ],
          spatialReference: { wkid: 4326 }
        });
        
        // Definir el símbolo de la máscara (área oscura)
        const maskSymbol = new SimpleFillSymbol({
          color: [0, 0, 0, 0.8],
          outline: null
        });
        
        // Crear el gráfico de la máscara
        const maskGraphic = new Graphic({
          geometry: maskPolygon,
          symbol: maskSymbol
        });
        
        // Añadir la máscara a la capa global maskLayer
        maskLayer.add(maskGraphic);
      })
      .catch(error => console.error('Error cargando la máscara:', error));
  });
}

// Función para exportar mapView y graphicsLayer
function getMapComponents() {
  return { mapView, graphicsLayer };
}

// Exportar las funciones
window.mapInit = {
  initializeMap,
  getMapComponents
};