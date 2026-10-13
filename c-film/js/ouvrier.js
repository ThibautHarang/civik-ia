/* =====================================================================
   P4 (seizième passe, 06/10/2026) : l'ouvrier, un fil à part (Web Worker).
   Les préparations de fond qui décodaient une image, la relisaient pixel
   par pixel ou encodaient un canevas le faisaient sur le fil principal,
   d'un bloc (10 à 60 ms : la crête du lointain, la carte d'ordre de la
   calade, le lointain flouté, le masque du plateau, le masque du logo,
   l'écriture de Thibaut). Ici, elles se font hors du fil principal ; le
   film ne reçoit que le résultat (des pixels, ou un fichier encodé).
   Chaque demande : { id, op, ... } ; chaque réponse : { id, ... } ou
   { id, erreur }. Sans OffscreenCanvas, le film garde son calcul habituel.
   ===================================================================== */
const charger = async url => { const r = await fetch(url); if (!r.ok) throw new Error('chargement ' + r.status); return createImageBitmap(await r.blob()); };
const toile = (w, h) => { const c = new OffscreenCanvas(w, h); return [c, c.getContext('2d', { willReadFrequently: true })]; };
const OPS = {
  /* les pixels d'une image (ou d'un morceau, réduit) : { url, sx, sy, sw, sh, w, h } */
  async pixels(m) {
    const im = await charger(m.url);
    const sx = m.sx || 0, sy = m.sy || 0, sw = m.sw || im.width, sh = m.sh || im.height, w = m.w || sw, h = m.h || sh;
    const [, g] = toile(w, h); g.drawImage(im, sx, sy, sw, sh, 0, 0, w, h); im.close();
    const d = g.getImageData(0, 0, w, h);
    return [{ w, h, data: d.data.buffer }, [d.data.buffer]];
  },
  /* une image posée dans un cadre w x h, par une transformation : { url, w, h, t: [a, b, c, d, e, f], s: [sx, sy, sw, sh, dx, dy, dw, dh] } */
  async placer(m) {
    const im = await charger(m.url), [, g] = toile(m.w, m.h);
    g.setTransform(...m.t); g.drawImage(im, ...m.s); im.close();
    const d = g.getImageData(0, 0, m.w, m.h);
    return [{ w: m.w, h: m.h, data: d.data.buffer }, [d.data.buffer]];
  },
  /* S2 (dix-neuvième passe) : un canevas figé (une ImageBitmap transférée), encodé en PNG hors du fil principal : { bm } */
  async figer(m) {
    const [c, g] = toile(m.bm.width, m.bm.height); g.drawImage(m.bm, 0, 0); m.bm.close();
    return [{ blob: await c.convertToBlob({ type: 'image/png' }) }, []];
  },
  /* des pixels à encoder : { w, h, data, type, q } */
  async encoder(m) {
    const [c, g] = toile(m.w, m.h); g.putImageData(new ImageData(new Uint8ClampedArray(m.data), m.w, m.h), 0, 0);
    return [{ blob: await c.convertToBlob({ type: m.type || 'image/png', quality: m.q }) }, []];
  },
  /* une image floutée, encodée : { url, flou, type, q } (le lointain préflouté, C2) */
  async flouImage(m) {
    const im = await charger(m.url), [c, g] = toile(im.width, im.height);
    if (!('filter' in g)) throw new Error('filtre');
    g.filter = 'blur(' + m.flou + 'px)'; g.drawImage(im, 0, 0); g.filter = 'none'; im.close();
    return [{ blob: await c.convertToBlob({ type: m.type || 'image/webp', quality: m.q }), w: c.width, h: c.height }, []];
  },
  /* un polygone plein, flouté, encodé : { w, h, pts, flou, type } (le masque du plateau, J15) */
  async polygone(m) {
    const [c, g] = toile(m.w, m.h);
    g.fillStyle = '#000';
    /* sans filtre (WebKit dans un fil à part) : le même flou gaussien par l'ombre portée (écart type = flou), la forme hors du cadre */
    if ('filter' in g) g.filter = 'blur(' + m.flou + 'px)';
    else { g.shadowColor = '#000'; g.shadowBlur = 2 * m.flou; g.shadowOffsetX = m.w + 100; g.translate(-(m.w + 100), 0); }
    g.beginPath(); m.pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill();
    return [{ blob: await c.convertToBlob({ type: m.type || 'image/png' }) }, []];
  }
};
/* le temps de l'écriture de Thibaut (visuels.js, ecritureReelle) : le même calcul, ici : le temps de chaque pixel (16 bits,
   rouge et vert), étendu de trois pixels autour de l'encre, le facteur K du second point (O4), la texture de données ; et,
   pour l'ordinateur, les pixels de l'encre (envoyés par bandes à la carte graphique) */
OPS.ecriture = async m => {
  const im = await charger(m.url), w = im.width, h = im.height, [, g] = toile(w, h); g.drawImage(im, 0, 0); im.close();
  const d = g.getImageData(0, 0, w, h).data;
  let t = new Float32Array(w * h).fill(2);
  for (let i = 0, j = 0; j < w * h; i += 4, j++) if (d[i + 3] > 8) t[j] = (d[i] * 256 + d[i + 1]) / 65535;
  for (let passe = 0; passe < 3; passe++) {
    const s = t.slice();
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const j = y * w + x; if (t[j] <= 1) continue;
      const mn = Math.min(t[j - 1], t[j + 1], t[j - w], t[j + w]); if (mn <= 1) s[j] = mn;
    }
    t = s;
  }
  let K = 1, region = null;
  const [sx, sy, sw, sh] = m.src;
  if (m.taille && m.taille[0] === w && sx + sw <= w && sy + sh <= h && m.pointe) {
    let t0 = 2, t1 = -1;
    for (let y = sy; y < sy + sh; y++) for (let x = sx; x < sx + sw; x++) { const v = t[y * w + x]; if (v <= 1) { t0 = Math.min(t0, v); t1 = Math.max(t1, v); } }
    if (t1 >= 0) K = m.fin / (1 + m.saut + (t1 - t0));
    region = new Float32Array(sw * sh);
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) region[y * sw + x] = t[(sy + y) * w + sx + x];
  }
  const px = new Uint8Array(w * h * 4);
  for (let j = 0; j < w * h; j++) { const v = t[j] > 1 ? 65535 : Math.round(t[j] * K * 65535); px[j * 4] = v >> 8; px[j * 4 + 1] = v & 255; px[j * 4 + 3] = 255; }
  const r = { w, h, px: px.buffer, K, region: region ? region.buffer : null }, tr = [px.buffer];
  if (region) tr.push(region.buffer);
  if (m.encre) {
    const e = await charger(m.encre), ew = e.width, eh = e.height, [, ge] = toile(ew, eh); ge.drawImage(e, 0, 0); e.close();
    const ed = ge.getImageData(0, 0, ew, eh); r.ew = ew; r.eh = eh; r.encre = ed.data.buffer; tr.push(ed.data.buffer);
  }
  return [r, tr];
};
self.onmessage = async e => {
  const m = e.data;
  try { const [r, tr] = await OPS[m.op](m); r.id = m.id; self.postMessage(r, tr); }
  catch (err) { self.postMessage({ id: m.id, erreur: String(err && err.message || err) }); }
};
