// DOM Elements
const navButtons = document.querySelectorAll('.nav-btn');
const contentSections = document.querySelectorAll('.content-section');
const storiesContainer = document.querySelector('.stories');
const popularServicesGrid = document.querySelector('.popular-services .services-grid');
const servicesCategories = document.querySelector('.services-categories');
const tourismGrid = document.querySelector('.tourism-grid');
const previewGrid = document.querySelector('.preview-grid');
const storyModal = document.querySelector('.story-modal');
const closeStoryBtn = document.querySelector('.close-story');
const likeBtn = document.querySelector('.like-btn');
const viewAllServicesBtn = document.getElementById('view-all-services');
const viewAllTourismBtn = document.getElementById('view-all-tourism');
const servicesSearchInput = document.getElementById('services-search-input');
const notificationBell = document.querySelector('.notification-bell');
const notificationPanel = document.querySelector('.notification-panel');
const closeNotificationsBtn = document.querySelector('.close-notifications');
const filterButtons = document.querySelectorAll('.filter-btn');
const tourismModal = document.querySelector('.tourism-modal');

// Sample Data
const storiesData = [
    {
        id: 1,
        username: "شهرداری بروجرد",
        avatar: "images/stories/city-hall.jpg",
        image: "images/stories/city-event.jpg",
        caption: "برگزاری مراسم روز بروجرد در پارک شیرین‌پور",
        time: "2 ساعت پیش",
        likes: 45,
        liked: false,
        viewed: false
    },
    {
        id: 2,
        username: "گردشگری بروجرد",
        avatar: "images/stories/tourism.jpg",
        image: "images/stories/tourism-event.jpg",
        caption: "بازسازی مسجد جامع بروجرد به پایان رسید",
        time: "5 ساعت پیش",
        likes: 32,
        liked: false,
        viewed: false
    },
    {
        id: 3,
        username: "فرهنگ و هنر",
        avatar: "images/stories/art.jpg",
        image: "images/stories/art-event.jpg",
        caption: "نمایشگاه صنایع دستی بروجرد در فرهنگسرای شهر",
        time: "1 روز پیش",
        likes: 78,
        liked: false,
        viewed: false
    },
    {
        id: 4,
        username: "ورزشی",
        avatar: "images/stories/sport.jpg",
        image: "images/stories/sport-event.jpg",
        caption: "مسابقات فوتبال محلات بروجرد آغاز شد",
        time: "1 روز پیش",
        likes: 56,
        liked: false,
        viewed: false
    },
    // {
    //     id: 5,
    //     username: "ترافیک",
    //     avatar: "images/stories/traffic.jpg",
    //     image: "images/stories/traffic-event.jpg",
    //     caption: "تعطیلی خیابان امام به مدت 2 ساعت برای مراسم",
    //     time: "3 ساعت پیش",
    //     likes: 23,
    //     liked: false,
    //     viewed: false
    // }
];

const popularServices = [
    { id: "pharmacy", name: "داروخانه", icon: "pharmacy.png" },
    { id: "hospital", name: "بیمارستان", icon: "hospital.png" },
    { id: "police", name: "کلانتری", icon: "police.png" },
    { id: "gas-station", name: "پمپ بنزین", icon: "gas-station.png" },
    { id: "supermarket", name: "سوپرمارکت", icon: "supermarket.png" },
    { id: "restaurant", name: "رستوران", icon: "restaurant.png" },
    { id: "atm", name: "خودپرداز", icon: "atm.png" },
    { id: "bus-station", name: "ایستگاه اتوبوس", icon: "bus-station.png" }
];

