# Roadmap de Lancement Civik-ia — Spec complète

**Date :** 10 avril 2026
**Auteur :** Claude (associé technique) + Thibaut Harang (fondateur)
**Statut :** Approuvé
**Horizon :** 6 sprints — 10 avril au 22 mai 2026

---

## Contexte & Diagnostic

### Situation au 10 avril 2026
- **Phase :** Pré-lancement, 0 client, 0 MRR
- **SASU :** Certificat dépôt reçu, statuts Qonto reçus. Reste : annonce légale + immatriculation INPI (~2 semaines)
- **Backend :** FastAPI live sur VPS OVH (135.125.175.88), 5 endpoints, RAG + Mistral, 2 communes chargées
- **Frontend :** Site marketing live (civik-ia.fr), démo interactive (demo.html), PWA + prompt intelligent
- **Marketing :** Campagne 22h47 prête (visuels, posts, emails, flyer, deck), pas encore lancée
- **Legal :** CGV, RGPD, CGU, bon de commande — tout fait
- **Prospects chauds :** Rigny-le-Ferron (démo livrée, données vérifiées), Lunay (en attente signature)
- **Contrainte fondateur :** 3-4h/semaine (poste directeur chez Omedys en parallèle)

### Bloquants identifiés (par ordre de priorité)
1. **Marketing non lancé** — Tous les assets sont prêts mais Buffer/RS pas configurés
2. ~~**SASU non immatriculée**~~ ✅ **RÉSOLU** — Immatriculée 13/04/2026 (SIREN 103 568 416, RCS Narbonne). Reste à récupérer SIRET complet via avis INSEE.
3. **Widget JS inexistant** — Le mode de déploiement principal (pitch "5 min") n'est pas codé
4. **Dashboard sans backend** — Aucun endpoint auth ni API dashboard
5. **Push notifications absentes** — Phase 2 mais différenciateur fort

### Principe directeur
> Chaque heure de Thibaut doit générer du pipeline ou du revenu.
> Les tâches techniques sont pour Claude. Le job de Thibaut : prospecter, valider, closer.

---

## Sprint 0 — "Teasing" (10-16 avril)

### Objectif
Lancer la machine marketing pendant que la SASU se finalise. Créer de la curiosité autour de Civik-ia.

### Thibaut (1h total)
- [ ] **Annonce légale** : lancer via Legalstart ou service dédié
- [ ] **Buffer** : créer un compte gratuit, connecter LinkedIn + Instagram + Facebook + X
- [ ] **Programmer les posts semaine 1** : utiliser `03-Marketing/semaine1-teasing-22h47.html` — copier les textes dans Buffer
- [ ] **Signature email** : appliquer `03-Marketing/signature-email-civik-ia.html` dans Apple Mail

### Claude (autonome)
- Aucun dev nécessaire — tout est déjà prêt côté assets marketing

### Livrable
Le teasing "22h47" tourne sur 4 réseaux sociaux dès le 14 avril.

### Critère de succès
- 4 posts programmés (1 par plateforme)
- Buffer configuré et fonctionnel
- Annonce légale déposée

---

## Sprint 1 — "Dashboard MVP" (17-23 avril)

### Objectif
Permettre au maire/DGS de se connecter et voir les statistiques de son chatbot. Plus impressionnant en démo qu'un widget, et indispensable pour justifier l'abonnement.

### A. Auth backend

#### Endpoints
```
POST /api/auth/login            → { email, password } → { token, must_change_password }
POST /api/auth/change-password  → [Auth] { old_password, new_password } → { status: "ok" }
POST /api/auth/forgot-password  → { email } → { status: "sent" }
```

#### Spec technique
- **Hash** : `bcrypt` (via `passlib`)
- **Token** : JWT (via `python-jose`), valide 7 jours, renouvelable
- **Middleware** : dépendance FastAPI `get_current_client` qui vérifie le JWT
- **Flag** : `must_change_password` → force le changement au 1er login
- **Forgot password** : génère un token temporaire (1h), envoie un email via SMTP Zimbra (compte contact@civik-ia.fr déjà en place, 1,99€/mois). Migration vers Brevo en Phase 2 si volume > 300 emails/jour.

