/* =====================================================================
   Page Marianne, section « Le cerveau de Marianne » (#connaissance).
   Intégration du 13/10/2026 (maquettes/marianne-base/INTEGRATION-2026-10-13.md)
   du script de la maquette validée par Thibaut le 07/10/2026
   (marianne-base/page.js, passes 1 à 4, MB-1 à MB-15), en module ES chargé
   par /marianne/index.html à côté de marianne.js, qu'il ne touche pas.
   Changements de l'intégration, et eux seuls :
   - imports par chemins absolus (/commun/pages/, sans effet de bord à
     l'import) ; demarrer() n'est pas appelé (la barre, les formulaires et
     l'étiquette de la page sont ceux de marianne.js) : le titre mot à mot et
     les entrées au défilement sont posés ici, limités à la section, à la
     bande et au point différenciant ;
   - crochets d'essai retirés (?variante, ?etat, ?jouer, ?retenue, ?essai,
     le journal et window.__mb), comme sur les autres pages depuis la passe 26 ;
   - mouvement réduit étendu à html.anim-non (bouton « Arrêter les
     animations » de la page) : état final, six temps lisibles, aucune butée ;
     le bouton pressé en cours de visite y passe aussitôt (événement
     marianne:statique de marianne.js) ;
   - la butée (MB-10 bis) se pose sur div.feuille, le conteneur qui suit le
     hero, et non plus sur <main> (le hero a sa propre lecture au défilement) ;
   - les classes .kb-doc__* deviennent .kb-kb-doc__* (collision avec la page).
   ---------------------------------------------------------------------
   Section « base de connaissances » de la page Marianne (maquette du
   06/10/2026 ; première passe du 06/10/2026, points MB-1 à MB-5).
   Trente-huit documents de la commune de démonstration (Villeneuve-les-
   Ormes, fictive) arrivent en désordre sur la table (MB-2), sont lus et
   rangés, passent un par un au contrôle, se fondent en douze fiches, une
   par sujet, sont sourcés et datés (MB-3), puis aspirés par le sceau de
   Marianne, qui devient l'application posée sur son socle (MB-11, troisième
   passe du 07/10/2026).
   Un séquenceur joue chaque temps en entier avant le suivant (MB-1) :
   jamais coupé ni sauté, accéléré (2,5 puis 4 fois) quand le lecteur a
   pris de l'avance (MB-10 bis) ; une seule butée, au bas de la section,
   tient tant que la ligne de temps n'est pas au bout (voir plus bas).
   Seules transform et opacity bougent (animations Web, composées par la
   carte graphique) ; mouvement réduit : l'état final, sans animation.
   ===================================================================== */
import { $, $$, reduit, decouperMots, observer } from '/commun/pages/pages.js';
import { rng } from '/commun/pages/plume.js';

const NBSP = ' ';
const racine = document.documentElement;
/* mouvement réduit : la préférence du système, ou le bouton « Arrêter les animations » de la page (html.anim-non) */
const reduitPage = () => reduit() || racine.classList.contains('anim-non');
racine.classList.add('kb-js');
/* ce que demarrer() faisait pour la section : le titre mot à mot (data-mots) et les entrées au défilement (data-entree) */
const ZONES = ['#connaissance', '.chiffres-b', '.difference'];
const entrer = el => { if (reduitPage()) el.classList.add('vu'); else observer(el); };
ZONES.forEach(z => { const r = $(z); if (!r) return; $$('[data-mots]', r).forEach(el => { decouperMots(el); entrer(el); }); $$('[data-entree]', r).forEach(entrer); });

/* ---------------------------------------------------------------------
   MB-2 : les documents. Douze fiches (MB-3), et pour chacune les
   documents qui la nourrissent, avec leurs doublons, leurs versions
   périmées et leurs contradictions. Le premier document gardé d'une
   fiche est sa source principale (puce datée, fil du sourçage).
   --------------------------------------------------------------------- */
/* MB-11 bis (07/10/2026) : la fiche Cantine a pour source le formulaire « Inscription à la cantine » de la collecte (temps 1) ; sa puce dit
   « Inscription cantine, 01/09/2026 » (96,3 px à 8 px, sous les 97,2 px de « Page Action sociale », la mesure de T2), et c'est cette source
   que cite la réponse du téléphone de la fin : la même source passe de la fiche à l'application. Le quatrième champ nomme le document source. */
const FICHES = [
  ['Cantine', 'Inscription cantine', '01/09/2026', 'Inscription à la cantine'],
  ['Déchets', 'Calendrier 2026', '05/01/2026'],
  ['État civil', 'Page État civil', '14/09/2026'],
  ['Urbanisme', `PLU, article UA${NBSP}11`, '18/03/2026'],
  ['Élections', 'Arrêté du maire', '10/02/2026'],
  ['Écoles', 'Page Écoles', '01/09/2026'],
  ['Horaires', 'Page Horaires', '22/09/2026'],
  ['Agenda', 'Bulletin municipal', '01/09/2026'],
  ['Conseil municipal', 'Compte rendu', '26/06/2026'],
  ['Aides', 'Page Action sociale', '08/09/2026'],
  ['Travaux', 'Arrêté de voirie', '15/09/2026'],
  ['Contacts', 'Liste des services', '03/09/2026']
].map(([titre, source, date, srcNom], k) => ({ k, titre, source, date, srcNom, docs: [] }));

/* fiche, genre, type affiché, nom ; options : scan, sort (doublon, perime, contra), contre (le document contredit), retourne, corne */
const D = (f, genre, type, nom, o = {}) => ({ f, genre, type, nom, ...o });
const DOCS = [
  D(0, 'delib', 'Délibération', 'Tarifs de la cantine', { scan: 1 }),
  D(0, 'form', 'Formulaire', 'Inscription à la cantine'),
  D(0, 'courriel', 'Courriel', 'Menus de la rentrée'),
  D(0, 'form', 'Formulaire', 'Inscription à la cantine', { sort: 'doublon' }),
  D(0, 'page', 'Page du site', 'Tarifs de la cantine 2025', { sort: 'contra', contre: 'Tarifs de la cantine' }),
  D(1, 'pdf', 'PDF', 'Calendrier des déchets 2026'),
  D(1, 'page', 'Page du site', 'Déchetterie'),
  D(1, 'pdf', 'PDF', 'Calendrier des déchets 2026', { sort: 'doublon' }),
  D(1, 'pdf', 'PDF', 'Calendrier des déchets 2019', { sort: 'perime' }),
  D(1, 'page', 'Page du site', 'Déchetterie, ancienne page', { sort: 'contra', contre: 'Déchetterie' }),
  D(2, 'page', 'Page du site', 'Actes d\'état civil'),
  D(2, 'form', 'Formulaire', 'Demande d\'acte de naissance', { corne: 1 }),
  D(3, 'pdf', 'PDF', 'Plan local d\'urbanisme'),
  D(3, 'page', 'Page du site', 'Déclaration de travaux'),
  D(4, 'arrete', 'Arrêté', 'Bureaux de vote', { scan: 1 }),
  D(4, 'page', 'Page du site', 'S\'inscrire sur les listes'),
  D(4, 'page', 'Ancienne page', 'Élections 2020', { sort: 'perime' }),
  D(5, 'page', 'Page du site', 'Écoles de la commune'),
  D(5, 'courriel', 'Courriel', 'Rentrée scolaire 2026'),
  D(6, 'page', 'Page du site', 'Horaires et contacts'),
  D(6, 'affiche', 'Affiche', 'Horaires de la mairie', { scan: 1 }),
  D(6, 'page', 'Page du site', 'Horaires et contacts', { sort: 'doublon' }),
  D(7, 'bulletin', 'Bulletin municipal', 'Septembre 2026'),
  D(7, 'page', 'Page du site', 'Agenda'),
  D(7, 'affiche', 'Affiche', 'Fête du village 2026', { corne: 1 }),
  D(7, 'bulletin', 'Bulletin municipal', 'Septembre 2026', { sort: 'doublon' }),
  D(7, 'affiche', 'Affiche', 'Fête du village 2026', { sort: 'doublon' }),
  D(7, 'affiche', 'Affiche', 'Fête du village 2019', { sort: 'perime' }),
  D(8, 'cr', 'Compte rendu', 'Conseil municipal de juin', { retourne: 1 }),
  D(8, 'delib', 'Délibération', 'Budget de l\'école', { scan: 1 }),
  D(8, 'pdf', 'PDF', 'Ordre du jour'),
  D(9, 'page', 'Page du site', 'Aides et action sociale'),
  D(9, 'courriel', 'Courriel', 'Aide au chauffage', { corne: 1 }),
  D(10, 'arrete', 'Arrêté', 'Circulation, rue des Ormes', { scan: 1 }),
  D(10, 'page', 'Actualité', 'Travaux en cours'),
  D(10, 'arrete', 'Arrêté', 'Bruit des chantiers 2019', { scan: 1, sort: 'perime' }),
  D(11, 'courriel', 'Courriel', 'Annuaire des services', { retourne: 1 }),
  D(11, 'page', 'Page du site', 'Nous contacter')
];

const TAMPONS = { doublon: 'Doublon', perime: 'Périmé', verif: `À vérifier`, verifie: 'Vérifié' };
const PICTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>';
const DOUX = 'cubic-bezier(.2,.8,.2,1)', ENTREE = 'cubic-bezier(.16,1,.3,1)', DEPL = 'cubic-bezier(.65,0,.35,1)';

