/* =====================================================================
   Le CV (deuxième passe, 02/10/2026) : une vraie feuille A4 (feuille.webp,
   ou son provisoire), le CV imprimé dedans en multiplication, rendue en
   WebGL par le module papier. La même feuille partout : sur la planche
   brûlée du poteau (soulevée par le vent, devant le clou de la planche),
   prise entière par la main (T10, 07/10/2026 : plus de déchirure), tenue
   dans la main droite pendant la marche, épinglée sur la planche à dessin
   (un coin rebique), puis griffonnée en son dessin à la plume.
   Le texte du CV reste dans la page pour les lecteurs d'écran.
   ===================================================================== */
import { clamp, lerp, rng, quadVersQuad, carreVers, appl, epingle, setT, setO, setV, el, DOIGT, zoneDoigtQuad } from './outils.js';
import { projPlane, rafale, LUMIERE } from './papier.js';
import { dosPapier } from './provisoires/papier.js';
import { DOSSIER, lireManifeste } from './visuels.js';
import { liberer, TEL, VUE } from './memoire.js';
import { planifier, terminer, ouvrier } from './lavis.js';

export const CV_W = 600, CV_H = 848;
/* quatrième passe, D2 : le contenu, à la lettre */
const LIGNES = ['Direction de clinique', 'Direction de la transformation numérique en santé', 'Direction de la stratégie et du développement en télémédecine', 'Direction des affaires publiques'];
/* Q2 (dix-septième passe, 07/10/2026) : le rôle écrit comme sur la page Conseil (Caveat dessine l'esperluette) */
/* 07/10/2026 au soir (textes de Thibaut, passe 5 de la page Conseil) : trois domaines, pas la seule « santé numérique » : la virgule */
const TITRE = 'Conseil en santé, numérique & intelligence artificielle';
/* la coupe voulue du rôle sur la feuille (comme sur la page Conseil) : « artificielle » ne reste pas seul sur sa ligne ; si une
   ligne ne tient pas dans la largeur, la coupe automatique reprend la main */
const TITRE_LIGNES = ['Conseil en santé, numérique', '& intelligence artificielle'];
const LIEN = 'Voir mon parcours sur LinkedIn', LIEN_COURT = 'Mon parcours', LINKEDIN = 'https://www.linkedin.com/in/thibaut-harang/';
/* G7 : le logo LinkedIn griffonné à la plume, dans un carré unité : le carré aux coins doux, un peu irrégulier, et
   « in » tracé à la main (le même chemin sert au canevas du CV et au lien en bleu, au survol) */
const LOGO_D = (() => {
  const R = rng(4417), j = () => ((R() - .5) * .035).toFixed(3), f = v => v.toFixed(3);
  const p = (x, y) => `${f(x + +j())} ${f(y + +j())}`;
  const r = .24;
  let d = `M${p(r, .03)}L${p(1 - r, .02)}Q${p(.99, .01)} ${p(.98, r)}L${p(.985, 1 - r)}Q${p(.98, .985)} ${p(1 - r, .975)}L${p(r, .985)}Q${p(.02, .98)} ${p(.025, 1 - r)}L${p(.02, r)}Q${p(.03, .03)} ${p(r + .03, .035)}`;
  d += `M${p(.285, .45)}L${p(.29, .79)}`;
  d += `M${p(.27, .27)}a.045 .045 0 1 0 .04 .01`;
  d += `M${p(.45, .79)}L${p(.455, .45)}M${p(.455, .56)}C${p(.5, .43)} ${p(.73, .41)} ${p(.745, .55)}L${p(.75, .79)}`;
  return d;
})();
const LOGO = typeof Path2D === 'function' ? new Path2D(LOGO_D) : null;
/* D3 : le portrait à la plume, petit, dans le coin ; pour le retirer complètement : false (ou ?croquis=0 dans l'adresse) */
const PORTRAIT_CROQUIS = new URLSearchParams(location.search).get('croquis') !== '0';
/* D1 (amendé le 02/10/2026 au soir) : une écriture inspirée de celle de Thibaut, Caveat réglée sur sa phrase :
   trait fin de stylo à bille, lettres rondes et larges, mots très espacés, pente presque droite, ligne de base qui
   ondule, lignes tournées de moins d'un degré, tremblé léger (filtre SVG), encre #16205C */
const MAIN = 'Caveat, cursive', GRAISSE = 400, LARGE = 1.17, DROIT = .15, ENCRE_CV = '#16205C';
function filtreTremble() {
  if (document.getElementById('tremble-cv')) return;
  const d = document.createElement('div'); d.setAttribute('aria-hidden', 'true'); d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML = '<svg width="0" height="0"><filter id="tremble-cv" x="-5%" y="-20%" width="110%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7" result="b"/><feDisplacementMap in="SourceGraphic" in2="b" scale="1.6" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';
  document.body.appendChild(d);
}
const charger = src => new Promise(r => { const i = new Image(); i.onload = () => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()).then(() => r(i)); i.onerror = () => r(null); i.src = src; });

/* lignes de texte coupées à une largeur */
function couper(g, txt, larg) {
  const mots = txt.split(' '), out = []; let l = '';
  mots.forEach(m => { const e = l ? l + ' ' + m : m; if (g.measureText(e).width > larg && l) { out.push(l); l = m; } else l = e; });
  if (l) out.push(l); return out;
}
/* Une ligne écrite à la main : mot par mot, ligne de base qui ondule, légère rotation (moins d'un degré).
   Renvoie la largeur. dessiner : false pour mesurer. */
function ecrireMain(g, txt, x, y, taille, graine, dessiner, poids = GRAISSE) {
  const R = rng(graine), rot = ((graine % 2) ? 1 : -1) * (.25 + R() * .55) * Math.PI / 180, mots = txt.split(' ');
  g.font = `${poids} ${taille.toFixed(1)}px ${MAIN}`;
  if ('letterSpacing' in g) g.letterSpacing = (taille * .02).toFixed(2) + 'px';
  const esp = g.measureText(' ').width * 2.1;
  let cx = 0;
  /* Caveat penche à droite ; l'écriture de Thibaut est presque droite : on la redresse (DROIT) et on l'élargit (LARGE) */
  if (dessiner) { g.save(); g.translate(x, y); g.rotate(rot); g.transform(LARGE, 0, DROIT, 1, 0, 0); g.fillStyle = ENCRE_CV; }
  mots.forEach((m, i) => {
    const w = g.measureText(m).width;
    if (dessiner) { const dy = Math.sin(i * 1.7 + graine) * taille * .03 + (R() - .5) * taille * .025; g.globalAlpha = .84 + R() * .1; g.fillText(m, cx, dy); }
    cx += w + esp;
  });
  if (dessiner) g.restore();
  if ('letterSpacing' in g) g.letterSpacing = '0px';
  return (cx - esp) * LARGE;
}
/* coupe un texte écrit à la main en lignes */
function couperMain(g, txt, larg, taille) {
  /* mesure avec le même espacement que l'écriture */
  const mots = txt.split(' '), out = []; let l = '';
  mots.forEach(m => { const e = l ? l + ' ' + m : m; if (ecrireMain(g, e, 0, 0, taille, 1, false) > larg && l) { out.push(l); l = m; } else l = e; });
  if (l) out.push(l); return out;
}
/* Le CV écrit à la main dans la zone de texte de la feuille (600 de large, Ht de haut) : il remplit la zone avec
   équilibre (échelle k cherchée par dichotomie). Le portrait à la plume, petit, en haut à gauche du nom. */
