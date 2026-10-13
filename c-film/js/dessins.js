/* =====================================================================
   Les dessins à la plume (deuxième passe, 02/10/2026). Tous peints dans
   le canevas de la feuille de dessin, pour partir avec elle quand la page
   se tourne :
   - le téléphone et le CV redessinés (révélés par le griffonnage) ;
   - l'idée : un point d'interrogation qui se défait en croquis d'une page
     web au format 16:10 (le site de la maquette A, « Mairie de
     Villeneuve-les-Ormes »), puis le croquis prend ses couleurs bloc par
     bloc ; l'application de club, au format d'un téléphone (9 sur 19,5),
     plus petite, en bas à droite de la page.
   ===================================================================== */
import { rng, lerp, clamp, ss, eDepl } from './outils.js';
import { Dessin, ligne, arcE, perimetre, formeMain, gribouillis, hachures, catmull, reech, reechN, longueur, preparer, cheminFerme, echantillonnerChemin, GLYPHE } from './plume.js';

const CONT = { wMin: 1, wMax: 3.4, tremble: .55, op: .9 };
const DET = { wMin: .6, wMax: 2.0, tremble: .4, op: .86 };
const CONS = { profil: 'fin', wMin: .3, wMax: .75, tremble: .25, op: .32, vitesse: .4, levee: 4 };
const echelle = (o, k) => Object.assign({}, o, { wMin: o.wMin * k, wMax: o.wMax * k });
const ENCRE = '#16205C';

function cote(D, x1, y1, x2, y2, txt, o) {
  const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
  D.trait(ligne(x1, y1, x2, y2), Object.assign({}, CONS, o));
  [[x1, y1], [x2, y2]].forEach(([x, y], i) => { D.trait(ligne(x + nx * 7, y + ny * 7, x - nx * 7, y - ny * 7), Object.assign({}, CONS, o)); const s = i ? -1 : 1; D.trait([[x + dx / l * 9 * s + nx * 3, y + dy / l * 9 * s + ny * 3], [x, y], [x + dx / l * 9 * s - nx * 3, y + dy / l * 9 * s - ny * 3]], Object.assign({}, CONS, o)); });
  if (txt) D.texte((x1 + x2) / 2 + nx * 14, (y1 + y2) / 2 + ny * 14 + 4, txt, { phase: o.phase, taille: 15, ancre: 'middle', rot: Math.abs(dy) > Math.abs(dx) ? -90 : 0, op: .5 });
}

/* ---------------------------------------------------------------------
   Le téléphone redessiné (repère : le corps du téléphone, bw x bh pixels)
   --------------------------------------------------------------------- */
