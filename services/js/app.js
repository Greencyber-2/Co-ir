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
let currentTransportMode = 'walk';
let isInBorujerd = false;
let selectedHospital = null;
let routingControl = null;

// عناصر DOM
const hospitalPanel = document.getElementById('hospital-panel');
const routePanel = document.getElementById('route-panel');
const nearbyPanel = document.getElementById('nearby-panel');
const quickMenu = document.getElementById('quick-menu');
const notification = document.getElementById('notification');
const loadingOverlay = document.getElementById('loading');
const btnDarkMode = document.querySelector('.btn-dark-mode');
const btnLocate = document.querySelector('.btn-locate');
const btnShowNearby = document.getElementById('btn-show-nearby');
const btnShowMenu = document.getElementById('btn-show-menu');
const btnClosePanels = document.querySelectorAll('.btn-close-panel');
const btnStartRoute = document.getElementById('btn-start-route');
const transportBtns = document.querySelectorAll('.transport-btn');

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
    name: "بیمارستان تأمین اجتماعی کوثری",
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

// تابع برای نمایش لودینگ
function showLoading(show = true) {
  if (show) {
    loadingOverlay.classList.add('active');
  } else {
    loadingOverlay.classList.remove('active');
  }
}

// تابع برای نمایش اعلان
function showNotification(message, duration = 3000) {
  const notificationMessage = document.getElementById('notification-message');
  notificationMessage.textContent = message;
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, duration);
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
  showLoading(true);
  
  // حذف لایه‌های قبلی
  map.eachLayer(layer => {
    if (layer instanceof L.TileLayer || layer instanceof L.Control.Zoom) {
      map.removeLayer(layer);
    }
  });

  // اضافه کردن لایه جدید بر اساس تم فعلی
  const tileLayerUrl = currentTheme === 'dark' 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  L.tileLayer(tileLayerUrl, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // اضافه کردن کنترل زوم
  L.control.zoom({
    position: 'bottomright'
  }).addTo(map);
  
  setTimeout(() => {
    showLoading(false);
  }, 500);
}

// تابع برای تغییر حالت تاریک/روشن
function toggleDarkMode() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  
  btnDarkMode.innerHTML = currentTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
  
  // بارگذاری مجدد لایه نقشه
  loadMapLayer();
  
  // به‌روزرسانی پاپ‌آپ‌ها
  updatePopups();
}

// تابع برای به‌روزرسانی پاپ‌آپ‌ها
function updatePopups() {
  Object.values(hospitalMarkers).forEach(marker => {
    marker.closePopup();
    marker.openPopup();
  });
}

