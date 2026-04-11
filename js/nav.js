// ============================================
// nav.js — Mobile hamburger menu (Civik-ia site)
// ============================================

function toggleMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.getElementById('navLinks');
    const overlay = document.getElementById('mobileOverlay');
    const isOpen = navLinks.classList.contains('active');

    hamburger.classList.toggle('active', !isOpen);
    navLinks.classList.toggle('active', !isOpen);
    overlay.classList.toggle('active', !isOpen);
    hamburger.setAttribute('aria-expanded', !isOpen);
    document.body.style.overflow = !isOpen ? 'hidden' : '';
}

function closeMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.getElementById('navLinks');
    const overlay = document.getElementById('mobileOverlay');

    hamburger.classList.remove('active');
    navLinks.classList.remove('active');
    overlay.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
}
