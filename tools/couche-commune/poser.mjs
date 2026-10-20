#!/usr/bin/env node
// Couche commune des pages anciennes de civik-ia.fr (passe P2 du 19/10/2026, revue Claude Design parties 2, 3 et 8).
//
//   node tools/couche-commune/poser.mjs              simulation : dit, page par page, ce qui changerait ; n'écrit rien
//   node tools/couche-commune/poser.mjs --ecrire     pose la tête, la barre et le pied communs
//   node tools/couche-commune/poser.mjs --verifier   code 1 si une page n'est pas à jour (contrôle avant déploiement)
//
// Le site est statique : la barre et le pied sont écrits dans chaque page, entre deux marqueurs, et cet outil les réécrit
// à l'identique depuis les gabarits ci-dessous. On le rejoue après toute retouche d'un gabarit ou de la liste des pages.
//   <!-- tete-commune --> ... <!-- /tete-commune -->     fin de <head> : couleur de la barre de Safari, apparence claire,
//                                                       icônes de la maison, police du titre préchargée, trois feuilles
//                                                       (polices, jetons, couche) et le bandeau de cookies
//   <!-- barre-commune --> ... <!-- /barre-commune -->   la barre (et la sous-barre de la page, s'il y en a une)
//   <!-- pied-commun --> ... <!-- /pied-commun -->       le pied
// Premier passage sur une page sans marqueurs : l'ancienne barre et l'ancien pied sont trouvés par leur balise d'ouverture
// (config « barre » et « pied » de la page, une seule occurrence exigée, l'élément entier est pris jusqu'à sa balise
// fermante), et remplacés ; les liens vers Google Fonts, l'ancienne couleur de thème, les anciennes icônes et l'ancien
// script /cookie-consent.js sont retirés de la tête. Rien d'autre n'est touché : ni le texte, ni les titres, ni les
// données structurées. Ce que la passe P2 a fait une seule fois en plus (verre, dégradés, émojis, thème sombre) est dans
// son compte rendu, pas ici.
// N'écrit que dans les pages de la liste ; ne fait ni git add, ni commit, ni déploiement.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ECRIRE = process.argv.includes('--ecrire');
const VERIFIER = process.argv.includes('--verifier');
const V = '20261019c';   // appel versionné des feuilles et du script (nginx les garde sept jours) : à changer avec eux
// P4 (19/10/2026) : 20261019c, la même version que l'accueil, Conseil et l'Atelier (installe-refonte.mjs, V_COMMUN) : js/cookies.js
// compte les choix du bandeau et charge les mesures après l'accord ; css/couche-commune.css pose le bandeau compact sur ordinateur
// P4 (19/10/2026, revue, parties 2 et 9, friction 6) : « Contact » de la barre et du pied mène au formulaire « Nous écrire » de
// l'accueil (/#contact), avec le choix du sujet, sur toutes les pages anciennes ; seule /marianne/ garde son propre contact
// (#contact de la page, D72) jusqu'au verdict du 28/10
const CONTACT = '/#contact';

