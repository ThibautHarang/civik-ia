# Notes d'édition de la page Marianne

Ce fichier n'est pas déployé (`deploy-site.sh` écarte les `.md`). Il garde les décisions et les mises en garde
qui étaient écrites en commentaire dans `index.html` : le code source d'une page publique se lit d'un clic, elles
n'avaient rien à y faire. À relire avant de modifier un texte de la page.

Décisions de Thibaut du 30/09/2026 et avis de la DAJF du même jour
(`00-Ecosysteme/avis/2026-09-30-dajf-page-marianne-site-seuil-parrainage.md`).

- Tranche par Thibaut le 30/09/2026 : « chaque nuit » convient. Etat reel (ADR 0048) : la couche site est relue chaque nuit, et le lecteur ne lit aujourd'hui que les sites WordPress et les PDF natifs. Ne pas ecrire « en temps reel » pour le site ; seule l'alerte publiee depuis l'espace mairie est immediate.
- Offre de creation de site (Thibaut, 30/09/2026) : titre et texte de la DAJF, encart publie des maintenant pour tester le marche ; l'objet social elargi est en cours de signature. Aucun prix affiche. Ne jamais ecrire « conforme RGAA » ni promettre un delai : le devis fixe le perimetre.
- [À CONFIRMER] Coherence avec la question de la FAQ « Et si l'IA se trompe ? », et remontee de la question dans le tableau de bord (« zones de doute » du cockpit).
- Valide par Thibaut le 30/09/2026. « Sur votre site » : ce qui est servi aujourd'hui est un bouton et un onglet qui ouvrent Marianne (page dediee, iframe, PWA). La bulle de conversation integree (widget JS) est en construction (table des canaux du socle). Le texte ci-dessous ne promet que le bouton et l'onglet.
- Mention Meta (regle de coherence souverainete). « en Europe » et non « en France » : le datacenter OVH utilise est en Allemagne (CONTEXT.md, audit du 30/09/2026). Valide par Thibaut le 30/09/2026.
- « Chaque nuit », valide par Thibaut le 30/09/2026 : voir la note de la section Connaissance.
- Texte de la DAJF (avis du 30/09/2026, 00-Ecosysteme/avis/2026-09-30-dajf-page-marianne-site-seuil-parrainage.md). Le seuil verifie sur Legifrance le 30/09/2026 est de 60 000 € HT (R2122-8, depuis le 01/04/2026). Le montant n'est pas ecrit dans la page : il change, et Thibaut n'y tient pas. Ne pas reecrire « seuil des marches publics » (tout contrat d'une commune est un marche public) ni « un simple bon de commande suffit ».
- 6.11 : « 100 % européen » : titre conserve (Thibaut, 30/09/2026). Les sous-traitants de Mistral n'ont pas ete relus (INCIDENTS.md). Hebergement ecrit « en Europe » (datacenter OVH en Allemagne), jamais « en France ».
- 6.12 : Grille reprise mot pour mot. Une seule ligne retiree, dans l'offre Engagement (canal qui n'existe pas).
- Ordre des images : posee au-dessus et devoilee plus tard, l'image de nuit retardait le LCP de plusieurs secondes sur telephone (6,3 s mesurees le 30/09/2026).

Règles d'écriture de la page : vouvoiement, pas de tiret cadratin, pas d'italique, pas de point à la fin d'un
titre ni d'un bloc, aucun nom de commune réelle (Villeneuve-les-Ormes est fictive), hébergement « en Europe »,
« seuil de mise en concurrence » et jamais « seuil des marchés publics ». Statuts des canaux : `MARIANNE_CHANNELS`
en tête de `marianne.js`. Visuels du hero : `assets/hero/README-assets.md`.
