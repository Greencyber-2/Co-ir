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
let currentTheme = 'light';
let favorites = JSON.parse(localStorage.getItem('hospitalFavorites')) || [];
let isInBorujerd = false;
let selectedHospital = null;
let routingControl = null;

// عناصر DOM
const sidebarMenu = document.querySelector('.sidebar-menu');
const nearbyPanel = document.getElementById('nearby-panel');
const routePanel = document.getElementById('route-panel');
const notification = document.getElementById('notification');
const loadingOverlay = document.getElementById('loading');
const btnDarkMode = document.querySelector('.btn-dark-mode');
const btnLocate = document.querySelector('.btn-locate');
const btnMenu = document.querySelector('.btn-menu');
const btnCloseMenu = document.querySelector('.btn-close-menu');
const btnClosePanels = document.querySelectorAll('.btn-close-panel');
const btnStartRoute = document.getElementById('btn-start-route');
const menuNearby = document.getElementById('menu-nearby');
const menuFavorites = document.getElementById('menu-favorites');
const menuSettings = document.getElementById('menu-settings');

// آیکون‌ها
const hospitalIcon = L.icon({
  iconUrl: 'assets/icons/hospital.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const userIcon = L.icon({
  iconUrl: 'assets/icons/user.png',
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
    photo: "assets/img/hospitals/chamran.jpg"
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
    photo: "assets/img/hospitals/emam.jpg"
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
    photo: "assets/img/hospitals/behbood.jpg"
  },
  {
    id: 4,
    name: "بیمارستان تأمین اجتماعی کوثری",
    coords: [33.8777597, 48.7662033],
    address: "بروجرد، بلوار امام خمینی، میدان امام خمینی",
    phone: "066-43240000",
    type: "تأمین اجتماعی",
    emergency: true,
    specialties: ["اورژانس", "اطفال", "زنان", "جراحی"],
    photo: "assets/img/hospitals/kowsar.jpg"
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
    photo: "assets/img/hospitals/shafa.jpg"
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
    photo: "assets/img/hospitals/omid.jpg"
  }
];

// مارکرهای بیمارستان‌ها
const hospitalMarkers = {};

// تابع برای نمایش اعلان
function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.getElementById('notification');
  notification.innerHTML = `
    <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
    <span>${message}</span>
  `;
  
  notification.className = `notification show ${type}`;
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, duration);
}

// تابع برای نمایش/پنهان کردن لودینگ
function toggleLoading(show) {
  if (show) {
    loadingOverlay.classList.add('active');
  } else {
    loadingOverlay.classList.remove('active');
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
  toggleLoading(true);
  
  // حذف تمام لایه‌های موجود به جز مارکرها
  map.eachLayer(layer => {
    if (layer instanceof L.TileLayer || layer instanceof L.Control.Zoom) {
      map.removeLayer(layer);
    }
  });

  // اضافه کردن لایه جدید
  const tileLayer = L.tileLayer(
    currentTheme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    {
      attribution: '&copy; OpenStreetMap'
    }
  ).addTo(map);

  // فقط یک کنترل Zoom اضافه کنیم
  if (!map._zoomControl) {
    map._zoomControl = L.control.zoom({
      position: 'bottomright'
    }).addTo(map);
  }
  
  setTimeout(() => {
    toggleLoading(false);
  }, 500);
}

// تابع برای تغییر حالت تاریک/روشن
function toggleDarkMode() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  
  // تغییر آیکون دکمه
  btnDarkMode.innerHTML = currentTheme === 'light' 
    ? '<i class="fas fa-moon"></i>' 
    : '<i class="fas fa-sun"></i>';
  
  // بارگذاری مجدد لایه نقشه
  loadMapLayer();
  
  // به‌روزرسانی پاپ‌آپ‌ها
  updatePopups();
}

