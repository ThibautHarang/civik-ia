/* =====================================================================
   I1 (neuvième passe, 04/10/2026) : la gravure rehaussée à l'aquarelle.
   Comme une estampe coloriée à la main : la couleur est un lavis
   translucide posé sur le tirage. Les traits restent nets et sombres (le
   calque des lavis est en multiplication sur le monde gravé), le blanc du
   papier reste dans les lumières, la couleur s'accumule là où les hachures
   sont denses (les ombres), comme l'eau colorée dans les creux, et le bord
   de chaque lavis est irrégulier, un peu plus chargé (le pigment migre vers
   le bord quand le lavis sèche), parfois en deçà du trait, parfois au-delà.
   Pour chaque visuel gravé, le lavis est calculé une fois (à la moitié de sa
   résolution), en tâches courtes pendant les temps morts, ou d'un coup si
   on en a besoin tout de suite : à chaque image, il ne reste qu'à le poser
   avec la même transformation que son visuel.
   La révélation : un seul masque, en coordonnées de l'écran, centré sur la
   lampe de l'atelier, dont le rayon grandit avec p ; son bord, adouci et
   déformé par un bruit lent, avance comme de l'eau.
   ===================================================================== */
import { clamp, bruit2, fbm, hash, sseg, eDepl } from './outils.js';
import { DOSSIER, lireManifeste } from './visuels.js';
import { TEL } from './memoire.js';

/* les couleurs de l'aquarelle (désaturées, lumineuses, réglées à l'œil sur les captures) */
const H = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
export const PALETTE = {
  /* K8 (onzième passe) : les feuillages plus lumineux et plus verts (vert feuille #79a85a, à 0,72 d'opacité), les raisins
     #6b4c7a, les ceps #8a6a45 ; les deux variantes du vert, autour du vert feuille */
  feuille: H('#79a85a'), feuilleJaune: H('#9cb556'), feuilleBleue: H('#5e9f63'),
  bois: H('#8a6a45'), piquet: H('#8a7c69'), raisin: H('#6b4c7a'),
  herbe: H('#7fa05a'), herbeSeche: H('#a9a15e'), cypres: H('#3f6a4a'), cypresClair: H('#62874f'), tronc: H('#6e5236'),
  sol: H('#cfa96e'), solOmbre: H('#9c7c52'), pierre: H('#b9ab93'), pierreChaude: H('#c6b292'), pierreFroide: H('#a5a092'),
  lointain: H('#9aa7c4'), lointainVert: H('#a9b48c'), lointainSombre: H('#71876c'),
  terre: H('#bdb67e'),
  chardon: H('#9a5a95'), thym: H('#83936b'), thymFleur: H('#b39ac2'), pissenlit: H('#e3b53c'), coquelicot: H('#cc4a3a')
};
const mel = (o, a, b, t) => { o[0] = a[0] + (b[0] - a[0]) * t; o[1] = a[1] + (b[1] - a[1]) * t; o[2] = a[2] + (b[2] - a[2]) * t; return o; };
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ellipse = (u, v, cu, cv, ru, rv) => { const d = Math.hypot((u - cu) / ru, (v - cv) / rv); return 1 - ss(.75, 1.15, d); };
const P = PALETTE, T1 = [0, 0, 0], T2 = [0, 0, 0];

/* les recettes : la teinte en (u, v) du visuel (0 à 1), n1 et n2 deux bruits (0 à 1), dens la densité des hachures.
   opacite : la charge du lavis (0,6 à 0,75) ; rB : rayon du flou de la densité (fraction de la grande dimension) ;
   trait : visuel au trait seul, sans silhouette pleine (herbes, sol) ; base : lavis léger posé sur tout l'objet. */
function vigne(raisins) {
  return {
    /* K8 : 0,72 d'opacité (0,86 avant, avec des verts plus sombres) ; le lavis couvre davantage la feuille (fond plus
       chargé, moins de blancs laissés dans les lumières) pour que la couleur se lise verte et non grise */
    opacite: .72, rB: .02, base: .9, taches: .5, charge: 1.15,
    teinte(u, v, n1, n2, dens, o) {
      mel(o, P.feuille, n2 > .5 ? P.feuilleJaune : P.feuilleBleue, Math.abs(n2 - .5) * 1.5);
      /* le cep et le piquet (le piquet plus gris), l'herbe au pied */
      const bois = ss(.44, .52, v) * ss(.4, .45, u) * (1 - ss(.61, .66, u));
      if (bois > 0) mel(o, o, mel(T1, P.bois, P.piquet, ss(.54, .58, u + (n1 - .5) * .04)), bois);
      const pied = ss(.7, .78, v) * (1 - bois);
      if (pied > 0) mel(o, o, mel(T1, P.herbe, P.herbeSeche, n1), pied);
      if (raisins) { const r = Math.max(ellipse(u, v, .315, .525, .062, .085), ellipse(u, v, .72, .535, .062, .085)); if (r > 0) mel(o, o, P.raisin, r * .92); }
      return o;
    }
  };
}
const CYPRES = {
  opacite: .82, rB: .03, base: .75, taches: .8,
  teinte(u, v, n1, n2, dens, o) {
    /* le côté du soleil (à gauche) plus clair et plus jaune, le cœur sombre ; le tronc au pied */
    mel(o, P.cypres, P.cypresClair, clamp((.5 - u) * 2.2 + (n2 - .5) * .6) * (1 - dens * .6));
    const tr = ss(.925, .95, v); if (tr > 0) mel(o, o, P.tronc, tr);
    return o;
  }
};
const BORNE = {
  opacite: .6, rB: .02, base: .6, taches: .8,
  teinte(u, v, n1, n2, dens, o) {
    mel(o, P.pierreChaude, P.pierreFroide, n2);
    /* le lierre sur le haut de la borne, l'herbe à son pied */
    const lierre = (1 - ss(.32, .42, v + (n1 - .5) * .08)) * ss(.2, .3, v);
    if (lierre > 0) mel(o, o, mel(T1, P.feuille, P.feuilleBleue, n1), lierre * .9);
    const pied = ss(.74, .8, v); if (pied > 0) mel(o, o, mel(T1, P.herbe, P.herbeSeche, n1), pied);
    return o;
  }
};
const MURET = {
  opacite: .55, rB: .012, base: .55,
  teinte(u, v, n1, n2, dens, o) {
    mel(o, P.pierreChaude, P.pierreFroide, clamp(n2 * 1.3 - .15));
    const pied = ss(.8, .9, v + (n1 - .5) * .06); if (pied > 0) mel(o, o, mel(T1, P.herbe, P.feuilleBleue, n1), pied * .85);
    return o;
  }
};
/* les six plantes de herbes.webp (graminée haute, chardon, thym, pissenlit, coquelicots, graminée courte) : la tige et
   la feuille en vert, la fleur de sa couleur */
