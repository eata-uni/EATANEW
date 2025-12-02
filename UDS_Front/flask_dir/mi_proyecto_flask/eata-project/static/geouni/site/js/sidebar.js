// Funcionalidad del sidebar

// Elementos del DOM
const sidebar = document.getElementById("sidebar");
const closeButton = document.getElementById("closeButton");

// Determinar si estamos en un dispositivo móvil
const isMobileDevice = () => window.innerWidth <= 768;

// Función para mostrar información de la ubicación
function showLocationInfo(location) {
  // Crear contenido del sidebar con imagen en la parte superior, luego nombre y datos
  let imageHTML = location.imageUrl 
    ? `<img src="${location.imageUrl}" class="location-image" alt="${location.name}">`
    : '';
  
  // Crear pestañas tipo Google Chrome con mejor estilo
  const tabsHTML = `
    <div class="tabs-container">
      <div class="tabs-list">
        <button class="tab-button active" onclick="switchTab('general')">General</button>
        <button class="tab-button" onclick="switchTab('research')">Investigación</button>
        <button class="tab-button" onclick="switchTab('news')">Noticias</button>
        <button class="tab-button" onclick="switchTab('services')">Servicios</button>
      </div>
    </div>
  `;
  
  // Pestaña General
  let generalTabHTML = `
    <div id="general-tab" class="tab-content active">
      <div class="accordion-container">
        <div class="accordion-item">
          <div class="accordion-header" onclick="toggleAccordion(this)">
            <div class="accordion-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <span>Información</span>
            <div class="chevron">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          <div class="accordion-content">
            <p>${location.description}</p>
            ${location.link ? `<p><a href="${location.link}" target="_blank" class="link-button">Visitar sitio web</a></p>` : ''}
          </div>
        </div>`;
  
        // Sección de contacto
        let contactoHTML = '';
        if (location.contacto) {
          let contactoContent = '';
          for (const [key, value] of Object.entries(location.contacto)) {
            if (key === 'Facebook' || key === 'Twitter' || key === 'Instagram') {
              contactoContent += `<div class="detail-item"><span class="detail-label">${key}:</span><a href="${value}" target="_blank" class="social-link">${key}</a></div>`;
            } else if (key === 'Correo') {
              contactoContent += `<div class="detail-item"><span class="detail-label">${key}:</span><a href="mailto:${value}">${value}</a></div>`;
            } else {
              contactoContent += `<div class="detail-item"><span class="detail-label">${key}:</span><span>${value}</span></div>`;
            }
          }
          
          contactoHTML = `
            <div class="accordion-item">
              <div class="accordion-header" onclick="toggleAccordion(this)">
                <div class="accordion-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <span>Contacto</span>
                <div class="chevron">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              <div class="accordion-content">
                ${contactoContent}
              </div>
            </div>
          `;
        }
  
        // Sección para asociaciones estudiantiles
        let asociacionesHTML = '';
        if (location.asociasionesEstudiantiles && location.asociasionesEstudiantiles.length > 0) {
          let asociacionesContent = '<ul class="associations-list">';
          location.asociasionesEstudiantiles.forEach(asoc => {
            asociacionesContent += `
              <li class="association-item">
                <div class="association-name">${asoc.Nombre}</div>
                <a href="mailto:${asoc.Correo}" class="association-email">${asoc.Correo}</a>
              </li>
            `;
          });
          asociacionesContent += '</ul>';
          
          asociacionesHTML = `
            <div class="accordion-item">
              <div class="accordion-header" onclick="toggleAccordion(this)">
                <div class="accordion-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <span>Asociaciones Estudiantiles</span>
                <div class="chevron">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              <div class="accordion-content">
                ${asociacionesContent}
              </div>
            </div>
          `;
        }
  
        // Sección de clima
        let climaHTML = `
          <div class="accordion-item">
            <div class="accordion-header" onclick="toggleAccordion(this)">
              <div class="accordion-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M22 10a3 3 0 0 0-3-3h-2.207a5.502 5.502 0 0 0-10.702.5"/></svg>
              </div>
              <span>Clima</span>
              <div class="chevron">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
            <div class="accordion-content">
              <p>Temperatura: 23°C</p>
              <p>Humedad: 70%</p>
              <p>Viento: 10 km/h</p>
            </div>
          </div>
        `;
  
        // Sección de horarios
        let horariosHTML = `
          <div class="accordion-item">
            <div class="accordion-header" onclick="toggleAccordion(this)">
              <div class="accordion-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </div>
              <span>Horarios</span>
              <div class="chevron">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
            <div class="accordion-content">
              <p>Lunes a Viernes: 9:00 - 18:00</p>
              <p>Sábados: 10:00 - 14:00</p>
              <p>Domingos: Cerrado</p>
            </div>
          </div>
        `;

        generalTabHTML += contactoHTML + asociacionesHTML + climaHTML + horariosHTML;
        
        // Botón de indicaciones solo en pestaña General
        let directionsHTML = `
          <div class="how-to-get-title">Cómo llegar</div>
          <button class="directions-button" onclick="showDirections()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
            Mostrar indicaciones
          </button>
          <div id="routeInfo" style="display: none;"></div>
        `;
        
        generalTabHTML += `
          </div>
          ${directionsHTML}
        </div>
      `;
      
      // Otras pestañas
      const researchTabHTML = `
        <div id="research-tab" class="tab-content">
          <div class="accordion-container">
            <div class="accordion-item">
              <div class="accordion-header" onclick="toggleAccordion(this)">
                <div class="accordion-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0-6 0"></path><path d="M17.5 25.5a2.5 2.5 0 0 0 0-5a.5.5 0 0 0-.5-.5h-6a.5.5 0 0 0-.5.5a2.5 2.5 0 0 0 0 5a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5z"></path></svg>
                </div>
                <span>Laboratorios</span>
                <div class="chevron">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              <div class="accordion-content">
                <p>Laboratorio de Química Analítica</p>
                <p>Laboratorio de Física Aplicada</p>
                <p>Centro de Cómputo de Alto Rendimiento</p>
                <p>Laboratorio de Biotecnología</p>
              </div>
            </div>
            <div class="accordion-item">
              <div class="accordion-header" onclick="toggleAccordion(this)">
                <div class="accordion-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14,2 14,8 20,8"></polyline></svg>
                </div>
                <span>Proyectos de Investigación</span>
                <div class="chevron">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              <div class="accordion-content">
                <p>Proyecto de Energías Renovables</p>
                <p>Investigación en Inteligencia Artificial</p>
                <p>Desarrollo de Materiales Avanzados</p>
                <p>Estudios Ambientales Urbanos</p>
              </div>
            </div>
            <div class="accordion-item">
              <div class="accordion-header" onclick="toggleAccordion(this)">
                <div class="accordion-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <span>Grupos de Investigación</span>
                <div class="chevron">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              <div class="accordion-content">
                <p>Grupo de Investigación en Robótica</p>
                <p>Centro de Estudios Sociales</p>
                <p>Grupo de Investigación Médica</p>
                <p>Instituto de Desarrollo Tecnológico</p>
              </div>
            </div>
          </div>
        </div>
      `;
      
      const newsTabHTML = `
        <div id="news-tab" class="tab-content">
          <div class="accordion-container">
            <div class="accordion-item">
              <div class="accordion-header" onclick="toggleAccordion(this)">
                <div class="accordion-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path><path d="M18 14h-8"></path><path d="M15 18h-5"></path><path d="M10 6h8v4h-8V6Z"></path></svg>
                </div>
                <span>Noticias Recientes</span>
                <div class="chevron">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              <div class="accordion-content">
                <p><strong>Nueva Biblioteca Digital:</strong> Inauguración el próximo mes</p>
                <p><strong>Convenio Internacional:</strong> Acuerdo con Universidad de Cambridge</p>
                <p><strong>Premio Nacional:</strong> Estudiante gana concurso de innovación</p>
                <p><strong>Conferencia Magistral:</strong> "El Futuro de la Tecnología"</p>
              </div>
            </div>
            <div class="accordion-item">
              <div class="accordion-header" onclick="toggleAccordion(this)">
                <div class="accordion-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>
                </div>
                <span>Eventos Próximos</span>
                <div class="chevron">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              <div class="accordion-content">
                <p><strong>15 Enero:</strong> Semana de la Ciencia y Tecnología</p>
                <p><strong>22 Enero:</strong> Feria de Proyectos Estudiantiles</p>
                <p><strong>28 Enero:</strong> Congreso Internacional de Investigación</p>
                <p><strong>5 Febrero:</strong> Ceremonia de Graduación</p>
              </div>
            </div>
            <div class="accordion-item">
              <div class="accordion-header" onclick="toggleAccordion(this)">
                <div class="accordion-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9l4-6z"></path><path d="M11 3 8 9l4 13 4-13-3-6"></path><path d="M2 9h20"></path></svg>
                </div>
                <span>Actividades Culturales</span>
                <div class="chevron">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              <div class="accordion-content">
                <p>Festival de Música Universitaria</p>
                <p>Exposición de Arte Estudiantil</p>
                <p>Obra de Teatro: "Los Sueños"</p>
                <p>Taller de Fotografía Digital</p>
              </div>
            </div>
          </div>
        </div>
      `;
      
      const servicesTabHTML = `
        <div id="services-tab" class="tab-content">
          <div class="accordion-container">
            <div class="accordion-item">
              <div class="accordion-header" onclick="toggleAccordion(this)">
                <div class="accordion-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>
                </div>
                <span>Trámites Académicos</span>
                <div class="chevron">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              <div class="accordion-content">
                <p>Certificados de Estudios</p>
                <p>Constancia de Matrícula</p>
                <p>Solicitud de Grado</p>
                <p>Traslados y Convalidaciones</p>
              </div>
            </div>
            <div class="accordion-item">
              <div class="accordion-header" onclick="toggleAccordion(this)">
                <div class="accordion-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <span>Servicios Estudiantiles</span>
                <div class="chevron">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              <div class="accordion-content">
                <p>Bienestar Estudiantil</p>
                <p>Becas y Financiamiento</p>
                <p>Orientación Psicológica</p>
                <p>Servicio Médico</p>
              </div>
            </div>
            <div class="accordion-item">
              <div class="accordion-header" onclick="toggleAccordion(this)">
                <div class="accordion-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20"></path></svg>
                </div>
                <span>Servicios Digitales</span>
                <div class="chevron">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              <div class="accordion-content">
                <p>Campus Virtual</p>
                <p>Biblioteca Digital</p>
                <p>WiFi Gratuito</p>
                <p>Plataforma de Videoconferencias</p>
              </div>
            </div>
          </div>
        </div>
      `;

      // Unir todo el contenido
      const contentHTML = `
        ${imageHTML}
        <div class="location-details">
          <h3 class="location-name">${location.name}</h3>
          <p class="location-district">${location.district || ''}</p>
          
          ${tabsHTML}
          ${generalTabHTML}
          ${researchTabHTML}
          ${newsTabHTML}
          ${servicesTabHTML}
        </div>
      `;
  
  document.getElementById("location-info").innerHTML = contentHTML;
  sidebar.classList.add("open");
  
  // Asegurar que la pestaña general esté activa por defecto
  setTimeout(() => {
    switchTab('general');
  }, 100);
}

