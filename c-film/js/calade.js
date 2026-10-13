/* =====================================================================
   J12 (dixième passe, 04/10/2026) : le chemin se pave en approchant.
   Sur le dernier tronçon du chemin de l'atelier, la terre devient une
   calade de dalles de calcaire irrégulières, dans la même gravure que le
   sol : contours à l'encre, joints sombres, hachures parallèles le long
   des bords à l'ombre (lumière en haut à gauche de l'écran : le côté
   proche et le côté droit des dalles sont dans l'ombre), quelques points
   de piqûre, trois dalles fendues. Le passage est progressif : quelques
   dalles éparses dans la terre, de plus en plus serrées, puis le pavage
   complet devant le seuil.
   C'est une bande gravée en coordonnées du chemin (x : la distance le
   long du chemin, y : l'écart à son axe), calculée une fois pendant les
   temps morts (tâches de quelques millisecondes), puis posée en
   perspective sur le plan du sol, tronçon par tronçon, comme la tuile du
   chemin. Une seconde bande, à demi-résolution, porte son lavis (calcaire
   gris-ocre clair, joints plus sombres) et son masque (qui efface le
   lavis de la terre sous les dalles).
   ===================================================================== */
import { clamp, rng, bruit2, fbm, hash } from './outils.js';
import { TEL, liberer } from './memoire.js';
import { LOURD } from './lavis.js';

export const CAL = { s0: 15, s1: 36.55, demi: 1.55, K: 220 };
const ENCRE = [86, 92, 128];
const ink = a => `rgba(${ENCRE[0]},${ENCRE[1]},${ENCRE[2]},${a.toFixed(3)})`;
const ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };

/* le polygone de Voronoï d'un site, par découpe d'un carré par les demi-plans de ses voisins */
function cellule(site, voisins, r) {
  let P = [[site[0] - r, site[1] - r], [site[0] + r, site[1] - r], [site[0] + r, site[1] + r], [site[0] - r, site[1] + r]];
  for (const v of voisins) {
    const mx = (site[0] + v[0]) / 2, my = (site[1] + v[1]) / 2, nx = v[0] - site[0], ny = v[1] - site[1];
    const dedans = p => (p[0] - mx) * nx + (p[1] - my) * ny <= 0, Q = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], ia = dedans(a), ib = dedans(b);
      if (ia) Q.push(a);
      if (ia !== ib) { const da = (a[0] - mx) * nx + (a[1] - my) * ny, db = (b[0] - mx) * nx + (b[1] - my) * ny, t = da / (da - db); Q.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    P = Q; if (P.length < 3) return null;
  }
  return P;
}

