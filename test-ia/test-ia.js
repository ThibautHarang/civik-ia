/* =====================================================================
   Le test IA des collectivités (civik-ia.fr/test-ia/), 28/10/2026.
   Tout le contenu vient de questions.json (questions, révélations, profils, gestes, appel à l'action, pied,
   libellés d'interface) ; ce fichier ne porte que la mécanique. Aucune dépendance, aucune ressource tierce.

   Deux mesures, toutes deux ÉTEINTES par les interrupteurs ci-dessous tant que la DAJF et Thibaut n'ont pas
   validé (brief, section 7 ; avis DSI du 28/10/2026 sur les compteurs) :
   1. MESURE_DATALAYER : les événements test_debut, test_profil, test_reponse, test_fin, test_cta et test_partage,
      sur le contrat de commun/pages/mesures.js (rien tant que window.__civikGtmLoaded n'est pas vrai, chaque
      paramètre dans une liste fermée écrite ici, une valeur hors liste fait tomber l'événement, jamais de nom,
      de courriel, de texte saisi ni de commune) ; mesures.js n'est pas modifié.
   2. COMPTEUR_SERVEUR : les compteurs nginx sans cookie ni adresse IP, navigator.sendBeacon en POST sans corps
      vers /_mesure/test-ia/debut, /_mesure/test-ia/fin/p{1|2|3}/{0..6} et /_mesure/test-ia/cta/{formulaire|mail|
      conseil|guide}, repli fetch keepalive, le tout dans un try/catch. La ligne nginx n'est pas posée. Le
      démarrage porte le canal dans le chemin (debut/{direct|li|...}) ; fin et cta ne le portent jamais.
   Règle de la DAJF (avis du 28/10/2026, section 4) : aucun rapprochement entre les données de Google Analytics
   et les prises de contact (limitation des finalités, RGPD, article 5.1.b). MESURE_DETAILLEE éteint : test_profil,
   test_reponse et test_fin ne partent jamais vers le dataLayer, même si MESURE_DATALAYER est allumé (seuls
   test_debut, test_cta et test_partage) ; il ne s'allume qu'après les quatre conditions de l'avis (politique de
   confidentialité, mot « anonyme », localisation coupée dans la propriété).

   Le formulaire de contact part par la route du site (POST https://api.civik-ia.fr/api/site/contact, même
   format d'envoi que commun/pages/pages.js) et repart vers Formspree sur toute réponse autre qu'un 200 ok:true,
   une coupure ou 9 s de silence. Le nom de formulaire NOM_FORMULAIRE doit exister dans FORMULAIRES de
   07-Backend/site_contact.py (et dans la liste de mesures.js) avant la mise en ligne, sinon la route répond
   400 et l'envoi passe par Formspree.
   ===================================================================== */
const MESURE_DATALAYER = false;
const MESURE_DETAILLEE = false;   /* test_profil, test_reponse, test_fin : jamais tant qu'il est éteint (DAJF, 28/10/2026) */
const COMPTEUR_SERVEUR = false;
const VERSION = '2026-10-29a';
const CANON = 'https://civik-ia.fr/test-ia/';
const ROUTE = 'https://api.civik-ia.fr/api/site/contact';
const DELAI_ROUTE = 9000;
const SECOURS = 'https://formspree.io/f/mnjogblz';
const DELAI_SECOURS = 10000;
const NOM_FORMULAIRE = 'contact_test_ia';
const CLE_SESSION = 'civik-test-ia';
const SRC = ['li', 'li-page', 'x', 'fb', 'ig', 'mail', 'collegue', 'qr', 'rdv'];
const PROFIL_CODE = { premiers_pas: 'p1', en_reflexion: 'p2', prets_a_agir: 'p3' };
/* l'illustration d'un profil vient de la banque ; sans elle, pas d'image */

/* ---------- les listes fermées de la mesure (contrat de mesures.js) ---------- */
const QUESTIONS_IDS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6-cabinet', 'q6-dgs', 'q6-elu', 'q6-agent', 'q7', 'q8', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11', 'r12'];
const LISTES_TEST = {
  test_debut: { entree: ['direct', 'question_partagee'], src: [...SRC, 'direct'] },
  test_profil: { role: ['elu', 'dgs', 'cabinet', 'agent', 'autre', 'passe'], taille: ['moins_1000', '1000_3500', '3500_20000', 'plus_20000', 'interco', 'dept_region', 'passe'] },
  test_reponse: { question: QUESTIONS_IDS, resultat: ['exact', 'presque', 'faux'] },
  test_fin: { profil: ['premiers_pas', 'en_reflexion', 'prets_a_agir'], score: ['0', '1', '2', '3', '4', '5', '6'] },
  test_cta: { destination: ['formulaire', 'mail', 'conseil', 'guide'] },
  test_partage: { canal: ['natif', 'linkedin', 'copie', 'collegue', 'impression'] }
};
let listesMaison = null;   /* les clés de mesures.js, pour les remettre à vide à chaque poussée (GTM garde les clés) */
async function mesurer(evenement, parametres = {}) {
  try {
    if (!MESURE_DATALAYER) return false;
    const liste = LISTES_TEST[evenement];
    if (!liste) return false;
    if (!MESURE_DETAILLEE && ['test_profil', 'test_reponse', 'test_fin'].includes(evenement)) return false;
    const valeurs = {};
    for (const [cle, valeur] of Object.entries(parametres)) {
      if (valeur === undefined || valeur === null) continue;
      const v = String(valeur);
      if (!liste[cle] || !liste[cle].includes(v)) return false;   /* hors liste : rien ne part */
      valeurs[cle] = v;
    }
    if (window.__civikGtmLoaded !== true) return false;
    if (!listesMaison) { try { listesMaison = (await import('/commun/pages/mesures.js')).LISTES || {}; } catch (e) { listesMaison = {}; } }
    const o = { event: evenement };
    for (const l of Object.values(listesMaison)) for (const cle of Object.keys(l)) o[cle] = undefined;
    for (const l of Object.values(LISTES_TEST)) for (const cle of Object.keys(l)) o[cle] = undefined;
    Object.assign(o, valeurs);
    (window.dataLayer = window.dataLayer || []).push(o);
    return true;
  } catch (e) { return false; }
}
/* le compteur côté serveur : un POST sans corps, chemin dans une liste fermée, rien d'autre */
const CHEMIN_COMPTEUR = /^test-ia\/(debut\/(direct|li|li-page|x|fb|ig|mail|collegue|qr|rdv)|fin\/p[1-3]\/[0-6]|cta\/(formulaire|mail|conseil|guide))$/;
function compter(chemin) {
  try {
    if (!COMPTEUR_SERVEUR || !CHEMIN_COMPTEUR.test(chemin)) return;
    const url = '/_mesure/' + chemin;
    let parti = false;
    if (navigator.sendBeacon) { try { parti = navigator.sendBeacon(url); } catch (e) { parti = false; } }
    if (!parti && window.fetch) fetch(url, { method: 'POST', keepalive: true, credentials: 'omit' }).catch(() => {});
  } catch (e) { /* rien */ }
}