const table = $('[data-table]'), legende = $('[data-legende]'), cote = $('[data-cote]');
const coteEcartes = $('.table__cote-t--ecartes', cote), coteSources = $('.table__cote-t--sources', cote);
/* MB-11 : l'application de la fin (le téléphone, son écran, le sceau, les dalles) ; les documents, les fiches, le cadre et les fils passent dessous */
const appli = $('[data-appli]'), tel = $('[data-tel]', appli), ecr = $('[data-ecr]', appli), photo = $('[data-photo]', appli), sceau = $('[data-sceau]', appli), avatar = $('[data-avatar]', appli);
const ecrBase = $('[data-ecr-base]', appli), ecrQ = $('[data-ecr-q]', appli), ecrR = $('[data-ecr-r]', appli), ecrS = $('[data-ecr-s]', appli), ecrH = $('.ecr__h', appli), ecrCorps = $('.ecr__corps', appli), ecrFil = $('.ecr__fil', appli);
const dallesBox = $('[data-dalles]', appli), dalles = $$('span', dallesBox).filter(x => x.parentElement === dallesBox);
const ECR_W = 340, ECR_H = 736, TEL = { w: 589, h: 1205, q: [.0628, .0274, .9372, .9726] };
/* MB-11 : la ligne de l'écran reprend le chiffre du bandeau (bloc data-releve="site", le seul endroit où il s'écrit, MB-4) ; aucun autre nombre */
{ const n = $('[data-releve="site"] .chiffres-b__n'); if (n && n.textContent.trim()) $('span', ecrBase).textContent = `${n.textContent.trim()} de fiches, chacune reliée à sa source`; }

/* ---------- la fabrique des éléments ---------- */
const creer = (cls, html = '', tag = 'div') => { const e = document.createElement(tag); e.className = cls; if (html) e.innerHTML = html; return e; };
const docs = DOCS.map((d, i) => {
  const o = { ...d, i, garde: !d.sort };
  const deco = d.genre === 'page' ? '<span class="kb-doc__barre"><i></i><i></i><i></i></span>'
    : d.genre === 'pdf' ? '<span class="kb-doc__pdf">PDF</span>'
    : d.genre === 'courriel' ? `<span class="kb-doc__de">De${NBSP}: mairie</span>`
    : (d.genre === 'arrete' || d.genre === 'delib' || d.genre === 'cr') ? '<span class="kb-doc__filet"><i></i><i></i><i></i></span>' : '';
  const lignes = d.genre === 'form' ? '<span class="kb-doc__cases"><i></i><i></i><i></i></span>' : '<span class="kb-doc__lignes"><i></i><i></i><i></i><i></i></span>';
  const scan = d.scan ? '<span class="carte__grain"><i class="carte__balai"></i></span><span class="tampon tampon--scan">Scan</span>' : '';
  const c = creer('carte carte--' + d.genre + (d.scan ? ' carte--scan' : '') + (d.retourne ? ' carte--retourne' : '') + (d.corne ? ' carte--corne' : ''),
    `<div class="carte__face carte__face--doc">${deco}<span class="kb-doc__corps"><span class="kb-doc__type">${d.type}</span><span class="kb-doc__nom">${d.nom}</span>${lignes}</span>${scan}${d.corne ? '<i class="carte__corne"></i>' : ''}</div>`
    + (d.retourne ? '<div class="carte__face carte__face--verso"><span class="kb-doc__lignes"><i></i><i></i><i></i><i></i></span></div>' : ''));
  table.insertBefore(c, appli);
  o.el = c;
  o.recto = $('.carte__face--doc', c); o.verso = $('.carte__face--verso', c);
  o.grain = $('.carte__grain', c); o.balai = $('.carte__balai', c); o.tScan = $('.tampon--scan', c); o.corps = $('.kb-doc__corps', c);
  return o;
});
/* les liens entre documents : la fiche nourrie, le document contredit, la source principale */
docs.forEach(d => {
  if (d.sort === 'contra') { d.partenaire = docs.find(x => x.f === d.f && x.garde && x.nom === d.contre); d.partenaire.contredit = d; }
  if (d.garde) FICHES[d.f].docs.push(d);
});
const N = docs.length, GARDES = docs.filter(d => d.garde), NG = GARDES.length;
const NSCANS = docs.filter(d => d.scan).length, NECARTES = docs.filter(d => d.sort === 'doublon' || d.sort === 'perime').length, NCONTRA = docs.filter(d => d.sort === 'contra').length;
/* MB-3 : les tampons du contrôle et la rature des pages contredites, posés seulement sur les documents qui en ont besoin */
docs.forEach(d => {
  const verdict = d.sort === 'doublon' ? 'doublon' : d.sort === 'perime' ? 'perime' : d.sort === 'contra' ? 'verif' : d.contredit ? 'verif' : null;
  if (verdict) { d.tampon = creer('tampon tampon--verdict tampon--' + verdict, TAMPONS[verdict], 'span'); d.el.appendChild(d.tampon); }
  if (d.contredit) { d.tampon2 = creer('tampon tampon--verdict tampon--verifie', TAMPONS.verifie, 'span'); d.el.appendChild(d.tampon2); }
  if (d.sort === 'contra') { d.rature = creer('carte__rature', '', 'i'); d.el.appendChild(d.rature); }
  if (d.garde) { d.ok = creer('carte__ok', '', 'i'); d.el.appendChild(d.ok); }
});
/* les fiches */
FICHES.forEach(f => {
  f.docs.forEach((d, j) => { d.nl = j % 2 ? 2 : 3; d.l0 = f.docs.slice(0, j).reduce((a, x) => a + x.nl, 0); });
  const nl = f.docs.reduce((a, d) => a + d.nl, 0);
  f.el = creer('fiche-b', '<i class="fiche-b__ep fiche-b__ep--3"></i><i class="fiche-b__ep fiche-b__ep--2"></i>'
    + `<div class="fiche-b__face"><span class="kb-doc__type">Fiche</span><span class="fiche-b__titre">${f.titre}</span><span class="fiche-b__lignes">${f.docs.map(d => '<b>' + '<i></i>'.repeat(d.nl) + '</b>').join('')}</span>`
    + `<span class="source-b">${PICTO}<span><b>${f.source}</b><small>${f.date}</small></span></span></div>`);
  table.insertBefore(f.el, appli);
  f.lignes = $$('.fiche-b__lignes b', f.el); f.ep = [$('.fiche-b__ep--2', f.el), $('.fiche-b__ep--3', f.el)]; f.puce = $('.source-b', f.el);
  f.source0 = (f.srcNom && f.docs.find(d => d.nom === f.srcNom)) || f.docs[0];   /* MB-11 bis : le document source nommé, sinon le premier gardé */
});
/* MB-11 bis : la réponse du téléphone cite la source de la fiche Cantine, mot pour mot */
$('span', ecrS).textContent = `Source${NBSP}: ${FICHES[0].source}, ${FICHES[0].date}`;
/* le cadre de contrôle, les fils des contradictions et des sources */
const cadre = creer('cadre'); table.insertBefore(cadre, appli);
docs.filter(d => d.sort === 'contra').forEach(d => { d.fil = creer('fil'); table.insertBefore(d.fil, appli); });
FICHES.forEach(f => { f.fil = creer('fil fil--source'); table.insertBefore(f.fil, appli); });

/* ---------------------------------------------------------------------
   La géométrie (recalculée au redimensionnement). Zone A à gauche : le
   désordre, les rangs, les fiches. Zone B à droite : la pile des écartés,
   puis les sources en filigrane. Positions par le centre.
   --------------------------------------------------------------------- */
let G = null;
/* T2 : taille de dessin d'une fiche (celle de 1440 et de 1920, où le nom de source le plus long, « Page Action sociale », 97,22 px à 8 px, tient tout juste : 97,22 + 48 de marges = 145,22, plus 0,18 de jeu) ; largeur de fiche
   à partir de laquelle le dessin du petit écran porte le nom de la source (le plus long, à 6 px, demande 105 px) */
