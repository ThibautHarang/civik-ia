/* =====================================================================
   « Combien coûte Marianne pour votre commune ? » (14/10/2026) : le
   calculateur de prix public de Marianne, page des prix
   (chatbot-mairie-prix.html, bloc [data-prix-marianne]), dans la main
   du film : gravure à la plume, encre #60637B, trait qui se dessine.
   Scène 1 : un panneau d'entrée de commune, la plaque vide est le
   champ ; les suggestions sont des panneaux fléchés. Scène 2 : la
   population s'écrit à la main, le prix s'abat en tampon de mairie
   (passe 3 : le sceau rond remplace la borne, le tampon rectangulaire
   la grande borne de la mise en service).
   Scène 3 : deux petites plaques d'options et la question du site,
   accrochées au poteau. Scène 4 : le chemin des six étapes de la mise
   en service, et la borne de son montant. Scène 5 : la feuille
   d'estimation, et deux sorties : « Demander un devis » (la feuille
   devient la lettre de pages.js et lettre.js, envoi Formspree)
   et « Copier le lien de l’estimation » (un lien qui rouvre le même état ; libellé du 19/10/2026, partie 5).
   Données : ../donnees/communes.json (34 969 communes, population
   municipale INSEE servie par geo.api.gouv.fr), chargé au premier geste
   dans le champ, ou tout de suite si l'adresse porte ?commune=.
   Sécurité : aucune valeur venue de l'adresse, de la saisie ou du
   fichier n'entre par innerHTML ; textContent et setAttribute partout ;
   la commune se retrouve par son code INSEE, le nom vient du fichier.
   Aucun service extérieur, aucun cookie, rien dans le stockage du
   navigateur. Sous prefers-reduced-motion, tout apparaît posé.
   ===================================================================== */

/* la source des populations, mot pour mot comme l'en-tête « source » de commun/donnees/communes.json (Thibaut, 16 h 40) */
export const SOURCE_POPULATION = '* Population municipale, populations légales INSEE 2023 en vigueur au 1er janvier 2026, relevées le 14 octobre 2026 sur geo.api.gouv.fr.';
/* ---------- la grille : chaque arbitrage de Thibaut est une ligne ici ---------- */
export const GRILLE = {
  /* les trois lignes, une même fonction (prixParPalier) ; forme 'continue' : minimum jusqu'à barre - 1, puis minimum plus
     les centimes par habitant au-dessus de la barre, plafond s'il existe ; forme 'totale' : le plus grand du minimum et des
     centimes par habitant sur toute la population */
  abonnement: {
    minimum: 69,              // euros HT par mois jusqu'à 4 999 habitants (Thibaut, 14/10/2026, 16 h 25)
    barre: 5000,              // population (palier) à partir de laquelle le centime par habitant s'ajoute
    centimesParHabitant: 1,   // centimes par habitant et par mois, au-dessus de la barre
    plafond: 500,             // euros HT par mois, au plus (atteint à 48 100 habitants)
    forme: 'continue'         // 69 € puis un centime par habitant au-delà de 5 000
  },
  miseEnService: {
    minimum: 999,             // euros HT, une seule fois, plancher sous 5 000 habitants
    barre: 5000,              // population (palier) à partir de laquelle les 30 centimes par habitant s'ajoutent
    centimesParHabitant: 30,  // centimes par habitant au-dessus de 5 000 (Thibaut, 14/10/2026, 16 h 50)
    plafond: null,            // pas de plafond
    forme: 'continue'         // 999 € jusqu'à 4 999 habitants, puis 30 centimes par habitant au-delà
  },
  collecte: {
    minimum: 499,             // euros HT, une seule fois, si le site n'est pas à jour ou n'existe pas
    barre: 5000,              // sans effet en forme totale
    centimesParHabitant: 10,  // centimes par habitant
    plafond: null,            // pas de plafond
    forme: 'totale'           // le plus grand de 499 € et des centimes par habitant sur toute la population
  },
  option: 10,                 // Marianne sur WhatsApp, Marianne sur Messenger : euros HT par mois, chacune (9.99 s'écrit 9.99)
  optionsComprises: 35000,    // à partir de ce nombre d'habitants, les deux options sont comprises dans l'abonnement
  plafond: 49999,             // au-delà de ce nombre d'habitants, le prix s'établit sur devis
  palier: 100,                // la population est arrondie à ce palier, vers le bas, avant tout calcul
  SOURCE_POPULATION           // la note sous le bloc (même texte que l'en-tête du fichier des communes)
};
/* le nom de la ligne des six étapes, tel que la page des prix l'écrit (« La mise en service, une seule fois ») */
export const MISE = 'Mise en service';
/* l'adresse du service d'envoi : celle du formulaire de contact de /marianne/ (même boîte, même filtre) */
export const ENVOI = 'https://formspree.io/f/mnjogblz';
/* les six étapes, mot pour mot (section « La mise en service, une seule fois » de la page), et leur nom court sur la borne */
export const ETAPES = [['A', "L'inventaire des sources", 'Inventaire'], ['B', 'Le cadre écrit', 'Cadre écrit'], ['C', 'La base de connaissances', 'Base'], ['D', 'La mesure avant ouverture', 'Mesure'], ['E', 'La validation par vos agents', 'Validation'], ['F', 'La version de référence', 'Référence']];
const DONNEES = new URL('../donnees/communes.json', import.meta.url).href;
const ENCRE = '#60637B';
const GROS = { wMin: .8, wMax: 2.6, tremble: .5, op: .9 }, DET = { wMin: .5, wMax: 1.7, tremble: .45, op: .88 }, FIN = { wMin: .4, wMax: 1.1, tremble: .35, op: .8 };
const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';
const DEPARTEMENTS = { '01': 'Ain', '02': 'Aisne', '03': 'Allier', '04': 'Alpes-de-Haute-Provence', '05': 'Hautes-Alpes', '06': 'Alpes-Maritimes', '07': 'Ardèche', '08': 'Ardennes', '09': 'Ariège', '10': 'Aube', '11': 'Aude', '12': 'Aveyron', '13': 'Bouches-du-Rhône', '14': 'Calvados', '15': 'Cantal', '16': 'Charente', '17': 'Charente-Maritime', '18': 'Cher', '19': 'Corrèze', '2A': 'Corse-du-Sud', '2B': 'Haute-Corse', '21': "Côte-d'Or", '22': "Côtes-d'Armor", '23': 'Creuse', '24': 'Dordogne', '25': 'Doubs', '26': 'Drôme', '27': 'Eure', '28': 'Eure-et-Loir', '29': 'Finistère', '30': 'Gard', '31': 'Haute-Garonne', '32': 'Gers', '33': 'Gironde', '34': 'Hérault', '35': 'Ille-et-Vilaine', '36': 'Indre', '37': 'Indre-et-Loire', '38': 'Isère', '39': 'Jura', '40': 'Landes', '41': 'Loir-et-Cher', '42': 'Loire', '43': 'Haute-Loire', '44': 'Loire-Atlantique', '45': 'Loiret', '46': 'Lot', '47': 'Lot-et-Garonne', '48': 'Lozère', '49': 'Maine-et-Loire', '50': 'Manche', '51': 'Marne', '52': 'Haute-Marne', '53': 'Mayenne', '54': 'Meurthe-et-Moselle', '55': 'Meuse', '56': 'Morbihan', '57': 'Moselle', '58': 'Nièvre', '59': 'Nord', '60': 'Oise', '61': 'Orne', '62': 'Pas-de-Calais', '63': 'Puy-de-Dôme', '64': 'Pyrénées-Atlantiques', '65': 'Hautes-Pyrénées', '66': 'Pyrénées-Orientales', '67': 'Bas-Rhin', '68': 'Haut-Rhin', '69': 'Rhône', '70': 'Haute-Saône', '71': 'Saône-et-Loire', '72': 'Sarthe', '73': 'Savoie', '74': 'Haute-Savoie', '75': 'Paris', '76': 'Seine-Maritime', '77': 'Seine-et-Marne', '78': 'Yvelines', '79': 'Deux-Sèvres', '80': 'Somme', '81': 'Tarn', '82': 'Tarn-et-Garonne', '83': 'Var', '84': 'Vaucluse', '85': 'Vendée', '86': 'Vienne', '87': 'Haute-Vienne', '88': 'Vosges', '89': 'Yonne', '90': 'Territoire de Belfort', '91': 'Essonne', '92': 'Hauts-de-Seine', '93': 'Seine-Saint-Denis', '94': 'Val-de-Marne', '95': "Val-d'Oise", '971': 'Guadeloupe', '972': 'Martinique', '973': 'Guyane', '974': 'La Réunion', '975': 'Saint-Pierre-et-Miquelon', '976': 'Mayotte', '977': 'Saint-Barthélemy', '978': 'Saint-Martin', '984': 'Terres australes et antarctiques françaises', '986': 'Wallis-et-Futuna', '987': 'Polynésie française', '988': 'Nouvelle-Calédonie', '989': 'Île de Clipperton' };
const departement = c => (DEPARTEMENTS[c[2]] ? `${DEPARTEMENTS[c[2]]} (${c[2]})` : `(${c[2]})`);

