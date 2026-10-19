/* Génère le carrousel « Le cerveau de Marianne » (6 étapes + 1 visuel de contact) pour chaque réseau.
   Entrées : scenes3/<format>-etat-<n>.png (capture.js), build/ (polices, sceau, glyphe, village de nuit).
   Sortie : out/<reseau>/<nn>-<nom>.png, rendu en 2x. */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const SIGNE = fs.readFileSync('signe.html', 'utf8').replace(/<a [^>]*>/, '<span class="signe">').replace('</a>', '</span>');

const ETAPES = [
  ['Collecte', 'Nous rassemblons tout ce que votre commune publie&nbsp;: pages du site, PDF, arrêtés, délibérations, bulletins, jusqu\'aux scans et aux affiches. Rien n\'est encore&nbsp;trié'],
  ['Lecture', 'Le texte de chaque document est extrait, scans compris. Un arrêté photographié devient un texte que Marianne peut citer, daté et classé, avec le lien vers l\'acte&nbsp;publié'],
  ['Nettoyage', 'Chaque document passe au contrôle&nbsp;: doublons écartés, pages périmées retirées, contradictions repérées. Quand deux documents se contredisent, vos agents&nbsp;tranchent'],
  ['Consolidation', 'Une fiche par sujet, écrite à partir de tous les documents qui en parlent&nbsp;: cantine, déchets, état civil, urbanisme. Une session de tests vérifie ensuite les réponses aux questions les plus&nbsp;fréquentes'],
  ['Sourçage', 'Chaque fiche garde sa source et sa date, et chaque réponse la cite. D\'un clic, l\'habitant ouvre le document d\'origine et vérifie par&nbsp;lui-même'],
  ['L\'application', 'Toutes les fiches rejoignent l\'application Marianne, à portée de chaque habitant, jour et nuit&nbsp;: sur votre site, par un bouton «&nbsp;Une question&nbsp;?&nbsp;» et un onglet dans le menu, sur smartphone, par QR code, et bientôt sur WhatsApp et Messenger (Meta). Hébergée en Europe chez OVHcloud, moteur&nbsp;Mistral']
];

/* un format par réseau : taille en px CSS (rendu 2x), scène utilisée, classe de mise en page */
const FORMATS = {
  'linkedin':        { w: 1080, h: 1350, scene: 'post',  cls: 'f-post' },
  'instagram-post':  { w: 1080, h: 1350, scene: 'post',  cls: 'f-post' },
  'facebook':        { w: 1080, h: 1080, scene: 'carre', cls: 'f-carre' },
  'instagram-story': { w: 1080, h: 1920, scene: 'story', cls: 'f-story' },
  'x':               { w: 1200, h: 675,  scene: 'x',     cls: 'f-x' }
};

