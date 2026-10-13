/* =====================================================================
   Passe 28 (13/10/2026) : le crayon du visiteur sur la page finale, dans le lecteur vidéo (proto3.js). Dans le film en direct
   (plans/p8-page.js, lignes 234 à 312 et 775 à 792), à la page blanche, le crayon couché sur la règle devient « libre » : on le
   prend (appui, capture du pointeur), on le déplace, il trace sur la page (canevas trace-visiteur), il revient se coucher au
   relâchement par un arc de 650 ms (F15) ; double clic : il reste en main et suit le pointeur, il trace quand on appuie, un clic
   hors de la feuille ou Échap le repose ; au clavier, les flèches tracent ; dès qu'on a tracé, un bouton « Effacer le brouillon »
   paraît sous la bulle (G4). Dans le lecteur, la page est la dernière image de T3 : le crayon y est dans la vidéo.
   Ici, à la page au repos (dernière image de T3, aucun trajet), trois choses posées en DOM dans la couche des superposés (p2-sup,
   au repère de la scène fixe), aux places que le film leur donne aux conditions du rendu de T3 (relevées dans la copie de rendu
   p27/y8b, hd.patch, 393 x 852 et 430 x 932, rail posé comme à 662 et 742, hasard à graine fixe : tests de la passe 28,
   crayon-rendu.py) :
   - une plaque (c-film/prets/crayon-plaque-393.webp et -430.webp, sans perte) : la règle sans le crayon ni son ombre, prise dans
     la même capture que le crayon, en sRGB, fondue sur ses bords (10 px CSS aux bouts, 3 en haut et en bas), qui cache le crayon
     de la vidéo. Elle est peinte dans le canevas de la vidéo lui-même (p2-toile), sur l'image arrêtée, et ses couleurs y sont
     accordées à celles de cette image (un gain et un décalage par canal, ajustés sur les pixels du cœur de la plaque hors du crayon) :
     mesuré sur l'iPhone, une plaque posée en élément à part s'affichait autrement que la vidéo (+8, -1 et -9 niveaux, la composition
     du canevas de la vidéo par iOS), même accordée ; peinte dans le même canevas, elle passe par le même chemin. La zone remplacée
     est gardée et rendue dès que la page s'en va, si la vidéo n'a pas déjà repeint l'image ;
   - le crayon et son ombre, l'image et la pose du film (provisoire('crayon-dessine'), la même fabrique que le film ; poserCrayon
     d'atelier.js pour l'ombre) : au repos, le crayon du film en direct au pixel (la vidéo, encodée, l'adoucissait) ;
   - le canevas de tracé, posé sur la page comme dans le film (epingle), et le bouton « Effacer le brouillon ».
   La logique de p8-page.js est reprise telle quelle, aux mêmes nombres. Deux écarts, dictés par la vidéo : la bulle « Parler de mon
   projet » est dans l'image, sous le canevas ; dans le film elle passe devant le tracé (z 21 contre 15) : ici le tracé ne s'écrit
   pas sous elle (une découpe à sa forme, arrondis compris). Et quand la page s'en va (un trajet, le doigt qui remonte), le film
   laisse le brouillon pâlir une seconde en suivant la page ; ici la page de la vidéo bouge sans lui : il part tout de suite, avec
   le crayon et la plaque (la vidéo les remontre telle qu'elle est).
   ===================================================================== */
import { clamp, lerp, seg, eDepl, appl, inv3, mult3, carreVers, m3d, epingle, zoneDoigt, DOIGT, sseg } from './outils.js';
import { provisoire, reperesPx } from './visuels.js';

/* la page au repos, aux conditions du rendu (style des éléments du film, relevé à 6 décimales) ; H : la hauteur de la scène du rendu
   (echelleCrayon de p7-dessin.js : F.H * 0,4 / la distance de la pointe au poignet de la main au crayon, 871,31 px) */