/* ---------- petits outils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const T_ARME = Date.now();
const depuisLaPage = () => Math.round(typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now() - T_ARME);
function h(tag, attrs = {}, ...enfants) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of enfants.flat()) if (c !== null && c !== undefined && c !== false) e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return e;
}
const gabarit = (s, vals) => String(s || '').replace(/\{(\w+)\}/g, (m, k) => (k in vals ? String(vals[k]) : m));
/* le score au singulier pour 0 et 1 (« 1 bonne réponse sur 6 »), au pluriel au-delà */
const texteScore = (score) => gabarit(score.n <= 1 && D.resultat.score_singulier ? D.resultat.score_singulier : D.resultat.score, { n: score.n, total: score.total });
function dateLongue(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
  if (!m) return String(iso || '');
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
}
/* le chiffre de la révélation : préfixe, nombre (avec ou sans séparateur de milliers), suffixe */
function decomposerChiffre(chiffre) {
  const m = /^(\D*?)(\d[\d   ]*)(.*)$/.exec(String(chiffre || ''));
  if (!m) return null;
  const sep = (m[2].match(/[   ]/) || [''])[0];
  return { avant: m[1], apres: m[3], sep };
}
function formaterNombre(v, sep) {
  const s = String(Math.round(v));
  if (!sep) return s;
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}
function animerChiffre(el, chiffre, valeur, duree = 900, depuis = 0) {
  const d = decomposerChiffre(chiffre);
  if (!d || typeof valeur !== 'number' || !isFinite(valeur) || reduit()) { el.textContent = chiffre; return; }
  const t0 = performance.now(), de = typeof depuis === 'number' && isFinite(depuis) ? depuis : 0;
  const pas = now => {
    const k = Math.min(1, (now - t0) / duree), e = 1 - Math.pow(1 - k, 3);
    el.textContent = d.avant + formaterNombre(de + (valeur - de) * e, d.sep) + d.apres;
    if (k < 1) requestAnimationFrame(pas); else el.textContent = chiffre;
  };
  el.textContent = d.avant + formaterNombre(de, d.sep) + d.apres;
  requestAnimationFrame(pas);
}
const classeChiffre = s => { const n = String(s || '').length; return n <= 6 ? 'chiffre--court' : n <= 11 ? 'chiffre--moyen' : 'chiffre--long'; };
async function copier(texte) {
  try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(texte); return true; } } catch (e) { /* on tente l'ancienne voie */ }
  try {
    const ta = h('textarea', { class: 'sr', 'aria-hidden': 'true' }); ta.value = texte; document.body.append(ta); ta.select();
    const ok = document.execCommand && document.execCommand('copy'); ta.remove(); return !!ok;
  } catch (e) { return false; }
}

/* ---------- l'état ---------- */
let D = null, I = null;               /* questions.json ; ses libellés d'interface */
const parId = {};
const etat = { q: null, src: 'direct', entree: 'direct', slots: [], i: 0, phase: 'question', reponses: {}, role: null, taille: null, profilFait: false };
let racine = null, zoneEcran = null, zoneFil = null;

function lireParametres() {
  const p = new URLSearchParams(location.search);
  const src = p.get('src') || '';
  etat.src = SRC.includes(src) ? src : 'direct';
  const q = (p.get('q') || '').trim();
  etat.q = q && parId[q] && parId[q].type !== 'situation' ? q : null;
}
/* le parcours : huit emplacements ; une question partagée vient en tête, une réserve prend la place dite par
   « remplace » (q7 sinon), une variante de q6 prend la place de q6 (plus de résolution par rôle) */
function construireParcours() {
  const slots = D.parcours.map(s => ({ emplacement: s.emplacement, question: s.question || null, par_role: s.par_role || null }));
  const q = etat.q && parId[etat.q];
  etat.entree = 'direct';
  if (!q) return slots;
  let idx = slots.findIndex(s => s.question === q.id);
  if (idx < 0 && slots.some(s => s.par_role && Object.values(s.par_role).includes(q.id))) idx = slots.findIndex(s => s.par_role && Object.values(s.par_role).includes(q.id));
  if (idx < 0) {
    let cible = q.remplace || 'q7';
    const slotCible = slots.find(s => s.emplacement === cible);
    if (!slotCible || (slotCible.question && parId[slotCible.question] && parId[slotCible.question].type === 'situation')) cible = 'q7';
    idx = slots.findIndex(s => s.emplacement === cible);
  }
  if (idx < 0) return slots;
  slots.splice(idx, 1);
  slots.unshift({ emplacement: q.id, question: q.id, par_role: null });
  etat.entree = 'question_partagee';
  return slots;
}
const roleEffectif = () => etat.role || 'passe';
function questionDuSlot(slot) {
  if (slot.question) return parId[slot.question];
  const r = slot.par_role || {};
  return parId[r[roleEffectif()] || r.passe || Object.values(r)[0]];
}
const questionCourante = () => questionDuSlot(etat.slots[etat.i]);
const groupeTaille = () => { const t = etat.taille && D.tailles.find(x => x.id === etat.taille); return t ? t.groupe : 'inconnue'; };
const libelleRole = () => { const r = D.roles.find(x => x.id === etat.role); return r ? r.libelle : ''; };
const libelleTaille = () => { const t = D.tailles.find(x => x.id === etat.taille); return t ? t.libelle : ''; };

/* la reprise : l'état en mémoire, recopié dans sessionStorage (dans un try/catch, la page marche sans) */
function garder() {
  try {
    sessionStorage.setItem(CLE_SESSION, JSON.stringify({ v: VERSION, q: etat.q, i: etat.i, phase: etat.phase, reponses: etat.reponses, role: etat.role, taille: etat.taille, profilFait: etat.profilFait, slots: etat.slots }));
  } catch (e) { /* rien */ }
}
function reprendre() {
  try {
    const s = JSON.parse(sessionStorage.getItem(CLE_SESSION) || 'null');
    if (!s || s.v !== VERSION || s.q !== etat.q || !Array.isArray(s.slots) || s.slots.length !== etat.slots.length) return false;
    if (!['question', 'revelation', 'profil', 'resultat'].includes(s.phase)) return false;
    etat.i = Math.min(Math.max(0, s.i | 0), etat.slots.length - 1); etat.phase = s.phase; etat.reponses = s.reponses || {};
    etat.role = s.role; etat.taille = s.taille; etat.profilFait = !!s.profilFait; etat.slots = s.slots;
    return true;
  } catch (e) { return false; }
}

/* ---------- le verdict ---------- */
function verdictDe(q, reponse) {
  if (q.type === 'estimation') {
    const ecart = Math.abs(Number(reponse) - Number(q.reponse)), s = D.seuils_estimation;
    return ecart <= s.exact ? 'exact' : ecart <= s.presque ? 'presque' : 'faux';
  }
  if (q.type === 'frise') return Object.keys(q.reponse).every(c => reponse && reponse[c] === q.reponse[c]) ? 'exact' : 'faux';
  return reponse === q.reponse ? 'exact' : 'faux';
}
function revelationDe(q, reponse) {
  if (q.type !== 'situation') return q.revelation;
  if (q.revelation_par_choix) return q.revelation_par_choix[reponse] || null;
  if (q.revelation_par_taille) return q.revelation_par_taille[groupeTaille()] || q.revelation_par_taille.inconnue || null;
  return null;
}

