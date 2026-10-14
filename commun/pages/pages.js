/* =====================================================================
   Pages Conseil et Atelier, section « base de connaissances » : le
   socle commun (maquette du 06/10/2026). Navigation, entrées au
   défilement, mot à mot, formulaire court, fiche qui s’écrit, copie,
   étiquette de maquette.
   Aucune donnée ne quitte le navigateur, sauf depuis un formulaire qui
   porte l’attribut data-envoi (CO-13, première passe Conseil du
   06/10/2026 ; contrat ci-dessous, R7 des finitions du 07/10/2026).

   ---------------------------------------------------------------------
   CONTRAT DES FORMULAIRES COMMUNS (R7, finitions du 07/10/2026)
   ---------------------------------------------------------------------
   Tout se règle par des attributs de l’élément <form> ; le script de la
   page n’écrit aucun texte d’envoi.

   data-envoi="https://formspree.io/f/…"
       L’adresse du service. Sans elle (ou si elle ne commence pas par
       https://), le formulaire reste en maquette : rien n’est transmis.
       Seul l’attribut du <form> compte (un autre élément qui porte
       data-envoi, comme un bloc .envoi, n’est pas lu).
   data-voix="je" | "nous"     (défaut : "je")
       Les textes d’envoi :
       « je »   réussite : « Merci, votre message est parti. »
                          « Je vous réponds au plus vite. »
                échec    : « L’envoi n’a pas abouti. »
                          « Écrivez-moi directement à contact@civik-ia.fr »
       « nous » réussite : « Merci, votre message est parti. »
                          « Nous revenons vers vous pour fixer un premier échange. »
                échec    : « L’envoi n’a pas abouti. »
                          « Écrivez-nous directement à contact@civik-ia.fr »
       (l’adresse est celle du lien .contact__mail de la page, sinon
       contact@civik-ia.fr ; c’est un lien mailto qui reprend l’objet et
       le message saisi : le visiteur ne perd rien).
   data-sujet="…"
       L’objet du message (champ _subject). Formulaire court : tel quel
       (à défaut, le champ caché _subject, puis « Contact <activité> ») ;
       fiche : suivi de « , n° <numéro> » quand la page donne le numéro.
   data-reussite-titre="…", data-reussite="…"     (facultatifs)
       Remplacent les deux lignes de réussite de la voix (Conseil : « Je
       vous réponds pour fixer nos trente minutes. »).

   Formulaire court : formulaireCourt(form, activite).
       Champs envoyés : tous ceux du formulaire qui ont un nom (nom,
       structure, email, message ; courriel et besoin sont aussi lus),
       plus _subject et _replyto (le courriel) ; anti-robot : _gotcha
       (site, en maquette).
   Fiche (Conseil : fiche de demande ; Atelier : fiche de projet) :
       const ok = await envoyerFiche(form, { texte, num, bouton, bloc });
       texte  : le texte complet de la fiche (envoyé dans le champ message,
                titres de sections en casse normale, 13/10/2026) ;
       num    : le numéro provisoire (ajouté à l’objet) ;
       bouton : le bouton d’envoi (« Envoi… » puis remis) ;
       bloc   : l’élément .envoi où s’écrivent la réussite ou l’échec.
       Champs envoyés : name et nom (le nom), structure, email (lu dans
       courriel ou email), tel (s’il existe), message (la fiche), _subject,
       _replyto ; _gotcha seulement s’il est rempli (13/10/2026, filtre
       anti-spam de Formspree : les champs standards name, email, message,
       comme le formulaire court).
       Rend true (parti), false (échec, le bloc dit quoi faire) ou null
       (pas de data-envoi, ou un envoi déjà en cours : rien n’est fait).
       Pendant l’envoi, le formulaire porte data-en-cours et aria-busy.
   Exemple (Atelier, fiche de projet) :
       <form data-projet data-envoi="https://formspree.io/f/mnjogblz"
             data-voix="nous" data-sujet="Fiche de projet, atelier"
             data-reussite-titre="Merci, votre projet est parti."
             data-reussite="Gardez votre croquis, nous vous le demanderons si besoin.">
   ===================================================================== */
/* La lettre qui part (14/10/2026) : pendant l’envoi d’une fiche ou d’un formulaire court, une petite scène à la plume
   (commun/pages/lettre.js, chargé au premier envoi seulement). Interrupteur unique : pour la retirer, mettre LETTRE à ''
   (cette ligne seule) ; envoyerAvecLettre redevient alors envoyerFormulaire et poserVignette ne fait plus rien, rien d’autre
   à changer (lettre.js et lettre.css peuvent rester sur le serveur, plus rien ne les charge). */
