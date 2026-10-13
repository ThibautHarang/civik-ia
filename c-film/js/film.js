/* =====================================================================
   Le film : assemble les objets partagés (gravure, monde, téléphone, CV,
   mains, atelier) et les huit plans. Chaque image : chaque plan rend ses
   propres textes ; seul le plan actif pose les objets partagés ; ce qui
   n'a pas été posé est caché.
   ===================================================================== */
import { PLANS, T, tempsDe, pDe } from './temps.js';
import { son } from './son.js';
import { ECH } from './telephone.js';
import { clamp, sseg, setO, rng, eDepl } from './outils.js';
import { visuel, provisoire, NOMS_FILM } from './visuels.js';
import { creerFond } from './fond.js';
import { creerMonde } from './monde.js';
import { creerTelephone } from './telephone.js';
import { creerCv as creerFeuille } from './cv.js';
import { creerPapier } from './papier.js';
import { creerMains } from './mains.js';
import { creerAtelier } from './atelier.js';
import { signalerImage, enAttente } from './lavis.js';   /* X1 : enAttente */
import { creerLampe } from './lampe.js';
import { TEL, VUE } from './memoire.js';   /* X1 : VUE */
import { plan1 } from './plans/p1-nuit.js';
import { plan2 } from './plans/p2-depart.js';
import { plan3 } from './plans/p3-marche.js';
import { plan4 } from './plans/p4-croisement.js';
import { plan5 } from './plans/p5-evidence.js';
import { plan6, reglerEntree, poseTablePour } from './plans/p6-atelier.js';
import { plan7 } from './plans/p7-dessin.js';
import { plan8 } from './plans/p8-page.js';

/* I4 : main-gauche-ouverte n'est lue que si le manifeste porte son entrée (sinon, la prise de la huitième passe) */
/* J2 (dixième passe) : lampe-atelier, la suspension allumée, détourée (lue seulement si le manifeste porte son entrée) */
/* J11 : la planche des herbes gravées (herbes) est désormais lue : de petites plantes en fleurs le long du chemin */
/* J12 bis : calade, la tuile gravée de la calade (sa carte d'ordre est lue par le monde) */
/* L1 (douzième passe) : atelier-fond et atelier-table-seule, la pièce en deux plans (lues seulement si le manifeste porte
   leurs entrées ; sans elles, le plan unique) */
/* M9 bis (treizième passe) : atelier-fond est désormais la pièce avec son plafond (version « poutres ») ; l'entrée
   atelier-plafond n'existe plus */
/* U1 (vingt et unième passe) : la liste est dans visuels.js (NOMS_FILM), pour que main.js demande ces visuels dès la première image
   du téléphone, avant que le script du film soit chargé */
const NOMS = NOMS_FILM;

