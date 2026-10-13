/* =====================================================================
   La façade de l'atelier (cinquième passe, E5 à E8). La façade est la
   photo portes fermées (atelier-facade-fermee.webp) ; tout s'y pose par
   la même homographie, à partir des repères du manifeste :
   - un voile de papier clair, découpé à la forme de la façade, fait la
     perspective atmosphérique (jamais l'opacité : la façade est opaque) ;
   - derrière les vantaux, l'intérieur est notre table (atelier-table),
     posée par l'atelier dans l'ouverture (voir atelier.js et l'entrée du
     plan 6) : l'image dérivée atelier-facade-ouverte.webp n'est pas
     utilisée, la table réelle tient mieux à toutes les distances ;
   - les deux vantaux, découpés dans l'image fermée, pivotent en 3D sur
     leurs gonds (vraie caméra du chemin) : verre légèrement translucide,
     ombrage qui change avec l'angle, reflet du ciel qui glisse sur les
     carreaux, ombre portée sur le seuil ;
   - la marche de pierre du seuil, posée sur le sol gravé ;
   - la plaque « Atelier Civik-ia », sur le linteau au-dessus de la
     porte (sixième passe, F6) : la pierre (plaque-atelier.webp, ou
     provisoire en code) et les lettres en creux posées par la page (SVG).
   Sans image fermée, la photo d'origine (portes ouvertes) reste posée,
   sans vantaux mobiles.
   J1 (dixième passe, 04/10/2026) : les portes ont un corps. Chaque vantail
   est un volume d'acier de 12 cm : sa face (la photo), sa tranche (acier
   satiné, arête claire côté lumière, joint de battement, têtière de la
   serrure), son dos (la même tôle, les petits bois du vitrage en relief) ;
   un soubassement de tôle en bas de chaque vantail, une barre de tirage
   sur chaque face, trois charnières sur le bâti ; le bâti d'acier a 17 cm
   de profondeur (le tableau de l'ouverture, avec son ombre) ; chaque
   vantail porte au sol (seuil, sol du dehors, sol de la pièce) l'ombre de
   son cadre et de ses petits bois, qui tourne avec lui. Fermées, de loin,
   elles se lisent comme des portes (soubassements, ligne de jour entre
   les deux vantaux, barres, charnières).
   ===================================================================== */
import { clamp, lerp, rng, bruit2, fbm, sseg, appl, inv3, m3d, epingle, setT, setO, setV, el } from './outils.js';
import { reperesPx } from './visuels.js';
import { planifier, pret, ouvrier } from './lavis.js';
import { plaqueEtapes, PLAQUE_CANEVAS, PLAQUE_DALLE, PLAQUE_ORIGINE } from './plaque.js';
import { TEL, liberer } from './memoire.js';

/* la plaque de pierre provisoire : calcaire pâle, bords usés, deux vis de laiton, ombre d'épaisseur (1065 x 672) */
function plaqueProvisoire() {
  const w = 1065, h = 672, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), R = rng(61), N = bruit2(67);
  const x0 = 34, y0 = 34, x1 = w - 52, y1 = h - 52;
  const forme = () => { g.beginPath(); const r = 24; g.moveTo(x0 + r, y0); g.quadraticCurveTo(x1 - 6, y0 - 3, x1, y0 + r); g.quadraticCurveTo(x1 + 3, y1 - r, x1 - r, y1); g.quadraticCurveTo(x0 + 10, y1 + 3, x0, y1 - r); g.quadraticCurveTo(x0 - 3, y0 + 12, x0 + r, y0); g.closePath(); };
  g.save(); g.translate(14, 18); forme(); g.fillStyle = 'rgba(120,104,80,.55)'; g.fill(); g.restore();
  forme(); g.fillStyle = '#e9dfc9'; g.fill();
  g.save(); forme(); g.clip();
  const im = g.getImageData(0, 0, w, h), d = im.data;
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
    const i = (y * w + x) * 4; if (d[i + 3] < 10) continue;
    const v = fbm(N, x / 150, y / 150, 4) - .5, gr = (R() - .5) * 14, lum = 1 - .1 * (x / w) - .08 * (y / h);
    d[i] = clamp((233 + v * 34 + gr) * lum, 0, 255); d[i + 1] = clamp((223 + v * 30 + gr) * lum, 0, 255); d[i + 2] = clamp((201 + v * 26 + gr) * lum, 0, 255);
  }
  g.putImageData(im, 0, 0);
  g.lineWidth = 9; g.strokeStyle = 'rgba(255,250,236,.35)'; forme(); g.stroke();
  g.restore();
  [[.0897, .171], [.9103, .171]].forEach(([u, v]) => {
    const x = u * w, y = v * h, r = 16, gg = g.createRadialGradient(x - 5, y - 5, 1, x, y, r); gg.addColorStop(0, '#e8cf8e'); gg.addColorStop(.6, '#a8843e'); gg.addColorStop(1, '#5f4a22');
    g.fillStyle = gg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(60,44,18,.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 10, y + 3); g.lineTo(x + 10, y - 3); g.stroke();
  });
  return c;
}
/* la façade nettoyée : les franges vertes du détourage (pixels de bord) ramenées au gris de leurs voisins */
function nettoyer(im, W, H) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, W, H);
  try {
    const d = g.getImageData(0, 0, W, H), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] === 0) continue;
      const m = Math.max(p[i], p[i + 2]);
      if (p[i + 1] > m + 6 && p[i + 3] < 250) { p[i + 1] = m; p[i + 3] = Math.round(p[i + 3] * .7); }
    }
    g.putImageData(d, 0, 0);
  } catch (e) { /* image d'une autre origine : on la garde telle quelle */ }
  return c;
}
/* les montants d'acier des vantaux, en fractions du vantail (relevés sur l'image fermée ; u depuis le bord gauche du vantail) */
const BARRES = {
  v: [[[0, .118], [.485, .54], [.92, 1]], [[0, .055], [.445, .49], [.875, 1]]],
  h: [[0, .033], [.23, .256], [.483, .503], [.735, .757], [.965, 1]]
};
const VERRE = .8;   /* opacité du verre des vantaux qui tournent : le paysage se devine au travers */
/* J1 : les mesures du corps des portes (m) et la lumière des portes (haut gauche, devant : la même que la plaque) ;
   axes : x vers la droite le long de la façade, y vers le haut, z vers nous */
/* K6 (onzième passe) : les vantaux ont 15 cm d'épaisseur (le haut de la fourchette de Thibaut : 12 cm ne se lisaient qu'à
   partir de 0,72) */
const E_PORTE = .15, PROF_BATI = .17, BATI_PX = 9;   /* épaisseur d'un vantail ; profondeur du tableau ; largeur du bâti dans l'image (px) */
const LP = (() => { const v = [-.5, .62, .6], n = Math.hypot(v[0], v[1], v[2]); return v.map(x => x / n); })();
const POIGNEE = { u: .956, haut: 1.4, bas: .7, recul: .064, r: .0135 };
const GONDS = [.19, 1.12, 2.03], GOND_H = .13, GOND_R = .017;
/* le soubassement de tôle de chaque vantail : la rangée basse de carreaux, entre les montants (fractions du vantail) */
const SOUB = side => [BARRES.v[side][0][1], BARRES.v[side][2][0], BARRES.h[3][1], BARRES.h[4][0]];
const sat = (v, a = 0, b = 255) => v < a ? a : v > b ? b : v;
/* J1 : de la tôle d'acier sombre satinée, un peu de calamine (marbrures bleutées et chaudes), brossée dans le sens
   donné ; lum règle sa clarté. Calculée une fois, petite. */
/* P4 (seizième passe) : la tôle se calcule aussi par bandes de rangées (toleEtapes, le même tirage dans le même ordre) : le dos
   d'un vantail prenait 6 à 14 ms d'un bloc */
function tole(w, h, graine, sens = 'x', lum = 1) { const o = {}; for (const _ of toleEtapes(w, h, graine, sens, lum, o)) { /* rien */ } return o.c; }
function* toleEtapes(w, h, graine, sens = 'x', lum = 1, sortie = {}, rangs = 1e9) {
  const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h);
  const g = c.getContext('2d'), im = g.createImageData(c.width, c.height), d = im.data;
  const N = bruit2(graine), N2 = bruit2(graine + 7), R = rng(graine + 13);
  for (let y = 0; y < c.height; y++) { if (y && y % rangs === 0) yield; for (let x = 0; x < c.width; x++) {
    const i = (y * c.width + x) * 4;
    const m = fbm(N, x / 23, y / 23, 3) - .5;
    const b = sens === 'x' ? fbm(N2, x / 70, y / 1.3, 2) - .5 : fbm(N2, x / 1.3, y / 70, 2) - .5;
    const l = (44 + m * 15 + b * 11 + (R() - .5) * 5) * lum;
    const bleu = clamp(-m * 3) * 5, chaud = clamp(m * 3) * 4;
    d[i] = sat(l + chaud - bleu * .4); d[i + 1] = sat(l + chaud * .45); d[i + 2] = sat(l + bleu - chaud * .5); d[i + 3] = 255;
  } }
  g.putImageData(im, 0, 0);
  sortie.c = c;
}
/* J1 : les soubassements de tôle, peints dans l'image fermée (de loin, le bas des portes est plus sombre : on lit des
   portes et non du vitrage), avec leur cadre : ombre portée des montants en haut et à gauche, filet de lumière en bas
   et à droite ; la ligne de jour entre les deux vantaux (un trait d'ombre net) */
function corpsFerme(image, quads) {
  const g = image.getContext('2d');
  quads.forEach(({ fx0, fy0, w, h, side }) => {
    const [u0, u1, v0, v1] = SOUB(side), x = Math.round(fx0 + u0 * w), y = Math.round(fy0 + v0 * h), pw = Math.round((u1 - u0) * w), ph = Math.round((v1 - v0) * h);
    /* K6 : la tôle plus sombre que le vitrage, pour que le bas des portes se lise de loin */
    g.drawImage(tole(pw, ph, 731 + side, 'x', .72), x, y);
    const gr = g.createLinearGradient(0, y, 0, y + ph); gr.addColorStop(0, 'rgba(255,248,236,.05)'); gr.addColorStop(.6, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,8,6,.22)');
    g.fillStyle = gr; g.fillRect(x, y, pw, ph);
    g.fillStyle = 'rgba(8,8,8,.55)'; g.fillRect(x, y, pw, 2); g.fillRect(x, y, 2, ph);
    g.fillStyle = 'rgba(214,206,190,.28)'; g.fillRect(x, y + ph - 1, pw, 1); g.fillRect(x + pw - 1, y, 1, ph);
    /* le petit bois du milieu ne descend plus dans la tôle : une moulure fine à sa place, en relief */
    g.fillStyle = 'rgba(200,192,176,.12)'; g.fillRect(x + 4, y + Math.round(ph * .5), pw - 8, 1);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 4, y + Math.round(ph * .5) + 1, pw - 8, 1);
  });
  /* la ligne de jour : le jeu entre les deux vantaux */
  /* K6 : la ligne de jour plus franche (2 px de jeu, le chant clair du vantail de droite à côté) */
  if (quads.length === 2) { const xm = Math.round((quads[0].fx0 + quads[0].w + quads[1].fx0) / 2) - 1, y0 = quads[0].fy0, h = quads[0].h; g.fillStyle = 'rgba(4,4,4,.92)'; g.fillRect(xm - .3, y0 + 4, 2, h - 6); g.fillStyle = 'rgba(200,194,180,.32)'; g.fillRect(xm + 1.7, y0 + 4, 1, h - 6); }
}
/* J1 : le dos d'un vantail (le dedans, visible quand il est très ouvert) : la même tôle sombre, les petits bois du
   vitrage en relief (le côté qui regarde la lumière s'éclaire, leur ombre tombe sur le verre), le verre qui renvoie le
   ciel et laisse deviner le vitrage derrière. Dans les coordonnées de la texture du vantail : vu de dos, le côté +x des
   petits bois regarde la lumière, pour les deux vantaux. */
function dosVantail(w, h, side, opaque) { const o = {}; for (const _ of dosEtapes(w, h, side, opaque, o)) { /* rien */ } return o.c; }
function* dosEtapes(w, h, side, opaque, sortie = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const ciel = g.createLinearGradient(0, 0, 0, h); ciel.addColorStop(0, 'rgba(214,224,236,.6)'); ciel.addColorStop(.45, 'rgba(196,204,212,.5)'); ciel.addColorStop(.7, 'rgba(150,146,138,.5)'); ciel.addColorStop(1, 'rgba(120,114,104,.55)');
  g.fillStyle = ciel; g.fillRect(0, 0, w, h);
  /* un reflet doux en biais */
  const rf = g.createLinearGradient(0, 0, w, h * .6); rf.addColorStop(.25, 'rgba(255,255,255,0)'); rf.addColorStop(.45, 'rgba(255,255,255,.16)'); rf.addColorStop(.6, 'rgba(255,255,255,0)');
  g.fillStyle = rf; g.fillRect(0, 0, w, h);
  const ot = {}; yield* toleEtapes(w, h, 977 + side, 'y', 1.05, ot, 24); const acier = ot.c; yield;
  const barres = [], [s0, s1, t0, t1] = SOUB(side);
  /* les petits bois verticaux du milieu s'arrêtent au soubassement ; les montants vont jusqu'en bas */
  BARRES.v[side].forEach(([a, b], i) => barres.push([Math.floor(a * w), 0, Math.ceil((b - a) * w), i === 1 ? Math.floor(t0 * h) : h, 'v']));
  BARRES.h.forEach(([a, b]) => barres.push([0, Math.floor(a * h), w, Math.ceil((b - a) * h), 'h']));
  barres.push([Math.floor(s0 * w), Math.floor(t0 * h), Math.ceil((s1 - s0) * w), Math.ceil((t1 - t0) * h), 'p']);
  /* l'ombre des petits bois sur le verre (côté -x et dessous) */
  g.fillStyle = 'rgba(10,10,12,.32)';
  barres.forEach(([x, y, bw, bh, t]) => { if (t === 'v') g.fillRect(x - 3, y, 3, bh); else if (t === 'h') g.fillRect(x, y + bh, bw, 3); });
  g.save(); g.beginPath(); barres.forEach(([x, y, bw, bh]) => g.rect(x, y, bw, bh)); g.clip(); g.drawImage(acier, 0, 0); g.restore();
  /* le relief : le côté qui regarde la lumière (+x, haut) s'éclaire, l'autre se creuse */
  barres.forEach(([x, y, bw, bh, t]) => {
    if (t === 'v') { g.fillStyle = 'rgba(232,226,214,.3)'; g.fillRect(x + bw - 2, y, 1.4, bh); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, y, 1.2, bh); }
    else if (t === 'h') { g.fillStyle = 'rgba(232,226,214,.26)'; g.fillRect(x, y, bw, 1.3); g.fillStyle = 'rgba(0,0,0,.32)'; g.fillRect(x, y + bh - 1.2, bw, 1.2); }
    else { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x, y, bw, 2); g.fillStyle = 'rgba(232,226,214,.2)'; g.fillRect(x, y + bh - 1, bw, 1); g.fillRect(x + bw - 1, y, 1, bh); }
  });
  sortie.c = c;
}
/* J1 : la tranche, en acier satiné brossé dans la longueur (texture étroite, étirée sur la hauteur du vantail) */
function trancheTex() {
  const w = 40, h = 512, c = tole(w, h, 4411, 'y', 1.15), g = c.getContext('2d');
  /* le joint de battement, noir, au tiers de l'épaisseur côté face */
  g.fillStyle = 'rgba(6,6,6,.85)'; g.fillRect(Math.round(w * .3), 0, 3, h);
  g.fillStyle = 'rgba(70,70,70,.5)'; g.fillRect(Math.round(w * .3) + 3, 0, 1, h);
  return c;
}
/* J1 : l'ombre d'un vantail au sol : son cadre, ses petits bois et son soubassement opaques, le verre qui laisse passer
   presque toute la lumière (un voile léger) */
