document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('themeToggle');
    const body = document.body;
    const lightIcon = document.querySelector('.light-icon');
    const darkIcon = document.querySelector('.dark-icon');

    // Load Saved Theme
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme) {
        body.classList.remove('light-mode', 'dark-mode');
        body.classList.add(savedTheme);
        updateIcons(savedTheme);
    }

    // Toggle Theme Function
    function toggleTheme() {
        if (body.classList.contains('dark-mode')) {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            localStorage.setItem('themeMode', 'light-mode');
            updateIcons('light-mode');
        } else {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            localStorage.setItem('themeMode', 'dark-mode');
            updateIcons('dark-mode');
        }
    }

    function updateIcons(mode) {
        if (mode === 'dark-mode') {
            lightIcon.style.display = 'none';
            darkIcon.style.display = 'inline';
        } else {
            lightIcon.style.display = 'inline';
            darkIcon.style.display = 'none';
        }
    }

    // Add event listener
    themeToggleBtn.addEventListener('click', toggleTheme);
});