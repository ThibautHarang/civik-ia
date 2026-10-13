/* =====================================================================
   Maquette C, « Le film ». Outils communs : calcul, courbes, hasard fixe,
   bruit, homographies (épingler un élément HTML sur un quadrilatère),
   découpe des textes en lettres et en mots.
   ===================================================================== */

export const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (p, a, b) => clamp((p - a) / (b - a));
export const ss = t => t * t * (3 - 2 * t);
export const sseg = (p, a, b) => ss(seg(p, a, b));
export const cloche = (p, a, b) => { const t = seg(p, a, b); return t > 0 && t < 1 ? Math.sin(Math.PI * t) : 0; };
/* O2 (quinzième passe) : une distance affichée (le guide du téléphone, les bornes du chemin), en mètres du monde, arrondie à
   la dizaine ; la même fonction pour les deux, pour qu'ils disent le même nombre au même endroit */
export const arrondiDistance = m => Math.max(0, Math.round(m / 10) * 10);

export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t, dX = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { const e = X(t) - x, d = dX(t); if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break; t -= e / d; }
    if (t < 0 || t > 1 || Math.abs(X(t) - x) > 1e-3) { let a = 0, b = 1; for (let i = 0; i < 30; i++) { t = (a + b) / 2; if (X(t) < x) a = t; else b = t; } }
    return Y(clamp(t));
  };
}
/* entrée d'un élément, déplacement d'un point à un autre (grammaire de la DDC) */
export const eEntree = bezier(.16, 1, .3, 1);
export const eDepl = bezier(.65, 0, .35, 1);
/* un seul objet rebondit dans le film : le téléphone quand la main le prend */
export const rebond = t => t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.exp(-6 * t) * Math.cos(t * Math.PI * 2.6);

/* hasard à graine fixe (mulberry32) et petite empreinte */
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function hash(a, b) { let h = Math.imul(a | 0, 374761393) + Math.imul((b | 0) + 1013, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }

/* bruit de valeur 1D et 2D, lisse */
export function bruit1(seed) {
  const r = rng(seed), v = new Float32Array(258);
  for (let i = 0; i < 258; i++) v[i] = r() * 2 - 1;
  return s => { s = ((s % 256) + 256) % 256; const i = s | 0, f = s - i, u = f * f * (3 - 2 * f); return v[i] + (v[i + 1] - v[i]) * u; };
}
export function bruit2(seed) {
  const N = 256, r = rng(seed), val = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) val[i] = r();
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const x0 = xi & (N - 1), y0 = yi & (N - 1), x1 = (x0 + 1) & (N - 1), y1 = (y0 + 1) & (N - 1);
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = val[y0 * N + x0], b = val[y0 * N + x1], c = val[y1 * N + x0], e = val[y1 * N + x1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + e) * u * v;
  };
}
/* bruit fractal (quelques octaves) */
export function fbm(b2, x, y, oct = 4) { let s = 0, a = .5, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += a * b2(x * f, y * f); n += a; a *= .5; f *= 2.03; } return s / n; }

/* =====================================================================
   Homographies. Un quadrilatère est une liste de quatre points
   [haut gauche, haut droit, bas droit, bas gauche].
   ===================================================================== */
