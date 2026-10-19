#!/bin/sh
# Prépare le dossier build/ attendu par generer.js (polices du dépôt, sceau, glyphe et village de nuit du site), puis
# capture les six états de la scène et génère les visuels. À lancer depuis ce dossier : sh preparer.sh
set -e
mkdir -p build scenes3 out
cp ../../../../assets/fonts/inter-latin-var.woff2 ../../../../assets/fonts/poppins-latin-700.woff2 ../../../../assets/fonts/poppins-latin-800.woff2 build/
curl -sL https://civik-ia.fr/commun/img/marianne-glyph.svg -o build/marianne-glyph.svg
curl -sL https://civik-ia.fr/marianne/assets/hero/village-nuit-1600.webp -o build/village-nuit.webp
node capture.js '{"post":[976,780],"carre":[984,590],"story":[952,960],"x":[560,500]}'
node generer.js