/* la calade, en étapes ; sortie : { ink: [niveaux], lav, masque } */
export function* caladeEtapes(sortie) {
  const { s0, s1, demi, K } = CAL, L = s1 - s0, W = Math.round(L * K), H = Math.round(2 * demi * K);
  const R = rng(9191), N = bruit2(9192), N2 = bruit2(9193);
  /* les sites : une grille décalée, irrégulière ; quelques sites retirés (de grandes dalles) */
  const gx = .46, gy = .4, sites = [];
  for (let i = -1; i * gx < L + gx; i++) for (let j = -1; j * gy < 2 * demi + gy; j++) {
    if (R() < .14) continue;
    sites.push([(i + .5 + (R() - .5) * .7 + (j % 2) * .3) * gx, (j + .5 + (R() - .5) * .62) * gy]);
  }
  yield;
  /* présence : éparses au début, puis le pavage complet ; plus large devant la porte ; bord irrégulier */
  const presente = (x, y) => {
    const s = s0 + x, n = y - demi, p = ss((s - 17) / 13), large = 1.02 + .1 * ss((s - 32) / 4) + .1 * (fbm(N, s / 1.7, 3.1, 2) - .5);
    return Math.abs(n) < large && R() < p * (Math.abs(n) > large - .25 ? .7 : 1);
  };
  const dalles = [];
  for (let k = 0; k < sites.length; k++) {
    const s = sites[k];
    if (s[0] < -.2 || s[0] > L + .2 || s[1] < -.2 || s[1] > 2 * demi + .2) continue;
    if (!presente(s[0], s[1])) continue;
    const v = sites.filter(t => t !== s && Math.abs(t[0] - s[0]) < 1.1 && Math.abs(t[1] - s[1]) < 1.1);
    const P = cellule(s, v, .9); if (P) dalles.push({ s, P, v: R() });
  }
  /* les voisines présentes (dans les zones pavées, les joints sont pleins) */
  dalles.forEach(d => { d.voisines = dalles.filter(e => e !== d && Math.hypot(e.s[0] - d.s[0], e.s[1] - d.s[1]) < .75).length; });
  yield;
  const ci = document.createElement('canvas'); ci.width = W; ci.height = H; const g = ci.getContext('2d');
  const cl = document.createElement('canvas'); cl.width = Math.round(W / 2); cl.height = Math.round(H / 2); const gl = cl.getContext('2d');
  const cm = document.createElement('canvas'); cm.width = cl.width; cm.height = cl.height; const gm = cm.getContext('2d');
  gl.scale(.5, .5); gm.scale(.5, .5);
  const px = p => [p[0] * K, p[1] * K];
  const chemin = (gg, Q) => { gg.beginPath(); Q.forEach((p, i) => i ? gg.lineTo(p[0], p[1]) : gg.moveTo(p[0], p[1])); gg.closePath(); };
  /* le contour d'une dalle : rentré vers son centre (le joint), arêtes subdivisées, un peu irrégulières */
  const contour = (d, rentre) => {
    const c = d.P.reduce((a, p) => [a[0] + p[0] / d.P.length, a[1] + p[1] / d.P.length], [0, 0]), Q = [];
    for (let i = 0; i < d.P.length; i++) {
      const a = d.P[i], b = d.P[(i + 1) % d.P.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / .06));
      for (let k = 0; k < n; k++) {
        const t = k / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, dx = x - c[0], dy = y - c[1], r = Math.hypot(dx, dy) || 1;
        const j = rentre + .006 * (fbm(N2, x * 9, y * 9, 2) - .5) * 2;
        Q.push(px([x - dx / r * j, y - dy / r * j]));
      }
    }
    return Q;
  };
  /* les fentes : trois dalles du pavage complet, prises au hasard */
  const pleines = dalles.filter(d => d.voisines >= 4 && d.s[0] > L - 9);
  const fendues = new Set([pleines[Math.floor(R() * pleines.length)], pleines[Math.floor(R() * pleines.length)], pleines[Math.floor(R() * pleines.length)]]);
  const LUM = [Math.SQRT1_2, -Math.SQRT1_2];   /* la lumière, en coordonnées de la bande : vers le loin (+x) et la gauche (-y) */
  for (let n = 0; n < dalles.length; n++) {
    const d = dalles[n], Q = contour(d, .013), plein = contour(d, -.004);
    /* le joint : dans le pavage, la cellule entière est d'abord ombrée (mortier, terre tassée), en hachures serrées */
    if (d.voisines >= 3) {
      g.save(); chemin(g, plein); g.clip(); g.fillStyle = ink(.07); g.fill();
      g.strokeStyle = ink(.14); g.lineWidth = 1.3; g.beginPath();
      const bb = plein.reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [1e9, 1e9, -1e9, -1e9]);
      for (let t = bb[0] - (bb[3] - bb[1]); t < bb[2]; t += 3.2) { g.moveTo(t, bb[3]); g.lineTo(t + (bb[3] - bb[1]), bb[1]); }
      g.stroke(); g.restore();
      gm.fillStyle = '#000'; chemin(gm, plein); gm.fill();
      gl.fillStyle = 'rgba(168,154,128,.4)'; chemin(gl, plein); gl.fill();
    }
    /* la dalle : le papier (elle couvre la terre), un rien plus clair ou plus sombre d'une dalle à l'autre */
    const v = Math.round(238 + d.v * 10);
    g.fillStyle = `rgb(${v},${v - 3},${v - 10})`; chemin(g, Q); g.fill();
    gm.fillStyle = '#000'; chemin(gm, Q); gm.fill();
    /* le calcaire : gris-ocre très clair, un peu différent d'une dalle à l'autre, plus pâle au centre (usé par les pas) */
    const t1 = .2 + .14 * d.v;
    gl.fillStyle = `rgba(${Math.round(216 - 12 * d.v)},${Math.round(206 - 10 * d.v)},${Math.round(182 - 4 * d.v)},${t1.toFixed(2)})`; chemin(gl, Q); gl.fill();
    /* le contact avec la terre, pour les dalles isolées : une ombre au bord proche et à droite */
    if (d.voisines < 3) { g.save(); g.translate(1.4, -1.2); g.strokeStyle = ink(.35); g.lineWidth = 2; chemin(g, Q); g.stroke(); g.restore(); }
    /* le contour à l'encre */
    /* J12 bis : le repli en code est très atténué (une simple suggestion de dalles) : contraste bas */
    g.strokeStyle = ink(.32); g.lineWidth = 1.6; g.lineJoin = 'round'; chemin(g, Q); g.stroke();
    /* l'ombre le long des bords qui tournent le dos à la lumière : trois hachures parallèles, rentrées dans la dalle */
    g.save(); chemin(g, Q); g.clip();
    const c = Q.reduce((a, p) => [a[0] + p[0] / Q.length, a[1] + p[1] / Q.length], [0, 0]);
    for (let i = 0; i < Q.length; i++) {
      const a = Q[i], b = Q[(i + 1) % Q.length], ex = b[0] - a[0], ey = b[1] - a[1], el = Math.hypot(ex, ey) || 1;
      let nx = ey / el, ny = -ex / el; if ((a[0] - c[0]) * nx + (a[1] - c[1]) * ny < 0) { nx = -nx; ny = -ny; }   /* normale sortante */
      const ombre = -(nx * LUM[0] + ny * LUM[1]);
      if (ombre <= .15) continue;
      g.lineWidth = 1.3;
      [2.6, 5.4, 8.2, 11].forEach((o, k) => { if (k > ombre * 1.5) return; g.strokeStyle = ink((.2 - k * .05) * ombre); g.beginPath(); g.moveTo(a[0] - nx * o, a[1] - ny * o); g.lineTo(b[0] - nx * o, b[1] - ny * o); g.stroke(); });
    }
    /* la pierre : quelques piqûres, une ou deux petites hachures */
    const bb = Q.reduce((b2, p) => [Math.min(b2[0], p[0]), Math.min(b2[1], p[1]), Math.max(b2[2], p[0]), Math.max(b2[3], p[1])], [1e9, 1e9, -1e9, -1e9]);
    for (let k = 0; k < 9 + R() * 10; k++) { g.fillStyle = ink(.18 + R() * .25); g.beginPath(); g.arc(bb[0] + R() * (bb[2] - bb[0]), bb[1] + R() * (bb[3] - bb[1]), .5 + R() * .9, 0, Math.PI * 2); g.fill(); }
    if (R() < .5) { g.strokeStyle = ink(.25); g.lineWidth = .8; const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]); g.beginPath(); for (let k = 0; k < 4; k++) { g.moveTo(x + k * 2.4, y); g.lineTo(x + k * 2.4 + 5, y - 4); } g.stroke(); }
    /* la fente : une ligne brisée d'un bord à l'autre, son ombre fine à côté */
    if (fendues.has(d)) {
      const a0 = Q[0], b0 = Q[Math.floor(Q.length / 2)], pts = [];
      for (let k = 0; k <= 7; k++) { const t = k / 7; pts.push([a0[0] + (b0[0] - a0[0]) * t + (R() - .5) * 7 * Math.sin(Math.PI * t), a0[1] + (b0[1] - a0[1]) * t + (R() - .5) * 7 * Math.sin(Math.PI * t)]); }
      g.strokeStyle = ink(.85); g.lineWidth = 1.4; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
      g.strokeStyle = ink(.3); g.lineWidth = 1; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0] + 1.6, p[1] + 1.4) : g.moveTo(p[0] + 1.6, p[1] + 1.4)); g.stroke();
      gl.strokeStyle = 'rgba(110,96,76,.6)'; gl.lineWidth = 2; gl.beginPath(); pts.forEach((p, i) => i ? gl.lineTo(p[0], p[1]) : gl.moveTo(p[0], p[1])); gl.stroke();
    }
    g.restore();
    if (n % 18 === 17) yield;
  }
  yield;
  /* les finesses (une version réduite pour le loin) */
  const niveaux = [ci]; let cur = ci;
  for (let k = 0; k < 2; k++) { const d = document.createElement('canvas'); d.width = Math.max(2, cur.width >> 1); d.height = Math.max(2, cur.height >> 1); const dg = d.getContext('2d'); dg.imageSmoothingQuality = 'high'; dg.drawImage(cur, 0, 0, d.width, d.height); niveaux.push(d); cur = d; yield; }
  sortie.ink = niveaux; sortie.lav = cl; sortie.masque = cm; sortie.W = W; sortie.H = H;
}