export function dessinTelephone(bw, bh, ecran) {
  const D = new Dessin(null, ENCRE), k = bw / 360;
  const C = echelle(CONT, k * 1.4), Dt = echelle(DET, k * 1.4), Cs = echelle(CONS, k * 1.4);
  const cx = bw / 2, [ex0, ey0, ex1, ey1] = ecran, ph = 'd';
  formeMain(D, perimetre(0, 0, bw, bh, bw * .15), Object.assign({}, C, { phase: ph, graine: 30 }));
  D.trait(ligne(cx + 1, -60 * k, cx - 1, bh + 50 * k), Object.assign({}, Cs, { phase: ph, graine: 21 }));
  D.trait(ligne(-50 * k, bh * .42, bw + 52 * k, bh * .42 + 1), Object.assign({}, Cs, { phase: ph, graine: 22 }));
  cote(D, -38 * k, 0, -38 * k, bh, '146', { phase: ph, graine: 25 });
  cote(D, 0, -34 * k, bw, -34 * k, '71,5', { phase: ph, graine: 26 });
  formeMain(D, perimetre(14 * k, 14 * k, bw - 28 * k, bh - 28 * k, bw * .12), Object.assign({}, Dt, { phase: ph, graine: 34 }));
  formeMain(D, perimetre(ex0, ey0, ex1 - ex0, ey1 - ey0, bw * .1), Object.assign({}, Dt, { phase: ph, graine: 36, wMax: 1.4 * k * 1.4 }));
  const pw = bw * .2, phh = pw * .29; formeMain(D, perimetre(cx - pw / 2, ey0 + 22 * k, pw, phh, phh / 2), Object.assign({}, Dt, { phase: ph, graine: 38 }));
  hachures(D, perimetre(cx - pw / 2 + 2, ey0 + 24 * k, pw - 4, phh - 4, phh / 2 - 2), { phase: ph, pas: 2.4 * k * 1.4, long: [8 * k, 18 * k], op: .55, graine: 39, angle: -40 });
  D.trait(ligne(-3 * k, bh * .22, -3 * k, bh * .3), Object.assign({}, Dt, { phase: ph, graine: 45 }));
  D.trait(ligne(-3 * k, bh * .33, -3 * k, bh * .41), Object.assign({}, Dt, { phase: ph, graine: 46 }));
  D.trait(ligne(bw + 3 * k, bh * .28, bw + 3 * k, bh * .4), Object.assign({}, Dt, { phase: ph, graine: 47 }));
  const scx = cx, scy = bh * .4, sr = bw * .24;
  formeMain(D, reech(arcE(scx, scy, sr, sr, Math.PI * .75, Math.PI * 2.75), 2), Object.assign({}, C, { phase: ph, graine: 50 }));
  const S = sr * 1.12 / 439, ox = scx - 219.5 * S, oy = scy - 225 * S;
  const gl = kk => echantillonnerChemin(GLYPHE[kk], 3).map(([x, y]) => [ox + x * S, oy + y * S]);
  const G = gl('g'), Dr = gl('d'), Fl = gl('f');
  [G, Dr, Fl].forEach((P, i) => formeMain(D, P, Object.assign({}, Dt, { phase: ph, graine: 55 + i * 3 })));
  gribouillis(D, cx - bw * .2, bh * .62, bw * .4, 7 * k, { phase: ph, wMin: .45 * k, wMax: 1.6 * k, op: .85, graine: 64 });
  gribouillis(D, cx - bw * .14, bh * .67, bw * .28, 5 * k, { phase: ph, wMin: .35 * k, wMax: 1.1 * k, op: .65, graine: 68 });
  hachures(D, [[bw + 1, 64 * k], [bw + 16 * k, 78 * k], [bw + 16 * k, bh - 30 * k], [bw - 30 * k, bh + 16 * k], [60 * k, bh + 16 * k], [48 * k, bh + 1], [bw - 40 * k, bh + 1], [bw + 1, bh - 40 * k]], { phase: ph, pas: 4.2 * k, long: [12 * k, 26 * k], op: .5, graine: 71, wMax: 1.3 * k * 1.4 });
  hachures(D, G, { phase: ph, pas: 2.4 * k, long: [7 * k, 16 * k], op: .62, graine: 73, angle: -50, wMax: 1.2 * k });
  hachures(D, Dr, { phase: ph, pas: 2.4 * k, long: [7 * k, 16 * k], op: .62, graine: 74, angle: -50, wMax: 1.2 * k });
  D.texte(0, -70 * k, 'Fig. 1', { phase: ph, taille: 20 * k, op: .66 });
  D.texte(bw, -70 * k, 'Marianne', { phase: ph, taille: 15 * k, ancre: 'end', op: .5 });
  D.planifier();
  return D;
}

/* ---------------------------------------------------------------------
   Le CV redessiné, sur la mise en page de la feuille imprimée (unités du
   CV, 600 x 848) : papier, clou, médaillon, nom, titre, filet, trois lignes,
   lien. Le portrait devient son esquisse (image), découpée au médaillon.
   --------------------------------------------------------------------- */
