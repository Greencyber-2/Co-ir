// داده‌های بیمارستان‌های بروجرد
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
        type: "عمومی"
    },
    {
        id: 2,
        name: "بیمارستان آیت‌الله بروجردی",
        address: "بروجرد، بلوار شهید فخری‌زاده، شهرک مهرگان",
        phone: "۰۶۶۴۲۳۴۷۶۰۳",
        hours: "شبانه‌روزی",
        services: "بیمارستان فوق تخصصی با بخش‌های ICU، آنکولوژی، گوارش و ...",
        lat: 33.93,
        lng: 48.73,
        type: "فوق تخصصی"
    },
    {
        id: 3,
        name: "بیمارستان تامین اجتماعی کوثر",
        address: "بروجرد، میدان امام خمینی، محله امام خمینی",
        phone: "۰۶۶۴۲۴۴۹۹۷۵",
        hours: "۷ صبح تا ۱۰ شب",
        services: "بیمارستان عمومی با بخش‌های داخلی، جراحی و اورژانس",
        lat: 33.90,
        lng: 48.75,
        type: "عمومی"
    },
    {
        id: 4,
        name: "بیمارستان شهید دکتر چمران",
        address: "بروجرد، خیابان دکتر فاطمی، میدان پرستار",
        phone: "۰۶۶۴۲۵۱۴۰۰۱ - ۰۶۶۴۲۵۱۴۰۰۵",
        hours: "شبانه‌روزی",
        services: "بیمارستان دولتی با بخش‌های کامل شامل داخلی، جراحی عمومی، اطفال، قلب و عروق، زنان و زایمان، ICU، NICU",
        lat: 33.933,
        lng: 48.747,
        type: "دولتی"
    }
];

// محدوده جغرافیایی بروجرد
const borujerdBounds = L.latLngBounds(
    L.latLng(33.85, 48.68), // جنوب غربی
    L.latLng(33.96, 48.78)  // شمال شرقی
);

// ایجاد نقشه
const map = L.map('map', {
    maxBounds: borujerdBounds,
    maxBoundsViscosity: 1.0
}).setView([33.9011, 48.7475], 13);

// اضافه کردن لایه OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
    minZoom: 12
}).addTo(map);

// محدود کردن نقشه به منطقه بروجرد
map.setMaxBounds(borujerdBounds);