/* =====================================================================
   J12 bis (dixième passe) : la calade gravée de Thibaut. La tuile
   calade (encre seule, raccordable, 2,40 m de côté comme sol-chemin) et
   sa carte d'ordre calade-ordre (le rang d'apparition de chacune des 46
   dalles, joints compris) remplacent les dalles dessinées en code. Sur la
   même bande que la calade en code (coordonnées du chemin de l'atelier),
   calculée une fois pendant les temps morts :
   - le seuil monte le long du chemin : 0 (terre nue) à 17 m du
     croisement, 1 (pavage complet) à 33 m, avant la porte (37 m) ; une
     dalle paraît là où son rang est sous le seuil, entière, avec ses
     joints : quelques dalles dans la terre, puis de plus en plus, puis le
     pavage ; de part et d'autre, le seuil baisse au bord du chemin (les
     dalles s'arrêtent sur leur propre contour, jamais sur une ligne) ;
   - à l'encre : le papier de la pierre (il couvre la terre) et l'encre
     de la tuile, teintée comme celle du sol ;
   - dans le calque des lavis : le calcaire gris-ocre clair, un peu
     différent d'une dalle à l'autre (le rang sert de tirage), et le
     masque qui efface sous les dalles le lavis de la terre.
   Le masque est calculé à la demi-résolution de la bande (bord adouci
   d'environ un texel de la tuile, par l'interpolation de la carte).
   ===================================================================== */
