/* =====================================================================
   Plan 5. L'évidence (p 0,62 à 0,74). La main droite entre par le bas à
   droite, prend la feuille et l'emporte entière (T10, 07/10/2026 : plus de
   déchirure ; le clou reste planté dans la planche, la feuille passe devant
   lui en partant). La feuille,
   plus petite, se loge en bas à droite, en pendant du téléphone ; elle
   fléchit et bat un peu avec la marche, avec son ombre. La flèche
   « Atelier » prend le soleil, la caméra pivote et repart ; on entre.
   La main « saisit » devient « feuille » au contact (même poignet).
   ===================================================================== */
import { clamp, lerp, seg, sseg, eEntree, eDepl, centreQuad } from '../outils.js';
import { T, PLANS } from '../temps.js';
import { reperesPx } from '../visuels.js';
import { MINUTES } from './p2-depart.js';
import { telTenu, feuillePoteau } from './p3-marche.js';
import { cvPleinEcran } from './p4-croisement.js';
import { similitudeQuads, similitude, decomposer, entreSim, tenueDroite, appliquerQ } from './communs.js';
import { entreeAtelier, horsCadre } from './p6-atelier.js';


export function plan5(F) {
  const { tel, mains, monde, atelier } = F, fe = F.feuille;
  const vF = F.vis['main-droite-feuille'], qF = reperesPx(vF, 'quad'), cF = centreQuad(qF);
  const imQ = [[0, 0], [vF.w, 0], [vF.w, vF.h], [0, vF.h]];
  let contact = null;   /* la pose de la main au contact, mémorisée pendant la tenue sur la planche */
  return Object.assign({}, PLANS[4], {
    dims() { contact = null; },
    /* la main droite qui tient la feuille (sert aussi au plan 6) */
    tenue() { return tenueDroite(F); },
    rendre(p, actif) {
      if (!actif) return;
      F.vivant = true; F.zPapier = 36;
      /* T10 : plus de rebond de la planche (il venait du papier qui cédait) */
      const info = monde.rendre(p, { alpha: 1 - horsCadre(F, p) });
      if (F.mob) F.descend = 1 - eEntree(seg(p, T.versBas[0], T.versBas[1] + .02));
      const quadTel = telTenu(F, p);
      const versAtelier = seg(p, T.pivot[0], T.pivot[0] + .006);
      /* V2 (vingt-deuxième passe) : sur téléphone, l'écran du téléphone caché n'est plus tenu à jour (voir le plan 4) */
      if (!F.mob) tel.etatEcran({ guide: 1, heure: MINUTES[1], chemin: 1, branche: monde.avanceeRoute(p), versAtelier, reste: monde.reste(), consigne: p < T.pivot[0] ? 2 : 2 + clamp((p - T.pivot[0]) / .008) });   /* O2 : la distance lue sur la caméra (monde.reste) */
      if (F.mob) {
        /* petit écran : la feuille, en plein écran, s'en va par le bas, entière ; la messagerie remonte ; T10 : sur la
           planche, seul reste le clou (dans la photo du poteau) */
        const q = cvPleinEcran(F), d = eEntree(seg(p, T.tire[0], T.versBas[1]));
        if (d < 1) fe.surPlan({ quad: q.map(([x, y]) => [x, y + d * F.H]), forme: fe.formeMain(F.t, 0, .4), ombre: { op: .3, base: [6, 10], dir: [.3, .5] } });
        porte(p, info); return;
      }
      if (!contact) { const q = monde.quadCvA(T.tire[0], fe.papierPoteau(monde.cvImg, monde.clouImg)); if (q) contact = similitudeQuads(qF, q); }
      if (!contact) return;
      const tenu = tenueDroite(F);
      /* la main tire ; T10 : la feuille vient entière avec elle (plus de plateau ni de papier qui cède) */
      const ut = seg(p, T.tire[0], T.tire[1]), pull = eDepl(ut);
      const Hpull = (() => { const d = decomposer(contact, cF); return similitude(cF, [d.c[0] + 16 * pull, d.c[1] + 38 * pull], d.a + 2.5 * pull, d.s); })();
      const descente = eDepl(seg(p, T.versBas[0], T.versBas[1]));
      const Hmain = descente > 0 ? entreSim(cF, decomposer(Hpull, cF), decomposer(tenu, cF), descente) : Hpull;
      const qMain = appliquerQ(Hmain, qF), pouce = appliquerQ(Hmain, imQ);
      const marche = clamp(F.monde.camera().v || 0);
      if (p < T.tire[0]) {
        /* approche : la main « saisit » monte du coin bas droit ; la feuille vit au vent sur la planche */
        const e = eEntree(seg(p, T.mainEntre[0], T.mainEntre[1]));
        const d = decomposer(contact, cF);
        const Hs = similitude(cF, [d.c[0] + (1 - e) * F.W * .3, d.c[1] + (1 - e) * F.H * .75], d.a - (1 - e) * 12, d.s);
        mains.parH('main-droite-saisit', Hs, { z: 39, op: clamp(e * 3) });
        feuillePoteau(F, info, { vent: 1 - e * .8 });
      } else {
        /* au contact : la main se referme sur la feuille et l'emporte, entière (T10) : chaque point de la feuille passe de
           sa pose sur la planche à sa pose dans la main au même rythme (un léger retard vers le haut, le papier suit la
           main) ; la feuille est toujours devant le clou de la planche, qu'elle découvre en partant */
        mains.parH('main-droite-feuille', Hmain, { z: 39 });
        const souffle = sseg(p, T.dechire + .008, T.versBas[1]);
        const forme = fe.formeMain(F.t, marche, souffle);
        if (p < T.tire[1] && info.poteau) {
          const A = fe.A, vb = fe.corpsV[1];
          const poids = (u, v) => clamp(pull - .18 * (vb - v) * A * (1 - pull));
          fe.entreDeux({ poteau: info.poteau, quad: qMain, poids, tension: .5 * Math.sin(Math.PI * pull), devant: 0, forme, pouce });
        } else {
          fe.surPlan({ quad: qMain, forme, pouce, ombre: { op: .34, base: [12, 18], dir: [.35, .55], hmax: .08 } });
        }
      }
      porte(p, info);
    }
  });
  /* l'entrée dans l'atelier (E4) : fondu plein cadre quand l'ouverture remplit l'écran */
  function porte(p, info) { entreeAtelier(F, p, info); }

}
