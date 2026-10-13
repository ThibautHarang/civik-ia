/* =====================================================================
   Les visuels : chaque image du film a un nom (celui du storyboard).
   Si le fichier existe dans commun/img/c/ (WebP, sinon PNG), il est pris ;
   sinon une version provisoire est peinte dans un canevas. Les deux passent
   par le même mécanisme : une image, ses dimensions, et des repères
   (quadrilatères et points, en fractions de l'image) lus dans
   commun/img/c/manifeste.json, ou dans le manifeste par défaut ci-dessous.
   ===================================================================== */
import { quadRect } from './outils.js';
import { ouvrier } from './hors-fil.js';
import { TEL } from './memoire.js';

/* ?dossier=essai : lit un dossier d'essai (c-film/essai-visuels/) pour vérifier le branchement des fichiers réels */
export const DOSSIER = new URLSearchParams(location.search).get('dossier') === 'essai' ? 'essai-visuels/' : '../commun/img/c/';

/* repères des versions provisoires (fractions de l'image) */
const fr = (q, w, h) => q.map(([x, y]) => [+(x / w).toFixed(5), +(y / h).toFixed(5)]);
const rectQ = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/* Géométrie des provisoires, en pixels de leur canevas. Les peintres la lisent. */
export const GEO = {
  telephone: { w: 760, h: 1500, corps: [60, 92, 700, 1408], rayon: 96, ecran: [90, 122, 670, 1378], rayonEcran: 70 },
  'main-gauche-telephone': { w: 1000, h: 1250, plaque: { cx: 522, cy: 770, w: 330, h: 679, a: 8 } },
  'main-droite-feuille': { w: 1000, h: 1250, plaque: { cx: 470, cy: 548, w: 600, h: 849, a: -6 } },
  'main-droite-saisit': { w: 1000, h: 1250, pince: [318, 300] },
  'main-crayon': { w: 1200, h: 1200, pointe: [262, 270] },
  'main-souleve': { w: 1200, h: 1200, coin: [455, 520] },
  'poteau-planche': {
    w: 900, h: 1200, poteau: [418, 40, 482, 1190],
    planche: [290, 380, 610, 807], plaque: [392, 398, 508, 442], cv: [340, 460, 560, 771], clou: [450, 476],
    fg: { y0: 108, y1: 186, x0: 96, x1: 446 }, fd: { y0: 210, y1: 288, x0: 454, x1: 806 }
  },
  'atelier-facade': { w: 1600, h: 1200, sol: 1130, murs: [230, 1370], porte: [650, 690, 950, 1130] },
  /* la table vue en entier depuis l'entrée : planche redressée, face au visiteur */
  'atelier-table': { w: 1920, h: 1080, planche: [[548, 236], [1372, 236], [1376, 702], [544, 702]] },
  /* la même planche de près, plein écran */
  'atelier-planche': {
    w: 1920, h: 1080,
    planche: [[110, 70], [1810, 70], [1810, 930], [110, 930]],
    feuille: [[200, 300], [1720, 300], [1720, 884], [200, 884]],
    telephone: [[248, 420], [492, 420], [492, 946], [248, 946]],
    cv: [[690, 360], [1030, 360], [1030, 840], [690, 840]],
    idee: [[1120, 360], [1640, 360], [1640, 840], [1120, 840]],
    crayon: [[1180, 926], [1640, 926], [1640, 952], [1180, 952]],
    gravure: [[176, 110], [584, 110], [584, 250], [176, 250]],
    clou: [860, 384],
    levre: [[100, 952], [1820, 952], [1826, 1000], [94, 1000]]
  },
  clou: { w: 200, h: 200 },
  /* la feuille A4 réelle (le CV) : papier, zone imprimable, trou du clou */
  feuille: { w: 1120, h: 1584, corps: [8, 8, 1112, 1576], texte: [96, 136, 1024, 1500], clou: [560, 60] },
  /* la grande feuille de dessin (bloc à dessin) : surface où l'on dessine */
  'feuille-dessin': { w: 2200, h: 940, corps: [6, 6, 2194, 934], surface: [70, 70, 2130, 880] },
  /* le crayon dessiné à la plume, seul (repris du crayon de la main) */
  'crayon-dessine': { w: 760, h: 72, pointe: [14, 36], bout: [746, 36] }
};