// تابع برای به‌روزرسانی پاپ‌آپ‌ها
function updatePopups() {
  Object.values(hospitalMarkers).forEach(marker => {
    const hospital = hospitals.find(h => h.id === marker.hospitalId);
    if (!hospital) return;
    
    // بستن پاپ‌آپ فعلی
    marker.closePopup();
    
    // ایجاد پاپ‌آپ جدید با تم فعلی
    marker.bindPopup(`
      <div class="popup-content">
        <h4>${hospital.name}</h4>
        <p><i class="fas fa-hospital"></i> ${hospital.type}</p>
        <p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
        <div class="popup-actions">
          <button class="popup-btn popup-btn-primary" data-id="${hospital.id}" data-action="route">
            <i class="fas fa-route"></i> مسیریابی
          </button>
        </div>
      </div>
    `);
    
    // باز کردن پاپ‌آپ اگر قبلاً باز بود
    if (marker._popup && marker._popup.isOpen()) {
      marker.openPopup();
    }
  });
}

// تابع برای یافتن موقعیت کاربر
function locateUser() {
  if (navigator.geolocation) {
    showNotification('در حال دریافت موقعیت شما...', 'info');
    toggleLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        isInBorujerd = checkIfInBorujerd(lat, lng);
        
        if (!isInBorujerd) {
          showNotification('شما در محدوده بروجرد نیستید', 'error');
          toggleLoading(false);
          return;
        }
        
        userLocation = { lat, lng };
        
        // حذف مارکر قبلی اگر وجود داشت
        if (userMarker) {
          map.removeLayer(userMarker);
        }
        
        // اضافه کردن مارکر جدید
        userMarker = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon
        }).addTo(map);
        
        userMarker.bindPopup('شما اینجا هستید').openPopup();
        
        // مرکزیت نقشه روی کاربر
        map.setView([userLocation.lat, userLocation.lng], 15);
        
        // نمایش بیمارستان‌های نزدیک
        showNearbyHospitals();
        
        showNotification('موقعیت شما با موفقیت مشخص شد', 'success');
        toggleLoading(false);
      },
      error => {
        console.error('خطا در دریافت موقعیت:', error);
        showNotification('خطا در دریافت موقعیت مکانی', 'error');
        toggleLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    showNotification('مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند', 'error');
  }
}

// تابع برای محاسبه فاصله بین دو نقطه
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
    ) / 1000; // تبدیل به کیلومتر
    
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
  
  // اضافه کردن رویدادها
  nearbyList.querySelectorAll('.nearby-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const hospitalId = parseInt(btn.getAttribute('data-id'));
      showHospitalOnMap(hospitalId);
    });
  });
  
  // نمایش پنل
  closeAllPanels();
  nearbyPanel.classList.add('open');
}

// تابع برای نمایش بیمارستان روی نقشه
function showHospitalOnMap(hospitalId) {
  const hospital = hospitals.find(h => h.id === hospitalId);
  if (!hospital) return;
  
  // مرکزیت نقشه روی بیمارستان
  map.setView(hospital.coords, 16, {
    animate: true,
    duration: 1
  });
  
  // باز کردن پاپ‌آپ
  if (hospitalMarkers[hospital.id]) {
    hospitalMarkers[hospital.id].openPopup();
  }
  
  closeAllPanels();
}

// تابع برای نمایش پنل مسیریابی
function showRoutePanel(hospitalId) {
  const hospital = hospitals.find(h => h.id === hospitalId);
  if (!hospital || !userLocation || !isInBorujerd) {
    showNotification('لطفاً ابتدا موقعیت خود را مشخص کنید و مطمئن شوید در بروجرد هستید', 'error');
    return;
  }
  
  selectedHospital = hospital;
  
  // حذف مسیر قبلی اگر وجود داشت
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }
  
  // ایجاد مسیر جدید
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
      styles: [{color: currentTheme === 'dark' ? '#43cea2' : '#185a9d', opacity: 0.7, weight: 5}]
    },
    createMarker: function() { return null; },
    collapsible: false,
    position: 'topleft',
    router: new L.Routing.osrmv1({
      serviceUrl: 'https://router.project-osrm.org/route/v1',
      profile: 'foot' // همیشه پیاده محاسبه شود
    })
  }).addTo(map);
  
  routingControl.on('routesfound', function(e) {
    const route = e.routes[0];
    const distance = (route.summary.totalDistance / 1000).toFixed(1);
    const walkTime = Math.round(route.summary.totalTime / 60); // دقیقه پیاده
    const driveTime = Math.round((route.summary.totalDistance / 1000) * 2.5); // تقریباً 2.5 دقیقه به ازای هر کیلومتر با ماشین
    
    document.getElementById('route-distance').textContent = `${distance} کیلومتر`;
    document.getElementById('route-time-walk').textContent = `${walkTime} دقیقه (پیاده)`;
    document.getElementById('route-time-drive').textContent = `${driveTime} دقیقه (ماشین)`;
  });
  
  // نمایش پنل
  closeAllPanels();
  routePanel.classList.add('open');
}

