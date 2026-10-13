/* =====================================================================
   Les mains provisoires, à la plume (encre bleu nuit #16205C sur fond
   transparent, chair remplie de papier pour couvrir ce qui passe dessous).
   Chaque main est dessinée dans un repère local puis posée dans son image
   à la géométrie du manifeste par défaut (visuels.js, GEO).
   ===================================================================== */
import { GEO } from '../visuels.js';
import { rng, lerp } from '../outils.js';
import { Peinture, catmull, hachures, arcE, cheminFerme } from '../plume.js';
import { canevas } from './reel.js';

const PAPIER = '#fbf8f1';
const CONT = { wMin: 1.3, wMax: 4.4, tremble: .7, op: .92, pas: 2.2 };
const DET = { wMin: .8, wMax: 2.5, tremble: .5, op: .82, pas: 2 };
const HACH = { pas: 6.5, long: [14, 30], op: .5, wMax: 1.7, wMin: .45 };

function atelierDeMain(w, h) {
  const c = canevas(w, h), g = c.getContext('2d');
  const P = new Peinture(g, '#16205C');
  return { c, g, P };
}
const C = (P, pts, o, g) => P.trait(catmull(pts, 6), Object.assign({}, CONT, o || {}, { graine: g || 1 }));
const D = (P, pts, o, g) => P.trait(catmull(pts, 6), Object.assign({}, DET, o || {}, { graine: g || 1 }));
const H = (P, poly, o, g) => hachures(P, poly, Object.assign({}, HACH, o || {}, { graine: g || 1 }));
function remplir(g, pts, k) { g.globalAlpha = 1; g.fillStyle = PAPIER; g.fill(new Path2D(cheminFerme(catmull(pts.concat([pts[0]]), k || 4)))); }
/* contour « cherché » : le même trait repris, un peu décalé, plus léger */
function repris(P, pts, o, gr) { C(P, pts, o, gr); C(P, pts.map(([x, y], i) => [x + Math.sin(i * 1.7 + gr) * 2.4, y + Math.cos(i * 1.3 + gr) * 2.4]), Object.assign({}, o || {}, { wMax: 1.8, op: .38 }), gr + 50); }

/* ---------------------------------------------------------------------
   Main gauche tenant le téléphone (vue à la première personne)
   Repère local : celui du téléphone debout, centre (0, 0), bords à ±165 et ±339,5.
   --------------------------------------------------------------------- */
