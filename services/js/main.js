// تنظیمات اولیه نقشه
const map = L.map('map', {
  center: [33.8973, 48.7543],
  zoom: 14,
  minZoom: 12,
  maxZoom: 18,
  zoomControl: false,
  maxBounds: [
    [33.75, 48.60],
    [34.00, 48.90]
  ],
  maxBoundsViscosity: 0.5
});

// متغیرهای وضعیت
let userLocation = null;
let userMarker = null;
let routingControl = null;
let currentTheme = 'light';
let favorites = JSON.parse(localStorage.getItem('hospitalFavorites')) || [];
let currentTransportMode = 'walk';
let isInBorujerd = false;
let selectedHospital = null;

// عناصر DOM
const sidebar = document.getElementById('sidebar');
const searchInput = document.getElementById('search-input');
const typeFilter = document.getElementById('type-filter');
const hospitalList = document.getElementById('hospital-list');
const resultsCount = document.getElementById('results-count');
const btnOpenSearch = document.getElementById('btn-open-search');
const btnCloseSidebar = document.querySelector('.btn-close-sidebar');
const btnRouting = document.getElementById('btn-routing');
const btnDarkMode = document.querySelector('.btn-dark-mode');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const nearbyTab = document.getElementById('nearby-tab');
const routePanel = document.getElementById('route-panel');
const btnCloseRoute = document.querySelector('.btn-close-route');
const routeHospitals = document.getElementById('route-hospitals');
const transportBtns = document.querySelectorAll('.transport-btn');
const hospitalDetailsPanel = document.getElementById('hospital-details');
const btnCloseDetails = document.querySelector('.btn-close-details');
const detailsContent = document.querySelector('.details-content');
const notification = document.getElementById('notification');
const notificationText = document.querySelector('.notification-text');
const loadingOverlay = document.getElementById('loading-overlay');

