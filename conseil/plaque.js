/* =====================================================================
   CO-6 (première passe Conseil, 06/10/2026) : la plaque du poteau.
   Une plaque de laiton brossé, rendue pixel par pixel dans un canevas à
   la résolution de l'écran (la méthode de la plaque de pierre du film,
   c-film/js/plaque.js, lue et non modifiée ; la distance au bord et les
   homographies en sont recopiées) :
   - le métal : laiton brossé (stries horizontales), un reflet large
     venu du haut à gauche (la lumière de la scène), une patine plus
     sombre vers les bords ;
   - le bord : un léger relief (chanfrein clair en haut et à gauche,
     sombre en bas et à droite), coins arrondis ;
   - le nom « Civik-ia » gravé en creux, en V : le masque des lettres,
     la distance de chaque point au bord de la lettre (la profondeur), la
     normale des parois éclairée du haut à gauche, le fond du creux noirci
     (la patine qui s'y loge, comme sur les plaques de cabinet) ; centré
     au pixel près : l'encre est mesurée dans le masque, ses marges gauche
     et droite sont égales, son milieu est sur l'axe des vis ;
   - deux vis à fente aux extrémités de l'axe, bombées, éclairées ;
   - une ombre portée fine sur le bois, en bas et à droite.
   Aucun texte HTML, aucun filtre : le relief est dans les pixels. La
   plaque est posée dans le quadrilatère « plaque » du poteau (manifeste)
   par une homographie ; le quadrilatère est un rectangle dans la photo,
   la pose revient alors à une translation calée sur les pixels de
   l'écran (aucun rééchantillonnage, aucun flou).
   ===================================================================== */
import { rng } from '../commun/pages/plume.js';

const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
/* le bruit du film (outils.js), recopié */
function bruit2(seed) {
  const N = 256, r = rng(seed), val = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) val[i] = r();
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const x0 = xi & (N - 1), y0 = yi & (N - 1), x1 = (x0 + 1) & (N - 1), y1 = (y0 + 1) & (N - 1);
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = val[y0 * N + x0], b = val[y0 * N + x1], c = val[y1 * N + x0], e = val[y1 * N + x1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + e) * u * v;
  };
}
function fbm(b2, x, y, oct = 3) { let s = 0, a = .5, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += a * b2(x * f, y * f); n += a; a *= .5; f *= 2.03; } return s / n; }
/* distance euclidienne exacte au carré (Felzenszwalb et Huttenlocher), comme la plaque du film : 0 au bord, grand dedans */
function edt(g, w, h) {
  const n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  const passe = len => {
    let k = 0; v[0] = 0; z[0] = -1e30; z[1] = 1e30;
    for (let q = 1; q < len; q++) {
      let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = 1e30;
    }
    k = 0;
    for (let q = 0; q < len; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
  };
  for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = g[y * w + x]; passe(h); for (let y = 0; y < h; y++) g[y * w + x] = d[y]; }
  for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = g[y * w + x]; passe(w); for (let x = 0; x < w; x++) g[y * w + x] = d[x]; }
}
/* homographies du film (outils.js), recopiées : un quadrilatère est [haut gauche, haut droit, bas droit, bas gauche] */
function carreVers(q) {
  const [x0, y0] = q[0], [x1, y1] = q[1], [x2, y2] = q[2], [x3, y3] = q[3];
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let g = 0, h = 0;
  if (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9) { const det = dx1 * dy2 - dx2 * dy1 || 1e-9; g = (dx3 * dy2 - dx2 * dy3) / det; h = (dx1 * dy3 - dx3 * dy1) / det; }
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
}
function mult3(A, B) { return [A[0] * B[0] + A[1] * B[3] + A[2] * B[6], A[0] * B[1] + A[1] * B[4] + A[2] * B[7], A[0] * B[2] + A[1] * B[5] + A[2] * B[8], A[3] * B[0] + A[4] * B[3] + A[5] * B[6], A[3] * B[1] + A[4] * B[4] + A[5] * B[7], A[3] * B[2] + A[4] * B[5] + A[5] * B[8], A[6] * B[0] + A[7] * B[3] + A[8] * B[6], A[6] * B[1] + A[7] * B[4] + A[8] * B[7], A[6] * B[2] + A[7] * B[5] + A[8] * B[8]]; }
function m3d(H) { const s = H[8]; const v = [H[0] / s, H[3] / s, 0, H[6] / s, H[1] / s, H[4] / s, 0, H[7] / s, 0, 0, 1, 0, H[2] / s, H[5] / s, 0, 1]; return 'matrix3d(' + v.map(x => +x.toFixed(8)).join(',') + ')'; }
export function epingle(w, h, q) { return m3d(mult3(carreVers(q), [1 / w, 0, 0, 0, 1 / h, 0, 0, 0, 1])); }

