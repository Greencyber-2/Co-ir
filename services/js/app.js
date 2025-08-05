document.addEventListener('DOMContentLoaded', () => {
  // Map initialization with error handling
  let map;
  try {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('Map container not found');
      showNotification('خطا در بارگذاری نقشه', 3000, 'error');
      return;
    }

    map = L.map('map', {
      center: [33.8973, 48.7543],
      zoom: 14,
      minZoom: 12,
      maxZoom: 18,
      zoomControl: false,
      maxBounds: [[33.75, 48.60], [34.00, 48.90]],
      maxBoundsViscosity: 0.5
    });
  } catch (error) {
    console.error('Error initializing map:', error);
    showNotification('خطا در بارگذاری نقشه', 3000, 'error');
    return;
  }

  let userLocation = null;
  let userMarker = null;
  let currentTheme = 'light';
  let isInBorujerd = false;
  let selectedHospital = null;
  let routingControl = null;
  let currentTransportMode = 'walk';
  let notificationTimeout;

  // DOM Elements
  const hospitalPanel = document.getElementById('hospital-panel');
  const routePanel = document.getElementById('route-panel');
  const nearbyPanel = document.getElementById('nearby-panel');
  const menuPanel = document.getElementById('menu-panel');
  const searchContainer = document.getElementById('search-container');
  const notification = document.getElementById('notification');
  const loadingOverlay = document.getElementById('loading-overlay');
  const btnSearch = document.getElementById('btn-search');
  const btnNearby = document.getElementById('btn-nearby');
  const btnMenu = document.getElementById('btn-menu');
  const btnSearchSubmit = document.getElementById('btn-search-submit');
  const btnSearchClose = document.getElementById('btn-search-close');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const btnCallHospital = document.getElementById('btn-call-hospital');
  const btnShowRoute = document.getElementById('btn-show-route');
  const btnMenuLocate = document.getElementById('menu-locate');
  const btnMenuDarkmode = document.getElementById('menu-darkmode');
  const btnBackElements = document.querySelectorAll('.btn-back');
  const searchInput = document.getElementById('search-input');
  
  // Floating Controls Elements
  const fabLocate = document.getElementById('fab-locate');
  const fabIcon = document.getElementById('fab-icon');
  const floatingControls = document.getElementById('floating-controls');
  const locateUserBtn = document.getElementById('locate-user-btn');
  const showNearbyBtn = document.getElementById('show-nearby-btn');
  const toggleThemeBtn = document.getElementById('toggle-theme-btn');

  // Custom Icons
  const hospitalIcon = L.icon({
    iconUrl: 'assets/img/icons/hospital.png',
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42],
    className: 'hospital-marker'
  });

  const userIcon = L.icon({
    iconUrl: 'assets/img/icons/user.png',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
    className: 'user-marker'
  });

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
    {
      id: 2,
      name: "بیمارستان امام خمینی (ره)",
      coords: [33.90148164166486, 48.74766021966935],
      address: "بروجرد، سید مصطفی خمینی، گیوه کش (محلهٔ پدافند)",
      phone: "066-43220000",
      type: "عمومی",
      emergency: true,
      specialties: ["اورژانس", "اطفال", "زنان", "جراحی", "قلب", "گوارش", "پوست"],
      photo: "assets/img/hospitals/emam.jpg",
      description: "بیمارستان امام خمینی یکی از مراکز درمانی مهم شهر بروجرد با بخش‌های تخصصی مختلف است."
    },
    {
      id: 3,
      name: "بیمارستان بهبود",
      coords: [33.89666880647936, 48.76236081841194],
      address: "بروجرد، بلوار صفا، جعفری، 18 متری، شهید مطیعی (محلهٔ صوفیان)",
      phone: "066-43230000",
      type: "خصوصی",
      emergency: false,
      specialties: ["زنان", "اطفال", "چشم پزشکی", "دندانپزشکی"],
      photo: "assets/img/hospitals/behbood.jpg",
      description: "بیمارستان بهبود یک مرکز درمانی خصوصی با امکانات مدرن و کادر مجرب است."
    },
    {
      id: 4,
      name: "بیمارستان تأمین اجتماعی کوثری",
      coords: [33.8777597, 48.7662033],
      address: "بروجرد، بلوار امام خمینی، میدان امام خمینی",
      phone: "066-43240000",
      type: "تأمین اجتماعی",
      emergency: true,
      specialties: ["اورژانس", "اطفال", "زنان", "جراحی", "رادیولوژی"],
      photo: "assets/img/hospitals/kowsar.jpg",
      description: "بیمارستان کوثری مرکز درمانی وابسته به سازمان تأمین اجتماعی است."
    },
    {
      id: 5,
      name: "بیمارستان تخصصی شفا",
      coords: [33.8934, 48.7521],
      address: "بروجرد، خیابان شریعتی، کوچه شهید مطهری",
      phone: "066-43250000",
      type: "خصوصی",
      emergency: true,
      specialties: ["اورژانس", "جراحی", "ارتوپدی", "فیزیوتراپی"],
      photo: "assets/img/hospitals/shafa.jpg",
      description: "بیمارستان شفا یک مرکز تخصصی با تجهیزات پیشرفته جراحی است."
    },
    {
      id: 6,
      name: "بیمارستان کودکان امید",
      coords: [33.8892, 48.7487],
      address: "بروجرد، بلوار معلم، جنب پارک شهر",
      phone: "066-43260000",
      type: "خصوصی",
      emergency: true,
      specialties: ["اطفال", "نوزادان", "واکسیناسیون"],
      photo: "assets/img/hospitals/omid.jpg",
      description: "بیمارستان امید تنها مرکز تخصصی کودکان در شهر بروجرد است."
    },
    {
      id: 7,
      name: "بیمارستان قلب بروجرد",
      coords: [33.8905, 48.7583],
      address: "بروجرد، بلوار معلم، جنب پارک لاله",
      phone: "066-43270000",
      type: "تخصصی",
      emergency: true,
      specialties: ["قلب", "اکوکاردیوگرافی", "آنژیوگرافی"],
      photo: "assets/img/hospitals/heart.jpg",
      description: "بیمارستان تخصصی قلب بروجرد مجهز به پیشرفته‌ترین دستگاه‌های تشخیصی و درمانی است."
    },
    {
      id: 8,
      name: "بیمارستان روانپزشکی مهر",
      coords: [33.8832, 48.7421],
      address: "بروجرد، خیابان شهید بهشتی، کوچه مهر",
      phone: "066-43280000",
      type: "تخصصی",
      emergency: false,
      specialties: ["روانپزشکی", "اعصاب و روان", "مشاوره"],
      photo: "assets/img/hospitals/mehr.jpg",
      description: "بیمارستان مهر مرکز تخصصی درمان بیماری‌های روانپزشکی است."
    }
  ];

  const hospitalMarkers = {};

  // Utility Functions
  function showNotification(message, duration = 3000, type = 'info') {
    clearTimeout(notificationTimeout);
    
    notification.classList.remove('show');
    notification.classList.add('hide');
    
    setTimeout(() => {
      const notificationMessage = document.getElementById('notification-message');
      const notificationIcon = document.getElementById('notification-icon');
      
      notificationMessage.textContent = message;
      notificationIcon.className = `notification-icon fas ${
        type === 'error' ? 'fa-exclamation-circle' : 
        type === 'success' ? 'fa-check-circle' : 'fa-info-circle'
      }`;
      
      notification.className = `notification ${type}`;
      notification.classList.remove('hide');
      notification.classList.add('show');
      
      notificationTimeout = setTimeout(() => {
        notification.classList.remove('show');
        notification.classList.add('hide');
      }, duration);
    }, 300);
  }

  function toggleLoading(show) {
    loadingOverlay.classList.toggle('active', show);
  }

  function checkIfInBorujerd(lat, lng) {
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

  function loadMapLayer() {
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
  }

  function toggleDarkMode() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    loadMapLayer();
    updateMarkersStyle();
  }

  function updateMarkersStyle() {
    Object.values(hospitalMarkers).forEach(marker => {
      if (marker.isPopupOpen()) {
        const popup = marker.getPopup();
        popup.setContent(createPopupContent(marker.hospital));
        marker.openPopup();
      }
    });
    
    if (userMarker && userMarker.isPopupOpen()) {
      userMarker.openPopup();
    }
  }

  function createPopupContent(hospital) {
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

  function locateUser(showNearby = false) {
    if (navigator.geolocation) {
      showNotification('در حال دریافت موقعیت شما...');
      toggleLoading(true);
      
      navigator.geolocation.getCurrentPosition(
        position => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          isInBorujerd = checkIfInBorujerd(lat, lng);
          
          if (!isInBorujerd) {
            showNotification('شما در محدوده بروجرد نیستید', 3000, 'error');
            toggleLoading(false);
            return;
          }
          
          userLocation = { lat, lng };
          
          if (userMarker) {
            map.removeLayer(userMarker);
          }
          
          userMarker = L.marker([lat, lng], { 
            icon: userIcon,
            zIndexOffset: 1000
          }).addTo(map);
          
          userMarker.bindPopup('شما اینجا هستید', {
            className: 'user-popup',
            closeButton: false
          }).openPopup();
          
          map.setView([lat, lng], 15);
          showNotification('موقعیت شما با موفقیت مشخص شد', 3000, 'success');
          toggleLoading(false);
          
          if (showNearby) {
            showNearbyHospitals();
          }
        },
        error => {
          console.error('خطا در دریافت موقعیت:', error);
          showNotification('خطا در دریافت موقعیت مکانی', 3000, 'error');
          toggleLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      showNotification('مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند', 3000, 'error');
    }
  }

  function getDistance(lat1, lon1, lat2, lon2) {
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

  function showNearbyHospitals() {
    if (!userLocation || !isInBorujerd) {
      locateUser(true);
      return;
    }
    
    const sortedHospitals = [...hospitals].sort((a, b) => {
      const distA = getDistance(userLocation.lat, userLocation.lng, a.coords[0], a.coords[1]);
      const distB = getDistance(userLocation.lat, userLocation.lng, b.coords[0], b.coords[1]);
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
      const distance = getDistance(
        userLocation.lat, 
        userLocation.lng,
        hospital.coords[0],
        hospital.coords[1]
      ) / 1000;
      
      const time = (distance * 12).toFixed(0); // Estimated time in minutes (assuming 5km/h walking speed)
      
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
        showHospitalDetails(hospitalId);
      });
    });
    
    nearbyList.querySelectorAll('.show-on-map-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const hospitalId = parseInt(btn.getAttribute('data-id'));
        const hospital = hospitals.find(h => h.id === hospitalId);
        if (hospital) {
          map.setView(hospital.coords, 16);
          hospitalMarkers[hospitalId].openPopup();
          closeAllPanels();
        }
      });
    });
    
    closeAllPanels();
    nearbyPanel.classList.add('open');
  }

  function showHospitalDetails(hospitalId) {
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
    closeAllPanels();
    hospitalPanel.classList.add('open');
    
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
  }

  function drawRoute(start, end, mode = 'walk') {
    if (routingControl) {
      map.removeControl(routingControl);
      routingControl = null;
    }
    
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
      createMarker: () => null,
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
    });
  }

  function showRoutePanel(hospitalId) {
    const hospital = hospitals.find(h => h.id === hospitalId);
    if (!hospital || !userLocation || !isInBorujerd) {
      showNotification('لطفاً ابتدا موقعیت خود را مشخص کنید و مطمئن شوید در بروجرد هستید', 3000, 'error');
      return;
    }
    
    selectedHospital = hospital;
    
    drawRoute(userLocation, hospital.coords, currentTransportMode);
    
    closeAllPanels();
    routePanel.classList.add('open');
    
    // Center the map to show both points
    const bounds = L.latLngBounds([
      L.latLng(userLocation.lat, userLocation.lng),
      L.latLng(hospital.coords[0], hospital.coords[1])
    ]);

    map.fitBounds(bounds, { padding: [50, 50] });
  }

  function closeAllPanels() {
    hospitalPanel.classList.remove('open');
    routePanel.classList.remove('open');
    nearbyPanel.classList.remove('open');
    menuPanel.classList.remove('open');
    searchContainer.classList.remove('active');
    
    if (routingControl) {
      map.removeControl(routingControl);
      routingControl = null;
    }
  }

  function toggleSearch() {
    searchContainer.classList.toggle('active');
    if (searchContainer.classList.contains('active')) {
      searchInput.focus();
    } else {
      searchInput.value = '';
    }
  }

  function searchHospitals(query) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return;

    const results = hospitals.filter(hospital => 
      hospital.name.toLowerCase().includes(normalizedQuery) ||
      hospital.specialties.some(spec => spec.toLowerCase().includes(normalizedQuery))
    );

    if (results.length === 0) {
      showNotification('نتیجه‌ای یافت نشد', 3000, 'error');
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

    toggleSearch();
  }

  // Floating Controls Functions
  function initFloatingControls() {
    const fab = document.getElementById('fab-locate');
    const fabIcon = document.getElementById('fab-icon');
    const floatingControls = document.getElementById('floating-controls');
    const themeIcon = document.getElementById('theme-icon');

    // Update theme icon
    function updateThemeIcon() {
      themeIcon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Toggle floating controls
    fab.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = fab.classList.toggle('active');
      floatingControls.classList.toggle('active');
      
      // Change icon animation
      if (isActive) {
        fabIcon.classList.remove('fa-bars');
        fabIcon.classList.add('fa-times');
      } else {
        fabIcon.classList.remove('fa-times');
        fabIcon.classList.add('fa-bars');
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!floatingControls.contains(e.target) && !fab.contains(e.target)) {
        closeFloatingControls();
      }
    });

    // Control buttons functionality
    document.getElementById('locate-user-btn').addEventListener('click', () => {
      locateUser(false);
      closeFloatingControls();
    });

    document.getElementById('show-nearby-btn').addEventListener('click', () => {
      showNearbyHospitals();
      closeFloatingControls();
    });

    document.getElementById('toggle-theme-btn').addEventListener('click', () => {
      toggleDarkMode();
      updateThemeIcon();
      closeFloatingControls();
    });

    function closeFloatingControls() {
      fab.classList.remove('active');
      floatingControls.classList.remove('active');
      fabIcon.classList.remove('fa-times');
      fabIcon.classList.add('fa-bars');
    }

    // Initialize theme icon
    updateThemeIcon();
  }

  function closeFloatingControls() {
    floatingControls.classList.remove('active');
    fabLocate.classList.remove('active');
    fabIcon.classList.remove('fa-times');
    fabIcon.classList.add('fa-location-arrow');
  }

  function init() {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', currentTheme);
    darkModeToggle.checked = currentTheme === 'dark';
    
    // Load map layer
    loadMapLayer();
    
    // Add hospital markers with improved styling
    hospitals.forEach(hospital => {
      const marker = L.marker(hospital.coords, {
        icon: hospitalIcon,
        riseOnHover: true,
        zIndexOffset: hospital.emergency ? 100 : 0
      }).addTo(map);
      
      marker.hospital = hospital;
      marker.bindPopup(createPopupContent(hospital), {
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
            showHospitalDetails(hospitalId);
            marker.closePopup();
          });
        });
        
        document.querySelectorAll('.popup-btn[data-action="route"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const hospitalId = parseInt(btn.getAttribute('data-id'));
            if (!userLocation) {
              locateUser();
              setTimeout(() => {
                if (userLocation && isInBorujerd) {
                  showRoutePanel(hospitalId);
                }
              }, 1000);
            } else if (isInBorujerd) {
              showRoutePanel(hospitalId);
            }
            marker.closePopup();
          });
        });
      });
      
      hospitalMarkers[hospital.id] = marker;
    });
    
    // Event listeners
    btnSearch.addEventListener('click', toggleSearch);
    btnSearchClose.addEventListener('click', toggleSearch);
    btnSearchSubmit.addEventListener('click', () => {
      searchHospitals(searchInput.value);
    });
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchHospitals(searchInput.value);
      }
    });
    
    btnNearby.addEventListener('click', showNearbyHospitals);
    btnMenu.addEventListener('click', () => {
      closeAllPanels();
      menuPanel.classList.add('open');
    });
    
    btnCallHospital.addEventListener('click', () => {
      if (selectedHospital) {
        window.open(`tel:${selectedHospital.phone}`);
      }
    });
    
    btnShowRoute.addEventListener('click', () => {
      if (selectedHospital) {
        if (!userLocation) {
          locateUser();
          setTimeout(() => {
            if (userLocation && isInBorujerd) {
              showRoutePanel(selectedHospital.id);
            }
          }, 1000);
        } else if (isInBorujerd) {
          showRoutePanel(selectedHospital.id);
        }
      }
    });
    
    btnMenuLocate.addEventListener('click', () => {
      closeAllPanels();
      locateUser(false);
    });
    
    btnMenuDarkmode.addEventListener('click', () => {
      darkModeToggle.checked = !darkModeToggle.checked;
      toggleDarkMode();
    });
    
    darkModeToggle.addEventListener('change', toggleDarkMode);
    
    btnBackElements.forEach(btn => {
      btn.addEventListener('click', closeAllPanels);
    });
    
    // Transport mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTransportMode = btn.getAttribute('data-mode');
        if (selectedHospital) {
          showRoutePanel(selectedHospital.id);
        }
      });
    });
    
    // Initialize floating controls
    initFloatingControls();
    
    // Show welcome notification after everything is loaded
    setTimeout(() => {
      showNotification('به نقشه بیمارستان‌های بروجرد خوش آمدید', 3000, 'success');
    }, 1500);
  }

  init();
});
