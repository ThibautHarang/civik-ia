/* =====================================================================
   Versions provisoires de la matière « gravure » : cyprès, vignes, borne.
   Taille-douce imitée au canevas : traits fins à l'encre bleu nuit,
   hachures serrées côté ombre (lumière venant de la gauche), papier
   réservé côté lumière. Le muret et les herbes sont tracés directement
   dans le monde (monde.js) tant que leurs images n'existent pas.
   ===================================================================== */
import { rng, bruit1, ss, lerp, clamp } from '../outils.js';
import { canevas } from './reel.js';

export const ENCRE_G = [86, 92, 126];
const PAPIER_G = '#f2f0ea';
const encre = a => `rgba(${ENCRE_G[0]},${ENCRE_G[1]},${ENCRE_G[2]},${a.toFixed(3)})`;
function trait(g, pts, w, a) {
  g.strokeStyle = encre(a); g.lineWidth = w; g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 3) g.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]);
  else for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.stroke();
}
function touffes(g, R, x0, x1, y, n, h) {
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, R()), hh = h * (.5 + R() * .7);
    for (let b = 0; b < 5; b++) { const a = (b - 2) * .28 + (R() - .5) * .2; trait(g, [[x, y], [x + Math.sin(a) * hh * .4, y - hh * .55], [x + Math.sin(a) * hh, y - Math.cos(a) * hh]], .8, .7); }
  }
}

/* ---------------------------------------------------------------------
   Cyprès : flamme sombre, hachures verticales en flammèches
   --------------------------------------------------------------------- */
export function cypres(seed, large) {
  const W = 300, H = 900, c = canevas(W, H), g = c.getContext('2d'), R = rng(seed), N = bruit1(seed);
  g.lineCap = 'round';
  const base = H - 24, y0 = base - 44, top = 16, Hf = y0 - top, cx = W / 2 + (R() - .5) * 8, Wm = W * (large ? .41 : .36);
  const prof = u => u < .16 ? .6 + .4 * ss(u / .16) : Math.pow(Math.max(0, (1 - u) / .84), .8);
  const larg = (u, cote) => Wm * prof(u) * (1 + .1 * N(u * 24 + cote * 50) + .05 * N(u * 70 + cote * 9));
  const X = (u, r) => cx + r * larg(u, r < 0 ? -1 : 1) + (large && r < 0 && u > .35 && u < .5 ? 14 : 0);
  /* 1. silhouette réservée */
  g.fillStyle = PAPIER_G; g.beginPath();
  for (let i = 0; i <= 120; i++) { const u = i / 120; g.lineTo(X(u, -1), y0 - u * Hf); }
  for (let i = 120; i >= 0; i--) { const u = i / 120; g.lineTo(X(u, 1), y0 - u * Hf); }
  g.closePath(); g.fill();
  /* 2. flammèches : traits montants qui suivent la forme, serrés à droite */
  for (let k = 0; k < 2600; k++) {
    const u = Math.pow(R(), .92) * .97, r = R() * 2 - 1;
    const dens = .16 + .84 * ss(clamp((r + .45) / 1.3));
    if (R() > dens) continue;
    const x = X(u, r * .96), y = y0 - u * Hf, L = (8 + R() * 20) * (1 - u * .4);
    const pente = -r * .35 + (R() - .5) * .3;
    trait(g, [[x, y], [x + pente * L * .4 + (R() - .5) * 2, y - L * .55], [x + pente * L, y - L]], .65 + R() * .55, .45 + R() * .45);
  }
  /* 3. contre-hachures obliques côté ombre */
  for (let k = 0; k < 900; k++) {
    const u = R() * .95, r = .25 + R() * .75;
    if (R() > .3 + .7 * r) continue;
    const x = X(u, r * .94), y = y0 - u * Hf, l = 6 + R() * 10;
    trait(g, [[x, y], [x - l * .85, y + l * .5]], .55, .32 + R() * .3);
  }
  /* 4. touffes en écailles côté lumière, poches sombres dans la masse */
  for (let k = 0; k < 160; k++) {
    const u = R() * .94, x = X(u, -1) + 3 + R() * 10, y = y0 - u * Hf, s = 4 + R() * 7;
    g.strokeStyle = encre(.55); g.lineWidth = .8; g.beginPath(); g.arc(x + s * .6, y, s, Math.PI * .95, Math.PI * 1.75); g.stroke();
  }
  for (let k = 0; k < 40; k++) {
    const u = .05 + R() * .85, r = R() * 1.2 - .2, x = X(u, r), y = y0 - u * Hf;
    for (let j = 0; j < 9; j++) trait(g, [[x + (R() - .5) * 8, y + (R() - .5) * 10], [x + (R() - .5) * 8, y - 8 - R() * 8]], .7, .7);
  }
  /* 5. bords : côté ombre appuyé, côté lumière cassé */
  for (let i = 0; i < 120; i++) { const u0 = i / 120, u1 = (i + 1) / 120; if (R() < .82) trait(g, [[X(u0, 1), y0 - u0 * Hf], [X(u1, 1), y0 - u1 * Hf]], 1.4, .85); if (R() < .35) trait(g, [[X(u0, -1), y0 - u0 * Hf], [X(u1, -1), y0 - u1 * Hf]], .9, .6); }
  /* 6. tronc et pied */
  g.fillStyle = PAPIER_G; g.fillRect(cx - 8, y0 - 4, 16, base - y0 + 4);
  trait(g, [[cx - 8, y0], [cx - 7, base]], 1.2, .9); trait(g, [[cx + 8, y0], [cx + 7, base]], 1.6, .95);
  for (let y = y0 + 3; y < base; y += 3.2) trait(g, [[cx + 1, y], [cx + 7, y - 1.5]], .7, .7);
  touffes(g, R, cx - 40, cx + 40, base + 2, 7, 22);
  return c;
}

