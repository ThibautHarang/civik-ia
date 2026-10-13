/* =====================================================================
   I3 (neuvième passe, 04/10/2026) : la girouette Civik-ia.
   Un objet réel, en tôle de fer, sur le faîte du toit de l'atelier (x 0,60
   de l'image de la façade, hors de l'axe de la porte) : de bas en haut, une
   tige verticale, une petite sphère, la croix des points cardinaux et ses
   lettres (N, E, S, O) découpées dans la tôle, puis la flèche qui pivote,
   qui est exactement la flèche du logo de Civik-ia (le vrai tracé, pris dans
   logo-civik-ia.svg, fragment de la barre de navigation, rastérisé ici :
   aucune image générée). 72 cm de haut, flèche de 60 cm, sur un atelier de
   6,85 m.
   Tout est en 3D, projeté par la caméra du chemin : la flèche est une plaque
   verticale qui tourne autour de la tige ; sa largeur apparente suit le
   cosinus de l'angle, elle se retourne (miroir) en passant par le profil
   mince, et s'éclaire quand sa face se tourne vers le soleil (bas, devant à
   gauche) ; le reste du temps elle est à contre-jour : fer sombre, patiné,
   avec une arête fine qui prend la lumière en haut à gauche. Une ombre très
   courte tombe sur les tuiles.
   Le mouvement : elle tourne par rafales irrégulières, au même vent que la
   feuille du CV (rafale de papier.js, même horloge) ; quand la lampe
   s'allume (p 0,700), elle ralentit et se fige de profil complet, pointée
   vers la droite de l'écran (la direction de la flèche « Atelier » du
   poteau), avec un léger dépassement puis retour ; ensuite elle ne fait que
   frémir.
   ===================================================================== */
import { clamp, lerp, bruit2, fbm, hash } from './outils.js';
import { rafale } from './papier.js';
import { planifier, pret } from './lavis.js';

/* les mesures de l'objet, en mètres */
const M = { haut: .72, sphere: .2, rSphere: .034, croix: .34, bras: .25, lettre: .09, pivot: .54, fleche: .6, tige: .016 };
const FER = [42, 39, 36], FER_CLAIR = [128, 116, 100], ARETE = [255, 238, 206];

/* le vent sur la girouette : l'angle (radians) au temps t. La flèche tourne d'autant plus vite que la rafale est forte
   (l'intégrale de la rafale, tabulée), et balance un peu autour ; dans les accalmies, elle dérive et oscille à peine */
const PAS = 1 / 30, NT = 30 * 900;
const CUMUL = (() => { const a = new Float32Array(NT + 1); let s = 0; for (let i = 1; i <= NT; i++) { const r = rafale((i - .5) * PAS); s += Math.pow(r, 1.7) * PAS; a[i] = s; } return a; })();
function cumul(t) { const tt = ((t % (NT * PAS)) + NT * PAS) % (NT * PAS), u = tt / PAS, i = Math.min(NT - 1, Math.floor(u)), f = u - i; return CUMUL[i] + (CUMUL[i + 1] - CUMUL[i]) * f + Math.floor(t / (NT * PAS)) * CUMUL[NT]; }
export function angleVent(t) {
  const r = rafale(t);
  return 2 * Math.PI * 1.4 * cumul(t) + .6 * (.25 + r) * Math.sin(1.9 * t + .8 * Math.sin(.7 * t)) + .3;
}

/* la flèche du logo : rastérisée, isolée (le bleu vif), redressée à l'horizontale, pointe à droite */
/* P4 (seizième passe) : la même extraction, par étapes de quelques millisecondes (la rastérisation, puis chaque boucle par
   bandes de rangées) : d'un bloc, elle prenait 12 à 23 ms ; extraireFleche la mène d'une traite (même résultat) */
