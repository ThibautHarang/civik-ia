/* =====================================================================
   Civik-ia, bandeau de consentement (CNIL, article 82 de la loi Informatique et Libertés).
   Couche commune des pages anciennes, passe P2 du 19/10/2026 ; depuis la passe P3 (19/10/2026), le même script sert aussi
   l'accueil, Conseil et l'Atelier (l'ancien /cookie-consent.js n'y est plus appelé). Un seul script, une seule carte, posée sur
   papier ; ses styles sont dans /css/couche-commune.css (.cc-cookies).

   Logique gardée telle quelle depuis /cookie-consent.js :
   - Google Tag Manager (GTM-55JF49WB), donc Google Analytics 4, ne se charge qu'après un accord explicite ;
     rien n'est chargé ni déposé avant ;
   - le choix est gardé dans le navigateur sous la même clé (« civik-cookie-consent » : granted ou denied,
     et sa date) : un choix fait sur une page vaut sur toutes, nouvelle maison comprise ;
   - window.__civikGtmLoaded est posé au chargement de GTM : le film et les formulaires le lisent avant de
     pousser un événement.
   Ce qui change : « Refuser » et « Accepter » ont le même poids (libellés de la revue, partie 5, posés par la passe P3) ; « Choisir » ouvre la finalité,
   cochée ou non ; plus de pilule flottante : on revient sur son choix par « Gérer les cookies » (pied et menu).
   Passe P4 (19/10/2026, revue Claude Design, partie 9) : le compteur des choix, côté serveur et sans cookie (contrat de la
   passe P7 : nginx répond 204 sur /_mesure/accepter, /_mesure/refuser et /_mesure/gerer, et n'écrit que le jour et le chemin,
   sans adresse IP) : chaque choix envoie navigator.sendBeacon(chemin), sans corps ; « Gérer les cookies » compte « gerer ».
   Interrupteur : COMPTEUR_ACTIF (la DAJF confirme que ce compteur, sans cookie, sans IP et agrégé au jour, n'appelle pas de
   consentement ; à éteindre ici sinon). Après l'accord, et après lui seulement, le module des mesures en valeurs fermées
   (/commun/pages/mesures.js : appels, volets de FAQ, copies) est chargé sur les pages qui ne l'ont pas déjà.
   Le même fichier ferme aussi le tiroir du menu de la barre commune (Échap, clic au dehors, choix d'un lien),
   pour ne pas ajouter une requête de plus.
   ===================================================================== */
