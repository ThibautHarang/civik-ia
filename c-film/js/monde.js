/* =====================================================================
   Le monde de la marche (repris de la maquette A, plans 2 à 5) : une vraie
   scène en perspective, en mètres. Chemin qui serpente puis se divise,
   cyprès, vignes, muret, bornes : des images gravées posées en profondeur
   (réelles ou provisoires), un sol de chemin tracé au burin.
   Les objets réels (le poteau et sa planche, la façade de l'atelier) sont
   des éléments HTML épinglés par homographie entre trois canevas.
   ===================================================================== */
import { clamp, lerp, seg, ss, sseg, eDepl, rng, hash, quadVersQuad, appl, m3d, epingle, setT, setO, setV, el, mult3, inv3, arrondiDistance } from './outils.js';
import { rafale } from './papier.js';
import { reperesPx, logoMasque, chargerLogo, logoMasqueEtapes } from './visuels.js';
import { creerFacade } from './facade.js';
import { CAL, caladeEtapes, caladeTuileEtapes } from './calade.js';
import { creerSolGL, creerSolGLEtapes } from './sol.js';
import { flecheGravee, flecheGraveeCanvas, flecheGraveeEtapes } from './fleches.js';
import { creerOiseau } from './oiseau.js';
import { creerGirouette } from './girouette.js';
import { T, TEXTES } from './temps.js';
import { TEL, liberer, TEX_MAX, plafondDpr, ECO, VUE } from './memoire.js';   /* X1 : VUE */
import { RECETTES, PALETTE, laverEtapes, planifier, prioriser, terminer, niveaux as niveauxLavis, creerRevele, touchesAquarelle, chargerLavisPrets, ouvrier, pret, LOURD } from './lavis.js';
import { DOSSIER } from './visuels.js';

const SF = 62, DEMI = 1.15, OEIL = 1.62, NEAR = .3;
const ENCRE = [86, 92, 128];
const PAPIER = '#f2efe7';
const ink = a => `rgba(${ENCRE[0]},${ENCRE[1]},${ENCRE[2]},${a.toFixed(3)})`;

/* ---------- le chemin ---------- */
function chemin(s0, s1, ds, hfn, ox, oz, h0) {
  const n = Math.round((s1 - s0) / ds), X = new Float64Array(n + 1), Z = new Float64Array(n + 1), H = new Float64Array(n + 1);
  const i0 = Math.round(-s0 / ds);
  for (let i = 0; i <= n; i++) H[i] = h0 + hfn(s0 + i * ds);
  X[i0] = ox; Z[i0] = oz;
  for (let i = i0 + 1; i <= n; i++) { const h = (H[i - 1] + H[i]) / 2; X[i] = X[i - 1] + Math.sin(h) * ds; Z[i] = Z[i - 1] + Math.cos(h) * ds; }
  for (let i = i0 - 1; i >= 0; i--) { const h = (H[i + 1] + H[i]) / 2; X[i] = X[i + 1] - Math.sin(h) * ds; Z[i] = Z[i + 1] - Math.cos(h) * ds; }
  const tmp = { x: 0, z: 0, h: 0 };
  return {
    s0, s1,
    at(s, o) { o = o || tmp; const u = (clamp(s, s0, s1) - s0) / ds, i = Math.min(n - 1, Math.floor(u)), t = u - i; o.x = X[i] + (X[i + 1] - X[i]) * t; o.z = Z[i] + (Z[i + 1] - Z[i]) * t; o.h = H[i] + (H[i + 1] - H[i]) * t; return o; },
    pt(s, nl, y, o) { const a = this.at(s, tmp); o = o || [0, 0, 0]; o[0] = a.x + nl * Math.cos(a.h); o[1] = y; o[2] = a.z - nl * Math.sin(a.h); return o; }
  };
}
const PRINC = chemin(-16, SF + 16, .25, s => .15 * Math.sin(2 * Math.PI * s / 44) * (1 - ss(clamp((s - (SF - 24)) / 13))), 0, 0, 0);
const F = Object.assign({}, PRINC.at(SF));
/* sixième passe, F1 : passé le croisement, le chemin de droite tourne encore derrière un rideau de cyprès ; l'atelier,
   au bout, n'est visible qu'une fois tourné vers lui (il est hors du cadre tant qu'on regarde le poteau) */
const BR_VIRAGE = .3;
const BR = chemin(0, 52, .25, t => .55 * ss(clamp(t / 8)) + BR_VIRAGE * ss(clamp((t - 12) / 9)), F.x, F.z, F.h);
const BL = chemin(0, 52, .25, t => -.55 * ss(clamp(t / 8)), F.x, F.z, F.h);
const FWD = [Math.sin(F.h), 0, Math.cos(F.h)], RIGHT = [Math.cos(F.h), 0, -Math.sin(F.h)];
let T_GORE = 0;
for (let t = 0; t < 14; t += .05) { const q = BR.pt(t, -DEMI, 0); const lat = (q[0] - F.x) * RIGHT[0] + (q[2] - F.z) * RIGHT[2]; if (lat > 0) { T_GORE = t; break; } }
const GORE = BR.pt(T_GORE, -DEMI, 0);
const GORE_AV = (GORE[0] - F.x) * FWD[0] + (GORE[2] - F.z) * FWD[2];
const POTEAU_AV = GORE_AV + 1.1;
const POTEAU = [F.x + FWD[0] * POTEAU_AV, 0, F.z + FWD[2] * POTEAU_AV];
const S_POTEAU = SF + POTEAU_AV;
const T_PORTE = 37;
const PORTE = Object.assign({}, BR.at(T_PORTE));
const AT_R = [Math.cos(PORTE.h), 0, -Math.sin(PORTE.h)], AT_F = [Math.sin(PORTE.h), 0, Math.cos(PORTE.h)];

function profil(a, b, v) {
  const N = 800, arr = new Float64Array(N + 1); let acc = 0;
  for (let i = 1; i <= N; i++) { const p0 = a + (b - a) * (i - 1) / N, p1 = a + (b - a) * i / N; acc += (v(p0) + v(p1)) / 2 * (p1 - p0); arr[i] = acc; }
  return { a, b, v, frac(p) { if (p <= a) return 0; if (p >= b) return 1; const u = (p - a) / (b - a) * N, i = Math.floor(u), t = u - i; return (arr[i] + (arr[Math.min(i + 1, N)] - arr[i]) * t) / acc; } };
}
const MARCHE = profil(T.marche[0], T.marche[1], p => sseg(p, T.marche[0], T.marche[0] + .09) * (1 - sseg(p, T.marche[1] - .05, T.marche[1])));
const ROUTE = profil(T.route[0], T.route[1], p => sseg(p, T.route[0], T.route[0] + .018) * (1 - .82 * sseg(p, T.route[1] - .05, T.route[1] - .012)) * (1 - sseg(p, T.route[1] - .012, T.route[1])));

/* ---------- le décor, posé une fois ---------- */
const DECOR = (() => {
  const cy = [];
  [[3, 2.6, 0], [9, -2.4, 1], [15, 1.7, 2], [22, -3.6, 0], [27, -1.75, 1], [34, 2.9, 2], [40, 1.8, 0], [46, -2.6, 1], [51, 3.6, 2], [55, -1.9, 0], [-2, -2.9, 1]].forEach(([s, n, v]) => cy.push({ chem: PRINC, s, n, v }));
  cy.push({ abs: [POTEAU[0] - RIGHT[0] * 3.2 + FWD[0] * 8, 0, POTEAU[2] - RIGHT[2] * 3.2 + FWD[2] * 8], v: 0, h: 1.05 });
  cy.push({ abs: [POTEAU[0] + RIGHT[0] * 3.6 + FWD[0] * 10, 0, POTEAU[2] + RIGHT[2] * 3.6 + FWD[2] * 10], v: 2, h: .92 });
  /* I3 (neuvième passe) : le cyprès du bas-côté droit, 13 m après le croisement sur la branche de droite, s'écarte du
     chemin (3,6 m au lieu de 2,2 m) : il cachait le faîte de l'atelier, donc la girouette, pendant toute l'arrivée
     (p 0,684 à 0,696) ; il cadre toujours la façade à droite */
  [[13, 3.6, 1], [21, -2.1, 2], [33, -6.4, 1]].forEach(([t, n, v]) => cy.push({ chem: BR, s: t, n, v }));
  /* F1 : le rideau de cyprès à l'intérieur du virage (côté du chemin principal) ; serré, il cache l'atelier pendant
     toute la marche ; il borde le chemin sans couper la vue une fois qu'on y est engagé */
  for (let t = 15, k = 0; t <= 35.5; t += 1.7, k++) cy.push({ chem: BR, s: t, n: 4.6 + (k % 3) * .55 + hash(k, 41) * .4, v: k % 3, h: .9 + hash(k, 43) * .22 });
  [[12, -2.3, 0], [19, 2.4, 1], [27, -2.6, 2], [36, 2.2, 0], [45, -2.5, 1]].forEach(([t, n, v]) => cy.push({ chem: BL, s: t, n, v }));
  const lointains = [];
  for (let i = 0; i < 16; i++) { const s = 18 + i * 6.5, n = (i % 2 ? 1 : -1) * (10 + hash(i, 7) * 18); lointains.push({ chem: PRINC, s: Math.min(s, SF + 10), n, v: i % 3, h: .8 + hash(i, 3) * .4, loin: true }); }
  const rangs = [];
  [1.95, 3.2, 4.45, 5.7, 6.95].forEach((n, k) => { rangs.push({ chem: PRINC, n, a: -14, b: SF - 3, id: 10 + k }); rangs.push({ chem: PRINC, n: -n, a: -14, b: SF - 3, id: 20 + k }); });
  [1.95, 3.2, 4.45].forEach((n, k) => rangs.push({ chem: BR, n, a: 9, b: T_PORTE - 7, id: 30 + k }));
  rangs.push({ chem: BR, n: -1.95, a: 12, b: T_PORTE - 7, id: 34 });
  [-1.95, -3.2, -4.45].forEach((n, k) => rangs.push({ chem: BL, n, a: 9, b: 46, id: 40 + k }));
  rangs.push({ chem: BL, n: 1.95, a: 12, b: 46, id: 44 });
  const muret = { chem: PRINC, n: -1.5, a: 16, b: 31, pierres: [] };
  const Rm = rng(77);
  [[0, .3], [.3, .57]].forEach(([h0, h1], c) => { let s = muret.a + (c ? .2 : 0); while (s < muret.b) { const l = .35 + Rm() * .35; muret.pierres.push([s, Math.min(s + l, muret.b), h0 + Rm() * .02, h1 - Rm() * .03]); s += l + .02; } });
  /* O2 (quinzième passe) : chaque borne porte la distance restante exacte à son emplacement (L.S_STOP2 - s, en mètres du monde,
     arrondie à la dizaine) : 60 m à s = 11 (56 m exacts), 40 m à s = 31 (36 m exacts) sur tous les écrans (S_STOP2 va de 66,3
     à 67,6 m selon la taille). La seconde borne passe de s = 37 à s = 31 : à 37, sa valeur exacte (30 m) tombait au milieu
     de l'arrondi et le guide disait déjà « 40 » quand on la lisait, 5 m avant ; à 56 et 36 m exacts, le guide dit le même
     nombre que la borne de 9 m avant elle à 1 m après, tout le temps où elle se lit */
  const bornes = [{ chem: PRINC, s: 11, n: 1.45 }, { chem: PRINC, s: 31, n: 1.45 }];
  /* K7 (onzième passe) : les cyprès variés. Chaque cyprès tire, d'une graine fixe par emplacement (son chemin, sa place le
     long du chemin et en travers), son visuel (cypres-1 ou cypres-2, sans régularité), un miroir ou non, une hauteur
     parmi trois (0,85, 1, 1,15), une largeur propre (plus ou moins 6 %, indépendante), une inclinaison de -2 à +2 degrés,
     et, pour un cyprès lointain sur deux, une opacité réduite (plus pâle, donc plus loin) */
  const varier = (ob, k) => {
    const g = ob.abs ? Math.round(ob.abs[0] * 10) * 7 + Math.round(ob.abs[2] * 10) : Math.round(ob.s * 10) * 13 + Math.round(ob.n * 10) * 7 + (ob.chem === BR ? 501 : ob.chem === BL ? 907 : 0) + k;
    ob.k7 = { v: hash(g, 8101) < .5 ? 0 : 1, miroir: hash(g, 8103) < .5, eh: [.85, 1, 1.15][Math.floor(hash(g, 8107) * 3)], ew: 1 + .12 * (hash(g, 8109) - .5), rot: (hash(g, 8111) - .5) * 4 * Math.PI / 180, pale: hash(g, 8113) < .5 };
  };
  cy.forEach((ob, i) => varier(ob, 0)); lointains.forEach((ob, i) => varier(ob, 3));
  return { cy, lointains, rangs, muret, bornes };
})();

/* ---------- les images gravées : teintées au papier du monde, en niveaux de détail ---------- */
function preparerSprite(v, hautM, nom) {
  if (!v) return null;
  const src = v.image, w = v.w, h = v.h;
  const pied = v.reperes.pied ? [v.reperes.pied[0] * w, v.reperes.pied[1] * h] : [w / 2, h * .97];
  const cime = v.reperes.cime !== undefined ? v.reperes.cime * h : 0;
  const niveaux = [];
  let c = document.createElement('canvas'); c.width = w; c.height = h;
  let g = c.getContext('2d'); g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'multiply'; g.fillStyle = PAPIER; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-in'; g.drawImage(src, 0, 0);
  niveaux.push(c);
  while (c.height > 120) { const d = document.createElement('canvas'); d.width = Math.max(2, Math.round(c.width / 2)); d.height = Math.max(2, Math.round(c.height / 2)); const dg = d.getContext('2d'); dg.imageSmoothingQuality = 'high'; dg.drawImage(c, 0, 0, d.width, d.height); niveaux.push(d); c = d; }
  /* N1 (quatorzième passe) : sur téléphone (monde à une densité de 1,5), une gravure de plus de 600 px de côté (cyprès 592 x
     1792, vignes 1024 x 1024, borne 896 x 1200) n'a pas de niveau pleine résolution : le niveau 1 (la moitié, à la
     résolution de son lavis) sert aussi de niveau 0 (20 Mo de moins) */
  if (TEL && Math.max(w, h) > 600 && niveaux.length > 1) { liberer(niveaux[0]); niveaux[0] = niveaux[1]; }
  /* I1 : la source et le nom, pour calculer son lavis d'aquarelle */
  return { niveaux, w, h, pied, mpp: hautM / Math.max(1, pied[1] - cime), src, nom: nom || v.nom };
}