function masqueOmbre(w, h, side) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  /* K6 : la lumière qui passe par le verre est un peu plus faible (le verre ombre aussi) */
  g.fillStyle = 'rgba(28,22,16,.3)'; g.fillRect(0, 0, w, h); g.fillStyle = '#1c1610';
  BARRES.v[side].forEach(([a, b]) => g.fillRect(Math.floor(a * w), 0, Math.ceil((b - a) * w), h));
  BARRES.h.forEach(([a, b]) => g.fillRect(0, Math.floor(a * h), w, Math.ceil((b - a) * h)));
  const [s0, s1, t0, t1] = SOUB(side); g.fillRect(Math.floor(s0 * w), Math.floor(t0 * h), Math.ceil((s1 - s0) * w), Math.ceil((t1 - t0) * h));
  /* la pénombre, floutée une fois ici (et non plus par un filtre à chaque image) */
  const b = document.createElement('canvas'); b.width = w; b.height = h; const bg = b.getContext('2d'); bg.filter = 'blur(2px)'; bg.drawImage(c, 0, 0);
  return b;
}
/* I2 : les carreaux de la façade, relevés sur l'image fermée (fractions de l'image) : colonnes entre les montants,
   rangées entre les traverses ; la porte a ses propres carreaux (les vantaux) */
const COLONNES = [[.0995, .1614], [.1653, .2272], [.2311, .293], [.2976, .3573], [.3673, .4308], [.4346, .4973], [.5019, .5647], [.5692, .632], [.6419, .7024], [.707, .7674], [.772, .8332], [.8378, .8982]];
const RANGEES = [[.1804, .3117], [.3228, .4794], [.4889, .6725], [.682, .8133], [.8228, .965]];
const PORTE_COL = [[.3771, .429], [.4368, .4906], [.5096, .5639], [.5702, .6238]], PORTE_RANG = [[.3447, .4756], [.4929, .6438], [.657, .8112], [.8258, .964]];
function carreaux() {
  const L = [];
  COLONNES.forEach(([a, b], i) => RANGEES.forEach(([c, d], j) => { if (j === 0 || i < 4 || i > 7) L.push({ x0: a, x1: b, y0: c, y1: d, haut: j < 2, porte: false }); }));
  /* J1 : la rangée basse de la porte est un soubassement de tôle (plus de verre) */
  PORTE_COL.forEach(([a, b]) => PORTE_RANG.slice(0, 3).forEach(([c, d]) => L.push({ x0: a, x1: b, y0: c, y1: d, haut: false, porte: true })));
  return L;
}