/* ---------- le rendu ---------- */
function poserTete() {
  const tete = h('header', { class: 'tete' },
    h('h1', { class: 'tete__titre' }, h('span', { text: D.titre }), ' ', h('span', { class: 'tete__sep', 'aria-hidden': 'true', text: '·' }), ' ', h('span', { class: 'tete__sous', text: D.sous_titre })),
    h('p', { class: 'tete__droit', text: gabarit(I.point_du_droit, { date: dateLongue(D.point_du_droit) }) })
  );
  zoneFil = h('div', { class: 'fil', 'aria-hidden': 'true' });
  for (let k = 0; k < etat.slots.length; k++) {
    if (k) zoneFil.append(h('span', { class: 'fil__seg' }));
    zoneFil.append(h('span', { class: 'fil__pt' }));
  }
  zoneEcran = h('div', { class: 'test__ecran' });
  racine.replaceChildren(tete, zoneFil, zoneEcran);
}
/* le fil s'allume jusqu'au point courant (tous à la fin) */
function allumerFil(n, fini = false) {
  const pts = zoneFil.querySelectorAll('.fil__pt'), segs = zoneFil.querySelectorAll('.fil__seg');
  pts.forEach((p, k) => { p.classList.toggle('fil__pt--allume', k <= n || fini); p.classList.toggle('fil__pt--courant', !fini && k === n); });
  segs.forEach((s, k) => s.classList.toggle('fil__seg--allume', k < n || fini));
}
function montrer(ecran, vivant = false) {
  if (vivant) zoneEcran.setAttribute('aria-live', 'polite'); else zoneEcran.removeAttribute('aria-live');
  zoneEcran.replaceChildren(ecran);
  racine.classList.toggle('test__in--resultat', etat.phase === 'resultat');
  if (etat.phase !== 'resultat') racine.classList.remove('test__in--dessin');
  try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); }
  const cible = ecran.querySelector('[data-focus]') || ecran;
  if (!cible.hasAttribute('tabindex')) cible.setAttribute('tabindex', '-1');
  cible.focus({ preventScroll: true });
  garder();
}
const titreEtape = (gab) => h('h2', { class: 'sr', 'data-focus': '', text: gabarit(gab, { n: etat.i + 1, total: etat.slots.length }) });

/* ----- une question ----- */
function ecranQuestion() {
  const q = questionCourante();
  etat.phase = 'question';
  allumerFil(etat.i);
  const ecran = h('section', { class: 'ecran ecran--question ecran--' + q.type },
    titreEtape(I.question_sur),
    h('p', { class: 'etape', 'aria-hidden': 'true', text: gabarit(I.question_sur, { n: etat.i + 1, total: etat.slots.length }) }),
    h('p', { class: 'question', text: q.enonce }));
  if (q.consigne) ecran.append(h('p', { class: 'consigne', text: q.consigne }));
  if (q.type === 'estimation') ecran.append(widgetEstimation(q));
  else if (q.type === 'frise') ecran.append(widgetFrise(q));
  else ecran.append(widgetChoix(q));
  if (etat.i === 0) ecran.append(h('p', { class: 'promesse', text: D.promesse }));
  montrer(ecran);
  if (etat.i === 0 && !etat._debutMesure) { etat._debutMesure = true; mesurer('test_debut', { entree: etat.entree, src: etat.src }); compter('test-ia/debut/' + etat.src); }
}
function repondre(q, reponse) {
  const verdict = q.type === 'situation' ? null : verdictDe(q, reponse);
  etat.reponses[q.id] = { reponse, verdict, slot: etat.i };
  if (verdict) mesurer('test_reponse', { question: q.id, resultat: verdict });
  ecranRevelation(q);
}
function widgetChoix(q) {
  const deux = q.choix.length === 2 && q.choix.every(c => c.libelle.length <= 6);
  const bloc = h('div', { class: 'choix' + (deux ? ' choix--deux' : ''), role: 'group', 'aria-label': q.enonce });
  q.choix.forEach(c => bloc.append(h('button', { type: 'button', class: 'choix__b', 'aria-pressed': 'false', onclick: e => {
    bloc.querySelectorAll('.choix__b').forEach(b => { b.setAttribute('aria-pressed', 'false'); b.disabled = true; });
    e.currentTarget.setAttribute('aria-pressed', 'true');
    setTimeout(() => repondre(q, c.id), reduit() ? 0 : 180);
  } }, h('span', { class: 'choix__t', text: c.libelle }), h('span', { class: 'choix__rond', 'aria-hidden': 'true' }))));
  return bloc;
}
function widgetEstimation(q) {
  const e = q.echelle || { min: 0, max: 100, pas: 1, unite: '%' }, unite = e.unite ? ' ' + e.unite : '';
  const fmt = v => String(v) + unite;
  let touche = false;
  const valeur = h('p', { class: 'estim__valeur', 'aria-hidden': 'true' }, h('small', { text: I.estimation.invite }));
  const curseur = h('input', { type: 'range', id: 'curseur', class: 'estim__curseur sans-valeur', min: e.min, max: e.max, step: e.pas, value: Math.round((e.min + e.max) / 2), 'aria-label': I.estimation.champ, 'aria-valuetext': I.estimation.invite });
  const valider = h('button', { type: 'button', class: 'btn btn--plein', text: I.valider, disabled: true });
  const piste = h('div', { class: 'estim__piste' }, curseur);
  const poserPiste = () => piste.style.setProperty('--p', ((Number(curseur.value) - e.min) / (e.max - e.min) * 100).toFixed(2) + '%');
  const montrerValeur = () => { touche = true; curseur.classList.remove('sans-valeur'); valeur.textContent = fmt(curseur.value); curseur.setAttribute('aria-valuetext', fmt(curseur.value)); valider.disabled = false; poserPiste(); };
  const bouger = d => { curseur.value = Math.min(e.max, Math.max(e.min, Number(curseur.value) + d * (e.pas || 1))); montrerValeur(); };
  poserPiste();
  curseur.addEventListener('input', montrerValeur);
  curseur.addEventListener('pointerdown', () => { if (!touche) setTimeout(montrerValeur, 0); });
  curseur.addEventListener('keydown', ev => { if (!touche && /^Arrow|^Home$|^End$|^Page/.test(ev.key)) setTimeout(montrerValeur, 0); if (ev.key === 'Enter' && touche) { ev.preventDefault(); valider.click(); } });
  valider.addEventListener('click', () => { if (!touche) return; valider.disabled = true; repondre(q, Number(curseur.value)); });
  return h('div', { class: 'estim' },
    valeur,
    piste,
    h('div', { class: 'estim__bornes', 'aria-hidden': 'true' }, h('span', { text: fmt(e.min) }), h('span', { text: fmt(e.max) })),
    h('div', { class: 'estim__pm' },
      h('button', { type: 'button', class: 'pm', 'aria-label': I.estimation.moins, text: '−', onclick: () => bouger(-1) }),
      valider,
      h('button', { type: 'button', class: 'pm', 'aria-label': I.estimation.plus, text: '+', onclick: () => bouger(1) }))
  );
}
/* la frise : une carte par règle, ses dates en boutons radio ; une date déjà prise s'échange (29/10/2026) */
function widgetFrise(q) {
  const place = {};            /* carte -> date */
  const carteDe = id => q.cartes.find(c => c.id === id), dateDe = id => q.dates.find(d => d.id === id);
  const lu = h('p', { class: 'sr', 'aria-live': 'polite' });
  const valider = h('button', { type: 'button', class: 'btn btn--plein', text: I.valider, disabled: true });
  const complet = () => q.cartes.every(c => place[c.id]);
  const rendre = () => {
    groupes.forEach(g => {
      const b = [...g.children], tab = b.find(x => x.dataset.date === place[g.dataset.carte]) || b[0];
      b.forEach(x => { x.setAttribute('aria-checked', String(x.dataset.date === place[g.dataset.carte])); x.tabIndex = x === tab ? 0 : -1; });
    });
    valider.disabled = !complet();
  };
  /* la date va à la règle ; la règle qui l'avait prend l'ancienne date de celle-ci, ou plus rien */
  const poser = (c, d) => {
    if (place[c] === d) return;
    const autre = q.cartes.map(x => x.id).find(k => place[k] === d), ancienne = place[c];
    place[c] = d;
    if (autre) { if (ancienne) place[autre] = ancienne; else delete place[autre]; }
    const v = { carte: carteDe(c).libelle, date: dateDe(d).libelle, autre: autre ? carteDe(autre).libelle : '', ancienne: ancienne ? dateDe(ancienne).libelle : '' };
    lu.textContent = gabarit(!autre ? I.frise.pose_lue : ancienne ? I.frise.echange_lue : I.frise.deplace_lue, v);
    rendre();
  };
  const groupes = q.cartes.map(c => {
    const g = h('div', { class: 'carte__dates', role: 'radiogroup', 'aria-labelledby': 'frise-' + c.id, 'data-carte': c.id, onkeydown: e => {
      const pas = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!pas) return;
      e.preventDefault();
      const b = [...g.children], x = b[(Math.max(0, b.indexOf(document.activeElement)) + pas + b.length) % b.length];
      x.focus(); poser(c.id, x.dataset.date);
    } });
    /* « 2 décembre 2027 » sur deux lignes : les trois dates tiennent sur une ligne à 375 px */
    q.dates.forEach(d => { const m = /^(.*\S)\s+(\d{4})$/.exec(d.libelle); g.append(h('button', { type: 'button', class: 'date', role: 'radio', 'aria-checked': 'false', 'data-date': d.id, onclick: () => poser(c.id, d.id) }, m ? [h('span', { class: 'date__jour', text: m[1] }), ' ', h('span', { class: 'date__an', text: m[2] })] : d.libelle)); });
    return g;
  });
  valider.addEventListener('click', () => { if (!complet()) return; valider.disabled = true; repondre(q, Object.fromEntries(q.cartes.map(c => [c.id, place[c.id]]))); });
  rendre();
  return h('div', { class: 'frise' }, h('p', { class: 'consigne', text: I.frise.consigne }),
    h('div', { class: 'frise__cartes' }, q.cartes.map((c, k) => h('div', { class: 'carte' }, h('p', { class: 'carte__t', id: 'frise-' + c.id, text: c.libelle }), groupes[k]))),
    lu, h('div', { class: 'ecran__actions' }, valider));
}