export function dessinCv(B) {
  const D = new Dessin(null, ENCRE), ph = 'd';
  const [px0, py0, px1, py1] = B.papier, W = px1 - px0, Hh = py1 - py0;
  formeMain(D, perimetre(px0, py0, W, Hh, 3), Object.assign({}, CONT, { phase: ph, graine: 130, wMax: 3 }));
  const m = B.medaillon;
  formeMain(D, reech(arcE(m.cx, m.cy, m.r + 1, m.r + 1, -Math.PI / 2, Math.PI * 1.5), 2), Object.assign({}, DET, { phase: ph, graine: 101, wMax: 2 }));
  D.trait(arcE(m.cx, m.cy, m.r * 1.3, m.r * 1.3, -2.5, 2.3), Object.assign({}, CONS, { phase: ph, graine: 102 }));
  D.trait(ligne(px0 + 40, py0 - 26, px0 + 41, py1 + 26), Object.assign({}, CONS, { phase: ph, graine: 120 }));
  D.trait(ligne(px0 - 26, B.regle.y, px1 + 26, B.regle.y + 1), Object.assign({}, CONS, { phase: ph, graine: 121 }));
  cote(D, px0, py0 - 30, px1, py0 - 30, '21', { phase: ph, graine: 123 });
  gribouillis(D, B.nom.x, B.nom.y + B.nom.h * .95, B.nom.w, 15, { phase: ph, wMin: .6, wMax: 2.2, op: .85, graine: 132 });
  B.titre.forEach((l, i) => gribouillis(D, l.x, l.y + l.h, l.w, 7, { phase: ph, wMin: .4, wMax: 1.3, op: .7, graine: 136 + i }));
  D.trait(ligne(B.regle.x, B.regle.y, B.regle.x + B.regle.w, B.regle.y + .5), Object.assign({}, DET, { phase: ph, graine: 140, wMax: 1.6 }));
  B.items.forEach((it, i) => {
    D.trait(arcE(it.pt[0], it.pt[1], 6, 6, 0, Math.PI * 2.2), Object.assign({}, DET, { phase: ph, graine: 150 + i, wMax: 1.8 }));
    it.lignes.forEach((r, j) => gribouillis(D, r.x, r.y + r.h, r.w, 8.5, { phase: ph, wMin: .5, wMax: 1.6, op: .82, graine: 170 + i * 4 + j }));
  });
  gribouillis(D, B.lien.x, B.lien.y + B.lien.h, B.lien.w, 6.5, { phase: ph, wMin: .4, wMax: 1.2, op: .7, graine: 190 });
  hachures(D, [[px1 + 1, py0 + 40], [px1 + 15, py0 + 54], [px1 + 15, py1 + 17], [px0 + 26, py1 + 17], [px0 + 12, py1 + 1], [px1 + 1, py1 + 1]], { phase: ph, pas: 4, long: [12, 26], op: .46, graine: 197 });
  const [kx, ky] = B.clouBas || B.clou;
  D.trait(arcE(kx, ky, 9, 9, 0, Math.PI * 2.2), Object.assign({}, DET, { phase: ph, graine: 199, wMax: 1.8 }));
  hachures(D, arcE(kx, ky, 8, 8, 0, Math.PI * 2), { phase: ph, pas: 2, long: [3, 8], op: .7, graine: 200, marge: .4 });
  D.texte(px0, py0 - 58, 'Fig. 2', { phase: ph, taille: 20, op: .66 });
  D.texte(px1, py0 - 58, 'Le parcours', { phase: ph, taille: 15, ancre: 'end', op: .5 });
  D.planifier();
  return D;
}

/* ---------------------------------------------------------------------
   L'idée, en unités du site (fenêtre 720 x 450, au format 16:10) ;
   l'application à droite, au format 9 sur 19,5.
   --------------------------------------------------------------------- */
