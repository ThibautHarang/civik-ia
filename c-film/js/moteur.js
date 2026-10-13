/* =====================================================================
   Le moteur : une seule valeur p (0 à 1), déduite du défilement natif et
   lissée (0,08 par image, arrêt sous 0,001 d'écart). Tout le film se
   déduit de p : remonter rejoue à l'envers.
   - ?p=0.42 fige la scène ; ?arret=1 à 5 ouvre la page posée sur un arrêt ;
     ?lecture=1 lance le film d'une traite.
   - Avancer sans molette : cinq arrêts ; à chaque arrêt, un objet de la
     scène (un vrai bouton) joue le tronçon suivant en faisant défiler la
     page, à la vitesse du film. Tout geste de défilement, tout appui ou
     Échap rend la main.
   ===================================================================== */
import { clamp, lerp, eEntree, setO, setT, setV } from './outils.js';
import { CHAPITRES, ARRETS, tempsDe, pDe, boutonDe, verbeDuBouton } from './temps.js';
import { son } from './son.js';
import { TEL, VUE, lectureReussie } from './memoire.js';   /* X2 : lectureReussie */
import { creerBoutonChapitre } from './bouton.js';
/* P2 (seizième passe) : la fenêtre de l'ouverture des préparations de fond (lavis.js) */
import { ouverture, finOuverture, signalerImage, geste } from './lavis.js';

