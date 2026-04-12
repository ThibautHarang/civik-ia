// ============================================
// data.js — Data definitions (Civik-ia site)
// ============================================

const pricingTiers = [
    {
        target: 'Communes Rurales',
        size: '< 5 000 habitants',
        price: '99',
        features: [
            'Assistant IA sur mesure',
            'Jusqu\'à 1 000 conversations/mois',
            'Dashboard basique',
            'Notifications push + email campagnes',
            'Support par email',
            'Mises à jour documentaires trimestrielles',
            '2 Campagnes Citoyennes / an'
        ]
    },
    {
        target: 'Communes Moyennes',
        size: '5 000 — 20 000 habitants',
        price: '199',
        featured: true,
        features: [
            'Assistant IA avancé + multi-services',
            'Conversations illimitées',
            'Dashboard complet + alertes + carte de chaleur',
            'Notifications push + email + SMS campagnes',
            'Support prioritaire',
            'Mises à jour documentaires mensuelles',
            'Formation agents (2h)',
            '4 Campagnes Citoyennes / an'
        ]
    },
    {
        target: 'Grandes Communes',
        size: '20 000 — 50 000 habitants',
        price: '299',
        features: [
            'Intelligence Citoyenne complète',
            'Conversations illimitées',
            'Dashboard exécutif + rapports PDF auto',
            'Notifications push + email + SMS illimités',
            'API d\'intégration SI existant',
            'Account manager dédié',
            'Support 24/7 + SLA garanti',
            '6 Campagnes Citoyennes / an'
        ]
    },
    {
        target: 'Intercommunalités, Départements & Régions',
        size: 'Échelle territoriale',
        price: 'Sur devis',
        premium: true,
        features: [
            'Étude préalable de vos besoins',
            'Création d\'un outil sur mesure',
            'Solution multi-collectivités',
            'Benchmarks inter-territoires',
            'Analyse démographique & prospective',
            'Projets de territoire & data viz',
            'Équipe dédiée + infrastructure isolée',
            'Notifications multi-canal illimitées (push, email, SMS)',
            'Accompagnement stratégique sur mesure',
            'Campagnes Citoyennes illimitées'
        ]
    }
];

const whyReasons = [
    {
        icon: '\u{1F1EB}\u{1F1F7}',
        title: 'Cloud souverain européen — Serveurs OVHcloud UE',
        text: 'Infrastructure OVHcloud en Europe, IA souveraine Mistral AI (entreprise française). Aucune donnée ne quitte l\'Union Européenne. Aucune dépendance à un éditeur américain (pas de Cloud Act). L\'IA est entraînée sur vos sources souveraines : Légifrance, arrêtés municipaux, PLU.'
    },
    {
        icon: '\u2699\uFE0F',
        title: 'Déploiement Ultra-Rapide',
        text: 'Opérationnel en moins de 4 semaines. Aucune migration complexe. Aucune disruption des services existants.'
    },
    {
        icon: '\u{1F4CA}',
        title: 'ROI Clair & Mesurable',
        text: 'Économies d\'agent : jusqu\'à 30-40h par semaine selon profil. Objectif satisfaction citoyens +35%. Tendances en temps réel.'
    },
    {
        icon: '\u{1F510}',
        title: 'RGPD natif, conforme RGAA',
        text: 'Conformité RGPD dès la conception. Chiffrement end-to-end. Widget accessible conforme aux normes RGAA/WCAG. Aucun transfert de données hors UE. Votre opposition ne pourra rien vous reprocher.'
    },
    {
        icon: '\u{1F3AF}',
        title: 'Paramétrage Sur Mesure',
        text: 'Votre PLU, vos règles, vos services. L\'IA apprend de votre contexte, pas du contexte des autres communes.'
    },
    {
        icon: '\u{1F91D}',
        title: 'Partenaire Longue Durée',
        text: 'Onboarding gratuit. Support continu. Optimisations régulières. Succès garanti.'
    }
];

