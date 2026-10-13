/* =====================================================================
   Plan 1. Communiquer (p 0 à 0,20) : la nuit. La mairie gravée, le
   téléphone réel de trois quarts, la conversation en trois échanges, le
   bouton « Me guider » (arrêt 1).
   ===================================================================== */
import { clamp, seg, sseg, eEntree, lerp, decouperLettres, decouperMots, lettres, mots, setO, setV, setVar } from '../outils.js';
import { T, PLANS } from '../temps.js';
import { poseNuit } from './communs.js';

/* M1 (treizième passe) : le téléphone réel de la nuit, sur petit écran (de face, sans main) ; d : la descente (M2, en px)
   ; le texte de l'écran est agrandi pour faire 15 px à l'écran ; la part de l'écran cachée par le rail est signalée */
export function poserNuitMobile(F, quad, ep, p, d) {
  const { tel } = F, q = d ? quad.map(([x, y]) => [x, y + d]) : quad;
  const lq = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]), sx = lq * .893 / 340;
  const yBasEcran = Math.max(q[2][1], q[3][1]) - (q[3][1] - q[0][1]) * .0227, cache = Math.max(0, (yBasEcran - ((F.basUtile || F.H) - 2)) / sx);
  tel.modeMobile({ taille: Math.max(15.6, Math.min(22, 15.3 / sx)), cache: d ? (tel._cacheNuit || 0) : cache });
  if (!d) tel._cacheNuit = cache;
  tel.poser({ quad: q, ep, z: 30, ombre: { dx: 12, dy: 26, op: .5 }, glisse: lerp(-.4, .5, Math.min(1, p / .2)), reflet: .85 });
}
export function plan1(F) {
  const { scene, tel } = F;
  const bloc = scene.querySelector('[data-bloc="1"]'), verbe = bloc.querySelector('.verbe'), legende = bloc.querySelector('.legende');
  const voile = scene.querySelector('[data-voile1]');
  /* W1 (vingt-troisième passe, 08/10/2026) : sur téléphone, la première image (main.js) a déjà découpé le verbe et la légende et les a
     posés à p 0, l'entrée finie : le plan adopte cette découpe (les mêmes lettres, les mêmes mots) au lieu de la refaire */
  if (!verbe.querySelector('.m')) decouperLettres(verbe);
  if (!legende.querySelector('.w')) decouperMots(legende);
  const guider = tel.ecran.querySelector('[data-guider]');
  guider.addEventListener('click', e => { e.stopPropagation(); F.continuer && F.continuer(); });
  /* troisième passe, C.2 : la mairie répond. À chaque réponse de Marianne, la fenêtre allumée de la mairie
     donne une seule pulsation de lumière, douce et lente (750 ms, en temps réel). Mouvement réduit : rien. */
  const fenetre = scene.querySelector('.lum--mairie'), pulse = document.createElement('i');
  pulse.className = 'lum-pulse'; pulse.setAttribute('aria-hidden', 'true');
  if (fenetre) { pulse.style.left = fenetre.style.getPropertyValue('--x'); pulse.style.top = fenetre.style.getPropertyValue('--y'); fenetre.parentElement.appendChild(pulse); }
  let pPrec = null, depart = -10;
  const DUREE = .75;
  return Object.assign({}, PLANS[0], {
    rendre(p, actif, intro) {
      /* une réponse commence : la pulsation part (seulement en avançant, et pas à l'image figée) */
      if (pPrec !== null && p > pPrec && !F.ctx.options.fixe) T.conv.forEach(c => { if (pPrec < c.rep[0] && p >= c.rep[0]) depart = F.t; });
      pPrec = p;
      const u = (F.t - depart) / DUREE, k = u > 0 && u < 1 ? Math.pow(Math.sin(Math.PI * u), 1.6) : 0;
      setO(pulse, k * (1 - sseg(p, .19, .24)));
      if (k > 0) F.vivant = true;
      /* le verbe entre à l'ouverture, sort au départ */
      const s1 = sseg(p, T.sortie1[0], T.sortie1[1]);
      lettres(verbe, intro, s1);
      mots(legende, clamp(intro * 1.2 - .2), sseg(p, .19, .214));
      setVar(bloc, '--b', (eEntree(clamp(intro * 1.4 - .4)) * (1 - sseg(p, .19, .21))).toFixed(3));
      bloc.classList.toggle('actif', p < .19 && intro > .35);
      setV(bloc, s1 < 1);
      setO(voile, (1 - s1) * clamp(intro * 2));
      const ici = F.arret === 0;
      /* M1 : sur téléphone, plus de bouton « Me guider » (la réponse dit « Je vous y mène. ») */
      guider.classList.toggle('cmd-actif', ici && !F.mob);
      guider.tabIndex = ici && !F.mob ? 0 : -1;
      if (!actif) return;
      const { quad, ep } = poseNuit(F);
      const c34 = [(quad[0][0] + quad[2][0]) / 2, (quad[0][1] + quad[2][1]) / 2], h34 = Math.hypot(quad[3][0] - quad[0][0], quad[3][1] - quad[0][1]);
      if (F.mob) poserNuitMobile(F, quad, ep, p, 0); else if (tel.a34) tel.poser34({ cx: c34[0], cy: c34[1], h: h34, k: 1 }); else tel.poser({ quad, ep, z: 30, ombre: { dx: 30, dy: 40, op: .42 }, glisse: lerp(-.55, .45, p / .2), reflet: 1 });
      tel.conversation(p - (1 - intro) * .022, T);
      tel.etatEcran({ guide: 0, heure: 22 * 60 + 47 });
      if (ici && !F.mob) { const r = guider.getBoundingClientRect(), s0 = scene.getBoundingClientRect(); F.commande = { el: guider, pt: [Math.max(quad[1][0], quad[2][0]) + 22, r.top - s0.top + r.height / 2], cote: 'droite' }; }
    }
  });
}
