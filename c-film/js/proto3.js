/* =====================================================================
   Y9 bis (vingt-cinquième passe, 09/10/2026, après le retour de Thibaut sur la v2) : prototype v3, ?proto=3. Même lecteur que la v2
   (proto2.js, gardé tel quel pour comparer), trois différences :
   - les flux (videos/v3/) sont le film en direct lui-même, rendu sous horloge virtuelle à la densité 3 sans zoom de page
     (outils/video/rendu-direct.py) : la vidéo et le film coïncident par construction ;
   - tout ce qui est dessin (planche, plaque, feuille, lien manuscrit du CV, bulle « Parler de mon projet », coin, ombres) est dans la
     vidéo ; le DOM ne porte que les blocs de texte, les trois boutons de la fin et des zones cliquables invisibles (la bulle, le coin,
     le lien du CV), posés dans le repère de la scène ;
   - le téléphone de la nuit est droit et de face, le fil de sa conversation défile comme une messagerie (variantes par hauteur).
   Ce qui suit est le texte de la v2.
   =====================================================================
   Y9 (vingt-cinquième passe, 09/10/2026) : prototype v2 du film sur téléphone, ?proto=2 (essais seulement ; sans le paramètre,
   rien ne change). Décision du coordinateur du 09/10 au matin, après la série sur l'iPhone et l'essai de Thibaut dans LinkedIn :
   A. La vidéo est décodée par WebCodecs (VideoDecoder, HEVC 10 bits) et dessinée sur un seul canevas ; plus d'élément vidéo, donc
      aucune règle d'application (LinkedIn). Le doigt pilote p comme dans le film : vers l'avant, le flux aller ; vers l'arrière,
      le flux retour ; si le geste va plus vite que le décodeur, des images sont sautées, rien ne bloque.
   B. Une scène fixe par classe de largeur (393 x 852 ici), composée pour la plus petite fenêtre utile (662, LinkedIn : tout ce qui
      compte au-dessus du rail) et ancrée en haut ; la vidéo et ce qui est posé dessus partagent ce repère, quelle que soit la
      hauteur de la fenêtre (662 dans LinkedIn, 695 à 852 dans Safari).
   C. Aucune couture aux arrêts : l'image d'arrêt est la dernière image décodée du flux (elle reste sur le canevas) ; les blocs de
      texte, la bulle, le coin, les liens du CV et les trois boutons de la fin sont en DOM, absents de la vidéo, posés par la piste
      enregistrée au rendu (même p, même état) ; leurs animations partent de là. Aucun module du film n'est chargé.
   Les quatre tronçons : T0 (l'ouverture de la nuit, 0 à 0,183), T1 (vers le CV), T2 (vers le dessin), T3 (vers la page blanche).
   Paramètres : &protoq=20 (la variante légère), &journal=1 (le journal à l'écran, pour une capture).
   ===================================================================== */
import { clamp, decouperLettres, decouperMots } from './outils.js';
import { CHAPITRES, boutonDe } from './temps.js';
import { creerBoutonChapitre } from './bouton.js';

const Q = new URLSearchParams(location.search);
/* Y9 (09/10, fin de matinée) : cinq tronçons ; l'ouverture (T0) et le départ (T1a, tant que le téléphone de la nuit est à l'écran) existent
   en une variante par hauteur de fenêtre : le fil de la conversation y défile juste assez pour que la ligne « SOURCE » tienne au-dessus
   du rail avec 12 px de marge (décision du coordinateur) ; le reste est commun. Les bornes exactes viennent des index */
const TRONCONS = [{ nom: 'T0', varie: true, p0: 0, p1: .183 }, { nom: 'T1a', varie: true, p0: .183, p1: .2169 }, { nom: 'T1b', p0: .2169, p1: .588 }, { nom: 'T2', p0: .588, p1: .929 }, { nom: 'T3', p0: .929, p1: 1 }];
/* les classes de largeur, leurs dossiers et les hauteurs de fenêtre rendues (393 : LinkedIn 662, Safari 695 barres visibles, 735 barres
   repliées, 852 ; 430 : estimées d'après le 393, à confirmer par une capture sur un grand iPhone) */
/* Y11 (09/10/2026) : ?proto=4, les mêmes tronçons rendus par la capture de la fenêtre composée (la perspective vraie), avec Y12 et Y13 */
/* passe 26 (G1) : la v4 est le lecteur par défaut ; la v3 (videos/v3/) seulement pour une adresse d'essai ?proto=3 */
const V4 = !(window.ESSAIS === true && Q.get('proto') === '3');
/* passe 26 (le gel), G7 bis : les flux de la v4 par un chemin absolu, /c-film/videos/ (avis du DSI du 11/10/2026) : la page installée
   est à la racine du site, où l'adresse relative videos/v4/ donnait /videos/v4/, un 404, et le film en direct en silence ; sur le
   serveur d'essai (maquettes/ à la racine) et dans les copies de rendu, le chemin absolu est le même qu'avant. La v3 (essai) reste
   relative : elle ne part pas */
const CLASSES = [{ w: 393, dossier: V4 ? '/c-film/videos/v4/' : 'videos/v3/', hauteurs: [662, 695, 735, 852] }, { w: 430, dossier: V4 ? '/c-film/videos/v4-w430/' : 'videos/v3-w430/', hauteurs: [742, 775, 815, 932] }];   /* Y11 : la classe 430 de la v4 */
/* le codec, le premier que le décodeur accepte : HEVC 10 bits (iPhone, Mac, Android récents), AV1 10 bits, H.264 8 bits ; ?protocodec=av1 ou h264 force */
const CODECS = [{ id: 'hevc', suf: '', ext: 'hevc', codec: 'hvc1.2.4.L153.B0' }, { id: 'av1', suf: '-av1', ext: 'obu', codec: 'av01.0.12M.10' }, { id: 'h264', suf: '-h264', ext: 'h264', codec: 'avc1.640034' }];
const ARRETS_TEL = [.183, .588, .929, 1];
const CIBLES_CHAP = [.183, .588, .929];   /* sur téléphone, « Créer » mène au dessin fini */
const FIN_CONTINUER = .9914;   /* « Continuer » s'efface quand le menu final arrive (comme au rendu, WK_CONTINUER_FIN) */
const SAUT = 45;    /* au-delà de 45 images d'avance sur le décodeur, on repart de l'image clé la plus proche */
const AVANCE = 6;   /* images demandées d'avance au décodeur */
/* pendant un trajet, la page ne défile pas à chaque image (mesuré dans le moteur de Safari du Mac : 66 images au-delà de 25 ms sur
   l'ouverture en défilant, 38 sans) : elle est posée à la fin du trajet, ou au premier contact du doigt ; &p2defil=1 pour comparer */
const DEFIL = Q.get('p2defil') === '1';

/* Passe 26 (le gel), G2 : le lecteur qui ne peut pas partir (aucun codec accepté, aucun tronçon, ou une erreur avant que le lecteur
   ne prenne la main) ne recharge plus la page : sans ?proto, la même adresse rechargeait sans fin. Il défait ce qu'il a posé
   (classes de la racine, feuille de style, étiquette, blocs découpés) et rend false : main.js poursuit avec la forme légère
   (navigateur d'une application) ou le film en direct. Une erreur après la prise de main remonte telle quelle à main.js */
let defaire = null;
/* Passe 28, point 4 (avis DAJF du 13/10/2026, 00-Ecosysteme/avis/2026-10-13-dajf-evenement-lecteur.md) : trois événements de mesure du
   lecteur, film_lecteur_demarre (la première image), film_lecteur_fin (l'arrivée à la page), film_lecteur_repli (le lecteur n'a pas pu
   partir, ou a échoué : la forme légère ou le film en direct prennent la suite). Poussés dans dataLayer seulement si GTM est chargé
   (window.__civikGtmLoaded : le visiteur a accepté la mesure d'audience dans le bandeau, cookie-consent.js) ; sans cet accord, rien, et
   rien n'est gardé pour être rejoué à l'accord. Paramètres, liste fermée : lecteur_codec (hevc, av1, h264), lecteur_classe (393, 430),
   lecteur_duree (fin : secondes depuis la première image, arrondies à dix), lecteur_repli (codec, erreur). Jamais d'adresse, d'identifiant,
   de chaîne de codec complète, de taille d'écran exacte ni d'agent utilisateur. Les déclencheurs (événements personnalisés) se créent
   dans GTM ; dans les maquettes, GTM n'est jamais chargé : rien ne part */
const mesurer = o => { try { if (window.__civikGtmLoaded !== true) return; (window.dataLayer = window.dataLayer || []).push(o); } catch (e) { /* rien */ } };
/* P5 (19/10/2026, revue Claude Design, parties 9 et 10) : film_arret (l'arrêt atteint, 1 à 5 comme sur ordinateur, la forme, le sens)
   et film_attente (l'attente d'un trajet, en tranches de 250 ms, le tronçon, la classe d'écran) passent par les listes fermées de
   commun/pages/mesures.js (P4) : une valeur hors liste fait tomber l'événement, rien ne part sans l'accord (window.__civikGtmLoaded).
   Le module est demandé à part (import dynamique) : le lecteur n'attend jamais la mesure */
