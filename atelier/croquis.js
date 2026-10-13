/* =====================================================================
   L'atelier : les croquis à la plume (maquette du 06/10/2026).
   Tous les dessins de la page partagent la plume du film (copie dans
   commun/pages/plume.js) : le gabarit qui se construit brique par brique
   sur la page blanche, les vignettes de la méthode, les réalisations.
   Les coordonnées de la page blanche sont celles d'une feuille de
   1000 x 690 unités ; la colonne de droite (x 720 à 955) porte le
   cartouche, l'idée et la date.
   Première passe (06/10/2026) : la fiche de Marianne (AT-2), les états
   1 à 3 de la méthode (AT-3), le crayon de la planche du haut (AT-1 bis).
   ===================================================================== */
import { Dessin, ligne, arcE, perimetre, formeMain, hachures, gribouillis, catmull, rng, clamp, lerp, echantillonnerChemin, GLYPHE } from '../commun/pages/plume.js';

export const ENCRE = '#16205C';
export const FEUILLE = { w: 1000, h: 690 };
const GROS = { wMin: .8, wMax: 2.6, tremble: .5, op: .9 }, DET = { wMin: .5, wMax: 1.7, tremble: .45, op: .88 }, FIN = { wMin: .4, wMax: 1.1, tremble: .35, op: .8 }, CONS = { profil: 'fin', wMin: .3, wMax: .7, tremble: .2, op: .26, vitesse: .4, levee: 3 };
let K = 1;   /* tremblement global (vignettes de la méthode : plus ou moins « au propre ») */
const s = (base, o) => { const r = Object.assign({}, base, { phase: 'p' }, o); if (r.tremble) r.tremble *= K; return r; };
const boite = (D, x, y, w, h, r, g, st = DET, o = {}) => formeMain(D, perimetre(x, y, w, h, r), s(st, Object.assign({ graine: g }, o)));
const trait = (D, P, g, st = DET, o = {}) => D.trait(P, s(st, Object.assign({ graine: g }, o)));
const lignes = (D, x, y, w, n, g, h = 4) => { for (let i = 0; i < n; i++) gribouillis(D, x, y + i * (h * 3.6), w * (i === n - 1 ? .62 : 1), h, { phase: 'p', wMin: .35, wMax: 1, op: .66, graine: g + i }); };
const etiquette = (D, x, y, txt, o = {}) => D.texte(x, y, txt, Object.assign({ phase: 'p', taille: 11.5, op: .55 }, o));
function pointilles(D, x, y, w, h, g) {
  const P = perimetre(x, y, w, h, 8), n = P.length, R = rng(g);
  for (let i = 0; i < n - 6; i += 9) D.trait(P.slice(i, i + 5), { phase: 'p', profil: 'fin', wMin: .3, wMax: .6, op: .2, tremble: 0, vitesse: .3, levee: 1, graine: g + i });
}
function croix(D, x, y, w, h, g) { trait(D, ligne(x, y, x + w, y + h), g, CONS, { op: .38 }); trait(D, ligne(x + w, y, x, y + h), g + 1, CONS, { op: .38 }); }
function ombre(D, x, y, w, h, g) { hachures(D, [[x + w + 1, y + 10], [x + w + 9, y + 18], [x + w + 9, y + h + 8], [x + 14, y + h + 8], [x + 6, y + h + 1], [x + w + 1, y + h + 1]], { phase: 'p', pas: 3.4, long: [8, 18], op: .36, graine: g }); }
function glyphe(D, cx, cy, r, g) {
  D.trait(arcE(cx, cy, r, r, -.4, Math.PI * 2 - .1), s(DET, { graine: g }));
  const S = r * 1.15 / 439, ox = cx - 219.5 * S, oy = cy - 225 * S;
  ['g', 'd', 'f'].forEach((k, i) => formeMain(D, echantillonnerChemin(GLYPHE[k], 3).map(([x, y]) => [ox + x * S, oy + y * S]), s(FIN, { graine: g + 3 + i, wMax: .9 })));
}

/* ---------------------------------------------------------------------
   L'emblème selon « pour qui »
   --------------------------------------------------------------------- */
export const QUI = { mairie: { lab: 'une mairie', nom: 'VOTRE COMMUNE' }, sante: { lab: 'un acteur de santé', nom: 'VOTRE ÉTABLISSEMENT' }, entreprise: { lab: 'une entreprise', nom: 'VOTRE ENTREPRISE' }, association: { lab: 'une association', nom: 'VOTRE ASSOCIATION' } };
function embleme(D, qui, x, y, t, g) {
  if (qui === 'mairie') {
    const P = [[x, y], [x + t, y], [x + t, y + t * .5]].concat(catmull([[x + t, y + t * .5], [x + t * .94, y + t * .8], [x + t * .72, y + t * .98], [x + t * .5, y + t * 1.08]], 4)).concat(catmull([[x + t * .5, y + t * 1.08], [x + t * .28, y + t * .98], [x + t * .06, y + t * .8], [x, y + t * .5]], 4)).concat([[x, y]]);
    trait(D, P, g, DET, { wMax: 1.5 });
    trait(D, [[x + t * .3, y + t * .92], [x + t * .3, y + t * .5], [x + t * .4, y + t * .5], [x + t * .4, y + t * .4], [x + t * .6, y + t * .4], [x + t * .6, y + t * .5], [x + t * .7, y + t * .5], [x + t * .7, y + t * .9]], g + 1, FIN);
  } else if (qui === 'sante') {
    boite(D, x, y + t * .28, t, t * .72, 2, g, DET, { wMax: 1.4 });
    trait(D, [[x - t * .08, y + t * .3], [x + t * .5, y], [x + t * 1.08, y + t * .3]], g + 1, DET, { wMax: 1.4 });
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) boite(D, x + t * (.14 + i * .27), y + t * (.42 + j * .26), t * .16, t * .14, 1, g + 3 + i * 2 + j, FIN, { wMax: .8 });
  } else if (qui === 'entreprise') {
    boite(D, x, y, t, t, 4, g, DET, { wMax: 1.5 });
    trait(D, [[x + t * .22, y + t * .74], [x + t * .22, y + t * .26], [x + t * .5, y + t * .6], [x + t * .78, y + t * .26], [x + t * .78, y + t * .74]], g + 1, FIN);
  } else {
    D.trait(arcE(x + t / 2, y + t / 2, t / 2, t / 2, 0, Math.PI * 2.05), s(DET, { graine: g, wMax: 1.5 }));
    D.trait(arcE(x + t / 2, y + t / 2, t * .32, t * .32, 0, Math.PI * 2.05), s(FIN, { graine: g + 1 }));
    trait(D, [[x + t * .5, y + t * .26], [x + t * .58, y + t * .44], [x + t * .76, y + t * .46], [x + t * .62, y + t * .58], [x + t * .66, y + t * .76], [x + t * .5, y + t * .66], [x + t * .34, y + t * .76], [x + t * .38, y + t * .58], [x + t * .24, y + t * .46], [x + t * .42, y + t * .44], [x + t * .5, y + t * .26]], g + 2, FIN, { wMax: .8 });
  }
}

/* ---------------------------------------------------------------------
   Les briques par type de projet (libellé de la puce, libellé du dessin)
   --------------------------------------------------------------------- */
