/* =====================================================================
   Page Conseil (maquette du 06/10/2026).
   1. Le croisement : le monde gravé peint une fois dans un canevas (le
      lointain, le sol et ses rangs de vigne, les chemins en vraie
      perspective avec la texture du chemin du film), le poteau réel, ses
      deux flèches gravées, le CV du film cloué au milieu ; à gauche, un
      chemin qui se perd dans la brume ; à droite (CO-5, 06/10/2026), un
      chemin qui arrive à un ruisseau, où une passerelle se construit à
      la plume, puis repart de l'autre côté vers les collines.
   2. La route du déroulé, tracée à la plume au défilement.
   3. La fiche de demande qui s'écrit pendant que l'on répond.
   Ne bouge que transform et opacity, sauf la révélation de la couleur
   (un petit élément). Mouvement réduit : tout est posé, rien ne bouge.
   ===================================================================== */
import { $, $$, clamp, lerp, reduit, chargerImage, demarrer, observer, Fiche, verifierChamp, formulaireCourt, copier, AUJOURDHUI, envoiReel, envoyerFiche } from '../commun/pages/pages.js';
import { mesurer } from '../commun/pages/mesures.js';   /* P4 : formulaire_etape, valeurs fermées */   /* R7 : envoyerFiche, le mécanisme commun */
import { Dessin, ligne, arcE, perimetre, formeMain, hachures, catmull, rng, eEntree, eDepl, gribouillis } from '../commun/pages/plume.js';
import { preparerCv, LOGO_D } from './cv.js';
import { Passerelle, peindreRuisseau, REPOS, PASS } from './passerelle.js';
import { plaqueLaiton, epingle as epinglerQuad } from './plaque.js';
import { ecriture } from './ecriture.js';

demarrer();

const DOSSIER = '../commun/img/c/';
const ENCRE = '#16205C', GRAV = [96, 99, 123];
const sec = $('.croisement'), scene = $('[data-scene]');
const cMonde = $('[data-monde]'), cLavis = $('[data-lavis]'), cLavisLoin = $('[data-lavis-loin]'), cLoinSol = $('[data-loin-sol]');
const poteau = $('[data-poteau]'), imgPoteau = $('.poteau__img');
let MAN = null, IMG = {}, CV = null, L = null;

/* ---------------------------------------------------------------------
   Les flèches gravées (recopié de c-film/js/fleches.js)
   --------------------------------------------------------------------- */
