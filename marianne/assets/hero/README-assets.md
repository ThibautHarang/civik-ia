# Visuels du hero de la page Marianne

Ce dossier porte les visuels de la scène « 22 h 47 » de `civik-ia.fr/marianne/`.
Ce fichier n'est pas déployé (le script `deploy-site.sh` écarte les `.md`).

## Ce qui est en place (depuis le 30/09/2026)

Deux images plein cadre de la même scène, au même format (1990 x 1075) :

| Fichier | Rôle |
|---|---|
| `village-jour.avif`, `.webp`, `.jpg` et les déclinaisons `-1600`, `-1200`, `-900` | 17 h 30 : papier crème, encre bleue, ciel clair, soleil, le marché sans ses passants |
| `village-nuit.avif`, `.webp`, `.jpg` et les déclinaisons `-1600`, `-1200`, `-900` | 22 h 47 : bleu nuit, lune, ciel étoilé, marché désert, toutes fenêtres éteintes |
| `lumieres.webp` | planche de six vignettes : les fenêtres allumées, découpées sur les vitres du dessin (elles suivent la pente des façades) |
| `passants.webp` | planche de six vignettes : les passants du marché, découpés de la gravure |

La nuit est posée dessous, le jour dessus : le jour s'efface au défilement. Sur téléphone, la nuit tombe une fois,
toute seule, au chargement. La version `-900` est celle des téléphones, plus compressée.

Les images sont tirées de la gravure maison (`assets/brand/village-grave.jpg`) par le script
`Civik-ia/tools/marianne-hero-art/build.py` (dépôt du socle) :

```bash
python3 tools/marianne-hero-art/build.py <racine du site>
```

Ce que fait le script : il efface le fil lumineux et la fenêtre éclairée de la gravure d'origine ; il retire la
jointure verticale entre les deux panneaux de la gravure et reconstruit la bande par recopie de motifs voisins ;
il met l'éclairage à plat, unit le ciel (de jour comme de nuit) ; il sort les passants du marché et reconstruit
le sol derrière eux ; il efface les aiguilles de l'horloge ; il retourne la scène pour placer la mairie à droite
et remet la plaque « MAIRIE » à l'endroit. `APERCU=1` devant la commande écrit seulement des PNG de contrôle.

Ne sont PAS dans les images, mais posés par la page (`index.html`, dans `.hero__cadre`) :

- les fenêtres (`.lum`, planche `lumieres.webp`), le réverbère et la lanterne qui vacillent, la fenêtre bleue de la mairie ;
- les passants (`.passant`, planche `passants.webp`), qui flânent puis s'en vont au crépuscule ;
- les aiguilles de l'horloge (`.hero__horloge`), qui suivent l'heure de la scène de 17 h 30 à 22 h 47 ;
- l'eau de la fontaine (`.hero__fontaine`) : des traits qui descendent le long des nappes, en SVG ;
- la lueur du couchant, les étoiles qui scintillent et l'étoile filante.

Toutes leurs positions sont en pourcentage de CETTE image : le script les imprime à la fin de son exécution.

## Remplacer par d'autres visuels

1. Garder le format (1990 x 1075, ou le même rapport) et les noms de fichiers, dans les quatre largeurs et les trois formats.
   La mairie doit rester dans le quart droit de l'image, le texte s'écrit à gauche.
2. Recaler ce que la page pose : chaque `<i class="lum">` porte sa position (`--x`, `--y`), son rang dans la planche
   (`--i`) et ses moments d'allumage et d'extinction (`--a`, `--b`, entre 0 et 1) ; l'horloge et la fontaine ont
   leur boîte (`left`, `top`, `width`, `height`) dans le CSS ; les passants leur position (`--l`, `--t`) et leur trajet.
   La fenêtre de la mairie, le réverbère et l'horloge existent deux fois : dans le hero et dans l'appel final.
   Avec une illustration qui n'a ni fontaine ni marché, retirer les blocs correspondants.
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