const FICHE_W = 145.4, FICHE_H = 132, FICHE_NOM_MIN = 106;
const LEGENDE_LONGUE = () => [0, 1, 2, 3, 4, 5].map(e => texteLegende(e, { n: N, s: NSCANS, x: NECARTES, c: NCONTRA, f: FICHES.length })).sort((a, b) => b.length - a.length)[0];
/* MB-11 : la géométrie de l'application (téléphone, écran, sceau, dalles), en pixels de la table */
function geometrieAppli(W, H, mob, pad) {
  const pb = mob ? 9 : 14, ecart = mob ? 6 : 9;
  /* les dalles : une rangée centrée, plus étroite que la table sur ordinateur */
  const dW = mob ? W - 2 * pad : Math.min(W - 2 * pad, Math.max(400, W * .76));
  dallesBox.style.width = dW + 'px';
  const dH = dallesBox.offsetHeight, dx = (W - dW) / 2;
  let dy = H - pb - dH;
  /* le haut : sous le cartouche du sixième temps (sa hauteur réelle) */
  const avant = legende.textContent; legende.textContent = texteLegende(5, FINAL);
  const haut5 = legende.offsetTop + legende.offsetHeight + (mob ? 6 : 10); legende.textContent = avant;
  /* 40 % de la table au plus sur ordinateur (fenêtre de plus de 900 px), 60 % au plus sur téléphone et tablette */
  const pw = Math.max(40, Math.min((dy - ecart - haut5) * TEL.w / TEL.h, W * (matchMedia('(max-width:900px)').matches ? .6 : .4))), ph = pw * TEL.h / TEL.w;
  /* quand la table est plus haute que le téléphone ne peut l'être (largeur limitée), le téléphone et ses dalles se centrent dans la hauteur libre */
  dy -= Math.max(0, (dy - ecart - haut5 - ph) / 2);
  const tx = W / 2 - pw / 2, ty = dy - ecart - ph, cx = W / 2, cy = ty + ph / 2;
  tel.style.width = pw + 'px'; tel.style.height = ph + 'px';
  /* l'écran : 340 x 736 réduit dans le trou de la photo. Le texte de l'écran vise 10,5 px à l'écran (15,6 px de l'écran du film au
     moins) et se réduit tant que la conversation ne tient pas entière ; sur un petit téléphone dessiné, si l'heure du message coûte
     trop de taille au texte, elle s'efface */
  const ew = (TEL.q[2] - TEL.q[0]) * pw, eh = (TEL.q[3] - TEL.q[1]) * ph, sx = ew / ECR_W, sy = eh / ECR_H;
  ecr.style.transform = `scale(${sx.toFixed(5)},${sy.toFixed(5)})`;
  const tient = () => ecrFil.offsetTop + ecrFil.offsetHeight <= ecrCorps.clientHeight + .5;
  const cible = Math.min(32, Math.max(15.6, 10.5 / sx));
  /* la plus grande taille qui tient, par dichotomie (sept essais au plus ; l'écran est un bloc isolé, contain: strict, chaque essai ne remet en page que lui) */
  const plusGrand = avecH => {
    ecrH.style.display = avecH ? '' : 'none';
    const essai = f => { ecr.style.fontSize = f.toFixed(2) + 'px'; return tient(); };
    if (essai(cible)) return cible;
    let bas = 15.6, haut = cible;
    if (!essai(bas)) return bas;
    while (haut - bas > .15) { const m = (bas + haut) / 2; if (essai(m)) bas = m; else haut = m; }
    essai(bas); return bas;
  };
  const f1 = plusGrand(true);
  if (f1 * sx < 7.5 || !tient()) { const f2 = plusGrand(false); if (f2 < f1 + .6 && tient()) plusGrand(true); }
  /* le nom de la commune tient sur une ligne : sa taille se réduit au besoin (de 0,86 à 0,6 em) */
  const nom = $('.ecr__tete strong', ecr); nom.style.fontSize = '';
  for (let k = .86; nom.scrollWidth > nom.clientWidth + .5 && k > .6; k -= .02) nom.style.fontSize = (k - .02).toFixed(2) + 'em';
  /* l'avatar de l'en-tête, où le sceau vient se poser (repère de l'écran, puis de la table) */
  const ax = avatar.offsetLeft + avatar.offsetWidth / 2, ay = avatar.offsetTop + avatar.offsetHeight / 2;
  const avX = tx + TEL.q[0] * pw + ax * sx, avY = ty + TEL.q[1] * ph + ay * sy, avD = avatar.offsetWidth * sx;
  /* le sceau : dessiné à sa plus grande taille (la largeur du téléphone), réduit au départ (le médaillon d'avant : 76 px, 54 sur téléphone) */
  const D = pw, s0 = Math.min(1, (mob ? 54 : 76) / D);
  sceau.style.width = sceau.style.height = D + 'px'; sceau.style.setProperty('--d', D.toFixed(1) + 'px');
  return { pw, ph, tx, ty, cx, cy, sx, sy, D, s0, dx, dy, dW, dH, avX, avY, avD, fs: +parseFloat(ecr.style.fontSize).toFixed(1) };
}
function calculer() {
  const W = table.clientWidth, H = table.clientHeight, mob = W < 520;
  const avant = legende.textContent; legende.textContent = LEGENDE_LONGUE();
  const haut = legende.offsetTop + legende.offsetHeight + (mob ? 8 : 12); legende.textContent = avant;
  const pad = mob ? 9 : 18, gap = mob ? 5 : 8, bas = H - pad;
  const zb = Math.round(W * (mob ? .2 : .21)), zaX = pad, zaW = W - 2 * pad - zb - gap, zbX = W - pad - zb;
  const dw = mob ? 62 : 104, dh = Math.round(dw * 1.3);
  const R = rng(11);
  /* les rangs : 7 colonnes, 6 rangées */
  const COLS = 7, ROWS = 6, px = zaW / COLS, py = (bas - haut) / ROWS;
  const sr = Math.min((px - gap) / dw, (py - gap) / dh);
  /* les fiches : 3 colonnes, 4 rangées, dans la zone A */
  const fw = (zaW - 2 * gap) / 3, fh = Math.min((bas - haut - 3 * gap) / 4, fw * .92);
  const gh = 4 * fh + 3 * gap, gy = haut + (bas - haut - gh) / 2;
  /* T2 : le CSS du petit écran suit la largeur de la table (data-mob), comme la géométrie ci-dessus ; « xs » : la fiche est trop étroite pour porter le nom de sa source */
  if (mob) table.dataset.mob = fw < FICHE_NOM_MIN ? 'xs' : 'm'; else delete table.dataset.mob;
  /* T2 : sur ordinateur (fenêtre de plus de 900 px, table de 520 px et plus), une fiche plus petite que son dessin de 1440 (FICHE_W x FICHE_H) est dessinée à cette taille
     puis réduite, au lieu de couper la puce de la source et le bas du contenu ; le facteur kf vaut 1 à 1440, 0,998 à 1920 : rien ne change de visible */
  const kf = !mob && matchMedia('(min-width:901px)').matches ? Math.min(1, fw / FICHE_W, fh / FICHE_H) : 1;
  const lw = fw / kf, lh = fh / kf;
  const fiche = FICHES.map(f => ({ x: zaX + (f.k % 3) * (fw + gap) + fw / 2, y: gy + Math.floor(f.k / 3) * (fh + gap) + fh / 2, r: 0, s: kf, o: 1 }));
  /* MB-3 : chaque sujet range ses documents près de l'endroit où naîtra sa fiche (tour à tour, la case libre la plus proche) */
  const cases = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) cases.push({ n: r * COLS + c, x: zaX + (c + .5) * px, y: haut + (r + .5) * py, libre: true });
  const attente = FICHES.map(f => docs.filter(d => d.f === f.k));
  const prises = FICHES.map(() => []);
  for (let tour = 0; attente.some(a => a.length); tour++) FICHES.forEach(f => {
    if (!attente[f.k].length) return;
    let m = null, dm = 1e9; const p = fiche[f.k];
    cases.forEach(c => { if (!c.libre) return; const dd = (c.x - p.x) ** 2 + ((c.y - p.y) * 1.15) ** 2; if (dd < dm) { dm = dd; m = c; } });
    m.libre = false; prises[f.k].push(m); attente[f.k].shift();
  });
  const rang = [], caseDe = [];
  FICHES.forEach(f => { const ds = docs.filter(d => d.f === f.k), cs = prises[f.k].sort((a, b) => a.n - b.n); ds.forEach((d, j) => { caseDe[d.i] = cs[j].n; rang[d.i] = { x: cs[j].x, y: cs[j].y, r: 0, s: sr, o: 1 }; }); });
  const parcours = docs.slice().sort((a, b) => caseDe[a.i] - caseDe[b.i]);
  const decale = (zb + gap) / 2, rang1 = rang.map(p => ({ ...p, x: p.x + decale }));
  /* MB-2 : le désordre. Une grille brouillée sur toute la table, des documents qui se chevauchent, quelques-uns à moitié hors du plateau */
  const DC = mob ? 6 : 6, DR = 7, dx = (W - 2 * pad) / DC, dy = (bas - haut + 10) / DR;
  const fentes = []; for (let r = 0; r < DR; r++) for (let c = 0; c < DC; c++) fentes.push([c, r]);
  for (let k = fentes.length - 1; k > 0; k--) { const j = Math.floor(R() * (k + 1)); [fentes[k], fentes[j]] = [fentes[j], fentes[k]]; }
  const desordre = [];
  docs.forEach((d, i) => {
    const [c, r] = fentes[i], s = (mob ? .9 : .86) * (.92 + R() * .16);
    desordre[i] = { x: pad + (c + .5 + (R() - .5) * .8) * dx, y: haut - 6 + (r + .5 + (R() - .5) * .8) * dy, r: (R() - .5) * 30, s, o: 1 };
  });
  /* les doublons tombent sur leur jumeau, de travers */
  docs.forEach(d => { if (d.sort !== 'doublon') return; const t = docs.find(x => x.f === d.f && x.garde && x.nom === d.nom) || docs.find(x => x.f === d.f && x.nom === d.nom && x !== d); const p = desordre[t.i]; desordre[d.i] = { x: p.x + dw * p.s * (.18 + R() * .1) * (R() < .5 ? -1 : 1), y: p.y + dh * p.s * (.14 + R() * .08), r: p.r + (R() < .5 ? -1 : 1) * (6 + R() * 6), s: p.s, o: 1 }; });
  /* à moitié hors du plateau : à gauche, à droite, en bas (sur ordinateur seulement pour le bas) */
  const bords = mob ? [['g', 2], ['d', 17], ['g', 30], ['d', 12]] : [['g', 2], ['d', 17], ['b', 30], ['b', 12]];
  if (mob) desordre.forEach(p => { const h = dh * p.s; p.y = Math.min(p.y, H - h * .46); });
  bords.forEach(([b, i]) => { const p = desordre[i], w = dw * p.s, h = dh * p.s;
    if (b === 'g') p.x = mob ? w * .3 : -w * .05; if (b === 'd') p.x = W - (mob ? w * .34 : -w * .05); if (b === 'b') p.y = H - h * .1; });
  /* l'ordre d'arrivée, en trois vagues ; un doublon arrive après son jumeau */
  const arrivee = docs.map(d => d.i); for (let k = arrivee.length - 1; k > 0; k--) { const j = Math.floor(R() * (k + 1)); [arrivee[k], arrivee[j]] = [arrivee[j], arrivee[k]]; }
  docs.forEach(d => { if (d.sort !== 'doublon') return; const t = docs.find(x => x.f === d.f && x.nom === d.nom && x !== d); const a = arrivee.indexOf(d.i), b = arrivee.indexOf(t.i); if (a < b) { arrivee[a] = t.i; arrivee[b] = d.i; } });
  const VAGUES = [[-1.1, -.55, -24], [1.15, -.12, 22], [-.2, 1.05, 14]];
  const dehors = []; arrivee.forEach((i, j) => { const v = VAGUES[Math.min(2, Math.floor(j / Math.ceil(N / 3)))], p = desordre[i]; dehors[i] = { x: p.x + v[0] * W, y: p.y + v[1] * H, r: p.r + v[2], s: p.s, o: 0 }; });
  /* la pile des écartés, dans la zone B, qui grossit vers le bas ; puis hors de la table */
  const ecartes = parcours.filter(d => !d.garde), pile = [], parti = [];
  const pas = mob ? 9 : 15, py0 = haut + Math.max(mob ? 20 : 30, (bas - haut - (ecartes.length - 1) * pas - dh * sr) / 2) + dh * sr / 2;
  ecartes.forEach((d, n) => { pile[d.i] = { x: zbX + zb / 2 + (R() - .5) * Math.max(0, zb - dw * sr) * .5, y: py0 + n * pas, r: (R() - .5) * 14, s: sr, o: 1 }; parti[d.i] = { x: pile[d.i].x + (R() - .5) * 20, y: H + dh * sr, r: pile[d.i].r + (R() - .5) * 20, s: sr, o: 0 }; });
  /* les sources en filigrane, en éventail dans la zone B (ordre des fiches) */
  const ss = sr * .86, sources = [], ordreSources = [];
  FICHES.forEach(f => f.docs.forEach(d => ordreSources.push(d)));
  const sy0 = haut + (mob ? 20 : 28) + dh * ss / 2, sy1 = bas - dh * ss / 2 - 2, spas = (sy1 - sy0) / (NG - 1);
  ordreSources.forEach((d, n) => { sources[d.i] = { x: zbX + zb / 2 + (n % 2 ? 1 : -1) * (mob ? 3 : 6), y: sy0 + n * spas, r: (R() - .5) * 4, s: ss, o: .26 }; });
  /* MB-11 : la fin. Les trois dalles en une rangée au bas de la table ; le téléphone debout dessus, au centre, aussi grand que la place
     le permet sans dépasser 40 % de la largeur de la table (60 % sur téléphone : en pratique, la hauteur de la table décide) ; le sceau
     aspire les fiches au centre du téléphone et grossit jusqu'à sa largeur (la même échelle), puis se pose en avatar de l'en-tête */
  const app = geometrieAppli(W, H, mob, pad);
  const aspire = FICHES.map(() => ({ x: app.cx, y: app.cy, r: 0, s: .05 * kf, o: 0 }));
  const ficheAvant = fiche.map(p => ({ ...p, s: .9 * kf, o: 0 }));
  const sourcesFin = sources.map(p => p && ({ ...p, o: 0 }));
  G = { W, H, mob, haut, pad, gap, bas, zb, zbX, zaW, dw, dh, px, py, sr, ss, fw, fh, lw, lh, kf, fiche, ficheAvant, aspire, app, rang, rang1, parcours, desordre, dehors, arrivee, pile, parti, sources, sourcesFin, spas };
  docs.forEach(d => { d.el.style.width = dw + 'px'; d.el.style.height = dh + 'px'; });
  FICHES.forEach(f => { f.el.style.width = lw + 'px'; f.el.style.height = lh + 'px'; });
  table.style.setProperty('--inv', (1 / sr).toFixed(4));
  cote.style.cssText = `left:${zbX}px;top:${haut - 6}px;width:${zb}px;height:${bas - haut + 6}px`;
  const cw = dw * sr + (mob ? 6 : 10), ch = dh * sr + (mob ? 6 : 10); cadre.style.width = cw + 'px'; cadre.style.height = ch + 'px'; G.cw = cw; G.ch = ch;
}

