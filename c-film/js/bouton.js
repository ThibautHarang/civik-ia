/* =====================================================================
   N7 (quatorzième passe, 05/10/2026) : le bouton bleu de la barre suit le
   chapitre. Communiquer : « Tester Marianne » (la démo de Marianne, l'adresse
   d'origine du bouton) ; Conseiller : « Prendre contact avec moi » (la page
   Conseil) ; Créer : « Parler de mon projet » (la page Atelier). Sur un écran
   où le libellé long ne tient pas sur une ligne : « Me contacter ».
   O1 bis (quinzième passe, 06/10/2026, décision de Thibaut valable sur tout le
   site) : « Prendre contact avec moi » et « Me contacter » remplacent
   « Prendre contact avec Thibaut » et « Contacter Thibaut ».
   O1 (quinzième passe, 06/10/2026) : le changement ne se fait plus aux bornes
   des chapitres mais à l'instant où le verbe commence à s'écrire
   (temps.js, boutonDe : « Conseiller » à p 0,512, « Créer » à p 0,828, sur
   téléphone 0,776), dans les deux sens : le bouton et le verbe sont un seul
   événement. Même animation qu'en N7 : l'ancien libellé glisse vers le haut
   en s'effaçant, le nouveau monte du bas en paraissant, comme les lettres du
   verbe ; en remontant le film, le mouvement est inversé (l'ancien descend,
   le nouveau revient d'en haut), comme les lettres qui se retirent. La durée
   est celle de la montée de la première lettre du verbe à la vitesse du
   moment (moteur.js, dureeBouton : 0,58 s pour « Conseiller », 1,07 s pour
   « Créer », 0,72 s sur téléphone, à la vitesse de lecture), entre 0,4 et
   1,2 s ; la largeur du bouton et l'icône du son suivent avec la même durée.
   En mouvement réduit, un simple fondu.
   Le lien garde à tout instant un texte lisible (aria-live poli).
   Le marquage de index.html n'est pas touché : la structure est posée ici.
   ===================================================================== */
/* Q1 (dix-septième passe, 07/10/2026) : les cibles vivantes. « Tester Marianne » mène à la page Marianne (l'adresse posée
   dans index.html, ../marianne-base/ dans la maquette, /marianne/ sur le site) ; « Prendre contact avec moi » au contact
   de la page Conseil ; « Parler de mon projet » à la page blanche de l'Atelier, comme les mêmes libellés sur les pages.
   Q5 : « Mon projet » quand le libellé long ne tient pas (le bouton menu prend sa place dans la barre, comme sur l'Atelier) */
const LIBELLES = [
  { texte: 'Tester Marianne', cible: 'marianne' },
  { texte: 'Prendre contact avec moi', court: 'Me contacter', cible: 'conseil', href: '/conseil/#contact' },   /* O1 bis, Q1 */
  /* P4 (19/10/2026, M7) : pendant « Créer », « Parler de mon projet » menait au contact de Conseil. P5 (19/10/2026, M3) : au contact
     de l'Atelier, comme la bulle du bout du film (atelier.js, et sa réplique du téléphone, proto3.js) et le bouton de la barre de la
     page de l'Atelier : un libellé, une destination, partout */
  { texte: 'Parler de mon projet', court: 'Mon projet', cible: 'atelier', href: '/atelier/#contact' }   /* Q1, Q5, P4, P5 */
];
/* O1 : durée par défaut (secondes), quand la vitesse du film n'est pas connue */
const DUREE = .6;

