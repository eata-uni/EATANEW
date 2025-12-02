// Funcionalidad de las pestañas

function switchTab(tabName) {
  console.log('Switching to tab:', tabName); // Debug
  
  // Ocultar todos los contenidos de pestañas
  const tabContents = document.querySelectorAll('.tab-content');
  console.log('Found tab contents:', tabContents.length); // Debug
  tabContents.forEach(content => {
    content.classList.remove('active');
    content.style.display = 'none'; // Forzar ocultar
  });
  
  // Remover clase activa de todos los botones
  const tabButtons = document.querySelectorAll('.tab-button');
  console.log('Found tab buttons:', tabButtons.length); // Debug
  tabButtons.forEach(button => {
    button.classList.remove('active');
  });
  
  // Mostrar el contenido de la pestaña seleccionada
  const activeTabContent = document.getElementById(tabName + '-tab');
  console.log('Active tab content element:', activeTabContent); // Debug
  if (activeTabContent) {
    activeTabContent.classList.add('active');
    activeTabContent.style.display = 'block'; // Forzar mostrar
  }
  
  // Activar el botón de la pestaña seleccionada
  const activeTabButton = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
  console.log('Active tab button:', activeTabButton); // Debug
  if (activeTabButton) {
    activeTabButton.classList.add('active');
  }
}

// Hacer la función global - asegurar que esté disponible
window.switchTab = switchTab;

// También agregarla al objeto global para mayor compatibilidad
if (typeof global !== 'undefined') {
  global.switchTab = switchTab;
}