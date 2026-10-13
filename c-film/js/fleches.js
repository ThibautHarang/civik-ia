/* =====================================================================
   Les textes des flèches du poteau (sixième passe, F19 et F20) : gravés
   dans le bois et vieillis. Capitales larges d'enseigne peinte, chaque
   lettre un peu désalignée ; le creux de la lettre plus sombre (bois nu),
   une peinture ancienne au fond, délavée et écaillée par endroits, le fil
   du bois qui traverse les lettres ; l'ombre portée interne vers le bas
   droit, la lumière sur l'arête haut gauche. En SVG, posé en perspective
   sur la flèche comme avant (620 x 124). Le mot et le sous-mot viennent
   des réglages (TEXTES, dans temps.js).
   ===================================================================== */
import { rng, bruit2, fbm } from './outils.js';
import { liberer } from './memoire.js';
import { LOURD } from './lavis.js';

const W = 620, H = 124;
let compte = 0;

/* le filtre de gravure ; usure de 0 (peinture presque entière) à 1 (presque effacée) */
function filtre(id, graine, usure, k) {
  const seuil = (1.55 + 1.6 * usure).toFixed(2), a = (2.6 * k).toFixed(2), b = (3.2 * k).toFixed(2), c = (1.8 * k).toFixed(2), d = (2.2 * k).toFixed(2), e = (1.3 * k).toFixed(2), f = (1.5 * k).toFixed(2);
  return `<filter id="${id}" x="-4%" y="-30%" width="108%" height="160%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.055 0.085" numOctaves="3" seed="${graine}" result="bruit"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.3" numOctaves="2" seed="${graine + 7}" result="fil"/>
    <feColorMatrix in="bruit" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4.2 0 0 0 -${seuil}" result="ecaille"/>
    <feColorMatrix in="fil" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.5 0 0 0 -.12" result="grain"/>
    <feColorMatrix in="fil" type="matrix" values="0 0 0 0 1  0 0 0 0 .95  0 0 0 0 .86  2.2 0 0 0 -1.15" result="filClair"/>
    <feFlood flood-color="#4a3420" flood-opacity="${(.3 + .1 * usure).toFixed(2)}"/><feComposite in2="SourceAlpha" operator="in" result="creux"/>
    <feComposite in="filClair" in2="SourceAlpha" operator="in" result="creuxFil"/>
    <feFlood flood-color="#1c140c" flood-opacity="${(.94 - .3 * usure).toFixed(2)}"/><feComposite in2="SourceAlpha" operator="in" result="p0"/>
    <feComposite in="p0" in2="ecaille" operator="in" result="p1"/>
    <feComposite in="p1" in2="grain" operator="in" result="peinture"/>
    <feOffset in="SourceAlpha" dx="${a}" dy="${b}" result="o1"/><feComposite in="SourceAlpha" in2="o1" operator="out" result="b1"/>
    <feGaussianBlur in="b1" stdDeviation="${(.9 * k).toFixed(2)}" result="b1f"/><feComposite in="b1f" in2="SourceAlpha" operator="in" result="b1c"/>
    <feFlood flood-color="#140b05" flood-opacity=".72"/><feComposite in2="b1c" operator="in" result="ombre"/>
    <feOffset in="SourceAlpha" dx="-${c}" dy="-${d}" result="o2"/><feComposite in="SourceAlpha" in2="o2" operator="out" result="b2"/>
    <feGaussianBlur in="b2" stdDeviation="${(.7 * k).toFixed(2)}" result="b2f"/><feComposite in="b2f" in2="SourceAlpha" operator="in" result="b2c"/>
    <feFlood flood-color="#f1e2c4" flood-opacity=".34"/><feComposite in2="b2c" operator="in" result="paroi"/>
    <feOffset in="SourceAlpha" dx="-${e}" dy="-${f}" result="o3"/><feComposite in="o3" in2="SourceAlpha" operator="out" result="b3"/>
    <feGaussianBlur in="b3" stdDeviation="${(.6 * k).toFixed(2)}" result="b3f"/>
    <feFlood flood-color="#fff7e6" flood-opacity=".62"/><feComposite in2="b3f" operator="in" result="arete"/>
    <feMerge><feMergeNode in="creux"/><feMergeNode in="creuxFil"/><feMergeNode in="peinture"/><feMergeNode in="paroi"/><feMergeNode in="ombre"/><feMergeNode in="arete"/></feMerge>
  </filter>`;
}
/* un mot, lettre par lettre : hauteur et inclinaison de chaque lettre très légèrement différentes */
function mot(txt, cx, y, taille, largeur, R) {
  const ch = Array.from(txt.toUpperCase());
  const ys = ch.map(() => (y + (R() - .5) * taille * .05).toFixed(1)).join(' ');
  const rot = ch.map(() => ((R() - .5) * 3.6).toFixed(1)).join(' ');
  return `<text x="${(cx - largeur / 2).toFixed(1)}" y="${ys}" rotate="${rot}" font-family="Poppins, Inter, sans-serif" font-weight="800" font-size="${taille}" textLength="${largeur}" lengthAdjust="spacing">${ch.join('').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
}
/* le contenu de la flèche : un mot, et au besoin un second plus petit, presque effacé, dessous */
export function flecheGravee(texte, sous, graine) {
  const R = rng(graine), n = ++compte, id1 = 'grave-' + n, id2 = 'grave-s-' + n;
  const lettres = Array.from(texte).length, taille = sous ? 50 : 58;
  const largeur = Math.min(440, taille * .74 * lettres + 10);
  const y = sous ? 66 : 82;
  let svg = `<svg class="fleche-gravee" viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs>${filtre(id1, graine, .05, 1)}${sous ? filtre(id2, graine + 3, .72, .55) : ''}</defs>`;
  svg += `<g filter="url(#${id1})" fill="#000" transform="translate(${W / 2} 0) scale(1.08 1) translate(${-W / 2} 0)">${mot(texte, W / 2, y, taille, largeur, R)}</g>`;
  if (sous) svg += `<g filter="url(#${id2})" fill="#000" opacity=".8">${mot(sous, W / 2 + 6, 104, 22, Math.min(170, 22 * .72 * Array.from(sous).length + 16), R)}</g>`;
  return svg + '</svg>';
}

/* N4 (quatorzième passe) : sur l'iPhone, les mots gravés des flèches n'apparaissaient pas (« L'Horizon et Atelier sont
   effacés ») : le filtre SVG de la gravure (bruit, matrices de couleur, flous) posé sur un élément en perspective n'est pas
   rendu de façon sûre par Safari sur iPhone. Sur téléphone, la gravure est donc peinte une fois dans un canevas, avec les
   mêmes couches que le filtre (le creux brun, le fil clair du bois dans le creux, la peinture sombre écaillée, l'ombre
   portée interne en bas à droite, la paroi éclairée et l'arête claire en haut à gauche), les mêmes lettres (même tirage,
   même désalignement), la même police (Poppins 800, chargée par la page) ; densité k (pixels par unité de la flèche). */
function lettresMot(g, txt, cx, y, taille, largeur, R) {
  const ch = Array.from(txt.toUpperCase());
  const ys = ch.map(() => y + (R() - .5) * taille * .05), rot = ch.map(() => (R() - .5) * 3.6 * Math.PI / 180);
  g.font = `800 ${taille}px Poppins, Inter, sans-serif`; g.textBaseline = 'alphabetic';
  const ws = ch.map(c => g.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0), esp = ch.length > 1 ? (largeur - tot) / (ch.length - 1) : 0;
  let x = cx - largeur / 2;
  ch.forEach((c, i) => { g.save(); g.translate(x, ys[i]); g.rotate(rot[i]); g.fillText(c, 0, 0); g.restore(); x += ws[i] + esp; });
}
const TMP = [];
const toile = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; TMP.push(c); return c; };
function coucheMot(k, dessiner) { const c = toile(1, 1); c.width = Math.round(W * k); c.height = Math.round(H * k); const g = c.getContext('2d'); g.scale(k, k); g.fillStyle = '#000'; dessiner(g); return c; }
/* P4 (seizième passe) : le même mot gravé, par étapes (les deux bruits par bandes de 16 rangées, puis chaque couche) : d'un
   bloc, il prenait 12 à 46 ms sur téléphone ; flecheGraveeCanvas le mène d'une traite (même résultat) */
export function flecheGraveeCanvas(texte, sous, graine, k = 2) { const o = {}; for (const _ of flecheGraveeEtapes(texte, sous, graine, k, o)) { /* rien */ } return o.c; }
export function* flecheGraveeEtapes(texte, sous, graine, k = 2, sortieE = {}) {
  const lettres = Array.from(texte).length, taille = sous ? 50 : 58;
  const largeur = Math.min(440, taille * .74 * lettres + 10), y = sous ? 66 : 82;
  /* le même tirage que le SVG : le second mot continue la suite du premier (deux tirages par lettre) */
  const R2 = rng(graine); for (let i = 0; i < 2 * lettres; i++) R2();
  const motA = g => { g.save(); g.translate(W / 2, 0); g.scale(1.08, 1); g.translate(-W / 2, 0); lettresMot(g, texte, W / 2, y, taille, largeur, rng(graine)); g.restore(); };
  const motB = sous ? (g => lettresMot(g, sous, W / 2 + 6, 104, 22, Math.min(170, 22 * .72 * Array.from(sous).length + 16), R2)) : null;
  const sortie = document.createElement('canvas'); sortie.width = Math.round(W * k); sortie.height = Math.round(H * k);
  const so = sortie.getContext('2d');
  const graver = function* (mot, usure, kf, opacite, graineB) {
    const A = coucheMot(k, mot), w = A.width, h = A.height;
    const bruit = bruit2(graineB), fil = bruit2(graineB + 7);
    /* les deux bruits (écaille de la peinture, fil du bois), calculés à demi-résolution, lissés à l'agrandissement */
    const nw = Math.ceil(w / 2), nh = Math.ceil(h / 2), N = document.createElement('canvas'); N.width = nw; N.height = nh;
    const ng = N.getContext('2d'), im = ng.createImageData(nw, nh), d = im.data, seuil = 1.55 + 1.6 * usure;
    const F2 = toile(nw, nh); const fg2 = F2.getContext('2d'), im2 = fg2.createImageData(nw, nh), d2 = im2.data;
    const G3 = toile(nw, nh); const gg3 = G3.getContext('2d'), im3 = gg3.createImageData(nw, nh), d3 = im3.data;
    const cl = x => Math.max(0, Math.min(1, x));
    for (let j = 0; j < nh; j++) { if (j && j % 16 === 0) yield; for (let i = 0; i < nw; i++) {
      const u = i * 2 / k, v = j * 2 / k, o = (j * nw + i) * 4;
      /* les mêmes fréquences que les bruits du filtre SVG (écaille 0,055 x 0,085 ; fil 0,0035 x 0,3), le bruit de valeur
         ramené à l'étendue de celui du SVG (autour de 0,5, plus contrasté) */
      const e = .5 + (fbm(bruit, u * .055, v * .085, 3) - .5) * 1.9, f = .5 + (fbm(fil, u * .0035 * 3, v * .3, 2) - .5) * 1.9;
      d[o + 3] = 255 * cl(4.2 * e - seuil);
      d2[o] = 255; d2[o + 1] = 242; d2[o + 2] = 219; d2[o + 3] = 255 * cl(2.2 * f - 1.15);
      d3[o + 3] = 255 * cl(1.5 * f - .12);
    } }
    ng.putImageData(im, 0, 0); fg2.putImageData(im2, 0, 0); gg3.putImageData(im3, 0, 0);
    yield;
    const T = toile(w, h); const t = T.getContext('2d');
    const decale = (dx, dy) => { const c = toile(w, h); const g = c.getContext('2d'); g.drawImage(A, dx * k * kf, dy * k * kf); return c; };
    const bord = (dx, dy, dedans) => { const c = toile(w, h); const g = c.getContext('2d');
      if (dedans) { g.drawImage(A, 0, 0); g.globalCompositeOperation = 'destination-out'; g.drawImage(decale(dx, dy), 0, 0); }
      else { g.drawImage(decale(dx, dy), 0, 0); g.globalCompositeOperation = 'destination-out'; g.drawImage(A, 0, 0); }
      return c; };
    const flou = (c, r) => { const b = toile(w, h); const g = b.getContext('2d'); g.shadowColor = '#000'; g.shadowBlur = r * k * kf * 1.6; g.shadowOffsetX = w; g.drawImage(c, -w, 0); return b; };
    const teinte = (c, coul, a) => { const b = toile(w, h); const g = b.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = coul; g.globalAlpha = a; g.fillRect(0, 0, w, h); return b; };
    /* le creux (bois nu, plus sombre), et le fil clair du bois dans le creux */
    t.drawImage(teinte(A, '#4a3420', .3 + .1 * usure), 0, 0);
    { const c = toile(w, h); const g = c.getContext('2d'); g.drawImage(F2, 0, 0, w, h); g.globalCompositeOperation = 'destination-in'; g.drawImage(A, 0, 0); t.drawImage(c, 0, 0); }
    /* la peinture ancienne, écaillée par endroits */
    { const c = teinte(A, '#1c140c', .94 - .3 * usure), g = c.getContext('2d'); g.globalCompositeOperation = 'destination-in'; g.drawImage(N, 0, 0, w, h); g.drawImage(G3, 0, 0, w, h); t.drawImage(c, 0, 0); }
    /* P4 bis : les couches de la gravure sont des étapes LOURD (voir lavis.js) : sur téléphone, dans WebKit, le creux et la
       peinture coûtaient 11 ms au processus graphique après l'étape, les trois ombres ensemble 10 ms ; une ombre par étape */
    yield LOURD;
    /* la paroi éclairée (haut gauche, dedans), l'ombre portée interne (bas droit, dedans), l'arête claire (dehors) */
    { const c = teinte(flou(bord(-1.8, -2.2, true), .7), '#f1e2c4', .34), g = c.getContext('2d'); g.globalCompositeOperation = 'destination-in'; g.drawImage(A, 0, 0); t.drawImage(c, 0, 0); }
    yield LOURD;
    { const c = teinte(flou(bord(2.6, 3.2, true), .9), '#140b05', .72), g = c.getContext('2d'); g.globalCompositeOperation = 'destination-in'; g.drawImage(A, 0, 0); t.drawImage(c, 0, 0); }
    yield LOURD;
    t.drawImage(teinte(flou(bord(-1.3, -1.5, false), .6), '#fff7e6', .62), 0, 0);
    yield LOURD;
    so.globalAlpha = opacite; so.drawImage(T, 0, 0); so.globalAlpha = 1;
  };
  yield* graver(motA, .05, 1, 1, graine);
  if (motB) { yield; yield* graver(motB, .72, .55, .8, graine + 3); }
  /* les canevas de travail rendent leur mémoire tout de suite */
  liberer(...TMP); TMP.length = 0;
  sortieE.c = sortie;
}
