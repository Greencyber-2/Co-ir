class UltraModernPreloader {
    constructor() {
        this.preloader = document.querySelector('.preloader');
        this.progressFill = document.querySelector('.progress-fill');
        this.circleProgress = document.querySelector('.circle-progress');
        this.progressPercent = document.querySelector('.progress-percent');
        this.progressStatus = document.querySelector('.progress-status');
        this.currentMessage = document.querySelector('.current-message');
        this.tipMessage = document.querySelector('.tip-message');
        
        this.assets = {
            images: [],
            fonts: [],
            scripts: [],
            stylesheets: [],
            videos: []
        };
        
        this.loadedCount = 0;
        this.totalAssets = 0;
        this.minDisplayTime = 2500;
        this.startTime = performance.now();
        
        this.loadingMessages = [
            "در حال بارگذاری منابع...",
            "بهینه‌سازی عملکرد...",
            "آماده‌سازی رابط کاربری...",
            "تنظیمات نهایی...",
            "آماده نمایش..."
        ];
        
        this.tips = [
            "بروجرد به پاریس کوچولو معروف است",
            "مسجد جامع بروجرد یکی از قدیمی‌ترین مساجد ایران است",
            "تالاب بیشه دالان از جاذبه‌های طبیعی بروجرد است",
            "بروجرد مرکز تولید محصولات کشاورزی در استان لرستان است",
            "امامزاده قاسم از زیارتگاه‌های مهم بروجرد است"
        ];
        
        this.init();
    }
    
    init() {
        document.body.style.overflow = 'hidden';
        this.detectAllAssets();
        this.setupEventListeners();
        this.startMessageRotation();
        this.startTipRotation();
        this.startInitialProgress();
    }
    
    detectAllAssets() {
        this.assets.images = Array.from(document.querySelectorAll('img'));
        this.assets.fonts = Array.from(document.fonts);
        this.assets.scripts = Array.from(document.querySelectorAll('script[src]'));
        this.assets.stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        this.assets.videos = Array.from(document.querySelectorAll('video source'));
        
        this.totalAssets = 
            this.assets.images.length +
            this.assets.fonts.length +
            this.assets.scripts.length +
            this.assets.stylesheets.length +
            this.assets.videos.length +
            3; // +3 برای DOMContentLoaded, window.load و حاشیه امنیت
        
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
        const progress = Math.min(100, Math.round((this.loadedCount / this.totalAssets) * 100));
        
        this.updateProgress(progress);
        
        if (message) {
            this.showStatusMessage(message);
        }
        
        if (isFinal || progress >= 100) {
            this.finishLoading();
        }
    }
    
    updateProgress(percent) {
        // نوار پیشرفت خطی
        this.progressFill.style.width = `${percent}%`;
        
        // نوار پیشرفت دایره‌ای
        const circumference = 565; // 2 * π * r (r=90)
        const offset = circumference - (percent / 100) * circumference;
        this.circleProgress.style.strokeDashoffset = offset;
        
        // درصد عددی
        this.progressPercent.textContent = `${percent}%`;
        
        // تغییر رنگ بر اساس پیشرفت
        if (percent < 30) {
            this.progressFill.style.background = 'linear-gradient(90deg, var(--warning), var(--accent))';
            this.circleProgress.style.stroke = 'var(--warning)';
        } else if (percent < 70) {
            this.progressFill.style.background = 'linear-gradient(90deg, var(--accent), var(--primary))';
            this.circleProgress.style.stroke = 'var(--accent)';
        } else {
            this.progressFill.style.background = 'linear-gradient(90deg, var(--primary), var(--success))';
            this.circleProgress.style.stroke = 'var(--success)';
        }
    }
    
    showStatusMessage(message) {
        this.progressStatus.textContent = message;
        this.progressStatus.style.opacity = '1';
        
        setTimeout(() => {
            this.progressStatus.style.opacity = '0.7';
        }, 2000);
    }
    
    startMessageRotation() {
        let counter = 0;
        setInterval(() => {
            this.currentMessage.textContent = this.loadingMessages[counter % this.loadingMessages.length];
            counter++;
        }, 3000);
    }
    
    startTipRotation() {
        let counter = 0;
        setInterval(() => {
            this.tipMessage.textContent = this.tips[counter % this.tips.length];
            counter++;
        }, 5000);
    }
    
    startInitialProgress() {
        // پیشرفت اولیه برای بهبود UX
        let fakeProgress = 0;
        const interval = setInterval(() => {
            fakeProgress += Math.random() * 5;
            if (fakeProgress >= 20) {
                clearInterval(interval);
                return;
            }
            
            const currentProgress = parseInt(this.progressPercent.textContent);
            if (currentProgress < 20) {
                this.updateProgress(fakeProgress);
            }
        }, 200);
    }
    
    finishLoading() {
        const elapsed = performance.now() - this.startTime;
        const remaining = Math.max(0, this.minDisplayTime - elapsed);
        
        setTimeout(() => {
            this.preloader.classList.add('fade-out');
            
            setTimeout(() => {
                this.preloader.style.display = 'none';
                document.body.style.overflow = '';
                this.showAppContent();
            }, 800);
        }, remaining);
    }
    
    showAppContent() {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        
        // انیمیشن ظاهر شدن محتوا
        document.querySelector('.app-container').style.animation = 'appFadeIn 0.8s ease forwards';
        
        // ایجاد keyframe دینامیک
        if (!document.querySelector('#app-fade-animation')) {
            const style = document.createElement('style');
            style.id = 'app-fade-animation';
            style.textContent = `
                @keyframes appFadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// راه‌اندازی پیش‌لودر
document.addEventListener('DOMContentLoaded', () => {
    new UltraModernPreloader();
});