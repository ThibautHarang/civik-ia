/* =====================================================================
   La lettre qui part, seconde version (14/10/2026) : l'envoi d'un
   formulaire devient une action qui se transforme. Au clic, la carte
   du formulaire, à sa place exacte, devient une feuille de papier
   tracée à la plume ; ce qui a été saisi s'y écrit à la main (Caveat,
   encre de la plume), à l'endroit des champs. La feuille rapetisse en
   lettre, se plie en trois, entre dans son enveloppe dessinée, qui se
   ferme seule et attend la réponse du service (point d'attente : 1,8 s).
   Réponse acceptée : un cachet au sigle de Civik-ia tamponne
   l'enveloppe, elle s'envole vers la boîte aux lettres au bout du petit
   chemin, entre dans la fente ; la couche rend la main, la page passe à
   sa forme finale sous elle, puis la boîte vole se poser en vignette à
   gauche du remerciement. Réponse refusée ou panne : tout se déroule à
   l'envers, le vrai formulaire revient avec ses valeurs, intactes.
   Technique : une couche fixe posée sur la partie visible de la carte
   (mesures au clic, rien n'est lu dans la boucle d'images), le vrai
   formulaire dessous (visibility, inert), la mise en page gardée ; la
   hauteur ne bouge qu'au départ, une écriture par image, sous la couche.
   Chargé au premier envoi par import dynamique (pages.js, interrupteur
   LETTRE ; marianne.js, LETTRE_MARIANNE). Ne dépend que de ./plume.js ;
   les règles nécessaires sont posées ici, dans un <style> (une fois).
   API
     jouer(form, promesse, o) : promesse résolue avec la réponse (vrai ou
       faux) quand la scène rend la main. o.carte : le bloc qui se
       transforme (défaut : form.closest('.pas, .contact__formu, .ci-form')
       ou le formulaire) ; o.champs : les éléments écrits à la main (défaut :
       les champs remplis et visibles de la carte, plus trois lignes de la
       fiche) ; o.tenir : l'élément dont la hauteur est tenue jusqu'au
       départ (défaut : la carte) ; o.annule : fonction, vrai = ne rien jouer.
     vignette(bloc) : la vignette (la boîte et le coin de l'enveloppe, 72 px)
       à gauche du remerciement ; la couche en attente y part en volant.
     couper() : retire tout sur-le-champ (délai de garde de pages.js).
     apercu(parent, o) : la scène figée à un instant (page de démonstration).
   La couche est aria-hidden, sans pointeur ; sous prefers-reduced-motion,
   rien n'est joué et la vignette est fixe. window.__lettreStats : images,
   durée et images par seconde de la dernière lecture.
   ===================================================================== */
import { Dessin, ligne, arcE, perimetre, formeMain, hachures, catmull, clamp, lerp, eEntree, eDepl, ENCRE_PLUME } from './plume.js';

const NS = 'http://www.w3.org/2000/svg', XL = 'http://www.w3.org/1999/xlink', ICI = import.meta.url;
/* la boîte aux lettres gravée (préparée le 14/10/2026 comme la borne du film) ; repères en fractions de l'image :
   fente (centre), bords de la fente, lèvre (bas du rebord, la découpe), pied (bas de l'herbe), silhouette [x0, y0, x1, y1] */
export const BOITE = {
  src: new URL('../img/c/boite-aux-lettres-448.webp', ICI).href, grand: new URL('../img/c/boite-aux-lettres.webp', ICI).href,
  taille: [448, 600], fente: [.371, .268], fenteG: .285, fenteD: .458, levre: .262, pied: [.5647, .8675], silhouette: [.1674, .1317, .8326, .8675]
};
const CAVEAT = new URL('../fonts/caveat-latin-var.woff2', ICI).href, POLICE = "Caveat,'Segoe Print','Bradley Hand',cursive";
const PAPIER = '#fffdf8';
const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const dort = ms => new Promise(r => setTimeout(r, ms));
/* les profils de trait de l'atelier (atelier/croquis.js) */
const GROS = { wMin: .8, wMax: 2.6, tremble: .5, op: .9 }, DET = { wMin: .5, wMax: 1.7, tremble: .45, op: .88 }, FIN = { wMin: .4, wMax: 1.1, tremble: .35, op: .8 };
/* le sigle de Civik-ia (logo-civik-ia.svg, région viewBox(720,150,720,600), au dixième) : l'arche en deux tracés, la flèche */
const SIGLE = [
  'M33.3 22.8C31.6 22.8 29.8 23.3 28.2 23.8C27.1 24.3 26 24.9 24.8 25.2C24.4 25.3 24.1 25.5 23.7 25.7C22.9 26.4 21.8 26.9 20.9 27.5C20 28.2 19.1 28.7 18.2 29.4C17.3 30.1 16.5 30.8 15.8 31.6C15.2 32.4 14.1 33.1 13.6 34C13.1 34.9 11.7 35.6 12 36.6C11.8 36.6 11.9 37.1 11.6 36.7C11.8 37.2 11.2 37.7 10.8 37.5C10.3 39 8.9 40.1 9.1 41.8C8.4 41.2 8.3 42.4 7.9 42.9C7.6 43.5 7.6 44.5 7.2 45.1C6.8 45.7 6.8 46.6 6.3 47.1C6.2 47.6 6 48.2 5.9 48.7C5.8 50.1 5.6 51.6 5.4 53.1C5.2 54.6 5.5 55.9 5.3 57.2C9 57.7 13 57.3 16.8 57.4C16.9 56.1 17.1 54.4 17.5 53C18.2 47.5 19.9 41.9 23.2 37.3C24 35.4 25.5 34.4 26.8 32.9C28.2 31.5 29.5 30.6 31.3 29.6C33.1 28.6 35 27.7 37 27.5C37.1 27.5 37.2 27.4 37.3 27.4C38.5 26.8 39.2 26.5 40.5 26.3C41.8 26.2 43 25.5 44.2 25.2C44.8 25 45.5 24.7 46 24.3C43.5 23.4 40.9 22.8 38.2 22.6C36.6 22.6 34.9 22.8 33.3 22.8Z',
  'M43.8 32.2C43.1 32.3 42.4 32.4 41.6 32.4C40.4 32.4 39 32.5 37.8 32.6C38.1 32.6 38.3 32.7 38.6 32.7C43.7 33.4 48.2 36.3 51.1 40.7C52.3 42.1 53 43.7 53.7 45.4C54.4 47.1 55.1 49.4 55 51.3C55.1 52.3 55.3 53.3 55.3 54.4C55.3 54.6 55.4 54.9 55.4 55.1C55.5 55.7 55.7 56.8 55.6 57.5C59.4 57.5 63.3 57.7 67.1 57.5C67.2 57.5 67.4 57.3 67.6 57.4C67.8 55.5 67.3 53.6 67.4 51.8C66.4 45.8 64.3 40.1 60.5 35.3C58.7 33.4 56.5 31.4 54.8 29.5C54.7 29.4 54.5 29.2 54.4 29.1C54.4 29.1 54.2 29 54.2 29C53.5 28.7 52.7 29.9 51.9 30C51.2 30.2 50.2 30.7 49.4 30.9C48.6 31.1 47.6 31.5 46.7 31.7C45.8 31.9 44.7 32.1 43.8 32.2Z',
  'M30.9 32.9C30.5 33.2 30.3 33.7 29.7 33.8C30 34 29.7 34 29.6 34.2C29.9 34.1 30.1 33.9 30.4 33.8C31.3 33.2 32.6 32.8 33.7 32.8C35 32.6 36.4 32.5 37.8 32.6C39 32.5 40.4 32.4 41.6 32.4C42.3 32.3 43.1 32.3 43.8 32.2C44.7 32.1 45.8 31.9 46.7 31.7C47.6 31.5 48.6 31.1 49.4 30.9C50.2 30.7 51.2 30.2 51.9 30C52.7 29.9 53.5 28.7 54.2 29C58.4 26.4 62.7 22.8 65.3 18.3C67 19.2 68.5 20.7 70.2 21.7C70.5 15.4 70.7 9.1 71.1 2.9C65.3 5.3 59.6 7.7 53.9 10.1C54.6 10.8 55.6 11.5 56.5 12.1C57.3 12.7 58.9 13.3 58.2 14.4C57.5 15.4 57.1 16.3 56.4 17.2C55.8 18.2 55.3 19.1 54.5 19.9C53.8 20.8 53.1 21.6 52.4 22.4C51.6 23.2 50.9 23.8 50 24.5C49.2 25.2 48.3 25.8 47.3 26.4C46.3 27 45.2 27.3 44.1 27.8C43.1 28.3 41.8 28.6 40.6 28.9C39.5 29.2 38.2 29.7 37.1 30C36 30.3 34.9 30.9 33.8 31.3C32.7 31.8 31.9 32.3 30.9 32.9Z'
];

/* le calendrier, en millisecondes. Avant la réponse : fondu de la carte, contour, écriture, réduction, deux plis,
   décor, enveloppe, glissement, rabat ; point d'attente. Après : cachet, vol, fente, recul ; puis le départ. */