export const MANIFESTE_DEFAUT = (() => {
  const g = GEO, m = {};
  const t = g.telephone; m.telephone = { quad: fr(rectQ(...t.ecran), t.w, t.h), corps: fr(rectQ(...t.corps), t.w, t.h) };
  const mg = g['main-gauche-telephone'], pg = mg.plaque; m['main-gauche-telephone'] = { quad: fr(quadRect(pg.cx, pg.cy, pg.w, pg.h, pg.a * Math.PI / 180), mg.w, mg.h) };
  const md = g['main-droite-feuille'], pd = md.plaque; m['main-droite-feuille'] = { quad: fr(quadRect(pd.cx, pd.cy, pd.w, pd.h, pd.a * Math.PI / 180), md.w, md.h) };
  m['main-droite-saisit'] = { pince: [g['main-droite-saisit'].pince[0] / 1000, g['main-droite-saisit'].pince[1] / 1250] };
  m['main-crayon'] = { pointe: [g['main-crayon'].pointe[0] / 1200, g['main-crayon'].pointe[1] / 1200] };
  m['main-souleve'] = { coin: [g['main-souleve'].coin[0] / 1200, g['main-souleve'].coin[1] / 1200] };
  const pp = g['poteau-planche'], W = pp.w, H = pp.h;
  m['poteau-planche'] = {
    cv: fr(rectQ(...pp.cv), W, H), plaque: fr(rectQ(...pp.plaque), W, H),
    fleche_gauche: fr(rectQ(pp.fg.x0 + 62, pp.fg.y0 + 12, pp.fg.x1 - 18, pp.fg.y1 - 12), W, H),
    fleche_droite: fr(rectQ(pp.fd.x0 + 18, pp.fd.y0 + 12, pp.fd.x1 - 62, pp.fd.y1 - 12), W, H),
    clou: [pp.clou[0] / W, pp.clou[1] / H],
    planche: fr(rectQ(...pp.planche), W, H), pied: [.5, pp.poteau[3] / H]
  };
  const af = g['atelier-facade']; m['atelier-facade'] = { porte: fr(rectQ(...af.porte), af.w, af.h), sol: af.sol / af.h };
  const at = g['atelier-table']; m['atelier-table'] = { planche: fr(at.planche, at.w, at.h) };
  const ap = g['atelier-planche'], fa = q => fr(q, ap.w, ap.h);
  m['atelier-planche'] = { planche: fa(ap.planche), feuille: fa(ap.feuille), telephone: fa(ap.telephone), cv: fa(ap.cv), idee: fa(ap.idee), crayon: fa(ap.crayon), gravure: fa(ap.gravure), clou: [ap.clou[0] / ap.w, ap.clou[1] / ap.h], levre: fa(ap.levre), graver: true };
  m['main-crayon'].poignet = [.8, .86];
  /* cyprès provisoires : pied et cime comme dans le manifeste réel */
  m['cypres-1'] = m['cypres-2'] = { pied: [.5, 876 / 900], cime: 14 / 900 };
  /* section H des retours du 02/10/2026 : les repères des visuels attendus ce soir */
  const fe = g.feuille; m.feuille = { texte: fr(rectQ(...fe.texte), fe.w, fe.h), clou: [fe.clou[0] / fe.w, fe.clou[1] / fe.h], corps: fr(rectQ(...fe.corps), fe.w, fe.h) };
  const fd = g['feuille-dessin']; m['feuille-dessin'] = { surface: fr(rectQ(...fd.surface), fd.w, fd.h), corps: fr(rectQ(...fd.corps), fd.w, fd.h) };
  const cd = g['crayon-dessine']; m['crayon-dessine'] = { pointe: [cd.pointe[0] / cd.w, cd.pointe[1] / cd.h], bout: [cd.bout[0] / cd.w, cd.bout[1] / cd.h] };
  m['telephone-trois-quarts'] = {};
  m.clou = {}; m['sol-chemin'] = {}; m.herbes = {};
  return m;
})();

