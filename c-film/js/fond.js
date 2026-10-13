/* =====================================================================
   La gravure du village (reprise de la maquette A) : la nuit, l'aube sur la
   même image, le soleil derrière l'épaule de la colline, puis la caméra qui
   plonge vers la route ; pendant la marche, la gravure reste le lointain.
   ===================================================================== */
import { clamp, lerp, seg, sseg, eEntree, eDepl, rng, hash, bruit1, setT, setO, setV } from './outils.js';
import { T } from './temps.js';
import { planifier, ouvrier, PAUSE, pret } from './lavis.js';
import { TEL, liberer, plafondDpr, en_image } from './memoire.js';

/* J5 (dixième passe, 04/10/2026) : le soleil se lève derrière l'horizon. Sa hauteur est une seule fonction croissante de
   p, comptée en rayons du disque, du centre du disque à la ligne de crête (la colline du village au départ, le profil
   réel du lointain pendant la marche) : -1 à 0,232 (le haut du disque affleure la crête), 0 à 0,30 (la moitié dépasse),
   1 à 0,445 (« à 20 mètres de la planche » : le disque entièrement dégagé, son centre un rayon au-dessus de la crête ;
   à 90 mètres, p 0,4125, un cinquième du disque est encore derrière la colline), puis il monte lentement jusqu'au
   croisement et un peu au-delà ; il ne redescend jamais. */
/* J7 : de 0,445 à 0,70, il continue de monter nettement : de un rayon au-dessus de la crête à trois rayons et demi.
   J9 : une courbe lisse (interpolation cubique monotone, sans cassure de pente aux points), toujours croissante */
