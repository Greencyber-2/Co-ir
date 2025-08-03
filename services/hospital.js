// API Key for Neshan Map
const API_KEY = 'web.b2294aca62a944449ea607f29a245508'; // جایگزین کنید با API Key خود از پنل نشان

// Global variables
let map;
let userMarker;
let userLocation = null;
let isochroneLayer = null;
let hospitalMarkers = [];
let hospitalsData = [];

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map
    initMap();
    
    // Set up event listeners
    setupEventListeners();
});

// Initialize Leaflet map
function initMap() {
    // Create a map centered on Iran
    map = L.map('map').setView([35.6892, 51.3890], 12); // مختصات تهران
    
    // Add Neshan map tiles
    L.tileLayer('https://api.neshan.org/v1/vector?key=' + API_KEY, {
        attribution: '<a href="https://neshan.org" target="_blank">Neshan Map</a>',
        minZoom: 1,
        maxZoom: 19
    }).addTo(map);
    
    // Add custom controls
    addMapControls();
}

// Add custom controls to the map
function addMapControls() {
    // Add zoom control with custom position
    L.control.zoom({
        position: 'topright'
    }).addTo(map);
    
    // Add scale control
    L.control.scale({
        position: 'bottomright',
        imperial: false
    }).addTo(map);
}

// Set up event listeners for UI elements
function setupEventListeners() {
    // Range type selector change
    document.getElementById('range-type').addEventListener('change', function() {
        const unitSpan = document.getElementById('range-unit');
        if (this.value === 'distance') {
            unitSpan.textContent = 'کیلومتر';
        } else {
            unitSpan.textContent = 'دقیقه';
        }
    });
    
    // Find hospitals button click
    document.getElementById('find-hospitals').addEventListener('click', findNearbyHospitals);
    
    // Current location button click
    document.getElementById('current-location').addEventListener('click', getUserLocation);
}

// Get user's current location
function getUserLocation() {
    showLoader('در حال دریافت موقعیت شما...');
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Update map view
                map.setView([userLocation.lat, userLocation.lng], 14);
                
                // Add or update user marker
                updateUserMarker();
                
                hideLoader();
            },
            error => {
                let errorMessage;
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "دسترسی به موقعیت مکانی رد شد. لطفاً در تنظیمات مرورگر خود اجازه دسترسی را فعال کنید.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "اطلاعات موقعیت مکانی در دسترس نیست.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "درخواست موقعیت مکانی زمان‌گذشت.";
                        break;
                    case error.UNKNOWN_ERROR:
                        errorMessage = "یک خطای ناشناخته رخ داد.";
                        break;
                }
                
                showError(errorMessage);
                hideLoader();
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        showError("مرورگر شما از سرویس موقعیت مکانی پشتیبانی نمی‌کند.");
        hideLoader();
    }
}

