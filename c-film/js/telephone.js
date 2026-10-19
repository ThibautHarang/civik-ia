/* =====================================================================
   Le téléphone réel : une image de face (support), une tranche faite de
   lamelles, l'écran vivant (le composant de la page Marianne) épinglé dans
   le quad « quad » du manifeste, un verre dont le reflet glisse.
   Tout se place par le quadrilatère écran de son corps.
   ===================================================================== */
import { clamp, lerp, seg, sseg, eEntree, eDepl, quadVersQuad, appl, m3d, epingle, setT, setO, setV, setTxt, el, cloche, rng, arrondiDistance } from './outils.js';
import { reperesPx } from './visuels.js';
import { TEXTES } from './temps.js';
import { TEL } from './memoire.js';   /* X1 bis */

const NB = ' ';
export const ECRAN_W = 340, ECRAN_H = 736;
const DOC = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>';
const FLECHE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

export const ECH = [
  { h: '22:47', q: 'Bonsoir, comment inscrire mon fils à la cantine pour septembre' + NB + '?', r: "Bonsoir. Les inscriptions se font sur le portail famille jusqu'au 10" + NB + "août. Il vous faut un justificatif de domicile et l'attestation CAF", s: 'site de la mairie, page Périscolaire' },
  /* Q2 (dix-septième passe, 07/10/2026) : « Quinze ans dans la santé », comme la frise de la page Conseil ; la fondation de
     Civik-ia n'est dite qu'une fois, à sa place dans le temps */
  /* T9 (vingtième passe, 07/10/2026) : « il a dirigé des établissements, puis une entreprise de télémédecine » (plus de
     « programme national de télémédecine ») ; la phrase qui mène au guide (« Je peux vous guider jusqu'à lui », sur téléphone
     « Je vous y mène. ») est gardée : c'est elle qui enchaîne sur la marche. DJ (décision de Thibaut, avis DAJF du 08/10/2026,
     20 h 35) : « puis la stratégie d'une entreprise de télémédecine » (le CV dit direction de la stratégie, pas direction de
     l'entreprise) */
  { q: 'Connaissez-vous Thibaut Harang' + NB + '?', r: "Oui. Quinze ans dans la santé" + NB + ": il a dirigé des établissements, puis la stratégie d'une entreprise de télémédecine. Il a créé Civik-ia en 2026, la société qui m'a conçue. Je peux vous guider jusqu'à lui", s: 'civik-ia.fr', dom: true, guider: true,
    /* M1 (treizième passe) : sur téléphone, plus de bouton « Me guider » : la réponse se termine par « Je vous y mène. »,
       et c'est ce qui enchaîne (même longueur à peu près : la frappe garde son rythme) */
    rMob: "Oui. Quinze ans dans la santé" + NB + ": il a dirigé des établissements, puis la stratégie d'une entreprise de télémédecine. Il a créé Civik-ia en 2026, la société qui m'a conçue. Je vous y mène." }
];
/* O2 (quinzième passe) : la distance de la quatrième consigne est celle du guide quand elle paraît (le départ de la route vers
   l'atelier, en mètres du monde, monde.reste()) ; elle est réécrite par etatEcran ; « 30 m » sur tous les écrans */
const CONSIGNES = ['Tout droit', "Au croisement, c'est là", 'Vous êtes arrivé', 'Atelier, 30' + NB + 'm'];

/* La carte du mode guide, traitée comme une petite gravure (retours du 02/10/2026, point 4) : papier,
   collines en courbes et hachures, rangs de vigne, cyprès hachurés avec leur ombre, chemin bordé de deux
   traits et semé de graviers, croisement, atelier. Par-dessus, le trajet de Marianne et le point bleu. */