export const LETTRE = './lettre.js';
export const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const petit = () => innerWidth < 768;
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export const dort = ms => new Promise(r => setTimeout(r, ms));
export function chargerImage(src) {
  return new Promise(r => { const i = new Image(); i.decoding = 'async'; i.onload = () => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()).then(() => r(i)); i.onerror = () => r(null); i.src = src; });
}
export const AUJOURDHUI = (() => { const d = new Date(); return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); })();

/* ---------- la navigation : page courante, menu du petit écran ---------- */
function navigation() {
  const page = document.body.dataset.page;
  $$('[data-lien]').forEach(a => { if (a.dataset.lien === page) a.setAttribute('aria-current', 'page'); });
  const bouton = $('.nav__menu'), tiroir = $('.nav__tiroir');
  if (!bouton || !tiroir) return;
  const basculer = ouvrir => {
    tiroir.classList.toggle('ouvert', ouvrir); bouton.setAttribute('aria-expanded', String(ouvrir));
    bouton.setAttribute('aria-label', ouvrir ? 'Fermer le menu' : 'Ouvrir le menu');
  };
  bouton.addEventListener('click', () => basculer(bouton.getAttribute('aria-expanded') !== 'true'));
  tiroir.addEventListener('click', e => { if (e.target.closest('a')) basculer(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && tiroir.classList.contains('ouvert')) { basculer(false); bouton.focus(); } });
}

/* ---------- le mot à mot : le texte réel reste lu par les lecteurs d'écran ---------- */
export function decouperMots(el) {
  if (el.dataset.decoupe) return; el.dataset.decoupe = '1';
  const texte = el.textContent.replace(/[ \t\n\r]+/g, ' ').trim();
  const reel = document.createElement('span'); reel.className = 'sr'; reel.textContent = texte;
  let i = 0;
  const parcourir = n => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/([ \t\n\r]+)/).forEach(m => {
        if (!m) return;
        if (/^[ \t\n\r]+$/.test(m)) { frag.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
        const k = document.createElement('i'); k.style.setProperty('--i', i++); k.textContent = m; w.appendChild(k); frag.appendChild(w);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && !n.classList.contains('sr')) Array.from(n.childNodes).forEach(parcourir);
  };
  Array.from(el.childNodes).forEach(parcourir);
  el.prepend(reel);
  el.classList.add('mots');
}

/* ---------- les entrées au défilement ---------- */
let obs = null;
export function observer(el) {
  if (reduit() || !('IntersectionObserver' in window)) { el.classList.add('vu'); return; }
  if (!obs) obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vu'); obs.unobserve(e.target); e.target.dispatchEvent(new CustomEvent('vu')); } }), { rootMargin: '0px 0px -12% 0px', threshold: .08 });
  obs.observe(el);
}
function entrees() {
  $$('[data-mots]').forEach(el => { decouperMots(el); observer(el); });
  $$('[data-entree]').forEach(observer);
}

/* ---------- la copie dans le presse-papiers (avec repli) ---------- */
export async function copier(texte) {
  try { await navigator.clipboard.writeText(texte); return true; } catch (e) {}
  try {
    const t = document.createElement('textarea'); t.value = texte; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(t); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok;
  } catch (e) { return false; }
}

/* 13/10/2026 (filtre anti-spam de Formspree) : les titres de sections tels qu’ils partent dans le courriel, en casse normale
   (« 1. Le projet ») ; le texte copié, le courriel de secours et la fiche affichée gardent les leurs (« 1 LE PROJET ») */