const servicesData = {
    health: [
        { id: "pharmacy", name: "داروخانه", icon: "pharmacy.png" },
        { id: "hospital", name: "بیمارستان", icon: "hospital.png" },
        { id: "clinic", name: "درمانگاه", icon: "clinic.png" },
        { id: "health-center", name: "مرکز بهداشت", icon: "health-center.png" },
        { id: "dentist", name: "دندانپزشک", icon: "dentist.png" }
    ],
    food: [
        { id: "restaurant", name: "رستوران", icon: "restaurant.png" },
        { id: "fast-food", name: "فست فود", icon: "fast-food.png" },
        { id: "juice-icecream", name: "آبمیوه و بستنی", icon: "juice-icecream.png" },
        { id: "bakery", name: "نانوایی", icon: "bakery.png" },
        { id: "confectionery", name: "شیرینی‌فروشی", icon: "confectionery.png" },
        { id: "fruit-shop", name: "میوه‌فروشی", icon: "fruit-shop.png" },
        { id: "butcher", name: "قصابی", icon: "butcher.png" }
    ],
    transport: [
        { id: "gas-station", name: "پمپ بنزین", icon: "gas-station.png" },
        { id: "gas-pump", name: "پمپ گاز", icon: "gas-pump.png" },
        { id: "bus-station", name: "ایستگاه اتوبوس", icon: "bus-station.png" },
        { id: "terminal", name: "ترمینال مسافربری", icon: "terminal.png" },
        { id: "taxi", name: "تاکسی", icon: "taxi.png" },
        { id: "car-repair", name: "تعمیرگاه", icon: "car-repair.png" }
    ],
    other: [
        { id: "supermarket", name: "سوپرمارکت", icon: "supermarket.png" },
        { id: "internet-cafe", name: "کافی‌نت", icon: "internet-cafe.png" },
        { id: "market", name: "بازار", icon: "market.png" },
        { id: "mosque", name: "مسجد", icon: "mosque.png" },
        { id: "car-wash", name: "کارواش", icon: "car-wash.png" },
        { id: "atm", name: "خودپرداز", icon: "atm.png" },
        { id: "police", name: "کلانتری", icon: "police.png" },
        { id: "police-emergency", name: "پلیس +10", icon: "police-emergency.png" },
        { id: "park", name: "پارک", icon: "park.png" },
        { id: "parking", name: "پارکینگ", icon: "parking.png" },
        { id: "bank", name: "بانک", icon: "bank.png" },
        { id: "cafe", name: "کافه", icon: "cafe.png" },
        { id: "guest-house", name: "مهمانپذیر", icon: "guest-house.png" },
        { id: "cinema", name: "سینما", icon: "cinema.png" },
        { id: "flower-shop", name: "گل‌فروشی", icon: "flower-shop.png" },
        { id: "toilet", name: "سرویس بهداشتی", icon: "toilet.png" }
    ]
};

const tourismData = [
    {
        id: 1,
        title: "مسجد جامع بروجرد",
        image: "images/tourism/mosque.jpg",
        description: "مسجد جامع بروجرد یکی از قدیمی‌ترین مساجد ایران است که قدمت آن به قرن دوم هجری می‌رسد. این مسجد با معماری زیبا و تزئینات چشم‌نواز، نمونه‌ای از هنر اسلامی است.",
        type: "historical"
    },
    {
        id: 2,
        title: "امامزاده قاسم",
        image: "images/tourism/emamzade.jpg",
        description: "امامزاده قاسم از نوادگان امام موسی کاظم است و یکی از زیارتگاه‌های مهم بروجرد محسوب می‌شود. این مکان با گنبد فیروزه‌ای و فضای روح‌نواز، پذیرای زائران بسیاری است.",
        type: "religious"
    },
    // {
    //     id: 3,
    //     title: "پارک شیرین‌پور",
    //     image: "images/tourism/park.jpg",
    //     description: "بزرگترین پارک شهر بروجرد با فضای سبز بسیار زیبا و امکانات تفریحی متنوع. این پارک محل مناسبی برای تفریح خانواده‌ها و دوستداران طبیعت است.",
    //     type: "natural"
    // },
    {
        id: 4,
        title: "بازار قدیم بروجرد",
        image: "images/tourism/bazaar.jpg",
        description: "بازار سنتی بروجرد با معماری زیبا و مغازه‌های فروش صنایع دستی و سوغاتی‌های محلی. این بازار مرکز تجارت و فرهنگ شهر محسوب می‌شود.",
        type: "historical"
    },
    {
        id: 5,
        title: "تالاب بیشه دالان",
        image: "images/tourism/wetland.jpg",
        description: "تالابی زیبا در نزدیکی بروجرد که محل زندگی پرندگان مهاجر و زیستگاه طبیعی ارزشمندی است. این تالاب در فصل بهار و پاییز میزبان پرندگان نادر است.",
        type: "natural"
    },
    {
        id: 6,
        title: "خانه افتخارالاسلام",
        image: "images/tourism/historic-house.jpg",
        description: "خانه‌ای تاریخی مربوط به دوره قاجار با معماری زیبا و تزئینات چشم‌نواز. این خانه نمونه‌ای از معماری سنتی ایرانی است.",
        type: "historical"
    },
    {
        id: 7,
        title: "آبشار دره خونی",
        image: "images/tourism/waterfall.jpg",
        description: "آبشار زیبای دره خونی در حومه بروجرد با طبیعتی بکر و دیدنی. این آبشار در فصل بهار پرآب و بسیار تماشایی است.",
        type: "natural"
    },
    {
        id: 8,
        title: "حمام حاج آقا تراب",
        image: "images/tourism/bath.jpg",
        description: "حمامی تاریخی مربوط به دوره قاجار که امروزه به موزه مردم شناسی تبدیل شده است. این حمام نمونه‌ای از معماری سنتی ایرانی است.",
        type: "historical"
    }
];

