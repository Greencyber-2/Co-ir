// preloader.js
class AdvancedPreloader {
    constructor() {
        this.preloader = document.querySelector('.preloader');
        this.progressBar = document.querySelector('.progress-fill');
        this.progressText = document.querySelector('.progress-text');
        this.appContainer = document.querySelector('.app-container');
        this.loadedAssets = 0;
        this.totalAssets = 0;
        this.minDisplayTime = 2000; // حداقل زمان نمایش پیش‌لودر (2 ثانیه)
        this.startTime = Date.now();
        
        this.init();
    }
    
    init() {
        // مخفی کردن برنامه اصلی
        this.appContainer.style.display = 'none';
        
        // شناسایی منابع برای بارگذاری
        this.detectAssets();
        
        // شروع ردیابی پیشرفت
        this.trackLoadingProgress();
    }
    
    detectAssets() {
        // تصاویر
        const images = document.querySelectorAll('img');
        // فونت‌ها
        const fonts = Array.from(document.fonts);
        // فایل‌های خارجی
        const scripts = document.querySelectorAll('script[src]');
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        
        this.totalAssets = images.length + fonts.length + scripts.length + stylesheets.length + 1; // +1 برای خود صفحه
        
        // اگر هیچ منبعی پیدا نشد
        if (this.totalAssets === 1) {
            this.totalAssets = 5; // مقدار پیش‌فرض برای نمایش روان
        }
    }
    
    trackLoadingProgress() {
        // ردیابی بارگذاری تصاویر
        document.querySelectorAll('img').forEach(img => {
            if (img.complete) {
                this.assetLoaded();
            } else {
                img.addEventListener('load', () => this.assetLoaded());
                img.addEventListener('error', () => this.assetLoaded());
            }
        });
        
        // ردیابی بارگذاری فونت‌ها
        document.fonts.ready.then(() => {
            this.assetLoaded();
        });
        
        // ردیابی بارگذاری DOM
        document.addEventListener('DOMContentLoaded', () => {
            this.assetLoaded();
        });
        
        // ردیابی بارگذاری کامل صفحه
        window.addEventListener('load', () => {
            this.assetLoaded(true);
        });
    }
    
    assetLoaded(isFinal = false) {
        this.loadedAssets++;
        
        // محاسبه درصد پیشرفت
        let progress = Math.min(100, Math.round((this.loadedAssets / this.totalAssets)) * 100);
        
        // به‌روزرسانی نوار پیشرفت
        this.progressBar.style.width = `${progress}%`;
        this.progressText.textContent = `${progress}%`;
        
        // اگر بارگذاری کامل شد یا به 100% رسیدیم
        if (isFinal || progress >= 100) {
            this.finishLoading();
        }
    }
    
    finishLoading() {
        const elapsedTime = Date.now() - this.startTime;
        const remainingTime = Math.max(0, this.minDisplayTime - elapsedTime);
        
        setTimeout(() => {
            // انیمیشن محو شدن
            this.preloader.classList.add('fade-out');
            
            // نمایش برنامه اصلی پس از اتمام انیمیشن
            setTimeout(() => {
                this.preloader.style.display = 'none';
                this.appContainer.style.display = 'block';
                
                // انیمیشن ظاهر شدن برنامه
                this.appContainer.style.opacity = '0';
                this.appContainer.style.animation = 'appFadeIn 0.8s ease forwards';
                
                // اضافه کردن انیمیشن به style در صورت عدم وجود
                if (!document.querySelector('style#app-animation')) {
                    const style = document.createElement('style');
                    style.id = 'app-animation';
                    style.textContent = `
                        @keyframes appFadeIn {
                            from { opacity: 0; transform: translateY(20px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `;
                    document.head.appendChild(style);
                }
            }, 800);
        }, remainingTime);
    }
}

// راه‌اندازی پیش‌لودر زمانی که DOM آماده است
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedPreloader();
});