const HERBE = [
  (u, v, n1, n2, o) => mel(o, mel(T1, P.herbe, P.feuilleBleue, n2), P.herbeSeche, (1 - ss(.3, .5, v)) * .9),
  (u, v, n1, n2, o) => mel(o, mel(T1, P.thym, P.feuilleBleue, n2 * .6), P.chardon, (1 - ss(.24, .34, v)) * .95),
  (u, v, n1, n2, o) => mel(o, P.thym, P.thymFleur, (1 - ss(.38, .55, v)) * (.55 + .45 * n1)),
  (u, v, n1, n2, o) => mel(o, mel(T1, P.feuille, P.herbe, n2), P.pissenlit, (1 - ss(.3, .4, v)) * .95),
  (u, v, n1, n2, o) => {
    mel(o, P.herbe, P.feuilleBleue, n2 * .7);
    const f = Math.max(ellipse(u, v, .17, .26, .17, .12), ellipse(u, v, .49, .1, .19, .11), ellipse(u, v, .87, .3, .14, .11));
    return f > 0 ? mel(o, o, P.coquelicot, f) : o;
  },
  (u, v, n1, n2, o) => mel(o, mel(T1, P.herbe, P.feuilleBleue, n2), P.herbeSeche, (1 - ss(.25, .45, v)) * .8)
];
/* J8 (dixième passe) : le lavis des herbes gravées suit strictement leur encre (enveloppe serrée des traits, aucun lavis
   de fond, aucun aplat). J11 : les fleurs gardent des couleurs vives et franches (rouge coquelicot, jaune pissenlit,
   mauve du thym, violet du chardon, épis paille), les tiges et les feuilles un vert-gris qui jaunit en paille au pied */
const HERBE_GRIS = H('#8f9a76'), PAILLE = H('#b9ad7a'), T3 = [0, 0, 0];
const FLEUR = [
  (u, v, n1) => [P.herbeSeche, (1 - ss(.3, .5, v)) * .75],
  (u, v, n1) => [P.chardon, (1 - ss(.24, .34, v)) * .95],
  (u, v, n1) => [P.thymFleur, (1 - ss(.38, .55, v)) * (.6 + .4 * n1)],
  (u, v, n1) => [P.pissenlit, (1 - ss(.3, .4, v)) * .95],
  (u, v, n1) => [P.coquelicot, Math.max(ellipse(u, v, .17, .26, .17, .12), ellipse(u, v, .49, .1, .19, .11), ellipse(u, v, .87, .3, .14, .11))],
  (u, v, n1) => [P.herbeSeche, (1 - ss(.25, .45, v)) * .65]
];
const herbe = i => ({ opacite: .7, rB: .02, base: 0, trait: true, rS: .012, teinte(u, v, n1, n2, dens, o) {
  mel(T3, mel(T3, P.herbe, HERBE_GRIS, .55), PAILLE, ss(.62, 1, v) * .6);
  const [c, k] = FLEUR[i](u, v, n1);
  return mel(o, T3, c, k);
} });
const SOL = {
  /* la tuile du chemin, couverte en entier : l'ocre du chemin, jamais uni (marbrures, granulation), l'ombre chaude
     des ornières et des cailloux là où la gravure est dense ; le lavis s'arrête de façon irrégulière sur les bas-côtés
     (la tuile est un peu plus large que le chemin) */
  opacite: .56, rB: .03, base: .66, tout: true, bordU: true, taches: .8, charge: .35,
  teinte(u, v, n1, n2, dens, o) { return mel(o, P.sol, P.solOmbre, clamp(dens * .7)); }
};
const LOINTAIN = {
  opacite: .5, rB: .006, base: .7, echelle: .5,
  teinte(u, v, n1, n2, dens, o) {
    /* perspective de l'air : les crêtes du fond lavande, les pentes proches un peu plus vertes ; haies et cyprès sombres */
    mel(o, P.lointain, P.lointainVert, ss(.4, .62, v + (n2 - .5) * .06) * .85);
    return mel(o, o, P.lointainSombre, clamp((dens - .55) * 1.6) * ss(.36, .5, v));
  }
};
export const RECETTES = {
  'vigne-1': vigne(true), 'vigne-2': vigne(false), 'cypres-1': CYPRES, 'cypres-2': CYPRES, borne: BORNE, muret: MURET,
  'herbe-0': herbe(0), 'herbe-1': herbe(1), 'herbe-2': herbe(2), 'herbe-3': herbe(3), 'herbe-4': herbe(4), 'herbe-5': herbe(5),
  sol: SOL, lointain: LOINTAIN
};

/* flou rapide : trois passes de boîte (presque une gaussienne d'écart type s) ; les bords sont réfléchis (miroir) : un
   visuel qui se raccorde à son voisin (le lointain, la tuile du chemin, le muret) ne pâlit pas à son bord */
function boite(s, d, w, h, r, pas, n, long, l0 = 0, l1 = n) {
  const inv = 1 / (2 * r + 1), refl = k => (k < 0 ? Math.min(long - 1, -k - 1) : k >= long ? Math.max(0, 2 * long - k - 1) : k);
  for (let l = l0; l < l1; l++) {
    const o = (pas === 1) ? l * w : l;
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += s[o + refl(k) * pas];
    for (let k = 0; k < long; k++) {
      d[o + k * pas] = acc * inv;
      acc += s[o + refl(k + r + 1) * pas] - s[o + refl(k - r) * pas];
    }
  }
}
export function flou(src, w, h, sigma) { const g = flouEtapes(src, w, h, sigma); let r = g.next(); while (!r.done) r = g.next(); return r.value; }
/* le même flou, une passe par étape (démarrage : jamais plus de quelques millisecondes d'affilée) */
export function* flouEtapes(src, w, h, sigma) {
  const r = Math.max(1, Math.round(sigma)), a = Float32Array.from(src), b = new Float32Array(src.length);
  /* dixième passe : chaque passe en quatre morceaux (des étapes plus courtes) */
  const Q = 4;
  for (let p = 0; p < 3; p++) {
    for (let q = 0; q < Q; q++) { boite(a, b, w, h, r, 1, h, w, Math.floor(h * q / Q), Math.floor(h * (q + 1) / Q)); yield; }
    for (let q = 0; q < Q; q++) { boite(b, a, w, h, r, w, w, h, Math.floor(w * q / Q), Math.floor(w * (q + 1) / Q)); yield; }
  }
  return a;
}
const quantile = (arr, masque, q) => {
  const e = []; for (let i = 0; i < arr.length; i += 5) if (masque[i] > .5) e.push(arr[i]);
  if (!e.length) return 0; e.sort((x, y) => x - y); return e[Math.min(e.length - 1, Math.floor(q * e.length))];
};

