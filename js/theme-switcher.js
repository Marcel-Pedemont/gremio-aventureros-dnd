export function initThemeSwitcher() {
    const themeSelect = document.getElementById('theme-select');
    const savedTheme = localStorage.getItem('dm-theme') || 'cyberpunk';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (themeSelect) {
        themeSelect.value = savedTheme;
        themeSelect.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            document.documentElement.setAttribute('data-theme', selectedTheme);
            localStorage.setItem('dm-theme', selectedTheme);
        });
    }
}