const PAPIER_PIERRE = '#f3efe6';
const CALCAIRE = [226, 216, 196];
export const CALT = { K: 160, tuile: 2.4, debut: 17, plein: 33 };
const seuilA = s => { const t = clamp((s - CALT.debut) / (CALT.plein - CALT.debut)); return t * t * (3 - 2 * t); };
/* P4 (seizième passe) : ordrePx, la carte d'ordre déjà décodée et relue par l'ouvrier ({ w, h, data }) : la décoder et la relire
   ici prenait 5 à 46 ms d'un bloc ; la boucle des colonnes rend la main toutes les 30 colonnes (au lieu de 120 : 3 à 12 ms
   par étape) et le masque et la couleur sont posés par quarts */
export function* caladeTuileEtapes(sortie, vT, ordreImg, ordrePx) {
  /* N1 (quatorzième passe) : sur téléphone, la bande à 80 px par mètre (160 sur ordinateur) : quatre fois moins de pixels à
     calculer et à garder (6,5 Mo devenus 1,6 pour l'encre) */
  const { s0, s1, demi } = CAL, K = TEL ? CALT.K / 2 : CALT.K, L = s1 - s0, W = Math.round(L * K), H = Math.round(2 * demi * K), W2 = Math.round(W / 2), H2 = Math.round(H / 2);
  /* la carte d'ordre, lue une fois (en mémoire) */
  let oc = null, od, OW, OH;
  if (ordrePx) { od = ordrePx.data; OW = ordrePx.w; OH = ordrePx.h; }
  else {
    oc = document.createElement('canvas'); oc.width = ordreImg.naturalWidth || ordreImg.width; oc.height = ordreImg.naturalHeight || ordreImg.height;
    const og = oc.getContext('2d', { willReadFrequently: true }); og.drawImage(ordreImg, 0, 0);
    yield;
    od = og.getImageData(0, 0, oc.width, oc.height).data; OW = oc.width; OH = oc.height;
    yield;
  }
  /* la tuile teintée à l'encre de la gravure (comme sol-chemin) */
  const tt = document.createElement('canvas'); tt.width = vT.w; tt.height = vT.h; const tg = tt.getContext('2d');
  tg.drawImage(vT.image, 0, 0); tg.globalCompositeOperation = 'source-atop'; tg.fillStyle = `rgba(${ENCRE[0]},${ENCRE[1]},${ENCRE[2]},.55)`; tg.fillRect(0, 0, tt.width, tt.height);
  tg.globalCompositeOperation = 'multiply'; tg.fillStyle = '#f6f3ea'; tg.fillRect(0, 0, tt.width, tt.height);
  tg.globalCompositeOperation = 'destination-in'; tg.drawImage(vT.image, 0, 0);
  yield;
  /* le masque et la couleur du calcaire, à la demi-résolution, colonne par colonne */
  const mc = document.createElement('canvas'); mc.width = W2; mc.height = H2; const mg = mc.getContext('2d');
  const lc = document.createElement('canvas'); lc.width = W2; lc.height = H2; const lgc = lc.getContext('2d');
  const mi = mg.createImageData(W2, H2), li = lgc.createImageData(W2, H2), md = mi.data, ld = li.data;
  const T = CALT.tuile, kx = OW / T, ky = OH / T;
  /* K5 (onzième passe) : plus de motif répété. La grille des tuiles (2,40 m) est fixe au sol (cellule cx le long du
     chemin depuis s = 0, cy en travers depuis le bord gauche de la bande) ; chaque cellule reçoit une transformation fixe
     tirée de son indice : un miroir par colonne de cellules (le long du chemin) et un miroir par rangée (en travers), et
     donc, quand les deux se cumulent, la rotation de 180 degrés. Ce sont les seules des huit transformations du carré qui
     raccordent toujours cette tuile à ses voisines : elle raccorde sa droite à sa gauche et son haut à son bas, pas un
     bord à un bord tourné, et ses dalles chevauchent les bords (une rotation de 90 degrés ou un miroir par cellule isolée
     couperaient des dalles net au bord des cellules). La même transformation s'applique à l'encre et à la carte d'ordre
     (les dalles restent entières). L'ordre d'apparition est en plus étiré et décalé par deux champs doux du sol (2 m,
     continus d'une cellule à l'autre : un réglage par cellule coupait net les dalles à cheval sur deux cellules), qui
     défont aussi la symétrie des trous de part et d'autre d'un miroir : les premières dalles ne sont plus les mêmes ni
     au même endroit d'une cellule à l'autre, sans défaire l'ordre d'une dalle et de ses joints. Chaque dalle a son ton
     (plus ou moins 4 %), tiré de son rang et d'un champ doux du sol (le même des deux côtés d'un bord de cellule). */
  const NO = bruit2(5151), NA = bruit2(5153), NT = bruit2(5157);
  const cellule = (s, n) => {
    const cx = Math.floor(s / T), cy = Math.floor((n + demi) / T);
    return { cx, cy, mx: hash(cx, 7101) < .5, my: hash(cy, 7103) < .5 };
  };
  /* coordonnées dans la tuile (px) d'un point du sol, transformation de sa cellule comprise */
  const local = (s, n, c) => { let x = (s - c.cx * T) * kx, y = (n + demi - c.cy * T) * ky; if (c.mx) x = OW - x; if (c.my) y = OH - y; return [Math.min(OW - 1.001, Math.max(0, x)), Math.min(OH - 1.001, Math.max(0, y))]; };
  const ordre = (x, y) => {   /* bilinéaire, bords bloqués (la cellule voisine est son miroir ou sa suite) */
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, x1 = Math.min(OW - 1, x0 + 1), y1 = Math.min(OH - 1, y0 + 1);
    return od[(y0 * OW + x0) * 4] * (1 - fx) * (1 - fy) + od[(y0 * OW + x1) * 4] * fx * (1 - fy) + od[(y1 * OW + x0) * 4] * (1 - fx) * fy + od[(y1 * OW + x1) * 4] * fx * fy;
  };
  const ordreN = (x, y) => od[(Math.round(y) * OW + Math.round(x)) * 4];
  /* K5 : les rangs des dalles qui touchent un bord de la tuile (elles se prolongent dans la cellule voisine) */
  const deBord = new Set();
  for (let i = 0; i < OW; i++) { deBord.add(od[i * 4]); deBord.add(od[((OH - 1) * OW + i) * 4]); }
  for (let j = 0; j < OH; j++) { deBord.add(od[(j * OW) * 4]); deBord.add(od[(j * OW + OW - 1) * 4]); }
  /* K5 : l'ordre décalé par cellule, modulo 255 : chaque cellule a son propre décalage (les premières dalles ne sont plus
     les mêmes d'une cellule à l'autre) ; une dalle qui touche un bord de la tuile garde un décalage commun à toutes les
     cellules (elle doit apparaître d'un bloc des deux côtés du bord) */
  const decaleCell = c => Math.floor(255 * hash(c.cx * 131 + c.cy * 17, 7121));
  const decalage = (r, c) => ((r + (deBord.has(r) ? 37 : decaleCell(c))) % 255) - r;
  /* l'ordre tiré, interpolé entre les quatre texels voisins (chacun tiré d'abord : pas de halo entre deux dalles) */
  const ordreT = (x, y, c) => {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, x1 = Math.min(OW - 1, x0 + 1), y1 = Math.min(OH - 1, y0 + 1);
    const f = (xx, yy) => { const r = od[(yy * OW + xx) * 4]; return r + decalage(r, c); };
    return f(x0, y0) * (1 - fx) * (1 - fy) + f(x1, y0) * fx * (1 - fy) + f(x0, y1) * (1 - fx) * fy + f(x1, y1) * fx * fy;
  };
  let tq = performance.now();
  for (let bx = 0; bx < W2; bx++) {
    const s = s0 + (bx + .5) / (K / 2), S = seuilA(s), large = 1.0 + .3 * clamp((s - 31) / 4);
    for (let by = 0; by < H2; by++) {
      const n = (by + .5) / (K / 2) - demi, c = cellule(s, n), [u, v] = local(s, n, c);
      /* au bord du chemin, le seuil baisse : les dalles s'arrêtent sur leur contour */
      const bord = clamp((Math.abs(n) - large) / .35), Se = S * (1 - bord * bord * (3 - 2 * bord)) * 254;
      /* K5 : l'ordre de la cellule, étiré, décalé et modulé par un champ doux (2 m), jamais retourné */
      const o = clamp(ordreT(u, v, c) * (.86 + .2 * fbm(NA, s / 2.3 + 7, n / 2.3, 2)) + 36 * (fbm(NO, s / 1.9, n / 1.9, 2) - .5) + 6, 0, 254), a = clamp((Se - o) / 7 + .5);
      const i = (by * W2 + bx) * 4;
      md[i + 3] = a * 255;
      if (a > 0) {
        /* le calcaire : un ton par dalle (son rang et sa cellule servent de tirage, plus ou moins 4 %) */
        const r = ordreN(u, v), t = .55 * (hash(r * 31, 5) - .5) + .9 * (fbm(NT, s / 1.6, n / 1.6, 2) - .5);
        ld[i] = CALCAIRE[0] * (1 + .08 * t); ld[i + 1] = CALCAIRE[1] * (1 + .075 * t); ld[i + 2] = CALCAIRE[2] * (1 + .06 * t - .02); ld[i + 3] = a * 255 * .55;
      }
    }
    /* P4 bis : une étape toutes les 3 ms (et non plus toutes les 30 colonnes : les premières, avant que le moteur ne les
       compile, prenaient 12 ms dans WebKit) */
    if (performance.now() - tq > 3) { yield; tq = performance.now(); }
  }
  /* P4 bis : en huit morceaux, et le masque et le lavis chacun dans son étape (le premier quart : 11 ms dans WebKit) ; des
     étapes LOURD (voir lavis.js : l'envoi se fait après l'étape ; cinq morceaux dans la même tranche faisaient une image de
     43 ms dans WebKit) */
  for (let q = 0; q < 8; q++) { const x0 = Math.floor(W2 * q / 8), x1 = Math.floor(W2 * (q + 1) / 8); mg.putImageData(mi, 0, 0, x0, 0, x1 - x0, H2); yield LOURD; lgc.putImageData(li, 0, 0, x0, 0, x1 - x0, H2); yield LOURD; }
  /* l'encre : le papier de la pierre et la tuile, gardés là où le masque l'autorise */
  const ci = document.createElement('canvas'); ci.width = W; ci.height = H; const g = ci.getContext('2d');
  g.fillStyle = PAPIER_PIERRE; g.fillRect(0, 0, W, H);
  /* K5 : la tuile posée cellule par cellule, avec la transformation de sa cellule (la même que pour la carte d'ordre) ;
     u (le long du chemin) sur l'axe x de la bande, v (en travers) sur l'axe y ; la grille commence à s = 0 */
  const TK = T * K;
  for (let cx = Math.floor(s0 / T); cx * T < s1; cx++) for (let cy = 0; cy * T < 2 * demi; cy++) {
    const c = cellule(cx * T + .01, cy * T - demi + .01), X = (cx * T - s0) * K, Y = cy * TK;
    g.save(); g.beginPath(); g.rect(X, Y, TK, TK); g.clip();
    g.translate(X + (c.mx ? TK : 0), Y + (c.my ? TK : 0)); g.scale(c.mx ? -1 : 1, c.my ? -1 : 1);
    g.drawImage(tt, 0, 0, TK, TK); g.restore();
  }
  g.globalCompositeOperation = 'destination-in'; g.imageSmoothingEnabled = true; g.drawImage(mc, 0, 0, W, H);
  /* P4 bis : l'encre et ses réductions sont des étapes LOURD (voir lavis.js : 8 ms au processus graphique de WebKit) */
  yield LOURD;
  const niveaux = [ci]; let cur = ci;
  for (let j = 0; j < 2; j++) { const d = document.createElement('canvas'); d.width = Math.max(2, cur.width >> 1); d.height = Math.max(2, cur.height >> 1); const dg = d.getContext('2d'); dg.imageSmoothingQuality = 'high'; dg.drawImage(cur, 0, 0, d.width, d.height); niveaux.push(d); cur = d; yield LOURD; }
  sortie.ink = niveaux; sortie.lav = lc; sortie.masque = mc; sortie.K = K; sortie.W = W; sortie.H = H;
  /* N1 : la carte d'ordre et la tuile teintée (deux canevas de travail de 4 Mo) rendent leur mémoire tout de suite */
  liberer(tt); if (oc) liberer(oc);
}