export function creerMonde(ctx, vis) {
  const scene = ctx.scene;
  const cv = [scene.querySelector('[data-c0]'), scene.querySelector('[data-c1]'), scene.querySelector('[data-c2]')];
  const g = cv.map(c => c.getContext('2d'));
  const o0 = scene.querySelector('[data-objets0]'), o1 = scene.querySelector('[data-objets1]');
  /* les herbes gravées (herbes.webp) : six plantes, chacune découpée dans sa boîte, posée par son pied */
  const HERBES = [];
  const vh = vis.herbes;
  if (vh && vh.reel && Array.isArray(vh.reperes.touffes)) {
    /* J11 (dixième passe) : de petites plantes, 20 à 40 cm (graminée haute, chardon, thym, pissenlit, coquelicots,
       graminée courte) */
    const hauteurs = [.4, .36, .2, .24, .34, .26];
    vh.reperes.touffes.forEach((t, i) => {
      const [x0, y0, x1, y1] = t.boite, X0 = Math.floor(x0 * vh.w), Y0 = Math.floor(y0 * vh.h), cw = Math.ceil((x1 - x0) * vh.w), ch = Math.ceil((y1 - y0) * vh.h);
      /* J11 : en mémoire (son lavis le relit pendant les temps morts, sans relecture de la carte graphique) */
      const c = document.createElement('canvas'); c.width = cw; c.height = ch; c.getContext('2d', { willReadFrequently: true }).drawImage(vh.image, X0, Y0, cw, ch, 0, 0, cw, ch);
      const S = preparerSprite({ image: c, w: cw, h: ch, reperes: { pied: [(t.pied[0] * vh.w - X0) / cw, (t.pied[1] * vh.h - Y0) / ch], cime: 0 } }, hauteurs[i] || .4, 'herbe-' + i);
      if (S) S.petite = true; HERBES.push(S);
    });
  }
  /* J11 : les fleurs plus fréquentes que les graminées (coquelicots, pissenlits, thym surtout) */
  const POIDS_HERBES = [.7, .9, 1.6, 1.6, 1.8, .8];
  const choisirHerbe = r => { let t = POIDS_HERBES.reduce((a, b) => a + b, 0) * r; for (let i = 0; i < POIDS_HERBES.length; i++) { t -= POIDS_HERBES[i]; if (t <= 0) return i; } return 0; };
  const SPR = {
    cy: [preparerSprite(vis['cypres-1'], 8.2), preparerSprite(vis['cypres-2'] && vis['cypres-2'].reel ? vis['cypres-2'] : vis['cypres-1'], 7.2)],
    vigne: [preparerSprite(vis['vigne-1'], 1.38), preparerSprite(vis['vigne-2'], 1.38)],
    borne: preparerSprite(vis.borne, .78)
  };
  /* vignes réelles : on les espace un peu plus que les buissons provisoires */
  const pasVigne = vis['vigne-1'] && vis['vigne-1'].reel ? 1.35 : 1;
  /* muret réel : une image couvre 2,40 m de mur ; posé par tronçons le long du chemin */
  const vm = vis.muret && vis.muret.reel ? vis.muret : null;
  let muretImg = null;
  if (vm) { const c = document.createElement('canvas'); c.width = vm.w; c.height = vm.h; const gg = c.getContext('2d'); gg.drawImage(vm.image, 0, 0); gg.globalCompositeOperation = 'multiply'; gg.fillStyle = PAPIER; gg.fillRect(0, 0, vm.w, vm.h); gg.globalCompositeOperation = 'destination-in'; gg.drawImage(vm.image, 0, 0); muretImg = c; }

  /* ---- le sol du chemin : une tuile gravée raccordable, teintée au papier du chemin ---- */
  /* Cinquième passe, E5 : la tuile est doublée le long du chemin par son miroir (le motif ne se répète plus que tous
     les 4,80 m, sans raccord visible), teintée à l'encre de la gravure, et déclinée en quatre finesses : plus loin,
     une version réduite (lissée) remplace la pleine, la densité décroît avec la distance au lieu de fourmiller. */
  const solV = vis['sol-chemin'];
  let solMotif = null, solMotifs = [], solT = 512, solBrut = null, solTex = null;
  if (solV) {
    /* N1 (quatorzième passe) : sur téléphone, la tuile du chemin à demi-résolution (512 px pour 2,40 m : plus fin que l'écran à
       une densité de 1,5) ; ses deux copies et sa texture passent de 8 à 2 Mo chacune */
    const kSol = TEL && solV.w > 512 ? .5 : 1, w = Math.round(solV.w * kSol), h = Math.round(solV.h * kSol), double = () => { const d = document.createElement('canvas'); d.width = w; d.height = h * 2; const dg = d.getContext('2d'); dg.imageSmoothingQuality = 'high'; dg.drawImage(solV.image, 0, 0, w, h); dg.translate(0, h * 2); dg.scale(1, -1); dg.drawImage(solV.image, 0, 0, w, h); return d; };
    const c = double(), masque = double(), gg = c.getContext('2d');
    /* I1 : la tuile doublée, brute, pour son lavis */
    solBrut = masque;
    /* l'encre de la gravure du paysage, plutôt que le gris de la tuile */
    gg.globalCompositeOperation = 'source-atop'; gg.fillStyle = `rgba(${ENCRE[0]},${ENCRE[1]},${ENCRE[2]},.55)`; gg.fillRect(0, 0, w, h * 2);
    gg.globalCompositeOperation = 'multiply'; gg.fillStyle = '#f6f3ea'; gg.fillRect(0, 0, w, h * 2);
    /* la tuile réelle n'a que l'encre : elle se pose sur la couleur du chemin, sans la recouvrir */
    if (solV.reel) { gg.globalCompositeOperation = 'destination-in'; gg.drawImage(masque, 0, 0); }
    let cur = c;
    for (let L = 0; L < 4; L++) {
      if (L) { const d = document.createElement('canvas'); d.width = Math.max(8, cur.width >> 1); d.height = Math.max(8, cur.height >> 1); const dg = d.getContext('2d'); dg.imageSmoothingQuality = 'high'; dg.drawImage(cur, 0, 0, d.width, d.height); cur = d; }
      solMotifs.push(g[0].createPattern(cur, 'repeat'));
    }
    solMotif = solMotifs[0]; solT = w;
    /* K12 : la tuile doublée et teintée, pour le sol en perspective exacte */
    solTex = c;
    /* N1 (quatorzième passe) : la tuile brute n'était gardée que comme drapeau (son lavis se calcule sur l'image) : rendue */
    solBrut = true; liberer(masque);
  }
  const LT = 2.4;   /* la tuile couvre 2,40 m sur 2,40 m */
  /* K12 (onzième passe) : le sol du chemin et la calade en perspective exacte, attachés au sol (js/sol.js). Le contexte
     WebGL et ses textures se préparent pendant les temps morts (jamais au démarrage) ; tant qu'ils ne sont pas prêts, ou
     sans WebGL 2, l'ancien tracé par tranches. */
  let SOLGL = null;
  /* L4 (douzième passe) : un contexte WebGL par passe de l'image (l'encre, et pour les lavis : la terre, le masque de la
     calade, son calcaire). Avec un seul contexte réutilisé quatre fois par image, Safari attendait à chaque recopie que la
     précédente soit faite (12 ms, puis 5, puis 8 : la route vers l'atelier y tombait à 25 images par seconde). Chaque
     contexte ne porte que ses textures : rien n'est envoyé deux fois. */
  /* L4 : le lavis du sol (la terre des champs, l'ocre des chemins, le calcaire de la calade) est rendu directement dans un
     canevas de la page, en multiplication, juste au-dessus du sol du monde (sous les objets, qui le couvrent) : plus aucune
     recopie d'un rendu WebGL dans le calque des lavis (Safari y perdait 10 à 25 ms par image sur la route) */
  const GLV = { sol: null };
  const lavSolC = document.createElement('canvas'); lavSolC.className = 'monde monde--lavsol'; lavSolC.setAttribute('aria-hidden', 'true'); lavSolC.setAttribute('data-lavsol', '');
  cv[0].after(lavSolC); setV(lavSolC, false);
  /* T2 (vingtième passe, 07/10/2026) : sur téléphone, l'encre du sol (WebGL) est rendue directement dans un canevas de la page,
     posé juste au-dessus du sol gravé (sous le lavis du sol et les objets proches), au lieu d'être recopiée dans le canevas du
     sol à chaque image. Mesuré sur l'iPhone 15 : la recopie d'un rendu WebGL dans un canevas 2D coûtait 8 à 12 ms par image
     (la carte graphique attend, puis copie) sur la marche, le croisement et la route. Ce qui était tracé dans le sol après
     l'encre (les ombres des cyprès, les bords et hachures du chemin, les objets au-delà de la façade) passe sous elle : des
     traits sombres sous des traits sombres ; la lumière dorée de la branche de droite (7 à 10 %) aussi */
  /* Pour garder l'ordre d'avant (le papier du sol et les surfaces des chemins, puis l'encre du sol, puis les bords et hachures
     des chemins, les ombres et les objets lointains), le papier et les surfaces passent dans un canevas à part, sous l'encre :
     fondSolC, encSolC, puis le canevas du sol (cv[0]) */
  const ENC_PAGE = TEL;
  /* Y17 (10/10/2026) : la densité du canevas du papier du sol (fondSolC), relative à DPR : une seule constante, reprise par sa taille,
     son dessin et le masque du raccord avec la gravure. Avant, le masque se posait à pleine densité sur ce canevas à demi-densité : le
     papier montait deux fois moins vite que le dessin (de p 0,303 à 0,37, la gravure restait au bas de l'écran) ; et hd.patch, qui
     l'agrandissait, ne reprenait pas son dessin (le triangle blanc des vidéos v4) */
  const KF = .5;
  const encSolC = ENC_PAGE ? document.createElement('canvas') : null, fondSolC = ENC_PAGE ? document.createElement('canvas') : null;
  const gF = fondSolC ? fondSolC.getContext('2d') : null;
  if (encSolC) {
    encSolC.className = 'monde monde--encsol'; fondSolC.className = 'monde monde--encsol';
    [encSolC, fondSolC].forEach(c => { c.setAttribute('aria-hidden', 'true'); setV(c, false); });
    cv[0].before(fondSolC); cv[0].before(encSolC);
  }
  setTimeout(() => planifier({ nom: 'sol', gen: (function* () {
    /* P4 (seizième passe) : les deux contextes du sol créés par étapes (creerSolGLEtapes) */
    yield; const o1 = {}; yield* creerSolGLEtapes(ENC_PAGE ? { canvas: encSolC } : {}, o1); const sg = o1.r; if (!sg || !sg.ok) return;
    yield; if (solTex) yield* sg.prechauffer(solTex, true);
    SOLGL = sg; if (ctx.redessiner) ctx.redessiner();
    /* S4 : en mode économe, pas de lavis du sol en WebGL (un contexte de moins) */
    yield; if (!ECO) { const o2 = {}; yield* creerSolGLEtapes({ canvas: lavSolC }, o2); if (o2.r && o2.r.ok) GLV.sol = o2.r; }
    /* L4 : un premier rendu à blanc du lavis du sol (programmes de la carte graphique prêts, canevas à sa taille), et les
       calques des lavis alloués, pendant les temps morts : l'allumage de la lampe (0,700) ne les prépare plus d'un coup */
    yield; if (GLV.sol && lavC.width > 2) GLV.sol.debut(lavC.width, lavC.height);
    yield; if (GLV.sol && lavC.width > 2) { const c = GLV.sol; c.debut(lavC.width, lavC.height); c.quadTerre(lavC.height - 1, [0, 0, 0]); c.quadMasque(new ImageData(1, 1), [0, 0, 0, 0]); if (!c.rendre()) c.vider(); }
    yield; lg.clearRect(0, 0, 1, 1);
    yield; ltg.clearRect(0, 0, 1, 1);
    /* les textures déjà prêtes (calade, lavis de la terre) */
    prechaufferGL();
  })() }), 1200);
  /* K12 : chaque texture du sol est envoyée à la carte graphique pendant les temps morts, jamais pendant une image ; une
     texture pas encore prête n'est pas dessinée (la calade et le lavis de la terre arrivent ainsi comme avant, en tâche) */
  function prechaufferGL() {
    if (!SOLGL) return;
    /* chaque texture dans le contexte de sa passe (L4) */
    const L = [[SOLGL, CALADE.ink && CALADE.ink[0], false], [GLV.sol, LAVIS.solTex, true], [GLV.sol, CALADE.masque, false], [GLV.sol, CALADE.lav, false]].filter(([g, c]) => g && c && !g.pret(c));
    /* L4 : chaque texture du lavis du sol est aussi tracée une fois, à blanc (opacité 0,001), dans le canevas de la page */
    const PROJ0 = () => ({ CX: W / 2, CY: H / 2, FOC: W, W, H, NEAR });
    const aBlanc = (g, c, r) => { if (g !== GLV.sol || lavC.width <= 2) return; g.debut(lavC.width, lavC.height); g.ruban(c, r, [{ p: [[-1, -1, 2], [1, -1, 2]], t: [[0, 0], [1, 0]], a: [.001, .001] }, { p: [[-1, 1, 2], [1, 1, 2]], t: [[0, 1], [1, 1]], a: [.001, .001] }], PROJ0()); if (!g.rendre()) g.vider(); };
    /* P4 bis : le tracé à blanc est une étape LOURD (voir lavis.js) */
    if (L.length) planifier({ nom: 'sol-textures', gen: (function* () { for (const [g, c, r] of L) if (!g.pret(c)) { yield* g.prechauffer(c, r); yield; aBlanc(g, c, r); yield LOURD; } })(), apres: () => { if (ctx.redessiner) ctx.redessiner(); } });
  }
  /* J12 : la calade du dernier tronçon, préparée pendant les temps morts ; tant qu'elle ne l'est pas, le chemin de terre */
  const CALADE = {};
  /* J12 bis : avec la calade gravée de Thibaut au manifeste (calade et sa carte d'ordre), la tuile ; sinon le repli en code */
  const vCal = vis.calade && vis.calade.reel ? vis.calade : null;
  setTimeout(() => {
    if (vCal && vCal.reperes.ordre) {
      const parImage = () => {
        const o = new Image(); o.onload = () => planifier({ nom: 'calade', gen: caladeTuileEtapes(CALADE, vCal, o), apres: () => { prechaufferGL(); if (ctx.redessiner) ctx.redessiner(); } });
        o.onerror = () => planifier({ nom: 'calade', gen: caladeEtapes(CALADE), apres: () => { if (ctx.redessiner) ctx.redessiner(); } });
        o.src = vCal.src.replace(/[^/]*$/, vCal.reperes.ordre);
      };
      /* P4 (seizième passe) : la carte d'ordre décodée et relue par l'ouvrier (hors du fil principal) ; sans lui, comme avant */
      ouvrier('pixels', { url: new URL(vCal.src.replace(/[^/]*$/, vCal.reperes.ordre), location.href).href })
        .then(r => planifier({ nom: 'calade', gen: caladeTuileEtapes(CALADE, vCal, null, { w: r.w, h: r.h, data: new Uint8ClampedArray(r.data) }), apres: () => { prechaufferGL(); if (ctx.redessiner) ctx.redessiner(); } }), parImage);
    } else planifier({ nom: 'calade', gen: caladeEtapes(CALADE), apres: () => { if (ctx.redessiner) ctx.redessiner(); } });
  }, 1800);

  /* ---- le poteau réel, ses textes et son clou ---- */
  const vp = vis['poteau-planche'];
  const kP = .8 / Math.max(1, (vp.reperes.planche[1][0] - vp.reperes.planche[0][0]) * vp.w);   /* la planche fait 80 cm de large */
  const pied = reperesPx(vp, 'pied') || [vp.w / 2, vp.h * .96];
  const poteau = new Image(); poteau.className = 'ep poteau-img'; poteau.src = vp.src; poteau.width = vp.w; poteau.height = vp.h; poteau.alt = ''; o1.appendChild(poteau);
  /* F19, F20 : les mots gravés dans le bois des flèches, vieillis (js/fleches.js) ; le texte vient des réglages */
  /* N4 (quatorzième passe) : sur téléphone, le mot gravé est peint dans un canevas (fleches.js, flecheGraveeCanvas) : le filtre
     SVG de la gravure ne s'affichait pas sur l'iPhone ; sur ordinateur, le SVG d'avant */
  const graveTel = (b, txt, sous, graine) => {
    const poser = c => { c.className = 'fleche-gravee'; c.setAttribute('aria-hidden', 'true'); const a = b.querySelector('.fleche-gravee'); if (a) a.replaceWith(c); else b.appendChild(c); };
    /* peint en tâche de fond (jamais au démarrage), la police chargée ; besoin : quand le poteau entre dans le cadre */
    /* P4 (seizième passe) : peint par étapes (flecheGraveeEtapes) */
    /* U2 (vingt et unième passe, 07/10/2026) : sur l'iPhone, à la première traversée, les flèches arrivaient sans leurs mots
       (« les mentions n'apparaissent pas la première fois ; après, elles sont là »). Cause, relevée sur l'appareil (journal
       ?diag=1, c21-iphone-gravures.json) : la tâche (besoin 0,36) passe derrière toutes celles de besoin plus bas (la crête, les
       lavis posés, le sol, ses textures), la file attend 3 s à l'ouverture, ne tourne pas pendant un geste et, après la nuit, ne
       sert que l'imminent quand le film bouge ; ses 23 étapes coûtent 23 à 73 ms chacune sur l'iPhone ; un visiteur qui défile
       tout de suite arrive au poteau (0,45) avant qu'elle ait tourné (finie à 0,58 dans le relevé) ; quand il revient, elle a
       tourné. Les deux gravures sont maintenant des images préparées une fois par ce même code (prets/fleche-11.png et
       -23.png, prets.json ; en PNG : un WebP sans perte avec transparence faisait tomber la capture d'écran de Safari sur l'iPhone), lues et décodées hors du fil principal dès la création du monde et posées telles quelles (même
       canevas que la tâche, au pixel près) ; la tâche ne reste qu'en secours (texte des réglages changé, image absente), et
       elle attend la police au lieu de peindre un repli (l'ancienne reprise, à l'arrivée de la police, repeignait d'un bloc
       et rendait au passage les canevas de travail de l'autre flèche en cours : une gravure vide) */
    let posee = false;
    const tache = () => planifier({ nom: 'fleche-' + graine, besoin: .36, gen: (function* () {
      yield;
      if (posee) return;
      let ok = true; try { ok = !document.fonts || document.fonts.check('800 58px Poppins'); } catch (e) { /* rien */ }
      if (!ok) { document.fonts.load('800 58px Poppins').then(() => document.fonts.load('800 22px Poppins')).catch(() => {}).then(() => setTimeout(tache, 0)); return; }
      const o = {}; yield* flecheGraveeEtapes(txt, sous, graine, 1.8, o); if (!posee) { posee = true; poser(o.c); if (ctx.redessiner) ctx.redessiner(); }
    })() });
    pret('fleche-' + graine).then(r => {
      if (r && r.e && r.e.texte === txt + '|' + (sous || '') && r.im.naturalWidth === Math.round(620 * 1.8)) { posee = true; r.im.alt = ''; poser(r.im); if (ctx.redessiner) ctx.redessiner(); if (window.__diag) window.__diag.noter('fleche-' + graine + ' posée (image préparée)'); }
      else setTimeout(tache, 900);
    });
  };
  const fleche = (txt, sous, cls, graine) => { const b = el(`<button type="button" class="ep poteau-texte ${cls}" style="width:620px;height:124px" tabindex="-1"><span class="sr">${txt}${sous ? ', ' + sous : ''}</span>${TEL ? '' : flecheGravee(txt, sous, graine)}</button>`); if (TEL) graveTel(b, txt, sous, graine); o1.appendChild(b); return b; };
  const fG = fleche(TEXTES.horizon, TEXTES.horizonSous, 'fl-g', 11), fD = fleche(TEXTES.atelier, '', 'fl-d', 23);
  /* le cadre clair qui fait lire la flèche « Atelier » comme un bouton, à l'arrêt du croisement */
  const cadreA = el('<i class="ep poteau-cadre" style="width:620px;height:124px" aria-hidden="true"></i>'); o1.appendChild(cadreA);
  fG.disabled = true; fG.setAttribute('aria-hidden', 'true');
  fD.setAttribute('aria-label', 'Atelier : prendre le chemin de l\'atelier');
  const soleil = el('<i class="ep poteau-soleil" style="width:620px;height:124px"></i>'); o1.appendChild(soleil);
  const plaque = el('<div class="ep plaque-logo" role="img" aria-label="Civik-ia" style="width:400px;height:150px"><i class="pl-clair"></i><i class="pl-creux"></i><i class="pl-ombre"></i></div>'); o1.appendChild(plaque);
  /* P2 (seizième passe) : le masque du logo de la plaque (le SVG rastérisé en 1050 x 850, relu, puis encodé en PNG : 50 à
     150 ms d'un bloc) se faisait au chargement du SVG, juste après la première image ; il passe par la file (besoin 0,36 :
     la plaque n'est lisible qu'au croisement) */
  /* P4 (seizième passe) : le SVG est chargé hors de la file, le masque calculé par étapes, et son encodage en PNG fait par
     l'ouvrier (20 à 40 ms d'un bloc sur le fil principal) ; sans ouvrier, l'encodage d'avant, en une étape */
  const poserMasque = u => plaque.style.setProperty('--masque', `url(${u})`);
  /* le masque préparé (prets/logo-masque.png, fait par ce même code), s'il est là : rien à calculer */
  pret('logo-masque').then(r => { if (r) poserMasque(r.url); else chargerLogo().then(im => { if (!im) return; planifier({ nom: 'logo-masque', besoin: .36, gen: (function* () {
    yield; const o = {}; yield* logoMasqueEtapes(im, o);
    const copie = o.d.data.slice().buffer;
    ouvrier('encoder', { w: o.d.width, h: o.d.height, data: copie, type: 'image/png' }, [copie]).then(r => poserMasque(URL.createObjectURL(r.blob)), () => planifier({ nom: 'logo-masque-png', besoin: .36, gen: (function* () { yield; o.g.putImageData(o.d, 0, 0); poserMasque(o.c.toDataURL('image/png')); })() }));
  })() }); }); });
  const cvQ = reperesPx(vp, 'cv'), plQ = reperesPx(vp, 'plaque'), fgQ = reperesPx(vp, 'fleche_gauche'), fdQ = reperesPx(vp, 'fleche_droite'), clouP = reperesPx(vp, 'clou'), plancheQ = reperesPx(vp, 'planche');
  /* T10 (07/10/2026, tranché par Thibaut) : plus d'arrachage. Un seul clou, droit, planté dans la planche et immobile pendant
     toute la scène ; la feuille est devant lui quand elle est là et passe devant lui en partant ; la feuille ne porte plus de
     clou. La photo du poteau avait le sien, vu de biais avec une longue ombre (il se lisait couché, et sa tête claire comme
     un trou rose). Une pièce posée sur la photo, comme la plaque, le couvre : le bois juste dessous (48 px plus bas sur la
     même planche) recopié avec un bord fondu de 5 px, la tête de clou réelle (clou.webp) de face, 13 px (11 px sur la
     feuille avant ; un peu plus pour se lire sur le bois sombre), avec une ombre courte et franche (lumière en haut à
     gauche, comme l'ombre de la feuille). Peinte une fois, à la création (un canevas de 124 x 96 : 47 ko), à deux pixels
     par pixel de la photo pour que la tête reste nette de près */
  const CLOU_PIECE = (() => {
    const vC = vis.clou; if (!vp.reel || !vp.image || !clouP) return null;
    const s = vp.w / 896, cx = clouP[0], cy = clouP[1], K = 2;
    const x0 = Math.round(cx - 50 * s), y0 = Math.round(cy - 13 * s), w = Math.round(62 * s), h = Math.round(48 * s), dy = Math.round(48 * s), F = 5 * s;
    const c = document.createElement('canvas'); c.width = w * K; c.height = h * K; c.className = 'ep poteau-clou'; c.setAttribute('aria-hidden', 'true');
    c.style.width = w + 'px'; c.style.height = h + 'px';
    const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(vp.image, x0, y0 + dy, w, h, 0, 0, w * K, h * K);
    g.globalCompositeOperation = 'destination-in';
    const W2 = w * K, H2 = h * K, F2 = F * K;
    const gx = g.createLinearGradient(0, 0, W2, 0); gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(F2 / W2, '#000'); gx.addColorStop(1 - F2 / W2, '#000'); gx.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gx; g.fillRect(0, 0, W2, H2);
    const gy = g.createLinearGradient(0, 0, 0, H2); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(F2 / H2, '#000'); gy.addColorStop(1 - F2 / H2, '#000'); gy.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gy; g.fillRect(0, 0, W2, H2);
    g.globalCompositeOperation = 'source-over';
    const ox = (cx - x0 + 2.2 * s) * K, oy = (cy - y0 + 2.8 * s) * K, r = 8.5 * s * K, om = g.createRadialGradient(ox, oy, 0, ox, oy, r);
    om.addColorStop(0, 'rgba(0,0,0,.78)'); om.addColorStop(.55, 'rgba(0,0,0,.42)'); om.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = om; g.fillRect(ox - r, oy - r, 2 * r, 2 * r);
    if (vC && vC.image) { const d = 13 * s * K; g.drawImage(vC.image, (cx - x0) * K - d / 2, (cy - y0) * K - d / 2, d, d); }
    poteau.after(c);
    return { c, w, h, q: [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]] };
  })();
  const imPoteau = [[0, 0], [vp.w, 0], [vp.w, vp.h], [0, vp.h]];

  /* ---- la façade de l'atelier ---- */
  /* cinquième passe : la façade est désormais la photo portes fermées (atelier-facade-fermee) ; l'ancienne photo
     portes ouvertes ne sert plus que si l'image fermée manque */
  const vFer = vis['atelier-facade-fermee'];
  const vf = vFer && vFer.reel ? vFer : vis['atelier-facade'];
  const porteQ = reperesPx(vf, 'porte');
  const kF = 2.2 / Math.max(1, porteQ[3][1] - porteQ[0][1]);   /* la porte fait 2,20 m */
  const solF = (vf.reperes.sol || .94) * vf.h;
  /* les portes qui s'ouvrent, l'intérieur, la marche du seuil, la lumière qui entre, la plaque, le voile de brume (E5 à E8) */
  /* J2 : la suspension de l'atelier (lampe-atelier), vue de dehors */
  const VLAMPE = vis['lampe-atelier'] && vis['lampe-atelier'].reel ? vis['lampe-atelier'] : null;
  const fac = creerFacade(o0, vf, vis['plaque-atelier'], kF, VLAMPE);
  const facade = fac.image;
  /* F21 : la colombe, posée dans le monde avec la façade */
  /* démarrage (dixième passe) : la colombe, retirée par défaut (H4), n'est préparée qu'avec ?oiseau=1 (0,13 s de moins) */
  const oiseau = (() => { try { if (new URLSearchParams(location.search).get('oiseau') !== '1') return { placer() {} }; } catch (e) { return { placer() {} }; } return creerOiseau(o0, vis['oiseau-planche'], vis['oiseau-pose']); })();
  const imFacade = [[0, 0], [vf.w, 0], [vf.w, vf.h], [0, vf.h]];
  const porteCx = (porteQ[0][0] + porteQ[1][0]) / 2;
  /* l'étendue du mur au sol (m, le long de la façade, depuis l'axe de la porte), et la marche à laisser libre */
  const facadeL = [(vf.w * .025 - porteCx) * kF, (vf.w * .975 - porteCx) * kF];
  const seuilL = [(porteQ[0][0] - porteCx) * kF - .4, (porteQ[1][0] - porteCx) * kF + .4];
  /* les herbes gravées : bords des chemins (irréguliers, en petites touffes), pied du poteau, pied du mur */
  const Rh = rng(4242), BORDS = [], PIED_POTEAU = [], PIED_FACADE = [];
  /* J11 : de petites fleurs qui ornent le chemin, pas un parterre : une plante, parfois deux, tous les 1,4 à 4 m sur
     chaque bord, à une distance du bord tirée au hasard (jamais alignées), miroir et échelle variés ; un peu plus serrées
     sur le chemin de l'atelier en approchant de la porte. Les touffes au trait d'avant disparaissent (elles ne sont
     tracées que sans herbes gravées). */
  [[PRINC, -12, SF - 1, 0], [BR, 1, T_PORTE - .8, 1], [BL, 1, 44, 0]].forEach(([ch, a, b, versAtelier]) => [-1, 1].forEach(cote => {
    let t = a + Rh() * 2;
    while (t < b) {
      const deux = Rh() < .3;
      for (let j = 0; j <= (deux ? 1 : 0); j++) BORDS.push({ chem: ch, s: t + (Rh() - .5) * .5, n: cote * (DEMI + .02 + Rh() * Rh() * .55), k: choisirHerbe(Rh()), e: .75 + Rh() * .5, m: Rh() < .5 });
      const serre = versAtelier ? lerp(1, .55, clamp((t - 14) / 20)) : 1;
      t += (1.4 + Rh() * 2.6) * serre;
    }
  }));
  [[-.34, .12], [.3, -.04]].forEach(([n, f], i) => PIED_POTEAU.push({ n, f, k: [4, 3][i], e: .8 + Rh() * .3, m: i % 2 === 0 }));
  /* au pied de la façade : quelques plantes, de part et d'autre de la porte, au pied des piliers */
  [facadeL[0] + .25, facadeL[0] + .7, seuilL[0] - .5, seuilL[1] + .45, facadeL[1] - .35].forEach((x, i) => PIED_FACADE.push({ x, f: .06 + Rh() * .22, k: [4, 2, 3, 1, 4][i], e: .75 + Rh() * .4, m: Rh() < .5 }));

  /* ---- I1 : le calque des lavis d'aquarelle ---- */
  /* Une seule toile, posée juste au-dessus du monde gravé, en multiplication (film.css) : la couleur passe sous les
     traits, qui restent sombres, et le papier prend la teinte. Chaque objet gravé y efface d'abord ce qui est derrière
     lui (sa silhouette), puis pose son lavis ; les objets réels (façade, poteau, girouette, marche, vantaux) y
     effacent ce qui est derrière eux et ne sont jamais teintés. */
  const lavC = document.createElement('canvas'); lavC.className = 'monde monde--lavis'; lavC.setAttribute('aria-hidden', 'true'); lavC.setAttribute('data-lavis', '');
  cv[2].after(lavC); setV(lavC, false);
  const lg = lavC.getContext('2d');
  /* K8 : l'encre un peu soluble sous l'aquarelle. Le calque des lavis est en multiplication : il teinte le papier mais ne
     peut qu'assombrir l'encre bleue. Une copie de ce calque, en mode « couleur » à 25 %, donne à tout ce qu'il couvre (les
     traits compris) un quart de la teinte du lavis : sous un lavis vert, l'encre tire sur le vert ; les vignes paraissent
     vertes, pas grises. Recopiée à chaque image où la couleur est là (une copie par la carte graphique). */
  const lavT = document.createElement('canvas'); lavT.className = 'monde monde--teinte'; lavT.setAttribute('aria-hidden', 'true');
  lavC.after(lavT); setV(lavT, false);
  const ltg = lavT.getContext('2d');
  if (TEL) { lavC.width = lavC.height = 1; lavT.width = lavT.height = 1; }   /* T2 : à leur taille à l'arrivée des couleurs */
  const revele = creerRevele();
  const REDUIT = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).get('mouvement') === 'reduit'; } catch (e) { return false; } })();
  const LAVIS = { taches: [], loin: null, muret: null, solMotifs: null, solK: null, lancees: false };
  function tacheLavis(src, w, h, nom, apres) {
    const R = RECETTES[nom]; if (!R || !src) return;
    const sortie = {}; LAVIS.taches.push({ nom: 'lavis-' + nom, sw: w, sh: h, poser: apres, gen: laverEtapes(src, w, h, R, sortie), apres: () => apres(sortie) });
  }
  {
    const faits = new Map();
    [...SPR.cy, ...SPR.vigne, SPR.borne, ...HERBES].forEach(S => {
      if (!S) return;
      /* deux sprites tirés du même fichier partagent le même lavis */
      const cle = S.src; if (faits.has(cle)) { faits.get(cle).push(S); return; } faits.set(cle, [S]);
      tacheLavis(S.src, S.w, S.h, S.nom, l => faits.get(cle).forEach(Sp => { Sp.lav = niveauxLavis(l, Sp.niveaux.length); }));
    });
    if (vm) tacheLavis(vm.image, vm.w, vm.h, 'muret', l => { LAVIS.muret = l; });
    /* la tuile du chemin : son lavis est calculé sur la tuile seule, puis doublé par son miroir, comme l'encre (aucun
       raccord visible le long du chemin) */
    if (solBrut) tacheLavis(solV.image, solV.w, solV.h, 'sol', l => {
      const dd = document.createElement('canvas'); dd.width = l.w; dd.height = l.h * 2; const dg = dd.getContext('2d');
      dg.drawImage(l.c, 0, 0); dg.translate(0, l.h * 2); dg.scale(1, -1); dg.drawImage(l.c, 0, 0);
      const Lv = [dd, dd]; let cur = dd;
      for (let i = 2; i < 4; i++) { const d = document.createElement('canvas'); d.width = Math.max(8, cur.width >> 1); d.height = Math.max(8, cur.height >> 1); const dg = d.getContext('2d'); dg.imageSmoothingQuality = 'high'; dg.drawImage(cur, 0, 0, d.width, d.height); Lv.push(d); cur = d; }
      LAVIS.solMotifs = Lv.map(c => lg.createPattern(c, 'repeat')); LAVIS.solK = [2, 2, 4, 8].map(k => k * solT / (l.w * 2));
      /* K12 : le lavis de la tuile doublée, pour le sol en perspective exacte */
      LAVIS.solTex = dd; prechaufferGL();
    });
    if (vis.lointain) tacheLavis(vis.lointain.image, vis.lointain.w, vis.lointain.h, 'lointain', l => { LAVIS.loin = l.c; });
  }
  /* Les lavis ne sont JAMAIS calculés sur le chemin du démarrage ni pendant une image : ils se font en tâches de
     quelques millisecondes, pendant les temps morts, 1,5 s après la première image (ou dès qu'on en a besoin, mais
     toujours en tâches de fond). Tant que le lavis d'un visuel n'est pas prêt, ce visuel reste simplement à l'encre ;
     quand une tâche se termine, le film est redessiné (ctx.redessiner) pour que la couleur paraisse. */
  /* K8 : appelé par une image déjà dans la couleur (ouverture ou saut sur la route), les lavis passent en urgence, en tête
     de la file, dès cette première image (et non 1,5 s après) ; sinon ils suivent dans les temps morts */
  /* (sur la route, les bornes du chemin principal sont hors du cadre : leur lavis suit, sans urgence) */
  const lancerLavis = (urgent = false, p = 0) => {
    /* S4 (dix-neuvième passe) : en mode économe, aucun des treize lavis (ni calcul, ni image préparée) : la couleur est un
       lavis uni (rendreLavis) */
    if (ECO) return;
    if (urgent) LAVIS.urgentDemande = true;
    /* M4 : tant que les lavis préparés n'ont pas répondu (0,8 s au plus), on ne lance aucun calcul (ils arrivent en général
       en 0,1 à 0,4 s ; un lavis préparé rend sa tâche inutile) */
    if (LAVIS.prepares === null) { if (!LAVIS.relance) { LAVIS.relance = true; const go = () => { LAVIS.prepares = LAVIS.prepares || 0; lancerLavis(LAVIS.urgentDemande, LAVIS.pDemande); }; LAVIS.attente.then(go); setTimeout(go, 800); } LAVIS.urgentDemande = LAVIS.urgentDemande || urgent; LAVIS.pDemande = p; return; }
    const sauf = p > .66 ? ['lavis-borne'] : [];
    if (LAVIS.lancees) { if (urgent && !LAVIS.urgents) { LAVIS.urgents = true; prioriser('lavis-', sauf); } return; }
    LAVIS.lancees = true; LAVIS.urgents = urgent;
    LAVIS.taches.forEach(t => { const a = t.apres; t.apres = () => { a(); if (ctx.redessiner) ctx.redessiner(); }; planifier(t); });
    if (urgent) prioriser('lavis-', sauf);
  };
  setTimeout(() => lancerLavis(false), 1500);
  /* M4 (treizième passe) : les lavis préparés (c-film/lavis/), demandés dès la création du monde (les images se décodent
     hors du fil principal) ; chacun remplace sa tâche de calcul s'il arrive avant qu'elle soit finie, et se pose seul,
     au plus un toutes les 40 ms (le passage aux niveaux de détail ne fait que quelques millisecondes) ; le film est
     redessiné. Une source dont les dimensions ont changé garde son calcul. */
  /* S4 : en mode économe, les lavis préparés ne sont pas lus */
  if (!ECO) {
    const attente = []; let posant = false;
    const poserSuivant = () => {
      /* (dans la couleur, ou tout près : tous ceux qui attendent, d'un coup) */
      if (LAVIS.urgentDemande && attente.length > 1) { const x0 = attente.shift(); attente.unshift(x0); while (attente.length > 1) { const y = attente.pop(); const t = LAVIS.taches.find(t2 => t2.nom === 'lavis-' + y.nom); if (t && t.attendImage && !t.calcule) { try { t.poser({ c: y.im, w: y.im.naturalWidth, h: y.im.naturalHeight }); } catch (e) { /* rien */ } (window.__journalLavis = window.__journalLavis || []).push([y.nom, Math.round(performance.now())]); } } }
      if (!poserUn()) { posant = false; return; }
      setTimeout(poserSuivant, 16);
    };
    /* P2 (seizième passe) : poser un lavis préparé (les niveaux de détail, 18 à 40 ms dans Chrome, 30 à 83 ms dans WebKit) */
    function poserUn() {
      const x = attente.shift(); if (!x) return false;
      const t = LAVIS.taches.find(t2 => t2.nom === 'lavis-' + x.nom);
      if (t && t.attendImage && !t.calcule) {
        t.pret = 'image';
        /* (pour les essais : le journal des lavis posés, instant en ms depuis l'ouverture de la page) */
        (window.__journalLavis = window.__journalLavis || []).push([x.nom, Math.round(performance.now())]);
        try { t.poser({ c: x.im, w: x.im.naturalWidth, h: x.im.naturalHeight }); } catch (e) { console.warn('[lavis] ' + x.nom + ' : ' + e.message); }
        if (ctx.redessiner) ctx.redessiner();
      }
      return true;
    }
    /* P2 (seizième passe) : les lavis préparés se posaient un toutes les 16 ms dès leur décodage, soit 0,1 à 0,4 s après la
       première image : en plein dans l'apparition du téléphone. Ils passent par la file des préparations (un lavis par
       étape, besoin 0,69 : la couleur ne paraît qu'à 0,700), qui respecte l'ouverture ; dans la couleur ou tout près
       (urgentDemande), tous d'un coup, comme avant */
    /* S3 (dix-neuvième passe) : les lavis préparés se posent au départ (besoin 0,30), un par étape, et non plus à l'arrivée des
       couleurs : sur l'iPhone, posés tous d'un coup à 0,70, ils faisaient une étape de 269 ms juste avant l'arrêt de la page */
    const tachePoses = () => ({ nom: 'lavis-poses', besoin: .30, gen: (function* () {
      yield;
      while (attente.length) { if (LAVIS.urgentDemande) { while (poserUn()) { /* tous */ } break; } poserUn(); yield; }
      posant = false;
    })() });
    LAVIS.taches.forEach(t => { const a = t.apres; t.apres = () => { t.calcule = true; (window.__journalLavis = window.__journalLavis || []).push([t.nom.slice(6), Math.round(performance.now()), 'calculé']); a(); }; });
    LAVIS.prepares = null;
    LAVIS.attente = chargerLavisPrets(DOSSIER, (nom, im, e) => {
      const t = LAVIS.taches.find(t2 => t2.nom === 'lavis-' + nom);
      if (!t || t.fini || t.calcule || (e.tailleSource && (e.tailleSource[0] !== t.sw || e.tailleSource[1] !== t.sh))) return;
      /* la tâche de calcul est retirée tout de suite (aucun calcul ne démarre pour un lavis qui attend d'être posé) */
      t.fini = true; t.attendImage = true;
      attente.push({ nom, im }); if (!posant) { posant = true; if (LAVIS.urgentDemande) setTimeout(poserSuivant, 0); else planifier(tachePoses()); }
    }).then(n => { window.__lavisPrepares = n; LAVIS.prepares = n; });
  }
  /* pour les essais seulement (aperçu, mesures) : tout calculer d'un coup */
  const lavisPrets = () => { lancerLavis(); LAVIS.taches.forEach(terminer); };
  /* les silhouettes des objets réels, en petit (pour effacer les lavis derrière eux) */
  const reduire = (im, w, h, k) => { const c = document.createElement('canvas'); c.width = Math.max(2, Math.round(w * k)); c.height = Math.max(2, Math.round(h * k)); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return c; };
  const silFacade = reduire(fac.image, vf.w, vf.h, .34), silPoteau = reduire(vp.image, vp.w, vp.h, .3);

  /* ---- mise en page ---- */
  /* L4 (douzième passe) : le calque des lavis (aquarelle, multiplication) et sa copie de teinte sont des lavis doux : ils
     sont tenus à une densité moindre (LDPR, 60 % de celle du monde). Safari compose ces deux calques plein écran à chaque
     image : un tiers des pixels en moins ; à l'œil, une aquarelle n'a pas de bord net (les traits restent ceux du monde) */
  let W = 0, H = 0, DPR = 1, LDPR = 1, L = {}, LAV_W = 1, LAV_H = 1;
  const TEINTE_K = TEL ? .5 : 1;   /* T2 */
  const KLAV = +(new URLSearchParams(location.search).get('klav') || .6);
  /* L4 : les moteurs WebKit (Safari, et tous les navigateurs de l'iPhone) : un calque redessiné à chaque image se vide en
     le remettant à sa taille (voir rendreLavis) */
  const RAZ_TAILLE = (() => { const u = navigator.userAgent; return (/AppleWebKit/.test(u) && !/Chrome|Chromium|Edg|Android/.test(u)) || /CriOS|FxiOS|EdgiOS/.test(u); })();
  function dims() {
    invaliderGarde();   /* V2 */
    W = scene.clientWidth; H = scene.clientHeight;
    DPR = Math.min(window.devicePixelRatio || 1, plafondDpr(W < 768 ? 1.5 : 1.75));   /* S4 */
    const mob = W < 768;
    L = { mob, F: Math.max(W * .866, H * .8), CX: W / 2, CY: H * (mob ? .54 : .5) };
    cv.forEach(c => { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); });
    /* T2 : le papier du sol et les surfaces des chemins sont des aplats et des dégradés doux : à demi-densité (0,7 Mo au lieu de 2,8) */
    if (fondSolC) { fondSolC.width = Math.round(W * DPR * KF); fondSolC.height = Math.round(H * DPR * KF); }   /* Y17 : KF */
    /* I1 : le calque des lavis, à la même résolution ; le masque de la révélation */
    LDPR = DPR * KLAV;
    /* T2 (vingtième passe) : sur téléphone, les deux calques des lavis (1 Mo chacun) ne prennent leur taille qu'à l'arrivée des
       couleurs (rendreLavis) : ils compensent le canevas du papier du sol (passe 19 : jamais plus de canevas qu'avant) */
    LAV_W = Math.round(W * LDPR); LAV_H = Math.round(H * LDPR); revele.dims(W, H);
    if (!TEL || lavC.width > 1) { lavC.width = LAV_W; lavC.height = LAV_H; lavT.width = Math.round(LAV_W * TEINTE_K); lavT.height = Math.round(LAV_H * TEINTE_K); }
    /* au croisement : on s'approche jusqu'à ce que le CV se lise, sans agrandir l'image au-delà de 1,6 */
    /* retours du 02/10/2026, point 24 : au croisement, la flèche « Atelier » tient entièrement dans le cadre, sous la barre */
    L.dCv = Math.max(1.6, L.F * kP / (mob ? 1.25 : 1.55)) * (mob ? 1 : 1.1);
    L.cvH = (pied[1] - (cvQ[0][1] + cvQ[3][1]) / 2) * kP;
    L.offX = mob ? 0 : -((W * .63 - L.CX) / L.F) * L.dCv;
    L.S_STOP2 = S_POTEAU - L.dCv;
    L.S_STOP1 = L.S_STOP2 - 2.4;
    L.pitchCv = Math.atan((L.cvH - OEIL) / L.dCv) + Math.atan(((mob ? .45 : .6) * H - L.CY) / L.F);
    L.recul = 1.7;
    L.pitchHaut = Math.atan(((pied[1] - fdQ[0][1]) * kP - .25 - OEIL) / (L.dCv + L.recul)) + Math.atan((.42 * H - L.CY) / L.F);
    const dFull = Math.min(L.F * 1.6 / (W / 2), L.F * 1.3 / L.CY, L.F * 1.4 / (H - L.CY));
    L.dFin = dFull * .9;
    construireRoute();
  }

  /* la route du tableau 5 : du recul devant le poteau jusqu'à la porte de l'atelier */
  let ROUTE_PTS = null, ROUTE_LEN = 0, RESTE_SEUIL = 0;
  function construireRoute() {
    const s2 = L.S_STOP2 - L.recul, a = PRINC.at(s2, {});
    const lat = L.offX * .4;
    const P0 = [a.x + Math.cos(a.h) * lat, a.z - Math.sin(a.h) * lat];
    const t1 = 12, b = BR.at(t1, {}), P3 = [b.x, b.z];
    const P1 = [P0[0] + Math.sin(a.h) * 4.5, P0[1] + Math.cos(a.h) * 4.5];
    const P2 = [P3[0] - Math.sin(b.h) * 4, P3[1] - Math.cos(b.h) * 4];
    const pts = [];
    for (let i = 0; i <= 60; i++) { const t = i / 60, m = 1 - t; pts.push([m * m * m * P0[0] + 3 * m * m * t * P1[0] + 3 * m * t * t * P2[0] + t * t * t * P3[0], m * m * m * P0[1] + 3 * m * m * t * P1[1] + 3 * m * t * t * P2[1] + t * t * t * P3[1]]); }
    /* cinquième passe, E4 : on s'arrête à 1,05 m de la porte, quand l'ouverture remplit le cadre (le fondu plein cadre se fait là) */
    const tEnd = T_PORTE - 1.05;
    /* O2 : l'abscisse sur le chemin de droite de chaque point de la route (null sur la courbe du départ) */
    const tPts = pts.map(() => null);
    for (let t = t1 + .5; t <= tEnd + 8; t += .5) { const q = BR.at(t, {}); pts.push([q.x, q.z]); tPts.push(t); }
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    ROUTE_PTS = { pts, cum };
    const fin = BR.at(tEnd, {});
    let best = 0, bd = 1e9;
    pts.forEach((q, i) => { const d = Math.hypot(q[0] - fin.x, q[1] - fin.z); if (d < bd) { bd = d; best = i; } });
    ROUTE_LEN = cum[best];
    /* O2 : du bout de la route (la caméra s'y arrête, l'ouverture remplit le cadre) au seuil de la porte, le long du chemin */
    RESTE_SEUIL = tPts[best] !== null ? Math.max(0, T_PORTE - tPts[best]) : Math.hypot(pts[best][0] - PORTE.x, pts[best][1] - PORTE.z);
  }
  function routeAt(u) {
    const { pts, cum } = ROUTE_PTS;
    u = clamp(u, 0, cum[cum.length - 1]);
    let i = 1; while (i < cum.length - 1 && cum[i] < u) i++;
    const t = (u - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
    return [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t)];
  }

  /* ---- la caméra ---- */
  /* quatrième passe, D6 : dès que le CV est en main, un seul pivot doux vers la flèche « Atelier » ; l'atelier est
     dans le cadre dès la fin du pivot et y reste jusqu'à la porte (la caméra le regarde en marchant). Aucune image
     sans le poteau ni l'atelier. La cible du regard : un point au-delà de la porte, dans l'axe de l'atelier. */
  const CIBLE_PORTE = [PORTE.x + AT_F[0] * 2.5, PORTE.z + AT_F[2] * 2.5];
  const versPorte = (x, z) => Math.atan2(CIBLE_PORTE[0] - x, CIBLE_PORTE[1] - z);
  const angleEntre = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };
  const cam = { x: 0, y: OEIL, z: 0, yaw: 0, pitch: 0, v: 0, dist: 0, bob: 0, reste1: 0, reste2: 0 };
  function camera(p) {
    let x, z, yaw, dist, vf, pitch = 0;
    const tmp = {};
    const baisser = 1 - eDepl(seg(p, T.pivot[0] + (T.pivot[1] - T.pivot[0]) * .35, T.pivot[1] + .004));
    if (p < T.route[0]) {
      let s, lat = 0;
      if (p <= T.marche[1]) { s = lerp(-3, L.S_STOP1, MARCHE.frac(p)); vf = MARCHE.v(p); }
      else {
        const t = eDepl(seg(p, T.approche[0], T.approche[1])), r = eDepl(seg(p, T.recul[0], T.recul[1]));
        s = lerp(L.S_STOP1, L.S_STOP2, t) - L.recul * r; lat = L.offX * (t - .6 * r); vf = 0;
        pitch = lerp(L.pitchCv * t, L.pitchHaut, r) * baisser;
      }
      const a = PRINC.at(s, tmp);
      x = a.x + Math.cos(a.h) * lat; z = a.z - Math.sin(a.h) * lat;
      let hs = 0, nn = 0; for (let d = 0; d <= 8; d += 1) { hs += PRINC.at(s + d, {}).h; nn++; }
      yaw = hs / nn; dist = s;
      /* O2 (quinzième passe) : la seule source de la distance. Le guide mène d'abord à Thibaut, au croisement (l'arrêt devant
         le CV, S_STOP2), puis à l'atelier (le seuil de la porte) ; la distance restante le long du chemin, depuis la position
         réelle de la caméra, en mètres du monde. Pendant le recul devant le poteau (1,7 m en arrière), la route vers
         l'atelier n'est pas encore entamée : sa distance reste celle du départ */
      cam.reste1 = Math.max(0, L.S_STOP2 - s); cam.reste2 = ROUTE_LEN + RESTE_SEUIL;
    } else {
      const u = ROUTE_LEN * ROUTE.frac(p);
      const q = routeAt(u); x = q[0]; z = q[1];
      vf = ROUTE.v(p) * 1.3; dist = 80 + u;
      yaw = F.h; pitch = L.pitchHaut * baisser;
      /* O2 : sur la route, la longueur de route qui reste (le long de son tracé), plus le bout de chemin jusqu'au seuil */
      cam.reste1 = 0; cam.reste2 = Math.max(0, ROUTE_LEN - u) + RESTE_SEUIL;
    }
    if (p > T.pivot[0]) yaw = angleEntre(yaw, versPorte(x, z), eDepl(seg(p, T.pivot[0], T.pivot[1])));
    /* retours du 02/10/2026 : plus de hochement de marche ; la marche se lit par le sol et le décor qui défilent */
    cam.x = x; cam.z = z; cam.y = OEIL; cam.yaw = yaw; cam.pitch = pitch; cam.v = vf; cam.dist = dist; cam.bob = 0;
    return cam;
  }

  /* ---- projection ---- */
  let cyw = 1, syw = 0, cpt = 1, spt = 0, FOC = 1000, CX = 0, CY = 0;
  function poserCam() { cyw = Math.cos(cam.yaw); syw = Math.sin(cam.yaw); cpt = Math.cos(cam.pitch); spt = Math.sin(cam.pitch); FOC = L.F; CX = L.CX; CY = L.CY; }
  function vcam(x, y, z, o) { const dx = x - cam.x, dy = y - cam.y, dz = z - cam.z, xr = dx * cyw - dz * syw, zr = dx * syw + dz * cyw; o[0] = xr; o[1] = dy * cpt - zr * spt; o[2] = dy * spt + zr * cpt; return o; }
  function pr(w, o) { const c = vcam(w[0], w[1], w[2], o || [0, 0, 0]); if (c[2] < NEAR) return null; c[0] = CX + FOC * c[0] / c[2]; c[1] = CY - FOC * c[1] / c[2]; return c; }
  function polyEcran(ws) {
    const cs = ws.map(w => vcam(w[0], w[1], w[2], [0, 0, 0])), out = [];
    for (let i = 0; i < cs.length; i++) {
      const A = cs[i], B = cs[(i + 1) % cs.length], ai = A[2] >= NEAR, bi = B[2] >= NEAR;
      if (ai) out.push(A);
      if (ai !== bi) { const t = (NEAR - A[2]) / (B[2] - A[2]); out.push([lerp(A[0], B[0], t), lerp(A[1], B[1], t), NEAR]); }
    }
    return out.map(c => [CX + FOC * c[0] / c[2], CY - FOC * c[1] / c[2]]);
  }
  function traitMonde(c, ws) {
    let prev = null, pi = false, on = false;
    for (let i = 0; i < ws.length; i++) {
      const q = vcam(ws[i][0], ws[i][1], ws[i][2], [0, 0, 0]), ci = q[2] >= NEAR;
      if (prev) {
        if (ci && !pi) { const t = (NEAR - prev[2]) / (q[2] - prev[2]); const m = [lerp(prev[0], q[0], t), lerp(prev[1], q[1], t), NEAR]; c.moveTo(CX + FOC * m[0] / m[2], CY - FOC * m[1] / m[2]); on = true; }
        else if (!ci && pi) { const t = (NEAR - prev[2]) / (q[2] - prev[2]); const m = [lerp(prev[0], q[0], t), lerp(prev[1], q[1], t), NEAR]; c.lineTo(CX + FOC * m[0] / m[2], CY - FOC * m[1] / m[2]); on = false; }
      }
      if (ci) { const x = CX + FOC * q[0] / q[2], y = CY - FOC * q[1] / q[2]; if (on) c.lineTo(x, y); else { c.moveTo(x, y); on = true; } }
      prev = q; pi = ci;
    }
  }
  const prof = w => (w[0] - cam.x) * syw + (w[2] - cam.z) * cyw;
  const brume = d => d < 16 ? 1 : clamp(1 - (d - 16) / 46);
  const epais = d => clamp(.55 + 7 / Math.max(d, .5), .6, 2.3);

  /* ---- un objet plan dans le monde : coins image -> monde -> écran ---- */
  function homographiePlan(im, coinMonde) {
    const ws = im.map(coinMonde), cs = ws.map(w => vcam(w[0], w[1], w[2], [0, 0, 0]));
    if (cs.some(c => c[2] < .35)) return null;
    const q = cs.map(c => [CX + FOC * c[0] / c[2], CY - FOC * c[1] / c[2]]);
    return { H: quadVersQuad(im, q), q, d: cs.reduce((a, c) => a + c[2], 0) / 4 };
  }
  const coinPoteau = ([x, y]) => [POTEAU[0] + RIGHT[0] * (x - pied[0]) * kP - FWD[0] * .06, (pied[1] - y) * kP, POTEAU[2] + RIGHT[2] * (x - pied[0]) * kP - FWD[2] * .06];
  const coinFacade = ([x, y]) => [PORTE.x + AT_R[0] * (x - porteCx) * kF, (solF - y) * kF, PORTE.z + AT_R[2] * (x - porteCx) * kF];
  /* un point de l'image de la façade, avancé de z mètres vers nous, à l'écran (ou null derrière la caméra) */
  const tPj = [0, 0, 0];
  /* F21, septième passe G2 : le vol de la colombe. Elle paraît quand le guide dit 160 m (avancée 0,2 sur la route) et
     se pose sur le faîte quand il dit 55 m (0,725). La trajectoire est liée à p : elle arrive du haut à gauche, passe
     un peu vers nous, tourne pour venir face au toit, ralentit, freine ailes grandes ouvertes, corps redressé, se pose,
     replie ses ailes en deux temps. Le battement est lié au temps : des salves de quatre à six battements (4,4 à 5,3
     par seconde, poses nettes, les ailes hautes et basses tenues plus longtemps), puis un plané de 0,6 à 1 s ; le
     corps monte à chaque battement, le vol remonte pendant les salves et redescend pendant les planés. Si p ne
     bouge plus, elle plane (le temps du vol s'arrête). Posée : un petit sautillement pour s'installer, la tête qui
     tourne par à-coups, le rameau qui frémit, de temps en temps un bref battement pour se rééquilibrer. */
  /* sixième passe : le guide du téléphone suit la marche réelle sur la route (et non plus une courbe à part) */
  const pAvancee = k => { let a = T.route[0], b = T.route[1]; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (ROUTE.frac(m) < k) a = m; else b = m; } return (a + b) / 2; };
  const P_VOL = [pAvancee(.2), pAvancee(.725)], P_POSE = P_VOL[1] + .003;
  const FAITE = [vf.w * .6, Math.max(4, vf.h * .013)];
  const FAITE_M = coinFacade(FAITE);
  /* l'œil de l'oiseau posé : 0,51 m au-dessus des pattes, 0,11 m vers sa tête (il arrive vers la droite, il regarde à droite) */
  /* H4 (huitième passe) : la colombe est retirée du film par défaut (ni en vol ni posée). Le code reste : ?oiseau=1 la
     rejoue, réduite à 55 % de sa taille de la septième passe, pour juger de l'échelle. Le temps de la route ne change pas. */
  /* I3 : la girouette sur le faîte, au même point que l'ancienne colombe posée ; le soleil (bas, devant à gauche) */
  const gir = creerGirouette();
  /* V2 (vingt-deuxième passe, 08/10/2026, mesure seulement) : window.__chronoMonde, posé par les essais avant le chargement, reçoit le
     temps de chaque partie du rendu du monde (et de la façade, de la girouette) ; sans lui, rien ne change */
  const CHRONO = typeof window.__chronoMonde === 'function' ? window.__chronoMonde : null;
  if (CHRONO) {
    const env = (o, k, nom) => { const f = o[k]; if (typeof f !== 'function') return; o[k] = function () { const a = performance.now(); try { return f.apply(this, arguments); } finally { CHRONO(nom, performance.now() - a); } }; };
    ['devant', 'lumiere', 'nappe', 'lampeObjet', 'silhouette', 'placer'].forEach(k => env(fac, k, 'façade.' + k)); ['dessiner', 'maj'].forEach(k => env(gir, k, 'girouette.' + k));
  }
  const SOLEIL = (() => { const az = F.h - .09, el = .26; return [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)]; })();
  const OISEAU = (() => { try { return new URLSearchParams(location.search).get('oiseau') === '1'; } catch (e) { return false; } })();
  const K_OISEAU = .55;
  const OEIL_ARRIVEE = [FAITE_M[0] + AT_R[0] * .11 * K_OISEAU, FAITE_M[1] + .51 * K_OISEAU, FAITE_M[2] + AT_R[2] * .11 * K_OISEAU];
  const volMonde = (() => {
    const Ev = OEIL_ARRIVEE;
    const S = [PORTE.x - AT_R[0] * 13 + AT_F[0] * 9, 7.6, PORTE.z - AT_R[2] * 13 + AT_F[2] * 9];
    const C1 = [S[0] + AT_R[0] * 5.5 - AT_F[0] * 7, 6.4, S[2] + AT_R[2] * 5.5 - AT_F[2] * 7];
    const C2 = [Ev[0] - AT_R[0] * 3.4 - AT_F[0] * 2.6, Ev[1] + 1.5, Ev[2] - AT_R[2] * 3.4 - AT_F[2] * 2.6];
    return u => { const m = 1 - u, b = [m * m * m, 3 * m * m * u, 3 * m * u * u, u * u * u]; return [0, 1, 2].map(i => b[0] * S[i] + b[1] * C1[i] + b[2] * C2[i] + b[3] * Ev[i]); };
  })();
  /* les salves de battements et les planés (temps de vol, en secondes) */
  const PHI0 = Math.acos(-1 / 3) / (2 * Math.PI);   /* l'aile à mi-course : la pose 3, celle du plané */
  const SALVES = (() => { const R = rng(808), L = []; let t = 0; for (let i = 0; i < 30; i++) { const n = 4 + Math.floor(R() * 3), f = 4.4 + R() * .9, tb = n / f, g = .6 + R() * .4; L.push({ tb, f, g }); t += tb + g; } return { L, T: t }; })();
  function etatVol(tv) {
    let x = tv % SALVES.T;
    for (const s of SALVES.L) { if (x < s.tb) return { bat: true, phi: PHI0 + x * s.f, k: x / s.tb }; x -= s.tb; if (x < s.g) return { bat: false, k: x / s.g }; x -= s.g; }
    return { bat: false, k: 0 };
  }
  const poseAile = phi => { const a = 1.5 - 1.5 * Math.cos(2 * Math.PI * phi); return a < .5 ? 0 : a < 1.5 ? 1 : a < 2.5 ? 2 : 3; };
  /* les gestes posés : la tête tourne par à-coups (angles et durées tirés une fois) */
  const TETE_SEQ = (() => { const R = rng(909), L = []; let t = 0; const ang = [0, -12, 6, -4, 14, -8, 3]; for (let i = 0; i < 24; i++) { const d = .8 + R() * 1.9; L.push({ t0: t, d, a: ang[Math.floor(R() * ang.length)] }); t += d; } return { L, T: t }; })();
  function angleTete(t) {
    const x = t % TETE_SEQ.T, L = TETE_SEQ.L;
    let i = 0; while (i < L.length - 1 && L[i + 1].t0 <= x) i++;
    const prec = L[(i + L.length - 1) % L.length].a;
    return lerp(prec, L[i].a, sseg(x - L[i].t0, 0, .09));
  }
  let tPrec = null, pPrec = null, battre = 0, tVol = 0, tPose = null;
  function placerOiseau(p, alpha) {
    if (!OISEAU) { oiseau.placer(null); return; }
    if (p < P_VOL[0] - .0005 || alpha <= .01) { oiseau.placer(null); tPose = null; return; }
    fluide = true;
    /* la vitesse de p (par seconde) : le temps du vol n'avance que si le film avance */
    const dt = tPrec === null ? 0 : clamp(tVent - tPrec, 0, .1), vp = dt > 0 ? Math.abs(p - pPrec) / dt : 0;
    tPrec = tVent; pPrec = p;
    battre += ((vp > .0012 ? 1 : 0) - battre) * clamp(dt * 8);
    tVol += dt * battre;
    const fixe = !!(ctx.options && ctx.options.fixe);
    const u = clamp(seg(p, P_VOL[0], P_VOL[1])), uT = 1 - Math.pow(1 - u, 1.45);
    const kp = fixe ? 1 : seg(p, P_VOL[1], P_POSE);
    /* le vol ondulé : il remonte pendant les salves, redescend pendant les planés */
    const ev = etatVol(tVol), ond = .32 * (ev.bat ? ss(ev.k) : 1 - ss(ev.k)) * (1 - sseg(u, .7, .88));
    const q = volMonde(uT), q2 = volMonde(Math.min(1, uT + .015));
    q[1] += ond;
    const a = pr(q, [0, 0, 0]), a2 = pr(q2, [0, 0, 0]), pied = pr(FAITE_M, [0, 0, 0]);
    if (!a && !pied) { oiseau.placer(null); return; }
    const dx = a && a2 ? a2[0] - a[0] : 1, dyv = a && a2 ? a2[1] - a[1] : 0, gauche = dx < 0;
    /* les ailes : salve (poses nettes), plané (pose 3), freinage ailes grandes ouvertes (pose 1), pliage en deux temps */
    let idx = 2, bob = 0;
    if (battre > .5 && ev.bat) { idx = poseAile(ev.phi); bob = 14 * Math.cos(2 * Math.PI * ev.phi); }
    const frein = sseg(u, .86, .95);
    if (u > .86) { idx = 0; bob = 0; }
    if (kp > 0) idx = kp < .4 ? 2 : 3;
    const pente = clamp(Math.atan2(dyv, Math.abs(dx) + 1e-3) * 180 / Math.PI * .5, -16, 16) * (1 - frein);
    const assiette = (gauche ? -pente : pente) + (gauche ? 18 : -18) * frein * (1 - sseg(kp, .3, .7));
    const kV = (a ? FOC / Math.max(a[2], NEAR) : 1) * K_OISEAU, kP = (pied ? FOC / Math.max(pied[2], NEAR) : 1) * K_OISEAU;
    const cf = fixe ? 1 : sseg(kp, .6, .9);
    /* posée : sautillement, tête par à-coups, rameau qui frémit, bref battement de temps en temps */
    if (cf >= 1) { if (tPose === null) tPose = tVent; } else tPose = null;
    const tp = tPose === null ? 0 : tVent - tPose;
    const saut = fixe ? 0 : kP * (.07 * Math.max(0, Math.sin(Math.PI * seg(tp, .04, .3))) + .045 * Math.max(0, Math.sin(Math.PI * seg(tp, .36, .56))));
    let battement = null;
    const cyc = (tVent + 2.1) % 6.8;
    if (!fixe && tp > 1.4 && cyc < .55) {
      const kb = cyc / .55;
      battement = { idx: poseAile(PHI0 + kb * 3.2), op: sseg(kb, 0, .12) * (1 - sseg(kb, .86, 1)) };
    }
    const sautB = battement ? kP * .05 * Math.sin(Math.PI * clamp(cyc / .55)) : 0;
    const t = tVent, frisson = .9 * Math.sin(t * 11.3) + .5 * Math.sin(t * 17.1 + 1);
    oiseau.placer({
      vol: cf < 1 && a ? { x: a[0], y: a[1], kpx: kV, miroir: gauche, idx, assiette, bob, op: alpha * clamp((p - P_VOL[0]) / .003 + .0001) * (1 - cf), min: 92 * K_OISEAU } : null,
      pose: cf > 0 && pied ? { x: pied[0], y: pied[1], kpx: kP, miroir: !gauche, op: alpha * cf, tete: fixe ? 0 : angleTete(t), frisson, saut: saut + sautB, battement } : null
    });
  }
  const pjFacade = (x, y, z) => { const w = coinFacade([x, y]); w[0] -= AT_F[0] * z; w[2] -= AT_F[2] * z; const q = pr(w, tPj); return q ? [q[0], q[1]] : null; };
  /* I2 : la lampe de l'atelier, suspendue au-dessus de la table : 2,6 m derrière la porte, 0,38 m à droite de son axe, à
     2,55 m du sol (derrière le vitrage haut, vue de dehors). I1 : la couleur part d'elle */
  const LAMPE = (() => { const b = coinFacade([porteCx, solF]); return [b[0] + AT_F[0] * 2.6 + AT_R[0] * .38, 2.55, b[2] + AT_F[2] * 2.6 + AT_R[2] * .38]; })();
  /* J2 : avec le vrai luminaire, la lampe est accrochée à la lampe de la photo de la table (lampeEcran, l'ampoule à
     l'écran, recalculée à chaque image) : c'est d'elle que part la couleur (I1) */
  let lampeEcran = null;
  const centreLampe = () => { if (lampeEcran) return lampeEcran.slice(); const q = pr(LAMPE, [0, 0, 0]); return q ? [q[0], q[1]] : [W / 2, H * .42]; };
  let geoLointain = null, par = null;

  /* =====================================================================
     Rendu d'une image du monde
     ===================================================================== */
  const tA = [0, 0, 0], tB = [0, 0, 0];
  let info = {};
  /* I1 : les touffes d'herbe au trait de l'image en cours (x, y, hauteur, visibilité, graine), pour leur touche d'aquarelle */
  const TOUFFES = [];
  /* V2 (vingt-deuxième passe) : la garde (voir rendre) : la signature de la dernière image dessinée, ce qui bouge seul à l'écran,
     une version relevée à chaque visuel ou tâche prête (ctx.redessiner, film.js), le canevas de devant resté vide */
  const GARDE = (() => { try { return new URLSearchParams(location.search).get('garde') !== '0'; } catch (e) { return true; } })();
  let sigPrec = null, animeVu = false, versionGarde = 0, c2Vide = false;
  const ressources = () => (SOLGL ? 1 : 0) + (solTex ? 2 : 0) + (solMotif ? 4 : 0) + (muretImg ? 8 : 0) + (CALADE.ink ? 16 : 0) + (SOLGL && solTex && SOLGL.pret(solTex) ? 32 : 0) + (SOLGL && CALADE.ink && SOLGL.pret(CALADE.ink[0]) ? 64 : 0) + HERBES.length * 128;
  const invaliderGarde = () => { sigPrec = null; versionGarde++; };
  let repose = false;   /* N1 (quatorzième passe) : calques plein écran rendus (téléphone, atelier) */
  const RANGS = new Map();
  function rendre(p, o = {}) {
    if (!W) return info;
    /* N1 : rendu demandé après un repos (retour depuis l'atelier) : les calques reprennent leur taille d'abord */
    if (repose) { repose = false; dims(); }
    camera(p); poserCam(); fluide = false; TOUFFES.length = 0; RANGS.clear();   /* T2 : le cache des rangs du sol, par image */
    const alpha = o.alpha === undefined ? 1 : o.alpha;
    const portee = lerp(9, 70, sseg(p, T.monde[0], T.monde[1] + .02));
    const vis = d => brume(d) * clamp((portee - d) / 6);
    /* V2 (vingt-deuxième passe, 08/10/2026) : l'effacement des canevas du monde attend la décision de la garde (plus bas) : sol, le
       sol gardé (son canevas c0 et le papier du sol ne sont pas effacés) ; le canevas de devant (c2), s'il est resté vide à l'image
       d'avant, n'est pas effacé */
    const effacer = sol => {
      g.forEach((c, i) => { if (i === 0 && sol) return; c.setTransform(1, 0, 0, 1, 0, 0); if (!(i === 2 && c2Vide)) c.clearRect(0, 0, c.canvas.width, c.canvas.height); c.setTransform(DPR, 0, 0, DPR, 0, 0); c.globalAlpha = alpha; c.lineCap = 'round'; c.lineJoin = 'round'; });
      if (gF && !sol) { gF.setTransform(1, 0, 0, 1, 0, 0); gF.clearRect(0, 0, fondSolC.width, fondSolC.height); gF.setTransform(DPR * KF, 0, 0, DPR * KF, 0, 0);   /* Y17 : KF */ gF.globalAlpha = alpha; setV(fondSolC, true); }   /* T2 */
    };
    info = { cam, L };
    /* les objets réels : poteau, façade */
    let hp = homographiePlan(imPoteau, coinPoteau);
    secousse = o.secousse || [0, 0];
    if (hp && o.secousse) hp = Object.assign({}, hp, { H: mult3([1, 0, secousse[0], 0, 1, secousse[1], 0, 0, 1], hp.H) });
    /* F1 : l'atelier n'existe à l'image qu'une fois la caméra tournée vers le chemin de droite (il est alors encore
       hors du cadre, il y entre pendant le pivot ; avant, le rideau de cyprès le cacherait de toute façon) */
    const hf = p >= T.pivot[0] ? homographiePlan(imFacade, coinFacade) : null;
    const dP = hp ? hp.d : -1, dF = hf ? hf.d : 1e9;
    placerPoteau(hp, p, alpha * vis(Math.max(0, dP)));
    /* E8 : la façade est opaque dès qu'elle apparaît ; la distance se lit par un voile de papier clair */
    placerFacade(hf, p, alpha, dF);
    /* J2 : la lampe accrochée à la lampe de la photo de la table, posée comme elle le sera (lampe -> écran) */
    let lampeT = null; lampeEcran = null;
    if (hf && info.porte && VLAMPE && ctx.lampeTable && ctx.lampePhoto) {
      const Hq = ctx.lampeTable(p, info.porte), lph = ctx.lampePhoto;
      if (Hq) {
        const M = mult3(Hq, [lph.k, 0, lph.ox, 0, lph.k, lph.oy, 0, 0, 1]); lampeT = { M };
        const a = (VLAMPE.reperes.ampoule || [.5106, .8614]);
        lampeEcran = appl(M, a[0] * VLAMPE.w, a[1] * VLAMPE.h);
      }
    }
    if (alpha <= .001) { sigPrec = null; effacer(false); }   /* V2 : effacés comme avant */
    if (alpha <= .001 && encSolC) { setV(encSolC, false); setV(fondSolC, false); }   /* T2 */
    if (alpha <= .001) { setV(lavC, false); setV(lavT, false); setV(lavSolC, false); return info; }
    const CH = typeof window.__chronoMonde === 'function' ? window.__chronoMonde : null;   /* V2 (mesure) : lu à chaque image (il peut être posé après le chargement, sur l'appareil) */
    let tc = CH ? performance.now() : 0; const marque = CH ? n => { const t = performance.now(); CH(n, t - tc); tc = t; } : null;   /* V2 (mesure) */
    if (marque) marque('caméra, poteau, façade');
    /* le raccord avec la gravure (voir plus bas) : tant que le dessin monte, l'encre du sol reste dans le canevas du sol (T2) */
    const kr = eDepl(seg(p, T.monde[0] + .003, T.monde[0] + .07));
    /* lumière dorée sur la branche de droite (tableau 5) : son avancée (V2 : calculée ici, elle entre dans la signature de la garde) */
    const kl = sseg(p, T.flecheSoleil[0], T.flecheSoleil[1] + .01) * (1 - sseg(p, .742, .76));
    /* V2 (vingt-deuxième passe, 08/10/2026) : la garde. Entre le CV et la route (p 0,55 à 0,655), la caméra est arrêtée devant le
       poteau : chaque image redessinait le monde (trois canevas, le sol au WebGL, le papier du sol) à l'identique. Quand tout ce
       qui entre dans le dessin est le même qu'à l'image d'avant (la taille, la caméra, l'opacité, la portée, la lumière dorée,
       la secousse, les visuels prêts) et qu'il n'y a ni façade (sa lampe, sa girouette), ni oiseau, ni lavis, ni raccord avec la
       gravure, le sol garde son image : son canevas (c0 : le papier, les surfaces, l'encre, les ombres, la lumière dorée, le
       chemin au burin), le rendu WebGL de l'encre et le papier du sol ne sont ni effacés ni redessinés. Les objets debout (c1,
       c2) sont redessinés, sauf si rien de ce qui bouge seul n'est à l'écran (les herbes du pied du poteau, au vent) : alors
       rien ne l'est, seuls le poteau et ses éléments sont reposés (plus haut). L'image est la même ; ?garde=0 l'écarte pour les
       essais. Sans façade, aucun objet ne va dans c0 (il n'y va que derrière la façade). */
    const sig = GARDE && !hf && kr >= 1 && p < T.lavis[0] && !OISEAU ? [W, H, DPR, cam.x, cam.y, cam.z, cam.yaw, cam.pitch, cam.v, FOC, CX, CY, alpha, portee, kl, secousse[0], secousse[1], !!hp, ressources(), versionGarde].join(',') : null;
    const garderSol = sig !== null && sig === sigPrec;
    if (garderSol && !animeVu) { if (marque) marque('garde'); return info; }
    sigPrec = null; animeVu = false;
    if (marque && garderSol) marque('sol gardé');   /* V2 (mesure) */
    effacer(garderSol);
    const c0 = g[0], cF = gF || c0;   /* T2 : le papier et les surfaces des chemins, sous l'encre du sol sur téléphone */
    const yh = CY + FOC * Math.tan(cam.pitch);
    /* le sol : papier, il recouvre le bas de la gravure */
    const gr = cF.createLinearGradient(0, yh - 2, 0, yh + H * .3);
    gr.addColorStop(0, 'rgba(242,239,231,0)'); gr.addColorStop(.18, 'rgba(242,239,231,.74)'); gr.addColorStop(.45, 'rgba(242,239,231,.97)'); gr.addColorStop(1, 'rgba(242,239,231,1)');
    if (!garderSol) { cF.fillStyle = gr; cF.fillRect(0, Math.max(0, yh - 2), W, H); }   /* V2 : la garde du sol */
    let sCam = 0; { let bd = 1e9; for (let s = -14; s < SF + 15; s += 1) { const q = PRINC.at(s, {}); const d = (q.x - cam.x) ** 2 + (q.z - cam.z) ** 2; if (d < bd) { bd = d; sCam = s; } } }
    /* surfaces des chemins, d'un ton plus clair */
    const gp = cF.createLinearGradient(0, yh, 0, yh + H * .28);
    gp.addColorStop(0, 'rgba(250,248,242,0)'); gp.addColorStop(.25, 'rgba(250,248,242,.85)'); gp.addColorStop(1, 'rgba(250,248,242,1)');
    /* I1 : le contexte et le style en paramètres (la même surface reçoit l'ocre du chemin dans le calque des lavis) */
    const surf = (ch, a, b, cc = cF, style = gp) => {
      if (b <= a) return; const G = [], D = [];
      for (let s = a; s <= b + 1e-6; s += 1) { G.push(ch.pt(s, -DEMI, 0)); D.push(ch.pt(s, DEMI, 0)); }
      const pe = polyEcran(G.concat(D.reverse())); if (pe.length < 3) return;
      cc.fillStyle = style; cc.beginPath(); pe.forEach((q, i) => i ? cc.lineTo(q[0], q[1]) : cc.moveTo(q[0], q[1])); cc.closePath(); cc.fill();
    };
    const sMin = sCam - 2, sMax = Math.min(SF, sCam + 66);
    if (!garderSol) { surf(PRINC, sMin, sMax); surf(BR, 0, 46); surf(BL, 0, 46); }   /* V2 */
    if (marque) marque('sol, papier');
    /* la texture du sol, segment par segment (affine par morceaux, plus fin près de nous) */
    /* I1 : le contexte, les motifs et leurs échelles en paramètres (la tuile du lavis est à la moitié de la résolution) */
    const SOL_K = [1, 2, 4, 8];
    /* J12 : la bande de la calade posée en perspective sur le chemin de l'atelier, tronçon par tronçon (affine par
       morceaux, comme la tuile) ; lav : dans le calque des lavis (le masque efface la terre, puis la couleur) */
    const calade = (cc, lav) => {
      if (!CALADE.ink) return;
      const { s0: S0, s1: S1, demi: Dm } = CAL, K = CALADE.K || CAL.K;
      cc.save();
      let a = Math.max(S0, BR.s0), m0 = cc.getTransform();
      while (a < S1) {
        const dm = prof(BR.pt(a, 0, 0, tB)), ds = dm < 4 ? .25 : dm < 12 ? .5 : 1.2, b = Math.min(S1, a + ds);
        if (dm > .5 && dm < 44) {
          const P0 = pr(BR.pt(a, -Dm, 0, [0, 0, 0]), [0, 0, 0]), P1 = pr(BR.pt(a, Dm, 0, [0, 0, 0]), [0, 0, 0]), P2 = pr(BR.pt(b, -Dm, 0, [0, 0, 0]), [0, 0, 0]);
          if (P0 && P1 && P2) {
            const r = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]) / (2 * Dm * K);
            const imgs = lav ? [CALADE.masque, CALADE.lav] : [CALADE.ink[r < .18 ? 2 : r < .38 ? 1 : 0]];
            const ka = (lav ? 1 : alpha) * clamp(vis(dm) * 1.2) * (1 - seg(dm, 30, 44));
            imgs.forEach((im, idx) => {
              const kx = im.width / ((S1 - S0) * K), sx = (a - S0) * K * kx, sw = Math.max(.5, (b - a) * K * kx), sh = im.height;
              const ax = (P2[0] - P0[0]) / sw, ay = (P2[1] - P0[1]) / sw, bx = (P1[0] - P0[0]) / sh, by = (P1[1] - P0[1]) / sh;
              cc.setTransform(m0.a * ax, m0.a * ay, m0.a * bx, m0.a * by, m0.a * P0[0] + m0.e, m0.a * P0[1] + m0.f);
              cc.globalAlpha = ka; cc.globalCompositeOperation = lav ? (idx ? 'source-over' : 'destination-out') : 'source-over';
              cc.drawImage(im, sx, 0, sw + .6 * kx, sh, 0, 0, sw + .6 * kx, sh);
            });
          }
        }
        a = b;
      }
      cc.setTransform(m0); cc.restore();
    };
    const solChemin = (ch, a, b, cc = c0, motifs = solMotifs, kM = SOL_K, ka = alpha, attenue = true, dm = DEMI) => {
      if (!solMotif || !motifs) return;
      let s0 = a;
      while (s0 < b) {
        const dm = prof(ch.pt(s0, 0, 0, tB));
        const ds = dm < 6 ? .5 : dm < 18 ? 1 : 2.5, s1 = Math.min(b, s0 + ds);
        if (dm > .9 && dm < 48) {
          const P0 = pr(ch.pt(s0, -dm, 0, [0, 0, 0]), [0, 0, 0]), P1 = pr(ch.pt(s0, dm, 0, [0, 0, 0]), [0, 0, 0]), P2 = pr(ch.pt(s1, -dm, 0, [0, 0, 0]), [0, 0, 0]), P3 = pr(ch.pt(s1, dm, 0, [0, 0, 0]), [0, 0, 0]);
          if (P0 && P1 && P2 && P3) {
            /* la finesse : une version réduite dès que la tuile serait réduite à l'écran */
            const r = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]) / (solT * 2 * dm / LT), L = Math.max(0, Math.min(3, Math.floor(-Math.log2(Math.max(r, 1e-3)))));
            const mot = motifs[L], kL = kM[L], T2 = LT * 2;
            const ku = LT / solT / (2 * dm) * kL, kv = LT / solT / (s1 - s0) * kL, base = Math.floor(s0 / T2) * T2;
            const a1 = ku * (P1[0] - P0[0]), b1 = ku * (P1[1] - P0[1]), c1 = kv * (P2[0] - P0[0]), d1 = kv * (P2[1] - P0[1]);
            const o = (-LT / 2 + dm) / (2 * dm), ov = (base - s0) / (s1 - s0);
            mot.setTransform(new DOMMatrix([a1, b1, c1, d1, P0[0] + o * (P1[0] - P0[0]) + ov * (P2[0] - P0[0]), P0[1] + o * (P1[1] - P0[1]) + ov * (P2[1] - P0[1])]));
            cc.globalAlpha = ka * clamp(vis(dm) * 1.2) * (1 - seg(dm, 30, 48)) * (attenue ? lerp(1, .42, seg(dm, 3, 24)) : 1);
            cc.fillStyle = mot; cc.beginPath(); cc.moveTo(P0[0], P0[1]); cc.lineTo(P1[0], P1[1]); cc.lineTo(P3[0], P3[1]); cc.lineTo(P2[0], P2[1]); cc.closePath(); cc.fill();
          }
        }
        s0 = s1;
      }
      cc.globalAlpha = ka;
    };
    /* K12 (onzième passe) : le sol fixe sous nos pas. Un ruban de triangles en coordonnées du sol (un rang tous les 0,25 m
       du chemin, aux mêmes points que le chemin, plus les deux bouts), chaque sommet projeté par la caméra en double
       précision ; la carte graphique interpole en perspective exacte et échantillonne la texture avec ses mipmaps. La
       texture est attachée au sol (u en travers, v le long du chemin, en mètres) ; l'opacité ne dépend que de la
       profondeur du point du chemin (brume, portée, fondu au loin, un fondu très proche au lieu de la coupure à 0,9 m). */
    const PROJ = { CX, CY, FOC, W, H, NEAR };
    /* ns : les écarts à l'axe des points d'un rang (m) ; tex(s, n) : coordonnées de texture ; opa(dm, n) : opacité */
    const rangsSol = (ch, a, b, ns, tex, opa) => {
      const r = [], pas = .25;
      if (b <= a) return r;
      /* T2 (vingtième passe) : sur téléphone, les rangs du sol (un tous les 0,25 m, quatre points chacun, recalculés à chaque
         image) coûtaient 3,3 à 4,5 ms de calcul par image sur l'iPhone, et autant pour les envoyer : ils sont gardés tous les
         0,25 m jusqu'à 8 m de la caméra, tous les 0,5 m jusqu'à 18 m, tous les mètres au-delà, toujours aux mêmes points du sol
         (la texture est attachée au sol en perspective exacte par la carte graphique : elle ne glisse pas) ; et la position de
         chaque rang est calculée une fois par image pour l'encre et le lavis du sol (cache de l'image) */
      const cle = (ch === PRINC ? 'P' : ch === BR ? 'R' : ch === BL ? 'L' : '?') + ':' + a + ':' + b + ':' + ns.join(',');
      let base = RANGS.get(cle);
      if (!base) {
        base = [];
        const un = (s, dm) => { if (dm === undefined) dm = prof(ch.pt(s, 0, 0, tB)); base.push({ s, dm, p: ns.map(n => { const P = ch.pt(s, n, 0, [0, 0, 0]); return vcam(P[0], P[1], P[2], [0, 0, 0]); }) }); };
        un(a);
        for (let k = Math.floor(a / pas) + 1; k * pas < b - 1e-6; k++) {
          const s = k * pas;
          if (!TEL) { un(s); continue; }
          const dm = prof(ch.pt(s, 0, 0, tB)), st = dm < 8 ? 1 : dm < 18 ? 2 : 4;
          /* (derrière la caméra ou au-delà de 50 m, où l'encre est nulle : aucun rang, sauf les deux bouts) */
          if (dm < -1 || dm > 50) continue;
          if (k % st === 0) un(s, dm);
        }
        un(b);
        RANGS.set(cle, base);
      }
      for (const q of base) r.push({ p: q.p, t: ns.map(n => tex(q.s, n)), a: ns.map(n => opa(q.dm, n)) });
      return r;
    };
    /* la terre : comme avant, la tuile couvre aussi les bas-côtés (l'ancien tracé l'étendait à toute la largeur visible,
       sa demi-largeur étant remplacée par la profondeur) ; ici une largeur fixe au sol, 3,5 m de part et d'autre à
       pleine opacité, puis un fondu jusqu'à 9 m */
    const NS = [-9, -3.5, 3.5, 9], lat = n => 1 - seg(Math.abs(n), 3.5, 9);
    const texSol = () => (s, n) => [(n + LT / 2) / LT, s / (2 * LT)];
    const opaSol = attenue => (dm, n) => clamp(vis(dm) * 1.2) * (1 - seg(dm, 30, 48)) * (attenue ? lerp(1, .42, seg(dm, 3, 24)) : 1) * seg(dm, .45, .9) * lat(n);
    const NC = [-CAL.demi, CAL.demi];
    const texCal = (s, n) => [(s - CAL.s0) / (CAL.s1 - CAL.s0), (n + CAL.demi) / (2 * CAL.demi)];
    const opaCal = dm => clamp(vis(dm) * 1.2) * (1 - seg(dm, 30, 44)) * seg(dm, .3, .5);
    const calA = Math.max(CAL.s0, BR.s0);
    /* le résultat du rendu, posé dans un calque 2D (k : opacité, mode : composition) */
    const poserGL = (cc, k, mode, G = SOLGL) => { if (!G.rendre()) return; const B = G.bande; cc.save(); cc.setTransform(1, 0, 0, 1, 0, 0); cc.globalAlpha = k; cc.globalCompositeOperation = mode; cc.drawImage(G.source(), 0, B.y, G.canvas.width, B.h, 0, B.y, G.canvas.width, B.h); cc.restore(); };
    /* L4 : le lavis du sol rendu dans la page (aucune recopie) ; k : la révélation (0 à 1), son masque est celui du calque
       des lavis ; renvoie faux s'il n'est pas prêt (l'ancien tracé dans le calque des lavis prend alors le relais) */
    const solGLLavisPage = k => {
      const G = GLV.sol;
      if (!(G && LAVIS.solTex && G.pret(LAVIS.solTex))) return false;
      G.debut(lavC.width, lavC.height);
      const yh = (CY + FOC * Math.tan(cam.pitch)) * LDPR, [tr, tv, tb] = PALETTE.terre;
      G.quadTerre(yh, [tr / 255, tv / 255, tb / 255]);
      [[PRINC, sMin, Math.min(SF, sMax)], [BR, 0, 40], [BL, 0, 40]].forEach(([ch, a, b]) => G.ruban(LAVIS.solTex, true, rangsSol(ch, a, b, NS, texSol(), opaSol(false)), PROJ));
      if (CALADE.masque && G.pret(CALADE.masque) && G.pret(CALADE.lav)) {
        const rg = rangsSol(BR, calA, CAL.s1, NC, texCal, opaCal);
        G.ruban(CALADE.masque, false, rg, PROJ, true); G.ruban(CALADE.lav, false, rg, PROJ);
      }
      let mq = null;
      if (!REDUIT && k < 1) { revele.calculer(centreLampe(), k); mq = revele.masque(); }
      if (mq) G.quadMasque(mq.c, [1 / (LDPR * mq.S * mq.mw), 1 / (LDPR * mq.S * mq.mh), 1.5 / mq.mw, 1.5 / mq.mh]);
      if (!G.rendre()) G.vider();
      return true;
    };
    const solGLEncre = () => {
      SOLGL.debut(c0.canvas.width, c0.canvas.height);
      [[PRINC, sMin, Math.min(SF, sMax)], [BR, 0, 40], [BL, 0, 40]].forEach(([ch, a, b]) => SOLGL.ruban(solTex, true, rangsSol(ch, a, b, NS, texSol(), opaSol(true)), PROJ));
      /* J12 : la calade, sur la terre du chemin de l'atelier */
      if (CALADE.ink && SOLGL.pret(CALADE.ink[0])) SOLGL.ruban(CALADE.ink[0], false, rangsSol(BR, calA, CAL.s1, NC, texCal, opaCal), PROJ);
      /* T2 : sur téléphone, rendu dans son canevas de la page, sans recopie */
      if (ENC_PAGE && kr >= 1) { if (!SOLGL.rendre()) SOLGL.vider(); setV(encSolC, true); setO(encSolC, alpha); }
      else { if (encSolC) setV(encSolC, false); poserGL(c0, alpha, 'source-over'); }
    };
    if (garderSol) { /* V2 : l'encre du sol garde son image */ }
    else if (SOLGL && solTex && !window.__sansSolGL) solGLEncre();
    else {
      if (encSolC) setV(encSolC, false);
      solChemin(PRINC, Math.max(sMin, sCam + .4), Math.min(SF, sMax)); solChemin(BR, 0, 40); solChemin(BL, 0, 40);
      /* J12 : la calade, sur la terre du chemin de l'atelier */
      calade(c0, false);
    }
    if (marque) marque('sol, encre');
    /* ombres portées des cyprès : le soleil est devant, à gauche ; elles viennent vers nous */
    const dirO = [-FWD[0] * .82 + RIGHT[0] * .58, 0, -FWD[2] * .82 + RIGHT[2] * .58];
    c0.fillStyle = ink(.10 * alpha);
    if (!garderSol) DECOR.cy.forEach(ob => {   /* V2 */
      const w = ob.abs || ob.chem.pt(ob.s, ob.n, 0, [0, 0, 0]); const d = prof(w); if (d < 1 || d > 50) return;
      const L0 = 9 * (ob.h || 1) * (ob.k7 ? ob.k7.eh : 1), lw = .55 * (ob.k7 ? ob.k7.ew : 1);
      const pts = [[w[0] - RIGHT[0] * lw, 0, w[2] - RIGHT[2] * lw], [w[0] + RIGHT[0] * lw, 0, w[2] + RIGHT[2] * lw], [w[0] + dirO[0] * L0 + RIGHT[0] * .1, 0, w[2] + dirO[2] * L0 + RIGHT[2] * .1], [w[0] + dirO[0] * L0 - RIGHT[0] * .1, 0, w[2] + dirO[2] * L0 - RIGHT[2] * .1]];
      const pe = polyEcran(pts); if (pe.length < 3) return;
      c0.globalAlpha = alpha * vis(d); c0.beginPath(); pe.forEach((q, i) => i ? c0.lineTo(q[0], q[1]) : c0.moveTo(q[0], q[1])); c0.closePath(); c0.fill();
    });
    c0.globalAlpha = alpha;
    /* la façade posée sur le sol : ombre de contact le long du mur et sous la marche */
    if (hf && !garderSol) {   /* V2 (sans façade sous la garde : pour la règle) */
      const L0 = facadeL[0], L1 = facadeL[1], pts = [[L0, 0], [L1, 0], [L1, .55], [L0, .55]].map(([x, f]) => [PORTE.x + AT_R[0] * x - AT_F[0] * f, 0, PORTE.z + AT_R[2] * x - AT_F[2] * f]);
      const pe = polyEcran(pts);
      if (pe.length > 2) {
        const a = pr(pts[0], [0, 0, 0]), b = pr(pts[3], [0, 0, 0]);
        if (a && b) {
          const gs = c0.createLinearGradient(a[0], a[1], b[0], b[1]); gs.addColorStop(0, ink(.42)); gs.addColorStop(.35, ink(.16)); gs.addColorStop(1, ink(0));
          c0.save(); c0.globalAlpha = alpha; c0.fillStyle = gs; c0.beginPath(); pe.forEach((q, i) => i ? c0.lineTo(q[0], q[1]) : c0.moveTo(q[0], q[1])); c0.closePath(); c0.fill(); c0.restore();
        }
      }
    }
    /* lumière dorée sur la branche de droite (tableau 5) ; V2 : kl est calculé plus haut */
    if (kl > 0 && !garderSol) {
      const tl = lerp(0, T_PORTE, kl), G = [], D = [];
      for (let t = 0; t <= tl + 1e-6; t += 1) { G.push(BR.pt(t, -DEMI * .92, .001)); D.push(BR.pt(t, DEMI * .92, .001)); }
      const pe = polyEcran(G.concat(D.reverse()));
      if (pe.length > 2) {
        const gl = c0.createLinearGradient(0, yh, 0, yh + H * .3);
        /* E5 : une lumière à peine dorée, sans les traits orangés (le sol garde la teinte de la gravure) */
        gl.addColorStop(0, 'rgba(244,162,97,0)'); gl.addColorStop(.2, 'rgba(244,190,130,.07)'); gl.addColorStop(1, 'rgba(244,196,140,.1)');
        c0.fillStyle = gl; c0.beginPath(); pe.forEach((q, i) => i ? c0.lineTo(q[0], q[1]) : c0.moveTo(q[0], q[1])); c0.closePath(); c0.fill();
      }
    }
    if (marque) marque('ombres, lumière');
    /* le chemin au burin : bords, ornières, bande d'herbe, cailloux, touffes, sillons */
    const troncon = (ch, a, b, opt) => {
      for (let s = Math.floor(a / 3) * 3; s < b; s += 3) {
        const s1 = Math.min(s + 3, b), sm = (s + s1) / 2;
        const d = prof(ch.pt(sm, 0, 0, tB)); if (d < -4) continue;
        /* T2 (vingtième passe) : sur téléphone, le chemin au burin s'arrête à 40 m (au-delà, des traits de moins d'un pixel, à peine
           visibles dans la brume) ; les hachures du talus sont deux fois moins serrées et les sillons des vignes s'arrêtent à
           30 m : 3 à 7 ms de tracé par image sur l'iPhone, la moitié en moins */
        if (TEL && d > 40) continue;
        const v = vis(Math.max(d, 0)); if (v <= .01) continue;
        const lw = epais(Math.max(d, 1)), k = Math.round(s * 7) + (opt.id || 0) * 1000;
        /* F4 : le talus. Un liseré d'ombre entre le chemin et les vignes (le bord du talus porte son ombre sur le
           chemin), et de courtes hachures en travers du talus, plus serrées près de nous */
        if (d < 32) {
          [-1, 1].forEach((cote, side) => {
            if (opt.sans && opt.sans(side, s)) return;
            const G = [], D = [];
            for (let q = s; q <= s1 + 1e-6; q += .5) { G.push(ch.pt(q, cote * (DEMI - .02), .001)); D.push(ch.pt(q, cote * (DEMI + .42 + .08 * Math.sin(q * 1.7 + side)), .001)); }
            const pe = polyEcran(G.concat(D.reverse())); if (pe.length < 3) return;
            c0.fillStyle = ink(.075 * v); c0.beginPath(); pe.forEach((q, i) => i ? c0.lineTo(q[0], q[1]) : c0.moveTo(q[0], q[1])); c0.closePath(); c0.fill();
          });
          c0.strokeStyle = ink(.3 * v); c0.lineWidth = lw * .5; c0.beginPath();
          const nbT = TEL ? (d < 12 ? 7 : 4) : (d < 12 ? 14 : 7);
          [-1, 1].forEach((cote, side) => {
            if (opt.sans && opt.sans(side, s)) return;
            for (let i = 0; i < nbT; i++) { const q = s + (i + hash(k, i + 700 + side * 50)) * 3 / nbT, a = DEMI + .06 + hash(k, i + 760) * .1; traitMonde(c0, [ch.pt(q, cote * a, 0), ch.pt(q + .08, cote * (a + .18 + hash(k, i + 790) * .14), .04)]); }
          });
          c0.stroke();
        }
        c0.strokeStyle = ink(.82 * v); c0.lineWidth = lw; c0.beginPath();
        [-DEMI, DEMI].forEach((n, side) => { if (opt.sans && opt.sans(side, s)) return; const pts = []; for (let q = s; q <= s1 + 1e-6; q += .5) pts.push(ch.pt(q, n + (hash(k + q * 2, side) - .5) * .09, 0)); traitMonde(c0, pts); });
        c0.stroke();
        if (solMotif) {
          /* la tuile porte déjà les ornières et les cailloux : on garde les bords et les herbes */
        } else {
        /* ornières : deux bandes de hachures serrées */
        c0.strokeStyle = ink(.34 * v); c0.lineWidth = lw * .62; c0.beginPath();
        [-.5, .5].forEach((n, side) => { for (let j = 0; j < 3; j++) { const pts = []; for (let q = s; q <= s1 + 1e-6; q += .75) pts.push(ch.pt(q, n + (j - 1) * .07 + (hash(k + q * 3, side + 9 + j) - .5) * .04, 0)); traitMonde(c0, pts); } });
        c0.stroke();
        /* hachures transversales du sol, plus serrées au bord */
        if (d < 30) {
          c0.strokeStyle = ink(.22 * v); c0.lineWidth = lw * .5; c0.beginPath();
          for (let i = 0; i < 26; i++) { const q = s + hash(k, i + 200) * 3, n = (hash(k, i + 300) - .5) * 2 * DEMI * .95, l = .12 + hash(k, i + 400) * .22; traitMonde(c0, [ch.pt(q, n, 0), ch.pt(q + .05, n + l, 0)]); }
          c0.stroke();
        }
        /* cailloux, avec leur ombre à droite */
        c0.strokeStyle = ink(.55 * v); c0.lineWidth = lw * .75; c0.beginPath();
        const nb = d < 25 ? 10 : 4;
        for (let i = 0; i < nb; i++) {
          const q = s + hash(k, i * 3 + 1) * 3, n = (hash(k, i * 3 + 2) - .5) * 2 * (DEMI - .12);
          const c = pr(ch.pt(q, n, 0, tB), tA); if (!c) continue; const r = FOC * (.025 + hash(k, i + 90) * .03) / c[2];
          if (r > .6) { c0.moveTo(c[0] + r, c[1]); c0.ellipse(c[0], c[1], r, r * .55, 0, 0, Math.PI * 2); c0.moveTo(c[0] + r * .2, c[1] + r * .5); c0.lineTo(c[0] + r * 1.6, c[1] + r * .6); }
        }
        c0.stroke();
        }
        /* touffes d'herbe des bas-côtés (au trait, seulement sans herbes gravées) */
        if (d < 34 && !HERBES.length) {
          c0.strokeStyle = ink(.66 * v); c0.lineWidth = lw * .72; c0.beginPath();
          for (let i = 0; i < 10; i++) {
            const q = s + hash(k, i + 60) * 3, side = i % 2 ? 1 : -1;
            if (opt.sans && opt.sans(side > 0 ? 1 : 0, q)) continue;
            const n = side * (DEMI + .05 + hash(k, i + 70) * .5), bc = pr(ch.pt(q, n, 0, [0, 0, 0]), [0, 0, 0]); if (!bc) continue;
            const hgt = .14 + hash(k, i + 80) * .2, sc = FOC / bc[2];
            /* I1 : chaque touffe recevait sa touche d'aquarelle (retirée en J8) */
            for (let b2 = 0; b2 < 5; b2++) { const ang = (b2 - 2) * .3 + (hash(k, i * 9 + b2) - .5) * .2; c0.moveTo(bc[0], bc[1]); c0.quadraticCurveTo(bc[0] + Math.sin(ang) * hgt * sc * .4, bc[1] - hgt * sc * .6, bc[0] + Math.sin(ang) * hgt * sc, bc[1] - Math.cos(ang) * hgt * sc); }
          }
          c0.stroke();
        }
        if (opt.sillons && !(TEL && d > 30)) {
          c0.strokeStyle = ink(.2 * v); c0.lineWidth = lw * .6; c0.beginPath();
          opt.sillons.forEach(n => { const pts = []; for (let q = s; q <= s1 + 1e-6; q += 1) pts.push(ch.pt(q, n, 0)); traitMonde(c0, pts); });
          c0.stroke();
        }
      }
    };
    if (!garderSol) {   /* V2 : la garde du sol */
      troncon(PRINC, sMin, Math.min(SF + .2, sMax), { id: 1, sillons: [2.6, 3.85, 5.1, 6.35, -2.6, -3.85, -5.1, -6.35] });
      troncon(BR, 0, 46, { id: 2, sans: (side, s) => side === 0 && s < T_GORE, sillons: [2.6, 3.85] });
      troncon(BL, 0, 46, { id: 3, sans: (side, s) => side === 1 && s < T_GORE, sillons: [-2.6, -3.85] });
    }
    if (marque) marque('chemin au burin');

    /* objets debout, du plus loin au plus proche, répartis entre trois canevas */
    const objets = [];
    /* I1 : chaque objet a son trait (f, sur son canevas) et, s'il y a lieu, son passage dans le calque des lavis (l) */
    const pousser = (d, f, l) => { if (d > NEAR) objets.push({ d, f, l }); };
    DECOR.rangs.forEach(r => {
      if (L.mob && Math.abs(r.n) > 4.5) return;
      for (let i = 0; ; i++) {
        const s = r.a + i * pasVigne; if (s > r.b) break;
        if (r.chem === PRINC && (s < sCam - 4 || s > sCam + 64)) continue;
        const w = r.chem.pt(s + (hash(r.id, i) - .5) * .22, r.n + (hash(r.id, i + 999) - .5) * .1, 0, [0, 0, 0]);
        const d = prof(w); if (d < .45 || d > 62) continue;
        const v = (r.id * 7 + i) % 2, e = .9 + hash(r.id, i + 77) * .2, miroir = hash(r.id, i + 55) < .5;
        pousser(d, c => sprite(c, SPR.vigne[v], w, d, e, vis(d), miroir), c => sprite(c, SPR.vigne[v], w, d, e, vis(d), miroir, 0, .8 + .34 * hash(r.id, i + 31)));
      }
    });
    DECOR.cy.concat(DECOR.lointains).forEach((ob, i) => {
      const w = ob.abs || ob.chem.pt(ob.s, ob.n, 0, [0, 0, 0]); const d = prof(w); if (d < NEAR || d > 120) return;
      /* K7 : la variante tirée de l'emplacement (visuel, miroir, hauteur, largeur, inclinaison, pâleur au loin) */
      const V = ob.k7, pale = V.pale && (ob.loin || d > 28) ? .62 : 1;
      const a = (ob.loin ? brume(d) * .6 * clamp((portee - d) / 6 + .4) : vis(d)) * pale, eh = (ob.h || 1) * V.eh, S = SPR.cy[V.v];
      pousser(d, c => { sprite(c, S, w, d, eh, a, V.miroir, 0, 0, V.ew, V.rot); if (d < 5 && cam.v > .3) trainee(c, w, d); }, c => sprite(c, S, w, d, eh, a, V.miroir, 0, .84 + .26 * hash(i, 77), V.ew, V.rot));
    });
    const mu = DECOR.muret;
    if (muretImg) {
      /* tronçons réels, dessinés par tranches affines le long du chemin (perspective par morceaux) */
      [[PRINC, -1.6, 15, 3], [PRINC, 1.75, 33, 2], [BR, -2.3, 14, 2]].forEach(([ch, n, s0, nb]) => {
        for (let k = 0; k < nb; k++) { const a = s0 + k * 2.4 * (1 - (vm.reperes.recouvrement || 0)); const d = prof(ch.pt(a + 1.2, n, .3, tB)); if (d < -1 || d > 60) continue; pousser(Math.max(d, .31), c => muretReel(c, ch, n, a, d), c => muretReel(c, ch, n, a, d, true)); }
      });
    } else for (let s = mu.a; s < mu.b; s += 1.5) { const d = prof(mu.chem.pt(s + .75, mu.n, .3, tB)); if (d < -1 || d > 60) continue; pousser(Math.max(d, .31), c => muret(c, s, Math.min(s + 1.5, mu.b), d)); }
    if (HERBES.length) {
      for (const h of BORDS) {
        if (h.chem === PRINC && (h.s < sCam - 3 || h.s > sCam + 40)) continue;
        const w = h.chem.pt(h.s, h.n, 0, tA), d = prof(w); if (d < .5 || d > 26) continue;
        const ww = [w[0], 0, w[2]];
        pousser(d, c => sprite(c, HERBES[h.k], ww, d, h.e, vis(d) * (1 - seg(d, 18, 26)), h.m), c => sprite(c, HERBES[h.k], ww, d, h.e, vis(d) * (1 - seg(d, 18, 26)), h.m, 0, .9));
      }
      /* C3 : les herbes au pied du poteau frémissent à la même bouffée que la feuille du CV */
      if (hp) { const rv = rafale(tVent); PIED_POTEAU.forEach((h, i) => { const w = [POTEAU[0] + RIGHT[0] * h.n + FWD[0] * h.f, 0, POTEAU[2] + RIGHT[2] * h.n + FWD[2] * h.f], d = prof(w); const cis = rv * (.07 + .05 * Math.sin(tVent * 5.3 + i * 1.9)) + .015 * Math.sin(tVent * 1.7 + i); if (d > .4) pousser(d, c => sprite(c, HERBES[h.k], w, d, h.e, vis(d), h.m, cis), c => sprite(c, HERBES[h.k], w, d, h.e, vis(d), h.m, cis, .9)); }); }
      /* V2 : la garde ne garde pas l'image quand ces herbes, qui bougent au vent, peuvent être à l'écran */
      if (hp && sig !== null) PIED_POTEAU.forEach(h => { if (!animeVu && spriteVisible(HERBES[h.k], [POTEAU[0] + RIGHT[0] * h.n + FWD[0] * h.f, 0, POTEAU[2] + RIGHT[2] * h.n + FWD[2] * h.f], h.e)) animeVu = true; });
      if (hf && dF < 60) PIED_FACADE.forEach(h => { const w = [PORTE.x + AT_R[0] * h.x - AT_F[0] * h.f, 0, PORTE.z + AT_R[2] * h.x - AT_F[2] * h.f], d = prof(w); if (d > .4) pousser(Math.min(d, dF - .01), c => sprite(c, HERBES[h.k], w, d, h.e, Math.min(1, alpha * brume(dF) * 1.2), h.m), c => sprite(c, HERBES[h.k], w, d, h.e, Math.min(1, brume(dF) * 1.2), h.m, 0, .9)); });
    }
    DECOR.bornes.forEach(b => { const w = b.chem.pt(b.s, b.n, 0, [0, 0, 0]); const d = prof(w); pousser(d, c => { sprite(c, SPR.borne, w, d, 1, vis(d), false); distanceBorne(c, b, w, d); }, c => sprite(c, SPR.borne, w, d, 1, vis(d), false, 0, 1)); });
    /* pied du poteau : ombre de contact derrière, herbes devant */
    if (hp) { pousser(dP + .05, c => contactPoteau(c, dP, vis(dP))); if (!HERBES.length) pousser(dP - .04, c => herbesPoteau(c, dP, vis(dP))); }
    /* la marche du seuil et les vantaux qui pivotent, devant la façade (E5, E6) */
    /* I2 : la lampe allumée, vue de dehors : la lueur derrière les vitres (juste devant la façade, sous les vantaux), la
       nappe chaude sur le sol devant le seuil (sous la marche, qui a la sienne) */
    const lp = ctx.lampe;
    fac.lampe.I = lp ? lp.I : 0; if (lp) fac.lampe.col = lp.couleur;
    /* J2 : la suspension, éteinte ou allumée, derrière le vitrage (sous les vantaux, la marche et la plaque) */
    if (hf && lampeT) { const I = lp ? lp.I : 1, col = lp ? lp.couleur : [255, 212, 150], kPiece = 1 - sseg(p, T.piece[0], T.piece[1]); pousser(dF - .0012, c => fac.lampeObjet(c, hf.H, lampeT, I, col, DPR, alpha, kPiece)); }
    if (hf && lp && lp.I > .002) {
      const ql = lampeEcran || pr(LAMPE, [0, 0, 0]), Lm = ql ? appl(inv3(hf.H), ql[0], ql[1]) : null, col = lp.couleur, I = lp.I;
      pousser(dF - .001, c => fac.lumiere(c, hf.H, Lm, I, col, DPR, !!lampeT));
      if (dF < 46) pousser(dF - .019, c => fac.nappe(c, pjFacade, I * (1 - seg(dF, 30, 46)), col));
    }
    if (hf && dF < 46) pousser(dF - .02, c => fac.devant(c, pjFacade, alpha * (1 - seg(dF, 34, 46))), c => fac.silhouette(c, pjFacade));
    /* I3 : la girouette, juste devant la façade (au-dessus du toit), sous tout ce qui est plus près ; elle se fige quand
       la lampe s'allume */
    if (hf) {
      gir.maj(tVent, lp ? lp.depuis() : null);
      if (gir.fluide) fluide = true;
      const voile = clamp((1 - brume(dF)) * .95 + Math.max(0, dF - 30) * .004, 0, .78);
      pousser(dF - .0008, c => gir.dessiner(c, pr, FAITE_M, AT_R, AT_F, SOLEIL, cam, DPR, alpha, voile), c => gir.effacer(c));
    } else gir.liberer();
    /* I1 : les objets réels effacent, dans le calque des lavis, ce qui est derrière eux */
    if (hf) pousser(dF, null, c => effacerPlan(c, silFacade, vf.w, vf.h, hf.H, 14));
    if (hp) pousser(dP, null, c => effacerPlan(c, silPoteau, vp.w, vp.h, hp.H, 6));
    objets.sort((a, b) => b.d - a.d);
    if (marque) marque('objets, liste');
    /* V2 : le canevas de devant (les objets plus près que le poteau) est caché quand rien n'y est posé (vide à 41 % des images du
       tronçon du CV à l'atelier : un calque plein écran transparent, effacé et composé pour rien) */
    let dans2 = 0;
    for (const ob of objets) { if (!ob.f) continue; const c = ob.d >= dF ? g[0] : ob.d >= dP ? g[1] : g[2]; if (c === g[2]) dans2++; c.globalAlpha = alpha; ob.f(c); }
    c2Vide = dans2 === 0; setV(cv[2], !c2Vide);
    /* I1 : le monde prend couleur, depuis la lampe de l'atelier */
    if (marque) marque('objets, dessin');
    rendreLavis(p, alpha, objets, sMin, sMax, sCam, solChemin);
    if (marque) marque('lavis');

    /* raccord avec la gravure : le dessin monte du bas de l'image, bord doux */
    if (kr < 1) {
      const bande = H * .32, yr = lerp(H + bande * 1.05, -bande * 1.1, kr);
      (gF ? [...g, gF] : g).forEach(c => {   /* T2 : le papier du sol (téléphone) monte avec le dessin */
        const dc = c === gF ? DPR * KF : DPR;   /* Y17 : le papier du sol à sa densité (KF), le masque à la même échelle que son dessin */
        c.save(); c.setTransform(dc, 0, 0, dc, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'destination-in';
        const gm = c.createLinearGradient(0, yr - bande, 0, yr); gm.addColorStop(0, 'rgba(0,0,0,0)'); gm.addColorStop(.65, 'rgba(0,0,0,.85)'); gm.addColorStop(1, 'rgba(0,0,0,1)');
        c.fillStyle = gm; c.fillRect(0, 0, W, H); c.restore();
      });
    }
    sigPrec = sig;   /* V2 : la signature de l'image dessinée (null : la garde ne la gardera pas) */
    return info;

    /* --- I1 : le calque des lavis --- */
    function rendreLavis(p, alpha, objets, sMin, sMax, sCam, solChemin) {
      if (p < T.lavis[0] || alpha <= .002 || !L.F) { setV(lavC, false); setV(lavT, false); setV(lavSolC, false); return; }
      if (lavC.width !== LAV_W || lavC.height !== LAV_H) { lavC.width = LAV_W; lavC.height = LAV_H; lavT.width = Math.round(LAV_W * TEINTE_K); lavT.height = Math.round(LAV_H * TEINTE_K); }   /* T2 */
      lancerLavis(true, p);
      /* pour les essais : window.__lavisK fixe l'avancée de la révélation (0 à 1) */
      const k = typeof window.__lavisK === 'number' ? window.__lavisK : seg(p, T.lavis[0], T.lavis[1]);
      setV(lavC, true); setO(lavC, alpha * (REDUIT ? sseg(p, T.lavis[0], T.lavis[1]) : 1));
      const Lc = lg;
      Lc.setTransform(1, 0, 0, 1, 0, 0); Lc.globalCompositeOperation = 'source-over'; Lc.globalAlpha = 1; 
      /* L4 : dans Safari, vider ce calque par clearRect coûtait 8 à 9 ms par image (mesuré : 28,6 ms par image sur la
         marche de 0,70 à 0,752, 19,2 ms en le remettant à sa taille, ce qui le vide sans ce coût) ; ailleurs, clearRect */
      if (RAZ_TAILLE) { lavC.width = lavC.width; Lc.setTransform(1, 0, 0, 1, 0, 0); } else Lc.clearRect(0, 0, lavC.width, lavC.height);
      Lc.setTransform(LDPR, 0, 0, LDPR, 0, 0); Lc.lineCap = 'round'; Lc.lineJoin = 'round';
      /* le lointain (couche du ciel : même place, même parallaxe) */
      lavisLointain(Lc);
      /* la terre des champs : un lavis très pâle, vert olive, qui se réchauffe vers nous (perspective de l'air) */
      const yh = CY + FOC * Math.tan(cam.pitch), [tr, tv, tb] = PALETTE.terre;
      const gt = Lc.createLinearGradient(0, yh, 0, H);
      gt.addColorStop(0, `rgba(${tr},${tv},${tb},0)`); gt.addColorStop(.06, `rgba(${tr},${tv},${tb},.13)`); gt.addColorStop(.45, `rgba(${tr},${tv},${tb},.22)`); gt.addColorStop(1, `rgba(${tr},${tv},${tb},.3)`);
      /* L4 : la terre, les chemins et la calade sont rendus ensemble dans le lavis du sol (dans la page, WebGL), quand il
         est prêt ; sinon, comme avant, dans ce calque */
      const surPage = !window.__sansLavSol && !!SOLGL && !!solTex && solGLLavisPage(k);
      setV(lavSolC, surPage); if (surPage) setO(lavSolC, alpha * (REDUIT ? sseg(p, T.lavis[0], T.lavis[1]) : 1));
      if (!surPage) { Lc.fillStyle = gt; Lc.fillRect(0, Math.max(0, yh), W, H - Math.max(0, yh)); }
      /* S4 (dix-neuvième passe) : en mode économe, la couleur par un lavis uni : le ciel et les collines d'un bleu lavande très
         pâle, la terre un peu plus chargée, la verdure d'un vert d'aquarelle léger au pied du monde (multiplication) */
      if (ECO) {
        const [lr, lv, lb] = PALETTE.lointain, [fr, fv, fb] = PALETTE.feuille, gc = Lc.createLinearGradient(0, 0, 0, H);
        const hz = Math.max(.05, Math.min(.9, yh / H));
        gc.addColorStop(0, `rgba(${lr},${lv},${lb},.10)`); gc.addColorStop(hz, `rgba(${lr},${lv},${lb},.22)`);
        gc.addColorStop(Math.min(1, hz + .04), `rgba(${fr},${fv},${fb},.20)`); gc.addColorStop(1, `rgba(${tr},${tv},${tb},.34)`);
        Lc.fillStyle = gc; Lc.fillRect(0, 0, W, H);
      }
      /* le sol des chemins : l'ocre et l'ombre chaude des ornières, posés sur toute la largeur de la tuile (le lavis
         déborde un peu sur les bas-côtés, de façon irrégulière) */
      /* K12 : en perspective exacte, attaché au sol, quand le rendu WebGL est prêt */
      if (surPage) { /* L4 : déjà rendu */ }
      else {
        if (LAVIS.solMotifs) {
          solChemin(PRINC, Math.max(sMin, sCam + .4), Math.min(SF, sMax), Lc, LAVIS.solMotifs, LAVIS.solK, 1, false, LT / 2);
          solChemin(BR, 0, 40, Lc, LAVIS.solMotifs, LAVIS.solK, 1, false, LT / 2); solChemin(BL, 0, 40, Lc, LAVIS.solMotifs, LAVIS.solK, 1, false, LT / 2);
        }
        /* J12 : le lavis de la calade (le calcaire gris-ocre clair, les joints plus sombres), sur la terre effacée */
        calade(Lc, true);
      }
      /* J8 (dixième passe) : plus de touche d'aquarelle sous les touffes d'herbe des bas-côtés (des taches vertes et vert
         foncé posées au sol, que Thibaut trouvait laides). Ces touffes sont un trait seul, sans hachures : elles restent à
         l'encre. Les lavis des herbes gravées (herbes.webp, s'il est chargé) suivent strictement leur encre (lavis.js). */
      Lc.globalAlpha = 1;
      for (const ob of objets) if (ob.l) { Lc.save(); ob.l(Lc); Lc.restore(); }
      /* la révélation : la couleur part de la lampe */
      if (!REDUIT && k < 1) revele.appliquer(Lc, LDPR, centreLampe(), k);
      /* K8 : la teinte de l'encre en mode « couleur ». À 25 % (la valeur demandée), les vignes restaient gris-vert au zoom
         (saturation moyenne du feuillage 0,21, comme avant la passe) ; à 40 % elles se lisent vertes, comme une estampe
         coloriée (0,28), sans que la calade ni le papier ne virent */
      setV(lavT, true); setO(lavT, .4 * alpha * (REDUIT ? sseg(p, T.lavis[0], T.lavis[1]) : 1));
      /* le lavis est translucide (0,3 à 0,7) : recopié trois fois, il devient presque couvrant là où il est (sa couleur, sans
         sa transparence), pour que l'encre prenne bien un quart de sa teinte, et pas un quart de sa charge */
      /* T2 : sur téléphone, cette copie (une teinte douce, à 40 %) est à demi-résolution du calque des lavis */
      const tw = lavT.width, th = lavT.height;
      ltg.setTransform(1, 0, 0, 1, 0, 0); ltg.globalCompositeOperation = 'copy'; ltg.drawImage(lavC, 0, 0, tw, th); ltg.globalCompositeOperation = 'source-over'; ltg.drawImage(lavC, 0, 0, tw, th); ltg.drawImage(lavC, 0, 0, tw, th);
      /* L5 (douzième passe) : sur le lointain seulement, la teinte de l'encre revient à 30 % (au lieu de 40 % : les collines
         tiraient sur le lavande) : un quart de la copie est retiré là où le lavis du lointain se pose */
      ltg.save(); ltg.setTransform(LDPR * TEINTE_K, 0, 0, LDPR * TEINTE_K, 0, 0); ltg.globalCompositeOperation = 'destination-out'; ltg.globalAlpha = .25; lavisLointain(ltg); ltg.restore();
    }
    function lavisLointain(Lc) {
      const gL = geoLointain ? geoLointain(cam, F.h) : null;
      if (!gL || !LAVIS.loin) return;
      /* la couche du ciel se décale et grandit (1,025) autour du centre avec la souris ; le calque des lavis suit le monde */
      const pl = par ? par.loin : [0, 0, 0], pm = par ? par.monde : [0, 0], z = pl[2] || 1, cx = W / 2, cy = H / 2;
      Lc.save();
      Lc.translate(cx + pl[0] - pm[0], cy + pl[1] - pm[1]); Lc.scale(z, z); Lc.translate(-cx, -cy);
      /* chaque tuile déborde d'un pixel sur sa voisine : aucun filet clair au raccord */
      /* Y15 : autant de tuiles que la couche du ciel (cinq sur téléphone), en miroir une sur deux */
      for (let i = -1; i <= (gL.nt || 1); i++) { Lc.save(); Lc.translate(gL.x0 + (i + .5) * gL.lw, gL.y0); if (i % 2 !== 0) Lc.scale(-1, 1); Lc.drawImage(LAVIS.loin, -gL.lw / 2 - 1, 0, gL.lw + 2, gL.lh); Lc.restore(); }
      Lc.restore();
    }
    /* un objet plan réel (façade, poteau) efface les lavis derrière lui : sa silhouette, posée par bandes verticales */
    /* T11 (07/10/2026) : chaque bande déborde sur la suivante d'au moins un pixel et demi du calque (avant : 0,6 pixel de la
       photo, soit 0,2 pixel du calque des lavis quand la façade est petite à l'écran). Au raccord, les deux bandes ne
       couvraient chacune qu'une partie du pixel : le lavis des vignes, derrière la façade, y restait en partie, un filet
       vert d'un pixel au milieu de la façade (le raccord des bandes 7 et 8 tombe sur l'axe de la porte), vu sur l'iPhone
       à travers la porte ouverte, sur la planche. Effacer deux fois ne change rien ; le débord est pris dans la photo
       (et non plus étiré) */
    function effacerPlan(c, im, iw, ih, Hm, N) {
      c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = 1;
      const kx = im.width / iw, ky = im.height / ih;
      for (let i = 0; i < N; i++) {
        const x0 = iw * i / N, x1 = iw * (i + 1) / N, sw = x1 - x0;
        const A = appl(Hm, x0, 0), B = appl(Hm, x1, 0), C = appl(Hm, x0, ih);
        const D2 = c === lg ? LDPR : DPR;
        const kp = D2 * Math.hypot(B[0] - A[0], B[1] - A[1]) / sw, ov = Math.min(iw - x1, Math.max(.6, 1.5 / Math.max(kp, 1e-3)));
        c.setTransform(D2 * (B[0] - A[0]) / sw, D2 * (B[1] - A[1]) / sw, D2 * (C[0] - A[0]) / ih, D2 * (C[1] - A[1]) / ih, D2 * A[0], D2 * A[1]);
        c.drawImage(im, x0 * kx, 0, (sw + ov) * kx, ih * ky, 0, 0, sw + ov, ih);
      }
      c.restore();
    }

    /* --- dessins --- */
    /* lav (I1) : dans le calque des lavis, la silhouette du visuel efface ce qui est derrière lui, puis son lavis se pose,
       avec la même transformation (lav est la charge de cet exemplaire, pour que deux vignes ne soient pas identiques) */
    /* K7 : ex (largeur relative) et rot (inclinaison autour du pied, en radians) */
    /* V2 : un visuel debout peut-il être à l'écran (avec une marge pour le vent, le miroir et l'inclinaison) ? */
    function spriteVisible(S, w, ech) {
      if (!S) return false; const q = pr(w, [0, 0, 0]); if (!q) return false;
      const k = FOC / q[2] * S.mpp * ech, hpx = S.h * k, wpx = S.w * k, m = .3 * hpx + 6;
      return q[0] + wpx + m >= 0 && q[0] - wpx - m <= W && q[1] + m >= 0 && q[1] - hpx - m <= H;
    }
    function sprite(c, S, w, d, ech, a, miroir, cis, lav, ex = 1, rot = 0) {
      if (!S || a <= .01) return;
      const q = pr(w, [0, 0, 0]); if (!q) return;
      const k = FOC / q[2] * S.mpp * ech;   /* px écran par px image */
      const hpx = S.h * k, wpx = S.w * k;
      if (q[0] + wpx < -10 || q[0] - wpx > W + 10 || q[1] < -2 || hpx < 1.5) return;
      /* J11 : le lavis d'une petite plante n'est posé que si elle fait plus de 7 px (au-dessous, sa couleur ne se lit pas) */
      if (lav && S.petite && hpx < 7) return;
      let lv = 0; while (lv < S.niveaux.length - 1 && S.niveaux[lv + 1].height >= hpx * 1.15) lv++;
      c.save(); c.globalAlpha = (lav ? 1 : alpha) * Math.min(1, a * 1.6);
      c.translate(q[0], q[1]); if (rot) c.rotate(rot); if (cis) c.transform(1, 0, -cis, 1, 0, 0); if (miroir) c.scale(-1, 1); if (ex !== 1) c.scale(ex, 1);
      if (lav) {
        c.globalCompositeOperation = 'destination-out';
        c.drawImage(S.niveaux[lv], -S.pied[0] * k, -S.pied[1] * k, wpx, hpx);
        if (S.lav) { c.globalCompositeOperation = 'source-over'; c.globalAlpha *= Math.min(1, lav); c.drawImage(S.lav[lv], -S.pied[0] * k, -S.pied[1] * k, wpx, hpx); }
      } else c.drawImage(S.niveaux[lv], -S.pied[0] * k, -S.pied[1] * k, wpx, hpx);
      c.restore();
    }
    function trainee(c, w, d) {
      const q = pr(w, [0, 0, 0]); if (!q) return;
      c.save(); c.globalAlpha = alpha * .16 * cam.v; c.strokeStyle = ink(1); c.lineWidth = 1;
      c.beginPath(); for (let i = 0; i < 9; i++) { const y = q[1] - (i + 1) * FOC * .7 / d; const dx = (q[0] - CX) * .12; c.moveTo(q[0] - dx * .2, y); c.lineTo(q[0] - dx, y); } c.stroke(); c.restore();
    }
    function muretReel(c, ch, n, a, d, lav) {
      const v = vis(Math.max(d, 0)); if (v <= .01) return;
      const hM = .62, longM = 2.4, tr = 8, iw = muretImg.width, ih = muretImg.height;
      const haut = (vm.reperes.cime || 0) * ih, bas = (vm.reperes.pied ? vm.reperes.pied[1] : 1) * ih;
      /* I1 : dans le calque des lavis, chaque tranche efface puis pose le lavis de la pierre (à la moitié de la résolution) */
      const ml = lav ? LAVIS.muret : null, kl = ml ? ml.w / iw : 1;
      c.save(); c.globalAlpha = (lav ? 1 : alpha) * Math.min(1, v * 1.5);
      for (let i = 0; i < tr; i++) {
        const s0 = a + longM * i / tr, s1 = a + longM * (i + 1) / tr;
        const P0 = pr(ch.pt(s0, n, hM, [0, 0, 0]), [0, 0, 0]), P1 = pr(ch.pt(s1, n, hM, [0, 0, 0]), [0, 0, 0]), P2 = pr(ch.pt(s0, n, 0, [0, 0, 0]), [0, 0, 0]);
        if (!P0 || !P1 || !P2) continue;
        const sx = iw * i / tr, sw = iw / tr + 1, sh = bas - haut;
        const D2 = c === lg ? LDPR : DPR;
        c.setTransform(D2 * (P1[0] - P0[0]) / sw, D2 * (P1[1] - P0[1]) / sw, D2 * (P2[0] - P0[0]) / sh, D2 * (P2[1] - P0[1]) / sh, D2 * P0[0], D2 * P0[1]);
        if (lav) {
          c.globalCompositeOperation = 'destination-out'; c.drawImage(muretImg, sx, haut, sw, sh, 0, 0, sw, sh);
          if (ml) { c.globalCompositeOperation = 'source-over'; c.drawImage(ml.c, sx * kl, haut * kl, sw * kl, sh * kl, 0, 0, sw, sh); }
        } else c.drawImage(muretImg, sx, haut, sw, sh, 0, 0, sw, sh);
      }
      c.restore(); c.setTransform(c === lg ? LDPR : DPR, 0, 0, c === lg ? LDPR : DPR, 0, 0);
    }
    function distanceBorne(c, b, w, d) {
      /* la distance restante gravée sur la borne, en écho au téléphone */
      const v = vis(d); if (v <= .05 || !SPR.borne) return;
      const q = pr(w, [0, 0, 0]); if (!q) return;
      /* O2 (quinzième passe) : la distance restante exacte à l'emplacement de la borne (le long du chemin, jusqu'à l'arrêt du
         croisement, en mètres du monde), arrondie comme le guide du téléphone (la même fonction) */
      const k = FOC / q[2], reste = arrondiDistance(L.S_STOP2 - b.s);
      const taille = .085 * k; if (taille < 6) return;
      c.save(); c.globalAlpha = alpha * v * .8; c.fillStyle = ink(.9); c.textAlign = 'center';
      c.font = `700 ${taille.toFixed(1)}px Inter, sans-serif`; c.fillText(reste + ' m', q[0], q[1] - .36 * k);
      c.restore();
    }
    function muret(c, a, b, d) {
      const v = vis(Math.max(d, 0)); if (v <= .01) return;
      const lw = epais(Math.max(d, .8)), n0 = mu.n + .02, n1 = mu.n - .42, h = .6;
      const face = polyEcran([mu.chem.pt(a, n0, 0), mu.chem.pt(b, n0, 0), mu.chem.pt(b, n0, h), mu.chem.pt(a, n0, h)]);
      const dessus = polyEcran([mu.chem.pt(a, n0, h), mu.chem.pt(b, n0, h), mu.chem.pt(b, n1, h), mu.chem.pt(a, n1, h)]);
      c.fillStyle = `rgba(238,234,224,${v.toFixed(3)})`;
      [face, dessus].forEach(pe => { if (pe.length < 3) return; c.beginPath(); pe.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fill(); });
      c.strokeStyle = ink(.75 * v); c.lineWidth = lw * .8; c.beginPath();
      mu.pierres.forEach(([s0, s1, h0, h1]) => { if (s1 < a || s0 > b) return; const A = Math.max(s0, a), B = Math.min(s1, b); traitMonde(c, [mu.chem.pt(A, n0, h0), mu.chem.pt(B, n0, h0), mu.chem.pt(B, n0, h1), mu.chem.pt(A, n0, h1), mu.chem.pt(A, n0, h0)]); });
      for (let s = a; s < b; s += .45) traitMonde(c, [mu.chem.pt(s, n0, h), mu.chem.pt(s + .02, n1, h)]);
      traitMonde(c, [mu.chem.pt(a, n1, h), mu.chem.pt(b, n1, h)]);
      c.stroke();
      c.strokeStyle = ink(.34 * v); c.lineWidth = lw * .55; c.beginPath();
      for (let s = a; s < b; s += .09) traitMonde(c, [mu.chem.pt(s, n0, .02), mu.chem.pt(s + .07, n0, .26)]);
      c.stroke();
    }
    function contactPoteau(c, d, v) {
      const q = pr([POTEAU[0], 0, POTEAU[2]], [0, 0, 0]); if (!q) return;
      const k = FOC / q[2];
      c.save(); c.globalAlpha = alpha * v;
      const gg = c.createRadialGradient(q[0] + .1 * k, q[1], 1, q[0] + .1 * k, q[1], .45 * k);
      gg.addColorStop(0, ink(.5)); gg.addColorStop(1, ink(0));
      c.fillStyle = gg; c.beginPath(); c.ellipse(q[0] + .1 * k, q[1], .45 * k, .1 * k, 0, 0, Math.PI * 2); c.fill();
      /* longue ombre du poteau vers nous, à droite */
      const pe = polyEcran([[POTEAU[0] - RIGHT[0] * .07, 0, POTEAU[2] - RIGHT[2] * .07], [POTEAU[0] + RIGHT[0] * .07, 0, POTEAU[2] + RIGHT[2] * .07], [POTEAU[0] + dirO[0] * 4.2 + RIGHT[0] * .3, 0, POTEAU[2] + dirO[2] * 4.2 + RIGHT[2] * .3], [POTEAU[0] + dirO[0] * 4.2 - RIGHT[0] * .1, 0, POTEAU[2] + dirO[2] * 4.2 - RIGHT[2] * .1]]);
      if (pe.length > 2) { c.fillStyle = ink(.16); c.beginPath(); pe.forEach((p2, i) => i ? c.lineTo(p2[0], p2[1]) : c.moveTo(p2[0], p2[1])); c.closePath(); c.fill(); }
      c.restore();
    }
    function herbesPoteau(c, d, v) {
      const lw = epais(Math.max(d, .8));
      c.save(); c.globalAlpha = alpha * v; c.strokeStyle = ink(.8); c.lineWidth = lw * .8; c.beginPath();
      for (let i = 0; i < 26; i++) {
        const n = (hash(i, 501) - .5) * .7, f = (hash(i, 502) - .5) * .4;
        const bc = pr([POTEAU[0] + RIGHT[0] * n + FWD[0] * f, 0, POTEAU[2] + RIGHT[2] * n + FWD[2] * f], [0, 0, 0]); if (!bc) continue;
        const hgt = .1 + hash(i, 503) * .22, sc = FOC / bc[2];
        for (let b2 = 0; b2 < 4; b2++) { const ang = (b2 - 1.5) * .3 + (hash(i * 9 + b2, 504) - .5) * .3; c.moveTo(bc[0], bc[1]); c.quadraticCurveTo(bc[0] + Math.sin(ang) * hgt * sc * .4, bc[1] - hgt * sc * .6, bc[0] + Math.sin(ang) * hgt * sc, bc[1] - Math.cos(ang) * hgt * sc); }
      }
      c.stroke(); c.restore();
    }
  }

  /* ---- placement du poteau et de ce qu'il porte ---- */
  const tousPoteau = [poteau, fG, fD, cadreA, soleil, plaque].concat(CLOU_PIECE ? [CLOU_PIECE.c] : []);
  /* un point de l'image du poteau (px), décalé de dz mètres vers nous, projeté à l'écran (sans rien poser) */
  const tW = [0, 0, 0];
  let secousse = [0, 0], tVent = 0, fluide = false;
  function projPoteau(x, y, dz, out) {
    const w = coinPoteau([x, y]); w[0] -= FWD[0] * dz; w[2] -= FWD[2] * dz;
    const c = vcam(w[0], w[1], w[2], tW), zc = Math.max(c[2], NEAR);
    out = out || [0, 0]; out[0] = CX + FOC * c[0] / zc + secousse[0]; out[1] = CY - FOC * c[1] / zc + secousse[1]; return out;
  }
  function placerPoteau(hp, p, op) {
    if (!hp || op <= .002) { tousPoteau.forEach(e => setV(e, false)); info.poteau = null; return; }
    const H = hp.H, map = q => q.map(([x, y]) => appl(H, x, y));
    tousPoteau.forEach(e => setV(e, true));
    setT(poteau, m3d(H)); setO(poteau, op);
    setT(fG, epingle(620, 124, map(fgQ))); setO(fG, op);
    setT(fD, epingle(620, 124, map(fdQ))); setO(fD, op);
    setT(cadreA, epingle(620, 124, map(fdQ)));
    setT(soleil, epingle(620, 124, map(fdQ))); setO(soleil, op * sseg(p, T.flecheSoleil[0], T.flecheSoleil[1]) * (1 - sseg(p, .73, .745)));
    setT(plaque, epingle(400, 150, map(plQ))); setO(plaque, op);
    if (CLOU_PIECE) { setT(CLOU_PIECE.c, epingle(CLOU_PIECE.w, CLOU_PIECE.h, map(CLOU_PIECE.q))); setO(CLOU_PIECE.c, op); }   /* T10 : le clou droit */
    info.poteau = { H, cv: map(cvQ), planche: map(plancheQ), fd: map(fdQ), clou: appl(H, clouP[0], clouP[1]), d: hp.d, echelle: Math.hypot(H[0], H[3]), op, proj: projPoteau, kP, cvImg: cvQ, clouImg: clouP };
  }
  function placerFacade(hf, p, op, dF) {
    if (!hf || dF > 140) { fac.placer(null); oiseau.placer(null); info.porte = null; return; }
    /* E6 : les portes s'ouvrent à mi-distance (de 17 m à 9 m) */
    const k = 1 - sseg(dF, 9, 17);
    /* K11 : le rectangle du vitrage à l'écran (la pièce y est découpée) */
    const vit = fac.vitrage.map(([x, y]) => appl(hf.H, x, y));
    if (op <= .002) { fac.placer(null); info.porte = { q: porteQ.map(([x, y]) => appl(hf.H, x, y)), d: hf.d, op, ouverture: k, table: vueTable(), vitrage: vit }; return; }
    fac.placer(hf.H, { brume: clamp((1 - brume(dF)) * .95 + Math.max(0, dF - 30) * .004, 0, .78), k });
    placerOiseau(p, op);
    info.porte = { q: porteQ.map(([x, y]) => appl(hf.H, x, y)), d: hf.d, op, ouverture: k, table: vueTable(), vitrage: vit };
  }
  /* La table vue par la porte (E4) : un point du monde à 3 m derrière la porte, à 0,80 m du sol, et la largeur
     (1,50 m) qu'y prend la planche ; c'est là qu'on voyait la table par la vitre. Elle s'approche moins vite que
     l'encadrement (parallaxe) : en entrant, la porte s'ouvre autour d'elle. */
  /* K11 : la photo de la table est la pièce vue dès le début, à 3 m derrière la façade, à l'échelle d'une pièce de 6 m
     (son canevas prolongé mesure 6,1 m, la planche 1,40 m) et posée au sol : le pied de la table (y 700 de la photo) au
     niveau du seuil, donc le centre de la planche à 1,10 m */
  const TABLE_VUE = { prof: 3, h: 1.1, l: 1.4, dx: .03 };
  function vueTable() {
    const b = coinFacade([porteCx, solF]), f = TABLE_VUE.prof, c = [b[0] + AT_F[0] * f + AT_R[0] * TABLE_VUE.dx, TABLE_VUE.h, b[2] + AT_F[2] * f + AT_R[2] * TABLE_VUE.dx];
    const m = pr(c, [0, 0, 0]), a = pr([c[0] - AT_R[0] * TABLE_VUE.l / 2, c[1], c[2] - AT_R[2] * TABLE_VUE.l / 2], [0, 0, 0]), z = pr([c[0] + AT_R[0] * TABLE_VUE.l / 2, c[1], c[2] + AT_R[2] * TABLE_VUE.l / 2], [0, 0, 0]);
    /* L1 : z, la profondeur de la table (m) : la pièce en deux plans en déduit l'avancée de la caméra */
    return m && a && z ? { c: [m[0], m[1]], l: Math.hypot(z[0] - a[0], z[1] - a[1]), z: m[2] } : null;
  }
  /* la porte telle qu'on la voit à l'instant q, sans rien dessiner (pour régler l'entrée dans l'atelier) */
  function porteA(q) {
    const sauve = Object.assign({}, cam);
    camera(q); poserCam();
    const hf = homographiePlan(imFacade, coinFacade);
    const vt = hf ? vueTable() : null;
    Object.assign(cam, sauve); poserCam();
    if (!hf) return null;
    const r = porteQ.map(([x, y]) => appl(hf.H, x, y)); r.d = hf.d; r.table = vt; r.ouverture = 1 - sseg(hf.d, 9, 17); r.facade = imFacade.map(([x, y]) => appl(hf.H, x, y)); r.vitrage = fac.vitrage.map(([x, y]) => appl(hf.H, x, y)); return r;
  }
  /* le CV épinglé tel qu'on le voit à l'instant q (pour la pose de contact de la main), sans rien dessiner */
  function quadCvA(q, quadImg) {
    const sauve = Object.assign({}, cam);
    camera(q); poserCam();
    const hp = homographiePlan(imPoteau, coinPoteau);
    Object.assign(cam, sauve); poserCam();
    return hp ? (quadImg || cvQ).map(([x, y]) => appl(hp.H, x, y)) : null;
  }
  function cacher() { invaliderGarde(); tousPoteau.forEach(e => setV(e, false)); fac.placer(null); oiseau.placer(null); fluide = false; cv.forEach(c => setV(c, false)); setV(lavC, false); setV(lavT, false); setV(lavSolC, false); if (encSolC) { setV(encSolC, false); setV(fondSolC, false); } }
  /* N1 (quatorzième passe) : sur téléphone, une fois dans l'atelier (p 0,79 et plus), les calques plein écran du monde (ses
     trois canevas, les lavis, la teinte, le lavis du sol, le rendu du sol : 15 Mo) rendent leur mémoire ; ils reprennent leur
     taille au retour dans le monde (le rendu suivant les redessine entièrement) */
  /* N2 : le réveil préparé en tâche de fond juste avant le retour dans le monde (au « Revoir le film », vers 0,12 ; en
     remontant depuis l'atelier, sous 0,78), pour qu'aucune image du geste ne porte la remise à taille */
  let tacheRetour = null;
  function preparerRetour(p) {
    /* X1 (vingt-quatrième passe) : du côté de l'atelier, seulement quand on revient vers le monde (le monde y est rendu dès 0,756) */
    if (!repose || tacheRetour || !((p > .12 && p < .2) || (p >= .752 && p < .78 && VUE.cible !== null && VUE.cible < p - .001))) return;
    tacheRetour = { nom: 'monde-reveil', besoin: p < .5 ? .2 : .75, gen: (function* () { yield; if (repose) { repose = false; dims(); } tacheRetour = null; })() };
    planifier(tacheRetour, true);
  }
  function reposer() { if (repose || !TEL) return; invaliderGarde(); repose = true; liberer(...cv, lavC, lavT, lavSolC, SOLGL && SOLGL.canvas, fondSolC); }
  function montrer() { if (repose) { repose = false; dims(); } cv.forEach((c, i) => setV(c, i !== 2 || !c2Vide)); }   /* V2 : c2 vide reste caché */
  /* I1, pour les essais : chaque visuel gravé et son lavis, l'un sur l'autre (multiplication), sur du papier */
  function apercuLavis(h = 260) {
    lavisPrets();
    const L = [...SPR.cy, ...SPR.vigne, SPR.borne, ...HERBES].filter(S => S && S.lav);
    const ws = L.map(S => Math.round(S.w * h / S.h)), c = document.createElement('canvas'); c.width = ws.reduce((a, b) => a + b + 10, 0); c.height = h * 2 + 10;
    const g = c.getContext('2d'); g.fillStyle = PAPIER; g.fillRect(0, 0, c.width, c.height);
    let x = 0; L.forEach((S, i) => { g.drawImage(S.niveaux[0], x, 0, ws[i], h); g.globalCompositeOperation = 'multiply'; g.drawImage(S.lav[1], x, 0, ws[i], h); g.globalCompositeOperation = 'source-over'; g.drawImage(S.lav[1], x, h + 10, ws[i], h); x += ws[i] + 10; });
    return c.toDataURL('image/png');
  }
  return { /* V2 : un visuel ou une tâche prête (film.js, ctx.redessiner) : la garde redessine */ invalider: invaliderGarde, /* pour les essais (K5) : la bande de la calade, à l'encre et son lavis */ caladeBande: () => (CALADE.ink ? { ink: CALADE.ink[0], lav: CALADE.lav } : null), set t(v) { tVent = v; }, set geoLointain(f) { geoLointain = f; }, set par(v) { par = v; }, lavisPrets, centreLampe, apercuLavis, boiteGirouette: () => gir.rect, angleGirouette: () => gir.angle,
    /* pour les essais : les cyprès à l'écran à l'instant p (indice, x, profondeur, hauteur à l'écran) */
    cypresA(p) { camera(p); poserCam(); const r = []; DECOR.cy.forEach((ob, i) => { const w = ob.abs || ob.chem.pt(ob.s, ob.n, 0, [0, 0, 0]); const q = pr(w, [0, 0, 0]); if (q && q[0] > -200 && q[0] < W + 200) r.push([i, Math.round(q[0]), +q[2].toFixed(1), Math.round(FOC / q[2] * 8.2 * (ob.h || 1)), ob.chem === BR ? 'BR' + ob.s.toFixed(1) + '/' + ob.n.toFixed(2) : ob.abs ? 'abs' : 'P']); }); return r; }, get fluide() { return fluide; }, set fluide(v) { fluide = v; }, avanceeRoute: p => ROUTE.frac(p), volOiseau: () => P_VOL.slice(), dims, rendre, cacher, montrer, reposer, preparerRetour, quadCvA, porteA, fac, cvImg: cvQ, clouImg: clouP, cap0: F.h, camera: () => cam, get L() { return L; },
    /* O2 : la distance du guide, lue sur la caméra du moment (croisement, atelier), et les distances au départ de chaque étape */
    reste: () => ({ croisement: cam.reste1, atelier: cam.reste2, depart: L.S_STOP2 + 3, departAtelier: ROUTE_LEN + RESTE_SEUIL }),
    bornesReste: () => DECOR.bornes.map(b => ({ s: b.s, reste: L.S_STOP2 - b.s })),
    /* O2 (pour les essais) : où s'écrit le nombre de chaque borne à l'écran, à la caméra du moment ([x, y, échelle] ou null) */
    bornesEcran: () => { poserCam(); return DECOR.bornes.map(b => { const q = pr(b.chem.pt(b.s, b.n, 0, [0, 0, 0]), [0, 0, 0]); return q ? [Math.round(q[0]), Math.round(q[1] - .36 * FOC / q[2]), +(FOC / q[2]).toFixed(1)] : null; }); }, boutonAtelier: fD, cadreAtelier: cadreA };
}
