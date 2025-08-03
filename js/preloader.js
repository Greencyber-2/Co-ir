// Improved Preloader with progress simulation and tips
document.addEventListener('DOMContentLoaded', function() {
    const preloader = document.querySelector('.preloader');
    const loadingProgress = document.querySelector('.loading-progress');
    const loadingPercentage = document.querySelector('.loading-percentage');
    const loadingTips = document.querySelector('.loading-tips');
    
    // Tips to display during loading
    const tips = [
        "بروجرد به پاریس کوچولو معروف است...",
        "مسجد جامع بروجرد یکی از قدیمی‌ترین مساجد ایران است",
        "تالاب بیشه دالان از جاذبه‌های طبیعی بروجرد است",
        "بروجرد مرکز تولید محصولات کشاورزی در استان لرستان است",
        "امامزاده قاسم از زیارتگاه‌های مهم بروجرد است"
    ];
    
    // Simulate loading progress
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 100) progress = 100;
        
        loadingProgress.style.width = `${progress}%`;
        loadingPercentage.textContent = `${Math.floor(progress)}%`;
        
        // Change tip every 20% progress
        if (progress % 20 < 5) {
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            loadingTips.textContent = randomTip;
            loadingTips.style.animation = 'none';
            void loadingTips.offsetWidth; // Trigger reflow
            loadingTips.style.animation = 'fadeIn 0.5s ease';
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                preloader.classList.add('fade-out');
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 800);
            }, 500);
        }
    }, 200);
    
    // Ensure preloader hides if loading takes too long (fallback)
    setTimeout(() => {
        if (preloader.style.display !== 'none') {
            preloader.classList.add('fade-out');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 800);
        }
    }, 5000);
});