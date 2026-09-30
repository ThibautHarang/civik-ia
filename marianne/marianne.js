/* =====================================================================
   Marianne, page produit (civik-ia.fr/marianne/)
   Aucune dependance : defilement natif, une valeur de progression par section.
   ===================================================================== */

// Statut des canaux de Marianne : modifier ici uniquement.
// "disponible" | "bientot" | "masque"
const MARIANNE_CHANNELS = {
  site:      { status: "disponible", label: "Sur votre site" },
  qr:        { status: "disponible", label: "QR code & affichage" },
  telephone: { status: "bientot",    label: "Au téléphone" },   // [À CONFIRMER]
  whatsapp:  { status: "bientot",    label: "WhatsApp" },       // [À CONFIRMER]
  messenger: { status: "bientot",    label: "Messenger" },      // [À CONFIRMER]
};

/* ---------- petits outils ---------- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const borne = (v, a, b) => Math.min(b, Math.max(a, v));
const doux = t => 1 - Math.pow(1 - t, 3);
const racine = document.documentElement;
const mouvementReduit = matchMedia('(prefers-reduced-motion: reduce)').matches || racine.classList.contains('anim-non');

// Chaque module est isole : si l'un echoue, la page retombe sur sa version statique, complete et lisible,
// et les modules suivants s'executent quand meme.
function securise(module) {
  try { module(); } catch (erreur) {
    racine.classList.remove('scrub'); racine.classList.add('anim-non');
    const h = document.getElementById('hero'); if (h) { h.style.setProperty('--p', 1); h.classList.add('hero--fin'); }
    if (window.console) console.error('[marianne] ' + (module.name || 'module') + ' : ' + erreur.message);
  }
}
const statut = cle => (MARIANNE_CHANNELS[cle] || {}).status || 'masque';
const INSEC = ' ';

/* =====================================================================
   1. Canaux : tout ce qui depend de MARIANNE_CHANNELS
   ===================================================================== */
securise(function canaux() {
  // Cartes, variantes de texte et pastilles
  $$('[data-canal]').forEach(el => {
    const etat = statut(el.dataset.canal);
    el.dataset.etat = etat;
    $$('[data-canal-badge]', el).forEach(b => {
      b.dataset.etat = etat;
      b.textContent = etat === 'disponible' ? 'Disponible' : etat === 'bientot' ? 'Bientôt' : '';
    });
    const titre = $('[data-canal-titre]', el), libelle = (MARIANNE_CHANNELS[el.dataset.canal] || {}).label;
    if (titre && libelle) titre.textContent = libelle;
  });

  const dans = (cles, etat) => cles.filter(c => statut(c) === etat);
  // « au téléphone, sur WhatsApp et Messenger »
  const lister = (cles, noms, liaison) => {
    const p = cles.map((c, i) => (c === 'messenger' && cles[i - 1] === 'whatsapp' && noms.messenger.indexOf('sur ') === 0) ? 'Messenger' : noms[c]);
    return p.length < 2 ? p.join('') : p.slice(0, -1).join(', ') + ' ' + liaison + ' ' + p[p.length - 1];
  };
  const OU = { site: 'sur votre site', telephone: 'au téléphone', whatsapp: 'sur WhatsApp', messenger: 'sur Messenger' };
  const ecrire = (id, texte) => { const el = document.getElementById(id); if (el && texte) el.textContent = texte; };

  // Sous-titre du hero
  const ordre = ['site', 'telephone', 'whatsapp', 'messenger'];
  const dispo = dans(ordre, 'disponible'), bientot = dans(ordre, 'bientot');
  let liste = lister(dispo, OU, 'ou');
  if (bientot.length) liste += (liste ? ', et bientôt ' : 'bientôt ') + lister(bientot, OU, 'et');
  if (liste) ecrire('heroSous', 'Elle répond à chaque citoyen au nom de votre mairie, jour et nuit' + INSEC + ': ' + liste + '. Formée sur les données de votre commune, elle cite toujours ses sources.');

  // Etape 3 de l'installation
  const tous = ['site', 'qr', 'telephone', 'whatsapp', 'messenger'];
  const DEPUIS = { site: 'votre site', qr: 'un QR code en mairie', telephone: 'le téléphone', whatsapp: 'WhatsApp', messenger: 'Messenger' };
  const d2 = dans(tous, 'disponible'), b2 = dans(tous, 'bientot');
  let etape = d2.length ? 'Depuis ' + lister(d2, DEPUIS, 'ou') + '.' : '';
  if (b2.length) { const t = lister(b2, Object.assign({}, OU, { qr: 'par QR code' }), 'et'); etape += (etape ? ' ' : '') + 'Bientôt ' + t + '.'; }
  ecrire('howCanaux', etape);

  // Colonne « Pour le citoyen »
  const QUI = { site: 'sur le site', qr: 'par QR code en mairie', telephone: 'au téléphone', whatsapp: 'sur WhatsApp', messenger: 'sur Messenger' };
  let qui = lister(d2, QUI, 'ou');
  if (b2.length) qui += (qui ? ', et bientôt ' : 'bientôt ') + lister(b2, QUI, 'et');
  if (qui) ecrire('quiCanaux', qui.charAt(0).toUpperCase() + qui.slice(1));

  // Campagnes Citoyennes
  const wa = statut('whatsapp');
  ecrire('campCanaux', wa === 'disponible' ? 'Site, email et WhatsApp.' : wa === 'bientot' ? "Site et email aujourd'hui, WhatsApp bientôt." : 'Site et email.');

  // Comparatif, ligne « Multicanal »
  const multi = ['telephone', 'whatsapp', 'messenger'].filter(c => statut(c) !== 'masque');
  const cellule = document.getElementById('vsMulti');
  if (cellule) {
    cellule.innerHTML = multi.length && multi.every(c => statut(c) === 'disponible')
      ? '<span class="sym sym--oui" aria-hidden="true">✓</span><span class="sr">Inclus</span>'
      : '<span class="etat" data-etat="bientot">Bientôt</span>';
  }

  // Mention Meta : inutile si ni WhatsApp ni Messenger ne sont presentes
  if (statut('whatsapp') === 'masque' && statut('messenger') === 'masque') $$('[data-meta]').forEach(n => { n.hidden = true; });
  const piste = document.getElementById('canauxPiste');
  if (piste) piste.style.setProperty('--n', $$('.canal', piste).filter(c => c.dataset.etat !== 'masque').length);

  // Bandeau d'annonce
  const bandeau = document.getElementById('bandeau'), croix = document.getElementById('bandeauFermer');
  let ferme = false;
  try { ferme = localStorage.getItem('ci-news-wa') === '1'; } catch (e) {}
  const texteBandeau = document.getElementById('bandeauTexte');
  if (bandeau && croix && texteBandeau && wa !== 'masque' && !ferme) {
    texteBandeau.innerHTML = wa === 'disponible'
      ? 'Marianne répond maintenant sur <b>WhatsApp</b>'
      : 'Marianne arrive bientôt sur <b>WhatsApp</b>';
    bandeau.hidden = false; croix.hidden = false;
    requestAnimationFrame(() => racine.classList.add('a-bandeau'));
    croix.addEventListener('click', () => {
      racine.classList.remove('a-bandeau');
      setTimeout(() => { bandeau.hidden = true; croix.hidden = true; }, 500);
      try { localStorage.setItem('ci-news-wa', '1'); } catch (e) {}
    });
  }

  // FAQ : le JSON-LD est reconstruit depuis la FAQ visible, pour ne jamais diverger d'elle
  const ld = document.getElementById('faqJsonLd'), faq = document.getElementById('faqListe');
  if (ld && faq) {
    const texte = el => {
      const c = el.cloneNode(true);
      $$('[hidden]', c).forEach(n => n.remove());
      $$('[data-canal]', c).concat(c.matches('[data-canal]') ? [c] : []).forEach(n => {
        const e = statut(n.dataset.canal);
        $$('[data-si]', n).forEach(v => { if (v.dataset.si !== e) v.remove(); });
      });
      return c.textContent.replace(/\s+/g, ' ').trim();
    };
    const questions = $$('details', faq).filter(d => !d.hidden && !(d.dataset.canal && statut(d.dataset.canal) === 'masque')).map(d => ({
      '@type': 'Question',
      name: texte($('summary', d)),
      acceptedAnswer: { '@type': 'Answer', text: $$(':scope > div', d).filter(v => !v.dataset.si || v.dataset.si === statut(d.dataset.canal)).map(texte).join(' ') }
    }));
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: questions });
  }
});

