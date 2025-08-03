// محدوده جغرافیایی بروجرد (باید دقیق‌تر بشه)
const boroujerdBounds = L.latLngBounds(
    [33.8700, 48.7200],  // جنوب غربی
    [33.9200, 48.7800]   // شمال شرقی
);

const map = L.map('map', {
    maxBounds: boroujerdBounds,
    maxBoundsViscosity: 1.0,
    minZoom: 13,
    maxZoom: 18
}).setView([33.8972, 48.7516], 14);

// بارگذاری نقشه
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// لیست رستوران‌ها (نمونه دستی، بعداً می‌تونی از دیتابیس یا JSON بارگذاری کنی)
const restaurants = [
    { name: "رستوران نمونه 1", lat: 33.8990, lng: 48.7550 },
    { name: "رستوران نمونه 2", lat: 33.8950, lng: 48.7500 },
    { name: "رستوران نمونه 3", lat: 33.8930, lng: 48.7530 }
];

// تابع برای نمایش مکان‌های نزدیک
function showNearbyPlaces(userLatLng) {
    restaurants.forEach(place => {
        const placeLatLng = L.latLng(place.lat, place.lng);
        if (userLatLng.distanceTo(placeLatLng) <= 1000) { // فاصله کمتر از 1km
            L.marker([place.lat, place.lng]).addTo(map)
              .bindPopup(`<b>${place.name}</b>`);
        }
    });
}

// گرفتن لوکیشن کاربر
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
        const userLatLng = L.latLng(position.coords.latitude, position.coords.longitude);

        if (boroujerdBounds.contains(userLatLng)) {
            L.marker(userLatLng).addTo(map)
              .bindPopup("موقعیت شما")
              .openPopup();
            map.setView(userLatLng, 15);
            showNearbyPlaces(userLatLng);
        } else {
            document.getElementById('message').innerText = "شما خارج از محدوده بروجرد هستید.";
            document.getElementById('message').style.display = 'block';
        }

    }, () => {
        document.getElementById('message').innerText = "دسترسی به موقعیت مکانی مسدود شده است.";
        document.getElementById('message').style.display = 'block';
    });
} else {
    document.getElementById('message').innerText = "مرورگر شما GPS را پشتیبانی نمی‌کند.";
    document.getElementById('message').style.display = 'block';
}
