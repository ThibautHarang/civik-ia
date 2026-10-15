/* =====================================================================
   Page Atelier (maquette du 06/10/2026).
   1. L'entrée : la pièce (atelier-fond), la table et sa lampe
      (atelier-table-seule), la grande feuille posée sur la planche ; la
      lampe s'allume, la pièce prend sa lumière, la caméra avance.
   2. Le meuble à plans, dessiné à la plume : quatre tiroirs qui s'ouvrent.
   3. Les réalisations et la méthode, en croquis.
   4. La page blanche : le projet se dessine brique par brique, le
      cartouche s'écrit, le crayon est au visiteur, le croquis se
      télécharge. S1 (finitions du 07/10/2026) : la fiche de projet et le
      contact partent pour de vrai (Formspree) ; le croquis reste au visiteur.
   Première passe (06/10/2026), chaque changement porte son numéro :
   AT-1 le fil de la lampe et la nuit (AT-1 bis : le crayon de la
   planche), AT-2 les piles de fiches, AT-3 la scène de la méthode,
   AT-4 la main au crayon, AT-5 le téléphone (vérifié, peu de code).
   ===================================================================== */
import { $, $$, clamp, reduit, chargerImage, demarrer, observer, Fiche, verifierChamp, formulaireCourt, copier, AUJOURDHUI, dort, envoiReel, envoyerFiche } from '../commun/pages/pages.js';   /* S1 : envoiReel, envoyerFiche (contrat R7) */
import { Dessin, ligne, arcE, perimetre, formeMain, hachures, catmull, rng, eEntree } from '../commun/pages/plume.js';
import { ENCRE, FEUILLE, BRIQUES, TYPES, QUI, ANNOT_APP, posAnnotApp, CARTOUCHE, dessinCadre, dessinBrique, dessinQui, dessinCartouche, couleurSite, couleurMarianne, realisation, ZONES, dessinEtat, MOTS_ECOUTE, NOTES_CROQUIS, MAQUETTE, GRAPHITE, GRIS, dessinPlanche } from './croquis.js';

demarrer();
const DOSSIER = '../commun/img/c/';

/* ---------------------------------------------------------------------
   Outil : quadrilatère vers matrix3d (le rectangle w x h posé sur q)
   --------------------------------------------------------------------- */
function matrice(w, h, q) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1, g = (sx * dy2 - dx2 * sy) / den, hh = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3;
  return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${hh / h},0,0,1,0,${x0},${y0},0,1)`;
}
const bilin = (q, u, v) => { const t = [q[0][0] + (q[1][0] - q[0][0]) * u, q[0][1] + (q[1][1] - q[0][1]) * u], b = [q[3][0] + (q[2][0] - q[3][0]) * u, q[3][1] + (q[2][1] - q[3][1]) * u]; return [t[0] + (b[0] - t[0]) * v, t[1] + (b[1] - t[1]) * v]; };

/* ---------------------------------------------------------------------
   1. L'entrée
   AT-1 : le fil de la lampe. Au chargement, on vient de le tirer : il
   descend, la lampe hésite puis s'allume, il balance et s'amortit. Au
   repos, il bat d'un ou deux pixels. Tiré (clic, toucher, Entrée,
   Espace), il descend et remonte, la lampe bascule, il repart en
   balancier. Lampe éteinte : la nuit, la lune par la verrière de gauche,
   un reflet sur la feuille, « Civik-ia » qui veille.
   --------------------------------------------------------------------- */
/* la cordelette, dessinée à la taille de l'écran (tressée, une bague de laiton, une perle de bois) */
function dessinerFil(svg, L, w) {
  /* AT-8 : 14 px de cordelette au-dessus du point d'attache, dans la douille (cachés par la découpe du bouton) : tirée, elle en sort, sans trou */
  const HAUT = 14;
  const bw = Math.max(6, w * 2.7), bh = bw * 1.7, W = Math.ceil(bw + 14), H = Math.ceil(HAUT + L + bw * .42 + bh + 8), cx = W / 2;
  svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 ${-HAUT} ${W} ${H}`); svg.style.left = (-W / 2) + 'px'; svg.style.top = -HAUT + 'px';
  const x0 = cx - w / 2, yb = L - 1.2, yp = yb + bw * .42 + bh / 2 - .6;
  let brins = '';
  for (let y = 1 - HAUT, i = 0; y < L - 1.5; y += w * .95, i++) brins += `<path d="M${(x0 + .15).toFixed(2)} ${(y + w * .62).toFixed(2)}L${(x0 + w - .15).toFixed(2)} ${y.toFixed(2)}" stroke="${i % 2 ? 'rgba(40,28,16,.4)' : 'rgba(255,238,210,.34)'}" stroke-width="${Math.max(.42, w * .2).toFixed(2)}" stroke-linecap="round"/>`;
  const forme = (f) => `<rect x="${x0}" y="${-HAUT}" width="${w}" height="${L + HAUT}" rx="${w / 2}" fill="${f}"/><rect x="${cx - bw * .36}" y="${yb}" width="${bw * .72}" height="${bw * .42}" rx="1" fill="${f}"/><ellipse cx="${cx}" cy="${yp}" rx="${bw / 2}" ry="${bh / 2}" fill="${f}"/>`;
  svg.innerHTML = `<defs>
    <linearGradient id="filCorde" x1="0" x2="1"><stop offset="0" stop-color="#3a2d20"/><stop offset=".42" stop-color="#8d785b"/><stop offset=".6" stop-color="#a48d6c"/><stop offset="1" stop-color="#352819"/></linearGradient>
    <linearGradient id="filChaud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,206,140,.75)"/><stop offset=".35" stop-color="rgba(255,206,140,.18)"/><stop offset="1" stop-color="rgba(255,206,140,0)"/></linearGradient>
    <radialGradient id="filPerle" cx=".36" cy=".3" r=".78"><stop offset="0" stop-color="#d9a66a"/><stop offset=".45" stop-color="#996636"/><stop offset="1" stop-color="#4a2e15"/></radialGradient>
    <linearGradient id="filBague" x1="0" x2="1"><stop offset="0" stop-color="#5e4818"/><stop offset=".38" stop-color="#ecd38b"/><stop offset=".66" stop-color="#b08b3d"/><stop offset="1" stop-color="#523e14"/></linearGradient>
    <filter id="filFlou" x="-80%" y="-5%" width="260%" height="110%"><feGaussianBlur stdDeviation="${Math.max(.7, w * .45).toFixed(2)}"/></filter></defs>
    <g transform="translate(${(w * 1.3 + 1.6).toFixed(2)} ${(w * 1.6 + 2.4).toFixed(2)})" opacity=".32" filter="url(#filFlou)">${forme('#1c1208')}</g>
    ${forme('url(#filCorde)').replace(/url\(#filCorde\)"\/><rect([^>]*)fill="url\(#filCorde\)"/, 'url(#filCorde)"/><rect$1fill="url(#filBague)"').replace(/<ellipse([^>]*)fill="url\(#filCorde\)"/, '<ellipse$1fill="url(#filPerle)"')}
    <g>${brins}</g>
    <rect class="fil__lumiere" x="${x0}" y="0" width="${w}" height="${L}" rx="${w / 2}" fill="url(#filChaud)"/>
    <path d="M${cx - bw * .3} ${yp - bh * .18}q${bw * .3} ${-bh * .2} ${bw * .6} 0M${cx - bw * .32} ${yp + bh * .12}q${bw * .32} ${-bh * .14} ${bw * .64} 0" stroke="rgba(60,34,14,.35)" stroke-width=".6" fill="none"/>
    <ellipse cx="${cx - bw * .15}" cy="${yp - bh * .22}" rx="${bw * .12}" ry="${bh * .17}" fill="rgba(255,240,215,.5)"/>`;
  /* AT-8 : les repères des petits signes (reflet, bague, perle), lus par la feuille de style */
  const b = svg.closest('.fil');
  if (b) { b.style.setProperty('--fl', L + 'px'); b.style.setProperty('--fw', w + 'px'); b.style.setProperty('--fb', yb + 'px'); b.style.setProperty('--fbw', bw + 'px'); b.style.setProperty('--fp', yp + 'px'); b.style.setProperty('--fpw', bw + 'px'); b.style.setProperty('--fph', bh + 'px'); }
  return H - HAUT;
}
/* AT-8 : la lampe de la photo, mesurée au pixel sur atelier-table-seule (1376 x 768) ; le repère « ampoule » du manifeste
   est 16 px à droite de la vraie ampoule : l'ampoule est sur le câble (x 701,5), le fil sort à côté, à droite (x 721),
   dans l'ouverture de l'abat-jour (son bord du fond passe à y 126,7 à cet endroit) */
