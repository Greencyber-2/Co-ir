// Initialize the map with a default view of Borujerd
const map = L.map('map').setView([33.8972, 48.7516], 14);

// Load map tiles from OpenStreetMap with Farsi support
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 18,
}).addTo(map);

// Add Farsi language support for map controls
L.control.zoom({
    zoomInTitle: 'بزرگنمایی',
    zoomOutTitle: 'کوچکنمایی'
}).addTo(map);

// Enhanced locate control with better accuracy
L.control.locate({
    position: 'topright',
    drawCircle: true,
    follow: true,
    setView: 'untilPanOrZoom',
    keepCurrentZoomLevel: true,
    markerStyle: {
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
    },
    circleStyle: {
        weight: 2,
        clickable: false,
        dashArray: '5,5'
    },
    icon: 'fas fa-location-arrow',
    metric: true,
    strings: {
        title: "موقعیت من",
        popup: "شما در اینجا هستید - دقت: {distance} متر",
        outsideMapBoundsMsg: "شما خارج از محدوده نقشه هستید"
    },
    locateOptions: {
        maxZoom: 16,
        timeout: 15000,
        enableHighAccuracy: true,
        watch: true
    },
    onLocationError: function(err) {
        showMessage("خطا در دریافت موقعیت: " + err.message, 'error');
    },
    onLocationOutsideMapBounds: function() {
        showMessage("شما خارج از محدوده بروجرد هستید", 'warning');
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
let userMarker = null;
let hospitalLayer = null;

// Enhanced hospital data for Borujerd (updated and more accurate)
const sampleHospitals = [
    {
        id: 1,
        name: "بیمارستان امام خمینی (ره) بروجرد",
        lat: 33.8985,
        lng: 48.7523,
        type: "عمومی",
        services: ["اورژانس 24 ساعته", "بخش تخصصی", "آزمایشگاه", "اتاق عمل", "بخش ICU"],
        phone: "066-43210001",
        address: "بلوار امام خمینی، جنب پارک شهر",
        emergency: true,
        website: "http://www.ikhospital-borujerd.ir",
        rating: 4.2
    },
    {
        id: 2,
        name: "بیمارستان تخصصی کودکان امیرالمومنین (ع)",
        lat: 33.8958,
        lng: 48.7497,
        type: "کودکان",
        services: ["اورژانس کودکان", "بخش NICU", "کلینیک تخصصی اطفال"],
        phone: "066-43210002",
        address: "خیابان شهید بهشتی، کوچه 12",
        emergency: true,
        rating: 4.5
    },
    {
        id: 3,
        name: "بیمارستان تخصصی قلب و عروق بروجرد",
        lat: 33.9012,
        lng: 48.7556,
        type: "تخصصی",
        services: ["اکوکاردیوگرافی", "آنژیوگرافی", "CCU", "کلینیک تخصصی قلب"],
        phone: "066-43210003",
        address: "بلوار معلم، نبش خیابان 15",
        emergency: false,
        website: "http://www.heart-borujerd.ir",
        rating: 4.7
    },
    {
        id: 4,
        name: "بیمارستان شهدای بروجرد",
        lat: 33.8943,
        lng: 48.7538,
        type: "عمومی",
        services: ["اورژانس", "آزمایشگاه", "رادیولوژی", "فیزیوتراپی"],
        phone: "066-43210004",
        address: "خیابان شهدا، جنب دانشگاه",
        emergency: true,
        rating: 3.9
    },
    {
        id: 5,
        name: "مرکز درمانی تخصصی نور",
        lat: 33.9005,
        lng: 48.7501,
        type: "تخصصی",
        services: ["کلینیک تخصصی مغز و اعصاب", "نوار مغز", "نوار عصب و عضله"],
        phone: "066-43210005",
        address: "خیابان دکتر شریعتی، پلاک 45",
        emergency: false,
        rating: 4.1
    },
    {
        id: 6,
        name: "بیمارستان تخصصی زنان و زایمان مهر",
        lat: 33.8967,
        lng: 48.7489,
        type: "تخصصی",
        services: ["زایمان طبیعی", "سزارین", "نوزادان", "مامایی"],
        phone: "066-43210006",
        address: "خیابان مطهری، پلاک 32",
        emergency: true,
        rating: 4.3
    },
    {
        id: 7,
        name: "مرکز جراحی محدود پارسیان",
        lat: 33.8992,
        lng: 48.7541,
        type: "تخصصی",
        services: ["جراحی سرپایی", "اندوسکوپی", "کلونوسکوپی"],
        phone: "066-43210007",
        address: "بلوار دانشجو، ساختمان پزشکان پارسیان",
        emergency: false,
        rating: 4.0
    }
];

// Enhanced hospital icons
const hospitalIcons = {
    عمومی: L.divIcon({
        html: '<i class="fas fa-hospital" style="color: #EA4335; font-size: 22px;"></i>',
        className: 'custom-hospital-icon',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
    }),
    تخصصی: L.divIcon({
        html: '<i class="fas fa-procedures" style="color: #34A853; font-size: 22px;"></i>',
        className: 'custom-specialty-icon',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
    }),
    کودکان: L.divIcon({
        html: '<i class="fas fa-baby" style="color: #FBBC05; font-size: 22px;"></i>',
        className: 'custom-children-icon',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
    })
};

const emergencyIcon = L.divIcon({
    html: '<i class="fas fa-ambulance" style="color: #DC3545; font-size: 22px;"></i>',
    className: 'custom-emergency-icon',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
});

const userIcon = L.divIcon({
    html: '<i class="fas fa-user" style="color: #4285F4; font-size: 24px;"></i>',
    className: 'custom-user-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

// Enhanced message system
function showMessage(text, type = 'info', duration = 5000) {
    messageText.textContent = text;
    messageDiv.style.display = 'flex';
    messageDiv.className = type;
    
    if (duration) {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, duration);
    }
}

closeMessageBtn.addEventListener('click', () => {
    messageDiv.style.display = 'none';
});

// Enhanced loading indicator
function showLoading(text = "در حال دریافت موقعیت...") {
    loadingDiv.querySelector('span').textContent = text;
    loadingDiv.style.display = 'flex';
}

function hideLoading() {
    loadingDiv.style.display = 'none';
}

// Enhanced distance calculation (Haversine formula)
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

// Format distance for display
function formatDistance(distance) {
    if (distance < 1000) {
        return `${Math.round(distance)} متر`;
    } else {
        return `${(distance/1000).toFixed(1)} کیلومتر`;
    }
}

// Enhanced hospital display function
function displayHospitals(userLatLng, filterOptions = {}) {
    // Clear previous markers
    if (hospitalLayer) {
        map.removeLayer(hospitalLayer);
    }
    hospitalLayer = L.layerGroup().addTo(map);
    markers = [];
    hospitalsList.innerHTML = '';
    
    const { maxDistance = 2000, service = 'همه', searchTerm = '', types = [] } = filterOptions;
    let found = false;
    
    // Sort hospitals by distance
    const sortedHospitals = [...hospitals].sort((a, b) => {
        const distA = calculateDistance(userLatLng.lat, userLatLng.lng, a.lat, a.lng);
        const distB = calculateDistance(userLatLng.lat, userLatLng.lng, b.lat, b.lng);
        return distA - distB;
    });
    
    sortedHospitals.forEach(hospital => {
        const distance = calculateDistance(userLatLng.lat, userLatLng.lng, hospital.lat, hospital.lng);
        
        // Apply filters
        const matchesDistance = maxDistance === 0 || distance <= maxDistance;
        const matchesService = service === 'همه' || hospital.services.some(s => s.includes(service));
        const matchesSearch = searchTerm === '' || 
                             hospital.name.includes(searchTerm) || 
                             hospital.address.includes(searchTerm) ||
                             hospital.services.some(s => s.includes(searchTerm));
        const matchesType = types.length === 0 || types.includes(hospital.type);
        
        if (matchesDistance && matchesService && matchesSearch && matchesType) {
            found = true;
            
            // Create marker with appropriate icon
            const icon = hospital.emergency ? emergencyIcon : hospitalIcons[hospital.type] || hospitalIcons['عمومی'];
            const marker = L.marker([hospital.lat, hospital.lng], {
                icon: icon,
                hospitalId: hospital.id
            }).addTo(hospitalLayer);
            
            // Add popup with more information
            marker.bindPopup(`
                <div class="hospital-popup">
                    <h3>${hospital.name}</h3>
                    <div class="hospital-meta">
                        <span class="hospital-type">${hospital.type}</span>
                        ${hospital.emergency ? '<span class="emergency-badge">اورژانس</span>' : ''}
                        ${hospital.rating ? `<span class="rating-badge"><i class="fas fa-star"></i> ${hospital.rating}</span>` : ''}
                    </div>
                    <p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
                    <p><i class="fas fa-phone"></i> ${hospital.phone}</p>
                    ${hospital.website ? `<p><i class="fas fa-globe"></i> <a href="${hospital.website}" target="_blank">وبسایت</a></p>` : ''}
                    <p class="distance"><i class="fas fa-location-arrow"></i> فاصله: ${formatDistance(distance)}</p>
                    <div class="services">
                        <p><strong>خدمات:</strong></p>
                        <ul>${hospital.services.map(s => `<li>${s}</li>`).join('')}</ul>
                    </div>
                </div>
            `);
            
            markers.push(marker);
            
            // Add to list
            const hospitalItem = document.createElement('div');
            hospitalItem.className = 'hospital-item';
            hospitalItem.dataset.id = hospital.id;
            hospitalItem.innerHTML = `
                <div class="hospital-header">
                    <h4>${hospital.name}</h4>
                    <div class="hospital-badges">
                        ${hospital.emergency ? '<span class="emergency-badge">اورژانس</span>' : ''}
                        ${hospital.rating ? `<span class="rating-badge"><i class="fas fa-star"></i> ${hospital.rating}</span>` : ''}
                    </div>
                </div>
                <p class="hospital-type">${hospital.type}</p>
                <p class="hospital-distance"><i class="fas fa-location-arrow"></i> ${formatDistance(distance)}</p>
                <p class="hospital-phone"><i class="fas fa-phone"></i> ${hospital.phone}</p>
            `;
            
            hospitalItem.addEventListener('click', () => {
                map.setView([hospital.lat, hospital.lng], 16);
                marker.openPopup();
                
                // Highlight the selected item
                document.querySelectorAll('.hospital-item').forEach(item => {
                    item.classList.remove('selected');
                });
                hospitalItem.classList.add('selected');
                
                // Pan to marker with offset for better visibility
                map.panTo([hospital.lat, hospital.lng], {
                    animate: true,
                    duration: 0.5,
                    easeLinearity: 0.25,
                    noMoveStart: false
                });
            });
            
            hospitalsList.appendChild(hospitalItem);
        }
    });
    
    if (!found) {
        showMessage('هیچ بیمارستانی با فیلترهای انتخاب شده یافت نشد.', 'info', 3000);
    } else {
        // Auto-open the first hospital's popup if on mobile
        if (window.innerWidth <= 768 && markers.length > 0) {
            setTimeout(() => {
                markers[0].openPopup();
            }, 500);
        }
    }
}

// Enhanced location function with better error handling
function getLocationAndShowHospitals() {
    if (navigator.geolocation) {
        showLoading("در حال دریافت موقعیت دقیق شما...");
        
        const geolocationOptions = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        };
        
        navigator.geolocation.getCurrentPosition(
            async position => {
                const accuracy = position.coords.accuracy;
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: accuracy
                };
                
                // Remove previous user marker if exists
                if (userMarker) {
                    map.removeLayer(userMarker);
                }
                
                // Add user marker with accuracy circle
                userMarker = L.marker([userLocation.lat, userLocation.lng], {
                    icon: userIcon,
                    zIndexOffset: 1000
                }).addTo(map);
                
                L.circle([userLocation.lat, userLocation.lng], {
                    radius: accuracy,
                    color: '#4285F4',
                    fillColor: '#4285F4',
                    fillOpacity: 0.2,
                    weight: 1
                }).addTo(map);
                
                userMarker.bindPopup(`
                    <div class="user-popup">
                        <h3>موقعیت شما</h3>
                        <p>دقت: ${Math.round(accuracy)} متر</p>
                        <p>${new Date().toLocaleTimeString('fa-IR')}</p>
                    </div>
                `).openPopup();
                
                // Set view with padding to show both user and hospitals
                map.setView([userLocation.lat, userLocation.lng], 15, {
                    animate: true,
                    duration: 1
                });
                
                // Load hospitals
                await fetchHospitals();
                
                // Display hospitals
                displayHospitals(userLocation, {
                    maxDistance: parseInt(distanceFilter.value),
                    service: serviceFilter.value
                });
                
                hideLoading();
                showMessage(`موقعیت شما با دقت ${Math.round(accuracy)} متر مشخص شد.`, 'success');
            },
            error => {
                hideLoading();
                let errorMessage;
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "دسترسی به موقعیت جغرافیایی رد شد. لطفاً در تنظیمات مرورگر خود اجازه دسترسی به موقعیت را فعال کنید.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "اطلاعات موقعیت جغرافیایی در دسترس نیست. لطفاً اتصال اینترنت خود را بررسی کنید.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "دریافت موقعیت جغرافیایی زمان‌بر شد. لطفاً در محیط باز با سیگنال GPS قوی تلاش کنید.";
                        break;
                    default:
                        errorMessage = "خطا در دریافت موقعیت جغرافیایی.";
                }
                
                showMessage(errorMessage, 'error');
                
                // Fallback to Borujerd center with wider view
                userLocation = { lat: 33.8972, lng: 48.7516 };
                map.setView([userLocation.lat, userLocation.lng], 13);
                
                // Still try to load hospitals
                fetchHospitals().then(() => {
                    displayHospitals(userLocation, {
                        maxDistance: parseInt(distanceFilter.value),
                        service: serviceFilter.value
                    });
                });
            },
            geolocationOptions
        );
        
        // Watch for position updates
        navigator.geolocation.watchPosition(
            position => {
                const accuracy = position.coords.accuracy;
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: accuracy
                };
                
                if (userMarker) {
                    userMarker.setLatLng([userLocation.lat, userLocation.lng]);
                    userMarker.getPopup().setContent(`
                        <div class="user-popup">
                            <h3>موقعیت شما</h3>
                            <p>دقت: ${Math.round(accuracy)} متر</p>
                            <p>${new Date().toLocaleTimeString('fa-IR')}</p>
                        </div>
                    `);
                }
                
                // Update hospital distances if needed
                if (hospitals.length > 0) {
                    displayHospitals(userLocation, {
                        maxDistance: parseInt(distanceFilter.value),
                        service: serviceFilter.value,
                        searchTerm: searchInput.value,
                        types: Array.from(typeFilters)
                            .filter(filter => filter.checked)
                            .map(filter => filter.value)
                    });
                }
            },
            null,
            geolocationOptions
        );
    } else {
        showMessage("مرورگر شما از GPS پشتیبانی نمی‌کند. لطفاً از مرورگرهای جدید مانند Chrome یا Firefox استفاده کنید.", 'error');
        
        // Fallback to Borujerd center
        userLocation = { lat: 33.8972, lng: 48.7516 };
        map.setView([userLocation.lat, userLocation.lng], 13);
        
        // Still try to load hospitals
        fetchHospitals().then(() => {
            displayHospitals(userLocation, {
                maxDistance: parseInt(distanceFilter.value),
                service: serviceFilter.value
            });
        });
    }
}

