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
                échec    : « Le message n’est pas parti. » (P3, les deux voix)
                          « Vérifiez votre connexion et réessayez, ou envoyez-le par
                          courriel : il est déjà écrit. » et « Envoyer par courriel à … »
       « nous » réussite : « Merci, votre message est parti. »
                          « Nous revenons vers vous pour fixer un premier échange. »
                échec    : le même que « je » (P3)
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
   P4 (19/10/2026, revue Claude Design, partie 9, « Après Envoyer, la
   séquence juste ») : la requête part d’abord, formulaire inerte, bouton
   « Envoi… » désactivé, trait or ; la lettre ne se plie qu’après une
   réponse bonne du service (10 s au plus) ; en échec, trois sorties :
   « Réessayer », « Envoyer par courriel » (adresse écrite en clair à côté,
   pour le navigateur de LinkedIn où le lien mailto échoue souvent) et
   « Copier mon message ». Le brouillon du formulaire court est gardé dans
   sessionStorage pendant la saisie (rien ne part ailleurs), rendu au
   retour, effacé après la réussite. Téléphone facultatif vérifié en
   format souple. Mesures en valeurs fermées (./mesures.js).
   data-suite-href="…", data-suite-texte="…"   (facultatifs, P4)
       Une action suivante en lien sous le remerciement (partie 9, friction 16).
   Formulaire court avec un choix de sujet (l’accueil) : un groupe de
       pastilles [name="sujet"] dans un [data-requis="sujet"] ; l’objet du
       message devient « <data-sujet>, sujet : <libellé choisi> ».
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
/* P4 (19/10/2026) : les mesures en valeurs fermées (partie 9) ; le module pose ses écouteurs délégués à son chargement */
import { mesurer, nomFormulaire, erreurChamp } from './mesures.js';
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
  tiroir.addEventListener('click', e => { if (e.target.closest('a,[data-cookies-gerer]')) basculer(false); });   /* P3 : « Gérer les cookies » ferme aussi le tiroir */
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
   Activé seulement par l’attribut data-envoi du formulaire (une adresse https). Renvoie true si le service a accepté.
   P4 (19/10/2026, partie 9) : réponse mauvaise ou absente après 10 s, c’est un échec ; la cause est gardée (réseau, serveur,
   délai) pour la mesure formulaire_echec, jamais rien d’autre. */
export const envoiReel = form => /^https:\/\//.test((form && form.dataset.envoi) || '');
export const DELAI_ENVOI = 10000;
let cause = '';
export const causeEchec = () => cause || 'reseau';
export async function envoyerFormulaire(url, donnees, delai = DELAI_ENVOI) {
  const ctl = 'AbortController' in window ? new AbortController() : null;
  let expire = false;
  const minuteur = ctl ? setTimeout(() => { expire = true; ctl.abort(); }, delai) : 0;
  try {
    const r = await fetch(url, { method: 'POST', body: donnees, headers: { Accept: 'application/json' }, signal: ctl ? ctl.signal : undefined });
    cause = r.ok ? '' : 'serveur';
    return r.ok;
  } catch (e) { cause = expire ? 'delai' : 'reseau'; return false; } finally { clearTimeout(minuteur); }
}
/* « Votre lettre part… » : pour les lecteurs d’écran seulement (partie 5), dans une zone lue à côté du formulaire (la carte
   du formulaire est cachée pendant la scène) */
function annoncer(form, texte) {
  if (!form || !form.parentNode) return;
  let z = form.parentNode.querySelector(':scope > [data-annonce-envoi]');
  if (!z) { z = document.createElement('p'); z.className = 'sr'; z.setAttribute('aria-live', 'polite'); z.setAttribute('data-annonce-envoi', ''); form.after(z); }
  z.textContent = texte;
}
/* La lettre qui part (14/10/2026), troisième version (P4, 19/10/2026, partie 9, séquence en six temps) : la requête part
   d’abord, le formulaire est inerte (inert), le bouton dit « Envoi… » et son trait or se trace (boutonEnCours) ; le module
   de la lettre se charge pendant l’attente, sans rien montrer. Réponse bonne : alors seulement la feuille se plie, l’enveloppe
   se ferme et la lettre part (lettre.js, environ 3 s : la promesse lui est donnée déjà tenue) ; réponse mauvaise ou absente :
   aucune scène, le formulaire reste ouvert avec ses valeurs et l’échec s’affiche (etatEnvoi). Même valeur rendue
   qu’envoyerFormulaire. Filets : sans LETTRE, ou mouvement réduit, aucune scène ; module introuvable ou scène qui ne démarre
   pas dans les 1,5 s : rien n’est montré ; scène démarrée qui ne rend pas la main 4,5 s après : coupée (le formulaire est
   rendu tel quel), et l’état s’affiche quand même. data-en-cours et aria-busy pendant l’envoi (posés par l’appelant). */
