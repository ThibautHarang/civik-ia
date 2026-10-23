/* Mention de l'article 50.4 du règlement européen sur l'IA sur les articles de civik-ia.fr (23/10/2026), avec
   /css/mention-ia.css ; posée par tools/couche-commune/poser.mjs. Le tampon déplie sa phrase au survol de la souris, au
   focus clavier et au toucher, et aria-expanded dit toujours si elle est dépliée ; Échap, un second appui ou un appui
   ailleurs la replie. La phrase est dans le HTML de la page : ce script ne fait que l'ouvrir et la fermer. */
(function () {
  'use strict';
  document.documentElement.classList.add('mia-js');
  var tampons = document.querySelectorAll('.mia__tampon');
  for (var i = 0; i < tampons.length; i++) brancher(tampons[i]);

  function brancher(tampon) {
    var bouton = tampon.querySelector('.mia__bouton');
    if (!bouton) return;
    var etat = { epingle: false, survol: false, focus: false };
    function poser() { bouton.setAttribute('aria-expanded', String(etat.epingle || etat.survol || etat.focus)); }
    function fermer() { etat.epingle = etat.survol = etat.focus = false; poser(); }
    function ouvert() { return bouton.getAttribute('aria-expanded') === 'true'; }

    bouton.addEventListener('click', function (e) {
      // clavier ou lecteur d'écran (detail 0) : l'appui ouvre ou ferme ; souris ou doigt : il épingle ou ferme
      if (e.detail === 0 ? ouvert() : etat.epingle) fermer();
      else { etat.epingle = true; poser(); }
    });
    tampon.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { etat.survol = true; poser(); } });
    tampon.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { etat.survol = false; poser(); } });
    bouton.addEventListener('focus', function () {
      var clavier = true;
      try { clavier = bouton.matches(':focus-visible'); } catch (x) { /* navigateur sans :focus-visible */ }
      if (clavier) { etat.focus = true; poser(); }
    });
    bouton.addEventListener('blur', function () { etat.focus = false; etat.epingle = false; poser(); });
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && ouvert()) fermer();
    });
    document.addEventListener('click', function (e) {
      if (etat.epingle && !tampon.contains(e.target)) fermer();
    });
  }
})();