// Enhanced hospital fetching
async function fetchHospitals() {
    try {
        showLoading("در حال دریافت اطلاعات بیمارستان‌ها...");
        
        // In a real app, you would fetch from an API
        // const response = await fetch('https://api.example.com/hospitals?city=borujerd');
        // const data = await response.json();
        
        // For demo, we use enhanced sample data
        hospitals = sampleHospitals;
        
        hideLoading();
        return hospitals;
    } catch (error) {
        hideLoading();
        showMessage("خطا در دریافت اطلاعات بیمارستان‌ها. لطفاً اتصال اینترنت خود را بررسی کنید.", 'error');
        return [];
    }
}

// Enhanced filter application
function applyFilters() {
    if (!userLocation) return;
    
    const selectedTypes = Array.from(typeFilters)
        .filter(filter => filter.checked)
        .map(filter => filter.value);
    
    displayHospitals(userLocation, {
        maxDistance: parseInt(distanceFilter.value),
        service: serviceFilter.value,
        searchTerm: searchInput.value.trim(),
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
function toggleSidebar() {
    sidebar.classList.toggle('show');
    if (sidebar.classList.contains('show')) {
        document.getElementById('sidebar-toggle').textContent = 'بستن لیست';
    } else {
        document.getElementById('sidebar-toggle').textContent = 'نمایش لیست';
    }
}

// Initialize the app with better setup
function initApp() {
    // Set up map with better defaults
    map.attributionControl.setPrefix('');
    map.zoomControl.setPosition('topright');
    
    // Add scale control
    L.control.scale({
        position: 'bottomleft',
        metric: true,
        imperial: false,
        maxWidth: 200
    }).addTo(map);
    
    // Initialize location and hospitals
    getLocationAndShowHospitals();
    
    // Add toggle button for sidebar on mobile
    if (window.innerWidth <= 768) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'sidebar-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-list"></i> نمایش لیست بیمارستان‌ها';
        toggleBtn.className = 'sidebar-toggle-btn';
        
        toggleBtn.addEventListener('click', toggleSidebar);
        document.body.appendChild(toggleBtn);
    }
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);