/* =====================================================================
   Versions provisoires de la matière « réel » : peintes une fois dans un
   canevas, à la géométrie du manifeste par défaut (visuels.js, GEO).
   Lumière commune : soleil bas du matin, venant de la gauche.
   ===================================================================== */
import { GEO } from '../visuels.js';
import { rng, bruit2, fbm, clamp, lerp, carreVers, appl, inv3 } from '../outils.js';

export function canevas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function rr(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.arcTo(x + w, y, x + w, y + r, r); g.lineTo(x + w, y + h - r); g.arcTo(x + w, y + h, x + w - r, y + h, r);
  g.lineTo(x + r, y + h); g.arcTo(x, y + h, x, y + h - r, r); g.lineTo(x, y + r); g.arcTo(x, y, x + r, y, r); g.closePath();
}
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

/* ---------------------------------------------------------------------
   Le téléphone, de face : cadre de titane bleu nuit, verre noir, pilule.
   L'écran est laissé transparent : l'écran vivant passe dessous.
   --------------------------------------------------------------------- */
export function telephone() {
  const G = GEO.telephone, c = canevas(G.w, G.h), g = c.getContext('2d');
  const [x0, y0, x1, y1] = G.corps, w = x1 - x0, h = y1 - y0, r = G.rayon;
  const R = rng(5);
  /* cadre : métal brossé, plus clair côté lumière */
  rr(g, x0, y0, w, h, r);
  const gr = g.createLinearGradient(x0, 0, x1, 0);
  gr.addColorStop(0, '#8a93b6'); gr.addColorStop(.018, '#4b5479'); gr.addColorStop(.05, '#262d4f'); gr.addColorStop(.5, '#1b2140'); gr.addColorStop(.95, '#12172f'); gr.addColorStop(.985, '#2a3152'); gr.addColorStop(1, '#3d4566');
  g.fillStyle = gr; g.fill();
  g.save(); rr(g, x0, y0, w, h, r); g.clip();
  for (let i = 0; i < 900; i++) { const x = x0 + R() * w; g.fillStyle = R() < .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.05)'; g.fillRect(x, y0, .8 + R(), h); }
  /* reflets du haut et du bas (le métal prend la lumière) */
  const gv = g.createLinearGradient(0, y0, 0, y1);
  gv.addColorStop(0, 'rgba(200,210,240,.35)'); gv.addColorStop(.03, 'rgba(200,210,240,0)'); gv.addColorStop(.97, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(0,0,0,.35)');
  g.fillStyle = gv; g.fillRect(x0, y0, w, h);
  g.restore();
  /* chanfrein poli : liseré clair sur le bord intérieur, côté lumière */
  g.lineWidth = 2.2; rr(g, x0 + 11, y0 + 11, w - 22, h - 22, r - 11);
  const gc = g.createLinearGradient(x0, y0, x1, y1);
  gc.addColorStop(0, 'rgba(225,232,255,.85)'); gc.addColorStop(.35, 'rgba(160,170,210,.35)'); gc.addColorStop(1, 'rgba(90,100,140,.3)');
  g.strokeStyle = gc; g.stroke();
  /* verre noir de la bordure */
  rr(g, x0 + 13, y0 + 13, w - 26, h - 26, r - 13);
  const gb = g.createLinearGradient(x0, y0, x1, y1);
  gb.addColorStop(0, '#15171f'); gb.addColorStop(.5, '#07080c'); gb.addColorStop(1, '#0b0c12');
  g.fillStyle = gb; g.fill();
  /* l'écran : trou transparent */
  const [ex0, ey0, ex1, ey1] = G.ecran;
  g.save(); g.globalCompositeOperation = 'destination-out'; rr(g, ex0, ey0, ex1 - ex0, ey1 - ey0, G.rayonEcran); g.fill(); g.restore();
  /* la pilule de la caméra, posée sur l'écran */
  const pw = 150, ph = 44, px = (x0 + x1) / 2 - pw / 2, py = ey0 + 22;
  rr(g, px, py, pw, ph, ph / 2); g.fillStyle = '#020204'; g.fill();
  const gl = g.createRadialGradient(px + pw - 26, py + ph / 2, 1, px + pw - 26, py + ph / 2, 11);
  gl.addColorStop(0, 'rgba(70,90,160,.9)'); gl.addColorStop(.4, 'rgba(20,24,50,.9)'); gl.addColorStop(1, 'rgba(2,2,4,0)');
  g.fillStyle = gl; g.beginPath(); g.arc(px + pw - 26, py + ph / 2, 11, 0, Math.PI * 2); g.fill();
  /* bord extérieur net */
  rr(g, x0 + .5, y0 + .5, w - 1, h - 1, r); g.lineWidth = 1.2; g.strokeStyle = 'rgba(5,7,18,.9)'; g.stroke();
  return c;
}

/* ---------------------------------------------------------------------
   Le poteau, ses deux flèches vierges, la planche de bois brûlé fendillée,
   la plaque d'acier brossé vierge et le clou.
   --------------------------------------------------------------------- */
export function poteauPlanche() {
  const G = GEO['poteau-planche'], c = canevas(G.w, G.h), g = c.getContext('2d');
  const R = rng(17), N = bruit2(23), N2 = bruit2(29);
  /* 1. le poteau de chêne gris, fendu */
  const [px0, py0, px1, py1] = G.poteau, pw = px1 - px0;
  {
    const im = g.createImageData(pw, py1 - py0), d = im.data;
    const fentes = [[.28, .1, .55], [.62, .35, .95], [.45, .7, .99]];
    for (let y = 0; y < py1 - py0; y++) for (let x = 0; x < pw; x++) {
      const u = x / pw, Y = y + py0;
      let t = .5 + .35 * (fbm(N, x * .09, Y * .0045, 3) - .5) * 2 + .18 * (N2(x * .5, Y * .02) - .5);
      const veine = Math.pow(Math.abs(Math.sin((x + N(x * .03, Y * .002) * 30) * .55)), 14) * .25;
      t -= veine;
      let fente = 0; for (const [fx, a, b] of fentes) { const yy = Y / G.h; if (yy > a && yy < b) { const dx = Math.abs(u - fx - .02 * Math.sin(Y * .02)); if (dx < .022) fente = Math.max(fente, 1 - dx / .022); } }
      const lum = 1.18 - .55 * u + (u < .06 ? .25 * (1 - u / .06) : 0);
      const base = mix([84, 76, 68], [148, 140, 128], t);
      let col = base.map(v => v * lum);
      col = mix(col, [24, 20, 16], fente * .85);
      const i4 = (y * pw + x) * 4; d[i4] = col[0]; d[i4 + 1] = col[1]; d[i4 + 2] = col[2]; d[i4 + 3] = 255;
    }
    g.putImageData(im, px0, py0);
    /* sommet en pointe de diamant */
    g.save(); g.beginPath(); g.moveTo(px0, py0 + 22); g.lineTo((px0 + px1) / 2, py0 - 4); g.lineTo(px1, py0 + 22); g.lineTo(px1, py0); g.lineTo(px0, py0); g.closePath();
    g.globalCompositeOperation = 'destination-out'; g.fill(); g.restore();
    g.beginPath(); g.moveTo(px0, py0 + 22); g.lineTo((px0 + px1) / 2, py0 - 4); g.lineTo((px0 + px1) / 2, py0 + 22); g.closePath(); g.fillStyle = '#a69c8c'; g.fill();
    g.beginPath(); g.moveTo(px1, py0 + 22); g.lineTo((px0 + px1) / 2, py0 - 4); g.lineTo((px0 + px1) / 2, py0 + 22); g.closePath(); g.fillStyle = '#5d554b'; g.fill();
  }
  /* 2. les deux flèches : planches poncées, pâles, clouées sur le poteau */
  const fleche = (f, sens) => {
    const { x0, x1, y0, y1 } = f, pointe = 54;
    const poly = sens < 0 ? [[x0, (y0 + y1) / 2], [x0 + pointe, y0], [x1, y0], [x1, y1], [x0 + pointe, y1]] : [[x0, y0], [x1 - pointe, y0], [x1, (y0 + y1) / 2], [x1 - pointe, y1], [x0, y1]];
    /* ombre portée sur le poteau (lumière à gauche) */
    g.save(); g.beginPath(); poly.forEach((p, i) => i ? g.lineTo(p[0] + 7, p[1] + 9) : g.moveTo(p[0] + 7, p[1] + 9)); g.closePath();
    g.clip(); g.fillStyle = 'rgba(20,14,8,.45)'; g.fillRect(px0, 0, pw, G.h); g.restore();
    const W = x1 - x0, H = y1 - y0, im = g.createImageData(W, H), d = im.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t = .55 + .4 * (fbm(N2, (x + x0) * .006, (y + y0) * .12, 3) - .5) + .12 * Math.pow(Math.abs(Math.sin((y + 8 * N(x * .01, y0)) * .7)), 18);
      const v = y / H, lum = 1.06 - .22 * v - .1 * (x / W);
      const col = mix([226, 210, 178], [190, 166, 128], clamp(t)).map(k => k * lum);
      const i4 = (y * W + x) * 4; d[i4] = col[0]; d[i4 + 1] = col[1]; d[i4 + 2] = col[2]; d[i4 + 3] = 255;
    }
    const tmp = canevas(W, H); tmp.getContext('2d').putImageData(im, 0, 0);
    g.save(); g.beginPath(); poly.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
    g.drawImage(tmp, x0, y0);
    /* chants : arête claire en haut, ombre en bas */
    g.fillStyle = 'rgba(255,248,232,.55)'; g.fillRect(x0, y0, W, 3);
    g.fillStyle = 'rgba(60,40,20,.35)'; g.fillRect(x0, y1 - 5, W, 5);
    g.restore();
    g.lineWidth = 1.4; g.strokeStyle = 'rgba(70,50,30,.55)'; g.beginPath(); poly.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.stroke();
    /* deux clous */
    [[(px0 + px1) / 2 - 12, y0 + 18], [(px0 + px1) / 2 + 12, y1 - 18]].forEach(([x, y]) => {
      const gg = g.createRadialGradient(x - 1.5, y - 1.5, .5, x, y, 5); gg.addColorStop(0, '#d8d6d0'); gg.addColorStop(.6, '#6d6a64'); gg.addColorStop(1, '#2b2925');
      g.fillStyle = gg; g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill();
    });
  };
  fleche(G.fg, -1); fleche(G.fd, 1);
  /* 3. la planche de bois brûlé (yakisugi) : peau d'alligator, reflets argentés */
  const [bx0, by0, bx1, by1] = G.planche, BW = bx1 - bx0, BH = by1 - by0;
  {
    /* ombre de la planche sur le poteau, à droite */
    g.fillStyle = 'rgba(10,8,6,.5)'; g.fillRect(bx1 - 2, by0 + 14, Math.min(14, px1 - bx1 + 14), BH - 10);
    const sx = 30, sy = 17, cols = Math.ceil(BW / sx) + 2, rows = Math.ceil(BH / sy) + 2, pts = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) pts.push([(i - .5 + R()) * sx, (j - .5 + R()) * sy, .6 + R() * .5, R()]);
    const im = g.createImageData(BW, BH), d = im.data, bord = bruit2(41);
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
      const ci = Math.floor(x / sx), cj = Math.floor(y / sy);
      let d1 = 1e9, d2 = 1e9, best = null;
      for (let jj = cj - 1; jj <= cj + 2; jj++) for (let ii = ci - 1; ii <= ci + 2; ii++) {
        if (ii < 0 || jj < 0 || ii >= cols || jj >= rows) continue;
        const p = pts[jj * cols + ii], dx = (x - p[0]) / sx, dy = (y - p[1]) / sy, dd = Math.sqrt(dx * dx + dy * dy);
        if (dd < d1) { d2 = d1; d1 = dd; best = p; } else if (dd < d2) d2 = dd;
      }
      const e = (d2 - d1) * sy;           /* distance au bord de l'écaille, en pixels environ */
      const fente = e < 1.3 ? 1 : e < 2.6 ? 1 - (e - 1.3) / 1.3 : 0;
      /* bombé de l'écaille : plus clair vers le haut gauche */
      const dx = (x - best[0]) / sx, dy = (y - best[1]) / sy;
      const bombe = clamp(.55 - .5 * dx - .45 * dy - d1 * .35);
      const fibre = N(x * .04, y * .5) * .5 + N2(x * .3, y * .9) * .5;
      let col = mix([18, 14, 11], [52, 42, 34], clamp(best[2] * .5 + bombe * .45 + fibre * .25));
      /* reflet argenté sur les crêtes côté lumière */
      const crete = e < 6 && e > 1.5 ? (1 - Math.abs(e - 3.4) / 2.6) * clamp(-dx * 1.2 - dy * .8 + .3) : 0;
      const eclat = Math.pow(N2(x * .9, y * 1.7), 6) * 1.6;
      col = mix(col, [150, 150, 156], clamp(crete * .55 + eclat * .35 * bombe));
      col = mix(col, [6, 5, 4], fente * .92);
      /* éclairage d'ensemble et bords cassés */
      const L = 1.12 - .32 * (x / BW) - .12 * (y / BH);
      const k = Math.min(x, y, BW - 1 - x, BH - 1 - y), ir = 3 + 5 * bord(x * .09, y * .09);
      const a = k < ir ? clamp(k / ir * 1.4 - .15) : 1;
      const i4 = (y * BW + x) * 4; d[i4] = col[0] * L; d[i4 + 1] = col[1] * L; d[i4 + 2] = col[2] * L; d[i4 + 3] = a * 255;
    }
    const tmp = canevas(BW, BH); tmp.getContext('2d').putImageData(im, 0, 0);
    g.drawImage(tmp, bx0, by0);
    /* deux joints de lames */
    g.strokeStyle = 'rgba(0,0,0,.75)'; g.lineWidth = 1.6;
    [BW * .34, BW * .68].forEach(x => { g.beginPath(); g.moveTo(bx0 + x, by0 + 4); for (let y = 0; y < BH; y += 20) g.lineTo(bx0 + x + Math.sin(y * .05) * .8, by0 + y); g.stroke(); });
  }
  /* 4. la plaque d'acier brossé, vierge, deux vis */
  {
    const [qx0, qy0, qx1, qy1] = G.plaque, QW = qx1 - qx0, QH = qy1 - qy0;
    g.fillStyle = 'rgba(0,0,0,.55)'; rr(g, qx0 + 3, qy0 + 4, QW, QH, 3); g.fill();
    rr(g, qx0, qy0, QW, QH, 3);
    const gs = g.createLinearGradient(qx0, qy0, qx1, qy1);
    gs.addColorStop(0, '#e6e9ec'); gs.addColorStop(.45, '#b9bec4'); gs.addColorStop(.55, '#c9cdd2'); gs.addColorStop(1, '#8e949b');
    g.fillStyle = gs; g.fill();
    g.save(); rr(g, qx0, qy0, QW, QH, 3); g.clip();
    for (let i = 0; i < 160; i++) { const y = qy0 + R() * QH; g.fillStyle = R() < .5 ? 'rgba(255,255,255,.18)' : 'rgba(60,64,70,.12)'; g.fillRect(qx0, y, QW, .6); }
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(qx0 + 2, qy1 - 1); g.lineTo(qx0 + 1, qy0 + 1); g.lineTo(qx1 - 2, qy0 + 1); g.stroke();
    g.strokeStyle = 'rgba(40,44,50,.7)'; g.beginPath(); g.moveTo(qx1 - 1, qy0 + 2); g.lineTo(qx1 - 1, qy1 - 1); g.lineTo(qx0 + 2, qy1 - 1); g.stroke();
    [[qx0 + 8, (qy0 + qy1) / 2], [qx1 - 8, (qy0 + qy1) / 2]].forEach(([x, y]) => {
      const gg = g.createRadialGradient(x - 1, y - 1, .3, x, y, 3.6); gg.addColorStop(0, '#f4f5f6'); gg.addColorStop(.7, '#7d838a'); gg.addColorStop(1, '#3a3e44');
      g.fillStyle = gg; g.beginPath(); g.arc(x, y, 3.4, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(30,32,36,.8)'; g.lineWidth = .9; g.beginPath(); g.moveTo(x - 2.4, y + 1.2); g.lineTo(x + 2.4, y - 1.2); g.stroke();
    });
  }
  /* 5. le clou, enfoncé au milieu de la planche */
  {
    const [x, y] = G.clou;
    g.fillStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.ellipse(x + 2.5, y + 3, 6, 5, 0, 0, Math.PI * 2); g.fill();
    const gg = g.createRadialGradient(x - 2, y - 2, .5, x, y, 6); gg.addColorStop(0, '#eceef0'); gg.addColorStop(.55, '#8a9098'); gg.addColorStop(1, '#3a3e44');
    g.fillStyle = gg; g.beginPath(); g.arc(x, y, 5.6, 0, Math.PI * 2); g.fill();
  }
  return c;
}

