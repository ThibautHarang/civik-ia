/* =====================================================================
   Le papier (deuxième passe, 02/10/2026) : un seul canevas WebGL où se
   dessinent les objets de papier réels. Le CV sur le poteau, dans la main,
   sur la planche ; la feuille de dessin quand elle se tourne ; leurs
   ombres portées ; les clous ; l'écriture de Thibaut révélée pixel par
   pixel selon son temps d'apparition.
   Une feuille est un maillage fin : pour chaque sommet, on calcule sa
   position à l'écran, sa position 3D locale (pour la lumière : normale,
   recto, verso) et sa hauteur au-dessus du support (pour l'ombre). Le
   texte est imprimé dans la texture : il suit la courbure et prend les
   ombres de la feuille, comme une impression.
   Repli sans WebGL : la feuille à plat, au canevas 2D.
   ===================================================================== */
import { clamp } from './outils.js';
import { TEX_MAX, pourTexture, liberer, TEL, plafondDpr } from './memoire.js';

const VS = `
attribute vec2 a_pos; attribute vec2 a_uv; attribute vec2 a_lum; attribute float a_h;
uniform vec2 u_res;
varying vec2 v_uv; varying vec2 v_lum; varying float v_h;
void main(){ v_uv = a_uv; v_lum = a_lum; v_h = a_h; vec2 c = a_pos / u_res * 2.0 - 1.0; gl_Position = vec4(c.x, -c.y, 0.0, 1.0); }`;
const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform int u_mode;
uniform sampler2D u_t0, u_t1, u_t2, u_t3;
uniform float u_op, u_dechire, u_griffe, u_t, u_inv, u_fibres, u_jeter, u_miroir, u_flou;
uniform vec2 u_pad;
uniform vec3 u_couleur;
/* T8 (vingtième passe) : le bord du pupitre, une droite de l'écran (en pixels de l'appareil, valeur positive du côté visible) */
uniform vec3 u_clip; uniform float u_clipOn;
/* U3 (vingt et unième passe) : la largeur du rebord du pli au bord du pupitre (pixels de l'appareil, 0 : pas de rebord) */
uniform float u_rebord;
/* Y13 (vingt-cinquième passe, 09/10/2026) : sur téléphone, la page tournée. v_h y porte la position de la feuille par rapport au bord du
   pupitre (négative au-delà) ; un fragment n'est caché que s'il est au-delà du bord ET du côté du bois à l'écran (le pupitre le masque) ;
   au-delà du bord mais au-dessus de la droite, il est devant le mur (en l'air) : il se voit */