/* S3 : le haut de la feuille de la planche (en fraction de la planche) et la hauteur du papier qui en découle */
const FEUILLE_HAUT = .335, FEUILLE_H = Math.round(674 * (.9 - FEUILLE_HAUT) / (.9 - .14));
const LAMPE = { ampoule: [701.5 / 1376, 131.5 / 768], douille: [630 / 1376, 115 / 768, 145 / 1376, 35 / 768], fil: [721 / 1376, 126.7 / 768] };
async function entree() {
  const sec = $('[data-entree-atelier]'), fond = $('[data-fond]'), table = $('[data-table]'), feuille = $('[data-feuille-table]'), amp = $('[data-ampoule]'), cable = $('[data-cable]');
  const dessus = $('[data-table-dessus]'), eteinte = $('[data-eteinte]'), reflet = $('[data-reflet]'), soir = $('[data-soir]');
  const fil = $('[data-fil]'), balancier = $('[data-fil-balancier]'), tire = $('[data-fil-tire]'), filSvg = $('[data-fil-svg]');
  const man = await fetch(DOSSIER + 'manifeste.json').then(r => r.json()).catch(() => ({}));
  const T = man['atelier-table-seule'] || { planche: [[0.3358, 0.1016], [0.7485, 0.0651], [0.694, 0.5339], [0.2544, 0.4922]], boite: [0.1977, 0, 0.75, 0.9805], ampoule: [0.5211, 0.1583, 0.0472], cable_x: .509, abat_jour: [0.4201, 0, 0.5545, 0.1719] };
  let L = 80, filGeo = null;
  /* S4 (finitions du 07/10/2026) : le reflet franc qui court le long du fil (AT-11) est joué ici, en pixels. Ses images clés
     étaient en CSS, en var(--fl) : le compositeur de Chrome les gardait à leur valeur de repli (80 px, la longueur du fil n'étant
     posée qu'ensuite par le script) ; sur téléphone, où le fil fait une cinquantaine de pixels, le reflet descendait une
     trentaine de pixels sous la perle : un trait clair détaché, visible la nuit. Mêmes temps qu'avant (3,6 s, départ à 2,6 s,
     la même courbe entre chaque image clé), calé sur l'horloge des éclats de la bague et de la perle (CSS), qui le suivent. */
  const refletEl = $('[data-fil-reflet]');
  let animReflet = null;
  const courirReflet = (Lf) => {
    if (!refletEl || !refletEl.animate || reduit()) return;
    const c = 'cubic-bezier(.4,.05,.5,.95)', bas = `translateY(${(Lf - 12).toFixed(1)}px)`;
    const kf = [{ offset: 0, transform: 'translateY(-26px)', opacity: 0, easing: c }, { offset: .04, opacity: 1, easing: c }, { offset: .24, transform: bas, opacity: 1, easing: c }, { offset: .29, transform: bas, opacity: 0, easing: c }, { offset: 1, transform: bas, opacity: 0 }];
    if (animReflet) { animReflet.effect.setKeyframes(kf); return; }
    animReflet = refletEl.animate(kf, { duration: 3600, delay: 2600, iterations: Infinity, easing: 'linear' });
    const eclat = $('[data-fil-eclat]'), a = eclat && eclat.getAnimations ? eclat.getAnimations()[0] : null;
    if (a) a.ready.then(() => { if (animReflet && a.startTime !== null) animReflet.startTime = a.startTime; }).catch(() => {});
  };
  /* AT-8 : sans pointeur (téléphone, tablette), les signes changent un peu */
  const tactile = () => matchMedia('(hover: none)').matches;
  const invite = $('[data-fil-invite]');
  /* « tirez » se pose à droite de la perle, à la hauteur de la bague (coordonnées de la table) */
  const placerInvite = (tw, th, L, w) => { if (!invite) return; Object.assign(invite.style, { left: LAMPE.fil[0] * tw + Math.max(7, w * 3) + 'px', top: LAMPE.fil[1] * th + L - 4 + 'px' }); };
  const placer = () => {
    /* S4 (finitions du 07/10/2026) : une tablette en portrait (768 à 1099 px de large, plus haute que large) prend la composition
       du téléphone, le texte en haut et la table dessous (même règle dans page.css) : à 768, le paragraphe ne se pose plus sur la
       feuille et la pierre, et le titre a la largeur de l'écran (« logiciels » n'est plus seul sur sa ligne) */
    const W = sec.clientWidth, H = sec.clientHeight, mob = W < 768 || (W < 1100 && innerHeight >= innerWidth);
    const s = Math.max(W / 1376, H / 768), fw = 1376 * s, fh = 768 * s;
    const fx = mob ? (W - fw) * .5 : (W - fw) * .5, fy = (H - fh) * .5;
    /* stabilité (08/10/2026, nuit) : la taille du fond n'est plus écrite ici ; page.css le fait couvrir la section, centré
       (object-fit: cover), ce qui est exactement ce calcul : écrire la taille après coup décalait la mise en page de 0,77 au
       chargement (relevé du référencement). fx, fy, fw et fh restent calculés pour la lecture du code */
    void fx; void fy; void fw; void fh;
    let tw, th, tx, ty;
    const centre = (T.boite[0] + T.boite[2]) / 2;
    if (mob) {
      const bas = $('.entree__texte', sec).getBoundingClientRect().bottom - sec.getBoundingClientRect().top + 14;
      tw = Math.min(W * 1.02 / (T.boite[2] - T.boite[0]), 1376 * s * .9, (H - 16 - bas) / (.975 - .07) * 1376 / 768);
      th = tw * 768 / 1376; tx = W * .54 - centre * tw; ty = H - 16 - .975 * th;
    }
    else { tw = 1376 * s * .84; th = tw * 768 / 1376; tx = W * .7 - centre * tw; ty = H - 26 - .975 * th; }
    /* AT-1 : le calque du dessus (reflet de lune, fil) a exactement la place de la table */
    [table, dessus].forEach(t => Object.assign(t.style, { left: tx + 'px', top: ty + 'px', width: tw + 'px', height: th + 'px' }));
    /* le câble de la lampe monte jusqu'au plafond */
    Object.assign(cable.style, { left: T.cable_x * tw + 'px', top: -ty - 4 + 'px', height: ty + 6 + 'px' });
    /* l'ampoule, et le halo du plafond ; AT-1 : l'ampoule éteinte, grise, au même endroit */
    /* AT-8 : l'ampoule est centrée sur la douille (mesure au pixel), plus sur le repère du manifeste */
    const [ax, ay] = LAMPE.ampoule, r = T.ampoule[2] * tw * .8;
    Object.assign(amp.style, { left: ax * tw - r + 'px', top: ay * th - r + 'px', width: 2 * r + 'px', height: 2 * r + 'px' });
    /* AT-8 : l'ampoule éteinte et l'intérieur de l'abat-jour sont dessinés dans les coordonnées de la photo : il suffit de poser le dessin */
    const [dx, dy, dw, dh] = LAMPE.douille; Object.assign(eteinte.style, { left: dx * tw + 'px', top: dy * th + 'px', width: dw * tw + 'px', height: dh * th + 'px' });
    sec.style.setProperty('--hx', ((tx + ax * tw) / W * 100).toFixed(1) + '%'); sec.style.setProperty('--hy', ((ty + ay * th) / H * 100).toFixed(1) + '%');
    /* la grande feuille sur la planche, en vraie perspective ; AT-1 : le reflet de lune suit la même pose */
    const q = T.planche.map(([u, v]) => [u * tw, v * th]);
    /* S3 (finitions du 07/10/2026) : « Civik-ia » gravé sur la planche se lit en entier, comme dans le film (où le haut de la
       feuille est abaissé pour ne jamais cacher la gravure). La gravure descend jusqu'à 0,28 de la planche, à gauche (relevé sur
       la planche redressée) : le bord haut de la feuille passe de 0,14 à 0,335. Les côtés et le bas ne bougent pas : la feuille
       s'allonge, comme celle du film. Le papier est posé sur 931 x 501 au lieu de 931 x 674, pour garder la même échelle de
       papier qu'avant ; le dessin au crayon et le reflet de lune suivent la même pose (le dessin garde ses proportions). */
    const sq = [bilin(q, .1, FEUILLE_HAUT), bilin(q, .9, FEUILLE_HAUT), bilin(q, .92, .9), bilin(q, .08, .9)];
    const m3 = matrice(931, FEUILLE_H, sq);
    Object.assign(feuille.style, { width: '931px', height: FEUILLE_H + 'px', transform: m3 });
    reflet.style.height = FEUILLE_H + 'px';
    reflet.style.transform = m3;
    /* AT-1 : le fil part de la douille, sous le bord de l'abat-jour, à droite de l'ampoule, et descend devant la feuille */
    const w = clamp(tw * .0019, 1.8, 3.2); L = Math.round(th * .128);
    const hf = dessinerFil(filSvg, L, w);
    /* AT-8 : le fil sort de la douille à côté de l'ampoule (à droite, jamais devant) */
    Object.assign(fil.style, { left: LAMPE.fil[0] * tw + 'px', top: LAMPE.fil[1] * th + 'px', height: hf + 12 + 'px' });
    /* un ou deux pixels au bout ; AT-8 : au toucher, sans pointeur, la perle bat un peu plus */
    /* AT-11 : lampe allumée, 3,5 px au bout (4,2 au toucher) ; la nuit, 1,6 px comme avant */
    const deg = px => (px / L * 180 / Math.PI).toFixed(3) + 'deg';
    fil.style.setProperty('--air-jour', deg(tactile() ? 4.2 : 3.5)); fil.style.setProperty('--air-nuit', deg(1.6));
    filGeo = { L };
    courirReflet(L);
    placerInvite(tw, th, L, w);
    peindreSoir(W, H, { fx, fy, fw, fh }, { tx, ty, tw, th, ax, ay });
  };
  /* AT-1 : la nuit, peinte une fois par taille d'écran : l'obscurité froide ; la lampe qui se devine.
     AT-6 : la lune passe par la verrière de la photo, et par elle seule : ses quatre carreaux s'éclaircissent (le ciel de nuit),
     la nappe qu'ils projettent au sol suit leur forme (découpée par le montant et la traverse), un filet froid sur le chant du
     pilier et sur l'appui ; rien au-dessus du linteau, rien sur les poutres ni sur le mur du fond. Géométrie mesurée une fois
     sur atelier-fond (1376 x 768, en pixels de l'image), donc juste à toutes les tailles ; hors champ (téléphone), rien ne se voit. */
  /* AT-9 : repères repris au pixel sur atelier-fond (bords du vitrage relevés colonne par colonne et ligne par ligne, puis
     contrôlés par un calque superposé, ?controle=1). Le pied de la porte était relevé 21 px trop bas (l'ombre au pied de
     la porte trompait la mesure) : la nappe au sol et l'appui débordaient sous le montant. Le filet sur le chant du pilier
     est retiré : il éclairait le jambage hors du vitrage. */
  const VERRIERE = {
    carreaux: [[[0, 88], [57.5, 112], [57.5, 285.7], [0, 278.7]], [[73.5, 120.5], [135, 143.5], [135, 295.9], [73.5, 288.6]], [[0, 286.3], [57.5, 292.5], [58.5, 434.5], [0, 438.4]], [[73.5, 295], [135, 301.6], [135, 429], [73.5, 433.4]]],
    pied: x => 586 - .197 * x,              /* le pied de la porte, sur le plancher (mesuré de x 5 à x 140) */
    lune: [.74, .29],                       /* la nappe au sol : déplacement par pixel de hauteur au-dessus du pied (lune assez basse, à gauche) */
    appui: [[0, 583.5], [148, 554.3], [148, 558.3], [0, 587.5]]
  };
  const CONTROLE = new URLSearchParams(location.search).get('controle') === '1';
  function peindreSoir(W, H, F, Tb) {
    /* AT-6 : une densité d'au moins 0,75 point de canevas par pixel de la photo (les traverses restent lisibles), demi-résolution au moins */
    const s = F.fw / 1376, k = clamp(.75 / s, .5, 1);
    soir.width = Math.ceil(W * k); soir.height = Math.ceil(H * k);
    const g = soir.getContext('2d'), P = (x, y) => [x * k, y * k];
    const f = (x, y) => P(F.fx + x * s, F.fy + y * s), t = (u, v) => P(Tb.tx + u * Tb.tw, Tb.ty + v * Tb.th);
    g.fillStyle = 'rgba(6,9,16,.93)'; g.fillRect(0, 0, soir.width, soir.height);
    const forme = (pts) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); };
    /* une forme floue : l'ombre portée d'une forme posée hors du canevas (le flou de canevas n'existe pas partout) ; flou en pixels de la photo */
    const flou = (pts, a, b, mode = 'destination-out', teinte = '0,0,0') => { g.save(); g.globalCompositeOperation = mode; g.shadowColor = `rgba(${teinte},${a})`; g.shadowBlur = Math.max(.5, b * s * k); g.shadowOffsetX = 20000; g.fillStyle = '#000'; forme(pts.map(([x, y]) => [x - 20000, y])); g.fill(); g.restore(); };
    /* la lampe se devine, et la planche autour */
    const [lx, ly] = t(Tb.ax, Tb.ay), R = Tb.tw * .3 * k, rg = g.createRadialGradient(lx, ly, 0, lx, ly, R);
    rg.addColorStop(0, 'rgba(0,0,0,.4)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = rg; g.fillRect(lx - R, ly - R, 2 * R, 2 * R); g.restore();
    const V = VERRIERE, sol = ([x, y]) => { const h = V.pied(x) - y; return [x + V.lune[0] * h, V.pied(x) + V.lune[1] * h]; };
    const lune = [];
    /* les carreaux : le ciel de nuit, à peine plus clair que la pièce */
    V.carreaux.forEach(q => lune.push([q.map(p => f(...p)), .56, 1.2, '108,136,196', .32]));
    /* la nappe au sol : chaque carreau projeté ; le montant et la traverse restent dans l'ombre entre elles */
    V.carreaux.forEach(q => lune.push([q.map(p => f(...sol(p))), .36, 3.5, '70,96,158', .2]));
    /* le filet froid sur l'appui (AT-9 : plus sur le chant du pilier) */
    lune.push([V.appui.map(p => f(...p)), .3, 1.5, '90,118,180', .16]);
    lune.forEach(([pts, a, b]) => flou(pts, a, b));
    /* la teinte froide de la lune, sur ce qu'elle éclaire */
    lune.forEach(([pts, a, b, teinte, ta]) => flou(pts, ta, b, 'source-over', teinte));
    /* AT-9 : le calque de contrôle (?controle=1) : la nuit éclaircie pour voir la photo, le vitrage en rouge, sa projection au sol en cyan, le pied de la porte en jaune */
    if (CONTROLE) {
      g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, 0, soir.width, soir.height); g.restore();
      g.lineWidth = Math.max(1, k); g.lineJoin = 'round';
      V.carreaux.forEach(q => { forme(q.map(p => f(...p))); g.strokeStyle = '#ff2a2a'; g.stroke(); forme(q.map(p => f(...sol(p)))); g.strokeStyle = '#18d6ff'; g.stroke(); });
      g.beginPath(); g.moveTo(...f(0, V.pied(0))); g.lineTo(...f(148, V.pied(148))); g.strokeStyle = '#ffd400'; g.stroke();
    }
  }
  placer();
  /* AT-35 (15/10/2026, vidéo de Thibaut depuis l'application LinkedIn) : dans le navigateur d'une application (LinkedIn, et tout
     navigateur dont la barre se replie au défilement), la hauteur de la fenêtre change après l'ouverture ; 100svh suivait, la section
     changeait de hauteur, et la table était reposée à une autre taille : un va-et-vient d'agrandissement et de rétrécissement, qui
     se lit comme un bogue. Sans pointeur (téléphone, tablette), la hauteur de l'entrée est figée en pixels à la première pose, celle
     que le visiteur voit en ouvrant la page, et seule une vraie variation de largeur (rotation, fenêtre redimensionnée) repose la
     scène : une variation de hauteur seule ne fait plus rien (même règle que le film, main.js, poser). À la souris, rien ne change. */
  if (tactile()) {
    const figerHauteur = () => { sec.style.height = ''; sec.style.height = Math.round(sec.getBoundingClientRect().height) + 'px'; };
    figerHauteur();
    let largeurPosee = innerWidth;
    addEventListener('resize', () => { if (innerWidth === largeurPosee) return; largeurPosee = innerWidth; clearTimeout(placer._t); placer._t = setTimeout(() => { figerHauteur(); placer(); }, 100); });
  }
  else addEventListener('resize', () => { clearTimeout(placer._t); placer._t = setTimeout(placer, 100); });
  /* ---- AT-1 : le fil ---- */
  let allumee = false, balance = null, tirage = null;
  const balancer = (A, tau, P) => {
    if (reduit()) return;
    if (balance) balance.cancel();
    const duree = Math.round(tau * 4200), n = Math.round(duree / 1000 * 32), kf = [];
    for (let i = 0; i <= n; i++) { const t = i / n * duree / 1000; kf.push({ transform: `rotate(${(A * Math.exp(-t / tau) * Math.sin(2 * Math.PI * t / P)).toFixed(3)}deg)` }); }
    balance = balancier.animate(kf, { duration: duree, easing: 'linear' });
  };
  /* AT-13 : l'état de la lampe dit aux lecteurs d'écran (le fil est un bouton à bascule : enfoncé, la lampe est éteinte) */
  const dire = (on) => { fil.setAttribute('aria-pressed', String(!on)); fil.setAttribute('aria-label', on ? 'Éteindre la lampe' : 'Allumer la lampe'); };
  const basculer = (on) => {
    allumee = on;
    sec.classList.remove('d-emblee');   /* AT-13 : allumée d'emblée (ancre, mouvement réduit), la lampe retrouve ses animations au premier tirage */
    sec.classList.toggle('eteint', !on);
    sec.classList.toggle('rallume', on);   /* l'animation de l'ampoule repart d'elle-même : son nom change (aucune à la nuit) */
    fil.setAttribute('aria-pressed', String(!on)); fil.setAttribute('aria-label', on ? 'Éteindre la lampe' : 'Allumer la lampe');
    sec.dispatchEvent(new CustomEvent('lampe', { detail: on }));
  };
  /* tirer : le fil descend de quelques pixels et remonte ; la lampe bascule au bas du geste ; il repart en balancier */
  /* AT-13 (quatrième passe) : le premier allumage, au premier tirage du visiteur ; c'est l'allumage d'avant, tel quel : l'ampoule
     hésite puis s'allume, la lumière prend la pièce (la nuit s'efface avec le temps et la courbe du noir d'avant, classe « premier »),
     la caméra avance */
  const allumerPremier = () => {
    allumee = true;
    sec.classList.add('premier'); sec.classList.remove('eteint', 'arrivee'); sec.classList.add('allume');
    dire(true); sec.dispatchEvent(new CustomEvent('lampe', { detail: true }));
    setTimeout(() => sec.classList.remove('premier'), 2400);
  };
  const tirer = (premier) => {
    const d = Math.round(clamp(L * .09, 5, 11));
    if (reduit()) { if (premier) allumerPremier(); else basculer(!allumee); return; }
    if (tirage) tirage.finish();
    tirage = tire.animate([{ transform: 'translateY(0)' }, { offset: .42, transform: `translateY(${d}px)`, easing: 'cubic-bezier(.25,0,.2,1)' }, { offset: .78, transform: 'translateY(-1.5px)' }, { transform: 'translateY(0)' }], { duration: 440, easing: 'cubic-bezier(.4,0,.6,1)' });
    setTimeout(() => { if (premier) allumerPremier(); else basculer(!allumee); }, 185);
    setTimeout(() => balancer((Math.random() < .5 ? -1 : 1) * (premier ? 8.5 : 5.5), premier ? 1.5 : 1.15, 1.08), 300);
  };
  /* AT-13 : on arrive dans la nuit ; le premier tirage allume (le grand allumage), les suivants basculent comme avant */
  fil.addEventListener('click', () => { if (!sec.classList.contains('pret')) return; tirer(!sec.classList.contains('allume')); oublierInvite(); });
  /* ---- AT-8 : l'envie de tirer, par de petits signes qui se cumulent ----
     (a) un reflet court le long du fil et accroche la bague, toutes les quelques secondes (feuille de style) ;
     (b) le pointeur qui approche : le fil s'incline vers lui de deux ou trois degrés, la perle brille, le curseur devient une main ;
     (c) à la première visite, deux secondes après l'allumage, « tirez » s'écrit à côté de la perle ; il part au premier tirage ou
         au bout de huit secondes, et ne revient pas de la session ;
     (d) au toucher, la perle bat un peu plus au repos et « tirez » reste jusqu'au premier tirage. */
  const penche = $('[data-fil-penche]');
  let proche = false, pRaf = 0, pXY = null;
  const RAYON = 70;
  const approcher = () => {
    pRaf = 0; if (!pXY || !filGeo) return;
    const b = fil.getBoundingClientRect(), ax0 = b.left + b.width / 2, ay0 = b.top, ay1 = ay0 + filGeo.L + 10;
    const yy = clamp(pXY[1], ay0, ay1), d = Math.hypot(pXY[0] - ax0, pXY[1] - yy);
    const k = d < RAYON && !reduit() ? Math.sqrt(1 - d / RAYON) : 0, sens = pXY[0] > ax0 ? -1 : 1;
    penche.style.transform = k ? `rotate(${(sens * 2.6 * k).toFixed(2)}deg)` : '';
    if (!!k !== proche) { proche = !!k; fil.classList.toggle('proche', proche); }
  };
  sec.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return; pXY = [e.clientX, e.clientY]; if (!pRaf) pRaf = requestAnimationFrame(approcher); });
  sec.addEventListener('pointerleave', () => { pXY = [-1e4, -1e4]; if (!pRaf) pRaf = requestAnimationFrame(approcher); });
  /* AT-13 (quatrième passe) : « tirez » s'écrit à chaque arrivée dans la nuit, une seconde après l'arrivée (ou une seconde après que
     le hero revient à l'écran, si l'on arrive plus bas), et s'efface au tirage ; il ne dépend plus de la première visite ni d'un minuteur */
  let inviteT = 0, inviteAttend = false;
  const oublierInvite = () => { clearTimeout(inviteT); inviteAttend = false; if (invite && invite.classList.contains('vu')) invite.classList.add('part'); };
  const montrerInvite = () => {
    if (!invite || allumee) return;
    if (sec.classList.contains('hors-vue')) { inviteAttend = true; return; }
    invite.classList.remove('part'); invite.classList.add('vu');
  };
  /* AT-14 (quatrième passe) : plus aucune variante du nom (?nom=1, 2 et 3 sont sortis du code) : lampe allumée, les deux bleus du logo */
  /* « Civik-ia » qui veille : une copie des mots, transparente, qui porte seulement la lueur (la lueur n'est jamais coupée par le masque de l'entrée) */
  const marque = $('.marque-h1', sec);
  if (marque) {
    const lueur = document.createElement('span'); lueur.className = 'marque-h1__lueur'; lueur.setAttribute('aria-hidden', 'true');
    /* AT-10 : la lueur respire, par une enveloppe dont seule l'opacité bouge */
    const souffle = document.createElement('span'); souffle.className = 'marque-h1__souffle'; lueur.appendChild(souffle);
    $$('.w', marque).forEach(w => souffle.appendChild(w.cloneNode(true)));
    marque.appendChild(lueur);
    const caler = () => { const a = $('.w', marque).getBoundingClientRect(), b = $('.w', lueur).getBoundingClientRect(); lueur.style.left = (parseFloat(lueur.style.left || 0) + a.left - b.left) + 'px'; lueur.style.top = (parseFloat(lueur.style.top || 0) + a.top - b.top) + 'px'; };
    setTimeout(caler, 2600); addEventListener('resize', () => setTimeout(caler, 200));
  }
  /* le fil ne bat pas hors de la vue */
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { sec.classList.toggle('hors-vue', !es[0].isIntersecting); if (animReflet) { if (es[0].isIntersecting) animReflet.play(); else animReflet.pause(); } if (es[0].isIntersecting && inviteAttend) { inviteAttend = false; clearTimeout(inviteT); inviteT = setTimeout(montrerInvite, 1000); } }).observe(sec);
  dessinTable(sec);
  await Promise.all([fond, ...$$('img', table)].map(i => i.decode ? i.decode().catch(() => {}) : 0));
  /* AT-13 (quatrième passe) : plus d'allumage au chargement. On arrive dans la nuit (adresse tapée, lien d'une autre page, retour
     arrière) : la lune, la lueur de « Civik-ia », l'ampoule éteinte, le reflet de lune sur le fil ; c'est le visiteur qui allume.
     Arrivée par une ancre intérieure (le hero n'est pas vu : la cible est sous lui) et mouvement réduit : lampe allumée d'emblée,
     sans animation (classes « d-emblee » et « avancee »). */
  const cible = (() => { try { return location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null; } catch (e) { return null; } })();
  const parAncre = !!cible && !sec.contains(cible) && cible.getBoundingClientRect().top + scrollY >= sec.offsetTop + sec.offsetHeight - 2;
  if (reduit() || parAncre) {
    allumee = true; sec.classList.add('d-emblee', 'avancee', 'allume'); dire(true);
  } else {
    allumee = false; sec.classList.add('arrivee', 'eteint'); dire(false);
    inviteT = setTimeout(montrerInvite, 1000);
  }
  sec.classList.add('pret');
  setTimeout(() => sec.classList.add('posee'), reduit() ? 0 : 3200);
}