export const SITE = { w: 720, h: 450, app: { x: 636, y: 262, w: 129, h: 280 } };
export function dessinIdee() {
  const D = new Dessin(null, ENCRE), morphes = [];
  /* le point d'interrogation, gratté en trois passes, au centre de la fenêtre */
  const qmBase = catmull([[214, 268], [222, 214], [262, 178], [318, 170], [374, 186], [404, 232], [396, 290], [356, 330], [322, 362], [314, 410], [314, 462]], 8).map(([x, y]) => [x + 46, y - 128]);
  const passes = [
    { P: qmBase.map(([x, y]) => [x - 2, y + 1]), g: 301, w: 3.6 },
    { P: qmBase.map(([x, y], i) => [x + 4 + Math.sin(i * .21) * 2.2, y - 3 + Math.cos(i * .17) * 1.5]), g: 302, w: 2.6 },
    { P: qmBase.map(([x, y], i) => [x - 5 + Math.cos(i * .13) * 2.6, y + 3 + Math.sin(i * .23) * 2]), g: 303, w: 2 }
  ];
  const point = arcE(360, 412, 15, 14, -.4, Math.PI * 2 + .2);
  const griffes = [], rq = rng(305);
  for (let k = 0; k < 5; k++) { const i0 = Math.floor(lerp(4, qmBase.length - 30, rq())), sg = qmBase.slice(i0, i0 + 22); griffes.push(sg.map((pt, j) => [pt[0] + (j % 2 ? 6 : -6) * (rq() * .6 + .4), pt[1] + (j % 2 ? -4 : 4) * (rq() * .6 + .4)])); }
  /* les cibles : le cadre de la fenêtre, le bandeau, la barre, l'adresse, le bouton, les trois cartes, l'application */
  const A = SITE.app;
  const cadre = perimetre(0, 0, 720, 450, 12), bandeau = perimetre(16, 100, 688, 190, 10), appli = perimetre(A.x, A.y, A.w, A.h, 18);
  const bouton = perimetre(44, 240, 274, 36, 18), barre = [[0, 34], [720, 34]], url = perimetre(110, 9, 360, 16, 8);
  const cartes = [0, 1, 2].map(i => perimetre(16 + i * 234, 306, 220, 126, 10));
  const cibles = [cadre, bandeau, appli, bouton, barre, url, cartes[0], cartes[1], cartes[2]];
  const sources = [passes[0].P, passes[1].P, passes[2].P, point, griffes[0], griffes[1], griffes[2], griffes[3], griffes[4]];
  sources.forEach((Ps, i) => {
    const N = 140, Aa = reechN(Ps, N), B = reechN(cibles[i], N);
    const o = i < 3 ? { phase: 'qm', wMin: .5, wMax: passes[i].w, tremble: .8, graine: passes[i].g, op: .74 } : i === 3 ? { phase: 'qm', wMin: .6, wMax: 2.6, tremble: .6, graine: 304, op: .8 } : { phase: 'qm', profil: 'hachure', wMin: .4, wMax: 1.4, graine: 306 + i, op: .45, vitesse: .5 };
    const Tq = D.trait(Aa, Object.assign({}, o, { pas: Math.max(1, longueur(Aa) / (N - 1)) }));
    const oB = { wMin: i < 4 ? .8 : .5, wMax: i === 0 ? 2.6 : i < 4 ? 2 : 1.4 };
    morphes.push({
      rendre(u) {
        const d = i * .055, m = eDepl(clamp((u - d) / .5));
        if (m <= 0) { Tq.morph = false; this._m = 0; return; }
        Tq.morph = true; if (m === this._m) return; this._m = m;
        const nb = B.length, P = Tq.P.map((pt, j) => { const b = B[Math.min(j, nb - 1)]; return [lerp(pt[0], b[0], m), lerp(pt[1], b[1], m)]; });
        const R = preparer(P, { brut: true, wMin: lerp(Tq.o.wMin, oB.wMin, m), wMax: lerp(Tq.o.wMax, oB.wMax, m), profil: m > .5 ? 'plume' : Tq.o.profil || 'plume' });
        Tq.dMorph = cheminFerme(R.G.concat(R.D.reverse())); Tq.opMorph = lerp(Tq.op, .86, m);
      }
    });
  });
  /* le croquis du site (maquette A) : points du navigateur, en-tête, croix de l'image, lignes de titre, cartes, lanceur */
  const ph = 'croquis';
  [20, 36, 52].forEach((x, i) => D.trait(arcE(x, 17, 5, 5, 0, Math.PI * 2.1), Object.assign({}, DET, { phase: ph, graine: 320 + i, wMax: 1.3 })));
  /* F12 : le blason fictif de la commune (un écu, une tour, trois ceps), à la plume, à la place d'un logo */
  const ecu = [[23, 45], [57, 45], [57, 63]].concat(catmull([[57, 63], [55, 74], [48, 81], [40, 85]], 4)).concat(catmull([[40, 85], [32, 81], [25, 74], [23, 63]], 4)).concat([[23, 45]]);
  D.trait(ecu, Object.assign({}, DET, { phase: ph, graine: 324, wMax: 1.8 }));
  D.trait(ligne(23, 56, 57, 56), Object.assign({}, DET, { phase: ph, graine: 340, wMax: .9 }));
  D.trait([[33, 80], [33, 66], [35, 66], [35, 63], [38, 63], [38, 66], [42, 66], [42, 63], [45, 63], [45, 66], [47, 66], [47, 79]], Object.assign({}, DET, { phase: ph, graine: 341, wMax: 1.1 }));
  D.trait(arcE(40, 76, 2.4, 3, Math.PI, Math.PI * 2), Object.assign({}, DET, { phase: ph, graine: 342, wMax: .8 }));
  [30, 40, 50].forEach((x, i) => { D.trait(arcE(x, 51.5, 2.2, 2.2, 0, Math.PI * 2.1), Object.assign({}, DET, { phase: ph, graine: 343 + i, wMax: .8 })); D.trait(ligne(x, 49.2, x + 1.5, 47.4), Object.assign({}, DET, { phase: ph, graine: 346 + i, wMax: .6 })); });
  D.trait(ligne(70, 56, 300, 56), Object.assign({}, DET, { phase: ph, graine: 325, wMax: 2.2 }));
  D.trait(ligne(70, 72, 190, 72), Object.assign({}, DET, { phase: ph, graine: 326, wMax: 1.2 }));
  [[430, 470], [488, 524], [542, 600], [618, 662]].forEach(([a, b], i) => D.trait(ligne(a, 63, b, 63), Object.assign({}, DET, { phase: ph, graine: 327 + i, wMax: 1 })));
  D.trait(ligne(380, 106, 698, 284), Object.assign({}, CONS, { phase: ph, graine: 332, op: .4 }));
  D.trait(ligne(698, 106, 380, 284), Object.assign({}, CONS, { phase: ph, graine: 333, op: .4 }));
  D.trait(ligne(44, 152, 340, 152), Object.assign({}, DET, { phase: ph, graine: 334, wMax: 2.6 }));
  D.trait(ligne(44, 180, 290, 180), Object.assign({}, DET, { phase: ph, graine: 335, wMax: 2.6 }));
  gribouillis(D, 92, 263, 200, 5, { phase: ph, wMin: .4, wMax: 1.1, op: .7, graine: 336 });
  /* H7 : au croquis aussi, le petit rond du logo dans le prompt */
  D.trait(arcE(63, 258, 9.5, 9.5, -.3, Math.PI * 2 - .1), Object.assign({}, DET, { phase: ph, graine: 337, wMax: 1.1 }));
  [0, 1, 2].forEach(i => { const x = 16 + i * 234; D.trait(ligne(x + 16, 330, x + 150, 330), Object.assign({}, DET, { phase: ph, graine: 340 + i, wMax: 1.8 })); gribouillis(D, x + 16, 356, 170, 4, { phase: ph, wMin: .35, wMax: 1, op: .6, graine: 344 + i }); D.trait(ligne(x + 16, 412, x + 80, 412), Object.assign({}, DET, { phase: ph, graine: 347 + i, wMax: 1.2 })); });
  hachures(D, [[722, 8], [732, 18], [732, 462], [12, 462], [2, 452], [722, 452]], { phase: ph, pas: 3.6, long: [10, 22], op: .4, graine: 363 });
  /* l'application : encoche, en-tête, rangées, barre d'onglets */
  const pa = 'app', ax = A.x, ay = A.y, aw = A.w, ah = A.h;
  D.trait(perimetre(ax + aw / 2 - 18, ay + 9, 36, 8, 4), Object.assign({}, DET, { phase: pa, graine: 370, wMax: 1.1 }));
  hachures(D, [[ax + 8, ay + 24], [ax + aw - 8, ay + 24], [ax + aw - 8, ay + 58], [ax + 8, ay + 58]], { phase: pa, pas: 2.8, long: [8, 18], op: .48, graine: 371, angle: -35 });
  [0, 1, 2, 3].forEach(i => { const y = ay + 82 + i * 38; D.trait(arcE(ax + 20, y, 8, 8, 0, Math.PI * 2.1), Object.assign({}, DET, { phase: pa, graine: 372 + i, wMax: 1.2 })); gribouillis(D, ax + 34, y + 2, aw - 48, 4, { phase: pa, wMin: .35, wMax: 1, op: .7, graine: 377 + i }); });
  D.trait([[ax + 8, ay + ah - 30], [ax + aw - 8, ay + ah - 30]], Object.assign({}, DET, { phase: pa, graine: 382, wMax: 1 }));
  [0, 1, 2, 3].forEach(i => D.trait(perimetre(ax + 18 + i * 28, ay + ah - 22, 10, 9, 2), Object.assign({}, DET, { phase: pa, graine: 383 + i, wMax: 1 })));
  /* H7 : le bouton d'assistant (le petit logo de Marianne), au croquis */
  D.trait(arcE(ax + aw - 21, ay + ah - 55, 9, 9, -.4, Math.PI * 2 - .2), Object.assign({}, DET, { phase: pa, graine: 387, wMax: 1 }));
  hachures(D, [[ax + aw + 2, ay + 10], [ax + aw + 11, ay + 20], [ax + aw + 11, ay + ah + 10], [ax + 12, ay + ah + 10], [ax + 2, ay + ah + 2], [ax + aw + 2, ay + ah + 2]], { phase: pa, pas: 3.4, long: [8, 18], op: .4, graine: 388 });
  /* F18 : la question manuscrite occupe le dessus du dessin ; la légende de la figure monte d'un cran */
  D.trait(ligne(4, -56, 716, -57), Object.assign({}, CONS, { phase: 'annot', graine: 390, op: .22 }));
  D.texte(0, -64, 'Fig. 3', { phase: 'annot', taille: 17, op: .66 });
  D.texte(720, -64, 'Votre idée', { phase: 'annot', taille: 13, ancre: 'end', op: .5 });
  D.planifier();
  return { D, morphes };
}

