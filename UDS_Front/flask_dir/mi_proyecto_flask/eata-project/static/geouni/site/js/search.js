// Variables para acceder a los elementos del DOM
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const searchClearBtn = document.getElementById('searchClearBtn');

// Variable para almacenar las ubicaciones para la búsqueda
let searchLocations = [];

// Inicializar la funcionalidad de búsqueda
function initSearch(locations) {
  searchLocations = locations;

  // Configurar eventos para el campo de búsqueda
  searchInput.addEventListener('input', handleSearchInput);
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.length > 0) {
      showSearchResults();
    }
  });

    // Configurar botón de limpiar búsqueda
  searchClearBtn.addEventListener('click', clearSearch);

  // Cerrar los resultados cuando se hace clic afuera
  document.addEventListener('click', (event) => {
    if (event.target !== searchInput && event.target !== searchResults) {
      hideSearchResults();
    }
  });
}

// Función para verificar si alguna palabra en el texto comienza con el término
function matchesStartOfWord(text, term) {
  const words = text.toLowerCase().split(/\s+/);
  return words.some(word => word.startsWith(term));
}

// Manejar la entrada de texto en la búsqueda
function handleSearchInput() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  
  // Mostrar/ocultar botón de limpiar
  if (searchTerm.length > 0) {
    searchClearBtn.classList.add('show');
  } else {
    searchClearBtn.classList.remove('show');
  }

  if (searchTerm.length === 0) {
    hideSearchResults();
    return;
  }

  // Filtrar ubicaciones donde alguna palabra en name o district comienza con el término
  const filteredLocations = searchLocations.filter(location => {
    const name = location.name || '';
    const district = location.district || '';
    return matchesStartOfWord(name, searchTerm) || matchesStartOfWord(district, searchTerm);
  });

  renderSearchResults(filteredLocations);

  }

// Limpiar búsqueda
function clearSearch() {
  searchInput.value = '';
  searchClearBtn.classList.remove('show');
  hideSearchResults();
  
  // Limpiar selección del mapa si existe
  if (window.mapGraphics && window.mapGraphics.clearSelection) {
    window.mapGraphics.clearSelection();
  }
  
  // Cerrar sidebar si está abierto
  const sidebar = document.getElementById('sidebar');
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
  }
}

// Mostrar los resultados de búsqueda
function renderSearchResults(locations) {
  searchResults.innerHTML = '';

  if (locations.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'search-item';
    noResults.textContent = 'No se encontraron resultados';
    searchResults.appendChild(noResults);
  } else {
    locations.forEach(location => {
      const item = document.createElement('div');
      item.className = 'search-item';
      const name = location.name || 'Sin nombre';
      item.textContent = `${name}`;

      item.addEventListener('click', () => {
        selectLocation(location);
      });

      searchResults.appendChild(item);
    });
  }

  showSearchResults();
}

function showSearchResults() {
  searchResults.classList.add('active');
}

function hideSearchResults() {
  searchResults.classList.remove('active');
}

function selectLocation(location) {
  searchInput.value = location.name || '';
  hideSearchResults();

  if (window.mapGraphics && window.mapGraphics.highlightLocation) {
    window.mapGraphics.highlightLocation(location);
  }
}

window.search = {
  initSearch
};
