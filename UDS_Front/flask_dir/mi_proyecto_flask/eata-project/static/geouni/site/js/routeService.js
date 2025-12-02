class RouteService {
  constructor() {
    // ❌ NO hardcodees la key aquí
    // this.apiKey = '5b3ce3597851110001cf6248...';

    // ✅ lee la variable global inyectada por Flask
    this.apiKey = window.__ORS_API_KEY || "";
    if (!this.apiKey) {
      console.warn("⚠️ Falta ORS_API_KEY (revisa key.json y la inyección en geouni.html).");
    }

    this.baseUrl = 'https://api.openrouteservice.org/v2';
    this.watchId = null;
    this.currentDestination = null;
    this.isTracking = false;
    this.currentRouteGraphic = null;
    this.lastValidLocation = null;
    this.locationValidationDistance = 1000;

    this.CAMPUS_RINGS = [
      [-77.0466, -12.0264],
      [-77.0446, -12.0246],
      [-77.0489, -12.0099],
      [-77.0540, -12.0104],
      [-77.0509, -12.0230],
      [-77.0466, -12.0264]
    ];
  }

  // Método para mostrar mensaje flotante
  showFloatingMessage(message, type = 'warning') {
    // Eliminar mensaje existente si hay uno
    this.hideFloatingMessage();
    
    const messageElement = document.createElement('div');
    messageElement.id = 'floatingMessage';
    messageElement.className = `floating-message floating-message-${type}`;
    messageElement.innerHTML = `
      <div class="floating-message-content">
        <span class="floating-message-text">${message}</span>
        <button class="floating-message-close" onclick="window.routeService.hideFloatingMessage()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(messageElement);
    
    // Mostrar con animación
    setTimeout(() => {
      messageElement.classList.add('show');
    }, 10);
    
    // Auto-ocultar después de 5 segundos
    this.floatingMessageTimeout = setTimeout(() => {
      this.hideFloatingMessage();
    }, 5000);
  }

  // Método para ocultar mensaje flotante
  hideFloatingMessage() {
    const existingMessage = document.getElementById('floatingMessage');
    if (existingMessage) {
      existingMessage.classList.remove('show');
      setTimeout(() => {
        if (existingMessage.parentNode) {
          existingMessage.parentNode.removeChild(existingMessage);
        }
      }, 300);
    }
    
    if (this.floatingMessageTimeout) {
      clearTimeout(this.floatingMessageTimeout);
      this.floatingMessageTimeout = null;
    }
  }

  isInsideCampus(lon, lat) {
    return this.pointInPolygon(lon, lat, this.CAMPUS_RINGS);
  }

  pointInPolygon(lon, lat, rings) {
    let inside = false;
    for (let i = 0, j = rings.length - 1; i < rings.length; j = i++) {
      const xi = rings[i][0], yi = rings[i][1];
      const xj = rings[j][0], yj = rings[j][1];

      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lon < (xj - xi) * (lat - yi) / ((yj - yi) || 1e-12) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  clearRoutingStateAndUI() {
    if (this.currentRouteAbortController) {
      try { this.currentRouteAbortController.abort(); } catch(_) {}
      this.currentRouteAbortController = null;
    }

    if (window.mapGraphics && typeof window.mapGraphics.clearRoute === "function") {
      window.mapGraphics.clearRoute();
    }
    this.currentRouteGraphic = null;

    this.hideRouteFloatingIsland();
  }

  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      this.locationAttempts = 0;
      this.bestLocation = null;

      const attemptLocation = () => {
        this.locationAttempts++;
        
        const options = {
          enableHighAccuracy: true,
          timeout: 25000, // 25 segundos
          maximumAge: 0, // CERO - No usar caché, siempre obtener ubicación fresca
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: position.timestamp
            };
            
            console.log(`📍 Intento ${this.locationAttempts} - Precisión: ${coords.accuracy}m`, coords);

            // Estrategia: Guardar la mejor ubicación (menor accuracy)
            if (!this.bestLocation || coords.accuracy < this.bestLocation.accuracy) {
              this.bestLocation = coords;
            }

            // Si tenemos buena precisión (< 20m) o es el último intento, resolver
            if (coords.accuracy <= 20 || this.locationAttempts >= this.maxLocationAttempts) {
              const finalCoords = this.bestLocation;
              
              if (finalCoords.accuracy > 50) {
                console.warn('Precisión de ubicación moderada:', finalCoords.accuracy, 'metros');
                this.showFloatingMessage(`Precisión moderada (${Math.round(finalCoords.accuracy)}m). Mueve tu dispositivo para mejorarla.`, 'warning');
              }
              
              if (this.isLocationValid(finalCoords)) {
                resolve(finalCoords);
              } else {
                reject(new Error('Ubicación fuera del rango esperado'));
              }
            } else {
              // Intentar nuevamente con delay
              console.log(`🔄 Reintentando ubicación... (${this.locationAttempts}/${this.maxLocationAttempts})`);
              setTimeout(attemptLocation, 2000);
            }
          },
          (error) => {
            console.error(`Error en intento ${this.locationAttempts}:`, error);
            
            if (this.locationAttempts >= this.maxLocationAttempts) {
              if (this.bestLocation) {
                console.warn('Usando mejor ubicación disponible despite error');
                if (this.isLocationValid(this.bestLocation)) {
                  resolve(this.bestLocation);
                } else {
                  reject(new Error('Mejor ubicación fuera del rango esperado'));
                }
              } else {
                reject(error);
              }
            } else {
              setTimeout(attemptLocation, 2000);
            }
          },
          options
        );
      };

      // Iniciar primer intento
      attemptLocation();
    });
  }
async getPreciseLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      let bestAccuracy = Infinity;
      let bestCoords = null;
      let attempts = 0;
      const maxAttempts = 5;
      const maxTime = 15000; // 15 segundos máximo

      const options = {
        enableHighAccuracy: true,
        timeout: maxTime,
        maximumAge: 0
      };

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          attempts++;
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          console.log(`🎯 Afinando ubicación - Intento ${attempts}, Precisión: ${coords.accuracy}m`);

          // Actualizar mejor ubicación encontrada
          if (coords.accuracy < bestAccuracy) {
            bestAccuracy = coords.accuracy;
            bestCoords = coords;
          }

          // Condiciones para terminar:
          // 1. Precisión excelente (< 10m)
          // 2. Máximo de intentos alcanzado
          // 3. Tiempo máximo alcanzado (manejado por timeout)
          if (coords.accuracy <= 10 || attempts >= maxAttempts) {
            navigator.geolocation.clearWatch(watchId);
            
            if (bestCoords && this.isLocationValid(bestCoords)) {
              if (bestCoords.accuracy > 30) {
                this.showFloatingMessage(`Ubicación obtenida (${Math.round(bestCoords.accuracy)}m de precisión)`, 'warning');
              }
              resolve(bestCoords);
            } else {
              reject(new Error('No se pudo obtener una ubicación precisa'));
            }
          }
        },
        (error) => {
          navigator.geolocation.clearWatch(watchId);
          console.error('Error en geolocalización precisa:', error);
          
          if (bestCoords && this.isLocationValid(bestCoords)) {
            console.warn('Usando mejor ubicación disponible despite error');
            resolve(bestCoords);
          } else {
            reject(error);
          }
        },
        options
      );

      // Timeout de respaldo
      setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);
        if (bestCoords && this.isLocationValid(bestCoords)) {
          resolve(bestCoords);
        } else {
          reject(new Error('Timeout en obtención de ubicación precisa'));
        }
      }, maxTime);
    });
  }

  // Método principal mejorado que elige la estrategia
  async getEnhancedLocation(usePreciseMethod = true) {
    try {
      if (usePreciseMethod) {
        return await this.getPreciseLocation();
      } else {
        return await this.getCurrentLocation();
      }
    } catch (error) {
      console.error('Error en geolocalización mejorada:', error);
      
      // Fallback: intentar método simple
      if (usePreciseMethod) {
        console.log('🔄 Intentando método alternativo...');
        try {
          return await this.getCurrentLocation();
        } catch (fallbackError) {
          throw new Error(`No se pudo obtener ubicación: ${fallbackError.message}`);
        }
      }
      throw error;
    }
  }
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  async getRoute(startCoords, endCoords) {
    try {
      if (!this.isInsideCampus(startCoords.longitude, startCoords.latitude) ||
          !this.isInsideCampus(endCoords.longitude, endCoords.latitude)) {
        this.showFloatingMessage('Ubicación fuera del campus universitario', 'error');
        throw new Error('Ubicación fuera del campus universitario');
      }

      const url = `${this.baseUrl}/directions/foot-walking/geojson`;
      const requestBody = {
        coordinates: [
          [startCoords.longitude, startCoords.latitude],
          [endCoords.longitude, endCoords.latitude]
        ],
        format: 'geojson'
      };

      if (this.currentRouteAbortController) {
        try { this.currentRouteAbortController.abort(); } catch(_) {}
      }
      this.currentRouteAbortController = new AbortController();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: this.currentRouteAbortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Error en la respuesta: ${response.status}`);
      }

      const data = await response.json();
      if (!data.features || data.features.length === 0) {
        throw new Error('No se encontró una ruta entre los puntos seleccionados');
      }

      const route = data.features[0];
      return {
        geometry: route.geometry,
        duration: route.properties?.segments?.[0]?.duration || 0,
        distance: route.properties?.segments?.[0]?.distance || 0,
        instructions: route.properties?.segments?.[0]?.steps || []
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Solicitud de ruta cancelada');
      }
      console.error('Error al obtener la ruta:', error);
      throw new Error(`No se pudo calcular la ruta: ${error.message}`);
    } finally {
      this.currentRouteAbortController = null;
    }
  }

  startLocationTracking(destination) {
    this.currentDestination = destination;
    this.isTracking = true;
    
    if (!this.isInsideCampus(destination.longitude, destination.latitude)) {
      this.showFloatingMessage('El destino seleccionado no se encuentra dentro del campus universitario', 'error');
      this.stopLocationTracking();
      return;
    }
    
    this.showRouteFloatingIsland();
    
    if (navigator.geolocation) {
      const watchOptions = {
        enableHighAccuracy: true,
        timeout: 15000, // Reducido para tracking continuo
        maximumAge: 2000, // Muy bajo para tracking en tiempo real
        distanceFilter: 3 // Solo actualizar si se mueve más de 3 metros
      };

      this.watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const userCoords = {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            accuracy: position.coords.accuracy
          };

          // Filtrar por precisión - ignorar ubicaciones con baja precisión
          if (userCoords.accuracy > 50) {
            console.warn(`📍 Precisión baja en tracking: ${userCoords.accuracy}m - Ignorando actualización`);
            return;
          }

          if (this.isLocationValid(userCoords)) {
            this.lastValidLocation = userCoords;
            this.updateUserLocationMarker(userCoords);

            if (this.currentDestination) {
              await this.updateRoute(userCoords, this.currentDestination);
            }
          } else {
            console.log('Ubicación fuera del campus, deteniendo navegación');
            this.clearRoutingStateAndUI();
            this.stopLocationTracking();
            this.showFloatingMessage('Has salido del campus universitario. La navegación se ha detenido.', 'error');
          }
        },
        (error) => {
          console.error('Error en seguimiento de ubicación:', error);
          this.showFloatingMessage('Error al obtener la ubicación', 'error');
        },
        watchOptions
      );
    } else {
      console.error('Geolocalización no soportada por el navegador');
      this.showFloatingMessage('Tu navegador no soporta geolocalización', 'error');
    }
  }