/* ----- la révélation ----- */
function sourcesDe(q) {
  const liste = (q.sources || []).filter(s => s && (s.libelle || s.lien));
  if (!liste.length) return null;
  const p = h('p', { class: 'source' }, h('span', { class: 'source__lab', text: (liste.length > 1 ? I.sources : I.source) + ' : ' }));
  liste.forEach((s, k) => {
    if (k) p.append(' ; ');
    if (s.lien) p.append(h('a', { href: s.lien, target: '_blank', rel: 'noopener', text: s.libelle || s.lien }));
    else p.append(s.libelle);
    const v = String(s.verifie_le || '').trim();
    if (v) p.append(', ' + I.verifie_le + ' ' + dateLongue(v));
  });
  p.append('.');
  return p;
}
function echelleEstimation(q, vous) {
  const e = q.echelle || { min: 0, max: 100, unite: '%' }, unite = e.unite ? ' ' + e.unite : '';
  const pos = v => Math.max(0, Math.min(100, ((v - e.min) / (e.max - e.min)) * 100));
  const pv = pos(vous), pr = pos(q.reponse), anime = !reduit();
  const bord = p => p < 10 ? ' echelle__pt--bord-g' : p > 90 ? ' echelle__pt--bord-d' : '';
  const ecart = h('span', { class: 'echelle__ecart', style: `left:${Math.min(pv, anime ? pv : pr)}%;width:${anime ? 0 : Math.abs(pv - pr)}%` });
  const vrai = h('span', { class: 'echelle__pt echelle__pt--vrai' + bord(pr), style: `left:${anime ? pv : pr}%` }, h('i'), h('b', { text: q.reponse + unite }));
  const ech = h('div', { class: 'echelle' + (anime ? ' echelle--arrive' : ''), role: 'img', 'aria-label': gabarit(I.estimation.ecart_lu, { vous: vous + unite, vrai: q.reponse + unite }) },
    h('div', { class: 'echelle__ligne' }),
    h('div', { class: 'echelle__bornes', 'aria-hidden': 'true' }, h('span', { text: e.min + unite }), h('span', { text: e.max + unite })),
    ecart,
    h('span', { class: 'echelle__pt echelle__pt--vous' + bord(pv), style: `left:${pv}%` }, h('i'), h('b', { text: I.estimation.vous + ' · ' + vous + unite })),
    vrai
  );
  if (anime) requestAnimationFrame(() => requestAnimationFrame(() => {
    vrai.style.left = pr + '%';
    ecart.style.left = Math.min(pv, pr) + '%'; ecart.style.width = Math.abs(pv - pr) + '%';
  }));
  return ech;
}
function friseVraie(q, placeVisiteur) {
  const carteDe = id => q.cartes.find(c => c.id === id);
  const dateDuVisiteur = carte => (placeVisiteur || {})[carte] || null;
  const ol = h('ol', { class: 'frise-vraie' + (reduit() ? '' : ' frise-vraie--arrive') });
  const cellules = {};
  q.dates.forEach(d => {
    const bonne = Object.keys(q.reponse).find(c => q.reponse[c] === d.id);
    const vous = Object.keys(placeVisiteur || {}).find(c => placeVisiteur[c] === d.id);
    const li = h('li', { 'data-date': d.id }, h('span', { class: 'date__lib', text: d.libelle }));
    if (bonne) li.append(h('span', { class: 'date__carte' + (dateDuVisiteur(bonne) === d.id ? ' date__carte--juste' : ' date__carte--bouge'), 'data-de': dateDuVisiteur(bonne) || '', text: carteDe(bonne).libelle }));
    if (vous && vous !== bonne) li.append(h('span', { class: 'vous-aviez', text: gabarit(I.frise.vous_aviez, { carte: carteDe(vous).libelle }) }));
    cellules[d.id] = li; ol.append(li);
  });
  if (!reduit()) requestAnimationFrame(() => {
    ol.querySelectorAll('.date__carte--bouge').forEach(c => {
      const de = cellules[c.dataset.de]; if (!de) return;
      const dx = de.getBoundingClientRect().left - c.parentNode.getBoundingClientRect().left;
      c.style.transform = `translateX(${dx}px)`;
      requestAnimationFrame(() => requestAnimationFrame(() => { c.style.transform = 'translateX(0)'; }));
    });
  });
  return ol;
}
/* la source courte de l'écran (source_ecran, le lien de la première source, « vérifié le ») ; sinon les sources entières */
function sourceCourte(q) {
  if (!q.source_ecran) return sourcesDe(q);
  const liste = (q.sources || []).filter(Boolean);
  const premiere = liste.find(x => x.lien) || liste[0] || {};
  const v = String((liste.find(x => String(x.verifie_le || '').trim()) || {}).verifie_le || '').trim();
  const p = h('p', { class: 'source' }, h('span', { class: 'source__lab', text: I.source + ' : ' }));
  p.append(premiere.lien ? h('a', { href: premiere.lien, target: '_blank', rel: 'noopener', text: q.source_ecran }) : q.source_ecran);
  if (v) p.append(', ' + I.verifie_le + ' ' + dateLongue(v));
  p.append('.');
  return p;
}
const pourVotreCollectivite = texte => h('p', { class: 'pour' }, h('span', { class: 'pour__lab', text: (I.pour_votre_collectivite || 'Pour votre collectivité') + ' : ' }), texte);
/* « Le détail », replié : la phrase entière, le complément, la ligne entière si elle diffère, les sources, le guide */
function detailDe(q, rev, ec) {
  const bloc = h('div', { class: 'detail', id: 'detail-' + q.id, hidden: true });
  if (ec.phrase && rev.phrase && rev.phrase !== ec.phrase) bloc.append(h('p', { class: 'detail__phrase', text: rev.phrase }));
  if (q.complement && q.complement.affiche === true && q.complement.phrase) bloc.append(h('p', { class: 'complement', text: q.complement.phrase }));
  if (ec.pour_votre_collectivite && rev.pour_votre_collectivite && rev.pour_votre_collectivite !== ec.pour_votre_collectivite) bloc.append(pourVotreCollectivite(rev.pour_votre_collectivite));
  const src = sourcesDe(q); if (src) bloc.append(src);
  if (q.guide && q.guide.lien) bloc.append(h('p', { class: 'guide-lien' }, h('a', { href: q.guide.lien, text: I.guide + ' : ' + q.guide.libelle, onclick: () => { mesurer('test_cta', { destination: 'guide' }); compter('test-ia/cta/guide'); } })));
  if (!bloc.childElementCount) return null;
  const bouton = h('button', { type: 'button', class: 'btn-detail', 'aria-expanded': 'false', 'aria-controls': bloc.id, text: I.detail || 'Le détail', onclick: e => {
    const ouvre = bloc.hidden; bloc.hidden = !ouvre; e.currentTarget.setAttribute('aria-expanded', String(ouvre));
  } });
  return { bouton, bloc };
}
function ecranRevelation(q) {
  etat.phase = 'revelation';
  allumerFil(etat.i);
  const r = etat.reponses[q.id] || {}, rev = revelationDe(q, r.reponse) || {}, ec = rev.ecran || {};
  const ecran = h('section', { class: 'ecran ecran--revelation ecran--' + q.type }, titreEtape(I.reponse_a));
  if (q.type === 'situation') ecran.append(h('p', { class: 'verdict verdict--situation', text: I.situation }));
  else ecran.append(h('p', { class: 'verdict' + (r.verdict === 'exact' ? ' verdict--exact' : ''), text: D.verdicts[r.verdict] || '' }));
  if (rev.chiffre) {
    const c = h('p', { class: 'chiffre ' + classeChiffre(rev.chiffre), 'aria-label': rev.chiffre });
    ecran.append(c);
    animerChiffre(c, rev.chiffre, rev.valeur, 900, q.type === 'estimation' && typeof rev.valeur === 'number' && Number(q.reponse) === rev.valeur ? Number(r.reponse) : 0);
  }
  if (q.type === 'estimation') ecran.append(echelleEstimation(q, Number(r.reponse)));
  if (q.type === 'frise') ecran.append(friseVraie(q, r.reponse));
  const phrase = ec.phrase || rev.phrase, pour = ec.pour_votre_collectivite || rev.pour_votre_collectivite;
  if (phrase) ecran.append(h('p', { class: 'phrase', text: phrase }));
  if (pour) ecran.append(pourVotreCollectivite(pour));
  const src = sourceCourte(q); if (src) ecran.append(src);
  const detail = detailDe(q, rev, ec);
  const dernier = etat.i >= etat.slots.length - 1;
  ecran.append(h('div', { class: 'ecran__actions' }, h('button', { type: 'button', class: 'btn btn--plein', text: dernier ? I.voir_resultat : I.suivante, onclick: suivant }), detail ? detail.bouton : null));
  if (detail) ecran.append(detail.bloc);
  montrer(ecran, true);
}
function suivant() {
  const apres = Number(D.ecran_profil && D.ecran_profil.apres_question) || 1;
  if (!etat.profilFait && etat.i + 1 === apres) { ecranProfil(); return; }
  if (etat.i >= etat.slots.length - 1) { ecranResultat(); return; }
  etat.i += 1;
  ecranQuestion();
}