const TITRES_ENVOI = new Map();
/* ---------- la fiche qui s'écrit : une ligne à la fois, frappe de 30 à 47 ms par caractère ---------- */
export class Fiche {
  constructor(racine) {
    this.racine = racine; this.file = []; this.enCours = false; this.valeurs = {};
    this.lecteur = racine.querySelector('[data-fiche-lu]');
  }
  /* cle : l'attribut data-l du dd ; texte vide : la ligne revient à son tiret */
  ecrire(cle, texte, immediat) {
    const dd = this.racine.querySelector(`[data-l="${cle}"]`); if (!dd) return;
    texte = (texte || '').trim();
    if (this.valeurs[cle] === texte) return;
    this.valeurs[cle] = texte;
    this.file = this.file.filter(x => x.dd !== dd);
    this.file.push({ dd, texte, immediat: immediat || reduit() });
    this.majLecteur();
    if (!this.enCours) this.derouler();
  }
  async derouler() {
    this.enCours = true;
    while (this.file.length) {
      const { dd, texte, immediat } = this.file.shift();
      this.racine.dispatchEvent(new CustomEvent('ligne', { detail: dd }));
      if (!texte) { dd.textContent = dd.dataset.vide || 'à préciser'; dd.classList.add('vide'); continue; }
      dd.classList.remove('vide');
      if (immediat || this.file.length > 3) { dd.textContent = texte; continue; }
      const s = document.createElement('span'); s.className = 'frappe'; const c = document.createElement('i'); c.className = 'curseur';
      dd.textContent = ''; dd.append(s, c);
      const pas = texte.length > 70 ? 14 : texte.length > 36 ? 24 : 34;
      for (let i = 1; i <= texte.length; i++) {
        if (this.valeurs[dd.dataset.l] !== texte) break;
        s.textContent = texte.slice(0, i);
        await dort(pas + (/[ ,.]/.test(texte[i - 1]) ? 22 : 0));
      }
      c.remove();
      if (this.valeurs[dd.dataset.l] === texte) dd.textContent = texte;
    }
    this.enCours = false;
  }
  /* pour les lecteurs d'écran : la fiche complète, sans la frappe */
  majLecteur() {
    if (!this.lecteur) return;
    clearTimeout(this._t); this._t = setTimeout(() => { this.lecteur.textContent = 'Fiche mise à jour.'; }, 700);
  }
  texte(entete) {
    const lignes = [entete];
    this.racine.querySelectorAll('.fiche__sec').forEach(sec => {
      const h = sec.querySelector('.fiche__h'); if (h) { const t = h.textContent.replace(/\s+/g, ' ').trim(); lignes.push('', t.toUpperCase()); TITRES_ENVOI.set(t.toUpperCase(), t.replace(/^(\d+) /, '$1. ')); }
      sec.querySelectorAll('dt').forEach(dt => { const dd = dt.nextElementSibling; const v = this.valeurs[dd.dataset.l]; lignes.push(`${dt.textContent} : ${v || 'à préciser'}`); });
    });
    const r = this.racine.querySelector('.fiche__resume'); if (r && r.textContent.trim()) lignes.push('', r.textContent.trim());
    return lignes.join('\n');
  }
}

/* ---------- CO-13 : l’envoi réel, sans quitter la page (Formspree, réponse en JSON) ----------
   Activé seulement par l’attribut data-envoi du formulaire (une adresse https). Renvoie true si le service a accepté. */
export const envoiReel = form => /^https:\/\//.test((form && form.dataset.envoi) || '');
export async function envoyerFormulaire(url, donnees, delai = 15000) {
  const ctl = 'AbortController' in window ? new AbortController() : null;
  const minuteur = ctl ? setTimeout(() => ctl.abort(), delai) : 0;
  try {
    const r = await fetch(url, { method: 'POST', body: donnees, headers: { Accept: 'application/json' }, signal: ctl ? ctl.signal : undefined });
    return r.ok;
  } catch (e) { return false; } finally { clearTimeout(minuteur); }
}
/* La lettre qui part (14/10/2026, seconde version) : la requête part d’abord, sans attendre le module ; la carte du
   formulaire se transforme pendant l’attente (point d’attente à 1,8 s, puis 1,24 s pour poster la lettre) et la scène rend
   la main après ; même valeur rendue qu’envoyerFormulaire. Filets : sans LETTRE, comportement d’avant ; module introuvable
   ou scène en erreur : rien n’est montré ; délai de garde : 4 s après la réponse tant que la scène n’a pas démarré, porté à
   3,5 s après son démarrage s’il est plus tard (le module appelle o.demarre quand la couche est posée : un module arrivé
   tard joue sa scène entière) ; à l’expiration, la scène est coupée (le formulaire est rendu tel quel), l’état s’affiche
   quand même, et un module arrivé après ne joue plus rien (o.annule) ; mouvement réduit : pas de scène, le module est
   attendu 500 ms au plus pour la vignette fixe. data-en-cours et aria-busy pendant la scène. */