uniform float u_bordTel;
varying vec2 v_uv; varying vec2 v_lum; varying float v_h;
void main(){
  /* derrière le pupitre : caché par le bois. T8 : avec u_clipOn, la limite est la droite du bord du pupitre, lissée sur un pixel
     (au lieu du signe de v_h interpolé, qui dessinait des dents de scie quand la maille est grossière) */
  float cl = 1.0;
  if (u_mode < 2) {
    if (u_clipOn > 0.5 && u_mode == 0 && u_bordTel > 0.5) { cl = v_h < 0.0 ? 1.0 - clamp(dot(u_clip.xy, gl_FragCoord.xy) + u_clip.z + 0.5, 0.0, 1.0) : 1.0; if (cl <= 0.0) discard; }   /* Y13 */
    else if (u_clipOn > 0.5) { cl = clamp(dot(u_clip.xy, gl_FragCoord.xy) + u_clip.z + 0.5, 0.0, 1.0); if (cl <= 0.0) discard; }
    else if (v_h < -0.0001) discard;
  }
  if (u_mode == 0) {
    vec2 uv = clamp(v_uv, 0.0, 1.0);
    /* K9 (onzième passe) : u_flou, un biais de finesse (mipmap) qui adoucit les bords de la feuille quand elle est petite */
    vec4 c = gl_FrontFacing ? texture2D(u_t0, uv, u_flou) : texture2D(u_t1, vec2(mix(uv.x, 1.0 - uv.x, u_miroir), uv.y), u_flou);
    float l = gl_FrontFacing ? v_lum.x : v_lum.y;
    vec4 d = texture2D(u_t2, uv);
    float garde = u_inv > 0.5 ? d.r : 1.0 - d.r * u_dechire;
    float g = 1.0 - texture2D(u_t3, uv).a * u_griffe;
    c.rgb = mix(c.rgb, vec3(c.a * 0.99), d.g * u_fibres);
    /* U3 : le rebord du pli, juste avant la droite de coupe (le bord du pupitre) : le papier y tourne d'un quart de tour vers le
       mur ; à la distance d de la coupe, sin(th) = 1 - d / rebord ; la lumière de la page (haut gauche, de face) et son reflet doux,
       rapportés à ceux de la feuille à plat : plus clair vers 20 degrés, un peu plus sombre à la crête */
    if (u_rebord > 0.0 && u_clipOn > 0.5) {
      float dd = dot(u_clip.xy, gl_FragCoord.xy) + u_clip.z;
      if (dd < u_rebord) {
        float s = clamp(1.0 - dd / u_rebord, 0.0, 1.0), co = sqrt(1.0 - s * s);
        vec3 n = vec3(0.0, -s, co), L = vec3(-0.319, -0.618, 0.718), Hh = vec3(-0.175, -0.339, 0.924);
        float plat = 0.44 + 0.56 * 0.718 + 0.2 * pow(0.924, 18.0);
        float rb = (0.44 + 0.56 * max(dot(n, L), 0.0) + 0.2 * pow(max(dot(n, Hh), 0.0), 18.0)) / plat;
        l *= rb;
      }
    }
    vec4 o = vec4(c.rgb * l, c.a) * (garde * g * u_op);
    if (o.a < u_jeter) discard;
    gl_FragColor = o * cl;
  } else if (u_mode == 1) {
    vec2 uvb = (v_uv + u_pad) / (1.0 + 2.0 * u_pad);
    float k = clamp(v_h, 0.0, 1.0);
    float a = mix(texture2D(u_t0, uvb).a, texture2D(u_t1, uvb).a, k) * (1.0 - 0.55 * k);
    vec2 uv = clamp(v_uv, 0.0, 1.0);
    a *= (1.0 - texture2D(u_t2, uv).r * u_dechire) * (1.0 - texture2D(u_t3, uv).a * u_griffe) * u_op;
    gl_FragColor = vec4(u_couleur * a, a) * cl;
  } else if (u_mode == 2) {
    vec4 c = texture2D(u_t0, v_uv);
    vec4 tt = texture2D(u_t1, v_uv);
    float t = (tt.r * 65280.0 + tt.g * 255.0) / 65535.0;
    float k = clamp((u_t - t) / 0.004, 0.0, 1.0);
    gl_FragColor = c * (k * u_op);
  } else {
    vec4 c = texture2D(u_t0, v_uv);
    if (u_inv > 0.5) { float a = c.a * u_op; gl_FragColor = vec4(u_couleur * a, a); }
    else gl_FragColor = c * u_op;
  }
}`;

/* la lumière commune : venue du haut à gauche, un peu de face */
export const LUMIERE = (() => { const v = [-.42, -.55, .72], n = Math.hypot(...v); return v.map(x => x / n); })();
const AMB = .44, DIF = .56;
/* le vecteur à mi-chemin entre la lumière et le regard (de face) : pour le reflet */
const SPEC_H = (() => { const v = [LUMIERE[0], LUMIERE[1], LUMIERE[2] + 1], n = Math.hypot(...v); return v.map(x => x / n); })();

/* un sommet : position écran, position locale, pied (projection sur le support), hauteur */
const nouveauSommet = () => ({ x: 0, y: 0, X: 0, Y: 0, Z: 0, fx: 0, fy: 0, h: 0 });

/* S4 : en mode économe forcé sur ordinateur (?eco=1), pas de lissage multi-échantillons non plus */
const ECO_SANS_LISSAGE = !!window.__eco;
export function creerPapier(scene) {
  let canvas = document.createElement('canvas');
  canvas.className = 'papier-gl'; canvas.setAttribute('aria-hidden', 'true');
  scene.appendChild(canvas);
  /* sans carte graphique (rendu logiciel), WebGL est refusé : le papier passe au canevas 2D, sans relief ni ombre,
     plutôt que dix secondes de démarrage et des images saccadées */
  /* S2 (dix-neuvième passe, 07/10/2026) : sur téléphone, sans lissage multi-échantillons : ses tampons (quatre échantillons
     de couleur et de pochoir, plein écran) pesaient plusieurs dizaines de Mo sur la carte graphique de l'iPhone, là où il
     tombait ; le bord du papier, à une densité de 2 sur un écran de 3, reste doux */
  const attr = { alpha: true, premultipliedAlpha: true, antialias: !TEL && !ECO_SANS_LISSAGE, stencil: true, preserveDrawingBuffer: false, failIfMajorPerformanceCaveat: true };
  /* S4 (dix-neuvième passe) : le cahier demandait, en mode économe, le papier sans WebGL (la page blanche en image) ; essayé, le
     repli en canevas 2D perd la fin du film (ni la page tournée, ni la phrase de Thibaut, ni la bulle : capture du 07/10/2026).
     Tranché : le mode économe garde le papier en WebGL, sans lissage multi-échantillons (comme tout téléphone, S2) et à une
     densité de 1,5 ; il perd le lavis WebGL du sol (un contexte de moins) */
  let gl = canvas.getContext('webgl2', attr), gl2 = !!gl;
  if (!gl) gl = canvas.getContext('webgl', attr) || canvas.getContext('experimental-webgl', attr);
  /* un rendu logiciel qui ne s'annonce pas comme tel (SwiftShader, llvmpipe) : même repli */
  if (gl) { const i = gl.getExtension('WEBGL_debug_renderer_info'), r = i ? String(gl.getParameter(i.UNMASKED_RENDERER_WEBGL)) : ''; if (/swiftshader|llvmpipe|software|basic render/i.test(r)) { const p = gl.getExtension('WEBGL_lose_context'); if (p) p.loseContext(); gl = null; canvas.replaceWith(canvas = canvas.cloneNode()); } }
  const ok = !!gl;
  let W = 1, H = 1, DPR = 1;
  const file = [];
  let visible = false;
  /* M8 (treizième passe) : caché tant que rien n'y est posé (vide, il était quand même composé à chaque image, plein
     écran : sur téléphone, de l'atelier à la fin) */
  canvas.style.visibility = 'hidden';

  /* ---------------- WebGL ---------------- */
  let prog = null, loc = {}, vbo = null, ibos = new Map(), blanc = null, vide = null, aniso = null;
  if (ok) {
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error('papier : ' + gl.getShaderInfoLog(o)); return o; };
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('papier : ' + gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    ['a_pos', 'a_uv', 'a_lum', 'a_h'].forEach(n => loc[n] = gl.getAttribLocation(prog, n));
    ['u_res', 'u_mode', 'u_t0', 'u_t1', 'u_t2', 'u_t3', 'u_op', 'u_dechire', 'u_griffe', 'u_t', 'u_pad', 'u_inv', 'u_fibres', 'u_jeter', 'u_miroir', 'u_couleur', 'u_flou', 'u_clip', 'u_clipOn', 'u_rebord', 'u_bordTel'].forEach(n => loc[n] = gl.getUniformLocation(prog, n));
    [0, 1, 2, 3].forEach(i => gl.uniform1i(loc['u_t' + i], i));
    vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    const st = 7 * 4;
    gl.enableVertexAttribArray(loc.a_pos); gl.vertexAttribPointer(loc.a_pos, 2, gl.FLOAT, false, st, 0);
    gl.enableVertexAttribArray(loc.a_uv); gl.vertexAttribPointer(loc.a_uv, 2, gl.FLOAT, false, st, 8);
    gl.enableVertexAttribArray(loc.a_lum); gl.vertexAttribPointer(loc.a_lum, 2, gl.FLOAT, false, st, 16);
    gl.enableVertexAttribArray(loc.a_h); gl.vertexAttribPointer(loc.a_h, 1, gl.FLOAT, false, st, 24);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    /* nos triangles tournent dans le sens horaire une fois y retourné : c'est le recto */
    gl.frontFace(gl.CW);
    aniso = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
    const px1 = (r, g, b, a) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([r, g, b, a])); return { tex: t, w: 1, h: 1 }; };
    blanc = px1(255, 255, 255, 255); vide = px1(0, 0, 0, 0);
  }
  const pot = n => { let p = 1; while (p < n) p *= 2; return p; };

  /* une texture depuis une image ou un canevas (prémultipliée, avec mipmaps) */
  function texture(src, o = {}) {
    const T = { src, w: src.naturalWidth || src.width, h: src.naturalHeight || src.height, tex: null };
    if (!ok) return T;
    T.tex = gl.createTexture();
    T.maj = s => {
      s = s || T.src;
      let up = s;
      const mip = o.mip !== false;
      if (!gl2 && mip) {
        /* WebGL 1 : les mipmaps veulent des côtés en puissance de deux */
        /* N1 (quatorzième passe) : au plus TEX_MAX de côté (1024 sur téléphone) */
        const w = Math.min(2048, TEX_MAX, pot(T.w)), h = Math.min(2048, TEX_MAX, pot(T.h));
        if (w !== T.w || h !== T.h) { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(s, 0, 0, w, h); c._temp = true; up = c; }
      } else if (!o.plein) up = pourTexture(s);
      /* N1 : sur téléphone, aucune texture au-delà de 1024 px de côté (l'écriture 2174 x 833, la feuille de dessin, la page :
         ces feuilles ne dépassent pas la largeur de l'écran) ; les coordonnées de texture sont relatives ; o.plein : pleine
         résolution (la phrase manuscrite de Thibaut, qui ne change pas) */
      gl.bindTexture(gl.TEXTURE_2D, T.tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, up);
      if (up !== s && up._temp) liberer(up);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (mip) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT))); }
      else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    };
    T.maj(src);
    return T;
  }
  /* P4 (seizième passe) : l'écriture de Thibaut, envoyée par bandes de 128 rangées (une étape chacune) depuis ses pixels
     (décodés par l'ouvrier) : d'un bloc, la phrase (2174 x 833) et son temps prenaient 5 à 15 ms chacun. Même texture
     qu'avec texture(image, { plein }) (prémultipliée, mipmaps) et donnees(w, h, px) (brute, sans lissage) */
  const BANDE_TEX = 128;
  function* textureEtapes(w, h, data, o = {}, sortie = {}) {
    const T = { src: null, w, h, tex: null }; sortie.T = T;
    if (!ok || (!gl2 && o.mip !== false)) return;
    T.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, T.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    yield;
    for (let y = 0; y < h; y += BANDE_TEX) {
      const hb = Math.min(BANDE_TEX, h - y);
      gl.bindTexture(gl.TEXTURE_2D, T.tex); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, w, hb, gl.RGBA, gl.UNSIGNED_BYTE, data.subarray(y * w * 4, (y + hb) * w * 4));
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      yield;
    }
    gl.bindTexture(gl.TEXTURE_2D, T.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (o.mip !== false) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT))); }
    else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
  function* donneesEtapes(w, h, px, sortie = {}) {
    const T = { w, h, tex: null }; sortie.T = T;
    if (!ok) return;
    T.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, T.tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    yield;
    for (let y = 0; y < h; y += BANDE_TEX) {
      const hb = Math.min(BANDE_TEX, h - y);
      gl.bindTexture(gl.TEXTURE_2D, T.tex); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, w, hb, gl.RGBA, gl.UNSIGNED_BYTE, px.subarray(y * w * 4, (y + hb) * w * 4));
      yield;
    }
    gl.bindTexture(gl.TEXTURE_2D, T.tex);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  }
  /* une texture de données brutes (le temps de l'écriture) : sans lissage ni prémultiplication */
  function donnees(w, h, px) {
    const T = { w, h, tex: null };
    if (!ok) return T;
    T.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, T.tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return T;
  }
  /* la silhouette d'une feuille, floutée à deux degrés, avec une marge : pour l'ombre portée */
  function flous(src, pad = .16) {
    const sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height, a = sh / sw;
    const fait = (largeur, etapes) => {
      const lw = Math.round(largeur * (1 + 2 * pad)), lh = Math.round(largeur * a + largeur * 2 * pad);
      let c = document.createElement('canvas'); c.width = lw; c.height = lh;
      let g = c.getContext('2d'); g.drawImage(src, largeur * pad, largeur * pad, largeur, largeur * a);
      g.globalCompositeOperation = 'source-in'; g.fillStyle = '#000'; g.fillRect(0, 0, lw, lh);
      /* flou par réductions successives puis agrandissement lissé */
      etapes.forEach(k => { const d = document.createElement('canvas'); d.width = Math.max(2, Math.round(lw * k)); d.height = Math.max(2, Math.round(lh * k)); const dg = d.getContext('2d'); dg.imageSmoothingQuality = 'high'; dg.drawImage(c, 0, 0, d.width, d.height); const u = document.createElement('canvas'); u.width = lw; u.height = lh; const ug = u.getContext('2d'); ug.imageSmoothingQuality = 'high'; ug.drawImage(d, 0, 0, lw, lh); c = u; });
      return texture(c, { mip: false });
    };
    return { moyen: fait(160, [.18, .3]), doux: fait(160, [.07, .12, .25]), pad, padV: pad / a };
  }

  function dims(w, h) {
    W = w; H = h; DPR = Math.min(window.devicePixelRatio || 1, plafondDpr(2));   /* S4 : 1,5 en mode économe */
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  }

  /* ---------------- maillages ---------------- */
  function indices(nu, nv) {
    const cle = nu + 'x' + nv; if (ibos.has(cle)) return ibos.get(cle);
    const a = new Uint16Array((nu - 1) * (nv - 1) * 6); let k = 0;
    for (let j = 0; j < nv - 1; j++) for (let i = 0; i < nu - 1; i++) { const p = j * nu + i; a[k++] = p; a[k++] = p + 1; a[k++] = p + nu; a[k++] = p + 1; a[k++] = p + nu + 1; a[k++] = p + nu; }
    const b = ok ? gl.createBuffer() : null;
    if (ok) { gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, a, gl.STATIC_DRAW); }
    const r = { b, n: a.length, a }; ibos.set(cle, r); return r;
  }
  const s0 = nouveauSommet();
  /* grille de sommets : u de u0 à u1, v de v0 à v1 ; renvoie positions, uv, lumières, hauteurs, pieds */
  /* T8 (vingtième passe) : vmap (facultatif) répartit les rangées : t de 0 à 1 vers la fraction de la hauteur (plus de rangées là où
     la feuille se courbe) */
  /* Y13 : bord (facultatif) : la hauteur passée au shader est remplacée par la position par rapport au bord du pupitre (s0.b) */
  function grille(nu, nv, u0, u1, v0, v1, sommet, lum, vmap, bord) {
    const n = nu * nv, S = new Float32Array(n * 2), P = new Float32Array(n * 3), Fp = new Float32Array(n * 2), Hh = new Float32Array(n), UV = new Float32Array(n * 2);
    const VJ = new Float32Array(nv); for (let j = 0; j < nv; j++) VJ[j] = v0 + (v1 - v0) * (vmap ? vmap(j / (nv - 1)) : j / (nv - 1));
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const u = u0 + (u1 - u0) * i / (nu - 1), v = VJ[j], k = j * nu + i;
      s0.Z = 0; s0.h = 0; s0.U = undefined; s0.V = undefined; sommet(u, v, s0);
      S[k * 2] = s0.x; S[k * 2 + 1] = s0.y; P[k * 3] = s0.X; P[k * 3 + 1] = s0.Y; P[k * 3 + 2] = s0.Z;
      /* septième passe, G5 : le sommet peut déplacer sa coordonnée de texture (la feuille qui se déroule) */
      Fp[k * 2] = s0.fx; Fp[k * 2 + 1] = s0.fy; Hh[k] = bord ? s0.b : s0.h; UV[k * 2] = s0.U === undefined ? u : s0.U; UV[k * 2 + 1] = s0.V === undefined ? v : s0.V;
    }
    let LF = null, LB = null;
    if (lum) {
      LF = new Float32Array(n); LB = new Float32Array(n);
      const L = lum, ref = AMB + DIF * L[2];
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const k = j * nu + i, ia = Math.max(0, i - 1), ib = Math.min(nu - 1, i + 1), ja = Math.max(0, j - 1), jb = Math.min(nv - 1, j + 1);
        const a = (j * nu + ia) * 3, b = (j * nu + ib) * 3, c = (ja * nu + i) * 3, d = (jb * nu + i) * 3;
        const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
        const vx = P[d] - P[c], vy = P[d + 1] - P[c + 1], vz = P[d + 2] - P[c + 2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        const dl = nx * L[0] + ny * L[1] + nz * L[2];
        /* un reflet doux qui court sur la courbure (papier mat : large et faible) */
        const hn = SPEC_H, sh = nx * hn[0] + ny * hn[1] + nz * hn[2];
        const spF = Math.pow(Math.max(0, sh), 18) * .2, spB = Math.pow(Math.max(0, -sh), 18) * .14;
        LF[k] = clamp((AMB + DIF * Math.max(0, dl)) / ref + spF, .42, 1.22);
        LB[k] = clamp((AMB + DIF * Math.max(0, -dl)) / ref * .97 + spB, .42, 1.18);
      }
    }
    return { nu, nv, n, S, P, Fp, Hh, UV, LF, LB };
  }

  /* ---------------- file d'affichage ---------------- */
  function debut() { file.length = 0; }
  function feuille(o) { file.push({ type: 'feuille', o }); }
  function image(o) { file.push({ type: 'image', o }); }
  function encre(o) { file.push({ type: 'encre', o }); }
  function masque(quad) { if (quad) file.push({ type: 'masque', o: { quad } }); }

  let tampon = new Float32Array(7 * 4096);
  function envoyer(n, remplir) {
    if (tampon.length < n * 7) tampon = new Float32Array(n * 7 * 2);
    remplir(tampon);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, tampon.subarray(0, n * 7), gl.DYNAMIC_DRAW);
  }
  function lier(t0, t1, t2, t3) {
    [t0 || blanc, t1 || t0 || blanc, t2 || vide, t3 || vide].forEach((T, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, T.tex); });
  }
  function uniformes(u) {
    gl.uniform1i(loc.u_mode, u.mode || 0);
    gl.uniform1f(loc.u_op, u.op === undefined ? 1 : u.op);
    gl.uniform1f(loc.u_dechire, u.dechire || 0); gl.uniform1f(loc.u_griffe, u.griffe || 0);
    gl.uniform1f(loc.u_t, u.t || 0); const pd = u.pad || [0, 0]; gl.uniform2f(loc.u_pad, pd[0], pd[1]); gl.uniform1f(loc.u_inv, u.inv ? 1 : 0);
    gl.uniform1f(loc.u_fibres, u.fibres || 0); gl.uniform1f(loc.u_jeter, u.jeter || 0); gl.uniform1f(loc.u_miroir, u.miroir === false ? 0 : 1); gl.uniform1f(loc.u_flou, u.flou || 0);
    const c = u.couleur || [0, 0, 0]; gl.uniform3f(loc.u_couleur, c[0], c[1], c[2]);
    /* T8 : la droite de coupe, donnée en pixels CSS (a x + b y + c, positive du côté visible, normale unitaire), passée en pixels
       de l'appareil, origine en bas à gauche (gl_FragCoord) */
    const k = u.clip;
    gl.uniform1f(loc.u_clipOn, k ? 1 : 0);
    if (k) gl.uniform3f(loc.u_clip, k[0], -k[1], DPR * (k[1] * H + k[2]));
    gl.uniform1f(loc.u_rebord, u.rebord ? u.rebord * DPR : 0);   /* U3 */
    gl.uniform1f(loc.u_bordTel, u.bordTel ? 1 : 0);   /* Y13 */
  }
  /* le gabarit : bits 0 à 6 pour l'ombre du pouce, bit 7 pour le masque des objets tenus devant (sixième passe, F5) */
  function stencil(o) {
    if (o.ecrireStencil) { gl.enable(gl.STENCIL_TEST); gl.stencilMask(0x7F); gl.stencilFunc(gl.ALWAYS, o.ecrireStencil, 0x7F); gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE); }
    else if (o.testStencil) { gl.enable(gl.STENCIL_TEST); gl.stencilMask(0x7F); gl.stencilFunc(gl.EQUAL, o.testStencil, 0x7F); gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); }
    else if (o.horsMasque) { gl.enable(gl.STENCIL_TEST); gl.stencilMask(0); gl.stencilFunc(gl.EQUAL, 0, 0x80); gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); }
    else gl.disable(gl.STENCIL_TEST);
  }
  /* un objet tenu devant le monde (le téléphone) : ce qui est dessiné ensuite avec « horsMasque » ne passe pas dessus */
  function dessinerMasque(o) {
    const q = o.quad;
    envoyer(4, t => { const pts = [q[0], q[1], q[3], q[2]]; for (let k = 0; k < 4; k++) { t[k * 7] = pts[k][0]; t[k * 7 + 1] = pts[k][1]; t[k * 7 + 2] = k % 2; t[k * 7 + 3] = k > 1 ? 1 : 0; t[k * 7 + 4] = 1; t[k * 7 + 5] = 1; t[k * 7 + 6] = 0; } });
    lier(null); uniformes({ mode: 3, op: 1 });
    gl.enable(gl.STENCIL_TEST); gl.stencilMask(0x80); gl.stencilFunc(gl.ALWAYS, 0x80, 0x80); gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    gl.colorMask(false, false, false, false);
    const I = indices(2, 2); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, I.b); gl.drawElements(gl.TRIANGLES, I.n, gl.UNSIGNED_SHORT, 0);
    gl.colorMask(true, true, true, true); gl.stencilMask(0xFF);
  }

  function dessinerFeuille(o) {
    const nu = o.nu || 16, nv = o.nv || 22, uvr = o.uv || [0, 1, 0, 1];
    /* l'ombre portée d'abord, sur une grille élargie (marge de flou) */
    if (o.ombre && o.ombre.op > .002 && o.ombre.flous) {
      const fl = o.ombre.flous, pad = fl.pad, padV = fl.padV;
      /* T8 : l'ombre a sa propre maille (o.ombre.nu, o.ombre.nv) et sa propre répartition des rangées (o.ombre.vmap), calculée sur
         sa hauteur élargie : celle de la feuille, appliquée à la grille élargie, tombait à côté du rouleau (l'ombre était coupée net) */
      const nuS = o.ombre.nu || nu, nvS = o.ombre.nv || nv;
      /* T8 bis : une maille gardée (o.cache) est reprise telle quelle si o.reprendre (la page posée, une image sur deux) */
      const C = o.cache, Gs = C && o.reprendre && C.Gs && C.Gs.n === nuS * nvS ? C.Gs : grille(nuS, nvS, uvr[0] - pad, uvr[1] + pad, uvr[2] - padV, uvr[3] + padV, o.sommet, null, o.ombre.vmap);
      if (C) C.Gs = Gs;
      const ob = o.ombre, base = ob.base || [0, 0], dir = ob.dir || [0, 0], hmax = ob.hmax || .12;
      envoyer(Gs.n, t => { for (let k = 0; k < Gs.n; k++) { const h = Gs.Hh[k]; t[k * 7] = Gs.Fp[k * 2] + base[0] + dir[0] * h; t[k * 7 + 1] = Gs.Fp[k * 2 + 1] + base[1] + dir[1] * h; t[k * 7 + 2] = Gs.UV[k * 2]; t[k * 7 + 3] = Gs.UV[k * 2 + 1]; t[k * 7 + 4] = 1; t[k * 7 + 5] = 1; t[k * 7 + 6] = h / hmax; } });
      lier(fl.moyen, fl.doux, o.dechire && o.dechire.tex, o.griffe && o.griffe.tex);
      uniformes({ mode: 1, op: ob.op * (o.op === undefined ? 1 : o.op), pad: [pad, padV], couleur: ob.couleur || [.08, .05, .02], dechire: o.dechire && !o.dechire.inv ? o.dechire.k : 0, griffe: o.griffe ? o.griffe.k : 0, clip: o.clip });
      stencil({ horsMasque: o.horsMasque });
      const I = indices(nuS, nvS); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, I.b); gl.drawElements(gl.TRIANGLES, I.n, gl.UNSIGNED_SHORT, 0);
    }
    const C = o.cache, G = C && o.reprendre && C.G && C.G.n === nu * nv ? C.G : grille(nu, nv, uvr[0], uvr[1], uvr[2], uvr[3], o.sommet, o.lumiere || LUMIERE, o.vmap, o.bordTel);   /* T8 bis */   /* Y13 : o.bordTel */
    if (C) C.G = G;
    const om = o.ombrage === undefined ? 1 : o.ombrage;
    envoyer(G.n, t => { for (let k = 0; k < G.n; k++) { t[k * 7] = G.S[k * 2]; t[k * 7 + 1] = G.S[k * 2 + 1]; t[k * 7 + 2] = G.UV[k * 2]; t[k * 7 + 3] = G.UV[k * 2 + 1]; t[k * 7 + 4] = (1 + (G.LF[k] - 1) * om) * (o.eclat || 1); t[k * 7 + 5] = (1 + (G.LB[k] - 1) * om) * (o.eclat || 1); t[k * 7 + 6] = G.Hh[k]; } });
    lier(o.recto, o.verso || o.recto, o.dechire && o.dechire.tex, o.griffe && o.griffe.tex);
    uniformes({ mode: 0, op: o.op, miroir: o.miroir, dechire: o.dechire ? o.dechire.k : 0, inv: o.dechire && o.dechire.inv, fibres: o.dechire ? (o.dechire.fibres || 0) : 0, griffe: o.griffe ? o.griffe.k : 0, jeter: o.ecrireStencil ? .5 : 0, flou: o.flou || 0 , clip: o.clip, rebord: o.rebord, bordTel: o.bordTel });   /* Y13 */
    stencil(o);
    const I = indices(nu, nv); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, I.b); gl.drawElements(gl.TRIANGLES, I.n, gl.UNSIGNED_SHORT, 0);
    return G;
  }
  /* une image posée sur un quadrilatère écran (affine par deux triangles, ou grille si homographie) */
  function dessinerImage(o) {
    const q = o.quad, n = 4;
    envoyer(n, t => { const uv = [[0, 0], [1, 0], [0, 1], [1, 1]], pts = [q[0], q[1], q[3], q[2]]; for (let k = 0; k < 4; k++) { t[k * 7] = pts[k][0]; t[k * 7 + 1] = pts[k][1]; t[k * 7 + 2] = uv[k][0]; t[k * 7 + 3] = uv[k][1]; t[k * 7 + 4] = o.lum || 1; t[k * 7 + 5] = 1; t[k * 7 + 6] = 0; } });
    lier(o.tex);
    uniformes({ mode: 3, op: o.op, inv: !!o.couleur, couleur: o.couleur });
    stencil(o);
    const I = indices(2, 2); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, I.b); gl.drawElements(gl.TRIANGLES, I.n, gl.UNSIGNED_SHORT, 0);
  }
  function dessinerEncre(o) {
    const nu = 10, nv = 6;
    const G = grille(nu, nv, 0, 1, 0, 1, o.sommet, null);
    envoyer(G.n, t => { for (let k = 0; k < G.n; k++) { t[k * 7] = G.S[k * 2]; t[k * 7 + 1] = G.S[k * 2 + 1]; t[k * 7 + 2] = G.UV[k * 2]; t[k * 7 + 3] = G.UV[k * 2 + 1]; t[k * 7 + 4] = 1; t[k * 7 + 5] = 1; t[k * 7 + 6] = 0; } });
    lier(o.encre, o.temps);
    uniformes({ mode: 2, op: o.op, t: o.t });
    stencil({});
    const I = indices(nu, nv); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, I.b); gl.drawElements(gl.TRIANGLES, I.n, gl.UNSIGNED_SHORT, 0);
  }

  /* ---------------- repli 2D ---------------- */
  let g2 = null;
  function repli() {
    if (!g2) g2 = canvas.getContext('2d');
    g2.setTransform(1, 0, 0, 1, 0, 0); g2.clearRect(0, 0, canvas.width, canvas.height);
    for (const it of file) {
      if (it.type !== 'feuille') continue;
      const o = it.o, src = o.recto && o.recto.src; if (!src) continue;
      const nu = 5, nv = 7, G = grille(nu, nv, 0, 1, 0, 1, o.sommet, o.lumiere || LUMIERE), sw = src.width || src.naturalWidth, sh = src.height || src.naturalHeight;
      g2.globalAlpha = o.op === undefined ? 1 : o.op;
      for (let j = 0; j < nv - 1; j++) for (let i = 0; i < nu - 1; i++) {
        [[[i, j], [i + 1, j], [i, j + 1]], [[i + 1, j], [i + 1, j + 1], [i, j + 1]]].forEach(tri => {
          const p = tri.map(([a, b]) => b * nu + a), s = p.map(k => [G.S[k * 2] * DPR, G.S[k * 2 + 1] * DPR]), t = p.map(k => [G.UV[k * 2] * sw, G.UV[k * 2 + 1] * sh]);
          const [x0, y0] = t[0], [x1, y1] = t[1], [x2, y2] = t[2], d = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0); if (!d) return;
          const a = ((s[1][0] - s[0][0]) * (y2 - y0) - (s[2][0] - s[0][0]) * (y1 - y0)) / d, b = ((s[1][1] - s[0][1]) * (y2 - y0) - (s[2][1] - s[0][1]) * (y1 - y0)) / d;
          const c = ((s[2][0] - s[0][0]) * (x1 - x0) - (s[1][0] - s[0][0]) * (x2 - x0)) / d, e = ((s[2][1] - s[0][1]) * (x1 - x0) - (s[1][1] - s[0][1]) * (x2 - x0)) / d;
          g2.save(); g2.beginPath(); g2.moveTo(s[0][0], s[0][1]); g2.lineTo(s[1][0], s[1][1]); g2.lineTo(s[2][0], s[2][1]); g2.closePath(); g2.clip();
          g2.setTransform(a, b, c, e, s[0][0] - a * x0 - c * y0, s[0][1] - b * x0 - e * y0); g2.drawImage(src, 0, 0); g2.restore();
        });
      }
    }
    g2.globalAlpha = 1;
  }

  /* ---------------- rendu de la file ---------------- */
  /* T8 (vingtième passe, 07/10/2026) : sur téléphone, le papier n'a plus de lissage multi-échantillons depuis la dix-neuvième passe
     (sa mémoire) : le contour de la page tournée et de son ombre était en marches d'escalier d'un pixel et demi. Pour la seule page
     de la fin (les objets marqués aa), le rendu passe par un tampon multi-échantillons (WebGL 2, quatre échantillons), recopié dans
     le canevas à chaque image ; ce tampon n'existe que pendant la page (rendu dès qu'elle n'est plus là) ; ?msaa=0 l'écarte */
  /* X2 bis (vingt-quatrième passe, 08/10/2026) : en mode économe, pas de tampon multi-échantillons (T8) : mesuré sur l'iPhone chaud, le retour
     rapide de la fin vers le chemin mourait à p 0,71 avec lui (trois fois sur trois) et passait la porte de l'atelier sans lui (?msaa=0) ;
     les bords de la page tournée y sont un peu moins lisses */
  const MS_OK = TEL && gl2 && !ECO_SANS_LISSAGE && new URLSearchParams(location.search).get('msaa') !== '0';
  let MS = null, msLibre = 0;
  function msLiberer() { if (!MS) return; gl.deleteFramebuffer(MS.fb); gl.deleteRenderbuffer(MS.c); gl.deleteRenderbuffer(MS.ds); MS = null; }
  function msPreparer(w, h) {
    if (MS && MS.w === w && MS.h === h) return MS;
    msLiberer();
    try {
      const n = Math.min(4, gl.getParameter(gl.MAX_SAMPLES) || 0); if (n < 2) return null;
      const fb = gl.createFramebuffer(), c = gl.createRenderbuffer(), ds = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, c); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, n, gl.RGBA8, w, h);
      gl.bindRenderbuffer(gl.RENDERBUFFER, ds); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, n, gl.DEPTH24_STENCIL8, w, h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, c);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, ds);
      const okFb = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      MS = { fb, c, ds, w, h };
      if (!okFb) { msLiberer(); return null; }
      return MS;
    } catch (e) { msLiberer(); return null; }
  }
  function fin(z) {
    const rien = file.length === 0;
    if (rien) { if (MS) msLiberer();   /* T8 */
      if (visible) { visible = false; canvas.style.visibility = 'hidden'; if (ok) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); } }
      /* N1 (quatorzième passe) : sur téléphone, vide, le canevas plein écran rend sa mémoire (sa surface, son lissage
         multi-échantillons et son pochoir : plusieurs dizaines de Mo pour la carte graphique) ; il la reprend au premier objet */
      if (TEL && ok && canvas.width > 1) { canvas.width = canvas.height = 1; }
      return; }
    if (!visible) { visible = true; canvas.style.visibility = ''; }
    if (TEL && canvas.width !== Math.round(W * DPR)) { canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR); }
    if (canvas._z !== z) { canvas._z = z; canvas.style.zIndex = z; }
    if (!ok) { repli(); return; }
    /* T8 : la page de la fin, sur téléphone, dans le tampon multi-échantillons */
    const aa = MS_OK && file.some(it => it.type === 'feuille' && it.o.aa);
    const ms = aa ? msPreparer(canvas.width, canvas.height) : null;
    if (!aa && MS && ++msLibre > 30) msLiberer(); else if (aa) msLibre = 0;
    if (ms) gl.bindFramebuffer(gl.FRAMEBUFFER, ms.fb);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clearStencil(0); gl.stencilMask(0xFF); gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.useProgram(prog); gl.uniform2f(loc.u_res, W, H);
    for (const it of file) {
      if (it.type === 'feuille') it.resultat = dessinerFeuille(it.o);
      else if (it.type === 'image') dessinerImage(it.o);
      else if (it.type === 'encre') dessinerEncre(it.o);
      else if (it.type === 'masque') dessinerMasque(it.o);
    }
    gl.disable(gl.STENCIL_TEST);
    if (ms) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, ms.fb); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
      gl.blitFramebuffer(0, 0, ms.w, ms.h, 0, 0, ms.w, ms.h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }

  /* N1 (quatorzième passe) : rendre la mémoire d'une texture (carte graphique) */
  function supprimer(T) { if (T && T.tex && ok) { gl.deleteTexture(T.tex); T.tex = null; } }
  return { ok, gl2, canvas, texture, donnees, textureEtapes, donneesEtapes, flous, supprimer, dims, debut, feuille, image, encre, masque, fin, grille, get file() { return file; } };
}

/* =====================================================================
   Formes et projections partagées
   ===================================================================== */
/* projection « plane » : la feuille à plat sur un quadrilatère écran (homographie Hs, carré unité),
   le relief par une perspective douce autour d'un centre C (f en px, L : largeur de la feuille en px) */
export function projPlane(Hs, A, C, f, L) {
  return (X, Y, Z, out) => {
    const u = X, v = Y / A;
    const w = Hs[6] * u + Hs[7] * v + Hs[8];
    let x = (Hs[0] * u + Hs[1] * v + Hs[2]) / w, y = (Hs[3] * u + Hs[4] * v + Hs[5]) / w;
    if (Z) { const k = f / (f - Z * L); x = C[0] + (x - C[0]) * k; y = C[1] + (y - C[1]) * k; }
    out[0] = x; out[1] = y; return out;
  };
}
/* une rafale de vent : bruit lent, toujours positif, irrégulier */
export function rafale(t, graine = 0) {
  const s = Math.sin, a = .5 + .5 * s(t * .53 + graine) * s(t * .31 + 1.7 + graine * 2), b = .5 + .5 * s(t * 1.13 + .4 + graine);
  return clamp(a * .75 + b * .25 * a, 0, 1);
}