export function extraireFleche(im) { const o = {}; for (const _ of extraireFlecheEtapes(im, o)) { /* rien */ } return o.r || null; }
function* extraireFlecheEtapes(im, sortie) {
  const W = 960, H = 800, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  /* la rastérisation du SVG par quarts (chacun découpé et lu aussitôt : d'un bloc, 18 ms dans WebKit) */
  const d = g.createImageData(W, H), p = d.data;
  for (let q = 0; q < 4; q++) {
    const y0 = H * q / 4, y1 = H * (q + 1) / 4;
    g.save(); g.beginPath(); g.rect(0, y0, W, y1 - y0); g.clip(); g.drawImage(im, 0, 0, W, H); g.restore();
    p.set(g.getImageData(0, y0, W, y1 - y0).data, y0 * W * 4);
    yield;
  }
  const BR = 80;
  let n = 0, sx = 0, sy = 0;
  for (let y0 = 0; y0 < H; y0 += BR) {
    for (let j = y0 * W, j1 = Math.min(H, y0 + BR) * W; j < j1; j++) {
      const i = j * 4, r = p[i], b = p[i + 2], a = b > 150 ? clamp((b - r - 70) / 90) : 0;
      p[i] = p[i + 1] = p[i + 2] = 255; p[i + 3] = a * 255;
      if (a > .5) { const x = j % W, y = (j / W) | 0; sx += x; sy += y; n++; }
    }
    yield;
  }
  if (n < 100) { sortie.r = null; return; }
  const cx = sx / n, cy = sy / n;
  let xx = 0, yy = 0, xy = 0;
  for (let y0 = 0; y0 < H; y0 += 2 * BR) {
    const j0 = y0 * W, j1 = Math.min(H, y0 + 2 * BR) * W;
    for (let j = j0 + ((3 - j0 % 3) % 3); j < j1; j += 3) if (p[j * 4 + 3] > 128) { const x = j % W - cx, y = ((j / W) | 0) - cy; xx += x * x; yy += y * y; xy += x * y; }
    yield;
  }
  let phi = .5 * Math.atan2(2 * xy, xx - yy);
  /* la queue est en bas à gauche, la pointe en haut à droite : l'axe va de l'une à l'autre */
  if (Math.cos(phi) * 480 + Math.sin(phi) * -420 < 0) phi += Math.PI;
  g.putImageData(d, 0, 0);
  yield;
  /* la boîte de la flèche redressée */
  const cs = Math.cos(-phi), sn = Math.sin(-phi);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (let r0 = 0; r0 < H; r0 += 2 * BR) {
    const j0 = r0 * W, j1 = Math.min(H, r0 + 2 * BR) * W;
    for (let j = j0 + (j0 % 2); j < j1; j += 2) if (p[j * 4 + 3] > 40) { const x = j % W - cx, y = ((j / W) | 0) - cy, X = x * cs - y * sn, Y = x * sn + y * cs; if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; }
    yield;
  }
  const k = 420 / (x1 - x0), ow = Math.ceil((x1 - x0) * k) + 8, oh = Math.ceil((y1 - y0) * k) + 8;
  const o = document.createElement('canvas'); o.width = ow; o.height = oh;
  const og = o.getContext('2d', { willReadFrequently: true });
  og.translate(4 - x0 * k, 4 - y0 * k); og.scale(k, k); og.rotate(-phi); og.translate(-cx, -cy); og.imageSmoothingQuality = 'high'; og.drawImage(c, 0, 0);
  /* la tôle : fer sombre, patine brun rouille en marbrures, un peu plus sombre au bord (la tôle découpée) */
  const od = og.getImageData(0, 0, ow, oh), q = od.data, B = bruit2(7717);
  yield;
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      const i = (y * ow + x) * 4; if (q[i + 3] === 0) continue;
      const n1 = fbm(B, x / 26, y / 26, 3), rouille = clamp((n1 - .52) * 3.2), gr = (hash(x, y) - .5) * 10;
      q[i] = lerp(FER[0], 92, rouille * .55) + gr; q[i + 1] = lerp(FER[1], 62, rouille * .55) + gr; q[i + 2] = lerp(FER[2], 42, rouille * .55) + gr;
    }
    if (y % 40 === 39) yield;
  }
  og.putImageData(od, 0, 0);
  /* le pivot : à 46 % de la longueur depuis la queue, au milieu de l'épaisseur de la flèche à cet endroit */
  const px = Math.round(ow * .46); let ya = -1, yb = -1;
  for (let y = 0; y < oh; y++) if (q[(y * ow + px) * 4 + 3] > 100) { if (ya < 0) ya = y; yb = y; }
  sortie.r = { c: o, w: ow, h: oh, pivot: [px, ya < 0 ? oh / 2 : (ya + yb) / 2] };
}
/* une lettre de tôle (N, E, S, O), en fer patiné */
function lettre(ch) {
  const c = document.createElement('canvas'); c.width = 72; c.height = 84;
  const g = c.getContext('2d'); g.font = '700 76px Georgia, "Times New Roman", serif'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillStyle = `rgb(${FER.join(',')})`; g.fillText(ch, 36, 78);
  return c;
}

