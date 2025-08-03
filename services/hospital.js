// === جایگزین کن با کلید API خودت از پنل نشان ===
const API_KEY = 'web.5dc58996f477487a824e08f9516d1641';

// محدوده جغرافیایی تقریبی بروجرد (برای اعتبارسنجی کاربر)
const BOROJERD_BOUNDS = {
    north: 33.9400,
    south: 33.8500,
    east: 48.8000,
    west: 48.7000,
};

let map;
let userMarker;
let isochroneLayer;
const infoDiv = document.getElementById('info');

// ایجاد نقشه و تنظیمات اولیه
function initMap(lat, lng) {
    map = L.map('map', {
        center: [lat, lng],
        zoom: 14,
        maxBounds: [
            [BOROJERD_BOUNDS.south, BOROJERD_BOUNDS.west],
            [BOROJERD_BOUNDS.north, BOROJERD_BOUNDS.east]
        ]
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    userMarker = L.marker([lat, lng], {
        icon: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30],
        })
    }).addTo(map).bindPopup('موقعیت شما').openPopup();
}

// نمایش پیام به کاربر
function showInfo(message) {
    infoDiv.innerHTML = message;
}

// اعتبارسنجی داخل محدوده بودن کاربر
function isInsideBorojerd(lat, lng) {
    return (lat >= BOROJERD_BOUNDS.south && lat <= BOROJERD_BOUNDS.north) &&
           (lng >= BOROJERD_BOUNDS.west && lng <= BOROJERD_BOUNDS.east);
}

// فراخوانی سرویس ایزکرون (محدوده دسترسی)
async function fetchIsochrone(lat, lng, distanceKm = 5, polygon = true) {
    const url = new URL('https://api.neshan.org/v1/isochrone');
    url.searchParams.append('location', `${lat},${lng}`);
    url.searchParams.append('distance', distanceKm);
    url.searchParams.append('polygon', polygon);

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Api-Key': API_KEY }
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(`خطا در دریافت محدوده: ${errData.message || response.statusText}`);
    }

    const data = await response.json();
    return data;
}

// نمایش محدوده ایزکرون روی نقشه
function drawIsochrone(geojson) {
    if (isochroneLayer) {
        map.removeLayer(isochroneLayer);
    }

    isochroneLayer = L.geoJSON(geojson, {
        style: {
            color: '#1e88e5',
            weight: 3,
            fillColor: '#90caf9',
            fillOpacity: 0.3
        }
    }).addTo(map);

    map.fitBounds(isochroneLayer.getBounds());
}

// جستجوی بیمارستان‌ها با پارامترهای API نشان (شعاع و کلمه "بیمارستان")
async function fetchHospitals(lat, lng, radiusMeters = 3000) {
    const url = new URL('https://api.neshan.org/v1/search');
    url.searchParams.append('term', 'بیمارستان');
    url.searchParams.append('lat', lat);
    url.searchParams.append('lng', lng);
    url.searchParams.append('radius', radiusMeters);
    url.searchParams.append('limit', 50);

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Api-Key': API_KEY }
    });

    if (!response.ok) {
        throw new Error('خطا در دریافت لیست بیمارستان‌ها');
    }

    const data = await response.json();
    return data;
}

// نمایش بیمارستان‌ها روی نقشه و داخل لیست
function displayHospitals(hospitals) {
    if (!hospitals || hospitals.length === 0) {
        showInfo('هیچ بیمارستانی در محدوده شما یافت نشد.');
        return;
    }

    // پاک کردن نشانگرهای قبلی اگر لازم بود (در این نسخه ساده شده)
    hospitals.forEach(hospital => {
        L.marker([hospital.location.lat, hospital.location.lng], {
            icon: L.icon({
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/2965/2965567.png',
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30],
            })
        }).addTo(map).bindPopup(`<b>${hospital.name}</b><br>${hospital.address || ''}`);
    });

    // لیست بیمارستان‌ها
    const listHtml = hospitals.map(h => `<div><strong>${h.name}</strong><br>${h.address || ''}</div>`).join('<hr/>');
    showInfo(listHtml);
}

// شروع اجرای برنامه
function start() {
    if (!navigator.geolocation) {
        showInfo('مرورگر شما از GPS پشتیبانی نمی‌کند.');
        return;
    }

    navigator.geolocation.getCurrentPosition(async pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (!isInsideBorojerd(lat, lng)) {
            showInfo('شما خارج از محدوده بروجرد هستید.');
            return;
        }

        initMap(lat, lng);

        try {
            // دریافت محدوده دسترسی تا 5 کیلومتر
            const isochroneData = await fetchIsochrone(lat, lng, 5, true);
            drawIsochrone(isochroneData);

            // دریافت بیمارستان‌ها در شعاع 3 کیلومتر
            const hospitalsData = await fetchHospitals(lat, lng, 3000);
            displayHospitals(hospitalsData.items);
        } catch (error) {
            showInfo(`خطا: ${error.message}`);
        }
    }, error => {
        showInfo('دسترسی به موقعیت مکانی مسدود شده است.');
    });
}

start();