// آیکون‌ها
const hospitalIcon = L.icon({
  iconUrl: 'icons/hospital.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const userIcon = L.icon({
  iconUrl: 'icons/user.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

// داده بیمارستان‌های بروجرد
const hospitals = [
  {
    id: 1,
    name: "بیمارستان شهید چمران",
    coords: [33.89684661387162, 48.74189615249634],
    address: "بروجرد، بلوار دکتر نصراللهی، بین میدان زینب کبری و شهید رجایی",
    phone: "066-43210000",
    type: "عمومی",
    emergency: true,
    specialties: ["اورژانس", "اطفال", "زنان", "جراحی"],
    photo: "images/hospital-photos/chamran.jpg"
  },
  {
    id: 2,
    name: "بیمارستان امام خمینی (ره)",
    coords: [33.90148164166486, 48.74766021966935],
    address: "بروجرد، سید مصطفی خمینی، گیوه کش (محلهٔ پدافند)",
    phone: "066-43220000",
    type: "عمومی",
    emergency: true,
    specialties: ["اورژانس", "اطفال", "زنان", "جراحی", "قلب"],
    photo: "images/hospital-photos/emam.jpg"
  },
  {
    id: 3,
    name: "بیمارستان بهبود",
    coords: [33.89666880647936, 48.76236081841194],
    address: "بروجرد، بلوار صفا، جعفری، 18 متری، شهید مطیعی (محلهٔ صوفیان)",
    phone: "066-43230000",
    type: "خصوصی",
    emergency: false,
    specialties: ["زنان", "اطفال", "چشم پزشکی"],
    photo: "images/hospital-photos/behbood.jpg"
  },
  {
    id: 4,
    name: "بیمارستان تأمین اجتماعی کوثیر",
    coords: [33.8777597, 48.7662033],
    address: "بروجرد، بلوار امام خمینی، میدان امام خمینی",
    phone: "066-43240000",
    type: "تأمین اجتماعی",
    emergency: true,
    specialties: ["اورژانس", "اطفال", "زنان", "جراحی"],
    photo: "images/hospital-photos/kowsar.jpg"
  },
  {
    id: 5,
    name: "بیمارستان تخصصی شفا",
    coords: [33.8934, 48.7521],
    address: "بروجرد، خیابان شریعتی، کوچه شهید مطهری",
    phone: "066-43250000",
    type: "خصوصی",
    emergency: true,
    specialties: ["اورژانس", "جراحی", "ارتوپدی"],
    photo: "images/hospital-photos/shafa.jpg"
  },
  {
    id: 6,
    name: "بیمارستان کودکان امید",
    coords: [33.8892, 48.7487],
    address: "بروجرد، بلوار معلم، جنب پارک شهر",
    phone: "066-43260000",
    type: "خصوصی",
    emergency: true,
    specialties: ["اطفال", "نوزادان"],
    photo: "images/hospital-photos/omid.jpg"
  }
];

// مارکرهای بیمارستان‌ها
const hospitalMarkers = {};

// تابع برای نمایش اعلان
function showNotification(message, type = 'info', duration = 3000) {
  notification.className = 'notification';
  notification.classList.add(type, 'show');
  notificationText.textContent = message;
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, duration);
}

// تابع برای نمایش لودینگ
function showLoading(show) {
  if (show) {
    loadingOverlay.classList.add('show');
  } else {
    loadingOverlay.classList.remove('show');
  }
}

// تابع برای بررسی اینکه آیا کاربر در محدوده بروجرد است
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

// تابع برای بارگذاری لایه نقشه
function loadMapLayer() {
  // حذف لایه‌های قبلی
  map.eachLayer(layer => {
    if (layer instanceof L.TileLayer) {
      map.removeLayer(layer);
    }
  });

  // افزودن لایه جدید بر اساس تم فعلی
  const tileLayerUrl = currentTheme === 'dark' 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  L.tileLayer(tileLayerUrl, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // افزودن کنترل زوم
  L.control.zoom({
    position: 'bottomright'
  }).addTo(map);
}

// تابع برای تغییر حالت تاریک/روشن
function toggleDarkMode() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  
  btnDarkMode.innerHTML = currentTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
  
  // بارگذاری مجدد لایه نقشه
  loadMapLayer();
  
  // به‌روزرسانی مارکرها
  updateMarkers();
}

// تابع برای یافتن موقعیت کاربر
function locateUser() {
  if (navigator.geolocation) {
    showLoading(true);
    nearbyTab.innerHTML = `
      <div class="location-info">
        <i class="fas fa-spinner fa-spin"></i>
        <p>در حال دریافت موقعیت شما...</p>
      </div>
    `;
    
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        isInBorujerd = checkIfInBorujerd(lat, lng);
        
        if (!isInBorujerd) {
          showLoading(false);
          nearbyTab.innerHTML = `
            <div class="location-info">
              <i class="fas fa-exclamation-triangle"></i>
              <p>شما در محدوده بروجرد نیستید</p>
            </div>
          `;
          showNotification('شما در محدوده بروجرد نیستید', 'warning');
          return;
        }
        
        userLocation = { lat, lng };
        
        // حذف مارکر قبلی اگر وجود داشت
        if (userMarker) {
          map.removeLayer(userMarker);
        }
        
        // افزودن مارکر جدید برای کاربر
        userMarker = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon
        }).addTo(map);
        
        userMarker.bindPopup('شما اینجا هستید').openPopup();
        
        // مرکزیت نقشه روی کاربر
        map.setView([userLocation.lat, userLocation.lng], 15);
        
        // فیلتر بیمارستان‌ها
        filterHospitals();
        showNearbyHospitals();
        showLoading(false);
        showNotification('موقعیت شما با موفقیت دریافت شد', 'success');
      },
      error => {
        showLoading(false);
        console.error('خطا در دریافت موقعیت:', error);
        nearbyTab.innerHTML = `
          <div class="location-info">
            <i class="fas fa-exclamation-circle"></i>
            <p>خطا در دریافت موقعیت مکانی</p>
            <button class="btn-locate-now">تلاش مجدد</button>
          </div>
        `;
        
        nearbyTab.querySelector('.btn-locate-now').addEventListener('click', locateUser);
        showNotification('خطا در دریافت موقعیت شما', 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    showLoading(false);
    nearbyTab.innerHTML = `
      <div class="location-info">
        <i class="fas fa-exclamation-circle"></i>
        <p>مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند</p>
      </div>
    `;
    showNotification('مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند', 'error');
  }
}

// تابع برای فیلتر بیمارستان‌ها
function filterHospitals() {
  const searchTerm = searchInput.value.toLowerCase();
  const typeFilterValue = typeFilter.value;
  
  let filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchTerm) || 
                         hospital.address.toLowerCase().includes(searchTerm);
    
    if (!matchesSearch) return false;
    
    if (typeFilterValue !== 'all' && hospital.type !== typeFilterValue) {
      return false;
    }
    
    return true;
  });
  
  updateHospitalList(filteredHospitals);
}