/* Le lavis d'un visuel, par étapes (générateur : chaque étape fait quelques millisecondes de travail). Le résultat :
   un canevas RVBA (couleur du lavis, charge en alpha), à la moitié de la résolution du visuel. */
export function* laverEtapes(src, sw, sh, R, sortie) {
  const k = R.echelle || .5, w = Math.max(8, Math.round(sw * k)), h = Math.max(8, Math.round(sh * k)), n = w * h, M = Math.max(w, h);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, w, h);
  const im = g.getImageData(0, 0, w, h), d = im.data;
  const encre = new Float32Array(n), sil = new Float32Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    const a = d[j + 3] / 255; if (a <= 0) continue;
    const y = (.3 * d[j] + .59 * d[j + 1] + .11 * d[j + 2]) / 255;
    sil[i] = a; encre[i] = a * clamp((.86 - y) / .42);
  }
  yield;
  /* la densité des hachures, floutée : là où l'eau colorée s'accumule */
  const Db = yield* flouEtapes(encre, w, h, M * (R.rB || .018));
  yield;
  /* la silhouette (ou, pour un dessin au trait, l'enveloppe des traits) */
  let Sb = R.trait ? yield* flouEtapes(encre, w, h, M * (R.rS || .02)) : yield* flouEtapes(sil, w, h, Math.max(1, M * .005));
  if (R.trait) { const q = quantile(Sb, Sb.map(x => x > .02 ? 1 : 0), .85) || 1; for (let i = 0; i < n; i++) Sb[i] = Math.min(1, Sb[i] / q); }
  yield;
  const masque = R.tout ? new Float32Array(n).fill(1) : R.trait ? Sb : sil;
  const lo = quantile(Db, masque, .18), hi = Math.max(lo + .02, quantile(Db, masque, .93));
  const B1 = bruit2(4101), B2 = bruit2(4111), B3 = bruit2(4127), B4 = bruit2(4133);
  const s1 = M / 7, s2 = M / 24, s3 = M / 13, sG = 1.6;
  const Mm = new Float32Array(n), N1 = new Float32Array(n), N2 = new Float32Array(n), DN = new Float32Array(n);
  const etire = x => clamp((x - .5) * 1.9 + .5);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const e0 = R.tout ? 1 : Sb[i]; if (e0 < .02) continue;
      const n1 = etire(fbm(B1, x / s1, y / s1, 3)), n2 = etire(fbm(B2, x / s2, y / s2, 2)), n3 = etire(fbm(B3, x / s3, y / s3, 2));
      /* la densité, ramenée aux hachures de ce visuel ; un lavis léger sur tout l'objet, absent par endroits (le blanc
         du papier garde les lumières), puis la couleur qui se charge dans les ombres */
      const dens = ss(lo, hi, Db[i] + (n1 - .5) * .3 * (hi - lo));
      let fond = R.taches ? (R.base || 0) * clamp(.55 + R.taches * (n1 - .5)) : (R.base || 0) * clamp(.2 + 1.6 * (n1 - .28));
      /* là où le graveur n'a presque rien tracé (les grandes lumières, le fond du treillage), le papier reste blanc */
      if (!R.tout) fond *= .3 + .7 * ss(lo * .25, lo * 1.1, Db[i]);
      const W = clamp(fond + (1 - fond) * (R.charge || 1) * Math.pow(dens, .7));
      /* le bord : irrégulier, en deçà du trait par endroits, au-delà ailleurs */
      const E = R.tout ? (R.bordU ? ss(.01, .07 + .08 * n3, x / w) * ss(.01, .07 + .08 * n3, 1 - x / w) : 1)
        : R.trait ? ss(.18 + (n3 - .5) * .3, .55, e0) : ss(.26 + (n3 - .5) * .36, .6 + (n3 - .5) * .16, e0);
      Mm[i] = W * E; N1[i] = n1; N2[i] = n2; DN[i] = dens;
    }
    if (y % 32 === 31) yield;
  }
  yield;
  /* le pigment qui migre vers le bord en séchant : le lavis est plus chargé juste à l'intérieur de son bord */
  const Mb = yield* flouEtapes(Mm, w, h, Math.max(1, M * .0045));
  yield;
  const o = [0, 0, 0];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x, j = i * 4;
      let m = Mm[i];
      if (m <= .004) { d[j + 3] = 0; continue; }
      const rim = clamp((m - Mb[i]) * 3.2);
      m = m * (1 + .5 * rim);
      /* la granulation (le pigment qui se pose dans le grain du papier) et les marbrures du lavis */
      const gr = .55 * hash(x, y * 7 + 3) + .45 * B4(x / sG, y / sG);
      m *= (.8 + .4 * gr) * (.86 + .28 * N2[i]);
      R.teinte(x / w, y / h, N1[i], N2[i], DN[i], o);
      /* la couleur plus profonde là où elle s'accumule */
      const f = 1 - .2 * DN[i] - .1 * rim;
      d[j] = o[0] * f; d[j + 1] = o[1] * f; d[j + 2] = o[2] * f; d[j + 3] = clamp(m) * R.opacite * 255;
    }
    if (y % 24 === 23) yield;
  }
  yield;
  g.putImageData(im, 0, 0);
  /* dixième passe : le lavis fini est recopié une fois sur un canevas ordinaire (carte graphique). Le canevas de calcul est
     en mémoire (willReadFrequently) : posé tel quel à chaque image, il était renvoyé à la carte graphique à chaque fois,
     ce qui, avec la centaine de fleurs de J11, faisait des images de 100 à 200 ms pendant la révélation */
  const cg = document.createElement('canvas'); cg.width = w; cg.height = h; cg.getContext('2d').drawImage(c, 0, 0);
  sortie.c = cg; sortie.w = w; sortie.h = h;
}
/* mener un générateur à son terme, tout de suite */
export function finir(gen) { for (const _ of gen) { /* rien */ } }

