/* =====================================================================
   Le découpage du film : toutes les bornes en valeur de p (0 à 1).
   Un seul endroit pour régler le rythme.
   Deuxième passe (02/10/2026) : une question de moins la nuit (ouverture
   raccourcie d'environ trois secondes) ; le temps gagné va au dessin et à
   la page blanche (la vraie écriture de Thibaut).
   ===================================================================== */
export const PLANS = [
  { n: 1, nom: 'Communiquer', de: 0, a: .20 },
  { n: 2, nom: 'Le départ', de: .20, a: .30 },
  { n: 3, nom: 'La marche', de: .30, a: .45 },
  { n: 4, nom: 'Conseiller', de: .45, a: .62 },
  { n: 5, nom: "L'évidence", de: .62, a: .74 },
  { n: 6, nom: "L'atelier", de: .74, a: .82 },
  { n: 7, nom: 'Créer', de: .82, a: .93 },
  { n: 8, nom: 'La page blanche', de: .93, a: 1.0001 }
];
export const CHAPITRES = [
  { nom: 'Communiquer', de: 0, a: .30, cible: .182, encre: .19 },
  { nom: 'Conseiller', de: .30, a: .74, cible: .588, encre: .56 },
  { nom: 'Créer', de: .74, a: 1.01, cible: .929, encre: .87 }
];
/* lecture automatique : 49,8 secondes (52,9 s depuis K10, voir plus bas), plus lente là où il y a à lire ; la page blanche a 11,8 secondes (D12, D15) ;
   sixième passe : la fin (p 0,98 à 1) passe de 2,7 à 5,2 secondes, le téléphone revient sur la page (F16) ; la route
   vers l'atelier (p 0,688 à 0,74) passe de 2 à 4,4 secondes, le temps du vol de la colombe (F21) */
/* K10 (onzième passe) : le temps de lire. Les bornes en p, les cinq arrêts et les gestes du son ne changent pas ; seul le
   temps change. La nuit gagne 1,5 s, répartie sur les deux réponses de Marianne (0,75 s chacune : p 0,008 à 0,068 et
   0,124 à 0,166) ; le dessin de l'idée (p 0,837 à 0,919 : le point d'interrogation, le croquis, les huit blocs qui
   prennent couleur, l'application) passe de 3,3 à 6,5 s ; pour rester sous 53 s, la marche (p 0,30 à 0,45, rien à lire)
   passe de 5 à 3,9 s et le croisement (p 0,45 à 0,62) de 7 à 6,45 s. Durée totale : 52,9 s (49,8 s avant). */
export const TEMPO = [[0, 0], [.264, .008], [2.994, .068], [4.842, .124], [6.978, .166], [8.1, .20], [12.1, .30], [16, .45], [22.45, .62], [25.057, .688], [29.45, .74], [33.45, .82], [34.13, .837], [40.63, .919], [41.07, .93], [47.713, .98], [52.913, 1]];

/* sixième passe, F20 : les textes des flèches du poteau, en réglage (changer le mot ici suffit ; la carte du téléphone
   prend le même nom). « L'Horizon » : la direction que Civik-ia ne prend pas encore, avec « bientôt » presque effacé */
export const TEXTES = { horizon: 'L’Horizon', horizonSous: 'bientôt', atelier: 'Atelier' };