let lettre = null;
export async function envoyerAvecLettre(form, url, donnees, o = {}) {
  const inerte = !!form && 'inert' in form;
  if (inerte) form.inert = true;
  const module = LETTRE ? import(LETTRE).then(m => (lettre = m), () => null) : null;
  const ok = await envoyerFormulaire(url, donnees);
  if (inerte) form.inert = false;
  if (!ok || !module) return ok;
  /* mouvement réduit : pas de scène ; le module est attendu 500 ms au plus pour la vignette fixe */
  if (reduit()) { await Promise.race([module, dort(500)]); return ok; }
  const m = await Promise.race([module, dort(1500).then(() => null)]);
  if (!m || !form || !form.isConnected) return ok;
  annoncer(form, 'Votre lettre part…');
  let fini = false, depart = 0;   /* fini : le délai de garde a sonné, un module qui arrive après ne joue plus rien */
  const t0 = Date.now();
  const jeu = Promise.resolve().then(() => m.jouer(form, true, Object.assign({}, o, { annule: () => fini, demarre: () => { depart = Date.now(); } }))).then(() => true, () => true);
  let garde = 0;
  const veiller = r => { const reste = (depart ? depart + 4500 : t0 + 1500) - Date.now(); if (reste <= 0) r(false); else garde = setTimeout(() => veiller(r), Math.min(reste, 250)); };
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
   js/cookies.js depuis la passe P3, cookie-consent.js avant, après « Accepter ») ; pas de file d’attente, rien n’est rejoué à l’accord. Le déclencheur (événement
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
/* P4 : l’action suivante sous le remerciement (data-suite-href, data-suite-texte du formulaire) */
export const suiteDe = form => (form && form.dataset.suiteHref && form.dataset.suiteTexte) ? { href: form.dataset.suiteHref, texte: form.dataset.suiteTexte } : null;
/* le courriel de secours : l’adresse de contact affichée par la page (le lien .contact__mail, qui porte
   thibaut.harang@civik-ia.fr sur la page Conseil depuis le 07/10/2026 au soir), sinon contact@civik-ia.fr ;
   le message saisi part dans le corps */
export const courrielPage = () => { const a = document.querySelector('a.contact__mail[href^="mailto:"]'); const m = a && a.getAttribute('href').replace(/^mailto:/, '').split('?')[0].trim(); return m || 'contact@civik-ia.fr'; };
export const lienCourriel = (sujet, corps, adresse) => `mailto:${adresse || courrielPage()}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
const echapper = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/* les états d’un envoi réel, dans le bloc d’état (focus posé sur lui ; role status pour la réussite, alert pour l’échec) ;
   o.voix choisit les textes par défaut (R7) ; o.suite, l’action suivante (P4).
   P4 (partie 9, friction 15) : l’échec dit ce qui s’est passé et donne trois sorties : « Réessayer » en plein (o.reessayer),
   « Envoyer par courriel » (lien mailto qui reprend l’objet et le message : il est déjà écrit) avec l’adresse écrite en clair
   à côté (dans le navigateur de LinkedIn ou d’Instagram, le lien mailto échoue souvent sans rien dire), « Copier mon message ».
   o.formulaire : le nom fermé du formulaire, pour la mesure formulaire_echec (cause, puis la sortie choisie) */
export function etatEnvoi(bloc, etat, o = {}) {
  if (!bloc) return;
  const t = TEXTES_ENVOI[o.voix === 'nous' ? 'nous' : 'je'];
  bloc.classList.toggle('envoi--echec', etat === 'echec');
  bloc.setAttribute('role', etat === 'echec' ? 'alert' : 'status');
  if (etat === 'reussite') {
    const suite = o.suite ? `<p class="envoi__suite"><a class="lien" href="${echapper(o.suite.href)}">${echapper(o.suite.texte)}</a></p>` : '';
    bloc.innerHTML = `<p class="envoi__t">${echapper(o.titre || t.titre)}</p><p>${echapper(o.texte || t.texte)}</p>${suite}`;
  } else {
    const adresse = o.courriel || courrielPage(), sujet = o.sujet || 'Contact', corps = o.corps || '';
    const f = o.formulaire || null, c = causeEchec();
    bloc.innerHTML = `<p class="envoi__t">Le message n’est pas parti.</p><p>Vérifiez votre connexion et réessayez, ou envoyez-le par courriel : il est déjà écrit.</p>`
      + `<div class="envoi__actions">${o.reessayer ? '<button type="button" class="btn btn--plein btn--petit" data-reessayer>Réessayer</button>' : ''}`
      + `<a class="btn btn--filet btn--petit" data-par-courriel href="${echapper(lienCourriel(sujet, corps, adresse))}">Envoyer par courriel</a>`
      + `<button type="button" class="btn btn--filet btn--petit" data-copier-message>Copier mon message</button></div>`
      + `<p class="envoi__adresse">L’adresse, si votre messagerie ne s’ouvre pas : <span class="envoi__mel">${echapper(adresse)}</span></p>`
      + `<p class="envoi__copie" aria-live="polite" data-copie-message-ok></p>${o.plus || ''}`;
    if (f) mesurer('formulaire_echec', { formulaire: f, cause: c, suite: 'aucune' });
    const suite = s => { if (f) mesurer('formulaire_echec', { formulaire: f, cause: c, suite: s }); };
    const r = bloc.querySelector('[data-reessayer]');
    if (r) r.addEventListener('click', () => { suite('reessayer'); o.reessayer(); });
    bloc.querySelector('[data-par-courriel]').addEventListener('click', () => suite('courriel'));
    bloc.querySelector('[data-copier-message]').addEventListener('click', async () => {
      suite('copie');
      const ok = await copier(`À : ${adresse}\nObjet : ${sujet}\n\n${corps}`);
      bloc.querySelector('[data-copie-message-ok]').textContent = ok ? 'Message copié. Collez-le dans votre messagerie.' : 'La copie a échoué : sélectionnez le texte à la main.';
    });
  }
  bloc.hidden = false;
  if (!bloc.hasAttribute('tabindex')) bloc.setAttribute('tabindex', '-1');
  bloc.focus({ preventScroll: false });
}
/* le bouton pendant l’envoi : désactivé, « Envoi… » ; rend une fonction qui le remet comme avant */
export function boutonEnCours(bouton) {
  const avant = bouton.innerHTML;
  /* P3 (partie 3) : pendant l’envoi, le bouton garde sa couleur, aria-busy, et un trait or se trace sous « Envoi… » (pages.css) */
  bouton.disabled = true; bouton.textContent = 'Envoi…'; bouton.setAttribute('aria-busy', 'true');
  return (garderDesactive) => { bouton.innerHTML = avant; bouton.disabled = !!garderDesactive; bouton.removeAttribute('aria-busy'); };
}
/* P4 : « Réessayer » relance le même envoi, par le même chemin (la vérification des champs repasse) */
export const relancer = form => () => { try { if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true })); } catch (e) { /* rien */ } };
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
  if (ok) { remettre(true); signalerDemande(form, 'fiche'); etatEnvoi(o.bloc, 'reussite', { voix, titre: form.dataset.reussiteTitre, texte: form.dataset.reussite, suite: suiteDe(form) }); }
  else { remettre(false); etatEnvoi(o.bloc, 'echec', { voix, sujet, corps: o.texte || '', reessayer: relancer(form), formulaire: nomFormulaire(form) }); }
  if (ok) poserVignette(o.bloc);
  return ok;
}

/* ---------- P4 : le brouillon, gardé le temps de la session du navigateur ----------
   Les champs nommés du formulaire (cases cochées comprises ; ni les champs cachés, ni le pot de miel, ni ce qui commence
   par « _ ») sont écrits dans sessionStorage pendant la saisie, rendus au retour sur la page (seulement dans un champ resté
   vide), oubliés après la réussite. Rien ne part ailleurs ; la session du navigateur fermée, rien ne reste. */
export function brouillon(form, cle) {
  const k = 'civik-ia-brouillon:' + cle;
  const lire = () => { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const oublier = () => { try { sessionStorage.removeItem(k); } catch (e) { /* rien */ } };
  const garde = c => c.name && !c.name.startsWith('_') && c.type !== 'hidden' && c.type !== 'password' && c.type !== 'file' && c.getAttribute('tabindex') !== '-1';
  const valeurs = () => {
    const v = {};
    $$('input,textarea,select', form).filter(garde).forEach(c => {
      if (c.type === 'radio' || c.type === 'checkbox') { if (c.checked) (v[c.name] = v[c.name] || []).push(c.value); }
      else if (c.value.trim()) v[c.name] = c.value;
    });
    return v;
  };
  const garder = () => { const v = valeurs(); try { if (Object.keys(v).length) sessionStorage.setItem(k, JSON.stringify(v)); else oublier(); } catch (e) { /* rien */ } };
  const rendre = () => {
    const v = lire(); if (!v || typeof v !== 'object') return false;
    let rendu = false;
    Object.entries(v).forEach(([nom, val]) => {
      const els = $$('input,textarea,select', form).filter(c => garde(c) && c.name === nom);
      if (Array.isArray(val)) els.forEach(c => { if ((c.type === 'radio' || c.type === 'checkbox') && val.includes(c.value)) { c.checked = true; rendu = true; } });
      else if (els[0] && typeof val === 'string' && !els[0].value) { els[0].value = val; rendu = true; }
    });
    return rendu;
  };
  let t = 0;
  const suivre = () => { clearTimeout(t); t = setTimeout(garder, 250); };
  return { garder, rendre, oublier, lire, suivre };
}

/* ---------- le formulaire court (nom, structure, courriel, besoin) ---------- */
export const COURRIEL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/* P4 (partie 5) : le téléphone, facultatif, en format souple (espaces, points, tirets, parenthèses acceptés) : dix chiffres
   commençant par 0, ou +33 suivi de neuf chiffres (le 0 entre parenthèses accepté), ou un numéro étranger de 7 à 15 chiffres */
export const telephoneValide = v => {
  const s = String(v).replace(/[\s.\-()/]/g, '');
  return /^0[1-9]\d{8}$/.test(s) || /^(\+33|0033)0?[1-9]\d{8}$/.test(s) || /^(\+|00)(?!33)\d{7,15}$/.test(s);
};
export function verifierChamp(c) {
  const err = c.closest('.champ')?.querySelector('.erreur');
  let m = '', type = '';
  if (c.required && !c.value.trim()) { m = c.dataset.manque || 'Ce champ est à remplir.'; type = 'vide'; }
  /* P3 (partie 5) : l'erreur dit où regarder */
  else if (c.type === 'email' && c.value.trim() && !COURRIEL.test(c.value.trim())) { m = 'Ce courriel semble incomplet : vérifiez la partie après « @ ».'; type = 'format'; }
  /* P4 (partie 5) : le téléphone, facultatif ; un exemple fictif au bon format */
  else if (c.type === 'tel' && c.value.trim() && !telephoneValide(c.value)) { m = 'Ce numéro semble incomplet : dix chiffres, par exemple 06 12 34 56 78.'; type = 'format'; }
  /* P4 : la mesure de l’erreur, au passage à l’erreur seulement (le nom du champ et le type, jamais la valeur) */
  if (m && c.getAttribute('aria-invalid') !== 'true') erreurChamp(c, type);
  c.setAttribute('aria-invalid', m ? 'true' : 'false');
  if (err) err.textContent = m;
  return !m;
}
/* P4 : un groupe de pastilles obligatoire ([data-requis], comme les fiches) ; l’erreur s’écrit dans son [data-erreur] */
function verifierGroupe(g) {
  const ok = $$('input', g).some(x => x.checked), err = g.parentElement && g.parentElement.querySelector('[data-erreur]');
  if (!ok && err && !err.textContent) { const r = $('input', g); if (r && r.form) erreurChamp(r, 'vide'); }
  if (err) err.textContent = ok ? '' : (g.dataset.manque || 'Choisissez une réponse.');
  return ok;
}
export function formulaireCourt(form, activite) {
  if (!form) return;
  /* CO-13 : le champ anti-robot s'appelle « _gotcha » (Formspree) là où l'envoi est réel, « site » ailleurs */
  const champs = $$('input,textarea', form).filter(c => c.type !== 'hidden' && c.type !== 'radio' && c.type !== 'checkbox' && c.name !== 'site' && c.name !== '_gotcha');
  const groupes = $$('[data-requis]', form);
  champs.forEach(c => c.addEventListener('blur', () => { if (c.value) verifierChamp(c); }));
  champs.forEach(c => c.addEventListener('input', () => { if (c.getAttribute('aria-invalid') === 'true') verifierChamp(c); }));
  groupes.forEach(g => g.addEventListener('change', () => verifierGroupe(g)));
  const envoi = form.querySelector('.envoi');
  const reel = envoiReel(form);
  /* P4 : le brouillon (sessionStorage), rendu au retour, oublié après la réussite */
  const memo = brouillon(form, location.pathname + ':' + (form.id || nomFormulaire(form) || activite));
  memo.rendre();
  form.addEventListener('input', memo.suivre); form.addEventListener('change', memo.suivre);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const koG = groupes.filter(g => !verifierGroupe(g));
    const ko = champs.filter(c => !verifierChamp(c));
    if (koG.length) { $('input', koG[0]).focus(); return; }
    if (ko.length) { ko[0].focus(); return; }
    const v = n => (form.elements[n] && typeof form.elements[n].value === 'string' ? form.elements[n].value.trim() : '');
    /* CO-13 : sur la page Conseil, les champs portent les noms attendus par Formspree (email, message) */
    const courriel = v('courriel') || v('email'), besoin = v('besoin') || v('message');
    /* P4 : le sujet choisi (l’accueil), par son libellé */
    const choisi = $('[name="sujet"]:checked', form), sujetLu = choisi ? (choisi.dataset.libelle || choisi.value) : '';
    const texte = [`Demande ${activite}, depuis la page ${activite} de civik-ia.fr`, '', ...(sujetLu ? [`Sujet : ${sujetLu}`] : []), `Nom : ${v('nom')}`, `Structure : ${v('structure')}`, `Courriel : ${courriel}`, `Besoin : ${besoin}`].join('\n');
    if (reel) {
      /* CO-13 : l’envoi réel, sans quitter la page ; trois états (en cours, réussite, échec avec le courriel de secours) ;
         R7 : la voix (data-voix) et l’objet (data-sujet) viennent des attributs du formulaire */
      if (form.dataset.enCours) return;
      form.dataset.enCours = '1'; form.setAttribute('aria-busy', 'true');
      const bouton = form.querySelector('[type="submit"]'), remettre = boutonEnCours(bouton);
      const sujet = sujetDe(form, `Contact ${activite}`) + (sujetLu ? `, sujet : ${sujetLu}` : ''), voix = voixDe(form);
      const donnees = new FormData(form); donnees.set('_replyto', courriel); donnees.set('_subject', sujet);
      if (sujetLu) donnees.set('sujet', sujetLu);
      if (envoi) { envoi.hidden = true; envoi.classList.remove('envoi--echec'); }
      const ok = await envoyerAvecLettre(form, form.dataset.envoi, donnees, { bloc: envoi, bouton });
      delete form.dataset.enCours; form.removeAttribute('aria-busy');
      if (ok) { remettre(true); signalerDemande(form, 'contact'); form.classList.add('envoye'); memo.oublier(); etatEnvoi(envoi, 'reussite', { voix, titre: form.dataset.reussiteTitre, texte: form.dataset.reussite, suite: suiteDe(form) }); }
      else { remettre(false); etatEnvoi(envoi, 'echec', { voix, sujet, corps: texte, reessayer: relancer(form), formulaire: nomFormulaire(form) }); }
      if (ok) poserVignette(envoi);
      return;
    }
    /* Maquette (sans data-envoi) : rien n’est transmis, les données restent dans le navigateur. */
    envoi.hidden = false;
    const copie = envoi.querySelector('[data-copier]'), ok = envoi.querySelector('.copie-ok');
    /* R2 : l’espace insécable avant les deux-points */
    copie.onclick = async () => { ok.textContent = (await copier(texte)) ? 'Copié. Collez-le dans votre message.' : 'La copie a échoué : sélectionnez le texte à la main.'; };
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