/* Les tâches de fond : une file de générateurs, menés pendant les temps morts du navigateur (jamais plus de quelques
   millisecondes d'affilée, pour ne jamais faire sauter une image). */
const file = [];
let enCours = false;
/* L4 (douzième passe) : Safari n'a pas requestIdleCallback. Le remplaçant ne lance plus une tâche à un instant quelconque
   (un minuteur de 40 ms qui pouvait tomber juste avant une image) : quand le film bouge, il attend l'image suivante et
   travaille juste après elle, dans ce qu'il reste de la trame (jusqu'à 12 ms après son début) ; à l'arrêt, un minuteur,
   avec le même budget mesuré */
/* M4 (treizième passe) : à l'arrêt (aucune image nouvelle depuis 150 ms), le remplaçant de Safari travaillait 6 ms toutes
   les 36 ms (un sixième du temps) : sur iPhone, les préparations (plaque, calade, mur, vitre) n'étaient pas finies
   quand on arrivait à l'atelier. À l'arrêt, il travaille désormais par tranches de 10 ms séparées de 4 ms (le film à
   l'arrêt ne rend que la vie lente, 30 images par seconde au plus : une tranche de 10 ms ne se voit pas). En mouvement,
   comme avant (juste après une image, dans ce qu'il reste de la trame) */
const ricRemplacant = f => {
  if (performance.now() - derniereImage < 150) requestAnimationFrame(t0 => setTimeout(() => f({ timeRemaining: () => Math.max(0, 12 - (performance.now() - t0)), didTimeout: false }), 0));
  else setTimeout(() => { const d = performance.now(); f({ timeRemaining: () => Math.max(0, 10 - (performance.now() - d)), didTimeout: false, repos: true }); }, 4);
};
const ric = window.requestIdleCallback ? (f => window.requestIdleCallback(f, { timeout: 400 })) : ricRemplacant;
/* Dixième passe : quand le film est en mouvement (une image rendue depuis moins de 150 ms), une tâche ne s'exécute que
   dans le temps mort réel entre deux images (jamais sur l'échéance forcée de 400 ms) et seulement si sa dernière étape
   y tient : le film garde ses 60 images par seconde pendant que les textures se préparent. À l'arrêt, comme avant. */
let derniereImage = -1e9;
/* M4 (treizième passe) : la valeur de p de l'image (les tâches proches de leur besoin passent plus vite) */
let pCourant = 0;
export function signalerImage(p) { derniereImage = performance.now(); if (typeof p === 'number') pCourant = p; }
/* L4 (douzième passe) : une étape plus longue que le temps mort n'attend plus indéfiniment. Dans Safari, en lecture
   complète (le film bouge sans arrêt pendant 52 s), le temps mort après le rendu d'une image ne dépassait jamais
   quelques millisecondes : les tâches dont une étape avait pris plus (le sol K12, 11 ms ; la plaque, 9 ms ; les lavis,
   jusqu'à 21 ms) restaient bloquées tout le film (21 tâches en attente à la dernière image : la couleur, la pièce
   éteinte, l'accord du mur n'arrivaient jamais). Une étape bloquée depuis 250 ms passe, une seule par 250 ms : une image
   plus longue de temps en temps, au début du film (toutes les tâches finies vers 0,20), au lieu d'un film entier sans
   ses préparations. */
const FORCER_APRES = 250;
/* P4 : le compte du travail par image de M4 (petitPas, travailImage) n'existe plus : une tranche par image (voir mener) */
let dernierForce = -1e9;
/* M4 (treizième passe) : les tâches passent par ordre de besoin (la valeur de p où leur résultat se voit), et non plus
   dans l'ordre où elles ont été demandées : dans WebKit en 390 x 844, le mur de pierre du petit écran (0,78), demandé
   le premier, occupait seul la file jusqu'à l'atelier, et la plaque, la vitre, la calade (la route, 0,66 à 0,70)
   attendaient derrière lui. Les urgentes (K8) restent en tête ; à besoin égal, l'ordre de demande. */
const BESOINS = { crete: .2, sol: .3, 'sol-textures': .3, girouette: .66, plaque: .66, vitre: .68, dos: .68, eteinte: .69, calade: .69, pieds: .7, mur: .7, plafond: .7, plateau: .745, net: .75, accord: .76, soleilPres: .76, 'mur-petit': .78 };
/* W2 (vingt-troisième passe, 08/10/2026) : sur téléphone, les préparations de l'arrivée à l'atelier (la plaque, la vitre, le dos des
   vantaux, la girouette, la pièce éteinte, la calade, le mur) passent avant, au croisement (besoin 0,58 : imminentes dès 0,53, et
   en tête de file à l'arrêt 2, où l'on lit « Conseiller »), et non plus à l'arrivée (0,66 à 0,70), le moment le plus lourd du film
   en mémoire, où elles s'empilaient sur la pièce qui se réveille et les couleurs qui arrivent (relevé sur l'iPhone : voir NOTES.md,
   vingt-troisième passe). ?w2=0 les remet à leur place (essais) */
const W2_AVANCE = TEL && (() => { try { return new URLSearchParams(location.search).get('w2') !== '0'; } catch (e) { return true; } })();
const BESOINS_TEL = { girouette: .58, plaque: .58, vitre: .58, dos: .58, eteinte: .58, calade: .58, mur: .58 };
const besoin = t => (t.besoin !== undefined ? t.besoin : (t.nom || '').startsWith('lavis-') ? .69 : W2_AVANCE && BESOINS_TEL[t.nom] !== undefined ? BESOINS_TEL[t.nom] : BESOINS[t.nom] !== undefined ? BESOINS[t.nom] : 0);
function choisir() {
  let k = -1, b = Infinity;
  for (let i = 0; i < file.length; i++) { const t = file[i]; if (t.fini) continue; if (t.urgent) { k = i; break; } const v = besoin(t); if (v < b) { b = v; k = i; } }
  if (k > 0) file.unshift(file.splice(k, 1)[0]);
}
/* P2 (seizième passe, 06/10/2026) : l'ouverture du film. Mesuré dans Chrome et dans WebKit (c16-p1-releve.json) : depuis une
   page du site comme en adresse tapée, les préparations de fond (la file, que leurs minuteurs de 1,2 à 3 s font partir
   pendant l'ouverture, et les préparations posées hors de la file) tombaient juste quand le téléphone paraît, que
   « Communiquer » s'écrit et que Marianne répond : des étapes d'un bloc de 10 à 78 ms (le mur, la vitre, la calade, la
   girouette) et, faute d'image signalée pendant l'entrée (p ne bouge pas), la file s'y croyait au repos (tranches de
   10 ms). Désormais :
   - pendant le calme de l'ouverture (3 s après la première image, ouverture sur la nuit seulement), aucune tâche ne part ;
   - (P4 : la conversation ne retient plus la file ; elle y travaille en tranches courtes, voir mener) ;
   - une tâche urgente, ou dont le besoin est à moins de 0,05 de p, passe toujours.
   Le moteur ouvre (ouverture) et ferme (finOuverture) cette fenêtre, et signale chaque image où quelque chose bouge. */