const testimonials = [
    {
        name: 'Commune rurale',
        title: '1 200 habitants — Loir-et-Cher',
        quote: 'Avec 2 agents à mi-temps, impossible de répondre à tout. La Plateforme traite les questions courantes 24h/24 et nos agents se concentrent sur l\'accueil social. Objectif : réduire les appels répétitifs de 35% dès le premier mois.',
        initials: '\u{1F3E1}',
        class: 'initials-1'
    },
    {
        name: 'Ville moyenne',
        title: '15 000 habitants — Occitanie',
        quote: 'Notre PLU est complexe. La Plateforme connaît chaque zone, chaque règle. Les citoyens obtiennent une réponse en 3 secondes au lieu de 48h par email. L'équipe de la mairie suit les tendances en temps réel sur le dashboard.',
        initials: '\u{1F3DB}\uFE0F',
        class: 'initials-2'
    },
    {
        name: 'Intercommunalité',
        title: '45 000 habitants — 28 communes',
        quote: 'Un seul déploiement pour 28 communes. L\'IA est entraînée sur les sources souveraines (Légifrance, arrêtés locaux, PLU). Le DGS a enfin une vision consolidée des demandes citoyennes sur tout le territoire.',
        initials: '\u{1F5FA}\uFE0F',
        class: 'initials-3'
    }
];

const solutionConversations = [
    { user: 'Bonjour, je suis nouveau à Narbonne', bot: 'Bienvenue ! \u{1F44B} Je suis l\'assistant IA de la mairie. Je suis ici pour répondre à vos questions 24h/24.' },
    { user: 'Peut-on installer des volets PVC en Zone UA?', bot: 'Non, c\'est interdit en Zone UA. Seuls bois, acier ou aluminium laqué sont autorisés selon notre PLU.' },
    { user: 'Où puis-je trouver les horaires de la piscine?', bot: 'Lun-ven: 10h-19h | Sam: 9h-18h | Dim: 9h-12h. Tarif: 4\u20ac adulte. Parc des Sports.' },
    { user: 'Comment m\'inscrire au rugby?', bot: 'Racing Club Narbonnais, au Parc des Sports. Inscriptions jeudis 18h-19h. 3 essais gratuits!' },
    { user: 'Horaires de la déchèterie?', bot: 'Route de Lunes. Lun-sam: 9h-12h & 13h30-17h30 | Dim: 9h-12h. Carte d\'habitant requise.' },
    { user: 'Quand est le prochain marché bio?', bot: 'Chaque samedi, Cours Mirabeau, 8h-13h. Plus de 50 producteurs. Bienvenue! \u{1F96C}' }
];

