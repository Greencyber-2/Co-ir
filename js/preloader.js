// preloader.js
document.addEventListener('DOMContentLoaded', function() {
    const preloader = document.querySelector('.preloader');
    const appContainer = document.querySelector('.app-container');
    
    // ابتدا کل برنامه را مخفی می‌کنیم
    appContainer.style.display = 'none';
    
    // زمانی که همه منابع (تصاویر، فونت‌ها و ...) بارگذاری شدند
    window.addEventListener('load', function() {
        // اطمینان حاصل کنید که حداقل 1.5 ثانیه نمایش داده شود
        setTimeout(() => {
            preloader.classList.add('fade-out');
            
            // پس از اتمام انیمیشن fade-out
            setTimeout(() => {
                preloader.style.display = 'none';
                appContainer.style.display = 'block';
                
                // اعمال انیمیشن ظاهر شدن محتوا
                appContainer.style.opacity = '0';
                appContainer.style.animation = 'fadeIn 0.5s ease forwards';
            }, 500);
        }, 1500);
    });
});