// تابع برای به‌روزرسانی لیست بیمارستان‌ها
function updateHospitalList(filteredHospitals) {
  hospitalList.innerHTML = '';
  
  if (filteredHospitals.length === 0) {
    hospitalList.innerHTML = '<li class="no-results">نتیجه‌ای یافت نشد</li>';
    resultsCount.textContent = '0';
    return;
  }
  
  resultsCount.textContent = filteredHospitals.length.toString();
  
  filteredHospitals.forEach(hospital => {
    const li = document.createElement('li');
    
    // محاسبه فاصله اگر موقعیت کاربر مشخص باشد
    let distanceHtml = '';
    if (userLocation && isInBorujerd) {
      const distance = getDistance(
        userLocation.lat, 
        userLocation.lng,
        hospital.coords[0],
        hospital.coords[1]
      ) / 1000; // تبدیل به کیلومتر
      
      distanceHtml = `
        <div class="distance">
          <i class="fas fa-map-marker-alt"></i>
          ${distance.toFixed(2)} کیلومتر
        </div>
      `;
    }
    
    const isFavorite = favorites.includes(hospital.id);
    
    li.innerHTML = `
      <div class="hospital-header">
        <h4>${hospital.name}</h4>
        <button class="btn-favorite ${isFavorite ? 'favorited' : ''}" data-id="${hospital.id}">
          <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
        </button>
      </div>
      <p>${hospital.address}</p>
      <div class="hospital-info">
        <span class="hospital-type ${hospital.type.replace(/\s+/g, '-')}">
          <i class="fas fa-hospital"></i> ${hospital.type}
        </span>
        ${hospital.emergency ? '<span class="emergency-badge"><i class="fas fa-ambulance"></i> اورژانس</span>' : ''}
      </div>
      ${distanceHtml}
      <div class="hospital-actions">
        <button class="btn-show-on-map" data-id="${hospital.id}">
          <i class="fas fa-map-marked-alt"></i> نمایش روی نقشه
        </button>
        <button class="btn-details" data-id="${hospital.id}">
          <i class="fas fa-info-circle"></i> جزیات
        </button>
      </div>
    `;
    
    li.querySelector('.btn-show-on-map').addEventListener('click', () => {
      showHospitalOnMap(hospital.id);
    });
    
    li.querySelector('.btn-favorite').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(hospital.id);
    });
    
    li.querySelector('.btn-details').addEventListener('click', (e) => {
      e.stopPropagation();
      showHospitalDetails(hospital.id);
    });
    
    hospitalList.appendChild(li);
  });
}

// تابع برای نمایش بیمارستان روی نقشه
function showHospitalOnMap(hospitalId) {
  const marker = hospitalMarkers[hospitalId];
  if (marker) {
    map.setView(marker.getLatLng(), 16, {
      animate: true,
      duration: 1
    });
    marker.openPopup();
    sidebar.classList.remove('open');
  }
}

// تابع برای نمایش جزیات بیمارستان
function showHospitalDetails(hospitalId) {
  const hospital = hospitals.find(h => h.id === hospitalId);
  if (!hospital) return;
  
  selectedHospital = hospital;
  
  // نمایش پنل جزیات
  detailsContent.innerHTML = `
    <div class="loading-details">
      <i class="fas fa-spinner fa-spin"></i>
      <p>در حال دریافت اطلاعات...</p>
    </div>
  `;
  
  hospitalDetailsPanel.classList.add('open');
  
  // شبیه‌سازی بارگذاری اطلاعات
  setTimeout(() => {
    const specialtiesList = hospital.specialties.map(spec => `<li>${spec}</li>`).join('');
    
    detailsContent.innerHTML = `
      <div class="hospital-details">
        <div class="hospital-image" style="background-image: url('${hospital.photo}')"></div>
        <h4>${hospital.name}</h4>
        <p><i class="fas fa-hospital"></i> نوع: ${hospital.type}</p>
        <p><i class="fas fa-ambulance"></i> اورژانس: ${hospital.emergency ? 'دارد' : 'ندارد'}</p>
        <p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
        <p><i class="fas fa-phone"></i> تلفن: ${hospital.phone}</p>
        <div class="specialties-list">
          <h5>تخصص‌ها:</h5>
          <ul>${specialtiesList}</ul>
        </div>
        <div class="hospital-actions">
          <button class="btn-route" data-id="${hospital.id}">
            <i class="fas fa-route"></i> مسیریابی
          </button>
          <button class="btn-call" data-phone="${hospital.phone}">
            <i class="fas fa-phone"></i> تماس
          </button>
        </div>
      </div>
    `;
    
    // افزودن رویدادها به دکمه‌ها
    detailsContent.querySelector('.btn-route').addEventListener('click', () => {
      if (userLocation && isInBorujerd) {
        hospitalDetailsPanel.classList.remove('open');
        calculateRoute(hospital.coords);
      } else {
        showNotification('لطفاً ابتدا موقعیت خود را مشخص کنید و مطمئن شوید در بروجرد هستید', 'warning');
      }
    });
    
    detailsContent.querySelector('.btn-call').addEventListener('click', () => {
      window.open(`tel:${hospital.phone}`);
    });
  }, 500);
}

