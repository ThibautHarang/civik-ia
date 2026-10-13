/* =====================================================================
   La bande-son du film (maquette C), synthétisée en direct.
   Aucun fichier audio, aucun appel réseau : bruit filtré, oscillateurs et
   enveloppes calculés en JavaScript à l'activation, puis joués par Web Audio.

   Interface (point D14 de PASSE-4-2026-10-02.md) :
     son.disponible          le navigateur sait faire
     son.actif               le visiteur a mis le son
     await son.activer()     dans un geste du visiteur
     son.couper()            fondu de 150 ms, puis suspension
     son.progression(p, v)   à chaque image ; v : vitesse de p par seconde
     son.evenement(nom, d)   un geste ponctuel ; d : { force, panoramique (ou pan) }

   Cinquième passe (03/10/2026, PASSE-5 section A) : la bande-son est réduite
   à la matière. Restent les quatre ambiances (la nuit, l'aube, le chemin,
   l'atelier) et leurs oiseaux, le vent qui enfle avec la feuille du CV, les
   pas, la déchirure, le crayon et l'écriture. Tout ce qui ponctuait (le
   téléphone, les notes, les impacts, la porte, la pose, le clou, le crayon
   pris ou posé, la bulle, la fin) est supprimé : ces événements restent
   acceptés par l'interface et ne jouent rien. La page tournée reste dans le
   code, coupée par défaut (REGLAGES.page). Les cigales et la déchirure
   viennent de deux enregistrements de Thibaut (commun/son/, AAC, lus après
   l'activation) ; tout le reste est synthétisé, et ces deux sons ont aussi
   une version de synthèse, en repli et pour comparer (REGLAGES.matiere).

   Sixième passe (03/10/2026, PASSE-6 section A) : la fontaine et les pas
   sont coupés par défaut (REGLAGES.fontaine, REGLAGES.pasJoues), la fontaine
   refaite en eau qui tombe dans un bassin ; les cigales 8 dB plus bas.
   Point A2 (même jour) : à l'arrêt, le son est stable. Un mouvement ne
   compte que si p s'est déplacé de plus de 0,0021 en 0,4 s (le bruit de
   lissage, plus ou moins 0,001, ne déclenche rien) ; chaque geste a son
   hystérésis (il ne rejoue qu'après que p a franchement quitté sa place) ;
   le feuillage, dont les rafales de petits clics sonnaient comme une
   déchirure et des pas en boucle, est refait en bruissement continu.
   Point A3 (même jour, priorité absolue) : couper() est immédiat et
   définitif. Une variable « voulu » est relue après chaque attente ;
   couper() agit même pendant une activation en attente, arrête et
   débranche toutes les sources, annule tous les minuteurs, suspend puis
   ferme le contexte (recréé au prochain activer(), les tampons sont
   gardés) ; un chien de garde vérifie toutes les 500 ms qu'aucun contexte
   ne joue quand le son est coupé.

   Le son suit p et les événements, jamais une horloge propre au film. À
   l'arrêt, seule l'ambiance du lieu reste, très bas. En remontant,
   l'ambiance suit et tout le reste se tait. Partition et mesures : SON.md.
   ===================================================================== */
import * as TEMPS from './temps.js';

/* ------------------------------------------------------------------ */
/* Réglages (les plus probables à reprendre : SON.md)                  */
/* ------------------------------------------------------------------ */
export const REGLAGES = {
  general: 0,     // dB, tout le mélange
  ambiance: 0,    // dB, nuit, aube, chemin, atelier, oiseaux, vent
  pas: 0,         // dB
  gestes: 0,      // dB, la déchirure (et la page tournée si elle est mise)
  crayon: 0,      // dB, grattement du crayon et phrase manuscrite
  repos: -5,      // dB, l'ambiance quand plus rien ne bouge depuis 2,5 s
  page: false,    // true : la page tournée sonne (très doux)
  fontaine: false, // true : la fontaine sonne la nuit (refaite le 03/10/2026)
  pasJoues: false, // true : les pas sonnent (coupés le 03/10/2026 : « un boum boum pas intéressant »)
  ventAuRepos: 2,  // dB, l'ampleur d'une bouffée de vent quand p ne bouge pas (+7 dB en mouvement) ; 0 : aucune
  matiere: 'enregistree'   // cigales et déchirure : 'enregistree' (les enregistrements de Thibaut) ou 'synthese'
};
/* les deux enregistrements de Thibaut (cigales, déchirure), lus seulement après l'activation du son */
const DOSSIER_SONS = new URL('../../commun/son/', import.meta.url).href;
export const COUCHES = ['ambiance', 'pas', 'gestes', 'crayon'];
/* les noms acceptés : ceux du contrat D14, et « vent » ; seuls « dechirure », « vent », « page » et « page-retombe » sonnent */
export const EVENEMENTS = ['frappe', 'envoi', 'reponse', 'source', 'appui', 'prise', 'guide', 'tension', 'dechirure', 'porte',
  'pose', 'clou', 'crayon-pris', 'crayon-pose', 'glisse', 'declou', 'page', 'page-retombe', 'bulle', 'fin', 'vent'];
/* ------------------------------------------------------------------ */
/* Les bornes du film (temps.js), avec une valeur de repli par borne   */
/* ------------------------------------------------------------------ */
const T = (TEMPS && TEMPS.T) || {};
const TEMPO = (TEMPS && Array.isArray(TEMPS.TEMPO) && TEMPS.TEMPO.length > 1) ? TEMPS.TEMPO
  : [[0, 0], [6.6, .2], [10.6, .3], [15.6, .45], [22.6, .62], [27.2, .74], [31.2, .82], [35.6, .93], [44.9, 1]];
function bo(cle, repli) {
  const v = T[cle];
  if (Array.isArray(repli)) return Array.isArray(v) && v.length >= 2 && Number.isFinite(v[0]) && Number.isFinite(v[1]) ? v : repli;
  return Number.isFinite(v) ? v : repli;
}
function bornesConv() {
  const c = T.conv;
  if (Array.isArray(c) && c.length && c.every(x => x && Array.isArray(x.tape) && Number.isFinite(x.envoi))) return c;
  return [{ tape: [-.022, -.009], envoi: -.006, rep: [.008, .068], src: .072 }, { tape: [.092, .110], envoi: .112, rep: [.124, .166], src: .169 }];
}
/* temps du film (s) pour p, et l'inverse ; vitesse de p en lecture automatique */
export function tempsFilm(p) {
  for (let i = 1; i < TEMPO.length; i++) { const a = TEMPO[i - 1], z = TEMPO[i]; if (p <= z[1]) return a[0] + (z[0] - a[0]) * Math.max(0, (p - a[1]) / (z[1] - a[1])); }
  return TEMPO[TEMPO.length - 1][0];
}
export function pFilm(t) {
  for (let i = 1; i < TEMPO.length; i++) { const a = TEMPO[i - 1], z = TEMPO[i]; if (t <= z[0]) return a[1] + (z[1] - a[1]) * Math.max(0, (t - a[0]) / (z[0] - a[0])); }
  return 1;
}
function vitesseFilm(p) {
  for (let i = 1; i < TEMPO.length; i++) { const a = TEMPO[i - 1], z = TEMPO[i]; if (p <= z[1] || i === TEMPO.length - 1) return Math.max(1e-4, (z[1] - a[1]) / Math.max(1e-3, z[0] - a[0])); }
  return .022;
}

/* ------------------------------------------------------------------ */
/* Outils de synthèse (repris de la bibliothèque du moteur vidéo)      */
/* ------------------------------------------------------------------ */
const DEUX_PI = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (p, a, b) => clamp((p - a) / (b - a));
const lisse = u => u * u * (3 - 2 * u);
const sseg = (p, a, b) => lisse(seg(p, a, b));
const db = x => Math.pow(10, x / 20);
function alea(graine) {
  let s = (graine >>> 0) || 1;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hacher(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  return x => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { const e = ((ax * t + bx) * t + cx) * t - x, d = (3 * ax * t + 2 * bx) * t + cx; if (Math.abs(e) < 1e-7 || Math.abs(d) < 1e-7) break; t = clamp(t - e / d); }
    return ((ay * t + by) * t + cy) * t;
  };
}
const eDepl = bezier(.65, 0, .35, 1);

/* filtres RBJ du second ordre, en échantillon par échantillon */
function filtre(b0, b1, b2, a0, a1, a2) { return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0, x1: 0, x2: 0, y1: 0, y2: 0 }; }
function fBas(fc, sr, q = Math.SQRT1_2) { const w = DEUX_PI * Math.min(fc, sr * .45) / sr, al = Math.sin(w) / (2 * q), c = Math.cos(w); return filtre((1 - c) / 2, 1 - c, (1 - c) / 2, 1 + al, -2 * c, 1 - al); }
function fHaut(fc, sr, q = Math.SQRT1_2) { const w = DEUX_PI * Math.min(fc, sr * .45) / sr, al = Math.sin(w) / (2 * q), c = Math.cos(w); return filtre((1 + c) / 2, -(1 + c), (1 + c) / 2, 1 + al, -2 * c, 1 - al); }
function fBande(fc, q, sr) { const w = DEUX_PI * Math.min(fc, sr * .45) / sr, al = Math.sin(w) / (2 * q), c = Math.cos(w); return filtre(al, 0, -al, 1 + al, -2 * c, 1 - al); }
function f1(f, x) { const y = f.b0 * x + f.b1 * f.x1 + f.b2 * f.x2 - f.a1 * f.y1 - f.a2 * f.y2; f.x2 = f.x1; f.x1 = x; f.y2 = f.y1; f.y1 = y; return y; }
function filtrer(out, f) { for (let i = 0; i < out.length; i++) out[i] = f1(f, out[i]); return out; }
function attaque(out, n) { for (let i = 0; i < n && i < out.length; i++) out[i] *= .5 - .5 * Math.cos(Math.PI * i / n); }
function relache(out, n) { const L = out.length; for (let i = 0; i < n && i < L; i++) out[L - 1 - i] *= .5 - .5 * Math.cos(Math.PI * i / n); }
function crete(out) { let m = 0; for (let i = 0; i < out.length; i++) { const a = Math.abs(out[i]); if (a > m) m = a; } return m; }
function normaliser(out, c = 1) { const m = crete(out); if (m > 0) { const k = c / m; for (let i = 0; i < out.length; i++) out[i] *= k; } return out; }
function ajouter(dst, src, debut, g = 1) { for (let i = 0; i < src.length; i++) { const j = debut + i; if (j >= 0 && j < dst.length) dst[j] += src[i] * g; } }
/* une boucle sans couture : la queue (w échantillons après n) se fond dans la tête */
function boucler(x, n, w) {
  const y = x.slice(0, n);
  for (let i = 0; i < w; i++) { const a = Math.PI / 2 * i / w; y[i] = x[i] * Math.sin(a) + x[n + i] * Math.cos(a); }
  return y;
}
/* salve de bruit filtrée : attaque brève, décroissance exponentielle */
function salve(out, sr, rnd, t0, fc, q, tau, a, att = .0006) {
  const d = Math.round(t0 * sr), na = Math.max(1, Math.round(att * sr)), n = Math.min(out.length - d, na + Math.round(tau * 8 * sr)), bp = fBande(fc, q, sr);
  for (let i = 0; i < n; i++) out[d + i] += a * (i < na ? i / na : Math.exp(-(i - na) / (tau * sr))) * f1(bp, rnd() * 2 - 1);
}
/* bruit filtré sous une enveloppe en cloche (sommet à « pic ») ; type « bas » : passe-bas */
function bruitEnv(out, sr, rnd, t0, duree, fc, q, a, pic = .35, bas = false) {
  const d = Math.round(t0 * sr), n = Math.min(out.length - d, Math.round(duree * sr)), f = bas ? fBas(fc, sr) : fBande(fc, q, sr);
  for (let i = 0; i < n; i++) {
    const u = i / n, env = u < pic ? Math.pow(Math.sin(Math.PI / 2 * u / pic), 2) : Math.pow(Math.cos(Math.PI / 2 * (u - pic) / (1 - pic)), 1.5);
    out[d + i] += a * env * f1(f, rnd() * 2 - 1);
  }
}
/* modes amortis : le corps d'un objet ; glisse : la hauteur part un peu plus haut au choc */
function modes(out, sr, rnd, t0, liste, glisse = 0, tauG = .008) {
  const d = Math.round(t0 * sr);
  for (const [f, tau, a] of liste) {
    const n = Math.min(out.length - d, Math.round(tau * 7 * sr)); let ph = rnd() * DEUX_PI;
    for (let i = 0; i < n; i++) { const t = i / sr; ph += DEUX_PI * f * (1 + glisse * Math.exp(-t / tauG)) / sr; out[d + i] += a * Math.sin(ph) * Math.exp(-t / tau) * (1 - Math.exp(-t / .0004)); }
  }
}
/* grains : un semis d'impulsions (graviers, fibres, feuilles), plus dense au début */
function grains(out, sr, rnd, t0, duree, nb, fc, q, amp, tauG = .0005) {
  const d = Math.round(t0 * sr), ex = new Float32Array(Math.max(0, out.length - d));
  for (let k = 0; k < nb; k++) { const u = Math.pow(rnd(), 1.6), i = Math.round(u * duree * sr); if (i < ex.length) ex[i] += amp * (1 - .7 * u) * (.25 + .75 * rnd()); }
  const bp = fBande(fc, q, sr), dG = Math.exp(-1 / (tauG * sr)); let g = 0;
  for (let i = 0; i < ex.length; i++) { g = g * dG + ex[i]; out[d + i] += f1(bp, (rnd() * 2 - 1) * g); }
}
/* pièce : quelques premières réflexions courtes et mates, sans réverbération longue */
const PIECE = [[6.5, -13], [11.5, -16], [17, -19], [26, -23]];
function piece(out, sr, taps = PIECE, fc = 2600) {
  const src = Float32Array.from(out), a = fBas(fc, sr), b = fBas(fc, sr);
  for (let i = 0; i < src.length; i++) src[i] = f1(b, f1(a, src[i]));
  for (const [ms, g] of taps) ajouter(out, src, Math.round(ms / 1000 * sr), db(g));
  return out;
}