/* ---------------------------------------------------------------------
   AT-1 bis : sur la feuille de la planche, un trait de crayon dessine
   lentement un site, l'efface au bout d'une vingtaine de secondes, puis
   une application. Il s'arrête lampe éteinte (et hors de la vue).
   --------------------------------------------------------------------- */
function dessinTable(sec) {
  const svg = $('[data-dessin-table]', sec); if (!svg) return;
  const types = ['site', 'app'];
  let i = 0, D = null, u = 0, phase = 'trace', attente = 0, allume = false, vue = true, raf = 0, dernier = 0, pair = false;
  const monter = () => { svg.innerHTML = ''; svg.classList.remove('gomme'); D = new Dessin(svg, '#4b4c52'); dessinPlanche(types[i % 2], D); D.monter(); D.rendre({ p: 0 }); u = 0; phase = 'trace'; };
  if (reduit()) { monter(); D.rendre({ p: 1 }); return; }
  const DUREE = 9500, POSE = 9000;
  const boucle = t => {
    raf = 0; const dt = Math.min(64, t - (dernier || t)); dernier = t;
    if (!allume || !vue) { dernier = 0; return; }
    if (phase === 'trace') { u = Math.min(1, u + dt / DUREE); if ((pair = !pair) || u >= 1) D.rendre({ p: u }); if (u >= 1) { phase = 'pose'; attente = POSE; } }   /* un rendu sur deux : 30 par seconde suffisent à un trait lent */
    else if (phase === 'pose') { attente -= dt; if (attente <= 0) { phase = 'gomme'; svg.classList.add('gomme'); attente = 1100; } }
    else { attente -= dt; if (attente <= 0) { i++; monter(); } }
    raf = requestAnimationFrame(boucle);
  };
  const relancer = () => { if (!raf && allume && vue) { dernier = 0; raf = requestAnimationFrame(boucle); } };
  monter();
  /* la lampe allumée, le crayon reprend ; éteinte, il s'arrête où il en est */
  sec.addEventListener('lampe', e => { allume = e.detail; relancer(); });
  /* AT-13 : le crayon attend la lumière ; s'il est éteint dans la seconde et demie, il ne repart pas dans le noir */
  const allumeeVraiment = () => sec.classList.contains('allume') && !sec.classList.contains('eteint');
  new MutationObserver(() => { if (allumeeVraiment() && !allume) setTimeout(() => { if (allumeeVraiment()) { allume = true; relancer(); } }, 1600); }).observe(sec, { attributes: true, attributeFilter: ['class'] });
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { vue = es[0].isIntersecting; relancer(); }).observe(sec);
}

/* ---------------------------------------------------------------------
   2. Le meuble à plans
   --------------------------------------------------------------------- */