/* ---------- MB-11 : poser l'application (e = 5 : le téléphone posé sur ses dalles, l'écran rempli ; avant : rien) ---------- */
const TA = a => `translate(${a.tx.toFixed(1)}px,${a.ty.toFixed(1)}px)`;
const TS = (a, x, y, s) => `translate(${(x - a.D / 2).toFixed(1)}px,${(y - a.D / 2).toFixed(1)}px) scale(${s.toFixed(4)})`;
const TDAL = a => `translate(${a.dx.toFixed(1)}px,${a.dy.toFixed(1)}px)`;
const ECR_PARTS = () => [ecrBase, ecrQ, ecrR, ecrS];
function poserAppli(e) {
  const a = G.app, fin = e >= 5;
  tel.style.transform = TA(a) + (fin ? '' : ' scale(.9)'); tel.style.opacity = fin ? 1 : 0;
  sceau.style.transform = fin ? TS(a, a.avX, a.avY, a.avD / a.D) : TS(a, a.cx, a.cy, a.s0); sceau.style.opacity = 0;
  avatar.style.opacity = fin ? 1 : 0;
  ECR_PARTS().forEach(x => { x.style.opacity = fin ? 1 : 0; x.style.transform = ''; });
  dallesBox.style.transform = TDAL(a);
  dalles.forEach(x => { x.style.opacity = fin ? 1 : 0; x.style.transform = fin ? '' : 'translateY(14px)'; });
}
const APPLI_ELS = () => [tel, sceau, avatar, ...ECR_PARTS(), ...dalles];

/* ---------- poser un élément : par son centre, rotation, échelle, opacité ---------- */
const T = (p, w, h) => `translate(${(p.x - w / 2).toFixed(1)}px,${(p.y - h / 2).toFixed(1)}px) rotate(${p.r.toFixed(2)}deg) scale(${p.s.toFixed(4)})`;
const TD = p => T(p, G.dw, G.dh), TF = p => T(p, G.lw, G.lh);
function poserDoc(d, p, z) { d.pose = p; d.el.style.transform = TD(p); d.el.style.opacity = p.o; if (z !== undefined) d.el.style.zIndex = z; }
function poserFiche(f, p) { f.pose = p; f.el.style.transform = TF(p); f.el.style.opacity = p.o; }
const montrer = (el, o) => { if (el) el.style.opacity = o; };

/* ---------- le cartouche : il compte ce qui arrive ---------- */
const pl = (n, a, b) => n < 2 ? a : b;
function texteLegende(e, c) {
  /* T3 : avant le premier document, le cartouche ne compte rien (« 1. Collecte »), au lieu de « 0 document réuni » */
  if (e <= 0) return c.n ? `1. Collecte${NBSP}: ${c.n} ${pl(c.n, 'document réuni', 'documents réunis')}` : '1. Collecte';
  if (e === 1) return `2. Lecture${NBSP}: ${c.n} ${pl(c.n, 'document lu', 'documents lus')}, ${c.s} ${pl(c.s, 'scan reconnu', 'scans reconnus')}`;
  if (e === 2) return `3. Nettoyage${NBSP}: ${N} documents, ${c.x} ${pl(c.x, 'écarté', 'écartés')}, ${c.c} ${pl(c.c, 'contradiction levée', 'contradictions levées')}`;
  if (e === 3) return `4. Consolidation${NBSP}: ${NG} documents, ${c.f} ${pl(c.f, 'fiche', 'fiches')}`;
  if (e === 4) return `5. Sourçage${NBSP}: ${c.f} ${pl(c.f, 'fiche sourcée et datée', 'fiches sourcées et datées')}`;
  /* MB-11 : le cartouche du sixième temps */
  return `6. L'application${NBSP}: des milliers de fiches, une seule source`;
}
const FINAL = { n: N, s: NSCANS, x: NECARTES, c: NCONTRA, f: FICHES.length };
let compte = { ...FINAL };
const dire = e => { legende.textContent = texteLegende(e, compte); };

/* ---------------------------------------------------------------------
   L'état final de chaque temps (e = -1 : avant l'arrivée). Tout est posé
   en styles en ligne ; les animations partent de l'état d'avant et y
   arrivent (remplissage « backwards » : rien ne saute à la fin).
   --------------------------------------------------------------------- */
