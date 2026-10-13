/* =====================================================================
   Maquette C, « Le film ». Point d'entrée.
   ===================================================================== */
/* S1 (dix-neuvième passe, 07/10/2026) : le journal sur l'appareil (?diag=1). Passe 26 (le gel, G5, D4) : diag.js ne part plus en
   production ; il n'est importé que l'interrupteur des essais ouvert (commun/essais.js), plus bas (DIAG_PRET) */
import { clamp, rng, decouperLettres, decouperMots, lettres, mots, setVar, setO } from './outils.js';
import { enregistrerPeintres, ecritureReelle, visuel, NOMS_FILM } from './visuels.js';
import { creerTelephone, pose3d } from './telephone.js';
import { T, ARRETS } from './temps.js';
import { poseNuit } from './plans/communs.js';
import { poserNuitMobile } from './plans/p1-nuit.js';
import { PEINTRES } from './provisoires/index.js';
import { installerCompteur, TEL } from './memoire.js';
/* U1 (vingt et unième passe, 07/10/2026) : le film (film.js, moteur.js et tout ce qu'ils importent : 0,9 Mo de script) est chargé à
   part : ce module (et la première image du téléphone) n'attend plus qu'une petite partie du script (le téléphone, les visuels,
   les outils : 0,25 Mo) ; avant, la page attendait tout le script (servi sans cache ni compression par le serveur des essais, 0,4
   à 0,6 s sur l'iPhone) avant de rien poser. Sur téléphone, ouvert sur la nuit, il n'est demandé qu'une fois la première image du
   téléphone peinte (mesuré sur l'iPhone : demandé tout de suite, son téléchargement et son évaluation passaient devant la photo du
   téléphone et retardaient sa première image de 0,3 à 1 s) ; ailleurs (ordinateur, image figée, arrêt), tout de suite */
let modFilm = null, modMoteur = null;
const chargerFilm = () => { if (!modFilm) { modFilm = import('./film.js'); modMoteur = import('./moteur.js'); } return modFilm; };
/* U1 : ?u1sonde=1 (essais seulement) : les images de plus de 40 ms et quelques repères du démarrage, dans window.__u1s */
if (new URLSearchParams(location.search).get('u1sonde') === '1') {
  const S = window.__u1s = { im: [], rep: [] }; let der = 0;
  const f = t => { if (der && t - der > 40) S.im.push([Math.round(der), Math.round(t - der)]); der = t; if (t < 12000) requestAnimationFrame(f); };
  requestAnimationFrame(f);
  S.rep.push(['main.js', Math.round(performance.now())]);
}