/* ---------------------------------------------------------------------
   Pied de vigne : cep tordu, bras sur le fil, piquet, feuilles palmées
   dentelées vues sous tous les angles, ombre en hachures, grappes
   --------------------------------------------------------------------- */
export function vigne(seed, grappes) {
  const W = 360, H = 300, c = canevas(W, H), g = c.getContext('2d'), R = rng(seed);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const bx = 180 + (R() - .5) * 16, by = 288, fil = 176;
  trait(g, [[0, fil], [W, fil + 1]], .8, .7); trait(g, [[0, fil - 56], [W, fil - 55]], .55, .4);
  /* piquet */
  const px = grappes ? 316 : 44;
  g.fillStyle = PAPIER_G; g.fillRect(px - 4, 88, 8, by - 88);
  trait(g, [[px - 4, 90], [px - 4, by]], .8, .7); trait(g, [[px + 4, 90], [px + 4, by]], 1.2, .9);
  for (let y = 94; y < by; y += 3.4) trait(g, [[px - 1, y], [px + 4, y - 2]], .5, .55);
  /* cep tordu */
  const cep = t => [bx + Math.sin(t * 7 + seed) * 5 + (t > .8 ? (t - .8) * 20 : 0), lerp(by, fil + 4, t)];
  g.fillStyle = PAPIER_G; g.beginPath();
  for (let i = 0; i <= 20; i++) { const [x, y] = cep(i / 20); g.lineTo(x - 7, y); }
  for (let i = 20; i >= 0; i--) { const [x, y] = cep(i / 20); g.lineTo(x + 7, y); }
  g.closePath(); g.fill();
  for (let i = 0; i < 20; i++) { const [x, y] = cep(i / 20), [x2, y2] = cep((i + 1) / 20); trait(g, [[x - 7, y], [x2 - 7, y2]], .8, .75); trait(g, [[x + 7, y], [x2 + 7, y2]], 1.3, .9); trait(g, [[x - 2, y], [x + 7, y - 4]], .55, .6); trait(g, [[x + 2, y + 2], [x + 7, y - 1]], .5, .55); }
  [[-1, 30], [1, 334]].forEach(([sg, xe]) => { const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push([lerp(bx, xe, t), fil - 2 + Math.sin(t * 9 + seed) * 3]); } for (let i = 0; i < 14; i++) { trait(g, [pts[i], pts[i + 1]], 2.2, .85); trait(g, [[pts[i][0], pts[i][1] + 2], [pts[i + 1][0], pts[i + 1][1] + 2]], .6, .6); } });
  /* ombre portée au sol, vers la droite */
  for (let k = 0; k < 26; k++) { const x = bx - 60 + k * 6; trait(g, [[x, by + 2], [x + 30, by + 5]], .5, .35); }
  /* une feuille de vigne : cinq lobes, sinus du pétiole, dents fines ; vue sous un angle (aplatissement) */
  const feuille = (x, y, s, a, apl, ombre) => {
    const pts = [], n = 64;
    for (let i = 0; i < n; i++) {
      const t = i / n * Math.PI * 2;
      const lobe = Math.pow(Math.abs(Math.cos(2.5 * t)), .7);
      let r = s * (.55 + .45 * lobe);
      const sinus = Math.exp(-Math.pow((t - Math.PI * .5) / .22, 2)) * .5;   /* le creux du pétiole, en bas */
      r *= 1 - sinus;
      r += s * .045 * Math.sin(t * 34 + seed);
      const lx = Math.cos(t) * r, ly = Math.sin(t) * r * apl;
      pts.push([x + lx * Math.cos(a) - ly * Math.sin(a), y + lx * Math.sin(a) + ly * Math.cos(a)]);
    }
    g.fillStyle = PAPIER_G; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill();
    g.strokeStyle = encre(.82); g.lineWidth = .75; g.stroke();
    /* nervures principales */
    const base = [x + Math.sin(a) * -s * .12 * apl, y + Math.cos(a) * s * .12 * apl];
    for (let k = 0; k < 5; k++) { const t = -Math.PI / 2 + (k - 2) * 1.05; const tip = [x + Math.cos(t) * s * .8 * Math.cos(a) - Math.sin(t) * s * .8 * apl * Math.sin(a), y + Math.cos(t) * s * .8 * Math.sin(a) + Math.sin(t) * s * .8 * apl * Math.cos(a)]; trait(g, [base, [lerp(base[0], tip[0], .5) + 1, lerp(base[1], tip[1], .5)], tip], .5, .5); }
    /* hachures d'ombre, côté droit et bas (lumière à gauche) */
    const nh = ombre ? 22 : 10;
    for (let k = 0; k < nh; k++) {
      const u = .1 + R() * .85, v = (R() - .3) * .9;
      const hx = x + u * s * .8, hy = y + v * s * apl;
      if (Math.hypot(hx - x, (hy - y) / Math.max(.3, apl)) > s * .78) continue;
      trait(g, [[hx, hy], [hx - 4.5, hy + 3.2]], .5, .5 + (ombre ? .2 : 0));
    }
  };
  const fs = [];
  for (let k = 0; k < 46; k++) { const t = R(); fs.push([lerp(24, 336, t), lerp(48, 168, Math.pow(R(), .75)) + Math.sin(t * 6) * 6, 14 + R() * 13, R() * 6.28, .45 + R() * .55, R()]); }
  fs.sort((a2, b2) => a2[1] - b2[1]);
  fs.forEach(([x, y, sz, a, apl, o]) => feuille(x, y, sz, a, apl, o > .5 || x > 230 || y > 128));
  /* masse d'ombre sous le feuillage */
  for (let k = 0; k < 340; k++) { const x = lerp(24, 336, R()), y = lerp(140, 176, R()); trait(g, [[x, y], [x - 5, y + 4]], .5, .5); }
  if (grappes) [[118, 194], [232, 198]].forEach(([gx, gy]) => {
    for (let i = 0; i < 18; i++) { const row = Math.floor(Math.sqrt(i * 2)), x = gx + (i - row * row / 2) * 6.4 - row * 2 + (R() - .5) * 3, y = gy + row * 7.4; g.fillStyle = PAPIER_G; g.beginPath(); g.arc(x, y, 4.2, 0, Math.PI * 2); g.fill(); g.strokeStyle = encre(.8); g.lineWidth = .7; g.stroke(); trait(g, [[x + .8, y + .8], [x + 3.2, y + 2.4]], .55, .6); }
    trait(g, [[gx, gy - 8], [gx + 2, gy - 22]], .9, .8);
  });
  touffes(g, R, bx - 50, bx + 50, by + 2, 9, 16);
  return c;
}

