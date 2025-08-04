// تنظیم نقشه بروجرد
const map = L.map('map', {
  center: [33.8973, 48.7543],
  zoom: 14,
  minZoom: 12,
  maxZoom: 18,
  zoomControl: true,
  maxBounds: [
    [33.75, 48.60],
    [34.00, 48.90]
  ],
  maxBoundsViscosity: 0.3
});

// لایه پس‌زمینه مینیمال (Carto Positron)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: ''
}).addTo(map);

// آیکون بیمارستان اختصاصی
const hospitalIcon = L.icon({
  iconUrl: 'hospital-icon.png', // آدرس آیکون شما
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

// داده بیمارستان‌ها
const hospitals = [
  {
    name: "بیمارستان شهید چمران",
    coords: [33.89684661387162, 48.74189615249634],
    address: "بروجرد، بلوار دکتر نصرالهی، بین میدان زینب کبری و شهید رجائی"
  },
  {
    name: "بیمارستان امام خمینی (ره)",
    coords: [33.90148164166486, 48.74766021966935],
    address: "بروجرد، سید مصطفی خمینی، گیوه کش (محله‌ی پدافند)"
  },
  {
    name: "بیمارستان بهبود",
    coords: [33.89666880647936, 48.76236081841194],
    address: "بروجرد، بلوار صفا، جعفری، 18 متری، شهید مطیعی (محله‌ی صوفیان)"
  },
  {
    name: "بیمارستان تأمین اجتماعی کوثر",
    coords: [33.8777597, 48.7662033],
    address: "بروجرد، بلوار امام خمینی، میدان امام خمینی"
  }
];

// اضافه کردن مارکرها روی نقشه
hospitals.forEach(hospital => {
  L.marker(hospital.coords, { icon: hospitalIcon })
    .addTo(map)
    .bindPopup(`<b>${hospital.name}</b><br>${hospital.address}`);
});

// محاسبه فاصله بین دو نقطه (در متری)
function getDistance(lat1, lon1, lat2, lon2) {
  function toRad(x) { return x * Math.PI / 180; }

  const R = 6371e3; // شعاع زمین بر حسب متر
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return d;
}

// نمایش نزدیک‌ترین بیمارستان‌ها
function showNearestHospitals(userCoords) {
  // محاسبه فاصله بیمارستان‌ها تا کاربر
  const hospitalsWithDistance = hospitals.map(h => ({
    ...h,
    distance: getDistance(userCoords.lat, userCoords.lng, h.coords[0], h.coords[1])
  }));

  // مرتب‌سازی بر اساس فاصله
  hospitalsWithDistance.sort((a, b) => a.distance - b.distance);

  // انتخاب 3 بیمارستان نزدیک‌تر
  const nearest = hospitalsWithDistance.slice(0, 3);

  // نمایش لیست در پنل
  const listEl = document.getElementById('hospital-list');
  listEl.innerHTML = ''; // خالی کردن قبلی

  nearest.forEach(h => {
    const li = document.createElement('li');
    li.textContent = `${h.name} - فاصله تقریبی: ${(h.distance / 1000).toFixed(2)} کیلومتر`;
    li.title = h.address;
    li.onclick = () => {
      map.setView(h.coords, 16, { animate: true });
      L.popup()
        .setLatLng(h.coords)
        .setContent(`<b>${h.name}</b><br>${h.address}<br>فاصله: ${(h.distance / 1000).toFixed(2)} کیلومتر`)
        .openOn(map);
    };
    listEl.appendChild(li);
  });
}

// درخواست موقعیت مکانی کاربر
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    position => {
      const userCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      // نشان دادن مکان کاربر روی نقشه
      const userMarker = L.circleMarker(userCoords, {
        radius: 9,
        fillColor: "#43cea2",
        color: "#185a9d",
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(map).bindPopup("شما اینجا هستید").openPopup();

      // مرکزیت نقشه روی کاربر
      map.setView(userCoords, 14);

      // نمایش نزدیک‌ترین بیمارستان‌ها
      showNearestHospitals(userCoords);
    },
    err => {
      console.warn(`خطا در دریافت موقعیت مکانی: ${err.message}`);
      // اگر موقعیت کاربر پیدا نشد، فقط بیمارستان‌ها نمایش داده می‌شوند (بدون لیست نزدیک‌ترین)
      document.getElementById('nearest-hospitals').style.display = 'none';
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
} else {
  alert("متاسفانه مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند.");
  document.getElementById('nearest-hospitals').style.display = 'none';
}
