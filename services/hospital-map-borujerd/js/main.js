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

// لایه پس‌زمینه
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// کنترل‌های نقشه
L.control.zoom({
  position: 'bottomright'
}).addTo(map);

// جستجوی آدرس
L.Control.geocoder({
  defaultMarkGeocode: false,
  position: 'topleft',
  placeholder: 'جستجوی آدرس...',
  errorMessage: 'آدرس یافت نشد',
  showResultIcons: true,
  collapsed: true
})
.on('markgeocode', function(e) {
  map.fitBounds(e.geocode.bbox);
})
.addTo(map);

// آیکون‌های سفارشی
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

// داده بیمارستان‌ها
const hospitals = [
  {
    id: 1,
    name: "بیمارستان شهید چمران",
    coords: [33.89684661387162, 48.74189615249634],
    address: "بروجرد، بلوار دکتر نصرالهی، بین میدان زینب کبری و شهید رجائی",
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
    address: "بروجرد، سید مصطفی خمینی، گیوه کش (محله‌ی پدافند)",
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
    address: "بروجرد، بلوار صفا، جعفری، 18 متری، شهید مطیعی (محله‌ی صوفیان)",
    phone: "066-43230000",
    type: "خصوصی",
    emergency: false,
    specialties: ["زنان", "اطفال", "چشم پزشکی"],
    photo: "images/hospital-photos/behbood.jpg"
  },
  {
    id: 4,
    name: "بیمارستان تأمین اجتماعی کوثر",
    coords: [33.8777597, 48.7662033],
    address: "بروجرد، بلوار امام خمینی، میدان امام خمینی",
    phone: "066-43240000",
    type: "تأمین اجتماعی",
    emergency: true,
    specialties: ["اورژانس", "اطفال", "زنان", "جراحی"],
    photo: "images/hospital-photos/kowsar.jpg"
  }
];

// مارکرهای بیمارستان‌ها
const hospitalMarkers = {};
hospitals.forEach(hospital => {
  const marker = L.marker(hospital.coords, {
    icon: hospitalIcon,
    riseOnHover: true
  }).addTo(map);
  
  const specialtiesList = hospital.specialties.map(spec => `<li>${spec}</li>`).join('');
  
  marker.bindPopup(`
    <div class="popup-content">
      <h4>${hospital.name}</h4>
      <div class="hospital-type ${hospital.type.replace(/\s+/g, '-')}">
        <i class="fas fa-hospital"></i> ${hospital.type}
        ${hospital.emergency ? '<span class="emergency-badge"><i class="fas fa-ambulance"></i> اورژانس</span>' : ''}
      </div>
      <p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
      <p><i class="fas fa-phone"></i> ${hospital.phone}</p>
      <div class="hospital-specialties">
        <h5>تخصص‌ها:</h5>
        <ul>${specialtiesList}</ul>
      </div>
      <div class="popup-actions">
        <button class="btn-route" data-id="${hospital.id}">
          <i class="fas fa-route"></i> مسیریابی
        </button>
        <button class="btn-favorite" data-id="${hospital.id}">
          <i class="far fa-heart"></i> ذخیره
        </button>
      </div>
    </div>
  `);
  
  hospitalMarkers[hospital.id] = marker;
});

// متغیرهای وضعیت
let userLocation = null;
let userMarker = null;
let routingControl = null;
let currentTheme = 'light';
let favorites = JSON.parse(localStorage.getItem('hospitalFavorites')) || [];

// عناصر DOM
const sidebar = document.getElementById('sidebar');
const searchInput = document.getElementById('search-input');
const typeFilter = document.getElementById('type-filter');
const distanceFilter = document.getElementById('distance-filter');
const hospitalList = document.getElementById('hospital-list');
const resultsCount = document.getElementById('results-count');
const btnOpenSearch = document.getElementById('btn-open-search');
const btnCloseSidebar = document.querySelector('.btn-close-sidebar');
const btnLocate = document.querySelector('.btn-locate');
const btnRouting = document.getElementById('btn-routing');
const btnDarkMode = document.querySelector('.btn-dark-mode');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const nearbyTab = document.getElementById('nearby-tab');

// رویدادها
btnOpenSearch.addEventListener('click', () => {
  sidebar.classList.add('open');
  document.querySelector('[data-tab="search"]').click();
});

btnCloseSidebar.addEventListener('click', () => {
  sidebar.classList.remove('open');
});

btnLocate.addEventListener('click', locateUser);

btnRouting.addEventListener('click', () => {
  if (!userLocation) {
    alert('لطفاً ابتدا موقعیت خود را مشخص کنید');
    return;
  }
  
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
    btnRouting.innerHTML = '<i class="fas fa-route"></i>';
    return;
  }
  
  sidebar.classList.add('open');
  document.querySelector('[data-tab="search"]').click();
  
  hospitalList.innerHTML = `
    <li class="route-instruction">
      <h4>مسیریابی به بیمارستان</h4>
      <p>لطفاً بیمارستان مقصد را انتخاب کنید</p>
    </li>
  `;
  
  hospitals.forEach(hospital => {
    const li = document.createElement('li');
    li.innerHTML = `
      <h4>${hospital.name}</h4>
      <p>${hospital.address}</p>
      <button class="btn-select-route" data-id="${hospital.id}">
        <i class="fas fa-route"></i> مسیریابی
      </button>
    `;
    hospitalList.appendChild(li);
    
    li.querySelector('.btn-select-route').addEventListener('click', () => {
      calculateRoute(hospital.coords);
    });
  });
});

