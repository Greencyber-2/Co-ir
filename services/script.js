// Initialize the map with a default view of Borujerd
const map = L.map('map').setView([33.8972, 48.7516], 14);

// Load map tiles from OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 18,
}).addTo(map);

// Add locate control
L.control.locate({
    position: 'topright',
    drawCircle: true,
    follow: true,
    setView: 'untilPan',
    keepCurrentZoomLevel: true,
    markerStyle: {
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.8,
    },
    circleStyle: {
        weight: 1,
        clickable: false,
    },
    icon: 'fas fa-location-arrow',
    metric: true,
    strings: {
        title: "موقعیت من",
        popup: "شما در اینجا هستید",
        outsideMapBoundsMsg: "شما خارج از محدوده نقشه هستید"
    },
    locateOptions: {
        maxZoom: 15,
        timeout: 10000,
        enableHighAccuracy: true
    }
}).addTo(map);

// DOM elements
const messageDiv = document.getElementById('message');
const messageText = document.getElementById('message-text');
const closeMessageBtn = document.getElementById('close-message');
const loadingDiv = document.getElementById('loading');
const sidebar = document.getElementById('sidebar');
const hospitalsList = document.getElementById('hospitals-list');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const distanceFilter = document.getElementById('distance-filter');
const serviceFilter = document.getElementById('service-filter');
const typeFilters = document.querySelectorAll('.type-filter');

// Variables
let userLocation = null;
let hospitals = [];
let markers = [];

// Show message function
function showMessage(text, type = 'info', duration = 5000) {
    messageText.textContent = text;
    messageDiv.style.display = 'flex';
    
    // Set color based on message type
    if (type === 'error') {
        messageDiv.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
    } else if (type === 'success') {
        messageDiv.style.backgroundColor = 'rgba(40, 167, 69, 0.9)';
    } else {
        messageDiv.style.backgroundColor = 'rgba(30, 30, 30, 0.9)';
    }
    
    if (duration) {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, duration);
    }
}

// Close message manually
closeMessageBtn.addEventListener('click', () => {
    messageDiv.style.display = 'none';
});

// Show loading indicator
function showLoading() {
    loadingDiv.style.display = 'flex';
}

// Hide loading indicator
function hideLoading() {
    loadingDiv.style.display = 'none';
}

