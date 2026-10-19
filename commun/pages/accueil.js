/* =====================================================================
   L’accueil, hors du film (passe P4, 19/10/2026 ; revue Claude Design,
   parties 2, 9 et 12) : le contact « Nous écrire ». Chargé par la page d’accueil à côté du film (c-film/js/main.js),
   sans rien lui demander ni rien changer dans le film ou son lecteur.
   - Le formulaire passe par le mécanisme commun des pages (pages.js,
     formulaireCourt, contrat R7) : séquence d’envoi en six temps, brouillon
     gardé dans la session, échec en trois sorties, mesures fermées.
   - L’action suivante sous le remerciement dépend du sujet choisi.
   - Passe P5 (19/10/2026) : le filet qui corrigeait l’adresse de la bulle
     « Parler de mon projet » du bout du film est retiré ; l’adresse (le
     contact de l’Atelier, M3) est posée dans le film (c-film/js/atelier.js,
     c-film/js/bouton.js) et dans le lecteur du téléphone (proto3.js).
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