let lettre = null;
export async function envoyerAvecLettre(form, url, donnees, o = {}) {
  const envoi = envoyerFormulaire(url, donnees);
  if (!LETTRE) return envoi;
  const charger = () => import(LETTRE).then(m => (lettre = m));
  if (reduit()) { const pret = Promise.race([charger().catch(() => {}), dort(500)]); const ok = await envoi; await pret; return ok; }
  let fini = false, depart = 0;   /* fini : le délai de garde a sonné, un module qui arrive après ne joue plus rien */
  const jeu = charger().then(m => (fini ? null : m.jouer(form, envoi, Object.assign({}, o, { annule: () => fini, demarre: () => { depart = Date.now(); } })))).then(() => true, () => true);
  const ok = await envoi;
  const reponse = Date.now(); let garde = 0;
  const veiller = r => { const reste = Math.max(reponse + 4000, depart ? depart + 3500 : 0) - Date.now(); if (reste <= 0) r(false); else garde = setTimeout(() => veiller(r), reste); };
  const rendu = await Promise.race([jeu, new Promise(veiller)]);
  clearTimeout(garde); fini = true;
  if (!rendu) try { if (lettre) lettre.couper(); } catch (e) { /* rien */ }
  return ok;
}
/* la vignette finale (la boîte aux lettres, l’enveloppe dans la fente), à gauche du remerciement, après etatEnvoi */
export function poserVignette(bloc) { if (!LETTRE || !lettre) return; try { lettre.vignette(bloc); } catch (e) { /* rien */ } }
/* Déploiement (08/10/2026) : l’événement generate_lead pour Google Tag Manager, poussé au succès d’un envoi réel (le service
   a accepté). Rien de personnel : la page (lead_source : conseil, atelier) et le formulaire (form_name : fiche, contact),
   jamais le nom, le courriel ni le message. Installation du 13/10/2026 (avis DAJF du 13/10/2026, condition 2, même contrat
   que les événements du film) : rien n’est poussé tant que GTM n’est pas chargé (window.__civikGtmLoaded, posé par
   cookie-consent.js après « Accepter ») ; pas de file d’attente, rien n’est rejoué à l’accord. Le déclencheur (événement
   personnalisé generate_lead) se crée dans GTM. */
export function signalerDemande(form, type) {
  try { if (!window.__civikGtmLoaded) return; (window.dataLayer = window.dataLayer || []).push({ event: 'generate_lead', lead_source: document.body.dataset.page || '', form_name: type }); } catch (e) { /* rien */ }
}

/* R7 : les textes d’envoi, selon la voix du formulaire (data-voix) ; « je » par défaut (Conseil) */
export const TEXTES_ENVOI = {
  je: { titre: 'Merci, votre message est parti.', texte: 'Je vous réponds au plus vite.', ecrire: 'Écrivez-moi directement à' },
  nous: { titre: 'Merci, votre message est parti.', texte: 'Nous revenons vers vous pour fixer un premier échange.', ecrire: 'Écrivez-nous directement à' }
};
export const voixDe = form => (form && form.dataset.voix === 'nous') ? 'nous' : 'je';
/* R7 : l’objet du message (data-sujet, puis le champ caché _subject, puis le défaut) */
export const sujetDe = (form, defaut) => (form && form.dataset.sujet) || (form && form.elements._subject && form.elements._subject.value) || defaut;
/* le courriel de secours : l’adresse de contact affichée par la page (le lien .contact__mail, qui porte
   thibaut.harang@civik-ia.fr sur la page Conseil depuis le 07/10/2026 au soir), sinon contact@civik-ia.fr ;
   le message saisi part dans le corps */
