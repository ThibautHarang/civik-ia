/* =====================================================================
   Les mesures d’audience de la maison (passe P4, 19/10/2026 ; revue
   Claude Design, partie 9, « Ce qu’il faudrait mesurer en plus »).

   Le contrat (avis DAJF du 13/10/2026, condition 2, le même que les
   événements du film et generate_lead) :
   - rien n’est poussé tant que Google Tag Manager n’est pas chargé
     (window.__civikGtmLoaded, posé par js/cookies.js après « Accepter ») ;
     pas de file d’attente : rien n’est rejoué à l’accord ;
   - chaque paramètre prend sa valeur dans une liste fermée, écrite ici ;
     une valeur hors liste fait tomber l’événement entier (rien ne part) ;
   - jamais de nom, de courriel, de texte saisi, de numéro ni de commune :
     pour le calculateur, une tranche de population seulement.

   Les événements (dataLayer ; à déclarer dans GTM comme événements
   personnalisés, puis comme dimensions dans GA4) :
     cta_clic           emplacement, destination, ancre, film_chapitre
     film_arret         arret, forme, sens        (à poser par le film, passe P5)
     film_attente       troncon, duree, classe    (à poser par le film, passe P5)
     scene_choix        page, scene, choix
     formulaire_etape   formulaire, etape, sens
     formulaire_erreur  formulaire, champ, type
     formulaire_echec   formulaire, cause, suite
     calculateur        tranche, population_corrigee, options
     copie              objet
     telechargement     objet
     faq_ouverte        page, question
   generate_lead (posé par l’installateur dans pages.js) reste à part,
   inchangé. Deux compteurs vivent côté serveur, sans cookie ni adresse
   IP : les choix du bandeau (js/cookies.js, /_mesure/…) et les 404 (nginx).

   Ce module ne dépend de rien. Il est importé par pages.js (Conseil,
   l’Atelier), accueil.js (l’accueil) et prix.js (le calculateur) ; sur
   les pages anciennes, js/cookies.js le charge après l’accord seulement.
   Les écouteurs délégués (clics, volets de FAQ) se posent une seule fois
   par page (window.__civikMesures), même si le module est chargé à deux
   adresses.
   ===================================================================== */

const nombres = (de, a, pas = 1) => Array.from({ length: Math.floor((a - de) / pas) + 1 }, (_, i) => String(de + i * pas));
const FORMULAIRES = ['fiche_demande', 'fiche_projet', 'devis', 'contact_accueil', 'contact_conseil', 'contact_atelier'];
const PAGES = ['accueil', 'marianne', 'conseil', 'atelier', 'prix', 'demo', 'aide', 'guide', 'canal', 'livre_blanc', 'legal', 'autre'];

/* les listes fermées : un événement, ses paramètres, leurs valeurs possibles */
export const LISTES = {
  cta_clic: {
    emplacement: ['barre', 'tiroir', 'sous_barre', 'scene', 'carte', 'menu_final', 'bulle', 'contact', 'encart', 'contenu', 'pied'],
    destination: [...PAGES.filter(p => p !== 'autre'), 'courriel', 'externe', 'meme_page', 'autre'],
    ancre: ['aucune', 'contact', 'page_blanche', 'demande', 'devis', 'demo', 'prix', 'faq', 'deroule', 'clair', 'autre'],
    film_chapitre: ['communiquer', 'conseiller', 'creer', 'hors_film', 'sans_film']
  },
  film_arret: { arret: nombres(1, 5), forme: ['calcule', 'lecteur', 'leger'], sens: ['avant', 'arriere'] },
  film_attente: { troncon: ['T0', 'T1a', 'T1b', 'T2', 'T3'], duree: nombres(0, 20000, 250), classe: ['telephone', 'tablette', 'ordinateur'] },
  scene_choix: {
    page: ['conseil', 'atelier'],
    scene: ['chemin', 'lampe', 'tiroir'],
    choix: ['seul', 'accompagne', 'allumee', 'eteinte', 'site', 'app', 'logiciel', 'autre']
  },
  formulaire_etape: { formulaire: FORMULAIRES, etape: nombres(1, 5), sens: ['avant', 'arriere'] },
  formulaire_erreur: {
    formulaire: FORMULAIRES,
    champ: ['nom', 'courriel', 'message', 'telephone', 'structure', 'commune', 'sujet', 'choix', 'autre'],
    type: ['vide', 'format']
  },
  formulaire_echec: { formulaire: FORMULAIRES, cause: ['reseau', 'serveur', 'delai'], suite: ['aucune', 'reessayer', 'courriel', 'copie'] },
  calculateur: {
    tranche: ['moins_de_1000', '1000_a_4999', '5000_a_34999', '35000_et_plus'],
    population_corrigee: ['oui', 'non'],
    options: ['0', '1', '2']
  },
  copie: { objet: ['fiche', 'lien_estimation', 'message'] },
  telechargement: { objet: ['croquis'] },
  faq_ouverte: { page: PAGES, question: nombres(1, 40) }
};