// تابع برای محاسبه مسیر
function calculateRoute(destination) {
  if (!userLocation || !isInBorujerd) {
    showNotification('لطفاً ابتدا موقعیت خود را مشخص کنید و مطمئن شوید در بروجرد هستید', 'warning');
    return;
  }
  
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
    btnRouting.innerHTML = '<i class="fas fa-route"></i>';
    routePanel.classList.remove('open');
    return;
  }
  
  showLoading(true);
  
  // نمایش پنل مسیریابی
  routePanel.classList.add('open');
  
  // محاسبه مسیر
  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(userLocation.lat, userLocation.lng),
      L.latLng(destination[0], destination[1])
    ],
    routeWhileDragging: true,
    showAlternatives: false,
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
    lineOptions: {
      styles: [{color: '#185a9d', opacity: 0.7, weight: 5}]
    },
    createMarker: function() { return null; },
    collapsible: true,
    position: 'topleft',
    router: new L.Routing.osrmv1({
      serviceUrl: 'https://router.project-osrm.org/route/v1',
      profile: currentTransportMode === 'walk' ? 'foot' : 'car'
    })
  }).addTo(map);
  
  routingControl.on('routesfound', function(e) {
    showLoading(false);
    const routes = e.routes;
    const summary = routes[0].summary;
    const distance = (summary.totalDistance / 1000).toFixed(2);
    const time = (summary.totalTime / 60).toFixed(0);
    
    L.popup()
      .setLatLng(destination)
      .setContent(`
        <div class="route-summary">
          <h4>مسیریابی (${currentTransportMode === 'walk' ? 'پیاده' : 'ماشین'})</h4>
          <p><i class="fas fa-road"></i> فاصله: ${distance} کیلومتر</p>
          <p><i class="fas fa-clock"></i> زمان تقریبی: ${time} دقیقه</p>
          <button class="btn-start-route">شروع مسیریابی</button>
        </div>
      `)
      .openOn(map);
      
    document.querySelector('.btn-start-route').addEventListener('click', () => {
      showNotification('سیستم مسیریابی در حال توسعه است', 'info');
    });
  });
  
  routingControl.on('routingerror', function(e) {
    showLoading(false);
    showNotification('خطا در محاسبه مسیر', 'error');
  });
  
  btnRouting.innerHTML = '<i class="fas fa-times"></i>';
}

// تابع برای محاسبه فاصله
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // شعاع زمین بر حسب متر
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

