/* =====================================================================
   N1 (quatorzième passe, 05/10/2026) : la mémoire du film.
   Safari sur iPhone tue la page quand elle dépasse sa mémoire (« Un problème
   est survenu à plusieurs reprises »). Les canevas et les textures WebGL en
   sont la plus grosse part et ne se libèrent pas seuls. Ici :
   - TEL : le petit écran (téléphone), lu une fois ;
   - plafond de densité et de taille de texture sur téléphone ;
   - liberer() : rend la mémoire d'un canevas tout de suite (0 x 0) ;
   - le compteur (?mesure=1 seulement) : chaque canevas et chaque texture
     WebGL vivants, largeur x hauteur x 4 octets, lus par le cartouche.
   ===================================================================== */
import { ouvrier } from './hors-fil.js';
export const TEL = Math.min(innerWidth, screen && screen.width ? screen.width : innerWidth) < 768 || innerWidth < 768;
/* S4 (dix-neuvième passe, 07/10/2026) : le filet de sécurité, le mode économe. Un témoin est posé dans sessionStorage au
   démarrage et effacé quand la page est quittée (pagehide) ; s'il est encore là au chargement suivant, la page a été
   arrêtée net (sur iPhone : iOS a arrêté son processus, « Un problème est survenu à plusieurs reprises », et Safari la
   recharge). Le journal de ?diag=1 (js/diag.js) le sait aussi. Le film repart alors en mode économe, sans rien dire au
   visiteur, pour le reste de la session de l'onglet : densité 1,5 au plus, la couleur par un lavis uni (pas les treize
   lavis ni le lavis WebGL du sol), le papier sans lissage multi-échantillons. (Le cahier demandait aussi le papier sans
   WebGL et un seul plan de la pièce : essayés, l'un perd la page blanche, l'autre tient trois canevas de 14 Mo au lieu
   d'un : écartés, voir papier.js et film.js.)
   ?eco=1 le force (essais) ; ?eco=0 l'efface pour la session */
const Q = new URLSearchParams(location.search);
const TEMOIN = 'civikia-film-ouvert', ECO_SESSION = 'civikia-film-eco';
const ss = { lire: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, poser: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* rien */ } }, oter: k => { try { sessionStorage.removeItem(k); } catch (e) { /* rien */ } } };
/* X2 (vingt-quatrième passe, 08/10/2026) : sur l'iPhone de Thibaut, après deux arrêts, le film ne repartait pas en économe (« un problème
   récurrent est survenu », puis une lecture normale qui meurt encore). Le témoin de S4 ne vivait que dans sessionStorage, propre à
   l'onglet et à sa session : il est perdu si Safari rouvre la page dans un nouvel état d'onglet après des arrêts répétés, ou si la page
   est rouverte depuis l'adresse ou un autre onglet. Sur téléphone, le témoin est désormais aussi dans localStorage, daté, un par
   chargement (deux onglets ne se prennent pas l'un pour l'autre) : posé au démarrage, effacé sur pagehide (une page quittée proprement :
   rechargement, lien, onglet fermé) et quand la page est cachée (une page cachée qu'iOS libère n'a pas planté), reposé quand elle
   redevient visible ; un témoin de plus d'une heure est ignoré. Trouvé au chargement (celui d'un autre chargement, resté) : la page
   s'est arrêtée net ; le mode économe est noté dans localStorage, daté, avec le nombre de lectures complètes réussies depuis : il reste
   tant que deux lectures complètes (jusqu'à la fin, en passant par l'entrée de l'atelier) n'ont pas réussi, sept jours au plus ; un
   nouvel arrêt remet le compte à zéro. ?eco=0 l'efface (sessionStorage et localStorage), ?eco=1 le force. Le témoin de sessionStorage
   reste (S4, ordinateur compris) ; sur ordinateur, rien ne change. */