function carteGravee() {
  const R = rng(2024), f = v => v.toFixed(1), E = a => `rgba(70,68,104,${a})`;
  const bez = (p0, c1, c2, p1, n) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, m = 1 - t; return [m * m * m * p0[0] + 3 * m * m * t * c1[0] + 3 * m * t * t * c2[0] + t * t * t * p1[0], m * m * m * p0[1] + 3 * m * m * t * c1[1] + 3 * m * t * t * c2[1] + t * t * t * p1[1]]; });
  const tout = [...bez([150, 352], [150, 320], [128, 300], [136, 268], 14), ...bez([136, 268], [144, 236], [176, 226], [166, 196], 14).slice(1), ...bez([166, 196], [156, 166], [140, 150], [156, 120], 14).slice(1)];
  const gauche = bez([156, 120], [150, 96], [110, 70], [60, 40], 16), droite = bez([156, 120], [170, 98], [210, 76], [252, 50], 16);
  const bords = (P, e) => { const G = [], D = []; P.forEach((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = e + (R() - .5) * .8; G.push([p[0] - dy / l * w, p[1] + dx / l * w]); D.push([p[0] + dy / l * w, p[1] - dx / l * w]); }); return [G, D]; };
  const ligne = P => 'M' + P.map(([x, y]) => f(x) + ' ' + f(y)).join('L');
  const loin = (x, y) => Math.min(...[tout, gauche, droite].map(P => Math.min(...P.map(([a, b]) => Math.hypot(a - x, b - y)))));
  let o = '';
  /* collines : courbes de niveau et petites hachures vers le bas de la pente */
  [[244, 10, 14], [286, 8, 10], [170, 12, 18], [96, 14, 22]].forEach(([y0, amp, pas]) => {
    const P = []; for (let x = -10; x <= 310; x += 10) P.push([x, y0 + Math.sin(x / 47 + y0) * amp + Math.sin(x / 19) * 3]);
    o += `<path d="${ligne(P)}" fill="none" stroke="${E(.34)}" stroke-width=".8"/>`;
    let h = ''; P.forEach(([x, y], i) => { if (i % 1 || R() < .25) return; for (let k = 0; k < 2; k++) { const xx = x + k * 5 + R() * 2; h += `M${f(xx)} ${f(y + 1.5)}l${f(.8 + R())} ${f(4 + R() * 3)}`; } });
    o += `<path d="${h}" fill="none" stroke="${E(.22)}" stroke-width=".55" stroke-linecap="round"/>`;
  });
  /* rangs de vigne, en biais, interrompus par le chemin */
  let v = '', ceps = '';
  for (let r = 0; r < 22; r++) {
    const y0 = 70 + r * 13.5;
    [[-6, 120], [186, 306]].forEach(([xa, xb]) => {
      let enCours = false;
      for (let x = xa; x <= xb; x += 3) {
        const y = y0 + (x - 150) * .16 + Math.sin(x / 33 + r) * 1.4;
        const ok = loin(x, y) > 15 && y > 58 && y < 352;
        if (ok && !enCours) { v += `M${f(x)} ${f(y)}`; enCours = true; } else if (ok) v += `L${f(x)} ${f(y)}`; else enCours = false;
        if (ok && Math.round(x) % 6 === 0) ceps += `M${f(x)} ${f(y - .2)}a1.25 1.25 0 1 0 .1 0m.2 -.8l${f(-1 + R() * 2)} ${f(-2.2 - R())}`;
      }
    });
  }
  o += `<path d="${v}" fill="none" stroke="${E(.26)}" stroke-width=".5"/><path d="${ceps}" fill="none" stroke="${E(.5)}" stroke-width=".6" stroke-linecap="round"/>`;
  /* le chemin : deux traits de bord, des graviers, l'ombre hachurée d'un côté */
  [[tout, 7.5], [gauche, 5.5], [droite, 5.5]].forEach(([P, e]) => {
    const [G, D] = bords(P, e);
    o += `<path d="${ligne(G)}${ligne(D)}" fill="none" stroke="${E(.78)}" stroke-width=".9" stroke-linecap="round"/>`;
    let g = ''; P.forEach((p, i) => { for (let k = 0; k < 3; k++) { const a = R() * Math.PI * 2, d = R() * e * .8; g += `M${f(p[0] + Math.cos(a) * d)} ${f(p[1] + Math.sin(a) * d)}h.6`; } });
    o += `<path d="${g}" fill="none" stroke="${E(.45)}" stroke-width=".8" stroke-linecap="round"/>`;
    let h = ''; D.forEach((p, i) => { if (i % 1) return; h += `M${f(p[0])} ${f(p[1])}l${f(2.2)} ${f(2.6)}`; });
    o += `<path d="${h}" fill="none" stroke="${E(.3)}" stroke-width=".6"/>`;
  });
  /* cyprès : flamme hachurée, ombre portée vers le bas à droite */
  [[72, 210, 1], [58, 132, .9], [236, 160, 1.05], [252, 236, .95], [210, 96, .85], [112, 300, .8], [262, 300, .9]].forEach(([x, y, k]) => {
    const hgt = 38 * k, l = 7 * k;
    o += `<path d="M${f(x + 2)} ${f(y)}l${f(14 * k)} ${f(6 * k)}l${f(-12 * k)} ${f(3 * k)}z" fill="${E(.16)}"/>`;
    o += `<path d="M${f(x)} ${f(y)}C${f(x - l)} ${f(y - hgt * .3)} ${f(x - l * .6)} ${f(y - hgt * .75)} ${f(x)} ${f(y - hgt)}C${f(x + l * .6)} ${f(y - hgt * .75)} ${f(x + l)} ${f(y - hgt * .3)} ${f(x)} ${f(y)}z" fill="#f6f1e4" stroke="${E(.85)}" stroke-width=".9"/>`;
    let h = ''; for (let t = .08; t < .95; t += .07) { const yy = y - hgt * t, w = l * Math.sin(Math.PI * (1 - t) * .9) * .9; h += `M${f(x - w * .1)} ${f(yy)}l${f(w)} ${f(-w * .55)}`; }
    o += `<path d="${h}" fill="none" stroke="${E(.6)}" stroke-width=".55" stroke-linecap="round"/>`;
  });
  /* l'atelier : petite maison gravée, toit hachuré */
  o += `<g transform="translate(244 30)"><path d="M0 22V10l9-8 9 8v12z" fill="#f6f1e4" stroke="${E(.85)}" stroke-width=".9"/><path d="M1.5 9.5l7.5-6.5M4 10l5-4.3M6.5 10.2l2.5-2.2M11 4.5l5.5 5" stroke="${E(.6)}" stroke-width=".55"/><path d="M7.2 22v-6h3.6v6" fill="none" stroke="${E(.8)}" stroke-width=".8"/></g>`;
  return `<svg viewBox="0 0 300 360" aria-hidden="true">
  <defs><pattern id="hc" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)"><line x1="0" y1="0" x2="0" y2="5" stroke="rgba(70,68,104,.07)" stroke-width=".7"/></pattern>
  <radialGradient id="vg" cx="50%" cy="45%" r="70%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#3a3020" stop-opacity=".12"/></radialGradient></defs>
  <rect width="300" height="360" fill="#f4efe2"/><rect width="300" height="360" fill="url(#hc)"/>
  ${o}
  <rect width="300" height="360" fill="url(#vg)"/>
  <path data-tout d="M150 352C150 320 128 300 136 268S176 226 166 196S140 150 156 120" fill="none" stroke="none"/>
  <path data-branche d="M156 120C170 98 210 76 252 50" fill="none" stroke="none"/>
  <path data-fait d="M150 352C150 320 128 300 136 268S176 226 166 196S140 150 156 120" fill="none" stroke="#000091" stroke-width="3" stroke-linecap="round" opacity=".85"/>
  <path data-fait2 d="M156 120C170 98 210 76 252 50" fill="none" stroke="#000091" stroke-width="3" stroke-linecap="round" opacity=".85"/>
  <text x="34" y="30" font-family="Inter" font-weight="700" font-size="10.5" fill="#3d3a52" letter-spacing=".12em">${TEXTES.horizon.toUpperCase()}</text>
  <text x="206" y="24" font-family="Inter" font-weight="700" font-size="10.5" fill="#3d3a52" letter-spacing=".12em">ATELIER</text>
  <g transform="translate(156 120)"><circle r="9" fill="#f6f1e4" stroke="#3d3a52" stroke-width="1.2"/><circle r="4" fill="#F4A261"/></g>
  <g data-point><circle r="15" fill="rgba(43,111,214,.18)"/><circle r="8" fill="#2b6fd6" stroke="#fff" stroke-width="3"/></g>
</svg>`;
}
const CARTE = carteGravee();