/* ----- l'écran de profil ----- */
function ecranProfil() {
  etat.phase = 'profil';
  const P = D.ecran_profil;
  let role = null, taille = null, parti = false;
  const continuer = h('button', { type: 'button', class: 'btn btn--plein', text: I.continuer, disabled: true });
  const finir = (r, t) => {
    if (parti) return; parti = true;
    etat.role = r; etat.taille = t; etat.profilFait = true;
    mesurer('test_profil', { role: r || 'passe', taille: t || 'passe' });
    etat.i += 1; ecranQuestion();
  };
  const rangee = (liste, poser) => {
    const bloc = h('div', { class: 'pastilles' });
    liste.forEach(x => bloc.append(h('button', { type: 'button', class: 'pastille', 'aria-pressed': 'false', text: x.libelle, onclick: e => {
      bloc.querySelectorAll('.pastille').forEach(b => b.setAttribute('aria-pressed', 'false'));
      e.currentTarget.setAttribute('aria-pressed', 'true');
      poser(x.id);
      continuer.disabled = false;
      if (role && taille) setTimeout(() => finir(role, taille), reduit() ? 0 : 320);
    } })));
    return bloc;
  };
  const ecran = h('section', { class: 'ecran ecran--profil' },
    h('h2', { class: 'ecran__titre', 'data-focus': '', text: P.titre }),
    h('div', { role: 'group', 'aria-labelledby': 'lab-role' }, h('p', { class: 'profil-lab', id: 'lab-role', text: P.libelle_role }), rangee(D.roles, id => { role = id; })),
    h('div', { role: 'group', 'aria-labelledby': 'lab-taille' }, h('p', { class: 'profil-lab', id: 'lab-taille', text: P.libelle_taille }), rangee(D.tailles, id => { taille = id; })),
    h('div', { class: 'ecran__actions' }, continuer, h('button', { type: 'button', class: 'btn-lien', text: P.passer, onclick: () => finir(null, null) }))
  );
  continuer.addEventListener('click', () => finir(role, taille));
  montrer(ecran);
}

/* ----- le résultat ----- */
function profilDe() {
  const r8 = etat.reponses.q8 && etat.reponses.q8.reponse;
  const id = Object.keys(D.resultat.profils).find(k => (D.resultat.profils[k].depuis_q8 || []).includes(r8)) || D.resultat.profil_par_defaut;
  return { id, ...D.resultat.profils[id] };
}
function scoreDe() {
  const notees = etat.slots.map(questionDuSlot).filter(q => q && q.notee);
  const n = notees.filter(q => etat.reponses[q.id] && etat.reponses[q.id].verdict === 'exact').length;
  return { n, total: notees.length, notees };
}
function gestesDe() {
  const G = D.resultat.gestes;
  const r2 = etat.reponses.q2 && etat.reponses.q2.reponse, r8 = etat.reponses.q8 && etat.reponses.q8.reponse;
  const ids = [G.par_q2[r2] || G.par_q2.nsp, G.par_q8[r8] || G.par_q8.parle, G.par_taille[groupeTaille()] || G.par_taille.inconnue];
  return ids.map(id => G.catalogue[id]).filter(Boolean);
}
const lienGuide = (href, texte, cls, aria) => h('a', { href, class: cls, text: texte, 'aria-label': aria, onclick: () => { mesurer('test_cta', { destination: 'guide' }); compter('test-ia/cta/guide'); } });

