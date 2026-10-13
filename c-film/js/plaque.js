/* =====================================================================
   H5 (huitième passe, 04/10/2026) : la plaque « Atelier Civik-ia », une
   dalle de calcaire scellée dans le pilier de pierre de gauche, avec un
   joint de mortier autour, et les lettres gravées en creux, en V, comme
   par un tailleur de pierre.
   La pierre est la photo plaque-atelier.webp (son centre seulement : ni
   les vis ni le bord arrondi). La gravure est calculée pixel par pixel :
   - le masque des lettres (Georgia, ou Times), lettre par lettre ;
   - la distance de chaque point du creux au bord de la lettre (distance
     euclidienne exacte) : c'est la profondeur d'une taille en V (le fond
     du V sur l'axe du trait, les traits épais plus profonds que les
     déliés, comme au ciseau) ;
   - la normale de chaque paroi, éclairée par la lumière de la scène, en
     haut à gauche : la paroi côté haut gauche est dans l'ombre, celle du
     côté bas droit prend la lumière ; le fond est plus sombre et plus
     grenu ; un filet d'ombre et un filet de lumière sur les arêtes.
   Aucun texte plat, aucun filtre : le relief est dans les pixels.

   J4 (dixième passe, 04/10/2026) : écorchée et en relief. Une plaque
   entretenue, exposée dehors depuis trente ans, pas une ruine :
   - la dalle est en saillie de 2,5 cm : sa tranche se voit en bas et à
     droite (pierre plus sombre, sciée, grenue), elle porte une ombre nette
     sur le mur en bas et à droite (lumière en haut à gauche) ; un filet de
     lumière court sur l'arête du haut et de gauche, les arêtes sont
     émoussées ;
   - le joint de mortier est irrégulier, en léger creux, avec des éclats ;
   - deux coins épaufrés (un éclat franc en bas à droite, un petit en haut
     à gauche), la cassure plus claire et rugueuse ;
   - des traînées de pluie sous les lettres et sous l'arête du haut, trois
     taches de lichen gris-vert (deux près des coins, une petite sur le
     bord droit), une tache d'humidité en bas à gauche, de la poussière
     claire au fond des creux ;
   - des lettres au fond un peu irrégulier (la profondeur varie le long
     du trait, quelques coups de ciseau plus profonds), une gravure plus
     contrastée (paroi d'ombre plus sombre, arête de lumière plus franche)
     pour se lire comme creusée même à 70 px de large.
   La graine est fixe : la plaque est toujours la même. Le calcul (environ
   0,3 s en tout) n'est plus sur le chemin du démarrage : il se fait par
   petites tâches pendant les temps morts (plaqueEtapes), et la plaque
   paraît quand elle est prête.
   ===================================================================== */
import { clamp, rng, bruit2, fbm } from './outils.js';

/* la zone de la photo gardée (fractions) : sous les vis, à l'intérieur du bord arrondi */
const CADRE = [.135, .262, .865, .925];
const SW = 1200, SH = 686, J = 26;   /* la dalle (px du canevas) et le joint de mortier autour */
/* J4 : à droite et en bas, la place de la tranche (saillie) et de l'ombre portée sur le mur */
const MD = 74, MB = 74;
export const PLAQUE_CANEVAS = [SW + J + MD, SH + J + MB];
export const PLAQUE_DALLE = [SW, SH];
/* le coin haut gauche de la dalle dans le canevas */
export const PLAQUE_ORIGINE = [J, J];
/* J4 : la saillie vue de la route (de droite et d'en bas) et l'ombre portée (lumière haut gauche), en px du canevas */
const TR = [15, 8], OMB = [34, 38];

/* distance euclidienne exacte au carré (Felzenszwalb et Huttenlocher), en place sur g (w x h) : 0 = bord, grand = dedans */
function* edtEtapes(g, w, h) {
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
  for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = g[y * w + x]; passe(h); for (let y = 0; y < h; y++) g[y * w + x] = d[y]; if (x % 160 === 159) yield; }
  for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = g[y * w + x]; passe(w); for (let x = 0; x < w; x++) g[y * w + x] = d[x]; if (y % 90 === 89) yield; }
}

