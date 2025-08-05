// Hospital Map Application - Modern Redesign
document.addEventListener('DOMContentLoaded', () => {
    // Application State
    const state = {
        map: null,
        userLocation: null,
        userMarker: null,
        currentTheme: 'light',
        isInBorujerd: false,
        selectedHospital: null,
        routingControl: null,
        currentTransportMode: 'walk',
        hospitals: [],
        hospitalMarkers: {},
        activePanel: null,
        geolocationWatchId: null,
        isFirstLocation: true // Flag for first location update
    };

    // DOM Elements
    const elements = {
        mapContainer: document.getElementById('map'),
        hospitalPanel: document.getElementById('hospital-panel'),
        routePanel: document.getElementById('route-panel'),
        nearbyPanel: document.getElementById('nearby-panel'),
        menuPanel: document.getElementById('menu-panel'),
        searchContainer: document.getElementById('search-container'),
        notification: document.getElementById('notification'),
        notificationIcon: document.getElementById('notification-icon'),
        notificationMessage: document.getElementById('notification-message'),
        loadingOverlay: document.getElementById('loading-overlay'),
        darkModeToggle: document.getElementById('dark-mode-toggle'),
        currentYear: document.getElementById('current-year')
    };

    // Hospital Data
    const hospitalData = [
        {
            id: 1,
            name: "بیمارستان شهید چمران",
            coords: [33.89684661387162, 48.74189615249634],
            address: "بروجرد، بلوار دکتر نصراللهی، بین میدان زینب کبری و شهید رجایی",
            phone: "066-43210000",
            type: "عمومی",
            emergency: true,
            specialties: ["اورژانس", "اطفال", "زنان", "جراحی", "داخلی", "ارتوپدی", "اورولوژی"],
            photo: "assets/img/hospitals/chamran.jpg",
            description: "بیمارستان شهید چمران یکی از بیمارستان‌های اصلی شهر بروجرد است که خدمات درمانی عمومی ارائه می‌دهد."
        },
        {
            id: 2,
            name: "بیمارستان امام خمینی (ره)",
            coords: [33.90148164166486, 48.74766021966935],
            address: "بروجرد، سید مصطفی خمینی، گیوه کش (محلهٔ پدافند)",
            phone: "066-43220000",
            type: "عمومی",
            emergency: true,
            specialties: ["اورژانس", "اطفال", "زنان", "جراحی", "قلب", "گوارش", "پوست"],
            photo: "assets/img/hospitals/emam.jpg",
            description: "بیمارستان امام خمینی یکی از مراکز درمانی مهم شهر بروجرد با بخش‌های تخصصی مختلف است."
        },
        {
            id: 3,
            name: "بیمارستان بهبود",
            coords: [33.89666880647936, 48.76236081841194],
            address: "بروجرد، بلوار صفا، جعفری، 18 متری، شهید مطیعی (محلهٔ صوفیان)",
            phone: "066-43230000",
            type: "خصوصی",
            emergency: false,
            specialties: ["زنان", "اطفال", "چشم پزشکی", "دندانپزشکی"],
            photo: "assets/img/hospitals/behbood.jpg",
            description: "بیمارستان بهبود یک مرکز درمانی خصوصی با امکانات مدرن و کادر مجرب است."
        },
        {
            id: 4,
            name: "بیمارستان تأمین اجتماعی کوثری",
            coords: [33.8777597, 48.7662033],
            address: "بروجرد، بلوار امام خمینی، میدان امام خمینی",
            phone: "066-43240000",
            type: "تأمین اجتماعی",
            emergency: true,
            specialties: ["اورژانس", "اطفال", "زنان", "جراحی", "رادیولوژی"],
            photo: "assets/img/hospitals/kowsar.jpg",
            description: "بیمارستان کوثری مرکز درمانی وابسته به سازمان تأمین اجتماعی است."
        },
        {
            id: 5,
            name: "بیمارستان تخصصی شفا",
            coords: [33.8934, 48.7521],
            address: "بروجرد، خیابان شریعتی، کوچه شهید مطهری",
            phone: "066-43250000",
            type: "خصوصی",
            emergency: true,
            specialties: ["اورژانس", "جراحی", "ارتوپدی", "فیزیوتراپی"],
            photo: "assets/img/hospitals/shafa.jpg",
            description: "بیمارستان شفا یک مرکز تخصصی با تجهیزات پیشرفته جراحی است."
        }
    ];

    // Custom Icons
    const icons = {
        hospital: L.icon({
            iconUrl: 'assets/img/icons/hospital.png',
            iconSize: [42, 42],
            iconAnchor: [21, 42],
            popupAnchor: [0, -42],
            className: 'hospital-marker'
        }),
        emergency: L.icon({
            iconUrl: 'assets/img/icons/emergency.png',
            iconSize: [48, 48],
            iconAnchor: [24, 48],
            popupAnchor: [0, -48],
            className: 'hospital-marker emergency'
        }),
        user: L.icon({
            iconUrl: 'assets/img/icons/user.png',
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36],
            className: 'user-marker'
        })
    };

    // Initialize Application
    function init() {
        setCurrentYear();
        loadTheme();
        initMap();
        initEventListeners();
        loadHospitals();
        showWelcomeNotification();
    }

    // Set current year in footer
    function setCurrentYear() {
        const now = new Date();
        const persianYear = now.getFullYear() - 621;
        elements.currentYear.textContent = persianYear;
    }

    // Load saved theme from localStorage
    function loadTheme() {
        state.currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', state.currentTheme);
        elements.darkModeToggle.checked = state.currentTheme === 'dark';
    }

    // Initialize Leaflet Map
    function initMap() {
        if (!elements.mapContainer) {
            showNotification('خطا در بارگذاری نقشه', 'error');
            return;
        }

        try {
            state.map = L.map('map', {
                center: [33.8973, 48.7543],
                zoom: 14,
                minZoom: 12,
                maxZoom: 18,
                zoomControl: false,
                maxBounds: [[33.75, 48.60], [34.00, 48.90]],
                maxBoundsViscosity: 0.5
            });

            loadMapLayer();
            
            // Add custom zoom control
            L.control.zoom({
                position: 'bottomright'
            }).addTo(state.map);

        } catch (error) {
            console.error('Error initializing map:', error);
            showNotification('خطا در بارگذاری نقشه', 'error');
        }
    }

    // Load appropriate map layer based on current theme
    function loadMapLayer() {
        // Remove existing tile layers
        state.map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
                state.map.removeLayer(layer);
            }
        });

        const tileLayerUrl = state.currentTheme === 'dark' 
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

        L.tileLayer(tileLayerUrl, {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(state.map);
    }

    // Load hospitals data and create markers
    function loadHospitals() {
        state.hospitals = hospitalData;
        
        state.hospitals.forEach(hospital => {
            const marker = L.marker(hospital.coords, {
                icon: hospital.emergency ? icons.emergency : icons.hospital,
                riseOnHover: true,
                zIndexOffset: hospital.emergency ? 100 : 0
            }).addTo(state.map);
            
            marker.hospital = hospital;
            marker.bindPopup(createPopupContent(hospital), {
                className: 'hospital-popup',
                closeButton: false,
                maxWidth: 300,
                minWidth: 250
            });
            
            // Add click event to show hospital details
            marker.on('click', () => {
                showHospitalDetails(hospital.id);
            });
            
            marker.on('popupopen', () => {
                // Add event listeners to popup buttons
                document.querySelectorAll('.popup-btn[data-action="details"]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const hospitalId = parseInt(btn.dataset.id);
                        showHospitalDetails(hospitalId);
                        marker.closePopup();
                    });
                });
                
                document.querySelectorAll('.popup-btn[data-action="route"]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const hospitalId = parseInt(btn.dataset.id);
                        locateUser();
                        setTimeout(() => showRoutePanel(hospitalId), 1000);
                        marker.closePopup();
                    });
                });
            });
            
            state.hospitalMarkers[hospital.id] = marker;
        });
    }

    // Create popup content for hospital markers
    function createPopupContent(hospital) {
        const emergencyBadge = hospital.emergency 
            ? `<span class="emergency-badge"><i class="fas fa-ambulance"></i> اورژانس</span>`
            : '';
        
        return `
            <div class="popup-content">
                <div class="popup-header">
                    <h4>${hospital.name}</h4>
                    ${emergencyBadge}
                </div>
                <div class="popup-body">
                    <p><i class="fas fa-hospital"></i> ${hospital.type}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>
                    <div class="popup-actions">
                        <button class="popup-btn details-btn" data-id="${hospital.id}" data-action="details">
                            <i class="fas fa-info-circle"></i> جزئیات
                        </button>
                        <button class="popup-btn route-btn" data-id="${hospital.id}" data-action="route">
                            <i class="fas fa-route"></i> مسیر
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Initialize event listeners
    function initEventListeners() {
        // Navigation buttons
        document.getElementById('btn-search').addEventListener('click', toggleSearch);
        document.getElementById('btn-search-close').addEventListener('click', toggleSearch);
        document.getElementById('btn-nearby').addEventListener('click', showNearbyHospitals);
        document.getElementById('btn-menu').addEventListener('click', toggleMenu);
        
        // Panel back buttons
        document.querySelectorAll('.btn-back').forEach(btn => {
            btn.addEventListener('click', closeAllPanels);
        });
        
        // Hospital panel actions
        document.getElementById('btn-call-hospital').addEventListener('click', callHospital);
        document.getElementById('btn-show-route').addEventListener('click', showRouteFromPanel);
        
        // Dark mode toggle
        elements.darkModeToggle.addEventListener('change', toggleDarkMode);
        
        // Locate button
        document.getElementById('fab-locate').addEventListener('click', locateUser);
        document.getElementById('menu-locate').addEventListener('click', locateUser);
        
        // Search functionality
        document.getElementById('search-input').addEventListener('input', handleSearch);
        document.getElementById('btn-search-submit').addEventListener('click', handleSearchSubmit);
        
        // Route mode buttons
        document.addEventListener('click', function(e) {
            if (e.target.closest('.mode-btn')) {
                const mode = e.target.closest('.mode-btn').dataset.mode;
                setTransportMode(mode);
            }
        });
        
        // Close panels when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.panel') && !e.target.closest('#btn-nearby') && 
                !e.target.closest('#btn-menu') && !e.target.closest('#btn-search')) {
                closeAllPanels();
            }
        });
    }

    // Toggle search container
    function toggleSearch() {
        elements.searchContainer.classList.toggle('active');
        
        if (elements.searchContainer.classList.contains('active')) {
            document.getElementById('search-input').focus();
        } else {
            document.getElementById('search-input').value = '';
            handleSearch(); // Clear search results
        }
    }

    // Handle search input
    function handleSearch() {
        const query = document.getElementById('search-input').value.trim().toLowerCase();
        
        if (query.length < 2) {
            // Clear search highlights
            Object.values(state.hospitalMarkers).forEach(marker => {
                if (marker._icon) {
                    marker._icon.style.filter = '';
                }
            });
            return;
        }
        
        // Highlight matching hospitals
        let hasResults = false;
        state.hospitals.forEach(hospital => {
            const matchesName = hospital.name.toLowerCase().includes(query);
            const matchesSpecialty = hospital.specialties.some(s => s.toLowerCase().includes(query));
            const matchesType = hospital.type.toLowerCase().includes(query);
            
            if (matchesName || matchesSpecialty || matchesType) {
                state.hospitalMarkers[hospital.id]._icon.style.filter = 'drop-shadow(0 0 8px rgba(37, 99, 235, 0.8))';
                hasResults = true;
                
                if (matchesName) {
                    // Zoom to the first matching hospital by name
                    state.map.setView(hospital.coords, 15);
                }
            } else {
                state.hospitalMarkers[hospital.id]._icon.style.filter = '';
            }
        });
        
        if (!hasResults) {
            showNotification('هیچ بیمارستانی یافت نشد', 'info');
        }
    }

    // Handle search submit
    function handleSearchSubmit() {
        const query = document.getElementById('search-input').value.trim();
        if (query) {
            toggleSearch();
        }
    }

    // Toggle dark mode
    function toggleDarkMode() {
        state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', state.currentTheme);
        localStorage.setItem('theme', state.currentTheme);
        loadMapLayer();
        
        // Update markers style
        Object.values(state.hospitalMarkers).forEach(marker => {
            if (marker.isPopupOpen()) {
                marker.openPopup(); // Refresh popup
            }
        });
        
        if (state.userMarker && state.userMarker.isPopupOpen()) {
            state.userMarker.openPopup();
        }
        
        if (state.routingControl) {
            // Update route line color
            state.routingControl.getPlan().waypoints.forEach((waypoint, i) => {
                if (i > 0) {
                    state.routingControl.getPlan().spliceWaypoints(i, 1, waypoint.latLng);
                }
            });
        }
    }

    // Locate user
    function locateUser() {
        if (!navigator.geolocation) {
            showNotification('مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند', 'error');
            return;
        }
        
        showNotification('در حال دریافت موقعیت شما...', 'info');
        toggleLoading(true);
        
        // Stop any previous watch
        if (state.geolocationWatchId) {
            navigator.geolocation.clearWatch(state.geolocationWatchId);
        }
        
        // Get current position with high accuracy
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                state.isInBorujerd = checkIfInBorujerd(lat, lng);
                
                if (!state.isInBorujerd) {
                    showNotification('شما در محدوده بروجرد نیستید', 'warning');
                    toggleLoading(false);
                    return;
                }
                
                state.userLocation = { lat, lng };
                updateUserMarker(lat, lng);
                
                showNotification('موقعیت شما با موفقیت مشخص شد', 'success');
                toggleLoading(false);
                
                // Auto show nearby hospitals if user is in Borujerd
                if (state.activePanel === 'nearby') {
                    showNearbyHospitals();
                }
                
                // Start watching position with less frequency
                state.geolocationWatchId = navigator.geolocation.watchPosition(
                    pos => {
                        const newLat = pos.coords.latitude;
                        const newLng = pos.coords.longitude;
                        
                        if (state.userLocation.lat !== newLat || state.userLocation.lng !== newLng) {
                            state.userLocation = { lat: newLat, lng: newLng };
                            updateUserMarker(newLat, newLng, false); // Don't center on update
                        }
                    },
                    null,
                    {
                        enableHighAccuracy: true,
                        maximumAge: 30000, // 30 seconds
                        timeout: 10000
                    }
                );
            },
            error => {
                console.error('Geolocation error:', error);
                let message = 'خطا در دریافت موقعیت مکانی';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'دسترسی به موقعیت مکانی رد شد';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'اطلاعات موقعیت مکانی در دسترس نیست';
                        break;
                    case error.TIMEOUT:
                        message = 'دریافت موقعیت مکانی زمان‌بر شد';
                        break;
                }
                
                showNotification(message, 'error');
                toggleLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    // Check if coordinates are within Borujerd bounds
    function checkIfInBorujerd(lat, lng) {
        const borujerdBounds = {
            north: 34.00,
            south: 33.75,
            west: 48.60,
            east: 48.90
        };
        
        return (
            lat >= borujerdBounds.south &&
            lat <= borujerdBounds.north &&
            lng >= borujerdBounds.west &&
            lng <= borujerdBounds.east
        );
    }

    // Update user marker on map
    function updateUserMarker(lat, lng, centerMap = true) {
        if (state.userMarker) {
            state.map.removeLayer(state.userMarker);
        }
        
        state.userMarker = L.marker([lat, lng], { 
            icon: icons.user,
            zIndexOffset: 1000
        }).addTo(state.map);
        
        state.userMarker.bindPopup('شما اینجا هستید', {
            className: 'user-popup',
            closeButton: false
        }).openPopup();
        
        if (centerMap) {
            state.map.setView([lat, lng], 15);
        }
    }

    // Show nearby hospitals panel
    function showNearbyHospitals() {
        if (!state.userLocation || !state.isInBorujerd) {
            locateUser();
            setTimeout(showNearbyHospitals, 1500);
            return;
        }
        
        const sortedHospitals = [...state.hospitals].sort((a, b) => {
            const distA = getDistance(
                state.userLocation.lat, 
                state.userLocation.lng, 
                a.coords[0], 
                a.coords[1]
            );
            
            const distB = getDistance(
                state.userLocation.lat, 
                state.userLocation.lng, 
                b.coords[0], 
                b.coords[1]
            );
            
            return distA - distB;
        });
        
        const nearestHospitals = sortedHospitals.slice(0, 5);
        const nearbyList = document.getElementById('nearby-list');
        nearbyList.innerHTML = '';
        
        if (nearestHospitals.length === 0) {
            nearbyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-hospital"></i>
                    <p>بیمارستانی در نزدیکی شما یافت نشد</p>
                </div>
            `;
            return;
        }
        
        nearestHospitals.forEach(hospital => {
            const distance = getDistance(
                state.userLocation.lat, 
                state.userLocation.lng,
                hospital.coords[0],
                hospital.coords[1]
            ) / 1000;
            
            const time = calculateTravelTime(distance, state.currentTransportMode);
            
            const emergencyBadge = hospital.emergency 
                ? `<span class="emergency-badge"><i class="fas fa-ambulance"></i> اورژانس</span>`
                : '';
            
            const item = document.createElement('li');
            item.className = 'nearby-item';
            item.innerHTML = `
                <div class="nearby-item-header">
                    <div class="hospital-info">
                        <h4>${hospital.name}</h4>
                        <span class="hospital-type">${hospital.type}</span>
                    </div>
                    ${emergencyBadge}
                </div>
                <div class="distance-time">
                    <div class="distance">
                        <i class="fas fa-ruler"></i> ${distance.toFixed(2)} کیلومتر
                    </div>
                    <div class="time">
                        <i class="fas fa-clock"></i> حدود ${time} دقیقه
                    </div>
                </div>
                <p class="hospital-address">${hospital.address}</p>
                <div class="nearby-actions">
                    <button class="nearby-btn details" data-id="${hospital.id}">
                        <i class="fas fa-info-circle"></i> جزئیات
                    </button>
                    <button class="nearby-btn route" data-id="${hospital.id}">
                        <i class="fas fa-route"></i> مسیریابی
                    </button>
                </div>
            `;
            
            // Add event listeners to buttons
            item.querySelector('.nearby-btn.details').addEventListener('click', () => {
                const hospitalId = parseInt(item.querySelector('.nearby-btn.details').dataset.id);
                showHospitalDetails(hospitalId);
            });
            
            item.querySelector('.nearby-btn.route').addEventListener('click', () => {
                const hospitalId = parseInt(item.querySelector('.nearby-btn.route').dataset.id);
                showRoutePanel(hospitalId);
            });
            
            nearbyList.appendChild(item);
        });
        
        openPanel('nearby');
    }

    // Calculate distance between two coordinates (in meters)
    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Calculate travel time based on distance and transport mode
    function calculateTravelTime(distanceKm, mode) {
        let speedKmH;
        
        switch (mode) {
            case 'walk':
                speedKmH = 5;
                break;
            case 'bike':
                speedKmH = 15;
                break;
            case 'drive':
                speedKmH = 30;
                break;
            default:
                speedKmH = 5;
        }
        
        const timeHours = distanceKm / speedKmH;
        return Math.round(timeHours * 60);
    }

    // Show hospital details panel
    function showHospitalDetails(hospitalId) {
        const hospital = state.hospitals.find(h => h.id === hospitalId);
        if (!hospital) return;
        
        state.selectedHospital = hospital;
        
        // Update panel content
        document.getElementById('hospital-name').textContent = hospital.name;
        document.getElementById('hospital-address').textContent = hospital.address;
        document.getElementById('hospital-phone').textContent = hospital.phone;
        document.getElementById('hospital-description').textContent = hospital.description;
        
        // Update hospital type and emergency badges
        document.getElementById('hospital-type-badge').textContent = hospital.type;
        document.getElementById('hospital-emergency-badge').style.display = hospital.emergency ? 'flex' : 'none';
        
        // Update specialties list
        const specialtiesList = document.getElementById('specialties-list');
        specialtiesList.innerHTML = '';
        hospital.specialties.forEach(spec => {
            const li = document.createElement('li');
            li.textContent = spec;
            specialtiesList.appendChild(li);
        });
        
        // Load hospital image with lazy loading
        const hospitalImage = document.getElementById('hospital-image');
        hospitalImage.style.backgroundImage = `url('${hospital.photo}')`;
        
        // Center map on hospital
        state.map.setView(hospital.coords, 16, {
            animate: true,
            duration: 1
        });
        
        // Close any open popup
        if (state.hospitalMarkers[hospital.id]) {
            state.hospitalMarkers[hospital.id].closePopup();
        }
        
        openPanel('hospital');
    }

    // Show route panel
    function showRoutePanel(hospitalId) {
        const hospital = state.hospitals.find(h => h.id === hospitalId);
        if (!hospital || !state.userLocation || !state.isInBorujerd) {
            showNotification('لطفاً ابتدا موقعیت خود را مشخص کنید', 'warning');
            return;
        }
        
        state.selectedHospital = hospital;
        
        // Remove existing route if any
        if (state.routingControl) {
            state.map.removeControl(state.routingControl);
            state.routingControl = null;
        }
        
        // Show loading
        document.getElementById('route-instructions').innerHTML = `
            <div class="loading-route">
                <i class="fas fa-spinner fa-spin"></i>
                <span>در حال محاسبه مسیر...</span>
            </div>
        `;
        
        // Create new routing control
        state.routingControl = L.Routing.control({
            waypoints: [
                L.latLng(state.userLocation.lat, state.userLocation.lng),
                L.latLng(hospital.coords[0], hospital.coords[1])
            ],
            routeWhileDragging: false,
            showAlternatives: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            lineOptions: {
                styles: [{
                    color: state.currentTheme === 'dark' ? '#3b82f6' : '#2563eb',
                    opacity: 0.8,
                    weight: 6
                }]
            },
            createMarker: () => null,
            collapsible: false,
            position: 'topleft',
            router: new L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1',
                profile: getRoutingProfile(state.currentTransportMode)
            })
        }).addTo(state.map);
        
        // Handle route found event
        state.routingControl.on('routesfound', function(e) {
            const routes = e.routes;
            const summary = routes[0].summary;
            const distance = (summary.totalDistance / 1000).toFixed(2);
            const time = (summary.totalTime / 60).toFixed(0);
            
            // Update summary
            document.getElementById('route-distance').textContent = `${distance} کیلومتر`;
            document.getElementById('route-time').textContent = `${time} دقیقه`;
            
            // Update instructions
            updateRouteInstructions(routes[0], hospital);
        });
        
        openPanel('route');
    }

    // Get routing profile based on transport mode
    function getRoutingProfile(mode) {
        switch (mode) {
            case 'walk':
                return 'foot';
            case 'bike':
                return 'bike';
            case 'drive':
                return 'car';
            default:
                return 'foot';
        }
    }

    // Update route instructions in panel
    function updateRouteInstructions(route, hospital) {
        const instructionsContainer = document.getElementById('route-instructions');
        instructionsContainer.innerHTML = '';
        
        // Add summary instruction
        const summaryItem = document.createElement('div');
        summaryItem.className = 'route-instruction-item summary';
        summaryItem.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>مسیر پیشنهادی از موقعیت فعلی شما به ${hospital.name}</span>
        `;
        instructionsContainer.appendChild(summaryItem);
        
        // Add start point
        const startItem = document.createElement('div');
        startItem.className = 'route-instruction-item start';
        startItem.innerHTML = `
            <i class="fas fa-map-marker-alt"></i>
            <span>موقعیت فعلی شما</span>
        `;
        instructionsContainer.appendChild(startItem);
        
        // Add route instructions (limited to 8 steps)
        route.instructions.slice(0, 8).forEach(instruction => {
            const instructionItem = document.createElement('div');
            instructionItem.className = 'route-instruction-item';
            
            const icon = document.createElement('i');
            icon.className = 'route-instruction-icon';
            
            // Set appropriate icon based on instruction type
            if (instruction.type.includes('Left')) {
                icon.className += ' fas fa-arrow-left';
            } else if (instruction.type.includes('Right')) {
                icon.className += ' fas fa-arrow-right';
            } else if (instruction.type.includes('Straight') || instruction.type.includes('Continue')) {
                icon.className += ' fas fa-arrow-up';
            } else if (instruction.type.includes('Depart')) {
                icon.className += ' fas fa-sign-out-alt';
            } else if (instruction.type.includes('Arrive')) {
                icon.className += ' fas fa-sign-in-alt';
            } else {
                icon.className += ' fas fa-arrow-up';
            }
            
            const text = document.createElement('span');
            text.textContent = instruction.text;
            
            instructionItem.appendChild(icon);
            instructionItem.appendChild(text);
            instructionsContainer.appendChild(instructionItem);
        });
        
        // Add end point
        const endItem = document.createElement('div');
        endItem.className = 'route-instruction-item end';
        endItem.innerHTML = `
            <i class="fas fa-flag-checkered"></i>
            <span>${hospital.name}</span>
        `;
        instructionsContainer.appendChild(endItem);
    }

    // Set transport mode and refresh route
    function setTransportMode(mode) {
        if (state.currentTransportMode === mode) return;
        
        state.currentTransportMode = mode;
        
        // Update active button
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Refresh route if a hospital is selected
        if (state.selectedHospital) {
            showRoutePanel(state.selectedHospital.id);
        }
    }

    // Call hospital phone number
    function callHospital() {
        if (state.selectedHospital) {
            window.open(`tel:${state.selectedHospital.phone}`);
        }
    }

    // Show route from hospital panel
    function showRouteFromPanel() {
        if (state.selectedHospital) {
            showRoutePanel(state.selectedHospital.id);
        }
    }

    // Toggle menu panel
    function toggleMenu() {
        if (state.activePanel === 'menu') {
            closeAllPanels();
        } else {
            openPanel('menu');
        }
    }

    // Open specific panel
    function openPanel(panelName) {
        closeAllPanels();
        
        state.activePanel = panelName;
        
        switch (panelName) {
            case 'hospital':
                elements.hospitalPanel.classList.add('open');
                break;
            case 'route':
                elements.routePanel.classList.add('open');
                break;
            case 'nearby':
                elements.nearbyPanel.classList.add('open');
                break;
            case 'menu':
                elements.menuPanel.classList.add('open');
                break;
        }
    }

    // Close all panels
    function closeAllPanels() {
        elements.hospitalPanel.classList.remove('open');
        elements.routePanel.classList.remove('open');
        elements.nearbyPanel.classList.remove('open');
        elements.menuPanel.classList.remove('open');
        elements.searchContainer.classList.remove('active');
        
        state.activePanel = null;
        
        // Remove route from map
        if (state.routingControl) {
            state.map.removeControl(state.routingControl);
            state.routingControl = null;
        }
    }

    // Show notification
    function showNotification(message, type = 'info') {
        elements.notificationMessage.textContent = message;
        
        // Set icon based on type
        let iconClass;
        switch (type) {
            case 'success':
                iconClass = 'fas fa-check-circle';
                break;
            case 'error':
                iconClass = 'fas fa-exclamation-circle';
                break;
            case 'warning':
                iconClass = 'fas fa-exclamation-triangle';
                break;
            default:
                iconClass = 'fas fa-info-circle';
        }
        
        elements.notificationIcon.className = `notification-icon ${iconClass}`;
        elements.notification.classList.add('show');
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            elements.notification.classList.remove('show');
        }, 3000);
    }

    // Toggle loading overlay
    function toggleLoading(show) {
        if (show) {
            elements.loadingOverlay.classList.add('active');
        } else {
            elements.loadingOverlay.classList.remove('active');
        }
    }

    // Show welcome notification
    function showWelcomeNotification() {
        setTimeout(() => {
            showNotification('به نقشه بیمارستان‌های بروجرد خوش آمدید', 'info');
        }, 1000);
    }

    // Initialize the application
    init();
});