/* repères de la planche de près, en pixels de l'image (provisoire ou réelle) */
export function reperesPx(v, nom) { const r = v.reperes[nom]; if (!r) return null; return Array.isArray(r[0]) ? r.map(([x, y]) => [x * v.w, y * v.h]) : [r[0] * v.w, r[1] * v.h]; }

/* P4 (seizième passe) : le même masque, par étapes (la rastérisation, la lecture, le calcul par bandes de 100 rangées) ;
   l'encodage en PNG (le plus long, d'un bloc) est laissé à l'ouvrier par le monde (monde.js) */
/* Q2 : la police du « C » est chargée avec le logo (sans le masque préparé seulement) */
const policeC = () => (document.fonts && document.fonts.load ? document.fonts.load('700 266px Poppins').catch(() => {}) : Promise.resolve());
export const chargerLogo = () => Promise.all([new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = '../commun/img/logo-civik-ia.svg#svgView(viewBox(560,170,1050,850))'; }), policeC()]).then(r => r[0]);
/* Q2 (dix-septième passe, 07/10/2026) : sur la plaque du poteau, le nom gravé s'écrit « Civik-ia » (casing de la marque) :
   le « c » du mot du logo (une géométrique très proche de Poppins, mesurée) est remplacé par un « C » de Poppins 700 (l'épaisseur
   de trait du « i » et du « k » du logo), sur la même ligne de base, son côté droit à la place de celui du « c » (même écart avec le
   « i ») ; la flèche, l'arche et le reste du mot ne changent pas. Le masque préparé (prets/logo-masque.png) est refait
   par ce même code */
function capitaleC(g) {
  g.save(); g.fillStyle = '#fff'; g.fillRect(52, 652, 174, 198);
  g.font = '700 266px Poppins'; g.fillStyle = '#000'; g.textBaseline = 'alphabetic'; g.textAlign = 'right';
  g.fillText('C', 218, 832); g.restore();
}
export function* logoMasqueEtapes(im, sortie) {
  const w = 1050, h = 850, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true }); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  /* la rastérisation du SVG par quarts (chacun découpé et lu aussitôt) */
  const d = g.createImageData(w, h), a = d.data;
  for (let q = 0; q < 4; q++) {
    const y0 = Math.floor(h * q / 4), y1 = Math.floor(h * (q + 1) / 4);
    g.save(); g.beginPath(); g.rect(0, y0, w, y1 - y0); g.clip(); g.drawImage(im, 0, 0, w, h); if (q === 3) capitaleC(g); g.restore();
    a.set(g.getImageData(0, y0, w, y1 - y0).data, y0 * w * 4);
    yield;
  }
  for (let y0 = 0; y0 < h; y0 += 100) {
    for (let i = y0 * w * 4, i1 = Math.min(h, y0 + 100) * w * 4; i < i1; i += 4) { const l = (.2126 * a[i] + .7152 * a[i + 1] + .0722 * a[i + 2]) / 255; const al = Math.max(0, Math.min(1, (.86 - l) / .55)); a[i] = a[i + 1] = a[i + 2] = 0; a[i + 3] = al * 255; }
    yield;
  }
  sortie.c = c; sortie.g = g; sortie.d = d;
}
/* le logo de Civik-ia en masque alpha (parties sombres opaques), pour la plaque gravée */
let masqueLogo = null;
export function logoMasque() {
  if (masqueLogo) return masqueLogo;
  masqueLogo = new Promise(res => {
    const im = new Image();
    im.onload = () => {
      const w = 1050, h = 850, c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true }); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h); capitaleC(g);   /* Q2 */
      const d = g.getImageData(0, 0, w, h); const a = d.data;
      for (let i = 0; i < a.length; i += 4) { const l = (.2126 * a[i] + .7152 * a[i + 1] + .0722 * a[i + 2]) / 255; const al = Math.max(0, Math.min(1, (.86 - l) / .55)); a[i] = a[i + 1] = a[i + 2] = 0; a[i + 3] = al * 255; }
      g.putImageData(d, 0, 0); res(c.toDataURL('image/png'));
    };
    im.onerror = () => res(null);
    policeC().then(() => { im.src = '../commun/img/logo-civik-ia.svg#svgView(viewBox(560,170,1050,850))'; });
  });
  return masqueLogo;
}