/* carré unité vers quadrilatère : renvoie la matrice 3 x 3 [a b c d e f g h i] */
export function carreVers(q) {
  const [x0, y0] = q[0], [x1, y1] = q[1], [x2, y2] = q[2], [x3, y3] = q[3];
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let g = 0, h = 0;
  if (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9) {
    const det = dx1 * dy2 - dx2 * dy1 || 1e-9;
    g = (dx3 * dy2 - dx2 * dy3) / det; h = (dx1 * dy3 - dx3 * dy1) / det;
  }
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
}
export function mult3(A, B) {
  return [
    A[0] * B[0] + A[1] * B[3] + A[2] * B[6], A[0] * B[1] + A[1] * B[4] + A[2] * B[7], A[0] * B[2] + A[1] * B[5] + A[2] * B[8],
    A[3] * B[0] + A[4] * B[3] + A[5] * B[6], A[3] * B[1] + A[4] * B[4] + A[5] * B[7], A[3] * B[2] + A[4] * B[5] + A[5] * B[8],
    A[6] * B[0] + A[7] * B[3] + A[8] * B[6], A[6] * B[1] + A[7] * B[4] + A[8] * B[7], A[6] * B[2] + A[7] * B[5] + A[8] * B[8]
  ];
}
export function inv3(m) {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C || 1e-12;
  return [A / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det, C / det, -(a * h - b * g) / det, (a * e - b * d) / det];
}
export function appl(H, x, y) { const w = H[6] * x + H[7] * y + H[8]; return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w]; }
/* quadrilatère source vers quadrilatère cible */
export function quadVersQuad(src, dst) { return mult3(carreVers(dst), inv3(carreVers(src))); }
/* matrice 3 x 3 (coordonnées locales en pixels) vers chaîne matrix3d */
export function m3d(H) {
  const s = H[8];
  const v = [H[0] / s, H[3] / s, 0, H[6] / s, H[1] / s, H[4] / s, 0, H[7] / s, 0, 0, 1, 0, H[2] / s, H[5] / s, 0, 1];
  return 'matrix3d(' + v.map(x => +x.toFixed(8)).join(',') + ')';
}
/* épingler une boîte de w x h pixels sur un quadrilatère écran */
export function epingle(w, h, q) { return m3d(mult3(carreVers(q), [1 / w, 0, 0, 0, 1 / h, 0, 0, 0, 1])); }
/* Q6 (dix-septième passe, 07/10/2026) : au doigt, la cible d'un objet posé en perspective fait au moins 44 px à l'écran (une
   zone invisible autour de lui, film.css, --zone-x et --zone-y en pixels de l'élément) */
export const DOIGT = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
/* S2 (dix-neuvième passe, 07/10/2026) : la cause de l'arrêt de la page sur l'iPhone, trouvée sur l'appareil. Vu de loin (le crayon
   couché sur la planche, aperçu par la porte de l'atelier dès 0,70 : quelques pixels à l'écran), la zone de 44 px rapportée
   aux pixels de l'élément devenait immense (près de 5000 x 4500 px autour d'un crayon de 760 x 72) ; le calque du bouton
   en prenait la taille, et iOS lui donnait une surface à la densité de l'écran (des centaines de Mo) : la page tombait à
   l'arrivée des couleurs de l'atelier, au doigt seulement (le Mac, à la souris, n'a pas de zone). La zone n'est posée que
   quand l'objet est actif (actif) et assez grand à l'écran pour être visé (24 px de long, 4 px d'épaisseur) ; elle ne
   dépasse jamais la taille de l'élément lui-même */
