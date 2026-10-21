/* Route d'envoi des formulaires du livre blanc et de la page de démonstration (21/10/2026, D185), même contrat que
   commun/pages/pages.js pour les pages de la refonte (passe P8). La route api.civik-ia.fr passe d'abord, avec le nom du
   formulaire, la page et le délai écoulé depuis le chargement de la page (la route tient un délai minimal contre les robots) ;
   sur toute réponse autre qu'un 200 portant le JSON de la route, une coupure réseau ou un silence de 9 s, le même envoi repart
   vers Formspree, sans les champs ajoutés. La réponse dit si l'accusé de réception au visiteur est parti (accuse) : la page
   n'en parle que dans ce cas. Interrupteur : ROUTE à '' remet Formspree seul.
   window.civikEnvoyer(nomFormulaire, donnees (FormData), urlSecours) rend { ok, route, accuse }. */
(function () {
  'use strict';
  var ROUTE = 'https://api.civik-ia.fr/api/site/contact';
  var DELAI_ROUTE = 9000;
  var DELAI_SECOURS = 10000;
  var t0 = Date.now();

  function depuisLaPage() {
    return Math.round(window.performance && performance.now ? performance.now() : Date.now() - t0);
  }
  function copier(donnees) {
    var d = new FormData();
    donnees.forEach(function (v, k) { d.append(k, v); });
    return d;
  }
  // lire(r) s'exécute avant la levée du minuteur : un corps de réponse qui ne vient pas reste borné par le délai
  function poster(url, corps, delai, sansCookies, lire) {
    var ctl = 'AbortController' in window ? new AbortController() : null;
    var minuteur = ctl ? setTimeout(function () { ctl.abort(); }, delai) : 0;
    var options = { method: 'POST', body: corps, headers: { Accept: 'application/json' }, signal: ctl ? ctl.signal : undefined };
    if (sansCookies) options.credentials = 'omit';
    return fetch(url, options).then(function (r) { return lire ? lire(r) : r; }).then(
      function (v) { clearTimeout(minuteur); return v; },
      function (e) { clearTimeout(minuteur); throw e; });
  }
  function parRoute(formulaire, donnees) {
    if (!ROUTE) return Promise.resolve(null);
    var d = copier(donnees);
    d.set('formulaire', formulaire);
    d.set('page', location.pathname);
    d.set('_delai', String(depuisLaPage()));
    return poster(ROUTE, d, DELAI_ROUTE, true, function (r) {
      if (r.status !== 200) return null;
      // un 200 sans le JSON de la route (portail, mandataire) n'est pas un envoi : repli
      return r.json().then(
        function (j) { return j && j.ok === true ? { ok: true, route: true, accuse: !!j.accuse } : null; },
        function () { return null; });
    }).then(null, function () { return null; });
  }

  window.civikEnvoyer = function (formulaire, donnees, secours) {
    return parRoute(formulaire, donnees).then(function (res) {
      if (res) return res;
      return poster(secours, copier(donnees), DELAI_SECOURS, false, null).then(
        function (r) { return { ok: r.ok, route: false, accuse: false }; },
        function () { return { ok: false, route: false, accuse: false }; });
    });
  };
})();