let MESURES = null;
const mesurerFerme = (ev, o) => { try { (MESURES || (MESURES = import('../../commun/pages/mesures.js').catch(() => null))).then(m => { if (m && m.mesurer) m.mesurer(ev, o); }).catch(() => {}); } catch (e) { /* rien */ } };
/* (mesureL : le nom « mesure » est pris dans installerLecteur, la position du défilement) */
const mesureL = { classe: null, codec: null, demarre: 0, fin: false, repli: false };
const repli = cause => {
  if (mesureL.repli) return; mesureL.repli = true;
  const o = { event: 'film_lecteur_repli', lecteur_repli: cause };
  if (mesureL.codec) o.lecteur_codec = mesureL.codec; if (mesureL.classe) o.lecteur_classe = mesureL.classe;
  mesurer(o);
};
export async function installer() {
  try { return await installerLecteur(); }
  catch (e) { if (!defaire) { repli('erreur'); throw e; } const d = defaire; defaire = null; return d('erreur avant la prise de main : ' + (e && e.message || e)); }
}
async function installerLecteur() {
  const racine = document.documentElement;
  racine.classList.add('proto2', 'proto3', 'film-pret');   /* film-pret : la feuille du film montre les blocs et « Continuer » */

  const filmEl = document.getElementById('film'), scene = filmEl.querySelector('[data-scene]');
  const rail = document.querySelector('.rail'), continuerB = rail.querySelector('[data-continuer]');
  const boutonsChap = Array.from(rail.querySelectorAll('[data-chap]')), fils = Array.from(rail.querySelectorAll('[data-fil]'));
  const journal = [];
  const noter = m => { journal.push(Math.round(performance.now()) + ' ' + m); if (journal.length > 60) journal.shift(); if (jEl) jEl.textContent = journal.slice(-14).join('\n'); };
  const etat = window.__proto2 = window.__proto3 = { journal, images: [], decodees: 0, sautees: 0, resets: 0, attente: 0, p: 0, doigt: { images: 0, dessinees: 0, ecartMax: 0, ecartSomme: 0, changements: 0 }, manques: [] };

  /* ---- la feuille de style du prototype : les couches du film cachées, le canevas et les superposés dans la scène ---- */
  const st = document.createElement('style');
  st.textContent = `
html.proto2 .scene > :not(.bloc):not(.p2-toile):not(.p2-sup){display:none !important}
html.proto2 .scene{background:#0b1026}
html.proto2 .scene .bloc,html.proto2 .scene .bloc *,.p2-sup .ep,.p2-sup .ep *{transition:none !important}
.p2-toile{position:absolute;left:0;top:0;z-index:1;pointer-events:none}
.p2-sup{position:absolute;left:0;top:0;z-index:46;pointer-events:none;transform-origin:0 0}
.p2-sup .ep{pointer-events:auto}
html.proto3 .p2-sup .ep,html.proto3 .p2-sup .ep *{opacity:0 !important;animation:none !important}   /* v3 : la bulle, le coin et le lien du CV sont dans la vidéo ; ici, leurs zones cliquables invisibles */
.p2-sup .cv__cmd:not(.actif):not(.cmd-actif),.p2-sup .coin:not(.cmd-actif){pointer-events:none}
.p2-menu{position:absolute;left:0;top:0;box-sizing:border-box;text-decoration:none;pointer-events:auto;visibility:hidden}   /* passe 30 (13/10/2026) : les six répliques de la rangée finale naissent cachées ; seule la piste de T3 les montre (appliquerPiste). Avant, posées visibles à left 0 et top 0, elles restaient en haut à gauche, sous la barre, jusqu'à la première image peinte (156 à 481 ms sur le Mac, 1,8 s à 20 Mbit/s ; photo de Thibaut du 13/10, 13 h 15) */
.p2-menu .picto{flex:none}
.p2-marque{position:fixed;left:8px;top:calc(env(safe-area-inset-top,0px) + 64px);z-index:80;margin:0;padding:3px 8px;border-radius:9px;background:rgba(247,244,237,.92);color:#3b3b3b;font:500 11px/1.3 system-ui,sans-serif;pointer-events:none}
.p2-journal{position:fixed;left:8px;right:8px;top:calc(env(safe-area-inset-top,0px) + 92px);z-index:80;margin:0;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,.9);color:#111;font:10px/1.35 ui-monospace,monospace;white-space:pre-wrap;pointer-events:none;max-height:40vh;overflow:hidden}
`;
  document.head.appendChild(st);
  /* passe 26 (le gel), G3 : l'étiquette « Prototype v4 ... » et le journal à l'écran ne sont posés qu'en essai (interrupteur ouvert,
     ?journal=1) ; jamais chez le visiteur */
  const JOURNAL = window.ESSAIS === true && Q.get('journal') === '1';
  const marque = JOURNAL ? Object.assign(document.createElement('p'), { className: 'p2-marque' }) : null;
  if (marque) document.body.appendChild(marque);
  const jEl = JOURNAL ? Object.assign(document.createElement('pre'), { className: 'p2-journal' }) : null;
  if (jEl) document.body.appendChild(jEl);
  noter(`v3 : fenêtre ${innerWidth} x ${innerHeight}, densité ${devicePixelRatio}, ${navigator.userAgent.match(/LinkedInApp|FBAN|Instagram|CriOS|FxiOS|Version\/[\d.]+/) || ''}`);
  const blocsAvant = [];
  const abandonner = defaire = m => {
    defaire = null; noter(m); etat.echec = m; repli(/codec/.test(m) ? 'codec' : 'erreur');
    racine.classList.remove('proto2', 'proto3', 'film-pret'); st.remove(); scene.style.background = '';
    if (marque) marque.remove(); if (jEl) jEl.remove();
    blocsAvant.forEach(([b, h]) => { b.innerHTML = h; });
    return false;
  };
  /* la classe la plus proche de la largeur ; la hauteur rendue : la plus grande qui ne dépasse pas la fenêtre (la plus petite sinon) */
  const classes = CLASSES.slice().sort((a, b) => Math.abs(innerWidth - a.w) - Math.abs(innerWidth - b.w));
  const choisirH = c => { const L = c.hauteurs.filter(h => h <= innerHeight + 2); return L.length ? Math.max(...L) : Math.min(...c.hauteurs); };
  /* P5 (19/10/2026, revue Claude Design, partie 10, proposition 4) : la première image de la nuit avant la vidéo. Avant la passe, le
     lecteur cachait l'affiche dès sa prise de main : nuit unie pendant la lecture des index, puis le canevas (opaque) en noir jusqu'à
     la première image décodée. Désormais la gravure de nuit (l'image de l'affiche, déjà demandée par la tête de la page) reste posée
     sur la scène, au cadrage exact de la vidéo à son début (la classe et la hauteur que le lecteur va choisir ; le cadrage du film à
     p 0 : la gravure de toute la hauteur, son point à 79 % au milieu, film.js et fond.js) ; le canevas reste caché jusqu'à sa
     première image, qui prend la place de l'affiche dans la même image d'écran (plus bas, au premier dessin). Rien de la vidéo ne
     change */
  {
    const c0 = classes[0], H0 = choisirH(c0), k0 = scene.clientWidth / c0.w, fw0 = Math.max(c0.w, H0 * 1.8512), x0 = c0.w * .5 - .79 * fw0;
    const nuit = scene.querySelector('[data-nuit]'), src = nuit && (nuit.currentSrc || nuit.src);
    if (src && k0 > 0) scene.style.background = `#0b1030 url("${src}") ${(x0 * k0).toFixed(2)}px 0/${(fw0 * k0).toFixed(2)}px ${(H0 * k0).toFixed(2)}px no-repeat`;
  }
  /* le codec */
  const forcer = Q.get('protocodec');
  let codec = null;
  for (const c of CODECS) {
    if (forcer && c.id !== forcer) continue;
    const ok = await VideoDecoder.isConfigSupported({ codec: c.codec, codedWidth: 1184, codedHeight: 2560 }).then(x => x.supported).catch(() => false);
    noter(`décodeur ${c.id} : ${ok ? 'oui' : 'non'}`);
    if (ok) { codec = c; break; }
  }
  mesureL.classe = classes[0].w;
  if (!codec) return abandonner('aucun codec accepté : retour au film');
  mesureL.codec = codec.id;
  /* Chargement (passe 25, 09/10/2026) : le flux CRF 20 par défaut (CRF 16 avec &protoq=16) : aux trois arrêts, contre l'image du film,
     40,5 à 41,5 dB au lieu de 41 à 42, 0,1 niveau d'écart moyen en plus, rien à l'œil au pixel de l'appareil
     (captures/c25-chargement-crf16-crf20.png) ; 39 % plus léger (le départ et la route 38 Mo au lieu de 63, le CV vers le dessin 37 au lieu de 60) */
  const q = codec.id === 'hevc' && Q.get('protoq') !== '16' ? '-q20' : '';
  let base = classes[0].dossier, H = choisirH(classes[0]);

  /* ---- les blocs de texte : découpés comme dans le film ; leur état viendra de la piste ---- */
  const blocs = Array.from(scene.querySelectorAll('.bloc'));
  blocs.forEach(b => blocsAvant.push([b, b.innerHTML]));
  blocs.forEach(b => { const v = b.querySelector('.verbe'), l = b.querySelector('.legende'); if (v && !v.querySelector('.l')) decouperLettres(v); if (l && !l.querySelector('.w')) decouperMots(l); });

  /* ---- les index des flux, les pistes ---- */
  const lire = u => fetch(u).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + u); return r.json(); });
  const chargerIndex = () => Promise.all(TRONCONS.map(async t => {
    const nom = t.nom + (t.varie ? '-h' + H : ''), f = s => base + nom + '-' + s + codec.suf + q;
    try {
      const [av, ar, piste] = await Promise.all([lire(f('avant') + '.json'), lire(f('arriere') + '.json'), lire(base + nom + '-piste.json').catch(() => null)]);
      return Object.assign({}, t, { base: t.nom, nom, av: creerFlux(f('avant') + '.' + codec.ext, av), ar: creerFlux(f('arriere') + '.' + codec.ext, ar), piste, p0: av.ps[0], p1: av.ps[av.ps.length - 1] });
    } catch (e) { noter('tronçon absent ' + nom + ' : ' + e.message); return null; }
  })).then(L => L.filter(Boolean));
  let tr = await chargerIndex();
  /* la classe la plus proche n'est pas rendue (ou pas dans ce codec) : la suivante, à l'échelle de la largeur */
  for (let i = 1; tr.length < TRONCONS.length && i < classes.length; i++) { base = classes[i].dossier; H = choisirH(classes[i]); noter('repli sur la classe ' + classes[i].w); tr = await chargerIndex(); }
  noter(`classe ${base}, hauteur ${H}, codec ${codec.id}${q}`);
  /* le canevas a la taille codée (1184 x 2560, multiples de 16) et l'image y est posée entière : le moteur de Safari ignore le
     rectangle source de drawImage pour une VideoFrame (mesuré : l'image rognée à 1178 x 2556 était rétrécie de 0,5 %, 24 niveaux
     d'écart sur le texte du téléphone) ; la bande recopiée de droite et du bas (6 et 4 px) sort de la scène */
  if (!tr.length) return abandonner('aucun tronçon : retour au film');
  defaire = null;   /* G2 : le lecteur prend la main (canevas, écouteurs, boucle d'image) : plus de retour arrière */
  const I0 = tr[0].av.idx, CW = I0.cw, CH = I0.ch, LARGEUR = Math.round(I0.w / 3), HAUTEUR = Math.round(I0.h / 3);

  /* ---- le canevas et la couche des superposés, au repère de la scène fixe (ancrée en haut) ---- */
  const toile = document.createElement('canvas'); toile.className = 'p2-toile'; toile.width = CW; toile.height = CH;
  toile.setAttribute('aria-hidden', 'true');   /* P5 : l'image du film ; son équivalent textuel est dans la page (index.html, .film-texte) */
  toile.style.visibility = 'hidden';   /* P5 : jusqu'à la première image (l'affiche de la nuit est dessous) */
  const ctx = toile.getContext('2d', { alpha: false });
  const sup = document.createElement('div'); sup.className = 'p2-sup';
  scene.append(toile, sup);
  let k = 1;
  const poserEchelle = () => {
    k = scene.clientWidth / LARGEUR;
    toile.style.width = (CW / 3 * k) + 'px'; toile.style.height = (CH / 3 * k) + 'px';
    sup.style.width = LARGEUR + 'px'; sup.style.height = HAUTEUR + 'px'; sup.style.transform = k === 1 ? '' : `scale(${k})`;
  };
  poserEchelle(); addEventListener('resize', poserEchelle);

  /* les répliques : la bulle, le coin, les deux liens du CV (mêmes classes, mêmes transformations que dans le film) */
  const figer = (tr.find(t => t.piste && t.piste.figer && t.piste.figer.ep && t.piste.figer.ep.bulle) || {}).piste;
  const rep = {};
  if (figer) for (const [cle, html] of Object.entries(figer.figer.ep)) {
    const t = document.createElement('template'); t.innerHTML = html.trim(); const e = t.content.firstElementChild;
    e.removeAttribute('tabindex'); sup.appendChild(e); rep[cle] = e;
  }
  if (rep.coin) rep.coin.addEventListener('click', e => { e.stopPropagation(); continuer(); });
  /* P5 (19/10/2026) : sur téléphone, la zone du CV est un lien vers la page Conseil (le lecteur ne joue pas le geste du film) : son nom
     dit ce qu'elle fait, comme sur ordinateur (cv.js), au lieu du nom enregistré au rendu (« Arracher le CV et prendre le chemin de
     l'atelier ») ; M3 : la bulle « Parler de mon projet » du bout du film mène au contact de l'Atelier (la piste T3 portait la page
     blanche, puis le filet de P4 le contact de Conseil, retiré de commun/pages/accueil.js) */
  if (rep.cmd) rep.cmd.setAttribute('aria-label', 'Le conseil : voir la page Conseil');
  if (rep.bulle) rep.bulle.setAttribute('href', '/atelier/#contact');
  /* les trois boutons de la fin : leur style calculé au rendu, leur place et leur opacité par la piste */
  const T3 = (tr.find(t => t.nom === 'T3') || {}).piste, menuF = T3 && T3.figer ? T3.figer.menu : [];
  /* passe 31 (13/10/2026, relecture de livraison) : les href de la piste T3 sont ceux de la maquette (../marianne-base/, ../conseil/,
     ../atelier/), relevés au rendu ; en ligne, la page Marianne est /marianne/. Table explicite, sur le dossier qui suit « ../ » (les
     clés n'ont pas de « ../ » entre guillemets : liensJs de l'installateur ne doit pas les réécrire) ; tout autre href est gardé tel
     quel. La maquette (ESSAIS vrai, ou un hôte local : localhost, 127.0.0.1, 192.168.x) garde le chemin relatif, car /marianne/
     n'y existe pas. Le href ne change aucune image */
  const LIENS_FIN = { 'marianne-base/': '/marianne/', 'conseil/': '/conseil/', 'atelier/': '/atelier/' };
  const hoteLocal = window.ESSAIS === true || /^(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})$/.test(location.hostname);
  const lienFin = h => { const r = !hoteLocal && typeof h === 'string' && /^\.\.\/([a-z-]+\/)(.*)$/.exec(h); return r && LIENS_FIN[r[1]] ? LIENS_FIN[r[1]] + r[2] : h; };
  const menu = menuF.map(m => {
    const a = document.createElement('a'); a.className = 'p2-menu'; a.href = lienFin(m.href); a.innerHTML = m.html;
    for (const [p, v] of Object.entries(m.st)) a.style.setProperty(p, v);
    a.style.border = `${m.st['border-top-width']} ${m.st['border-top-style']} ${m.st['border-top-color']}`;   /* (les quatre côtés, relevés en haut) */
    a.querySelectorAll('.etincelle').forEach(x => x.remove());
    const pic = a.querySelector('.picto'); if (pic && m.picto) { pic.style.width = m.picto.width; pic.style.height = m.picto.height; pic.style.display = m.picto.display; }
    sup.appendChild(a); return a;
  });
  const etincelles = creerEtincelles(menu);
  /* passe 28 (13/10/2026) : le crayon du visiteur à la page au repos (crayon-lecteur.js : la plaque, le crayon et son ombre, le canevas
     de tracé, le bouton du brouillon, posés dans cette couche aux places du film) ; demandé au calme, jamais pendant un trajet (le module
     peint l'image du crayon, comme le film : quelques millisecondes) : à l'arrêt du dessin (0,929), ou à l'arrivée à la page par le
     doigt ; posé à la dernière image de T3, retiré dès qu'elle s'en va */
  const classeW = (CLASSES.find(c => c.dossier === base) || CLASSES[0]).w;
  let crayonL = null, crayonP = null, dessins = 0;
  /* relecture du 13/10 : l'import du module et la création sont asynchrones ; demandés à l'arrêt du dessin, où l'on appuie souvent tout
     de suite sur « Continuer », ils finiraient pendant le trajet T3 (une image sautée). Après l'import, la création attend le calme
     (aucun trajet, jeu nul), et creerCrayon l'attend encore avant de poser ses éléments et son canevas de tracé ; guetté à chaque image
     d'écran (avec un délai de 200 ms, le crayon arrivait 133 ms après la page, la vidéo montrant le sien entre-temps) */
  const calme = () => new Promise(ok => { const t = () => jeu ? requestAnimationFrame(t) : ok(); t(); });
  const chargerCrayon = () => crayonP || (crayonP = import('./crayon-lecteur.js').then(m => calme().then(() => m.creerCrayon({ sup, scene, k: () => k, classe: classeW, bulle: rep.bulle, toile, dessins: () => dessins, calme }))).then(c => { crayonL = c; etat.crayon = c; return c; }, e => { noter('crayon : ' + (e && e.message || e)); return null; }));
  /* Rangée finale (10/10/2026, Thibaut, 13 h 40 : « descends légèrement les briques de choix sous l'atelier, pour équilibrer ») : la piste
     de T3 pose la rangée à sa place pour la hauteur du rendu (662, 742), contre le bord du pupitre de la vidéo ; à la hauteur réelle de la
     fenêtre, elle descend au milieu de la bande libre jusqu'au haut du rail (« Continuer » déjà effacé quand elle paraît), de 40 px au plus : la règle du film
     (p8-page.js, RANGEE_MAX). Mesuré sur l'iPhone à 695 : lecteur y 542, film y 575. La descente est un translateY des trois liens (le
     liseré et l'étincelle suivent) ; elle se recalcule quand la fenêtre change (barres de Safari repliées ou déployées : visualViewport),
     avec un fondu de 0,3 s. RANGEE_PISTE : la descente que la piste porterait déjà (0 : piste de T3 rendue avant cette règle) */
  const RANGEE_MAX = 40, RANGEE_PISTE = 0;
  const finMenu = (T3 && T3.menu && T3.menu[0] && T3.menu[0].length) ? T3.menu[0][T3.menu[0].length - 1][1] : null;
  let descente = 0;
  const calerRangee = () => {
    if (!finMenu || !menu.length) return;
    const rs = sup.getBoundingClientRect(), rr = rail.getBoundingClientRect();
    const vb = window.visualViewport ? visualViewport.offsetTop + visualViewport.height : innerHeight;
    const bas = Math.min(rr.height ? rr.top : Infinity, vb);   /* le haut du rail tel qu'il est quand la rangée paraît (« Continuer » déjà effacé) */
    const lim = (bas - rs.top) / k, bord = finMenu[1] - RANGEE_PISTE, hb = finMenu[3];
    const d = Math.round(Math.min(RANGEE_MAX, Math.max(0, lim - bord - hb) / 2) - RANGEE_PISTE);
    if (d === descente) return; descente = d;
    menu.forEach(a => { a.style.transform = d ? `translateY(${d}px)` : ''; });
  };
  menu.forEach(a => { a.style.transition = 'transform .3s ease'; });
  let calage = 0; const demanderCalage = () => { if (!calage) calage = requestAnimationFrame(() => { calage = 0; calerRangee(); }); };
  addEventListener('resize', demanderCalage); if (window.visualViewport) { visualViewport.addEventListener('resize', demanderCalage); visualViewport.addEventListener('scroll', demanderCalage); }
  requestAnimationFrame(() => calerRangee());

  /* ---- la piste : l'état des superposés à l'image f (aller) du tronçon ---- */
  const aLImage = (L, f) => { if (!L || !L.length) return undefined; let lo = 0, hi = L.length - 1; if (f < L[0][0]) return L[0][1]; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (L[m][0] <= f) lo = m; else hi = m - 1; } return L[lo][1]; };
  const poses = new Map();
  const poser = (cle, el, v, f) => { if (poses.get(cle) === v) return; poses.set(cle, v); f(el, v); };
  const attrs = (el, v) => { if (!el || !v) return; el.setAttribute('style', v[0]); el.setAttribute('class', v[1]); };
  function appliquerPiste(t, f) {
    const P = t.piste; if (!P) return;
    const rac = aLImage(P.racine, f);
    poser('racine', null, rac, (e, v) => { const m = /--bloc-haut:\s*([^;]+)/.exec(v || ''); if (m) racine.style.setProperty('--bloc-haut', m[1].trim()); });
    P.blocs.forEach((L, i) => { const v = aLImage(L, f), b = blocs[i]; poser('b' + i, null, v, (e, v) => { if (!v || !b) return; attrs(b, v[0]); attrs(b.querySelector('.verbe'), v[1]); attrs(b.querySelector('.legende'), v[2]); }); });
    for (const [cle, L] of Object.entries(P.ep)) { const v = aLImage(L, f); if (rep[cle] && v) poser('e' + cle, rep[cle], v, (e, v) => { e.setAttribute('style', v[0]); e.setAttribute('class', v[1]); }); }
    menu.forEach((a, i) => { const v = P.menu[i] ? aLImage(P.menu[i], f) : null; poser('m' + i, a, v, (e, v) => {
      if (!v) { e.style.visibility = 'hidden'; return; }
      e.style.left = v[0] + 'px'; e.style.top = v[1] + 'px'; e.style.width = v[2] + 'px'; e.style.height = v[3] + 'px'; e.style.opacity = v[4]; e.style.visibility = v[5] ? 'visible' : 'hidden';
      if (v[5] && typeof demanderCalage === 'function') demanderCalage();   /* rangée finale : recalée quand elle paraît (le rail est alors à sa place) */
    }); });
  }
  /* (les tronçons sans menu le cachent) */
  const cacherMenu = () => menu.forEach((a, i) => poser('m' + i, a, null, e => { e.style.visibility = 'hidden'; }));

  /* ---- le défilement, comme le film (la course sur la grande hauteur) ---- */
  const sondeH = document.createElement('div'); sondeH.style.cssText = 'position:absolute;left:0;top:0;width:1px;height:100vh;height:100lvh;visibility:hidden;pointer-events:none'; document.body.appendChild(sondeH);
  const hRef = () => Math.max(innerHeight, sondeH.offsetHeight || 0);
  const course = () => Math.max(1, filmEl.offsetHeight - hRef());
  const mesure = () => clamp(-filmEl.getBoundingClientRect().top / course());
  const allerA = p => scrollTo({ top: filmEl.offsetTop + clamp(p) * course(), behavior: 'instant' });

  /* ---- l'image : quel tronçon, quel sens, quelle image pour un p ---- */
  /* passe 30 (13/10/2026) : en avant, un p sous le début de T0 (la page en haut, p = 0 ; la première image de T0 est à p 7,6e-6, hors de la
     tolérance de 1e-6) est rattaché à T0 ; avant, aucun tronçon ne le prenait et le repli rendait T3 : la première image demandée à
     l'ouverture était celle du dessin (« Créer » montré de 385 à 460 ms sur le Mac ; sur réseau lent, rien de peint jusqu'au trajet) */
  const tronconDe = (p, sens) => { for (let i = 0; i < tr.length; i++) { const t = tr[i]; if (sens > 0 ? ((i === 0 || p >= t.p0 - 1e-6) && p < t.p1 - 1e-6) :(p > t.p0 + 1e-6 && p <= t.p1 + 1e-6)) return t; } return sens > 0 ? tr[tr.length - 1] : tr[0]; };
  const rangDe = (ps, p, croissant) => { /* l'image dont le p est le plus proche */
    let lo = 0, hi = ps.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (croissant ? ps[m] < p : ps[m] > p) lo = m + 1; else hi = m; }
    if (lo > 0 && Math.abs(ps[lo - 1] - p) < Math.abs(ps[lo] - p)) lo--;
    return lo;
  };

  /* ---- les lecteurs : un décodeur par flux en usage, trois au plus ---- */
  const lecteurs = new Map();
  const lecteur = fl => {
    let l = lecteurs.get(fl.url);
    if (!l) { l = creerLecteur(fl, etat, noter); lecteurs.set(fl.url, l); }
    l.vu = performance.now();
    if (lecteurs.size > 3) { const vieux = Array.from(lecteurs.values()).filter(x => x !== l).sort((a, b) => a.vu - b.vu)[0]; vieux.fermer(); lecteurs.delete(vieux.fl.url); }
    return l;
  };

  /* ---- le chargement : dans l'ordre du besoin, par flux, au fil de l'eau (une image est décodable dès que ses octets sont là) ---- */
  /* Chargement (passe 25, 09/10/2026, demande du coordinateur) : l'aller d'abord, dans l'ordre du film (l'ouverture, puis le départ et
     la route pendant l'ouverture, puis le CV vers le dessin, puis la page), les retours ensuite (le retour vers la nuit en dernier) ;
     avant, chaque retour passait juste après l'aller suivant (le retour de la route, 26 Mo, avant la page). Un trajet qui a besoin d'un
     flux pas encore commencé le fait partir tout de suite, en parallèle (HTTP/2 : une connexion, plusieurs flux). &ordre=ancien : l'ordre
     d'avant, pour la mesure */
  /* P5 (19/10/2026, mandat du 18/10, revue Claude Design, partie 10, propositions 1 et 3) : avant cette passe, les dix flux partaient
     l'un après l'autre dès l'ouverture (96,4 Mo à 393 x 852 avant le premier geste, mesuré le 19/10 sur la copie de travail). Désormais le
     chargement suit le visiteur, un flux prévu à la fois :
     - un trajet mène d'un arrêt au suivant : T0 à l'arrêt 1, T1a puis T1b à l'arrêt 2, T2 à l'arrêt 3 (le dessin), T3 à la page ;
     - l'aller d'un trajet part quand le visiteur est engagé dans le trajet d'avant (le trajet courant et le suivant, jamais l'aller d'un
       arrêt lointain) : à l'ouverture, T0, T1a et T1b ; dès qu'il quitte l'arrêt 1, T2 ; dès qu'il quitte l'arrêt 2, T3 ;
     - le retour d'un trajet part quand le visiteur a vu l'arrêt où ce trajet arrive, après les allers voulus (les retours en dernier) ;
     - un trajet demandé (Continuer, un chapitre) ou le doigt qui entre dans un tronçon pas encore là le font partir tout de suite, en
       parallèle, comme avant ;
     - sous le film (les cartes, le contact, le pied), dans un onglet caché, ou quand le visiteur quitte la page (un lien vers une autre
       page, la navigation, pagehide), les flux en cours s'arrêtent (AbortController) : la page suivante ne passe plus derrière
       60 Mo ; ils reprennent où ils en étaient (requête Range ; un serveur qui renvoie le fichier entier le fait repartir du début,
       mêmes octets) au retour sur le film ou dans la page (pageshow), et si la page est restée : un geste du visiteur après le clic
       (toucher, molette, touche), une navigation abandonnée (API Navigation), ou 15 s sans changement de page (une page suivante
       lente, sur le réseau d'un téléphone, ne retrouve pas les vidéos devant elle avant).
     Aucun fichier ne change, aucun octet du film n'est différent : seul le moment où il arrive. &ordre=tout (essais) : l'ordre d'avant,
     tout d'un coup. */
  const TRAJET = { T0: 0, T1a: 1, T1b: 1, T2: 2, T3: 3 };
  tr.forEach(t => { t.j = TRAJET[t.base] !== undefined ? TRAJET[t.base] : 3; t.av.tr = t; t.ar.tr = t; t.av.aller = true; });
  const ordre = [];
  tr.forEach(t => ordre.push(t.av)); tr.slice().reverse().forEach(t => ordre.push(t.ar));   /* les allers dans l'ordre du film, puis les retours, le plus récent d'abord */
  const TOUT = window.ESSAIS === true && (Q.get('ordre') === 'tout' || Q.get('ordre') === 'ancien');
  const chg = { engage: 0, vu: -1, plan: null, quitte: false, tq: 0, dernierP: -1 };
  const horsIci = () => filmEl.getBoundingClientRect().bottom < innerHeight - 2;
  const suspendu = () => chg.quitte || document.hidden || racine.classList.contains('hors-film');
  const voulu = fl => TOUT || (fl.aller ? fl.tr.j <= chg.engage + 1 : fl.tr.j <= chg.vu);
  /* le rail en deux encres : la part du chemin arrivée (bleu à 32 %), sous la part jouée (bleu plein) ; le p jusqu'où toutes les images
     de l'aller sont là, d'un seul tenant depuis l'ouverture */
  const pArrive = () => {
    let p = 0;
    for (const t of tr) {
      const fl = t.av; if (!fl.buf) return p;
      if (fl.complet) { p = fl.idx.ps[fl.idx.n - 1]; continue; }
      let lo = -1, hi = fl.idx.n - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (fl.dispoRang(m)) lo = m; else hi = m - 1; }
      return lo >= 0 ? Math.max(p, fl.idx.ps[lo]) : p;
    }
    return p;
  };
  const traits = fils.map(f => f.parentNode);
  let cDern = '';
  const majCharge = () => {
    const pa = pArrive(), c = [0, 1].map(i => clamp((pa - CHAPITRES[i].encre) / (CHAPITRES[i + 1].encre - CHAPITRES[i].encre)).toFixed(3));
    const cle = c.join(); if (cle === cDern) return; cDern = cle;
    traits.forEach((t, i) => { if (t) t.style.setProperty('--c', c[i]); });
  };
  const chargerFlux = fl => fl.charger(() => { etiquette(); majCharge(); }).then(() => { majCharge(); if (!fl.note) { fl.note = 1; noter(`chargé ${fl.nom} ${Math.round(fl.total / 1048576)} Mo en ${fl.ms} ms`); } }, e => { if (e && e.name === 'AbortError') noter(`arrêté ${fl.nom} à ${Math.round(100 * fl.recu / Math.max(1, fl.total))} %`); else noter('chargement raté ' + fl.nom + ' ' + (e && e.message)); });
  function planifier() {
    if (chg.plan || suspendu()) return;
    const fl = ordre.find(f => !f.complet && !f.promesse && voulu(f)); if (!fl) return;
    chg.plan = fl;
    chargerFlux(fl).then(() => { if (chg.plan === fl) chg.plan = null; planifier(); });
  }
  const engager = j => { if (j > chg.engage) { chg.engage = j; planifier(); } };
  const voir = k => { if (k > chg.vu) { chg.vu = k; planifier(); } };
  const suspendre = cause => { let n = 0; ordre.forEach(f => { if (f.promesse && !f.complet) { f.arreter(); n++; } }); chg.plan = null; if (n) noter(`suspendu (${cause}) : ${n} flux`); };
  const reprendre = () => { if (!suspendu()) planifier(); };
  /* quitter la page : un lien vers une autre page (au clic, avant que la page suivante soit demandée), la navigation (API Navigation,
     là où elle existe), pagehide ; la page restée (un geste après le clic, une navigation abandonnée, 15 s) reprend */
  const GESTES = ['pointerdown', 'wheel', 'keydown'];
  const rester = () => {
    if (!chg.quitte) return; chg.quitte = false; clearTimeout(chg.tq);
    GESTES.forEach(n => removeEventListener(n, rester, true));
    noter('page gardée : reprise'); reprendre();
  };
  const quitter = cause => {
    if (chg.quitte) return; chg.quitte = true; suspendre('quitte : ' + cause);
    clearTimeout(chg.tq);
    setTimeout(() => { if (chg.quitte) GESTES.forEach(n => addEventListener(n, rester, true)); }, 0);
    chg.tq = setTimeout(() => { if (document.visibilityState === 'visible') rester(); }, 15000);
  };
  addEventListener('click', e => {
    if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target && e.target.closest ? e.target.closest('a[href]') : null; if (!a) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    let u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (!/^https?:$/.test(u.protocol)) return;
    if (u.origin === location.origin && u.pathname === location.pathname && u.search === location.search) return;
    quitter('lien ' + u.pathname);
  }, true);
  if (window.navigation && typeof navigation.addEventListener === 'function') {
    navigation.addEventListener('navigate', e => { try { if (e.destination && e.destination.sameDocument === false && !e.downloadRequest) quitter('navigation'); } catch (x) { /* rien */ } });
    navigation.addEventListener('navigateerror', () => rester());
  }
  addEventListener('pagehide', () => quitter('pagehide'));
  addEventListener('pageshow', e => { if (e.persisted) rester(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) reprendre(); });
  planifier();

  /* ---- le son (passe 28, 13/10/2026) : le bouton Son de la barre, branché sur le lecteur, comme dans le film en direct ----
     Le film (moteur.js, lignes 274 à 307 ; film.js, placerSon) : sur téléphone, le bouton vit dans la barre, juste avant le bouton
     principal, montré si le navigateur sait faire du son (son.disponible) ; coupé à chaque ouverture (R1), seul un clic du visiteur
     le met ; pendant l'activation, il attend, et un second clic vaut coupure ; coupé quand la page est quittée et au retour par le
     cache arrière. Ici, les mêmes règles et les mêmes attributs ; son.js et les gestes du film viennent de son-lecteur.js (85 Ko, 27
     compressés), demandé dès que le lecteur prend la main, pendant le chargement de l'ouverture (avant qu'elle ne joue : son évaluation
     ne passe pas pendant un trajet), et au premier contact avec le bouton : il doit être là au clic, Safari ne lance le son que dans le
     geste même (son.activer() le fait avant toute attente) ; le toucher reçu avant lui charge le module puis active, ce que Safari
     peut refuser hors du geste (le bouton revient alors à « Activer le son », un second toucher le met). La bande-son suit le p de
     l'image montrée (boucle d'image, plus bas). Rien ne sonne avant un clic sur le bouton : le module ne crée rien avant son.activer() */
  const boutonSon = document.querySelector('[data-son]'), barre = document.querySelector('header.nav'), cta = barre && barre.querySelector('.nav__cta');
  if (boutonSon && barre && cta && (boutonSon.parentNode !== barre || boutonSon.nextElementSibling !== cta)) barre.insertBefore(boutonSon, cta);
  let son = null, sonner = null, modSon = null, pSon = null;
  const chargerSon = () => modSon || (modSon = import('./son-lecteur.js').then(m => { son = m.son; sonner = m.creerSonnerie(); return m; }, e => { modSon = null; throw e; }));
  if (boutonSon) {
    let attente = false, annule = false;
    const maj = () => {
      const a = !attente && !!(son && son.actif);
      boutonSon.setAttribute('aria-pressed', a ? 'true' : 'false');
      boutonSon.setAttribute('aria-label', attente ? 'Activation du son en cours, cliquer pour annuler' : a ? 'Couper le son' : 'Activer le son');
      boutonSon.setAttribute('aria-busy', attente ? 'true' : 'false');
      boutonSon.classList.toggle('actif', a); boutonSon.classList.toggle('attente', attente);
    };
    boutonSon.hidden = !(window.AudioContext || window.webkitAudioContext); maj();
    const couper = () => { if (son) { try { son.couper(); } catch (err) { /* rien */ } } };
    addEventListener('pagehide', () => { if (attente) annule = true; if ((son && son.actif) || attente) couper(); attente = false; maj(); });
    addEventListener('pageshow', e => { if (!e.persisted) return; if (son && son.actif) couper(); attente = false; maj(); });
    ['pointerdown', 'touchstart', 'focus'].forEach(n => boutonSon.addEventListener(n, () => { chargerSon().catch(() => {}); }, { passive: true }));
    if (!boutonSon.hidden) setTimeout(() => { chargerSon().catch(() => {}); }, 0);
    boutonSon.addEventListener('click', async e => {
      e.stopPropagation();
      if (attente) { annule = true; couper(); maj(); return; }
      if (son && son.actif) { couper(); maj(); return; }
      attente = true; annule = false; maj();
      try {
        if (!son) await chargerSon();
        if (!annule) { if (vue.fl && vue.rang >= 0) son.progression(vue.fl.idx.ps[vue.rang], 0); await son.activer(); }
      } catch (err) { /* rien */ }
      attente = false;
      /* coupé pendant l'attente : on s'assure qu'il reste coupé */
      if (annule) couper();
      maj();
    });
  }

  /* ---- le rail ---- */
  const bouton = creerBoutonChapitre();
  /* film.js (placerSon) : un filet, une fois par largeur : si la barre ne tient pas avec le plus long des libellés (une police de repli,
     un réglage de taille du système), le logo perd son nom */
  let largeurFilet = 0;
  const filetBarre = () => {
    if (!boutonSon || !barre || !cta || boutonSon.parentNode !== barre || !bouton.largeurMax || innerWidth === largeurFilet) return;
    largeurFilet = innerWidth;
    const logo = barre.querySelector('.nav__logo'); if (!logo || barre.classList.contains('nav--sans-nom')) return;
    const cs = getComputedStyle(barre), gap = parseFloat(cs.columnGap) || 0, ms = getComputedStyle(boutonSon);
    const libre = cta.getBoundingClientRect().right - bouton.largeurMax() - gap - (parseFloat(ms.marginRight) || 0) - boutonSon.offsetWidth - gap - logo.getBoundingClientRect().right;
    if (libre < -.5) { barre.classList.add('nav--sans-nom'); bouton.dims(); }
  };
  /* relecture du 13/10 : appelé après la prise de main ; s'il levait, installer() rejetterait avec le lecteur à moitié posé */
  const filetSur = () => { try { filetBarre(); } catch (e) { noter('filet : ' + (e && e.message || e)); } };
  filetSur(); addEventListener('resize', filetSur);
  let iBouton = -1;
  const majRail = p => {
    const ib = boutonDe(p, true); if (ib !== iBouton) { bouton.chapitre(ib, iBouton < 0 ? 0 : .6); iBouton = ib; }
    CHAPITRES.forEach((c, i) => { const b = boutonsChap[i]; if (!b) return; b.classList.toggle('ici', p >= c.de && p < c.a); b.classList.toggle('encre', p >= c.encre); if (p >= c.de && p < c.a) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    if (fils[0]) fils[0].style.setProperty('--k', clamp((p - CHAPITRES[0].encre) / (CHAPITRES[1].encre - CHAPITRES[0].encre)).toFixed(3));
    if (fils[1]) fils[1].style.setProperty('--k', clamp((p - CHAPITRES[1].encre) / (CHAPITRES[2].encre - CHAPITRES[1].encre)).toFixed(3));
    continuerB.hidden = p > FIN_CONTINUER;
  };

  /* ---- la lecture d'un trajet (Continuer, un chapitre) : image par image, 60 par seconde, à travers les tronçons ---- */
  let jeu = null;
  const arretSuivant = p => ARRETS_TEL.find(a => a > p + .003);
  function jouer(p1) {
    const p0 = vue.p; if (Math.abs(p1 - p0) < .001) return;
    const sens = p1 > p0 ? 1 : -1, etapes = [];
    for (const t of (sens > 0 ? tr : tr.slice().reverse())) {
      const a = Math.max(t.p0, Math.min(p0, p1)), b = Math.min(t.p1, Math.max(p0, p1));
      if (b - a < .002) continue;   /* (l'arrêt posé au p du rendu, à quelques dix-millièmes de la borne : pas d'étape de trois images) */
      const fl = sens > 0 ? t.av : t.ar, ps = fl.idx.ps;
      let de = rangDe(ps, sens > 0 ? a : b, sens > 0); const jusqua = rangDe(ps, sens > 0 ? b : a, sens > 0);
      /* la jonction de deux tronçons : leur image commune n'est montrée qu'une fois (sinon une image tenue deux fois en plein mouvement) */
      const prec = etapes[etapes.length - 1];
      if (prec && Math.abs(prec.fl.idx.ps[prec.jusqua] - ps[de]) < 1e-6 && de < jusqua) de++;
      if (jusqua > de) etapes.push({ t, fl, de, jusqua });
    }
    if (!etapes.length) return;
    etapes.forEach(x => { if (!x.fl.promesse && !x.fl.complet) { noter('à la demande ' + x.fl.nom); chargerFlux(x.fl); } });   /* chargement : un flux voulu part tout de suite */
    if (sens > 0) etapes.forEach(x => engager(x.t.j));   /* P5 : le trajet suivant peut se préparer */
    if (jeu) finAttente(jeu, 'repris');
    jeu = { etapes, e: 0, t0: 0, p1, sens, att: 0, attPar: {}, attDebut: 0 };
    if (AMORCE) dernierPre = '';   /* Y16 : à l'arrêt d'arrivée, l'amorce est refaite (le lecteur a pu partir ailleurs pendant le trajet) */
    scene.classList.remove('appel'); rail.classList.remove('appel');
    noter(`trajet vers ${p1} (${etapes.map(x => x.t.nom + (sens > 0 ? '>' : '<') + (x.jusqua - x.de)).join(' ')})`);
    etat.images.push({ de: +p0.toFixed(3), vers: p1, iv: [], sautees: 0, attente: 0, t0: performance.now(), r0: etat.resets });   /* Y16 : r0 */
  }
  function continuer() { const s = arretSuivant(vue.p); if (s !== undefined) jouer(s); }
  /* P5 (19/10/2026, revue Claude Design, partie 10, « L'attente, quand elle reste ») : « Continuer » est toujours accepté (le trajet
     part de lui-même dès qu'il peut jouer sans s'arrêter, comme avant) ; si l'image attend plus de 800 ms, une invite « Le chemin se
     charge » paraît au-dessus du rail (lue par les lecteurs d'écran, role status) et s'en va dès que l'image repart. La durée d'attente
     de chaque trajet (au départ et en route) part en film_attente, en tranches de 250 ms */
  const inviteAttente = document.createElement('p'); inviteAttente.className = 'rail__attente'; inviteAttente.setAttribute('role', 'status');
  rail.appendChild(inviteAttente);
  let attenteVue = false;
  const montrerAttente = v => { if (v === attenteVue) return; attenteVue = v; inviteAttente.textContent = v ? 'Le chemin se charge' : ''; inviteAttente.classList.toggle('visible', v); };
  const finAttente = (j, cause) => {
    if (!j || j.mesure) return; j.mesure = true; montrerAttente(false);
    const noms = Object.keys(j.attPar), nom = noms.length ? noms.sort((a, b) => j.attPar[b] - j.attPar[a])[0] : (j.etapes[0] && j.etapes[0].t.base);
    if (!nom) return;
    mesurerFerme('film_attente', { troncon: nom, duree: String(Math.min(20000, Math.floor(j.att / 250) * 250)), classe: 'telephone' });
    if (j.att > 800) noter(`attente ${Math.round(j.att)} ms (${nom}, ${cause})`);
  };
  continuerB.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); continuer(); }, true);
  boutonsChap.forEach((b, i) => b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); jouer(CIBLES_CHAP[i]); }, true));
  /* le doigt reprend la main : un trajet en cours s'arrête là où il en est */
  ['touchstart', 'wheel'].forEach(n => addEventListener(n, () => { if (jeu) { noter('trajet interrompu par le doigt'); finAttente(jeu, 'doigt'); jeu = null; allerA(vue.p); vue.ptPrec = mesure(); vue.bouge = false; vue.voulue = null; } }, { passive: true }));

  /* ---- la boucle d'image ---- */
  const vue = { p: mesure(), sens: 1, t: null, fl: null, rang: -1, ptPrec: mesure(), tArret: 0, aArret: false, pRail: -1, tRail: 0 };
  let derT = 0, derMesure = 0;
  function image(now) {
    requestAnimationFrame(image);
    const tj = performance.now();
    const enCours = etat.images[etat.images.length - 1];
    if (derT && jeu && enCours) enCours.iv.push(+(now - derT).toFixed(1));
    const dt = derT ? now - derT : 16.7; derT = now;
    let cible = null;
    if (jeu) {
      /* l'horloge d'une étape part quand sa première image est à l'écran (le décodeur amorcé), jamais avant : aucune image sautée au départ */
      const E = jeu.etapes[jeu.e];
      /* Y16 (09/10/2026, soir) : l'horloge d'une étape ne part qu'avec une réserve de six images décodées d'avance (ou la fin de l'étape) :
         sur LinkedIn, chaque trajet repartait avec un décodeur vide (journal de Thibaut : « repart T2 vers 7, prêtes 0 ») et ses
         premières images arrivaient en retard. &amorce=0 : comme avant (mesure) */
      if (!jeu.t0 && vue.fl === E.fl && vue.rang === E.de) { if (E.fl.pretPour(E.de, E.jusqua) && (!AMORCE || lecteur(E.fl).reserve() >= Math.min(6, E.jusqua - E.de))) jeu.t0 = now; else if (enCours) { enCours.reseauDepart = (enCours.reseauDepart || 0) + dt; if (now - (vue.tEt || 0) > 500) { vue.tEt = now; etiquette(); } } }
      /* le réseau en retard sur la lecture (les octets de l'image voulue, et de dix images après, pas encore là) : le trajet attend, sans sauter */
      const enRetard = !!jeu.t0 && !E.fl.dispoRang(E.de + (jeu.k || 0) + 10) && E.fl.recu < E.fl.total;
      if (enRetard) { jeu.t0 += dt; if (enCours) enCours.reseau = (enCours.reseau || 0) + 1; if (now - (vue.tEt || 0) > 500) { vue.tEt = now; etiquette(); } }
      /* P5 : l'image attend (horloge pas encore partie, ou retenue par le réseau) : compté, et l'invite au-delà de 800 ms */
      if (!jeu.t0 || enRetard) { jeu.att += dt; jeu.attPar[E.t.base] = (jeu.attPar[E.t.base] || 0) + dt; if (!jeu.attDebut) jeu.attDebut = now; } else jeu.attDebut = 0;
      montrerAttente(!!jeu.attDebut && now - jeu.attDebut > 800);
      /* une image de plus par image d'écran tant que l'horloge suit (l'image d'écran arrive à 16,7 ms plus ou moins un peu : compter au
         temps seul faisait montrer deux fois la même image puis en sauter une) ; plus de deux images de retard sur l'horloge : rattraper */
      const hor = jeu.t0 ? Math.round((now - jeu.t0) * .06) : 0;
      if (!jeu.k) jeu.k = 0;
      if (hor >= jeu.k + 3) jeu.k = hor - 1; else if (hor > jeu.k) jeu.k++;
      const r = Math.min(E.jusqua, E.de + jeu.k);
      const S2 = jeu.etapes[jeu.e + 1]; if (S2 && !S2.amorce && E.jusqua - r < 40) { S2.amorce = true; lecteur(S2.fl).prechauffer(S2.de); }
      cible = { t: E.t, fl: E.fl, rang: r, sens: jeu.sens };
      const p = E.fl.idx.ps[r]; vue.p = p; if (DEFIL) allerA(p);
      /* l'étape finie quand sa dernière image est à l'écran (jamais de couture : l'arrêt est la dernière image décodée) */
      if (r >= E.jusqua && vue.fl === E.fl && vue.rang >= E.jusqua) {
        if (jeu.e < jeu.etapes.length - 1) { jeu.e++; jeu.t0 = 0; jeu.k = 0; }
        else { vue.p = E.fl.idx.ps[E.jusqua]; allerA(vue.p); vue.ptPrec = mesure(); vue.bouge = false; vue.voulue = null; if (enCours) { enCours.ms = Math.round(now - enCours.t0); noter(`arrivé ${jeu.p1} : ${resume(enCours)}`); } finAttente(jeu, 'arrivé'); jeu = null; }
      }
    } else {
      /* le doigt : p suit le défilement ; immobile (moins d'un pixel et demi), rien n'est demandé : l'image affichée reste (un arrêt,
         la fin d'un trajet), aucune couture */
      const pm = mesure();
      if (Math.abs(pm - vue.ptPrec) > 2e-4) { const d = pm - vue.ptPrec; vue.sens = d > 0 ? 1 : -1; vue.ptPrec = pm; derMesure = now; vue.bouge = true; }
      if (vue.bouge) {
        vue.p += (pm - vue.p) * .35; if (Math.abs(pm - vue.p) < 2e-5) { vue.p = pm; vue.bouge = false; }
        const t = tronconDe(vue.p, vue.sens), fl = vue.sens > 0 ? t.av : t.ar; vue.voulue = { t, fl, rang: rangDe(fl.idx.ps, vue.p, vue.sens > 0), sens: vue.sens };
        /* P5 : au doigt, le trajet où l'on entre prépare le suivant ; le flux voulu, s'il n'est pas encore demandé, part tout de suite. Seulement
           quand l'image suit le doigt de près (un saut, « Passer le film » ou le retour en haut d'un coup, traverse le film sans s'y poser :
           rien ne part pour les tronçons traversés) et jamais sous le film */
        if (Math.abs(pm - vue.p) < .01 && !chg.quitte && !horsIci()) {
          if (vue.sens > 0) engager(t.j);
          if (!fl.promesse && !fl.complet) { noter('au doigt ' + fl.nom); chargerFlux(fl); }
        }
      }
      /* l'image voulue est demandée jusqu'à ce qu'elle soit à l'écran (le décodeur met quelques images d'écran à la rendre) */
      if (vue.voulue) { if (vue.fl === vue.voulue.fl && vue.rang === vue.voulue.rang && !vue.bouge) vue.voulue = null; else cible = vue.voulue; }
    }
    if (cible) {
      const l = lecteur(cible.fl);
      /* fluidité au doigt (passe 25) : la vitesse du rang voulu (images par image d'écran, lissée) ; le pas d'affichage (la vitesse, plus
         une part du retard) ; l'avance d'un saut (huit images d'écran de vitesse) */
      let doigt = null;
      if (!jeu) {
        const dr = vue.dPrec && vue.dPrec.fl === cible.fl ? Math.abs(cible.rang - vue.dPrec.rang) : 0; vue.dPrec = { fl: cible.fl, rang: cible.rang };
        vue.vit = (vue.vit || 0) * .6 + dr * .4;
        const retard = cible.fl === vue.fl ? Math.max(0, cible.rang - vue.rang) : 0;
        doigt = { pas: Q.get('pas') === '1' ? Math.max(1, Math.round(vue.vit), Math.ceil(retard / 4)) : 0, avance: 0 };   /* (pas réguliers : essayés, plus de retard ; &pas=1 pour les remettre) */   /* (viser devant figeait l'image quand le doigt freinait : essayé, retiré) */
      }
      const fr = l.viser(cible.rang, cible.fl === vue.fl ? vue.rang : -1, doigt);
      if (fr) {
        ctx.drawImage(fr.f, 0, 0); fr.f.close(); dessins++;   /* passe 28 : le compte des images peintes (la plaque du crayon) */
        if (dessins === 1) { toile.style.visibility = ''; scene.style.background = ''; }   /* P5 : la première image peinte prend la place de l'affiche, dans la même image d'écran */
        if (jeu && enCours && vue.fl === cible.fl && fr.i > vue.rang + 1) enCours.sautees += fr.i - vue.rang - 1;
        vue.fl = cible.fl; vue.rang = fr.i; vue.t = cible.t;
        if (!mesureL.demarre) { mesureL.demarre = now; mesureL.classe = classeW; mesurer({ event: 'film_lecteur_demarre', lecteur_codec: codec.id, lecteur_classe: classeW }); }   /* passe 28, point 4 */
        appliquerPiste(cible.t, cible.fl.idx.av[fr.i]);
        if (cible.t.nom !== 'T3') cacherMenu();
      } else if (jeu && enCours) enCours.attente++;
      /* le doigt : combien d'images d'écran ont reçu une image nouvelle, et l'écart entre l'image voulue et l'image montrée */
      /* fluidité au doigt (passe 25) : window.__traceDoigt = [] : à chaque image d'écran, [temps, p du défilement, p visé, rang voulu,
         rang montré, image nouvelle] (mesure seulement) */
      if (!jeu && window.__traceDoigt) window.__traceDoigt.push([+now.toFixed(1), +mesure().toFixed(5), +vue.p.toFixed(5), cible.rang, vue.rang, fr ? 1 : 0, cible.fl === vue.fl ? 0 : 1, etat.resets, etat.decodees]);
      if (!jeu) { const D = etat.doigt; D.images++; if (fr) D.dessinees++; const e = cible.fl === vue.fl ? Math.abs(cible.rang - vue.rang) : 99; if (e < 99) { D.ecartMax = Math.max(D.ecartMax, e); D.ecartSomme += e; } else D.changements++; }
    }
    /* préparer le départ suivant : le lecteur du tronçon d'après, posé sur sa première image */
    /* Y16 : l'amorce à un arrêt sans attendre 400 ms de calme (au doigt, on n'y reste pas) ; au doigt, à moins de 90 images de la fin du
       flux en cours, le flux suivant dans le sens du geste est amorcé ; à l'arrêt, la réserve se remplit */
    if (!jeu && (AMORCE || now - derMesure > 400)) prechauffer();
    if (AMORCE && !jeu && vue.fl && vue.t) {
      const it = tr.indexOf(vue.t), fin = vue.fl.idx.n - 1 - vue.rang;
      if (fin < 90) { const nx = vue.sens > 0 ? tr[it + 1] : tr[it - 1]; if (nx) { const fl2 = vue.sens > 0 ? nx.av : nx.ar; if (fl2.dispo(0) && !fl2.amorce) { fl2.amorce = true; lecteur(fl2).prechauffer(0); } } }
      const lp = lecteurs.get(dernierAmorce); if (lp) lp.nourrirVers(12);
    }
    /* passe 28 : le son suit le p de l'image montrée et sa vitesse par seconde (moteur.js : son.progression(pVue, vp) à chaque image ;
       film.js : les gestes, au rendu de chaque image), au temps de la page (F.t du film : l'horloge de ses images, en secondes) */
    if (son && vue.fl && vue.rang >= 0) {
      const pv = vue.fl.idx.ps[vue.rang], ds = dt / 1000;
      son.progression(pv, pSon !== null && ds > 0 ? (pv - pSon) / ds : 0); pSon = pv; etat.pSon = pv;
      if (sonner) sonner(pv, now / 1000);
    }
    /* le rail et l'état hors du film : seulement quand p a bougé (pas de lecture de mise en page à chaque image) */
    if (Math.abs(vue.p - vue.pRail) > 1e-4 || !jeu && now - vue.tRail > 500) {
      vue.pRail = vue.p; vue.tRail = now; majRail(vue.p); etat.p = vue.p;
      const hors = filmEl.getBoundingClientRect().bottom < innerHeight - 2; if (hors !== racine.classList.contains('hors-film')) { racine.classList.toggle('hors-film', hors); if (hors) suspendre('sous le film'); else reprendre(); }
    }
    /* à un arrêt depuis 2,5 s : l'appel (Continuer, le coin) */
    const ici = !jeu && ARRETS_TEL.some(a => Math.abs(vue.p - a) < .004);
    if (ici !== vue.aArret) { vue.aArret = ici; vue.tArret = now; }
    if (ici && now - vue.tArret > 500 && vue.arretCompte !== vue.tArret) {
      vue.arretCompte = vue.tArret;
      const k = ARRETS_TEL.findIndex(a => Math.abs(vue.p - a) < .004);
      voir(k);
      /* P5 : film_arret, le numéro de l'arrêt du film (celui de l'ordinateur : la nuit 1, le croisement 2, le dessin 4, la page 5) */
      mesurerFerme('film_arret', { arret: String([1, 2, 4, 5][k]), forme: 'lecteur', sens: vue.p >= chg.dernierP ? 'avant' : 'arriere' });
      chg.dernierP = vue.p;
    }
    const appel = ici && now - vue.tArret > 2500 && vue.p < .999;
    if (appel !== scene.classList.contains('appel')) { scene.classList.toggle('appel', appel); rail.classList.toggle('appel', appel); }
    etincelles(!jeu && vue.p > .999 && vue.t && vue.t.nom === 'T3');
    /* passe 28 : le crayon du visiteur, à la dernière image de T3 seulement, aucun trajet en cours */
    const aLaPage = !jeu && !!vue.t && vue.t.nom === 'T3' && !!vue.fl && vue.rang >= 0 && vue.fl.idx.ps[vue.rang] >= .9999;
    if (!crayonP && !jeu && (aLaPage || (vue.aArret && vue.p > .92))) chargerCrayon();
    if (crayonL) crayonL.rendre(aLaPage);
    if (aLaPage && !mesureL.fin && mesureL.demarre) { mesureL.fin = true; mesurer({ event: 'film_lecteur_fin', lecteur_codec: codec.id, lecteur_classe: classeW, lecteur_duree: Math.round((now - mesureL.demarre) / 10000) * 10 }); }   /* passe 28, point 4 */
    if (now % 500 < 17) etiquette();
    const cj = performance.now() - tj; if (jeu && enCours) { enCours.js = (enCours.js || 0) + cj; if (cj > 8) enCours.lourdes = (enCours.lourdes || 0) + 1; }
  }
  let dernierPre = '', dernierAmorce = '';
  const AMORCE = Q.get('amorce') !== '0';   /* Y16 */
  function prechauffer() {
    const s = ARRETS_TEL.findIndex(a => Math.abs(vue.p - a) < .004); if (s < 0) return;
    const suivant = tr.find(t => Math.abs(t.p0 - ARRETS_TEL[s]) < 1e-6), precedent = tr.find(t => Math.abs(t.p1 - ARRETS_TEL[s]) < 1e-6);
    /* (refait tant qu'un des deux flux n'était pas encore arrivé) */
    const pa = !suivant || suivant.av.dispo(0), pr = !precedent || precedent.ar.dispo(0);
    const cle = s + ':' + (suivant ? suivant.nom : '') + (precedent ? precedent.nom : '') + pa + pr;
    if (cle === dernierPre) return; dernierPre = cle;
    if (suivant && pa) { lecteur(suivant.av).prechauffer(0); dernierAmorce = suivant.av.url; }
    if (precedent && pr) lecteur(precedent.ar).prechauffer(0);
  }
  const resume = x => { const L = x.iv; x.redemarrages = etat.resets - (x.r0 || 0); x.debut25 = L.slice(0, 120).filter(v => v > 25).length; return `${x.redemarrages} redémarrage(s), ${x.debut25} au-delà de 25 ms dans les 2 premières s ; ${L.length} images, ${L.filter(v => v > 25).length} au-delà de 25 ms, ${L.length ? Math.max(...L) : 0} ms au plus, ${x.sautees} sautées, ${x.attente} sans image, attente au départ ${Math.round(x.reseauDepart || 0)} ms, ${x.reseau || 0} images d'attente en route, ${x.ms} ms, script ${Math.round(x.js || 0)} ms (${x.lourdes || 0} au-delà de 8 ms)`; };
  function etiquette() {
    if (!marque) return;
    const c = ordre.filter(f => f.recu < f.total).map(f => f.nom + ' ' + Math.round(100 * f.recu / Math.max(1, f.total)) + ' %');
    marque.textContent = `Prototype v${V4 ? 4 : 3} ${innerWidth} x ${innerHeight}, scène ${scene.clientHeight}, WebCodecs ${codec.id}, h${H}${c.length ? ', chargement ' + c[0] : ''}`;
  }
  etiquette();
  /* ?arret=1 à 4 : ouvert sur un arrêt du téléphone (essais) ; sinon l'ouverture : la nuit se joue seule jusqu'à l'arrêt 1, comme le film */
  const A = parseInt(Q.get('arret'), 10);
  vue.bouge = true;   /* la première image */
  if (A >= 1 && A <= 4) { const p = ARRETS_TEL[A - 1]; allerA(p); vue.p = p; vue.ptPrec = mesure(); }
  else if (mesure() < .01) tr[0].av.charger().then(() => setTimeout(() => { if (!jeu && vue.p < .01) jouer(.183); }, 300)).catch(() => {});
  requestAnimationFrame(image);
  racine.dataset.pret = '1';
  noter('installé');
}