export function mainGaucheTelephone() {
  const G = GEO['main-gauche-telephone'], pl = G.plaque, { c, g, P } = atelierDeMain(G.w, G.h);
  const a = pl.a * Math.PI / 180;
  g.setTransform(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), pl.cx, pl.cy);
  const hw = pl.w / 2, hh = pl.h / 2, r = 50;
  /* bord du téléphone (coin arrondi) : sert à suivre la forme sans la dessiner */
  const doigts = [[-80, 36, 58], [-2, 38, 70], [76, 35, 64], [146, 29, 50]];
  /* 1. la chair : avant-bras, paume sous le téléphone, pouce, doigts */
  const paume = [[-560, 690], [-470, 640], [-392, 588], [-334, 534], [-292, 466], [-276, 388], [-266, 300], [-258, 214], [-238, 132], [-210, 62], [-182, 8], [-160, -26], [-138, -42], [-114, -38], [-100, -18], [-102, 20], [-116, 72], [-136, 124], [-156, 166], [-166, 200],
    [-hw, 240], [-hw, hh - r], [-hw + 8, hh - 10], [-hw + r, hh], [hw - r, hh], [hw - 8, hh - 10], [hw, hh - r], [hw, 205], [202, 230], [208, 290], [196, 350], [168, 400], [120, 448], [60, 488], [-10, 526], [-90, 568], [-170, 612], [-260, 666], [-360, 724], [-430, 770]];
  remplir(g, paume, 3);
  doigts.forEach(([yc, h, b]) => remplir(g, [[150, yc - h * .5], [166, yc - h * .95], [hw + b * .62, yc - h], [hw + b, yc - h * .3], [hw + b * .94, yc + h * .45], [hw + b * .55, yc + h * .97], [172, yc + h * .92], [152, yc + h * .45], [146, yc]], 4));
  /* 2. le pouce, posé sur le bord gauche et sur la face */
  repris(P, [[-266, 300], [-258, 214], [-238, 132], [-210, 62], [-182, 8], [-160, -26]], {}, 11);
  C(P, [[-160, -26], [-138, -42], [-114, -38], [-100, -18], [-101, 6]], { wMax: 3.4 }, 12);
  C(P, [[-101, 6], [-106, 36], [-118, 76], [-136, 122], [-154, 162], [-166, 196]], { wMax: 4.8 }, 13);
  /* ongle du pouce */
  const ong = arcE(-128, -16, 15, 21, 0, Math.PI * 2, .33);
  D(P, ong.slice(0, Math.round(ong.length * .8)), { wMax: 1.8 }, 14);
  D(P, [[-140, 4], [-128, 10], [-114, 6]], { wMax: 1.2, op: .5 }, 15);
  /* pli de la phalange, plis du gras du pouce */
  D(P, [[-206, 84], [-182, 92], [-150, 96]], { wMax: 1.9 }, 16);
  D(P, [[-200, 100], [-178, 106]], { wMax: 1.2, op: .5 }, 17);
  D(P, [[-232, 236], [-214, 262], [-200, 300]], { wMax: 1.4, op: .55 }, 18);
  /* 3. la paume et le poignet sous le téléphone, l'avant-bras qui se perd */
  repris(P, [[-266, 300], [-276, 388], [-292, 466], [-334, 534], [-392, 588]], {}, 21);
  C(P, [[-392, 588], [-470, 640], [-560, 690]], { wMax: 2.6, op: .55 }, 22);
  repris(P, [[hw, 205], [202, 230], [208, 290], [196, 350], [168, 400], [120, 448], [60, 488], [-10, 526]], {}, 23);
  C(P, [[-10, 526], [-90, 568], [-170, 612], [-260, 666]], { wMax: 2.8, op: .6 }, 24);
  C(P, [[-260, 666], [-360, 724]], { wMax: 1.6, op: .35 }, 25);
  D(P, [[-130, hh + 28], [-70, hh + 52], [0, hh + 62], [58, hh + 50]], { wMax: 1.6, op: .5 }, 26);
  D(P, [[-60, hh + 108], [-20, hh + 98], [24, hh + 112]], { wMax: 1.2, op: .45 }, 27);
  /* 4. le bout des quatre doigts, autour du bord droit */
  doigts.forEach(([yc, h, b], i) => {
    const gr = 30 + i * 6;
    repris(P, [[166, yc - h * .95], [hw + b * .62, yc - h], [hw + b, yc - h * .3], [hw + b * .94, yc + h * .45], [hw + b * .55, yc + h * .97], [172, yc + h * .92]], { wMax: 3.8 }, gr);
    C(P, [[166, yc - h * .95], [150, yc - h * .5], [146, yc], [152, yc + h * .45]], { wMax: 2.6 }, gr + 1);
    /* ongle vu de côté, pli de l'articulation */
    D(P, [[150, yc - h * .3], [160, yc - h * .46], [172, yc - h * .4]], { wMax: 1.4, op: .7 }, gr + 2);
    D(P, [[hw + b * .7, yc - h * .7], [hw + b * .82, yc - h * .1], [hw + b * .74, yc + h * .45]], { wMax: 1.5, op: .55 }, gr + 3);
    /* ombre sous chaque doigt (lumière en haut à gauche) */
    H(P, [[168, yc + h * .1], [hw + b * .9, yc + h * .1], [hw + b * .6, yc + h * .9], [172, yc + h * .85]], { angle: 32, pas: 5 }, gr + 4);
  });
  /* 5. ombres : sous le pouce, le long du bord droit, dans la paume */
  H(P, [[-150, 40], [-112, 50], [-130, 120], [-160, 186], [-170, 150]], { angle: 64, pas: 5.2 }, 41);
  H(P, [[hw, 210], [200, 236], [200, 330], [170, 390], [hw, 360]], { angle: 40 }, 42);
  H(P, [[40, hh + 20], [150, hh + 20], [110, 440], [30, 480], [-40, 500]], { angle: 28, pas: 7 }, 43);
  H(P, [[-250, 420], [-200, 470], [-250, 560], [-300, 520]], { angle: 50, pas: 8, op: .35 }, 44);
  H(P, [[-320, 610], [-200, 620], [-260, 660], [-360, 700]], { angle: 20, pas: 9, op: .3 }, 45);
  /* ombre portée du téléphone sur la chair, contre le bord gauche */
  H(P, [[-hw - 26, 205], [-hw, 205], [-hw, hh], [-hw - 30, hh - 10]], { angle: 80, pas: 4.4, op: .45 }, 46);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return c;
}