#### Tables SQLite (nouvelles)
```sql
CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,         -- ex: "rigny-le-ferron-10250"
    name TEXT NOT NULL,                -- ex: "Rigny-le-Ferron"
    email TEXT UNIQUE NOT NULL,        -- email officiel mairie
    password_hash TEXT NOT NULL,       -- bcrypt
    must_change_password BOOLEAN DEFAULT 1,
    plan_tier TEXT DEFAULT 'rural',    -- rural/moyen/grand/custom
    campaign_quota INTEGER DEFAULT 2,
    campaigns_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER REFERENCES clients(id),
    jwt_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Dépendances Python (nouvelles)
```
passlib[bcrypt]==1.7.*
python-jose[cryptography]==3.3.*
```

### B. Dashboard API

#### Endpoints (tous protégés par JWT)
```
GET  /api/dashboard/{commune}           → DashboardData (KPIs, graphique, questions récentes)
GET  /api/dashboard/{commune}/questions → Liste paginée des questions avec rating
GET  /api/dashboard/{commune}/export    → Export CSV (Phase 2, pas Sprint 1)
```

#### DashboardData (schéma réponse)
```json
{
    "commune": "Rigny-le-Ferron",
    "period": "last_30_days",
    "kpis": {
        "total_questions": 142,
        "avg_response_time_ms": 340,
        "satisfaction_rate": 0.87,
        "availability": 1.0,
        "top_category": "mairie",
        "unique_sessions_estimate": 89
    },
    "chart_7_days": [
        { "date": "2026-04-24", "count": 18 },
        { "date": "2026-04-25", "count": 23 }
    ],
    "recent_questions": [
        { "query": "horaires mairie", "category": "mairie", "rating": 1, "created_at": "..." }
    ],
    "categories_breakdown": [
        { "category": "mairie", "count": 42, "percentage": 0.30 }
    ]
}
```

### C. Dashboard frontend

- **Fichier** : `dashboard.civik-ia.fr/{commune}` (servi par Nginx, template HTML)
- **Design** : reprend le design du dashboard existant dans `demo.html` (partie droite, KPIs, graphique Chart.js)
- **Pages** : Login → (Change password si 1er login) → Dashboard principal
- **Auth** : stocke le JWT dans `localStorage`, l'envoie dans `Authorization: Bearer {token}`

### Thibaut (30 min)
- [ ] Tester le login avec un compte de test
- [ ] Vérifier que les KPIs s'affichent correctement
- [ ] Valider le design (cohérence avec la démo)

### Claude (autonome)
- [ ] Coder les 3 endpoints auth + middleware JWT
- [ ] Créer les tables `clients` + `sessions` dans la migration SQLite
- [ ] Coder les 2 endpoints dashboard
- [ ] Coder le template dashboard frontend (login + dashboard)
- [ ] Configurer la route Nginx `dashboard.civik-ia.fr`
- [ ] Mettre à jour `requirements.txt` + redéployer sur le VPS
- [ ] Créer un compte de test pour la démo Saint-Martin

### Livrable
- Page login fonctionnelle sur `dashboard.civik-ia.fr/demo-saint-martin-29600`
- Dashboard avec KPIs réels (basés sur les conversations en BDD)

### Critère de succès
- Login → change password → dashboard fonctionne de bout en bout
- Les données affichées correspondent aux vraies conversations du backend
- Le JWT expire correctement après 7 jours

---

## Sprint 2 — "Widget JS + Page dédiée" (24-30 avril)

### Objectif
Construire les 2 modes de déploiement client qui débloquent le pitch commercial.

### A. Widget JS — `civik-ia.js`

#### Spec technique
- **Fichier** : `01-Site-Web/widget/civik-ia.js` (~15 Ko minifié)
- **Hébergement** : servi par le backend FastAPI (`GET /widget/civik-ia.js`)
- **Intégration client** : une seule ligne HTML
  ```html
  <script src="https://api.civik-ia.fr/widget/civik-ia.js"
          data-commune="nom-commune-cp"
          data-color="#000091"></script>
  ```

#### Comportement
1. Injecte un bouton flottant (coin bas-droit, cercle 56px, couleur `data-color`)
2. Au clic : ouvre un panneau chatbot (iframe ou shadow DOM)
3. Le chatbot communique avec `POST /api/chat` (commune_id = `data-commune`)
4. Responsive : plein écran sur mobile, panneau 380×600px sur desktop
5. Fermeture : bouton X + clic hors du panneau
6. Persistance conversation : `sessionStorage` (durée = session navigateur)

#### Paramètres `data-*`
| Attribut | Obligatoire | Défaut | Description |
|----------|------------|--------|-------------|
| `data-commune` | Oui | — | Slug commune (ex: `rigny-le-ferron-10250`) |
| `data-color` | Non | `#000091` | Couleur primaire (bouton, header) |
| `data-position` | Non | `bottom-right` | Position du bouton (`bottom-right` ou `bottom-left`) |
| `data-greeting` | Non | `"Bonjour ! Comment puis-je vous aider ?"` | Message d'accueil |

