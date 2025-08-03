// Advanced Preloader System
document.addEventListener('DOMContentLoaded', function() {
    const preloader = document.querySelector('.preloader');
    const loadingProgress = document.querySelector('.loading-progress');
    const loadingPercentage = document.querySelector('.loading-percentage');
    const loadingTips = document.querySelector('.loading-tips');
    const preloaderLogo = document.querySelector('.preloader-logo img');
    
    // Tips to display during loading
    const tips = [
        "بروجرد به پاریس کوچولو معروف است...",
        "مسجد جامع بروجرد یکی از قدیمی‌ترین مساجد ایران است",
        "تالاب بیشه دالان از جاذبه‌های طبیعی بروجرد است",
        "بروجرد مرکز تولید محصولات کشاورزی در استان لرستان است",
        "امامزاده قاسم از زیارتگاه‌های مهم بروجرد است",
        "صنایع دستی بروجرد شامل ورشو و چاقوسازی است",
        "بروجرد دارای آب و هوای معتدل کوهستانی است",
        "غذاهای محلی بروجرد شامل آش ترخینه و کله جوش هستند"
    ];
    
    // Resources to load
    const resources = [
        'images/logo.png',
        'images/stories/city-hall.jpg',
        'images/stories/city-event.jpg',
        'images/stories/tourism.jpg',
        'images/stories/tourism-event.jpg',
        'images/stories/art.jpg',
        'images/stories/art-event.jpg',
        'images/stories/sport.jpg',
        'images/stories/sport-event.jpg',
        'images/tourism/mosque.jpg',
        'images/tourism/emamzade.jpg',
        'images/tourism/bazaar.jpg',
        'images/tourism/wetland.jpg',
        'images/tourism/historic-house.jpg',
        'images/tourism/waterfall.jpg',
        'images/tourism/bath.jpg',
        'images/service-icons/pharmacy.png',
        'images/service-icons/hospital.png',
        'images/service-icons/police.png',
        'images/service-icons/gas-station.png',
        'images/service-icons/supermarket.png',
        'images/service-icons/restaurant.png',
        'images/service-icons/atm.png',
        'images/service-icons/bus-station.png'
    ];
    
    let loadedResources = 0;
    let totalResources = resources.length;
    let currentTipIndex = 0;
    let lastProgress = 0;
    let smoothProgress = 0;
    
    // Preload logo first
    preloadImage('images/logo.png').then(() => {
        // Start loading animation
        animateLoading();
        
        // Preload all other resources
        preloadAllResources();
        
        // Change tips periodically
        const tipInterval = setInterval(changeTip, 3000);
        
        function changeTip() {
            currentTipIndex = (currentTipIndex + 1) % tips.length;
            loadingTips.style.opacity = 0;
            
            setTimeout(() => {
                loadingTips.textContent = tips[currentTipIndex];
                loadingTips.style.opacity = 1;
            }, 500);
        }
        
        // Smooth progress animation
        function animateLoading() {
            const targetProgress = Math.min(100, (loadedResources / totalResources) * 100);
            
            // Add some randomness to make it feel more natural
            const randomIncrement = Math.random() * 2;
            smoothProgress = Math.min(smoothProgress + randomIncrement, targetProgress);
            
            // Update UI
            loadingProgress.style.width = `${smoothProgress}%`;
            loadingPercentage.textContent = `${Math.floor(smoothProgress)}%`;
            
            // Pulse animation for logo when progress is slow
            if (smoothProgress < 30) {
                const scale = 0.95 + (Math.sin(Date.now() / 300) * 0.05);
                preloaderLogo.style.transform = `scale(${scale})`;
            } else if (smoothProgress < 70) {
                const scale = 0.97 + (Math.sin(Date.now() / 200) * 0.03);
                preloaderLogo.style.transform = `scale(${scale})`;
            } else {
                const scale = 0.98 + (Math.sin(Date.now() / 100) * 0.02);
                preloaderLogo.style.transform = `scale(${scale})`;
            }
            
            // Check if loading is complete
            if (smoothProgress >= 100) {
                clearInterval(tipInterval);
                completeLoading();
            } else {
                requestAnimationFrame(animateLoading);
            }
        }
        
        function completeLoading() {
            // Add final animation before hiding
            preloaderLogo.style.transform = 'scale(1.1)';
            loadingProgress.style.width = '100%';
            loadingPercentage.textContent = '100%';
            
            setTimeout(() => {
                preloader.classList.add('fade-out');
                
                setTimeout(() => {
                    preloader.style.display = 'none';
                    
                    // Initialize app after preloader is hidden
                    if (typeof init === 'function') {
                        init();
                    }
                }, 800);
            }, 500);
        }
    }).catch(error => {
        console.error('Error loading logo:', error);
        loadingTips.textContent = 'خطا در بارگذاری لوگو. لطفاً اتصال اینترنت را بررسی کنید.';
        // Continue anyway after delay
        setTimeout(() => {
            preloader.style.display = 'none';
            if (typeof init === 'function') init();
        }, 3000);
    });
    
    function preloadAllResources() {
        resources.forEach(resource => {
            preloadImage(resource)
                .then(() => {
                    loadedResources++;
                })
                .catch(error => {
                    console.error('Error loading resource:', resource, error);
                    loadedResources++; // Continue even if some resources fail
                });
        });
    }
    
    function preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = reject;
        });
    }
    
    // Fallback timeout in case something goes wrong
    setTimeout(() => {
        if (preloader.style.display !== 'none') {
            loadingTips.textContent = 'اتصال اینترنت ضعیف است. لطفاً منتظر بمانید...';
            setTimeout(() => {
                preloader.style.display = 'none';
                if (typeof init === 'function') init();
            }, 2000);
        }
    }, 10000);
});