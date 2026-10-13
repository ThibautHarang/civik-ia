/* =====================================================================
   CO-5 et CO-9 (première passe Conseil, 06/10/2026) : la passerelle.
   Au bout du chemin de droite, le chemin arrive à un ruisseau ; une
   passerelle de bois se construit à la plume dans l'ordre d'un
   charpentier : les deux culées de pierre sur les berges, les deux
   poutres maîtresses, les planches du tablier une à une (de la berge où
   arrive le chemin à l'autre berge), les montants du garde-corps, la
   main courante et les croix du garde-corps, les hachures d'ombre sous
   le tablier.
   Le modèle est en mètres : x le long de la passerelle (0 sur la berge
   où arrive le chemin), y vers le haut (0 au niveau du sol), z vers le
   fond (0 sur l'axe). Une fonction de projection le pose à l'écran : la
   caméra de la scène (même point de fuite que le monde gravé) dans le
   croisement, une vue de trois quarts dans la frise du déroulé.
   Pas de transparence : chaque surface (culée, poutre, planche) a un
   fond de papier opaque sous l'encre, qui paraît quand son trait est
   tracé ; entre les planches et sous le tablier, on voit l'eau.
   Le ruisseau (peindreRuisseau) fait partie du monde gravé : il est
   peint au repos dans le canevas du paysage, avec ses pierres et ses
   herbes de berge.
   ===================================================================== */
import { Dessin, catmull, hachures, rng, clamp, lerp } from '../commun/pages/plume.js';

const NS = 'http://www.w3.org/2000/svg';
const ENCRE = '#16205C';
/* les mesures (m) : longueur, culées, lit, eau, flèche de l'arche, poutres, planches, garde-corps */
export const PASS = { L: 6.6, cw: .95, pz: .85, haut: .14, lit: -.62, eau: -.42, fleche: .38, hp: .22, ep: .08, dz: .7, zp: .58, pw: .2, jeu: .035, zm: .62, hm: .9, lisse: .45, montants: 7 };
/* l'ordre du charpentier, en fractions du geste (0 : rien ; 0,14 : les culées seules, l'état de repos ; 1 : tout) */
export const PHASES_P = { culees: [0, .14], poutreL: [.14, .21], poutre: [.2, .29], planches: [.28, .58], montants: [.56, .66], montantsL: [.63, .7], main: [.68, .8], mainL: [.76, .84], hach: [.82, .96] };
export const REPOS = .14;

const arche = (M, x) => M.fleche * Math.sin(Math.PI * clamp((x - M.cw) / (M.L - 2 * M.cw)));
const dessous = (M, x) => M.haut + arche(M, x);
const dessus = (M, x) => dessous(M, x) + M.hp;
const tablier = (M, x) => dessus(M, x) + M.ep;