export const T = {
  /* plan 1 : la conversation, deux échanges (le premier se tape pendant l'ouverture) */
  conv: [
    { tape: [-.022, -.009], envoi: -.006, points: [-.004, .008], rep: [.008, .068], src: .072 },
    { tape: [.092, .110], envoi: .112, points: [.114, .124], rep: [.124, .166], src: .169 }
  ],
  guider: [.171, .181],
  sortie1: [.192, .222],
  /* plan 2 : le départ */
  appui: [.199, .205],
  guide: [.205, .218],
  heure: [.214, .292],
  mainMonte: [.214, .246],
  tenue: [.240, .282],
  nuitJour: [.232, .31],
  camera: [.25, .37],
  monde: [.30, .368],
  /* plan 3 : la marche */
  marche: [.29, .455],
  consigne1: .325, consigne2: .402,
  /* plan 4 : le croisement */
  arrive: .462,
  approche: [.455, .508],
  verbe4: [.512, .55], legende4: [.528, .562], bouton4: [.542, .572], sortie4: [.606, .632],
  /* plan 5 : l'évidence */
  mainEntre: [.616, .634],
  tire: [.634, .646], dechire: .646, versBas: [.646, .668],
  /* quatrième passe, D6 : recul et pivot vers l'atelier dès que le CV est en main, sans temps mort */
  recul: [.654, .688],
  flecheSoleil: [.658, .682],
  pivot: [.660, .694],
  route: [.688, .753],
  /* neuvième passe : l'arrivée à l'atelier, un seul événement. La girouette tourne au vent (I3), puis la lampe de
     l'atelier s'allume (I2, montée en temps réel, 0,3 s) et la girouette se fige ; la couleur part de la lampe et gagne
     le monde gravé (I1) avant que les portes finissent de s'ouvrir */
  /* K8 (onzième passe) : la couleur gagne tout l'écran à 0,722 (et non 0,728) : le monde entièrement colorié se voit une
     seconde de plus avant l'entrée */
  girouette: [.688, .700], lampe: .700, lavis: [.700, .722],
  /* plan 6 : l'atelier */
  /* l'ouverture : la pièce de la photo devient notre atelier (fondu), puis la caméra entre (porte) */
  ouvre: [.712, .728], porte: [.728, .752],
  /* J3 (dixième passe) : par la porte qui s'ouvre, la pièce de la photo de façade (le mur de pierre vu par le vitrage) ;
     J3 bis : le fondu vers la photo de la table a lieu pendant que la porte fait moins de 25 % de la largeur de l'écran
     (de 15 à 21 %), là où l'écart des deux tables ne se lit pas ; 0,63 s de film, fini bien avant le seuil */
  piece: [.717, .7245],
  table: [.748, .788],
  fondu: [.776, .788],
  /* J13 (dixième passe) : le fondu d'opacité entre la table et la planche de près, après le morph géométrique, court
     (0,35 s), fini quand le mouvement s'achève (T.fondu[0]).
     K1 (onzième passe) : cette borne s'appelait « morph », comme celle du plan 7 (le point d'interrogation qui se défait
     en croquis, 0,851 à 0,864), déclarée plus bas dans le même objet : la seconde écrasait la première, la photo de près
     n'arrivait donc jamais pendant le plan 6 et le mur restait la photo de la table agrandie 2,3 à 2,8 fois jusqu'à 0,82
     (arrêt 3 compris). Elle a son propre nom. */
  morphPres: [.769, .776],
  /* J15 : la photo nette prend le plateau dès le début du passage (la photo de la table n'est alors agrandie que de 1,1
     à 1,2 fois) */
  plateau: [.7445, .748],
  poseTel: [.788, .804],
  poseCv: [.79, .81],
  clou: [.806, .812],
  mainsSortent: [.806, .82],
  /* plan 7 : créer ; la main prend le crayon dessiné, dessine l'idée (quatrième passe, D8 : le téléphone et le CV
     restent réels), repose le crayon */
  prend: [.820, .826], saisie: [.826, .829], leve: [.829, .836],
  qm: [.837, .851], morph: [.851, .864], croquis: [.863, .885], couleur: [.884, .906], app: [.905, .919],
  repose: [.921, .9245], lache: [.9245, .9265], retrait: [.9265, .929],
  verbe7: [.828, .858], legende7: [.842, .868], sortie7: [.931, .942],
  /* O1 (quinzième passe) : sur téléphone, « Créer » et sa légende s'écrivent dès l'arrivée devant la feuille (M5, treizième
     passe) ; ces deux bornes étaient écrites dans p7-dessin.js, elles sont ici pour que le bouton de la barre les lise aussi */
  verbe7Mob: [.776, .80], legende7Mob: [.786, .81],
  /* plan 8 (quatrième passe, D12 et D15) : la main dégage la feuille (retire le clou et emporte le CV), puis prend la
     grande feuille par le bas et la tourne par-dessus le haut du pupitre ; elle reprend le crayon, écrit la phrase de
     Thibaut, repose le crayon */
  /* H8 et H10 (huitième passe) : plus de poussée du téléphone. La main gauche le prend sur la règle (telPrise, 0,93 s),
     le soulève et l'écarte au bord gauche (telLeve, 1,33 s) ; son écran se met en veille douce (telVeille). Il reste
     là pendant le déclouage, la page tournée et l'écriture */
  telPrise: [.9300, .9370], telLeve: [.9370, .9470], telVeille: [.9480, .9540],
  declou: [.939, .9505],
  mainBas: [.950, .9535], tourne: [.9525, .9675], retombe: [.9655, .9755], lacheFeuille: [.970, .975],
  reprend: [.9735, .977], saisie8: [.977, .978], versEcrit: [.978, .980],
  ecrit: [.980, .98692],
  /* H10.3 et H10.3 bis : la phrase écrite, la main droite repose le crayon ; le téléphone vibre dans la main gauche
     (deux secousses de 120 ms, en temps réel), son écran s'allume, Marianne écrit « Vous êtes arrivé. Que
     souhaitez-vous faire ? » ; la main ramène le téléphone au centre gauche (telRetour, 1,4 s), les trois boutons
     se posent sous le message (telEcran), la bulle paraît à sa droite */
  repose8: [.98700, .98955], lache8: [.98955, .99010], retrait8: [.99010, .99280],
  vibre: [.99000, .99140], telAllume: [.99000, .99110],
  telRetour: [.99140, .99680], telEcran: [.99560, .99800],
  bulle: [.99700, .99900]
};

