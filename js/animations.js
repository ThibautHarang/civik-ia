// ============================================
// animations.js — Animation & scroll functions (Civik-ia site)
// ============================================

function animateCounters() {
    const targets = [
        { element: document.querySelectorAll('.stat-number')[0], end: 77, suffix: '%' },
        { element: document.querySelectorAll('.stat-number')[1], end: 70, suffix: '%' },
        { element: document.querySelectorAll('.stat-number')[2], end: 4.5, suffix: 'h' }
    ];

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const idx = targets.findIndex(t => t.element === entry.target);
                if (idx !== -1 && !targets[idx].animated) {
                    targets[idx].animated = true;
                    animateValue(targets[idx].element, 0, targets[idx].end, 2000, idx === 2, targets[idx].suffix);
                }
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    targets.forEach(target => {
        if (target.element) counterObserver.observe(target.element);
    });
}

function animateValue(element, start, end, duration, isDecimal = false, suffix = '') {
    const startTime = Date.now();
    const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const current = start + (end - start) * progress;
        const value = isDecimal ? current.toFixed(1) : Math.floor(current);
        element.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
}

// Scroll intersection observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

function observeElements(selector) {
    document.querySelectorAll(selector).forEach(el => {
        observer.observe(el);
    });
}

function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}
