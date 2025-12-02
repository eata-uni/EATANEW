
// Funciones para manejar los eventos del mapa

function setupClickEvents(locations) {
    const { mapView, graphicsLayer } = window.mapInit.getMapComponents();
    
    // Configurar evento de clic
    mapView.on("click", function(event) {
      // Realizar hitTest para ver si se hizo clic en un marcador o polígono
      mapView.hitTest(event).then(function(response) {
        // Verificar si se hizo clic en un marcador o polígono
        const hit = response.results?.find(function(result) {
          return result.graphic && 
                 result.graphic.layer === graphicsLayer &&
                 result.graphic.attributes;
        });
        
        if (hit) {
          const selectedId = hit.graphic.attributes.id;
          const location = locations.find(function(loc) { 
            return loc.id === selectedId; 
          });
          
          if (location) {
            window.mapGraphics.highlightLocation(location);
          }
        } else {
          // Si se hizo clic fuera de un marcador, limpiar selección y cerrar sidebar
          window.mapGraphics.clearSelection();
          document.getElementById("sidebar").classList.remove("open");
        }
      });
    });
  }
  
  // Exportar funciones
  window.mapEvents = {
    setupClickEvents
  };