/* l'écran de fin (lot 1 de Claude Design, 28/10/2026) */
function ecranResultat() {
  etat.phase = 'resultat';
  allumerFil(etat.slots.length - 1, true);
  const R = D.resultat, profil = profilDe(), score = scoreDe(), gestes = gestesDe();
  const phraseScore = (R.phrases_score || []).find(p => score.n <= p.jusqu_a) || R.phrases_score[R.phrases_score.length - 1];
  mesurer('test_fin', { profil: profil.id, score: String(score.n) });
  compter(`test-ia/fin/${PROFIL_CODE[profil.id] || 'p2'}/${Math.min(6, score.n)}`);

  const ecran = h('section', { class: 'ecran resultat' }, h('h2', { class: 'sr', 'data-focus': '', text: I.resultat.titre }));
  /* 1. le score, une ligne */
  ecran.append(h('div', { class: 'score' },
    h('p', { class: 'score__ligne' }, h('span', { class: 'score__n', text: String(score.n) }), h('span', { class: 'score__sur', text: texteScore(score).replace(/^\d+\s*/, '') })),
    h('p', { class: 'score__phrase', text: phraseScore ? phraseScore.phrase : '' })
  ));
  /* 2. la porte : le profil et l'appel à l'action */
  const porte = blocContact(profil, score);
  ecran.append(porte);
  /* 3. les trois gestes : le numéro, le verbe, le guide sur sa ligne */
  const ol = h('ol', { class: 'gestes__liste' });
  gestes.forEach((ge, k) => ol.append(h('li', { class: 'geste' },
    h('span', { class: 'geste__n', 'aria-hidden': 'true', text: String(k + 1) }),
    h('h3', { class: 'geste__t', text: ge.titre }),
    h('p', { class: 'geste__p', text: ge.phrase }),
    lienGuide(ge.lien, I.guide, 'geste__lien', `${I.guide} : ${ge.titre}`))));
  ecran.append(h('section', { class: 'gestes', 'aria-labelledby': 'gestes-titre' }, h('h3', { class: 'gestes__titre', id: 'gestes-titre', text: R.titre_gestes }), ol));
  /* 4. faire circuler */
  ecran.append(blocCirculer());
  /* 5. revoir mes réponses et les sources */
  ecran.append(blocRevoir());
  /* 6. pour aller plus loin */
  const PL = R.plus_loin;
  ecran.append(h('div', { class: 'plus-loin' }, h('h3', { class: 'plus-loin__titre', text: PL.titre }),
    h('ul', { class: 'plus-loin__guides' }, (PL.guides || []).map(gu => h('li', {}, lienGuide(gu.lien, gu.libelle)))),
    PL.conseil ? h('p', { class: 'plus-loin__ligne' }, PL.conseil.phrase + ' ', h('a', { href: PL.conseil.lien, text: PL.conseil.libelle, onclick: () => { mesurer('test_cta', { destination: 'conseil' }); compter('test-ia/cta/conseil'); } })) : null,
    PL.marianne ? h('p', { class: 'plus-loin__ligne' }, PL.marianne.phrase + ' ', h('a', { href: PL.marianne.lien, text: PL.marianne.libelle })) : null));
  /* 7. le rappel : la seconde phrase de Thibaut et le bouton, qui rouvre le formulaire de la carte */
  const C = R.contact, suite = String(C.phrase || '').split('. ').slice(1).join('. ');
  ecran.append(h('div', { class: 'rappel' },
    suite ? h('p', { class: 'rappel__phrase', text: suite }) : null,
    h('button', { type: 'button', class: 'btn btn--plein rappel__btn', text: C.bouton, onclick: () => porte._ouvrir(true) })));
  /* 8. le pied */
  ecran.append(h('p', { class: 'pied', text: gabarit(R.pied, { date: dateLongue(D.point_du_droit) }) }));
  /* la fiche imprimée */
  ecran.append(blocImpression(profil, score, gestes));
  racine.classList.toggle('test__in--dessin', !!(profil.illustration && profil.illustration.src));
  montrer(ecran);
}