/* ------------------------------------------------------------------ */
/* Les gestes qui sonnent encore                                       */
/* ------------------------------------------------------------------ */
const TIMBRES = {
  /* la déchirure de synthèse (repli de l'enregistrement, refaite le 03/10/2026 d'après lui) : une amorce à -20 dB, puis le
     plein ; des fibres très denses d'amplitude régulière portées par le fil de la déchirure (un bruit en bande que les fibres
     font battre 180 à 320 fois par seconde), des à-coups vers 3,4 par seconde, un corps dans le grave (120 à 400 Hz) ; pas de
     gros éclats ; la feuille se libère sur 0,15 s */
  dechirure(sr, rnd) {
    const A = .05, R = A + .55 + .08 * rnd(), n = Math.round((R + .2) * sr), out = new Float32Array(n), ex = new Float32Array(n);
    const phJ = rnd() * DEUX_PI;
    const env = t => (t < A ? .12 * t / A : Math.min(1, .12 + (t - A) / .015)) * (t > R - .15 ? Math.max(0, (R - t) / .15) : 1) * (t < A ? 1 : .72 + .28 * Math.sin(DEUX_PI * 3.4 * t + phJ + .4 * Math.sin(DEUX_PI * .9 * t)));
    let t = .001;
    while (t < R) { ex[Math.round(t * sr)] += env(t) * (.55 + .45 * rnd()); t += -Math.log(1 - rnd()) / (t < A ? 900 : 3500 + 2500 * rnd()); }
    const fA = fBande(1900, .7, sr), fB = fBande(3600, 1, sr), fC = fBande(900, .9, sr), fZ = fBande(2600, .55, sr), fG = fBande(250, .7, sr), dA = Math.exp(-1 / (.00025 * sr));
    let g = 0, ph = 0;
    for (let i = 0; i < n; i++) {
      const tt = i / sr, e = tt < R ? env(tt) : 0;
      g = g * dA + ex[i];
      const c = (rnd() * 2 - 1) * g;
      ph += (180 + 140 * Math.min(1, tt / R)) * (1 + (rnd() - .5) * .5) / sr; if (ph >= 1) ph -= 1;
      const fil = f1(fZ, rnd() * 2 - 1) * e * (.45 + .55 * Math.pow(1 - ph, 6));
      out[i] = f1(fA, c) * .8 + f1(fB, c) * .3 + f1(fC, c) * .5 + fil * FIL_DECHIRURE + f1(fG, rnd() * 2 - 1) * e * .35;
    }
    filtrer(out, fHaut(70, sr)); filtrer(out, fBas(7500, sr)); filtrer(out, fBas(8500, sr));
    attaque(out, Math.round(.004 * sr));
    return normaliser(out);
  },
  /* la page soulevée (coupée par défaut) : le pouce sous le bord, le papier épais qui se courbe */
  page(sr, rnd) {
    const d = .8, out = new Float32Array(Math.round((d + .05) * sr));
    bruitEnv(out, sr, rnd, 0, .08, 2600, .9, .3, .3);
    const b1 = fBande(900, .55, sr), b2 = fBande(240, 1.3, sr), b3 = fBande(2900, .9, sr), dG = Math.exp(-1 / (.0005 * sr)), d0 = Math.round(.03 * sr);
    let g = 0;
    for (let i = d0; i < out.length; i++) {
      const t = (i - d0) / sr, u = Math.min(1, t / (d - .03));
      const env = u < .32 ? Math.pow(Math.sin(Math.PI / 2 * u / .32), 2) : Math.pow(Math.cos(Math.PI / 2 * (u - .32) / .68), 1.3);
      if (rnd() < (40 + 220 * Math.sin(Math.PI * u)) / sr) g += .4 + .8 * rnd() * rnd();
      g *= dG;
      const ondule = .65 + .35 * Math.sin(DEUX_PI * (6 + 3 * u) * t);
      out[i] += env * (f1(b1, rnd() * 2 - 1) * .55 * ondule + f1(b2, rnd() * 2 - 1) * .5 * (.6 + .4 * Math.sin(DEUX_PI * 4.3 * t)) + f1(b3, (rnd() * 2 - 1) * g) * .9);
    }
    modes(out, sr, rnd, .14, [[185, .05, .18], [400, .03, .12]], .1);
    bruitEnv(out, sr, rnd, .135, .05, 1800, .8, .25, .2);
    filtrer(out, fHaut(90, sr)); filtrer(out, fBas(7000, sr));
    attaque(out, Math.round(.004 * sr)); relache(out, Math.round(.05 * sr));
    return normaliser(out);
  },
  /* la feuille retombe de l'autre côté (coupée par défaut) : un claquement doux, puis le silence */
  'page-retombe'(sr, rnd) {
    const out = new Float32Array(Math.round(.5 * sr)), c = .03;
    bruitEnv(out, sr, rnd, 0, .045, 700, 0, .5, .75, true);
    salve(out, sr, rnd, c, 1700, .6, .005, .8); salve(out, sr, rnd, c, 3000, .9, .003, .3); salve(out, sr, rnd, c, 650, .8, .012, .45);
    modes(out, sr, rnd, c, [[118, .045, .18], [265, .025, .1]], .08);
    grains(out, sr, rnd, c + .012, .12, 16, 2600, .9, .25);
    filtrer(out, fBas(7500, sr)); piece(out, sr); attaque(out, Math.round(.003 * sr));
    return normaliser(out);
  }
};
const FIL_DECHIRURE = .9;

/* ------------------------------------------------------------------ */
/* Les pas (adoucis le 03/10/2026) : attaque de 6 à 12 ms, rien au-dessus de 3 kHz ; terre et gravier fin, seuil de pierre, plancher */
/* ------------------------------------------------------------------ */
const PIECE_PAS = [[6, -11], [11, -14], [17, -18], [26, -22]];
function pas(sol, sr, rnd) {
  const out = new Float32Array(Math.round(.42 * sr));
  let att = .007, coupe = 3000;
  if (sol === 'terre') {
    modes(out, sr, rnd, 0, [[118 + 16 * rnd(), .03, .3], [236, .018, .12]], .12, .015);   // le talon, sourd et rond
    bruitEnv(out, sr, rnd, 0, .08, 900, .6, .7, .25);                                     // la semelle qui frotte la terre
    grains(out, sr, rnd, .004, .085, 14 + Math.round(6 * rnd()), 1600, .8, 1.8, .0008);   // un peu de gravier fin, des grains ronds
    const t1 = .1 + .03 * rnd();                                                           // le pied qui déroule
    bruitEnv(out, sr, rnd, t1, .08, 1100, .6, .45, .3);
    grains(out, sr, rnd, t1, .05, 7, 1800, .8, 1, .0008);
  } else if (sol === 'pierre') {
    modes(out, sr, rnd, 0, [[168, .025, .3], [380, .014, .2]], .1);
    bruitEnv(out, sr, rnd, 0, .06, 1200, .8, .6, .2);
    grains(out, sr, rnd, .003, .04, 6, 2000, .8, .5, .0008);
    bruitEnv(out, sr, rnd, .1 + .02 * rnd(), .045, 1300, .9, .18, .25);
    att = .006;
  } else if (sol === 'bois') {
    modes(out, sr, rnd, 0, [[150 + 12 * rnd(), .035, .35], [330, .03, .35], [690, .014, .18]], .1);
    bruitEnv(out, sr, rnd, 0, .06, 950, .7, .5, .2);
    const t1 = .1 + .025 * rnd(); modes(out, sr, rnd, t1, [[200, .025, .2], [440, .015, .12]]); bruitEnv(out, sr, rnd, t1, .05, 900, .8, .15, .25);
    piece(out, sr, PIECE_PAS, 2200);
    att = .006; coupe = 2600;
  } else if (sol === 'recul') {
    bruitEnv(out, sr, rnd, 0, .18, 1300, .6, .35, .35); grains(out, sr, rnd, .01, .16, 8, 1800, .6, .6, .0008); modes(out, sr, rnd, .03, [[110, .03, .35]]);
    att = .01;
  } else if (sol === 'pivot') {
    bruitEnv(out, sr, rnd, 0, .24, 1200, .5, .4, .45); grains(out, sr, rnd, 0, .22, 14, 1800, .7, .6, .0008); modes(out, sr, rnd, .02, [[110, .03, .3]]);
    att = .012;
  } else if (sol === 'feuille') {   /* le CV tenu bat un peu à chaque pas */
    const b1 = fBande(1600, .9, sr), b2 = fBande(3000, 1, sr), n = Math.round(.12 * sr);
    for (let i = 0; i < n; i++) { const t = i / sr, x = rnd() * 2 - 1; out[i] = (f1(b1, x) * .8 + f1(b2, x) * .25) * Math.pow(Math.sin(Math.PI * t / .12), 2) * (.6 + .4 * Math.sin(DEUX_PI * 24 * t)); }
    att = .01; coupe = 4000;
  }
  filtrer(out, fBas(coupe, sr)); filtrer(out, fBas(coupe * 1.15, sr)); attaque(out, Math.round(att * sr));
  return normaliser(out);
}
const VARIANTES_PAS = { terre: 6, pierre: 2, bois: 4, recul: 2, pivot: 1, feuille: 3 };
/* ------------------------------------------------------------------ */
/* Les oiseaux : rares, doux, lointains                                */
/* ------------------------------------------------------------------ */
function oiseau(type, sr, rnd) {
  const N = [];   // [début, durée, f0, f1, vibrato, fréquence du vibrato, amplitude]
  if (type === 0) N.push([0, .034, 7200, 4800, 0, 0, 1], [.125, .03, 7000, 4700, 0, 0, .75]);
  else if (type === 1) {
    const F = [[3800, 4600, 0, 0], [3600, 3600, .07, 38], [4700, 3500, 0, 0], [2900, 3100, .02, 20], [5200, 4300, 0, 0], [3300, 3900, 0, 0]];
    let t = 0;
    for (let k = 0; k < 6; k++) { const f = F[(k * 5 + Math.floor(rnd() * 3)) % 6], d = .045 + .045 * rnd(); N.push([t, d, f[0], f[1], f[2], f[3], .6 + .4 * rnd()]); t += d + .016 + .03 * rnd(); }
  } else if (type === 2) N.push([0, .08, 4300, 4220, 0, 0, 1], [.125, .09, 3200, 3040, 0, 0, .85], [.29, .08, 4300, 4220, 0, 0, .9], [.415, .09, 3200, 3040, 0, 0, .75]);
  else N.push([0, .16, 1950, 2100, .012, 5.5, 1], [.215, .14, 2380, 2290, .012, 6, .8], [.4, .19, 2150, 1880, .015, 5, .9]);
  let fin = 0; N.forEach(x => { fin = Math.max(fin, x[0] + x[1]); });
  const out = new Float32Array(Math.round((fin + .06) * sr)), h2 = type === 3 ? .07 : .025;
  for (const [t0, d, fa, fz, vb, vf, a] of N) {
    const i0 = Math.round(t0 * sr), n = Math.round(d * sr), na = Math.round((type === 3 ? .02 : .006) * sr), nr = Math.round((type === 3 ? .04 : .014) * sr);
    let ph = rnd() * DEUX_PI;
    for (let i = 0; i < n && i0 + i < out.length; i++) {
      const u = i / n, t = i / sr, f = fa * Math.pow(fz / fa, u) * (1 + vb * Math.sin(DEUX_PI * vf * t));
      ph += DEUX_PI * f / sr;
      const env = (i < na ? Math.pow(Math.sin(Math.PI / 2 * i / na), 2) : 1) * (i > n - nr ? Math.pow(Math.sin(Math.PI / 2 * (n - i) / nr), 2) : 1);
      out[i0 + i] += a * env * (Math.sin(ph) + h2 * Math.sin(2 * ph));
    }
  }
  filtrer(out, fBas(type === 3 ? 5000 : 8500, sr));
  return normaliser(out);
}