export const BRIQUES = {
  site: [['pages', 'Des pages'], ['actualites', 'Actualités'], ['agenda', 'Agenda'], ['formulaires', 'Formulaires'], ['paiement', 'Paiement en ligne'], ['adherents', 'Espace adhérents'], ['langues', 'Plusieurs langues'], ['marianne', 'Marianne intégrée']],
  app: [['fil', 'Un fil commun'], ['infos', 'Informations pratiques'], ['evenements', 'Événements'], ['votes', 'Votes et assemblées'], ['cotisations', 'Cotisations'], ['annuaire', 'Annuaire des membres'], ['notifications', 'Notifications'], ['marianne', 'Marianne intégrée']],
  logiciel: [['tableau', 'Tableau de bord'], ['dossiers', 'Suivi de dossiers'], ['planning', 'Planning'], ['automatisations', 'Automatisations'], ['assistant', "Assistant d'IA sur vos documents"], ['exports', 'Exports et rapports'], ['roles', 'Accès par rôle']],
  autre: [['site', 'Un site'], ['app', 'Une application'], ['donnees', 'Des données à rassembler'], ['ia', "De l'intelligence artificielle"], ['paiement', 'Des paiements'], ['interne', 'Un outil interne'], ['inconnu', 'Je ne sais pas encore']]
};
export const TYPES = { site: { lab: 'Site web', titre: 'Votre site' }, app: { lab: 'Application', titre: 'Votre application' }, logiciel: { lab: 'Logiciel sur mesure', titre: 'Votre logiciel' }, autre: { lab: 'Autre projet', titre: 'Votre idée' } };

/* ---------------------------------------------------------------------
   Le site : fenêtre X 60, Y 120, 630 x 540
   --------------------------------------------------------------------- */
const SX = 60, SY = 120, SW = 630, SH = 540;
const cartesSite = (() => { const cw = (SW - 32 - 28) / 3, ch = 118, out = {}; ['actualites', 'agenda', 'formulaires', 'paiement', 'adherents', 'langues'].forEach((k, i) => { out[k] = [SX + 16 + (i % 3) * (cw + 14), SY + 262 + Math.floor(i / 3) * (ch + 14), cw, ch]; }); return out; })();
function cadreSite(D, o = {}) {
  const X = SX, Y = SY, W = o.W || SW, H = o.H || SH;
  boite(D, X, Y, W, H, 14, 1, GROS);
  trait(D, ligne(X, Y + 30, X + W, Y + 30), 2, DET);
  [16, 32, 48].forEach((dx, i) => D.trait(arcE(X + dx, Y + 15, 5, 5, 0, Math.PI * 2.1), s(FIN, { graine: 3 + i })));
  boite(D, X + 76, Y + 9, 250, 13, 6, 6, FIN);
  if (o.url) etiquette(D, X + 88, Y + 20, o.url, { taille: 10, op: .55, telle: true, espace: .02 });
  trait(D, ligne(X + 16, Y + 88, X + W - 16, Y + 88), 7, FIN);
  gribouillis(D, X + 66, Y + 66, 170, 6, { phase: 'p', wMin: .5, wMax: 1.6, op: .8, graine: 8 });
  boite(D, X + 16, Y + 100, W - 32, 148, 10, 9, DET);
  croix(D, X + W / 2 + 10, Y + 108, W / 2 - 34, 132, 10);
  trait(D, ligne(X + 40, Y + 148, X + 262, Y + 148), 12, DET, { wMax: 2.6 });
  trait(D, ligne(X + 40, Y + 172, X + 220, Y + 172), 13, DET, { wMax: 2.6 });
  gribouillis(D, X + 40, Y + 198, 200, 4, { phase: 'p', wMin: .35, wMax: 1, op: .6, graine: 14 });
  trait(D, ligne(X + 16, Y + H - 20, X + W - 16, Y + H - 20), 15, FIN);
  if (!o.sansCases) Object.values(cartesSite).forEach(([x, y, w, h], i) => pointilles(D, x, y, w, h, 20 + i * 7));
  ombre(D, X, Y, W, H, 60);
}
const BRIQUE_SITE = {
  pages(D) { [0, 1, 2, 3].forEach(i => trait(D, ligne(SX + 330 + i * 72, SY + 60, SX + 382 + i * 72, SY + 60), 100 + i, DET, { wMax: 1.4 })); trait(D, ligne(SX + 330, SY + 70, SX + 382, SY + 70), 105, FIN, { op: .5 }); etiquette(D, SX + 330, SY + 46, 'PAGES'); },
  actualites(D) { const [x, y, w, h] = cartesSite.actualites; boite(D, x, y, w, h, 8, 110); boite(D, x + 10, y + 10, w - 20, 50, 4, 111, FIN); croix(D, x + 10, y + 10, w - 20, 50, 112); lignes(D, x + 10, y + 84, w - 20, 2, 113); etiquette(D, x + 10, y + 76, 'ACTUALITÉS'); },
  agenda(D) { const [x, y, w, h] = cartesSite.agenda; boite(D, x, y, w, h, 8, 120); etiquette(D, x + 10, y + 22, 'AGENDA'); const cw = (w - 20) / 6; for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) boite(D, x + 10 + c * cw + 2, y + 34 + r * 26, cw - 6, 20, 2, 121 + r * 6 + c, FIN, { wMax: .7, op: .7 }); D.trait(arcE(x + 10 + 3.5 * cw, y + 70, cw * .6, 15, -.3, Math.PI * 2.1), s(DET, { graine: 140, wMax: 1.8 })); },
  formulaires(D) { const [x, y, w, h] = cartesSite.formulaires; boite(D, x, y, w, h, 8, 150); etiquette(D, x + 10, y + 22, 'FORMULAIRES'); boite(D, x + 10, y + 32, w - 20, 20, 5, 151, FIN); boite(D, x + 10, y + 58, w - 20, 20, 5, 152, FIN); boite(D, x + w - 82, y + 86, 72, 22, 11, 153, DET); },
  paiement(D) { const [x, y, w, h] = cartesSite.paiement; boite(D, x, y, w, h, 8, 160); etiquette(D, x + 10, y + 22, 'PAIEMENT'); boite(D, x + 14, y + 36, 92, 58, 7, 161, DET); trait(D, ligne(x + 14, y + 52, x + 106, y + 52), 162, DET, { wMax: 2.4 }); gribouillis(D, x + 22, y + 82, 50, 3, { phase: 'p', wMin: .3, wMax: .9, op: .6, graine: 163 }); D.trait(arcE(x + w - 32, y + 56, 10, 11, Math.PI, Math.PI * 2), s(DET, { graine: 164 })); boite(D, x + w - 46, y + 56, 28, 24, 3, 165, DET); },
  adherents(D) { const [x, y, w, h] = cartesSite.adherents; boite(D, x, y, w, h, 8, 170); etiquette(D, x + 10, y + 22, 'ESPACE ADHÉRENTS'); D.trait(arcE(x + 30, y + 54, 14, 14, 0, Math.PI * 2.1), s(DET, { graine: 171 })); D.trait(arcE(x + 30, y + 88, 22, 14, Math.PI, Math.PI * 2), s(DET, { graine: 172 })); lignes(D, x + 62, y + 48, w - 76, 2, 173); boite(D, x + 62, y + 80, 80, 22, 11, 175, DET); },
  langues(D) { const [x, y, w, h] = cartesSite.langues; boite(D, x, y, w, h, 8, 180); etiquette(D, x + 10, y + 22, 'LANGUES'); ['FR', 'EN', 'ES'].forEach((l, i) => { boite(D, x + 12 + i * 52, y + 42, 42, 28, 6, 181 + i, DET); D.texte(x + 33 + i * 52, y + 61, l, { phase: 'p', taille: 12, ancre: 'middle', op: .7, graisse: 700 }); }); lignes(D, x + 12, y + 92, w - 24, 1, 186); },
  marianne(D) { boite(D, SX + 40, SY + 214, 250, 26, 13, 190, DET); D.trait(arcE(SX + 56, SY + 227, 8, 8, -.3, Math.PI * 2 - .1), s(FIN, { graine: 191 })); gribouillis(D, SX + 72, SY + 232, 150, 3, { phase: 'p', wMin: .3, wMax: .9, op: .6, graine: 192 }); glyphe(D, SX + SW - 40, SY + SH - 62, 20, 193); etiquette(D, SX + SW - 160, SY + SH - 58, 'MARIANNE', { op: .6 }); }
};

