// متغیرهای جهانی
let map;
let userLocation;
let hospitals = [];
let markers = [];
let infoWindow;
let placesService;
let directionsService;
let directionsRenderer;
let autocomplete;

// تابع مقداردهی اولیه نقشه
function initMap() {
    // ایجاد نقشه اولیه
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 32.6546, lng: 51.6680 }, // مختصات اصفهان
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
            {
                featureType: "poi.medical",
                elementType: "labels.icon",
                stylers: [{ visibility: "on" }]
            }
        ]
    });

    // سرویس‌های مورد نیاز
    placesService = new google.maps.places.PlacesService(map);
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    infoWindow = new google.maps.InfoWindow();

    // فعال کردن جستجوی خودکار
    initAutocomplete();

    // دریافت موقعیت کاربر
    getUserLocation();

    // رویدادهای دکمه‌ها
    document.getElementById("locate-btn").addEventListener("click", centerMapOnUser);
    document.getElementById("zoom-in-btn").addEventListener("click", () => map.setZoom(map.getZoom() + 1));
    document.getElementById("zoom-out-btn").addEventListener("click", () => map.setZoom(map.getZoom() - 1));
    document.getElementById("search-btn").addEventListener("click", searchHospitals);
    document.getElementById("distance-range").addEventListener("input", updateDistanceValue);
    document.querySelectorAll("input[name='hospital-type']").forEach(checkbox => {
        checkbox.addEventListener("change", filterHospitals);
    });

    // رویدادهای مودال
    document.querySelector(".close-btn").addEventListener("click", closeModal);
    document.getElementById("directions-btn").addEventListener("click", showDirections);
    document.getElementById("call-btn").addEventListener("click", callHospital);
    document.getElementById("save-btn").addEventListener("click", saveHospital);

    // جستجوی اولیه بیمارستان‌ها
    setTimeout(searchHospitals, 1000);
}

// تابع دریافت موقعیت کاربر
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // نمایش موقعیت کاربر
                document.getElementById("current-location").textContent = "موقعیت فعلی شما";
                
                // جستجوی آدرس
                getAddressFromLatLng(userLocation);
                
                // مرکزیت نقشه روی کاربر
                centerMapOnUser();
                
                // اضافه کردن نشانگر کاربر
                new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "white"
                    },
                    title: "موقعیت شما"
                });
            },
            error => {
                console.error("خطا در دریافت موقعیت:", error);
                document.getElementById("current-location").textContent = "دسترسی به موقعیت مجاز نیست";
                userLocation = { lat: 32.6546, lng: 51.6680 }; // مختصات پیش‌فرض (اصفهان)
            }
        );
    } else {
        alert("مرورگر شما از سرویس موقعیت‌یابی پشتیبانی نمی‌کند.");
        userLocation = { lat: 32.6546, lng: 51.6680 }; // مختصات پیش‌فرض (اصفهان)
    }
}

// تابع مرکزیت نقشه روی کاربر
function centerMapOnUser() {
    if (userLocation) {
        map.setCenter(userLocation);
        map.setZoom(14);
    }
}

// تابع جستجوی بیمارستان‌ها
function searchHospitals() {
    const searchInput = document.getElementById("search-input").value;
    const distance = parseInt(document.getElementById("distance-range").value) * 1000; // تبدیل به متر
    
    if (!userLocation) {
        alert("لطفاً منتظر بمانید تا موقعیت شما مشخص شود.");
        return;
    }
    
    // نمایش وضعیت بارگذاری
    const hospitalsContainer = document.getElementById("hospitals-container");
    hospitalsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> در حال دریافت اطلاعات...</div>';
    
    // پاکسازی نشانگرهای قبلی
    clearMarkers();
    hospitals = [];
    
    // پارامترهای جستجو
    const request = {
        location: userLocation,
        radius: distance,
        query: searchInput ? searchInput + " بیمارستان" : "بیمارستان",
        type: "hospital"
    };
    
    // جستجوی بیمارستان‌ها
    placesService.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            hospitals = results.filter(place => 
                place.name.toLowerCase().includes("بیمارستان") || 
                place.types.includes("hospital")
            );
            
            // نمایش بیمارستان‌ها
            displayHospitals(hospitals);
            addMarkersToMap(hospitals);
            
            // فیلتر کردن نتایج بر اساس نوع بیمارستان
            filterHospitals();
        } else {
            hospitalsContainer.innerHTML = '<div class="loading">خطا در دریافت اطلاعات بیمارستان‌ها.</div>';
            console.error("خطا در جستجوی بیمارستان‌ها:", status);
        }
    });
}

