// ============================================
// chatbot.js — Floating chatbot widget (Civik-ia site)
// ============================================

const cbKnowledge = [
    {
        keywords: ['aide', 'aider', 'quoi', 'faire', 'bonjour', 'hello', 'salut'],
        response: 'Bonjour ! \u{1F44B} Je suis l\'assistant du site Civik-ia. Je peux vous renseigner sur la <strong>Plateforme d\'Intelligence Citoyenne</strong>, vous orienter vers une d\u00e9mo, ou r\u00e9pondre \u00e0 vos questions sur nos offres.'
    },
    {
        keywords: ['d\u00e9mo', 'demo', 'd\u00e9monstration', 'essayer', 'tester', 'voir'],
        response: 'Vous pouvez <a href="demo.html" style="color:var(--secondary-innov);font-weight:700;">tester la d\u00e9mo interactive maintenant</a> ! Posez des questions comme un citoyen et voyez la r\u00e9ponse en temps r\u00e9el. Pour une d\u00e9mo personnalis\u00e9e avec les donn\u00e9es de votre commune, remplissez le <a href="#contact" onclick="scrollToSection(\'contact\');toggleChatbot();" style="color:var(--secondary-innov);font-weight:700;">formulaire de contact</a>.'
    },
    {
        keywords: ['contact', 'joindre', 'appeler', 'email', 't\u00e9l\u00e9phone', 'rdv', 'rendez-vous'],
        response: 'Vous pouvez nous contacter via le <a href="#contact" onclick="scrollToSection(\'contact\');toggleChatbot();" style="color:var(--secondary-innov);font-weight:700;">formulaire en bas de page</a>, ou directement par email \u00e0 <strong>contact@civik-ia.fr</strong>. Nous r\u00e9pondons sous 24h !'
    },
    {
        keywords: ['prix', 'tarif', 'co\u00fbt', 'cout', 'combien', 'budget', 'gratuit'],
        response: 'Nos offres d\u00e9marrent \u00e0 <strong>99\u20ac/mois</strong> pour les communes rurales (2 Campagnes Citoyennes/an incluses). 199\u20ac/mois pour les communes moyennes (4 campagnes/an), 299\u20ac/mois pour les grandes communes (6 campagnes/an). Intercommunalit\u00e9s, d\u00e9partements et r\u00e9gions : sur devis. \u{1F680} <strong>Programme Partenaires Fondateurs</strong> : la mise en service (valeur 999\u20ac) est <strong>offerte</strong> pour les 10 premi\u00e8res communes ! Consultez nos <a href="#tarifs" onclick="scrollToSection(\'tarifs\');toggleChatbot();" style="color:var(--secondary-innov);font-weight:700;">tarifs d\u00e9taill\u00e9s</a> !'
    },
    {
        keywords: ['pic', 'plateforme', 'intelligence', 'citoyenne', 'c\'est quoi', 'koi', 'qu\'est'],
        response: 'La <strong>Plateforme d\'Intelligence Citoyenne</strong> est un assistant IA disponible 24h/24 pour les mairies. Elle r\u00e9pond aux questions des citoyens (horaires, urbanisme, d\u00e9chets...), lib\u00e8re du temps aux agents, et fournit un dashboard de donn\u00e9es aux \u00e9lus.'
    },
    {
        keywords: ['pourquoi', 'cr\u00e9\u00e9', 'cr\u00e9e', 'origine', 'mission', 'raison'],
        response: 'Civik-ia est n\u00e9e d\'un constat simple : <strong>70% des questions en mairie sont r\u00e9p\u00e9titives</strong>. Les agents perdent un temps pr\u00e9cieux, les citoyens attendent des heures. Notre mission : reconnecter les mairies et leurs habitants, 24h/24, gr\u00e2ce \u00e0 une IA souveraine et fran\u00e7aise.'
    },
    {
        keywords: ['s\u00e9curit\u00e9', 'securite', 'rgpd', 'donn\u00e9es', 'donnees', 'souverain', 'france', 'fran\u00e7ais'],
        response: 'Civik-ia est <strong>100% souveraine</strong> : h\u00e9bergement OVH en Europe (cloud souverain), IA Mistral AI (entreprise fran\u00e7aise), conformit\u00e9 RGPD native, chiffrement end-to-end. Z\u00e9ro donn\u00e9e envoy\u00e9e hors UE.'
    },
    {
        keywords: ['d\u00e9ploiement', 'deploiement', 'installation', 'combien de temps', 'dur\u00e9e', 'duree', 'mise en place'],
        response: 'Le d\u00e9ploiement de la Plateforme prend <strong>moins de 4 semaines</strong> : \u00e9tude de votre commune, configuration personnalis\u00e9e, formation des agents, puis mise en service. Aucune migration complexe n\u00e9cessaire !'
    },
    {
        keywords: ['formation', 'former', 'agent', 'webinaire', 'apprendre'],
        response: 'Nous proposons des <strong>formations pour les agents de mairie</strong> : prise en main du dashboard, suivi des conversations, gestion des alertes. Webinaires inclus dans les offres Communes Moyennes et sup\u00e9rieures !'
    },
    {
        keywords: ['satisfaction', 'campagne', 'sondage', 'avis', 'opinion', 'enqu\u00eate', 'consultation'],
        response: 'Les <strong>Campagnes Citoyennes</strong> permettent aux mairies de consulter leurs citoyens en temps r\u00e9el. Le maire cr\u00e9e une campagne depuis son dashboard, et en moins de 5 minutes, les citoyens sont alert\u00e9s par <strong>notification push, email et SMS</strong>. Un bandeau interactif appara\u00eet dans le chatbot pour recueillir les avis. R\u00e9sultats en temps r\u00e9el avec scores et statistiques. Incluses dans chaque offre : 2/an (rural), 4/an (moyen), 6/an (grande commune), illimit\u00e9es (interco/r\u00e9gions). Packs suppl\u00e9mentaires \u00e0 49\u20ac ou 99\u20ac HT. <a href="#campagnes" onclick="scrollToSection(\'campagnes\');toggleChatbot();" style="color:var(--secondary-innov);font-weight:700;">En savoir plus</a>'
    },
    {
        keywords: ['notification', 'push', 'sms', 'alerte', 'alerter', 'pr\u00e9venir', 'informer', 'notifier', 'application', 'app'],
        response: 'Pas besoin d\'application native ! D\u00e8s qu\'une campagne est lanc\u00e9e, <strong>3 canaux se d\u00e9clenchent automatiquement</strong> : notification push via l\'application web (PWA), email avec lien direct vers la campagne, et SMS pour les consultations prioritaires. Le tout en moins de 5 minutes. Les notifications push et email sont <strong>incluses dans toutes les offres</strong>, le SMS est disponible d\u00e8s l\'offre Communes Moyennes. <a href="#campagnes" onclick="scrollToSection(\'campagnes\');toggleChatbot();" style="color:var(--secondary-innov);font-weight:700;">D\u00e9couvrir les Campagnes</a>'
    },
    {
        keywords: ['agent', 'emploi', 'poste', 'remplacer', 'syndicat', 'personnel', 'supprime'],
        response: 'La Plateforme <strong>ne remplace aucun agent</strong>. Elle prend en charge les questions r\u00e9p\u00e9titives (horaires, d\u00e9chets, urbanisme) pour que vos agents se concentrent sur l\'accueil social, l\'accompagnement des personnes fragiles et le lien humain. R\u00e9sultat : +30h/semaine lib\u00e9r\u00e9es, z\u00e9ro poste supprim\u00e9.'
    },
    {
        keywords: ['souverain', 'h\u00e9bergement', 'serveur', 'ovh', 'donn\u00e9e', 'usa', 'am\u00e9ricain'],
        response: 'Infrastructure 100% souveraine : serveurs <strong>OVHcloud en Europe</strong>, IA <strong>Mistral AI</strong> (entreprise fran\u00e7aise). Aucune donn\u00e9e ne quitte l\'UE. Aucune d\u00e9pendance \u00e0 un \u00e9diteur am\u00e9ricain (pas de Cloud Act). L\'IA est entra\u00een\u00e9e sur vos sources souveraines (L\u00e9gifrance, arr\u00eat\u00e9s locaux, PLU). Conforme RGPD et RGAA.'
    },
    {
        keywords: ['parrain', 'parrainage', 'recommander', 'recommandation', 'r\u00e9duction', 'ambassadeur'],
        response: 'Notre <strong>programme Parrainage</strong> r\u00e9compense les communes qui recommandent Civik-ia ! 1re recommandation = 1 mois offert, 2e = 2 mois, 3e = 3 mois, 4e et + = 4 mois offerts + statut Ambassadeur. La commune recommand\u00e9e b\u00e9n\u00e9ficie de la <strong>mise en service offerte</strong> (Programme Partenaires Fondateurs). <a href="#parrainage" onclick="scrollToSection(\'parrainage\');toggleChatbot();" style="color:var(--secondary-innov);font-weight:700;">D\u00e9couvrir le programme</a> !'
    }
];

