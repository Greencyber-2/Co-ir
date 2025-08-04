// اطلاعات بیمارستان‌های بروجرد
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
        type: "عمومی",
        icon: "hospital",
        iconColor: "red"
    },
    {
        id: 2,
        name: "بیمارستان آیت‌الله بروجردی",
        address: "بروجرد، بلوار شهید فخری‌زاده، شهرک مهرگان",
        phone: "۰۶۶۴۲۳۴۷۶۰۳",
        hours: "۷ صبح تا ۱۰ شب",
        services: "بیمارستان فوق تخصصی با بخش‌های ICU، آنکولوژی، گوارش و ...",
        lat: 33.93,
        lng: 48.73,
        type: "فوق تخصصی",
        icon: "hospital-alt",
        iconColor: "blue"
    },
    {
        id: 3,
        name: "بیمارستان تامین اجتماعی کوثر",
        address: "بروجرد، میدان امام خمینی، محله امام خمینی",
        phone: "۰۶۶۴۲۴۴۹۹۷۵",
        hours: "۸ صبح تا ۸ شب",
        services: "بیمارستان عمومی با بخش‌های داخلی، جراحی و اورژانس",
        lat: 33.90,
        lng: 48.75,
        type: "عمومی",
        icon: "hospital",
        iconColor: "green"
    },
    {
        id: 4,
        name: "بیمارستان شهید دکتر چمران",
        address: "بروجرد، خیابان دکتر فاطمی، میدان پرستار",
        phone: "۰۶۶۴۲۵۱۴۰۰۱–۵",
        hours: "شبانه‌روزی",
        services: "بیمارستان دولتی با بخش‌های کامل شامل ICU، NICU، قلب و عروق و ...",
        lat: 33.933,
        lng: 48.747,
        type: "دولتی",
        icon: "hospital",
        iconColor: "purple"
    }
];

// تنظیمات اولیه نقشه
const map = L.map('map', {
    center: [33.8942, 48.7670],
    zoom: 13,
    minZoom: 12,
    maxZoom: 18,
    maxBounds: [
        [33.75, 48.50],
        [34.05, 48.95]
    ],
    maxBoundsViscosity: 1.0
});

// استفاده از نقشه پایه ساده
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20
}).addTo(map);

// گروه برای نشانگرهای بیمارستان‌ها
const hospitalMarkers = L.layerGroup().addTo(map);

// اضافه کردن بیمارستان‌ها به نقشه
function addHospitalsToMap() {
    hospitalMarkers.clearLayers();
    
    hospitals.forEach(hospital => {
        const icon = L.divIcon({
            html: `<i class="fas fa-${hospital.icon}" style="color: ${hospital.iconColor}; font-size: 20px;"></i>`,
            className: 'hospital-marker',
            iconSize: [30, 30]
        });
        
        const marker = L.marker([hospital.lat, hospital.lng], { icon: icon })
            .addTo(hospitalMarkers)
            .bindPopup(`
                <h6>${hospital.name}</h6>
                <p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
                <p><i class="fas fa-phone"></i> ${hospital.phone}</p>
                <button class="btn btn-sm btn-primary more-info-btn" data-id="${hospital.id}">
                    اطلاعات بیشتر
                </button>
            `);
        
        marker.hospitalId = hospital.id;
    });
}

