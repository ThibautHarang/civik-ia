// ============================================
// theme.js — Dark mode toggle (Civik-ia site)
// ============================================

function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('civik-theme', isDark ? 'light' : 'dark');
}

// Apply saved theme on load (also in <head> to prevent flash)
(function() {
    const saved = localStorage.getItem('civik-theme');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
})();
