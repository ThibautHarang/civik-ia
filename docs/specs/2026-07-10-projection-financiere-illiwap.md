# Projection financière — Partenariat Illiwap × Marianne

**Date :** 10 juillet 2026
**Auteur :** Claude (associé technique) + Thibaut Harang
**Complément de :** `2026-07-09-etude-partenariat-illiwap.md`
**Objet :** Chiffrer les scénarios pour calibrer l'intérêt réel du deal et les lignes rouges de négociation.

---

## 1. Hypothèses de base

| Paramètre | Valeur | Justification |
|---|---|---|
| Base Illiwap adressable | **1 500 communes** | Chiffre vérifié 2021-2022 (JdE). Probablement 2 000-3 000 en 2026 → hypothèse volontairement conservatrice. |
| Mix clients via Illiwap | 85 % Rural / 12 % Moyen / 3 % Grand | La base Illiwap est majoritairement rurale (même cible que nous). |
| **ARPU pondéré** | **55 €/mois HT** | 0,85×49 + 0,12×99 + 0,03×199 ≈ 59 €, arrondi bas à 55 € (remises pilote). |
| Mise en service | 99 € one-shot | Grille actuelle (offerte aux Fondateurs — supposée facturée via partenaire). |
| Churn annuel | 8 % | Les collectivités churnnent peu une fois l'outil adopté (budgets annuels). |
| Coût variable / commune | 5 €/mois | API Mistral + quote-part OVH. Marge brute ≈ 91 %. |
| Vente directe (référence) | 12 communes fin A1, 35 fin A2, 70 fin A3 | Contrainte fondateur 3-4 h/semaine ; campagne 22h47 + réseau Mandin. |
| CAC vente directe | **500-750 €/client** | ~10-15 h fondateur par client signé (prospection, démo, relances, closing), valorisées 50 €/h. C'est le chiffre-pivot de toute la négo. |

> **Le chiffre qui commande tout : à 49 €/mois, un client rapporte ~528 €/an de marge brute.** En direct, le CAC absorbe donc quasiment la première année. Toute commission partenaire inférieure à ce CAC est rationnelle — c'est ce qui définit nos lignes rouges (§5).

---

## 2. Les quatre scénarios sur 3 ans

