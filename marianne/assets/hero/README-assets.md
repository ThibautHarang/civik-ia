# Visuels du hero de la page Marianne

Ce dossier porte les visuels de la scène « 22 h 47 » de `civik-ia.fr/marianne/`.
Ce fichier n'est pas déployé (le script `deploy-site.sh` écarte les `.md`).

## Ce qui est en place aujourd'hui (provisoire)

Les visuels définitifs (la maquette du village sur son îlot) ne sont pas encore produits.
En attendant, la page utilise une vignette tirée de la gravure maison
(`assets/brand/village-grave.jpg`, la place de la mairie), teintée en deux états :

| Fichier | Rôle | Poids |
|---|---|---|
| `village-jour.webp` (1920 x 1080) | état de départ, 17 h 30, lumière dorée | 94 Ko |
| `village-jour-960.webp` | même image, petits écrans | 32 Ko |
| `village-jour.jpg` | repli pour les navigateurs sans WebP | 147 Ko |
| `village-nuit.webp` (1920 x 1080) | état d'arrivée, 22 h 47, la fenêtre de la mairie reste éclairée | 42 Ko |
| `village-nuit-960.webp` | même image, mobile et appel final | 13 Ko |
| `village-nuit.jpg` | repli | 84 Ko |

Les deux images ont le même cadrage et le même fond, exactement `#0A0F2C`.
La page les superpose et fond l'une dans l'autre au défilement : pas besoin de vidéo pour que la scène fonctionne.

Elles sont fabriquées par `Civik-ia/tools/marianne-hero-art/build.py` (dépôt du socle) :

```bash
python3 tools/marianne-hero-art/build.py <racine du site>
```

Les fenêtres qui s'allument à la tombée du jour puis s'éteignent une à une, et le halo bleu de la mairie,
ne sont pas dans les images : ce sont des éléments HTML posés dessus (bloc `.hero__lumieres` de `index.html`),
calés en pourcentage sur CETTE gravure.

## Fichiers attendus pour la version définitive

À produire par Thibaut (prompts dans l'annexe du brief de refonte), puis à déposer ici avec ces noms exacts :

| Fichier | Format |
|---|---|
| `village-jour.webp` + `village-jour.jpg` | 2560 px de large, 16:9, fond `#0A0F2C` uni |
| `village-nuit.webp` + `village-nuit.jpg` | même cadrage, même fond |
| `village-jour-960.webp`, `village-nuit-960.webp` | les mêmes, réduites à 960 px de large |
| `hero-scrub.mp4` (H.264) + `hero-scrub.webm` | 6 s, du jour à la nuit, moins de 4 Mo, sans piste audio |

Encodage conseillé de la vidéo (images clés rapprochées, indispensable pour un défilement fluide) :

```bash
ffmpeg -i hero.mp4 -vf "scale=1920:-2" -c:v libx264 -g 2 -crf 26 -preset slow -an -movflags +faststart hero-scrub.mp4
ffmpeg -i hero.mp4 -vf "scale=1920:-2" -c:v libvpx-vp9 -g 2 -crf 34 -b:v 0 -an hero-scrub.webm
```

## Le jour où les visuels définitifs arrivent

1. Remplacer les six images en gardant les noms de fichiers.
2. Dans `marianne/index.html`, supprimer le bloc `<div class="hero__lumieres" data-art="gravure">` du hero
   (ses lumières sont calées sur la gravure, elles tomberaient à côté sur la maquette).
   Garder ou recaler le halo `.lum--mairie` de l'appel final (`.fin__art`).
3. Pour activer la vidéo : déposer `hero-scrub.mp4` et `hero-scrub.webm`, puis passer `data-video="0"` à `data-video="1"`
   sur `<div class="hero__art">`. La vidéo se charge après l'image, et prend le relais quand elle est prête.
   Sans elle, ou tant qu'elle charge, les deux images font le travail.
   Le navigateur lit d'abord le MP4 ; le WebM est facultatif. Testé le 30/09/2026 avec une vidéo d'essai : le MP4 encodé comme
   ci-dessus se laisse parcourir dans les deux sens sans accroc ; le WebM encodé avec la commande VP9 ci-dessus a, lui, provoqué
   une erreur de décodage dans Chrome. Si la vidéo plante ou se bloque, la page revient d'elle-même aux deux images.
4. Si le fond de la vidéo n'est pas exactement `#0A0F2C` (les encodeurs décalent souvent les couleurs d'un ou deux points),
   un rectangle devient visible autour du village. Le corriger à l'encodage, ou adoucir les bords par un masque CSS
   sur `.hero__art` (`mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, #000 70%, transparent 100%)`).
5. Régler la taille du visuel : propriété `width` de `.hero__art` dans le bloc `@media (min-width:900px)`.
6. Au déploiement : bump de `CACHE_NAME` dans `service-worker.js` (règle 4 du socle).

## Polices

Les polices de la page sont dans `assets/fonts/` (Inter, Poppins, Fraunces, sous-ensemble latin, licence SIL Open Font License).
Elles ne servent pour l'instant qu'à la page Marianne ; les autres pages du site appellent encore Google Fonts.

Note Kalendia : 432 (carnet Civik-ia), points à trancher avant mise en ligne.