const ls = { lire: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, poser: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* rien */ } }, oter: k => { try { localStorage.removeItem(k); } catch (e) { /* rien */ } } };
const TEMOIN_L = 'civikia-film-temoins', ECO_L = 'civikia-film-econome', HEURE = 3600e3, SEMAINE = 7 * 24 * HEURE;
const lireJson = k => { try { return JSON.parse(ls.lire(k) || 'null'); } catch (e) { return null; } };
const ID_CHARGEMENT = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const temoins = () => { const v = lireJson(TEMOIN_L), m = {}; if (v && typeof v === 'object' && !Array.isArray(v)) for (const k in v) if (typeof v[k] === 'number' && Date.now() - v[k] < HEURE) m[k] = v[k]; return m; };
/* les témoins laissés par d'autres chargements (des arrêts nets), lus une fois, puis consommés */
const restes = TEL ? Object.keys(temoins()).filter(k => k !== ID_CHARGEMENT) : [];
let ecoL = (() => { const v = lireJson(ECO_L); return v && typeof v.depuis === 'number' && Date.now() - v.depuis < SEMAINE ? v : null; })();
export const ARRET_NET = !!ss.lire(TEMOIN) || !!window.__diagArretNet || restes.length > 0;
if (Q.get('eco') === '0') { ss.oter(ECO_SESSION); ls.oter(ECO_L); ecoL = null; }
else if (ARRET_NET) { ss.poser(ECO_SESSION, '1'); if (TEL) { ecoL = { depuis: Date.now(), reussies: 0, arrets: ((ecoL && ecoL.arrets) || 0) + 1 }; ls.poser(ECO_L, JSON.stringify(ecoL)); } }
else if (!ecoL) ls.oter(ECO_L);
export const ECO = Q.get('eco') === '1' || (Q.get('eco') !== '0' && (ss.lire(ECO_SESSION) === '1' || !!ecoL));
window.__eco = ECO;
/* X2 : ce que le témoin a dit à ce chargement (essais : window.__x2) */
window.__x2 = { arretNet: ARRET_NET, parSession: !!ss.lire(TEMOIN), parLocal: restes.length, eco: ECO, ecoL };
const poserTemoin = () => { ss.poser(TEMOIN, String(Date.now())); if (TEL) { const m = temoins(); m[ID_CHARGEMENT] = Date.now(); ls.poser(TEMOIN_L, JSON.stringify(m)); } };
const oterTemoin = () => { ss.oter(TEMOIN); if (TEL) { const m = temoins(); delete m[ID_CHARGEMENT]; if (Object.keys(m).length) ls.poser(TEMOIN_L, JSON.stringify(m)); else ls.oter(TEMOIN_L); } };
/* les témoins des arrêts sont consommés (le prochain chargement ne les relit pas) ; celui de ce chargement est posé */
if (restes.length) { const m = temoins(); restes.forEach(k => { delete m[k]; }); ls.poser(TEMOIN_L, JSON.stringify(m)); }
poserTemoin();
addEventListener('pagehide', oterTemoin);
addEventListener('pageshow', e => { if (e.persisted) poserTemoin(); });
/* S4 : une page cachée (autre onglet, autre application) qu'iOS libère pour faire de la place n'a pas planté : le témoin
   n'est tenu que tant que la page est visible */
document.addEventListener('visibilitychange', () => { if (document.hidden) oterTemoin(); else poserTemoin(); });
/* X2 : une lecture complète réussie (moteur.js l'appelle une fois par chargement, quand la fin est atteinte après l'entrée de
   l'atelier) ; deux en mode économe, et le mode économe est levé pour les chargements suivants */
export function lectureReussie() {
  if (!ecoL) return;
  ecoL.reussies = (ecoL.reussies || 0) + 1;
  if (ecoL.reussies >= 2) { ls.oter(ECO_L); ss.oter(ECO_SESSION); ecoL = null; } else ls.poser(ECO_L, JSON.stringify(ecoL));
  window.__x2.ecoL = ecoL;
}
/* N1 : sur téléphone, aucun canevas au-dessus d'une densité de 2 (jamais 3) ; S4 : 1,5 en mode économe */
export const DPR_MAX = Q.has('dpr') ? Math.max(.5, Math.min(3, +Q.get('dpr') || 1)) : ECO ? 1.5 : TEL ? 2 : 3;   /* S1 : ?dpr=1 (essais sur l'appareil) */
/* S4 : le plafond d'un module (sa propre densité maximale), ramené à celui du mode */
export const plafondDpr = v => Math.min(v, DPR_MAX);
export const dpr = (plafond = DPR_MAX) => Math.min(window.devicePixelRatio || 1, plafond, DPR_MAX);
/* N1 : sur téléphone, aucune texture WebGL au-delà de 1024 px de côté */
export const TEX_MAX = TEL ? 1024 : 8192;

