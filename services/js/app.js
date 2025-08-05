document.addEventListener('DOMContentLoaded', () => {
  // Initialize the application
  class HospitalMapApp {
    constructor() {
      // App state
      this.state = {
        map: null,
        userLocation: null,
        userMarker: null,
        currentTheme: 'light',
        isInBorujerd: false,
        selectedHospital: null,
        routingControl: null,
        currentTransportMode: 'walk',
        fabOpen: false,
        menuOpen: false,
        searchOpen: false,
        hospitals: [],
        hospitalMarkers: {},
        filteredHospitals: []
      };

      // DOM Elements
      this.elements = {
        mapContainer: document.getElementById('map'),
        hospitalPanel: document.getElementById('hospital-panel'),
        routePanel: document.getElementById('route-panel'),
        nearbyPanel: document.getElementById('nearby-panel'),
        notification: document.getElementById('notification'),
        loadingOverlay: document.getElementById('loading'),
        mainMenu: document.getElementById('main-menu'),
        menuOverlay: document.getElementById('menu-overlay'),
        menuClose: document.getElementById('menu-close'),
        searchBar: document.getElementById('search-bar'),
        searchInput: document.getElementById('search-input'),
        searchClose: document.getElementById('search-close'),
        searchResults: document.getElementById('search-results'),
        resultsList: document.getElementById('results-list'),
        closeResults: document.getElementById('btn-close-results'),
        darkModeToggle: document.getElementById('dark-mode-toggle'),
        notificationsToggle: document.getElementById('notifications-toggle'),
        aboutModal: document.getElementById('about-modal'),
        aboutClose: document.getElementById('about-close')
      };

      // Initialize the app
      this.initMap();
      this.loadHospitals();
      this.initEventListeners();
      this.checkSavedTheme();
      this.showWelcomeNotification();
    }

    // Initialize the map
    initMap() {
      try {
        if (!this.elements.mapContainer) {
          throw new Error('Map container not found');
        }

        this.state.map = L.map('map', {
          center: [33.8973, 48.7543],
          zoom: 14,
          minZoom: 12,
          maxZoom: 18,
          zoomControl: false,
          maxBounds: [[33.75, 48.60], [34.00, 48.90]],
          maxBoundsViscosity: 0.5
        });

        this.loadMapLayer();
        
        // Add zoom control with custom position
        L.control.zoom({
          position: 'bottomright'
        }).addTo(this.state.map);

      } catch (error) {
        console.error('Error initializing map:', error);
        this.showNotification('خطا در بارگذاری نقشه');
      }
    }

    // Load the appropriate map layer based on theme
    loadMapLayer() {
      this.state.map.eachLayer(layer => {
        if (layer instanceof L.TileLayer) {
          this.state.map.removeLayer(layer);
        }
      });

      const tileLayerUrl = this.state.currentTheme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileLayerUrl, {
        attribution: '&copy; OpenStreetMap'
      }).addTo(this.state.map);
    }

    // Load hospital data
    loadHospitals() {
      this.state.hospitals = [
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
        // ... (other hospitals data same as before)
      ];

      this.addHospitalMarkers();
    }

    // Add markers for hospitals
    addHospitalMarkers() {
      const hospitalIcon = L.icon({
        iconUrl: 'assets/img/icons/hospital.png',
        iconSize: [42, 42],
        iconAnchor: [21, 42],
        popupAnchor: [0, -42],
        className: 'hospital-marker'
      });

      this.state.hospitals.forEach(hospital => {
        const marker = L.marker(hospital.coords, {
          icon: hospitalIcon,
          riseOnHover: true,
          zIndexOffset: hospital.emergency ? 100 : 0
        }).addTo(this.state.map);

        marker.hospital = hospital;
        
        marker.bindPopup(this.createPopupContent(hospital), {
          className: 'hospital-popup',
          closeButton: false,
          maxWidth: 300,
          minWidth: 250
        });

        marker.on('popupopen', () => {
          document.querySelectorAll('.popup-btn[data-action="details"]').forEach(btn => {
            btn.addEventListener('click', () => {
              const hospitalId = parseInt(btn.getAttribute('data-id'));
              this.showHospitalDetails(hospitalId);
              marker.closePopup();
            });
          });

          document.querySelectorAll('.popup-btn[data-action="route"]').forEach(btn => {
            btn.addEventListener('click', () => {
              const hospitalId = parseInt(btn.getAttribute('data-id'));
              this.locateUser();
              setTimeout(() => this.showRoutePanel(hospitalId), 1000);
              marker.closePopup();
            });
          });
        });

        this.state.hospitalMarkers[hospital.id] = marker;
      });
    }

    // Create popup content for markers
    createPopupContent(hospital) {
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
    }

    // Initialize event listeners
    initEventListeners() {
      // Menu buttons
      document.getElementById('btn-menu').addEventListener('click', () => this.toggleMenu());
      this.elements.menuOverlay.addEventListener('click', () => this.toggleMenu());
      this.elements.menuClose.addEventListener('click', () => this.toggleMenu());
      
      // Search functionality
      document.getElementById('btn-search').addEventListener('click', () => this.toggleSearch());
      this.elements.searchClose.addEventListener('click', () => this.toggleSearch());
      this.elements.searchInput.addEventListener('input', () => this.handleSearch());
      this.elements.closeResults.addEventListener('click', () => this.closeSearchResults());

      // FAB buttons
      document.getElementById('fab-main').addEventListener('click', () => this.toggleFab());
      document.getElementById('fab-nearby').addEventListener('click', () => {
        this.showNearbyHospitals();
        this.toggleFab();
      });
      document.getElementById('fab-locate').addEventListener('click', () => {
        this.locateUser();
        this.toggleFab();
      });
      document.getElementById('fab-settings').addEventListener('click', () => {
        this.toggleMenu();
        this.toggleFab();
      });

      // Panel close buttons
      document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => this.closeAllPanels());
      });

      // Hospital panel actions
      document.getElementById('btn-call-hospital').addEventListener('click', () => this.callHospital());
      document.getElementById('btn-show-route').addEventListener('click', () => this.showRouteFromPanel());
      document.getElementById('btn-share-hospital').addEventListener('click', () => this.shareHospital());

      // Dark mode toggle
      this.elements.darkModeToggle.addEventListener('change', () => this.toggleDarkMode());

      // About modal
      document.getElementById('menu-about').addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleMenu();
        this.showAboutModal();
      });
      document.getElementById('footer-about').addEventListener('click', (e) => {
        e.preventDefault();
        this.showAboutModal();
      });
      this.elements.aboutClose.addEventListener('click', () => this.hideAboutModal());
      this.elements.aboutModal.addEventListener('click', (e) => {
        if (e.target === this.elements.aboutModal) {
          this.hideAboutModal();
        }
      });

      // Locate from menu
      document.getElementById('menu-locate').addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleMenu();
        this.locateUser();
      });

      // Nearby from menu
      document.getElementById('menu-nearby').addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleMenu();
        this.showNearbyHospitals();
      });
    }

    // Toggle main menu
    toggleMenu() {
      this.state.menuOpen = !this.state.menuOpen;
      this.elements.mainMenu.classList.toggle('active', this.state.menuOpen);
      
      // Close FAB if open
      if (this.state.fabOpen) {
        this.toggleFab();
      }
    }

    // Toggle search bar
    toggleSearch() {
      this.state.searchOpen = !this.state.searchOpen;
      this.elements.searchBar.classList.toggle('active', this.state.searchOpen);
      
      if (this.state.searchOpen) {
        this.elements.searchInput.focus();
      } else {
        this.closeSearchResults();
        this.elements.searchInput.value = '';
      }
    }

    // Handle search input
    handleSearch() {
      const query = this.elements.searchInput.value.trim().toLowerCase();
      
      if (query.length < 2) {
        this.closeSearchResults();
        return;
      }

      this.state.filteredHospitals = this.state.hospitals.filter(hospital => 
        hospital.name.toLowerCase().includes(query) || 
        hospital.address.toLowerCase().includes(query) ||
        hospital.specialties.some(spec => spec.toLowerCase().includes(query))
      );

      this.showSearchResults();
    }

    // Show search results
    showSearchResults() {
      if (this.state.filteredHospitals.length === 0) {
        this.elements.resultsList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-hospital"></i>
            <p>نتیجه‌ای یافت نشد</p>
          </div>
        `;
      } else {
        this.elements.resultsList.innerHTML = this.state.filteredHospitals.map(hospital => `
          <div class="search-item" data-id="${hospital.id}">
            <h4>${hospital.name}</h4>
            <p class="search-address">${hospital.address}</p>
            <div class="search-type">
              <span class="hospital-type">${hospital.type}</span>
              ${hospital.emergency ? '<span class="emergency-badge"><i class="fas fa-ambulance"></i> اورژانس</span>' : ''}
            </div>
          </div>
        `).join('');

        // Add click event to search items
        document.querySelectorAll('.search-item').forEach(item => {
          item.addEventListener('click', () => {
            const hospitalId = parseInt(item.getAttribute('data-id'));
            this.showHospitalDetails(hospitalId);
            this.closeSearchResults();
            this.toggleSearch();
          });
        });
      }

      this.elements.searchResults.classList.add('active');
    }

    // Close search results
    closeSearchResults() {
      this.elements.searchResults.classList.remove('active');
    }

    // Toggle FAB menu
    toggleFab() {
      this.state.fabOpen = !this.state.fabOpen;
      document.querySelector('.fab-container').classList.toggle('active', this.state.fabOpen);
    }

    // Check saved theme from localStorage
    checkSavedTheme() {
      const savedTheme = localStorage.getItem('theme') || 'light';
      this.state.currentTheme = savedTheme;
      document.documentElement.setAttribute('data-theme', this.state.currentTheme);
      this.elements.darkModeToggle.checked = this.state.currentTheme === 'dark';
    }

    // Toggle dark mode
    toggleDarkMode() {
      this.state.currentTheme = this.state.currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', this.state.currentTheme);
      localStorage.setItem('theme', this.state.currentTheme);
      this.loadMapLayer();
      this.updateMarkersStyle();
    }

    // Update markers style when theme changes
    updateMarkersStyle() {
      Object.values(this.state.hospitalMarkers).forEach(marker => {
        if (marker.isPopupOpen()) {
          const popup = marker.getPopup();
          popup.setContent(this.createPopupContent(marker.hospital));
          marker.openPopup();
        }
      });
      
      if (this.state.userMarker && this.state.userMarker.isPopupOpen()) {
        this.state.userMarker.openPopup();
      }
    }

    // Show notification
    showNotification(message, duration = 3000) {
      if (!this.elements.notificationsToggle.checked) return;
      
      const notificationMessage = document.getElementById('notification-message');
      notificationMessage.textContent = message;
      this.elements.notification.classList.add('show');
      
      setTimeout(() => {
        this.elements.notification.classList.remove('show');
      }, duration);
    }

    // Show welcome notification
    showWelcomeNotification() {
      setTimeout(() => {
        this.showNotification('به نقشه بیمارستان‌های بروجرد خوش آمدید');
      }, 1000);
    }

    // Toggle loading overlay
    toggleLoading(show) {
      this.elements.loadingOverlay.classList.toggle('active', show);
    }

    // Show about modal
    showAboutModal() {
      this.elements.aboutModal.classList.add('active');
    }

    // Hide about modal
    hideAboutModal() {
      this.elements.aboutModal.classList.remove('active');
    }

    // Locate user
    locateUser() {
      if (navigator.geolocation) {
        this.showNotification('در حال دریافت موقعیت شما...');
        this.toggleLoading(true);
        
        navigator.geolocation.getCurrentPosition(
          position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            this.state.isInBorujerd = this.checkIfInBorujerd(lat, lng);
            
            if (!this.state.isInBorujerd) {
              this.showNotification('شما در محدوده بروجرد نیستید');
              this.toggleLoading(false);
              return;
            }
            
            this.state.userLocation = { lat, lng };
            this.updateUserMarker(lat, lng);
            this.state.map.setView([lat, lng], 15);
            this.showNotification('موقعیت شما با موفقیت مشخص شد');
            this.toggleLoading(false);
          },
          error => {
            console.error('خطا در دریافت موقعیت:', error);
            this.showNotification('خطا در دریافت موقعیت مکانی');
            this.toggleLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        this.showNotification('مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند');
      }
    }

    // Check if coordinates are in Borujerd
    checkIfInBorujerd(lat, lng) {
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
    }

    // Update user marker
    updateUserMarker(lat, lng) {
      if (this.state.userMarker) {
        this.state.map.removeLayer(this.state.userMarker);
      }

      const userIcon = L.icon({
        iconUrl: 'assets/img/icons/user.png',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
        className: 'user-marker'
      });

      this.state.userMarker = L.marker([lat, lng], { 
        icon: userIcon,
        zIndexOffset: 1000
      }).addTo(this.state.map);
      
      this.state.userMarker.bindPopup('شما اینجا هستید', {
        className: 'user-popup',
        closeButton: false
      }).openPopup();
    }

    // Calculate distance between two points
    getDistance(lat1, lon1, lat2, lon2) {
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

    // Show nearby hospitals
    showNearbyHospitals() {
      if (!this.state.userLocation || !this.state.isInBorujerd) {
        this.locateUser();
        return;
      }
      
      const sortedHospitals = [...this.state.hospitals].sort((a, b) => {
        const distA = this.getDistance(
          this.state.userLocation.lat, 
          this.state.userLocation.lng, 
          a.coords[0], 
          a.coords[1]
        );
        
        const distB = this.getDistance(
          this.state.userLocation.lat, 
          this.state.userLocation.lng, 
          b.coords[0], 
          b.coords[1]
        );
        
        return distA - distB;
      });
      
      this.displayNearbyHospitals(sortedHospitals.slice(0, 5));
    }

    // Display nearby hospitals in the panel
    displayNearbyHospitals(hospitals) {
      const nearbyList = document.getElementById('nearby-list');
      
      if (hospitals.length === 0) {
        nearbyList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-hospital"></i>
            <p>بیمارستانی در نزدیکی شما یافت نشد</p>
          </div>
        `;
        return;
      }
      
      nearbyList.innerHTML = hospitals.map(hospital => {
        const distance = this.getDistance(
          this.state.userLocation.lat, 
          this.state.userLocation.lng,
          hospital.coords[0],
          hospital.coords[1]
        ) / 1000;
        
        const time = (distance * 12).toFixed(0); // Estimated time in minutes
        
        return `
          <li class="nearby-item" data-id="${hospital.id}">
            <div class="nearby-item-header">
              <div class="hospital-info">
                <h4>${hospital.name}</h4>
                <span class="hospital-type">${hospital.type}</span>
              </div>
              ${hospital.emergency ? '<span class="emergency-badge"><i class="fas fa-ambulance"></i> اورژانس</span>' : ''}
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
              <button class="nearby-btn route-btn" data-id="${hospital.id}">
                <i class="fas fa-route"></i> مسیریابی
              </button>
            </div>
          </li>
        `;
      }).join('');
      
      // Add event listeners to nearby items
      nearbyList.querySelectorAll('.details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const hospitalId = parseInt(btn.getAttribute('data-id'));
          this.showHospitalDetails(hospitalId);
        });
      });
      
      nearbyList.querySelectorAll('.route-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const hospitalId = parseInt(btn.getAttribute('data-id'));
          this.showRoutePanel(hospitalId);
        });
      });
      
      nearbyList.querySelectorAll('.nearby-item').forEach(item => {
        item.addEventListener('click', () => {
          const hospitalId = parseInt(item.getAttribute('data-id'));
          this.showHospitalOnMap(hospitalId);
        });
      });
      
      this.closeAllPanels();
      this.elements.nearbyPanel.classList.add('open');
    }

    // Show hospital on map
    showHospitalOnMap(hospitalId) {
      const hospital = this.state.hospitals.find(h => h.id === hospitalId);
      if (!hospital) return;
      
      this.state.map.setView(hospital.coords, 16, {
        animate: true,
        duration: 1
      });
      
      if (this.state.hospitalMarkers[hospital.id]) {
        this.state.hospitalMarkers[hospital.id].openPopup();
      }
      
      this.closeAllPanels();
    }

    // Show hospital details
    showHospitalDetails(hospitalId) {
      const hospital = this.state.hospitals.find(h => h.id === hospitalId);
      if (!hospital) return;
      
      this.state.selectedHospital = hospital;
      
      // Update panel content
      document.getElementById('hospital-name').textContent = hospital.name;
      document.getElementById('hospital-address').textContent = hospital.address;
      document.getElementById('hospital-phone').textContent = hospital.phone;
      document.getElementById('hospital-type-badge').textContent = hospital.type;
      document.getElementById('hospital-description').textContent = hospital.description;
      
      // Update emergency badge
      const emergencyBadge = document.getElementById('emergency-badge');
      emergencyBadge.style.display = hospital.emergency ? 'flex' : 'none';
      
      // Update specialties
      const specialtiesList = document.querySelector('#hospital-specialties .specialties-list');
      specialtiesList.innerHTML = '';
      hospital.specialties.forEach(spec => {
        const span = document.createElement('span');
        span.textContent = spec;
        specialtiesList.appendChild(span);
      });
      
      // Update hospital image
      const hospitalImage = document.getElementById('hospital-image');
      hospitalImage.style.backgroundImage = `url('${hospital.photo}')`;
      
      // Close other panels and open hospital panel
      this.closeAllPanels();
      this.elements.hospitalPanel.classList.add('open');
      
      // Center map on hospital
      this.state.map.setView(hospital.coords, 16, {
        animate: true,
        duration: 1
      });
      
      // Close popup if open
      if (this.state.hospitalMarkers[hospital.id]) {
        this.state.hospitalMarkers[hospital.id].closePopup();
      }
    }

    // Show route panel
    showRoutePanel(hospitalId) {
      const hospital = this.state.hospitals.find(h => h.id === hospitalId);
      if (!hospital || !this.state.userLocation || !this.state.isInBorujerd) {
        this.showNotification('لطفاً ابتدا موقعیت خود را مشخص کنید و مطمئن شوید در بروجرد هستید');
        return;
      }
      
      this.state.selectedHospital = hospital;
      
      // Remove existing routing control
      if (this.state.routingControl) {
        this.state.map.removeControl(this.state.routingControl);
        this.state.routingControl = null;
      }
      
      // Create new routing control
      this.state.routingControl = L.Routing.control({
        waypoints: [
          L.latLng(this.state.userLocation.lat, this.state.userLocation.lng),
          L.latLng(hospital.coords[0], hospital.coords[1])
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        lineOptions: {
          styles: [{color: this.state.currentTheme === 'dark' ? '#3b82f6' : '#2563eb', opacity: 0.8, weight: 6}]
        },
        createMarker: () => null,
        collapsible: false,
        position: 'topleft',
        router: new L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: this.state.currentTransportMode === 'walk' ? 'foot' : 'car'
        })
      }).addTo(this.state.map);
      
      // Handle route found event
      this.state.routingControl.on('routesfound', (e) => {
        const routes = e.routes;
        const summary = routes[0].summary;
        const distance = (summary.totalDistance / 1000).toFixed(2);
        const time = (summary.totalTime / 60).toFixed(0);
        
        document.getElementById('route-distance').textContent = `${distance} کیلومتر`;
        document.getElementById('route-time').textContent = `${time} دقیقه`;
        
        this.displayRouteInstructions(routes[0], hospital);
      });
      
      // Close other panels and open route panel
      this.closeAllPanels();
      this.elements.routePanel.classList.add('open');
    }

    // Display route instructions
    displayRouteInstructions(route, hospital) {
      const instructionsContainer = document.getElementById('route-instructions');
      instructionsContainer.innerHTML = '';
      
      // Add summary instruction
      const summaryItem = document.createElement('div');
      summaryItem.className = 'route-instruction-item summary';
      summaryItem.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>مسیر پیشنهادی از موقعیت فعلی شما به ${hospital.name}</span>
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
      
      // Add route instructions (limited to 8 steps)
      route.instructions.slice(0, 8).forEach((instruction, index) => {
        const instructionItem = document.createElement('div');
        instructionItem.className = 'route-instruction-item';
        
        const icon = document.createElement('i');
        icon.className = 'route-instruction-icon';
        
        // Set appropriate icon based on instruction type
        if (instruction.type.includes('Left')) {
          icon.className += ' fas fa-arrow-left';
        } else if (instruction.type.includes('Right')) {
          icon.className += ' fas fa-arrow-right';
        } else if (instruction.type.includes('Straight') || instruction.type.includes('Continue')) {
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
        <span>${hospital.name}</span>
      `;
      instructionsContainer.appendChild(endItem);
      
      // Add transport mode toggle
      const modeToggle = document.createElement('div');
      modeToggle.className = 'transport-mode';
      modeToggle.innerHTML = `
        <button class="mode-btn walk ${this.state.currentTransportMode === 'walk' ? 'active' : ''}" data-mode="walk">
          <i class="fas fa-walking"></i> پیاده
        </button>
        <button class="mode-btn drive ${this.state.currentTransportMode === 'drive' ? 'active' : ''}" data-mode="drive">
          <i class="fas fa-car"></i> خودرو
        </button>
      `;
      instructionsContainer.appendChild(modeToggle);
      
      // Add event listeners for mode toggle
      document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.state.currentTransportMode = btn.getAttribute('data-mode');
          this.showRoutePanel(hospital.id);
        });
      });
    }

    // Call hospital
    callHospital() {
      if (this.state.selectedHospital) {
        window.open(`tel:${this.state.selectedHospital.phone}`);
      }
    }

    // Show route from panel
    showRouteFromPanel() {
      if (this.state.selectedHospital) {
        this.showRoutePanel(this.state.selectedHospital.id);
      }
    }

    // Share hospital
    shareHospital() {
      if (!this.state.selectedHospital) return;
      
      const hospital = this.state.selectedHospital;
      const text = `بیمارستان ${hospital.name} - آدرس: ${hospital.address} - تلفن: ${hospital.phone}`;
      
      if (navigator.share) {
        navigator.share({
          title: hospital.name,
          text: text,
          url: window.location.href
        }).catch(err => {
          console.log('Error sharing:', err);
          this.copyToClipboard(text);
        });
      } else {
        this.copyToClipboard(text);
      }
    }

    // Copy text to clipboard
    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.showNotification('اطلاعات بیمارستان کپی شد');
      }).catch(err => {
        console.error('Could not copy text: ', err);
        this.showNotification('خطا در کپی اطلاعات');
      });
    }

    // Close all panels
    closeAllPanels() {
      this.elements.hospitalPanel.classList.remove('open');
      this.elements.routePanel.classList.remove('open');
      this.elements.nearbyPanel.classList.remove('open');
      
      // Close search if open
      if (this.state.searchOpen) {
        this.toggleSearch();
      }
      
      // Remove routing control if exists
      if (this.state.routingControl) {
        this.state.map.removeControl(this.state.routingControl);
        this.state.routingControl = null;
      }
    }
  }

  // Initialize the app
  new HospitalMapApp();
});