export async function creerFilm(scene, options = {}) {
  const vis = {}, t0 = performance.now(), chrono = window.__chrono = {};
  const top = n => { chrono[n] = Math.round(performance.now() - t0); };
  /* S4 (dix-neuvième passe) : le cahier demandait, en mode économe, un seul plan de la pièce ; mesuré dans le moteur de Safari
     (390 x 844), le plan unique d'avant la douzième passe tient trois canevas de 2496 x 1458 (42 Mo) quand les deux plans,
     allégés par N1, en tiennent un : le mode économe garde donc les deux plans */
  await Promise.all(NOMS.map(async n => { vis[n] = await visuel(n); chrono['v:' + n] = Math.round(performance.now() - t0); }));
  top('visuels');
  /* T3 (vingtième passe) : la création du film tient le fil principal près d'une seconde sur l'iPhone, sans laisser la page se
     peindre ; si l'ébauche du téléphone de la nuit est posée, on la laisse d'abord paraître (main.js : 600 ms au plus) */
  if (options.avant) await options.avant;
  /* I2 : la lampe de l'atelier (son état est lu par le monde, l'atelier et la girouette) */
  const lampe = creerLampe();
  const ctx = { scene, porteurs: scene.querySelector('[data-porteurs]'), atelier: scene.querySelector('[data-atelier]'), options, lampe, redessiner: null };
  const F = { ctx, vis, scene, W: 0, H: 0, mob: false, t: 0, lampe };
  /* filet de secours : si un module échoue avec les fichiers réels qu'il lit, on le refait avec leurs provisoires
     (un fichier déposé ne doit jamais empêcher le film de démarrer) ; l'échec est signalé dans la console */
  async function sur(noms, faire, nettoyer) {
    try { return await faire(); }
    catch (e) {
      const reels = noms.filter(n => vis[n] && vis[n].reel);
      if (!reels.length) throw e;
      console.warn('[film] échec avec ' + reels.join(', ') + ' (' + e.message + ') : provisoires utilisés');
      if (nettoyer) nettoyer();
      for (const n of reels) vis[n] = await provisoire(n);
      return faire();
    }
  }
  const garder = racine => { const n = racine.children.length; return () => { while (racine.children.length > n) racine.lastElementChild.remove(); }; };
  const fond = creerFond(ctx, vis); top('fond');
  const o0 = scene.querySelector('[data-objets0]'), o1 = scene.querySelector('[data-objets1]'), n0 = garder(o0), n1 = garder(o1);
  /* la façade : l'image portes fermées ; l'ancienne photo portes ouvertes n'est demandée que si elle manque */
  const facadeOuSecours = async () => { if (!(vis['atelier-facade-fermee'] && vis['atelier-facade-fermee'].reel) && !vis['atelier-facade']) vis['atelier-facade'] = await visuel('atelier-facade'); };
  const monde = await sur(['poteau-planche', 'atelier-facade-fermee', 'plaque-atelier', 'oiseau-planche', 'oiseau-pose', 'sol-chemin', 'cypres-1', 'cypres-2', 'vigne-1', 'vigne-2', 'borne', 'muret', 'clou'], async () => { await facadeOuSecours(); return creerMonde(ctx, vis); }, () => { n0(); n1(); }); top('monde');
  const nP = garder(ctx.porteurs);
  /* U1 (vingt et unième passe, 07/10/2026) : sur téléphone, le téléphone de la nuit est déjà créé et posé par l'ébauche (main.js) :
     le film l'adopte ; ses éléments rejoindront les porteurs à cette place (l'ancre), quand le film paraît */
  let tel;
  const eb = options.ebauche ? await options.ebauche : null;
  if (eb && eb.tel) { tel = eb.tel; tel._ancre = document.createComment('telephone'); ctx.porteurs.appendChild(tel._ancre); F.ebauche = eb; }
  else tel = await sur(['telephone', 'telephone-trois-quarts'], () => creerTelephone(ctx, vis.telephone, vis['telephone-trois-quarts']), nP);
  top('telephone');
  const papier = creerPapier(scene); top('papier');
  const nP2 = garder(ctx.porteurs);
  const feuille = await sur(['feuille', 'clou'], () => creerFeuille(ctx, papier, vis), nP2); top('feuille');
  const mains = creerMains(ctx, { 'main-gauche-telephone': vis['main-gauche-telephone'], 'main-gauche-ouverte': vis['main-gauche-ouverte'], 'main-droite-saisit': vis['main-droite-saisit'], 'main-droite-feuille': vis['main-droite-feuille'], 'main-crayon': vis['main-crayon'], 'main-souleve': vis['main-souleve'] });
  Object.assign(F, { fond, monde, tel, papier, feuille, mains });
  /* I1 : le lavis du lointain se pose exactement sur le lointain de la couche du ciel */
  monde.geoLointain = fond.geoLointain;
  const nA = garder(ctx.atelier);
  const atelier = await sur(['atelier-table', 'atelier-planche', 'feuille-dessin', 'crayon-dessine', 'lampe-atelier', 'atelier-fond', 'atelier-table-seule'], () => creerAtelier(ctx, vis, F), nA); top('atelier');
  F.atelier = atelier;
  /* X1 (vingt-quatrième passe, 08/10/2026) : l'atelier est-il prêt à être vu (la porte de moteur.js) ? Aucune préparation de besoin
     au plus 0,80 dans la file (la pièce, le plafond, le mur, la vitre, le dos des vantaux, la calade, la plaque, la girouette, la pièce
     éteinte, les lavis, la photo nette, l'accord, le soleil de près), la pièce réveillée et peinte, la feuille de dessin prête ;
     rend la liste de ce qui manque (vide : prêt) */
  F.manqueAtelier = () => { const L = enAttente(.80); if (!atelier.pretEntree()) L.push('piece-ou-feuille'); return L; };
  /* J2 : le monde accroche la lampe vue de dehors à la lampe de la photo de la table, posée comme elle le sera */
  ctx.lampeTable = (p, porte) => poseTablePour(F, p, porte);
  ctx.lampePhoto = atelier.lampePhoto;
  const lumiere = scene.querySelector('[data-lumiere]'), grain = scene.querySelector('[data-grain]');
  /* grain de papier commun, tuile fixe */
  (function () {
    const c = document.createElement('canvas'); c.width = c.height = 180; const g = c.getContext('2d'), R = rng(8), im = g.createImageData(180, 180);
    for (let i = 0; i < im.data.length; i += 4) { const v = R(); im.data[i] = 40; im.data[i + 1] = 44; im.data[i + 2] = 80; im.data[i + 3] = v > .5 ? (v - .5) * 170 : 0; }
    g.putImageData(im, 0, 0); grain.style.backgroundImage = `url(${c.toDataURL()})`;
  })();
  const plans = [plan1, plan2, plan3, plan4, plan5, plan6, plan7, plan8].map(f => f(F)); top('plans');
  /* troisième passe, C.3 : le monde respire avec la souris (ordinateur seulement, à l'arrêt du défilement) :
     le lointain glisse de 12 px, le monde de 7, les mains, le téléphone et la table de 4 ; F.souris est lissée par le moteur */
  F.souris = [0, 0];
  const couches = {
    loin: [scene.querySelector('[data-fond]'), scene.querySelector('.ciel')].filter(Boolean),
    /* L4 (douzième passe) : le lavis du sol rendu dans la page suit le sol gravé */
    monde: ['[data-c0]', '[data-lavsol]', '[data-objets0]', '[data-c1]', '[data-objets1]', '[data-c2]', '[data-lavis]'].map(q => scene.querySelector(q)).filter(Boolean),
    atelier: [ctx.atelier], pres: [ctx.porteurs], papier: [papier.canvas]
  };
  /* les couches sans z-index (atelier, porteurs) ne reçoivent pas de transformation (elle casserait l'entrelacement
     de leurs éléments avec le papier) : on leur passe des variables, que chaque enfant direct applique par « translate » */
  const decaler = (els, dx, dy, zoom) => { const v = dx || dy ? `translate3d(${dx.toFixed(2)}px,${dy.toFixed(2)}px,0)${zoom ? ' scale(' + zoom + ')' : ''}` : ''; els.forEach(e => { if (e && e._px !== v) { e._px = v; e.style.transform = v; } }); };
  const decalerVar = (els, dx, dy) => { const v = dx.toFixed(2) + ',' + dy.toFixed(2); els.forEach(e => { if (e && e._pv !== v) { e._pv = v; e.style.setProperty('--px', dx.toFixed(2) + 'px'); e.style.setProperty('--py', dy.toFixed(2) + 'px'); } }); };
  /* C4 : un très léger tassement de la caméra à chaque pas (1,3 px au plus, sans hochement), sur les mêmes pas que
     le son (même partition : un pas toutes les 0,5 s de film sur la marche, 0,46 s sur la route, là où la caméra
     avance vraiment) ; le monde remonte d'un rien puis revient, les mains et le téléphone ne bougent pas */
  const PAS = (() => {
    const L = [];
    const rampe = (a, b, m, d) => q => sseg(q, a, a + m) * (1 - sseg(q, b - d, b));
    const depl = (a, b) => { const d = u => { const h = .002, u0 = Math.max(0, u - h), u1 = Math.min(1, u + h); return (eDepl(u1) - eDepl(u0)) / (u1 - u0); }; let m = 0; for (let i = 0; i <= 100; i++) m = Math.max(m, d(i / 100)); return q => (q <= a || q >= b ? 0 : d((q - a) / (b - a)) / m); };
    const cloche = (a, b) => q => (q <= a || q >= b ? 0 : Math.pow(Math.sin(Math.PI * (q - a) / (b - a)), .8));
    const poser = (a, b, vit, per) => { const t0 = tempsDe(a), t1 = tempsDe(b); for (let t = t0 + per * .5; t < t1; t += per) { const v = vit(pDe(t)); if (v >= .1) L.push({ t, f: .55 + .45 * Math.min(1, v) }); } };
    const vM = rampe(T.marche[0], T.marche[1], .09, .05), vA = depl(T.approche[0], T.approche[1]);
    poser(T.marche[0], T.approche[1], q => (q <= T.marche[1] ? vM(q) : vA(q)), .5);
    const vR = rampe(T.route[0], T.route[1], .018, .024), vT = cloche(T.route[1], T.table[1]);
    poser(T.route[0], T.route[1], q => (q <= T.route[1] ? vR(q) : vT(q)), .46);
    return L;
  })();
  const tassement = p => { const t = tempsDe(p); let a = 0; for (const s of PAS) { const d = t - s.t; if (d >= 0 && d < .3) a = Math.max(a, s.f * Math.pow(Math.sin(Math.PI * d / .3), 2)); } return a; };
  /* I1 : les décalages de la parallaxe, calculés avant le rendu (le calque des lavis pose le lointain avec ceux de la
     couche du ciel) et appliqués après */
  F.par = { loin: [0, 0, 0], monde: [0, 0] };
  function valeursParallaxe(p) {
    const [mx, my] = F.souris, tas = -1.3 * tassement(p), dx = -mx * 12, dy = -my * 7 + tas;
    F.par.loin[0] = dx; F.par.loin[1] = dy; F.par.loin[2] = dx || dy ? 1.025 : 1;
    F.par.monde[0] = -mx * 7; F.par.monde[1] = -my * 4 + tas;
    return tas;
  }
  function parallaxe(p) {
    const [mx, my] = F.souris, atelierActif = p >= .742, tas = -1.3 * tassement(p);
    decaler(couches.loin, -mx * 12, -my * 7 + tas, 1.025);
    decaler(couches.monde, -mx * 7, -my * 4 + tas);
    decalerVar(couches.atelier, -mx * 4, -my * 2.5);
    decalerVar(couches.pres, -mx * 4, -my * 2.5);
    /* le papier suit l'objet qui le porte : le poteau (monde), la main ou la table */
    const roleMonde = !atelierActif && F.zPapier < 10;
    decaler(couches.papier, roleMonde ? -mx * 7 : -mx * 4, roleMonde ? -my * 4 : -my * 2.5);
    /* H3 : le lien LinkedIn (et le lien du CV) suivent le papier, même quand il est posé sur le poteau (parallaxe du monde) */
    const tr = roleMonde && (mx || my) ? `${(-mx * 7).toFixed(2)}px ${(-my * 4).toFixed(2)}px` : '';
    [F.feuille.lien, F.feuille.cmd].forEach(e => { if (e && e._tr !== tr) { e._tr = tr; e.style.translate = tr; } });
  }
  F.plans = plans;
  /* M1, M7 (treizième passe) : sur téléphone, le cadre utile : sous la barre de navigation (les blocs de texte s'y posent,
     --bloc-haut), au-dessus du rail, posé en bas (F.basUtile) ; le bas du bloc de « Communiquer » (le téléphone de la
     nuit se pose dessous) */
  function mesurerCadre() {
    const nav = document.querySelector('header.nav'), rail = document.querySelector('.rail');
    F.navBas = nav ? Math.round(nav.getBoundingClientRect().bottom) : 0;
    if (F.mob) document.documentElement.style.setProperty('--bloc-haut', (F.navBas + 8) + 'px'); else document.documentElement.style.removeProperty('--bloc-haut');
    const r = rail && !rail.hidden ? rail.getBoundingClientRect() : null;
    F.basUtile = F.mob && r && r.height ? Math.min(F.H, r.top) - 8 : F.H;
    const b1 = scene.querySelector('[data-bloc="1"]'), b4 = scene.querySelector('[data-bloc="4"]'), b7 = scene.querySelector('[data-bloc="7"]');
    F.bloc1Bas = b1 ? b1.offsetTop + b1.offsetHeight : 0;
    F.bloc4Bas = b4 ? b4.offsetTop + b4.offsetHeight : 0;
    F.bloc7Bas = b7 && F.mob ? b7.offsetTop + b7.offsetHeight : 0;
    /* M6 : la place du rail sous le téléphone-menu final (feuille compacte) */
    document.documentElement.style.setProperty('--rail-zone', F.mob ? Math.max(0, Math.round(F.H - F.basUtile)) + 'px' : '0px');
  }
  function dims() {
    F.W = scene.clientWidth; F.H = scene.clientHeight; F.mob = F.W < 768;
    mesurerCadre();
    /* M1 : de retour sur un grand écran (fenêtre élargie), l'écran du téléphone reprend son texte d'ordinateur */
    if (!F.mob) tel.modeMobile(null);
    monde.dims(); fond.dims(monde.L); papier.dims(F.W, F.H); atelier.dims(); tel.mesurer();
    /* M5 (treizième passe) : sur téléphone, l'atelier est cadré sur l'idée dès l'entrée (le passage de la table à la planche
       y arrive directement) */
    if (F.mob) {
      const b7 = scene.querySelector('[data-bloc="7"]'), c = atelier.cadrageIdee({ haut: F.navBas + 8, bas: F.basUtile, bloc: b7 ? b7.offsetHeight : 110 });
      atelier.cadrage = c; atelier.centrer(c.x, c.zoom, c.dy);
      if (b7) b7.style.setProperty('--bloc7-haut', Math.round(c.blocHaut) + 'px');
    } else { const b7 = scene.querySelector('[data-bloc="7"]'); if (b7) b7.style.removeProperty('--bloc7-haut'); }
    plans.forEach(pl => pl.dims && pl.dims());
    reglerEntree(F);
  }
  /* quatrième passe, D14 : les gestes ponctuels du son, au moment exact où ils se voient, seulement quand p avance
     (un saut de chapitre ou un retour en arrière ne déclenche rien). Seuils en valeur de p. */
  const s1 = (a, k) => a[0] + (a[1] - a[0]) * k;
  /* la conversation de la nuit suit son propre temps (elle commence pendant l'ouverture) */
  const CONV = T.conv.flatMap(c => [['envoi', c.envoi, { pan: -.6 }], ['reponse', c.rep[0], { pan: -.6 }], ['source', c.src, { pan: -.6 }]]);
  const GESTES = [
    ['appui', T.appui[0] + .002, { pan: -.6 }], ['prise', T.mainMonte[1], { pan: -.5 }],
    ['guide', T.consigne1 - .006, { pan: -.6 }], ['guide', T.consigne2 - .006, { pan: -.6 }], ['guide', T.arrive - .005, { pan: -.6 }],
    ['tension', T.tire[0] + .002, { pan: .3 }],   /* T10 : plus de déchirure, plus de son de déchirure */
    ['porte', T.porte[1] - .004, {}], ['pose', T.poseTel[1], { pan: -.6 }], ['clou', s1(T.clou, .5), { pan: -.25 }],
    ['crayon-pris', T.saisie[0], { pan: .5 }], ['crayon-pose', T.lache[0], { pan: .5 }],
    /* H10.6 : plus de « glisse » (le téléphone n'est plus poussé) ; « prise » quand la main gauche le saisit sur la
       règle ; H10.3 bis : « guide » quand son écran s'allume dans la main (Marianne écrit) */
    ['prise', s1(T.telPrise, .6), { pan: -.6 }], ['declou', s1(T.declou, .3), { pan: -.3 }],
    ['page', T.tourne[0] + .001, { pan: .4 }], ['page-retombe', s1(T.retombe, .45), { pan: 0 }],
    ['crayon-pris', T.saisie8[0], { pan: .3 }], ['crayon-pose', T.lache8[0], { pan: .5 }], ['guide', T.telAllume[0] + .0002, { pan: -.6 }],
    ['bulle', T.bulle[0] + .001, { pan: .1 }],
    ['fin', .9995, {}]
  ];
  /* les frappes : le nombre de caractères tapés dans le champ, à l'instant p */
  const tapes = p => { let n = 0; ECH.forEach((e, i) => { const t = T.conv[i]; if (!t) return; n += Math.round(e.q.length * clamp((p - t.tape[0]) / (t.tape[1] - t.tape[0]))); }); return n; };
  /* M2, M5 (treizième passe) : sur téléphone, les gestes qui n'ont plus d'objet à l'image ne sonnent pas (le son lui-même ne
     change pas) : l'appui sur « Me guider », la main qui prend le téléphone, les trois consignes du guide, le téléphone et
     le CV posés et cloués sur la planche, la main qui reprend le téléphone, le déclouage du CV */
  const SANS_OBJET_MOB = new Set([T.appui[0] + .002, T.mainMonte[1], T.consigne1 - .006, T.consigne2 - .006, T.arrive - .005, T.poseTel[1], s1(T.clou, .5), s1(T.telPrise, .6), s1(T.declou, .3)]);
  let pPrec = null, cPrec = null;
  let retourMonde = false;   /* X1 : on revient de l'atelier vers le monde (entre 0,752 et 0,79) : le monde reste éveillé jusqu'à 0,79 */
  function sonner(p0, p1, c0, c1) {
    if (options.fixe) return;
    if (p1 > p0 && p1 - p0 <= .02) for (const [nom, seuil, d] of GESTES) if (p0 < seuil && p1 >= seuil && !(F.mob && SANS_OBJET_MOB.has(seuil))) son.evenement(nom, d);
    if (c1 > c0 && c1 - c0 <= .02) {
      for (const [nom, seuil, d] of CONV) if (c0 < seuil && c1 >= seuil) son.evenement(nom, d);
      const nf = tapes(c1) - tapes(c0); if (nf > 0) son.evenement('frappe', { force: Math.min(1, .6 + .1 * nf), pan: -.6, nombre: nf });
    }
  }
  /* H11 : petit écran, le bouton Son (dans .commandes) se pose à droite, 12 px au-dessus du haut visible de la
     messagerie ; quand elle est descendue ou cachée, en bas à droite */
  /* M7 (treizième passe) : plus de messagerie en bas ; le rail occupe le bas de l'écran. Le bouton Son (icône seule) se
     range dans la barre de navigation, dans l'espace libre entre le logo et « Tester Marianne », centré en hauteur : il
     ne chevauche plus rien (posé une fois par redimensionnement) */
  const commandes = document.querySelector('.commandes');
  /* V1 (vingt-deuxième passe, 07/10/2026) : sur téléphone, le bouton du son vit dans la barre de navigation, juste à gauche du
     bouton principal, rond, de la taille du bouton du menu (film.css, .nav .son) ; c'est la barre (une rangée flexible) qui le
     place. Plus de coordonnées calculées (--son-x, --son-y, posées une fois par taille d'écran d'après la boîte de la barre :
     sur l'iPhone de Thibaut, le 07/10 à 23 h 21, l'icône restait à 41 px sous la barre, détachée de tout), plus d'icône
     transparente posée sur la barre, plus de repli au bout du rail (375 px). Le bouton passe dans la barre à la première image,
     encore caché (hidden : sa place y est déjà réservée, film.css), et n'en bouge plus ; il revient dans ses commandes au-dessus
     de 768 px. La place qu'il prend est réglée par film.css selon la largeur (le bouton principal cède 3 ou 4 px de chaque côté,
     puis le logo garde son signe sans son nom) ; ici, un filet, une fois par taille d'écran : si la barre ne tient pas avec le
     plus long des libellés (une police de repli, un réglage de taille du système), le logo perd aussi son nom. « Lancer le film »
     ne se range plus dans la barre (il n'y venait qu'à 412 et 430 px, au chapitre « Créer ») : sur téléphone, c'est « Continuer ». */
  function placerSon() {
    if (!commandes || options.fixe) return;
    const sonB = document.querySelector('[data-son]'), nav = document.querySelector('header.nav'), cta = nav && nav.querySelector('.nav__cta');
    if (!sonB || !nav || !cta) return;
    if (F.mob) { if (sonB.parentNode !== nav || sonB.nextElementSibling !== cta) nav.insertBefore(sonB, cta); }
    else if (sonB.parentNode !== commandes) commandes.prepend(sonB);
    if (commandes._v1 === undefined) { commandes._v1 = 1; commandes.classList.remove('dans-nav', 'deux'); commandes.style.removeProperty('--son-x'); commandes.style.removeProperty('--son-y'); }
    if (!F.mob) { if (nav.classList.contains('nav--sans-nom')) { nav.classList.remove('nav--sans-nom'); if (F.bouton) F.bouton.dims(); } commandes._cleV1 = ''; return; }
    if (!F.bouton || !F.bouton.largeurMax) return;
    const cle = F.W + 'x' + F.H; if (commandes._cleV1 === cle) return; commandes._cleV1 = cle;
    const logo = nav.querySelector('.nav__logo'); if (!logo) return;
    /* la place libre entre le logo et le son, le bouton principal portant le plus long de ses libellés à cette largeur */
    const libre = () => {
      const cs = getComputedStyle(nav), gap = parseFloat(cs.columnGap) || 0, ms = getComputedStyle(sonB);
      const finCta = cta.getBoundingClientRect().right, lMax = F.bouton.largeurMax();
      return finCta - lMax - gap - (parseFloat(ms.marginRight) || 0) - sonB.offsetWidth - gap - logo.getBoundingClientRect().right;
    };
    if (!nav.classList.contains('nav--sans-nom') && libre() < -.5) { nav.classList.add('nav--sans-nom'); F.bouton.dims(); }
  }
  function rendre(p, intro = 1, t = 0) {
    p = clamp(p, 0, 1);
    /* onzième passe (essais, K8) : l'instant de la première image */
    if (window.__premiereImage === undefined) window.__premiereImage = performance.now();
    /* les tâches de fond savent que le film est en mouvement (elles se glissent alors entre les images) */
    if (p !== F.p) signalerImage(p);
    const pc = p - (1 - intro) * .022;
    if (pPrec !== null) sonner(pPrec, p, cPrec, pc); pPrec = p; cPrec = pc;
    F.p = p; F.commande = null; F.descend = 0; F.t = t; F.zPapier = 6; F.vivant = false;
    tel.debut(); feuille.debut(); mains.debut(); atelier.debut(); papier.debut();
    let actif = PLANS.findIndex(pl => p >= pl.de && p < pl.a); if (actif < 0) actif = 7;
    monde.t = t; valeursParallaxe(p); monde.par = F.par;
    lampe.maj(p, t);
    /* X1 (vingt-quatrième passe, 08/10/2026) : sur téléphone, les calques du monde rendent leur mémoire dès qu'ils sont cachés derrière la
       porte (0,756), et non plus à 0,79, sauf quand on revient vers le monde (la cible du défilement en arrière) : le monde se réveille
       alors comme avant (monde.preparerRetour) */
    if (p >= .2 && p < .752) { monde.montrer(); retourMonde = false; } else { monde.cacher(); /* N1 (quatorzième passe) : sur téléphone, dans l'atelier, les calques du monde rendent leur mémoire */ if (TEL) { if (p >= .79 || p < .752) retourMonde = false; else if (VUE.cible !== null && VUE.cible < p - .001) retourMonde = true; if (p >= .79 || (p >= .756 && !retourMonde)) monde.reposer(); } }
    if (TEL) { atelier.memoire(p); feuille.memoire(p); monde.preparerRetour(p); }
    monde.fluide = false;
    plans.forEach((pl, i) => pl.rendre(p, i === actif, intro));
    /* G2 : la colombe bat des ailes vite ; pendant qu'elle est là, on rend chaque image (et non 30 par seconde) */
    F.fluide = monde.fluide || lampe.fluide;
    fond.rendre(p, monde.camera(), monde.cap0);
    tel.fin(); feuille.fin(F.zPapier); mains.fin(); atelier.fin(); papier.fin(F.zPapier);
    parallaxe(p);
    placerSon();
    /* même lumière pour tout : le soleil bas du matin, venu de la gauche */
    setO(lumiere, sseg(p, .26, .34) * .55 * (1 - sseg(p, .73, .76)));
    setO(grain, p < .25 ? .045 : .065);
  }
  /* I1 : quand un lavis devient prêt (tâche de fond), on redessine l'image du moment (utile quand le film est figé) */
  /* V2 (vingt-deuxième passe) : un visuel ou une tâche prête : la garde du monde ne garde pas l'image d'avant */
  ctx.redessiner = () => { if (monde.invalider) monde.invalider(); if (F.p !== undefined && F.W) rendre(F.p, 1, F.t); };
  return { dims, rendre, F };
}