/* ---------------------------------------------------------------------
   L'atelier vu de face : calcaire pâle, pignon bas de tuiles anciennes,
   verrière d'acier noir, double porte grande ouverte (on y entre).
   --------------------------------------------------------------------- */
export function atelierFacade() {
  const G = GEO['atelier-facade'], c = canevas(G.w, G.h), g = c.getContext('2d'), R = rng(91), N = bruit2(93), N2 = bruit2(97);
  const sol = G.sol, [mx0, mx1] = G.murs, eave = 452, faite = 262, cxm = (mx0 + mx1) / 2;
  const [dx0, dy0, dx1, dy1] = G.porte;
  const v0 = 520, vx0 = 330, vx1 = 1270;
  /* le mur de calcaire, pierre par pierre */
  const murPoly = [[mx0, sol], [mx0, eave], [cxm, faite], [mx1, eave], [mx1, sol]];
  {
    const W = mx1 - mx0, H = sol - faite, im = g.createImageData(W, H), d = im.data;
    const assise = 30, pierres = [];
    for (let j = 0; j * assise < H + assise; j++) { let x = -R() * 80; const row = []; while (x < W) { const l = 54 + R() * 96; row.push([x, x + l, .85 + R() * .3, R()]); x += l; } pierres.push(row); }
    for (let y = 0; y < H; y++) {
      const j = Math.floor(y / assise), yy = y - j * assise, row = pierres[j];
      let k = 0;
      for (let x = 0; x < W; x++) {
        while (k < row.length - 1 && row[k][1] < x) k++;
        const p = row[k], joint = yy < 2.2 || (x - p[0]) < 2.2;
        const t = fbm(N, (x + mx0) * .02, (y + faite) * .03, 3);
        const grain = N2(x * .5, y * .5);
        let col = mix([200, 188, 166], [236, 228, 210], clamp(t * .8 + p[3] * .25 + grain * .12));
        col = col.map(v => v * p[2] * .12 + v * .88);
        if (joint) col = mix(col, [150, 138, 118], .55);
        else if (yy < 4.5 || (x - p[0]) < 4.5) col = col.map(v => v * 1.05);
        const L = 1.1 - .28 * (x / W);
        const i4 = (y * W + x) * 4; d[i4] = col[0] * L; d[i4 + 1] = col[1] * L; d[i4 + 2] = col[2] * L; d[i4 + 3] = 255;
      }
    }
    const tmp = canevas(W, H); tmp.getContext('2d').putImageData(im, 0, 0);
    g.save(); g.beginPath(); murPoly.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
    g.drawImage(tmp, mx0, faite);
    /* ombre sous la rive du toit */
    g.strokeStyle = 'rgba(60,45,30,.35)'; g.lineWidth = 26; g.beginPath(); g.moveTo(mx0 - 20, eave + 8); g.lineTo(cxm, faite + 8); g.lineTo(mx1 + 20, eave + 8); g.stroke();
    g.restore();
  }
  /* oculus dans le pignon */
  {
    const ox = cxm, oy = 370, r = 34;
    g.fillStyle = '#2b2f36'; g.beginPath(); g.arc(ox, oy, r, 0, Math.PI * 2); g.fill();
    const gg = g.createLinearGradient(ox - r, oy - r, ox + r, oy + r); gg.addColorStop(0, 'rgba(210,225,236,.85)'); gg.addColorStop(1, 'rgba(120,140,160,.6)');
    g.fillStyle = gg; g.beginPath(); g.arc(ox, oy, r - 5, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#1a1c20'; g.lineWidth = 4; g.beginPath(); g.moveTo(ox - r, oy); g.lineTo(ox + r, oy); g.moveTo(ox, oy - r); g.lineTo(ox, oy + r); g.stroke();
    g.strokeStyle = 'rgba(120,108,90,.8)'; g.lineWidth = 7; g.beginPath(); g.arc(ox, oy, r + 4, 0, Math.PI * 2); g.stroke();
  }
  /* la verrière d'acier noir et ses vitres anciennes */
  const vitre = (x, y, w, h, k) => {
    const gg = g.createLinearGradient(x, y, x + w * .4, y + h);
    gg.addColorStop(0, `rgba(${214 - k * 20},${226 - k * 16},${236 - k * 10},1)`); gg.addColorStop(.55, 'rgba(150,166,180,1)'); gg.addColorStop(1, 'rgba(88,80,72,1)');
    g.fillStyle = gg; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(x + w * (.1 + R() * .3), y); g.lineTo(x + w * (.35 + R() * .3), y); g.lineTo(x, y + h * (.5 + R() * .4)); g.lineTo(x, y + h * .3); g.closePath(); g.fill();
  };
  const ncol = 10, colW = (vx1 - vx0) / ncol, trav = [v0, 610, dy0, 920, sol];
  for (let i = 0; i < ncol; i++) for (let j = 0; j < trav.length - 1; j++) vitre(vx0 + i * colW, trav[j], colW, trav[j + 1] - trav[j], R());
  /* reflet du ciel du matin sur toute la verrière */
  const gs = g.createLinearGradient(vx0, v0, vx1, sol); gs.addColorStop(0, 'rgba(255,236,206,.35)'); gs.addColorStop(.5, 'rgba(255,236,206,0)'); g.fillStyle = gs; g.fillRect(vx0, v0, vx1 - vx0, sol - v0);
  g.fillStyle = '#16181c';
  for (let i = 0; i <= ncol; i++) g.fillRect(vx0 + i * colW - 4, v0, 8, sol - v0);
  trav.forEach(y => g.fillRect(vx0 - 4, y - 4, vx1 - vx0 + 8, 8));
  g.fillStyle = 'rgba(255,255,255,.22)'; for (let i = 0; i <= ncol; i++) g.fillRect(vx0 + i * colW - 4, v0, 1.5, sol - v0);
  /* encadrement de pierre de la verrière */
  g.strokeStyle = '#d9cfbb'; g.lineWidth = 16; g.strokeRect(vx0 - 12, v0 - 12, vx1 - vx0 + 24, sol - v0 + 12);
  g.strokeStyle = 'rgba(90,75,55,.4)'; g.lineWidth = 2; g.strokeRect(vx0 - 4, v0 - 4, vx1 - vx0 + 8, sol - v0 + 4);
  /* la porte grande ouverte : on voit à travers (transparent), vantaux rabattus */
  g.save(); g.globalCompositeOperation = 'destination-out'; g.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0); g.restore();
  const vantail = (xa, xb, sens) => {
    const p = [[xa, dy0 - 6], [xb, dy0 + 18], [xb, dy1 + 8], [xa, dy1]];
    g.fillStyle = '#121418'; g.beginPath(); p.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fill();
    for (let k = 0; k < 3; k++) {
      const t0 = .1 + k * .3, t1 = t0 + .24;
      const yA = lerp(p[0][1], p[3][1], t0), yB = lerp(p[0][1], p[3][1], t1), yC = lerp(p[1][1], p[2][1], t0), yD = lerp(p[1][1], p[2][1], t1);
      const gg = g.createLinearGradient(xa, yA, xb, yD); gg.addColorStop(0, sens < 0 ? 'rgba(230,236,240,.9)' : 'rgba(120,130,140,.85)'); gg.addColorStop(1, 'rgba(70,74,80,.85)');
      g.fillStyle = gg; g.beginPath(); g.moveTo(xa + sens * -4, yA + 6); g.lineTo(xb + sens * 4, yC + 6); g.lineTo(xb + sens * 4, yD - 6); g.lineTo(xa + sens * -4, yB - 6); g.closePath(); g.fill();
    }
  };
  vantail(dx0 - 96, dx0 - 4, -1); vantail(dx1 + 96, dx1 + 4, 1);
  /* seuil de pierre */
  g.fillStyle = '#cfc5b0'; g.fillRect(dx0 - 30, sol - 6, dx1 - dx0 + 60, 14); g.fillStyle = 'rgba(80,65,45,.45)'; g.fillRect(dx0 - 30, sol + 6, dx1 - dx0 + 60, 3);
  /* le toit : rive de tuiles canal anciennes, débord */
  const rive = (xa, ya, xb, yb) => {
    const L = Math.hypot(xb - xa, yb - ya), ux = (xb - xa) / L, uy = (yb - ya) / L, nx = uy, ny = -ux, ep = 40;
    g.fillStyle = '#9c4f2f'; g.beginPath(); g.moveTo(xa + nx * ep, ya + ny * ep); g.lineTo(xb + nx * ep, yb + ny * ep); g.lineTo(xb, yb); g.lineTo(xa, ya); g.closePath(); g.fill();
    for (let s = 0; s < L; s += 26) {
      const x = xa + ux * s, y = ya + uy * s, t = R();
      const col = mix([170, 86, 52], [204, 120, 78], t);
      g.fillStyle = rgb(col); g.beginPath(); g.ellipse(x + nx * ep * .55, y + ny * ep * .55, 14, ep * .55, Math.atan2(uy, ux), 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(60,25,10,.35)'; g.beginPath(); g.ellipse(x + nx * ep * .55 + ux * 6, y + ny * ep * .55 + uy * 6, 6, ep * .45, Math.atan2(uy, ux), 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = 'rgba(40,20,8,.55)'; g.beginPath(); g.moveTo(xa, ya); g.lineTo(xb, yb); g.lineTo(xb - nx * 10, yb - ny * 10); g.lineTo(xa - nx * 10, ya - ny * 10); g.closePath(); g.fill();
  };
  rive(mx0 - 44, eave + 22, cxm, faite - 4); rive(cxm, faite - 4, mx1 + 44, eave + 22);
  /* soubassement et ombre portée au sol (lumière à gauche : ombre à droite) */
  g.fillStyle = 'rgba(60,48,32,.18)'; g.fillRect(mx0, sol - 18, mx1 - mx0, 18);
  return c;
}