window.addEventListener('error', e => document.documentElement.setAttribute('data-erreur', e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
/* L4 (douzième passe) : les erreurs attrapées, lues par le cartouche de mesure (?mesure=1) */
window.__erreurs = window.__erreurs || [];
window.addEventListener('error', e => { if (window.__erreurs.length < 50) window.__erreurs.push((e.message || 'erreur') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
window.addEventListener('unhandledrejection', e => { if (window.__erreurs.length < 50) window.__erreurs.push('promesse : ' + String(e.reason && (e.reason.message || e.reason)).slice(0, 160)); });
enregistrerPeintres(PEINTRES);
const Q = new URLSearchParams(location.search);
/* Y6 (vingt-cinquième passe, 08/10/2026) : le filet des navigateurs intégrés aux applications. Mesuré sur l'iPhone chaud (passe 25,
   séries du 08/10) et filmé par Thibaut dans LinkedIn : dans le navigateur d'une application, la page a moins de mémoire que dans
   Safari et le film entier y meurt (à 3 s dans LinkedIn). Le script de démarrage décide donc ici, avant de demander le moindre module
   du film (film.js, moteur.js et ce qu'ils importent), d'après l'agent utilisateur : LinkedIn (LinkedInApp), Facebook et Messenger
   (FBAN, FBAV), Instagram, X (Twitter), et sur Android toute vue web d'application (« ; wv) »). Là, la forme légère : la première
   image du film (la nuit, la mairie, le téléphone et la conversation de Marianne entière), immobile, puis les trois cartes et le
   pied commun, la page défile normalement ; un bouton « Voir le film » rouvre la même adresse dans Safari ou Chrome. Même adresse,
   aucune redirection, le HTML servi (et lu par les robots) ne change pas. ?film=1 force le film entier (essais), ?leger=1 force la
   forme légère (Thibaut, sur Safari) ; ?plateforme=ios ou android choisit la phrase d'aide sur un ordinateur (captures) */
const UA_APP = (() => {
  const u = navigator.userAgent || '';
  if (/LinkedInApp/.test(u)) return 'linkedin';
  if (/FBAN|FBAV/.test(u)) return 'facebook';
  if (/Instagram/.test(u)) return 'instagram';
  if (/Twitter/.test(u)) return 'twitter';
  if (/Android/.test(u) && /; wv\)/.test(u)) return 'webview-android';
  return '';
})();
/* Y9 (vingt-cinquième passe, 09/10/2026) : ?proto=2, sur téléphone et là où WebCodecs existe (Safari 16.4 et après, Chrome 94 et après,
   la vue web de LinkedIn) : le prototype v2, le film en vidéo décodée et dessinée sur un canevas (proto2.js) ; aucun module du film
   n'est demandé, ni la forme légère. Sans le paramètre, ou sans WebCodecs, rien ne change */
/* Y9 bis : ?proto=3, la v3 (proto3.js), mêmes conditions */
/* Y11 : ?proto=4, la v4 (proto3.js, flux de videos/v4/ : capture de la fenêtre composée, perspective vraie ; Y12, Y13), mêmes conditions */
/* Passe 26 (le gel, 12/10/2026), G1 : le lecteur vidéo (proto3.js, la v4) est le film du téléphone par défaut, sans paramètre : sur
   téléphone (TEL de memoire.js : la fenêtre ou l'écran sous 768 px, un iPhone en paysage compris), hors mouvement réduit (les trois
   tableaux figés restent), là où WebCodecs existe, navigateurs des applications compris ; le codec se décide ensuite par capacité
   (hevc, av1, h264, proto3.js). Une adresse d'essai (une des clés de commun/essais.js, l'interrupteur ouvert : maquette, copies de
   rendu) se lit comme avant le gel : ?proto=2, 3 ou 4 choisit un lecteur, ?proto=1 le tronçon vidéo du film, sinon le film en
   direct ; le harnais de rendu (?eco=0&hd=1, &arret, ?p) garde donc le film en direct à 393 et 430. En production, l'interrupteur
   fermé retire ces clés de l'adresse avant ce module : seule la règle par défaut reste */
const ESSAIS = window.ESSAIS === true;
/* G5 (D4) : diag.js, importé seulement en essai : sans ?diag=1 il lit le journal d'avant (encart si la fois d'avant s'est arrêtée net
   en mode diag) ; avec ?diag=1, lancer() l'attend avant de créer le moindre canevas. Il passe désormais après les modules importés
   par ce fichier : le signal d'arrêt net qu'il donnait à memoire.js (window.__diagArretNet) n'est plus lu à ce chargement, les
   témoins de memoire.js (sessionStorage et localStorage) disent la même chose */
const DIAG_PRET = ESSAIS ? import('./diag.js').catch(() => null) : null;
const ADRESSE_ESSAI = ESSAIS && Array.isArray(window.ESSAIS_CLES) && window.ESSAIS_CLES.some(k => Q.has(k));
const REDUIT = matchMedia('(prefers-reduced-motion: reduce)').matches || Q.get('mouvement') === 'reduit';
const WEBCODECS = typeof window.VideoDecoder === 'function' && typeof window.EncodedVideoChunk === 'function';
let LECTEUR = ADRESSE_ESSAI ? (Q.get('proto') === '2' || Q.get('proto') === '3' || Q.get('proto') === '4') && !Q.has('p') && innerWidth < 768 && WEBCODECS
  : TEL && !REDUIT && WEBCODECS;
/* D1 (validée le 11/10/2026) : ?film=1 n'est pas un crochet d'essai mais un paramètre de contrat, hors de la liste de commun/essais.js :
   posé par le bouton « Voir le film » (lienFilm), il bloque la forme légère quand la page est rouverte (repli Android compris) */
let LEGER = !LECTEUR && Q.get('film') !== '1' && (Q.get('leger') === '1' || !!UA_APP);
if (LEGER) document.documentElement.classList.add('leger');
/* Q5 (dix-septième passe, 07/10/2026) : le bouton menu et le tiroir des pages sur téléphone, comme sur Conseil et Atelier
   (commun/pages/pages.js, navigation) : il ouvre et ferme le tiroir, un lien choisi le ferme, Échap aussi */
(() => {
  const bouton = document.querySelector('.nav__menu'), tiroir = document.querySelector('.nav__tiroir');
  if (!bouton || !tiroir) return;
  const basculer = ouvrir => { tiroir.classList.toggle('ouvert', ouvrir); bouton.setAttribute('aria-expanded', String(ouvrir)); bouton.setAttribute('aria-label', ouvrir ? 'Fermer le menu' : 'Ouvrir le menu'); };
  bouton.addEventListener('click', e => { e.stopPropagation(); basculer(bouton.getAttribute('aria-expanded') !== 'true'); });
  tiroir.addEventListener('click', e => { e.stopPropagation(); if (e.target.closest('a')) basculer(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && tiroir.classList.contains('ouvert')) { e.stopPropagation(); basculer(false); bouton.focus(); } }, true);
})();
/* N1 (quatorzième passe) : avec ?mesure=1, le compte des canevas et des textures WebGL vivants (avant tout canevas) */
if (ESSAIS && Q.get('mesure') === '1') installerCompteur();   /* G5 : essais seulement */
const P_FIXE = Q.has('p') ? clamp(parseFloat(Q.get('p')) || 0) : null;
const ARRET = Q.has('arret') ? Math.max(1, Math.min(5, parseInt(Q.get('arret'), 10) || 1)) : 0;
if (P_FIXE !== null) document.documentElement.classList.add('fige');
/* L4 : le cartouche de mesure (images par seconde, image la plus longue, p, erreurs), seulement avec ?mesure=1 */
if (ESSAIS && Q.get('mesure') === '1') import('./mesure.js').then(m => m.installerMesure()).catch(() => {});   /* G5 (D4) : mesure.js ne part pas en production */
const filmEl = document.getElementById('film');
const sceneEl = filmEl.querySelector('[data-scene]');

/* P2 (seizième passe, 06/10/2026) : dans WebKit (Safari, et tous les navigateurs de l'iPhone), deux coûts tombaient sur
   l'apparition du téléphone et l'écriture de « Communiquer », hors de tout script de la page (mesuré, c16-p1-releve.json) :
   - 70 à 250 ms après la fin de la création, une ou deux images de 60 à 150 ms, quelle que soit l'image montrée (scène
     cachée comprise, sans décodage, sans entrée animée) : un travail interne du moteur après la création ;
   - la première image où la scène paraît (la peinture de tous ses calques) : 40 à 77 ms.
   Dans WebKit, la scène est donc rendue et peinte sous une copie de l'affiche, le temps que ce travail passe (450 ms au
   plus, 200 à 300 ms en général) ; l'affiche s'efface ensuite d'un coup (le compositeur seul). Chrome n'a ni l'un ni
   l'autre : rien ne change */
const WEBKIT = (() => { const u = navigator.userAgent; return (/AppleWebKit/.test(u) && !/Chrome|Chromium|Edg|Android/.test(u)) || /CriOS|FxiOS|EdgiOS/.test(u); })();
/* P2 : on attend, image par image, la longue image qui suit la création (60 à 150 ms, 70 à 160 ms après le premier rendu,
   mesuré), puis trois images normales ; au plus 450 ms. Le travail interne du moteur ne se voit pas d'un minuteur (le fil
   principal reste libre) : il retient les images, c'est donc elles qu'on regarde */
const laisserPasser = (max = 450) => new Promise(res => {
  const t0 = performance.now(); let der = 0, vu = false, bonnes = 0, fini = false;
  const finir = () => { if (fini) return; fini = true; window.__attenteAffiche = [Math.round(performance.now() - t0), vu]; res(); };
  const f = t => {
    if (fini) return;
    const dt = der ? t - der : 0, e = performance.now() - t0; der = t;
    if (dt > 50 && e > 20) { vu = true; bonnes = 0; } else if (dt && dt < 25) bonnes++;
    if ((vu && bonnes >= 3 && e > 120) || e > max) finir(); else requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
  /* (un onglet caché n'a pas d'images : l'affiche ne reste jamais plus d'une seconde) */
  setTimeout(finir, max + 550);
});
const imagesPretes = racine => Promise.all(Array.from(racine.querySelectorAll('img')).map(im => im.complete ? (im.decode ? im.decode().catch(() => {}) : null) : new Promise(r => { im.onload = im.onerror = r; })));

/* T3 (vingtième passe, 07/10/2026) : sur l'iPhone, le téléphone de la nuit paraissait 1,4 à 2,3 s après le chargement (la création
   du film, 1 à 1,5 s sur l'appareil, puis l'affiche tenue pendant le travail interne de WebKit). Sur téléphone, ouvert sur la
   nuit, une ébauche du téléphone (la photo du téléphone et son écran clair, sans la conversation) est posée dès que la page le
   peut (les polices et le manifeste lus), exactement à la place que le film lui donnera (la même pose, les mêmes calculs que
   poseNuit et telephone.poser) ; le film entier la remplace, dans la même image, quand il paraît : l'écran s'allume */
/* U1 (vingt et unième passe, 07/10/2026) : « avant que le texte apparaisse sur le smartphone de Marianne, il y a un petit
   smartphone avec un écran blanc, enfin beige [...] à chaque fois que je rafraîchis ». Mesuré sur l'iPhone (c21-iphone-demarrage.json,
   état d'avant, servi comme 8104) : l'ébauche de T3 (un écran beige vide sur l'affiche, cadrée autrement que le film) paraît à 0,39
   à 0,49 s, le film à 2,0 à 2,35 s ; pendant 1,6 à 1,9 s, un téléphone éteint, puis tout change d'un coup (l'écran, le cadrage du
   village, les étoiles et les fenêtres). Désormais, la première image est celle du film à p 0 : le vrai téléphone (le même élément
   que le film, telephone.js, creerTelephone) est créé tout de suite, posé par les mêmes fonctions que le film à sa première image
   (poseNuit, poserNuitMobile, conversation et état de l'écran à l'entrée : l'en-tête « Mairie de Villeneuve-les-Ormes », « En
   ligne, 24 h/24 », l'heure, le champ) ; la gravure du village (le cadre du fond, ses étoiles et ses fenêtres) est montrée au
   cadrage du film à p 0 (fond.js, dims et rendre : sur téléphone, le point à 79 % de la gravure au milieu de l'écran, toute sa
   hauteur). Le film adopte ensuite ce même téléphone (film.js, options.tel) : ses éléments passent dans la couche des porteurs à
   leur place, dans la même image que le film paraît ; rien ne change à l'écran. Seul le film qui s'anime (le verbe qui s'écrit, la
   question qui se tape, le rail) arrive ensuite, comme avant */
let EBAUCHE = !LEGER && !LECTEUR && innerWidth < 768 && P_FIXE === null && !REDUIT && !ARRET && scrollY <= 40 && Q.get('ebauche') !== '0';
if (!EBAUCHE && !LEGER && !LECTEUR) chargerFilm();   /* Y6 : la forme légère ne demande jamais le film */
const ebaucheTelephone = async () => {
  if (!EBAUCHE || scrollY > 40) return null;
  try {
    /* le sceau de l'en-tête de l'écran, demandé tout de suite : sinon sa requête (3 Ko) partait après celles des trente visuels du
       film et retardait la première image de 0,3 à 0,6 s sur l'iPhone (mesuré, réseau local) */
    const tU = window.__u1t = { debut: performance.now() };
    const sceau = new Image(); sceau.decoding = 'async'; sceau.src = '../commun/img/sceau-96.webp';
    const [vt, v34] = await Promise.all([visuel('telephone'), visuel('telephone-trois-quarts')]);
    if (!vt || !vt.reel) return null;
    tU.visuels = performance.now();
    /* les photos du téléphone sont là : les autres visuels du film se chargent pendant que l'ébauche se pose (le script du film,
       lui, attend qu'elle soit peinte) */
    NOMS_FILM.forEach(n => visuel(n));
    const W = sceneEl.clientWidth, H = sceneEl.clientHeight;
    /* comme film.js (mesurerCadre) : les blocs se posent sous la barre, le bas utile est au-dessus du rail */
    const nav = document.querySelector('header.nav'), navBas = nav ? Math.round(nav.getBoundingClientRect().bottom) : 0;
    document.documentElement.style.setProperty('--bloc-haut', (navBas + 8) + 'px');
    /* le rail tel que le film le mesurera (moteur.js mesure le cadre une fois le film prêt : « Continuer » affiché, le rail est plus
       haut ; sur un grand iPhone, le téléphone se pose sur le rail et monterait de 5 px) : mesuré avec « Continuer » affiché, le
       temps de la mesure (rien n'est peint entre les deux) */
    const b1 = sceneEl.querySelector('[data-bloc="1"]'), rail = document.querySelector('.rail'), cont = rail && rail.querySelector('.continuer');
    /* W1 (vingt-troisième passe, 08/10/2026) : « il y a marqué seulement "Mairie de Villeneuve-les-Ormes" sur un fond blanc, même pas
       "Communiquer", et une seconde plus tard, hop, "Communiquer" arrive [...] Il faut vraiment tomber tout de suite sur
       "Communiquer", "une mairie qui répond 24h/24" ». La première image est désormais l'image entière du film à p 0, son entrée
       finie : le bloc 1 est découpé ici comme le plan 1 le découpe (lettres du verbe, mots de la légende : le plan 1 adopte cette
       découpe au lieu de la refaire), posé dans l'état de l'entrée finie (le verbe écrit, la légende entière, le bouton), et
       mesuré après la découpe (le téléphone se pose sous lui, comme dans le film) ; le film le reprend tel quel, sans rejouer
       l'écriture des lettres (main.js, moteur.js : entrée faite) */
    const verbe1 = b1 && b1.querySelector('.verbe'), legende1 = b1 && b1.querySelector('.legende');
    if (verbe1 && legende1) {
      if (!verbe1.querySelector('.m')) decouperLettres(verbe1);
      if (!legende1.querySelector('.w')) decouperMots(legende1);
      lettres(verbe1, 1, 0); mots(legende1, 1, 0); setVar(b1, '--b', '1.000'); b1.classList.add('actif');
    }
    if (cont) cont.style.display = 'inline-flex';
    const r = rail && !rail.hidden ? rail.getBoundingClientRect() : null;
    if (cont) cont.style.display = '';
    const Fe = { W, H, mob: true, bloc1Bas: b1 ? b1.offsetTop + b1.offsetHeight : 0, basUtile: r && r.height ? Math.min(H, r.top) - 8 : H };
    const box = document.createElement('div'); box.setAttribute('aria-hidden', 'true');
    /* sans z-index propre : les éléments du téléphone se rangent dans la scène comme dans les porteurs (sous le grain, sur la gravure) */
    box.style.cssText = 'position:absolute;inset:0;pointer-events:none;visibility:hidden';
    sceneEl.appendChild(box);
    /* le téléphone du film, à sa première image (film.rendre(0, 0) : plan 1, p 0, entrée 0) */
    const tel = creerTelephone({ porteurs: box }, vt, v34);
    Fe.tel = tel;
    tel.debut();
    const { quad, ep } = poseNuit(Fe);
    poserNuitMobile(Fe, quad, ep, 0, 0);
    /* W1 : la conversation à p 0, l'entrée finie (plan 1 : p - (1 - entrée) x 0,022 = 0) : la question envoyée dans sa bulle, la
       réponse de Marianne qui s'écrit (ses trois points de frappe, animés par la feuille de style dès cette image) ; avant W1, -0,022 :
       le champ vide, l'état du tout début de l'entrée */
    tel.conversation(0, T);
    tel.etatEcran({ guide: 0, heure: 22 * 60 + 47 });
    tel.fin();
    tel._els = Array.from(box.children);
    tU.cree = performance.now();
    /* la gravure du village au cadrage du film à p 0 (fond.js : dims, puis rendre à p 0 ; caméra au repos, échelle 1) */
    const cadre = sceneEl.querySelector('[data-cadre]'), fond = sceneEl.querySelector('[data-fond]');
    if (cadre) {
      const fw = Math.max(W, H * 1.8512), fh = fw / 1.8512, x = W * .5 - .79 * fw, y = (H - fh) / 2;
      cadre.style.setProperty('--fw', fw + 'px'); cadre.style.setProperty('--fh', fh + 'px');
      cadre.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(1.00000)`;
      /* l'affiche (la même gravure, déjà décodée pour elle) passe au même cadrage, sous le cadre : rien ne bouge si la gravure du
         cadre n'est pas encore peinte */
      if (fond) fond.style.background = `#0b1030 url(../commun/img/village-nuit.webp) ${x.toFixed(2)}px ${y.toFixed(2)}px/${fw.toFixed(2)}px ${fh.toFixed(2)}px no-repeat`;
    }
    /* le grain de papier commun, par-dessus toute la scène (le même que film.js : même tuile, même tirage) */
    const grain = sceneEl.querySelector('[data-grain]');
    if (grain) {
      const c = document.createElement('canvas'); c.width = c.height = 180; const g = c.getContext('2d'), R = rng(8), im = g.createImageData(180, 180);
      for (let i = 0; i < im.data.length; i += 4) { const v = R(); im.data[i] = 40; im.data[i + 1] = 44; im.data[i + 2] = 80; im.data[i + 3] = v > .5 ? (v - .5) * 170 : 0; }
      g.putImageData(im, 0, 0); grain.style.backgroundImage = `url(${c.toDataURL()})`;
      grain.style.opacity = '0.045';   /* film.js à p 0 */
    }
    /* l'image paraît entière : la photo du téléphone et le sceau de l'en-tête décodés (la gravure : voir l'affiche, plus haut) */
    const imgs = [box.querySelector('.tel-support'), box.querySelector('.tete--mairie img')].filter(Boolean);
    tU.grain = performance.now();
    await Promise.all(imgs.map(im => (im.decode ? im.decode().catch(() => {}) : null)));
    tU.decode = performance.now();
    box.style.visibility = '';
    if (cadre) cadre.style.visibility = 'visible';
    if (grain) grain.style.visibility = 'visible';
    /* W1 : le bloc 1 et son voile (le film à p 0, l'entrée finie : opacité 1), visibles avant le film (la feuille de style les
       cache tant que le film n'est pas prêt) */
    const voile1 = sceneEl.querySelector('[data-voile1]');
    /* W1 : le bouton bleu de la barre prend dès cette image la largeur que le film lui donnera (bouton.js : sa largeur arrondie au
       pixel supérieur, son libellé centré) : il ne glisse plus d'un demi-pixel quand le film prend la main */
    const cta = document.querySelector('header.nav .nav__cta');
    if (cta && !cta.style.width) { cta.style.width = Math.ceil(cta.getBoundingClientRect().width) + 'px'; cta.style.justifyContent = 'center'; }
    if (voile1) { setO(voile1, 1); voile1.style.visibility = 'visible'; }
    if (b1 && verbe1) b1.style.visibility = 'visible';
    window.__ebauche = performance.now();
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__u1peinte = performance.now(); }));
    return { box, tel, cadre, grain, fond, b1: verbe1 ? b1 : null, voile1 };
  } catch (err) { return null; }
};
/* U1 : le film adopte le téléphone de l'ébauche (ses éléments vont à la place que creerTelephone leur aurait donnée dans les
   porteurs, marquée par film.js) ; la gravure reprend sa visibilité de la feuille de style (le film la règle ensuite) */
const adopterEbauche = eb => {
  if (!eb) return;
  const a = eb.tel._ancre;
  /* W1 : un élément retiré puis remis dans la page relance ses animations de la feuille de style depuis leur début : les trois points
     de frappe de la réponse (et tout ce qui s'anime dans l'écran) sauteraient quand le film prend la main. Leur temps est relevé
     avant le déplacement et rendu aux animations relancées, dans la même tâche (rien n'est peint entre les deux) : elles
     continuent sans saut */
  const anims = (document.getAnimations ? document.getAnimations() : []).filter(an => an.effect && an.effect.target && eb.box.contains(an.effect.target) && an.animationName)
    .map(an => [an.effect.target, an.animationName, an.currentTime]);
  if (a && a.parentNode) { eb.tel._els.forEach(e => a.before(e)); a.remove(); }
  anims.forEach(([cible, nom, t]) => { if (t === null) return; (cible.getAnimations ? cible.getAnimations() : []).forEach(an => { if (an.animationName === nom) { try { an.currentTime = t; } catch (e) { /* rien */ } } }); });
  eb.box.remove();
  if (eb.cadre) eb.cadre.style.visibility = '';
  if (eb.grain) eb.grain.style.visibility = '';
  if (eb.fond) eb.fond.style.background = '';
  /* W1 : le bloc 1 et son voile rendus au film (sa visibilité, la même, est réglée par le plan 1 dès sa première image) */
  if (eb.b1) eb.b1.style.visibility = '';
  if (eb.voile1) eb.voile1.style.visibility = '';
};

/* Y6 : la forme légère. La première image du film, posée par les mêmes fonctions que le film (le téléphone de telephone.js, poseNuit,
   poserNuitMobile, la conversation à l'arrêt 1 : la réponse de Marianne entière, la source citée), la gravure de nuit au cadrage du
   film à cet instant, le bloc « Communiquer » écrit, le grain ; rien ne s'anime (la feuille de style arrête les animations de la scène
   en forme légère). Ni canevas (le grain est peint une fois en image puis le canevas est vidé), ni WebGL, ni lavis, ni visuel du
   monde : seules les deux photos du téléphone (la seconde sur ordinateur), le sceau de l'écran et la gravure de nuit. Les calques
   flous du téléphone (l'ombre, le reflet), immobiles ici, sont posés plus petits et agrandis par la transformation : même image,
   neuf et quatre fois moins de mémoire ; les éléments du téléphone qui ne se voient pas sont retirés du rendu */
const LEGER_P = ARRETS[0].p;   /* l'arrêt 1 (p 0,183) : la conversation entière, le verbe encore là */
const PLATEFORME = (() => {
  const q = Q.get('plateforme'); if (q === 'ios' || q === 'android') return q;
  const u = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(u)) return 'android';
  return '';
})();
/* la même page, film entier : Safari (iOS) ou Chrome (Android) depuis l'application ; ailleurs, un lien simple */
const lienFilm = () => {
  const u = new URL(location.href); u.searchParams.delete('leger'); u.searchParams.delete('plateforme'); u.searchParams.set('film', '1'); u.hash = '';
  const simple = u.href;
  if (UA_APP && PLATEFORME === 'ios') return { href: 'x-safari-' + simple, simple };
  if (UA_APP && PLATEFORME === 'android') return { href: 'intent://' + u.host + u.pathname + u.search + '#Intent;scheme=' + u.protocol.replace(':', '') + ';package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(simple) + ';end', simple, android: true };
  return { href: simple, simple };
};
/* passe 28, point 4 (avis DAJF du 13/10/2026, condition 2) : rien n'est poussé tant que GTM n'est pas chargé (window.__civikGtmLoaded :
   le visiteur a accepté la mesure dans le bandeau, cookie-consent.js) ; sinon un objet poussé avant le choix était rejoué par GTM à
   l'accord. Vaut pour film_leger et film_leger_voir */
const pousser = o => { try { if (window.__civikGtmLoaded !== true) return; (window.dataLayer = window.dataLayer || []).push(o); } catch (e) { /* rien */ } };
/* les trois points du menu de l'application, dessinés à la plume (le trait des réseaux du pied) : couchés sur iOS, debout sur Android */
const POINTS = v => (v
  ? '<svg class="v" viewBox="0 0 16 24" aria-hidden="true" focusable="false"><path d="M3.1 6.4L3.2 17.6Q3.4 21.6 8.1 21.7Q12.7 21.5 12.9 17.4L12.8 6.2Q12.6 2.4 8 2.3Q3.3 2.5 3.2 6.9"/><path d="M8 7.3a1 1 0 1 0 .3 .1M8.1 11.9a1 1 0 1 0 .3 .1M7.9 16.5a1 1 0 1 0 .3 .1" class="pt"/></svg>'
  : '<svg viewBox="0 0 30 18" aria-hidden="true" focusable="false"><path d="M6.2 3.1L23.9 2.9Q28.6 3.2 28.7 9.1Q28.5 14.9 23.6 15.1L6 15.2Q1.4 14.8 1.3 8.8Q1.6 3.2 6.9 3.3"/><path d="M8.8 9.1a1 1 0 1 0 .3 .1M15 9a1 1 0 1 0 .3 .1M21.2 8.9a1 1 0 1 0 .3 .1" class="pt"/></svg>');
const LIRE = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4.5 2.8v10.4L13 8z" fill="currentColor"/></svg>';
let LEGER_LANCEE = false;
async function formeLegere() {
  LEGER_LANCEE = true;
  const racine = document.documentElement, t0 = performance.now();
  const rail = document.querySelector('.rail'), cmd = document.querySelector('.commandes');
  if (rail) rail.hidden = true;
  if (cmd) cmd.hidden = true;
  const mob = innerWidth < 768;
  /* le bouton « Voir le film » et la phrase d'aide, en bas de l'image, entre elle et les cartes */
  const L = lienFilm();
  const voir = document.createElement('div'); voir.className = 'leger-voir';
  const bouton = document.createElement('a'); bouton.className = 'btn btn--plein leger-voir__btn'; bouton.href = L.href;
  bouton.innerHTML = LIRE + '<span>Voir le film</span>';
  voir.appendChild(bouton);
  if (PLATEFORME) {
    const aide = document.createElement('p'); aide.className = 'leger-voir__aide';
    aide.innerHTML = `ou touchez ${POINTS(PLATEFORME === 'android')}<span class="sr">le bouton aux trois points</span> puis Ouvrir dans ${PLATEFORME === 'android' ? 'Chrome' : 'Safari'}`;
    voir.appendChild(aide);
  }
  bouton.addEventListener('click', () => {
    pousser({ event: 'film_leger_voir', film_leger_origine: UA_APP || 'force' });
    /* Android : si l'application ne passe pas la main à Chrome (la page reste visible), le lien simple */
    if (L.android) setTimeout(() => { if (document.visibilityState === 'visible') location.href = L.simple; }, 1600);
  });
  sceneEl.appendChild(voir);
  try { document.fonts && document.fonts.load('500 21px Caveat').catch(() => {}); } catch (e) { /* rien */ }
  const sceau = new Image(); sceau.decoding = 'async'; sceau.src = '../commun/img/sceau-96.webp';
  const [vt, v34] = await Promise.all([visuel('telephone'), mob ? null : visuel('telephone-trois-quarts')]).catch(() => [null, null]);
  const b1 = sceneEl.querySelector('[data-bloc="1"]'), verbe1 = b1 && b1.querySelector('.verbe'), legende1 = b1 && b1.querySelector('.legende');
  if (verbe1 && legende1) {
    decouperLettres(verbe1); decouperMots(legende1);
    lettres(verbe1, 1, 0); mots(legende1, 1, 0); setVar(b1, '--b', '1.000'); b1.classList.add('actif');
  }
  const cadre = sceneEl.querySelector('[data-cadre]'), fond = sceneEl.querySelector('[data-fond]'), nuit = cadre && cadre.querySelector('[data-nuit]');
  let box = null, tel = null;
  if (vt && vt.reel) {
    box = document.createElement('div'); box.className = 'leger-tel'; box.setAttribute('aria-hidden', 'true'); box.inert = true;
    box.style.cssText = 'position:absolute;inset:0;pointer-events:none;visibility:hidden';
    sceneEl.appendChild(box);
    tel = creerTelephone({ porteurs: box }, vt, v34 && v34.reel ? v34 : null);
  }
  let cielHaut = null;
  /* la pose (à nouveau si la largeur change : rotation de l'écran) */
  const poser = () => {
    sceneEl.style.height = '';
    const W = sceneEl.clientWidth;
    let H = sceneEl.clientHeight;
    const nav = document.querySelector('header.nav'), navBas = nav ? Math.round(nav.getBoundingClientRect().bottom) : 0;
    if (mob) racine.style.setProperty('--bloc-haut', (navBas + 8) + 'px'); else racine.style.removeProperty('--bloc-haut');
    const bloc1Bas = b1 ? b1.offsetTop + b1.offsetHeight : 0;
    /* sur téléphone, le téléphone se pose entre le bloc « Communiquer » et le bouton, sans passer dessous : la largeur du film
       (72 % de l'écran, 300 px au plus) si la place y est, sinon plus petit, jusqu'à 470 px de haut ; plus bas encore (un écran
       court, les barres de l'application dépliées), l'image s'allonge et le bouton passe juste sous le pli */
    let poseMob = null;
    if (mob) {
      const haut = bloc1Bas + 12, zone = voir.offsetHeight, w0 = Math.min(W * .72, 300), h0 = w0 / .486, hMin = Math.min(h0, 470);
      const hP = Math.max(hMin, Math.min(h0, H - zone + 6 - haut));
      if (haut + hP + zone - 6 > H) { H = Math.ceil(haut + hP + zone - 6); sceneEl.style.height = H + 'px'; }
      const top = Math.max(haut, H - zone + 6 - hP - Math.max(0, (H - zone + 6 - hP - haut) * .5));
      poseMob = pose3d({ cx: W / 2, cy: top + hP / 2, h: hP, rx: 1.5, ry: -5, rz: 0, f: 2400 });
    }
    const basUtile = H - voir.offsetHeight + 8;
    if (tel) {
      const Fe = { W, H, mob, tel, bloc1Bas, basUtile };
      tel.debut();
      const { quad, ep } = poseMob || poseNuit(Fe);
      if (mob) poserNuitMobile(Fe, quad, ep, LEGER_P, 0);
      else if (tel.a34) tel.poser34({ cx: (quad[0][0] + quad[2][0]) / 2, cy: (quad[0][1] + quad[2][1]) / 2, h: Math.hypot(quad[3][0] - quad[0][0], quad[3][1] - quad[0][1]), k: 1 });
      else tel.poser({ quad, ep, z: 30, ombre: { dx: 30, dy: 40, op: .42 }, glisse: .45, reflet: 1 });
      tel.conversation(LEGER_P, T);
      /* sur téléphone, la réponse entière et sa source au-dessus du champ : sinon, le texte de l'écran un peu plus petit (3 % par pas,
         trois pas au plus) */
      if (mob) {
        const e = tel.ecran, s = e.querySelectorAll('.source'), src = s[s.length - 1], champ = e.querySelector('.tel__champ');
        for (let i = 0; i < 3 && src && champ && src.getBoundingClientRect().bottom > champ.getBoundingClientRect().top - 4; i++) {
          tel.modeMobile({ taille: parseFloat(e.style.fontSize) * .97, cache: 0 }); tel.conversation(LEGER_P, T);
        }
      }
      tel.etatEcran({ guide: 0, heure: 22 * 60 + 47 });
      tel.fin();
      /* ce qui ne se voit pas sort du rendu (la visibilité et l'opacité posées par le téléphone) ; l'ombre (floue), le reflet (un dégradé)
         et la tranche (des aplats arrondis) immobiles : plus petits, agrandis par la transformation ; de la tranche, trois lamelles sur
         neuf (le tiers, les deux tiers et toute l'épaisseur : leur réunion dessine le même bord) */
      const tranches = Array.from(box.querySelectorAll('.tel-tranche'));
      Array.from(box.children).forEach(e => {
        e.style.display = '';
        const it = tranches.indexOf(e);
        if (e.style.visibility === 'hidden' || +(e.style.opacity || 1) === 0 || (it >= 0 && tranches.length > 3 && it % 3 !== 2)) { e.style.display = 'none'; return; }
        const K = e.classList.contains('tel-ombre') || it >= 0 ? 3 : e.classList.contains('tel-reflet') ? 2 : 1;
        if (K > 1 && e.style.transform) {
          if (!e._legerT) { e._legerT = 1; e._w = parseFloat(e.style.width); e._h = parseFloat(e.style.height); }
          e.style.width = (e._w / K) + 'px'; e.style.height = (e._h / K) + 'px';
          /* l'ombre portée (son flou et son étalement) suit la réduction */
          if (e.classList.contains('tel-ombre')) { if (!e._bs) e._bs = getComputedStyle(e).boxShadow; e.style.boxShadow = e._bs.replace(/(-?[\d.]+)px/g, (m, v) => (v / K).toFixed(2) + 'px'); }
          e.style.transform = e.style.transform.replace(/ scale\([^)]*\)$/, '') + ` scale(${K})`;
        }
      });
    }
    /* la gravure de nuit au cadrage du film à l'arrêt 1 (fond.js : la caméra n'a pas encore bougé, échelle 1) */
    if (cadre) {
      const fw = Math.max(W, H * 1.8512), fh = fw / 1.8512, lune = !mob && W / H >= 1.65 && W / H <= 1.8512;
      const x = mob ? W * .5 - .79 * fw : (W - fw) * .78, y = (H - fh) / 2 + (lune ? fh * .09581 : 0);
      cadre.style.setProperty('--fw', fw + 'px'); cadre.style.setProperty('--fh', fh + 'px');
      cadre.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px)`;
      if (lune && !cielHaut && nuit) { cielHaut = document.createElement('div'); cielHaut.className = 'ciel-haut ciel-haut--nuit'; cielHaut.setAttribute('aria-hidden', 'true'); nuit.after(cielHaut); }
      if (cielHaut) cielHaut.style.display = lune ? '' : 'none';
      if (fond) fond.style.background = `#0b1030 url(../commun/img/village-nuit.webp) ${x.toFixed(2)}px ${y.toFixed(2)}px/${fw.toFixed(2)}px ${fh.toFixed(2)}px no-repeat`;
    }
  };
  poser();
  /* le grain de papier commun (le même que film.js : même tuile, même tirage), peint une fois en image ; le canevas est vidé */
  const grain = sceneEl.querySelector('[data-grain]');
  if (grain) {
    const c = document.createElement('canvas'); c.width = c.height = 180; const g = c.getContext('2d'), R = rng(8), im = g.createImageData(180, 180);
    for (let i = 0; i < im.data.length; i += 4) { const v = R(); im.data[i] = 40; im.data[i + 1] = 44; im.data[i + 2] = 80; im.data[i + 3] = v > .5 ? (v - .5) * 170 : 0; }
    g.putImageData(im, 0, 0); grain.style.backgroundImage = `url(${c.toDataURL()})`; c.width = c.height = 0;
    grain.style.opacity = '0.045';
  }
  /* l'image paraît entière : la photo du téléphone, le sceau de l'en-tête et la gravure décodés (2,5 s au plus) */
  const imgs = [box && box.querySelector('.tel-support'), box && box.querySelector('.tete--mairie img'), nuit].filter(Boolean);
  await Promise.race([Promise.all(imgs.map(im => (im.decode ? im.decode().catch(() => {}) : null))), new Promise(r => setTimeout(r, 2500))]);
  if (box) box.style.visibility = '';
  if (cadre) cadre.style.visibility = 'visible';
  if (grain) grain.style.visibility = 'visible';
  const voile1 = sceneEl.querySelector('[data-voile1]');
  if (voile1) { setO(voile1, 1); voile1.style.visibility = 'visible'; }
  if (b1) b1.style.visibility = 'visible';
  racine.classList.add('leger-pret');
  let largeur = innerWidth;
  addEventListener('resize', () => { if (innerWidth === largeur) return; largeur = innerWidth; requestAnimationFrame(poser); });
  pousser({ event: 'film_leger', film_leger_origine: UA_APP || 'force' });
  window.__leger = { origine: UA_APP || 'force', plateforme: PLATEFORME, lien: L.href, ms: Math.round(performance.now() - t0) };
  racine.dataset.pret = '1';
}

