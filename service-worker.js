/**
 * Civik-ia — Service Worker
 * Cache-first pour les assets statiques, network-first pour les API
 * Version: 1.0.0
 */

const CACHE_NAME = 'civik-ia-v4';
const STATIC_ASSETS = [
  '/',
  '/site-civik-ia.html',
  '/campagnes-citoyennes.html',
  '/demo.html',
  '/css/tokens.css',
  '/css/base.css',
  '/css/dark.css',
  '/css/nav.css',
  '/css/hero.css',
  '/css/sections.css',
  '/css/components.css',
  '/css/chatbot.css',
  '/css/utilities.css',
  '/js/theme.js',
  '/js/nav.js',
  '/js/data.js',
  '/js/animations.js',
  '/js/chatbot.js',
  '/js/forms.js',
  '/js/populate.js',
  '/js/demo.js',
  '/js/app.js',
  '/js/sw-register.js',
  '/logo-civik-ia.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json'
];

// Installation — pr\u00e9-cache des assets statiques
self.addEventListener('install', (event) => {
  console.log('[SW] Installation Civik-ia v1');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation — nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — strat\u00e9gie hybride
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls (chat, stats) → network-first, fallback cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Requ\u00eates POST (formulaires, chat) → toujours r\u00e9seau
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Assets statiques → cache-first, fallback network
  event.respondWith(cacheFirst(request));
});

// Strat\u00e9gie cache-first (assets statiques)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Offline fallback
    return new Response(offlinePage(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

// Strat\u00e9gie network-first (API)
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    return new Response(
      JSON.stringify({ error: 'Hors connexion', message: 'V\u00e9rifiez votre connexion internet.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Page offline minimaliste
function offlinePage() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Civik-ia \u2014 Hors connexion</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;
         font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
         background:linear-gradient(135deg,#000091 0%,#007bff 50%,#2EC4B6 100%);
         color:#fff;text-align:center;padding:24px}
    .card{background:rgba(255,255,255,0.12);backdrop-filter:blur(20px);
          border-radius:24px;padding:48px 32px;max-width:400px;
          border:1px solid rgba(255,255,255,0.2)}
    h1{font-size:24px;margin-bottom:12px}
    p{font-size:16px;opacity:0.85;line-height:1.5;margin-bottom:24px}
    button{background:#fff;color:#000091;border:none;padding:14px 32px;
           border-radius:12px;font-size:16px;font-weight:600;cursor:pointer}
    button:hover{transform:scale(1.03)}
    .icon{font-size:48px;margin-bottom:16px}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">\ud83c\udfe0</div>
    <h1>Hors connexion</h1>
    <p>Pas de connexion internet d\u00e9tect\u00e9e. V\u00e9rifiez votre r\u00e9seau et r\u00e9essayez.</p>
    <button onclick="location.reload()">R\u00e9essayer</button>
  </div>
</body>
</html>`;
}

// Push notifications — pr\u00eat pour les Campagnes Citoyennes
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Nouvelle notification de votre mairie',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'civik-ia-notification',
    data: {
      url: data.url || '/site-civik-ia.html'
    },
    actions: data.actions || [
      { action: 'open', title: 'Voir' },
      { action: 'dismiss', title: 'Fermer' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Civik-ia \u2014 Votre mairie',
      options
    )
  );
});

// Clic sur notification → ouvre la page concern\u00e9e
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/site-civik-ia.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Si un onglet est d\u00e9j\u00e0 ouvert, on le focus
        for (const client of windowClients) {
          if (client.url.includes('civik-ia') && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Sinon on ouvre un nouvel onglet
        return clients.openWindow(targetUrl);
      })
  );
});