function filtreGrave(id, graine, usure, k) {
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
/* CO-22 (troisième passe, 06/10/2026) : les deux libellés, dans une seule table, pour les changer en une ligne (Thibaut
   hésite encore avec « Seul » et « Avec moi ») : la flèche du haut, sans moi ; celle du bas, avec moi. « texte » est gravé
   sur la flèche et lu comme nom du bouton ; « lu » est la description lue par les lecteurs d'écran. */
export const LIBELLES = {
  g: { texte: 'Décider seul', lu: 'un chemin qui se perd dans la brume, il ne mène nulle part' },
  d: { texte: 'Être accompagné', lu: 'un chemin qui mène de l’autre côté, un pont se construit et le jour se lève' }   /* R2 : apostrophe typographique */
};
/* CO-4 : les deux flèches ont la même taille de lettres et le même interlettrage (0,1 em) ; plus d'étirement au
   textLength : chaque lettre est posée à sa place mesurée. La taille est la plus grande qui laisse tenir la plus longue
   des deux inscriptions (quinze caractères, « Être accompagné ») sur la planche, 470 unités sur 620, et au plus 54. */
const FL_W = 620, FL_LARGEUR = 470, FL_ESP = .1;
const mesureFl = document.createElement('canvas').getContext('2d');
function avances(texte, taille) {
  mesureFl.font = `800 ${taille}px Poppins, Inter, sans-serif`;
  const ch = Array.from(texte.toUpperCase()); let acc = 0, prec = '';
  /* l'avance de chaque lettre, crénage compris (mesure de la paire moins celle de la lettre précédente) */
  return ch.map(c => { const x = acc; const w = mesureFl.measureText(prec + c).width - (prec ? mesureFl.measureText(prec).width : 0); acc += w + FL_ESP * taille; prec = c; return { c, x, w }; });
}
function tailleFleches(textes) {
  const larg = t => { const a = avances(t, 100), d = a[a.length - 1]; return d.x + d.w; };
  return Math.min(54, ...textes.map(t => 100 * FL_LARGEUR / larg(t)));
}
function flecheGravee(texte, graine, n, taille) {
  const R = rng(graine), W = FL_W, H = 124, y = 62 + taille * .34;
  const a = avances(texte, taille), largeur = a[a.length - 1].x + a[a.length - 1].w, x0 = W / 2 - largeur / 2;
  const xs = a.map(l => (x0 + l.x).toFixed(1)).join(' ');
  const ys = a.map(() => (y + (R() - .5) * taille * .05).toFixed(1)).join(' ');
  const rot = a.map(() => ((R() - .5) * 3.6).toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs>${filtreGrave('grave-c-' + n, graine, .05, 1)}</defs><g filter="url(#grave-c-${n})" fill="#000" transform="translate(${W / 2} 0) scale(1.08 1) translate(${-W / 2} 0)"><text x="${xs}" y="${ys}" rotate="${rot}" font-family="Poppins, Inter, sans-serif" font-weight="800" font-size="${taille.toFixed(2)}">${a.map(l => l.c).join('').replace(/'/g, '&#39;')}</text></g></svg>`;
}

/* ---------------------------------------------------------------------
   La mise en place : le poteau, la caméra, les chemins
   --------------------------------------------------------------------- */
/* R4 : la ligne de l'image du poteau où commence le bois (première ligne opaque de poteau-planche.webp : 58 sur 1200) */
const HAUT_BOIS = 58 / 1200;
/* R4 : la couleur du fond de la section (son dégradé, page.css) à une fraction de sa hauteur, pour le fondu du haut de la scène */
const FOND_SECTION = [[0, [236, 239, 240]], [.38, [242, 241, 236]], [.62, [246, 243, 236]], [1, [247, 244, 237]]];
function couleurFond(t) {
  t = clamp(t); let i = 0; while (i < FOND_SECTION.length - 2 && t > FOND_SECTION[i + 1][0]) i++;
  const [a, ca] = FOND_SECTION[i], [b, cb] = FOND_SECTION[i + 1], k = (t - a) / (b - a || 1);
  return ca.map((v, j) => Math.round(lerp(v, cb[j], k)));
}
function calculer() {
  const W = scene.clientWidth, mob = W < 768;
  const P = MAN['poteau-planche'];
  const cvW = mob ? clamp(W * .47, 168, 210) : clamp(W * .2, 238, 318);
  const iw = cvW / (P.cv[1][0] - P.cv[0][0]), ih = iw * P.taille[1] / P.taille[0];
  let H, postX, imgTop;
  if (mob) {
    /* R4 (finitions du 07/10/2026) : le haut du poteau n'est plus caché sous le bouton : le haut du bois (à 4,83 % de la
       hauteur de l'image, mesuré sur poteau-planche.webp) est posé 18 px sous le haut de la scène, dans le fondu du ciel
       (il était 7 px au-dessus, sous le bouton « Trente minutes pour en parler ») */
    /* CO-23 (quatrième passe, 07/10/2026) : le poteau centré : l'axe du poteau (son pied) au milieu de l'écran ; la
       planche, le CV et les deux flèches tiennent entiers (les flèches débordent de 0,2 largeur d'image de part et d'autre) */
    postX = W / 2; imgTop = -HAUT_BOIS * ih + 18;
    H = Math.round(imgTop + P.planche[2][1] * ih + 215);
    scene.style.setProperty('--scene-h', H + 'px');
  } else {
    H = scene.clientHeight;
    postX = clamp(W * .6, 640, W - 470);
    const hautPlanche = clamp(H * .36, 300, 372);
    imgTop = hautPlanche - P.planche[0][1] * ih;
  }
  /* CO-6 : le poteau calé sur les pixels de l'écran (la plaque, posée dedans, l'est aussi) */
  const dprP = Math.min(3, Math.max(1, devicePixelRatio || 1));
  const imgLeft = Math.round((postX - P.pied[0] * iw) * dprP) / dprP; imgTop = Math.round(imgTop * dprP) / dprP;
  const bord = { g: imgLeft + P.planche[0][0] * iw, d: imgLeft + P.planche[1][0] * iw, b: imgTop + P.planche[2][1] * ih, h: imgTop + P.planche[0][1] * ih };
  /* l'horizon et la caméra : le bas de l'écran est à Zb mètres, l'œil à 1,60 m */
  const y0 = mob ? bord.b - 30 : Math.round(H * .6), hc = 1.6, Zb = mob ? 4.4 : 5;
  const f = (H - y0) * Zb / hc, cx = W / 2;
  const proj = (X, Z) => [cx + f * X / Z, y0 + f * hc / Z];
  const Zf = Zb * 1.1, Xf = (postX - cx) * Zf / f;
  /* le chemin de gauche se perd vers l'horizon ; celui de droite mène au ruisseau et à sa passerelle */
  const vxG = mob ? -W * .2 : W * .2;
  const sG = (vxG - cx) / f;
  const yh = mob ? bord.b + 118 : y0 + (H - y0) * .16;
  const Zh0 = f * hc / (yh - y0);
  /* CO-5 : la passerelle, au bout du chemin de droite, à l'endroit et à peu près à la largeur du premier dessin. Elle est vue par la caméra de la scène
     (même point de fuite cx, y0) : à la profondeur Zp qui donne à ses 6,6 m cette largeur à l'écran, et d'une hauteur
     d'œil hp qui pose sa berge sur le sol à la hauteur voulue (sur ordinateur, hp vaut à peu près 1,60 m : c'est la
     caméra du monde ; sur téléphone, la scène est vue d'un peu plus haut). proj3 : modèle (m) -> écran. */
  /* (entre 768 et 1000 px de large, la planche couvre la droite : la passerelle garde une largeur lisible et reste dans l'écran) */
  /* CO-23 : sur téléphone, la passerelle se décale à droite du poteau centré (le bois fait 0,08 largeur d'image : elle
     commence 34 px après l'axe) et se resserre pour garder 14 px de marge ; le chemin de droite et le village suivent */
  const largeurPont = mob ? Math.min(W * .36, W - postX - 48) : Math.max(130, Math.min(W - bord.d - 100, f * PASS.L / Zh0));
  const xPont = mob ? postX + 34 : Math.min(bord.d + 30, W - largeurPont - 40);
  const Zp = f * PASS.L / largeurPont, hp = (yh - y0) * Zp / f, Xp = (xPont - cx) * Zp / f;
  const proj3 = (x, y, z) => [cx + f * (Xp + x) / (Zp + z), y0 + f * (hp - y) / (Zp + z)];
  /* le chemin de droite arrive au pied de la culée de gauche */
  const xh = proj3(-.05, 0, 0)[0];
  const Zh = Zh0, Xh = (xh - cx) * Zh / f;
  return { W, H, mob, P, iw, ih, imgLeft, imgTop, postX, bord, y0, hc, f, cx, proj, Zb, Zf, Xf, sG, vxG, xh, yh, Zh, Xh, largeurPont, xPont, Zp, hp, Xp, proj3 };
}
/* la ligne médiane d'une branche, en mètres : X(Z), avec un léger sinueux */
function branche(L, cote) {
  const pts = [];
  const Zmax = cote === 'g' ? 900 : L.Zh;
  for (let Z = L.Zb * .8; Z <= Zmax; Z *= 1.035) {
    const t = Z - L.Zf;
    let X;
    if (cote === 'g') X = L.Xf + L.sG * t + Math.sin(t * .09) * Math.min(1, t / 8) * 1.4 - (t > 0 ? 0 : 0);
    else { const sD = (L.Xh - L.Xf) / (L.Zh - L.Zf); X = L.Xf + sD * t + Math.sin(t * .16 + .6) * Math.min(1, t / 6) * Math.max(0, 1 - t / (L.Zh - L.Zf)) * 1.6; }
    if (Z < L.Zf) X = L.Xf + (Z - L.Zf) * (cote === 'g' ? -.25 : .25) * 0;
    pts.push([X, Z]);
  }
  /* CO-5 : le chemin de droite garde sa largeur jusqu'à la culée (plus d'amincissement : il continue sur la passerelle) */
  if (cote === 'd') pts.push([L.Xh, L.Zh]);
  return pts;
}
function bordsChemin(L, pts, demi) {
  const g = [], d = [];
  pts.forEach(([X, Z], i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dz = b[1] - a[1]; const n = Math.hypot(dx, dz) || 1; dx /= n; dz /= n;
    const fin = pts.fin ? clamp((pts.fin - Z) / (pts.fin * .12)) : 1;
    const w = demi * (1 + .12 * Math.sin(Z * .7)) * (.35 + .65 * fin);
    g.push(L.proj(X - dz * w, Z + dx * w)); d.push(L.proj(X + dz * w, Z - dx * w));
  });
  return { g, d };
}

/* ---------------------------------------------------------------------
   Le monde gravé, peint une fois
   --------------------------------------------------------------------- */
const encre = a => `rgba(${GRAV[0]},${GRAV[1]},${GRAV[2]},${a})`;
function peindreMonde() {
  const { W, H, y0, f, hc, cx, proj, mob } = L;
  const dpr = Math.min(2, devicePixelRatio || 1);
  cMonde.width = Math.round(W * dpr); cMonde.height = Math.round(H * dpr);
  const g = cMonde.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  const R = rng(91);
  /* le lointain, posé sur l'horizon, et une seconde ligne de collines plus pâle */
  const lo = IMG.lointain, ml = MAN.lointain;
  L.crete = null;
  if (lo) {
    const s = Math.max(W * 1.18, 900) / lo.naturalWidth, lw = lo.naturalWidth * s, lh = lo.naturalHeight * s;
    const top = y0 + 6 - ml.bas_du_dessin * lh;
    const pale = [W - lw * .9, top - lh * .06, lw * .9, lh * .9], plein = [(W - lw) / 2 - W * .04, top, lw, lh];
    /* CO-17 : la crête des collines, lue une fois sur une copie réduite (le haut de leur encre, colonne par colonne, comme
       le profil de crête du film) ; sous la crête, les collines sont pleines : le fond de la scène y est peint, et le ciel,
       le soleil et les nuages, posés derrière le monde, ne passent qu'au-dessus */
    try {
      const q = 3, cw = Math.ceil(W / q), chh = Math.ceil((y0 + 8) / q), tc = document.createElement('canvas'); tc.width = cw; tc.height = chh;
      const tg = tc.getContext('2d', { willReadFrequently: true }); tg.scale(1 / q, 1 / q);
      tg.globalAlpha = .55; tg.drawImage(lo, ...pale); tg.globalAlpha = 1; tg.drawImage(lo, ...plein);
      const d = tg.getImageData(0, 0, cw, chh).data, brut = new Float32Array(cw), prof = new Float32Array(cw);
      for (let x = 0; x < cw; x++) { let yy = chh; for (let r = 0; r < chh; r++) if (d[(r * cw + x) * 4 + 3] > 46) { yy = r; break; } brut[x] = Math.min(yy * q, y0 + 4); }
      for (let x = 0; x < cw; x++) { let m = 1e9; for (let k = -2; k <= 2; k++) m = Math.min(m, brut[clamp(x + k, 0, cw - 1)]); prof[x] = m; }
      L.crete = prof; L.creteQ = q;
      const off = L.mob ? scene.offsetTop : 0, hS = sec.offsetHeight || H;
      const fond = g.createLinearGradient(0, -off, 0, hS - off);
      [[0, '#eceff0'], [.38, '#f2f1ec'], [.62, '#f6f3ec'], [1, '#f7f4ed']].forEach(([o, c]) => fond.addColorStop(o, c));
      g.beginPath(); g.moveTo(0, y0 + 6); for (let x = 0; x < cw; x++) g.lineTo(x * q, prof[x] + 2); g.lineTo(W, prof[cw - 1] + 2); g.lineTo(W, y0 + 6); g.closePath();
      g.fillStyle = fond; g.fill();
    } catch (e) { L.crete = null; }
    g.save(); g.globalAlpha = .55; g.drawImage(lo, ...pale); g.restore();
    g.drawImage(lo, ...plein);
  }
  /* le sol : du papier, un léger dégradé, les rangs de vigne gravés en hachures */
  const sol = g.createLinearGradient(0, y0, 0, H); sol.addColorStop(0, 'rgba(247,244,237,0)'); sol.addColorStop(.04, 'rgba(246,243,235,.96)'); sol.addColorStop(1, 'rgba(241,236,224,1)');
  g.fillStyle = sol; g.fillRect(0, y0 - 2, W, H - y0 + 2);
  /* les rangs : des droites du sol vers deux points de fuite, coupées en traits de gravure */
  const rangs = (fuiteX, deX, aX, pas, graine) => {
    const r = rng(graine);
    for (let X = deX; (pas > 0 ? X < aX : X > aX); X += pas) {
      /* un rang : ligne de (X, Zb) vers le point de fuite, découpée */
      const p0 = proj(X, L.Zb * .9), n = 26;
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + .55 + r() * .3) / n;
        const q = t => Math.pow(t, 1.9);
        const xa = lerp(p0[0], fuiteX, q(t0)), ya = lerp(p0[1], y0, q(t0)), xb = lerp(p0[0], fuiteX, q(t1)), yb = lerp(p0[1], y0, q(t1));
        if (ya < y0 + 3) break;
        const prof = (ya - y0) / (H - y0);
        if (prof > .62) continue;
        g.strokeStyle = encre(.1 + .32 * prof); g.lineWidth = .5 + 1.5 * prof; g.beginPath(); g.moveTo(xa, ya); g.lineTo(xb, yb); g.stroke();
        /* les ceps, petits traits verticaux le long du rang */
        if (prof > .05 && r() < .7) { const h = 1.5 + 11 * prof; g.lineWidth = .5 + 1 * prof; g.strokeStyle = encre(.16 + .26 * prof); g.beginPath(); g.moveTo(xa, ya); g.lineTo(xa + (r() - .5) * 2, ya - h); g.stroke(); if (prof > .15) { g.lineWidth = .4 + .7 * prof; g.beginPath(); g.moveTo(xa - h * .45, ya - h * .62); g.quadraticCurveTo(xa - h * .05, ya - h * 1.2, xa + h * .5, ya - h * .7); g.stroke(); } }
      }
    }
  };
  g.save(); g.lineCap = 'round';
  rangs(cx - f * 1.4, -1, -60, -1.15, 3);
  rangs(cx + f * 1.6, 2.5, 60, 1.25, 4);
  g.restore();
  /* CO-5 : le ruisseau, au repos, dans le monde gravé : il passe sous la passerelle, vient vers nous et se perd au fond,
     avec ses berges gravées, ses pierres et ses herbes ; la place est d'abord repeinte du sol (plus de rangs dessous) */
  const { Zp, proj3 } = L;
  const solPlein = g.createLinearGradient(0, y0, 0, H); solPlein.addColorStop(0, 'rgb(246,243,235)'); solPlein.addColorStop(1, 'rgb(241,236,224)');
  /* R5 (finitions du 07/10/2026) : le ruisseau au repos un peu plus présent (presence : encre de l'eau et des berges
     relevée, quelques traits de courant en plus) */
  L.ruisseau = peindreRuisseau(g, proj3, { encre, sol: solPlein, echelle: z => Math.min(1.6, f / (Zp + z) / 36), zPres: -Zp * .5, zLoin: Zp * .9, graine: 61, presence: 1.4 });
  /* le premier plan : un pré gravé, brins d'herbe couchés au trait, plus serrés vers le bas */
  const dansChemin = (x, y, polys) => polys.some(p => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; });
  L._pre = (polys) => {
    const r = rng(23), n = Math.round(W * (mob ? 1.6 : 1.1));
    g.save(); g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const prof = .5 + .5 * Math.sqrt(r()), y = y0 + prof * (H - y0), x = r() * W;
      if (dansChemin(x, y, polys)) continue;
      const l = 3 + 15 * (prof - .45), pen = (r() - .5) * .9;
      g.strokeStyle = encre(.1 + .32 * (prof - .4)); g.lineWidth = .35 + .9 * (prof - .4);
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + pen * l * .3, y - l * .6, x + pen * l, y - l); g.stroke();
    }
    g.restore();
  };
  /* les chemins : la texture du chemin du film, en perspective vraie, dans les bords des trois branches */
  const bG = bordsChemin(L, branche(L, 'g'), 1.25), bD = bordsChemin(L, branche(L, 'd'), 1.15);
  const tronc = []; for (let Z = L.Zb * .7; Z <= L.Zf * 1.25; Z *= 1.04) tronc.push([L.Xf, Z]);
  const bT = bordsChemin(L, tronc, 1.5);
  /* CO-5 : le chemin de l'autre côté. Il part de la culée de droite, longe un instant la berge, puis monte vers les
     collines ; en vue de la caméra, il dérive à peine vers la droite et s'amincit jusqu'à l'horizon */
  const Lp = PASS.L, axeLoin = mob ? [[Lp - .1, 0], [Lp + .45, .3], [Lp + .8, 1.2], [Lp + 1, 2.6]] : [[Lp - .1, 0], [Lp + .7, .25], [Lp + 1.5, 1.2], [Lp + 2.2, 3.2]];
  const [x3, z3] = axeLoin[axeLoin.length - 1], depart = proj3(x3, 0, z3)[0];
  /* la pente qui fait tendre le chemin, à l'horizon, vers un point à peine à droite de son départ */
  const kLoin = ((mob ? Math.min(W - 18, depart + 8) : Math.min(W - 24, depart + 26)) - cx) / f;
  /* CO-19 (troisième passe) : le chemin s'arrête au village, là où il ne fait plus que quelques pixels de large (le
     village est loin, au pied des collines, à la même échelle que le chemin qui y mène) ; une courbe souple */
  const zFin = f * 1.9 / (mob ? 3.6 : 5) - L.Zp;
  for (let z = z3 * 1.12; z < zFin; z *= 1.07) axeLoin.push([x3 + kLoin * (z - z3) + Math.sin(z * .045 + .6) * Math.min(1, (z - z3) / 12) * 2.2, z]);
  const gL = [], dL = [];
  axeLoin.forEach(([x, z], i) => {
    const a = axeLoin[Math.max(0, i - 1)], b = axeLoin[Math.min(axeLoin.length - 1, i + 1)];
    let dx = b[0] - a[0], dz = b[1] - a[1]; const nn = Math.hypot(dx, dz) || 1; dx /= nn; dz /= nn;
    const w = .95 * (1 + .1 * Math.sin(z * .6));
    gL.push(proj3(x - dz * w, 0, z + dx * w)); dL.push(proj3(x + dz * w, 0, z - dx * w));
  });
  const bL = { g: gL, d: dL };
  /* CO-19 : le bout du chemin de l'autre côté, où est posé le village */
  { const a = axeLoin[axeLoin.length - 1]; L.loinFin = proj3(a[0], 0, a[1]); }
  L.bordsLoin = bL;
  const polys = [bG, bD, bT, bL].map(b => b.g.concat(b.d.slice().reverse()));
  L.polyDroite = polys[1]; L.polyLoin = polys[3]; L.polyTronc = polys[2]; L.bordsDroite = bD; L.bordsGauche = bG;
  L.dessins = [];   /* CO-17 : les objets peints (pour le lavis léger du paysage) */
  /* la matière des chemins : la tuile du chemin du film, en perspective vraie (une rangée de pixels à la fois) */
  const texturer = (gt, liste) => {
    gt.fillStyle = '#ece4d3'; liste.forEach(p => { gt.beginPath(); p.forEach(([x, y], i) => i ? gt.lineTo(x, y) : gt.moveTo(x, y)); gt.closePath(); gt.fill(); });
    if (!IMG.sol) return;
    const pat = gt.createPattern(IMG.sol, 'repeat'), T = 2.4, tex = IMG.sol.naturalWidth;
    gt.save(); gt.globalCompositeOperation = 'source-atop';
    for (let y = Math.ceil(y0 + 2); y < H; y += 1) {
      const Z = f * hc / (y + .5 - y0), k = f / Z * T / tex;
      if (Z > 140) continue;
      gt.globalAlpha = clamp(1 - Z / 140) * .95;
      const m = new DOMMatrix([k, 0, 0, k, cx - f * (0 / Z), y - ((Z / T) % 1) * tex * k]);
      pat.setTransform(m); gt.fillStyle = pat; gt.fillRect(0, y, W, 1.05);
    }
    gt.restore();
  };
  const cTex = document.createElement('canvas'); cTex.width = cMonde.width; cTex.height = cMonde.height;
  const gt = cTex.getContext('2d'); gt.setTransform(dpr, 0, 0, dpr, 0, 0);
  /* CO-19 : le chemin de l'autre côté n'est plus peint au repos : il se trace au survol (bords, puis matière, puis lavis) ;
     sa matière est peinte une fois dans son propre canevas */
  texturer(gt, polys.slice(0, 3));
  cLoinSol.width = cMonde.width; cLoinSol.height = cMonde.height;
  { const gs = cLoinSol.getContext('2d'); gs.setTransform(dpr, 0, 0, dpr, 0, 0); gs.clearRect(0, 0, W, H); texturer(gs, [polys[3]]); }
  L._pre(polys.slice(0, 3).concat([L.ruisseau.poly]));
  g.drawImage(cTex, 0, 0, W, H);
  /* les bords des chemins à la plume */
  const bordPlume = (pts, graine) => {
    const r = rng(graine);
    for (let i = 0; i < pts.length - 1; i++) {
      const [xa, ya] = pts[i], [xb, yb] = pts[i + 1];
      if (ya < y0 + 2 && yb < y0 + 2) continue;
      if (r() < .18) continue;
      const prof = clamp((ya - y0) / (H - y0));
      g.strokeStyle = encre(.25 + .5 * prof); g.lineWidth = .4 + 1.8 * prof;
      g.beginPath(); g.moveTo(xa, ya); g.lineTo(xb + (r() - .5) * 1.2, yb + (r() - .5)); g.stroke();
    }
  };
  g.save(); g.lineCap = 'round';
  [bG.g, bG.d, bD.g, bD.d, bT.g, bT.d].forEach((p, i) => bordPlume(p, 40 + i));
  g.restore();
  /* les objets gravés, du plus loin au plus près : cyprès, vignes, herbes */
  const objets = [];
  const poser = (nom, X, Z, hauteur, miroir) => objets.push({ nom, X, Z, hauteur, miroir });
  const sD = (L.Xh - L.Xf) / (L.Zh - L.Zf);
  /* CO-5 : des cyprès le long du chemin de l'autre côté (posés par leur pied, vus par la caméra de la passerelle) */
  const versMonde = (x, y, z, h) => { const [sx, sy] = proj3(x, y, z); const Zw = f * hc / Math.max(.5, sy - y0), hpx = f * h / (L.Zp + z); return [(sx - cx) * Zw / f, Zw, hpx * Zw / f]; };
  if (!mob) [[8, -2.6, 8.5], [15, 2.9, 9.5], [27, -3.1, 10], [44, 3.4, 11]].forEach(([z, d, h], i) => { const k = axeLoin.find(p => p[1] >= z) || axeLoin[axeLoin.length - 1]; const [X, Z, hw] = versMonde(k[0] + d, 0, k[1], h); poser(i % 2 ? 'cypres-2' : 'cypres-1', X, Z, hw, i === 1); });
  /* CO-19 : quelques pieds de vigne au bord du chemin de l'autre côté (les mêmes que le long des autres chemins) */
  [[3.6, -2.3], [6.5, 2.4], [11, -2.6], [19, 2.8]].forEach(([z, d], i) => { const k = axeLoin.find(p => p[1] >= z) || axeLoin[axeLoin.length - 1]; const [X, Z, hw] = versMonde(k[0] + d, 0, k[1], 1.25); poser(i % 2 ? 'vigne-2' : 'vigne-1', X, Z, hw, i % 2 === 0); });
  [[120, -36], [160, -70], [95, 20], [210, 120], [140, -110]].forEach(([Z, X], i) => poser(i % 2 ? 'cypres-1' : 'cypres-2', X, Z, 9 + (i % 3) * 2, i % 2 === 0));
  /* des pieds de vigne au bord des chemins */
  for (let i = 0; i < 9; i++) { const Z = L.Zf * (1.4 + i * .55); const X = L.Xf + L.sG * (Z - L.Zf) - 2.6 - (i % 2) * 1.4; poser(i % 2 ? 'vigne-1' : 'vigne-2', X, Z, 1.25, i % 3 === 0); }
  for (let i = 0; i < 7; i++) { const Z = L.Zf * (1.5 + i * .62); const X = L.Xf + sD * (Z - L.Zf) + 2.6 + (i % 2) * 1.2; if (Z < L.Zh * .62) poser(i % 2 ? 'vigne-2' : 'vigne-1', X, Z, 1.25, i % 2 === 0); }
  objets.sort((a, b) => b.Z - a.Z).forEach(o => {
    const im = IMG[o.nom], m = MAN[o.nom]; if (!im || !m) return;
    const [x, y] = proj(o.X, o.Z); const hpx = f * o.hauteur / o.Z;
    if (dansChemin(x, y, [L.ruisseau.poly])) return;   /* CO-5 : rien ne pousse dans le ruisseau */
    /* CO-5 : ni devant la passerelle et son eau (le feuillage d'une vigne proche les cachait) */
    { const hIm2 = (m.pied[1] - (m.cime || 0)) * im.naturalHeight, s2 = hpx / hIm2, w2 = im.naturalWidth * s2, h2 = im.naturalHeight * s2, bx0 = x - m.pied[0] * w2, by0 = y - m.pied[1] * h2;
      const zx0 = L.xPont - 24, zy0 = L.yh - L.largeurPont * .32, zy1 = L.yh + L.largeurPont * .2;
      if (bx0 + w2 * (o.miroir ? 1 : 1) > zx0 && by0 < zy1 && by0 + h2 > zy0) return; }
    const hIm = (m.pied[1] - (m.cime || 0)) * im.naturalHeight, s = hpx / hIm;
    const w = im.naturalWidth * s, h = im.naturalHeight * s;
    if (x + w < -20 || x - w > W + 20 || hpx < 3) return;
    g.save(); g.globalAlpha = clamp(.55 + 30 / o.Z, .55, 1);
    g.translate(x, y); if (o.miroir) g.scale(-1, 1);
    g.drawImage(im, -m.pied[0] * w, -m.pied[1] * h, w, h); g.restore();
    L.dessins.push({ nom: o.nom, im, x, y, miroir: o.miroir, d: [-m.pied[0] * w, -m.pied[1] * h, w, h] });
  });
  /* les herbes au premier plan, posées par leur pied le long des bords */
  if (IMG.herbes && MAN.herbes) {
    const T = MAN.herbes.touffes, im = IMG.herbes, r = rng(17);
    const lieux = [];
    for (let i = 0; i < 8; i++) { const Z = L.Zb * (.95 + i * .32); lieux.push([L.Xf + L.sG * (Z - L.Zf) - 1.5 - r() * .6, Z]); lieux.push([L.Xf + sD * (Z - L.Zf) + 1.5 + r() * .6, Z]); }
    lieux.sort((a, b) => b[1] - a[1]).forEach(([X, Z], i) => {
      const t = T[Math.floor(r() * T.length)], [x0, y0b, x1, y1] = t.boite, pied = t.pied;
      const [x, y] = proj(X, Z), hpx = f * (.35 + r() * .25) / Z, hb = (y1 - y0b) * im.naturalHeight, s = hpx / hb;
      if (dansChemin(x, y, [L.ruisseau.poly])) return;   /* CO-5 : pas d'herbes dans l'eau */
      const sw = (x1 - x0) * im.naturalWidth, sh = hb;
      const mir = r() < .5;
      g.save(); g.globalAlpha = .9; g.translate(x, y); if (mir) g.scale(-1, 1);
      g.drawImage(im, x0 * im.naturalWidth, y0b * im.naturalHeight, sw, sh, -(pied[0] - x0) * im.naturalWidth * s, -sh * s, sw * s, sh * s); g.restore();
      L.dessins.push({ nom: 'herbe', im, x, y, miroir: mir, src: [x0 * im.naturalWidth, y0b * im.naturalHeight, sw, sh], d: [-(pied[0] - x0) * im.naturalWidth * s, -sh * s, sw * s, sh * s] });
    });
  }
  /* un grain de papier très léger sur tout le sol */
  g.save(); g.globalAlpha = .05; const r2 = rng(7);
  for (let i = 0; i < 900; i++) { g.fillStyle = r2() < .5 ? '#5a5160' : '#ffffff'; g.fillRect(r2() * W, y0 + r2() * (H - y0), 1, 1); }
  g.restore();
  /* la couleur du chemin de droite (lavis d'ocre), pour l'état « décision » */
  cLavis.width = cMonde.width; cLavis.height = cMonde.height;
  const gl = cLavis.getContext('2d'); gl.setTransform(dpr, 0, 0, dpr, 0, 0); gl.clearRect(0, 0, W, H);
  gl.filter = 'blur(2px)'; gl.fillStyle = 'rgba(214,170,104,.55)';
  gl.beginPath(); L.polyDroite.forEach(([x, y], i) => i ? gl.lineTo(x, y) : gl.moveTo(x, y)); gl.closePath(); gl.fill();
  gl.filter = 'none';
  /* CO-5 : le lavis du chemin de l'autre côté, qui suit quand la passerelle est faite, et un peu de bleu sur l'eau */
  cLavisLoin.width = cMonde.width; cLavisLoin.height = cMonde.height;
  const gk = cLavisLoin.getContext('2d'); gk.setTransform(dpr, 0, 0, dpr, 0, 0); gk.clearRect(0, 0, W, H);
  gk.filter = 'blur(1.5px)'; gk.fillStyle = 'rgba(214,170,104,.55)';
  gk.beginPath(); L.polyLoin.forEach(([x, y], i) => i ? gk.lineTo(x, y) : gk.moveTo(x, y)); gk.closePath(); gk.fill();
  gk.fillStyle = 'rgba(150,178,200,.4)';
  gk.beginPath(); L.ruisseau.eau.forEach(([x, y], i) => i ? gk.lineTo(x, y) : gk.moveTo(x, y)); gk.closePath(); gk.fill();
  gk.filter = 'none';
}