const DET = { wMin: .6, wMax: 2, tremble: .45, op: .88 }, FIN = { wMin: .4, wMax: 1.2, tremble: .35, op: .8 }, GROS = { wMin: .9, wMax: 2.8, tremble: .5, op: .9 };
const NS = 'http://www.w3.org/2000/svg';
function meuble() {
  const racine = $('[data-meuble]'), corps = $('.meuble__corps', racine), svg = $('[data-meuble-trait]'), tiroirs = $$('[data-tiroir]'), invite = $('[data-meuble-invite]');
  let dessins = [], dessine = false, auto = false;
  const o = (b, x) => Object.assign({}, b, { phase: 'm' }, x);
  /* AT-28 et AT-29 (sixième passe, 08/10/2026) : les objets dessinés à la plume sont pleins. Un fond sans trait (le papier du dessin,
     c'est-à-dire le crème de la page, opaque) est glissé sous les traits de chaque objet, dans l'ordre réel : le dessus de la commode d'abord, l'ombre du rouleau,
     le fond du rouleau, puis ses traits ; dans un tiroir, le fond du tiroir, ses hachures, le fond de la fiche rangée, puis ses traits.
     Les traits eux-mêmes ne changent pas (mêmes appels, mêmes graines, même encre, même tremblé, même ordre de tracé). */
  const fond = (d, couleur) => { const e = document.createElementNS(NS, 'path'); e.setAttribute('d', d); e.setAttribute('fill', couleur); return e; };
  const polyD = P => 'M' + P.map(q => q[0].toFixed(2) + ' ' + q[1].toFixed(2)).join('L') + 'Z';
  /* le papier du dessin : le crème de la page, sous le meuble (un blanc de fiche a été essayé : il changeait l'aspect du rouleau) */
  const creme = () => getComputedStyle(document.body).backgroundColor || '#f7f4ed';
  let rouleau = null;   /* AT-28 : de quoi révéler le fond du rouleau et de l'équerre au rythme de la plume (rendre) */
  const construire = () => {
    dessins = [];
    const W = corps.clientWidth, H = corps.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = '';
    const g = document.createElementNS(NS, 'g'); svg.appendChild(g);
    const D = new Dessin(g, ENCRE);
    /* le plateau, vu un peu d'en haut, avec son chant */
    D.trait([[12, 26], [24, 8], [W - 24, 8], [W - 12, 26]], o(GROS, { graine: 1 }));
    formeMain(D, perimetre(4, 26, W - 8, 22, 3), o(GROS, { graine: 2 }));
    hachures(D, perimetre(6, 30, W - 12, 16, 2), { phase: 'm', pas: 4.5, long: [14, 30], op: .32, graine: 3, angle: 0 });
    /* sur le plateau : un rouleau de plans et une équerre */
    const rx = W * .58, rw = W * .26;
    const iRouleau = D.traits.length;   /* AT-28 : le premier trait du rouleau (son fond sera glissé juste avant) */
    D.trait(arcE(rx, 8, 5, 9, Math.PI * .5, Math.PI * 2.5), o(DET, { graine: 4 }));
    D.trait([[rx, -1], [rx + rw, -3]], o(DET, { graine: 5 })); D.trait([[rx, 17], [rx + rw, 15]], o(DET, { graine: 6 }));
    D.trait(arcE(rx + rw, 6, 5, 9, -Math.PI * .5, Math.PI * .5), o(DET, { graine: 7 }));
    hachures(D, [[rx + 4, 11], [rx + rw, 9], [rx + rw, 15], [rx + 4, 17]], { phase: 'm', pas: 3, long: [10, 22], op: .45, graine: 8, angle: 2 });
    const iEquerre = D.traits.length;   /* AT-28 : l'équerre, posée elle aussi sur le plateau */
    const EQ = [[W * .14, 18], [W * .34, 6], [W * .36, 9], [W * .17, 21]];
    D.trait(EQ, o(FIN, { graine: 9 }));
    /* le corps, les montants, la plinthe et les pieds */
    formeMain(D, perimetre(14, 48, W - 28, H - 48 - 54, 2), o(GROS, { graine: 10 }));
    D.trait(ligne(22, 52, 22, H - 58), o(FIN, { graine: 11 })); D.trait(ligne(W - 22, 52, W - 22, H - 58), o(FIN, { graine: 12 }));
    hachures(D, [[W - 21, 52], [W - 15, 52], [W - 15, H - 58], [W - 21, H - 58]], { phase: 'm', pas: 3, long: [10, 20], op: .4, graine: 13, angle: 90 });
    formeMain(D, perimetre(8, H - 56, W - 16, 22, 2), o(GROS, { graine: 14 }));
    formeMain(D, perimetre(20, H - 34, 40, 26, 2), o(DET, { graine: 15 })); formeMain(D, perimetre(W - 60, H - 34, 40, 26, 2), o(DET, { graine: 16 }));
    hachures(D, perimetre(22, H - 32, 36, 22, 2), { phase: 'm', pas: 3, long: [6, 12], op: .5, graine: 17, angle: 70 });
    hachures(D, perimetre(W - 58, H - 32, 36, 22, 2), { phase: 'm', pas: 3, long: [6, 12], op: .5, graine: 18, angle: 70 });
    D.trait(ligne(-10, H - 7, W + 10, H - 6), o(FIN, { graine: 19, op: .5 }));
    hachures(D, [[0, H - 6], [W, H - 6], [W - 30, H + 6], [30, H + 6]], { phase: 'm', pas: 4, long: [14, 30], op: .22, graine: 20, angle: 0 });
    D.monter(); dessins.push(D);
    /* AT-28 : le rouleau est plein. Sous ses traits, son fond (le contour du rouleau : la demi-ellipse gauche, le corps, la demi-ellipse
       droite), au papier du dessin : le trait arrière du plateau ne le traverse plus. Sous le fond, son ombre portée légère sur le
       dessus de la commode (la lumière vient d'en haut à gauche, comme pour la plume : l'ombre tombe en bas et à droite), en hachures
       à la plume, comme les autres ombres du meuble. L'équerre, posée sur le plateau, reçoit le même fond. Fonds et ombre se révèlent
       au rythme de la plume (rendre). */
    const avantRouleau = D.traits[iRouleau].el;
    const gOmbre = document.createElementNS(NS, 'g'); D.g.insertBefore(gOmbre, avantRouleau);
    const O = new Dessin(gOmbre, ENCRE);
    hachures(O, [[rx + 3, 16.5], [rx + rw + 1, 14.5], [rx + rw + 8, 18.5], [rx + 9, 21.5]], { phase: 'mo', pas: 2.2, long: [10, 24], op: .26, graine: 21, angle: -1.5 });
    O.monter(); dessins.push(O);
    const idR = 'rouleau-clip', idE = 'equerre-clip', defs = document.createElementNS(NS, 'defs');
    defs.innerHTML = `<clipPath id="${idR}" clipPathUnits="userSpaceOnUse"><rect x="${(rx - 7).toFixed(2)}" y="-14" width="0" height="40"/></clipPath><clipPath id="${idE}" clipPathUnits="userSpaceOnUse"><rect x="${(W * .14 - 4).toFixed(2)}" y="-4" width="0" height="34"/></clipPath>`;
    svg.insertBefore(defs, svg.firstChild);
    const fondR = fond(`M${rx.toFixed(2)} -1L${(rx + rw).toFixed(2)} -3A5 9 0 0 1 ${(rx + rw).toFixed(2)} 15L${rx.toFixed(2)} 17A5 9 0 0 1 ${rx.toFixed(2)} -1Z`, creme());
    fondR.setAttribute('clip-path', `url(#${idR})`); D.g.insertBefore(fondR, avantRouleau);
    const fondE = fond(polyD(EQ), creme());
    fondE.setAttribute('clip-path', `url(#${idE})`); D.g.insertBefore(fondE, D.traits[iEquerre].el);
    const tR = D.traits.slice(iRouleau, iEquerre);
    rouleau = { D, haut: D.traits[iRouleau + 1], eq: D.traits[iEquerre], t0: tR[0].t0, t1: tR[tR.length - 1].t1, clipR: defs.querySelector(`#${idR} rect`), clipE: defs.querySelector(`#${idE} rect`), x0R: rx - 7, wR: rw + 15, x0E: W * .14 - 4, wE: W * .22 + 9 };
    /* les façades des tiroirs et leurs dedans */
    tiroirs.forEach((t, i) => {
      const face = $('.tiroir__trait', t), w = t.clientWidth, h = t.clientHeight;
      face.setAttribute('viewBox', `0 0 ${w} ${h}`); face.innerHTML = '';
      const gf = document.createElementNS(NS, 'g'); face.appendChild(gf);
      const F = new Dessin(gf, ENCRE), ph = 'f' + i, of = (b, x) => Object.assign({}, b, { phase: ph }, x);
      formeMain(F, perimetre(2, 2, w - 4, h - 4, 4), of(DET, { graine: 30 + i * 10 }));
      formeMain(F, perimetre(10, 9, w - 20, h - 18, 3), of(FIN, { graine: 31 + i * 10 }));
      /* deux poignées en coquille */
      [.14, .86].forEach((p, j) => { const cx = w * p, cy = h * .5; F.trait(arcE(cx, cy - 6, 26, 15, 0, Math.PI), of(DET, { graine: 32 + i * 10 + j })); F.trait(ligne(cx - 27, cy - 6, cx + 27, cy - 6), of(FIN, { graine: 34 + i * 10 + j })); hachures(F, arcE(cx, cy - 4, 23, 12, .2, Math.PI - .2), { phase: ph, pas: 2.4, long: [5, 10], op: .5, graine: 36 + i * 10 + j, angle: 0 }); });
      /* l'ombre sous le chant du tiroir */
      hachures(F, [[12, h - 9], [w - 12, h - 9], [w - 12, h - 5], [12, h - 5]], { phase: ph, pas: 2.2, long: [12, 26], op: .3, graine: 38 + i * 10, angle: 0 });
      F.monter(); dessins.push(F);
      const dd = $('[data-dedans]', t), dw = w * .95, dh = 60, type = t.dataset.tiroir;
      dd.setAttribute('viewBox', `0 0 ${dw} ${dh}`); dd.innerHTML = '';
      const gd = document.createElementNS(NS, 'g'); dd.appendChild(gd);
      const I = new Dessin(gd, ENCRE), od = (b, x) => Object.assign({}, b, { phase: 'd' }, x);
      const BOITE = [[0, dh], [dw * .05, 4], [dw * .95, 4], [dw, dh]];
      I.trait(BOITE, od(DET, { graine: 60 + i }));
      hachures(I, [[dw * .05 + 2, 6], [dw * .95 - 2, 6], [dw - 4, dh], [4, dh]], { phase: 'd', pas: 3.6, long: [16, 34], op: .3, graine: 61 + i, angle: 0 });
      /* les papiers rangés dedans, et ce qu'ils portent */
      const px = dw * .2, pw = dw * .6;
      const iFiche = I.traits.length, FICHE = [[px, dh], [px + 8, 14], [px + pw - 8, 14], [px + pw, dh]];
      I.trait(FICHE, od(DET, { graine: 62 + i }));
      const cx = dw / 2;
      if (type === 'site') { I.trait(perimetre(cx - 60, 22, 120, 30, 3), od(FIN, { graine: 63 })); I.trait(ligne(cx - 60, 29, cx + 60, 29), od(FIN, { graine: 64 })); I.trait(ligne(cx - 46, 38, cx + 6, 38), od(FIN, { graine: 65 })); }
      else if (type === 'app') { I.trait(perimetre(cx - 30, 20, 26, 34, 5), od(FIN, { graine: 66 })); I.trait(perimetre(cx + 6, 20, 26, 34, 5), od(FIN, { graine: 67 })); }
      else if (type === 'logiciel') { I.trait(perimetre(cx - 60, 22, 120, 30, 3), od(FIN, { graine: 68 })); I.trait(ligne(cx - 34, 22, cx - 34, 52), od(FIN, { graine: 69 })); [0, 1, 2].forEach(k => I.trait(ligne(cx - 20 + k * 22, 48, cx - 20 + k * 22, 40 - k * 4), od(DET, { graine: 70 + k }))); }
      else { I.trait(catmull([[cx - 10, 30], [cx - 8, 22], [cx + 2, 19], [cx + 10, 24], [cx + 8, 32], [cx, 37], [cx, 43]], 6), od(DET, { graine: 74, wMax: 2.2 })); I.trait(arcE(cx, 49, 2, 2, 0, Math.PI * 2.1), od(DET, { graine: 75 })); }
      I.monter(); I.rendre({ d: 1 }); dessins.push(I);
      /* AT-29 : le tiroir est un volume plein. Son fond (le dedans de la boîte, au crème de la page : le dessin ouvert ne change pas)
         est posé sous ses traits, et la fiche rangée dedans est une feuille de papier opaque : les hachures du fond du tiroir ne la
         traversent plus, l'intérieur du tiroir montre sa fiche et rien d'autre (même papier : seul ce qui passait au travers disparaît). */
      I.g.insertBefore(fond(polyD(BOITE), creme()), I.g.firstChild);
      I.g.insertBefore(fond(polyD(FICHE), creme()), I.traits[iFiche].el);
    });
  };
  const rendre = (u) => {
    const prog = { m: clamp(u / .7), d: 1 };
    tiroirs.forEach((t, i) => { prog['f' + i] = clamp((u - .25 - i * .1) / .45); });
    /* AT-28 : l'ombre du rouleau se pose pendant que la plume le dessine */
    if (rouleau) prog.mo = clamp((prog.m - rouleau.t0) / Math.max(1e-6, rouleau.t1 - rouleau.t0));
    dessins.forEach(D => D.rendre(prog));
    /* AT-28 : le fond du rouleau suit la plume sur son trait du haut (de gauche à droite) ; celui de l'équerre suit son premier côté,
       jusqu'à la pointe ; tracés, ils sont entiers */
    if (rouleau) {
      const qh = Math.max(0, rouleau.haut.q), qe = Math.max(0, rouleau.eq.q);
      rouleau.clipR.setAttribute('width', (qh >= 1 ? rouleau.wR : rouleau.wR * qh * .96).toFixed(2));
      rouleau.clipE.setAttribute('width', (rouleau.wE * clamp(qe / .54)).toFixed(2));
    }
  };
  const animer = () => {
    if (reduit()) { rendre(1); fini(); return; }
    const t0 = performance.now(), duree = 2600;
    const pas = t => { const q = clamp((t - t0) / duree); rendre(eEntree(q)); if (q < 1) requestAnimationFrame(pas); else fini(); };
    requestAnimationFrame(pas);
  };
  const fini = () => { dessine = true; racine.classList.add('dessine'); if (!auto && !$$('[aria-selected="true"]', racine).length) { auto = true; setTimeout(() => ouvrir(tiroirs[0], false), 500); } };
  /* ---- AT-16 (quatrième passe) : sur téléphone (sous 768 px), la fiche sort du tiroir lui-même ----
     Elle se place juste sous la façade du tiroir ouvert, comme une feuille qu'on tire (elle glisse hors du tiroir, révélée du haut
     vers le bas), et pousse les tiroirs suivants vers le bas de sa hauteur (ils glissent, la place leur est faite par une marge sous
     le tiroir ouvert) ; le meuble se redessine à sa nouvelle hauteur, son trait revient doucement. Ouvrir un autre tiroir referme le
     précédent (sa fiche rentre) ; la croix de la fiche ou un toucher sur le tiroir la referme. À l'ouverture par le visiteur, la page
     défile en douceur pour que le tiroir et le haut de sa fiche soient à l'écran. Sur ordinateur, rien ne change. */
  const telephone = () => matchMedia('(max-width: 767.98px)').matches;
  const panneau = x => $('#' + x.getAttribute('aria-controls'));
  /* AT-29 : l'ordre de profondeur, fixé une fois : chaque tiroir devant ceux du dessous (le premier en haut, le plus haut) ; sa fiche
     (sur téléphone) juste sous lui, devant les tiroirs du dessous ; le tiroir ouvert ne change plus de plan au clic */
  tiroirs.forEach((t, i) => { const z = 2 * (tiroirs.length - i); t.style.setProperty('--z-tiroir', String(z + 1)); const p = panneau(t); if (p) p.style.setProperty('--z-fiche', String(z)); });
  const listeTiroirs = $('.meuble__tiroirs', racine), ECART = 46 + 8;   /* la façade ouverte avance de 46 px (transform) ; la fiche part de sous elle */
  const ouvertNow = () => tiroirs.find(x => x.getAttribute('aria-selected') === 'true');
  const hautDans = x => corps.offsetTop + listeTiroirs.offsetTop + x.offsetTop;   /* la position d'un tiroir dans le meuble, sans les transform */
  const placerFiche = () => {
    const t = ouvertNow();
    tiroirs.forEach(x => { if (x !== t || !telephone()) x.style.removeProperty('--fiche-place'); });
    if (!t || !telephone()) return;
    const p = panneau(t);
    t.style.setProperty('--fiche-place', (p.offsetHeight + ECART + 16) + 'px');
    p.style.setProperty('--fiche-haut', (hautDans(t) + t.offsetHeight + ECART) + 'px');
  };
  /* les tiroirs qui ont bougé glissent de leur ancienne place à la nouvelle ; le trait du meuble, redessiné, revient doucement */
  const glisser = avant => {
    construire(); rendre(1);
    if (reduit()) return;
    tiroirs.forEach(x => { const d = avant.get(x) - x.offsetTop; if (Math.abs(d) > 1) x.animate([{ transform: `translateY(${d}px)` }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.2,.7,.25,1)' }); });
    svg.animate([{ opacity: 0 }, { opacity: 0, offset: .3 }, { opacity: 1 }], { duration: 700, easing: 'ease-out' });
  };
  const rentrer = p => { if (reduit()) { p.hidden = true; return; } p.classList.remove('entre'); p.classList.add('rentre'); setTimeout(() => { p.classList.remove('rentre'); if (!p.classList.contains('entre')) { p.hidden = true; p.style.removeProperty('--fiche-haut'); } }, 230); };
  const amener = t => {
    const nb = (() => { const n = $('.nav'); return n ? n.getBoundingClientRect().bottom : 0; })();
    const haut = racine.getBoundingClientRect().top + scrollY + hautDans(t), vueHaut = haut - scrollY, vueFiche = vueHaut + t.offsetHeight + ECART;
    if (vueHaut < nb + 4 || vueFiche + 160 > innerHeight) scrollTo({ top: haut - nb - 12, behavior: reduit() ? 'instant' : 'smooth' });
  };
  /* les onglets : un seul tiroir ouvert ; cliquer sur le tiroir ouvert le referme */
  const ouvrir = (t, focus = true) => {
    const ancien = ouvertNow(), deja = t === ancien, tel = telephone();
    const avant = new Map(tiroirs.map(x => [x, x.offsetTop]));
    tiroirs.forEach(x => { x.setAttribute('aria-selected', 'false'); x.tabIndex = -1; const p = panneau(x); if (tel && x === ancien) rentrer(p); else if (!(tel && p.classList.contains('rentre'))) p.hidden = true; });
    t.tabIndex = 0;
    if (deja) { racine.classList.remove('ouvert'); if (tel) { placerFiche(); glisser(avant); } return; }
    t.setAttribute('aria-selected', 'true');
    const p = panneau(t); p.classList.remove('rentre'); p.hidden = false; p.classList.remove('entre'); void p.offsetWidth; if (!reduit() && !tel) p.classList.add('entre');
    racine.classList.add('ouvert');
    if (tel) {
      placerFiche(); glisser(avant);
      /* AT-16 : la fiche voyage avec son tiroir (s'il remonte parce qu'un tiroir au-dessus s'est refermé) et sort de sous sa façade */
      if (!reduit()) { const d = avant.get(t) - t.offsetTop, r = getComputedStyle(p).borderTopLeftRadius; p.animate([{ transform: `translateY(${d - 26}px)`, clipPath: `inset(0 0 100% 0 round ${r})` }, { transform: 'none', clipPath: `inset(0 0 0 0 round ${r})` }], { duration: 520, easing: 'cubic-bezier(.2,.7,.25,1)' }); }
      if (focus) amener(t);
    }
    if (focus) t.focus({ preventScroll: true });
  };
  /* AT-16 : la croix de la fiche (téléphone seulement) referme le tiroir et rend le focus au tiroir */
  tiroirs.forEach(t => {
    const p = panneau(t), b = document.createElement('button');
    b.type = 'button'; b.className = 'contenu__fermer'; b.setAttribute('aria-label', 'Refermer le tiroir');
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"/></svg>';
    b.addEventListener('click', () => { if (t.getAttribute('aria-selected') === 'true') { ouvrir(t, false); t.focus({ preventScroll: true }); } });
    p.prepend(b);
  });
  tiroirs.forEach((t, i) => {
    t.addEventListener('click', () => ouvrir(t));
    t.addEventListener('keydown', e => {
      const k = e.key; let j = null;
      if (k === 'ArrowDown' || k === 'ArrowRight') j = (i + 1) % tiroirs.length; else if (k === 'ArrowUp' || k === 'ArrowLeft') j = (i - 1 + tiroirs.length) % tiroirs.length; else if (k === 'Home') j = 0; else if (k === 'End') j = tiroirs.length - 1;
      if (j !== null) { e.preventDefault(); tiroirs.forEach(x => x.tabIndex = -1); tiroirs[j].tabIndex = 0; tiroirs[j].focus(); }
    });
  });
  /* AT-30 (sixième passe) : la fiche « Logiciel sur mesure », plus longue, dépasse la hauteur du meuble à 1440 (620 px pour 594) : en
     l'ouvrant, la section grandissait et tout ce qui suit descendait de 26 px. Sur deux colonnes, la colonne des fiches prend une fois
     pour toutes la hauteur de la plus haute fiche : ouvrir un tiroir ne fait plus bouger la page (aux largeurs moyennes, où les fiches
     changeaient déjà la hauteur de la section, plus rien ne bouge non plus). Sur une colonne, rien ne change. */
  const contenus = $('.contenus', racine);
  const caler = () => {
    if (!contenus) return;
    if (matchMedia('(max-width: 900px)').matches) { contenus.style.removeProperty('min-height'); return; }
    let m = 0;
    tiroirs.forEach(t => {
      const p = panneau(t); if (!p) return;
      const cache = p.hidden;
      if (cache) { Object.assign(p.style, { visibility: 'hidden', position: 'absolute', left: '0', right: '0', top: '0' }); p.hidden = false; }
      m = Math.max(m, p.offsetHeight);
      if (cache) { p.hidden = true; Object.assign(p.style, { visibility: '', position: '', left: '', right: '', top: '' }); }
    });
    contenus.style.minHeight = Math.max(420, Math.ceil(m)) + 'px';
  };
  caler();
  construire(); rendre(0);
  if ('IntersectionObserver' in window && !reduit()) { const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); animer(); } }, { threshold: .25 }); io.observe(corps); } else animer();
  addEventListener('resize', () => { clearTimeout(meuble._t); meuble._t = setTimeout(() => { caler(); placerFiche(); construire(); rendre(dessine ? 1 : 0); }, 150); });   /* AT-16 : la fiche se replace (ou rentre dans la colonne sur ordinateur) ; AT-30 : la colonne se recale */
  if (document.fonts) document.fonts.ready.then(() => { caler(); if (ouvertNow() && telephone()) { placerFiche(); construire(); rendre(dessine ? 1 : 0); } });
}

/* ---------------------------------------------------------------------
   3. Les croquis des réalisations et de la méthode : tracés à l'entrée
   --------------------------------------------------------------------- */
