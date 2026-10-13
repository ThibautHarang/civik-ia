/* =====================================================================
   I2 (neuvième passe, 04/10/2026) : la lampe de l'atelier s'allume.
   Une ampoule à filament, suspendue au-dessus de la table, hors du cadre.
   Quand p passe 0,700 en avançant, elle s'allume en temps réel comme une
   vraie ampoule : le filament chauffe (la lumière monte, d'abord orangée,
   puis blanc chaud) en 0,3 s, dépasse à peine sa puissance (6 %) et se
   stabilise ; aucun clignotement. Un saut (chapitre, retour, image figée
   par ?p=) la trouve allumée. Revenir avant 0,700 l'éteint (0,16 s, le
   filament qui refroidit). Elle ne fait aucun bruit (son.js n'est pas
   touché).
   L'état est lu par le monde (la lueur derrière les vitres, les reflets,
   la nappe sur le seuil, la pièce vue par la porte), par l'atelier (la
   pièce et la planche éclairées) et par la girouette (qui se fige au même
   instant). Pour les essais : window.__lampeTemps fixe le temps écoulé
   depuis l'allumage (secondes).
   ===================================================================== */
import { clamp, lerp } from './outils.js';
import { T } from './temps.js';

const ss = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
const MONTEE = .3, TASSE = .26, EXTINCTION = .16, SUR = .06;
/* l'intensité, t secondes après l'allumage : montée douce, très légère sur-intensité, stabilisation */
export function intensite(t) {
  if (t <= 0) return 0;
  if (t < MONTEE) { const u = t / MONTEE; return (1 + SUR) * Math.pow(ss(u), 1.25); }
  return 1 + SUR * (1 - ss((t - MONTEE) / TASSE));
}
/* la couleur du filament selon son intensité : orangé quand il chauffe, blanc chaud allumé */
export function couleur(I) {
  const k = ss(I * 1.1);
  return [255, Math.round(lerp(118, 212, k)), Math.round(lerp(40, 150, k))];
}

export function creerLampe() {
  let pPrec = null, tAllume = null, tEteint = null, Iext = 0, I = 0, t = 0, fluide = false;
  const fige = () => document.documentElement.classList.contains('fige');
  function maj(p, temps) {
    t = temps;
    const on = p >= T.lampe, avant = pPrec;
    if (avant === null) { tAllume = on ? -1e9 : null; }
    else if (on && avant < T.lampe) { tAllume = !fige() && p - avant < .02 ? t : -1e9; tEteint = null; }
    else if (!on && avant >= T.lampe) { tEteint = !fige() && avant - p < .02 ? t : -1e9; Iext = I; tAllume = null; }
    pPrec = p;
    const essai = typeof window.__lampeTemps === 'number' ? window.__lampeTemps : null;
    if (on) {
      const tau = essai !== null ? essai : tAllume === null ? 1e9 : t - tAllume;
      I = intensite(tau); fluide = tau >= 0 && tau < MONTEE + TASSE + .05;
    } else {
      const tau = tEteint === null ? 1e9 : t - tEteint;
      I = tau >= EXTINCTION ? 0 : Iext * Math.pow(1 - tau / EXTINCTION, 2); fluide = tau < EXTINCTION + .05;
    }
  }
  /* le temps écoulé depuis l'allumage (pour la girouette), ou null si elle est éteinte */
  function depuis() {
    if (pPrec === null || pPrec < T.lampe) return null;
    if (typeof window.__lampeTemps === 'number') return window.__lampeTemps;
    return tAllume === null ? 1e9 : t - tAllume;
  }
  return { maj, depuis, get I() { return I; }, get couleur() { return couleur(I); }, get fluide() { return fluide; } };
}
