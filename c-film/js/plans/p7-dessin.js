/* =====================================================================
   Plan 7. Créer (p 0,82 à 0,93) : le dessin. La main prend le crayon
   dessiné couché sur la règle (son crayon tombe exactement sur lui : un
   seul geste) et dessine l'idée sur la feuille de la moitié droite : un
   point d'interrogation qui se défait en croquis d'une page web au format
   16:10, qui prend ses couleurs bloc par bloc et devient la page de la
   mairie ; l'application de club, sur son papier, posée devant, en bas à
   droite. Le téléphone et le CV restent réels, à gauche (quatrième passe,
   D8). La main repose le crayon et se retire. Arrêt 4 : le coin.
   ===================================================================== */
import { clamp, lerp, seg, sseg, eEntree, eDepl, appl, decouperLettres, decouperMots, lettres, mots, setV } from '../outils.js';
import { T, PLANS } from '../temps.js';
import { reperesPx } from '../visuels.js';
import { SITE, BLOCS } from '../dessins.js';
import { similitude, decomposer, entreSim } from './communs.js';
import { objetsPoses } from './p6-atelier.js';
import { TEL } from '../memoire.js';

/* les huit blocs du site, dans l'ordre où ils prennent leurs couleurs (unités du site) */
/* H7 : les blocs du site viennent de dessins.js (le huitième est la surbrillance du prompt) */
export const couleurs = p => BLOCS.map((b, i) => { const d = (T.couleur[1] - T.couleur[0]) / (BLOCS.length + 1.2); return eEntree(seg(p, T.couleur[0] + i * d, T.couleur[0] + i * d + d * 2.2)); });
export const etatIdee = p => ({ qm: seg(p, T.qm[0], T.qm[1]), morph: seg(p, T.morph[0], T.morph[1]), croquis: seg(p, T.croquis[0], T.croquis[1]), couleur: couleurs(p), app: seg(p, T.app[0], (T.app[0] + T.app[1]) / 2), appCouleur: eEntree(seg(p, (T.app[0] + T.app[1]) / 2, T.app[1])), annot: seg(p, T.app[1] - .003, T.app[1] + .002), legende: seg(p, T.leve[0], T.qm[0] + .005) });
/* l'échelle de la main au crayon (px écran par px image) */
export function echelleCrayon(F) { const v = F.vis['main-crayon'], a = reperesPx(v, 'pointe'), b = reperesPx(v, 'poignet') || [v.w * .8, v.h * .86]; return F.H * (F.mob ? .4 : .56) / Math.hypot(b[0] - a[0], b[1] - a[1]); }

/* La main qui prend ou repose le crayon couché : main ouverte (saisit) puis main au crayon, au même endroit.
   k de 0 (main ouverte, hors champ) à 1 (main au crayon, en pose de dessin, pointe en « cible ») */
export function geste(F, k, cible, sens = 1) {
  const { atelier, mains } = F, ech = echelleCrayon(F);
  const Hreg = atelier.Hmain(), vS = F.vis['main-droite-saisit'], pince = reperesPx(vS, 'pince') || [vS.w * .35, vS.h * .37];
  const d = decomposer(Hreg, atelier.main.P), prise = appl(Hreg, ...atelier.main.prise);
  const aArr = clamp(k / .42), aFon = clamp((k - .42) / .14), aLev = clamp((k - .56) / .44);
  if (aFon < 1) {
    const e = eEntree(aArr), dep = [prise[0] + F.W * .32, prise[1] + F.H * .7];
    const Hs = similitude(pince, [lerp(dep[0], prise[0], e), lerp(dep[1], prise[1], e)], d.a + (1 - e) * 18 * sens, ech);
    /* T13 (07/10/2026) : sur téléphone, plus de fondu d'une main à l'autre : à mi-fondu, deux mains à moitié transparentes
       laissaient voir le bord de la table et le crayon couché au travers (la main semblait derrière la table, capture de
       Thibaut, fin du film). La main qui saisit cède la place à la main au crayon d'une image à l'autre, au milieu du fondu
       d'avant (il dure moins d'un millième de p) ; sur ordinateur, le fondu d'avant */
    mains.parH('main-droite-saisit', Hs, { z: 34, op: clamp(aArr * 4) * (TEL ? (aFon < .5 ? 1 : 0) : 1 - aFon) });
  }
  if (aFon > 0) {
    let H = Hreg;
    if (aLev > 0 && cible) { const fin = decomposer(similitude(atelier.main.P, cible, 0, ech), atelier.main.P); H = entreSim(atelier.main.P, d, fin, eDepl(aLev)); }
    mains.parH('main-crayon', H, { z: 34, op: TEL ? (aFon >= .5 ? 1 : 0) : aFon });
  }
  return { crayon: 1 - aFon };
}