// تابع برای نمایش بیمارستان‌های نزدیک
function showNearbyHospitals() {
  if (!userLocation || !isInBorujerd) {
    locateUser();
    return;
  }
  
  // مرتب‌سازی بیمارستان‌ها بر اساس فاصله
  const sortedHospitals = [...hospitals].sort((a, b) => {
    const distA = getDistance(userLocation.lat, userLocation.lng, a.coords[0], a.coords[1]);
    const distB = getDistance(userLocation.lat, userLocation.lng, b.coords[0], b.coords[1]);
    return distA - distB;
  });
  
  // نمایش 5 بیمارستان نزدیک
  const nearestHospitals = sortedHospitals.slice(0, 5);
  
  if (nearestHospitals.length === 0) {
    nearbyTab.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-hospital"></i>
        <p>بیمارستانی در نزدیکی شما یافت نشد</p>
      </div>
    `;
    return;
  }
  
  let html = `
    <div class="nearby-header">
      <h3><i class="fas fa-map-marker-alt"></i> نزدیک‌ترین بیمارستان‌ها</h3>
    </div>
    <ul class="nearby-list">
  `;
  
  nearestHospitals.forEach(hospital => {
    const distance = getDistance(
      userLocation.lat, 
      userLocation.lng,
      hospital.coords[0],
      hospital.coords[1]
    ) / 1000; // تبدیل به کیلومتر
    
    html += `
      <li>
        <div class="nearby-hospital">
          <div class="hospital-info">
            <h4>${hospital.name}</h4>
            <div class="distance">
              <i class="fas fa-walking"></i> ${distance.toFixed(2)} کیلومتر
            </div>
            <p>${hospital.address}</p>
          </div>
          <div class="hospital-actions">
            <button class="btn-show-on-map" data-id="${hospital.id}">
              <i class="fas fa-map-marked-alt"></i>
            </button>
            <button class="btn-details" data-id="${hospital.id}">
              <i class="fas fa-info-circle"></i>
            </button>
          </div>
        </div>
      </li>
    `;
  });
  
  html += `</ul>`;
  nearbyTab.innerHTML = html;
  
  // افزودن رویدادها
  nearbyTab.querySelectorAll('.btn-show-on-map').forEach(btn => {
    btn.addEventListener('click', () => {
      const hospitalId = parseInt(btn.getAttribute('data-id'));
      showHospitalOnMap(hospitalId);
    });
  });
  
  nearbyTab.querySelectorAll('.btn-details').forEach(btn => {
    btn.addEventListener('click', () => {
      const hospitalId = parseInt(btn.getAttribute('data-id'));
      showHospitalDetails(hospitalId);
    });
  });
}

// تابع برای نمایش بیمارستان‌های موردعلاقه
function showFavoriteHospitals() {
  if (favorites.length === 0) {
    document.getElementById('favorites-tab').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-heart"></i>
        <p>هنوز بیمارستانی به موردعلاقه‌ها اضافه نکرده‌اید</p>
      </div>
    `;
    return;
  }
  
  const favoriteHospitals = hospitals.filter(hospital => favorites.includes(hospital.id));
  updateHospitalList(favoriteHospitals);
}

// تابع برای افزودن/حذف بیمارستان از موردعلاقه‌ها
function toggleFavorite(hospitalId) {
  const index = favorites.indexOf(hospitalId);
  if (index === -1) {
    favorites.push(hospitalId);
    showNotification('بیمارستان به موردعلاقه‌ها اضافه شد', 'success');
  } else {
    favorites.splice(index, 1);
    showNotification('بیمارستان از موردعلاقه‌ها حذف شد', 'info');
  }
  
  localStorage.setItem('hospitalFavorites', JSON.stringify(favorites));
  
  // به‌روزرسانی نمایش
  if (document.querySelector('.tab-btn.active').getAttribute('data-tab') === 'favorites') {
    showFavoriteHospitals();
  } else {
    filterHospitals();
  }
  
  // به‌روزرسانی مارکر
  const marker = hospitalMarkers[hospitalId];
  if (marker) {
    marker.openPopup();
  }
}

// تابع برای به‌روزرسانی مارکرها
function updateMarkers() {
  hospitals.forEach(hospital => {
    const marker = hospitalMarkers[hospital.id];
    if (marker) {
      marker.setIcon(hospitalIcon);
    }
  });
}

// تابع برای به‌روزرسانی لیست بیمارستان‌های مسیریابی
function updateRouteHospitalsList() {
  routeHospitals.innerHTML = '';
  
  hospitals.forEach(hospital => {
    const li = document.createElement('li');
    
    let distanceHtml = '';
    if (userLocation && isInBorujerd) {
      const distance = getDistance(
        userLocation.lat, 
        userLocation.lng,
        hospital.coords[0],
        hospital.coords[1]
      ) / 1000; // تبدیل به کیلومتر
      
      distanceHtml = `
        <div class="distance">
          <i class="fas fa-map-marker-alt"></i>
          ${distance.toFixed(2)} کیلومتر
        </div>
      `;
    }
    
    li.innerHTML = `
      <div class="hospital-info">
        <h4>${hospital.name}</h4>
        ${distanceHtml}
        <p>${hospital.address}</p>
      </div>
      <button class="btn-select-route" data-id="${hospital.id}">
        <i class="fas fa-route"></i> انتخاب
      </button>
    `;
    
    li.querySelector('.btn-select-route').addEventListener('click', () => {
      calculateRoute(hospital.coords);
    });
    
    routeHospitals.appendChild(li);
  });
}

