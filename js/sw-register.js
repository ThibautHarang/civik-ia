// ============================================
// sw-register.js — Service Worker PWA registration (Civik-ia site)
// ============================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('[PWA] Service Worker enregistré:', reg.scope))
            .catch(err => console.warn('[PWA] Échec enregistrement SW:', err));
    });
}