function appliquer(e) {
  table.dataset.etat = String(Math.max(0, e));
  docs.forEach(d => {
    let p, z = 2;
    if (e < 0) p = G.dehors[d.i];
    else if (e === 0) { p = G.desordre[d.i]; z = 2 + G.arrivee.indexOf(d.i); }
    else if (e === 1) p = G.rang1[d.i];
    else if (e === 2 && d.garde) p = G.rang[d.i];
    else if (e === 2) { p = G.pile[d.i]; z = 60 + G.parcours.indexOf(d); }
    else if (!d.garde) p = G.parti[d.i];
    else if (e <= 4) { p = G.sources[d.i]; z = 7; }
    else { p = G.sourcesFin[d.i]; z = 7; }
    poserDoc(d, p, z);
    d.el.classList.toggle('est-lu', e >= 1);
    montrer(d.tampon, e === 2 && !d.contredit ? 1 : 0);
    montrer(d.tampon2, e === 2 ? 1 : 0);
    if (d.rature) d.rature.style.transform = e === 2 ? 'none' : '';
    montrer(d.ok, e === 2 ? 1 : 0);
  });
  FICHES.forEach(f => {
    poserFiche(f, e >= 5 ? G.aspire[f.k] : e >= 3 ? G.fiche[f.k] : G.ficheAvant[f.k]);
    f.lignes.forEach(l => { l.style.transform = e >= 3 ? 'none' : ''; });
    f.ep.forEach((x, j) => montrer(x, e >= 3 && f.docs.length > j + 1 ? 1 : 0));
    montrer(f.puce, e >= 4 ? 1 : 0); f.puce.style.transform = '';
  });
  montrer(cadre, 0);
  montrer(cote, e >= 2 && e <= 4 ? 1 : 0); montrer(coteEcartes, e === 2 ? 1 : 0); montrer(coteSources, e === 3 || e === 4 ? 1 : 0);
  poserAppli(e);
  compte = { ...FINAL }; if (e < 0) compte.n = 0; dire(e);
}

/* ---------------------------------------------------------------------
   MB-1 : le séquenceur. « affiche » est le temps dont la fin est à
   l'écran ; « cible » le temps que le texte montre. Un temps se joue en
   entier avant le suivant. En remontant, l'état visé se pose en douceur.
   MB-10 bis (07/10/2026, après l'essai de Thibaut) : les six temps sont
   une ligne de temps dont la vitesse suit le lecteur, sans jamais sauter
   un temps : vitesse normale quand le texte à l'écran est celui du temps
   qui se joue (ou que le lecteur ne défile pas), 2,5 fois plus vite quand
   il a un temps d'avance, 4 fois au-delà ; la vitesse change en cours de
   temps (playbackRate des animations et de l'horloge du temps), sans
   saut. Les échéances d'un temps (le cartouche qui compte) suivent son
   horloge, pas la montre.
   --------------------------------------------------------------------- */
let affiche = -2, cible = -1, joue = null, V = 1, anims = [], echeances = [], horloge = null, ticId = 0;
/* MB-10 bis : selon l'avance du lecteur, en temps (0, 1, 2 et plus), 4 fois au plus pour que l'on voie encore ce qui se passe ;
   MB-10 ter (07/10/2026, réglage final de la session) : quand le lecteur attend déjà à la butée du bas, les temps 1 à 5 qui restent
   passent à 4 fois et le sixième à 2 fois au plus (l'aspiration et la transformation restent lisibles) ; lu à son rythme, le sixième
   garde la vitesse normale. La butée se lève 0,5 s après le téléphone et les dalles posés */
const VITESSES = [1, 2.5, 4];
const AU_BOUT = 4, AU_BOUT_6 = 2;
const vitesseDe = (e, avance) => {
  const bout = typeof enButee === 'function' && enButee();
  if (e >= 5) return bout ? AU_BOUT_6 : 1;
  return bout ? AU_BOUT : VITESSES[Math.max(0, Math.min(VITESSES.length - 1, avance))];
};
const animer = (el, frames, t, dur, easing = DOUX) => { if (!el) return null; const a = el.animate(frames, { delay: t, duration: Math.max(1, dur), easing, fill: 'backwards' }); a.playbackRate = V; anims.push(a); return a; };
const plusTard = (fn, t) => { echeances.push([t, fn]); };
/* MB-10 bis : changer de vitesse en cours de temps (updatePlaybackRate garde la position de chaque animation, sans à-coup) */
function regler(r) {
  if (r === V) return;
  V = r;
  [...anims, horloge].forEach(a => { if (!a) return; if (a.updatePlaybackRate) a.updatePlaybackRate(r); else a.playbackRate = r; });
}
/* MB-10 bis : l'horloge du temps en cours (une animation sans effet, à la même vitesse que les autres) déclenche ses échéances et sa fin */
function tic() {
  ticId = 0; if (!joue || !horloge) return;
  const t = horloge.currentTime || 0;
  if (echeances.length) { const dues = echeances.filter(x => x[0] <= t); if (dues.length) { echeances = echeances.filter(x => x[0] > t); dues.forEach(x => x[1]()); } }
  if (t >= joue.duree - .5 || horloge.playState === 'finished') { finir(); return; }
  ticId = requestAnimationFrame(tic);
}
function finir() {
  const e = joue.e;
  echeances.forEach(x => x[1]()); echeances = []; if (horloge) { horloge.cancel(); horloge = null; }
  joue = null; affiche = e; dire(e); finRetenue(e); avancer();
}
function bouger(d, de, vers, t, dur, easing = DEPL, opa) {
  animer(d.el, [{ transform: TD(de) }, { transform: TD(vers) }], t, dur, easing);
  if (de.o !== vers.o) animer(d.el, [{ opacity: de.o }, { opacity: vers.o }], t, opa || dur * .45, 'linear');
}
function arreter() { anims.forEach(a => a.cancel()); anims = []; echeances = []; if (horloge) { horloge.cancel(); horloge = null; } cancelAnimationFrame(ticId); ticId = 0; }

const TEMPS = [jouerCollecte, jouerLecture, jouerNettoyage, jouerConsolidation, jouerSourcage, jouerAppli];   /* MB-11 : le sixième temps */
function jouer(e, vitesse) {
  arreter(); V = vitesse;
  const de = { docs: docs.map(d => d.pose), fiches: FICHES.map(f => f.pose) };
  [...docs.map(d => d.el), ...FICHES.map(f => f.el), ...APPLI_ELS()].forEach(el => { el.style.transition = 'none'; });
  appliquer(e);
  const duree = TEMPS[e](de);
  /* MB-10 bis : l'horloge du temps, à la vitesse des animations */
  horloge = new Animation(new KeyframeEffect(null, null, { duration: duree }), document.timeline); horloge.playbackRate = V; horloge.play();
  joue = { e, debut: performance.now(), duree };
  ticId = requestAnimationFrame(tic);
}
function sauter(e, doux) {
  /* l'état visé se pose depuis ce qui est à l'écran (une animation interrompue ne saute pas) */
  const els = [...docs.map(d => d.el), ...FICHES.map(f => f.el), ...APPLI_ELS()];
  if (doux && anims.length) els.forEach(el => { const cs = getComputedStyle(el); el.style.transform = cs.transform; el.style.opacity = cs.opacity; });
  arreter(); joue = null;
  if (doux) { void table.offsetWidth; els.forEach(el => { el.style.transition = `transform .55s ${DOUX}, opacity .4s ${DOUX}`; }); }
  else els.forEach(el => { el.style.transition = 'none'; });
  appliquer(e); affiche = e;
}
/* MB-10 bis : jamais de saut vers l'avant ; le temps suivant se joue à la vitesse que donne l'avance du lecteur, qui se règle en cours de route */
function avancer() {
  if (statique) return;
  if (joue) { if (cible < joue.e) { sauter(cible, true); avancer(); return; } regler(vitesseDe(joue.e, cible - joue.e)); return; }
  if (cible > affiche) jouer(affiche + 1, vitesseDe(affiche + 1, cible - affiche - 1));
  else if (cible < affiche && cible >= 0) sauter(cible, true);
}

/* ---------- 1. Collecte : trois vagues, en désordre ---------- */
function jouerCollecte(de) {
  compte.n = 0; dire(0);
  const parVague = Math.ceil(N / 3);
  let fin = 0;
  G.arrivee.forEach((i, j) => {
    const d = docs[i], t = Math.floor(j / parVague) * 760 + (j % parVague) * 48;
    bouger(d, de.docs[i], d.pose, t, 720, ENTREE, 260);
    plusTard(() => { compte.n++; dire(0); }, t + 480);
    fin = Math.max(fin, t + 720);
  });
  return fin;
}