/* emp : l'empreinte du crayon et de son ombre dans la plaque (pixels de la plaque, densité 3), écartée de l'accord des couleurs */
const POSES = {
  393: { H: 852, emp: [49, 18, 490, 65], crayon: [.208467, 193.528396, 532.721144], trace: { w: 784, h: 326.5, cw: 1568, ch: 653, m: [.869418, 0, 0, 0, -.063681, .724505, 0, -.000261, 0, 0, 1, 0, -144.31203, 246.459236, 0, 1] }, plaque: [180, 530, 180, 28] },
  430: { H: 932, emp: [50, 18, 537, 66], crayon: [.229839, 211.723754, 608.566976], trace: { w: 864, h: 360, cw: 1728, ch: 720, m: [.869795, 0, 0, 0, -.063287, .719424, 0, -.000237, 0, 0, 1, 0, -160.751329, 292.958128, 0, 1] }, plaque: [198, 606, 195, 28] }
};
const MAIN_POINTE_POIGNET = 871.319;   /* manifeste : pointe (0,2275 ; 0,2305), poignet (0,8 ; 0,86), image de 1024 px */
/* matrix3d (16 nombres, en colonnes) vers la matrice 3 x 3 de outils.js (m3d à l'envers) */
const H3 = v => [v[0], v[4], v[12], v[1], v[5], v[13], v[3], v[7], 1];
const lireMatrice = s => { const m = /matrix3d\(([^)]+)\)/.exec(s || ''); return m ? H3(m[1].split(',').map(Number)) : null; };

const FEUILLE = `
.p2-c{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform;backface-visibility:hidden}
`;

/* sup : la couche des superposés ; scene : la scène (le doigt « tenu ») ; k() : l'échelle de la couche ; classe : 393 ou 430 ;
   bulle : la réplique de la bulle (sa pose fait la découpe du tracé et la place du bouton du brouillon) */
/* toile : le canevas de la vidéo (3 pixels par pixel CSS de la scène) ; dessins() : le nombre d'images que le lecteur y a peintes */
/* relecture du 13/10 : une seule création par scène (sinon feuille, éléments et écouteurs de la scène en double) ; la promesse est gardée
   sur la scène dès l'appel, oubliée si la création échoue */
