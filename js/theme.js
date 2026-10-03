/* Theme Manager - Champion Sports Academy */
(function() {
    const savedTheme = localStorage.getItem('csa_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
})();

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('csa_theme', isDark ? 'dark' : 'light');
    updateThemeToggleIcons();
}

function updateThemeToggleIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    
    toggleBtns.forEach(btn => {
        const icon = btn.querySelector('i');
        if (icon) {
            if (isDark) {
                icon.className = 'fa-solid fa-sun text-sky-400 text-lg';
            } else {
                icon.className = 'fa-solid fa-moon text-slate-600 text-lg';
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateThemeToggleIcons();
    
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', toggleDarkMode);
    });
});
