class UltraPreloader {
    constructor() {
        this.preloader = document.querySelector('.preloader');
        this.progressFill = document.querySelector('.progress-fill');
        this.progressPercent = document.querySelector('.progress-percent');
        this.progressStatus = document.querySelector('.progress-status');
        this.currentMessage = document.querySelector('.current-message');
        this.appContainer = document.querySelector('.app-container');
        
        this.assets = {
            images: [],
            fonts: [],
            scripts: [],
            stylesheets: [],
            videos: [],
            iframes: []
        };
        
        this.loadedCount = 0;
        this.totalAssets = 0;
        this.minDisplayTime = 2500; // 2.5 ثانیه حداقل نمایش
        this.startTime = performance.now();
        this.messages = [
            "در حال بارگذاری منابع...",
            "بهینه‌سازی عملکرد...",
            "آماده‌سازی رابط کاربری...",
            "تنظیمات نهایی...",
            "تقریبا آماده است!"
        ];
        
        this.init();
    }
    
    init() {
        this.appContainer.style.display = 'none';
        this.detectAllAssets();
        this.setupEventListeners();
        this.updateLoadingMessage();
        this.startProgressAnimation();
    }
    
    detectAllAssets() {
        // تشخیص تمام منابع
        this.assets.images = Array.from(document.querySelectorAll('img')).filter(img => !img.hasAttribute('data-skip-preload'));
        this.assets.fonts = Array.from(document.fonts);
        this.assets.scripts = Array.from(document.querySelectorAll('script[src]'));
        this.assets.stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        this.assets.videos = Array.from(document.querySelectorAll('video source'));
        this.assets.iframes = Array.from(document.querySelectorAll('iframe'));
        
        // محاسبه کل منابع
        this.totalAssets = 
            this.assets.images.length +
            this.assets.fonts.length +
            this.assets.scripts.length +
            this.assets.stylesheets.length +
            this.assets.videos.length +
            this.assets.iframes.length +
            3; // +3 برای DOMContentLoaded, window.load, و یک حاشیه امنیت
        
        if (this.totalAssets < 10) this.totalAssets = 10;
    }
    
    setupEventListeners() {
        // ردیابی تصاویر
        this.assets.images.forEach(img => {
            if (img.complete) this.assetLoaded();
            else {
                img.addEventListener('load', () => this.assetLoaded());
                img.addEventListener('error', () => this.assetLoaded());
            }
        });
        
        // ردیابی فونت‌ها
        document.fonts.ready.then(() => {
            this.assetLoaded('فونت‌ها بارگذاری شدند');
        });
        
        // ردیابی DOM
        document.addEventListener('DOMContentLoaded', () => {
            this.assetLoaded('DOM آماده است');
        });
        
        // ردیابی بارگذاری کامل
        window.addEventListener('load', () => {
            this.assetLoaded('بارگذاری کامل شد', true);
        });
        
        // ردیابی اسکریپت‌ها و استایل‌شیت‌ها
        this.assets.scripts.forEach(script => {
            script.addEventListener('load', () => this.assetLoaded());
            script.addEventListener('error', () => this.assetLoaded());
        });
        
        this.assets.stylesheets.forEach(link => {
            link.addEventListener('load', () => this.assetLoaded());
            link.addEventListener('error', () => this.assetLoaded());
        });
    }
    
    assetLoaded(message = '', isFinal = false) {
        this.loadedCount++;
        const progress = Math.min(100, Math.round((this.loadedCount / this.totalAssets)) * 100);
        
        // به‌روزرسانی UI
        this.updateProgress(progress);
        
        if (message) {
            this.showStatusMessage(message);
        }
        
        if (isFinal || progress >= 100) {
            this.finishLoading();
        }
    }
    
    updateProgress(percent) {
        this.progressFill.style.width = `${percent}%`;
        this.progressFill.setAttribute('data-progress', percent);
        this.progressPercent.textContent = `${percent}%`;
        
        // تغییر رنگ بر اساس پیشرفت
        if (percent < 30) {
            this.progressFill.style.background = 'linear-gradient(90deg, #ff5f6d, #ffc371)';
        } else if (percent < 70) {
            this.progressFill.style.background = 'linear-gradient(90deg, #2193b0, #6dd5ed)';
        } else {
            this.progressFill.style.background = 'linear-gradient(90deg, #11998e, #38ef7d)';
        }
    }
    
    showStatusMessage(message) {
        this.progressStatus.textContent = message;
        this.progressStatus.style.opacity = '1';
        
        setTimeout(() => {
            this.progressStatus.style.opacity = '0.7';
        }, 2000);
    }
    
    updateLoadingMessage() {
        let counter = 0;
        setInterval(() => {
            this.currentMessage.textContent = this.messages[counter % this.messages.length];
            counter++;
        }, 3000);
    }
    
    startProgressAnimation() {
        // پیشرفت اولیه برای منابعی که سریع بارگذاری می‌شوند
        let fakeProgress = 0;
        const fakeInterval = setInterval(() => {
            if (fakeProgress < 20) {
                fakeProgress += 1;
                const currentProgress = parseInt(this.progressFill.getAttribute('data-progress'));
                if (currentProgress < 20) {
                    this.updateProgress(fakeProgress);
                }
            } else {
                clearInterval(fakeInterval);
            }
        }, 100);
    }
    
    finishLoading() {
        const elapsed = performance.now() - this.startTime;
        const remaining = Math.max(0, this.minDisplayTime - elapsed);
        
        setTimeout(() => {
            this.preloader.classList.add('fade-out');
            
            setTimeout(() => {
                this.preloader.style.display = 'none';
                this.appContainer.style.display = 'block';
                this.animateAppEntry();
            }, 1000);
        }, remaining);
    }
    
    animateAppEntry() {
        this.appContainer.style.opacity = '0';
        this.appContainer.style.transform = 'translateY(20px)';
        this.appContainer.style.animation = 'appEntry 1s ease forwards';
        
        // ایجاد keyframe دینامیک
        const style = document.createElement('style');
        style.id = 'app-entry-animation';
        style.textContent = `
            @keyframes appEntry {
                0% { opacity: 0; transform: translateY(20px); }
                100% { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
}

// راه‌اندازی زمانی که DOM آماده است
document.addEventListener('DOMContentLoaded', () => {
    new UltraPreloader();
});