/* P2 : pendant la création du film (l'affiche est à l'écran), la file attend déjà : sinon ses étapes et leurs suites (un
   encodage, un chargement) retombaient juste après la première image. Le moteur fixe ensuite la vraie fenêtre ; sans
   moteur (mouvement réduit), la file part 4 s après le chargement */
const OUV = { calme: performance.now() + 4000, conversation: false, max: 0 };
export function ouverture(o = {}) { const t = performance.now(); OUV.calme = t + (o.calme || 0); OUV.conversation = !!o.conversation; OUV.max = t + (o.max || 20000); relancerSiRetenue(); }
export function finOuverture() { OUV.conversation = false; }
let attenteOuv = 0;
/* P4 (seizième passe) : en mouvement, une seule tranche par image (jamais deux), de 7 ms au plus pendant la nuit (la
   conversation : la file s'y vide avant l'arrêt 1) et de 4 ms ensuite (la marche, la route : si l'on part avant qu'elle
   soit vide) ; une tranche commence toujours par une étape, puis n'en prend une autre que si elle y tient (au train de
   l'étape précédente de la même tâche). Les étapes sont découpées pour tenir dans une tranche (P4 : le mur, la vitre,
   la calade, la girouette, le sol, la crête, le dos des vantaux, le lointain flouté, le masque du logo, l'écriture) ;
   une étape encore plus longue que deux tranches ne passe qu'une fois par 250 ms (le garde-fou de la douzième passe).
   Au repos, comme avant. */
const TRANCHE_NUIT = 7, TRANCHE = 4;
/* S3 (dix-neuvième passe, 07/10/2026) : sur le vrai iPhone, les tranches de 4 à 7 ms et les préparations faites au moment où
   le chapitre arrive pèsent plus que sur le Mac (le lag au CV et aux couleurs de l'atelier). Sur téléphone :
   - la file ne tourne jamais pendant un geste : suspendue dès le premier mouvement (toucher, défilement à la main, molette :
     le moteur appelle geste()), reprise 300 ms après le dernier ; seule une tâche urgente, ou dont le besoin est à moins de
     0,03 de p, passe encore, une étape par image ;
   - en mouvement, les tranches font 3 ms au plus, sauf pendant la conversation de la nuit (7 ms, mesuré sur l'iPhone : 60
     images par seconde) ; au repos, comme avant ;
   - « un chapitre en avance » : tranché après mesure sur l'iPhone 15. Lancées pendant la route (besoin à moins de 0,24 de
     p), les préparations de l'atelier n'étaient pas finies à 0,70 (l'iPhone n'avance qu'en tranches pendant le mouvement)
     et tombaient avec l'arrivée des couleurs ; la nuit (la conversation, puis l'arrêt 1 où l'on lit) est le seul long
     moment calme : elles y sont lancées, plusieurs chapitres en avance, jamais au moment où le chapitre arrive ; une tâche
     urgente passe toujours */
const TRANCHE_TEL = 3, IMMINENT = .03, REPRISE_GESTE = 300;
let gesteJusqua = 0, attenteGeste = 0;
export function geste() { if (TEL) gesteJusqua = performance.now() + REPRISE_GESTE; }
/* P4 : une étape qui rend PAUSE laisse la suite de sa tâche à la tranche suivante : avant une relecture de canevas (WebKit
   attend alors que sa carte graphique ait fini tout ce qu'on vient de lui demander : 30 à 60 ms si on la relit aussitôt) */
export const PAUSE = 'pause';
/* P4 bis : une étape qui rend LOURD a beaucoup demandé au processus graphique (une bande d'un grand canevas peinte, un
   filtre) : dans WebKit, ce tracé ne se fait pas pendant l'étape mais après elle, dans le processus graphique (5 à 30 ms
   pour une bande de la pièce, mesuré par une relecture après chaque étape ; le temps de l'étape, lui, ne dépasse pas
   3 ms) ; une image du film qui attend ce processus est en retard d'autant, et une relecture de canevas qui suit attend
   tout ce qui s'y est accumulé (la pièce éteinte : 83 à 107 ms d'un bloc dans la conversation). La tranche finit donc, et,
   le film en mouvement, la suivante attend deux images : le processus graphique a fini avant le tracé suivant */
