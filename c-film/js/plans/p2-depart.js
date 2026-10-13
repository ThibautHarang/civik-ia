/* =====================================================================
   Plan 2. Le départ (p 0,20 à 0,30) : l'aube. Le défilement appuie sur
   « Me guider », l'écran passe en mode guide (« Marianne, par Civik-ia »,
   carte au trait, 420 m), l'heure roule de 22:47 à 06:52. Une main gauche
   à la plume monte du bas, prend le téléphone et l'amène en bas à gauche.
   C'est l'objet qui rebondit, une seule fois, quand la main le saisit.
   ===================================================================== */
import { clamp, lerp, seg, sseg, eEntree, eDepl, rebond, quadEntre, bezier } from '../outils.js';
const eDescente = bezier(.5, 0, .4, 1);
import { T, PLANS } from '../temps.js';
import { poseNuit, poseTenue } from './communs.js';
import { poserNuitMobile } from './p1-nuit.js';

export const MINUTES = [22 * 60 + 47, 24 * 60 + 6 * 60 + 52];

export function plan2(F) {
  const { tel, mains, monde } = F;
  return Object.assign({}, PLANS[1], {
    rendre(p, actif) {
      if (!actif) return;
      F.vivant = true;
      monde.rendre(p, { alpha: seg(p, T.monde[0] - .002, T.monde[0] + .01) });
      /* M2 (treizième passe) : sur téléphone, le téléphone de la nuit descend hors du cadre (0,8 s de film, de 0,196 à 0,216,
         départ doux, léger freinage en sortant), son écran reste sur la conversation ; puis plus rien que le monde : ni
         main, ni téléphone, ni guide */
      if (F.mob) {
        const k = seg(p, .196, .216);
        if (k < 1) {
          const nuit = poseNuit(F), haut = Math.min(...nuit.quad.map(q => q[1]));
          poserNuitMobile(F, nuit.quad, nuit.ep, p, eDescente(k) * (F.H - haut + 60));
          tel.conversation(Math.min(p, T.guide[0] + .004), T);
          tel.etatEcran({ guide: 0, heure: lerp(MINUTES[0], MINUTES[1], eDepl(seg(p, T.heure[0], T.heure[1]))) });
        }
        return;
      }
      const nuit = poseNuit(F), tenue = poseTenue(F, sseg(p, T.tenue[1] - .01, T.tenue[1] + .03));
      const k = eDepl(seg(p, T.tenue[0], T.tenue[1]));
      /* le téléphone : de la nuit à la main ; à la prise, il s'incline et s'ajuste dans la main, léger tassement */
      let quad = quadEntre(nuit.quad, tenue.quad, k, { arc: [-20, 30], tour: -.05 });
      const r = seg(p, T.mainMonte[1] - .004, T.mainMonte[1] + .022);
      let quadMain = quad;
      if (r > 0 && r < 1) {
        /* E10 : le téléphone se loge dans la paume (il s'enfonce d'un rien : échelle et rotation autour du coin tenu),
           la main se referme d'un cran avec lui ; tout part de zéro et y revient, sans coupe */
        const tas = 7 * Math.sin(Math.PI * r) * Math.exp(-1.2 * r), sc = 1 - .026 * Math.sin(Math.PI * r) * Math.exp(-1.4 * r);
        const a = (3.2 * Math.exp(-3.6 * r) * Math.sin(2.3 * Math.PI * r)) * Math.PI / 180, c = quad[3], co = Math.cos(a) * sc, si = Math.sin(a) * sc;
        const am = (1.6 * Math.sin(Math.PI * r) * Math.exp(-1.6 * r)) * Math.PI / 180, cm = Math.cos(am) * (1 - .012 * Math.sin(Math.PI * r)), sm = Math.sin(am) * (1 - .012 * Math.sin(Math.PI * r));
        quadMain = quad.map(([x, y]) => { const dx = x - c[0], dy = y - c[1]; return [c[0] + dx * cm - dy * sm, c[1] + dx * sm + dy * cm + tas * .7]; });
        quad = quad.map(([x, y]) => { const dx = x - c[0], dy = y - c[1]; return [c[0] + dx * co - dy * si, c[1] + dx * si + dy * co + tas]; });
      }
      const ep = [lerp(nuit.ep[0], tenue.ep[0], k), lerp(nuit.ep[1], tenue.ep[1], k)];
      /* F3 : avec la photo de trois quarts. Les deux images tournent autour du même axe vertical (le centre du téléphone),
         à la même hauteur apparente : la photo (environ 25 degrés) s'élargit en tournant vers nous ; le téléphone de face
         paraît par un fondu quand l'angle passe sous 10 degrés (k de 0,26 à 0,38 du mouvement vers la main) */
      const angle = k < .32 ? lerp(25, 10, k / .32) : lerp(10, 5, clamp((k - .32) / .4));
      const passe = tel.a34 ? sseg(k, .26, .38) : 1;
      let q34 = null;
      if (!F.mob && tel.a34 && passe < 1) {
        const c = [(quad[0][0] + quad[2][0]) / 2, (quad[0][1] + quad[2][1]) / 2], hq = (Math.hypot(quad[3][0] - quad[0][0], quad[3][1] - quad[0][1]) + Math.hypot(quad[2][0] - quad[1][0], quad[2][1] - quad[1][1])) / 2;
        q34 = tel.poser34({ cx: c[0], cy: c[1], h: hq, k: 1 - passe, sx: Math.cos(angle * Math.PI / 180) / Math.cos(25 * Math.PI / 180) });
      }
      if (F.mob) tel.feuille({ op: 1 });
      else if (tel.a34 && passe <= 0) { /* la photo seule */ }
      else tel.poser({ quad, ep, ecranDepuis: q34, passe, op: tel.a34 ? passe : 1, opEcran: 1, z: 30, ombre: { dx: lerp(30, 22, k), dy: lerp(40, 30, k), op: lerp(.42, .32, k) }, glisse: lerp(.45, .9, seg(p, .2, .3)), reflet: 1 });
      /* l'écran : appui, mode guide, heure qui roule */
      tel.conversation(Math.min(p, T.guide[0] + .004), T);
      const g = eEntree(seg(p, T.guide[0], T.guide[1]));
      tel.etatEcran({ guide: g, heure: lerp(MINUTES[0], MINUTES[1], eDepl(seg(p, T.heure[0], T.heure[1]))), chemin: 0, reste: monde.reste(), consigne: -1 });   /* O2 : la distance lue sur la caméra (monde.reste) */
      /* la main gauche monte du bas de l'écran et vient tenir le téléphone */
      const m = seg(p, T.mainMonte[0], T.mainMonte[1]);
      if (m > 0 && !F.mob) {
        const e = eEntree(m);
        mains.plaque('main-gauche-telephone', quadMain, { z: 37, decale: [-(1 - e) * F.W * .06, (1 - e) * F.H * .75], op: clamp(m * 4), contact: m >= 1 });
      }
    }
  });
}