(function () {
  'use strict';

  var GTM_ID = 'GTM-55JF49WB';
  var KEY = 'civik-cookie-consent';        // 'granted' | 'denied'
  var KEY_DATE = 'civik-cookie-consent-date';
  var POLICY_URL = '/legal/politique-confidentialite.html';
  var COMPTEUR_ACTIF = true;               // passe P4 : /_mesure/ ouvert par la passe P7 (204, sans cookie ni IP)
  var MESURES = '/commun/pages/mesures.js'; // passe P4 : les mesures fermées, chargées après l'accord seulement

  function readConsent() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function writeConsent(value) {
    try {
      localStorage.setItem(KEY, value);
      localStorage.setItem(KEY_DATE, new Date().toISOString());
    } catch (e) { /* mode privé : non bloquant */ }
  }
  /* choix : accepter, refuser ou gerer, rien d'autre (la liste de nginx) ; un POST sans corps */
  function compter(choix) {
    if (!COMPTEUR_ACTIF || !navigator.sendBeacon || !/^(accepter|refuser|gerer)$/.test(choix)) return;
    try { navigator.sendBeacon('/_mesure/' + choix); } catch (e) { /* rien */ }
  }
  /* les mesures fermées, après l'accord : un module, une seule fois (il ne pose ses écouteurs qu'une fois par page) */
  function chargerMesures() {
    if (window.__civikMesures || document.querySelector('script[data-mesures]')) return;
    try {
      var m = document.createElement('script');
      m.type = 'module'; m.src = MESURES; m.setAttribute('data-mesures', '');
      document.head.appendChild(m);
    } catch (e) { /* rien */ }
  }

  /* Charge GTM uniquement après consentement explicite (inchangé) */
  function loadGTM() {
    if (window.__civikGtmLoaded) return;
    window.__civikGtmLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var f = document.getElementsByTagName('script')[0];
    var j = document.createElement('script');
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    f.parentNode.insertBefore(j, f);
    chargerMesures();
  }

  var carte = null;

  function fermer() {
    if (!carte) return;
    var el = carte;
    carte = null;
    el.classList.remove('cc-cookies--vue');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 240);
  }

  function decide(value, comment) {
    writeConsent(value);
    if (value === 'granted') loadGTM();
    compter(comment);
    fermer();
  }

  function ouvrir() {
    if (carte) return;
    var dejaAccorde = readConsent() === 'granted';
    carte = document.createElement('section');
    carte.className = 'cc cc-cookies';
    carte.setAttribute('aria-labelledby', 'cc-cookies-titre');
    carte.innerHTML =
        '<p class="cc-cookies__texte"><strong id="cc-cookies-titre">Mesure d’audience.</strong> '
      + 'Avec votre accord, Google Analytics compte les visites pour nous aider à améliorer le site. '
      + 'Si vous refusez, le site fonctionne de la même façon. '
      + '<a href="' + POLICY_URL + '">En savoir plus</a></p>'
      + '<div class="cc-cookies__choix" hidden>'
      + '<label class="cc-cookies__case"><input type="checkbox" name="mesure"' + (dejaAccorde ? ' checked' : '') + '> '
      + '<span>Mesure d’audience (Google Analytics)</span></label>'
      + '<button type="button" class="cc-cookies__btn" data-choix="enregistrer">Enregistrer mon choix</button>'
      + '</div>'
      + '<div class="cc-cookies__actions">'
      + '<button type="button" class="cc-cookies__btn" data-choix="refuser">Refuser</button>'
      + '<button type="button" class="cc-cookies__btn" data-choix="accepter">Accepter</button>'
      + '<button type="button" class="cc-cookies__choisir" data-choix="choisir" aria-expanded="false">Choisir</button>'
      + '</div>';
    document.body.appendChild(carte);
    carte.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-choix]') : null;
      if (!b) return;
      var c = b.getAttribute('data-choix');
      if (c === 'refuser') decide('denied', 'refuser');
      else if (c === 'accepter') decide('granted', 'accepter');   /* le compteur : refuser, accepter (plus bas, enregistrer aussi) */
      else if (c === 'choisir') {
        var panneau = carte.querySelector('.cc-cookies__choix');
        panneau.hidden = !panneau.hidden;
        b.setAttribute('aria-expanded', String(!panneau.hidden));
        if (!panneau.hidden) carte.querySelector('input[name="mesure"]').focus();
      } else if (c === 'enregistrer') {
        var oui = carte.querySelector('input[name="mesure"]').checked;
        decide(oui ? 'granted' : 'denied', oui ? 'accepter' : 'refuser');
      }
    });
    requestAnimationFrame(function () { if (carte) carte.classList.add('cc-cookies--vue'); });
  }

  /* « Gérer les cookies » (pied, tiroir du menu) : rouvre la carte ; le choix déjà fait reste valable jusqu'au nouveau */
  function brancherGerer() {
    var boutons = document.querySelectorAll('[data-cookies-gerer]');
    for (var i = 0; i < boutons.length; i++) {
      boutons[i].addEventListener('click', function () {
        var menu = this.closest ? this.closest('details') : null;
        if (menu) menu.open = false;
        compter('gerer');
        ouvrir();
        if (carte) { var t = carte.querySelector('button'); if (t) t.focus(); }
      });
    }
  }

  /* Le tiroir du menu de la barre commune (details) : Échap le ferme et rend le focus au bouton, un clic au dehors ou
     sur un lien le ferme ; le nom du bouton dit l'état (« Ouvrir le menu », « Fermer le menu »). Sans script, le
     tiroir s'ouvre et se ferme quand même (élément details natif). */
  function brancherMenu() {
    var menus = document.querySelectorAll('.cc-barre__menu');
    for (var i = 0; i < menus.length; i++) {
      (function (menu) {
        var bouton = menu.querySelector('summary');
        menu.addEventListener('toggle', function () {
          if (bouton) bouton.setAttribute('aria-label', menu.open ? 'Fermer le menu' : 'Ouvrir le menu');
        });
        menu.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.cc-tiroir a')) menu.open = false; });
        document.addEventListener('click', function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && menu.open) { menu.open = false; if (bouton) bouton.focus(); }
        });
      })(menus[i]);
    }
  }

  function init() {
    /* la couche commune n'a plus d'apparence sombre : la préférence gardée par l'ancien bouton (soleil et lune) s'efface */
    try { localStorage.removeItem('civik-theme'); } catch (e) { /* rien */ }
    brancherGerer();
    brancherMenu();
    var consent = readConsent();
    if (consent === 'granted') loadGTM();
    else if (consent !== 'denied') ouvrir();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