/* les fichiers attendus, par chapitre de préchargement (crayon.webp, le crayon bleu réaliste, est abandonné le 02/10/2026) */
export const ATTENDUS = {
  nuit: ['telephone', 'telephone-trois-quarts', 'main-gauche-telephone'],
  chemin: ['lointain', 'sol-chemin', 'cypres-1', 'cypres-2', 'vigne-1', 'vigne-2', 'muret', 'borne', 'herbes', 'poteau-planche', 'feuille', 'clou', 'main-droite-saisit', 'main-droite-feuille', 'atelier-facade-fermee', 'plaque-atelier', 'oiseau-planche', 'oiseau-pose'],
  atelier: ['atelier-table', 'atelier-planche', 'feuille-dessin', 'crayon-dessine', 'main-crayon', 'main-souleve', 'main-gauche-ouverte']
};

let manifeste = null, peintres = {};
const cache = new Map();

export function enregistrerPeintres(p) { Object.assign(peintres, p); }

export function lireManifeste() {
  /* une seule lecture, partagée : on garde la promesse (et non l'objet) pour éviter la course */
  if (!manifeste) manifeste = fetch(DOSSIER + 'manifeste.json', { cache: 'no-cache' })
    .then(r => r.ok ? r.json() : {})
    .catch(() => ({}));
  return manifeste;
}
/* une image : chargée et décodée, ou null. Filets : 15 s au plus pour le chargement, 3 s pour le décodage
   (un décodage qui ne rend jamais la main ne doit pas figer le film) */
function essayer(url) {
  return new Promise(res => {
    const im = new Image(); im.decoding = 'async';
    let fini = false; const rendre = v => { if (!fini) { fini = true; clearTimeout(t); res(v); } };
    const t = setTimeout(() => rendre(im.complete && im.naturalWidth ? im : null), 15000);
    im.onload = () => {
      const d = im.decode ? im.decode().catch(() => {}) : Promise.resolve();
      Promise.race([d, new Promise(r => setTimeout(r, 3000))]).then(() => rendre(im.naturalWidth ? im : null));
    };
    im.onerror = () => rendre(null);
    im.src = url;
  });
}
/* boîte englobante des pixels opaques (le téléphone réel arrive détouré) */
function boiteAlpha(im) {
  const w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, 400 / Math.max(w, h));
  const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 <= x0) return [[0, 0], [1, 0], [1, 1], [0, 1]];
  const fx = v => v / c.width, fy = v => v / c.height;
  return [[fx(x0), fy(y0)], [fx(x1 + 1), fy(y0)], [fx(x1 + 1), fy(y1 + 1)], [fx(x0), fy(y1 + 1)]];
}
function versUrl(canvas) {
  return new Promise(res => {
    try { canvas.toBlob(b => res(b ? URL.createObjectURL(b) : canvas.toDataURL()), 'image/webp', .93); }
    catch (e) { res(canvas.toDataURL()); }
  });
}

/* Un visuel : { nom, reel, src (adresse pour <img>), image (pour drawImage), w, h, reperes }.
   Un fichier n'est demandé que si le manifeste porte son entrée (même vide) : un seul essai,
   en WebP, ou sous le nom donné par « fichier ». Sans entrée, le provisoire est peint, sans requête. */
const BOITE_SI_ABSENT = { telephone: 'corps', 'telephone-trois-quarts': 'corps', feuille: 'corps', 'feuille-dessin': 'corps' };
/* les visuels que le film lit à sa création (film.js) ; U1 (vingt et unième passe) : ici, pour que main.js puisse les demander
   avant que le script du film soit chargé */
/* W2 (vingt-troisième passe, 08/10/2026) : la colombe n'est posée qu'avec ?oiseau=1 (monde.js) : ses deux photos (4,3 Mo une fois
   décodées) ne sont plus chargées ni décodées pour rien le reste du temps */