export function zoneDoigt(e, H, w, h, actif = true) {
  const A = appl(H, 0, 0), B = appl(H, 0, h), C = appl(H, w, 0), hs = Math.hypot(B[0] - A[0], B[1] - A[1]), ws = Math.hypot(C[0] - A[0], C[1] - A[1]);
  const vise = actif && Math.max(ws, hs) >= 24 && Math.min(ws, hs) >= 4;
  const zy = vise ? Math.min(h, Math.max(0, (44 - hs) / 2) * h / hs) : 0, zx = vise ? Math.min(w, Math.max(0, (44 - ws) / 2) * w / ws) : 0;
  const k = Math.round(zx) + ',' + Math.round(zy);
  if (e._zone !== k) { e._zone = k; e.style.setProperty('--zone-x', Math.round(zx) + 'px'); e.style.setProperty('--zone-y', Math.round(zy) + 'px'); }
}
/* Q6 : la même zone pour un élément posé sur un quadrilatère (epingle) */
export function zoneDoigtQuad(e, q, w, h, actif = true) { zoneDoigt(e, mult3(carreVers(q), [1 / w, 0, 0, 0, 1 / h, 0, 0, 0, 1]), w, h, actif); }
/* point (u, v) en fractions d'un quadrilatère */
export function dansQuad(q, u, v) { return appl(carreVers(q), u, v); }
/* sous-quadrilatère : q2 en fractions de q */
export function sousQuad(q, q2) { const H = carreVers(q); return q2.map(p => appl(H, p[0], p[1])); }
/* quadrilatère d'un rectangle tourné */
export function quadRect(cx, cy, w, h, ang = 0) {
  const c = Math.cos(ang), s = Math.sin(ang), pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
  return pts.map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
}
export const centreQuad = q => [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4];
export const aireQuad = q => { let s = 0; for (let i = 0; i < 4; i++) { const a = q[i], b = q[(i + 1) % 4]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
/* passage d'un quadrilatère à un autre : le centre suit un arc, la forme tourne avec lui */
export function quadEntre(qa, qb, t, o = {}) {
  if (t <= 0) return qa; if (t >= 1) return qb;
  const ca = centreQuad(qa), cb = centreQuad(qb);
  const ang = a => Math.atan2(a[1][1] - a[0][1], a[1][0] - a[0][0]);
  let da = ang(qb) - ang(qa); while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
  const tourne = (o.tour || 0) * Math.sin(Math.PI * t);
  const a = ang(qa) + da * t + tourne;
  const arc = o.arc || [0, 0];
  const cx = lerp(ca[0], cb[0], t) + arc[0] * Math.sin(Math.PI * t), cy = lerp(ca[1], cb[1], t) + arc[1] * Math.sin(Math.PI * t);
  /* forme : coins relatifs au centre, ramenés dans le repère de chaque quad, interpolés */
  const rel = (q, c, an) => q.map(p => { const x = p[0] - c[0], y = p[1] - c[1], co = Math.cos(-an), si = Math.sin(-an); return [x * co - y * si, x * si + y * co]; });
  const ra = rel(qa, ca, ang(qa)), rb = rel(qb, cb, ang(qb));
  const co = Math.cos(a), si = Math.sin(a);
  return ra.map((p, i) => { const x = lerp(p[0], rb[i][0], t), y = lerp(p[1], rb[i][1], t); return [cx + x * co - y * si, cy + x * si + y * co]; });
}

/* =====================================================================
   Écriture des styles sans répétition
   ===================================================================== */
export function setT(el, v) { if (el._t !== v) { el._t = v; el.style.transform = v; } }
export function setO(el, v) { v = +(+v).toFixed(3); if (el._o !== v) { el._o = v; el.style.opacity = v; } }
/* X1 bis et X2 bis (vingt-quatrième passe, 08/10/2026) : sur téléphone, un calque caché garde sa mémoire. Mesuré dans le moteur de Safari
   (agent d'iPhone, densité 3), le film posé à p 0,72 : passer en display: none les éléments cachés par visibility rend 130 à 250 Mo au
   processus de la page, dont 101 Mo pour les seules neuf tranches du téléphone de la nuit (589 x 1205 px chacune, peintes une fois à la
   nuit, jamais revues sur téléphone), 31 Mo pour son ombre, son reflet et son écran, 25 Mo pour les mains ; remis en display, cachés,
   ils ne reprennent pas cette mémoire (elle ne revient que s'ils se montrent). Sur téléphone, un élément de la scène (.ep)
   caché par setV depuis 0,8 s (1,5 s pour une image) passe deux images en display: none, puis revient tel qu'il était, toujours caché : sa mémoire graphique
   part ; s'il se montre entre-temps, il revient tout de suite. Rien ne change à l'écran (il est caché), ni sur ordinateur. ?purge=0
   l'écarte (essais) */
const TEL_O = (() => { try { return Math.min(innerWidth, screen && screen.width ? screen.width : innerWidth) < 768 || innerWidth < 768; } catch (e) { return false; } })();
const PURGE = TEL_O && (() => { try { return new URLSearchParams(location.search).get('purge') !== '0'; } catch (e) { return true; } })();
const PURGE_IMG = (() => { try { const v = new URLSearchParams(location.search).get('purgeimg'); return v === null ? null : v === '1'; } catch (e) { return null; } })();   /* ?purgeimg=0 : pas les images (essais) */
const CACHES = new Set(); let balai = 0;
function balayer() {
  balai = 0; const t = performance.now(), L = [];
  CACHES.forEach(e => {
    if (e._v !== 'hidden' || !e.isConnected) { CACHES.delete(e); return; }
    if (t - e._tc < (e.tagName === 'IMG' ? 1500 : 800)) return;
    CACHES.delete(e); e._dp = e.style.display; e.style.display = 'none'; e._purge = true; L.push(e);
  });
  if (L.length) requestAnimationFrame(() => requestAnimationFrame(() => L.forEach(e => { if (e._purge) { e._purge = false; e.style.display = e._dp || ''; } })));
  if (CACHES.size) balai = setTimeout(balayer, 400);
}
export function setV(el, vis) {
  const v = vis ? '' : 'hidden';
  if (el._v === v) return;
  el._v = v; el.style.visibility = v;
  /* X1 bis et X2 bis : les images aussi, cachées depuis 1,5 s (les mains, le téléphone, le poteau, la planche de près : 25 Mo pour les
     seules mains dans le moteur de Safari). Mesuré sur l'iPhone chaud : le retour rapide de la fin vers le départ mourait trois fois sur
     trois à p 0,71 sans elles, passe trois fois sur trois avec elles (?purgeimg=1, le 08/10 à 18 h 35) */
  if (!PURGE || (el.tagName === 'IMG' && PURGE_IMG === false) || !el.classList || !el.classList.contains('ep')) return;
  if (vis) { CACHES.delete(el); if (el._purge) { el._purge = false; el.style.display = el._dp || ''; } }
  else { el._tc = performance.now(); CACHES.add(el); if (!balai) balai = setTimeout(balayer, 450); }
}
export function setVar(el, k, v) { const key = '_v' + k; if (el[key] !== v) { el[key] = v; el.style.setProperty(k, v); } }
export function setTxt(el, v) { if (el._x !== v) { el._x = v; el.textContent = v; } }

/* =====================================================================
   Textes : verbes lettre par lettre sous masque, légendes mot à mot.
   Le titre garde son texte réel pour les lecteurs d'écran.
   ===================================================================== */
export function decouperLettres(h) {
  const txt = h.textContent.trim(); h.setAttribute('aria-label', txt); h.textContent = '';
  const m = document.createElement('span'); m.className = 'm'; m.setAttribute('aria-hidden', 'true');
  Array.from(txt).forEach((c, i) => { const l = document.createElement('span'); l.className = 'l'; l.style.setProperty('--i', i); l.textContent = c; m.appendChild(l); });
  h.appendChild(m); h.dataset.n = txt.length;
}
export function decouperMots(pp) {
  let i = 0;
  const entier = pp.textContent.replace(/\s+/g, ' ').trim();
  (function parcourir(noeud) {
    Array.from(noeud.childNodes).forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        /* Q2 (dix-septième passe, 07/10/2026) : la découpe ne se fait que sur les espaces ordinaires (comme les pages) : une
           espace insécable reste dans le mot, « 24 h sur 24 » ne se coupe plus */
        n.textContent.split(/([ \t\n\r]+)/).forEach(b => {
          if (!b) return;
          if (/^[ \t\n\r]+$/.test(b)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true'); w.style.setProperty('--i', i++); w.textContent = b; frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('sr')) parcourir(n);
    });
  })(pp);
  const sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = entier; pp.appendChild(sr);
  pp.dataset.n = i;
}
/* v : entrée de 0 à 1, s : sortie de 0 à 1 */
/* N3 (quatorzième passe) : plus aucune lettre floue au repos. Chaque lettre (chaque mot) entre avec un flou et un
   glissement tant que sa progression n'a pas atteint 1 ; Safari rend un texte qui porte un filtre sur un calque à part,
   plus mou qu'un texte sans filtre, même à blur(0). Quand la dernière lettre est arrivée à 98,5 % et que la première
   n'est pas encore partie (1,5 %), le texte passe à l'état « fini » : sans filtre, sans transformation, opacité 1 (le
   reste des 1,5 % ne se voit pas : moins d'un pixel) ; quand la dernière lettre est partie à 98,5 %, état « parti »
   (rien n'est plus dessiné). Entre les deux, l'animation. */
function etatTexte(el, tDerniere, xPremiere, xDerniere) {
  const fini = tDerniere >= .985 && xPremiere <= .015, parti = !fini && xDerniere >= .985;
  if (el._fini !== fini) { el._fini = fini; el.classList.toggle('fini', fini); }
  if (el._parti !== parti) { el._parti = parti; el.classList.toggle('parti', parti); }
}
export function lettres(h, v, s = 0) {
  const n = +h.dataset.n, V = v * (.42 + (n - 1) * .07), S = s * (.4 + (n - 1) * .05);
  setVar(h, '--v', V.toFixed(4)); setVar(h, '--s', S.toFixed(4));
  etatTexte(h, clamp((V - (n - 1) * .07) / .42), clamp(S / .4), clamp((S - (n - 1) * .05) / .4));
}
export function mots(pp, v, s = 0) {
  const n = +pp.dataset.n, V = v * (.4 + (n - 1) * .1), S = s * (.4 + (n - 1) * .06);
  setVar(pp, '--v', V.toFixed(4)); setVar(pp, '--s', S.toFixed(4));
  etatTexte(pp, clamp((V - (n - 1) * .1) / .4), clamp(S / .4), clamp((S - (n - 1) * .06) / .4));
}

/* un nœud HTML à partir d'une chaîne */
export function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
