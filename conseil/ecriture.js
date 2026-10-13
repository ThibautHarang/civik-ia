/* =====================================================================
   CO-16 (première passe Conseil, 06/10/2026) : « La prise de risque »,
   la vraie écriture de Thibaut, qui s'écrit sous les yeux du visiteur
   comme la phrase manuscrite du film.
   Les visuels (commun/img/c/, non modifiés) : prise-de-risque.webp (l'encre
   blanche, l'alpha porte la densité), prise-de-risque-temps.png (le temps
   d'apparition de chaque pixel sur 16 bits, rouge octet fort, vert octet
   faible, comme ecriture-temps.png du film ; le bleu donne le groupe
   « mots_couleur » du pixel, 0 aucun, 1 à 4) et prise-de-risque.json
   (paragraphes, signature, trajectoire de la pointe).
   La méthode est celle du film (c-film/js/papier.js, mode 2, lu et non
   modifié) : un seul rectangle WebGL, deux textures, et pour chaque pixel
   k = (t - temps du pixel) / 0,004 borné à [0, 1] ; l'encre est teintée
   pixel par pixel : crème (#f7f4ed), or (#F4A261) là où le bleu vaut 1 à 4.
   - On joue de 0 à signature.fin (0,9735) : le texte puis « Thibaut H. ».
     Le paraphe « T. H. », qui vient après dans l'image, n'est jamais montré
     (tout pixel plus tardif que signature.fin est écarté).
   - Le point final de « Thibaut H. », absent de l'image, est le point qui
     suit le T du paraphe, recopié pixel pour pixel (même image, même
     encre : décalage entier de 299 px et 96 px), posé après le H à la
     même hauteur de base et au même écart que dans le paraphe (le point du
     paraphe a son bas sur le bas du H et commence 21 px après lui ; le H de
     la signature est 1,12 fois plus haut : 23,5 px), écrit en tout dernier
     (après un saut de plume de 0,004, la même durée que le point d'origine).
   - Le rythme : 16,4 s pour une unité de temps de l'image (le texte complet,
     signature comprise, en 16 s), une pause de 0,5 s entre les paragraphes
     et avant la signature (la page la place : l'image n'en a pas).
   - La pointe d'une plume suit la trajectoire « pointe » (un élément posé
     par transform : rien à recalculer, aucun coût notable).
   - Rien n'est chargé ni calculé avant que le bloc soit à moins d'un écran
     et demi de la fenêtre ; l'écriture part quand le bloc a passé le tiers
     bas de la fenêtre ; si le visiteur passe sans attendre, elle s'achève
     d'elle-même ; en remontant, elle reste écrite. Mouvement réduit : tout
     est écrit d'emblée. Sans WebGL : le texte de la page, typographié.
   - Mémoire : les deux images décodées sont envoyées une fois à la carte
     graphique, puis lâchées (une seule copie, celle de la texture).
   ===================================================================== */
const DOSSIER = '../commun/img/c/';
/* CO-21 (troisième passe, 06/10/2026) : plus vive : le texte signé en 10,2 s (au lieu de 16), une pause de 0,12 s
   seulement entre les paragraphes, la signature dans la foulée ; 10,6 s en tout */
const VITESSE = 10.2;          /* secondes par unité de temps de l'image */
const PAUSE = .12;             /* secondes entre deux paragraphes */
const FONDU = .004;            /* le fondu du révélateur, comme au film */
const DEPART = .35;            /* la plume se pose avant d'écrire */
/* le point final de « Thibaut H. » : la zone source (le point qui suit le T du paraphe, seul dans ce carré) et le décalage */
const POINT = { src: [1058, 1100, 20, 20], dx: 299, dy: 96, saut: .004 };