/* Avancer sans molette (ajout du 02/10/2026) : cinq arrêts ; à chaque arrêt,
   un objet de la scène joue le tronçon suivant, à la vitesse du film. */
export const ARRETS = [
  { n: 1, p: .183, nom: 'La nuit', objet: 'guider' },
  { n: 2, p: .588, nom: 'Le croisement', objet: 'atelier' },
  { n: 3, p: .816, nom: 'La table', objet: 'crayon' },
  { n: 4, p: .929, nom: 'Le dessin', objet: 'coin' },
  { n: 5, p: 1, nom: 'La page blanche', objet: 'fin' }
];
/* temps du film (secondes) pour une valeur de p, et l'inverse */
export function tempsDe(p) { for (let i = 1; i < TEMPO.length; i++) { const [t0, p0] = TEMPO[i - 1], [t1, p1] = TEMPO[i]; if (p <= p1) return t0 + (t1 - t0) * Math.max(0, (p - p0) / (p1 - p0)); } return TEMPO[TEMPO.length - 1][0]; }
export function pDe(t) { for (let i = 1; i < TEMPO.length; i++) { const [t0, p0] = TEMPO[i - 1], [t1, p1] = TEMPO[i]; if (t <= t1) return p0 + (p1 - p0) * Math.max(0, (t - t0) / (t1 - t0)); } return 1; }

/* O1 (quinzième passe, 06/10/2026) : le bouton bleu de la barre change à l'instant exact où le verbe du chapitre commence à
   s'écrire (sa première lettre part), et non plus aux bornes des chapitres : « Tester Marianne » jusqu'à « Conseiller »
   (T.verbe4[0], p 0,512), « Prendre contact avec moi » (O1 bis ; « Me contacter » sur téléphone) jusqu'à « Créer » (T.verbe7[0], p 0,828 ; sur téléphone
   T.verbe7Mob[0], p 0,776), « Parler de mon projet » ensuite. Dans les deux sens : en remontant, le libellé revient quand la
   première lettre du verbe a fini de s'effacer (le même instant). Le rail des chapitres garde ses bornes (CHAPITRES). */
export const verbeDuBouton = (i, mob) => (i === 1 ? T.verbe4 : mob ? T.verbe7Mob : T.verbe7);
export function boutonDe(p, mob) { return p < T.verbe4[0] ? 0 : p < verbeDuBouton(2, mob)[0] ? 1 : 2; }
