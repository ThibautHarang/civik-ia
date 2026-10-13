/* =====================================================================
   Provisoires de la deuxième passe (02/10/2026), en attendant les photos
   de ce soir : la feuille A4 réelle du CV, la grande feuille du bloc à
   dessin, le crayon dessiné à la plume (repris tel quel du crayon de
   main-crayon.webp), la tête de clou en relief. Chacun se remplace par son
   fichier sans toucher au code.
   ===================================================================== */
import { GEO, DOSSIER } from '../visuels.js';
import { rng, bruit2, fbm, clamp, lerp } from '../outils.js';
import { canevas } from './reel.js';

/* le bord d'une feuille : un rectangle aux bords pas tout à fait droits */
function bordIrregulier(g, x0, y0, x1, y1, graine, amp = .9) {
  const R = rng(graine), pts = [];
  const cote = (ax, ay, bx, by, n) => { for (let i = 0; i < n; i++) { const t = i / n; pts.push([lerp(ax, bx, t) + (R() - .5) * amp, lerp(ay, by, t) + (R() - .5) * amp]); } };
  const nx = Math.round((x1 - x0) / 14), ny = Math.round((y1 - y0) / 14);
  cote(x0, y0, x1, y0, nx); cote(x1, y0, x1, y1, ny); cote(x1, y1, x0, y1, nx); cote(x0, y1, x0, y0, ny);
  g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
}
/* grain du papier : marbrure lente (calculée en petit, agrandie lissée), bruit fin (une tuile répétée), fibres */
function grain(g, w, h, o) {
  const R = rng(o.graine), b = bruit2(o.graine + 7);
  /* marbrure : une image 1/8, agrandie avec lissage, en lumière douce */
  const mw = Math.ceil(w / 8), mh = Math.ceil(h / 8), m = document.createElement('canvas'); m.width = mw; m.height = mh;
  const mg = m.getContext('2d'), md = mg.createImageData(mw, mh);
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) { const v = (fbm(b, x * 8 / o.marbre, y * 8 / o.marbre, 3) - .5) * o.kMarbre * 2, i = (y * mw + x) * 4, c = v > 0 ? 255 : 0; md.data[i] = md.data[i + 1] = md.data[i + 2] = c; md.data[i + 3] = Math.abs(v) * 255; }
  mg.putImageData(md, 0, 0);
  g.save(); g.globalCompositeOperation = 'source-atop'; g.imageSmoothingQuality = 'high'; g.drawImage(m, 0, 0, w, h); g.restore();
  /* bruit fin : une tuile de 256 px, répétée */
  const t = document.createElement('canvas'); t.width = t.height = 256;
  const tg = t.getContext('2d'), td = tg.createImageData(256, 256);
  for (let i = 0; i < td.data.length; i += 4) { const v = (R() - .5) * o.kGrain * 2 + (R() < .004 ? -o.kGrain * 1.6 : 0), c = v > 0 ? 255 : 0; td.data[i] = td.data[i + 1] = td.data[i + 2] = c; td.data[i + 3] = Math.min(255, Math.abs(v) * 255 * 1.6); }
  tg.putImageData(td, 0, 0);
  g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = g.createPattern(t, 'repeat'); g.fillRect(0, 0, w, h); g.restore();
  g.save(); g.globalCompositeOperation = 'source-atop';
  for (let k = 0; k < o.fibres; k++) {
    const x = R() * w, y = R() * h, l = 6 + R() * 22, a = R() * Math.PI * 2, c = (R() - .5) * 1.2;
    g.strokeStyle = R() < .5 ? `rgba(255,255,255,${(.18 + R() * .25).toFixed(2)})` : `rgba(120,100,70,${(.05 + R() * .07).toFixed(2)})`;
    g.lineWidth = .5 + R() * .7; g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a + c) * l * .5, y + Math.sin(a + c) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  g.restore();
}