/* =====================================================================
   2. Moteur de defilement : une progression lissee par section
   lerp a 0,08 dans une boucle requestAnimationFrame, arretee quand tout est stable
   ===================================================================== */
const pistes = [];
let boucleActive = false, dernierTemps = 0;
function boucle(t) {
  // 0,08 par image a 60 Hz ; le facteur suit la duree reelle de l'image (ecrans 120 Hz, images sautees)
  const dt = dernierTemps ? Math.min(64, t - dernierTemps) : 16.667;
  dernierTemps = t;
  const k = 1 - Math.pow(1 - 0.08, dt / 16.667);
  let bouge = false;
  for (const p of pistes) {
    if (!p.active) continue;
    const ecart = p.cible - p.valeur;
    try {
      if (Math.abs(ecart) < 0.001) {
        if (p.valeur !== p.cible) { p.valeur = p.cible; p.rendre(p.valeur); }
      } else {
        p.valeur += ecart * k;
        p.rendre(p.valeur);
        bouge = true;
      }
    } catch (erreur) { p.active = false; }   // la piste fautive s'arrete, les autres continuent
  }
  if (bouge) requestAnimationFrame(boucle); else { boucleActive = false; dernierTemps = 0; }
}
function lancer() {
  if (!boucleActive) { boucleActive = true; dernierTemps = 0; requestAnimationFrame(boucle); }
}
function mesurer() {
  for (const p of pistes) if (p.active) p.cible = p.mesure();
  lancer();
}
function piste(mesure, rendre, options) {
  const p = Object.assign({ mesure, rendre, valeur: 0, cible: 0, active: true }, options || {});
  pistes.push(p);
  return p;
}
addEventListener('scroll', mesurer, { passive: true });
addEventListener('resize', mesurer);

/* =====================================================================
   3. Hero « 22 h 47 »
   ===================================================================== */