/* ---------------------------------------------------------------------
   L'application : téléphone X 170, Y 118, 250 x 548, rangées annotées
   --------------------------------------------------------------------- */
const AX = 170, AY = 118, AW = 250, AH = 548;
const RANGS = ['fil', 'infos', 'evenements', 'votes', 'cotisations', 'annuaire', 'notifications'];
const rang = k => AY + 118 + RANGS.indexOf(k) * 50;
function cadreApp(D) {
  boite(D, AX, AY, AW, AH, 38, 1, GROS);
  boite(D, AX + 10, AY + 10, AW - 20, AH - 20, 30, 2, FIN);
  boite(D, AX + AW / 2 - 34, AY + 20, 68, 14, 7, 3, FIN);
  hachures(D, perimetre(AX + AW / 2 - 32, AY + 22, 64, 10, 5), { phase: 'p', pas: 2.2, long: [6, 12], op: .5, graine: 4, angle: -40 });
  trait(D, ligne(AX + 22, AY + 108, AX + AW - 22, AY + 108), 5, FIN);
  gribouillis(D, AX + 72, AY + 86, 120, 5, { phase: 'p', wMin: .5, wMax: 1.5, op: .8, graine: 6 });
  trait(D, ligne(AX + 18, AY + AH - 62, AX + AW - 18, AY + AH - 62), 7, FIN);
  [0, 1, 2, 3].forEach(i => boite(D, AX + 34 + i * 50, AY + AH - 48, 16, 14, 3, 8 + i, FIN));
  RANGS.forEach((k, i) => pointilles(D, AX + 22, rang(k), AW - 44, 42, 30 + i * 5));
  ombre(D, AX, AY, AW, AH, 60);
}
function rangee(D, k, g, dessin) { const y = rang(k), x = AX + 22, w = AW - 44; boite(D, x, y, w, 42, 9, g); dessin(x, y, w); lignes(D, x + 52, y + 16, w - 64, 2, g + 20, 3); trait(D, ligne(AX + AW + 4, y + 21, AX + AW + 40, y + 21), g + 30, FIN, { op: .6 }); D.trait(arcE(AX + AW + 4, y + 21, 2.5, 2.5, 0, Math.PI * 2.1), s(FIN, { graine: g + 31 })); }
const BRIQUE_APP = {
  fil(D) { rangee(D, 'fil', 200, (x, y) => { D.trait(arcE(x + 22, y + 21, 12, 12, 0, Math.PI * 2.1), s(DET, { graine: 201 })); }); },
  infos(D) { rangee(D, 'infos', 210, (x, y) => { D.trait(arcE(x + 22, y + 21, 12, 12, 0, Math.PI * 2.1), s(DET, { graine: 211 })); trait(D, [[x + 22, y + 13], [x + 22, y + 21], [x + 29, y + 24]], 212, FIN); }); },
  evenements(D) { rangee(D, 'evenements', 220, (x, y) => { boite(D, x + 10, y + 8, 26, 26, 3, 221, DET); trait(D, ligne(x + 10, y + 15, x + 36, y + 15), 222, FIN); }); },
  votes(D) { rangee(D, 'votes', 230, (x, y) => { boite(D, x + 10, y + 14, 26, 20, 2, 231, DET); trait(D, ligne(x + 16, y + 14, x + 30, y + 14), 232, DET, { wMax: 2.2 }); boite(D, x + 15, y + 4, 16, 12, 1, 233, FIN); }); },
  cotisations(D) { rangee(D, 'cotisations', 240, (x, y) => { [0, 1, 2].forEach(i => D.trait(arcE(x + 23, y + 28 - i * 6, 12, 4, 0, Math.PI * 2.05), s(FIN, { graine: 241 + i }))); }); },
  annuaire(D) { rangee(D, 'annuaire', 250, (x, y) => { D.trait(arcE(x + 16, y + 17, 6, 6, 0, Math.PI * 2.1), s(DET, { graine: 251 })); D.trait(arcE(x + 30, y + 17, 6, 6, 0, Math.PI * 2.1), s(DET, { graine: 252 })); D.trait(arcE(x + 23, y + 34, 14, 7, Math.PI, Math.PI * 2), s(FIN, { graine: 253 })); }); },
  notifications(D) { rangee(D, 'notifications', 260, (x, y) => { D.trait(catmull([[x + 12, y + 28], [x + 15, y + 22], [x + 15, y + 14], [x + 23, y + 8], [x + 31, y + 14], [x + 31, y + 22], [x + 34, y + 28], [x + 12, y + 28]], 4), s(DET, { graine: 261 })); D.trait(arcE(x + 32, y + 9, 3.5, 3.5, 0, Math.PI * 2.1), s(DET, { graine: 262, wMax: 2.2 })); }); },
  marianne(D) { glyphe(D, AX + AW - 42, AY + AH - 100, 17, 270); trait(D, ligne(AX + AW + 4, AY + AH - 100, AX + AW + 40, AY + AH - 100), 275, FIN, { op: .6 }); }
};
export const ANNOT_APP = { fil: 'le fil du club', infos: 'horaires, infos', evenements: 'sorties, tournois', votes: 'votes, assemblées', cotisations: 'cotisations', annuaire: 'les membres', notifications: 'les rappels', marianne: 'Marianne' };
export const posAnnotApp = k => [AX + AW + 46, (k === 'marianne' ? AY + AH - 100 : rang(k) + 21) + 7];

/* ---------------------------------------------------------------------
   Le logiciel : fenêtre, barre latérale, six modules
   --------------------------------------------------------------------- */