// تابع نمایش بیمارستان‌ها در لیست
function displayHospitals(hospitalsToShow) {
    const hospitalsContainer = document.getElementById("hospitals-container");
    
    if (hospitalsToShow.length === 0) {
        hospitalsContainer.innerHTML = '<div class="loading">بیمارستانی یافت نشد.</div>';
        return;
    }
    
    hospitalsContainer.innerHTML = "";
    
    hospitalsToShow.forEach(hospital => {
        const distance = calculateDistance(userLocation, hospital.geometry.location);
        const hospitalType = getHospitalType(hospital);
        
        const hospitalCard = document.createElement("div");
        hospitalCard.className = "hospital-card";
        hospitalCard.dataset.id = hospital.place_id;
        hospitalCard.innerHTML = `
            <h4>${hospital.name}</h4>
            <p><i class="fas fa-map-marker-alt"></i> ${hospital.formatted_address || "آدرس نامشخص"}</p>
            <p><i class="fas fa-phone"></i> ${hospital.formatted_phone_number || "تلفن نامشخص"}</p>
            <p class="hospital-distance"><i class="fas fa-road"></i> فاصله: ${distance.toFixed(1)} کیلومتر</p>
        `;
        
        hospitalCard.addEventListener("click", () => showHospitalDetails(hospital));
        hospitalsContainer.appendChild(hospitalCard);
    });
}

// تابع افزودن نشانگرها به نقشه
function addMarkersToMap(hospitalsToMark) {
    markers = [];
    
    hospitalsToMark.forEach(hospital => {
        const marker = new google.maps.Marker({
            position: hospital.geometry.location,
            map: map,
            title: hospital.name,
            icon: {
                url: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/hospital-71.png",
                scaledSize: new google.maps.Size(32, 32)
            }
        });
        
        marker.addListener("click", () => {
            showHospitalDetails(hospital);
        });
        
        markers.push(marker);
    });
}

// تابع نمایش جزئیات بیمارستان
function showHospitalDetails(hospital) {
    const distance = calculateDistance(userLocation, hospital.geometry.location);
    const hospitalType = getHospitalType(hospital);
    
    // پر کردن اطلاعات مودال
    document.getElementById("modal-hospital-name").textContent = hospital.name;
    document.getElementById("modal-hospital-address").textContent = hospital.formatted_address || "آدرس نامشخص";
    document.getElementById("modal-hospital-phone").textContent = hospital.formatted_phone_number || "تلفن نامشخص";
    document.getElementById("modal-hospital-rating").textContent = hospital.rating ? hospital.rating + "/5" : "نامشخص";
    document.getElementById("modal-hospital-hours").textContent = hospital.opening_hours ? 
        (hospital.opening_hours.isOpen() ? "باز" : "بسته") : "نامشخص";
    document.getElementById("modal-hospital-type").textContent = hospitalType;
    document.getElementById("modal-hospital-distance").textContent = distance.toFixed(1) + " کیلومتر";
    
    // ذخیره اطلاعات بیمارستان در دیتاست مودال
    document.getElementById("hospital-modal").dataset.placeId = hospital.place_id;
    document.getElementById("hospital-modal").dataset.phone = hospital.formatted_phone_number || "";
    
    // نمایش مودال
    document.getElementById("hospital-modal").style.display = "block";
    
    // مرکزیت نقشه روی بیمارستان انتخاب شده
    map.panTo(hospital.geometry.location);
    
    // بزرگنمایی
    map.setZoom(16);
}

// تابع بستن مودال
function closeModal() {
    document.getElementById("hospital-modal").style.display = "none";
}

// تابع مسیریابی
function showDirections() {
    const placeId = document.getElementById("hospital-modal").dataset.placeId;
    const hospital = hospitals.find(h => h.place_id === placeId);
    
    if (!hospital || !userLocation) return;
    
    const request = {
        origin: userLocation,
        destination: hospital.geometry.location,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        region: "IR"
    };
    
    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
            
            // نمایش مسافت و زمان
            const route = result.routes[0].legs[0];
            alert(`مسیریابی به ${hospital.name}\nمسافت: ${route.distance.text}\nزمان تخمینی: ${route.duration.text}`);
        } else {
            alert("خطا در مسیریابی. لطفاً دوباره تلاش کنید.");
        }
    });
}

