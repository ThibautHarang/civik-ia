/* Les peintres des versions provisoires, par nom de fichier attendu */
import { telephone, poteauPlanche, atelierFacade } from './reel.js';
import { atelierTable, atelierPlanche } from './atelier.js';
import { mainGaucheTelephone, mainDroiteFeuille, mainDroiteSaisit, mainSouleve, mainCrayon } from './mains.js';
import { cypres, vigne, borne, solChemin } from './gravure.js';
import { feuille, feuilleDessin, crayonDessine, clou } from './papier.js';

export const PEINTRES = {
  telephone, 'poteau-planche': poteauPlanche, clou,
  'atelier-facade': atelierFacade, 'atelier-table': atelierTable, 'atelier-planche': atelierPlanche,
  'main-gauche-telephone': mainGaucheTelephone, 'main-droite-feuille': mainDroiteFeuille,
  'main-droite-saisit': mainDroiteSaisit, 'main-souleve': mainSouleve, 'main-crayon': mainCrayon,
  'cypres-1': () => cypres(11, false), 'cypres-2': () => cypres(23, true),
  'vigne-1': () => vigne(101, true), 'vigne-2': () => vigne(104, false), borne, 'sol-chemin': solChemin,
  feuille, 'feuille-dessin': feuilleDessin, 'crayon-dessine': crayonDessine
};