const LX = 60, LY = 120, LW = 630, LH = 540;
const modules = (() => { const x0 = LX + 146, cw = (LW - 146 - 16 - 14) / 2, ch = 136, out = {}; ['tableau', 'dossiers', 'planning', 'automatisations', 'assistant', 'exports'].forEach((k, i) => { out[k] = [x0 + (i % 2) * (cw + 14), LY + 86 + Math.floor(i / 2) * (ch + 10), cw, ch]; }); return out; })();
function cadreLogiciel(D) {
  boite(D, LX, LY, LW, LH, 12, 1, GROS);
  trait(D, ligne(LX, LY + 30, LX + LW, LY + 30), 2, DET);
  [16, 32, 48].forEach((dx, i) => D.trait(arcE(LX + dx, LY + 15, 5, 5, 0, Math.PI * 2.1), s(FIN, { graine: 3 + i })));
  trait(D, ligne(LX + 130, LY + 30, LX + 130, LY + LH), 6, DET);
  for (let i = 0; i < 5; i++) gribouillis(D, LX + 20, LY + 118 + i * 30, 86, 4, { phase: 'p', wMin: .35, wMax: 1, op: .65, graine: 7 + i });
  trait(D, ligne(LX + 130, LY + 72, LX + LW, LY + 72), 13, FIN);
  boite(D, LX + 146, LY + 42, 200, 20, 10, 14, FIN);
  Object.values(modules).forEach(([x, y, w, h], i) => pointilles(D, x, y, w, h, 20 + i * 7));
  pointilles(D, LX + 14, LY + LH - 118, 102, 104, 70);
  ombre(D, LX, LY, LW, LH, 60);
}
const BRIQUE_LOG = {
  tableau(D) { const [x, y, w, h] = modules.tableau; boite(D, x, y, w, h, 8, 300); etiquette(D, x + 10, y + 20, 'TABLEAU DE BORD'); trait(D, [[x + 14, y + 34], [x + 14, y + h - 14], [x + w - 12, y + h - 14]], 301, FIN); [.4, .7, .5, .9, .65].forEach((v, i) => { const bx = x + 30 + i * 36, bh = (h - 56) * v; boite(D, bx, y + h - 14 - bh, 20, bh, 1, 302 + i, DET, { wMax: 1.3 }); hachures(D, perimetre(bx + 1, y + h - 14 - bh + 1, 18, bh - 2, 1), { phase: 'p', pas: 3, long: [5, 10], op: .45, graine: 310 + i, angle: 45 }); }); },
  dossiers(D) { const [x, y, w, h] = modules.dossiers; boite(D, x, y, w, h, 8, 320); etiquette(D, x + 10, y + 20, 'SUIVI DE DOSSIERS'); trait(D, ligne(x + 10, y + 36, x + w - 10, y + 36), 321, DET); for (let i = 0; i < 4; i++) { const yy = y + 54 + i * 20; D.trait(arcE(x + 18, yy, 3.5, 3.5, 0, Math.PI * 2.1), s(DET, { graine: 322 + i, wMax: 2 })); gribouillis(D, x + 30, yy + 3, w - 96, 3, { phase: 'p', wMin: .3, wMax: .9, op: .6, graine: 330 + i }); trait(D, ligne(x + w - 52, yy, x + w - 14, yy), 340 + i, FIN); } },
  planning(D) { const [x, y, w, h] = modules.planning; boite(D, x, y, w, h, 8, 350); etiquette(D, x + 10, y + 20, 'PLANNING'); const cw = (w - 20) / 7; for (let r = 0; r < 4; r++) trait(D, ligne(x + 10, y + 34 + r * 24, x + w - 10, y + 34 + r * 24), 351 + r, FIN, { op: .45 }); for (let c = 1; c < 7; c++) trait(D, ligne(x + 10 + c * cw, y + 34, x + 10 + c * cw, y + h - 12), 360 + c, FIN, { op: .4 }); [[1, 0, 3], [3, 1, 2], [0, 2, 4]].forEach(([c, r, l], i) => { boite(D, x + 12 + c * cw, y + 38 + r * 24, l * cw - 4, 16, 4, 370 + i, DET); hachures(D, perimetre(x + 13 + c * cw, y + 39 + r * 24, l * cw - 6, 14, 3), { phase: 'p', pas: 2.6, long: [5, 10], op: .45, graine: 380 + i, angle: 60 }); }); },
  automatisations(D) { const [x, y, w, h] = modules.automatisations; boite(D, x, y, w, h, 8, 390); etiquette(D, x + 10, y + 20, 'AUTOMATISATIONS'); const bx = [x + 14, x + w / 2 - 26, x + w - 66]; bx.forEach((xx, i) => boite(D, xx, y + 56 + (i === 1 ? -12 : 10), 52, 34, 6, 391 + i, DET)); [[bx[0] + 52, y + 83, bx[1], y + 61], [bx[1] + 52, y + 61, bx[2], y + 83]].forEach(([a, b, c, d], i) => { trait(D, catmull([[a, b], [(a + c) / 2, (b + d) / 2 - 8], [c, d]], 6), 395 + i, DET); trait(D, [[c - 8, d - 6], [c, d], [c - 9, d + 3]], 397 + i, DET); }); },
  assistant(D) { const [x, y, w, h] = modules.assistant; boite(D, x, y, w, h, 8, 400); etiquette(D, x + 10, y + 20, 'ASSISTANT IA'); boite(D, x + w - 120, y + 32, 106, 26, 12, 401, DET); boite(D, x + 14, y + 66, 140, 36, 12, 402, DET); gribouillis(D, x + 24, y + 82, 110, 3, { phase: 'p', wMin: .3, wMax: .9, op: .6, graine: 403 }); boite(D, x + 14, y + 108, 92, 18, 9, 404, FIN); etiquette(D, x + 22, y + 121, 'SOURCE', { taille: 9, op: .6 }); boite(D, x + w - 52, y + 70, 36, 46, 2, 405, FIN); lignes(D, x + w - 46, y + 84, 24, 3, 406, 2.5); },
  exports(D) { const [x, y, w, h] = modules.exports; boite(D, x, y, w, h, 8, 420); etiquette(D, x + 10, y + 20, 'EXPORTS'); trait(D, [[x + 26, y + 36], [x + 70, y + 36], [x + 84, y + 50], [x + 84, y + 120], [x + 26, y + 120], [x + 26, y + 36]], 421, DET); trait(D, [[x + 70, y + 36], [x + 70, y + 50], [x + 84, y + 50]], 422, FIN); lignes(D, x + 34, y + 66, 40, 4, 423, 3); trait(D, ligne(x + 130, y + 46, x + 130, y + 104), 430, DET, { wMax: 2.2 }); trait(D, [[x + 116, y + 90], [x + 130, y + 106], [x + 144, y + 90]], 431, DET, { wMax: 2.2 }); trait(D, ligne(x + 106, y + 118, x + 154, y + 118), 432, DET); },
  roles(D) { const x = LX + 14, y = LY + LH - 118; boite(D, x, y, 102, 104, 8, 440); etiquette(D, x + 10, y + 20, 'RÔLES'); [0, 1, 2].forEach(i => { D.trait(arcE(x + 22, y + 40 + i * 24, 7, 7, 0, Math.PI * 2.1), s(DET, { graine: 441 + i })); gribouillis(D, x + 36, y + 43 + i * 24, 52, 3, { phase: 'p', wMin: .3, wMax: .9, op: .6, graine: 445 + i }); }); }
};

/* ---------------------------------------------------------------------
   Autre chose : une carte d'idées autour de « votre idée »
   --------------------------------------------------------------------- */
const CX = 375, CY = 392;
const NOEUDS = { site: [168, 214], app: [375, 168], donnees: [586, 214], ia: [612, 410], paiement: [560, 600], interne: [300, 624], inconnu: [128, 520] };
function cadreAutre(D) {
  formeMain(D, arcE(CX, CY, 128, 78, 0, Math.PI * 2), s(GROS, { graine: 1, reprise: true }));
  hachures(D, arcE(CX + 6, CY + 8, 126, 76, .2, Math.PI * .95), { phase: 'p', pas: 4, long: [8, 16], op: .25, graine: 2, angle: 10 });
  Object.entries(NOEUDS).forEach(([k, [x, y]], i) => { const P = arcE(x, y, 82, 30, 0, Math.PI * 2); for (let j = 0; j < P.length - 3; j += 7) D.trait(P.slice(j, j + 4), { phase: 'p', profil: 'fin', wMin: .3, wMax: .6, op: .18, tremble: 0, vitesse: .3, levee: 1, graine: 10 + i * 13 + j }); });
}
function noeud(D, k, lab, g) {
  const [x, y] = NOEUDS[k];
  const dx = x - CX, dy = y - CY, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
  const a = [CX + ux * 128 * Math.abs(ux) + ux * 6, CY + uy * 80], b = [x - ux * 84 * Math.abs(ux), y - uy * 32];
  trait(D, catmull([a, [(a[0] + b[0]) / 2 + uy * 14, (a[1] + b[1]) / 2 - ux * 14], b], 8), g, DET, { wMax: 1.6 });
  formeMain(D, arcE(x, y, 82, 30, 0, Math.PI * 2), s(DET, { graine: g + 1 }));
  D.texte(x, y + 4, lab.toUpperCase(), { phase: 'p', taille: lab.length > 22 ? 9 : 10.5, ancre: 'middle', op: .7, graisse: 600, espace: .08 });
}

