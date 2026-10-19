/* =====================================================================
   L'atelier (deuxième passe, 02/10/2026). La table d'architecte vue en
   entier depuis l'entrée (atelier-table), puis la même planche de près
   (atelier-planche). Tout ce qui s'y pose suit la perspective de la planche :
   le bloc à dessin, le téléphone debout sur la règle, le CV épinglé, le
   crayon dessiné couché sur la règle, la page blanche, la bulle.
   Disposition (retours, point 15), en coordonnées de la planche (u de
   gauche à droite, v de haut en bas) : téléphone u 0,115 à 0,245 debout sur
   la règle ; CV u 0,275 à 0,455, haut à v 0,37 ; idée u 0,49 à 0,89, v 0,37
   à 0,90.
   La feuille de dessin est un canevas : le papier, les dessins à la plume
   révélés par le griffonnage, le croquis du site et ses couleurs. Quand la
   page se tourne, ce canevas devient la texture de la feuille (WebGL) : tout
   ce qui est dessus part avec elle.
   ===================================================================== */
import { clamp, lerp, seg, ss, sseg, rng, hash, bruit2, fbm, eDepl, carreVers, mult3, inv3, appl, quadVersQuad, m3d, epingle, setT, setO, setV, el, DOIGT, zoneDoigt } from './outils.js';
import { reperesPx } from './visuels.js';
import { T } from './temps.js';
import { planifier, pret, ouvrier, PAUSE, LOURD } from './lavis.js';
import { TEL, liberer, plafondDpr, en_image, VUE } from './memoire.js';
import { gravureCivikia } from './provisoires/atelier.js';
import { CRAYON_MAIN } from './provisoires/papier.js';
import { dessinIdee, peindreSite, peindreApp, SITE } from './dessins.js';

/* La disposition sur la planche (quatrième passe, D9 amendé), en coordonnées de la planche (u de gauche à droite,
   v de haut en bas) : la grande feuille de dessin couvre presque toute la planche ; le téléphone réel est debout sur
   la règle, à gauche, devant la feuille ; le CV réel est cloué à travers la feuille, juste à sa droite ; la moitié
   droite est libre pour l'idée. */
export const DISPO = { tel: [.115, .245], telBas: .947, cv: [.275, .455], cvHaut: .37, idee: [.49, .89, .37, .90], crayonV: .962 };
const charger = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });

