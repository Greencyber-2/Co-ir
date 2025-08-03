const map = L.map('map').setView([33.8972, 48.7516], 14);

// بارگذاری مپ از OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// نمایش دایره محدوده 10 کیلومتری بروجرد (اختیاری)
const center = L.latLng(33.8972, 48.7516);
L.circle(center, { radius: 10000, color: 'blue', fillOpacity: 0.05 }).addTo(map);

// پیام روی صفحه
const messageDiv = document.getElementById('message');

// نمایش پیام
function showMessage(text, duration = 4000) {
    messageDiv.innerText = text;
    messageDiv.style.display = 'block';
    setTimeout(() => messageDiv.style.display = 'none', duration);
}

// تابع اصلی: گرفتن GPS و نمایش رستوران‌های نزدیک
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async position => {
        const userLatLng = L.latLng(position.coords.latitude, position.coords.longitude);

        L.marker(userLatLng, { icon: L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", iconSize: [30, 30] }) })
         .addTo(map)
         .bindPopup("موقعیت شما")
         .openPopup();

        map.setView(userLatLng, 15);
        showMessage("رستوران‌های نزدیک شما...");

        // دریافت لیست رستوران‌ها از JSON
        const response = await fetch('restaurants.json');
        const restaurants = await response.json();

        let found = false;

        restaurants.forEach(rest => {
            const restLatLng = L.latLng(rest.lat, rest.lng);
            const distance = userLatLng.distanceTo(restLatLng);

            if (distance <= 2000) {  // فاصله زیر 2km
                found = true;
                L.marker([rest.lat, rest.lng], { icon: L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png", iconSize: [30, 30] }) })
                 .addTo(map)
                 .bindPopup(`<b>${rest.name}</b><br>فاصله: ${Math.round(distance)} متر`);
            }
        });

        if (!found) {
            showMessage("هیچ رستورانی در ۲ کیلومتری شما یافت نشد.");
        }

    }, () => {
        showMessage("دسترسی به موقعیت مسدود شده است.");
    });
} else {
    showMessage("مرورگر شما GPS را پشتیبانی نمی‌کند.");
}