// آیکون‌های سفارشی برای بیمارستان‌ها
const hospitalIcon = L.icon({
    iconUrl: 'images/marker-icon.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// اضافه کردن نشانگرها برای بیمارستان‌ها
const hospitalMarkers = [];
hospitals.forEach(hospital => {
    const marker = L.marker([hospital.lat, hospital.lng], { 
        icon: hospitalIcon,
        hospitalId: hospital.id
    }).addTo(map);
    
    marker.bindPopup(`
        <b>${hospital.name}</b><br>
        <i class="fas fa-map-marker-alt"></i> ${hospital.address}<br>
        <i class="fas fa-phone"></i> ${hospital.phone}
    `);
    
    hospitalMarkers.push(marker);
    
    // رویداد کلیک روی نشانگر
    marker.on('click', function() {
        showHospitalDetails(hospital.id);
    });
});

// نمایش جزئیات بیمارستان در مدال
function showHospitalDetails(hospitalId) {
    const hospital = hospitals.find(h => h.id === hospitalId);
    if (!hospital) return;
    
    document.getElementById('modal-title').textContent = hospital.name;
    
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <div class="modal-info">
            <h4><i class="fas fa-info-circle"></i> اطلاعات کلی</h4>
            <p><i class="fas fa-map-marker-alt"></i> <strong>آدرس:</strong> ${hospital.address}</p>
            <p><i class="fas fa-phone"></i> <strong>تلفن:</strong> ${hospital.phone}</p>
            <p><i class="fas fa-clock"></i> <strong>ساعات کاری:</strong> ${hospital.hours}</p>
            <p><i class="fas fa-stethoscope"></i> <strong>نوع بیمارستان:</strong> ${hospital.type}</p>
        </div>
        <div class="modal-info">
            <h4><i class="fas fa-medkit"></i> خدمات ارائه شده</h4>
            <p>${hospital.services}</p>
        </div>
        <div class="modal-info">
            <h4><i class="fas fa-map-marked-alt"></i> موقعیت روی نقشه</h4>
            <p>مختصات جغرافیایی: عرض ${hospital.lat}، طول ${hospital.lng}</p>
        </div>
    `;
    
    document.getElementById('hospital-modal').style.display = 'block';
    
    // متمرکز کردن نقشه روی بیمارستان انتخاب شده
    map.setView([hospital.lat, hospital.lng], 15);
}

// بستن مدال
document.querySelector('.close-btn').addEventListener('click', function() {
    document.getElementById('hospital-modal').style.display = 'none';
});

// بستن مدال با کلیک خارج از آن
window.addEventListener('click', function(event) {
    if (event.target === document.getElementById('hospital-modal')) {
        document.getElementById('hospital-modal').style.display = 'none';
    }
});

// نمایش لیست بیمارستان‌ها
function renderHospitalList() {
    const container = document.getElementById('hospitals-container');
    container.innerHTML = '';
    
    hospitals.forEach(hospital => {
        const card = document.createElement('div');
        card.className = 'hospital-card';
        card.dataset.hospitalId = hospital.id;
        
        card.innerHTML = `
            <h3>${hospital.name}</h3>
            <p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
            <p><i class="fas fa-phone"></i> ${hospital.phone}</p>
            <p><i class="fas fa-clock"></i> ${hospital.hours}</p>
            <p class="distance" id="distance-${hospital.id}"></p>
        `;
        
        card.addEventListener('click', function() {
            showHospitalDetails(hospital.id);
            
            // متمرکز کردن نقشه روی بیمارستان انتخاب شده
            map.setView([hospital.lat, hospital.lng], 15);
            hospitalMarkers[hospital.id - 1].openPopup();
        });
        
        container.appendChild(card);
    });
}

// یافتن موقعیت کاربر
document.getElementById('locate-btn').addEventListener('click', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                // بررسی آیا کاربر در محدوده بروجرد است
                if (borujerdBounds.contains([userLat, userLng])) {
                    // نمایش موقعیت کاربر روی نقشه
                    const userMarker = L.marker([userLat, userLng], {
                        icon: L.divIcon({
                            className: 'user-location-marker',
                            html: '<i class="fas fa-user" style="color: #3498db; font-size: 24px;"></i>',
                            iconSize: [24, 24]
                        })
                    }).addTo(map);
                    
                    userMarker.bindPopup('موقعیت فعلی شما').openPopup();
                    
                    // محاسبه نزدیک‌ترین بیمارستان
                    findNearestHospital(userLat, userLng);
                } else {
                    alert('شما در محدوده شهرستان بروجرد نیستید.');
                }
            },
            error => {
                alert('خطا در دریافت موقعیت: ' + error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        alert('مرورگر شما از سرویس موقعیت‌یابی پشتیبانی نمی‌کند.');
    }
});

// تابع محاسبه فاصله بین دو نقطه جغرافیایی (به کیلومتر)
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
function findNearestHospital(userLat, userLng) {
    let nearestHospital = null;
    let minDistance = Infinity;
    
    hospitals.forEach(hospital => {
        const distance = calculateDistance(userLat, userLng, hospital.lat, hospital.lng);
        
        // نمایش فاصله در لیست
        const distanceElement = document.getElementById(`distance-${hospital.id}`);
        if (distanceElement) {
            distanceElement.textContent = `فاصله: ${distance.toFixed(2)} کیلومتر`;
        }
        
        // یافتن نزدیک‌ترین
        if (distance < minDistance) {
            minDistance = distance;
            nearestHospital = hospital;
        }
    });
    
    if (nearestHospital) {
        const nearestInfo = document.getElementById('nearest-hospital');
        nearestInfo.innerHTML = `
            <i class="fas fa-hospital"></i> نزدیک‌ترین بیمارستان: ${nearestHospital.name} (${minDistance.toFixed(2)} کیلومتر)
        `;
        nearestInfo.style.display = 'block';
        
        // نمایش مسیر روی نقشه
        showRoute(userLat, userLng, nearestHospital.lat, nearestHospital.lng);
    }
}

// نمایش مسیر بین دو نقطه
function showRoute(startLat, startLng, endLat, endLng) {
    // پاک کردن مسیرهای قبلی
    if (window.routeLayer) {
        map.removeLayer(window.routeLayer);
    }
    
    // استفاده از سرویس OSRM برای مسیریابی
    const routeUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    
    fetch(routeUrl)
        .then(response => response.json())
        .then(data => {
            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const routeCoordinates = L.GeoJSON.coordsToLatLngs(
                    route.geometry.coordinates, 
                    route.geometry.type === 'LineString' ? 0 : 1
                );
                
                window.routeLayer = L.polyline(routeCoordinates, {
                    color: '#3498db',
                    weight: 4,
                    opacity: 0.7,
                    dashArray: '10, 10'
                }).addTo(map);
                
                // تنظیم نمای نقشه برای نمایش کامل مسیر
                map.fitBounds(window.routeLayer.getBounds(), {
                    padding: [50, 50]
                });
            }
        })
        .catch(error => {
            console.error('خطا در دریافت مسیر:', error);
        });
}

// مقداردهی اولیه
renderHospitalList();