/* la feuille A4 du CV : papier légèrement chaud, lumière venue du haut à gauche, bords irréguliers */
export function feuille() {
  const G = GEO.feuille, { w, h } = G, [x0, y0, x1, y1] = G.corps;
  const c = canevas(w, h), g = c.getContext('2d', { willReadFrequently: true });
  bordIrregulier(g, x0, y0, x1, y1, 41);
  const lg = g.createLinearGradient(x0, y0, x1 * .7, y1);
  lg.addColorStop(0, '#fcfbf7'); lg.addColorStop(.55, '#f8f6f0'); lg.addColorStop(1, '#f1eee6');
  g.fillStyle = lg; g.fill();
  grain(g, w, h, { graine: 11, marbre: 180, kMarbre: .028, kGrain: .022, fibres: 420 });
  /* tranche du papier : un fil sombre en bas et à droite, un fil clair en haut et à gauche */
  g.save(); bordIrregulier(g, x0, y0, x1, y1, 41); g.clip();
  g.lineWidth = 3; g.strokeStyle = 'rgba(110,96,70,.16)'; g.beginPath(); g.moveTo(x1, y0); g.lineTo(x1, y1); g.lineTo(x0, y1); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  /* un léger voile de manipulation près des coins du bas */
  [[x0, y1], [x1, y1]].forEach(([cx, cy]) => { const r = g.createRadialGradient(cx, cy, 0, cx, cy, 260); r.addColorStop(0, 'rgba(150,130,100,.06)'); r.addColorStop(1, 'rgba(150,130,100,0)'); g.fillStyle = r; g.fillRect(cx - 260, cy - 260, 520, 520); });
  g.restore();
  return c;
}

/* la grande feuille du bloc à dessin : papier à grain, bande collée en haut (le bloc) */
export function feuilleDessin() {
  const G = GEO['feuille-dessin'], { w, h } = G, [x0, y0, x1, y1] = G.corps;
  const c = canevas(w, h), g = c.getContext('2d', { willReadFrequently: true });
  bordIrregulier(g, x0, y0, x1, y1, 52, 1.1);
  const lg = g.createLinearGradient(x0, y0, x1, y1);
  lg.addColorStop(0, '#fbf9f3'); lg.addColorStop(.6, '#f7f4ec'); lg.addColorStop(1, '#f0ece2');
  g.fillStyle = lg; g.fill();
  grain(g, w, h, { graine: 23, marbre: 240, kMarbre: .03, kGrain: .03, fibres: 900 });
  g.save(); bordIrregulier(g, x0, y0, x1, y1, 52, 1.1); g.clip();
  /* la bande de colle du bloc */
  const b = g.createLinearGradient(0, y0, 0, y0 + 26);
  b.addColorStop(0, 'rgba(176,160,128,.30)'); b.addColorStop(.7, 'rgba(176,160,128,.12)'); b.addColorStop(1, 'rgba(176,160,128,0)');
  g.fillStyle = b; g.fillRect(x0, y0, x1 - x0, 26);
  g.lineWidth = 3; g.strokeStyle = 'rgba(110,96,70,.14)'; g.beginPath(); g.moveTo(x1, y0); g.lineTo(x1, y1); g.lineTo(x0, y1); g.stroke();
  g.restore();
  return c;
}

/* le dos d'une feuille : le même papier, un peu plus gris, sans impression */
export function dosPapier(source, w, h) {
  const c = canevas(w, h), g = c.getContext('2d');
  g.save(); g.translate(w, 0); g.scale(-1, 1); g.drawImage(source, 0, 0, w, h); g.restore();
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(214,208,196,.3)'; g.fillRect(0, 0, w, h);
  return c;
}