/* ---------------------------------------------------------------------
   CO-5 (06/10/2026) : la passerelle au bout du chemin de droite (le
   dessin est dans passerelle.js). Au repos, seules les deux culées sont
   tracées ; au survol, elle se construit dans l'ordre du charpentier,
   puis le lavis se pose sur le bois et la pierre, le chemin de l'autre
   côté prend son ocre, la lumière monte d'un cran sur la berge d'en face
   et « de l'autre côté » s'écrit. Le geste est réversible.
   --------------------------------------------------------------------- */
const pont = { el: $('[data-passerelle]'), svg: $('[data-passerelle-trait]'), lavis: $('[data-passerelle-lavis]'), lumiere: $('[data-lumiere]'), dessin: null };
function construirePont() {
  const { W, H, proj3, largeurPont } = L;
  pont.svg.setAttribute('viewBox', `0 0 ${W} ${H}`); pont.svg.innerHTML = '';
  pont.dessin = new Passerelle(pont.svg, proj3, { e: clamp(largeurPont / 237, .62, 1.15), papier: '#f4f0e6', graine: 7 });
  /* le lavis, peint une fois (pierre, bois, planches), révélé à la fin */
  const dpr = Math.min(2, devicePixelRatio || 1), c = pont.lavis;
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
  const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  pont.dessin.peindreLavis(g, 5);
  pont.dessin.u = -1; pont.dessin.rendre(uPont);
}
/* ---------------------------------------------------------------------
   CO-17 (deuxième passe, 06/10/2026) : le ciel et le paysage répondent aux
   deux flèches. Au survol d'« Être accompagné » (classe « aube ») : le
   ciel se teinte d'un bleu d'aube, de la droite d'abord ; le soleil du film
   (c-film/js/fond.js, lu et non modifié : même disque, même halo, mêmes
   arrêts de couleur, le liseré de la crête devant lui) se lève derrière
   les collines de droite et s'arrête bas ; un lavis léger se pose sur les
   vignes, les cyprès, les herbes et le chemin ; après le pont, le chemin
   d'en face se trace jusqu'au village, dont les fenêtres s'allument
   (CO-19, classe « reussite »). Au survol de « Décider seul » (classe
   « couvert ») : l'orage (CO-20). Tout est peint une fois
   (à la mise en place, ou au premier survol pour le lavis) ; les
   transitions sont en CSS, sur opacity et transform.
   --------------------------------------------------------------------- */
const cielEl = { el: $('[data-ciel]'), soleil: $('[data-soleil]'), disque: $('[data-soleil-disque]'), nuages: $('[data-nuages]'), lisere: $('[data-lisere]'), lavis: $('[data-lavis-monde]') };
/* CO-19 : le geste de la décision va au-delà du pont : les bords du chemin d'en face (1 à 1,14), sa matière (1,09 à 1,16),
   son ocre (1,15), le village (1,13 à 1,2), puis ses lumières et son lavis (1,22) */