/* la pierre : le centre de la photo, ramené vers le ton du pilier (une pierre taillée, plus pâle que le moellon) */
/* démarrage (dixième passe) : en étapes (la moyenne sur une image réduite, puis la teinte par quarts de la dalle) */
function* pierre(src, ton, sortie) {
  const c = document.createElement('canvas'); c.width = SW; c.height = SH;
  const g = c.getContext('2d', { willReadFrequently: true });
  const sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
  g.drawImage(src, CADRE[0] * sw, CADRE[1] * sh, (CADRE[2] - CADRE[0]) * sw, (CADRE[3] - CADRE[1]) * sh, 0, 0, SW, SH);
  sortie.c = c;
  yield;
  if (ton) {
    const r = document.createElement('canvas'); r.width = 60; r.height = 34; const rg = r.getContext('2d', { willReadFrequently: true }); rg.drawImage(c, 0, 0, 60, 34);
    const dm = rg.getImageData(0, 0, 60, 34).data;
    let m = [0, 0, 0], n = 0;
    for (let i = 0; i < dm.length; i += 4) { m[0] += dm[i]; m[1] += dm[i + 1]; m[2] += dm[i + 2]; n++; }
    m = m.map(x => x / n);
    /* garder la clarté de la dalle (pierre taillée) à 87 % ; prendre une part de la teinte du pilier */
    const lumP = (ton[0] + ton[1] + ton[2]) / 3, lumD = (m[0] + m[1] + m[2]) / 3;
    const k = [0, 1, 2].map(i => (1 - .6) + .6 * (ton[i] / lumP) / (m[i] / lumD));
    const e = .87;
    for (let q = 0; q < 4; q++) {
      yield;
      const y0 = Math.round(SH * q / 4), y1 = Math.round(SH * (q + 1) / 4), im = g.getImageData(0, y0, SW, y1 - y0), d = im.data;
      for (let i = 0; i < d.length; i += 4) { d[i] = clamp(d[i] * k[0] * e, 0, 255); d[i + 1] = clamp(d[i + 1] * k[1] * e, 0, 255); d[i + 2] = clamp(d[i + 2] * k[2] * e, 0, 255); }
      g.putImageData(im, 0, y0);
    }
  }
}

/* les lignes du texte : « ATELIER » petit, « Civik-ia » grand, centrés ; renvoie les lettres posées (x, ligne) */
function poserTexte(g) {
  const POL = 'Georgia, "Times New Roman", Times, serif';
  const lignes = [{ t: 'ATELIER', esp: .14, larg: .5 }, { t: 'Civik-ia', esp: .10, larg: .84 }];
  lignes.forEach(L => {
    g.font = `400 100px ${POL}`;
    const w100 = Array.from(L.t).reduce((s, c) => s + g.measureText(c).width, 0) + 100 * L.esp * (L.t.length - 1);
    L.taille = 100 * SW * L.larg / w100;
    g.font = `400 ${L.taille.toFixed(1)}px ${POL}`;
    const mm = g.measureText(L.t);
    L.asc = mm.actualBoundingBoxAscent; L.desc = mm.actualBoundingBoxDescent;
    L.lettres = []; let x = 0;
    Array.from(L.t).forEach(c => { const cw = g.measureText(c).width; L.lettres.push({ c, x, w: cw }); x += cw + L.taille * L.esp; });
    L.w = x - L.taille * L.esp;
  });
  /* l'interligne : 0,42 de la hauteur de capitale de la grande ligne */
  const ecart = lignes[1].asc * .42, total = lignes[0].asc + lignes[0].desc + ecart + lignes[1].asc + lignes[1].desc;
  let y = (SH - total) / 2;
  lignes.forEach(L => { y += L.asc; L.base = y; L.x0 = (SW - L.w) / 2; y += L.desc + ecart; });
  return { lignes, POL };
}