/* ---------- les calculs, en centimes entiers (9,99 € reste juste) ---------- */
const cts = e => Math.round(e * 100);
/* le prix d'une ligne de la grille, en centimes, pour un nombre d'habitants (population arrondie au palier inférieur) */
export function prixParPalier({ minimum, barre, centimesParHabitant, plafond, forme }, habitants) {
  const palier = Math.floor(habitants / GRILLE.palier) * GRILLE.palier;
  let c = forme === 'continue'
    ? (palier < barre ? cts(minimum) : cts(minimum) + (palier - barre) * centimesParHabitant)
    : Math.max(cts(minimum), palier * centimesParHabitant);
  if (plafond) c = Math.min(c, cts(plafond));
  return Math.round(c);
}
export function calculer(habitants, o = {}) {
  const G = GRILLE;
  if (!Number.isInteger(habitants) || habitants < 0) return null;
  if (habitants > G.plafond) return { devis: true, habitants };
  const palier = Math.floor(habitants / G.palier) * G.palier;
  const abo = prixParPalier(G.abonnement, habitants);
  const comprises = habitants >= G.optionsComprises;
  const choisies = (o.whatsapp ? 1 : 0) + (o.messenger ? 1 : 0);
  const options = comprises ? 0 : choisies * cts(G.option);
  const mensuel = abo + options, annuel = 12 * mensuel;
  const mise = prixParPalier(G.miseEnService, habitants);
  const collecte = (o.site === 'non' || o.site === 'aucun') ? prixParPalier(G.collecte, habitants) : 0;
  return { devis: false, habitants, palier, abo, comprises, choisies, options, mensuel, annuel, mise, collecte, premiere: annuel + mise + collecte, ensuite: annuel, auMinimum: abo === cts(G.abonnement.minimum) };
}
/* le dernier nombre d'habitants auquel le minimum d'une ligne s'applique (999 € et 20 centimes, forme totale : 4 999) */
export const jusqua = l => (l.forme === 'continue' ? l.barre - 1 : Math.floor(cts(l.minimum) / l.centimesParHabitant / GRILLE.palier) * GRILLE.palier + GRILLE.palier - 1);
const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }), nf2 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/* l'espace des milliers : l'insécable ordinaire (l'espace fine U+202F manque dans Caveat et Poppins) */
const fine = t => t.replace(/\u202f/g, '\u00a0');
export const euros = c => fine(c % 100 ? nf2.format(c / 100) : nf0.format(c / 100)) + '\u00a0€';
export const nombre = n => fine(nf0.format(n));
/* un montant hors taxes : « HT » collé au montant par une insécable, jamais à la ligne suivante */
export const ht = c => euros(c) + '\u00a0HT';
export const habitantsTexte = n => `${nombre(n)} habitant${n > 1 ? 's' : ''}`;
const centimesTexte = c => (c === 1 ? 'un centime' : `${String(c).replace('.', ',')} centimes`);
/* la règle d'une ligne, en une phrase, tirée de la grille (jamais écrite en dur) ; parMois : « par mois » et « et par mois » */
export function regle(l, parMois) {
  /* forme continue : « 69 € par mois jusqu'à 4 999 habitants, puis 69 € plus un centime par mois pour chaque habitant au-delà
     de 5 000, 500 € par mois au plus » ; forme totale : « 10 centimes par habitant, 499 € au minimum » (consigne de 18 h 15 :
     le minimum est rappelé dans la suite, pour qu'on ne calcule pas les centimes sur toute la population) */
  const m = parMois ? ' par mois' : '';
  if (l.forme === 'continue') return `${euros(cts(l.minimum))}${m} jusqu'à ${nombre(l.barre - 1)} habitants, puis ${euros(cts(l.minimum))} plus ${centimesTexte(l.centimesParHabitant)}${m} pour chaque habitant au-delà de ${nombre(l.barre)}${l.plafond ? `, ${euros(cts(l.plafond))}${m} au plus` : ''}.`;
  return `${centimesTexte(l.centimesParHabitant)} par habitant${parMois ? ' et par mois' : ''}, ${euros(cts(l.minimum))}${m} au minimum${l.plafond ? `, ${euros(cts(l.plafond))}${m} au plus` : ''}.`;
}
export const regleAbonnement = () => regle(GRILLE.abonnement, true);

/* ---------- la recherche : sans accents, sans casse, sans tirets ni apostrophes ; « st » vaut « saint » ---------- */
export const cle = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/[^a-z0-9]+/g, ' ').trim();
const ABREGES = { st: 'saint', ste: 'sainte', sts: 'saints', stes: 'saintes' };
let base = null, chargement = null;
function charger() {
  if (!chargement) chargement = fetch(DONNEES, { credentials: 'omit' }).then(r => { if (!r.ok) throw new Error('statut ' + r.status); return r.json(); }).then(d => {
    if (!d || !Array.isArray(d.communes)) throw new Error('fichier inattendu');
    const communes = d.communes.filter(c => Array.isArray(c) && typeof c[0] === 'string' && typeof c[1] === 'string' && typeof c[2] === 'string')
      .map(c => [c[0], c[1], c[2], Number.isInteger(c[3]) && c[3] >= 0 ? c[3] : null]);
    const mots = communes.map(c => cle(c[0]));
    base = { communes, mots, compacts: mots.map(m => m.replace(/ /g, '')), parCode: new Map(communes.map(c => [c[1].toUpperCase(), c])), source: typeof d.source === 'string' ? d.source : '' };
    return base;
  }).catch(e => { chargement = null; throw e; });
  return chargement;
}
export function chercher(q, n = 6) {
  if (!base) return [];
  const mots = cle(q).split(' ').filter(Boolean).map(m => ABREGES[m] || m), qc = mots.join('');
  if (!qc) return [];
  if (/^\d+$/.test(qc)) return [];   /* un numéro (code postal ou code INSEE) ne se cherche pas : les codes postaux ne sont pas dans le fichier */
  const res = [], { communes, mots: M, compacts: C } = base;
  for (let i = 0; i < communes.length; i++) {
    const k = C[i]; let s = -1;
    if (k === qc) s = 0;
    else if (k.startsWith(qc)) s = 1;
    else if (qc.length >= 3) {
      const w = M[i]; let p = w.indexOf(' ');
      while (p >= 0) { if (w.slice(p + 1).replace(/ /g, '').startsWith(qc)) { s = 2; break; } p = w.indexOf(' ', p + 1); }
    }
    if (s >= 0) res.push([s, -(communes[i][3] || 0), i]);
  }
  res.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return res.slice(0, n).map(r => communes[r[2]]);
}

/* ---------- petits outils ---------- */
const $ = (s, r) => r.querySelector(s);
let plumeP = null; const plume = () => (plumeP = plumeP || import('./plume.js').catch(e => { plumeP = null; throw e; }));
let pagesP = null; const pages = () => (pagesP = pagesP || import('./pages.js').catch(e => { pagesP = null; throw e; }));
const AUJOURDHUI = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const nomCommune = c => `${c[0]} (${c[2]})`;
const COURRIEL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/* un nombre d'habitants lu par Number, entier, de 1 à 10 000 000 ; sinon null */
const HAB_MAX = 10000000;
const lireNombre = t => { const n = Number(t); return Number.isInteger(n) && n >= 1 && n <= HAB_MAX ? n : null; };
const attendre = ms => new Promise(r => setTimeout(r, reduit() ? 0 : ms));
const el = (tag, cls, texte) => { const e = document.createElement(tag); if (cls) e.className = cls; if (texte !== undefined) e.textContent = texte; return e; };
/* une suite de phases jouée au fil du temps : [nom, début ms, fin ms] ; rend une promesse ; posée d'un coup sous mouvement réduit */
function jouerPhases(rendre, phases, fin, anime = true) {
  return new Promise(r => {
    if (!anime || reduit()) { const p = {}; phases.forEach(([n]) => { p[n] = 1; }); rendre(p); r(); return; }
    const t0 = performance.now();
    const pas = t => {
      const dt = t - t0, p = {};
      phases.forEach(([n, a, b]) => { p[n] = Math.max(0, Math.min(1, (dt - a) / (b - a))); });
      rendre(p);
      if (dt < fin) requestAnimationFrame(pas); else r();
    };
    requestAnimationFrame(pas);
  });
}
const taille = (svg, w, h) => { svg.setAttribute('width', w.toFixed(0)); svg.setAttribute('height', h.toFixed(0)); svg.setAttribute('viewBox', `0 0 ${w.toFixed(0)} ${h.toFixed(0)}`); svg.textContent = ''; };

/* ---------- scène 1 : la plaque du panneau (contour, liseré, hachures côté ombre) ---------- */
async function dessinerPlaque(plaque, anime) {
  const P = await plume();
  const svg = plaque.querySelector(':scope > svg'), w = plaque.clientWidth, h = plaque.clientHeight;
  if (!w || !h) return;
  taille(svg, w + 12, h + 12);
  const D = new P.Dessin(svg, ENCRE);
  P.formeMain(D, P.perimetre(2, 2, w - 4, h - 4, 14), Object.assign({ phase: 'a', graine: 11, reprise: true }, GROS));
  P.formeMain(D, P.perimetre(10, 10, w - 20, h - 20, 8), Object.assign({ phase: 'b', graine: 17 }, DET));
  P.hachures(D, [[w - 1, 16], [w + 8, 22], [w + 8, h + 8], [w - 1, h - 1]], { phase: 'c', angle: 58, pas: 3.4, long: [5, 11], op: .42, wMax: .9, graine: 5 });
  P.hachures(D, [[16, h - 1], [w - 1, h - 1], [w + 8, h + 8], [22, h + 8]], { phase: 'c', angle: 58, pas: 3.4, long: [5, 11], op: .42, wMax: .9, graine: 6 });
  D.monter();
  await jouerPhases(p => D.rendre(p), [['a', 0, 560], ['b', 380, 820], ['c', 700, 980]], 1000, anime);
}

/* ---------- scènes 1 et 3 : le poteau, la terre, et les plaques accrochées ---------- */
async function dessinerPoteau(zone, anime) {
  const P = await plume();
  const svg = zone.querySelector(':scope > svg.pm-poteau'), Z = zone.getBoundingClientRect();
  if (!Z.width || !Z.height) return;
  taille(svg, Z.width, Z.height);
  const sol = Z.height - 14, x0 = 24, x1 = 33;
  const D = new P.Dessin(svg, ENCRE);
  D.trait(P.ligne(x0, 0, x0 - .4, sol + 1), Object.assign({ phase: 'p', graine: 21 }, DET));
  D.trait(P.ligne(x1, 0, x1 + .3, sol + 1), Object.assign({ phase: 'p', graine: 22 }, FIN));
  P.hachures(D, [[x1 + 1, 4], [x1 + 6, 8], [x1 + 6, sol], [x1 + 1, sol]], { phase: 'p', angle: 80, pas: 4, long: [6, 14], op: .35, wMax: .8, graine: 9 });
  D.trait(P.catmull([[0, sol + 1], [Z.width * .3, sol - 1], [Z.width * .62, sol + 1.5], [Z.width, sol]]), Object.assign({ phase: 's', graine: 41 }, FIN, { wMax: 1.4 }));
  const rnd = P.rng(7);
  for (const bx of [6, 14, 19, 38, 44, 52]) {
    const hx = 5 + rnd() * 8; D.trait([[bx, sol + 1], [bx + (rnd() - .5) * 5, sol + 1 - hx * .6], [bx + (rnd() - .3) * 6, sol + 1 - hx]], { phase: 's', profil: 'hachure', wMin: .3, wMax: 1, op: .55, pas: 1.4, graine: Math.round(bx * 7) });
  }
  /* les plaques accrochées : contour à la plume, deux brides vers le poteau ; seules les nouvelles se dessinent */
  const plaques = Array.from(zone.querySelectorAll('.pm-accroche')).filter(e => !e.hidden && e.offsetParent);
  const phases = [['p', 0, 1], ['s', 0, 1]];
  let k = 0;
  plaques.forEach((pl, i) => {
    const q = pl.getBoundingClientRect(), x = q.left - Z.left, y = q.top - Z.top, ph = 'q' + i;
    P.formeMain(D, P.perimetre(x, y, q.width, q.height, 7), Object.assign({ phase: ph, graine: 30 + i * 3 }, DET));
    for (const by of [y + 12, y + q.height - 12]) D.trait(P.ligne(x1, by, x + 1, by + .4), Object.assign({ phase: ph, graine: 60 + i * 5 + Math.round(by) }, DET, { wMax: 2.2 }));
    const neuve = anime && !pl.dataset.dessinee;
    phases.push([ph, neuve ? 40 + k * 300 : 0, neuve ? 40 + k * 300 + 420 : 1]);
    if (neuve) k++;
    pl.dataset.dessinee = '1';
  });
  D.monter();
  const voir = p => { plaques.forEach((pl, i) => { pl.style.opacity = String(Math.min(1, (p['q' + i] || 0) * 1.6)); }); };
  await jouerPhases(p => { D.rendre(p); voir(p); }, phases, Math.max(...phases.map(x => x[2])) + 40, anime && k > 0);
}