/* la porte : profil et appel à l'action ; aucune photo ni écriture manuscrite (Thibaut, 28/10/2026) */
function blocContact(profil, score) {
  const C = D.resultat.contact;
  const objet = gabarit(C.objet_courriel, { profil: profil.nom });
  const formu = formulaireCourt(profil, score, objet);
  formu.hidden = true;
  const il = profil.illustration;
  const dessin = (cls, carre) => h('figure', { class: cls }, h('img', { src: carre ? (il.src_carre || il.src) : il.src, alt: il.alt || '', width: String(carre ? 800 : (il.largeur || 1200)), height: String(carre ? 800 : (il.hauteur || 800)), decoding: 'async' }));
  const ouvrir = h('button', { type: 'button', class: 'btn btn--plein', text: C.bouton, 'aria-expanded': 'false', 'aria-controls': 'formu' });
  const basculer = (voulu) => {
    const ouvre = voulu === undefined ? formu.hidden : voulu;
    if (ouvre && !formu.hidden) { const p = formu.querySelector('input:not([type=hidden])'); if (p) p.focus(); return; }
    formu.hidden = !ouvre; ouvrir.setAttribute('aria-expanded', String(ouvre));
    if (ouvre) { mesurer('test_cta', { destination: 'formulaire' }); compter('test-ia/cta/formulaire'); const p = formu.querySelector('input:not([type=hidden])'); if (p) p.focus(); }
    else ouvrir.focus();
  };
  ouvrir.addEventListener('click', () => basculer());
  formu._fermer = () => basculer(false);
  const site = C.lien_site ? h('a', { class: 'lien', href: C.lien_site.lien, text: C.lien_site.libelle }) : null;
  const porte = h('article', { class: il && il.src ? 'porte' : 'porte porte--sans-dessin', 'aria-labelledby': 'porte-nom' },
    h('div', { class: il && il.src ? 'porte__haut' : 'porte__haut porte__haut--seul' },
      h('div', {}, h('p', { class: 'porte__lab', text: I.resultat.profil }), h('h3', { class: 'porte__nom', id: 'porte-nom', text: profil.nom })),
      il && il.src ? dessin('porte__illu', true) : null),
    il && il.src ? dessin('porte__illu porte__illu--large') : null,
    h('p', { class: 'porte__titre', text: profil.titre_cta }),
    h('p', { class: 'porte__phrase', text: C.phrase }),
    h('div', { class: 'porte__actions' }, ouvrir, site),
    h('p', { class: 'porte__qui' },
      C.portrait ? h('img', { class: 'porte__portrait', src: C.portrait.src, alt: C.portrait.alt || '', width: '44', height: '44', decoding: 'async' }) : null,
      h('span', { text: C.signature })),
    formu
  );
  porte._ouvrir = basculer;
  return porte;
}
function formulaireCourt(profil, score, objet) {
  const F = I.formulaire, R = D.resultat;
  const situation = [etat.role ? gabarit(F.situation_role, { role: libelleRole() }) : '', etat.taille ? gabarit(F.situation_taille, { taille: libelleTaille() }) : ''].filter(Boolean).join(' ');
  const message = gabarit(F.message_prerempli, { score: texteScore(score), profil: profil.nom, situation }).replace(/\n{3,}/g, '\n\n');
  const champ = (nom, lib, type, oblig, attrs = {}) => {
    const id = 'f-' + nom;
    const ctrl = type === 'textarea' ? h('textarea', { id, name: nom, rows: '6', required: oblig, ...attrs }) : h('input', { id, name: nom, type, required: oblig, ...attrs });
    return h('div', { class: 'champ' }, h('label', { for: id }, lib, oblig ? h('span', { class: 'oblig', 'aria-hidden': 'true', text: ' *' }) : null), ctrl, h('p', { class: 'erreur', role: 'alert' }));
  };
  const form = h('form', { class: 'formu', id: 'formu', novalidate: true, action: SECOURS, method: 'POST', 'aria-labelledby': 'formu-titre' },
    h('h4', { class: 'formu__titre', id: 'formu-titre', text: F.titre }),
    h('input', { type: 'hidden', name: '_subject', value: objet }),
    champ('nom', F.nom, 'text', true, { autocomplete: 'name' }),
    h('div', { class: 'formu__deux' },
      champ('fonction', F.fonction, 'text', false, { autocomplete: 'organization-title' }),
      champ('structure', F.collectivite, 'text', false, { autocomplete: 'organization' })),
    champ('email', F.courriel, 'email', true, { autocomplete: 'email', inputmode: 'email' }),
    champ('message', F.message, 'textarea', true),
    h('input', { type: 'text', name: '_gotcha', tabindex: '-1', autocomplete: 'off', class: 'sr', 'aria-hidden': 'true' }),
    h('p', { class: 'formu__legende', text: F.obligatoire }),
    h('p', { class: 'mention' }, ...mentionAvecLien(F)),
    h('div', { class: 'formu__actions' },
      h('button', { type: 'submit', class: 'btn btn--plein', text: F.envoyer }),
      h('button', { type: 'button', class: 'btn-lien', text: F.annuler, onclick: () => { if (form._fermer) form._fermer(); } })),
    h('div', { class: 'envoi', hidden: true, tabindex: '-1', 'data-statut': '' })
  );
  form.elements.message.value = message;
  form.addEventListener('submit', ev => { ev.preventDefault(); envoyer(form, objet); });
  return form;
}
function mentionAvecLien(F) {
  const t = F.mention || '', lib = F.mention_lien_texte || '';
  const i = lib ? t.lastIndexOf(lib) : -1;
  if (i < 0) return [t];
  return [t.slice(0, i), h('a', { href: F.mention_lien, target: '_blank', rel: 'noopener', text: lib }), t.slice(i + lib.length)];
}
/* la vérification des champs, comme sur les pages de la maison : le message sous le champ, le premier en erreur prend le focus */
function verifier(form) {
  const F = I.formulaire; let premier = null;
  for (const c of form.querySelectorAll('input:not([type=hidden]):not([name=_gotcha]),textarea')) {
    let m = '';
    if (c.required && !c.value.trim()) m = c.name === 'nom' ? F.manque_nom : c.name === 'email' ? F.manque_courriel : F.manque_message;
    else if (c.type === 'email' && c.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.value.trim())) m = F.format_courriel;
    c.setAttribute('aria-invalid', m ? 'true' : 'false');
    const e = c.parentNode.querySelector('.erreur'); if (e) e.textContent = m;
    if (m && !premier) premier = c;
  }
  if (premier) premier.focus();
  return !premier;
}
let cause = '';
async function envoyerParRoute(donnees) {
  const d = new FormData(); donnees.forEach((v, k) => d.append(k, v));
  d.set('formulaire', NOM_FORMULAIRE); d.set('page', location.pathname); d.set('_delai', String(depuisLaPage()));
  const ctl = 'AbortController' in window ? new AbortController() : null; let expire = false;
  const minuteur = ctl ? setTimeout(() => { expire = true; ctl.abort(); }, DELAI_ROUTE) : 0;
  try {
    const r = await fetch(ROUTE, { method: 'POST', body: d, credentials: 'omit', headers: { Accept: 'application/json' }, signal: ctl ? ctl.signal : undefined });
    if (r.status !== 200) { cause = 'serveur'; return null; }
    let j = null; try { j = await r.json(); } catch (e) { j = null; }
    if (!j || j.ok !== true) { cause = 'serveur'; return null; }   /* un 200 sans le JSON de la route n'est pas un envoi */
    cause = ''; return { numero: j.numero || '', accuse: !!j.accuse };
  } catch (e) { cause = expire ? 'delai' : 'reseau'; return null; } finally { clearTimeout(minuteur); }
}
async function envoyerSecours(donnees) {
  const ctl = 'AbortController' in window ? new AbortController() : null; let expire = false;
  const minuteur = ctl ? setTimeout(() => { expire = true; ctl.abort(); }, DELAI_SECOURS) : 0;
  try {
    const r = await fetch(SECOURS, { method: 'POST', body: donnees, headers: { Accept: 'application/json' }, signal: ctl ? ctl.signal : undefined });
    cause = r.ok ? '' : 'serveur'; return r.ok ? { numero: '', accuse: false } : null;
  } catch (e) { cause = expire ? 'delai' : 'reseau'; return null; } finally { clearTimeout(minuteur); }
}
async function envoyer(form, objet) {
  if (form.dataset.enCours || !verifier(form)) return;
  const F = I.formulaire, C = D.resultat.contact, bloc = form.querySelector('[data-statut]'), bouton = form.querySelector('[type=submit]');
  const v = n => (form.elements[n] && typeof form.elements[n].value === 'string' ? form.elements[n].value.trim() : '');
  const donnees = new FormData();
  donnees.set('nom', v('nom')); donnees.set('name', v('nom'));
  if (v('fonction')) donnees.set('fonction', v('fonction'));
  if (v('structure')) donnees.set('structure', v('structure'));
  donnees.set('email', v('email')); donnees.set('message', v('message'));
  donnees.set('_subject', objet); donnees.set('_replyto', v('email'));
  if (v('_gotcha')) donnees.set('_gotcha', v('_gotcha'));
  form.dataset.enCours = '1'; form.setAttribute('aria-busy', 'true');
  const avant = bouton.textContent; bouton.disabled = true; bouton.textContent = F.envoi; bouton.setAttribute('aria-busy', 'true');
  const inerte = 'inert' in form; if (inerte) form.inert = true;
  let res = await envoyerParRoute(donnees);
  if (!res) res = await envoyerSecours(donnees);
  if (inerte) form.inert = false;
  delete form.dataset.enCours; form.removeAttribute('aria-busy');
  bouton.textContent = avant; bouton.removeAttribute('aria-busy'); bouton.disabled = !!res;
  bloc.classList.toggle('envoi--echec', !res);
  bloc.setAttribute('role', res ? 'status' : 'alert');
  if (res) {
    form.querySelectorAll('.champ, .formu__legende').forEach(c => { c.hidden = true; });
    form.querySelector('.formu__actions').hidden = true;
    bloc.replaceChildren(h('p', { class: 'envoi__t', text: F.reussite_titre }), h('p', { text: [res.numero ? gabarit(F.reussite_fiche, { numero: res.numero }) : '', F.reussite_texte, res.accuse ? F.reussite_accuse : ''].filter(Boolean).join(' ') }));
  } else {
    const corps = v('message'), adresse = C.courriel;
    const copie = h('p', { class: 'envoi__copie', 'aria-live': 'polite' });
    bloc.replaceChildren(
      h('p', { class: 'envoi__t', text: F.echec_titre }), h('p', { text: F.echec_texte }),
      h('div', { class: 'envoi__actions' },
        h('button', { type: 'button', class: 'btn btn--plein btn--petit', text: F.reessayer, onclick: () => { bloc.hidden = true; form.requestSubmit ? form.requestSubmit() : envoyer(form, objet); } }),
        h('a', { class: 'btn btn--filet btn--petit', href: `mailto:${adresse}?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(corps)}`, text: F.par_courriel }),
        h('button', { type: 'button', class: 'btn btn--filet btn--petit', text: F.copier_message, onclick: async () => { copie.textContent = (await copier(`À : ${adresse}\nObjet : ${objet}\n\n${corps}`)) ? F.copie_ok : F.copie_echec; } })),
      h('p', { class: 'envoi__adresse' }, F.adresse_si + ' ', h('span', { class: 'envoi__mel', text: adresse })), copie);
  }
  bloc.hidden = false; bloc.focus({ preventScroll: false });
}

