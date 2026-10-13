/* =====================================================================
   Plan 8. La page blanche (p 0,93 à 1), quatrième passe (D12, D15).
   Huitième passe (H8 à H10) : la main gauche prend d'abord le téléphone
   sur la règle et l'écarte au bord gauche, où elle le garde ; la main
   droite retire le clou et emporte le CV vers le bas à droite (un petit
   trou reste dans la feuille). Puis elle prend la grande feuille par le bas et la tourne :
   un vrai pli cylindrique qui remonte la page, rayon qui varie, dos plus
   gris où le dessin transparaît à l'envers, reflet sur la courbure, ombre
   portée sur la page du dessous ; la main reste sur le bord tenu, le lâche
   quand il passe le haut du pupitre ; la feuille continue sur son élan,
   ondule, dépasse un peu, se pose ; ce qui passe derrière le pupitre est
   caché par le bois. Dessous, une page blanche. La main reprend le crayon,
   écrit la phrase de Thibaut, repose le crayon ; le téléphone vibre dans
   la main gauche, Marianne écrit, la main le ramène au centre avec ses
   trois boutons, la bulle apparaît.
   ===================================================================== */
import { clamp, lerp, seg, sseg, eEntree, eDepl, bezier, appl, inv3, mult3, epingle, setT, setO, setV, el, carreVers, quadEntre, centreQuad, quadVersQuad } from '../outils.js';
import { T, PLANS } from '../temps.js';
import { reperesPx, ecritureReelle } from '../visuels.js';
import { projPlane } from '../papier.js';
import { dosPapier } from '../provisoires/papier.js';
import { geste, echelleCrayon, etatIdee } from './p7-dessin.js';
import { similitude, respire } from './communs.js';
import { pose3d } from '../telephone.js';
import { TEL, VUE } from '../memoire.js';
import { planifier } from '../lavis.js';
/* Q3 (dix-septième passe) : les boîtes des trois lignes de l'écriture (ecriture.json, lignes : la phrase, « Contactez-moi ! »,
   « T.H. »), en fractions de l'image, tant que le fichier n'est pas lu : la bulle est à sa place dès la première image */
const LIGNES_ECRITURE = [{ boite: [.0184, .048, .9811, .527] }, { boite: [.2323, .2869, .8404, .8968] }, { boite: [.9117, .8715, .9816, .952] }];