export function creerCrayon(o) {
  const s = o.scene;
  if (s._crayonL) return s._crayonL;
  return (s._crayonL = creer(o).then(c => c || (s._crayonL = null), e => { s._crayonL = null; throw e; }));
}
/* calme() (facultatif) : la promesse du lecteur qui se tient quand aucun trajet n'est en cours */
async function creer({ sup, scene, k, classe, bulle, toile, dessins, calme }) {
  const P0 = POSES[classe]; if (!P0) return null;
  const vcd = await provisoire('crayon-dessine'); if (!vcd) return null;
  const st = document.createElement('style'); st.textContent = FEUILLE; document.head.appendChild(st);
  const el = h => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild; };
  /* les éléments, dans l'ordre du film (la plaque sous l'ombre) */
  const plaque = document.createElement('canvas');   /* hors de la page : la plaque accordée, peinte dans le canevas de la vidéo */
  const imPlaque = new Image(); imPlaque.decoding = 'async'; imPlaque.src = new URL('../prets/crayon-plaque-' + classe + '.webp', import.meta.url).href;
  try { await imPlaque.decode(); } catch (e) { return null; }
  if (calme) await calme();   /* la suite est synchrone (feuille, éléments, canevas de tracé de 4 à 5 Mo) : jamais pendant un trajet */
  plaque.width = imPlaque.naturalWidth; plaque.height = imPlaque.naturalHeight;
  /* l'accord des couleurs de la plaque sur l'image de la vidéo (une fois, à la première arrivée) ; sans lecture possible, la plaque telle quelle */
  let accordee = false, posee = null;
  const gt = toile.getContext('2d'), rx = Math.round(P0.plaque[0] * 3), ry = Math.round(P0.plaque[1] * 3);
  function accorder() {
    accordee = true;
    const W = plaque.width, Hh = plaque.height, gp = plaque.getContext('2d');
    gp.clearRect(0, 0, W, Hh); gp.drawImage(imPlaque, 0, 0);
    try {
      const P = gp.getImageData(0, 0, W, Hh), V = gt.getImageData(rx, ry, W, Hh).data, d = P.data;
      const [e0, e1, e2, e3] = P0.emp, m = 6, S = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
      for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
        if (x > e0 - m && x < e2 + m && y > e1 - m && y < e3 + m) continue;
        const i = (y * W + x) * 4; if (d[i + 3] !== 255) continue;   /* le cœur seulement : hors du fondu, les couleurs lues sont exactes */
        for (let c = 0; c < 3; c++) { const p = d[i + c], v = V[i + c], a = S[c]; a[0] += p; a[1] += v; a[2] += p * p; a[3] += p * v; a[4]++; }
      }
      const fit = S.map(([sp, sv, spp, spv, n]) => { const det = n * spp - sp * sp; let g = det > 1e-6 ? (n * spv - sp * sv) / det : 1; g = Math.min(1.25, Math.max(.8, g)); return [g, Math.min(40, Math.max(-40, (sv - g * sp) / n))]; });
      for (let i = 0; i < d.length; i += 4) for (let c = 0; c < 3; c++) d[i + c] = fit[c][0] * d[i + c] + fit[c][1];
      gp.putImageData(P, 0, 0); accord = fit.map(([g, b]) => [+g.toFixed(4), +b.toFixed(2)]);
    } catch (e) { accord = 'lecture impossible : plaque telle quelle'; }
  }
  let accord = null;
  const trace = el('<canvas class="p2-c trace-visiteur" aria-hidden="true"></canvas>');
  const ombre = el('<i class="p2-c crayon-ombre" style="width:200px;height:20px"></i>');
  const crayon = el(`<button type="button" class="p2-c crayon-dessine" style="width:${vcd.w}px;height:${vcd.h}px" aria-label="Prendre le crayon"><img src="${vcd.src}" alt="" width="${vcd.w}" height="${vcd.h}" style="width:100%;height:100%"></button>`);
  const effacer = el('<button type="button" class="p2-c brouillon" tabindex="-1">Effacer le brouillon</button>');
  const tous = [trace, ombre, crayon, effacer];
  /* la plaque dans le canevas de la vidéo : posée (la zone d'avant gardée), retirée (rendue, si aucune image n'a été peinte depuis) */
  function poserPlaque() {
    if (posee) return;
    if (!accordee) accorder();
    try { posee = { avant: gt.getImageData(rx, ry, plaque.width, plaque.height), n: dessins() }; gt.drawImage(plaque, rx, ry); } catch (e) { posee = null; }
  }
  function retirerPlaque() {
    if (!posee) return;
    try { if (dessins() === posee.n) gt.putImageData(posee.avant, rx, ry); } catch (e) { /* rien */ }
    posee = null;
  }
  tous.forEach(e => { e.style.visibility = 'hidden'; sup.appendChild(e); });
  const vis = (e, v) => { const s = v ? '' : 'hidden'; if (e._v !== s) { e._v = s; e.style.visibility = s; } };
  const setT = (e, v) => { if (e._t !== v) { e._t = v; e.style.transform = v; } };
  const setO = (e, v) => { v = +(+v).toFixed(3); if (e._o !== v) { e._o = v; e.style.opacity = v; } };

  /* ---- les poses (atelier.js : crayonRegle, surDeux, poserCrayon ; p8-page.js : enMain) ---- */
  const cP = reperesPx(vcd, 'pointe') || [vcd.w * .02, vcd.h / 2], cB = reperesPx(vcd, 'bout') || [vcd.w * .98, vcd.h / 2];
  const [s0, x0, y0] = P0.crayon, regle = { P: [x0 + s0 * cP[0], y0 + s0 * cP[1]], E: [x0 + s0 * cB[0], y0 + s0 * cB[1]] };
  function surDeux(a, b, A, Bp) {
    const va = [b[0] - a[0], b[1] - a[1]], vb = [Bp[0] - A[0], Bp[1] - A[1]];
    const s = Math.hypot(...vb) / Math.hypot(...va), ang = Math.atan2(vb[1], vb[0]) - Math.atan2(va[1], va[0]);
    const c = Math.cos(ang) * s, si = Math.sin(ang) * s;
    return [c, -si, A[0] - (c * a[0] - si * a[1]), si, c, A[1] - (si * a[0] + c * a[1]), 0, 0, 1];
  }
  function poserCrayon(o) {
    const Hc = o.H || surDeux(cP, cB, regle.P, regle.E), op = o.op === undefined ? 1 : o.op;
    vis(crayon, op > .002); setT(crayon, m3d(Hc)); setO(crayon, op);
    if (DOIGT) zoneDoigt(crayon, Hc, vcd.w, vcd.h, !!(o.bouton || o.libre));
    crayon.style.zIndex = o.z || 18;
    const P = appl(Hc, ...cP), E = appl(Hc, ...cB), lev = o.leve || 0;
    const dx = E[0] - P[0], dy = E[1] - P[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l, ep = Math.max(6, l * .04);
    const q = [[P[0] - nx * ep * .4, P[1] - ny * ep * .4], [E[0] - nx * ep * .4, E[1] - ny * ep * .4], [E[0] + nx * ep * .6, E[1] + ny * ep * .6], [P[0] + nx * ep * .6, P[1] + ny * ep * .6]].map(([x, y]) => [x + 4 + lev * 18, y + 6 + lev * 22]);
    vis(ombre, op > .002); setT(ombre, epingle(200, 20, q)); setO(ombre, op * (.7 - lev * .35));
    /* la bulle passe devant l'ombre dans le film (z 21 contre 17) ; ici elle est dans la vidéo, sous la couche : l'ombre est découpée à
       sa forme (le flou d'abord, la découpe ensuite, comme le film où la bulle opaque la couvre) */
    if (bulleEcran) {
      const Hi = inv3(mult3(carreVers(q), [1 / 200, 0, 0, 0, 1 / 20, 0, 0, 0, 1])), f = ([x, y]) => x.toFixed(2) + 'px ' + y.toFixed(2) + 'px';
      const trou = bulleEcran.map(p => appl(Hi, ...p)), cle = trou.map(f).join(',');
      if (ombre._clip !== cle) { ombre._clip = cle; ombre.style.clipPath = `polygon(evenodd, -80px -80px, 280px -80px, 280px 100px, -80px 100px, -80px -80px, ${cle}, ${f(trou[0])})`; }
    }
    crayon.classList.toggle('libre', !!o.libre);
    crayon.tabIndex = o.bouton || o.libre ? 0 : -1;
    return Hc;
  }
  const ech = P0.H * .4 / MAIN_POINTE_POIGNET, L = Math.hypot(cB[0] - cP[0], cB[1] - cP[1]) * ech;
  const enMain = pt => [pt, [pt[0] + .826 * L, pt[1] + .563 * L]];

  /* ---- le canevas de tracé, sur la page (atelier.js, poserTrace ; p8-page.js, versPage, tracer) ---- */
  const T0 = P0.trace, Ht = lireMatrice('matrix3d(' + T0.m.join(',') + ')');
  trace.width = T0.cw; trace.height = T0.ch; trace.style.width = T0.w + 'px'; trace.style.height = T0.h + 'px'; setT(trace, 'matrix3d(' + T0.m.join(',') + ')');
  const SW = T0.cw, SH = T0.ch, Hinv = inv3(Ht);
  const versPage = (x, y) => { const [u, v] = appl(Hinv, x, y); return [u * SW / T0.w, v * SH / T0.h]; };
  const g = trace.getContext('2d');
  /* la découpe de la bulle (elle passe devant le tracé dans le film) : son contour arrondi, dans les pixels de la page ; et la place du
     bouton du brouillon, sous elle (q[3] : son coin bas gauche). Lues sur la réplique de la bulle quand la page est là (la piste la pose
     à la dernière image de T3), refaites si elle change */
  let decoupe = null, qb3 = null, cleBulle = null, bulleEcran = null;
  const majBulle = () => {
    const t = bulle ? bulle.style.transform : ''; if (t === cleBulle) return; cleBulle = t;
    const Hb = lireMatrice(t); decoupe = qb3 = bulleEcran = null; if (!Hb) return;
    const bw = 236, bh = 46, R = [17, 17, 5, 17], pts = [];   /* film.css : 17 px, le coin bas droit à 5 px (haut gauche, haut droit, bas droit, bas gauche) */
    const coin = (cx, cy, r, a0) => { for (let i = 0; i <= 8; i++) { const a = a0 + i * Math.PI / 16; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
    coin(R[0], R[0], R[0], Math.PI); coin(bw - R[1], R[1], R[1], -Math.PI / 2); coin(bw - R[2], bh - R[2], R[2], 0); coin(R[3], bh - R[3], R[3], Math.PI / 2);
    bulleEcran = pts.map(([x, y]) => appl(Hb, x, y));
    decoupe = bulleEcran.map(p => versPage(...p));
    qb3 = appl(Hb, 0, bh);
  };
  let aTrace = false, gomme = null;
  function vider() { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, trace.width, trace.height); aTrace = false; gomme = null; trace.style.opacity = ''; }
  function tracer(a, b) {
    const pa = versPage(...a), pb = versPage(...b);
    const dans = q => q[0] > 8 && q[0] < SW - 8 && q[1] > SH * .08 && q[1] < SH - 8;
    if (!dans(pa) || !dans(pb)) return;
    const kk = SW / 1200;
    aTrace = true; gomme = null; trace.style.opacity = '';
    g.save();
    if (decoupe) { g.beginPath(); g.rect(0, 0, SW, SH); g.moveTo(...decoupe[0]); decoupe.slice(1).forEach(p => g.lineTo(...p)); g.closePath(); g.clip('evenodd'); }
    g.lineCap = 'round'; g.strokeStyle = 'rgba(22,32,92,.7)';
    for (let i = 0; i < 2; i++) { g.lineWidth = (1.6 + Math.random() * 1.2) * kk; g.globalAlpha = .45 + Math.random() * .35; g.beginPath(); g.moveTo(pa[0] + (Math.random() - .5) * kk, pa[1] + (Math.random() - .5) * kk); g.lineTo(pb[0] + (Math.random() - .5) * kk, pb[1] + (Math.random() - .5) * kk); g.stroke(); }
    g.restore();
  }

  /* ---- les gestes (p8-page.js, lignes 248 à 312) ---- */
  let actif = false, libre = null, prise = null, dernier = null, tenu = false, retour = null, demande = null;
  const demander = () => { if (demande) demande(); };
  const ici = e => { const r = sup.getBoundingClientRect(), kk = k(); return [(e.clientX - r.left) / kk, (e.clientY - r.top) / kk]; };
  const surFeuille = pt => { const q = versPage(...pt); return q[0] > 0 && q[0] < SW && q[1] > 0 && q[1] < SH; };
  function reposer() {
    if (!libre) { tenu = false; return; }
    retour = { de: libre.slice(), t0: performance.now() }; tenu = false; prise = null; demander();
  }
  effacer.addEventListener('click', e => { e.stopPropagation(); if (aTrace) { gomme = { t0: performance.now(), d: 260 }; demander(); } });
  crayon.addEventListener('pointerdown', e => {
    if (!actif || !crayon.classList.contains('libre')) return;
    e.preventDefault(); e.stopPropagation(); try { crayon.setPointerCapture(e.pointerId); } catch (err) { /* rien */ }
    retour = null; prise = { id: e.pointerId }; libre = ici(e); dernier = libre.slice(); demander();
  });
  crayon.addEventListener('pointermove', e => {
    if (!prise || e.pointerId !== prise.id) return;
    const pt = ici(e); tracer(dernier, pt); dernier = pt; libre = pt; demander();
  });
  const lacher = e => { if (prise && e.pointerId === prise.id) { prise = null; if (!tenu) reposer(); demander(); } };
  crayon.addEventListener('pointerup', lacher); crayon.addEventListener('pointercancel', lacher);
  crayon.addEventListener('dblclick', e => {
    if (!actif || !crayon.classList.contains('libre')) return;
    e.preventDefault(); e.stopPropagation(); retour = null; tenu = true; libre = ici(e); dernier = libre.slice(); demander();
  });
  scene.addEventListener('pointermove', e => {
    if (!tenu || prise) return;
    const pt = ici(e); if (e.buttons & 1) tracer(dernier, pt); dernier = pt; libre = pt; demander();
  });
  scene.addEventListener('pointerdown', e => {
    if (!tenu || e.target === crayon) return;
    const pt = ici(e); if (!surFeuille(pt)) { reposer(); return; } dernier = pt; libre = pt;
  });
  crayon.addEventListener('keydown', e => {
    if (!actif || !crayon.classList.contains('libre')) return;
    if (e.key === 'Escape') { if (libre) { e.preventDefault(); e.stopPropagation(); reposer(); } return; }
    const pas = 14, d = { ArrowLeft: [-pas, 0], ArrowRight: [pas, 0], ArrowUp: [0, -pas], ArrowDown: [0, pas] }[e.key];
    if (!d) return; e.preventDefault(); e.stopPropagation(); retour = null;
    const base = libre || regle.P; const pt = [base[0] + d[0], base[1] + d[1]]; tracer(base, pt); libre = pt; demander();
  });

  /* ---- à chaque image du lecteur : la page au repos (ici) ou non ; rend vrai tant qu'une animation demande des images ---- */
  function rendre(ici_) {
    if (!ici_) {
      if (actif) { actif = false; libre = null; retour = null; tenu = false; prise = null; if (aTrace) vider(); tous.forEach(e => vis(e, false)); effacer.classList.remove('vu'); effacer.tabIndex = -1; crayon.tabIndex = -1; retirerPlaque(); }
      return false;
    }
    actif = true; let anime = false; majBulle();
    /* une image peinte depuis la pose (la même, redemandée) : la plaque est à reposer */
    if (posee && dessins() !== posee.n) posee = null;
    poserPlaque();
    vis(trace, true);
    const vuB = aTrace && !gomme;
    vis(effacer, vuB); effacer.tabIndex = vuB ? 0 : -1; effacer.classList.toggle('vu', vuB);
    if (vuB && qb3) setT(effacer, `translate(${qb3[0].toFixed(1)}px,${(qb3[1] + 14).toFixed(1)}px)`);
    if (gomme) {
      const kg = (performance.now() - gomme.t0) / gomme.d;
      if (kg >= 1) vider(); else { trace.style.opacity = (1 - sseg(kg, 0, 1)).toFixed(3); anime = true; }
    }
    if (retour) {
      /* le retour sur la règle : un arc qui descend, le crayon tourne pour se coucher, un petit rebond à la pose */
      const u = clamp((performance.now() - retour.t0) / 650), e = eDepl(u), r = regle;
      const [a0, b0] = enMain(retour.de), ar = Math.sin(Math.PI * e) * 26, reb = u > .82 ? Math.sin(Math.PI * seg(u, .82, 1)) * 3 : 0;
      const P = [lerp(a0[0], r.P[0], e), lerp(a0[1], r.P[1], e) - ar - reb], E = [lerp(b0[0], r.E[0], e), lerp(b0[1], r.E[1], e) - ar - reb];
      poserCrayon({ op: 1, H: surDeux(cP, cB, P, E), libre: true, leve: .25 * (1 - e) + .1 * Math.sin(Math.PI * e), z: 36 });
      anime = true;
      if (u >= 1) { retour = null; libre = null; }
    } else if (libre) {
      const [a, b] = enMain(libre);
      poserCrayon({ op: 1, H: surDeux(cP, cB, a, b), libre: true, leve: prise ? .7 : .25, z: 36 });
    } else poserCrayon({ op: 1, libre: true, bouton: true });
    return anime;
  }
  return { rendre, set demande(f) { demande = f; }, get etat() { return { actif, libre, prise: !!prise, tenu, retour: !!retour, aTrace, gomme: !!gomme, accord }; }, elements: { plaque, trace, ombre, crayon, effacer }, get plaquePosee() { return !!posee; }, regle, versPage };
}