// Current Story Viewer State
let currentStoryIndex = 0;
let storyInterval;
let progressIntervals = [];

// Initialize the app
function init() {
    loadStories();
    loadPopularServices();
    loadServices();
    loadTourism();
    loadTourismPreview();
    setupEventListeners();
}

// Load Stories
function loadStories() {
    storiesContainer.innerHTML = '';
    
    storiesData.forEach((story, index) => {
        const storyElement = document.createElement('div');
        storyElement.className = `story ${story.viewed ? 'viewed' : ''}`;
        storyElement.dataset.id = story.id;
        storyElement.dataset.index = index;
        
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'story-avatar';
        
        const img = document.createElement('img');
        img.src = story.avatar;
        img.alt = story.username;
        
        const username = document.createElement('div');
        username.className = 'story-username';
        username.textContent = story.username;
        
        avatarContainer.appendChild(img);
        storyElement.appendChild(avatarContainer);
        storyElement.appendChild(username);
        storyElement.addEventListener('click', () => openStory(index));
        
        storiesContainer.appendChild(storyElement);
    });
}

// Load Popular Services
function loadPopularServices() {
    popularServicesGrid.innerHTML = '';
    
    popularServices.forEach(service => {
        const serviceElement = document.createElement('div');
        serviceElement.className = 'service-card';
        serviceElement.dataset.service = service.id;
        
        const img = document.createElement('img');
        img.src = `images/service-icons/${service.icon}`;
        img.alt = service.name;
        
        const span = document.createElement('span');
        span.textContent = service.name;
        
        serviceElement.appendChild(img);
        serviceElement.appendChild(span);
        serviceElement.addEventListener('click', () => openServiceModal(service));
        
        popularServicesGrid.appendChild(serviceElement);
    });
}

// Load Services
function loadServices() {
    servicesCategories.innerHTML = '';
    
    for (const category in servicesData) {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category';
        categoryElement.dataset.category = category;
        
        const title = document.createElement('h3');
        title.textContent = getCategoryName(category);
        
        const grid = document.createElement('div');
        grid.className = 'services-grid';
        
        renderServices(servicesData[category], grid);
        
        categoryElement.appendChild(title);
        categoryElement.appendChild(grid);
        servicesCategories.appendChild(categoryElement);
    }
}

function getCategoryName(category) {
    const names = {
        health: 'سلامت و درمان',
        food: 'غذا و خوراکی',
        transport: 'حمل و نقل',
        other: 'سایر خدمات'
    };
    return names[category] || category;
}

function renderServices(services, container) {
    container.innerHTML = '';
    
    services.forEach(service => {
        const serviceElement = document.createElement('div');
        serviceElement.className = 'service-card';
        serviceElement.dataset.service = service.id;
        
        const img = document.createElement('img');
        img.src = `images/service-icons/${service.icon}`;
        img.alt = service.name;
        
        const span = document.createElement('span');
        span.textContent = service.name;
        
        serviceElement.appendChild(img);
        serviceElement.appendChild(span);
        serviceElement.addEventListener('click', () => openServiceModal(service));
        
        container.appendChild(serviceElement);
    });
}

// Load Tourism
function loadTourism() {
    tourismGrid.innerHTML = '';
    
    tourismData.forEach(item => {
        const card = createTourismCard(item);
        tourismGrid.appendChild(card);
    });
}

// Load Tourism Preview for Home
function loadTourismPreview() {
    previewGrid.innerHTML = '';
    
    // Get 4 random tourism items
    const shuffled = [...tourismData].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);
    
    selected.forEach(item => {
        const preview = document.createElement('div');
        preview.className = 'preview-card';
        
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.title;
        
        const title = document.createElement('div');
        title.className = 'preview-title';
        title.textContent = item.title;
        
        preview.appendChild(img);
        preview.appendChild(title);
        preview.addEventListener('click', () => {
            switchSection('tourism');
        });
        
        previewGrid.appendChild(preview);
    });
}

