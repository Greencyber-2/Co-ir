document.addEventListener('DOMContentLoaded', () => {
  // Map initialization with error handling
  let map;
  try {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('Map container not found');
      showNotification('خطا در بارگذاری نقشه');
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
    showNotification('خطا در بارگذاری نقشه');
    return;
  }

  let userLocation = null;
  let userMarker = null;
  let currentTheme = 'light';
  let isInBorujerd = false;
  let selectedHospital = null;
  let routingControl = null;
  let currentTransportMode = 'walk';

  // DOM Elements
  const hospitalPanel = document.getElementById('hospital-panel');
  const routePanel = document.getElementById('route-panel');
  const nearbyPanel = document.getElementById('nearby-panel');
  const settingsPanel = document.getElementById('settings-panel');
  const notification = document.getElementById('notification');
  const loadingOverlay = document.getElementById('loading');
  const btnShowNearby = document.getElementById('btn-show-nearby');
  const btnShowSettings = document.getElementById('btn-show-settings');
  const btnLocate = document.getElementById('btn-locate');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const notificationsToggle = document.getElementById('notifications-toggle');
  const btnBackElements = document.querySelectorAll('.btn-back');

  // Icons
  const hospitalIcon = L.icon({
    iconUrl: 'assets/img/icons/hospital.png',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
  });

  const userIcon = L.icon({
    iconUrl: 'assets/img/icons/user.png',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
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

  function showNotification(message, duration = 3000) {
    if (!notificationsToggle.checked) return;
    
    const notificationMessage = document.getElementById('notification-message');
    notificationMessage.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, duration);
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
    updatePopupsStyle();
  }

  function updatePopupsStyle() {
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
    return `
      <div class="popup-content">
        <h4>${hospital.name}</h4>
        <p><i class="fas fa-hospital"></i> ${hospital.type}</p>
        <p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
        <div class="popup-actions">
          <button class="popup-btn" data-id="${hospital.id}" data-action="details">
            <i class="fas fa-info-circle"></i> جزئیات
          </button>
          <button class="popup-btn" data-id="${hospital.id}" data-action="route">
            <i class="fas fa-route"></i> مسیر
          </button>
        </div>
      </div>
    `;
  }

  function locateUser() {
    if (navigator.geolocation) {
      showNotification('در حال دریافت موقعیت شما...');
      toggleLoading(true);
      
      navigator.geolocation.getCurrentPosition(
        position => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          isInBorujerd = checkIfInBorujerd(lat, lng);
          
          if (!isInBorujerd) {
            showNotification('شما در محدوده بروجرد نیستید');
            toggleLoading(false);
            return;
          }
          
          userLocation = { lat, lng };
          
          if (userMarker) {
            map.removeLayer(userMarker);
          }
          
          userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
          userMarker.bindPopup('شما اینجا هستید').openPopup();
          
          map.setView([lat, lng], 15);
          showNotification('موقعیت شما با موفقیت مشخص شد');
          toggleLoading(false);
        },
        error => {
          console.error('خطا در دریافت موقعیت:', error);
          showNotification('خطا در دریافت موقعیت مکانی');
          toggleLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      showNotification('مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند');
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
      locateUser();
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
      
      const item = document.createElement('li');
      item.className = 'nearby-item';
      item.innerHTML = `
        <div class="nearby-item-header">
          <h4>${hospital.name}</h4>
          <span class="hospital-type">${hospital.type}</span>
        </div>
        <div class="distance">
          <i class="fas fa-walking"></i> ${distance.toFixed(2)} کیلومتر
        </div>
        <p>${hospital.address}</p>
        <div class="nearby-actions">
          <button class="nearby-btn" data-id="${hospital.id}">
            <i class="fas fa-map-marked-alt"></i> نمایش روی نقشه
          </button>
        </div>
      `;
      
      nearbyList.appendChild(item);
    });
    
    nearbyList.querySelectorAll('.nearby-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const hospitalId = parseInt(btn.getAttribute('data-id'));
        showHospitalOnMap(hospitalId);
      });
    });
    
    closeAllPanels();
    nearbyPanel.classList.add('open');
  }

  function showHospitalOnMap(hospitalId) {
    const hospital = hospitals.find(h => h.id === hospitalId);
    if (!hospital) return;
    
    map.setView(hospital.coords, 16, {
      animate: true,
      duration: 1
    });
    
    if (hospitalMarkers[hospital.id]) {
      hospitalMarkers[hospital.id].openPopup();
    }
    
    closeAllPanels();
  }

  function showHospitalDetails(hospitalId) {
    const hospital = hospitals.find(h => h.id === hospitalId);
    if (!hospital) return;
    
    selectedHospital = hospital;
    
    document.getElementById('hospital-name').textContent = hospital.name;
    document.getElementById('hospital-address').textContent = hospital.address;
    document.getElementById('hospital-phone').textContent = hospital.phone;
    document.getElementById('hospital-type').textContent = hospital.type;
    
    const emergencyRow = document.getElementById('emergency-row');
    emergencyRow.style.display = hospital.emergency ? 'flex' : 'none';
    
    const specialtiesList = document.querySelector('#hospital-specialties ul');
    specialtiesList.innerHTML = '';
    hospital.specialties.forEach(spec => {
      const li = document.createElement('li');
      li.textContent = spec;
      specialtiesList.appendChild(li);
    });
    
    const hospitalImage = document.getElementById('hospital-image');
    hospitalImage.style.backgroundImage = `url('${hospital.photo}')`;
    
    closeAllPanels();
    hospitalPanel.classList.add('open');
    
    map.setView(hospital.coords, 16, {
      animate: true,
      duration: 1
    });
    
    if (hospitalMarkers[hospital.id]) {
      hospitalMarkers[hospital.id].closePopup();
    }
  }

  function showRoutePanel(hospitalId) {
    const hospital = hospitals.find(h => h.id === hospitalId);
    if (!hospital || !userLocation || !isInBorujerd) {
      showNotification('لطفاً ابتدا موقعیت خود را مشخص کنید و مطمئن شوید در بروجرد هستید');
      return;
    }
    
    selectedHospital = hospital;
    
    if (routingControl) {
      map.removeControl(routingControl);
      routingControl = null;
    }
    
    routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userLocation.lat, userLocation.lng),
        L.latLng(hospital.coords[0], hospital.coords[1])
      ],
      routeWhileDragging: false,
      showAlternatives: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{color: currentTheme === 'dark' ? '#3b82f6' : '#2563eb', opacity: 0.8, weight: 6}]
      },
      createMarker: () => null,
      collapsible: false,
      position: 'topleft',
      router: new L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: currentTransportMode === 'walk' ? 'foot' : 'car'
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
      
      routes[0].instructions.slice(0, 5).forEach((instruction, index) => {
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
        } else if (instruction.type.includes('Start')) {
          icon.className += ' fas fa-map-marker-alt';
        } else if (instruction.type.includes('End')) {
          icon.className += ' fas fa-flag-checkered';
        } else {
          icon.className += ' fas fa-arrow-up';
        }
        
        const text = document.createElement('span');
        text.textContent = instruction.text;
        
        instructionItem.appendChild(icon);
        instructionItem.appendChild(text);
        instructionsContainer.appendChild(instructionItem);
      });
    });
    
    closeAllPanels();
    routePanel.classList.add('open');
  }

  function closeAllPanels() {
    hospitalPanel.classList.remove('open');
    routePanel.classList.remove('open');
    nearbyPanel.classList.remove('open');
    settingsPanel.classList.remove('open');
    
    if (routingControl) {
      map.removeControl(routingControl);
      routingControl = null;
    }
  }

  function init() {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', currentTheme);
    darkModeToggle.checked = currentTheme === 'dark';
    
    // Load map layer
    loadMapLayer();
    
    // Add hospital markers
    hospitals.forEach(hospital => {
      const marker = L.marker(hospital.coords, {
        icon: hospitalIcon,
        riseOnHover: true
      }).addTo(map);
      
      marker.hospital = hospital;
      marker.bindPopup(createPopupContent(hospital), {
        closeButton: true
      });
      
      marker.on('popupopen', () => {
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
            locateUser();
            setTimeout(() => showRoutePanel(hospitalId), 1000);
            marker.closePopup();
          });
        });
      });
      
      hospitalMarkers[hospital.id] = marker;
    });
    
    // Event listeners
    btnShowNearby.addEventListener('click', showNearbyHospitals);
    btnShowSettings.addEventListener('click', () => settingsPanel.classList.add('open'));
    btnLocate.addEventListener('click', locateUser);
    
    btnBackElements.forEach(btn => {
      btn.addEventListener('click', closeAllPanels);
    });
    
    document.getElementById('btn-call-hospital').addEventListener('click', () => {
      if (selectedHospital) {
        window.open(`tel:${selectedHospital.phone}`);
      }
    });
    
    document.getElementById('btn-show-route').addEventListener('click', () => {
      if (selectedHospital) {
        showRoutePanel(selectedHospital.id);
      }
    });
    
    darkModeToggle.addEventListener('change', toggleDarkMode);
    
    // Show welcome notification
    setTimeout(() => {
      showNotification('به نقشه بیمارستان‌های بروجرد خوش آمدید');
    }, 1000);
  }

  init();
});