securise(function hero() {
  const el = $('#hero'), scene = $('#heroScene');
  if (!el || !scene) return;
  const fil = $('#heroFil'), reponse = $('#heroReponse'), tel = $('#heroTel');
  const sTxt = $('#heroStatutTxt'), sH = $('#heroStatutH'), sBloc = $('#heroStatut');
  const art = $('.hero__art', el), video = $('#heroVideo');
  const texteComplet = reponse.textContent;

  /* --- decoupe d'une ligne en mots puis en lettres (le H1 garde son aria-label) --- */
  function decouper(ligne) {
    if (ligne.dataset.decoupe) return;
    ligne.dataset.decoupe = '1';
    let i = 0;
    (function parcourir(noeud) {
      Array.from(noeud.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/( )/).forEach(bloc => {
            if (bloc === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
            if (!bloc) return;
            const mot = document.createElement('span'); mot.className = 'mot';
            Array.from(bloc).forEach(car => {
              const ch = document.createElement('span'); ch.className = 'ch'; ch.style.setProperty('--i', i);
              const ci = document.createElement('span'); ci.className = 'ci'; ci.style.setProperty('--i', i);
              ci.textContent = car; ch.appendChild(ci); mot.appendChild(ch); i++;
            });
            frag.appendChild(mot);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) parcourir(n);
      });
    })(ligne);
  }

  /* --- reponse qui s'ecrit : la bulle garde sa taille finale, le texte se devoile --- */
  let ecrit, reste, lu, affiches = -1;
  function preparerEcriture() {
    if (ecrit) return;
    reponse.textContent = '';
    lu = document.createElement('span'); lu.className = 'sr'; lu.textContent = texteComplet;   // lecteurs d'ecran : texte entier
    const vu = document.createElement('span'); vu.setAttribute('aria-hidden', 'true');
    ecrit = document.createElement('span');
    reste = document.createElement('span'); reste.className = 'reste';
    vu.append(ecrit, reste);
    reponse.append(lu, vu);
  }
  function ecrire(part, texte) {
    const source = texte || texteComplet;
    const n = Math.round(source.length * borne(part, 0, 1));
    if (n === affiches && !texte) return;
    affiches = n;
    ecrit.textContent = source.slice(0, n);
    reste.textContent = source.slice(n);
  }

  /* --- horloge de la scene : 17:30 au depart, 22:47 a l'arrivee --- */
  let heureAffichee = '', etatAffiche = '';
  function horloge(p) {
    const minutes = 17 * 60 + 30 + Math.round(317 * borne((p - 0.12) / 0.38, 0, 1));
    const h = String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
    if (h !== heureAffichee) { heureAffichee = h; sH.textContent = h; }
    const etat = p >= 0.5 ? 'ouvert' : 'ferme';
    if (etat !== etatAffiche) {
      etatAffiche = etat; sBloc.dataset.etat = etat;
      sTxt.textContent = etat === 'ouvert' ? 'Marianne en ligne' : 'Mairie fermée';
    }
  }

  /* --- video scrubbee (facultative) : currentTime = progression x duree, sans empiler les seeks --- */
  let videoPrete = false, abandonnerVideo = () => {}, debutSeek = 0;
  function chargerVideo() {
    if (!art || art.dataset.video !== '1' || !video || video.dataset.charge) return;
    video.dataset.charge = '1';
    [['mp4', 'video/mp4'], ['webm', 'video/webm']].forEach(([cle, type]) => {
      const s = document.createElement('source'); s.src = video.dataset[cle]; s.type = type; video.appendChild(s);
    });
    video.preload = 'auto';
    const lum = $('.hero__lumieres', el);
    video.addEventListener('canplaythrough', () => {
      if (video.error) return;
      videoPrete = true; video.classList.add('prete');
      if (lum) lum.hidden = true;   // les lumieres appartiennent a la gravure
      if (p0) p0.rendre(p0.valeur);
    }, { once: true });
    // Video illisible ou decodage en panne : on revient aux deux images, la scene continue
    abandonnerVideo = () => {
      videoPrete = false; video.classList.remove('prete');
      if (lum) lum.hidden = false;
    };
    video.addEventListener('error', abandonnerVideo);
    video.load();
  }

  /* --- defilement pilote --- */
  let p0 = null, souris = null;
  function activer() {
    $$('.hero__l', el).forEach(decouper);
    preparerEcriture();
    p0 = piste(
      () => { const r = el.getBoundingClientRect(); return borne(-r.top / Math.max(1, r.height - innerHeight), 0, 1); },
      p => {
        el.style.setProperty('--p', p.toFixed(4));
        horloge(p);
        ecrire((p - 0.705) / 0.1);
        el.classList.toggle('hero--fin', p > 0.86);
        if (videoPrete && video.duration) {
          if (video.error) abandonnerVideo();
          else if (!video.seeking) {
            const t = borne((p - 0.14) / 0.38, 0, 1) * video.duration;
            if (Math.abs(video.currentTime - t) > 0.02) { video.currentTime = t; debutSeek = performance.now(); }
          } else if (performance.now() - debutSeek > 2000) abandonnerVideo();   // seek bloque : on n'attend pas
        }
      });
    p0.valeur = p0.cible = p0.mesure();
    p0.rendre(p0.valeur);
    el.classList.add('pret');

    // parallaxe leger a la souris (ecrans avec pointeur fin uniquement)
    if (art && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      souris = { x: 0, y: 0, cx: 0, cy: 0 };
      const ps = piste(() => 1, () => {
        souris.cx += (souris.x - souris.cx) * 0.08; souris.cy += (souris.y - souris.cy) * 0.08;
        art.style.setProperty('--mx', souris.cx.toFixed(3)); art.style.setProperty('--my', souris.cy.toFixed(3));
      });
      ps.valeur = 1;
      scene.addEventListener('mousemove', e => {
        souris.x = (e.clientX / innerWidth - 0.5) * 2; souris.y = (e.clientY / innerHeight - 0.5) * 2;
        ps.valeur = 0; ps.cible = 1;   // relance la boucle le temps de rejoindre la souris
        lancer();
      });
    }

    // clavier : un element de la fin de scene qui prend le focus doit etre visible
    const finDeScene = () => el.getBoundingClientRect().top + scrollY + el.offsetHeight - innerHeight;
    $('#heroFin').addEventListener('focusin', () => {
      if (p0.active && p0.valeur < 0.95) { scrollTo({ top: finDeScene(), behavior: 'instant' }); p0.valeur = p0.cible = 1; p0.rendre(1); }
    });
    const passer = $('#heroPasser');
    if (passer) passer.addEventListener('click', e => {
      e.preventDefault();
      scrollTo({ top: finDeScene(), behavior: 'smooth' });
      const premier = $('#heroFin a'); if (premier) premier.focus({ preventScroll: true });
    });

    if (document.readyState === 'complete') chargerVideo(); else addEventListener('load', chargerVideo);
  }

  /* --- hors defilement pilote : la conversation se joue quand le telephone arrive a l'ecran --- */
  const SCENES = [
    { q: 'Bonsoir, comment inscrire mon fils à la cantine pour septembre' + INSEC + '?', r: texteComplet, s: 'site de la mairie, page Périscolaire' },
    { q: 'Je peux tondre ma pelouse le dimanche' + INSEC + '?', r: 'Oui, de 10' + INSEC + 'h à 12' + INSEC + 'h seulement, le dimanche et les jours fériés.', s: 'arrêté municipal n°' + INSEC + '2026-014' },
    { q: 'Quand passent les encombrants' + INSEC + '?', r: 'Le premier jeudi du mois, sur inscription en mairie. Trois objets au maximum.', s: 'calendrier des déchets' },
    { q: 'La mairie est ouverte samedi' + INSEC + '?', r: 'Non, la mairie n\'ouvre que du lundi au vendredi, de 9' + INSEC + 'h à 12' + INSEC + 'h et de 14' + INSEC + 'h à 17' + INSEC + 'h' + INSEC + '30. Vous pouvez faire votre demande en ligne dès maintenant.', s: 'site de la mairie, page Horaires' }
  ];
  let lecture = null;
  function jouer() {
    const [moi, elle] = $$('.msg', fil);
    const bulleMoi = $('.bulle', moi), src = $('.source', elle);
    const libelle = src.lastChild;
    preparerEcriture();
    ecrire(1);
    tel.classList.add('tel--joue');
    let visible = false, enPause = false, index = 0, minuterie = [];
    const pause = $('#telPause');
    const apres = (ms, f) => minuterie.push(setTimeout(f, ms));
    const arret = () => { minuterie.forEach(clearTimeout); minuterie = []; };
    function scene1() {
      const sc = SCENES[index % SCENES.length];
      moi.classList.remove('vu'); elle.classList.remove('vu', 'cite', 'ecrit');
      apres(450, () => { bulleMoi.textContent = sc.q; libelle.textContent = 'Source' + INSEC + ': ' + sc.s; lu.textContent = sc.r; affiches = -1; ecrire(0, sc.r); moi.classList.add('vu'); });
      apres(1300, () => elle.classList.add('vu', 'ecrit'));
      apres(2400, () => {
        elle.classList.remove('ecrit');
        const debut = performance.now(), duree = 900 + sc.r.length * 14;
        (function taper(t) {
          const part = borne((t - debut) / duree, 0, 1);
          affiches = -1; ecrire(part, sc.r);
          if (part < 1 && visible) requestAnimationFrame(taper);
          else if (part >= 1) { elle.classList.add('cite'); apres(4200, () => { index++; if (visible) scene1(); }); }
        })(debut);
      });
    }
    const io = new IntersectionObserver(entrees => {
      const vu = entrees[0].isIntersecting;
      if (vu && !visible && !enPause) { visible = true; scene1(); }
      else if (!vu && visible) { visible = false; arret(); }
    }, { threshold: 0.35 });
    io.observe(tel);
    const figer = () => {   // la scene en cours, entiere et immobile
      const sc = SCENES[index % SCENES.length];
      visible = false; arret();
      bulleMoi.textContent = sc.q; libelle.textContent = 'Source' + INSEC + ': ' + sc.s; lu.textContent = sc.r;
      moi.classList.add('vu'); elle.classList.add('vu', 'cite'); elle.classList.remove('ecrit');
      affiches = -1; ecrire(1, sc.r);
    };
    if (pause) {
      pause.classList.add('utile');
      pause.addEventListener('click', () => {
        enPause = !enPause;
        pause.setAttribute('aria-pressed', String(enPause));
        pause.textContent = enPause ? 'Relancer la conversation' : 'Mettre la conversation en pause';
        if (enPause) figer(); else { index++; visible = true; scene1(); }
      });
    }
    lecture = {
      arreter() {   // retour a la conversation d'origine, entiere et visible
        io.disconnect(); visible = false; arret();
        if (pause) pause.classList.remove('utile');
        tel.classList.remove('tel--joue');
        moi.classList.add('vu'); elle.classList.add('vu', 'cite'); elle.classList.remove('ecrit');
        bulleMoi.textContent = SCENES[0].q; libelle.textContent = 'Source' + INSEC + ': ' + SCENES[0].s; lu.textContent = texteComplet;
        affiches = -1; ecrire(1);
      }
    };
  }

  // Le mode est decide dans le <head> avant le premier rendu ; on le revalide ici, fenetre mesuree.
  // Si la fenetre change de categorie (rotation, redimensionnement), on bascule sans recharger :
  // un formulaire en cours de saisie n'est jamais perdu.
  const mq = matchMedia('(min-width:900px) and (min-height:560px) and (prefers-reduced-motion:no-preference)');
  function basculer() {
    const coupe = racine.classList.contains('anim-non');   // animations arretees par le visiteur
    const anime = mq.matches && !coupe;
    racine.classList.toggle('scrub', anime);
    if (coupe && lecture) { lecture.arreter(); lecture = null; }
    if (anime) {
      if (lecture) { lecture.arreter(); lecture = null; }
      if (!p0) activer(); else { p0.active = true; p0.valeur = p0.cible = p0.mesure(); p0.rendre(p0.valeur); }
    } else if (p0) {
      p0.active = false;
      el.style.setProperty('--p', 1); horloge(1); affiches = -1; ecrire(1); el.classList.add('hero--fin');
    } else if (!mouvementReduit && !coupe && !lecture) jouer();
  }
  basculer();
  document.addEventListener('marianne:statique', basculer);
  if (mq.addEventListener) mq.addEventListener('change', basculer); else if (mq.addListener) mq.addListener(basculer);
});

