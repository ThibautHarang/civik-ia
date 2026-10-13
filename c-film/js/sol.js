/* =====================================================================
   K12 (onzième passe, 04/10/2026) : le sol fixe sous nos pas.
   Thibaut : « quand on marche, les pavés semblent bouger, on a
   l'impression que les images changent ; il faut qu'ils soient fixes ».
   Cause : la terre du chemin (sol-chemin) et la calade étaient posées par
   tranches affines dont les limites dépendaient de la distance à la
   caméra (0,25 m, 0,5 m puis 1,2 m selon la profondeur, à partir du point
   le plus proche, arrondi au mètre), chaque tranche en parallélogramme
   (son coin lointain n'était pas le vrai), et la finesse de la texture
   changeait d'un cran à des seuils : à chaque pas, les tranches se
   recoupaient autrement, la texture glissait dans chacune et sautait
   d'une finesse à l'autre.
   Ici, le sol est un ruban de triangles posé en coordonnées du sol du
   monde (abscisse le long du chemin, tous les 0,25 m, les mêmes points
   que le chemin lui-même ; ordonnée transversale), projeté à chaque image
   par la caméra (calcul en double précision) et dessiné par la carte
   graphique avec une interpolation en perspective exacte ; la texture
   (tuile du chemin répétée, bande de la calade) est attachée au sol par
   ses coordonnées en mètres, échantillonnée avec ses mipmaps et un
   filtrage anisotrope (pas de scintillement au loin, pas de saut de
   finesse). L'opacité (brume, portée, fondu au loin) ne dépend que de la
   profondeur du point du chemin, continue. Rien ne change d'une image à
   l'autre, sauf le point de vue.
   Le résultat est rendu dans un canevas WebGL hors du document, puis
   posé dans le calque du monde par un drawImage.
   L4 (douzième passe) : le lavis du sol (la terre, l'ocre des chemins, le
   calcaire de la calade, et le masque de la révélation) est rendu
   directement dans un canevas de la page (opt.canvas), sans recopie.
   Sans WebGL 2, le monde garde son ancien tracé.
   ===================================================================== */
import { pourTexture, liberer } from './memoire.js';
import { PAUSE, LOURD } from './lavis.js';

const VS = `#version 300 es
in vec4 aPos; in vec2 aUv; in float aA;
out vec2 vUv; out float vA;
void main() { gl_Position = aPos; vUv = aUv; vA = aA; }`;
const FS = `#version 300 es
precision highp float;
in vec2 vUv; in float vA;
uniform sampler2D uTex;
out vec4 o;
void main() { o = texture(uTex, vUv) * vA; }`;

/* L4 (douzième passe) : des rectangles plein écran, pour le calque des lavis du sol rendu directement dans la page : mode 0,
   le lavis de la terre (un dégradé vertical sous l'horizon) ; mode 1, le masque de la révélation (la couleur qui part de
   la lampe), qui multiplie ce qui est déjà dessiné */
const VS2 = `#version 300 es
in vec2 aP;
void main() { gl_Position = vec4(aP, 0., 1.); }`;
const FS2 = `#version 300 es
precision highp float;
uniform int uMode; uniform vec4 uCol; uniform vec4 uG; uniform sampler2D uMq; uniform vec4 uMt;
out vec4 o;
void main() {
  if (uMode == 0) {
    float y = uG.z - gl_FragCoord.y, t = (y - uG.x) / max(1., uG.y - uG.x);
    float a = t <= 0. ? 0. : t < .06 ? mix(0., .13, t / .06) : t < .45 ? mix(.13, .22, (t - .06) / .39) : mix(.22, .3, (t - .45) / .55);
    o = vec4(uCol.rgb * a, a);
  } else {
    vec2 uv = vec2(gl_FragCoord.x, uG.z - gl_FragCoord.y) * uMt.xy + uMt.zw;
    o = vec4(0., 0., 0., texture(uMq, uv).a);
  }
}`;

/* P4 (seizième passe) : créé par étapes (le contexte, chaque programme compilé puis lié, sans attendre la carte graphique
   quand l'extension de compilation parallèle existe) : d'un bloc, 4 à 10 ms ; creerSolGL le mène d'une traite */