#### Architecture interne
- **Shadow DOM** (pas d'iframe) : isolation CSS complète, pas de conflit avec le site client
- **Zero dépendance** : vanilla JS, pas de framework
- **CSS inline** dans le shadow DOM : design glassmorphism Civik-ia
- **Typewriter effect** + suggestions par catégories (identique à demo.html)

#### Endpoints backend nécessaires
- `GET /widget/civik-ia.js` — sert le fichier JS (avec cache-control 1h)
- `POST /api/chat` — déjà existant, aucune modification
- `GET /api/communes/{commune_id}/categories` — NOUVEAU : retourne les catégories de la KB pour les suggestions

### B. Page dédiée — `chat.civik-ia.fr/{commune}`

#### Spec technique
- **Route Nginx** : `chat.civik-ia.fr/{commune}` → sert une page HTML templatée
- **Template** : version allégée de `demo.html` (chatbot plein écran, header épuré)
- **Données** : récupère la config commune depuis le backend (`GET /api/communes/{commune_id}`)
- **PWA** : manifest.json dynamique (nom de la commune, couleur), SW identique

#### Différences avec demo.html
- Pas de dashboard (vue citoyen uniquement)
- Pas de bandeau CTA "Essayez pour votre commune"
- Header : logo Civik-ia + nom de la commune
- Couleur personnalisable par commune

### Thibaut (30 min)
- [ ] Valider le design du widget (screenshot ou preview)
- [ ] Tester l'intégration sur un site WordPress de test (si dispo)

### Claude (autonome)
- [ ] Coder `civik-ia.js` (shadow DOM, vanilla JS, responsive)
- [ ] Coder le endpoint `GET /widget/civik-ia.js`
- [ ] Coder le endpoint `GET /api/communes/{commune_id}/categories`
- [ ] Coder le template page dédiée
- [ ] Configurer la route Nginx `chat.civik-ia.fr`
- [ ] Tester sur la commune Saint-Martin (démo)

### Livrable
- Widget JS fonctionnel, testable sur n'importe quel site
- Page dédiée `chat.civik-ia.fr/demo-saint-martin-29600` accessible

### Critère de succès
- Le widget s'affiche correctement sur un site tiers (pas de conflit CSS)
- La page dédiée charge et le chatbot répond via le backend
- Responsive mobile validé

---

## Sprint 3 — "Premier client" (1-7 mai)

### Objectif
Signer le 1er client, émettre la 1ère facture, déployer le chatbot sur une vraie commune.

### Pré-requis
- SASU immatriculée (SIRET reçu)
- Widget JS ou page dédiée fonctionnels (Sprint 1)
- Dashboard avec login (Sprint 2)

### Thibaut (3h)
- [ ] **Relancer Rigny-le-Ferron** (prospect le plus chaud, démo livrée)
  - Email de relance : "Votre outil est prêt, je vous propose un créneau de 30 min pour la mise en route"
  - Si pas de réponse J+3 : appel direct
- [ ] **En parallèle** : relancer Lunay si Rigny ne répond pas
- [ ] **RDV démo** (visio 30-45 min) : montrer le chatbot live + le dashboard
- [ ] **Si signature** :
  - Créer Pennylane (14€ HT/mois) → configurer (checklist SKILL: FACTURATION)
  - Créer Yousign (gratuit) → envoyer bon de commande
  - Pennylane : devis → facture setup (OFFERT) → facture récurrente mensuelle 99€
- [ ] **Lancer `onboard_client.py`** sur le VPS (1 commande copiée-collée)

### Claude (autonome, avant le RDV)
- [ ] Coder `onboard_client.py` (SKILL: AUTOMATISATION — spec complète dans CLAUDE.md)
- [ ] Préparer la knowledge base Rigny-le-Ferron pour le backend (format JSON compatible `ingest.py`)
- [ ] Appliquer SKILL: VÉRIFICATION DONNÉES (3+ sources, tableau comparatif)
- [ ] Générer le kit de livraison personnalisé (`kit-livraison-client.html`)
- [ ] Préparer l'email de bienvenue (template)

### Livrable
- 1er client signé, chatbot live sur sa commune
- 1ère facture émise (Pennylane)
- Kit de livraison envoyé

### Critère de succès
- Le chatbot est accessible (widget ou page dédiée) pour les citoyens
- Le maire peut se connecter au dashboard et voir les premières questions
- La facture récurrente est configurée dans Pennylane

---

## Sprint 4 — "Push Notifications" (8-14 mai)

### Objectif
Les citoyens qui ont visité le chatbot peuvent recevoir des notifications push quand la mairie publie une info.

### A. Backend — Infrastructure push

#### Dépendances Python (nouvelles)
```
pywebpush==2.0.*
py-vapid==1.9.*
cryptography>=42.0
```

#### Clés VAPID
- Générées une seule fois au setup (`py_vapid.Vapid().generate_keys()`)
- Stockées dans `.env` :
  ```
  VAPID_PRIVATE_KEY=<base64>
  VAPID_PUBLIC_KEY=<base64>
  VAPID_CLAIMS_EMAIL=contact@civik-ia.fr
  ```
- La clé publique est exposée via `GET /api/push/vapid-key`

#### Table SQLite (nouvelle)
```sql
CREATE TABLE push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    commune_id TEXT NOT NULL,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_push_commune ON push_subscriptions(commune_id);
```

#### Endpoints (nouveaux)
```
GET  /api/push/vapid-key                    → { public_key: "<base64>" }
POST /api/push/subscribe                    → { commune_id, subscription } → { status: "subscribed" }
POST /api/push/unsubscribe                  → { endpoint } → { status: "unsubscribed" }
POST /api/push/send        [Auth required]  → { commune_id, title, body, url?, tag? } → { sent, failed }
```

#### Logique d'envoi (`POST /api/push/send`)
1. Récupère tous les abonnés de la commune (`SELECT * FROM push_subscriptions WHERE commune_id = ?`)
2. Pour chaque abonnement : `webpush.send()` avec les clés VAPID
3. Si un endpoint renvoie 410 Gone : supprime l'abonnement (token expiré)
4. Retourne `{ sent: N, failed: M }` au dashboard
5. Log dans la table `conversations` (type: "push_notification")

### B. Frontend — Demande de permission

#### Moment de la demande
- **Pas à la 1ère visite** (le citoyen ne connaît pas encore l'outil)
- **À la 2ème visite** (il revient = il a trouvé de la valeur)
- Détection : `localStorage.getItem('civik_visit_count')` incrémenté à chaque session
- Condition : `visit_count >= 2 AND !already_subscribed AND Notification.permission !== 'denied'`

#### UX de la demande
- Message inline dans le chat (même style que le prompt PWA/favori)
- Texte : "Recevez les infos importantes de votre mairie directement sur votre appareil"
- Bouton : "Activer les notifications"
- Au clic :
  1. `Notification.requestPermission()`
  2. Si accordé : `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidPublicKey })`
  3. `POST /api/push/subscribe` avec le subscription object
  4. Feedback : "Vous serez notifié(e) des prochaines infos de la mairie"
- Cooldown : 30 jours si refusé ou fermé (localStorage)

#### Service Worker (déjà prêt)
Le fichier `service-worker.js` gère déjà les événements `push` et `notificationclick`. Aucune modification nécessaire.

### C. Dashboard — Envoi de notifications

- Nouvelle section dans le dashboard : "Envoyer une notification"
- Formulaire : titre (max 50 car.) + message (max 120 car.) + URL optionnelle
- Bouton "Envoyer" → `POST /api/push/send` → affiche le résultat (N envoyés, M échecs)
- Historique des notifications envoyées (table en bas)

### Thibaut (20 min)
- [ ] Tester la réception d'une notification sur son téléphone
- [ ] Envoyer une notification de test depuis le dashboard

### Claude (autonome)
- [ ] Générer les clés VAPID, ajouter dans `.env`
- [ ] Créer la table `push_subscriptions`
- [ ] Coder les 4 endpoints push
- [ ] Coder le frontend : demande permission intelligente (2ème visite)
- [ ] Coder le formulaire d'envoi dans le dashboard
- [ ] Mettre à jour `requirements.txt` + redéployer sur le VPS
- [ ] Tester le flux complet (subscribe → send → receive)

### Livrable
- Les citoyens de la commune peuvent s'abonner aux notifications
- Le maire peut envoyer une notification depuis le dashboard

### Critère de succès
- Notification reçue sur Chrome Android, Chrome Desktop, Firefox, Edge
- Le subscribe/unsubscribe fonctionne sans erreur
- Les tokens expirés sont nettoyés automatiquement (410 Gone)

### Limites connues
- iOS Safari : les push notifications PWA ne fonctionnent que depuis iOS 16.4+ et nécessitent que l'app soit installée sur l'écran d'accueil. Le prompt PWA du Sprint 0 prépare ce terrain.
- Le taux d'opt-in typique est de 5-15%. Sur une commune de 3500 hab, si 200 utilisent le chatbot, on peut espérer 10-30 abonnés push.

---

## Sprint 5 — "Campagnes Citoyennes backend" (15-22 mai)

### Objectif
Activer le différenciateur #1 vs la concurrence : la démocratie participative intégrée.

### A. Backend — API Campagnes

#### Table SQLite (nouvelle)
```sql
CREATE TABLE campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER REFERENCES clients(id),
    commune_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,               -- 'stars', 'yes_no', 'nps', 'text'
    audience_label TEXT,              -- "À l'attention du quartier X" (ciblage par auto-sélection)
    status TEXT DEFAULT 'draft',      -- draft, active, closed
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    response_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campaign_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER REFERENCES campaigns(id),
    value TEXT NOT NULL,               -- "4" (stars), "oui" (yes_no), "8" (nps), "texte libre"
    comment TEXT,                      -- commentaire optionnel
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Endpoints (tous protégés par JWT sauf GET réponse)
```
GET    /api/campaigns/{commune}              → Liste des campagnes actives (public, pour le chatbot)
POST   /api/campaigns/{commune}    [Auth]    → Créer une campagne (vérifie quota)
PUT    /api/campaigns/{id}         [Auth]    → Modifier (statut, dates, texte)
DELETE /api/campaigns/{id}         [Auth]    → Supprimer (soft delete)
GET    /api/campaigns/{id}/results [Auth]    → Résultats temps réel (agrégés + détail)
POST   /api/campaigns/{id}/respond           → Enregistrer un vote/réponse (public, sans auth)
GET    /api/campaigns/quota        [Auth]    → { used, total, remaining }
```

#### Logique quota
- Rural (99€) : 2 campagnes/an
- Moyen (199€) : 4 campagnes/an
- Grand (299€) : 6 campagnes/an
- Reset le 1er janvier (cron ou vérification à la création)
- Si quota dépassé : HTTP 403 + message "Quota atteint. Pack +2 campagnes disponible pour 49€"

#### Intégration Push (Sprint 4)
- Quand une campagne passe en statut `active` : notification push automatique à tous les abonnés
- Payload : `{ title: "Nouvelle consultation", body: campaign.title, url: "chat.civik-ia.fr/{commune}" }`

### B. Frontend — Chatbot (côté citoyen)
- Le chatbot vérifie `GET /api/campaigns/{commune}` au chargement
- Si campagne active : affiche un bandeau/message dans le chat
- Le citoyen vote directement dans le chat (étoiles cliquables, boutons oui/non, slider NPS, textarea)
- Confirmation : "Merci pour votre participation !"
- Un citoyen peut voter une seule fois par campagne (fingerprint `localStorage`)

### C. Frontend — Dashboard (côté maire)
- Nouvelle section "Campagnes Citoyennes"
- Bouton "Créer une campagne" → formulaire (titre, type, audience, dates)
- Liste des campagnes avec statut (brouillon, active, terminée)
- Résultats temps réel : graphique barres/étoiles + commentaires
- Compteur quota restant

### Thibaut (30 min)
- [ ] Créer une campagne de test depuis le dashboard
- [ ] Vérifier les résultats en temps réel
- [ ] Valider le parcours citoyen (voter dans le chatbot)

### Claude (autonome)
- [ ] Créer les tables `campaigns` + `campaign_responses`
- [ ] Coder les 7 endpoints campagnes + logique quota
- [ ] Coder l'intégration chatbot (affichage campagne + vote)
- [ ] Coder la section dashboard (création + résultats)
- [ ] Intégrer l'envoi push auto à l'activation d'une campagne
- [ ] Redéployer sur le VPS

### Livrable
- Le maire crée une campagne, les citoyens votent, les résultats s'affichent en temps réel
- Notification push envoyée automatiquement aux abonnés

### Critère de succès
- Flux complet : création → activation → notification push → vote citoyen → résultats temps réel
- Les quotas fonctionnent (blocage à la limite)
- Le ciblage par auto-sélection est affiché ("À l'attention de...")

---

## Stratégie de lancement — Conseil d'associé

### 1. Séquence marketing recommandée

```
SEMAINE 1 (10-16 avr) : TEASING
  Posts 22h47 mystère — "22h47. Votre mairie est fermée."
  Aucune mention de Civik-ia. Juste l'intrigue.

SEMAINE 2 (17-23 avr) : REVEAL
  Posts reveal — "22h47. Votre mairie est fermée... mais Civik-ia répond."
  Lien vers civik-ia.fr + démo

SEMAINE 3 (24-30 avr) : VALEUR
  Posts valeur — chiffres, bénéfices, témoignage fictif crédible
  Lien vers le Livre Blanc PDF

SEMAINE 4 (1-7 mai) : OFFRE
  Posts Programme Partenaires Fondateurs — "10 places, setup offert"
  Urgence : "Il reste 8 places"
  Lien direct vers #contact
```

### 2. Premier client — Stratégie de closing

**Cibles prioritaires (égales) : Rigny-le-Ferron + Lunay**
- **Rigny-le-Ferron** : démo personnalisée livrée, données cross-vérifiées (SKILL: VÉRIFICATION). Prêt à signer.
- **Lunay** : démo en attente, contact établi. KB backend déjà chargée.
- Relancer les deux en parallèle (email + appel J+3 si pas de réponse)
- Angle identique : "Votre outil est prêt et personnalisé. Vous êtes parmi les 10 premiers partenaires fondateurs, setup offert."
- Le premier qui répond positivement devient le 1er client.

**Prospection froide (en parallèle)**
- Souscrire Lemlist (~30€/mois) dès que SASU immatriculée
- Lancer séquence email sur 50-100 communes rurales Occitanie/Bretagne
- Utiliser `03-Marketing/emails-sequences-prospection.html` (3 séquences x 3 profils)

### 3. Objectifs 90 jours (10 avril → 10 juillet 2026)

| Jalon | Date cible | Métrique |
|-------|-----------|----------|
| Marketing lancé | 14 avril | 4 posts/sem sur 4 plateformes |
| ~~SASU immatriculée~~ ✅ | **13 avril** (fait) | SIREN 103 568 416, RCS Narbonne |
| Dashboard fonctionnel | 23 avril | Login → KPIs visible |
| Widget JS + page dédiée live | 30 avril | Testable sur site tiers |
| **1er client signé** | **7 mai** | **99€ MRR** |
| Push notifications live | 14 mai | Citoyens abonnables |
| Campagnes citoyennes live | 22 mai | Différenciateur activé |
| 2ème client signé | ~15 juin | 198€ MRR |
| 3ème client signé | ~10 juillet | 297€ MRR |

### 4. Revenus vs coûts projetés

| Mois | Clients | MRR | Coûts mensuels | Résultat |
|------|---------|-----|----------------|----------|
| Avril | 0 | 0€ | ~17€ (VPS, domaine, Zimbra, Qonto) | -17€ |
| Mai | 1 | 99€ | ~31€ (+Pennylane 14€) | **+68€** |
| Juin | 2 | 198€ | ~61€ (+Lemlist 30€) | **+137€** |
| Juillet | 3 | 297€ | ~61€ | **+236€** |

**Breakeven : 1 client** couvre tous les coûts. Dès le 2ème client, c'est du profit net.

### 5. Risques et mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|------------|--------|------------|
| ~~SASU retardée~~ ✅ Levé | — | — | Immatriculée le 13/04/2026 |
| Rigny + Lunay ne signent pas | Moyenne | Pas de 1er client en mai | Prospection froide Lemlist (50+ communes) |
| Widget JS conflits CSS | Faible | Widget cassé chez client | Shadow DOM = isolation totale |
| VPS down | Faible | Chatbot indisponible | UptimeRobot (gratuit) → alerte email |
| Mistral API down | Faible | Fallback LLM cassé | RAG local (80% des requêtes) fonctionne sans API |

---

## Résumé des livrables techniques par sprint

| Sprint | Backend (VPS) | Frontend (GitHub Pages) | Infra |
|--------|---------------|------------------------|-------|
| **S0** | — | — | Buffer, annonce légale |
| **S1** | Auth (login, change-pwd, forgot) + Dashboard API | Template dashboard | Route Nginx `dashboard.civik-ia.fr`, passlib+jose |
| **S2** | endpoint `/widget/civik-ia.js` + `/api/communes/{id}/categories` | `civik-ia.js` (widget) | Route Nginx `chat.civik-ia.fr` |
| **S3** | `onboard_client.py` | Kit livraison personnalisé | Pennylane, Yousign |
| **S4** | VAPID + subscribe/send endpoints | Permission push dans chatbot | pywebpush, clés VAPID |
| **S5** | CRUD campagnes + quotas + réponses | Vote dans chatbot + section dashboard | Push auto à l'activation |

---

## Dépendances Python ajoutées (cumulatif)

```
# Sprint 1
passlib[bcrypt]==1.7.*
python-jose[cryptography]==3.3.*

# Sprint 4
pywebpush==2.0.*
py-vapid==1.9.*
```

---

## Convention de travail

- **Chaque sprint commence par un message Thibaut** : "On lance le Sprint X"
- **Claude exécute** et livre le code + instructions de déploiement
- **Thibaut valide** (30 min max par sprint) et copie-colle les commandes VPS
- **Ajustements** : si un sprint prend du retard, on décale le suivant (pas de dette technique)
- **Principe CLAUDE.md** : toute modification est propagée sur tous les supports (RÈGLE ABSOLUE)