export const LOURD = 'lourd';
const REPOS_LOURD = 30;
let reposJusqua = 0;
let trancheImage = -1;
function mener(dl) {
  const t0 = performance.now(), anime = t0 - derniereImage < 150;
  /* P2 : le calme de l'ouverture (voir plus haut) ; la file attend, sauf une tâche urgente ou proche de son besoin */
  const fenetre = t0 < OUV.calme;
  /* S3 : sur téléphone, pendant un geste, seules les tâches urgentes ou imminentes ; hors du geste, un chapitre en avance */
  const enGeste = TEL && t0 < gesteJusqua;
  /* S3 : sur téléphone, après la nuit, la file ne travaille plus pendant que le film bouge (ni geste, ni lecture) : mesuré sur
     l'iPhone, une tâche lourde menée en tranches de 3 ms pendant la marche (le dos des vantaux : 12 s) faisait tomber le film
     à 8 à 15 images par seconde (le processus graphique trace ce que chaque tranche lui demande) ; elle attend que le film
     s'arrête (un arrêt, une pause), sauf urgente ou imminente (moins de 0,05 de p) */
  const enMarche = TEL && anime && pCourant >= .19;
  const permise = t => (!fenetre || t.urgent || besoin(t) - pCourant < .05) && (!enGeste || t.urgent || besoin(t) - pCourant < IMMINENT) && (!enMarche || t.urgent || besoin(t) - pCourant < .05);
  let retenue = false, retenueTel = false;
  const reste = () => (dl.timeRemaining ? dl.timeRemaining() : 5);
  /* K8 : une tâche urgente (les lavis visibles), le film à l'arrêt, travaille jusqu'à 26 ms d'affilée, par étapes de
     quelques millisecondes, et ne lance pas une étape qui, au train de la précédente, finirait après 40 ms : aucune tâche
     de plus de 50 ms */
  const urg = file.length && file[0].urgent;
  /* M4 : à l'arrêt, sans requestIdleCallback (Safari), la tranche va jusqu'à 10 ms (voir ricRemplacant) */
  let budget = urg && !anime ? Math.max(6, Math.min(26, reste() - 2)) : Math.max(2, Math.min(dl.repos ? 10 : 6, reste()));
  if (anime) {
    /* P4 : une tranche par image */
    if (trancheImage === derniereImage || t0 < reposJusqua) { if (file.length) ric(mener); else enCours = false; return; }
    trancheImage = derniereImage;
    budget = Math.max(2, Math.min(pCourant < .19 ? TRANCHE_NUIT : TRANCHE, reste() - 1));
  }
  /* S3 : en mouvement, 3 ms au plus sur téléphone (7 ms pendant la conversation de la nuit) ; pendant un geste, une seule étape */
  if (TEL && (anime || enGeste)) budget = Math.min(budget, pCourant < .19 && !enGeste ? TRANCHE_NUIT : TRANCHE_TEL);
  let premiere = true;
  while (file.length && performance.now() - t0 < budget) {
    if (!file[0].urgent || file[0].fini) choisir();
    const t = file[0];
    if (t.fini) { file.shift(); continue; }
    if (!permise(t)) { retenue = true; retenueTel = TEL; break; }
    if (anime) {
      const est = t.dernier || 3, ecoule = performance.now() - t0;
      /* la tranche est pleine : la suite à l'image suivante */
      if (!premiere && ecoule + est > budget) break;
      /* P4 : une étape plus longue que deux tranches (ne devrait plus exister) : au plus une par 250 ms */
      if (premiere && est > 2 * budget) {
        const now = performance.now();
        if (!t.bloque) t.bloque = now;
        if (now - t.bloque < FORCER_APRES || now - dernierForce < FORCER_APRES) break;
        dernierForce = now;
      }
    }
    if (enGeste && !premiere) break;
    t.bloque = 0; premiere = false;
    if (!anime && urg && performance.now() - t0 > 1 && (t.dernier || 3) > 40 - (performance.now() - t0)) break;
    /* L4 (douzième passe) : une tâche qui lève une erreur est retirée de la file (avant, l'erreur arrêtait toute la file :
       plus aucune texture, aucun lavis ne se préparait ensuite) ; l'erreur est signalée dans la console */
    let r, dt; const t1 = performance.now();
    /* S1 (dix-neuvième passe) : le journal sur l'appareil (?diag=1, js/diag.js) suit l'étape en cours */
    const DG = window.__diag; if (DG) DG.etape(t.nom || '?');
    try { r = t.gen.next(); } catch (e) { console.warn('[tâche ' + (t.nom || '?') + '] ' + (e && e.message)); r = { done: true }; }
    dt = performance.now() - t1;
    if (DG) DG.apres(t.nom || '?', dt, !!r.done);
    t.dernier = dt;
    /* onzième passe (essais) : le travail de chaque tâche (ms) et l'instant où elle finit */
    { const B = window.__bilanTaches = window.__bilanTaches || {}, k = t.nom || '?', e = B[k] = B[k] || { ms: 0, etapes: 0, fin: 0, max: 0 }; e.ms += dt; e.etapes++; if (dt > e.max) { e.max = dt; e.iMax = e.etapes; } if (dt > 3 && (e.d = e.d || []).length < 60) e.d.push([e.etapes, +dt.toFixed(1), anime ? 1 : 0]); if (r.done) e.fin = Math.round(performance.now()); }
    /* pour les essais : les étapes trop longues (plus de 8 ms) */
    if (dt > 8) (window.__etapesLongues = window.__etapesLongues || []).push([Math.round(dt), t.nom || '?', t.n = (t.n || 0) + 1, anime ? 'film en mouvement' : '']);
    if (r.done) { t.fini = true; file.shift(); if (t.apres) t.apres(); }
    else if (r.value === PAUSE) break;
    else if (r.value === LOURD) { reposJusqua = performance.now() + REPOS_LOURD; break; }
  }
  /* P2 : retenue par le calme de l'ouverture : la file reprend à sa fin (une tâche urgente la relance plus tôt) */
  if (file.length) {
    if (retenue && performance.now() < OUV.calme) { clearTimeout(attenteOuv); attenteOuv = setTimeout(() => { attenteOuv = 0; ric(mener); }, OUV.calme - performance.now() + 5); }
    /* S3 : retenue sur téléphone (un geste en cours, ou rien d'assez proche) : la file attend la fin du geste, ou relit p
       quatre fois par seconde, au lieu de tourner à chaque image */
    else if (retenueTel) { clearTimeout(attenteGeste); attenteGeste = setTimeout(() => { attenteGeste = 0; ric(mener); }, Math.max(60, Math.min(250, gesteJusqua - performance.now() + 5))); }
    else ric(mener);
  }
  else enCours = false;
}
/* P2 : une tâche urgente n'attend pas la fin du calme de l'ouverture */
const relancerSiRetenue = () => { if (attenteOuv) { clearTimeout(attenteOuv); attenteOuv = 0; ric(mener); } else if (attenteGeste) { clearTimeout(attenteGeste); attenteGeste = 0; ric(mener); } };
export function planifier(tache, urgent = false) { tache.urgent = urgent; if (urgent) file.unshift(tache); else file.push(tache); if (!enCours) { enCours = true; ric(mener); } else if (urgent) relancerSiRetenue(); }
/* K8 (onzième passe) : passer en tête de la file, en urgence, les tâches dont le nom commence par le préfixe (les lavis
   des calques visibles, quand le film s'ouvre ou saute directement dans la couleur) */
export function prioriser(prefixe, sauf = []) {
  const u = file.filter(t => !t.fini && (t.nom || '').startsWith(prefixe) && !sauf.includes(t.nom)), r = file.filter(t => !u.includes(t));
  u.forEach(t => { t.urgent = true; }); file.length = 0; file.push(...u, ...r);
  if (!enCours && file.length) { enCours = true; ric(mener); } else if (u.length) relancerSiRetenue();
}
/* onzième passe (essais) : le nombre de tâches de fond restantes, pour attendre qu'elles soient finies avant une capture */
window.__taches = () => (enCours ? Math.max(1, file.length) : 0);
/* X1 (vingt-quatrième passe, 08/10/2026) : la porte de l'atelier (moteur.js) ne s'ouvre que quand les préparations de l'atelier sont
   finies : les tâches de la file encore à faire dont le besoin est au plus pMax (la pièce, le plafond, le mur, la vitre, le dos des
   vantaux, la calade, la plaque, la girouette, la pièce éteinte, les lavis, l'accord, le plateau, la photo nette, le soleil de près) ;
   rend leurs noms (le journal ?diag=1 les écrit pendant que la porte tient) */