export function creerBoutonChapitre() {
  const a = document.querySelector('.nav__cta');
  if (!a) return { chapitre() {}, largeurCible: () => 0 };
  /* en mouvement réduit, film.css ne garde que le fondu (classe nav__cta--reduit) */
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).get('mouvement') === 'reduit') a.classList.add('nav__cta--reduit');
  LIBELLES[0].href = a.getAttribute('href') || '#';
  a.setAttribute('aria-live', 'polite');
  a.classList.add('nav__cta--anime');
  const pile = document.createElement('span'); pile.className = 'nav__cta-pile';
  let cour = document.createElement('span'); cour.className = 'nav__cta-txt'; cour.textContent = a.textContent.trim();
  a.textContent = ''; pile.appendChild(cour); a.appendChild(pile);
  let actuel = 0, enCours = null, largeur = 0;
  /* la largeur du bouton pour un libellé : un double du bouton, invisible, hors de la page */
  const mesurer = txt => {
    const c = a.cloneNode(false); c.removeAttribute('style'); c.classList.remove('nav__cta--anime'); c.textContent = txt;
    c.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;width:auto'; c.removeAttribute('aria-live');
    a.parentNode.appendChild(c); const w = c.getBoundingClientRect().width; c.remove(); return Math.ceil(w);
  };
  /* la place pour le bouton : la barre, moins le logo et une icône (le son) avec ses marges */
  const place = () => {
    const nav = a.closest('header.nav'), logo = nav && nav.querySelector('.nav__logo'), liens = nav && nav.querySelector('.nav__liens');
    if (!nav || !logo) return 1e9;
    const n = nav.getBoundingClientRect(), pr = parseFloat(getComputedStyle(nav).paddingRight) || 0;
    const gauche = liens && getComputedStyle(liens).display !== 'none' ? liens.getBoundingClientRect().right : logo.getBoundingClientRect().right;
    /* Q5 (dix-septième passe) : le bouton menu, quand il est là, prend sa place au bout de la barre */
    const menu = nav.querySelector('.nav__menu'), cm = menu && getComputedStyle(menu).display !== 'none' ? menu.getBoundingClientRect().width + (parseFloat(getComputedStyle(nav).columnGap) || 0) : 0;
    /* V1 (vingt-deuxième passe, 07/10/2026) : sur téléphone, le bouton du son est dans la barre (film.js, placerSon) : sa place
       exacte (l'écart qui le sépare du logo, sa largeur, sa marge, l'écart avant le bouton) ; ailleurs, la réserve d'avant */
    const sonN = nav.querySelector('.son');
    if (sonN) { const cs = getComputedStyle(nav), g = parseFloat(cs.columnGap) || 0; return n.right - (parseFloat(cs.borderRightWidth) || 0) - pr - gauche - (g + sonN.offsetWidth + (parseFloat(getComputedStyle(sonN).marginRight) || 0) + g) - cm; }   /* (le filet de la barre compris) */
    return n.right - pr - gauche - 10 - 44 - cm;
  };
  const libelle = i => { const L = LIBELLES[i]; if (L.court && mesurer(L.texte) > place()) return L.court; return L.texte; };
  /* O1 : les durées des transitions (film.css les lit sur la racine : le bouton, ses libellés, l'icône du son) */
  const racine = document.documentElement.style;
  const durees = d => {
    const f = v => v.toFixed(3) + 's';
    racine.setProperty('--cta-t', f(d)); racine.setProperty('--cta-o', f(d * .72)); racine.setProperty('--cta-s', f(d * .9));
    racine.setProperty('--cta-so', f(d * .6)); racine.setProperty('--cta-w', f(d * 1.05));
  };
  function poser(i, anime, duree = DUREE, recul = false) {
    const L = LIBELLES[i], txt = libelle(i);
    a.setAttribute('href', L.href || '#'); a.dataset.cible = L.cible;
    const w = mesurer(txt);
    if (!anime) {
      if (enCours) enCours.fin();
      cour.textContent = txt; a.style.width = w + 'px'; largeur = w; return;
    }
    if (enCours) { enCours.fin(); }
    /* O1 : la durée du moment, et le sens (en remontant, le mouvement est inversé), posés avant les classes */
    durees(duree);
    a.classList.toggle('nav__cta--recul', recul);
    const nouveau = document.createElement('span'); nouveau.className = 'nav__cta-txt nav__cta-txt--entre'; nouveau.textContent = txt;
    const ancien = cour; ancien.setAttribute('aria-hidden', 'true'); ancien.classList.add('nav__cta-txt--sort');
    pile.appendChild(nouveau);
    /* la largeur : de la largeur du moment à la nouvelle */
    a.style.width = a.getBoundingClientRect().width + 'px';
    void a.offsetWidth;
    a.style.width = w + 'px'; largeur = w;
    requestAnimationFrame(() => { nouveau.classList.remove('nav__cta-txt--entre'); });
    const t = setTimeout(() => fin(), duree * 1050 + 120);
    function fin() { clearTimeout(t); if (ancien.parentNode) ancien.remove(); nouveau.classList.remove('nav__cta-txt--entre'); enCours = null; }
    cour = nouveau; enCours = { fin };
  }
  poser(0, false);
  let premier = true;
  return {
    /* i : l'indice du libellé (0, 1, 2 ; temps.js, boutonDe) ; duree : en secondes (O1, la vitesse du film) */
    chapitre(i, duree) {
      if (i < 0) return;
      /* O1 : à l'ouverture (un arrêt, un lien direct), le libellé du moment est posé sans animation */
      if (premier) { premier = false; if (i !== actuel) { actuel = i; poser(i, false); } return; }
      if (i === actuel) return;
      const recul = i < actuel; actuel = i; poser(i, true, duree || DUREE, recul);
    },
    /* au redimensionnement : le libellé (long ou court) et la largeur, sans animation */
    dims() { if (enCours) enCours.fin(); poser(actuel, false); },
    largeurCible: () => largeur,
    /* Q5 (dix-septième passe) : la largeur du plus long des trois libellés à cette taille d'écran (film.js : la place du son
       se décide une fois par taille, sur ce libellé, et ne change pas d'un chapitre à l'autre) */
    largeurMax: () => Math.max(...LIBELLES.map((L, i) => mesurer(libelle(i))))
  };
}