const AVEC_OISEAU = (() => { try { return new URLSearchParams(location.search).get('oiseau') === '1'; } catch (e) { return false; } })();
export const NOMS_FILM = ['atelier-fond', 'atelier-table-seule', 'lampe-atelier', 'herbes', 'calade', 'telephone', 'telephone-trois-quarts', 'main-gauche-telephone', 'main-gauche-ouverte', 'lointain', 'sol-chemin', 'cypres-1', 'cypres-2', 'vigne-1', 'vigne-2', 'borne', 'poteau-planche', 'feuille', 'clou', 'main-droite-saisit', 'main-droite-feuille', 'atelier-facade-fermee', 'plaque-atelier', 'oiseau-planche', 'oiseau-pose', 'atelier-table', 'atelier-planche', 'feuille-dessin', 'crayon-dessine', 'main-crayon', 'main-souleve'].filter(n => AVEC_OISEAU || !n.startsWith('oiseau-'));
export function visuel(nom) {
  if (cache.has(nom)) return cache.get(nom);
  const pr = (async () => {
    const man = await lireManifeste();
    const defaut = MANIFESTE_DEFAUT[nom] || {};
    /* une image dérivée, annoncée dans l'entrée d'une autre (« atelier-facade-ouverte.webp : ... ») : même manifeste, sans entrée propre */
    const derivee = () => { for (const k in man) { const e = man[k]; if (e && typeof e === 'object') for (const c in e) if (typeof e[c] === 'string' && e[c].startsWith(nom + '.webp')) return { fichier: nom + '.webp', reperes: e }; } return null; };
    const entree = man[nom] || derivee();
    const im = entree ? await essayer(DOSSIER + (entree.fichier || nom + '.webp')) : null;
    if (im) {
      /* un fichier réel prend ses repères dans le manifeste ; ceux par défaut ne valent que pour le provisoire */
      const v = { nom, reel: true, src: im.src, image: im, w: im.naturalWidth, h: im.naturalHeight, reperes: Object.assign({}, entree) };
      const b = BOITE_SI_ABSENT[nom]; if (b && !entree[b]) v.reperes[b] = boiteAlpha(im);
      return v;
    }
    return provisoire(nom);
  })();
  cache.set(nom, pr);
  return pr;
}
/* la version provisoire d'un visuel (aussi le filet de secours quand un fichier réel fait échouer son module) */
const cacheProv = new Map();
export function provisoire(nom) {
  if (cacheProv.has(nom)) return cacheProv.get(nom);
  const pr = (async () => {
    const peindre = peintres[nom];
    if (!peindre) return null;
    const c = await peindre();
    const src = await versUrl(c);
    return { nom, reel: false, src, image: c, w: c.width, h: c.height, reperes: Object.assign({}, MANIFESTE_DEFAUT[nom] || {}, c.reperes || {}) };
  })();
  cacheProv.set(nom, pr);
  return pr;
}
/* les fichiers présents d'après le manifeste (pour le rapport et les essais) */
export async function presents() { const m = await lireManifeste(); return Object.keys(m).filter(k => k[0] !== '_'); }
export const visuelPret = nom => cache.get(nom);
export function precharger(chap) { return Promise.all(ATTENDUS[chap].map(visuel)); }

/* L'écriture de Thibaut (livrée le 02/10/2026) : l'encre (ecriture.webp), le moment d'apparition
   de chaque pixel (ecriture-temps.png, 16 bits : rouge = octet fort, vert = octet faible) et la
   trajectoire de la pointe (ecriture.json). Le temps est décodé une fois, puis étendu de trois pixels
   autour de l'encre, pour que les bords des traits apparaissent avec leur trait. */