// تابع برای بستن همه پنل‌ها
function closeAllPanels() {
  nearbyPanel.classList.remove('open');
  routePanel.classList.remove('open');
  sidebarMenu.classList.remove('open');
  
  // حذف مسیر اگر وجود داشت
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }
}

// تابع برای مقداردهی اولیه
function init() {
  // بارگذاری تم ذخیره شده
  const savedTheme = localStorage.getItem('theme') || 'light';
  currentTheme = savedTheme;
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  // تنظیم آیکون اولیه
  btnDarkMode.innerHTML = currentTheme === 'light' 
    ? '<i class="fas fa-moon"></i>' 
    : '<i class="fas fa-sun"></i>';
  
  // بارگذاری لایه نقشه
  loadMapLayer();
  
  // ایجاد مارکرهای بیمارستان‌ها
  hospitals.forEach(hospital => {
    const marker = L.marker(hospital.coords, {
      icon: hospitalIcon,
      riseOnHover: true
    }).addTo(map);
    
    // اضافه کردن ID بیمارستان به مارکر
    marker.hospitalId = hospital.id;
    
    // ایجاد پاپ‌آپ
    marker.bindPopup(`
      <div class="popup-content">
        <h4>${hospital.name}</h4>
        <p><i class="fas fa-hospital"></i> ${hospital.type}</p>
        <p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
        <div class="popup-actions">
          <button class="popup-btn popup-btn-primary" data-id="${hospital.id}" data-action="route">
            <i class="fas fa-route"></i> مسیریابی
          </button>
        </div>
      </div>
    `);
    
    // رویداد کلیک روی دکمه مسیریابی در پاپ‌آپ
    marker.on('popupopen', () => {
      document.querySelector(`.popup-btn[data-action="route"]`).addEventListener('click', () => {
        const hospitalId = parseInt(document.querySelector(`.popup-btn[data-action="route"]`).getAttribute('data-id'));
        showRoutePanel(hospitalId);
      });
    });
    
    hospitalMarkers[hospital.id] = marker;
  });
  
  // رویدادها
  btnDarkMode.addEventListener('click', toggleDarkMode);
  btnLocate.addEventListener('click', locateUser);
  btnMenu.addEventListener('click', () => sidebarMenu.classList.add('open'));
  btnCloseMenu.addEventListener('click', () => sidebarMenu.classList.remove('open'));
  
  btnClosePanels.forEach(btn => {
    btn.addEventListener('click', closeAllPanels);
  });
  
  menuNearby.addEventListener('click', () => {
    sidebarMenu.classList.remove('open');
    showNearbyHospitals();
  });
  
  menuFavorites.addEventListener('click', () => {
    sidebarMenu.classList.remove('open');
    showNotification('بخش موردعلاقه‌ها در حال توسعه است', 'info');
  });
  
  menuSettings.addEventListener('click', () => {
    sidebarMenu.classList.remove('open');
    showNotification('بخش تنظیمات در حال توسعه است', 'info');
  });
  
  btnStartRoute.addEventListener('click', () => {
    showNotification('سیستم مسیریابی در حال توسعه است و به زودی فعال خواهد شد', 'info');
  });
  
  // بستن پنل‌ها با کلیک خارج از آنها
  document.addEventListener('click', (e) => {
    if (!nearbyPanel.contains(e.target) && !e.target.closest('.popup-btn[data-action="route"]')) {
      nearbyPanel.classList.remove('open');
    }
    if (!routePanel.contains(e.target) && !e.target.closest('.popup-btn[data-action="route"]')) {
      routePanel.classList.remove('open');
      if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
      }
    }
    if (!sidebarMenu.contains(e.target) && !btnMenu.contains(e.target)) {
      sidebarMenu.classList.remove('open');
    }
  });
}

// شروع برنامه
document.addEventListener('DOMContentLoaded', init);