/* ------------------------------------------------------------------ */
/* Les matières des ambiances : boucles sans couture, 24 kHz, mono     */
/* ------------------------------------------------------------------ */
const SR_TEX = { cigales: 24000, feuilles: 24000, fontaine: 16000, papier: 16000, air: 12000 };
const TEXTURES = {
  /* les cigales de synthèse (repli de l'enregistrement, refaites le 03/10/2026 d'après lui) : du bruit en bande, large (2 à
     8 kHz, sommet vers 4,5 kHz), pulsé 5 à 6 fois par seconde et profondément, grené par les cymbales, en bouffées de 0,8 s
     environ à pleine force séparées de 0,5 s plus bas de 15 à 20 dB ; trois individus décalés en hauteur et en rythme ;
     aucune raie pure (c'était le défaut des grillons en sinus : « électroniques, presque métalliques ») */
  cigales(sr, rnd) {
    const L = 6.4, w = .4, n = Math.round(L * sr), W = Math.round(w * sr), m = n + W, x = new Float32Array(m);
    for (const c of [{ f: 4300, q: 1.1, puls: 5.5, a: 1 }, { f: 4900, q: 1.3, puls: 5.2, a: .7 }, { f: 3800, q: 1.2, puls: 5.9, a: .5 }]) {
      const b1 = fBande(c.f, c.q, sr), b2 = fBande(c.f * 1.35, 1.6, sr), aB = Math.exp(-1 / (.08 * sr));
      let ph = rnd(), phG = 0, bouf = 1, cible = 1, prochain = Math.round(rnd() * .6 * sr);
      for (let i = 0; i < m; i++) {
        if (i >= prochain) { const fort = cible < .5; cible = fort ? 1 : db(-15 - 5 * rnd()); prochain = i + Math.round((fort ? .65 + .35 * rnd() : .35 + .3 * rnd()) * sr); }
        bouf = cible + (bouf - cible) * aB;
        ph += c.puls * (1 + (rnd() - .5) * .002) / sr; if (ph >= 1) ph -= 1;
        phG += (190 + 40 * rnd()) / sr; if (phG >= 1) phG -= 1;
        const nz = rnd() * 2 - 1;
        x[i] += c.a * bouf * (.14 + .86 * Math.pow(Math.sin(Math.PI * ph), 3)) * (.55 + .45 * Math.pow(1 - phG, 3)) * (f1(b1, nz) + .35 * f1(b2, nz));
      }
    }
    filtrer(x, fHaut(1500, sr)); filtrer(x, fHaut(1500, sr)); filtrer(x, fBas(9000, sr));
    return boucler(x, n, W);
  },
  /* la fontaine (refaite le 03/10/2026, coupée par défaut) : de l'eau qui tombe dans un bassin. Un bruit large et doux
     (200 Hz à 4 kHz) qui bouillonne lentement et irrégulièrement, un corps plus grave (300 à 900 Hz) qui respire à
     part, des éclaboussures faites de bruit seulement ; aucune raie (les bulles en sinus de la première version
     sonnaient « métallique »), rien au-dessus de 4 kHz */
  fontaine(sr, rnd) {
    const L = 6.2, w = .4, n = Math.round(L * sr), W = Math.round(w * sr), m = n + W, x = new Float32Array(m);
    const h1 = fHaut(200, sr), h2 = fHaut(200, sr), l1 = fBas(3200, sr), l2 = fBas(4000, sr), bC = fBande(550, .6, sr), bE = fBande(1500, .7, sr), lF = fBas(4200, sr);
    const kA = Math.exp(-1 / (.09 * sr)), kC = Math.exp(-1 / (.16 * sr)), kE = Math.exp(-1 / (.012 * sr));
    let a = 1, ca = 1, pa = 0, c = 1, cc = 1, pc = 0, e = 0;
    for (let i = 0; i < m; i++) {
      if (i >= pa) { ca = .55 + .9 * rnd(); pa = i + Math.round((.12 + .3 * rnd()) * sr); }
      if (i >= pc) { cc = .4 + 1.2 * rnd(); pc = i + Math.round((.2 + .5 * rnd()) * sr); }
      a = ca + (a - ca) * kA; c = cc + (c - cc) * kC;
      if (rnd() < 11 / sr) e += .5 + rnd();
      e *= kE;
      const large = f1(l2, f1(l1, f1(h2, f1(h1, rnd() * 2 - 1)))) * a;
      x[i] = f1(lF, large + f1(bC, rnd() * 2 - 1) * c * .9 + f1(bE, rnd() * 2 - 1) * e * .6);
    }
    return boucler(x, n, W);
  },
  /* le feuillage (refait le 03/10/2026, point A2) : un bruissement continu et doux, de 1,5 à 6 kHz, qui frémit à peine et
     respire lentement (moins de 3 dB sur la boucle). La première version, des rafales de petits clics de feuilles (28 dB
     d'écart, kurtosis jusqu'à 23), sonnait à l'arrêt comme une déchirure qui rejoue et des pas brouillons, toutes les 8 s */
  feuilles(sr, rnd) {
    const L = 8.1, w = .5, n = Math.round(L * sr), W = Math.round(w * sr), m = n + W, x = new Float32Array(m);
    const p1 = rnd() * DEUX_PI, p2 = rnd() * DEUX_PI;
    const h1 = fHaut(1500, sr), h2 = fHaut(1500, sr), l1 = fBas(5500, sr), l2 = fBas(6000, sr), b = fBande(2600, .8, sr), kF = Math.exp(-1 / (.05 * sr));
    let fr = 1, cf = 1, pf = 0;
    for (let i = 0; i < m; i++) {
      const t = i / sr, souffle = .86 + .09 * Math.sin(DEUX_PI * 2 * t / L + p1) + .05 * Math.sin(DEUX_PI * 3 * t / L + p2);
      if (i >= pf) { cf = .88 + .12 * rnd(); pf = i + Math.round((.06 + .1 * rnd()) * sr); }
      fr = cf + (fr - cf) * kF;
      const nz = rnd() * 2 - 1;
      x[i] = (f1(l2, f1(l1, f1(h2, f1(h1, nz)))) * .8 + f1(b, nz) * .35) * souffle * fr;
    }
    return boucler(x, n, W);
  },
  /* l'air : un souffle grave qui enfle et retombe lentement ; filtré, il devient l'air calme de l'atelier */
  air(sr, rnd) {
    const L = 9.3, w = .5, n = Math.round(L * sr), W = Math.round(w * sr), m = n + W, x = new Float32Array(m);
    const p1 = rnd() * DEUX_PI, p2 = rnd() * DEUX_PI, p3 = rnd() * DEUX_PI;
    const l1 = fBas(900, sr), l2 = fBas(1400, sr), hp = fHaut(110, sr), bp = fBande(480, .9, sr);
    for (let i = 0; i < m; i++) {
      const t = i / sr, s = .8 + .1 * Math.sin(DEUX_PI * 2 * t / L + p1) + .06 * Math.sin(DEUX_PI * 3 * t / L + p2) + .04 * Math.sin(DEUX_PI * 7 * t / L + p3), nz = rnd() * 2 - 1;
      x[i] = f1(hp, f1(l2, f1(l1, nz)) * .8 + f1(bp, nz) * .5) * s;
    }
    return boucler(x, n, W);
  },
  /* le papier épais qui s'enroule : fibres qui craquent, corps qui ondule, un « wub » grave */
  papier(sr, rnd) {
    const L = 2.4, w = .2, n = Math.round(L * sr), W = Math.round(w * sr), m = n + W, x = new Float32Array(m);
    const b1 = fBande(650, .7, sr), b2 = fBande(2600, .8, sr), b3 = fBande(230, 1.4, sr), hp = fHaut(140, sr), lp = fBas(6000, sr), dG = Math.exp(-1 / (.0005 * sr));
    let g = 0;
    for (let i = 0; i < m; i++) {
      const t = i / sr;
      if (rnd() < 90 / sr) g += .2 + .8 * rnd() * rnd();
      g *= dG;
      x[i] = f1(lp, f1(hp, f1(b1, rnd() * 2 - 1) * .7 * (.65 + .35 * Math.sin(DEUX_PI * 11 * t)) + f1(b2, (rnd() * 2 - 1) * g) * .8 + f1(b3, rnd() * 2 - 1) * .35 * (.5 + .5 * Math.sin(DEUX_PI * 4.5 * t))));
    }
    return boucler(x, n, W);
  }
};
/* le seul tampon de bruit partagé : bruit blanc à grain fin (le grain du stylo validé), 2 s, en boucle */
function bruitGrain(sr, rnd) {
  const n = Math.round(2 * sr), W = Math.round(.1 * sr), x = new Float32Array(n + W), dG = Math.exp(-1 / (.0004 * sr)), pr = 2600 / sr;
  let g = 0;
  for (let i = 0; i < x.length; i++) { if (rnd() < pr) g += .8 + .2 * rnd(); g *= dG; x[i] = (rnd() * 2 - 1) * (.6 + .5 * g); }
  return boucler(x, n, W);
}
/* rogne la queue d'un son court sous -80 dB de sa crête, avec un fondu de 5 ms */
function rogner(x, sr) {
  const s = crete(x) * 1e-4; let n = x.length;
  while (n > 1 && Math.abs(x[n - 1]) < s) n--;
  const y = x.slice(0, Math.min(x.length, n + Math.round(.005 * sr)));
  relache(y, Math.round(.005 * sr));
  return y;
}
function rmsDe(x) { let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i]; return Math.sqrt(s / Math.max(1, x.length)); }


