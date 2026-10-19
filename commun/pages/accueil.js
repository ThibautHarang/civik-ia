/* =====================================================================
   L’accueil, hors du film (passe P4, 19/10/2026 ; revue Claude Design,
   parties 2, 9 et 12) : le contact « Nous écrire » et les portes du bout
   du film. Chargé par la page d’accueil à côté du film (c-film/js/main.js),
   sans rien lui demander ni rien changer dans le film ou son lecteur.
   - Le formulaire passe par le mécanisme commun des pages (pages.js,
     formulaireCourt, contrat R7) : séquence d’envoi en six temps, brouillon
     gardé dans la session, échec en trois sorties, mesures fermées.
   - L’action suivante sous le remerciement dépend du sujet choisi.
   - Au bout du film, la bulle « Parler de mon projet » mène au contact de
     Conseil (voir plus bas).
   ===================================================================== */
import { formulaireCourt } from './pages.js';

const form = document.querySelector('.ecrire [data-court]');
if (form) {
  formulaireCourt(form, 'accueil');
  /* partie 9, friction 16 : une action suivante en lien après le « Merci », selon le sujet (sans délai promis) */
  const SUITES = {
    marianne: ['/marianne/', 'En attendant : Marianne et son prix pour votre commune'],
    conseil: ['/conseil/#deroule', 'En attendant : le déroulé d’un conseil'],
    atelier: ['/atelier/#page-blanche', 'En attendant : partez d’une page blanche']
  };
  const majSuite = () => {
    const c = form.querySelector('[name="sujet"]:checked'), s = c && SUITES[c.value];
    if (s) { form.dataset.suiteHref = s[0]; form.dataset.suiteTexte = s[1]; } else { delete form.dataset.suiteHref; delete form.dataset.suiteTexte; }
  };
  form.addEventListener('change', majSuite);
  majSuite();
  /* la barre de l'accueil est fixe : dès que le visiteur entre dans le formulaire, le défilement (focus du remerciement ou de
     l'échec, départ de la lettre, qui lit scroll-padding-top) s'arrête 96 px sous le haut, comme sur Conseil et l'Atelier
     (pages.css) ; posé ici et seulement à ce moment, pour ne rien changer aux ancres du film (« Passer le film ») */
  form.addEventListener('focusin', () => { document.documentElement.style.scrollPaddingTop = '96px'; }, { once: true });
}

/* M7 (décision de la session du 18/10/2026) et P4 : au bout du film, sous « Vous avez un projet ? Contactez-moi ! T.H. »,
   écrit à la première personne, la bulle « Parler de mon projet » mène au contact de Conseil (au « je », celui de Thibaut), et
   non plus à la page blanche de l’Atelier ; le bouton de la barre pendant « Créer » (c-film/js/bouton.js) mène au même endroit
   (un libellé, une destination, sur le même écran). La bulle est posée par le film (c-film/js/atelier.js sur ordinateur ; sur
   téléphone, sa zone cliquable est une réplique posée par le lecteur depuis la piste T3, enregistrée avec la vidéo) : le film
   et le lecteur ne changent pas dans cette passe, l’adresse est corrigée ici, dès que la bulle paraît dans la page.
   Passe P5 : poser l’adresse dans atelier.js et dans proto3.js (réplique de la piste), puis retirer ce filet. */
const BULLE = '/conseil/#contact';
const corriger = n => {
  if (!n || n.nodeType !== 1) return;
  const liste = n.matches('a.bulle-projet') ? [n] : n.querySelectorAll('a.bulle-projet');
  liste.forEach(a => { if (a.getAttribute('href') !== BULLE) a.setAttribute('href', BULLE); });
};
corriger(document.body);
if ('MutationObserver' in window) new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(corriger))).observe(document.body, { childList: true, subtree: true });