/* ---------------------------------------------------------------------
   Fabriques : le cadre d'un type, une brique, l'emblème
   --------------------------------------------------------------------- */
export function dessinCadre(type) {
  const D = new Dessin(null, ENCRE);
  if (type === 'site') cadreSite(D); else if (type === 'app') cadreApp(D); else if (type === 'logiciel') cadreLogiciel(D); else cadreAutre(D);
  D.planifier(); return D;
}
export function dessinBrique(type, k) {
  const D = new Dessin(null, ENCRE);
  if (type === 'site') BRIQUE_SITE[k] && BRIQUE_SITE[k](D);
  else if (type === 'app') BRIQUE_APP[k] && BRIQUE_APP[k](D);
  else if (type === 'logiciel') BRIQUE_LOG[k] && BRIQUE_LOG[k](D);
  else { const lab = (BRIQUES.autre.find(b => b[0] === k) || [k, k])[1]; noeud(D, k, lab, 500 + Object.keys(NOEUDS).indexOf(k) * 10); }
  D.planifier(); return D;
}
export function dessinQui(type, qui) {
  const D = new Dessin(null, ENCRE);
  if (!qui) { D.planifier(); return D; }
  const nom = QUI[qui].nom;
  if (type === 'site') { embleme(D, qui, SX + 24, SY + 42, 34, 600); etiquette(D, SX + 66, SY + 54, nom, { taille: 11, op: .6 }); }
  else if (type === 'app') { embleme(D, qui, AX + 26, AY + 56, 34, 600); etiquette(D, AX + 72, AY + 70, nom, { taille: 9.5, op: .6 }); }
  else if (type === 'logiciel') { embleme(D, qui, LX + 18, LY + 46, 30, 600); etiquette(D, LX + 18, LY + 96, nom.replace('VOTRE ', ''), { taille: 9.5, op: .6 }); }
  else { embleme(D, qui, CX - 17, CY - 62, 30, 600); }
  D.planifier(); return D;
}
/* le cartouche : un cadre, son en-tête, des réglures */
export function dessinCartouche() {
  const D = new Dessin(null, ENCRE), x = 722, y = 120, w = 232, h = 236;
  boite(D, x, y, w, h, 3, 700, DET);
  trait(D, ligne(x, y + 30, x + w, y + 30), 701, DET);
  etiquette(D, x + 10, y + 20, 'Atelier Civik-ia, fig. 1', { taille: 11, op: .6, telle: true, espace: .04, graisse: 600 });
  for (let i = 1; i < 7; i++) trait(D, ligne(x + 8, y + 30 + i * 30, x + w - 8, y + 30 + i * 30), 702 + i, CONS, { op: .3 });
  D.planifier(); return D;
}
export const CARTOUCHE = { x: 732, y: 172, pas: 30, w: 214 };

/* ---------------------------------------------------------------------
   Vignettes : le même site à six degrés d'achèvement (méthode), et les
   trois réalisations
   --------------------------------------------------------------------- */