/* S2 (dix-neuvième passe, 07/10/2026) : un canevas qui ne sera plus jamais repeint devient une image (encodée en PNG, posée à
   sa place dans la page, mêmes classe et attributs), et le canevas rend sa mémoire. Mesuré sur l'iPhone 15 : 40 Mo de
   canevas de plus font tomber la page à l'arrivée des couleurs de l'atelier, 40 Mo d'images décodées non (le navigateur
   peut oublier une image décodée et la relire de son fichier, pas un canevas). apres(img) reçoit l'image, une fois décodée */
/* T14 (07/10/2026) : la cible du moteur (la valeur de p où est le défilement, que la vue rejoint) et sa vitesse (p par seconde,
   le maximum récent : elle retombe en un dixième de seconde quand le doigt s'arrête). Un retour arrière rapide (de 0,93 à
   0,25 en une demi-seconde, le défilement natif avec son élan) fait passer la vue par la pièce, le CV, le croisement : ce qui
   ne se recrée que pour être vu attend que le défilement ralentisse (VUE.rapide()) ; le film le plus rapide joue à 0,06 p
   par seconde, le retour par « Reculer » à 0,25, un geste vif dépasse 1 */
/* T14 bis (07/10/2026, fin d'après-midi) : sur l'iPhone, la page est encore morte une fois, à l'atterrissage d'un retour rapide de
   la fin vers le croisement : tout ce qui avait attendu la fin du geste se recréait dans la même seconde (le monde, le papier,
   le CV d'un coup : 15 Mo de canevas et 25 Mo de textures dans une image, puis la pièce, 20 Mo), juste après que la page de la
   fin eut rendu les siens. Le geste compte désormais la vue autant que le défilement (la vue rejoint le doigt après lui), et il
   finit 400 ms après le dernier mouvement rapide ; calme() dit depuis combien de temps tout est calme : chaque recréation a son
   délai (le CV à 400 ms, la pièce à 900, la feuille de dessin à 1 400), elles ne tombent plus dans la même image */
/* X1 (vingt-quatrième passe) : porte, vrai quand le doigt est contre la porte de l'atelier (moteur.js) ; recul(p), vrai quand la cible
   du défilement est derrière la vue (on revient vers le chemin) : le chemin ne se recrée qu'en revenant, l'atelier ne se rend qu'en
   revenant (la règle symétrique de la porte) */
export const VUE = { cible: null, vitesse: 0, tAgite: -1e9, tTres: -1e9, porte: false, rapide() { return performance.now() - this.tAgite < 400; }, calme() { return performance.now() - this.tAgite; }, recul(p) { return this.cible !== null && this.cible < p - .0005; } };
export function en_image(c, apres) {
  if (!c || !c.toBlob || !c.width || !c.height) return;
  /* l'encodage se fait dans l'ouvrier (un fil à part) : une image de 2496 x 1458 encodée sur le fil principal le bloquerait
     plusieurs centaines de millisecondes sur l'iPhone ; sans ouvrier, toBlob */
  const poser = b => {
      if (!b) return;
      const im = new Image(); im.decoding = 'async';
      im.className = c.className; for (const a of ['aria-hidden', 'style']) { const v = c.getAttribute(a); if (v !== null) im.setAttribute(a, v); }
      im.width = c.width; im.height = c.height;
      im.onload = () => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(() => { if (c.parentNode) c.replaceWith(im); if (apres) apres(im); liberer(c); });
      im.src = URL.createObjectURL(b);
  };
  const parToBlob = () => { try { c.toBlob(poser, 'image/png'); } catch (e) { /* le canevas reste */ } };
  if (!window.createImageBitmap) { parToBlob(); return; }
  createImageBitmap(c).then(bm => ouvrier('figer', { bm }, [bm])).then(r => poser(r.blob)).catch(parToBlob);
}
/* un canevas rendu à 0 x 0 : sa mémoire part tout de suite (sans attendre le ramasse-miettes) */
export function liberer(...cs) { cs.forEach(c => { if (c && (c.width || c.height)) { c.width = 0; c.height = 0; } }); }

