// Funcionalidad para el panel de información de ruta

// Crear el elemento del panel de ruta
function createRoutePanel() {
    const panel = document.createElement('div');
    panel.id = 'routePanel';
    panel.className = 'route-panel';
    panel.style.display = 'none';
    
    panel.innerHTML = `
      <div class="route-info">
        <div class="route-duration">--</div>
        <div class="route-distance">--</div>
      </div>
      <button id="stopTrackingBtn" class="stop-tracking-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <rect x="6" y="6" width="12" height="12"></rect>
        </svg>
        Detener seguimiento
      </button>
    `;
    
    // Insertar el panel cerca del botón de búsqueda (ajusta según tu HTML)
    const searchContainer = document.getElementById('searchContainer') || document.body;
    searchContainer.appendChild(panel);
    
    // Configurar evento para el botón
    panel.querySelector('#stopTrackingBtn').addEventListener('click', () => {
      if (window.sidebar && window.sidebar.stopRouteTracking) {
        window.sidebar.stopRouteTracking();
      }
    });
    
    return panel;
  }
  
  // Mostrar información de ruta en el panel
  function updateRouteInfo(duration, distance) {
    let panel = document.getElementById('routePanel');
    if (!panel) {
      panel = createRoutePanel();
    }
    
    panel.style.display = 'block';
    panel.querySelector('.route-duration').textContent = duration;
    panel.querySelector('.route-distance').textContent = distance;
  }
  
  // Inicializar el panel al cargar la página
  document.addEventListener('DOMContentLoaded', createRoutePanel);
  
  // Exportar funciones
  window.routePanel = {
    updateRouteInfo
  };