export function vignette(n) {
  const D = new Dessin(null, ENCRE);
  K = n <= 1 ? 2.2 : n === 2 ? 2.8 : n === 3 ? .6 : .35;
  if (n === 1) {
    for (let i = 0; i < 7; i++) gribouillis(D, 120, 190 + i * 46, 360 - (i % 3) * 70, 9, { phase: 'p', wMin: .5, wMax: 1.8, op: .8, graine: 30 + i });
    const q = catmull([[520, 260], [530, 200], [580, 170], [640, 180], [670, 230], [650, 290], [610, 320], [600, 380]], 8);
    D.trait(q, s(GROS, { graine: 40, wMax: 3.4 })); D.trait(arcE(600, 430, 10, 10, 0, Math.PI * 2.1), s(GROS, { graine: 41 }));
  } else if (n === 2) {
    cadreSite(D, { sansCases: true });
    [['actualites'], ['agenda'], ['formulaires']].forEach(([k], i) => { const [x, y, w, h] = cartesSite[k]; boite(D, x, y, w, h, 8, 90 + i); croix(D, x, y, w, h, 95 + i * 2); });
  } else {
    cadreSite(D, { sansCases: true, url: n >= 5 ? 'votre adresse' : '' });
    ['actualites', 'agenda', 'formulaires', 'paiement', 'adherents', 'langues'].forEach(k => BRIQUE_SITE[k](D));
    BRIQUE_SITE.pages(D);
  }
  K = 1;
  D.planifier(); return D;
}
/* la couleur des vignettes 4 à 6 et des réalisations : des aplats d'aquarelle sous l'encre */
export function couleurSite(g, n, combien) {
  const blocs = [[SX + 16, SY + 100, SW - 32, 148, '#c9d4ef'], ...Object.values(cartesSite).map(([x, y, w, h], i) => [x, y, w, h, ['#efe1c3', '#d9e7dd', '#f1d9cf', '#e5dcef', '#dfe9f2', '#f2e6c8'][i]])];
  const nb = combien || (n === 4 ? 3 : blocs.length);
  g.save(); g.globalCompositeOperation = 'multiply';
  blocs.slice(0, nb).forEach(([x, y, w, h, c], i) => { g.globalAlpha = .85; g.fillStyle = c; g.beginPath(); g.roundRect ? g.roundRect(x + 2, y + 2, w - 4, h - 4, 8) : g.rect(x + 2, y + 2, w - 4, h - 4); g.fill(); });
  if (n >= 5) { g.fillStyle = '#000091'; g.globalAlpha = .9; g.beginPath(); g.roundRect ? g.roundRect(SX + 40, SY + 136, 222, 16, 4) : g.rect(SX + 40, SY + 136, 222, 16); g.fill(); }
  g.restore();
}
/* AT-2 : les aplats de la fiche de Marianne (la réponse, la puce de source, la ligne citée) */
export function couleurMarianne(g) {
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = .85;
  [[142, 278, 160, 108, 14, '#d9e1f5'], [152, 352, 108, 22, 11, '#f2e2c2'], [446, 289, 176, 32, 4, '#f5e6a6']].forEach(([x, y, w, h, r, c]) => { g.fillStyle = c; g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); g.fill(); });
  g.restore();
}
export function realisation(nom) {
  const D = new Dessin(null, ENCRE);
  if (nom === 'civik') {
    cadreSite(D, { sansCases: true, url: 'civik-ia.fr' });
    BRIQUE_SITE.pages(D); BRIQUE_SITE.actualites(D); BRIQUE_SITE.agenda(D); BRIQUE_SITE.formulaires(D);
    glyphe(D, SX + 120, SY + 64, 16, 900);
  } else if (nom === 'golf') {
    cadreApp(D);
    ['fil', 'evenements', 'infos', 'notifications'].forEach(k => BRIQUE_APP[k](D));
    /* le drapeau sur son green, à la plume */
    const x = 560, y = 420;
    formeMain(D, arcE(x, y + 120, 130, 30, 0, Math.PI * 2), s(DET, { graine: 950 }));
    hachures(D, arcE(x, y + 120, 126, 27, 0, Math.PI * 2), { phase: 'p', pas: 4, long: [8, 16], op: .28, graine: 951, angle: 8 });
    trait(D, ligne(x, y + 118, x, y - 70), 952, GROS);
    trait(D, catmull([[x, y - 70], [x + 50, y - 56], [x + 96, y - 64], [x + 70, y - 40], [x + 98, y - 22], [x + 46, y - 26], [x, y - 36]], 5), 953, DET);
    hachures(D, [[x + 2, y - 66], [x + 90, y - 62], [x + 70, y - 40], [x + 90, y - 24], [x + 2, y - 34]], { phase: 'p', pas: 3, long: [6, 12], op: .45, graine: 954, angle: 30 });
    D.trait(arcE(x + 70, y + 112, 7, 7, 0, Math.PI * 2.1), s(DET, { graine: 955 }));
  } else if (nom === 'marianne') {
    /* AT-2 : la fiche de Marianne, un téléphone, une bulle de réponse, sa puce de source, et le document cité */
    const X = 120, Y = 110, W = 220, H = 460;
    boite(D, X, Y, W, H, 34, 1100, GROS);
    boite(D, X + 9, Y + 9, W - 18, H - 18, 27, 1101, FIN);
    boite(D, X + W / 2 - 30, Y + 18, 60, 12, 6, 1102, FIN);
    glyphe(D, X + 40, Y + 62, 15, 1103);
    etiquette(D, X + 62, Y + 67, 'MARIANNE', { taille: 11, op: .62, graisse: 700 });
    trait(D, ligne(X + 20, Y + 90, X + W - 20, Y + 90), 1107, FIN);
    /* la question de l'habitant, à droite */
    boite(D, X + 76, Y + 108, 124, 40, 15, 1108, DET);
    gribouillis(D, X + 90, Y + 132, 92, 4, { phase: 'p', wMin: .35, wMax: 1, op: .65, graine: 1109 });
    /* la réponse, à gauche, et sa puce de source */
    boite(D, X + 20, Y + 166, 164, 112, 15, 1110, DET);
    lignes(D, X + 34, Y + 192, 136, 3, 1111);
    boite(D, X + 30, Y + 240, 112, 26, 13, 1115, DET);
    trait(D, [[X + 40, Y + 246], [X + 50, Y + 246], [X + 54, Y + 250], [X + 54, Y + 261], [X + 40, Y + 261], [X + 40, Y + 246]], 1116, FIN);
    etiquette(D, X + 62, Y + 258, 'SOURCE', { taille: 9.5, op: .7, graisse: 700 });
    /* la saisie */
    boite(D, X + 20, Y + H - 62, W - 40, 32, 16, 1117, FIN);
    D.trait(arcE(X + W - 38, Y + H - 46, 9, 9, 0, Math.PI * 2.1), s(DET, { graine: 1118 }));
    ombre(D, X, Y, W, H, 1119);
    /* le document cité : une page, son coin plié, la ligne surlignée */
    const PX = 430, PY = 150, PW = 210, PH = 330;
    trait(D, [[PX, PY], [PX + PW - 34, PY], [PX + PW, PY + 34], [PX + PW, PY + PH], [PX, PY + PH], [PX, PY]], 1120, DET);
    trait(D, [[PX + PW - 34, PY], [PX + PW - 34, PY + 34], [PX + PW, PY + 34]], 1121, FIN);
    trait(D, ligne(PX + 20, PY + 46, PX + 140, PY + 46), 1122, DET, { wMax: 2.4 });
    lignes(D, PX + 20, PY + 84, PW - 40, 3, 1123);
    lignes(D, PX + 20, PY + 150, PW - 40, 2, 1127);
    lignes(D, PX + 20, PY + 210, PW - 40, 4, 1130);
    ombre(D, PX, PY, PW, PH, 1135);
    /* le fil qui relie la puce à la ligne citée */
    const fil = catmull([[X + 146, Y + 253], [X + 210, Y + 262], [PX - 40, PY + 170], [PX - 6, PY + 152]], 8);
    for (let i = 0; i < fil.length - 2; i += 3) D.trait(fil.slice(i, i + 2), { phase: 'p', profil: 'fin', wMin: .4, wMax: .9, op: .55, tremble: 0, vitesse: .4, levee: 1, graine: 1140 + i });
    trait(D, [[PX - 16, PY + 144], [PX - 4, PY + 152], [PX - 15, PY + 160]], 1139, DET);
  } else {
    cadreSite(D, { sansCases: true });
    /* un portail en fer forgé, dans le bandeau */
    const x0 = SX + 340, y0 = SY + 112, w = 240, h = 128;
    trait(D, ligne(x0, y0 + h, x0 + w, y0 + h), 960, DET);
    for (let i = 0; i <= 8; i++) { const x = x0 + 12 + i * 27; trait(D, ligne(x, y0 + h, x, y0 + 26 + Math.abs(i - 4) * 6), 961 + i, DET, { wMax: 1.6 }); trait(D, [[x - 4, y0 + 30 + Math.abs(i - 4) * 6], [x, y0 + 20 + Math.abs(i - 4) * 6], [x + 4, y0 + 30 + Math.abs(i - 4) * 6]], 980 + i, FIN); }
    trait(D, catmull([[x0 + 10, y0 + 54], [x0 + 60, y0 + 40], [x0 + 120, y0 + 34], [x0 + 180, y0 + 40], [x0 + 230, y0 + 54]], 6), 990, DET);
    trait(D, ligne(x0 + 10, y0 + 96, x0 + 230, y0 + 96), 991, DET);
    [60, 120, 180].forEach((dx, i) => D.trait(arcE(x0 + dx, y0 + 76, 12, 12, 0, Math.PI * 2.1), s(FIN, { graine: 992 + i })));
    /* la boutique : trois pièces, sans prix */
    ['actualites', 'agenda', 'formulaires'].forEach((k, i) => { const [x, y, ww, hh] = cartesSite[k]; boite(D, x, y, ww, hh, 8, 1000 + i); boite(D, x + 10, y + 10, ww - 20, 60, 4, 1004 + i, FIN); trait(D, catmull([[x + 30, y + 58], [x + 50, y + 26], [x + 74, y + 44], [x + 96, y + 20], [x + 124, y + 56]], 5), 1010 + i, FIN); lignes(D, x + 10, y + 88, ww - 70, 1, 1020 + i); boite(D, x + ww - 64, y + 84, 54, 20, 10, 1030 + i, DET); });
    etiquette(D, cartesSite.actualites[0] + 10, cartesSite.actualites[1] - 8, 'BOUTIQUE', { op: .6 });
  }
  D.planifier(); return D;
}
/* le cadrage d'un dessin dans une vignette : la zone utile de chaque dessin, en unités de feuille */
export const ZONES = { marianne: [70, 96, 690, 576], site: [40, 100, 670, 580], app: [140, 96, 560, 600], golf: [140, 96, 560, 600], civik: [40, 100, 670, 580], metal: [40, 100, 670, 580], vignette: [40, 100, 670, 580] };
export { clamp, lerp };

