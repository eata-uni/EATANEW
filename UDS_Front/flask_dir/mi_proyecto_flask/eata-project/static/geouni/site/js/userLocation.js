// -------------------------------
//  GEOLOCALIZACIÓN EN TIEMPO REAL
// -------------------------------

let watchId = null;

// Obtener y seguir la ubicación del usuario
function startTrackingUserLocation() {
  if (!navigator.geolocation) {
    alert('Tu navegador no soporta geolocalización');
    return;
  }

  // Iniciar seguimiento (watchPosition actualiza cada cambio)
  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      addUserLocationMarker(longitude, latitude);
      console.log(`Ubicación actual: ${latitude}, ${longitude}`);
    },
    (error) => {
      console.warn('Error al obtener ubicación:', error.message);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// Detener seguimiento
function stopTrackingUserLocation() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    console.log('Seguimiento de ubicación detenido');
  }
}

// Crear el marcador en el mapa
function addUserLocationMarker(longitude, latitude) {
  require([
    "esri/Graphic",
    "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol"
  ], function(Graphic, Point, SimpleMarkerSymbol) {
    const { mapView, graphicsLayer } = window.mapInit.getMapComponents();

    // Crear punto y símbolo
    const point = new Point({ longitude, latitude, spatialReference: { wkid: 4326 } });
    const markerSymbol = new SimpleMarkerSymbol({
      color: [0, 123, 255, 0.9], // Azul claro
      size: 12,
      outline: { color: [255, 255, 255], width: 2 }
    });

    // Borrar marcador anterior
    graphicsLayer.graphics
      .toArray()
      .filter(g => g.attributes?.type === "user-location")
      .forEach(g => graphicsLayer.remove(g));

    // Agregar marcador nuevo
    const userLocationGraphic = new Graphic({
      geometry: point,
      symbol: markerSymbol,
      attributes: { type: "user-location" }
    });
    graphicsLayer.add(userLocationGraphic);

    // Centrar mapa en el usuario (solo la primera vez)
    mapView.goTo(point, { duration: 500 });
  });
}

// Exportar funciones globales
window.userLocation = {
  startTrackingUserLocation,
  stopTrackingUserLocation
};
