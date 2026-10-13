/* =====================================================================
   Passe 28 (13/10/2026) : le son dans le lecteur vidéo (proto3.js). Ce module sert au son seulement ; le lecteur le demande dès qu'il
   prend la main, pendant le chargement de l'ouverture, et au premier contact avec le bouton Son : son.js doit être là au clic, Safari
   n'accepte de lancer le son que dans le geste même (son.activer() le fait avant toute attente). Il ne crée rien à son chargement
   (son.js : rien avant activer()) ; rien ne sonne avant un clic sur le bouton.
   Il reprend du film en direct, sans le charger :
   - son.js tel quel (la bande-son : son.progression(p, v) à chaque image, son.evenement(nom, d) aux gestes) ;
   - les gestes ponctuels de film.js (sonner, lignes 195 à 229) : les mêmes tables, sur téléphone (F.mob vrai : les gestes de
     SANS_OBJET_MOB ne sonnent pas) ; la conversation suit p (sur téléphone, l'entrée est faite : intro vaut 1, c = p) ;
   - la bouffée de vent de p3-marche.js (bouffee) : sur téléphone, le film l'évalue tant que le poteau est là, de p 0,42582 à 0,496
     (fenêtre mesurée dans le film en direct à 393 x 852, 393 x 695 et 430 x 932, la même : tests de la passe 28, vent-fenetre*.py ;
     au-delà de 0,496, la feuille passe en plein écran et le film n'appelle plus la bouffée), force 1, au temps de la page comme
     le film (F.t, l'horloge de ses images).
   Les tables sont recopiées de film.js, pas importées (film.js tire tout le film, 0,9 Mo) : un test de la passe 28 vérifie
   qu'elles donnent les mêmes valeurs que film.js (son-tables.mjs) ; rafale(), trois lignes de papier.js (37 Ko que la page ne
   charge pas), de même contre papier.js.
   ===================================================================== */
import { son } from './son.js';
import { T } from './temps.js';
import { ECH } from './telephone.js';
import { clamp } from './outils.js';
export { son };

/* film.js, lignes 197 à 219 (les gestes du son, D14 de la quatrième passe) */
const s1 = (a, k) => a[0] + (a[1] - a[0]) * k;
export const CONV = T.conv.flatMap(c => [['envoi', c.envoi, { pan: -.6 }], ['reponse', c.rep[0], { pan: -.6 }], ['source', c.src, { pan: -.6 }]]);
export const GESTES = [
  ['appui', T.appui[0] + .002, { pan: -.6 }], ['prise', T.mainMonte[1], { pan: -.5 }],
  ['guide', T.consigne1 - .006, { pan: -.6 }], ['guide', T.consigne2 - .006, { pan: -.6 }], ['guide', T.arrive - .005, { pan: -.6 }],
  ['tension', T.tire[0] + .002, { pan: .3 }],
  ['porte', T.porte[1] - .004, {}], ['pose', T.poseTel[1], { pan: -.6 }], ['clou', s1(T.clou, .5), { pan: -.25 }],
  ['crayon-pris', T.saisie[0], { pan: .5 }], ['crayon-pose', T.lache[0], { pan: .5 }],
  ['prise', s1(T.telPrise, .6), { pan: -.6 }], ['declou', s1(T.declou, .3), { pan: -.3 }],
  ['page', T.tourne[0] + .001, { pan: .4 }], ['page-retombe', s1(T.retombe, .45), { pan: 0 }],
  ['crayon-pris', T.saisie8[0], { pan: .3 }], ['crayon-pose', T.lache8[0], { pan: .5 }], ['guide', T.telAllume[0] + .0002, { pan: -.6 }],
  ['bulle', T.bulle[0] + .001, { pan: .1 }],
  ['fin', .9995, {}]
];
export const SANS_OBJET_MOB = new Set([T.appui[0] + .002, T.mainMonte[1], T.consigne1 - .006, T.consigne2 - .006, T.arrive - .005, T.poseTel[1], s1(T.clou, .5), s1(T.telPrise, .6), s1(T.declou, .3)]);
export const tapes = p => { let n = 0; ECH.forEach((e, i) => { const t = T.conv[i]; if (!t) return; n += Math.round(e.q.length * clamp((p - t.tape[0]) / (t.tape[1] - t.tape[0]))); }); return n; };
/* papier.js (rafale), recopiée : la force d'une rafale à l'instant t (secondes) */
export function rafale(t, graine = 0) {
  const s = Math.sin, a = .5 + .5 * s(t * .53 + graine) * s(t * .31 + 1.7 + graine * 2), b = .5 + .5 * s(t * 1.13 + .4 + graine);
  return clamp(a * .75 + b * .25 * a, 0, 1);
}
export const VENT = [.42582, .496];

/* à chaque image du lecteur : p, le p de l'image montrée ; t, le temps de la page en secondes */
export function creerSonnerie() {
  let pPrec = null, ventHaut = false;
  return function sonner(p, t) {
    if (pPrec !== null && p > pPrec && p - pPrec <= .02) {
      const p0 = pPrec, p1 = p;
      for (const [nom, seuil, d] of GESTES) if (p0 < seuil && p1 >= seuil && !SANS_OBJET_MOB.has(seuil)) son.evenement(nom, d);
      for (const [nom, seuil, d] of CONV) if (p0 < seuil && p1 >= seuil) son.evenement(nom, d);
      const nf = tapes(p1) - tapes(p0); if (nf > 0) son.evenement('frappe', { force: Math.min(1, .6 + .1 * nf), pan: -.6, nombre: nf });
    }
    pPrec = p;
    /* p3-marche.js, bouffee : chaque bouffée qui soulève la feuille du CV s'entend (force : le sommet de la bouffée qui commence) */
    /* au-delà de la fenêtre, le film n'appelle plus la bouffée (son état reste) ; en deçà, le poteau trop loin la remet à zéro */
    if (p > VENT[1]) return;
    if (p < VENT[0]) { ventHaut = false; return; }
    const r = rafale(t);
    if (!ventHaut && r > .5) {
      ventHaut = true;
      let m = r; for (let k = 1; k <= 24; k++) m = Math.max(m, rafale(t + k * .1));
      son.evenement('vent', { force: clamp(m, 0, 1) });
    } else if (ventHaut && r < .34) ventHaut = false;
  };
}
