# Carrousel « Le cerveau de Marianne »

Sept visuels tirés de la section « Le cerveau de Marianne » de la page `/marianne/` (les six étapes de la base de
connaissances, puis un visuel de contact pour déployer Marianne dans une collectivité). Les scènes des six étapes sont
des captures de l'animation réelle du site (`/marianne/base.js`), à chacun de ses six états ; les titres et les textes
sont ceux de la page, mot pour mot. Le septième visuel reprend la section de fin de la page (nuit, sceau, bouton clair).

Rendu en 2x (chaque image fait le double des dimensions nominales du réseau).

| Dossier | Réseau | Format nominal | Fichier rendu |
| --- | --- | --- | --- |
| `linkedin/` | LinkedIn, carrousel (document PDF) | 1080 x 1350 (4:5) | 2160 x 2700, plus le PDF à publier |
| `instagram-post/` | Instagram, publication carrousel | 1080 x 1350 (4:5) | 2160 x 2700 |
| `instagram-story/` | Instagram, story | 1080 x 1920 (9:16) | 2160 x 3840, zones sûres respectées (texte entre 200 px et 250 px des bords) |
| `facebook/` | Facebook, carrousel | 1080 x 1080 (1:1) | 2160 x 2160 |
| `x/` | X (Twitter) | 1200 x 675 (16:9) | 2400 x 1350 ; X limite à 4 images par message, prévoir deux messages (1 à 4, puis 5 à 7) ou un fil |

Sur LinkedIn, publier le PDF `linkedin/carrousel-cerveau-marianne-linkedin.pdf` comme document : c'est lui qui donne
le carrousel à faire défiler.

## Regénérer

Dans `outils/` : `sh preparer.sh` (Node avec Playwright et Chromium, et Python avec Pillow pour le PDF). `capture.js`
charge la page en ligne, injecte un accès à la fonction de pose du script `base.js` et photographie la table à chaque
état ; `generer.js` compose les visuels (textes, tailles et mises en page par réseau en tête du fichier). Le PDF
LinkedIn s'assemble ensuite avec Pillow à partir des sept PNG du dossier `linkedin/`.