let ecriture = null;
/* O4 (quinzième passe, 06/10/2026) : « T.H. », le second point. La phrase de Thibaut (ecriture.webp) s'arrête à « T.H » ;
   le point qui manque après le H est fait ici, en code (les images ne sont pas touchées) : c'est le point qui est entre le
   T et le H, recopié pixel pour pixel (même taille : 11 x 11 px, même forme, même encre, même densité ; mesuré : centre
   à x 2057,7, y 771,6, 77 px d'encre pleine), posé après le H à la même hauteur et au même espacement (le point d'origine
   est à 44,5 px du milieu du jambage du T et de celui du H ; le jambage droit du H est à x 2126,9 à cette hauteur : le
   nouveau centre est à x 2171,4, soit un décalage de 113,7 px). Il reçoit le dernier instant de l'écriture : les temps
   de toute la phrase sont resserrés d'un peu plus d'un centième (K), puis la pointe quitte le bas du H, saute (le même
   temps que les sauts de la phrase, 0,004) et écrit le point avec le rythme du point d'origine (ses propres temps,
   0,0095) ; il finit à 0,997 (le fondu du révélateur dure 0,004 : à la fin, tout est entièrement encré, le bas du H
   compris, qui restait jusqu'ici à moitié fondu sur ses deux derniers pixels). La trajectoire de la pointe
   (info.pointe) reçoit les mêmes temps et les points du saut et du point. Le son du crayon ne change pas (son.js a sa
   propre carte). Le point est une petite texture à part (48 x 40 px), dessinée avec la phrase (p8-page.js). */
export const POINT_TH = { src: [2032, 752, 48, 40], dx: 113.7, dy: 0, saut: .004, fin: .997 };
/* P4 (seizième passe) : t peut être une fonction (x, y) (la zone du point, rendue par l'ouvrier) ; encreZone : l'encre de la
   zone en pixels (sans redécoder toute l'image sur le fil principal) */