const FIN_SIGNE = 1.24;
let lavisPeint = false;
const creteA = x => { if (!L.crete) return L.y0 - 60; const i = clamp(Math.round(x / L.creteQ), 0, L.crete.length - 1); return L.crete[i]; };
/* le soleil du film, peint une fois : le disque clair et son halo (arrêts de couleur de fond.js, à l'échelle du rayon) */
function peindreSoleil(R) {
  const HALO = R * 250 / 42, S = HALO * 2, dpr = Math.min(2, devicePixelRatio || 1), c = cielEl.disque;
  c.width = c.height = Math.round(S * dpr); c.style.width = c.style.height = S + 'px';
  const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, S, S);
  const gr = g.createRadialGradient(HALO, HALO, 0, HALO, HALO, HALO), r = v => v / 250;
  gr.addColorStop(0, 'rgba(255,250,240,1)'); gr.addColorStop(r(38), 'rgba(255,250,240,1)'); gr.addColorStop(r(48), 'rgba(255,241,214,1)'); gr.addColorStop(r(55), 'rgba(255,230,190,.62)');
  gr.addColorStop(r(78), 'rgba(255,214,160,.32)'); gr.addColorStop(r(128), 'rgba(255,206,155,.15)'); gr.addColorStop(r(190), 'rgba(255,200,150,.06)'); gr.addColorStop(1, 'rgba(255,200,150,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  return HALO;
}
/* le liseré : la crête qui prend la lumière devant le soleil (comme fond.js, peint une fois) */
function peindreLisere(xs, R) {
  const c = cielEl.lisere, dpr = Math.min(2, devicePixelRatio || 1), x0 = xs - R * 3.4, w = R * 6.8;
  let ymin = 1e9, ymax = -1e9; for (let x = x0; x <= x0 + w; x += 2) { const y = creteA(x); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
  const y0 = ymin - 8, h = ymax - ymin + 16;
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.width = w + 'px'; c.style.height = h + 'px'; c.style.transform = `translate(${x0.toFixed(1)}px,${y0.toFixed(1)}px)`;
  const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
  const gl = g.createLinearGradient(0, 0, w, 0);
  [[0, 0], [.22, .25], [.38, .8], [.5, 1], [.62, .8], [.78, .25], [1, 0]].forEach(([t, a]) => gl.addColorStop(t, `rgba(255,246,222,${a})`));
  g.beginPath(); for (let x = 0, i = 0; x <= w; x += 2, i++) { const y = creteA(x0 + x) + .6 - y0; i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.lineJoin = 'round'; g.strokeStyle = gl;
  g.globalAlpha = .35; g.lineWidth = 3.6; g.stroke(); g.globalAlpha = .6; g.lineWidth = 2.2; g.stroke(); g.globalAlpha = 1; g.lineWidth = 1.1; g.stroke();
}
/* les nuages gravés : un contour bosselé à la plume et des hachures horizontales dans le bas, dessinés une fois */
/* CO-20 (troisième passe, 06/10/2026) : l'orage de « Décider seul ». Trois gros nuages lourds, gravés de la même main que
   les collines (un contour bosselé, un corps de hachures horizontales fines, plus serrées dans le ventre sombre, un lavis
   gris dessous), qui montent lentement de derrière la crête ; et l'éclair : un trait de plume fourchu, du ventre d'un
   nuage vers la colline, visible un quart de seconde avec un bref éclaircissement du nuage de l'intérieur, deux secondes
   après le début du survol, puis toutes les huit à douze secondes tant que le survol dure. Tout est tracé une fois ;
   l'orage ne bouge que par opacity et transform. Mouvement réduit : pas d'éclair. */
let eclair = null, eclairMinuteur = 0;
function construireNuages() {
  const { W, mob } = L, k = mob ? .62 : 1, NS = 'http://www.w3.org/2000/svg', ENC = '#454b5f';
  cielEl.nuages.innerHTML = '';
  const haut = mob ? 64 : 84;
  /* [x, largeur, hauteur relative, délai] ; le dernier, à droite, porte l'éclair (là où, à l'aube, le soleil se lève) */
  const nuages = mob ? [[-.15, 300, .34, 0], [.36, 250, .36, .7]] : [[-.05, 540, .3, 0], [.32, 450, .3, .55], [.64, 500, .3, 1.1]];
  let porteur = null;
  nuages.forEach(([fx, larg, fh, d], n) => {
    const w = larg * k, h = w * fh, x = W * fx, sous = Math.min(creteA(x + w * .25), creteA(x + w * .5), creteA(x + w * .75));
    /* hauts dans le ciel, le ventre au-dessus de la crête : la place de l'éclair dessous */
    const y = Math.max(haut - h * .25, Math.min(sous - h * 1.15, haut + (n % 2) * 12));
    const div = document.createElement('div'); div.className = 'nuage'; div.style.left = x.toFixed(1) + 'px'; div.style.top = y.toFixed(1) + 'px'; div.style.setProperty('--d', d + 's');
    /* un dessus en masses inégales (de grosses volutes et de petites), comme une nuée gravée, pas des bulles égales */
    const R0 = rng(600 + n), haut0 = [[w * .02, h * .78]];
    let t = .02;
    while (t < .97) {
      const dt = .07 + R0() * .13, cxL = lerp(w * .03, w * .97, t + dt / 2), rr = w * dt * .5 * (1.05 + .25 * R0()), hb = h * (.66 - .56 * Math.pow(Math.sin(Math.PI * Math.min(1, t + dt / 2)), .8) * (.75 + .35 * R0()));
      arcE(cxL, hb + rr * .55, rr, rr * (.55 + .25 * R0()), Math.PI * 1.04, Math.PI * 1.96).forEach(p => haut0.push(p));
      t += dt;
    }
    haut0.push([w * .98, h * .78]);
    const base = catmull([[w * .98, h * .78], [w * .78, h * .96], [w * .5, h * .9], [w * .25, h * .97], [w * .02, h * .78]], 8);
    const corps = haut0.concat(base);
    const D = new Dessin(null, ENC);
    D.trait(haut0, { phase: 'n', wMin: .35, wMax: 1.2, tremble: .45, op: .52, graine: 610 + n, pas: 1.6 });
    D.trait(base, { phase: 'n', wMin: .3, wMax: 1, tremble: .4, op: .5, graine: 620 + n });
    /* les hachures : le corps, puis le ventre plus serré et plus sombre */
    hachures(D, corps, { phase: 'n', pas: 2.8, long: [10, 30], op: .3, graine: 630 + n, angle: 0, wMax: .75 });
    hachures(D, corps.filter(p => p[1] > h * .5).concat([[w * .9, h * .5], [w * .1, h * .5]]), { phase: 'n', pas: 1.9, long: [8, 22], op: .4, graine: 640 + n, angle: -4, wMax: .8 });
    /* peint une fois dans un canevas (une image : la monter et la faire dériver ne coûte rien) : le lavis gris, puis l'encre */
    const c = document.createElement('canvas'), dpr = Math.min(2, devicePixelRatio || 1), m = 8;
    c.width = Math.round((w + 2 * m) * dpr); c.height = Math.round((h + 2 * m) * dpr); c.style.width = (w + 2 * m) + 'px'; c.style.height = (h + 2 * m) + 'px'; c.style.margin = `-${m}px 0 0 -${m}px`;
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, m * dpr, m * dpr);
    g.fillStyle = 'rgba(98,104,122,.34)'; g.beginPath(); corps.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath(); g.fill();
    D.peindre(g, { n: 1 });
    div.appendChild(c); cielEl.nuages.appendChild(div);
    porteur = { div, x, y, w, h };
  });
  /* l'éclair, du ventre du dernier nuage jusque sur le flanc de la colline (il passe devant elle : son calque est au-dessus
     du monde gravé) ; son éclaircissement dans le nuage */
  const p = porteur, x0 = p.x + p.w * .58, y0 = p.y + p.h * .86, yb = creteA(x0 + p.w * .05) + (mob ? 40 : 70), Hh = Math.max(40, yb - y0);
  const svg = document.createElementNS(NS, 'svg'), bx = x0 - Hh * .35, bw = Hh * .9;
  svg.setAttribute('class', 'eclair'); svg.setAttribute('width', bw); svg.setAttribute('height', Hh); svg.setAttribute('viewBox', `0 0 ${bw} ${Hh}`); svg.style.left = bx.toFixed(1) + 'px'; svg.style.top = y0.toFixed(1) + 'px';
  /* un trait brisé : des segments de longueurs et de directions inégales, qui descendent en dérivant ; une fourche */
  const R1 = rng(79), tronc = [[x0 - bx, 0]];
  let yy = 0, xx = x0 - bx;
  while (yy < Hh * .98) { const dy = Hh * (.07 + .13 * R1()); yy = Math.min(Hh, yy + dy); xx += (R1() - .42) * Hh * .2; tronc.push([xx, yy]); }
  const kf = Math.min(tronc.length - 2, 2), branche = [tronc[kf]];
  let bx2 = tronc[kf][0], by2 = tronc[kf][1];
  for (let i = 0; i < 3; i++) { by2 += Hh * (.06 + .06 * R1()); bx2 += Hh * (.06 + .07 * R1()) * (i === 1 ? -.4 : 1); branche.push([bx2, by2]); }
  /* un halo pâle très large, le trait d'encre, le cœur clair (comme la gravure rend la lumière : du papier réservé dans l'encre) */
  const Dh = new Dessin(svg, '#fffbea'), Do = new Dessin(svg, '#2b3046'), Dc = new Dessin(svg, '#fffdf6'), e = mob ? .7 : 1;
  [tronc, branche].forEach((pts, j) => {
    Dh.trait(pts, { phase: 'e', wMin: 6 * e, wMax: (j ? 8 : 12) * e, tremble: .2, op: .22, graine: 700 + j, profil: 'plat', pas: 1.2 });
    Do.trait(pts, { phase: 'e', wMin: 1.4 * e, wMax: (j ? 3 : 4.6) * e, tremble: .2, op: .8, graine: 700 + j, profil: 'plat', pas: 1.2 });
    Dc.trait(pts, { phase: 'e', wMin: .8 * e, wMax: (j ? 1.5 : 2.5) * e, tremble: .2, op: 1, graine: 700 + j, profil: 'plat', pas: 1.2 });
  });
  [Dh, Do, Dc].forEach(D => { D.monter(); D.rendre({ e: 1 }); });
  const avant = $('[data-orage-avant]'); avant.innerHTML = ''; avant.appendChild(svg);
  const lueur = document.createElement('i'); lueur.className = 'eclair-lueur'; Object.assign(lueur.style, { left: (p.x + p.w * .2).toFixed(1) + 'px', top: (p.y + p.h * .05).toFixed(1) + 'px', width: (p.w * .7).toFixed(1) + 'px', height: (p.h * .9).toFixed(1) + 'px' });
  cielEl.nuages.appendChild(lueur);
  eclair = { svg, lueur };
}
/* l'éclair : une fois deux secondes après l'entrée du survol, puis toutes les huit à douze secondes tant qu'il dure */
function orage(actif) {
  clearTimeout(eclairMinuteur); eclairMinuteur = 0;
  if (!actif || !eclair || reduit()) return;
  const frapper = () => {
    if (!sec.classList.contains('couvert')) return;
    [eclair.svg, eclair.lueur].forEach(e => { e.classList.remove('frappe'); void e.getBoundingClientRect(); e.classList.add('frappe'); });
    eclairMinuteur = setTimeout(frapper, 8000 + Math.random() * 4000);
  };
  eclairMinuteur = setTimeout(frapper, 2000);
}
/* CO-19 (troisième passe, 06/10/2026) : le signe de réussite, posé ici seulement. Plus de cairn : au bout du chemin de
   l'autre côté, un petit village gravé, pris dans la gravure du village du film (commun/img/village-jour.webp, lue sans
   modification) : le clocher, la maison à son pied et la maison basse, découpés une fois sur leur ciel (conseil/village.webp,
   script conseil/decoupe-village.py). Quand le soleil est levé, ses fenêtres s'allument une à une (les lumières du film,
   lumieres.webp, aux fenêtres mesurées dans l'image : celles de la maison sont aux places mêmes du film) et ses toits et
   ses murs prennent le lavis. Pour un autre signe (un clocher seul, par exemple), remplacer cet objet : image, taille,
   fenêtres [x, y, vignette 0 à 5, échelle], toits et murs (polygones, pixels de l'image), largeur à l'écran. */
const SIGNE = {
  nom: 'village',
  image: 'village.webp', taille: [308, 508],
  fenetres: [[237, 160, 3, .6], [273, 160, 5, .6], [172, 342, 1, .82], [231, 330, 3, .9], [229, 420, 1, .9]],
  toits: [[[127, 302], [300, 240], [308, 248], [308, 262], [140, 318]], [[8, 368], [128, 336], [134, 350], [14, 384]], [[213, 128], [251, 10], [292, 128]]],
  murs: [[[140, 318], [300, 262], [300, 500], [140, 500]], [[14, 384], [130, 352], [130, 500], [14, 500]], [[222, 130], [298, 130], [298, 250], [222, 250]]],
  largeur: (W, mob) => mob ? 34 : clamp(W * .046, 54, 72)
};
let signe = null;
function construireSigne() {
  const NS = 'http://www.w3.org/2000/svg', { W, H, mob } = L, el = $('[data-village]'), svg = $('[data-loin-trait]');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = '';
  if (!L.loinFin || !L.bordsLoin) { signe = null; return; }
  /* le chemin de l'autre côté : ses deux bords à la plume, plus fins en s'éloignant, tracés ensemble */
  const D = new Dessin(svg, ENCRE);
  [L.bordsLoin.g, L.bordsLoin.d].forEach((b, j) => {
    const n = b.length, morceaux = [[0, .3, 1.7, .78], [.28, .62, 1.05, .6], [.6, 1, .6, .45]];
    morceaux.forEach(([a0, a1, w, op], k) => { const p = b.slice(Math.floor(a0 * (n - 1)), Math.ceil(a1 * (n - 1)) + 1); if (p.length > 1) D.trait(p, { phase: 'bord' + j, wMin: .3, wMax: w, tremble: .3, op, graine: 800 + j * 10 + k, pas: 1.6 }); });
  });
  D.monter();
  /* le village, posé sur la pente au bout du chemin, à l'échelle du chemin qui y mène */
  const [tw, th] = SIGNE.taille, lw = SIGNE.largeur(W, mob), lh = lw * th / tw, e = lw / tw;
  const [xv, yv] = L.loinFin;
  Object.assign(el.style, { left: (xv - lw * .62).toFixed(1) + 'px', top: (yv - lh * .97).toFixed(1) + 'px', width: lw.toFixed(1) + 'px', height: lh.toFixed(1) + 'px' });
  el.innerHTML = `<img src="${SIGNE.image}" alt="" width="${tw}" height="${th}" decoding="async"><canvas class="village__lavis"></canvas>`;
  /* le lavis des toits et des murs, peint une fois */
  const c = el.querySelector('canvas'), dpr = Math.min(2, devicePixelRatio || 1);
  c.width = Math.round(lw * dpr); c.height = Math.round(lh * dpr);
  const g = c.getContext('2d'); g.setTransform(dpr * e, 0, 0, dpr * e, 0, 0); g.filter = 'blur(1px)';
  const poly = (p, coul, a) => { g.globalAlpha = a; g.fillStyle = coul; g.beginPath(); p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };
  SIGNE.murs.forEach(p => poly(p, '#ecd3a4', .55)); SIGNE.toits.forEach(p => poly(p, '#c97a5c', .7));
  /* les fenêtres qui s'allument : la vignette du film, centrée sur la fenêtre, à son échelle (60 x 110 px de l'image) */
  SIGNE.fenetres.forEach(([x, y, i, k], n) => {
    const l = document.createElement('i'); l.className = 'village__lum';
    Object.assign(l.style, { left: (x / tw * 100).toFixed(2) + '%', top: (y / th * 100).toFixed(2) + '%', width: (60 * k / tw * 100).toFixed(2) + '%', height: (110 * k / th * 100).toFixed(2) + '%' });
    l.style.setProperty('--i', i); l.style.setProperty('--d', (.25 + n * .32).toFixed(2) + 's');
    el.appendChild(l);
  });
  signe = {
    rendre(u) {
      const b = clamp((u - 1) / .14); D.rendre({ bord0: b, bord1: b });
      cLoinSol.style.opacity = Math.max(.001, clamp((u - 1.09) / .07)).toFixed(3);
      el.style.opacity = Math.max(.001, clamp((u - 1.13) / .07)).toFixed(3);
      sec.classList.toggle('loin', u >= 1.15);
    }
  };
  signe.rendre(uPont);
}
/* le lavis léger du paysage : vignes, cyprès et herbes au vert, le tronc des chemins à l'ocre ; peint une seule fois (une
   copie teintée de chaque dessin, posée en lavis, un peu décalée et adoucie), par petits morceaux pendant les temps morts
   après l'entrée de la scène ; si la flèche est survolée avant, le reste est peint d'un coup */
let lavisTache = null;
function lavisEtapes() {
  const { W, H } = L, dpr = Math.min(2, devicePixelRatio || 1), c = cielEl.lavis;
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
  const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  const t = document.createElement('canvas'), tg = t.getContext('2d');
  const TEINTE = { 'cypres-1': ['#5f7d52', .5], 'cypres-2': ['#5f7d52', .5], 'vigne-1': ['#86a061', .46], 'vigne-2': ['#86a061', .46], herbe: ['#93a86b', .42] };
  const liste = L.dessins.slice();
  let i = 0;
  return {
    pas() {
      if (i >= liste.length) {
        if (L.polyTronc) { g.save(); g.filter = 'blur(2px)'; g.fillStyle = 'rgba(214,170,104,.42)'; g.beginPath(); L.polyTronc.forEach(([x, y], j) => j ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); g.restore(); }
        return false;
      }
      const o = liste[i++], [tc, a] = TEINTE[o.nom] || ['#86a061', .4], [dx, dy, w, h] = o.d;
      const tw = Math.ceil(Math.abs(w)) + 4, th = Math.ceil(Math.abs(h)) + 4; if (tw < 3 || th < 3) return true;
      t.width = tw; t.height = th; tg.clearRect(0, 0, tw, th); tg.globalCompositeOperation = 'source-over';
      if (o.src) tg.drawImage(o.im, ...o.src, 2, 2, w, h); else tg.drawImage(o.im, 2, 2, w, h);
      tg.globalCompositeOperation = 'source-in'; tg.fillStyle = tc; tg.fillRect(0, 0, tw, th);
      g.save(); g.globalAlpha = a; g.filter = 'blur(1.2px)'; g.translate(o.x + 1.2, o.y + .8); if (o.miroir) g.scale(-1, 1); g.drawImage(t, dx - 2, dy - 2); g.restore();
      return true;
    }
  };
}
function peindreLavisMonde(toutDeSuite) {
  if (lavisPeint || !L || !L.dessins) return;
  if (!lavisTache) lavisTache = lavisEtapes();
  if (toutDeSuite) { while (lavisTache.pas()); lavisPeint = true; lavisTache = null; return; }
  const idle = window.requestIdleCallback || (cb => setTimeout(() => cb({ timeRemaining: () => 8 }), 60));
  idle(function tranche(dl) {
    if (lavisPeint || !lavisTache) return;
    while (dl.timeRemaining() > 4) if (!lavisTache.pas()) { lavisPeint = true; lavisTache = null; return; }
    idle(tranche, { timeout: 500 });
  }, { timeout: 1500 });
}
function construireCiel() {
  const { W, mob, y0 } = L;
  cielEl.el.style.height = (y0 + 10) + 'px';
  /* CO-19 : le soleil se lève derrière la colline, au-dessus du village (un peu à sa droite) */
  const R = mob ? 24 : 40, xf = L.loinFin ? L.loinFin[0] : W * .9;
  const xs = Math.min(W - R * .8, xf + R * .45), yc = creteA(xs), HALO = peindreSoleil(R);
  cielEl.soleil.style.transform = `translate(${(xs - HALO).toFixed(1)}px,${(yc - HALO).toFixed(1)}px)`;
  cielEl.disque.style.setProperty('--bas', (R * 1.7).toFixed(1) + 'px');
  cielEl.disque.style.setProperty('--haut', (-R * .55).toFixed(1) + 'px');
  cielEl.el.style.setProperty('--sx', (xs / W * 100).toFixed(1) + '%');
  peindreLisere(xs, R);
  construireNuages();
  construireSigne();
  if (lavisPeint || lavisTache) { lavisPeint = false; lavisTache = null; peindreLavisMonde(); }
}
let uPont = 0, ciblePont = 0, rafP = 0, dernierP = 0;
function rendrePont(u) {
  if (!pont.dessin) return;
  pont.dessin.rendre(Math.min(1, u));
  /* R5 (finitions du 07/10/2026) : au repos, les deux culées sont plus légères (un gué à venir, plus deux blocs gris dans le
     pré) ; elles prennent toute leur encre pendant que les poutres se posent (de REPOS à REPOS + 0,14) */
  const opC = (.42 + .58 * clamp((u - REPOS) / .14)).toFixed(3);
  /* seule leur encre s'allège : leur fond de papier reste opaque (le ruisseau ne se voit pas au travers) */
  if (opC !== pont.opCulees) { pont.opCulees = opC; pont.dessin.couches.culees.D.g.style.opacity = opC; }
  if (signe) signe.rendre(u);   /* CO-17 : après le pont, le chemin de la crête et le signe */
  sec.classList.toggle('couleur', u >= .97);
  sec.classList.toggle('reussite', u >= FIN_SIGNE - .02);   /* CO-19 : les lumières du village et son lavis */
}
function animerPont(cible) {
  ciblePont = cible;
  if (reduit()) { uPont = cible; rendrePont(uPont); return; }
  if (rafP) return;
  dernierP = performance.now();
  const pas = t => {
    const dt = Math.min(.05, (t - dernierP) / 1000); dernierP = t;
    const v = ciblePont > uPont ? .3 : .9;
    uPont = ciblePont > uPont ? Math.min(ciblePont, uPont + v * dt) : Math.max(ciblePont, uPont - v * dt);
    rendrePont(uPont);
    if (uPont !== ciblePont) rafP = requestAnimationFrame(pas); else rafP = 0;
  };
  rafP = requestAnimationFrame(pas);
}

/* ---------------------------------------------------------------------
   Les états : rien, « g » (la brume), « d » (la décision)
   --------------------------------------------------------------------- */
let etat = '', epingle = '';
/* CO-24 (quatrième passe, 07/10/2026) : les deux boutons sous la scène suivent l'état en cours (plein) */
const choixBtns = $$('[data-choix-btn]');
function poserEtat(e) {
  if (e === etat) return;
  etat = e; sec.dataset.etat = e;
  $$('[data-fleche]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.fleche === e && epingle === e)));
  choixBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.choixBtn === e)));
  /* CO-17 : le ciel et le paysage suivent la flèche (classes posées ici, transitions en CSS) */
  sec.classList.toggle('aube', e === 'd'); sec.classList.toggle('couvert', e === 'g');
  if ((e === 'g') !== orage.actif) { orage.actif = e === 'g'; orage(orage.actif); }   /* CO-20 */
  if (e === 'd') peindreLavisMonde(true);
  animerPont(e === 'd' ? FIN_SIGNE : REPOS);
}
/* CO-24 : le panneau mis en avant pendant sa séquence : sa copie de bois se soulève, ses lettres et la lueur la suivent */
const enAvantMin = {};
function mettreEnAvant(cote, ms) {
  const f = $(`.fleche--${cote}`), bo = $(`[data-bois="${cote}"]`);
  ['g', 'd'].forEach(c => { if (c !== cote) { clearTimeout(enAvantMin[c]); $(`.fleche--${c}`).classList.remove('en-avant'); const x = $(`[data-bois="${c}"]`); if (x) x.classList.remove('en-avant'); } });
  if (reduit()) return;
  f.classList.add('en-avant'); if (bo) bo.classList.add('en-avant');
  clearTimeout(enAvantMin[cote]); enAvantMin[cote] = setTimeout(() => { f.classList.remove('en-avant'); if (bo) bo.classList.remove('en-avant'); }, ms);
}
/* CO-24 : sur téléphone, la scène se démontre d'elle-même : « Décider seul » deux secondes (la brume, « nulle part »),
   puis « Être accompagné », qui reste (le pont, l'aube, le village) ; chaque panneau est mis en avant pendant sa séquence.
   Un toucher (panneau ou bouton) arrête la démonstration ; ensuite, chaque panneau rejoue son état. */