/* ---------- 2. Lecture : les scans balayés ligne à ligne, les documents redressés et rangés ---------- */
function jouerLecture(de) {
  compte.n = 0; compte.s = 0; dire(1);
  let fin = 0;
  G.parcours.forEach((d, j) => {
    const t = j * 42;
    bouger(d, de.docs[d.i], d.pose, t, 640, DEPL);
    plusTard(() => { compte.n++; dire(1); }, t + 640);
    fin = Math.max(fin, t + 640);
    if (d.retourne) {
      animer(d.verso, [{ transform: 'perspective(500px) rotateY(0deg)' }, { transform: 'perspective(500px) rotateY(180deg)' }], t + 120, 460, DEPL);
      animer(d.recto, [{ transform: 'perspective(500px) rotateY(-180deg)' }, { transform: 'perspective(500px) rotateY(0deg)' }], t + 120, 460, DEPL);
      animer(d.verso, [{ opacity: 1 }, { opacity: 0 }], t + 120, 230, 'steps(1, end)');
      animer(d.recto, [{ opacity: 0 }, { opacity: 1 }], t + 120, 230, 'steps(1, end)');
    }
    if (d.scan) {
      /* le rideau de grain descend ligne à ligne (sept pas), le trait de lecture à son bord haut ; un seul élément animé par scan */
      const t0 = t + 240, pas = 120, n = 7;
      const frames = []; for (let k = 0; k <= n; k++) frames.push({ transform: `translateY(${(k * 100 / n).toFixed(2)}%)`, offset: k / n, easing: 'steps(1, end)' });
      animer(d.grain, frames, t0, pas * n, 'linear');
      animer(d.balai, [{ opacity: 0 }, { opacity: 1, offset: .01 }, { opacity: 1, offset: .99 }, { opacity: 0 }], t0, pas * n, 'linear');
      animer(d.tScan, [{ opacity: .9 }, { opacity: 0 }], t0, 200, 'linear');
      animer(d.corps, [{ transform: 'rotate(-2.4deg)' }, { transform: 'none' }], t0 + pas * n - 80, 260, DOUX);
      plusTard(() => { compte.s++; dire(1); }, t0 + pas * n);
      fin = Math.max(fin, t0 + pas * n + 180);
    }
  });
  return fin;
}

/* ---------- 3. Nettoyage : un par un devant le cadre de contrôle ; la pile de côté grossit ---------- */
/* un écarté : il glisse avec son rang (380 ms), attend le cadre, puis part sur la pile (480 ms) ; une seule animation de transform */
function glisserPuisPartir(d, de, t0, t1) {
  const fin = t1 + 440, r = G.rang[d.i];
  animer(d.el, [{ transform: TD(de), easing: DEPL }, { transform: TD(r), offset: (t0 + 320) / fin, easing: 'linear' }, { transform: TD(r), offset: t1 / fin, easing: DEPL }, { transform: TD(d.pose) }], 0, fin, 'linear');
}
function jouerNettoyage(de) {
  compte.x = 0; compte.c = 0; dire(2);
  const C = p => `translate(${(p.x - G.cw / 2).toFixed(1)}px,${(p.y - G.ch / 2).toFixed(1)}px)`;
  const GLISSE = 300;
  G.parcours.forEach((d, j) => { if (d.garde) bouger(d, de.docs[d.i], d.pose, (j % 7) * 10, 320, DEPL); });
  const pts = []; let t = GLISSE, prec = null;
  G.parcours.forEach(d => {
    const p = G.rang[d.i];
    if (prec) t += Math.abs(p.y - prec.y) > 1 ? 50 : 20;
    pts.push([t, p]);
    if (d.sort === 'doublon' || d.sort === 'perime') {
      animer(d.tampon, [{ opacity: 0, transform: `translate(-50%,-50%) scale(${(1.7 / G.sr).toFixed(3)}) rotate(-15deg)` }, { opacity: 1, transform: `translate(-50%,-50%) scale(${(1 / G.sr).toFixed(3)}) rotate(-9deg)` }], t + 10, 200, ENTREE);
      plusTard(() => { compte.x++; dire(2); }, t + 60);
      glisserPuisPartir(d, de.docs[d.i], (G.parcours.indexOf(d) % 7) * 10, t + 120);
      t += 80;
    } else if (d.sort === 'contra') {
      const q = d.partenaire, a = G.rang[d.i], b = G.rang[q.i], L = Math.hypot(b.x - a.x, b.y - a.y), ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      const tr = `translate(${a.x.toFixed(1)}px,${(a.y - .75).toFixed(1)}px) rotate(${ang.toFixed(2)}deg)`;
      const fort = `translate(-50%,-50%) scale(${(1.7 / G.sr).toFixed(3)}) rotate(-15deg)`, pose = `translate(-50%,-50%) scale(${(1 / G.sr).toFixed(3)}) rotate(-9deg)`;
      animer(d.tampon, [{ opacity: 0, transform: fort }, { opacity: 1, transform: pose }], t + 10, 200, ENTREE);
      /* une seule animation par propriété et par élément : « À vérifier » frappe, tient, puis s'efface */
      animer(q.tampon, [{ opacity: 0, transform: fort, easing: ENTREE }, { opacity: 1, transform: pose, offset: .34 }, { opacity: 1, transform: pose, offset: .66 }, { opacity: 0, transform: pose }], t + 10, 590, 'linear');
      d.fil.style.transform = `${tr} scaleX(${L.toFixed(1)})`;
      animer(d.fil, [{ opacity: 1, transform: `${tr} scaleX(0)` }, { opacity: 1, transform: `${tr} scaleX(${L.toFixed(1)})`, offset: .4 }, { opacity: 1, transform: `${tr} scaleX(${L.toFixed(1)})`, offset: .7 }, { opacity: 0, transform: `${tr} scaleX(${L.toFixed(1)})` }], t + 60, 520, DOUX);
      animer(d.rature, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], t + 210, 150, DOUX);
      glisserPuisPartir(d, de.docs[d.i], (G.parcours.indexOf(d) % 7) * 10, t + 350);
      /* le document contredit garde sa place : « À vérifier » devient « Vérifié » */
      animer(q.tampon2, [{ opacity: 0, transform: `translate(-50%,-50%) scale(${(1.4 / G.sr).toFixed(3)}) rotate(-12deg)` }, { opacity: 1, transform: `translate(-50%,-50%) scale(${(1 / G.sr).toFixed(3)}) rotate(-9deg)` }], t + 400, 220, ENTREE);
      plusTard(() => { compte.c++; dire(2); }, t + 420);
      t += 250;
    } else t += 6;
    if (d.ok) { d.ok.style.opacity = 0; const ok = d.ok; plusTard(() => { ok.style.opacity = 1; }, t); }
    pts.push([t, p]);
    prec = p;
  });
  const fin = t + 100, total = fin;
  const frames = pts.map(([tt, p]) => ({ transform: C(p), offset: tt / total }));
  frames.unshift({ transform: C(pts[0][1]), offset: 0 }); frames.push({ transform: C(pts[pts.length - 1][1]), offset: 1 });
  cadre.style.transform = C(pts[pts.length - 1][1]);
  animer(cadre, frames, 0, total, 'linear');
  animer(cadre, [{ opacity: 0 }, { opacity: 1, offset: 140 / total }, { opacity: 1, offset: (total - 140) / total }, { opacity: 0 }], 0, total, 'linear');
  animer(cote, [{ opacity: 0 }, { opacity: 1 }], 120, 300, 'linear');
  animer(coteEcartes, [{ opacity: 0 }, { opacity: 1 }], 220, 300, 'linear');
  return fin + 440;
}

/* ---------- 4. Consolidation : plusieurs documents se fondent dans une même fiche, qui s'épaissit ---------- */
function jouerConsolidation(de) {
  compte.f = 0; dire(3);
  docs.forEach(d => { if (!d.garde) bouger(d, de.docs[d.i], d.pose, (G.pile[d.i].y - G.haut) * .4, 480, DEPL, 360); });
  animer(coteEcartes, [{ opacity: 1 }, { opacity: 0 }], 0, 200, 'linear');
  animer(coteSources, [{ opacity: 0 }, { opacity: 1 }], 320, 300, 'linear');
  docs.forEach(d => { if (d.contredit) animer(d.tampon2, [{ opacity: 1 }, { opacity: 0 }], 0, 220, 'linear'); });
  let fin = 0;
  FICHES.forEach(f => {
    const tk = 260 + f.k * 128;
    animer(f.el, [{ transform: TF(G.ficheAvant[f.k]), opacity: 0 }, { transform: TF(f.pose), opacity: 1 }], tk, 300, ENTREE);
    f.docs.forEach((d, j) => {
      const ts = tk + 100 + j * 70, a = de.docs[d.i], m = { ...G.fiche[f.k], s: G.sr * .8, r: 0, o: 1 }, b = d.pose;
      animer(d.el, [{ transform: TD(a), easing: DEPL }, { transform: TD(m), offset: .5, easing: 'linear' }, { transform: TD(m), offset: .56, easing: DEPL }, { transform: TD(b) }], ts, 900, 'linear');
      animer(d.el, [{ opacity: 1 }, { opacity: 1, offset: .56 }, { opacity: b.o }], ts, 900, 'linear');
      const ta = ts + 450;
      animer(f.lignes[j], [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], ta, 240, DOUX);
      if (j) animer(f.ep[j - 1], [{ opacity: 0 }, { opacity: 1 }], ta, 200, 'linear');
      if (j === f.docs.length - 1) plusTard(() => { compte.f++; dire(3); }, ta + 60);
      fin = Math.max(fin, ts + 900);
    });
  });
  return fin;
}

