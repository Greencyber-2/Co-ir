// === تنظیم کلید API نشون خودت را جایگزین کن ===
const API_KEY = 'web.5dc58996f477487a824e08f9516d1641';

// مختصات مرکز بروجرد برای اعتبارسنجی محدوده
const BOROJERD_BOUNDS = {
    north: 33.9400,
    south: 33.8500,
    east: 48.8000,
    west: 48.7000,
};

let map, userMarker, isochroneLayer;
const infoDiv = document.getElementById('info');

// ساخت نقشه و تنظیمات اولیه
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

// نمایش پیام خطا یا اطلاع‌رسانی
function showInfo(message) {
    infoDiv.innerText = message;
}

// فراخوانی سرویس ایزکرون (Isochrone) برای محدوده دسترسی
async function fetchIsochrone(lat, lng, timeMinutes = 10) {
    const url = `https://api.neshan.org/v2/isochrone`;
    const body = {
        point: `${lng},${lat}`,
        range: timeMinutes * 60,
        range_type: "time", // زمان به ثانیه
        vehicle: "car"
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Api-Key': API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error('خطا در دریافت محدوده دسترسی');
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
            color: '#2196F3',
            fillColor: '#90caf9',
            fillOpacity: 0.3,
            weight: 3
        }
    }).addTo(map);
}

// جستجوی بیمارستان‌ها در محدوده مشخص
async function fetchHospitals(lat, lng, radiusMeters = 3000) {
    const url = `https://api.neshan.org/v1/search?term=بیمارستان&lat=${lat}&lng=${lng}&radius=${radiusMeters}&limit=50`;
    const response = await fetch(url, {
        headers: { 'Api-Key': API_KEY }
    });
    if (!response.ok) {
        throw new Error('خطا در دریافت بیمارستان‌ها');
    }
    const data = await response.json();
    return data;
}

// نمایش بیمارستان‌ها روی نقشه و لیست اطلاعات
function displayHospitals(hospitals) {
    if (!hospitals || hospitals.length === 0) {
        showInfo('هیچ بیمارستانی در محدوده شما یافت نشد.');
        return;
    }

    // پاک کردن نشانگرهای قبلی (اگر نیاز باشه میشه اضافه کرد)
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

    // ساخت لیست بیمارستان‌ها در قسمت info
    const listHtml = hospitals.map(h => `<div><strong>${h.name}</strong><br>${h.address || ''}</div>`).join('<hr/>');
    showInfo(listHtml);
}

// اعتبارسنجی موقعیت در محدوده بروجرد
function isInsideBorojerd(lat, lng) {
    return (lat >= BOROJERD_BOUNDS.south && lat <= BOROJERD_BOUNDS.north) &&
           (lng >= BOROJERD_BOUNDS.west && lng <= BOROJERD_BOUNDS.east);
}

// شروع فرآیند
async function start() {
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
            // گرفتن محدوده دسترسی 10 دقیقه‌ای رانندگی
            const isochroneData = await fetchIsochrone(lat, lng, 10);
            drawIsochrone(isochroneData);

            // جستجوی بیمارستان‌ها در محدوده 3 کیلومتر
            const hospitalData = await fetchHospitals(lat, lng, 3000);
            displayHospitals(hospitalData.items);
        } catch (err) {
            showInfo(err.message);
        }
    }, err => {
        showInfo('دسترسی به موقعیت مکانی مسدود شده است.');
    });
}

start();
