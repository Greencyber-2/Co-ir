document.addEventListener('DOMContentLoaded', () => {
  // Map initialization
  const map = L.map('map', {
    center: [33.8973, 48.7543],
    zoom: 14,
    minZoom: 12,
    maxZoom: 18,
    zoomControl: false,
    maxBounds: [[33.75, 48.60], [34.00, 48.90]],
    maxBoundsViscosity: 0.5
  });

  // State variables
  let userLocation = null;
  let userMarker = null;
  let currentTheme = localStorage.getItem('theme') || 'light';
  let isInBorujerd = false;
  let selectedHospital = null;
  let routingControl = null;
  let currentTransportMode = 'walk';
  let notificationTimeout;
  let routeLine = null;

  // DOM Elements
  const elements = {
    hospitalPanel: document.getElementById('hospital-panel'),
    routePanel: document.getElementById('route-panel'),
    nearbyPanel: document.getElementById('nearby-panel'),
    menuPanel: document.getElementById('menu-panel'),
    searchContainer: document.getElementById('search-container'),
    notification: document.getElementById('notification'),
    loadingOverlay: document.getElementById('loading-overlay'),
    btnSearch: document.getElementById('btn-search'),
    btnNearby: document.getElementById('btn-nearby'),
    btnMenu: document.getElementById('btn-menu'),
    btnSearchSubmit: document.getElementById('btn-search-submit'),
    btnSearchClose: document.getElementById('btn-search-close'),
    darkModeToggle: document.getElementById('dark-mode-toggle'),
    btnCallHospital: document.getElementById('btn-call-hospital'),
    btnShowRoute: document.getElementById('btn-show-route'),
    btnMenuLocate: document.getElementById('menu-locate'),
    btnMenuDarkmode: document.getElementById('menu-darkmode'),
    searchInput: document.getElementById('search-input'),
    fabLocate: document.getElementById('fab-locate'),
    fabIcon: document.getElementById('fab-icon'),
    floatingControls: document.getElementById('floating-controls'),
    locateUserBtn: document.getElementById('locate-user-btn'),
    showNearbyBtn: document.getElementById('show-nearby-btn'),
    toggleThemeBtn: document.getElementById('toggle-theme-btn'),
    themeIcon: document.getElementById('theme-icon')
  };

  // Custom Icons
  const icons = {
    hospital: L.icon({
      iconUrl: 'assets/img/icons/hospital.png',
      iconSize: [42, 42],
      iconAnchor: [21, 42],
      popupAnchor: [0, -42],
      className: 'hospital-marker'
    }),
    user: L.icon({
      iconUrl: 'assets/img/icons/user.png',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
      className: 'user-marker'
    })
  };

  // Hospital Data
  const hospitals = [
    {
      id: 1,
      name: "بیمارستان شهید چمران",
      coords: [33.89684661387162, 48.74189615249634],
      address: "بروجرد، بلوار دکتر نصراللهی، بین میدان زینب کبری و شهید رجایی",
      phone: "066-43210000",
      type: "عمومی",
      emergency: true,
      specialties: ["اورژانس", "اطفال", "زنان", "جراحی", "داخلی", "ارتوپدی", "اورولوژی"],
      photo: "assets/img/hospitals/chamran.jpg",
      description: "بیمارستان شهید چمران یکی از بیمارستان‌های اصلی شهر بروجرد است که خدمات درمانی عمومی ارائه می‌دهد."
    },
    // ... سایر بیمارستان‌ها ...
  ];

  const hospitalMarkers = {};

  // Utility Functions
  const utils = {
    showNotification: (message, duration = 3000, type = 'info') => {
      clearTimeout(notificationTimeout);
      
      elements.notification.classList.remove('show');
      elements.notification.classList.add('hide');
      
      setTimeout(() => {
        const notificationMessage = document.getElementById('notification-message');
        const notificationIcon = document.getElementById('notification-icon');
        
        notificationMessage.textContent = message;
        notificationIcon.className = `notification-icon fas ${
          type === 'error' ? 'fa-exclamation-circle' : 
          type === 'success' ? 'fa-check-circle' : 'fa-info-circle'
        }`;
        
        elements.notification.className = `notification ${type}`;
        elements.notification.classList.remove('hide');
        elements.notification.classList.add('show');
        
        notificationTimeout = setTimeout(() => {
          elements.notification.classList.remove('show');
          elements.notification.classList.add('hide');
        }, duration);
      }, 300);
    },

    toggleLoading: (show) => {
      elements.loadingOverlay.classList.toggle('active', show);
    },

    checkIfInBorujerd: (lat, lng) => {
      const borujerdBounds = {
        north: 34.00,
        south: 33.75,
        west: 48.60,
        east: 48.90
      };
      
      return (
        lat >= borujerdBounds.south &&
        lat <= borujerdBounds.north &&
        lng >= borujerdBounds.west &&
        lng <= borujerdBounds.east
      );
    },

    getDistance: (lat1, lon1, lat2, lon2) => {
      const R = 6371e3;
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
  };

  // Map Functions
  const mapFunctions = {
    loadMapLayer: () => {
      map.eachLayer(layer => {
        if (layer instanceof L.TileLayer) {
          map.removeLayer(layer);
        }
      });

      const tileLayerUrl = currentTheme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileLayerUrl, {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      if (!map._zoomControl) {
        map._zoomControl = L.control.zoom({
          position: 'bottomright'
        }).addTo(map);
      }
    },

    toggleDarkMode: () => {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', currentTheme);
      localStorage.setItem('theme', currentTheme);
      mapFunctions.loadMapLayer();
      mapFunctions.updateMarkersStyle();
      elements.themeIcon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    },

    updateMarkersStyle: () => {
      Object.values(hospitalMarkers).forEach(marker => {
        if (marker.isPopupOpen()) {
          const popup = marker.getPopup();
          popup.setContent(mapFunctions.createPopupContent(marker.hospital));
          marker.openPopup();
        }
      });
      
      if (userMarker && userMarker.isPopupOpen()) {
        userMarker.openPopup();
      }
    },

    createPopupContent: (hospital) => {
      const emergencyBadge = hospital.emergency 
        ? `<span class="emergency-badge"><i class="fas fa-ambulance"></i> اورژانس</span>`
        : '';
      
      return `
        <div class="popup-content">
          <div class="popup-header">
            <h4>${hospital.name}</h4>
            ${emergencyBadge}
          </div>
          <div class="popup-body">
            <p><i class="fas fa-hospital"></i> ${hospital.type}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
            <div class="popup-actions">
              <button class="popup-btn details-btn" data-id="${hospital.id}" data-action="details">
                <i class="fas fa-info-circle"></i> جزئیات
              </button>
              <button class="popup-btn route-btn" data-id="${hospital.id}" data-action="route">
                <i class="fas fa-route"></i> مسیر
              </button>
            </div>
          </div>
        </div>
      `;
    },

    locateUser: (showNearby = false) => {
      if (navigator.geolocation) {
        utils.showNotification('در حال دریافت موقعیت شما...');
        utils.toggleLoading(true);
        
        navigator.geolocation.getCurrentPosition(
          position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            isInBorujerd = utils.checkIfInBorujerd(lat, lng);
            
            if (!isInBorujerd) {
              utils.showNotification('شما در محدوده بروجرد نیستید', 3000, 'error');
              utils.toggleLoading(false);
              return;
            }
            
            userLocation = { lat, lng };
            
            if (userMarker) {
              map.removeLayer(userMarker);
            }
            
            userMarker = L.marker([lat, lng], { 
              icon: icons.user,
              zIndexOffset: 1000
            }).addTo(map);
            
            userMarker.bindPopup('شما اینجا هستید', {
              className: 'user-popup',
              closeButton: false
            }).openPopup();
            
            map.setView([lat, lng], 15);
            utils.showNotification('موقعیت شما با موفقیت مشخص شد', 3000, 'success');
            utils.toggleLoading(false);
            
            if (showNearby) {
              appFunctions.showNearbyHospitals();
            }
          },
          error => {
            console.error('خطا در دریافت موقعیت:', error);
            utils.showNotification('خطا در دریافت موقعیت مکانی', 3000, 'error');
            utils.toggleLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        utils.showNotification('مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند', 3000, 'error');
      }
    },

    drawRoute: (start, end, mode = 'walk') => {
      // Remove previous route if exists
      if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
      }
      
      if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
      }
      
      // Create routing control
      routingControl = L.Routing.control({
        waypoints: [
          L.latLng(start.lat, start.lng),
          L.latLng(end[0], end[1])
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        lineOptions: {
          styles: [{ 
            color: currentTheme === 'dark' ? '#3b82f6' : '#2563eb', 
            opacity: 0.8, 
            weight: 6 
          }]
        },
        createMarker: function(i, waypoint, n) {
          // Create custom markers for start and end points
          if (i === 0) {
            return L.marker(waypoint.latLng, {
              icon: icons.user,
              zIndexOffset: 1000
            }).bindPopup('موقعیت شما', {closeButton: false});
          } else {
            return L.marker(waypoint.latLng, {
              icon: icons.hospital,
              zIndexOffset: 1000
            }).bindPopup(selectedHospital.name, {closeButton: false});
          }
        },
        collapsible: false,
        router: new L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: mode === 'walk' ? 'foot' : (mode === 'bike' ? 'bike' : 'car')
        })
      }).addTo(map);
      
      routingControl.on('routesfound', function(e) {
        const routes = e.routes;
        const summary = routes[0].summary;
        const distance = (summary.totalDistance / 1000).toFixed(2);
        const time = (summary.totalTime / 60).toFixed(0);
        
        document.getElementById('route-distance').textContent = `${distance} کیلومتر`;
        document.getElementById('route-time').textContent = `${time} دقیقه`;
        
        const instructionsContainer = document.getElementById('route-instructions');
        instructionsContainer.innerHTML = '';
        
        // Add summary instruction
        const summaryItem = document.createElement('div');
        summaryItem.className = 'route-instruction-item summary';
        summaryItem.innerHTML = `
          <i class="fas fa-info-circle"></i>
          <span>مسیر پیشنهادی از موقعیت فعلی شما به ${selectedHospital.name}</span>
        `;
        instructionsContainer.appendChild(summaryItem);
        
        // Add start point
        const startItem = document.createElement('div');
        startItem.className = 'route-instruction-item start';
        startItem.innerHTML = `
          <i class="fas fa-map-marker-alt"></i>
          <span>موقعیت فعلی شما</span>
        `;
        instructionsContainer.appendChild(startItem);
        
        // Add route instructions
        routes[0].instructions.slice(0, 8).forEach((instruction, index) => {
          const instructionItem = document.createElement('div');
          instructionItem.className = 'route-instruction-item';
          
          const icon = document.createElement('i');
          icon.className = 'route-instruction-icon';
          
          if (instruction.type.includes('Left')) {
            icon.className += ' fas fa-arrow-left';
          } else if (instruction.type.includes('Right')) {
            icon.className += ' fas fa-arrow-right';
          } else if (instruction.type.includes('Straight')) {
            icon.className += ' fas fa-arrow-up';
          } else if (instruction.type.includes('Continue')) {
            icon.className += ' fas fa-arrow-up';
          } else {
            icon.className += ' fas fa-arrow-up';
          }
          
          const text = document.createElement('span');
          text.textContent = instruction.text;
          
          instructionItem.appendChild(icon);
          instructionItem.appendChild(text);
          instructionsContainer.appendChild(instructionItem);
        });
        
        // Add end point
        const endItem = document.createElement('div');
        endItem.className = 'route-instruction-item end';
        endItem.innerHTML = `
          <i class="fas fa-flag-checkered"></i>
          <span>${selectedHospital.name}</span>
        `;
        instructionsContainer.appendChild(endItem);
        
        // Draw route line on map
        const route = routes[0];
        const routeCoordinates = route.coordinates;
        routeLine = L.polyline(routeCoordinates, {
          color: currentTheme === 'dark' ? '#3b82f6' : '#2563eb',
          weight: 6,
          opacity: 0.8,
          smoothFactor: 1
        }).addTo(map);
        
        // Fit map to show the entire route
        map.fitBounds(routeLine.getBounds(), {
          padding: [50, 50],
          maxZoom: 16
        });
      });
      
      routingControl.on('routingerror', function(e) {
        console.error('خطا در مسیریابی:', e.error);
        utils.showNotification('خطا در محاسبه مسیر', 3000, 'error');
      });
    }
  };

  // Application Functions
  const appFunctions = {
    showNearbyHospitals: () => {
      if (!userLocation || !isInBorujerd) {
        mapFunctions.locateUser(true);
        return;
      }
      
      const sortedHospitals = [...hospitals].sort((a, b) => {
        const distA = utils.getDistance(userLocation.lat, userLocation.lng, a.coords[0], a.coords[1]);
        const distB = utils.getDistance(userLocation.lat, userLocation.lng, b.coords[0], b.coords[1]);
        return distA - distB;
      });
      
      const nearestHospitals = sortedHospitals.slice(0, 5);
      const nearbyList = document.getElementById('nearby-list');
      nearbyList.innerHTML = '';
      
      if (nearestHospitals.length === 0) {
        nearbyList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-hospital"></i>
            <p>بیمارستانی در نزدیکی شما یافت نشد</p>
          </div>
        `;
        return;
      }
      
      nearestHospitals.forEach(hospital => {
        const distance = utils.getDistance(
          userLocation.lat, 
          userLocation.lng,
          hospital.coords[0],
          hospital.coords[1]
        ) / 1000;
        
        const time = (distance * 12).toFixed(0); // Estimated time in minutes
        
        const emergencyBadge = hospital.emergency 
          ? `<span class="badge-emergency"><i class="fas fa-ambulance"></i> اورژانس</span>`
          : '';
        
        const item = document.createElement('li');
        item.className = 'nearby-item';
        item.innerHTML = `
          <div class="nearby-item-header">
            <div class="hospital-info">
              <h4>${hospital.name}</h4>
              <span class="hospital-type">${hospital.type}</span>
            </div>
            ${emergencyBadge}
          </div>
          <div class="distance-time">
            <div class="distance">
              <i class="fas fa-ruler"></i> ${distance.toFixed(2)} کیلومتر
            </div>
            <div class="time">
              <i class="fas fa-clock"></i> حدود ${time} دقیقه
            </div>
          </div>
          <p class="hospital-address">${hospital.address}</p>
          <div class="nearby-actions">
            <button class="nearby-btn details-btn" data-id="${hospital.id}">
              <i class="fas fa-info-circle"></i> جزئیات
            </button>
            <button class="nearby-btn show-on-map-btn" data-id="${hospital.id}">
              <i class="fas fa-map-marker-alt"></i> نمایش روی نقشه
            </button>
          </div>
        `;
        
        nearbyList.appendChild(item);
      });
      
      nearbyList.querySelectorAll('.details-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const hospitalId = parseInt(btn.getAttribute('data-id'));
          appFunctions.showHospitalDetails(hospitalId);
        });
      });
      
      nearbyList.querySelectorAll('.show-on-map-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const hospitalId = parseInt(btn.getAttribute('data-id'));
          const hospital = hospitals.find(h => h.id === hospitalId);
          if (hospital) {
            map.setView(hospital.coords, 16);
            hospitalMarkers[hospitalId].openPopup();
            appFunctions.closeAllPanels();
          }
        });
      });
      
      appFunctions.closeAllPanels();
      elements.nearbyPanel.classList.add('open');
    },

    showHospitalDetails: (hospitalId) => {
      const hospital = hospitals.find(h => h.id === hospitalId);
      if (!hospital) return;
      
      selectedHospital = hospital;
      
      // Update hospital info
      document.getElementById('hospital-name').textContent = hospital.name;
      document.getElementById('hospital-address').textContent = hospital.address;
      document.getElementById('hospital-phone').textContent = hospital.phone;
      document.getElementById('hospital-description').textContent = hospital.description;
      
      // Update badges
      document.getElementById('hospital-type-badge').textContent = hospital.type;
      document.getElementById('hospital-emergency-badge').style.display = hospital.emergency ? 'flex' : 'none';
      
      // Update specialties list
      const specialtiesList = document.getElementById('specialties-list');
      specialtiesList.innerHTML = '';
      hospital.specialties.forEach(spec => {
        const li = document.createElement('li');
        li.textContent = spec;
        specialtiesList.appendChild(li);
      });
      
      // Handle hospital image with loading and error states
      const hospitalImage = document.getElementById('hospital-image');
      const imageContainer = document.querySelector('.hospital-image-container');
      
      // Clear previous content
      hospitalImage.innerHTML = '';
      hospitalImage.style.backgroundImage = 'none';
      
      // Add loading state
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'image-loading';
      loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      hospitalImage.appendChild(loadingDiv);
      
      // Create new image element to test loading
      const img = new Image();
      img.src = hospital.photo;
      
      img.onload = function() {
        // Image loaded successfully
        hospitalImage.innerHTML = '';
        hospitalImage.style.backgroundImage = `url('${hospital.photo}')`;
        hospitalImage.style.backgroundSize = 'cover';
        hospitalImage.style.backgroundPosition = 'center';
        hospitalImage.style.backgroundRepeat = 'no-repeat';
        
        // Add gradient overlay
        const overlay = document.createElement('div');
        overlay.className = 'image-overlay';
        hospitalImage.appendChild(overlay);
      };
      
      img.onerror = function() {
        // Image failed to load
        hospitalImage.innerHTML = `
          <div class="image-error">
            <i class="fas fa-image"></i>
            <p>تصویر بیمارستان در دسترس نیست</p>
          </div>
        `;
        hospitalImage.style.backgroundImage = 'linear-gradient(to bottom, var(--bg-tertiary), var(--bg-secondary))';
      };
      
      // Open panel and center map
      appFunctions.closeAllPanels();
      elements.hospitalPanel.classList.add('open');
      
      // Center the map on the hospital with proper padding
      map.setView(hospital.coords, 16, {
        animate: true,
        duration: 1,
        paddingTopLeft: [300, 0]
      });
      
      // Close any open popup for this hospital
      if (hospitalMarkers[hospital.id]) {
        hospitalMarkers[hospital.id].closePopup();
      }
    },

    showRoutePanel: (hospitalId) => {
      const hospital = hospitals.find(h => h.id === hospitalId);
      if (!hospital || !userLocation || !isInBorujerd) {
        utils.showNotification('لطفاً ابتدا موقعیت خود را مشخص کنید و مطمئن شوید در بروجرد هستید', 3000, 'error');
        return;
      }
      
      selectedHospital = hospital;
      
      mapFunctions.drawRoute(userLocation, hospital.coords, currentTransportMode);
      
      appFunctions.closeAllPanels();
      elements.routePanel.classList.add('open');
    },

    closeAllPanels: () => {
      elements.hospitalPanel.classList.remove('open');
      elements.routePanel.classList.remove('open');
      elements.nearbyPanel.classList.remove('open');
      elements.menuPanel.classList.remove('open');
      elements.searchContainer.classList.remove('active');
      
      if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
      }
      
      if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
      }
    },

    toggleSearch: () => {
      elements.searchContainer.classList.toggle('active');
      if (elements.searchContainer.classList.contains('active')) {
        elements.searchInput.focus();
      } else {
        elements.searchInput.value = '';
      }
    },

    searchHospitals: (query) => {
      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) return;

      const results = hospitals.filter(hospital => 
        hospital.name.toLowerCase().includes(normalizedQuery) ||
        hospital.specialties.some(spec => spec.toLowerCase().includes(normalizedQuery))
      );

      if (results.length === 0) {
        utils.showNotification('نتیجه‌ای یافت نشد', 3000, 'error');
        return;
      }

      // Zoom to show all results
      const group = new L.featureGroup(
        results.map(hospital => hospitalMarkers[hospital.id])
      );
      map.fitBounds(group.getBounds(), { padding: [50, 50] });

      // Open popup for the first result and center it
      if (results.length > 0) {
        const firstResult = results[0];
        map.setView(firstResult.coords, 16);
        hospitalMarkers[firstResult.id].openPopup();
      }

      appFunctions.toggleSearch();
    },

    initFloatingControls: () => {
      // Toggle floating controls
      elements.fabLocate.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = elements.fabLocate.classList.toggle('active');
        elements.floatingControls.classList.toggle('active');
        
        // Change icon animation
        if (isActive) {
          elements.fabIcon.classList.remove('fa-bars');
          elements.fabIcon.classList.add('fa-times');
        } else {
          elements.fabIcon.classList.remove('fa-times');
          elements.fabIcon.classList.add('fa-bars');
        }
      });

      // Close when clicking outside
      document.addEventListener('click', (e) => {
        if (!elements.floatingControls.contains(e.target) && !elements.fabLocate.contains(e.target)) {
          appFunctions.closeFloatingControls();
        }
      });

      // Control buttons functionality
      elements.locateUserBtn.addEventListener('click', () => {
        mapFunctions.locateUser(false);
        appFunctions.closeFloatingControls();
      });

      elements.showNearbyBtn.addEventListener('click', () => {
        appFunctions.showNearbyHospitals();
        appFunctions.closeFloatingControls();
      });

      elements.toggleThemeBtn.addEventListener('click', () => {
        mapFunctions.toggleDarkMode();
        appFunctions.closeFloatingControls();
      });

      closeFloatingControls: () => {
        elements.floatingControls.classList.remove('active');
        elements.fabLocate.classList.remove('active');
        elements.fabIcon.classList.remove('fa-times');
        elements.fabIcon.classList.add('fa-bars');
      }
    }
  };

  // Initialize the application
  function init() {
    // Set initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    elements.darkModeToggle.checked = currentTheme === 'dark';
    
    // Load map layer
    mapFunctions.loadMapLayer();
    
    // Add hospital markers
    hospitals.forEach(hospital => {
      const marker = L.marker(hospital.coords, {
        icon: icons.hospital,
        riseOnHover: true,
        zIndexOffset: hospital.emergency ? 100 : 0
      }).addTo(map);
      
      marker.hospital = hospital;
      marker.bindPopup(mapFunctions.createPopupContent(hospital), {
        className: 'hospital-popup',
        closeButton: false,
        maxWidth: 300,
        minWidth: 250,
        autoPan: true,
        autoPanPadding: [50, 50],
        autoPanPaddingTopLeft: [50, 50],
        autoPanPaddingBottomRight: [50, 50]
      });

      marker.on('popupopen', () => {
        // Center the map on the marker with proper padding
        map.setView(marker.getLatLng(), map.getZoom(), {
          animate: true,
          paddingTopLeft: [300, 0]
        });

        document.querySelectorAll('.popup-btn[data-action="details"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const hospitalId = parseInt(btn.getAttribute('data-id'));
            appFunctions.showHospitalDetails(hospitalId);
            marker.closePopup();
          });
        });
        
        document.querySelectorAll('.popup-btn[data-action="route"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const hospitalId = parseInt(btn.getAttribute('data-id'));
            if (!userLocation) {
              mapFunctions.locateUser();
              setTimeout(() => {
                if (userLocation && isInBorujerd) {
                  appFunctions.showRoutePanel(hospitalId);
                }
              }, 1000);
            } else if (isInBorujerd) {
              appFunctions.showRoutePanel(hospitalId);
            }
            marker.closePopup();
          });
        });
      });
      
      hospitalMarkers[hospital.id] = marker;
    });
    
    // Event listeners
    elements.btnSearch.addEventListener('click', appFunctions.toggleSearch);
    elements.btnSearchClose.addEventListener('click', appFunctions.toggleSearch);
    elements.btnSearchSubmit.addEventListener('click', () => {
      appFunctions.searchHospitals(elements.searchInput.value);
    });
    
    elements.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        appFunctions.searchHospitals(elements.searchInput.value);
      }
    });
    
    elements.btnNearby.addEventListener('click', appFunctions.showNearbyHospitals);
    elements.btnMenu.addEventListener('click', () => {
      appFunctions.closeAllPanels();
      elements.menuPanel.classList.add('open');
    });
    
    elements.btnCallHospital.addEventListener('click', () => {
      if (selectedHospital) {
        window.open(`tel:${selectedHospital.phone}`);
      }
    });
    
    elements.btnShowRoute.addEventListener('click', () => {
      if (selectedHospital) {
        if (!userLocation) {
          mapFunctions.locateUser();
          setTimeout(() => {
            if (userLocation && isInBorujerd) {
              appFunctions.showRoutePanel(selectedHospital.id);
            }
          }, 1000);
        } else if (isInBorujerd) {
          appFunctions.showRoutePanel(selectedHospital.id);
        }
      }
    });
    
    elements.btnMenuLocate.addEventListener('click', () => {
      appFunctions.closeAllPanels();
      mapFunctions.locateUser(false);
    });
    
    elements.btnMenuDarkmode.addEventListener('click', () => {
      elements.darkModeToggle.checked = !elements.darkModeToggle.checked;
      mapFunctions.toggleDarkMode();
    });
    
    elements.darkModeToggle.addEventListener('change', mapFunctions.toggleDarkMode);
    
    document.querySelectorAll('.btn-back').forEach(btn => {
      btn.addEventListener('click', appFunctions.closeAllPanels);
    });
    
    // Transport mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTransportMode = btn.getAttribute('data-mode');
        if (selectedHospital) {
          appFunctions.showRoutePanel(selectedHospital.id);
        }
      });
    });
    
    // Initialize floating controls
    appFunctions.initFloatingControls();
    
    // Show welcome notification
    setTimeout(() => {
      utils.showNotification('به نقشه بیمارستان‌های بروجرد خوش آمدید', 3000, 'success');
    }, 1500);
  }

  // Start the application
  init();
});