/* une source réduite pour une texture : au plus TEX_MAX de côté (une copie, la source n'est pas touchée) */
export function pourTexture(src) {
  const w = src.naturalWidth || src.width, h = src.naturalHeight || src.height, m = Math.max(w, h);
  if (!w || !h || m <= TEX_MAX) return src;
  const k = TEX_MAX / m, c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, c.width, c.height);
  c._temp = true;
  return c;
}

/* ---- le compteur (?mesure=1) ---- */
export function installerCompteur() {
  if (window.__memoire) return;
  const C = [], TX = new Set(), M = { max: 0, pMax: 0 };
  const ce = Document.prototype.createElement;
  Document.prototype.createElement = function (t, o) { const e = ce.call(this, t, o); if (String(t).toLowerCase() === 'canvas') C.push(new WeakRef(e)); return e; };
  const enrober = P => {
    if (!P) return;
    const bt = P.bindTexture, ti = P.texImage2D, ts = P.texStorage2D, dt = P.deleteTexture, gm = P.generateMipmap;
    P.bindTexture = function (cible, tex) { (this.__lie = this.__lie || {})[cible] = tex; return bt.apply(this, arguments); };
    P.texImage2D = function (cible) {
      const tex = this.__lie && this.__lie[cible], a = arguments;
      if (tex && a[1] === 0) { let w = 0, h = 0; if (a.length >= 8) { w = a[3]; h = a[4]; } else { const s = a[5]; if (s) { w = s.naturalWidth || s.width || 0; h = s.naturalHeight || s.height || 0; } } tex.__o = w * h * 4 * (tex.__mip ? 4 / 3 : 1); tex.__w = w; tex.__h = h; TX.add(tex); }
      return ti.apply(this, arguments);
    };
    if (ts) P.texStorage2D = function (cible, n, f, w, h) { const tex = this.__lie && this.__lie[cible]; if (tex) { tex.__w = w; tex.__h = h; tex.__o = w * h * 4; TX.add(tex); } return ts.apply(this, arguments); };
    if (gm) P.generateMipmap = function (cible) { const tex = this.__lie && this.__lie[cible]; if (tex && !tex.__mip) { tex.__mip = true; tex.__o = (tex.__o || 0) * 4 / 3; } return gm.apply(this, arguments); };
    P.deleteTexture = function (tex) { if (tex) TX.delete(tex); return dt.apply(this, arguments); };
  };
  enrober(window.WebGLRenderingContext && WebGLRenderingContext.prototype);
  enrober(window.WebGL2RenderingContext && WebGL2RenderingContext.prototype);
  window.__memoire = () => {
    const vus = new Set(); let o = 0, n = 0, gros = 0;
    const ajouter = c => { if (!c || vus.has(c)) return; vus.add(c); const a = c.width * c.height; if (!a) return; n++; o += a * 4; if (a > gros) gros = a; };
    for (let i = C.length - 1; i >= 0; i--) { const c = C[i].deref(); if (!c) C.splice(i, 1); else ajouter(c); }
    document.querySelectorAll('canvas').forEach(ajouter);
    let t = 0; TX.forEach(x => { t += x.__o || 0; });
    const mo = v => +(v / 1048576).toFixed(1), total = mo(o + t);
    if (total > M.max) { M.max = total; M.pMax = window.__film ? +window.__film.p().toFixed(3) : 0; }
    return { canevas: mo(o), n, textures: mo(t), nt: TX.size, total, max: M.max, pMax: M.pMax, plusGrand: Math.round(Math.sqrt(gros)) };
  };
}