function createTourismCard(item) {
    const card = document.createElement('div');
    card.className = 'tourism-card';
    card.dataset.id = item.id;
    
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title;
    
    const info = document.createElement('div');
    info.className = 'tourism-info';
    
    const h3 = document.createElement('h3');
    h3.textContent = item.title;
    
    const p = document.createElement('p');
    p.textContent = item.description.length > 100 ? 
        item.description.substring(0, 100) + '...' : 
        item.description;
    
    const type = document.createElement('span');
    type.className = 'tourism-type';
    type.textContent = getTypeName(item.type);
    
    info.appendChild(h3);
    info.appendChild(p);
    info.appendChild(type);
    
    card.appendChild(img);
    card.appendChild(info);
    
    card.addEventListener('click', () => openTourismModal(item));
    
    return card;
}

function getTypeName(type) {
    const names = {
        historical: 'تاریخی',
        natural: 'طبیعی',
        religious: 'مذهبی'
    };
    return names[type] || type;
}

// Open Tourism Modal
function openTourismModal(item) {
    const modal = document.querySelector('.tourism-modal');
    const image = modal.querySelector('.tourism-image');
    const title = modal.querySelector('.tourism-title');
    const description = modal.querySelector('.tourism-description');
    const type = modal.querySelector('.tourism-type');
    
    image.src = item.image;
    image.alt = item.title;
    title.textContent = item.title;
    description.textContent = item.description;
    type.textContent = getTypeName(item.type);
    
    modal.style.display = 'flex';
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Close button
    document.querySelector('.tourism-modal .close-modal').addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation buttons
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.dataset.section;
            switchSection(sectionId);
            setActiveNavButton(button);
        });
    });
    
    // Theme toggle
    
    // View all services button
    viewAllServicesBtn.addEventListener('click', () => {
        switchSection('services');
        setActiveNavButton(document.querySelector('.nav-btn[data-section="services"]'));
    });
    
    // View all tourism button
    viewAllTourismBtn.addEventListener('click', () => {
        switchSection('tourism');
        setActiveNavButton(document.querySelector('.nav-btn[data-section="tourism"]'));
    });
    
    // Story modal close button
    closeStoryBtn.addEventListener('click', closeStory);
    
    // Like button
    if (likeBtn) {
        likeBtn.addEventListener('click', toggleLike);
    }
    
    // Services search
    servicesSearchInput.addEventListener('input', filterServices);
    
    // Notification bell
    notificationBell.addEventListener('click', toggleNotifications);
    closeNotificationsBtn.addEventListener('click', toggleNotifications);
    
    // Tourism filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            filterTourism(button.dataset.filter);
        });
    });
    
    // Keyboard events for story navigation
    document.addEventListener('keydown', (e) => {
        if (storyModal.style.display === 'flex') {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                nextStory();
            } else if (e.key === 'ArrowLeft') {
                prevStory();
            } else if (e.key === 'Escape') {
                closeStory();
            }
        }
    });
    
    // Touch events for story navigation
    document.addEventListener('touchstart', handleTouchStart, false);        
    document.addEventListener('touchend', handleTouchEnd, false);
    
    let touchStartX = 0;
    let touchEndX = 0;
    
    function handleTouchStart(e) {
        if (storyModal.style.display === 'flex') {
            touchStartX = e.changedTouches[0].screenX;
        }
    }
    
    function handleTouchEnd(e) {
        if (storyModal.style.display === 'flex') {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }
    }
    
    function handleSwipe() {
        if (touchEndX < touchStartX - 50) {
            nextStory();
        } else if (touchEndX > touchStartX + 50) {
            prevStory();
        }
    }
}

