// داده‌های بیمارستان‌ها
const hospitals = [
  {
    id: 1,
    name: "بیمارستان شهید چمران",
    coords: [33.89684661387162, 48.74189615249634],
    address: "بروجرد، بلوار دکتر نصرالهی، بین میدان زینب کبری و شهید رجائی",
    phone: "066-42220000",
    emergency: "066-42221111",
    website: "http://chamran.brums.ac.ir",
    type: "دولتی",
    services: "اورژانس، ICU، CCU، اتاق عمل، آزمایشگاه"
  },
  {
    id: 2,
    name: "بیمارستان امام خمینی (ره)",
    coords: [33.90148164166486, 48.74766021966935],
    address: "بروجرد، سید مصطفی خمینی، گیوه کش (محله‌ی پدافند)",
    phone: "066-42230000",
    emergency: "066-42231111",
    website: "",
    type: "دولتی",
    services: "اورژانس، ICU، زایمان، کودکان"
  },
  {
    id: 3,
    name: "بیمارستان بهبود",
    coords: [33.89666880647936, 48.76236081841194],
    address: "بروجرد، بلوار صفا، جعفری، 18 متری، شهید مطیعی (محله‌ی صوفیان)",
    phone: "066-42250000",
    emergency: "066-42251111",
    website: "http://behbudhospital.ir",
    type: "خصوصی",
    services: "اورژانس، جراحی، چشم پزشکی، ارتوپدی"
  },
  {
    id: 4,
    name: "بیمارستان تأمین اجتماعی کوثر",
    coords: [33.8777597, 48.7662033],
    address: "بروجرد، بلوار امام خمینی، میدان امام خمینی",
    phone: "066-42240000",
    emergency: "066-42241111",
    website: "",
    type: "دولتی",
    services: "اورژانس، داخلی، جراحی، زنان و زایمان"
  }
];

// متغیرهای جهانی
let map;
let userLocation = null;
let hospitalMarkers = [];
let nearestHospital = null;

// مقداردهی اولیه نقشه
function initMap() {
  // ایجاد نقشه
  map = L.map('map', {
    center: [33.8973, 48.7543],
    zoom: 14,
    minZoom: 12,
    maxZoom: 18,
    zoomControl: true,
    maxBounds: [
      [33.75, 48.60],
      [34.00, 48.90]
    ],
    maxBoundsViscosity: 0.2
  });

  // اضافه کردن لایه نقشه
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // کنترل مکان‌یابی
  L.control.locate({
    position: 'bottomright',
    strings: {
      title: "نمایش موقعیت من",
      popup: "شما در این محدوده هستید (تقریبا {distance} متر از این نقطه)",
      outsideMapBoundsMsg: "شما خارج از محدوده نقشه هستید"
    },
    locateOptions: {
      maxZoom: 16,
      enableHighAccuracy: true
    }
  }).addTo(map);

  // آیکون سفارشی برای بیمارستان‌ها
  const hospitalIcon = L.icon({
    iconUrl: 'images/hospital-icon.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    shadowUrl: 'images/hospital-shadow.png',
    shadowSize: [50, 50],
    shadowAnchor: [25, 50]
  });

  // اضافه کردن بیمارستان‌ها به نقشه
  hospitals.forEach(hospital => {
    const marker = L.marker(hospital.coords, { 
      icon: hospitalIcon,
      hospitalId: hospital.id
    }).addTo(map);
    
    hospitalMarkers.push(marker);
    
    // ایجاد محتوای پاپ‌آپ
    const popupContent = `
      <div class="hospital-popup">
        <h3>${hospital.name}</h3>
        <p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
        ${hospital.phone ? `<p><i class="fas fa-phone"></i> تلفن: ${hospital.phone}</p>` : ''}
        ${hospital.emergency ? `<p><i class="fas fa-ambulance"></i> اورژانس: ${hospital.emergency}</p>` : ''}
        ${hospital.website ? `<p><i class="fas fa-globe"></i> <a href="${hospital.website}" target="_blank">وبسایت</a></p>` : ''}
        <p><i class="fas fa-info-circle"></i> نوع: ${hospital.type}</p>
        <button class="show-route-btn" data-lat="${hospital.coords[0]}" data-lng="${hospital.coords[1]}">
          <i class="fas fa-route"></i> نمایش مسیر
        </button>
      </div>
    `;
    
    marker.bindPopup(popupContent);
  });

  // پر کردن لیست بیمارستان‌ها در سایدبار
  renderHospitalsList();
}

// نمایش لیست بیمارستان‌ها در سایدبار
function renderHospitalsList() {
  const listContainer = document.getElementById('hospitalsList');
  listContainer.innerHTML = '';
  
  hospitals.forEach(hospital => {
    const hospitalItem = document.createElement('div');
    hospitalItem.className = 'hospital-item';
    hospitalItem.dataset.id = hospital.id;
    
    // محاسبه فاصله اگر موقعیت کاربر مشخص باشد
    let distanceInfo = '';
    if (userLocation) {
      const distance = calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        hospital.coords[0], 
        hospital.coords[1]
      );
      distanceInfo = `<span class="distance">${distance.toFixed(1)} کیلومتر</span>`;
    }
    
    hospitalItem.innerHTML = `
      <h4><i class="fas fa-hospital"></i> ${hospital.name}</h4>
      <p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
      <p><i class="fas fa-phone"></i> ${hospital.phone}</p>
      ${distanceInfo}
    `;
    
    hospitalItem.addEventListener('click', () => {
      const marker = hospitalMarkers.find(m => m.options.hospitalId === hospital.id);
      if (marker) {
        map.setView(marker.getLatLng(), 16);
        marker.openPopup();
      }
    });
    
    listContainer.appendChild(hospitalItem);
  });
}