export function creerGirouette() {
  let fleche = null;
  const im = new Image();
  /* hors du démarrage : la flèche est extraite pendant un temps mort (une fois, une dizaine de millisecondes) */
  /* P4 (seizième passe) : la flèche préparée (prets/girouette.png, faite par ce même code), si elle est là ; sinon l'extraction
     par étapes */
  im.onload = () => pret('girouette').then(r => {
    if (r && r.e.pivot) { fleche = { c: r.im, w: r.im.naturalWidth, h: r.im.naturalHeight, pivot: r.e.pivot }; return; }
    planifier({ nom: 'girouette', gen: (function* () { yield; const o = {}; try { yield* extraireFlecheEtapes(im, o); fleche = o.r || null; } catch (e) { fleche = null; } })() });
  });
  im.src = '../commun/img/logo-civik-ia.svg#svgView(viewBox(720,150,720,600))';
  const LETTRES = ['N', 'E', 'S', 'O'].map(lettre);
  /* deux petits canevas : la girouette du moment (coordonnées écran), et son arête de lumière */
  const G = document.createElement('canvas'), gg = G.getContext('2d'), A = document.createElement('canvas'), ga = A.getContext('2d');
  let boite = null, theta = 0, omega = 0, fluide = false, fige = null;

  /* l'angle du moment. tau : le temps écoulé depuis l'allumage de la lampe (null si elle est éteinte) */
  function maj(t, tau) {
    if (tau === null || tau === undefined) { fige = null; const a = angleVent(t); omega = (angleVent(t + .02) - a) / .02; theta = a; fluide = true; return; }
    const fremit = .011 * (.4 + rafale(t)) * Math.sin(9.3 * t) + .005 * Math.sin(13.7 * t + 1);
    if (tau > 12) { theta = fige ? fige.cible : 0; theta += fremit; fluide = false; omega = 0; return; }
    /* au moment où la lampe s'allume : l'angle et la vitesse du vent ; la flèche continue sur son élan en ralentissant
       (vitesse qui s'éteint en 0,35 s), et la cible est le profil complet (pointe à droite) le plus proche de là où
       l'élan la mène, devant ou derrière ; plus elle est loin, plus la mise au profil est lente (elle ne repart jamais
       plus vite qu'elle ne tournait) */
    if (!fige || Math.abs(fige.t0 - (t - tau)) > .05) {
      const t0 = t - tau, a0 = angleVent(t0), w0 = (angleVent(t0 + .02) - a0) / .02, tc = .35, fin = a0 + w0 * tc;
      const cible = Math.round(fin / (2 * Math.PI)) * 2 * Math.PI;
      fige = { t0, a0, w0, tc, fin, cible, per: 1.1 * (1 + Math.abs(cible - fin) / 1.6) };
    }
    /* l'élan qui s'éteint, plus la mise au profil : une réponse amortie (0,55 ; période de 1,1 s, plus longue pour un
       grand écart) qui dépasse d'un rien et revient */
    const z = .55, w = 2 * Math.PI / fige.per, wd = w * Math.sqrt(1 - z * z), e = Math.exp(-z * w * tau);
    const marche = 1 - e * (Math.cos(wd * tau) + z * w / wd * Math.sin(wd * tau));
    theta = fige.a0 + fige.w0 * fige.tc * (1 - Math.exp(-tau / fige.tc)) + (fige.cible - fige.fin) * marche + fremit * clamp(tau / 1.5);
    omega = 0; fluide = tau < 4.5;
  }

  /* dessin. pr : monde -> écran ([x, y, profondeur] ou null) ; base : le pied de la tige sur le faîte (monde) ;
     R : la droite de la façade, Fw : vers l'intérieur de l'atelier ; soleil : direction vers le soleil (monde) ;
     cam : position de la caméra ; dpr : densité de pixels */
  function dessiner(c, pr, base, R, Fw, soleil, cam, dpr, op, voile = 0) {
    boite = null;
    if (op <= .01) return;
    const U = [0, 1, 0];
    const pt = (h, dr = 0, df = 0) => [base[0] + R[0] * dr + Fw[0] * df, base[1] + h, base[2] + R[2] * dr + Fw[2] * df];
    const P = w => pr(w, [0, 0, 0]);
    const pied = P(pt(0)), som = P(pt(M.haut)); if (!pied || !som) return;
    const k = som[1] - pied[1];   /* hauteur à l'écran (négative : vers le haut) */
    const hpx = Math.abs(k); if (hpx < 4) return;
    /* la flèche : direction horizontale a(theta) dans le plan (R, Fw) ; theta = 0 : pointe à droite, face à nous */
    const ca = Math.cos(theta), sa = Math.sin(theta), a = [R[0] * ca + Fw[0] * sa, 0, R[2] * ca + Fw[2] * sa];
    const nrm = [-a[2], 0, a[0]];   /* normale de la plaque (horizontale) */
    /* la face vue : la normale tournée vers la caméra ; son éclairement par le soleil */
    const vc = [cam.x - base[0], 0, cam.z - base[2]], face = nrm[0] * vc[0] + nrm[2] * vc[2] >= 0 ? 1 : -1;
    const eclaire = clamp((nrm[0] * soleil[0] + nrm[2] * soleil[2]) * face * 1.2);
    const ouvert = Math.abs(nrm[0] * vc[0] + nrm[2] * vc[2]) / Math.hypot(vc[0], vc[2]);
    /* la boîte à l'écran : la tige et la flèche dans tous ses angles possibles */
    const L = M.fleche, hw = L * .62;
    const coins = [pt(0), pt(M.haut), pt(M.pivot + .2, -hw, -hw), pt(M.pivot + .2, hw, hw), pt(M.pivot - .2, -hw, hw), pt(M.pivot - .2, hw, -hw), pt(M.croix, -M.bras * 1.5, 0), pt(M.croix, M.bras * 1.5, 0), pt(M.croix, 0, -M.bras * 1.5), pt(M.croix, 0, M.bras * 1.5), pt(-.05, .4, 0)].map(P).filter(Boolean);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    coins.forEach(q => { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
    x0 = Math.floor(x0 - 4); y0 = Math.floor(y0 - 4); x1 = Math.ceil(x1 + 4); y1 = Math.ceil(y1 + 4);
    if (x1 - x0 <= 0 || y1 - y0 <= 0 || x1 - x0 > 2000 || y1 - y0 > 2000) return;
    /* N1 (quatorzième passe) : la boîte est rognée à l'écran (2 px de marge) : de près, la girouette dépassait l'écran de
       toutes parts et ses deux canevas montaient à 1479 x 2357 (27 Mo sur téléphone) pour des pixels jamais vus ; le dessin
       est le même (tracé dans les mêmes coordonnées, seul ce qui tombe hors de l'écran n'est plus calculé) */
    const We = c.canvas.width / dpr, He = c.canvas.height / dpr;
    x0 = Math.max(x0, -2); y0 = Math.max(y0, -2); x1 = Math.min(x1, Math.ceil(We) + 2); y1 = Math.min(y1, Math.ceil(He) + 2);
    const bw = x1 - x0, bh = y1 - y0; if (bw <= 0 || bh <= 0) return;
    const cw = Math.ceil(bw * dpr), ch = Math.ceil(bh * dpr);
    if (G.width < cw || G.height < ch) { G.width = A.width = Math.max(cw, G.width); G.height = A.height = Math.max(ch, G.height); }
    gg.setTransform(1, 0, 0, 1, 0, 0); gg.clearRect(0, 0, cw + 2, ch + 2);
    gg.setTransform(dpr, 0, 0, dpr, -x0 * dpr, -y0 * dpr);
    gg.globalCompositeOperation = 'source-over'; gg.globalAlpha = 1; gg.lineCap = 'round';
    const fer = `rgb(${FER.join(',')})`;
    const ep = d => Math.max(.7, d);   /* une épaisseur à l'écran, jamais sous 0,7 px */
    const kpx = hpx / M.haut;   /* px par mètre, à la hauteur de la girouette */
    /* la tige */
    gg.strokeStyle = fer; gg.lineWidth = ep(M.tige * kpx); gg.beginPath(); gg.moveTo(pied[0], pied[1]); gg.lineTo(som[0], som[1]); gg.stroke();
    /* un petit pied scellé dans le faîtage */
    gg.lineWidth = ep(M.tige * kpx * 2.6); gg.beginPath(); gg.moveTo(pied[0], pied[1]); const pb = P(pt(.05)); if (pb) gg.lineTo(pb[0], pb[1]); gg.stroke();
    /* la croix et ses lettres : les bras dans le plan horizontal, tournés de 25 degrés par rapport à la façade */
    const r25 = .44, dirs = [0, 1, 2, 3].map(i => { const an = r25 + i * Math.PI / 2; return [Math.cos(an), Math.sin(an)]; });
    const bras = dirs.map(([u, v]) => [R[0] * u + Fw[0] * v, R[2] * u + Fw[2] * v]);
    const centre = pt(M.croix);
    /* les bras du fond d'abord, la lettre la plus proche en dernier */
    const ordre = [0, 1, 2, 3].sort((i, j) => (bras[j][0] * (base[0] - cam.x) + bras[j][1] * (base[2] - cam.z)) - (bras[i][0] * (base[0] - cam.x) + bras[i][1] * (base[2] - cam.z)));
    ordre.forEach(i => {
      const [bx, bz] = bras[i], bout = [centre[0] + bx * M.bras, centre[1], centre[2] + bz * M.bras];
      const A0 = P(centre), A1 = P(bout); if (!A0 || !A1) return;
      gg.strokeStyle = fer; gg.lineWidth = ep(M.tige * .7 * kpx); gg.beginPath(); gg.moveTo(A0[0], A0[1]); gg.lineTo(A1[0], A1[1]); gg.stroke();
      /* la lettre : une plaque verticale au bout du bras, perpendiculaire à lui */
      const lx = [-bz, 0, bx], hL = M.lettre, wL = hL * 72 / 84;
      const o = [bout[0] - lx[0] * wL / 2, bout[1] + hL * 1.05, bout[2] - lx[2] * wL / 2];
      const Q0 = P(o), Q1 = P([o[0] + lx[0] * wL, o[1], o[2] + lx[2] * wL]), Q2 = P([o[0], o[1] - hL, o[2]]);
      if (Q0 && Q1 && Q2) { gg.save(); gg.transform((Q1[0] - Q0[0]) / 72, (Q1[1] - Q0[1]) / 72, (Q2[0] - Q0[0]) / 84, (Q2[1] - Q0[1]) / 84, Q0[0], Q0[1]); gg.drawImage(LETTRES[i], 0, 0); gg.restore(); }
      /* la petite patte qui tient la lettre */
      const Q3 = P([bout[0], bout[1] + hL * .1, bout[2]]); if (Q3) { gg.lineWidth = ep(M.tige * .5 * kpx); gg.beginPath(); gg.moveTo(A1[0], A1[1]); gg.lineTo(Q3[0], Q3[1]); gg.stroke(); }
    });
    /* la sphère, à contre-jour, un point de lumière en haut à gauche */
    const S = P(pt(M.sphere));
    if (S) {
      const rs = Math.max(1, M.rSphere * kpx), gs = gg.createRadialGradient(S[0] - rs * .45, S[1] - rs * .5, 0, S[0], S[1], rs);
      gs.addColorStop(0, `rgb(${FER_CLAIR.join(',')})`); gs.addColorStop(.35, 'rgb(64,58,52)'); gs.addColorStop(1, fer);
      gg.fillStyle = gs; gg.beginPath(); gg.arc(S[0], S[1], rs, 0, Math.PI * 2); gg.fill();
    }
    /* la flèche */
    if (fleche) {
      const s = L / fleche.w, piv = fleche.pivot;
      const mondeDe = (x, y) => { const dx = (x - piv[0]) * s, dy = (piv[1] - y) * s; return [base[0] + a[0] * dx, base[1] + M.pivot + dy, base[2] + a[2] * dx]; };
      const Q0 = P(mondeDe(0, 0)), Q1 = P(mondeDe(fleche.w, 0)), Q2 = P(mondeDe(0, fleche.h));
      if (Q0 && Q1 && Q2) {
        /* l'épaisseur de la tôle : la plaque redessinée un rien en arrière, plus sombre (se voit de profil) */
        const ex = nrm[0] * -face * .006, ez = nrm[2] * -face * .006;
        const mondeE = (x, y) => { const w = mondeDe(x, y); w[0] += ex; w[2] += ez; return w; };
        const E0 = P(mondeE(0, 0)), E1 = P(mondeE(fleche.w, 0)), E2 = P(mondeE(0, fleche.h));
        if (E0 && E1 && E2) { gg.save(); gg.globalAlpha = .9; gg.transform((E1[0] - E0[0]) / fleche.w, (E1[1] - E0[1]) / fleche.w, (E2[0] - E0[0]) / fleche.h, (E2[1] - E0[1]) / fleche.h, E0[0], E0[1]); gg.filter = 'brightness(.6)'; gg.drawImage(fleche.c, 0, 0); gg.restore(); gg.filter = 'none'; }
        gg.save(); gg.transform((Q1[0] - Q0[0]) / fleche.w, (Q1[1] - Q0[1]) / fleche.w, (Q2[0] - Q0[0]) / fleche.h, (Q2[1] - Q0[1]) / fleche.h, Q0[0], Q0[1]);
        gg.drawImage(fleche.c, 0, 0);
        /* la face tournée vers le soleil s'éclaire */
        if (eclaire > .01) { gg.globalCompositeOperation = 'source-atop'; gg.fillStyle = `rgba(${ARETE.join(',')},${(.42 * eclaire).toFixed(3)})`; gg.fillRect(0, 0, fleche.w, fleche.h); }
        gg.restore();
        /* de profil mince, la tôle n'est plus qu'un trait : on garde son épaisseur */
        if (ouvert < .25) {
          const T0 = P(mondeDe(0, piv[1])), T1 = P(mondeDe(fleche.w, piv[1]));
          if (T0 && T1) { gg.globalAlpha = 1 - ouvert / .25; gg.strokeStyle = fer; gg.lineWidth = ep(.009 * kpx); gg.beginPath(); gg.moveTo(T0[0], T0[1]); gg.lineTo(T1[0], T1[1]); gg.stroke(); gg.globalAlpha = 1; }
        }
      }
    }
    /* le manchon de la flèche sur la tige, et la pointe de la tige */
    const Mp = P(pt(M.pivot)), Mh = P(pt(M.pivot + .05)), Mb = P(pt(M.pivot - .05));
    if (Mp && Mh && Mb) { gg.strokeStyle = fer; gg.lineWidth = ep(M.tige * 2 * kpx); gg.beginPath(); gg.moveTo(Mb[0], Mb[1]); gg.lineTo(Mh[0], Mh[1]); gg.stroke(); }
    /* l'arête de lumière : tout ce qui regarde en haut à gauche (le soleil) prend un filet clair */
    ga.setTransform(1, 0, 0, 1, 0, 0); ga.globalCompositeOperation = 'source-over'; ga.clearRect(0, 0, cw + 2, ch + 2);
    ga.drawImage(G, 0, 0);
    ga.globalCompositeOperation = 'source-in'; ga.fillStyle = `rgba(${ARETE.join(',')},.95)`; ga.fillRect(0, 0, cw + 2, ch + 2);
    ga.globalCompositeOperation = 'destination-out'; const dd = Math.max(.7, dpr * .8); ga.drawImage(G, dd, dd);
    /* sur les tiges fines (un ou deux pixels), l'arête ne doit pas tout couvrir : elle reste un reflet */
    gg.setTransform(1, 0, 0, 1, 0, 0); gg.globalCompositeOperation = 'source-atop'; gg.globalAlpha = clamp((kpx - 40) / 130, 0, .85); if (gg.globalAlpha > .02) gg.drawImage(A, 0, 0);
    gg.globalCompositeOperation = 'source-over'; gg.globalAlpha = 1;
    /* la distance : le même voile de papier clair que la façade (perspective de l'air) */
    if (voile > .005) { gg.globalCompositeOperation = 'source-atop'; gg.fillStyle = `rgba(238,240,236,${voile.toFixed(3)})`; gg.fillRect(0, 0, cw + 2, ch + 2); gg.globalCompositeOperation = 'source-over'; }
    /* posée sur le canevas du monde, après son ombre très courte sur les tuiles (le soleil est devant, à gauche : elle
       tombe vers nous, un peu à droite) */
    c.save(); c.globalAlpha = op * (1 - voile * .6);
    const o0 = P(pt(.01)), o1 = P(pt(-.02, .07, -.2));
    if (o0 && o1) { c.lineCap = 'round'; c.strokeStyle = 'rgba(30,22,16,.16)'; c.lineWidth = ep(M.tige * kpx * 4); c.beginPath(); c.moveTo(o0[0], o0[1]); c.lineTo(o1[0], o1[1]); c.stroke(); c.strokeStyle = 'rgba(30,22,16,.3)'; c.lineWidth = ep(M.tige * kpx * 1.8); c.stroke(); }
    c.globalAlpha = op; c.drawImage(G, 0, 0, cw, ch, x0, y0, cw / dpr, ch / dpr); c.restore();
    boite = { x0, y0, cw, ch, dpr };
  }
  /* I1 : la girouette efface les lavis derrière elle (c'est un objet réel) */
  function effacer(c) {
    if (!boite) return;
    c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = 1;
    c.drawImage(G, 0, 0, boite.cw, boite.ch, boite.x0, boite.y0, boite.cw / boite.dpr, boite.ch / boite.dpr); c.restore();
  }
  /* N1 : hors de la façade, ses deux canevas rendent leur mémoire */
  function liberer() { if (G.width || A.width) { G.width = G.height = A.width = A.height = 0; boite = null; } }
  return { maj, dessiner, effacer, liberer, get fluide() { return fluide; }, get angle() { return theta; }, get prete() { return !!fleche; }, get rect() { return boite ? [boite.x0, boite.y0, boite.cw / boite.dpr, boite.ch / boite.dpr] : null; } };
}