/* ---------- 5. Sourçage : la puce datée, et un fil vers le document d'origine resté en filigrane ---------- */
function jouerSourcage() {
  compte.f = 0; dire(4);
  let fin = 0;
  FICHES.forEach(f => {
    const tk = f.k * 150, p = G.fiche[f.k], q = f.source0.pose;
    animer(f.puce, [{ opacity: 0, transform: 'scale(.82)' }, { opacity: 1, transform: 'none' }], tk, 260, ENTREE);
    const ax = p.x + G.fw / 2 - 3, ay = p.y + G.fh * .3, bx = q.x - G.dw * q.s / 2 + 2, by = q.y - G.dh * q.s / 2 + Math.min(G.spas, G.dh * q.s) / 2;
    const L = Math.hypot(bx - ax, by - ay), ang = Math.atan2(by - ay, bx - ax) * 180 / Math.PI, tr = `translate(${ax.toFixed(1)}px,${(ay - .75).toFixed(1)}px) rotate(${ang.toFixed(2)}deg)`;
    f.fil.style.transform = `${tr} scaleX(${L.toFixed(1)})`;
    animer(f.fil, [{ opacity: 1, transform: `${tr} scaleX(0)` }, { opacity: 1, transform: `${tr} scaleX(${L.toFixed(1)})`, offset: .32 }, { opacity: 1, transform: `${tr} scaleX(${L.toFixed(1)})`, offset: .68 }, { opacity: 0, transform: `${tr} scaleX(${L.toFixed(1)})` }], tk + 60, 760, DOUX);
    animer(f.source0.el, [{ opacity: q.o }, { opacity: .95, offset: .3 }, { opacity: .95, offset: .7 }, { opacity: q.o }], tk + 60, 760, 'linear');
    plusTard(() => { compte.f++; dire(4); }, tk + 200);
    fin = Math.max(fin, tk + 820);
  });
  return fin;
}

/* ---------- 6. L'application (MB-11) : le sceau aspire les fiches et grossit, puis devient l'application posée sur son socle ----------
   Les sources s'effacent ; le sceau paraît au centre du téléphone à venir ; les fiches, quatre une à une puis les huit autres en grappe,
   glissent vers lui en accélérant, rétrécissent en s'étirant vers le centre et disparaissent en lui (aucune particule) ; il grossit à
   chaque fiche absorbée jusqu'à la largeur du téléphone ; le téléphone paraît à sa place, le sceau se pose en avatar de l'en-tête, la
   conversation s'écrit, les dalles se posent dessous. Seules transform et opacity bougent ; 3,7 s en tout à vitesse normale. */
const TSTR = (x, y, ang, a, b) => `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${ang.toFixed(2)}deg) scale(${a.toFixed(4)},${b.toFixed(4)}) rotate(${(-ang).toFixed(2)}deg)`;
const accel = t => t * t * (1.35 - .35 * t);   /* l'aspiration : lente au départ, de plus en plus vite vers le centre */
function jouerAppli(de) {
  const a = G.app, kf = G.kf;
  GARDES.forEach((d, n) => animer(d.el, [{ opacity: de.docs[d.i].o }, { opacity: 0 }], n * 8, 360, 'linear'));
  animer(cote, [{ opacity: 1 }, { opacity: 0 }], 0, 300, 'linear');
  animer(coteSources, [{ opacity: 1 }, { opacity: 0 }], 0, 250, 'linear');
  /* l'ordre : les plus proches du sceau d'abord ; quatre une à une, puis la grappe */
  const ordre = FICHES.slice().sort((f, g) => Math.hypot(G.fiche[f.k].x - a.cx, G.fiche[f.k].y - a.cy) - Math.hypot(G.fiche[g.k].x - a.cx, G.fiche[g.k].y - a.cy));
  const UNE = [380, 640, 870, 1070], GRAPPE = 1250, ARRIVEES = [];
  ordre.forEach((f, j) => {
    const t0 = j < 4 ? UNE[j] : GRAPPE + (j - 4) * 45, dur = j < 4 ? 620 : 560;
    const p0 = de.fiches[f.k] || G.fiche[f.k], s0 = p0.s, dx = a.cx - p0.x, dy = a.cy - p0.y, ang = Math.atan2(dy, dx) * 180 / Math.PI;
    /* le chemin échantillonné (huit pas) : la position suit accel, l'échelle se réduit, l'étirement monte vers le centre */
    const frames = [];
    for (let k = 0; k <= 8; k++) {
      const u = k / 8, v = accel(u), sc = s0 * (1 - .95 * Math.pow(u, 1.6)), et = 1 + .32 * Math.sin(Math.PI * Math.min(1, u * 1.15) / 2) * u;
      frames.push({ transform: TSTR(p0.x + dx * v - G.lw / 2, p0.y + dy * v - G.lh / 2, ang, sc * et, sc / Math.sqrt(et)), offset: u });
    }
    animer(f.el, frames, t0, dur, 'linear');
    animer(f.el, [{ opacity: 1 }, { opacity: 1, offset: .62 }, { opacity: 0 }], t0, dur, 'linear');
    ARRIVEES.push(t0 + dur * .92);
  });
  ARRIVEES.sort((x, y) => x - y);
  /* le sceau : paraît (0 à 380 ms), grossit d'un cran à chaque fiche absorbée (une avalée de 220 ms), puis se pose en avatar de l'en-tête */
  /* t1 : le sceau a sa pleine taille ; il la garde un instant, seul, puis vole vers l'en-tête (de tV à tFin) */
  const t1 = ARRIVEES[ARRIVEES.length - 1] + 140, tV = t1 + 160, VOL = 680, tFin = tV + VOL;
  const taille = t => {
    let n = 0; ARRIVEES.forEach(ta => { const k = Math.min(1, Math.max(0, (t - ta) / 220)); n += 1 - Math.pow(1 - k, 3); });
    const apparition = Math.min(1, t / 380), ea = 1 - Math.pow(1 - apparition, 3);
    return a.s0 * (.55 + .45 * ea) + (1 - a.s0) * n / FICHES.length;
  };
  const sf = [];
  for (let t = 0; t < t1; t += 40) sf.push({ t, transform: TS(a, a.cx, a.cy, taille(t)) });
  sf.push({ t: t1, transform: TS(a, a.cx, a.cy, taille(t1)) }, { t: tV, transform: TS(a, a.cx, a.cy, taille(t1)) });
  for (let k = 1; k <= 8; k++) { const u = k / 8, v = 1 - Math.pow(1 - u, 3); sf.push({ t: tV + VOL * u, transform: TS(a, a.cx + (a.avX - a.cx) * v, a.cy + (a.avY - a.cy) * v, taille(t1) + (a.avD / a.D - taille(t1)) * v) }); }
  animer(sceau, sf.map(x => ({ transform: x.transform, offset: x.t / tFin })), 0, tFin, 'linear');
  animer(sceau, [{ opacity: 0 }, { opacity: 1, offset: 300 / tFin }, { opacity: 1, offset: (tV + VOL * .78) / tFin }, { opacity: 0 }], 0, tFin, 'linear');
  /* le téléphone paraît à la place du sceau, à la même échelle, pendant que le sceau se pose en avatar de l'en-tête */
  const tTel = tV - 40;
  animer(tel, [{ transform: TA(a) + ' scale(.9)' }, { transform: TA(a) + ' scale(1)' }], tTel, 760, DOUX);
  animer(tel, [{ opacity: 0 }, { opacity: 1 }], tTel, 460, 'linear');
  animer(avatar, [{ opacity: 0 }, { opacity: 1 }], tV + VOL * .62, VOL * .38, 'linear');
  /* la conversation : la ligne de la base, la question, la réponse, sa source */
  const tC = tV + 260;
  animer(ecrBase, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], tC, 360, ENTREE);
  animer(ecrQ, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], tC + 220, 380, ENTREE);
  animer(ecrR, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], tC + 470, 400, ENTREE);
  animer(ecrS, [{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }], tC + 740, 340, ENTREE);
  /* les dalles du socle se posent sous le téléphone */
  dalles.forEach((x, k) => animer(x, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], tTel + 380 + k * 90, 500, ENTREE));
  return Math.max(tC + 1080, tTel + 380 + 2 * 90 + 500);
}

/* ---------------------------------------------------------------------
   Le départ : géométrie, état de départ, puis le défilement mène le récit
   --------------------------------------------------------------------- */