/* pousse un événement si, et seulement si, GTM est chargé (l’accord du visiteur) et que chaque valeur est dans sa liste ;
   rend vrai si l’événement est parti (pour les essais) */
export function mesurer(evenement, parametres = {}) {
  try {
    const liste = LISTES[evenement];
    if (!liste) return false;
    const o = { event: evenement };
    /* toutes les clés de toutes les listes repartent à vide à chaque poussée : GTM garde les clés d’une poussée
       à l’autre, et la balise GA4 unique de la version 8 du conteneur lit les vingt-quatre ; une valeur absente
       reprendrait sinon celle d’un événement précédent (relevé du 20/10/2026) */
    for (const l of Object.values(LISTES)) for (const cle of Object.keys(l)) o[cle] = undefined;
    for (const [cle, valeur] of Object.entries(parametres)) {
      if (valeur === undefined || valeur === null) continue;
      const v = String(valeur);
      if (!liste[cle] || !liste[cle].includes(v)) return false;   /* hors liste : rien ne part */
      o[cle] = v;
    }
    if (window.__civikGtmLoaded !== true) return false;
    (window.dataLayer = window.dataLayer || []).push(o);
    return true;
  } catch (e) { return false; }
}

/* la tranche de population (jamais le nombre, jamais la commune) */
export function tranchePopulation(n) {
  if (!Number.isFinite(n) || n < 0) return null;
  return n < 1000 ? 'moins_de_1000' : n < 5000 ? '1000_a_4999' : n < 35000 ? '5000_a_34999' : '35000_et_plus';
}

