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
  maxBoundsViscosity: 0.2
});

// لایه پس‌زمینه خام و مینیمال (Positron)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: ''
}).addTo(map);

// آیکون بیمارستان (لوکال)
const hospitalIcon = L.icon({
  iconUrl: 'hospital-icon.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35]
});

// لیست بیمارستان‌ها
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

// اضافه کردن مارکرها
hospitals.forEach(hospital => {
  L.marker(hospital.coords, { icon: hospitalIcon })
    .addTo(map)
    .bindPopup(`<b>${hospital.name}</b><br>${hospital.address}`);
});

// دکمه یافتن نزدیک‌ترین بیمارستان
document.getElementById('locateBtn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('مرورگر شما از Geolocation پشتیبانی نمی‌کند.');
    return;
  }

  navigator.geolocation.getCurrentPosition(position => {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;

    // پیدا کردن نزدیک‌ترین بیمارستان
    let nearest = null;
    let minDistance = Infinity;

    hospitals.forEach(hospital => {
      const dist = getDistance(userLat, userLng, hospital.coords[0], hospital.coords[1]);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = hospital;
      }
    });

    if (nearest) {
      map.setView(nearest.coords, 16);
      L.popup()
        .setLatLng(nearest.coords)
        .setContent(`<b>نزدیک‌ترین بیمارستان:</b><br>${nearest.name}<br>${nearest.address}`)
        .openOn(map);
    }
  }, () => {
    alert('عدم دسترسی به موقعیت شما!');
  });
});

// محاسبه فاصله دو نقطه (Haversine)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // متر
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}
