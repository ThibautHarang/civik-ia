#!/bin/sh
# Prépare le dossier build/ attendu par generer.js (polices du dépôt, sceau, glyphe et village de nuit du site), puis
# capture les six états de la scène et génère les visuels. À lancer depuis ce dossier : sh preparer.sh
set -e
mkdir -p build scenes3 out
cp ../../../../assets/fonts/inter-latin-var.woff2 ../../../../assets/fonts/poppins-latin-700.woff2 ../../../../assets/fonts/poppins-latin-800.woff2 build/
curl -sL https://civik-ia.fr/commun/img/marianne-glyph.svg -o build/marianne-glyph.svg
curl -sL https://civik-ia.fr/marianne/assets/hero/village-nuit-1600.webp -o build/village-nuit.webp
node capture.js '{"post":[976,860],"carre":[984,700],"story":[952,1020],"x":[580,510]}' 1,2,3,4,5
# l'étape 6 (téléphone, puis la rangée des canaux sous le texte) utilise une table moins haute sur trois formats
node capture.js '{"post":[976,740],"carre":[984,590],"story":[952,920],"x":[580,510]}' 6
node generer.js