// ---------------------------------------------------------------------------------------------------------------
// 1. Les pages
// ---------------------------------------------------------------------------------------------------------------
const MARIANNE = { libelle: 'Tester Marianne', href: '/demo' };
const GUIDE = { couche: 'ancienne', place: true, barre: { ouverture: /<header class="nav">/ }, pied: { ouverture: /<footer>/ } };
const PRODUIT = { couche: 'ancienne', place: false, pied: { ouverture: /<footer>/ } };
const LEGALE = { couche: 'legale', place: true, contact: '/#contact', barre: { ouverture: /<nav class="legal-nav">/ }, pied: { ouverture: /<footer class="legal-footer">/ } };
const OVERLAY = '<div class="mobile-overlay" id="mobileOverlay" onclick="closeMobileMenu()"></div>';
const MENTION_WA = 'Le canal WhatsApp de Civik-ia est en préparation&nbsp;; son ouverture est prévue prochainement et les conversations présentées sont illustratives. WhatsApp est une marque de Meta Platforms, Inc., citée à des fins d’illustration&nbsp;; Civik-ia n’est pas affilié à Meta. Le moteur d’intelligence de Marianne est souverain (Mistral AI, hébergement OVH, UE) et déjà disponible en démonstration sur nos autres canaux&nbsp;; WhatsApp serait un canal de transport choisi par la&nbsp;mairie.';
const MENTION_MS = 'Le canal Messenger de Civik-ia est en préparation&nbsp;; son ouverture est prévue prochainement et les conversations présentées sont illustratives. Ce canal répond aux messages reçus&nbsp;; il ne permet pas d’envoi massif sortant, par politique de la plateforme. Messenger est une marque de Meta Platforms, Inc., citée à des fins d’illustration&nbsp;; Civik-ia n’est pas affilié à Meta. Le moteur d’intelligence de Marianne est souverain (Mistral AI, hébergement OVH, UE) et déjà disponible en démonstration sur nos autres canaux&nbsp;; Messenger serait un canal de transport choisi par la mairie, la conversation y transitant par Meta comme c’est déjà le cas de la messagerie de votre page&nbsp;aujourd’hui.';
/* P3 (19/10/2026, revue partie 5) : « Prix » et non « Tarifs » (l'ancre #tarifs ne change pas) ; /marianne/ garde sa sous-barre jusqu'au 28/10 (D72) */
const CANAL = [['#demo', 'Aperçu'], ['#tarifs', 'Prix'], ['#capacites', 'Fonctionnalités']];