// تابع برای یافتن موقعیت کاربر
function locateUser() {
  if (navigator.geolocation) {
    showNotification('در حال دریافت موقعیت شما...');
    showLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        isInBorujerd = checkIfInBorujerd(lat, lng);
        
        if (!isInBorujerd) {
          showNotification('شما در محدوده بروجرد نیستید');
          showLoading(false);
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
        
        showNotification('موقعیت شما با موفقیت مشخص شد');
        showLoading(false);
      },
      error => {
        console.error('خطا در دریافت موقعیت:', error);
        showNotification('خطا در دریافت موقعیت مکانی');
        showLoading(false);
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
        <button class="nearby-btn nearby-btn-primary" data-id="${hospital.id}" data-action="show">
          <i class="fas fa-map-marked-alt"></i> نمایش روی نقشه
        </button>
        <button class="nearby-btn" data-id="${hospital.id}" data-action="details">
          <i class="fas fa-info-circle"></i> جزئیات
        </button>
      </div>
    `;
    
    nearbyList.appendChild(item);
  });
  
  // اضافه کردن رویدادها
  nearbyList.querySelectorAll('.nearby-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const hospitalId = parseInt(btn.getAttribute('data-id'));
      const action = btn.getAttribute('data-action');
      
      if (action === 'show') {
        showHospitalOnMap(hospitalId);
      } else if (action === 'details') {
        showHospitalDetails(hospitalId);
      }
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

// تابع برای نمایش جزئیات بیمارستان
function showHospitalDetails(hospitalId) {
  const hospital = hospitals.find(h => h.id === hospitalId);
  if (!hospital) return;
  
  selectedHospital = hospital;
  
  // پر کردن اطلاعات در پنل
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
  
  // تنظیم وضعیت دکمه ذخیره
  const btnFavorite = document.getElementById('btn-favorite');
  const isFavorite = favorites.includes(hospital.id);
  btnFavorite.innerHTML = isFavorite ? '<i class="fas fa-heart"></i> ذخیره شده' : '<i class="far fa-heart"></i> ذخیره';
  btnFavorite.classList.toggle('favorited', isFavorite);
  
  // نمایش پنل
  closeAllPanels();
  hospitalPanel.classList.add('open');
  
  // مرکزیت نقشه روی بیمارستان
  map.setView(hospital.coords, 16, {
    animate: true,
    duration: 1
  });
  
  // باز کردن پاپ‌آپ
  if (hospitalMarkers[hospital.id]) {
    hospitalMarkers[hospital.id].openPopup();
  }
}

// تابع برای نمایش پنل مسیریابی
function showRoutePanel(hospitalId) {
  const hospital = hospitals.find(h => h.id === hospitalId);
  if (!hospital || !userLocation || !isInBorujerd) {
    showNotification('لطفاً ابتدا موقعیت خود را مشخص کنید و مطمئن شوید در بروجرد هستید');
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
    document.getElementById('route-mode').textContent = currentTransportMode === 'walk' ? 'پیاده' : 'ماشین';
    document.getElementById('route-mode-icon').className = currentTransportMode === 'walk' 
      ? 'fas fa-walking' 
      : 'fas fa-car';
    
    // نمایش دستورالعمل‌های مسیر
    const instructionsContainer = document.getElementById('route-instructions');
    instructionsContainer.innerHTML = '';
    
    routes[0].instructions.forEach((instruction, index) => {
      const instructionItem = document.createElement('div');
      instructionItem.className = 'route-instruction-item';
      
      const icon = document.createElement('i');
      icon.className = 'route-instruction-icon';
      
      // تعیین آیکون مناسب بر اساس نوع دستور
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
  
  // نمایش پنل
  closeAllPanels();
  routePanel.classList.add('open');
}

// تابع برای ذخیره/حذف بیمارستان از موردعلاقه‌ها
function toggleFavorite(hospitalId) {
  const index = favorites.indexOf(hospitalId);
  if (index === -1) {
    favorites.push(hospitalId);
    showNotification('بیمارستان به موردعلاقه‌ها اضافه شد');
  } else {
    favorites.splice(index, 1);
    showNotification('بیمارستان از موردعلاقه‌ها حذف شد');
  }
  
  localStorage.setItem('hospitalFavorites', JSON.stringify(favorites));
  
  // به‌روزرسانی دکمه ذخیره
  if (selectedHospital && selectedHospital.id === hospitalId) {
    const btnFavorite = document.getElementById('btn-favorite');
    const isFavorite = favorites.includes(hospitalId);
    btnFavorite.innerHTML = isFavorite ? '<i class="fas fa-heart"></i> ذخیره شده' : '<i class="far fa-heart"></i> ذخیره';
    btnFavorite.classList.toggle('favorited', isFavorite);
  }
  
  // به‌روزرسانی مارکر
  if (hospitalMarkers[hospitalId]) {
    hospitalMarkers[hospitalId].openPopup();
  }
}

// تابع برای بستن همه پنل‌ها
function closeAllPanels() {
  hospitalPanel.classList.remove('open');
  routePanel.classList.remove('open');
  nearbyPanel.classList.remove('open');
  quickMenu.classList.remove('open');
  
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
  btnDarkMode.innerHTML = currentTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
  
  // بارگذاری لایه نقشه
  loadMapLayer();
  
  // ایجاد مارکرهای بیمارستان‌ها
  hospitals.forEach(hospital => {
    const marker = L.marker(hospital.coords, {
      icon: hospitalIcon,
      riseOnHover: true
    }).addTo(map);
    
    const isFavorite = favorites.includes(hospital.id);
    
    marker.bindPopup(`
      <div class="popup-content">
        <h4>${hospital.name}</h4>
        <p><i class="fas fa-hospital"></i> ${hospital.type}</p>
        <p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
        <div class="popup-actions">
          <button class="popup-btn popup-btn-primary" data-id="${hospital.id}" data-action="details">
            <i class="fas fa-info-circle"></i> جزئیات
          </button>
          <button class="popup-btn popup-btn-secondary" data-id="${hospital.id}" data-action="route">
            <i class="fas fa-route"></i> مسیر
          </button>
        </div>
      </div>
    `);
    
    marker.on('popupopen', () => {
      document.querySelector(`.popup-btn[data-action="details"]`).addEventListener('click', () => {
        const hospitalId = parseInt(document.querySelector(`.popup-btn[data-action="details"]`).getAttribute('data-id'));
        showHospitalDetails(hospitalId);
      });
      
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
  btnShowNearby.addEventListener('click', showNearbyHospitals);
  btnShowMenu.addEventListener('click', () => {
    quickMenu.classList.toggle('open');
  });
  
  btnClosePanels.forEach(btn => {
    btn.addEventListener('click', closeAllPanels);
  });
  
  document.getElementById('btn-call-hospital').addEventListener('click', () => {
    if (selectedHospital) {
      window.open(`tel:${selectedHospital.phone}`);
    }
  });
  
  document.getElementById('btn-favorite').addEventListener('click', () => {
    if (selectedHospital) {
      toggleFavorite(selectedHospital.id);
    }
  });
  
  document.getElementById('btn-show-route').addEventListener('click', () => {
    if (selectedHospital) {
      showRoutePanel(selectedHospital.id);
    }
  });
  
  transportBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      transportBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTransportMode = btn.getAttribute('data-mode');
      
      if (selectedHospital && routePanel.classList.contains('open')) {
        showRoutePanel(selectedHospital.id);
      }
    });
  });
  
  document.getElementById('btn-start-route').addEventListener('click', () => {
    showNotification('سیستم مسیریابی در حال توسعه است و به زودی فعال خواهد شد');
  });
  
  document.getElementById('menu-search').addEventListener('click', () => {
    quickMenu.classList.remove('open');
    showNotification('سیستم جستجو در حال توسعه است');
  });
  
  document.getElementById('menu-nearby').addEventListener('click', () => {
    quickMenu.classList.remove('open');
    showNearbyHospitals();
  });
  
  document.getElementById('menu-favorites').addEventListener('click', () => {
    quickMenu.classList.remove('open');
    showNotification('بخش موردعلاقه‌ها در حال توسعه است');
  });
  
  // بستن پنل‌ها با کلیک خارج از آنها
  document.addEventListener('click', (e) => {
    if (!hospitalPanel.contains(e.target) && !e.target.closest('.popup-btn[data-action="details"]')) {
      hospitalPanel.classList.remove('open');
    }
    if (!routePanel.contains(e.target) && !e.target.closest('.popup-btn[data-action="route"]')) {
      routePanel.classList.remove('open');
      if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
      }
    }
    if (!nearbyPanel.contains(e.target) && !btnShowNearby.contains(e.target)) {
      nearbyPanel.classList.remove('open');
    }
    if (!quickMenu.contains(e.target) && !btnShowMenu.contains(e.target)) {
      quickMenu.classList.remove('open');
    }
  });
}

// شروع برنامه
document.addEventListener('DOMContentLoaded', init);