/* la page, par son adresse (maquettes comprises : /c-film/, /marianne-base/) */
export function pageDe(chemin = location.pathname) {
  const p = chemin.replace(/index\.html$/, '');
  if (p === '/' || /\/c-film\/$/.test(p)) return 'accueil';
  if (/\/(marianne|marianne-base)\//.test(p)) return 'marianne';
  if (/\/conseil\/$/.test(p)) return 'conseil';
  if (/\/atelier\/$/.test(p)) return 'atelier';
  if (/\/chatbot-mairie-prix\.html$/.test(p)) return 'prix';
  if (/\/demo(\.html)?$/.test(p)) return 'demo';
  if (/\/aide\.html$/.test(p)) return 'aide';
  if (/\/legal\//.test(p)) return 'legal';
  if (/\/marianne-(whatsapp|messenger)\.html$/.test(p)) return 'canal';
  if (/\/livre-blanc\.html$/.test(p)) return 'livre_blanc';
  if (/\.html$/.test(p)) return 'guide';
  return 'autre';
}

/* le nom fermé d’un formulaire de la maison (data-formulaire s’il est dans la liste, sinon sa forme) */
export function nomFormulaire(form) {
  if (!form || !form.matches) return null;
  const d = form.dataset && form.dataset.formulaire;
  if (d && FORMULAIRES.includes(d)) return d;
  if (form.matches('[data-pas-form]')) return 'fiche_demande';
  if (form.matches('[data-projet]')) return 'fiche_projet';
  if (form.matches('.pm-form')) return 'devis';
  if (form.matches('[data-court]')) { const p = pageDe(); return ['accueil', 'conseil', 'atelier'].includes(p) ? 'contact_' + p : null; }
  return null;
}

/* le nom fermé d’un champ (formulaire_erreur) */
const CHAMPS = { nom: 'nom', name: 'nom', email: 'courriel', courriel: 'courriel', message: 'message', besoin: 'message', libre: 'message', idee: 'message', mot: 'message', tel: 'telephone', structure: 'structure', commune: 'commune', sujet: 'sujet', type: 'choix', qui: 'choix' };
export const nomChamp = c => (c && CHAMPS[c.name]) || 'autre';

/* une erreur de champ : seulement au passage à l’erreur (pas à chaque frappe) */
export function erreurChamp(c, type) {
  const f = nomFormulaire(c && c.form);
  if (f) mesurer('formulaire_erreur', { formulaire: f, champ: nomChamp(c), type });
}

/* ---------- les écouteurs délégués ---------- */
function destinationDe(a) {
  const brut = a.getAttribute('href') || '';
  if (/^mailto:/i.test(brut)) return { destination: 'courriel', ancre: 'aucune' };
  if (/^(tel|sms):/i.test(brut)) return null;
  let u; try { u = new URL(brut, location.href); } catch (e) { return null; }
  const ancres = { contact: 'contact', 'page-blanche': 'page_blanche', demande: 'demande', devis: 'devis', demo: 'demo', prix: 'prix', pricing: 'prix', tarifs: 'prix', faq: 'faq', deroule: 'deroule', clair: 'clair' };
  const h = u.hash.replace(/^#/, '');
  const ancre = !h ? 'aucune' : (ancres[h] || 'autre');
  if (u.origin !== location.origin) return { destination: 'externe', ancre: 'aucune' };
  if (u.pathname === location.pathname && h) return { destination: 'meme_page', ancre };
  return { destination: pageDe(u.pathname), ancre };
}
function emplacementDe(el) {
  const ou = [
    ['.bulle-projet', 'bulle'], ['.p2-menu, .menu .liens', 'menu_final'], ['.nav__tiroir, .cc-tiroir', 'tiroir'],
    ['.cc-sousbarre', 'sous_barre'], ['.nav, .cc-barre', 'barre'], ['.pied, .cc-pied, footer', 'pied'], ['.prop', 'carte'],
    ['.bloc, .croisement, .entree, .heros, .hero', 'scene'], ['.contact, .contact-sec, .ecrire', 'contact'], ['.encart, .cta-encart', 'encart']
  ];
  for (const [s, nom] of ou) if (el.closest(s)) return nom;
  return /(^|\s)(btn|cta)/.test(el.className || '') ? 'contenu' : null;
}
function chapitreDuFilm() {
  if (pageDe() !== 'accueil') return 'sans_film';
  if (document.documentElement.classList.contains('hors-film')) return 'hors_film';
  const ici = document.querySelector('.rail button.ici[data-chap]');
  return ici ? (['communiquer', 'conseiller', 'creer'][Number(ici.dataset.chap)] || 'hors_film') : 'hors_film';
}
function surClic(e) {
  const t = e.target && e.target.closest ? e.target : null; if (!t) return;
  const page = pageDe();
  /* les scènes : le chemin de Conseil, la lampe et les tiroirs de l’Atelier */
  const chemin = t.closest('[data-choix-btn], [data-fleche]');
  if (chemin && page === 'conseil') { const c = chemin.dataset.choixBtn || chemin.dataset.fleche; mesurer('scene_choix', { page, scene: 'chemin', choix: c === 'g' ? 'seul' : 'accompagne' }); return; }
  const fil = t.closest('[data-fil]');
  if (fil && page === 'atelier') { setTimeout(() => mesurer('scene_choix', { page, scene: 'lampe', choix: /Éteindre/.test(fil.getAttribute('aria-label') || '') ? 'allumee' : 'eteinte' }), 80); return; }
  const tiroir = t.closest('[data-tiroir]');
  if (tiroir && page === 'atelier') { mesurer('scene_choix', { page, scene: 'tiroir', choix: tiroir.dataset.tiroir }); return; }
  /* ce que le visiteur emporte */
  if (t.closest('[data-copier-fiche]')) { mesurer('copie', { objet: 'fiche' }); return; }
  if (t.closest('.pm-sorties [data-partager]')) { mesurer('copie', { objet: 'lien_estimation' }); return; }
  if (t.closest('[data-copier-message]')) { mesurer('copie', { objet: 'message' }); return; }
  if (t.closest('[data-telecharger]')) { mesurer('telechargement', { objet: 'croquis' }); return; }
  /* les appels : un lien (bouton, barre, pied, carte, menu final, bulle) */
  const a = t.closest('a[href]'); if (!a) return;
  const emplacement = emplacementDe(a); if (!emplacement) return;
  const d = destinationDe(a); if (!d) return;
  mesurer('cta_clic', { emplacement, destination: d.destination, ancre: d.ancre, film_chapitre: chapitreDuFilm() });
}
function surVolet(e) {
  const d = e.target;
  if (!d || d.tagName !== 'DETAILS' || !d.open) return;
  const liste = d.closest('.faq__liste, .faq, [data-faq]') || d.parentElement;
  if (!liste) return;
  const i = Array.from(liste.querySelectorAll('details')).indexOf(d) + 1;
  if (i > 0) mesurer('faq_ouverte', { page: pageDe(), question: i });
}
export function poserEcouteurs() {
  if (window.__civikMesures) return;
  window.__civikMesures = true;
  document.addEventListener('click', surClic, true);
  document.addEventListener('toggle', surVolet, true);   /* toggle ne remonte pas : capture */
}
poserEcouteurs();