let demo = null;
function demontrer() {
  if (demo || etat || epingle) return;
  if (reduit()) { epingle = 'd'; poserEtat('d'); demo = 'fait'; return; }
  demo = [];
  poserEtat('g'); mettreEnAvant('g', 2000);
  demo.push(setTimeout(() => { epingle = 'd'; poserEtat('d'); mettreEnAvant('d', 3700); demo.push(setTimeout(() => { demo = 'fait'; }, 3700)); }, 2000));
}
function arreterDemo() { if (Array.isArray(demo)) { demo.forEach(clearTimeout); demo = 'fait'; } }
function brancherFleches() {
  /* CO-24 : la copie du bois de chaque flèche, découpée dans la photo du poteau (lignes et colonnes mesurées sur
     poteau-planche.webp : flèche du haut x 0,314 à 0,683, y 0,083 à 0,138 ; du bas x 0,320 à 0,689, y 0,158 à 0,213) */
  const BOIS = { g: [.306, .0815, .690, .1392], d: [.313, .1565, .696, .2142] };
  Object.entries(BOIS).forEach(([c, [x0, y0, x1, y1]]) => {
    const sp = document.createElement('span'); sp.className = 'bois-fleche'; sp.dataset.bois = c; sp.setAttribute('aria-hidden', 'true');
    Object.assign(sp.style, { left: x0 * 100 + '%', top: y0 * 100 + '%', width: (x1 - x0) * 100 + '%', height: (y1 - y0) * 100 + '%' });
    const im = document.createElement('img'); im.src = imgPoteau.src; im.alt = ''; im.decoding = 'async';
    Object.assign(im.style, { left: -x0 / (x1 - x0) * 100 + '%', top: -y0 / (y1 - y0) * 100 + '%', width: 100 / (x1 - x0) + '%', height: 100 / (y1 - y0) + '%' });
    sp.appendChild(im); imgPoteau.after(sp);
  });
  /* CO-24 : les deux boutons : toucher ou cliquer joue l'état et le garde */
  choixBtns.forEach(b => {
    const cote = b.dataset.choixBtn;
    b.querySelector('[data-choix-texte]').textContent = LIBELLES[cote].texte;
    b.addEventListener('click', () => { arreterDemo(); epingle = cote; etat = '?'; poserEtat(cote); mettreEnAvant(cote, 1600); });
  });
  $$('[data-fleche]').forEach(b => {
    const cote = b.dataset.fleche;
    b.addEventListener('pointerdown', () => arreterDemo());   /* CO-24 */
    b.addEventListener('pointerenter', ev => { if (ev.pointerType === 'mouse') poserEtat(cote); });
    b.addEventListener('pointerleave', ev => { if (ev.pointerType === 'mouse') poserEtat(epingle); });
    b.addEventListener('focus', () => poserEtat(cote));
    b.addEventListener('blur', () => poserEtat(epingle));
    b.addEventListener('click', () => {
      /* CO-24 : au doigt, un panneau joue son état et le garde, comme son bouton (le toucher encore le remet en avant) ;
         à la souris, rien ne change (un clic épingle ou désépingle) */
      if (!matchMedia('(hover:hover)').matches) { arreterDemo(); epingle = cote; etat = '?'; poserEtat(cote); mettreEnAvant(cote, 1600); return; }
      epingle = epingle === cote ? '' : cote; etat = '?'; poserEtat(epingle || (matchMedia('(hover:hover)').matches ? cote : ''));
    });
  });
}

/* ---------------------------------------------------------------------
   Placer tout ce qui dépend de la taille
   --------------------------------------------------------------------- */
function placer() {
  /* CO-27 (quatrième passe, 07/10/2026) : sur ordinateur, la scène laisse la place de la rangée des boutons (page.css),
     mais jamais au point de couper le CV cloué : s'il dépasserait le bas, la scène garde la hauteur qu'il lui faut (8 px
     sous la feuille) ; à 1440 x 900, rien n'est à corriger */
  sec.style.minHeight = '';
  L = calculer();
  if (!L.mob && CV) {
    const P = L.P, cw = (P.cv[1][0] - P.cv[0][0]) * L.iw / (CV.corps[1][0] - CV.corps[0][0]), chh = cw * CV.h / CV.w;
    const basCv = L.imgTop + P.clou[1] * L.ih - CV.clou[1] * chh + chh;
    if (basCv + 4 > L.H) { sec.style.minHeight = Math.ceil(basCv + 8) + 'px'; L = calculer(); }
  }
  const { P, iw, ih, imgLeft, imgTop } = L;
  Object.assign(poteau.style, { left: imgLeft + 'px', top: imgTop + 'px', width: iw + 'px', height: ih + 'px' });
  const quad = (q, el) => { const x0 = Math.min(q[0][0], q[3][0]), x1 = Math.max(q[1][0], q[2][0]), y0 = Math.min(q[0][1], q[1][1]), y1 = Math.max(q[2][1], q[3][1]); Object.assign(el.style, { left: x0 * 100 + '%', top: y0 * 100 + '%', width: (x1 - x0) * 100 + '%', height: (y1 - y0) * 100 + '%' }); };
  quad(P.fleche_gauche, $('.fleche--g')); quad(P.fleche_droite, $('.fleche--d'));
  poserPlaque();
  /* le CV : le clou de la feuille sur le clou de la planche, la largeur du corps sur celle de la zone « cv » */
  if (CV) {
    const cw = (P.cv[1][0] - P.cv[0][0]) * iw / (CV.corps[1][0] - CV.corps[0][0]), chh = cw * CV.h / CV.w;
    const cl = [P.clou[0] * iw, P.clou[1] * ih];
    const left = cl[0] - CV.clou[0] * cw, top = cl[1] - CV.clou[1] * chh;
    const cvEl = $('[data-cv]'); Object.assign(cvEl.style, { left: left + 'px', top: top + 'px', width: cw + 'px', height: chh + 'px' });
    const clou = $('.cv__clou'), dc = cw * .05;
    Object.assign(clou.style, { left: CV.clou[0] * cw - dc / 2 + 'px', top: CV.clou[1] * chh - dc / 2 + 'px', width: dc + 'px', height: dc + 'px' });
    if (CV.lien) { const [u0, v0, u1, v1] = CV.lien; Object.assign($('[data-cv-lien]').style, { left: u0 * 100 + '%', top: v0 * 100 + '%', width: (u1 - u0) * 100 + '%', height: (v1 - v0) * 100 + '%' }); }
  }
  peindreMonde();
  /* R4 : sur téléphone, le fondu du haut de la scène (page.css, .croisement__scene::after) part de la couleur exacte du fond
     de la section à cette hauteur (le haut crème du titre et du bouton) */
  if (L.mob) scene.style.setProperty('--couture', couleurFond(scene.offsetTop / (sec.offsetHeight || 1)).join(', '));
  /* CO-5 : la passerelle, dessinée dans le repère de la scène ; la lumière de la berge d'en face */
  Object.assign(pont.el.style, { left: '0px', top: '0px', width: L.W + 'px', height: L.H + 'px' });
  construirePont();
  construireCiel();   /* CO-17 */
  const bp = pont.dessin.boite(), [lx, ly] = L.proj3(PASS.L + 3.2, 0, 7), rl = L.largeurPont * (L.mob ? .55 : .62);
  Object.assign(pont.lumiere.style, { left: (lx - rl) + 'px', top: (ly - rl * .75) + 'px', width: 2 * rl + 'px', height: 1.5 * rl + 'px' });
  /* la brume : sur le chemin de gauche et les collines de gauche */
  const brume = $('[data-brume]');
  Object.assign(brume.style, { left: '0px', top: (L.y0 - (L.mob ? 120 : 210)) + 'px', width: (L.mob ? L.postX - 8 : L.bord.g + 30) + 'px', height: (L.H - L.y0 + (L.mob ? 120 : 210)) + 'px' });
  /* les légendes manuscrites */
  const lg = $('[data-legende="g"]'), ld = $('[data-legende="d"]');
  /* CO-5 : « de l'autre côté », sous la passerelle, calée sur sa culée de gauche (sur téléphone, sur le bord droit) */
  if (L.mob) { Object.assign(lg.style, { left: '14px', top: (L.bord.b + 26) + 'px' }); Object.assign(ld.style, { left: 'auto', right: '12px', top: (bp[3] + 8) + 'px' }); }
  else { Object.assign(lg.style, { left: Math.max(24, L.vxG - 40) + 'px', top: (L.y0 + 54) + 'px' }); Object.assign(ld.style, { left: (L.xPont - 4) + 'px', right: 'auto', top: (bp[3] + 10) + 'px' }); }
  /* R5 (finitions du 07/10/2026) : « de l'autre côté » ne s'écrit jamais sur le CV ni sur la planche. Sa place reste celle
     de la passerelle (sous elle) ; si elle mord sur la planche (entre 768 et 1000 px de large, la planche couvre la
     passerelle), elle passe à gauche de la planche, à la même hauteur, sinon à droite, sinon sous la planche */
  bornerLegende(ld);
  /* CO-24 : plus d'invite à placer (remplacée par les deux boutons sous la scène) */
}

/* R5 : la légende de droite, hors de la planche du poteau (et du CV qui y est cloué) ; positions dans le repère de la scène */
function bornerLegende(el) {
  const { W, bord } = L, m = 12;
  const w = el.offsetWidth, h = el.offsetHeight;
  let x = el.style.right !== 'auto' && el.style.left === 'auto' ? W - parseFloat(el.style.right) - w : parseFloat(el.style.left), y = parseFloat(el.style.top);
  const mord = (x, y) => x < bord.d + m && x + w > bord.g - m && y < bord.b + m && y + h > bord.h - m;
  if (!mord(x, y)) return;
  if (bord.g - m - w >= 16) x = bord.g - m - w;
  else if (bord.d + m + w <= W - 16) x = bord.d + m;
  else { y = bord.b + m; x = clamp(x, 16, W - w - 16); }
  Object.assign(el.style, { left: x + 'px', right: 'auto', top: y + 'px' });
}

/* ---------------------------------------------------------------------
   CO-6 : la plaque de laiton du poteau. Rendue à la résolution de
   l'écran (plaque.js), posée sur le quadrilatère « plaque » du poteau ;
   la face couvre un rien plus que la plaque de la photo (1 px autour).
   Le quadrilatère est un rectangle : la pose est une translation calée
   sur les pixels de l'écran ; sinon, une homographie (matrix3d).
   --------------------------------------------------------------------- */
