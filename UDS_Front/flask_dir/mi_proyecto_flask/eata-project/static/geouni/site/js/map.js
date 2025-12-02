// Variable para almacenar datos de ubicaciones y selección actual
let limaLocations = [];
let selectedLocation = null;

// Cargar datos de ubicaciones y inicializar el mapa
fetch("/static/geouni/site/data/locations.json")
  .then(response => response.json())
  .then(data => {
    limaLocations = data;
    
    // Inicializar el mapa solo una vez
    window.mapInit.initializeMap(limaLocations);
    
    // Inicializar la búsqueda con las ubicaciones cargadas
    if (window.search && window.search.initSearch) {
      window.search.initSearch(limaLocations);    
    }
    
    // Inicializar el servicio de rutas antes de usarlo
    window.routeService = new RouteService();
    
    
    
  })
  .catch(error => console.error('Error loading locations data:', error));
  

// Función global para limpiar la selección del mapa
window.clearMapSelection = function() {
  if (window.mapGraphics && window.mapGraphics.clearSelection) {
    window.mapGraphics.clearSelection();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnUserLocation");
  if (btn && window.userLocation) {
    let tracking = false;

    btn.addEventListener("click", () => {
      tracking = !tracking;
      if (tracking) {
        window.userLocation.startTrackingUserLocation();
        btn.classList.add("active");
        btn.textContent = "📡";
        btn.title = "Dejar de seguir ubicación";
      } else {
        window.userLocation.stopTrackingUserLocation();
        btn.classList.remove("active");
        btn.textContent = "📍";
        btn.title = "Mostrar mi ubicación";
      }
    });
  }
});
// --- Polígono del campus (WGS84: lon, lat) ---
const CAMPUS_RINGS = [
  [-77.0466, -12.0264],
  [-77.0446, -12.0246],
  [-77.0489, -12.0099],
  [-77.0540, -12.0104],
  [-77.0509, -12.0230],
  [-77.0466, -12.0264] // cierre
];

// Helpers para validar ubicación dentro del polígono
function createCampusPolygon4326() {
  return new Promise((resolve) => {
    require(["esri/geometry/Polygon"], function(Polygon) {
      const poly = new Polygon({
        rings: [CAMPUS_RINGS],
        spatialReference: { wkid: 4326 }
      });
      resolve(poly);
    });
  });
}

function isPointInsideCampus(point) {
  return new Promise((resolve) => {
    require([
      "esri/geometry/geometryEngine",
      "esri/geometry/support/webMercatorUtils"
    ], function(geometryEngine, webMercatorUtils) {
      // Normaliza el punto a 4326
      let pt4326 = point;
      const wkid = point?.spatialReference?.wkid;
      if (wkid === 3857 || wkid === 102100) {
        pt4326 = webMercatorUtils.webMercatorToGeographic(point);
      }
      // El polígono ya está en 4326
      createCampusPolygon4326().then((campusPoly) => {
        const inside = geometryEngine.contains(campusPoly, pt4326);
        resolve(inside);
      });
    });
  });
}