export const courrielPage = () => { const a = document.querySelector('a.contact__mail[href^="mailto:"]'); const m = a && a.getAttribute('href').replace(/^mailto:/, '').split('?')[0].trim(); return m || 'contact@civik-ia.fr'; };
export const lienCourriel = (sujet, corps) => `mailto:${courrielPage()}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
const echapper = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/* les trois états d’un envoi réel, dans le bloc d’état (focus posé sur le message) ; o.voix choisit les textes par défaut (R7) */
export function etatEnvoi(bloc, etat, o = {}) {
  if (!bloc) return;
  const t = TEXTES_ENVOI[o.voix === 'nous' ? 'nous' : 'je'];
  bloc.classList.toggle('envoi--echec', etat === 'echec');
  if (etat === 'reussite') bloc.innerHTML = `<p class="envoi__t">${echapper(o.titre || t.titre)}</p><p>${echapper(o.texte || t.texte)}</p>`;
  else bloc.innerHTML = `<p class="envoi__t">L’envoi n’a pas abouti.</p><p>${echapper(o.texte || t.ecrire)} <a class="lien" href="${echapper(lienCourriel(o.sujet || 'Contact', o.corps || ''))}">${echapper(courrielPage())}</a></p>${o.plus || ''}`;
  bloc.hidden = false;
  if (!bloc.hasAttribute('tabindex')) bloc.setAttribute('tabindex', '-1');
  bloc.focus({ preventScroll: false });
}
/* le bouton pendant l’envoi : désactivé, « Envoi… » ; rend une fonction qui le remet comme avant */
export function boutonEnCours(bouton) {
  const avant = bouton.innerHTML;
  bouton.disabled = true; bouton.textContent = 'Envoi…';
  return (garderDesactive) => { bouton.innerHTML = avant; bouton.disabled = !!garderDesactive; };
}
/* R7 : l’envoi d’une fiche (Conseil : fiche de demande ; Atelier : fiche de projet), par le même mécanisme que le
   formulaire court : data-envoi, data-voix, data-sujet (et data-reussite-titre, data-reussite) ; la fiche entière dans
   le champ « message » (13/10/2026 : avant, « fiche » ; les champs standards passent mieux le filtre anti-spam du
   service). Rend true, false, ou null quand il n’y a rien à faire (maquette, ou envoi déjà en cours). */
export async function envoyerFiche(form, o = {}) {
  if (!envoiReel(form) || form.dataset.enCours) return null;
  const v = n => (form.elements[n] && typeof form.elements[n].value === 'string' ? form.elements[n].value.trim() : '');
  const courriel = v('courriel') || v('email');
  const sujet = (form.dataset.sujet || o.sujet || 'Fiche') + (o.num ? `, n° ${o.num}` : '');
  form.dataset.enCours = '1'; form.setAttribute('aria-busy', 'true');
  const remettre = o.bouton ? boutonEnCours(o.bouton) : () => {};
  const donnees = new FormData();
  /* 13/10/2026 : les champs standards de Formspree (name, email, message), comme le formulaire court ; nom et structure
     restent pour la lecture du courriel ; le pot de miel (_gotcha) ne part que rempli (un robot), Formspree le rejette alors */
  donnees.set('name', v('nom')); donnees.set('nom', v('nom')); donnees.set('structure', v('structure')); donnees.set('email', courriel);
  if (form.elements.tel) donnees.set('tel', v('tel'));
  donnees.set('message', (o.texte || '').split('\n').map(l => TITRES_ENVOI.get(l) || l).join('\n'));
  donnees.set('_subject', sujet); donnees.set('_replyto', courriel);
  if (v('_gotcha')) donnees.set('_gotcha', v('_gotcha'));
  const ok = await envoyerAvecLettre(form, form.dataset.envoi, donnees, o);
  delete form.dataset.enCours; form.removeAttribute('aria-busy');
  const voix = voixDe(form);
  if (ok) { remettre(true); signalerDemande(form, 'fiche'); etatEnvoi(o.bloc, 'reussite', { voix, titre: form.dataset.reussiteTitre, texte: form.dataset.reussite }); }
  else { remettre(false); etatEnvoi(o.bloc, 'echec', { voix, sujet, corps: o.texte || '' }); }
  if (ok) poserVignette(o.bloc);
  return ok;
}

/* ---------- le formulaire court (nom, structure, courriel, besoin) ---------- */
export const COURRIEL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function verifierChamp(c) {
  const err = c.closest('.champ')?.querySelector('.erreur');
  let m = '';
  if (c.required && !c.value.trim()) m = c.dataset.manque || 'Ce champ est à remplir.';
  else if (c.type === 'email' && c.value.trim() && !COURRIEL.test(c.value.trim())) m = 'Cette adresse ne semble pas complète, par exemple prenom.nom@structure.fr.';
  c.setAttribute('aria-invalid', m ? 'true' : 'false');
  if (err) err.textContent = m;
  return !m;
}
export function formulaireCourt(form, activite) {
  if (!form) return;
  /* CO-13 : le champ anti-robot s'appelle « _gotcha » (Formspree) là où l'envoi est réel, « site » ailleurs */
  const champs = $$('input,textarea', form).filter(c => c.type !== 'hidden' && c.name !== 'site' && c.name !== '_gotcha');
  champs.forEach(c => c.addEventListener('blur', () => { if (c.value) verifierChamp(c); }));
  champs.forEach(c => c.addEventListener('input', () => { if (c.getAttribute('aria-invalid') === 'true') verifierChamp(c); }));
  const envoi = form.querySelector('.envoi');
  const reel = envoiReel(form);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const ko = champs.filter(c => !verifierChamp(c));
    if (ko.length) { ko[0].focus(); return; }
    const v = n => (form.elements[n] ? form.elements[n].value.trim() : '');
    /* CO-13 : sur la page Conseil, les champs portent les noms attendus par Formspree (email, message) */
    const courriel = v('courriel') || v('email'), besoin = v('besoin') || v('message');
    const texte = [`Demande ${activite}, depuis la page ${activite} de civik-ia.fr`, '', `Nom : ${v('nom')}`, `Structure : ${v('structure')}`, `Courriel : ${courriel}`, `Besoin : ${besoin}`].join('\n');
    if (reel) {
      /* CO-13 : l’envoi réel, sans quitter la page ; trois états (en cours, réussite, échec avec le courriel de secours) ;
         R7 : la voix (data-voix) et l’objet (data-sujet) viennent des attributs du formulaire */
      if (form.dataset.enCours) return;
      form.dataset.enCours = '1'; form.setAttribute('aria-busy', 'true');
      const bouton = form.querySelector('[type="submit"]'), remettre = boutonEnCours(bouton);
      const sujet = sujetDe(form, `Contact ${activite}`), voix = voixDe(form);
      const donnees = new FormData(form); donnees.set('_replyto', courriel); donnees.set('_subject', sujet);
      const ok = await envoyerAvecLettre(form, form.dataset.envoi, donnees, { bloc: envoi, bouton });
      delete form.dataset.enCours; form.removeAttribute('aria-busy');
      if (ok) { remettre(true); signalerDemande(form, 'contact'); form.classList.add('envoye'); etatEnvoi(envoi, 'reussite', { voix, titre: form.dataset.reussiteTitre, texte: form.dataset.reussite }); }
      else { remettre(false); etatEnvoi(envoi, 'echec', { voix, sujet, corps: texte }); }
      if (ok) poserVignette(envoi);
      return;
    }
    /* Maquette (sans data-envoi) : rien n’est transmis, les données restent dans le navigateur. */
    envoi.hidden = false;
    const copie = envoi.querySelector('[data-copier]'), ok = envoi.querySelector('.copie-ok');
    /* R2 : l’espace insécable avant les deux-points */
    copie.onclick = async () => { ok.textContent = (await copier(texte)) ? 'Copié. Collez-le dans votre message.' : 'La copie a échoué\u00a0: sélectionnez le texte à la main.'; };
    envoi.querySelector('[data-titre]').focus();
  });
}

/* ---------- R8 (finitions du 07/10/2026) : l’étiquette « Maquette de travail » ----------
   Elle s’efface quatre secondes après le chargement, revient au survol de son coin (souris : à 24 px d’elle) ou quand on
   remonte en haut de la page, et repart quatre secondes après (après la sortie du coin pour le survol). Seule son
   opacité change ; elle ne capte jamais le pointeur (le coin est suivi par les mouvements de la souris sur la page). */
function etiquette() {
  const el = $('.etiquette'); if (!el) return;
  let minuteur = 0, dans = false, boite = null, enHaut = scrollY < 8;
  const cacher = () => el.classList.add('etiquette--cachee');
  const montrer = (garder) => { el.classList.remove('etiquette--cachee'); clearTimeout(minuteur); if (!garder) minuteur = setTimeout(cacher, 4000); };
  const mesurer = () => { boite = el.getBoundingClientRect(); };
  if (document.readyState === 'complete') montrer(); else addEventListener('load', () => montrer(), { once: true });
  addEventListener('resize', () => { boite = null; }, { passive: true });
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    if (!boite) mesurer();
    const pres = e.clientX >= boite.left - 24 && e.clientX <= boite.right + 24 && e.clientY >= boite.top - 24 && e.clientY <= boite.bottom + 24;
    if (pres && !dans) { dans = true; montrer(true); } else if (!pres && dans) { dans = false; montrer(); }
  }, { passive: true });
  addEventListener('scroll', () => { const h = scrollY < 8; if (h && !enHaut && !dans) montrer(); enHaut = h; }, { passive: true });
}

/* ---------- démarrage ---------- */
export function demarrer() {
  document.documentElement.classList.add('js');
  navigation();
  entrees();
  etiquette();   /* R8 */
  const fini = () => { document.documentElement.dataset.pret = '1'; };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(fini);
  setTimeout(fini, 1500);
}