// Create custom icons
const userIcon = L.divIcon({
    html: '<i class="fas fa-user" style="color: #4285F4; font-size: 24px;"></i>',
    className: 'custom-user-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const hospitalIcon = L.divIcon({
    html: '<i class="fas fa-hospital" style="color: #EA4335; font-size: 20px;"></i>',
    className: 'custom-hospital-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const emergencyIcon = L.divIcon({
    html: '<i class="fas fa-ambulance" style="color: #DC3545; font-size: 20px;"></i>',
    className: 'custom-emergency-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

// Sample hospitals data for Borujerd
const sampleHospitals = [
    {
        id: 1,
        name: "بیمارستان امام خمینی بروجرد",
        lat: 33.8985,
        lng: 48.7523,
        type: "عمومی",
        services: ["اورژانس", "تخصصی", "آزمایشگاه"],
        phone: "06643210001",
        address: "بلوار امام خمینی، جنب پارک شهر",
        emergency: true
    },
    {
        id: 2,
        name: "بیمارستان تخصصی کودکان بروجرد",
        lat: 33.8958,
        lng: 48.7497,
        type: "کودکان",
        services: ["اورژانس", "تخصصی"],
        phone: "06643210002",
        address: "خیابان شهید بهشتی، کوچه 12",
        emergency: true
    },
    {
        id: 3,
        name: "بیمارستان تخصصی قلب بروجرد",
        lat: 33.9012,
        lng: 48.7556,
        type: "تخصصی",
        services: ["تخصصی", "آزمایشگاه"],
        phone: "06643210003",
        address: "بلوار معلم، نبش خیابان 15",
        emergency: false
    },
    {
        id: 4,
        name: "بیمارستان شهدای بروجرد",
        lat: 33.8943,
        lng: 48.7538,
        type: "عمومی",
        services: ["اورژانس", "آزمایشگاه"],
        phone: "06643210004",
        address: "خیابان شهدا، جنب دانشگاه",
        emergency: true
    },
    {
        id: 5,
        name: "مرکز درمانی تخصصی نور",
        lat: 33.9005,
        lng: 48.7501,
        type: "تخصصی",
        services: ["تخصصی"],
        phone: "06643210005",
        address: "خیابان دکتر شریعتی، پلاک 45",
        emergency: false
    }
];

// Fetch hospitals data
async function fetchHospitals() {
    try {
        showLoading();
        
        // In a real app, you would fetch from an API
        // const response = await fetch('hospitals.json');
        // const data = await response.json();
        
        // For demo, we use sample data
        hospitals = sampleHospitals;
        
        hideLoading();
        return hospitals;
    } catch (error) {
        hideLoading();
        showMessage("خطا در دریافت اطلاعات بیمارستان‌ها: " + error.message, 'error');
        return [];
    }
}

// Calculate distance between two coordinates in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
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

// Display hospitals on map and list
function displayHospitals(userLatLng, filterOptions = {}) {
    // Clear previous markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    hospitalsList.innerHTML = '';
    
    const { maxDistance = 2000, service = 'همه', searchTerm = '', types = [] } = filterOptions;
    let found = false;
    
    hospitals.forEach(hospital => {
        // Calculate distance
        const distance = calculateDistance(
            userLatLng.lat, userLatLng.lng,
            hospital.lat, hospital.lng
        );
        
        // Apply filters
        const matchesDistance = distance <= maxDistance;
        const matchesService = service === 'همه' || hospital.services.includes(service);
        const matchesSearch = hospital.name.includes(searchTerm) || 
                             hospital.address.includes(searchTerm);
        const matchesType = types.length === 0 || types.includes(hospital.type);
        
        if (matchesDistance && matchesService && matchesSearch && matchesType) {
            found = true;
            
            // Create marker
            const marker = L.marker([hospital.lat, hospital.lng], {
                icon: hospital.emergency ? emergencyIcon : hospitalIcon,
                hospitalId: hospital.id
            }).addTo(map);
            
            // Add popup
            marker.bindPopup(`
                <h3>${hospital.name}</h3>
                <p><span class="hospital-type">${hospital.type}</span> ${hospital.emergency ? '<span class="emergency-badge">اورژانس</span>' : ''}</p>
                <p>فاصله: ${Math.round(distance)} متر</p>
                <p><i class="fas fa-phone"></i> ${hospital.phone}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
                <p>خدمات: ${hospital.services.join('، ')}</p>
            `);
            
            markers.push(marker);
            
            // Add to list
            const hospitalItem = document.createElement('div');
            hospitalItem.className = 'hospital-item';
            hospitalItem.dataset.id = hospital.id;
            hospitalItem.innerHTML = `
                <h4>${hospital.name} ${hospital.emergency ? '<span class="emergency-badge">اورژانس</span>' : ''}</h4>
                <p><span class="hospital-type">${hospital.type}</span></p>
                <p>فاصله: ${Math.round(distance)} متر</p>
                <p><i class="fas fa-phone"></i> ${hospital.phone}</p>
            `;
            
            hospitalItem.addEventListener('click', () => {
                map.setView([hospital.lat, hospital.lng], 16);
                marker.openPopup();
                
                // Highlight the selected item
                document.querySelectorAll('.hospital-item').forEach(item => {
                    item.style.backgroundColor = 'white';
                });
                hospitalItem.style.backgroundColor = '#f0f7ff';
            });
            
            hospitalsList.appendChild(hospitalItem);
        }
    });
    
    if (!found) {
        showMessage('هیچ بیمارستانی با فیلترهای انتخاب شده یافت نشد.', 'info', 3000);
    }
}

// Get current location and show nearby hospitals
function getLocationAndShowHospitals() {
    if (navigator.geolocation) {
        showLoading();
        
        navigator.geolocation.getCurrentPosition(
            async position => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Add user marker
                const userMarker = L.marker([userLocation.lat, userLocation.lng], {
                    icon: userIcon
                }).addTo(map);
                
                userMarker.bindPopup('موقعیت شما').openPopup();
                map.setView([userLocation.lat, userLocation.lng], 15);
                
                // Load hospitals
                await fetchHospitals();
                
                // Display hospitals
                displayHospitals(userLocation, {
                    maxDistance: parseInt(distanceFilter.value),
                    service: serviceFilter.value
                });
                
                hideLoading();
                showMessage('بیمارستان‌های نزدیک شما نمایش داده شدند.', 'success');
            },
            error => {
                hideLoading();
                let errorMessage;
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "دسترسی به موقعیت جغرافیایی رد شد. لطفاً تنظیمات مرورگر خود را بررسی کنید.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "اطلاعات موقعیت جغرافیایی در دسترس نیست.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "دریافت موقعیت جغرافیایی زمان‌بر شد.";
                        break;
                    default:
                        errorMessage = "خطای ناشناخته در دریافت موقعیت جغرافیایی.";
                }
                
                showMessage(errorMessage, 'error');
                
                // Fallback to default location (Borujerd center)
                userLocation = { lat: 33.8972, lng: 48.7516 };
                map.setView([userLocation.lat, userLocation.lng], 14);
                
                // Still try to load hospitals
                fetchHospitals().then(() => {
                    displayHospitals(userLocation, {
                        maxDistance: parseInt(distanceFilter.value),
                        service: serviceFilter.value
                    });
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        showMessage("مرورگر شما از GPS پشتیبانی نمی‌کند.", 'error');
        
        // Fallback to default location
        userLocation = { lat: 33.8972, lng: 48.7516 };
        map.setView([userLocation.lat, userLocation.lng], 14);
        
        // Still try to load hospitals
        fetchHospitals().then(() => {
            displayHospitals(userLocation, {
                maxDistance: parseInt(distanceFilter.value),
                service: serviceFilter.value
            });
        });
    }
}

// Filter hospitals based on user input
function applyFilters() {
    if (!userLocation) return;
    
    const selectedTypes = Array.from(typeFilters)
        .filter(filter => filter.checked)
        .map(filter => filter.value);
    
    displayHospitals(userLocation, {
        maxDistance: parseInt(distanceFilter.value),
        service: serviceFilter.value,
        searchTerm: searchInput.value,
        types: selectedTypes
    });
}

// Event listeners
distanceFilter.addEventListener('change', applyFilters);
serviceFilter.addEventListener('change', applyFilters);
typeFilters.forEach(filter => {
    filter.addEventListener('change', applyFilters);
});

searchBtn.addEventListener('click', applyFilters);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') applyFilters();
});

// Toggle sidebar on mobile
document.addEventListener('click', (e) => {
    if (e.target.closest('.hospital-item') || e.target.closest('.leaflet-popup')) {
        return;
    }
    
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('show');
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    getLocationAndShowHospitals();
    
    // Add toggle button for sidebar on mobile
    if (window.innerWidth <= 768) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'sidebar-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-list"></i> لیست بیمارستان‌ها';
        toggleBtn.style.position = 'fixed';
        toggleBtn.style.bottom = '20px';
        toggleBtn.style.right = '20px';
        toggleBtn.style.zIndex = '1000';
        toggleBtn.style.padding = '10px 15px';
        toggleBtn.style.backgroundColor = 'var(--primary-color)';
        toggleBtn.style.color = 'white';
        toggleBtn.style.border = 'none';
        toggleBtn.style.borderRadius = '20px';
        toggleBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        toggleBtn.style.cursor = 'pointer';
        
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
        
        document.body.appendChild(toggleBtn);
    }
});