// Switch between sections
function switchSection(sectionId) {
    // Show the selected section
    contentSections.forEach(section => {
        section.classList.toggle('active', section.id === sectionId);
    });
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Set active nav button
function setActiveNavButton(activeButton) {
    navButtons.forEach(button => {
        button.classList.toggle('active', button === activeButton);
    });
}

// Open Story Viewer
function openStory(index) {
    currentStoryIndex = index;
    const story = storiesData[index];
    
    // Update story viewer UI
    document.querySelector('.story-user .user-avatar').src = story.avatar;
    document.querySelector('.story-user .username').textContent = story.username;
    document.querySelector('.story-user .time').textContent = story.time;
    document.querySelector('.story-image').src = story.image;
    document.querySelector('.story-caption').textContent = story.caption;
    document.querySelector('.like-count').textContent = story.likes;
    
    // Update like button state
    const likeIcon = document.querySelector('.like-btn i');
    likeIcon.className = story.liked ? 'fas fa-heart' : 'far fa-heart';
    likeIcon.style.color = story.liked ? 'var(--danger-color)' : 'var(--white)';
    
    // Create progress bars
    const progressBars = document.querySelector('.progress-bars');
    progressBars.innerHTML = '';
    
    storiesData.forEach((_, i) => {
        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.width = i < index ? '100%' : '0%';
        
        bar.appendChild(fill);
        progressBars.appendChild(bar);
    });
    
    // Show the modal
    storyModal.style.display = 'flex';
    
    // Start the story progress
    startStoryProgress();
    
    // Mark as viewed
    if (!story.viewed) {
        story.viewed = true;
        document.querySelector(`.story[data-id="${story.id}"]`).classList.add('viewed');
    }
}

// Start Story Progress
function startStoryProgress() {
    // Clear any existing intervals
    progressIntervals.forEach(interval => clearInterval(interval));
    progressIntervals = [];
    
    const progressBars = document.querySelectorAll('.progress-bar');
    const currentBar = progressBars[currentStoryIndex];
    const fill = currentBar.querySelector('.progress-fill');
    
    let width = 0;
    const duration = 5000; // 5 seconds per story
    
    // Start the progress bar
    const interval = setInterval(() => {
        width += 1;
        fill.style.width = `${width}%`;
        
        if (width >= 100) {
            clearInterval(interval);
            nextStory();
        }
    }, duration / 100);
    
    progressIntervals.push(interval);
}

// Next Story
function nextStory() {
    if (currentStoryIndex < storiesData.length - 1) {
        currentStoryIndex++;
        openStory(currentStoryIndex);
    } else {
        closeStory();
    }
}

// Previous Story
function prevStory() {
    if (currentStoryIndex > 0) {
        currentStoryIndex--;
        openStory(currentStoryIndex);
    }
}

// Close Story Viewer
function closeStory() {
    storyModal.style.display = 'none';
    progressIntervals.forEach(interval => clearInterval(interval));
    progressIntervals = [];
}

// Toggle Like
function toggleLike() {
    const story = storiesData[currentStoryIndex];
    story.liked = !story.liked;
    story.likes += story.liked ? 1 : -1;
    
    document.querySelector('.like-count').textContent = story.likes;
    const likeIcon = document.querySelector('.like-btn i');
    likeIcon.className = story.liked ? 'fas fa-heart' : 'far fa-heart';
    likeIcon.style.color = story.liked ? 'var(--danger-color)' : 'var(--white)';
}

// Open Service Modal
function openServiceModal(service) {
    const modal = document.querySelector('.service-modal');
    const icon = modal.querySelector('.service-icon');
    const title = modal.querySelector('.service-title');
    
    icon.src = `images/service-icons/${service.icon}`;
    icon.alt = service.name;
    title.textContent = service.name;
    
    modal.style.display = 'flex';
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Close button
    document.querySelector('.service-modal .close-modal').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // OK button
    document.querySelector('.btn-ok').addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

// Filter Services
function filterServices() {
    const searchTerm = servicesSearchInput.value.toLowerCase();
    
    for (const category in servicesData) {
        const filteredServices = servicesData[category].filter(service => 
            service.name.toLowerCase().includes(searchTerm)
        );
        
        const categoryElement = document.querySelector(`.category[data-category="${category}"]`);
        const grid = categoryElement.querySelector('.services-grid');
        
        renderServices(filteredServices, grid);
    }
}

// Filter Tourism
function filterTourism(filter) {
    const filteredItems = filter === 'all' ? 
        tourismData : 
        tourismData.filter(item => item.type === filter);
    
    tourismGrid.innerHTML = '';
    
    filteredItems.forEach(item => {
        const card = createTourismCard(item);
        tourismGrid.appendChild(card);
    });
}

// Toggle Notifications
function toggleNotifications() {
    notificationPanel.classList.toggle('show');
}

// Check for saved theme preference
function checkThemePreference() {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkThemePreference();
    init();
});
// در انتهای فایل app.js
document.addEventListener('DOMContentLoaded', () => {
    checkThemePreference();
    
    // یک Promise برای بارگذاری همه داده‌ها ایجاد می‌کنیم
    const loadAllData = new Promise((resolve) => {
        init();
        resolve();
    });
    
    // زمانی که همه داده‌ها بارگذاری شدند و صفحه کاملا لود شد
    Promise.all([loadAllData, new Promise(resolve => window.addEventListener('load', resolve))])
        .then(() => {
            // اینجا پیش‌لودر در فایل preloader.js مدیریت می‌شود
        });
});