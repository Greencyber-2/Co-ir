// بیمارستان‌های بروجرد
const hospitals = [
    {
        id: 1,
        name: "بیمارستان امام خمینی (ره)",
        address: "بروجرد، خیابان سید مصطفی خمینی، گیوه‌کش، محله پدافند",
        phone: "۰۶۶۴۲۵۰۳۰۵۴",
        hours: "شبانه‌روزی",
        services: "بیمارستان عمومی با بخش آزمایشگاه، اورژانس و خدمات پایه درمانی",
        lat: 33.9011,
        lng: 48.7475,
        type: "general"
    },
    {
        id: 2,
        name: "بیمارستان آیت‌الله بروجردی",
        address: "بروجرد، بلوار شهید فخری‌زاده، شهرک مهرگان",
        phone: "۰۶۶۴۲۳۴۷۶۰۳",
        hours: "شبانه‌روزی",
        services: "بیمارستان فوق تخصصی با ICU، آنکولوژی، گوارش و ...",
        lat: 33.93,
        lng: 48.73,
        type: "specialized"
    },
    {
        id: 3,
        name: "بیمارستان تامین اجتماعی کوثر",
        address: "بروجرد، میدان امام خمینی، محله امام خمینی",
        phone: "۰۶۶۴۲۴۴۹۹۷۵",
        hours: "۷ صبح تا ۱۰ شب",
        services: "بیمارستان عمومی با بخش‌های داخلی و جراحی",
        lat: 33.90,
        lng: 48.75,
        type: "general"
    },
    {
        id: 4,
        name: "بیمارستان شهید دکتر چمران",
        address: "بروجرد، خیابان دکتر فاطمی، میدان پرستار",
        phone: "۰۶۶۴۲۵۱۴۰۰۱ - ۰۶۶۴۲۵۱۴۰۰۵",
        hours: "شبانه‌روزی",
        services: "بیمارستان دولتی با بخش‌های کامل شامل ICU، NICU، قلب و عروق و ...",
        lat: 33.933,
        lng: 48.747,
        type: "general"
    }
];

// محدوده بروجرد
const borujerdBounds = [
    [33.75, 48.50],  // جنوب غربی
    [34.05, 48.95]   // شمال شرقی
];

// تنظیمات اولیه نقشه
const map = L.map('map', {
    center: [33.8942, 48.7670],
    zoom: 13,
    minZoom: 12,
    maxZoom: 18,
    maxBounds: borujerdBounds,
    maxBoundsViscosity: 1.0
});

// اضافه کردن لایه نقشه خام
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20
}).addTo(map);