function tracerVignette(canvas, fabrique, zone, couleur) {
  const D = fabrique();
  const peindre = (u) => {
    /* AT-2 : la taille de mise en page (offsetWidth), pas la boîte englobante : les fiches sont un peu tournées dans leur pile */
    const r = { width: canvas.offsetWidth, height: canvas.offsetHeight }, dpr = Math.min(2, devicePixelRatio || 1);
    if (!r.width) return;
    if (canvas.width !== Math.round(r.width * dpr) || canvas.height !== Math.round(r.height * dpr)) { canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); }
    const g = canvas.getContext('2d'), [x0, y0, x1, y1] = zone, k = Math.min(r.width / (x1 - x0), r.height / (y1 - y0)) * .9;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, canvas.width, canvas.height);
    g.setTransform(dpr * k, 0, 0, dpr * k, dpr * (r.width - (x1 - x0) * k) / 2 - x0 * dpr * k, dpr * (r.height - (y1 - y0) * k) / 2 - y0 * dpr * k);
    if (couleur && u > .6) { g.save(); g.globalAlpha = clamp((u - .6) / .4); couleur(g); g.restore(); }
    D.peindre(g, { p: u });
  };
  peindre(0);
  const lancer = () => {
    if (reduit()) { peindre(1); return; }
    const t0 = performance.now(), d = 1900;
    const pas = t => { const q = clamp((t - t0) / d); peindre(eEntree(q)); if (q < 1) requestAnimationFrame(pas); };
    requestAnimationFrame(pas);
  };
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); setTimeout(lancer, 150); } }, { threshold: .35 }); io.observe(canvas); } else lancer();
  addEventListener('resize', () => { clearTimeout(canvas._t); canvas._t = setTimeout(() => peindre(1), 200); });
}

/* ---------------------------------------------------------------------
   AT-3. Du croquis à la mise en ligne : le même site à six états.
   1 à 3 : des dessins en SVG (nets à toute taille) ; 4 à 6 : une vraie
   petite page de 1000 x 625, réduite par transform. La scène avance seule
   (2,5 s par état) quand elle est en vue ; survol, toucher ou bouton : pause.
   --------------------------------------------------------------------- */