const cbSuggestionsList = [
    'C\'est quoi la Plateforme ?',
    'Tester la d\u00e9mo',
    'Les tarifs ?',
    'Comment alerter mes citoyens ?',
    'Contacter l\'\u00e9quipe'
];

let chatbotOpen = false;
let cbInitialized = false;

function toggleChatbot() {
    chatbotOpen = !chatbotOpen;
    document.getElementById('chatbotWindow').classList.toggle('open', chatbotOpen);
    document.getElementById('chatbotFab').querySelector('.badge-notif').style.display = chatbotOpen ? 'none' : '';
    // Fermer la bulle de bienvenue
    const bubble = document.getElementById('chatbotWelcome');
    if (bubble) bubble.classList.remove('visible');

    if (!cbInitialized) {
        cbInitialized = true;
        initChatbot();
    }
}

function initChatbot() {
    const msgContainer = document.getElementById('cbMessages');
    const sugContainer = document.getElementById('cbSuggestions');

    // Welcome message
    addCbMessage('Bonjour ! \u{1F44B} Je suis l\'assistant Civik-ia. Comment puis-je vous aider ?', 'bot');

    // Suggestion buttons
    cbSuggestionsList.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'cb-sug-btn';
        btn.textContent = s;
        btn.onclick = () => sendCbMessage(s);
        sugContainer.appendChild(btn);
    });
}

