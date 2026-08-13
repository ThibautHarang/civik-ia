# Site civik-ia.fr

Site vitrine de Civik-ia, Plateforme d'Intelligence Citoyenne pour les
mairies francaises. Pages statiques, sans framework ni etape de build.

## Structure

- `index.html` : page d'accueil.
- `marianne/`, `lauria/` : pages des marques produit.
- `chatbot-commune-rurale.html`, `demarches-en-ligne-commune.html`,
  `campagnes-citoyennes.html` et pages voisines : contenus SEO.
- `legal/` : mentions, RGPD, conditions.
- `assets/`, `js/`, `icons/` : ressources partagees.
- `brive/`, `aynac/` et dossiers de villes : pages d'appui des demonstrations.
- `service-worker.js` : cache PWA. La constante `CACHE_NAME` se bumpe a
  chaque deploiement d'asset statique, sinon les navigateurs servent
  l'ancienne version.

## Conventions

- Casing de marque strict : Civik-ia (jamais CIVIK-IA, CivikIA ni Civik IA).
- Zero tiret cadratin dans la copy visible, entites HTML comprises.
- Responsive verifie a 375 px avant tout deploiement de page.
- `site-civik-ia.html` est un simple renvoi vers la racine, conserve pour
  les anciennes URL indexees.

Le deploiement passe par un script interne. Ce depot ne contient ni
secrets ni configuration serveur.