/* ---------------------------------------------------------------------
   Main droite tenant une feuille : le pouce devant, près du coin bas droit
   Repère local : la feuille A4 debout, centre (0, 0), bords à ±300 et ±424,5.
   --------------------------------------------------------------------- */
function pouceSurFeuille(P, g, k) {
  const hw = 300, hh = 424.5;
  /* chair : dos de la main au-delà du bord droit, pouce, poignet */
  const chair = [[300, 214], [334, 246], [356, 298], [364, 360], [356, 420], [374, 500], [404, 600], [436, 720], [470, 820], [330, 820], [318, 700], [300, 600], [282, 522], [252, 470], [214, 412], [184, 362], [166, 318], [170, 290], [190, 272], [214, 270], [240, 288], [270, 320], [hw, 360]];
  remplir(g, chair, 3);
  /* pouce, ongle */
  repris(P, [[300, 358], [270, 320], [240, 288], [214, 270], [190, 272]], { wMax: 3.6 }, 61 + k);
  C(P, [[190, 272], [170, 290], [166, 318], [184, 362], [214, 412], [252, 470], [282, 522]], { wMax: 4.6 }, 62 + k);
  const ong = arcE(206, 300, 17, 24, 0, Math.PI * 2, -.68);
  D(P, ong.slice(0, Math.round(ong.length * .82)), { wMax: 1.8 }, 63 + k);
  D(P, [[226, 340], [246, 330], [262, 336]], { wMax: 1.6, op: .6 }, 64 + k);
  /* le tranchant de l'index derrière la feuille, les jointures */
  repris(P, [[hw, 214], [334, 246], [356, 298], [364, 360], [356, 420]], { wMax: 3.6 }, 65 + k);
  D(P, [[330, 260], [346, 300], [348, 336]], { wMax: 1.4, op: .55 }, 66 + k);
  /* poignet, avant-bras qui se perd */
  C(P, [[356, 420], [374, 500], [404, 600], [436, 720]], { wMax: 3, op: .7 }, 67 + k);
  C(P, [[282, 522], [300, 600], [318, 700]], { wMax: 3, op: .7 }, 68 + k);
  C(P, [[436, 720], [470, 820]], { wMax: 1.6, op: .35 }, 69 + k);
  C(P, [[318, 700], [330, 800]], { wMax: 1.6, op: .35 }, 70 + k);
  /* ombres */
  H(P, [[200, 380], [236, 360], [272, 420], [276, 500], [244, 470]], { angle: 62, pas: 5.5 }, 71 + k);
  H(P, [[334, 300], [360, 330], [360, 420], [340, 430]], { angle: 40, pas: 5 }, 72 + k);
  H(P, [[330, 520], [380, 520], [410, 640], [350, 660]], { angle: 30, pas: 8, op: .35 }, 73 + k);
  /* ombre du pouce sur la feuille, à droite */
  H(P, [[214, 412], [252, 470], [286, 520], [hw, 500], [hw, 440], [262, 420]], { angle: 80, pas: 4.2, op: .3 }, 74 + k);
}
export function mainDroiteFeuille() {
  const G = GEO['main-droite-feuille'], pl = G.plaque, { c, g, P } = atelierDeMain(G.w, G.h);
  const a = pl.a * Math.PI / 180;
  g.setTransform(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), pl.cx, pl.cy);
  pouceSurFeuille(P, g, 0);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return c;
}

/* ---------------------------------------------------------------------
   Main droite qui pince (vue de dos, doigts vers le haut, pouce à gauche)
   Repère local : le poignet en (0, 0), la pince en (-148, -347).
   --------------------------------------------------------------------- */