/* La tête de clou en relief : forgée, un peu rouillée, reflet en haut à gauche, ombre portée en bas à droite */
export function clou() {
  const { w, h } = GEO.clou, c = canevas(w, h), g = c.getContext('2d'), R = rng(9);
  const cx = 92, cy = 90, r = 40;
  /* ombre portée */
  const o = g.createRadialGradient(cx + 13, cy + 15, r * .4, cx + 13, cy + 15, r * 1.45);
  o.addColorStop(0, 'rgba(18,10,4,.62)'); o.addColorStop(.55, 'rgba(18,10,4,.30)'); o.addColorStop(1, 'rgba(18,10,4,0)');
  g.fillStyle = o; g.beginPath(); g.ellipse(cx + 13, cy + 15, r * 1.45, r * 1.38, 0, 0, Math.PI * 2); g.fill();
  /* la tête, bombée */
  g.save(); g.beginPath();
  for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, rr = r * (1 + (R() - .5) * .035); i ? g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : g.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  g.closePath(); g.clip();
  const m = g.createRadialGradient(cx - r * .35, cy - r * .4, r * .05, cx + r * .1, cy + r * .1, r * 1.15);
  m.addColorStop(0, '#d9d4cb'); m.addColorStop(.28, '#9a948a'); m.addColorStop(.62, '#5e5850'); m.addColorStop(1, '#2c2824');
  g.fillStyle = m; g.fillRect(cx - r, cy - r, r * 2, r * 2);
  /* coups de marteau : facettes légères */
  for (let k = 0; k < 7; k++) { const a = R() * Math.PI * 2, d = R() * r * .55; const f = g.createRadialGradient(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0, cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (.25 + R() * .2)); const cl = R() < .5; f.addColorStop(0, cl ? 'rgba(255,250,240,.16)' : 'rgba(20,16,12,.14)'); f.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = f; g.fillRect(0, 0, w, h); }
  /* rouille */
  for (let k = 0; k < 40; k++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * r; g.fillStyle = `rgba(${120 + R() * 40 | 0},${64 + R() * 20 | 0},${30 + R() * 10 | 0},${(.10 + R() * .22).toFixed(2)})`; g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, .8 + R() * 2.6, 0, Math.PI * 2); g.fill(); }
  /* reflet */
  const s = g.createRadialGradient(cx - r * .38, cy - r * .42, 0, cx - r * .38, cy - r * .42, r * .42);
  s.addColorStop(0, 'rgba(255,255,255,.95)'); s.addColorStop(.35, 'rgba(255,255,255,.45)'); s.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = s; g.fillRect(0, 0, w, h);
  g.restore();
  /* liseré : clair en haut à gauche, sombre en bas à droite */
  g.lineWidth = 2.2;
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(cx, cy, r - 1.5, Math.PI * .95, Math.PI * 1.65); g.stroke();
  g.strokeStyle = 'rgba(10,8,6,.6)'; g.beginPath(); g.arc(cx, cy, r - 1, -Math.PI * .1, Math.PI * .7); g.stroke();
  c.reperes = { centre: [cx / w, cy / h], rayon: r / w };
  return c;
}

/* Le crayon dessiné : découpé dans main-crayon.webp, où il passe devant la main de bout en bout.
   Axe relevé sur l'image (1024 x 1024) : pointe (228,3 ; 231,7), direction 34,3 degrés, largeur 39 px. */
