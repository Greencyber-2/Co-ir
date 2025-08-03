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
const restaurantsList = document.getElementById('restaurants-list');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const distanceFilter = document.getElementById('distance-filter');
const ratingFilter = document.getElementById('rating-filter');
const cuisineFilters = document.querySelectorAll('.cuisine-filter');

// Variables
let userLocation = null;
let restaurants = [];
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

const restaurantIcon = L.divIcon({
    html: '<i class="fas fa-utensils" style="color: #EA4335; font-size: 20px;"></i>',
    className: 'custom-restaurant-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

// Fetch restaurants data
async function fetchRestaurants() {
    try {
        showLoading();
        const response = await fetch('restaurants.json');
        
        if (!response.ok) {
            throw new Error('خطا در دریافت اطلاعات رستوران‌ها');
        }
        
        const data = await response.json();
        restaurants = data;
        hideLoading();
        return data;
    } catch (error) {
        hideLoading();
        showMessage(error.message, 'error');
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

// Display restaurants on map and list
function displayRestaurants(userLatLng, filterOptions = {}) {
    // Clear previous markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    restaurantsList.innerHTML = '';
    
    const { maxDistance = 2000, minRating = 0, searchTerm = '', cuisines = [] } = filterOptions;
    let found = false;
    
    restaurants.forEach(restaurant => {
        // Calculate distance
        const distance = calculateDistance(
            userLatLng.lat, userLatLng.lng,
            restaurant.lat, restaurant.lng
        );
        
        // Apply filters
        const matchesDistance = distance <= maxDistance;
        const matchesRating = restaurant.rating >= minRating;
        const matchesSearch = restaurant.name.includes(searchTerm) || 
                             restaurant.description.includes(searchTerm) ||
                             restaurant.cuisine.includes(searchTerm);
        const matchesCuisine = cuisines.length === 0 || cuisines.includes(restaurant.cuisine);
        
        if (matchesDistance && matchesRating && matchesSearch && matchesCuisine) {
            found = true;
            
            // Create marker
            const marker = L.marker([restaurant.lat, restaurant.lng], {
                icon: restaurantIcon,
                restaurantId: restaurant.id
            }).addTo(map);
            
            // Add popup
            marker.bindPopup(`
                <h3>${restaurant.name}</h3>
                <p>${restaurant.cuisine}</p>
                <p>فاصله: ${Math.round(distance)} متر</p>
                <p>رتبه: ${'★'.repeat(restaurant.rating)}${'☆'.repeat(5 - restaurant.rating)}</p>
                ${restaurant.description ? `<p>${restaurant.description}</p>` : ''}
                ${restaurant.phone ? `<p><i class="fas fa-phone"></i> ${restaurant.phone}</p>` : ''}
            `);
            
            markers.push(marker);
            
            // Add to list
            const restaurantItem = document.createElement('div');
            restaurantItem.className = 'restaurant-item';
            restaurantItem.dataset.id = restaurant.id;
            restaurantItem.innerHTML = `
                <h4>${restaurant.name}</h4>
                <p>${restaurant.cuisine}</p>
                <p class="restaurant-rating">${'★'.repeat(restaurant.rating)}${'☆'.repeat(5 - restaurant.rating)}</p>
                <p>فاصله: ${Math.round(distance)} متر</p>
            `;
            
            restaurantItem.addEventListener('click', () => {
                map.setView([restaurant.lat, restaurant.lng], 16);
                marker.openPopup();
            });
            
            restaurantsList.appendChild(restaurantItem);
        }
    });
    
    if (!found) {
        showMessage('هیچ رستورانی با فیلترهای انتخاب شده یافت نشد.', 'info', 3000);
    }
}

// Get current location and show nearby restaurants
function getLocationAndShowRestaurants() {
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
                
                // Load restaurants
                await fetchRestaurants();
                
                // Display restaurants
                displayRestaurants(userLocation, {
                    maxDistance: parseInt(distanceFilter.value),
                    minRating: parseInt(ratingFilter.value)
                });
                
                hideLoading();
                showMessage('رستوران‌های نزدیک شما نمایش داده شدند.', 'success');
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
                
                // Still try to load restaurants
                fetchRestaurants().then(() => {
                    displayRestaurants(userLocation, {
                        maxDistance: parseInt(distanceFilter.value),
                        minRating: parseInt(ratingFilter.value)
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
        
        // Still try to load restaurants
        fetchRestaurants().then(() => {
            displayRestaurants(userLocation, {
                maxDistance: parseInt(distanceFilter.value),
                minRating: parseInt(ratingFilter.value)
            });
        });
    }
}

// Filter restaurants based on user input
function applyFilters() {
    if (!userLocation) return;
    
    const selectedCuisines = Array.from(cuisineFilters)
        .filter(filter => filter.checked)
        .map(filter => filter.value);
    
    displayRestaurants(userLocation, {
        maxDistance: parseInt(distanceFilter.value),
        minRating: parseInt(ratingFilter.value),
        searchTerm: searchInput.value,
        cuisines: selectedCuisines
    });
}

// Event listeners
distanceFilter.addEventListener('change', applyFilters);
ratingFilter.addEventListener('change', applyFilters);
cuisineFilters.forEach(filter => {
    filter.addEventListener('change', applyFilters);
});

searchBtn.addEventListener('click', applyFilters);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') applyFilters();
});

// Toggle sidebar on mobile
document.addEventListener('click', (e) => {
    if (e.target.closest('.restaurant-item') || e.target.closest('.leaflet-popup')) {
        return;
    }
    
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('show');
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    getLocationAndShowRestaurants();
    
    // Add toggle button for sidebar on mobile
    if (window.innerWidth <= 768) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'sidebar-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-list"></i> لیست رستوران‌ها';
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