const PINCE = [-148, -347];
function dessinerPince(P, g) {
  /* doigts repliés : annulaire, auriculaire, majeur (du fond vers l'avant) */
  const moignon = (x0, y0, x1, y1, w, gr) => {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const pts = [[x0 + nx * w, y0 + ny * w], [x1 + nx * w * .92, y1 + ny * w * .92], [x1 + ux * w * .7 + nx * w * .4, y1 + uy * w * .7 + ny * w * .4], [x1 + ux * w * .78, y1 + uy * w * .78], [x1 + ux * w * .7 - nx * w * .4, y1 + uy * w * .7 - ny * w * .4], [x1 - nx * w * .92, y1 - ny * w * .92], [x0 - nx * w, y0 - ny * w]];
    remplir(g, pts, 4);
    repris(P, pts.slice(0, 6), { wMax: 3.6 }, gr);
    D(P, [[x1 + nx * w * .5, y1 + ny * w * .5 + 6], [x1, y1 + 10], [x1 - nx * w * .5, y1 - ny * w * .5 + 6]], { wMax: 1.4, op: .55 }, gr + 1);
    H(P, [[x0 + nx * w * .1, y0], [x1 + nx * w * .1, y1], [x1 + nx * w * .9, y1 + ny * w * .9], [x0 + nx * w * .9, y0 + ny * w * .9]].map(p => p), { angle: 70, pas: 5.5 }, gr + 2);
  };
  /* dos de la main */
  const dos = [[-78, 10], [-96, -60], [-112, -130], [-92, -214], [-78, -262], [-36, -282], [10, -286], [50, -278], [92, -252], [104, -200], [92, -120], [80, -40], [76, 10]];
  remplir(g, dos.concat([[80, 300], [-95, 300]]), 3);
  moignon(84, -236, 98, -318, 26, 81);
  moignon(40, -266, 46, -356, 30, 84);
  moignon(-6, -270, -16, -368, 32, 87);
  /* contours du dos, tendons, jointures */
  repris(P, [[76, 10], [80, -40], [92, -120], [104, -200], [96, -238]], { wMax: 4 }, 91);
  D(P, [[-40, -40], [-50, -150], [-62, -248]], { wMax: 1.2, op: .35 }, 92);
  D(P, [[-6, -30], [-8, -150], [-10, -256]], { wMax: 1.2, op: .35 }, 93);
  D(P, [[28, -30], [34, -150], [40, -250]], { wMax: 1.2, op: .35 }, 94);
  D(P, [[56, -24], [70, -140], [84, -228]], { wMax: 1.2, op: .35 }, 95);
  [[-64, -262], [-10, -276], [40, -268], [84, -240]].forEach(([x, y], i) => D(P, arcE(x, y, 13, 8, Math.PI * 1.1, Math.PI * 1.9), { wMax: 1.6, op: .6 }, 96 + i));
  H(P, [[40, -30], [80, -30], [96, -200], [60, -220]], { angle: 72, pas: 6.5, op: .42 }, 100);
  /* le pouce, du gras de la main jusqu'à la pince */
  const pouce = [[-78, 10], [-104, -44], [-136, -110], [-158, -186], [-164, -252], [-160, -300], [-150, -326], [-134, -330], [-122, -312], [-120, -270], [-116, -214], [-98, -150], [-74, -96], [-56, -40]];
  remplir(g, pouce, 4);
  repris(P, [[-78, 10], [-104, -44], [-136, -110], [-158, -186], [-164, -252], [-160, -300], [-150, -326]], { wMax: 4.2 }, 101);
  C(P, [[-150, -326], [-134, -330], [-122, -312]], { wMax: 3 }, 102);
  C(P, [[-122, -312], [-120, -270], [-116, -214], [-98, -150], [-74, -96]], { wMax: 3.6 }, 103);
  D(P, arcE(-140, -300, 10, 16, 0, Math.PI * 1.7, -.15), { wMax: 1.5 }, 104);
  D(P, [[-156, -224], [-140, -226], [-124, -220]], { wMax: 1.5, op: .55 }, 105);
  H(P, [[-120, -300], [-116, -214], [-98, -150], [-110, -150], [-128, -230]], { angle: 80, pas: 4.5 }, 106);
  /* l'index, courbé, qui vient pincer contre le pouce */
  const index = [[-92, -214], [-96, -280], [-104, -340], [-122, -386], [-146, -398], [-164, -386], [-166, -362], [-150, -352], [-136, -364], [-126, -350], [-120, -312], [-102, -262], [-72, -238]];
  remplir(g, index, 4);
  repris(P, [[-92, -214], [-96, -280], [-104, -340], [-122, -386], [-146, -398], [-164, -386], [-166, -362]], { wMax: 4 }, 111);
  C(P, [[-166, -362], [-150, -352], [-136, -364]], { wMax: 2.4 }, 112);
  C(P, [[-136, -364], [-126, -350], [-120, -312], [-102, -262], [-72, -238]], { wMax: 3.4 }, 113);
  D(P, [[-112, -330], [-100, -340], [-96, -352]], { wMax: 1.4, op: .6 }, 114);
  D(P, [[-140, -384], [-130, -376], [-124, -364]], { wMax: 1.2, op: .55 }, 115);
  D(P, arcE(-154, -380, 9, 6, Math.PI * .8, Math.PI * 1.9, -.4), { wMax: 1.3, op: .7 }, 116);
  H(P, [[-104, -340], [-96, -280], [-82, -240], [-100, -246], [-114, -300]], { angle: 74, pas: 4.6 }, 117);
  /* le poignet et l'avant-bras qui se perdent */
  C(P, [[-78, 10], [-86, 120], [-96, 230]], { wMax: 3, op: .65 }, 121);
  C(P, [[76, 10], [86, 120], [100, 220]], { wMax: 3, op: .65 }, 122);
  C(P, [[-96, 230], [-102, 320]], { wMax: 1.6, op: .3 }, 123);
  C(P, [[100, 220], [108, 300]], { wMax: 1.6, op: .3 }, 124);
  H(P, [[40, 40], [84, 40], [96, 200], [52, 200]], { angle: 70, pas: 8, op: .3 }, 125);
}
function poserPince(g, cible, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const px = PINCE[0] * c - PINCE[1] * s, py = PINCE[0] * s + PINCE[1] * c;
  g.setTransform(c, s, -s, c, cible[0] - px, cible[1] - py);
}
export function mainDroiteSaisit() {
  const G = GEO['main-droite-saisit'], { c, g, P } = atelierDeMain(G.w, G.h);
  poserPince(g, G.pince, -36.9 * Math.PI / 180);
  dessinerPince(P, g);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return c;
}
/* main qui soulève le coin d'une feuille : la même pince, et le coin esquissé */
export function mainSouleve() {
  const G = GEO['main-souleve'], { c, g, P } = atelierDeMain(G.w, G.h);
  const [cx, cy] = G.coin;
  /* le coin soulevé, deux ou trois traits légers */
  g.setTransform(1, 0, 0, 1, 0, 0);
  D(P, [[cx - 330, cy - 70], [cx - 160, cy - 40], [cx - 20, cy - 8], [cx + 6, cy]], { wMax: 2, op: .55 }, 131);
  D(P, [[cx + 6, cy], [cx - 30, cy - 150], [cx - 60, cy - 330]], { wMax: 2, op: .55 }, 132);
  D(P, [[cx - 300, cy - 54], [cx - 120, cy - 70], [cx - 28, cy - 120], [cx - 52, cy - 300]], { wMax: 1.3, op: .3 }, 133);
  poserPince(g, [cx, cy + 4], -48 * Math.PI / 180);
  dessinerPince(P, g);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return c;
}