function addCbMessage(content, type) {
    const container = document.getElementById('cbMessages');
    const div = document.createElement('div');
    div.className = `cb-msg ${type}`;
    if (type === 'bot') {
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = content;
        div.appendChild(contentDiv);

        // Add satisfaction rating
        const ratingDiv = document.createElement('div');
        ratingDiv.className = 'cb-satisfaction-rating';
        const thumbsUpBtn = document.createElement('button');
        thumbsUpBtn.className = 'cb-rating-btn';
        thumbsUpBtn.innerHTML = '\u{1F44D}';
        thumbsUpBtn.onclick = (e) => {
            e.stopPropagation();
            ratingDiv.innerHTML = '<div style="text-align: center; font-size: 12px; color: #666;">Merci !</div>';
        };
        const thumbsDownBtn = document.createElement('button');
        thumbsDownBtn.className = 'cb-rating-btn';
        thumbsDownBtn.innerHTML = '\u{1F44E}';
        thumbsDownBtn.onclick = (e) => {
            e.stopPropagation();
            ratingDiv.innerHTML = '<div style="text-align: center; font-size: 12px; color: #666;">Merci !</div>';
        };
        ratingDiv.appendChild(thumbsUpBtn);
        ratingDiv.appendChild(thumbsDownBtn);
        div.appendChild(ratingDiv);
    } else {
        div.textContent = content;
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function findCbAnswer(query) {
    const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let bestMatch = null;
    let bestScore = 0;

    for (const entry of cbKnowledge) {
        let score = 0;
        for (const keyword of entry.keywords) {
            const kw = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (q.includes(kw)) score += kw.length;
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = entry;
        }
    }

    if (bestMatch && bestScore >= 3) return bestMatch.response;

    return 'Je n\'ai pas la r\u00e9ponse exacte, mais notre \u00e9quipe peut vous aider ! <a href="#contact" onclick="scrollToSection(\'contact\');toggleChatbot();" style="color:var(--secondary-innov);font-weight:700;">Contactez-nous</a> ou appelez-nous \u2014 nous r\u00e9pondons sous 24h.';
}

function sendCbMessage(text) {
    const input = document.getElementById('cbInput');
    const query = text || input.value.trim();
    if (!query) return;

    addCbMessage(query, 'user');
    if (input) input.value = '';

    setTimeout(() => {
        addCbMessage(findCbAnswer(query), 'bot');
    }, 400 + Math.random() * 400);
}