Tous les scénarios **incluent la vente directe qui continue** (elle n'est jamais suspendue). MRR net = après revenue share et coûts variables.

### Scénario 0 — Vente directe seule (référence)

| | Fin A1 | Fin A2 | Fin A3 |
|---|---|---|---|
| Communes | 12 | 35 | 70 |
| MRR brut | 660 € | 1 925 € | 3 850 € |
| **MRR net** | **600 €** | **1 750 €** | **3 500 €** |
| **ARR net** | **7,2 k€** | **21 k€** | **42 k€** |

Lecture : seul, avec 3-4 h/semaine, on plafonne autour de 40 k€ d'ARR à 3 ans. Viable comme side-business, pas comme société.

### Scénario A — Apporteur d'affaires (commission 20 % la 1ʳᵉ année seulement)

Hypothèse : Illiwap fait des intros mais ne « vend » pas (10-12 €/mois de commission par commune ne motive pas une force de vente). +30 communes A1, +40 A2, +40 A3 via le canal.

| | Fin A1 | Fin A2 | Fin A3 |
|---|---|---|---|
| Communes (partenaire + direct) | 42 | 100 | 158 |
| MRR brut | 2 310 € | 5 500 € | 8 690 € |
| Commission versée (moy./mois) | −250 € | −330 € | −330 € |
| **MRR net** | **1 850 €** | **4 670 €** | **7 570 €** |
| **ARR net** | **22 k€** | **56 k€** | **91 k€** |

Lecture : **×2 vs direct seul**, pour un contrat léger et zéro dev. C'est le bon véhicule de pilote, mais ça plafonne : sans intégration ni offre packagée, Illiwap n'a pas de raison de pousser.

### Scénario B — Bundle co-vendu intégré (revenue share 30 % perpétuel) ★ scénario cible

Hypothèse : offre packagée « Illiwap + Marianne », vendue par leurs commerciaux, lancée au Salon des Maires. Taux d'équipement de la base : 5 % fin A1 → 13 % fin A2 → 21 % fin A3 (80 / 200 / 320 communes). Marge nette Civik-ia : 55 × 0,70 − 5 = **33,5 €/commune/mois**.

| | Fin A1 | Fin A2 | Fin A3 |
|---|---|---|---|
| Communes via Illiwap | 80 | 200 | 320 |
| Communes directes | 12 | 35 | 70 |
| MRR brut total | 5 060 € | 12 925 € | 21 450 € |
| Reversé à Illiwap | −1 320 € | −3 300 € | −5 280 € |
| **MRR net Civik-ia** | **3 280 €** | **8 450 €** | **14 220 €** |
| **ARR net Civik-ia** | **39 k€** | **101 k€** | **171 k€** |
| **Revenu annuel Illiwap** | **16 k€** | **40 k€** | **63 k€** |

Lecture : **×4 vs direct seul.** Et la dernière ligne est votre argument de vente à Diagram : **40-60 k€/an de revenu nouveau, sans un euro de R&D, sur une base déjà acquise** — soit +4 à +8 % de CA sur l'activité Illiwap (~500 k€-1 M€) à coût marginal quasi nul. C'est un chiffre qui parle à un groupe autofinancé.

### Scénario C — White-label (50 % du prix à Illiwap, ils facturent)

Hypothèse généreuse : Illiwap pousse « son » IA comme fonctionnalité maison → taux d'équipement supérieur : 150 / 350 / 550 communes. Marge nette Civik-ia : 55 × 0,50 − 5 = **22,5 €/commune/mois**.

| | Fin A1 | Fin A2 | Fin A3 |
|---|---|---|---|
| Communes via Illiwap | 150 | 350 | 550 |
| **MRR net Civik-ia (canal Illiwap)** | 3 375 € | 7 875 € | 12 375 € |
| **ARR net total (avec direct)** | **48 k€** | **116 k€** | **190 k€** |

Lecture — **c'est le point clé de la négo** : même avec un volume supposé **+70 % supérieur**, le white-label ne rapporte que ~10 % de plus que le bundle à 30 %… en abandonnant la marque, la relation client, et en offrant à Diagram la meilleure position pour internaliser. **Le white-label ne devient financièrement intéressant que si Illiwap garantit plus de ~1,5× le volume du scénario B — sinon c'est un mauvais deal déguisé en gros deal.**

---

## 3. Sensibilité du scénario cible (B, 30 % perpétuel)

| Taux d'équipement de la base Illiwap | Communes fin A3 | ARR net fin A3 (avec direct) |
|---|---|---|
| Pessimiste : 2 % → 5 % → 8 % | 120 | **90 k€** |
| **Central : 5 % → 13 % → 21 %** | **320** | **171 k€** |
| Optimiste : 8 % → 18 % → 30 % | 450 | **223 k€** |

Même le scénario pessimiste **double** la trajectoire directe seule. Le point mort du partenariat (dev d'intégration ~2-3 semaines de travail Claude + temps de négo) est atteint **dès ~15-20 communes signées** — c'est-à-dire pendant le pilote.

---

## 4. Le problème structurel à connaître avant de négocier

**À 49 €/mois, le deal est petit pour Diagram si le volume ne suit pas.** 30 % de 55 € = 16,5 €/mois/commune. Pour que ça pèse chez eux (>40 k€/an), il faut ~200 communes équipées. D'où trois conséquences tactiques :

1. **Ne pas négocier le pourcentage, négocier le volume.** Leur céder 30-35 % ne nous coûte presque rien par rapport à notre CAC direct (voir §5) ; ce qui compte, c'est leur engagement à équiper la base (objectifs chiffrés, offre packagée, présence Salon des Maires).
2. **Envisager un tarif bundle légèrement majoré plutôt que remisé.** La brique Marianne facturée sur la facture Illiwap existante (fournisseur déjà référencé, pas de nouveau dossier pour la mairie) supporte un prix de 59-69 €/mois là où en direct nous devons rester à 49 €. Une majoration de 10-20 € finance intégralement le revenue share : **le partenariat peut être neutre sur notre marge unitaire.**
3. **Refuser tout frais d'entrée.** Diagram est habitué aux référencements commerciaux type Smart City Galaxy (catalogues payants). Si un « frais de référencement » ou un minimum garanti à notre charge est proposé : non. C'est nous qui apportons le produit ; le cash doit couler des communes vers nous, jamais de nous vers Diagram.

---

## 5. Lignes rouges de négociation (dérivées des chiffres)

| Sujet | Position d'ouverture | Ligne rouge | Justification chiffrée |
|---|---|---|---|
| **Commission apporteur (pilote)** | 15 % 1ʳᵉ année | **25 % 1ʳᵉ année max** | 25 % × 12 mois = 165 €/client, soit 3-4× moins que le CAC direct (500-750 €). |
| **Revenue share bundle (perpétuel)** | 25 % | **35 % max** | À 35 % perpétuel, 3 ans de reversement ≈ 690 € ≈ CAC direct. Au-delà, le canal devient plus cher que la prospection directe. À 40 %+, refuser. |
| **White-label** | Non proposé | **Seulement si volume garanti ≥ 1,5× le scénario bundle ET clause de non-réplication ≥ 24 mois** | §2-C : sans ce volume, le white-label rapporte moins que le bundle avec tous les risques en plus. |
| **Exclusivité (Marianne = seul chatbot du catalogue Illiwap)** | Accordée 18 mois | **Conditionnée : caduque si < 50 communes équipées/an** | 50 communes/an = le minimum pour que l'exclusivité qu'on leur donne (renoncer à IntraMuros, ~8 000 communes) soit payée. |
| **Exclusivité inverse (Illiwap = notre seul partenaire app)** | 12 mois max | **Jamais sans l'objectif de volume ci-dessus** | IntraMuros est notre BATNA ; y renoncer gratuitement détruit notre levier. |
| **Prix public** | Grille maintenue (49/99/199 €) | **Plancher 39 €/mois en bundle, uniquement si > 200 communes** | Sous 39 €, la marge nette après share et coûts passe sous 22 €/commune : le volume ne compense plus. |
| **Frais d'entrée / référencement** | — | **0 €, non négociable** | §4.3. |
| **Propriété RAG + bases de connaissances** | Civik-ia, non négociable | Idem | C'est l'actif qui empêche l'internalisation. |
| **Facturation** | Civik-ia facture la commune (pilote), Illiwap facture en bundle accepté | Peu importe qui facture, **le contrat de la brique IA nomme Civik-ia** | Garder la relation juridique avec le client final. |

**BATNA à garder en tête pendant toute la négo :** IntraMuros (~8 000 communes, infrastructure partenaires déjà en place). Le même scénario B appliqué à leur base, même à un taux d'équipement moitié moindre, donne un potentiel supérieur à Illiwap. Ne jamais laisser Diagram penser qu'ils sont notre seule option — parce que c'est factuellement faux.

---

## 6. Ce qu'il faut retenir (résumé pour la négo)

1. **L'enjeu du deal à 3 ans : passer de ~42 k€ à ~170 k€ d'ARR net** (scénario central), c'est-à-dire transformer Civik-ia de side-business en société finançable — sans levée.
2. **Pour eux : 40-60 k€/an de revenu nouveau à R&D nulle.** C'est le chiffre à mettre sur la table au premier rendez-vous, pas nos besoins à nous.
3. **Céder du pourcentage, exiger du volume.** Jusqu'à 35 % perpétuel, le canal reste moins cher que notre prospection directe. En dessous de 50 communes/an, aucune exclusivité.
4. **Le white-label est un piège arithmétique** : il ne bat le bundle qu'à volume ≥ 1,5×, avec tous les risques d'internalisation en prime.
5. **Zéro cash sortant, propriété du RAG, co-branding** : les trois non-négociables.
6. **Séquence : pilote apporteur (25 % an 1, 10 communes, 3 mois) → si conversion > 30 % des communes présentées, bundle à 30 % avec objectifs de volume.** Chaque étape a son critère de passage chiffré — pas d'engagement long avant la preuve.

---

## Limites

- La taille réelle de la base Illiwap 2026 est inconnue (hypothèse : 1 500, chiffre 2021-22) ; si elle est à 3 000, tous les scénarios partenariat doublent — raison de plus pour poser la question au premier rendez-vous.
- Les taux d'équipement (5→21 %) sont des hypothèses de marché, calées sur des dynamiques d'attach-rate d'options SaaS B2G, pas sur des données Illiwap.
- La trajectoire directe (12/35/70) suppose le maintien du rythme de lancement actuel (campagne 22h47, prospects Rigny-le-Ferron et Lunay convertis).
- Projection en marge nette de coûts variables : ne déduit ni les coûts fixes (VPS, outils, comptable ~2-4 k€/an) ni la rémunération du fondateur.