const VS = `attribute vec2 p; varying vec2 v_uv; void main() { v_uv = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`;
const FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D u_encre, u_temps;
uniform float u_t, u_tfin, u_fondu, u_dens;
uniform vec4 u_dst;
uniform vec2 u_dec;
uniform vec2 u_pt;
uniform vec2 u_px;
uniform vec3 u_creme, u_or;
varying vec2 v_uv;
float temps(vec4 c) { return (c.r * 65280. + c.g * 255.) / 65535.; }
/* l'encre révélée en un point de l'image : alpha (densité relevée, CO-21) et teinte (crème, ou or si le bleu vaut 1 à 4) */
vec4 encre(vec2 uv) {
  vec4 tt = texture2D(u_temps, uv);
  float t = tt.a > .5 ? temps(tt) : 2.;
  float k = t <= u_tfin ? clamp((u_t - t) / u_fondu, 0., 1.) : 0.;
  float A = min(1., texture2D(u_encre, uv).a * u_dens) * k;
  vec3 c = mix(u_creme, u_or, step(.5 / 255., tt.b));
  if (uv.x >= u_dst.x && uv.x <= u_dst.z && uv.y >= u_dst.y && uv.y <= u_dst.w) {
    vec2 s = uv + u_dec;
    vec4 ts = texture2D(u_temps, s);
    if (ts.a > .5) {
      float kd = clamp((u_t - (temps(ts) - u_pt.x + u_pt.y)) / u_fondu, 0., 1.);
      float ad = min(1., texture2D(u_encre, s).a * u_dens) * kd;
      if (ad > A) { A = ad; c = u_creme; }
    }
  }
  return vec4(c, A);
}
void main() {
  /* CO-21 : le trait épaissi d'un pixel d'image : le plus encré du point et de ses huit voisins (les diagonales un peu
     moins), chacun avec son propre temps ; aucun flou */
  vec4 m = encre(v_uv);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    if (i == 0 && j == 0) continue;
    vec4 e = encre(v_uv + vec2(float(i), float(j)) * u_px);
    float w = (i != 0 && j != 0) ? .78 : .92;
    if (e.a * w > m.a) m = vec4(e.rgb, e.a * w);
  }
  gl_FragColor = vec4(m.rgb * m.a, m.a);
}`;

const charger = src => new Promise(r => { const i = new Image(); i.decoding = 'async'; i.onload = () => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()).then(() => r(i)); i.onerror = () => r(null); i.src = src; });
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function ecriture(racine) {
  if (!racine) return;
  const toile = racine.querySelector('[data-ecriture-toile]'), plume = racine.querySelector('[data-ecriture-plume]');
  let gl = null, loc = null, info = null, W = 0, H = 0, tFin = 0, tFinal = 0, pointT = [0, 0], trajet = [], pauses = [];
  let pret = null, debut = 0, demande = false, u = 0, raf = 0, dpr = 1, fini = false;
  const repli = () => { racine.classList.add('sans-toile'); racine.classList.remove('avec-toile'); };

  /* l'horloge : le temps de l'image au temps de la page (secondes depuis le départ), pauses comprises */
  const temps = tau => {
    tau -= DEPART; if (tau <= 0) return { t: 0, leve: true };
    let a = 0;
    for (const p of pauses) {
      const seg = (p - a) * VITESSE;
      if (tau <= seg) return { t: a + tau / VITESSE, leve: false };
      tau -= seg;
      if (tau <= PAUSE) return { t: p, leve: true };
      tau -= PAUSE; a = p;
    }
    const t = a + tau / VITESSE;
    return { t: Math.min(tFinal, t), leve: t >= tFinal };
  };
  /* la pointe : la trajectoire interpolée au temps t (fractions de l'image) */
  const pointeA = t => {
    let lo = 0, hi = trajet.length - 1;
    if (!trajet.length) return null;
    if (t <= trajet[0][0]) return trajet[0];
    if (t >= trajet[hi][0]) return trajet[hi];
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (trajet[m][0] <= t) lo = m; else hi = m; }
    const A = trajet[lo], B = trajet[hi], f = (t - A[0]) / Math.max(1e-6, B[0] - A[0]);
    return [t, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f];
  };

  const dimensionner = () => {
    if (!gl) return;
    const r = toile.getBoundingClientRect();
    dpr = Math.min(3, Math.max(1, devicePixelRatio || 1));
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (toile.width !== w || toile.height !== h) { toile.width = w; toile.height = h; gl.viewport(0, 0, w, h); }
    dessiner();
  };
  const dessiner = () => {
    if (!gl) return;
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(loc.u_t, u);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const poserPlume = (t, leve, op) => {
    if (!plume) return;
    const p = pointeA(t);
    if (!p) return;
    const r = toile.getBoundingClientRect();
    const x = p[1] * r.width, y = p[2] * r.height, l = leve ? -5 : 0;
    plume.style.transform = `translate3d(${(x + l * .6).toFixed(1)}px, ${(y + l).toFixed(1)}px, 0)`;
    plume.style.opacity = String(op);
  };
  const boucle = now => {
    raf = 0;
    const { t, leve } = temps((now - debut) / 1000);
    u = t; dessiner();
    const fin = t >= tFinal;
    poserPlume(Math.min(t, tFinal), leve, fin ? 0 : .95);
    if (fin) { fini = true; racine.classList.add('ecrite'); return; }
    raf = requestAnimationFrame(boucle);
  };
  const partir = () => {
    if (fini || raf || !gl) return;
    if (reduit()) { u = tFinal; fini = true; racine.classList.add('ecrite'); dessiner(); return; }
    debut = performance.now(); racine.classList.add('en-cours');
    raf = requestAnimationFrame(boucle);
  };

  const preparer = () => pret || (pret = (async () => {
    try {
      const [rep, encre, tempsIm] = await Promise.all([
        fetch(DOSSIER + 'prise-de-risque.json').then(r => r.ok ? r.json() : null).catch(() => null),
        charger(DOSSIER + 'prise-de-risque.webp'), charger(DOSSIER + 'prise-de-risque-temps.png')
      ]);
      if (!rep || !encre || !tempsIm) { repli(); return false; }
      info = rep; [W, H] = info.taille || [encre.naturalWidth, encre.naturalHeight];
      tFin = info.signature && info.signature.fin ? info.signature.fin : 1;
      /* les pauses : à la fin de chaque paragraphe (la signature comprise, elle vient après le troisième) */
      pauses = (info.paragraphes || []).filter(p => p.paragraphe !== 'signature').map(p => p.fin).filter(x => x < tFin).sort((a, b) => a - b);
      /* le point : ses temps d'origine (la trajectoire du paraphe les donne aussi), puis ses temps nouveaux */
      const traj = Array.isArray(info.pointe) ? info.pointe : [];
      const [sx, sy, sw, sh] = POINT.src, cx = (sx + sw / 2) / W, cy = (sy + sh / 2) / H;
      const surPoint = traj.filter(([, x, y]) => Math.abs(x - cx) < sw / 2 / W && Math.abs(y - cy) < sh / 2 / H);
      const t0 = surPoint.length ? surPoint[0][0] : .9899, t1 = surPoint.length ? surPoint[surPoint.length - 1][0] : .9912;
      pointT = [t0, tFin + POINT.saut];
      tFinal = pointT[1] + (t1 - t0) + FONDU * 1.2;
      trajet = traj.filter(p => p[0] <= tFin);
      const der = trajet[trajet.length - 1] || [tFin, .95, .98];
      const dest = surPoint.length ? surPoint.map(([tt, x, y]) => [tt - t0 + pointT[1], x + POINT.dx / W, y + POINT.dy / H]) : [[pointT[1], (cx * W + POINT.dx) / W, (cy * H + POINT.dy) / H]];
      trajet.push([der[0] + POINT.saut * .5, (der[1] + dest[0][1]) / 2, Math.min(der[2], dest[0][2]) - .012], ...dest, [tFinal, dest[dest.length - 1][1], dest[dest.length - 1][2]]);
      /* WebGL : un rectangle, deux textures (les images sont lâchées après l'envoi) */
      gl = toile.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
      if (!gl) { repli(); return false; }
      const sh_ = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const prog = gl.createProgram(); gl.attachShader(prog, sh_(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh_(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      loc = {}; ['u_encre', 'u_temps', 'u_t', 'u_tfin', 'u_fondu', 'u_dens', 'u_px', 'u_dst', 'u_dec', 'u_pt', 'u_creme', 'u_or'].forEach(n => { loc[n] = gl.getUniformLocation(prog, n); });
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const ap = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      const texture = (unite, im, filtre) => { const tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unite); gl.bindTexture(gl.TEXTURE_2D, tx); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtre); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtre); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return tx; };
      texture(0, encre, gl.LINEAR); texture(1, tempsIm, gl.NEAREST);
      encre.src = ''; tempsIm.src = '';
      gl.uniform1i(loc.u_encre, 0); gl.uniform1i(loc.u_temps, 1);
      gl.uniform1f(loc.u_tfin, tFin + .0002); gl.uniform1f(loc.u_fondu, FONDU);
      gl.uniform4f(loc.u_dst, (sx + POINT.dx) / W, (sy + POINT.dy) / H, (sx + sw + POINT.dx) / W, (sy + sh + POINT.dy) / H);
      gl.uniform2f(loc.u_dec, -POINT.dx / W, -POINT.dy / H);
      gl.uniform2f(loc.u_pt, t0, pointT[1]);
      /* CO-21 : l'encre renforcée dans le rendu (les images ne changent pas) : densité x 1,7, crème du papier, or plus clair */
      gl.uniform1f(loc.u_dens, 1.7); gl.uniform2f(loc.u_px, 1 / W, 1 / H);
      gl.uniform3fv(loc.u_creme, hex('#fffdf8')); gl.uniform3fv(loc.u_or, hex('#F7B26E'));
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      toile.addEventListener('webglcontextlost', e => { e.preventDefault(); if (raf) cancelAnimationFrame(raf); raf = 0; gl = null; repli(); });
      racine.classList.add('avec-toile');
      dimensionner();
      if ('ResizeObserver' in window) new ResizeObserver(dimensionner).observe(toile); else addEventListener('resize', dimensionner);
      /* pour les preuves : ?ecriture=0.5 fige l'écriture à ce temps de l'image */
      const fige = new URLSearchParams(location.search).get('ecriture');
      if (fige !== null && !isNaN(+fige)) { fini = true; u = Math.min(+fige, tFinal); racine.classList.add('ecrite'); dessiner(); poserPlume(u, false, u < tFinal ? .95 : 0); return true; }
      if (demande) partir();
      return true;
    } catch (e) { repli(); return false; }
  })());

  /* le chargement quand le bloc approche (un écran et demi), le départ quand il a passé le tiers bas de la fenêtre */
  if (!('IntersectionObserver' in window)) { demande = true; preparer(); return; }
  const proche = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { proche.disconnect(); preparer(); } }, { rootMargin: '150% 0px 150% 0px' });
  proche.observe(racine);
  const vue = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { vue.disconnect(); demande = true; preparer().then(ok => { if (ok) partir(); }); } }, { rootMargin: '0px 0px -33% 0px', threshold: 0 });
  vue.observe(racine);
}