/* =====================================================================
   4. Navigation : compacte au defilement, menu mobile, section courante, horloge
   ===================================================================== */
securise(function navigation() {
  const nav = $('#nav'), burger = $('#navBurger'), menu = $('#navMobile');
  const compacter = () => nav.classList.toggle('nav--compacte', scrollY > 40);
  addEventListener('scroll', compacter, { passive: true }); requestAnimationFrame(compacter);

  const fermer = () => { menu.classList.remove('ouvert'); burger.setAttribute('aria-expanded', 'false'); };
  burger.addEventListener('click', () => burger.setAttribute('aria-expanded', String(menu.classList.toggle('ouvert'))));
  $$('a', menu).forEach(a => a.addEventListener('click', fermer));
  document.addEventListener('click', e => { if (!burger.contains(e.target) && !menu.contains(e.target)) fermer(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('ouvert')) { fermer(); burger.focus(); } });

  // Section courante : toutes les sections sont observees, pour que le lien s'eteigne hors des sections du menu
  const liens = $$('.nav__liens a');
  if ('IntersectionObserver' in window) {
    const espion = new IntersectionObserver(entrees => entrees.forEach(e => {
      if (e.isIntersecting) liens.forEach(l => {
        if (l.getAttribute('href') === '#' + e.target.id) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
      });
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(c => espion.observe(c));
  }

  const hNav = $('#navHeure'), hFin = $('#finHeure');
  function heure() {
    const d = new Date(), hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
    if (hNav) hNav.textContent = hh + ':' + mm;
    if (hFin) hFin.textContent = d.toLocaleDateString('fr-FR', { weekday: 'long' }) + ', ' + hh + INSEC + 'h' + INSEC + mm;
  }
  heure(); setInterval(heure, 30000);
});

/* =====================================================================
   5. Sections animees : connaissance, canaux, installation, chiffres, apparitions
   ===================================================================== */
securise(function sections() {
  const anime = !mouvementReduit;
  const grand = matchMedia('(min-width:900px)').matches;
  // Une piste ne mesure et ne rend que lorsque sa section approche de l'ecran
  const surveiller = (element, p, auReveil) => {
    const zone = element.closest('section') || element;
    p.active = false;
    new IntersectionObserver(entrees => {
      if (p.coupee) return;
      const proche = entrees[0].isIntersecting;
      if (proche && auReveil) { auReveil(); auReveil = null; }
      p.active = proche;
      if (proche) { p.cible = p.mesure(); lancer(); }
    }, { rootMargin: '60% 0px' }).observe(zone);
    return p;
  };

  // 6.2 Les documents convergent vers le medaillon
  const savoir = $('#savoirScene');
  if (savoir && anime && grand) {
    surveiller(savoir, piste(
      () => { const r = savoir.getBoundingClientRect(); return borne((innerHeight * 0.95 - r.top) / (innerHeight * 0.6), 0, 1); },
      v => savoir.style.setProperty('--e', doux(v).toFixed(4)), { fin: () => savoir.style.setProperty('--e', 1) }));
  } else if (savoir) savoir.style.setProperty('--e', 1);

  // 6.4 Les traits lumineux relient le medaillon a chaque canal, un par un
  const zone = $('#canauxZone'), svg = $('#canauxTraits'), hub = $('#canauxHub');
  if (zone) {
    const cartes = $$('.canal', zone).filter(c => c.dataset.etat !== 'masque');
    const large = matchMedia('(min-width:1180px)');
    let traits = [];
    function tracer() {
      $$('path', svg).forEach(p => p.remove());
      traits = [];
      if (!large.matches) return;
      const z = zone.getBoundingClientRect(), h = hub.getBoundingClientRect();
      const x0 = h.left + h.width / 2 - z.left, y0 = h.bottom - z.top + 8;
      const deg = $('#degTrait');   // degrade en coordonnees reelles : un trait vertical reste peint
      if (deg && cartes.length) { deg.setAttribute('y1', y0); deg.setAttribute('y2', cartes[0].getBoundingClientRect().top - z.top); }
      cartes.forEach(c => {
        const r = c.getBoundingClientRect(), x1 = r.left + r.width / 2 - z.left, y1 = r.top - z.top;
        const dy = y1 - y0, chemin = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        chemin.setAttribute('d', `M${x0} ${y0} C${x0} ${y0 + dy * 0.6} ${x1} ${y1 - dy * 0.75} ${x1} ${y1}`);
        svg.appendChild(chemin);
        const longueur = chemin.getTotalLength();
        chemin.style.strokeDasharray = longueur; chemin.style.strokeDashoffset = longueur;
        traits.push({ chemin, longueur });
      });
    }
    if (anime && large.matches) {
      const pc = piste(
        () => { const r = zone.getBoundingClientRect(); return borne((innerHeight * 0.82 - r.top) / (innerHeight * 0.62), 0, 1); },
        v => cartes.forEach((c, i) => {
          const t = borne((v - i * 0.13) / 0.34, 0, 1);
          if (traits[i]) traits[i].chemin.style.strokeDashoffset = traits[i].longueur * (1 - doux(t));
          c.classList.toggle('allume', t > 0.9);
        }), { fin: () => { if (!traits.length) tracer(); cartes.forEach(c => c.classList.add('allume')); traits.forEach(t => { t.chemin.style.strokeDashoffset = 0; }); } });
      surveiller(zone, pc, tracer);   // les traits sont calcules quand la section approche, pas au chargement
      let attente;
      addEventListener('resize', () => { clearTimeout(attente); attente = setTimeout(() => { if (pc.active) { tracer(); pc.rendre(pc.valeur); } }, 150); });
    } else {
      // mouvement reduit ou ecran etroit : tout est allume d'emblee, les traits (grand ecran) sont traces sans animation
      cartes.forEach(c => c.classList.add('allume'));
      const fixe = () => { tracer(); traits.forEach(t => { t.chemin.style.strokeDashoffset = 0; }); };
      let proche = false, attente;
      new IntersectionObserver(e => { proche = e[0].isIntersecting; if (proche) fixe(); }, { rootMargin: '60% 0px' }).observe(zone.closest('section') || zone);
      addEventListener('resize', () => { clearTimeout(attente); attente = setTimeout(() => { if (proche) fixe(); }, 150); });
    }
    // carrousel (ecrans etroits) : fleches et clavier
    const pisteEl = $('#canauxPiste');
    const pas = sens => { if (cartes.length) pisteEl.scrollBy({ left: sens * (cartes[0].getBoundingClientRect().width + 16), behavior: mouvementReduit ? 'auto' : 'smooth' }); };
    // la liste n'est un arret de tabulation que lorsqu'elle defile (carrousel des ecrans etroits)
    const focalisable = () => { if (pisteEl.scrollWidth > pisteEl.clientWidth + 2) pisteEl.tabIndex = 0; else pisteEl.removeAttribute('tabindex'); };
    new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { focalisable(); o.disconnect(); } }, { rootMargin: '60% 0px' }).observe(zone);
    addEventListener('resize', focalisable);
    $('#canauxPrec').addEventListener('click', () => pas(-1));
    $('#canauxSuiv').addEventListener('click', () => pas(1));
    pisteEl.addEventListener('keydown', e => {
      if (e.target !== pisteEl) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); pas(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); pas(-1); }
    });
  }

  // 6.5 La frise se trace, les etapes s'allument
  const frise = $('#frise');
  if (frise) {
    const etapes = $$('.etape', frise);
    if (anime && grand) {
      surveiller(frise, piste(
        () => { const r = frise.getBoundingClientRect(); return borne((innerHeight * 0.85 - r.top) / (innerHeight * 0.55), 0, 1); },
        v => { frise.style.setProperty('--p', v.toFixed(4)); etapes.forEach((e, i) => e.classList.toggle('passee', v >= i / 3 + 0.03)); },
        { fin: () => { frise.style.setProperty('--p', 1); etapes.forEach(e => e.classList.add('passee')); } }));
    } else { frise.style.setProperty('--p', 1); etapes.forEach(e => e.classList.add('passee')); }
  }

  // 6.8 Les chiffres comptent une seule fois
  const chiffres = $$('[data-compte]');
  if (chiffres.length && anime && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entrees => entrees.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const fin = +e.target.dataset.compte, suffixe = e.target.dataset.suffixe || '', debut = performance.now();
      (function compter(t) {
        const part = borne((t - debut) / 1400, 0, 1);
        e.target.textContent = Math.round(fin * doux(part)) + suffixe;
        if (part < 1) requestAnimationFrame(compter);
      })(debut);
    }), { threshold: 0.6 });
    chiffres.forEach(c => io.observe(c));
  }

  // Apparitions douces (tarifs, profils)
  const rv = $$('.rv');
  if (anime && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entrees => entrees.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); } }), { threshold: 0.12 });
    rv.forEach(r => io.observe(r));
  } else rv.forEach(r => r.classList.add('vu'));

  // Le visiteur arrete les animations : tout passe a l'etat final, sans rechargement
  document.addEventListener('marianne:statique', () => {
    pistes.forEach(p => { if (p.fin) { p.active = false; p.coupee = true; p.fin(); } });
    $$('.rv').forEach(r => r.classList.add('vu'));
  });

  mesurer();
});