/* ---------------------------------------------------------------------
   Le site en couleurs (maquette A), bloc par bloc : k[i] de 0 à 1 pour
   chacun des huit blocs, révélés de gauche à droite.
   --------------------------------------------------------------------- */
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
/* H7 (huitième passe) : le huitième bloc n'est plus le logo rond qui flottait au milieu à droite (en partie sous
   l'application) ; c'est la surbrillance du prompt, que la pointe balaie en dernier */
export const BLOCS = [[0, 0, 720, 34], [0, 34, 720, 58], [16, 100, 688, 190], [44, 240, 274, 36], [16, 306, 220, 126], [250, 306, 220, 126], [484, 306, 220, 126], [36, 232, 290, 52]];
/* H7 : le petit logo de Marianne à contour doré (rond, le sceau), au centre (cx, cy), rayon r */
export function logoMarianne(g, sceau, cx, cy, r, ombre = true) {
  g.save();
  if (ombre) { g.shadowColor = 'rgba(0,0,40,.22)'; g.shadowBlur = r * .5; g.shadowOffsetY = r * .14; }
  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fillStyle = '#fbf8f1'; g.fill(); g.restore();
  if (sceau) { g.save(); g.beginPath(); g.arc(cx, cy, r - .6, 0, Math.PI * 2); g.clip(); g.drawImage(sceau, cx - r, cy - r, 2 * r, 2 * r); g.restore(); }
  g.save(); g.strokeStyle = '#F4A261'; g.lineWidth = Math.max(1, r * .14); g.beginPath(); g.arc(cx, cy, r - g.lineWidth * .3, 0, Math.PI * 2); g.stroke(); g.restore();
}
export function peindreSite(g, k, im) {
  const titre = 'Poppins, Inter, sans-serif', sans = 'Inter, sans-serif';
  const bloc = (i, f) => {
    const kk = clamp(k[i] || 0); if (kk <= 0) return;
    const [x, y, w, h] = BLOCS[i];
    g.save(); g.beginPath(); g.rect(x - 2, y - 2, (w + 4) * kk, h + 4); g.clip(); g.globalAlpha = .2 + .8 * kk; f(x, y, w, h); g.restore();
  };
  /* le fond de la fenêtre, discret, avec le premier bloc */
  if ((k[0] || 0) > 0) { g.save(); g.globalAlpha = .9 * clamp(k[0]); rr(g, 0, 0, 720, 450, 12); g.fillStyle = '#f7f4ed'; g.fill(); g.restore(); }
  bloc(0, (x, y, w, h) => {
    g.save(); rr(g, 0, 0, 720, 450, 12); g.clip();
    g.fillStyle = '#ebe5d8'; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(120,100,60,.18)'; g.fillRect(x, y + h - 1, w, 1);
    g.fillStyle = '#d6cdbb'; [20, 37, 54].forEach(cx => { g.beginPath(); g.arc(cx, 17, 5, 0, Math.PI * 2); g.fill(); });
    rr(g, 112, 8, 360, 18, 9); g.fillStyle = '#f8f5ee'; g.fill();
    g.fillStyle = '#7a7466'; g.font = `500 10.5px ${sans}`; g.textBaseline = 'middle'; g.fillText('villeneuve-les-ormes.fr', 124, 17.5);
    g.restore();
  });
  bloc(1, (x, y, w, h) => {
    g.fillStyle = '#fffdf8'; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(120,100,60,.12)'; g.fillRect(x, y + h - 1, w, 1);
    blason(g, 40, 64, 1);
    g.textBaseline = 'alphabetic'; g.fillStyle = '#000091'; g.font = `700 15.5px ${titre}`; g.fillText('Mairie de Villeneuve-les-Ormes', 70, 61);
    g.fillStyle = '#5a5a5a'; g.font = `500 10px ${sans}`; g.fillText('Site officiel de la commune', 70, 76);
    g.fillStyle = '#1E1E1E'; g.font = `600 11px ${sans}`; let nx = 698;
    ['Contact', 'Vie locale', 'Agenda', 'Démarches'].forEach(t => { const tw = g.measureText(t).width; nx -= tw; g.fillText(t, nx, 67); nx -= 16; });
  });
  bloc(2, (x, y, w, h) => {
    g.save(); rr(g, x, y, w, h, 12); g.clip();
    g.fillStyle = '#dfe7ee'; g.fillRect(x, y, w, h);
    if (im.village) { const iw = w * 2.5, ih = iw * im.village.naturalHeight / im.village.naturalWidth; g.drawImage(im.village, x + (w - iw) * .96, y + (h - ih) * .3, iw, ih); }
    const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, 'rgba(0,0,110,.88)'); gr.addColorStop(.46, 'rgba(0,0,110,.55)'); gr.addColorStop(.78, 'rgba(0,0,110,0)');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    g.fillStyle = '#fff'; g.font = `700 25px ${titre}`; g.textBaseline = 'alphabetic'; g.fillText('Bienvenue à', x + 28, y + 62); g.fillText('Villeneuve-les-Ormes', x + 28, y + 90);
    g.restore();
  });
  bloc(3, (x, y, w, h) => {
    g.save(); g.shadowColor = 'rgba(0,0,40,.25)'; g.shadowBlur = 16; g.shadowOffsetY = 6; rr(g, x, y, w, h, h / 2); g.fillStyle = '#f7f4ed'; g.fill(); g.restore();
    /* H7 : le logo de Marianne (le sceau rond, contour doré) prend place dans le prompt, à gauche du texte, petit */
    logoMarianne(g, im.sceau, x + 19, y + h / 2, 11.5, false);
    g.fillStyle = '#000091'; g.font = `700 12.5px ${sans}`; g.textBaseline = 'middle'; g.fillText('Poser une question à Marianne', x + 38, y + h / 2 + .5);
  });
  [['Démarches en ligne', 'État civil, urbanisme, inscriptions', 'Commencer'], ['Cantine et périscolaire', 'Menus, tarifs, portail famille', 'Consulter'], ['Agenda de la commune', 'Conseil municipal, marché, fêtes', "Voir l'agenda"]].forEach((c, i) => bloc(4 + i, (x, y, w, h) => {
    rr(g, x, y, w, h, 12); g.fillStyle = '#fffdf8'; g.fill(); g.strokeStyle = 'rgba(120,100,60,.2)'; g.lineWidth = 1; g.stroke();
    g.textBaseline = 'alphabetic'; g.fillStyle = '#000091'; g.font = `700 13.5px ${titre}`; g.fillText(c[0], x + 16, y + 30);
    g.fillStyle = '#5a5a5a'; g.font = `500 10.5px ${sans}`; g.fillText(c[1], x + 16, y + 50);
    g.fillStyle = '#0b6a62'; g.font = `700 10.5px ${sans}`; g.fillText(c[2], x + 16, y + h - 16);
  }));
  /* H7 : la surbrillance du prompt, posée en dernier : un halo bleu clair autour de la barre (fixe dans le papier ; la page
     y ajoute la respiration lente, voir atelier.js, poserHalo). Le logo rond qui flottait ici est retiré. */
  if ((k[7] || 0) > 0) {
    const kk = clamp(k[7]), [bx, by, bw, bh] = BLOCS[3];
    g.save(); g.globalAlpha = .55 * kk;
    for (let i = 3; i >= 1; i--) { g.save(); g.shadowColor = 'rgba(96,150,255,.55)'; g.shadowBlur = 7 * i; rr(g, bx, by, bw, bh, bh / 2); g.strokeStyle = `rgba(150,190,255,${(.22 / i).toFixed(3)})`; g.lineWidth = 2.4 * i; g.stroke(); g.restore(); }
    g.restore();
  }
}
/* F12 : le blason de la commune fictive, en couleurs : un écu bleu et or, une tour bleue sur l'or, trois ceps d'or
   sur le bleu ; sans texte (centre cx, cy ; échelle s, pour une hauteur de 40) */