let plaqueCle = '', plaqueRendu = null;
async function poserPlaque() {
  const el = $('[data-plaque]'); if (!el || !L) return;
  const { P, iw, ih, imgLeft, imgTop } = L;
  const q = P.plaque.map(([u, v]) => [u * iw, v * ih]);
  const x0 = Math.min(q[0][0], q[3][0]) - 1.2, x1 = Math.max(q[1][0], q[2][0]) + 1.2, y0 = Math.min(q[0][1], q[1][1]) - 1, y1 = Math.max(q[2][1], q[3][1]) + 1;
  const dpr = Math.min(3, Math.max(1, devicePixelRatio || 1)), wd = Math.round((x1 - x0) * dpr), hd = Math.round((y1 - y0) * dpr);
  const cle = [wd, hd, dpr].join('x');
  if (cle !== plaqueCle) {
    plaqueCle = cle;
    const r = await plaqueLaiton(wd / dpr, hd / dpr, dpr);
    if (cle !== plaqueCle) return;
    el.width = r.canvas.width; el.height = r.canvas.height; el.getContext('2d').drawImage(r.canvas, 0, 0);
    plaqueRendu = r; el.dataset.mesure = JSON.stringify(r.mesure);
  }
  const [mL, mT, mR, mB] = plaqueRendu.marges, wc = el.width / dpr, hc = el.height / dpr;
  el.style.width = wc + 'px'; el.style.height = hc + 'px';
  const rect = Math.abs(q[0][1] - q[1][1]) < .5 && Math.abs(q[2][1] - q[3][1]) < .5 && Math.abs(q[0][0] - q[3][0]) < .5 && Math.abs(q[1][0] - q[2][0]) < .5;
  if (rect) {
    /* calée sur les pixels de l'écran : la position absolue du coin du canevas, arrondie au pixel de l'écran */
    const s = scene.getBoundingClientRect(), sx = s.left + scrollX, sy = s.top + scrollY;
    const ax = Math.round((sx + imgLeft + x0 - mL) * dpr) / dpr, ay = Math.round((sy + imgTop + y0 - mT) * dpr) / dpr;
    el.style.transform = `translate(${(ax - sx - imgLeft).toFixed(4)}px, ${(ay - sy - imgTop).toFixed(4)}px)`;
  } else {
    const wf = wc - mL - mR, hf = hc - mT - mB, H = (u, v) => { const a = q[0], b = q[1], c = q[2], d = q[3]; const top = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], bot = [d[0] + (c[0] - d[0]) * u, d[1] + (c[1] - d[1]) * u]; return [top[0] + (bot[0] - top[0]) * v, top[1] + (bot[1] - top[1]) * v]; };
    el.style.transform = epinglerQuad(wc, hc, [H(-mL / wf, -mT / hf), H(1 + mR / wf, -mT / hf), H(1 + mR / wf, 1 + mB / hf), H(-mL / wf, 1 + mB / hf)]);
  }
}

/* ---------------------------------------------------------------------
   Le CV en grand (au clic) : la feuille quitte le poteau et vient à vous
   --------------------------------------------------------------------- */
/* CO-25 (quatrième passe, 07/10/2026) : la feuille part de sa place exacte sur le poteau et y revient en un seul mouvement
   continu (une seule transformation, 450 ms, courbe douce), sans passer par le centre ni se décaler : la transformation
   finale est calculée sur la boîte du CV cloué et sur la petite rotation du vent du moment (le vent s'arrête pendant la
   lecture) ; l'ombre se règle sur celle de la feuille clouée ; la feuille du poteau reparaît dans la même image que la
   grande disparaît. Une loupe sur la feuille et, sur téléphone, « Lire le CV » sous la scène l'ouvrent. */
