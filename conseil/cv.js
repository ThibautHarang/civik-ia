/* =====================================================================
   Le CV du poteau, recopié du film (c-film/js/cv.js, fonction imprimer,
   même composition, même écriture : Caveat réglée sur l'écriture de
   Thibaut, le portrait à la plume dans son médaillon, le filet
   tricolore, les quatre lignes, les initiales et « Mon parcours »).
   Ici en 2D : la feuille réelle (feuille.webp), l'encre posée en
   multiplication, et l'écriture qui se révèle ligne à ligne.
   Changement demandé le 05/10/2026 : « Mon parcours » en gras.
   R3 (07/10/2026) : « T.H. » avec son second point, comme au film.
   CO-3 (06/10/2026) : le rôle devient « Conseil en santé numérique &
   intelligence artificielle » (CO-29, 07/10/2026 : « Conseil en santé,
   numérique & intelligence artificielle ») ; une espace insécable lie les mots qui
   ne doivent pas se séparer en fin de ligne (elle s'écrit comme une
   espace ordinaire de la main).
   ===================================================================== */
import { chargerImage } from '../commun/pages/pages.js';
import { rng } from '../commun/pages/plume.js';

const CV_W = 600;
export const LIGNES = ['Direction de clinique', 'Direction de la transformation numérique en santé', 'Direction de la stratégie et du développement en télémédecine', 'Direction des affaires publiques'];
/* CO-29 (cinquième passe, 07/10/2026) : « Conseil en santé, numérique & intelligence artificielle » (trois domaines : la
   virgule change le sens) ; insécables entre « & », « intelligence » et « artificielle » : la ligne se coupe après
   « numérique », jamais un mot seul sur la seconde ligne (« artificielle » y restait seul avant cette passe) */