calculer();
const $temps = $$('[data-temps]');
const marquer = e => $temps.forEach(t => t.classList.toggle('actif', +t.dataset.temps === Math.max(0, e)));
let viser = null, statique = false;
if (reduitPage() || !('IntersectionObserver' in window)) { sauter(5, false); $temps.forEach(t => t.classList.add('actif')); }
else {
  sauter(-1, false);
  viser = e => { if (statique || e === cible) return; cible = e; marquer(e); avancer(); };
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); if (!statique && cible < 0) { cible = 0; marquer(0); avancer(); } } }, { threshold: .3 });
  io.observe(table);
  /* MB-1 : sur ordinateur, un temps est actif quand il passe au milieu de l'écran ; sur téléphone, l'illustration est collée en haut :
     la bande descend juste sous elle, pour que le dessin change quand le titre du temps paraît, pas pendant qu'il est caché */
  const bande = matchMedia('(max-width: 900px)').matches ? '-58% 0px -38% 0px' : '-46% 0px -46% 0px';
  const io2 = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting && viser) viser(+x.target.dataset.temps); }), { rootMargin: bande });
  $temps.forEach(t => io2.observe(t));
}
addEventListener('resize', () => { clearTimeout(calculer._t); calculer._t = setTimeout(() => {
  if (Math.abs(table.clientWidth - G.W) < 1 && Math.abs(table.clientHeight - G.H) < 1) return;
  const e = statique ? 5 : joue ? joue.e : affiche; calculer(); sauter(e, false); avancer();
}, 150); });
/* ---------------------------------------------------------------------
   MB-10 (07/10/2026), corrigé par MB-10 bis après l'essai de Thibaut : plus de butée à chaque temps. La page défile librement dans la
   section, l'illustration reste collée, la ligne de temps rattrape le lecteur en accéléré (séquenceur, plus haut). Une seule butée, au bas
   de la section : tant que la ligne de temps n'est pas arrivée au bout (le sceau, l'application, les dalles), la fin du document est posée
   là, juste après le texte du sixième temps (le contenu de <main> est rogné au-delà, overflow-y: clip et max-height, sans rien changer à
   la mise en page : rien de rogné n'est jamais à l'écran) ; le navigateur s'y arrête lui-même, comme au bas d'une page, quel que soit le
   geste (doigt, élan, molette, pavé tactile, clavier, barre de défilement), sans saut ni rebond (overscroll-behavior: none pendant la
   retenue), puis elle se lève dès la fin du sixième temps, pour la page. Position : sur ordinateur, tant que l'illustration reste collée ;
   sur téléphone, le texte du sixième temps entier sous l'illustration. Jamais en remontant (la butée ne borne que le bas), jamais sur une
   section déjà jouée ou déjà dépassée (arrivée par une ancre, retour arrière, lien), jamais en mouvement réduit ni avec ?etat ; Échap,
   Fin (et Cmd ou Ctrl + flèche bas) et le focus posé plus bas la lèvent ; un lien la suspend le temps de son défilement ; l'impression la
   lève.
   --------------------------------------------------------------------- */
/* intégration : la butée rogne div.feuille, le conteneur qui suit le hero (le pied de page, hors de <main>, attend dessous : base.css) */
const feuille = $('.feuille'), recit = $('[data-recit]'), scene = $('.recit__scene');
const R = { actif: false, desarme: false, L: 0, suspendu: false, attente: 0, bout: 0, leve: 0, sonde: null };
const MOBILE = matchMedia('(max-width: 900px)').matches;   /* le même test que la bande des temps (MB-1) */
const BANDE = MOBILE ? .62 : .54;                           /* le bas de cette bande, en part de la hauteur de la vue */
const docY = el => el.getBoundingClientRect().top + scrollY;
/* la plus petite hauteur de vue possible (sur iPhone, barres d'outils déployées) : la butée tombe au plus tôt là où elle doit, jamais après */
function hauteurVue() {
  if (!R.sonde) { R.sonde = document.createElement('i'); R.sonde.setAttribute('aria-hidden', 'true'); R.sonde.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none'; document.body.appendChild(R.sonde); }
  return Math.min(innerHeight, document.documentElement.clientHeight, R.sonde.offsetHeight || 1e9);
}
/* la position de lecture du temps k (repère du document) ; la butée est celle du sixième (k = 5) */
function limite(k) {
  const vh = innerHeight, cs = getComputedStyle(scene);
  let fin;
  if (k < 5) fin = docY($temps[k + 1]) - BANDE * vh - 2;
  else fin = docY(recit) + recit.offsetHeight - scene.offsetHeight - (parseFloat(cs.marginBottom) || 0) - (parseFloat(cs.top) || 0) - 2;   /* l'illustration se décolle au-delà */
  if (MOBILE) fin = Math.min(fin, docY($('.temps__n', $temps[k])) - ((parseFloat(cs.top) || 0) + scene.offsetHeight + 6));
  /* jamais avant que le temps k ait pu commencer (sa bande ; pour le premier, la table vue à 30 %) */
  const debut = k === 0 ? docY(recit) - vh + .3 * table.offsetHeight : docY($temps[k]) - BANDE * vh;
  return Math.max(fin, debut + 24);
}
function retenir() {
  if (!R.actif || R.suspendu) return;
  if (affiche >= 5) { lacher(true); return; }                                   /* la section est jouée */
  const L = limite(5);
  if (scrollY > L + 2) { lacher(true); return; }             /* le lecteur est déjà plus bas (ancre, retour arrière, lien) */
  R.L = L;
  feuille.style.maxHeight = Math.ceil(L + hauteurVue() - docY(feuille)) + 'px'; feuille.classList.add('retenu'); document.documentElement.classList.add('retenu');
}
function lacher(pourLaPage) {
  feuille.classList.remove('retenu'); feuille.style.maxHeight = ''; document.documentElement.classList.remove('retenu');
  if (pourLaPage) { R.desarme = true; R.actif = false; }
}
/* MB-10 ter : le lecteur attend-il à la butée du bas ? */
function enButee() { return R.actif && feuille.classList.contains('retenu') && scrollY >= R.L - 2; }
/* MB-10 ter : la fin du sixième temps (le téléphone et les dalles posés) lève la butée pour la page 0,5 s plus tard */
function finRetenue(e) { if (e >= 5) { clearTimeout(R.leve); R.leve = setTimeout(retenir, 500); } }
/* filet : à la butée sans que rien ne joue (un observateur en retard), la ligne de temps est relancée ; sans suite après 0,8 s, la butée se lève */
addEventListener('scroll', () => {
  if (joue) regler(vitesseDe(joue.e, cible - joue.e));   /* MB-10 ter : arrivé à la butée (ou reparti), la vitesse suit */
  if (R.suspendu) { clearTimeout(R.attente); R.attente = setTimeout(reprendre, 260); return; }
  if (!R.actif || !feuille.classList.contains('retenu') || scrollY < R.L - 1 || joue || affiche >= 5) return;
  if (cible < 5 && viser) viser(5); else avancer();
  clearTimeout(R.bout); R.bout = setTimeout(() => { if (R.actif && !R.suspendu && scrollY >= R.L - 2 && !joue && affiche < 5) lacher(true); }, 800);
}, { passive: true });
/* un lien suspend la butée le temps de son défilement (le navigateur va où il doit), puis elle se repose selon la position */
function reprendre() { R.suspendu = false; retenir(); }
document.addEventListener('click', ev => {
  const a = ev.target.closest && ev.target.closest('a[href]'); if (!a || !R.actif) return;
  lacher(false); R.suspendu = true; clearTimeout(R.attente); R.attente = setTimeout(reprendre, 450);
}, true);
addEventListener('keydown', ev => {
  if (!R.actif) return;
  if (ev.key === 'Escape' || ev.key === 'End' || ((ev.metaKey || ev.ctrlKey) && ev.key === 'ArrowDown')) lacher(true);
});
/* le focus posé plus bas que la butée (tabulation) : tout est lâché, le navigateur doit pouvoir y aller */
document.addEventListener('focusin', ev => { if (R.actif && feuille.classList.contains('retenu') && docY(ev.target) + 4 > R.L + innerHeight - 8) lacher(true); });
addEventListener('beforeprint', () => lacher(false));
addEventListener('afterprint', retenir);
/* une mise en page qui change (largeur, polices, image) : la butée se recalcule ; les variations de hauteur de la barre d'adresse sont ignorées */
let vueRetenue = [innerWidth, innerHeight];
addEventListener('resize', () => { if (innerWidth !== vueRetenue[0] || Math.abs(innerHeight - vueRetenue[1]) > 150) { vueRetenue = [innerWidth, innerHeight]; retenir(); } });
if ('ResizeObserver' in window) new ResizeObserver(() => retenir()).observe(recit);
/* armée après le chargement, une fois la position remise par le navigateur (retour arrière, rechargement, ancre : Chrome la remet
   en plusieurs fois jusqu'à 0,3 s après le chargement) : quand le défilement est calme depuis 250 ms (1,5 s au plus), ou tout de suite au
   premier geste du lecteur ; sauf mouvement réduit */
if (!reduitPage() && 'IntersectionObserver' in window && window.CSS && CSS.supports('overflow-y', 'clip')) {
  let calme = 0, limiteArme = 0;
  const GESTES = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
  const armer = () => { if (R.actif || R.desarme) return; clearTimeout(calme); clearTimeout(limiteArme); removeEventListener('scroll', attendre); GESTES.forEach(g => removeEventListener(g, armer, true)); R.actif = true; retenir(); };
  const attendre = () => { clearTimeout(calme); calme = setTimeout(armer, 250); };
  const charge = () => { addEventListener('scroll', attendre, { passive: true }); GESTES.forEach(g => addEventListener(g, armer, { capture: true, passive: true })); attendre(); limiteArme = setTimeout(armer, 1500); };
  if (document.readyState === 'complete') charge(); else addEventListener('load', charge, { once: true });
}

/* intégration : le visiteur arrête les animations en cours de visite (bouton de la page, marianne.js) : la section passe aussitôt
   à son état final, les six temps lisibles, la butée levée */
document.addEventListener('marianne:statique', () => {
  statique = true; arreter(); joue = null; cible = 5;
  sauter(5, false); $temps.forEach(t => t.classList.add('actif'));
  lacher(true);
  ZONES.forEach(z => { const r = $(z); if (r) $$('[data-mots], [data-entree]', r).forEach(el => el.classList.add('vu')); });
});
