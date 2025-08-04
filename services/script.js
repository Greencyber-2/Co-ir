// محدوده تقریبی شهر بروجرد
const bounds = [
  [33.80, 48.60], // جنوب غربی (lat, lng)
  [34.00, 48.90]  // شمال شرقی
];

// ایجاد نقشه
const map = L.map('map', {
  center: [33.8942, 48.7670], // مرکز بروجرد
  zoom: 13,
  minZoom: 12,
  maxZoom: 16,
  maxBounds: bounds,
  maxBoundsViscosity: 1.0, // جلوگیری از حرکت خارج از محدوده
});

// اضافه کردن لایه نقشه ساده و خام Stamen Toner Lite (رایگان)
L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
  attribution: 'Map data © OpenStreetMap contributors, Tiles courtesy of Stamen Design',
  maxZoom: 20,
}).addTo(map);