const CSS = `
@font-face{font-family:'Inter';font-weight:400 700;src:url('build/inter-latin-var.woff2') format('woff2')}
@font-face{font-family:'Poppins';font-weight:700;src:url('build/poppins-latin-700.woff2') format('woff2')}
@font-face{font-family:'Poppins';font-weight:800;src:url('build/poppins-latin-800.woff2') format('woff2')}
:root{--bleu:#000091;--trait:#2b6fd6;--teal:#2EC4B6;--teal-txt:#0b6a62;--encre:#1E1E1E;--encre-2:#5a5a5a;--creme:#f7f4ed;--papier:#fffdf8;--nuit:#0A0F2C;--nuit-2:#121a47;--nuit-txt2:#b9c1e0;--sans:'Inter',system-ui,sans-serif;--titre:'Poppins','Inter',sans-serif}
*{box-sizing:border-box;margin:0}
html,body{background:var(--creme)}
body{font-family:var(--sans);color:var(--encre);-webkit-font-smoothing:antialiased;overflow:hidden}
.slide{position:relative;width:var(--w);height:var(--h);background:var(--creme);display:flex;flex-direction:column;overflow:hidden}
.slide > *,.fin__in > *{flex:none}
.fin .pied{padding-top:0}
.fin .tete,.fin .pied{position:absolute;left:var(--px);right:var(--px)}
.fin .tete,.fin .pied{width:auto !important}
.fin .tete{top:var(--pt)}
.fin .pied{bottom:var(--pb);margin-top:0}
.fin .fin__in{justify-content:center}
.slide::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% -10%,rgba(0,0,145,.06),transparent 55%);pointer-events:none}
.tete{display:flex;align-items:center;justify-content:space-between;gap:16px}
.signe{display:inline-flex;align-items:center;gap:8px;color:var(--bleu);font:800 22px/1 var(--titre);letter-spacing:-.02em}
.signe svg{width:40px;height:35px}.cc-signe__arc{fill:#010442}.cc-signe__fleche{fill:#0C7BF6}.signe b{color:var(--trait);font-weight:800}
.sur{display:inline-flex;align-items:center;gap:10px;font:600 17px/1.3 var(--sans);color:var(--teal-txt);letter-spacing:.01em}
.sur::before{content:"";width:9px;height:9px;border-radius:50%;background:var(--teal)}
.compteur{font:700 15px/1 var(--sans);letter-spacing:.12em;text-transform:uppercase;color:var(--encre-2);font-variant-numeric:tabular-nums}
.scene{position:relative;flex:none}
.scene img{display:block;width:100%;height:100%;border-radius:24px}
.texte{display:flex;flex-direction:column}
.titre{display:flex;align-items:baseline;gap:22px}
.num{font:800 1em/.9 var(--titre);color:var(--bleu);letter-spacing:-.04em}
.h3{font:700 1em/1.12 var(--titre);letter-spacing:-.02em;color:var(--bleu);text-wrap:balance}
.texte p{color:var(--encre-2);text-wrap:pretty;max-width:100%}
.texte p strong{color:var(--encre);font-weight:600}
.pied{display:flex;align-items:center;justify-content:space-between;margin-top:auto}
.points{display:flex;gap:9px}
.points i{width:12px;height:12px;border-radius:50%;background:var(--creme);border:2px solid rgba(0,0,145,.25)}
.points i.actif{background:var(--bleu);border-color:var(--bleu);box-shadow:0 0 0 5px rgba(0,0,145,.1)}
.points i.passe{background:var(--bleu);border-color:var(--bleu)}
.url{font:600 16px/1 var(--sans);color:var(--encre-2)}
.url b{color:var(--bleu);font-weight:700}

.canaux{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.canaux li{display:inline-flex;align-items:center;gap:9px;padding:9px 14px 9px 12px;border-radius:9999px;background:var(--papier);border:1px solid rgba(0,0,145,.16);box-shadow:0 2px 8px rgba(0,0,80,.05);font:600 1em/1 var(--sans);color:var(--encre)}
.canaux svg{width:1.25em;height:1.25em;fill:none;stroke:var(--bleu);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.etat{font:700 .68em/1 var(--sans);letter-spacing:.06em;text-transform:uppercase;padding:4px 7px;border-radius:9999px}
.etat--disponible{background:rgba(46,196,182,.16);color:var(--teal-txt)}
.etat--bientot{background:rgba(244,162,97,.2);color:#9A5B1E}
/* 4:5, 1080 x 1350 */
.f-post .slide{padding:52px 52px 48px;gap:0}
.f-post .tete{height:48px}
.f-post .scene{width:976px;height:860px;margin-top:28px}
.f-post .texte{margin-top:34px}
.f-post .titre{font-size:0}.f-post .num{font-size:84px}.f-post .h3{font-size:42px}
.f-post .texte p{margin-top:16px;font-size:24px;line-height:1.5}
.f-post .canaux{font-size:18px}
.f-post.n6 .scene{height:740px}
.f-post .pied{height:36px}

/* carré, 1080 x 1080 */
.f-carre .slide{padding:40px 48px 40px}
.f-carre .tete{height:40px}
.f-carre .scene{width:984px;height:700px;margin-top:20px}
.f-carre .texte{margin-top:22px}
.f-carre .num{font-size:66px}.f-carre .h3{font-size:34px}
.f-carre .texte p{margin-top:10px;font-size:20px;line-height:1.48}
.f-carre .canaux{font-size:15.5px;margin-top:14px;gap:8px}
.f-carre.n6 .scene{height:590px}
.f-carre .pied{height:30px}

/* story, 1080 x 1920 (zones sûres : 220 px en haut, 260 px en bas) */
.f-story .slide{padding:200px 64px 250px}
.f-story .tete{height:48px}
.f-story .scene{width:952px;height:1020px;margin-top:32px}
.f-story .texte{margin-top:40px}
.f-story .num{font-size:100px}.f-story .h3{font-size:50px}
.f-story .texte p{margin-top:18px;font-size:28px;line-height:1.5}
.f-story .canaux{font-size:20px;margin-top:22px}
.f-story.n6 .scene{height:920px}
.f-story .pied{height:36px}

/* X, 1200 x 675 : la scène à gauche, le texte à droite */
.f-x .slide{padding:36px 44px 32px}
.f-x .tete{height:36px}
.f-x .corps{display:flex;gap:44px;margin-top:14px;flex:1}
.f-x .scene{width:580px;height:510px}
.f-x .texte{flex:1;justify-content:center}
.f-x .num{font-size:64px}.f-x .h3{font-size:32px}
.f-x .texte p{margin-top:12px;font-size:17.5px;line-height:1.5}
.f-x .canaux{font-size:13.5px;margin-top:14px;gap:7px}
.f-x .canaux li{padding:7px 11px 7px 9px}
.f-x .pied{height:28px;margin-top:12px}
.f-x .signe{font-size:19px}.f-x .signe svg{width:34px;height:30px}.f-x .sur{font-size:15px}.f-x .compteur{font-size:13px}.f-x .url{font-size:14px}

/* 7 : contact, sur la nuit de la page */
.fin{background:var(--nuit);color:#fff;text-align:center;align-items:center;justify-content:flex-start}
.fin::before{display:none}
.fin__art{position:absolute;left:0;right:0;top:0;height:46%;overflow:hidden;-webkit-mask-image:linear-gradient(#000 35%,transparent 100%);mask-image:linear-gradient(#000 35%,transparent 100%);opacity:.9}
.fin__art img{width:100%;height:100%;object-fit:cover;object-position:50% 40%}
.fin__art::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,15,44,.1),rgba(10,15,44,.35))}
.fin__in{position:relative;display:flex;flex-direction:column;align-items:center;width:100%;height:100%}
.fin .tete{width:100%}
.fin .signe{color:#fff}.fin .cc-signe__arc{fill:#fff}.fin .sur{color:#a9c4ff}.fin .sur::before{background:var(--teal)}.fin .compteur{color:#d5dbf2}
.sceau{position:relative;border-radius:50%;background:radial-gradient(circle at 50% 46%,#fffefb 0,#fcf9f3 52%,#f3eee5 100%);box-shadow:0 0 0 1px rgba(170,174,235,.75),0 0 0 10px rgba(43,111,214,.12),0 0 60px 14px rgba(43,111,214,.28),0 18px 48px rgba(0,0,0,.35)}
.sceau img{position:absolute;left:22.1%;top:22.6%;width:55%}
.fin .h2{font:700 1em/1.06 var(--titre);letter-spacing:-.03em;color:#fff;text-wrap:balance}
.fin .chapo{color:#d5dbf2;text-wrap:pretty}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:12px;padding:0 34px;border-radius:9999px;font:600 1em/1.2 var(--sans);white-space:nowrap;background:var(--creme);color:var(--nuit);box-shadow:0 10px 30px rgba(0,0,0,.28)}
.btn svg{width:.95em;height:.95em}
.contact{display:flex;flex-direction:column;align-items:center;gap:6px;font:500 1em/1.4 var(--sans);color:var(--nuit-txt2)}
.contact b{color:#fff;font-weight:700}
.contact .mail{color:#a9c4ff;font-weight:600}
.dalles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;width:100%}
.dalles span{display:block;padding:14px 16px;border-radius:14px;background:rgba(18,26,71,.85);border:1px solid rgba(255,255,255,.08);color:var(--nuit-txt2);font:500 1em/1.3 var(--sans);text-align:left}
.dalles b{display:block;font:800 1.3em/1.2 var(--titre);color:#fff;letter-spacing:-.01em}
.fin .pied{width:100%}.fin .url{color:#d5dbf2}.fin .url b{color:#fff}
.fin .points i{background:transparent;border-color:rgba(255,255,255,.35)}.fin .points i.passe,.fin .points i.actif{background:#fff;border-color:#fff;box-shadow:none}

.f-post .fin .fin__in{padding:52px 52px 48px;--px:52px;--pt:52px;--pb:48px}
.f-post .fin .sceau{width:180px;height:180px;margin-top:-40px}
.f-post .fin .h2{font-size:58px;margin-top:40px;max-width:900px}
.f-post .fin .chapo{font-size:24px;margin-top:22px;max-width:760px}
.f-post .fin .btn{font-size:21px;height:64px;margin-top:36px}
.f-post .fin .contact{font-size:21px;margin-top:38px}
.f-post .fin .dalles{font-size:15px;margin-top:40px}

.f-carre .fin .fin__in{padding:46px 48px 44px;--px:48px;--pt:46px;--pb:44px}
.f-carre .fin .sceau{width:140px;height:140px;margin-top:-20px}
.f-carre .fin .h2{font-size:50px;margin-top:30px;max-width:860px}
.f-carre .fin .chapo{font-size:21px;margin-top:16px;max-width:720px}
.f-carre .fin .btn{font-size:19px;height:58px;margin-top:28px}
.f-carre .fin .contact{font-size:18.5px;margin-top:28px}
.f-carre .fin .dalles{font-size:13.5px;margin-top:30px}

.f-story .fin .fin__art{height:42%}
.f-story .fin .fin__in{padding:200px 64px 250px;--px:64px;--pt:200px;--pb:250px}
.f-story .fin .sceau{width:220px;height:220px;margin-top:-60px}
.f-story .fin .h2{font-size:66px;margin-top:48px;max-width:900px}
.f-story .fin .chapo{font-size:27px;margin-top:26px;max-width:800px}
.f-story .fin .btn{font-size:24px;height:72px;margin-top:44px}
.f-story .fin .contact{font-size:24px;margin-top:48px}
.f-story .fin .dalles{font-size:17px;margin-top:52px}

.f-x .fin .fin__art{height:100%;-webkit-mask-image:linear-gradient(90deg,#000 20%,transparent 60%);mask-image:linear-gradient(90deg,#000 20%,transparent 60%);opacity:.55}
.f-x .fin .fin__in{padding:40px 44px 36px;--px:44px;--pt:40px;--pb:36px;text-align:left;align-items:flex-start}
.f-x .fin .corps{display:flex;align-items:center;gap:40px;flex:1;width:100%}
.f-x .fin .corps > div:last-child{flex:1;min-width:0}
.f-x .fin .sceau{width:150px;height:150px;flex:none;margin:0 10px 0 40px}
.f-x .fin .h2{font-size:38px;max-width:720px}
.f-x .fin .chapo{font-size:17.5px;margin-top:14px;max-width:620px}
.f-x .fin .actions{display:flex;align-items:center;gap:26px;margin-top:22px}
.f-x .fin .btn{font-size:16px;height:48px;padding:0 24px}
.f-x .fin .contact{font-size:14.5px;align-items:flex-start;gap:2px;white-space:nowrap}
.f-x .fin .dalles{font-size:12.5px;margin-top:22px;max-width:620px}
.f-x .fin .dalles span{padding:10px 12px}
`;