// Update or add user marker on the map
function updateUserMarker() {
    if (!userLocation) return;
    
    const userIcon = L.divIcon({
        className: 'user-marker',
        html: '<div class="pulse-dot"></div><div class="inner-dot"></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
    
    if (userMarker) {
        userMarker.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
        userMarker = L.marker([userLocation.lat, userLocation.lng], {
            icon: userIcon,
            zIndexOffset: 1000
        }).addTo(map);
        
        // Add popup to user marker
        userMarker.bindPopup("<b>موقعیت فعلی شما</b>").openPopup();
    }
}

// Find nearby hospitals based on user's location and selected range
function findNearbyHospitals() {
    if (!userLocation) {
        showError("لطفاً ابتدا موقعیت خود را مشخص کنید.");
        return;
    }
    
    const rangeType = document.getElementById('range-type').value;
    const rangeValue = document.getElementById('range-value').value;
    
    if (!rangeValue || isNaN(rangeValue)) {
        showError("لطفاً یک محدوده معتبر وارد کنید.");
        return;
    }
    
    showLoader('در حال پیدا کردن بیمارستان‌های نزدیک...');
    
    // First get the isochrone/isodistance polygon
    getAccessibleArea(rangeType, rangeValue)
        .then(area => {
            // Then find hospitals within that area
            return findHospitalsInArea(area);
        })
        .then(hospitals => {
            displayHospitals(hospitals);
            hideLoader();
        })
        .catch(error => {
            console.error('Error:', error);
            showError("خطا در دریافت اطلاعات بیمارستان‌ها. لطفاً دوباره تلاش کنید.");
            hideLoader();
        });
}

// Get accessible area (isochrone/isodistance) from Neshan API
function getAccessibleArea(rangeType, rangeValue) {
    const baseUrl = 'https://api.neshan.org/v1/isochrone';
    const params = new URLSearchParams();
    
    params.append('location', `${userLocation.lat},${userLocation.lng}`);
    params.append('polygons', 'true');
    
    if (rangeType === 'distance') {
        params.append('distance', rangeValue);
    } else {
        params.append('time', rangeValue);
    }
    
    const url = `${baseUrl}?${params.toString()}`;
    
    return fetch(url, {
        headers: {
            'Api-Key': API_KEY
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Process the GeoJSON response
        if (data.features && data.features.length > 0) {
            // Remove previous isochrone layer if exists
            if (isochroneLayer) {
                map.removeLayer(isochroneLayer);
            }
            
            // Add new isochrone layer to the map
            isochroneLayer = L.geoJSON(data, {
                style: function(feature) {
                    return {
                        fillColor: '#3498db',
                        color: '#2980b9',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.3
                    };
                }
            }).addTo(map);
            
            // Return the first polygon (assuming it's the one we want)
            return data.features[0].geometry;
        } else {
            throw new Error('No accessible area found');
        }
    });
}

// Find hospitals within the accessible area (simulated - in a real app, you'd use a proper API)
function findHospitalsInArea(area) {
    // In a real application, you would call a hospital search API here
    // For this example, we'll simulate some hospitals near the user
    
    return new Promise((resolve) => {
        // Simulate API delay
        setTimeout(() => {
            // Generate some random hospitals within the area
            const hospitals = generateSimulatedHospitals(area);
            resolve(hospitals);
        }, 1000);
    });
}

// Generate simulated hospital data (for demo purposes)
function generateSimulatedHospitals(area) {
    const hospitals = [];
    const center = userLocation;
    const count = Math.floor(Math.random() * 5) + 5; // 5-10 hospitals
    
    // Get the bounding box of the area
    const coords = area.coordinates[0];
    let minLat = coords[0][0], maxLat = coords[0][0];
    let minLng = coords[0][1], maxLng = coords[0][1];
    
    for (const coord of coords) {
        minLat = Math.min(minLat, coord[0]);
        maxLat = Math.max(maxLat, coord[0]);
        minLng = Math.min(minLng, coord[1]);
        maxLng = Math.max(maxLng, coord[1]);
    }
    
    // Generate hospitals within the bounding box
    for (let i = 0; i < count; i++) {
        const lat = minLat + Math.random() * (maxLat - minLat);
        const lng = minLng + Math.random() * (maxLng - minLng);
        
        // Simple check if point is within polygon (for demo, not precise)
        const isInside = true; // In a real app, implement proper point-in-polygon check
        
        if (isInside) {
            const distance = calculateDistance(center.lat, center.lng, lat, lng);
            const travelTime = Math.floor(distance * 3 + Math.random() * 5); // Simulate travel time
            
            hospitals.push({
                id: i + 1,
                name: `بیمارستان ${getRandomHospitalName()}`,
                address: `آدرس نمونه ${i + 1}، تهران`,
                phone: `021-${Math.floor(1000 + Math.random() * 9000)}`,
                lat: lat,
                lng: lng,
                distance: distance.toFixed(1),
                travelTime: travelTime,
                specialties: getRandomSpecialties()
            });
        }
    }
    
    // Sort by distance
    hospitals.sort((a, b) => a.distance - b.distance);
    
    return hospitals;
}

// Helper function to get random hospital names
function getRandomHospitalName() {
    const names = [
        'امام حسین',
        'سینا',
        'مسیح دانشوری',
        'شریعتی',
        'بقیة‌الله',
        'پارس',
        'طالقانی',
        'هاشمی نژاد',
        'مدائن',
        'بهارلو',
        'کسرا',
        'آتیه',
        'عرفان',
        'پاستور',
        'رازی'
    ];
    return names[Math.floor(Math.random() * names.length)];
}

// Helper function to get random specialties
function getRandomSpecialties() {
    const specialties = [
        'اورژانس',
        'اطفال',
        'جراحی',
        'قلب',
        'اعصاب',
        'ارتوپدی',
        'زنان',
        'چشم',
        'گوش و حلق و بینی',
        'داخلی',
        'اورولوژی',
        'پوست'
    ];
    
    const count = Math.floor(Math.random() * 3) + 3; // 3-5 specialties
    const result = [];
    
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * specialties.length);
        const specialty = specialties[randomIndex];
        if (!result.includes(specialty)) {
            result.push(specialty);
        }
    }
    
    return result;
}

// Calculate distance between two points in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Display hospitals on the map and in the list
function displayHospitals(hospitals) {
    hospitalsData = hospitals;
    
    // Clear previous markers
    clearHospitalMarkers();
    
    // Add new markers
    hospitals.forEach(hospital => {
        const hospitalIcon = L.divIcon({
            className: 'hospital-marker',
            html: '<i class="fas fa-hospital"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });
        
        const marker = L.marker([hospital.lat, hospital.lng], {
            icon: hospitalIcon
        }).addTo(map);
        
        // Add popup to hospital marker
        marker.bindPopup(`
            <b>${hospital.name}</b><br>
            <small>${hospital.address}</small><br>
            فاصله: ${hospital.distance} کیلومتر<br>
            زمان تقریبی: ${hospital.travelTime} دقیقه
        `);
        
        hospitalMarkers.push(marker);
    });
    
    // Update hospital list
    updateHospitalList(hospitals);
}

// Clear all hospital markers from the map
function clearHospitalMarkers() {
    hospitalMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    hospitalMarkers = [];
}

// Update the hospital list in the UI
function updateHospitalList(hospitals) {
    const hospitalList = document.getElementById('hospital-list');
    hospitalList.innerHTML = '';
    
    if (hospitals.length === 0) {
        hospitalList.innerHTML = '<p class="no-results">هیچ بیمارستانی در محدوده انتخاب شده یافت نشد.</p>';
        return;
    }
    
    hospitals.forEach(hospital => {
        const card = document.createElement('div');
        card.className = 'hospital-card';
        
        const specialties = hospital.specialties.map(s => `<span class="specialty">${s}</span>`).join(' ');
        
        card.innerHTML = `
            <h3><i class="fas fa-hospital"></i> ${hospital.name}</h3>
            <p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
            <p><i class="fas fa-phone"></i> ${hospital.phone}</p>
            <p><i class="fas fa-road"></i> فاصله: <span class="distance">${hospital.distance} کیلومتر</span></p>
            <p><i class="fas fa-clock"></i> زمان تقریبی رسیدن: ${hospital.travelTime} دقیقه</p>
            <div class="specialties"><i class="fas fa-stethoscope"></i> تخصص‌ها: ${specialties}</div>
            <button class="btn-secondary show-on-map" data-id="${hospital.id}">
                <i class="fas fa-map-marked-alt"></i> نمایش روی نقشه
            </button>
        `;
        
        hospitalList.appendChild(card);
    });
    
    // Add event listeners to "Show on map" buttons
    document.querySelectorAll('.show-on-map').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            const hospital = hospitals.find(h => h.id === id);
            if (hospital) {
                map.setView([hospital.lat, hospital.lng], 15);
                // Find and open the marker's popup
                const marker = hospitalMarkers.find(m => 
                    m.getLatLng().lat === hospital.lat && 
                    m.getLatLng().lng === hospital.lng
                );
                if (marker) {
                    marker.openPopup();
                }
            }
        });
    });
}