export const CRAYON_MAIN = { pointe: [228.3, 231.7], u: [.8262, .5634], long: 684, larg: [-19.5, 22.5], cone: 146 };
export async function crayonDessine() {
  /* démarrage (dixième passe) : un canevas en mémoire (lu deux fois : plus de relecture de la carte graphique) */
  const G = GEO['crayon-dessine'], { w, h } = G, c = canevas(w, h), g = c.getContext('2d', { willReadFrequently: true });
  /* Y7 (vingt-cinquième passe, 08/10/2026) : le crayon couché manquait un chargement sur deux (sur 8104 aussi, avant la passe) : son image
     était vide (aucun pixel opaque) alors que l'élément était là, posé et chargé. La photo de la main au crayon est aussi un visuel du film
     (visuels.js, décodée à part, en asynchrone) : quand ce décodage était en cours, le dessin du crayon dans ce canevas ne dessinait rien.
     La photo est désormais décodée avant d'être dessinée, et le dessin est vérifié (des pixels opaques le long du corps du crayon) : vide,
     il est refait (trois essais, 40 ms d'écart), puis, s'il restait vide, le crayon simple à la plume du repli */
  const im = await new Promise(res => { const i = new Image(); i.onload = () => Promise.resolve(i.decode ? i.decode().catch(() => {}) : null).then(() => res(i)); i.onerror = () => res(null); i.src = DOSSIER + 'main-crayon.webp'; });
  const [px, py] = G.pointe, M = CRAYON_MAIN, [ux, uy] = M.u, nx = -uy, ny = ux;
  const dessine = () => { const d = g.getImageData(px + 360, 0, 200, h).data; let n = 0; for (let q = 3; q < d.length; q += 4) if (d[q] > 20) n++; return n > 400; };
  for (let essai = 0; im && essai < 3; essai++) {
    if (essai) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); await new Promise(r => setTimeout(r, 40)); }
    g.save();
    const k = im.naturalWidth / 1024;
    /* contour du crayon dans le repère de sortie (x le long de l'axe, y en travers) */
    g.beginPath();
    g.moveTo(px - 2, py); g.lineTo(px + M.cone, py + M.larg[0]); g.lineTo(px + M.long - 6, py + M.larg[0]);
    g.lineTo(px + M.long + 2, py + M.larg[0] + 8); g.lineTo(px + M.long + 2, py + M.larg[1] - 8); g.lineTo(px + M.long - 6, py + M.larg[1]);
    g.lineTo(px + M.cone, py + M.larg[1]); g.closePath(); g.clip();
    /* sortie (x, y) -> image : pointe + u (x - px) + n (y - py) */
    const a = ux, b = uy, cc = nx, d = ny, e = M.pointe[0] - (ux * px + nx * py), f = M.pointe[1] - (uy * px + ny * py);
    const det = a * d - b * cc;
    const ia = d / det, ib = -b / det, ic = -cc / det, id = a / det, ie = -(ia * e + ic * f), iff = -(ib * e + id * f);
    g.setTransform(ia / k, ib / k, ic / k, id / k, ie, iff);
    g.drawImage(im, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0);
    /* là où le pouce et l'index passent sur le crayon (de 172 à 338 px de la pointe), on recopie une tranche
       propre du corps, colonne par colonne : les pans du crayon sont parallèles à son axe */
    const src = g.getImageData(0, 0, w, h), propre = [px + 352, px + 412];
    const out = new ImageData(new Uint8ClampedArray(src.data), w, h);
    for (let x = px + 172; x < px + 338; x++) {
      const xs = propre[0] + ((x - px - 172) % (propre[1] - propre[0]));
      for (let y = 0; y < h; y++) { const a = (y * w + x) * 4, b = (y * w + xs) * 4; for (let q = 0; q < 4; q++) out.data[a + q] = src.data[b + q]; }
    }
    g.putImageData(out, 0, 0);
    g.restore();
    if (dessine()) break;
  }
  if (!im || !dessine()) {
    /* repli : un crayon simple à la plume (Y7 : aussi si les trois essais sont restés vides) */
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h);
    g.fillStyle = '#fdfcf8'; g.strokeStyle = '#16205C'; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(px, py); g.lineTo(px + 140, py - 18); g.lineTo(w - 12, py - 18); g.lineTo(w - 12, py + 20); g.lineTo(px + 140, py + 20); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(px + 140, py - 18); g.lineTo(px + 140, py + 20); g.moveTo(px + 150, py + 2); g.lineTo(w - 14, py + 2); g.stroke();
  }
  c.reperes = { pointe: [px / w, py / h], bout: [(px + M.long) / w, py / h] };
  return c;
}
