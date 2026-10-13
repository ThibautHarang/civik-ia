/* =====================================================================
   Les mains, toujours dessinées à la plume. Deux façons de les poser :
   - par leur plaque (main gauche au téléphone, main droite à la feuille) :
     la plaque de l'image tombe exactement sur le quadrilatère de l'objet ;
   - par un point d'ancrage (pointe du crayon, pince, coin soulevé) :
     l'image est posée par une similitude (position, angle, échelle).
   La main est au-dessus de l'objet qu'elle tient ; son ombre de contact
   (la silhouette de la main, floutée, décalée vers le bas à droite) tombe
   sur l'objet seulement, découpée à son quadrilatère.
   ===================================================================== */
import { quadVersQuad, mult3, m3d, setT, setO, setV } from './outils.js';
import { reperesPx } from './visuels.js';

/* Sixième passe, F14 : dans main-souleve.webp, l'index est maigre et coupé net : son bord gauche est un trait
   droit (la moitié du doigt était cachée par la feuille du dessin d'origine). On redessine ce bord à la plume : le
   doigt s'élargit d'une courbe naturelle, de la pointe jusqu'au creux du pouce ; le trait droit est recouvert de peau ;
   quelques hachures d'ombre suivent le nouveau bord. Repères relevés sur l'image 1024 x 1024. */
function completerIndex(v) {
  try {
    const k = v.w / 1024, c = document.createElement('canvas'); c.width = v.w; c.height = v.h;
    const g = c.getContext('2d'); g.drawImage(v.image, 0, 0); g.scale(k, k);
    const bord = () => { g.moveTo(566, 276); g.bezierCurveTo(548, 276, 534, 290, 530, 318); g.bezierCurveTo(526, 350, 525, 400, 528, 440); g.bezierCurveTo(530, 476, 522, 500, 505, 517); };
    /* la peau : du nouveau bord jusqu'au-delà de l'ancien trait */
    g.beginPath(); bord(); g.lineTo(560, 517); g.lineTo(560, 290); g.lineTo(566, 280); g.closePath(); g.fillStyle = '#fcfaf3'; g.fill();
    /* l'ombre du côté gauche, quelques hachures qui suivent le bord */
    g.strokeStyle = 'rgba(28,36,98,.55)'; g.lineCap = 'round';
    for (let y = 300, i = 0; y < 470; y += 7, i++) { g.lineWidth = 1.1 + (i % 3) * .3; g.beginPath(); const x = 529 + (y > 440 ? (y - 440) * -.3 : 0); g.moveTo(x + 2, y); g.lineTo(x + 9 + (i % 2) * 4, y + 5); g.stroke(); }
    /* le bord, à la plume, plus épais au milieu */
    g.strokeStyle = '#1c2462'; g.lineJoin = 'round';
    g.lineWidth = 4.2; g.beginPath(); bord(); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.moveTo(566, 276); g.bezierCurveTo(548, 276, 534, 290, 530, 318); g.stroke();
    return c.toDataURL('image/png');
  } catch (e) { return v.src; }
}

export function creerMains(ctx, vis) {
  const racine = ctx.porteurs, mains = {};
  for (const nom of Object.keys(vis)) {
    const v = vis[nom]; if (!v) continue;
    const im = new Image(); im.className = 'ep main'; im.src = nom === 'main-souleve' && v.reel ? completerIndex(v) : v.src; im.width = v.w; im.height = v.h; im.alt = ''; im.decoding = 'async';
    racine.appendChild(im);
    mains[nom] = { v, im, vu: false, plaque: reperesPx(v, 'quad'), ancre: reperesPx(v, 'pointe') || reperesPx(v, 'pince') || reperesPx(v, 'coin') || [v.w / 2, v.h / 2] };
  }
  /* l'ombre de contact de la main gauche sur le téléphone */
  const mg = mains['main-gauche-telephone'];
  if (mg) {
    const boite = document.createElement('div'); boite.className = 'couche contact-main'; racine.appendChild(boite);
    const om = new Image(); om.className = 'ep contact-main__ombre'; om.src = mg.v.src; om.width = mg.v.w; om.height = mg.v.h; om.alt = ''; boite.appendChild(om);
    mg.contact = { boite, om, vu: false };
  }
  const T = (dx, dy) => [1, 0, dx, 0, 1, dy, 0, 0, 1];
  function appliquer(m, H, o) {
    m.vu = true;
    const op = o.op === undefined ? 1 : o.op;
    setV(m.im, op > .002);
    const Hf = o.decale ? mult3(T(o.decale[0], o.decale[1]), H) : H;
    setT(m.im, m3d(Hf));
    setO(m.im, op);
    m.im.style.zIndex = o.z || 31;
    return Hf;
  }
  return {
    has: nom => !!mains[nom],
    reel: nom => mains[nom] && mains[nom].v.reel,
    /* la plaque de la main sur un quadrilatère écran ; o.contact : ombre de contact sur l'objet */
    plaque(nom, quad, o = {}) {
      const m = mains[nom]; if (!m || !m.plaque) return;
      const Hf = appliquer(m, quadVersQuad(m.plaque, quad), o);
      if (o.contact && m.contact) {
        const c = m.contact; c.vu = true;
        const clip = `polygon(${quad.map(p => p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px').join(',')})`;
        if (c.boite._c !== clip) { c.boite._c = clip; c.boite.style.clipPath = clip; }
        c.boite.style.zIndex = (o.z || 31) - 1;
        const k = Math.hypot(Hf[0], Hf[3]) / (Hf[8] || 1);
        setT(c.om, m3d(mult3(T(7 * k + 2, 11 * k + 3), Hf))); setO(c.om, .38 * (o.op === undefined ? 1 : o.op));
        setV(c.boite, true);
      }
    },
    /* l'image entière de la main sur un quadrilatère écran */
    plaqueImage(nom, quad, o = {}) { const m = mains[nom]; if (!m) return; appliquer(m, quadVersQuad([[0, 0], [m.v.w, 0], [m.v.w, m.v.h], [0, m.v.h]], quad), o); },
    /* l'ancre de la main sur un point écran ; angle en degrés, échelle en px écran par px image */
    point(nom, P, ang = 0, ech = 1, o = {}) {
      const m = mains[nom]; if (!m) return;
      const a = ang * Math.PI / 180, c = Math.cos(a) * ech, s = Math.sin(a) * ech, [ax, ay] = o.ancre || m.ancre;
      return appliquer(m, [c, -s, P[0] - (c * ax - s * ay), s, c, P[1] - (s * ax + c * ay), 0, 0, 1], o);
    },
    /* la main posée par une homographie déjà calculée (image -> écran) */
    parH(nom, H, o = {}) { const m = mains[nom]; if (!m) return; return appliquer(m, H, o); },
    taille: nom => mains[nom] ? [mains[nom].v.w, mains[nom].v.h] : [1, 1],
    debut() { for (const k in mains) { mains[k].vu = false; if (mains[k].contact) mains[k].contact.vu = false; } },
    fin() { for (const k in mains) { if (!mains[k].vu) setV(mains[k].im, false); if (mains[k].contact && !mains[k].contact.vu) setV(mains[k].contact.boite, false); } }
  };
}