/* =====================================================================
   6. Sources : l'apercu du document s'ouvre au survol, au focus ou au clic
   ===================================================================== */
securise(function sources() {
  const survol = matchMedia('(hover: hover) and (pointer: fine)').matches;
  $$('.source--btn').forEach(bouton => {
    const apercu = document.getElementById(bouton.getAttribute('aria-controls')), carte = bouton.closest('.preuve');
    if (!apercu || !carte) return;
    let epingle = false;
    const ouvrir = oui => { apercu.classList.toggle('ouvert', oui); bouton.setAttribute('aria-expanded', String(oui)); };
    bouton.addEventListener('click', () => { epingle = !epingle; ouvrir(epingle); });
    bouton.addEventListener('focus', () => ouvrir(true));
    bouton.addEventListener('blur', () => { if (!epingle) ouvrir(false); });
    bouton.addEventListener('keydown', e => { if (e.key === 'Escape') { epingle = false; ouvrir(false); } });
    if (survol) {
      carte.addEventListener('mouseenter', () => ouvrir(true));
      carte.addEventListener('mouseleave', () => { if (!epingle && document.activeElement !== bouton) ouvrir(false); });
    }
  });
});

/* =====================================================================
   7. Demo : cinq questions, une reponse sourcee (commune de demonstration)
   ===================================================================== */