// محاسبه فاصله بین دو نقطه جغرافیایی (کیلومتر)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // شعاع زمین در کیلومتر
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// یافتن نزدیک‌ترین بیمارستان
function findNearestHospital() {
  showLoading();
  
  if (!navigator.geolocation) {
    hideLoading();
    alert('مرورگر شما از قابلیت مکان‌یابی پشتیبانی نمی‌کند.');
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    position => {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      // محاسبه فاصله تا همه بیمارستان‌ها
      let minDistance = Infinity;
      let nearest = null;
      
      hospitals.forEach(hospital => {
        const distance = calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          hospital.coords[0], 
          hospital.coords[1]
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearest = hospital;
        }
      });
      
      nearestHospital = nearest;
      
      // نمایش نتیجه
      if (nearest) {
        // حرکت نقشه به سمت بیمارستان و موقعیت کاربر
        const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        [nearest.coords[0], nearest.coords[1]]
        ]); // ← این پرانتز و براکت بسته نشده بود



        map.fitBounds(bounds, { padding: [50, 50] });
        
        // نمایش مارکر موقعیت کاربر
        if (window.userMarker) {
          map.removeLayer(window.userMarker);
        }
        
        window.userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
          radius: 8,
          fillColor: "#4285F4",
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map).bindPopup("موقعیت فعلی شما");
        
        // باز کردن پاپ‌آپ بیمارستان نزدیک
        const marker = hospitalMarkers.find(m => m.options.hospitalId === nearest.id);
        if (marker) {
          marker.openPopup();
        }
        
        // نمایش اعلان
        alert(`نزدیک‌ترین بیمارستان به شما:\n${nearest.name}\nفاصله: ${minDistance.toFixed(1)} کیلومتر`);
        
        // بروزرسانی لیست بیمارستان‌ها با فواصل
        renderHospitalsList();
      }
      
      hideLoading();
    },
    error => {
      hideLoading();
      switch(error.code) {
        case error.PERMISSION_DENIED:
          alert("دسترسی به موقعیت مکانی شما رد شد. لطفاً تنظیمات مرورگر خود را بررسی کنید.");
          break;
        case error.POSITION_UNAVAILABLE:
          alert("اطلاعات موقعیت مکانی در دسترس نیست.");
          break;
        case error.TIMEOUT:
          alert("دریافت موقعیت مکانی زمان‌بر شد.");
          break;
        default:
          alert("خطای ناشناخته در دریافت موقعیت مکانی.");
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// نمایش/مخفی کردن سایدبار
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
}

// نمایش/مخفی کردن مدال درباره
function toggleAboutModal() {
  const modal = document.getElementById('aboutModal');
  modal.classList.toggle('active');
}

// نمایش ایندیکاتور بارگذاری
function showLoading() {
  document.getElementById('loadingIndicator').classList.add('active');
}

// مخفی کردن ایندیکاتور بارگذاری
function hideLoading() {
  document.getElementById('loadingIndicator').classList.remove('active');
}

// رویدادهای کلیک
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  
  // دکمه یافتن نزدیک‌ترین بیمارستان
  document.getElementById('findNearestBtn').addEventListener('click', findNearestHospital);
  
  // دکمه درباره پروژه
  document.getElementById('aboutBtn').addEventListener('click', toggleAboutModal);
  
  // دکمه بستن سایدبار
  document.getElementById('closeSidebar').addEventListener('click', toggleSidebar);
  
  // دکمه‌های بستن مدال
  document.querySelectorAll('.close-btn').forEach(btn => {
    if (btn.id !== 'closeSidebar') {
      btn.addEventListener('click', function() {
        this.closest('.modal').classList.remove('active');
      });
    }
  });
  
  // کلیک خارج از مدال برای بستن آن
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('active');
      }
    });
  });
  
  // رویداد کلیک روی دکمه‌های نمایش مسیر در پاپ‌آپها
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('show-route-btn') || e.target.closest('.show-route-btn')) {
      const btn = e.target.classList.contains('show-route-btn') ? 
        e.target : e.target.closest('.show-route-btn');
      const lat = parseFloat(btn.dataset.lat);
      const lng = parseFloat(btn.dataset.lng);
      
      if (userLocation) {
        // نمایش مسیر بین کاربر و بیمارستان
        if (window.routeLayer) {
          map.removeLayer(window.routeLayer);
        }
        
        window.routeLayer = L.polyline([
          [userLocation.lat, userLocation.lng],
          [lat, lng]
        ], {
          color: '#4285F4',
          weight: 4,
          dashArray: '10, 10'
        }).addTo(map);
        
        alert('مسیر بین موقعیت شما و بیمارستان روی نقشه نمایش داده شد.');
      } else {
        alert('لطفاً ابتدا موقعیت خود را با استفاده از دکمه "یافتن نزدیک‌ترین بیمارستان" مشخص کنید.');
      }
    }
  });
});