/* faire circuler : le collègue d'abord */
/* un pictogramme au trait : créé dans l'espace de noms SVG (un <svg> créé par createElement ne s'affiche pas) */
function icone(d) { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false'); s.innerHTML = d; return s; }
function blocCirculer() {
  const Ci = D.resultat.circuler, P = I.partage;
  const lienCollegue = CANON + '?src=collegue';
  const etatCopie = h('p', { class: 'circuler__etat', 'aria-live': 'polite' });
  const collegue = h('a', { class: 'circuler__collegue', href: `mailto:?subject=${encodeURIComponent(Ci.collegue_objet)}&body=${encodeURIComponent(gabarit(Ci.collegue_corps, { lien: lienCollegue }))}`, onclick: () => mesurer('test_partage', { canal: 'collegue' }) },
    h('b', { text: Ci.collegue }), h('span', { text: I.circuler_collegue_aide || '' }), icone('<path d="M5 12h14M13 6l6 6-6 6"/>'));
  const sous = h('div', { class: 'circuler__sous', hidden: true },
    h('a', { class: 'circuler__b', href: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(CANON + '?src=li'), target: '_blank', rel: 'noopener', onclick: () => mesurer('test_partage', { canal: 'linkedin' }) }, icone('<path d="M7 17V9M7 6v.5M11 17v-5a2.5 2.5 0 0 1 5 0v5M11 9v2"/>'), P.linkedin),
    h('button', { type: 'button', class: 'circuler__b', onclick: async () => { mesurer('test_partage', { canal: 'copie' }); etatCopie.textContent = (await copier(CANON)) ? P.copie_ok : P.copie_echec; } }, icone('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'), Ci.copier));
  const partager = h('button', { type: 'button', class: 'circuler__b', 'aria-expanded': 'false', onclick: async e => {
    if (navigator.share) {
      try { await navigator.share({ title: D.titre, text: P.texte_natif, url: CANON }); mesurer('test_partage', { canal: 'natif' }); return; } catch (err) { if (err && err.name === 'AbortError') return; }
    }
    sous.hidden = !sous.hidden; e.currentTarget.setAttribute('aria-expanded', String(!sous.hidden));
  } }, icone('<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 15V3M8 7l4-4 4 4"/>'), Ci.partager);
  const imprimer = h('button', { type: 'button', class: 'circuler__b', onclick: () => { mesurer('test_partage', { canal: 'impression' }); window.print(); } }, icone('<path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2"/><path d="M7 14h10v7H7z"/>'), Ci.imprimer);
  return h('section', { class: 'circuler', 'aria-labelledby': 'circuler-titre' }, h('h3', { class: 'circuler__titre', id: 'circuler-titre', text: Ci.titre }),
    collegue, h('div', { class: 'circuler__autres' }, partager, imprimer), sous, etatCopie);
}
/* revoir mes réponses et les sources */
function blocRevoir() {
  const liste = h('div', { class: 'revoir__liste' });
  etat.slots.forEach((slot, k) => {
    const q = questionDuSlot(slot); if (!q) return;
    const r = etat.reponses[q.id] || {}, rev = revelationDe(q, r.reponse) || {};
    const libChoix = id => { const c = (q.choix || []).find(x => x.id === id); return c ? c.libelle : String(id ?? ''); };
    const unite = q.echelle && q.echelle.unite ? ' ' + q.echelle.unite : '';
    const bloc = h('div', { class: 'revoir__q' }, h('p', { class: 'revoir__enonce', text: `${k + 1}. ${q.enonce}` }));
    if (q.type === 'estimation') {
      bloc.append(h('p', { class: 'revoir__ligne' }, I.votre_reponse + ' : ', h('b', { text: (r.reponse ?? '') + unite }), ' · ', I.bonne_reponse + ' : ', h('b', { text: q.reponse + unite })));
    } else if (q.type === 'frise') {
      const carteDe = id => q.cartes.find(c => c.id === id), dateDe = id => q.dates.find(d => d.id === id);
      bloc.append(h('p', { class: 'revoir__ligne' }, I.bonne_reponse + ' : ' + q.cartes.map(c => `${c.libelle} : ${dateDe(q.reponse[c.id]).libelle}`).join(' ; ')));
      if (r.reponse) bloc.append(h('p', { class: 'revoir__ligne' }, I.votre_reponse + ' : ' + Object.keys(r.reponse).map(c => `${carteDe(c).libelle} : ${dateDe(r.reponse[c]).libelle}`).join(' ; ')));
    } else if (q.type === 'situation') {
      bloc.append(h('p', { class: 'revoir__ligne' }, I.votre_reponse + ' : ', h('b', { text: libChoix(r.reponse) })));
    } else {
      bloc.append(h('p', { class: 'revoir__ligne' }, I.votre_reponse + ' : ', h('b', { text: libChoix(r.reponse) }), ' · ', I.bonne_reponse + ' : ', h('b', { text: libChoix(q.reponse) })));
    }
    if (r.verdict) bloc.lastChild.append(h('span', { class: 'verdict' + (r.verdict === 'exact' ? ' verdict--exact' : ''), text: D.verdicts[r.verdict] }));
    if (rev.phrase) bloc.append(h('p', { class: 'revoir__ligne', text: rev.phrase }));
    const s = sourcesDe(q); if (s) bloc.append(s);
    liste.append(bloc);
  });
  return h('details', { class: 'revoir' }, h('summary', { text: D.resultat.revoir }), h('p', { class: 'revoir__aide' }, I.resultat.revoir_aide, h('span', { class: 'revoir__regle', text: D.resultat.regle_score })), liste);
}
/* la fiche imprimée, une page A4 (lot 4) */
function blocImpression(profil, score, gestes) {
  const R = D.resultat, C = R.contact, q4 = parId.q4, Im = I.impression || {}, il = profil.illustration || {};
  const dates = q4 && q4.type === 'frise' ? q4.dates.map(d => { const carte = q4.cartes.find(c => q4.reponse[c.id] === d.id); return h('li', {}, h('b', { text: d.libelle }), h('span', { text: carte ? carte.libelle : '' })); }) : [];
  return h('div', { class: 'impression', 'aria-hidden': 'true' },
    h('h1', { text: D.titre }),
    h('p', { class: 'imp__sous', text: `${D.sous_titre} · ${gabarit(I.point_du_droit, { date: dateLongue(D.point_du_droit) })} · ${Im.site}` }),
    h('p', { class: 'imp__profil', text: profil.nom }),
    h('p', { class: 'imp__score', text: texteScore(score) }),
    il.src_carre ? h('figure', { class: 'imp__illu' }, h('img', { src: il.src_carre, alt: '' })) : null,
    dates.length ? h('h2', { text: Im.titre_dates }) : null,
    dates.length ? h('ol', { class: 'imp__dates' }, dates) : null,
    h('h2', { text: R.titre_gestes }),
    h('ol', { class: 'imp__gestes' }, gestes.map((g, k) => h('li', {}, h('span', { class: 'imp__n', text: String(k + 1) }), h('span', { class: 'imp__t', text: g.titre }), h('span', { class: 'imp__p' }, g.phrase + ' ', h('span', { text: 'civik-ia.fr' + g.lien }))))),
    h('p', { class: 'imp__contact' }, h('b', { text: C.signature }), ' · ', C.courriel, ' · ', Im.site),
    h('p', { class: 'imp__pied', text: gabarit(R.pied, { date: dateLongue(D.point_du_droit) }) })
  );
}

/* ---------- le départ ---------- */
async function demarrer() {
  racine = $('[data-socle]'); if (!racine) return;
  let rep;
  try { rep = await fetch('questions.json?v=' + VERSION); D = await rep.json(); } catch (e) { return; }   /* sans données, le socle sans JavaScript reste */
  I = D.interface || {};
  (D.questions || []).forEach(q => { parId[q.id] = q; });
  document.documentElement.classList.remove('sans-js'); document.documentElement.classList.add('js');
  lireParametres();
  etat.slots = construireParcours();
  const repris = reprendre();
  poserTete();
  if (!repris) { ecranQuestion(); return; }
  etat._debutMesure = true;
  if (etat.phase === 'resultat') ecranResultat();
  else if (etat.phase === 'profil') ecranProfil();
  else if (etat.phase === 'revelation' && etat.reponses[questionCourante().id]) ecranRevelation(questionCourante());
  else ecranQuestion();
}
demarrer();
export { construireParcours, verdictDe, LISTES_TEST, CHEMIN_COMPTEUR };
