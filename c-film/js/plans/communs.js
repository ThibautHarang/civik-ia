/* =====================================================================
   Poses partagées entre plans : le téléphone de la nuit, le téléphone tenu
   pendant la marche, la main droite qui tient le CV, et quelques calculs.
   ===================================================================== */
import { clamp, lerp, carreVers, appl, quadVersQuad, mult3, centreQuad, quadRect } from '../outils.js';
import { pose3d } from '../telephone.js';
import { reperesPx } from '../visuels.js';

/* le téléphone de la nuit, à gauche, de trois quarts */
export function poseNuit(F) {
  const { W, H } = F;
  /* M1 (treizième passe) : sur téléphone, le téléphone réel de face, debout, centré, large de 72 % de l'écran (300 px au
     plus) ; son haut sous « Communiquer » et le bouton (12 px), son bas vers 92 % de la hauteur, au-dessus du rail ; sur un
     écran court, il garde sa largeur (le texte de son écran reste lisible) et son bas passe sous le rail */
  if (F.mob) {
    const w = Math.min(W * .72, 300), h = w / .486, haut = (F.bloc1Bas || H * .28) + 12, bas = Math.min(H * .92, (F.basUtile || H) - 4);
    const top = Math.max(haut, bas - h);
    /* Y9 (vingt-cinquième passe, 09/10/2026, retour de Thibaut : « il faut que le téléphone soit droit dans l'écran et la bulle comme si
       on le regardait de face ») : sur téléphone, le téléphone de la nuit est droit, de face, sans inclinaison ni perspective (il était
       incliné de 1,5 et 5 degrés) ; l'ordinateur ne change pas */
    return pose3d({ cx: W / 2, cy: top + h / 2, h, rx: 0, ry: 0, rz: 0, f: 2400 });
  }
  const h = Math.min(H * .7, W * .43, 640), w = h * .486, gauche = Math.max(W * .05, W / 2 - 640);
  return pose3d({ cx: gauche + w / 2 + 6, cy: H * .535, h, rx: -5, ry: -17, rz: -2.5, f: 1500 });
}
/* la respiration des mains (retours du 02/10/2026) : quelques pixels, très lente, plus de hochement de marche */
export function respire(F, phase = 0) {
  const t = F.t || 0, P = Math.PI * 2;
  return { dx: 1.3 * Math.sin(P * t / 6.3 + phase * 1.7), dy: 2.4 * Math.sin(P * t / 4.7 + phase), rot: .32 * Math.sin(P * t / 5.6 + phase * .6) };
}
/* le téléphone tenu dans la main gauche, en bas à gauche */
export function poseTenue(F, k = 1, baisse = 0) {
  const { W, H } = F;
  /* troisième passe, point B4 : le bas du téléphone reste au-dessus de l'étiquette et du repère de chapitre */
  const h = Math.min(H * .56, 520, H - 66 - 150), w = h * .486;
  /* à l'arrivée au croisement, on baisse le téléphone : la planche et le texte ont la place */
  const bas = baisse * h * .56;
  const r = respire(F, 0), by = r.dy * k, bx = r.dx * k, br = r.rot * k;
  if (F.mob) return pose3d({ cx: W * .2, cy: H * .86, h: H * .34, rx: -2, ry: 4, rz: 6, f: 1400 });
  return pose3d({ cx: Math.max(W * .05, W / 2 - 640) + w * .5 + 28 + bx - baisse * 30, cy: H - h * .5 - Math.max(H * .035, 66) + by + bas, h, rx: -3 + baisse * 6, ry: 5, rz: 6 + br - baisse * 4, f: 1500 });
}
/* échelle apparente de la main gauche (px écran par px image), pour garder la main droite à la même */
export function echelleMainGauche(F, quadTel) {
  const v = F.vis['main-gauche-telephone'], q = reperesPx(v, 'quad');
  const L = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  return L(quadTel[0], quadTel[3]) / L(q[0], q[3]);
}
/* similitude qui pose un point d'image P sur un point écran E, avec un angle (degrés) et une échelle */
export function similitude(P, E, ang, ech) {
  const a = ang * Math.PI / 180, c = Math.cos(a) * ech, s = Math.sin(a) * ech;
  return [c, -s, E[0] - (c * P[0] - s * P[1]), s, c, E[1] - (s * P[0] + c * P[1]), 0, 0, 1];
}
export const appliquerQ = (Hm, q) => q.map(([x, y]) => appl(Hm, x, y));
/* similitude qui envoie au mieux le quad a (image) sur le quad b (écran) : centre, angle du bord gauche, longueur du bord gauche */
export function similitudeQuads(a, b) {
  const ca = centreQuad(a), cb = centreQuad(b);
  const ang = q => Math.atan2(q[3][1] - q[0][1], q[3][0] - q[0][0]);
  const len = q => Math.hypot(q[3][0] - q[0][0], q[3][1] - q[0][1]) + Math.hypot(q[2][0] - q[1][0], q[2][1] - q[1][1]);
  return similitude(ca, cb, (ang(b) - ang(a)) * 180 / Math.PI, len(b) / len(a));
}
/* interpolation de deux similitudes données par (centre, angle, échelle) */
export function decomposer(Hm, P) { const c = appl(Hm, P[0], P[1]); return { c, a: Math.atan2(Hm[3], Hm[0]) * 180 / Math.PI, s: Math.hypot(Hm[0], Hm[3]) }; }
export function entreSim(P, A, B, t) {
  let da = B.a - A.a; while (da > 180) da -= 360; while (da < -180) da += 360;
  return similitude(P, [lerp(A.c[0], B.c[0], t), lerp(A.c[1], B.c[1], t)], A.a + da * t, Math.exp(lerp(Math.log(A.s), Math.log(B.s), t)));
}
/* la main droite qui tient le CV, en bas à droite, en pendant du téléphone : la feuille fait au plus
   un tiers de la largeur, ne descend pas sous le repère de chapitre (retours du 02/10/2026, point 11) */
export function tenueDroite(F) {
  const { W, H } = F;
  const v = F.vis['main-droite-feuille'], q = reperesPx(v, 'quad'), c = centreQuad(q);
  const lq = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]), hq = Math.hypot(q[3][0] - q[0][0], q[3][1] - q[0][1]);
  const redresse = v.reperes.redressement_deg || 0, r = respire(F, 2.1);
  if (F.mob) { const pw = Math.min(W * .42, 170), e = pw / lq; return similitude(c, [W - pw * .5 - 14, H - pw * hq / lq * .5 - 70], redresse + r.rot, e); }
  const pw = Math.min(W * .27, 420, (H - 220) * lq / hq), ph = pw * hq / lq, e = pw / lq;
  return similitude(c, [W - 40 - pw / 2 + r.dx, H - 96 - ph / 2 + r.dy], redresse + r.rot, e);
}
export const quadMain = (F, nom, Hm) => appliquerQ(Hm, reperesPx(F.vis[nom], 'quad'));
