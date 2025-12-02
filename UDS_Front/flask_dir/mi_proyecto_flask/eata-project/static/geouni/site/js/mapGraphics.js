let currentRouteGraphic = null;

// Funciones para manejar los gráficos en el mapa

function addLocationGraphics(locations) {
    require([
      "esri/Graphic",
      "esri/symbols/PictureMarkerSymbol",
      "esri/symbols/SimpleFillSymbol",
      "esri/PopupTemplate",
      "esri/geometry/Point",
      "esri/geometry/Polygon"
    ], function(
      Graphic,
      PictureMarkerSymbol,
      SimpleFillSymbol,
      PopupTemplate,
      Point,
      Polygon
    ) {
      // Obtener la referencia a GraphicsLayer
      const { graphicsLayer } = window.mapInit.getMapComponents();
      
      // Crear un símbolo de marcador con forma de gota
      const markerSymbol = new PictureMarkerSymbol({
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 48'%3E%3Cpath fill='%230072CE' d='M16,0C7.2,0,0,7.2,0,16c0,14.2,16,32,16,32s16-17.8,16-32C32,7.2,24.8,0,16,0z'/%3E%3Ccircle fill='%23FFFFFF' cx='16' cy='16' r='8'/%3E%3C/svg%3E",
        width: 16,
        height: 24,
        yoffset: 12,  // Desplazamiento para alinear el punto con la punta de la gota
      });
      
      // Recorrer todas las ubicaciones y añadir marcadores y polígonos
      locations.forEach(location => {
        // Crear geometría Point para el marcador central
        const point = new Point({
          longitude: location.center.longitude,
          latitude: location.center.latitude,
          spatialReference: location.center.spatialReference
        });
        
        // Crear marcador en el centro con icono en forma de gota
        const marker = new Graphic({
          geometry: point,
          symbol: markerSymbol,
          attributes: {
            id: location.id,
            name: location.name
          },
          popupTemplate: new PopupTemplate({
            title: "{name}",
            content: "Haz clic para ver más información"
          })
        });
        
        // Añadir el marcador a la capa gráfica
        graphicsLayer.add(marker);
        
        // Crear Polygon para el perímetro de la ubicación
        const polygon = new Polygon({
          rings: location.polygon.rings,
          spatialReference: location.polygon.spatialReference
        });
        
        // Añadir polígono para la ubicación con un relleno semitransparente
        const polygonGraphic = new Graphic({
          geometry: polygon,
          symbol: new SimpleFillSymbol({
            color: [0, 114, 206, 0.1],
            outline: {
              color: [0, 114, 206, 1],
              width: 1
            }
          }),
          attributes: {
            id: location.id,
            name: location.name,
            type: "perimeter"
          }
        });
        
        graphicsLayer.add(polygonGraphic);
    });
  });
}

// Función para mostrar ruta en el mapa
function showRoute(routeGeometry) {
  require([
    "esri/Graphic",
    "esri/geometry/Polyline",
    "esri/symbols/SimpleLineSymbol"
  ], function(Graphic, Polyline, SimpleLineSymbol) {
    const { graphicsLayer } = window.mapInit.getMapComponents();
    
    // Limpiar ruta anterior
    clearRoute();
    
    // Crear la geometría de la ruta
    const polyline = new Polyline({
      paths: routeGeometry.coordinates,
      spatialReference: { wkid: 4326 }
    });
    
    // Crear el símbolo de la línea de ruta
    const routeSymbol = new SimpleLineSymbol({
      color: [248, 243, 43, 0.8], // Azul Google
      width: 4,
      style: "solid"
    });
    
    // Crear el gráfico de la ruta
    currentRouteGraphic = new Graphic({
      geometry: polyline,
      symbol: routeSymbol,
      attributes: {
        type: "route"
      }
    });
    
    graphicsLayer.add(currentRouteGraphic);
  });
}

function clearRoute() {
  const { graphicsLayer } = window.mapInit.getMapComponents();
  
  if (currentRouteGraphic) {
    graphicsLayer.remove(currentRouteGraphic);
    currentRouteGraphic = null;
  }
  
  // Limpiar cualquier gráfico de ruta existente
  const graphics = graphicsLayer.graphics.toArray();
  graphics.forEach(function(graphic) {
    if (graphic.attributes?.type === "route") {
      graphicsLayer.remove(graphic);
    }
  });
}
  
  // Función para limpiar la selección
function clearSelection() {
  require([
    "esri/symbols/SimpleFillSymbol"
  ], function(SimpleFillSymbol) {
    const { graphicsLayer } = window.mapInit.getMapComponents();
    
    if (graphicsLayer) {
      const graphics = graphicsLayer.graphics.toArray();
      graphics.forEach(function(graphic) {
        if (graphic.attributes && graphic.attributes.type === "highlight") {
          graphicsLayer.remove(graphic);
        }
        
        if (graphic.attributes && graphic.attributes.type === "perimeter") {
          graphic.symbol = new SimpleFillSymbol({
            color: [0, 114, 206, 0.1],
            outline: {
              color: [0, 114, 206, 1],
              width: 1
            }
          });
        }
      });
    }
    
    // Solo limpiar ruta y selección global si NO hay seguimiento activo
    if (!window.routeService || !window.routeService.isTracking) {
      clearRoute();
      window.selectedLocation = null;
    }
  });
}
  
  // Función para resaltar la ubicación seleccionada
  function highlightLocation(location) {
    require([
      "esri/Graphic",
      "esri/geometry/Polygon",
      "esri/symbols/SimpleFillSymbol"
    ], function(Graphic, Polygon, SimpleFillSymbol) {
      const { graphicsLayer } = window.mapInit.getMapComponents();
      
      // Limpiar selección previa
      clearSelection();
      
      // Crear Polygon para el área resaltada
      const polygon = new Polygon({
        rings: location.polygon.rings,
        spatialReference: location.polygon.spatialReference
      });
      
      // Añadir polígono resaltado para la ubicación seleccionada
      const highlightPolygon = new Graphic({
        geometry: polygon,
        symbol: new SimpleFillSymbol({
          color: [0, 114, 206, 0.6],
          outline: {
            color: [0, 114, 206, 1],
            width: 2
          }
        }),
        attributes: {
          type: "highlight"
        }
      });
      
      graphicsLayer.add(highlightPolygon);
      window.selectedLocation = location;
      
      // Mostrar información de la ubicación en el sidebar
      showLocationInfo(location);
    });
  }
  
  // Exportar funciones
  window.mapGraphics = {
    addLocationGraphics,
    clearSelection,
    highlightLocation,
    showRoute,
    clearRoute
  };
  