export function creerFacade(racine, vf, vPlaque, kF, vLampe) {
  const W = vf.w, H = vf.h;
  const P = reperesPx(vf, 'porte');
  const x0 = Math.min(P[0][0], P[3][0]), x1 = Math.max(P[1][0], P[2][0]), y0 = Math.min(P[0][1], P[1][1]), y1 = Math.max(P[2][1], P[3][1]);
  const hh = y1 - y0, lw = (x1 - x0) / 2;
  const sol = (vf.reperes.sol || y1 / H) * H;
  const mobiles = !!(vf.reel && vf.reperes.vantail_gauche && vf.reperes.vantail_droit);

  /* ---- la façade elle-même (canevas nettoyé) ---- */
  const image = nettoyer(vf.image, W, H); image.className = 'ep facade-img'; image.setAttribute('aria-hidden', 'true');
  image.style.width = W + 'px'; image.style.height = H + 'px';

  /* ---- les vantaux : opaque, et verre translucide (montants pleins) ---- */
  const quadsV = !mobiles ? [] : ['vantail_gauche', 'vantail_droit'].map((n, side) => {
    const q = reperesPx(vf, n);
    const fx0 = Math.round(Math.min(q[0][0], q[3][0])), fx1 = Math.round(Math.max(q[1][0], q[2][0])), fy0 = Math.round(Math.min(q[0][1], q[1][1])), fy1 = Math.round(Math.max(q[2][1], q[3][1]));
    return { side, fx0, fy0, fy1, w: fx1 - fx0, h: fy1 - fy0 };
  });
  /* J1 : fermées, elles se lisent déjà comme des portes (soubassements de tôle, ligne de jour) */
  if (mobiles) corpsFerme(image, quadsV);
  const TRANCHE = mobiles ? trancheTex() : null;
  const feuilles = quadsV.map(({ side, fx0, fy0, fy1, w, h }) => {
    const opaque = document.createElement('canvas'); opaque.width = w; opaque.height = h; opaque.getContext('2d').drawImage(image, fx0, fy0, w, h, 0, 0, w, h);
    const verre = document.createElement('canvas'); verre.width = w; verre.height = h;
    const gv = verre.getContext('2d');
    gv.fillStyle = `rgba(0,0,0,${VERRE})`; gv.fillRect(0, 0, w, h); gv.fillStyle = '#000';
    BARRES.v[side].forEach(([a, b]) => gv.fillRect(Math.floor(a * w), 0, Math.ceil((b - a) * w), h));
    BARRES.h.forEach(([a, b]) => gv.fillRect(0, Math.floor(a * h), w, Math.ceil((b - a) * h)));
    /* J1 : le soubassement de tôle est plein */
    const sb = SOUB(side), rs = [Math.floor(sb[0] * w), Math.floor(sb[2] * h), Math.ceil((sb[1] - sb[0]) * w), Math.ceil((sb[3] - sb[2]) * h)];
    gv.fillRect(...rs);
    const translu = document.createElement('canvas'); translu.width = w; translu.height = h;
    const gt = translu.getContext('2d'); gt.drawImage(opaque, 0, 0); gt.globalCompositeOperation = 'destination-in'; gt.drawImage(verre, 0, 0);
    /* F7 : ouvert, le vantail ne montre plus l'intérieur de l'image fermée : ses vitres renvoient ce qui est derrière le
       spectateur (le ciel clair, la gravure des collines), et laissent voir au travers ; les montants d'acier restent */
    const reflet = document.createElement('canvas'); reflet.width = w; reflet.height = h;
    {
      const gr = reflet.getContext('2d');
      const ciel = gr.createLinearGradient(0, 0, 0, h); ciel.addColorStop(0, 'rgba(226,234,244,.62)'); ciel.addColorStop(.42, 'rgba(232,236,238,.5)'); ciel.addColorStop(.62, 'rgba(214,212,206,.42)'); ciel.addColorStop(1, 'rgba(196,192,184,.38)');
      gr.fillStyle = ciel; gr.fillRect(0, 0, w, h);
      /* la gravure des collines, très claire, en reflet : quelques lignes de crête et des hachures */
      gr.strokeStyle = 'rgba(86,92,128,.22)'; gr.lineWidth = 1;
      for (let l = 0; l < 4; l++) { const y0c = h * (.5 + l * .06); gr.beginPath(); for (let x = 0; x <= w; x += 4) { const y = y0c + Math.sin(x / (18 + l * 7) + l * 2 + side) * 5; x ? gr.lineTo(x, y) : gr.moveTo(x, y); } gr.stroke(); }
      gr.strokeStyle = 'rgba(86,92,128,.12)'; for (let x = 0; x < w; x += 3) { gr.beginPath(); gr.moveTo(x, h * .62); gr.lineTo(x + 2, h * .7); gr.stroke(); }
      /* les montants, pris dans l'image (J1 : et le soubassement) */
      gr.save(); gr.beginPath();
      BARRES.v[side].forEach(([a, b]) => gr.rect(Math.floor(a * w), 0, Math.ceil((b - a) * w), h));
      BARRES.h.forEach(([a, b]) => gr.rect(0, Math.floor(a * h), w, Math.ceil((b - a) * h)));
      gr.rect(...rs);
      gr.clip(); gr.clearRect(0, 0, w, h); gr.drawImage(opaque, 0, 0); gr.restore();
    }
    const travail = document.createElement('canvas'); travail.width = w; travail.height = h;
    const charn = (side ? vf.reperes.charniere_droite : vf.reperes.charniere_gauche) * W;
    /* J1 : le dos (calculé pendant les temps morts, ou à la première demande) et le masque de l'ombre portée */
    const f = { side, w, h, fy0, fy1, opaque, translu, reflet, travail, charn, dos: null, ombre: masqueOmbre(w, h, side), verreM: verre };
    f.faireDos = () => f.dos || (f.dos = dosVantail(w, h, side, opaque));
    f.faireDosEtapes = function* () { if (f.dos) return; const o = {}; yield* dosEtapes(w, h, side, opaque, o); if (!f.dos) f.dos = o.c; };
    return f;
  });
  if (feuilles.length) setTimeout(() => planifier({ nom: 'dos', gen: (function* () { for (const f of feuilles) { yield* f.faireDosEtapes(); yield; } })() }), 2500);
  /* J1 : ouverts à 115 degrés, et non plus rabattus contre le vitrage (149 degrés) : de chant, un vantail de 12 cm
     montrait à peine sa tranche ; ainsi ils se tiennent devant la façade comme deux battants d hacienda */
  const TH_MAX = Math.PI * .64;

  /* ---- la marche de pierre : une texture prise sur le pilier de la façade ---- */
  const pierre = document.createElement('canvas'); pierre.width = 256; pierre.height = 64;
  {
    const g = pierre.getContext('2d'), sx = W * .025, sy = H * .55, sw = W * .06, sh = H * .2;
    g.drawImage(image, sx, sy, sw, sh, 0, 0, 128, 64); g.save(); g.translate(256, 0); g.scale(-1, 1); g.drawImage(image, sx, sy, sw, sh, 0, 0, 128, 64); g.restore();
    g.fillStyle = 'rgba(236,226,206,.42)'; g.fillRect(0, 0, 256, 64);
  }

  /* ---- les éléments DOM ---- */
  const voile = el(`<div class="ep facade-voile" style="width:${W}px;height:${H}px"></div>`);
  voile.style.webkitMaskImage = voile.style.maskImage = `url("${vf.src}")`;
  voile.style.webkitMaskSize = voile.style.maskSize = '100% 100%';
  /* H5 (huitième passe) : la plaque n'est plus sur le linteau de verre. C'est une dalle de calcaire scellée à fleur dans
     le pilier de pierre de gauche (x 0,017 à 0,096 de l'image, depuis y 0,10), dans son tiers haut, sous le débord du
     toit, centrée sur la largeur du pilier et large de 85 % de cette largeur ; un joint de mortier fin l'entoure. Les
     lettres sont gravées dans la pierre (plaque.js) ; mêmes homographie et échelle que la façade. */
  const [PW, PH] = PLAQUE_CANEVAS, [DW, DH] = PLAQUE_DALLE, [OX, OY] = PLAQUE_ORIGINE;
  /* J4 : le canevas déborde la dalle (sa tranche et son ombre, en bas et à droite) : on pose la dalle, et non le canevas,
     au centre du pilier */
  const pil = [.017 * W, .096 * W], ks = (pil[1] - pil[0]) * .85 / DW, pw = PW * ks, ph = PH * ks;
  const pq = [(pil[0] + pil[1]) / 2, H * .215], po = [pq[0] - (OX + DW / 2) * ks, pq[1] - (OY + DH / 2) * ks];
  /* le ton du pilier (moyenne des moellons) pour accorder la pierre de la dalle */
  let ton = null;
  try { const gi = image.getContext('2d', { willReadFrequently: true }), dd = gi.getImageData(Math.round(pil[0] + 6), Math.round(H * .3), Math.round(pil[1] - pil[0] - 12), Math.round(H * .5)).data; let m = [0, 0, 0], nn = 0; for (let i = 0; i < dd.length; i += 4) if (dd[i + 3] > 200) { m[0] += dd[i]; m[1] += dd[i + 1]; m[2] += dd[i + 2]; nn++; } if (nn) ton = m.map(v => v / nn); } catch (e) { /* sans lecture : la photo telle quelle */ }
  const pierrePlaque = vPlaque && vPlaque.reel ? vPlaque.image : plaqueProvisoire();
  const plaque = el(`<div class="ep plaque-atelier" role="img" aria-label="Atelier Civik-ia" style="width:${PW}px;height:${PH}px"></div>`);
  /* J4 : la gravure et le vieillissement de la dalle (environ 0,3 s de calcul) ne sont plus sur le chemin du démarrage :
     ils se font par petites tâches pendant les temps morts, et la plaque paraît (fondu de 0,4 s) quand elle est prête */
  const sortiePlaque = {};
  /* démarrage : la plaque ne commence qu'1,5 s après la création (jamais pendant le démarrage) */
  /* M4 (treizième passe) : la plaque préparée (c-film/prets/plaque.webp), si ses sources n'ont pas changé, remplace le
     calcul (296 étapes : sur iPhone, elle n'était pas prête à l'arrivée) */
  const montrerPlaque = cPlaque => {
    cPlaque.setAttribute('aria-hidden', 'true'); cPlaque.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity .4s';
    plaque.appendChild(cPlaque); requestAnimationFrame(() => { cPlaque.style.opacity = '1'; });
  };
  const tachePlaque = { nom: 'plaque', gen: plaqueEtapes(pierrePlaque, ton, sortiePlaque), apres: () => { if (sortiePlaque.c) montrerPlaque(sortiePlaque.c); } };
  pret('plaque').then(r => {
    if (!r || tachePlaque.fini || r.im.naturalWidth !== PW) return; tachePlaque.fini = true;
    /* recopiée dans un canevas, comme la plaque calculée (même rendu sous la perspective de la façade) */
    /* P2 (seizième passe) : la recopie se faisait dès l'arrivée de l'image, juste après la première image du film ; elle passe
       par la file des préparations (besoin 0,66 : la plaque ne se voit qu'à l'approche de l'atelier) */
    planifier({ nom: 'plaque-prete', besoin: .66, gen: (function* () { yield; const c = document.createElement('canvas'); c.width = r.im.naturalWidth; c.height = r.im.naturalHeight; c.getContext('2d').drawImage(r.im, 0, 0); montrerPlaque(c); })() });
  });
  setTimeout(() => { if (!tachePlaque.fini) planifier(tachePlaque); }, 1500);
  racine.append(image, plaque, voile);
  const tous = [image, plaque, voile];

  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a).toFixed(3)})`;
  let kCourant = 0;
  /* K11 (onzième passe) : notre atelier derrière la porte dès le début. La pièce n'est plus celle de la photo de façade :
     c'est la photo de la table (atelier-table), posée par l'atelier comme un plan à 3 m derrière la façade, sous elle.
     Par le vitrage, la façade devient transparente là où le masque de J10 voit l'intérieur (verre sombre) et reste
     opaque là où elle renvoie le ciel, avec un voile de verre (teinte froide, environ 18 % plus sombre) ; à l'ouverture, elle
     est percée quand les vantaux s'ouvrent. Actif dès que l'atelier le demande (K11.actif). */
  const K11 = { actif: false };
  const OUV = [x0 + BATI_PX, y0, x1 - BATI_PX, sol];
  const TROU = `polygon(evenodd, 0px 0px, ${W}px 0px, ${W}px ${H}px, 0px ${H}px, 0px 0px, ${OUV[0].toFixed(1)}px ${OUV[1].toFixed(1)}px, ${OUV[2].toFixed(1)}px ${OUV[1].toFixed(1)}px, ${OUV[2].toFixed(1)}px ${OUV[3].toFixed(1)}px, ${OUV[0].toFixed(1)}px ${OUV[3].toFixed(1)}px, ${OUV[0].toFixed(1)}px ${OUV[1].toFixed(1)}px)`;
  /* le rectangle du vitrage, dans l'image (la pièce y est découpée) */
  const VITRAGE = [[.0995 * W, .1804 * H], [.8982 * W, .1804 * H], [.8982 * W, Math.max(.965 * H, sol)], [.0995 * W, Math.max(.965 * H, sol)]];
  /* I2 : l'état de la lampe, posé par le monde à chaque image */
  const lampeEtat = { I: 0, col: [255, 212, 150] };
  /* Hm : l'homographie image -> écran ; o.brume (0 à 1) ; o.k : ouverture des portes (0 fermées, 1 ouvertes) */
  function placer(Hm, o) {
    if (!Hm) { tous.forEach(e => setV(e, false)); return; }
    const k = mobiles ? clamp(o.k) : 0; kCourant = k;
    const map = q => q.map(([x, y]) => appl(Hm, x, y));
    setV(image, true); setT(image, m3d(Hm)); setO(image, 1);
    /* K11 : porte ouverte, l'image de la façade est percée à l'ouverture (dans le bâti) : la pièce, posée derrière la
       façade, s'y voit sans verre ; fermée, les vantaux de l'image (et leur vitrage) restent */
    const trou = K11.actif && mobiles && k > .0005 ? TROU : 'none';
    if (image._clip !== trou) { image._clip = trou; image.style.clipPath = trou; }
    setV(voile, (o.brume || 0) > .002); setT(voile, m3d(Hm)); setO(voile, o.brume || 0);
    setV(plaque, true); setT(plaque, epingle(PW, PH, map([[po[0], po[1]], [po[0] + pw, po[1]], [po[0] + pw, po[1] + ph], [po[0], po[1] + ph]])));
  }

  /* La marche du seuil, l'ombre des vantaux, les vantaux : dessinés sur le canevas de devant (coordonnées écran),
     avec la vraie caméra. pj(x, y, z) : point de l'image (px), avancé de z mètres vers nous -> écran, ou null. */
  const MARCHE = { h: .07, p: .42, deb: .2 };
  function devant(c, pj, alpha) {
    if (alpha <= .01) return;
    const k = kCourant, yM = sol - MARCHE.h / kF, xa = x0 - MARCHE.deb / kF, xb = x1 + MARCHE.deb / kF;
    /* J1 : porte ouverte, l'ombre des vantaux sur le sol de la pièce, puis le tableau de l'ouverture (le bâti d'acier
       en profondeur et son ombre dans la pièce), sous la marche et les vantaux */
    if (mobiles && kCourant > .0005) { feuilles.forEach(f => ombreSol(c, pj, f, TH_MAX * kCourant, kCourant, alpha, true)); tableau(c, pj, alpha, kCourant); }
    /* la marche : dessus clair, nez plus sombre, ombre de contact, trait gravé */
    const A = pj(xa, yM, MARCHE.p), B = pj(xb, yM, MARCHE.p), C = pj(xb, yM, 0), D = pj(xa, yM, 0), A0 = pj(xa, sol, MARCHE.p), B0 = pj(xb, sol, MARCHE.p);
    const A1 = pj(xa, sol, MARCHE.p + .18), B1 = pj(xb, sol, MARCHE.p + .18);
    if (A && B && C && D && A0 && B0) {
      c.save(); c.globalAlpha = alpha;
      if (A1 && B1) {
        const gs = c.createLinearGradient(0, A0[1], 0, A1[1] + 1); gs.addColorStop(0, 'rgba(46,38,30,.32)'); gs.addColorStop(1, 'rgba(46,38,30,0)');
        c.fillStyle = gs; c.beginPath(); c.moveTo(A0[0], A0[1]); c.lineTo(B0[0], B0[1]); c.lineTo(B1[0], B1[1]); c.lineTo(A1[0], A1[1]); c.closePath(); c.fill();
      }
      const motif = c.createPattern(pierre, 'repeat');
      /* le dessus : la pierre, en perspective (affine sur le quadrilatère, assez juste à cette taille) */
      const sx = Math.hypot(B[0] - A[0], B[1] - A[1]) / 256, sy = Math.hypot(D[0] - A[0], D[1] - A[1]) / 64;
      motif.setTransform(new DOMMatrix([(B[0] - A[0]) / 256, (B[1] - A[1]) / 256, (D[0] - A[0]) / 64, (D[1] - A[1]) / 64, A[0], A[1]]));
      c.fillStyle = motif; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.lineTo(C[0], C[1]); c.lineTo(D[0], D[1]); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,246,226,.14)'; c.fill();
      /* I2 : la lampe allumée réchauffe le dessus de la marche (plus franchement quand la porte est ouverte) */
      if (lampeEtat.I > .002) { c.fillStyle = rgba(lampeEtat.col, (.12 + .2 * k) * lampeEtat.I); c.fill(); }
      /* le nez de la marche */
      motif.setTransform(new DOMMatrix([(B[0] - A[0]) / 256, (B[1] - A[1]) / 256, 0, Math.max(.05, (A0[1] - A[1]) / 64), A[0], A[1]]));
      c.fillStyle = motif; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.lineTo(B0[0], B0[1]); c.lineTo(A0[0], A0[1]); c.closePath(); c.fill();
      c.fillStyle = 'rgba(52,42,30,.34)'; c.fill();
      /* les traits gravés : l'arête du nez et le pied */
      const ep = clamp(Math.hypot(B[0] - A[0], B[1] - A[1]) / 260, .6, 2);
      c.strokeStyle = 'rgba(43,38,32,.7)'; c.lineWidth = ep; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.moveTo(A0[0], A0[1]); c.lineTo(B0[0], B0[1]); c.moveTo(A[0], A[1]); c.lineTo(A0[0], A0[1]); c.moveTo(B[0], B[1]); c.lineTo(B0[0], B0[1]); c.stroke();
      c.strokeStyle = 'rgba(43,38,32,.35)'; c.lineWidth = ep * .6; c.beginPath(); c.moveTo(D[0], D[1]); c.lineTo(C[0], C[1]); c.stroke();
      c.restore();
    }
    if (!mobiles) return;
    const th = TH_MAX * k;
    if (k > .0005) {
      /* J1 : l'ombre des vantaux sur le sol du dehors et sur la marche (elle tourne avec eux) */
      feuilles.forEach(f => ombreSol(c, pj, f, th, k, alpha, false));
      feuilles.forEach(f => vantail(c, pj, f, th, k, alpha));
    } else feuilles.forEach(f => poignee(c, pj, f, 1, 0, 0, alpha));
    gonds(c, pj, alpha);
  }
  /* ---- J1 : les vantaux en volume ---- */
  const EPX = E_PORTE / kF;
  const dl = n => n[0] * LP[0] + n[1] * LP[1] + n[2] * LP[2];
  const eclaire = d => (.32 + .68 * Math.max(0, d)) / (.32 + .68 * LP[2]);   /* clarté relative à la face fermée (photo) */
  const croix = (A, B, C) => (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
  /* un point du vantail : u de la charnière (0) au bord libre (1), s de la face (0) au dos (1), y dans l'image ; (dx, dy,
     dz) : un décalage en mètres (x à droite, y en haut, z vers nous) */
  const ptV = (pj, f, ct, st, u, s, y, dx = 0, dy = 0, dz = 0) => { const dir = f.side ? -1 : 1; return pj(f.charn + dir * (u * f.w * ct + s * EPX * st) + dx / kF, y - dy / kF, u * f.w * kF * st - s * E_PORTE * ct + dz); };
  /* une texture posée sur une face du vantail (s fixé), en bandes verticales projetées par la caméra. J1 : les bandes
     sont peintes sur un canevas à part, chacune dans sa découpe élargie d'un demi-pixel, en mode « copie » : là où deux
     bandes se touchent, la seconde remplace la première au lieu de s'y ajouter. Le verre, translucide, ne montre plus de
     filets verticaux plus sombres (l'ancien recouvrement doublait son opacité tous les 8 px : un verre « cannelé »). */
  const tmp = document.createElement('canvas'), tg = tmp.getContext('2d');
  /* P27, voie (d) (12/10/2026) : la face posée colonne par colonne de pixels du canevas. Les verticales du vantail tombent
     verticales à l'écran (pas de tangage ni de roulis de la caméra) : chaque colonne de pixels du canevas montre une seule colonne
     de la texture, u(x), qui est projective en x (calculée exactement sur trois points du bord haut : u = 0, 1/2, 1) ; le haut
     et le bas de la colonne suivent les rails, droits à l'écran. Un drawImage par colonne, sans découpe ni transformation : ni
     marche, ni coude, ni couture ; seules les colonnes dans l'écran sont posées. */
  function poserFace(c, pj, f, ct, st, s, tex, N, alpha = 1) {
    const { side, w, h, fy0, fy1 } = f, m = c.getTransform(), K = m.a;
    const P = [0, .5, 1].map(u => [ptV(pj, f, ct, st, u, s, fy0), ptV(pj, f, ct, st, u, s, fy1)]);
    if (P.some(q => !q[0] || !q[1])) return;
    const X = P.map(q => q[0][0] * K), YT = P.map(q => q[0][1] * K), YB = P.map(q => q[1][1] * K);
    if (Math.abs(X[2] - X[0]) < .5) return;
    /* u(x) = (a x + b) / (g x + 1), par les trois points (x, u) : (X0, 0), (X1, 1/2), (X2, 1) */
    const U = [0, .5, 1], Mx = [0, 1, 2].map(i => [X[i], 1, -U[i] * X[i]]);
    const det = M => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
    const D = det(Mx); if (!D) return;
    const col = (M, j, v) => M.map((r, i) => r.map((x, k) => (k === j ? v[i] : x)));
    const a = det(col(Mx, 0, U)) / D, b = det(col(Mx, 1, U)) / D, g = det(col(Mx, 2, U)) / D;
    const uDe = x => (a * x + b) / (g * x + 1);
    const pente = (Y) => (Y[2] - Y[0]) / (X[2] - X[0]);
    const pt = pente(YT), pb = pente(YB), yt = x => YT[0] + (x - X[0]) * pt, yb = x => YB[0] + (x - X[0]) * pb;
    const xmin = Math.min(X[0], X[2]), xmax = Math.max(X[0], X[2]);
    const W = c.canvas.width, H = c.canvas.height;
    const x0 = Math.max(0, Math.floor(xmin)), x1 = Math.min(W, Math.ceil(xmax));
    if (x1 <= x0) return;
    const ys = [yt(x0), yt(x1), yb(x0), yb(x1)];
    const bx = x0, by = Math.max(0, Math.floor(Math.min(...ys)) - 1), bw = x1 - x0, bh = Math.min(H, Math.ceil(Math.max(...ys)) + 1) - by;
    if (bw <= 0 || bh <= 0) return;
    if (tmp.width < bw || tmp.height < bh) { tmp.width = Math.max(tmp.width, bw); tmp.height = Math.max(tmp.height, bh); }
    tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'source-over'; tg.globalAlpha = 1; tg.clearRect(0, 0, bw, bh);
    for (let x = x0; x < x1; x++) {
      const xa = Math.max(x, xmin), xb = Math.min(x + 1, xmax); if (xb <= xa) continue;
      const ua = uDe(xa), ub = uDe(xb);
      let ta = (side ? 1 - ua : ua) * w, tb = (side ? 1 - ub : ub) * w; if (ta > tb) { const q = ta; ta = tb; tb = q; }
      /* la fenêtre de la source : la colonne de texture [ta, tb], centrée, d'au moins un texel. Agrandie (moins d'un texel par
         colonne, dès 0,728 au bord libre), une fenêtre plus étroite qu'un texel donnait dans WebKit le texel le plus proche (des
         blocs d'un texel de large) ; d'un texel, WebKit interpole entre les deux voisins comme un drawImage entier (et comme
         Chrome, qui le faisait déjà) */
      const tm = (ta + tb) / 2, dt = Math.max(.5, (tb - ta) / 2), sa = Math.max(0, tm - dt), sb = Math.min(w, tm + dt); if (sb - sa < 1e-3) continue;
      const xc = (xa + xb) / 2, t0 = yt(xc), t1 = yb(xc);
      tg.drawImage(tex, sa, 0, sb - sa, h, xa - bx, t0 - by, xb - xa, t1 - t0);
    }
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = alpha; c.drawImage(tmp, 0, 0, bw, bh, bx, by, bw, bh); c.restore();
  }
  const poly = (c, pts) => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); };
  function vantail(c, pj, f, th, k, alpha) {
    const { side, w, h, fy0, fy1 } = f, dir = side ? -1 : 1, ct = Math.cos(th), st = Math.sin(th);
    const nFace = [-dir * st, 0, ct], nLibre = [dir * ct, 0, st];
    const A = ptV(pj, f, ct, st, 0, 0, fy0), B = ptV(pj, f, ct, st, 1, 0, fy0), C = ptV(pj, f, ct, st, 0, 0, fy1);
    if (!A || !B || !C) return;
    /* la face qui se voit (la face ou le dos), par le sens de rotation de son image à l'écran */
    const faceVue = dir * croix(A, B, C) > 0;
    const L0 = ptV(pj, f, ct, st, 1, 0, fy0), L1 = ptV(pj, f, ct, st, 1, 1, fy0), L2 = ptV(pj, f, ct, st, 1, 0, fy1), L3 = ptV(pj, f, ct, st, 1, 1, fy1);
    const H0 = ptV(pj, f, ct, st, 0, 0, fy0), H1 = ptV(pj, f, ct, st, 0, 1, fy0), H2 = ptV(pj, f, ct, st, 0, 0, fy1), H3 = ptV(pj, f, ct, st, 0, 1, fy1);
    const libreVue = L0 && L1 && L2 && L3 && dir * croix(L0, L1, L2) > 0;
    const gondVue = !libreVue && H0 && H1 && H2 && H3 && dir * croix(H0, H1, H2) < 0;
    /* la face du moment : verre translucide (plus opaque au tout début), puis reflet ; ou le dos (la tôle, le relief) */
    const g = f.travail.getContext('2d');
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, w, h);
    if (faceVue) {
      const kr = sseg(k, .12, .55);
      if (kr < 1) { g.globalAlpha = 1 - kr; g.drawImage(f.translu, 0, 0); }
      if (kr > 0) { g.globalAlpha = kr; g.drawImage(f.reflet, 0, 0); }
      g.globalAlpha = 1;
      const plein = 1 - sseg(k, 0, .3);
      if (plein > .002) { g.globalAlpha = plein; g.drawImage(f.opaque, 0, 0); g.globalAlpha = 1; }
    } else g.drawImage(f.dos || f.opaque, 0, 0);   /* le dos, préparé pendant les temps morts */
    g.globalCompositeOperation = 'source-atop';
    /* la lumière des portes (haut gauche, devant) sur la face vue, rapportée à la face fermée de la photo */
    /* K6 : le dos (la face intérieure) est un peu plus clair que la face extérieure quand il regarde la lumière */
    const r = eclaire(dl(faceVue ? nFace : nFace.map(v => -v))) * (!faceVue && dl(nFace.map(v => -v)) > 0 ? 1.14 : 1);
    if (r < 1) { g.fillStyle = `rgba(14,16,20,${(clamp(1 - r) * .62).toFixed(3)})`; g.fillRect(0, 0, w, h); }
    else { g.fillStyle = `rgba(255,248,232,${(clamp(r - 1) * .45).toFixed(3)})`; g.fillRect(0, 0, w, h); }
    /* la tranche assombrit un peu la face près du bord libre (et la charnière, près du bâti) */
    { const xl = side ? 0 : w, gg = g.createLinearGradient(xl, 0, side ? w * .2 : w * .8, 0); gg.addColorStop(0, 'rgba(8,8,10,.3)'); gg.addColorStop(1, 'rgba(8,8,10,0)'); g.fillStyle = gg; g.fillRect(0, 0, w, h); }
    /* le reflet du ciel qui glisse sur les carreaux pendant la rotation (face seulement) */
    const e = Math.sin(Math.PI * clamp(k)), ub = side ? 1 - (-.3 + 1.6 * k) : -.3 + 1.6 * k;
    if (faceVue && e > .02) {
      const gl = g.createLinearGradient((ub - .3) * w, 0, (ub + .3) * w, h * .35);
      gl.addColorStop(0, 'rgba(235,242,250,0)'); gl.addColorStop(.5, `rgba(240,246,252,${(.42 * e).toFixed(3)})`); gl.addColorStop(1, 'rgba(235,242,250,0)');
      g.fillStyle = gl; g.fillRect(0, 0, w, h);
    }
    /* le bas du vantail, plus sombre (le sol renvoie peu de lumière) */
    { const gb = g.createLinearGradient(0, h * .82, 0, h); gb.addColorStop(0, 'rgba(10,8,6,0)'); gb.addColorStop(1, 'rgba(10,8,6,.28)'); g.fillStyle = gb; g.fillRect(0, h * .82, w, h * .18); }
    g.globalCompositeOperation = 'source-over';
    c.save(); c.globalAlpha = alpha;
    /* la tranche du côté charnière, si on la voit (rare : le bâti la cache presque toujours) */
    if (gondVue) tranche(c, [H0, H1, H3, H2], [-nLibre[0], 0, -nLibre[2]], nFace, false, f, pj, ct, st);
    /* L4 : une bande pour 12 px de vantail à l'écran (au plus 24, au moins 6) : sur une bande si étroite, l'approximation
       affine de la perspective ne se voit pas, et Safari pose deux à trois fois moins de bandes à l'ouverture */
    const nB = Math.max(6, Math.min(24, Math.ceil(Math.hypot(B[0] - A[0], B[1] - A[1]) / 12)));
    poserFace(c, pj, f, ct, st, faceVue ? 0 : 1, f.travail, nB, alpha);
    if (libreVue) tranche(c, [L0, L1, L3, L2], nLibre, nFace, true, f, pj, ct, st);
    c.restore();
    /* la barre de tirage de la face vue */
    poignee(c, pj, f, faceVue ? 1 : -1, th, k, alpha);
  }
  /* la tranche : acier satiné brossé dans la longueur, éclairé selon sa normale, plus clair en haut, plus sombre au pied ;
     une arête claire du côté de la lumière, une arête sombre de l'autre ; sur le bord libre, la têtière de la serrure */
  function tranche(c, q, n, nFace, libre, f, pj, ct, st) {
    const [a, b, d2, d1] = q;   /* a : face, haut ; b : dos, haut ; d2 : dos, bas ; d1 : face, bas */
    const larg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (larg < .35) return;
    const m = c.getTransform(), tw = TRANCHE.width, tlh = TRANCHE.height;
    c.save(); poly(c, q); c.clip();
    c.setTransform(m.a * (b[0] - a[0]) / tw, m.a * (b[1] - a[1]) / tw, m.a * (d1[0] - a[0]) / tlh, m.a * (d1[1] - a[1]) / tlh, m.a * a[0] + m.e, m.a * a[1] + m.f);
    c.drawImage(TRANCHE, 0, 0); c.setTransform(m);
    const r = eclaire(dl(n)) * .95;
    c.fillStyle = r < 1 ? `rgba(10,11,13,${(clamp(1 - r) * .7).toFixed(3)})` : `rgba(255,246,228,${(clamp(r - 1) * .5).toFixed(3)})`; poly(c, q); c.fill();
    /* le satiné : la moitié de la tranche qui tourne vers la lumière s'éclaire, l'autre s'éteint */
    { const va = dl(nFace.map((x, i) => x + n[i])), vb = dl(nFace.map((x, i) => -x + n[i])), col = v => v > 0 ? `rgba(255,248,234,${(.22 * clamp(v)).toFixed(3)})` : `rgba(0,0,0,${(.25 * clamp(-v)).toFixed(3)})`;
      const gs = c.createLinearGradient(a[0], a[1], b[0], b[1]); gs.addColorStop(0, col(va)); gs.addColorStop(.5, 'rgba(0,0,0,0)'); gs.addColorStop(1, col(vb)); c.fillStyle = gs; poly(c, q); c.fill(); }
    const gh = c.createLinearGradient(a[0], a[1], d1[0], d1[1]);
    gh.addColorStop(0, 'rgba(255,248,236,.1)'); gh.addColorStop(.55, 'rgba(0,0,0,0)'); gh.addColorStop(.9, 'rgba(8,6,4,.18)'); gh.addColorStop(1, 'rgba(8,6,4,.42)');
    c.fillStyle = gh; poly(c, q); c.fill();
    /* la têtière de la serrure (bord libre), à hauteur de la barre */
    if (libre && larg > 2.2) {
      const yc = sol - 1.05 / kF, hh = .13 / kF, T = (s, y) => ptV(pj, f, ct, st, 1, s, y);
      const t = [T(.36, yc - hh), T(.62, yc - hh), T(.62, yc + hh), T(.36, yc + hh)];
      if (t.every(Boolean)) {
        poly(c, t); c.fillStyle = 'rgba(150,146,138,.9)'; c.fill();
        const gt = c.createLinearGradient(t[0][0], t[0][1], t[3][0], t[3][1]); gt.addColorStop(0, 'rgba(255,250,240,.35)'); gt.addColorStop(1, 'rgba(40,36,30,.3)'); c.fillStyle = gt; c.fill();
        const p = [T(.44, yc - hh * .25), T(.54, yc - hh * .25), T(.54, yc + hh * .05), T(.44, yc + hh * .05)];
        if (p.every(Boolean)) { poly(c, p); c.fillStyle = 'rgba(30,28,26,.9)'; c.fill(); }
      }
    }
    c.restore();
    /* les arêtes : face/tranche et dos/tranche, éclairées selon la normale de l'arrondi */
    /* K6 : l'arête côté lumière est un filet clair net d'au moins 1 px, même quand la tranche n'en fait que 2 */
    const ar = (p0, p1, nn) => {
      const v = dl(nn.map((x, i) => x + n[i])), clair = v > .25;
      const lw = clair ? clamp(larg * .2, 1, 1.8) : clamp(larg * .14, .5, 1.6);
      c.lineWidth = lw; c.strokeStyle = clair ? `rgba(255,248,232,${(.55 + .4 * clamp((v - .25) / .6)).toFixed(3)})` : `rgba(6,6,8,${(.5 * clamp((.25 - v) / .8 + .3)).toFixed(3)})`;
      c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
    };
    c.save(); c.lineCap = 'butt';
    ar(a, d1, nFace); ar(b, d2, nFace.map(v => -v));
    c.restore();
  }
  /* la barre de tirage, sur la face (sens 1) ou le dos (sens -1) : une barre ronde d'acier noirci, sur deux plots, et son
     ombre sur la tôle et le verre */
  function poignee(c, pj, f, sens, th, k, alpha) {
    if (alpha <= .01) return;
    const dir = f.side ? -1 : 1, ct = Math.cos(th), st = Math.sin(th), s = sens > 0 ? 0 : 1;
    const nO = [-dir * st * sens, 0, ct * sens];
    const yH = sol - POIGNEE.haut / kF, yB = sol - POIGNEE.bas / kF, yH2 = sol - (POIGNEE.haut - .08) / kF, yB2 = sol - (POIGNEE.bas + .08) / kF;
    const P = (y, r) => ptV(pj, f, ct, st, POIGNEE.u, s, y, nO[0] * r, 0, nO[2] * r);
    const b0 = P(yH, POIGNEE.recul), b1 = P(yB, POIGNEE.recul), p0 = P(yH2, 0), p1 = P(yB2, 0), q0 = P(yH2, POIGNEE.recul), q1 = P(yB2, POIGNEE.recul);
    if (!b0 || !b1 || !p0 || !p1 || !q0 || !q1) return;
    const ref = ptV(pj, f, ct, st, POIGNEE.u, s, yH, nO[0] * POIGNEE.recul + .028 * dir * ct, 0, nO[2] * POIGNEE.recul + .028 * st);
    const ep = ref ? clamp(Math.hypot(ref[0] - b0[0], ref[1] - b0[1]), .6, 40) : 1;
    c.save(); c.globalAlpha = alpha; c.lineCap = 'round';
    /* l'ombre sur la face : la barre poussée le long de la lumière jusqu'au plan de la face */
    const ln = dl(nO);
    if (ln > .08) {
      const t = POIGNEE.recul / ln, dx = nO[0] * POIGNEE.recul - LP[0] * t, dy = -LP[1] * t, dz = nO[2] * POIGNEE.recul - LP[2] * t;
      const o0 = ptV(pj, f, ct, st, POIGNEE.u, s, yH, dx, dy, dz), o1 = ptV(pj, f, ct, st, POIGNEE.u, s, yB, dx, dy, dz);
      if (o0 && o1) { c.strokeStyle = 'rgba(8,8,10,.34)'; c.lineWidth = ep * 1.3; c.beginPath(); c.moveTo(o0[0], o0[1]); c.lineTo(o1[0], o1[1]); c.stroke(); }
    }
    /* les plots */
    c.strokeStyle = 'rgb(30,29,28)'; c.lineWidth = ep * .75;
    c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(q0[0], q0[1]); c.moveTo(p1[0], p1[1]); c.lineTo(q1[0], q1[1]); c.stroke();
    /* la barre : le corps sombre, puis le filet de lumière du côté haut gauche */
    c.strokeStyle = 'rgb(34,33,32)'; c.lineWidth = ep; c.beginPath(); c.moveTo(b0[0], b0[1]); c.lineTo(b1[0], b1[1]); c.stroke();
    const vx = b1[0] - b0[0], vy = b1[1] - b0[1], vl = Math.hypot(vx, vy) || 1, px = -vy / vl, py = vx / vl, sg = (px * -1 + py * -1) > 0 ? 1 : -1, o = ep * .22 * sg;
    c.strokeStyle = 'rgba(214,206,192,.62)'; c.lineWidth = Math.max(.5, ep * .26); c.beginPath(); c.moveTo(b0[0] + px * o, b0[1] + py * o); c.lineTo(b1[0] + px * o, b1[1] + py * o); c.stroke();
    c.restore();
  }
  /* les charnières : trois nœuds de chaque côté, sur l'axe des gonds, devant le bâti (cylindres d'acier, un filet de
     lumière à gauche, le chapeau éclairé) */
  function gonds(c, pj, alpha) {
    if (!mobiles || alpha <= .01) return;
    c.save(); c.globalAlpha = alpha; c.lineCap = 'butt';
    feuilles.forEach(f => {
      const dir = f.side ? -1 : 1, x = f.charn + dir * 6.5;
      GONDS.forEach(yc => {
        const a = pj(x, sol - (yc + GOND_H / 2) / kF, .016), b = pj(x, sol - (yc - GOND_H / 2) / kF, .016), r = pj(x + 2 * GOND_R / kF, sol - (yc + GOND_H / 2) / kF, .016);
        if (!a || !b || !r) return;
        const ep = clamp(Math.hypot(r[0] - a[0], r[1] - a[1]), .5, 30);
        c.strokeStyle = 'rgb(28,27,26)'; c.lineWidth = ep; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
        c.strokeStyle = 'rgba(206,198,184,.55)'; c.lineWidth = Math.max(.4, ep * .25); c.beginPath(); c.moveTo(a[0] - ep * .2, a[1]); c.lineTo(b[0] - ep * .2, b[1]); c.stroke();
        /* la jointure des deux nœuds (le gond et la penture) */
        const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = Math.max(.4, ep * .12); c.beginPath(); c.moveTo(m[0] - ep / 2, m[1]); c.lineTo(m[0] + ep / 2, m[1]); c.stroke();
        c.fillStyle = 'rgba(190,182,168,.6)'; c.beginPath(); c.ellipse(a[0], a[1], ep / 2, Math.max(.3, ep * .18), 0, 0, Math.PI * 2); c.fill();
      });
    });
    c.restore();
  }
  /* l'ombre portée d'un vantail au sol : son cadre, ses petits bois et son soubassement, projetés le long de la lumière
     sur le sol (dedans : vue par l'ouverture, sur le sol de la pièce ; dehors : sur le seuil et le sol devant) */
  /* le soleil des ombres portées : bas (36 degrés), venant de la gauche (la lumière de la photo) et un rien de devant :
     l'ombre d'un vantail traverse le seuil vers la droite et entre un peu dans la pièce ; la lumière des faces (LP), plus
     frontale, les faisait tomber presque dans le plan des vantaux ouverts (un fil) */
  /* K6 : le soleil bas du matin (environ 20 degrés au-dessus de l'horizon) : des ombres plus longues */
  const LS = (() => { const v = [-.78, .3, .12], n = Math.hypot(v[0], v[1], v[2]); return v.map(x => x / n); })();
  const SX = -LS[0] / LS[1], SZ = -LS[2] / LS[1];
  function ombreSol(c, pj, f, th, k, alpha, dedans) {
    const { side, w, h, fy0, fy1 } = f, dir = side ? -1 : 1, ct = Math.cos(th), st = Math.sin(th);
    const S = (u, y) => { const hy = (sol - y) * kF; return pj(f.charn + dir * (u * w * ct + .5 * EPX * st) + hy * SX / kF, sol, u * w * kF * st - .5 * E_PORTE * ct + hy * SZ); };
    const xa = x0 + BATI_PX, xb = x1 - BATI_PX;
    c.save();
    if (dedans) {
      const o = [pj(xa, y0, 0), pj(xb, y0, 0), pj(xb, sol, 0), pj(xa, sol, 0)], fl = [pj(xa - 2 / kF, sol, 0), pj(xb + 2 / kF, sol, 0), pj(xb + 2 / kF, sol, -8), pj(xa - 2 / kF, sol, -8)];
      if (o.some(q => !q) || fl.some(q => !q)) { c.restore(); return; }
      poly(c, o); c.clip(); poly(c, fl); c.clip();
    } else {
      /* le sol devant la façade, jusqu'à 3 m (ou moins quand la caméra est tout près) */
      let z = null;
      for (const zz of [3, 1.6, .8]) { const t = [pj(x0 - 4 / kF, sol, 0), pj(x1 + 4 / kF, sol, 0), pj(x1 + 4 / kF, sol, zz), pj(x0 - 4 / kF, sol, zz)]; if (t.every(Boolean)) { z = t; break; } }
      if (!z) { c.restore(); return; }
      poly(c, z); c.clip();
    }
    /* K6 : l'ombre plus marquée */
    c.globalAlpha = alpha * .74 * sseg(k, 0, .12);
    /* le pied du vantail touche le sol : une ombre de contact, serrée et sombre, le long de son bas */
    if (!dedans) {
      const b0 = ptV(pj, f, ct, st, 0, .5, sol), b1 = ptV(pj, f, ct, st, 1, .5, sol), r = ptV(pj, f, ct, st, 1, .5, sol, 0, 0, .1);
      if (b0 && b1 && r) {
        const ep = clamp(Math.hypot(r[0] - b1[0], r[1] - b1[1]) * 1.4, 1, 30);
        c.save(); c.globalAlpha = alpha * .55 * sseg(k, 0, .12); c.lineCap = 'round'; c.strokeStyle = 'rgba(20,16,12,.5)'; c.lineWidth = ep * 1.8; c.beginPath(); c.moveTo(b0[0], b0[1]); c.lineTo(b1[0], b1[1]); c.stroke();
        c.strokeStyle = 'rgba(14,11,8,.8)'; c.lineWidth = ep * .6; c.stroke(); c.restore();
      }
    }
    /* l'ombre portée, un peu floue (pénombre : le masque est flouté une fois, pas de filtre à chaque image) */
    const N = 14, sw = w / N, m = c.getTransform();
    for (let i = 0; i < N; i++) {
      const ua = i / N, ub = (i + 1) / N, u0 = side ? ub : ua, u1 = side ? ua : ub, tx = side ? (1 - ub) * w : ua * w;
      const A = S(u0, fy0), B = S(u1, fy0), C = S(u0, fy1);
      if (!A || !B || !C) continue;
      c.setTransform(m.a * (B[0] - A[0]) / sw, m.a * (B[1] - A[1]) / sw, m.a * (C[0] - A[0]) / h, m.a * (C[1] - A[1]) / h, m.a * A[0] + m.e, m.a * A[1] + m.f);
      c.drawImage(f.ombre, tx, 0, sw + .7, h, 0, 0, sw + .7, h);
    }
    c.setTransform(m); c.restore();
  }
  /* le tableau de l'ouverture : le bâti d'acier en profondeur (17 cm), ses deux joues et son linteau, éclairés par la
     lumière des portes ; devant, la feuillure du bâti (prise dans la photo) ; dans la pièce, l'ombre douce qu'il y porte */
  const batiG = document.createElement('canvas'), batiD = document.createElement('canvas');
  if (mobiles) [[batiG, x0], [batiD, x1 - BATI_PX]].forEach(([cc, xx]) => { cc.width = BATI_PX; cc.height = Math.round(sol - y0); cc.getContext('2d').drawImage(image, xx, y0, BATI_PX, sol - y0, 0, 0, BATI_PX, sol - y0); });
  function tableau(c, pj, alpha, k) {
    const xa = x0 + BATI_PX, xb = x1 - BATI_PX, D = -PROF_BATI;
    const P = (x, y, z) => pj(x, y, z);
    const jG = [P(xa, y0, 0), P(xa, y0, D), P(xa, sol, D), P(xa, sol, 0)], jD = [P(xb, y0, 0), P(xb, y0, D), P(xb, sol, D), P(xb, sol, 0)], li = [P(xa, y0, 0), P(xb, y0, 0), P(xb, y0, D), P(xa, y0, D)];
    if ([...jG, ...jD, ...li].some(q => !q)) return;
    c.save(); c.globalAlpha = alpha * sseg(k, 0, .05);
    /* l'ombre portée par le bâti dans la pièce : le long des joues et sous le linteau, plus forte en haut et à gauche */
    const ii = [P(xa, y0, D), P(xb, y0, D), P(xb, sol, D), P(xa, sol, D)];
    poly(c, ii); c.save(); c.clip();
    const band = (p0, p1, a0) => { const g = c.createLinearGradient(p0[0], p0[1], p1[0], p1[1]); g.addColorStop(0, `rgba(12,10,8,${a0})`); g.addColorStop(1, 'rgba(12,10,8,0)'); c.fillStyle = g; c.fill(); };
    poly(c, ii); band(P(xa, sol * .5 + y0 * .5, D), P(xa + .32 / kF, sol * .5 + y0 * .5, D), .42);
    poly(c, ii); band(P(xb, sol * .5 + y0 * .5, D), P(xb - .22 / kF, sol * .5 + y0 * .5, D), .22);
    poly(c, ii); band(P((xa + xb) / 2, y0, D), P((xa + xb) / 2, y0 + .4 / kF, D), .5);
    c.restore();
    /* les joues et le linteau, en acier : visibles seulement de leur côté */
    const face = (q, cl, fonce) => {
      if (Math.abs(croix(q[0], q[1], q[3])) < .5) return;
      poly(c, q);
      const g = c.createLinearGradient(q[0][0], q[0][1], q[1][0], q[1][1]);
      g.addColorStop(0, cl); g.addColorStop(1, fonce); c.fillStyle = g; c.fill();
    };
    if (croix(jG[0], jG[1], jG[3]) < 0) face(jG, 'rgb(46,46,47)', 'rgb(22,22,23)');
    if (croix(jD[0], jD[1], jD[3]) > 0) face(jD, 'rgb(98,96,92)', 'rgb(52,51,50)');
    if (croix(li[0], li[1], li[3]) > 0) face(li, 'rgb(36,36,37)', 'rgb(18,18,19)');
    /* le dégradé sur la hauteur des joues : plus clair en haut, le pied dans l'ombre */
    [jG, jD].forEach(q => { poly(c, q); const g = c.createLinearGradient(q[0][0], q[0][1], q[3][0], q[3][1]); g.addColorStop(0, 'rgba(255,248,236,.06)'); g.addColorStop(.8, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.3)'); c.fillStyle = g; c.fill(); });
    /* l'arête du bâti qui prend la lumière (joue de droite, devant), l'arête d'ombre à gauche */
    c.lineWidth = clamp(Math.hypot(jD[1][0] - jD[0][0], jD[1][1] - jD[0][1]) * .08, .6, 1.6);
    c.strokeStyle = 'rgba(255,244,222,.55)'; c.beginPath(); c.moveTo(jD[0][0], jD[0][1]); c.lineTo(jD[3][0], jD[3][1]); c.stroke();
    c.strokeStyle = 'rgba(255,244,222,.22)'; c.beginPath(); c.moveTo(li[0][0], li[0][1]); c.lineTo(li[1][0], li[1][1]); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.moveTo(jG[1][0], jG[1][1]); c.lineTo(jG[2][0], jG[2][1]); c.stroke();
    /* la feuillure du bâti, devant (les pixels de la photo, au même endroit : aucun saut quand les portes s'ouvrent) */
    const m = c.getTransform();
    [[batiG, x0], [batiD, x1 - BATI_PX]].forEach(([cc, xx]) => {
      const A = P(xx, y0, 0), B = P(xx + BATI_PX, y0, 0), C = P(xx, sol, 0); if (!A || !B || !C) return;
      c.setTransform(m.a * (B[0] - A[0]) / BATI_PX, m.a * (B[1] - A[1]) / BATI_PX, m.a * (C[0] - A[0]) / cc.height, m.a * (C[1] - A[1]) / cc.height, m.a * A[0] + m.e, m.a * A[1] + m.f);
      c.drawImage(cc, 0, 0);
    });
    c.setTransform(m);
    c.restore();
  }
  /* I1 : la marche du seuil et les vantaux, en silhouette pleine, pour effacer les lavis d'aquarelle derrière eux (ce sont
     des objets réels : la couleur de la gravure ne les touche pas) */
  function silhouette(c, pj) {
    const yM = sol - MARCHE.h / kF, xa = x0 - MARCHE.deb / kF, xb = x1 + MARCHE.deb / kF;
    const poly = pts => { if (pts.some(q => !q)) return; c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fill(); };
    c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = 1; c.fillStyle = '#000';
    poly([pj(xa, yM, MARCHE.p), pj(xb, yM, MARCHE.p), pj(xb, sol, MARCHE.p), pj(xa, sol, MARCHE.p)]);
    poly([pj(xa, yM, MARCHE.p), pj(xb, yM, MARCHE.p), pj(xb, yM, 0), pj(xa, yM, 0)]);
    if (mobiles && kCourant > .0005) {
      const th = TH_MAX * kCourant, ct = Math.cos(th), st = Math.sin(th);
      /* J1 : le volume du vantail (ses quatre faces verticales) */
      feuilles.forEach(f => {
        const V = (u, s, y) => ptV(pj, f, ct, st, u, s, y);
        [[0, 0, 1, 0], [0, 1, 1, 1], [1, 0, 1, 1], [0, 0, 0, 1]].forEach(([ua, sa, ub, sb]) => poly([V(ua, sa, f.fy0), V(ub, sb, f.fy0), V(ub, sb, f.fy1), V(ua, sa, f.fy1)]));
      });
    }
    c.restore();
  }
  /* ---- I2 : la lampe vue de dehors ---- */
  /* Les carreaux (masque, à la moitié de la résolution) ; la lueur est peinte dans l'image de la façade, puis posée à
     l'écran par la même homographie, par bandes, sur le canevas du monde juste devant la façade (sous les vantaux). */
  const CARR = carreaux(), KL = .5, LW = Math.round(W * KL), LH = Math.round(H * KL);
  const verre = document.createElement('canvas'); verre.width = LW; verre.height = LH;
  { const g = verre.getContext('2d'); g.fillStyle = '#000'; CARR.forEach(q => g.fillRect(q.x0 * LW, q.y0 * LH, (q.x1 - q.x0) * LW, (q.y1 - q.y0) * LH)); }
  const lum = document.createElement('canvas'); lum.width = LW; lum.height = LH;
  const lg = lum.getContext('2d');
  const RW = 1 / kF;   /* pixels de l'image par mètre */
  /* Lm : la lampe dans l'image (px), là où le regard la croise sur le plan de la façade ; I son intensité ; col sa couleur */
  function lumiere(c, Hm, Lm, I, col, dpr, objet = false) {
    if (I <= .002 || !Lm) return;
    const k = kCourant, lx = Lm[0], ly = Lm[1];
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-over'; lg.globalAlpha = 1; lg.clearRect(0, 0, LW, LH);
    lg.setTransform(KL, 0, 0, KL, 0, 0);
    /* la pièce éclairée derrière les vitres : chaude près de la lampe, plus faible au loin ; le vitrage haut, qui
       renvoie le ciel, la montre moins que les carreaux sombres du bas */
    const g1 = lg.createRadialGradient(lx, ly, 0, lx, ly, 3.4 * RW);
    /* K11 : la photo de la pièce porte déjà sa lumière : la lueur ajoutée sur les vitres n'est plus qu'un appoint */
    const k11 = K11.actif ? .4 : 1;
    g1.addColorStop(0, rgba(col, .5 * I * k11)); g1.addColorStop(.12, rgba(col, .26 * I * k11)); g1.addColorStop(.5, rgba([255, 168, 92], .09 * I)); g1.addColorStop(1, rgba([255, 160, 90], 0));
    lg.fillStyle = g1; lg.fillRect(0, 0, W, H);
    const g2 = lg.createLinearGradient(0, RANGEES[1][1] * H, 0, H);
    g2.addColorStop(0, rgba([255, 170, 96], 0)); g2.addColorStop(.25, rgba([255, 170, 96], .06 * I)); g2.addColorStop(1, rgba([255, 160, 90], .03 * I));
    lg.fillStyle = g2; lg.fillRect(0, RANGEES[1][1] * H, W, H);
    lg.globalCompositeOperation = 'destination-in'; lg.drawImage(verre, 0, 0, W, H);
    /* les carreaux de la porte s'en vont avec les vantaux qui s'ouvrent (la pièce se voit alors par l'ouverture) */
    if (k > .001) { lg.globalCompositeOperation = 'destination-out'; lg.globalAlpha = clamp(k * 1.4); lg.fillStyle = '#000'; lg.fillRect(P[0][0], P[0][1], P[1][0] - P[0][0], P[2][1] - P[0][1]); lg.globalAlpha = 1; }
    lg.globalCompositeOperation = 'lighter';
    /* l'ampoule : un point blanc chaud derrière le carreau où le regard la croise, et son halo (un peu de flou de
       lumière déborde sur les montants) ; derrière un montant, seul le halo */
    /* J2 : avec le vrai luminaire (lampeObjet), l'ampoule et son halo sont dessinés avec lui, derrière les carreaux ; le
       point lumineux d'avant n'est plus qu'un repli (sans lampe-atelier au manifeste) */
    const ici = objet ? null : CARR.find(q => lx >= q.x0 * W && lx <= q.x1 * W && ly >= q.y0 * H && ly <= q.y1 * H && !(q.porte && k > .3));
    if (!objet) {
      const halo = lg.createRadialGradient(lx, ly, 0, lx, ly, .42 * RW);
      halo.addColorStop(0, rgba(col, .55 * I * (ici ? 1 : .45))); halo.addColorStop(.3, rgba(col, .16 * I)); halo.addColorStop(1, rgba(col, 0));
      lg.fillStyle = halo; lg.fillRect(lx - .5 * RW, ly - .5 * RW, RW, RW);
    } else {
      /* J10 : le halo de l'ampoule diffusé par le verre du carreau où elle est (et un peu par ses voisins), doux */
      const halo = lg.createRadialGradient(lx, ly, 0, lx, ly, .3 * RW);
      halo.addColorStop(0, rgba(col, .3 * I)); halo.addColorStop(.35, rgba(col, .08 * I)); halo.addColorStop(1, rgba(col, 0));
      lg.fillStyle = halo; lg.fillRect(lx - .3 * RW, ly - .3 * RW, .6 * RW, .6 * RW);
    }
    /* J1 et J2 : portes fermées, la ligne de jour entre les deux vantaux laisse passer un fil de la lumière de la pièce */
    if (mobiles && k < .03 && quadsV.length === 2) {
      const xm = (quadsV[0].fx0 + quadsV[0].w + quadsV[1].fx0) / 2 - .3, a = .55 * I * (1 - k / .03);
      const gj = lg.createLinearGradient(0, y0, 0, sol); gj.addColorStop(0, rgba(col, a * .5)); gj.addColorStop(.45, rgba(col, a)); gj.addColorStop(1, rgba(col, a * .6));
      lg.fillStyle = gj; lg.fillRect(xm - .7, y0 + 6, 1.4, sol - y0 - 10);
    }
    if (ici) {
      const coeur = lg.createRadialGradient(lx, ly, 0, lx, ly, .07 * RW);
      coeur.addColorStop(0, rgba([255, 252, 240], Math.min(1, 1.1 * I))); coeur.addColorStop(.45, rgba([255, 236, 196], .8 * I)); coeur.addColorStop(1, rgba(col, 0));
      lg.fillStyle = coeur; lg.fillRect(lx - .08 * RW, ly - .08 * RW, .16 * RW, .16 * RW);
    }
    /* les reflets de l'ampoule sur les carreaux voisins (vieux verre, pas tout à fait plan) : chacun décalé vers la
       lampe selon la place de son carreau, plus faibles en s'éloignant */
    CARR.forEach((q, n) => {
      if (q === ici || (q.porte && k > .3)) return;
      const cx = (q.x0 + q.x1) / 2 * W, cy = (q.y0 + q.y1) / 2 * H, d = Math.hypot(cx - lx, cy - ly) / RW;
      if (d > 2.6) return;
      const f = Math.pow(1 - d / 2.6, 1.6) * I, dx = (lx - cx) * .3 + ((n * 37 % 11) / 11 - .5) * (q.x1 - q.x0) * W * .25, dy = (ly - cy) * .3 + ((n * 53 % 7) / 7 - .5) * (q.y1 - q.y0) * H * .2;
      const gx = clamp(cx + dx, q.x0 * W + 3, q.x1 * W - 3), gy = clamp(cy + dy, q.y0 * H + 3, q.y1 * H - 3), r = .035 * RW;
      const gg = lg.createRadialGradient(gx, gy, 0, gx, gy, r);
      gg.addColorStop(0, rgba([255, 246, 225], .75 * f)); gg.addColorStop(1, rgba(col, 0));
      lg.fillStyle = gg; lg.fillRect(gx - r, gy - r, 2 * r, 2 * r);
    });
    /* posée sur la façade, par bandes verticales (la façade est presque de face : l'erreur est sous le pixel) */
    /* T11 (07/10/2026) : les bandes se touchent sans se chevaucher (avant : 0,6 pixel de la photo de plus à droite). La
       lueur est translucide : posée deux fois sur le chevauchement, elle y doublait. De près (on passe la porte), 0,6
       pixel de la photo font deux à trois pixels d'écran : un filet clair vertical au milieu de l'écran, du plafond au
       haut de la planche, à travers l'abat-jour (arrivée dans l'atelier, sur l'iPhone et dans Safari). Bord à bord, le
       raccord ne se voit pas (mesuré dans le calque : deux niveaux sur 255 au plus, comme les colonnes voisines) */
    c.save(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    const N = 10;
    for (let i = 0; i < N; i++) {
      const xa = W * i / N, xb = W * (i + 1) / N, sw = xb - xa;
      const A = appl(Hm, xa, 0), B = appl(Hm, xb, 0), C = appl(Hm, xa, H);
      c.setTransform(dpr * (B[0] - A[0]) / sw, dpr * (B[1] - A[1]) / sw, dpr * (C[0] - A[0]) / H, dpr * (C[1] - A[1]) / H, dpr * A[0], dpr * A[1]);
      c.drawImage(lum, xa * KL, 0, sw * KL, LH, 0, 0, sw, H);
    }
    c.restore();
  }
  /* ---- J3 : la pièce vue par le vitrage, dans l'ouverture ---- */
  /* Quand les portes s'ouvrent, l'ouverture montre d'abord la pièce de la photo de façade (celle qu'on voit par les
     carreaux voisins : le même mur de moellons, la même petite table) ; le fondu vers la photo de la table ne vient
     qu'à la fin de l'ouverture (temps.js, T.piece). Cette pièce est tirée de la photo d'origine, dans l'emprise de la
     porte : les montants, les petits bois et les béquilles des vantaux sont effacés (chaque bande est remplie par la
     texture des carreaux voisins, de part et d'autre, fondue) ; la rangée haute, qui renvoyait le ciel, est remplacée
     par le haut du mur (la rangée de dessous, remontée, plus sombre vers le plafond). Calculée une fois, à la demande. */
  let piece = null;
  function pieceFacade() {
    if (piece || !mobiles) return piece;
    const px0 = Math.round(x0), py0 = Math.round(y0), pw = Math.round(x1) - px0, ph = Math.round(sol) - py0;
    const c = document.createElement('canvas'); c.width = pw; c.height = ph; const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(vf.image, px0, py0, pw, ph, 0, 0, pw, ph);
    let im; try { im = g.getImageData(0, 0, pw, ph); } catch (e) { return (piece = c); }
    const d = im.data, at = (x, y) => (Math.max(0, Math.min(ph - 1, y)) * pw + Math.max(0, Math.min(pw - 1, x))) * 4;
    /* les bandes à effacer, en px de la pièce : horizontales (petits bois, traverses, béquilles), puis verticales */
    const hz = [], vt = [];
    quadsV.forEach(({ side, fx0, fy0, w, h }) => {
      BARRES.h.forEach(([a, b]) => hz.push([fx0 - px0, fx0 - px0 + w, Math.floor(fy0 + a * h - py0) - 3, Math.ceil(fy0 + b * h - py0) + 3]));
      BARRES.v[side].forEach(([a, b]) => vt.push([Math.floor(fx0 + a * w - px0) - 3, Math.ceil(fx0 + b * w - px0) + 3]));
    });
    /* les béquilles, au milieu (environ 0,69 de la hauteur de l'image) */
    hz.push([Math.round(.468 * W) - px0, Math.round(.535 * W) - px0, Math.round(.682 * H) - py0, Math.round(.706 * H) - py0]);
    /* chaque bande est comblée par une interpolation entre ses deux bords (les lignes qui la traversent, le bord de la
       table, les joints, continuent), plus le grain de la pierre voisine (l'écart à la moyenne locale, pris à côté) */
    const R = rng(3131);
    const combler = (x, y, xa, ya, xb, yb, t, gx, gy) => {
      const i = at(x, y), a = at(xa, ya), b = at(xb, yb), gi = at(gx, gy), gm = at(gx + 1, gy + 1);
      for (let k = 0; k < 3; k++) d[i + k] = d[a + k] * (1 - t) + d[b + k] * t + (d[gi + k] - d[gm + k]) * .35 + (R() - .5) * 3;
    };
    for (const [xa, xb, ya, yb] of hz) {
      const y0b = Math.max(0, ya), y1b = Math.min(ph - 1, yb), up = y0b > 0 ? y0b - 1 : y1b + 1, dn = y1b < ph - 1 ? y1b + 1 : y0b - 1;
      for (let x = Math.max(0, xa); x < Math.min(pw, xb); x++) for (let y = y0b; y <= y1b; y++) { const t = (y - y0b + 1) / (y1b - y0b + 2); combler(x, y, x, up, x, dn, t, x, y - (y1b - y0b + 3)); }
    }
    /* les montants qui se touchent (les deux montants du milieu) forment une seule bande */
    vt.sort((a, b) => a[0] - b[0]);
    for (let i = vt.length - 1; i > 0; i--) if (vt[i][0] <= vt[i - 1][1] + 1) { vt[i - 1][1] = Math.max(vt[i - 1][1], vt[i][1]); vt.splice(i, 1); }
    /* dans la rangée de la serrure, les montants du milieu s'élargissent (la gâche, les rosaces des béquilles) */
    vt.push([Math.round(.4805 * W) - px0, Math.round(.5205 * W) - px0, Math.round(.648 * H) - py0, Math.round(.825 * H) - py0]);
    for (const [xa, xb, ya = 0, yb = ph - 1] of vt) {
      const x0b = Math.max(0, xa), x1b = Math.min(pw - 1, xb), l = x0b > 0 ? x0b - 1 : x1b + 1, r = x1b < pw - 1 ? x1b + 1 : x0b - 1;
      for (let y = Math.max(0, ya); y <= Math.min(ph - 1, yb); y++) for (let x = x0b; x <= x1b; x++) { const t = (x - x0b + 1) / (x1b - x0b + 2); combler(x, y, l, y, r, y, t, x + (x1b - x0b + 3), y); }
    }
    g.putImageData(im, 0, 0);
    /* la rangée haute (le ciel renvoyé) : le haut du mur, remonté d'une rangée, plus sombre vers le plafond */
    const q0 = quadsV[0], r1 = Math.round(q0.fy0 + BARRES.h[1][1] * q0.h - py0) + 4, r2 = Math.round(q0.fy0 + BARRES.h[2][0] * q0.h - py0), hr = r2 - r1;
    const haut = document.createElement('canvas'); haut.width = pw; haut.height = r1 + 8; const hg = haut.getContext('2d');
    for (let y = r1 + 8; y > -hr; y -= hr) hg.drawImage(c, 0, r1, pw, hr, 0, y - hr, pw, hr);
    hg.globalCompositeOperation = 'destination-in'; const gm = hg.createLinearGradient(0, r1 - 6, 0, r1 + 8); gm.addColorStop(0, '#000'); gm.addColorStop(1, 'rgba(0,0,0,0)'); hg.fillStyle = gm; hg.fillRect(0, 0, pw, r1 + 8);
    hg.globalCompositeOperation = 'source-atop'; const go = hg.createLinearGradient(0, 0, 0, r1); go.addColorStop(0, 'rgba(10,8,6,.55)'); go.addColorStop(1, 'rgba(10,8,6,.08)'); hg.fillStyle = go; hg.fillRect(0, 0, pw, r1 + 8);
    g.drawImage(haut, 0, 0);
    piece = c; piece.boite = [px0, py0, pw, ph];
    return piece;
  }
  /* ---- J2 : le vrai luminaire, vu de dehors ---- */
  /* La suspension (lampe-atelier) pend derrière le vitrage au-dessus de la table, accrochée à la lampe de la photo de
     la table (le monde donne T.M : lampe -> écran). C'est un objet derrière une vitre : elle est dessinée à part, puis
     découpée par le masque des carreaux (les montants d'acier passent devant elle, nets, sans trou ni saut ; le vitrage
     haut, qui renvoie le ciel, la laisse moins voir que les carreaux sombres du bas) ; porte ouverte, l'ouverture la
     laisse voir entière. Éteinte avant 0,700 (ampoule de verre sombre, émail dans la pénombre), allumée après (la montée
     de I2), avec un halo doux. Le câble monte jusqu'au plafond, caché par le linteau. */
  const masqueVitre = document.createElement('canvas'), masqueOuvert = document.createElement('canvas'), masqueSansPorte = document.createElement('canvas');
  /* N1 (quatorzième passe) : sur téléphone, les trois masques des carreaux (des alphas doux, tirés en étirant) à demi-résolution :
     9,5 Mo devenus 2,4 */
  const KM = TEL ? .5 : 1, MW = Math.round(W * KM), MH = Math.round(H * KM);
  [masqueVitre, masqueSansPorte].forEach((m, ouv) => {
    m.width = MW; m.height = MH; const g = m.getContext('2d'); g.scale(KM, KM);
    CARR.forEach(q => { if (ouv && q.porte) return; g.fillStyle = q.haut ? 'rgba(0,0,0,.62)' : 'rgba(0,0,0,.94)'; g.fillRect(q.x0 * W, q.y0 * H, (q.x1 - q.x0) * W, (q.y1 - q.y0) * H); });
  });
  /* J10 : la transparence réelle du vitrage, tirée de la photo fermée, une fois, pendant les temps morts : dans chaque
     carreau, un verre clair (qui renvoie le ciel, comme un miroir) est opaque, un verre sombre (où l'on voit l'intérieur)
     est transparent, entre les deux un fondu, le tout lissé d'un pixel ; les montants et les traverses, hors des
     carreaux, sont opaques. Tout ce que le code pose derrière le vitrage (la lampe : câble, abat-jour, ampoule) passe par
     ce masque : le câble ne flotte plus devant un reflet et ne traverse jamais un montant. En attendant le calcul, les
     masques uniformes ci-dessus. */
  /* P4 (seizième passe) : px, la photo de façade décodée et relue par l'ouvrier ({ w, h, data }) : la première lecture d'un
     carreau la décodait d'un bloc (11 ms dans WebKit) ; les étapes sont plus courtes (un carreau ; le lissage, les deux
     masques, les trois lectures pleine page par quarts) */
  const BQ = 8, quarts = n => Array.from({ length: n }, (_, i) => [Math.floor(H * i / n), Math.floor(H * (i + 1) / n)]);
  function* lireParQuarts(g, w, h, sortie) { for (const [a, b] of quarts(BQ)) { sortie.set(g.getImageData(0, a, w, b - a).data, a * w * 4); yield; } }
  /* P27, P2 (12/10/2026) : l'état de la vitre (la façade transparente et les masques du vitrage), fait par le calcul ou par les images
     préparées, le premier arrivé (voir plus bas) ; les vantaux (tirés de l'image fermée à la création) reprennent l'image transparente :
     leur verre montre la pièce qui est derrière, plus jamais l'ancienne pièce de la photo de façade */
  const VITRE = { faite: false, decidee: false, prete: null, tache: null, calcul: null };
  const vantauxTransparents = () => feuilles.forEach(f => {
    const go = f.opaque.getContext('2d'); go.clearRect(0, 0, f.w, f.h); go.drawImage(image, quadsV[f.side].fx0, f.fy0, f.w, f.h, 0, 0, f.w, f.h);
    const gt = f.translu.getContext('2d'); gt.globalCompositeOperation = 'source-over'; gt.clearRect(0, 0, f.w, f.h); gt.drawImage(f.opaque, 0, 0); gt.globalCompositeOperation = 'destination-in'; gt.drawImage(f.verreM, 0, 0); gt.globalCompositeOperation = 'source-over';
  });
  function* masquesVitreEtapes(px) {
    const t = document.createElement('canvas'); t.width = W; t.height = H; const tg = t.getContext('2d', { willReadFrequently: true });
    yield;
    /* lu sur la photo d'origine, carreau par carreau, dans un petit canevas en mémoire (la façade affichée n'est jamais relue) */
    const pc = document.createElement('canvas'), src = pc.getContext('2d', { willReadFrequently: true });
    const out = tg.createImageData(W, H), o = out.data;
    yield;
    for (let n = 0; n < CARR.length; n++) {
      const q = CARR[n], qx0 = Math.ceil(q.x0 * W) + 1, qx1 = Math.floor(q.x1 * W) - 1, qy0 = Math.ceil(q.y0 * H) + 1, qy1 = Math.floor(q.y1 * H) - 1;
      if (qx1 <= qx0 || qy1 <= qy0) continue;
      if (px) {
        const d = px.data;
        for (let y = qy0; y < qy1; y++) for (let x = qx0; x < qx1; x++) { const i = (y * W + x) * 4, l = .3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2]; o[i + 3] = 255 * .94 * clamp((165 - l) / 95); }
      } else {
        if (pc.width < qx1 - qx0) pc.width = qx1 - qx0; if (pc.height < qy1 - qy0) pc.height = qy1 - qy0;
        src.clearRect(0, 0, pc.width, pc.height); src.drawImage(vf.image, qx0, qy0, qx1 - qx0, qy1 - qy0, 0, 0, qx1 - qx0, qy1 - qy0);
        const d = src.getImageData(0, 0, qx1 - qx0, qy1 - qy0).data, w = qx1 - qx0;
        for (let y = qy0; y < qy1; y++) for (let x = qx0; x < qx1; x++) {
          const i = ((y - qy0) * w + (x - qx0)) * 4, l = .3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2];
          o[(y * W + x) * 4 + 3] = 255 * .94 * clamp((165 - l) / 95);
        }
      }
      yield;
    }
    yield;
    for (const [a, b] of quarts(BQ)) { tg.putImageData(out, 0, 0, 0, a, W, b - a); yield; }
    /* lissé d'un pixel (par quarts : chaque quart lit 4 rangées de plus de part et d'autre, le flou est le même) */
    const lis = document.createElement('canvas'); lis.width = W; lis.height = H; const lsg = lis.getContext('2d', { willReadFrequently: true });
    for (const [a, b] of quarts(BQ)) {
      const a2 = Math.max(0, a - 4), b2 = Math.min(H, b + 4);
      lsg.save(); lsg.beginPath(); lsg.rect(0, a, W, b - a); lsg.clip(); lsg.filter = 'blur(.8px)'; lsg.drawImage(t, 0, a2, W, b2 - a2, 0, a2, W, b2 - a2); lsg.restore();
      lsg.getImageData(0, a, 1, 1);
      yield;
    }
    for (const [ouv, m] of [masqueVitre, masqueSansPorte].entries()) {
      const g = m.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, MW, MH); g.drawImage(lis, 0, 0, MW, MH); g.setTransform(KM, 0, 0, KM, 0, 0);
      if (ouv) { g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.fillRect(P[0][0], P[0][1], P[1][0] - P[0][0], P[2][1] - P[0][1]); g.globalCompositeOperation = 'source-over'; }
      yield;
    }
    masqueK = -1;
    if (!K11.actif) liberer(t, lis, pc);
    /* K11 : la façade transparente au vitrage, avec le voile du verre. Pour chaque pixel des carreaux, t (0 à 0,94) est la
       transparence du verre (le masque de J10, inversé et lissé) : la façade y devient « par-dessus la pièce » : couleur
       prémultipliée = photo x (1 - t) + voile x t x v, opacité 1 - t (1 - v), v = 0,2 ; le voile est un gris bleuté
       sombre : la pièce y paraît environ 18 % plus sombre et un peu plus froide ; là où le verre renvoie le ciel (t = 0), la photo
       telle quelle. Calculé une fois, par bandes, pendant les temps morts. */
    /* (sans la photo de la table en pierre, la pièce de façade reste : la façade n'est pas rendue transparente) */
    if (!K11.actif) { VITRE.faite = true; return; }
    yield;
    const ld = new Uint8ClampedArray(W * H * 4); yield* lireParQuarts(lsg, W, H, ld);
    /* L1 (douzième passe) : un carreau n'est opaque (il renvoie le ciel) que là où la photo montre le ciel : un verre
       clair et bleuté. Le mur intérieur que la photo de façade montrait au bout gauche du vitrage, éclairé par le soleil
       (clair, mais ocre), se lisait comme un pilier reflété : il devient transparent, la pièce (et la verrière qui la
       prolonge, avec la vigne derrière) s'y voit sous le voile du verre. L'appartenance aux carreaux : leurs rectangles,
       adoucis d'un pixel */
    const mb = document.createElement('canvas'); mb.width = W; mb.height = H; const mbg = mb.getContext('2d', { willReadFrequently: true });
    mbg.fillStyle = '#000'; CARR.forEach(q => mbg.fillRect(Math.ceil(q.x0 * W) + 1, Math.ceil(q.y0 * H) + 1, Math.floor(q.x1 * W) - Math.ceil(q.x0 * W) - 2, Math.floor(q.y1 * H) - Math.ceil(q.y0 * H) - 2));
    const md = new Uint8ClampedArray(W * H * 4); yield* lireParQuarts(mbg, W, H, md);
    /* L1 (douzième passe) : le ciel est lu sur la photo adoucie (réduite au quart, puis agrandie) : lu pixel à pixel, il
       reprenait les blocs de la compression de la photo, une mosaïque visible dans les carreaux du haut quand la façade
       est agrandie (0,73) */
    const sm = document.createElement('canvas'); sm.width = Math.ceil(W / 4); sm.height = Math.ceil(H / 4);
    const smg = sm.getContext('2d', { willReadFrequently: true }); smg.imageSmoothingQuality = 'high'; smg.drawImage(image, 0, 0, sm.width, sm.height);
    smg.getImageData(0, 0, 1, 1);
    yield;
    const bl = document.createElement('canvas'); bl.width = W; bl.height = H; const blg = bl.getContext('2d', { willReadFrequently: true });
    const sd = new Uint8ClampedArray(W * H * 4);
    for (const [a, b] of quarts(BQ)) {
      blg.save(); blg.beginPath(); blg.rect(0, a, W, b - a); blg.clip(); blg.imageSmoothingQuality = 'high'; blg.drawImage(sm, 0, 0, W, H); blg.restore();
      sd.set(blg.getImageData(0, a, W, b - a).data, a * W * 4);
      yield;
    }
    const ig = image.getContext('2d', { willReadFrequently: true }), V = .2, VC = [46, 56, 70];
    /* P4 (seizième passe) : par bandes de 24 rangées (au lieu de 48 : 5 à 9 ms par étape dans WebKit) */
    for (let yb = 0; yb < H; yb += 24) {
      const hb = Math.min(24, H - yb), im = ig.getImageData(0, yb, W, hb), d = im.data;
      for (let j = 0; j < W * hb; j++) {
        const i = j * 4, a0 = ld[(yb * W + j) * 4 + 3], dans = md[(yb * W + j) * 4 + 3];
        let a = a0;
        if (dans) { const s = (yb * W + j) * 4, l = (sd[s] + sd[s + 1] + sd[s + 2]) / 3, ciel = clamp((sd[s + 2] - sd[s] + 6) / 28) * clamp((l - 110) / 50); a = Math.max(a0, 255 * .94 * (1 - ciel) * dans / 255); }
        if (!a) continue;
        const t = a / 255, al = 1 - t * (1 - V), k1 = (1 - t) / al, k2 = t * V / al;
        d[i] = d[i] * k1 + VC[0] * k2; d[i + 1] = d[i + 1] * k1 + VC[1] * k2; d[i + 2] = d[i + 2] * k1 + VC[2] * k2; d[i + 3] = d[i + 3] * al;
      }
      ig.putImageData(im, 0, yb);
      yield;
    }
    vantauxTransparents();
    K11.pret = true; VITRE.faite = true;
    /* N1 (quatorzième passe) : les cinq canevas de travail (3,2 Mo chacun) rendent leur mémoire tout de suite */
    liberer(t, lis, mb, sm, bl, pc);
  }
  /* P27, P2 (12/10/2026) : la vitre préparée. Thibaut (11/10) : en approchant vite, « l'image de la verrière semble se charger au fur et à
     mesure », elle « ne joue pas la transparence ». La vitre calculée (ci-dessus) attendait 2,2 s, le décodage de la photo, puis passait
     derrière le sol et les lavis avec 4 ms par image en mouvement : arrivé vite, on voyait la photo fermée opaque, puis la transparence
     écrite après l'arrêt. La façade transparente (l'image de la façade après K11, 1307 x 632 avec sa couche alpha) et le masque lissé
     du vitrage (J10, noir et alpha) sont faits une fois par ce même code (c-film/prets/facade-vitre.webp et vitre-masque.webp,
     prets.json) et pris s'ils sont là et que leurs sources n'ont pas changé : la tâche « vitre-prete » les pose en trois étapes
     courtes (les masques, la façade, les vantaux), besoin 0,1 (après le calme de l'ouverture, avant le sol), demandée 2,2 s après la
     création comme le calcul (l'atelier a dit alors si la pièce se voit par la vitre, K11.actif ; et l'instant ne dépend pas de
     l'arrivée de l'image : le rendu vidéo, à horloge virtuelle, reste le même d'un rendu à l'autre), ou dès son arrivée si elle
     arrive après ; la verrière est transparente avant qu'on arrive. Sinon (?prets=0, source changée, image absente), le calcul, comme avant ; si l'image préparée arrive après
     le départ du calcul, elle le remplace (le calcul s'arrête là où il en est, la façade est reposée en entier). */
  function* vitrePreteEtapes(imF, imM) {
    yield;
    if (VITRE.faite) return;
    for (const [ouv, m] of [masqueVitre, masqueSansPorte].entries()) {
      const g = m.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, MW, MH); g.drawImage(imM, 0, 0, MW, MH); g.setTransform(KM, 0, 0, KM, 0, 0);
      if (ouv) { g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.fillRect(P[0][0], P[0][1], P[1][0] - P[0][0], P[2][1] - P[0][1]); g.globalCompositeOperation = 'source-over'; }
    }
    masqueK = -1;
    if (!K11.actif) { VITRE.faite = true; VITRE.prete = null; return; }
    yield;
    const ig = image.getContext('2d'); ig.clearRect(0, 0, W, H); ig.drawImage(imF, 0, 0);
    yield;
    vantauxTransparents();
    K11.pret = true; VITRE.faite = true; VITRE.prete = null;
  }
  const poserVitrePrete = () => {
    if (VITRE.tache || VITRE.faite || !VITRE.prete) return;
    if (VITRE.calcul) VITRE.calcul.fini = true;
    planifier(VITRE.tache = { nom: 'vitre-prete', besoin: .1, gen: vitrePreteEtapes(VITRE.prete.f, VITRE.prete.m) });
  };
  const calculerVitre = gen => { if (VITRE.faite || VITRE.tache) return; planifier(VITRE.calcul = { nom: 'vitre', gen }); };
  Promise.all([pret('facade-vitre'), pret('vitre-masque')]).then(([rf, rm]) => {
    if (!rf || !rm || [rf, rm].some(r => r.im.naturalWidth !== W || r.im.naturalHeight !== H)) return;
    VITRE.prete = { f: rf.im, m: rm.im };
    if (VITRE.decidee) poserVitrePrete();
  });
  setTimeout(() => {
    VITRE.decidee = true;
    if (VITRE.prete) { poserVitrePrete(); return; }
    ouvrier('pixels', { url: new URL(vf.src, location.href).href }).then(r => calculerVitre(masquesVitreEtapes(r.w === W && r.h === H ? { data: new Uint8ClampedArray(r.data) } : null)), () => calculerVitre(masquesVitreEtapes(null)));
  }, 2200);
  /* J2 bis : porte ouverte, la lampe se voit par l'ouverture tant que l'ouverture montre la pièce de la photo de façade ;
     quand la photo de la table (qui porte sa propre lampe) la remplace, la lampe dessinée s'efface de l'ouverture : une
     seule lampe */
  masqueOuvert.width = MW; masqueOuvert.height = MH; let masqueK = -1;
  const masquePorte = kp => {
    const q = Math.round(kp * 50) / 50; if (q === masqueK) return masqueOuvert; masqueK = q;
    const g = masqueOuvert.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, MW, MH); g.drawImage(masqueSansPorte, 0, 0); g.setTransform(KM, 0, 0, KM, 0, 0);
    if (mobiles && q > 0) { g.fillStyle = `rgba(0,0,0,${q})`; g.fillRect(x0 + BATI_PX, y0, x1 - x0 - 2 * BATI_PX, sol - y0); }
    return masqueOuvert;
  };
  let lampeEteinte = null;
  /* P4 (seizième passe) : px, la lampe décodée par l'ouvrier (son décodage, sur le fil principal, faisait l'étape : 5 à 6 ms) */
  function faireEteinte(px) {
    if (lampeEteinte || !vLampe) return lampeEteinte;
    const w = vLampe.w, h = vLampe.h, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true });
    const y0e = Math.floor(h * .8);
    if (px) g.putImageData(new ImageData(px.data.subarray(0, y0e * w * 4), w, y0e), 0, 0);
    else g.drawImage(vLampe.image, 0, 0);
    try {
      /* l'émail blanc et l'ampoule, éteints : un gris sombre et un verre teinté, avec un reflet discret */
      const d = px ? new ImageData(px.data.slice(y0e * w * 4), w, h - y0e) : g.getImageData(0, y0e, w, h - y0e), p = d.data;
      for (let i = 0; i < p.length; i += 4) { if (!p[i + 3]) continue; const l = (p[i] + p[i + 1] + p[i + 2]) / 3; if (l > 70) { const t = clamp((l - 70) / 150); p[i] = 46 + 40 * t; p[i + 1] = 45 + 38 * t; p[i + 2] = 44 + 34 * t; } }
      g.putImageData(d, 0, y0e);
    } catch (e) { /* sans lecture : l'image allumée, assombrie */ g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(30,28,26,.6)'; g.fillRect(0, h * .8, w, h * .2); }
    return (lampeEteinte = c);
  }
  const lampeTmp = document.createElement('canvas'), ltg = lampeTmp.getContext('2d');
  /* J2, J3 : la lampe éteinte et la pièce vue par la porte sont préparées pendant les temps morts (jamais au démarrage ni
     pendant une image) */
  /* K11 : la pièce de la photo de façade n'est plus montrée, elle n'est plus calculée */
  setTimeout(() => { const go = px => planifier({ nom: 'eteinte', gen: (function* () { yield; faireEteinte(px); })() }); if (vLampe) ouvrier('pixels', { url: new URL(vLampe.src, location.href).href }).then(r => go(r.w === vLampe.w && r.h === vLampe.h ? { data: new Uint8ClampedArray(r.data) } : null), () => go(null)); else go(null); }, 3000);
  function lampeObjet(c, Hm, T, I, col, dpr, alpha, kPiece = 1) {
    if (!vLampe || !T || alpha <= .01) return;
    const M = T.M, w = vLampe.w, h = vLampe.h, R = vLampe.reperes;
    const P = (x, y) => appl(M, x, y);
    const sHaut = ((R.rosace ? R.rosace[1] : 0) + .13) * h, cxC = (R.rosace ? R.rosace[0] : .4984) * w;
    const amp = R.ampoule || [.5106, .8614, .0786], bulbe = P(amp[0] * w, amp[1] * h);
    /* la boîte à l'écran (la lampe, son halo, le câble jusqu'à une hauteur de lampe au-dessus) */
    const c0 = P(0, sHaut), c1 = P(w, h), haut = P(cxC, sHaut - h * 1.6), lw = Math.hypot(c1[0] - c0[0], 0) || 1;
    if (lw < 1.2) return;
    const hal = lw * 1.4;
    let bx0 = Math.floor(Math.min(c0[0], bulbe[0] - hal)) - 2, bx1 = Math.ceil(Math.max(c1[0], bulbe[0] + hal)) + 2, by0 = Math.floor(Math.min(haut[1], c0[1])) - 2, by1 = Math.ceil(Math.max(c1[1], bulbe[1] + hal)) + 2;
    if (bx1 - bx0 <= 0 || by1 - by0 <= 0 || bx1 - bx0 > 4000 || by1 - by0 > 4000) return;
    /* N1 (quatorzième passe) : la boîte rognée à l'écran (2 px de marge) : de près, le canevas de travail dépassait l'écran
       (695 x 1152) ; même dessin, mêmes coordonnées */
    { const We = c.canvas.width / dpr, He = c.canvas.height / dpr; bx0 = Math.max(bx0, -2); by0 = Math.max(by0, -2); bx1 = Math.min(bx1, Math.ceil(We) + 2); by1 = Math.min(by1, Math.ceil(He) + 2); }
    const bw = bx1 - bx0, bh = by1 - by0; if (bw <= 0 || bh <= 0) return;
    const tw = Math.ceil(bw * dpr), th = Math.ceil(bh * dpr);
    if (lampeTmp.width < tw || lampeTmp.height < th) { lampeTmp.width = Math.max(lampeTmp.width, tw); lampeTmp.height = Math.max(lampeTmp.height, th); }
    ltg.setTransform(1, 0, 0, 1, 0, 0); ltg.globalCompositeOperation = 'source-over'; ltg.globalAlpha = 1; ltg.clearRect(0, 0, tw, th);
    /* lampe -> écran -> canevas de travail */
    const A = P(0, 0), B = P(w, 0), C = P(0, h);
    ltg.setTransform(dpr * (B[0] - A[0]) / w, dpr * (B[1] - A[1]) / w, dpr * (C[0] - A[0]) / h, dpr * (C[1] - A[1]) / h, dpr * (A[0] - bx0), dpr * (A[1] - by0));
    /* K11 : la pièce vue par le vitrage est la photo de la table, qui porte sa lampe : une seule lampe ; la lampe détourée
       ne sert plus qu'à l'allumage (le halo de l'ampoule qui monte à 0,700), posé exactement sur celle de la photo */
    if (!K11.actif) {
      /* le câble, prolongé vers le plafond (la tranche du câble, étirée) */
      ltg.drawImage(vLampe.image, cxC - 8, sHaut + 2, 16, 4, cxC - 8, sHaut - h * 1.6, 16, h * 1.6 + 2);
      /* la lampe éteinte est préparée pendant les temps morts ; tant qu'elle ne l'est pas, l'image allumée assombrie */
      const et = I < .999 ? lampeEteinte : null;
      if (et) ltg.drawImage(et, 0, sHaut, w, h - sHaut, 0, sHaut, w, h - sHaut);
      else if (I < .999) { ltg.save(); ltg.globalAlpha = 1; ltg.drawImage(vLampe.image, 0, sHaut, w, h - sHaut, 0, sHaut, w, h - sHaut); ltg.globalCompositeOperation = 'source-atop'; ltg.fillStyle = 'rgba(36,34,32,.85)'; ltg.fillRect(0, h * .82, w, h * .18); ltg.restore(); }
      if (I > .001) { ltg.globalAlpha = Math.min(1, I); ltg.drawImage(vLampe.image, 0, sHaut, w, h - sHaut, 0, sHaut, w, h - sHaut); ltg.globalAlpha = 1; }
    }
    /* le halo de l'ampoule, doux, dans l'air de la pièce */
    if (I > .002) {
      ltg.setTransform(dpr, 0, 0, dpr, -dpr * bx0, -dpr * by0); ltg.globalCompositeOperation = 'lighter';
      const hg = ltg.createRadialGradient(bulbe[0], bulbe[1], 0, bulbe[0], bulbe[1], hal);
      const kh = K11.actif ? .7 : 1;
      hg.addColorStop(0, rgba(col, .5 * I * kh)); hg.addColorStop(.18, rgba(col, .2 * I * kh)); hg.addColorStop(.55, rgba([255, 180, 110], .05 * I * kh)); hg.addColorStop(1, rgba([255, 170, 100], 0));
      ltg.fillStyle = hg; ltg.fillRect(bx0, by0, bw, bh);
      ltg.globalCompositeOperation = 'source-over';
    }
    /* la vitre : le masque des carreaux (ou de l'ouverture, porte ouverte), posé par la façade autour de la lampe */
    const Li = appl(inv3(Hm), bulbe[0], bulbe[1]), ma = appl(Hm, Li[0], Li[1]), mb = appl(Hm, Li[0] + 50, Li[1]), mc = appl(Hm, Li[0], Li[1] + 50);
    ltg.setTransform(dpr * (mb[0] - ma[0]) / 50, dpr * (mb[1] - ma[1]) / 50, dpr * (mc[0] - ma[0]) / 50, dpr * (mc[1] - ma[1]) / 50, dpr * (ma[0] - bx0 - (mb[0] - ma[0]) / 50 * Li[0] - (mc[0] - ma[0]) / 50 * Li[1]), dpr * (ma[1] - by0 - (mb[1] - ma[1]) / 50 * Li[0] - (mc[1] - ma[1]) / 50 * Li[1]));
    ltg.globalCompositeOperation = 'destination-in';
    ltg.drawImage(mobiles && kCourant > .02 ? masquePorte(kPiece) : masqueVitre, 0, 0, W, H);
    ltg.globalCompositeOperation = 'source-over'; ltg.setTransform(1, 0, 0, 1, 0, 0);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = alpha; c.drawImage(lampeTmp, 0, 0, tw, th, bx0 * dpr, by0 * dpr, tw, th); c.restore();
  }
  /* la nappe de lumière chaude sur la marche du seuil et les premières dalles : elle passe par les vitres de la porte,
     puis, plus franche, par la porte ouverte ; discrète (c'est le matin) */
  function nappe(c, pj, I, col) {
    if (I <= .002) return;
    const k = kCourant, cx = (x0 + x1) / 2;
    const C = pj(cx, sol, .55 + .35 * k), R = pj(cx + (lw * 1.15 + .2 / kF), sol, .55 + .35 * k), F = pj(cx, sol, 1.75 + .5 * k);
    if (!C || !R || !F) return;
    /* seulement devant la façade */
    const zone = [pj(cx - 2.4 / kF, sol, 0), pj(cx + 2.4 / kF, sol, 0), pj(cx + 2.4 / kF, sol, 3), pj(cx - 2.4 / kF, sol, 3)];
    if (zone.some(q => !q)) return;
    c.save();
    c.beginPath(); zone.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.clip();
    c.transform(R[0] - C[0], R[1] - C[1], F[0] - C[0], F[1] - C[1], C[0], C[1]);
    const g = c.createRadialGradient(0, -.25, 0, 0, 0, 1);
    g.addColorStop(0, rgba(col, (.2 + .2 * k) * I)); g.addColorStop(.45, rgba(col, (.1 + .1 * k) * I)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  return { placer, devant, silhouette, lumiere, lampeObjet, nappe, piece: pieceFacade, piecePrete: () => piece, lampe: lampeEtat, elements: tous, image, mobiles, porte: P, sol, k11: K11, vitrage: VITRAGE };
}
