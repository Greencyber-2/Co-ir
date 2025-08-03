/**
 * Real Content Loader - بررسی واقعی لود شدن محتوا
 */
class RealContentLoader {
  constructor() {
    this.preloader = document.querySelector('.preloader');
    this.minDisplayTime = 1500; // حداقل زمان نمایش preloader (میلی‌ثانیه)
    this.startTime = Date.now();
    this.loaded = false;
    this.resources = {
      images: [],
      fonts: []
    };
    
    this.init();
  }
  
  init() {
    this.setupLoadingBar();
    this.checkFonts();
    this.checkImages();
    this.setupFallback();
  }
  
  setupLoadingBar() {
    this.loadingProgress = document.querySelector('.loading-progress');
    this.loadingPercentage = document.querySelector('.loading-percentage');
    this.loadingTips = document.querySelector('.loading-tips');
    
    this.tips = [
      "بروجرد به پاریس کوچولو معروف است...",
      "مسجد جامع بروجرد یکی از قدیمی‌ترین مساجد ایران است",
      "تالاب بیشه دالان از جاذبه‌های طبیعی بروجرد است",
      "بروجرد مرکز تولید محصولات کشاورزی در استان لرستان است",
      "امامزاده قاسم از زیارتگاه‌های مهم بروجرد است"
    ];
    
    this.updateProgress(10); // Start progress
  }
  
  checkFonts() {
    // بررسی فونت Vazirmatn
    document.fonts.ready.then(() => {
      this.updateProgress(30);
      this.resources.fonts.push('Vazirmatn');
      this.checkCompletion();
    });
  }
  
  checkImages() {
    const images = document.querySelectorAll('img');
    let loadedCount = 0;
    const totalImages = images.length;
    
    if (totalImages === 0) {
      this.resources.images = [];
      this.updateProgress(40);
      this.checkCompletion();
      return;
    }
    
    images.forEach(img => {
      if (img.complete) {
        loadedCount++;
        this.resources.images.push(img.src);
        this.updateProgress(40 + (loadedCount / totalImages * 50));
        this.checkCompletion();
      } else {
        img.addEventListener('load', () => {
          loadedCount++;
          this.resources.images.push(img.src);
          this.updateProgress(40 + (loadedCount / totalImages * 50));
          this.checkCompletion();
        });
        
        img.addEventListener('error', () => {
          loadedCount++;
          this.updateProgress(40 + (loadedCount / totalImages * 50));
          this.checkCompletion();
        });
      }
    });
  }
  
  updateProgress(percent) {
    if (percent > 100) percent = 100;
    this.loadingProgress.style.width = `${percent}%`;
    this.loadingPercentage.textContent = `${Math.floor(percent)}%`;
    
    // تغییر نکته هر 20% پیشرفت
    if (percent % 20 < 5) {
      const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];
      this.loadingTips.textContent = randomTip;
      this.loadingTips.style.animation = 'none';
      void this.loadingTips.offsetWidth;
      this.loadingTips.style.animation = 'fadeIn 0.5s ease';
    }
  }
  
  checkCompletion() {
    // بررسی کامل شدن همه منابع
    const elapsed = Date.now() - this.startTime;
    const remainingTime = this.minDisplayTime - elapsed;
    
    if (remainingTime > 0) {
      setTimeout(() => {
        this.finishLoading();
      }, remainingTime);
    } else {
      this.finishLoading();
    }
  }
  
  finishLoading() {
    if (this.loaded) return;
    this.loaded = true;
    
    this.updateProgress(100);
    
    setTimeout(() => {
      this.preloader.classList.add('fade-out');
      setTimeout(() => {
        this.preloader.style.display = 'none';
        
        // فعال کردن اسکرول و تعاملات بعد از لود کامل
        document.body.style.overflow = 'auto';
        document.body.style.pointerEvents = 'auto';
      }, 800);
    }, 500);
  }
  
  setupFallback() {
    // Fallback برای مواقعی که لودینگ بیش از حد طول بکشد
    setTimeout(() => {
      if (!this.loaded) {
        this.finishLoading();
      }
    }, 10000); // حداکثر 10 ثانیه
  }
}

// اجرای Real Loader پس از لود DOM
document.addEventListener('DOMContentLoaded', () => {
  // غیرفعال کردن اسکرول و تعاملات در حین لودینگ
  document.body.style.overflow = 'hidden';
  document.body.style.pointerEvents = 'none';
  
  // شروع بررسی محتوا
  new RealContentLoader();
});