// تابع تماس با بیمارستان
function callHospital() {
    const phoneNumber = document.getElementById("hospital-modal").dataset.phone;
    
    if (phoneNumber) {
        if (confirm(`آیا می‌خواهید با ${phoneNumber} تماس بگیرید؟`)) {
            window.open(`tel:${phoneNumber}`);
        }
    } else {
        alert("شماره تلفن بیمارستان موجود نیست.");
    }
}

// تابع ذخیره بیمارستان
function saveHospital() {
    const placeId = document.getElementById("hospital-modal").dataset.placeId;
    const hospital = hospitals.find(h => h.place_id === placeId);
    
    if (hospital) {
        let savedHospitals = JSON.parse(localStorage.getItem("savedHospitals") || "[]");
        
        if (!savedHospitals.some(h => h.place_id === placeId)) {
            savedHospitals.push({
                place_id: hospital.place_id,
                name: hospital.name,
                address: hospital.formatted_address,
                phone: hospital.formatted_phone_number,
                location: hospital.geometry.location
            });
            
            localStorage.setItem("savedHospitals", JSON.stringify(savedHospitals));
            alert(`${hospital.name} به لیست ذخیره شده‌ها اضافه شد.`);
        } else {
            alert("این بیمارستان قبلاً ذخیره شده است.");
        }
    }
}

// تابع فیلتر کردن بیمارستان‌ها
function filterHospitals() {
    const selectedTypes = Array.from(document.querySelectorAll("input[name='hospital-type']:checked")).map(el => el.value);
    
    const filteredHospitals = hospitals.filter(hospital => {
        const hospitalType = getHospitalType(hospital);
        return selectedTypes.some(type => hospitalType.includes(type));
    });
    
    displayHospitals(filteredHospitals);
    
    // به‌روزرسانی نشانگرها
    clearMarkers();
    addMarkersToMap(filteredHospitals);
}

// تابع تشخیص نوع بیمارستان
function getHospitalType(hospital) {
    const name = hospital.name.toLowerCase();
    
    if (name.includes("خصوصی") || name.includes("خاص")) return "خصوصی";
    if (name.includes("تخصصی") || name.includes("ویژه")) return "تخصصی";
    if (name.includes("دانشگاهی") || name.includes("علوم پزشکی")) return "دولتی - دانشگاهی";
    return "دولتی";
}

// تابع محاسبه فاصله
function calculateDistance(location1, location2) {
    const R = 6371; // شعاع زمین بر حسب کیلومتر
    const dLat = (location2.lat() - location1.lat) * Math.PI / 180;
    const dLng = (location2.lng() - location1.lng) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(location1.lat * Math.PI / 180) * Math.cos(location2.lat() * Math.PI / 180) * 
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// تابع پاکسازی نشانگرها
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

// تابع به‌روزرسانی مقدار فاصله
function updateDistanceValue() {
    const range = document.getElementById("distance-range");
    const value = document.getElementById("distance-value");
    value.textContent = range.value;
}

// تابع تبدیل مختصات به آدرس
function getAddressFromLatLng(latlng) {
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === "OK" && results[0]) {
            const address = results[0].formatted_address;
            document.getElementById("current-location").textContent = address;
        }
    });
}

// تابع فعال‌سازی جستجوی خودکار
function initAutocomplete() {
    autocomplete = new google.maps.places.Autocomplete(
        document.getElementById("search-input"),
        {
            types: ["establishment"],
            componentRestrictions: { country: "ir" },
            fields: ["name", "geometry"]
        }
    );
    
    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        
        if (place.geometry) {
            // جستجوی بیمارستان‌ها در اطراف مکان انتخاب شده
            userLocation = place.geometry.location;
            map.setCenter(userLocation);
            map.setZoom(14);
            searchHospitals();
        }
    });
}

// رویداد بارگذاری صفحه
window.addEventListener("load", () => {
    // مقداردهی اولیه فیلتر فاصله
    updateDistanceValue();
});