/* ------------------------------------------------------------------ */
/* La partition : ce que le module calcule seul à partir de p           */
/* ------------------------------------------------------------------ */
/* profil de vitesse de la caméra (montée, plateau, descente), comme monde.js : p pour une fraction de la distance */
function profilMarche(a, b, montee, descente) {
  const N = 600, acc = new Float64Array(N + 1), v = p => sseg(p, a, a + montee) * (1 - sseg(p, b - descente, b));
  for (let i = 1; i <= N; i++) { const p0 = a + (b - a) * (i - 1) / N, p1 = a + (b - a) * i / N; acc[i] = acc[i - 1] + (v(p0) + v(p1)) / 2 * (p1 - p0); }
  return F => { const c = F * acc[N]; let i = 1; while (i < N && acc[i] < c) i++; const k = (c - acc[i - 1]) / Math.max(1e-12, acc[i] - acc[i - 1]); return a + (b - a) * (i - 1 + k) / N; };
}
function inverseDepl(z, F) { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (eDepl(m) < F) lo = m; else hi = m; } return lerp(z[0], z[1], (lo + hi) / 2); }
/* vitesse de la caméra, de 0 à 1, sur un tronçon (mêmes profils que monde.js) */
function vitesseRampe(a, b, montee, descente) { return p => sseg(p, a, a + montee) * (1 - sseg(p, b - descente, b)); }
function vitesseDepl(a, b) {
  const d = u => { const h = .002, u0 = Math.max(0, u - h), u1 = Math.min(1, u + h); return (eDepl(u1) - eDepl(u0)) / (u1 - u0); };
  let m = 0; for (let i = 0; i <= 100; i++) m = Math.max(m, d(i / 100));
  return p => (p <= a || p >= b ? 0 : d((p - a) / (b - a)) / m);
}
function vitesseCloche(a, b) { return p => (p <= a || p >= b ? 0 : Math.pow(Math.sin(Math.PI * (p - a) / (b - a)), .8)); }
/* une cadence régulière de marche tranquille : un pas toutes les « periode » secondes de film (deux pas par seconde
   en lecture automatique), posé sur le temps du film, donc sur p ; seulement là où la caméra avance vraiment, plus
   léger quand elle ralentit. Le visiteur qui défile plus vite marche plus vite ; s'il s'arrête, plus rien. */
function poserPas(L, a, b, vit, periode, sol) {
  const t0 = tempsFilm(a), t1 = tempsFilm(b);
  for (let t = t0 + periode * .5; t < t1; t += periode) { const p = pFilm(t), v = vit(p); if (v >= .1) L.push({ p, sol, force: .55 + .45 * Math.min(1, v) }); }
}
function partitionPas() {
  const L = [];
  const marche = bo('marche', [.29, .455]), approche = bo('approche', [.455, .508]), recul = bo('recul', [.654, .688]), pivot = bo('pivot', [.66, .694]);
  const route = bo('route', [.688, .753]), porte = bo('porte', [.728, .752]), table = bo('table', [.748, .788]), dechire = bo('dechire', .646), poseCv = bo('poseCv', [.79, .81]);
  /* la marche puis l'approche du poteau, d'une seule foulée */
  const vM = vitesseRampe(marche[0], marche[1], .09, .05), vA = vitesseDepl(approche[0], approche[1]);
  poserPas(L, marche[0], approche[1], p => (p <= marche[1] ? vM(p) : vA(p)), .5, 'terre');
  /* le recul et le pivot vers l'atelier, CV en main */
  L.push({ p: inverseDepl(recul, .3), sol: 'recul', force: .8 });
  L.push({ p: lerp(pivot[0], pivot[1], .62), sol: 'pivot', force: .75 });
  /* la route, un peu plus vite, le seuil, puis le plancher jusqu'à la table */
  const vR = vitesseRampe(route[0], route[1], .018, .024), vT = vitesseCloche(route[1], table[1]);
  poserPas(L, route[0], table[1], p => (p <= route[1] ? vR(p) : vT(p)), .46, 'route');
  L.sort((x, y) => x.p - y.p);
  const s0 = lerp(porte[0], porte[1], .3), s1 = lerp(porte[0], porte[1], .75);
  let cote = 1;
  L.forEach(s => {
    if (s.sol === 'route') s.sol = s.p < s0 ? 'terre' : s.p < s1 ? 'pierre' : 'bois';
    cote = -cote; s.cote = cote;
    s.feuille = s.p > dechire + .02 && s.p < poseCv[0];
  });
  return L;
}
/* les oiseaux : trois à l'aube, puis quelques-uns le long du chemin, à des places fixes de p (ils arrivent avec le
   chemin, au passage, et se taisent si l'on remonte) ; à l'arrêt sur le chemin, un oiseau rare de temps en temps */
function partitionOiseaux() {
  const nj = bo('nuitJour', [.232, .31]);
  return [[nj[0] + .022, 0], [nj[0] + .04, 1], [nj[0] + .062, 2], [.345, 3], [.43, 1], [.535, 2], [.6, 0], [.705, 3]]
    .map(([p, cle], k) => ({ p, cle, t: -99, re: true, pan: [-.5, 0, .5, -.35, .4, -.2, .55, -.45][k] }));
}
function masqueSegments(n, segs, creux = .08) {
  const M = new Float32Array(n).fill(creux);
  for (const [a, z, niv] of segs) {
    const r = Math.max(1e-4, (z - a) * .15);
    for (let i = 0; i < n; i++) { const x = i / (n - 1); if (x >= a && x <= z) M[i] = Math.max(M[i], creux + (niv - creux) * Math.min(1, (x - a) / r, (z - x) / r)); }
  }
  return M;
}
function traits(nb, graine, de = 0, a = 1, ecart = .035, niv = 1) {
  const r = alea(graine), L = []; let tot = 0;
  for (let k = 0; k < nb; k++) { const l = .5 + r(); L.push(l); tot += l; }
  const util = (a - de) - ecart * (nb - 1), S = []; let u = de;
  for (let k = 0; k < nb; k++) { const l = L[k] / tot * util; S.push([u, u + l, niv * (.85 + .15 * r())]); u += l + ecart; }
  return S;
}
/* l'écriture réelle de Thibaut : débit d'encre en 200 tranches de temps, tiré de commun/img/c/ecriture-temps.png
   (0 : la pointe se lève), et position de la pointe de gauche à droite (ecriture.json, 41 points) */
const ENCRE = 'zrnrltyzxkqizat67nf6atqi08mb4hy85lwa6rgdwg00nc35ql6czmfd2czxze7bk9a5icbvv864amtznj5mzs54c7ez963000000puniikbohnd89a8zz647bccjmzzzz60jho97ke6gzl4gpf8639aaizz75615771h9afcjcbesbg7330fua320000007r8622i9l';
const POINTE_X = [.03, .06, .11, .14, .18, .26, .33, .37, .42, .56, .59, .64, .74, .75, .8, .84, .86, .9, .96, .97, .42, .27, .32, .37, .4, .44, .5, .43, .48, .52, .52, .58, .56, .68, .72, .77, .81, .84, .9, .94, .98];
function masqueEcriture() { const M = new Float32Array(ENCRE.length); for (let i = 0; i < M.length; i++) M[i] = Math.min(1, parseInt(ENCRE[i], 36) / 30); return M; }
function partitionZones() {
  const Z = [], ajout = (cle, repli, o) => { const z = bo(cle, repli); if (z[1] > z[0]) Z.push(Object.assign({ cle, de: z[0], a: z[1] }, o)); };
  const tourne = bo('tourne', [.9525, .9675]), retombe = bo('retombe', [.9655, .9755]);
  /* le point d'interrogation : trois passes, le point, cinq griffes */
  ajout('qm', [.837, .851], { tex: 'bruit', niv: -22, hp: 800, lp: 3000, pan: () => .3,
    masque: masqueSegments(96, [[0, .18, 1], [.205, .385, .95], [.41, .58, .9], [.62, .69, .8], [.74, .78, .7], [.795, .835, .7], [.85, .89, .7], [.905, .945, .7], [.96, 1, .7]]) });
  ajout('croquis', [.863, .885], { tex: 'bruit', niv: -22.5, hp: 800, lp: 3000, pan: u => .08 + .45 * u, masque: masqueSegments(96, traits(16, 31)) });
  ajout('couleur', [.884, .906], { tex: 'bruit', niv: -25, hp: 650, lp: 2300, pan: u => .08 + .4 * u, masque: masqueSegments(96, traits(8, 37, 0, 1, .03, .85)) });
  ajout('app', [.905, .919], { tex: 'bruit', niv: -23.5, hp: 800, lp: 2800, pan: () => .55, masque: masqueSegments(96, traits(7, 41, 0, .5).concat(traits(2, 43, .52, 1, .03, .8))) });
  /* la page tournée (seulement si REGLAGES.page) : un bruissement ample qui suit l'enroulement, très doux */
  Z.push({ cle: 'tourne', page: true, de: tourne[0], a: tourne[1], tex: 'papier', niv: -27, hp: 260, lp: 3600, pan: u => .3 - .2 * u,
    masque: (() => { const M = new Float32Array(96); for (let i = 0; i < 96; i++) { const u = i / 95; M[i] = .12 + .88 * Math.pow(4 * u * (1 - u), .7); } return M; })() });
  Z.push({ cle: 'retombe', page: true, de: Math.max(retombe[0], tourne[1]), a: lerp(retombe[0], retombe[1], .5), tex: 'papier', niv: -32, hp: 300, lp: 2400, pan: () => .1,
    masque: (() => { const M = new Float32Array(48); for (let i = 0; i < 48; i++) { const u = i / 47; M[i] = Math.pow(1 - u, 2); } return M; })() });
  /* la phrase de Thibaut */
  ajout('ecrit', [.980, .9935], { tex: 'bruit', niv: -21.5, hp: 800, lp: 3000, masque: masqueEcriture(),
    pan: u => { const x = u * (POINTE_X.length - 1), i = Math.floor(x), k = x - i, px = POINTE_X[i] * (1 - k) + POINTE_X[Math.min(POINTE_X.length - 1, i + 1)] * k; return -.06 + .58 * px; } });
  return Z;
}
/* les événements des plans, à leur place de référence : pour le banc et le rendu hors ligne (le film émet les siens).
   La plupart ne sonnent plus ; ils restent pour vérifier qu'ils sont acceptés sans bruit. Les bouffées de vent du
   croisement sont posées ici à des places de p ; dans le film, elles suivent la feuille, au temps de son animation. */
export function reperesEvenements() {
  const L = [], Q = ['Bonsoir, comment inscrire mon fils à la cantine pour septembre ?', 'Connaissez-vous Thibaut Harang ?'];
  bornesConv().forEach((c, i) => {
    const q = Q[i] || 'xxxxxxxxxx', a = c.tape[0], z = c.tape[1];
    for (let k = 0; k < q.length; k++) L.push({ p: a + (z - a) * (k + .5) / q.length, nom: 'frappe', d: { caractere: q[k] } });
    L.push({ p: c.envoi, nom: 'envoi' });
    if (Array.isArray(c.rep)) L.push({ p: c.rep[0], nom: 'reponse' });
    if (Number.isFinite(c.src)) L.push({ p: c.src, nom: 'source' });
  });
  const mm = bo('mainMonte', [.214, .246]), porte = bo('porte', [.728, .752]), clou = bo('clou', [.806, .812]), pousse = bo('pousse', [.9305, .9395]);
  const declou = bo('declou', [.939, .9505]), retombe = bo('retombe', [.9655, .9755]);
  L.push({ p: bo('appui', [.199, .205])[0], nom: 'appui' });
  L.push({ p: lerp(mm[0], mm[1], .9), nom: 'prise' });
  [bo('consigne1', .325), bo('consigne2', .402), bo('arrive', .462)].forEach(p => L.push({ p, nom: 'guide' }));
  [[.468, .45], [.49, .7], [.515, .55], [.54, .85], [.565, .6], [.588, .9], [.61, .65], [.628, .5]].forEach(([p, force]) => L.push({ p, nom: 'vent', d: { force } }));
  L.push({ p: bo('tire', [.634, .646])[0], nom: 'tension' }, { p: bo('dechire', .646), nom: 'dechirure' });
  L.push({ p: lerp(porte[0], porte[1], .6), nom: 'porte' });
  L.push({ p: bo('poseTel', [.788, .804])[1] - .002, nom: 'pose' });
  L.push({ p: lerp(clou[0], clou[1], .3), nom: 'clou' });
  L.push({ p: bo('saisie', [.826, .829])[0], nom: 'crayon-pris' });
  L.push({ p: bo('lache', [.9245, .9265])[0], nom: 'crayon-pose' });
  L.push({ p: lerp(pousse[0], pousse[1], .3), nom: 'glisse' });
  L.push({ p: lerp(declou[0], declou[1], .25), nom: 'declou' });
  L.push({ p: bo('mainBas', [.95, .9535])[1], nom: 'page' });
  L.push({ p: lerp(retombe[0], retombe[1], .6), nom: 'page-retombe' });
  L.push({ p: bo('saisie8', [.977, .978])[0], nom: 'crayon-pris' });
  L.push({ p: bo('bulle', [.9915, .9965])[0], nom: 'bulle' });
  L.push({ p: bo('lache8', [.997, .998])[0], nom: 'crayon-pose' });
  L.push({ p: 1, nom: 'fin' });
  return L.sort((x, y) => x.p - y.p);
}