const IMG = '../commun/img/';
const BLASON = '<svg class="vlo__blason" viewBox="0 0 40 46" aria-hidden="true"><path d="M3 3h34v20c0 11.5-7.6 18.6-17 21.6C10.6 41.6 3 34.5 3 23z" fill="#000091"/><path d="M3 3h34v7H3z" fill="#e9b04d"/><path d="M7.5 10v13c0 8.8 5.6 14.4 12.5 17 6.9-2.6 12.5-8.2 12.5-17V10" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1"/><circle cx="20" cy="20.5" r="6.2" fill="#f2c25e"/><circle cx="14.6" cy="24.6" r="4.8" fill="#f2c25e"/><circle cx="25.4" cy="24.6" r="4.8" fill="#f2c25e"/><rect x="18.7" y="25" width="2.6" height="9.5" rx="1" fill="#f2c25e"/><path d="M13 35.5h14" stroke="#f2c25e" stroke-width="1.6" stroke-linecap="round"/></svg>';
const CADENAS = '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="5.2" width="8" height="5.6" rx="1.2" fill="currentColor"/><path d="M3.8 5.4V4a2.2 2.2 0 0 1 4.4 0v1.4" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
const DOC = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5h4.2L9.5 3.8v6.7H3z" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/><path d="M4.6 6h3M4.6 8h3" stroke="currentColor" stroke-width="1"/></svg>';
function miniSite(n) {
  const el = document.createElement('div'); el.className = `vlo vlo--${n}`;
  const fil = n === 4;   /* 4 : la structure réelle, à moitié habillée ; le reste en filaire, la couleur arrive */
  let actus = [['2 octobre 2026', 'Inscriptions cantine 2026-2027'], ['28 septembre 2026', 'Travaux rue des Tilleuls'], ['21 septembre 2026', 'Le conseil municipal du 15 octobre']];
  if (n === 6) actus = [['6 octobre 2026', 'Médiathèque&nbsp;: horaires d\'hiver', 1]].concat(actus.slice(0, 2));
  const agenda = [['15', 'oct.', 'Conseil municipal', 'Jeudi, 19&nbsp;h, salle du conseil'], ['17', 'oct.', 'Marché d\'automne', 'Samedi, place de la Mairie'], ['11', 'nov.', 'Cérémonie du 11 Novembre', 'Mercredi, monument aux morts']];
  const gris = (w, h = 9) => `<i class="vlo__gris" style="width:${w}%;height:${h}px"></i>`;
  el.innerHTML = `
    <div class="vlo__barre"><i></i><i></i><i></i><span class="vlo__url">${CADENAS}${fil ? 'recette.villeneuve-les-ormes.fr' : 'www.villeneuve-les-ormes.fr'}</span></div>
    <div class="vlo__tete">${BLASON}<div class="vlo__nom"><b>Villeneuve-les-Ormes</b><small>Site officiel de la commune</small></div>
      <div class="vlo__menu"><span class="on">Accueil</span><span>Démarches</span><span>Vie locale</span><span>Agenda</span><span>Contact</span>${n === 6 ? `<span class="vlo__onglet"><img src="${IMG}glyphe-96.webp" alt="" width="14" height="14">Une question&nbsp;?</span>` : ''}</div></div>
    <div class="vlo__bandeau"><img src="${IMG}village-jour-900.webp" alt="" width="900" height="486" decoding="async" loading="lazy">${fil ? `<img class="vlo__couleur" src="${IMG}village-jour-900.webp" alt="" width="900" height="486" decoding="async" loading="lazy">` : ''}
      <div class="vlo__accueil"><b>Bienvenue à Villeneuve-les-Ormes</b>${fil ? gris(78, 8) : '<span>Toute la vie de la commune, ses démarches et son agenda</span>'}</div></div>
    <div class="vlo__corps">
      <div class="vlo__col"><h5>Actualités${fil ? '' : '<span>Tout voir</span>'}</h5>${actus.map(([d, t, neuf]) => fil ? `<div class="vlo__actu">${gris(36, 7)}${gris(84)}</div>` : `<div class="vlo__actu${neuf ? ' vlo__neuf' : ''}"><small>${d}${neuf ? '<span>Nouveau</span>' : ''}</small><b>${t}</b></div>`).join('')}</div>
      <div class="vlo__col"><h5>Agenda${fil ? '' : '<span>Tout voir</span>'}</h5>${agenda.map(([j, m, t, l]) => fil ? `<div class="vlo__ag"><span class="vlo__jour"></span><div>${gris(80)}${gris(56, 7)}</div></div>` : `<div class="vlo__ag"><span class="vlo__jour"><b>${j}</b>${m}</span><div><b>${t}</b><small>${l}</small></div></div>`).join('')}</div>
      <div class="vlo__col vlo__mairie"><h5>La mairie</h5>${fil ? `<div class="vlo__fil">${gris(70)}${gris(52)}${gris(70)}${gris(40)}</div><span class="vlo__btn vlo__btn--fil"></span>` : `<dl><dt>Lundi au vendredi</dt><dd>9&nbsp;h à 12&nbsp;h, 14&nbsp;h à 17&nbsp;h&nbsp;30</dd><dt>Samedi</dt><dd>9&nbsp;h à 12&nbsp;h</dd></dl><p>Place de la Mairie</p><span class="vlo__btn">Écrire à la mairie</span>`}</div>
    </div>
    <div class="vlo__pied">${fil ? gris(22, 8) : '<b>Mairie de Villeneuve-les-Ormes</b><span>Mentions légales</span><span>Accessibilité</span><span>Plan du site</span><i class="vlo__filet"><i></i><i></i><i></i></i>'}</div>
    ${fil ? '<div class="vlo__grille">' + '<i></i>'.repeat(12) + '</div>' : ''}
    ${n === 6 ? `<div class="vlo__chat"><div class="vlo__chat-tete"><img src="${IMG}sceau-96.webp" alt="" width="30" height="30"><div><b>Marianne</b><small>Mairie de Villeneuve-les-Ormes</small></div></div>
      <p class="vlo__q">Jusqu'à quand inscrire mon fils à la cantine&nbsp;?</p>
      <div class="vlo__r"><p>Jusqu'au vendredi 30 octobre, en mairie ou sur ce site. Prévoyez un justificatif de domicile.</p><span class="vlo__source">${DOC}Source&nbsp;: Inscriptions cantine 2026-2027</span></div></div>` : ''}`;
  return el;
}
/* les dessins 1 à 3 en SVG : les traits de la plume, les mots au crayon (révélés par une découpe qui avance), les aplats gris */
let nEtat = 0;
function svgEtat(n) {
  const svg = document.createElementNS(NS, 'svg'), id = 'e' + (++nEtat);
  svg.setAttribute('viewBox', '0 0 1000 625'); svg.setAttribute('class', 'etat-svg'); svg.setAttribute('aria-hidden', 'true');
  const defs = document.createElementNS(NS, 'defs'); svg.appendChild(defs);
  const fonds = document.createElementNS(NS, 'g'); svg.appendChild(fonds);
  if (n === 3) MAQUETTE.aplats.forEach(([x, y, w, h, r, c]) => { const e = document.createElementNS(NS, 'rect'); Object.entries({ x, y, width: w, height: h, rx: r, fill: c }).forEach(([k, v]) => e.setAttribute(k, v)); fonds.appendChild(e); });
  const D = new Dessin(svg, n === 1 ? GRAPHITE : n === 3 ? GRIS : ENCRE);
  dessinEtat(n, D); D.monter();
  const mots = [], liste = n === 1 ? MOTS_ECOUTE : n === 2 ? NOTES_CROQUIS : [];
  liste.forEach(([x, y, t, texte, rot], i) => {
    const cp = document.createElementNS(NS, 'clipPath'); cp.setAttribute('id', `${id}-${i}`); const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', x - 8); r.setAttribute('y', y - t * 1.1); r.setAttribute('height', t * 1.6); r.setAttribute('width', 0); cp.appendChild(r); defs.appendChild(cp);
    const e = document.createElementNS(NS, 'text'); e.setAttribute('x', x); e.setAttribute('y', y); e.setAttribute('clip-path', `url(#${id}-${i})`);
    e.setAttribute('transform', `rotate(${rot} ${x} ${y})`); e.setAttribute('fill', GRAPHITE); e.setAttribute('fill-opacity', n === 1 ? .88 : .62);
    e.setAttribute('style', `font:${n === 1 && i === 0 ? 600 : 500} ${t}px Caveat,cursive`); e.textContent = texte; svg.appendChild(e);
    mots.push({ r, l: texte.length * t * .52 + 16 });
  });
  const lettres = document.createElementNS(NS, 'g'); svg.appendChild(lettres);
  if (n === 3) MAQUETTE.mots.forEach(([x, y, t, gr, texte, c, police]) => { const e = document.createElementNS(NS, 'text'); e.setAttribute('x', x); e.setAttribute('y', y); e.setAttribute('fill', c); e.setAttribute('style', `font:${gr} ${t}px ${police === 'Poppins' ? 'Poppins,Inter' : 'Inter'},sans-serif;letter-spacing:${t < 12 ? '.06em' : '-.01em'}`); e.textContent = texte; lettres.appendChild(e); });
  /* u de 0 à 1 : l'ordre du dessin selon l'état */
  const rendre = u => {
    const uT = n === 1 ? clamp((u - .5) / .5) : n === 2 ? clamp(u / .82) : clamp((u - .08) / .72);
    const uM = n === 1 ? clamp(u / .62) : clamp((u - .7) / .3);
    D.rendre({ p: uT });
    mots.forEach((m, i) => { const q = clamp(uM * mots.length - i); m.r.setAttribute('width', (m.l * q).toFixed(1)); });
    if (n === 3) { fonds.style.opacity = clamp(u / .3); lettres.style.opacity = clamp((u - .5) / .4); }
  };
  rendre(0);
  return { svg, rendre };
}
/* la petite page réduite à la largeur de son cadre */
const mesureurs = new ResizeObserver(es => es.forEach(e => { const w = e.contentRect.width; if (w) e.target.style.setProperty('--k', (w / 1000).toFixed(5)); }));
function methode() {
  const scene = $('[data-scene]'), fen = $('[data-scene-fenetre]'), btns = $$('[data-vignette]'), pause = $('[data-scene-pause]');
  if (!scene) return;
  const TEXTES = $$('.methode__liste .etape').map(li => [$('h3', li).textContent.replace(/^\s*\d+\s*/, '').trim(), $('p', li).innerHTML]);
  /* AT-23 (cinquième passe) : les six textes, plus longs, sont posés l'un sur l'autre dans la légende (un seul visible) : elle a toujours
     la hauteur du plus long. Le bloc collé ne change plus de hauteur d'un état à l'autre (la hauteur où il se colle, calculée une fois,
     reste juste : sur téléphone, le texte de chaque état est entier à l'écran pendant la retenue) et, sur ordinateur, le numéro et le
     titre ne sautent plus quand le texte change de longueur */
  const texteScene = $('[data-scene-texte]');
  texteScene.innerHTML = TEXTES.map((t, i) => `<span data-t="${i + 1}">${t[1]}</span>`).join('');
  const textesScene = $$('[data-t]', texteScene);
  const etats = [], dessins = {};
  for (let n = 1; n <= 6; n++) {
    const e = document.createElement('div'); e.className = 'scene__etat'; e.dataset.etat = n;
    if (n <= 3) { const d = svgEtat(n); dessins[n] = d; e.appendChild(d.svg); } else e.appendChild(miniSite(n));
    fen.appendChild(e); etats.push(e);
  }
  mesureurs.observe(fen);
  /* les vignettes : les mêmes dessins, finis ; les mêmes pages, plus petites */
  btns.forEach(b => {
    const n = +b.dataset.vignette, v = $('[data-vignette-visuel]', b);
    if (n <= 3) { const d = svgEtat(n); d.rendre(1); v.appendChild(d.svg); } else v.appendChild(miniSite(n));
    mesureurs.observe(v);
  });
  /* AT-33 (14/10/2026, relecture de Thibaut) : recul, vrai après un défilement vers le haut, faux au premier vers le bas */
  let cur = 0, raf = 0, minuteur = 0, enVue = false, survol = false, arret = false, recul = false;
  let surEtat = () => {}, pilote = null;   /* AT-15 ter : prévenu à chaque état montré ; la ligne de temps de la piste */
  const dessiner = n => {
    cancelAnimationFrame(raf); const d = dessins[n]; if (!d) return;
    if (reduit()) { d.rendre(1); return; }
    const t0 = performance.now(), duree = n === 1 ? 1500 : 1400;
    const pas = t => { const q = clamp((t - t0) / duree); d.rendre(eEntree(q)); if (q < 1) raf = requestAnimationFrame(pas); };
    d.rendre(0); raf = requestAnimationFrame(pas);
  };
  const montrer = n => {
    if (n === cur) return; cur = n;
    etats.forEach((e, i) => e.classList.toggle('vu', i === n - 1));
    btns.forEach((b, i) => { if (i === n - 1) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    $('[data-scene-num]').textContent = n; $('[data-scene-titre]').textContent = TEXTES[n - 1][0]; textesScene.forEach((s, i) => s.classList.toggle('on', i === n - 1));   /* AT-23 */
    $$('[data-scene-progres] li').forEach((li, i) => li.classList.toggle('fait', i < n));
    scene.dataset.etat = n;
    dessiner(n);
    surEtat(n);   /* AT-15 */
  };
  const libre = () => enVue && !survol && !arret && !reduit();
  /* AT-15 bis : dans la piste, avant que le sixième n'ait été vu, la ligne de temps conduit (sa vitesse suit la position) ; ailleurs, la lecture d'avant */
  const planifier = (delai = 2500) => { clearTimeout(minuteur); if (pilote && pilote.actif()) { pilote.programmer(); return; } if (libre()) minuteur = setTimeout(() => { if (libre()) { montrer(cur % 6 + 1); planifier(); } }, delai); };
  const majPause = () => { pause.setAttribute('aria-pressed', String(arret)); $('span', pause).textContent = arret ? 'Reprendre' : 'Mettre en pause'; scene.classList.toggle('en-pause', arret || survol); };
  pause.addEventListener('click', () => { arret = !arret; majPause(); planifier(1200); });
  /* survol à la souris : pause le temps du survol ; toucher la scène : pause, ou reprise */
  fen.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { survol = true; clearTimeout(minuteur); majPause(); } });
  fen.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { survol = false; majPause(); planifier(1500); } });
  fen.addEventListener('click', e => { if (matchMedia('(hover: none)').matches) { arret = !arret; majPause(); planifier(1200); } });
  btns.forEach((b, i) => {
    /* AT-33 : une vignette choisie met fin au recul (la lecture reprend comme aujourd'hui) */
    b.addEventListener('click', () => { recul = false; montrer(i + 1); planifier(6000); });
    b.addEventListener('keydown', e => {
      let j = null; if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % 6; else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i + 5) % 6; else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = 5;
      if (j === null) return; e.preventDefault(); btns[j].focus(); recul = false; montrer(j + 1); planifier(6000);   /* AT-33 */
      btns[j].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  });
  /* AT-15 bis : mouvement réduit, ni piste ni butée, l'état 6 posé */
  if (reduit()) { pause.hidden = true; montrer(6); return; }
  montrer(1);
  new IntersectionObserver(es => { enVue = es[0].isIntersecting; if (enVue) planifier(cur === 1 ? 1800 : 2500); else clearTimeout(minuteur); }, { threshold: .45 }).observe(fen);

  /* ---------------------------------------------------------------------
     AT-15 ter (quatrième passe, 07/10/2026, après l'essai de Thibaut sur son iPhone 15 : « si on défile vite, on passe l'animation ») :
     la butée de la première version (le défilement suspendu, overflow: hidden) ne tenait pas à l'élan du doigt sur Safari iOS. Elle est
     remplacée par la technique de la section Marianne (MB-10 bis, validée par Thibaut sur l'appareil) : tant que la ligne de temps n'est
     pas arrivée au sixième état, la fin du document est posée au bas de la piste ; le navigateur s'y arrête lui-même, comme au bas d'une
     page, quel que soit le geste (doigt, élan, molette, pavé, clavier, barre de défilement), sans que la position soit jamais réécrite,
     sans rebond (overscroll-behavior: none pendant la butée) ; puis la butée se lève, 0,6 s après le sixième, et la page continue. Ici la
     coupe est posée sur <body> (overflow-y: clip et max-height) et non sur <main> comme dans la section Marianne : le pied de page est
     hors de <main>. Rien de coupé n'est jamais à l'écran (la coupe est sous le bas de la vue) et la mise en page ne change pas.
     Dans la piste, la page défile librement, la scène collée ; les six états se jouent comme une ligne de temps dont la vitesse suit le
     visiteur (AT-15 bis) : normale (2,5 s par état) s'il ne défile pas ou lit lentement, jusqu'à 4 fois plus vite (0,62 s par état au
     moins) quand sa position est en avance, à pleine vitesse à la butée ; toujours dans l'ordre, jamais sauté. Flèche de plume (AT-17).
     Jamais en remontant (la butée ne borne que le bas), jamais une seconde fois dans le même chargement (AT-31 : plus de mémoire d'un
     chargement à l'autre, comme la section Marianne : à chaque chargement, la butée est armée), jamais sur une section déjà dépassée
     (arrivée par une ancre, retour arrière), jamais en mouvement réduit ; Échap, Fin, Cmd ou Ctrl + flèche bas et le focus posé plus
     bas la lèvent ; un lien la suspend le temps de son défilement ; l'impression la lève. Une fois les six vus, la piste se resserre
     dès qu'elle est sous l'écran.
     --------------------------------------------------------------------- */
  const section = $('#methode'), piste = $('[data-piste]'), colle = $('[data-colle]'), racine = document.documentElement, corpsPage = document.body, nav = $('.nav');
  if (!section || !piste || !colle) return;
  section.classList.add('colle');
  /* les images des états 4 à 6 décodées avant que la scène n'arrive (un écran et demi avant) */
  if ('IntersectionObserver' in window) { const pre = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; pre.disconnect(); $$('img', fen).forEach(i => { i.loading = 'eager'; if (i.decode) i.decode().catch(() => {}); }); }, { rootMargin: '150% 0px' }); pre.observe(section); }
  /* AT-31 (sixième passe, 08/10/2026) : plus de clé de session (CLE_VUE retirée) ; « vu » ne vaut que pour ce chargement */
  const NORMAL = 2500, FACTEUR_MAX = 4, FIN = 600;
  /* AT-23 (cinquième passe) : ?retenue=0 coupe la butée (captures et comparaison), comme sur la section Marianne ; la piste et la ligne
     de temps restent */
  const SANS_RETENUE = new URLSearchParams(location.search).get('retenue') === '0';
  /* AT-31 : le sixième n'a jamais été vu au chargement (avant, la session s'en souvenait : un rechargement ne retenait plus) ; une fois
     vu dans ce chargement, un retour sur la section n'est plus retenu */
  let vu6 = false;
  let hautColle = 96, dernierChangement = performance.now(), finT = 0, dansPiste = false, suiteT = 0, suite = false, filetT = 0, yPrec = scrollY;   /* AT-33 : yPrec */
  const B = { actif: false, desarme: vu6, L: 0, suspendu: false, attente: 0, sonde: null };
  /* la hauteur où la scène se colle : centrée sous la barre, le bas de la scène toujours à l'écran */
  const mesurer = () => {
    const H = innerHeight, nb = nav ? nav.getBoundingClientRect().bottom : 0;
    const h = scene.getBoundingClientRect().bottom - colle.getBoundingClientRect().top;
    hautColle = Math.round(Math.min(nb + Math.max(10, (H - nb - h) / 2), H - h - 10));
    section.style.setProperty('--colle-haut', hautColle + 'px');
  };
  /* d : la scène se colle ; f : elle se décolle ; la butée est juste avant f (la scène reste collée jusqu'au bout) */
  const bornes = () => { const d = piste.getBoundingClientRect().top + scrollY - hautColle, f = d + piste.offsetHeight - colle.offsetHeight; return [d, f, f - 2]; };
  const cible = () => { const [d, , b] = bornes(); return Math.min(6, 1 + Math.floor(clamp((scrollY - d) / Math.max(1, b - d)) * 6)); };
  /* la plus petite hauteur de vue possible (sur iPhone, barres d'outils déployées) : la fin du document tombe au plus tôt là où elle doit */
  const hauteurVue = () => {
    if (!B.sonde) { B.sonde = document.createElement('i'); B.sonde.setAttribute('aria-hidden', 'true'); B.sonde.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none'; corpsPage.appendChild(B.sonde); }
    return Math.min(innerHeight, racine.clientHeight, B.sonde.offsetHeight || 1e9);
  };
  const posee = () => corpsPage.classList.contains('methode-borne');
  const enButee = () => B.actif && posee() && scrollY >= B.L - 2;
  /* poser (ou recalculer) la butée ; la lever pour la page si la section est jouée ou déjà dépassée */
  const retenir = () => {
    if (!B.actif || B.suspendu) return;
    if (vu6) { lacher(true); return; }   /* le sixième affiché, la butée se lève 0,6 s plus tard (surEtat), pas avant */
    const L = bornes()[2];
    if (scrollY > L + 2) { lacher(true); return; }
    B.L = L;
    corpsPage.style.maxHeight = Math.ceil(L + hauteurVue()) + 'px'; corpsPage.classList.add('methode-borne'); racine.classList.add('methode-borne');
  };
  const lacher = (pourLaPage) => {
    corpsPage.classList.remove('methode-borne'); corpsPage.style.maxHeight = ''; racine.classList.remove('methode-borne');
    if (pourLaPage) { B.desarme = true; B.actif = false; }
  };
  const marquerVu = () => { vu6 = true; majFleche(); };   /* AT-31 : en mémoire de la page seulement, plus dans sessionStorage */
  /* AT-17 : la flèche de plume ; vers la droite tant que la ligne de temps conduit, vers le bas quand on peut continuer (1,6 s) */
  const majFleche = () => {
    const sens = suite ? 'suite' : (!vu6 && dansPiste ? (cur === 6 ? 'suite' : 'avance') : null);
    section.classList.toggle('fleche-avance', sens === 'avance'); section.classList.toggle('fleche-suite', sens === 'suite');
  };
  const montrerSuite = () => { suite = true; clearTimeout(suiteT); majFleche(); suiteT = setTimeout(() => { suite = false; majFleche(); }, 1600); };
  /* la ligne de temps : elle conduit tant que la scène est collée (AT-33 : avant et après le sixième, et en remontant, ci-dessous) */
  /* AT-33 (14/10/2026, relecture de Thibaut) : en remontant, la scène recule avec la position, un état à la fois (6, 5, 4, 3, 2, 1), à
     l'allure de la descente (1 s par état, 0,62 s quand la position a deux états d'avance ou plus), puis reste sur l'état de la position
     tant qu'on ne bouge plus, le temps de le relire ; au-dessus de la piste, elle finit sur 1 et la page monte librement. Cause du
     défaut : la ligne de temps ne savait qu'avancer (Math.max(0, cible() - cur)) et s'éteignait une fois le sixième vu (!vu6) ; en
     remontant, la scène restait sur 6, puis la lecture en boucle repartait dès qu'elle revenait à l'écran (1, 2, 3 : elle avançait
     pendant qu'on remontait). Désormais la ligne de temps conduit dans toute la piste, avant et après le sixième (après : jusqu'à 6, sans
     butée), et hors de la piste en remontant tant que la scène est à l'écran ; en remontant, elle n'avance jamais. Rien ne change en
     descendant : le recul ne vaut qu'après un défilement vers le haut, cesse au premier vers le bas ou au choix d'une vignette, et
     jamais à la butée (son filet, les touches et les liens sont inchangés) ; la position n'est jamais réécrite. */
  pilote = {
    actif: () => !reduit() && (dansPiste || (recul && enVue)),
    programmer: () => {
      clearTimeout(minuteur);
      const c = cible();
      if (recul && !enButee()) {
        if (c < cur) minuteur = setTimeout(() => { if (recul && cible() < cur) montrer(cur - 1); planifier(); }, Math.max(0, dernierChangement + NORMAL / Math.min(FACTEUR_MAX, 1 + 1.5 * (cur - c)) - performance.now()));
        return;
      }
      if (cur >= 6) return;
      const avance = Math.max(0, cible() - cur), bout = enButee();
      if (!avance && !bout && arret) return;   /* en pause, seule la position fait avancer */
      const facteur = bout ? FACTEUR_MAX : avance ? Math.min(FACTEUR_MAX, 1 + 1.5 * avance) : 1;   /* à la butée, pleine vitesse */
      minuteur = setTimeout(() => { if (cur < 6) montrer(cur + 1); planifier(); }, Math.max(0, dernierChangement + NORMAL / facteur - performance.now()));
    }
  };
  surEtat = n => {
    dernierChangement = performance.now();
    if (n === 6 && !vu6 && (dansPiste || enVue)) { clearTimeout(finT); finT = setTimeout(() => { if (cur !== 6) return; const ici = dansPiste; marquerVu(); lacher(true); if (ici) montrerSuite(); }, FIN); }
    majFleche();
  };
  /* une fois les six vus, la piste se resserre quand elle est entièrement sous l'écran (rien ne bouge à l'écran) */
  const resserrer = () => { if (!vu6 || section.classList.contains('vue')) return; if (piste.getBoundingClientRect().top > innerHeight) section.classList.add('vue'); };
  const suivre = () => {
    const [d, f] = bornes(), y = scrollY, dedans = y >= d - 1 && y <= f + 1;
    if (dedans !== dansPiste) { dansPiste = dedans; if (!dedans) { suite = false; clearTimeout(suiteT); } majFleche(); }
    if (pilote.actif()) pilote.programmer();
    resserrer();
  };
  addEventListener('scroll', () => {
    /* AT-33 : le sens du défilement ; au premier défilement vers le bas, hors de la ligne de temps, la lecture d'avant reprend */
    const y = scrollY; if (y !== yPrec) { const r = y < yPrec; yPrec = y; if (r !== recul) { recul = r; if (!r && !pilote.actif()) planifier(); } }
    suivre();
    if (B.suspendu) { clearTimeout(B.attente); B.attente = setTimeout(reprendre, 260); return; }
    /* filet : à la butée, si plus rien n'avance pendant 2 s (une horloge en retard), la butée se lève */
    if (enButee() && cur < 6) { clearTimeout(filetT); const c = cur; filetT = setTimeout(() => { if (enButee() && cur === c) lacher(true); }, 2000); }
  }, { passive: true });
  /* un lien suspend la butée le temps de son défilement (le navigateur va où il doit), puis elle se repose selon la position */
  const reprendre = () => { B.suspendu = false; retenir(); };
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || !B.actif) return;
    lacher(false); B.suspendu = true; clearTimeout(B.attente); B.attente = setTimeout(reprendre, 450);
  }, true);
  addEventListener('keydown', e => {
    if (!B.actif) return;
    if (e.key === 'Escape' || e.key === 'End' || ((e.metaKey || e.ctrlKey) && e.key === 'ArrowDown')) { lacher(true); if (e.key === 'Escape') marquerVu(); }
  });
  /* le focus posé plus bas que la butée (tabulation) : tout est lâché, le navigateur doit pouvoir y aller */
  document.addEventListener('focusin', e => { if (!B.actif || !posee()) return; const r = e.target.getBoundingClientRect(); if (r.top + scrollY + 4 > B.L + innerHeight - 8) { lacher(true); requestAnimationFrame(() => { if (e.target.scrollIntoView) e.target.scrollIntoView({ block: 'nearest' }); }); } });
  addEventListener('beforeprint', () => lacher(false));
  addEventListener('afterprint', retenir);
  /* une mise en page qui change (largeur, polices) : tout se recalcule ; les variations de hauteur de la barre d'adresse sont ignorées */
  let vue = [innerWidth, innerHeight];
  addEventListener('resize', () => { clearTimeout(mesurer._t); mesurer._t = setTimeout(() => { if (innerWidth !== vue[0] || Math.abs(innerHeight - vue[1]) > 150) { vue = [innerWidth, innerHeight]; mesurer(); retenir(); } suivre(); }, 120); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { if (B.actif) retenir(); }).observe(piste);
  if (document.fonts) document.fonts.ready.then(() => { mesurer(); if (B.actif) retenir(); });
  mesurer(); suivre();
  /* armée après le chargement, une fois la position remise par le navigateur (retour arrière, rechargement, ancre) : quand le défilement
     est calme depuis 250 ms (1,5 s au plus), ou tout de suite au premier geste du visiteur ; jamais si la section est déjà vue */
  if (!B.desarme && !SANS_RETENUE && window.CSS && CSS.supports('overflow-y', 'clip')) {
    let calme = 0, limiteArme = 0;
    const GESTES = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    const armer = () => { if (B.actif || B.desarme) return; clearTimeout(calme); clearTimeout(limiteArme); removeEventListener('scroll', attendre); GESTES.forEach(g => removeEventListener(g, armer, true)); B.actif = true; retenir(); };
    const attendre = () => { clearTimeout(calme); calme = setTimeout(armer, 250); };
    const charge = () => { addEventListener('scroll', attendre, { passive: true }); GESTES.forEach(g => addEventListener(g, armer, { capture: true, passive: true })); attendre(); limiteArme = setTimeout(armer, 1500); };
    if (document.readyState === 'complete') charge(); else addEventListener('load', charge, { once: true });
  }
}