export function demarrerMoteur(film, opts) {
  const { filmEl, P_FIXE, ARRET, LECTURE_AUTO } = opts;
  /* W1 (vingt-troisième passe, 08/10/2026) : sur téléphone, la première image montre déjà le film à p 0, son entrée finie (le verbe
     écrit, la question envoyée, les points de frappe) : l'entrée ne se rejoue pas quand le film prend la main ; elle se rejoue
     comme avant au « Revoir le film » */
  let entreeFaite = !!opts.ENTREE_FAITE;
  const rail = document.querySelector('.rail');
  const boutonsChap = Array.from(rail.querySelectorAll('[data-chap]'));
  const fils = Array.from(rail.querySelectorAll('[data-fil]'));
  const lecteur = document.querySelector('[data-lecture]'), lecteurTxt = document.querySelector('[data-lecture-txt]');
  const continuerB = document.querySelector('[data-continuer]');
  const invite = film.F.scene.querySelector('[data-invite]');
  /* Q2 (dix-septième passe, 07/10/2026) : « Cliquez pour avancer » à la souris, « Touchez pour avancer » au doigt */
  if (invite) invite.textContent = matchMedia('(pointer: coarse)').matches ? 'Touchez pour avancer' : 'Cliquez pour avancer';
  /* M7, M5 (treizième passe) : sur iPhone, les barres de Safari se replient et reviennent pendant le défilement : la hauteur
     de la fenêtre change (et un événement « resize » part). La course du film se mesure sur la grande hauteur (100lvh, la
     fenêtre barres repliées), stable : p ne saute plus quand les barres bougent. Sur ordinateur, c'est la même chose
     qu'avant (la grande hauteur y est la hauteur de la fenêtre). */
  const sondeH = document.createElement('div'); sondeH.setAttribute('aria-hidden', 'true');
  sondeH.style.cssText = 'position:absolute;left:0;top:0;width:1px;height:100vh;height:100lvh;visibility:hidden;pointer-events:none';
  document.body.appendChild(sondeH);
  let hRef = 0;
  const majRef = () => { hRef = Math.max(innerHeight, sondeH.offsetHeight || 0); };
  majRef();
  const haut = () => filmEl.offsetTop, course = () => Math.max(1, filmEl.offsetHeight - (hRef || innerHeight));
  const mesure = () => clamp(-filmEl.getBoundingClientRect().top / course());
  /* X1 : un saut (chapitre du rail, lecture, Continuer, Revoir le film) lève d'abord la porte de l'atelier (plus bas) */
  const allerA = p => { if (porte && porte.armee()) porte.lever('saut'); scrollTo({ top: haut() + clamp(p) * course(), behavior: 'instant' }); };
  let porte = null;

  let pCible = 0, pVue = 0, boucle = 0, dernier = 0, introDebut = performance.now(), pSon = 0;
  let pPose = null;   /* V2 : le p que le jeu vient de poser par le défilement (cette image) */
  /* T1 (vingtième passe, 07/10/2026) : à la molette et au pavé tactile, le film rattrapait chaque cran en 465 ms (le lissage de
     0,08 par image : 90 % de l'écart en 28 images), mesuré dans Chrome et dans le moteur de Safari ; c'est le retard que
     Thibaut sentait. Quand l'entrée est la molette (un événement de molette depuis moins de 650 ms), p suit le défilement par un
     ressort amorti au plus juste (aucun dépassement, aucun rebond), de temps caractéristique 85 ms : un cran est rattrapé à
     90 % en 165 ms environ ; sa vitesse est continue (elle part de celle du film au moment du cran), le film glisse d'un cran
     à l'autre sans à-coup. La lecture, les arrêts, le doigt et la barre de défilement gardent le lissage d'avant */
  const T_RESSORT = .085, FENETRE_MOLETTE = 650;
  let tMolette = -1e9, ressortActif = false, vRessort = 0, vVue = 0;
  addEventListener('wheel', () => { tMolette = performance.now(); }, { passive: true, capture: true });
  /* le ressort amorti au plus juste (la forme classique de « smooth damp ») : position et vitesse vers la cible, sans la dépasser */
  const ressort = (x, cible, v, dt) => {
    const w = 2 / T_RESSORT, a = w * dt, e = 1 / (1 + a + .48 * a * a + .235 * a * a * a), d = x - cible, tmp = (v + w * d) * dt;
    let v2 = (v - w * tmp) * e, x2 = cible + (d + tmp) * e;
    if ((cible - x > 0) === (x2 > cible)) { x2 = cible; v2 = 0; }
    return [x2, v2];
  };
  /* la parallaxe à la souris : ordinateur seulement (souris fine qui survole), jamais en mouvement réduit ;
     elle se retire pendant le défilement et revient doucement quand la page s'arrête */
  const parallaxeOk = P_FIXE === null && matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let souris = [0, 0], dernierDefil = 0;
  if (parallaxeOk) addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; souris = [clamp(e.clientX / innerWidth * 2 - 1, -1, 1), clamp(e.clientY / innerHeight * 2 - 1, -1, 1)]; demander(); }, { passive: true });
  let jeu = null;                 /* tronçon joué : { p0, p1, t0, duree, fin } */
  let premierGeste = false, attenteDepuis = performance.now();
  const intro = () => (P_FIXE !== null || ARRET || entreeFaite) ? 1 : clamp((performance.now() - introDebut) / 1600);   /* W1 : entreeFaite */

  /* N7 (quatorzième passe) : le bouton de la barre suit le chapitre */
  const bouton = film.F.bouton = creerBoutonChapitre();
  /* O1 (quinzième passe) : il change à l'instant où le verbe commence à s'écrire (temps.js, boutonDe), dans la même image
     que la première lettre ; sa transition dure le temps que met cette première lettre à finir de monter (outils.js,
     lettres : 0,42 de la progression de chaque lettre, les suivantes décalées de 0,07), en temps du film (TEMPO) ramené à
     la vitesse du moment (vitesse de p lissée, par seconde, comparée à celle du film à cet endroit) : en lecture, 0,58 s
     pour « Conseiller », 1,07 s pour « Créer » (0,72 s sur téléphone) ; entre 0,4 et 1,2 s quand on défile à la main */
  let vitesse = 0;
  const NB_LETTRES = { 1: 10, 2: 5 };
  const dureeBouton = (i, j) => {
    const b = Math.max(i, j), V = verbeDuBouton(b, film.F.mob), n = NB_LETTRES[b] || 6;
    const pT = V[0] + (V[1] - V[0]) * .42 / (.42 + (n - 1) * .07), tFilm = tempsDe(pT) - tempsDe(V[0]);
    const v0 = (Math.min(1, V[0] + .001) - V[0]) / Math.max(1e-6, tempsDe(V[0] + .001) - tempsDe(V[0]));
    return vitesse > 1e-4 ? clamp(tFilm * v0 / vitesse, .4, 1.2) : clamp(tFilm, .4, 1.2);
  };
  let iBouton = -1;
  function majRail(p) {
    const ib = boutonDe(p, film.F.mob);
    bouton.chapitre(ib, iBouton < 0 ? 0 : dureeBouton(ib, iBouton)); iBouton = ib;
    CHAPITRES.forEach((c, i) => {
      const b = boutonsChap[i];
      b.classList.toggle('ici', p >= c.de && p < c.a);
      b.classList.toggle('encre', p >= c.encre);
      if (p >= c.de && p < c.a) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    fils[0].style.setProperty('--k', clamp((p - CHAPITRES[0].encre) / (CHAPITRES[1].encre - CHAPITRES[0].encre)).toFixed(3));
    fils[1].style.setProperty('--k', clamp((p - CHAPITRES[1].encre) / (CHAPITRES[2].encre - CHAPITRES[1].encre)).toFixed(3));
  }
  /* l'arrêt où l'on est (posé à moins de 0,004), et le suivant */
  /* M7 (treizième passe) : sur téléphone, quatre arrêts : la nuit, le croisement, le dessin fini, la page blanche ; l'arrêt
     de la table (0,816) n'existe plus (le tronçon du croisement au dessin se joue d'une traite). Les indices restent ceux
     de l'ordinateur (F.arret 3 : le dessin) */
  const arrets = () => (film.F.mob ? ARRETS.filter(a => a.n !== 3) : ARRETS);
  const arretIci = p => ARRETS.findIndex(a => Math.abs(p - a.p) < .004 && !(film.F.mob && a.n === 3));
  const arretSuivant = p => arrets().find(a => a.p > p + .003);
  const arretPrecedent = p => arrets().slice().reverse().find(a => a.p < p - .003);
  /* le chapitre i mène à l'arrêt : sur téléphone, « Créer » mène au dessin fini */
  const arretChapitre = i => (film.F.mob ? arrets()[i] : ARRETS[i]);

  /* P2 (seizième passe) : l'entrée (le verbe qui s'écrit, la question qui se tape) part de la deuxième image affichée : la
     première porte tout le rendu de la scène qui paraît (40 à 50 ms dans WebKit) et l'entrée y perdait son début */
  let imagesEntree = 0;
  function image(t) {
    boucle = 0;
    if (imagesEntree < 2 && P_FIXE === null && !ARRET) { imagesEntree++; introDebut = performance.now(); }
    const dtMs = dernier ? t - dernier : 0;
    const dt = dernier ? Math.min(.1, (t - dernier) / 1000) : .016; dernier = t;
    if (jeu) avancerJeu(t);
    if (P_FIXE === null) {
      /* V2 (vingt-deuxième passe, 08/10/2026) : pendant un tronçon joué (lecture, Continuer), p est celui que le jeu vient de poser
         par le défilement : relire le défilement juste après l'avoir posé forçait, dans le moteur de Safari, une mise en page
         (0,2 ms par image, la scène collée qui suit le défilement) ; au doigt, à la molette, au repos, on le lit comme avant */
      { const q = pPose !== null ? pPose : mesure(); pPose = null; if (VUE.cible !== null && dt > 0) VUE.vitesse = Math.abs(q - pCible) / dt; pCible = q; VUE.cible = q; }   /* T14 */
      const p0 = pVue;
      /* T1 : à la molette, le ressort (voir plus haut) ; il part de la vitesse du film ; il cède la place au lissage d'avant dès
         que le film joue un tronçon (Continuer, la lecture) ou 650 ms après le dernier cran */
      if (!jeu && performance.now() - tMolette < FENETRE_MOLETTE) {
        if (!ressortActif) { ressortActif = true; vRessort = vVue; }
        [pVue, vRessort] = ressort(pVue, pCible, vRessort, dt);
        if (Math.abs(pCible - pVue) < .0002 && Math.abs(vRessort) < .003) { pVue = pCible; vRessort = 0; }
      } else {
        ressortActif = false;
        /* N2 (quatorzième passe) : sur téléphone, le lissage est plus court (0,13 par image au lieu de 0,08 : le film rejoint le
           doigt en 0,12 s au lieu de 0,2), pour que l'image « colle » au geste */
        const k = 1 - Math.pow(1 - (TEL ? .13 : .08), dt * 60);
        pVue += (pCible - pVue) * k;
        if (Math.abs(pCible - pVue) < .001) pVue = pCible;
      }
      vVue = dt > 0 ? (pVue - p0) / dt : 0;
      /* T14 bis : le geste rapide (le défilement ou la vue à plus de 0,15 p par seconde ; le film joue à 0,06 au plus) */
      { const v = Math.max(VUE.vitesse, Math.abs(vVue)); if (v > .15) VUE.tAgite = performance.now(); if (v > .4) VUE.tTres = performance.now(); }
      compterLecture();   /* X2 */
    }
    /* le son suit p et sa vitesse (par seconde, signée) */
    const vp = dt > 0 ? (pVue - pSon) / dt : 0; pSon = pVue;
    /* O1 : la vitesse du film, lissée sur quelques images (la durée de la transition du bouton) */
    vitesse += (Math.abs(vp) - vitesse) * (dt > 0 ? .35 : 0);
    if (P_FIXE === null) son.progression(pVue, vp);
    /* la parallaxe : la cible est la souris, ou zéro pendant le défilement ; lissage lent */
    let paral = false;
    if (parallaxeOk) {
      const defile = jeu || Math.abs(pCible - pVue) > .0005 || t - dernierDefil < 450, cible = defile ? [0, 0] : souris, S = film.F.souris;
      const k = 1 - Math.pow(1 - .045, dt * 60);
      for (let i = 0; i < 2; i++) { S[i] += (cible[i] - S[i]) * k; if (Math.abs(cible[i] - S[i]) < .002) S[i] = cible[i]; else paral = true; }
    }
    /* la vie lente (respiration des mains, vent sur la feuille) : 30 images par seconde quand rien d'autre ne bouge */
    const bouge = pCible !== pVue || intro() < 1 || jeu || appelEnAttente() || paral;
    /* P2 (seizième passe) : la file des préparations sait que le film bouge aussi pendant l'entrée (p ne change pas, mais le
       verbe s'écrit, la question se tape) et pendant la parallaxe ; sans cela elle s'y croyait au repos (tranches de 10 ms
       et étapes longues d'un bloc, en plein dans l'apparition du téléphone) */
    if (P_FIXE === null && (pCible !== pVue || intro() < 1 || jeu || paral)) signalerImage(pVue);
    /* L4 : le crochet du cartouche de mesure (?mesure=1) : intervalle depuis l'image précédente de la même boucle */
    const rendu = bouge || !film.F.vivant || film.F.fluide || t - dernierRendu > 30;
    if (window.__mesureImage) window.__mesureImage(t, dtMs, rendu, !!(jeu || pCible !== pVue), pVue);
    /* T14 ter : le geste rapide sur téléphone */
    const rapideTel = TEL && P_FIXE === null && !jeu && NIV_GESTE !== '0' && VUE.rapide();
    let sauter = false;
    if (rendu && rapideTel) {
      if (NIV_GESTE === 'c' && tresRapide()) sauter = true;
      else if ((NIV_GESTE === 'b' || NIV_GESTE === 'c') && (++imgGeste & 1)) sauter = true;
    }
    if (sauter) { gele = true; majRail(pVue); }
    else if (rendu || gele) {
      gele = false;
      /* le chapitre affiché ne change qu'avec une image rendue (pendant l'image figée du niveau c, rien ne bouge) */
      /* X4 (vingt-quatrième passe, 08/10/2026) : sur l'iPhone chaud, à l'approche rapide de l'atelier, « une sorte de page blanche avec
         une petite partie en haut à gauche du dessin de fond, qui disparaît pour faire apparaître l'atelier ». Reproduit dans le moteur de
         Safari (doigt rapide, captures image par image : c24-x4-*.png) : ce n'était pas un canevas à moitié peint, c'était le partage de
         T14 ter (niveau a) : pendant un geste rapide, avant 0,735 la pièce était cachée, à partir de 0,735 le monde ; or de 0,689 à 0,752
         les deux sont à l'écran ensemble (la pièce par les carreaux puis par la porte qui s'ouvre, la façade autour de la porte). La pièce
         cachée, la porte ouverte laissait voir le ciel pâle derrière elle, la façade réduite à un coin en haut à gauche ; la pièce
         reparaissait à la fin du geste. Règle : un chapitre n'est caché pendant un geste que là où il n'est pas du tout à l'écran (la
         pièce avant 0,676 : ses calques paraissent à 0,678, relevé sur les images figées ; le monde après 0,756) ; entre les deux, tout ce qui se voit reste posé. Au-delà de 0,4 p par seconde, rien
         n'est redessiné (niveau c, inchangé) : c'est l'image précédente, complète, qui reste jusqu'à la fin du geste */
      const chap = rapideTel && NIV_GESTE !== '0' ? (pVue < .676 ? 'geste-monde' : pVue >= .756 ? 'geste-atelier' : '') : '';
      if (chap !== chapGeste) { const sc = film.F.scene; if (chapGeste) sc.classList.remove(chapGeste); if (chap) sc.classList.add(chap); chapGeste = chap; }
      dernierRendu = t;
      film.rendre(pVue, eEntree(intro()), P_FIXE === null ? t / 1000 : 3.2);
      majRail(pVue);
      majArret(t);
      majLecteur();
    }
    if (P_FIXE === null && (bouge || gele || chapGeste || (film.F.vivant && enVue()))) demander();
    else dernier = 0;
  }
  let dernierRendu = 0;
  /* T14 ter (07/10/2026, soir) : sur l'iPhone, la page mourait pendant une traversée rapide (de la fin vers le croisement : en
     une demi-seconde, l'atelier, la façade, la route, le monde affichés et redessinés tour à tour ; relevé dans le moteur de Safari
     à 0,70 : 32 calques composés, 180 Mo à l'écran, 570 Mo de surfaces propres, dont la photo de la pièce, 2496 x 1458, vue de loin
     par la porte). Sur téléphone, pendant un geste rapide (plus de 0,15 p par seconde, hors lecture), par niveaux (?geste=0, a, b,
     c pour les essais) :
     a. un seul chapitre affiché : avant 0,735, la pièce (calques de l'atelier) est cachée ; à partir de 0,735, le monde (ses
        canevas, la façade, le poteau) ; les fondus entre les deux ne se jouent pas ;
     b. et une image sur deux seulement est rendue ;
     c. et, au-delà de 0,4 p par seconde, rien n'est redessiné : l'image reste celle du départ jusqu'à la fin du geste, puis la
        scène est rendue à l'arrivée. */
  const NIV_GESTE = (() => { const v = new URLSearchParams(location.search).get('geste'); return v === null ? 'c' : v; })();
  let imgGeste = 0, gele = false, chapGeste = '';
  const tresRapide = () => performance.now() - VUE.tTres < 150;
  const enVue = () => { const r = filmEl.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && !document.hidden; };
  const demander = () => { if (!boucle) boucle = requestAnimationFrame(image); };

  /* ---- l'objet de l'arrêt : bouton actif, battement après 2,5 s, légende de trois mots ---- */
  let arretCourant = -1;
  function appelEnAttente() { return arretCourant >= 0 && !jeu && performance.now() - attenteDepuis < 3200; }
  function majArret(t) {
    const i = jeu ? -1 : arretIci(pVue);
    if (i !== arretCourant) { arretCourant = i; attenteDepuis = performance.now(); }
    film.F.arret = i;
    const cmd = i >= 0 ? film.F.commande : null;
    const attend = i >= 0 && i < 4 && performance.now() - attenteDepuis > 2500;
    film.F.scene.classList.toggle('appel', attend);
    /* M7 (treizième passe) : sur téléphone, à l'arrêt, c'est « Continuer », dans le rail, qui bat doucement ; l'invite
       « Touchez pour avancer » ne se pose plus sur le CV ni sur le dessin */
    rail.classList.toggle('appel', attend && film.F.mob);
    if (continuerB) { continuerB.hidden = pVue > .995; }
    if (invite) {
      const vis = attend && !premierGeste && cmd && cmd.pt && !film.F.mob;
      setO(invite, vis ? 1 : 0);
      if (vis) setT(invite, `translate(${Math.round(cmd.pt[0])}px,${Math.round(cmd.pt[1])}px) ${cmd.cote === 'droite' ? 'translate(0,-50%)' : cmd.cote === 'gauche' ? 'translate(-100%,-50%)' : 'translate(-50%,0)'}`);
    }
  }

  /* ---- jouer un tronçon : défilement animé, à la vitesse du film, départ et arrivée doux ---- */
  function jouer(p1, o = {}) {
    if (P_FIXE !== null) return;
    const p0 = mesure();
    if (Math.abs(p1 - p0) < .001) return;
    const duree = o.duree || Math.max(.6, Math.abs(tempsDe(p1) - tempsDe(p0))) * 1000;
    jeu = { p0, p1, t0: 0, duree, t0f: tempsDe(p0), t1f: tempsDe(p1), lineaire: !!o.lineaire, ensuite: o.ensuite, lecture: !!o.lecture };
    if (porte && porte.armee()) porte.lever('lecture');   /* X1 : la lecture et Continuer ne sont jamais arrêtés par la porte */
    if (o.lecture) { finOuverture(); lecteur.setAttribute('aria-pressed', 'true'); lecteurTxt.textContent = 'Arrêter le film'; }
    demander();
  }
  /* profil de vitesse : rampe douce de 0,6 s au départ et à l'arrivée */
  function progression(u, D) {
    const r = Math.min(.6, D / 1000 * .12) / (D / 1000);
    if (r <= 0) return u;
    const vmax = 1 / (1 - r);
    if (u < r) return vmax * u * u / (2 * r);
    if (u > 1 - r) { const w = 1 - u; return 1 - vmax * w * w / (2 * r); }
    return vmax * (u - r / 2);
  }
  function avancerJeu(t) {
    if (!jeu.t0) jeu.t0 = t;
    const u = clamp((t - jeu.t0) / jeu.duree), e = jeu.lineaire ? u : progression(u, jeu.duree);
    const p = jeu.p1 > jeu.p0 ? pDe(lerp(jeu.t0f, jeu.t1f, e)) : lerp(jeu.p0, jeu.p1, e);
    allerA(p); pPose = clamp(p);
    if (u >= 1) { allerA(jeu.p1); pPose = clamp(jeu.p1); arreter(true); }
  }
  /* P2 (seizième passe) : la fin d'un tronçon joué (l'arrivée à l'arrêt 1 de la conversation qui se joue seule), tout geste
     (défilement, appui, clavier, chapitre) et la lecture ferment la fenêtre de l'ouverture (finOuverture) : les préparations
     de fond reprennent leur cours habituel */
  function arreter(fini) { finOuverture(); if (!jeu) return; const ensuite = fini === true && jeu.ensuite ? jeu.ensuite : null; jeu = null; if (ensuite) setTimeout(ensuite, 0); lecteur.setAttribute('aria-pressed', 'false'); lecteurTxt.textContent = 'Lancer le film'; attenteDepuis = performance.now(); demander(); }
  function continuer() { premierGeste = true; finOuverture(); const s = arretSuivant(mesure()); if (s) jouer(s.p); }
  function reculer() { premierGeste = true; finOuverture(); const s = arretPrecedent(mesure()); if (s) jouer(s.p, { duree: 1400 }); }

  /* ---- le son (D14, sixième passe F24) : coupé à chaque chargement, le bouton le dit ; rien ne le rallume tout seul.
     Pendant une activation, le bouton est en attente : un second clic ne relance pas l'activation, il vaut coupure.
     Le bouton ne dit « actif » qu'une fois l'activation finie et seulement si le son joue vraiment. ---- */
  const boutonSon = document.querySelector('[data-son]');
  if (boutonSon) {
    let attente = false, annule = false;
    const maj = () => {
      const a = !attente && !!son.actif;
      boutonSon.setAttribute('aria-pressed', a ? 'true' : 'false');
      boutonSon.setAttribute('aria-label', attente ? 'Activation du son en cours, cliquer pour annuler' : a ? 'Couper le son' : 'Activer le son');
      boutonSon.setAttribute('aria-busy', attente ? 'true' : 'false');
      boutonSon.classList.toggle('actif', a); boutonSon.classList.toggle('attente', attente);
    };
    boutonSon.hidden = !son.disponible; maj();
    /* R1 (dix-huitième passe, 07/10/2026) : le son est coupé à chaque ouverture du film, sans exception (adresse tapée, clic
       depuis une page, retour arrière, rechargement, ouverture sur un arrêt, lecture automatique) ; seul un clic du visiteur
       sur le bouton Son le met, rien d'autre (ni « Lancer le film », ni « Continuer », ni la bulle). Le choix n'est gardé
       nulle part, pas même pour la session : remettre le son tout seul à l'ouverture suivante serait un son sans geste.
       Le seul cas où il pouvait revenir seul : la page quittée son mis, puis rendue par le retour arrière depuis le cache du
       navigateur (bfcache) ; son.js reprenait alors son contexte audio dès que la page redevenait visible. Le son est donc
       coupé quand la page est quittée (pagehide), et encore au retour (pageshow persisté), le bouton remis à l'état coupé */
    addEventListener('pagehide', () => { if (attente) annule = true; if (son.actif || attente) { try { son.couper(); } catch (err) {} } attente = false; maj(); });
    addEventListener('pageshow', e => { if (!e.persisted) return; if (son.actif) { try { son.couper(); } catch (err) {} } attente = false; maj(); });
    boutonSon.addEventListener('click', async e => {
      e.stopPropagation();
      if (attente) { annule = true; try { son.couper(); } catch (err) {} maj(); return; }
      if (son.actif) { try { son.couper(); } catch (err) {} maj(); demander(); return; }
      attente = true; annule = false; maj();
      try { await son.activer(); } catch (err) {}
      attente = false;
      /* coupé pendant l'attente : on s'assure qu'il reste coupé */
      if (annule) { try { son.couper(); } catch (err) {} }
      maj(); demander();
    });
  }

  /* ---- revoir le film (cinquième passe, E1) : à la dernière image, « Lancer le film » devient « Revoir le film » ;
     un fondu de nuit, et le film reprend depuis la nuit, d'une traite ---- */
  const voileRetour = document.createElement('div'); voileRetour.className = 'voile-retour'; voileRetour.setAttribute('aria-hidden', 'true'); film.F.scene.appendChild(voileRetour);
  function revoirFilm() {
    premierGeste = true;
    voileRetour.classList.add('visible');
    setTimeout(() => {
      allerA(0); pVue = pCible = 0; introDebut = performance.now(); entreeFaite = false; demander();   /* W1 : au « Revoir le film », l'entrée se rejoue */
      setTimeout(() => { voileRetour.classList.remove('visible'); jouer(1, { lecture: true, lineaire: true }); }, 140);
    }, 420);
  }
  /* X2 (vingt-quatrième passe) : une lecture complète réussie, une fois par chargement : la fin atteinte après être passé par l'entrée
     de l'atelier (le moment le plus lourd) ; deux en mode économe, et il est levé (memoire.js) */
  let vuEntree = false, lectureComptee = false;
  function compterLecture() {
    if (P_FIXE !== null || lectureComptee) return;
    if (pVue >= .70 && pVue <= .76) vuEntree = true;
    if (vuEntree && pVue > .995) { lectureComptee = true; lectureReussie(); }
  }
  function majLecteur() {
    if (jeu && jeu.lecture) return;
    const fin = pVue > .995, txt = fin ? 'Revoir le film' : 'Lancer le film';
    if (lecteurTxt.textContent !== txt) lecteurTxt.textContent = txt;
    lecteur.classList.toggle('revoir', fin);
  }
  film.F.revoir = revoirFilm;

  /* ---- les commandes ---- */
  film.F.continuer = continuer;
  film.F.demander = demander;
  if (continuerB) continuerB.addEventListener('click', e => { e.stopPropagation(); continuer(); });
  lecteur.addEventListener('click', e => { e.stopPropagation(); premierGeste = true; if (jeu) arreter(); else if (mesure() > .995) revoirFilm(); else jouer(1, { lecture: true, lineaire: true }); });
  boutonsChap.forEach((b, i) => b.addEventListener('click', () => { premierGeste = true; arreter(); allerA(arretChapitre(i).p); demander(); }));
  const passer = document.querySelector('[data-passer]');
  if (passer) passer.addEventListener('click', () => arreter());
  /* tout geste de défilement, tout appui ou Échap rend la main */
  const rendreLaMain = () => { premierGeste = true; finOuverture(); if (jeu) arreter(); };
  /* S3 (dix-neuvième passe) : sur téléphone, tout geste suspend la file des tâches de fond (lavis.js, geste) jusqu'à 300 ms
     après le dernier mouvement ; un défilement joué par le film (Continuer, la lecture) n'est pas un geste */
  /* X1 : contre la porte de l'atelier, le doigt qui pousse encore ne fait plus rien défiler : il ne suspend pas la file (les
     préparations de l'atelier doivent y finir) */
  const gesteSaufPorte = () => { if (!(porte && porte.enButee())) geste(); };
  addEventListener('wheel', () => { gesteSaufPorte(); rendreLaMain(); }, { passive: true });
  addEventListener('touchmove', () => { gesteSaufPorte(); rendreLaMain(); }, { passive: true });
  addEventListener('touchstart', () => gesteSaufPorte(), { passive: true });
  addEventListener('pointerdown', e => { premierGeste = true; finOuverture(); if (jeu && !e.target.closest('[data-lecture]')) arreter(); }, true);
  addEventListener('keydown', e => {
    const k = e.key, cible = e.target, surBouton = cible && cible.closest && cible.closest('button, a, input, textarea');
    if (k === 'Escape' || k === 'End') { if (porte) porte.liberer(k === 'Escape' ? 'Échap' : 'Fin'); }   /* X1 : Échap et Fin lèvent la porte */
    if (k === 'Escape') { rendreLaMain(); return; }
    if (jeu && !(k === 'ArrowRight' || k === ' ' || k === 'Enter')) { rendreLaMain(); return; }
    if (surBouton && (k === ' ' || k === 'Enter')) return;
    if (k === 'ArrowRight' || k === ' ' || k === 'Enter') { if (pVue < 1 && mesure() >= -.001) { e.preventDefault(); if (jeu) return; continuer(); } }
    else if (k === 'ArrowLeft') { e.preventDefault(); arreter(); reculer(); }
    else premierGeste = true;
  });

  /* ---------------------------------------------------------------------
     X1 (vingt-quatrième passe, 08/10/2026) : la porte de l'atelier, sur téléphone.
     Thibaut, sur son iPhone 15 chaud : « quand on approche vite, ça crashe ; quand on approche lentement, c'est bien ». Au doigt rapide,
     les préparations de l'atelier (la pièce, le plafond, le mur, la vitre, le dos des vantaux, la calade, la plaque, la girouette, la pièce
     éteinte, les lavis, la photo nette, l'accord) tombaient à l'arrivée, sur la pièce qui se réveille et les couleurs qui arrivent, le
     moment le plus lourd du film (relevé sur l'appareil le 08/10 : « dos » encore en cours à p 0,705, 13 images par seconde ; avec 450 Mo
     de lest, la page arrêtée à p 0,66). Désormais, sur téléphone, une porte avant les couleurs : tant que l'atelier n'est pas prêt
     (film.js, F.manqueAtelier : aucune préparation de besoin au plus 0,80 dans la file, la pièce réveillée et peinte, la feuille de
     dessin prête) et que la mémoire du chemin n'est pas rendue (le CV, cv.js, rendu dès que le doigt est contre la porte ; le halo du soleil hors de l'écran, fond.js ; les calques du
     monde dès qu'ils sont cachés derrière la porte de la façade, film.js),
     la page ne descend pas plus bas que p 0,670 (la fin du pivot vers l'atelier, la façade au bout de la route, avant que la pièce
     paraisse dans ses carreaux (0,678 ; barres de Safari déployées, la page s'arrête 0,006 plus loin, mesuré), avant la girouette,
     la lampe et les couleurs à 0,700) : la technique de la section Marianne (MB-10 ter) et de la page de l'atelier (AT-15 ter), qui
     tient à l'élan du doigt sur Safari iOS : la fin du document est posée là (body : overflow-y clip et max-height), le navigateur s'y
     arrête lui-même, comme au bas d'une page, sans que la position soit réécrite, sans rebond (overscroll-behavior: none), et rien de
     coupé n'est à l'écran. Contre la porte, le doigt qui pousse encore ne suspend plus la file (S3) : le film est immobile, la file
     travaille comme à l'arrêt. Dès que tout est prêt, la porte se lève et le film continue avec le geste du visiteur.
     La porte n'arrête jamais une lecture (Lancer le film, Continuer, un chapitre du rail : elle se lève avant le saut), ni un lien
     (levée le temps de son défilement), ni Échap ou Fin (levée pour la page) ; en lecture lente, les préparations ont eu le temps :
     elle est déjà levée quand on y arrive. Le retour suit la règle symétrique : en revenant de l'atelier vers le chemin, la pièce et
     la feuille de dessin rendent leur mémoire avant que le CV se refasse (atelier.js, cv.js) ; la porte se repose alors (sous 0,659)
     et l'atelier se refait par étapes, comme le chemin (T14 bis), avant de rentrer.
     Filet : si la porte tient plus de 12 s au doigt, elle se lève (le journal ?diag=1 dit ce qui manquait). ?porte=0 l'écarte (essais).
     Ordinateur : pas de porte.
     --------------------------------------------------------------------- */
  const P_PORTE = .670, PORTE_MAX = 12000;
  porte = (() => {
    const actif = TEL && P_FIXE === null && new URLSearchParams(location.search).get('porte') !== '0' && !!(window.CSS && CSS.supports('overflow-y', 'clip'));
    const racine = document.documentElement, corps = document.body, tDebut = performance.now();
    const P = { armee: false, L: 0, tButee: 0, tenues: [], journal: [], manque: [], pret: false, libre: false, suspendue: 0, filet: 0 };
    const noter = m => { const l = (performance.now() / 1000).toFixed(2) + ' ' + m; P.journal.push(l); if (P.journal.length > 300) P.journal.shift(); if (window.__diag) window.__diag.noter('porte ' + m); };
    /* la position de la porte : p 0,670 quand les barres sont repliées (la grande hauteur, celle du film) ; barres déployées, la page
       s'arrête un peu plus loin (la différence des deux hauteurs : 0,006 de p sur l'iPhone 15, mesuré : encore avant les couleurs).
       La fin du document est posée à la porte plus la grande hauteur de vue : la vue ne dépasse jamais la fin du document, barres
       repliées ou non (mesuré sur l'iPhone avec la petite hauteur : quand Safari repliait ses barres contre la porte, une bande du fond
       de la page, crème, paraissait sous la scène, et le rail s'effaçait) */
    const hautMax = () => Math.max(innerHeight, hRef || 0);
    const limite = () => haut() + P_PORTE * course();
    const finDoc = () => (document.scrollingElement || racine).scrollHeight - innerHeight;
    const enButee = () => P.armee && scrollY >= finDoc() - 2;
    const poser = () => {
      P.L = limite();
      corps.style.overflowY = 'clip'; corps.style.maxHeight = Math.ceil(P.L + hautMax()) + 'px';
      if (!P.armee) { P.armee = true; noter('posée p ' + mesure().toFixed(3) + ' ; attend ' + P.manque.slice(0, 6).join(', ')); }
    };
    /* près de la porte (au-delà du croisement), sans rebond (overscroll-behavior: none) ; et sous la barre d'outils de Safari, au bas de
       l'écran, iOS montre le fond de la page au-delà de la fin du document (relevé sur l'iPhone contre la porte : une bande crème au lieu
       du bleu nuit du film) : le fond de la page est alors celui du film. Loin de la porte, la page reste comme avant (le rebond du haut) */
    let estProche = false;
    const proche = v => {
      if (v === estProche) return; estProche = v;
      if (v && !P.fond) P.fond = getComputedStyle(filmEl).backgroundColor;
      racine.style.overscrollBehaviorY = v ? 'none' : ''; corps.style.overscrollBehaviorY = v ? 'none' : '';
      racine.style.backgroundColor = v ? P.fond : ''; corps.style.backgroundColor = v ? P.fond : '';
    };
    const lever = raison => {
      if (!P.armee) return;
      P.armee = false;
      corps.style.overflowY = ''; corps.style.maxHeight = ''; proche(false);
      const tenue = P.tButee ? Math.round(performance.now() - P.tButee) : 0;
      if (P.tButee) P.tenues.push({ ms: tenue, raison, p: +mesure().toFixed(3) });
      P.tButee = 0; VUE.porte = false;
      noter('levée (' + raison + ') p ' + mesure().toFixed(3) + (tenue ? ', le doigt a attendu ' + tenue + ' ms' : ''));
    };
    const verifier = () => {
      if (!actif) return;
      VUE.porte = enButee();   /* X1 : lu par cv.js (le CV rendu pendant que la porte tient, jamais refait contre elle) */
      const manque = film.F.manqueAtelier ? film.F.manqueAtelier() : [];
      if (performance.now() - tDebut < 4000) manque.push('demarrage');   /* les préparations posées par minuteur (jusqu'à 3 s) */
      P.manque = manque; P.pret = !manque.length;
      const t = performance.now(), p = mesure();
      if (jeu || t < P.suspendue) { lever(jeu ? 'lecture' : 'lien'); return; }
      if (P.libre) { if (p < .30) P.libre = false; else return; }
      if (P.armee) {
        if (enButee() && !P.tButee) { P.tButee = t; noter('le doigt est à la porte p ' + p.toFixed(3) + ' ; attend ' + manque.slice(0, 6).join(', ')); }
        if (P.pret) lever('prête');
        else if (P.tButee && t - P.tButee > PORTE_MAX) { P.filet++; lever('filet de ' + PORTE_MAX + ' ms ; manquait ' + manque.join(', ')); P.libre = true; }
        else if (scrollY > P.L + Math.max(0, hautMax() - innerHeight) + 2) lever('déjà passée');
        else if (Math.abs(limite() - P.L) > 1) poser();   /* une mise en page qui change (largeur, polices) */
        if (P.armee) proche(p > .50);
      } else if (!P.pret && p < P_PORTE - .015 && (premierGeste || t - tDebut > 1500)) poser();
    };
    if (actif) {
      setInterval(verifier, 150);
      addEventListener('scroll', () => { if (P.armee && !P.tButee && enButee()) verifier(); }, { passive: true });
      /* un lien de la page : la porte se lève le temps de son défilement */
      document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href]'); if (!a) return; P.suspendue = performance.now() + 700; lever('lien'); }, true);
      addEventListener('beforeprint', () => lever('impression'));
    }
    const api = {
      armee: () => P.armee, enButee, lever,
      liberer: raison => { if (!actif) return; P.libre = true; lever(raison); },
      etat: () => ({ armee: P.armee, butee: enButee(), pret: P.pret, manque: P.manque.slice(0, 6), tenues: P.tenues.slice(), filet: P.filet, L: Math.round(P.L), libre: P.libre }),
      journal: P.journal
    };
    window.__porte = api;
    return api;
  })();

  /* ---- démarrage ---- */
  if (P_FIXE !== null) pVue = pCible = P_FIXE;
  else if (ARRET) { const L = arrets(), a = L[Math.min(ARRET, L.length) - 1]; allerA(a.p); pVue = pCible = a.p; }
  else pVue = pCible = mesure();
  /* Q6 (dix-septième passe, 07/10/2026) : hors du film (« Ce que fait Civik-ia », le pied), la racine porte la classe
     hors-film : sur téléphone, le rail et les boutons s'effacent (film.css). L'étiquette de travail s'efface quatre secondes
     après le chargement et revient quand on revient en haut de la page ou que le pointeur passe sur son coin */
  const racineH = document.documentElement, etiquette = document.querySelector('.etiquette');
  let horsFilm = null, tEtiq = 0;
  const majHorsFilm = () => { const h = filmEl.getBoundingClientRect().bottom < innerHeight - 2; if (h !== horsFilm) { horsFilm = h; racineH.classList.toggle('hors-film', h); } };
  let rEtiq = null;
  const montrerEtiquette = () => { if (!etiquette) return; etiquette.classList.remove('effacee'); clearTimeout(tEtiq); tEtiq = setTimeout(() => { rEtiq = etiquette.getBoundingClientRect(); etiquette.classList.add('effacee'); }, 4000); };
  addEventListener('resize', () => { rEtiq = null; }, { passive: true });
  let enHaut = true;
  const majHaut = () => { const h = scrollY < 40; if (h && !enHaut) montrerEtiquette(); enHaut = h; };
  if (etiquette) {
    montrerEtiquette();
    const coin = e => { if (!etiquette.classList.contains('effacee')) return; const r = rEtiq || (rEtiq = etiquette.getBoundingClientRect()); if (e.clientX >= r.left - 24 && e.clientX <= r.right + 24 && e.clientY >= r.top - 24 && e.clientY <= r.bottom + 24) montrerEtiquette(); };
    addEventListener('pointermove', coin, { passive: true }); addEventListener('pointerdown', coin, { passive: true });
  }
  majHorsFilm();
  addEventListener('scroll', () => { dernierDefil = performance.now(); if (!jeu) geste(); majHorsFilm(); majHaut(); demander(); }, { passive: true });
  /* M5 (treizième passe) : un « resize » qui ne change pas la scène (les barres de Safari qui se replient) ne refait plus
     toute la mise en page (canevas réalloués : une image longue et un éclair, en plein défilement, sur iPhone) */
  addEventListener('resize', () => { majRef(); const sc = film.F.scene; if (sc.clientWidth !== film.F.W || sc.clientHeight !== film.F.H) { bouton.dims(); film.dims(); } demander(); });
  document.addEventListener('visibilitychange', demander);
  film.dims();
  introDebut = performance.now();
  demander();
  /* P2 (seizième passe) : ouvert sur la nuit (p 0, ou l'arrêt 1), aucune préparation de fond pendant les 3 premières
     secondes (l'entrée du téléphone, « Communiquer » qui s'écrit, la question envoyée, Marianne qui commence à répondre) ;
     tant que la conversation se joue seule, les préparations attendent que le film s'arrête (arrêt 1) ; ouvert ailleurs
     (arrêts 2 à 5, image figée), rien ne change */
  const surLaNuit = P_FIXE === null && (!ARRET || ARRET === 1) && mesure() < ARRETS[0].p + .01;
  ouverture({ calme: surLaNuit ? 3000 : 0, conversation: surLaNuit && !ARRET && !LECTURE_AUTO && mesure() < ARRETS[0].p - .01, max: 20000 });
  /* à l'ouverture, la conversation se joue seule jusqu'à la troisième réponse */
  if (P_FIXE === null && !ARRET) {
    if (LECTURE_AUTO) setTimeout(() => jouer(1, { lecture: true, lineaire: true }), 700);
    /* W1 : l'entrée déjà faite (1,6 s d'écriture du verbe et de frappe de la question qui ne se jouent plus), la réponse de Marianne
       part 0,4 s après que le film a pris la main (et non 1,7 s : les points de frappe tournent déjà depuis la première image) */
    else if (mesure() < ARRETS[0].p - .01) setTimeout(() => { if (!premierGeste && !jeu) jouer(ARRETS[0].p); }, entreeFaite ? 400 : 1700);
  }
  window.__F = film.F;
  window.__film = { p: () => pVue, continuer, reculer, jouer, arret: () => arretIci(pVue), enJeu: () => !!jeu, rendre: (p, t) => film.rendre(p, 1, t === undefined ? 3.2 : t) };
  /* ?mesure=1 : coût JavaScript d'une image, sur trois tronçons (marche, croisement et route, atelier) */
  /* L4 : en lecture complète, la mesure du coût attend la fin du film (elle bloquerait la lecture) ; son résultat va
     aussi au cartouche */
  const coutJs = () => {
    if (jeu) { setTimeout(coutJs, 1000); return; }
    const res = {};
    [['marche', .30, .45], ['croisement-route', .45, .75], ['atelier', .75, 1]].forEach(([nom, a, b]) => {
      const t = [];
      for (let i = 0; i < 160; i++) { const p = a + (b - a) * i / 159, t0 = performance.now(); film.rendre(p, 1, i / 30); t.push(performance.now() - t0); }
      t.sort((x, y) => x - y);
      res[nom] = 'moyenne ' + (t.reduce((x, y) => x + y, 0) / t.length).toFixed(2) + ' ms, médiane ' + t[80].toFixed(2) + ' ms, 95e ' + t[152].toFixed(2) + ' ms, max ' + t[159].toFixed(2) + ' ms';
    });
    document.documentElement.setAttribute('data-mesure', JSON.stringify(res));
    if (window.__mesure) { window.__mesure.cout = Object.fromEntries(Object.entries(res).map(([k, v]) => [k, v.split(',')[0].replace('moyenne ', '')])); if (window.__mesure.envoyer) window.__mesure.envoyer('cout'); }
    film.rendre(pVue, 1, performance.now() / 1000);
  };
  if (new URLSearchParams(location.search).get('mesure') === '1') setTimeout(coutJs, LECTURE_AUTO ? 3000 : 1200);
  return { demander };
}