/* ---------- les tampons de mairie, à l'encre de la plume (passe 3, 14/10/2026) : un trait irrégulier, des lacunes d'encre
   (stroke-dasharray tiré au hasard, graine fixe par commune), aucune image ; le texte est posé par textContent ---------- */
const ENCRE_TAMPON = '#16205C';
let tamponsN = 0;
const svgEl = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
const graineDe = t => { let h = 2166136261; for (const ch of String(t)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
function hasard(graine) { let a = graine >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/* des lacunes d'encre : des traits de 22 à 90 unités, des trous de 1 à 5, jamais réguliers */
function lacunes(rnd, longueur) { const d = []; let t = 0; while (t < longueur) { const a = 22 + rnd() * 68, b = 1 + rnd() * 4; d.push(a.toFixed(1), b.toFixed(1)); t += a + b; } return d.join(' '); }
/* un cercle tremblé (le bord d'un tampon de caoutchouc) */
function cercleTremble(cx, cy, r, rnd, amp) { let d = ''; const n = 96; for (let i = 0; i <= n; i++) { const t = i / n * Math.PI * 2, rr = r + (rnd() - .5) * amp; d += (i ? 'L' : 'M') + (cx + rr * Math.cos(t)).toFixed(2) + ' ' + (cy + rr * Math.sin(t)).toFixed(2); } return d + 'Z'; }
function etoile(cx, cy, r) { let d = ''; for (let i = 0; i < 10; i++) { const t = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .42 : r; d += (i ? 'L' : 'M') + (cx + rr * Math.cos(t)).toFixed(2) + ' ' + (cy + rr * Math.sin(t)).toFixed(2); } return d + 'Z'; }
const mesureTexte = (t, px, poids) => { if (!toile) toile = document.createElement('canvas').getContext('2d'); toile.font = `${poids} ${px}px Poppins, Inter, sans-serif`; return toile.measureText(t).width; };
/* le sceau rond : deux cercles, la commune sur l'arc du haut, MARIANNE sur l'arc du bas, deux étoiles, le prix au centre */
function tamponRond(svg, o) {
  svg.textContent = ''; svg.setAttribute('viewBox', '0 0 240 240');
  const id = 'pmt' + (++tamponsN), rnd = hasard(graineDe(o.haut));
  const g = svgEl('g', { fill: 'none', stroke: ENCRE_TAMPON, 'stroke-linecap': 'round' }, svg);
  const c1 = svgEl('path', { d: cercleTremble(120, 120, 112, rnd, 1.6), 'stroke-width': 3.2 }, g); c1.setAttribute('stroke-dasharray', lacunes(rnd, 710));
  const c2 = svgEl('path', { d: cercleTremble(120, 120, 82, rnd, 1.2), 'stroke-width': 1.6 }, g); c2.setAttribute('stroke-dasharray', lacunes(rnd, 520));
  const defs = svgEl('defs', {}, svg);
  const pt = (r, deg) => [120 + r * Math.cos(deg * Math.PI / 180), 120 + r * Math.sin(deg * Math.PI / 180)];
  const [h1x, h1y] = pt(91, 155), [h2x, h2y] = pt(91, 25), [b1x, b1y] = pt(101, 150), [b2x, b2y] = pt(101, 30);
  svgEl('path', { id: id + 'h', d: `M${h1x.toFixed(2)} ${h1y.toFixed(2)}A91 91 0 1 1 ${h2x.toFixed(2)} ${h2y.toFixed(2)}` }, defs);
  svgEl('path', { id: id + 'b', d: `M${b1x.toFixed(2)} ${b1y.toFixed(2)}A101 101 0 0 0 ${b2x.toFixed(2)} ${b2y.toFixed(2)}` }, defs);
  const texteArc = (chemin, contenu, px, espace) => {
    const t = svgEl('text', { fill: ENCRE_TAMPON, 'font-family': 'Poppins, Inter, sans-serif', 'font-weight': 700, 'font-size': px.toFixed(1), 'letter-spacing': espace }, svg);
    const tp = svgEl('textPath', { href: '#' + chemin, startOffset: '50%', 'text-anchor': 'middle' }, t); tp.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + chemin);
    tp.textContent = contenu; return t;
  };
  const haut = String(o.haut).toUpperCase(), arcH = 91 * Math.PI * 230 / 180 * .9;
  const pxH = Math.max(7, Math.min(17, 17 * arcH / Math.max(1, mesureTexte(haut, 17, 700) * 1.12)));
  texteArc(id + 'h', haut, pxH, '.08em'); texteArc(id + 'b', 'MARIANNE', 13, '.22em');
  for (const deg of [135, 45]) { const [x, y] = pt(97, deg); svgEl('path', { d: etoile(x, y, 5.2), fill: ENCRE_TAMPON }, svg); }
  const centre = String(o.centre), pxC = Math.min(o.devis ? 26 : 34, 150 / Math.max(1, mesureTexte(centre, 1, 800)));
  const tc = svgEl('text', { x: 120, y: o.sous ? 124 : 129, fill: ENCRE_TAMPON, 'font-family': 'Poppins, Inter, sans-serif', 'font-weight': 800, 'font-size': pxC.toFixed(1), 'text-anchor': 'middle' }, svg); tc.textContent = centre;
  if (o.sous) { const ts = svgEl('text', { x: 120, y: 148, fill: ENCRE_TAMPON, 'font-family': 'Inter, sans-serif', 'font-weight': 600, 'font-size': 13, 'text-anchor': 'middle', 'letter-spacing': '.04em' }, svg); ts.textContent = o.sous; }
}
/* le tampon rectangulaire à coins arrondis (« payé ») : la mise en service, la collecte */
function tamponRect(svg, o) {
  svg.textContent = ''; const W = 200, H = 108; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const rnd = hasard(graineDe(o.haut + o.centre));
  const bord = (x, y, w, h, r, amp) => { const pts = []; const pas = 3; const coin = (cx, cy, a0) => { for (let k = 0; k <= 8; k++) { const t = a0 + k / 8 * Math.PI / 2; pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } };
    for (let X = x + r; X < x + w - r; X += pas) pts.push([X, y]); coin(x + w - r, y + r, -Math.PI / 2);
    for (let Y = y + r; Y < y + h - r; Y += pas) pts.push([x + w, Y]); coin(x + w - r, y + h - r, 0);
    for (let X = x + w - r; X > x + r; X -= pas) pts.push([X, y + h]); coin(x + r, y + h - r, Math.PI / 2);
    for (let Y = y + h - r; Y > y + r; Y -= pas) pts.push([x, Y]); coin(x + r, y + r, Math.PI);
    return pts.map(([a, b], i) => (i ? 'L' : 'M') + (a + (rnd() - .5) * amp).toFixed(2) + ' ' + (b + (rnd() - .5) * amp).toFixed(2)).join('') + 'Z'; };
  const g = svgEl('g', { fill: 'none', stroke: ENCRE_TAMPON, 'stroke-linecap': 'round' }, svg);
  svgEl('path', { d: bord(5, 5, W - 10, H - 10, 11, 1.4), 'stroke-width': 3, 'stroke-dasharray': lacunes(rnd, 620) }, g);
  svgEl('path', { d: bord(12, 12, W - 24, H - 24, 7, 1), 'stroke-width': 1.3, 'stroke-dasharray': lacunes(rnd, 560) }, g);
  const ecrire = (y, t, px, poids, espace) => { const e = svgEl('text', { x: W / 2, y, fill: ENCRE_TAMPON, 'font-family': poids > 600 ? 'Poppins, Inter, sans-serif' : 'Inter, sans-serif', 'font-weight': poids, 'font-size': px.toFixed(1), 'text-anchor': 'middle', 'letter-spacing': espace || '0' }, svg); e.textContent = t; };
  const pxC = Math.min(27, 150 / Math.max(1, mesureTexte(o.centre, 1, 800)));
  const haut = String(o.haut).toUpperCase(), pxH = Math.min(11, 158 / Math.max(1, mesureTexte(haut, 1, 700) + .14 * haut.length));   /* espacement de .14em compris */
  ecrire(34, haut, pxH, 700, '.14em'); ecrire(67, o.centre, pxC, 800); ecrire(88, o.bas, 11.5, 600, '.03em');
}
/* le tampon s'abat (0,22 s) ou se retampe (0,3 s) ; posé sans mouvement sous mouvement réduit */
function frapper(e, retampe) {
  e.classList.remove('pm-tampon--frappe', 'pm-tampon--retampe'); e.style.opacity = '1';
  if (reduit()) return; void e.getBoundingClientRect(); e.classList.add(retampe ? 'pm-tampon--retampe' : 'pm-tampon--frappe');
}

/* ---------- scène 4 : le chemin, les bornes des étapes, le tampon du montant ---------- */
async function dessinerChemin(route, anime, seulementGauche) {
  const P = await plume();
  const svg = route.querySelector(':scope > svg'), R = route.getBoundingClientRect();
  const lieux = Array.from(route.querySelectorAll('.pm-etape:not([hidden]) .pm-etape__borne'));
  const fin = route.querySelector('.pm-fin__borne'), tampon = fin && fin.querySelector('.pm-tampon');
  const col = route.querySelector('.pm-etape--collecte:not([hidden])'), iA = col ? 1 : 0;
  if (!R.width || !lieux.length || !fin) return;
  taille(svg, R.width, R.height);
  const B = lieux.map(l => { const q = l.getBoundingClientRect(); return { cx: q.left - R.left + q.width / 2, haut: q.top - R.top + 2, bas: q.bottom - R.top - 1, l: q.width / 2 - 2 }; });
  const qf = fin.getBoundingClientRect(), F = { cx: qf.left - R.left + qf.width / 2, haut: qf.top - R.top + 2, bas: qf.bottom - R.top - 1, l: qf.width / 2 - 2 };
  const enLigne = Math.abs(F.bas - B[0].bas) < 40;
  const rnd = P.rng(5), pts = [], T = B.concat([F]);
  if (enLigne) {
    pts.push([0, B[0].bas - 6]);
    B.forEach((b, i) => { pts.push([b.cx, b.bas - 7]); pts.push([(b.cx + (B[i + 1] || { cx: F.cx - F.l }).cx) / 2, b.bas - 7 + (rnd() - .5) * 8]); });
    pts.push([F.cx - F.l - 6, B[0].bas - 7]);
  } else {
    pts.push([B[0].cx + 2, 0]);
    B.forEach((b, i) => { pts.push([b.cx, (b.haut + b.bas) / 2]); pts.push([b.cx + (rnd() - .5) * 10, (b.bas + (B[i + 1] || F).haut) / 2]); });
    pts.push([B[B.length - 1].cx, F.haut - 4]);
  }
  const chemin = new P.Dessin(svg, ENCRE);
  /* deux morceaux : de la borne A vers le départ (tracé de droite à gauche, il s'allonge quand la collecte apparaît), puis de
     la borne A jusqu'au tampon */
  const kA = 1 + 2 * iA, gauche = P.catmull(pts.slice(0, kA + 1).reverse(), 10), droite = P.catmull(pts.slice(kA), 10);
  const decale = c => c.map(([a, b]) => (enLigne ? [a, b + 6] : [a + 6, b]));
  chemin.trait(gauche, Object.assign({ phase: 'g', graine: 2 }, FIN, { wMax: 1.5 })); chemin.trait(decale(gauche), Object.assign({ phase: 'g', graine: 5 }, FIN, { wMax: .9, op: .4 }));
  chemin.trait(droite, Object.assign({ phase: 'c', graine: 3 }, FIN, { wMax: 1.5 })); chemin.trait(decale(droite), Object.assign({ phase: 'c', graine: 4 }, FIN, { wMax: .9, op: .4 }));
  chemin.monter();
  const pierres = B.map(b => {
    const e = document.createElementNS(NS, 'path'), r = Math.min(b.l, (b.bas - b.haut) * .45);
    e.setAttribute('class', 'pm-pierre');
    e.setAttribute('d', `M${b.cx - b.l} ${b.bas}V${b.haut + r}Q${b.cx - b.l} ${b.haut} ${b.cx} ${b.haut}Q${b.cx + b.l} ${b.haut} ${b.cx + b.l} ${b.haut + r}V${b.bas}Z`);
    svg.appendChild(e); return e;
  });
  const bornes = new P.Dessin(svg, ENCRE);
  B.forEach((b, i) => {
    const r = Math.min(b.l, (b.bas - b.haut) * .45), grand = false;
    const contour = [[b.cx - b.l, b.bas], ...P.arcE(b.cx, b.haut + r, b.l, r, Math.PI, 2 * Math.PI), [b.cx + b.l, b.bas]];
    bornes.trait(contour, Object.assign({ phase: 'b' + i, graine: 50 + i }, grand ? GROS : DET));
    bornes.trait(P.ligne(b.cx - b.l - 6, b.bas, b.cx + b.l + 6, b.bas + .5), Object.assign({ phase: 'b' + i, graine: 60 + i }, FIN));
    const h0 = grand ? .84 : .6;   /* sur la grande borne, l'ombre reste au bord : le montant se lit */
    P.hachures(bornes, [[b.cx + b.l * h0, b.haut + r * .9], [b.cx + b.l - 1, b.haut + r], [b.cx + b.l - 1, b.bas - 1], [b.cx + b.l * h0, b.bas - 1]], { phase: 'b' + i, angle: 80, pas: grand ? 3.2 : 3.6, long: [4, 9], op: .38, wMax: .8, graine: 70 + i });
  });
  bornes.monter();
  const textes = B.map((b, i) => lieux[i].querySelector('span'));
  const noms = B.map((b, i) => lieux[i].closest('li').querySelector('.pm-etape__nom'));
  const rendre = p => {
    chemin.rendre(p); bornes.rendre(p);
    B.forEach((b, i) => { const v = p['b' + i] || 0; pierres[i].style.opacity = String(Math.min(1, v * 2.5)); const o = String(Math.min(1, Math.max(0, v * 2 - .9))); if (textes[i]) textes[i].style.opacity = o; if (noms[i]) noms[i].style.opacity = o; });
  };
  const pas = Math.min(240, 1300 / B.length);
  /* seulementGauche : la collecte vient d'apparaître ; le reste est posé, seuls le départ et sa borne se tracent */
  const phases = seulementGauche ? [['g', 0, 520], ['c', 0, 1], ...B.map((b, i) => ['b' + i, i === 0 ? 380 : 0, i === 0 ? 760 : 1])]
    : [['g', 0, 600], ['c', 0, 1400], ...B.map((b, i) => ['b' + i, 100 + i * pas, 460 + i * pas])];
  if (anime && !reduit()) { rendre(seulementGauche ? { c: 1 } : {}); if (tampon && !seulementGauche) { tampon.classList.remove('pm-tampon--frappe', 'pm-tampon--retampe'); tampon.style.opacity = '0'; } }
  await jouerPhases(rendre, phases, Math.max(...phases.map(x => x[2])) + 40, anime);
  if (tampon) { if (anime && !seulementGauche) frapper(tampon); else tampon.style.opacity = '1'; }
}

/* ---------- le bloc ---------- */
function gabarit(id) {
  const i = s => `${id}-${s}`;
  const etapes = ETAPES.map(([l, t, court]) => `<li class="pm-etape"><span class="pm-etape__borne" aria-hidden="true"><span>${l}</span></span><button type="button" class="pm-etape__nom" aria-expanded="false">${court}<span class="pm-sr"> : ${t}</span></button><span class="pm-bulle" aria-hidden="true">${t}</span></li>`).join('');
  const etapesFeuille = ETAPES.map(([l, t]) => `<li data-l="${l}">${t}</li>`).join('');
  return `
<p class="pm-sr" aria-live="polite" data-annonce></p>
<p class="pm-sr" role="status" data-pm-compte></p>
<div class="pm-scene">
  <div class="pm-col-panneau">
    <div class="pm-plaque" data-plaque>
      <svg aria-hidden="true" focusable="false"></svg>
      <label class="pm-sr" for="${i('champ')}">Le nom de votre commune</label>
      <input class="pm-champ" id="${i('champ')}" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${i('liste')}" aria-describedby="${i('aide')}" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="search" maxlength="60">
      <span class="pm-plaque__vide" aria-hidden="true">VOTRE COMMUNE<i class="pm-curseur"></i></span>
      <span class="pm-plaque__nom" aria-hidden="true"></span>
      <span class="pm-plaque__dep" aria-hidden="true"></span>
    </div>
    <ul class="pm-fleches" id="${i('liste')}" role="listbox" aria-label="Communes proposées" hidden></ul>
    <p class="pm-etat" id="${i('aide')}" role="status"></p>
    <div class="pm-poteau-zone">
      <svg class="pm-poteau" aria-hidden="true" focusable="false"></svg>
      <div class="pm-accroches">
        <div class="pm-pop" data-pop hidden>
          <p class="pm-pop__ligne"><span class="pm-pop__n" data-habitants></span><span class="pm-pop__ast" data-ast aria-hidden="true">*</span></p>
          <p class="pm-pop__source" data-source>population municipale INSEE</p>
          <button type="button" class="pm-lien" data-corriger aria-controls="${i('saisie')}">Corriger la population</button>
        </div>
        <div class="pm-repli">
          <button type="button" class="pm-lien" data-bascule aria-expanded="false" aria-controls="${i('saisie')}">ou saisissez le nombre d’habitants</button>
          <div class="pm-saisie" id="${i('saisie')}" hidden>
            <label for="${i('hab')}">Nombre d’habitants</label>
            <input id="${i('hab')}" type="text" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="12 400">
          </div>
        </div>
        <label class="pm-accroche pm-option" data-plaque-opt hidden><input type="checkbox" data-opt="whatsapp"><span class="pm-case" aria-hidden="true"></span><span>Marianne sur WhatsApp (bientôt), <b data-opt-prix></b></span></label>
        <label class="pm-accroche pm-option" data-plaque-opt hidden><input type="checkbox" data-opt="messenger"><span class="pm-case" aria-hidden="true"></span><span>Marianne sur Messenger (bientôt), <b data-opt-prix></b></span></label>
        <fieldset class="pm-accroche pm-question" data-site hidden>
          <legend>Le site internet de la mairie est-il à jour&nbsp;?</legend>
          <div class="pm-reponses">
            <label class="pm-radio"><input type="radio" name="${i('site')}" value="oui" checked><span class="pm-rond" aria-hidden="true"></span>Oui</label>
            <label class="pm-radio"><input type="radio" name="${i('site')}" value="non"><span class="pm-rond" aria-hidden="true"></span>Non</label>
            <label class="pm-radio"><input type="radio" name="${i('site')}" value="aucun"><span class="pm-rond" aria-hidden="true"></span>Pas de site</label>
          </div>
          <p class="pm-collecte-ligne" data-collecte-ligne hidden>Collecte des informations&nbsp;: <b data-collecte-q></b>, ajoutée à la mise en service</p>
        </fieldset>
      </div>
    </div>
  </div>
  <div class="pm-col-borne" data-col-borne>
    <div class="pm-sceau" data-borne>
      <svg class="pm-sceau__vide" viewBox="0 0 240 240" aria-hidden="true" focusable="false"><circle cx="120" cy="120" r="108" fill="none" stroke="#b9bccb" stroke-width="1.6" stroke-dasharray="3 6" stroke-linecap="round"></circle><text x="120" y="128" text-anchor="middle" font-family="Caveat, 'Segoe Print', cursive" font-size="27" fill="#8a8da0">votre prix</text></svg>
      <svg class="pm-tampon pm-tampon--rond" data-pm-sceau aria-hidden="true" focusable="false" hidden></svg>
      <p class="pm-sr" data-gravure><span data-mensuel></span> <span data-unite>HT par mois</span></p>
    </div>
    <div class="pm-sous-borne" data-sous-borne hidden>
      <p class="pm-an" data-chiffre>soit <span data-annuel></span> HT par an, abonnement annuel</p>
      <p class="pm-regle" data-regle data-chiffre></p>
      <p class="pm-devis" data-surdevis hidden>Pour une commune de votre taille, une intercommunalité ou un département, le prix s’établit avec vous.</p>
    </div>
  </div>
</div>
<div class="pm-route-zone" data-mise hidden>
  <h4 class="pm-route__titre">La ${MISE.toLowerCase()}, une seule fois</h4>
  <div class="pm-route">
    <svg aria-hidden="true" focusable="false"></svg>
    <ol class="pm-etapes-route">
      <li class="pm-etape pm-etape--collecte" data-borne-collecte hidden><span class="pm-etape__borne" aria-hidden="true"><span></span></span><span class="pm-etape__nom pm-etape__nom--texte">Collecte</span><span class="pm-etape__frais">Frais additionnels de collecte pour constituer la base documentaire&nbsp;: <b data-collecte-montant></b>&nbsp;HT</span></li>
      ${etapes}
      <li class="pm-fin"><span class="pm-fin__borne"><svg class="pm-tampon pm-tampon--rect" data-tampon-mise aria-hidden="true" focusable="false"></svg><span class="pm-sr">${MISE}, une seule fois&nbsp;: <b data-mise-montant></b>&nbsp;HT<span data-fin-total></span></span></span><span class="pm-fin__dont" data-fin-dont aria-hidden="true" hidden></span></li>
    </ol>
  </div>
  <p class="pm-route__regle" data-mise-regle></p>
</div>
<div class="pm-feuille-zone" data-feuille-zone hidden>
  <div class="pm-feuille" data-feuille>
    <div class="pm-feuille__tete"><h4 data-feuille-titre></h4><span>${AUJOURDHUI}</span></div>
    <form class="pm-form" id="${i('form')}" data-envoi="${ENVOI}" data-voix="nous" novalidate hidden>
      <div class="pm-form__corps">
        <p class="pm-form__tete" data-form-tete>Transmettez cette estimation, nous revenons vers vous avec un devis.</p>
        <div class="pm-form__rang">
          <div class="pm-form__champ"><label for="${i('nom')}">Nom et prénom</label><input id="${i('nom')}" name="name" type="text" autocomplete="name" required maxlength="120" aria-describedby="${i('nom-err')}"><span class="pm-erreur" id="${i('nom-err')}" aria-live="polite"></span></div>
          <div class="pm-form__champ"><label for="${i('mel')}">Courriel</label><input id="${i('mel')}" name="email" type="email" autocomplete="email" required maxlength="160" aria-describedby="${i('mel-err')}"><span class="pm-erreur" id="${i('mel-err')}" aria-live="polite"></span></div>
        </div>
        <div class="pm-form__champ"><label for="${i('mot')}">Un mot pour nous (facultatif)</label><textarea id="${i('mot')}" name="mot" rows="3" maxlength="2000"></textarea></div>
        <div class="pm-pot" aria-hidden="true"><label for="${i('pot')}">Ne pas remplir</label><input id="${i('pot')}" name="_gotcha" type="text" tabindex="-1" autocomplete="off"></div>
        <p class="pm-form__note">L’estimation ci-dessous part avec votre message. Votre courriel sert à vous répondre&nbsp;: <a href="/legal/politique-confidentialite.html">politique de confidentialité</a>.</p>
        <button type="submit" class="pm-action pm-action--plein">Envoyer la demande de devis</button>
      </div>
      <div class="pm-envoi" data-bloc hidden></div>
    </form>
    <dl>
      <div class="pm-ligne"><dt>Commune</dt><dd data-f="commune"></dd><dd class="pm-sous" data-f="pop-source"></dd><dd class="pm-main" aria-hidden="true" data-main="commune"></dd></div>
      <div class="pm-ligne" data-f-chiffre><dt>Abonnement Marianne</dt><dd data-f="abo"></dd><dd class="pm-sous" data-f="abo-an"></dd><dd class="pm-main" aria-hidden="true" data-main="abo"></dd></div>
      <div class="pm-ligne" data-f-chiffre><dt>Options</dt><dd data-f="options"></dd></div>
      <div class="pm-ligne" data-f-chiffre><dt>${MISE}, une seule fois</dt><dd data-f="mise"></dd><dd class="pm-main" aria-hidden="true" data-main="mise"></dd><dd class="pm-sous"><ol class="pm-etapes">${etapesFeuille}</ol></dd></div>
      <div class="pm-ligne" data-f-collecte hidden><dt>Collecte des informations, une seule fois</dt><dd data-f="collecte"></dd><dd class="pm-main" aria-hidden="true" data-main="collecte"></dd></div>
      <div class="pm-ligne pm-ligne--total" data-f-chiffre><dt>Première année</dt><dd data-f="premiere"></dd><dd class="pm-main" aria-hidden="true" data-main="premiere"></dd></div>
      <div class="pm-ligne pm-ligne--total" data-f-chiffre><dt>Ensuite</dt><dd data-f="ensuite"></dd></div>
      <div class="pm-ligne" data-f-devis hidden><dt>Prix</dt><dd data-f="devis">sur devis</dd><dd class="pm-main" aria-hidden="true" data-main="devis"></dd></div>
    </dl>
    <p class="pm-mention" data-mention>Prix estimatifs, hors taxes. Une première réunion de trente minutes les fixe.</p>
    <p class="pm-mention">Le devis retient la population municipale INSEE en vigueur à la date de la commande.</p>
  </div>
  <div class="pm-sorties">
    <button type="button" class="pm-action pm-action--plein" data-recevoir aria-expanded="false" aria-controls="${i('form')}">Demander un devis</button>
    <button type="button" class="pm-action" data-partager>Copier le lien de l’estimation</button>
  </div>
  <p class="pm-copie" data-copie role="status"></p>
</div>
<p class="pm-note" data-note hidden></p>`;
}

/* la taille de la typographie du panneau : la plus grande qui tient dans la plaque, en une ou deux lignes */
let toile = null;
function ajusterNom(cible, nom, largeur, hauteur) {
  if (!toile) toile = document.createElement('canvas').getContext('2d');
  const fonte = getComputedStyle(cible).fontFamily || 'Poppins, sans-serif';
  const L = s => { toile.font = `700 100px ${fonte}`; return toile.measureText(s).width * 1.04 || s.length * 62; };
  const jetons = String(nom).toUpperCase().match(/[^- ]+[- ]?/g) || [String(nom).toUpperCase()];
  let mieux = null;
  const essayer = lignes => { const w = Math.max(...lignes.map(s => L(s.trim()))), n = lignes.length; const fs = Math.min(34, 100 * largeur / w, hauteur / (n * 1.08)); if (!mieux || fs > mieux.fs * 1.12) mieux = { fs, lignes: lignes.map(s => s.trim()) }; };
  essayer([jetons.join('')]);
  for (let k = 1; k < jetons.length; k++) essayer([jetons.slice(0, k).join(''), jetons.slice(k).join('')]);
  cible.textContent = '';
  mieux.lignes.forEach((l, k) => { if (k) cible.appendChild(document.createElement('br')); cible.appendChild(document.createTextNode(l)); });
  cible.style.fontSize = Math.max(12, mieux.fs).toFixed(1) + 'px';
}

let compteur = 0;
export function monter(racine) {
  if (!racine || racine.dataset.pret) return;
  racine.dataset.pret = '1';
  const hote = racine.querySelector('[data-prix-calcul]') || racine;
  const id = 'pm' + (++compteur);
  hote.innerHTML = gabarit(id);   /* gabarit : constantes du module seulement, aucune valeur extérieure */
  const q = s => $(s, hote);
  const plaque = q('[data-plaque]'), champ = q('.pm-champ'), liste = q('.pm-fleches'), etatTxt = q('.pm-etat'), bascule = q('[data-bascule]'), corriger = q('[data-corriger]'), saisie = q('.pm-saisie'), habIn = q(`#${id}-hab`);
  const nomPlaque = q('.pm-plaque__nom'), depPlaque = q('.pm-plaque__dep'), zonePoteau = q('.pm-poteau-zone');
  const pop = q('[data-pop]'), sceau = q('[data-pm-sceau]'), sceauVide = q('.pm-sceau__vide'), sousBorne = q('[data-sous-borne]');
  const zoneMise = q('[data-mise]'), route = q('.pm-route'), zoneFeuille = q('[data-feuille-zone]'), feuille = q('[data-feuille]'), note = q('[data-note]');
  const form = q('form'), bloc = q('[data-bloc]'), recevoir = q('[data-recevoir]'), partager = q('[data-partager]'), copieTxt = q('[data-copie]');
  /* sur téléphone (860 px et moins), le sceau se place sous la population, dans la colonne des plaques ; ailleurs, à droite */
  const colBorne = q('[data-col-borne]'), scene = q('.pm-scene'), mqTel = matchMedia('(max-width: 860px)');
  const placer = () => { if (mqTel.matches) { if (colBorne.previousElementSibling !== pop) pop.after(colBorne); } else if (colBorne.parentElement !== scene) scene.appendChild(colBorne); };
  placer(); if (mqTel.addEventListener) mqTel.addEventListener('change', placer); else if (mqTel.addListener) mqTel.addListener(placer);
  /* lignes de suite posées par la page ([data-pm-suite], HTML de la page) : rangées sous les deux boutons, avant la note */
  const suite = racine.querySelector(':scope > [data-pm-suite]');
  if (suite) note.before(suite);
  const etat = { commune: null, saisie: null, whatsapp: false, messenger: false, site: 'oui' };
  let options = [], actif = -1, annonceT = 0, generation = 0, dejaVu = false, cheminFait = '', feuillePosee = false;
  note.textContent = SOURCE_POPULATION;

  /* --- la scène se dessine quand le bloc entre dans la vue : la plaque, le poteau, la borne --- */
  function entrer() {
    if (dejaVu) return; dejaVu = true;
    plume().then(() => dessinerPlaque(plaque, true)).then(() => dessinerPoteau(zonePoteau, false)).catch(() => {});
  }
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); entrer(); } }, { rootMargin: '0px 0px -10% 0px' }); io.observe(plaque); }
  else entrer();

  /* --- le chargement des données, au premier geste dans le champ --- */
  let echecDonnees = false;
  const preparer = () => {
    entrer();
    if (base) return Promise.resolve(base);
    if (echecDonnees) return Promise.resolve(null);
    etatTxt.textContent = 'Chargement de la liste des communes…';
    return charger().then(b => { if (etatTxt.textContent.startsWith('Chargement')) etatTxt.textContent = ''; return b; }, () => {
      echecDonnees = true;
      etatTxt.textContent = 'La liste des communes n’a pas pu se charger. Saisissez le nombre d’habitants.';
      ouvrirSaisie(false); return null;
    });
  };
  champ.addEventListener('focus', () => { preparer(); plaque.classList.remove('pm-plaque--posee', 'pm-plaque--pose'); plaque.classList.add('pm-plaque--active'); taillerSaisie(); if (etat.commune) champ.select(); });
  champ.addEventListener('pointerdown', preparer);

  /* --- les suggestions : des panneaux fléchés (combobox, clavier et souris) --- */
  const fermer = () => { liste.hidden = true; champ.setAttribute('aria-expanded', 'false'); champ.removeAttribute('aria-activedescendant'); actif = -1; };
  const marquer = k => {
    actif = k;
    Array.from(liste.children).forEach((li, j) => li.setAttribute('aria-selected', String(j === k)));
    if (k >= 0 && liste.children[k]) { champ.setAttribute('aria-activedescendant', liste.children[k].id); liste.children[k].scrollIntoView({ block: 'nearest' }); }
    else champ.removeAttribute('aria-activedescendant');
  };
  const proposer = () => {
    const v = champ.value;
    if (!base) { if (v.trim()) preparer().then(b => { if (b) proposer(); }); return; }
    options = chercher(v);
    liste.textContent = '';
    if (!v.trim()) { fermer(); etatTxt.textContent = ''; return; }
    if (!options.length) { fermer(); etatTxt.textContent = /^\s*\d/.test(v) ? 'Écrivez le nom de la commune\u00a0: les codes postaux ne sont pas reconnus.' : 'Aucune commune de ce nom. Vérifiez l’orthographe, ou indiquez la population.'; return; }
    options.forEach((c, j) => {
      const li = el('li', 'pm-fleche'); li.id = `${id}-opt-${j}`; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', 'false');
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'pm-fleche__forme'); svg.setAttribute('viewBox', '0 0 100 40'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
      const forme = document.createElementNS(NS, 'path'); forme.setAttribute('d', 'M1.5 2.5H90L98.5 20L90 37.5H1.5Z'); forme.setAttribute('vector-effect', 'non-scaling-stroke'); svg.appendChild(forme);
      li.append(svg, el('b', 'pm-fleche__nom', c[0]), el('span', 'pm-fleche__dep', departement(c)), el('span', 'pm-fleche__hab', c[3] === null ? 'population non disponible' : nombre(c[3]) + ' hab.'));
      /* le champ garde le focus (pointerdown sans défaut) ; la commune se choisit au relâcher, si le doigt n'a pas glissé */
      let x0 = 0, y0 = 0;
      li.addEventListener('pointerdown', e => { e.preventDefault(); x0 = e.clientX; y0 = e.clientY; });
      li.addEventListener('pointerup', e => { if (Math.hypot(e.clientX - x0, e.clientY - y0) > 10) return; choisir(c); if (e.pointerType !== 'mouse') champ.blur(); });
      liste.appendChild(li);
    });
    liste.hidden = false; champ.setAttribute('aria-expanded', 'true'); marquer(-1); etatTxt.textContent = '';
    /* le nombre de propositions, pour les lecteurs d'écran seulement (les panneaux fléchés le montrent) */
    q('[data-pm-compte]').textContent = options.length === 1 ? 'Une commune proposée, flèche du bas pour la choisir.' : `${options.length} communes proposées, flèches pour choisir.`;
  };
  let raf = 0;
  champ.addEventListener('input', () => { plaque.classList.remove('pm-plaque--posee'); plaque.classList.toggle('pm-plaque--ecrite', !!champ.value); taillerSaisie(); cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { raf = 0; proposer(); }); });
  champ.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (liste.hidden) proposer(); else marquer(Math.min(options.length - 1, actif + 1)); }
    else if (e.key === 'ArrowUp') { if (liste.hidden) return; e.preventDefault(); marquer(Math.max(0, actif - 1)); }
    else if (e.key === 'Enter') { if (raf) { cancelAnimationFrame(raf); raf = 0; proposer(); } if (!liste.hidden && options.length) { e.preventDefault(); choisir(options[actif >= 0 ? actif : 0]); } }
    else if (e.key === 'Escape') { if (!liste.hidden) { e.preventDefault(); fermer(); } }
  });
  /* en quittant la plaque sans choisir, la commune déjà choisie revient : le panneau et le prix disent la même chose */
  champ.addEventListener('blur', () => setTimeout(() => { if (document.activeElement === champ) return; fermer(); plaque.classList.remove('pm-plaque--active'); if (etat.commune) { champ.value = etat.commune[0]; plaque.classList.add('pm-plaque--ecrite'); poserNom(false); } }, 120));
  /* la saisie en capitales, à la taille qui tient dans la plaque */
  function taillerSaisie() {
    const w = champ.clientWidth - 12; if (!w) return;
    if (!toile) toile = document.createElement('canvas').getContext('2d');
    const max = Math.min(30, champ.clientHeight * .62);
    toile.font = `700 ${max}px ${getComputedStyle(champ).fontFamily}`;
    const lg = toile.measureText((champ.value || '').toUpperCase()).width * 1.05;
    /* 16 px au moins : en dessous, Safari sur iPhone agrandit la page au focus */
    champ.style.fontSize = (lg > w ? Math.max(16, max * w / lg) : max).toFixed(1) + 'px';
  }

  /* --- le nom posé sur la plaque, le département en petit dessous --- */
  function poserNom(anime) {
    if (!etat.commune) { plaque.classList.remove('pm-plaque--posee'); return; }
    ajusterNom(nomPlaque, etat.commune[0], plaque.clientWidth - 56, plaque.clientHeight - 44);
    depPlaque.textContent = departement(etat.commune);
    plaque.classList.add('pm-plaque--posee');
    if (anime && !reduit()) { plaque.classList.remove('pm-plaque--pose'); void plaque.offsetWidth; plaque.classList.add('pm-plaque--pose'); }
  }
  function choisir(c) {
    cancelAnimationFrame(raf); raf = 0; fermer();
    etat.commune = c; champ.value = c[0]; plaque.classList.add('pm-plaque--ecrite');
    etat.saisie = null; habIn.value = '';
    if (c[3] === null) {
      etatTxt.textContent = `La population de ${c[0]} n’est pas dans la liste. Saisissez le nombre d’habitants.`;
      ouvrirSaisie(true); poserNom(true); rendre(); return;
    }
    saisie.hidden = true; bascule.setAttribute('aria-expanded', 'false'); etatTxt.textContent = '';
    poserNom(true); rendre(true);
  }
  /* --- la saisie du nombre d'habitants : le repli sans commune, et la correction par la mairie --- */
  function ouvrirSaisie(focus) { saisie.hidden = false; bascule.setAttribute('aria-expanded', 'true'); if (focus) habIn.focus(); requestAnimationFrame(() => dessinerPoteau(zonePoteau, false).catch(() => {})); }
  bascule.addEventListener('click', () => { if (saisie.hidden) ouvrirSaisie(true); else { saisie.hidden = true; bascule.setAttribute('aria-expanded', 'false'); requestAnimationFrame(() => dessinerPoteau(zonePoteau, false).catch(() => {})); } });
  corriger.addEventListener('click', () => { if (etat.commune && etat.commune[3] !== null && !habIn.value) habIn.placeholder = nombre(etat.commune[3]).replace(/\s/g, ' '); corriger.hidden = true; ouvrirSaisie(true); });
  habIn.addEventListener('input', () => {
    const brut = habIn.value.replace(/[\s  .]/g, '');
    if (!brut) { etat.saisie = null; etatTxt.textContent = ''; rendre(); return; }
    const n = /^\d{1,8}$/.test(brut) ? lireNombre(brut) : null;
    if (n === null) { etatTxt.textContent = `Un nombre entier de 1 à ${nombre(HAB_MAX)}, sans lettres, par exemple 12 400.`; if (etat.saisie !== null) { etat.saisie = null; rendre(); } return; }
    etatTxt.textContent = '';
    const premiere = habitants() === null; etat.saisie = n; rendre(premiere);
  });

  /* --- les options et la question du site --- */
  hote.querySelectorAll('[data-opt]').forEach(c => c.addEventListener('change', () => { etat[c.dataset.opt] = c.checked; rendre(); }));
  hote.querySelectorAll(`input[name="${id}-site"]`).forEach(r => r.addEventListener('change', () => { if (r.checked) { etat.site = r.value; rendre(); } }));

  /* --- l'état écrit dans le bloc --- */
  const habitants = () => (etat.saisie !== null ? etat.saisie : etat.commune && etat.commune[3] !== null ? etat.commune[3] : null);
  const indiquee = () => etat.saisie !== null;
  const nomBloc = () => (etat.commune ? etat.commune[0] : 'votre commune');
  function texteOptions(c) {
    /* WhatsApp et Messenger ne sont pas encore en service (« Bientôt » sur leurs pages) : la feuille et le message le disent */
    const noms = [etat.whatsapp && 'WhatsApp (bientôt)', etat.messenger && 'Messenger (bientôt)'].filter(Boolean);
    if (c.comprises) return 'WhatsApp et Messenger (bientôt), comprises';
    if (!noms.length) return 'aucune';
    return `${noms.join(' et ')}, ${ht(c.options)} par mois`;
  }
  /* le lien : le code INSEE, ou le nombre indiqué par la mairie à sa place (consigne de 16 h 40) */
  function lienPartage() {
    const p = new URLSearchParams();
    if (indiquee()) p.set('habitants', String(etat.saisie)); else if (etat.commune) p.set('commune', etat.commune[1]);
    p.set('whatsapp', etat.whatsapp ? '1' : '0'); p.set('messenger', etat.messenger ? '1' : '0'); p.set('site', etat.site);
    return `${location.origin}${location.pathname}?${p.toString()}#prix`;
  }
  function texteEstimation(c) {
    const h = habitants(), nom = etat.commune ? `${nomCommune(etat.commune)}, INSEE ${etat.commune[1]}` : 'non nommée';
    const l = ['Demande de devis sur estimation.', `Commune : ${nom}`, `Population : ${habitantsTexte(h)} (${indiquee() ? 'indiquée par la mairie' : 'INSEE 2023'})`];
    if (c.devis) l.push(`Prix : sur devis, au-delà de ${nombre(GRILLE.plafond)} habitants`);
    else {
      l.push(`Options : ${texteOptions(c)}`);
      l.push(`Abonnement : ${ht(c.mensuel)} par mois`);
      l.push(`${MISE} : ${ht(c.mise)}`);
      l.push(`Collecte : ${c.collecte ? ht(c.collecte) : 'aucune, site à jour'}`);
    }
    l.push(`Lien : ${lienPartage()}`);
    return l.join('\n');
  }
  /* les lignes écrites à la main pendant la scène de la lettre (dd invisibles, sur toute la largeur de la ligne) */
  function ecrireMain(c) {
    const m = (k, t) => { const e = q(`[data-main="${k}"]`); if (e) e.textContent = t; };
    m('commune', etat.commune ? `${nomCommune(etat.commune)}, ${habitantsTexte(habitants())}` : habitantsTexte(habitants()));
    m('abo', c.devis ? '' : `Abonnement : ${ht(c.mensuel)} par mois`);
    m('mise', c.devis ? '' : `${MISE} : ${ht(c.mise)}`);
    m('collecte', c.devis || !c.collecte ? '' : `Collecte : ${ht(c.collecte)}`);
    m('premiere', c.devis ? '' : `Première année : ${ht(c.premiere)}`);
    m('devis', c.devis ? 'Prix sur devis, rendez-vous de trente minutes' : '');
  }

  /* la suite des scènes, une chose à la fois ; une nouvelle commune interrompt la suite en cours. Un appel qui n'est pas
     une nouvelle commune (option, site, correction) pose tout l'état final sur-le-champ : une suite interrompue ne laisse
     jamais une scène cachée */
  /* le sceau : il s'abat pour une nouvelle commune, il se retampe quand le prix change (option, site, correction) */
  let sceauCle = '';
  function graver(c, nouvelle) {
    q('[data-mensuel]').textContent = c.devis ? 'Sur devis' : euros(c.mensuel); q('[data-unite]').textContent = c.devis ? '' : 'HT par mois';
    const cle = `${c.devis ? 'devis' : c.mensuel}|${nomBloc()}`;
    if (cle === sceauCle && !sceau.hasAttribute('hidden')) return;
    const premier = sceau.hasAttribute('hidden') || nouvelle; sceauCle = cle;
    tamponRond(sceau, { haut: etat.commune ? etat.commune[0] : 'Votre commune', centre: c.devis ? 'SUR DEVIS' : ht(c.mensuel), sous: c.devis ? '' : 'par mois', devis: c.devis });
    sceau.toggleAttribute('hidden', false); sceauVide.toggleAttribute('hidden', true);
    frapper(sceau, !premier);
  }
  async function jouer(c, nouvelle) {
    const g = ++generation, encore = () => g === generation, anime = nouvelle && !reduit();
    zoneMise.hidden = !!c.devis; zoneFeuille.hidden = false; note.hidden = indiquee(); pop.hidden = false;
    if (nouvelle) { sceau.toggleAttribute('hidden', true); sceauVide.toggleAttribute('hidden', false); sceauCle = ''; q('[data-mensuel]').textContent = ''; }
    if (anime) {
      pop.classList.remove('pm-pop--ecrit'); void pop.offsetWidth;
      /* le poteau et la terre se redessinent tout de suite à la nouvelle hauteur : aucun trait ne traverse le texte */
      requestAnimationFrame(() => dessinerPoteau(zonePoteau, false).catch(() => {}));
      await attendre(240); if (!encore()) return;
      pop.classList.add('pm-pop--ecrit');
      await attendre(460); if (!encore()) return;
    } else pop.classList.add('pm-pop--ecrit');
    graver(c, nouvelle);
    if (anime) { await attendre(620); if (!encore()) return; }
    sousBorne.hidden = false;
    hote.querySelectorAll('[data-plaque-opt], [data-site]').forEach(pl => { pl.hidden = !!c.devis; });
    await new Promise(r => requestAnimationFrame(r));
    if (anime) { await dessinerPoteau(zonePoteau, true).catch(() => {}); if (!encore()) return; }
    else dessinerPoteau(zonePoteau, false).catch(() => {});
    const cleChemin = c.devis ? '' : `${c.collecte ? 1 : 0}`;
    if (cleChemin && cheminFait !== cleChemin) { const avant = cheminFait; cheminFait = cleChemin; if (avant) dessinerChemin(route, cleChemin === '1', cleChemin === '1').catch(montrerChemin); else quandVisible(route, () => dessinerChemin(route, true).catch(montrerChemin)); }
    if (!feuillePosee) { feuillePosee = true; quandVisible(feuille, () => feuille.classList.add('pm-feuille--posee'), .12); }
  }
  /* si le dessin du chemin échoue (plume.js introuvable), les lettres et les noms des étapes restent lisibles */
  const montrerChemin = () => route.querySelectorAll('.pm-etape__borne > span, .pm-etape__nom, .pm-tampon').forEach(e => { e.style.opacity = '1'; });
  const visibles = new WeakMap();
  function quandVisible(e, f, seuil = .3) {
    if (!('IntersectionObserver' in window) || reduit()) { requestAnimationFrame(f); return; }
    const avant = visibles.get(e); if (avant) avant.disconnect();
    const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { io.disconnect(); visibles.delete(e); f(); } }, { threshold: seuil });
    visibles.set(e, io); requestAnimationFrame(() => io.observe(e));
  }

  function rendre(nouvelle) {
    const h = habitants();
    if (h === null) {
      generation++; clearTimeout(annonceT); q('[data-annonce]').textContent = ''; pop.hidden = true; sousBorne.hidden = true; zoneMise.hidden = true; zoneFeuille.hidden = true; note.hidden = true; sceau.toggleAttribute('hidden', true); sceauVide.toggleAttribute('hidden', false); sceauCle = '';
      hote.querySelectorAll('[data-plaque-opt], [data-site]').forEach(p => { p.hidden = true; p.style.opacity = '0'; delete p.dataset.dessinee; });
      q('[data-mensuel]').textContent = ''; q('[data-unite]').textContent = '';
      requestAnimationFrame(() => dessinerPoteau(zonePoteau, false).catch(() => {})); return;
    }
    const c = calculer(h, etat), G = GRILLE;
    if (form.classList.contains('envoye')) {
      /* une estimation déjà partie : la feuille se réarme pour la nouvelle */
      form.classList.remove('envoye'); form.hidden = true; bloc.hidden = true; bloc.replaceChildren(); bloc.classList.remove('envoi--echec', 'lettre-pose');
      recevoir.hidden = false; recevoir.setAttribute('aria-expanded', 'false'); form.querySelector('[type="submit"]').disabled = false;
    }
    q('[data-habitants]').textContent = habitantsTexte(h);
    q('[data-ast]').hidden = indiquee();
    q('[data-source]').textContent = indiquee() ? 'population indiquée par vous' : 'population municipale INSEE';
    corriger.hidden = !etat.commune || etat.commune[3] === null || !saisie.hidden;
    bascule.hidden = !!etat.commune && etat.commune[3] !== null;
    hote.querySelectorAll('[data-chiffre]').forEach(e => { e.hidden = c.devis; });
    q('[data-surdevis]').hidden = !c.devis;
    hote.querySelectorAll('[data-f-chiffre]').forEach(e => { e.hidden = c.devis; });
    q('[data-f-devis]').hidden = !c.devis;
    partager.hidden = c.devis;
    q('[data-f-collecte]').hidden = c.devis || !c.collecte; q('[data-borne-collecte]').hidden = c.devis || !c.collecte;
    q('[data-feuille-titre]').textContent = `Estimation pour ${nomBloc()}`;
    q('[data-f="commune"]').textContent = `${etat.commune ? nomCommune(etat.commune) + ', ' : ''}${habitantsTexte(h)}`;
    q('[data-f="pop-source"]').textContent = indiquee() ? 'population indiquée par vous' : 'population municipale INSEE 2023*';
    recevoir.textContent = c.devis ? 'Prendre rendez-vous, trente minutes' : 'Demander un devis';
    q('[data-form-tete]').textContent = c.devis ? 'Transmettez votre demande, nous revenons vers vous pour fixer une réunion de trente minutes.' : 'Transmettez cette estimation, nous revenons vers vous avec un devis.';
    q('[data-mention]').textContent = c.devis ? 'Une première réunion de trente minutes établit le devis, hors taxes.' : 'Prix estimatifs, hors taxes. Une première réunion de trente minutes les fixe.';
    if (!c.devis) {
      q('[data-annuel]').textContent = euros(c.annuel);
      q('[data-regle]').textContent = regleAbonnement() + (c.auMinimum ? '' : ` Population arrondie ${G.palier === 100 ? 'à la centaine inférieure' : `au palier de ${nombre(G.palier)} habitants inférieur`} : ${nombre(c.palier)}.`) + (c.options ? ` Dont ${ht(c.options)} par mois pour ${c.choisies === 2 ? 'les deux options' : 'l’option'}.` : '');
      hote.querySelectorAll('[data-opt]').forEach(box => {
        const lab = box.closest('label'), b = lab.querySelector('[data-opt-prix]');
        if (c.comprises) { box.checked = true; box.disabled = true; b.textContent = 'comprise'; lab.classList.add('pm-option--comprise'); }
        else { box.disabled = false; box.checked = !!etat[box.dataset.opt]; b.textContent = `${euros(cts(G.option))} par mois`; lab.classList.remove('pm-option--comprise'); }
      });
      const colLi = q('[data-borne-collecte]');
      colLi.hidden = !c.collecte; q('[data-collecte-montant]').textContent = c.collecte ? euros(c.collecte) : '';
      q('[data-collecte-ligne]').hidden = !c.collecte; q('[data-collecte-q]').textContent = c.collecte ? ht(c.collecte) : '';

      q('[data-mise-montant]').textContent = euros(c.mise);
      { const tm = q('[data-tampon-mise]'), avant = tm.dataset.cle, total = c.mise + c.collecte; tm.dataset.cle = `${total}|${c.collecte ? 1 : 0}`;
        tamponRect(tm, { haut: c.collecte ? `${MISE} et collecte` : MISE, centre: ht(total), bas: 'une seule fois' });
        const dont = q('[data-fin-dont]'); dont.hidden = !c.collecte; dont.textContent = c.collecte ? `dont collecte ${ht(c.collecte)}` : '';
        q('[data-fin-total]').textContent = c.collecte ? `. Avec la collecte des informations : ${ht(total)}` : '';
        if (avant && avant !== tm.dataset.cle && cheminFait) frapper(tm, true); }
      const maj = t => t[0].toUpperCase() + t.slice(1);
      q('[data-mise-regle]').textContent = `${maj(regle(G.miseEnService, false))} Facturée une seule fois, à votre validation écrite de la version de référence. Si le site n’est pas à jour ou n’existe pas, la collecte des informations s’ajoute à la mise en service : ${regle(G.collecte, false)}`;
      q('[data-f="abo"]').textContent = `${ht(c.mensuel)} par mois`;
      q('[data-f="abo-an"]').textContent = `soit ${ht(c.annuel)} par an, abonnement annuel`;
      q('[data-f="options"]').textContent = texteOptions(c);
      q('[data-f="mise"]').textContent = `${ht(c.mise)}`;
      q('[data-f-collecte]').hidden = !c.collecte; q('[data-f="collecte"]').textContent = c.collecte ? `${ht(c.collecte)}` : '';
      q('[data-f="premiere"]').textContent = `${ht(c.premiere)}`;
      q('[data-f="ensuite"]').textContent = `${ht(c.ensuite)} par an`;
    }
    if (base && base.source) note.textContent = base.source;
    jouer(c, !!nouvelle);
    clearTimeout(annonceT);
    annonceT = setTimeout(() => {
      q('[data-annonce]').textContent = c.devis ? `${nomBloc()}, ${habitantsTexte(h)} : le prix s’établit sur devis.`
        : `${nomBloc()}, ${habitantsTexte(h)}. Abonnement estimé : ${ht(c.mensuel)} par mois, soit ${ht(c.annuel)} par an. ${MISE} : ${ht(c.mise)}${c.collecte ? `. Collecte : ${ht(c.collecte)}` : ''}. Première année : ${ht(c.premiere)}.`;
    }, 500);
    copieTxt.textContent = '';
  }

  /* --- les bornes des étapes : la phrase complète au survol, au focus ou au toucher --- */
  hote.querySelectorAll('.pm-etape__nom[aria-expanded]').forEach(b => b.addEventListener('click', () => {
    const ouvert = b.getAttribute('aria-expanded') === 'true';
    hote.querySelectorAll('.pm-etape__nom[aria-expanded="true"]').forEach(x => x.setAttribute('aria-expanded', 'false'));
    b.setAttribute('aria-expanded', String(!ouvert));
  }));

  hote.addEventListener('keydown', e => { if (e.key === 'Escape') hote.querySelectorAll('.pm-etape__nom[aria-expanded="true"]').forEach(x => x.setAttribute('aria-expanded', 'false')); });

  /* --- le redessin quand la largeur change (sans animation) --- */
  if ('ResizeObserver' in window) {
    let largeur = 0, t = 0;
    new ResizeObserver(es => {
      const w = Math.round(es[0].contentRect.width); if (w === largeur) return; largeur = w; clearTimeout(t);
      t = setTimeout(() => {
        if (dejaVu) dessinerPlaque(plaque, false).catch(() => {});
        if (dejaVu) dessinerPoteau(zonePoteau, false).catch(() => {});
        if (cheminFait && !zoneMise.hidden) dessinerChemin(route, false).catch(montrerChemin);
        if (etat.commune && plaque.classList.contains('pm-plaque--posee')) poserNom(false);
        taillerSaisie();
      }, 160);
    }).observe(hote);
  }

  /* --- « Partager cette estimation » : un lien qui rouvre le bloc dans le même état --- */
  partager.addEventListener('click', async () => {
    const lien = lienPartage();
    let ok = false;
    try { await navigator.clipboard.writeText(lien); ok = true; } catch (e) {
      try { const t = document.createElement('textarea'); t.value = lien; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(t); t.select(); ok = document.execCommand('copy'); t.remove(); } catch (e2) { ok = false; }
    }
    copieTxt.textContent = ok ? 'Lien copié.' : `Copiez ce lien\u00a0: ${lien}`;
  });

  /* --- « Demander un devis » : la feuille part, et devient la lettre --- */
  recevoir.addEventListener('click', () => {
    const ouvert = !form.hidden;
    form.hidden = ouvert; recevoir.setAttribute('aria-expanded', String(!ouvert));
    if (!ouvert) { pages().catch(() => {}); q(`#${id}-nom`).focus(); }
  });
  const verifier = c => {
    const err = c.parentElement.querySelector('.pm-erreur'); let m = '';
    if (!c.value.trim()) m = c.type === 'email' ? 'Indiquez votre courriel, pour que nous puissions vous répondre.' : 'Indiquez votre nom.';
    else if (c.type === 'email' && !COURRIEL.test(c.value.trim())) m = 'Cette adresse ne semble pas complète, par exemple prenom.nom@mairie.fr.';
    c.setAttribute('aria-invalid', m ? 'true' : 'false'); if (err) err.textContent = m; return !m;
  };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.dataset.enCours) return;
    const nomC = q(`#${id}-nom`), melC = q(`#${id}-mel`), motC = q(`#${id}-mot`), potC = q(`#${id}-pot`);
    form.dataset.tente = '1';
    const ko = [nomC, melC].filter(c => !verifier(c)); if (ko.length) { ko[0].focus(); return; }
    const h = habitants(); if (h === null) return;
    const c = calculer(h, etat);
    const texte = texteEstimation(c) + (motC.value.trim() ? `\n\nMessage : ${motC.value.trim()}` : '');
    const sujet = `Demande de devis : ${etat.commune ? nomCommune(etat.commune) : nombre(h) + ' habitants'}`;
    const donnees = new FormData();
    donnees.set('name', nomC.value.trim()); donnees.set('email', melC.value.trim()); donnees.set('message', texte);
    donnees.set('city', etat.commune ? nomCommune(etat.commune) : ''); donnees.set('population', String(h)); if (etat.commune) donnees.set('insee', etat.commune[1]);
    donnees.set('_subject', sujet); donnees.set('_replyto', melC.value.trim());
    if (potC.value) donnees.set('_gotcha', potC.value);
    form.dataset.enCours = '1'; form.setAttribute('aria-busy', 'true');
    const bouton = form.querySelector('[type="submit"]'), avant = bouton.textContent; bouton.disabled = true; bouton.textContent = 'Envoi…';
    let m = null; try { m = await Promise.race([pages(), new Promise(ok => setTimeout(() => ok(null), 4000))]); } catch (err) { m = null; }
    ecrireMain(c);
    const champs = ['commune', 'abo', 'mise', 'collecte', 'premiere', 'devis'].map(k => q(`[data-main="${k}"]`)).filter(d => d && d.textContent.trim() && !d.closest('[hidden]'));
    champs.push(nomC, melC); if (motC.value.trim()) champs.push(motC);
    let ok;
    if (m && m.envoyerAvecLettre) ok = await m.envoyerAvecLettre(form, ENVOI, donnees, { bloc, carte: feuille, tenir: feuille, champs });
    else ok = await envoyerSeul(ENVOI, donnees);
    delete form.dataset.enCours; form.removeAttribute('aria-busy');
    bouton.textContent = avant; bouton.disabled = !!ok;
    const etatEnvoi = m && m.etatEnvoi ? m.etatEnvoi : etatSimple;
    if (ok) {
      form.classList.add('envoye'); recevoir.hidden = true;
      if (m && typeof m.signalerDemande === 'function') try { m.signalerDemande(form, 'estimation'); } catch (err) { /* rien */ }
      etatEnvoi(bloc, 'reussite', { voix: 'nous', titre: 'Merci, votre demande de devis est partie.', texte: 'Une première réunion de trente minutes fixe le devis.' });
      if (m && m.poserVignette) m.poserVignette(bloc);
    } else etatEnvoi(bloc, 'echec', { voix: 'nous', sujet, corps: c.devis ? `Demande de devis sur estimation, au-delà de ${nombre(GRILLE.plafond)} habitants. ${lienPartage()}` : `Demande de devis sur estimation : ${ht(c.mensuel)} par mois, mise en service ${ht(c.mise)}${c.collecte ? `, collecte ${ht(c.collecte)}` : ''}. ${lienPartage()}` });
  });
  [q(`#${id}-nom`), q(`#${id}-mel`)].forEach(c => {
    /* à la sortie du champ, seulement après un premier essai d'envoi : un message qui apparaît au moment du clic sur
       « Envoyer » décalerait le bouton sous le doigt */
    c.addEventListener('blur', () => { if (c.value && form.dataset.tente) verifier(c); });
    c.addEventListener('input', () => { if (c.getAttribute('aria-invalid') === 'true') verifier(c); });
  });

  /* --- un lien partagé : ?commune=69243&whatsapp=1&messenger=0&site=non, ou ?habitants=11200 (paramètres faux : ignorés, sans message) --- */
  const p = new URLSearchParams(location.search);
  const code = (p.get('commune') || '').trim().toUpperCase(), habP = (p.get('habitants') || '').trim();
  if (p.get('whatsapp') === '1') etat.whatsapp = true;
  if (p.get('messenger') === '1') etat.messenger = true;
  if (['oui', 'non', 'aucun'].includes(p.get('site'))) { etat.site = p.get('site'); const r = hote.querySelector(`input[name="${id}-site"][value="${etat.site}"]`); if (r) r.checked = true; }
  const habOk = /^\d{1,8}$/.test(habP) ? lireNombre(habP) : null;
  if (/^(\d{5}|2[AB]\d{3})$/.test(code)) {
    preparer().then(b => {
      if (!b) return;
      const c = b.parCode.get(code);   /* le nom affiché vient toujours du fichier, jamais de l'adresse */
      if (!c) { if (habOk !== null) { etat.saisie = habOk; habIn.value = String(habOk); ouvrirSaisie(false); requestAnimationFrame(() => rendre(true)); } return; }
      etat.commune = c; champ.value = c[0]; plaque.classList.add('pm-plaque--ecrite');
      if (habOk !== null) { etat.saisie = habOk; habIn.value = String(habOk); ouvrirSaisie(false); }
      else if (c[3] === null) { etatTxt.textContent = `La population de ${c[0]} n’est pas dans la liste. Saisissez le nombre d’habitants.`; ouvrirSaisie(false); }
      requestAnimationFrame(() => { poserNom(true); rendre(true); });
    });
  } else if (habOk !== null) { etat.saisie = habOk; habIn.value = String(habOk); ouvrirSaisie(false); entrer(); requestAnimationFrame(() => rendre(true)); }
}