/* ------------------------------------------------------------------ */
/* Les niveaux (dB, crête d'un son seul au centre, avant le limiteur)  */
/* ------------------------------------------------------------------ */
/* hiérarchie visée (sonie momentanée, 400 ms, mesurée en sortie, SON.md) : la déchirure au sommet, le crayon et les
   pas dessous, les ambiances nettement sous tout le reste ; la page tournée, si elle est mise, très douce */
const EV = {
  dechirure: { niv: -12, pan: .35 },
  page: { niv: -24, pan: .25, page: true },
  'page-retombe': { niv: -18, pan: .2, page: true }
};
/* la déchirure enregistrée (0,83 s, plus longue et plus dense que celle de synthèse) : réglée à la même sonie */
const NIV_DECHIRURE_ENR = -13.6;
const NIV_PAS = { terre: -19, pierre: -20, bois: -19.5, recul: -22, pivot: -22, feuille: -29 };
const NIV_OISEAU = -39;
/* ambiances : texture ramenée à une valeur efficace de 0,25, puis ce gain (les cigales 8 dB plus bas depuis le 03/10/2026,
   la fontaine coupée par défaut) ; « dist » : le filtre qui suit le lieu (les
   cigales s'adoucissent avec l'aube, la fontaine s'assourdit en s'éloignant) ; « bouffees » : les deux couches de cigales
   enflent et retombent au hasard ; « bouffee » : le vent (l'air et le feuillage) enfle à chaque événement « vent » */
const AMB = [
  { nom: 'cigales', voix: [[1, -.4, 0], [.965, .45, .45]], niv: -47, bouffees: true, dist: w => 3000 + 4000 * Math.pow(w, 1.5) },
  { nom: 'fontaine', voix: [[1, .2, 0]], niv: -33.4, dist: w => 1100 + 4900 * Math.pow(w, 1.2) },
  { nom: 'air', stereo: [[1, 0], [1.031, .5]], niv: -33, filtre: true, bouffee: 1.2 },
  { nom: 'feuilles', stereo: [[1, 0], [.968, .5]], niv: -37, bouffee: .8 }
];
/* gain de sortie, avant le limiteur (la crête de la déchirure l'effleure) */
const GAIN_SORTIE = 3;
/* le seuil de mouvement (point A2) : p doit s'être déplacé de plus de 0,0021 sur une fenêtre de 0,4 s, allongée jusqu'à
   1 s dans les passages lents du film (là où la lecture automatique avance de moins de 0,0026 en 0,4 s, comme l'écriture) ;
   le bruit de lissage du moteur (plus ou moins 0,001, soit 0,002 au plus d'un bord à l'autre) n'est donc jamais un mouvement */
const SEUIL_MOUVEMENT = .0021, FENETRE_MIN = .4, FENETRE_MAX = 1;
/* l'hystérésis : un geste, un pas ou un oiseau ne rejoue qu'après que p est redescendu de cette distance sous sa place ;
   et un même geste jamais deux fois en 2,5 s */
