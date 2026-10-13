/* =====================================================================
   Plan 6. L'atelier (p 0,74 à 0,82). On entre : la table d'architecte en
   entier, la feuille de dessin sur la moitié droite de la planche, le
   crayon dessiné couché sur la règle ; la caméra avance jusqu'à ce que la
   planche remplisse l'écran. La main gauche pose le téléphone debout sur
   la règle, à gauche, dans son vrai format (quatrième passe, D10) ; son
   écran revient à la conversation de Marianne. La main droite cloue le CV
   dans le bois, juste à sa droite (D9). Arrêt 3 : le crayon.
   ===================================================================== */
import { clamp, lerp, seg, sseg, eEntree, eDepl, centreQuad, quadEntre } from '../outils.js';
import { T, PLANS, tempsDe, pDe } from '../temps.js';
import { reperesPx } from '../visuels.js';
import { MINUTES } from './p2-depart.js';
import { poseTenue, similitudeQuads, appliquerQ, tenueDroite } from './communs.js';

/* Le téléphone debout sur la règle et le CV cloué dans le bois, tels qu'ils restent jusqu'à la fin (plans 6 à 8).
   o.leve : { tel, cv } de 0 à 1, l'objet se soulève très légèrement (survol, tableau final) */
export function objetsPoses(F, o = {}) {
  const { tel, atelier } = F, fe = F.feuille, lv = o.leve || {};
  if (!F.mob) {
    const q = atelier.quadTel(), dy = -6 * (lv.tel || 0);
    tel.poser({ quad: q.map(([x, y]) => [x, y + dy]), ep: [0, 0], z: 16, ombre: { dx: 7 + 4 * (lv.tel || 0), dy: 5 - dy * .6, op: .36 }, contact: 1 - .5 * (lv.tel || 0), glisse: 1.4, reflet: .8 });
    tel.conversation(.19, T);
    tel.etatEcran({ guide: 0, veille: 0, heure: MINUTES[1] + 1 + (o.minute || 0) });
  }
  /* M5 (treizième passe) : sur téléphone, pas de CV sur la planche */
  if (F.mob) return { qTel: null, qCv: null };
  const qc = atelier.quadCv(), dc = -6 * (lv.cv || 0), A = etatAplat(F, F.p === undefined ? 1 : F.p);
  fe.surPlan({ quad: qc.map(([x, y]) => [x, y + dc]), forme: fe.formePlanche(F.t, A.aGeo), aplat: A.aTex, reflet: A.tau, clouBas: true, ombre: { op: .5, base: [3 + 4 * A.leve, 5 + 6 * A.leve - dc * .6], dir: [.45 + .25 * A.leve, .5 + .25 * A.leve], hmax: .06 }, clou: 1 });
  /* F23 : à l'arrêt du dessin, les initiales du CV sont le lien LinkedIn */
  fe.lienInitiales(F.arret === 3);
  return { qTel: F.mob ? null : atelier.quadTel(), qCv: qc };
}

/* Cinquième passe, E4 : l'entrée dans l'atelier. De loin la façade est fermée ; à mi-distance les vantaux pivotent
   et découvrent notre table (atelier-table), posée dans l'ouverture là où on la voyait par la vitre (un point à 3 m
   derrière la porte : elle grandit moins vite que l'encadrement), la feuille de dessin et le crayon déjà dessus ; la
   pièce, sombre derrière la vitre, s'éclaire à mesure que les portes s'ouvrent. La photo couvre toujours l'ouverture,
   découpée par l'encadrement d'acier : aucun bord d'image. Quand l'ouverture remplit presque le cadre, la même photo
   gagne le reste du cadre (fondu plein cadre), puis la caméra avance jusqu'à la planche. Bornes réglées à chaque
   redimensionnement, d'après la taille de l'ouverture à l'écran : pE à pA, la photo passe de l'ouverture à l'écran ; pA à pC, fondu plein cadre ; pB, fin de la marche. */