btnDarkMode.addEventListener('click', toggleDarkMode);

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // حذف کلاس active از همه دکمه‌ها و محتواها
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    // اضافه کردن کلاس active به دکمه و محتوای انتخاب شده
    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    document.getElementById(`${tabId}-tab`).classList.add('active');
    
    // بروزرسانی محتوا بر اساس تب انتخاب شده
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

searchInput.addEventListener('input', filterHospitals);
typeFilter.addEventListener('change', filterHospitals);
distanceFilter.addEventListener('change', filterHospitals);

// توابع
function locateUser() {
  if (navigator.geolocation) {
    btnLocate.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    navigator.geolocation.getCurrentPosition(
      position => {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
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
        
        // آپدیت دکمه
        btnLocate.innerHTML = '<i class="fas fa-location-arrow"></i>';
        
        // فیلتر بیمارستان‌ها
        filterHospitals();
        showNearbyHospitals();
      },
      error => {
        console.error('خطا در دریافت موقعیت:', error);
        alert('خطا در دریافت موقعیت مکانی');
        btnLocate.innerHTML = '<i class="fas fa-location-arrow"></i>';
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    alert('مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند');
  }
}

function filterHospitals() {
  const searchTerm = searchInput.value.toLowerCase();
  const typeFilterValue = typeFilter.value;
  const distanceFilterValue = distanceFilter.value;
  
  let filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchTerm) || 
                         hospital.address.toLowerCase().includes(searchTerm);
    
    if (!matchesSearch) return false;
    
    if (typeFilterValue !== 'all' && hospital.type !== typeFilterValue) {
      return false;
    }
    
    if (distanceFilterValue !== 'all' && userLocation) {
      const distance = getDistance(
        userLocation.lat, 
        userLocation.lng,
        hospital.coords[0],
        hospital.coords[1]
      ) / 1000; // تبدیل به کیلومتر
      
      return distance <= parseInt(distanceFilterValue);
    }
    
    return true;
  });
  
  updateHospitalList(filteredHospitals);
}

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
    if (userLocation) {
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
        <button class="btn-call" data-phone="${hospital.phone}">
          <i class="fas fa-phone"></i> تماس
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
    
    li.querySelector('.btn-call').addEventListener('click', (e) => {
      e.stopPropagation();
      window.open(`tel:${hospital.phone}`);
    });
    
    hospitalList.appendChild(li);
  });
}

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

function calculateRoute(destination) {
  if (!userLocation) return;
  
  if (routingControl) {
    map.removeControl(routingControl);
  }
  
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
    position: 'topleft'
  }).addTo(map);
  
  btnRouting.innerHTML = '<i class="fas fa-times"></i>';
  sidebar.classList.remove('open');
}

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

function showNearbyHospitals() {
  if (!userLocation) {
    nearbyTab.innerHTML = `
      <div class="location-info">
        <i class="fas fa-info-circle"></i>
        <p>برای مشاهده بیمارستان‌های نزدیک، موقعیت خود را مشخص کنید</p>
        <button class="btn-locate-now">مشخص کردن موقعیت</button>
      </div>
    `;
    
    nearbyTab.querySelector('.btn-locate-now').addEventListener('click', locateUser);
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
            <button class="btn-route" data-id="${hospital.id}">
              <i class="fas fa-route"></i>
            </button>
          </div>
        </div>
      </li>
    `;
  });
  
  html += `</ul>`;
  nearbyTab.innerHTML = html;
  
  // اضافه کردن رویدادها
  nearbyTab.querySelectorAll('.btn-show-on-map').forEach(btn => {
    btn.addEventListener('click', () => {
      const hospitalId = parseInt(btn.getAttribute('data-id'));
      showHospitalOnMap(hospitalId);
    });
  });
  
  nearbyTab.querySelectorAll('.btn-route').forEach(btn => {
    btn.addEventListener('click', () => {
      const hospitalId = parseInt(btn.getAttribute('data-id'));
      const hospital = hospitals.find(h => h.id === hospitalId);
      if (hospital) {
        calculateRoute(hospital.coords);
      }
    });
  });
}

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

function toggleFavorite(hospitalId) {
  const index = favorites.indexOf(hospitalId);
  if (index === -1) {
    favorites.push(hospitalId);
  } else {
    favorites.splice(index, 1);
  }
  
  localStorage.setItem('hospitalFavorites', JSON.stringify(favorites));
  
  // بروزرسانی نمایش
  if (document.querySelector('.tab-btn.active').getAttribute('data-tab') === 'favorites') {
    showFavoriteHospitals();
  } else {
    filterHospitals();
  }
}

function toggleDarkMode() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  
  btnDarkMode.innerHTML = currentTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

// مقداردهی اولیه
function init() {
  // بارگذاری تم ذخیره شده
  const savedTheme = localStorage.getItem('theme') || 'light';
  currentTheme = savedTheme;
  document.documentElement.setAttribute('data-theme', currentTheme);
  btnDarkMode.innerHTML = currentTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
  
  // بارگذاری اولیه داده‌ها
  filterHospitals();
  showNearbyHospitals();
  showFavoriteHospitals();
}

init();