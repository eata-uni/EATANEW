// Funcionalidad del acordeón mejorada

function toggleAccordion(header) {
  console.log('toggleAccordion called', header); // Debug
  const content = header.nextElementSibling;
  const chevron = header.querySelector('.chevron');
  const isActive = header.classList.contains('active');
  
  console.log('Content element:', content); // Debug
  console.log('Chevron element:', chevron); // Debug
  console.log('Is active:', isActive); // Debug
  
  if (isActive) {
    // Cerrar acordeón
    header.classList.remove('active');
    if (chevron) chevron.classList.remove('rotated');
    if (content) content.style.maxHeight = '0px';
  } else {
    // Abrir acordeón
    header.classList.add('active');
    if (chevron) chevron.classList.add('rotated');
    
    // Calcular altura automáticamente
    if (content) {
      content.style.maxHeight = content.scrollHeight + 'px';
    }
  }
}

// Hacer la función global - asegurar que esté disponible
window.toggleAccordion = toggleAccordion;

// También agregarla al objeto global para mayor compatibilidad
if (typeof global !== 'undefined') {
  global.toggleAccordion = toggleAccordion;
}