securise(function demo() {
  const QA = {
    1: { q: "Quels sont les horaires de la déchèterie\u00A0?", a: "La déchèterie intercommunale est ouverte <strong>du mardi au samedi, 9h–12h et 14h–18h</strong> (fermeture à 17h le samedi). Accès gratuit avec le badge communal, à retirer en mairie.", src: "Règlement intérieur SICTOM, art. 3" },
    2: { q: "J'ai perdu ma carte d'identité, que dois-je faire\u00A0?", a: "Vous devez effectuer une <strong>déclaration de perte</strong> au moment du dépôt de la nouvelle demande de CNI, directement en mairie (sans passer par la police). Pensez à prendre un justificatif de domicile de moins de 3 mois, un timbre fiscal de 25\u00A0€ et une photo d'identité récente.", src: "Service-Public.fr, carte nationale d'identité" },
    3: { q: "Je voudrais abattre un chêne dans mon jardin, dois-je demander une autorisation\u00A0?", a: "Oui\u00A0: tout abattage d'arbre de <strong>plus de 20 cm de diamètre</strong> à 1,30 m du sol nécessite une <strong>déclaration préalable</strong> en mairie. Le chêne est par ailleurs protégé dans les zones A et N du PLU\u00A0: merci de vérifier votre zonage avant tout travaux.", src: "PLU, article UB 13" },
    4: { q: "Comment inscrire mon enfant à la cantine pour la rentrée de septembre\u00A0?", a: "Les inscriptions se font sur le <strong>portail famille jusqu'au 10 août</strong>. Il vous faut un justificatif de domicile et l'attestation CAF.", src: "Site de la mairie, page Périscolaire" },
    5: { q: "Un lampadaire est en panne rue du Moulin, qui dois-je prévenir\u00A0?", a: "Je note votre signalement\u00A0: <strong>éclairage public en panne rue du Moulin</strong>. Une intervention sera programmée sous 72h par le service technique. Voulez-vous communiquer un numéro plus précis (point lumineux)\u00A0?", src: "Signalement voirie, n° SIG-2026-041" }
  };
  const ICONE = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>';
  const puces = $$('#demoPuces .puce'), fil = $('#demoFil');
  if (!fil) return;
  let minuterie;
  function afficher(id) {
    const d = QA[id];
    clearTimeout(minuterie);
    fil.innerHTML = '<li class="msg msg--moi"><div class="bulle"></div></li><li class="msg msg--m"><span class="saisie" style="display:flex;position:static" aria-hidden="true"><i></i><i></i><i></i></span></li>';
    $('.bulle', fil).textContent = d.q;
    // Temps de reflexion d'environ une seconde (standard du chat Marianne, DESIGN.md 7-bis)
    minuterie = setTimeout(() => {
      fil.lastElementChild.remove();
      const li = document.createElement('li'); li.className = 'msg msg--m';
      li.innerHTML = '<div class="bulle">' + d.a + '<span class="source">' + ICONE + 'Source' + INSEC + ': ' + d.src + '</span></div>';
      fil.appendChild(li);
    }, mouvementReduit ? 0 : 1000);
  }
  puces.forEach(p => p.addEventListener('click', () => {
    puces.forEach(x => x.setAttribute('aria-pressed', String(x === p)));
    afficher(p.dataset.q);
  }));
});