export function enAttente(pMax) { const L = []; for (const t of file) if (!t.fini && besoin(t) <= pMax) L.push(t.nom || '?'); return L; }
/* M4 (treizième passe) : sur iPhone, la couleur n'arrivait pas à l'atelier. Cause, reproduite dans WebKit en 390 x 844 : les
   lavis se calculaient en tâches de fond, derrière la plaque (296 étapes) et les autres préparations ; Safari n'a pas
   requestIdleCallback et, le film en mouvement, il ne reste presque rien après chaque image : une étape forcée toutes
   les 250 ms. Ouvert à l'arrêt 2 puis joué jusqu'à l'atelier, deux lavis sur treize étaient prêts à 0,722 (fin de la
   révélation), le dernier à 0,80 ; sur un iPhone, plus lent, aucun. Les treize lavis sont désormais des images
   préparées (c-film/lavis/, calculées une fois par lavis.js lui-même sur les visuels, écart de compression de 9/255 au
   plus) : chargées et décodées hors du fil principal dès la création du monde, posées une à une ; le calcul ne reste
   qu'en secours, pour un lavis dont la source a changé (taille du fichier source différente de celle notée dans
   lavis.json, ou dimensions différentes) ou dont l'image manque. surPret(nom, image) est appelé pour chaque lavis
   prêt. */
/* la taille (octets) d'un fichier des visuels, lue une fois par une requête HEAD (-1 si illisible) */
const OCTETS = new Map();
export const octetsVisuel = f => { if (!OCTETS.has(f)) OCTETS.set(f, fetch(DOSSIER + f, { method: 'HEAD', cache: 'no-cache' }).then(r => (r.ok ? +(r.headers.get('content-length') || -1) : -1)).catch(() => -1)); return OCTETS.get(f); };
/* l'empreinte d'une chaîne (FNV-1a, 32 bits) : celle d'une entrée du manifeste */
export const empreinte = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
const imagePrete = url => new Promise(ok => { const im = new Image(); im.decoding = 'async'; im.onload = () => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(() => ok(im.naturalWidth ? im : null)); im.onerror = () => ok(null); im.src = url; });
/* M4 : les autres préparations lourdes, préparées de même (c-film/prets/prets.json) : la plaque gravée, la photo de près
   accordée (L9), la pierre autour de la planche (petit écran) et son bord fondu. Une préparation n'est prise que si ses
   fichiers sources ont la taille notée et ses entrées du manifeste la même empreinte ; sinon le calcul habituel. */
let PRETS = null;
export function pret(nom) {
  if (new URLSearchParams(location.search).get('prets') === '0') return Promise.resolve(null);
  if (!PRETS) PRETS = fetch(new URL('../prets/prets.json', import.meta.url).href, { cache: 'no-cache' }).then(r => (r.ok ? r.json() : {})).catch(() => ({}));
  return PRETS.then(async m => {
    const e = m && m[nom]; if (!e) return null;
    for (const [f, o] of Object.entries(e.sources || {})) if ((await octetsVisuel(f)) !== o) { console.warn('[prêt] ' + nom + ' : ' + f + ' a changé, calcul habituel'); return null; }
    if (e.manifeste) { const man = await lireManifeste(); for (const [k, h] of Object.entries(e.manifeste)) if (empreinte(JSON.stringify(man[k] || null)) !== h) { console.warn('[prêt] ' + nom + ' : entrée ' + k + ' du manifeste changée, calcul habituel'); return null; } }
    const url = new URL('../prets/' + e.fichier, import.meta.url).href, im = await imagePrete(url);
    return im ? { im, url, e } : null;
  }).catch(() => null);
}
export function chargerLavisPrets(dossierVisuels, surPret) {
  const base = new URL('../lavis/', import.meta.url).href;
  if (new URLSearchParams(location.search).get('prets') === '0') return Promise.resolve(0);
  return fetch(base + 'lavis.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).then(async m => {
    if (!m || !m.lavis) return 0;
    const fichiers = [...new Set(Object.values(m.lavis).map(e => e.source))];
    const octets = new Map(await Promise.all(fichiers.map(async f => [f, await octetsVisuel(f)])));
    let n = 0;
    await Promise.all(Object.entries(m.lavis).map(([nom, e]) => {
      if (octets.get(e.source) !== e.octetsSource) { console.warn('[lavis] ' + nom + ' : source modifiée ou illisible, lavis recalculé'); return null; }
      return new Promise(ok => {
        const im = new Image(); im.decoding = 'async';
        im.onload = () => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(() => { if (im.naturalWidth) { n++; surPret(nom, im, e); } ok(); });
        im.onerror = () => ok();
        im.src = base + e.fichier;
      });
    }));
    return n;
  }).catch(() => 0);
}
/* P4 (seizième passe) : l'ouvrier (js/hors-fil.js), redonné ici pour les modules qui lisent déjà la file */
export { ouvrier } from './hors-fil.js';
/* une tâche déjà planifiée, à terminer tout de suite */
export function terminer(tache) { if (tache.fini) return; for (const _ of tache.gen) { /* rien */ } tache.fini = true; if (tache.apres) tache.apres(); }

/* les niveaux de détail d'un lavis, alignés sur ceux du visuel (le niveau 0, pleine résolution, prend le lavis à la
   moitié, il est doux de toute façon) */
export function niveaux(lav, nb) {
  const L = [lav.c, lav.c];
  let cur = lav.c;
  while (L.length < nb) { const d = document.createElement('canvas'); d.width = Math.max(2, Math.round(cur.width / 2)); d.height = Math.max(2, Math.round(cur.height / 2)); const g = d.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(cur, 0, 0, d.width, d.height); L.push(d); cur = d; }
  return L.slice(0, nb);
}

/* Les touches d'aquarelle des touffes d'herbe au trait (bas-côtés du chemin) : de petites taches irrégulières, plus
   chargées au bord, granuleuses ; quatre verts et une paille, faites une fois */