/* =====================================================================
   AT-3 : les trois premiers états de la méthode (écoute, croquis,
   maquette), dessinés dans l'espace du mini-site de Villeneuve-les-Ormes
   (1000 x 625, le même gabarit que les états 4 à 6, construits en HTML) :
   barre 0 à 34, en-tête 34 à 98, bandeau 98 à 300 (carte d'accueil
   28 à 488, 204 à 282), trois colonnes de 299 de large à partir de 320,
   pied 579 à 625.
   ===================================================================== */
export const VLO = { w: 1000, h: 625, cols: [28, 350.7, 673.3], colW: 298.7, haut: 320, bas: 566, pied: 579 };
export const GRAPHITE = '#4f5056';
export const GRIS = '#7d7a72';
/* 1, écoute : quelques mots au crayon, et une ligne (x, y, taille, texte, rotation en degrés) */
export const MOTS_ECOUTE = [
  [86, 132, 50, 'Villeneuve-les-Ormes', -1.2],
  [110, 236, 34, 'les habitants d\'abord', -.8],
  [150, 300, 34, 'les actualités, l\'agenda', -.4],
  [118, 366, 34, 'les horaires de la mairie', -1],
  [168, 432, 34, 'lisible sur un téléphone', -.6],
  [600, 520, 30, 'simple, clair', -3]
];
const GR = { profil: 'fin', wMin: .5, wMax: 1.5, tremble: .7, op: .75 };
function ecoute(D) {
  /* la ligne : sous le nom, longue, reprise une fois */
  D.trait(catmull([[80, 152], [300, 147], [520, 150], [640, 145]], 10), Object.assign({}, GR, { phase: 'p', graine: 2001, wMax: 2.2 }));
  D.trait(catmull([[96, 158], [330, 153], [560, 155]], 10), Object.assign({}, GR, { phase: 'p', graine: 2002, op: .4 }));
  /* deux coches et une flèche griffonnée vers « simple, clair » */
  [[84, 228], [124, 292], [92, 358], [142, 424]].forEach(([x, y], i) => D.trait([[x, y - 8], [x + 6, y], [x + 18, y - 18]], Object.assign({}, GR, { phase: 'p', graine: 2010 + i })));
  D.trait(catmull([[520, 440], [560, 470], [590, 492]], 8), Object.assign({}, GR, { phase: 'p', graine: 2020 }));
  D.trait([[574, 494], [592, 494], [586, 478]], Object.assign({}, GR, { phase: 'p', graine: 2021 }));
}
/* 2, croquis : le gabarit griffonné à la plume */
function croquisVlo(D) {
  K = 2.6;
  boite(D, 8, 8, 984, 609, 14, 2100, GROS);
  trait(D, ligne(8, 36, 992, 36), 2101, DET);
  [24, 40, 56].forEach((x, i) => D.trait(arcE(x, 22, 5, 5, 0, Math.PI * 2.1), s(FIN, { graine: 2102 + i })));
  boite(D, 84, 14, 330, 15, 7, 2105, FIN);
  /* l'en-tête : le blason, le nom, le menu */
  embleme(D, 'mairie', 30, 46, 38, 2110);
  gribouillis(D, 84, 66, 190, 7, { phase: 'p', wMin: .5, wMax: 1.7, op: .82, graine: 2115 });
  gribouillis(D, 84, 86, 130, 3.5, { phase: 'p', wMin: .35, wMax: 1, op: .6, graine: 2116 });
  [560, 640, 718, 800, 880].forEach((x, i) => gribouillis(D, x, 72, 56, 4, { phase: 'p', wMin: .35, wMax: 1.1, op: .7, graine: 2120 + i }));
  trait(D, ligne(8, 98, 992, 98), 2126, DET);
  /* le bandeau : une photo (la croix), la carte d'accueil */
  croix(D, 8, 98, 984, 202, 2127);
  boite(D, 28, 204, 460, 78, 10, 2130, DET);
  trait(D, ligne(48, 232, 380, 232), 2131, DET, { wMax: 2.8 });
  gribouillis(D, 48, 260, 300, 4, { phase: 'p', wMin: .35, wMax: 1, op: .6, graine: 2132 });
  trait(D, ligne(8, 300, 992, 300), 2133, DET);
  /* les trois colonnes */
  VLO.cols.forEach((x, c) => {
    const w = VLO.colW;
    for (let i = 0; i < 3; i++) {
      boite(D, x, 354 + i * 68, w, 58, 8, 2141 + c * 20 + i, DET);
      if (c === 1) boite(D, x + 10, 362 + i * 68, 40, 42, 4, 2150 + c * 20 + i, FIN);
      gribouillis(D, x + (c === 1 ? 62 : 12), 378 + i * 68, w * .62, 4, { phase: 'p', wMin: .35, wMax: 1, op: .62, graine: 2160 + c * 20 + i });
    }
  });
  /* le pied, hachuré */
  boite(D, 8, 579, 984, 38, 8, 2200, DET);
  hachures(D, perimetre(12, 583, 976, 30, 6), { phase: 'p', pas: 4.5, long: [14, 30], op: .3, graine: 2201, angle: 0 });
  K = 1;
}
/* les annotations du croquis, au crayon */
export const NOTES_CROQUIS = [[640, 160, 30, 'photo du village', -4], [34, 342, 26, 'actualités', -1.5], [356, 342, 26, 'agenda', -1.5], [678, 342, 26, 'la mairie, ses horaires', -1.5]];
/* 3, maquette : au propre, en gris (traits nets ; les aplats et les mots sont posés par la page) */
function maquetteVlo(D) {
  K = .25;
  const G = { wMin: .5, wMax: 1.3, tremble: .2, op: .85 }, F = { wMin: .35, wMax: .8, tremble: .15, op: .7 };
  boite(D, 8, 8, 984, 609, 12, 2300, G);
  trait(D, ligne(8, 34, 992, 34), 2301, F);
  trait(D, ligne(8, 98, 992, 98), 2302, F);
  trait(D, ligne(8, 300, 992, 300), 2303, F);
  /* l'image du bandeau : la croix des maquettes */
  trait(D, ligne(8, 98, 992, 300), 2304, F, { op: .35 }); trait(D, ligne(992, 98, 8, 300), 2305, F, { op: .35 });
  boite(D, 28, 204, 460, 78, 10, 2306, G);
  VLO.cols.forEach((x, c) => { for (let i = 0; i < 3; i++) boite(D, x, 354 + i * 68, VLO.colW, 58, 8, 2310 + c * 5 + i, F); });
  boite(D, 673.3 + 150, 532, 140, 30, 15, 2330, G);
  K = 1;
}
export function dessinEtat(n, D) {
  if (n === 1) ecoute(D); else if (n === 2) croquisVlo(D); else maquetteVlo(D);
  D.planifier(); return D;
}
/* les aplats et les mots de la maquette grise : [x, y, w, h, r, teinte] et [x, y, taille, graisse, texte, teinte, police] */
export const MAQUETTE = {
  aplats: [[8, 8, 984, 26, 0, '#e6e3dc'], [8, 98, 984, 202, 0, '#ebe8e1'], [28, 204, 460, 78, 10, '#fbfaf7'], [30, 44, 38, 44, 6, '#cfcbc2'], [8, 579, 984, 38, 0, '#cfcbc2'],
    ...[0, 1, 2].flatMap(i => [[VLO.cols[1] + 10, 362 + i * 68, 40, 42, 6, '#d9d5cc']]),
    ...[0, 1, 2].flatMap(c => [0, 1, 2].map(i => [VLO.cols[c] + (c === 1 ? 62 : 12), 384 + i * 68, VLO.colW * (c === 1 ? .55 : .7), 8, 4, '#e2dfd8']))],
  mots: [[84, 70, 18, 700, 'Villeneuve-les-Ormes', '#6f6c65', 'Poppins'], [84, 88, 11, 500, 'Site officiel de la commune', '#8d8a82', 'Inter'],
    [560, 71, 13, 600, 'Accueil', '#6f6c65', 'Inter'], [640, 71, 13, 600, 'Démarches', '#8d8a82', 'Inter'], [730, 71, 13, 600, 'Vie locale', '#8d8a82', 'Inter'], [822, 71, 13, 600, 'Agenda', '#8d8a82', 'Inter'], [896, 71, 13, 600, 'Contact', '#8d8a82', 'Inter'],
    [48, 238, 20, 800, 'Bienvenue à Villeneuve-les-Ormes', '#6f6c65', 'Poppins'], [48, 264, 12.5, 500, 'Toute la vie de la commune, ses démarches et son agenda', '#8d8a82', 'Inter'],
    [28, 340, 11, 700, 'ACTUALITÉS', '#8d8a82', 'Inter'], [350.7, 340, 11, 700, 'AGENDA', '#8d8a82', 'Inter'], [673.3, 340, 11, 700, 'LA MAIRIE', '#8d8a82', 'Inter'],
    [40, 374, 13, 700, 'Inscriptions cantine 2026-2027', '#6f6c65', 'Poppins'], [40, 442, 13, 700, 'Travaux rue des Tilleuls', '#6f6c65', 'Poppins'], [40, 510, 13, 700, 'Le conseil municipal du 15 octobre', '#6f6c65', 'Poppins'],
    [835, 552, 12, 600, 'Écrire à la mairie', '#6f6c65', 'Inter'], [28, 603, 11.5, 600, 'Mairie de Villeneuve-les-Ormes', '#f7f5f0', 'Inter']]
};