/* G3 : les pictogrammes au trait des trois boutons du menu (une bulle, une boussole, un crayon) */
const PICTO = (() => {
  const svg = d => `<svg class="picto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  return {
    marianne: svg('<path d="M4 5.5h16v10H10l-4.5 4v-4H4z"/><path d="M8 9.5h8M8 12.5h5"/>'),
    conseil: svg('<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'),
    atelier: svg('<path d="M4.5 19.5l1-4.2L15.8 5a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.7 18.5z"/><path d="M14 7l3 3"/>')
  };
})();
function htmlEcran() {
  let fil = '';
  ECH.forEach((e, i) => {
    fil += `<li class="msg msg--moi">${e.h ? `<span class="msg__h">${e.h}</span>` : ''}<div class="bulle">${e.q}</div></li>`;
    const src = e.dom ? `Source${NB}: <span class="dom">${e.s}</span>` : `Source${NB}: ${e.s}`;
    fil += `<li class="msg msg--m"><span class="saisie" aria-hidden="true"><i></i><i></i><i></i></span><div class="bulle"><span class="texte"><span class="sr">${e.r}</span><span aria-hidden="true"><span class="ecrit"></span><span class="reste">${e.r}</span></span></span> <span class="source">${DOC}${src}</span>${e.guider ? `<button type="button" class="guider" data-guider tabindex="-1">Me guider ${FLECHE}</button>` : ''}</div></li>`;
  });
  const chiffres = () => `<span class="ch"><i>${Array.from({ length: 11 }, (_, k) => `<b>${k % 10}</b>`).join('')}</i></span>`;
  return `<div class="ecran ep" aria-label="Exemple sur une commune fictive : à 22 h 47, un habitant écrit à la mairie et Marianne lui répond">
    <div class="tel__barre" aria-hidden="true"><span class="heure">${chiffres()}${chiffres()}<span>:</span>${chiffres()}${chiffres()}</span><span class="tel__encoche"></span><span class="tel__reseau"><i></i><i></i><i></i></span></div>
    <div class="tel__tete">
      <div class="tete tete--mairie"><img src="../commun/img/sceau-96.webp" alt="" width="32" height="32"><div><strong>Mairie de Villeneuve-les-Ormes</strong><span>En ligne, 24${NB}h/24</span></div></div>
      <div class="tete tete--guide"><img src="../commun/img/marianne-glyph.svg" alt="" width="32" height="32"><div><strong>Marianne, par Civik-ia</strong><span>Je vous guide, à pied</span></div></div>
    </div>
    <div class="tel__corps">
      <ol class="tel__fil">${fil}</ol>
      <div class="panneau panneau--guide">
        <div class="carte">${CARTE}</div>
        <div class="dest"><img src="../commun/img/portrait-pro.webp" alt="" width="40" height="40" data-dest-img><div><b data-dest>Thibaut Harang</b><span data-dest-sous>Au croisement des chemins</span></div><span class="dist"><span data-dist>70</span><small>m</small></span></div>
        <div class="consignes">${CONSIGNES.map(c => `<div class="msg msg--m"><div class="bulle">${c}</div></div>`).join('')}</div>
      </div>
      <div class="panneau veille"><img src="../commun/img/marianne-glyph.svg" alt="" width="150" height="150"><strong>Marianne</strong><span>par Civik-ia</span></div>
      <div class="panneau menu">
        <div class="msg msg--m"><div class="bulle">Autre chose${NB}?</div></div>
        <div class="liens"><a href="/marianne/">${PICTO.marianne}<span>Marianne</span></a><a href="/conseil/#contact">${PICTO.conseil}<span>Conseil</span></a><a href="/atelier/#page-blanche">${PICTO.atelier}<span>Atelier</span></a></div>
      </div>
    </div>
    <div class="tel__champ" aria-hidden="true"><span class="saisie-champ">Posez votre question</span><i><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg></i></div>
    <div class="tel__voile" aria-hidden="true"></div>
  </div>`;
}
/* H10.3 bis : le message de Marianne qui referme le film, et les trois boutons qui se posent dessous (mêmes liens que
   G3) ; ajouté au fil de la conversation après la mesure des messages (il ne compte pas dans leur défilement) */
/* L5 (douzième passe) : le message tient en deux lignes au plus (film.css, .msg--arrivee .bulle) */
/* Q1 (dix-septième passe, 07/10/2026) : les trois boutons du téléphone-menu final mènent aux mêmes cibles que le bouton de
   la barre : la page Marianne, le contact de la page Conseil, la page blanche de l'Atelier (de même dans le menu « Autre
   chose ? », plus haut) */
const ARRIVEE = `<li class="msg msg--m msg--arrivee"><div class="bulle">Vous êtes arrivé. Que souhaitez-vous faire${NB}?</div>
  <div class="liens"><a href="/marianne/">${PICTO.marianne}<span>Marianne</span></a><a href="/conseil/#contact">${PICTO.conseil}<span>Conseil</span></a><a href="/atelier/#page-blanche">${PICTO.atelier}<span>Atelier</span></a></div></li>`;

/* pose en trois dimensions vers quadrilatère écran + vecteur d'épaisseur */
export function pose3d(o) {
  const h = o.h, w = h * (o.asp || .486), f = o.f || 1500;
  const rx = (o.rx || 0) * Math.PI / 180, ry = (o.ry || 0) * Math.PI / 180, rz = (o.rz || 0) * Math.PI / 180;
  const rot = ([x, y, z]) => {
    let X = x * Math.cos(rz) - y * Math.sin(rz), Y = x * Math.sin(rz) + y * Math.cos(rz), Z = z;
    const Y2 = Y * Math.cos(rx) - Z * Math.sin(rx), Z2 = Y * Math.sin(rx) + Z * Math.cos(rx); Y = Y2; Z = Z2;
    const X3 = X * Math.cos(ry) + Z * Math.sin(ry), Z3 = -X * Math.sin(ry) + Z * Math.cos(ry);
    return [X3, Y, Z3];
  };
  const pr = ([x, y, z]) => { const k = f / (f + z); return [o.cx + x * k, o.cy + y * k]; };
  const quad = [[-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0]].map(p => pr(rot(p)));
  const D = w * (o.prof || .105), a = pr(rot([0, 0, 0])), b = pr(rot([0, 0, D]));
  return { quad, ep: [b[0] - a[0], b[1] - a[1]] };
}

/* W3 (vingt-troisième passe, 08/10/2026) : « pour qu'on comprenne bien qu'on peut cliquer sur Marianne, Conseil et Atelier dans le
   smartphone tenu par la main gauche à la fin, un contour de chaque bloc, l'un après l'autre, parcouru par un tout petit mais
   visible liseré bleu marine brillant, chacun son tour, comme une étincelle ». Un trait fin (1,5 px, bleu marine #000091) dont la
   tête est un éclat clair (#2b6fd6) parcourt le pourtour arrondi d'un bouton en 1,4 s (au milieu de sa bordure), puis celui du
   suivant, les trois à tour de rôle, et une pause de 1,6 s entre deux tours. Un rectangle SVG par bouton, son trait en pointillé
   (stroke-dasharray) dont le décalage glisse (Web Animations, linéaire) ; ni filtre, ni ombre, ni flou ; le SVG est son propre
   calque (will-change), seul repeint. Il part une seconde après que les boutons sont posés (la main immobile), s'arrête dès qu'un
   bouton est survolé ou a le focus (le survol existant reste), reprend une seconde après ; jamais en mouvement réduit. ?etincelle=0 l'écarte
   (essais). */
/* W3 : sur téléphone (les trois boutons du menu de la fin, dans la zone sombre), l'étincelle aussi : son coût, mesuré sur l'iPhone
   (page de la fin, deux tours alternés de 9 s), n'est pas mesurable (52,2 et 47,4 images par seconde avec, 48,9 et 48,3 sans) ;
   ?etincelle=ordi la garde à l'ordinateur seul (essais) */
const W3_TEL = (() => { try { return new URLSearchParams(location.search).get('etincelle') !== 'ordi'; } catch (e) { return true; } })();
const W3_ACTIF = (() => { try { const Q = new URLSearchParams(location.search); return Q.get('etincelle') !== '0' && Q.get('mouvement') !== 'reduit' && !matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
/* M1 (P5, 19/10/2026, décision M1 du plan des passes du 18/10, revue Claude Design, parties 3 et 11, critère 2.2.2) : l'étincelle
   ne tourne plus sans fin. Un trait de plume (#16205C, 1,5 px, au milieu de la bordure) fait une fois le tour de chaque bouton
   posé, l'un après l'autre (900 ms chacun, courbe douce, 200 ms d'écart, départ 400 ms après que les boutons sont posés : 3,5 s en
   tout pour trois boutons), puis reste tracé ; effacé quand les boutons s'en vont, retracé à leur retour. Le survol et le focus
   gardent leur dessin. Même trait que le lecteur du téléphone (proto3.js). En mouvement réduit, ?etincelle=0 ou sans Web
   Animations : tracé tout de suite, sans mouvement */
const M1_DUREE = 900, M1_ECART = 200, M1_DEPART = 400;
function creerEtincelles(liens) {
  if (!liens.length) return () => {};
  const NS = 'http://www.w3.org/2000/svg';
  const traits = liens.map(a => {
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('class', 'etincelle trace-plume'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    const r = document.createElementNS(NS, 'rect');
    /* (styles posés ici : film.css n'est pas touché pour M1) */
    s.style.cssText = 'position:absolute;pointer-events:none;overflow:visible;visibility:hidden';
    r.style.cssText = 'fill:none;stroke:#16205C;stroke-width:1.5px;stroke-linecap:round;stroke-linejoin:round';
    a.style.position = 'relative';   /* (un bouton en flux : le repère du trait, rien ne bouge) */
    s.appendChild(r); a.appendChild(s);
    return { a, s, r, per: 0, anim: null };
  });
  /* la géométrie : le milieu de la bordure du bouton (sa taille dans la page, avant la perspective de l'écran) */
  const mesurer = t => {
    const cs = getComputedStyle(t.a), b = parseFloat(cs.borderTopWidth) || 0, w = t.a.offsetWidth, h = t.a.offsetHeight;
    const r = Math.max(0, Math.min((parseFloat(cs.borderTopLeftRadius) || 0) - b / 2, (h - b) / 2, (w - b) / 2));
    t.s.setAttribute('width', w); t.s.setAttribute('height', h); t.s.style.left = t.s.style.top = (-b) + 'px';
    t.r.setAttribute('x', b / 2); t.r.setAttribute('y', b / 2); t.r.setAttribute('width', Math.max(0, w - b)); t.r.setAttribute('height', Math.max(0, h - b)); t.r.setAttribute('rx', r); t.r.setAttribute('ry', r);
    t.per = 2 * (w - b) + 2 * (h - b) - (8 - 2 * Math.PI) * r;
    t.r.style.strokeDasharray = `${t.per.toFixed(2)} ${t.per.toFixed(2)}`; t.r.style.strokeDashoffset = '0';
  };
  let arme = false, minuteur = 0;
  const effacer = () => { clearTimeout(minuteur); traits.forEach(t => { if (t.anim) t.anim.cancel(); t.anim = null; t.s.style.visibility = 'hidden'; }); };
  const tracer = () => {
    /* le film a quitté la fin sans le dire (le plan qui pose les boutons n'est plus actif) : rien à tracer */
    const vus = traits.filter(t => t.a.isConnected && getComputedStyle(t.a).visibility !== 'hidden' && getComputedStyle(t.a).display !== 'none');
    vus.forEach((t, i) => {
      mesurer(t); t.s.style.visibility = '';
      if (W3_ACTIF && Element.prototype.animate) t.anim = t.r.animate([{ strokeDashoffset: t.per }, { strokeDashoffset: 0 }], { duration: M1_DUREE, delay: i * (M1_DUREE + M1_ECART), easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
    });
  };
  /* pret : les boutons sont posés (vrai), ou plus (faux) ; appelé à chaque image, n'agit qu'au changement */
  return pret => {
    if (pret === arme) return;
    arme = pret; effacer();
    if (pret) minuteur = setTimeout(tracer, W3_ACTIF ? M1_DEPART : 0);
  };
}
export function creerTelephone(ctx, v, v34) {
  const racine = ctx.porteurs, N = 9;
  const corps = reperesPx(v, 'corps') || [[0, 0], [v.w, 0], [v.w, v.h], [0, v.h]];
  const ecranQ = reperesPx(v, 'quad');
  const bw = corps[1][0] - corps[0][0], bh = corps[3][1] - corps[0][1];
  const boite = [[0, 0], [bw, 0], [bw, bh], [0, bh]];
  const mk = (cls, w, h) => { const d = document.createElement('div'); d.className = 'ep ' + cls; d.style.width = w + 'px'; d.style.height = h + 'px'; racine.appendChild(d); return d; };
  const ombre = mk('tel-ombre', bw, bh);
  /* l'ombre de contact sur la règle, quand le téléphone est posé debout (quatrième passe, D10) */
  const contact = mk('tel-contact', 200, 40);
  const tranches = Array.from({ length: N }, () => mk('tel-tranche', bw, bh));
  const TRANCHES = new Set(tranches);   /* X1 bis */
  const ecran = el(htmlEcran()); racine.appendChild(ecran);
  const support = new Image(); support.className = 'ep tel-support'; support.src = v.src; support.width = v.w; support.height = v.h; support.alt = ''; racine.appendChild(support);
  const reflet = mk('tel-reflet', ECRAN_W, ECRAN_H); reflet.innerHTML = '<i></i>';
  const refletI = reflet.firstChild;
  const NS = 'http://www.w3.org/2000/svg';
  const dessin = document.createElementNS(NS, 'svg'); dessin.setAttribute('class', 'ep dessin'); dessin.setAttribute('width', bw); dessin.setAttribute('height', bh); dessin.setAttribute('viewBox', `0 0 ${bw} ${bh}`); racine.appendChild(dessin);
  /* le téléphone de trois quarts (photo réelle, plan d'ouverture), s'il existe */
  let im34 = null, corps34 = null, ecran34 = null;
  if (v34 && v34.reel && v34.reperes.quad) {
    im34 = new Image(); im34.className = 'ep tel-support'; im34.src = v34.src; im34.width = v34.w; im34.height = v34.h; im34.alt = ''; racine.appendChild(im34);
    corps34 = reperesPx(v34, 'corps'); ecran34 = reperesPx(v34, 'quad');
  }
  /* la photo de trois quarts n'est posée que par poser34 : elle a sa propre visibilité */
  const tous = [ombre, ...tranches, ecran, support, reflet, dessin, contact];
  const zbase = [0, ...tranches.map(() => 1), 2, 3, 4, 5, 0];
  /* l'écran vivant passe derrière la photo ; ses coins suivent ceux du trou (rayon_ecran, fraction de la largeur de l'image) */
  const rayon = (vv, q) => { const r = vv.reperes.rayon_ecran; if (!r || !q) return null; const lq = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]); return r * vv.w / lq * ECRAN_W; };
  const rayonFace = rayon(v, ecranQ), rayon34 = v34 && v34.reel ? rayon(v34, reperesPx(v34, 'quad')) : null;
  const arrondir = r => { const val = r ? r.toFixed(1) + 'px' : ''; if (ecran._r !== val) { ecran._r = val; ecran.style.borderRadius = val; } };

  /* ---- l'écran ---- */
  const q = s => ecran.querySelector(s), qa = s => Array.from(ecran.querySelectorAll(s));
  const chiffres = qa('.heure .ch i');
  const teteM = q('.tete--mairie'), teteG = q('.tete--guide');
  const fil = q('.tel__fil'), msgs = qa('.tel__fil > .msg');
  const reps = ECH.map((e, i) => { const li = msgs[i * 2 + 1]; return { li, ecrit: li.querySelector('.ecrit'), reste: li.querySelector('.reste'), source: li.querySelector('.source'), n: -1 }; });
  const guiderB = q('[data-guider]');
  const champ = q('.saisie-champ'), envoi = q('.tel__champ i');
  const pGuide = q('.panneau--guide'), pVeille = q('.veille'), pMenu = q('.menu');
  const point = q('[data-point]'), fait = q('[data-fait]'), fait2 = q('[data-fait2]'), tout = q('[data-tout]'), branche = q('[data-branche]');
  const dist = q('[data-dist]'), dest = q('[data-dest]'), destSous = q('[data-dest-sous]'), destImg = q('[data-dest-img]');
  const consignes = qa('.consignes .msg');
  /* O2 : la bulle « Atelier, ... m » et les longueurs des deux étapes du guide (mises à jour par etatEcran) */
  const consigneAtelier = consignes[3].querySelector('.bulle'), longueurs = { croisement: 70, atelier: 34 };
  const menuLiens = qa('.menu .liens a');
  const voile = q('.tel__voile');
  const arr = el(ARRIVEE); fil.appendChild(arr);
  const arrBulle = arr.querySelector('.bulle'), arrLiens = Array.from(arr.querySelectorAll('.liens a'));
  arrLiens.forEach(a => a.addEventListener('click', e => { if (a.getAttribute('href') === '#') e.preventDefault(); }));
  setV(arr, false); arrLiens.forEach(a => { setV(a, false); a.tabIndex = -1; });
  /* W3 : l'étincelle des trois boutons du téléphone-menu de la fin (ordinateur : le message d'arrivée) */
  const etincellesArr = creerEtincelles(arrLiens);
  /* W3 : sur téléphone, les trois boutons du menu de la fin (la zone sombre) : seulement si le réglage le demande (W3_TEL) */
  const etincellesMenu = W3_TEL ? creerEtincelles(menuLiens) : () => {};
  let defConv = 0;
  /* les trois liens mènent aux pages (adresses à venir) : un lien « # » ne doit pas faire remonter la page */
  menuLiens.forEach(a => a.addEventListener('click', e => { if (a.getAttribute('href') === '#') e.preventDefault(); }));
  const L1 = tout.getTotalLength(), L2 = branche.getTotalLength();
  fait.style.strokeDasharray = `${L1} ${L1}`; fait2.style.strokeDasharray = `${L2} ${L2}`;
  /* hauteurs finales des messages (le texte des réponses occupe déjà sa place) */
  let positions = null;
  const mesurer = () => { positions = msgs.map(m => ({ haut: m.offsetTop, bas: m.offsetTop + m.offsetHeight })); };

  function heure(min) {
    const f = min - Math.floor(min), m0 = Math.floor(min);
    const d = m => { const h = Math.floor(m / 60) % 24, mm = m % 60; return [Math.floor(h / 10), h % 10, Math.floor(mm / 10), mm % 10]; };
    const a = d(m0), b = d(m0 + 1), e = eDepl(clamp(f * 1.6));
    chiffres.forEach((c, i) => { let x = a[i], y = b[i]; if (y < x) y += 10; const pos = x === y ? x : lerp(x, y, e); setVar2(c, pos); });
  }
  function setVar2(c, v) { const s = v.toFixed(3); if (c._d !== s) { c._d = s; c.style.setProperty('--d', s); } }

  /* M1 (treizième passe) : le téléphone de la nuit sur téléphone. L'écran est celui de l'ordinateur, son texte agrandi
     (mobile.taille, en px CSS de l'écran : 15 px au moins à l'écran une fois posé), la seconde réponse se termine par
     « Je vous y mène. » ; mobile.cache : la hauteur (px CSS de l'écran) du bas de l'écran caché (le bas du téléphone
     peut passer sous le rail sur un écran court), pour que le dernier message reste en vue */
  let mobile = null;
  function modeMobile(o) {
    const cle = o ? o.taille.toFixed(1) + ':' + (o.cache ? o.cache.toFixed(0) : '') : '';
    if (cle === (mobile ? mobile.cle : '')) return;
    const avant = mobile; mobile = o ? Object.assign({ cle }, o) : null;
    ecran.classList.toggle('nuit-mobile', !!o);
    ecran.style.fontSize = o ? o.taille.toFixed(1) + 'px' : '';
    if (!!avant !== !!o) ECH.forEach((e, i) => { const R = reps[i]; if (!R) return; R.n = -1; const sr = R.li.querySelector('.sr'); if (sr) sr.textContent = o && e.rMob ? e.rMob : e.r; });
    positions = null;
  }
  const texteRep = e => (mobile && e.rMob ? e.rMob : e.r);
  /* conversation pilotée par p (plan 1) */
  function conversation(p, T) {
    if (!positions) mesurer();
    let txt = null, appui = 1;
    ECH.forEach((e, i) => {
      const t = T.conv[i];
      if (p >= t.tape[0] && p < t.envoi) txt = e.q.slice(0, Math.round(e.q.length * seg(p, t.tape[0], t.tape[1])));
      appui = Math.min(appui, 1 - .07 * cloche(p, t.envoi - .004, t.envoi + .003));
    });
    const cle = txt === null ? '' : txt;
    if (champ._c !== cle || champ._n !== (txt === null)) {
      champ._c = cle; champ._n = txt === null;
      if (txt === null) { champ.classList.remove('tape'); champ.textContent = 'Posez votre question'; }
      else { champ.classList.add('tape'); champ.textContent = txt.length > 28 ? txt.slice(-28) : txt; const c = document.createElement('span'); c.className = 'curseur'; champ.appendChild(c); }
    }
    envoi.style.setProperty('--appui', appui.toFixed(3));
    /* défilement du fil : la question se cale en haut quand la réponse arrive */
    let visible = fil.parentElement.clientHeight || 420;
    /* M1 : le bas de l'écran caché (sous le rail, ou sous le bord) ne compte pas : le dernier message reste en vue */
    if (mobile && mobile.cache > 0) { const corpsEl = fil.parentElement, sous = ECRAN_H - (corpsEl.offsetTop + corpsEl.clientHeight); visible = Math.max(160, visible - Math.max(0, mobile.cache - sous)); }
    let def = 0;
    ECH.forEach((e, i) => {
      const t = T.conv[i], qm = positions[i * 2], rm = positions[i * 2 + 1];
      const suivre = Math.max(0, rm.haut + 46 - visible), caler = Math.max(0, Math.min(qm.haut - 14, rm.bas + (e.guider ? 0 : 0) - visible + 8));
      if (p >= t.envoi) def = lerp(def, suivre, eDepl(seg(p, t.envoi, t.envoi + .008)));
      if (p >= t.rep[0]) def = lerp(def, Math.max(suivre, Math.min(caler, rm.bas - visible + 12)), eDepl(seg(p, t.rep[0], t.rep[0] + .016)));
      /* M1 (treizième passe) : sur téléphone, le texte est plus grand et la réponse plus haute que l'écran : le fil suit la
         frappe (la ligne qui s'écrit reste à 40 px du bas), puis montre la source sous la réponse */
      if (mobile && p >= t.rep[0]) {
        const k = seg(p, t.rep[0], t.rep[1]), suivi = rm.haut + (rm.bas - rm.haut - 30) * k + 40 - visible, finR = rm.bas - visible + 12;
        def = Math.max(def, Math.min(finR, suivi), lerp(0, finR, eDepl(seg(p, t.src - .002, t.src + .008))) * (finR > def ? 1 : 0));
      }
    });
    /* Q6 (dix-septième passe, 07/10/2026) : sur un téléphone court (375 x 667), la réponse sur Thibaut est plus haute que la
       part visible de l'écran : le fil ne monte jamais au-delà de la question « Connaissez-vous Thibaut Harang ? », calée en
       haut ; l'arrêt 1 montre la question et le début de la réponse (sur un écran plus haut, tout tient : rien ne change) */
    if (mobile) { const i = ECH.length - 1, t = T.conv[i]; if (t && p >= t.envoi) def = Math.min(def, Math.max(0, positions[i * 2].haut - 14)); }
    defConv = def;
    setT(fil, `translateY(${(-def).toFixed(1)}px)`);
    ECH.forEach((e, i) => {
      const t = T.conv[i], moi = msgs[i * 2], R = reps[i];
      const em = eEntree(seg(p, t.envoi, t.envoi + .006)), er = eEntree(seg(p, t.points[0] - .002, t.points[0] + .004));
      setO(moi, em); moi.style.transform = `translateY(${((1 - em) * 10).toFixed(1)}px)`;
      setO(R.li, er); R.li.style.transform = `translateY(${((1 - er) * 10).toFixed(1)}px)`;
      R.li.classList.toggle('ecrit', p >= t.points[0] && p < t.rep[0]);
      const rr = texteRep(e), n = Math.round(rr.length * seg(p, t.rep[0], t.rep[1]));
      if (n !== R.n) { R.n = n; R.ecrit.textContent = rr.slice(0, n); R.reste.textContent = rr.slice(n); }
      const ec = eEntree(seg(p, t.src, t.src + .006));
      setO(R.source, ec); R.source.style.transform = `scale(${(.92 + .08 * ec).toFixed(3)})`;
    });
    const eg = eEntree(seg(p, T.guider[0], T.guider[1]));
    const ap = 1 - .04 * cloche(p, T.appui[0], T.appui[0] + .004);
    setO(guiderB, eg); guiderB.style.transform = `translateY(${((1 - eg) * 8).toFixed(1)}px) scale(${ap.toFixed(3)})`;
  }

  /* états de l'écran : { conv, guide, veille, menu } en poids de 0 à 1, et leurs détails */
  function etatEcran(s) {
    setO(fil, 1 - (s.guide || 0) - (s.veille || 0) * 0 - (s.menu || 0));
    setV(fil, (s.guide || 0) < 1 && !(s.veille >= 1) && !(s.menu >= 1));
    const g = s.guide || 0;
    /* H10.3 bis : l'en-tête peut passer à « Marianne, par Civik-ia » sans le panneau du guide (s.tete) */
    const gt = s.tete === undefined ? g : s.tete;
    setO(teteM, 1 - gt); setO(teteG, gt);
    teteG.style.transform = `translateY(${((1 - gt) * 6).toFixed(1)}px)`;
    /* H10.2 : la veille douce de l'écran (s.voile, de 0 à 1) */
    setO(voile, s.voile || 0);
    setO(pGuide, g * (1 - (s.veille || 0)) * (1 - (s.menu || 0))); setV(pGuide, g > 0 && (s.veille || 0) < 1 && (s.menu || 0) < 1);
    pGuide.style.transform = `translateY(${((1 - eEntree(g)) * 24).toFixed(1)}px)`;
    setO(pVeille, (s.veille || 0) * (1 - (s.menu || 0))); setV(pVeille, (s.veille || 0) > 0 && (s.menu || 0) < 1);
    setO(pMenu, s.menu || 0); setV(pMenu, (s.menu || 0) > 0);
    menuLiens.forEach((a, i) => { const k = eEntree(clamp((s.menuLiens || 0) * 1.6 - i * .3)); a.style.opacity = k.toFixed(3); a.style.transform = `translateY(${((1 - k) * 8).toFixed(1)}px)`; });
    ecran.classList.toggle('actif', (s.menu || 0) >= 1 || !!s.actif);
    /* F16 : le menu de la fin, trois boutons seuls, plus grands */
    ecran.classList.toggle('final', !!s.final);
    /* W3 : sur téléphone, les boutons du menu final posés (menuLiens à 1 : p 0,998) */
    etincellesMenu(!!s.final && (s.menuLiens || 0) >= 1);
    if (s.heure !== undefined) heure(s.heure);
    /* le guidage : point sur le chemin, distance, consignes */
    if (s.chemin !== undefined) {
      const k1 = clamp(s.chemin), k2 = clamp(s.branche || 0);
      const pt = k2 > 0 ? branche.getPointAtLength(L2 * k2) : tout.getPointAtLength(L1 * k1);
      point.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      fait.style.strokeDashoffset = (L1 * (1 - k1)).toFixed(1);
      fait2.style.strokeDashoffset = (L2 * (1 - k2)).toFixed(1);
      const atelier = (s.versAtelier || 0) > .5;
      setTxt(dest, atelier ? 'Atelier' : 'Thibaut Harang');
      setTxt(destSous, atelier ? 'Le chemin de droite' : 'Au croisement des chemins');
      destImg.style.visibility = atelier ? 'hidden' : '';
      /* O2 (quinzième passe) : la distance vient de la caméra (monde.reste() : le long du chemin, en mètres du monde), arrondie
         par la même fonction que les bornes ; sans elle (l'atelier, le téléphone posé), la part qui reste des longueurs vues */
      if (s.reste) {
        longueurs.croisement = s.reste.depart; longueurs.atelier = s.reste.departAtelier;
        setTxt(consigneAtelier, 'Atelier, ' + arrondiDistance(s.reste.departAtelier) + NB + 'm');
      }
      const d = s.reste ? arrondiDistance(atelier ? s.reste.atelier : s.reste.croisement) : arrondiDistance(atelier ? longueurs.atelier * (1 - k2) : longueurs.croisement * (1 - k1));
      setTxt(dist, String(d));
    }
    if (s.consigne !== undefined) consignes.forEach((c, i) => { const k = clamp(1 - Math.abs(s.consigne - i) * 1.4); setO(c, k); c.style.transform = `translateY(${((i - s.consigne) * 14).toFixed(1)}px)`; setV(c, k > 0); });
  }

  /* H10.3 bis : le message d'arrivée (o.msg de 0 à 1) puis les trois boutons (o.liens de 0 à 1). Le fil remonte
     d'abord juste assez pour montrer la bulle au bas de l'écran, puis jusqu'à poser le message en haut du corps
     (sous l'en-tête), les boutons dessous, à l'abri du pouce */
  let arrMes = null;
  const POUCE = [.36, .58];   /* K4 : le haut et le bas du pouce, en fraction de la hauteur de l'écran (image main-gauche-telephone) */
  function arrivee(o) {
    const km = clamp(o.msg || 0), kl = clamp(o.liens || 0);
    /* N6 (quatorzième passe) : quand les trois boutons se posent, le champ « Posez votre question » s'efface (le menu est la
       fin de la conversation) */
    if (ecran._finConv !== (kl > 0)) { ecran._finConv = kl > 0; ecran.classList.toggle('fin-conv', kl > 0); }
    setV(arr, km > .002); setO(arr, eEntree(clamp(km * 1.4)));
    arrBulle.style.transform = `translateY(${((1 - eEntree(km)) * 14).toFixed(1)}px)`;
    arrLiens.forEach((a, i) => { const k = eEntree(clamp(kl * 1.6 - i * .3)); setV(a, k > .002); a.style.opacity = k.toFixed(3); a.style.transform = `translateY(${((1 - k) * 12).toFixed(1)}px)`; a.tabIndex = k >= 1 ? 0 : -1; });
    /* W3 : les trois boutons posés (kl à 1 : p 0,998, la main immobile depuis 0,9968) ; l'étincelle part une seconde après */
    etincellesArr(kl >= 1 && km >= 1);
    if (km <= 0) { arrMes = null; return; }
    if (!arrMes) {
      arrMes = { haut: arr.offsetTop, bulle: arrBulle.offsetHeight, vis: fil.parentElement.clientHeight || 540 };
      /* K4 (onzième passe) : plus de vide sous le message. Les trois boutons se répartissent dans l'espace qui reste sous
         la bulle quand le message est posé en haut (fil remonté : la bulle à 12 px du haut), à intervalles égaux au-dessus,
         entre et au-dessous d'eux : centrés verticalement, espacement régulier (au moins 10 px) ; leur taille ne change
         pas (au moins 44 px de haut à l'écran, H10) */
      /* Le pouce de la main (main-gauche-telephone) couvre la gauche de l'écran entre 36 % et 58 % de sa hauteur (relevé
         sur l'image : la plaque de 0,37 à 0,58, la gauche jusqu'à 45 % de la largeur). Sous lui, il n'y a que la place des
         trois boutons (44 px au moins à l'écran) : ils s'y répartissent à intervalles égaux, entre le bas du pouce et le
         champ de saisie. Au-dessus, la bulle de Marianne grandit (son texte plus grand, sur trois lignes) jusqu'au pouce :
         plus de vide sous le message ; le pouce se pose entre la bulle et les boutons */
      const box = arrLiens[0] && arrLiens[0].parentElement;
      if (box && arrLiens[0].offsetHeight && !ecran.classList.contains('feuille-mobile')) {
        let haut0 = 0; for (let e = fil.parentElement; e && e !== ecran; e = e.offsetParent) haut0 += e.offsetTop;
        const pouceHaut = POUCE[0] * ECRAN_H - haut0, pouceBas = POUCE[1] * ECRAN_H - haut0;
        /* la bulle : la plus grande taille de texte qui la laisse au-dessus du pouce (de 1,42 à 2,1 em) */
        for (let fs = 2.1; fs >= 1.42; fs -= .04) { arrBulle.style.fontSize = fs.toFixed(2) + 'em'; if (12 + arrBulle.offsetHeight <= pouceHaut - 6) break; }
        arrMes.bulle = arrBulle.offsetHeight;
        const bh = arrLiens[0].offsetHeight, bulleBas = 12 + arrMes.bulle;
        /* le bas utile : le haut du champ de saisie (le fil passe dessous) */
        const champ = ecran.querySelector('.tel__champ'); let champHaut = 0; for (let e = champ; e && e !== ecran; e = e.offsetParent) champHaut += e.offsetTop;
        const basUtile = (champ ? Math.min(arrMes.vis, champHaut - haut0) : arrMes.vis) - 4;
        const n = arrLiens.length, debut = Math.min(Math.max(bulleBas, pouceBas), basUtile - n * bh - (n + 1) * 6);
        const g = Math.max(6, (basUtile - debut - n * bh) / (n + 1));
        box.style.marginTop = (debut - bulleBas + g).toFixed(1) + 'px'; box.style.gap = g.toFixed(1) + 'px';
      }
    }
    const m = arrMes, voir = Math.max(defConv, m.haut + m.bulle + 22 - m.vis), fin = Math.max(voir, m.haut - 12);
    const d = lerp(defConv, voir, eDepl(clamp(km))) + (fin - voir) * eDepl(clamp(kl * 1.25));
    setT(fil, `translateY(${(-d).toFixed(1)}px)`);
  }

  /* ---- la pose : quadrilatère du corps à l'écran ---- */
  let vu = false, vu34 = false;
  function poser(o) {
    vu = true; arrondir(rayonFace);
    /* M1 : le vrai téléphone sur petit écran (la nuit) : l'écran n'est plus la feuille du bas */
    if (ecran.classList.contains('feuille-mobile')) { ecran.classList.remove('feuille-mobile', 'compact'); ecran.style.zIndex = ''; positions = null; }
    const Q = o.quad, op = o.op === undefined ? 1 : o.op, ep = o.ep || [0, 0];
    const H = quadVersQuad(corps, Q);
    /* X1 bis : sur téléphone, une tranche sans épaisseur (le téléphone de face : opacité 0) est cachée, et non seulement transparente :
       ses neuf calques (101 Mo dans le moteur de Safari) rendent leur mémoire (outils.js, setV) */
    const epais = Math.hypot(ep[0], ep[1]) > .4;
    tous.forEach((e, i) => { setV(e, op > .001 && !(TEL && !epais && TRANCHES.has(e))); e.style.zIndex = (o.z || 30) + zbase[i]; });
    setT(support, m3d(H)); setO(support, op * (o.matiere === undefined ? 1 : o.matiere));
    let qe = ecranQ.map(([x, y]) => appl(H, x, y));
    if (o.ecranDepuis && o.passe !== undefined && o.passe < 1) qe = qe.map((p2, i) => [lerp(o.ecranDepuis[i][0], p2[0], o.passe), lerp(o.ecranDepuis[i][1], p2[1], o.passe)]);
    setT(ecran, epingle(ECRAN_W, ECRAN_H, qe)); setO(ecran, (o.opEcran !== undefined ? o.opEcran : op) * (o.matiere === undefined ? 1 : o.matiere));
    if (o.opEcran !== undefined) setV(ecran, true);
    setT(reflet, epingle(ECRAN_W, ECRAN_H, qe)); setO(reflet, op * (o.reflet === undefined ? 1 : o.reflet));
    refletI.style.setProperty('--rx', ((o.glisse || 0) * 100).toFixed(1) + '%');
    const kq = Q.map(p => p);
    tranches.forEach((t, i) => {
      const k = (i + 1) / N, qq = kq.map(([x, y]) => [x + ep[0] * k, y + ep[1] * k]);
      setT(t, m3d(quadVersQuad(boite, qq))); setO(t, op * (o.matiere === undefined ? 1 : o.matiere) * (epais ? 1 : 0));
    });
    const om = o.ombre || { dx: 18, dy: 26, op: .5 };
    setT(ombre, m3d(quadVersQuad(boite, Q.map(([x, y]) => [x + om.dx, y + om.dy])))); setO(ombre, op * om.op);
    setT(dessin, m3d(quadVersQuad(boite, Q))); setO(dessin, op * (o.dessin === undefined ? 0 : 1));
    if (o.contact) {
      const a = Q[3], b = Q[2], l = Math.hypot(b[0] - a[0], b[1] - a[1]), h = l * .09 * o.contact;
      setT(contact, epingle(200, 40, [[a[0] - l * .06, a[1] - h * .55], [b[0] + l * .1, b[1] - h * .55], [b[0] + l * .1, b[1] + h * .45], [a[0] - l * .06, a[1] + h * .45]])); setO(contact, op * o.contact);
    } else setO(contact, 0);
    if (o.masque !== undefined) masquer(o.masque);
  }
  /* la matière s'efface derrière le crayon qui fait le tour (angle balayé en degrés) */
  const CIBLES = () => [support, ecran, ...tranches];
  function masquer(m) {
    /* m : { de, a } en degrés ; la matière s'efface sur l'angle balayé par le crayon */
    const a = m ? m.a : 0, de = m ? m.de : -90;
    const v = a <= .5 ? '' : a >= 359.5 ? 'linear-gradient(transparent,transparent)' : `conic-gradient(from ${de.toFixed(1)}deg at 50% 50%, transparent 0deg ${a.toFixed(1)}deg, #000 ${Math.min(360, a + 16).toFixed(1)}deg)`;
    CIBLES().forEach(e => { if (e._mk !== v) { e._mk = v; e.style.webkitMaskImage = v; e.style.maskImage = v; } });
  }

  /* le griffonnage (plan 7) : la bande en zigzag déjà parcourue efface l'objet réel, à bords doux.
     t : { pts (repère du corps, px), largeur, flou } ou null ; un seul masque SVG, recalé sur chaque élément */
  let masqueCle = '';
  const ecrBox = (() => { const e = ecranQ.map(([x, y]) => [x - corps[0][0], y - corps[0][1]]); return [Math.min(e[0][0], e[3][0]), Math.min(e[0][1], e[1][1]), Math.max(e[1][0], e[2][0]), Math.max(e[2][1], e[3][1])]; })();
  function griffe(t) {
    const cle = t ? t.pts.length + ':' + t.pts[t.pts.length - 1].map(v => v.toFixed(1)).join(',') : '';
    if (cle === masqueCle) return; masqueCle = cle;
    const parts = [[support, corps[0][0], corps[0][1], 1, 1], [ecran, -ecrBox[0] * ECRAN_W / (ecrBox[2] - ecrBox[0]), -ecrBox[1] * ECRAN_H / (ecrBox[3] - ecrBox[1]), ECRAN_W / (ecrBox[2] - ecrBox[0]), ECRAN_H / (ecrBox[3] - ecrBox[1])], [reflet, -ecrBox[0] * ECRAN_W / (ecrBox[2] - ecrBox[0]), -ecrBox[1] * ECRAN_H / (ecrBox[3] - ecrBox[1]), ECRAN_W / (ecrBox[2] - ecrBox[0]), ECRAN_H / (ecrBox[3] - ecrBox[1])], [ombre, 0, 0, 1, 1], ...tranches.map(e => [e, 0, 0, 1, 1])];
    if (!t || t.pts.length < 2) { parts.forEach(([e]) => { e.style.webkitMaskImage = e.style.maskImage = ''; }); return; }
    const d = 'M' + t.pts.map(([x, y]) => x.toFixed(1) + ' ' + y.toFixed(1)).join('L');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${bw}" height="${bh}" viewBox="0 0 ${bw} ${bh}"><defs><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${t.flou.toFixed(1)}"/></filter><mask id="m" maskUnits="userSpaceOnUse" x="${-bw}" y="${-bh}" width="${bw * 3}" height="${bh * 3}"><rect x="${-bw}" y="${-bh}" width="${bw * 3}" height="${bh * 3}" fill="#fff"/><path d="${d}" fill="none" stroke="#000" stroke-width="${t.largeur.toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" filter="url(#f)"/></mask></defs><rect width="${bw}" height="${bh}" fill="#000" mask="url(#m)"/></svg>`;
    const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
    parts.forEach(([e, x, y, sx, sy]) => {
      e.style.webkitMaskImage = e.style.maskImage = url;
      e.style.webkitMaskRepeat = e.style.maskRepeat = 'no-repeat';
      e.style.webkitMaskSize = e.style.maskSize = `${(bw * sx).toFixed(1)}px ${(bh * sy).toFixed(1)}px`;
      e.style.webkitMaskPosition = e.style.maskPosition = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    });
  }

  /* la photo de trois quarts : posée par son corps (centre, hauteur), l'écran dans son quad en perspective ;
     k de 1 (photo seule) à 0 (téléphone de face) pour passer la main au téléphone de face */
  function poser34(o) {
    if (!im34) return false;
    vu = true; vu34 = true; arrondir(rayon34);
    const [x0, y0] = corps34[0], [x1, y1] = corps34[2], hb = y1 - y0, k = o.k === undefined ? 1 : o.k;
    /* o.sx : largeur relative (F3 : la photo s'élargit en tournant vers nous, autour de son axe vertical) */
    const e = o.h / hb, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, ex = e * (o.sx || 1);
    const H = [ex, 0, o.cx - cx * ex, 0, e, o.cy - cy * e, 0, 0, 1];
    setV(im34, k > .002); setT(im34, m3d(H)); setO(im34, k); im34.style.zIndex = (o.z || 30) + 3;
    const q34 = ecran34.map(([x, y]) => appl(H, x, y));
    if (k >= 1) {
      [support, reflet, dessin, ...tranches].forEach(el2 => setV(el2, false));
      setV(ecran, true); setO(ecran, 1); setT(ecran, epingle(ECRAN_W, ECRAN_H, q34)); ecran.style.zIndex = (o.z || 30) + 2;
      const om = o.ombre || { dx: 30, dy: 40, op: .42 };
      setV(ombre, true); setT(ombre, m3d(quadVersQuad(boite, corps34.map(([x, y]) => appl(H, x, y)).map(([x, y]) => [x + om.dx, y + om.dy])))); setO(ombre, om.op);
    }
    return q34;
  }
  /* petit écran : pas de téléphone dans le téléphone ; l'écran se loge en bas comme une messagerie */
  function feuille(o) {
    vu = true; arrondir(null); modeMobile(null);
    tous.forEach(e => { if (e !== ecran) setV(e, false); });
    ecran.classList.add('feuille-mobile');
    ecran.classList.toggle('compact', !!o.compact);
    const op = o.op === undefined ? 1 : o.op, ty = o.descend || 0;
    setV(ecran, op > .002); setO(ecran, op);
    setT(ecran, `translateY(${(ty * 100).toFixed(1)}%)`);
    ecran.style.zIndex = 44;
  }
  return {
    ecran, dessin, bw, bh, conversation, etatEcran, poser, poser34, a34: !!im34, mesurer, feuille, griffe, arrivee, modeMobile, ecranQ, corps,
    debut() { vu = false; vu34 = false; },
    fin() { if (!vu) tous.forEach(e => setV(e, false)); if (im34 && !vu34) setV(im34, false); },
    get positions() { return positions; }
  };
}