export function creerSolGL(opt = {}) { const o = {}; for (const _ of creerSolGLEtapes(opt, o)) { /* rien */ } return o.r || { ok: false }; }
export function* creerSolGLEtapes(opt = {}, sortie = {}) {
  sortie.r = { ok: false };
  let canvas = null, gl = null;
  /* L4 : opt.canvas : rendu directement dans ce canevas de la page (aucune recopie) */
  if (opt.canvas) { canvas = opt.canvas; try { gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: false }); } catch (e) { gl = null; } if (!gl) return { ok: false }; }
  try {
    if (!gl) { canvas = document.createElement('canvas'); canvas.width = canvas.height = 2; }
    /* ni anticrénelage multi-échantillons (le sol n'a pas d'arête nette : ses bords sont des fondus), ni tampon conservé
       (le résultat est recopié dans la même tâche) : la fluidité de la marche */
    if (!gl) gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: false });
  } catch (e) { gl = null; }
  if (!gl) return;
  yield;
  const PAR = gl.getExtension('KHR_parallel_shader_compile');
  /* compiler et lier sans demander l'état (la carte graphique y travaille de son côté), puis attendre, par étapes, qu'elle ait fini */
  const shN = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
  const lier = (v, f) => { const p = gl.createProgram(), a = shN(gl.VERTEX_SHADER, v), b = shN(gl.FRAGMENT_SHADER, f); gl.attachShader(p, a); gl.attachShader(p, b); gl.linkProgram(p); return { p, a, b }; };
  function* attendre(L) { if (PAR) for (let i = 0; i < 200 && !gl.getProgramParameter(L.p, PAR.COMPLETION_STATUS_KHR); i++) yield; else yield; }
  const verifier = L => { if (!gl.getProgramParameter(L.p, gl.LINK_STATUS)) { const m = gl.getProgramInfoLog(L.p) || gl.getShaderInfoLog(L.a) || gl.getShaderInfoLog(L.b); throw new Error(m); } };
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  let prog, L1, L2 = null;
  L1 = lier(VS, FS); if (opt.canvas) L2 = lier(VS2, FS2);
  yield* attendre(L1);
  try { verifier(L1); prog = L1.p; } catch (e) { console.warn('[sol] ' + e.message); return; }
  yield;
  /* L4 : le programme des rectangles plein écran (seulement pour le calque rendu dans la page) */
  let prog2 = null, u2 = null, vao2 = null, mqTex = null;
  if (opt.canvas) {
    yield* attendre(L2);
    try {
      verifier(L2); prog2 = L2.p;
      u2 = { mode: gl.getUniformLocation(prog2, 'uMode'), col: gl.getUniformLocation(prog2, 'uCol'), g: gl.getUniformLocation(prog2, 'uG'), mq: gl.getUniformLocation(prog2, 'uMq'), mt: gl.getUniformLocation(prog2, 'uMt') };
      vao2 = gl.createVertexArray(); gl.bindVertexArray(vao2); const b2 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b2); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const aP = gl.getAttribLocation(prog2, 'aP'); gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
    } catch (e) { console.warn('[sol] ' + e.message); prog2 = null; }
  }
  yield;
  const aPos = gl.getAttribLocation(prog, 'aPos'), aUv = gl.getAttribLocation(prog, 'aUv'), aA = gl.getAttribLocation(prog, 'aA'), uTex = gl.getUniformLocation(prog, 'uTex');
  const buf = gl.createBuffer(), vao = gl.createVertexArray();
  gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  const ST = 7 * 4;
  gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 4, gl.FLOAT, false, ST, 0);
  gl.enableVertexAttribArray(aUv); gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, ST, 16);
  gl.enableVertexAttribArray(aA); gl.vertexAttribPointer(aA, 1, gl.FLOAT, false, ST, 24);
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
  const anisoMax = aniso ? Math.min(12, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)) : 0;
  const textures = new Map(), prets = new Set();
  /* une texture depuis un canevas (prémultipliée, mipmaps, anisotrope) ; repete : la tuile du chemin, sinon la bande */
  const sansMip = new Set();
  function finirTexture(src) { const t = textures.get(src); if (!t || !sansMip.has(src)) return; sansMip.delete(src); gl.bindTexture(gl.TEXTURE_2D, t); gl.generateMipmap(gl.TEXTURE_2D); }
  function texture(src, repete, plusTard = false) {
    let t = textures.get(src);
    if (t) { if (!plusTard) finirTexture(src); return t; }
    t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    /* N1 (quatorzième passe) : sur téléphone, aucune texture au-delà de 1024 px de côté (la tuile du chemin, la bande de
       la calade : 22 Mo de textures avant) ; les coordonnées de texture sont relatives, rien d'autre ne change */
    const up = pourTexture(src);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, up);
    if (up !== src) liberer(up);
    if (plusTard) sansMip.add(src); else gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const w = repete ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, w); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, w);
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, anisoMax);
    textures.set(src, t);
    return t;
  }
  let data = new Float32Array(7 * 4096), n = 0, lots = [], yMin = 1e9;
  /* une passe : vider, puis des rubans, puis rendre ; le résultat est dans `canvas` */
  function debut(wPx, hPx) {
    if (canvas.width !== wPx || canvas.height !== hPx) { canvas.width = wPx; canvas.height = hPx; }
    n = 0; lots = []; yMin = 1e9;
  }
  /* un ruban : rangs = [{ p: [[x, y, z] caméra, ...] (les points du rang, en travers, double précision), t: [[u, v],
     ...] (leurs coordonnées de texture), a: [opacité, ...] }] ; deux rangs voisins forment des quadrilatères (deux
     triangles chacun) ; proj : { CX, CY, FOC, W, H, NEAR } */
  function ruban(src, repete, rangs, proj, efface = false) {
    if (rangs.length < 2) return;
    const nc = rangs[0].p.length, besoin = (n + (rangs.length - 1) * (nc - 1) * 6) * 7;
    if (besoin > data.length) { const d2 = new Float32Array(Math.max(besoin, data.length * 2)); d2.set(data.subarray(0, n * 7)); data = d2; }
    const { CX, CY, FOC, W, H, NEAR } = proj, FAR = 2000, A = (FAR + NEAR) / (FAR - NEAR), B = -2 * FAR * NEAR / (FAR - NEAR);
    const kx = 2 * CX / W - 1, ky = 1 - 2 * CY / H, fx = 2 * FOC / W, fy = 2 * FOC / H;
    const debutLot = n;
    const sommet = (r, j) => {
      const p = r.p[j], t = r.t[j], i = n * 7, z = p[2];
      data[i] = kx * z + fx * p[0]; data[i + 1] = ky * z + fy * p[1]; data[i + 2] = A * z + B; data[i + 3] = z;
      data[i + 4] = t[0]; data[i + 5] = t[1]; data[i + 6] = r.a[j]; n++;
      /* le haut du sol à l'écran (fraction de la hauteur, depuis le haut) : on ne rend et ne recopie que la bande dessous */
      if (z > NEAR) { const yf = (1 - (ky * z + fy * p[1]) / z) / 2; if (yf < yMin) yMin = yf; }
    };
    for (let k = 0; k < rangs.length - 1; k++) {
      const r0 = rangs[k], r1 = rangs[k + 1];
      for (let j = 0; j < nc - 1; j++) {
        if (r0.a[j] <= 0 && r0.a[j + 1] <= 0 && r1.a[j] <= 0 && r1.a[j + 1] <= 0) continue;
        sommet(r0, j); sommet(r0, j + 1); sommet(r1, j);
        sommet(r0, j + 1); sommet(r1, j + 1); sommet(r1, j);
      }
    }
    if (n > debutLot) lots.push({ t: texture(src, repete), de: debutLot, nb: n - debutLot, efface });
  }
  /* L4 : l'image à poser après rendre() (le canevas) */
  function source() { return canvas; }
  /* L4 : le lavis de la terre (yh : l'horizon, en px du canevas depuis le haut ; col : couleur 0 à 1) */
  function quadTerre(yh, col) { if (!prog2) return; lots.push({ quad: 0, yh, col }); yMin = Math.min(yMin, Math.max(0, yh) / canvas.height); }
  /* L4 : le masque de la révélation (image d'alpha, ImageData ; mt : px du canevas vers coordonnées du masque, [sx, sy, ox, oy]) */
  function quadMasque(mq, mt) { if (!prog2) return; lots.push({ quad: 1, mq, mt }); }
  function rendre() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    /* la bande utile (de yMin au bas), en pixels du canevas ; le reste n'est ni vidé ni recopié */
    const y0 = Math.max(0, Math.min(canvas.height, Math.floor(yMin * canvas.height) - 2));
    bande.y = y0; bande.h = canvas.height - y0;
    gl.enable(gl.SCISSOR_TEST); gl.scissor(0, 0, canvas.width, Math.max(1, bande.h));
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    if (!lots.length || bande.h <= 0) return false;
    gl.useProgram(prog); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, n * 7), gl.DYNAMIC_DRAW);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.activeTexture(gl.TEXTURE0); gl.uniform1i(uTex, 0);
    let prog1 = true;
    for (const l of lots) {
      if (l.quad !== undefined) {
        /* L4 : un rectangle plein écran (le lavis de la terre, ou le masque de la révélation) */
        gl.useProgram(prog2); gl.bindVertexArray(vao2); prog1 = false;
        gl.uniform1i(u2.mode, l.quad); gl.uniform4f(u2.g, l.yh || 0, canvas.height, canvas.height, 0);
        if (l.quad === 0) { gl.uniform4f(u2.col, l.col[0], l.col[1], l.col[2], 1); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); }
        else {
          if (!mqTex) mqTex = gl.createTexture();
          gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, mqTex); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, l.mq);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.uniform1i(u2.mq, 1); gl.uniform4f(u2.mt, l.mt[0], l.mt[1], l.mt[2], l.mt[3]);
          gl.blendFunc(gl.ZERO, gl.SRC_ALPHA); gl.activeTexture(gl.TEXTURE0);
        }
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        continue;
      }
      if (!prog1) { gl.useProgram(prog); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.uniform1i(uTex, 0); prog1 = true; }
      /* L4 : un ruban qui efface (le masque des dalles efface la terre sous elles) */
      gl.blendFunc(l.efface ? gl.ZERO : gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindTexture(gl.TEXTURE_2D, l.t); gl.drawArrays(gl.TRIANGLES, l.de, l.nb);
    }
    return true;
  }
  /* K12 : préparer une texture hors de toute image (envoi, mipmaps, premier tracé dans un coin de 1 px), puis attendre,
     sans bloquer, que la carte graphique ait fini (une barrière interrogée à chaque étape) ; à mener dans une tâche de fond */
  /* P4 (seizième passe) : l'envoi de la texture et ses mipmaps en deux étapes */
  /* P4 bis : l'envoi et les mipmaps sont des étapes LOURD (voir lavis.js : dans WebKit, le travail se fait après l'étape, dans le
     processus graphique) ; la barrière est interrogée une fois par tranche (PAUSE) : avant, ses 400 interrogations se
     suivaient dans la même tranche (chacune ne coûte rien), sans jamais laisser passer une image ; elle n'attendait donc pas */
  function* prechauffer(src, repete) {
    texture(src, repete, true); yield LOURD;
    finirTexture(src); yield LOURD;
    /* L4 : rendu dans la page, pas d'essai dans un coin (il redimensionnerait le canevas affiché) */
    if (opt.canvas) { prets.add(src); return; }
    debut(4, 4); ruban(src, repete, [{ p: [[-1, -1, 2], [1, -1, 2]], t: [[0, 0], [1, 0]], a: [1, 1] }, { p: [[-1, 1, 2], [1, 1, 2]], t: [[0, 1], [1, 1]], a: [1, 1] }], { CX: 2, CY: 2, FOC: 2, W: 4, H: 4, NEAR: .3 });
    rendre(); gl.flush();
    /* L4 (douzième passe) : une barrière peut manquer (contexte perdu, ou refusée par le navigateur) : on n'attend pas */
    const f = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); gl.flush();
    if (f) { for (let i = 0; i < 400; i++) { const r = gl.clientWaitSync(f, 0, 0); if (r === gl.ALREADY_SIGNALED || r === gl.CONDITION_SATISFIED) break; yield PAUSE; } gl.deleteSync(f); }
    prets.add(src);
  }
  /* une texture dont le canevas a changé (un lavis arrivé) : à recharger */
  function oublier(src) { const t = textures.get(src); if (t) { gl.deleteTexture(t); textures.delete(src); prets.delete(src); } }
  const bande = { y: 0, h: 0 };
  sortie.r = { ok: true, canvas, source, debut, ruban, quadTerre, quadMasque, rendre, oublier, texture, prechauffer, pret: src => prets.has(src), bande, vider: () => { gl.viewport(0, 0, canvas.width, canvas.height); gl.disable(gl.SCISSOR_TEST); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); } };
}
