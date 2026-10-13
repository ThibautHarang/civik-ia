/* =====================================================================
   L'interrupteur des essais (passe 26, le gel du film, 12/10/2026) : un seul, pour les quatre pages (accueil, Conseil, Atelier,
   Marianne base). Script classique, premier script de la tête de chaque page : il passe avant tout module (les modules lisent
   l'adresse au niveau du module, avant le corps de main.js).
   - ESSAIS = true (maquettes, serveur d'essai, copies de rendu) : rien ne change, chaque clé d'essai garde son effet. Règle du
     film (main.js, validée le 12/10/2026) : une adresse qui porte au moins une de ces clés garde exactement son sens d'avant le
     gel (le harnais de rendu ?eco=0&hd=1, &arret, ?p et les preuves du film du visiteur reçoivent le film en direct à 393 et
     430 ; ?proto=2, 3 ou 4 un lecteur) ; une adresse sans aucune de ces clés se comporte comme la production.
   - ESSAIS = false (la copie installée : seo/outils/installe-refonte.mjs bascule la ligne « var ESSAIS », une occurrence exacte,
     erreur sinon) : les clés de la liste sont retirées de l'adresse (history.replaceState) avant le premier module ; les autres
     paramètres (utm_*, gclid...) restent. Seule film garde un effet ; la page suit la règle par défaut.
   ESSAIS_CLES : le film (42 clés), puis Atelier, Conseil et Marianne base (7). Hors liste, à dessein : film, paramètre de contrat
   (décision D1 du 11/10/2026) : le bouton « Voir le film » de la forme légère rouvre la page avec ?film=1, qui bloque la forme
   légère, et le repli Android en dépend. nom et titre ne sont plus lus nulle part.
   ===================================================================== */
var ESSAIS = false;
var ESSAIS_CLES = ['proto', 'p', 'arret', 'lecture', 'mouvement', 'mesure', 'rapport', 'u1sonde', 'u1tenir', 'ebauche', 'leger', 'plateforme', 'diag', 'masque', 'eco', 'dpr', 'geste', 'porte', 'msaa', 'garde', 'klav', 'oiseau', 'etincelle', 'croquis', 'cvimg', 'ouvrier', 'w2', 'prets', 'purge', 'purgeimg', 'dossier', 'sansN9', 'journal', 'protoq', 'protocodec', 'protocharge', 'protohd', 'p2defil', 'ordre', 'pas', 'amorce', 'nocache', 'controle', 'retenue', 'ecriture', 'variante', 'essai', 'etat', 'jouer'];
(function () {
  if (ESSAIS || !location.search) return;
  try {
    var q = new URLSearchParams(location.search), n = 0;
    ESSAIS_CLES.forEach(function (k) { if (q.has(k)) { q.delete(k); n++; } });
    if (n) { var s = q.toString(); history.replaceState(history.state, '', location.pathname + (s ? '?' + s : '') + location.hash); }
  } catch (e) { /* rien */ }
})();