const PAGES = [
  ['aide.html', { couche: 'ancienne', place: true, contact: '/#contact', barre: { apres: '<a href="#main" class="sr-only">Aller au contenu</a>\n' }, pied: { avant: '<script>\n(function () {' } }],
  ['callbot-mairie.html', GUIDE],
  ['chatbot-commune-rurale.html', { ...PRODUIT, barre: { ouverture: /<nav aria-label="Navigation principale" role="navigation">/, retirer: ['    <!-- Mobile overlay -->\n    ' + OVERLAY + '\n'] } }],
  ['chatbot-mairie-gratuit.html', GUIDE],
  ['chatbot-mairie-prix.html', { ...PRODUIT, barre: { ouverture: /<nav aria-label="Navigation principale" role="navigation">/, retirer: ['    <!-- Mobile overlay -->\n    ' + OVERLAY + '\n'] } }],
  ['chatbot-mairie.html', { ...PRODUIT, barre: { ouverture: /<nav aria-label="Navigation principale" role="navigation">/, retirer: ['    ' + OVERLAY + '\n'] } }],
  ['comment-communiquer-avec-ses-citoyens.html', GUIDE],
  ['comparatif-chatbot-mairie-2026.html', GUIDE],
  ['demarches-en-ligne-commune.html', GUIDE],
  ['demo.html', { couche: 'ancienne', place: true, courant: 'true', action: { libelle: 'Réserver une démonstration', href: '#capture' }, barre: { ouverture: /<nav class="nav" aria-label="Navigation principale">/ }, pied: { ouverture: /<footer>/ } }],
  ['financement-ia-collectivite.html', GUIDE],
  ['guide-rgpd-ia-collectivites.html', GUIDE],
  ['ia-souveraine-mairie-mistral.html', GUIDE],
  ['livre-blanc.html', GUIDE],
  ['logiciel-mairie-petite-commune.html', GUIDE],
  ['marianne-messenger.html', { couche: 'ancienne', place: false, courant: 'true', sousBarre: CANAL, mention: MENTION_MS, barre: { ouverture: /<nav style="position:fixed;top:0;left:0;width:100%;z-index:1000;height:78px;/ }, pied: { ouverture: /<footer class="pied">/ } }],
  ['marianne-whatsapp.html', { couche: 'ancienne', place: false, courant: 'true', sousBarre: CANAL, mention: MENTION_WA, barre: { ouverture: /<nav style="position:fixed;top:0;left:0;width:100%;z-index:1000;height:78px;/ }, pied: { ouverture: /<footer class="pied">/ } }],
  ['outils-ia-secretaire-de-mairie.html', GUIDE],
  ['reduire-appels-mairie-chatbot-ia.html', GUIDE],
  ['22h47.html', { couche: 'ancienne', place: false, theme: '#0A0F2C', barre: { apres: '<body>\n' }, pied: { ouverture: /<footer class="s-footer">/ } }],
  ['legal/accessibilite-rgaa.html', LEGALE],
  ['legal/bon-de-commande-civik-ia.html', { ...LEGALE, barre: { ouverture: /<nav class="screen-nav">/, retirer: ['    <!-- Screen-only navigation -->\n'] }, pied: { avant: '\n</body>' } }],
  ['legal/conditions-generales-vente.html', LEGALE],
  ['legal/conditions-utilisation.html', LEGALE],
  ['legal/conformite-rgpd.html', LEGALE],
  ['legal/politique-confidentialite.html', LEGALE],
  // /marianne/ : la couche seule (D72, verdict le 28/10/2026) ; ses polices et ses icônes (le glyphe de Marianne) restent les siennes
  ['marianne/index.html', { couche: 'marianne', place: false, courant: 'page', contact: '#contact', polices: false, icones: false,
    sousBarre: [['#how', 'Fonctionnement'], ['#canaux', 'Canaux'], ['#demo', 'Démo'], ['#espace-mairie', 'Espace mairie'], ['#pricing', 'Tarifs'], ['#faq', 'FAQ'], ['#contact', 'Contact']],
    annonce: ['/marianne-whatsapp.html', 'Bientôt sur WhatsApp'],
    mention: 'Villeneuve-les-Ormes est une commune&nbsp;fictive.',
    legalEnPlus: '<li><button type="button" id="couperAnim2">Arrêter les&nbsp;animations</button></li>',
    barre: { ouverture: /<header>\n<!-- BANDEAU D'ANNONCE/ }, pied: { ouverture: /<footer class="pied">/ } }],
  ['404.html', { couche: 'ancienne', place: true, contact: '/#contact' }],
  // P9 (19/10/2026) : les trois pages neuves du référencement, de la famille des guides ; elles naissent avec les marqueurs vides
  ['guichet-citoyen-ia.html', { couche: 'ancienne', place: true }],
  ['base-de-connaissances-mairie.html', { couche: 'ancienne', place: true }],
  ['rag-collectivites.html', { couche: 'ancienne', place: true }],
  // grappe données (21/10/2026) : les six articles, même famille et même naissance (marqueurs vides) ; le pied des guides ne
  // change pas (plan de la DDC du 20/10/2026, section 3 : seize lignes déjà, page de rangement à décider par Thibaut)
  ['securiser-base-de-donnees-collectivite.html', { couche: 'ancienne', place: true }],
  ['sources-officielles-mairie-quelle-source-fait-foi.html', { couche: 'ancienne', place: true }],
  ['donnees-a-ne-pas-envoyer-ia-mairie.html', { couche: 'ancienne', place: true }],
  ['tester-un-chatbot-de-mairie.html', { couche: 'ancienne', place: true }],
  ['preparer-base-de-donnees-fiable-ia-mairie.html', { couche: 'ancienne', place: true }],
  ['souverainete-numerique-commune.html', { couche: 'ancienne', place: true }],
];

// ---------------------------------------------------------------------------------------------------------------
// 2. Les gabarits
// ---------------------------------------------------------------------------------------------------------------
const SIGNE = '<svg class="cc-signe" viewBox="2 8 96 84" aria-hidden="true" focusable="false"><path class="cc-signe__arc" d="M5.04 87.67C4 62.65 24.46 40.76 47.01 40.76C49.7 40.76 52.35 41.07 54.94 41.65C49.75 43.78 44.39 45.41 39.61 48.49C31.66 53.62 27.29 62.32 24.11 70.9C22.49 75.34 21.46 80.85 21.4 87.67ZM72.62 87.67C72.43 66.2 62.67 57.76 54.9 54.65C61.03 54.26 66.05 52.9 71.49 49.79C82.34 58.48 89.61 72.5 88.99 87.67Z"/><path class="cc-signe__fleche" d="M95 12.33L67.99 23.63L77.22 30.74C72.9 37.53 68.27 44.6 60.62 47.96C58.7 48.81 56.68 49.43 54.67 50.04C51.65 50.95 48.61 51.8 45.67 52.96C43.33 53.88 40.47 55.13 39 57.29C41.08 56.9 43 55.86 45.12 55.63C46.95 55.44 48.79 55.4 50.63 55.36C55.18 55.25 59.28 55.05 63.72 53.73C73 50.97 80.67 44.61 86.27 36.86L93.65 42.26L95 12.33Z"/></svg>';
const MENU = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
// les quatre réseaux de Civik-ia, dessinés à la plume (pied de la maison, 07/10/2026)
const RESEAUX = [
  ['https://www.linkedin.com/company/civik-ia/', 'LinkedIn', 'M8.5 3.24L15.52 3.17Q20.72 3.25 20.77 8.38L20.71 15.7Q20.83 20.88 15.6 20.79L8.45 20.83Q3.12 20.76 3.19 15.58L3.27 8.4Q3.22 3.27 8.95 3.35M8.55 10.71L8.69 17M8.2 7.29a.9 .9 0 1 0 .8 .2M11.55 16.94L11.77 10.68M11.65 12.57C12.7 10.28 16.38 10.02 16.57 12.5L16.52 17.01'],
  ['https://x.com/Civik_ia', 'X', 'M17.67 3.18L20.64 3.31L14.14 10.6L21.67 20.75L15.79 20.7L11.07 14.59L5.66 20.81L2.77 20.8L9.74 12.86L2.25 3.31L8.43 3.31L12.74 8.86L17.66 3.28M16.6 19.05L18.22 19.02L7.58 4.94L5.87 4.97L16.52 18.97'],
  ['https://www.instagram.com/civik_ia/', 'Instagram', 'M9.08 3.21L15.09 3.3Q20.7 3.23 20.87 8.98L20.82 14.97Q20.86 20.77 14.96 20.91L8.96 20.82Q3.23 20.9 3.17 15.08L3.13 8.92Q3.21 3.13 9.55 3.24M12.1 8.05C14.22 8.03 15.94 9.8 16.11 12.07C16.01 14.34 14.28 16 12.1 16.04C9.75 16.02 8 14.25 8.01 11.96C8.07 9.83 9.86 8.28 12.27 8.16M16.86 6.88a.55 .55 0 1 0 .5 .15'],
  ['https://www.facebook.com/61576248676403/', 'Facebook', 'M8.37 3.28L15.62 3.26Q20.89 3.11 20.89 8.49L20.86 15.68Q20.88 20.74 15.49 20.77L8.45 20.78Q3.22 20.75 3.09 15.55L3.14 8.5Q3.18 3.1 8.9 3.33M15.97 6.5C13.61 6.13 12.57 7.26 12.5 9.51L12.64 20.58M9.66 12.5L15.36 12.26'],
];
// tous les guides pour les mairies (les cibles des anciens pieds y restent : chatbot, comparatif, RGPD, prix)
// P9 (19/10/2026, maillage du plan de la DDC) : la page pilier en tête de la colonne des guides, sauf sur /marianne/ (D72, rien ne
// change sur la page avant le verdict du 28/10/2026 : elle la recevra au passage suivant de l'outil, ce jour-là)
const PILIER = ['/guichet-citoyen-ia.html', 'Guichet citoyen IA, la définition'];
const GUIDES = [
  ['/chatbot-mairie.html', 'Le guide du chatbot de mairie'],
  ['/chatbot-mairie-prix.html', 'Prix d’un chatbot de mairie'],
  ['/chatbot-mairie-gratuit.html', 'Existe-t-il un chatbot gratuit&nbsp;?'],
  ['/comparatif-chatbot-mairie-2026.html', 'Comparatif 2026'],
  ['/chatbot-commune-rurale.html', 'Chatbot de commune rurale'],
  ['/callbot-mairie.html', 'Callbot ou chatbot'],
  ['/financement-ia-collectivite.html', 'Financer l’IA de sa commune'],
  ['/guide-rgpd-ia-collectivites.html', 'RGPD et IA en collectivité'],
  ['/ia-souveraine-mairie-mistral.html', 'IA souveraine en mairie'],
  ['/reduire-appels-mairie-chatbot-ia.html', 'Réduire les appels en mairie'],
  ['/outils-ia-secretaire-de-mairie.html', 'Outils IA du secrétariat de mairie'],
  ['/logiciel-mairie-petite-commune.html', 'Logiciel de petite commune'],
  ['/demarches-en-ligne-commune.html', 'Démarches en ligne d’une commune'],
  ['/comment-communiquer-avec-ses-citoyens.html', 'Communiquer avec ses citoyens'],
  ['/livre-blanc.html', 'Livre blanc, l’IA en mairie'],
];
const LEGAL = [
  ['/legal/conditions-utilisation.html', 'Mentions légales et conditions d’utilisation'],
  ['/legal/politique-confidentialite.html', 'Confidentialité'],
  ['/legal/conditions-generales-vente.html', 'CGV'],
  ['/legal/conformite-rgpd.html', 'RGPD'],
  ['/legal/accessibilite-rgaa.html', 'Accessibilité'],
];

const adresse = f => '/' + f.replace(/index\.html$/, '');
const courant = (href, ici, valeur = 'page') => (href === ici ? ` aria-current="${valeur}"` : '');

function barre(f, c) {
  const contact = c.contact || CONTACT;
  const action = c.action || MARIANNE;
  const marianneCourant = c.courant ? ` aria-current="${c.courant}"` : '';
  const liens = [['/marianne/', 'Marianne', marianneCourant], ['/conseil/', 'Conseil', ''], ['/atelier/', 'Atelier', ''], [contact, 'Contact', '']];
  let h = '<!-- barre-commune -->\n'
    + `<div class="cc cc-barre${action.libelle.length > 20 ? ' cc-barre--longue' : ''}">\n`
    + '<nav class="cc-barre__nav" aria-label="Navigation principale">\n'
    + `<a class="cc-barre__signe" href="/" aria-label="Civik-ia, accueil">${SIGNE}<span class="cc-barre__nom">Civik-<b>ia</b></span></a>\n`
    + '<ul class="cc-barre__liens">' + liens.map(([h2, t, a]) => `<li><a href="${h2}"${a}>${t}</a></li>`).join('') + '</ul>\n'
    + `<a class="cc-barre__action" href="${action.href}">${action.libelle}</a>\n`
    + `<details class="cc-barre__menu"><summary class="cc-barre__ouvrir" aria-label="Ouvrir le menu">${MENU}</summary>\n`
    + '<div class="cc-tiroir"><a href="/">Accueil</a>' + liens.map(([h2, t, a]) => `<a href="${h2}"${a}>${t}</a>`).join('')
    + '<button type="button" data-cookies-gerer>Gérer les cookies</button></div>\n'
    + '</details>\n'
    + '</nav>\n'
    + '</div>\n';
  if (c.place) h += '<div class="cc cc-place" aria-hidden="true"></div>\n';
  if (c.sousBarre) {
    h += '<nav class="cc cc-sousbarre" aria-label="Sur cette page">'
      + '<ul class="cc-sousbarre__liens">' + c.sousBarre.map(([a, t]) => `<li><a href="${a}">${t}</a></li>`).join('') + '</ul>'
      + (c.annonce ? `<a class="cc-sousbarre__annonce" href="${c.annonce[0]}">${c.annonce[1]}</a>` : '')
      + '</nav>\n';
  }
  return h + '<!-- /barre-commune -->';
}

function pied(f, c) {
  const ici = adresse(f);
  const contact = c.contact || CONTACT;
  const site = [['/', 'Accueil'], ['/marianne/', 'Marianne'], ['/conseil/', 'Conseil'], ['/atelier/', 'Atelier'], ['/demo', 'Tester Marianne'], ['/22h47.html', '22h47, votre mairie est&nbsp;fermée'], [contact, 'Contact']];
  const ecrire = '<li><a href="mailto:contact@civik-ia.fr">contact@civik-ia.fr</a></li>'
    + '<li><a href="mailto:thibaut.harang@civik-ia.fr">thibaut.harang@civik-ia.fr</a></li>'
    + '<li><a href="https://www.linkedin.com/in/thibaut-harang/" target="_blank" rel="noopener">LinkedIn de Thibaut Harang</a></li>'
    + `<li><a href="/aide.html"${courant('/aide.html', ici)}>Centre d’aide</a></li>`;
  return '<!-- pied-commun -->\n'
    + '<footer class="cc cc-pied">\n'
    + '<div class="cc-pied__in">\n'
    + '<div class="cc-pied__marque">'
    + `<p class="cc-pied__nom"><span class="cc-pied__cartouche">${SIGNE}</span><span>Civik-<b>ia</b></span></p>`
    + '<p class="cc-pied__devise">Communiquer, conseiller, créer. Pour les mairies, les acteurs de santé, les entreprises et les associations.</p>'
    + '<ul class="cc-pied__reseaux" aria-label="Civik-ia sur les réseaux">'
    + RESEAUX.map(([u, n, d]) => `<li><a href="${u}" target="_blank" rel="noopener" aria-label="Civik-ia sur ${n} (nouvel onglet)" title="Civik-ia sur ${n}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg></a></li>`).join('')
    + '</ul></div>\n'
    + '<nav class="cc-pied__col" aria-labelledby="cc-pied-site"><h2 id="cc-pied-site">Le site</h2><ul>'
    + site.map(([h, t]) => `<li><a href="${h}"${courant(h, ici)}>${t}</a></li>`).join('') + '</ul></nav>\n'
    + '<nav class="cc-pied__col cc-pied__guides" aria-labelledby="cc-pied-guides"><h2 id="cc-pied-guides">Guides pour les mairies</h2><ul>'
    + (c.couche === 'marianne' ? GUIDES : [PILIER, ...GUIDES]).map(([h, t]) => `<li><a href="${h}"${courant(h, ici)}>${t}</a></li>`).join('') + '</ul></nav>\n'
    + '<nav class="cc-pied__col" aria-labelledby="cc-pied-ecrire"><h2 id="cc-pied-ecrire">Nous écrire</h2><ul>' + ecrire + '</ul></nav>\n'
    + '</div>\n'
    + '<div class="cc-pied__bande">'
    + '<p class="cc-pied__officiel">© 2026 Civik-ia · SASU au capital de 1&nbsp;000&nbsp;€ · SIREN 103&nbsp;568&nbsp;416 · RCS Narbonne</p>'
    + '<ul class="cc-pied__legal" aria-label="Informations légales">'
    + LEGAL.map(([h, t]) => `<li><a href="${h}"${courant(h, ici)}>${t}</a></li>`).join('')
    + '<li><button type="button" data-cookies-gerer>Gérer les cookies</button></li>' + (c.legalEnPlus || '') + '</ul>'
    + (c.mention ? `<p class="cc-pied__mention">${c.mention}</p>` : '')
    + '</div>\n'
    + '</footer>\n'
    + '<!-- /pied-commun -->';
}

function tete(f, c) {
  const l = ['<!-- tete-commune -->', '<meta name="color-scheme" content="light">', `<meta name="theme-color" content="${c.theme || '#f7f4ed'}">`];
  if (c.icones !== false) l.push(
    '<link rel="icon" href="/assets/icones/favicon.svg" type="image/svg+xml" sizes="any">',
    '<link rel="icon" href="/assets/icones/favicon-32.png" type="image/png" sizes="32x32">',
    '<link rel="apple-touch-icon" href="/assets/icones/apple-touch-icon.png" sizes="180x180">',
    '<link rel="manifest" href="/assets/icones/site.webmanifest">');
  if (c.polices !== false) l.push(
    '<link rel="preload" href="/assets/fonts/poppins-latin-800.woff2" as="font" type="font/woff2" crossorigin>',
    `<link rel="stylesheet" href="/css/polices.css?v=${V}">`);
  l.push(`<link rel="stylesheet" href="/css/jetons.css?v=${V}">`, `<link rel="stylesheet" href="/css/couche-commune.css?v=${V}">`,
    `<script src="/js/cookies.js?v=${V}" defer></script>`, '<!-- /tete-commune -->');
  return l.join('\n');
}

// ---------------------------------------------------------------------------------------------------------------
// 3. La pose
// ---------------------------------------------------------------------------------------------------------------
const compte = (s, x) => s.split(x).length - 1;
function unique(s, motif, nom) {
  const re = new RegExp(motif.source, motif.flags.replace('g', '') + 'g');
  const t = [...s.matchAll(re)];
  if (t.length !== 1) throw new Error(`${nom} : ${t.length} occurrence(s) de ${motif}, une attendue`);
  return t[0].index;
}
// l'élément entier qui commence à i (balise ouvrante), jusqu'à sa balise fermante, en comptant les imbrications du même nom
function element(s, i) {
  const nom = /^<([a-zA-Z0-9]+)/.exec(s.slice(i))[1];
  const re = new RegExp(`<(/?)${nom}\\b[^>]*>`, 'gi');
  re.lastIndex = i;
  let prof = 0, m;
  while ((m = re.exec(s))) {
    prof += m[1] ? -1 : 1;
    if (prof === 0) return [i, m.index + m[0].length];
  }
  throw new Error(`élément <${nom}> non fermé`);
}
function bloc(s, debut, fin) {
  const a = s.indexOf(debut), b = s.indexOf(fin);
  if (a < 0 && b < 0) return null;
  if (a < 0 || b < a || compte(s, debut) !== 1 || compte(s, fin) !== 1) throw new Error(`marqueurs ${debut} incohérents`);
  return [a, b + fin.length];
}
function poser(s, debut, fin, contenu, trouver, nom) {
  const m = bloc(s, debut, fin);
  if (m) return s.slice(0, m[0]) + contenu + s.slice(m[1]);
  const [a, b] = trouver(s, nom);
  return s.slice(0, a) + contenu + s.slice(b);
}
function ancien(spec) {
  return (s, nom) => {
    if (!spec) throw new Error(`${nom} : ni marqueurs, ni règle pour trouver l'ancien élément`);
    if (spec.ouverture) return element(s, unique(s, spec.ouverture, nom));
    if (spec.apres) { if (compte(s, spec.apres) !== 1) throw new Error(`${nom} : ancre « après » absente ou multiple`); const i = s.indexOf(spec.apres) + spec.apres.length; return [i, i]; }
    if (spec.avant) { if (compte(s, spec.avant) !== 1) throw new Error(`${nom} : ancre « avant » absente ou multiple`); const i = s.indexOf(spec.avant); return [i, i]; }
    throw new Error(`${nom} : règle vide`);
  };
}
// ce qui part de la tête au premier passage (rien d'autre)
const TETE_RETIRER = [
  /[ \t]*<!-- Mesure d'audience[^>]*-->\n/g,
  /[ \t]*<script src="\/cookie-consent\.js" defer><\/script>\n/g,
  /[ \t]*<link rel="preconnect" href="https:\/\/fonts\.(?:googleapis|gstatic)\.com"(?: crossorigin)?>\n/g,
  /[ \t]*<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*" rel="stylesheet">\n/g,
  /[ \t]*<meta name="theme-color" content="[^"]*">\n/g,
];
const TETE_ICONES = [
  /[ \t]*<link rel="icon" href="data:[^"]*">\n/g,
  /[ \t]*<link rel="(?:icon|apple-touch-icon|manifest|mask-icon)"[^>]*>\n/g,
  /[ \t]*<link rel="icon" type="[^"]*"(?: sizes="[^"]*")? href="[^"]*">\n/g,
];

let aJour = 0, changees = 0, ko = 0;
for (const [f, c] of PAGES) {
  const chemin = join(SITE, f);
  if (!existsSync(chemin)) { console.log(`ÉCHEC ${f} : absente`); ko++; continue; }
  const avant = readFileSync(chemin, 'utf8');
  let s = avant;
  try {
    // la tête : le bloc commun remplace le précédent ; au premier passage, ce qu'il remplace part de la tête
    let i = s.indexOf('</head>');
    let head = s.slice(0, i), corps = s.slice(i);
    const m = bloc(head, '<!-- tete-commune -->', '<!-- /tete-commune -->');
    if (m) head = head.slice(0, m[0]) + head.slice(m[1]).replace(/^\n/, '');
    for (const r of [...TETE_RETIRER, ...(c.icones === false ? [] : TETE_ICONES)]) head = head.replace(r, '');
    if (/fonts\.(googleapis|gstatic)\.com/.test(head)) throw new Error('Google Fonts encore appelé dans la tête');
    head = head.replace(/\s*$/, '\n') + tete(f, c) + '\n';
    s = head + corps;
    // la racine porte la famille de la couche (correspondance des couleurs, typographie de corps)
    s = s.replace(/<html lang="fr"(?: data-couche="[a-z]+")?>/, `<html lang="fr" data-couche="${c.couche}">`);
    if (!s.includes(`<html lang="fr" data-couche="${c.couche}">`)) throw new Error('balise <html lang="fr"> introuvable');
    // la barre et le pied
    s = poser(s, '<!-- barre-commune -->', '<!-- /barre-commune -->', barre(f, c), ancien(c.barre), f + ' (barre)');
    s = poser(s, '<!-- pied-commun -->', '<!-- /pied-commun -->', pied(f, c), ancien(c.pied), f + ' (pied)');
    for (const r of (c.barre && c.barre.retirer) || []) s = s.split(r).join('');
    if (c.barre && c.barre.retirer) for (const r of c.barre.retirer) if (s.includes(r)) throw new Error('reste : ' + r);
    if (/<script src="\/cookie-consent\.js"/.test(s)) throw new Error('/cookie-consent.js encore chargé');
  } catch (e) { console.log(`ÉCHEC ${f} : ${e.message}`); ko++; continue; }
  if (s === avant) { aJour++; console.log(`à jour    ${f}`); continue; }
  changees++;
  console.log(`${ECRIRE ? 'posée    ' : 'à poser  '} ${f} (${avant.length} → ${s.length} octets)`);
  if (ECRIRE) writeFileSync(chemin, s);
}
console.log(`\n${PAGES.length} pages : ${aJour} à jour, ${changees} ${ECRIRE ? 'posées' : 'à poser'}, ${ko} en échec`);
process.exit(ko || (VERIFIER && changees) ? 1 : 0);
