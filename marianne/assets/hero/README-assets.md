# Visuels du hero de la page Marianne

Ce dossier porte les visuels de la scène « 22 h 47 » de `civik-ia.fr/marianne/`.
Ce fichier n'est pas déployé (le script `deploy-site.sh` écarte les `.md`).

## Ce qui est en place (depuis le 30/09/2026)

Deux images plein cadre de la même scène, au même format (1990 x 1075) :

| Fichier | Rôle |
|---|---|
| `village-jour.avif`, `.webp`, `.jpg` et les déclinaisons `-1600`, `-1200` | 17 h 30 : papier crème, encre bleue, ciel clair, soleil, le marché et ses passants |
| `village-nuit.avif`, `.webp`, `.jpg` et les déclinaisons `-1600`, `-1200` | 22 h 47 : bleu nuit, lune, toutes fenêtres éteintes |

La page les superpose et fond la nuit sur le jour au défilement. Les deux images couvrent tout l'écran ;
quand l'écran est moins large que l'image, elle reste calée sur la mairie.

Elles sont tirées de la gravure maison (`assets/brand/village-grave.jpg`) par le script
`Civik-ia/tools/marianne-hero-art/build.py` (dépôt du socle) :

```bash
python3 tools/marianne-hero-art/build.py <racine du site>
```

Ce que fait le script : il efface le fil lumineux et la fenêtre éclairée de la gravure d'origine, met l'éclairage à plat
(la gravure est nocturne d'un côté, diurne de l'autre), nettoie le ciel de jour, retourne la scène pour placer la mairie
à droite et remet la plaque « MAIRIE » à l'endroit.

Ne sont PAS dans les images, mais posés par la page (blocs `.hero__lumieres` et `.hero__etoiles` de `index.html`) :
les fenêtres qui s'allument à la tombée du jour puis s'éteignent une à une, la fenêtre bleue de la mairie,
la lueur du couchant, les étoiles qui scintillent et l'étoile filante. Leurs positions sont en pourcentage de CETTE image.

## Remplacer par d'autres visuels

1. Garder le format (1990 x 1075, ou le même rapport) et les noms de fichiers, dans les trois largeurs et les trois formats.
   La mairie doit rester dans le quart droit de l'image, le texte s'écrit à gauche.
2. Recaler les lumières : dans `index.html`, chaque `<i class="lum">` porte sa position (`--x`, `--y`) et ses moments
   d'allumage et d'extinction (`--a`, `--b`, entre 0 et 1). La fenêtre de la mairie est `.lum--mairie`
   (une occurrence dans le hero, une dans l'appel final).
3. Régler le cadrage : `.hero__cadre` dans le bloc `@media (min-width:900px)` (valeur `.78` : part du débord rognée à gauche).

## Vidéo (facultative)

Le code sait remplacer les deux images par une vidéo parcourue au défilement :
déposer `hero-scrub.mp4` (H.264, 6 s, du jour à la nuit, moins de 4 Mo, sans piste audio), puis passer
`data-video="0"` à `data-video="1"` sur `<div class="hero__art">`. Encodage conseillé (images clés rapprochées) :

```bash
ffmpeg -i hero.mp4 -vf "scale=1920:-2" -c:v libx264 -g 2 -crf 26 -preset slow -an -movflags +faststart hero-scrub.mp4
```

Testé le 30/09/2026 avec une vidéo d'essai : le MP4 se laisse parcourir dans les deux sens ; un WebM VP9 encodé avec
`-g 2` a provoqué une erreur de décodage dans Chrome, il vaut mieux s'en passer. Si la vidéo plante ou se bloque,
la page revient d'elle-même aux deux images.

## Polices

Les polices de la page sont dans `assets/fonts/` (Inter et Poppins, sous-ensemble latin, licence SIL Open Font License).
Elles ne servent pour l'instant qu'à la page Marianne ; les autres pages du site appellent encore Google Fonts.

## Au déploiement

Bump de `CACHE_NAME` dans `service-worker.js` (règle 4 du socle).

Note Kalendia : 432 (carnet Civik-ia).