/* =====================================================================
   8. Formulaires (traitement inchange : Formspree + dataLayer)
   ===================================================================== */
function sendToGoogleSheet(data) {
  // Best-effort silencieux (endpoint optionnel, Formspree reste la source principale)
  const endpoint = window.GSHEET_ENDPOINT || '';
  if (!endpoint) return;
  try { fetch(endpoint, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(data) }); } catch (e) {}
}

function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Envoi en cours…';
  submitBtn.disabled = true;

  // GA4 / GTM conversion
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'generate_lead',
    lead_source: 'contact_form',
    lead_poste: fd.get('poste') || '',
    lead_city: fd.get('city') || '',
    lead_population: fd.get('population') || ''
  });

  sendToGoogleSheet({
    nom: fd.get('lastname'), prenom: fd.get('firstname'),
    poste: fd.get('poste'), email: fd.get('email'),
    phone: fd.get('phone'), city: fd.get('city'),
    population: fd.get('population'), message: fd.get('message'),
    source: 'contact'
  });

  fetch(form.action, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
    .then(r => {
      if (r.ok) {
        form.style.display = 'none';
        const ok = document.getElementById('formSuccess');
        form.parentNode.insertBefore(ok, form);
        ok.style.display = 'block';
        ok.tabIndex = -1; ok.focus();
      } else {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        alert('Une erreur est survenue. Merci de nous contacter à contact@civik-ia.fr');
      }
    })
    .catch(() => {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      alert('Erreur de connexion. Merci de nous contacter à contact@civik-ia.fr');
    });
}

function handleParrainageSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Envoi en cours…';
  submitBtn.disabled = true;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'generate_lead',
    lead_source: 'parrainage_form',
    lead_city: fd.get('filleul_commune') || ''
  });

  sendToGoogleSheet({
    name: (fd.get('parrain_commune') || '') + ' → ' + (fd.get('filleul_commune') || ''),
    email: fd.get('parrain_email'),
    city: fd.get('filleul_commune'),
    message: 'PARRAINAGE / Parrain : ' + (fd.get('parrain_nom') || '') + ' / Contact filleul : ' + (fd.get('filleul_contact') || ''),
    source: 'parrainage'
  });

  fetch(form.action, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
    .then(r => {
      if (r.ok) {
        form.style.display = 'none';
        const ok = document.getElementById('parrainageSuccess');
        form.parentNode.insertBefore(ok, form);
        ok.style.display = 'block';
        ok.tabIndex = -1; ok.focus();
      } else {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        alert('Une erreur est survenue. Merci de nous contacter à contact@civik-ia.fr');
      }
    })
    .catch(() => {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      alert('Erreur de connexion. Merci de nous contacter à contact@civik-ia.fr');
    });
}

/* form_start : premiere interaction reelle avec un formulaire de conversion.
   Une seule fois par formulaire et par chargement de page. Sans cet evenement,
   un zero de generate_lead ne dit pas si le visiteur a commence puis abandonne,
   ou n'a jamais commence. Meme parametre lead_source que generate_lead. */
securise(function () {
  [{ id: 'contactForm', source: 'contact_form' }, { id: 'parrainageForm', source: 'parrainage_form' }].forEach(function (f) {
    var el = document.getElementById(f.id);
    if (!el) return;
    var fired = false;
    el.addEventListener('input', function () {
      if (fired) return;
      fired = true;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'form_start', form_id: f.id, lead_source: f.source });
    }, true);
  });
});

/* =====================================================================
   9. Assistant du site (questions commerciales sur Civik-ia)
   ===================================================================== */
const cbKnowledge = [
  { keywords: ['aide', 'aider', 'bonjour', 'hello', 'salut', 'hey'], response: "Bonjour\u00A0! Je suis l'assistant du site Civik-ia. Je peux vous renseigner sur la <strong>Plateforme d'Intelligence Citoyenne</strong>, vous orienter vers la démo, ou répondre à vos questions sur nos offres." },
  { keywords: ['démo', 'demo', 'démonstration', 'essayer', 'tester'], response: "Testez la <a href='/demo.html'>démo interactive</a> avec une commune fictive, ou remplissez le <a href='#contact' onclick=\"toggleChatbot();return true;\">formulaire de contact</a> pour une démo personnalisée sur votre propre commune." },
  { keywords: ['contact', 'joindre', 'appeler', 'email', 'téléphone', 'rdv', 'rendez-vous'], response: "Remplissez le <a href='#contact' onclick=\"toggleChatbot();return true;\">formulaire</a>, écrivez à <strong>contact@civik-ia.fr</strong>, ou passez par WhatsApp (lien en pied de page). Réponse sous 24h." },
  { keywords: ['prix', 'tarif', 'coût', 'combien', 'budget'], response: "<strong>Programme Partenaires Fondateurs</strong> (10 places communes + 3 EPCI)\u00A0: pilote symbolique <strong>9,99\u00A0€/mois pendant 3 mois</strong>, puis tarif normal garanti 3 ans (49\u00A0€ Essentiel / 99\u00A0€ Engagement / 199\u00A0€ Pilotage). Setup offert (sinon 999\u00A0€). <a href='#pricing' onclick=\"toggleChatbot();return true;\">Voir les tarifs</a>." },
  { keywords: ['pic', 'plateforme', 'intelligence', 'citoyenne', 'cest quoi', 'quoi', 'quest'], response: "La <strong>Plateforme d&#39;Intelligence Citoyenne</strong> est un assistant IA souverain qui répond 24h/24 aux questions des citoyens, fournit un dashboard aux élus, et permet les <strong>Campagnes Citoyennes</strong> et <strong>Alertes Intelligentes</strong>." },
  { keywords: ['sécurité', 'securite', 'rgpd', 'données', 'donnees', 'souverain', 'france', 'français', 'europe'], response: "Le cerveau de Marianne est européen\u00A0: hébergement <strong>OVHcloud</strong> en Europe, IA <strong>Mistral AI</strong> (Paris), <strong>RGPD</strong> natif. Les données de votre commune ne servent jamais à entraîner d'autres modèles." },
  { keywords: ['déploiement', 'deploiement', 'deploie', 'déployer', 'deployer', 'délai', 'installation', 'combien de temps', 'temps', 'durée', 'mise en place'], response: "<strong>7 jours en moyenne</strong> pour déployer. On cadre le projet, on entraîne votre IA sur vos documents, on met en ligne votre page Marianne. Sous le seuil des marchés publics." },
  { keywords: ['agent', 'emploi', 'poste', 'remplacer', 'personnel', 'supprime'], response: "Civik-ia <strong>ne remplace aucun agent</strong>. Elle prend en charge les questions répétitives (70 à 80\u00A0% des demandes). Les agents se recentrent sur l'accueil humain." },
  { keywords: ['campagne', 'sondage', 'avis', 'consultation', 'citoyenne'], response: "Les <strong>Campagnes Citoyennes</strong> permettent de consulter vos habitants en temps réel (sondages, votes, enquêtes). Incluses\u00A0: 2/an (Essentiel), 4/an (Engagement), 6/an (Pilotage)." },
  { keywords: ['parrainage', 'recommander', 'ambassadeur'], response: "Le <strong>programme Ambassadeur</strong> récompense les communes qui recommandent Civik-ia\u00A0: 1 à 4 mois offerts progressifs. <a href='#parrainage' onclick=\"toggleChatbot();return true;\">Découvrir</a>." },
  { keywords: ['site internet', 'site web', 'pas de site', 'créer un site', 'creer un site'], response: "Pas de site, ou un site qui n'est plus à jour\u00A0? Nous pouvons vous en créer un, avec Marianne dès le premier jour. <a href='#contact' onclick=\"toggleChatbot();return true;\">Parlons-en</a>." }
];
const cbSugList = ["Tester la démo", "Les tarifs\u00A0?", "Contacter l'équipe", "C'est quoi la Plateforme\u00A0?", "Comment ça se déploie\u00A0?"];