/* la plaque : wCss x hCss (px CSS, la face de la plaque), à la densité dpr ; renvoie le canevas (marges comprises pour
   l'ombre), les marges en px CSS, et la mesure du nom (en px de l'écran) */
export async function plaqueLaiton(wCss, hCss, dpr, nom = 'Civik-ia') {
  try { await document.fonts.load(`800 40px Poppins`); } catch (e) {}
  const k = dpr, pw = Math.round(wCss * k), ph = Math.round(hCss * k);
  const mL = Math.ceil(2 * k), mT = Math.ceil(2 * k), mR = Math.ceil(5 * k), mB = Math.ceil(6 * k);
  const W = pw + mL + mR, H = ph + mT + mB;
  const R = rng(4242), N1 = bruit2(4243), N2 = bruit2(4244), N3 = bruit2(4245);
  const rc = Math.max(2, ph * .1), bev = Math.max(1.6, ph * .06);
  /* la forme : distance signée au rectangle arrondi (négative dedans) */
  const sd = (x, y) => { const qx = Math.abs(x - (mL + pw / 2)) - (pw / 2 - rc), qy = Math.abs(y - (mT + ph / 2)) - (ph / 2 - rc); return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rc; };
  /* ---- le masque du nom, dessiné grand puis mesuré : l'encre centrée au pixel près ---- */
  const axe = mT + ph / 2;
  const vis = { r: Math.max(2.2, ph * .105), x: [mL + pw * .085, mL + pw * (1 - .085)] };
  const mc = document.createElement('canvas'); mc.width = W; mc.height = H;
  const mg = mc.getContext('2d', { willReadFrequently: true });
  const POL = '800 100px Poppins, Inter, sans-serif';
  mg.font = POL; if ('letterSpacing' in mg) mg.letterSpacing = '1px';
  const m100 = mg.measureText(nom), largeur100 = m100.actualBoundingBoxLeft + m100.actualBoundingBoxRight, haut100 = m100.actualBoundingBoxAscent;
  const dispo = (vis.x[1] - vis.x[0]) - 2 * vis.r - 2 * Math.max(3, pw * .045);
  const taille = Math.min(100 * dispo / largeur100, 100 * ph * .4 / haut100);
  mg.font = POL.replace('100px', taille.toFixed(2) + 'px'); if ('letterSpacing' in mg) mg.letterSpacing = (taille * .01).toFixed(2) + 'px';
  mg.textBaseline = 'alphabetic'; mg.fillStyle = '#fff';
  const m = mg.measureText(nom);
  mg.fillText(nom, (mL + pw / 2) - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2, axe + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
  let md = mg.getImageData(0, 0, W, H).data;
  /* la mesure dans les pixels du masque, puis le recalage entier (et sous-pixel) pour des marges égales */
  const mesurer = d => { let x0 = W, x1 = -1, y0 = H, y1 = -1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 127) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return { x0, x1, y0, y1 }; };
  let b = mesurer(md);
  const dx = ((mL + (pw - 1) / 2) - (b.x0 + b.x1) / 2), dy = (axe - .5 - (b.y0 + b.y1) / 2);
  if (Math.abs(dx) > .01 || Math.abs(dy) > .01) {
    mg.clearRect(0, 0, W, H);
    mg.fillText(nom, (mL + pw / 2) - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2 + dx, axe + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2 + dy);
    md = mg.getImageData(0, 0, W, H).data; b = mesurer(md);
  }
  const n = W * H, A = new Float32Array(n), D = new Float64Array(n);
  for (let i = 0; i < n; i++) { A[i] = md[i * 4 + 3] / 255; D[i] = A[i] > .5 ? 1e20 : 0; }
  edt(D, W, H);
  /* la taille en V : la profondeur monte du bord de la lettre jusqu'au milieu du trait (la demi-épaisseur mesurée) */
  let demi = 0; for (let i = 0; i < n; i++) if (A[i] > .5) demi = Math.max(demi, Math.sqrt(D[i]));
  const prof = new Float32Array(n), pmax = Math.max(1.6, demi * .92);
  for (let i = 0; i < n; i++) prof[i] = Math.min(pmax, Math.max(0, Math.sqrt(D[i]) - .5 + (A[i] - .5)));
  /* lissé d'un pixel, comme la plaque du film : l'arête du fond reste nette à l'œil, les marches de la grille disparaissent */
  const lisse = new Float32Array(n);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; lisse[i] = (prof[i] * 4 + prof[i - 1] + prof[i + 1] + prof[i - W] + prof[i + W]) / 8; }
  /* ---- le rendu, pixel par pixel ---- */
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  /* l'ombre portée sur le bois (lumière en haut à gauche) : la forme décalée vers le bas et la droite, adoucie */
  const om = g.createImageData(W, H), od = om.data;
  const ox = 1.3 * k, oy = 1.8 * k, flou = 1.6 * k;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const s = sd(x - ox, y - oy); const a = clamp(.5 - s / flou) * .55; if (a > 0) { const i = (y * W + x) * 4; od[i] = 14; od[i + 1] = 9; od[i + 2] = 4; od[i + 3] = a * 255; } }
  g.putImageData(om, 0, 0);
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tg = tmp.getContext('2d'); tg.filter = `blur(${(.8 * k).toFixed(1)}px)`; tg.drawImage(c, 0, 0); g.clearRect(0, 0, W, H); g.drawImage(tmp, 0, 0);
  const fond = g.getImageData(0, 0, W, H), fd = fond.data;
  const Lx = -.56, Ly = -.6, Lz = .57, Ln = Math.hypot(Lx, Ly, Lz), lx = Lx / Ln, ly = Ly / Ln, lz = Lz / Ln;
  const strie = new Float32Array(H); for (let y = 0; y < H; y++) strie[y] = (fbm(N1, 3.1, y / (1.1 * k), 2) - .5);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const s = sd(x + .5, y + .5), cov = clamp(.5 - s);
      if (cov <= 0) continue;
      const u = (x - mL) / pw, v = (y - mT) / ph, i = y * W + x, p = i * 4;
      /* le laiton brossé : stries le long de la plaque, un reflet large en haut à gauche, la patine vers les bords */
      const st = strie[y] * .2 + (fbm(N2, x / (60 * k), y / (1.4 * k), 2) - .5) * .14 + (R() - .5) * .04;
      const reflet = .22 * Math.exp(-Math.pow((u * .75 + v * .45 - .28) / .3, 2)) - .14 * (u * .5 + v * .5);
      const bord = -s / Math.max(1, ph * .5), patine = clamp(1 - bord * 3.2) * .12 + (fbm(N3, x / (9 * k), y / (9 * k), 3) - .5) * .07;
      let l = 1 + st + reflet - patine;
      /* un laiton patiné, moins jaune qu'un laiton neuf */
      let r = 184 * l, gg = 151 * l, bb = 94 * l;
      /* le chanfrein du bord : la normale du bord éclairée par la lumière de la scène */
      if (-s < bev) {
        const e = .7, gx = sd(x + e, y) - sd(x - e, y), gy = sd(x, y + e) - sd(x, y - e), gl = Math.hypot(gx, gy) || 1;
        const t = 1 - clamp(-s / bev), nx = gx / gl * t, ny = gy / gl * t, nz = 1 - .6 * t, nl = Math.hypot(nx, ny, nz);
        const dl = (nx * lx + ny * ly + nz * lz) / nl, plat = lz;
        const f = clamp(dl / plat, .35, 1.6);
        r *= f; gg *= f; bb *= f;
        if (dl > plat) { const h = (dl - plat) * .9 * t; r += (255 - r) * h; gg += (246 - gg) * h; bb += (214 - bb) * h; }
      }
      /* la gravure en V : la profondeur, la normale des parois, le fond noirci */
      const pr = prof[i];
      if (A[i] > .01 || pr > 0) {
        const gx = (lisse[i + 1] - lisse[i - 1]) * .5, gy = (lisse[i + W] - lisse[i - W]) * .5;
        let nx = gx * 1.6, ny = gy * 1.6, nz = 1; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
        const dl = nx * lx + ny * ly + nz * lz;
        const p01 = clamp(pr / pmax);
        /* les parois : celle qui regarde la lumière (en bas et à droite du creux) s'éclaire, l'autre est dans l'ombre */
        let f = clamp(.18 + 1.05 * dl / lz, .12, 1.55) * (1 - .3 * p01);
        let r2 = r * f, g2 = gg * f, b2 = bb * f;
        /* la patine sombre au fond du V (lisible à 9 px de haut), la paroi éclairée reste dorée */
        const noir = clamp((p01 - .28) / .34) * .86;
        r2 += (40 - r2) * noir; g2 += (28 - g2) * noir; b2 += (16 - b2) * noir;
        if (dl > lz * 1.08 && p01 < .5) { const h = clamp((dl / lz - 1.08) * .6) * (1 - p01 * 1.6); r2 += (255 - r2) * h; g2 += (238 - g2) * h; b2 += (196 - b2) * h; }
        const mm = clamp((A[i] - .1) / .8);
        r += (r2 - r) * mm; gg += (g2 - gg) * mm; bb += (b2 - bb) * mm;
      }
      /* les vis : bombées, une fente, un filet d'ombre autour */
      for (let j = 0; j < 2; j++) {
        const ddx = x + .5 - vis.x[j], ddy = y + .5 - axe, dd = Math.hypot(ddx, ddy);
        if (dd < vis.r + 1.4 * k) {
          if (dd > vis.r) { const a = clamp(1 - (dd - vis.r) / (1.4 * k)) * clamp((ddx + ddy) / (vis.r * 1.2) + .4) * .45; r *= 1 - a; gg *= 1 - a; bb *= 1 - a; continue; }
          const qx = ddx / vis.r, qy = ddy / vis.r, qz = Math.sqrt(Math.max(0, 1 - qx * qx - qy * qy));
          const dl = clamp(qx * lx + qy * ly + qz * lz);
          let rr = 150 + 105 * dl, g3 = 132 + 95 * dl, b3 = 92 + 70 * dl;
          const ang = j ? .55 : -.35, sx = Math.cos(ang), sy = Math.sin(ang), dist = Math.abs(-sy * ddx + sx * ddy);
          if (dist < vis.r * .17 && dd < vis.r * .88) { rr = 58; g3 = 44; b3 = 28; }
          else if (dist < vis.r * .3 && dd < vis.r * .88 && (-sy * ddx + sx * ddy) > 0) { rr *= 1.12; g3 *= 1.1; b3 *= 1.06; }
          const a = clamp(vis.r - dd + .5);
          r += (rr - r) * a; gg += (g3 - gg) * a; bb += (b3 - bb) * a;
        }
      }
      /* posé sur l'ombre portée */
      const a0 = fd[p + 3] / 255, ac = cov + a0 * (1 - cov);
      fd[p] = (clamp(r, 0, 255) * cov + fd[p] * a0 * (1 - cov)) / ac; fd[p + 1] = (clamp(gg, 0, 255) * cov + fd[p + 1] * a0 * (1 - cov)) / ac; fd[p + 2] = (clamp(bb, 0, 255) * cov + fd[p + 2] * a0 * (1 - cov)) / ac; fd[p + 3] = ac * 255;
    }
  }
  g.putImageData(fond, 0, 0);
  return { canvas: c, marges: [mL / k, mT / k, mR / k, mB / k], mesure: { gauche: b.x0 - mL, droite: (mL + pw - 1) - b.x1, haut: b.y0 - mT, bas: (mT + ph - 1) - b.y1, centreY: (b.y0 + b.y1) / 2, axe: axe - .5, vis: vis.x.map(v => v - mL), largeur: pw, hauteur: ph, taille } };
}