export function reglerEntree(F) {
  const { monde, atelier } = F, W = F.W, H = F.H;
  let p60 = null, p90 = null, pC = null, dernier = null, pDernier = null;
  for (let p = .70; p <= .7531; p += .0005) {
    const q = monde.porteA(p); if (!q) continue;
    /* la part de l'écran couverte par l'ouverture (bornes intérieures du quadrilatère) */
    const gx = Math.max(q[0][0], q[3][0]), dx = Math.min(q[1][0], q[2][0]), hy = Math.max(q[0][1], q[1][1]), by = Math.min(q[2][1], q[3][1]);
    const cov = Math.min((Math.min(dx, W) - Math.max(gx, 0)) / W, (Math.min(by, H) - Math.max(hy, 0)) / H);
    if (p60 === null && cov >= .6) p60 = p;
    if (p90 === null && cov >= .9) p90 = p;
    if (pC === null && gx <= 0 && dx >= W && hy <= 0 && by >= H) pC = p;
    dernier = q; pDernier = p;
  }
  const E = {};
  E.pB = pDernier || .7525;
  E.pC = pC === null ? E.pB : pC;
  E.pA = Math.min(E.pC - .002, p90 === null ? E.pC - .004 : p90);
  /* la photo passe de « couvrir l'ouverture » à « couvrir l'écran » sans à-coup, à partir des 60 % de couverture */
  E.pE = Math.min(E.pA - .003, p60 === null ? E.pA - .01 : p60);
  atelier.alignerFin(dernier);
  F.entree = E;
  /* K1 : les bornes du calque net du mur (agrandissement 1,15) et la partie de l'écran qu'il couvre */
  const poseDe = p => {
    if (p <= E.pB) { const q = monde.porteA(p); return q && q.table ? atelier.poseAlignee({ p, aligne: q, vitrage: q.vitrage, vue: q.table, ecran: sseg(p, E.pE, E.pA), zoom: zoomTable(E, p) }) : null; }
    return atelier.poseLibre(zoomTable(E, p));
  };
  atelier.reglerNet(E, poseDe, tempsDe, pDe);
}
/* J2 : la pose de la photo de la table à l'instant p (photo -> écran), telle que entreeAtelier la donnera, sans rien
   poser : le monde y accroche la lampe vue de dehors (null hors de l'approche) */
export function poseTablePour(F, p, porte) {
  const E = F.entree || { pA: .746, pC: .749, pB: .7525 };
  if (!porte || !porte.table || p > E.pB || !F.atelier.poseAlignee) return null;
  return F.atelier.poseAlignee({ p, aligne: porte.q, vitrage: porte.vitrage, vue: porte.table, ecran: sseg(p, E.pE === undefined ? E.pA - .003 : E.pE, E.pA), zoom: sseg(p, E.pA, T.fondu[0]) });
}
/* le fondu plein cadre, de 0 à 1 (le monde s'efface d'autant) */
export const horsCadre = (F, p) => { const E = F.entree; return E ? sseg(p, E.pA, E.pC) : 0; };
/* F8 : le zoom vers la planche commence dès le fondu plein cadre et s'achève quand la photo de près prend le relais */
const zoomTable = (E, p) => sseg(p, E.pA, T.fondu[0]);
export function entreeAtelier(F, p, info) {
  const { atelier } = F, E = F.entree || { pA: .746, pC: .749, pB: .7525 };
  if (p <= E.pB) {
    const po = info && info.porte;
    /* K11 : la pièce (la photo de la table) est posée dès que la façade est dans le cadre, portes fermées comprises : on
       la voit par les carreaux, puis par la porte qui s'ouvre, et on y entre sans qu'elle change */
    if (!po || (!po.vitrage && po.ouverture <= .0005)) return false;
    const k = po.ouverture, clip = p < E.pC, hors = sseg(p, E.pA, E.pC), ecran = sseg(p, E.pE === undefined ? E.pA - .003 : E.pE, E.pA);
    /* J3 : la pièce de la photo de façade reste dans l'ouverture jusqu'à la fin de l'ouverture (T.piece), puis le fondu ;
       K11 : plus de pièce de façade (piece 0) */
    atelier.poserTable({ p, op: 1, aligne: po.q, vitrage: po.vitrage, vue: po.table, clip, hors, ecran, zoom: zoomTable(E, p), sombre: (1 - sseg(k, .2, 1)) * .62, lumiere: sseg(k, .25, .95) * (1 - hors), piece: po.vitrage ? 0 : 1 - sseg(p, T.piece[0], T.piece[1]) });
  } else atelier.poserTable({ p, op: 1, zoom: zoomTable(E, p) });
  /* E9 : la feuille de dessin et le crayon sont déjà sur la planche, dès qu'on voit la table */
  atelier.poserFeuille({ op: 1, etat: {} });
  atelier.poserCrayon({ op: 1 });
  return true;
}