const FONDU = [0, 250], CONTOUR = [0, 360], ECRIT = [120, 760], REDUIT = [780, 1160], PLI1 = [1160, 1320], PLI2 = [1300, 1460];
const DECOR = [1240, 1700], BOITE_T = [1180, 1460], ENV = [1320, 1460], RABAT = [1360, 1480], GLISSE = [1480, 1640], FERME = [1640, 1800];
export const ATTENTE = 1800;
const DESCEND = [0, 230], PRESSE = [230, 310], REMONTE = [310, 500], VOL = [400, 1000], ENTRE = [1000, 1160], RECUL = [1100, 1240];
export const POSTE = 1240, DEPART = 450, FIN_T = ATTENTE + POSTE, RETOUR = 1.8;
const pr = (t, [a, b]) => clamp((t - a) / (b - a));
const f1 = v => (Math.round(v * 10) / 10).toString();
const pivot = (y, s) => `translate(0 ${f1(y)}) scale(1 ${(Math.abs(s) < .02 ? (s < 0 ? -.02 : .02) : s).toFixed(3)}) translate(0 ${f1(-y)})`;
function el(nom, attrs, parent) { const e = document.createElementNS(NS, nom); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function div(cls, parent) { const d = document.createElement('div'); if (cls) d.className = cls; if (parent) parent.appendChild(d); return d; }

/* ---------- les règles critiques, dans la page, une seule fois (aucune feuille externe nécessaire) ---------- */
let style = null, police = Promise.resolve(), image = null;
function poserStyle() {
  if (style) return;
  style = document.createElement('style'); style.setAttribute('data-lettre', '');
  /* la Caveat n'est déclarée ici que si la page ne la déclare pas déjà (Marianne) */
  let caveat = false; try { document.fonts.forEach(f => { if (/caveat/i.test(f.family)) caveat = true; }); } catch (e) { /* rien */ }
  style.textContent = (caveat ? '' : `@font-face{font-family:'Caveat';font-style:normal;font-weight:400 700;font-display:swap;src:url('${CAVEAT}') format('woff2')}\n`) + `.lettre-couche{position:fixed;left:0;top:0;z-index:60;overflow:hidden;pointer-events:none;user-select:none;-webkit-user-select:none;box-sizing:border-box;margin:0;padding:0;contain:layout paint}
.lettre-couche>*,.lettre-vol>*{position:absolute;left:0;top:0}
.lettre-couche svg,.lettre-vol svg,.lettre-vignette svg{display:block;overflow:visible;max-width:none}
.lettre-boite{transform-origin:0 0}
.lettre-boite>img,.lettre-boite>svg{position:absolute;left:0;top:0;display:block;max-width:none;-webkit-user-drag:none}
.lettre-vol{position:fixed;left:0;top:0;z-index:60;pointer-events:none;transform-origin:0 0;margin:0;padding:0}
.lettre-pose{display:flow-root}
.lettre-vignette{float:left;position:relative;margin:0 22px 4px 0;line-height:0;overflow:hidden;pointer-events:none}
.lettre-vignette>.lettre-boite{position:absolute;left:0;top:0}
.lettre-apercu{position:relative;overflow:hidden}
@media (prefers-reduced-motion:reduce){.lettre-couche,.lettre-vol{display:none}}`;
  document.head.appendChild(style);
  /* la police n'est chargée que pour une scène (rien en mouvement réduit) */
  try { if (!reduit() && document.fonts && document.fonts.load) police = document.fonts.load(`500 24px Caveat`).catch(() => {}); } catch (e) { /* rien */ }
}
/* 6. les règles critiques aussi en ligne (attribut style), pour ne dépendre d'aucune feuille, même de la nôtre */
const EN_LIGNE = 'position:absolute;left:0;top:0;display:block;max-width:none;overflow:visible;margin:0;padding:0';
const enLigne = (e, plus) => { e.style.cssText = EN_LIGNE + (plus ? ';' + plus : ''); return e; };
/* l'image de la boîte, chargée en tâche de fond dès le module ; prete() : arrivée et décodée */
function chargerBoite() {
  if (image) return image;
  const im = new Image(); im.decoding = 'async'; im.alt = ''; im.src = BOITE.src; image = im; return im;
}
const boitePrete = () => !!(image && image.complete && image.naturalWidth);

/* ---------- la boîte (image, ou boîte dessinée en repli) à la hauteur de silhouette hs ; enveloppe : sa petite enveloppe ---------- */
function fabriquerBoite(hs, o = {}) {
  const [x0, y0, x1, y1] = BOITE.silhouette, iH = hs / (y1 - y0), iW = iH * BOITE.taille[0] / BOITE.taille[1], d = iW / BOITE.taille[0];
  const [TW, TH] = BOITE.taille, id = 'lb' + Math.random().toString(36).slice(2, 8);
  const boite = enLigne(div('lettre-boite'), `width:${iW.toFixed(1)}px;height:${iH.toFixed(1)}px;transform-origin:0 0;overflow:visible;pointer-events:none`);
  /* l'image, sinon le dessin (même cadre, même fente, même pied) */
  let img = null, dessin = null;
  const mettreImage = () => { img = chargerBoite().cloneNode(); img.alt = ''; img.draggable = false; enLigne(img, `width:${iW.toFixed(1)}px;height:${iH.toFixed(1)}px`); boite.prepend(img); };
  const mettreDessin = () => { dessin = boiteDessinee(d, o.phase); enLigne(dessin.svg); boite.prepend(dessin.svg); };
  if (o.choix === 'image' || (o.choix !== 'dessin' && boitePrete())) mettreImage();
  else if (o.choix === 'attendre') {   /* la vignette fixe : l'image dès qu'elle arrive, la boîte dessinée si elle manque */
    mettreImage(); img.onerror = () => { if (img) { img.remove(); img = null; mettreDessin(); } };
  } else mettreDessin();
  /* la petite enveloppe, dans les coordonnées de l'image : largeur de la fente, découpée à la lèvre */
  const svg = el('svg', { viewBox: `0 0 ${TW} ${TH}`, width: iW.toFixed(1), height: iH.toFixed(1), 'aria-hidden': 'true', focusable: 'false' }); enLigne(svg);
  const defs = el('defs', {}, svg), cp = el('clipPath', { id: id + '-l', clipPathUnits: 'userSpaceOnUse' }, defs);
  el('rect', { x: -TW, y: BOITE.levre * TH, width: 3 * TW, height: 2 * TH }, cp);
  const gc = el('g', { 'clip-path': `url(#${id}-l)` }, svg), ge = el('g', {}, gc);
  const ew = (BOITE.fenteD - BOITE.fenteG) * TW, eh = .62 * ew, ex = BOITE.fente[0] * TW - ew / 2, ey = (BOITE.fente[1] + .02) * TH;
  el('rect', { x: f1(ex), y: f1(ey), width: f1(ew), height: f1(eh), fill: PAPIER }, ge);
  const De = new Dessin(ge, ENCRE_PLUME), ep = clamp(1.1 / d / 2.2, .5, 3);
  formeMain(De, perimetre(ex, ey, ew, eh, 1.5), { wMin: .5 * ep, wMax: 1.3 * ep, tremble: .3, op: .9, phase: 'p', graine: 301 });
  De.trait([[ex + 2, ey + 2], [ex + ew / 2, ey + .55 * eh], [ex + ew - 2, ey + 2]], { wMin: .35 * ep, wMax: .9 * ep, tremble: .2, op: .7, phase: 'p', graine: 303 });
  De.monter(); De.rendre({ p: 1 });
  const gq = el('g', { transform: `translate(${f1(ex + ew / 2)} ${f1(ey + .55 * eh)}) rotate(-8)`, opacity: '.8' }, ge);
  el('circle', { r: f1(.14 * ew), fill: 'none', stroke: ENCRE_PLUME, 'stroke-width': f1(.9 * ep) }, gq);
  const gs = el('g', { transform: `scale(${(.2 * ew / 72).toFixed(4)}) translate(-38 -30)`, fill: ENCRE_PLUME }, gq);
  SIGLE.forEach(p => el('path', { d: p }, gs));
  boite.appendChild(svg);
  /* m : 0 (juste sous la fente) à 1 (entrée, le coin dehors) ; l'enveloppe penche de 7 degrés */
  const MONTE = .55 * eh, cx = ex + ew / 2, cy = ey + eh / 2;
  const placer = m => { ge.setAttribute('transform', `translate(0 ${f1(-MONTE * m)}) rotate(-7 ${f1(cx)} ${f1(cy)})`); };
  placer(o.enveloppe === undefined ? 1 : o.enveloppe); svg.style.display = o.enveloppe === null ? 'none' : '';
  return {
    el: boite, iW, iH, d, silX: x0 * iW, silY: y0 * iH, silW: (x1 - x0) * iW, hs,
    /* en pixels de la boîte : le centre de la petite enveloppe à m = 0, sa largeur, sa pente */
    envCentre: [cx * d, cy * d], envLargeur: ew * d, pente: -7,
    enveloppe(v, m) { svg.style.display = v ? '' : 'none'; if (v) placer(m); },
    dessin: (p) => { if (dessin) dessin.rendre(p); },
    image: () => !!img
  };
}
/* la boîte dessinée à la plume, en repli de l'image : mêmes repères (fente, pied), en pixels de l'image */
function boiteDessinee(d, phase) {
  const [TW, TH] = BOITE.taille, svg = el('svg', { viewBox: `0 0 ${TW} ${TH}`, width: f1(TW * d), height: f1(TH * d), 'aria-hidden': 'true', focusable: 'false' });
  const ep = clamp(1 / d / 1.6, .6, 4), s = (base, g, o = {}) => Object.assign({}, base, { phase: 'b', graine: g }, o, { wMin: base.wMin * ep, wMax: (o.wMax || base.wMax) * ep });
  const D = new Dessin(svg, ENCRE_PLUME);
  const fx0 = 112, fx1 = 220, ft = 92, fb = 300, R = (fx1 - fx0) / 2, sx = 118, sy = -22;
  el('path', { d: `M${fx0} ${fb}V${ft + R}A${R} ${R} 0 0 1 ${fx1} ${ft + R}L${fx1 + sx} ${ft + R + sy}V${fb + sy}L${fx1} ${fb}Z`, fill: PAPIER }, svg).parentNode.insertBefore(svg.lastChild, D.g);
  formeMain(D, [[fx0, fb], [fx0, ft + R]].concat(arcE(fx0 + R, ft + R, R, R, Math.PI, Math.PI * 2), [[fx1, fb], [fx0, fb]]), s(GROS, 11));
  D.trait(arcE(fx0 + R + sx, ft + R + sy, R, R, Math.PI * 1.5, Math.PI * 2).concat([[fx1 + R + sx - R, fb + sy]]), s(DET, 13));
  D.trait([[fx0 + R, ft], [fx0 + R + sx, ft + sy]], s(DET, 14)); D.trait([[fx1, fb], [fx1 + sx, fb + sy]], s(DET, 15));
  hachures(D, [[fx1 + 4, ft + R], [fx1 + sx - 2, ft + R + sy], [fx1 + sx - 2, fb + sy - 2], [fx1 + 4, fb - 2]], { phase: 'b', angle: 70, pas: 7, long: [18, 40], op: .4, wMax: 1.2 * ep, graine: 17 });
  const gx = BOITE.fenteG * TW, dx = BOITE.fenteD * TW, ly = BOITE.levre * TH, fy = BOITE.fente[1] * TH;
  formeMain(D, perimetre(gx, ly - 10, dx - gx, 12, 2), s(DET, 21));
  D.trait(ligne(gx + 4, fy + 4, dx - 4, fy + 4), s(GROS, 23, { profil: 'plat', wMax: 3.4, tremble: .2 }));
  formeMain(D, perimetre(gx + 8, 200, dx - gx - 16, 72, 3), s(FIN, 25));
  const px0 = 198, px1 = 262, pyH = fb, pyB = BOITE.pied[1] * TH - 18;
  D.trait(ligne(px0, pyH, px0 + 2, pyB), s(DET, 31)); D.trait(ligne(px1, pyH - 6, px1 - 1, pyB), s(DET, 32));
  hachures(D, [[px1 - 18, pyH], [px1 - 2, pyH], [px1 - 2, pyB], [px1 - 18, pyB]], { phase: 'b', angle: 90, pas: 6, long: [16, 34], op: .35, wMax: ep, graine: 33 });
  const pied = [BOITE.pied[0] * TW, BOITE.pied[1] * TH];
  D.trait(catmull([[pied[0] - 150, pied[1] - 6], [pied[0] - 40, pied[1] - 2], [pied[0] + 60, pied[1] - 4], [pied[0] + 150, pied[1] - 8]], 5), s(FIN, 41, { op: .6 }));
  [[-120, 1], [-60, 1.3], [-14, 1.5], [46, 1.4], [104, 1.1], [150, .9]].forEach(([x, k], i) => {
    for (let j = -2; j <= 2; j++) D.trait([[pied[0] + x + j * 6, pied[1] - 4], [pied[0] + x + j * 13 + 3, pied[1] - 4 - (j ? 34 : 50) * k]], s(FIN, 50 + i * 5 + j, { wMax: 1, levee: 2 }));
  });
  D.monter();
  const rendre = p => D.rendre({ b: p === undefined ? 1 : p });
  rendre(phase === undefined ? 1 : phase);
  return { svg, rendre };
}

/* ---------- ce qui s'écrit à la main : les champs remplis, puis trois lignes de la fiche ---------- */
const TYPES = /^(text|email|tel|number|search|url)$/;
const EXCLUS = new Set(['nom', 'structure', 'courriel', 'tel', 'idee', 'libre', 'croquis']);
const visibleEl = e => !!(e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
function champsDe(carte) {
  if (carte.matches('.fiche, [data-fiche]')) return Array.from(carte.querySelectorAll('dd')).filter(dd => !dd.classList.contains('vide') && dd.textContent.trim() && visibleEl(dd));
  return Array.from(carte.querySelectorAll('input, textarea')).filter(c => (c.tagName === 'TEXTAREA' || TYPES.test(c.type || 'text')) && c.type !== 'hidden'
    && c.name !== '_gotcha' && !c.classList.contains('sr') && c.value && c.value.trim() && !c.closest('[hidden]') && visibleEl(c));
}
const minuscule = s => (s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s);
function lignesFiche(carte) {
  if (carte.matches('.fiche, [data-fiche]')) return [];
  const fiche = carte.querySelector('[data-fiche]') || (carte.matches('.pas') ? document.querySelector('[data-fiche]') : null);
  if (!fiche) return [];
  const out = [];
  fiche.querySelectorAll('dd[data-l]').forEach(dd => {
    if (out.length >= 3 || EXCLUS.has(dd.dataset.l) || dd.classList.contains('vide')) return;
    const v = dd.textContent.replace(/\s+/g, ' ').trim(), dt = dd.previousElementSibling;
    if (v && dt) out.push(`${dt.textContent.replace(/\s+/g, ' ').trim()} : ${minuscule(v)}`);
  });
  return out;
}
let toile = null;
function mesurer(txt, fs, fonte) { if (!toile) toile = document.createElement('canvas').getContext('2d'); toile.font = fonte || `500 ${fs}px ${POLICE}`; return toile.measureText(txt).width; }
/* un texte coupé en n lignes au plus de largeur max, avec points de suspension s'il déborde (fonte : celle du champ).
   300 caractères au plus sont mesurés (une valeur collée de 20 000 caractères ne gèle rien) ; chaque coupe se cherche par
   dichotomie (une dizaine de mesures par ligne), à la dernière espace qui tient, sinon au milieu du mot */
const LONG = 300;
function couperTexte(txt, fs, max, n, fonte) {
  const m = t => mesurer(t, fs, fonte), net = String(txt).replace(/\s+/g, ' ').trim();
  let reste = net.slice(0, LONG);
  const tronque = net.length > LONG, lignes = [];
  const tient = (t, suite = '') => { let a = 0, b = t.length; while (a < b) { const c = (a + b + 1) >> 1; if (m(t.slice(0, c) + suite) <= max) a = c; else b = c - 1; } return a; };
  while (reste && lignes.length < n) {
    if (m(reste) <= max) { lignes.push(reste); reste = ''; break; }
    const k = Math.max(1, tient(reste)), esp = reste.lastIndexOf(' ', k), coupe = esp > 0 ? esp : k;
    lignes.push(reste.slice(0, coupe).trim()); reste = reste.slice(coupe).trim();
  }
  if (!lignes.length) lignes.push('');
  if (reste || tronque) { const der = lignes[lignes.length - 1].replace(/[\s,.;:]+$/, ''); lignes[lignes.length - 1] = der.slice(0, tient(der, '…')).replace(/[\s,.;:]+$/, '') + '…'; }
  return lignes;
}

/* ---------- la scène ---------- */
let enCours = null, enAttente = null, enDepart = null;
class Scene {
  /* carte : le bloc qui se transforme ; mesures au clic, construction hors de la page */
  constructor(carte, form, o = {}) {
    this.carte = carte; this.form = form; this.o = o; this.apercu = !!o.apercu; this.coupe = false;
    const r = carte.getBoundingClientRect(), cs = getComputedStyle(carte);
    const vw = document.documentElement.clientWidth || innerWidth, vh = innerHeight;
    let haut = r.top, bas = r.bottom, gauche = r.left, droite = r.right;
    if (!this.apercu) {
      /* sous la barre de navigation fixe (scroll-padding-top des pages, moins sa marge) : la scène reste visible */
      const nav = clamp((parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0) - 26, 0, 140);
      haut = Math.max(r.top, nav); bas = Math.min(r.bottom, vh); gauche = Math.max(r.left, 0); droite = Math.min(r.right, vw);
      const MIN = Math.min(r.height, 260);
      if (bas - haut < MIN) { if (r.top < 0) haut = Math.max(r.top, bas - MIN); else bas = Math.min(r.bottom, haut + MIN); }
    }
    const rayon = parseFloat(cs.borderTopLeftRadius) || 0, b = parseFloat(cs.borderTopWidth) || 0;
    const hautV = r.top >= haut - .5, basV = r.bottom <= bas + .5;
    const bT = hautV ? b : 0, bB = basV ? b : 0;
    let fond = cs.backgroundColor; if (!fond || fond === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(fond)) fond = PAPIER;
    this.rect = { left: gauche, top: haut, width: droite - gauche, height: bas - haut };
    const W = this.W = droite - gauche - 2 * b, H = this.H = bas - haut - bT - bB, ox = gauche + b, oy = haut + bT;
    this.sy0 = scrollY; this.dy = 0; this.html = null; this.bloc = o.bloc || null;
    const couche = this.couche = div(this.apercu ? 'lettre-couche lettre-couche--apercu' : 'lettre-couche');
    couche.setAttribute('aria-hidden', 'true');
    couche.style.cssText = 'position:fixed;left:0;top:0;z-index:60;overflow:hidden;pointer-events:none;user-select:none;-webkit-user-select:none;box-sizing:border-box;margin:0;padding:0;display:block';
    const st = couche.style;
    if (this.apercu) { st.position = 'relative'; st.left = st.top = 'auto'; st.zIndex = 'auto'; }
    else { st.left = gauche.toFixed(2) + 'px'; st.top = haut.toFixed(2) + 'px'; }
    st.width = (droite - gauche).toFixed(2) + 'px'; st.height = (bas - haut).toFixed(2) + 'px'; st.background = fond;
    const rr = v => (v ? rayon : 0) + 'px';
    st.borderRadius = `${rr(hautV)} ${rr(hautV)} ${rr(basV)} ${rr(basV)}`; this.rayons = [hautV ? rayon : 0, basV ? rayon : 0];
    if (b) { st.borderStyle = 'solid'; st.borderColor = cs.borderTopColor; st.borderWidth = `${bT}px ${b}px ${bB}px ${b}px`; }
    st.opacity = '0';
    /* l'écriture : un champ, une à trois lignes, à sa place ; puis les lignes de la fiche sous les champs */
    const champs = (o.champs ? Array.from(o.champs) : champsDe(carte)).filter(Boolean);
    const lignes = [], saisies = this.saisies = []; let fsRef = 0, bas0 = 0, x0 = null;
    champs.forEach((c, k) => {
      const q = c.getBoundingClientRect(); if (!q.width || !q.height) return;
      const dd = c.tagName === 'DD', ta = c.tagName === 'TEXTAREA', ccs = dd ? null : getComputedStyle(c);
      const padL = dd ? 0 : parseFloat(ccs.paddingLeft) || 12, padT = dd ? 0 : parseFloat(ccs.paddingTop) || 10;
      const hRef = dd ? q.height : ta ? Math.min(52, q.height) : Math.min(q.height, 56);
      let fs = dd ? clamp(q.height * 1.05, 17, 24) : clamp(.6 * hRef, 16, 32);
      const x = q.left - ox + padL, max = Math.max(40, q.width - 2 * padL);
      const texte = String(dd ? c.textContent : c.value).slice(0, 2 * LONG);
      /* une valeur d'une ligne (nom, structure, courriel, ville) : la police se réduit jusqu'à 0,42 fois la hauteur du champ
         pour tenir entière dans sa largeur (mesure au clic) ; au-dessous seulement, les points de suspension */
      if (!dd && !ta) { const lg = mesurer(texte.replace(/\s+/g, ' ').trim(), fs); if (lg > max) fs = Math.max(Math.min(fs, Math.max(14, .42 * hRef)), fs * max / lg * .98); }
      const ls = ta ? couperTexte(texte, fs, max, Math.max(1, Math.min(3, Math.floor((q.height - padT) / (1.12 * fs))))) : couperTexte(texte, fs, max, 1);
      const y1 = dd ? q.top - oy + .8 * q.height : ta ? q.top - oy + padT + .82 * fs : q.top - oy + q.height / 2 + .3 * fs;
      ls.forEach((t, i) => lignes.push({ x, y: y1 + i * 1.12 * fs, fs, t, champ: k }));
      /* la saisie telle qu'elle est à l'écran (case, texte tapé, même fonte) : elle s'efface quand sa ligne s'écrit */
      if (!dd) {
        const bl = parseFloat(ccs.borderLeftWidth) || 0, bt = parseFloat(ccs.borderTopWidth) || 0, fsT = parseFloat(ccs.fontSize) || 16;
        const fonte = `${ccs.fontStyle} ${ccs.fontWeight} ${fsT}px ${ccs.fontFamily}`, lh = parseFloat(ccs.lineHeight) || 1.4 * fsT;
        const xt = q.left - ox + bl + padL, maxT = q.width - 2 * (bl + padL);
        const typees = ta ? couperTexte(texte, fsT, maxT, Math.max(1, Math.floor((q.height - 2 * padT) / lh)), fonte) : [texte];
        const yt = ta ? q.top - oy + bt + padT + (lh - fsT) / 2 + .8 * fsT : q.top - oy + q.height / 2 + .36 * fsT;
        saisies.push({ k, x: q.left - ox, y: q.top - oy, w: q.width, h: q.height, rx: parseFloat(ccs.borderTopLeftRadius) || 0, fond: ccs.backgroundColor, bord: ccs.borderTopColor, bw: bt,
          fonte, couleur: ccs.color, typees: typees.map((t, i) => ({ x: xt, y: yt + i * lh, t })) });
      }
      fsRef = fsRef || fs; bas0 = Math.max(bas0, q.bottom - oy); if (x0 === null) x0 = x;
    });
    const fl = lignesFiche(carte);
    if (fl.length && lignes.length) {
      const fs2 = clamp(.82 * fsRef, 16, 26), pas = 1.18 * fs2;
      let y = Math.min(bas0 + 1.25 * fs2, H - 12 - (fl.length - 1) * pas);
      fl.forEach(t => { lignes.push({ x: x0, y, fs: fs2, t: couperTexte(t, fs2, Math.max(60, W - x0 - 16), 1)[0] }); y += pas; });
    }
    this.lignes = lignes.filter(l => l.y > 4 && l.y < H + l.fs);
    this.construire();
  }

  /* la mise en place, en pixels de la couche : la lettre (L), l'enveloppe (E), la boîte (B) */
  disposer() {
    const { W, H } = this, tel = this.o.telephone !== undefined ? this.o.telephone : (innerWidth < 600);
    let Lw = clamp((tel ? .52 : .34) * W, 110, 240); Lw = Math.min(Lw, .86 * H / 1.68, .9 * W);
    const Lh = 1.41 * Lw, ew = 1.1 * Lw, eh = .62 * ew;
    const cx = (tel ? .4 : .41) * W, haut = Math.max(8, (H - 1.68 * Lw) * .62);
    const L = { x: cx - Lw / 2, y: haut, w: Lw, h: Lh, cx, cy: haut + Lh / 2 };
    const ey = L.y + 2 * Lh / 3 + .05 * Lw, E = { x: cx - ew / 2, y: ey, w: ew, h: eh, cx, cy: ey + eh / 2 };
    const hs = Math.max(56, Math.min(.36 * H, (tel ? .44 : .38) * W, 290));
    const [x0, y0, x1, y1] = BOITE.silhouette, iH = hs / (y1 - y0), iW = iH * BOITE.taille[0] / BOITE.taille[1];
    const silD = W - .05 * W, silH = Math.max(6, .06 * H);
    const B = { x: silD - x1 * iW, y: silH - y0 * iH, iW, iH, hs };
    B.pied = [B.x + BOITE.pied[0] * iW, B.y + BOITE.pied[1] * iH];
    return { L, E, B, tel };
  }

  construire() {
    const { W, H } = this, P = this.P = this.disposer(), { L, E, B } = P, id = this.id = 'lt' + Math.random().toString(36).slice(2, 8);
    const ep = clamp(L.w / 150, .65, 1.1), s = (base, phase, graine, o = {}) => { const r = Object.assign({}, base, { phase, graine }, o); r.wMin *= ep; r.wMax *= ep; return r; };
    const couche = this.couche;
    /* 1. le sol : le petit chemin qui converge vers le pied de la boîte, quelques touffes (derrière tout) */
    const sol = el('svg', { width: f1(W), height: f1(H), viewBox: `0 0 ${f1(W)} ${f1(H)}`, 'aria-hidden': 'true', focusable: 'false' });
    couche.appendChild(enLigne(sol));
    const Dk = this.Dk = new Dessin(sol, ENCRE_PLUME), [px, py] = B.pied, k = B.hs / 200;
    /* le chemin part de sous l'enveloppe (le bas de la feuille au plus) et converge vers le pied de la boîte ; tracé depuis
       le pied, une fois la boîte apparue */
    const { E: E0, L: L0 } = P, yP = Math.min(H + 6, E0.y + E0.h + .5 * L0.w), xG = Math.max(.02 * W, E0.x - .3 * L0.w), xD = E0.x + .8 * E0.w;
    const pG = [px - 26 * k, py + 2], pD = [px + 14 * k, py + 3];
    Dk.trait(catmull([pG, [lerp(xG, pG[0], .5) - 4, lerp(yP, pG[1], .5) + 4], [xG, yP]], 8), s(FIN, 'k', 401, { op: .62, wMax: 1.25 }));
    Dk.trait(catmull([pD, [lerp(xD, pD[0], .5) + 6, lerp(yP, pD[1], .5) + 2], [xD, yP]], 8), s(FIN, 'k', 403, { op: .62, wMax: 1.25 }));
    [[xG, pG, -1], [xD, pD, 1]].forEach(([x0, p1, sg], n) => [.3, .62].forEach((q, i) => {
      const x = lerp(x0, p1[0], q) + sg * 6, y = lerp(yP - 2, p1[1], q), h = (1 - q * .6) * 16 * clamp(k, .6, 1.4);
      for (let j = -1; j <= 1; j++) Dk.trait([[x + j * 3, y], [x + j * 6 + 1, y - (j ? .7 : 1) * h]], s(FIN, 'k', 430 + n * 10 + i * 3 + j, { wMax: .9, levee: 2, op: .7 }));
    }));
    Dk.monter();
    /* 2. la boîte : l'image si elle est là au moment voulu, sinon la boîte dessinée ; la petite enveloppe cachée */
    this.B = B; this.boite = null;
    /* 3. la feuille, la lettre, l'enveloppe, le cachet */
    const svg = this.svg = el('svg', { width: f1(W), height: f1(H), viewBox: `0 0 ${f1(W)} ${f1(H)}`, 'aria-hidden': 'true', focusable: 'false' });
    couche.appendChild(enLigne(svg));
    const defs = el('defs', {}, svg);
    /* le grand contour de la feuille (la carte devenue feuille), tracé à la plume */
    const R0 = Math.max(4, (this.rayons[0] + this.rayons[1]) / 2 - 4), m = 7;
    const gEnv = this.gEnv = el('g', {}, svg);
    const gRabat = el('g', {}, gEnv), gLettre = this.gLettre = el('g', {}, gEnv), gPoche = el('g', {}, gEnv), gCachet = el('g', {}, gEnv);
    /* la face de la lettre : le papier (qui se réduit), le contour de la lettre, l'écriture */
    const gFace = this.gFace = el('g', { id: id + '-face' }, gLettre);
    this.papier = el('rect', { x: 0, y: 0, width: f1(W), height: f1(H), rx: f1(R0), fill: PAPIER }, gFace);
    const gG = this.gG = el('g', {}, gFace), Dg = this.Dg = new Dessin(gG, ENCRE_PLUME);
    formeMain(Dg, perimetre(m, m, W - 2 * m, H - 2 * m, R0), { ...GROS, phase: 'a', graine: 11, reprise: true });
    Dg.monter();
    const gBL = this.gBL = el('g', { opacity: '0' }, gFace), Dl = new Dessin(gBL, ENCRE_PLUME);
    formeMain(Dl, perimetre(L.x + 2, L.y + 2, L.w - 4, L.h - 4, 2.5), s(GROS, 'l', 12, { wMax: 2.2 }));
    Dl.monter(); Dl.rendre({ l: 1 });
    /* les saisies d'origine, par-dessus le papier : elles s'effacent champ par champ quand l'écriture arrive */
    const gSaisies = el('g', {}, gFace);
    this.saisies.forEach((sa, j) => {
      const g = sa.g = el('g', {}, gSaisies), cp = el('clipPath', { id: `${id}-s${j}`, clipPathUnits: 'userSpaceOnUse' }, defs);
      el('rect', { x: f1(sa.x), y: f1(sa.y), width: f1(sa.w), height: f1(sa.h), rx: f1(sa.rx) }, cp);
      const transparent = !sa.fond || sa.fond === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(sa.fond);
      el('rect', { x: f1(sa.x + sa.bw / 2), y: f1(sa.y + sa.bw / 2), width: f1(sa.w - sa.bw), height: f1(sa.h - sa.bw), rx: f1(Math.max(0, sa.rx - sa.bw / 2)), fill: transparent ? 'none' : sa.fond, stroke: sa.bw ? sa.bord : 'none', 'stroke-width': f1(sa.bw) }, g);
      const gt = el('g', { 'clip-path': `url(#${id}-s${j})` }, g);
      sa.typees.forEach(l => { const tx = el('text', { x: f1(l.x), y: f1(l.y), fill: sa.couleur }, gt); tx.style.font = sa.fonte; tx.textContent = l.t; });
      sa.o = -1;
    });
    const gEcrit = this.gEcrit = el('g', {}, gFace);
    this.ecrits = this.lignes.map((l, i) => {
      const cp = el('clipPath', { id: `${id}-c${i}`, clipPathUnits: 'userSpaceOnUse' }, defs);
      const w = mesurer(l.t, l.fs) + 6, rc = el('rect', { x: f1(l.x - 3), y: f1(l.y - 1.1 * l.fs), width: 0, height: f1(1.6 * l.fs) }, cp);
      const tx = el('text', { x: f1(l.x), y: f1(l.y), fill: ENCRE_PLUME, 'fill-opacity': '.93', 'clip-path': `url(#${id}-c${i})` }, gEcrit);
      tx.style.font = `500 ${f1(l.fs)}px ${POLICE}`; tx.textContent = l.t;
      return { rc, w, q: -1 };
    });
    /* la réduction : le papier va du rectangle de la couche à celui de la lettre ; l'écriture se réduit d'un bloc */
    this.k = Math.min(L.w / W, L.h / H) * .92;
    /* les trois bandes de la lettre pliée (la face par <use>, découpée), le revers en papier nu */
    const bande = (parent, y0, hb, n, yDos) => {
      const c = el('clipPath', { id: `${id}-b${n}`, clipPathUnits: 'userSpaceOnUse' }, defs);
      el('rect', { x: f1(L.x - 8), y: f1(y0), width: f1(L.w + 16), height: f1(hb) }, c);
      const g = el('g', {}, parent), use = el('use', { href: `#${id}-face`, 'clip-path': `url(#${id}-b${n})` }, g);
      use.setAttributeNS(XL, 'xlink:href', `#${id}-face`);
      const dos = el('rect', { x: f1(L.x + .5), y: f1(yDos), width: f1(L.w - 1), height: f1(L.h / 3), fill: PAPIER, stroke: ENCRE_PLUME, 'stroke-opacity': '.5', 'stroke-width': f1(1.1 * ep), rx: 2 }, g);
      dos.style.display = 'none';
      return { g, face(v) { use.style.display = v ? '' : 'none'; dos.style.display = v ? 'none' : ''; } };
    };
    const gBandes = this.gBandes = el('g', {}, gLettre); gBandes.style.display = 'none';
    this.bM = bande(gBandes, L.y + L.h / 3, L.h / 3, 2, L.y + L.h / 3);
    this.bB = bande(gBandes, L.y + 2 * L.h / 3, L.h / 3 + 8, 3, L.y + 2 * L.h / 3);
    this.bT = bande(gBandes, L.y - 8, L.h / 3 + 8, 1, L.y);
    /* l'enveloppe : le rabat ouvert derrière la lettre, la poche devant, ses deux diagonales */
    const rh = .56 * E.h, tri = [[E.x, E.y], [E.cx, E.y - rh], [E.x + E.w, E.y]];
    this.rabatFond = el('polygon', { points: tri.map(p => p.map(f1).join(',')).join(' '), fill: PAPIER }, gRabat); this.rabatFond.style.display = 'none';
    const gRabatDos = this.gRabatDos = el('g', {}, gRabat), Dh = new Dessin(gRabatDos, ENCRE_PLUME);
    hachures(Dh, tri, { phase: 'h', angle: -28, pas: 3.2, long: [6, 12], op: .3, wMax: 1.1 * ep, graine: 83 });
    const Dr = this.Dr = new Dessin(gRabat, ENCRE_PLUME); Dr.trait(tri, s(DET, 'r', 81));
    this.poche = el('rect', { x: f1(E.x), y: f1(E.y), width: f1(E.w), height: f1(E.h), fill: PAPIER }, gPoche); this.poche.style.display = 'none';
    const De = this.De = new Dessin(gPoche, ENCRE_PLUME);
    formeMain(De, perimetre(E.x, E.y, E.w, E.h, 2.5), s(DET, 'e', 71));
    De.trait([[E.x + 2, E.y + E.h - 2], [E.cx, E.y + .46 * E.h]], s(FIN, 'e', 73, { op: .5 })); De.trait([[E.x + E.w - 2, E.y + E.h - 2], [E.cx, E.y + .46 * E.h]], s(FIN, 'e', 74, { op: .5 }));
    [Dh, Dr, De].forEach(D => D.monter()); Dh.rendre({ h: 1 });
    this.gRabat = gRabat; this.rh = rh;
    /* le cachet : l'empreinte (anneau fin, sigle, encre à .8) et le tampon qui la pose */
    const rq = .13 * E.w, cq = this.cq = [E.cx, E.y + rh - .02 * E.w];
    const empreinte = (parent, epais, graine) => {
      const g = el('g', {}, parent), D = new Dessin(g, ENCRE_PLUME);
      formeMain(D, arcE(0, 0, rq, rq * .97, 0, Math.PI * 2), { wMin: .45 * epais, wMax: 1.25 * epais, tremble: .35, op: .95, phase: 'q', graine });
      D.monter(); D.rendre({ q: 1 });
      const gs = el('g', { transform: `rotate(-6) scale(${(1.5 * rq / 66).toFixed(4)}) translate(-38 -31)`, fill: ENCRE_PLUME }, g);
      SIGLE.forEach(p => el('path', { d: p }, gs));
      return g;
    };
    this.gEmpreinte = el('g', { transform: `translate(${f1(cq[0])} ${f1(cq[1])})`, opacity: '0' }, gCachet); empreinte(this.gEmpreinte, ep, 91);
    this.gTampon = el('g', { opacity: '0' }, gCachet);
    el('circle', { r: f1(rq * 1.12), fill: PAPIER }, this.gTampon);
    const t2 = empreinte(this.gTampon, ep * 1.6, 95); t2.setAttribute('opacity', '.95');
    /* le trajet vers la fente : l'enveloppe se réduit à la largeur de la fente (calculé quand la boîte est posée) */
    this.plie = null; this.rabatDevant = null; this.cache = false; this.dernierT = -1; this.dernierU = -1;
  }

  /* la boîte, posée au moment de son apparition : l'image si elle est arrivée, sinon le dessin */
  poserBoite() {
    if (this.boite) return;
    const B = this.B, bx = fabriquerBoite(B.hs, { enveloppe: null, phase: 0 });
    bx.el.style.transform = `translate(${f1(B.x)}px,${f1(B.y)}px)`; bx.el.style.opacity = '0';
    this.couche.insertBefore(bx.el, this.svg);
    this.boite = bx;
    /* la petite enveloppe à m = 0, en pixels de la couche : la fin du vol */
    const E = this.P.E;
    this.vise = { cx: B.x + bx.envCentre[0], cy: B.y + bx.envCentre[1], k: bx.envLargeur / E.w, rot: bx.pente };
  }

  /* le formulaire dessous : caché (visibility) quand la couche est opaque, rendu sinon ; inert pendant toute la scène */
  masquer(v) {
    if (this.apercu || v === this.cache) return;
    this.cache = v;
    if (v) {
      this.enfants = Array.from(this.carte.children).map(e => ({ e, vis: e.style.visibility }));
      this.enfants.forEach(({ e }) => { e.style.visibility = 'hidden'; });
    } else if (this.enfants) { this.enfants.forEach(({ e, vis }) => { e.style.visibility = vis; }); this.enfants = null; }
  }
  inerte(v) {
    if (this.apercu || !!v === !!this.inertePose) return;   /* une seule pose, un seul retrait : une scène finie ne touche plus au formulaire */
    this.inertePose = !!v;
    const c = this.carte, f = this.form && this.form !== c && !c.contains(this.form) ? this.form : null;
    [c, f].forEach(x => { if (!x) return; if (v) { x.setAttribute('inert', ''); x.style.pointerEvents = 'none'; } else { x.removeAttribute('inert'); x.style.pointerEvents = ''; } });
  }

  /* l'instant t du calendrier d'avant la réponse (0 à ATTENTE) */
  rendre(t) {
    if (t === this.dernierT) return; this.dernierT = t;
    const { W, H } = this, { L, E } = this.P;
    this.couche.style.opacity = t >= FONDU[1] ? '' : eEntree(pr(t, FONDU)).toFixed(3);
    this.masquer(t >= FONDU[1]);
    this.Dg.rendre({ a: eEntree(pr(t, CONTOUR)) });
    /* l'écriture, ligne après ligne */
    const n = this.ecrits.length, dl = n > 1 ? Math.min(80, (ECRIT[1] - ECRIT[0] - 260) / (n - 1)) : 0;
    this.ecrits.forEach((e, i) => {
      const q = eEntree(clamp((t - ECRIT[0] - i * dl) / 260));
      if (q !== e.q) { e.q = q; e.rc.setAttribute('width', f1(e.w * q)); }
    });
    this.saisies.forEach(sa => {
      const i0 = this.lignes.findIndex(l => l.champ === sa.k), debut = i0 < 0 ? FONDU[1] - 120 : ECRIT[0] + i0 * dl;
      const o = 1 - eEntree(clamp((t - debut - 20) / 220));
      if (o !== sa.o) { sa.o = o; sa.g.setAttribute('opacity', o.toFixed(3)); sa.g.style.display = o <= 0 ? 'none' : ''; }
    });
    /* la réduction : le papier, le grand contour (qui s'efface), le contour de la lettre (qui vient), l'écriture */
    const e = eDepl(pr(t, REDUIT));
    const x = lerp(0, L.x, e), y = lerp(0, L.y, e), w = lerp(W, L.w, e), h = lerp(H, L.h, e);
    const p = this.papier; p.setAttribute('x', f1(x)); p.setAttribute('y', f1(y)); p.setAttribute('width', f1(w)); p.setAttribute('height', f1(h));
    p.setAttribute('rx', f1(lerp(Math.max(4, (this.rayons[0] + this.rayons[1]) / 2 - 4), 2, e)));
    const sx = w / W, sy = h / H;
    this.gG.setAttribute('transform', e > 0 ? `matrix(${sx.toFixed(4)} 0 0 ${sy.toFixed(4)} ${f1(x)} ${f1(y)})` : '');
    this.gG.setAttribute('opacity', (1 - clamp((e - .25) / .5)).toFixed(3));
    const lx = w / L.w, ly = h / L.h;
    this.gBL.setAttribute('transform', e < 1 ? `matrix(${lx.toFixed(4)} 0 0 ${ly.toFixed(4)} ${f1(x - L.x * lx)} ${f1(y - L.y * ly)})` : '');
    this.gBL.setAttribute('opacity', clamp((e - .4) / .45).toFixed(3));
    const ke = lerp(1, this.k, e);
    this.gEcrit.setAttribute('transform', e > 0 ? `translate(${f1(lerp(W / 2, L.cx, e))} ${f1(lerp(H / 2, L.cy, e))}) scale(${ke.toFixed(4)}) translate(${f1(-W / 2)} ${f1(-H / 2)})` : '');
    /* les plis : la bande du bas monte sur celle du milieu, puis celle du haut descend sur les deux */
    const plie = t >= PLI1[0];
    if (plie !== this.plie) { this.plie = plie; const defs = this.svg.querySelector('defs'); if (plie) { defs.appendChild(this.gFace); this.gBandes.style.display = ''; } else { this.gLettre.insertBefore(this.gFace, this.gBandes); this.gBandes.style.display = 'none'; } }
    const s1 = Math.cos(Math.PI * eDepl(pr(t, PLI1))), s2 = Math.cos(Math.PI * eDepl(pr(t, PLI2)));
    this.bB.g.setAttribute('transform', pivot(L.y + 2 * L.h / 3, s1)); this.bB.face(s1 >= 0);
    this.bT.g.setAttribute('transform', pivot(L.y + L.h / 3, s2)); this.bT.face(s2 >= 0);
    /* le décor et la boîte */
    this.Dk.rendre({ k: pr(t, DECOR) });
    if (t >= BOITE_T[0]) this.poserBoite();
    if (this.boite) { const q = eEntree(pr(t, BOITE_T)); this.boite.el.style.opacity = q >= 1 ? '' : q.toFixed(3); this.boite.dessin(q); }
    /* l'enveloppe se dessine, le rabat s'ouvre derrière, la lettre glisse dedans, le rabat se ferme seul */
    this.De.rendre({ e: pr(t, ENV) }); this.Dr.rendre({ r: pr(t, RABAT) });
    this.poche.style.display = t >= ENV[0] + 40 ? '' : 'none'; this.rabatFond.style.display = t >= RABAT[0] + 30 ? '' : 'none';
    const g = eDepl(pr(t, GLISSE)), DY = (E.y + E.h - 3) - (L.y + 2 * L.h / 3);
    this.gLettre.setAttribute('transform', g > 0 ? `translate(0 ${f1(DY * g)})` : '');
    const sr = Math.cos(Math.PI * eDepl(pr(t, FERME)));
    this.gRabat.setAttribute('transform', pivot(E.y, sr)); this.gRabatDos.style.display = sr < 0 ? '' : 'none';
    if ((sr < 0) !== this.rabatDevant) { this.rabatDevant = sr < 0; this.gEnv.insertBefore(this.gRabat, this.rabatDevant ? this.gPocheSuivant() : this.gLettre); }
  }
  gPocheSuivant() { return this.gEnv.lastChild; }   /* le cachet, dernier groupe : le rabat fermé passe juste avant lui */

  /* l'instant u après la réponse acceptée (0 à POSTE) : le cachet, le vol, la fente, le recul */
  rendrePost(u) {
    if (u === this.dernierU) return; this.dernierU = u;
    this.rendre(ATTENTE);
    const [cx, cy] = this.cq;
    /* le tampon descend (plus grand, plus haut), presse, remonte et s'efface ; l'empreinte reste */
    const a = eEntree(pr(u, DESCEND)), pz = pr(u, PRESSE), b = eDepl(pr(u, REMONTE)), rq = .13 * this.P.E.w;
    let ech = lerp(1.38, 1, a), ty = lerp(-.55 * rq, 0, a), op = a;
    if (pz > 0 && pz < 1) ech = 1 - .04 * Math.sin(Math.PI * pz);
    if (b > 0) { ech = lerp(1, 1.22, b); ty = lerp(0, -.45 * rq, b); op = 1 - b; }
    this.gTampon.setAttribute('transform', `translate(${f1(cx)} ${f1(cy + ty)}) scale(${ech.toFixed(3)})`);
    this.gTampon.setAttribute('opacity', u >= REMONTE[1] ? '0' : op.toFixed(3));
    this.gEmpreinte.setAttribute('opacity', u >= PRESSE[0] ? '.8' : '0');
    /* le vol : courbe quadratique vers la fente, légère rotation, l'enveloppe se réduit à la largeur de la fente */
    const v = this.vise, E = this.P.E, q = eDepl(pr(u, VOL));
    if (!v) return;
    if (q > 0 && u < ENTRE[0]) {
      const c0 = [E.cx, E.cy], c1 = [v.cx, v.cy], cc = [lerp(c0[0], c1[0], .4), Math.min(c0[1], c1[1]) - .16 * this.H];
      const bx = (1 - q) * (1 - q) * c0[0] + 2 * (1 - q) * q * cc[0] + q * q * c1[0], by = (1 - q) * (1 - q) * c0[1] + 2 * (1 - q) * q * cc[1] + q * q * c1[1];
      const rot = -10 * Math.sin(Math.PI * q) + v.rot * q, k = lerp(1, v.k, eEntree(q));
      this.svg.style.transformOrigin = `${f1(c0[0])}px ${f1(c0[1])}px`;
      this.svg.style.transform = `translate(${f1(bx - c0[0])}px,${f1(by - c0[1])}px) rotate(${rot.toFixed(2)}deg) scale(${k.toFixed(4)})`;
      this.svg.style.willChange = 'transform'; this.svg.style.visibility = '';
    } else if (u < VOL[0]) { this.svg.style.transform = ''; this.svg.style.visibility = ''; }
    /* la fente : la petite enveloppe de la boîte prend le relais, au même point, et entre derrière la lèvre */
    if (u >= ENTRE[0]) { this.svg.style.visibility = 'hidden'; this.svg.style.willChange = ''; this.boite.enveloppe(true, eEntree(pr(u, ENTRE))); }
    else this.boite.enveloppe(false, 0);
    /* un rien de recul de la boîte */
    const rc = Math.sin(Math.PI * pr(u, RECUL)), B = this.B;
    this.boite.el.style.transform = `translate(${f1(B.x + 1.2 * rc)}px,${f1(B.y - .8 * rc)}px)` + (rc > 0 ? ` scale(${(1 - .012 * rc).toFixed(4)})` : '');
  }

  poser() {
    document.body.appendChild(this.couche);
    this.inerte(true);
    this.surDefil = () => { this.dy = scrollY - this.sy0; };
    addEventListener('scroll', this.surDefil, { passive: true });
  }
  suivre() { const d = Math.round(this.dy * 10) / 10; if (d !== this.dyPose) { this.dyPose = d; this.couche.style.transform = d ? `translate3d(0,${-d}px,0)` : ''; } }

  /* la lecture : etat() rend null tant que la réponse n'est pas là, puis vrai ou faux ; rend vrai (la couche attend
     le départ), faux (le formulaire est revenu) ou null (coupée, ou erreur : tout est retiré) */
  derouler(etat) {
    return new Promise(fin => {
      let t = 0, u = 0, avant = performance.now(), issue = null, images = 0, tenue = 0;
      const debut = avant;
      const stats = r => { const ms = performance.now() - debut - tenue; window.__lettreStats = { images, duree: Math.round(performance.now() - debut), tenue: Math.round(tenue), ips: ms > 0 ? Math.round(images * 10000 / ms) / 10 : 0, issue: r }; };
      const pas = now => {
        try {
          if (this.coupe) { stats(null); fin(null); return; }
          const dt = Math.min(100, Math.max(0, now - avant)); avant = now;   /* le temps réel jusqu'à 10 images par seconde ; au-delà (onglet caché), la scène ralentit au lieu de sauter */
          if (issue === null) { const r = etat(); if (r === false || (r === true && t >= ATTENTE)) issue = r; }
          this.suivre();
          if (issue === null) {
            if (t >= ATTENTE) { tenue += dt; requestAnimationFrame(pas); return; }
            t = Math.min(ATTENTE, t + dt); this.rendre(t);
          } else if (issue) {
            u = Math.min(POSTE, u + dt); this.rendrePost(u);
            if (u >= POSTE) { images++; stats(true); this.tenir(); this.masquer(false); this.inerte(false); fin(true); return; }
          } else {
            t = Math.max(0, t - dt * (t < 320 ? 1 : RETOUR)); this.rendre(t);
            if (t <= 0) { images++; stats(false); this.defaire(); fin(false); return; }
          }
          images++;
          requestAnimationFrame(pas);
        } catch (e) { stats(null); try { this.defaire(); } catch (e2) { /* rien */ } fin(null); }
      };
      requestAnimationFrame(pas);
    });
  }

  /* la hauteur tenue jusqu'au départ : la page change sous la couche sans sauter */
  tenir() {
    if (this.apercu) return;
    const e = this.o.tenir || this.carte; if (!e || !e.isConnected) return;
    const h = e.offsetHeight, st = e.style;
    this.tenu = { e, h, avant: { height: st.height, overflow: st.overflow, overflowAnchor: st.overflowAnchor, boxSizing: st.boxSizing } };
    st.boxSizing = 'border-box'; st.height = h + 'px'; st.overflow = 'hidden'; st.overflowAnchor = 'none';
  }
  lacher() { if (!this.tenu) return; Object.assign(this.tenu.e.style, this.tenu.avant); this.tenu = null; }

  /* tout retirer, tout rendre (coupure, erreur, échec) */
  defaire() {
    this.coupe = true;
    if (this.surDefil) removeEventListener('scroll', this.surDefil);
    try { this.masquer(false); } catch (e) { /* rien */ }
    this.inerte(false); this.lacher();
    if (this.vol) this.vol.remove();
    if (this.vig) { this.vig.style.visibility = ''; this.vig = null; }
    if (enDepart === this) enDepart = null;
    this.couche.remove();
    if (this.html !== null && this.html !== undefined) { document.documentElement.style.scrollBehavior = this.html; this.html = null; }
    clearTimeout(this.minuteur);
  }

  /* le départ (après le remerciement) : la page passe à sa forme finale sous la couche (hauteur tenue relâchée en
     DEPART ms, défilement jusqu'au remerciement s'il le faut), la couche se réduit à la carte finale et s'efface, la
     boîte vole se poser en vignette. bloc : le remerciement (ou null), v : la vignette posée (ou null) */
  partir(bloc, v) {
    if (this.coupe) return;
    clearTimeout(this.minuteur);
    const vh = innerHeight, de = document.documentElement;
    /* les mesures, une fois : la hauteur finale, les rectangles finaux, la cible du défilement */
    let H0 = 0, hF = 0;
    if (this.tenu) { const e = this.tenu.e; H0 = this.tenu.h; e.style.height = ''; hF = e.offsetHeight; e.style.height = H0 + 'px'; }
    const sy0 = scrollY;
    const carteVue = this.carte.isConnected && this.carte.offsetHeight > 0 && (!bloc || this.carte.contains(bloc));
    let cible = carteVue ? this.carte.getBoundingClientRect() : (bloc && bloc.offsetHeight ? bloc.getBoundingClientRect() : null);
    if (cible) cible = { left: cible.left, top: cible.top, width: cible.width, height: (this.tenu && this.tenu.e === this.carte && carteVue) ? Math.max(0, cible.height - (H0 - hF)) : cible.height };
    const rb = bloc && bloc.offsetHeight ? bloc.getBoundingClientRect() : null, rv = v ? v.getBoundingClientRect() : null;
    let dS = 0;
    if (rb) {
      const pad = parseFloat(getComputedStyle(de).scrollPaddingTop) || 0;
      if (rb.bottom > vh - 20) dS = rb.bottom - (vh - 20);
      if (rb.top - dS < pad + 8) dS = rb.top - pad - 8;
      const max = Math.max(0, de.scrollHeight - (H0 - hF) - vh);
      dS = clamp(sy0 + dS, 0, max) - sy0;
    }
    if (this.html === null) this.html = de.style.scrollBehavior; de.style.scrollBehavior = 'auto';
    window.scrollTo(0, sy0);   /* arrête un défilement doux en cours (le focus du remerciement) */
    /* la boîte quitte la couche pour voler seule, au pixel près */
    const r0 = this.rect, B = this.B, bx = this.boite, dyc = sy0 - this.sy0;
    let src = null;
    if (bx && rv && rv.height) {
      const vol = this.vol = div('lettre-vol'); vol.setAttribute('aria-hidden', 'true');
      vol.style.cssText = 'position:fixed;left:0;top:0;z-index:60;overflow:visible;pointer-events:none;transform-origin:0 0;margin:0;padding:0;display:block';
      const bl = parseFloat(this.couche.style.borderLeftWidth) || 0, bt = parseFloat(this.couche.style.borderTopWidth) || 0;
      src = { x: r0.left + bl + B.x + bx.silX, y: r0.top + bt + B.y + bx.silY - dyc, h: bx.hs };
      vol.style.transform = `translate(${f1(src.x - bx.silX)}px,${f1(src.y - bx.silY)}px)`;
      bx.el.style.transform = ''; vol.appendChild(bx.el); document.body.appendChild(vol);
      vol.style.willChange = 'transform';
      if (v) { v.style.visibility = 'hidden'; this.vig = v; }
    }
    const t0 = performance.now(), couche = this.couche;
    enDepart = this;
    const pas = now => {
      try {
        if (this.coupe) return;
        const q = clamp((now - t0) / DEPART), e = eDepl(q), dsc = dS * e;
        if (this.tenu) this.tenu.e.style.height = lerp(H0, hF, e).toFixed(1) + 'px';
        if (dS) window.scrollTo(0, sy0 + dsc);
        /* la couche suit la page, se réduit à la carte finale (découpe), puis s'efface */
        couche.style.transform = `translate3d(0,${f1(-(dyc + dsc))}px,0)`;
        if (cible) {
          const it = lerp(0, Math.max(0, cible.top - (r0.top - dyc)), e), ib = lerp(0, Math.max(0, (r0.top - dyc + r0.height) - (cible.top + cible.height)), e);
          const il = lerp(0, Math.max(0, cible.left - r0.left), e), ir = lerp(0, Math.max(0, r0.left + r0.width - (cible.left + cible.width)), e);
          couche.style.clipPath = couche.style.webkitClipPath = `inset(${f1(it)}px ${f1(ir)}px ${f1(ib)}px ${f1(il)}px round ${f1(this.rayons[0])}px)`;
        }
        couche.style.opacity = (1 - eEntree(clamp((q - .35) / .65))).toFixed(3);
        if (src && this.vol) {
          const k = lerp(1, rv.height / src.h, e), x = lerp(src.x, rv.left, e), y = lerp(src.y, rv.top - dsc, e);
          this.vol.style.transform = `translate(${f1(x)}px,${f1(y)}px) scale(${k.toFixed(4)}) translate(${f1(-bx.silX)}px,${f1(-bx.silY)}px)`;
        }
        if (q >= 1) { if (v) v.style.visibility = ''; this.defaire(); return; }
        requestAnimationFrame(pas);
      } catch (e) { if (v) v.style.visibility = ''; this.defaire(); }
    };
    requestAnimationFrame(pas);
  }

  /* un instant figé (curseur de la démo, captures) : t de 0 à FIN_T sur le calendrier de la réussite */
  figer(t) {
    t = clamp(t, 0, FIN_T);
    if (t <= ATTENTE) { this.dernierU = -1; this.svg.style.transform = ''; this.svg.style.visibility = ''; if (this.boite) this.boite.enveloppe(false, 0); this.gTampon.setAttribute('opacity', '0'); this.gEmpreinte.setAttribute('opacity', '0'); this.rendre(t); }
    else this.rendrePost(t - ATTENTE);
    if (t <= ATTENTE && this.boite) this.boite.el.style.transform = `translate(${f1(this.B.x)}px,${f1(this.B.y)}px)`;
  }
}

/* ---------- l'API ---------- */
function choisirCarte(form, o) {
  if (o.carte) return o.carte;
  const c = (form && form.closest('.pas, .contact__formu, .ci-form')) || form;
  if (!c) return null;
  /* le Conseil sur téléphone (relecture) : l'envoi part sous la fiche ; si la carte est presque hors de la vue,
     c'est la fiche visible qui se transforme */
  const r = c.getBoundingClientRect(), vis = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
  if (vis < Math.min(200, r.height * .5)) {
    const f = document.querySelector('.fiche-zone.complete .fiche, .fiche-zone.complete [data-fiche]');
    if (f) { const q = f.getBoundingClientRect(); if (Math.min(q.bottom, innerHeight) - Math.max(q.top, 0) > vis) return f; }
  }
  return c;
}

export async function jouer(form, promesse, o = {}) {
  let ok = null;
  const attendue = Promise.resolve(promesse).then(v => !!v, () => false).then(v => (ok = v));
  const annule = () => { try { return !!(o.annule && o.annule()); } catch (e) { return true; } };
  if (reduit() || annule()) return attendue;
  let sc = null;
  try {
    poserStyle(); chargerBoite();
    await Promise.race([police, dort(300)]);
    if (annule()) return attendue;
    couper();
    const carte = choisirCarte(form, o); if (!carte) return attendue;
    sc = new Scene(carte, form, o);   /* entièrement construite hors de la page */
    if (annule()) return attendue;
    enCours = sc; sc.poser();
    /* le signal de démarrage (pages.js, marianne.js) : la scène est dans la page, le délai de garde se prolonge */
    try { if (o.demarre) o.demarre(); } catch (e) { /* rien */ }
    const issue = await sc.derouler(() => ok);
    if (enCours === sc) enCours = null;
    if (issue === true) {
      enAttente = sc;
      sc.minuteur = setTimeout(() => { try { if (enAttente === sc) { enAttente = null; sc.partir(sc.bloc && sc.bloc.isConnected && !sc.bloc.hidden ? sc.bloc : null, null); } } catch (e) { try { sc.defaire(); } catch (e2) { /* rien */ } } }, 1500);
    }
  } catch (e) { if (sc) try { sc.defaire(); } catch (e2) { /* rien */ } if (enCours === sc) enCours = null; }
  return attendue;
}

export function couper() {
  try {
    if (enCours) { enCours.coupe = true; enCours.defaire(); enCours = null; }
    if (enAttente) { enAttente.defaire(); enAttente = null; }
    if (enDepart) { enDepart.defaire(); enDepart = null; }
  } catch (e) { /* rien */ }
}

/* la vignette finale : la boîte et le coin de l'enveloppe, 72 px de haut, à gauche du remerciement */
function fabriquerVignette(haut = 72) {
  const bx = fabriquerBoite(haut, { enveloppe: 1, choix: 'attendre' });
  const v = document.createElement('span'); v.className = 'lettre-vignette'; v.setAttribute('aria-hidden', 'true');
  v.style.cssText = `float:left;position:relative;overflow:hidden;width:${Math.ceil(bx.silW)}px;height:${haut}px;margin:0 22px 4px 0;line-height:0;pointer-events:none`;
  bx.el.style.position = 'absolute'; bx.el.style.transform = `translate(${f1(-bx.silX)}px,${f1(-bx.silY)}px)`;
  v.appendChild(bx.el);
  return v;
}

export function vignette(bloc) {
  const sc = enAttente; enAttente = null;
  try {
    if (!bloc && sc) bloc = sc.bloc && sc.bloc.isConnected ? sc.bloc : null;   /* le bloc d'état mémorisé par la scène */
    if (!bloc) { if (sc) sc.partir(null, null); return; }
    poserStyle();
    const ancienne = bloc.querySelector(':scope > .lettre-vignette'); if (ancienne) ancienne.remove();
    const v = fabriquerVignette(); bloc.prepend(v); bloc.classList.add('lettre-pose');
    if (!sc) {
      /* sans scène (mouvement réduit) : le remerciement reste visible si la page change encore après lui (étapes cachées) */
      requestAnimationFrame(() => { try { const r = bloc.getBoundingClientRect(); if (r.height && (r.bottom > innerHeight || r.top < 0)) { const de = document.documentElement, av = de.style.scrollBehavior; de.style.scrollBehavior = 'auto'; bloc.scrollIntoView({ block: 'nearest' }); de.style.scrollBehavior = av; } } catch (e) { /* rien */ } });
      return;
    }
    if (reduit()) { sc.defaire(); return; }
    clearTimeout(sc.minuteur);
    /* le départ à l'image suivante : la page a pris sa forme finale (remerciement écrit, étapes cachées) */
    requestAnimationFrame(() => { try { sc.partir(bloc, v); } catch (e) { v.style.visibility = ''; sc.defaire(); } });
  } catch (e) { if (sc) try { sc.defaire(); } catch (e2) { /* rien */ } }
}

/* pour la page de démonstration : la scène d'une carte, figée à l'instant voulu (fraction 0 à 1 du calendrier de la
   réussite), posée dans parent sans toucher au formulaire ; o.carte (obligatoire), o.champs, o.telephone */
export function apercu(parent, o = {}) {
  poserStyle(); chargerBoite();
  const sc = new Scene(o.carte, o.form || null, Object.assign({}, o, { apercu: true }));
  sc.couche.style.opacity = ''; parent.appendChild(sc.couche);
  return { figer: f => { sc.figer(clamp(f) * FIN_T); sc.couche.style.opacity = ''; }, retirer: () => sc.couche.remove(), scene: sc };
}