const FLECHE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
const points = n => '<span class="points">' + [1,2,3,4,5,6].map(k => `<i class="${k < n ? 'passe' : k === n ? 'actif' : ''}"></i>`).join('') + '</span>';
const tete = (n, total) => `<div class="tete">${SIGNE}<span class="compteur">${n}&nbsp;/&nbsp;${total}</span></div>`;
const pied = n => `<div class="pied">${points(n)}<span class="url"><b>civik-ia.fr</b>/marianne</span></div>`;

function etape(f, n) {
  const [titre, texte] = ETAPES[n - 1];
  const scene = `<div class="scene"><img src="scenes3/${f.scene}-etat-${n}.png" alt=""></div>`;
  const txt = `<div class="texte"><div class="titre"><span class="num">0${n}</span><span class="h3">${titre}</span></div><p>${texte}</p>${n === 6 ? canaux() : ''}</div>`;
  const corps = f.cls === 'f-x' ? `<div class="corps">${scene}${txt}</div>` : scene + txt;
  return `<div class="slide">${tete(n, 6)}${corps}${pied(n)}</div>`;
}
function contact(f) {
  const dalles = '<div class="dalles"><span><b>OVHcloud</b>hébergée en Europe</span><span><b>Mistral</b>moteur européen</span><span><b>Vos données</b>pour votre commune seule</span></div>';
  const btn = `<span class="btn">Demander une démo ${FLECHE}</span>`;
  const coord = '<div class="contact"><b>Thibaut Harang, Civik-ia</b><span class="mail">thibaut.harang@civik-ia.fr</span><span>linkedin.com/in/thibaut-harang</span></div>';
  const sceau = '<div class="sceau"><img src="build/marianne-glyph.svg" alt=""></div>';
  const h2 = '<div class="h2">Déployons Marianne dans votre&nbsp;collectivité</div>';
  const chapo = '<p class="chapo">Une présentation de Marianne en 30&nbsp;minutes, en&nbsp;visio</p>';
  const inner = f.cls === 'f-x'
    ? `<div class="corps">${sceau}<div>${h2}${chapo}<div class="actions">${btn}${coord}</div>${dalles}</div></div>`
    : `${sceau}${h2}${chapo}${btn}${coord}${dalles}`;
  const piedFin = `<div class="pied"><span class="sur">Marianne, le chatbot IA des mairies</span><span class="url"><b>civik-ia.fr</b>/marianne</span></div>`;
  return `<div class="slide fin"><div class="fin__art"><img src="build/village-nuit.webp" alt=""></div><div class="fin__in">${tete(7, 7)}${inner}${piedFin}</div></div>`;
}