isLocationValid(coords) {
    const peruBounds = { north: 0, south: -18.5, east: -68.5, west: -81.5 };
    const isInPeru = coords.latitude <= peruBounds.north &&
                    coords.latitude >= peruBounds.south &&
                    coords.longitude >= peruBounds.west &&
                    coords.longitude <= peruBounds.east;
    if (!isInPeru) {
      console.warn('Ubicación fuera de Perú:', coords);
      return false;
    }

    if (!this.isInsideCampus(coords.longitude, coords.latitude)) {
      this.showFloatingMessage('No te encuentras dentro de la universidad', 'error');
      return false;
    }

    // Validación mejorada de saltos de ubicación
    if (this.lastValidLocation) {
      const distance = this.calculateDistance(
        this.lastValidLocation.latitude,
        this.lastValidLocation.longitude,
        coords.latitude,
        coords.longitude
      );
      
      // Si el salto es muy grande y la precisión es mala, sospechar
      if (distance > this.locationValidationDistance && coords.accuracy > 30) {
        console.warn(`📍 Salto de ubicación sospechoso: ${Math.round(distance)}m con precisión ${coords.accuracy}m`);
        return false;
      }
    }
    return true;
  }
  stopLocationTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.currentDestination = null;
    this.isTracking = false;
    this.lastValidLocation = null;

    this.clearRoutingStateAndUI();

    const sidebar = document.getElementById('sidebar');
    const isSidebarOpen = sidebar && sidebar.classList.contains('open');
    if (!isSidebarOpen && window.mapGraphics && window.mapGraphics.clearSelection) {
      window.mapGraphics.clearSelection();
    }
  }

  async updateRoute(userCoords, destination) {
    if (!this.isTracking || !destination) return;

    try {
      if (!this.isInsideCampus(userCoords.longitude, userCoords.latitude)) {
        console.log('Usuario fuera del campus, cancelando actualización de ruta');
        return;
      }

      if (!this.isInsideCampus(destination.longitude, destination.latitude)) {
        console.log('Destino fuera del campus, cancelando navegación');
        this.clearRoutingStateAndUI();
        this.stopLocationTracking();
        this.showFloatingMessage('El destino ya no se encuentra dentro del campus universitario', 'error');
        return;
      }

      if (window.mapGraphics && typeof window.mapGraphics.clearRoute === "function") {
        window.mapGraphics.clearRoute();
      }

      const route = await this.getRoute(userCoords, destination);

      if (!this.isTracking) return;

      if (window.mapGraphics && typeof window.mapGraphics.showRoute === "function") {
        window.mapGraphics.showRoute(route.geometry);
      }
      this.updateRouteInfo(route);
    } catch (error) {
      console.error('Error actualizando la ruta:', error);
      if (error.message.includes('fuera del campus')) {
        this.clearRoutingStateAndUI();
        this.stopLocationTracking();
        this.showFloatingMessage('Ubicación fuera del campus universitario. La navegación se ha detenido.', 'error');
      }
    }
  }

  // Los métodos restantes permanecen igual...
  showRouteFloatingIsland() {
    this.hideRouteFloatingIsland();
    
    const floatingIsland = document.createElement('div');
    floatingIsland.id = 'routeFloatingIsland';
    floatingIsland.className = 'route-floating-island';
    floatingIsland.innerHTML = `
      <div class="route-info-content">
        <div class="route-stats">
          <div class="route-time">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            <span id="routeTime">Calculando...</span>
          </div>
          <div class="route-distance">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0-6 0"></path>
              <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"></path>
            </svg>
            <span id="routeDistance">Calculando...</span>
          </div>
        </div>
        <button id="stopRouteBtn" class="stop-route-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="6" width="12" height="12"></rect>
          </svg>
          Detener
        </button>
      </div>
    `;
    
    document.body.appendChild(floatingIsland);
    
    document.getElementById('stopRouteBtn').addEventListener('click', () => {
      this.stopLocationTracking();
    });
  }

  hideRouteFloatingIsland() {
    const existingIsland = document.getElementById('routeFloatingIsland');
    if (existingIsland) {
      existingIsland.remove();
    }
  }

  updateUserLocationMarker(userCoords) {
    if (window.userLocation && window.userLocation.addUserLocationMarker) {
      window.userLocation.addUserLocationMarker(userCoords.longitude, userCoords.latitude);
    }
  }

  updateRouteInfo(route) {
    const duration = this.formatDuration(route.duration);
    const distance = this.formatDistance(route.distance);
    
    const timeElement = document.getElementById('routeTime');
    const distanceElement = document.getElementById('routeDistance');
    
    if (timeElement) timeElement.textContent = duration;
    if (distanceElement) distanceElement.textContent = distance;
    
    const routeInfoElement = document.querySelector('.route-info');
    if (routeInfoElement) {
      routeInfoElement.innerHTML = `
        <div class="route-duration">${duration}</div>
        <div class="route-distance">${distance}</div>
      `;
    }
  }

  formatDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    }
  }

  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  }
  
async getBestPossibleLocation() {
    try {
      const location = await this.getEnhancedLocation(true);
      console.log(`✅ Ubicación final obtenida - Precisión: ${location.accuracy}m`);
      return location;
    } catch (error) {
      console.error('No se pudo obtener ubicación precisa:', error);
      throw error;
    }
  }
}

// Crear instancia global del servicio de rutas
window.routeService = new RouteService();