let chatbotOpen = false;
let cbInitialized = false;

function toggleChatbot() {
  chatbotOpen = !chatbotOpen;
  const win = document.getElementById('chatbotWindow');
  const fab = document.getElementById('chatbotFab');
  win.classList.toggle('open', chatbotOpen);
  win.setAttribute('aria-hidden', chatbotOpen ? 'false' : 'true');
  fab.setAttribute('aria-expanded', chatbotOpen ? 'true' : 'false');
  fab.setAttribute('aria-label', chatbotOpen ? "Fermer l'assistant Civik-ia" : "Ouvrir l'assistant Civik-ia");
  if (chatbotOpen && !cbInitialized) { cbInitialized = true; initChatbot(); }
  if (chatbotOpen) document.getElementById('cbInput').focus(); else fab.focus();
}

function initChatbot() {
  addCbMessage("Bonjour ! Je suis l'assistant Civik-ia. Je peux vous renseigner sur la Plateforme, les tarifs, une démo, ou vous orienter vers nos contacts.", 'bot');
  const sug = document.getElementById('cbSuggestions');
  cbSugList.forEach(s => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cb-sug';
    b.textContent = s;
    b.onclick = () => { document.getElementById('cbInput').value = s; sendCbMessage(); };
    sug.appendChild(b);
  });
  const input = document.getElementById('cbInput');
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendCbMessage(); });
  document.getElementById('chatbotWindow').addEventListener('keydown', e => { if (e.key === 'Escape' && chatbotOpen) toggleChatbot(); });
}

function addCbMessage(html, type) {
  const container = document.getElementById('cbMessages');
  const div = document.createElement('div');
  div.className = 'cb-msg ' + type;
  if (type === 'user') div.textContent = html; else div.innerHTML = html;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function findCbAnswer(q) {
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const nq = norm(q);
  let best = null, bestScore = 0;
  for (const e of cbKnowledge) {
    let score = 0;
    for (const k of e.keywords) {
      const nk = norm(k);
      if (nq.includes(nk)) score += nk.length;
    }
    if (score > bestScore) { bestScore = score; best = e; }
  }
  if (best && bestScore >= 3) return best.response;
  return "Je n'ai pas la réponse exacte. Remplissez le <a href='#contact' onclick=\"toggleChatbot();return true;\">formulaire de contact</a> ou écrivez à <strong>contact@civik-ia.fr</strong> : nous répondons sous 24h.";
}

function sendCbMessage() {
  const input = document.getElementById('cbInput');
  const text = input.value.trim();
  if (!text) return;
  addCbMessage(text, 'user');
  input.value = '';
  setTimeout(() => addCbMessage(findCbAnswer(text), 'bot'), 350);
}

/* La bulle de l'assistant n'apparait qu'une fois le hero passe : elle ne couvre pas la scene */
securise(function () {
  const fab = document.getElementById('chatbotFab'), hero = document.getElementById('hero');
  if (!fab || !hero) return;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(e => fab.classList.toggle('visible', !e[0].isIntersecting)).observe(hero);
  } else fab.classList.add('visible');
});

/* =====================================================================
   10. Arreter les animations (RGAA 13.8) : lien d'evitement et pied de page
   Le choix est memorise ; « Relancer » l'efface et recharge la page.
   ===================================================================== */
securise(function animations() {
  const boutons = [document.getElementById('couperAnim'), document.getElementById('couperAnim2')].filter(Boolean);
  const libeller = () => boutons.forEach(b => { b.textContent = racine.classList.contains('anim-non') ? 'Relancer les animations' : 'Arrêter les animations'; });
  libeller();
  boutons.forEach(b => b.addEventListener('click', () => {
    if (racine.classList.contains('anim-non')) {
      try { localStorage.removeItem('marianne-anim'); } catch (e) {}
      location.reload();
      return;
    }
    try { localStorage.setItem('marianne-anim', 'non'); } catch (e) {}
    racine.classList.add('anim-non');
    document.dispatchEvent(new Event('marianne:statique'));
    libeller();
  }));
});