function imprimer(g, croquis, Ht, haut = 0, initiales = null, avecTexte = true) {
  const Wt = CV_W, boite = {};
  const mise = (k, dessiner) => {
    let y = haut;
    /* L3 (douzième passe) : le médaillon grandit de 12,5 % (le nouveau portrait montre la tête entière, le cou et le col) */
    const d = croquis ? Math.min(108 * k, 135) : 0, x0 = d ? d + 18 * k : 0;
    /* le nom, à côté du croquis */
    const fn = Math.min(58 * k, (Wt - x0) / 6.6);
    const yNom = y + Math.max(fn * .85, d * .62);
    if (dessiner && croquis) {
      g.save(); g.globalAlpha = .9; g.globalCompositeOperation = 'multiply';
      g.beginPath(); g.ellipse(d / 2, y + d / 2, d / 2, d / 2, 0, 0, Math.PI * 2); g.clip();
      /* L3 : le cadrage vient du portrait (croquis.cadre : centre et rayon du cercle, en fractions de la largeur de l'image) ;
         sans lui, celui du premier portrait (l'image remplit le cercle, 42 % de sa hauteur au centre) */
      const iw = croquis.naturalWidth || croquis.width, ih = croquis.naturalHeight || croquis.height, cad = croquis.cadre;
      if (cad) { const sc = d / 2 / (cad.r * iw); g.drawImage(croquis, d / 2 - cad.x * iw * sc, y + d / 2 - cad.y * ih * sc, iw * sc, ih * sc); }
      else { const sc = d / Math.min(iw, ih); g.drawImage(croquis, d / 2 - iw * sc / 2, y + d / 2 - ih * sc * .42, iw * sc, ih * sc); }
      g.restore();
    }
    ecrireMain(g, 'Thibaut Harang', x0, yNom, fn, 11, dessiner);
    y = Math.max(yNom + fn * .35, y + d);
    /* le titre */
    const ft = 25 * k, tl = TITRE_LIGNES.every(l => ecrireMain(g, l, 0, 0, ft, 1, false) <= Wt - 6) ? TITRE_LIGNES : couperMain(g, TITRE, Wt - 6, ft);
    tl.forEach((l, i) => { y += ft * 1.25; ecrireMain(g, l, 4, y, ft, 21 + i, dessiner); });
    /* le filet tricolore, trois petits traits de feutre */
    y += 30 * k;
    if (dessiner) {
      const fw = 24 * Math.min(1.2, k);
      [['#000091', 0], ['#d9d4c8', fw], ['#c8322b', fw * 2]].forEach(([c, x], i) => { g.save(); g.strokeStyle = c; g.lineWidth = 3.4; g.lineCap = 'round'; g.globalAlpha = .9; g.beginPath(); g.moveTo(x + 2, y + (i - 1) * .6); g.quadraticCurveTo(x + fw / 2, y - 1.2 + i * .4, x + fw - 2, y + .4); g.stroke(); g.restore(); });
    }
    y += 26 * k;
    /* les quatre lignes « Direction de... » */
    const fl = 30 * k, lh = fl * 1.12;
    LIGNES.forEach((l, n) => {
      const ls = couperMain(g, l, Wt - 34 * k, fl);
      const y1 = y + fl * .85;
      if (dessiner) { g.save(); g.fillStyle = ENCRE_CV; g.globalAlpha = .9; g.beginPath(); g.ellipse(9 * k, y1 - fl * .28, 4.2 * k, 3.6 * k, .4, 0, Math.PI * 2); g.fill(); g.restore(); }
      ls.forEach((t, m) => ecrireMain(g, t, 30 * k, y1 + m * lh, fl, 40 + n * 7 + m, dessiner));
      y += ls.length * lh + 14 * k;
    });
    /* sixième passe, F23 : plus de ligne « Mon parcours sur LinkedIn » ; les vraies initiales de Thibaut, en bas à
       gauche, sont le lien (posé par la page sur leur place, voir lienInitiales) */
    y += 26 * k;
    const hi = initiales ? 40 * Math.min(1.2, k) : 0, ly = Math.max(y, Ht - 10 - hi * 1.2);
    if (initiales && dessiner) {
      const w = hi * initiales.naturalWidth / initiales.naturalHeight; g.save(); g.globalAlpha = .95; g.drawImage(initiales, 4, ly, w, hi);
      /* O4 (quinzième passe) : « T.H. », le second point. initiales.webp est le même tracé que la phrase de la page, recadré
         (175 x 92 px, à x 1970, y 713 de ecriture.webp) : son point entre le T et le H (x 83 à 93, y 53 à 64) est recopié pixel
         pour pixel après le H, au même décalage que sur la page (113,7 px, visuels.js POINT_TH), à la même hauteur, avec la
         même encre et la même opacité ; il sort de l'image (son bord droit est à 207,5 px) : le logo et « Mon parcours » se
         décalent d'autant, l'écart entre la dernière encre et le logo reste celui d'avant (entre le H et le logo). Il est dans
         l'encre du CV (toutes les tailles : de près, de loin, sur la planche) et dans la zone du lien LinkedIn */
      const e = hi / initiales.naturalHeight, PT = [76, 46, 24, 26], DXP = 113.7, DROITE = 207.5 + 10.5 - initiales.naturalWidth;   /* 10,5 px : l'écart du H au bord de l'image, gardé après le point */
      if (initiales.naturalWidth === 175) g.drawImage(initiales, PT[0], PT[1], PT[2], PT[3], 4 + (PT[0] + DXP) * e, ly + PT[1] * e, PT[2] * e, PT[3] * e);
      const wp = initiales.naturalWidth === 175 ? DROITE * e : 0;
      g.restore(); boite.initiales = [4, ly, w + wp, hi];
      /* G7 : à côté des initiales, le petit logo LinkedIn griffonné à la plume, puis « Mon parcours » souligné */
      /* N5 (quatorzième passe) : « Mon parcours » plus visible : le logo LinkedIn un peu plus grand (+ 19 %), le texte en
         graisse 700 de Caveat, 15 % plus grand, souligné d'un trait plus épais (3 au lieu de 1,9) */
      const c = hi * .95, lx = 4 + w + wp + hi * .45, lyy = ly + (hi - c) / 2 + hi * .04;
      g.save(); g.translate(lx, lyy); g.scale(c, c); g.strokeStyle = ENCRE_CV; g.lineCap = 'round'; g.lineJoin = 'round';
      if (LOGO) { g.lineWidth = .085; g.globalAlpha = .9; g.stroke(LOGO); g.lineWidth = .05; g.globalAlpha = .35; g.translate(.012, .018); g.stroke(LOGO); } g.restore();
      boite.logo = [lx, lyy, c, c];
      const ft = hi * .66 * 1.15, tx = lx + c + hi * .3, ty = ly + hi * .74;
      const tw2 = ecrireMain(g, LIEN_COURT, tx, ty, ft, 93, avecTexte, 700);
      if (avecTexte) {
        g.save(); g.strokeStyle = ENCRE_CV; g.lineWidth = 3; g.lineCap = 'round'; g.globalAlpha = .9; g.beginPath(); g.moveTo(tx - 2, ty + ft * .2);
        for (let x = 0; x <= tw2 + 4; x += 10) g.lineTo(tx - 2 + x, ty + ft * .2 + Math.sin(x * .06 + .4) * 1.2 - x * .006); g.stroke(); g.restore();
      }
      boite.texte = [tx, ly, tw2, Math.max(hi, ty + ft * .2 + 4 - ly)]; boite.souligne = [tx - 2, ty + ft * .2, tw2 + 6];
    }
    return y + hi * 1.2 + 10;
  };
  let a = .6, z = 2.2;
  for (let i = 0; i < 22; i++) { const m = (a + z) / 2; if (mise(m, false) > Ht) z = m; else a = m; }
  mise(a, true);
  return boite;
}
export async function creerCv(ctx, papier, vis) {
  const vF = vis.feuille, vC = vis.clou, vMain = vis['main-droite-feuille'];
  /* L3 (douzième passe) : le nouveau portrait à la plume (tête, cou, départ du col) et ses repères mesurés
     (portrait-esquisse.json : axe du visage, haut du crâne, bas de la barbe) ; le médaillon est cadré sur la tête entière,
     le cou et le départ du col ; les traits de construction très pâles de l'étude (alpha sous 0,12) sont retirés, sur une
     copie réduite (640 px), préparée une fois */
  const [croquisBrut, repPortrait] = PORTRAIT_CROQUIS ? await Promise.all([charger('../commun/img/portrait-esquisse.png'), fetch('../commun/img/portrait-esquisse.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).catch(() => null)]) : [null, null];
  const croquis = croquisBrut && repPortrait ? (() => {
    const n = 640, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(croquisBrut, 0, 0, n, n * croquisBrut.naturalHeight / croquisBrut.naturalWidth);
    try { const im = g.getImageData(0, 0, n, n), dd = im.data; for (let i = 3; i < dd.length; i += 4) dd[i] = dd[i] < 31 ? 0 : (dd[i] - 31) * 255 / 224; g.putImageData(im, 0, 0); } catch (e) { /* sans lecture : tel quel */ }
    const haut = Math.max(0, (repPortrait.crane_y || .06) - .035), bas = Math.min(1, (repPortrait.menton_y || .83) + .09);
    c.cadre = { x: repPortrait.axe_x || .514, y: (haut + bas) / 2, r: (bas - haut) / 2 };
    return c;
  })() : croquisBrut;
  const initiales = await charger(DOSSIER + 'initiales.webp');
  filtreTremble();
  try { await document.fonts.load(`${GRAISSE} 40px Caveat`); await document.fonts.load('700 40px Caveat'); } catch (e) {}
  const w = vF.w, h = vF.h, A = h / w;
  const R = n => { const r = vF.reperes[n]; return r; };
  const corps = R('corps') || [[0, 0], [1, 0], [1, 1], [0, 1]];
  const c0 = [Math.min(corps[0][0], corps[3][0]), Math.min(corps[0][1], corps[1][1])], c1 = [Math.max(corps[1][0], corps[2][0]), Math.max(corps[2][1], corps[3][1])];
  const texteQ = R('texte') || [[.09, .06], [.91, .06], [.91, .95], [.09, .95]];
  const clouUV = R('clou') || [.5, .04];

  /* ---- la texture : la feuille, puis l'impression en multiplication dans la zone de texte ---- */
  const k = Math.min(1, 1700 / h), tw = Math.round(w * k), th = Math.round(h * k);
  const recto = document.createElement('canvas'); recto.width = tw; recto.height = th;
  const g = recto.getContext('2d'); g.drawImage(vF.image, 0, 0, tw, th);
  const enc = document.createElement('canvas'); enc.width = tw; enc.height = th;
  const ge = enc.getContext('2d');
  const tx0 = Math.min(texteQ[0][0], texteQ[3][0]) * tw, ty0 = Math.min(texteQ[0][1], texteQ[1][1]) * th, tx1 = Math.max(texteQ[1][0], texteQ[2][0]) * tw, ty1 = Math.max(texteQ[2][1], texteQ[3][1]) * th;
  /* la zone de texte donne la mise en page : 600 de large, sa hauteur à proportion ; le haut réserve la place du clou */
  const ek = (tx1 - tx0) / CV_W, offX = tx0, Ht = (ty1 - ty0) / ek;
  /* F11 : sur la planche, le clou est planté à gauche de l'arrachure, dans du papier sain ; l'arrachure reste visible */
  const clouBasUV = [clouUV[0] - .13, clouUV[1] + .035];
  const hautCv = Math.max(0, ((clouBasUV[1] + .034) * th - ty0) / ek);
  const dMed = (c1[0] - c0[0]) * tw / ek / 6;
  ge.setTransform(ek, 0, 0, ek, offX, ty0);
  ge.filter = 'url(#tremble-cv)';
  const boites = imprimer(ge, croquis, Ht, hautCv, initiales);
  ge.filter = 'none';
  /* G7 : la même encre sans « Mon parcours » (le CV vu de loin : le logo reste, sans texte) */
  const encLoin = document.createElement('canvas'); encLoin.width = tw; encLoin.height = th;
  { const gl = encLoin.getContext('2d'); gl.setTransform(ek, 0, 0, ek, offX, ty0); gl.filter = 'url(#tremble-cv)'; imprimer(gl, croquis, Ht, hautCv, initiales, false); gl.filter = 'none'; }
  /* la mise en page, en unités du CV (600 x 848), avec le papier et le clou : pour le dessin à la plume du plan 7 */
  boites.papier = [(c0[0] * tw - offX) / ek, (c0[1] * th - ty0) / ek, (c1[0] * tw - offX) / ek, (c1[1] * th - ty0) / ek];
  boites.clou = [(clouUV[0] * tw - offX) / ek, (clouUV[1] * th - ty0) / ek];
  /* sur la planche à dessin, le clou repique la feuille à côté de la déchirure (clouBasUV) */
  boites.clouBas = [(clouBasUV[0] * tw - offX) / ek, (clouBasUV[1] * th - ty0) / ek];
  /* la place des initiales sur la feuille (u0, v0, u1, v1), pour le lien LinkedIn */
  /* G7 : la zone du lien (initiales, logo, « Mon parcours »), en unités du CV puis en fractions de la feuille */
  /* N5 : la zone cliquable couvre les initiales, le logo et le texte, avec une marge (12 unités du CV : 8 px à l'écran sur
     téléphone, davantage sur ordinateur) */
  const zl = boites.initiales && boites.texte ? [boites.initiales[0] - 12, Math.min(boites.initiales[1], boites.logo ? boites.logo[1] : 1e9, boites.texte[1]) - 12, boites.texte[0] + boites.texte[2] + 12, Math.max(boites.initiales[1] + boites.initiales[3], boites.texte[1] + boites.texte[3]) + 12] : null;
  const ini = zl ? [(offX + zl[0] * ek) / tw, (ty0 + zl[1] * ek) / th, (offX + zl[2] * ek) / tw, (ty0 + zl[3] * ek) / th] : null;
  /* la feuille imprimée : la photo, puis l'encre qui boit un peu le papier (très léger flou, multiplication) */
  const composer = e => {
    const c = document.createElement('canvas'); c.width = tw; c.height = th; const gc = c.getContext('2d');
    gc.drawImage(vF.image, 0, 0, tw, th);
    gc.save(); gc.globalCompositeOperation = 'multiply'; gc.globalAlpha = .96; gc.filter = 'blur(.35px)'; gc.drawImage(e, 0, 0); gc.restore();
    gc.save(); gc.globalCompositeOperation = 'destination-in'; gc.drawImage(vF.image, 0, 0, tw, th); gc.restore();
    return c;
  };
  g.clearRect(0, 0, tw, th); g.drawImage(composer(enc), 0, 0);
  const rectoLoin = composer(encLoin);
  /* G5 : pour la mise à plat, le papier et l'encre séparés : le papier se déroule (sa texture glisse), l'encre suit la
     géométrie sans bouger sur la feuille */
  const papierSeul = document.createElement('canvas'); papierSeul.width = tw; papierSeul.height = th; papierSeul.getContext('2d').drawImage(vF.image, 0, 0, tw, th);
  const encreSeule = document.createElement('canvas'); encreSeule.width = tw; encreSeule.height = th;
  { const gs = encreSeule.getContext('2d'); gs.globalAlpha = .96; gs.filter = 'blur(.35px)'; gs.drawImage(enc, 0, 0); }
  const verso = dosPapier(vF.image, tw, th);
  const bandeReflet = document.createElement('canvas'); bandeReflet.width = 128; bandeReflet.height = 4;
  { const gb = bandeReflet.getContext('2d'), gr = gb.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,253,246,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); gb.fillStyle = gr; gb.fillRect(0, 0, 128, 4); }
  const T = { reflet: papier.texture(bandeReflet, { mip: false }), recto: papier.texture(recto), rectoLoin: papier.texture(rectoLoin), verso: papier.texture(verso), flous: papier.flous(vF.image), papier: papier.texture(papierSeul), encre: papier.texture(encreSeule) };
  /* N1 (quatorzième passe) : les feuilles sont dans leurs textures (carte graphique) : les sept canevas qui les ont faites
     (2,5 Mo chacun) rendent leur mémoire ; sans WebGL (repli 2D), ils restent, le repli les dessine */
  /* U2 (vingt et unième passe, 07/10/2026) : sur téléphone, les cinq feuilles des textures sont d'abord copiées (createImageBitmap)
     et encodées en PNG dans l'ouvrier (hors du fil principal), puis gardées compressées (IMG_CV) : au retour, le CV se refait de
     ces images (décodées hors du fil principal, envoyées telles quelles à la carte graphique) au lieu d'être recomposé (voir
     memoire) ; les canevas rendent leur mémoire dès que les copies sont prises */
  const IMG_CV = { blobs: null, urls: null, ims: null, decode: null, prets: false };
  /* U2 : l'état du CV, pour les relevés sur l'appareil (lu par les scripts de mesure, rien d'autre) */
  window.__cvEtat = () => ({ texRepos, images: !!IMG_CV.blobs, decodees: IMG_CV.prets, tache: !!tacheCv });
  if (papier.ok && TEL && window.createImageBitmap && new URLSearchParams(location.search).get('cvimg') !== '0') {
    const src = { recto, rectoLoin, verso, papier: papierSeul, encre: encreSeule };
    const cles = Object.keys(src);
    Promise.all(cles.map(k => createImageBitmap(src[k]))).then(bms => {
      liberer(enc, encLoin, recto, rectoLoin, verso, papierSeul, encreSeule);
      return Promise.all(bms.map(bm => ouvrier('figer', { bm }, [bm]).then(r => r.blob)));
    }).then(bl => { if (bl.every(b => b && b.size)) { IMG_CV.blobs = {}; cles.forEach((k, i) => { IMG_CV.blobs[k] = bl[i]; }); if (window.__diag) window.__diag.noter('cv images gardées ' + Math.round(bl.reduce((a, b) => a + b.size, 0) / 1024) + ' Ko'); } })
      .catch(() => { liberer(enc, encLoin, recto, rectoLoin, verso, papierSeul, encreSeule); });
  } else if (papier.ok) liberer(enc, encLoin, recto, rectoLoin, verso, papierSeul, encreSeule);
  /* N1 (quatorzième passe) : sur téléphone, le CV ne se voit que de 0,35 à 0,70 (il n'est plus posé sur la planche, M5) : ses
     cinq textures (17 Mo) sont rendues après 0,72 et refaites (même composition, mêmes canevas, par petites étapes en tâche
     de fond) au retour, ou d'un coup si l'on saute au croisement */
  const TEX_CV = ['recto', 'rectoLoin', 'verso', 'papier', 'encre'];
  let texRepos = false, tacheCv = null;
  function* recomposerEtapes() {
    const e = document.createElement('canvas'); e.width = tw; e.height = th;
    { const x = e.getContext('2d'); x.setTransform(ek, 0, 0, ek, offX, ty0); x.filter = 'url(#tremble-cv)'; imprimer(x, croquis, Ht, hautCv, initiales); x.filter = 'none'; }
    yield;
    const el2 = document.createElement('canvas'); el2.width = tw; el2.height = th;
    { const x = el2.getContext('2d'); x.setTransform(ek, 0, 0, ek, offX, ty0); x.filter = 'url(#tremble-cv)'; imprimer(x, croquis, Ht, hautCv, initiales, false); x.filter = 'none'; }
    yield;
    const c1 = composer(e); yield;
    const c2 = composer(el2); liberer(el2); yield;
    const ps = document.createElement('canvas'); ps.width = tw; ps.height = th; ps.getContext('2d').drawImage(vF.image, 0, 0, tw, th);
    const es = document.createElement('canvas'); es.width = tw; es.height = th; { const x = es.getContext('2d'); x.globalAlpha = .96; x.filter = 'blur(.35px)'; x.drawImage(e, 0, 0); }
    liberer(e); yield;
    const vs = dosPapier(vF.image, tw, th); yield;
    const N = { recto: c1, rectoLoin: c2, verso: vs, papier: ps, encre: es };
    for (const k of TEX_CV) { papier.supprimer(T[k]); T[k] = papier.texture(N[k]); liberer(N[k]); yield; }
    texRepos = false;
  }
  /* X1 : les seuils de la mémoire du CV sur téléphone (voir plus bas) */
  const CV_REND = .683, CV_DECODE = .677, CV_GPU = .674;
  function memoire(p) {
    if (!TEL || !papier.ok) return;
    /* N2 : rendues seulement au-delà de 0,72 (l'atelier, la fin) ; refaites dès le retour sous 0,70, en tâche de fond peu
       pressée (au « Revoir le film », pendant la nuit, où il reste du temps entre les images), et non plus pendant la marche */
    /* S2 (dix-neuvième passe) : rendues dès 0,698 (le papier est vide dès 0,696 : plus aucune feuille du CV à l'écran), avant
       la couleur de l'atelier (0,70), le moment où l'iPhone tombait ; refaites sous 0,685 */
    /* T14 (07/10/2026) : sur l'iPhone, deux arrêts nets sur cinq lectures, « souvent en revenant en arrière ». Mesuré dans le
       moteur de Safari (retour de 0,93 à 0,25 en 0,6 s) : la vue passait par 0,69 et 0,53, et à ces images le CV était recomposé
       d'un coup (sept canevas de 672 x 971, leurs textures : 15 Mo de canevas et 25 Mo de textures en une image), la pièce
       repeinte (20 Mo), pour être rendus deux images plus loin. Pendant un défilement rapide (VUE.rapide), rien n'est
       recomposé : quand il ralentit, d'un coup si le CV se voit (0,34 à 0,685), plus bas en tâche de fond */
    /* X1 (vingt-quatrième passe, 08/10/2026) : la mémoire du chemin est rendue avant d'entrer dans l'atelier, pas après : sur téléphone,
       la feuille quitte le cadre à 0,668 (plan 5) ; ses textures sont rendues dès que le doigt est contre la porte de l'atelier (p 0,670 ;
       moteur.js, VUE.porte), sinon dès 0,683 (0,698 avant). Elles ne se refont qu'en revenant vers le chemin (VUE.recul : la cible du
       défilement derrière la vue), jamais contre la porte ni en avançant ; décodage sous 0,677, carte graphique sous 0,674 (après que la
       pièce et la feuille de dessin ont rendu la leur, atelier.js), toutes dès 0,668, où le CV rentre dans le cadre */
    const revient = p <= .668 || (VUE.recul(p) && !VUE.porte);
    if (!texRepos && !tacheCv && (p > CV_REND || (VUE.porte && p > .669))) { TEX_CV.forEach(k => papier.supprimer(T[k])); texRepos = true; if (window.__diag) window.__diag.noter('cv textures rendues p ' + p.toFixed(3)); }
    /* U2 (vingt et unième passe, 07/10/2026) : « quand on arrive sur le CV, il n'y a rien ». Reproduit sur l'iPhone (le film ouvert à
       la fin, comme un rechargement qui rend la page en bas ou après une lecture, puis le doigt vers le haut jusqu'au croisement :
       c21-iphone-gravures.json) : la planche du poteau arrive nue, sans le CV. Cause : les textures du CV, rendues après 0,698 (S2),
       n'étaient refaites qu'après 400 ms de calme (T14 bis), par une tâche de douze étapes (sept canevas recomposés avec le filtre
       de tremblé, cinq textures), une étape par image en mouvement, de 9 à 59 ms chacune sur l'iPhone : la tâche a duré 5 s dans le
       relevé ; d'ici là, la feuille n'est pas posée. Désormais, avec les images gardées (IMG_CV, voir plus haut) : dès le retour
       sous 0,697 (juste sous le seuil où elles sont rendues : en avançant, rien ne se refait), les cinq images se décodent (hors du
       fil principal) ; dès qu'elles sont prêtes et que la vue est sous 0,685, elles repartent dans la carte graphique (une par image
       rendue tant que le CV n'est pas dans le cadre, toutes celles qui restent dès qu'il y entre, sous 0,668 : la main l'y rapporte
       à reculons), sans un seul canevas créé ; le CV est posé dès la dernière. Sans les images gardées, la recomposition d'avant */
    else if (texRepos && IMG_CV.blobs && !tacheCv) {
      if (!IMG_CV.decode && p <= CV_DECODE && revient) {   /* X1 : 0,680 (0,697 avant) */
        if (!IMG_CV.urls) { IMG_CV.urls = {}; TEX_CV.forEach(k => { IMG_CV.urls[k] = URL.createObjectURL(IMG_CV.blobs[k]); }); }
        IMG_CV.ims = {}; IMG_CV.prets = false; if (window.__diag) window.__diag.noter('cv images : décodage p ' + p.toFixed(3));
        const enCours = IMG_CV.decode = Promise.all(TEX_CV.map(k => { const im = new Image(); im.decoding = 'async'; im.src = IMG_CV.urls[k]; IMG_CV.ims[k] = im; return im.decode(); }))
          .then(() => { if (IMG_CV.decode === enCours) { IMG_CV.prets = true; if (window.__diag) window.__diag.noter('cv images décodées'); if (ctx.redessiner) ctx.redessiner(); } })
          .catch(() => { if (IMG_CV.decode === enCours) { IMG_CV.decode = null; IMG_CV.blobs = null; } });
      }
      if (IMG_CV.prets && p <= CV_GPU && revient) {   /* X1 : 0,676 (0,685 avant) */
        /* avant que le CV entre dans le cadre (0,685 à 0,668) : une texture par image rendue ; dans le cadre (la main l'emporte de
           0,668 à 0,634, il est cloué en dessous) : toutes celles qui restent */
        const t0 = performance.now(), reste = TEX_CV.filter(k => IMG_CV.ims[k]);
        /* pendant un geste rapide, une par image aussi : les textures de la page qu'on quitte partent dans le même temps */
        for (const k of (p > .668 || VUE.rapide() ? reste.slice(0, 1) : reste)) { papier.supprimer(T[k]); T[k] = papier.texture(IMG_CV.ims[k]); IMG_CV.ims[k] = null; }
        if (TEX_CV.every(k => !IMG_CV.ims[k])) { texRepos = false; IMG_CV.decode = null; IMG_CV.prets = false; IMG_CV.ims = null; if (window.__diag) window.__diag.noter('cv textures refaites des images p ' + p.toFixed(3) + ' ' + (performance.now() - t0).toFixed(1) + ' ms'); }
      }
    }
    else if (texRepos && p <= CV_GPU && revient && !VUE.rapide()) {   /* X1 */
      /* T14 bis : là où le CV se voit, plus d'un coup (sept canevas et cinq textures dans une image) : une tâche urgente, par
         étapes, 400 ms après la fin du geste ; d'ici là, la feuille n'est pas posée (la planche et son clou se voient seuls :
         le dessin avec des textures rendues aurait été noir) */
      if (p >= .34) { if (tacheCv) tacheCv.urgent = true; else if (VUE.calme() > 400) { const t = tacheCv = { nom: 'cv-retour', besoin: .3, gen: (function* () { yield; if (!texRepos) return; yield* recomposerEtapes(); if (tacheCv === t) tacheCv = null; })() }; planifier(t, true); } }
      else if (!tacheCv) { const t = tacheCv = { nom: 'cv-retour', besoin: .35, gen: (function* () { yield; if (!texRepos) return; yield* recomposerEtapes(); if (tacheCv === t) tacheCv = null; })() }; planifier(t); }
    }
  }

  /* T10 (07/10/2026, tranché par Thibaut) : plus de déchirure. La feuille part entière ; la texture de la déchirure (384 x 543,
     ses fibres) et l'éclat qui restait sous le clou ne sont plus faits ; le seul clou est celui de la planche du poteau
     (monde.js, clouPoteau), derrière la feuille */

  /* ---- le masque du griffonnage (plan 7) : alpha = papier devenu dessin ---- */
  const gw = 192, gh = Math.round(192 * A), gc = document.createElement('canvas'); gc.width = gw; gc.height = gh;
  const gg = gc.getContext('2d');
  T.griffe = papier.texture(gc, { mip: false });
  let griffeCle = '';
  function griffer(trace, largeur) {
    /* trace : points (u, v) de la bande en zigzag déjà parcourue ; largeur en u */
    const cle = trace.length + ':' + (trace.length ? trace[trace.length - 1].join(',') : '');
    if (cle === griffeCle) return; griffeCle = cle;
    gg.clearRect(0, 0, gw, gh);
    if (trace.length > 1) {
      gg.save(); gg.lineCap = 'round'; gg.lineJoin = 'round'; gg.strokeStyle = '#000'; gg.lineWidth = largeur * gw;
      gg.shadowColor = '#000'; gg.shadowBlur = gw * .035; gg.shadowOffsetX = gw * 4; gg.translate(-gw * 4, 0);
      gg.beginPath(); trace.forEach(([u, v], i) => i ? gg.lineTo(u * gw, v * gh) : gg.moveTo(u * gw, v * gh)); gg.stroke(); gg.restore();
    }
    T.griffe.maj && T.griffe.maj(gc);
  }

  /* ---- la silhouette floutée de la main droite : ombre de contact du pouce sur la feuille ---- */
  let Tmain = null;
  if (vMain && papier.ok) {
    const mw = 232, mh = Math.round(232 * vMain.h / vMain.w), mc = document.createElement('canvas'); mc.width = mw; mc.height = mh;
    const mg = mc.getContext('2d'); mg.drawImage(vMain.image, 0, 0, mw, mh); mg.globalCompositeOperation = 'source-in'; mg.fillStyle = '#000'; mg.fillRect(0, 0, mw, mh);
    const p = document.createElement('canvas'); p.width = Math.round(mw / 6); p.height = Math.round(mh / 6); p.getContext('2d').drawImage(mc, 0, 0, p.width, p.height);
    const q = document.createElement('canvas'); q.width = mw; q.height = mh; const qg = q.getContext('2d'); qg.imageSmoothingQuality = 'high'; qg.drawImage(p, 0, 0, mw, mh);
    Tmain = papier.texture(q, { mip: false });
  }
  const Tclou = vC ? papier.texture(vC.image) : null;
  const clouReel = vC && vC.reel;
  /* l'ombre d'une tête de clou réelle : un disque flou (la photo arrive sans ombre) */
  let TombreClou = null;
  if (clouReel && papier.ok) { const o = document.createElement('canvas'); o.width = o.height = 64; const og = o.getContext('2d'), rg = og.createRadialGradient(32, 32, 4, 32, 32, 30); rg.addColorStop(0, 'rgba(0,0,0,.85)'); rg.addColorStop(.5, 'rgba(0,0,0,.4)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); og.fillStyle = rg; og.fillRect(0, 0, 64, 64); TombreClou = papier.texture(o, { mip: false }); }

  /* ---- le texte pour les lecteurs d'écran, et la commande de l'arrêt 2 ---- */
  const lignes = LIGNES.map(l => `<li>${l}</li>`).join('');
  const article = el(`<article class="sr" aria-label="CV de Thibaut Harang"><p>Thibaut Harang</p><p>${TITRE.replace('&', '&amp;')}</p><ul>${lignes}</ul></article>`);
  ctx.porteurs.appendChild(article);
  /* F23 : le CV entier mène à la page Conseil ; ses initiales mènent au parcours LinkedIn */
  /* Q1 (dix-septième passe) : l'adresse de la page Conseil, comme son texte l'annonce (sur téléphone, toucher le CV poursuit
     le film, p4-croisement.js, et son libellé le dit) */
  const cmd = el('<a class="ep cv__cmd" href="/conseil/" tabindex="-1" style="width:600px;height:848px" aria-label="Le conseil : voir la page Conseil"></a>');
  cmd.addEventListener('click', e => { e.stopPropagation(); });
  ctx.porteurs.appendChild(cmd);
  /* G7 : le lien LinkedIn, posé exactement sur les initiales, le logo et « Mon parcours » (qui sont dans l'encre du CV) ;
     au survol ou au focus, le logo passe au bleu et le soulignement s'épaissit (le même tracé, par-dessus) */
  const LW = zl ? zl[2] - zl[0] : 200, LH = zl ? zl[3] - zl[1] : 60, LK = 2;
  const lg = boites.logo, sl = boites.souligne;
  const svgLien = zl && lg ? `<svg viewBox="${zl[0]} ${zl[1]} ${LW} ${LH}" aria-hidden="true">
      <path class="cv__logo" d="${LOGO_D}" transform="translate(${lg[0]} ${lg[1]}) scale(${lg[2]})" stroke-width="${(.1).toFixed(3)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      ${sl ? `<path class="cv__trait" d="M${sl[0]} ${sl[1]}l${sl[2]} ${(-sl[2] * .006).toFixed(1)}" fill="none" stroke-linecap="round"/>` : ''}
    </svg>` : '';
  const lienIni = el(`<a class="ep cv__initiales" href="${LINKEDIN}" target="_blank" rel="noopener" tabindex="-1" aria-label="Mon parcours : le profil LinkedIn de Thibaut Harang (nouvel onglet)" style="width:${LW * LK}px;height:${LH * LK}px">${svgLien}</a>`);
  lienIni.addEventListener('click', e => e.stopPropagation());
  ctx.porteurs.append(lienIni);
  let quadIni = null, larIni = 0, loin = false;
  /* H3 : de loin, « Mon parcours » n'est pas écrit : le lien se réduit aux initiales et au logo (fraction de sa largeur) */
  const partLoin = zl && lg ? Math.min(1, (lg[0] + lg[2] + 10 - zl[0]) / LW) : 1;
  let clipLien = '';

  /* ---- les formes : hauteur z (en largeurs de feuille) de chaque point (u, v) ---- */
  const corpsU = [c0[0], c1[0]], corpsV = [c0[1], c1[1]];
  /* la photo porte déjà ses plis, ses ombres et ses coins qui rebiquent : le relief en code se fait discret et l'ombrage calculé est réduit */
  const OMB = vF.reel ? .35 : 1;
  const sm = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  /* coins du bas qui rebiquent, petite ondulation, coins du haut qui décollent à peine */
  /* T2 (vingtième passe, 07/10/2026) : sur téléphone, les maillages du CV ont 0,65 fois moins de sommets par côté (14 x 44
     devient 9 x 29) : sur l'iPhone, leur calcul (forme, projection, éclairage de chaque sommet) coûtait 6 à 7 ms par image au
     croisement ; à la taille d'un téléphone, la feuille et sa languette restent lisses */
  function MAIL(n) { return TEL ? Math.max(4, Math.round(n * .65)) : n; }
  function relief(u, v, coins = 1) {
    const pu = (u - corpsU[0]) / (corpsU[1] - corpsU[0]), pv = (v - corpsV[0]) / (corpsV[1] - corpsV[0]);
    const bas = Math.pow(sm((pv - .78) / .22), 2.2), cote = Math.pow(sm((Math.abs(pu - .5) - .26) / .24), 2.2);
    const haut = Math.pow(sm((.14 - pv) / .14), 2) * Math.pow(sm((Math.abs(pu - .5) - .3) / .2), 2);
    const onde = .0075 * Math.sin(pu * 5.1 + 1.3) * Math.sin(pv * 3.7 + .4) + .0045 * Math.sin(pv * 9.2 + pu * 2.1);
    return vF.reel ? .006 * haut + onde * .5 : (.062 * bas * cote * coins + .012 * haut) + onde;
  }
  /* le vent sur le poteau : la feuille se soulève par le bas, lentement, de façon irrégulière */
  function vent(u, v, t, force) {
    const pv = clamp((v - corpsV[0]) / (corpsV[1] - corpsV[0])), pu = (u - corpsU[0]) / (corpsU[1] - corpsU[0]);
    const r = rafale(t) * force;
    if (vF.reel) {
      /* la photo : c'est la languette du bas qui vit (elle commence vers 72 % de la hauteur) */
      const lev = Math.pow(sm((pv - .42) / .58), 1.8) * (1 + .3 * Math.sin(pu * 2.2 + t * .8)) + .5 * Math.pow(sm((pv - .72) / .28), 1.5) * (.6 + .4 * Math.sin(t * 1.7 + pu * 3));
      const fris = .008 * Math.sin(pv * 9 - t * 3.3 + pu * 1.9) * Math.pow(pv, 2.5);
      return r * (.085 * lev + fris);
    }
    const lev = Math.pow(sm((pv - .32) / .68), 2.1) * (1 + .22 * Math.sin(pu * 2.6 + t * .9));
    const fris = .006 * Math.sin(pv * 8 - t * 3.1 + pu * 1.7) * Math.pow(pv, 2);
    return r * (.105 * lev + fris);
  }

  /* ---- les poses ---- */
  const s3 = [0, 0];
  const uvClou = () => [clouUV[0], clouUV[1] * A];
  /* sommet générique : projection proj(X, Y, Z) et forme z(u, v) */
  function faireSommet(proj, forme, pied) {
    return (u, v, s) => {
      const uc = clamp(u), vc = clamp(v), z = forme(uc, vc);
      s.X = u; s.Y = v * A; s.Z = z;
      proj(u, v * A, z, s3); s.x = s3[0]; s.y = s3[1];
      (pied || proj)(u, v * A, 0, s3); s.fx = s3[0]; s.fy = s3[1]; s.h = Math.max(0, z);
    };
  }
  let quadCmd = null;
  function majCommande(proj, forme) {
    const q = [[corpsU[0], corpsV[0]], [corpsU[1], corpsV[0]], [corpsU[1], corpsV[1]], [corpsU[0], corpsV[1]]].map(([u, v]) => proj(u, v * A, 0, [0, 0]));
    quadCmd = q; setT(cmd, epingle(600, 848, q)); setV(cmd, true);
    noterInitiales(proj, Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]), forme);
  }
  /* H3 : la zone du lien est projetée avec la géométrie de la feuille à cette image, déformation comprise : chaque coin
     de la zone est le point du maillage (u, v) à sa hauteur z(u, v), par la même projection que le papier ; le lien
     est donc recalculé à chaque image, sur le poteau, dans la main, pendant l'arrachage, sur la planche */
  function noterInitiales(proj, largeurPx, forme) {
    if (!ini) { quadIni = null; return; }
    quadIni = [[ini[0], ini[1]], [ini[2], ini[1]], [ini[2], ini[3]], [ini[0], ini[3]]].map(([u, v]) => proj(u, v * A, forme ? forme(clamp(u), clamp(v)) : 0, [0, 0]));
    larIni = largeurPx || 0;
  }
  /* le clou : une tête en relief posée sur le point du clou de la feuille */
  function poserClou(proj, z, largeurPx, op = 1, pos, horsMasque = false) {
    if (!Tclou || op <= .002) return;
    const c = pos || clouUV, P = proj(c[0], c[1] * A, z || 0, [0, 0]);
    const d = largeurPx * .05 * (corpsU[1] - corpsU[0]);
    if (clouReel) {
      const r = d * .5, ox = r * .45, oy = r * .55, rr = r * 1.5; papier.image({ tex: TombreClou, quad: [[P[0] + ox - rr, P[1] + oy - rr], [P[0] + ox + rr, P[1] + oy - rr], [P[0] + ox + rr, P[1] + oy + rr], [P[0] + ox - rr, P[1] + oy + rr]], op: .55 * op, couleur: [.05, .03, .01], horsMasque });
      papier.image({ tex: Tclou, quad: [[P[0] - r, P[1] - r], [P[0] + r, P[1] - r], [P[0] + r, P[1] + r], [P[0] - r, P[1] + r]], op, horsMasque });
    } else {
      /* provisoire : la tête occupe 80 px de 200, centrée en (92, 90), ombre comprise */
      const k = d / 80, x0 = P[0] - 92 * k, y0 = P[1] - 90 * k;
      papier.image({ tex: Tclou, quad: [[x0, y0], [x0 + 200 * k, y0], [x0 + 200 * k, y0 + 200 * k], [x0, y0 + 200 * k]], op, horsMasque });
    }
  }

  let vu = false;
  return {
    A, corpsU, corpsV, clouUV, clouBasUV, el: article, cmd, lien: lienIni, zoneLien: ini, T, dispo: boites,
    get quad() { return quadCmd; },
    debut() { vu = false; quadIni = null; },
    memoire,
    fin(z) {
      if (!vu) setV(cmd, false);
      /* H3 : le lien suit la zone du lien à chaque image où le CV se voit ; il est désactivé (hors du parcours au
         clavier, sans pointeur) quand la zone fait moins de 18 px de haut à l'écran ou qu'elle est hors du cadre */
      let ok = false;
      if (vu && quadIni) {
        const q = quadIni, h = Math.min(Math.hypot(q[3][0] - q[0][0], q[3][1] - q[0][1]), Math.hypot(q[2][0] - q[1][0], q[2][1] - q[1][1]));
        const xs = q.map(p => p[0]), ys = q.map(p => p[1]), W = innerWidth, H = innerHeight;
        const dedans = Math.min(...xs) >= -2 && Math.max(...xs) <= W + 2 && Math.min(...ys) >= -2 && Math.max(...ys) <= H + 2;
        ok = h >= 18 && dedans;
      }
      setV(lienIni, ok); lienIni.tabIndex = ok ? 0 : -1; lienIni.classList.toggle('actif', ok);
      if (ok) {
        setT(lienIni, epingle(LW * LK, LH * LK, quadIni)); const zz = String((z || 20) + 1); if (lienIni._z !== zz) { lienIni._z = zz; lienIni.style.zIndex = zz; }
        if (DOIGT) zoneDoigtQuad(lienIni, quadIni, LW * LK, LH * LK);   /* Q6 (dix-septième passe) : 44 px au doigt */
        /* de loin (encre sans « Mon parcours ») : le lien se limite aux initiales et au logo */
        const c = loin && partLoin < 1 ? `inset(0 ${((1 - partLoin) * 100).toFixed(1)}% 0 0)` : 'none';
        if (c !== clipLien) { clipLien = c; lienIni.style.clipPath = c; lienIni.classList.toggle('loin', loin); }
      }
    },
    /* sur la planche du poteau : P(x, y, dz) projette un point de l'image du poteau (px), décalé de dz mètres vers nous */
    surPoteau(o) {
      vu = true;
      if (texRepos) return null;   /* T14 bis : textures rendues, pas encore refaites */
      const pt = o.poteau, kM = pt.kP;
      /* la feuille à plat : le corps du papier sur le quadrilatère « cv » de l'image du poteau, le clou sur le clou */
      const cv = pt.cvImg, cl = pt.clouImg;
      const sx = (cv[1][0] - cv[0][0]) / (corpsU[1] - corpsU[0]), sy = (cv[3][1] - cv[0][1]) / (corpsV[1] - corpsV[0]);
      const ox = cl[0] - clouUV[0] * sx, oy = cl[1] - clouUV[1] * sy;
      const proj = (X, Y, Z, out) => pt.proj(ox + X * sx, oy + (Y / A) * sy, Z * sx * kM, out);
      const t = o.t || 0, force = o.vent === undefined ? 1 : o.vent;
      const forme = (u, v) => relief(u, v) + vent(u, v, t, force);
      const largeurPx = Math.hypot(...[0, 1].map(i => proj(1, 0, 0, [0, 0])[i] - proj(0, 0, 0, [0, 0])[i]));
      loin = largeurPx * (corpsU[1] - corpsU[0]) < 300;
      /* K9 (onzième passe) : la feuille ancrée sur la planche brûlée. Son ombre portée est plus franche et plus large
         (lumière en haut à gauche : décalée en bas à droite, d'environ 3 et 4,5 % de la largeur de la feuille, donc elle
         grandit avec le poteau), presque noire sur le bois sombre, et bouge avec le vent (sa part liée à la hauteur du
         papier). Quand la feuille fait moins de 60 px de haut, ses bords s'adoucissent (une finesse plus douce de sa
         texture) : elle ne scintille plus ; au-delà de 60 px, rien ne change */
      const hPx = largeurPx * (corpsU[1] - corpsU[0]) * 1.4, flou = clamp((60 - hPx) / 30) * 1.4;
      papier.feuille({ ombrage: OMB,
        nu: MAIL(14), nv: MAIL(20), sommet: faireSommet(proj, forme), recto: loin ? T.rectoLoin : T.recto, verso: T.verso, op: o.op, flou,
        lumiere: o.lumiere || LUMIERE,
        ombre: { flous: T.flous, op: .94, couleur: [.03, .018, .006], base: [largeurPx * .03, largeurPx * .046], dir: [largeurPx * .8, largeurPx * .7], hmax: .07 }
      });
      /* T10 : plus de tête de clou sur la feuille ; le clou est dans la planche, sous elle */
      majCommande(proj, forme);
      return { proj, largeurPx };
    },
    /* sur un plan à l'écran (main, planche) : quadrilatère du corps du papier, forme, perspective douce */
    surPlan(o) {
      vu = true;
      if (texRepos) return null;   /* T14 bis */
      const corpsQ = [[corpsU[0], corpsV[0]], [corpsU[1], corpsV[0]], [corpsU[1], corpsV[1]], [corpsU[0], corpsV[1]]];
      const Hs = quadVersQuad(corpsQ, o.quad);
      const largeurPx = Math.hypot(o.quad[1][0] - o.quad[0][0], o.quad[1][1] - o.quad[0][1]) / (corpsU[1] - corpsU[0]);
      const proj = projPlane(Hs, A, o.centre || [innerWidth / 2, innerHeight * .4], o.focale || 1700, largeurPx);
      const forme = o.forme || ((u, v) => relief(u, v));
      const om = o.ombre || { op: .4, base: [10, 16], dir: [.4, .6] };
      const opF = o.op === undefined ? 1 : o.op, sommet = faireSommet(proj, forme);
      const ombre = om.op > 0 ? { flous: T.flous, op: om.op, couleur: om.couleur || [.06, .04, .02], base: om.base, dir: [om.dir[0] * largeurPx, om.dir[1] * largeurPx], hmax: om.hmax || .1 } : null;
      if (o.aplat !== undefined) {
        /* G5 : posée sur la planche, la feuille se met à plat par la géométrie : ses coins se déroulent (la forme les
           rabat, avec un léger rebond au contact), et le papier se déroule avec eux : sous les coins recourbés de la
           photo, la texture glisse vers le bas et le papier lisse prend leur place, rangée par rangée (o.aplat de 0
           à 1) ; l'encre est une couche à part, posée sur la même géométrie : le texte suit chaque déformation et ne
           bouge jamais sur la feuille. Aucun fondu entre deux images. */
        const k = clamp(o.aplat), vb = corpsV[0] + .7 * (corpsV[1] - corpsV[0]), dv = (1 - vb) * k;
        const sommetP = (u, v, so) => { sommet(u, v, so); if (v > vb && v <= 1.0001) { const e = v - vb; so.V = e < dv ? vb - e : v - dv; } };
        const lum = o.lumiere || LUMIERE;
        papier.feuille({ ombrage: OMB, nu: MAIL(14), nv: MAIL(44), sommet: sommetP, recto: T.papier, verso: T.verso, op: opF, lumiere: lum, ombre, ecrireStencil: o.pouce ? 2 : 0 });
        papier.feuille({ ombrage: OMB, nu: MAIL(14), nv: MAIL(44), sommet, recto: T.encre, verso: T.encre, op: opF, lumiere: lum });
        /* le reflet discret qui glisse sur le papier pendant qu'il s'aplatit (o.reflet de 0 à 1) */
        const r = o.reflet || 0;
        if (r > 0 && r < 1 && T.reflet) {
          const c = -.45 + 1.9 * r;
          papier.feuille({ ombrage: 0, nu: MAIL(10), nv: MAIL(10), uv: [corpsU[0], corpsU[1], corpsV[0] + .02, vb], sommet: (u, v, so) => { sommet(u, v, so); so.U = clamp(.5 + (u + .55 * v - c) * 1.6, 0, 1); so.V = .5; }, recto: T.reflet, verso: T.reflet, op: opF * .5 * Math.sin(Math.PI * r) });
        }
      } else papier.feuille({ ombrage: OMB,
        nu: MAIL(14), nv: MAIL(20), sommet, recto: T.recto, verso: T.verso, op: opF,
        ombre,
        griffe: o.griffe ? { tex: T.griffe, k: 1 } : null,
        ecrireStencil: o.pouce ? 2 : 0
      });
      if (o.pouce && Tmain) papier.image({ tex: Tmain, quad: o.pouce.map(([x, y]) => [x + largeurPx * .012, y + largeurPx * .022]), op: .42, couleur: [.03, .02, .01], testStencil: 2 });
      /* T10 : le clou de la planche à dessin (plans 6 et 8) repique la feuille à côté de l'ancienne place (o.clouBas) */
      if (o.clou) poserClou(proj, 0, largeurPx, o.clou, o.clouBas ? clouBasUV : null);
      loin = false;
      if (o.commande) majCommande(proj, forme); else noterInitiales(proj, largeurPx * (corpsU[1] - corpsU[0]), forme);
      return { proj, largeurPx };
    },
    /* F23 : le lien des initiales, posé sur leur place à l'écran ; actif aux arrêts où le CV se lit */
    /* G7 : le lien se pose de lui-même partout où le CV se lit (voir fin) ; gardé pour les plans */
    lienInitiales() {},
    /* le CV entier, lien vers la page Conseil, aux mêmes arrêts */
    lienCv(actif) { cmd.tabIndex = actif ? 0 : -1; cmd.classList.toggle('actif', !!actif); },
    /* l'arrachage : chaque sommet passe de la pose du poteau à la pose de la main selon b(u, v) */
    entreDeux(o) {
      vu = true;
      if (texRepos) return null;   /* T14 bis */
      const pt = o.poteau, kM = pt.kP, cv = pt.cvImg, cl = pt.clouImg;
      const sx = (cv[1][0] - cv[0][0]) / (corpsU[1] - corpsU[0]), sy = (cv[3][1] - cv[0][1]) / (corpsV[1] - corpsV[0]);
      const ox = cl[0] - clouUV[0] * sx, oy = cl[1] - clouUV[1] * sy;
      const projA = (X, Y, Z, out) => pt.proj(ox + X * sx, oy + (Y / A) * sy, Z * sx * kM, out);
      const corpsQ = [[corpsU[0], corpsV[0]], [corpsU[1], corpsV[0]], [corpsU[1], corpsV[1]], [corpsU[0], corpsV[1]]];
      const Hs = quadVersQuad(corpsQ, o.quad);
      const largeurPx = Math.hypot(o.quad[1][0] - o.quad[0][0], o.quad[1][1] - o.quad[0][1]) / (corpsU[1] - corpsU[0]);
      const projB = projPlane(Hs, A, [innerWidth / 2, innerHeight * .4], 1700, largeurPx);
      const a = [0, 0], b = [0, 0];
      const proj = (X, Y, Z, out) => { const u = X, v = Y / A, w = o.poids(u, v); projA(X, Y, Z, a); projB(X, Y, Z, b); out[0] = lerp(a[0], b[0], w); out[1] = lerp(a[1], b[1], w); return out; };
      const fo = o.forme || relief, ten = o.tension || 0, dv = o.devant || 0;
      /* quatrième passe, D5 : la feuille plie vraiment vers la main (bombé décentré vers le bas à droite) ;
         D4 : autour du clou, le papier se soulève vers le spectateur et passe devant la tête du clou */
      const forme = (u, v) => {
        const pu = clamp((u - corpsU[0]) / (corpsU[1] - corpsU[0])), pv = clamp((v - corpsV[0]) / (corpsV[1] - corpsV[0]));
        const bombe = Math.sin(Math.PI * Math.pow(pv, .8)) * Math.sin(Math.PI * Math.pow(pu, .85));
        const autourClou = Math.exp(-(((u - clouUV[0]) / .2) ** 2 + ((v - clouUV[1]) * A / .2) ** 2));
        return fo(u, v) + ten * .09 * bombe + dv * .022 * autourClou;
      };
      /* T10 : le clou est dans la planche, sous la feuille (photo du poteau) : rien à poser ici */
      papier.feuille({ ombrage: OMB,
        nu: MAIL(18), nv: MAIL(26), sommet: faireSommet(proj, forme), recto: T.recto, verso: T.verso, op: o.op,
        ombre: { flous: T.flous, op: .45 + .12 * ten, couleur: [.07, .04, .015], base: [8 + 10 * ten, 12 + 10 * ten], dir: [largeurPx * (.4 + .5 * ten), largeurPx * (.55 + .5 * ten)], hmax: .1 },
        ecrireStencil: o.pouce ? 2 : 0
      });
      if (o.pouce && Tmain) papier.image({ tex: Tmain, quad: o.pouce.map(([x, y]) => [x + largeurPx * .012, y + largeurPx * .022]), op: .42, couleur: [.03, .02, .01], testStencil: 2 });
      /* H3 : pendant l'arrachage aussi, le lien suit la feuille (projection mêlée poteau et main, même forme) */
      loin = false; noterInitiales(proj, largeurPx * (corpsU[1] - corpsU[0]), forme);
      return { projA, proj, largeurPx };
    },
    /* le papier sur l'image du poteau (px), pour la pose de contact de la main */
    papierPoteau(cvImg, clouImg) {
      const sx = (cvImg[1][0] - cvImg[0][0]) / (corpsU[1] - corpsU[0]), sy = (cvImg[3][1] - cvImg[0][1]) / (corpsV[1] - corpsV[0]);
      const ox = clouImg[0] - clouUV[0] * sx, oy = clouImg[1] - clouUV[1] * sy;
      return [[corpsU[0], corpsV[0]], [corpsU[1], corpsV[0]], [corpsU[1], corpsV[1]], [corpsU[0], corpsV[1]]].map(([u, v]) => [ox + u * sx, oy + v * sy]);
    },
    /* les formes, pour les plans */
    relief, vent,
    /* la feuille tenue : fléchit autour du pouce (quart bas droit), bat avec la marche */
    formeMain(t, marche, souffle = 1) {
      return (u, v) => {
        const pu = (u - corpsU[0]) / (corpsU[1] - corpsU[0]), pv = (v - corpsV[0]) / (corpsV[1] - corpsV[0]);
        const d = Math.hypot(pu - .8, (pv - .8) * 1.15);
        const flex = (.022 + .012 * Math.sin(t * 1.3)) * souffle * d * d;
        const bat = marche * (.016 * Math.sin(pu * 3.4 - t * 6.2 + pv * 1.5) + .01 * Math.sin(t * 9.1 + pv * 4)) * d * d;
        return relief(u, v, .6) - flex + bat;
      };
    },
    /* le clou seul, tenu par la main (D12) : au point écran P, à l'échelle du CV posé sur la planche (quad) */
    clouSeul(P, quad) {
      vu = true;
      const lpx = Math.hypot(quad[1][0] - quad[0][0], quad[1][1] - quad[0][1]) / (corpsU[1] - corpsU[0]);
      poserClou((X, Y, Z, out) => { out = out || [0, 0]; out[0] = P[0] + (X - clouUV[0]) * lpx; out[1] = P[1] + (Y / A - clouUV[1]) * lpx; return out; }, 0, lpx * 1.15, 1);
    },
    /* quatrième passe, D12 : désépinglée, la feuille se décolle par le haut et se courbe (k de 0 à 1) */
    formeDeclou(t, k) {
      const base = this.formePlanche(t, 1);
      return (u, v) => {
        const pv = clamp((v - corpsV[0]) / (corpsV[1] - corpsV[0])), pu = clamp((u - corpsU[0]) / (corpsU[1] - corpsU[0]));
        return base(u, v) + k * (.16 * Math.pow(1 - pv, 2.2) + .03 * Math.sin(Math.PI * pu) * (1 - pv)) + k * k * .05 * Math.sin(Math.PI * pv);
      };
    },
    /* épinglée sur la planche à dessin : un seul coin qui rebique (en bas à droite) */
    formePlanche(t, aplat = 0) {
      return (u, v) => {
        const pu = (u - corpsU[0]) / (corpsU[1] - corpsU[0]), pv = (v - corpsV[0]) / (corpsV[1] - corpsV[0]);
        const coin = Math.pow(sm((pu + pv - 1.58) / .42), 2.2);
        const onde = .0035 * Math.sin(pu * 4.3 + .7) * Math.sin(pv * 3.1 + .2);
        /* F10 : à plat, il ne reste qu'un très léger relief */
        return .05 * coin * (1 + .04 * Math.sin(t * .7)) * (1 - .92 * aplat) + onde * (1 - .4 * aplat) + .002;
      };
    },
    griffer
  };
}