export class Passerelle {
  /* parent : un élément SVG ; P(x, y, z) -> [x, y] écran ; o : { e (échelle des traits), papier, graine, pw, jeu, montants } */
  constructor(parent, P, o = {}) {
    this.P = P; this.o = o; this.M = Object.assign({}, PASS, o.modele || {});
    const e = this.e = clamp(o.e || 1, .45, 1.6);
    this.papier = o.papier || '#f5f1e6';
    this.racine = document.createElementNS(NS, 'g'); this.racine.setAttribute('class', 'passerelle-dessin'); parent.appendChild(this.racine);
    /* les couches, du fond vers l'avant (l'ordre du peintre) ; chaque couche : ses fonds de papier, puis son encre */
    this.couches = {};
    ['ombre', 'culees', 'loin', 'tablier', 'pres'].forEach(n => {
      const g = document.createElementNS(NS, 'g'), fonds = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'pc-' + n); g.appendChild(fonds); this.racine.appendChild(g);
      this.couches[n] = { g, fonds, D: new Dessin(g, ENCRE) };
    });
    this.fonds = []; this.lavisPolys = [];
    this.construire();
    Object.values(this.couches).forEach(c => c.D.monter());
    this.u = -1;
  }
  /* un trait à la plume, en mètres projetés */
  t(couche, pts3, opt) {
    const pts = pts3.map(p => this.P(p[0], p[1], p[2]));
    const e = this.e;
    return this.couches[couche].D.trait(pts, Object.assign({ tremble: .32 * e, wMin: .45 * e, wMax: 1.5 * e, op: .9, pas: clamp(1.6 * e, .8, 2.4), graine: 1 }, opt));
  }
  /* un fond de papier opaque sous l'encre, qui paraît quand le trait lié est tracé */
  fond(couche, pts3, traits, lavis) {
    const pts = pts3.map(p => this.P(p[0], p[1], p[2]));
    const el = document.createElementNS(NS, 'path');
    el.setAttribute('d', 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z');
    el.setAttribute('fill', this.papier); el.setAttribute('stroke', this.papier); el.setAttribute('stroke-width', '.6'); el.setAttribute('opacity', '0');
    this.couches[couche].fonds.appendChild(el);
    this.fonds.push({ el, traits: Array.isArray(traits) ? traits.filter(Boolean) : [traits], q: -1 });
    if (lavis) this.lavisPolys.push({ pts, couleur: lavis[0], a: lavis[1] });
    return el;
  }
  construire() {
    const M = this.M, e = this.e, R = rng(this.o.graine || 7);
    const { L, cw, pz, haut, lit, eau, dz, zp, zm, hm } = M;
    const pw = this.o.pw || M.pw, jeu = this.o.jeu || M.jeu;
    /* 1. les culées : la face avant, le dessus, la face intérieure (vers le ruisseau, côté de la caméra) ; les assises de pierre */
    [[0, cw, false], [L - cw, L, true]].forEach(([x0, x1, interieure], k) => {
      const bas = eau - .06;
      const avant = [[x0, haut, -pz], [x1, haut, -pz], [x1, bas, -pz], [x0, bas, -pz]];
      const dessusC = [[x0, haut, -pz], [x1, haut, -pz], [x1, haut, pz], [x0, haut, pz]];
      const T1 = this.t('culees', [[x0, bas, -pz], [x0, haut, -pz], [x1, haut, -pz], [x1, bas, -pz]], { phase: 'culees', graine: 10 + k * 7, wMax: 1.7 * e });
      const T2 = this.t('culees', [[x1, haut, -pz], [x1, haut, pz * .2], [x0 + (x1 - x0) * .2, haut, pz]], { phase: 'culees', graine: 11 + k * 7, wMax: 1.1 * e, op: .75 });
      const T3 = this.t('culees', [[x0, haut, -pz], [x0, haut, pz]], { phase: 'culees', graine: 12 + k * 7, wMax: 1.1 * e, op: .75 });
      let T4 = null;
      if (interieure) T4 = this.t('culees', [[x0, haut, pz], [x0, bas, pz]], { phase: 'culees', graine: 13 + k * 7, wMax: 1 * e, op: .7 });
      this.fond('culees', avant, [T1], ['#c3baa6', .9]);
      this.fond('culees', dessusC, [T2, T3], ['#d3cbb8', .8]);
      if (interieure) {
        this.fond('culees', [[x0, haut, -pz], [x0, haut, pz], [x0, bas, pz], [x0, bas, -pz]], [T4], ['#b1a893', .9]);
        /* la face qui regarde le ruisseau : ses assises aussi */
        for (let a = 1; a < 3; a++) { const y = haut - a * (haut - bas) / 3; this.t('culees', [[x0, y, -pz + .05], [x0, y + (R() - .5) * .03, pz - .05]], { phase: 'culees', graine: 40 + a, wMax: .8 * e, op: .6 }); }
      }
      /* les assises : deux joints horizontaux, des joints montants décalés d'une assise à l'autre */
      const n = 3, h = (haut - bas) / n;
      for (let a = 1; a < n; a++) { const y = haut - a * h + (R() - .5) * .03; this.t('culees', [[x0 + .02, y, -pz], [x1 - .02, y + (R() - .5) * .03, -pz]], { phase: 'culees', graine: 30 + k * 10 + a, wMax: .9 * e, op: .7, tremble: .4 * e }); }
      for (let a = 0; a < n; a++) {
        const y1 = haut - a * h, y2 = y1 - h, decal = a % 2 ? .5 : .25;
        for (let xx = x0 + (x1 - x0) * decal; xx < x1 - .1; xx += (x1 - x0) * .5) this.t('culees', [[xx, y1 - .02, -pz], [xx + (R() - .5) * .04, y2 + .02, -pz]], { phase: 'culees', graine: 50 + k * 10 + a * 3 + Math.round(xx * 10), wMax: .8 * e, op: .65 });
      }
    });
    /* 2. les deux poutres maîtresses (la lointaine d'abord), posées sur les culées, en arc léger */
    const xs = []; for (let x = .06; x <= L - .06 + 1e-6; x += .2) xs.push(x); if (xs[xs.length - 1] < L - .06) xs.push(L - .06);
    [['loin', 'poutreL', zp - .16, .7], ['pres', 'poutre', -zp, .92]].forEach(([couche, phase, z, op], k) => {
      const basP = xs.map(x => [x, dessous(M, x), z]), hautP = xs.map(x => [x, dessus(M, x), z]);
      const A = this.t(couche, basP, { phase, graine: 70 + k, wMax: 1.6 * e, op });
      const B = this.t(couche, hautP, { phase, graine: 72 + k, wMax: 1.4 * e, op });
      const C = this.t(couche, [hautP[0], basP[0]], { phase, graine: 74 + k, wMax: 1.1 * e, op });
      const D = this.t(couche, [hautP[hautP.length - 1], basP[basP.length - 1]], { phase, graine: 76 + k, wMax: 1.1 * e, op });
      this.fond(couche, hautP.concat(basP.slice().reverse()), [A, B, C, D], ['#a77a4c', .85]);
    });
    /* 3. les planches du tablier, une à une, de la berge où arrive le chemin vers l'autre : on voit leur bout, qui dépasse
       de la poutre, et le joint qui part vers le fond */
    for (let x = .1, i = 0; x + pw <= L - .1 + 1e-6; x += pw + jeu, i++) {
      const yt = tablier(M, x + pw / 2), yb = yt - M.ep;
      const NL = [x, yt, -dz], NR = [x + pw, yt, -dz], FL = [x, yt, dz], FR = [x + pw, yt, dz], NLb = [x, yb, -dz], NRb = [x + pw, yb, -dz];
      const T = this.t('tablier', [NLb, NL, NR, NRb, NLb], { phase: 'planches', graine: 100 + i, wMax: .95 * e, wMin: .35 * e, op: .82, levee: 3, tremble: .2 * e });
      this.t('tablier', [NL, [x, yt, -dz + 2 * dz * (.35 + .25 * R())]], { phase: 'planches', graine: 160 + i, wMax: .6 * e, wMin: .3 * e, op: .5, levee: 1 });
      this.fond('tablier', [NLb, NRb, NR, FR, FL, NL], [T], [i % 3 ? '#d5ad72' : '#cda268', .8]);
    }
    /* 4. les montants du garde-corps (de près, puis de loin), 5. la main courante et les croix */
    const xm = []; for (let k = 0; k < M.montants; k++) xm.push(.25 + k * (L - .5) / (M.montants - 1));
    /* les montants : un trait de plume (plein, délié), un peu de biais, le garde-corps du fond plus pâle */
    const opLoin = this.o.opLoin || .4;
    [['pres', 'montants', -zm, .9, 1.9], ['loin', 'montantsL', zm, opLoin, 1.2]].forEach(([couche, phase, z, op, w], j) => {
      xm.forEach((x, k) => { const y0 = tablier(M, x) - (j ? 0 : .05); this.t(couche, [[x + (R() - .5) * .02, y0, z], [x + (R() - .5) * .04, y0 + hm + .04, z]], { phase, graine: 140 + j * 20 + k, wMin: .7 * e, wMax: w * e, op, tremble: .3 * e }); if (!j) this.lavisPolys.push({ ligne: [this.P(x, y0, z), this.P(x, y0 + hm, z)], couleur: '#97704a', a: .8, l: w * e * 1.5 }); });
    });
    const xr = []; for (let x = xm[0] - .1; x <= xm[xm.length - 1] + .1 + 1e-6; x += .25) xr.push(x); xr.push(xm[xm.length - 1] + .1);
    [['pres', 'main', -zm, .9, 2], ['loin', 'mainL', zm, opLoin, 1.3]].forEach(([couche, phase, z, op, w], j) => {
      const main = xr.map(x => [x, tablier(M, x) + hm, z]);
      this.t(couche, main, { phase, graine: 180 + j, wMin: .7 * e, wMax: w * e, op, tremble: .3 * e });
      if (!j) {
        /* les croix de Saint-André du garde-corps, une par travée (le dessin d'une passerelle de bois) */
        for (let k = 0; k < xm.length - 1; k++) {
          const a = xm[k] + .05, b = xm[k + 1] - .05, ya = tablier(M, a) + .1, yb = tablier(M, b) + .1, ha = tablier(M, a) + hm - .1, hb = tablier(M, b) + hm - .1;
          this.t(couche, [[a, ya, z], [b, hb, z]], { phase, graine: 190 + k * 2, wMin: .4 * e, wMax: 1.05 * e, op: .7, tremble: .3 * e, levee: 2 });
          this.t(couche, [[a, ha, z], [b, yb, z]], { phase, graine: 191 + k * 2, wMin: .4 * e, wMax: 1.05 * e, op: .7, tremble: .3 * e, levee: 2 });
        }
        this.lavisPolys.push({ ligne: main.map(p => this.P(...p)), couleur: '#97704a', a: .75, l: w * e * 1.6 });
      }
    });
    /* 6. les hachures d'ombre sous le tablier (sur l'eau et contre les culées), et le fil du bois des poutres */
    const sousP = []; for (let x = cw; x <= L - cw + 1e-6; x += .2) sousP.push(this.P(x, dessous(M, x) - .02, -zp));
    const sousE = []; for (let x = L - cw; x >= cw - 1e-6; x -= .2) sousE.push(this.P(x, eau + .02 + .12 * Math.sin(Math.PI * (x - cw) / (L - 2 * cw)), -zp));
    /* à petite échelle (la frise), les hachures gardent un pas lisible : jamais plus serrées que 2,4 px */
    const pasH = Math.max(2.4, 2.6 * e), longH = [Math.max(4, 5 * e), Math.max(7, 11 * e)];
    hachures(this.couches.ombre.D, sousP.concat(sousE), { phase: 'hach', pas: pasH * (e < .9 ? 1.25 : 1), long: longH, op: e < .9 ? .38 : .5, graine: 201, angle: -58, wMax: Math.max(.7, 1 * e) });
    [[cw - .02, 'g'], [L - cw + .02, 'd']].forEach(([x], k) => {
      const q = [this.P(x - (k ? 0 : .5), haut - .02, -pz), this.P(x + (k ? .5 : 0), haut - .02, -pz), this.P(x + (k ? .5 : 0), eau, -pz), this.P(x - (k ? 0 : .5), eau, -pz)];
      if (e >= .9) hachures(this.couches.culees.D, q, { phase: 'hach', pas: 2.4 * e, long: [4 * e, 9 * e], op: .42, graine: 210 + k, angle: 80, wMax: .9 * e });
    });
    for (let k = 0; k < 2; k++) { const f = .35 + k * .3; this.t('pres', xs.filter((x, i) => i % 2 === 0).map(x => [x, lerp(dessous(M, x), dessus(M, x), f), -zp]), { phase: 'hach', graine: 220 + k, wMin: .3 * e, wMax: .7 * e, op: .38, tremble: .5 * e }); }
  }
  /* u de 0 à 1 : les phases du charpentier ; les fonds de papier suivent leurs traits */
  rendre(u) {
    if (u === this.u) return; this.u = u;
    const prog = phasesDe(u);
    Object.values(this.couches).forEach(c => c.D.rendre(prog));
    for (const f of this.fonds) {
      let q = 0;
      for (const T of f.traits) { if (T.t1 === undefined) continue; const v = prog[T.phase] || 0; q = Math.max(q, clamp((v - T.t0) / Math.max(1e-6, T.t1 - T.t0))); }
      const op = clamp((q - .2) / .55);
      if (Math.abs(op - f.q) > .004) { f.q = op; f.el.setAttribute('opacity', op.toFixed(3)); }
    }
  }
  /* le lavis, peint une fois dans un canevas (coordonnées de l'écran) : pierre, bois, planches */
  peindreLavis(g, graine = 5) {
    const r = rng(graine);
    for (const p of this.lavisPolys) {
      g.save();
      if (p.pts) {
        g.beginPath(); p.pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
        g.globalAlpha = p.a * .7; g.fillStyle = p.couleur; g.fill();
        g.clip(); const bx = p.pts.reduce((a, q) => [Math.min(a[0], q[0]), Math.min(a[1], q[1]), Math.max(a[2], q[0]), Math.max(a[3], q[1])], [1e9, 1e9, -1e9, -1e9]);
        for (let i = 0; i < 4; i++) { const x = lerp(bx[0], bx[2], r()), y = lerp(bx[1], bx[3], r()), rr = 2 + r() * Math.max(4, (bx[2] - bx[0]) * .3); const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, p.couleur); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.globalAlpha = p.a * .35 * r(); g.fillStyle = gr; g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr); }
      } else if (p.ligne) {
        g.globalAlpha = p.a * .8; g.strokeStyle = p.couleur; g.lineWidth = p.l; g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath(); p.ligne.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
      }
      g.restore();
    }
  }
  /* la boîte de la passerelle à l'écran */
  boite() {
    const M = this.M, pts = [];
    [[0, M.lit, -M.pz], [M.L, M.lit, -M.pz], [0, tablier(M, 0) + M.hm, M.pz], [M.L, tablier(M, M.L) + M.hm, M.pz], [M.L / 2, tablier(M, M.L / 2) + M.hm, -M.zm], [M.L / 2, M.lit, -M.pz], [0, M.haut, M.pz], [M.L, M.haut, M.pz]].forEach(p => pts.push(this.P(...p)));
    return pts.reduce((a, q) => [Math.min(a[0], q[0]), Math.min(a[1], q[1]), Math.max(a[2], q[0]), Math.max(a[3], q[1])], [1e9, 1e9, -1e9, -1e9]);
  }
}
export function phasesDe(u) { const prog = {}; for (const k in PHASES_P) { const [a, b] = PHASES_P[k]; prog[k] = clamp((u - a) / (b - a)); } return prog; }