/* ---------------------------------------------------------------------
   Borne de chemin, ancienne, sommet arrondi, face vierge
   --------------------------------------------------------------------- */
export function borne() {
  const W = 160, H = 220, c = canevas(W, H), g = c.getContext('2d'), R = rng(151);
  g.lineCap = 'round';
  const x0 = 34, x1 = 126, yb = 206, yt = 60;
  g.fillStyle = PAPIER_G; g.beginPath(); g.moveTo(x0, yb); g.lineTo(x0, yt); g.arc((x0 + x1) / 2, yt, (x1 - x0) / 2, Math.PI, 0); g.lineTo(x1, yb); g.closePath(); g.fill();
  trait(g, [[x0, yb], [x0, yt]], 1.2, .85); trait(g, [[x1, yt], [x1, yb]], 1.8, .95);
  g.strokeStyle = encre(.85); g.lineWidth = 1.3; g.beginPath(); g.arc((x0 + x1) / 2, yt, (x1 - x0) / 2, Math.PI, 0); g.stroke();
  for (let k = 0; k < 340; k++) { const x = lerp(x0 + 18, x1, Math.pow(R(), .6)), y = lerp(yt - 40, yb, R()); if (Math.hypot(x - (x0 + x1) / 2, Math.min(0, y - yt)) > (x1 - x0) / 2 - 2) continue; trait(g, [[x, y], [x - 4, y + 4]], .6, .25 + .5 * (x - x0) / (x1 - x0)); }
  for (let k = 0; k < 30; k++) { const x = lerp(x0, x1, R()), y = lerp(yt, yb, R()); g.strokeStyle = encre(.4); g.lineWidth = .7; g.beginPath(); g.arc(x, y, 2 + R() * 3, 0, Math.PI * 1.2); g.stroke(); }
  trait(g, [[x0 - 6, yb], [x1 + 10, yb]], 1.2, .8);
  touffes(g, R, x0 - 10, x1 + 10, yb + 1, 9, 20);
  return c;
}

