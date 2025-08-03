// مرکز بروجرد
const center = L.latLng(33.8972, 48.7516);
const radius = 10000; // شعاع به متر (10 کیلومتر)

const map = L.map('map', {
    minZoom: 13,
    maxZoom: 18
}).setView(center, 14);

// بارگذاری نقشه
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// دایره محدوده بروجرد روی نقشه
L.circle(center, { radius: radius, color: 'blue', fillOpacity: 0.1 }).addTo(map);

// گرفتن مکان کاربر
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
        const userLatLng = L.latLng(position.coords.latitude, position.coords.longitude);

        // چک کردن فاصله کاربر تا مرکز بروجرد
        if (userLatLng.distanceTo(center) <= radius) {
            L.marker(userLatLng).addTo(map)
              .bindPopup("موقعیت شما")
              .openPopup();
            map.setView(userLatLng, 15);

            // مکان‌های نزدیک رو لود کن
            fetch('places.json')
                .then(response => response.json())
                .then(places => {
                    places.forEach(place => {
                        const placeLatLng = L.latLng(place.lat, place.lng);
                        if (userLatLng.distanceTo(placeLatLng) <= 1000) { // 1km
                            L.marker([place.lat, place.lng]).addTo(map)
                              .bindPopup(`<b>${place.name}</b><br>دسته: ${place.type}`);
                        }
                    });
                });

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