const ICO = {
  site: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/></svg>',
  tel: '<svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18h2"/></svg>',
  qr: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v2M17 20h3"/></svg>',
  wa: '<svg viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z"/><path d="M9.5 9.5c.3 2 2.5 4.3 4.7 4.8l1.3-1.3-1.6-1-1 .7c-.8-.4-1.5-1.1-1.9-1.9l.7-1-1-1.6z"/></svg>',
  ms: '<svg viewBox="0 0 24 24"><path d="M12 3.5a8.3 8.3 0 0 0-8.3 8.3c0 2.6 1.2 4.9 3.1 6.4v3.3l3-1.7a9 9 0 0 0 2.2.3 8.3 8.3 0 1 0 0-16.6z"/><path d="M7.5 13.5l3-3.2 2.4 2.2 3.6-3.4"/></svg>'
};
const CANAUX = [
  ['site', 'Sur votre site', 'disponible'], ['tel', 'Sur votre smartphone', 'disponible'], ['qr', 'QR code & affichage', 'disponible'],
  ['wa', 'WhatsApp', 'bientot'], ['ms', 'Messenger', 'bientot']
];
const canaux = () => '<ul class="canaux">' + CANAUX.map(([i, l, e]) => `<li>${ICO[i]}<span>${l}</span><b class="etat etat--${e}">${e === 'bientot' ? 'Bientôt' : 'Disponible'}</b></li>`).join('') + '</ul>';
const NOMS = ['collecte', 'lecture', 'nettoyage', 'consolidation', 'sourcage', 'application', 'contact'];
(async () => {
  const b = await chromium.launch();
  const seuls = process.argv[2] ? process.argv[2].split(',') : Object.keys(FORMATS);
  for (const nom of seuls) {
    const f = FORMATS[nom];
    const ctx = await b.newContext({ viewport: { width: f.w, height: f.h }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    fs.mkdirSync(`out/${nom}`, { recursive: true });
    for (let n = 1; n <= 7; n++) {
      const html = `<!doctype html><html lang="fr" class="${f.cls}${n === 6 ? ' n6' : ''}" style="--w:${f.w}px;--h:${f.h}px"><head><meta charset="utf-8"><base href="file://${path.resolve('.')}/"><style>${CSS}</style></head><body>${n <= 6 ? etape(f, n) : contact(f)}</body></html>`;
      const fichier = path.resolve(`build/${nom}-${n}.html`); fs.writeFileSync(fichier, html);
      await page.goto('file://' + fichier); await page.evaluate(() => document.fonts.ready);
      /* contrôle : rien ne déborde du cadre */
      const deb = await page.evaluate(() => { const s = document.querySelector('.slide'); const r = []; s.querySelectorAll('*').forEach(e => { const b = e.getBoundingClientRect(); if (b.width && (b.bottom > s.clientHeight + .5 || b.right > s.clientWidth + .5)) r.push(e.className || e.tagName); }); return r.slice(0, 5); });
      if (deb.length) console.log('DEBORDE', nom, n, deb);
      await page.screenshot({ path: `out/${nom}/0${n}-${NOMS[n - 1]}.png`, clip: { x: 0, y: 0, width: f.w, height: f.h } });
    }
    await ctx.close(); console.log('ok', nom);
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
