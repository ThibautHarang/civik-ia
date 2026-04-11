// ============================================
// app.js — Initialization on page load (Civik-ia site)
// Depends on: populate.js, demo.js, animations.js, chatbot.js
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    populatePricing();
    populateWhy();
    populateTestimonials();
    initializeDemo();
    animateCounters();


    // Performance: stagger fade-in animations to avoid mass repaints
    document.querySelectorAll('.pricing-card, .why-card, .testimonial-card, .stat-card, .persona-card').forEach((el, i) => {
        el.style.transitionDelay = (i % 4) * 80 + 'ms';
    });
    // Observer les éléments statiques du HTML (pas générés par JS)
    observeElements('.stat-card');
    observeElements('.persona-card');
    observeElements('#strates .fade-in');
    observeElements('#avant-apres .fade-in');
    observeElements('#campagnes .fade-in');
    observeElements('#parrainage .fade-in');


    // Performance: remove will-change after fade-in completes to free GPU
    document.addEventListener('transitionend', (e) => {
        if (e.target.classList.contains('fade-in') && e.target.classList.contains('visible')) {
            e.target.style.willChange = 'auto';
        }
    }, { passive: true });
    // Show chatbot FAB after 3 seconds, welcome bubble after 4s
    setTimeout(() => {
        document.getElementById('chatbotFab').classList.add('visible');
        document.getElementById('whatsappFab').classList.add('visible');
    }, 3000);

    setTimeout(() => {
        const bubble = document.getElementById('chatbotWelcome');
        if (bubble && !chatbotOpen) bubble.classList.add('visible');
    }, 5000);

    // Hide welcome bubble after 10s or on chatbot open
    setTimeout(() => {
        const bubble = document.getElementById('chatbotWelcome');
        if (bubble) bubble.classList.remove('visible');
    }, 12000);
});