/* ---------------------------------------------------------------------
   Sol du chemin, vu d'en haut, raccordable sur ses quatre bords :
   terre battue pâle, cailloux, quelques fentes, deux ornières légères.
   --------------------------------------------------------------------- */
export function solChemin() {
  const T = 512, c = canevas(T, T), g = c.getContext('2d'), R = rng(171);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, T, T);
  g.lineCap = 'round';
  /* chaque marque est dessinée aussi de l'autre côté du bord, pour raccorder */
  const partout = (x, y, f) => { for (const dx of [-T, 0, T]) for (const dy of [-T, 0, T]) { const X = x + dx, Y = y + dy; if (X > -60 && X < T + 60 && Y > -60 && Y < T + 60) f(X, Y); } };
  /* ornières : deux bandes de traits fins, dans le sens du chemin (de bas en haut) */
  [T * .26, T * .74].forEach((ox, k) => {
    for (let j = 0; j < 7; j++) {
      const x0 = ox + (j - 3) * 3.2 + (R() - .5) * 2;
      let y = R() * 30;
      while (y < T) { const l = 18 + R() * 60; const x = x0 + Math.sin((y + k * 90) * .02) * 2; partout(x, y, (X, Y) => trait(g, [[X, Y], [X + (R() - .5) * 1.5, Y + l]], .7, .32 + R() * .2)); y += l + 6 + R() * 20; }
    }
  });
  /* cailloux, éclairés de la gauche : contour, ombre portée à droite, hachures dessous */
  for (let i = 0; i < 70; i++) {
    const x = R() * T, y = R() * T, r = 2 + Math.pow(R(), 2.2) * 11, a = R() * Math.PI;
    partout(x, y, (X, Y) => {
      g.strokeStyle = encre(.75); g.lineWidth = .8; g.beginPath(); g.ellipse(X, Y, r, r * (.55 + R() * .3), a, 0, Math.PI * 2); g.stroke();
      for (let k = 0; k < Math.max(2, r * .8); k++) trait(g, [[X + r * .1 + k * 1.6, Y + r * .5], [X + r * .1 + k * 1.6 - 2.5, Y - r * .1]], .55, .55);
      trait(g, [[X + r * .9, Y + r * .4], [X + r * 1.9, Y + r * .55]], .6, .4);
    });
  }
  /* graviers : petits points */
  for (let i = 0; i < 900; i++) { const x = R() * T, y = R() * T; partout(x, y, (X, Y) => { g.fillStyle = encre(.25 + R() * .3); g.fillRect(X, Y, .9 + R() * .9, .9 + R() * .6); }); }
  /* fentes courtes */
  for (let i = 0; i < 16; i++) { const x = R() * T, y = R() * T; const pts = [[0, 0]]; for (let k = 0; k < 4; k++) pts.push([pts[k][0] + (R() - .5) * 14, pts[k][1] + 4 + R() * 7]); partout(x, y, (X, Y) => trait(g, pts.map(([u, v]) => [X + u, Y + v]), .6, .5)); }
  /* hachures horizontales très légères, la matière de la terre */
  for (let i = 0; i < 260; i++) { const x = R() * T, y = R() * T, l = 6 + R() * 16; partout(x, y, (X, Y) => trait(g, [[X, Y], [X + l, Y + (R() - .5) * 1.2]], .5, .18)); }
  /* touffes minuscules */
  for (let i = 0; i < 7; i++) { const x = R() * T, y = R() * T; partout(x, y, (X, Y) => { for (let b = 0; b < 5; b++) { const an = (b - 2) * .35; trait(g, [[X, Y], [X + Math.sin(an) * 5, Y - 6], [X + Math.sin(an) * 9, Y - 9 * Math.cos(an)]], .6, .6); } }); }
  return c;
}