export function creerAtelier(ctx, vis, F) {
  const racine = ctx.atelier;
  const vt = vis['atelier-table'], vp = vis['atelier-planche'], vfd = vis['feuille-dessin'], vcd = vis['crayon-dessine'], vtel = vis.telephone;
  const R = n => reperesPx(vp, n);
  const Q = { planche: R('planche'), gravure: R('gravure') };
  /* J13 (dixième passe) : le quadrilatère de la planche dans la photo de la table, affiné pour la version en pierre (le
     manifeste n'est pas modifié) : redressées sur leur quadrilatère, les deux photos (table, planche de près) avaient
     encore 1 à 10 px d'écart (le mot gravé dédoublé). Le coin affiné vient d'un recalage du bois des deux plateaux
     redressés (69 morceaux comparés, homographie ajustée, écart résiduel médian 1,6 px sur 1000) : mot gravé, encrier et
     porte-plume tombent au même endroit. */
  const planT = vt.reel && /pierre/.test(vt.reperes.version || '') ? [[.3283, .098], [.7441, .075], [.6881, .5349], [.2519, .5095]].map(([x, y]) => [x * vt.w, y * vt.h]) : reperesPx(vt, 'planche');
  const graver = vp.reperes.graver !== undefined ? vp.reperes.graver : !vp.reel;
  /* L1 (douzième passe) : la pièce en deux plans. Avec atelier-fond (la pièce vide) et atelier-table-seule (la table, le
     tabouret, le panier et la lampe, détourés) au manifeste, la pièce vue par les carreaux, par la porte et à l'entrée
     n'est plus une seule photo à 3 m derrière la façade : le fond est un plan à 6 m (son mur ; son plancher est un vrai
     plan du sol, posé par une homographie), la table un plan à 3 m. Chacun grandit à sa vitesse autour du point de fuite
     de la photo : à l'approche, la table se détache du mur ; les pieds restent posés sur le plancher (la rangée du plancher
     à la profondeur de la table et la rangée des pieds sont les mêmes points du monde, elles bougent ensemble), et une
     ombre de contact dessinée sous la table la tient au sol. Sans les deux entrées : le plan unique (onzième passe). Les
     deux images ont le cadrage de atelier-table, au pixel près ; la table seule arrive détourée (fond transparent). */
  const vfo = vis['atelier-fond'], vts = vis['atelier-table-seule'];
  const DEUX = !!(vt.reel && vt.reperes.lampe && vfo && vfo.reel && vts && vts.reel && /pierre/.test(vt.reperes.version || '') && !window.__sansL1);
  const auCadrage = v => { if (v.w === vt.w && v.h === vt.h) return v.image; const c = document.createElement('canvas'); c.width = vt.w; c.height = vt.h; c.getContext('2d').drawImage(v.image, 0, 0, vt.w, vt.h); return c; };
  const srcPiece = DEUX ? auCadrage(vfo) : vt.image, srcTable = DEUX ? auCadrage(vts) : null;
  /* M9 bis (treizième passe) : la pièce vide avec son plafond (atelier-fond, version « poutres » du 05/10/2026 : re-rendue
     plutôt qu'étendue, le mur plus bas, la verrière plus large ; repères « plafond », « sol_gauche », « sol_droite »).
     PLAF2 : ses repères, ou null avec la version 1 (sans plafond dans la photo) */
  const PLAF2 = DEUX && typeof vfo.reperes.plafond === 'number' ? vfo.reperes : null;
  const mk = h => { const e = el(h); racine.appendChild(e); return e; };
  const Hpl = carreVers(Q.planche), Hpli = inv3(Hpl);
  const imgPl = (u, v) => appl(Hpl, u, v);
  Q.feuille = R('feuille');
  /* sixième passe, F8 : sur la photo de la table, la gravure « Civik-ia » descend plus bas que sur la photo de la
     planche (jusqu'à 0,33 de la planche, à gauche) ; le haut de la feuille de dessin est abaissé de 11 % de sa hauteur
     (repère « feuille » corrigé ici, le manifeste n'est pas modifié) pour ne jamais cacher la gravure, sur les deux photos */
  if (vp.reel) { const f = .11, l = (a, b) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; Q.feuille = [l(Q.feuille[0], Q.feuille[3]), l(Q.feuille[1], Q.feuille[2]), Q.feuille[2], Q.feuille[3]]; }
  const Hf = carreVers(Q.feuille), Hfi = inv3(Hf);

  /* ---- éléments ---- */
  const boite = mk('<div class="couche" style="z-index:10"></div>');
  /* Cinquième passe, E4 : la table vue par la porte. La photo est paysage, l'ouverture plutôt haute : pour couvrir
     l'ouverture sans grossir la table, la photo est prolongée vers le haut (le mur clair, étiré depuis sa première
     bande, assombri vers le plafond, avec un grain d'enduit) et d'un rien vers le bas (le plancher). Mêmes
     coordonnées que la photo : le prolongement est en y négatif. */
  /* F8 : prolongée aussi à gauche et à droite (miroir des bords : la verrière à gauche, le mur à droite), pour couvrir
     l'écran sans grossir la table d'un coup quand l'ouverture le remplit */
  const EXT = vt.reel ? { h: 430, b: 260, g: 560, d: 560 } : { h: 0, b: 0, g: 0, d: 0 };
  const LX = vt.w + EXT.g + EXT.d;
  /* la photo prolongée en largeur (un seul canevas, partagé par les deux tables) */
  /* N1 (quatorzième passe) : la photo prolongée est une source de préparation ; sur téléphone, elle rend sa mémoire quand
     la pièce est finie (tâche « mur ») et se refait si une préparation tardive la redemande (grand()) */
  const faireLarge = () => {
    /* démarrage (dixième passe) : un canevas en mémoire, lu par les tâches du mur (J6) sans relecture de la carte graphique */
    const c = document.createElement('canvas'); c.width = LX; c.height = vt.h; const g = c.getContext('2d', { willReadFrequently: true });
    const SRC = srcPiece;
    g.drawImage(SRC, EXT.g, 0);
    if (EXT.g) { g.save(); g.translate(EXT.g, 0); g.scale(-1, 1); g.drawImage(SRC, 0, 0, EXT.g, vt.h, 0, 0, EXT.g, vt.h); g.restore(); }
    if (EXT.d) { g.save(); g.translate(EXT.g + vt.w + EXT.d, 0); g.scale(-1, 1); g.drawImage(SRC, vt.w - EXT.d, 0, EXT.d, vt.h, 0, 0, EXT.d, vt.h); g.restore(); }
    /* K11 : la photo est maintenant vue en entier par le vitrage de la façade : ses prolongements en miroir montraient, aux
       carreaux d'extrémité, un bout de planche et de piètement à l'envers (et une symétrie de pierres au raccord de
       droite). À droite, le prolongement est le mur de droite de la photo (pierre et plancher, x 1060 à 1376), recopié
       deux fois sans miroir, raccords fondus sur 36 px ; à gauche, au-delà du pilier et de la verrière reflétés, le même
       mur, remonté pour que la ligne du plancher raccorde. Quelques drawImage, au démarrage. */
    if (vt.reel && vt.reperes.lampe && EXT.d >= 500) {
      const M0 = 1060, MW = vt.w - M0, F = 36;
      const poser = (sx, sy, sw, sh, dx, dy, fondu) => {
        const t = document.createElement('canvas'); t.width = sw; t.height = sh; const tg = t.getContext('2d');
        tg.drawImage(SRC, sx, sy, sw, sh, 0, 0, sw, sh);
        if (fondu) { tg.globalCompositeOperation = 'destination-in'; const gr = tg.createLinearGradient(0, 0, F, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, '#000'); tg.fillStyle = gr; tg.fillRect(0, 0, sw, sh); }
        g.drawImage(t, dx, dy);
      };
      const xd = EXT.g + vt.w;
      poser(M0, 0, MW, vt.h, xd - F, 0, true);
      poser(M0, 0, Math.min(MW, LX - (xd - F + MW) + F), vt.h, xd - F + MW - F, 0, true);
      /* L7 (douzième passe) : à gauche, la verrière continue. Le prolongement en miroir montrait un pilier et une verrière
         reflétés (un angle de pièce de trop) ; un mur de pierre collé au bord gauche de la photo coupait la verrière. La
         verrière (colonnes 0 à 50 de la photo : le verre ; 50 à 64 : le montant d'acier) est donc répétée vers la gauche,
         carreau par carreau, chaque raccord tombant sur un montant (le verre d'un carreau sur deux en miroir, pour que deux
         carreaux voisins ne montrent pas le même paysage) ; sous la verrière, le plancher, en miroir (ses lames sont presque
         horizontales : le miroir ne se voit pas) */
      /* M9 bis : avec la pièce de la version « poutres », la verrière est plus large (le verre de 0 à 58, le montant de 58 à 72) */
      const VV = PLAF2 ? 58 : 50, VM = PLAF2 ? 72 : 64, YV = Math.round(vt.h * .732);
      if (!PLAF2) for (let k = 0; EXT.g - VM * (k + 1) > -VM; k++) {
        const x0 = EXT.g - VM * (k + 1);
        if (k % 2) { g.save(); g.translate(x0 + VV, 0); g.scale(-1, 1); g.drawImage(SRC, 0, 0, VV, YV, 0, 0, VV, YV); g.restore(); }
        else g.drawImage(SRC, 0, 0, VV, YV, x0, 0, VV, YV);
        g.drawImage(SRC, VV, 0, VM - VV, YV, x0 + VV, 0, VM - VV, YV);
      }
      g.save(); g.beginPath(); g.rect(0, YV, EXT.g, vt.h - YV); g.clip(); g.translate(EXT.g, 0); g.scale(-1, 1); g.drawImage(SRC, 0, 0, EXT.g, vt.h, 0, 0, EXT.g, vt.h); g.restore();
      if (PLAF2) murGauche(g, SRC);
    }
    return c;
  };
  /* O3 (quinzième passe, 06/10/2026) : à gauche de la photo, plus aucun carreau. La photo (version « poutres ») s'arrête
     dans le verre du vantail gauche de la verrière ; ce qui est au-delà ne se voit plus en entrant (posesFond garde le bord
     gauche de l'écran dans la photo), mais il se voit encore, de loin, par les carreaux fixes de la façade, à gauche de la
     porte (0,726 à 0,736) : ces carreaux montraient les copies de la verrière, coupées en biais par la poutre. Le
     prolongement est désormais le mur lui-même, fait de la photo, en trois morceaux (coordonnées de la photo, x négatif) :
     - le montant extérieur du vantail (x -14 à 0, du haut de la verrière au plancher) : le montant extérieur du vantail
       droit (x 134 à 148), retourné, ramené à la hauteur du vantail gauche ; il ferme le verre, rien n'est coupé ;
     - le pilier de pierre (au-delà de x -14) : la pierre du pilier entre la verrière et l'angle (x 154 à 268, du bas de la
       poutre au plancher), posée colonne par colonne dans la perspective du mur de gauche (chaque colonne prend la
       colonne du pilier à la même profondeur, plus haute à mesure qu'elle vient vers nous, le pied du mur sur la droite
       qui passe par le point de fuite) ; elle se répète en miroir (le raccord tombe donc toujours sur la même pierre, sans
       bord : les rangs se continuent) ; sous la poutre, l'ombre portée ;
     - la poutre transversale du haut (y 0 à 81) : la même poutre, plus loin dans la photo (x 106 à 666), décalée de trois
       travées (666 px) : les bouts des solives qui la surmontent tombent sous les solives du plafond peint (-112, -334,
       -556), raccord fondu sur 24 px avec la photo. Une dizaine de centaines de petits tracés au démarrage (moins de
       10 ms, mesuré) */
  function murGauche(g, SRC) {
    const G = EXT.g, Fx = 794, YH = (PLAF2.horizon || .47) * vt.h, XS = 14;
    /* le pilier : ses colonnes et ses lignes (le bas de la poutre de gauche, relevé sur la photo, et le pied du mur) */
    /* les pierres d'angle du pilier (x 147 à 200 : pierre de taille claire, à côté du montant), puis le moellon : celui du mur
       du fond (x 290 à 640, y 252 à 545, la même pierre, loin de la lampe), sans répétition */
    const QA = 147, QB = 200, haut = x => 145 + .55 * (x - 150) + 7, SB = 553, MA = 290, MB = 640, M0 = 252, M1 = 545;
    /* le pied du mur de gauche : la droite du point de fuite au bas du vantail (x 0, y 578) */
    const pied = x => 578 + (578 - YH) / Fx * -x, Y0 = 81;
    /* de la verrière vers la gauche, la pierre avance dans sa source au pas de son agrandissement vertical (les pierres
       gardent leurs proportions et grandissent en venant vers nous) */
    /* (une colonne de l'écran à la fois, prise sur une colonne entière de la photo : un rectangle source fractionnaire est
       arrondi par les navigateurs, d'où des stries) */
    let u = 0, v = 0;
    for (let xd = G - XS - 1; xd >= 0; xd--) {
      const x = xd + .5 - G, d1 = pied(x);
      if (u < QB - QA) {
        const xs = Math.floor(QA + u), s0 = haut(xs), sc = (d1 - Y0) / (SB - s0);
        g.drawImage(SRC, xs, s0, 1, SB - s0, xd, Y0, 1, d1 - Y0); u += 1 / sc;
      } else {
        const sc = (d1 - Y0) / (M1 - M0), xs = Math.floor(Math.min(MB - 1, MA + v));
        g.drawImage(SRC, xs, M0, 1, M1 - M0, xd, Y0, 1, d1 - Y0); v += 1 / sc;
      }
    }
    /* plus loin de la lampe : un peu plus sombre vers la gauche */
    const om = g.createLinearGradient(0, 0, G - XS, 0); om.addColorStop(0, 'rgba(20,14,8,.32)'); om.addColorStop(1, 'rgba(20,14,8,0)');
    g.fillStyle = om; g.fillRect(0, Y0, G - XS, pied(-G) - Y0);
    /* le montant extérieur du vantail gauche : celui du vantail droit, retourné */
    g.save(); g.translate(G, 0); g.scale(-1, 1); g.drawImage(SRC, 134, 146, XS, 414, 0, 76, XS, 504); g.restore();
    /* l'ombre de la poutre sur le mur, et le pied du mur dans l'ombre */
    const o = g.createLinearGradient(0, Y0, 0, Y0 + 16); o.addColorStop(0, 'rgba(26,18,10,.55)'); o.addColorStop(1, 'rgba(26,18,10,0)');
    g.fillStyle = o; g.fillRect(0, Y0, G - XS, 16);
    /* la poutre transversale, trois travées plus loin, raccordée en fondu sur 24 px */
    const b = document.createElement('canvas'); b.width = G + 24; b.height = Y0; const bg = b.getContext('2d');
    bg.drawImage(SRC, 106, 0, G + 24 - 4, Y0, 0, 0, G + 24 - 4, Y0);
    bg.drawImage(SRC, 106 + G + 20, 0, 4, Y0, G + 20, 0, 4, Y0);
    bg.globalCompositeOperation = 'destination-in';
    const f = bg.createLinearGradient(G - 4, 0, G + 20, 0); f.addColorStop(0, '#000'); f.addColorStop(1, 'rgba(0,0,0,0)');
    bg.fillStyle = f; bg.fillRect(0, 0, G + 24, Y0);
    g.drawImage(b, 0, 0); liberer(b);
  }
  let large = faireLarge();
  const grand = () => (large.width ? large : (large = faireLarge()));
  /* J2 et J3 (dixième passe) : la photo de la pièce en pierre porte déjà la lampe allumée, coupée par son bord haut
     (repère « lampe » du manifeste). Le haut de la pièce n'est donc plus un enduit étiré (il aurait étiré la lampe en
     colonne) : c'est le mur de moellons de la photo, prolongé vers le plafond (rangées de pierre reprises plus haut, sans
     la planche, raccord en miroir sur la photo, plus sombre en montant, au-dessus d'un abat-jour), et la lampe détourée
     (lampe-atelier) y achève celle de la photo : son abat-jour, sa douille de laiton, son câble jusqu'au plafond. */
  const vl = vis['lampe-atelier'], lampeT = vt.reel && vt.reperes.lampe ? vt.reperes.lampe : null;
  const plC0 = [planT.reduce((a, p) => a + p[0], 0) / 4, planT.reduce((a, p) => a + p[1], 0) / 4], plL0 = Math.hypot(planT[1][0] - planT[0][0], planT[1][1] - planT[0][1]);
  /* la lampe de la photo, en pixels de la photo : centre et largeur de son abat-jour */
  const LAMPE_T = lampeT ? { x: (lampeT[0] + lampeT[2]) / 2 * vt.w, l: (lampeT[2] - lampeT[0]) * vt.w, b: vt.reperes.ampoule ? vt.reperes.ampoule : null } : null;
  /* K11 (onzième passe) : avec la photo de la table en pierre (sa lampe, notre table), c'est elle la pièce vue de dehors,
     dès que la façade est dans le cadre, par les carreaux et par la porte ; la pièce de la photo de façade n'est plus
     jamais montrée, et le fondu de J3 bis disparaît */
  const K11 = !!(vt.reel && LAMPE_T);
  /* L1 : en deux plans, la lampe est celle de la table seule : elle pend plus bas (l'abat-jour entier est dans l'image,
     son bas à abat_jour[3]) ; ampoule [x, y, rayon] ; cable_x, l'abscisse du câble */
  const LAMPE2 = DEUX ? (() => { const r = vts.reperes, a = r.abat_jour || [.42, 0, .555, .172]; return { x: (a[0] + a[2]) / 2 * vt.w, l: (a[2] - a[0]) * vt.w, haut: a[1] * vt.h, bas: a[3] * vt.h, b: r.ampoule || [(a[0] + a[2]) / 2, a[3] * .92, .04], cable: (r.cable_x !== undefined ? r.cable_x : (a[0] + a[2]) / 2) * vt.w }; })() : null;
  if (K11 && F.monde && F.monde.fac && F.monde.fac.k11) F.monde.fac.k11.actif = true;
  /* J6 (dixième passe) : le mur au-dessus de la photo, sans couture. Il est fait avec la pierre de la photo elle-même, à
     sa propre échelle colonne par colonne : la bande de mur au-dessus de la planche (rangées 0 à 44 de la photo, la
     lampe effacée), dont on a retiré l'éclairage (la moyenne lissée de chaque colonne), est empilée vers le plafond,
     chaque rangée décalée horizontalement de 60 à 170 px (petits décalages : la taille des pierres ne change pas). Les
     rangées se recouvrent sur 18 px et la limite entre deux rangées, comme entre la première rangée et la photo, est la
     découpe de moindre écart (programmation dynamique, la méthode du « quilting » de texture) : elle serpente le long des
     joints, là où les deux pierres se ressemblent le plus, jamais en ligne droite, avec un fondu de 3 px. Puis la
     lumière : celle de la photo au raccord (chaude près de la lampe), qui s'éteint en montant (l'abat-jour rabat la
     lumière vers la table), plus froid et plus sombre vers le plafond. HAUT déborde de OV px sur le haut de la photo
     (la première découpe passe dans la photo). */
  const OV = 18;
  /* L1 : la géométrie des deux plans, en pixels de la photo. ys : la ligne du sol au pied du mur du fond (repère « sol »
     de atelier-fond : une fraction de la hauteur, ou une ligne brisée de points [x, y] lue à l'aplomb de la planche) ;
     yf : la rangée des pieds (repère « pieds » de atelier-table-seule : un point ou plusieurs, leur moyenne) ; Fx : la
     verticale du point de fuite (repère « fuite » de atelier-fond, son abscisse ; sinon le milieu de la planche). La
     hauteur de l'horizon se déduit de ys, yf et de la profondeur (les deux plans sont à 3 m l'un de l'autre) */
  const P2 = (() => {
    if (!DEUX) return null;
    const rf = vfo.reperes, rt = vts.reperes, xc = plC0Photo()[0];
    let ys = .745 * vt.h;
    if (typeof rf.sol === 'number') ys = rf.sol * vt.h;
    else if (Array.isArray(rf.sol) && rf.sol.length > 1) { const pts = rf.sol.map(([x, y]) => [x * vt.w, y * vt.h]).sort((a, b) => a[0] - b[0]); ys = pts[pts.length - 1][1]; for (let i = 1; i < pts.length; i++) if (xc <= pts[i][0]) { const [a, b] = [pts[i - 1], pts[i]], t = clamp((xc - a[0]) / Math.max(1, b[0] - a[0])); ys = a[1] + (b[1] - a[1]) * t; break; } }
    const pieds = Array.isArray(rt.pieds) ? (Array.isArray(rt.pieds[0]) ? rt.pieds : [rt.pieds]) : null;
    const yf = pieds ? pieds.reduce((a, p) => a + p[1], 0) / pieds.length * vt.h : 700 / 768 * vt.h;
    const Fx = Array.isArray(rf.fuite) ? rf.fuite[0] * vt.w : xc;
    const b = Array.isArray(rt.boite) ? rt.boite : null;
    return { ys: Math.min(ys, yf - 20), yf, Fx, pieds: pieds ? pieds.map(([x, y]) => [x * vt.w, y * vt.h]) : null, boite: b };
  })();
  function plC0Photo() { return [planT.reduce((a, p) => a + p[0], 0) / 4, planT.reduce((a, p) => a + p[1], 0) / 4]; }
  /* K2 (onzième passe) : le mur ajouté moins régulier. La pierre source est le grand mur de moellons à droite de la photo
     de la table (x 1045 à 1370, y 4 à 540 de la photo : la même pierre, à la même échelle, sans objet devant), dont on
     retire l'éclairage (divisée par sa moyenne locale, lissée sur 50 px). On y prend de grands morceaux (128 x 96 px,
     recouvrement 28 et 24 px), à des endroits tirés au hasard, à une échelle de 0,92 à 1,08 (deux morceaux à 1,25 : une
     ou deux pierres plus grandes), un sur cinq retourné de 180 degrés, chacun avec son ton (plus ou moins 5 %, quelques
     uns 12 % plus sombres : des pierres plus sombres) ; parmi 24 tirages, celui qui raccorde le mieux à ce qui est déjà
     posé (à gauche et en dessous, la photo pour la première rangée) ; les limites sont des découpes de moindre écart qui
     suivent les joints, fondues sur 3 px. La lumière est celle de J6 (lit). Le cœur est partagé par le haut de la pièce
     et par la pierre du petit écran. */
  let SRC_K2 = null;
  function* sourcePierreK2() {
    if (SRC_K2) return SRC_K2;
    /* M9 bis : avec la pièce de la version « poutres », le haut de la photo est le plafond : la pierre de droite commence
       sous la poutre du haut du mur (repère « plafond »), et s'arrête au-dessus du sol de droite */
    const x0 = EXT.g + 1045, y0 = PLAF2 ? Math.round(PLAF2.plafond * vt.h) + 30 : 4, w = 325, h = PLAF2 ? Math.max(120, Math.round((PLAF2.sol_droite || PLAF2.sol) * vt.h) - 24 - y0) : 536;
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(grand(), x0, y0, w, h, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    yield;
    /* la lumière : moyennes par blocs de 10 px, lissées (gaussienne de 5 blocs), interpolées */
    const BS = 10, gw = Math.ceil(w / BS), gh = Math.ceil(h / BS), G = new Float32Array(gw * gh * 3), G2 = new Float32Array(gw * gh * 3);
    for (let by = 0; by < gh; by++) for (let bx = 0; bx < gw; bx++) { let n = 0; const s3 = [0, 0, 0]; for (let y = by * BS; y < Math.min(h, by * BS + BS); y++) for (let x = bx * BS; x < Math.min(w, bx * BS + BS); x++) { const i = (y * w + x) * 4; s3[0] += d[i]; s3[1] += d[i + 1]; s3[2] += d[i + 2]; n++; } for (let k = 0; k < 3; k++) G[(by * gw + bx) * 3 + k] = s3[k] / n; }
    const R = 10, K = []; for (let i = -R; i <= R; i++) K.push(Math.exp(-i * i / 50));
    for (let pass = 0; pass < 2; pass++) { const A0 = pass ? G2 : G, A1 = pass ? G : G2; for (let by = 0; by < gh; by++) for (let bx = 0; bx < gw; bx++) { const s3 = [0, 0, 0]; let n = 0; for (let i = -R; i <= R; i++) { const xx = pass ? bx : bx + i, yy = pass ? by + i : by; if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue; const j = (yy * gw + xx) * 3; for (let k = 0; k < 3; k++) s3[k] += A0[j + k] * K[i + R]; n += K[i + R]; } for (let k = 0; k < 3; k++) A1[(by * gw + bx) * 3 + k] = s3[k] / n; } }
    yield;
    const N = new Float32Array(w * h * 3);
    for (let y = 0; y < h; y++) { const gy = clamp((y + .5) / BS - .5, 0, gh - 1.001), y0b = Math.floor(gy), fy = gy - y0b; for (let x = 0; x < w; x++) { const gx = clamp((x + .5) / BS - .5, 0, gw - 1.001), x0b = Math.floor(gx), fx = gx - x0b, i = (y * w + x) * 4; for (let k = 0; k < 3; k++) { const L = G[(y0b * gw + x0b) * 3 + k] * (1 - fx) * (1 - fy) + G[(y0b * gw + x0b + 1) * 3 + k] * fx * (1 - fy) + G[((y0b + 1) * gw + x0b) * 3 + k] * (1 - fx) * fy + G[((y0b + 1) * gw + x0b + 1) * 3 + k] * fx * fy; N[(y * w + x) * 3 + k] = d[i + k] / Math.max(8, L); } } if (y % 180 === 179) yield; }
    return (SRC_K2 = { w, h, N });
  }
  /* le cœur : remplit E (rvb, éclairé par lit) et A (couverture) sur [xDeb, W) x [0, H), rangées du bas vers le haut ;
     basRef(x, y, k) : la référence sous la première rangée (la photo), ou null ; basForce(x) : colonnes où la première
     rangée ne descend pas dans la référence (la lampe) ; yBas : le bas de la première rangée */
  function* quilterK2(o) {
    const S = yield* sourcePierreK2(), { W, H, E, A, lit, xDeb, yBas, basRef, basForce } = o, R = rng(o.graine || 4242);
    const PW = 128, PH = 96, OX = 28, OY = 24, SXp = PW - OX, SYp = PH - OY;
    const echant = (u, v, k) => { u = clamp(u, 0, S.w - 1.001); v = clamp(v, 0, S.h - 1.001); const x0 = Math.floor(u), y0 = Math.floor(v), fx = u - x0, fy = v - y0, i = (y0 * S.w + x0) * 3 + k; return S.N[i] * (1 - fx) * (1 - fy) + S.N[i + 3] * fx * (1 - fy) + S.N[i + S.w * 3] * (1 - fx) * fy + S.N[i + S.w * 3 + 3] * fx * fy; };
    const rangees = []; for (let py = yBas - PH; ; py -= SYp) { rangees.push(py); if (py <= 0) break; }
    let nP = 0;
    for (let ri = 0; ri < rangees.length; ri++) {
      const py0 = rangees[ri], premiere = ri === 0;
      for (let px0 = xDeb; px0 < W; px0 += SXp) {
        const xa = px0, xb = Math.min(W, px0 + PW), ya = Math.max(0, py0), yb = Math.min(H, py0 + PH), pw = xb - xa, ph2 = yb - ya;
        const gauche = px0 > xDeb || o.gaucheRemplie, bas = premiere ? !!basRef : true;
        const ovB = premiere ? (basRef ? OV : 0) : OY, ref = (x, y, k) => (premiere && y >= H - OV && basRef ? basRef(x, y, k) : E[(y * W + x) * 3 + k]);
        /* les tirages */
        nP++;
        const grand = nP === 23 || nP === 61;
        let best = null;
        for (let t = 0; t < 24; t++) {
          const k = grand ? 1.25 : .92 + .16 * R(), rot = R() < .2, tone = R() < .08 ? .86 + .04 * R() : .95 + .1 * R();
          const sw = PW / k, sh = PH / k, su = R() * (S.w - sw - 2), sv = R() * (S.h - sh - 2);
          const P = (x, y, c) => { let u = (x - px0) / k, v = (y - py0) / k; if (rot) { u = sw - 1 - u; v = sh - 1 - v; } return echant(su + u, sv + v, c) * tone * lit(x, y, c); };
          let e = 0, n = 0;
          if (gauche) for (let y = ya; y < yb; y += 3) for (let x = xa; x < Math.min(xb, xa + OX); x += 3) { for (let c = 0; c < 3; c++) { const dd = P(x, y, c) - E[(y * W + x) * 3 + c]; e += dd * dd; } n++; }
          if (bas && ovB) for (let y = Math.max(ya, yb - ovB); y < yb; y += 3) for (let x = xa; x < xb; x += 3) { if (basForce && basForce(x)) continue; for (let c = 0; c < 3; c++) { const dd = P(x, y, c) - ref(x, y, c); e += dd * dd; } n++; }
          e = (n ? e / n : 0) * (1 + .15 * R());
          if (!best || e < best.e) best = { e, P };
        }
        /* les valeurs du morceau retenu */
        const P = best.P, V = new Float32Array(pw * ph2 * 3);
        for (let y = ya; y < yb; y++) for (let x = xa; x < xb; x++) for (let c = 0; c < 3; c++) V[((y - ya) * pw + (x - xa)) * 3 + c] = P(x, y, c);
        const err = (x, y, r) => { let s2 = 0; for (let c = 0; c < 3; c++) { const dd = V[((y - ya) * pw + (x - xa)) * 3 + c] - r(x, y, c); s2 += dd * dd; } return s2; };
        /* la découpe verticale à gauche (dans les OX premières colonnes) */
        const sV = new Float32Array(ph2).fill(-10);
        if (gauche) {
          const nx = Math.min(OX, pw), C = new Float32Array(ph2 * nx), Pp = new Int8Array(ph2 * nx);
          for (let y = 0; y < ph2; y++) for (let i = 0; i < nx; i++) { const e = err(xa + i, ya + y, (x, yy, c) => E[(yy * W + x) * 3 + c]); if (!y) { C[i] = e; continue; } let m = C[(y - 1) * nx + i], pp = 0; if (i > 0 && C[(y - 1) * nx + i - 1] < m) { m = C[(y - 1) * nx + i - 1]; pp = -1; } if (i < nx - 1 && C[(y - 1) * nx + i + 1] < m) { m = C[(y - 1) * nx + i + 1]; pp = 1; } C[y * nx + i] = e + m; Pp[y * nx + i] = pp; }
          let b = 0; for (let i = 1; i < nx; i++) if (C[(ph2 - 1) * nx + i] < C[(ph2 - 1) * nx + b]) b = i;
          for (let y = ph2 - 1; y >= 0; y--) { sV[y] = b; b += Pp[y * nx + b]; }
        }
        /* la découpe horizontale en bas (dans les ovB dernières rangées) */
        const sH = new Float32Array(pw).fill(1e4), hb = Math.min(ovB, ph2), y0o = yb - hb;
        if (bas && hb > 0) {
          const C = new Float32Array(pw * hb), Pp = new Int8Array(pw * hb);
          for (let x = 0; x < pw; x++) for (let r = 0; r < hb; r++) { let e = err(xa + x, y0o + r, ref); if (basForce && basForce(xa + x) && r > 0) e += 1e9; if (!x) { C[r] = e; continue; } let m = C[(x - 1) * hb + r], pp = 0; if (r > 0 && C[(x - 1) * hb + r - 1] < m) { m = C[(x - 1) * hb + r - 1]; pp = -1; } if (r < hb - 1 && C[(x - 1) * hb + r + 1] < m) { m = C[(x - 1) * hb + r + 1]; pp = 1; } C[x * hb + r] = e + m; Pp[x * hb + r] = pp; }
          let b = 0; for (let r = 1; r < hb; r++) if (C[(pw - 1) * hb + r] < C[(pw - 1) * hb + b]) b = r;
          for (let x = pw - 1; x >= 0; x--) { sH[x] = b; b += Pp[x * hb + b]; }
        }
        /* la pose : le morceau à droite de la découpe verticale et au-dessus de la découpe horizontale, fondu sur 3 px */
        for (let y = ya; y < yb; y++) for (let x = xa; x < xb; x++) {
          const ry = y - ya, rx = x - xa, av = gauche ? clamp((rx - sV[ry]) / 3 + .5) : 1, ah = bas && hb > 0 && y >= y0o ? clamp((sH[rx] - (y - y0o)) / 3 + .5) : 1, a = av * ah;
          if (a <= 0) continue;
          const j = y * W + x, a0 = A[j], aN = a + a0 * (1 - a);
          for (let c = 0; c < 3; c++) E[j * 3 + c] = (V[(ry * pw + rx) * 3 + c] * a + E[j * 3 + c] * a0 * (1 - a)) / aN;
          A[j] = aN;
        }
        yield;
      }
    }
  }
  function* hautPierreEtapes(sortie) {
    const HH = EXT.h + OV, c = document.createElement('canvas'); c.width = LX; c.height = HH; const g = c.getContext('2d', { willReadFrequently: true });
    yield;
    const B = 44;
    /* la bande source et le haut de la photo, en pixels */
    const sc = document.createElement('canvas'); sc.width = LX; sc.height = B; const sg = sc.getContext('2d', { willReadFrequently: true });
    sg.drawImage(grand(), 0, 0, LX, B, 0, 0, LX, B);
    yield;
    const sp = sg.getImageData(0, 0, LX, B).data, ph = new Uint8ClampedArray(sp);   /* ph : la photo telle quelle */
    yield;
    let lampeA = -1, lampeB = -1;
    /* L1 : en deux plans, le fond n'a pas de lampe : rien à effacer, aucune colonne réservée */
    if (LAMPE_T && !DEUX) {
      lampeA = Math.floor(EXT.g + LAMPE_T.x - LAMPE_T.l * .62); lampeB = Math.ceil(EXT.g + LAMPE_T.x + LAMPE_T.l * .62); const w = lampeB - lampeA;
      /* la lampe effacée de la bande source : le miroir de la pierre de gauche (continu au bord gauche) fondu dans le miroir
         de la pierre de droite (continu au bord droit), aucune arête */
      for (let y = 0; y < B; y++) for (let x = lampeA; x < lampeB; x++) { const t = (x - lampeA + .5) / w, i = (y * LX + x) * 4, l = (y * LX + (2 * lampeA - 1 - x)) * 4, r = (y * LX + (2 * lampeB - 1 - x)) * 4; for (let k = 0; k < 3; k++) sp[i + k] = sp[l + k] * (1 - t) + sp[r + k] * t; }
    }
    /* l'éclairage de la photo : la moyenne lissée de chaque colonne de la bande ; la pierre « nue » = pixel / éclairage */
    const cm = new Float32Array(LX * 3), cs = new Float32Array(LX * 3), gm = [0, 0, 0], R0 = 60;
    for (let x = 0; x < LX; x++) for (let y = 0; y < B; y++) { const i = (y * LX + x) * 4; for (let k = 0; k < 3; k++) cm[x * 3 + k] += sp[i + k] / B; }
    for (let x = 0; x < LX; x++) for (let k = 0; k < 3; k++) { let s2 = 0, n = 0; for (let dx = -R0; dx <= R0; dx += 4) { const xx = x + dx; if (xx < 0 || xx >= LX) continue; s2 += cm[xx * 3 + k]; n++; } cs[x * 3 + k] = s2 / n; }
    for (let x = 0; x < LX; x++) for (let k = 0; k < 3; k++) gm[k] += cs[x * 3 + k] / LX;
    yield;
    const nue = new Float32Array(LX * B * 3);
    for (let y = 0; y < B; y++) for (let x = 0; x < LX; x++) { const i = (y * LX + x) * 4, j = (y * LX + x) * 3; for (let k = 0; k < 3; k++) nue[j + k] = sp[i + k] / Math.max(8, cs[x * 3 + k]); }
    yield;
    /* la lumière en (x, y) du canevas (y = 0 au plafond, EXT.h au haut de la photo) : celle de la photo au raccord, qui
       tend vers une lumière plus froide et plus sombre en montant */
    const froid = [gm[0] * .74, gm[1] * .76, gm[2] * .82];
    const Wy = new Float32Array(HH), My = new Float32Array(HH);
    for (let y = 0; y < HH; y++) { const w = Math.exp(-Math.max(0, EXT.h - y) / 95), v = .55 + .45 * Math.pow(clamp(y / EXT.h), .8); Wy[y] = w; My[y] = w + (1 - w) * v; }
    const lumiere = (x, y, k) => (froid[k] + (cs[x * 3 + k] - froid[k]) * Wy[y]) * My[y];
    /* à gauche (la verrière, le pilier d'angle, le mur jusqu'à 300 px dans la photo), les montants et l'arête du pilier
       doivent monter droit : pas de décalage horizontal, mais des rangées prises plus bas dans les mêmes colonnes (le
       mur y est visible sur 360 rangées), à la profondeur qui raccorde le mieux. La limite entre ce mode et l'autre est
       elle aussi une découpe de moindre écart (verticale, dans une bande de 28 colonnes). */
    const XB = Math.round(EXT.g + 300), XL = XB + 16, RL = 360;
    const nueL = new Float32Array(XL * RL * 3);
    {
      const lc = document.createElement('canvas'); lc.width = XL; lc.height = RL; const lg2 = lc.getContext('2d', { willReadFrequently: true });
      lg2.drawImage(grand(), 0, 0, XL, RL, 0, 0, XL, RL); const ld = lg2.getImageData(0, 0, XL, RL).data;
      yield;
      const cmL = new Float32Array(XL * 3), csL = new Float32Array(XL * 3);
      for (let x = 0; x < XL; x++) for (let y = 0; y < RL; y++) { const i = (y * XL + x) * 4; for (let k = 0; k < 3; k++) cmL[x * 3 + k] += ld[i + k] / RL; }
      for (let x = 0; x < XL; x++) for (let k = 0; k < 3; k++) { let s2 = 0, n = 0; for (let dx = -R0; dx <= R0; dx += 4) { const xx = x + dx; if (xx < 0 || xx >= XL) continue; s2 += cmL[xx * 3 + k]; n++; } csL[x * 3 + k] = s2 / n; }
      for (let y = 0; y < RL; y++) { for (let x = 0; x < XL; x++) { const i = (y * XL + x) * 4, j = (y * XL + x) * 3; for (let k = 0; k < 3; k++) nueL[j + k] = ld[i + k] / Math.max(8, csL[x * 3 + k]); } if (y % 120 === 119) yield; }
    }
    const E = new Float32Array(LX * HH * 3), A = new Float32Array(LX * HH);   /* le résultat et sa couverture */
    /* une rangée : { dx, top, aL, cv } ; cv : la colonne de passage d'un mode à l'autre, rangée par rangée */
    const valeur = (b, x, y, k) => {
      const sy = y - b.top;
      if (x < b.cv[Math.max(0, Math.min(B - 1, sy))]) return nueL[((b.aL + sy) * XL + x) * 3 + k] * lumiere(x, y, k);
      const sx = ((x - b.dx) % LX + LX) % LX; return nue[(sy * LX + sx) * 3 + k] * lumiere(x, y, k);
    };
    /* le mode de gauche : la profondeur aL qui raccorde le mieux avec ce qui est en dessous (rangées top + B - OV à top + B) */
    const meilleurAL = (top, dessous) => {
      let best = 0, be = 1e30;
      for (let aL = 0; aL <= RL - B; aL += 14) {
        let e = 0;
        for (let r = 0; r < OV; r += 2) for (let x = 0; x < XB; x += 3) { const y = top + B - OV + r, j = ((aL + B - OV + r) * XL + x) * 3; for (let k = 0; k < 3; k++) { const d = nueL[j + k] * lumiere(x, y, k) - dessous(x, r, k); e += d * d; } }
        if (e < be) { be = e; best = aL; }
      }
      return best;
    };
    const coupeV = (b) => {
      const X0 = XB - 14, NX = 28, err = new Float32Array(B * NX), C = new Float32Array(B * NX), P = new Int8Array(B * NX), cv = new Int16Array(B);
      const g2 = { dx: b.dx, top: b.top, aL: b.aL, cv: new Int16Array(B).fill(1e4) }, d2 = { dx: b.dx, top: b.top, aL: b.aL, cv: new Int16Array(B).fill(-1) };
      for (let r = 0; r < B; r++) for (let i = 0; i < NX; i++) { const x = X0 + i, y = b.top + r; let e = 0; for (let k = 0; k < 3; k++) { const d = valeur(g2, x, y, k) - valeur(d2, x, y, k); e += d * d; } err[r * NX + i] = e; }
      for (let i = 0; i < NX; i++) C[i] = err[i];
      for (let r = 1; r < B; r++) for (let i = 0; i < NX; i++) { let m = C[(r - 1) * NX + i], pp = 0; if (i > 0 && C[(r - 1) * NX + i - 1] < m) { m = C[(r - 1) * NX + i - 1]; pp = -1; } if (i < NX - 1 && C[(r - 1) * NX + i + 1] < m) { m = C[(r - 1) * NX + i + 1]; pp = 1; } C[r * NX + i] = err[r * NX + i] + m; P[r * NX + i] = pp; }
      let best = 0; for (let i = 1; i < NX; i++) if (C[(B - 1) * NX + i] < C[(B - 1) * NX + best]) best = i;
      for (let r = B - 1; r >= 0; r--) { cv[r] = X0 + best; best += P[r * NX + best]; }
      b.cv = cv;
    };
    /* la découpe de moindre écart, ligne par ligne d'une bande de OV px : haut(x, r) et bas(x, r) -> r de coupe par colonne */
    const coupe = function* (haut, bas, force) {
      const err = new Float32Array(LX * OV), C = new Float32Array(LX * OV), P = new Int8Array(LX * OV);
      for (let x = 0; x < LX; x++) { for (let r = 0; r < OV; r++) { let e = 0; for (let k = 0; k < 3; k++) { const d = haut(x, r, k) - bas(x, r, k); e += d * d; } err[x * OV + r] = e + (force && force(x, r) ? 1e9 : 0); } if (x % 500 === 499) yield; }
      for (let r = 0; r < OV; r++) C[r] = err[r];
      for (let x = 1; x < LX; x++) for (let r = 0; r < OV; r++) { let m = C[(x - 1) * OV + r], pp = 0; if (r > 0 && C[(x - 1) * OV + r - 1] < m) { m = C[(x - 1) * OV + r - 1]; pp = -1; } if (r < OV - 1 && C[(x - 1) * OV + r + 1] < m) { m = C[(x - 1) * OV + r + 1]; pp = 1; } C[x * OV + r] = err[x * OV + r] + m; P[x * OV + r] = pp; }
      const cut = new Int16Array(LX); let best = 0; for (let r = 1; r < OV; r++) if (C[(LX - 1) * OV + r] < C[(LX - 1) * OV + best]) best = r;
      for (let x = LX - 1; x >= 0; x--) { cut[x] = best; best += P[x * OV + best]; }
      return cut;
    };
    const DEC = [0, 113, -71, 167, -139, 61, -97, 149, -59, 127, -163, 83, -121, 101];
    /* la première rangée, posée à cheval sur le haut de la photo : coupe dans les OV premières rangées de la photo (jamais
       dans les colonnes de la lampe, qui reste celle de la photo) */
    const photoBas = (x, r, k) => ph[(r * LX + x) * 4 + k];
    let b = { dx: DEC[1], top: HH - B, aL: 0, cv: null };
    b.aL = meilleurAL(b.top, photoBas); coupeV(b);
    yield;
    const cut0 = yield* coupe((x, r, k) => valeur(b, x, EXT.h + r, k), photoBas, (x, r) => x >= lampeA - 6 && x <= lampeB + 6 && r > 0);
    for (let x = 0; x < LX; x++) { for (let y = b.top; y < HH; y++) {
      const r = y - EXT.h; let a = 1; if (r >= 0) a = clamp((cut0[x] - r) / 3 + .5); if (a <= 0) continue;
      const j = y * LX + x; for (let k = 0; k < 3; k++) E[j * 3 + k] = valeur(b, x, y, k); A[j] = a;
    } if (x % 400 === 399) yield; }
    /* les rangées suivantes, vers le plafond ; chacune passe au-dessus de la précédente le long de sa découpe */
    for (let n = 2; b.top > -B; n++) {
      const top = b.top, bn = { dx: DEC[n % DEC.length], top: top - (B - OV), aL: 0, cv: null };
      const dessous = (x, r, k) => E[((top + r) * LX + x) * 3 + k];
      bn.aL = meilleurAL(bn.top, dessous); coupeV(bn);
      yield;
      const cut = yield* coupe((x, r, k) => valeur(bn, x, top + r, k), dessous);
      for (let x = 0; x < LX; x++) { for (let y = Math.max(0, bn.top); y < top + OV; y++) {
        const r = y - top; const a = r < 0 ? 1 : clamp((cut[x] - r) / 3 + .5); if (a <= 0) continue;
        const j = y * LX + x; for (let k = 0; k < 3; k++) { const v = valeur(bn, x, y, k); E[j * 3 + k] = r < 0 ? v : E[j * 3 + k] + (v - E[j * 3 + k]) * a; }
        if (r < 0) A[j] = 1;
      } if (x % 600 === 599) yield; }
      b = bn;
    }
    yield;
    /* K2 : à droite de la verrière et du pilier (où J6 garde ses colonnes, pour que montants et arête montent droit), les
       rangées régulières de J6 sont remplacées par le mur assemblé de grands morceaux ; la première colonne raccorde au
       mode de gauche par une découpe de moindre écart, la première rangée à la photo (la lampe reste celle de la photo) */
    if (window.__sansK2 !== true) {
      /* sur la photo (sous le haut du canevas), la première rangée de J6 ne compte plus : seule la nouvelle se pose */
      for (let y = EXT.h; y < HH; y++) for (let x = XB; x < LX; x++) A[y * LX + x] = 0;
      yield* quilterK2({ W: LX, H: HH, E, A, xDeb: XB - 28, gaucheRemplie: true, yBas: HH, graine: 9417,
        lit: (x, y, k) => lumiere(x, y, k),
        basRef: (x, y, k) => ph[((y - EXT.h) * LX + x) * 4 + k],
        basForce: x => x >= lampeA - 6 && x <= lampeB + 6 });
    }
    const im = g.createImageData(LX, HH), d = im.data;
    for (let j = 0; j < LX * HH; j++) { d[j * 4] = E[j * 3]; d[j * 4 + 1] = E[j * 3 + 1]; d[j * 4 + 2] = E[j * 3 + 2]; d[j * 4 + 3] = 255 * A[j]; if (j % 300000 === 299999) yield; }
    yield;
    g.putImageData(im, 0, 0);
    yield;
    /* un voile d'ombre en haut (le plafond), très doux, seulement sur la pierre ajoutée */
    const go = g.createLinearGradient(0, 0, 0, EXT.h); go.addColorStop(0, 'rgba(24,18,12,.32)'); go.addColorStop(.6, 'rgba(24,18,12,.06)'); go.addColorStop(1, 'rgba(24,18,12,0)');
    g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = go; g.fillRect(0, 0, LX, EXT.h); g.restore();
    /* L1 : en deux plans, la lampe prolongée est sur le plan de la table */
    if (!DEUX) lampeHaut(g);
    /* L7 : la verrière monte droit au-dessus de la photo */
    verriereHaut(g);
    sortie.c = c;
  }
  /* L7 : au-dessus de la photo, la verrière continue tout droit : ses colonnes (le prolongement de gauche et la verrière de
     la photo, jusqu'au montant de 64 px) reçoivent des copies du carreau du haut (rangées 5 à 185 : le verre et la
     traverse d'acier à son pied), empilées ; chaque raccord tombe sur une traverse. Dans le contexte g, la rangée EXT.h est
     le haut de la photo. */
  function verriereHaut(g) {
    const xV = EXT.g + 64, h0 = 5, h1 = 185, hp = h1 - h0;
    for (let y = EXT.h + h0 - hp; y > -hp; y -= hp) g.drawImage(grand(), 0, h0, xV, hp, 0, y, xV, hp);
  }
  /* L1 : en deux plans, au-dessus de la photo du fond, le plafond : ses poutres, vues d'en dessous, s'écartent en
     montant (perspective d'un plan horizontal au-dessus de l'oeil) : chaque rangée du prolongement est la rangée du haut de
     la photo, élargie autour de la verticale du point de fuite d'autant que la rangée est loin de l'horizon, puis
     assombrie vers le haut (l'ombre du plafond) ; la verrière continue tout droit (verriereHaut) */
  /* L4 : seule la partie de chaque rangée élargie qui tombe dans le canevas est tracée (elle débordait de plusieurs fois sa
     largeur : 224 ms d'un bloc dans Safari) ; plafondRangs(g, pas, de, a) trace les rangées de de à a (tâche par morceaux) */
  /* L4 : les trois rangées du haut de la photo, copiées une fois dans une bande à part : tirées 215 fois du grand canevas
     de la photo prolongée, elles faisaient travailler Safari 217 ms (le grand canevas renvoyé à chaque tracé) */
  /* M9 (treizième passe) : « les poutres font complètement saccader, c'est très moche ». Le plafond n'est plus fait des
     rangées du haut de la photo étirées vers le haut : il est dessiné en vraie perspective, une fois, dans les
     coordonnées de la photo du fond (il bouge donc exactement comme elle, rien d'autre ne change d'une image à l'autre).
     Un plan horizontal au-dessus de l'oeil : des solives de chêne vieilli, de section constante, perpendiculaires au mur
     du fond (elles filent vers le point de fuite de la photo), posées là où la photo montre leurs bouts (relevés sur la
     photo, l'espacement prolongé de part et d'autre selon la même loi), vues de dessous (leur face basse et leur flanc
     tourné vers le centre), le grain, les fentes de séchage ; entre elles, les planches du plafond, chaulées, en lames
     posées parallèlement au mur (leurs joints se resserrent vers le fond) ; la lumière de la verrière vient de la gauche
     (flancs gauches éclairés, ombre portée de chaque solive à sa droite), celle de la lampe chauffe le milieu près du
     mur ; plus sombre en montant. Le plafond peint couvre aussi le haut de la photo (le plafond qu'elle montrait, jusqu'au
     haut du mur) ; les bouts des solives entrent dans la maçonnerie. (Avec la pièce de la version « poutres », voir
     plafondPeintV2.) */
  const PLAF = { yJ: 24, yB: 50, l: 40 };
  function solivesPlafond() {
    /* les bouts des solives relevés sur la photo du fond (abscisses au bas de leur face, rangée 50), puis l'espacement
       prolongé : s(x) = 148 + 0,063 (x - 454) px (il croît vers la droite : le mur du fond fuit un peu vers la gauche) */
    const vus = [239, 380, 528, 690, 858, 1035, 1226], esp = x => Math.max(96, 148 + .063 * (x - 454)), L = vus.slice();
    for (let x = vus[0]; x > -EXT.g + 40;) { x -= esp(x - 70); L.unshift(x); }
    for (let x = vus[vus.length - 1]; x < vt.w + EXT.d + 400;) { x += esp(x + 90); L.push(x); }
    return L.map(x => EXT.g + x);
  }
  /* M9 : les matières du plafond, tirées d'une vraie photo de chêne : le plateau de la planche à dessin (atelier-planche),
     sous la gravure et au-dessus de la lèvre (son fil est horizontal). Pour les solives : assombri et réchauffé (du chêne
     vieilli), tourné d'un quart (le fil le long de la solive) ; pour les planches : le même bois sous un lait de chaux */
  function boisPlafond(teinte) {
    const W0 = Math.round(vp.w * .72), H0 = Math.round(vp.h * .3), x0 = Math.round(vp.w * .11), y0 = Math.round(vp.h * .5);
    const b = document.createElement('canvas'); b.width = W0; b.height = H0; const bg = b.getContext('2d', { willReadFrequently: true });
    bg.drawImage(vp.image, x0, y0, W0, H0, 0, 0, W0, H0);
    const src = bg.getImageData(0, 0, W0, H0).data, n = W0 * H0;
    /* (calculé pixel par pixel : les modes de fusion « saturation », « overlay », « luminosity » coûtaient 600 ms dans Safari) */
    const s = new ImageData(W0, H0), sd = s.data, p = new ImageData(W0, H0), pd = p.data, M = [170 / 255, 140 / 255, 110 / 255], BASE = [228, 220, 207];
    const ovl = a => { const o = a < .5 ? 2 * a * a : 1 - 2 * (1 - a) * (1 - a); return 255 * (a + (o - a) * .45); };
    for (let i = 0; i < n * 4; i += 4) {
      const r = src[i], gg = src[i + 1], bb = src[i + 2], L = .3 * r + .59 * gg + .11 * bb;
      /* les solives : désaturé de 60 %, multiplié (chêne vieilli), le fil rehaussé (overlay de lui-même, 45 %) */
      sd[i] = ovl((L + (r - L) * .4) * M[0] / 255); sd[i + 1] = ovl((L + (gg - L) * .4) * M[1] / 255); sd[i + 2] = ovl((L + (bb - L) * .4) * M[2] / 255); sd[i + 3] = 255;
      /* les planches : sous un lait de chaux (le bois multiplié à 38 %, puis 30 % de sa luminosité) */
      const c0 = BASE[0] * (.62 + .38 * r / 255), c1 = BASE[1] * (.62 + .38 * gg / 255), c2 = BASE[2] * (.62 + .38 * bb / 255), dl = (L - (.3 * c0 + .59 * c1 + .11 * c2)) * .3;
      pd[i] = c0 + dl; pd[i + 1] = c1 + dl; pd[i + 2] = c2 + dl; pd[i + 3] = 255;
    }
    /* M9 bis : ramenés aux teintes moyennes lues sur la photo (ses solives, ses planches), canal par canal */
    if (teinte) [[sd, teinte.solive], [pd, teinte.planche]].forEach(([d, cible]) => {
      if (!cible) return; const m = [0, 0, 0]; for (let i = 0; i < n * 4; i += 4) { m[0] += d[i]; m[1] += d[i + 1]; m[2] += d[i + 2]; }
      const k = m.map((v, c) => cible[c] / Math.max(1, v / n)); for (let i = 0; i < n * 4; i += 4) { d[i] *= k[0]; d[i + 1] *= k[1]; d[i + 2] *= k[2]; }
    });
    const sc = document.createElement('canvas'); sc.width = W0; sc.height = H0; sc.getContext('2d').putImageData(s, 0, 0);
    const r2 = document.createElement('canvas'); r2.width = H0; r2.height = W0; const rg = r2.getContext('2d'); rg.translate(H0, 0); rg.rotate(Math.PI / 2); rg.drawImage(sc, 0, 0);
    const pc = document.createElement('canvas'); pc.width = W0; pc.height = H0; pc.getContext('2d').putImageData(p, 0, 0);
    return { solive: r2, planche: pc };
  }
  function* plafondPeint(g) {
    const Fx = EXT.g + P2.Fx, Yv = EXT.h + (vfo.reperes.horizon || .45) * vt.h, yJ = EXT.h + PLAF.yJ, yB = EXT.h + PLAF.yB, y0 = -30;
    const rB = (a, y) => Fx + a * (Yv - y) / (Yv - yB), rT = (a, y) => Fx + a * (Yv - y) / (Yv - yJ);
    const R = rng(9091), poly = pts => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    const B = vp.reel ? boisPlafond() : null;
    yield;
    g.save();
    /* 1. les planches du plafond, parallèles au mur : une rangée de lames entre deux joints (plus serrés vers le fond, des
       lames de même largeur en perspective) ; chaque lame est le bois de la photo, à l'échelle de sa profondeur, posée bout à
       bout (un joint de bout à chaque raccord), sous un lait de chaux inégal */
    const joints = [yJ]; for (let k = 1; k < 60; k++) { const y = Yv - (Yv - yJ) / (1 - k * .043); joints.push(y); if (y < y0) break; }
    g.fillStyle = '#cbbfae'; g.fillRect(0, y0, LX, yJ - y0);
    for (let k = 0; k < joints.length - 1; k++) {
      const yb = joints[k], yt = joints[k + 1], sc = (Yv - (yb + yt) / 2) / (Yv - yJ), hh = yb - yt;
      if (B) {
        /* la lame : le bois sous la chaux, à l'échelle de sa profondeur (même échelle en largeur et en hauteur), en motif
           répété depuis l'aplomb du point de fuite (un joint de bout à chaque raccord, décalé d'une rangée à l'autre) ;
           chaque lame prend une autre bande du bois ; un seul remplissage par rangée */
        const P = B.planche, ech = sc * .55, lw = P.width * ech, sy = R() * Math.max(0, P.height - hh / ech), dx = Fx - R() * lw;
        if (!B.motif) B.motif = g.createPattern(P, 'repeat');
        B.motif.setTransform(new DOMMatrix([ech, 0, 0, ech, dx, yt - sy * ech]));
        g.fillStyle = B.motif; g.fillRect(0, yt, LX, hh + .6);
        g.fillStyle = 'rgba(70,54,38,.3)';
        for (let x = dx - Math.ceil(dx / lw) * lw; x < LX; x += lw) g.fillRect(x - .5, yt, Math.max(1, sc), hh);
      }
      /* chaque lame a son ton */
      const t = R(); g.fillStyle = t < .5 ? `rgba(255,250,240,${(.04 + .06 * t).toFixed(3)})` : `rgba(80,62,44,${(.02 + .06 * (t - .5)).toFixed(3)})`; g.fillRect(0, yt, LX, hh);
      /* le joint, et la lumière sur le chant de la lame */
      g.fillStyle = 'rgba(52,38,24,.4)'; g.fillRect(0, yb - .9 * Math.max(.6, sc), LX, 1.4 * Math.max(.6, sc));
      g.fillStyle = 'rgba(255,246,230,.14)'; g.fillRect(0, yb + .5, LX, 1.2 * Math.max(.6, sc));
      if (k % 4 === 3) yield;
    }
    yield;
    const X = solivesPlafond(), l = PLAF.l;
    /* 2. l'ombre portée de chaque solive sur les planches, à sa droite (la lumière de la verrière, à gauche) */
    X.forEach(x => {
      const aR = x + l / 2 - Fx;
      for (let b = 0; b < 4; b++) {
        const e = l * (.25 + .35 * b), a1 = aR + e;
        g.fillStyle = `rgba(40,28,18,${(.14 - b * .03).toFixed(3)})`;
        poly([[Fx + aR, yJ], [rT(aR, y0), y0], [rT(a1, y0), y0], [Fx + a1, yJ]]); g.fill();
      }
    });
    /* 3. les solives : chaque face, le chêne de la photo posé tranche par tranche en perspective (le fil suit la solive et
       se resserre vers le fond) ; le flanc tourné vers le centre (à droite du centre, le flanc gauche, éclairé par la
       verrière ; à gauche, le flanc droit, dans l'ombre), puis la face de dessous */
    const face = (ga, gb, rA, rBf, yFin, yHaut, v0, ton) => {
      /* ga, gb : décalages au mur des deux arêtes ; rA, rBf : leurs rayons ; v0 : départ dans la texture ; ton : voile */
      const S = B && B.solive, K = (Yv - yFin);
      /* le long de la solive, la texture suit la profondeur (v = C K / (Yv - y)) et tient dans la photo sans recommencer */
      const ratio = K / (Yv - yHaut), C = S ? (S.height - 24) / (1 - ratio) * (.82 + .18 * R()) : 0, vd = S ? -C * ratio + R() * Math.max(0, S.height - 24 - C * (1 - ratio)) : 0;
      /* M9 : huit tranches par face, chacune découpée à la face (la perspective du fil, tranche par tranche) : dans Safari,
         des milliers de petits tracés se rejouaient à chaque recopie du plafond (600 ms) */
      const N = 8;
      for (let j = 0; j < N && S; j++) {
        const y = lerp(yFin, yHaut, j / N), ya = lerp(yFin, yHaut, (j + 1) / N), xa0 = rA(ga, ya), xa1 = rBf(gb, ya), xb0 = rA(ga, y), xb1 = rBf(gb, y);
        const vA = vd + C * K / (Yv - ya), vB = vd + C * K / (Yv - y), sv = Math.max(0, Math.min(vA, vB)), hv = Math.max(1, Math.abs(vA - vB));
        g.save(); g.beginPath(); g.moveTo(xa0, ya); g.lineTo(xa1, ya); g.lineTo(xb1, y + .6); g.lineTo(xb0, y + .6); g.closePath(); g.clip();
        /* texture (u, v) -> écran : u en travers (la largeur au plus large de la tranche), v le long (la hauteur de la
           tranche), cisaillée par la pente de l'arête gauche */
        const la = Math.min(xa0, xa1), lb = Math.min(xb0, xb1), w = Math.max(Math.abs(xa1 - xa0), Math.abs(xb1 - xb0)) + 3, kx = w / S.width, ky = (y - ya + .6) / hv;
        g.setTransform(kx, 0, (lb - la) / hv, ky, la - 1.5, ya);
        g.drawImage(S, 0, sv, S.width, hv, 0, 0, S.width, hv);
        g.restore();
      }
      g.save(); g.beginPath(); g.moveTo(rA(ga, yHaut), yHaut); g.lineTo(rBf(gb, yHaut), yHaut); g.lineTo(rBf(gb, yFin), yFin); g.lineTo(rA(ga, yFin), yFin); g.closePath();
      if (!S) { g.fillStyle = 'rgb(86,64,44)'; g.fill(); }
      g.fillStyle = ton; g.fill(); g.restore();
    };
    for (const x of X) {
      const aL = x - l / 2 - Fx, aR = x + l / 2 - Fx, droite = x > Fx, ai = droite ? aL : aR;
      if (Math.max(rB(aL, y0), rB(aR, y0), Fx + aR) < 0 || Math.min(rB(aL, y0), rB(aR, y0), Fx + aL) > LX) continue;
      /* le flanc : entre l'arête basse (rayon de la face de dessous) et l'arête haute, contre les planches */
      face(ai, ai, rT, rB, yB, y0, 0, droite ? 'rgba(255,214,160,.16)' : 'rgba(20,12,6,.42)');
      /* la face de dessous */
      face(aL, aR, rB, rB, yB, y0, 0, 'rgba(30,20,12,.08)');
      /* son modelé : plus sombre côté ombre, l'arête éclairée côté verrière */
      g.save(); poly([[Fx + aL, yB], [rB(aL, y0), y0], [rB(aR, y0), y0], [Fx + aR, yB]]); g.clip();
      const fd = g.createLinearGradient(Fx + aL, 0, Fx + aR, 0); fd.addColorStop(0, 'rgba(255,220,170,.12)'); fd.addColorStop(.4, 'rgba(0,0,0,0)'); fd.addColorStop(1, 'rgba(20,12,6,.28)');
      g.fillStyle = fd; g.fillRect(rB(aL, y0) - 10, y0, rB(aR, y0) - rB(aL, y0) + 20, yB - y0);
      /* une ou deux fentes de séchage */
      for (let k = 0; k < 1 + (R() < .6 ? 1 : 0); k++) {
        const u = .25 + .5 * R(), ya = yB - R() * (yB - y0) * .4, yb2 = ya - (yB - y0) * (.25 + .35 * R());
        g.strokeStyle = 'rgba(18,10,4,.55)'; g.lineWidth = 1.1 + R() * .8; g.beginPath();
        for (let y = ya; y >= Math.max(y0, yb2); y -= 4) { const xx = lerp(rB(aL, y), rB(aR, y), u + .006 * Math.sin(y * .05 + k)); y === ya ? g.moveTo(xx, y) : g.lineTo(xx, y); }
        g.stroke();
      }
      g.restore();
      g.strokeStyle = 'rgba(232,196,150,.2)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(Fx + aL + .7, yB); g.lineTo(rB(aL, y0) + .7, y0); g.stroke();
      yield;
    }
    /* 4. la lumière : la lampe chauffe le milieu près du mur ; plus sombre en montant et sur les bords
       (source-atop : seulement sur ce qui est peint, jamais sur la pierre de la photo, transparente ici) */
    const lx = EXT.g + (LAMPE_T ? LAMPE_T.x : P2.Fx), rl = g.createRadialGradient(lx, yJ, 10, lx, yJ, vt.w * .55);
    rl.addColorStop(0, 'rgba(255,190,112,.3)'); rl.addColorStop(.45, 'rgba(255,186,112,.12)'); rl.addColorStop(1, 'rgba(255,190,120,0)');
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = rl; g.fillRect(0, y0, LX, yB + 6 - y0);
    const ombre = g.createLinearGradient(0, y0, 0, yJ); ombre.addColorStop(0, 'rgba(18,12,8,.6)'); ombre.addColorStop(.55, 'rgba(18,12,8,.28)'); ombre.addColorStop(1, 'rgba(18,12,8,.05)');
    g.fillStyle = ombre; g.fillRect(0, y0, LX, yJ - y0);
    const cote = g.createLinearGradient(0, 0, LX, 0); cote.addColorStop(0, 'rgba(18,12,8,.3)'); cote.addColorStop(.3, 'rgba(18,12,8,0)'); cote.addColorStop(.72, 'rgba(18,12,8,0)'); cote.addColorStop(1, 'rgba(18,12,8,.34)');
    g.fillStyle = cote; g.fillRect(0, y0, LX, yJ - y0);
    g.globalCompositeOperation = 'source-over';
    /* 5. le haut du mur : l'ombre du plafond sur la pierre, et l'encastrement de chaque solive */
    const cr = g.createLinearGradient(0, yJ - 1, 0, yJ + 12); cr.addColorStop(0, 'rgba(30,20,12,.55)'); cr.addColorStop(1, 'rgba(30,20,12,0)');
    g.fillStyle = cr; g.fillRect(0, yJ - 1, LX, 13);
    X.forEach(x => { const r = g.createRadialGradient(x, yB + 2, 2, x, yB + 2, l * .9); r.addColorStop(0, 'rgba(24,16,10,.5)'); r.addColorStop(1, 'rgba(24,16,10,0)'); g.fillStyle = r; g.fillRect(x - l, yB - l * .3, l * 2, l * 1.2); });
    g.restore();
  }
  /* M9 bis (treizième passe) : avec la pièce de la version « poutres », la photo porte le plafond entier ; le plafond peint
     ne sert plus qu'au-dessus de son bord haut (les écrans très hauts, l'approche de la planche quand la caméra le
     découvre), jamais par-dessus la photo. Il prolonge ses solives : les bouts que la photo montre en haut (relevés à
     110, 332, 555, 794, 1015, 1237 px, larges d'environ 50 px), sur les rayons de son point de fuite (abscisse 794, la
     solive du milieu est verticale ; hauteur : le repère « horizon », 0,47), espacés de 222 px de part et d'autre ; leur
     bois et celui des planches ramenés aux teintes lues sur la photo (les bouts des solives ; les planches de la travée,
     moins éclairées ici, loin de la lampe) ; les lames parallèles au mur, leurs joints de plus en plus espacés vers nous ;
     plus sombre en montant. Le raccord : sur les 40 px au-dessus de la photo, le haut de la photo prolongé le long des
     mêmes rayons, sous le plafond peint qui s'efface vers le bas. */
  function* plafondPeintV2(g) {
    const Fx = EXT.g + 794, Yv = EXT.h + (PLAF2.horizon || .47) * vt.h, y0c = EXT.h, top = -30, l = 50, PROF = 26, RAC = 40;
    const rB = (a, y) => Fx + a * (Yv - y) / (Yv - y0c), rT = (a, y) => Fx + a * (Yv - y) / (Yv - y0c + PROF);
    const R = rng(9097);
    /* les teintes de la photo */
    const lg = grand().getContext('2d', { willReadFrequently: true });
    const lire = (x, y, w, h, garder) => { const d = lg.getImageData(EXT.g + x, y, w, h).data, m = [0, 0, 0]; let n = 0; for (let i = 0; i < d.length; i += 4) { const L = .3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2]; if (!garder(L)) continue; m[0] += d[i]; m[1] += d[i + 1]; m[2] += d[i + 2]; n++; } return n > 30 ? m.map(v => v / n) : null; };
    const cSo = lire(80, 0, 1180, 24, L => L > 55 && L < 150) || [92, 76, 54], cPl = lire(820, 95, 160, 70, L => L > 140) || [214, 198, 172];
    const B = vp.reel ? boisPlafond({ solive: cSo, planche: cPl.map(v => v * .6) }) : null;
    yield;
    const P = document.createElement('canvas'); P.width = LX; P.height = EXT.h; const p = P.getContext('2d');
    const poly = pts => { p.beginPath(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); };
    /* 1. les planches */
    p.fillStyle = `rgb(${cPl.map(v => Math.round(v * .55)).join(',')})`; p.fillRect(0, 0, LX, EXT.h);
    const joints = [y0c]; for (let k = 1; k < 80; k++) { const y = Yv - (Yv - y0c) / (1 - k * .045); joints.push(y); if (y < top) break; }
    for (let k = 0; k < joints.length - 1; k++) {
      const yb = joints[k], yt = joints[k + 1], sc = (Yv - (yb + yt) / 2) / (Yv - y0c), hh = yb - yt;
      if (B) {
        const PL = B.planche, ech = sc * .5, lw = PL.width * ech, sy = R() * Math.max(0, PL.height - hh / ech), dx = Fx - R() * lw;
        if (!B.motif) B.motif = p.createPattern(PL, 'repeat');
        B.motif.setTransform(new DOMMatrix([ech, 0, 0, ech, dx, yt - sy * ech]));
        p.fillStyle = B.motif; p.fillRect(0, yt, LX, hh + .6);
        p.fillStyle = 'rgba(40,28,16,.32)'; for (let x = dx - Math.ceil(dx / lw) * lw; x < LX; x += lw) p.fillRect(x - .5, yt, Math.max(1, sc), hh);
      }
      const t = R(); p.fillStyle = t < .5 ? `rgba(255,246,230,${(.03 + .05 * t).toFixed(3)})` : `rgba(40,28,16,${(.03 + .06 * (t - .5)).toFixed(3)})`; p.fillRect(0, yt, LX, hh);
      p.fillStyle = 'rgba(30,20,12,.5)'; p.fillRect(0, yb - .9 * Math.max(.6, sc), LX, 1.4 * Math.max(.6, sc));
      p.fillStyle = 'rgba(255,240,215,.1)'; p.fillRect(0, yb + .5, LX, 1.2 * Math.max(.6, sc));
      if (k % 6 === 5) yield;
    }
    yield;
    /* 2. les solives : leurs bouts relevés sur la photo, l'espacement prolongé de part et d'autre */
    const vus = [110, 332, 555, 794, 1015, 1237], X = vus.slice();
    for (let x = vus[0] - 222; x > -EXT.g - 900; x -= 222) X.unshift(x);
    for (let x = vus[vus.length - 1] + 222; x < vt.w + EXT.d + 900; x += 222) X.push(x);
    /* l'ombre portée de chaque solive sur les planches (la verrière est à gauche) */
    X.forEach(x0 => { const aR = EXT.g + x0 + l / 2 - Fx; for (let b = 0; b < 4; b++) { const a1 = aR + l * (.25 + .35 * b); p.fillStyle = `rgba(24,16,8,${(.16 - b * .035).toFixed(3)})`; poly([[rT(aR, y0c), y0c], [rT(aR, top), top], [rT(a1, top), top], [rT(a1, y0c), y0c]]); p.fill(); } });
    const S = B && B.solive;
    const face = (ga, gb, rA, rBf, ton) => {
      const K = Yv - y0c, ratio = K / (Yv - top), C = S ? (S.height - 24) / (1 - ratio) * (.82 + .18 * R()) : 0, vd = S ? -C * ratio + R() * Math.max(0, S.height - 24 - C * (1 - ratio)) : 0, N = 8;
      for (let j = 0; j < N && S; j++) {
        const y = lerp(y0c, top, j / N), ya = lerp(y0c, top, (j + 1) / N), xa0 = rA(ga, ya), xa1 = rBf(gb, ya), xb0 = rA(ga, y), xb1 = rBf(gb, y);
        const vA = vd + C * K / (Yv - ya), vB = vd + C * K / (Yv - y), sv = Math.max(0, Math.min(vA, vB)), hv = Math.max(1, Math.abs(vA - vB));
        p.save(); p.beginPath(); p.moveTo(xa0, ya); p.lineTo(xa1, ya); p.lineTo(xb1, y + .6); p.lineTo(xb0, y + .6); p.closePath(); p.clip();
        const la = Math.min(xa0, xa1), lb = Math.min(xb0, xb1), w = Math.max(Math.abs(xa1 - xa0), Math.abs(xb1 - xb0)) + 3;
        p.setTransform(w / S.width, 0, (lb - la) / hv, (y - ya + .6) / hv, la - 1.5, ya); p.drawImage(S, 0, sv, S.width, hv, 0, 0, S.width, hv); p.restore();
      }
      p.save(); p.beginPath(); p.moveTo(rA(ga, top), top); p.lineTo(rBf(gb, top), top); p.lineTo(rBf(gb, y0c), y0c); p.lineTo(rA(ga, y0c), y0c); p.closePath();
      if (!S) { p.fillStyle = `rgb(${cSo.map(Math.round).join(',')})`; p.fill(); }
      p.fillStyle = ton; p.fill(); p.restore();
    };
    for (const x0 of X) {
      const x = EXT.g + x0, aL = x - l / 2 - Fx, aR = x + l / 2 - Fx, droite = x > Fx, ai = droite ? aL : aR;
      if (Math.max(rB(aL, top), rB(aR, top), x + l) < 0 || Math.min(rB(aL, top), rB(aR, top), x - l) > LX) continue;
      face(ai, ai, rT, rB, droite ? 'rgba(255,214,160,.12)' : 'rgba(16,10,4,.45)');
      face(aL, aR, rB, rB, 'rgba(24,16,8,.06)');
      p.save(); poly([[Fx + aL, y0c], [rB(aL, top), top], [rB(aR, top), top], [Fx + aR, y0c]]); p.clip();
      const fd = p.createLinearGradient(rB(aL, y0c), 0, rB(aR, y0c), 0); fd.addColorStop(0, 'rgba(255,220,170,.1)'); fd.addColorStop(.4, 'rgba(0,0,0,0)'); fd.addColorStop(1, 'rgba(16,10,4,.3)');
      p.fillStyle = fd; p.fillRect(Math.min(rB(aL, top), x - l) - 10, top, Math.abs(rB(aR, top) - rB(aL, top)) + 2 * l + 20, y0c - top);
      const u = .3 + .4 * R(), ya = y0c - R() * 40, yb2 = ya - (y0c - top) * (.3 + .3 * R());
      p.strokeStyle = 'rgba(14,8,3,.5)'; p.lineWidth = 1.2; p.beginPath();
      for (let y = ya; y >= Math.max(top, yb2); y -= 4) { const xx = lerp(rB(aL, y), rB(aR, y), u + .006 * Math.sin(y * .05)); y === ya ? p.moveTo(xx, y) : p.lineTo(xx, y); }
      p.stroke(); p.restore();
      yield;
    }
    /* 3. la lumière : de plus en plus sombre vers nous (loin de la lampe et de la verrière), et sur les bords */
    const o = p.createLinearGradient(0, top, 0, y0c); o.addColorStop(0, 'rgba(10,6,3,.62)'); o.addColorStop(.7, 'rgba(10,6,3,.3)'); o.addColorStop(1, 'rgba(10,6,3,.14)');
    p.fillStyle = o; p.fillRect(0, 0, LX, EXT.h);
    const cote = p.createLinearGradient(0, 0, LX, 0); cote.addColorStop(0, 'rgba(10,6,3,.3)'); cote.addColorStop(.3, 'rgba(10,6,3,0)'); cote.addColorStop(.72, 'rgba(10,6,3,0)'); cote.addColorStop(1, 'rgba(10,6,3,.34)');
    p.fillStyle = cote; p.fillRect(0, 0, LX, EXT.h);
    /* 4. le raccord : le peint s'efface sur les 40 px du bas ; dessous, le haut de la photo prolongé le long des rayons */
    /* (destination-in efface tout ce que le tracé ne couvre pas : le dégradé couvre donc tout le canevas, opaque au-dessus) */
    p.globalCompositeOperation = 'destination-in'; const f = p.createLinearGradient(0, y0c - RAC, 0, y0c); f.addColorStop(0, '#000'); f.addColorStop(1, 'rgba(0,0,0,0)'); p.fillStyle = f; p.fillRect(0, 0, LX, EXT.h);
    p.globalCompositeOperation = 'source-over';
    yield;
    for (let y = y0c - RAC - 2; y < y0c; y++) { const k = (Yv - y) / (Yv - y0c); g.drawImage(grand(), 0, 1, LX, 2, Fx - Fx * k, y, LX * k, 1.2); }
    g.drawImage(P, 0, 0);
  }
  /* O3 (quinzième passe) : prets/plafond.webp refait avec le nouveau prolongement de gauche (son raccord étire le haut de la
     photo prolongée : seuls les 40 px du bas, à gauche de x 80 de la photo, changent ; le reste est identique au pixel près,
     à la compression près) */
  /* M9 : le plafond peint est aussi préparé (c-film/prets/plafond.webp, même dessin) : pris s'il est là et que ses sources
     n'ont pas changé ; sinon dessiné ici, par étapes (une solive à la fois) */
  let plafondPret = null; (vp.reel && DEUX ? pret('plafond') : Promise.resolve(null)).then(r => { plafondPret = r || false; });
  function* plafondEtapes(sortie) {
    const c = document.createElement('canvas'); c.width = LX; c.height = PLAF2 ? EXT.h : EXT.h + PLAF.yB + 14; const g = c.getContext('2d');
    yield;
    /* (la réponse est demandée dès la création : elle est presque toujours là ; sinon on l'attend 1,5 s au plus) */
    const t0 = performance.now(); while (plafondPret === null && performance.now() - t0 < 1500) yield;
    const pr = plafondPret;
    if (pr && pr.im.naturalWidth === LX && pr.im.naturalHeight === c.height) { g.drawImage(pr.im, 0, 0); sortie.prepare = true; }
    else yield* (PLAF2 ? plafondPeintV2(g) : plafondPeint(g));
    /* P4 bis : une étape LOURD (voir lavis.js : le plafond préparé, 2496 x 430, posé par le processus graphique) */
    yield LOURD;
    if (!PLAF2) verriereHaut(g);
    sortie.c = c;
  }
  /* la lampe détourée achève la lampe de la photo : son abat-jour (sa partie haute), la douille, le câble */
  function lampeHaut(g) {
    if (vl && vl.reel && LAMPE_T) {
      const R = vl.reperes, aj = R.abat_jour || [.0115, .5498, .9853, 1], k = LAMPE_T.l / ((aj[2] - aj[0]) * vl.w);
      const cx = (aj[0] + aj[2]) / 2 * vl.w, xs = EXT.g + LAMPE_T.x - cx * k;
      /* le bord arrière de l'abat-jour, au milieu (où le noir rencontre l'émail blanc, à 0,838 de la hauteur de l'image),
         tombe sur la 6e rangée de la photo, où la photo montre le même bord ; on coupe juste au-dessus */
      const yb = .838 * vl.h, Y = sy => EXT.h + 6 + (sy - yb) * k;
      const sCoupe = yb - 2 / k, sHaut = ((R.rosace ? R.rosace[1] : 0) + .13) * vl.h;   /* sous la rosace : le câble seul */
      g.drawImage(vl.image, 0, sHaut, vl.w, sCoupe - sHaut, xs, Y(sHaut), vl.w * k, (sCoupe - sHaut) * k);
      /* le câble, prolongé jusqu'en haut (la rosace est au plafond, hors du cadre) : la tranche du câble, étirée */
      const cxC = (R.rosace ? R.rosace[0] : .4984) * vl.w;
      g.drawImage(vl.image, cxC - 8, sHaut + 2, 16, 4, EXT.g + LAMPE_T.x - cx * k + (cxC - 8) * k, 0, 16 * k, Y(sHaut) + 1);
    }
  }
  /* démarrage (dixième passe) : le mur de J6 n'est plus calculé au démarrage (0,2 s, plus sur une machine chargée : le
     film ne démarrait plus quand on l'ouvrait dans l'atelier). Il se calcule en tâches de quelques millisecondes pendant
     les temps morts ; en attendant, le haut de la pièce est un prolongement simple (la couleur moyenne de la pierre,
     plus sombre en montant, le haut de la photo en miroir, la lampe), puis les photos de la table sont repeintes. */
  let HAUT = null;
  /* J2 : la lampe détourée, posée dans les coordonnées de la photo (px de la photo = ox + k * px de la lampe) : la même
     correspondance que dans hautPierre ; sans lampe dans la photo, au-dessus de la planche, à l'échelle de la photo */
  const LAMPE_PHOTO = (() => {
    if (!(vl && vl.reel)) return null;
    const R = vl.reperes, aj = R.abat_jour || [.0115, .5498, .9853, 1], cx = (aj[0] + aj[2]) / 2 * vl.w, yb = .838 * vl.h;
    /* L1 : en deux plans, la lampe détourée (dehors, allumage) est posée sur celle de la table seule : même largeur
       d'abat-jour, même centre, bas de l'abat-jour sur le sien */
    if (LAMPE2) { const k = LAMPE2.l / ((aj[2] - aj[0]) * vl.w); return { k, ox: LAMPE2.x - cx * k, oy: LAMPE2.bas - (R.bas_abat_jour || .9931) * vl.h * k }; }
    const lx = LAMPE_T ? LAMPE_T.x : plC0[0] + 30, l = LAMPE_T ? LAMPE_T.l : plL0 * .25, k = l / ((aj[2] - aj[0]) * vl.w);
    return { k, ox: lx - cx * k, oy: (LAMPE_T ? 6 : plC0[1] - plL0 * .42) - yb * k };
  })();
  /* N9 (quatorzième passe) : la lampe haute définition (lampe-atelier) remplace celle de la photo partout où on la voit de
     près, et c'est la même que dehors (J2, LAMPE_PHOTO) : une seule lampe à toutes les distances. Sa pose (pixels de la
     photo = ox + k x pixels de la lampe) est calculée sur la silhouette mesurée de l'abat-jour de la photo (masqueLampe) */
  const LAMPE_HD = DEUX && LAMPE_PHOTO && vl && vl.reel && !new URLSearchParams(location.search).has('sansN9') ? { mesure: null, pose: null } : null;
  const MQ = {};
  function poserLampeHD() {
    const R = vl.reperes, aj = R.abat_jour || [.0115, .5498, .9853, 1], ros = R.rosace || [.4984, .0069], M = LAMPE_HD.mesure;
    const k = 1.05 * M.l / ((aj[2] - aj[0]) * vl.w), ox = LAMPE2.cable - ros[0] * vl.w * k, oy = LAMPE2.bas - (R.bas_abat_jour || .9931) * vl.h * k;
    LAMPE_HD.pose = { k, ox, oy, l: 1.05 * M.l, cx: LAMPE2.cable };
    /* J2 : la lampe vue de dehors, la même, posée de même */
    LAMPE_PHOTO.k = k; LAMPE_PHOTO.ox = ox; LAMPE_PHOTO.oy = oy;
  }
  /* la lampe haute définition dans un contexte en coordonnées de la photo : le câble tressé prolongé jusqu'en haut du
     canevas (au-dessus de la photo, le plafond de la table), la lampe recadrée sous sa rosace (sa rosace flotterait sous
     le plafond), puis, allumée : un halo doux et chaud autour de l'ampoule (1,5 fois son rayon, 35 % au centre), un voile
     de lumière très léger dans l'abat-jour ; o.ombre : l'ombre douce de l'abat-jour sur les poutres juste au-dessus */
  function dessinerLampeHD(g, o = {}) {
    const P = LAMPE_HD && LAMPE_HD.pose; if (!P) return;
    const im = vl.image, W = vl.w, Hh = vl.h, k = P.k, R = vl.reperes, ros = R.rosace || [.4984, .0069], amp = R.ampoule || [.5106, .8614, .0786];
    const Y0 = Math.round(.124 * Hh), xc = ros[0] * W, yHaut = P.oy + Y0 * k;
    g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    if (o.ombre) {
      const cx = P.cx, cy = P.oy + .56 * Hh * k, rx = P.l * .9, ry = P.l * .42;
      g.save(); g.translate(cx, cy); g.scale(1, ry / rx);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, 'rgba(20,12,6,.16)'); gr.addColorStop(.55, 'rgba(20,12,6,.07)'); gr.addColorStop(1, 'rgba(20,12,6,0)');
      g.fillStyle = gr; g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore();
    }
    /* le câble, d'en haut du canevas jusqu'au haut de la lampe recadrée (une tranche du câble tressé, étirée) */
    const yTop = -EXT.h - 2;
    g.drawImage(im, xc - 7, Y0 + 14, 14, 20, P.ox + (xc - 7) * k, yTop, 14 * k, yHaut - yTop + 1);
    g.drawImage(im, 0, Y0, W, Hh - Y0, P.ox, yHaut, W * k, (Hh - Y0) * k);
    if (!o.eteinte) {
      const bx = P.ox + amp[0] * W * k, by = P.oy + amp[1] * Hh * k, br = amp[2] * W * k;
      g.globalCompositeOperation = 'screen';
      const h1 = g.createRadialGradient(bx, by, 0, bx, by, br * 1.5); h1.addColorStop(0, 'rgba(255,214,150,.35)'); h1.addColorStop(.45, 'rgba(255,206,140,.14)'); h1.addColorStop(1, 'rgba(255,200,130,0)');
      g.fillStyle = h1; g.fillRect(bx - br * 1.5, by - br * 1.5, br * 3, br * 3);
      /* le voile dans l'abat-jour : l'intérieur émaillé, sous le bord, à peine plus lumineux */
      const vy = P.oy + .94 * Hh * k, vrx = (aj => (aj[2] - aj[0]) * W * k * .46)(R.abat_jour || [.0115, .5498, .9853, 1]), vry = .07 * Hh * k;
      g.save(); g.translate(bx, vy); g.scale(1, vry / vrx); const h2 = g.createRadialGradient(0, 0, 0, 0, 0, vrx); h2.addColorStop(0, 'rgba(255,236,200,.10)'); h2.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = h2; g.fillRect(-vrx, -vrx, 2 * vrx, 2 * vrx); g.restore();
    }
    g.restore();
  }
  /* J7 (dixième passe) : le soleil bas du matin entre par la verrière de gauche (la photo de la table la montre au bord
     gauche ; le prolongement en miroir la double). Dans la verrière, un disque éblouissant bas, juste au-dessus des
     collines, et un léger voile de lumière sur les carreaux, sans éclat de cinéma ; dans la pièce, des nappes de lumière
     froide, obliques, découpées par les montants et la traverse de la verrière (leurs ombres), sur le plancher à gauche
     de la table et sur le bas du mur de pierre près de l'angle. Lumière froide et rasante à gauche, lampe chaude
     au-dessus : deux lumières. Peint une fois, en coordonnées de la photo prolongée, dans les deux poses de la table. */
  /* démarrage : peint pendant les temps morts, à demi-résolution (une lumière douce, floutée) */
  let SOLEIL_BAS = null, PIECE_FINIE = false, PIECE_REPOS = false;
  const faireSoleilBas = () => {
    if (!vt.reel || !LAMPE_T) return null;
    const c = document.createElement('canvas'); c.width = LX / 2; c.height = (vt.h + EXT.h + EXT.b) / 2; const g = c.getContext('2d');
    g.scale(.5, .5);
    const X = x => x + EXT.g, Y = y => y + EXT.h;
    /* le voile sur les carreaux de la verrière (le carreau haut, au-dessus de la traverse, et le bas) */
    g.save(); g.globalCompositeOperation = 'lighter';
    const vo = g.createRadialGradient(X(30), Y(118), 4, X(30), Y(118), 150);
    vo.addColorStop(0, 'rgba(255,250,236,.55)'); vo.addColorStop(.25, 'rgba(236,240,246,.2)'); vo.addColorStop(1, 'rgba(236,240,246,0)');
    /* L7 : le voile ne couvre que le verre de la verrière (à gauche du montant de 50 px, au-dessus du panneau d'acier à
       365 px : ses bords tombent sur l'acier), jamais en rectangle tranché dans le verre */
    /* O3 (quinzième passe) : avec la pièce de la version « poutres », le rectangle du voile (jusqu'au haut du canevas) couvrait
       aussi la poutre et le plafond au-dessus de la verrière : un pan éclairci, coupé net à x 50, se voyait en entrant. Le
       voile et le disque sont désormais découpés au verre du vantail gauche de cette photo (du haut de la verrière, relevé
       de (0, 78) à (55, 110), jusqu'au panneau d'acier à y 438 ; à droite, le montant du milieu) */
    if (PLAF2) { g.save(); g.beginPath(); g.moveTo(X(0), Y(77)); g.lineTo(X(55), Y(109)); g.lineTo(X(55), Y(438)); g.lineTo(X(0), Y(438)); g.closePath(); g.clip(); g.fillStyle = vo; g.fillRect(X(0), Y(70), 60, 372); }
    else g.fillStyle = vo, g.fillRect(0, 0, X(50), Y(365));
    /* le disque, posé sur l'horizon du carreau haut : coeur blanc, bord net, halo serré */
    const ds = g.createRadialGradient(X(30), Y(118), 0, X(30), Y(118), 24);
    ds.addColorStop(0, 'rgba(255,255,252,1)'); ds.addColorStop(.32, 'rgba(255,253,244,1)'); ds.addColorStop(.4, 'rgba(255,244,222,.75)'); ds.addColorStop(1, 'rgba(255,236,206,0)');
    g.fillStyle = ds; g.fillRect(X(4), Y(92), 52, 52);
    if (PLAF2) g.restore();
    /* la lumière froide qui entre par la verrière et rase le pilier et le mur de gauche (l'entrée cadre la verrière
       juste hors du bord gauche de l'écran : c'est ce voile qui la dit) */
    const rz = g.createRadialGradient(X(10), Y(170), 10, X(10), Y(170), 420);
    rz.addColorStop(0, 'rgba(214,226,244,.42)'); rz.addColorStop(.4, 'rgba(214,226,244,.14)'); rz.addColorStop(1, 'rgba(214,226,244,0)');
    /* L7 : sur tout le canevas (un rectangle plus petit que le dégradé laissait des bords nets) */
    g.globalCompositeOperation = 'screen'; g.fillStyle = rz; g.fillRect(0, 0, LX, vt.h + EXT.h + EXT.b);
    g.restore();
    /* les nappes : chaque carreau de la verrière se projette au sol en parallélogramme oblique (la lumière va vers la
       droite et un peu vers le fond) ; entre elles, l'ombre des montants et de la traverse */
    const t = document.createElement('canvas'); t.width = c.width; t.height = c.height; const tg = t.getContext('2d'); tg.scale(.5, .5);
    { const g = tg;
      const par = (x0, y0, L, H, sk, a) => { g.beginPath(); g.moveTo(X(x0), Y(y0)); g.lineTo(X(x0 + L), Y(y0 - L * .16)); g.lineTo(X(x0 + L + sk), Y(y0 - L * .16 + H)); g.lineTo(X(x0 + sk), Y(y0 + H)); g.closePath(); g.fillStyle = `rgba(226,234,246,${a})`; g.fill(); };
      /* le plancher, à gauche de la table : deux rangées (la traverse les sépare), trois carreaux (deux montants) */
      [[48, 600, .5], [52, 642, .42]].forEach(([y0x, y0, a], r) => { [0, 1, 2].forEach(i => par(y0x + i * 92 + r * 14, y0 - i * 14, 80, 34, 26, a * (1 - i * .18))); });
      /* le bas du mur, dans l'angle : des bandes inclinées, plus pâles (lumière rasante) */
      [0, 1].forEach(i => { g.beginPath(); const x = 258 + i * 40, y = 548; g.moveTo(X(x), Y(y)); g.lineTo(X(x + 26), Y(y)); g.lineTo(X(x + 46), Y(y - 120)); g.lineTo(X(x + 22), Y(y - 120)); g.closePath(); g.fillStyle = `rgba(230,236,246,${.26 - i * .08})`; g.fill(); });
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.save(); g.filter = 'blur(1.5px)'; g.globalCompositeOperation = 'soft-light'; g.drawImage(t, 0, 0); g.globalAlpha = .55; g.globalCompositeOperation = 'screen'; g.drawImage(t, 0, 0); g.restore();
    /* T2 (vingtième passe) : le canevas de travail des nappes (3,5 Mo sur téléphone) rend sa mémoire tout de suite, sans attendre
       le ramasse-miettes (mesuré : encore vivant à la route) */
    liberer(t);
    return c;
  };
  /* le prolongement provisoire du haut (sans aucune lecture de pixels) : la couleur moyenne du haut de la photo, plus
     sombre en montant, puis le haut de la photo en miroir, fondu, et la lampe ; le haut de la photo est réduit à un
     pixel pour la moyenne (sur la carte graphique) */
  const moyenne = (() => { const m = document.createElement('canvas'); m.width = 8; m.height = 1; const mg = m.getContext('2d'); mg.drawImage(srcPiece, 0, 0, vt.w, 40, 0, 0, 8, 1); return m; })();
  function hautSimple(g) {
    /* L1 : en deux plans, le plafond (rangées par bandes de 12 px en attendant la version fine) */
    /* M9 : en attendant le plafond peint (tâche « mur »), un aplat sombre, sans rangées étirées */
    if (DEUX) {
      /* M9 bis : avec la version « poutres », un aplat de la teinte de son plafond, au-dessus de la photo seulement */
      const hh = PLAF2 ? EXT.h : EXT.h + PLAF.yJ, go = g.createLinearGradient(0, 0, 0, hh); go.addColorStop(0, PLAF2 ? '#1c140d' : '#2a2018'); go.addColorStop(1, PLAF2 ? '#3a2a1c' : '#6b5a46'); g.fillStyle = go; g.fillRect(0, 0, LX, hh); if (!PLAF2) verriereHaut(g); return;
    }
    g.drawImage(moyenne, 0, 0, 8, 1, 0, 0, LX, EXT.h + 2);
    const go = g.createLinearGradient(0, 0, 0, EXT.h); go.addColorStop(0, 'rgba(24,18,12,.42)'); go.addColorStop(1, 'rgba(24,18,12,0)'); g.fillStyle = go; g.fillRect(0, 0, LX, EXT.h);
    const r = document.createElement('canvas'); r.width = LX; r.height = 60; const rg = r.getContext('2d');
    rg.translate(0, 60); rg.scale(1, -1); rg.drawImage(grand(), 0, 0, LX, 60, 0, 0, LX, 60); rg.setTransform(1, 0, 0, 1, 0, 0); rg.globalCompositeOperation = 'destination-in';
    const gr = rg.createLinearGradient(0, 0, 0, 60); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, '#000'); rg.fillStyle = gr; rg.fillRect(0, 0, LX, 60);
    if (LAMPE_T && !DEUX) {
      const a = EXT.g + LAMPE_T.x - LAMPE_T.l * .62, b = EXT.g + LAMPE_T.x + LAMPE_T.l * .62, e = LAMPE_T.l * .3, gx = rg.createLinearGradient(a - e, 0, b + e, 0), q = e / (b - a + 2 * e);
      gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(q, '#000'); gx.addColorStop(1 - q, '#000'); gx.addColorStop(1, 'rgba(0,0,0,0)');
      rg.globalCompositeOperation = 'destination-out'; rg.fillStyle = gx; rg.fillRect(a - e, 0, b - a + 2 * e, 60);
    }
    g.drawImage(r, 0, EXT.h - 60);
    if (!DEUX) lampeHaut(g);
    verriereHaut(g);
  }
  const peindre = c => { peindreDans(c, c.getContext('2d')); return c; };
  /* P4 bis : le plancher est tiré des dernières lignes de la photo prolongée (34 px, étirés en douze lames) ; ces lignes
     sont recopiées une fois dans une bande de 42 px. Dans WebKit, chaque tracé d'un morceau du grand canevas (2496 x 768)
     en faisait recopier le canevas entier par le processus graphique : les douze lames coûtaient 5 à 42 ms à chaque
     peinture de la pièce, et à chaque bande d'une peinture par bandes (mesuré par une relecture après chaque tracé).
     Les lames lisent les mêmes pixels, aux mêmes coordonnées décalées : le plancher est le même */
  let BANDE_SOL = null;
  const bandeSol = () => {
    const src = grand();
    if (BANDE_SOL && BANDE_SOL.src === src && BANDE_SOL.c.width) return BANDE_SOL;
    const y = Math.max(0, Math.floor(vt.h - 42)), h = Math.max(1, Math.min(src.height, Math.ceil(vt.h)) - y);
    const c = document.createElement('canvas'); c.width = src.width; c.height = h;
    c.getContext('2d').drawImage(src, 0, y, src.width, h, 0, 0, src.width, h);
    return (BANDE_SOL = { c, y, src });
  };
  const peindreDans = (c, g, b0 = 0, b1 = Infinity) => {
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(grand(), 0, EXT.h);
    /* J2 bis : dedans, la lampe et sa lumière sont dans la photo : le code n'y ajoute ni point lumineux ni halo */
    /* N1 : une source rendue (téléphone, pièce finie) n'est plus tirée */
    if (HAUT && HAUT.width) g.drawImage(HAUT, 0, 0); else if (EXT.h) hautSimple(g);
    /* J7 : le soleil bas, par la verrière (à demi-résolution) */
    if (SOLEIL_BAS && SOLEIL_BAS.width) g.drawImage(SOLEIL_BAS, 0, 0, LX, c.height);
    /* P4 bis : le plancher seulement si la bande peinte (b0 à b1) le touche */
    if (EXT.b && b1 > EXT.h + vt.h - 2 && b0 < EXT.h + vt.h + EXT.b + 1) {
      /* le plancher qui vient vers nous : la dernière bande de lames, de plus en plus étirée, un peu assombrie */
      const y0 = EXT.h + vt.h - 2, n = 12, B = bandeSol();
      for (let i = 0; i < n; i++) { const a = i / n, b = (i + 1) / n, ya = y0 + EXT.b * a * a, yb = y0 + EXT.b * b * b + 1; g.drawImage(B.c, 0, vt.h - 40 + 34 * a - B.y, LX, 34 / n + 1, 0, ya, LX, yb - ya); }
      const gr = g.createLinearGradient(0, y0, 0, y0 + EXT.b); gr.addColorStop(0, 'rgba(40,26,14,0)'); gr.addColorStop(1, 'rgba(40,26,14,.3)'); g.fillStyle = gr; g.fillRect(0, y0, LX, EXT.b + 2);
    }
    return c;
  };
  /* P4 (seizième passe) : peindre par bandes (une étape chacune), dans les tâches du plafond et du mur : d'un bloc, 6 ms */
  /* P4 bis : chaque bande est une étape LOURD (voir lavis.js) : dans WebKit, chacune coûtait 12 à 30 ms au processus graphique
     après l'étape (la pièce entière : 44 à 80 ms), pendant la conversation ; le plancher (bandeSol) en était l'essentiel */
  function* peindreEtapes(c, n = 4) {
    const g = c.getContext('2d');
    for (let i = 0; i < n; i++) {
      const y0 = Math.floor(c.height * i / n), y1 = Math.floor(c.height * (i + 1) / n);
      g.save(); g.beginPath(); g.rect(0, y0, c.width, y1 - y0); g.clip(); peindreDans(c, g, y0, y1); g.restore();
      yield LOURD;
    }
    return c;
  }
  const etendre = () => {
    const c = document.createElement('canvas'); c.width = LX; c.height = vt.h + EXT.h + EXT.b; c.className = 'ep atelier-img';
    c.style.width = LX + 'px'; c.style.height = c.height + 'px'; c.setAttribute('aria-hidden', 'true');
    return peindre(c);
  };
  /* J14 (dixième passe) : deux transformations par photo pendant le passage de la table à la planche. Le plateau et ce
     qui est dessous (pieds, plancher) gardent l'homographie du plateau (J13) ; tout ce qui est au-dessus du bord haut du
     plateau (mur, lampe, câble, verrière) reçoit une similitude sans rotation (zoom uniforme et translation) calée sur ce
     bord : le câble reste vertical, l'abat-jour horizontal, les joints droits. Chaque photo est donc coupée en deux
     calques le long du bord haut de son plateau : le haut (au-dessus du bord, son bas fondu sur une bande de BANDE px
     de la photo, entièrement au-dessus du bord : aucun pixel du plateau ne reçoit la similitude) posé par-dessus le bas
     (opaque jusqu'au-dessus de la bande, puis transparent : aucun pixel de la lampe ne reçoit l'homographie). */
  const BANDE = 12;
  const bordHaut = (p0, p1, ox, oy) => { const a = [p0[0] + ox, p0[1] + oy], b = [p1[0] + ox, p1[1] + oy], ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey); let nx = -ey / l, ny = ex / l; if (ny < 0) { nx = -nx; ny = -ny; } return { a, nx, ny }; };
  /* un dégradé perpendiculaire au bord : d est la distance signée au bord (négative au-dessus) */
  const degradeBord = (g, B, arrets) => { const gr = g.createLinearGradient(B.a[0] + B.nx * -40, B.a[1] + B.ny * -40, B.a[0] + B.nx * 40, B.a[1] + B.ny * 40); arrets.forEach(([d, al]) => gr.addColorStop(clamp((d + 40) / 80), `rgba(0,0,0,${al})`)); return gr; };
  const BT = bordHaut(planT[0], planT[1], EXT.g, EXT.h);
  /* L1 : en deux plans, la photo pleine est le fond : sa coupe haut et bas suit la ligne du sol (le mur au-dessus, posé
     comme un plan à 6 m ; le plancher dessous, posé comme le sol) ; la table seule garde la coupe au bord haut du plateau */
  const BTc = DEUX ? bordHaut([0, P2.ys], [vt.w, P2.ys], EXT.g, EXT.h) : BT;
  function couperBas(c, B = BTc, ox = 0, oy = 0) {
    /* le bas : opaque sous le bord et dans la bande, transparent au-dessus (3 px de fondu au-dessus de la bande) */
    const g = c.getContext('2d'); g.save(); g.globalCompositeOperation = 'destination-in'; g.translate(-ox, -oy);
    g.fillStyle = degradeBord(g, B, [[-(BANDE + 9), 0], [-(BANDE + 6), 1], [40, 1]]); g.fillRect(ox, oy, c.width, c.height); g.restore();
    return c;
  }
  /* N1 (quatorzième passe) : en deux plans, le calque du mur était une copie entière de la photo pleine (2496 x 1458, 14 Mo) :
     c'est désormais la photo pleine elle-même, posée dans la page (même image, même pose ; une copie de moins) */
  let tablePlein = etendre();
  let hautTable = DEUX ? tablePlein : document.createElement('canvas'); hautTable.className = 'ep atelier-img'; hautTable.setAttribute('aria-hidden', 'true');
  function peindreHaut() {
    /* L1 : en deux plans, le calque du mur est la photo du fond entière (son plancher passe sous le calque du plancher,
       qui suit la table) ; N1 : c'est la photo pleine elle-même, rien à recopier */
    if (DEUX) return;
    const h = Math.ceil(Math.max(BTc.a[1] + Math.abs(BTc.a[0] * BTc.nx / BTc.ny), BTc.a[1] + Math.abs((LX - BTc.a[0]) * BTc.nx / BTc.ny))) + 4;
    hautTable.width = LX; hautTable.height = Math.min(vt.h + EXT.h, h); hautTable.style.width = LX + 'px'; hautTable.style.height = hautTable.height + 'px';
    const g = hautTable.getContext('2d'); g.clearRect(0, 0, LX, hautTable.height); g.drawImage(table._plein, 0, 0);
    g.save(); g.globalCompositeOperation = 'destination-in';
    g.fillStyle = degradeBord(g, BTc, [[-40, 1], [-(BANDE + 3), 1], [-3, 0], [40, 0]]); g.fillRect(0, 0, LX, hautTable.height); g.restore();
  }
  const table = (() => { const c = etendre(); c._plein = tablePlein; return couperBas(c); })();
  /* L1 : en deux plans, le calque du bas est le plancher du fond seul (de la ligne du sol au bas du canevas) : posé par une
     homographie de sol, il ne doit contenir aucune rangée au-dessus de l'horizon (la carte graphique ne sait pas dessiner
     un élément qui passe derrière la caméra) */
  const Y0S = DEUX ? Math.max(0, Math.floor(EXT.h + P2.ys - BANDE - 14)) : 0, Y1S = EXT.h + vt.h + 2, YA0 = EXT.h + vt.h - 2;
  /* L1 : le tablier, le plancher entre le seuil de la porte et le bas de la photo (la photo ne le montre pas : il est
     derrière l'appareil qui l'a prise) : la bande « le plancher qui vient vers nous » du canevas plein (les dernières lames,
     de plus en plus étirées), posée comme le sol entre le bas de la photo et le seuil */
  const tablier = DEUX ? document.createElement('canvas') : null;
  function peindreBas() {
    /* N1 (quatorzième passe) : au repos (téléphone, loin de la pièce), rien n'est repeint ; le réveil repeint */
    if (PIECE_REPOS) return;
    const g = table.getContext('2d');
    if (table.width !== LX) table.width = LX;
    if (DEUX) { const h = Y1S - Y0S; if (table.height !== h) { table.height = h; table.style.height = h + 'px'; } }
    g.clearRect(0, 0, table.width, table.height); g.drawImage(tablePlein, 0, -Y0S); couperBas(table, BTc, 0, Y0S);
    if (typeof peindrePlafond === 'function' && PLAFP) peindrePlafond();   /* Y10 A */
    if (DEUX) {
      const h = tablePlein.height - YA0; tablier.width = LX; tablier.height = h; tablier.style.width = LX + 'px'; tablier.style.height = h + 'px';
      tablier.getContext('2d').drawImage(tablePlein, 0, -YA0);
    }
  }
  /* Y10 A (vingt-cinquième passe, 09/10/2026) : sur téléphone, le plafond en plan. Depuis L1, le plancher est un vrai plan du sol
     (son homographie suit la table) ; le plafond, lui, restait peint sur le mur du fond : en entrant, ses poutres grossissaient comme
     une photo qu'on agrandit au lieu de venir vers nous. Ici, les rangées au-dessus de la ligne du plafond (repère « plafond » de
     atelier-fond, et le plafond peint au-dessus de la photo) sont un calque à part, posé par l'homographie d'un plan horizontal :
     la même que celle du mur à la ligne du plafond (aucune couture), de plus en plus grande en venant vers nous ; les rangées
     derrière la caméra ne sont pas posées. Recadré en largeur autour du point de fuite (ce qu'un téléphone peut montrer : 1 520 px,
     4 Mo). Ordinateur inchangé */
  const PLAFP = TEL && DEUX && PLAF2 ? (() => {
    const c = document.createElement('canvas'); c.className = 'ep atelier-img'; c.setAttribute('aria-hidden', 'true');
    const xc = EXT.g + P2.Fx, xa = Math.max(0, Math.round(xc - 760)), xb = Math.min(LX, Math.round(xc + 760));
    return { c, xa, w: xb - xa, yl: EXT.h + PLAF2.plafond * vt.h, h: Math.ceil(EXT.h + PLAF2.plafond * vt.h + 4) };
  })() : null;
  function peindrePlafond() {
    if (!PLAFP || PIECE_REPOS) return;
    const { c, xa, w, h, yl } = PLAFP; if (c.width !== w) { c.width = w; c.style.width = w + 'px'; } if (c.height !== h) { c.height = h; c.style.height = h + 'px'; }
    const g = c.getContext('2d'); g.clearRect(0, 0, w, h); g.drawImage(tablePlein, -xa, 0);
    /* le bas : fondu de 8 px jusqu'à la ligne du plafond (dessous, c'est le mur, sur son propre calque) */
    g.save(); g.globalCompositeOperation = 'destination-in'; const gr = g.createLinearGradient(0, yl - 6, 0, yl + 2); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.restore();
  }
  if (DEUX) { tablier.className = 'ep atelier-img'; tablier.setAttribute('aria-hidden', 'true'); table.before(tablier); peindreBas(); }
  boite.appendChild(table); peindreHaut(); table.after(hautTable);
  /* L1 : la table seule (plan à 3 m), dans un canevas recadré sur elle (et sur sa lampe, jusqu'au plafond) : son ombre de
     contact sur le plancher, la table détourée, la lampe prolongée ; puis coupée comme l'était la photo de la table au bord
     haut du plateau : le bas (plateau, piètement, tabouret, panier, ombre) suit l'homographie du plateau, le haut (la
     lampe, son câble) la similitude sans rotation de J14 */
  const TS = DEUX ? (() => {
    let bx0, bx1, by1;
    if (P2.boite) { bx0 = P2.boite[0] * vt.w; bx1 = P2.boite[2] * vt.w; by1 = P2.boite[3] * vt.h; }
    else {
      /* sans boîte au manifeste : la boîte des pixels opaques, lue sur une copie réduite (quelques millisecondes) */
      const k = .25, c = document.createElement('canvas'); c.width = Math.round(vt.w * k); c.height = Math.round(vt.h * k); const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(srcTable, 0, 0, c.width, c.height);
      const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, x1 = 0, y1 = 0;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 60) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y > y1) y1 = y; }
      bx0 = x0 / k; bx1 = (x1 + 1) / k; by1 = (y1 + 1) / k;
    }
    if (LAMPE2) { bx0 = Math.min(bx0, LAMPE2.x - LAMPE2.l); bx1 = Math.max(bx1, LAMPE2.x + LAMPE2.l); }
    const x0 = Math.floor(EXT.g + bx0 - 60), x1 = Math.ceil(EXT.g + bx1 + 110), y0 = 0, y1 = Math.min(EXT.h + vt.h + EXT.b, Math.ceil(EXT.h + by1 + 50));
    return { x0, y0, w: x1 - x0, h: y1 - y0 };
  })() : null;
  /* l'ombre de contact (L1), dessinée en code sous la table : un voile d'ombre sous tout le piètement (la lampe est juste
     au-dessus, la planche porte son ombre au sol entre les pieds), une ombre plus dense et courte au contact de chaque
     pied, et une ombre plus longue vers la droite (la lumière basse de la verrière vient de la gauche). Les pieds : le
     repère « pieds », sinon le bas des pixels opaques (lu en tâche de fond, l'ombre est alors redessinée) */
  /* P4 (seizième passe) : les ellipses floues, faites une fois pour un jeu de pieds, sont gardées (de petits canevas) : la
     pièce éteinte les refaisait, 22 ms d'un bloc dans WebKit (l'ombre portée floue du canevas, calculée par le processeur) */
  const OMBRES = { cle: '', l: null };
  function ombreContact(g, pieds) {
    if (!pieds || !pieds.length) return;
    const cle = JSON.stringify(pieds);
    if (OMBRES.cle === cle && OMBRES.l) { OMBRES.l.forEach(([t, x, y]) => g.drawImage(t, x, y)); return; }
    const L = []; OMBRES.cle = cle; OMBRES.l = L;
    const ox = -TS.x0 + EXT.g, oy = -TS.y0 + EXT.h, xs = pieds.map(p => p[0]), xmin = Math.min(...xs), xmax = Math.max(...xs), ym = pieds.reduce((a, p) => a + p[1], 0) / pieds.length;
    /* une forme floue par l'ombre portée du canevas (hors du cadre, seule son ombre se voit) : partout la même.
       L4 (douzième passe) : chaque ellipse floue est faite dans un petit canevas à sa taille, puis posée : décalée de
       4000 px dans le grand canevas, l'ombre faisait calculer à Safari un flou sur une bande de plus de 4000 px de large
       (190 ms pour la pièce éteinte, d'un bloc, pendant la lecture du film) ; le résultat est le même */
    const flou = (b, col, [cx, cy, rx, ry]) => {
      const m = Math.ceil(1.5 * b + 2), w = Math.ceil(2 * rx + 2 * m), h = Math.ceil(2 * ry + 2 * m);
      const t = document.createElement('canvas'); t.width = w; t.height = h; const tg = t.getContext('2d', { willReadFrequently: true });
      tg.shadowColor = col; tg.shadowBlur = b; tg.shadowOffsetX = w; tg.fillStyle = '#000';
      tg.beginPath(); tg.ellipse(w / 2 - w, h / 2, rx, ry, 0, 0, Math.PI * 2); tg.fill();
      g.drawImage(t, cx - w / 2, cy - h / 2); L.push([t, cx - w / 2, cy - h / 2]);
    };
    const ell = (x, y, rx, ry) => [x + ox, y + oy, rx, ry];
    flou(26, 'rgba(22,13,6,.34)', ell((xmin + xmax) / 2 + 10, ym - 14, (xmax - xmin) / 2 + 40, 30));
    pieds.forEach(([x, y]) => {
      flou(10, 'rgba(18,11,5,.30)', ell(x + 34, y + 2, 46, 8));
      flou(3, 'rgba(12,7,3,.58)', ell(x + 3, y + 1, 18, 4.5));
    });
  }
  const tsPlein = DEUX ? document.createElement('canvas') : null, tsBas = DEUX ? document.createElement('canvas') : null, tsHaut = DEUX ? document.createElement('canvas') : null;
  /* L1 : la lampe de la table seule pend devant le haut de la planche (son abat-jour est sous le bord haut du plateau) :
     posée avec le plateau, elle aurait été déformée par l'homographie du passage et couverte par la planche nette (J15).
     Elle a donc son calque : la lampe et son câble, découpés là où la table seule diffère de la photo de la table (qui
     montre, à cet endroit, la planche sans la lampe : sa lampe à elle pend plus haut) ; sous elle, dans la table seule, la
     planche de la photo de la table. En entrant, elle suit la table ; pendant le passage vers la planche, elle monte et
     sort par le haut du cadre (la caméra passe sous elle), droite. */
  const tsLampe = DEUX ? document.createElement('canvas') : null;
  const LB = DEUX ? (() => { const x0 = Math.floor(LAMPE2.x - LAMPE2.l / 2 - 14), x1 = Math.ceil(LAMPE2.x + LAMPE2.l / 2 + 14), y1 = Math.ceil(LAMPE2.bas + 16); return { x0, x1, y0: -EXT.h, y1, w: x1 - x0, h: y1 + EXT.h }; })() : null;
  function masqueLampe() {
    /* dans la boîte de la lampe (coordonnées de la photo, y >= 0) : 1 là où la table seule s'écarte de la photo de la table
       (la lampe, son câble), 0 sur la planche commune ; adouci d'un pixel */
    const w = LB.w, h = LB.y1, a = document.createElement('canvas'), b = document.createElement('canvas'); a.width = b.width = w; a.height = b.height = h;
    const ga = a.getContext('2d', { willReadFrequently: true }), gb = b.getContext('2d', { willReadFrequently: true });
    ga.drawImage(srcTable, LB.x0, 0, w, h, 0, 0, w, h); gb.drawImage(vt.image, LB.x0, 0, w, h, 0, 0, w, h);
    const da = ga.getImageData(0, 0, w, h).data, db = gb.getImageData(0, 0, w, h).data, m = gb.createImageData(w, h), dm = m.data;
    for (let i = 0; i < da.length; i += 4) {
      const e = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
      dm[i + 3] = da[i + 3] < 40 ? 0 : 255 * clamp((e - 70) / 60);
    }
    /* N9 (quatorzième passe) : la silhouette réelle de l'abat-jour de la photo, mesurée sur ce masque (le repère « abat_jour »
       du manifeste déborde de 60 px à gauche : 185 px au lieu de 125) : la largeur et le milieu de sa rangée la plus large */
    if (LAMPE_HD && !LAMPE_HD.mesure) {
      /* rangée par rangée, la plage continue du masque qui contient l'axe du câble (trous de 3 px tolérés) */
      let best = 0, bx0 = 0, bx1 = 0; const xc = Math.round(LAMPE2.cable - LB.x0), on = (x, y) => dm[(y * w + x) * 4 + 3] > 128;
      for (let y = Math.max(0, Math.round(LAMPE2.bas - 60)); y < h; y++) {
        if (!on(xc, y) && !on(xc - 1, y) && !on(xc + 1, y)) continue;
        let x0 = xc, x1 = xc, trou = 0;
        for (let x = xc - 1; x >= 0; x--) { if (on(x, y)) { x0 = x; trou = 0; } else if (++trou > 3) break; }
        trou = 0; for (let x = xc + 1; x < w; x++) { if (on(x, y)) { x1 = x; trou = 0; } else if (++trou > 3) break; }
        if (x1 - x0 + 1 > best) { best = x1 - x0 + 1; bx0 = x0; bx1 = x1; }
      }
      if (best > 20) { LAMPE_HD.mesure = { l: best, cx: LB.x0 + (bx0 + bx1 + 1) / 2 }; poserLampeHD(); }
    }
    const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').putImageData(m, 0, 0);
    const d = document.createElement('canvas'); d.width = w; d.height = h; const dg = d.getContext('2d');
    /* adouci et un peu élargi (le bord de l'abat-jour garde ses pixels mêlés) */
    /* N9 : élargi de 4 px (avant : 1) : avec la nouvelle lampe, l'ancienne silhouette et sa frange (le vert du détourage, un
       liseré clair) sont entièrement remplacées par la planche de la photo de la table, qui est derrière */
    if (LAMPE_HD) { for (let dy = -4; dy <= 4; dy += 2) for (let dx = -4; dx <= 4; dx += 2) if (dx * dx + dy * dy <= 20) dg.drawImage(c, dx, dy); }
    else { dg.drawImage(c, 0, 0); dg.drawImage(c, -1, 0); dg.drawImage(c, 1, 0); dg.drawImage(c, 0, -1); dg.drawImage(c, 0, 1); }
    liberer(a, b, c);
    return d;
  }
  /* P4 bis : par étapes LOURD (voir lavis.js) : sur téléphone, le réveil de la pièce (N2, au croisement) la repeignait d'un
     bloc (9 à 12 ms de script, plus le processus graphique) pendant la marche ; peindreTableSeule la mène d'une traite. Entre
     deux étapes, la pièce a pu se rendormir (N1) : la suite attend alors le prochain réveil */
  function peindreTableSeule(pieds) { for (const _ of peindreTableSeuleEtapes(pieds)) { /* rien */ } }
  function* peindreTableSeuleEtapes(pieds) {
    if (!DEUX || PIECE_REPOS) return;
    tsPlein.width = TS.w; tsPlein.height = TS.h;
    const g = tsPlein.getContext('2d'); g.clearRect(0, 0, TS.w, TS.h);
    ombreContact(g, pieds);
    g.drawImage(srcTable, EXT.g - TS.x0, EXT.h - TS.y0);
    /* la lampe de la table seule a son abat-jour entier : seul son câble est prolongé jusqu'en haut du canevas (le
       plafond est au-dessus de la photo, à la profondeur de la table), une tranche du haut du câble, étirée */
    { const cx = LAMPE2.cable, y0 = EXT.h - TS.y0; g.drawImage(srcTable, cx - 6, 1, 12, 3, EXT.g - TS.x0 + cx - 6, 0, 12, y0 + 2); }
    yield LOURD; if (PIECE_REPOS) { if (TEL) liberer(tsPlein); return; }
    /* L4 : la table avec sa lampe (pour la pièce éteinte) est tracée depuis l'image d'origine (tableSeuleSur) */
    /* le calque de la lampe, et la table sans elle (la planche de la photo de la table à sa place) */
    const mq = MQ.c || (MQ.c = masqueLampe()), ox = EXT.g - TS.x0, oy = EXT.h - TS.y0;
    if (LAMPE_HD && LAMPE_HD.mesure) {
      /* N9 (quatorzième passe) : la lampe du gros plan est la lampe haute définition (lampe-atelier, 611 x 873), posée sur
         celle de la photo (abat-jour 5 % plus large que sa silhouette, bas de l'abat-jour à y 0,172, axe du câble x 0,509),
         son câble tressé prolongé jusqu'en haut ; son calque est à une densité de 3 (2,2 sur téléphone) pixels par pixel de
         la photo : la lampe n'y est jamais agrandie (0,66 de sa taille d'origine au plus), réduite avec un lissage de haute
         qualité */
      const KL = TEL ? 2.2 : 3;
      tsLampe.width = Math.round(LB.w * KL); tsLampe.height = Math.round(LB.h * KL); tsLampe.style.width = LB.w + 'px'; tsLampe.style.height = LB.h + 'px';
      const gl = tsLampe.getContext('2d'); gl.setTransform(1, 0, 0, 1, 0, 0); gl.clearRect(0, 0, tsLampe.width, tsLampe.height);
      gl.setTransform(KL, 0, 0, KL, -LB.x0 * KL, EXT.h * KL);
      dessinerLampeHD(gl, { ombre: true });
      gl.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      tsLampe.width = LB.w; tsLampe.height = LB.h; tsLampe.style.width = LB.w + 'px'; tsLampe.style.height = LB.h + 'px';
      const gl = tsLampe.getContext('2d'); gl.clearRect(0, 0, LB.w, LB.h);
      gl.drawImage(tsPlein, LB.x0 + ox, oy - EXT.h, LB.w, LB.h, 0, 0, LB.w, LB.h);
      /* le câble au-dessus de la photo reste entier ; dans la photo, seule la lampe (le masque) */
      { const M = document.createElement('canvas'); M.width = LB.w; M.height = LB.h; const mg = M.getContext('2d'); mg.fillStyle = '#000'; mg.fillRect(0, 0, LB.w, EXT.h); mg.drawImage(mq, 0, EXT.h);
        gl.save(); gl.globalCompositeOperation = 'destination-in'; gl.drawImage(M, 0, 0); gl.restore(); }
    }
    yield LOURD; if (PIECE_REPOS) { if (TEL) liberer(tsPlein); return; }
    /* P4 : lu par le processeur (il est aussi posé dans la pièce éteinte, lue par le processeur) */
    const t = MQ.t || (MQ.t = (() => { const t = document.createElement('canvas'); t.width = LB.w; t.height = LB.y1; const tg = t.getContext('2d', { willReadFrequently: true });
      tg.drawImage(vt.image, LB.x0, 0, LB.w, LB.y1, 0, 0, LB.w, LB.y1); tg.globalCompositeOperation = 'destination-in'; tg.drawImage(mq, 0, 0);
      /* N9 (quatorzième passe) : au-dessus du bord haut de la planche, la photo de la table montre sa propre lampe (un bout de
         câble et de douille, clair) : là, rien n'est remis (le mur du fond, derrière, se voit) ; seule la planche est remise */
      const pl = vts.reperes.planche;
      if (LAMPE_HD && pl) { const A = [pl[0][0] * vt.w - LB.x0, pl[0][1] * vt.h], B = [pl[1][0] * vt.w - LB.x0, pl[1][1] * vt.h], yE = x => A[1] + (B[1] - A[1]) * (x - A[0]) / (B[0] - A[0]) - .5;
        tg.globalCompositeOperation = 'destination-out'; tg.beginPath(); tg.moveTo(-1, -1); tg.lineTo(LB.w + 1, -1); tg.lineTo(LB.w + 1, yE(LB.w + 1)); tg.lineTo(-1, yE(-1)); tg.closePath(); tg.fill(); }
      return t; })());
    g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.fillRect(LB.x0 + ox, 0, LB.w, oy); g.drawImage(mq, LB.x0 + ox, oy); g.restore();
    g.drawImage(t, LB.x0 + ox, oy);
    /* N9 : sous la lampe, son ombre très diffuse sur le plateau de la planche (la lumière du jour vient de la gauche) */
    if (LAMPE_HD && LAMPE_HD.mesure) { const P = LAMPE_HD.pose; g.save(); g.translate(ox, oy); const cx = P.cx + P.l * .18, cy = LAMPE2.bas + P.l * .32, r = P.l * .75;
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, 'rgba(40,24,10,.10)'); gr.addColorStop(.6, 'rgba(40,24,10,.04)'); gr.addColorStop(1, 'rgba(40,24,10,0)');
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = gr; g.fillRect(cx - r, cy - r * .55, 2 * r, r * 1.1); g.restore(); }
    for (const [i, c] of [tsBas, tsHaut].entries()) {
      yield LOURD; if (PIECE_REPOS) { if (TEL) liberer(tsPlein); return; }
      c.width = TS.w; c.height = TS.h; c.style.width = TS.w + 'px'; c.style.height = TS.h + 'px';
      const cg = c.getContext('2d'); cg.clearRect(0, 0, TS.w, TS.h); cg.drawImage(tsPlein, 0, 0);
      cg.save(); cg.globalCompositeOperation = 'destination-in'; cg.translate(-TS.x0, -TS.y0);
      cg.fillStyle = degradeBord(cg, BT, i ? [[-40, 1], [-(BANDE + 3), 1], [-3, 0], [40, 0]] : [[-(BANDE + 9), 0], [-(BANDE + 6), 1], [40, 1]]);
      cg.fillRect(TS.x0, TS.y0, TS.w, TS.h); cg.restore();
    }
    /* N1 : sur téléphone, la table seule pleine n'est qu'une source (le bas, le haut et la lampe en sont tirés) */
    if (TEL) liberer(tsPlein);
  }
  if (DEUX) {
    [tsBas, tsHaut, tsLampe].forEach(c => { c.className = 'ep atelier-img'; c.setAttribute('aria-hidden', 'true'); });
    /* le tabouret aussi est posé au sol : son ombre de contact */
    if (P2.pieds && vts.reperes.bas_tabouret) P2.pieds = P2.pieds.concat([[vts.reperes.bas_tabouret[0] * vt.w, vts.reperes.bas_tabouret[1] * vt.h]]);
    peindreTableSeule(P2.pieds);
    hautTable.after(tsBas); tsBas.after(tsHaut); tsHaut.after(tsLampe);
    /* sans repère « pieds » : le bas des pixels opaques de la table seule, lu en tâche de fond, puis l'ombre redessinée */
    if (!P2.pieds) setTimeout(() => planifier({ nom: 'pieds', gen: (function* () {
      yield;
      const k = .5, w = Math.round(vt.w * k), h = Math.round(vt.h * k), c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(srcTable, 0, 0, w, h);
      const d = g.getImageData(0, 0, w, h).data; yield;
      const bas = new Float32Array(w).fill(-1); let ymax = 0;
      for (let x = 0; x < w; x++) for (let y = h - 1; y >= 0; y--) if (d[(y * w + x) * 4 + 3] > 110) { bas[x] = y; if (y > ymax) ymax = y; break; }
      /* les pieds : les colonnes dont le bas est dans les 14 % inférieurs de la table, regroupées, un point tous les 24 px */
      const seuil = ymax - .1 * h, pts = [];
      for (let x = 0; x < w; x += 12) if (bas[x] >= seuil) pts.push([x / k, bas[x] / k]);
      P2.pieds = pts.length ? pts : [[P2.Fx, P2.yf]];
      yield; peindreTableSeule(P2.pieds); if (ctx.redessiner) ctx.redessiner();
    })() }), 1200);
  }
  /* K1 (onzième passe) : le mur net pendant le passage de la table à la planche. La photo de près n'a, autour de sa planche,
     que des bandes de mur de 30 à 130 px (essai de prolongement fait de ses morceaux : une mosaïque de bouts de pierre,
     rejetée) ; la source nette du mur est donc la photo de la table elle-même, préparée à deux fois sa résolution
     (rééchantillonnage bicubique, puis masque flou) sur la partie que l'écran montre pendant le passage. Ce calque
     (hautNet) reprend exactement le calque du haut (même découpe au bord du plateau, même similitude sans rotation, même
     glissement) : il le remplace par un fondu de 0,35 s dès que l'agrandissement du mur dépasse 1,15 ; même image, plus
     nette : aucune double pierre, aucune frontière. La lampe en fait partie (elle reste celle de la photo de la table,
     droite). Préparé pendant les temps morts, après le mur de J6 ; tant qu'il n'est pas prêt, le calque du haut seul. */
  const hautNet = document.createElement('canvas'); hautNet.className = 'ep atelier-img'; hautNet.setAttribute('aria-hidden', 'true');
  hautTable.after(hautNet);
  /* K1 : la même chose pour la bande de mur à droite du plateau, sous le bord haut (elle reste visible à côté du CV
     pendant la seconde moitié du passage) : calque net du bas, posé comme la photo de la table (l'homographie du plateau) */
  const basNet = document.createElement('canvas'); basNet.className = 'ep atelier-img'; basNet.setAttribute('aria-hidden', 'true');
  table.after(basNet);
  const NET = { pret: false, r: null, rb: null, p0: 2, p1: 2, tache: null, murFini: false };
  /* K11 : avant 0,700, vue de dehors, la lampe de la photo doit paraître éteinte : une pièce rapportée sur la photo (son
     haut, la lampe et la planche), tirée de la photo pleine : l'intérieur de l'abat-jour et l'ampoule en gris sombre (comme
     la lampe éteinte de J2), la nappe chaude sur la planche et la lueur sur le mur autour de la lampe refroidies et un peu
     assombries ; bords fondus (hors des zones changées, c'est la photo elle-même). Son opacité est 1 - l'intensité de la
     lampe : à 0,700 la lampe s'allume (I2, 0,3 s) et la photo paraît telle quelle. Préparée pendant les temps morts. */
  const eteinteT = document.createElement('canvas'); eteinteT.className = 'ep atelier-img'; eteinteT.setAttribute('aria-hidden', 'true');
  /* L1 : en deux plans, la pièce éteinte de la table passe au-dessus de la table seule ; celle du fond (la lueur du mur
     autour de la lampe, refroidie) au-dessus du mur */
  const eteinteF = DEUX ? document.createElement('canvas') : null;
  if (DEUX) { tsHaut.after(eteinteT); eteinteF.className = 'ep atelier-img'; eteinteF.setAttribute('aria-hidden', 'true'); hautNet.after(eteinteF); }
  else hautNet.after(eteinteT);
  /* L1 : l'ordre des calques de la pièce en deux plans : le mur (la photo du fond entière) et ce qui s'y pose, puis le
     plancher et le tablier (qui suivent la table), puis la table seule, sa lampe, et sa pièce éteinte */
  if (DEUX) { const ordre = [hautTable, hautNet, eteinteF, PLAFP && PLAFP.c, table, tablier, tsBas, tsHaut, tsLampe, eteinteT].filter(Boolean); boite.prepend(ordre[0]); for (let i = 1; i < ordre.length; i++) ordre[i - 1].after(ordre[i]); }   /* Y10 A : le plafond */
  const ETEINTE = { r: [EXT.g + 380, EXT.h - 200, 690, 650], pret: false };
  /* L4 (douzième passe) : la table seule avec sa lampe (le contenu de tsAvecLampe), tracée directement depuis l'image
     d'origine dans un canevas lu par le processeur : lire tsAvecLampe (un canevas de la carte graphique) obligeait Safari
     à attendre la carte graphique, 190 ms d'un bloc pendant la lecture du film */
  /* P4 (seizième passe) : par étapes, chaque tracé rendu aussitôt (un pixel relu : dans WebKit, les tracés d'un canevas lu par
     le processeur attendent la première relecture, et la relecture de l'abat-jour les payait tous d'un bloc, 30 à 45 ms) ;
     le canevas de la table seule n'a que la taille de la pièce éteinte (w x h), et non plus celle de la table entière */
  const rendu = g => { try { g.getImageData(0, 0, 1, 1); } catch (e) { /* rien */ } };
  function* tableSeuleSurEtapes(g, dx, dy, w, h) {
    g.save(); g.translate(dx, dy);
    ombreContact(g, P2.pieds);
    g.restore(); rendu(g);
    yield;
    const sx = vts.w / vt.w, sy = vts.h / vt.h, cx = LAMPE2.cable, y0 = EXT.h - TS.y0;
    if (LAMPE_HD && LAMPE_HD.mesure && MQ.c && MQ.t) {
      /* N9 (quatorzième passe) : la pièce éteinte porte la nouvelle lampe (éteinte ensuite par le traitement de K11) :
         l'ancienne est remplacée par la planche de la photo de la table, comme dans le calque de la table */
      const ox = EXT.g - TS.x0, oy = EXT.h - TS.y0;
      /* P4 : lu par le processeur, comme le canevas où il est posé (poser un canevas de la carte graphique dans un canevas lu
         par le processeur fait attendre la carte graphique, dans WebKit) */
      const t = document.createElement('canvas'); t.width = w; t.height = h; const tg = t.getContext('2d', { willReadFrequently: true });
      /* P4 : la table seule, posée dans ce cadre par l'ouvrier (décodée sur le fil principal pour le processeur, elle prenait
         13 ms dans Chrome, 60 à 120 ms dans WebKit) ; sans lui, comme avant */
      const R = { fait: false, px: null };
      ouvrier('placer', { url: new URL(vts.src, location.href).href, w, h, t: [1, 0, 0, 1, dx, dy], s: [0, 0, vts.w, vts.h, ox, oy, vt.w, vt.h] }).then(r => { R.px = new Uint8ClampedArray(r.data); R.fait = true; }, () => { R.fait = true; });
      while (!R.fait) yield PAUSE;
      if (R.px) tg.putImageData(new ImageData(R.px, w, h), 0, 0);
      else { tg.translate(dx, dy); tg.drawImage(vts.image, 0, 0, vts.w, vts.h, ox, oy, vt.w, vt.h); tg.setTransform(1, 0, 0, 1, 0, 0); }
      tg.translate(dx, dy); rendu(tg);
      yield;
      tg.globalCompositeOperation = 'destination-out'; tg.drawImage(MQ.c, LB.x0 + ox, oy); tg.globalCompositeOperation = 'source-over';
      tg.drawImage(MQ.t, LB.x0 + ox, oy); rendu(tg);
      yield;
      g.drawImage(t, 0, 0); liberer(t); rendu(g);
      yield;
      g.save(); g.translate(dx, dy); g.translate(ox, oy); dessinerLampeHD(g, {}); g.restore(); rendu(g);
    } else {
      g.save(); g.translate(dx, dy);
      g.drawImage(vts.image, 0, 0, vts.w, vts.h, EXT.g - TS.x0, EXT.h - TS.y0, vt.w, vt.h);
      g.drawImage(vts.image, (cx - 6) * sx, sy, 12 * sx, 3 * sy, EXT.g - TS.x0 + cx - 6, 0, 12, y0 + 2);
      g.restore(); rendu(g);
    }
  }
  function* eteinteEtapes() {
    const [rx, ry, rw, rh] = ETEINTE.r, c = document.createElement('canvas'); c.width = rw; c.height = rh;
    const g = c.getContext('2d', { willReadFrequently: true });
    /* L1 : en deux plans, la pièce éteinte de la table est tirée de la table seule (le fond a la sienne, plus bas) */
    let tsc = null;
    if (DEUX) { tsc = document.createElement('canvas'); tsc.width = rw; tsc.height = rh; yield* tableSeuleSurEtapes(tsc.getContext('2d', { willReadFrequently: true }), -(rx - TS.x0), -(ry - TS.y0), rw, rh); yield; g.drawImage(tsc, 0, 0); rendu(g); }
    else { g.drawImage(tablePlein, rx, ry, rw, rh, 0, 0, rw, rh); rendu(g); }
    yield;
    /* en coordonnées de la photo : px = x + rx - EXT.g, py = y + ry - EXT.h */
    const X = px => px - (rx - EXT.g), Y = py => py - (ry - EXT.h);
    const amp = LAMPE2 ? [LAMPE2.b[0] * vt.w, LAMPE2.b[1] * vt.h] : LAMPE_T && LAMPE_T.b ? [LAMPE_T.b[0] * vt.w, LAMPE_T.b[1] * vt.h] : [702, 10];
    g.globalCompositeOperation = 'multiply';
    /* la lueur sur le mur, autour de la lampe */
    const g1 = g.createRadialGradient(X(amp[0]), Y(amp[1]), 0, X(amp[0]), Y(amp[1]), 300);
    g1.addColorStop(0, 'rgb(196,204,222)'); g1.addColorStop(.45, 'rgb(226,230,240)'); g1.addColorStop(1, '#fff');
    g.fillStyle = g1; g.fillRect(0, 0, rw, rh);
    /* P4 bis : les deux voiles chacun dans son étape (ensemble : 10 ms dans WebKit, la relecture attendant leur tracé) */
    rendu(g);
    yield;
    g.globalCompositeOperation = 'multiply';
    /* la nappe chaude sur la planche (747 ; 108 de la photo, plus large que haute) */
    g.save(); g.translate(X(747), Y(108)); g.scale(1, .62);
    const g2 = g.createRadialGradient(0, 0, 0, 0, 0, 290);
    g2.addColorStop(0, 'rgb(200,210,232)'); g2.addColorStop(.5, 'rgb(226,232,244)'); g2.addColorStop(1, '#fff');
    g.fillStyle = g2; g.fillRect(-400, -500, 800, 1000); g.restore();
    g.globalCompositeOperation = 'source-over'; rendu(g);
    yield;
    /* l'intérieur de l'abat-jour et l'ampoule : les pixels clairs du bas de la lampe, en gris sombre */
    /* L1 : en deux plans, l'intérieur de l'abat-jour et l'ampoule de la table seule (le bas de l'abat-jour, sous son
       émail gris clair, qui ne doit pas s'assombrir) */
    if (LAMPE2) {
      const hA = LAMPE2.bas - LAMPE2.haut, lx0 = Math.max(0, Math.floor(X(LAMPE2.x - LAMPE2.l * .55))), lx1 = Math.min(rw, Math.ceil(X(LAMPE2.x + LAMPE2.l * .55))), ly0 = Math.max(0, Math.floor(Y(LAMPE2.bas - hA * .32))), ly1 = Math.min(rh, Math.ceil(Y(LAMPE2.bas + 10)));
      const im = g.getImageData(lx0, ly0, lx1 - lx0, ly1 - ly0), d = im.data;
      for (let i = 0; i < d.length; i += 4) { const l = (d[i] + d[i + 1] + d[i + 2]) / 3, chaud = d[i] - d[i + 2]; if (l > 150 && (chaud > 12 || l > 200)) { const t = clamp((l - 150) / 100); d[i] = d[i] * (1 - t) + (60 + 34 * t) * t; d[i + 1] = d[i + 1] * (1 - t) + (58 + 32 * t) * t; d[i + 2] = d[i + 2] * (1 - t) + (56 + 30 * t) * t; } }
      g.putImageData(im, lx0, ly0);
    } else if (LAMPE_T) {
      const lx0 = Math.max(0, Math.floor(X(LAMPE_T.x - LAMPE_T.l * .6))), lx1 = Math.min(rw, Math.ceil(X(LAMPE_T.x + LAMPE_T.l * .6))), ly0 = Math.max(0, Math.floor(Y(-60))), ly1 = Math.min(rh, Math.ceil(Y(34)));
      const im = g.getImageData(lx0, ly0, lx1 - lx0, ly1 - ly0), d = im.data;
      for (let i = 0; i < d.length; i += 4) { const l = (d[i] + d[i + 1] + d[i + 2]) / 3; if (l > 120) { const t = clamp((l - 120) / 130); d[i] = d[i] * (1 - t) + (58 + 30 * t) * t; d[i + 1] = d[i + 1] * (1 - t) + (56 + 28 * t) * t; d[i + 2] = d[i + 2] * (1 - t) + (54 + 26 * t) * t; } }
      g.putImageData(im, lx0, ly0);
    }
    yield;
    /* bords fondus sur 40 px (le flou par l'ombre portée du canevas : il est le même dans tous les navigateurs) */
    g.globalCompositeOperation = 'destination-in';
    const m = masqueBordDoux(rw, rh, 40, 16);
    g.drawImage(m, 0, 0);
    /* L1 : la table seule reste découpée à sa silhouette (les dégradés ne débordent pas sur le vide autour d'elle) */
    if (DEUX) g.drawImage(tsc, 0, 0);
    g.globalCompositeOperation = 'source-over';
    eteinteT.width = rw; eteinteT.height = rh; eteinteT.style.width = rw + 'px'; eteinteT.style.height = rh + 'px';
    eteinteT.getContext('2d').drawImage(c, 0, 0);
    yield;
    /* L1 : la pièce éteinte du fond : la lueur du mur autour de la lampe, refroidie et un peu assombrie */
    if (DEUX) {
      const cf = document.createElement('canvas'); cf.width = rw; cf.height = rh; const gf = cf.getContext('2d');
      gf.drawImage(tablePlein, rx, ry, rw, rh, 0, 0, rw, rh);
      gf.globalCompositeOperation = 'multiply';
      const g1 = gf.createRadialGradient(X(amp[0]), Y(amp[1]), 0, X(amp[0]), Y(amp[1]), 320);
      g1.addColorStop(0, 'rgb(190,198,218)'); g1.addColorStop(.45, 'rgb(222,227,238)'); g1.addColorStop(1, '#fff');
      gf.fillStyle = g1; gf.fillRect(0, 0, rw, rh);
      gf.globalCompositeOperation = 'destination-in'; gf.drawImage(masqueBordDoux(rw, rh, 40, 16), 0, 0); gf.globalCompositeOperation = 'source-over';
      eteinteF.width = rw; eteinteF.height = rh; eteinteF.style.width = rw + 'px'; eteinteF.style.height = rh + 'px';
      eteinteF.getContext('2d').drawImage(cf, 0, 0);
      liberer(cf);
    }
    /* N1 (quatorzième passe) : les canevas de travail rendent leur mémoire tout de suite (sans attendre le ramasse-miettes) */
    liberer(c, tsc);
    ETEINTE.pret = true;
    if (ctx.redessiner) ctx.redessiner();
  }
  /* L4 : un masque rectangulaire à bords doux, flouté par l'ombre portée du canevas (shadowBlur, connu de tous les
     navigateurs, au lieu du filtre de canevas) */
  function masqueBordDoux(w, h, marge, flou) {
    /* L4 : lu par le processeur (il est posé dans des canevas lus par le processeur) */
    const m = document.createElement('canvas'); m.width = w; m.height = h; const mg = m.getContext('2d', { willReadFrequently: true });
    mg.shadowColor = '#000'; mg.shadowBlur = flou * 2; mg.shadowOffsetX = w + 100; mg.fillStyle = '#000'; mg.fillRect(marge - w - 100, marge, w - 2 * marge, h - 2 * marge);
    return m;
  }
  /* K1 : le masque flou par la carte graphique : un filtre SVG (flou gaussien, puis composition arithmétique
     (1 + a) x - a flou(x)), appliqué au tracé d'un canevas en une seule opération (quelques millisecondes) ; sans filtre
     (navigateur qui ne les connaît pas), le tracé reste tel quel */
  const filtres = { svg: null, ids: {} };
  function filtreNet(sigma, a, w, h) {
    const cle = sigma + '/' + a + '/' + w + 'x' + h;
    if (!filtres.ids[cle]) {
      if (!filtres.svg) { const ns = 'http://www.w3.org/2000/svg'; filtres.svg = document.createElementNS(ns, 'svg'); filtres.svg.setAttribute('width', '0'); filtres.svg.setAttribute('height', '0'); filtres.svg.setAttribute('aria-hidden', 'true'); filtres.svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; document.body.appendChild(filtres.svg); }
      const id = 'k1-net-' + Object.keys(filtres.ids).length;
      filtres.svg.insertAdjacentHTML('beforeend', `<filter id="${id}" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" x="-8" y="-8" width="${w + 16}" height="${h + 16}"><feGaussianBlur in="SourceGraphic" stdDeviation="${sigma}" result="f"/><feComposite in="SourceGraphic" in2="f" operator="arithmetic" k1="0" k2="${1 + a}" k3="${-a}" k4="0"/></filter>`);
      filtres.ids[cle] = `url(#${id})`;
    }
    return filtres.ids[cle];
  }
  /* K1 : le masque « mur » (alpha 1 sur la pierre, 0 sur le plateau dilaté de 3 px, sa règle et le piètement, le
     plancher, la lampe et à 6 px des bords du canevas plein ; bords adoucis), pour une région du canevas plein vue à
     l'échelle k (ox, oy : son coin) ; les côtés prolongés en miroir suivent leur original */
  const LBOX = LAMPE_PHOTO && vl ? [LAMPE_PHOTO.ox - 6, LAMPE_PHOTO.ox + vl.w * LAMPE_PHOTO.k + 6, LAMPE_PHOTO.oy + vl.h * LAMPE_PHOTO.k + 6] : null;
  /* P4 bis : le même masque par étapes LOURD (voir lavis.js), pour les tâches de fond : les formes, puis le flou par quatre
     bandes (chacune tirée de sa bande du canevas des formes, élargie de quatre écarts types de part et d'autre puis
     découpée : le flou y est le même), puis les bords. D'un bloc, le flou coûtait 13 à 14 ms au processus graphique de
     WebKit après l'étape (mesuré par une relecture) */
  function* masqueMurEtapes(w, h, ox, oy, k, sortie, n = 4) {
    const c = formesMur(w, h, ox, oy, k);
    yield LOURD;
    const m = document.createElement('canvas'); m.width = w; m.height = h; const mg = m.getContext('2d');
    const M = Math.ceil(4 * 2 * k) + 2;
    for (let i = 0; i < n; i++) {
      const y0 = Math.floor(h * i / n), y1 = Math.floor(h * (i + 1) / n), ya = Math.max(0, y0 - M), yb = Math.min(h, y1 + M);
      mg.save(); mg.beginPath(); mg.rect(0, y0, w, y1 - y0); mg.clip();
      mg.filter = `blur(${(2 * k).toFixed(2)}px)`; mg.drawImage(c, 0, ya, w, yb - ya, 0, ya, w, yb - ya); mg.filter = 'none';
      mg.restore();
      yield LOURD;
    }
    bordsMur(mg, w, h, ox, oy, k);
    liberer(c);
    sortie.m = m;
  }
  const formesMur = (w, h, ox, oy, k) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.setTransform(k, 0, 0, k, -ox * k, -oy * k); g.translate(EXT.g, EXT.h);
    g.globalCompositeOperation = 'destination-out';
    const cx = planT.reduce((a, p) => a + p[0], 0) / 4, cy = planT.reduce((a, p) => a + p[1], 0) / 4;
    /* L1 : en deux plans, le fond n'a ni planche ni piètement : tout son mur est du mur */
    if (!DEUX) {
      g.beginPath(); planT.forEach(([x, y], i) => { const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy), X = x + dx / l * 4, Y = y + dy / l * 4; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.fill();
      g.fillRect(335, 372, 665, vt.h + EXT.b);
    }
    /* le plancher : sous la ligne du pied du mur (548 px à l'angle, qui descend vers la droite et un peu vers la gauche),
       sur toute la largeur, côtés en miroir compris */
    g.beginPath(); g.moveTo(-EXT.g, vt.h + EXT.b);
    for (let x = -EXT.g; x <= vt.w + EXT.d; x += 16) { let px = x; if (px < 0) px = -1 - px; else if (px >= vt.w) px = 2 * vt.w - 1 - px; g.lineTo(x, 548 + Math.max(0, px - 270) * .0606 + Math.max(0, 270 - px) * .05); }
    g.lineTo(vt.w + EXT.d, vt.h + EXT.b); g.closePath(); g.fill();
    if (LBOX && !DEUX) g.fillRect(LBOX[0], -EXT.h - 10, LBOX[1] - LBOX[0], LBOX[2] + EXT.h + 10);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over';
    return c;
  };
  /* les bords du canevas plein : le flou du filtre y prendrait du vide (un liseré clair) */
  const bordsMur = (mg, w, h, ox, oy, k) => {
    mg.globalCompositeOperation = 'destination-out'; mg.fillStyle = '#000';
    const b0 = [-ox * k, -oy * k, (LX - ox) * k, (vt.h + EXT.h + EXT.b - oy) * k], e = 6 * k;
    mg.fillRect(0, 0, w, b0[1] + e); mg.fillRect(0, b0[3] - e, w, h); mg.fillRect(0, 0, b0[0] + e, h); mg.fillRect(b0[2] - e, 0, w, h);
    mg.globalCompositeOperation = 'source-over';
  };
  function masqueMur(w, h, ox, oy, k) {
    const c = formesMur(w, h, ox, oy, k);
    const m = document.createElement('canvas'); m.width = w; m.height = h; const mg = m.getContext('2d');
    mg.filter = `blur(${(2 * k).toFixed(2)}px)`; mg.drawImage(c, 0, 0); mg.filter = 'none';
    bordsMur(mg, w, h, ox, oy, k);
    liberer(c);   /* N1 : le canevas de travail rend sa mémoire tout de suite */
    return m;
  }
  /* K1 : le masque flou léger (rayon 1 px, 25 %) sur le mur de la photo pleine : la copie nette, découpée au masque du
     mur, posée sur la photo */
  function affinerPlein() { for (const _ of affinerPleinEtapes()) { /* rien */ } }
  /* P4 (seizième passe) : en trois étapes (le filtre, le masque, la pose) : d'un bloc, 7,5 ms dans Chrome */
  function* affinerPleinEtapes() {
    const sh = document.createElement('canvas'); sh.width = tablePlein.width; sh.height = tablePlein.height; const sg = sh.getContext('2d');
    /* P4 bis : des étapes LOURD (voir lavis.js) : peu de script, beaucoup pour le processus graphique de WebKit (le masque
       seul : 11 ms après l'étape) ; le filtre par bandes (traceFiltreEtapes), la découpe et la pose séparées */
    yield* traceFiltreEtapes(sg, tablePlein, [0, 0, sh.width, sh.height], sh.width, sh.height, filtreNet(1, .25, sh.width, sh.height));
    const om = {}; yield* masqueMurEtapes(sh.width, sh.height, 0, 0, 1, om); const mq = om.m;
    sg.globalCompositeOperation = 'destination-in'; sg.drawImage(mq, 0, 0);
    yield LOURD;
    tablePlein.getContext('2d').drawImage(sh, 0, 0);
    /* N1 : trois canevas de travail de 14 Mo chacun : rendus tout de suite */
    liberer(mq, sh);
  }
  /* K1 : le calque net, préparé sur le rectangle NET.r (pixels du canevas plein) : agrandi deux fois (bicubique), masque
     flou (rayon 1,6 px à cette échelle, 60 %) sur le mur seulement, puis la découpe du calque du haut (la même, à
     l'échelle) ; tout par la carte graphique */
  /* P4 bis : un tracé filtré (le calque net : agrandi deux fois, masque flou) par quatre bandes, chacune une étape LOURD (voir
     lavis.js) : chaque bande est tirée de sa part de la source, élargie de 12 pixels de part et d'autre (le filtre y voit
     les mêmes voisins : son flou ne porte pas à plus de 5 pixels), puis découpée. D'un bloc, le filtre coûtait 12 ms au
     processus graphique de WebKit (au premier tracé qui le suivait) */
  function* traceFiltreEtapes(g, img, src, w, h, filtre, n = 4, M = 12) {
    const k = h / src[3];
    for (let i = 0; i < n; i++) {
      const y0 = Math.floor(h * i / n), y1 = Math.floor(h * (i + 1) / n), ya = Math.max(0, (y0 - M) & ~1), yb = Math.min(h, y1 + M);
      g.save(); g.beginPath(); g.rect(0, y0, w, y1 - y0); g.clip();
      g.filter = filtre; g.drawImage(img, src[0], src[1] + ya / k, src[2], (yb - ya) / k, 0, ya, w, yb - ya); g.filter = 'none';
      g.restore();
      yield LOURD;
    }
  }
  /* P4 bis : chaque étape du calque net est LOURD (voir lavis.js : agrandissement bicubique, filtre, découpes) */
  function* netEtapes() {
    const r = NET.r; if (!r) return;
    const M = 8, wb = (r.w + 2 * M) * 2, hb = (r.h + 2 * M) * 2, src = [r.x - M, r.y - M, r.w + 2 * M, r.h + 2 * M];
    const base = document.createElement('canvas'); base.width = wb; base.height = hb; const bg = base.getContext('2d');
    bg.imageSmoothingEnabled = true; bg.imageSmoothingQuality = 'high'; bg.drawImage(tablePlein, ...src, 0, 0, wb, hb);
    yield LOURD;
    const sh = document.createElement('canvas'); sh.width = wb; sh.height = hb; const sg = sh.getContext('2d');
    sg.imageSmoothingEnabled = true; sg.imageSmoothingQuality = 'high';
    yield* traceFiltreEtapes(sg, tablePlein, src, wb, hb, filtreNet(1.6, .6, wb, hb));
    /* P4 bis : le masque, la découpe et la pose en trois étapes (d'un bloc : 22 ms au processus graphique de WebKit) */
    const om = {}; yield* masqueMurEtapes(wb, hb, r.x - M, r.y - M, 2, om); const mqn = om.m;
    sg.globalCompositeOperation = 'destination-in'; sg.drawImage(mqn, 0, 0); liberer(mqn);
    yield LOURD;
    bg.drawImage(sh, 0, 0);
    yield LOURD;
    const w2 = r.w * 2, h2 = r.h * 2;
    hautNet.width = w2; hautNet.height = h2; hautNet.style.width = w2 + 'px'; hautNet.style.height = h2 + 'px';
    const g = hautNet.getContext('2d'); g.drawImage(base, -2 * M, -2 * M);
    /* la découpe du calque du haut, à l'échelle du calque net */
    const B2 = { a: [(BTc.a[0] - r.x) * 2, (BTc.a[1] - r.y) * 2], nx: BTc.nx, ny: BTc.ny };
    const gr = g.createLinearGradient(B2.a[0] - B2.nx * 80, B2.a[1] - B2.ny * 80, B2.a[0] + B2.nx * 80, B2.a[1] + B2.ny * 80);
    [[-40, 1], [-(BANDE + 3), 1], [-3, 0], [40, 0]].forEach(([dd, al]) => gr.addColorStop(clamp((dd + 40) / 80), `rgba(0,0,0,${al})`));
    g.globalCompositeOperation = 'destination-in'; g.fillStyle = gr; g.fillRect(0, 0, w2, h2); g.globalCompositeOperation = 'source-over';
    NET.rPose = r;
    yield LOURD;
    /* le bas, à droite du plateau : même préparation, découpé comme la photo de la table (sous le bord haut) et adouci sur
       ses bords (c'est la même image, plus nette : un bord doux ne se voit pas) */
    const rb = NET.rb;
    if (rb) {
      const wb2 = (rb.w + 2 * M) * 2, hb2 = (rb.h + 2 * M) * 2, sb = [rb.x - M, rb.y - M, rb.w + 2 * M, rb.h + 2 * M];
      const b2 = document.createElement('canvas'); b2.width = wb2; b2.height = hb2; const b2g = b2.getContext('2d');
      b2g.imageSmoothingEnabled = true; b2g.imageSmoothingQuality = 'high'; b2g.drawImage(tablePlein, ...sb, 0, 0, wb2, hb2);
      /* P4 bis : le bas en quatre étapes LOURD, comme le haut (d'un bloc : le filtre et les découpes ensemble) */
      yield LOURD;
      const s2 = document.createElement('canvas'); s2.width = wb2; s2.height = hb2; const s2g = s2.getContext('2d');
      s2g.imageSmoothingEnabled = true; s2g.imageSmoothingQuality = 'high';
      yield* traceFiltreEtapes(s2g, tablePlein, sb, wb2, hb2, filtreNet(1.6, .6, wb2, hb2));
      { const om2 = {}; yield* masqueMurEtapes(wb2, hb2, rb.x - M, rb.y - M, 2, om2); s2g.globalCompositeOperation = 'destination-in'; s2g.drawImage(om2.m, 0, 0); liberer(om2.m); }
      b2g.drawImage(s2, 0, 0);
      yield LOURD;
      const w3 = rb.w * 2, h3 = rb.h * 2;
      basNet.width = w3; basNet.height = h3; basNet.style.width = w3 + 'px'; basNet.style.height = h3 + 'px';
      const g3 = basNet.getContext('2d'); g3.drawImage(b2, -2 * M, -2 * M);
      g3.globalCompositeOperation = 'destination-in';
      const B3 = { a: [(BTc.a[0] - rb.x) * 2, (BTc.a[1] - rb.y) * 2], nx: BTc.nx, ny: BTc.ny };
      const gb = g3.createLinearGradient(B3.a[0] - B3.nx * 80, B3.a[1] - B3.ny * 80, B3.a[0] + B3.nx * 80, B3.a[1] + B3.ny * 80);
      [[-40, 0], [-(BANDE + 9), 0], [-(BANDE + 6), 1], [40, 1]].forEach(([dd, al]) => gb.addColorStop(clamp((dd + 40) / 80), `rgba(0,0,0,${al})`));
      g3.fillStyle = gb; g3.fillRect(0, 0, w3, h3);
      const e = 24; [[0, 0, e, 0], [w3, 0, w3 - e, 0], [0, 0, 0, e], [0, h3, 0, h3 - e]].forEach(([xa, ya, xb, yb]) => { const l = g3.createLinearGradient(xa, ya, xb, yb); l.addColorStop(0, 'rgba(0,0,0,0)'); l.addColorStop(1, '#000'); g3.fillStyle = l; g3.fillRect(0, 0, w3, h3); });
      g3.globalCompositeOperation = 'source-over';
    }
    NET.rbPose = rb; NET.pret = true;
    if (ctx.redessiner) ctx.redessiner();
  }
  function planifierNet() {
    if (!NET.murFini || !NET.r || (NET.tache && !NET.tache.fini)) return;
    const dedansR = (a, b) => (!b) || (a && a.x <= b.x && a.y <= b.y && a.x + a.w >= b.x + b.w && a.y + a.h >= b.y + b.h);
    if (NET.rPose && dedansR(NET.rbPose, NET.rb) && NET.rPose.x <= NET.r.x && NET.rPose.y <= NET.r.y && NET.rPose.x + NET.rPose.w >= NET.r.x + NET.r.w && NET.rPose.y + NET.rPose.h >= NET.r.y + NET.r.h) return;
    NET.tache = { nom: 'net', gen: netEtapes() }; planifier(NET.tache);
  }
  /* la planche de près : son plateau (le calque du haut de J14 n'existe que pour la photo de la table : la bande de mur
     au-dessus du plateau de la photo de près ne fait que 33 px, et ses pierres ne sont pas celles de la photo de la table ;
     posée par-dessus, elle faisait une bande à bord dur ; elle ne vient qu'avec la photo de près entière, à la fin) */
  const QP = reperesPx(vp, 'planche');
  /* la similitude du calque du haut : elle envoie le bord haut du plateau de la photo (q0, q1) sur le bord du moment à
     l'écran (b0, b1), sans rotation ; dx : un décalage horizontal à l'écran */
  const simBord = (q0, q1, b0, b1, dx = 0) => { const k = Math.hypot(b1[0] - b0[0], b1[1] - b0[1]) / Math.hypot(q1[0] - q0[0], q1[1] - q0[1]), m = [(q0[0] + q1[0]) / 2, (q0[1] + q1[1]) / 2], mb = [(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2]; return [k, 0, mb[0] - k * m[0] + dx, 0, k, mb[1] - k * m[1], 0, 0, 1]; };
  /* dans l'ouverture, avant que la lumière n'entre : la pièce encore sombre ; puis la nappe de soleil (C1) */
  const sombre = el('<div class="couche atelier-sombre" aria-hidden="true"></div>'); boite.appendChild(sombre);
  const soleil = el('<div class="couche atelier-soleil" aria-hidden="true"></div>'); boite.appendChild(soleil);
  /* I2 : la lampe allumée, vue par la porte : une lumière chaude qui tombe d'en haut sur le plateau et le mur */
  const lampeDans = el('<div class="couche atelier-lampe" aria-hidden="true"></div>'); boite.appendChild(lampeDans);
  /* la même table hors de l'ouverture, pendant le fondu plein cadre (sous la boîte découpée, sous la couche 1 du monde qui s'efface) */
  /* N1 (quatorzième passe) : en deux plans, cette copie n'est jamais montrée (voir poserTable : visible seulement sans les
     deux plans) : elle n'est plus remplie (14 Mo de moins) */
  const tableHors = DEUX ? document.createElement('canvas') : etendre(); if (DEUX) { tableHors.className = 'ep atelier-img'; tableHors.setAttribute('aria-hidden', 'true'); tableHors.width = tableHors.height = 0; }
  tableHors.style.zIndex = 3; racine.insertBefore(tableHors, boite);
  /* J3 bis : la pièce de façade, préparée et accordée pendant les temps morts (jamais pendant une image) */
  /* K11 : la pièce de façade n'est plus montrée : elle n'est plus préparée */
  if (vt.reel && LAMPE_T && !K11) setTimeout(() => planifier({ nom: 'piece', gen: (function* () { yield; const pc = F.monde && F.monde.fac.piece ? F.monde.fac.piece() : null; yield; if (pc && !pc._accordee) accorderPiece(pc); })() }), 2000);
  /* démarrage (dixième passe) : le mur de J6 et la lumière de J7, en tâches de fond, puis les deux photos repeintes */
  if (vt.reel && LAMPE_T) {
    const sortieH = {};
    /* démarrage : jamais pendant le démarrage (1,6 s après la création) */
    /* M9 (treizième passe) : le plafond préparé posé au plus tôt (avant le reste du mur, plus long) : sans lui, si l'on
       arrive vite à l'atelier, le haut de la pièce n'était qu'un aplat sombre en attendant */
    (vp.reel && DEUX ? pret('plafond') : Promise.resolve(null)).then(r => {
      if (!r || HAUT || r.im.naturalWidth !== LX) return;
      /* T12 (07/10/2026) : sur l'iPhone, en lecture rapide depuis l'arrêt 2, la pièce se voyait par la porte (0,72) avec, au-dessus
         des poutres de la photo, l'aplat provisoire (hautSimple) : les solives du plafond n'arrivaient qu'après. Cette tâche
         (besoin 0,69) passait derrière une dizaine d'autres de besoin 0,66 à 0,69 (girouette, plaque, vitre, lavis...), et, le
         film en mouvement, la file ne travaille sur téléphone que pour les tâches imminentes. Son besoin est désormais 0,56 :
         elle passe avant l'arrêt 2 (imminente dès 0,53, et à l'arrêt 2 en tête de file), la pièce a son plafond peint bien
         avant que les portes s'ouvrent. Sur téléphone, le plafond préparé (2496 x 430 : 4 Mo) rend sa mémoire dès qu'il est
         posé dans la photo pleine (la tâche « mur » refait le sien ; rien d'autre ne le relit) */
      planifier({ nom: 'plafond', besoin: .56, gen: (function* () {
        if (HAUT) return;
        const c = document.createElement('canvas'); c.width = LX; c.height = PLAF2 ? EXT.h : EXT.h + PLAF.yB + 14; const g = c.getContext('2d');
        if (r.im.naturalHeight !== c.height) return;
        g.drawImage(r.im, 0, 0); if (!PLAF2) verriereHaut(g); yield;
        if (HAUT) return; HAUT = c;
        /* P4 bis : le bas et le haut repeints, chacun une étape LOURD (voir lavis.js) */
        yield* peindreEtapes(tablePlein); peindreBas(); yield LOURD; peindreHaut(); yield LOURD;
        if (TEL && HAUT === c) { liberer(c); HAUT = null; }
        if (!DEUX) { const g2 = tableHors.getContext('2d'); g2.clearRect(0, 0, tableHors.width, tableHors.height); g2.drawImage(tablePlein, 0, 0); }
        if (ctx.redessiner) ctx.redessiner();
      })() });
    });
    setTimeout(() => planifier({ nom: 'mur', gen: (function* () {
      /* L1 : en deux plans, le plafond au-dessus du fond (plus aucune pierre ajoutée : le fond est la seule source de pierre) */
      if (DEUX) yield* plafondEtapes(sortieH); else yield* hautPierreEtapes(sortieH);
      /* T2 : le plafond préparé (tâche « plafond », 2496 x 430 : 4 Mo), s'il est passé avant, rend sa mémoire : il est remplacé */
      if (HAUT && HAUT !== sortieH.c) liberer(HAUT);
      HAUT = sortieH.c; yield;
      SOLEIL_BAS = faireSoleilBas(); yield LOURD;
      /* K1 : le masque flou léger (rayon 1 px, 25 %) sur le mur de la photo pleine (pas sur le plateau, le piètement, le
         plancher, la lampe) ; il ne se voit que quand la photo est agrandie (au-delà de 1,1, en entrant), réduite il
         s'efface. Les trois copies affichées (table, haut, table hors de l'ouverture) en sont tirées. */
      yield* peindreEtapes(tablePlein);
      /* N1 (quatorzième passe) : sur téléphone, ce voile ne se voit pas (la photo n'y est jamais agrandie au-delà de 1,1) : il
         n'est pas fait (42 Mo de canevas de travail de moins au démarrage) */
      /* P4 bis : le voile, le bas et le haut : des étapes LOURD (voir lavis.js) ; la pièce éteinte qui suit relit un canevas :
         elle attend que le processus graphique ait fini (sinon 26 ms d'un bloc, mesuré dans WebKit) */
      if (!window.__sansK1 && !TEL) yield* affinerPleinEtapes(); yield LOURD;
      peindreBas(); yield LOURD;
      peindreHaut(); yield LOURD;
      if (!DEUX) { const g = tableHors.getContext('2d'); g.clearRect(0, 0, tableHors.width, tableHors.height); g.drawImage(tablePlein, 0, 0); }
      NET.murFini = true; planifierNet();
      /* K11 : la pièce éteinte, tirée de la photo pleine finale */
      if (K11) yield* eteinteEtapes();
      /* N1 (quatorzième passe) : sur téléphone, la pièce est finie : ses sources de préparation rendent leur mémoire (la photo
         prolongée, le plafond, la lumière basse : 15 Mo) ; la photo pleine, posée dans la page, les contient */
      if (TEL) { liberer(large, HAUT, SOLEIL_BAS); if (BANDE_SOL) { liberer(BANDE_SOL.c); BANDE_SOL = null; } PIECE_FINIE = true; }
      /* S2 (dix-neuvième passe, 07/10/2026) : sur téléphone, la photo pleine finie (le mur de la pièce, 2496 x 1458 : 14 Mo, le plus
         grand canevas du film) n'est plus jamais repeinte : elle devient une image (encodée hors du fil principal), posée à sa
         place ; tout ce qui la lit (le bas, le tablier, la pièce éteinte, le réveil de la pièce) la lit de même */
      if (TEL && DEUX) en_image(tablePlein, im => { const ancien = tablePlein; tablePlein = im; if (hautTable === ancien) hautTable = im; try { const i = tous.indexOf(ancien); if (i >= 0) tous[i] = im; } catch (e) { /* rien */ } if (ctx.redessiner) ctx.redessiner(); });
    })() }), 1600);
  }
  /* le mur de l'atelier, derrière la planche de près (quand la caméra recule, sur téléphone) */
  const mur = mk('<div class="couche atelier-mur"></div>');
  /* J6 : sur petit écran, quand la caméra recule, le mur autour de la photo de la planche n'est plus un aplat : c'est la
     pierre de la pièce (le mur de droite de la photo de la table, à l'échelle de la planche de près, dans l'ombre sous la
     planche, plus chaud en haut), posé avec la même transformation que la photo de la planche ; la photo de la planche
     fond sur lui par un bord large et irrégulier (masque) */
  let murPierre = null, murPlanifie = false;
  /* S2 (dix-neuvième passe, 07/10/2026) : la seconde cause d'arrêt sur l'iPhone, trouvée sur l'appareil (0,765 à 0,78, quand la
     caméra recule devant la planche). La pierre autour de la planche est un élément de 4128 x 2304 px (trois fois la photo) aux
     fonds dessinés (deux dégradés et l'image) : iOS lui donnait une surface à la densité de l'écran (plusieurs centaines de
     Mo). Sur téléphone, l'élément est six fois plus petit (688 x 384 px, ses fonds à l'échelle) et agrandi d'autant par sa
     transformation : la même pierre à l'écran (un mur dans l'ombre, sans détail fin), une surface de 10 Mo */
  const RED_MUR = TEL ? 6 : 1;
  const tailleMur = () => `width:${Math.round(vp.w * 3 / RED_MUR)}px;height:${Math.round(vp.h * 3 / RED_MUR)}px`;
  const fondsMur = (Wt, Ht, k, mx, my) => [`100% 100%, 100% 100%, ${Math.round(Wt * k / RED_MUR)}px ${Math.round(Ht * k / RED_MUR)}px`, `0 0, 0 0, ${Math.round((vp.w - mx) / RED_MUR)}px ${Math.round((vp.h - my) / RED_MUR)}px`];
  /* démarrage : préparée seulement sur petit écran, pendant les temps morts */
  /* M4 : la pierre et le bord préparés, posés comme faireMurPierre les poserait (mêmes dimensions, même lumière) */
  function murPierrePret(a, b) {
    const k = (Q.planche[1][0] - Q.planche[0][0]) / plL0 * .8, mx = 120, my = 400, Wt = Math.ceil((vp.w + 2 * mx) / k), Ht = Math.ceil((vp.h + 2 * my) / k);
    murPierre = el(`<div class="ep atelier-mur-pierre" aria-hidden="true" style="${tailleMur()}"></div>`);
    murPierre.style.backgroundImage = `radial-gradient(ellipse 40% 30% at 50% 34%, rgba(255,190,110,.32), rgba(255,190,110,0) 100%), linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(20,14,8,.45) 62%, rgba(20,14,8,.6) 100%), url(${a.url})`;
    { const [bs, bp] = fondsMur(Wt, Ht, k, mx, my); murPierre.style.backgroundSize = bs; murPierre.style.backgroundPosition = bp; } murPierre.style.backgroundRepeat = 'no-repeat';
    murPierre.style.backgroundColor = a.e.couleur || '#84623a';
    mur.appendChild(murPierre);
    pres._mqu = `url(${b.url})`; pres.style.webkitMaskSize = pres.style.maskSize = '100% 100%';
    if (ctx.redessiner) ctx.redessiner();
  }
  function* faireMurPierre() {
    if (murPierre || !(vt.reel && vp.reel && vp.reperes.cable_lampe_x !== undefined)) return;
    const k = (Q.planche[1][0] - Q.planche[0][0]) / plL0 * .8;   /* les pierres de la planche de près sont plus grandes */
    /* K2 (onzième passe) : plus de carreau en miroir 2 x 2 répété (une symétrie qui se voyait) ; une seule pierre, assemblée
       de grands morceaux du mur de droite de la photo de la table (quilterK2), sous un éclairage égal (les dégradés de la
       couche font la lumière), qui couvre la planche de près et 120 px de part et d'autre, 400 px au-dessus et au-dessous */
    const mx = 120, my = 400, Wt = Math.ceil((vp.w + 2 * mx) / k), Ht = Math.ceil((vp.h + 2 * my) / k);
    const E = new Float32Array(Wt * Ht * 3), A = new Float32Array(Wt * Ht);
    const moy = (() => { const m = document.createElement('canvas'); m.width = m.height = 1; const mg = m.getContext('2d', { willReadFrequently: true }); const y0 = PLAF2 ? Math.round(PLAF2.plafond * vt.h) + 30 : 4, hh = PLAF2 ? Math.max(120, Math.round((PLAF2.sol_droite || PLAF2.sol) * vt.h) - 24 - y0) : 536; mg.drawImage(grand(), EXT.g + 1045, y0, 325, hh, 0, 0, 1, 1); return mg.getImageData(0, 0, 1, 1).data; })();
    /* sous la planche, la pierre est dans son ombre (35 % plus sombre, un rien plus froide) */
    const yOmbre = (my + vp.h * .97) / k, kOmbre = y => 1 - .35 * sseg(y, yOmbre, yOmbre + 90 / k);
    yield* quilterK2({ W: Wt, H: Ht, E, A, xDeb: 0, gaucheRemplie: false, yBas: Ht, graine: 5303, lit: (x, y, c) => moy[c] * kOmbre(y) * (c === 2 ? 1 + .06 * (1 - kOmbre(y)) : 1), basRef: null, basForce: null });
    const t = document.createElement('canvas'); t.width = Wt; t.height = Ht; const tg = t.getContext('2d'), im = tg.createImageData(Wt, Ht);
    for (let j = 0; j < Wt * Ht; j++) { im.data[j * 4] = E[j * 3]; im.data[j * 4 + 1] = E[j * 3 + 1]; im.data[j * 4 + 2] = E[j * 3 + 2]; im.data[j * 4 + 3] = 255; }
    tg.putImageData(im, 0, 0);
    yield;
    murPierre = el(`<div class="ep atelier-mur-pierre" aria-hidden="true" style="${tailleMur()}"></div>`);
    t.toBlob(bb => { if (bb) { murPierre.style.backgroundImage = `radial-gradient(ellipse 40% 30% at 50% 34%, rgba(255,190,110,.32), rgba(255,190,110,0) 100%), linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(20,14,8,.45) 62%, rgba(20,14,8,.6) 100%), url(${URL.createObjectURL(bb)})`; { const [bs, bp] = fondsMur(Wt, Ht, k, mx, my); murPierre.style.backgroundSize = bs; murPierre.style.backgroundPosition = bp; } murPierre.style.backgroundRepeat = 'no-repeat'; murPierre.style.backgroundColor = `rgb(${Math.round(moy[0] * .8)},${Math.round(moy[1] * .8)},${Math.round(moy[2] * .8)})`; } }, 'image/jpeg', .9);
    mur.appendChild(murPierre); if (ctx.redessiner) ctx.redessiner();
    /* la photo de la planche fond sur la pierre : un bord de 70 à 100 px, irrégulier */
    const m = document.createElement('canvas'), mw = 344, mh = 192; m.width = mw; m.height = mh; const mg = m.getContext('2d'), md = mg.createImageData(mw, mh), N3 = bruit2(733);
    for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) { const e = Math.min(x, mw - 1 - x, y, mh - 1 - y) * 4, b = 16 + 10 * fbm(N3, x / 9, y / 9, 3); md.data[(y * mw + x) * 4 + 3] = 255 * clamp((e - 4) / b); }
    mg.putImageData(md, 0, 0);
    m.toBlob(bb => { if (bb) { pres._mqu = `url(${URL.createObjectURL(bb)})`; pres.style.webkitMaskSize = pres.style.maskSize = '100% 100%'; } });
  }
  const pres = new Image(); pres.className = 'ep atelier-pres'; pres.src = vp.src; pres.width = vp.w; pres.height = vp.h; pres.alt = ''; racine.appendChild(pres);
  /* L9 (douzième passe) : la pierre de la photo de près accordée à celle de la pièce. La photo de la planche a un mur plus
     clair et plus froid que la pièce (la photo de la table, et depuis L1 le fond) : au passage, la pierre « blanchissait ».
     On mesure, une fois, la couleur moyenne et le contraste de la pierre dans une même zone des deux photos (au-dessus de
     la planche, à gauche du câble ; dans la pièce, le mur derrière la planche, à gauche du câble), et on applique à la
     photo de près, sur sa pierre seulement (hors du plateau, bord fondu), une correction fixe par canal (gain autour de
     la moyenne, contraste) ; le plateau, sa lumière de lampe, la feuille et la page ne changent pas. Calculé en tâche de
     fond, par bandes ; la photo corrigée remplace la photo de près quand elle est prête. */
  const ACCORD = { pret: false, mesure: null };
  /* M4 (treizième passe) : la photo de près accordée, préparée (c-film/prets/planche-accordee.webp) : prise telle quelle si
     ses sources n'ont pas changé (décodée avant de remplacer l'autre) ; sinon le calcul ci-dessous */
  const tacheAccord = { nom: 'accord' };
  if (vp.reel && vt.reel) pret('planche-accordee').then(r => { if (!r || tacheAccord.fini || ACCORD.pret || r.im.naturalWidth !== vp.w) return; tacheAccord.fini = true; pres.src = r.url; ACCORD.pret = true; ACCORD.prepare = true; if (ctx.redessiner) ctx.redessiner(); });
  if (vp.reel && vt.reel) setTimeout(() => { if (!tacheAccord.fini) planifier(Object.assign(tacheAccord, { gen: (function* () {
    yield;
    const stats = (img, x0, y0, w, h) => {
      const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, x0, y0, w, h, 0, 0, c.width, c.height); const d = g.getImageData(0, 0, c.width, c.height).data, m = [0, 0, 0], q = [0, 0, 0]; let n = 0;
      for (let i = 0; i < d.length; i += 4) { for (let k = 0; k < 3; k++) { m[k] += d[i + k]; q[k] += d[i + k] * d[i + k]; } n++; }
      return { m: m.map(v => v / n), s: q.map((v, k) => Math.sqrt(Math.max(1, v / n - (m[k] / n) ** 2))) };
    };
    /* la pièce : la photo du fond en deux plans, sinon la photo de la table ; la zone : derrière la planche, à gauche du câble */
    /* la pierre de la pièce (le mur du fond, ou de la photo de la table) : sa couleur moyenne par tranche de luminosité
       (rapports r/L, v/L, b/L) ; la pierre de la photo de près, grise et froide sur ses côtés, prend, à luminosité égale,
       la teinte de la pierre de la pièce ; les pixels déjà chauds (la pierre sous la lampe, le bois, le laiton) gardent la
       leur (poids selon l'écart de teinte) */
    const srcP = DEUX ? srcPiece : vt.image, NB = 10, cs = new Float64Array(NB * 4);
    {
      const k = .25, c = document.createElement('canvas'); c.width = Math.round(vt.w * k); c.height = Math.round(vt.h * k); const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(srcP, 0, 0, c.width, c.height);
      const d = g.getImageData(0, 0, c.width, c.height).data, y0 = Math.round((PLAF2 ? PLAF2.plafond * vt.h + 24 : 60) * k), y1 = Math.round((DEUX ? P2.ys - 10 : 540) * k), x0 = Math.round((PLAF2 ? 160 : 140) * k);
      for (let y = y0; y < y1; y++) for (let x = x0; x < c.width; x++) { const i = (y * c.width + x) * 4, L = .3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2]; if (L < 8) continue; const b = Math.min(NB - 1, Math.floor(L / 256 * NB)); cs[b * 4] += d[i] / L; cs[b * 4 + 1] += d[i + 1] / L; cs[b * 4 + 2] += d[i + 2] / L; cs[b * 4 + 3]++; }
    }
    yield;
    /* les tranches vides prennent la teinte des voisines */
    const tein = []; for (let b = 0; b < NB; b++) tein.push(cs[b * 4 + 3] > 20 ? [cs[b * 4] / cs[b * 4 + 3], cs[b * 4 + 1] / cs[b * 4 + 3], cs[b * 4 + 2] / cs[b * 4 + 3]] : null);
    for (let b = 0; b < NB; b++) if (!tein[b]) { let j = 1; while (!tein[b] && j < NB) { tein[b] = tein[b - j] || tein[b + j] || null; j++; } }
    const teinte = L => { const t = clamp(L / 256 * NB - .5, 0, NB - 1.001), b = Math.floor(t), f = t - b, a = tein[b], c2 = tein[Math.min(NB - 1, b + 1)]; return [a[0] + (c2[0] - a[0]) * f, a[1] + (c2[1] - a[1]) * f, a[2] + (c2[2] - a[2]) * f]; };
    const qp = Q.planche;
    ACCORD.mesure = { teintes: tein.map(t => t && t.map(v => +v.toFixed(3))) };
    /* le masque de la pierre : tout sauf le plateau (élargi de 4 px), bord fondu sur 14 px */
    const W2 = vp.w, H2 = vp.h, mc = document.createElement('canvas'); mc.width = W2; mc.height = H2; const mg = mc.getContext('2d', { willReadFrequently: true });
    mg.fillStyle = '#000'; mg.fillRect(0, 0, W2, H2);
    mg.globalCompositeOperation = 'destination-out'; mg.shadowColor = '#000'; mg.shadowBlur = 14; mg.shadowOffsetX = W2 + 50;
    const ctr = [qp.reduce((a, p) => a + p[0], 0) / 4, qp.reduce((a, p) => a + p[1], 0) / 4];
    mg.beginPath(); qp.forEach(([x, y], i) => { const dx = x - ctr[0], dy = y - ctr[1], l = Math.hypot(dx, dy), X = x + dx / l * 4 - W2 - 50, Y = y + dy / l * 4; i ? mg.lineTo(X, Y) : mg.moveTo(X, Y); }); mg.closePath(); mg.fill();
    yield;
    const md = mg.getImageData(0, 0, W2, H2).data;
    yield;
    const c = document.createElement('canvas'); c.width = W2; c.height = H2; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(vp.image, 0, 0);
    /* L9 : après l'accord de teinte ci-dessus, la pierre de la photo de près restait plus claire et plus froide que celle
       de la pièce (mesuré à l'écran, la pierre à gauche de la planche à 0,760 et à l'arrêt 3 : 136 / 113 / 76 contre
       87 / 69 / 43 ; rapports r, v, b à 4,6 % et 9 % d'écart). Un gain fixe par canal, réglé en dur après cette mesure
       (hors du plateau, bord fondu), ramène sa teinte à celle de la pièce (écart sous 0,2 %) et la rend nettement moins
       lumineuse (elle reste 22 % plus claire : la lampe l'éclaire de plus près) ; le plateau, la feuille et la page ne
       changent pas (c12-l9-mesure.json) */
    /* M9 bis (treizième passe) : la pierre de la pièce « poutres » est plus grise et plus froide que celle de la version 1 ;
       gain réglé de nouveau après mesure (même endroit du mur, 0,760 et arrêt 3 : bleu à -20 % avec l'ancien gain) */
    const GAIN = PLAF2 ? [.642, .657, .727] : [.676, .655, .581];
    for (let y0 = 0; y0 < H2; y0 += 96) {
      const h = Math.min(96, H2 - y0), im = g.getImageData(0, y0, W2, h), d = im.data;
      for (let j = 0; j < W2 * h; j++) {
        const a = md[(y0 * W2 + j) * 4 + 3] / 255; if (a <= 0) continue;
        const i = j * 4, L = .3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2]; if (L < 6) continue;
        const tc = teinte(L), rbT = tc[0] - tc[2], rbP = (d[i] - d[i + 2]) / L, w = a * clamp((rbT - rbP) / Math.max(.05, rbT * .6));
        if (w > 0) for (let k = 0; k < 3; k++) { const v = L * tc[k]; d[i + k] = d[i + k] + (v - d[i + k]) * w; }
        for (let k = 0; k < 3; k++) d[i + k] *= 1 + (GAIN[k] - 1) * a;
      }
      g.putImageData(im, 0, y0);
      yield;
    }
    /* L4 (douzième passe) : la nouvelle photo est décodée (decode()) avant de remplacer l'ancienne : sinon le navigateur
       la décodait à sa première apparition (0,7776 : une image de 167 ms dans Chrome, à la première lecture) */
    c.toBlob(bb => {
      if (!bb) return;
      const u = URL.createObjectURL(bb), im2 = new Image(); let fait = false;
      const fin = () => { if (fait) return; fait = true; pres.src = u; ACCORD.pret = true; if (ctx.redessiner) ctx.redessiner(); };
      im2.src = u;
      if (im2.decode) im2.decode().then(fin, () => { im2.onload = fin; if (im2.complete) fin(); }); else im2.onload = fin;
    }, 'image/webp', .94);
  })() })); }, 2600);
  /* J15 (dixième passe) : la photo nette gagne partout où elle couvre. Dès le début du passage vers la planche, le plateau
     est rendu avec la photo de près (réduite, donc nette), posée par l'homographie du plateau : presPlateau est cette
     photo, découpée au quadrilatère du plateau (bord fondu de 10 px vers l'intérieur) ; la photo de la table ne sert plus
     qu'à ce que la planche ne couvre pas. Son masque est préparé pendant les temps morts. */
  const presPlateau = new Image(); presPlateau.className = 'ep atelier-pres'; presPlateau.src = vp.src; presPlateau.width = vp.w; presPlateau.height = vp.h; presPlateau.alt = ''; presPlateau.setAttribute('aria-hidden', 'true');
  pres.before(presPlateau);
  let plateauPret = false;
  /* P4 (seizième passe) : le masque est dessiné et encodé par l'ouvrier (l'encodage seul prenait 5 à 21 ms d'un bloc) ; sans
     ouvrier, la file comme avant */
  const masquePlateau = u => { presPlateau.style.webkitMaskImage = presPlateau.style.maskImage = u; presPlateau.style.webkitMaskSize = presPlateau.style.maskSize = '100% 100%'; plateauPret = true; };
  setTimeout(() => {
    const k = .5, w = Math.round(vp.w * k), h = Math.round(vp.h * k), q = QP.map(([x, y]) => [x * k, y * k]), c = [q.reduce((s, p) => s + p[0], 0) / 4, q.reduce((s, p) => s + p[1], 0) / 4];
    const pts = q.map(([x, y]) => { const dx = x - c[0], dy = y - c[1], l = Math.hypot(dx, dy); return [x - dx / l * 5, y - dy / l * 5]; });
    ouvrier('polygone', { w, h, pts, flou: 2.5, type: 'image/png' }).then(r => masquePlateau(`url(${URL.createObjectURL(r.blob)})`), planifierPlateau);
  }, 2400);
  const planifierPlateau = () => planifier({ nom: 'plateau', gen: (function* () {
    yield;
    const m = document.createElement('canvas'), k = .5; m.width = Math.round(vp.w * k); m.height = Math.round(vp.h * k); const mg = m.getContext('2d');
    const q = QP.map(([x, y]) => [x * k, y * k]), c = [q.reduce((s, p) => s + p[0], 0) / 4, q.reduce((s, p) => s + p[1], 0) / 4];
    const r = q.map(([x, y]) => { const dx = x - c[0], dy = y - c[1], l = Math.hypot(dx, dy); return [x - dx / l * 5, y - dy / l * 5]; });
    mg.filter = 'blur(2.5px)'; mg.fillStyle = '#000'; mg.beginPath(); r.forEach((p, i) => i ? mg.lineTo(p[0], p[1]) : mg.moveTo(p[0], p[1])); mg.closePath(); mg.fill();
    yield;
    m.toBlob(bb => { if (!bb) return; masquePlateau(`url(${URL.createObjectURL(bb)})`); });
  })() });
  /* J7 : sur la planche de près, la lumière rasante du soleil, venue de la gauche : elle effleure le bord gauche de la
     planche et le mur, en bandes obliques (les montants de la verrière), discrète ; elle est sous la feuille de dessin,
     le CV et le téléphone (qui restent blancs) et glisse très lentement avec le temps du film */
  const soleilPres = (() => {
    if (!vp.reel || vp.reperes.cable_lampe_x === undefined) return null;
    /* démarrage : peint pendant les temps morts, à demi-résolution ; vide jusque-là */
    const c = document.createElement('canvas'); c.width = Math.round(vp.w / 2); c.height = Math.round(vp.h / 2); c.className = 'ep atelier-soleil-pres'; c.setAttribute('aria-hidden', 'true');
    c.style.width = vp.w + 'px'; c.style.height = vp.h + 'px';
    planifier({ nom: 'soleilPres', gen: (function* () { yield; peindreSoleilPres(c); })() });
    return c;
  })();
  function peindreSoleilPres(c) {
    const g = c.getContext('2d'), w = c.width, h = c.height;
    const t = document.createElement('canvas'); t.width = w; t.height = h; const tg = t.getContext('2d');
    /* trois bandes obliques, de plus en plus faibles vers la droite, la plus large au bord */
    [[-.04, .13, .34], [.11, .06, .2], [.19, .035, .1]].forEach(([u, l, a]) => {
      tg.beginPath(); tg.moveTo(w * u, 0); tg.lineTo(w * (u + l), 0); tg.lineTo(w * (u + l + .1), h); tg.lineTo(w * (u + .1), h); tg.closePath();
      const gr = tg.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, `rgba(228,236,248,${a * .7})`); gr.addColorStop(.5, `rgba(232,238,248,${a})`); gr.addColorStop(1, `rgba(228,236,248,${a * .55})`);
      tg.fillStyle = gr; tg.fill();
    });
    g.filter = 'blur(3px)'; g.drawImage(t, 0, 0); g.filter = 'none';
    /* L9 : la lumière rasante ne se pose que sur la planche ; sur la pierre (le bord gauche de la photo), elle la
       blanchissait (la « réverbération » vue au plan fixe) */
    const k = w / vp.w, q = Q.planche.map(([x, y]) => [x * k, y * k]);
    g.save(); g.globalCompositeOperation = 'destination-in'; g.fillStyle = '#000'; g.beginPath(); q.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); g.restore();
  }
  if (soleilPres) racine.appendChild(soleilPres);
  /* I2 : dedans, la pièce et la planche éclairées par la lampe (hors du cadre, au-dessus) : posée sur la photo, sous la
     feuille de dessin, la page blanche, le CV et le téléphone, qui restent blancs */
  const lampePres = el('<div class="couche atelier-lampe-pres" aria-hidden="true"></div>'); racine.appendChild(lampePres);
  let grav = null, gravT = null;
  if (graver) {
    const wrap = () => { const d = el(`<div class="ep gravure-mot" style="width:600px;height:200px"></div>`); d.appendChild(gravureCivikia(600, 200)); return d; };
    grav = wrap(); racine.appendChild(grav); gravT = wrap(); gravT.style.zIndex = 10; boite.appendChild(gravT);
  }
  /* la page blanche du bloc, sous la feuille */
  const page = document.createElement('canvas'); page.className = 'ep page-blanche'; page.setAttribute('aria-hidden', 'true'); racine.appendChild(page);
  /* la feuille de dessin : un canevas */
  const fc = document.createElement('canvas'); fc.className = 'ep feuille-dessin'; fc.setAttribute('aria-hidden', 'true'); racine.appendChild(fc);
  const fg = fc.getContext('2d');
  /* le crayon dessiné, couché sur la règle : un vrai bouton (arrêt 3, puis le crayon du visiteur) */
  const crayonOmbre = mk('<i class="ep crayon-ombre" style="width:200px;height:20px"></i>');
  const crayon = mk(`<button type="button" class="ep crayon-dessine" style="width:${vcd.w}px;height:${vcd.h}px" aria-label="Prendre le crayon"><img src="${vcd.src}" alt="" width="${vcd.w}" height="${vcd.h}" style="width:100%;height:100%"></button>`);
  const trace = mk('<canvas class="ep trace-visiteur" aria-hidden="true"></canvas>');
  /* Q1 (dix-septième passe, 07/10/2026) : la bulle mène à la page blanche de l'Atelier (plus de lien « # » ni de clic annulé) */
  /* P5 (19/10/2026, M3 du plan des passes du 18/10) : « Parler de mon projet » mène au contact de l'Atelier (avant : la page blanche ;
     P4 : le contact de Conseil, par un filet de commun/pages/accueil.js, retiré) ; le bouton de la barre pendant « Créer » (bouton.js)
     et la réplique du téléphone (proto3.js) mènent au même endroit */
  const bulle = mk('<a class="ep bulle-projet" href="/atelier/#contact" style="width:236px;height:46px">Parler de mon projet <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>');
  const coin = mk('<button type="button" class="ep coin" style="width:120px;height:120px;z-index:19" aria-label="Soulever la feuille"><i class="pli"></i></button>');
  const ecritA11y = mk('<p class="sr">Vous avez un projet ? Contactez-moi ! T.H.</p>');
  /* H7 : la surbrillance du prompt « Poser une question à Marianne » : un halo bleu clair qui respire très lentement,
     posé au-dessus du papier dans la perspective de la feuille (le papier en garde une version fixe, qui part avec la
     page quand elle se tourne) */
  const halo = mk('<div class="ep halo-prompt" aria-hidden="true" style="width:290px;height:52px"><i></i></div>');

  /* ---- le crayon dessiné : pointe et bout dans son image ---- */
  const cP = reperesPx(vcd, 'pointe') || [vcd.w * .02, vcd.h / 2];
  let cB = reperesPx(vcd, 'bout');
  if (!cB) {
    /* le bout : le pixel opaque le plus loin de la pointe */
    const k = Math.min(1, 300 / Math.max(vcd.w, vcd.h)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(vcd.w * k)); c.height = Math.max(1, Math.round(vcd.h * k));
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(vcd.image, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height).data; let best = 0; cB = [vcd.w, vcd.h / 2];
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 100) { const dd = (x / k - cP[0]) ** 2 + (y / k - cP[1]) ** 2; if (dd > best) { best = dd; cB = [x / k, y / k]; } }
  }
  /* le crayon de la main (main-crayon) : pointe, bout et prise, dans l'image de la main */
  const vmc = vis['main-crayon'], km = vmc.w / 1024;
  const mainP = reperesPx(vmc, 'pointe') || [CRAYON_MAIN.pointe[0] * km, CRAYON_MAIN.pointe[1] * km];
  const mainB = [mainP[0] + CRAYON_MAIN.u[0] * CRAYON_MAIN.long * km, mainP[1] + CRAYON_MAIN.u[1] * CRAYON_MAIN.long * km];
  const mainPrise = [mainP[0] + CRAYON_MAIN.u[0] * 250 * km, mainP[1] + CRAYON_MAIN.u[1] * 250 * km];

  /* ---- le téléphone : son vrai rapport ; l'idée à la plume (quatrième passe, D8 : on ne redessine plus le téléphone ni le CV) ---- */
  const corpsTel = reperesPx(vtel, 'corps');
  const bw = corpsTel[1][0] - corpsTel[0][0], bh = corpsTel[3][1] - corpsTel[0][1], aspTel = bw / bh;
  const fe = F.feuille;
  const idee = dessinIdee();
  const im = { sceau: null, village: null, glyphe: null, esquisse: null };
  Promise.all([charger('../commun/img/sceau-96.webp'), charger('../commun/img/village-jour-900.webp'), charger('../commun/img/marianne-glyph.svg'), charger('../commun/img/portrait-esquisse.png')]).then(([a, b, c, d]) => { im.sceau = a; im.village = b; im.glyphe = c; im.esquisse = d; derniereCle = ''; dessinsPrets = false; });
  const pretes = () => im.sceau && im.village && im.glyphe && im.esquisse;

  /* ---- mise en page ---- */
  let W = 0, H = 0, DPR = 1, Hp = null, L = {};
  let B = null, HB = null;   /* le quadrilatère écran de la planche, et sa matrice (planche -> écran) */
  const ecranPl = (u, v) => appl(HB, u, v);
  const imgEcran = (x, y) => { const [u, v] = appl(Hpli, x, y); return appl(HB, u, v); };
  let SW = 1, SH = 1, SWc = 1, SHc = 1;   /* canevas de la feuille : pixels, et pixels CSS */
  const fpx = (x, y) => { const [u, v] = appl(Hfi, x, y); return [u * SW, v * SH]; };   /* image -> pixels de la feuille */
  const geo = {};
  function dims() {
    W = ctx.scene.clientWidth; H = ctx.scene.clientHeight; DPR = Math.min(window.devicePixelRatio || 1, plafondDpr(2));   /* S4 : 1,5 en mode économe */
    const mob = W < 768;
    /* J6 : la pierre autour de la planche de près, seulement sur petit écran, préparée pendant les temps morts */
    /* M4 (treizième passe) : la pierre préparée (c-film/prets/mur-pierre.jpg et bord-pres.png), si ses sources n'ont pas
       changé ; sinon le calcul, en tâche de fond (sur iPhone, il n'était pas fini en arrivant à la planche) */
    if (mob && !murPlanifie) {
      murPlanifie = true;
      const tache = { nom: 'mur-petit', gen: (function* () { yield; yield* faireMurPierre(); })() };
      Promise.all([pret('mur-pierre'), pret('bord-pres')]).then(([a, b]) => { if (!a || !b || tache.fini || murPierre) { if (!tache.fini && !tache.planifiee) { tache.planifiee = true; planifier(tache); } return; } tache.fini = true; murPierrePret(a, b); });
    }
    let s = Math.max(W / vp.w, H / vp.h), ox = (W - vp.w * s) / 2, oy = (H - vp.h * s) / 2;
    if (mob) { const hf = Q.feuille[3][1] - Q.feuille[0][1]; s = H * .62 / hf; oy = H * .3 - Q.feuille[0][1] * s; ox = 0; }
    Hp = [s, 0, ox, 0, s, oy, 0, 0, 1];
    const st = Math.max(W / vt.w, H / vt.h);
    L = { mob, s, ox, oy, st, tx: (W - vt.w * st) / 2, ty: (H - vt.h * st) / 2, pan: 0, zoom: 1 };
    B = Q.planche.map(([x, y]) => appl(Hp, x, y)); HB = carreVers(B);
    /* le CV : le papier de la feuille A4, à sa vraie proportion */
    const c0 = imgPl(DISPO.cv[0], DISPO.cvHaut), c1 = imgPl(DISPO.cv[1], DISPO.cvHaut), lc = Math.hypot(c1[0] - c0[0], c1[1] - c0[1]);
    const ac = (fe.corpsV[1] - fe.corpsV[0]) * fe.A / (fe.corpsU[1] - fe.corpsU[0]);
    const dvc = lc * ac / (imgPl(.36, 1)[1] - imgPl(.36, 0)[1]);
    geo.cvImg = [c0, c1, imgPl(DISPO.cv[1], DISPO.cvHaut + dvc), imgPl(DISPO.cv[0], DISPO.cvHaut + dvc)];
    /* la zone de l'idée */
    const [iu0, iu1, iv0, iv1] = DISPO.idee;
    geo.ideeImg = [imgPl(iu0, iv0), imgPl(iu1, iv0), imgPl(iu1, iv1), imgPl(iu0, iv1)];
    /* le canevas de la feuille de dessin */
    const fw = Math.hypot(Q.feuille[1][0] - Q.feuille[0][0], Q.feuille[1][1] - Q.feuille[0][1]), fh = Math.hypot(Q.feuille[3][0] - Q.feuille[0][0], Q.feuille[3][1] - Q.feuille[0][1]);
    SW = Math.round(Math.min(2600, fw * s * DPR * 1.05));
    /* M8 (treizième passe) : sur téléphone, la feuille n'est jamais vue qu'au recul du cadrage de l'idée (M5) : ses canevas
       (la feuille, la page, le papier, le tracé du visiteur) sont faits à cette taille (un quart de moins par côté environ,
       une quarantaine de mégaoctets de moins pour Safari) */
    if (mob) { SW = 2600; SH = Math.round(SW * fh / fw); const z = cadrageIdee().zoom; SW = Math.round(Math.min(2600, fw * s * z * DPR * 1.15)); }
    SH = Math.round(SW * fh / fw); SWc = SW / DPR; SHc = SH / DPR;
    fc.width = SW; fc.height = SH; fc.style.width = SWc + 'px'; fc.style.height = SHc + 'px';
    trace.width = Math.round(SW); trace.height = Math.round(SH); trace.style.width = SWc + 'px'; trace.style.height = SHc + 'px';
    dessinsPrets = false; derniereCle = '';
    /* le crayon sur la règle : à droite du repère de chapitre, de la longueur du crayon de la main */
    placerCrayon();
  }
  /* la longueur du crayon de la main à l'écran (même échelle que la main qui dessine) */
  const echelleMain = () => F.H * (F.mob ? .4 : .56) / Math.hypot((vmc.reperes.poignet ? vmc.reperes.poignet[0] * vmc.w : vmc.w * .8) - mainP[0], (vmc.reperes.poignet ? vmc.reperes.poignet[1] * vmc.h : vmc.h * .86) - mainP[1]);
  /* Le crayon couché sur la règle, entièrement visible (troisième passe, B.2) : on cherche sur la règle, à droite
     (le téléphone est debout à gauche), une place que n'occupent ni le repère de chapitre, ni les boutons « Lancer le
     film » et « Passer le film », ni l'étiquette ; sans place libre sur la règle, il se pose juste au-dessus, au bas
     de la feuille. Positions des éléments fixes en coordonnées de l'écran (la scène est collée en haut). */
  function placerCrayon() {
    const ech = echelleMain(), longPx = Math.hypot(mainB[0] - mainP[0], mainB[1] - mainP[1]) * ech;
    const obstacles = ['.rail', '.commandes', '.etiquette'].map(q => document.querySelector(q)).filter(e => e && !e.hidden && e.offsetParent !== null).map(e => e.getBoundingClientRect()).filter(r => r.width > 0);
    const essai = v => {
      const a = appl(HB, 0, v), b = appl(HB, 1, v), largPl = Math.hypot(b[0] - a[0], b[1] - a[1]), du = longPx / largPl;
      /* M5 (treizième passe) : sur téléphone, la caméra est cadrée sur l'idée : le crayon se couche sous elle */
      const debut = L.mob ? .5 : .55;
      for (let u0 = debut; u0 + du <= .985; u0 += .004) {
        const P = appl(HB, u0, v), E = appl(HB, u0 + du, v), y0 = Math.min(P[1], E[1]) - 12, y1 = Math.max(P[1], E[1]) + 16, x0 = Math.min(P[0], E[0]) - 10, x1 = Math.max(P[0], E[0]) + 10;
        if (!L.mob && (x0 < 4 || x1 > W - 4)) continue;
        if (L.mob) return [u0, u0 + du, v];
        if (!obstacles.some(r => r.left < x1 && r.right > x0 && r.top < y1 && r.bottom > y0)) return [u0, u0 + du, v];
      }
      return null;
    };
    geo.crayonPl = essai(DISPO.crayonV) || essai(.94) || essai(.915) || essai(.89) || (() => { const a = appl(HB, 0, .9), b = appl(HB, 1, .9), du = longPx / Math.hypot(b[0] - a[0], b[1] - a[1]); return [.985 - du, .985, .9]; })();
  }

  /* ---- vues ---- */
  const vus = new Set();
  const tous = [boite, table, tablier, basNet, hautTable, hautNet, eteinteT, eteinteF, PLAFP && PLAFP.c, tsBas, tsHaut, tsLampe, presPlateau, tableHors, sombre, soleil, lampeDans, lampePres, mur, pres, soleilPres, page, fc, trace, bulle, coin, crayon, crayonOmbre, grav, gravT, halo].filter(Boolean);
  /* I2 : l'intensité de la lampe (0 éteinte, 1 allumée, un peu plus au moment où elle s'allume) */
  const intensite = () => (F.lampe ? F.lampe.I : 1);
  const vu = (...e) => e.forEach(x => x && vus.add(x));
  function debut() { vus.clear(); }
  function fin() { tous.forEach(e => { if (!vus.has(e)) setV(e, false); }); }
  let dansLaBoite = false;
  function boiteOuNon(oui) {
    if (oui === dansLaBoite) return; dansLaBoite = oui;
    [fc, crayonOmbre, crayon].forEach(e => (oui ? boite : racine).appendChild(e));
  }
  /* La table (cinquième passe, E4). Jamais de bord d'image dans le cadre :
     - o.aligne (le quadrilatère de la porte à l'écran) : la photo de la table couvre l'ouverture, la planche à la
       largeur qu'avait la table vue par la vitre (0,62 de l'ouverture), centrée où on la voyait ; o.clip découpe la
       vue à l'ouverture (la façade reste autour) ; o.hors (0 à 1) : la même photo, hors de l'ouverture, en fondu
       plein cadre quand l'ouverture remplit presque l'écran ; o.ecran (0 à 1) : la photo couvre aussi l'écran ;
     - sinon, o.zoom de 0 à 1 : de la dernière pose alignée (L.alignFin) jusqu'à la planche de près (même planche que
       atelier-planche), par une homographie sur la planche ; la couverture de l'écran est vérifiée et corrigée. */
  const imT = [[-EXT.g, -EXT.h], [vt.w + EXT.d, -EXT.h], [vt.w + EXT.d, vt.h + EXT.b], [-EXT.g, vt.h + EXT.b]];
  const decalE = [1, 0, -EXT.g, 0, 1, -EXT.h, 0, 0, 1];
  function couvrir(Hq) {
    /* l'image transformée couvre-t-elle l'écran ? sinon, on l'agrandit autour du centre de l'écran */
    const q = imT.map(([x, y]) => appl(Hq, x, y));
    const dedans = (P) => { for (let i = 0; i < 4; i++) { const a = q[i], b = q[(i + 1) % 4]; if ((b[0] - a[0]) * (P[1] - a[1]) - (b[1] - a[1]) * (P[0] - a[0]) < 0) return false; } return true; };
    const coins = [[-2, -2], [W + 2, -2], [W + 2, H + 2], [-2, H + 2]];
    let k = 1;
    for (let it = 0; it < 12 && !coins.every(c => dedans(c)); it++) {
      k *= 1.04; const S = [1.04, 0, W / 2 * (1 - 1.04), 0, 1.04, H / 2 * (1 - 1.04), 0, 0, 1]; Hq = mult3(S, Hq);
      for (let i = 0; i < 4; i++) q[i] = appl(Hq, ...imT[i]);
    }
    return Hq;
  }
  /* la planche dans la photo : centre et largeur (px) */
  const plC = [planT.reduce((a, p) => a + p[0], 0) / 4, planT.reduce((a, p) => a + p[1], 0) / 4];
  const plL = (Math.hypot(planT[1][0] - planT[0][0], planT[1][1] - planT[0][1]) + Math.hypot(planT[2][0] - planT[3][0], planT[2][1] - planT[3][1])) / 2;
  function aligner(porte, ecran = 0, vue = null, d = [0, 0]) {
    const xs = porte.map(p => p[0]), ys = porte.map(p => p[1]);
    /* seule compte la partie de l'ouverture qui est dans l'écran */
    const bx0 = Math.max(-2, Math.min(...xs)), bx1 = Math.min(W + 2, Math.max(...xs)), by0 = Math.max(-2, Math.min(...ys)), by1 = Math.min(H + 2, Math.max(...ys)), dw = bx1 - bx0, dh = by1 - by0;
    /* où l'on voyait la table par la vitre : le point du monde derrière la porte (vue), ou à défaut (0,516 ; 0,55) */
    const cx = vue ? vue.c[0] + d[0] : bx0 + dw * .516, cy = vue ? vue.c[1] + d[1] : by0 + dh * .55, lg = vue ? vue.l : dw * .62;
    const haut = plC[1] + EXT.h, bas = vt.h + EXT.b - plC[1], gch = plC[0] + EXT.g, drt = vt.w + EXT.d - plC[0];
    const besoin = (x, y) => Math.max((x - bx0) / gch, (bx1 - x) / drt, (y - by0) / haut, (by1 - y) / bas) * 1.01;
    let s = Math.max(lg / plL, besoin(cx, cy)), cyv = cy;
    if (ecran > 0) {
      /* couvrir aussi l'écran, avec la plus petite échelle possible : la planche remonte au besoin dans le cadre
         (surtout en portrait, où la photo paysage manque de hauteur) */
      const sE = Math.max(s, (cx + 2) / gch, (W + 2 - cx) / drt, (H + 4) / (haut + bas)) * 1.01;
      const cyE = clamp(cy, H + 2 - sE * bas, sE * haut - 2);
      cyv = lerp(cy, cyE, ecran);
      s = Math.max(lerp(s, sE, ecran), besoin(cx, cyv));
    }
    return [s, 0, cx - s * plC[0], 0, s, cyv - s * plC[1], 0, 0, 1];
  }
  let clipCle = '';
  /* F8 : le zoom vers la planche part de la pose du moment (alignée sur la porte tant qu'on la voit) et arrive
     exactement sur la planche de près telle que la page la pose (même cadrage), sans à-coup au fondu */
  const versPres = (H0, z) => {
    if (z <= 0) return H0;
    const cible = Q.planche.map(([x, y]) => appl(hPres(), x, y)), q0 = planT.map(([x, y]) => appl(H0, x, y));
    return couvrir(quadVersQuad(planT, q0.map((p, i) => [lerp(p[0], cible[i][0], z), lerp(p[1], cible[i][1], z)])));
  };
  /* J2 : la pose de la photo de la table alignée sur la porte (photo -> écran), sans la parallaxe propre à l'atelier :
     le monde y accroche la lampe vue de dehors, pour qu'elle tombe exactement sur la lampe de la photo */
  /* J3 bis : la table de la pièce de façade (dans l'ouverture de l'image fermée : centre 0,534 ; 0,60, largeur du plateau
     0,545 de l'ouverture, relevés sur l'image), à l'écran ; pendant le fondu, la photo de la table est posée avec sa
     planche sur ce plateau (même centre, même largeur), puis, la pièce de façade partie, elle rejoint sa pose propre */
  const PIECE_TABLE = { u: .534, v: .60, l: .545 };
  function vuePiece(q) {
    const fac = F.monde && F.monde.fac; if (!fac) return null;
    const P0 = fac.porte, xs = P0.map(p => p[0]), ys = P0.map(p => p[1]), a = Math.min(...xs), b = Math.max(...xs), c = Math.min(...ys), d = Math.max(...ys);
    const Hf = quadVersQuad(P0, q), m = appl(Hf, a + PIECE_TABLE.u * (b - a), c + PIECE_TABLE.v * (d - c));
    const l0 = appl(Hf, a + (PIECE_TABLE.u - PIECE_TABLE.l / 2) * (b - a), c + PIECE_TABLE.v * (d - c)), l1 = appl(Hf, a + (PIECE_TABLE.u + PIECE_TABLE.l / 2) * (b - a), c + PIECE_TABLE.v * (d - c));
    return { c: m, l: Math.hypot(l1[0] - l0[0], l1[1] - l0[1]) };
  }
  function vueDe(o, q) {
    /* K11 : plus de pièce de façade, donc plus d'alignement sur sa table : la table est à sa place dans le monde */
    if (K11) return o.vue;
    if (!o.vue || o.p === undefined || !(vt.reel && LAMPE_T)) return o.vue;
    const w = sseg(o.p, T.piece[1], T.piece[1] + .006); if (w >= 1) return o.vue;
    const vp2 = vuePiece(q); if (!vp2) return o.vue;
    return { c: [lerp(vp2.c[0], o.vue.c[0], w), lerp(vp2.c[1], o.vue.c[1], w)], l: lerp(vp2.l, o.vue.l, w) };
  }
  /* J3 bis : l'exposition et la chaleur de la pièce de façade, rapprochées de la photo de la table (la moyenne de la région
     que l'ouverture montre au début du fondu), gain par couleur, appliqué une fois aux pixels de la pièce (petite image) */
  function accorderPiece(pc) {
    pc._accordee = true;
    try {
      const m = (src, sx, sy, sw, sh) => { const c = document.createElement('canvas'); c.width = 16; c.height = 16; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(src, sx, sy, sw, sh, 0, 0, 16, 16); const d = g.getImageData(0, 0, 16, 16).data, r = [0, 0, 0]; for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) r[k] += d[i + k] / 256; return r; };
      const cible = m(vt.image, vt.w * .09, 0, vt.w * .78, vt.h * .94), ici = m(pc, 0, 0, pc.width, pc.height);
      const gn = [0, 1, 2].map(k => clamp(cible[k] / Math.max(4, ici[k]), .8, 3.2) * .9 + .1);
      const g = pc.getContext('2d', { willReadFrequently: true }), im = g.getImageData(0, 0, pc.width, pc.height), d = im.data;
      for (let i = 0; i < d.length; i += 4) { d[i] = Math.min(255, d[i] * gn[0]); d[i + 1] = Math.min(255, d[i + 1] * gn[1]); d[i + 2] = Math.min(255, d[i + 2] * gn[2]); }
      g.putImageData(im, 0, 0);
    } catch (e) { /* sans lecture : la pièce telle quelle */ }
    /* J3 bis : la zone de la table (les deux tables, plateau, pieds et sol entre eux), découpée à bord doux dans une
       image à part : elle bascule vers la photo de la table dans la première moitié du fondu, les murs ensuite ; ainsi
       on ne voit jamais les deux tables l'une à travers l'autre */
    const w = pc.width, h = pc.height, m = document.createElement('canvas'); m.width = w; m.height = h; const mg = m.getContext('2d');
    mg.filter = 'blur(7px)'; mg.fillStyle = '#000'; mg.fillRect(w * .19, h * .42, w * .67, h * .62); mg.filter = 'none';
    const tz = document.createElement('canvas'); tz.width = w; tz.height = h; const tg = tz.getContext('2d');
    tg.drawImage(pc, 0, 0); tg.globalCompositeOperation = 'destination-in'; tg.drawImage(m, 0, 0);
    const g2 = pc.getContext('2d'); g2.globalCompositeOperation = 'destination-out'; g2.drawImage(m, 0, 0); g2.globalCompositeOperation = 'source-over';
    tz.className = 'ep atelier-piece'; tz.setAttribute('aria-hidden', 'true'); tz.style.width = w + 'px'; tz.style.height = h + 'px';
    pc._table = tz;
  }
  function poseAlignee(o) { return versPres(aligner(K11 && o.vitrage ? o.vitrage : o.aligne, o.ecran || 0, vueDe(o, o.aligne)), clamp(o.zoom || 0)); }
  function poserTable(o) {
    vu(boite, table, gravT); setV(boite, true); setV(table, o.op > .002);
    let Hq, cible = null;
    if (o.aligne) {
      /* la façade suit la parallaxe du monde, l'atelier la sienne : on se recale sur la porte */
      const s = F.souris || [0, 0], d = [-s[0] * 3, -s[1] * 1.5], q = o.aligne.map(([x, y]) => [x + d[0], y + d[1]]);
      /* K11 : la pièce couvre tout le vitrage (et non plus la seule ouverture) ; elle y est découpée et passe SOUS la
         façade (couche 2, entre le sol du monde et la façade) : la façade, transparente au verre et percée à l'ouverture,
         la montre par les carreaux et par la porte */
      const qv = K11 && o.vitrage ? o.vitrage.map(([x, y]) => [x + d[0], y + d[1]]) : q;
      Hq = versPres(aligner(qv, o.ecran || 0, vueDe(o, o.aligne), d), clamp(o.zoom || 0));
      const hors = o.clip ? clamp(o.hors || 0) : 0;
      /* L1 : en deux plans, plus de copie de la photo hors de l'ouverture pendant le fondu plein cadre : la découpe s'élargit
         jusqu'aux bords de l'écran (la façade, au-dessus, s'efface dans le même temps) */
      const qc = DEUX && hors > .002 ? qv.map(([x, y], i) => { const e = [[-6, -6], [W + 6, -6], [W + 6, H + 6], [-6, H + 6]][i]; const k = ss(hors); return [x + (e[0] - x) * k, y + (e[1] - y) * k]; }) : qv;
      const c = o.clip ? 'polygon(' + qc.map(([x, y]) => x.toFixed(1) + 'px ' + y.toFixed(1) + 'px').join(',') + ')' : 'none';
      if (c !== clipCle) { clipCle = c; boite.style.clipPath = c; }
      /* L1 : ce que le fond doit couvrir : la découpe (dans l'écran), ou l'écran */
      if (DEUX) {
        const xs = qc.map(p => p[0]), ys = qc.map(p => p[1]), bx0 = o.clip ? Math.max(-4, Math.min(...xs)) : -4, bx1 = o.clip ? Math.min(W + 4, Math.max(...xs)) : W + 4, by0 = o.clip ? Math.max(-4, Math.min(...ys)) : -4, by1 = o.clip ? Math.min(H + 4, Math.max(...ys)) : H + 4;
        cible = [[bx0, by0], [bx1, by0], [bx1, by1], [bx0, by1]];
      }
      /* découpée à l'ouverture, la table passe sous les vantaux, les herbes et la marche (couche du monde 1) */
      const z = o.clip ? (K11 ? '2' : '3') : '10'; if (boite._z !== z) { boite._z = z; boite.style.zIndex = z; }
      vu(tableHors); setV(tableHors, !DEUX && hors > .002); if (!DEUX && hors > .002) { setT(tableHors, m3d(mult3(Hq, decalE))); setO(tableHors, hors); }
    } else {
      const depart = L.alignFin || [L.st, 0, L.tx, 0, L.st, L.ty, 0, 0, 1];
      Hq = versPres(depart, clamp(o.zoom || 0));
      if (!(o.zoom > 0)) Hq = couvrir(Hq);
      if (clipCle !== 'none') { clipCle = 'none'; boite.style.clipPath = 'none'; }
      if (boite._z !== '10') { boite._z = '10'; boite.style.zIndex = '10'; }
      if (DEUX) cible = [[-4, -4], [W + 4, -4], [W + 4, H + 4], [-4, H + 4]];
    }
    /* J3 : la pièce de la photo de façade, dans l'ouverture, au-dessus de la table, jusqu'au fondu (T.piece).
       J3 bis : elle reste exactement à l'ouverture (elle la couvre toujours, ses bords sont sous le bâti : aucun cadre
       intérieur), c'est la photo de la table qui s'aligne sur sa table pendant le fondu (vueDe). Son exposition et sa
       chaleur ont été rapprochées de la photo de la table (pieceAccordee) ; elle s'éclaircit en s'ouvrant (plus de vitre
       entre elle et nous) jusqu'au ton de la photo au début du fondu. */
    /* la pièce n'est jamais calculée pendant une image : préparée et accordée pendant les temps morts, sinon on n'en
       montre pas (la photo de la table seule) */
    const pc0 = !K11 && F.monde && F.monde.fac.piecePrete ? F.monde.fac.piecePrete() : null, pc = pc0 && pc0._accordee ? pc0 : null;
    const kPiece = pc && o.aligne && o.clip ? clamp(o.piece || 0) : 0;
    if (pc && kPiece <= .003) { if (pc._table) setV(pc._table, false); }
    if (pc && kPiece > .003) {
      if (pc.parentNode !== boite) { pc.className = 'ep atelier-piece'; pc.setAttribute('aria-hidden', 'true'); pc.style.width = pc.width + 'px'; pc.style.height = pc.height + 'px'; boite.appendChild(pc); tous.push(pc); }
      const s2 = F.souris || [0, 0], d2 = [-s2[0] * 3, -s2[1] * 1.5], qq = o.aligne.map(([x, y]) => [x + d2[0], y + d2[1]]);
      const [bx, by] = pc.boite, Hp = mult3(quadVersQuad(F.monde.fac.porte, qq), [1, 0, bx, 0, 1, by, 0, 0, 1]);
      vu(pc); setV(pc, true); setT(pc, m3d(Hp)); setO(pc, kPiece);
      const br = (o.p === undefined ? 1 : lerp(.72, 1, sseg(o.p, T.ouvre[0], T.piece[0]))).toFixed(3); if (pc._br !== br) { pc._br = br; pc.style.filter = `brightness(${br})`; }
      const tz = pc._table;
      if (tz) {
        if (tz.parentNode !== boite) { boite.appendChild(tz); tous.push(tz); }
        const kT = o.p === undefined ? kPiece : 1 - sseg(o.p, T.piece[0], T.piece[0] + .45 * (T.piece[1] - T.piece[0]));
        vu(tz); setV(tz, kT > .003); setT(tz, m3d(Hp)); setO(tz, kT); if (tz._br !== br) { tz._br = br; tz.style.filter = `brightness(${br})`; }
      }
    }
    /* J3 bis : avec les photos en pierre, plus de voile sombre ni de nappe de soleil posés sur l'ouverture (le voile sombre,
       au-dessus de tout, montait pendant le fondu : le « carré noir ») ; la pièce de façade porte elle-même son ton */
    const neuve = vt.reel && LAMPE_T;
    const so = o.aligne && !neuve ? clamp(o.sombre || 0) : 0, sl = o.aligne && !neuve ? clamp(o.lumiere || 0) : 0;
    vu(sombre, soleil); setV(sombre, so > .003); setO(sombre, so); setV(soleil, sl > .003); setO(soleil, sl);
    /* I2 : par la porte, la lampe éclaire la pièce (centrée sous la lampe, là où on la voit) ; une fois la photo plein
       cadre, la lumière de la pièce prend le relais */
    const I = intensite(), hors = o.aligne && o.clip ? clamp(o.hors || 0) : 1;
    /* J2 bis : avec les photos en pierre (la lampe allumée et sa lumière sont dedans), plus de réchauffement I2 sur la photo
       de la table ; il ne reste, par la porte, qu'un peu de chaleur sur la pièce de la photo de façade (prise de jour,
       lampe éteinte) tant qu'on la voit */
    const kd = o.aligne ? I * (1 - hors) * clamp(sl * 1.6 + .25) * (LAMPE_T ? .7 * kPiece : 1) : 0, kp = LAMPE_T ? 0 : I * hors;
    vu(lampeDans, lampePres); setV(lampeDans, kd > .003); setO(lampeDans, kd); setV(lampePres, kp > .003); setO(lampePres, kp);
    if (kd > .003 && F.monde) { const c = F.monde.centreLampe(); const v = Math.round(c[0]) + 'px ' + Math.round(c[1]) + 'px'; if (lampeDans._c !== v) { lampeDans._c = v; lampeDans.style.setProperty('--lx', Math.round(c[0]) + 'px'); lampeDans.style.setProperty('--ly', Math.round(c[1]) + 'px'); } }
    if (!DEUX) setT(table, m3d(mult3(Hq, decalE)));
    setO(table, o.op);
    /* K1 : le calque net du bas (la bande de mur à droite du plateau), même fondu que celui du haut */
    {
      const kb = NET.pret && NET.rbPose && !window.__sansK1 ? sseg(o.p === undefined ? (F.p || 0) : o.p, NET.p0, NET.p1) * o.op : 0;
      vu(basNet); setV(basNet, kb > .002);
      if (kb > .002) { const r = NET.rbPose; setT(basNet, m3d(mult3(mult3(Hq, decalE), [.5, 0, r.x, 0, .5, r.y, 0, 0, 1]))); setO(basNet, kb); }
    }
    /* J14 : le haut de la photo (mur, lampe), par la similitude du bord haut du plateau ; pendant le mouvement, il glisse
       peu à peu à l'horizontale pour que son câble tombe, au moment du fondu, sur le câble de la photo de près (0,5102 de
       la photo de la table, 0,5018 de la planche) */
    {
      const Sh = simHaut(Hq, o.zoom);
      /* L1 : en deux plans, le mur du fond (calque du haut) et son plancher (calque du bas) ont leur propre pose ; la table
         seule prend celles de la photo de la table (le bas, l'homographie du plateau ; le haut, la similitude de J14) */
      /* O3 : la règle du bord gauche dans la photo, prise dans les 0,5 s de film qui précèdent le fondu plein cadre (E.pA),
         entière dès qu'il commence */
      const E = F.entree, kPhoto = o.aligne && o.clip ? (E && o.p !== undefined ? sseg(o.p, E.pA - .010, E.pA + .001) : ss(clamp(o.hors || 0))) : 1;
      const PF = DEUX ? posesFond(Sh, cible, o.aligne && o.vue && o.vue.z ? o.vue.z : 0, o.zoom || 0, Hq, kPhoto) : null;
      vu(hautTable); setV(hautTable, o.op > .002); setT(hautTable, m3d(mult3(PF ? PF.Sw : Sh, decalE))); setO(hautTable, o.op);
      /* Y10 A : le plafond en plan (téléphone), avec la lampe allumée (éteinte, la pièce éteinte du mur fait foi) ; les rangées derrière
         la caméra coupées par le haut */
      if (PLAFP) {
        /* Y17 (10/10/2026) : à la porte, la caméra est plus loin que l'appareil de la photo (r > 1) : le plafond le plus proche, entre la
           porte et lui, n'est ni dans la photo ni dans son prolongement peint ; le plan s'y arrête net, sous le plafond plat du mur, d'un
           autre ton (Thibaut, 10 h 39 : « le plafond complètement coupé du reste »). Le plan ne paraît donc qu'une fois la caméra à
           l'aplomb de l'appareil de la photo (r = 1 : le plan et le mur y sont la même image, aucune couture), fondu de r = 1,02 à 1 ;
           au-delà, ses solives viennent vers nous comme avant */
        const kz = PF ? clamp((1.02 - PF.r) / .02) : 0;
        const kc = PF && PF.Hc && !PIECE_REPOS && PLAFP.c.width > 1 ? o.op * clamp(intensite()) * kz : 0;
        vu(PLAFP.c); setV(PLAFP.c, kc > .002);
        if (kc > .002) {
          setT(PLAFP.c, m3d(mult3(PF.Hc, mult3(decalE, [1, 0, PLAFP.xa, 0, 1, 0, 0, 0, 1])))); setO(PLAFP.c, kc);
          const haut = Math.max(0, Math.ceil(PF.yCoupeC + EXT.h + 2)), cc = haut > 0 ? `inset(${Math.min(PLAFP.h, haut)}px 0 0 0)` : 'none';
          if (PLAFP.c._cc !== cc) { PLAFP.c._cc = cc; PLAFP.c.style.clipPath = cc; }
        }
      }
      if (PF) {
        setT(table, m3d(mult3(PF.Hf, mult3(decalE, [1, 0, 0, 0, 1, Y0S, 0, 0, 1]))));
        const coupe = Math.max(0, Math.round(table.height - (PF.yCoupe + EXT.h - Y0S))), cc = coupe > 0 ? `inset(0 0 ${Math.min(table.height, coupe)}px 0)` : 'none';
        if (table._cc !== cc) { table._cc = cc; table.style.clipPath = cc; }
        /* le tablier (plancher jusqu'au seuil), coupé de même avant la caméra virtuelle */
        const yApC = vt.h + (PF.yCoupe - vt.h) / PF.sAp, coupeA = Math.round(tablier.height - (yApC + EXT.h - YA0)), visA = coupeA < tablier.height - 1;
        vu(tablier); setV(tablier, o.op > .002 && visA);
        if (visA) {
          setT(tablier, m3d(mult3(PF.Hap, mult3(decalE, [1, 0, 0, 0, 1, YA0, 0, 0, 1])))); setO(tablier, o.op);
          const ca = coupeA > 0 ? `inset(0 0 ${coupeA}px 0)` : 'none'; if (tablier._cc !== ca) { tablier._cc = ca; tablier.style.clipPath = ca; }
        }
        const dT = mult3(decalE, [1, 0, TS.x0, 0, 1, TS.y0, 0, 0, 1]);
        vu(tsBas, tsHaut); setV(tsBas, o.op > .002); setV(tsHaut, o.op > .002);
        setT(tsBas, m3d(mult3(Hq, dT))); setO(tsBas, o.op); setT(tsHaut, m3d(mult3(Sh, dT))); setO(tsHaut, o.op);
        /* la lampe : avec la table en entrant ; pendant le passage, elle monte et sort par le haut (droite, la similitude
           du haut), finie avant que la planche de près ne prenne le relais. Découpée avec la pièce tant qu'on la voit par la
           porte ; ensuite au-dessus de la planche nette */
        {
          const e = sseg(clamp(o.zoom || 0), .03, .5), yb = appl(Sh, LAMPE2.cable, LAMPE2.bas)[1], dy = Math.min(0, -30 - yb) * e;
          const dedans = !!(o.aligne && o.clip);
          if (dedans ? tsLampe.parentNode !== boite : tsLampe.parentNode !== racine) { if (dedans) tsHaut.after(tsLampe); else pres.after(tsLampe); tsLampe.style.zIndex = dedans ? '' : '12'; }
          vu(tsLampe); setV(tsLampe, o.op > .002 && (yb + dy) > -4);
          setT(tsLampe, m3d(mult3([1, 0, 0, 0, 1, dy, 0, 0, 1], mult3(Sh, [1, 0, LB.x0, 0, 1, -EXT.h, 0, 0, 1])))); setO(tsLampe, o.op);
        }
        L.dernierFond = PF; L.dernierHq = Hq;
      }
      /* K1 : le calque net, posé exactement comme le calque du haut (un de ses pixels vaut un demi-pixel du canevas plein),
         en fondu de 0,35 s dès que le mur est agrandi plus de 1,15 fois (NET.p0 à NET.p1) */
      /* (pour les essais : window.__sansK1 coupe le calque net) */
      const kn = NET.pret && !window.__sansK1 ? sseg(o.p === undefined ? (F.p || 0) : o.p, NET.p0, NET.p1) * o.op : 0;
      vu(hautNet); setV(hautNet, kn > .002);
      if (kn > .002) { const r = NET.rPose; setT(hautNet, m3d(mult3(mult3(PF ? PF.Sw : Sh, decalE), [.5, 0, r.x, 0, .5, r.y, 0, 0, 1]))); setO(hautNet, kn); }
      /* L1 : la lueur du mur, éteinte avant 0,700 (le fond a sa pièce éteinte) */
      if (PF) {
        const kf = ETEINTE.pret && o.aligne ? clamp(1 - intensite()) * o.op : 0;
        vu(eteinteF); setV(eteinteF, kf > .002);
        if (kf > .002) { setT(eteinteF, m3d(mult3(mult3(PF.Sw, decalE), [1, 0, ETEINTE.r[0], 0, 1, ETEINTE.r[1], 0, 0, 1]))); setO(eteinteF, kf); }
      }
    }
    /* K11 : la pièce éteinte avant 0,700 (opacité 1 - intensité de la lampe), tant qu'on la voit de dehors ou en entrant */
    {
      const ke = ETEINTE.pret && o.aligne ? clamp(1 - intensite()) * o.op : 0;
      vu(eteinteT); setV(eteinteT, ke > .002);
      if (ke > .002) { setT(eteinteT, m3d(mult3(mult3(Hq, decalE), [1, 0, ETEINTE.r[0], 0, 1, ETEINTE.r[1], 0, 0, 1]))); setO(eteinteT, ke); }
    }
    if (gravT) { const qg = Q.gravure.map(([x, y]) => { const b = appl(Hpli, x, y); return appl(Hq, ...appl(carreVers(planT), b[0], b[1])); }); setV(gravT, o.op > .002); setT(gravT, epingle(600, 200, qg)); setO(gravT, o.op); }
    /* la planche à l'écran dans cette vue : les objets posés la suivent (la feuille de dessin y est déjà, E9) */
    B = planT.map(([x, y]) => appl(Hq, x, y)); HB = carreVers(B);
    /* tant que la vue est découpée à l'ouverture, la feuille et le crayon le sont aussi */
    boiteOuNon(!!(o.aligne && o.clip));
  }
  /* L1 : les poses du fond, à partir de la similitude du plan de la table (Sh, photo -> écran). La caméra virtuelle avance
     le long de l'axe de la photo : la table est à la distance z (déduite de l'échelle de Sh : la table, à sa taille réelle,
     est vue sous une échelle inverse de sa distance), la photo a été prise à la distance D (celle de la fin de la marche :
     au seuil, la pièce est la photo telle quelle). Le mur du fond, 3 m plus loin, est la photo agrandie de
     rho = (z / D) (D + 3) / (z + 3) autour du point de fuite F (abscisse Fx, à la hauteur de l'horizon) ; le plancher est
     un plan du sol : une homographie qui ne change rien à la rangée des pieds (la profondeur de la table) et vaut rho à la
     ligne du sol (la profondeur du mur) ; entre les deux, la perspective exacte d'un sol. Si le fond ne couvre pas ce qui
     doit l'être (le vitrage, puis l'écran), il est agrandi d'autant autour de F, le plancher restant collé aux pieds. */
  /* O3 (quinzième passe) : kPhoto (0 à 1), le poids de la règle « le bord gauche de l'écran reste dans la photo » (voir plus bas) */
  function posesFond(Sh, cible, zVue, zoom = 0, Hq = null, kPhoto = 0) {
    /* la table garde la pose de la onzième passe (agrandie au besoin pour couvrir le vitrage, puis l'écran : la
       composition que Thibaut connaît) ; le fond s'en déduit. En entrant, z est la profondeur réelle de la table ; pendant
       le passage vers la planche, l'agrandissement de la table par rapport à la fin de la marche */
    const k = Math.hypot(Sh[0], Sh[3]), D = L.D || 4, z = zVue || (L.Kz ? L.Kz / k : D);
    const yh = (P2.ys * (D + 3) - P2.yf * D) / 3, Fx = P2.Fx;
    const rho = (z / D) * (D + 3) / (z + 3);
    /* la couverture : chaque coin de la cible, ramené dans la photo à rho = 1, doit tomber dans le canevas du fond */
    let r = rho;
    if (cible) {
      /* O3 (quinzième passe, 06/10/2026) : à gauche, le mur ne montre jamais ce qui est hors de la photo. La photo s'arrête
         dans le verre de la verrière (son bord gauche coupe un vantail) ; sur un écran large (16:10 et plus), le fondu plein
         cadre découvrait jusqu'à 117 px (1920 x 1080) ou 307 px (2560 x 1080) de prolongement à gauche de la photo, de 0,742
         à 0,750 : des carreaux recopiés, coupés en biais par la poutre du haut. Le bord gauche de l'écran est désormais
         ramené dans la photo (3 px de marge) : le mur du fond est agrandi juste ce qu'il faut autour de son point de fuite
         (rP, le moyen qui sert déjà à couvrir l'écran), la table et la planche ne bougent pas (elles ont leur propre pose).
         L'agrandissement nécessaire est pris peu à peu (kPhoto, de 0 à 1 dans les 0,5 s de film qui précèdent le fondu
         plein cadre, tant que les vantaux de la façade couvrent encore le bord de l'écran) : il ne saute jamais (mesuré :
         au plus 3,5 % pour 0,001 de p, soit environ 1,2 % d'une image à l'autre à la vitesse du film ; de 1,25 à 1,29 puis
         1,00 à 0,750 en 1920 x 1080, 1,24 puis 1,00 à 0,748 en 1440 x 900). La verrière qu'on voit en entrant est donc toujours celle
         de la photo. Sur téléphone et sur les écrans moins larges que 16:10, rien ne change (le bord gauche y est déjà dans
         la photo) */
      const Si = inv3(Sh), xmin = -EXT.g + 8, xmax = vt.w + EXT.d - 8, ymin = -EXT.h + 8;
      let rP = rho;
      for (const c of cible) {
        const [qx, qy] = appl(Si, c[0], c[1]);
        if (qx > Fx) r = Math.max(r, (qx - Fx) / (xmax - Fx)); else { r = Math.max(r, (Fx - qx) / (Fx - xmin)); rP = Math.max(rP, (Fx - qx) / (Fx - 3)); }
        if (qy < yh) r = Math.max(r, (yh - qy) / (yh - ymin));
      }
      r = Math.max(r, rho + (rP - rho) * clamp(kPhoto));
      if (r > rho) r *= 1.004;
    }
    /* L8, L9 : pendant le passage vers la planche, la caméra monte et se penche sur la planche (la photo de près est prise
       d'au-dessus) : le mur derrière monte par rapport à la planche, et ce qui paraît au-dessus d'elle à la fin du passage
       est la pierre du bas du mur, comme dans la photo de près (et non les poutres du plafond) ; le fond (mur, plancher)
       glisse donc vers le haut d'autant, progressivement */
    const dyF = (L.dyFond1 || 0) * sseg(clamp(zoom), .05, .95), Tm = [1, 0, 0, 0, 1, dyF, 0, 0, 1];
    const Sw = mult3(Tm, mult3(Sh, [r, 0, Fx * (1 - r), 0, r, yh * (1 - r), 0, 0, 1]));
    /* le plancher : den(w) = alpha + beta w (w = y - yh), 1 à la rangée des pieds, 1 / r à la ligne du sol */
    const wf = P2.yf - yh, ws = P2.ys - yh, beta = (1 / r - 1) / (ws - wf), alpha = 1 - beta * wf;
    const G = [1, Fx * beta, Fx * (alpha - beta * yh - 1), 0, 1 + yh * beta, yh * (alpha - beta * yh - 1), 0, beta, alpha - beta * yh];
    /* les rangées trop proches de la caméra virtuelle (den <= 0,2 : derrière elle, ou presque) ne sont pas posées */
    const yCoupe = beta < 0 ? yh + (.2 - alpha) / beta : 1e9;
    /* le tablier : ses rangées (sous la photo) sont étirées jusqu'au seuil (3 m devant la table, 15 cm au-delà), là où le
       sol réel serait vu dans une photo plus haute ; ensuite, la même homographie de sol */
    const A = D * (P2.yf - yh), yPorte = yh + A / Math.max(.35, D - 3 - .15), sAp = Math.max(1, (yPorte - vt.h) / EXT.b);
    const Ap = [1, 0, 0, 0, sAp, vt.h * (1 - sAp), 0, 0, 1];
    /* L1 : le plancher suit la table (l'homographie de son plateau, Hq ; en entrant c'est la même similitude que Sh) :
       les pieds restent posés, même pendant le passage vers la planche ; le mur, lui, suit Sw (il monte) ; sous le plancher,
       le mur a son propre plancher (le calque du mur est la photo entière), qui comble ce que le décalage découvrirait */
    const Hb = Hq || Sh;
    /* Y10 A : le plafond, plan horizontal : den(w) = aC + bC w (w = y - yh, négatif au-dessus de l'horizon), 1 à la rangée du plafond à
       la profondeur de la table, 1 / r à la ligne du plafond (le mur) ; posé comme le mur (Tm Sh), il le rejoint sans couture */
    let Hc = null, yCoupeC = -1e9;
    if (TEL && PLAF2) {
      const wcw = PLAF2.plafond * vt.h - yh, wcD = wcw * (D + 3) / D, bC = (1 / r - 1) / (wcw - wcD), aC = 1 - bC * wcD;
      const Gc = [1, Fx * bC, Fx * (aC - bC * yh - 1), 0, 1 + yh * bC, yh * (aC - bC * yh - 1), 0, bC, aC - bC * yh];
      Hc = mult3(Tm, mult3(Sh, Gc)); yCoupeC = bC > 0 ? yh + (.2 - aC) / bC : -1e9;
    }
    return { Sw, Hf: mult3(Hb, G), Hap: mult3(Hb, mult3(G, Ap)), sAp, rho, r, z, D, yCoupe, dyF, Hc, yCoupeC };
  }
  /* J14 : la similitude du calque du haut pour la pose Hq (photo -> écran) : calée sur le bord haut du plateau, sans
     rotation ; pendant le mouvement, elle glisse peu à peu à l'horizontale pour que son câble tombe, au moment du fondu,
     sur le câble de la photo de près (0,5102 de la photo de la table, 0,5018 de la planche). K1 : mise à part, pour que le
     calque net et le réglage de ses bornes la partagent. */
  function simHaut(Hq, zoom) {
    const b0 = appl(Hq, planT[0][0], planT[0][1]), b1 = appl(Hq, planT[1][0], planT[1][1]);
    let dx = 0;
    if (LAMPE_T && vp.reperes.cable_lampe_x !== undefined) {
      const S0 = simBord(planT[0], planT[1], b0, b1), Sp = simBord(QP[0], QP[1], b0, b1);
      const xt = S0[0] * (LAMPE2 ? LAMPE2.cable : LAMPE_T.b ? LAMPE_T.b[0] * vt.w : LAMPE_T.x) + S0[2], xp = Sp[0] * vp.reperes.cable_lampe_x * vp.w + Sp[2];
      dx = (xp - xt) * sseg(clamp(zoom || 0), .15, .85);
    }
    return simBord(planT[0], planT[1], b0, b1, dx);
  }
  /* la pose de la table une fois la porte passée (zoom de 0 à 1 vers la planche de près), sans la parallaxe */
  function poseLibre(z) { const depart = L.alignFin || [L.st, 0, L.tx, 0, L.st, L.ty, 0, 0, 1]; let Hq = versPres(depart, clamp(z || 0)); if (!(z > 0)) Hq = couvrir(Hq); return Hq; }
  /* K1 : les bornes du calque net (le premier instant où le mur est agrandi 1,15 fois, pas avant le fondu plein cadre,
     puis 0,35 s de film) et la partie du canevas plein que l'écran en montre jusqu'à la fin du passage (marge comprise),
     réglées à chaque redimensionnement ; poseDe(p) : la pose de la table à l'instant p */
  function reglerNet(E, poseDe, tempsDe, pDe) {
    if (!(vt.reel && LAMPE_T)) return;
    /* L1 : l'échelle du haut de la table à la fin de la marche (pB, le passage déjà commencé) : pendant le passage, la
       distance de la caméra virtuelle s'en déduit (z = D x échelle à pB / échelle) */
    if (DEUX) {
      const zB = sseg(E.pB, E.pA, T.fondu[0]), HB0 = poseDe(E.pB); if (HB0) { const S0 = simHaut(HB0, zB); L.Kz = (L.D || 4) * Math.hypot(S0[0], S0[3]); }
      /* L8 : le glissement du fond à la fin du passage : la fin des poutres (rangée 52 du fond) au bord haut de l'écran ou
         plus haut, la pierre seule au-dessus de la planche */
      L.dyFond1 = 0;
      const H1 = poseLibre(1), S1 = simHaut(H1, 1), P1 = posesFond(S1, null, 0, 0), yB = appl(P1.Sw, P2.Fx, PLAF2 ? PLAF2.plafond * vt.h + 8 : 52)[1];
      L.dyFond1 = Math.min(0, -6 - yB);
    }
    const l0 = Math.hypot(planT[1][0] - planT[0][0], planT[1][1] - planT[0][1]);
    let pK = null, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, u0 = 1e9, v0 = 1e9, u1 = -1e9, v1 = -1e9;
    const xDroit = Math.floor(Math.min(planT[1][0], planT[2][0]) + EXT.g - 16), yBord = Math.floor(Math.min(planT[0][1], planT[1][1]) + EXT.h - 34);
    const zoomDe = p => sseg(p, E.pA, T.fondu[0]);
    for (let p = .738; p <= T.morphPres[1] + 1e-9; p += .0005) {
      const Hq = poseDe(p); if (!Hq) continue;
      const b0 = appl(Hq, planT[0][0], planT[0][1]), b1 = appl(Hq, planT[1][0], planT[1][1]), k = Math.hypot(b1[0] - b0[0], b1[1] - b0[1]) / l0;
      if (pK === null && (DEUX ? Math.hypot(...[0, 3].map(i => simHaut(Hq, zoomDe(p))[i])) * posesFond(simHaut(Hq, zoomDe(p)), null).r : k) >= 1.15 && p >= E.pA) pK = p;
      if (pK === null) continue;
      /* L1 : en deux plans, le mur est celui du fond (son agrandissement est plus faible que celui de la table) */
      let S = simHaut(Hq, zoomDe(p)); if (DEUX) S = posesFond(S, null, 0, zoomDe(p)).Sw;
      const ks = S[0];
      [[-12, -12], [W + 12, -12], [W + 12, H + 12], [-12, H + 12]].forEach(([X, Y]) => { const x = (X - S[2]) / ks + EXT.g, y = (Y - S[5]) / ks + EXT.h; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
      /* le bas : l'écran ramené dans le canevas plein par l'inverse de la pose (une homographie) */
      const Hi = inv3(mult3(Hq, decalE));
      [[-12, -12], [W + 12, -12], [W + 12, H + 12], [-12, H + 12]].forEach(([X, Y]) => { const [x, y] = appl(Hi, X, Y); u0 = Math.min(u0, x); u1 = Math.max(u1, x); v0 = Math.min(v0, y); v1 = Math.max(v1, y); });
    }
    if (pK === null) { NET.p0 = NET.p1 = 2; return; }
    NET.p0 = pK; NET.p1 = pDe(tempsDe(pK) + .35);
    const xa = Math.max(0, Math.floor(x0)), ya = Math.max(0, Math.floor(y0)), xb = Math.min(LX, Math.ceil(x1)), yb = Math.min(hautTable.height, Math.ceil(y1));
    if (xb - xa < 8 || yb - ya < 8) { NET.p0 = NET.p1 = 2; return; }
    NET.r = { x: xa, y: ya, w: xb - xa, h: yb - ya };
    const ua = Math.max(xDroit, Math.floor(u0)), va = Math.max(yBord, Math.floor(v0)), ub = Math.min(LX, Math.ceil(u1)), vb = Math.min(vt.h + EXT.h + EXT.b, Math.ceil(v1));
    NET.rb = !DEUX && ub - ua > 16 && vb - va > 16 ? { x: ua, y: va, w: ub - ua, h: vb - va } : null;
    planifierNet();
  }
  /* la dernière pose alignée (fin de la marche, porte à l'instant pB) : départ du zoom vers la planche */
  function alignerFin(porte) {
    L.alignFin = porte ? aligner(K11 && porte.vitrage ? porte.vitrage : porte, 1, porte.table) : null;
    /* L1 : la distance de la table à la fin de la marche (D : la photo telle quelle) et le rapport échelle-distance */
    if (DEUX && porte && porte.table && porte.table.z) L.D = porte.table.z;
  }
  /* la planche de près, telle que la page la pose en ce moment (cadrage, recul et décalage du petit écran compris) */
  /* M5 (treizième passe) : L.panY, un glissement vertical (px) du petit écran : l'idée remonte sous « Créer » */
  function hPres() { const z = L.zoom || 1, cx = W / 2, cy = H * .56; return mult3([z, 0, cx * (1 - z), 0, z, cy * (1 - z) + (L.panY || 0), 0, 0, 1], mult3([1, 0, L.pan * L.s, 0, 1, 0, 0, 0, 1], Hp)); }
  /* J15 : le plateau net, posé sur le plateau du moment (B, celui de la photo de la table), et la bande de mur de la photo
     de près ; k : son opacité (une montée très courte au début, quand la photo de la table n'est
     encore agrandie que de 1,1 à 1,2 fois) */
  function poserPlateau(k) {
    const ok = plateauPret && B && k > .002 && (L.zoom || 1) >= 1;
    vu(presPlateau); setV(presPlateau, ok);
    if (!ok) return;
    setT(presPlateau, m3d(quadVersQuad(Q.planche, B))); setO(presPlateau, k);
  }
  /* J13 : morph (vrai) : pendant le mouvement de la table vers la planche, la photo de près est posée par l'homographie
     qui envoie sa planche sur la planche du moment à l'écran (celle de la table, B) : les deux plateaux coïncident à
     chaque image, le fondu d'opacité ne fait que changer de photo, jamais de géométrie */
  function poserPres(op, morph = false) {
    vu(pres, grav, mur); setV(pres, op > .002); setV(mur, op > .002 && (L.zoom || 1) < 1); setO(mur, op);
    if (murPierre) setV(murPierre, op > .002 && (L.zoom || 1) < 1);
    /* I2 : la planche et le mur sous la lampe */
    const Hpp = morph && B ? quadVersQuad(Q.planche, B) : hPres();
    /* J7 : la lumière rasante, qui glisse de 2 % de la largeur de la planche entre l'entrée et la fin */
    if (soleilPres) { vu(soleilPres); setV(soleilPres, op > .002); setO(soleilPres, op); const sl = vp.w * .02 * clamp(((F.p || .8) - .78) / .22); setT(soleilPres, m3d(mult3(Hpp, [1, 0, sl, 0, 1, 0, 0, 0, 1]))); }
    /* J6 : la pierre autour, avec la photo ; le bord fondu de la photo seulement quand on la voit en entier (petit écran) */
    if (murPierre && (L.zoom || 1) < 1) setT(murPierre, m3d(mult3(Hpp, [RED_MUR, 0, -vp.w, 0, RED_MUR, -vp.h, 0, 0, 1])));   /* S2 : l'élément réduit de RED_MUR, agrandi d'autant */
    if (pres._mqu) { const v = (L.zoom || 1) < 1 ? pres._mqu : 'none'; if (pres._mq !== v) { pres._mq = v; pres.style.webkitMaskImage = pres.style.maskImage = v; } }
    /* J2 : la photo de la planche porte déjà la lumière de la lampe (à l'aplomb du câble, cable_lampe_x) : le voile chaud
       n'est plus qu'un appoint, centré sur la lampe */
    /* J2 bis : la photo de la planche en pierre porte déjà la lumière de la lampe : plus de voile chaud */
    const kp = vp.reel && vp.reperes.cable_lampe_x !== undefined ? 0 : intensite() * clamp(op); vu(lampePres); setV(lampePres, kp > .003); setO(lampePres, kp);
    if (kp > .003 && vp.reperes.cable_lampe_x) { const c = appl(Hpp, vp.reperes.cable_lampe_x * vp.w, 0); const v = Math.round(c[0]) + 'px'; if (lampePres._lx !== v) { lampePres._lx = v; lampePres.style.setProperty('--lpx', v); } }
    setT(pres, m3d(Hpp)); setO(pres, op);
    if (grav) { setV(grav, op > .002); setT(grav, epingle(600, 200, Q.gravure.map(([x, y]) => appl(Hpp, x, y)))); setO(grav, op); }
    B = Q.planche.map(([x, y]) => appl(Hpp, x, y)); HB = carreVers(B);
    boiteOuNon(false);
  }

  /* ---- quadrilatères à l'écran ---- */
  const quadImg = q => q.map(([x, y]) => imgEcran(x, y));
  /* quatrième passe, D10 : le téléphone posé est la photo, à son vrai rapport, sans aucun trapèze ; posé droit sur la
     règle, une très légère inclinaison vers l'arrière (hauteur ramenée à 97 %) */
  function quadTel() {
    const a = ecranPl(DISPO.tel[0], DISPO.telBas), b = ecranPl(DISPO.tel[1], DISPO.telBas);
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]), h = l / aspTel * .97, cx = (a[0] + b[0]) / 2, yb = (a[1] + b[1]) / 2;
    return [[cx - l / 2, yb - h], [cx + l / 2, yb - h], [cx + l / 2, yb], [cx - l / 2, yb]];
  }
  const quadCv = () => quadImg(geo.cvImg);
  const quadFeuille = () => quadImg(Q.feuille);
  /* T7 (vingtième passe) : le bas de la feuille avec la caméra telle que centrer() vient de la régler (quadFeuille lit la pose
     de la dernière image, faite par poserPres) */
  const basFeuilleCamera = () => { const Hc = hPres(), HBc = carreVers(Q.planche.map(([x, y]) => appl(Hc, x, y))); let m = -Infinity; for (const [x, y] of Q.feuille) { const [u, v] = appl(Hpli, x, y); m = Math.max(m, appl(HBc, u, v)[1]); } return m; };
  /* la feuille de dessin : (u, v) -> écran */
  const Hfeuille = () => mult3(HB, mult3(Hpli, Hf));
  const feuilleEcran = (x, y) => appl(Hfeuille(), x / SW, y / SH);   /* pixels de la feuille -> écran */

  /* ---- le crayon couché sur la règle : sa pointe et son bout à l'écran ---- */
  function crayonRegle() { const [u0, u1, v] = geo.crayonPl; return { P: ecranPl(u0, v), E: ecranPl(u1, v) }; }
  /* la similitude qui pose une image sur deux points : a (image) -> A (écran), b -> B */
  function surDeux(a, b, A, Bp) {
    const va = [b[0] - a[0], b[1] - a[1]], vb = [Bp[0] - A[0], Bp[1] - A[1]];
    const s = Math.hypot(...vb) / Math.hypot(...va), ang = Math.atan2(vb[1], vb[0]) - Math.atan2(va[1], va[0]);
    const c = Math.cos(ang) * s, si = Math.sin(ang) * s;
    return [c, -si, A[0] - (c * a[0] - si * a[1]), si, c, A[1] - (si * a[0] + c * a[1]), 0, 0, 1];
  }
  /* pose du crayon dessiné : sur la règle, ou par une matrice donnée (tenu par le visiteur) */
  function poserCrayon(o) {
    vu(crayon, crayonOmbre);
    const r = crayonRegle(), Hc = o.H || surDeux(cP, cB, r.P, r.E);
    const op = o.op === undefined ? 1 : o.op;
    setV(crayon, op > .002); setT(crayon, m3d(Hc)); setO(crayon, op);
    /* Q6 ; S2 (dix-neuvième passe) : la zone au doigt seulement quand le crayon se prend (bouton ou crayon libre) */
    if (DOIGT) zoneDoigt(crayon, Hc, vcd.w, vcd.h, !!(o.bouton || o.libre));
    crayon.style.zIndex = o.z || 18;
    const P = appl(Hc, ...cP), E = appl(Hc, ...cB), lev = o.leve || 0;
    const dx = E[0] - P[0], dy = E[1] - P[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l, ep = Math.max(6, l * .04);
    const q = [[P[0] - nx * ep * .4, P[1] - ny * ep * .4], [E[0] - nx * ep * .4, E[1] - ny * ep * .4], [E[0] + nx * ep * .6, E[1] + ny * ep * .6], [P[0] + nx * ep * .6, P[1] + ny * ep * .6]].map(([x, y]) => [x + 4 + lev * 18, y + 6 + lev * 22]);
    setV(crayonOmbre, op > .002); setT(crayonOmbre, epingle(200, 20, q)); setO(crayonOmbre, op * (.7 - lev * .35));
    crayon.classList.toggle('libre', !!o.libre);
    crayon.tabIndex = o.bouton || o.libre ? 0 : -1;
    return Hc;
  }
  /* la main au crayon posée de sorte que son crayon tombe exactement sur le crayon couché */
  const Hmain = () => { const r = crayonRegle(); return surDeux(mainP, mainB, r.P, r.E); };

  /* ---- la feuille de dessin : le papier, et l'idée ---- */
  let papierC = null, dessinsPrets = false, derniereCle = '';
  /* Le papier de la feuille de dessin, au format de la planche (bien plus large que la photo) : les deux bords
     gardent leur échelle (le coin qui se soulève, le grain), le milieu est fait de la bande centrale de la photo
     puis de son miroir ; un fondu raccorde le miroir au bord droit. Le grain n'est jamais étiré de plus de 10 %. */
  function composerPapier(SW, SH) {
    const c = document.createElement('canvas'); c.width = SW; c.height = SH;
    const g = c.getContext('2d'), co = reperesPx(vfd, 'corps') || [[0, 0], [vfd.w, 0], [vfd.w, vfd.h], [0, vfd.h]];
    const x0 = Math.min(co[0][0], co[3][0]), y0 = Math.min(co[0][1], co[1][1]), x1 = Math.max(co[1][0], co[2][0]), y1 = Math.max(co[2][1], co[3][1]);
    const w = x1 - x0, h = y1 - y0, s = SH / h;
    if (SW <= w * s * 1.1) { g.drawImage(vfd.image, x0, y0, w, h, 0, 0, SW, SH); return c; }
    const wB = w * .25 * s, wM = (SW - 2 * wB) / 2, mx0 = x0 + w * .25, mw = w * .5;
    g.drawImage(vfd.image, x0, y0, w * .25, h, 0, 0, wB + 1, SH);
    g.drawImage(vfd.image, mx0, y0, mw, h, wB, 0, wM + 1, SH);
    g.save(); g.translate(wB + 2 * wM, 0); g.scale(-1, 1); g.drawImage(vfd.image, mx0, y0, mw, h, 0, 0, wM + 1, SH); g.restore();
    /* le bord droit, et un fondu de raccord sur sa gauche */
    const f = Math.min(wM * .6, w * .18 * s), t = document.createElement('canvas'); t.width = Math.ceil(wB + f); t.height = SH;
    const tg = t.getContext('2d'); tg.drawImage(vfd.image, x1 - w * .25 - f / s, y0, w * .25 + f / s, h, 0, 0, t.width, SH);
    tg.globalCompositeOperation = 'destination-in'; const gr = tg.createLinearGradient(0, 0, f, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, '#000'); tg.fillStyle = gr; tg.fillRect(0, 0, t.width, SH);
    g.drawImage(t, SW - t.width, 0);
    /* L13 : plus d'agrafe dans le papier commun (il sert aussi à la page blanche du dessous) : elle est posée sur la feuille
       du dessus (agrafe, face « dessus »), sur son dos (face « dos ») et, à peine, sur la page du dessous (« marques ») */
    return c;
  }
  /* L11 puis L13 (douzième passe) : l'agrafe tient tout le bloc. Elle est près du coin haut droit, à 12 px du bord haut
     et du bord droit à l'échelle de la planche (1 % de la largeur de la feuille), un peu de biais (8 degrés), une
     couronne d'acier de 3 % de la largeur. Trois faces : « dessus », sur la feuille de dessin (dégradé métallique,
     reflet, ombre fine, ses deux pointes enfoncées, le papier marqué autour) ; « dos », au dos de la feuille, qui la
     voit tourner avec elle (les deux pointes repliées l'une vers l'autre ; le dos est vu à l'envers par la page, aux mêmes
     coordonnées) ; « marques », sur la page blanche du dessous (deux très légers creux aux pointes, rien d'autre).
     Jamais d'agrafe par-dessus la feuille retournée. k : l'échelle du canevas (pixels de la feuille vers ce canevas) */
  const AGRAFE = () => {
    /* (le bord droit visible du papier est à 0,8 % en deçà du bord de la feuille : le grain du bord de la photo) */
    const m = .0104 * SW, mx = .0187 * SW, L = .03 * SW, e = Math.max(2.2, .0028 * SW), a = 8 * Math.PI / 180;
    const x1 = SW - mx - e * .6, y1 = m + e * .6, x0 = x1 - L * Math.cos(a), y0 = y1 + L * Math.sin(a);
    return { x0, y0, x1, y1, e, L };
  };
  function agrafe(g, face, k = 1) {
    const { x0, y0, x1, y1, e } = AGRAFE();
    g.save(); g.scale(k, k);
    if (face === 'marques') {
      [[x0, y0], [x1, y1]].forEach(([x, y]) => { const r = g.createRadialGradient(x, y, 0, x, y, e * 1.6); r.addColorStop(0, 'rgba(70,58,40,.14)'); r.addColorStop(1, 'rgba(70,58,40,0)'); g.fillStyle = r; g.fillRect(x - e * 1.6, y - e * 1.6, e * 3.2, e * 3.2); });
    } else if (face === 'dos') {
      /* les deux pointes, repliées à plat l'une vers l'autre, sur un tiers de la couronne chacune */
      const dx = (x1 - x0) / 3, dy = (y1 - y0) / 3;
      g.lineCap = 'round';
      [[x0, y0, 1], [x1, y1, -1]].forEach(([x, y, s]) => {
        g.save(); g.shadowColor = 'rgba(30,22,12,.4)'; g.shadowBlur = e * .9; g.shadowOffsetX = e * .3; g.shadowOffsetY = e * .6;
        const mg = g.createLinearGradient(0, y - e / 2, 0, y + e / 2); mg.addColorStop(0, '#eceef1'); mg.addColorStop(.45, '#b9bdc3'); mg.addColorStop(1, '#73777e');
        g.strokeStyle = mg; g.lineWidth = e * .9; g.beginPath(); g.moveTo(x, y); g.lineTo(x + s * dx, y + s * dy); g.stroke(); g.restore();
        g.fillStyle = 'rgba(28,26,30,.7)'; g.beginPath(); g.ellipse(x, y, e * .5, e * .55, 0, 0, Math.PI * 2); g.fill();
      });
    } else {
      /* le papier marqué autour des pointes */
      [[x0, y0], [x1, y1]].forEach(([x, y]) => { const r = g.createRadialGradient(x, y, 0, x, y, e * 3.2); r.addColorStop(0, 'rgba(60,48,30,.28)'); r.addColorStop(1, 'rgba(60,48,30,0)'); g.fillStyle = r; g.fillRect(x - e * 3.2, y - e * 3.2, e * 6.4, e * 6.4); });
      /* l'ombre fine, la couronne (dégradé pris en travers de la couronne) */
      g.shadowColor = 'rgba(30,22,12,.45)'; g.shadowBlur = e * 1.1; g.shadowOffsetX = e * .45; g.shadowOffsetY = e * .8;
      const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const mg = g.createLinearGradient(cx - nx / nl * e / 2, cy - ny / nl * e / 2, cx + nx / nl * e / 2, cy + ny / nl * e / 2);
      mg.addColorStop(0, '#6a6e75'); mg.addColorStop(.38, '#9a9ea5'); mg.addColorStop(.7, '#d4d7dc'); mg.addColorStop(1, '#f6f7f9');
      g.strokeStyle = mg; g.lineWidth = e; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.shadowColor = 'transparent';
      /* le reflet le long de la couronne, plus vif au milieu */
      const rf = g.createLinearGradient(x0, y0, x1, y1); rf.addColorStop(0, 'rgba(255,255,255,0)'); rf.addColorStop(.42, 'rgba(255,255,255,.85)'); rf.addColorStop(.6, 'rgba(255,255,255,.2)'); rf.addColorStop(1, 'rgba(255,255,255,0)');
      const ox = nx / nl * e * .22, oy = ny / nl * e * .22, ux = (x1 - x0) / (Math.hypot(x1 - x0, y1 - y0) || 1) * e, uy = (y1 - y0) / (Math.hypot(x1 - x0, y1 - y0) || 1) * e;
      g.strokeStyle = rf; g.lineWidth = e * .35; g.beginPath(); g.moveTo(x0 + ux - ox, y0 + uy - oy); g.lineTo(x1 - ux - ox, y1 - uy - oy); g.stroke();
      /* les deux pointes, enfoncées dans le papier */
      [[x0, y0], [x1, y1]].forEach(([x, y]) => { g.fillStyle = 'rgba(28,26,30,.85)'; g.beginPath(); g.ellipse(x, y + e * .1, e * .55, e * .62, 0, 0, Math.PI * 2); g.fill(); });
    }
    g.restore();
  }
  /* l'idée : unités du site vers la zone de l'idée (pixels de la feuille) */
  const objets = {};
  const EXT_IDEE = [0, -78, SITE.app.x + SITE.app.w + 14, SITE.app.y + SITE.app.h + 12];
  function placerIdee() {
    const iq = geo.ideeImg.map(([x, y]) => fpx(x, y));
    const zx0 = Math.min(iq[0][0], iq[3][0]), zx1 = Math.max(iq[1][0], iq[2][0]), zy0 = Math.min(iq[0][1], iq[1][1]), zy1 = Math.max(iq[2][1], iq[3][1]);
    const ext = EXT_IDEE;
    const k = Math.min((zx1 - zx0) / (ext[2] - ext[0]), (zy1 - zy0) / (ext[3] - ext[1]));
    return { k, ox: zx0 + ((zx1 - zx0) - (ext[2] - ext[0]) * k) / 2 - ext[0] * k, oy: zy0 + ((zy1 - zy0) - (ext[3] - ext[1]) * k) / 2 - ext[1] * k };
  }
  function preparerDessins() {
    papierC = composerPapier(SW, SH);
    objets.idee = placerIdee();
    dessinsPrets = true;
  }
  /* M5 (treizième passe) : sur téléphone, le cadrage de l'idée entière (la question manuscrite, le site et l'application
     « Mon club ») : l'abscisse (image) de son milieu et le recul qui la fait tenir dans la largeur de l'écran avec une
     marge de chaque côté (16 px) */
  function cadrageIdee(o = {}) {
    const marge = o.marge || 16;
    const I = placerIdee(), e = EXT_IDEE;
    const coins = [[e[0], e[1]], [e[2], e[1]], [e[2], e[3]], [e[0], e[3]]].map(([x, y]) => appl(Hf, (I.ox + x * I.k) / SW, (I.oy + y * I.k) / SH));
    const xs = coins.map(c => c[0]), x0 = Math.min(...xs), x1 = Math.max(...xs), zoom = Math.min(1, (W - 2 * marge) / ((x1 - x0) * L.s));
    /* le groupe « Créer », sa légende (o.bloc : sa hauteur) et l'idée, centré en hauteur entre la barre de navigation
       (o.haut) et le rail (o.bas), un peu au-dessus du milieu ; l'idée à 28 px sous la légende : glissement vertical */
    const yTop = Math.min(...coins.map(c => c[1])), yBas = Math.max(...coins.map(c => c[1])), cy = H * .56, y0 = cy + (yTop * L.s + L.oy - cy) * zoom;
    const hIdee = (yBas - yTop) * L.s * zoom, hGroupe = (o.bloc || 0) + 28 + hIdee;
    const haut = o.haut === undefined ? null : o.haut + Math.max(0, ((o.bas || H) - o.haut - hGroupe) * .42);
    const dy = haut === null ? 0 : haut + (o.bloc || 0) + 28 - y0;
    return { x: (x0 + x1) / 2, zoom, dy, x0, x1, blocHaut: haut };
  }
  /* quatrième passe, D11 : l'application « Mon club » est posée devant le site, sur un morceau de papier opaque,
     avec un fin liseré de papier autour et une ombre légère (unités du site) */
  function papierApp(g, k) {
    if (k <= 0) return;
    const A = SITE.app, m = 9, x = A.x - m, y = A.y - m, w = A.w + 2 * m, h = A.h + 2 * m, r = 22;
    const forme = () => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    g.save(); g.globalAlpha = clamp(k * 3);
    g.shadowColor = 'rgba(40,28,10,.28)'; g.shadowBlur = 10; g.shadowOffsetX = 2; g.shadowOffsetY = 4;
    forme(); g.fillStyle = '#f4f0e6'; g.fill();
    g.shadowColor = 'transparent';
    /* le grain du papier, repris de la feuille elle-même */
    forme(); g.clip(); const I = objets.idee; g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(papierC, 0, 0); g.restore();
    g.save(); g.globalAlpha = clamp(k * 3) * .5; forme(); g.strokeStyle = 'rgba(120,100,60,.35)'; g.lineWidth = 1; g.stroke(); g.restore();
  }
  /* l'état de la feuille : idée { qm, morph, croquis, couleur[8], app, appCouleur, annot } */
  function peindreFeuille(e) {
    /* N1 : la feuille reprend sa taille si elle l'avait rendue (téléphone, loin de l'atelier) */
    if (fc.width !== SW || fc.height !== SH) { fc.width = SW; fc.height = SH; derniereCle = ''; }
    if (!dessinsPrets) preparerDessins();
    const cle = [e.qm, e.morph, e.croquis, (e.couleur || []).join(','), e.app, e.appCouleur, e.annot, e.legende, e.trou ? 1 : 0, pretes() ? 1 : 0].map(v => typeof v === 'number' ? v.toFixed(4) : v).join('|');
    if (cle === derniereCle) return; derniereCle = cle;
    const g = fg; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, SW, SH);
    g.drawImage(papierC, 0, 0);
    /* L13 : l'agrafe, sur la feuille du dessus */
    agrafe(g, 'dessus');
    /* D12 : le petit trou laissé par le clou du CV dans la feuille de dessin */
    if (e.trou) {
      const q = geo.cvImg, fu = (fe.clouBasUV[0] - fe.corpsU[0]) / (fe.corpsU[1] - fe.corpsU[0]), fv = (fe.clouBasUV[1] - fe.corpsV[0]) / (fe.corpsV[1] - fe.corpsV[0]);
      const [x, y] = fpx(...appl(carreVers(q), fu, fv)), r = SW / 520;
      g.save(); const rg = g.createRadialGradient(x, y, 0, x, y, r * 2.2); rg.addColorStop(0, 'rgba(30,22,14,.85)'); rg.addColorStop(.42, 'rgba(60,46,30,.55)'); rg.addColorStop(.6, 'rgba(120,100,70,.18)'); rg.addColorStop(1, 'rgba(120,100,70,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(x, y, r * 2.2, 0, Math.PI * 2); g.fill(); g.restore();
    }
    const I = objets.idee, T0 = [I.k, 0, 0, I.k, I.ox, I.oy];
    g.save(); g.setTransform(...T0);
    const kc = Math.max(...(e.couleur || [0]));
    /* F18 : la question, écrite à la main au-dessus du dessin, sur une ligne (Caveat, l'écriture du CV), à l'encre ;
       elle s'écrit de gauche à droite quand le crayon arrive */
    if ((e.legende || 0) > 0) {
      const txt = 'Une idée de site, d’application, de logiciel ?', taille = 40;
      g.save(); g.font = `400 ${taille}px Caveat, cursive`; g.fillStyle = '#16205C'; g.globalAlpha = .88; g.textBaseline = 'alphabetic';
      const lw = g.measureText(txt).width, x0 = 4, y0 = -16;
      g.beginPath(); g.rect(x0 - 6, y0 - taille, (lw + 14) * clamp(e.legende), taille * 1.5); g.clip();
      g.translate(x0, y0); g.rotate(-.006); g.fillText(txt, 0, 0);
      g.restore();
    }
    if (kc > 0) peindreSite(g, e.couleur, im);
    idee.morphes.forEach(m => m.rendre(e.morph || 0));
    /* le site (croquis et couleurs) d'abord ; l'application ensuite, sur son papier */
    idee.D.peindre(g, { qm: e.qm || 0, croquis: e.croquis || 0, app: 0, annot: e.annot || 0 }, 1 - .86 * kc);
    const ka = Math.max(e.app || 0, e.appCouleur || 0);
    if (ka > 0) {
      papierApp(g, ka); g.setTransform(...T0);
      if ((e.appCouleur || 0) > 0) peindreApp(g, e.appCouleur, im);
      idee.D.peindre(g, { app: e.app || 0 }, 1 - .86 * (e.appCouleur || 0));
    }
    g.restore();
  }
  /* la pointe du crayon (écran) sur l'idée */
  function pointe(quoi, u) {
    if (!dessinsPrets) preparerDessins();
    const I = objets.idee, P = typeof quoi === 'string' ? idee.D.pointe(quoi, u) : quoi;
    return feuilleEcran(I.ox + P[0] * I.k, I.oy + P[1] * I.k);
  }
  function poserFeuille(o) {
    vu(fc);
    const op = o.op === undefined ? 1 : o.op;
    setV(fc, op > .002); setT(fc, epingle(SWc, SHc, quadFeuille())); setO(fc, op);
    if (o.etat) peindreFeuille(o.etat);
  }
  /* H7 : k de 0 à 1 (le bloc de la surbrillance, puis sa disparition quand la main prend la feuille) */
  function poserHalo(k) {
    vu(halo);
    if (!(k > .002)) { setV(halo, false); return; }
    if (!dessinsPrets) preparerDessins();
    const bx = 36, by = 232, bw = 290, bh = 52;
    const q = [[bx, by], [bx + bw, by], [bx + bw, by + bh], [bx, by + bh]].map(pt => pointe(pt));
    setV(halo, true); setT(halo, epingle(290, 52, q)); setO(halo, k);
  }
  /* N2 (quatorzième passe) : la page blanche préparée hors du chemin de l'image (tâche de fond avant la page) */
  function preparerPageBlanche() {
    if (!dessinsPrets) preparerDessins();
    if (page.width !== SW || page.height !== SH) { page.width = SW; page.height = SH; page.style.width = SWc + 'px'; page.style.height = SHc + 'px'; const pg = page.getContext('2d'); pg.drawImage(papierC, 0, 0); /* L13 : sous la feuille retournée, deux très légers creux, pas d'agrafe */ agrafe(pg, 'marques'); }
  }
  function poserPage(op) {
    vu(page); preparerPageBlanche();
    setV(page, op > .002); setT(page, epingle(SWc, SHc, quadFeuille())); setO(page, op);
  }
  function poserTrace(actif) { vu(trace); if (actif && trace.width !== Math.round(SW)) { trace.width = Math.round(SW); trace.height = Math.round(SH); } setV(trace, actif); setT(trace, epingle(SWc, SHc, quadFeuille())); }
  /* N1 (quatorzième passe) : sur téléphone, les calques lourds de l'atelier n'existent que près de leur plan. La pièce vue
     par la porte (le plancher, le tablier, la table seule et sa lampe : 14 Mo) ne se voit que de 0,68 à 0,78 : rendue avant
     0,58 et après 0,82, repeinte en tâche de fond dès 0,60 (depuis la photo pleine, gardée) ou au retour sous 0,80 ; la
     feuille de dessin et son papier (7 Mo) n'existent qu'après 0,60, la page blanche qu'après 0,90, le tracé du visiteur
     qu'à la fin. La photo pleine (le mur), la pièce éteinte et la planche de près restent : elles coûtent un calcul long. */
  let tacheReveil = null, tacheFeuille = null, venuAtelier = false, endormiesAuRetour = false;   /* X1 */
  function memoire(p) {
    if (!TEL) return;
    /* N2 : réveillées dès le croisement (0,45 : à l'arrêt 2, le film attend, il reste du temps entre les images), et non plus
       pendant la route ; d'un coup seulement si l'on saute dans la pièce */
    /* T14 (07/10/2026) : la pièce ne se réveille pas pendant un défilement rapide (VUE.rapide) : un retour de la fin vers le
       départ la repeignait d'un coup en passant par 0,69 (20 Mo de canevas et 60 ms de dessin dans une image), pour la rendre
       deux images plus loin. Elle se réveille quand le défilement ralentit, là où on la voit ; la tâche de réveil vérifie à
       son tour où est la cible */
    const rapide = VUE.rapide(), ciblePiece = () => { const q = VUE.cible === null ? p : VUE.cible; return q > .45 && q < .80; };
    /* X4 (vingt-quatrième passe, 08/10/2026) : aucun canevas affiché avant d'être complet. La table seule (son bas, son haut, sa lampe) est
       repeinte par étapes, une par tâche ; si la vue arrive là où la pièce se voit (0,67 et plus) pendant que la tâche est en cours, la
       suite est faite tout de suite, avant que les plans posent la pièce : jamais une table à moitié peinte à l'écran */
    if (tacheReveil && p >= .67) { const tr = tacheReveil; tr.sync = true; for (const _ of tr.gen) { /* la suite, d'un coup */ } tr.fini = true; tacheReveil = null; }
    /* X1 (vingt-quatrième passe, 08/10/2026) : la règle symétrique de la porte. En revenant de l'atelier vers le chemin (la vue est
       allée au-delà de 0,70, la cible du défilement est derrière elle), la pièce et la feuille de dessin rendent leur mémoire dès que la
       pièce n'est plus dans le cadre (sous 0,678 : ses calques paraissent à 0,678 dans les carreaux de la façade), avant que le CV se
       refasse (cv.js, sous 0,677) ; elles ne se réveillent pas tant qu'on revient : quand on s'arrête ou qu'on repart vers l'atelier,
       comme à l'aller (la porte de moteur.js attend qu'elles soient prêtes) */
    if (p >= .70) venuAtelier = true;
    const recul = VUE.recul(p), rendreRetour = venuAtelier && p < .678 && recul;
    /* rendues au retour, elles attendent que l'on reparte vers l'atelier (la cible du défilement devant la vue) ou que l'on soit revenu
       avant le croisement : une pause pendant le retour ne les réveille pas */
    if (endormiesAuRetour && ((VUE.cible !== null && VUE.cible > p + .0005) || p < .45)) endormiesAuRetour = false;
    const reveilPermis = !recul && !endormiesAuRetour;
    if (DEUX && !PIECE_REPOS && (p < .40 || p > .82 || rendreRetour)) { PIECE_REPOS = true; liberer(table, tablier, tsBas, tsHaut, tsLampe, PLAFP && PLAFP.c);   /* Y10 A : le plafond */ if (rendreRetour) endormiesAuRetour = true; if (rendreRetour && window.__diag) window.__diag.noter('pièce rendue au retour p ' + p.toFixed(3)); }
    /* T14 bis : la pièce attend 900 ms de calme (400 si elle est déjà en vue), la feuille de dessin 1 400 : après le CV */
    else if (DEUX && PIECE_REPOS && p > .45 && p < .80 && !rapide && reveilPermis && VUE.calme() > (p >= .67 ? 400 : 900)) {
      /* trop près pour attendre la tâche (ouverture directe, saut de chapitre) : repeinte tout de suite */
      if (p >= .67) { PIECE_REPOS = false; peindreBas(); peindreTableSeule(P2.pieds); }
      else if (!tacheReveil) {
        /* P4 bis : la table seule repeinte par étapes (peindreTableSeuleEtapes) */
        const tr = tacheReveil = { nom: 'piece-reveil', besoin: .66, gen: (function* () { yield; if (PIECE_REPOS && ciblePiece()) { PIECE_REPOS = false; peindreBas(); yield LOURD; yield* peindreTableSeuleEtapes(P2.pieds); } tacheReveil = null; if (!tr.sync && ctx.redessiner) ctx.redessiner(); })() };
        planifier(tacheReveil, p > .64);
      }
    }
    if ((p < .40 || rendreRetour) && (fc.width || (papierC && papierC.width))) { liberer(fc, papierC); papierC = null; dessinsPrets = false; derniereCle = ''; if (rendreRetour) endormiesAuRetour = true; }   /* X1 : rendreRetour */
    /* N2 : la feuille et son papier préparés dès le croisement, en tâche de fond (ils l'étaient à la première image où la feuille
       se voit, par la porte, en pleine route) */
    else if (p > .45 && p < .80 && !rapide && reveilPermis && VUE.calme() > 1400 && !dessinsPrets && !tacheFeuille) {   /* X1 : reveilPermis */
      /* T14 : pas pendant un défilement rapide ; la tâche vérifie à son tour où est la cible */
      tacheFeuille = { nom: 'feuille-reveil', besoin: .67, gen: (function* () { yield; const q = VUE.cible === null ? p : VUE.cible; if (q < .40) { tacheFeuille = null; return; } if (fc.width !== SW || fc.height !== SH) { fc.width = SW; fc.height = SH; derniereCle = ''; } yield; if (!dessinsPrets) preparerDessins(); tacheFeuille = null; })() };
      planifier(tacheFeuille);
    }
    if (rendreRetour) venuAtelier = false;   /* X1 : rendues une fois par retour */
    if (p < .90 && page.width) liberer(page);
    if (p < .95 && trace.width) liberer(trace);
  }
  /* la bulle « Parler de mon projet » : dans la perspective de la feuille, sous la phrase */
  function poserBulle(k, actif, q) {
    vu(bulle); setV(bulle, k > .002); setT(bulle, epingle(236, 46, q.map(([x, y]) => [x, y + (1 - k) * 10]))); setO(bulle, k);
    bulle.classList.toggle('actif', !!actif); bulle.tabIndex = actif ? 0 : -1;
  }
  function poserCoin(o) {
    vu(coin);
    const H = Hfeuille();
    /* sur téléphone, le coin de la feuille sort du cadre : la commande se pose au bas de la feuille, au bord droit de l'écran */
    let u1 = 1;
    if (L.mob) { let a = 0, b = 1; for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (appl(H, m, 1)[0] < W - 16) a = m; else b = m; } u1 = Math.min(1, a); }
    const du = .13 * (u1 < 1 ? .55 : 1), q = [[u1 - du, .74], [u1, .74], [u1, 1], [u1 - du, 1]].map(([u, v]) => appl(H, u, v));
    setV(coin, !!o.actif); setT(coin, epingle(120, 120, q));
    coin.classList.toggle('appel', !!o.appel);
    coin.tabIndex = o.actif ? 0 : -1;
  }
  return {
    poseAlignee, poseLibre, reglerNet, get net() { return NET; }, poserPlateau, lampePhoto: LAMPE_PHOTO, lampeHD: LAMPE_HD /* N9 : pour les essais */, dims, debut, fin, poserTable, alignerFin, poserPres, poserFeuille, poserPage, poserTrace, poserBulle, poserCoin, poserCrayon, poserHalo,
    quadTel, quadCv, quadFeuille, basFeuilleCamera, Hfeuille, feuilleEcran, imgEcran, ecranPl, crayonRegle, surDeux, Hmain, pointe, peindreFeuille,
    /* petit écran : la caméra glisse le long de la planche (x : abscisse image à centrer) et recule au besoin */
    centrer(x, zoom = 1, dy = 0) { if (L.mob) { L.pan = (W / 2 - L.ox) / L.s - x; L.zoom = zoom; L.panY = dy; } },
    cadrageIdee, get cadrage() { return L.cadrage; }, set cadrage(c) { L.cadrage = c; },
    zoomIdee() { const g = geo.ideeImg, l = Math.hypot(g[1][0] - g[0][0], g[1][1] - g[0][1]); return Math.min(1, W * .94 / (l * L.s)); },
    /* l'abscisse image du milieu du crayon couché (petit écran : la caméra s'y cale à l'arrêt 3) */
    crayonMilieuImg() { const [u0, u1, v] = geo.crayonPl; return imgPl((u0 + u1) / 2, v)[0]; },
    zoomPlanche() { const q = Q.planche, l = Math.max(Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]), Math.hypot(q[2][0] - q[3][0], q[2][1] - q[3][1])); return Math.min(1, W * .98 / (l * L.s)); },
    get L() { return L; }, get geo() { return geo; }, Q, DISPO, accord: ACCORD,
    /* M9 : le plafond peint (pour les essais et sa préparation) */
    get haut() { return HAUT; },
    /* X1 (vingt-quatrième passe, 08/10/2026) : la porte de l'atelier (moteur.js) attend que la pièce soit réveillée et peinte (la table
       seule, son plancher, son tablier : vus par la porte dès 0,689) et que la feuille de dessin et son papier soient prêts */
    pretEntree: () => !TEL || ((!DEUX || (!PIECE_REPOS && !tacheReveil)) && dessinsPrets && !tacheFeuille),
    canevas: fc, agrafe, memoire, preparerPageBlanche, get taille() { return [SW, SH]; }, get cle() { return derniereCle; }, get papier() { if (!dessinsPrets) preparerDessins(); return papierC; },
    main: { P: mainP, B: mainB, prise: mainPrise }, crayonImg: { P: cP, B: cB },
    elements: { crayon, coin, bulle, trace, page, fc }
  };
}