// Función para mostrar indicaciones
window.showDirections = async function() {
  const button = document.querySelector('.directions-button');
  const routeInfoDiv = document.getElementById('routeInfo');
  
  if (!window.selectedLocation) {
    console.error('No hay ubicación seleccionada');
    return;
  }
  
  button.textContent = 'Calculando ruta...';
  button.disabled = true;
  
  try {
    // Obtener ubicación del usuario
    if (!navigator.geolocation) {
      throw new Error('Tu navegador no soporta geolocalización.');
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userCoords = {
          longitude: position.coords.longitude,
          latitude: position.coords.latitude
        };
        
        const destinationCoords = {
          longitude: window.selectedLocation.center.longitude,
          latitude: window.selectedLocation.center.latitude
        };

        console.log('Coordenadas del usuario:', userCoords);
        console.log('Coordenadas del destino:', destinationCoords);
        
        try {
          // Obtener ruta usando el servicio de rutas
          const route = await window.routeService.getRoute(userCoords, destinationCoords);
          
          // Mostrar ruta en el mapa
          if (window.mapGraphics && window.mapGraphics.showRoute) {
            window.mapGraphics.showRoute(route.geometry);
          }
          
          // Formatear y mostrar información de la ruta
          const duration = window.routeService.formatDuration(route.duration);
          const distance = window.routeService.formatDistance(route.distance);
          
          routeInfoDiv.innerHTML = `
            <div class="route-info">
              <div class="route-duration">${duration}</div>
              <div class="route-distance">${distance}</div>
            </div>
          `;
          routeInfoDiv.style.display = 'block';
          
          // Iniciar seguimiento de ubicación con isla flotante
          window.routeService.startLocationTracking(destinationCoords);
          
          // Cambiar el botón para indicar que la ruta está activa
          button.textContent = 'Ruta activa';
          button.disabled = true;
          button.style.backgroundColor = '#34a853';
          
          // Cerrar sidebar en móvil para mejor visibilidad
          if (window.innerWidth <= 768) {
            sidebar.classList.remove("open");
            if (window.clearMapSelection) {
              // No limpiar la selección del mapa para mantener la ruta
            }
          }
        } catch (error) {
          console.error('Error detallado getting route:', error);
          
          
          if (error.message.includes('conexión')) {
            errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
          } else if (error.message.includes('API')) {
            errorMessage = 'Error en el servicio de rutas. Inténtalo más tarde.';
          } else if (error.message.includes('ruta válida')) {
            errorMessage = 'No se encontró una ruta para este destino.';
          }
          
          alert(errorMessage);
          button.textContent = 'Mostrar indicaciones';
          button.disabled = false;
          button.style.backgroundColor = '#1a73e8';
        }
      },
      (error) => {
        console.error('Error getting user location:', error);
        let errorMessage = 'No se pudo obtener tu ubicación actual.';
        
        switch(error.code) {
          case 1:
            errorMessage = 'Acceso a la ubicación denegado. Habilita los permisos de ubicación.';
            break;
          case 2:
            errorMessage = 'Ubicación no disponible en este momento.';
            break;
          case 3:
            errorMessage = 'Tiempo de espera agotado al obtener la ubicación.';
            break;
        }
        
        alert(errorMessage);
        button.textContent = 'Mostrar indicaciones';
        button.disabled = false;
        button.style.backgroundColor = '#1a73e8';
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  } catch (error) {
    console.error('Error general:', error);
    alert(error.message);
    button.textContent = 'Mostrar indicaciones';
    button.disabled = false;
    button.style.backgroundColor = '#1a73e8';
  }
};

// Controlador del botón cerrar - Siempre limpiar la selección visual para permitir reabrir sidebar
closeButton.addEventListener("click", function() {
  sidebar.classList.remove("open");
  
  // Siempre limpiar la selección visual del mapa para permitir volver a abrir la sidebar
  if (window.mapGraphics && window.mapGraphics.clearSelection) {
    window.mapGraphics.clearSelection();
  }
});

// Manejar el cambio de tamaño de la ventana
window.addEventListener('resize', function() {
  // Si el sidebar está visible, asegurarse de que los estilos sean correctos para el tipo de dispositivo
  if (sidebar.classList.contains("open")) {
    // No necesitamos hacer nada adicional, los estilos CSS se encargan automáticamente
  }
});

// Exponer funciones globalmente
window.sidebar = {
  showLocationInfo
};