/* ---- un flux : l'index, les octets arrivés, les paquets ---- */
function creerFlux(url, idx) {
  const n = idx.paquets.length, off = new Array(n), fin = new Array(n);
  let o = 0; for (let i = 0; i < n; i++) { off[i] = o; o += idx.paquets[i][0]; fin[i] = o; }
  /* les points d'entrée : pour chaque image clé (ordre de décodage), son rang de présentation */
  const cles = []; idx.paquets.forEach((p, i) => { if (p[1]) cles.push([i, p[2]]); });
  /* les octets qu'il faut pour montrer l'image de rang r (tous les paquets jusqu'au sien, dans l'ordre de décodage) */
  const finRang = new Array(idx.n).fill(0); idx.paquets.forEach((p, i) => { finRang[p[2]] = fin[i]; });
  for (let r = 1; r < idx.n; r++) finRang[r] = Math.max(finRang[r], finRang[r - 1]);
  const fl = { url, nom: url.split('/').pop(), idx, n, off, fin, cles, total: o, recu: 0, buf: null, ms: 0, promesse: null, complet: false, ctrl: null, recuDebut: 0,
    dispo: k => fl.buf && fin[k] <= fl.recu,
    dispoRang: r => !!fl.buf && finRang[Math.min(idx.n - 1, Math.max(0, r))] <= fl.recu,
    /* prêt à jouer de l'image de à l'image a : tout est là, ou 3 s d'images sont là et le reste arrivera avant que la lecture ne le
       rattrape, au débit mesuré, avec 30 % de marge (comme le flux de la v1) */
    pretPour(de, a) {
      if (!fl.buf) return false; if (fl.recu >= o) return true;
      if (!fl.dispoRang(Math.min(a, de + 180))) return false;
      const debit = (fl.recu - fl.recuDebut) / Math.max(1, performance.now() - fl.tDebut);   /* octets par ms (P5 : depuis la reprise) */
      const reste = finRang[a] - fl.recu; return reste <= 0 || reste / Math.max(debit, 1) <= (a - de) / .06 * .77;
    },
    chunk: k => { const p = idx.paquets[k]; return new EncodedVideoChunk({ type: p[1] ? 'key' : 'delta', timestamp: Math.round(p[2] * 1e6 / 60), data: fl.buf.subarray(off[k], off[k] + p[0]) }); },
    /* P5 (19/10/2026) : un chargement s'arrête (arreter : AbortController) et reprend où il en était (Range) ; un serveur qui renvoie le
       fichier entier (200) le fait repartir du début (les mêmes octets réécrits) */
    charger(prog) {
      if (fl.promesse) return fl.promesse;
      const ctrl = fl.ctrl = new AbortController();
      const promesse = fl.promesse = (async () => {
        const t0 = performance.now(); if (!fl.buf) fl.buf = new Uint8Array(o); fl.tDebut = t0; fl.recuDebut = fl.recu;
        /* Y16 (09/10/2026, soir) : &nocache=1 (mesure seulement) : le flux est relu du réseau, comme une première visite. Essayé puis
           retiré : retenir les autres flux pendant un trajet (sur l'iPhone à 20 Mbit/s, le flux du trajet suivant arrivait trop tard :
           attente au départ de 1,4 s et 36 images d'attente en route ; sans frein, aucune) */
        const depuis = fl.recu, init = { signal: ctrl.signal };
        if (depuis > 0) init.headers = { Range: 'bytes=' + depuis + '-' };
        const r = await fetch(url + (/[?&]nocache=1/.test(location.search) ? '?r=' + Date.now() : ''), init); if (!r.ok) throw new Error('HTTP ' + r.status);
        if (depuis > 0 && r.status !== 206) { fl.recu = 0; fl.recuDebut = 0; }
        const lect = r.body.getReader(); let der = 0;
        for (;;) { const { done, value } = await lect.read(); if (done) break; fl.buf.set(value, fl.recu); fl.recu += value.byteLength; if (prog && performance.now() - der > 250) { der = performance.now(); prog(); } }
        if (fl.recu < o) throw new Error('flux incomplet (' + fl.recu + ' octets sur ' + o + ')');
        fl.complet = true; fl.ms = Math.round(performance.now() - t0);
      })();
      promesse.catch(() => { if (fl.promesse === promesse && !fl.complet) { fl.promesse = null; fl.ctrl = null; } });
      return promesse;
    },
    arreter() { if (fl.ctrl && !fl.complet) { try { fl.ctrl.abort(); } catch (e) { /* rien */ } } } };
  return fl;
}