export function plan7(F) {
  const { scene, tel, mains, atelier } = F;
  const bloc = scene.querySelector('[data-bloc="7"]'), verbe = bloc.querySelector('.verbe'), legende = bloc.querySelector('.legende');
  decouperLettres(verbe); decouperMots(legende);
  const coin = atelier.elements.coin;
  coin.addEventListener('click', e => { e.stopPropagation(); F.continuer && F.continuer(); });
  return Object.assign({}, PLANS[6], {
    dims() {
      if (F.mob) { bloc.style.left = ''; bloc.style.top = ''; return; }
      const B = atelier.Q.gravure.map(([x, y]) => atelier.imgEcran(x, y)), pl = atelier.Q.planche.map(([x, y]) => atelier.imgEcran(x, y));
      /* G6 : « Créer » sur le plateau, à droite de la gravure ; H6 (huitième passe) : un peu plus haut, à mi-chemin entre
         le haut visible de la planche (son bord, ou le bas de la barre de navigation qui le couvre) et le haut de la
         feuille de dessin. Le centre visuel du mot (les lettres, pas la boîte) est posé sur ce milieu. */
      const fq = atelier.quadFeuille(), fTop = Math.min(fq[0][1], fq[1][1]);
      const nav = document.querySelector('header.nav'), navBas = nav ? nav.getBoundingClientRect().bottom : 0;
      const plHaut = Math.max(Math.min(pl[0][1], pl[1][1]), navBas), milieu = (plHaut + fTop) / 2;
      /* L12 : la légende est visible sous le verbe : le mi-chemin de H6 vaut pour le groupe (verbe et légende) ; si le groupe
         ne tient pas entre le haut de la planche et le haut de la feuille, le verbe perd un cran (jusqu'à deux) */
      const gauche = Math.max(B[1][0], B[2][0]) + 34;
      /* la légende peut s'étendre sur le plateau jusqu'à son bord droit (moins la marge), pour tenir sur une ligne */
      const plDroite = Math.min(pl[1][0], pl[2][0]) - 60;
      bloc.style.left = gauche + 'px'; bloc.style.maxWidth = Math.max(300, Math.min(F.W * .9, plDroite) - gauche) + 'px';
      verbe.style.fontSize = '';
      const place = fTop - plHaut - 8;
      for (let cran = 0; cran < 3; cran++) {
        const hv = verbe.offsetHeight, hl = legende.offsetHeight + 10, hg = hv * .84 + hl;
        if (hg <= place || cran === 2) {
          /* le haut des lettres est à environ 0,16 de la boîte du verbe : le centre visuel du groupe au mi-chemin */
          const haut = Math.max(plHaut + 2, milieu - (hv * .16 + hg / 2));
          bloc.style.top = haut + 'px';
          break;
        }
        verbe.style.fontSize = (parseFloat(getComputedStyle(verbe).fontSize) * .86).toFixed(1) + 'px';
      }
    },
    rendre(p, actif) {
      /* M5 (treizième passe) : sur téléphone, « Créer » et sa légende sont là dès l'arrivée devant la feuille (pendant que la
         planche se pose, 0,776 à 0,80), centrés au-dessus d'elle */
      const V7 = F.mob ? T.verbe7Mob : T.verbe7, L7 = F.mob ? T.legende7Mob : T.legende7;   /* O1 : bornes lues dans temps.js (le bouton de la barre les suit) */
      const v = seg(p, V7[0], V7[1]), s = sseg(p, T.sortie7[0], T.sortie7[1]);
      lettres(verbe, v, s);
      /* N3 (quatorzième passe) : la légende ne commence plus à partir avant l'arrêt du dessin (0,929) : à l'arrêt, « Des » était
         déjà pâli et flou (sortie dès 0,927) ; elle part avec le verbe (0,931) */
      mots(legende, seg(p, L7[0], L7[1]), sseg(p, T.sortie7[0], T.sortie7[1]));
      setV(bloc, p > V7[0] - .004 && s < 1);
      const ici = F.arret === 3;
      if (!actif) return;
      F.vivant = true; F.zPapier = 13;
      const ei = etatIdee(p);
      /* M5 : petit écran, la caméra reste cadrée sur l'idée entière (elle y est arrivée en entrant) */
      if (F.mob && atelier.cadrage) atelier.centrer(atelier.cadrage.x, atelier.cadrage.zoom, atelier.cadrage.dy);
      atelier.poserPres(1);
      atelier.poserFeuille({ op: 1, etat: ei });
      /* H7 : la surbrillance du prompt, quand la pointe l'a posée */
      atelier.poserHalo(ei.couleur[7]);
      objetsPoses(F);
      /* la pointe du crayon sur l'idée */
      let tip;
      if (p < T.qm[0]) tip = atelier.pointe('qm', 0);
      else if (p <= T.qm[1]) tip = atelier.pointe('qm', ei.qm);
      else if (p < T.croquis[0]) { const e = eDepl(seg(p, T.qm[1], T.croquis[0])), a = atelier.pointe('qm', 1), b = atelier.pointe('croquis', 0); tip = [lerp(a[0], b[0], e) + Math.sin(e * Math.PI) * 30, lerp(a[1], b[1], e) + Math.sin(e * Math.PI) * 40]; }
      else if (p <= T.croquis[1]) tip = atelier.pointe('croquis', ei.croquis);
      else if (p < T.couleur[1]) {
        /* la pointe balaie le bloc qui prend ses couleurs */
        const k = ei.couleur, i = k.findIndex(x => x < 1), b = BLOCS[i < 0 ? BLOCS.length - 1 : i], kk = i < 0 ? 1 : k[i];
        tip = atelier.pointe([b[0] + b[2] * kk, b[1] + b[3] * .55]);
      }
      else if (p <= (T.app[0] + T.app[1]) / 2) tip = atelier.pointe('app', ei.app);
      else { const A = SITE.app, kk = ei.appCouleur; tip = atelier.pointe([A.x + A.w * kk, A.y + A.h * (.2 + .6 * kk)]); }
      /* prise et dépose du crayon : un seul geste */
      const kg = p < T.repose[0] ? seg(p, T.prend[0], T.leve[1]) : 1 - seg(p, T.repose[0], T.retrait[1]);
      const g = geste(F, kg, tip, p >= T.repose[0] ? -1 : 1);
      if (kg >= 1) mains.point('main-crayon', tip, 0, echelleCrayon(F), { z: 34 });
      atelier.poserCrayon({ op: g.crayon, bouton: false });
      F.pointe = tip;
      /* arrêt 4 : le coin de la feuille, qui se soulève au survol */
      atelier.poserCoin({ actif: ici, appel: ici });
      coin.classList.toggle('cmd-actif', ici);
      if (ici) { const c = atelier.feuilleEcran(atelier.taille[0], atelier.taille[1]); F.commande = { el: coin, pt: [c[0] - 150, c[1] - 30], cote: 'gauche' }; }
    }
  });
}