function secondPoint(info, encre, t, w, h, encreZone) {
  try {
    const [sx, sy, sw, sh] = POINT_TH.src;
    if (!info.taille || info.taille[0] !== w || sx + sw > w || sy + sh > h || !Array.isArray(info.pointe)) return null;
    const at = typeof t === 'function' ? t : (x, y) => t[y * w + x];
    /* les temps du point d'origine (sa zone ne contient que lui) */
    let t0 = 2, t1 = -1;
    for (let y = sy; y < sy + sh; y++) for (let x = sx; x < sx + sw; x++) { const v = at(x, y); if (v <= 1) { t0 = Math.min(t0, v); t1 = Math.max(t1, v); } }
    if (t1 < 0) return null;
    const dur = t1 - t0, K = POINT_TH.fin / (1 + POINT_TH.saut + dur), nouveau = v => (1 + POINT_TH.saut + (v - t0)) * K;
    /* l'encre du point : la même zone de l'image */
    const c = document.createElement('canvas'); c.width = sw; c.height = sh;
    if (encreZone) c.getContext('2d').putImageData(encreZone, 0, 0);
    else c.getContext('2d').drawImage(encre, sx, sy, sw, sh, 0, 0, sw, sh);
    /* son temps, et l'endroit où la pointe se pose en premier (les pixels qui paraissent les premiers) */
    const px = new Uint8Array(sw * sh * 4); let ax = 0, ay = 0, an = 0;
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      const v0 = at(sx + x, sy + y), j = y * sw + x, v = v0 > 1 ? 65535 : Math.round(nouveau(v0) * 65535);
      px[j * 4] = v >> 8; px[j * 4 + 1] = v & 255; px[j * 4 + 3] = 255;
      if (v0 <= t0 + dur * .15) { ax += x; ay += y; an++; }
    }
    const depart = an ? [(sx + ax / an + POINT_TH.dx) / w, (sy + ay / an + POINT_TH.dy) / h] : null;
    /* la trajectoire : les temps resserrés, puis le saut et le point (les échantillons du point d'origine, décalés) */
    const P = info.pointe.map(([tt, x, y]) => [tt * K, x, y]);
    const surPoint = info.pointe.filter(([tt]) => tt >= t0 && tt <= t1).map(([tt, x, y]) => [nouveau(tt), x + POINT_TH.dx / w, y + POINT_TH.dy / h]);
    if (depart) P.push([nouveau(t0), depart[0], depart[1]]);
    P.push(...surPoint);
    const der = P[P.length - 1];
    P.push([1, der[1], der[2]]);
    info.pointe = P;
    return { encre: c, temps: { w: sw, h: sh, px }, x0: sx + POINT_TH.dx, y0: sy + POINT_TH.dy, w: sw, h: sh, K, t0: nouveau(t0), t1: nouveau(t1) };
  } catch (e) { return null; }
}
export function ecritureReelle() {
  if (ecriture) return ecriture;
  ecriture = (async () => {
    try {
      const r = await fetch(DOSSIER + 'ecriture.json', { cache: 'no-cache' });
      if (!r.ok) return null;
      const info = await r.json();
      /* P4 (seizième passe) : le temps de chaque pixel (la relecture de l'image de 2174 x 833 et ses trois passes) est calculé
         par l'ouvrier (40 à 150 ms d'un bloc sur le fil principal) ; il rend aussi les pixels de l'encre, que l'ordinateur
         envoie par bandes à la carte graphique (p8-page.js). Sans ouvrier, le calcul d'avant */
      const abs = f => new URL(DOSSIER + f, location.href).href;
      const pEncre = essayer(DOSSIER + 'ecriture.webp');
      let ro = null;
      try { ro = await ouvrier('ecriture', { url: abs('ecriture-temps.png'), encre: TEL ? null : abs('ecriture.webp'), taille: info.taille, src: POINT_TH.src, saut: POINT_TH.saut, fin: POINT_TH.fin, pointe: Array.isArray(info.pointe) }); } catch (e) { ro = null; }
      if (ro) {
        const encre = await pEncre; if (!encre) return null;
        const [sx, sy, sw, sh] = POINT_TH.src, R = ro.region ? new Float32Array(ro.region) : null, E = ro.encre ? new Uint8ClampedArray(ro.encre) : null;
        let zone = null;
        if (E && sx + sw <= ro.ew && sy + sh <= ro.eh) { zone = new ImageData(sw, sh); for (let y = 0; y < sh; y++) zone.data.set(E.subarray(((sy + y) * ro.ew + sx) * 4, ((sy + y) * ro.ew + sx + sw) * 4), y * sw * 4); }
        const point = R ? secondPoint(info, encre, (x, y) => R[(y - sy) * sw + (x - sx)], ro.w, ro.h, zone) : null;
        if ((point ? point.K : 1) === ro.K) return { info, encre, temps: { w: ro.w, h: ro.h, px: new Uint8Array(ro.px) }, point, encrePx: E && ro.ew === encre.naturalWidth ? { w: ro.ew, h: ro.eh, data: E } : null };
      }
      const [encre, temps] = await Promise.all([pEncre, essayer(DOSSIER + 'ecriture-temps.png')]);
      if (!encre || !temps) return null;
      const w = temps.naturalWidth, h = temps.naturalHeight;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(temps, 0, 0);
      const d = g.getImageData(0, 0, w, h).data;
      let t = new Float32Array(w * h).fill(2);
      for (let i = 0, j = 0; j < w * h; i += 4, j++) if (d[i + 3] > 8) t[j] = (d[i] * 256 + d[i + 1]) / 65535;
      for (let passe = 0; passe < 3; passe++) {
        const s = t.slice();
        for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
          const j = y * w + x; if (t[j] <= 1) continue;
          const m = Math.min(t[j - 1], t[j + 1], t[j - w], t[j + w]); if (m <= 1) s[j] = m;
        }
        t = s;
      }
      /* O4 (quinzième passe) : le second point des initiales (« T.H. »), écrit en dernier */
      const point = secondPoint(info, encre, t, w, h);
      /* texture de données : rouge et vert portent le temps sur 16 bits, alpha plein */
      const px = new Uint8Array(w * h * 4);
      for (let j = 0; j < w * h; j++) { const v = t[j] > 1 ? 65535 : Math.round(t[j] * (point ? point.K : 1) * 65535); px[j * 4] = v >> 8; px[j * 4 + 1] = v & 255; px[j * 4 + 3] = 255; }
      return { info, encre, temps: { w, h, px }, point };
    } catch (e) { return null; }
  })();
  return ecriture;
}