// نمایش لیست بیمارستان‌ها در سایدبار
function renderHospitalList(userLocation = null) {
    const hospitalList = document.getElementById('hospitalList');
    hospitalList.innerHTML = '';
    
    // اگر موقعیت کاربر مشخص است، فاصله‌ها را محاسبه کنیم
    let hospitalsWithDistance = [...hospitals];
    if (userLocation) {
        hospitalsWithDistance = hospitals.map(hospital => {
            const distance = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                hospital.lat,
                hospital.lng
            );
            return { ...hospital, distance };
        }).sort((a, b) => a.distance - b.distance);
    }
    
    hospitalsWithDistance.forEach(hospital => {
        const item = document.createElement('a');
        item.className = 'list-group-item list-group-item-action hospital-item';
        item.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="hospital-icon" style="background-color: ${getColorForType(hospital.type)}">
                    <i class="fas fa-${hospital.icon}"></i>
                </div>
                <div class="flex-grow-1">
                    <h6 class="mb-1">${hospital.name}</h6>
                    <small class="text-muted">${hospital.type}</small>
                    ${hospital.distance ? `<div class="hospital-distance"><i class="fas fa-map-marker-alt"></i> ${hospital.distance.toFixed(1)} کیلومتر</div>` : ''}
                </div>
                <i class="fas fa-chevron-left text-muted"></i>
            </div>
        `;
        
        item.addEventListener('click', () => {
            // حذف کلاس active از همه آیتم‌ها
            document.querySelectorAll('.hospital-item').forEach(el => {
                el.classList.remove('active');
            });
            
            // اضافه کردن کلاس active به آیتم انتخاب شده
            item.classList.add('active');
            
            // نمایش بیمارستان روی نقشه
            map.setView([hospital.lat, hospital.lng], 15);
            
            // باز کردن پاپاپ نشانگر
            hospitalMarkers.getLayers().forEach(layer => {
                if (layer.hospitalId === hospital.id) {
                    layer.openPopup();
                }
            });
        });
        
        hospitalList.appendChild(item);
    });
}

// محاسبه فاصله بین دو نقطه جغرافیایی (به کیلومتر)
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

// رنگ برای انواع مختلف بیمارستان
function getColorForType(type) {
    switch(type) {
        case 'عمومی': return '#28a745';
        case 'فوق تخصصی': return '#007bff';
        case 'دولتی': return '#6f42c1';
        default: return '#6c757d';
    }
}

// یافتن موقعیت کاربر
function findUserLocation() {
    const statusElement = document.getElementById('locationStatus');
    statusElement.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> در حال یافتن موقعیت شما...';
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                // بررسی آیا کاربر در محدوده بروجرد است
                if (userLat >= 33.75 && userLat <= 34.05 && userLng >= 48.50 && userLng <= 48.95) {
                    statusElement.innerHTML = `<i class="fas fa-check-circle me-2"></i> موقعیت شما در بروجرد شناسایی شد`;
                    
                    // اضافه کردن نشانگر موقعیت کاربر
                    const userIcon = L.divIcon({
                        html: '<i class="fas fa-user" style="color: #fd7e14; font-size: 20px;"></i>',
                        className: 'user-marker',
                        iconSize: [30, 30]
                    });
                    
                    L.marker([userLat, userLng], { icon: userIcon })
                        .addTo(map)
                        .bindPopup('موقعیت شما')
                        .openPopup();
                    
                    // نمایش بیمارستان‌ها بر اساس فاصله از کاربر
                    renderHospitalList({ lat: userLat, lng: userLng });
                    
                    // زوم به موقعیت کاربر با بیمارستان‌ها
                    map.setView([userLat, userLng], 14);
                } else {
                    statusElement.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i> شما در محدوده بروجرد نیستید';
                    renderHospitalList();
                }
            },
            error => {
                console.error('Error getting location:', error);
                let errorMessage = 'خطا در دریافت موقعیت';
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = 'دسترسی به موقعیت جغرافیایی رد شد. لطفاً در تنظیمات مرورگر خود اجازه دسترسی را فعال کنید.';
                }
                statusElement.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i> ${errorMessage}`;
                renderHospitalList();
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    } else {
        statusElement.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i> مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند';
        renderHospitalList();
    }
}

// نمایش اطلاعات کامل بیمارستان در مدال
function showHospitalDetails(hospitalId) {
    const hospital = hospitals.find(h => h.id === hospitalId);
    if (!hospital) return;
    
    document.getElementById('modalTitle').textContent = hospital.name;
    
    document.getElementById('modalBody').innerHTML = `
        <p><strong><i class="fas fa-map-marker-alt me-2"></i>آدرس:</strong> ${hospital.address}</p>
        <p><strong><i class="fas fa-phone me-2"></i>تلفن:</strong> ${hospital.phone}</p>
        <p><strong><i class="fas fa-clock me-2"></i>ساعات کاری:</strong> ${hospital.hours}</p>
        <p><strong><i class="fas fa-stethoscope me-2"></i>خدمات:</strong> ${hospital.services}</p>
        <p><strong><i class="fas fa-info-circle me-2"></i>نوع:</strong> ${hospital.type}</p>
    `;
    
    document.getElementById('directionsBtn').href = `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`;
    
    const modal = new bootstrap.Modal(document.getElementById('hospitalModal'));
    modal.show();
}

// رویداد کلیک برای دکمه یافتن بیمارستان‌های نزدیک
document.getElementById('findHospitals').addEventListener('click', findUserLocation);

// رویداد کلیک برای دکمه‌های اطلاعات بیشتر در پاپاپ‌ها
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('more-info-btn')) {
        const hospitalId = parseInt(e.target.getAttribute('data-id'));
        showHospitalDetails(hospitalId);
    }
});

// مقداردهی اولیه
addHospitalsToMap();
renderHospitalList();