// Show loader with custom message
function showLoader(message) {
    const loader = document.getElementById('loader');
    loader.querySelector('p').textContent = message;
    loader.classList.remove('hidden');
    document.getElementById('error-message').classList.add('hidden');
}

// Hide loader
function hideLoader() {
    document.getElementById('loader').classList.add('hidden');
}

// Show error message
function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    
    // Hide error after 5 seconds
    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 5000);
}

// Add some CSS for markers (added via JavaScript for simplicity)
function addMarkerStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .user-marker {
            position: relative;
            width: 30px;
            height: 30px;
        }
        
        .pulse-dot {
            position: absolute;
            width: 100%;
            height: 100%;
            background-color: #3498db;
            border-radius: 50%;
            opacity: 0.6;
            animation: pulse 2s infinite;
        }
        
        .inner-dot {
            position: absolute;
            top: 5px;
            left: 5px;
            width: 20px;
            height: 20px;
            background-color: #2980b9;
            border-radius: 50%;
            border: 2px solid white;
        }
        
        .hospital-marker {
            color: #e74c3c;
            font-size: 24px;
            text-shadow: 0 0 3px white;
        }
        
        @keyframes pulse {
            0% {
                transform: scale(0.8);
                opacity: 0.6;
            }
            70% {
                transform: scale(1.3);
                opacity: 0;
            }
            100% {
                transform: scale(0.8);
                opacity: 0;
            }
        }
        
        .hospital-card .specialties {
            margin-top: 10px;
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }
        
        .hospital-card .specialty {
            background-color: #e8f4fc;
            color: #3498db;
            padding: 3px 8px;
            border-radius: 15px;
            font-size: 12px;
        }
        
        .hospital-card .btn-secondary {
            margin-top: 10px;
            width: 100%;
            justify-content: center;
        }
        
        .no-results {
            text-align: center;
            color: #7f8c8d;
            padding: 20px;
        }
    `;
    document.head.appendChild(style);
}

// Add marker styles when the script loads
addMarkerStyles();