/* J4 : le contour de la dalle, arêtes à peine irrégulières, deux coins épaufrés (un éclat franc en bas à droite, un
   petit en haut à gauche) ; en coordonnées de la dalle */
function contourDalle(N2) {
  const pts = [], pas = 10, b = (t, k) => (fbm(N2, t / 22 + k * 13, k, 2) - .5) * 4;
  /* l'éclat du coin bas droit (un morceau parti, la cassure en ligne brisée) et celui du coin haut gauche */
  const ecBD = [[SW - 58, SH], [SW - 44, SH - 9], [SW - 27, SH - 15], [SW - 16, SH - 28], [SW - 5, SH - 33], [SW, SH - 41]];
  const ecHG = [[0, 22], [6, 17], [9, 9], [15, 4], [23, 0]];
  for (let x = 23; x <= SW; x += pas) pts.push([x, b(x, 1)]);
  for (let y = 0; y <= SH - 41; y += pas) pts.push([SW + b(y, 2), y]);
  ecBD.slice().reverse().forEach(p => pts.push(p));
  for (let x = SW - 58; x >= 0; x -= pas) pts.push([x, SH + b(x, 3)]);
  for (let y = SH; y >= 22; y -= pas) pts.push([b(y, 4), y]);
  ecHG.forEach(p => pts.push(p));
  return { pts, ecBD, ecHG };
}
const chemin = (g, pts, dx = 0, dy = 0) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x + dx, y + dy) : g.moveTo(x + dx, y + dy)); g.closePath(); };