/* l'envoi sans la lettre (pages.js introuvable) : même requête, même délai de 15 s */
async function envoyerSeul(url, donnees) {
  const ctl = 'AbortController' in window ? new AbortController() : null, t = ctl ? setTimeout(() => ctl.abort(), 15000) : 0;
  try { const r = await fetch(url, { method: 'POST', body: donnees, headers: { Accept: 'application/json' }, signal: ctl ? ctl.signal : undefined }); return r.ok; }
  catch (e) { return false; } finally { clearTimeout(t); }
}
function etatSimple(bloc, etat, o = {}) {
  const p1 = el('p', 'envoi__t'), p2 = el('p');
  if (etat === 'reussite') { p1.textContent = o.titre || ''; p2.textContent = o.texte || ''; }
  else {
    /* P3 (partie 5) : la même phrase d'échec que les formulaires des pages (commun/pages/pages.js) */
    p1.textContent = 'Le message n’est pas parti.';
    const a = el('a', 'lien', 'Envoyer par courriel à contact@civik-ia.fr'); a.href = `mailto:contact@civik-ia.fr?subject=${encodeURIComponent(o.sujet || '')}&body=${encodeURIComponent(o.corps || '')}`;
    p2.append('Vérifiez votre connexion et réessayez, ou envoyez-le par courriel\u00a0: il est déjà écrit. ', a);
  }
  bloc.replaceChildren(p1, p2); bloc.hidden = false; bloc.setAttribute('tabindex', '-1'); bloc.focus();
}

/* la grille en clair de la page (cellules [data-grille]) réécrite depuis GRILLE : la page et le calcul ne divergent pas */
function remplirGrille(racine) {
  racine.querySelectorAll('[data-grille]').forEach(td => {
    const [ligne, quoi] = td.dataset.grille.split('-'), l = GRILLE[ligne];
    if (!l || typeof l !== 'object' || !('forme' in l)) return;
    const unite = ligne === 'abonnement' ? ' HT par mois' : ' HT';
    if (quoi === 'regle') td.textContent = regle(l, ligne === 'abonnement');
    else if (/^\d+$/.test(quoi)) td.textContent = euros(prixParPalier(l, Number(quoi))) + unite;
  });
}

/* ---------- démarrage : chaque bloc [data-prix-marianne] de la page ---------- */
/* data-sans-grille sur le conteneur : la grille en clair n'est pas montrée (page principale de Marianne) */
function demarrer() {
  document.querySelectorAll('[data-prix-marianne]').forEach(r => {
    if (r.hasAttribute('data-sans-grille')) r.querySelectorAll('.pm-grille').forEach(g => g.remove()); else remplirGrille(r);
    monter(r);
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer, { once: true }); else demarrer();