// آیکون‌های سفارشی برای بیمارستان‌ها
const hospitalIcons = {
    general: L.divIcon({
        className: 'custom-marker',
        html: '<i class="fas fa-hospital"></i>',
        iconSize: [24, 24]
    }),
    specialized: L.divIcon({
        className: 'custom-marker',
        html: '<i class="fas fa-star-of-life"></i>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    })
};

// اضافه کردن بیمارستان‌ها به نقشه
const hospitalMarkers = [];
hospitals.forEach(hospital => {
    const marker = L.marker([hospital.lat, hospital.lng], {
        icon: hospitalIcons[hospital.type]
    }).addTo(map);
    
    marker.bindPopup(`
        <h3>${hospital.name}</h3>
        <p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
        <p><i class="fas fa-phone"></i> ${hospital.phone}</p>
        <p><i class="fas fa-clock"></i> ${hospital.hours}</p>
        <p><i class="fas fa-info-circle"></i> ${hospital.services}</p>
    `);
    
    marker.hospitalData = hospital;
    hospitalMarkers.push(marker);
});

// اضافه کردن بیمارستان‌ها به لیست سایدبار
const hospitalList = document.getElementById('hospitalList');
hospitals.forEach(hospital => {
    const item = document.createElement('a');
    item.href = '#';
    item.className = 'list-group-item list-group-item-action';
    item.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <span>${hospital.name}</span>
            <i class="fas fa-${hospital.type === 'general' ? 'hospital' : 'star-of-life'}"></i>
        </div>
    `;
    
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const marker = hospitalMarkers.find(m => m.hospitalData.id === hospital.id);
        map.setView([hospital.lat, hospital.lng], 15);
        marker.openPopup();
        
        // هایلایت کردن آیتم انتخاب شده
        document.querySelectorAll('#hospitalList a').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
    });
    
    hospitalList.appendChild(item);
});

// یافتن نزدیک‌ترین بیمارستان به موقعیت کاربر
function findNearestHospital(lat, lng) {
    let nearest = null;
    let minDistance = Infinity;
    
    hospitals.forEach(hospital => {
        const distance = getDistance(lat, lng, hospital.lat, hospital.lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = hospital;
        }
    });
    
    return {hospital: nearest, distance: minDistance};
}

// محاسبه فاصله بین دو نقطه جغرافیایی (به کیلومتر)
function getDistance(lat1, lon1, lat2, lon2) {
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

// نمایش موقعیت کاربر و نزدیک‌ترین بیمارستان
function showUserLocation(position) {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    
    // بررسی آیا کاربر در محدوده بروجرد است
    if (
        userLat < borujerdBounds[0][0] || userLat > borujerdBounds[1][0] ||
        userLng < borujerdBounds[0][1] || userLng > borujerdBounds[1][1]
    ) {
        alert('شما خارج از محدوده بروجرد هستید.');
        return;
    }
    
    // یافتن نزدیک‌ترین بیمارستان
    const {hospital, distance} = findNearestHospital(userLat, userLng);
    const roundedDistance = Math.round(distance * 10) / 10;
    
    // نمایش اطلاعات موقعیت
    const locationDetails = document.getElementById('locationDetails');
    locationDetails.innerHTML = `
        <p><i class="fas fa-map-marker-alt"></i> موقعیت شما ثبت شد</p>
        <p><strong>نزدیک‌ترین بیمارستان:</strong></p>
        <p>${hospital.name}</p>
        <p>فاصله: ${roundedDistance} کیلومتر</p>
        <button class="btn btn-sm btn-primary mt-2 w-100" onclick="navigateToHospital(${hospital.id})">
            <i class="fas fa-directions me-1"></i> مسیریابی
        </button>
    `;
    
    // نمایش نوتیفیکیشن
    const toast = new bootstrap.Toast(document.getElementById('locationInfo'));
    toast.show();
    
    // اضافه کردن نشانگر موقعیت کاربر
    if (window.userMarker) {
        map.removeLayer(window.userMarker);
    }
    
    window.userMarker = L.marker([userLat, userLng], {
        icon: L.divIcon({
            className: 'custom-marker user-location',
            html: '<i class="fas fa-user"></i>',
            iconSize: [24, 24]
        })
    }).addTo(map);
    
    // زوم به موقعیت کاربر و نزدیک‌ترین بیمارستان
    const group = new L.FeatureGroup([window.userMarker, hospitalMarkers.find(m => m.hospitalData.id === hospital.id)]);
    map.fitBounds(group.getBounds().pad(0.5));
}

// مسیریابی به بیمارستان انتخاب شده
function navigateToHospital(hospitalId) {
    const hospital = hospitals.find(h => h.id === hospitalId);
    if (!hospital) return;
    
    if (window.userMarker) {
        const userLat = window.userMarker.getLatLng().lat;
        const userLng = window.userMarker.getLatLng().lng;
        
        // در حالت واقعی می‌توان از سرویس‌های مسیریابی مانند OSRM استفاده کرد
        // اینجا فقط یک خط مستقیم بین دو نقطه رسم می‌کنیم
        if (window.routeLine) {
            map.removeLayer(window.routeLine);
        }
        
        window.routeLine = L.polyline([
            [userLat, userLng],
            [hospital.lat, hospital.lng]
        ], {color: 'blue'}).addTo(map);
        
        map.fitBounds([
            [userLat, userLng],
            [hospital.lat, hospital.lng]
        ]);
    }
}

// مدیریت خطاهای موقعیت‌یابی
function handleLocationError(error) {
    let message = "خطا در دریافت موقعیت شما";
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = "دسترسی به موقعیت مکانی رد شد. لطفاً تنظیمات مرورگر خود را بررسی کنید.";
            break;
        case error.POSITION_UNAVAILABLE:
            message = "اطلاعات موقعیت مکانی در دسترس نیست.";
            break;
        case error.TIMEOUT:
            message = "درخواست موقعیت‌یابی زمان‌گذشت.";
            break;
        case error.UNKNOWN_ERROR:
            message = "خطای ناشناخته رخ داد.";
            break;
    }
    
    alert(message);
}

// رویداد کلیک برای دکمه یافتن نزدیک‌ترین بیمارستان
document.getElementById('locateBtn').addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            showUserLocation,
            handleLocationError,
            {enableHighAccuracy: true, timeout: 10000}
        );
    } else {
        alert("مرورگر شما از موقعیت‌یابی جغرافیایی پشتیبانی نمی‌کند.");
    }
});

// برای نمایش سایدبار در موبایل
if (window.innerWidth <= 768) {
    const sidebar = document.querySelector('.sidebar');
    const mapDiv = document.getElementById('map');
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn btn-primary btn-sm position-fixed bottom-0 start-0 m-3';
    toggleBtn.style.zIndex = '1000';
    toggleBtn.innerHTML = '<i class="fas fa-list"></i> لیست بیمارستان‌ها';
    toggleBtn.onclick = () => {
        sidebar.classList.toggle('show');
        mapDiv.style.height = sidebar.classList.contains('show') ? 
            'calc(100vh - 56px - 40vh)' : 'calc(100vh - 56px)';
    };
    
    document.body.appendChild(toggleBtn);
}