/* ---------------------------------------------------------------------
   Le ruisseau, peint au repos dans le monde gravé (CO-5, point 2) : le lit
   passe sous la passerelle, vient vers nous et se perd au fond. P : la
   même projection que la passerelle ; o : { encre(a), sol(g), W, H, echelle(z) }.
   Renvoie le polygone du ruisseau et de ses berges (à garder libre).
   --------------------------------------------------------------------- */
export function peindreRuisseau(g, P, o) {
  const M = PASS, R = rng(o.graine || 61), encre = o.encre;
  /* R5 (finitions du 07/10/2026) : presence (1 par défaut) relève l'encre de l'eau et des berges ; au-dessus de 1, quelques
     traits de courant s'ajoutent le long du lit (un tirage à part : les pierres et les herbes restent à leur place) */
  const pr = o.presence || 1;
  const zN = o.zPres, zF = o.zLoin;
  const zs = []; for (let z = zN; z <= zF; z += z < -2 || z > 2 ? Math.max(.25, Math.abs(z) * .06) : .2) zs.push(z);
  const meandre = z => { const a = Math.abs(z); return a < 1.3 ? 0 : (z < 0 ? 1.5 * Math.sin(-z * .2 + .2) + .4 * Math.sin(-z * .5) : .55 * Math.sin(z * .21 + .4) + .25 * Math.sin(z * .07)) * clamp((a - 1.3) / 4); };
  /* derrière la passerelle, le ruisseau s'efface en s'éloignant */
  const fondu = z => z <= 2 ? 1 : clamp(1 - (z - 2) / Math.max(1, zF - 2));
  /* des berges de terre, pas un canal : le bord de l'eau et le haut de la berge ondulent, irrégulièrement */
  const ond = (z, a) => .14 * Math.sin(z * 1.7 + a) + .09 * Math.sin(z * 3.3 + 2 * a) + .05 * Math.sin(z * 6.1 + a);
  const xL = z => M.cw + .04 + meandre(z) + (Math.abs(z) > M.pz + .2 ? ond(z, .3) : 0), xR = z => M.L - M.cw - .04 + meandre(z) + (Math.abs(z) > M.pz + .2 ? ond(z, 1.9) : 0);
  const xLt = z => xL(z) - .55 - .2 * Math.sin(z * .9) - .1 * Math.sin(z * 2.3), xRt = z => xR(z) + .55 + .2 * Math.sin(z * .8 + 1) + .1 * Math.sin(z * 2.1 + 3);
  const bordG = zs.map(z => P(xLt(z), 0, z)), bordD = zs.map(z => P(xRt(z), 0, z));
  const eauG = zs.map(z => P(xL(z), M.eau, z)), eauD = zs.map(z => P(xR(z), M.eau, z));
  const poly = bordG.concat(bordD.slice().reverse());
  const ligneDe = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); };
  /* 1. la place : le sol repeint par-dessus les rangs et le pré */
  g.save(); ligneDe(poly); g.closePath(); g.fillStyle = o.sol; g.fill(); g.restore();
  /* 2. l'eau : un voile gris bleu très léger, puis des rides gravées, plus serrées à l'ombre de la passerelle */
  g.save(); ligneDe(eauG.concat(eauD.slice().reverse())); g.closePath(); g.fillStyle = `rgba(132,150,170,${(.13 * Math.min(1.4, pr)).toFixed(3)})`; g.fill(); g.clip();
  g.lineCap = 'round';
  /* quelques traits d'eau : courts, un peu courbes, plus serrés à l'ombre de la passerelle, du papier laissé pour le reflet */
  for (let i = 0; i < zs.length - 1; i++) {
    const z = zs[i], k = o.echelle(z), n = Math.max(1, Math.round((xR(z) - xL(z)) * .9));
    const sous = Math.abs(z) < M.pz + .1 ? 1 : 0;
    for (let j = 0; j < n + sous * 3; j++) {
      if (R() < (sous ? .25 : .55)) continue;
      const t = R(), x = lerp(xL(z), xR(z), t), l = (.18 + R() * .42) * (sous ? 1.5 : 1) * (t > .25 && t < .6 && !sous ? .6 : 1);
      const a = P(x, M.eau, z), b = P(x + l, M.eau, z + (R() - .5) * .06);
      g.strokeStyle = encre(clamp((.2 + .3 * k + sous * .16) * pr, 0, .8) * fondu(z)); g.lineWidth = clamp(.35 + .8 * k, .35, 1.5);
      g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + (R() - .3) * 1.4, b[0], b[1]); g.stroke();
    }
  }
  /* R5 : les traits de courant, longs et fins, qui suivent le lit (le ruisseau se lit comme de l'eau qui coule, vers nous) */
  if (pr > 1) {
    const Rc = rng((o.graine || 61) + 400);
    [.28, .47, .66, .82].forEach((t0, n) => {
      for (let i = 0; i < zs.length - 1; i++) {
        const z = zs[i], z2 = zs[i + 1], k = o.echelle(z); if (Rc() < .42) continue;
        const t = t0 + .05 * Math.sin(z * .9 + n), a = P(lerp(xL(z), xR(z), t), M.eau, z), b = P(lerp(xL(z2), xR(z2), t + .02 * (Rc() - .5)), M.eau, z2);
        g.strokeStyle = encre(clamp((.12 + .26 * k) * (pr - .4), 0, .6) * fondu(z)); g.lineWidth = clamp(.3 + .7 * k, .3, 1.3);
        g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
      }
    });
  }
  g.restore();
  /* 3. les berges : la pente gravée (traits du haut vers l'eau), le bord du pré et le bord de l'eau à la plume */
  g.save(); g.lineCap = 'round';
  [[xLt, xL, 1], [xRt, xR, -1]].forEach(([haut, bas, s], c) => {
    for (let i = 0; i < zs.length; i++) for (let rep = 0; rep < 2; rep++) {
      const z = zs[i] + rep * .08, k = o.echelle(z); if (R() < .3) continue;
      const a = P(haut(z) + s * R() * .1, 0, z), b = P(bas(z) - s * .05, M.eau + .05, z + (R() - .5) * .15);
      g.strokeStyle = encre(Math.min(.75, (.16 + .3 * k) * pr) * fondu(z)); g.lineWidth = clamp(.3 + .7 * k, .3, 1.3);
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(lerp(a[0], b[0], .55 + R() * .45), lerp(a[1], b[1], .55 + R() * .45)); g.stroke();
    }
    const tracer = (pts, a0, w0) => { for (let i = 0; i < pts.length - 1; i++) { const k = o.echelle(zs[i]); if (R() < .12) continue; g.strokeStyle = encre((a0 + .35 * k) * fondu(zs[i])); g.lineWidth = clamp(w0 + 1.1 * k, .3, 2); g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[i + 1][0] + (R() - .5), pts[i + 1][1] + (R() - .5) * .6); g.stroke(); } };
    tracer(c ? bordD : bordG, .14 * pr, .3); tracer(c ? eauD : eauG, .26 * pr, .45);   /* R5 : presence */
  });
  /* 4. des pierres au bord de l'eau, plus nombreuses près de la passerelle, et 5. des touffes d'herbe de berge */
  for (let i = 0; i < 26; i++) {
    const z = clamp((R() - .5) * 2, -1, 1) * (R() < .6 ? 4 : 12), cote = R() < .5, k = o.echelle(z);
    if (Math.abs(z) < M.pz + .2) continue;
    const x = cote ? xL(z) - R() * .3 : xR(z) + R() * .3, [px, py] = P(x, M.eau + .03, z), rx = clamp((.12 + R() * .2) * k * 18, 1.2, 9), ry = rx * (.55 + R() * .2);
    g.fillStyle = 'rgba(247,244,237,.95)'; g.strokeStyle = encre(.35 + .3 * k); g.lineWidth = clamp(.4 + .6 * k, .4, 1.2);
    g.beginPath(); g.ellipse(px, py - ry * .6, rx, ry, (R() - .5) * .5, 0, Math.PI * 2); g.fill(); g.stroke();
    g.strokeStyle = encre(.25 + .2 * k); g.lineWidth = clamp(.3 + .4 * k, .3, .9);
    for (let h = 0; h < 3; h++) { g.beginPath(); g.moveTo(px + rx * (.1 + h * .25), py - ry * .1); g.lineTo(px + rx * (.35 + h * .25), py - ry * .9); g.stroke(); }
  }
  for (let i = 0; i < 70; i++) {
    const z = (R() - .5) * 2 * (R() < .55 ? 5 : 14), cote = R() < .5, k = o.echelle(z) * fondu(z);
    if (k < .05) continue;
    if (Math.abs(z) < M.pz + .1 && R() < .7) continue;
    const x = cote ? xLt(z) + R() * .25 : xRt(z) - R() * .25, [px, py] = P(x, 0, z), h = clamp((.35 + R() * .45) * k * 26, 3, 22);
    g.strokeStyle = encre(.22 + .32 * k); g.lineWidth = clamp(.3 + .6 * k, .3, 1.1);
    for (let b = 0; b < 5; b++) { const pen = (R() - .5) * .9; g.beginPath(); g.moveTo(px + (R() - .5) * h * .3, py); g.quadraticCurveTo(px + pen * h * .2, py - h * .6, px + pen * h * .55, py - h * (.75 + R() * .3)); g.stroke(); }
  }
  g.restore();
  return { poly, eau: eauG.concat(eauD.slice().reverse()) };
}