// مقداردهی اولیه
function init() {
  // بارگذاری تم ذخیره شده
  const savedTheme = localStorage.getItem('theme') || 'light';
  currentTheme = savedTheme;
  document.documentElement.setAttribute('data-theme', currentTheme);
  btnDarkMode.innerHTML = currentTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
  
  // بارگذاری لایه نقشه
  loadMapLayer();
  
  // ایجاد مارکرهای بیمارستان‌ها
  hospitals.forEach(hospital => {
    const marker = L.marker(hospital.coords, {
      icon: hospitalIcon,
      riseOnHover: true
    }).addTo(map);
    
    const specialtiesList = hospital.specialties.map(spec => `<li>${spec}</li>`).join('');
    
    marker.bindPopup(`
      <div class="popup-content">
        <div class="popup-hospital-image" style="background-image: url('${hospital.photo}')"></div>
        <h4>${hospital.name}</h4>
        <div class="hospital-type ${hospital.type.replace(/\s+/g, '-')}">
          <i class="fas fa-hospital"></i> ${hospital.type}
          ${hospital.emergency ? '<span class="emergency-badge"><i class="fas fa-ambulance"></i> اورژانس</span>' : ''}
        </div>
        <p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
        <div class="popup-actions">
          <button class="btn-route" data-id="${hospital.id}">
            <i class="fas fa-route"></i> مسیریابی
          </button>
          <button class="btn-details" data-id="${hospital.id}">
            <i class="fas fa-info-circle"></i> جزیات
          </button>
        </div>
      </div>
    `);
    
    marker.on('popupopen', () => {
      document.querySelector(`.popup-actions .btn-route[data-id="${hospital.id}"]`)
        .addEventListener('click', () => {
          if (userLocation && isInBorujerd) {
            calculateRoute(hospital.coords);
          } else {
            showNotification('لطفاً ابتدا موقعیت خود را مشخص کنید و مطمئن شوید در بروجرد هستید', 'warning');
          }
        });
        
      document.querySelector(`.popup-actions .btn-details[data-id="${hospital.id}"]`)
        .addEventListener('click', () => {
          showHospitalDetails(hospital.id);
        });
    });
    
    hospitalMarkers[hospital.id] = marker;
  });
  
  // رویدادها
  btnOpenSearch.addEventListener('click', () => {
    sidebar.classList.add('open');
    document.querySelector('[data-tab="search"]').click();
  });

  btnCloseSidebar.addEventListener('click', () => {
    sidebar.classList.remove('open');
  });

  btnRouting.addEventListener('click', () => {
    if (!userLocation || !isInBorujerd) {
      showNotification('لطفاً ابتدا موقعیت خود را مشخص کنید و مطمئن شوید در بروجرد هستید', 'warning');
      return;
    }
    
    if (routingControl) {
      map.removeControl(routingControl);
      routingControl = null;
      btnRouting.innerHTML = '<i class="fas fa-route"></i>';
      routePanel.classList.remove('open');
      return;
    }
    
    routePanel.classList.add('open');
    updateRouteHospitalsList();
  });

  btnCloseRoute.addEventListener('click', () => {
    if (routingControl) {
      map.removeControl(routingControl);
      routingControl = null;
      btnRouting.innerHTML = '<i class="fas fa-route"></i>';
    }
    routePanel.classList.remove('open');
  });
  
  btnCloseDetails.addEventListener('click', () => {
    hospitalDetailsPanel.classList.remove('open');
  });

  btnDarkMode.addEventListener('click', toggleDarkMode);

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
      
      switch(tabId) {
        case 'search':
          filterHospitals();
          break;
        case 'nearby':
          showNearbyHospitals();
          break;
        case 'favorites':
          showFavoriteHospitals();
          break;
      }
    });
  });

  // رویدادهای حالت حمل و نقل
  transportBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      transportBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTransportMode = btn.getAttribute('data-mode');
      
      // اگر مسیری فعال است، دوباره محاسبه کن
      if (routingControl) {
        const currentWaypoints = routingControl.getWaypoints();
        if (currentWaypoints.length >= 2) {
          calculateRoute(currentWaypoints[1].latLng);
        }
      }
    });
  });

  searchInput.addEventListener('input', filterHospitals);
  typeFilter.addEventListener('change', filterHospitals);
  
  // بارگذاری اولیه داده‌ها
  filterHospitals();
  showNearbyHospitals();
  showFavoriteHospitals();
  
  // نمایش پیام خوش‌آمدگویی
  setTimeout(() => {
    showNotification('به نقشه بیمارستان‌های بروجرد خوش آمدید', 'info');
  }, 1000);
}

// شروع برنامه
document.addEventListener('DOMContentLoaded', init);