/* la plaque gravée, en étapes de quelques millisecondes ; le canevas final est posé dans sortie.c */
export function* plaqueEtapes(src, ton, sortie) {
  const R = rng(5150), N = bruit2(5151), N2 = bruit2(5152), N3 = bruit2(5153);
  yield;
  const sp = {}; yield* pierre(src, ton, sp);
  const pi = sp.c, gp = pi.getContext('2d', { willReadFrequently: true });
  yield;
  /* ---- le masque des lettres, et l'indice de la lettre (profondeur propre à chaque lettre) ---- */
  const mc = document.createElement('canvas'); mc.width = SW; mc.height = SH;
  const mg = mc.getContext('2d', { willReadFrequently: true });
  mg.fillStyle = '#000'; mg.fillRect(0, 0, SW, SH);
  const { lignes, POL } = poserTexte(mg);
  const prof = [];   /* profondeur relative de chaque lettre (0,88 à 1,1) */
  let idx = 0;
  lignes.forEach(L => {
    mg.font = `400 ${L.taille.toFixed(1)}px ${POL}`; mg.textBaseline = 'alphabetic';
    L.lettres.forEach(l => {
      idx++; prof[idx] = .88 + R() * .22;
      /* l'indice de la lettre dans le canal vert, la couverture dans le rouge */
      mg.fillStyle = `rgb(255,${idx},0)`;
      mg.fillText(l.c, L.x0 + l.x + (R() - .5) * 1.2, L.base + (R() - .5) * 1.4);
    });
  });
  const md = mg.getImageData(0, 0, SW, SH).data;
  yield;
  /* ---- la distance au bord (le creux en V) ---- */
  const n = SW * SH, A = new Float32Array(n), D = new Float64Array(n), LI = new Uint8Array(n);
  /* le bord de taille, à peine irrégulier : un bruit fin décale le seuil de la couverture */
  for (let y = 0; y < SH; y++) {
    for (let x = 0; x < SW; x++) {
      const i = y * SW + x, a = md[i * 4] / 255;
      const j = (fbm(N, x / 7, y / 7, 2) - .5) * .5;
      A[i] = clamp(a + j * (a > .02 && a < .98 ? 1 : .35));
      LI[i] = md[i * 4 + 1];
      D[i] = A[i] > .5 ? 1e20 : 0;
    }
    if (y % 20 === 19) yield;
  }
  yield* edtEtapes(D, SW, SH);
  /* J4 : le fond des lettres n'est pas régulier : la profondeur varie le long du trait (le ciseau n'entre pas partout
     pareil), et quelques coups de ciseau sont plus profonds (de petites fosses dans le fond du V) */
  const coups = [];
  for (let t = 0; t < 400 && coups.length < 9; t++) { const x = 40 + R() * (SW - 80), y = 40 + R() * (SH - 80), i = (y | 0) * SW + (x | 0); if (D[i] > 30) coups.push([x, y, 6 + R() * 7, .3 + R() * .3]); }
  const Dd = new Float32Array(n);
  for (let y = 0; y < SH; y++) {
    for (let x = 0; x < SW; x++) {
      const i = y * SW + x; if (D[i] <= 0) continue;
      let k = 1 + (fbm(N3, x / 34, y / 34, 2) - .5) * .5;
      for (const [cx, cy, r, a] of coups) { const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy); if (d2 < 9 * r * r) k += a * Math.exp(-d2 / (r * r)); }
      Dd[i] = Math.max(0, Math.sqrt(D[i]) - .5 + (A[i] - .5)) * k;
    }
    if (y % 20 === 19) yield;
  }
  /* lissé d'un pixel (le fond du V reste net à l'œil, les marches de la grille disparaissent) */
  const Ds = new Float32Array(n);
  for (let y = 1; y < SH - 1; y++) { for (let x = 1; x < SW - 1; x++) {
    const i = y * SW + x;
    Ds[i] = (Dd[i] * 4 + Dd[i - 1] + Dd[i + 1] + Dd[i - SW] + Dd[i + SW]) / 8;
  } if (y % 200 === 199) yield; }
  yield;
  /* J4 : les traînées de pluie. L'eau qui coule des creux des lettres et de l'arête du haut emporte la poussière : des
     coulures grises, plus marquées juste sous la lettre, qui s'effacent en descendant, en filets irréguliers. */
  const PL = new Float32Array(n);
  {
    /* des coulures rares et douces : une colonne sur trois ou quatre, au profil arrondi, d'intensité variable */
    const brut = new Float32Array(SW), largeur = new Float32Array(SW);
    for (let x = 0; x < SW; x++) brut[x] = clamp((fbm(N2, x / 11, 3.3, 3) - .56) * 4.5) * (.4 + .6 * fbm(N3, x / 60, 9.1, 2));
    for (let x = 0; x < SW; x++) { let s2 = 0, w2 = 0; for (let k = -4; k <= 4; k++) { const xx = x + k; if (xx < 0 || xx >= SW) continue; const wk = 1 - Math.abs(k) / 5; s2 += brut[xx] * wk; w2 += wk; } largeur[x] = s2 / w2; }
    for (let x = 0; x < SW; x++) {
      let s = .75 * largeur[x];   /* sous l'arête du haut (l'eau du débord du toit), puis sous les lettres */
      for (let y = 0; y < SH; y++) {
        const i = y * SW + x;
        if (A[i] > .5) s = 0;   /* dans la lettre : pas de coulure (le creux) */
        else {
          if (y > 0 && A[i - SW] > .5) s = Math.max(s, largeur[x]);   /* sous une lettre : la coulure part */
          PL[i] = s;
          s *= .9945 - .005 * (1 - largeur[x]);
        }
      }
      if (x % 60 === 59) yield;
    }
  }
  /* ---- l'éclairage de la gravure et le vieillissement de la face ---- */
  /* la lumière de la scène : haut gauche, assez basse (le soleil du matin) */
  const L0 = [-.56, -.6, .57], ln = Math.hypot(...L0), L = L0.map(v => v / ln);
  const PENTE = 1.7, AMB = .22, DIF = .78, PLAT = AMB + DIF * L[2];
  const im = gp.getImageData(0, 0, SW, SH), d = im.data;
  /* le bord de la tache d'humidité ne dépend que de x (son haut) et de y (son flanc droit) */
  const huX = new Float32Array(SW), huY = new Float32Array(SH);
  for (let x = 0; x < SW; x++) huX[x] = SH * .7 + (fbm(N3, x / 70, 2.7, 3) - .5) * 120;
  for (let y = 0; y < SH; y++) huY[y] = SW * .36 + (fbm(N2, y / 50, 7.7, 2) - .5) * 140;
  for (let y = 0; y < SH; y++) {
    for (let x = 0; x < SW; x++) {
      const i = y * SW + x, p = i * 4, a = A[i];
      let r = d[p], gg = d[p + 1], b = d[p + 2];
      /* la gravure */
      if ((a > .01 || Dd[i] > 0) && x > 0 && y > 0 && x < SW - 1 && y < SH - 1) {
        const kL = prof[LI[i]] || 1;
        const gx = (Ds[i + 1] - Ds[i - 1]) * .5, gy = (Ds[i + SW] - Ds[i - SW]) * .5, gl = Math.hypot(gx, gy) || 1;
        const s = PENTE * kL * Math.min(1, gl);
        let nx = s * gx / gl, ny = s * gy / gl, nz = 1; const nn = Math.hypot(nx, ny, nz); nx /= nn; ny /= nn; nz /= nn;
        const dl = nx * L[0] + ny * L[1] + nz * L[2];
        let lum = (AMB + DIF * Math.max(0, dl)) / PLAT;
        const prof01 = clamp(Dd[i] / 15);
        /* le fond du creux, plus sombre (moins de lumière y descend) et plus grenu */
        lum *= 1 - .36 * prof01 * kL;
        const grain = (fbm(N2, x / 2.2, y / 2.2, 2) - .5) * .3 + (R() - .5) * .12;
        lum *= 1 + grain * (.5 + prof01);
        /* les arêtes : un filet d'ombre côté haut gauche, un filet de lumière côté bas droit (plus francs) */
        const arete = 1 - clamp(Dd[i] / 2.6);
        const face = -(gx * L[0] + gy * L[1]) / gl;   /* > 0 : la paroi regarde la lumière (côté bas droit) */
        if (face > 0) lum = lum * (1 + .3 * arete * face) + .13 * arete * face; else lum *= 1 - .34 * arete * -face;
        let r2 = r * lum, g2 = gg * lum, b2 = b * lum;
        /* la poussière claire, déposée au fond des creux, sur les parois qui regardent vers le haut */
        if (prof01 > .22) {
          const pp = fbm(N, x / 3.1 + 40, y / 3.1, 3), haut = clamp(-gy / gl * 1.4 + .35);
          const k = clamp((pp - .5) * 3.2) * haut * prof01 * .62;
          if (k > 0) { r2 += (234 - r2) * k; g2 += (226 - g2) * k; b2 += (206 - b2) * k; }
        }
        /* au bord, la couverture mêle la surface et la paroi */
        const m = clamp((a - .15) / .7);
        r += (r2 - r) * m; gg += (g2 - gg) * m; b += (b2 - b) * m;
      }
      /* les traînées de pluie : un gris un peu brun, plus sombre, qui suit la coulure */
      const pl = PL[i];
      if (pl > .01) { const k = clamp(pl) * (.1 + .12 * fbm(N3, x / 4, y / 55, 2)); r *= 1 - k; gg *= 1 - k * .97; b *= 1 - k * .92; }
      /* la pierre piquée par trente hivers : de petits pores sombres, et des marbrures à peine plus ocres */
      const po = fbm(N, x / 1.7 + 77, y / 1.7, 2);
      if (po > .74) { const k = clamp((po - .74) * 6) * .32; r *= 1 - k; gg *= 1 - k; b *= 1 - k * .95; }
      const mb = fbm(N2, x / 140 + 5, y / 90, 3) - .5; r *= 1 + mb * .06; b *= 1 - mb * .06;
      /* la tache d'humidité, en bas à gauche : la pierre plus sombre et un peu plus froide, au bord irrégulier */
      const hu = y > SH * .55 ? clamp((y - huX[x]) / 70) * clamp(1 - (x - huY[y]) / 160) : 0;
      if (hu > 0) { const k = hu * .17; r *= 1 - k * 1.05; gg *= 1 - k; b *= 1 - k * .9; }
      /* trente ans dehors : un voile un peu plus terne en bas (l'eau), et la crasse qui s'accroche le long des bords */
      const bordD = Math.min(x, SW - 1 - x, y * 1.4, (SH - 1 - y) * .8), cr = clamp(1 - bordD / (46 + 40 * fbm(N3, x / 40, y / 40, 2))) * .14;
      const v = (1 - .09 * Math.pow(y / SH, 2.2)) * (1 + (fbm(N, x / 90, y / 60, 3) - .5) * .09) * (1 - cr);
      d[p] = clamp(r * v, 0, 255); d[p + 1] = clamp(gg * v, 0, 255); d[p + 2] = clamp(b * v * .99, 0, 255);
    }
    if (y % 5 === 4) yield;
  }
  gp.putImageData(im, 0, 0);
  yield;
  /* J4 : trois taches de lichen crustacé gris-vert (près du coin bas gauche, du coin haut droit, une petite sur le bord
     droit) : des aréoles serrées, de taille et de teinte inégales, plus pâles au bord de la colonie, quelques
     fructifications sombres ; jamais dans les lettres */
  {
    const lc = document.createElement('canvas'); lc.width = SW; lc.height = SH; const lg = lc.getContext('2d');
    for (const [cx, cy, rr] of [[92, SH - 96, 62], [SW - 122, 82, 48], [SW - 26, SH * .5, 24]]) {
      /* la forme de la colonie : un disque déformé, au bord lobé */
      const forme = a => rr * (.6 + .55 * fbm(N3, Math.cos(a) * 1.3 + cx * .01, Math.sin(a) * 1.3 + cy * .01, 3) + .06 * Math.sin(a * 7 + cx));
      const x0 = Math.max(0, Math.floor(cx - rr * 1.4)), x1 = Math.min(SW, Math.ceil(cx + rr * 1.4)), y0 = Math.max(0, Math.floor(cy - rr * 1.3)), y1 = Math.min(SH, Math.ceil(cy + rr * 1.3));
      const id = lg.createImageData(x1 - x0, y1 - y0), q = id.data;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const dx = x - cx, dy = (y - cy) / .8, dd = Math.hypot(dx, dy), b = forme(Math.atan2(dy, dx)); if (dd > b) continue;
        const t = dd / b, j = ((y - y0) * (x1 - x0) + (x - x0)) * 4;
        /* le thalle : gris olive mat, marbré ; des craquelures (aréoles) plus sombres ; le bord de la colonie plus pâle */
        const m = fbm(N2, x / 6 + cx, y / 6, 3), cr = fbm(N, x / 3.2 + cy, y / 3.2, 2);
        let r = 146 + (m - .5) * 34, g2 = 150 + (m - .5) * 30, b2 = 124 + (m - .5) * 26;
        if (t > .82) { const k = (t - .82) / .18; r += 30 * k; g2 += 28 * k; b2 += 26 * k; }
        if (Math.abs(cr - .5) < .03) { r *= .72; g2 *= .72; b2 *= .7; }
        if (fbm(N3, x / 2.2 + 5, y / 2.2, 2) > .76 && t < .75) { r = 70; g2 = 68; b2 = 54; }   /* les fructifications */
        q[j] = r; q[j + 1] = g2; q[j + 2] = b2; q[j + 3] = 255 * clamp((1 - t) * 9) * (.75 + .25 * m);
      }
      lg.putImageData(id, x0, y0);
    }
    yield;
    /* jamais dans les lettres */
    yield;
    const ml = document.createElement('canvas'); ml.width = SW; ml.height = SH; const mlg = ml.getContext('2d'), mld = mlg.createImageData(SW, SH);
    for (let i = 0; i < n; i++) mld.data[i * 4 + 3] = A[i] * 255;
    mlg.putImageData(mld, 0, 0);
    yield;
    lg.globalCompositeOperation = 'destination-out'; lg.filter = 'blur(3px)'; lg.drawImage(ml, 0, 0); lg.drawImage(ml, 0, 0); lg.filter = 'none';
    gp.globalAlpha = .85; gp.drawImage(lc, 0, 0); gp.globalAlpha = 1;
  }
  yield;

  /* ---- la dalle en saillie, dans son joint de mortier ---- */
  const [CW, CH] = PLAQUE_CANEVAS, c = document.createElement('canvas'); c.width = CW; c.height = CH;
  const g = c.getContext('2d');
  const { pts, ecBD, ecHG } = contourDalle(N2);
  /* le mortier de chaux : gris beige, grenu, en léger creux ; son bord extérieur suit les moellons (irrégulier) ;
     des éclats (petits trous plus sombres, au bord net) */
  const mo = g.createImageData(CW, CH), o = mo.data;
  const ext = [J, J, J + 6, J + 6];   /* largeur du joint : haut, gauche, bas, droite */
  for (let y = 0; y < CH; y++) {
    for (let x = 0; x < CW; x++) {
      const dx = x - J, dy = y - J;
      if (dx > 8 && dx < SW - 8 && dy > 8 && dy < SH - 8) continue;   /* sous la dalle */
      /* la distance à la dalle (dehors) */
      const ex = dx < 0 ? -dx : dx > SW ? dx - SW : 0, ey = dy < 0 ? -dy : dy > SH ? dy - SH : 0, dist = Math.hypot(ex, ey);
      const cote = ey >= ex ? (dy < 0 ? 0 : 2) : (dx < 0 ? 1 : 3);
      const bord = ext[cote] - 6 + 9 * fbm(N2, x / 46 + 7, y / 46, 3) + 4 * (fbm(N, x / 9, y / 9, 2) - .5);
      const alpha = clamp((bord - dist) / 1.6);
      if (alpha <= 0) continue;
      const i = (y * CW + x) * 4;
      const v = (fbm(N, x / 4, y / 4, 3) - .5) * 26 + (R() - .5) * 12;
      let r = 182 + v, gg = 174 + v, b = 156 + v * .9;
      /* le creux : l'arête des moellons ombre le joint côté haut et gauche ; le bas et la droite sont sous la dalle */
      const t = clamp(dist / Math.max(4, bord));
      if (cote === 0 || cote === 1) { r *= 1 - .42 * t * t; gg *= 1 - .42 * t * t; b *= 1 - .42 * t * t; }
      else { r *= 1 - .12 * (1 - t); gg *= 1 - .12 * (1 - t); b *= 1 - .12 * (1 - t); }
      /* les éclats du mortier */
      const ec = fbm(N3, x / 9 + 3, y / 9, 3);
      if (ec > .72) { const k = clamp((ec - .72) * 14); r *= 1 - .5 * k; gg *= 1 - .5 * k; b *= 1 - .47 * k; }
      o[i] = r; o[i + 1] = gg; o[i + 2] = b; o[i + 3] = 255 * alpha;
    }
    if (y % 20 === 19) yield;
  }
  g.putImageData(mo, 0, 0);
  /* l'ombre portée de la dalle sur le joint et le mur, en bas et à droite : nette près de la dalle, un peu plus douce
     au loin (pénombre) */
  g.save(); g.translate(J, J);
  g.filter = 'blur(5px)'; g.fillStyle = 'rgba(24,16,8,.32)'; chemin(g, pts, OMB[0] + 4, OMB[1] + 4); g.fill();
  g.filter = 'blur(1.4px)'; g.fillStyle = 'rgba(22,15,8,.42)'; chemin(g, pts, OMB[0], OMB[1]); g.fill();
  g.filter = 'none';
  /* la tranche : la dalle extrudée vers la droite et le bas (on voit sa saillie depuis la route), pierre sciée plus
     sombre ; le côté droit (tourné à l'opposé de la lumière) plus sombre que le haut, le dessous plus sombre encore */
  const tr = document.createElement('canvas'); tr.width = CW; tr.height = CH; const tg = tr.getContext('2d');
  tg.translate(J, J);
  const NT = 16;
  for (let k = NT; k >= 1; k--) { tg.fillStyle = `rgb(${Math.round(118 - 30 * k / NT)},${Math.round(108 - 28 * k / NT)},${Math.round(92 - 24 * k / NT)})`; chemin(tg, pts, TR[0] * k / NT, TR[1] * k / NT); tg.fill(); }
  /* le grain de la tranche (traits de scie, piqûres) */
  tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'source-atop';
  for (let k = 0; k < 900; k++) { const x = J + R() * (SW + TR[0]), y = J + R() * (SH + TR[1]); tg.fillStyle = R() < .5 ? 'rgba(255,246,226,.12)' : 'rgba(30,22,14,.18)'; tg.fillRect(x, y, 1 + R() * 2.5, 1 + R() * 1.5); }
  /* le dessous de la dalle, à l'ombre : plus sombre que le côté droit */
  tg.fillStyle = 'rgba(20,14,8,.4)'; tg.fillRect(J, J + SH - 4, SW + TR[0] + 2, SH);
  g.restore();
  g.drawImage(tr, 0, 0);
  /* la face de la dalle */
  g.save(); g.translate(J, J);
  chemin(g, pts); g.save(); g.clip(); g.drawImage(pi, 0, 0);
  /* les arêtes émoussées : un filet de lumière sur l'arête du haut et de gauche, l'arrondi qui s'assombrit en bas et
     à droite (vers la tranche) */
  const rim = (dx, dy, couleur, flou) => {
    const t = document.createElement('canvas'); t.width = SW + 40; t.height = SH + 40; const tt = t.getContext('2d');
    tt.translate(20, 20); tt.fillStyle = '#000'; chemin(tt, pts); tt.fill(); tt.globalCompositeOperation = 'destination-out'; chemin(tt, pts, dx, dy); tt.fill();
    tt.globalCompositeOperation = 'source-in'; tt.setTransform(1, 0, 0, 1, 0, 0); tt.fillStyle = couleur; tt.fillRect(0, 0, t.width, t.height);
    g.filter = `blur(${flou}px)`; g.drawImage(t, -20, -20); g.filter = 'none';
  };
  rim(5, 5, 'rgba(255,250,236,.55)', 1.6);
  rim(2, 2, 'rgba(255,252,242,.5)', .6);
  rim(-6, -6, 'rgba(40,28,16,.38)', 2.2);
  g.restore();
  /* les cassures des coins épaufrés : la pierre rompue, rugueuse ; en haut à gauche elle regarde la lumière (claire), en
     bas à droite elle est dans l'ombre de la saillie */
  [[ecBD, [SW, SH], 1], [ecHG, [0, 0], -1]].forEach(([ec, coin, sens]) => {
    g.beginPath(); ec.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.lineTo(coin[0], coin[1]); g.closePath();
    g.fillStyle = sens > 0 ? 'rgba(120,108,90,.9)' : 'rgba(226,214,190,.9)'; g.fill();
    g.save(); g.clip();
    for (let k = 0; k < 90; k++) { const [x, y] = ec[Math.floor(R() * ec.length)]; g.fillStyle = R() < .5 ? 'rgba(255,248,230,.35)' : 'rgba(40,30,18,.3)'; g.fillRect(x + (R() - .5) * 26, y + (R() - .5) * 26, 1 + R() * 3, 1 + R() * 2); }
    g.restore();
  });
  /* le bord des cassures, net (un éclat franc) */
  g.strokeStyle = 'rgba(46,34,22,.55)'; g.lineWidth = 1.6; g.beginPath(); ecBD.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
  g.strokeStyle = 'rgba(255,248,232,.5)'; g.lineWidth = 1.2; g.beginPath(); ecHG.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
  g.restore();
  sortie.c = c;
}

/* la même chose d'un coup (pour les essais) */
export function plaqueGravee(src, ton) { const s = {}; for (const _ of plaqueEtapes(src, ton, s)) { /* rien */ } return s.c; }