const HYSTERESIS = .02, ECART_GESTE = 2.5;
const MAX_VOIX = 14;
/* ------------------------------------------------------------------ */
/* Le moteur                                                           */
/* ------------------------------------------------------------------ */
export function creerSon(options = {}) {
  const horsLigne = !!options.contexte;
  let ctx = options.contexte || null;
  let construit = false, pret = false, actif = false, reduit = false, ecoute = false;
  /* « voulu » : le visiteur veut du son. Toute suite asynchrone le relit ; couper() le met à faux, pour de bon */
  let voulu = false, chien = 0, tFermeture = 0, tCoupe = -1e9, ancienCtx = null, liberer = null;
  const sourcesCourtes = new Set();
  const rnd = alea(options.graine || ((Date.now() % 65521) + 1));
  let sr = 48000, maitre = null, limiteur = null, ecreteur = null, melange = null, analyseurs = null;
  const G = {}, muet = {}, cache = new Map();
  let PAS = [], OISEAUX = [], ZONES = [], iPas = 0;
  const W = new Float32Array(4), ETAT = AMB.map(def => ({ def, n: null, cible: 0, tZero: -99, fc: 0, fd: 0, matiere: null, prochain: [0, 0] }));
  const enr = { etat: 'rien', promesse: null, depuis: 0 };
  let pMemo = 0, pCour = 0, tPrec = 0, vLisse = 0, rel = 0, sens = 0, tSens = -99, tMouv = -99, tEntretien = -99;
  let generation = 0, auRepos = false, canard = false, tCanard = -99, r0 = -99, r1 = -99;
  let tPas = -99, kPas = 0, tGeste = -99, tVent = -99, voixActives = 0;
  const HIST = 96, histT = new Float64Array(HIST), histP = new Float64Array(HIST);
  let hI = 0, hN = 0, pRef = 0, tAvance = -99;
  let FR = null, zoneFr = -1, minuterie = 0, tTravail = 0, iFile = 0, tSusp = 0, FILE = null;
  let NJ = [.232, .31], S1 = [.192, .222], MO = [.30, .368], PO = [.728, .752], CR = [.455, .508, .646];
  const memo = {}; Object.keys(EV).forEach(n => { memo[n] = { t: -99, p: -9, arme: true }; });
  const stats = { jouees: 0, refusees: 0, ignorees: 0, silencieux: 0, vent: 0, incidents: 0, journal: options.journal ? [] : null };

  const horloge = () => (horsLigne ? ctx.currentTime : performance.now() / 1000);
  const noter = (nom, quoi) => { if (stats.journal) stats.journal.push({ t: ctx ? +(ctx.currentTime).toFixed(3) : -1, p: +pCour.toFixed(4), nom, quoi }); };
  const ecarter = (nom, pourquoi) => { stats.ignorees++; noter(nom, 'écarté : ' + pourquoi); };

  /* ---------- les tampons : fabriqués une fois, à l'activation ou à la demande ---------- */
  function fabriquer(cle) {
    const r = alea(hacher(cle)), parts = cle.split(':'), type = parts[0], a = parts[1];
    if (type === 'pas') return { x: pas(a, sr, r), sr };
    if (type === 'oiseau') return { x: oiseau(+a, sr, r), sr };
    if (type === 'tex') {
      if (a === 'bruit') return { x: bruitGrain(sr, r), sr };
      const srt = SR_TEX[a] || 24000, x = TEXTURES[a](srt, r), k = .25 / (rmsDe(x) || 1), c = crete(x) * k, kk = c > .98 ? k * .98 / c : k;
      for (let i = 0; i < x.length; i++) x[i] *= kk;
      return { x, sr: srt };
    }
    const f = TIMBRES[type];
    return f ? { x: f(sr, r), sr } : null;
  }
  function tampon(cle, seulementSiPret) {
    let b = cache.get(cle);
    if (b || seulementSiPret) return b || null;
    const f = fabriquer(cle);
    if (!f || !f.x || !f.x.length) return null;
    if (!cle.startsWith('tex:')) f.x = rogner(f.x, f.sr);
    b = ctx.createBuffer(1, f.x.length, f.sr);
    b.getChannelData(0).set(f.x);
    cache.set(cle, b);
    return b;
  }
  /* les deux enregistrements de Thibaut : lus après l'activation seulement ; en cas d'échec, la synthèse prend le relais */
  function decoder(b) { return new Promise((ok, ko) => { try { const r = ctx.decodeAudioData(b, ok, ko); if (r && r.then) r.then(ok, ko); } catch (e) { ko(e); } }); }
  function versTampon(x, srx) { const b = ctx.createBuffer(1, x.length, srx); b.getChannelData(0).set(x); return b; }
  function chargerEnregistrements() {
    if (enr.promesse) return enr.promesse;
    const base = options.dossierSons || DOSSIER_SONS;
    const lire = nom => fetch(new URL(nom + '.m4a', base).href).then(r => { if (!r.ok) throw new Error(nom + ' ' + r.status); return r.arrayBuffer(); }).then(decoder);
    enr.etat = 'charge'; enr.depuis = horloge();
    enr.promesse = Promise.all([lire('cigales'), lire('dechirure')]).then(([c, d]) => {
      /* les cigales : le silence d'encodage AAC retiré au début et à la fin, puis une boucle fondue de 0,35 s */
      let x = Float32Array.from(c.getChannelData(0)), s0 = crete(x) * .003, a = 0, z = x.length;
      while (a < z && Math.abs(x[a]) < s0) a++; while (z > a && Math.abs(x[z - 1]) < s0) z--;
      a += Math.round(.025 * c.sampleRate); z -= Math.round(.025 * c.sampleRate);
      const W0 = Math.round(.35 * c.sampleRate), y = x.subarray(a, z), boucle = boucler(y, y.length - W0, W0), k = .25 / (rmsDe(boucle) || 1);
      for (let i = 0; i < boucle.length; i++) boucle[i] *= k;
      cache.set('enr:cigales', versTampon(boucle, c.sampleRate));
      /* la déchirure : calée au moment où le papier cède (le silence d'encodage retiré), crête à 1 */
      x = Float32Array.from(d.getChannelData(0)); s0 = crete(x) * .003; a = 0; z = x.length;
      while (a < z && Math.abs(x[a]) < s0) a++; while (z > a && Math.abs(x[z - 1]) < s0) z--;
      cache.set('enr:dechirure', versTampon(normaliser(x.slice(a, z)), d.sampleRate));
      enr.etat = 'pret';
      if (voulu && actif) relancerCigales();
    }).catch(() => {
      /* coupé pendant le chargement (contexte fermé) : on recommencera à la prochaine activation ; sinon, la synthèse prend le relais */
      if (!voulu) { enr.etat = 'rien'; enr.promesse = null; return; }
      enr.etat = 'echec'; if (actif) relancerCigales();
    });
    return enr.promesse;
  }
  function tamponCigales() {
    /* l'enregistrement s'il est là ; s'il tarde plus de 3 s, la synthèse en attendant (fondu croisé à son arrivée) */
    if (REGLAGES.matiere === 'enregistree' && enr.etat !== 'echec' && (enr.etat === 'pret' || horloge() - enr.depuis < 3)) return enr.etat === 'pret' ? { b: cache.get('enr:cigales'), m: 'enregistree' } : null;
    const b = tampon('tex:cigales', !horsLigne); return b ? { b, m: 'synthese' } : null;
  }
  /* l'ordre de fabrication : les ambiances d'abord, puis les sons dans l'ordre du film */
  function fileDeFabrication() {
    const F = ['tex:bruit', 'tex:cigales', 'tex:air', 'tex:feuilles', 'oiseau:0', 'oiseau:1', 'oiseau:2', 'oiseau:3'];
    if (REGLAGES.fontaine) F.push('tex:fontaine');
    if (REGLAGES.pasJoues) for (const s in VARIANTES_PAS) for (let k = 0; k < VARIANTES_PAS[s]; k++) F.push('pas:' + s + ':' + k);
    F.push('dechirure');
    if (REGLAGES.page) F.push('page', 'tex:papier', 'page-retombe');
    return F;
  }
  function travail() {
    tTravail = 0;
    if (!voulu || !ctx) return;
    const F = FILE || (FILE = fileDeFabrication()), t0 = performance.now();
    while (iFile < F.length && performance.now() - t0 < 8) tampon(F[iFile++]);
    if (iFile < F.length) tTravail = setTimeout(travail, 12);
    else if (voulu && actif) ambiance(pCour, ctx.currentTime, false);
  }

  /* ---------- le graphe ---------- */
  function construire() {
    sr = ctx.sampleRate;
    melange = ctx.createGain(); melange.gain.value = db(REGLAGES.general + GAIN_SORTIE);
    /* limiteur : seuil -3 dB, rapport 20, attaque 2 ms ; il n'effleure que la crête de la déchirure et retient un empilement */
    limiteur = ctx.createDynamicsCompressor();
    limiteur.threshold.value = -3; limiteur.knee.value = 0; limiteur.ratio.value = 20; limiteur.attack.value = .002; limiteur.release.value = .12;
    /* filet final : linéaire jusqu'à 0,9, puis arrondi ; la sortie ne dépasse jamais 0,98 */
    ecreteur = ctx.createWaveShaper();
    const N = 2049, c = new Float32Array(N);
    for (let i = 0; i < N; i++) { const x = i / (N - 1) * 2 - 1, a = Math.abs(x); c[i] = Math.sign(x) * (a <= .9 ? a : .9 + .1 * Math.tanh((a - .9) / .1)); }
    ecreteur.curve = c;
    maitre = ctx.createGain(); maitre.gain.value = 0;
    for (const n of COUCHES) { G[n] = ctx.createGain(); G[n].connect(melange); muet[n] = !!(options.muet && options.muet[n]); G[n].gain.value = muet[n] ? 0 : db(REGLAGES[n] || 0); }
    melange.connect(limiteur); limiteur.connect(ecreteur); ecreteur.connect(maitre); maitre.connect(options.sortie || ctx.destination);
    PAS = partitionPas(); OISEAUX = partitionOiseaux(); ZONES = partitionZones();
    NJ = bo('nuitJour', NJ); S1 = bo('sortie1', S1); MO = bo('monde', MO); PO = bo('porte', PO);
    const ap = bo('approche', [.455, .508]); CR = [ap[0], ap[1], bo('dechire', .646)];
    construit = true;
  }
  function majCouche(n, tau) {
    if (!G[n]) return;
    let g = muet[n] ? 0 : db(REGLAGES[n] || 0);
    if (n === 'ambiance' && auRepos) g *= db(REGLAGES.repos);
    if (canard && (n === 'pas' || n === 'gestes')) g *= db(-20);
    G[n].gain.setTargetAtTime(g, ctx.currentTime, tau);
  }
  function majCouches(tau) { for (const n of COUCHES) majCouche(n, tau); }

  /* ---------- une voix courte : source, gain, panoramique ; libérée à la fin ---------- */
  function voix(buf, couche, gain, pan, rate, quand) {
    if (!buf || !G[couche]) return null;
    if (voixActives >= MAX_VOIX) { stats.refusees++; return null; }
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = buf; if (rate !== 1) s.playbackRate.value = rate;
    let pn = null;
    if (ctx.createStereoPanner) { pn = ctx.createStereoPanner(); pn.pan.value = clamp(pan || 0, -1, 1); g.gain.value = gain; s.connect(g); g.connect(pn); pn.connect(G[couche]); }
    else { g.gain.value = gain * Math.SQRT1_2; s.connect(g); g.connect(G[couche]); }
    voixActives++; stats.jouees++; sourcesCourtes.add(s);
    s.onended = () => { if (sourcesCourtes.delete(s)) voixActives--; try { s.disconnect(); g.disconnect(); if (pn) pn.disconnect(); } catch (e) { /* déjà débranchée */ } };
    s.start(Math.max(quand, ctx.currentTime));
    return s;
  }
  function jouerOiseau(type, quand, gain, pan) { noter('oiseau:' + type, 'ambiance'); return voix(tampon('oiseau:' + type), 'ambiance', gain, pan, 1 + (rnd() - .5) * .04, quand); }

  /* ---------- les ambiances : tous les fondus suivent p ---------- */
  let croisement = 0;
  function poids(p) {
    const nj = NJ, s1 = S1, mo = MO, po = PO;
    const dehors = 1 - sseg(p, po[0] + .004, po[1]);
    croisement = sseg(p, CR[0], CR[1]) * (1 - sseg(p, CR[2], CR[2] + .03));
    W[0] = 1 - sseg(p, nj[0] - .012, nj[0] + .042);                                       // cigales : elles meurent avec l'aube
    W[1] = REGLAGES.fontaine ? 1 - sseg(p, s1[1], mo[0]) : 0;                               // fontaine (coupée par défaut) : nette sur la place, elle s'efface au départ
    W[2] = (.55 * sseg(p, s1[0] + .01, s1[1] + .04) + .45 * sseg(p, nj[1] - .035, nj[1] + .02)) * (.75 + .25 * dehors) * (1 + .45 * croisement);   // air, vent
    W[3] = sseg(p, mo[0], mo[1]) * dehors * (1 + .25 * croisement);                          // feuillage, avec le chemin
    return dehors;
  }
  function demarrerAmb(e, tA) {
    let buf = null;
    if (e.def.nom === 'cigales') { const c = tamponCigales(); if (c) { buf = c.b; e.matiere = c.m; } }
    else buf = tampon('tex:' + e.def.nom, !horsLigne);
    if (!buf) return false;
    const g = ctx.createGain(); g.gain.value = 0; g.connect(G.ambiance);
    const n = { g, src: [], aux: [], f: null, d: null, b: null, vg: [] };
    let entree = g;
    if (e.def.bouffee) { n.b = ctx.createGain(); n.b.connect(g); entree = n.b; }
    if (e.def.stereo) {
      const m = ctx.createChannelMerger(2); n.aux.push(m);
      if (e.def.filtre) { n.f = ctx.createBiquadFilter(); n.f.type = 'lowpass'; n.f.Q.value = .5; n.f.frequency.value = e.fc || 5200; n.f.connect(entree); entree = n.f; }
      m.connect(entree);
      e.def.stereo.forEach(([rate, off], k) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate; s.connect(m, 0, k); s.start(tA, off * buf.duration); n.src.push(s); });
    } else {
      if (e.def.dist) { n.d = ctx.createBiquadFilter(); n.d.type = 'lowpass'; n.d.Q.value = .5; n.d.frequency.value = e.fd || 6000; n.d.connect(entree); entree = n.d; }
      e.def.voix.forEach(([rate, pan, off]) => {
        const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate;
        let sortie = s;
        if (e.def.bouffees) { const vg = ctx.createGain(); vg.gain.value = .8; s.connect(vg); sortie = vg; n.vg.push(vg); n.aux.push(vg); }
        if (ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = pan; sortie.connect(pn); pn.connect(entree); n.aux.push(pn); } else sortie.connect(entree);
        s.start(tA, off * buf.duration); n.src.push(s);
      });
    }
    e.n = n; e.cible = 0;
    return true;
  }
  function arreterAmb(e, doux) {
    if (!e.n) return;
    const n = e.n; e.n = null; e.cible = 0;
    const debrancher = () => { try { n.src.forEach(s => s.disconnect()); n.aux.forEach(a => a.disconnect()); [n.f, n.d, n.b].forEach(x => { if (x) x.disconnect(); }); n.g.disconnect(); } catch (err) { /* rien */ } };
    try {
      if (doux) { const tA = ctx.currentTime; n.g.gain.cancelScheduledValues(tA); n.g.gain.setTargetAtTime(0, tA, .15); n.src.forEach(s => s.stop(tA + .9)); n.src[0].onended = debrancher; }
      else { n.src.forEach(s => s.stop()); debrancher(); }
    } catch (err) { /* rien */ }
  }
  /* les cigales changent de matière (enregistrement arrivé, échec, ou réglage du banc) : fondu, puis la nouvelle */
  function relancerCigales() {
    if (!voulu || !actif || !ctx) return;
    const e = ETAT[0];
    if (e.n && e.matiere !== (tamponCigales() || {}).m) arreterAmb(e, true);
    ambiance(pCour, ctx.currentTime, false);
  }
  function ambiance(p, tA, rapide) {
    const dehors = poids(p), tau = rapide ? .08 : .35, tH = horloge();
    for (let i = 0; i < ETAT.length; i++) {
      const e = ETAT[i], cible = W[i] * db(e.def.niv);
      if (cible > 1e-5 && !e.n && !demarrerAmb(e, tA)) continue;
      if (!e.n) continue;
      if (cible <= 1e-5 && e.cible > 1e-5) e.tZero = tH;
      if (Math.abs(cible - e.cible) > e.cible * .01 + 1e-6) { e.n.g.gain.setTargetAtTime(cible, tA, cible <= 1e-5 ? Math.min(tau, .2) : tau); e.cible = cible; }
      /* l'air dehors, l'air de l'atelier : le même souffle, filtré à 360 Hz une fois la porte passée */
      if (e.n.f) { const fc = 360 + 4840 * dehors * dehors; if (Math.abs(fc - e.fc) > e.fc * .02) { e.n.f.frequency.setTargetAtTime(fc, tA, .15); e.fc = fc; } }
      /* le filtre du lieu : les cigales s'adoucissent avec l'aube (7 kHz la nuit, 3 kHz quand elles meurent), la fontaine
         s'assourdit en s'éloignant (6 kHz sur la place, 1,1 kHz au loin) */
      if (e.n.d) { const fd = e.def.dist(W[i]); if (Math.abs(fd - e.fd) > e.fd * .03) { e.n.d.frequency.setTargetAtTime(fd, tA, tau); e.fd = fd; } }
    }
  }
  /* une bouffée de vent : l'air enfle avec la feuille du CV (jusqu'à +7 dB), le feuillage un peu moins, puis tout retombe */
  function vent(d, tA, tH) {
    if (canard || tH - tVent < .2) { stats.ignorees++; return; }
    const f = clamp(d && Number.isFinite(d.force) ? d.force : .6);
    tVent = tH; stats.vent++; noter('vent', tH - tMouv > .5 ? 'ambiance, p arrêté : bouffée douce' : 'ambiance');
    for (let k = 2; k <= 3; k++) {
      const e = ETAT[k]; if (!e.n || !e.n.b) continue;
      const b = e.n.b.gain;
      const haut = tH - tMouv > .5 ? Math.min(1 + e.def.bouffee * f, db(REGLAGES.ventAuRepos)) : 1 + e.def.bouffee * f;
      b.cancelScheduledValues(tA); b.setTargetAtTime(haut, tA, .28); b.setTargetAtTime(1, tA + .45 + .6 * f, .9);
    }
  }

  /* ---------- les pas : une cadence régulière, posée sur p ---------- */
  function avancerPas(p0, p1, tA, tH) {
    let i = iPas;
    while (i > 0 && PAS[i - 1].p > p0) i--;
    while (i < PAS.length && PAS[i].p <= p0) i++;
    /* le dernier pas franchi joue s'il est armé ; tous les pas franchis se désarment jusqu'à ce que p repasse dessous */
    let j = -1, arme = false;
    for (; i < PAS.length && PAS[i].p <= p1; i++) { j = i; arme = PAS[i].re !== false; PAS[i].re = false; }
    iPas = i;
    if (j < 0 || !arme || rel > 4.5 || canard || tH - tPas < .22) return;
    const s = PAS[j];
    const nb = VARIANTES_PAS[s.sol] || 1, idx = (kPas + 1 + Math.floor(rnd() * Math.max(1, nb - 1))) % nb; kPas = idx;
    const g = db(NIV_PAS[s.sol] || -20) * s.force * (.8 + .2 * Math.min(rel, 1.3) / 1.3) * db((rnd() - .5) * 2);
    voix(tampon('pas:' + s.sol + ':' + idx), 'pas', g, s.cote * .12, 1 + (rnd() - .5) * .06, tA);
    if (s.feuille) voix(tampon('pas:feuille:' + (j % 3)), 'pas', db(NIV_PAS.feuille) * (.8 + .4 * rnd()), .38, 1 + (rnd() - .5) * .1, tA + .04 + .02 * rnd());
    noter('pas:' + s.sol, 'pas');
    tPas = tH;
  }

  /* ---------- les oiseaux, au passage ---------- */
  function oiseauxAuPassage(p0, p1, tA, tH) {
    for (let k = 0; k < OISEAUX.length; k++) {
      const o = OISEAUX[k];
      if (p0 < o.p && o.p <= p1 && o.re) {
        o.re = false; o.t = tH;
        if (rel > 3.2 || canard || tH - tGeste < 1) continue;
        jouerOiseau(o.cle, tA + .05, db(NIV_OISEAU - 1.5 * (k % 3)), o.pan);
      }
    }
  }
  /* le réarmement : seulement quand p est franchement repassé sous la place (hystérésis) */
  function rearmer(p) {
    for (let k = 0; k < OISEAUX.length; k++) if (p < OISEAUX[k].p - HYSTERESIS) OISEAUX[k].re = true;
    for (let k = 0; k < PAS.length; k++) if (p < PAS[k].p - HYSTERESIS) PAS[k].re = true;
    for (const n in memo) if (!memo[n].arme && p < memo[n].p - HYSTERESIS) memo[n].arme = true;
  }
  /* le déplacement de p sur les 0,4 dernières secondes (sans allocation) */
  function deplacement(tH, p) {
    histT[hI] = tH; histP[hI] = p; hI = (hI + 1) % HIST; if (hN < HIST) hN++;
    const fenetre = clamp(.0026 / vitesseFilm(p), FENETRE_MIN, FENETRE_MAX);
    let ref = p;
    for (let k = 2; k <= hN; k++) { const j = (hI - k + HIST) % HIST; if (tH - histT[j] > fenetre) break; ref = histP[j]; }
    return p - ref;
  }

  /* ---------- le grattement du crayon (et le papier de la page, s'il est mis) : une chaîne, réglée par zone ---------- */
  function zoneA(p) { for (let i = ZONES.length - 1; i >= 0; i--) { const z = ZONES[i]; if (p >= z.de && p <= z.a && (!z.page || REGLAGES.page)) return i; } return -1; }
  function lireMasque(M, u0, u1) {
    const n = M.length - 1; let a = u0 * n, b = u1 * n;
    if (a > b) { const t = a; a = b; b = t; }
    if (b - a < 1) { const x = (a + b) / 2, i = Math.floor(x), k = x - i; return M[i] * (1 - k) + M[Math.min(n, i + 1)] * k; }
    let s = 0, c = 0; const pasM = Math.max(1, Math.floor((b - a) / 24));
    for (let i = Math.floor(a); i <= Math.ceil(b) && i <= n; i += pasM) { s += M[i]; c++; }
    return c ? s / c : 0;
  }
  function facteurVitesse(r) {
    if (r < .03) return 0;
    return (r <= 1 ? .25 + .75 * Math.pow(r, .8) : 1 + .35 * Math.min(1, (r - 1) / 1.5)) * (1 - sseg(r, 4, 7));
  }
  function ouvrirFr(tex, tA) {
    const buf = tampon('tex:' + tex, !horsLigne && tex === 'bruit');
    if (!buf) return null;
    const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = buf; s.loop = true; hp.type = 'highpass'; lp.type = 'lowpass'; hp.Q.value = lp.Q.value = .7; g.gain.value = 0;
    let pn = null;
    s.connect(hp); hp.connect(lp);
    if (ctx.createStereoPanner) { pn = ctx.createStereoPanner(); lp.connect(pn); pn.connect(g); } else lp.connect(g);
    g.connect(G.crayon);
    s.start(tA, rnd() * buf.duration);
    return { tex, s, hp, lp, pn, g, niveau: 0, fc: 0, pan: 0, tZone: horloge() };
  }
  function fermerFr() {
    if (!FR) return;
    const f = FR, tA = ctx.currentTime; FR = null; zoneFr = -1;
    /* fondu de quelques millisecondes avant l'arrêt : jamais de clic, même sur un saut d'une zone à l'autre */
    try {
      f.g.gain.cancelScheduledValues(tA); f.g.gain.setTargetAtTime(0, tA, .008);
      f.s.onended = () => { try { f.s.disconnect(); f.hp.disconnect(); f.lp.disconnect(); if (f.pn) f.pn.disconnect(); f.g.disconnect(); } catch (e) { /* rien */ } };
      f.s.stop(tA + .06);
    } catch (e) { /* rien */ }
  }
  function frottement(p, p0, tA, tH, dp, saut) {
    const z = reduit ? -1 : zoneA(p);
    if (z < 0) { if (FR && FR.niveau > 0) { FR.g.gain.cancelScheduledValues(tA); FR.g.gain.setTargetAtTime(0, tA, .03); FR.niveau = 0; } return; }
    const Z = ZONES[z];
    if (!FR || FR.tex !== Z.tex) { fermerFr(); FR = ouvrirFr(Z.tex, tA); if (!FR) return; }
    if (zoneFr !== z) { zoneFr = z; FR.hp.frequency.setValueAtTime(Z.hp, tA); FR.lp.frequency.setValueAtTime(Z.lp, tA); FR.fc = Z.lp; }
    FR.tZone = tH;
    let cible = 0;
    if (dp > 0 && !saut) {
      const u1 = seg(p, Z.de, Z.a);
      cible = lireMasque(Z.masque, seg(p0, Z.de, Z.a), u1) * db(Z.niv) * facteurVitesse(rel);
      if (Z.tex === 'papier') cible *= .75 + .25 * rnd();
      const fc = Z.lp * (.86 + .14 * Math.min(rel, 1.6) / 1.6);
      if (Math.abs(fc - FR.fc) > FR.fc * .04) { FR.lp.frequency.setTargetAtTime(fc, tA, .03); FR.fc = fc; }
      if (FR.pn) { const pan = Z.pan(u1); if (Math.abs(pan - FR.pan) > .02) { FR.pn.pan.setTargetAtTime(pan, tA, .05); FR.pan = pan; } }
    }
    if (cible === 0 && FR.niveau === 0) return;
    const g = FR.g.gain;
    g.cancelScheduledValues(tA);
    g.setTargetAtTime(cible, tA, cible > FR.niveau ? .01 : .02);
    /* garde : si plus aucune image n'arrive, le grattement s'éteint seul en 0,1 s */
    if (cible > 0) g.setTargetAtTime(0, tA + .1, .035);
    FR.niveau = cible;
  }

  /* ---------- à chaque image ---------- */
  function avancer(p, v) {
    const tH = horloge(), tA = ctx.currentTime, dt = tH - tPrec, dp = p - pCour;
    const vit = (typeof v === 'number' && Number.isFinite(v)) ? v : (dt > 1e-3 ? dp / dt : 0);
    vLisse += (vit - vLisse) * (dt > 0 ? clamp(1 - Math.exp(-dt / .08)) : 1);
    rel = Math.abs(vLisse) / vitesseFilm(p);
    const saut = Math.abs(dp) > .04, d = deplacement(tH, p);
    /* un mouvement, au sens du son : un vrai déplacement, pas le bruit du lissage */
    const avance = !saut && d > SEUIL_MOUVEMENT && Math.abs(vLisse) >= .002, recule = d < -SEUIL_MOUVEMENT;
    if (avance) { sens = 1; tSens = tH; tAvance = tH; } else if (recule) { sens = -1; tSens = tH; }
    if (avance || recule || saut) { tMouv = tH; if (auRepos) { auRepos = false; majCouche('ambiance', .15); } }
    if (saut || rel > 6) { if (!canard) { canard = true; majCouches(.03); } tCanard = tH; }
    ambiance(p, tA, saut);
    /* les déclencheurs (oiseaux, pas) sont évalués d'un point de référence à l'autre, seulement quand p avance vraiment */
    if (saut) { if (dp < 0) rearmer(p); pRef = p; }
    else if (avance && p > pRef) { oiseauxAuPassage(pRef, p, tA, tH); if (!reduit && REGLAGES.pasJoues) avancerPas(pRef, p, tA, tH); pRef = p; }
    else if (recule && p < pRef) { rearmer(p); pRef = p; }
    frottement(p, pCour, tA, tH, avance ? dp : 0, saut);
    pCour = p; tPrec = tH;
    if (tH - tEntretien > .1) entretien();
  }

  /* ---------- l'entretien : quatre ou cinq fois par seconde, même quand le film ne rend plus d'image ---------- */
  function entretien() {
    if (!pret || !actif || !ctx || !voulu) return;
    if (!horsLigne && ctx.state !== 'running') return;
    const tH = horloge(), tA = ctx.currentTime;
    tEntretien = tH;
    if (tH - tPrec > .15) { vLisse = 0; rel = 0; }
    if (!auRepos && tH - tMouv > 2.5) { auRepos = true; majCouche('ambiance', 1.2); }
    if (canard && tH - tCanard > .35 && rel < 3) { canard = false; majCouches(.12); }
    ambiance(pCour, tA, false);
    for (let k = 0; k < ETAT.length; k++) { const e = ETAT[k]; if (e.n && e.cible <= 1e-5 && tH - e.tZero > 1.2) arreterAmb(e); }
    if (FR && tH - FR.tZone > 1.5) fermerFr();
    /* les deux couches de cigales respirent un peu, au hasard (2,5 dB au plus), chacune à son rythme (0,7 à 2 s) */
    const ec = ETAT[0];
    if (ec.n && ec.n.vg.length) for (let k = 0; k < ec.n.vg.length; k++) if (tH >= ec.prochain[k]) {
      ec.n.vg[k].gain.setTargetAtTime(.75 + .25 * rnd(), tA, .4); ec.prochain[k] = tH + .7 + 1.3 * rnd();
    }
  }

  /* ---------- un geste ponctuel ---------- */
  function evenement(nom, d) {
    if (!pret || !actif || !ctx) return;
    try {
      const tH = horloge(), tA = ctx.currentTime;
      if (nom === 'vent') return vent(d, tA, tH);
      const def = EV[nom];
      /* les gestes supprimés le 03/10/2026 restent acceptés : ils ne jouent rien */
      if (!def || (def.page && !REGLAGES.page)) { stats.silencieux++; return; }
      const m = memo[nom];
      /* p arrêté (ou seulement le bruit du lissage), en remontant, défilement très rapide : rien */
      if (tH - tAvance > .3) return ecarter(nom, 'p ne bouge pas');
      if ((sens < 0 && tH - tSens < .3) || canard || rel > 5) return ecarter(nom, 'vitesse ou sens');
      /* hystérésis : il ne rejoue qu'après que p est franchement repassé sous sa place */
      if (!m.arme) return ecarter(nom, 'hystérésis');
      if (tH - m.t < ECART_GESTE) return ecarter(nom, 'cadence');
      if (tH - r0 < .08 && tH - r1 < .08) return ecarter(nom, 'rafale');
      r1 = r0; r0 = tH; m.t = tH; m.p = pCour; m.arme = false;
      jouerEvenement(nom, d, tA);
    } catch (e) { /* jamais d'erreur dans la boucle du film */ }
  }
  function jouerEvenement(nom, d, tA) {
    const def = EV[nom];
    noter(nom, 'geste'); tGeste = horloge();
    const force = d && Number.isFinite(d.force) ? clamp(d.force, 0, 1.6) : 1;
    const pd = d ? (Number.isFinite(d.panoramique) ? d.panoramique : d.pan) : undefined;   /* « pan » accepté comme synonyme */
    const pan = Number.isFinite(pd) ? clamp(pd, -1, 1) * .7 : def.pan;
    if (nom === 'dechirure' && REGLAGES.matiere === 'enregistree' && enr.etat === 'pret') {
      voix(cache.get('enr:dechirure'), 'gestes', db(NIV_DECHIRURE_ENR) * force, pan, rnd() < .5 ? .955 : 1.045, tA);
      return;
    }
    voix(tampon(nom), 'gestes', db(def.niv) * force, pan, 1, tA);
  }

  /* ---------- activer, couper ---------- */
  function lireReduit() { try { return !!(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }
  function ecouterPage() {
    if (ecoute || typeof document === 'undefined') return;
    ecoute = true;
    const reprendre = () => { if (ctx && voulu && actif && !document.hidden && ctx.state === 'suspended') ctx.resume().catch(() => {}); };
    document.addEventListener('visibilitychange', () => { if (!ctx || ctx.state === 'closed') return; if (document.hidden) ctx.suspend().catch(() => {}); else reprendre(); });
    addEventListener('pagehide', () => { if (ctx && ctx.state !== 'closed') ctx.suspend().catch(() => {}); });
    addEventListener('pageshow', reprendre);
    try { const mq = matchMedia('(prefers-reduced-motion: reduce)'); const f = () => { reduit = mq.matches; }; if (mq.addEventListener) mq.addEventListener('change', f); } catch (e) { /* rien */ }
  }
  /* le chien de garde, pendant toute la vie de la page (après la première activation) : si le son est coupé et qu'un
     contexte joue encore, il le suspend, remet le gain maître à zéro et le consigne au journal */
  function demarrerChien() {
    if (chien || horsLigne) return;
    chien = setInterval(() => {
      if (voulu || performance.now() - tCoupe < 400) return;
      for (const c of [ctx, ancienCtx]) {
        if (!c || c.state !== 'running') continue;
        stats.incidents++; noter('chien de garde', 'contexte en marche alors que le son est coupé : gain à zéro, contexte suspendu');
        try { if (c === ctx && maitre) { maitre.gain.cancelScheduledValues(c.currentTime); maitre.gain.setValueAtTime(0, c.currentTime); } } catch (e) { /* rien */ }
        c.suspend().catch(() => {});
      }
    }, 500);
  }
  /* tout ce qui sonne s'arrête et se débranche : ambiances, crayon, sons courts */
  function toutArreter(quand) {
    for (let k = 0; k < ETAT.length; k++) {
      const e = ETAT[k], n = e.n; if (!n) continue;
      e.n = null; e.cible = 0; e.fc = 0; e.fd = 0;
      try { n.src.forEach(x => x.stop(quand)); } catch (err) { /* rien */ }
      if (!horsLigne) try { n.src.forEach(x => x.disconnect()); n.aux.forEach(a => a.disconnect()); [n.f, n.d, n.b].forEach(x => { if (x) x.disconnect(); }); n.g.disconnect(); } catch (err) { /* rien */ }
    }
    if (FR) { const f = FR; FR = null; zoneFr = -1; try { f.s.stop(quand); if (!horsLigne) { f.s.disconnect(); f.hp.disconnect(); f.lp.disconnect(); if (f.pn) f.pn.disconnect(); f.g.disconnect(); } } catch (err) { /* rien */ } }
    sourcesCourtes.forEach(x => { try { x.stop(quand); if (!horsLigne) x.disconnect(); } catch (err) { /* rien */ } });
    sourcesCourtes.clear(); voixActives = 0;
  }
  /* la coupure va jusqu'au bout : suspendre, puis fermer le contexte (sauf si le visiteur a remis le son entre-temps) */
  async function fermer(c) {
    tFermeture = 0;
    if (voulu || c !== ctx) return;
    toutArreter();
    try { await c.suspend(); } catch (e) { /* rien */ }
    if (voulu || c !== ctx) return;
    ctx = null; ancienCtx = c; construit = false; pret = false;
    maitre = limiteur = ecreteur = melange = analyseurs = null;
    for (const n of COUCHES) G[n] = null;
    try { await c.close(); } catch (e) { /* rien */ }
    noter('couper', 'contexte fermé');
  }
  async function activer() {
    if (!api.disponible) return false;
    voulu = true;
    if (tFermeture) { clearTimeout(tFermeture); tFermeture = 0; }
    try {
      if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; ctx = new AC({ latencyHint: 'interactive' }); construit = false; }
      const c = ctx;
      /* la reprise part dans le geste du visiteur, avant tout calcul */
      const reprise = !horsLigne && c.state !== 'running' ? c.resume() : null, g = ++generation;
      if (!construit) {
        construire();
        if (!horsLigne) { const b = c.createBuffer(1, 1, c.sampleRate), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(); }
      }
      if (!horsLigne) { ecouterPage(); demarrerChien(); }
      if (horsLigne) {
        const F = fileDeFabrication(); F.forEach(k => tampon(k)); iFile = F.length;
        if (REGLAGES.matiere === 'enregistree') await chargerEnregistrements();
        if (!voulu || g !== generation || c !== ctx) return false;
      } else { tampon('tex:bruit'); FILE = fileDeFabrication(); iFile = 0; if (!tTravail) tTravail = setTimeout(travail, 0); chargerEnregistrements(); }
      /* l'attente de la reprise prend fin aussi quand le visiteur coupe : activer() rend alors la main tout de suite (sinon,
         sur un contexte fermé, la reprise resterait en suspens pour toujours et le bouton du film avec elle) */
      if (reprise) { const coupure = new Promise(r => { liberer = r; }); reprise.catch(() => {}); await Promise.race([reprise, coupure]); liberer = null; }
      /* coupé pendant l'attente (ou une autre activation est partie après) : tout reste coupé */
      if (!voulu || g !== generation || c !== ctx) {
        if (!voulu && c.state === 'running') { try { maitre.gain.setValueAtTime(0, c.currentTime); } catch (e) { /* rien */ } c.suspend().catch(() => {}); }
        return false;
      }
      reduit = lireReduit();
      const tH = horloge(), tA = c.currentTime;
      pCour = pMemo; tPrec = tH; tMouv = tH; vLisse = 0; rel = 0; auRepos = false; canard = false;
      iPas = 0; pRef = pCour; hN = 0; OISEAUX.forEach(x => { x.re = x.p > pCour; }); PAS.forEach(x => { x.re = x.p > pCour; });
      actif = true; pret = true;
      majCouches(.01);
      maitre.gain.cancelScheduledValues(tA); maitre.gain.setValueAtTime(maitre.gain.value, tA);
      if (options.sansFondu) maitre.gain.setValueAtTime(1, tA); else maitre.gain.linearRampToValueAtTime(1, tA + .6);
      ambiance(pCour, tA, true);
      if (!horsLigne && !minuterie) minuterie = setInterval(entretien, 200);
      noter('activer', 'son mis');
      return true;
    } catch (e) { actif = false; return false; }
  }
  /* couper : immédiat et définitif, même pendant une activation en attente */
  function couper() {
    voulu = false; generation++; actif = false; pret = false; tCoupe = performance.now();
    if (liberer) { const l = liberer; liberer = null; l(); }
    if (tTravail) { clearTimeout(tTravail); tTravail = 0; }
    if (minuterie) { clearInterval(minuterie); minuterie = 0; }
    if (tSusp) { clearTimeout(tSusp); tSusp = 0; }
    if (tFermeture) { clearTimeout(tFermeture); tFermeture = 0; }
    if (!ctx) return;
    noter('couper', 'son coupé');
    try {
      const tA = ctx.currentTime;
      /* le gain maître part à zéro sur-le-champ, en 120 ms pour l'oreille */
      if (maitre) { maitre.gain.cancelScheduledValues(tA); maitre.gain.setValueAtTime(maitre.gain.value, tA); maitre.gain.linearRampToValueAtTime(0, tA + .12); }
      if (horsLigne) toutArreter(tA + .13);
      else tFermeture = setTimeout(() => { fermer(ctx); }, 140);
    } catch (e) { /* rien */ }
  }
  function progression(p, v) {
    if (typeof p !== 'number' || !Number.isFinite(p)) return;
    p = clamp(p);
    pMemo = p;
    if (!pret || !actif) return;
    try { avancer(p, v); } catch (e) { /* jamais d'erreur dans la boucle du film */ }
  }

  /* ---------- outils du banc et des mesures ---------- */
  function instrumenter() {
    if (!construit || analyseurs) return analyseurs;
    analyseurs = {};
    for (const n of COUCHES.concat(['sortie'])) { const a = ctx.createAnalyser(); a.fftSize = 2048; (n === 'sortie' ? maitre : G[n]).connect(a); analyseurs[n] = { a, buf: new Float32Array(2048) }; }
    return analyseurs;
  }
  function niveaux() {
    const r = {};
    if (!analyseurs) return r;
    for (const n in analyseurs) {
      const { a, buf } = analyseurs[n]; a.getFloatTimeDomainData(buf);
      let s = 0, m = 0; for (let i = 0; i < buf.length; i++) { const x = buf[i]; s += x * x; if (Math.abs(x) > m) m = Math.abs(x); }
      r[n] = { rms: 20 * Math.log10(Math.sqrt(s / buf.length) + 1e-9), crete: 20 * Math.log10(m + 1e-9) };
    }
    return r;
  }
  /* jouer un son seul, sans les règles du film (banc) : « pas:terre:0 », « oiseau:2 », « vent », « dechirure », « page » */
  function essai(nom, d) {
    if (!pret || !ctx) return;
    const tA = ctx.currentTime, parts = nom.split(':');
    if (parts[0] === 'pas') voix(tampon('pas:' + parts[1] + ':' + (parts[2] || 0)), 'pas', db(NIV_PAS[parts[1]] || -20), 0, 1, tA);
    else if (parts[0] === 'oiseau') jouerOiseau(+parts[1] || 0, tA, db(NIV_OISEAU), 0);
    else if (nom === 'vent') { tVent = -99; vent(d || { force: .8 }, tA, horloge()); }
    else if (EV[nom]) jouerEvenement(nom, d || {}, tA);
  }

  const api = {
    get disponible() { return horsLigne || (typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext)); },
    get actif() { return actif; },
    activer, couper, progression, evenement,
    /* pour le banc et les mesures */
    entretien, instrumenter, niveaux, essai,
    regler(n, v) {
      if (n === 'page') { REGLAGES.page = !!v; if (construit && REGLAGES.page) { tampon('page'); tampon('page-retombe'); tampon('tex:papier'); } return; }
      if (n === 'fontaine') { REGLAGES.fontaine = !!v; if (construit && REGLAGES.fontaine) tampon('tex:fontaine'); if (pret) ambiance(pCour, ctx.currentTime, false); return; }
      if (n === 'pasJoues') { REGLAGES.pasJoues = !!v; return; }
      if (n === 'matiere') { REGLAGES.matiere = v === 'synthese' ? 'synthese' : 'enregistree'; if (pret) { if (REGLAGES.matiere === 'enregistree') chargerEnregistrements(); relancerCigales(); } return; }
      if (n in REGLAGES && Number.isFinite(v)) { REGLAGES[n] = v; if (!construit) return; if (n === 'general') melange.gain.setTargetAtTime(db(v + GAIN_SORTIE), ctx.currentTime, .05); else majCouches(.05); }
    },
    muet(n, oui) { muet[n] = !!oui; if (construit) majCouche(n, .02); },
    journaliser(oui) { stats.journal = oui ? [] : null; },
    enregistrements() { return enr.promesse || Promise.resolve(); },
    statistiques() { return { voulu, incidents: stats.incidents, contexte: ctx ? ctx.state : ancienCtx ? ancienCtx.state : 'aucun', matiere: { reglage: REGLAGES.matiere, enregistrements: enr.etat, cigales: ETAT[0].matiere }, jouees: stats.jouees, refusees: stats.refusees, ignorees: stats.ignorees, silencieux: stats.silencieux, vent: stats.vent, voixActives, ambiancesActives: ETAT.filter(e => e.n).map(e => e.def.nom), frottement: FR ? FR.tex : null, tampons: cache.size, journal: stats.journal }; },
    partition() { return { pas: PAS.map(s => ({ p: +s.p.toFixed(4), sol: s.sol, force: +s.force.toFixed(2), t: +tempsFilm(s.p).toFixed(2) })), oiseaux: OISEAUX.map(o => ({ p: o.p, cle: o.cle })), zones: ZONES.map(z => ({ cle: z.cle, de: z.de, a: z.a, tex: z.tex, page: !!z.page })) }; },
    get contexte() { return ctx; }
  };
  return api;
}

/* l'instance du film : rien n'est créé avant activer() */
export const son = creerSon();