let PRIS = false;   /* G5 (D2) : le film ou le lecteur a pris la main (moteur démarré, lecteur installé) */
async function lancer() {
  if (DIAG_PRET && Q.get('diag') === '1') await DIAG_PRET;
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  /* Y6 : la forme légère, à la place du film (rien du film n'est demandé) */
  if (LEGER) { await formeLegere(); return; }
  /* Y9 : le prototype v2, à la place du film */
  /* passe 26 (G1) : proto3.js (la v4) par défaut ; proto2.js seulement pour une adresse d'essai ?proto=2 */
  /* passe 26 (G2) : le lecteur qui ne peut pas partir rend false ; on poursuit ici, sans recharger la page : la forme légère dans le
     navigateur d'une application (sauf ?film=1, le bouton « Voir le film »), le film en direct ailleurs, comme sans lecteur */
  if (LECTEUR) {
    const m = await (ADRESSE_ESSAI && Q.get('proto') === '2' ? import('./proto2.js') : import('./proto3.js'));   /* Y11 : 4 */
    if (await m.installer() !== false) { PRIS = true; return; }
    LECTEUR = false;
    LEGER = Q.get('film') !== '1' && (Q.get('leger') === '1' || !!UA_APP);
    if (LEGER) { document.documentElement.classList.add('leger'); await formeLegere(); return; }
    EBAUCHE = innerWidth < 768 && P_FIXE === null && !REDUIT && !ARRET && scrollY <= 40 && Q.get('ebauche') !== '0';
    if (!EBAUCHE) chargerFilm();
  }
  /* T3 : l'ébauche du téléphone part tout de suite, en parallèle de la création du film */
  const ebauche = ebaucheTelephone();
  if (REDUIT && P_FIXE === null) {
    /* mouvement réduit : pas de film, les trois tableaux figés l'un sous l'autre */
    filmEl.classList.add('film--fixe');
    document.querySelector('.rail').hidden = true;
    document.querySelector('.commandes').hidden = true;
    const modele = sceneEl.cloneNode(true);
    const scenes = [sceneEl, modele.cloneNode(true), modele.cloneNode(true)];
    scenes.slice(1).forEach(s => filmEl.appendChild(s));
    const P3 = [.182, .588, .929], noms = ['Communiquer', 'Conseiller', 'Créer'];
    const { creerFilm } = await chargerFilm();
    for (let i = 0; i < 3; i++) {
      scenes[i].setAttribute('aria-label', noms[i]);
      const f = await creerFilm(scenes[i], { fixe: true });
      f.dims(); f.rendre(P3[i], 1, 3.2);
      await imagesPretes(scenes[i]); f.rendre(P3[i], 1, 3.2);
    }
    document.documentElement.classList.add('film-pret');
    document.documentElement.dataset.pret = '1';
    return;
  }
  /* T3 : l'ébauche peinte (deux images) avant la partie lourde de la création ; 600 ms au plus */
  /* U1 : plus de limite de 600 ms comptée depuis le début (mesuré sur l'iPhone : quand l'ébauche tardait, la création partait
     avant elle et la retardait encore) : le film n'est demandé, et sa création ne commence, qu'une fois la première image du
     téléphone peinte (deux images après sa pose) ; 2,5 s au plus, au cas où */
  const peinte = ebauche.then(b => (b ? new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))) : null));
  const peinteOuDelai = Promise.race([peinte, new Promise(r => setTimeout(r, 2500))]);
  /* U1 : le film reçoit l'ébauche (une promesse : il l'attend au moment de créer le téléphone) et adopte son téléphone */
  /* U1 : ?u1tenir=ms (essais seulement) retient le film ce temps après l'ébauche, pour la comparer au film à p 0 */
  const tenir = Math.min(10000, +Q.get('u1tenir') || 0);
  const avant = peinteOuDelai.then(() => (tenir ? new Promise(r => setTimeout(r, tenir)) : null));
  await peinteOuDelai;
  const { creerFilm } = await chargerFilm();
  const film = await creerFilm(sceneEl, { avant, ebauche });
  const eb = film.F.ebauche || null;
  /* U1 : le film prêt avant sa première mesure du cadre (le rail avec « Continuer », comme l'ébauche l'a mesuré) */
  if (eb) { adopterEbauche(eb); document.documentElement.classList.add('film-pret'); }
  film.dims();
  /* W1 : l'ébauche adoptée, le film paraît à p 0 l'entrée finie (intro 1), exactement l'image déjà montrée */
  film.rendre(P_FIXE !== null ? P_FIXE : 0, P_FIXE !== null || eb ? 1 : 0, 3.2);
  /* P2 : WebKit, la scène se peint sous une copie de l'affiche (même image, même cadrage que html:not(.film-pret) .fond),
     le temps que passe le travail qui suit la création, puis l'affiche s'efface */
  /* U1 : avec le téléphone adopté, pas d'affiche (elle couvrirait le téléphone déjà là) : la scène est rendue à p 0, telle que
     l'ébauche la montrait ; le travail interne de WebKit passe (laisserPasser) avant que l'entrée s'anime */
  if (WEBKIT && P_FIXE === null && eb) {
    document.documentElement.classList.add('film-pret');
    await laisserPasser();
    film.rendre(0, 1, 3.2);   /* W1 : l'entrée finie */
    window.__revele = performance.now();
  } else if (WEBKIT && P_FIXE === null) {
    const affiche = document.createElement('div'); affiche.setAttribute('aria-hidden', 'true');
    affiche.style.cssText = 'position:absolute;inset:0;z-index:99;pointer-events:none;background:#0b1030 url(../commun/img/village-nuit.webp) 62% 40%/cover no-repeat';
    /* Q6 (dix-septième passe) : la copie reprend le fond de l'affiche tel que la feuille de style le pose (sur un écran large,
       le cadrage de la lune entière, film.css) ; ailleurs, c'est la même valeur qu'avant */
    try { const cs = getComputedStyle(sceneEl.querySelector('[data-fond]')); if (cs.backgroundImage && cs.backgroundImage !== 'none') ['backgroundColor', 'backgroundImage', 'backgroundPosition', 'backgroundSize', 'backgroundRepeat'].forEach(k => { affiche.style[k] = cs[k]; }); } catch (e) { /* la valeur d'avant */ }
    sceneEl.appendChild(affiche);
    document.documentElement.classList.add('film-pret');
    await laisserPasser();
    film.rendre(0, 0, 3.2);
    await new Promise(r => { requestAnimationFrame(() => requestAnimationFrame(r)); setTimeout(r, 120); });
    affiche.remove(); window.__revele = performance.now();
  }
  document.documentElement.classList.add('film-pret');
  if (P_FIXE !== null) {
    film.rendre(P_FIXE, 1, 3.2);
    await imagesPretes(sceneEl);
    await ecritureReelle();
    film.dims(); film.rendre(P_FIXE, 1, 3.2);
    requestAnimationFrame(() => { film.rendre(P_FIXE, 1, 3.2); document.documentElement.dataset.pret = '1'; });
  }
  chargerFilm(); const { demarrerMoteur } = await modMoteur;
  /* W1 : avec l'ébauche adoptée, l'entrée (le verbe qui s'écrit, la question tapée) est déjà faite : le moteur ne la rejoue pas */
  PRIS = true;
  demarrerMoteur(film, { filmEl, P_FIXE, ARRET, LECTURE_AUTO: Q.get('lecture') === '1', ENTREE_FAITE: !!eb });
  /* Y8 (vingt-cinquième passe) : ?proto=1, sur téléphone, le tronçon du CV au dessin en vidéo (proto-video.js) ; sans le paramètre, rien */
  if (ADRESSE_ESSAI && Q.get('proto') === '1' && film.F.mob && P_FIXE === null) import('./proto-video.js').then(m => m.installer()).catch(() => {});   /* passe 26 : essais seulement */
  /* U1 : hors de WebKit aussi, le téléphone de l'ébauche est adopté (plus rien à retirer) */
  if (!WEBKIT && eb) window.__revele = performance.now();
  if (P_FIXE === null) { await imagesPretes(sceneEl); document.documentElement.dataset.pret = '1'; }
}
lancer().catch(err => {
  document.documentElement.setAttribute('data-erreur', String(err && err.stack || err));
  /* D2 (validée le 11/10/2026) : la pile d'erreur en rouge à l'écran seulement en essai (interrupteur ouvert) ; chez le visiteur, un
     avertissement dans la console et, si ni le film ni le lecteur n'ont pris la main, la forme légère à la place, sans recharger */
  if (ESSAIS) {
    const d = document.createElement('pre'); d.style.cssText = 'position:fixed;left:10px;top:80px;z-index:999;background:#fff;color:#c00;padding:10px;font:12px monospace;max-width:90vw;white-space:pre-wrap';
    d.textContent = String(err && err.stack || err); document.body.appendChild(d);
    return;
  }
  console.warn('Civik-ia, le film : repli sur la forme légère', err);
  if (PRIS || LEGER_LANCEE) return;
  const r = document.documentElement; r.classList.remove('film-pret', 'proto2', 'proto3', 'fige'); r.classList.add('leger');
  formeLegere().catch(e => console.warn('Civik-ia, le film : forme légère impossible', e));
});
