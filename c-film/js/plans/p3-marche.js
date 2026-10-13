/* =====================================================================
   Plan 3. La marche (p 0,30 à 0,45). Vue à la première personne, le monde
   gravé posé en profondeur. Le téléphone tenu dans la main gauche suit le
   pas avec un léger retard ; son écran vit : le point avance sur la carte,
   la distance décroît (chiffres à chasse fixe), deux consignes de Marianne.
   ===================================================================== */
import { clamp, seg, sseg, eEntree } from '../outils.js';
import { T, PLANS } from '../temps.js';
import { MINUTES } from './p2-depart.js';
import { poseTenue } from './communs.js';
import { rafale } from '../papier.js';
import { son } from '../son.js';

/* avancée sur le chemin (0 au départ, 1 au poteau), lue sur la caméra */
export function avancee(F) { const cam = F.monde.camera(), L = F.monde.L; return clamp((cam.dist + 3) / (L.S_STOP2 + 3)); }
export function consigne(p) {
  if (p < T.consigne1) return -1 + clamp((p - (T.consigne1 - .012)) / .012);
  if (p < T.consigne2) return 0 + clamp((p - (T.consigne2 - .012)) / .012);
  if (p < T.arrive) return 1 + clamp((p - (T.arrive - .01)) / .01);
  return 2;
}
/* le téléphone baissé pendant la tenue au croisement, relevé pour repartir */
/* H5 : en approchant de l'atelier, on lève les yeux vers la façade et on baisse un peu le téléphone : la plaque gravée
   sur le pilier de gauche reste dégagée pendant qu'on la lit ; il remonte avant d'entrer */
export const baisse = p => sseg(p, .488, .53) * (1 - sseg(p, .62, .66)) + .44 * sseg(p, .700, .716) * (1 - sseg(p, .734, .748));
export function telTenu(F, p, z = 30) {
  const { tel, mains } = F, { quad, ep } = poseTenue(F, 1, F.mob ? 0 : baisse(p));
  /* M2 (treizième passe) : sur téléphone, plus de téléphone ni de guide pendant la marche, au croisement et sur la route */
  if (F.mob) return quad;
  tel.poser({ quad, ep, z, ombre: { dx: 22, dy: 30, op: .32 }, glisse: .9 + (p - .3) * 2, reflet: 1 });
  mains.plaque('main-gauche-telephone', quad, { z: z + 7, contact: true });
  return quad;
}
/* le CV sur la planche du poteau, dès que le poteau se voit : une petite tache claire au loin, qui grandit avec lui */
/* C3 : chaque bouffée qui soulève la feuille du CV, au croisement, s'entend (le vent enfle avec elle, puis retombe) ;
   la force annoncée est le sommet de la bouffée qui commence (la rafale est une fonction du temps, on regarde devant) */
let ventHaut = false;
function bouffee(F, info, force) {
  if ((F.ctx.options && F.ctx.options.fixe) || !info.poteau || info.poteau.op < .3 || info.poteau.d > 9 || force < .2) { ventHaut = false; return; }
  const r = rafale(F.t) * force;
  if (!ventHaut && r > .5) {
    ventHaut = true;
    let m = r; for (let k = 1; k <= 24; k++) m = Math.max(m, rafale(F.t + k * .1) * force);
    son.evenement('vent', { force: clamp(m, 0, 1) });
  } else if (ventHaut && r < .34) ventHaut = false;
}
export function feuillePoteau(F, info, o = {}) {
  if (!info.poteau) return null;
  if (o.op === undefined || o.op > .3) bouffee(F, info, o.vent === undefined ? 1 : o.vent);
  return F.feuille.surPoteau(Object.assign({ poteau: info.poteau, t: F.t, op: info.poteau.op }, o));
}
export function plan3(F) {
  const { tel, monde } = F;
  return Object.assign({}, PLANS[2], {
    rendre(p, actif) {
      if (!actif) return;
      F.vivant = true;
      const info = monde.rendre(p);
      feuillePoteau(F, info);
      telTenu(F, p);
      if (!F.mob) tel.etatEcran({ guide: 1, heure: MINUTES[1], chemin: avancee(F), reste: monde.reste(), consigne: consigne(p) });   /* O2 : la distance lue sur la caméra (monde.reste) */
    }
  });
}