/* ---------------------------------------------------------------------
   AT-2. Les piles de fiches : un clic, un toucher, les flèches du clavier
   ou les deux boutons font passer la fiche suivante par-dessus, avec un
   glissé de papier (elle sort de sous la pile, puis se pose dessus).
   Tout est lu dans le HTML : une <li> de plus, une fiche de plus.
   --------------------------------------------------------------------- */
const POSES = ['translate(0px,0px) rotate(-.7deg)', 'translate(8px,6px) rotate(2.6deg)', 'translate(-7px,10px) rotate(-3.1deg)', 'translate(5px,13px) rotate(3.8deg)', 'translate(-3px,15px) rotate(-1.6deg)'];
const pose = d => POSES[Math.min(d, POSES.length - 1)];
function piles() {
  $$('[data-pile]').forEach(pile => {
    const paquet = $('[data-paquet]', pile), fiches = $$('.fiche-r', pile), n = fiches.length, cmd = $('[data-commandes]', pile), rang = $('[data-rang]', pile);
    const titre = $('.pile__titre', pile).textContent.trim();
    let ordre = fiches.map((_, i) => i), anim = null, minuteur = 0;
    const etager = () => ordre.forEach((k, d) => { fiches[k].style.zIndex = String(n - d); });
    const poser = () => ordre.forEach((k, d) => {
      const f = fiches[k]; f.style.transform = pose(d); f.style.setProperty('--sous', d ? 1 : 0);
      f.inert = d > 0; if (d) f.setAttribute('aria-hidden', 'true'); else f.removeAttribute('aria-hidden');
    });
    $('[data-total]', pile).textContent = String(n);
    poser(); etager();
    if (n < 2) { cmd.hidden = true; return; }
    paquet.tabIndex = 0;
    paquet.setAttribute('aria-label', `${titre}, ${n} fiches. Flèches gauche et droite pour passer de l'une à l'autre.`);
    const tourner = sens => {
      if (anim) { anim.cancel(); anim = null; }
      clearTimeout(minuteur); fiches.forEach(f => { f.style.transition = ''; });
      const avant = ordre.slice();
      ordre = sens > 0 ? avant.slice(1).concat(avant[0]) : [avant[n - 1]].concat(avant.slice(0, n - 1));
      const f = fiches[ordre[0]], depart = pose(avant.indexOf(ordre[0]));
      rang.textContent = String(fiches.indexOf(f) + 1);
      f.style.transition = 'none';
      poser();
      if (reduit()) { etager(); f.style.transition = ''; return; }
      /* la fiche sort de sous la pile, passe la tranche, et se pose dessus ; les autres glissent d'un cran */
      pile.classList.add('vole');
      const sx = sens > 0 ? 1 : -1, loin = paquet.clientWidth < 420 ? 46 : 60, duree = 700;
      anim = f.animate([
        { transform: depart, easing: 'cubic-bezier(.3,.05,.45,1)' },
        { offset: .46, transform: `translate(${sx * loin}%, -16px) rotate(${sx * 5.5}deg) scale(1.025)`, easing: 'cubic-bezier(.2,.75,.25,1)' },
        { transform: pose(0) }
      ], { duration: duree });
      minuteur = setTimeout(etager, duree * .46);
      const a = anim;
      a.onfinish = () => { if (anim !== a) return; anim = null; etager(); f.style.transition = ''; pile.classList.remove('vole'); };
    };
    paquet.addEventListener('click', e => { if (e.target.closest('a')) return; tourner(1); });
    paquet.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); tourner(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); tourner(-1); }
      else if ((e.key === 'Enter' || e.key === ' ') && e.target === paquet) { e.preventDefault(); tourner(1); }
    });
    $('[data-suiv]', pile).addEventListener('click', () => tourner(1));
    $('[data-prec]', pile).addEventListener('click', () => tourner(-1));
  });
}

/* ---------------------------------------------------------------------
   4. La page blanche
   --------------------------------------------------------------------- */