/* ---- un lecteur : un VideoDecoder sur un flux ; viser(i) rend l'image décodée la plus récente au plus i (rang de présentation) ---- */
function creerLecteur(fl, etat, noter) {
  const CFG = { codec: fl.idx.codec, codedWidth: fl.idx.cw, codedHeight: fl.idx.ch, hardwareAcceleration: 'prefer-hardware', optimizeForLatency: true };
  let dec = null, k = 0, ptsMax = -1, prets = [], base = -1, vidange = false, tSaut = 0, montreSaut = true;
  const ouvrir = () => {
    dec = new VideoDecoder({ output: f => { prets.push({ i: Math.round(f.timestamp * 60 / 1e6), f }); prets.sort((a, b) => a.i - b.i); etat.decodees++; tSaut = 0; }, error: e => noter('décodeur ' + fl.nom + ' : ' + e.message) });
    dec.configure(CFG);
  };
  const vider = () => { prets.forEach(x => x.f.close()); prets = []; };
  let nRep = 0;
  const repartir = (i, pourquoi) => {
    if (nRep++ % 25 === 0) noter(`repart ${fl.nom} vers ${i} (${pourquoi}) : base ${base}, ptsMax ${ptsMax}, k ${k}, prêtes ${prets.length}, état ${dec ? dec.state : '-'}, file ${dec ? dec.decodeQueueSize : '-'}`);
    let c = fl.cles[0]; for (const x of fl.cles) { if (x[1] <= i) c = x; else break; }
    if (!dec || dec.state === 'closed') ouvrir(); else { dec.reset(); dec.configure(CFG); }
    vider(); k = c[0]; ptsMax = -1; base = c[1]; vidange = false; etat.resets++; etat.raisons = etat.raisons || {}; etat.raisons[pourquoi] = (etat.raisons[pourquoi] || 0) + 1;
  };
  const nourrir = i => {
    while (k < fl.n && ptsMax < i + 12 && dec.decodeQueueSize < 6 && prets.length < 8 && fl.dispo(k)) {
      try { dec.decode(fl.chunk(k)); } catch (e) { noter('décodage ' + fl.nom + ' ' + k + ' : ' + e.message); break; }
      ptsMax = Math.max(ptsMax, fl.idx.paquets[k][2]); k++;
    }
    /* au bout du flux, les dernières images (réordonnées) ne sortent qu'à la vidange */
    if (k >= fl.n && !vidange && dec.decodeQueueSize === 0) { vidange = true; dec.flush().catch(() => {}); }
  };
  return {
    fl, vu: 0,
    /* i : l'image voulue ; affiche : l'image de ce flux déjà à l'écran (-1 sinon) ; doigt (facultatif) : { pas, avance } (voir plus bas) */
    viser(i, affiche, doigt) {
      if (!fl.buf) return null;
      if (!dec || dec.state === 'closed') repartir(i, 'ouverture');
      /* un petit recul dans le sens de ce flux (le doigt hésite) : l'image reste ; un vrai recul passe par l'autre flux */
      else if (affiche >= 0 && i < affiche) { if (affiche - i <= 4) return null; repartir(i, 'recul'); }
      else if (i < base) repartir(i, 'avant la base');
      /* Fluidité au doigt (passe 25, 09/10/2026) : mesuré sur l'iPhone (trace image par image), un geste vif gelait l'image 0,2 à 0,35 s
         puis sautait de 230 à 470 images : le rang voulu avançant de 20 à 70 images par image d'écran, chaque image d'écran visait une
         nouvelle image clé et remettait le décodeur à zéro (16 à 21 remises à zéro par geste, rien ne sortait). Ici, au doigt : un saut ne
         se refait pas avant que le précédent ait sorti une image (ou 250 ms), ni avant d'avoir montré une image sortie du précédent (le
         saut suivant la jetait : au changement de flux, 19 images d'écran sans rien montrer, 57 images décodées jetées) ; l'avance se
         compte depuis la base du saut */
      else if (i > Math.max(ptsMax, doigt ? base : -1) + 45 && !(doigt && ((tSaut && performance.now() - tSaut < 250) || (!montreSaut && prets.some(x => x.i <= i))))) {
        const v = doigt ? Math.min(fl.idx.n - 1, i + doigt.avance) : i;
        const c = fl.cles.filter(x => x[1] <= v).pop(); if (c && c[0] > k) { repartir(v, 'saut'); if (doigt) { tSaut = performance.now(); montreSaut = false; } }
      }
      nourrir(i);
      let j = -1; for (let m = 0; m < prets.length; m++) if (prets[m].i <= i) j = m;
      /* au doigt, les images décodées sont montrées à pas réguliers (doigt.pas par image d'écran) plutôt que la dernière prête : le
         décodeur rend les images par paquets (les images B), d'où des pas de 1, 6 puis 9 à vitesse moyenne */
      if (doigt && doigt.pas && j > 0 && affiche >= 0 && affiche >= prets[0].i - doigt.pas * 2) { const voulu = Math.min(i, affiche + doigt.pas); let jb = 0; for (let m = 0; m <= j; m++) if (Math.abs(prets[m].i - voulu) < Math.abs(prets[jb].i - voulu)) jb = m; j = jb; }
      if (j < 0) { if (etat.manques && etat.manques.length < 40) etat.manques.push([fl.nom, i, ptsMax, k, prets.map(x => x.i).join(' '), dec.decodeQueueSize, Math.round(performance.now())]); return null; }
      for (let m = 0; m < j; m++) prets[m].f.close();
      const x = prets[j]; prets = prets.slice(j + 1); base = x.i; montreSaut = true;
      return x;
    },
    prechauffer(i) { if (!fl.buf) return; if (!dec || dec.state === 'closed' || base !== i) { repartir(i, 'préparation'); } nourrir(i); },
    /* Y16 : les images décodées d'avance (la réserve), et le décodeur nourri vers i sans rien montrer */
    reserve() { return prets.length; },
    nourrirVers(i) { if (dec && dec.state !== 'closed' && fl.buf) nourrir(i); },
    fermer() { vider(); try { if (dec && dec.state !== 'closed') dec.close(); } catch (e) { /* rien */ } dec = null; }
  };
}