const HAUTEUR_SOLEIL = [[.232, -1], [.30, 0], [.445, 1], [.588, 2.1], [.70, 3.5], [.76, 3.8]];
const PENTES = (() => {
  const H = HAUTEUR_SOLEIL, n = H.length, d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((H[i + 1][1] - H[i][1]) / (H[i + 1][0] - H[i][0]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 / (1 / d[i - 1] + 1 / d[i]);
  return m;
})();
export function hauteurSoleil(p) {
  const H = HAUTEUR_SOLEIL, m = PENTES;
  if (p <= H[0][0]) return H[0][1] - (H[0][0] - p) * m[0];
  for (let i = 1; i < H.length; i++) if (p <= H[i][0]) {
    const [p0, h0] = H[i - 1], [p1, h1] = H[i], dx = p1 - p0, t = (p - p0) / dx, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * h0 + (t3 - 2 * t2 + t) * dx * m[i - 1] + (-2 * t3 + 3 * t2) * h1 + (t3 - t2) * dx * m[i];
  }
  return H[H.length - 1][1];
}
/* la crête de la colline du village, telle que la découpe le ciel du lever (.ciel-sol dans film.css), en % du cadre */
const CRETE_VILLAGE = [[68, 27.6], [66, 27], [64, 28], [63, 29.9], [62, 31.4], [61, 33.2], [60, 36.7], [59, 35.7], [58, 35], [56, 34.9], [54, 34.6], [52, 33.8], [50, 36.2], [49, 37.3], [48, 34.7], [47, 33.6], [46, 34], [45, 32.6], [44, 29.7], [43, 27.1], [42, 24.8], [41, 25.5], [40, 24.5], [39, 21.6], [38, 20.8], [37, 20], [36, 17.7], [34, 16.1], [33, 14.6], [32, 14], [30, 11.8], [28, 10.5], [26, 9.7], [24, 7.2], [18, 8.4]];
function creteVillage(x) {
  const C = CRETE_VILLAGE;
  for (let i = 1; i < C.length; i++) { const [xa, ya] = C[i - 1], [xb, yb] = C[i]; if (x <= xa && x >= xb) return ya + (yb - ya) * (xa - x) / (xa - xb); }
  return x > C[0][0] ? C[0][1] : C[C.length - 1][1];
}

export function creerFond(ctx, vis = {}) {
  const s = ctx.scene, $ = q => s.querySelector(q), $$ = q => Array.from(s.querySelectorAll(q));
  const el = { fond: $('[data-fond]'), cadre: $('[data-cadre]'), nuit: $('[data-nuit]'), aube: $('[data-aube]'), cielsol: $('[data-cielsol]'), rayons: $('[data-rayons]'), etoiles: $('[data-etoiles]'), filante: $('[data-filante]'), lums: $$('[data-lumieres] .lum') };
  (function () {
    const R = rng(3); let h = '';
    for (let i = 0; i < 128; i++) {
      const a = i / 128 * Math.PI * 2 + (R() - .5) * .015, r0 = 10.5 + R() * 1.5, r1 = (i % 2 ? 17 : 24) + R() * (i % 4 === 0 ? 30 : 9);
      h += `<line x1="${(Math.cos(a) * r0).toFixed(2)}" y1="${(Math.sin(a) * r0).toFixed(2)}" x2="${(Math.cos(a) * r1).toFixed(2)}" y2="${(Math.sin(a) * r1).toFixed(2)}" stroke-width="${i % 2 ? .22 : .32}" opacity="${(.3 + R() * .35).toFixed(2)}"/>`;
    }
    el.rayons.innerHTML = h;
  })();
  /* L4 (douzième passe) : dans Safari, le cadre du village change d'échelle à chaque image pendant le départ et le début
     de la marche, et tout ce qui y est vectoriel est redessiné à chaque fois : les 128 traits des rayons et le grand
     dégradé de l'aube coûtaient 18 ms par image (la marche y tombait à 27 images par seconde). Ils deviennent des images
     (peintes une fois) : la carte graphique ne fait plus que les agrandir */
  (function () {
    const n = 1024, k = n / 200, c = document.createElement('canvas'); c.width = c.height = n; c.className = 'rayons rayons-img'; c.setAttribute('aria-hidden', 'true');
    const g = c.getContext('2d'); g.translate(n / 2, n / 2); g.scale(k, k); g.strokeStyle = '#e9b98a'; g.lineCap = 'round';
    el.rayons.querySelectorAll('line').forEach(l => { g.globalAlpha = +l.getAttribute('opacity'); g.lineWidth = +l.getAttribute('stroke-width'); g.beginPath(); g.moveTo(+l.getAttribute('x1'), +l.getAttribute('y1')); g.lineTo(+l.getAttribute('x2'), +l.getAttribute('y2')); g.stroke(); });
    el.rayons.after(c); el.rayons.style.display = 'none'; el.rayons = c;
    /* S2 (dix-neuvième passe, 07/10/2026) : sur téléphone, l'image des rayons (peinte une fois, jamais repeinte) passe d'un
       canevas (4 Mo de mémoire vive) à une image (son fichier encodé, que le navigateur peut décoder et oublier) ; mesuré
       sur l'iPhone : 40 Mo de canevas de plus font tomber la page, 40 Mo d'images décodées non */
    if (TEL) en_image(c, im => { if (el.rayons === c) { el.rayons = im; } });
    const a = document.createElement('canvas'); a.width = 420; a.height = 300; const ga = a.getContext('2d');
    ga.translate(210, 150); ga.scale(1, 300 / 420);
    const gr = ga.createRadialGradient(0, 0, 0, 0, 0, 210);
    gr.addColorStop(0, 'rgba(255,226,186,.85)'); gr.addColorStop(.22, 'rgba(252,196,160,.5)'); gr.addColorStop(.48, 'rgba(244,172,160,.2)'); gr.addColorStop(.75, 'rgba(244,172,160,0)');
    ga.fillStyle = gr; ga.fillRect(-210, -210, 420, 420);
    el.aube.style.background = `url(${a.toDataURL()}) center / 100% 100% no-repeat`; el.aube.style.borderRadius = '0';
  })();
  /* J5 : le liseré de la crête du village (le profil de .ciel-sol), un trait clair masqué autour du soleil */
  el.lisere = (() => {
    const ns = 'http://www.w3.org/2000/svg', sv = document.createElementNS(ns, 'svg');
    sv.setAttribute('class', 'lisere-village'); sv.setAttribute('viewBox', '0 0 100 100'); sv.setAttribute('preserveAspectRatio', 'none'); sv.setAttribute('aria-hidden', 'true');
    const pts = CRETE_VILLAGE.map(([x, y]) => x + ',' + (y + .15)).join(' ');
    sv.innerHTML = `<polyline points="${pts}" fill="none" stroke="rgba(255,244,218,.95)" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round" style="filter:blur(1.2px)"/><polyline points="${pts}" fill="none" stroke="rgba(255,250,236,1)" stroke-width="1.1" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`;
    sv.style.opacity = 0; el.cielsol.after(sv);
    return sv;
  })();
  /* Huitième passe, H1 : l'eau de la fontaine, d'un seul mouvement sur toute la hauteur. Chaque filet (aux repères des
     anciens filets SVG : le cadre de la gravure, viewBox 1395 600 240 290) est UN jet continu, de la vasque au bassin,
     sans changement de régime (la septième passe arrêtait la lame aux deux tiers et la remplaçait par des gouttes :
     c'est la coupure que Thibaut voyait).
     La physique : l'eau quitte la vasque lentement et accélère en chute libre, v(s) = racine(v0² + 2 g s) ; le temps
     écoulé depuis la vasque, tau(s), donne pour chaque hauteur l'instant de départ de l'eau qui s'y trouve,
     phi = t - tau(s). Toute la matière du filet (reflets, éclats, ondes de surface, ondulation du filet) est une fonction
     de phi : elle descend avec l'eau, de plus en plus vite, et s'étire en descendant, comme les ondes d'un vrai jet. Le
     débit se conserve : le filet s'amincit comme 1 / racine(v) et devient plus transparent ; ses perturbations
     grandissent en tombant (instabilité d'un jet), sans seuil.
     Le rendu : pixel par pixel dans un tampon, chaque filet comme un petit cylindre d'eau semi-transparent sur la
     gravure (plus visible sur ses bords, comme le verre), un liseré du côté de la lune et du réverbère (à droite), un
     filet de reflet qui erre au milieu ; quelques gouttes se détachent à côté du filet dans son dernier tiers, jamais à
     sa place. Au pied : brume, gouttes qui rebondissent, ondes lentes, reflets qui tremblent. Sa propre boucle, à 30
     images par seconde, tant que la fontaine se voit. Pour les essais : window.__eauTemps fixe le temps. */
  const eau = (function () {
    const svg = s.querySelector('.fontaine'); if (!svg) return null;
    const VX = 1395, VY = 600, VW = 240, VH = 290, CXV = 1512;
    const V0 = .32, ACC = (1 - V0 * V0) / 2, TAU1 = (1 - V0) / ACC, TF = .98, HREF = 140;
    const vit = sv => Math.sqrt(V0 * V0 + (1 - V0 * V0) * sv);
    const jets = Array.from(svg.querySelectorAll('.eau')).map((pth, k) => {
      const n = (pth.getAttribute('d').match(/-?[\d.]+/g) || []).map(Number); if (n.length < 8) return null;
      const x0 = n[0], y0 = n[1], x3 = n[6], y3 = n[7], d = Math.abs(x0 - CXV) < 20 ? 0 : Math.sign(x0 - CXV);
      const sw = +pth.getAttribute('stroke-width') || 1.2, op = +(pth.style.getPropertyValue('--op') || .4), H = y3 - y0;
      /* la durée de la chute croît comme la racine de la hauteur (le petit étage tombe plus vite) */
      return { x0, y0, x3, y3, D: (x3 - x0) * .6 + d * (H > 100 ? 9 : 5), H, w0: sw * 2.1 + 1.3, op: .5 + op * .55, ph: k * 1.37 + (k % 3) * .7, ph2: k * 2.11, vr: .9 + (k % 5) * .13, haut: H < 100, tf: TF * Math.sqrt(H / HREF),
        nA: bruit1(700 + k), nB: bruit1(740 + k), nC: bruit1(780 + k), nD: bruit1(820 + k), cote: k % 2 ? 1 : -1, k };
    }).filter(Boolean);
    if (!jets.length) return null;
    const c = document.createElement('canvas'); c.className = 'fontaine-eau'; c.setAttribute('aria-hidden', 'true');
    svg.after(c); svg.style.display = 'none';
    const g = c.getContext('2d');
    let actif = false, nuit = 1, boucle = 0, dernier = 0, reduit = false;
    try { reduit = matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).get('mouvement') === 'reduit'; } catch (e) { /* rien */ }
    const fr = x => x - Math.floor(x), TAU = Math.PI * 2;
    let tampon = null, imd = null, halo = null;
    function taille() {
      /* N1 (quatorzième passe) : sur téléphone, densité 2 au plus (2,6 avant) */
      const r = c.getBoundingClientRect(), k = plafondDpr(TEL ? Math.min(2, window.devicePixelRatio || 1) : Math.min(2.6, Math.max(2, (window.devicePixelRatio || 1) * 1.6)));   /* S4 : 1,5 en mode économe */
      const w = Math.max(60, Math.round(r.width * k)), h = Math.max(60, Math.round(r.height * k));
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; tampon = null; }
    }
    /* le temps écoulé depuis la vasque à la hauteur relative sv, en secondes, pour un jet de durée de chute tf */
    const tau = (sv, tf) => (vit(sv) - V0) / ACC / TAU1 * tf;
    /* l'inverse : la hauteur relative atteinte après td secondes */
    const hauteur = (td, tf) => { const v = V0 + ACC * TAU1 * td / tf; return (v * v - V0 * V0) / (1 - V0 * V0); };
    /* le centre du filet (unités de la gravure) à la hauteur sv, pour l'eau partie à l'instant phi */
    function centre(j, sv, ta, phi) {
      const amp = sv * sv;
      const ond = (j.nA(phi * 1.25 + j.ph) * .62 + Math.sin(phi * 8.7 + j.ph2) * .38) * (.12 + 1.05 * amp) * j.w0 * .3;
      return j.x0 + j.D * ta / j.tf + ond;
    }
    function dessiner(t) {
      const W = c.width, Hc = c.height, sx = W / VW, sy = Hc / VH;
      if (!tampon || tampon.length !== W * Hc * 4) { tampon = new Float32Array(W * Hc * 4); imd = g.createImageData(W, Hc); }
      const B = tampon; B.fill(0);
      const n = nuit;
      const corps = [196 + 40 * (1 - n), 212 + 30 * (1 - n), 255], clair = [246, 248, 255];
      let bx0 = W, bx1 = 0, by0 = Hc, by1 = 0;
      for (const j of jets) {
        /* le débit, lent et propre à chaque filet */
        const deb = .8 + .14 * Math.sin(t * .37 * j.vr + j.ph) + .07 * Math.sin(t * 1.13 + j.ph2);
        const y0c = (j.y0 - VY) * sy, y1c = (j.y3 - VY) * sy, dy = y1c - y0c;
        const pyA = Math.max(0, Math.floor(y0c)), pyB = Math.min(Hc - 1, Math.ceil(y1c));
        by0 = Math.min(by0, pyA); by1 = Math.max(by1, pyB);
        for (let py = pyA; py <= pyB; py++) {
          const sv = clamp((py + .5 - y0c) / dy), v = vit(sv), ta = tau(sv, j.tf), phi = t * j.vr - ta, amp = sv * sv;
          /* les ondes de surface (renflements) et leur éclat, emportées avec l'eau */
          const onde = Math.sin(TAU * (phi * 5.6 + .4 * j.nB(phi * 1.9 + 3)));
          const varic = 1 + (.07 + .3 * amp) * onde;
          /* à la lèvre, l'eau passe en nappe un peu plus large, puis se resserre en filet */
          const levre = 1 + .5 * Math.exp(-sv / .07);
          const hw = Math.max(.55, .5 * j.w0 * deb * Math.sqrt(V0 / v) * varic * levre * sx);
          const xc = (centre(j, sv, ta, phi) - VX) * sx;
          /* l'opacité : le filet devient plus transparent en s'amincissant ; il naît à la lèvre et rejoint le bassin */
          /* vers le bas, le filet se perle : sa matière se fait plus inégale (des passages plus clairs, d'autres presque
             vides), toujours d'un seul tenant ; l'écart grandit avec la chute, sans seuil */
          const perle = 1 - .5 * amp * sseg(.5 + .5 * j.nA(phi * 6.3 + 11), .25, .85);
          const aL = j.op * (1 - .6 * sv) * perle * sseg(sv, 0, .025) * (1 - .5 * sseg(sv, .955, 1));
          /* les éclats : rares et vifs, ils descendent avec l'eau et s'allongent en tombant */
          const scint = .3 + 1.1 * Math.pow(.5 + .5 * j.nC(phi * 5.2 + j.ph), 4);
          const bande = .55 + .45 * (.5 + .5 * onde) * (.4 + .6 * amp + .3);
          const uS = .12 + .3 * Math.sin(phi * 2.6 + j.ph), lS = Math.pow(.5 + .5 * j.nD(phi * 7.4 + j.ph2), 3);
          const pxA = Math.max(0, Math.floor(xc - hw - 1.5)), pxB = Math.min(W - 1, Math.ceil(xc + hw + 1.5));
          bx0 = Math.min(bx0, pxA); bx1 = Math.max(bx1, pxB);
          for (let px = pxA; px <= pxB; px++) {
            const u = (px + .5 - xc) / hw, au = Math.abs(u), cov = clamp((1 - au) * hw + .5);
            if (cov <= 0) continue;
            /* le corps : un cylindre d'eau, plus visible sur ses bords (comme le verre) */
            const aB = aL * (.5 + .28 * u * u) * cov;
            /* la lumière : liseré côté droit (la lune, le réverbère), un liseré plus faible à gauche, le filet de reflet */
            const rimD = sseg(u, .55, .97) * scint * bande, rimG = sseg(-u, .7, 1) * .22;
            const fil = Math.exp(-(u - uS) * (u - uS) / .04) * lS * .6 * bande;
            const hl = (rimD * .62 + rimG + fil) * aL * cov * (.65 + .35 * n);
            const a = Math.min(1, aB + hl * .85);
            /* les filets qui se recouvrent (le bord de la vasque vu de biais) s'ajoutent : eau sur eau */
            const i = (py * W + px) * 4;
            B[i] += corps[0] * aB + clair[0] * hl; B[i + 1] += corps[1] * aB + clair[1] * hl; B[i + 2] += corps[2] * aB + clair[2] * hl;
            B[i + 3] = Math.min(1, B[i + 3] + a);
          }
        }
      }
      /* le tampon (prémultiplié) vers l'image */
      const d = imd.data; d.fill(0);
      for (let y = Math.max(0, by0); y <= Math.min(Hc - 1, by1); y++) for (let x = Math.max(0, bx0); x <= Math.min(W - 1, bx1); x++) {
        const i = (y * W + x) * 4, a = B[i + 3]; if (a <= .002) continue;
        d[i] = Math.min(255, B[i] / a); d[i + 1] = Math.min(255, B[i + 1] / a); d[i + 2] = Math.min(255, B[i + 2] / a); d[i + 3] = a * 255;
      }
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, Hc); g.putImageData(imd, 0, 0);
      /* un halo très doux autour de l'eau éclairée (la lune dans les gouttelettes en suspension) : la même image, floutée,
         ajoutée en lumière */
      if (!halo || halo.width !== W || halo.height !== Hc) { halo = document.createElement('canvas'); halo.width = W; halo.height = Hc; }
      const gh = halo.getContext('2d'); gh.clearRect(0, 0, W, Hc); gh.drawImage(c, 0, 0);
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .32 + .1 * n; g.filter = `blur(${(W / 160).toFixed(1)}px)`; g.drawImage(halo, 0, 0); g.restore();
      /* N1 : sur téléphone (eau figée), la copie du halo rend sa mémoire après usage */
      if (TEL) { liberer(halo); halo = null; }
      g.setTransform(sx, 0, 0, sy, -VX * sx, -VY * sy);
      const cc = a => `rgba(${corps[0] | 0},${corps[1] | 0},${corps[2]},${a})`, cl = a => `rgba(255,250,232,${a})`;
      jets.forEach(j => {
        const deb = .8 + .14 * Math.sin(t * .37 * j.vr + j.ph);
        /* les gouttes qui se détachent à côté du filet, dans son dernier tiers : parties avec l'eau à l'instant phi_m,
           elles tombent avec elle et s'en écartent un peu ; jamais à la place du filet */
        const pas = .085, K = j.haut ? 0 : 1, tt = t * j.vr;
        if (K) for (let m = Math.floor((tt - j.tf) / pas); m <= Math.floor(tt / pas); m++) {
          const h1 = hash(m, j.k * 31 + 7); if (h1 > .3) continue;
          const td = tt - m * pas - hash(m, j.k * 31 + 8) * pas; if (td < 0 || td > j.tf) continue;
          const sv = hauteur(td, j.tf), sDet = .62 + .16 * hash(m, j.k * 31 + 9); if (sv < sDet || sv > .985) continue;
          const ta = tau(sv, j.tf), phi = tt - ta, v = vit(sv), y = j.y0 + j.H * sv;
          const cote = hash(m, j.k * 31 + 10) < .5 ? -1 : 1, ecart = (.55 + (sv - sDet) * 7) * j.w0 * .5 + .35;
          const x = centre(j, sv, ta, phi) + cote * ecart, r = j.w0 * deb * (.13 + .06 * hash(m, j.k + 3));
          const naitre = sseg(sv, sDet, sDet + .04);
          g.globalAlpha = j.op * .8 * naitre; g.fillStyle = cc(.85);
          g.beginPath(); g.ellipse(x, y, r, r * (1.4 + 1.6 * v), 0, 0, TAU); g.fill();
          g.globalAlpha = j.op * .9 * naitre; g.fillStyle = cl(.8); g.beginPath(); g.ellipse(x + r * .3, y - r * .5, r * .32, r * .7, 0, 0, TAU); g.fill();
        }
        /* au point de chute : brume, gouttes qui rebondissent, ondes, reflets qui tremblent */
        const xe = centre(j, 1, j.tf, t * j.vr - j.tf), ye = j.y3;
        g.globalAlpha = (.15 + .06 * Math.sin(t * 2.1 + j.ph)) * (j.haut ? .55 : 1);
        const br = g.createRadialGradient(xe, ye - 1, 0, xe, ye - 1, 8);
        br.addColorStop(0, cc(.85)); br.addColorStop(1, cc(0));
        g.fillStyle = br; g.beginPath(); g.ellipse(xe, ye - 1, 8, 3.4, 0, 0, TAU); g.fill();
        for (let q = 0; q < 3; q++) {
          const u = fr(t * (1.3 + .3 * q) + q * .37 + j.ph), hgt = 3 + 3 * Math.sin(q * 3.3 + j.ph) ** 2;
          g.globalAlpha = .65 * Math.sin(Math.PI * u) * (j.haut ? .55 : 1); g.fillStyle = cc(1);
          g.beginPath(); g.arc(xe + (q - 1) * 2.6 + Math.sin(j.ph + q) * 1.5, ye - hgt * 4 * u * (1 - u), .42, 0, TAU); g.fill();
        }
        if (!j.haut) {
          /* deux ondes concentriques lentes, décalées d'une demi-période, qui s'élargissent et s'effacent */
          for (let q = 0; q < 2; q++) {
            const u = fr(t * .26 + j.ph * .21 + q * .5);
            g.globalAlpha = .2 * (1 - u) * Math.min(1, u * 5); g.strokeStyle = cc(1); g.lineWidth = .38 + .25 * (1 - u);
            g.beginPath(); g.ellipse(xe, ye + 4, 3 + 26 * u, .9 + 5 * u, 0, 0, TAU); g.stroke();
          }
          g.strokeStyle = cl(1); g.lineWidth = .6;
          for (let q = 0; q < 3; q++) { const yy = ye + 5 + q * 2.4, dx = 1.6 * Math.sin(t * 6.3 + q * 2 + j.ph); g.globalAlpha = .26 * (.5 + .5 * Math.sin(t * 4.1 + q + j.ph)); g.beginPath(); g.moveTo(xe - 2.5 + dx, yy); g.lineTo(xe + 2.5 + dx, yy); g.stroke(); }
        }
      });
      g.globalAlpha = 1;
    }
    /* pour les essais : dessiner l'eau à un instant donné (mesure du coût, suites d'images) */
    window.__eauDessiner = t => { taille(); dessiner(t); };
    function image(ts) {
      boucle = 0;
      if (!actif || document.hidden) return;
      if (ts - dernier > 30) { dernier = ts; taille(); dessiner(typeof window.__eauTemps === 'number' ? window.__eauTemps : ts / 1000); }
      boucle = requestAnimationFrame(image);
    }
    return {
      regler(vu, n) {
        nuit = n;
        if (reduit) { if (vu && !actif) { actif = true; taille(); dessiner(12.3); } if (!vu) actif = false; return; }
        /* M8 (treizième passe) : sur téléphone, l'eau est figée (calculée pixel par pixel, à 30 images par seconde, elle
           coûtait cher la nuit, derrière le téléphone) : dessinée une fois, puis seulement quand la lumière change (l'aube) */
        /* M8 bis (10/10/2026) : sur téléphone, la boucle d'images de l'eau partait quand même si regler était appelé avant le premier calage
           (eau.figee posé par dims) : selon l'ordre de chargement, l'eau était figée ou animée, sur le temps absolu. Elle est arrêtée ici et
           l'eau redessinée à son instant figé : sur téléphone, toujours figée à 12,3 s ; l'ordinateur ne passe pas par ici */
        if (this.figee && TEL && boucle) { cancelAnimationFrame(boucle); boucle = 0; actif = false; }
        if (this.figee) { if (vu && (!actif || Math.abs(n - (this.nDessine || 0)) > .04)) { actif = true; this.nDessine = n; taille(); dessiner(12.3); } if (!vu) actif = false; return; }
        actif = vu;
        if (actif && !boucle) boucle = requestAnimationFrame(image);
      }
    };
  })();
  document.addEventListener('visibilitychange', () => { if (eau) eau.regler(eauVue, eauNuit); });
  let eauVue = false, eauNuit = 1;
  /* le ciel de la marche, le soleil qui se lève derrière les collines, le lointain gravé */
  const vl = vis.lointain;
  const ciel = document.createElement('div'); ciel.className = 'couche ciel'; ciel.setAttribute('aria-hidden', 'true');
  const soleil2 = document.createElement('i'); soleil2.className = 'soleil2'; ciel.appendChild(soleil2);
  /* J5 : le soleil de la marche est dessiné derrière les collines : son disque et son halo sont découpés au profil réel
     de la crête du lointain (calculé sur l'alpha du visuel : la première rangée où paraît l'encre de la ligne de montagnes
     la plus lointaine). Sous ce profil, rien du soleil ne se dessine : les montagnes lointaines, faites de traits sur du
     vide, ne le laissent plus voir par transparence, et le halo n'éclaire que le ciel au-dessus de la crête. */
  const PROFIL = { pret: false, y: null, n: 0 };
  /* démarrage (dixième passe) : le profil se calcule en tâches de quelques millisecondes pendant les temps morts (quatre
     bandes lues l'une après l'autre, seulement la moitié haute du dessin, où est la crête), jamais pendant une image ;
     en attendant, la crête est la ligne moyenne du manifeste (crete_moyenne) */
  /* P4 (seizième passe) : l'image réduite est décodée et relue par l'ouvrier (hors du fil principal : la première lecture
     décodait le lointain d'un bloc, 10 à 15 ms dans Chrome) ; la recherche de la crête se fait ensuite par bandes. Sans
     ouvrier, comme avant */
  function* profilEtapes(dat) {
    if (PROFIL.pret || !vl) return;
    const w = Math.round(vl.w / 2), h = Math.round(vl.h / 2), hb = Math.round(h * .62);
    let g = null;
    if (!dat) {
      const c = document.createElement('canvas'); c.width = w; c.height = hb;
      g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(vl.image, 0, 0, vl.w, hb * 2, 0, 0, w, hb);
      yield;
    }
    const y = new Float32Array(w).fill(-1), N = dat ? 8 : 4, sh = Math.ceil(hb / N);
    for (let b = 0; b < N; b++) {
      const r0 = b * sh, r1 = Math.min(hb, r0 + sh); let d, o = 0;
      if (dat) { d = dat; o = r0; }
      else { try { d = g.getImageData(0, r0, w, r1 - r0).data; } catch (e) { PROFIL.pret = true; return; } }
      for (let x = 0; x < w; x++) { if (y[x] >= 0) continue; for (let r = r0; r < r1; r++) if (d[((r - r0 + o) * w + x) * 4 + 3] > 34) { y[x] = r / h; break; } }
      yield;
    }
    for (let x = 0; x < w; x++) if (y[x] < 0) y[x] = .62;
    /* un lissage très court (la crête reste celle du dessin, sans dents d'un pixel) */
    const ys = new Float32Array(w); for (let x = 0; x < w; x++) { let m = 1; for (let k = -2; k <= 2; k++) m = Math.min(m, y[Math.min(w - 1, Math.max(0, x + k))]); ys[x] = m; }
    PROFIL.y = ys; PROFIL.n = w; PROFIL.pret = true;
  }
  const soleilC = document.createElement('canvas'); soleilC.className = 'soleil-crete'; soleilC.setAttribute('aria-hidden', 'true'); setV(soleilC, false); ciel.appendChild(soleilC);
  /* la crête (fraction de la hauteur du visuel) sous un point de l'écran, compte tenu des tuiles en miroir */
  function creteEcran(x, x0) {
    if (!PROFIL.pret || !PROFIL.y) return vl ? (vl.reperes.crete_moyenne || .43) : null;
    let u = (x - (x0 - L.lw)) / L.lw; const i = Math.floor(u); u -= i;
    if (TEL ? ((i % 2) + 2) % 2 === 0 : i !== 1) u = 1 - u;   /* les tuiles de part et d'autre sont en miroir (Y15, téléphone : une sur deux, jusqu'à cinq) */
    const fx = clamp(u) * (PROFIL.n - 1), a = Math.floor(fx), b = Math.min(PROFIL.n - 1, a + 1);
    return PROFIL.y[a] + (PROFIL.y[b] - PROFIL.y[a]) * (fx - a);
  }
  /* le soleil et son halo, découpés à la crête ; tant qu'il est en partie caché, la crête qui prend la lumière devant lui
     (un trait clair, flou, qui s'éteint à deux rayons de part et d'autre du disque) */
  const SOLEIL_R = 42, HALO_R = 250;   /* le rayon du disque clair et de son halo (px), comme l'ancien .soleil2 */
  function dessinerSoleil(xs, ys, yc, x0, y0, hs) {
    const dpr = Math.min(plafondDpr(2), window.devicePixelRatio || 1), S = HALO_R * 2;   /* S4 */
    /* V2 (vingt-deuxième passe, 08/10/2026) : le halo hors de l'écran (sur la route, la caméra tournée vers l'atelier : de p 0,68 à
       la fin du lointain) n'est plus redessiné à chaque image (1 million de pixels repeints pour rien sur téléphone) : il est
       caché ; il revient, redessiné, dès qu'un de ses bords rentre (60 px de marge pour la parallaxe du lointain) */
    /* X1 (vingt-quatrième passe, 08/10/2026) : sur téléphone, hors de l'écran, il rend aussi sa mémoire (3,8 Mo, avant la porte de
       l'atelier) ; il reprend sa taille et il est redessiné entièrement dès qu'il rentre (la ligne suivante) */
    if (xs - HALO_R + S < -60 || xs - HALO_R > W + 60 || ys - HALO_R + S < -60 || ys - HALO_R > H + 60) { setV(soleilC, false); if (TEL) liberer(soleilC); return; }
    if (soleilC.width !== Math.round(S * dpr)) { soleilC.width = soleilC.height = Math.round(S * dpr); soleilC.style.width = soleilC.style.height = S + 'px'; }
    const g = soleilC.getContext('2d'), ox = xs - HALO_R, oy = ys - HALO_R;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, S, S);
    const crete = x => { const c = creteEcran(ox + x, x0); return (c === null ? yc : y0 + c * L.lh) - oy; };
    /* au-dessus de la crête seulement */
    g.save(); g.beginPath(); g.moveTo(0, -2);
    for (let x = 0; x <= S; x += 3) g.lineTo(x, crete(x) + .4);
    g.lineTo(S, -2); g.closePath(); g.clip();
    const gr = g.createRadialGradient(HALO_R, HALO_R, 0, HALO_R, HALO_R, HALO_R), r = v => v / HALO_R;
    gr.addColorStop(0, 'rgba(255,250,240,1)'); gr.addColorStop(r(38), 'rgba(255,250,240,1)'); gr.addColorStop(r(48), 'rgba(255,241,214,1)'); gr.addColorStop(r(55), 'rgba(255,230,190,.62)');
    gr.addColorStop(r(78), 'rgba(255,214,160,.32)'); gr.addColorStop(r(128), 'rgba(255,206,155,.15)'); gr.addColorStop(r(190), 'rgba(255,200,150,.06)'); gr.addColorStop(1, 'rgba(255,200,150,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S); g.restore();
    /* le liseré */
    const k = clamp((1.15 - hs) / 2.15);
    if (k > .01) {
      const gl = g.createLinearGradient(HALO_R - SOLEIL_R * 3.2, 0, HALO_R + SOLEIL_R * 3.2, 0);
      [[0, 0], [.22, .25], [.38, .8], [.5, 1], [.62, .8], [.78, .25], [1, 0]].forEach(([t, a]) => gl.addColorStop(t, `rgba(255,246,222,${(a * k).toFixed(3)})`));
      g.beginPath();
      for (let x = HALO_R - SOLEIL_R * 3.2, i = 0; x <= HALO_R + SOLEIL_R * 3.2; x += 2, i++) { const y = crete(x) + .6; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.lineJoin = 'round'; g.strokeStyle = gl;
      /* sans filtre à chaque image : un trait large et pâle, puis le trait fin */
      g.globalAlpha = .35; g.lineWidth = 3.6; g.stroke(); g.globalAlpha = .6; g.lineWidth = 2.2; g.stroke();
      g.globalAlpha = 1; g.lineWidth = 1.1; g.stroke();
    }
    setV(soleilC, true); setT(soleilC, `translate(${ox.toFixed(1)}px,${oy.toFixed(1)}px)`);
  }
  const tuiles = [];
  /* Y15 (vingt-cinquième passe, 09/10/2026, soir) : Thibaut, sur la v4 : à l'approche de l'atelier, derrière lui à droite, « il n'y a
     plus rien, du ciel jusqu'au sol ». Mesuré (393 x 735, p 0,70 à 0,745) : la caméra tournée vers l'atelier, les trois tuiles du
     lointain vont de -1 167 à 187 px, la moitié droite de l'écran est vide. Sur téléphone, deux tuiles de plus à droite (cinq, de -1 à
     3 ; en miroir une sur deux, comme avant : la continuité est celle des trois tuiles d'avant), pour les collines, leur version
     floutée et leur lavis ; l'ordinateur garde ses trois tuiles */
  const NT = TEL ? 3 : 1;
  if (vl) for (let i = -1; i <= NT; i++) { const im = new Image(); im.src = vl.src; im.alt = ''; im.className = 'lointain'; if (i % 2 !== 0) im.style.setProperty('--miroir', '-1'); ciel.appendChild(im); tuiles.push(im); }
  /* C2 : la profondeur de champ, sans filtre animé : une version préfloutée du lointain, posée par-dessus, qui
     paraît quand on marche (la caméra avance) et s'efface à l'arrêt */
  const flous = [];
  /* P2 (seizième passe) : le lointain préflouté (le flou du canevas, puis l'encodage WebP : jusqu'à 78 ms d'un bloc dans
     Chrome, au retour de l'encodage, juste après la première image) passe par la file des préparations (besoin 0,30 : il
     ne paraît qu'à la marche, à partir de 0,33) */
  /* P4 (seizième passe) : flouté et encodé par l'ouvrier (l'encodage seul prenait 15 à 48 ms d'un bloc) ; l'image est décodée
     avant d'être posée. Sans ouvrier (ou sans filtre dans l'ouvrier), la file comme en P2 */
  const poserFlou = src => { const im0 = new Image(); im0.src = src; (im0.decode ? im0.decode().catch(() => {}) : Promise.resolve()).then(() => { for (let i = -1; i <= NT; i++) { const im = new Image(); im.src = src; im.alt = ''; im.className = 'lointain lointain-flou'; if (i % 2 !== 0) im.style.setProperty('--miroir', '-1'); im.style.opacity = 0; ciel.appendChild(im); flous.push(im); } if (W) dims(Ldernier); }); };
  /* P4 : sans filtre dans l'ouvrier (WebKit), le flou se fait ici (la carte graphique, rapide), la lecture par quarts, et
     l'encodage par l'ouvrier ; sans ouvrier du tout, l'encodage d'avant */
  const flouFil = () => planifier({ nom: 'lointain-flou', besoin: .3, gen: (function* () {
    yield;
    try {
      const c = document.createElement('canvas'); c.width = vl.w; c.height = vl.h;
      const g = c.getContext('2d'); g.filter = 'blur(2.4px)'; g.drawImage(vl.image, 0, 0); g.filter = 'none';
      /* (la relecture attend l'image suivante : la carte graphique a fini le flou) */
      yield PAUSE;
      const w = vl.w, h = vl.h, data = new Uint8ClampedArray(w * h * 4);
      for (let q = 0; q < 8; q++) { const a = Math.floor(h * q / 8), b = Math.floor(h * (q + 1) / 8); data.set(g.getImageData(0, a, w, b - a).data, a * w * 4); yield; }
      /* P2 : le canevas de travail rend sa mémoire dès l'encodage fait (4 Mo ; il attendait le ramasse-miettes) */
      ouvrier('encoder', { w, h, data: data.buffer, type: 'image/webp', q: .9 }, [data.buffer]).then(r => { liberer(c); poserFlou(URL.createObjectURL(r.blob)); },
        () => c.toBlob(b => { liberer(c); if (b) poserFlou(URL.createObjectURL(b)); }, 'image/webp', .9));
    } catch (e) { /* sans canevas : pas de profondeur de champ */ }
  })() });
  /* P4 bis : le lointain préflouté est d'abord pris tout fait (prets/lointain-flou.webp, fait par l'ouvrier de Chrome, le
     même flou de 2,4 px et le même encodage) : dans WebKit, le flou par la carte graphique et sa relecture coûtaient 11 à
     24 ms par étape pendant la conversation ; sinon (source changée), l'ouvrier, puis la file, comme avant */
  const flouOuvrier = () => ouvrier('flouImage', { url: new URL(vl.src, location.href).href, flou: 2.4, type: 'image/webp', q: .9 }).then(r => poserFlou(URL.createObjectURL(r.blob)), flouFil);
  if (vl) setTimeout(() => pret('lointain-flou').then(r => (r && r.e.taille && r.im.naturalWidth === r.e.taille[0] && r.im.naturalHeight === r.e.taille[1] ? poserFlou(r.url) : flouOuvrier())), 1300);
  let Ldernier = null, vMarche = 0;
  el.fond.after(ciel);
  /* J5 : le profil de la crête est calculé pendant les temps morts, peu après le démarrage (ou à la première demande) */
  if (vl) setTimeout(() => {
    const w = Math.round(vl.w / 2), hb = Math.round(Math.round(vl.h / 2) * .62), go = dat => planifier({ nom: 'crete', gen: profilEtapes(dat), apres: () => { if (ctx.redessiner) ctx.redessiner(); } });
    ouvrier('pixels', { url: new URL(vl.src, location.href).href, sx: 0, sy: 0, sw: vl.w, sh: hb * 2, w, h: hb }).then(r => go(new Uint8ClampedArray(r.data)), () => go(null));
  }, 1200);
  let W = 0, H = 0, L = {};
  function dims(Lm) {
    if (eau) eau.figee = !!(Lm && Lm.mob);
    Ldernier = Lm;
    W = s.clientWidth; H = s.clientHeight;
    const mob = W < 768, fw = Math.max(W, H * 1.8512), fh = fw / 1.8512;
    /* Q6 (dix-septième passe, 07/10/2026) : la lune de la gravure de nuit est coupée par le haut de l'image (disque de
       87,5 px de rayon, centré 6,4 px au-dessus du bord, mesuré). Sur un écran d'ordinateur large (rapport de 1,65 à
       1,85, 1920 x 1080 compris), où son disque est entièrement dans la largeur, le village descend de 9,58 % de sa
       hauteur (103 px de l'image) et le ciel continue au-dessus de l'image (prets/ciel-haut-nuit.webp et -jour.webp,
       faits une fois d'après les gravures : la moitié haute de la lune est le miroir de sa moitié basse) : la lune est
       entière, sous aucune barre. Ailleurs, rien ne change. L'affiche d'avant le film suit la même règle (film.css) */
    const ratio = W / H, lune = !mob && ratio >= 1.65 && ratio <= 1.8512, dyLune = lune ? fh * .09581 : 0;
    if (lune && !el.cielHaut) {
      el.cielHaut = ['jour', 'nuit'].map(n => { const d = document.createElement('div'); d.className = 'ciel-haut ciel-haut--' + n; d.setAttribute('aria-hidden', 'true'); return d; });
      el.nuit.after(...el.cielHaut);
    }
    L = { mob, fw, fh, F: Lm.F, CX: Lm.CX, CY: Lm.CY,
      A: mob ? { tx: W * .5 - .79 * fw, ty: (H - fh) / 2 } : { tx: (W - fw) * .78, ty: (H - fh) / 2 + dyLune },
      bx: mob ? .43 : .40, by: .38, sB: mob ? 1.62 : 1.6 };
    el.cadre.style.setProperty('--fw', fw + 'px'); el.cadre.style.setProperty('--fh', fh + 'px');
    if (vl) { L.lw = Math.min(vl.w * 1.25, W * 1.12); L.lh = L.lw * vl.h / vl.w; tuiles.concat(flous).forEach(t => { t.style.width = L.lw + 'px'; t.style.height = L.lh + 'px'; }); }
  }
  /* direction du soleil (cap) : devant, un peu à gauche ; la lumière vient de la gauche, et de face quand on prend la branche de l'atelier */
  const capSoleil = -.09;
  function rendreCiel(p, cam, cap0) {
    const k = vl ? seg(p, .33, .40) * (1 - seg(p, .748, .76)) : 0;
    setV(ciel, k > .002); setO(ciel, k);
    if (k <= .002 || !cam) return k;
    const yh = L.CY + L.F * Math.tan(cam.pitch);
    /* J9 : le soleil est un point du lointain, à l'infini : à l'écran il se déplace exactement comme le calque des collines
       quand la caméra tourne (même formule, même décalage), et pour rien d'autre ; le glissement de J7 pendant le pivot
       est retiré : s'il sort du cadre, il sort. Sa seule variation propre est sa hauteur (hauteurSoleil) */
    const xs = L.CX - L.F * Math.tan(clamp(cam.yaw - cap0, -1.1, 1.1)) + L.F * Math.tan(capSoleil);
    /* J5 : sans le lointain (ou avant que son profil soit prêt), la hauteur angulaire d'avant */
    let ys = yh - L.F * Math.tan(lerp(.05, .26, sseg(p, .30, .62))), hs = 9;
    if (vl) {
      /* le lointain : la crête au-dessus de l'horizon, il tourne avec la caméra (il est à l'infini) */
      const ref = (vl.reperes.bas_du_dessin || .69) * .55 + (vl.reperes.crete_moyenne || .43) * .45;
      const y0 = yh - ref * L.lh;
      let x0 = L.CX - L.lw / 2 - L.F * Math.tan(clamp(cam.yaw - cap0, -1.1, 1.1));
      tuiles.forEach((t, i) => setT(t, `translate(${(x0 + (i - 1) * L.lw).toFixed(1)}px,${y0.toFixed(1)}px) scaleX(var(--miroir,1))`));
      if (flous.length) {
        /* la vitesse de marche, lissée : le flou vient et s'en va doucement */
        vMarche += (clamp(cam.v || 0) - vMarche) * .12;
        const kf = .7 * sseg(vMarche, .05, .6);
        flous.forEach((t, i) => { setV(t, kf > .01); setO(t, kf); setT(t, `translate(${(x0 + (i - 1) * L.lw).toFixed(1)}px,${y0.toFixed(1)}px) scaleX(var(--miroir,1))`); });
      }
      /* J5 : le soleil posé sur la crête réelle à sa verticale, et découpé par elle */
      const cr = creteEcran(xs, x0);
      if (cr !== null) {
        const yc = y0 + cr * L.lh;
        hs = hauteurSoleil(p); ys = yc - hs * SOLEIL_R;
        dessinerSoleil(xs, ys, yc, x0, y0, hs);
        /* pour les essais (J9) : le disque et un repère des collines (le coin haut gauche de la tuile du milieu) */
        window.__soleil = [xs, ys, x0, y0];
      }
    }
    /* sans profil de crête : l'ancien soleil, à sa hauteur angulaire */
    setV(soleil2, hs === 9); if (hs === 9) { setV(soleilC, false); setT(soleil2, `translate(${xs.toFixed(1)}px,${ys.toFixed(1)}px) translate(-50%,-50%)`); }
    return k;
  }
  /* I1 : la place du lointain à l'écran (dans la couche du ciel, avant sa parallaxe), pour que son lavis d'aquarelle s'y
     pose exactement ; mêmes calculs que rendreCiel */
  function geoLointain(cam, cap0) {
    if (!vl || !W || !cam || !L.lw) return null;
    const yh = L.CY + L.F * Math.tan(cam.pitch);
    const ref = (vl.reperes.bas_du_dessin || .69) * .55 + (vl.reperes.crete_moyenne || .43) * .45;
    return { x0: L.CX - L.lw / 2 - L.F * Math.tan(clamp(cam.yaw - (cap0 || 0), -1.1, 1.1)), y0: yh - ref * L.lh, lw: L.lw, lh: L.lh, nt: NT };   /* Y15 : nt */
  }
  function rendre(p, cam, cap0) {
    if (!W) return;
    const kc = rendreCiel(p, cam, cap0 || 0);
    const visible = p < .76 && kc < 1;
    setV(el.fond, visible); if (!visible) { eauVue = false; if (eau) eau.regler(false, 0); return; }
    const kNuit = 1 - sseg(p, T.nuitJour[0], T.nuitJour[1]);
    eauVue = p < .36; eauNuit = kNuit; if (eau) eau.regler(eauVue, kNuit);
    setO(el.nuit, kNuit);
    el.cadre.style.setProperty('--n', kNuit.toFixed(3));
    const tc = eDepl(seg(p, T.camera[0], T.camera[1]));
    const sMarche = L.sB * (1 + .07 * sseg(p, .40, .66) + .07 * sseg(p, .69, .74));
    const sc = tc < 1 ? Math.pow(L.sB, tc) : sMarche;
    const pitch = cam ? cam.pitch : 0, yaw = cam ? cam.yaw : 0;
    const yh = L.CY + L.F * Math.tan(tc > 0 ? pitch : 0);
    const dxYaw = -L.F * Math.tan(clamp(yaw, -.25, .25)) * .32;
    const SA = [L.A.tx + L.bx * L.fw, L.A.ty + L.by * L.fh], SB = [L.CX + dxYaw, yh];
    const Sx = lerp(SA[0], SB[0], tc), Sy = lerp(SA[1], SB[1], tc);
    setT(el.cadre, `translate3d(${(Sx - L.bx * L.fw * sc).toFixed(2)}px,${(Sy - L.by * L.fh * sc).toFixed(2)}px,0) scale(${sc.toFixed(5)})`);
    /* le soleil : derrière l'épaule de la colline, puis il monte. J5 : sa hauteur au-dessus de la crête de la colline
       (sous le disque, à sa verticale) suit la fonction unique hauteurSoleil(p) ; le rayon du disque fait 3,42 % de la
       hauteur du cadre (3,7 % de sa largeur, cadre de rapport 1,85) */
    const ks = eEntree(seg(p, .232, .41)), ks2 = sseg(p, .41, .72);
    const sx = lerp(lerp(42.8, 46.6, ks), 48.2, ks2), hv = hauteurSoleil(p), sy = creteVillage(sx) - hv * 3.42;
    el.cielsol.style.setProperty('--sx', sx + '%'); el.cielsol.style.setProperty('--sy', sy + '%');
    el.aube.style.setProperty('--sx', sx + '%'); el.aube.style.setProperty('--sy', (sy + 4) + '%');
    setO(el.cielsol, seg(p, .226, .25));
    /* le liseré de la crête du village devant le soleil, tant qu'il est en partie caché */
    const kl = clamp((1.15 - hv) / 2.15) * seg(p, .226, .24);
    /* L4 : le liseré (masqué, flou) n'est mis à jour et dessiné que lorsqu'il se voit */
    setV(el.lisere, kl > .002);
    if (kl > .002) { el.lisere.style.setProperty('--sx', sx + '%'); el.lisere.style.setProperty('--cy', creteVillage(sx) + '%'); setO(el.lisere, kl); }
    { const kr = sseg(p, .29, .37) * .9; setV(el.rayons, kr > .002); setO(el.rayons, kr); }
    const kAube = Math.sin(Math.PI * seg(p, .24, .36)) * .95;
    setO(el.aube, clamp(p < .3 ? kAube : Math.max(kAube, .38 * sseg(p, .32, .39))));
    setO(el.etoiles, 1 - sseg(p, .225, .28));
    const kf = seg(p, .055, .098);
    setO(el.filante, kf > 0 && kf < 1 ? Math.sin(Math.PI * kf) : 0);
    el.filante.style.transform = `rotate(-24deg) translateX(${(-260 * kf).toFixed(1)}%) scaleX(${(.2 + .8 * kf).toFixed(3)})`;
    /* F2 : les lumières s'éteignent pendant le lever du soleil, la lueur baisse puis plus rien */
    el.lums.forEach(l => { const off = +l.dataset.off; setO(l, 1 - sseg(p, off - .03, off + .018)); });
    const kh = eDepl(seg(p, T.heure[0], T.heure[1]));
    el.cadre.style.setProperty('--ah', (323.5 + 240 * kh + 2.5 * kh).toFixed(1) + 'deg');
    el.cadre.style.setProperty('--am', (282 + 2880 * kh + 30 * kh).toFixed(1) + 'deg');
  }
  return { dims, rendre, geoLointain };
}