function pageBlanche() {
  const form = $('[data-projet]'), fig = $('[data-feuille]'), cv = $('[data-croquis-projet]'), crayon = $('[data-crayon-toile]'), desc = $('[data-croquis-desc]');
  const etapes = $$('.pas__etape', form), barre = $('[data-pas-barre]', form), etatTxt = $('[data-pas-etat]', form), retour = $('[data-pas-retour]', form), suite = $('[data-pas-suite]', form), zoneBriques = $('[data-briques]', form);
  const fiche = new Fiche($('[data-fiche]', form));
  const d = new Date();
  $('[data-fiche-date]', form).textContent = AUJOURDHUI;
  const num = `A-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 900) + 100}`;
  $('[data-fiche-num]', form).textContent = num;   /* S1 : le numéro provisoire part aussi dans l'objet du message */
  /* l'état du dessin : des pièces (un Dessin chacune) qui se tracent vers leur cible */
  const pieces = new Map(); let type = '', qui = '', raf = 0, dernier = 0;
  const textes = new Map();   /* écritures manuscrites : titre, lignes du cartouche, idée, date */
  const poserPiece = (cle, fabrique, cible = 1) => { let p = pieces.get(cle); if (!p) { p = { D: fabrique(), u: 0, cible }; pieces.set(cle, p); } p.cible = cible; demander(); return p; };
  const ecrire = (cle, texte, x, y, taille, o = {}) => { const t = textes.get(cle); if (t && t.texte === texte) return; textes.set(cle, Object.assign({ texte, x, y, taille, u: reduit() ? 1 : 0 }, o)); demander(); };
  const effacer = cle => { const t = textes.get(cle); if (t) { t.fin = true; demander(); } };
  const demander = () => { if (!raf) { dernier = performance.now(); raf = requestAnimationFrame(boucle); } };
  function boucle(t) {
    const dt = Math.min(.05, (t - dernier) / 1000); dernier = t; let encore = false;
    pieces.forEach((p, cle) => {
      if (reduit()) p.u = p.cible;
      else if (p.u < p.cible) { p.u = Math.min(p.cible, p.u + dt * (p.vite || .85)); encore = true; }
      else if (p.u > p.cible) { p.u = Math.max(p.cible, p.u - dt * 2.6); encore = true; }
      if (p.u <= 0 && p.cible === 0 && p.jeter) pieces.delete(cle);
    });
    textes.forEach((x, cle) => {
      if (x.fin) { x.u = reduit() ? 0 : x.u - dt * 3; if (x.u <= 0) textes.delete(cle); else encore = true; }
      else if (x.u < 1) { x.u = Math.min(1, x.u + dt * (x.vite || 1.4)); encore = true; }
    });
    peindre();
    raf = encore ? requestAnimationFrame(boucle) : 0;
  }
  function peindre(cible = cv, exporter = false) {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    if (!exporter && (cv.width !== Math.round(r.width * dpr) || cv.height !== Math.round(r.height * dpr))) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); crayonTaille(); }
    const g = cible.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); if (!exporter) g.clearRect(0, 0, cible.width, cible.height);
    g.setTransform(cible.width / FEUILLE.w, 0, 0, cible.height / FEUILLE.h, 0, 0);
    pieces.forEach(p => { if (p.u > 0) p.D.peindre(g, { p: eEntree(p.u) }); });
    textes.forEach(x => {
      g.save(); g.font = `${x.graisse || 500} ${x.taille}px Caveat, cursive`; g.fillStyle = ENCRE; g.globalAlpha = x.op || .9;
      const lignes = x.lignes || [x.texte], lh = x.taille * 1.08;
      const larg = Math.max(...lignes.map(l => g.measureText(l).width)), total = lignes.length;
      lignes.forEach((l, i) => {
        const q = clamp(x.u * total - i); if (q <= 0) return;
        g.save(); g.beginPath(); g.rect(x.x - 6, x.y + i * lh - x.taille, (g.measureText(l).width + 12) * q, x.taille * 1.5); g.clip();
        g.translate(x.x, x.y + i * lh); g.rotate(x.rot || 0); g.fillText(l, 0, 0); g.restore();
      });
      g.restore();
    });
  }
  /* coupe un texte manuscrit en lignes d'une largeur donnée */
  const couper = (txt, larg, taille) => { const g = cv.getContext('2d'); g.save(); g.font = `500 ${taille}px Caveat, cursive`; const mots = txt.split(/\s+/), out = []; let l = ''; mots.forEach(m => { const e = l ? l + ' ' + m : m; if (g.measureText(e).width > larg && l) { out.push(l); l = m; } else l = e; }); if (l) out.push(l); g.restore(); return out; };
  /* ---- le crayon du visiteur ---- */
  const crayonTaille = () => { const r = crayon.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); if (crayon.width === Math.round(r.width * dpr)) return; const ancien = document.createElement('canvas'); ancien.width = crayon.width; ancien.height = crayon.height; if (crayon.width) ancien.getContext('2d').drawImage(crayon, 0, 0); crayon.width = Math.round(r.width * dpr); crayon.height = Math.round(r.height * dpr); if (ancien.width) crayon.getContext('2d').drawImage(ancien, 0, 0, crayon.width, crayon.height); };
  let trace = null, aDessine = false;
  /* AT-4 : le point exact sous le pointeur, la petite rotation de la feuille défaite (la pointe de la main et le trait tombent au même endroit) */
  const pt = e => {
    const f = fig.getBoundingClientRect(), m = new DOMMatrixReadOnly(getComputedStyle(fig).transform), a = -Math.atan2(m.b, m.a);
    const dx = e.clientX - (f.left + f.width / 2), dy = e.clientY - (f.top + f.height / 2), fw = fig.offsetWidth, fh = fig.offsetHeight;
    const X = dx * Math.cos(a) - dy * Math.sin(a) + fw / 2, Y = dx * Math.sin(a) + dy * Math.cos(a) + fh / 2;
    return [(X - fw * .0381) / (fw * .9238) * crayon.width, (Y - fh * .0607) / (fh * .8786) * crayon.height];
  };
  const dedans = p => p[0] >= 0 && p[1] >= 0 && p[0] <= crayon.width && p[1] <= crayon.height;
  /* ---- AT-4 : la main au crayon ---- */
  const zone = $('[data-feuille-zone]'), main = $('[data-main]'), bouton = $('[data-crayon]');
  const POINTE = [.2275, .2305];   /* repère « pointe » de main-crayon (manifeste) */
  let mainW = 0, suivie = false, survol = false, mainRaf = 0, mainPos = null;
  const pris = () => bouton.getAttribute('aria-pressed') === 'true';
  const poserMain = (x, y, rot) => { main.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${rot}deg) translate(${(-POINTE[0] * mainW).toFixed(1)}px,${(-POINTE[1] * mainW).toFixed(1)}px)`; };
  /* posée : la pointe près du coin bas droit de la feuille, la main couchée vers le bas, sur la planche */
  const repos = () => {
    const fw = fig.offsetWidth, fh = fig.offsetHeight; if (!fw) return;
    mainW = Math.round(fw * (fw < 560 ? .56 : .5)); main.style.width = main.style.height = mainW + 'px';
    if (!suivie) poserMain(fig.offsetLeft + fw * (fw < 560 ? .76 : .845), fig.offsetTop + fh * (fw < 560 ? .9 : .875), fw < 560 ? 12 : 16);
  };
  const lacher = () => { suivie = false; main.classList.remove('suit', 'arrive'); fig.classList.remove('suit'); repos(); };
  const suivre = (e, arrivee) => {
    if (reduit()) return;
    const z = zone.getBoundingClientRect(); mainPos = [e.clientX - z.left, e.clientY - z.top];
    if (!suivie) { suivie = true; fig.classList.add('suit'); main.classList.add('suit'); if (arrivee) { main.classList.add('arrive'); setTimeout(() => main.classList.remove('arrive'), 120); } }
    if (!mainRaf) mainRaf = requestAnimationFrame(() => { mainRaf = 0; if (suivie && mainPos) poserMain(mainPos[0], mainPos[1], 0); });
  };
  const commencer = e => { crayon.setPointerCapture(e.pointerId); trace = { p: pt(e), t: performance.now() }; e.preventDefault(); suivre(e, true); };
  crayon.addEventListener('pointerdown', e => {
    /* souris et stylet : on dessine sans rien demander ; au doigt, seulement crayon pris */
    if (e.pointerType === 'touch' && !fig.classList.contains('crayon-actif')) return;
    if (e.button > 0) return;
    commencer(e);
  });
  /* le stylet sur iPad : pas de défilement quand la pointe touche la feuille */
  crayon.addEventListener('touchstart', e => { if (Array.from(e.touches).some(t => t.touchType === 'stylus')) e.preventDefault(); }, { passive: false });
  crayon.addEventListener('pointermove', e => {
    if (!trace) { if (pris() && e.pointerType === 'mouse') { survol = true; suivre(e, false); } return; }
    const p = pt(e);
    if (!dedans(p)) { lever(e); return; }   /* sortie de la feuille : le trait s'arrête, la main revient */
    const g = crayon.getContext('2d'), now = performance.now(), v = Math.hypot(p[0] - trace.p[0], p[1] - trace.p[1]) / Math.max(1, now - trace.t);
    const k = crayon.width / 900; g.strokeStyle = ENCRE; g.globalAlpha = .82; g.lineCap = 'round'; g.lineWidth = clamp(3.2 - v * .9, 1.1, 3.2) * k * 1.4;
    g.beginPath(); g.moveTo(...trace.p); g.lineTo(...p); g.stroke(); trace = { p, t: now }; aDessine = true; $('[data-effacer]').hidden = false;
    suivre(e, false);
  });
  const lever = e => {
    trace = null;
    try { if (e && crayon.hasPointerCapture(e.pointerId)) crayon.releasePointerCapture(e.pointerId); } catch (x) {}
    /* crayon pris à la souris, pointeur encore sur la feuille : la main reste sous lui */
    if (!(pris() && e && e.pointerType === 'mouse' && survol && dedans(pt(e)))) lacher();
  };
  crayon.addEventListener('pointerup', lever); crayon.addEventListener('pointercancel', lever);
  crayon.addEventListener('pointerleave', e => { survol = false; if (!trace) lacher(); });
  const basculerCrayon = on => { bouton.setAttribute('aria-pressed', String(on)); fig.classList.toggle('crayon-actif', on); $('span', bouton).textContent = on ? 'Reposer le crayon' : 'Prendre le crayon'; crayonTaille(); if (!on) lacher(); };
  bouton.addEventListener('click', () => basculerCrayon(!pris()));
  /* un clic sur la main posée, c'est aussi « prendre le crayon » */
  $('[data-prise]').addEventListener('click', () => { if (!pris()) basculerCrayon(true); });
  addEventListener('resize', () => { clearTimeout(repos._t); repos._t = setTimeout(repos, 120); });
  repos();
  if (document.fonts) document.fonts.ready.then(repos);
  $('[data-effacer]').addEventListener('click', e => { crayon.getContext('2d').clearRect(0, 0, crayon.width, crayon.height); aDessine = false; e.currentTarget.hidden = true; });
  /* ---- le téléchargement : la feuille réelle, le croquis, le dessin du visiteur ---- */
  $$('[data-telecharger]').forEach(b => b.addEventListener('click', async () => {
    const papier = $('.feuille__papier', fig), W = 1862, H = 1348, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.fillStyle = '#7a5634'; g.fillRect(0, 0, W, H);
    g.drawImage(papier, 0, 0, W, H);
    const sx = W * .0381, sy = H * .0607, sw = W * .9238, sh = H * .8786;
    const tmp = document.createElement('canvas'); tmp.width = Math.round(sw); tmp.height = Math.round(sh);
    pieces.forEach(p => p.u = p.cible); textes.forEach(x => x.u = 1); peindre(tmp, true);
    g.drawImage(tmp, sx, sy); g.drawImage(crayon, sx, sy, sw, sh);
    g.font = '600 22px Inter, sans-serif'; g.fillStyle = 'rgba(22,32,92,.5)'; g.fillText('Croquis dessiné sur civik-ia.fr, atelier', sx + 8, H - 24);
    const url = c.toDataURL('image/png'), a = document.createElement('a'); a.href = url; a.download = 'mon-projet-atelier-civik-ia.png'; document.body.appendChild(a); a.click(); a.remove();
    fiche.ecrire('croquis', 'téléchargé, gardé de votre côté');   /* S1 : le croquis ne part pas avec la fiche */
  }));
  /* ---- les choix ---- */
  const val = n => { const c = $$(`[name="${n}"]`, form).filter(x => x.checked).map(x => x.value); return c.join(', '); };
  const libBrique = k => (BRIQUES[type] || []).find(b => b[0] === k)?.[1] || k;
  const majTitre = () => { if (!type) { effacer('titre'); return; } ecrire('titre', `${TYPES[type].titre}${qui ? ', pour ' + QUI[qui].lab : ''}`, 60, 80, 42, { graisse: 600, rot: -.012 }); };
  const majCartouche = () => {
    if (!type) return;
    poserPiece('cartouche', dessinCartouche);
    const lignes = [['Projet', TYPES[type].lab.toLowerCase()], ['Pour', qui ? QUI[qui].lab : ''], ['Délai', val('delai')], ['Budget', val('budget').replace(' euros HT', ' € HT')], ['Hébergement', val('hebergement')], ['Accessibilité', val('accessibilite')]];
    /* S6 (finitions du 07/10/2026) : une espace insécable avant les deux-points de chaque ligne du cartouche */
    lignes.forEach(([l, v], i) => { if (v) ecrire('c' + i, `${l}\u00a0: ${v}`, CARTOUCHE.x, CARTOUCHE.y + i * CARTOUCHE.pas, 19.5, { op: .85 }); else effacer('c' + i); });
    ecrire('date', `dessiné le ${AUJOURDHUI}`, 760, 655, 19, { op: .7 });
  };
  const majIdee = () => { const t = ($('#p-idee').value || '').trim(); if (!t) { effacer('idee'); return; } let l = couper(`« ${t} »`, 222, 21); if (l.length > 9) { l = l.slice(0, 9); l[8] += '…'; } ecrire('idee', t, 728, 392, 21, { lignes: l, vite: 2.2, op: .85 }); };
  /* S6 (finitions du 07/10/2026) : insécable avant les deux-points du texte lu (« Feuille blanche : rien n'est encore choisi. ») */
  const majDesc = () => { desc.textContent = type ? `Croquis\u00a0: ${TYPES[type].lab.toLowerCase()}${qui ? ', pour ' + QUI[qui].lab : ''}${val('brique') ? ', avec ' + $$('[name="brique"]', form).filter(x => x.checked).map(x => libBrique(x.value).toLowerCase()).join(', ') : ''}.` : 'Feuille blanche\u00a0: rien n\'est encore choisi.'; };
  const majBriques = () => {
    const choisies = new Set($$('[name="brique"]', form).filter(x => x.checked).map(x => x.value));
    (BRIQUES[type] || []).forEach(([k]) => {
      const cle = 'b:' + type + ':' + k, on = choisies.has(k);
      if (on) poserPiece(cle, () => dessinBrique(type, k)); else if (pieces.has(cle)) pieces.get(cle).cible = 0;
      if (type === 'app') { if (on) ecrire('a:' + k, ANNOT_APP[k], ...posAnnotApp(k), 22, { op: .85, vite: 1.8 }); else effacer('a:' + k); }
    });
    demander(); majDesc();
    fiche.ecrire('briques', (BRIQUES[type] || []).filter(([k]) => choisies.has(k)).map(([, l]) => l.toLowerCase()).join(', ').replace(/^./, c => c.toUpperCase()));
  };
  const remplirBriques = () => {
    zoneBriques.innerHTML = (BRIQUES[type] || []).filter(([k]) => k !== 'marianne' || qui === 'mairie').map(([k, l]) => `<label class="puce"><input type="checkbox" name="brique" value="${k}"><span>${l}</span></label>`).join('');
  };
  const changerType = async (nouveau) => {
    if (nouveau === type) return;
    /* l'ancien dessin s'efface, le nouveau cadre se trace */
    pieces.forEach(p => { p.cible = 0; p.jeter = true; });
    textes.forEach((x, k) => { if (k !== 'date' && k !== 'idee' && !k.startsWith('c')) x.fin = true; });
    demander();
    type = nouveau;
    await dort(reduit() ? 0 : 380);
    poserPiece('cadre:' + type, () => dessinCadre(type)).vite = .6;
    if (qui) poserPiece('qui:' + type + ':' + qui, () => dessinQui(type, qui));
    remplirBriques(); majTitre(); majCartouche(); majBriques();
    if (type === 'autre') ecrire('centre', 'votre idée', 318, 420, 40, { graisse: 600, op: .8 }); else effacer('centre');
    fiche.ecrire('type', TYPES[type].lab);
  };
  const changerQui = (nouveau) => {
    pieces.forEach((p, k) => { if (k.startsWith('qui:')) { p.cible = 0; p.jeter = true; } });
    qui = nouveau;
    if (type) poserPiece('qui:' + type + ':' + qui, () => dessinQui(type, qui));
    const avant = new Set($$('[name="brique"]', form).filter(x => x.checked).map(x => x.value));
    remplirBriques(); $$('[name="brique"]', form).forEach(x => { x.checked = avant.has(x.value); });
    majTitre(); majCartouche(); majBriques();
    fiche.ecrire('qui', QUI[qui].lab.replace(/^./, c => c.toUpperCase()));
  };
  form.addEventListener('change', e => {
    const n = e.target.name;
    if (n === 'type') changerType(e.target.value);
    else if (n === 'qui') changerQui(e.target.value);
    else if (n === 'brique') majBriques();
    else if (['delai', 'budget', 'hebergement', 'accessibilite'].includes(n)) { majCartouche(); fiche.ecrire(n, val(n).replace(/^./, c => c.toUpperCase())); }
    const err = $('[data-erreur]', etapes[n_ - 1]); if (err) err.textContent = '';
  });
  let tempo = 0;
  form.addEventListener('input', e => { if (e.target.matches('textarea,input[type=text],input[type=email]')) { clearTimeout(tempo); const n = e.target.name; tempo = setTimeout(() => { if (n === 'idee') majIdee(); fiche.ecrire(n, e.target.value.trim()); }, 420); } });
  /* ---- les étapes ---- */
  let n_ = 1;
  const afficher = (k, focus = true) => {
    etapes.forEach((f, i) => { f.hidden = i !== k - 1; f.classList.toggle('entre', i === k - 1 && !reduit()); });
    n_ = k; barre.style.transform = `scaleX(${k / 5})`; etatTxt.textContent = `Étape ${k} sur 5`; retour.hidden = k === 1;
    suite.firstChild.textContent = k === 5 ? 'Envoyer mon projet ' : 'Suivant ';
    if (focus) { const l = $('legend', etapes[k - 1]); l.setAttribute('tabindex', '-1'); l.focus({ preventScroll: true }); }
  };
  const valide = () => {
    const f = etapes[n_ - 1];
    for (const g of $$('[data-requis]', f)) if (!$$('input', g).some(x => x.checked)) { $('[data-erreur]', f).textContent = g.dataset.manque; $('input', g).focus(); return false; }
    let ok = true; $$('input[required],textarea[required]', f).forEach(c => { if (!verifierChamp(c) && ok) { ok = false; c.focus(); } });
    return ok;
  };
  retour.addEventListener('click', () => afficher(Math.max(1, n_ - 1)));
  /* S1 (finitions du 07/10/2026) : la fiche de projet part pour de vrai (Formspree), par le mécanisme commun des fiches
     (commun/pages/pages.js, envoyerFiche, contrat R7) : l'objet (data-sujet, suivi du numéro provisoire), la voix « nous » et
     les textes de réussite sont des attributs du formulaire ; le texte complet de la fiche part dans le champ « fiche » ; le
     croquis ne part pas, le visiteur le garde (la réussite le lui dit). L'étape 5 et le bouton restent là jusqu'à la réussite :
     après un échec, on peut corriger son courriel et renvoyer. Site final : événement generate_lead « atelier ». */
  const texteFiche = () => fiche.texte(`Fiche de projet, atelier (civik-ia.fr), ${AUJOURDHUI}, n° provisoire ${num}`);
  /* S6 : insécable avant les deux-points (« La copie a échoué : … ») */
  $('[data-copier-fiche]', form).addEventListener('click', async () => { $('[data-copie-ok]', form).textContent = (await copier(texteFiche())) ? 'Fiche copiée.' : 'La copie a échoué\u00a0: sélectionnez la fiche à la main.'; });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.dataset.enCours) return;   /* S1 : un envoi est déjà en cours */
    if (!valide()) return;
    if (n_ < 5) { afficher(n_ + 1); return; }
    /* la fiche complète : les derniers mots tapés y sont écrits sans attendre (la frappe attend 420 ms) */
    clearTimeout(tempo); majIdee();
    ['idee', 'nom', 'structure', 'courriel'].forEach(k => fiche.ecrire(k, (form.elements[k].value || '').trim(), true));
    fiche.ecrire('croquis', aDessine ? 'dessiné par vous sur la feuille, gardé de votre côté' : 'celui de la feuille, gardé de votre côté', true);
    $('[data-fin]', form).hidden = false;
    const finir = () => { form.classList.add('fini'); etapes.forEach(f => f.hidden = true); };
    /* AT-34 (14/10/2026, Thibaut) : après la réussite, le remerciement se voit, sur téléphone comme sur ordinateur. etatEnvoi
       (pages.js) pose le focus sur le bloc d'état avant le repli des étapes : le navigateur défile jusqu'au bloc tel qu'il était,
       puis le repli (étape 5 et boutons : 559 px à 1440, 758 px à 390) le remonte au-dessus de la vue. Le repli fait, un seul
       défilement (doux, instantané en mouvement réduit) remplace celui du focus et pose le haut du bloc 16 px sous l'en-tête fixe.
       Le focus reste où etatEnvoi l'a mis (rien n'est refocalisé), aucun écouteur. Vaut avec ou sans la lettre qui part :
       envoyerFiche rend la main après la scène et etatEnvoi. */
    const montrerMerci = bloc => {
      if (!bloc || bloc.hidden) return;
      const nav = $('.nav'), nb = nav ? nav.getBoundingClientRect().bottom : 0;
      const haut = Math.max(0, Math.round(bloc.getBoundingClientRect().top + scrollY - nb - 16));
      if (Math.abs(haut - scrollY) > 1) scrollTo({ top: haut, behavior: reduit() ? 'instant' : 'smooth' });
    };
    if (!envoiReel(form)) { finir(); etatTxt.textContent = 'Projet complet'; return; }
    etatTxt.textContent = 'Envoi du projet';
    const ok = await envoyerFiche(form, { texte: texteFiche(), num, bouton: suite, bloc: $('[data-projet-envoi]', form) });
    if (ok) { finir(); etatTxt.textContent = 'Projet envoyé'; montrerMerci($('[data-projet-envoi]', form)); }   /* AT-34 */
    else if (ok === false) etatTxt.textContent = 'Projet complet';
  });

  afficher(1, false);
  /* ---- depuis le tiroir « Autre projet » : « Partir d'une page blanche » (le type choisi, le crayon pris) ----
     AT-20 (cinquième passe) : les « Demander un devis sur mesure » des trois autres tiroirs mènent au bloc de contact (#contact) et
     ne portent plus data-devis : ils ne pré-remplissent plus la page blanche */
  $$('[data-devis]').forEach(a => a.addEventListener('click', () => {
    const v = a.dataset.devis, r = $(`[name="type"][value="${v}"]`, form); if (!r) return;
    r.checked = true; changerType(v); afficher(2, false);
    if (v === 'autre') setTimeout(() => { const b = $('[data-crayon]'); if (b.getAttribute('aria-pressed') !== 'true') b.click(); }, 900);
  }));
  addEventListener('resize', () => { clearTimeout(pageBlanche._t); pageBlanche._t = setTimeout(() => peindre(), 120); });
  peindre();
  /* une invitation, la feuille vide : « une page blanche » écrite au crayon, très pâle */
  ecrire('vide', 'une page blanche', 330, 360, 46, { op: .22, graisse: 400 });
  form.addEventListener('change', () => effacer('vide'), { once: true });
  return { peindre };
}

/* ---------------------------------------------------------------------
   Lancement
   --------------------------------------------------------------------- */
entree();
meuble();
piles();   /* AT-2 */
$$('[data-croquis]').forEach(c => { const n = c.dataset.croquis; tracerVignette(c, () => realisation(n), ZONES[n], n === 'civik' ? g => couleurSite(g, 5, 4) : n === 'marianne' ? couleurMarianne : null); });
methode();   /* AT-3 (remplace les six croquis de la méthode) */
document.fonts.load('500 40px Caveat').catch(() => {}).finally(() => pageBlanche());
formulaireCourt($('[data-court]'), 'atelier');