/* ---------------------------------------------------------------------
   Main droite qui dessine, crayon tenu (reprise de la maquette B, avec un
   crayon tracé à la même plume). Repère : pointe en (0, 0), crayon le long de +x.
   --------------------------------------------------------------------- */
export function mainCrayon() {
  const G = GEO['main-crayon'], { c, g, P } = atelierDeMain(G.w, G.h);
  const s = 1.55, a = 46 * Math.PI / 180;
  g.setTransform(Math.cos(a) * s, Math.sin(a) * s, -Math.sin(a) * s, Math.cos(a) * s, G.pointe[0], G.pointe[1]);
  const o = { wMin: .5, wMax: 2.3, tremble: .45, op: .86, pas: 1.6 };
  const t = (pts, gr, x) => P.trait(catmull(pts, 5), Object.assign({}, o, { graine: gr }, x || {}));
  /* la main, sous le crayon */
  const sil = [[26, -2], [40, -16], [60, -26], [80, -36], [96, -52], [118, -64], [134, -84], [160, -102], [200, -126], [250, -140], [300, -138], [350, -126], [430, -116], [440, -40], [430, 40], [340, 46], [270, 52], [210, 52], [160, 50], [130, 48], [100, 44], [72, 34], [54, 22], [44, 12], [34, 6]];
  remplir(g, sil, 3);
  t([[30, -8], [40, -17], [54, -24], [64, -24]], 401);
  t([[62, -27], [78, -36], [90, -48], [100, -52]], 402);
  t([[98, -54], [116, -64], [128, -80], [138, -86]], 403);
  t([[136, -86], [160, -102], [200, -126], [250, -140], [300, -138], [352, -126], [436, -116]], 404);
  t([[62, -24], [74, -20]], 405, { wMax: 1, op: .5 });
  t([[98, -50], [110, -44]], 406, { wMax: 1, op: .5 });
  t([[136, -84], [146, -74]], 407, { wMax: 1, op: .5 });
  t([[140, -30], [150, -40], [162, -42]], 408, { wMax: 1.3, op: .5 });
  t([[166, -60], [178, -72], [192, -74]], 409, { wMax: 1.3, op: .5 });
  t([[196, -92], [208, -104], [222, -106]], 410, { wMax: 1.2, op: .45 });
  t([[160, -44], [230, -64], [310, -84]], 411, { wMax: .9, op: .28 });
  t([[196, -78], [260, -96], [320, -106]], 412, { wMax: .9, op: .28 });
  t([[44, 12], [56, 24], [74, 34], [102, 44], [132, 48], [168, 50], [214, 52], [276, 52], [342, 46], [432, 40]], 413);
  t([[52, 6], [84, 14], [116, 18], [142, 20]], 414, { wMax: 1.2, op: .5 });
  t([[45, 9], [52, 15], [60, 14]], 415, { wMax: 1, op: .6 });
  hachures(P, [[70, 30], [150, 46], [250, 50], [320, 46], [310, 32], [240, 34], [150, 32], [80, 22]], { pas: 3.4, long: [8, 18], op: .4, graine: 418, angle: 8, wMax: 1.1 });
  hachures(P, [[150, -100], [200, -124], [250, -136], [300, -134], [330, -126], [300, -112], [240, -116], [190, -106]], { pas: 3.6, long: [8, 16], op: .34, graine: 419, angle: -20, wMax: 1.1 });
  /* l'avant-bras qui se perd */
  t([[430, -116], [520, -110], [620, -100]], 420, { op: .5 });
  t([[430, 40], [520, 52], [610, 70]], 421, { op: .5 });
  t([[620, -100], [700, -92]], 422, { op: .25, wMax: 1.2 });
  /* le crayon, à la même plume */
  const e = 10.5;
  g.globalAlpha = 1; g.fillStyle = PAPIER; g.beginPath(); g.moveTo(0, 0); g.lineTo(48, -e); g.lineTo(300, -e); g.lineTo(300, e); g.lineTo(48, e); g.closePath(); g.fill();
  t([[48, -e], [300, -e]], 431, { wMax: 1.6 });
  t([[48, e], [300, e]], 432, { wMax: 1.9 });
  t([[50, -3.5], [298, -3.5]], 433, { wMax: .9, op: .5 });
  t([[0, 0], [48, -e]], 434, { wMax: 1.4 }); t([[0, 0], [48, e]], 435, { wMax: 1.4 });
  t([[48, -e], [43, -5], [48, 0], [43, 5], [48, e]], 436, { wMax: 1.1 });
  g.globalAlpha = .9; g.fillStyle = '#16205C'; g.beginPath(); g.moveTo(0, 0); g.lineTo(12, -2.8); g.lineTo(12, 2.8); g.closePath(); g.fill();
  [282, 288, 294].forEach((x, i) => t([[x, -e - 1], [x, e + 1]], 437 + i, { wMax: 1 }));
  hachures(P, [[60, 3], [296, 3], [296, e - 1], [60, e - 1]], { pas: 2.6, long: [10, 22], op: .45, graine: 440, angle: 2, wMax: .9 });
  /* l'index posé sur le crayon */
  const idx = [[24, -2], [30, -10], [60, -13], [96, -17], [126, -24], [148, -32], [154, -16], [144, 3], [126, 8], [96, 10], [62, 10], [32, 8]];
  remplir(g, idx, 3);
  t([[26, -3], [32, -11], [62, -13], [96, -17], [126, -24], [150, -32]], 421 + 30);
  t([[28, 6], [62, 10], [96, 10], [126, 6], [146, 0]], 422 + 30);
  t([[34, -5], [42, -7], [46, -2]], 423 + 30, { wMax: 1, op: .55 });
  t([[86, -17], [90, -9], [88, -1]], 424 + 30, { wMax: .9, op: .4 });
  hachures(P, [[40, 4], [100, 8], [140, 2], [138, 6], [100, 10], [40, 8]], { pas: 2.2, long: [8, 16], op: .35, graine: 425, angle: -6, wMax: 1 });
  g.setTransform(1, 0, 0, 1, 0, 0);
  return c;
}