export const TITRE = 'Conseil en santé, numérique & intelligence artificielle';
export const LINKEDIN = 'https://www.linkedin.com/in/thibaut-harang/';
const MAIN = 'Caveat, cursive', LARGE = 1.17, DROIT = .15, ENCRE_CV = '#16205C';
/* CO-18 (06/10/2026) : le tracé du logo LinkedIn à la plume est aussi posé par la page sous le parcours (exporté) */
export const LOGO_D = (() => {
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

function filtreTremble() {
  if (document.getElementById('tremble-cv')) return;
  const d = document.createElement('div'); d.setAttribute('aria-hidden', 'true'); d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML = '<svg width="0" height="0"><filter id="tremble-cv" x="-5%" y="-20%" width="110%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7" result="b"/><feDisplacementMap in="SourceGraphic" in2="b" scale="1.6" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';
  document.body.appendChild(d);
}
function ecrireMain(g, txt, x, y, taille, graine, dessiner, graisse = 400) {
  /* CO-3 : l'espace insécable sépare les mots à l'écriture (même écart que les autres), pas à la coupure des lignes */
  const R = rng(graine), rot = ((graine % 2) ? 1 : -1) * (.25 + R() * .55) * Math.PI / 180, mots = txt.split(/[  ]/);
  g.font = `${graisse} ${taille.toFixed(1)}px ${MAIN}`;
  if ('letterSpacing' in g) g.letterSpacing = (taille * .02).toFixed(2) + 'px';
  const esp = g.measureText(' ').width * 2.1;
  let cx = 0;
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
function couperMain(g, txt, larg, taille) {
  const mots = txt.split(' '), out = []; let l = '';
  mots.forEach(m => { const e = l ? l + ' ' + m : m; if (ecrireMain(g, e, 0, 0, taille, 1, false) > larg && l) { out.push(l); l = m; } else l = e; });
  if (l) out.push(l); return out;
}
/* la mise en page du film, avec en plus le relevé des lignes (pour l'écriture progressive) */
function imprimer(g, croquis, Ht, haut, initiales, lignesVues) {
  const Wt = CV_W, boite = {};
  const mise = (k, dessiner) => {
    const note = (x, y, w, h, quoi) => { if (dessiner && lignesVues) lignesVues.push({ x, y, w, h, quoi }); };
    let y = haut;
    const d = croquis ? Math.min(108 * k, 135) : 0, x0 = d ? d + 18 * k : 0;
    const fn = Math.min(58 * k, (Wt - x0) / 6.6);
    const yNom = y + Math.max(fn * .85, d * .62);
    if (dessiner && croquis) {
      g.save(); g.globalAlpha = .9; g.globalCompositeOperation = 'multiply';
      g.beginPath(); g.ellipse(d / 2, y + d / 2, d / 2, d / 2, 0, 0, Math.PI * 2); g.clip();
      const iw = croquis.naturalWidth || croquis.width, ih = croquis.naturalHeight || croquis.height, cad = croquis.cadre;
      if (cad) { const sc = d / 2 / (cad.r * iw); g.drawImage(croquis, d / 2 - cad.x * iw * sc, y + d / 2 - cad.y * ih * sc, iw * sc, ih * sc); }
      else { const sc = d / Math.min(iw, ih); g.drawImage(croquis, d / 2 - iw * sc / 2, y + d / 2 - ih * sc * .42, iw * sc, ih * sc); }
      g.restore();
    }
    note(0, y, d, d, 'portrait');
    const wNom = ecrireMain(g, 'Thibaut Harang', x0, yNom, fn, 11, dessiner);
    note(x0 - 4, yNom - fn * 1.05, wNom + 14, fn * 1.4, 'nom');
    y = Math.max(yNom + fn * .35, y + d);
    const ft = 25 * k, tl = couperMain(g, TITRE, Wt - 6, ft);
    tl.forEach((l, i) => { y += ft * 1.25; const w = ecrireMain(g, l, 4, y, ft, 21 + i, dessiner); note(0, y - ft * 1.05, w + 12, ft * 1.45, 'titre'); });
    y += 30 * k;
    if (dessiner) {
      const fw = 24 * Math.min(1.2, k);
      [['#000091', 0], ['#d9d4c8', fw], ['#c8322b', fw * 2]].forEach(([c, x], i) => { g.save(); g.strokeStyle = c; g.lineWidth = 3.4; g.lineCap = 'round'; g.globalAlpha = .9; g.beginPath(); g.moveTo(x + 2, y + (i - 1) * .6); g.quadraticCurveTo(x + fw / 2, y - 1.2 + i * .4, x + fw - 2, y + .4); g.stroke(); g.restore(); });
      note(0, y - 6, fw * 3 + 4, 12, 'filet');
    }
    y += 26 * k;
    const fl = 30 * k, lh = fl * 1.12;
    LIGNES.forEach((l, n) => {
      const ls = couperMain(g, l, Wt - 34 * k, fl);
      const y1 = y + fl * .85;
      if (dessiner) { g.save(); g.fillStyle = ENCRE_CV; g.globalAlpha = .9; g.beginPath(); g.ellipse(9 * k, y1 - fl * .28, 4.2 * k, 3.6 * k, .4, 0, Math.PI * 2); g.fill(); g.restore(); }
      ls.forEach((t, m) => { const w = ecrireMain(g, t, 30 * k, y1 + m * lh, fl, 40 + n * 7 + m, dessiner); note(m ? 26 * k : 0, y1 + m * lh - fl * 1.05, w + 34 * k, fl * 1.45, 'ligne'); });
      y += ls.length * lh + 14 * k;
    });
    y += 26 * k;
    const hi = initiales ? 40 * Math.min(1.2, k) : 0, ly = Math.max(y, Ht - 10 - hi * 1.2);
    if (initiales && dessiner) {
      const w = hi * initiales.naturalWidth / initiales.naturalHeight; g.save(); g.globalAlpha = .95; g.drawImage(initiales, 4, ly, w, hi);
      /* R3 (finitions du 07/10/2026) : « T.H. », le second point, par la méthode du film (c-film/js/cv.js, O4, quinzième
         passe) : le point qui suit le T dans initiales.webp (175 x 92 px ; le point de x 83 à 93, y 53 à 64, pris avec sa
         marge) est recopié pixel pour pixel après le H, au décalage du film (113,7 px), à la même hauteur, avec la même encre
         et la même opacité ; le logo et « Mon parcours » se décalent d'autant (l'écart du H au logo reste le même), et le
         point est dans la zone du lien LinkedIn */
      const e = hi / initiales.naturalHeight, PT = [76, 46, 24, 26], DXP = 113.7, DROITE = 207.5 + 10.5 - initiales.naturalWidth;
      if (initiales.naturalWidth === 175) g.drawImage(initiales, PT[0], PT[1], PT[2], PT[3], 4 + (PT[0] + DXP) * e, ly + PT[1] * e, PT[2] * e, PT[3] * e);
      const wp = initiales.naturalWidth === 175 ? DROITE * e : 0;
      g.restore(); boite.initiales = [4, ly, w + wp, hi];
      const c = hi * .8, lx = 4 + w + wp + hi * .5, lyy = ly + (hi - c) / 2 + hi * .04;
      g.save(); g.translate(lx, lyy); g.scale(c, c); g.strokeStyle = ENCRE_CV; g.lineCap = 'round'; g.lineJoin = 'round';
      if (LOGO) { g.lineWidth = .085; g.globalAlpha = .9; g.stroke(LOGO); g.lineWidth = .05; g.globalAlpha = .35; g.translate(.012, .018); g.stroke(LOGO); } g.restore();
      boite.logo = [lx, lyy, c, c];
      /* « Mon parcours » en gras (demande du 05/10/2026), un peu plus grand */
      const ft2 = hi * .74, tx = lx + c + hi * .32, ty = ly + hi * .72;
      const tw2 = ecrireMain(g, 'Mon parcours', tx, ty, ft2, 93, true, 700);
      g.save(); g.strokeStyle = ENCRE_CV; g.lineWidth = 2.2; g.lineCap = 'round'; g.globalAlpha = .85; g.beginPath(); g.moveTo(tx - 2, ty + ft2 * .2);
      for (let x = 0; x <= tw2 + 4; x += 10) g.lineTo(tx - 2 + x, ty + ft2 * .2 + Math.sin(x * .06 + .4) * 1.2 - x * .006); g.stroke(); g.restore();
      boite.texte = [tx, ly, tw2, hi];
      note(0, ly - 4, tx + tw2 + 10, hi + 12, 'lien');
    }
    return y + hi * 1.2 + 10;
  };
  let a = .6, z = 2.2;
  for (let i = 0; i < 22; i++) { const m = (a + z) / 2; if (mise(m, false) > Ht) z = m; else a = m; }
  mise(a, true);
  return boite;
}

/* Prépare la feuille : renvoie { canvas, peindre(t), lien : [u0, v0, u1, v1], clou : [u, v], corps } ;
   t de 0 (feuille blanche) à 1 (tout écrit). Les coordonnées u, v sont des fractions de la feuille. */
export async function preparerCv(echelle = 2) {
  const [feuille, croquisBrut, rep, initiales, man] = await Promise.all([
    chargerImage('../commun/img/c/feuille.webp'), chargerImage('../commun/img/portrait-esquisse.png'),
    fetch('../commun/img/portrait-esquisse.json').then(r => r.ok ? r.json() : null).catch(() => null),
    chargerImage('../commun/img/c/initiales.webp'),
    fetch('../commun/img/c/manifeste.json').then(r => r.ok ? r.json() : null).catch(() => null)
  ]);
  if (!feuille) return null;
  const vF = (man && man.feuille) || {};
  const croquis = croquisBrut && rep ? (() => {
    const n = 640, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(croquisBrut, 0, 0, n, n * croquisBrut.naturalHeight / croquisBrut.naturalWidth);
    try { const im = g.getImageData(0, 0, n, n), dd = im.data; for (let i = 3; i < dd.length; i += 4) dd[i] = dd[i] < 31 ? 0 : (dd[i] - 31) * 255 / 224; g.putImageData(im, 0, 0); } catch (e) {}
    const haut = Math.max(0, (rep.crane_y || .06) - .035), bas = Math.min(1, (rep.menton_y || .83) + .09);
    c.cadre = { x: rep.axe_x || .514, y: (haut + bas) / 2, r: (bas - haut) / 2 };
    return c;
  })() : croquisBrut;
  filtreTremble();
  try { await document.fonts.load('400 40px Caveat'); await document.fonts.load('700 40px Caveat'); } catch (e) {}
  const w = feuille.naturalWidth, h = feuille.naturalHeight;
  const tw = Math.round(w * echelle * .75), th = Math.round(h * echelle * .75);
  const texteQ = vF.texte || [[.09, .06], [.91, .06], [.91, .71], [.09, .71]];
  const clouUV = vF.clou || [.5, .032];
  const corps = vF.corps || [[.018, .01], [.982, .01], [.982, .99], [.018, .99]];
  const tx0 = texteQ[0][0] * tw, ty0 = texteQ[0][1] * th, tx1 = texteQ[1][0] * tw, ty1 = texteQ[2][1] * th;
  const ek = (tx1 - tx0) / CV_W, Ht = (ty1 - ty0) / ek;
  /* comme au film : le haut réserve la place du clou */
  const clouBas = [clouUV[0] - .13, clouUV[1] + .035];
  const hautCv = Math.max(0, ((clouBas[1] + .034) * th - ty0) / ek);
  const enc = document.createElement('canvas'); enc.width = tw; enc.height = th;
  const ge = enc.getContext('2d');
  ge.setTransform(ek, 0, 0, ek, tx0, ty0);
  ge.filter = 'url(#tremble-cv)';
  const lignes = [];
  const boite = imprimer(ge, croquis, Ht, hautCv, initiales, lignes);
  ge.filter = 'none'; ge.setTransform(1, 0, 0, 1, 0, 0);
  const canvas = document.createElement('canvas'); canvas.width = tw; canvas.height = th;
  const g = canvas.getContext('2d');
  /* l'ordre d'écriture : portrait et nom, titre, filet, lignes, lien ; chaque morceau a sa part du temps */
  const total = lignes.reduce((s, l) => s + (l.quoi === 'portrait' ? 120 : l.w), 0);
  let acc = 0; lignes.forEach(l => { l.t0 = acc / total; acc += l.quoi === 'portrait' ? 120 : l.w; l.t1 = acc / total; });
  const peindre = t => {
    g.clearRect(0, 0, tw, th);
    g.drawImage(feuille, 0, 0, tw, th);
    g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = .96;
    lignes.forEach(l => {
      const q = Math.max(0, Math.min(1, (t - l.t0) / (l.t1 - l.t0)));
      if (q <= 0) return;
      const x = tx0 + l.x * ek, y = ty0 + l.y * ek, ww = l.w * ek, hh = l.h * ek;
      g.save(); g.beginPath();
      if (l.quoi === 'portrait') { g.globalAlpha = .96 * q; g.rect(x - 4, y - 4, ww + 8, hh + 8); }
      else g.rect(x - 6, y - 2, (ww + 12) * q, hh + 6);
      g.clip(); g.drawImage(enc, 0, 0); g.restore();
    });
    g.restore();
    g.save(); g.globalCompositeOperation = 'destination-in'; g.drawImage(feuille, 0, 0, tw, th); g.restore();
  };
  peindre(1);
  /* la zone du lien (initiales, logo, « Mon parcours ») en fractions de la feuille */
  let lien = null;
  if (boite.initiales && boite.texte) {
    const zx0 = boite.initiales[0] - 8, zy0 = boite.initiales[1] - 10, zx1 = boite.texte[0] + boite.texte[2] + 10, zy1 = boite.initiales[1] + boite.initiales[3] + 10;
    lien = [(tx0 + zx0 * ek) / tw, (ty0 + zy0 * ek) / th, (tx0 + zx1 * ek) / tw, (ty0 + zy1 * ek) / th];
  }
  return { canvas, peindre, lien, clou: clouUV, corps, w, h };
}