/* =====================================================================
   AT-1 bis : sur la feuille de la planche du haut de page, un trait de
   crayon dessine lentement un site (cadre, bandeau, trois colonnes), puis
   une application. Coordonnées de la feuille (931 x 674).
   ===================================================================== */
const CR = { profil: 'fin', wMin: .45, wMax: 1.25, tremble: .55, op: .62 };
const cr = (o) => Object.assign({}, CR, { phase: 'p' }, o);
export function dessinPlanche(type, D) {
  if (type === 'site') {
    const X = 170, Y = 150, W = 590, H = 370;
    formeMain(D, perimetre(X, Y, W, H, 12), cr({ graine: 3001 }));
    D.trait(ligne(X, Y + 28, X + W, Y + 28), cr({ graine: 3002 }));
    [16, 31, 46].forEach((dx, i) => D.trait(arcE(X + dx, Y + 14, 4.5, 4.5, 0, Math.PI * 2.1), cr({ graine: 3003 + i, wMax: .9 })));
    formeMain(D, perimetre(X + 70, Y + 8, 230, 12, 6), cr({ graine: 3006, wMax: .8, op: .5 }));
    gribouillis(D, X + 26, Y + 60, 150, 6, { phase: 'p', wMin: .4, wMax: 1.2, op: .58, graine: 3010 });
    [0, 1, 2, 3].forEach(i => D.trait(ligne(X + 340 + i * 58, Y + 56, X + 382 + i * 58, Y + 56), cr({ graine: 3012 + i, wMax: 1 })));
    /* le bandeau, et sa croix d'image */
    formeMain(D, perimetre(X + 18, Y + 82, W - 36, 116, 8), cr({ graine: 3020 }));
    D.trait(ligne(X + 18, Y + 82, X + W - 18, Y + 198), cr({ graine: 3021, op: .3, wMax: .8 }));
    D.trait(ligne(X + W - 18, Y + 82, X + 18, Y + 198), cr({ graine: 3022, op: .3, wMax: .8 }));
    D.trait(ligne(X + 40, Y + 130, X + 250, Y + 130), cr({ graine: 3023, wMax: 2 }));
    gribouillis(D, X + 40, Y + 160, 170, 4, { phase: 'p', wMin: .35, wMax: .9, op: .5, graine: 3024 });
    /* les trois colonnes */
    const cw = (W - 36 - 28) / 3;
    [0, 1, 2].forEach(c => { const x = X + 18 + c * (cw + 14); formeMain(D, perimetre(x, Y + 214, cw, 128, 7), cr({ graine: 3030 + c * 5 })); gribouillis(D, x + 12, Y + 240, cw * .55, 4, { phase: 'p', wMin: .4, wMax: 1.1, op: .55, graine: 3031 + c * 5 }); for (let i = 0; i < 3; i++) gribouillis(D, x + 12, Y + 272 + i * 20, cw - 26 - (i === 2 ? 30 : 0), 3, { phase: 'p', wMin: .3, wMax: .8, op: .45, graine: 3032 + c * 5 + i }); });
    D.trait(ligne(X + 12, Y + H - 14, X + W - 12, Y + H - 14), cr({ graine: 3050, op: .45 }));
  } else {
    const X = 350, Y = 120, W = 220, H = 440;
    formeMain(D, perimetre(X, Y, W, H, 34), cr({ graine: 3101, wMax: 1.4 }));
    formeMain(D, perimetre(X + 9, Y + 9, W - 18, H - 18, 27), cr({ graine: 3102, op: .45 }));
    formeMain(D, perimetre(X + W / 2 - 28, Y + 18, 56, 11, 5.5), cr({ graine: 3103, wMax: .8 }));
    D.trait(arcE(X + 40, Y + 66, 13, 13, 0, Math.PI * 2.1), cr({ graine: 3104 }));
    gribouillis(D, X + 62, Y + 70, 110, 5, { phase: 'p', wMin: .4, wMax: 1.1, op: .55, graine: 3105 });
    D.trait(ligne(X + 20, Y + 96, X + W - 20, Y + 96), cr({ graine: 3106, op: .45 }));
    for (let i = 0; i < 5; i++) { const y = Y + 112 + i * 54; formeMain(D, perimetre(X + 20, y, W - 40, 42, 9), cr({ graine: 3110 + i * 3 })); D.trait(arcE(X + 42, y + 21, 10, 10, 0, Math.PI * 2.1), cr({ graine: 3111 + i * 3, wMax: .9 })); gribouillis(D, X + 62, y + 25, W - 100, 3.5, { phase: 'p', wMin: .3, wMax: .8, op: .48, graine: 3112 + i * 3 }); }
    D.trait(ligne(X + 18, Y + H - 58, X + W - 18, Y + H - 58), cr({ graine: 3130, op: .45 }));
    [0, 1, 2, 3].forEach(i => formeMain(D, perimetre(X + 34 + i * 46, Y + H - 44, 14, 13, 3), cr({ graine: 3131 + i, wMax: .8 })));
    /* une petite note à côté, au crayon : une flèche vers la première rangée */
    D.trait(catmull([[X + W + 70, Y + 150], [X + W + 40, Y + 140], [X + W + 12, Y + 134]], 8), cr({ graine: 3140 }));
    D.trait([[X + W + 22, Y + 126], [X + W + 10, Y + 134], [X + W + 22, Y + 142]], cr({ graine: 3141 }));
  }
  D.planifier(); return D;
}