/* G5 : l'état de la mise à plat du CV (partagé par les plans 6 à 8, pour qu'il n'y ait jamais de saut) */
let tAplat = null;
function etatAplat(F, p) {
  if (p >= T.clou[1]) { if (tAplat === null) tAplat = F.t; } else tAplat = null;
  const tau = clamp(Math.max(tAplat === null ? 0 : (F.t - tAplat) / 1.5, seg(p, T.clou[1], T.clou[1] + .03)));
  const aGeo = clamp(eDepl(seg(tau, 0, .7)) - .1 * Math.sin(Math.PI * seg(tau, .7, .95)), 0, 1);
  if (tau > 0 && tau < 1) F.vivant = true;
  return { tau, aGeo, aTex: eDepl(tau), leve: 1 - aGeo };
}
export function plan6(F) {
  const { tel, mains, monde, atelier } = F, fe = F.feuille;
  const vF = F.vis['main-droite-feuille'], qF = reperesPx(vF, 'quad'), imQ = [[0, 0], [vF.w, 0], [vF.w, vF.h], [0, vF.h]];
  const crayonB = atelier.elements.crayon;
  crayonB.addEventListener('click', e => { if (F.arret === 2) { e.stopPropagation(); F.continuer && F.continuer(); } });
  return Object.assign({}, PLANS[5], {
    rendre(p, actif) {
      if (!actif) return;
      F.vivant = true;
      /* M5 (treizième passe) : petit écran, droit au dessin : cadré sur l'idée entière dès l'entrée (plus de CV ni de crayon
         d'abord) ; ni téléphone posé, ni CV cloué */
      if (F.mob && atelier.cadrage) atelier.centrer(atelier.cadrage.x, atelier.cadrage.zoom, atelier.cadrage.dy);
      /* la façade et ses portes, le fondu plein cadre vers la table, puis la planche de près */
      const E = F.entree || { pB: .7525 };
      const info = p <= E.pB ? monde.rendre(p, { alpha: 1 - horsCadre(F, p) }) : null;
      /* J13 : le fondu entre la photo de la table et la planche de près, court (0,35 s de film), à la fin du mouvement (la
         planche couvre alors plus de 80 % de la largeur de l'écran), les deux plateaux superposés par le morph */
      /* K1 : T.morphPres (et non T.morph, qui est la borne du plan 7) */
      const f = sseg(p, T.morphPres[0], T.morphPres[1]);
      if (f < 1) entreeAtelier(F, p, info);
      /* J15 : le plateau de la photo nette, dès le début du passage (le reste de la photo de près, ses côtés de mur, ne
         vient qu'avec T.morphPres) */
      if (f < 1) atelier.poserPlateau(sseg(p, T.plateau[0], T.plateau[1]));
      if (f > 0) { atelier.poserPres(f, f < 1); atelier.poserFeuille({ op: 1, etat: {} }); }
      const ici = F.arret === 2;
      atelier.poserCrayon({ op: 1, bouton: ici });
      crayonB.classList.toggle('cmd-actif', ici);
      if (ici) { const r = atelier.crayonRegle(); F.commande = { el: crayonB, pt: [(r.P[0] + r.E[0]) / 2, Math.min(r.P[1], r.E[1]) - 46] }; }
      /* le téléphone : tenu, puis posé debout sur la règle ; la main le lâche et s'en va */
      const kt = eDepl(seg(p, T.poseTel[0], T.poseTel[1]));
      if (!F.mob) {
        const tenu = poseTenue(F, 1 - kt), qTelPose = atelier.quadTel();
        let qTel = kt > 0 ? quadEntre(tenu.quad, qTelPose, kt, { arc: [30, -40] }) : tenu.quad;
        /* F9 : la main l'incline en l'approchant, le pied touche la règle d'abord ; il bascule contre la planche et se
           cale (deux petits balancements amortis autour du pied) */
        if (kt > 0) {
          const kc = seg(p, T.poseTel[1] - .002, T.poseTel[1] + .01);
          const a = (10 * Math.sin(Math.PI * Math.min(1, kt * 1.15)) * (1 - sseg(kt, .7, .95)) + (kc > 0 && kc < 1 ? 1.6 * Math.exp(-4 * kc) * Math.sin(kc * Math.PI * 3) : 0)) * Math.PI / 180;
          const piv = [(qTel[2][0] + qTel[3][0]) / 2, (qTel[2][1] + qTel[3][1]) / 2], ca = Math.cos(a), sa = Math.sin(a);
          qTel = qTel.map(([x, y]) => { const X = x - piv[0], Y = y - piv[1]; return [piv[0] + X * ca - Y * sa, piv[1] + X * sa + Y * ca]; });
        }
        const ep = [lerp(tenu.ep[0], 0, kt), lerp(tenu.ep[1], 0, kt)];
        /* l'ombre portée sur la feuille suit la lumière du haut gauche : longue et douce quand il est encore haut, courte et
           nette une fois calé ; l'ombre de contact sur la règle naît au premier appui */
        tel.poser({ quad: qTel, ep, z: kt > .9 ? 16 : 30, ombre: { dx: lerp(22, 8, kt), dy: lerp(30, 6, kt), op: lerp(.3, .4, sseg(kt, .6, 1)) }, contact: sseg(kt, .78, .95), glisse: 1.2 + kt * .2, reflet: lerp(1, .8, kt) });
        tel.griffe(null);
        const lacheG = eEntree(seg(p, T.poseTel[1] - .002, T.mainsSortent[1]));
        if (lacheG < 1) mains.plaque('main-gauche-telephone', qTel, { z: 37, decale: [-lacheG * F.W * .12, lacheG * F.H * .7], op: 1 - seg(lacheG, .6, 1), contact: lacheG < .02 });
        /* posé, l'écran revient à la conversation de Marianne */
        const kv = eEntree(seg(p, T.poseTel[1] - .004, T.poseTel[1] + .008));
        if (kv > 0) tel.conversation(.19, T);
        tel.etatEcran({ guide: 1 - kv, heure: MINUTES[1], chemin: 1, branche: 1, versAtelier: 1, consigne: 3 });
      } else return;
      /* le CV : tenu, puis cloué dans le bois à droite du téléphone ; le clou s'enfonce d'un geste */
      const kc = eDepl(seg(p, T.poseCv[0], T.poseCv[1]));
      const qPose = atelier.quadCv();
      const qTenu = F.mob ? qPose.map(([x, y]) => [x, y + F.H * .8]) : appliquerQ(tenueDroite(F), qF);
      const qCv = kc > 0 ? quadEntre(qTenu, qPose, kc, { arc: F.mob ? [0, 0] : [-30, -50] }) : qTenu;
      const pose = p >= T.clou[0];
      F.zPapier = pose ? 13 : 36;
      const kclou = eEntree(seg(p, T.clou[0], T.clou[1]));
      /* G5 : clouée, la feuille se met à plat en une seconde et demie (temps réel ; le défilement l'achève aussi) :
         les coins se déroulent selon une courbe douce, touchent le bois, rebondissent à peine, se posent ; l'ombre se
         resserre en même temps ; un reflet discret glisse sur le papier */
      const { tau, aGeo, aTex, leve } = etatAplat(F, p);
      const Hm = similitudeQuads(qF, qCv);
      fe.surPlan({
        quad: qCv, forme: pose ? fe.formePlanche(F.t, aGeo) : fe.formeMain(F.t, 0, 1 - kc), aplat: pose ? aTex : undefined, reflet: tau, clouBas: true,
        pouce: !pose && !F.mob ? appliquerQ(Hm, imQ) : null,
        ombre: pose ? { op: .5, base: [3 + 4 * leve, 5 + 6 * leve], dir: [.45 + .25 * leve, .5 + .25 * leve], hmax: .06 } : { op: lerp(.34, .45, kc), base: [lerp(12, 4, kc), lerp(18, 6, kc)], dir: [.35, .55], hmax: .08 },
        clou: kclou
      });
      fe.lienInitiales(F.arret === 2);
      const lacheD = eEntree(seg(p, T.clou[0], T.mainsSortent[1]));
      if (!F.mob && lacheD < 1) mains.plaqueImage('main-droite-feuille', appliquerQ(Hm, imQ), { z: 39, decale: [lacheD * F.W * .2, lacheD * F.H * .6], op: 1 - seg(lacheD, .6, 1) });
    }
  });
}
