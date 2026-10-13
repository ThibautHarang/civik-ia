/* =====================================================================
   L'atelier provisoire (plan 6, précisé par Thibaut le 02/10/2026) :
   une vieille table d'architecte en chêne sur tréteaux, planche redressée
   face au visiteur, règle profonde, encrier de laiton et porte-plume.
   Deux images : la table en entier (atelier-table), puis la même planche
   de près (atelier-planche). Le mot « Civik-ia » entaillé au couteau est
   gravé dans la page (gravureCivikia), à la place que donne le manifeste.
   ===================================================================== */
import { GEO } from '../visuels.js';
import { rng, bruit2, clamp, lerp } from '../outils.js';
import { canevas, rr } from './reel.js';

const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/* le chêne de la planche : miel pâle, fil horizontal, rayures, taches d'encre */
let CHENE = null;
function chene() {
  if (CHENE) return CHENE;
  const tw = 1700, th = 860, c = canevas(tw, th), g = c.getContext('2d'), R = rng(211), N = bruit2(213), N2 = bruit2(217);
  const im = g.createImageData(tw, th), d = im.data;
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    const lame = Math.floor(y / 172), oy = lame * 13.7;
    const onde = N(x * .0016, oy) * 24 + N2(x * .006, oy + 5) * 4;
    const v = (y - lame * 172 + onde) * .062 + N(x * .0011, oy + 11) * 2.2;
    const s = Math.abs(Math.sin(v * Math.PI + N2(x * .009, y * .05) * 1.1));
    const veine = Math.pow(1 - s, 9) * .7 + Math.pow(1 - s, 3) * .14;
    const fibre = N2(x * .005 + 40, y * .35) * .36 + N(x * .045, y * .8) * .12;
    const pore = N2(x * .14, y * 2.1) > .9 ? .1 : 0;
    const joint = (y % 172) < 1.3 ? .3 : 0;
    const t = clamp(.1 + veine * .42 + fibre * .3 + pore + joint + ((lame * 37) % 5) * .018);
    const col = mix([228, 194, 140], [168, 122, 72], t);
    const i4 = (y * tw + x) * 4; d[i4] = col[0]; d[i4 + 1] = col[1]; d[i4 + 2] = col[2]; d[i4 + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  /* rayures, traces de crayon effacées, petites taches d'encre anciennes, patine des bords */
  for (let i = 0; i < 320; i++) { const x = R() * tw, y = R() * th, l = 18 + R() * 140, a = (R() - .5) * .35; g.strokeStyle = `rgba(255,240,210,${.07 + R() * .12})`; g.lineWidth = .7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  for (let i = 0; i < 26; i++) { const x = R() * tw, y = R() * th, l = 30 + R() * 90, a = (R() - .5) * 1.4; g.strokeStyle = `rgba(80,76,82,${.05 + R() * .07})`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  for (let i = 0; i < 9; i++) { const x = R() * tw, y = R() * th, r = 3 + R() * 9; const gg = g.createRadialGradient(x, y, 0, x, y, r * 2.2); gg.addColorStop(0, 'rgba(30,26,50,.22)'); gg.addColorStop(.5, 'rgba(30,26,50,.1)'); gg.addColorStop(1, 'rgba(30,26,50,0)'); g.fillStyle = gg; g.beginPath(); g.arc(x, y, r * 2.2, 0, Math.PI * 2); g.fill(); }
  const gp = g.createRadialGradient(tw * .45, th * .42, th * .3, tw * .5, th * .5, tw * .62); gp.addColorStop(0, 'rgba(0,0,0,0)'); gp.addColorStop(1, 'rgba(70,40,12,.28)');
  g.fillStyle = gp; g.fillRect(0, 0, tw, th);
  /* lumière du matin, venue de la gauche, égale sur la face */
  const gl = g.createLinearGradient(0, 0, tw, 0); gl.addColorStop(0, 'rgba(255,244,222,.16)'); gl.addColorStop(1, 'rgba(40,24,8,.10)');
  g.fillStyle = gl; g.fillRect(0, 0, tw, th);
  CHENE = c; return c;
}

/* encrier de laiton encastré et porte-plume dans sa rainure (coordonnées de l'image) */
function encrierEtPlume(g, ex, ey, k, rainure) {
  /* rainure le long du bord haut */
  const [rx0, rx1, ry] = rainure;
  g.fillStyle = 'rgba(60,36,14,.55)'; rr(g, rx0, ry - 7 * k, rx1 - rx0, 14 * k, 7 * k); g.fill();
  g.fillStyle = 'rgba(255,236,200,.35)'; g.fillRect(rx0 + 6 * k, ry + 6 * k, rx1 - rx0 - 12 * k, 1.5 * k);
  /* porte-plume : manche de bois sombre, virole, plume d'acier pointée à gauche */
  const py = ry - 1 * k;
  const gm = g.createLinearGradient(0, py - 5 * k, 0, py + 5 * k); gm.addColorStop(0, '#7a4a2a'); gm.addColorStop(.5, '#4a2a14'); gm.addColorStop(1, '#2a160a');
  g.fillStyle = gm; rr(g, rx0 + 50 * k, py - 4.5 * k, rx1 - rx0 - 70 * k, 9 * k, 4.5 * k); g.fill();
  const gv = g.createLinearGradient(0, py - 5 * k, 0, py + 5 * k); gv.addColorStop(0, '#f1e3b0'); gv.addColorStop(.5, '#b8963a'); gv.addColorStop(1, '#6e5418');
  g.fillStyle = gv; g.fillRect(rx0 + 34 * k, py - 4 * k, 18 * k, 8 * k);
  g.fillStyle = '#c9ccd2'; g.beginPath(); g.moveTo(rx0 + 8 * k, py); g.lineTo(rx0 + 35 * k, py - 3.5 * k); g.lineTo(rx0 + 35 * k, py + 3.5 * k); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(40,40,46,.7)'; g.lineWidth = .8 * k; g.beginPath(); g.moveTo(rx0 + 10 * k, py); g.lineTo(rx0 + 30 * k, py); g.stroke();
  /* encrier : bague de laiton, encre noire, reflet */
  g.fillStyle = 'rgba(40,22,8,.5)'; g.beginPath(); g.arc(ex + 2 * k, ey + 3 * k, 42 * k, 0, Math.PI * 2); g.fill();
  const gb = g.createRadialGradient(ex - 14 * k, ey - 16 * k, 4 * k, ex, ey, 42 * k);
  gb.addColorStop(0, '#fff3c4'); gb.addColorStop(.35, '#d9b354'); gb.addColorStop(.75, '#9a7524'); gb.addColorStop(1, '#5e4512');
  g.fillStyle = gb; g.beginPath(); g.arc(ex, ey, 40 * k, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(60,40,10,.6)'; g.lineWidth = 1.2 * k; g.beginPath(); g.arc(ex, ey, 31 * k, 0, Math.PI * 2); g.stroke();
  const gi = g.createRadialGradient(ex - 6 * k, ey - 6 * k, 1, ex, ey, 26 * k); gi.addColorStop(0, '#2a2c3a'); gi.addColorStop(1, '#06060a');
  g.fillStyle = gi; g.beginPath(); g.arc(ex, ey, 25 * k, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(ex - 9 * k, ey - 10 * k, 7 * k, 3 * k, -.6, 0, Math.PI * 2); g.fill();
}

/* la face de la planche posée dans un rectangle, avec chants, règle profonde, encrier */
function face(g, x0, y0, x1, y1, k) {
  const W = x1 - x0, H = y1 - y0;
  /* ombre portée de la planche vers la droite */
  g.fillStyle = 'rgba(30,18,6,.28)'; g.fillRect(x1, y0 + 18 * k, 22 * k, H + 20 * k);
  g.drawImage(chene(), x0, y0, W, H);
  /* chants : arête haute claire, côté droit dans l'ombre */
  g.fillStyle = 'rgba(255,244,220,.75)'; g.fillRect(x0, y0, W, 2.2 * k);
  g.fillStyle = 'rgba(70,44,18,.5)'; g.fillRect(x1 - 5 * k, y0, 5 * k, H);
  g.fillStyle = 'rgba(255,240,210,.35)'; g.fillRect(x0, y0, 3 * k, H);
  /* encrier en haut à droite, porte-plume dans sa rainure */
  encrierEtPlume(g, x1 - 108 * k, y0 + 82 * k, k, [x1 - 380 * k, x1 - 170 * k, y0 + 34 * k]);
}
/* la règle profonde le long du bas, avec sa lèvre */
function regle(g, x0, x1, yb, k) {
  const gt = g.createLinearGradient(0, yb, 0, yb + 22 * k); gt.addColorStop(0, '#6e4a24'); gt.addColorStop(.4, '#b98d55'); gt.addColorStop(1, '#d6ae74');
  g.fillStyle = gt; g.fillRect(x0 - 10 * k, yb, x1 - x0 + 20 * k, 22 * k);
  const gl = g.createLinearGradient(0, yb + 20 * k, 0, yb + 76 * k); gl.addColorStop(0, '#f0cf98'); gl.addColorStop(.12, '#c99a5c'); gl.addColorStop(.7, '#9a6c38'); gl.addColorStop(1, '#6a4720');
  g.fillStyle = gl; rr(g, x0 - 16 * k, yb + 20 * k, x1 - x0 + 32 * k, 56 * k, 6 * k); g.fill();
  g.fillStyle = 'rgba(255,246,226,.7)'; g.fillRect(x0 - 12 * k, yb + 21 * k, x1 - x0 + 24 * k, 2 * k);
  const R = rng(229);
  for (let i = 0; i < 60; i++) { const x = lerp(x0, x1, R()), y = yb + (26 + R() * 44) * k; g.strokeStyle = 'rgba(90,58,26,.22)'; g.lineWidth = .9 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (40 + R() * 120) * k, y + (R() - .5) * 4 * k); g.stroke(); }
}

/* ---------------------------------------------------------------------
   La table vue en entier, depuis l'entrée
   --------------------------------------------------------------------- */
export function atelierTable() {
  const G = GEO['atelier-table'], W = G.w, H = G.h, c = canevas(W, H), g = c.getContext('2d');
  const R = rng(241), N = bruit2(243);
  /* le mur de chaux */
  const gm = g.createLinearGradient(0, 0, 0, 760); gm.addColorStop(0, '#efe9dc'); gm.addColorStop(1, '#ddd3c0');
  g.fillStyle = gm; g.fillRect(0, 0, W, 760);
  { const im = g.getImageData(0, 0, W, 760), d = im.data; for (let y = 0; y < 760; y += 1) for (let x = 0; x < W; x += 1) { const n = (N(x * .012, y * .012) - .5) * 14 + (N(x * .06, y * .06) - .5) * 5; const i4 = (y * W + x) * 4; d[i4] += n; d[i4 + 1] += n; d[i4 + 2] += n * .9; } g.putImageData(im, 0, 0); }
  /* la grande fenêtre d'atelier, au fond à gauche, floue */
  {
    const b = canevas(W, 760), bg = b.getContext('2d');
    const fx0 = 120, fx1 = 760, fy0 = 40, fy1 = 640;
    const gc = bg.createLinearGradient(fx0, fy0, fx1, fy1); gc.addColorStop(0, '#fff3dc'); gc.addColorStop(.6, '#eef0ea'); gc.addColorStop(1, '#dfe6ea');
    bg.fillStyle = gc; bg.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0);
    const colline = (yb, amp, f, ph, col) => { bg.fillStyle = col; bg.beginPath(); bg.moveTo(fx0, fy1); for (let x = fx0; x <= fx1; x += 16) bg.lineTo(x, yb - amp * (.5 + .5 * Math.sin(x * f + ph))); bg.lineTo(fx1, fy1); bg.closePath(); bg.fill(); };
    colline(380, 90, .006, 1.1, 'rgba(178,188,198,.8)'); colline(450, 60, .009, 2.6, 'rgba(150,160,140,.85)'); colline(520, 40, .014, .3, 'rgba(120,128,100,.9)');
    for (let k = 0; k < 10; k++) { bg.strokeStyle = 'rgba(90,100,64,.35)'; bg.lineWidth = 4; bg.beginPath(); bg.moveTo(fx0, 520 + k * 12); bg.lineTo(fx1, 505 + k * 13); bg.stroke(); }
    const nc = 4, nr = 6, cw = (fx1 - fx0) / nc, rh = (fy1 - fy0) / nr;
    bg.fillStyle = '#15161a';
    for (let i = 0; i <= nc; i++) bg.fillRect(fx0 + i * cw - 6, fy0, 12, fy1 - fy0);
    for (let j = 0; j <= nr; j++) bg.fillRect(fx0, fy0 + j * rh - 5, fx1 - fx0, 10);
    for (let i = 0; i < nc; i++) for (let j = 0; j < nr; j++) { bg.fillStyle = `rgba(255,255,255,${.04 + R() * .08})`; bg.fillRect(fx0 + i * cw + 6, fy0 + j * rh + 5, cw * .5, rh - 10); }
    bg.fillStyle = '#cdbfa6'; bg.fillRect(fx0 - 26, fy1, fx1 - fx0 + 52, 28);
    /* tabouret et panier de rouleaux, au fond à droite */
    bg.fillStyle = '#7a5a36'; bg.fillRect(1560, 560, 150, 18); bg.fillRect(1572, 578, 12, 180); bg.fillRect(1686, 578, 12, 180); bg.fillRect(1620, 578, 10, 160);
    bg.fillStyle = '#8f7650'; rr(bg, 1740, 470, 110, 290, 14); bg.fill();
    for (let i = 0; i < 7; i++) { bg.fillStyle = i % 2 ? '#f2ead8' : '#e6dcc4'; bg.fillRect(1752 + i * 13, 330 + (i % 3) * 30, 11, 160); }
    g.save(); g.filter = 'blur(7px)'; g.drawImage(b, 0, 0); g.restore();
  }
  /* le plancher de larges lames de chêne, en perspective */
  {
    const yh = 760, vx = 960, vy = 300;
    const gp = g.createLinearGradient(0, yh, 0, H); gp.addColorStop(0, '#8a6844'); gp.addColorStop(1, '#5a3f24');
    g.fillStyle = gp; g.fillRect(0, yh, W, H - yh);
    for (let i = -16; i <= 16; i++) {
      const xb = vx + i * 150;
      g.strokeStyle = 'rgba(40,24,10,.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(vx + (xb - vx) * (yh - vy) / (H - vy), yh); g.lineTo(xb, H); g.stroke();
    }
    for (let k = 0; k < 220; k++) { const t = R(), y = lerp(yh, H, t * t), x = R() * W; g.strokeStyle = `rgba(${R() < .5 ? '255,230,190' : '40,24,10'},${.06 + R() * .08})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (x - vx) * .06, y + 8 + 30 * t); g.stroke(); }
    /* la lumière des fenêtres de gauche sur le sol */
    g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(255,236,196,.9)';
    g.beginPath(); g.moveTo(0, 800); g.lineTo(520, 790); g.lineTo(760, H); g.lineTo(0, H); g.closePath(); g.fill(); g.restore();
    g.fillStyle = 'rgba(40,26,12,.25)'; g.fillRect(0, yh - 4, W, 8);
  }
  /* la table : tréteaux en A, traverse basse, crémaillères d'acier, planche redressée */
  const [P0, P1, P2, P3] = G.planche, bx0 = P0[0], bx1 = P1[0], by0 = P0[1], by1 = P3[1];
  const k = (bx1 - bx0) / 1700;
  const bois = (x, y, w, h, clair) => {
    const gg = g.createLinearGradient(x, 0, x + w, 0); gg.addColorStop(0, clair ? '#c89a5e' : '#a87a44'); gg.addColorStop(1, clair ? '#8e6334' : '#6a4824');
    g.fillStyle = gg; g.fillRect(x, y, w, h);
  };
  const piedA = (cx) => {
    const top = by1 + 40, sol = 1004;
    /* ombres des pieds vers la droite */
    g.fillStyle = 'rgba(30,18,6,.32)';
    g.beginPath(); g.moveTo(cx - 98, sol); g.lineTo(cx + 120, sol + 18); g.lineTo(cx + 140, sol + 34); g.lineTo(cx - 90, sol + 14); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx + 98, sol); g.lineTo(cx + 320, sol + 18); g.lineTo(cx + 330, sol + 34); g.lineTo(cx + 104, sol + 14); g.closePath(); g.fill();
    const jambe = (xa, xb) => { g.save(); g.beginPath(); g.moveTo(xa - 15, top); g.lineTo(xa + 15, top); g.lineTo(xb + 18, sol); g.lineTo(xb - 18, sol); g.closePath(); const gg = g.createLinearGradient(xb - 18, 0, xb + 18, 0); gg.addColorStop(0, '#c99c62'); gg.addColorStop(.55, '#9c6f3c'); gg.addColorStop(1, '#6a4824'); g.fillStyle = gg; g.fill(); g.restore(); };
    jambe(cx - 6, cx - 98); jambe(cx + 6, cx + 98);
    bois(cx - 70, 900, 140, 18, true);
    g.fillStyle = 'rgba(40,24,10,.5)'; g.fillRect(cx - 70, 918, 140, 3);
    g.fillStyle = '#b3884f'; rr(g, cx - 40, top - 22, 80, 30, 6); g.fill();
    /* sabots */
    g.fillStyle = '#5a3c1e'; g.fillRect(cx - 120, sol - 6, 46, 12); g.fillRect(cx + 74, sol - 6, 46, 12);
  };
  const cg = bx0 + 130, cd = bx1 - 130;
  piedA(cg); piedA(cd);
  /* traverse basse entre les tréteaux */
  bois(cg + 20, 862, cd - cg - 40, 26, false);
  g.fillStyle = 'rgba(255,236,200,.35)'; g.fillRect(cg + 20, 862, cd - cg - 40, 3);
  /* crémaillères : arcs d'acier noirci de chaque côté */
  [[bx0, -1], [bx1, 1]].forEach(([x, s]) => {
    g.strokeStyle = '#1d1e22'; g.lineWidth = 9; g.beginPath(); g.arc(x - s * 10, by1 + 40, 170, s < 0 ? Math.PI * 1.02 : -Math.PI * .02, s < 0 ? Math.PI * 1.42 : -Math.PI * .42, s > 0); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x - s * 10, by1 + 40, 174, s < 0 ? Math.PI * 1.04 : -Math.PI * .04, s < 0 ? Math.PI * 1.4 : -Math.PI * .4, s > 0); g.stroke();
    for (let i = 0; i < 9; i++) { const a = s < 0 ? Math.PI * (1.05 + i * .04) : -Math.PI * (.05 + i * .04); g.fillStyle = '#2a2b30'; g.beginPath(); g.arc(x - s * 10 + Math.cos(a) * 166, by1 + 40 + Math.sin(a) * 166, 3, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#26272c'; g.beginPath(); g.arc(x - s * 10, by1 + 40, 12, 0, Math.PI * 2); g.fill();
  });
  /* la planche et sa règle */
  face(g, bx0, by0, bx1, by1, k);
  regle(g, bx0, bx1, by1, k * 1.6);
  /* lumière douce venue de la gauche sur l'ensemble */
  const gl = g.createLinearGradient(0, 0, W, 0); gl.addColorStop(0, 'rgba(255,240,214,.18)'); gl.addColorStop(.5, 'rgba(255,240,214,0)'); gl.addColorStop(1, 'rgba(30,20,10,.16)');
  g.fillStyle = gl; g.fillRect(0, 0, W, H);
  return c;
}

/* ---------------------------------------------------------------------
   La même planche de près : elle remplit l'écran
   --------------------------------------------------------------------- */
export function atelierPlanche() {
  const G = GEO['atelier-planche'], W = G.w, H = G.h, c = canevas(W, H), g = c.getContext('2d');
  const [P0, P1, , P3] = G.planche, x0 = P0[0], x1 = P1[0], y0 = P0[1], y1 = P3[1];
  /* bande floue de mur et de fenêtre au-dessus */
  const gm = g.createLinearGradient(0, 0, W, 0); gm.addColorStop(0, '#fff1d8'); gm.addColorStop(.3, '#efe7d6'); gm.addColorStop(1, '#ddd2bd');
  g.fillStyle = gm; g.fillRect(0, 0, W, y0 + 20);
  g.save(); g.filter = 'blur(5px)'; g.fillStyle = '#2a2b30'; for (let i = 0; i < 4; i++) g.fillRect(40 + i * 170, 0, 10, y0); g.restore();
  /* la pénombre sous la table */
  const gb = g.createLinearGradient(0, y1, 0, H); gb.addColorStop(0, '#4a3420'); gb.addColorStop(1, '#2a1c10');
  g.fillStyle = gb; g.fillRect(0, y1, W, H - y1);
  g.fillStyle = 'rgba(40,24,10,.6)'; g.fillRect(0, y0, x0, y1 - y0); g.fillRect(x1, y0, W - x1, y1 - y0);
  face(g, x0, y0, x1, y1, (x1 - x0) / 1700);
  regle(g, x0, x1, y1, 1.15);
  return c;
}

/* ---------------------------------------------------------------------
   « Civik-ia » entaillé au couteau : lettres anguleuses, entailles claires
   où la lame a mis le bois à nu, bords sombres polis par le temps.
   Rendu en SVG dans la page (texte net, lisible, modifiable).
   --------------------------------------------------------------------- */
const LETTRES = {
  C: { w: .78, t: [[[.72, .12], [.42, .02], [.12, .22], [.04, .55], [.18, .88], [.48, 1.0], [.74, .9]]] },
  i: { w: .3, t: [[[.15, .4], [.16, 1.0]], [[.13, .16], [.18, .24]]] },
  v: { w: .62, t: [[[.02, .4], [.3, 1.0], [.6, .38]]] },
  k: { w: .6, t: [[[.08, .0], [.1, 1.0]], [[.55, .4], [.12, .7], [.6, 1.0]]] },
  '-': { w: .42, t: [[[.06, .66], [.36, .62]]] },
  a: { w: .62, t: [[[.56, .5], [.28, .4], [.06, .62], [.12, .94], [.36, 1.0], [.56, .82]], [[.56, .42], [.6, 1.0]]] }
};
export function gravureCivikia(w, h) {
  const R = rng(251), txt = 'Civik-ia', NS = 'http://www.w3.org/2000/svg';
  const hl = h * .78, base = h * .9;
  let tot = 0; Array.from(txt).forEach(ch => tot += (LETTRES[ch] || LETTRES.i).w * hl + hl * .08);
  let x = (w - tot) / 2;
  const coupes = [];
  Array.from(txt).forEach((ch, i) => {
    const L = LETTRES[ch] || LETTRES.i, haut = ch === 'C' || ch === 'k' ? hl : hl, rot = (R() - .5) * .08, dy = (R() - .5) * hl * .05;
    L.t.forEach(trait => {
      const pts = trait.map(([u, v]) => { const px = x + u * hl + (R() - .5) * hl * .03, py = base - haut + v * haut + dy + (R() - .5) * hl * .03; return [px + (py - base) * rot, py]; });
      for (let j = 0; j < pts.length - 1; j++) coupes.push([pts[j], pts[j + 1], hl * (.055 + R() * .02)]);
    });
    x += L.w * hl + hl * .08;
  });
  /* quelques dérapages du couteau */
  for (let i = 0; i < 4; i++) { const xx = lerp(w * .12, w * .88, R()), yy = lerp(h * .2, h * .95, R()); coupes.push([[xx, yy], [xx + hl * (.1 + R() * .12), yy + (R() - .5) * hl * .1], hl * .025]); }
  const coin = (a, b, l) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    return { fond: `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${(m[0] + nx * l).toFixed(1)} ${(m[1] + ny * l).toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}L${(m[0] - nx * l).toFixed(1)} ${(m[1] - ny * l).toFixed(1)}Z`,
      ombre: `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${(m[0] + nx * l * (ny > 0 ? 1 : -1)).toFixed(1)} ${(m[1] + ny * l * (ny > 0 ? 1 : -1)).toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}Z` };
  };
  let fond = '', ombre = '', bord = '';
  coupes.forEach(([a, b, l]) => { const c = coin(a, b, l); fond += c.fond; ombre += c.ombre; bord += `M${(a[0] - .6).toFixed(1)} ${(a[1] - .8).toFixed(1)}L${(b[0] - .6).toFixed(1)} ${(b[1] - .8).toFixed(1)}`; });
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`); svg.setAttribute('width', w); svg.setAttribute('height', h);
  svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Civik-ia, entaillé au couteau dans la planche');
  svg.innerHTML = `<path d="${bord}" stroke="rgba(70,40,14,.55)" stroke-width="${(hl * .05).toFixed(1)}" stroke-linecap="round" fill="none"/>`
    + `<path d="${fond}" fill="#f3dcae"/><path d="${ombre}" fill="rgba(120,74,30,.55)"/>`;
  return svg;
}
