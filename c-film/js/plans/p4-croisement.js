/* =====================================================================
   Plan 4. Conseiller (p 0,45 à 0,62) : le croisement. Le poteau réel, ses
   deux flèches, la planche de bois brûlé, la plaque d'acier gravée du logo,
   le CV pendu au clou. La caméra s'approche jusqu'à ce que le CV se lise ;
   les lignes du parcours s'écrivent ; le téléphone annonce l'arrivée.
   Arrêt 2 : la flèche « Atelier », ou le CV lui-même.
   ===================================================================== */
import { clamp, seg, sseg, eEntree, quadEntre, quadRect, decouperLettres, decouperMots, lettres, mots, setO, setV, setVar } from '../outils.js';
import { T, PLANS } from '../temps.js';
import { MINUTES } from './p2-depart.js';
import { avancee, consigne, telTenu, feuillePoteau } from './p3-marche.js';

/* le CV en plein écran, sous le titre (petit écran) */
/* M3 (treizième passe) : sous « Conseiller », sa légende et son bouton (10 px), au-dessus du rail posé en bas (M7) */
export function cvPleinEcran(F) {
  const bas = (F.basUtile || F.H - 12) - 4, haut = (F.bloc4Bas || 300) + 10, h = Math.max(120, Math.min(bas - haut, (F.W - 28) / .707)), w = h * .707;
  return quadRect(F.W / 2, bas - h / 2, w, h, 0);
}

export function plan4(F) {
  const { scene, tel, monde } = F;
  const bloc = scene.querySelector('[data-bloc="4"]'), verbe = bloc.querySelector('.verbe'), legende = bloc.querySelector('.legende');
  const voile = scene.querySelector('[data-voile2]');
  decouperLettres(verbe); decouperMots(legende);
  const cmdFleche = monde.boutonAtelier, cmdCv = F.feuille.cmd;
  /* F23 : la flèche « Atelier » poursuit le film ; le CV, lui, est un lien vers la page Conseil (et ses initiales vers LinkedIn) */
  cmdFleche.addEventListener('click', e => { e.stopPropagation(); F.continuer && F.continuer(); });
  /* sur téléphone, la flèche est hors du cadre et le CV occupe l'écran (le bouton « Découvrir le conseil » est juste
     au-dessus) : toucher le CV poursuit le film, comme avant ; ses initiales restent le lien LinkedIn */
  cmdCv.addEventListener('click', e => { if (F.mob) { e.preventDefault(); F.continuer && F.continuer(); } });
  return Object.assign({}, PLANS[3], {
    dims() { cmdCv.setAttribute('aria-label', F.mob ? 'Arracher le CV et prendre le chemin de l’atelier' : 'Le conseil : voir la page Conseil'); },
    rendre(p, actif) {
      const v = seg(p, T.verbe4[0], T.verbe4[1]), s = sseg(p, T.sortie4[0], T.sortie4[1]);
      lettres(verbe, v, s);
      mots(legende, seg(p, T.legende4[0], T.legende4[1]), sseg(p, T.sortie4[0] - .006, T.sortie4[1] - .006));
      setVar(bloc, '--b', (eEntree(seg(p, T.bouton4[0], T.bouton4[1])) * (1 - sseg(p, T.sortie4[0] - .01, T.sortie4[0] + .008))).toFixed(3));
      bloc.classList.toggle('actif', p > T.bouton4[1] && p < T.sortie4[0]);
      setV(bloc, p > T.verbe4[0] - .005 && s < 1);
      setO(voile, Math.min(seg(p, T.verbe4[0] - .01, T.verbe4[0] + .02), 1 - seg(p, T.sortie4[0], T.sortie4[1])));
      const ici = F.arret === 1;
      cmdFleche.classList.toggle('cmd-actif', ici); cmdFleche.tabIndex = ici ? 0 : -1;
      F.feuille.lienCv(ici);
      monde.cadreAtelier.classList.toggle('cmd-actif', ici);
      if (!actif) return;
      F.vivant = true;
      const info = monde.rendre(p);
      /* téléphone (petit écran) : la messagerie descend, le CV passe en plein écran */
      const plein = F.mob ? eEntree(seg(p, .496, .53)) : 0;
      F.descend = plein;
      telTenu(F, p);
      /* V2 (vingt-deuxième passe, 08/10/2026) : sur téléphone, plus de téléphone ni de guide pendant la marche, au croisement et sur
         la route (M2, telTenu ne le pose pas : tel.fin le cache) ; son écran n'est plus tenu à jour pour rien (la plus grosse part
         du script du tronçon après le monde : 0,25 ms par image dans le moteur de Safari du Mac, un tracé SVG interrogé à chaque
         image) ; il l'est de nouveau, entièrement, dès qu'un plan le montre (plans 6 et 8) */
      if (!F.mob) tel.etatEcran({ guide: 1, heure: MINUTES[1], chemin: avancee(F), reste: monde.reste(), consigne: consigne(p) });   /* O2 : la distance lue sur la caméra (monde.reste) */
      if (info.poteau) {
        if (plein > 0) {
          feuillePoteau(F, info, { op: 0 });
          const qp = F.feuille.quad || info.poteau.cv;
          F.feuille.surPlan({ quad: quadEntre(qp, cvPleinEcran(F), plein), forme: F.feuille.formeMain(F.t, 0, .4), ombre: { op: .3 * plein, base: [6, 10], dir: [.3, .5] }, commande: true });   /* T10 : plus de clou sur la feuille */
          if (plein > .5) F.zPapier = 32;
        } else feuillePoteau(F, info);
        F.feuille.lienInitiales(ici);
        if (ici) F.commande = { el: cmdFleche, pt: [(info.poteau.cv[2][0] + info.poteau.cv[3][0]) / 2, Math.max(info.poteau.cv[2][1], info.poteau.cv[3][1]) + 18] };
      }
    }
  });
}