export function blason(g, cx, cy, s = 1) {
  const BLEU = '#000091', OR = '#d6a937';
  g.save(); g.translate(cx, cy); g.scale(s, s); g.translate(-40, -64);
  const ecu = () => { g.beginPath(); g.moveTo(23, 45); g.lineTo(57, 45); g.lineTo(57, 63); g.bezierCurveTo(57, 74, 49, 81, 40, 85); g.bezierCurveTo(31, 81, 23, 74, 23, 63); g.closePath(); };
  g.save(); g.shadowColor = 'rgba(0,0,40,.18)'; g.shadowBlur = 3; g.shadowOffsetY = 1; ecu(); g.fillStyle = OR; g.fill(); g.restore();
  g.save(); ecu(); g.clip();
  g.fillStyle = BLEU; g.fillRect(20, 42, 40, 14);
  /* la tour, crénelée, sa porte */
  g.fillStyle = BLEU; g.beginPath(); g.moveTo(33, 81); g.lineTo(33, 66); g.lineTo(35, 66); g.lineTo(35, 63); g.lineTo(38, 63); g.lineTo(38, 66); g.lineTo(42, 66); g.lineTo(42, 63); g.lineTo(45, 63); g.lineTo(45, 66); g.lineTo(47, 66); g.lineTo(47, 81); g.closePath(); g.fill();
  g.fillStyle = OR; g.beginPath(); g.moveTo(38, 81); g.lineTo(38, 76); g.arc(40, 76, 2, Math.PI, 0); g.lineTo(42, 81); g.closePath(); g.fill();
  g.fillRect(39.2, 69, 1.6, 3);
  /* trois ceps : une grappe ronde et un sarment */
  [30, 40, 50].forEach(x => { g.fillStyle = OR; g.beginPath(); g.arc(x, 51.5, 2.3, 0, Math.PI * 2); g.fill(); g.strokeStyle = OR; g.lineWidth = .9; g.beginPath(); g.moveTo(x, 49.3); g.quadraticCurveTo(x + .6, 47.6, x + 2, 47.2); g.stroke(); });
  g.restore();
  ecu(); g.strokeStyle = 'rgba(0,0,80,.55)'; g.lineWidth = 1; g.stroke();
  g.restore();
}
/* l'application de club en couleurs, au format d'un téléphone */
export function peindreApp(g, k, im = {}) {
  k = clamp(k); if (k <= 0) return;
  const { x, y, w, h } = SITE.app, titre = 'Poppins, Inter, sans-serif', sans = 'Inter, sans-serif';
  g.save(); g.beginPath(); g.rect(x - 34, y - 34, (w + 80) * k, h + 84); g.clip(); g.globalAlpha = .2 + .8 * k;
  /* F13 : un petit téléphone posé devant la page : ombre portée douce vers le bas à droite (lumière du haut gauche),
     ombre de contact plus serrée, épaisseur du boîtier, arête claire en haut à gauche */
  g.save(); g.shadowColor = 'rgba(20,14,40,.34)'; g.shadowBlur = 22; g.shadowOffsetX = 7; g.shadowOffsetY = 12; rr(g, x, y, w, h, 18); g.fillStyle = '#1a1f3d'; g.fill(); g.restore();
  g.save(); g.shadowColor = 'rgba(10,8,20,.4)'; g.shadowBlur = 4; g.shadowOffsetX = 1.5; g.shadowOffsetY = 2.5; rr(g, x, y, w, h, 18); g.fillStyle = '#1a1f3d'; g.fill(); g.restore();
  rr(g, x + 1.5, y + 2.5, w, h, 18); g.fillStyle = '#0d1026'; g.fill();
  rr(g, x, y, w, h, 18); g.fillStyle = '#1a1f3d'; g.fill();
  g.save(); rr(g, x + .8, y + .8, w - 1.6, h - 1.6, 17.5); g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 1.2; g.setLineDash([w * 1.2, w * 4]); g.lineDashOffset = -w * .9; g.stroke(); g.restore();
  rr(g, x + 4, y + 4, w - 8, h - 8, 15); g.fillStyle = '#f7f4ed'; g.fill();
  g.save(); rr(g, x + 4, y + 4, w - 8, h - 8, 15); g.clip();
  g.fillStyle = '#0b6a62'; g.fillRect(x + 4, y + 4, w - 8, 58);
  g.fillStyle = '#1a1f3d'; rr(g, x + w / 2 - 17, y + 9, 34, 8, 4); g.fill();
  g.fillStyle = '#fff'; g.font = `700 14px ${titre}`; g.textBaseline = 'alphabetic'; g.fillText('Mon club', x + 14, y + 48);
  ['Entraînement', 'Match samedi', 'Cotisation', 'Covoiturage'].forEach((t, i) => {
    const yy = y + 72 + i * 38; rr(g, x + 10, yy, w - 20, 30, 8); g.fillStyle = '#fff'; g.fill();
    g.fillStyle = ['#F4A261', '#2EC4B6', '#000091', '#F4A261'][i]; g.beginPath(); g.arc(x + 22, yy + 15, 5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1E1E1E'; g.font = `600 9.5px ${sans}`; g.fillText(t, x + 33, yy + 18.5);
  });
  g.fillStyle = '#fffdf8'; g.fillRect(x + 4, y + h - 36, w - 8, 32); g.fillStyle = 'rgba(120,100,60,.2)'; g.fillRect(x + 4, y + h - 36, w - 8, 1);
  [0, 1, 2, 3].forEach(i => { g.fillStyle = i ? '#b8b1a2' : '#0b6a62'; rr(g, x + 18 + i * 28, y + h - 25, 11, 10, 3); g.fill(); });
  /* H7 : le petit logo de Marianne à contour doré, en bas à droite de l'écran, comme un bouton d'assistant, au-dessus de
     la barre d'onglets, sous la liste */
  logoMarianne(g, im.sceau, x + w - 21, y + h - 55, 10.5);
  /* le verre : un reflet très doux en biais */
  const rf = g.createLinearGradient(x, y, x + w, y + h * .6); rf.addColorStop(0, 'rgba(255,255,255,.16)'); rf.addColorStop(.35, 'rgba(255,255,255,0)'); g.fillStyle = rf; g.fillRect(x + 4, y + 4, w - 8, h - 8);
  g.restore(); g.restore();
}