export function touchesAquarelle() {
  const C = [P.herbe, P.feuille, P.feuilleBleue, P.feuilleJaune, P.herbeSeche], L = [];
  C.forEach((col, k) => {
    const w = 72, h = 60, c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'), im = g.createImageData(w, h), d = im.data, B = bruit2(6101 + k * 7);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = (x + .5) / w * 2 - 1, v = (y + .5) / h * 2 - 1, r = Math.hypot(u, v * 1.25 + .15 * u * u);
      const n = fbm(B, x / 11, y / 11, 3), sf = 1 - r + (n - .5) * .9;
      if (sf <= 0) continue;
      const a = ss(0, .22, sf), rim = ss(0, .06, sf) * (1 - ss(.06, .26, sf));
      const gr = .6 + .4 * hash(x + k * 97, y * 13);
      const i = (y * w + x) * 4, f = 1 - .15 * rim;
      d[i] = col[0] * f; d[i + 1] = col[1] * f; d[i + 2] = col[2] * f; d[i + 3] = clamp(a * (.36 + .3 * rim) * gr) * 255;
    }
    g.putImageData(im, 0, 0); L.push(c);
  });
  return L;
}

/* =====================================================================
   La révélation : la couleur part de la lampe et gagne l'écran.
   Un masque à basse résolution (une case pour 10 px), recalculé à chaque
   image pendant la montée seulement (p 0,700 à 0,728), posé en
   « destination-in » sur le calque des lavis, agrandi avec lissage.
   ===================================================================== */
export function creerRevele() {
  const S = 10, c = document.createElement('canvas'), g = c.getContext('2d');
  /* le bord du front : un anneau un peu plus chargé (le pigment poussé par l'eau qui s'étale), qui se pose sur le lavis */
  const cb = document.createElement('canvas'), gb = cb.getContext('2d'), F2 = document.createElement('canvas'), f2 = F2.getContext('2d');
  const B = bruit2(5303), Bf = bruit2(5309);
  let mw = 0, mh = 0, im = null, imb = null, fixe = null, W = 0, H = 0, cle = '';
  function dims(w, h) {
    W = w; H = h; cle = ''; mw = Math.ceil(w / S) + 2; mh = Math.ceil(h / S) + 2;
    c.width = mw; c.height = mh; im = g.createImageData(mw, mh);
    cb.width = mw; cb.height = mh; imb = gb.createImageData(mw, mh);
    /* le bruit fixe de l'écran : de lentes langues d'eau */
    fixe = new Float32Array(mw * mh);
    for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) fixe[y * mw + x] = fbm(Bf, x * S / 150, y * S / 150, 3);
  }
  /* le rayon du front : 0 au départ ; il dépasse le coin le plus éloigné (bord adouci compris) à k = 1 */
  function rayon(ctr, k) {
    const dmax = Math.max(Math.hypot(ctr[0], ctr[1]), Math.hypot(W - ctr[0], ctr[1]), Math.hypot(ctr[0], H - ctr[1]), Math.hypot(W - ctr[0], H - ctr[1]));
    /* un départ franc (la couleur sort tout de suite autour de la façade), puis l'eau qui s'étale */
    return dmax * 1.62 * (.55 * clamp(k) + .45 * eDepl(clamp(k)));
  }
  /* lc : le contexte du calque des lavis (transformation : DPR) ; ctr : la lampe à l'écran (px CSS) ; k : 0 à 1 */
  /* L4 (douzième passe) : le masque est calculé une fois par image (le lavis du sol, rendu dans la page, s'en sert aussi) */
  function calculer(ctr, k) {
    if (!im || k >= 1) return;
    const c2 = ctr[0].toFixed(2) + ',' + ctr[1].toFixed(2) + ',' + k.toFixed(5); if (c2 === cle) return; cle = c2;
    const R = rayon(ctr, k), doux = .2 * R + 24, a = im.data, ab = imb.data, larg = doux * .2;
    for (let y = 0; y < mh; y++) {
      for (let x = 0; x < mw; x++) {
        const px = (x - 1) * S, py = (y - 1) * S, dx = px - ctr[0], dy = py - ctr[1], d = Math.hypot(dx, dy) + 1e-3;
        /* le front ondule (bruit lié à la direction, qui évolue lentement avec k) et se creuse en langues (bruit fixe) */
        const nd = B(dx / d * 1.7 + 20 + k * 1.1, dy / d * 1.7 + 20 - k * .7) - .5, nf = fixe[y * mw + x] - .5;
        const Rl = R * (1 + .28 * nd) + R * .34 * nf;
        const m = sseg(Rl - d, -doux * .5, doux * .5), e = (Rl - d - doux * .12) / larg;
        a[(y * mw + x) * 4 + 3] = m * 255;
        ab[(y * mw + x) * 4 + 3] = Math.exp(-e * e) * (.7 + .6 * (fixe[y * mw + x] - .5)) * 255;
      }
    }
    g.putImageData(im, 0, 0); gb.putImageData(imb, 0, 0);
  }
  /* L4 : le masque (ImageData d'alpha, mw x mh, une case pour S px CSS, décalé d'une case et demie), envoyé tel quel à la
     carte graphique (sans relire un canevas) */
  function masque() { return im ? { c: im, S, mw, mh } : null; }
  function appliquer(lc, dpr, ctr, k) {
    if (!im || k >= 1) return;
    calculer(ctr, k);
    const cw = lc.canvas.width, ch = lc.canvas.height, X0 = -1.5 * S * dpr, MW = mw * S * dpr, MH = mh * S * dpr;
    /* l'anneau du front : une copie du lavis, gardée seulement sur l'anneau */
    if (F2.width !== cw || F2.height !== ch) { F2.width = cw; F2.height = ch; }
    f2.setTransform(1, 0, 0, 1, 0, 0); f2.globalCompositeOperation = 'source-over'; f2.clearRect(0, 0, cw, ch); f2.drawImage(lc.canvas, 0, 0);
    f2.globalCompositeOperation = 'destination-in'; f2.imageSmoothingEnabled = true; f2.drawImage(cb, 0, 0, mw, mh, X0, X0, MW, MH);
    lc.save(); lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalCompositeOperation = 'destination-in'; lc.globalAlpha = 1; lc.imageSmoothingEnabled = true; lc.imageSmoothingQuality = 'high';
    lc.drawImage(c, 0, 0, mw, mh, X0, X0, MW, MH);
    lc.globalCompositeOperation = 'source-over'; lc.globalAlpha = .55; lc.drawImage(F2, 0, 0);
    lc.restore();
  }
  return { dims, appliquer, calculer, masque };
}