const demoConversations = [
    {
        title: 'PLU & Urbanisme',
        icon: '\u{1F3D7}\uFE0F',
        questions: [
            { user: 'Puis-je installer des volets PVC en Zone UA ?', bot: 'Non, interdit en Zone UA. Seuls bois, acier ou alu laqué autorisés.' },
            { user: 'Quel est le COS maximum en zone 1AUc ?', bot: 'Le COS en zone 1AUc est de 0,8. Vous ne pouvez construire que 80 m\u00b2 de surface de plancher par 100 m\u00b2 de terrain.' },
            { user: 'Faut-il un permis de construire pour une terrasse ?', bot: 'Oui, si la surface > 20 m\u00b2. Au-dessous, une déclaration de travaux suffit.' }
        ]
    },
    {
        title: 'Sports & Loisirs',
        icon: '\u26BD',
        questions: [
            { user: 'Où inscrire mon fils au rugby ?', bot: 'Racing Club Narbonnais, Parc des Sports. Inscriptions tous les jeudis de 18h à 19h. 3 séances d\'essai gratuites.' },
            { user: 'Quels sont les horaires de la piscine municipale ?', bot: 'Lundi-vendredi: 10h-19h | Samedi: 9h-18h | Dimanche: 9h-12h. Tarifs: 4\u20ac adulte, 2\u20ac enfants.' },
            { user: 'Comment m\'inscrire aux cours de tennis ?', bot: 'Consulter le site mairie-narbonne.fr, rubrique "Sports". Inscription en ligne ou à l\'accueil (30\u20ac/mois).' }
        ]
    },
    {
        title: 'Services Pratiques',
        icon: '\u{1F3DB}\uFE0F',
        questions: [
            { user: 'Horaires de la déchèterie ?', bot: 'Route de Lunes: 9h-12h et 13h30-17h30 du lundi au samedi. Dimanche: 9h-12h. Carte d\'habitant obligatoire.' },
            { user: 'Comment obtenir une attestation de résidence ?', bot: 'Sur rendez-vous à l\'accueil (mairie.narbonne.fr) ou par courrier avec copie pièce d\'identité et justificatif domicile. Délai: 24h.' },
            { user: 'Que dois-je faire pour une demande de subvention culturelle ?', bot: 'Dossier disponible en ligne. Deadline: 30 septembre de chaque année. Budget annuel: 50 000\u20ac. Taux de financement: 30-50%.' }
        ]
    },
    {
        title: 'Événements & Animations',
        icon: '\u{1F389}',
        questions: [
            { user: 'Quand est le prochain marché bio ?', bot: 'Chaque samedi et mercredi, Cours Mirabeau, 8h-13h (samedi) et 17h-19h30 (mercredi). Plus de 50 producteurs locaux.' },
            { user: 'Y a-t-il des événements ce mois-ci ?', bot: 'Oui ! Festival des Métiers Anciens (15-16 nov), Marché de Noël (décembre), Fête de la Musique (21 juin). Consulter l\'agenda complet sur mairie-narbonne.fr.' },
            { user: 'Comment louer la salle des fêtes pour un événement ?', bot: 'Tarif: 200\u20ac/jour (collectivités), 400\u20ac/jour (entreprises), 150\u20ac/jour (habitants). Disponibilité: mairie.narbonne.fr. Caution: 300\u20ac.' }
        ]
    },
    {
        title: 'Demandes Administratives',
        icon: '\u{1F4CB}',
        questions: [
            { user: 'Comment faire une demande de permis de conduire ?', bot: 'Cela relève de la DREAL régionale. Notre mairie peut vous recevoir pour des dossiers ANTS. RDV en ligne: mairie-narbonne.fr.' },
            { user: 'Où puis-je obtenir mon extrait de naissance ?', bot: 'Directement en mairie (30 min) ou par courrier. Coût: gratuit. Délai: 1-3 jours. À l\'accueil, ouvert lun-ven 9h-17h.' },
            { user: 'Je dois enregistrer un PACS. Comment faire ?', bot: 'Dossier sur rendez-vous. Coût enregistrement: 254,40\u20ac (part commune). Tous documents fournis en ligne. Délai enregistrement: 2-3 semaines.' }
        ]
    },
    {
        title: 'Logement & Fiscalité',
        icon: '\u{1F3E0}',
        questions: [
            { user: 'Quelle est la taxe foncière moyenne ?', bot: 'Taxe foncière moyenne: 4,8\u20ac par m\u00b2 dans la commune. Taxe d\'habitation (IFI): variable selon revenu. Simulateur sur impots.gouv.fr.' },
            { user: 'Comment aider un jeune à accéder au logement ?', bot: 'Aides: APL, ALF, ALS (CAF). Accès jeune propriétaire (PTZ+): jusqu\'à 262 000\u20ac. Info complète à l\'accueil ou www.mesdroitssociaux.gouv.fr.' },
            { user: 'Peut-on louer sa cave ou son garage ?', bot: 'Oui, mais déclaration obligatoire aux impôts. Revenus fonciers imposables. Conseil: rendez-vous avec votre centre des finances publiques (gratuit).' }
        ]
    }
];
