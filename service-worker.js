/**
 * Civik-ia, Service Worker
 * Cache-first pour les assets statiques, network-first pour les API
 * Version: 1.0.0
 */

// v171 (refonte du 08/10/2026) : la home (/), le film (/c-film/), /commun/, /conseil/ et /atelier/ passent par le reseau,
// jamais par ce cache (ni precache, ni mise en cache a la volee) : le film change encore et ses fichiers ne portent pas de
// numero de version. Le navigateur les garde selon les en-tetes de nginx (voir maquettes/seo/nginx-DIFF.conf).
// v186 (passe P2, 19/10/2026, couche commune des pages anciennes) : polices servies par le site (/assets/fonts/*.woff2),
// feuilles /css/polices.css, /css/jetons.css, /css/couche-commune.css et script /js/cookies.js, appelés avec ?v=AAAAMMJJ.
// Pas de règle contraire au Cache-Control : nginx les sert « public » sept jours (bloc des fichiers statiques), ce cache les garde
// jusqu'au prochain changement de CACHE_NAME (fichiers immuables à adresse donnée, une nouvelle version change de ?v=).
// v187 (passe P3, 19/10/2026, composants et mots de la maison nouvelle) : l'accueil, Conseil et l'Atelier lisent /css/jetons.css,
// /css/couche-commune.css et /js/cookies.js avec ?v=20261019b (le bandeau de cookies de la maison remplace /cookie-consent.js
// sur ces trois pages) ; js/cookies.js, les deux pages des canaux, 22h47, la page prix, le livre blanc, le guide RGPD et les pages
// légales changent : le cache est vidé une fois de plus.
// v188 (passe P4, 19/10/2026, le chemin jusqu'au contact) : « Contact » mène au formulaire de l'accueil depuis toutes les pages
// anciennes (barre et pied communs) ; feuilles et script communs appelés avec ?v=20261019c (bandeau compact sur ordinateur, compteur
// des choix du bandeau, mesures après l'accord) ; le calculateur de la page prix ouvre une demande préremplie (prix.js et prix.css
// appelés avec ?v=20261019c).
// v189 (passe P5, 19/10/2026, le film) : le lecteur du téléphone charge les vidéos dans l'ordre du visiteur et les arrête quand il
// quitte le film, la nuit reste à l'écran avant la première image, rail en deux encres et invite d'attente, « Continuer » blanc sur
// bleu, commandes sur la colonne de la barre et effacées sous le film, équivalent textuel du film, boucles arrêtées avant 5 s, trait
// de plume du menu final, bulle et « Parler de mon projet » vers le contact de l'Atelier (accueil et /c-film/, hors de ce cache ; la
// version change pour vider les copies des pages anciennes une fois de plus, comme à chaque passe).
// v206 (23/10/2026) : grappes AI Act, chatbot et financement (pages neuves, pilier chatbot, pilier du financement,
// liens, hub des guides) : les copies des pages anciennes se vident une fois de plus.
// v216 (28/10/2026) : indexation, mail Search Console du 26/10 (date et heure complètes dans la page de profil de /conseil/,
// canonical sur trois pages légales).
// v217 (28/10/2026) : le test IA des collectivités (/test-ia/), contourné comme /conseil/ : la page et questions.json
// passent par le réseau, une mise à jour de la banque ne demande pas de nouvelle version.
// v218 (29/10/2026) : test IA, la question des dates se répond en touchant la date sous chaque règle.
const CACHE_NAME = 'civik-ia-v218-test-ia-frise-2026-10-29';
const STATIC_ASSETS = [
  '/site-civik-ia.html',
  // /demo.html et /demo retirés du précache v19 : page prospection avec iframes live,
  // doit toujours passer par le réseau pour servir la dernière version (mosaïque + ROI + FAQ).
  '/logo-civik-ia.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json'
];

// Paths à NE PAS intercepter par le SW : l'app multi-persona doit toujours passer
// par le réseau (sinon le browser sert l'ancienne version cachée).
// /interne/ (Flotte Marianne) : la page lit un snapshot.json regenere chaque
// nuit. En cache-first, le SW le servirait indefiniment depuis le cache et le
// telephone afficherait l'etat d'avant-hier SANS LE DIRE : caches.match ignore
// le Cache-Control "no-store" pose par nginx. Le contournement est la seule
// garde qui tienne.
const SW_BYPASS_PREFIXES = ['/preview/', '/app/', '/portrait/', '/interne/', '/c-film/', '/commun/', '/conseil/', '/atelier/', '/test-ia/'];
const SW_BYPASS_EXACT = ['/demo.html', '/demo', '/', '/index.html'];

// Installation : pr\u00e9-cache des assets statiques
self.addEventListener('install', (event) => {
  console.log('[SW] Installation Civik-ia v1');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation : nettoyage des anciens caches
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

// Fetch : strat\u00e9gie hybride
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // BYPASS COMPLET : l'app multi-persona (/preview/, /app/, /portrait/, /demo.html)
  // doit toujours passer par le réseau. Le SW ne doit JAMAIS intercepter.
  // Sinon le browser servirait l'ancienne version cachée (mobile cassé).
  if (SW_BYPASS_PREFIXES.some(p => url.pathname.startsWith(p))) {
    return; // laisse le réseau gérer normalement
  }
  if (SW_BYPASS_EXACT.includes(url.pathname)) {
    return; // /demo.html → redirect 302 nginx, ne pas cacher
  }

  // API calls (chat, stats) → network-first, fallback cache ; GET seulement (P8, 20/10/2026 : un POST, comme la route
  // des formulaires api.civik-ia.fr/api/site/contact, passe par la branche suivante, réseau seul, sans tentative de cache)
  if (url.pathname.startsWith('/api/') && request.method === 'GET') {
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
  <title>Civik-ia : Hors connexion</title>
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

// Push notifications : code dormant (D97 du 09/10/2026, diffusion retiree de l'offre)
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
      data.title || 'Civik-ia : Votre mairie',
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
