// theme.js
function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.contains('dark-mode');
    
    // حذف کلاس‌های قدیمی و اضافه کردن کلاس جدید
    body.classList.remove(isDark ? 'dark-mode' : 'light-mode');
    body.classList.add(isDark ? 'light-mode' : 'dark-mode');
    
    // ذخیره وضعیت تم در localStorage
    localStorage.setItem('darkMode', !isDark);
    
    // به‌روزرسانی آیکون
    updateThemeIcon(!isDark);
}

function updateThemeIcon(isDark) {
    const lightIcon = document.querySelector('.light-icon');
    const darkIcon = document.querySelector('.dark-icon');
    
    if (isDark) {
        lightIcon.style.opacity = '0';
        darkIcon.style.opacity = '1';
    } else {
        lightIcon.style.opacity = '1';
        darkIcon.style.opacity = '0';
    }
}

function initTheme() {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const body = document.body;
    
    // تنظیم کلاس بر اساس مقدار ذخیره‌شده
    body.classList.toggle('dark-mode', savedDarkMode);
    body.classList.toggle('light-mode', !savedDarkMode);
    
    // به‌روزرسانی آیکون
    updateThemeIcon(savedDarkMode);
}

// مقداردهی اولیه هنگام بارگذاری صفحه
document.addEventListener('DOMContentLoaded', initTheme);

// تابع را در scope جهانی قرار دهید
window.toggleTheme = toggleTheme;