function brancherCvGrand() {
  const dlg = $('[data-cv-grand]'), fe = $('[data-cv-grand-feuille]'), cg = $('[data-cv-grand-canvas]'), source = $('[data-cv-lire]'), boite = $('[data-cv]');
  let ouvreur = source;
  /* la place clouée, vue depuis la grande feuille au repos (origine en haut à gauche) : matrix(a, b, c, d, tx, ty) */
  const placeClouee = () => {
    const C = boite.getBoundingClientRect(), B = fe.getBoundingClientRect(), s = C.width / B.width;
    const m = new DOMMatrixReadOnly(getComputedStyle(source).transform === 'none' ? undefined : getComputedStyle(source).transform);
    const ox = C.width * .5, oy = C.height * .04;
    const tx = C.left - B.left + ox - (m.a * ox + m.c * oy), ty = C.top - B.top + oy - (m.b * ox + m.d * oy);
    return { t: `matrix(${m.a * s}, ${m.b * s}, ${m.c * s}, ${m.d * s}, ${tx}, ${ty})`, s };
  };
  const ombre = s => `drop-shadow(${(5 / s).toFixed(2)}px ${(9 / s).toFixed(2)}px ${(6 / s).toFixed(2)}px rgba(8,5,2,.5))`;
  if (CV && CV.lien) { const [u0, v0, u1, v1] = CV.lien; Object.assign($('[data-cv-grand-lien]').style, { left: u0 * 100 + '%', top: v0 * 100 + '%', width: (u1 - u0) * 100 + '%', height: (v1 - v0) * 100 + '%' }); }
  let ouvert = false;
  const ouvrir = () => {
    if (!CV) return; ouvert = true;
    cg.width = CV.canvas.width; cg.height = CV.canvas.height; cg.getContext('2d').drawImage(CV.canvas, 0, 0);
    /* CO-25 : le vent s'arrête, la feuille quitte le poteau depuis sa place exacte */
    source.classList.add('au-repos');
    dlg.hidden = false; fe.getAnimations().forEach(a => a.cancel());
    const p = placeClouee();
    source.classList.add('en-grand'); boite.classList.add('en-grand');
    if (!reduit()) {
      fe.animate([{ transform: p.t, filter: ombre(p.s) }, { transform: 'translate(0,-6px)', offset: .75 }, { transform: 'none', filter: 'drop-shadow(0 30px 40px rgba(0,0,30,.4))' }], { duration: 620, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
    requestAnimationFrame(() => dlg.classList.add('ouvert'));
    $('.cv-grand__fermer').focus();
  };
  const fermer = () => {
    if (!ouvert) return; ouvert = false; dlg.classList.remove('ouvert');
    fe.getAnimations().forEach(a => a.cancel());
    const p = placeClouee();
    /* la feuille du poteau reparaît dans la même image que la grande s'en va (l'animation garde sa fin jusque-là) */
    const fin = () => { source.classList.remove('en-grand', 'au-repos'); boite.classList.remove('en-grand'); dlg.hidden = true; fe.getAnimations().forEach(a => a.cancel()); ouvreur.focus({ preventScroll: true }); ouvreur = source; };
    if (reduit()) { fin(); return; }
    fe.animate([{ transform: 'none', filter: 'drop-shadow(0 30px 40px rgba(0,0,30,.4))' }, { transform: p.t, filter: ombre(p.s) }], { duration: 450, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).finished.then(fin);
  };
  source.addEventListener('click', () => { ouvreur = source; ouvrir(); });
  /* CO-25 : « Lire le CV », sous la scène sur téléphone */
  $('[data-cv-lire-lien]').addEventListener('click', e => { ouvreur = e.currentTarget; ouvrir(); });
  $$('[data-cv-fermer]').forEach(b => b.addEventListener('click', fermer));
  addEventListener('keydown', e => { if (e.key === 'Escape') fermer(); if (e.key === 'Tab' && ouvert) { e.preventDefault(); const l = $('[data-cv-grand-lien]'), x = $('.cv-grand__fermer'); (document.activeElement === x ? l : x).focus(); } });
}

/* ---------------------------------------------------------------------
   Le croisement : chargement, entrée, vie
   --------------------------------------------------------------------- */
async function croisement() {
  MAN = await fetch(DOSSIER + 'manifeste.json').then(r => r.json()).catch(() => ({}));
  const noms = ['lointain', 'sol-chemin', 'cypres-1', 'cypres-2', 'vigne-1', 'vigne-2', 'herbes'];
  const ims = await Promise.all(noms.map(n => chargerImage(DOSSIER + n + '.webp')));
  noms.forEach((n, i) => { IMG[n === 'sol-chemin' ? 'sol' : n] = ims[i]; });
  /* CO-4, CO-22 : les deux inscriptions de la table LIBELLES, à la même taille (celle qui fait tenir la plus longue) ;
     le nom des boutons et leur description suivent la table */
  try { await document.fonts.load('800 54px Poppins'); } catch (e) {}
  const tFl = tailleFleches([LIBELLES.g.texte, LIBELLES.d.texte]);
  [['g', 31, 1], ['d', 47, 2]].forEach(([c, graine, n]) => {
    $(`.fleche--${c} .fleche__mot`).innerHTML = flecheGravee(LIBELLES[c].texte, graine, n, tFl);
    $(`.fleche--${c} .sr`).textContent = LIBELLES[c].texte;
    $(`#fleche-${c}-desc`).textContent = LIBELLES[c].lu;
  });
  CV = await preparerCv(Math.min(2, Math.max(1.4, devicePixelRatio || 1)));
  if (CV) { const c = $('[data-cv-canvas]'); c.width = CV.canvas.width; c.height = CV.canvas.height; CV.cible = c.getContext('2d'); CV.peindre(0); CV.cible.drawImage(CV.canvas, 0, 0); }
  placer();
  rendrePont(0);
  /* R9 (finitions du 07/10/2026) : le crochet d’essai ?pont (passerelle figée pour les preuves) est retiré */
  brancherFleches(); brancherCvGrand();
  let largeurAvant = innerWidth;
  addEventListener('resize', () => { if (Math.abs(innerWidth - largeurAvant) < 2 && innerWidth < 768) return; largeurAvant = innerWidth; clearTimeout(placer._t); placer._t = setTimeout(placer, 120); });
  /* l'entrée : le poteau se pose, le CV s'écrit, les culées de la passerelle se tracent (CO-24 : plus d'invite) */
  sec.classList.add('pret');
  const ecrire = (duree) => new Promise(res => {
    if (!CV) return res();
    if (reduit()) { CV.peindre(1); CV.cible.drawImage(CV.canvas, 0, 0); return res(); }
    const t0 = performance.now();
    const pas = t => { const q = clamp((t - t0) / duree); CV.peindre(eEntree(q) * .999 + (q >= 1 ? .001 : 0)); CV.cible.clearRect(0, 0, CV.canvas.width, CV.canvas.height); CV.cible.drawImage(CV.canvas, 0, 0); if (q < 1) requestAnimationFrame(pas); else res(); };
    requestAnimationFrame(pas);
  });
  setTimeout(async () => {
    await ecrire(2300);
    if (!etat) animerPont(REPOS);
    /* CO-17 : le lavis du paysage se peint pendant les temps morts, avant qu'on en ait besoin */
    setTimeout(() => peindreLavisMonde(), 1200);
    /* sur téléphone, sans survol : CO-24, la scène se démontre d'elle-même quand elle est bien en vue (le CV est écrit) */
    if (L.mob && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { if (es[0].intersectionRatio > .55 && !etat && !epingle) { setTimeout(() => { if (!etat && !epingle) demontrer(); }, 900); io.disconnect(); } }, { threshold: [0, .55, .8] });
      io.observe(scene);
    }
  }, reduit() ? 0 : 900);
}

/* ---------------------------------------------------------------------
   2. La route du déroulé, tracée à la plume au défilement.
   CO-9 (06/10/2026) : une route par rangée d'étapes (une à six colonnes,
   deux à trois colonnes : la seconde reprend à gauche, comme une ligne
   d'écriture) ; chaque borne est posée au-dessus de son étape, et son
   chiffre est dessiné au centre exact de sa face (mêmes coordonnées que
   le trait) ; au bout, la petite passerelle (le même dessin que celle du
   croisement) et « votre décision, accompagnée », posée au-dessus, visible
   dès que la route l'atteint. Sans sous-grille, les hauteurs des lignes
   sont égalisées ici.
   --------------------------------------------------------------------- */
function frise() {
  const racine = $('[data-frise]'), svg = $('[data-frise-trace]'), etapes = $$('[data-etape]'), but = $('[data-frise-but]');
  let D = null, pos = [], nums = [], vertical = false, pMax = 0, pont = null, sFin = 1, nL = 1;
  /* CO-28 (quatrième passe, 07/10/2026) : la route passe derrière les bornes. Les bornes ont leur propre calque, au-dessus de
     la route, et chacune un fond de papier opaque (la couleur du fond de la section) qui masque la route derrière elle ;
     il paraît quand la borne commence à se tracer. Sur ordinateur, chaque borne descend de 19 px : plantée au bord proche de
     la route (sa base juste sous le bord), elle se tient devant elle ; les chiffres restent au centre de la face. */
  let DB = null, fonds = [];
  const DESCENTE = 19;
  const NS = 'http://www.w3.org/2000/svg';
  const sousGrille = window.CSS && CSS.supports('grid-template-rows', 'subgrid');
  /* repli : sans sous-grille, le titre, le texte et « Vous recevez » prennent la hauteur du plus grand de leur rangée */
  const egaliser = () => {
    if (sousGrille) return;
    etapes.forEach(e => ['h3', 'p', 'dd'].forEach(s => { const x = $(s, e); if (x) x.style.minHeight = ''; }));
    if (innerWidth < 768) return;
    const rangs = {}; etapes.forEach(e => { const t = Math.round(e.offsetTop); (rangs[t] = rangs[t] || []).push(e); });
    Object.values(rangs).forEach(r => ['h3', 'p', 'dd'].forEach(s => { const els = r.map(e => $(s, e)).filter(Boolean); const m = Math.max(...els.map(x => x.getBoundingClientRect().height)); els.forEach(x => { x.style.minHeight = m + 'px'; }); }));
  };
  /* les deux bords d'une route, à d pixels de part et d'autre de sa ligne médiane */
  const bords = (pts, d) => {
    const g = [], h = [];
    pts.forEach((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const n = Math.hypot(nx, ny) || 1; nx /= n; ny /= n; g.push([p[0] - nx * d, p[1] - ny * d]); h.push([p[0] + nx * d, p[1] + ny * d]); });
    return [g, h];
  };
  const route = (pts, ph, graine, horizontale) => {
    const [b1, b2] = bords(pts, horizontale ? 9 : 8);
    D.trait(catmull(b1, 3), { phase: ph, wMin: .6, wMax: 1.9, tremble: .5, op: .8, graine });
    D.trait(catmull(b2, 3), { phase: ph, wMin: .6, wMax: 2.2, tremble: .5, op: .85, graine: graine + 1 });
    if (horizontale) hachures(D, b2.concat(b2.slice().reverse().map(([x, y]) => [x, y + 6])), { phase: ph, pas: 6, long: [8, 16], op: .3, graine: graine + 2, angle: 0 });
  };
  /* un chiffre, centré sur la face de la borne tracée en (x, y) : la face va de x à x + 40, de y (le haut de l'arc) à y + 40 */
  const numero = (x, y, n) => {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', (x + 20).toFixed(1)); t.setAttribute('y', (y + 23).toFixed(1));
    t.setAttribute('text-anchor', 'middle'); t.setAttribute('class', 'frise__num'); t.setAttribute('opacity', '0');
    t.textContent = String(n); svg.appendChild(t); nums.push(t);
    return t;
  };
  /* le chiffre posé : son encre mesurée (la même police dans un canevas), centrée sur le centre de la face (x + 20, y + 23) */
  const mesure = document.createElement('canvas').getContext('2d');
  const centrer = () => {
    mesure.font = `700 26px ${getComputedStyle(document.documentElement).getPropertyValue('--main') || 'Caveat'}`;
    nums.forEach(t => {
      const m = mesure.measureText(t.textContent), cx = +t.dataset.cx, cy = +t.dataset.cy;
      t.setAttribute('text-anchor', 'start');
      t.setAttribute('x', (cx - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2).toFixed(2));
      t.setAttribute('y', (cy + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2).toFixed(2));
    });
  };
  const construire = () => {
    egaliser();
    svg.innerHTML = ''; nums = []; fonds = [];
    const gR = document.createElementNS(NS, 'g'), gF = document.createElementNS(NS, 'g'), gB = document.createElementNS(NS, 'g'), gP = document.createElementNS(NS, 'g'); svg.append(gR, gF, gB, gP);   /* CO-28 : route, fonds des bornes, bornes */
    D = new Dessin(gR, ENCRE); DB = new Dessin(gB, ENCRE); DB.fonds = gF;
    const r = racine.getBoundingClientRect(), W = r.width, Hh = r.height;
    vertical = innerWidth < 768;
    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`); svg.style.height = Hh + 'px';
    let xb, yb, kp, butTop, butLeft = null;
    if (!vertical) {
      /* les rangées d'étapes, et une route au-dessus de chacune (68 px au-dessus du haut des textes) */
      const tops = etapes.map(e => Math.round(e.getBoundingClientRect().top - r.top));
      const rangs = [...new Set(tops)].sort((a, b) => a - b); nL = rangs.length;
      const yr = (j, x) => rangs[j] - 68 + Math.sin(x / W * Math.PI * 3.2 + j * 1.3) * 7;
      const xFin = W - 142;
      rangs.forEach((t, j) => {
        const fin = j === nL - 1 ? xFin : W + 8, pts = [];
        for (let x = j ? -8 : -10; x <= fin; x += 12) pts.push([x, yr(j, x)]);
        pts.push([fin, yr(j, fin)]);
        route(pts, 'route' + j, 1 + j * 5, true);
      });
      etapes.forEach((e, i) => {
        const x = e.getBoundingClientRect().left - r.left, j = rangs.indexOf(tops[i]), y = yr(j, x + 20) - 49 + DESCENTE;   /* CO-28 */
        borne(DB, x, y, 'b' + i, i);
        const t = numero(x, y, i + 1); t.dataset.cx = x + 20; t.dataset.cy = y + 23;
        pos[i] = (j + (x + 20) / W) / nL;
      });
      sFin = (nL - 1 + xFin / W) / nL;
      kp = 17.4; xb = xFin + 2; yb = yr(nL - 1, xFin) + 2;
      butTop = yb - 40;
    } else {
      /* sur téléphone : la route descend à gauche des étapes, puis tourne vers la passerelle, au pied de la frise */
      const bas = Hh - 128, pts = [];
      for (let y = -10; y <= bas; y += 12) pts.push([28 + Math.sin(y / Hh * Math.PI * 4) * 6, y]);
      const x0 = pts[pts.length - 1][0];
      catmull([[x0, bas], [x0 + 2, bas + 30], [x0 + 12, bas + 62], [x0 + 26, bas + 80], [x0 + 38, bas + 84]], 5).slice(1).forEach(p => pts.push(p));
      route(pts, 'route0', 1, false); nL = 1;
      etapes.forEach((e, i) => {
        const y = e.getBoundingClientRect().top - r.top + 22 - 26;
        borne(DB, 8, y, 'b' + i, i);   /* CO-28 : la route verticale passe derrière la borne */
        const t = numero(8, y, i + 1); t.dataset.cx = 28; t.dataset.cy = y + 23;
        pos[i] = (y + 26) / Hh;
      });
      sFin = (bas + 70) / Hh;
      kp = 14; xb = x0 + 38; yb = bas + 84;
      butTop = yb - 40; butLeft = 66;
    }
    D.monter(); DB.monter();
    /* au bout de la route, la petite passerelle : le même dessin, en vue de trois quarts (le fond s'éloigne en haut à gauche) */
    const P = (x, y, z) => [xb + kp * (x - .3 * z), yb - kp * (y + .2 * z)];
    pont = new Passerelle(gP, P, { e: .72, papier: '#f7f4ed', pw: .44, jeu: .07, graine: 9, opLoin: .42 });
    /* et l'eau sous la passerelle, quelques rides à la plume */
    const De = new Dessin(gP, ENCRE);
    for (let i = 0; i < 5; i++) { const x = 1.2 + (i % 3) * 1.4 + (i > 2 ? .6 : 0), y = -.44 - (i > 2 ? .08 : 0); De.trait([P(x, y, -.6 - (i > 2 ? .5 : 0)), P(x + .8, y, -.62 - (i > 2 ? .5 : 0))], { phase: 'eau', wMin: .4, wMax: 1, tremble: .3, op: .55, graine: 300 + i }); }
    De.monter(); pont.eau = De;
    gP.insertBefore(De.g, gP.firstChild);
    centrer();
    /* la légende, au-dessus de la passerelle (son bas à 12 px au-dessus de la main courante), alignée sur le bord droit de
       la frise (sur téléphone, sur la colonne du texte) ; à six colonnes, en deux lignes pour ne pas toucher la sixième borne */
    if (but) {
      const bp = pont.boite();
      but.classList.toggle('deux-lignes', !vertical && nL === 1);
      if (butLeft !== null) { but.style.left = butLeft + 'px'; but.style.right = 'auto'; } else { but.style.left = 'auto'; but.style.right = '0px'; }
      but.style.top = '0px';
      const hb = but.getBoundingClientRect().height;
      but.style.top = (bp[1] - 12 - hb) + 'px';
    }
  };
  function borne(D, x, y, ph, i) {
    const P = catmull([[x, y + 40], [x, y + 14], [x + 4, y + 4], [x + 20, y], [x + 36, y + 4], [x + 40, y + 14], [x + 40, y + 40]], 5);
    /* CO-28 : le fond de papier de la face, jusqu'à la base, qui masque la route derrière la borne */
    if (D.fonds) { const f = document.createElementNS(NS, 'path'); f.setAttribute('d', 'M' + P.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + `L${(x + 40).toFixed(1)} ${(y + 41).toFixed(1)}L${x.toFixed(1)} ${(y + 41).toFixed(1)}Z`); f.setAttribute('fill', '#f7f4ed'); f.setAttribute('opacity', '0'); D.fonds.appendChild(f); fonds[i] = f; }
    D.trait(P, { phase: ph, wMin: .8, wMax: 2.2, tremble: .4, op: .88, graine: 10 + i });
    D.trait(ligne(x - 6, y + 41, x + 46, y + 40), { phase: ph, wMin: .5, wMax: 1.6, tremble: .4, op: .7, graine: 30 + i });
    hachures(D, [[x + 30, y + 8], [x + 39, y + 14], [x + 39, y + 39], [x + 30, y + 39]], { phase: ph, pas: 2.6, long: [5, 10], op: .45, graine: 40 + i, angle: 70 });
  }
  const majProg = () => {
    if (!D) return;
    const r = racine.getBoundingClientRect(), H = innerHeight;
    const p = reduit() ? 1 : clamp((H * .78 - r.top) / (r.height * .78));
    pMax = Math.max(pMax, p);
    const s = pMax * 1.04, prog = {};
    for (let j = 0; j < nL; j++) prog['route' + j] = clamp((s - j / nL) * nL);
    etapes.forEach((e, i) => {
      const k = clamp((s - pos[i]) / .05);
      prog['b' + i] = k; e.classList.toggle('atteinte', k > .2);
      if (nums[i]) nums[i].setAttribute('opacity', clamp((k - .55) / .35).toFixed(2));
      if (fonds[i]) fonds[i].setAttribute('opacity', clamp(k * 3).toFixed(2));   /* CO-28 */
    });
    const u = clamp((s - sFin) / Math.max(.02, 1.04 - sFin));
    D.rendre(prog); if (DB) DB.rendre(prog);   /* CO-28 */
    if (pont) { pont.rendre(u); pont.eau.rendre({ eau: clamp(u / .3) }); }
    racine.classList.toggle('finie', s >= sFin);
  };
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting && !D) { construire(); majProg(); } }, { rootMargin: '200px' });
  io.observe(racine);
  addEventListener('scroll', () => requestAnimationFrame(majProg), { passive: true });
  addEventListener('resize', () => { if (!D) return; clearTimeout(frise._t); frise._t = setTimeout(() => { construire(); majProg(); }, 160); });
  if (document.fonts) document.fonts.ready.then(() => { if (D) { construire(); majProg(); } });
}

/* ---------------------------------------------------------------------
   CO-16 (06/10/2026) : la prise de risque est la vraie écriture de
   Thibaut (ecriture.js) ; la signature à part de CO-15 (initiales et
   second point en code) n'existe plus : « Thibaut H. » et son point sont
   dans l'écriture.
   --------------------------------------------------------------------- */

/* ---------------------------------------------------------------------
   3. La fiche de demande.
   CO-14 (06/10/2026) : à la fin, « Envoyer ma fiche » l'envoie pour de
   vrai, par le même chemin que le formulaire de contact (Formspree :
   nom, structure, email, tel, et la fiche entière, résumé compris) ; le
   numéro provisoire est dans l'objet du message ; « Copier ma fiche »
   reste en second geste ; mêmes trois états que le contact (en cours,
   réussite, échec avec le courriel de secours qui emporte la fiche). La
   fiche en cours se garde le temps de la session du navigateur : un
   rechargement ne la perd pas.
   --------------------------------------------------------------------- */
/* CO-39 (07/10/2026, soir) : nouvelle clé, une fiche gardée avec les anciens domaines ne revient pas */
const CLE_FICHE = 'civik-ia-conseil-fiche-3-domaines';
const memoire = {
  lire() { try { return JSON.parse(sessionStorage.getItem(CLE_FICHE) || 'null'); } catch (e) { return null; } },
  ecrire(v) { try { sessionStorage.setItem(CLE_FICHE, JSON.stringify(v)); } catch (e) {} },
  oublier() { try { sessionStorage.removeItem(CLE_FICHE); } catch (e) {} }
};
function demande() {
  const form = $('[data-pas-form]'), fiche = new Fiche($('[data-fiche]')), zone = $('[data-fiche-zone]');
  const etapes = $$('.pas__etape', form), barre = $('[data-pas-barre]'), etatTxt = $('[data-pas-etat]');
  const retour = $('[data-pas-retour]'), suite = $('[data-pas-suite]'), bloc = $('[data-fiche-envoi]'), second = $('[data-pas-second]');
  const d = new Date(), garde = memoire.lire();
  const num = (garde && garde.num) || `C-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;
  $('[data-fiche-date]').textContent = AUJOURDHUI;
  $('[data-fiche-num]').textContent = num;
  /* CO-26 (quatrième passe, 07/10/2026) : sur téléphone (sous 768 px), la bande, le panneau et la relecture en place */
  const telephone = () => innerWidth < 768;
  const bande = $('[data-fiche-bande]'), panneau = $('[data-fiche-panneau]'), fin = $('[data-fiche-fin]'), envoyerBas = $('[data-fiche-envoyer]');
  const bLigne = $('[data-bande-ligne]'), bDt = $('.fiche-bande__dt', bLigne), bDd = $('.fiche-bande__dd', bLigne);
  $('[data-bande-num]').textContent = num;
  /* la progression de la bande suit celle du formulaire */
  new MutationObserver(() => { $('[data-bande-etat]').textContent = etatTxt.textContent; }).observe(etatTxt, { childList: true, characterData: true, subtree: true });
  /* la hauteur de la bande, pour que le formulaire s'arrête sous elle (page.css, scroll-margin-top) */
  const mesurerBande = () => { if (telephone()) $('.demande').style.setProperty('--bande-h', bande.offsetHeight + 'px'); };
  addEventListener('resize', mesurerBande, { passive: true });
  /* quand la section est à l'écran sur téléphone, un champ qui prend le focus ne se cache pas sous la barre et la bande */
  if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => {
    document.documentElement.style.scrollPaddingTop = e.isIntersecting && telephone() && !zone.classList.contains('complete') ? (90 + bande.offsetHeight) + 'px' : '';
  }), { threshold: 0 }).observe(form);
  /* le panneau : un toucher sur la bande l'ouvre ; la croix, Échap ou un glissé vers le bas le referment */
  let panneauOuvert = false;
  const ouvrirPanneau = () => {
    if (!telephone() || zone.classList.contains('complete')) return;
    panneauOuvert = true; zone.classList.add('panneau-ouvert'); document.documentElement.classList.add('fiche-ouverte');
    panneau.setAttribute('role', 'dialog'); panneau.setAttribute('aria-modal', 'true'); panneau.scrollTop = 0;
    bande.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => { panneau.classList.add('ouvert'); $('[data-fiche-fermer]').focus({ preventScroll: true }); });
  };
  const fermerPanneau = () => {
    if (!panneauOuvert) return; panneauOuvert = false;
    panneau.classList.remove('ouvert', 'glisse'); panneau.style.transform = '';
    document.documentElement.classList.remove('fiche-ouverte'); bande.setAttribute('aria-expanded', 'false');
    panneau.removeAttribute('role'); panneau.removeAttribute('aria-modal');
    setTimeout(() => { if (!panneauOuvert) zone.classList.remove('panneau-ouvert'); }, reduit() ? 0 : 460);
    bande.focus({ preventScroll: true });
  };
  bande.addEventListener('click', ouvrirPanneau);
  $('[data-fiche-fermer]').addEventListener('click', fermerPanneau);
  addEventListener('keydown', e => { if (!panneauOuvert) return; if (e.key === 'Escape') fermerPanneau(); if (e.key === 'Tab') { e.preventDefault(); $('[data-fiche-fermer]').focus(); } });
  { let y0 = null, dy = 0;
    panneau.addEventListener('touchstart', e => { y0 = panneauOuvert && panneau.scrollTop <= 0 ? e.touches[0].clientY : null; dy = 0; }, { passive: true });
    panneau.addEventListener('touchmove', e => { if (y0 === null) return; dy = e.touches[0].clientY - y0; if (dy > 0) { e.preventDefault(); panneau.classList.add('glisse'); panneau.style.transform = `translate3d(0,${dy}px,0)`; } }, { passive: false });
    panneau.addEventListener('touchend', () => { if (y0 === null) return; y0 = null; panneau.classList.remove('glisse'); panneau.style.transform = ''; if (dy > 90) fermerPanneau(); }); }
  /* la relecture en place, sur téléphone : la fiche entière sous le formulaire, puis l'envoi (le bloc d'état et « Copier
     ma fiche » descendent sous la fiche, et y restent jusqu'au retour) */
  let relecture = false;
  const marqueBloc = document.createComment('bloc'), marqueSecond = document.createComment('second');
  bloc.before(marqueBloc); second.before(marqueSecond);
  /* DJ-5 (avis DAJF du 08/10/2026) : la mention de l'étape 5 accompagne l'envoi ; pendant la relecture sur téléphone, elle descend
     sous « Envoyer ma fiche » (sinon la fiche entière la séparait du bouton), et remonte au retour */
  const mention = $('.pas__etape[data-etape-n="5"] .mention', form), marqueMention = document.createComment('mention');
  mention.before(marqueMention);
  const entrerRelecture = () => {
    relecture = true; fermerPanneau(); fin.hidden = false; envoyerBas.after(mention); fin.append(bloc, second); second.hidden = false; suite.hidden = true;   /* DJ-5 : la mention sous le bouton */
    document.documentElement.style.scrollPaddingTop = '';
    etatTxt.textContent = 'Fiche complète';
    const t = $('#fiche-titre'); t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true });
    zone.scrollIntoView({ block: 'start', behavior: reduit() ? 'auto' : 'smooth' });
  };
  const quitterRelecture = () => {
    if (!relecture) return; relecture = false;
    zone.classList.remove('complete'); fin.hidden = true; marqueBloc.after(bloc); marqueSecond.after(second); marqueMention.after(mention); suite.hidden = false;   /* DJ-5 */
  };
  /* CO-8 (jamais « Santé et territoires », le nom d'une filiale d'une banque) ; CO-39 (07/10/2026, soir) : les trois domaines
     de la page, en toutes lettres sur la fiche (et donc sur la bande du téléphone, dans le texte copié et dans le texte
     envoyé) ; pour « Plusieurs de ces domaines », la fiche nomme les domaines dont une situation est cochée (« La santé et
     l'intelligence artificielle »), ou « Plusieurs domaines » si aucune ne l'est */
  const DOM = { sante: 'La santé', collectivites: 'Les collectivités territoriales', ia: 'L’intelligence artificielle' };
  const minus = t => t ? t[0].toLowerCase() + t.slice(1) : t;
  const domaineTexte = () => {
    const d = val('domaine'); if (d !== 'plusieurs') return DOM[d] || '';
    const g = Object.keys(DOM).filter(k => $$(`[data-pour="${k}"] input:checked`, form).length);
    return g.length ? cap(liste(g.map(k => minus(DOM[k])))) : 'Plusieurs domaines';
  };
  const val = n => { const el = form.elements[n]; if (!el) return ''; if (el instanceof RadioNodeList || el.length) { const c = $$(`[name="${n}"]`, form).filter(x => x.checked).map(x => x.value); return c.join(', '); } return el.value.trim(); };
  const liste = arr => arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' et ' + arr[arr.length - 1];
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  const majFiche = (nom, immediat) => {
    const champs = { type: () => val('type'), taille: () => val('taille') ? cap(val('taille')) : '', role: () => val('role'), domaine: domaineTexte, situation: () => { const d = val('domaine'); return cap(liste($$('[name="situation"]', form).filter(x => x.checked && (d === 'plusieurs' || x.closest('[data-pour]').dataset.pour === d)).map(x => x.value))); }, libre: () => val('libre'), attente: () => cap(liste($$('[name="attente"]', form).filter(x => x.checked).map(x => x.value))), delai: () => cap(val('delai')), budget: () => cap(val('budget')), nom: () => val('nom'), structure: () => val('structure'), courriel: () => val('courriel'), tel: () => val('tel') };
    const faire = n => { if (champs[n]) fiche.ecrire(n, champs[n](), immediat); };
    /* CO-39 : une situation cochée peut changer le domaine écrit (« Plusieurs de ces domaines ») : le domaine d'abord, puis la
       situation, qui reste la dernière ligne écrite (celle de la bande du téléphone) */
    if (nom) { if (nom === 'situation') faire('domaine'); faire(nom); if (nom === 'domaine') faire('situation'); } else Object.keys(champs).forEach(faire);
  };
  /* CO-34 (cinquième passe, 07/10/2026) : la confidentialité n'est plus demandée (plus de ligne dans « champs ») ; le délai et
     le budget sont facultatifs : une fois l'étape 4 passée, une contrainte non renseignée s'écrit « non précisé » sur la
     fiche (son texte de ligne vide devient « non précisé »), sur la bande du téléphone (avec le surlignage bref de la ligne
     qui s'écrit) et dans le texte copié ou envoyé (texteFiche) ; avant l'étape 4, elle reste « à préciser » */
  const FACULTATIFS = ['delai', 'budget'], NON_PRECISE = 'non précisé';
  const nonPrecise = surligner => {
    let derniere = null;
    FACULTATIFS.forEach(cle => {
      const dd = $(`[data-l="${cle}"]`, fiche.racine); dd.dataset.vide = NON_PRECISE;
      if (fiche.valeurs[cle] || !dd.classList.contains('vide') || dd.textContent === NON_PRECISE) return;
      dd.textContent = NON_PRECISE; derniere = dd;
      if (surligner) { dd.classList.remove('ecrit'); void dd.offsetWidth; dd.classList.add('ecrit'); }
    });
    if (derniere && surligner) { bDt.textContent = derniere.previousElementSibling.textContent; bDd.textContent = NON_PRECISE; bDd.classList.add('vide'); bLigne.classList.remove('ecrit'); void bLigne.offsetWidth; bLigne.classList.add('ecrit'); mesurerBande(); }
  };
  /* CO-14 : la fiche gardée le temps de la session (les réponses, l'étape, le numéro) */
  let n = 1;
  const garder = () => {
    if (form.classList.contains('fini')) return;
    const v = {};
    $$('input,textarea', form).forEach(c => { if (!c.name || c.name === '_gotcha') return; if (c.type === 'radio' || c.type === 'checkbox') { if (c.checked) (v[c.name] = v[c.name] || []).push(c.value); } else if (c.value) v[c.name] = c.value; });
    memoire.ecrire({ num, n, v });
  };
  $$('input[type=tel]', form).forEach(c => { c.addEventListener('blur', () => { if (c.value) verifierChamp(c); }); c.addEventListener('input', () => { if (c.getAttribute('aria-invalid') === 'true') verifierChamp(c); }); });   /* P4 */
  form.addEventListener('change', e => { const n = e.target.name; if (n === 'domaine') $('[data-situations]').dataset.domaine = e.target.value; majFiche(n); effacerErreur(); garder(); });
  let tempo = 0;
  form.addEventListener('input', e => { if (e.target.matches('input[type=text],input[type=email],input[type=tel],textarea')) { clearTimeout(tempo); const n = e.target.name; tempo = setTimeout(() => { majFiche(n); garder(); }, 450); } });
  /* sur téléphone, la fiche (collée en haut) suit la ligne qui s'écrit */
  $('[data-fiche]').addEventListener('ligne', e => {
    const dd = e.detail; dd.classList.remove('ecrit'); void dd.offsetWidth; dd.classList.add('ecrit');
    /* CO-26 : la bande montre la ligne qui vient de s'écrire, en entier (une ligne vidée ne remplace pas la précédente) */
    const v = fiche.valeurs[dd.dataset.l];
    if (v) { bDt.textContent = dd.previousElementSibling ? dd.previousElementSibling.textContent : ''; bDd.textContent = v; bDd.classList.remove('vide'); bLigne.classList.remove('ecrit'); void bLigne.offsetWidth; bLigne.classList.add('ecrit'); mesurerBande(); }
    if (innerWidth <= 900 && !telephone() && !zone.classList.contains('complete')) { const z = zone.getBoundingClientRect(), r = dd.getBoundingClientRect(); const cible = zone.scrollTop + (r.top - z.top) - z.height * .45; zone.scrollTo({ top: Math.max(0, cible), behavior: reduit() ? 'auto' : 'smooth' }); }
  });
  const erreurEtape = () => $('[data-erreur]', etapes[n - 1]);
  const effacerErreur = () => { const e = erreurEtape(); if (e) e.textContent = ''; };
  const FLECHE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  const afficher = (k, focus = true) => {
    /* P4 : l'étape montrée (1 à 5) et le sens, sans rien de saisi ; pas à l'affichage initial ni au retour de la fiche gardée */
    if (focus && k !== n) mesurer('formulaire_etape', { formulaire: 'fiche_demande', etape: k, sens: k > n ? 'avant' : 'arriere' });
    etapes.forEach((f, i) => { f.hidden = i !== k - 1; f.classList.toggle('entre', i === k - 1 && !reduit()); });
    n = k;
    barre.style.transform = `scaleX(${k / 5})`;
    etatTxt.textContent = `Étape ${k} sur 5`;
    retour.hidden = k === 1;
    /* CO-14 : « Envoyer ma fiche » à la dernière étape, et « Copier ma fiche » en second geste */
    /* CO-26 : sur téléphone, la dernière étape mène d'abord à la relecture de la fiche, en place ; l'envoi est dessous */
    /* P3 (partie 5) : « Relire ma fiche » au téléphone (le même verbe que la bande), puis « Envoyer ma fiche » ; la flèche dit un
       déplacement : pas de flèche sur l'envoi */
    suite.innerHTML = k === 5 ? (telephone() ? 'Relire ma fiche ' + FLECHE : 'Envoyer ma fiche') : 'Suivant ' + FLECHE;
    second.hidden = k !== 5 || (telephone() && !relecture);
    const hautLibre = telephone() ? 90 + bande.offsetHeight : 70;
    if (focus) { const l = $('legend', etapes[k - 1]); l.setAttribute('tabindex', '-1'); l.focus({ preventScroll: true }); if (form.getBoundingClientRect().top < hautLibre) form.scrollIntoView({ block: 'start', behavior: reduit() ? 'auto' : 'smooth' }); }
  };
  const valide = () => {
    const f = etapes[n - 1];
    for (const g of $$('[data-requis]', f)) {
      if (!$$('input', g).some(x => x.checked)) { const e = erreurEtape(); e.textContent = g.dataset.manque; $('input', g).focus(); return false; }
    }
    /* P4 (partie 5) : le téléphone, facultatif, vérifié s'il est rempli (format souple, pages.js) */
    const req = $$('input[required],textarea[required],input[type=tel]', f); let ok = true;
    req.forEach(c => { if (!verifierChamp(c) && ok) { ok = false; c.focus(); } });
    return ok;
  };
  /* le résumé en une phrase, écrit sur la fiche (à l'envoi, ou à la copie) */
  const resumer = () => {
    const QUI = { 'Établissement de santé': 'Un établissement de santé', 'Collectivité': 'Une collectivité', 'Entreprise': 'Une entreprise', 'Association': 'Une association', 'Autre structure': 'Une structure' };
    /* CO-39 : le domaine en toutes lettres (« sur les collectivités territoriales ») */
    const dom = domaineTexte();
    const taille = val('taille'), att = $$('[name="attente"]', form).filter(x => x.checked).map(x => x.value);
    const phrase = `${QUI[val('type')] || 'Une structure'}${taille ? ' de ' + taille : ''}, qui attend ${liste(att) || 'un premier échange'}${dom ? ', sur ' + minus(dom) : ''}${val('delai') ? ', ' + val('delai') : ''}.`;
    const res = $('[data-fiche-resume]'); res.hidden = false; res.innerHTML = `<b>En résumé :</b> ${phrase.replace(/</g, '&lt;')}`;
  };
  const texteFiche = () => {
    let t = fiche.texte(`Fiche de demande, conseil (civik-ia.fr), ${AUJOURDHUI}, n° provisoire ${num}`);
    /* CO-34 : le texte commun (Fiche.texte) écrit « à préciser » pour une ligne vide ; le délai et le budget non renseignés
       y sont « non précisé », comme sur la fiche */
    FACULTATIFS.forEach(cle => { if (fiche.valeurs[cle]) return; const dt = $(`[data-l="${cle}"]`, fiche.racine).previousElementSibling.textContent; t = t.replace(new RegExp(`^${dt} : à préciser$`, 'm'), `${dt} : ${NON_PRECISE}`); });
    return t;
  };
  $('[data-copier-fiche]').addEventListener('click', async () => { majFiche(null, true); resumer(); $('[data-copie-ok]').textContent = (await copier(texteFiche())) ? 'Fiche copiée. Collez-la où vous voulez.' : 'La copie a échoué\u00a0: sélectionnez la fiche à la main.'; });   /* R2 : insécable */
  retour.addEventListener('click', () => { quitterRelecture(); afficher(Math.max(1, n - 1)); garder(); });   /* CO-26 : le retour quitte la relecture */
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.dataset.enCours) return;
    if (!valide()) return;
    if (n === 4) nonPrecise(true);   /* CO-34 */
    if (n < 5) { afficher(n + 1); garder(); return; }
    /* la fin : la fiche complète et son résumé, puis l'envoi réel (site final : événement generate_lead « conseil ») */
    majFiche(null, true); resumer();
    zone.classList.add('complete');
    /* CO-26 : sur téléphone, la fiche entière se relit en place d'abord ; l'envoi part du bouton placé sous elle */
    if (telephone() && !relecture) { entrerRelecture(); return; }
    /* R7 (finitions du 07/10/2026) : l’envoi passe par le mécanisme commun (pages.js, envoyerFiche) : l’objet
       (data-sujet, suivi du numéro), la voix et les textes de réussite sont des attributs du formulaire ; mêmes champs,
       mêmes trois états qu’avant */
    if (!envoiReel(form)) return;
    etatTxt.textContent = 'Envoi de la fiche';
    const ok = await envoyerFiche(form, { texte: texteFiche(), num, bouton: relecture ? envoyerBas : suite, bloc, sujet: 'Fiche de demande, conseil' });
    if (ok) { form.classList.add('fini'); etatTxt.textContent = 'Fiche envoyée'; memoire.oublier(); if (relecture) envoyerBas.hidden = true; }
    else etatTxt.textContent = 'Fiche complète';
  });
  /* CO-14 : la fiche gardée revient (les réponses, sans l'écriture lettre à lettre, et l'étape) */
  if (garde && garde.v) {
    Object.entries(garde.v).forEach(([nom, v]) => {
      const els = $$(`[name="${nom}"]`, form);
      if (Array.isArray(v)) els.forEach(c => { c.checked = v.includes(c.value); }); else if (els[0]) els[0].value = v;
    });
    if (form.elements.domaine && val('domaine')) $('[data-situations]').dataset.domaine = val('domaine');
    majFiche(null, true);
    if ((garde.n || 1) >= 5) nonPrecise(false);   /* CO-34 : la fiche gardée revient à l'étape 5 avec « non précisé » */
    afficher(clamp(garde.n || 1, 1, 5), false);
  } else afficher(1, false);
  mesurerBande();
}

/* ---------------------------------------------------------------------
   Lancement
   --------------------------------------------------------------------- */
croisement();
frise();
/* CO-18 : le logo LinkedIn du CV, le même tracé et la même encre (le trait, puis sa reprise plus légère, comme sur la feuille) */
$$('[data-logo-plume]').forEach(s => { s.innerHTML = `<path d="${LOGO_D}" stroke-width=".085" stroke-opacity=".9"/><path d="${LOGO_D}" transform="translate(.012 .018)" stroke-width=".05" stroke-opacity=".35"/>`; });
ecriture($('[data-ecriture]'));
demande();
formulaireCourt($('[data-court]'), 'conseil');
$$('[data-portrait]').forEach(observer);