/* ---- M1 (P5, 19/10/2026, décision M1 du plan des passes, revue Claude Design, parties 3 et 11) : le liseré des boutons de la fin n'est
   plus une étincelle qui tourne sans fin (1,4 s par bouton, puis 1,6 s de pause, sans arrêt : critère 2.2.2) ; un trait de plume
   (#16205C, 1,5 px, au milieu de la bordure) fait une fois le tour de chaque bouton visible, l'un après l'autre (900 ms chacun, courbe
   douce, 200 ms d'écart, départ 400 ms après l'arrivée : 3,5 s en tout), puis reste tracé. Effacé quand la page s'en va, retracé au
   retour. Même dessin que telephone.js (ordinateur). ?etincelle=0 (essais) : tracé tout de suite, sans mouvement ---- */
const M1_DUREE = 900, M1_ECART = 200, M1_DEPART = 400;
function creerEtincelles(liens) {
  if (!liens.length) return () => {};
  const anime = Q.get('etincelle') !== '0' && !matchMedia('(prefers-reduced-motion: reduce)').matches && !!Element.prototype.animate;
  const NS = 'http://www.w3.org/2000/svg';
  const traits = liens.map(a => {
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('class', 'etincelle trace-plume'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    const r = document.createElementNS(NS, 'rect');
    s.style.cssText = 'position:absolute;pointer-events:none;overflow:visible;visibility:hidden';
    r.style.cssText = 'fill:none;stroke:#16205C;stroke-width:1.5px;stroke-linecap:round;stroke-linejoin:round';
    s.appendChild(r); a.appendChild(s);
    return { a, s, r, anim: null };
  });
  const mesurer = t => {
    const cs = getComputedStyle(t.a), b = parseFloat(cs.borderTopWidth) || 0, w = t.a.offsetWidth, h = t.a.offsetHeight;
    const r = Math.max(0, Math.min((parseFloat(cs.borderTopLeftRadius) || 0) - b / 2, (h - b) / 2, (w - b) / 2));
    t.s.setAttribute('width', w); t.s.setAttribute('height', h); t.s.style.left = t.s.style.top = (-b) + 'px';
    t.r.setAttribute('x', b / 2); t.r.setAttribute('y', b / 2); t.r.setAttribute('width', Math.max(0, w - b)); t.r.setAttribute('height', Math.max(0, h - b)); t.r.setAttribute('rx', r); t.r.setAttribute('ry', r);
    t.per = 2 * (w - b) + 2 * (h - b) - (8 - 2 * Math.PI) * r;
    t.r.style.strokeDasharray = `${t.per.toFixed(2)} ${t.per.toFixed(2)}`; t.r.style.strokeDashoffset = '0';
  };
  let arme = false;
  const effacer = () => traits.forEach(t => { if (t.anim) t.anim.cancel(); t.anim = null; t.s.style.visibility = 'hidden'; });
  return pret => {
    if (pret === arme) return; arme = pret; effacer();
    if (!pret) return;
    const vus = traits.filter(t => t.a.isConnected && getComputedStyle(t.a).visibility !== 'hidden' && getComputedStyle(t.a).display !== 'none');
    vus.forEach((t, i) => {
      mesurer(t); t.s.style.visibility = '';
      if (anime) t.anim = t.r.animate([{ strokeDashoffset: t.per }, { strokeDashoffset: 0 }], { duration: M1_DUREE, delay: M1_DEPART + i * (M1_DUREE + M1_ECART), easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
    });
  };
}