export function plan8(F) {
  const { mains, atelier, papier, tel } = F, fe = F.feuille;
  const crayonB = atelier.elements.crayon, trace = atelier.elements.trace;
  /* textures : la feuille dessinée (le canevas de la feuille), son dos, sa silhouette floue ; l'écriture */
  let Tfeuille = null, cleTex = '', Tdos = null, Flous = null, ecr = null, Tencre = null, Ttemps = null, Tpoint = null, TtempsPoint = null;
  let dw = 0, dh = 0, dosBase = null, dosAgrafe = true;
  const dosC = document.createElement('canvas');
  /* N2 (quatorzième passe) : le papier du dos (un calcul de 30 ms d'un bloc dans Safari, fait jusqu'ici à la première image de
     la page) est préparé à part, en tâche de fond, dès 0,86 */
  function faireDosBase() {
    const [SW, SH] = atelier.taille, k = Math.min(1, 1400 / SW);
    if (!dosBase || dw !== Math.round(SW * k)) { dw = Math.round(SW * k); dh = Math.round(SH * k); dosBase = dosPapier(atelier.papier, dw, dh); dosC.width = dw; dosC.height = dh; }
  }
  function majDos() {
    /* le dos : le même papier, plus gris et mat, et le dessin du recto qui transparaît très faiblement (à l'envers,
       puisqu'on le voit par derrière) */
    const [SW, SH] = atelier.taille;
    faireDosBase();
    const g = dosC.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, dw, dh); g.drawImage(dosBase, 0, 0);
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(150,146,138,.12)'; g.fillRect(0, 0, dw, dh);
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = .04; g.drawImage(atelier.canevas, 0, 0, dw, dh);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    /* L13 : l'agrafe tourne avec la feuille : au dos, ses deux pointes repliées (mêmes coordonnées que sur le dessus) ;
       la feuille une fois retombée, le pli les couvre : elles sont retirées du dos (une seule mise à jour, à la fin) */
    if (atelier.agrafe && dosAgrafe) { g.setTransform(1, 0, 0, 1, 0, 0); atelier.agrafe(g, 'dos', dw / SW); }
    if (!Tdos) Tdos = papier.texture(dosC); else Tdos.maj(dosC);
  }
  /* N1 (quatorzième passe) : les deux textures de l'écriture (l'encre en pleine résolution, la phrase manuscrite ne change pas,
     et le temps de chaque trait : 16 Mo) ; sur téléphone, elles n'existent que près de la page (préparées en tâche de fond
     après 0,88, rendues avant 0,84) */
  let tacheEcr = null;
  /* O4 (quinzième passe) : le second point des initiales (visuels.js, secondPoint) a ses deux petites textures, faites et rendues
     avec celles de la phrase */
  const creerEcr = () => {
    if (Tencre || !ecr) return; Tencre = papier.texture(ecr.encre, { plein: true }); Ttemps = papier.donnees(ecr.temps.w, ecr.temps.h, ecr.temps.px);
    if (ecr.point) { Tpoint = papier.texture(ecr.point.encre, { plein: true }); TtempsPoint = papier.donnees(ecr.point.temps.w, ecr.point.temps.h, ecr.point.temps.px); }
  };
  /* P4 (seizième passe) : sur ordinateur, les textures de l'écriture sont envoyées par bandes, depuis les pixels rendus par
     l'ouvrier, dans la file des préparations (d'un bloc : 10 à 30 ms) ; si la page arrive avant, creerEcr d'un coup */
  function* creerEcrEtapes() {
    if (Tencre || !ecr) return;
    if (!ecr.encrePx || !papier.ok) { creerEcr(); return; }
    const a = {}, b = {};
    yield* papier.textureEtapes(ecr.encrePx.w, ecr.encrePx.h, ecr.encrePx.data, { plein: true }, a);
    yield* papier.donneesEtapes(ecr.temps.w, ecr.temps.h, ecr.temps.px, b);
    if (Tencre || !a.T.tex) { papier.supprimer(a.T); papier.supprimer(b.T); if (!Tencre) creerEcr(); return; }
    Tencre = a.T; Ttemps = b.T; ecr.encrePx = null;
    if (ecr.point) { Tpoint = papier.texture(ecr.point.encre, { plein: true }); TtempsPoint = papier.donnees(ecr.point.temps.w, ecr.point.temps.h, ecr.point.temps.px); }
    if (F.demander) F.demander();
  }
  const oublierEcr = () => { if (!Tencre) return; papier.supprimer(Tencre); papier.supprimer(Ttemps); Tencre = Ttemps = null; if (Tpoint) { papier.supprimer(Tpoint); papier.supprimer(TtempsPoint); Tpoint = TtempsPoint = null; } };
  function memoireEcr(p) {
    if (!TEL || !ecr) return;
    if (p > .88 && !Tencre && !tacheEcr) { tacheEcr = { nom: 'ecriture', besoin: .95, gen: (function* () { yield; creerEcr(); tacheEcr = null; })() }; planifier(tacheEcr); }
    else if (p < .84 && Tencre) oublierEcr();
    /* N1 : de même, la feuille tournée (sa texture, son dos et leurs canevas : 16 Mo) n'existe que près de la page ; refaite
       au retour (la clé vide force la recopie) */
    if (p < .84 && (Tfeuille || Tdos || dosC.width)) {
      papier.supprimer(Tfeuille); papier.supprimer(Tdos); Tfeuille = Tdos = null; cleTex = '';
      if (dosBase && dosBase.width !== undefined) { dosBase.width = dosBase.height = 0; } dosBase = null; dw = 0; dosC.width = dosC.height = 0;
    }
    if (p >= T.ecrit[0] - .004 && !Tencre) creerEcr();
  }
  /* N2 (quatorzième passe) : la feuille tournée (sa texture, son ombre floue, son dos) préparée en tâche de fond dès 0,92 (le
     dessin est fini) : elle l'était à la première image de la page (42 ms d'un bloc dans Safari) */
  function preparerPage() { if (papier.ok && atelier.canevas.width && (!Tfeuille || cleTex !== atelier.cle)) { if (!Tfeuille) Tfeuille = papier.texture(atelier.canevas, { plein: true }) /* N1 : la feuille dessinée garde sa résolution (texte lu pendant que la page tourne) */; else Tfeuille.maj(atelier.canevas); if (!Flous) Flous = papier.flous(atelier.canevas, .12); majDos(); cleTex = atelier.cle; } }
  let tachePage = null, tacheDos = null;
  /* T8 bis (07/10/2026, fin d'après-midi) : les mailles de la page posée, gardées d'une image à l'autre (voir plus bas) */
  const CACHE_PAGE = { cle: '', n: 0, G: null, Gs: null };
  function prechaufferPage(p) {
    /* N2 : dès 0,9195 (le dessin est fini ; 0,4 s avant la page, en urgence) : la texture de la feuille, son ombre, son dos,
       puis la page blanche */
    if (p > .86 && p < .93 && !dosBase && !tacheDos) { tacheDos = { nom: 'page-dos', besoin: .93, gen: (function* () { yield; if (atelier.canevas.width && !dosBase) faireDosBase(); tacheDos = null; })() }; planifier(tacheDos); }
    if (p > .9195 && p < .93 && papier.ok && !tachePage && atelier.canevas.width && (!Tfeuille || cleTex !== atelier.cle)) { tachePage = { nom: 'page-feuille', besoin: .93, gen: (function* () {
      /* le dessin est fini (0,919) : la texture de la feuille, son ombre, son dos, la page blanche, une étape chacune */
      yield; if (!atelier.canevas.width) { tachePage = null; return; }
      if (!Tfeuille) Tfeuille = papier.texture(atelier.canevas, { plein: true }); else if (cleTex !== atelier.cle) Tfeuille.maj(atelier.canevas);
      cleTex = atelier.cle; yield;
      /* la feuille a pu rendre sa mémoire entre deux étapes (retour loin en arrière) : on s'arrête */
      const ok = () => atelier.canevas.width > 0;
      if (!ok()) { tachePage = null; return; } if (!Flous) Flous = papier.flous(atelier.canevas, .12); yield;
      if (!ok()) { tachePage = null; return; } faireDosBase(); yield;
      if (!ok()) { tachePage = null; return; } majDos(); yield;
      if (ok() && atelier.preparerPageBlanche) atelier.preparerPageBlanche(); tachePage = null; })() }; planifier(tachePage, true); }
  }
  /* P2 (seizième passe) : l'écriture de Thibaut (le temps de chaque pixel relu dans une image de 2174 x 833, étendu de trois
     pixels, puis ses deux textures) se calculait dès la création du film : 40 à 60 ms d'un bloc dans Chrome, juste après la
     première image, en plein dans l'apparition du téléphone. Elle n'est demandée que par la file des préparations (besoin
     0,90), ou tout de suite si l'on arrive près de la page (p au-delà de 0,90) */
  let ecrDemandee = false;
  const demanderEcr = () => { if (ecrDemandee) return; ecrDemandee = true; ecritureReelle().then(r => { if (r && papier.ok) { ecr = r; if (!TEL) planifier({ nom: 'ecriture-textures', besoin: .9, gen: creerEcrEtapes() }); if (F.demander) F.demander(); } }); };
  planifier({ nom: 'ecriture-lecture', besoin: .9, gen: (function* () { yield; demanderEcr(); })() });

  /* La page qui se tourne (D15). Repère : largeur de la feuille = 1, Y de 0 (haut) à A (bas), z vers le spectateur.
     c : la ligne du pli, qui remonte la page ; R : le rayon du pli. Sous le pli, la feuille est à plat ; au-delà, elle
     s'enroule sur un demi-cylindre puis repart à plat, retournée, à la hauteur 2R. Passé le bord du pupitre (yBord),
     elle retombe derrière : sa hauteur devient négative et le shader la cache (le bois la masque). */
  /* T8 : la droite du bord du pupitre à l'écran (lignePupitre) n'est plus utilisée depuis T13 (la feuille ne passe plus derrière le
     pupitre sur téléphone) : retirée */
  /* T8 : la répartition des rangées : mesurée sur trois colonnes, la longueur et surtout la courbure de la feuille le long de sa
     hauteur ; les rangées suivent leur somme (35 % la longueur, 65 % la courbure) : le rouleau reçoit l'essentiel des rangées */
  const RG = 160, rgY = new Float32Array(RG + 1), rgZ = new Float32Array(RG + 1), rgW = new Float64Array(RG + 1), rgO = [0, 0, 0];
  function rangeesPage(forme, A, v0 = 0, v1 = 1) {
    const W = rgW; W.fill(0);
    let Ltot = 0, Ttot = 0; const L = new Float64Array(RG), Th = new Float64Array(RG);
    for (const X of [.15, .5, .85]) {
      for (let k = 0; k <= RG; k++) { forme(X, (v0 + (v1 - v0) * k / RG) * A, rgO); rgY[k] = rgO[0]; rgZ[k] = rgO[1]; }
      for (let k = 0; k < RG; k++) {
        const dy = rgY[k + 1] - rgY[k], dz = rgZ[k + 1] - rgZ[k]; L[k] += Math.hypot(dy, dz);
        if (k > 0) { const a0 = Math.atan2(rgZ[k] - rgZ[k - 1], rgY[k] - rgY[k - 1]), a1 = Math.atan2(dz, dy); let d = Math.abs(a1 - a0); if (d > Math.PI) d = 2 * Math.PI - d; Th[k] += d; }
      }
    }
    for (let k = 0; k < RG; k++) { Ltot += L[k]; Ttot += Th[k]; }
    let s = 0; W[0] = 0;
    for (let k = 0; k < RG; k++) { s += (Ttot > 1e-6 ? .35 : 1) * L[k] / (Ltot || 1) + (Ttot > 1e-6 ? .65 * Th[k] / Ttot : 0); W[k + 1] = s; }
    for (let k = 0; k <= RG; k++) W[k] /= s || 1;
    return t => {
      if (t <= 0) return 0; if (t >= 1) return 1;
      let lo = 0, hi = RG; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (W[m] < t) lo = m; else hi = m; }
      const f = (t - W[lo]) / ((W[hi] - W[lo]) || 1); return (lo + f) / RG;
    };
  }
  function formePage(c0, R, ondule, posee, yBord, A) {
    const f = (X, Y, out) => {
      const m = f.mod ? f.mod(X) : null, Rx = m ? R * m.kR : R;
      const c = clamp(c0 + (X - .82) * f.biais + (m ? m.dc : 0), -A, A);
      let y, z;
      if (Y <= c) { y = Y; z = 0; }
      else if (TEL && f.k !== undefined && Y - c >= Math.PI * Rx) { const r = rabatTel(f, c, Rx, Y - c - Math.PI * Rx, X, Y - c, yBord, A); out[0] = r[0]; out[1] = r[1]; out[2] = 0; return out; }   /* Y13 */
      else {
        const dd = Y - c;
        if (dd < Math.PI * Rx) { const a = dd / Rx; y = c + Rx * Math.sin(a); z = Rx * (1 - Math.cos(a)); }
        else { y = c - (dd - Math.PI * Rx); z = 2 * Rx; }
        /* le papier ondule dans le pli et sur la partie retournée, plus fort loin du pli */
        z += ondule * A * (.028 * Math.sin(X * Math.PI * 2.1 + dd * 9) + .012 * Math.sin(X * Math.PI * 5.3 - dd * 4)) * clamp(dd / (A * .3));
        z = Math.max(z, 0) * (1 - posee) + posee * .0018;
      }
      /* passé le bord du pupitre : le papier s'y plie et retombe derrière, caché par le bois. L11 (douzième passe) : la
         boucle de la lisière de K3 est retirée */
      /* T13 (07/10/2026) : sur téléphone, le haut de la planche est dans le cadre (l'ordinateur le laisse sous la barre de
         navigation) : on voyait la feuille retournée coupée net au bord du pupitre, comme glissée sous le bois. Sur téléphone,
         elle ne retombe plus derrière : elle continue, retournée, devant le mur, et sort du cadre par le haut, comme sur
         ordinateur ; elle est toujours devant la planche et son bord */
      /* U3 (vingt et unième passe, 07/10/2026) : T13 est annulé sur téléphone, mais sa forme reste : la feuille garde ici sa forme
         plate au-delà du bord, et c'est la droite du bord du pupitre à l'écran qui la coupe (papier.js, clip, lissée sur un pixel)
         avec, juste avant, le rebord du pli éclairé par sa courbure (papier.js, rebord) : voir plus bas, « U3 : le pli » */
      if (y < yBord && !TEL) { const e = yBord - y, th = Math.min(Math.PI / 2, e / .02); y = yBord - e * Math.cos(th) * .25; z = z - e * Math.sin(th) * 1.4; out[2] = z < 0 ? z : 0; }
      else out[2] = 0;
      out[0] = y; out[1] = z; return out;
    };
    f.biais = 0; f.mod = null;
    return f;
  }
  /* Y13 (vingt-cinquième passe, 09/10/2026) : sur téléphone, la partie retournée (le rabat). Thibaut, sur la v3 : « toujours pareil, une
     feuille droite qui tombe sur la table, et une vraie régression : quand elle se retourne, elle repasse à travers la planche ». Le film
     en direct fait la même chose (vérifié image par image, horloge virtuelle, 393 x 735) : ce n'est pas la vidéo. Deux causes. 1. Le rabat
     était une planche plate à la hauteur 2R (R est petit : 2R vaut au plus 0,11 de la largeur), sans courbe ni chute. 2. Depuis U3, tout
     ce qui passait le bord du pupitre était coupé par la droite du bord à l'écran, même en l'air : la main tenait le coin au-dessus du
     bois, sur le mur, et la feuille s'arrêtait net au bord, comme passée dans la planche.
     Ici : le rabat est un arc de courbure f.k (positive : le bout se relève ; la main le soulève, puis il retombe de lui-même, en
     ralentissant, et se pose ; voir plus bas) ; après le rouleau du pli, il redescend vers le bois sur f.Ld (il longe la table) ;
     passé le bord, tant qu'il est en l'air il continue devant le mur (il se voit) ; dès qu'il arrive bas au bord, il se plie sur l'arête
     du bois (rayon RIM) et pend derrière : le pupitre le cache (papier.js, bordTel : caché seulement au-delà du bord et du côté du bois
     à l'écran). Ordinateur : inchangé (la branche n'est prise que sur téléphone, f.k n'y est jamais défini) */
  const RIM = .006, arcY = (s, k) => Math.abs(k * s) < 1e-4 ? s : Math.sin(k * s) / k, arcZ = (s, k) => Math.abs(k * s) < 1e-4 ? k * s * s / 2 : (1 - Math.cos(k * s)) / k;
  const smo = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const rT = [0, 0];
  function rabatTel(f, c, Rx, s, X, dd, yBord, A) {
    /* le côté de la main (X 0,82) plus relevé que l'autre, qui pend un peu : le bord libre n'est pas une règle */
    const k = f.k * (1 + f.torsion * (X - .82)), zr = 2 * Rx, base = u => zr * (1 - smo(u / f.Ld));
    const ond = f.ond * A * (.028 * Math.sin(X * Math.PI * 2.1 + dd * 9) + .012 * Math.sin(X * Math.PI * 5.3 - dd * 4)) * clamp(dd / (A * .3));
    let y = c - arcY(s, k), z = base(s) + arcZ(s, k) + ond * (1 - f.pose);
    if (y < yBord) {
      /* l'endroit où le rabat passe le bord, et sa hauteur là */
      const D = c - yBord; let sb;
      if (D <= 0) sb = 0; else if (Math.abs(k) < 1e-4) sb = D; else { const q = k * D; sb = Math.abs(q) >= 1 ? Infinity : Math.asin(q) / k; }
      if (sb < s) {
        /* plié au bord dès que le rabat n'est plus soulevé là (sa hauteur au-dessus de sa forme posée : la courbe seule) */
        const ze = Math.max(0, base(sb) + arcZ(sb, k)), w = 1 - smo((arcZ(sb, k) - f.zBas) / (f.zHaut - f.zBas)), e = s - sb, a = e / RIM;
        /* Y14 (09/10/2026, soir) : Thibaut, sur la v4 : « la feuille se rabat à l'intérieur de la planche et non par-dessus » (le rabat
           passait sous le rebord haut de la planche à dessin, sa lisière en dents de scie). Posé au bord, le rabat ne pend plus derrière
           le bois : il s'y relève, appuyé sur le rebord puis contre le mur, devant eux (rien n'est caché, plus de coupe) */
        const yh = a < Math.PI / 2 ? yBord - RIM * Math.sin(a) : yBord - RIM, zh = a < Math.PI / 2 ? ze + RIM * (1 - Math.cos(a)) : ze + RIM + (e - RIM * Math.PI / 2);
        y = y + (yh - y) * w; z = z + (zh - z) * w;
        rT[0] = y; rT[1] = z; return rT;
      }
    }
    rT[0] = y; rT[1] = Math.max(z, .0015); return rT;
  }
  /* U3 : sur téléphone, le bord du pupitre dans le repère de la feuille, mesuré par l'homographie de la photo (le milieu du haut
     du quadrilatère « planche », ramené dans le carré de la feuille) ; l'ancien calcul (écart vertical des deux quadrilatères
     divisé par la largeur de la feuille) ne tient pas compte de la proportion de la feuille ni de la perspective : il tombait
     22 px sous le bord du bois sur téléphone (mesuré : 375 x 667, 21 px ; 393 x 695 et 390 x 844, 22 px ; 430 x 932, 24 px).
     L'ordinateur garde l'ancien calcul (la version validée par Thibaut ; le bord y est sous la barre de navigation) */
  let yBordTel = null;
  /* U3 : la largeur du rebord du pli à l'écran (px CSS) */
  const REBORD = 4.5;
  const bordTel = A => { if (yBordTel === null) { const qp = atelier.Q.planche, qf = atelier.Q.feuille, v = appl(inv3(carreVers(qf)), (qp[0][0] + qp[1][0]) / 2, (qp[0][1] + qp[1][1]) / 2)[1]; yBordTel = v; } return yBordTel * A; };
  const o2 = [0, 0, 0], s3 = [0, 0];
  let tPose = null;   /* l'instant (temps réel) où la feuille retournée s'est posée : elle finit de se poser d'elle-même */

  /* cinquième passe, E1 : plus de bouton sur la feuille retournée ; « Lancer le film » devient « Revoir le film » à la fin */

  /* le crayon du visiteur : on le prend, on le déplace, il trace sur la page */
  const g = trace.getContext('2d');
  /* G4 : le brouillon du visiteur ne reste pas. Il pâlit en une seconde dès qu'on quitte la page blanche ; sur la
     page, un bouton « Effacer le brouillon » paraît dès qu'il a tracé quelque chose (fondu court) */
  let aTrace = false, gomme = null;
  const effacer = el('<button type="button" class="ep brouillon" tabindex="-1">Effacer le brouillon</button>');
  F.ctx.porteurs.appendChild(effacer);
  /* K3 (onzième passe), repris en L11 : la page retombée est une commande « Revoir le film » (au pointeur, sur la partie
     retournée posée sur le pupitre ; au clavier, c'est le bouton « Revoir le film » des commandes, qui fait la même chose) */
  const lisiere = el('<button type="button" class="ep lisiere-revoir" tabindex="-1" aria-label="Revoir le film" title="Revoir le film"></button>');
  F.ctx.porteurs.appendChild(lisiere);
  lisiere.addEventListener('click', e => { e.stopPropagation(); if (F.revoir) F.revoir(); });
  effacer.addEventListener('click', e => { e.stopPropagation(); if (aTrace) { gomme = { t0: performance.now(), d: 260 }; F.demander && F.demander(); } });
  function vider() { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, trace.width, trace.height); aTrace = false; gomme = null; trace.style.opacity = ''; }
  let libre = null, prise = null, dernier = null;
  const versPage = (x, y) => { const H = inv3(atelier.Hfeuille()), [u, v] = appl(H, x, y), [SW, SH] = atelier.taille; return [u * SW, v * SH]; };
  function tracer(a, b) {
    const [SW, SH] = atelier.taille, pa = versPage(...a), pb = versPage(...b);
    const dans = q => q[0] > 8 && q[0] < SW - 8 && q[1] > SH * .08 && q[1] < SH - 8;
    if (!dans(pa) || !dans(pb)) return;
    const k = SW / 1200;
    aTrace = true; gomme = null; trace.style.opacity = '';
    g.save(); g.lineCap = 'round'; g.strokeStyle = 'rgba(22,32,92,.7)';
    for (let i = 0; i < 2; i++) { g.lineWidth = (1.6 + Math.random() * 1.2) * k; g.globalAlpha = .45 + Math.random() * .35; g.beginPath(); g.moveTo(pa[0] + (Math.random() - .5) * k, pa[1] + (Math.random() - .5) * k); g.lineTo(pb[0] + (Math.random() - .5) * k, pb[1] + (Math.random() - .5) * k); g.stroke(); }
    g.restore();
  }
  /* F15 : le crayon se repose pour de bon. Pris par un appui (on dessine en glissant) : au relâchement, il revient se
     coucher sur la règle, avec un petit mouvement de pose. Pris par un double-clic sur la règle : il reste en main et
     suit le pointeur, il trace quand on appuie ; un clic hors de la feuille, ou Échap, le repose. */
  let tenu = false, retour = null;
  const ici = e => { const r = F.scene.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const surFeuille = pt => { const [SW, SH] = atelier.taille, q = versPage(...pt); return q[0] > 0 && q[0] < SW && q[1] > 0 && q[1] < SH; };
  function reposer() {
    if (!libre) { tenu = false; return; }
    retour = { de: libre.slice(), t0: performance.now() }; tenu = false; prise = null;
    F.demander && F.demander();
  }
  crayonB.addEventListener('pointerdown', e => {
    if (!crayonB.classList.contains('libre')) return;
    e.preventDefault(); e.stopPropagation(); crayonB.setPointerCapture(e.pointerId);
    retour = null;
    prise = { id: e.pointerId }; libre = ici(e); dernier = libre.slice();
    F.demander && F.demander();
  });
  crayonB.addEventListener('pointermove', e => {
    if (!prise || e.pointerId !== prise.id) return;
    const pt = ici(e);
    tracer(dernier, pt); dernier = pt; libre = pt;
    F.demander && F.demander();
  });
  const lacher = e => { if (prise && e.pointerId === prise.id) { prise = null; if (!tenu) reposer(); F.demander && F.demander(); } };
  crayonB.addEventListener('pointerup', lacher); crayonB.addEventListener('pointercancel', lacher);
  crayonB.addEventListener('dblclick', e => {
    if (!crayonB.classList.contains('libre')) return;
    e.preventDefault(); e.stopPropagation();
    retour = null; tenu = true; libre = ici(e); dernier = libre.slice(); F.demander && F.demander();
  });
  /* tenu en main : il suit le pointeur ; il trace quand le bouton est appuyé ; un clic hors de la feuille le repose */
  F.scene.addEventListener('pointermove', e => {
    if (!tenu || prise) return;
    const pt = ici(e);
    if (e.buttons & 1) tracer(dernier, pt);
    dernier = pt; libre = pt; F.demander && F.demander();
  });
  F.scene.addEventListener('pointerdown', e => {
    if (!tenu || e.target === crayonB) return;
    const pt = ici(e);
    if (!surFeuille(pt)) { reposer(); return; }
    dernier = pt; libre = pt;
  });
  crayonB.addEventListener('keydown', e => {
    if (!crayonB.classList.contains('libre')) return;
    if (e.key === 'Escape') { if (libre) { e.preventDefault(); e.stopPropagation(); reposer(); } return; }
    const pas = 14, d = { ArrowLeft: [-pas, 0], ArrowRight: [pas, 0], ArrowUp: [0, -pas], ArrowDown: [0, pas] }[e.key];
    if (!d) return; e.preventDefault(); e.stopPropagation();
    retour = null;
    const base = libre || F.pointePosee; if (!base) return;
    const pt = [base[0] + d[0], base[1] + d[1]]; tracer(base, pt); libre = pt; F.demander && F.demander();
  });

  /* la phrase : sa place sur la page (coordonnées de la feuille), et la bulle dessous */
  function placePhrase() {
    const [SW, SH] = atelier.taille, H = atelier.Hfeuille();
    const Ls = Math.hypot(...[0, 1].map(i => appl(H, 1, .5)[i] - appl(H, 0, .5)[i]));
    const r = ecr ? ecr.info.taille[0] / ecr.info.taille[1] : 2.61;
    /* la phrase gagne 20 % (troisième passe, B.2) */
    /* G3 : sur ordinateur, réduite de 20 % et montée, décalée vers la droite pour laisser le téléphone en bas à gauche */
    const uw = F.mob ? Math.min(.88, F.W * .9 / Ls) : .7, vh = uw * SW / r / SH;
    const u0 = F.mob ? .5 - uw / 2 : .25, v0 = F.mob ? .14 : .065;
    return { u0, v0, uw, vh, Ls, Hs: Math.hypot(...[0, 1].map(i => appl(H, .5, 1)[i] - appl(H, .5, 0)[i])) };
  }
  function pointePhrase(t, P) {
    const pts = ecr.info.pointe; let i = 0; while (i < pts.length - 2 && pts[i + 1][0] < t) i++;
    const a = pts[i], b = pts[i + 1], k = clamp((t - a[0]) / ((b[0] - a[0]) || 1));
    const x = lerp(a[1], b[1], k), y = lerp(a[2], b[2], k);
    return appl(atelier.Hfeuille(), P.u0 + x * P.uw, P.v0 + y * P.vh);
  }

  /* ---- H8, H10 : le téléphone reste dans la main gauche ----
     Trois poses du téléphone, en pose3d (centre, hauteur, rapport, rotations) : R, debout sur la règle (le
     quadrilatère de l'atelier) ; S, tenu de trois quarts au bord gauche, à moitié dans le cadre, en bas ; Fi, tenu
     face au spectateur, à la place du téléphone final de G3 (en bas à gauche de la page, à cheval sur le bord). La
     main gauche est posée par sa plaque sur le quadrilatère du téléphone : le téléphone est toujours dans le trou de
     la main, jamais d'écart. */
  const vT = F.vis.telephone, coT = reperesPx(vT, 'corps'), aspT = coT ? (coT[1][0] - coT[0][0]) / (coT[3][1] - coT[0][1]) : .4836;
  const pose = (P, Q, k) => { const o = {}; for (const c of ['cx', 'cy', 'h', 'asp', 'rx', 'ry', 'rz']) o[c] = lerp(P[c], Q[c], k); return o; };
  function poseRegle() {
    const q = atelier.quadTel(), h = q[3][1] - q[0][1], w = q[1][0] - q[0][0];
    return { cx: (q[0][0] + q[1][0]) / 2, cy: (q[0][1] + q[3][1]) / 2, h, asp: w / h, rx: 0, ry: 0, rz: 0 };
  }
  function poseCote(R) {
    const h = R.h * 1.06, w = h * aspT;
    /* K4 (onzième passe) : tenu au bord gauche, il se montre aux deux tiers de sa largeur apparente (de trois quarts à 32
       degrés, elle vaut 0,85 fois sa largeur) et non plus à moitié ; la feuille utile commence bien plus à droite */
    return { cx: w * .85 * (2 / 3 - .5) + w * .02, cy: F.H - h * .5 - F.H * .045, h, asp: aspT, rx: -4, ry: 32, rz: 7 };
  }
  /* G3 et H10.3 : la place du téléphone final, sa taille (au moins 404 px, pour que les boutons fassent 44 px) */
  function poseFin(R) {
    const H = atelier.Hfeuille(), B = appl(H, 0, 1), h = Math.min(F.H * .62, Math.max(R.h, 404)), w = h * aspT;
    return { cx: B[0] + w * .66, cy: Math.min(B[1] - h * .44, F.H - h * .5 - 34), h, asp: aspT, rx: -3, ry: 5, rz: 4 };
  }
  /* la main qui approche : départ doux, longue décélération jusqu'au contact */
  const eApproche = bezier(.33, .02, .2, 1);
  /* I4 (neuvième passe) : la vraie main ouverte, dès que main-gauche-ouverte est au manifeste (repères poignet, creux,
     pouce, index ; livrée le 04/10/2026). Sinon, la prise de la huitième passe, inchangée. Le poignet des deux images
     (le même pli, au même endroit) est le point fixe du fondu ; sans repère, (0,33 ; 0,97). */
  const vOuv = F.vis['main-gauche-ouverte'], vMG = F.vis['main-gauche-telephone'];
  const OUV = vOuv && mains.has('main-gauche-ouverte') ? {
    poignet: reperesPx(vOuv, 'poignet') || [vOuv.w * .33, vOuv.h * .97],
    creux: reperesPx(vOuv, 'creux') || [vOuv.w * .62, vOuv.h * .5],
    poignetTel: reperesPx(vMG, 'poignet') || [vMG.w * .33, vMG.h * .97],
    plaqueTel: reperesPx(vMG, 'quad')
  } : null;
  /* le fondu de la main ouverte vers la main qui tient : de kP 0,55 (le contact) à 0,81, soit 0,24 s de film */
  const FONDU = [.55, .81];
  /* I4 : la main ouverte est posée par la même homographie que la main qui tient (sa plaque sur le téléphone), composée
     avec une similitude entre les deux images : le poignet de l'une sur le poignet de l'autre, le creux de la main
     ouverte sur le centre de la plaque (là où est le téléphone). Les deux images ont le même cadrage : cette similitude
     est presque l'identité (échelle et angle tenus à 12 % et 12 degrés quoi qu'il arrive). Le poignet ne saute donc
     jamais au fondu. */
  const Sim = (() => {
    if (!OUV) return null;
    const q = OUV.plaqueTel, cT = [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4];
    const vo = [OUV.creux[0] - OUV.poignet[0], OUV.creux[1] - OUV.poignet[1]], vc = [cT[0] - OUV.poignetTel[0], cT[1] - OUV.poignetTel[1]];
    const s = clamp(Math.hypot(vc[0], vc[1]) / Math.max(1, Math.hypot(vo[0], vo[1])), .88, 1.12), a = clamp(Math.atan2(vc[1], vc[0]) - Math.atan2(vo[1], vo[0]), -.21, .21);
    const cs = Math.cos(a) * s, sn = Math.sin(a) * s;
    return [cs, -sn, OUV.poignetTel[0] - (cs * OUV.poignet[0] - sn * OUV.poignet[1]), sn, cs, OUV.poignetTel[1] - (sn * OUV.poignet[0] + cs * OUV.poignet[1]), 0, 0, 1];
  })();
  const similitudeOuverte = qMain => mult3(quadVersQuad(OUV.plaqueTel, qMain), Sim);
  let tVibre = null;
  function telDansLaMain(p) {
    const R = poseRegle(), S = poseCote(R), Fi = poseFin(R);
    const kP = seg(p, T.telPrise[0], T.telPrise[1]), kL = eDepl(seg(p, T.telLeve[0], T.telLeve[1])), kR = eDepl(seg(p, T.telRetour[0], T.telRetour[1]));
    /* la respiration lente des mains du plan 3, dès que le téléphone a quitté la règle */
    const r = respire(F, 0), kResp = sseg(kL, .3, 1);
    let P;
    if (kR > 0) P = pose(S, Fi, kR);
    else if (kL > 0) P = pose(R, S, kL);
    else P = Object.assign({}, R);
    /* la prise : le téléphone s'incline vers la paume et se cale (rotation autour du pied, petit tassement), puis son
       pied quitte la règle */
    /* I4 : avec la main ouverte, le téléphone passe de « posé » à « dans le trou de la main » à la fin du fondu */
    /* le petit tassement et l'inclinaison vers la paume commencent quand les doigts touchent (le milieu du fondu,
       0,3 s avant que la main le soulève) ; le téléphone est « dans la main » (profondeur, ombre de contact) à la fin */
    const k0 = OUV ? FONDU[1] : .55, kc = OUV ? (FONDU[0] + FONDU[1]) / 2 : .55;
    const contactP = seg(kP, k0, k0 + .2), cale = kP > kc && kP < 1 ? Math.sin(Math.PI * seg(kP, kc, 1)) * Math.exp(-1.2 * seg(kP, kc, 1)) : 0;
    P.rz += -4.2 * cale * (1 - kL) - 2.2 * Math.sin(Math.PI * kL) * (1 - kR);
    P.cy += -4 * cale - 12 * Math.sin(Math.PI * kL);
    P.cx += 2.5 * cale;
    P.cx += r.dx * kResp; P.cy += r.dy * kResp; P.rz += r.rot * kResp;
    /* H10.3 bis : la notification ; deux secousses de 120 ms, en temps réel (une fois, quand p passe la borne en avançant
       dans la main écartée) ; le téléphone et la main tremblent ensemble */
    if (p >= T.vibre[0] && p < T.telRetour[0] + .0015) { if (tVibre === null) tVibre = F.t; }
    else if (p < T.vibre[0]) tVibre = null;
    let vx = 0, vy = 0, vr = 0;
    if (tVibre !== null) {
      const d = F.t - tVibre, sec = (a) => d >= a && d < a + .12 ? Math.sin(Math.PI * (d - a) / .12) : 0, env = sec(0) + sec(.19);
      if (d < .34) { F.vivant = true; F.fluide = true; vx = env * 2.6 * Math.sin(d * 2 * Math.PI * 29); vy = env * 1.6 * Math.sin(d * 2 * Math.PI * 23 + 1.3); vr = env * .5 * Math.sin(d * 2 * Math.PI * 17); }
    }
    P.cx += vx; P.cy += vy; P.rz += vr;
    const { quad, ep: ep3 } = pose3d(Object.assign({ f: 1500 }, P));
    const ep = kL > 0 || kR > 0 ? ep3 : [0, 0];
    /* l'ombre : courte et nette sur la règle, puis longue et douce quand il est soulevé, presque rien tenu au bord */
    const lev = Math.max(seg(kP, .72, 1) * .3, kL);
    const ombre = { dx: lerp(7, 26, lev), dy: lerp(5, 34, lev), op: lerp(.36, .14, lev) };
    const contact = kL > 0 ? 0 : 1 - seg(kP, .72, 1);
    tel.poser({ quad, ep, z: kP > (OUV ? FONDU[1] : .45) ? 30 : 16, ombre, contact, glisse: 1.4 + .5 * kL - .3 * kR, reflet: .8 + .2 * Math.max(kL, kR) });
    /* l'écran : la conversation ; au bord, la veille douce ; la notification l'allume, Marianne écrit, les boutons se posent */
    tel.conversation(.19, T);
    const kA = eEntree(seg(p, T.telAllume[0], T.telAllume[1])), kV = sseg(p, T.telVeille[0], T.telVeille[1]) * (1 - sseg(p, T.telAllume[0], T.telAllume[0] + .0004));
    const kE = seg(p, T.telEcran[0], T.telEcran[1]);
    tel.etatEcran({ guide: 0, veille: 0, menu: 0, tete: kA, voile: .34 * kV, heure: 6 * 60 + 53 + 24 * 60, actif: kE >= 1 });
    tel.arrivee({ msg: kA, liens: kE });
    F.telPage = kE > 0 ? quad : null;
    F.telFin = quad;
    /* la main gauche : elle entre par le bas à gauche, un peu plus ouverte (sa plaque un peu plus grande que le
       téléphone), se referme sur lui au contact, puis ne le quitte plus */
    const kE0 = eApproche(seg(kP, 0, .58)), ouvre = OUV ? 1 : 1 + .1 * (1 - sseg(kP, .36, .66));
    /* le poignet tourne un peu en arrivant (la main ne glisse pas d'un bloc) : rotation autour du coin bas gauche */
    const c = centreQuad(quad), aM = 9 * (1 - kE0) * Math.PI / 180, ca = Math.cos(aM), sa = Math.sin(aM), pv = quad[3];
    const qMain = quad.map(([x, y]) => { const X = c[0] + (x - c[0]) * ouvre - pv[0], Y = c[1] + (y - c[1]) * ouvre - pv[1]; return [pv[0] + X * ca - Y * sa, pv[1] + X * sa + Y * ca]; });
    const decale = [-(1 - kE0) * F.W * .11, (1 - kE0) * F.H * .62];
    if (kP > 0 && OUV) {
      /* I4 : la main ouverte entre par le bas à gauche (même trajet, même rotation du poignet que la main qui tient),
         son creux vient autour du téléphone debout ; au contact, fondu vers la main qui tient (0,24 s), les deux images
         posées sur le même poignet */
      const f = sseg(kP, FONDU[0], FONDU[1]);
      const Ho = mult3([1, 0, decale[0], 0, 1, decale[1], 0, 0, 1], similitudeOuverte(qMain));
      /* la main ouverte passe derrière le téléphone debout (z 15, le téléphone posé est à 16) : sa paume est là où sera
         le téléphone ; on voit l'avant-bras, le bord de la paume et les bouts des doigts autour de lui. Devant, elle le
         cacherait. La main qui tient, elle, est devant (son trou laisse voir le téléphone) */
      if (f < 1) mains.parH('main-gauche-ouverte', Ho, { z: 15, op: clamp(kP * 4) * (1 - f) });
      if (f > 0) mains.plaque('main-gauche-telephone', qMain, { z: 37, decale, op: f, contact: contactP > .5 });
    } else if (kP > 0) mains.plaque('main-gauche-telephone', qMain, { z: 37, decale, op: clamp(kP * 4), contact: contactP > .5 });
  }

  /* T7 (vingtième passe, 07/10/2026) : sur téléphone, les trois boutons de la fin (Marianne, Conseil, Atelier) étaient posés au-dessus
     du rail, à hauteur fixe : sur un écran court (375 x 667, ou l'iPhone de Thibaut barres de Safari visibles), ils chevauchaient le
     bas de la feuille blanche. Ils se posent désormais au milieu de la zone sombre sous la feuille (le bois, la pierre), entre le bas
     de la feuille et ce qui borne l'écran en bas (le haut du rail, le bas de la partie visible de la page, barres de Safari
     comprises, le bas de la scène), avec au moins 14 px de chaque côté ; si la place manque, la planche remonte d'autant (60 px
     au plus), progressivement, pendant que les boutons arrivent. La bulle « Parler de mon projet » reste sur la feuille, sous la
     phrase (elle suit la planche). Rend le décalage de la planche (px) */
  const MARGE_MENU = 14;
  const RANGEE_MAX = 40;   /* rangée finale (10/10/2026) : la descente au plus, en px */
  let hMenu = 0;
  /* Y9 : la hauteur du rail quand « Continuer » est caché (mesurée en le cachant un instant, une fois par taille de fenêtre) */
  let railFinal = null;
  function hauteurRailFinal(rail, rr) {
    const c = rail.querySelector('[data-continuer]');
    if (!c || c.hidden) return rr.height;
    const cle = innerWidth + 'x' + innerHeight;
    if (!railFinal || railFinal.cle !== cle) { c.hidden = true; const h = rail.getBoundingClientRect().height; c.hidden = false; railFinal = { cle, h }; }
    return railFinal.h;
  }
  function placerMenuFinal(k) {
    const e = tel.ecran;
    if (!(k > 0)) { if (e.classList.contains('place-menu')) e.classList.remove('place-menu'); return 0; }
    const bas = atelier.basFeuilleCamera();
    const sc = F.scene.getBoundingClientRect(), vv = window.visualViewport, vb = vv ? vv.offsetTop + vv.height : innerHeight;
    const rail = document.querySelector('.rail'), hors = document.documentElement.classList.contains('hors-film');
    const rr = rail && !rail.hidden && !hors ? rail.getBoundingClientRect() : null;
    /* Y9 (vingt-cinquième passe, 09/10/2026, décision du coordinateur) : le menu se centre sur la hauteur finale du rail (« Continuer »
       caché, à partir de p 0,995) dès qu'il commence à arriver : il ne saute plus de 5 px quand « Continuer » s'efface. La hauteur du
       rail sans « Continuer » est mesurée une fois par taille de fenêtre */
    const hRail = rr && rr.height ? hauteurRailFinal(rail, rr) : 0;
    const lim = Math.min(F.H, vb - sc.top, rr && rr.height ? rr.bottom - hRail - sc.top : Infinity);
    const liens = e.querySelector('.menu .liens'), hb = liens && liens.offsetHeight ? liens.offsetHeight : 48;
    if (!hMenu || e.offsetHeight) hMenu = e.offsetHeight || 64;
    const d = Math.max(0, Math.min(60, hb + 2 * MARGE_MENU - (lim - bas)));
    /* Rangée finale (10/10/2026, Thibaut, 13 h 40 : « descends légèrement les briques de choix sous l'atelier, pour équilibrer ») : la
       rangée part du bord du pupitre (basF + MARGE_MENU : là où elle touche le rebord quand la bande est juste, comme à 662) et descend
       au milieu de la bande libre jusqu'au haut du rail (1 pour 1), de 40 px au plus ; la planche ne bouge pas (d inchangé). Même règle
       dans le lecteur (proto3.js, RANGEE_MAX) : à 662, film et lecteur posent la rangée au même endroit */
    const basF = bas - d * k, bord = basF + MARGE_MENU, desc = Math.min(RANGEE_MAX, Math.max(0, lim - bord - hb) / 2);
    const haut = Math.round(bord + desc - (hMenu - hb) / 2);
    if (e._mh !== haut) { e._mh = haut; e.style.setProperty('--menu-haut', haut + 'px'); }
    if (!e.classList.contains('place-menu')) e.classList.add('place-menu');
    return d;
  }
  return Object.assign({}, PLANS[7], {
    dims() { cleTex = ''; },
    rendre(p, actif) {
      /* P2 : près de la page (saut de chapitre, ouverture sur la fin), l'écriture est demandée tout de suite */
      if (p > .9) demanderEcr();
      /* P4 : sur ordinateur, si l'écriture commence avant que ses textures soient envoyées par bandes, d'un coup */
      if (!TEL && ecr && !Tencre && p >= T.ecrit[0] - .004) creerEcr();
      /* T14 bis : pas de préparation de la page pendant un geste rapide (un saut qui ne fait que passer par 0,92) */
      if (!(TEL && VUE.rapide())) { memoireEcr(p); prechaufferPage(p); }
      /* U2 (vingt et unième passe) : pendant un geste rapide, rien ne se crée (T14 bis), mais ce qui doit partir part tout de suite :
         au retour rapide de la fin vers le croisement, les textures de la page (23 Mo) restaient 400 ms de plus, pendant que celles
         du CV revenaient (U2) : 48,8 Mo de textures au plus haut sur l'iPhone, au lieu de 32 */
      else if (p < .84) { oublierEcr(); if (Tfeuille || Tdos || dosC.width) { papier.supprimer(Tfeuille); papier.supprimer(Tdos); Tfeuille = Tdos = null; cleTex = ''; if (dosBase && dosBase.width !== undefined) { dosBase.width = dosBase.height = 0; } dosBase = null; dw = 0; dosC.width = dosC.height = 0; } }
      /* G4 : hors de la page blanche, le brouillon s'efface (il pâlit en une seconde s'il se voit encore) */
      const surPage = actif && p >= T.retrait8[0];
      if (aTrace && !surPage && !gomme) gomme = { t0: performance.now(), d: 1000 };
      if (!actif) { if (aTrace) vider(); setV(effacer, false); effacer.tabIndex = -1; return; }
      F.zPapier = 20;
      const P0 = ecr ? placePhrase() : null;
      if (F.mob) {
        /* M5, M6 (treizième passe) : la page part du cadrage de l'idée (celui du plan 7) et glisse vers le milieu de la feuille */
        const f = atelier.Q.feuille, g = atelier.geo.ideeImg, cad = atelier.cadrage, xi = cad ? cad.x : (g[0][0] + g[1][0]) / 2, xf = (f[0][0] + f[1][0]) / 2;
        const xc = lerp(xi, xf, sseg(p, T.mainBas[0], T.tourne[1])), zc = cad ? cad.zoom : atelier.zoomIdee(), dyc = cad ? cad.dy : 0;
        atelier.centrer(xc, zc, dyc);
        /* T7 (vingtième passe) : le téléphone-menu final (les trois boutons) se pose au milieu de la zone sombre sous la feuille */
        const kF = eEntree(seg(p, T.telRetour[0], T.telRetour[1]));
        const d = placerMenuFinal(kF);
        if (d > 0) atelier.centrer(xc, zc, dyc - d * kF);
      }
      atelier.poserPres(1);
      const ech = echelleCrayon(F), vS = F.vis['main-droite-saisit'], pince = reperesPx(vS, 'pince') || [vS.w * .35, vS.h * .37];
      const echS = ech * .92;

      /* ---- 1. H8 et H10 : la main gauche prend le téléphone et le garde jusqu'à la fin ---- */
      if (!F.mob) telDansLaMain(p);
      else {
        /* H10.5 : petit écran, le téléphone est la feuille du bas ; il remonte, compact, avec les trois boutons (G3), sans main */
        const kU = eEntree(seg(p, T.telRetour[0], T.telRetour[1]));
        tel.feuille({ op: 1, descend: 1 - kU, compact: kU > 0 });
        const kM = p >= T.telRetour[0] ? 1 : 0;
        tel.etatEcran({ guide: 0, veille: 0, menu: kM, menuLiens: seg(p, T.telRetour[0], T.telEcran[1]), final: kM > 0 });
        tel.arrivee({ msg: 0 });
        F.telPage = null;
      }

      /* ---- 2. la main retire le clou et emporte le CV ---- */
      /* H10 : le téléphone est tenu au bord gauche ; la main droite emporte donc le CV par où elle est venue, vers le bas
         à droite (plus de traversée devant la main gauche) */
      /* M5 (treizième passe) : sur téléphone, il n'y a pas de CV à déclouer (ni trou de clou dans la feuille) */
      const kd = F.mob ? 1 : seg(p, T.declou[0], T.declou[1]);
      const trou = !F.mob && kd > .25;
      if (kd < 1) {
        const qc = atelier.quadCv(), H = carreVers(qc);
        const cu = (fe.clouBasUV[0] - fe.corpsU[0]) / (fe.corpsU[1] - fe.corpsU[0]), cv = (fe.clouBasUV[1] - fe.corpsV[0]) / (fe.corpsV[1] - fe.corpsV[0]);
        const clou = appl(H, cu, cv);
        /* temps : arrivée de la main (0 à .25), clou retiré (.25 à .4), décollement (.35 à .6), départ (.55 à 1) */
        const arr = eEntree(seg(kd, 0, .25)), tire = eEntree(seg(kd, .25, .4)), decol = eEntree(seg(kd, .35, .62)), part = eDepl(seg(kd, .55, 1));
        const sortie = [F.W * 1.12, F.H * 1.22];
        const dx = part * (sortie[0] - clou[0]) - tire * 4, dy = part * (sortie[1] - clou[1]) - tire * 10 - decol * 18;
        const ang = part * 16 * Math.PI / 180, cs = Math.cos(ang), sn = Math.sin(ang);
        const q = qc.map(([x, y]) => { const X = x - clou[0], Y = y - clou[1]; return [clou[0] + dx + X * cs - Y * sn, clou[1] + dy + X * sn + Y * cs]; });
        /* H9 : du dernier trait du dessin jusqu'au déclouage, le CV cloué reste à sa place, avec son clou et son ombre (il
           n'était plus posé entre le début du plan 8 et T.declou : c'est le trou que Thibaut voyait) */
        fe.surPlan({ quad: q, forme: fe.formeDeclou(F.t, decol), aplat: 1, clouBas: true, ombre: { op: .5, base: [3 + decol * 10, 5 + decol * 14], dir: [.45 + decol * .4, .5 + decol * .5], hmax: .06 + decol * .1 }, clou: tire > 0 ? 0 : 1 });
        /* le clou, dans la pince, part avec la main */
        const pc = [clou[0] + dx, clou[1] + dy];
        if (tire > 0) fe.clouSeul && fe.clouSeul(pc, atelier.quadCv());
        if (p > T.declou[0]) {
          const P = arr < 1 ? [lerp(clou[0] + F.W * .22, clou[0], arr), lerp(clou[1] + F.H * .6, clou[1], arr)] : pc;
          mains.parH('main-droite-saisit', similitude(pince, [P[0], P[1]], -8 - 16 * part, echS), { z: 34, op: clamp(arr * 3) });
        }
      }

      /* ---- 3. la grande feuille : dessinée et achevée ; elle se tourne ---- */
      atelier.poserFeuille({ op: 0, etat: Object.assign(etatIdee(.93), { trou }) });
      /* H7 : le halo du prompt respire jusqu'à ce que la main prenne la feuille ; il s'éteint avant que la page tourne
         (la version fixe peinte dans le papier part avec elle) */
      atelier.poserHalo(1 - sseg(p, T.mainBas[0], T.tourne[0] + .0015));
      const st = seg(p, T.tourne[0], T.tourne[1]), sr = seg(p, T.retombe[0], T.retombe[1]);
      /* T14 bis (07/10/2026) : sur téléphone, arrivé à la page par un saut rapide, la feuille tournée (sa texture pleine
         résolution, son dos, le tampon de lissage) n'est créée qu'après la fin du geste (VUE.rapide) : d'ici là, la feuille
         dessinée est posée à plat, comme avant qu'elle tourne (sur l'iPhone, la page est morte une fois à un saut du croisement
         vers la fin, quand tout cela se créait pendant que le reste se rendait) */
      const attente = TEL && !Tfeuille && VUE.rapide();
      const tourne = (st > 0 || sr > 0) && papier.ok && !attente;
      if (!tourne) atelier.poserFeuille({ op: 1 });
      atelier.poserPage(1);
      /* L13 : les pointes de l'agrafe au dos, tant que la feuille n'est pas retombée */
      if ((sr < .98) !== dosAgrafe) { dosAgrafe = sr < .98; if (Tdos) majDos(); }
      if (!attente) preparerPage();
      const [SW, SH] = atelier.taille, A = SH / SW, Hs = atelier.Hfeuille();
      const Ls = Math.hypot(...[0, 1].map(i => appl(Hs, 1, .5)[i] - appl(Hs, 0, .5)[i]));
      const qp = atelier.Q.planche, qf = atelier.Q.feuille;
      const yBord = TEL ? bordTel(A) : -((qf[0][1] + qf[1][1]) / 2 - (qp[0][1] + qp[1][1]) / 2) / Math.hypot(qf[1][0] - qf[0][0], qf[1][1] - qf[0][1]);   /* U3 */
      const proj = projPlane(Hs, A, [F.W / 2, F.H * .22], 2300, Ls);
      /* le mouvement : la main soulève le bas (lent), le pli remonte (de plus en plus vite), la main lâche quand le bord
         tenu passe le haut du pupitre ; sur son élan la feuille finit de se retourner, dépasse un peu, se pose */
      const us = st < .5 ? 2 * st * st : 1 - 2 * (1 - st) * (1 - st);
      /* Cinquième passe, E2 : retournée, la feuille ne se couche pas à plat sur la page. Sur son élan, elle part de
         biais : à gauche, son pli remonte jusqu'au bord haut du pupitre et elle pend derrière (la gravure « Civik-ia »
         reste visible) ; à droite, elle reste posée sur le haut du pupitre, avec un rouleau mou le long du pli et une
         ondulation lente et ample, et porte son ombre sur le bois et sur la page blanche. Une fois posée, elle finit
         de se poser en quelques secondes (petits balancements amortis, en temps réel), puis ne garde qu'une
         respiration très lente (C5). */
      /* Y14 : sur téléphone, le pli reste droit sur toute la largeur (la gauche ne passe plus derrière le bord : elle s'y relèverait sur
         toute sa longueur) */
      const R_FIN = A * .05, cR = -.012, cL = TEL ? cR : yBord + R_FIN * .3;
      if (p >= T.retombe[1]) { if (tPose === null) tPose = F.t; } else tPose = null;
      const dt = tPose === null ? 0 : Math.max(0, F.t - tPose);
      const amort = Math.exp(-dt / 1.1) * Math.sin(dt * Math.PI * 1.3);
      const souffle = tPose === null ? 0 : sseg(dt, 1, 4) * (Math.sin(F.t * .5) * .6 + Math.sin(F.t * .31 + 1.7) * .4);
      const er = sr <= 0 ? 0 : 1 - Math.exp(-5 * sr) * Math.cos(sr * Math.PI * 2.2);
      /* L11 (douzième passe) : K3 est annulé, Thibaut préférait la page de la dixième passe (D15, F16, E2) : retournée, elle
         reste attachée à la feuille suivante sur sa partie droite (son pli au bord haut du bloc, cR, tenu par une petite
         agrafe dessinée dans le papier), se couche sur le haut du pupitre en y cachant une partie de « Civik-ia » (accepté),
         et, à gauche, son pli remonte jusqu'au bord du pupitre (cL) : elle pend derrière */
      const c0 = sr > 0 ? lerp(-.004, cR, er) + amort * A * .01 : lerp(A * 1.001, -.004, us);
      const R = A * (.025 + .13 * Math.sin(Math.PI * Math.min(1, us * 1.08)) * (1 - .3 * us)) * (1 - sr) + R_FIN * sr * (1 + .12 * amort);
      const rebond = sr > 0 ? Math.exp(-4.5 * sr) * Math.sin(sr * Math.PI * 2.6) : 0;
      const kpo = sseg(sr, .15, 1);
      const ondule = Math.sin(Math.PI * st) * .9 + Math.abs(rebond) * .6 + kpo * (.45 + .25 * amort + .12 * souffle);
      const forme = formePage(c0, R, ondule, 0, yBord, A);
      forme.biais = A * .1 * Math.sin(Math.PI * st);
      /* Y13 : sur téléphone, la courbe du rabat. Pendant que la main tourne la page, le bout se relève (l'angle au bout monte à 0,85 radian,
         puis redescend à 0,51 quand la main va lâcher ; plus haut, le bord passait sous la barre de navigation) ; lâché au début de la retombée, il retombe de lui-même : l'angle revient à zéro en
         ralentissant (fin en douceur aux trois quarts de la retombée), un petit rebond, puis il se pose. La courbure est l'angle divisé
         par la longueur du rabat à l'endroit de la main (X 0,82) */
      if (TEL) {
        const phiT = .85 * sseg(st, .05, .45) * (1 - .4 * sseg(st, .5, .87));
        const chute = 1 - Math.pow(1 - clamp(sr / .75), 2.4), rebondi = .05 * Math.pow(Math.sin(Math.PI * clamp((sr - .7) / .3)), 2);
        const phi = sr > 0 ? phiT * (1 - chute) + rebondi : phiT;
        const Lf = Math.max(.06, A - c0 - Math.PI * R);
        /* torsion : tenu, le côté gauche pend (0,75) ; lâché, les deux côtés se rejoignent en tombant ; pendant la chute, le papier
           ondule un peu (l'air), puis se calme en se posant */
        forme.k = phi / Lf; forme.Ld = A * .22; forme.zBas = .006; forme.zHaut = .05; forme.pose = 0;
        forme.torsion = .75 * (1 - chute * .7); forme.ond = ondule + (sr > 0 ? .55 * Math.sin(Math.PI * clamp(sr / .8)) : 0);
      }
      /* le pli de biais (la gauche pend derrière le pupitre) ; le rouleau plus gros d'un côté, ondulé sur sa longueur */
      /* le pli de biais (la gauche pend derrière le pupitre, la droite reste au bloc) ; le rouleau plus gros d'un côté, ondulé
         sur sa longueur ; L11 : à l'agrafe (X 0,9), il est tenu : ni gonflé ni décalé */
      if (sr > 0) forme.mod = X => { const tenu = 1 - Math.min(1, Math.abs(X - .9) / .1); return {
        kR: 1 + kpo * (1 - .8 * tenu) * (.3 * Math.sin(Math.PI * 2 * X * 1.15 + .9 + .25 * souffle) + .12 * Math.sin(Math.PI * 2 * X * 2.7 + 2.1 + amort)),
        dc: kpo * ((cL - cR) * (1 - sseg(X, .3, .74)) + (1 - tenu) * A * (.006 * Math.sin(Math.PI * X * 1.7 + .4) + .003 * souffle * Math.sin(Math.PI * X * 2.3)))
      }; };
      /* T8 (vingtième passe) : la modulation d'une colonne ne dépend que de X : calculée une fois par colonne et par image (elle
         l'était à chaque sommet, avec un objet créé à chaque fois) */
      if (forme.mod) { const m0 = forme.mod, M = new Map(); forme.mod = X => { let r = M.get(X); if (!r) { r = m0(X); M.set(X, r); } return r; }; }
      if (p >= T.retombe[0]) F.vivant = true;
      const sommet = (u, v, o) => {
        const X = u, Y = clamp(v) * A + (v - clamp(v)) * A;
        forme(X, Y, o2); const y = o2[0], z = o2[1] + rebond * .02 * Math.max(0, -o2[0]) * (o2[1] > 0 ? 1 : 0), cache = o2[2];
        o.X = X; o.Y = y; o.Z = z;
        proj(X, y, Math.max(z, -.2), s3); o.x = s3[0]; o.y = s3[1];
        /* Y13 : sur téléphone, le pied de l'ombre n'est plus ramené au bord (ce qui pend derrière n'ombre pas le bois) ; o.b, la position
           par rapport au bord du pupitre (papier.js, bordTel) */
        proj(X, TEL ? y : Math.max(y, yBord), 0, s3); o.fx = s3[0]; o.fy = s3[1]; o.h = cache < 0 ? cache : Math.max(0, z); o.b = y - yBord;
      };
      /* L11 : la zone cliquable : la partie retournée, posée sur le haut du pupitre (du bord haut du pupitre au pli), sous la
         barre de navigation ; seulement la page posée, à la fin */
      {
        const fin = p >= .995 && sr >= 1 && tourne, A0 = proj(.42, yBord, 0, [0, 0]), A1 = proj(.97, yBord, 0, [0, 0]), B0 = proj(.42, cR, R_FIN * 2, [0, 0]), B1 = proj(.97, cR, R_FIN * 2, [0, 0]);
        const nav = document.querySelector('.nav'), nb = nav ? nav.getBoundingClientRect().bottom + 2 : 0;
        const yt = Math.max(nb, Math.min(A0[1], A1[1]) - 6), yb = Math.max(Math.max(B0[1], B1[1]) + 4, yt + 22);
        const ok = fin && yt < yb - 8;
        setV(lisiere, ok);
        if (ok) { lisiere.style.transform = `translate(${A0[0].toFixed(1)}px,${yt.toFixed(1)}px)`; lisiere.style.width = (A1[0] - A0[0]).toFixed(1) + 'px'; lisiere.style.height = (yb - yt).toFixed(1) + 'px'; }
      }
      if (tourne) {
        /* T2 (vingtième passe) : sur téléphone, la page tournée a quatre fois moins de sommets (36 x 45 posée, 18 x 45 en tournant,
           au lieu de 72 x 90 et 26 x 90) : mesuré sur l'iPhone 15, son maillage (et celui de son ombre) coûtait 20 à 25 ms de calcul par
           image, la page finale tombait à 30 images par seconde ; à la taille d'un téléphone, le rouleau reste lisse */
        /* T8 (vingtième passe, 07/10/2026) : la passe 20 avait divisé par quatre les sommets de la page sur téléphone ; le bord de la
           feuille passée par-dessus le pupitre était alors en dents de scie (la limite « cachée par le bois » suivait le signe de la
           hauteur, interpolé sur des triangles grossiers) et le rouleau et son ombre en facettes. Sur téléphone : la limite est la
           droite du bord du pupitre, à l'écran, lissée sur un pixel (papier.js, clip) ; les rangées se répartissent selon la
           courbure de la feuille (rangeesPage : dense dans le rouleau, clair sur les parties à plat), 48 x 40 sommets */
        /* T13 : sur téléphone, plus de partie cachée (la feuille ne passe plus derrière le pupitre) : plus de droite de coupe */
        /* T8 bis (07/10/2026, fin d'après-midi) : sur l'iPhone, la page de la fin passait de 52 images par seconde (passe 20) à 44
           à 49 (mesuré à froid, dans la même session, avec et sans le tampon de lissage : 48,5 et 44,2 avec, 48,9 et 47,4 sans ; le
           tampon n'en est pas la cause, il coûte 0 à 3 images). Le coût est le calcul des sommets (passe 19 : 1,2 microseconde par
           sommet sur l'appareil, plus 5 ms fixes), et T8 l'avait porté de 3 240 à 4 800 sommets. Deux allègements : pendant que la
           feuille tourne (24 colonnes), son ombre a 36 colonnes au lieu de 72 (72 restent pour la page posée, 48 colonnes) ; posée,
           quand la vue ne bouge pas (même homographie de la feuille), la page ne bouge plus que par son balancement amorti et sa
           respiration lente : ses mailles (feuille et ombre) sont recalculées une image sur deux, et reprises telles quelles
           l'autre (papier.js, o.cache) */
        const fige = TEL && sr >= 1 && tPose !== null;
        const cleG = fige ? Array.from(Hs, x => x.toFixed(4)).join(',') : '';
        const reprendre = fige && cleG === CACHE_PAGE.cle && (++CACHE_PAGE.n % 2 === 1);
        if (!reprendre) CACHE_PAGE.cle = cleG;
        /* U3 (vingt et unième passe, 07/10/2026) : le pli au bord du pupitre, sur téléphone. Avant T13, la feuille retournée était
           coupée net 22 px sous le bord du bois (yBord mal placé, voir bordTel), sans pli visible : elle se lisait comme glissée sous
           le bois (« trop bas ») ; depuis T13, elle continuait devant le mur et sortait du cadre par le haut (« trop haut »). Ici :
           la coupe est la droite du vrai bord du pupitre (le haut du bois de la photo, à la hauteur de la feuille posée), décalée
           vers le mur du rayon du pli (REBORD, 4,5 px) : la feuille passe le bord de ces quelques pixels puis disparaît derrière ; sur
           cette bande, le papier tourne d'un quart de tour sur un rebord arrondi (le shader l'éclaire selon sa courbure : plus clair
           là où il fait face à la lumière, un peu plus sombre à la crête) ; la coupe est lissée sur un pixel (droite de l'écran, pas
           de dents de scie). Le dessous (l'ombre portée, le rouleau mou de droite, l'agrafe) ne change pas */
        let pliTel = null;
        if (TEL) {
          /* Y13 : la droite est le bord du bois lui-même (hauteur 0, sans décalage) : ce qui pend derrière passe sous elle, côté bois */
          const zR = 0, E0 = proj(.15, yBord, zR, [0, 0]), E1 = proj(1, yBord, zR, [0, 0]);
          let nx = E1[1] - E0[1], ny = E0[0] - E1[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
          /* la normale vers la feuille (vers le bas de l'écran) ; la droite passe REBORD px au-delà du bord, côté mur */
          if (ny < 0) { nx = -nx; ny = -ny; }
          pliTel = [nx, ny, -(nx * E0[0] + ny * E0[1])];   /* Y13 : sans REBORD */
        }
        const tel8 = TEL ? { vmap: reprendre ? null : rangeesPage(forme, A), aa: true, cache: CACHE_PAGE, reprendre, clip: null, rebord: 0, bordTel: false } : {};   /* Y13 : plus de rebord peint (le pli est dans la forme) ; Y14 : plus aucune coupe (le rabat ne passe jamais derrière le bois) */
        papier.feuille(Object.assign(tel8, { nu: TEL ? (sr > 0 ? 48 : 24) : (sr > 0 ? 72 : 26), nv: TEL ? 40 : 90, sommet, recto: Tfeuille, verso: Tdos, miroir: false, ombrage: .6, lumiere: [-.32, -.62, .72], ombre: { flous: Flous, op: .42 * (1 - .2 * sr), couleur: [.06, .04, .02], base: [2, 3], dir: [Ls * .28, Ls * .5], hmax: A * .2, nu: TEL ? (sr > 0 ? 72 : 36) : undefined, nv: TEL ? 40 : undefined, vmap: TEL && Flous && !reprendre ? rangeesPage(forme, A, -Flous.padV, 1 + Flous.padV) : undefined } }));
      }
      /* la main (main-souleve) : vient au bord bas, le prend, le tient pendant que le pli remonte, le lâche passé le haut */
      const vMS = F.vis['main-souleve'];
      if (p > T.mainBas[0] && p < T.lacheFeuille[1]) {
        const dd = A - c0, yT = dd < Math.PI * R ? c0 + R * Math.sin(dd / R) : c0 - (dd - Math.PI * R), zT = dd < Math.PI * R ? R * (1 - Math.cos(dd / R)) : 2 * R;
        /* Y13 : sur téléphone, la main tient le vrai bout du rabat (sa forme, en l'air) et le lâche au début de la retombée */
        const bT = TEL ? forme(.82, A, [0, 0, 0]) : null;
        const tenu = TEL ? proj(.82, bT[0], bT[1], [0, 0]) : proj(.82, Math.max(yT, yBord), zT, [0, 0]);
        const lache = TEL ? [T.retombe[0] - .0006, T.retombe[0] + .0034] : T.lacheFeuille;
        const e = eEntree(seg(p, T.mainBas[0], T.mainBas[1])), l = eEntree(seg(p, lache[0], lache[1]));
        const dep = [tenu[0] + F.W * .22, tenu[1] + F.H * .55];
        const pt = [lerp(dep[0], tenu[0], e) + l * F.W * .1, lerp(dep[1], tenu[1], e) - l * F.H * .12];
        mains.point('main-souleve', pt, -us * 16 + l * 12, ech * (vMS.reel ? 1 : .85) * (1 + .06 * Math.sin(Math.PI * us)), { z: 34, op: clamp(e * 3) * (1 - l) });
      }

      /* ---- 4. l'écriture de Thibaut, la bulle ---- */
      const uE = seg(p, T.ecrit[0], T.ecrit[1]);
      if (ecr && Tencre && p >= T.ecrit[0] - .0005) {
        const P = P0, H = Hs;
        papier.encre({ encre: Tencre, temps: Ttemps, t: uE * 1.002, op: .96, sommet: (u, v, o) => { const [x, y] = appl(H, P.u0 + u * P.uw, P.v0 + v * P.vh); o.x = x; o.y = y; } });
        /* O4 : le second point, après le H, posé dans les coordonnées de la phrase (pixels de l'image), même encre, même révélateur */
        const pt = ecr.point;
        if (pt && Tpoint && uE * 1.002 > pt.t0) {
          const [IW, IH] = ecr.info.taille;
          papier.encre({ encre: Tpoint, temps: TtempsPoint, t: uE * 1.002, op: .96, sommet: (u, v, o) => { const [x, y] = appl(H, P.u0 + (pt.x0 + u * pt.w) / IW * P.uw, P.v0 + (pt.y0 + v * pt.h) / IH * P.vh); o.x = x; o.y = y; } });
        }
      }
      const kb = eEntree(seg(p, T.bulle[0], T.bulle[1]));
      if (P0) {
        const bw = 236 / P0.Ls, bh = 46 / P0.Hs;
        let q;
        const L = (ecr && ecr.info && ecr.info.lignes) || LIGNES_ECRITURE;
        if (!F.mob && L && L.length >= 3) {
          /* Q3 (dix-septième passe, 07/10/2026) : la bulle ne couvre plus jamais les lettres de « Contactez-moi » : elle se
             pose sous la phrase (14 px sous l'encre la plus basse, le jambage du « z ») et à gauche de la signature (28 px
             avant le « T » de « T.H. »), d'après les boîtes des lignes de l'écriture (ecriture.json, lignes), à toutes les
             tailles d'ordinateur */
          const bas = Math.max(L[0].boite[3], L[1].boite[3]), sig = L[2].boite;
          const pBas = appl(Hs, P0.u0 + (L[1].boite[0] + L[1].boite[2]) / 2 * P0.uw, P0.v0 + bas * P0.vh), pSig = appl(Hs, P0.u0 + sig[0] * P0.uw, P0.v0 + sig[1] * P0.vh);
          const xr = pSig[0] - 28, yt = pBas[1] + 14;
          q = [[xr - 236, yt], [xr, yt], [xr, yt + 46], [xr - 236, yt + 46]];
        } else if (!F.mob) {
          /* G3 : la bulle à droite du téléphone, à hauteur de son écran ; H10 : au-delà du bout des doigts de la main
             gauche qui le tient (environ 44 px à droite du téléphone) (sans les lignes de l'écriture réelle) */
          const qp = pose3d(Object.assign({ f: 1500 }, poseFin(poseRegle()))).quad, xr = Math.max(qp[1][0], qp[2][0]) + 70, yc = (qp[0][1] + qp[1][1] + qp[2][1] + qp[3][1]) / 4 - 10;
          q = [[xr, yc - 23], [xr + 236, yc - 23], [xr + 236, yc + 23], [xr, yc + 23]];
        } else {
          const uc = P0.u0 + P0.uw * .62, vb = P0.v0 + P0.vh + .055;
          q = [[uc - bw / 2, vb], [uc + bw / 2, vb], [uc + bw / 2, vb + bh], [uc - bw / 2, vb + bh]].map(([u, v]) => appl(Hs, u, v));
        }
        atelier.poserBulle(kb, kb >= 1, q);
        /* le bouton du brouillon, sous la bulle */
        const vuB = surPage && aTrace && !gomme;
        setV(effacer, vuB); effacer.tabIndex = vuB ? 0 : -1; effacer.classList.toggle('vu', vuB);
        if (vuB) setT(effacer, `translate(${q[3][0].toFixed(1)}px,${(q[3][1] + 14).toFixed(1)}px)`);
      }
      atelier.poserTrace(surPage || !!gomme);
      if (gomme) {
        const k = (performance.now() - gomme.t0) / gomme.d;
        if (k >= 1) vider(); else { trace.style.opacity = (1 - sseg(k, 0, 1)).toFixed(3); F.vivant = true; F.demander && F.demander(); }
      }
      /* ---- 5. la main reprend le crayon couché, écrit, le repose ---- */
      let tip = null;
      if (ecr && P0) {
        if (p < T.ecrit[0]) tip = pointePhrase(0, P0);
        else if (p <= T.ecrit[1]) tip = pointePhrase(uE, P0);
        else tip = pointePhrase(1, P0);
      }
      let kg = 0;
      if (p >= T.reprend[0] && p < T.repose8[0]) kg = seg(p, T.reprend[0], T.versEcrit[1]);
      else if (p >= T.repose8[0]) kg = 1 - seg(p, T.repose8[0], T.retrait8[1]);
      let opCrayon = 1;
      if (kg > 0 && tip) { const gst = geste(F, kg, tip, p >= T.repose8[0] ? -1 : 1); opCrayon = gst.crayon; if (kg >= 1) mains.point('main-crayon', tip, 0, ech, { z: 34 }); }
      /* le crayon dessiné : couché sur la règle, puis libre (arrêt 5) */
      const fin = p >= T.retrait8[0];
      const L = Math.hypot(atelier.crayonImg.B[0] - atelier.crayonImg.P[0], atelier.crayonImg.B[1] - atelier.crayonImg.P[1]) * ech;
      const enMain = pt => [pt, [pt[0] + .826 * L, pt[1] + .563 * L]];
      if (retour && fin) {
        /* le retour sur la règle : un arc qui descend, le crayon tourne pour se coucher, un petit rebond à la pose */
        const u = clamp((performance.now() - retour.t0) / 650), e = eDepl(u), r = atelier.crayonRegle();
        const [a0, b0] = enMain(retour.de), ar = Math.sin(Math.PI * e) * 26, reb = u > .82 ? Math.sin(Math.PI * seg(u, .82, 1)) * 3 : 0;
        const P = [lerp(a0[0], r.P[0], e), lerp(a0[1], r.P[1], e) - ar - reb], E = [lerp(b0[0], r.E[0], e), lerp(b0[1], r.E[1], e) - ar - reb];
        atelier.poserCrayon({ op: 1, H: atelier.surDeux(atelier.crayonImg.P, atelier.crayonImg.B, P, E), libre: true, leve: .25 * (1 - e) + .1 * Math.sin(Math.PI * e), z: 36 });
        F.vivant = true;
        if (u >= 1) { retour = null; libre = null; }
      } else if (libre && fin) {
        const [a, b] = enMain(libre);
        atelier.poserCrayon({ op: 1, H: atelier.surDeux(atelier.crayonImg.P, atelier.crayonImg.B, a, b), libre: true, leve: prise ? .7 : .25, z: 36 });
      } else atelier.poserCrayon({ op: opCrayon, libre: fin, bouton: fin });
      F.pointePosee = atelier.crayonRegle().P;
      if (!fin) { libre = null; retour = null; tenu = false; }
    }
  });
}
