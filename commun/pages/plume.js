/* =====================================================================
   La plume du film (copie de c-film/js/plume.js et des outils qu'elle
   demande, le 06/10/2026, pour les pages Conseil et Atelier ; le film
   n'est pas modifié). Un trait est une forme pleine à largeur variable,
   plus épaisse du côté de l'ombre (lumière en haut à gauche), avec
   attaque, plein, délié et sortie ; les traits se révèlent par phases,
   comme tracés par une seule plume.
   ===================================================================== */
export const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const ss = t => t * t * (3 - 2 * t);
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t, dX = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { const e = X(t) - x, d = dX(t); if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break; t -= e / d; }
    if (t < 0 || t > 1 || Math.abs(X(t) - x) > 1e-3) { let a = 0, b = 1; for (let i = 0; i < 30; i++) { t = (a + b) / 2; if (X(t) < x) a = t; else b = t; } }
    return Y(clamp(t));
  };
}
export const eEntree = bezier(.16, 1, .3, 1);
export const eDepl = bezier(.65, 0, .35, 1);
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function bruit1(seed) {
  const r = rng(seed), v = new Float32Array(258);
  for (let i = 0; i < 258; i++) v[i] = r() * 2 - 1;
  return s => { s = ((s % 256) + 256) % 256; const i = s | 0, f = s - i, u = f * f * (3 - 2 * f); return v[i] + (v[i + 1] - v[i]) * u; };
}
const NS = 'http://www.w3.org/2000/svg';
export const ENCRE = '#000091';
export const ENCRE_PLUME = '#16205C';
const LUM = [-0.6, -0.8];
const borne = clamp, lin = lerp, lisse = ss;

export function reech(P, pas) {
  const n0 = P.length; if (n0 < 2) return [P[0].slice(), P[0].slice()];
  const arc = [0];
  for (let i = 1; i < n0; i++) arc.push(arc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const L = arc[n0 - 1]; if (L < 1e-6) return [P[0].slice(), P[0].slice()];
  const n = Math.max(2, Math.ceil(L / pas) + 1), out = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const s = L * i / (n - 1);
    while (j < n0 - 2 && arc[j + 1] < s) j++;
    const sg = arc[j + 1] - arc[j] || 1, f = borne((s - arc[j]) / sg, 0, 1);
    out.push([P[j][0] + (P[j + 1][0] - P[j][0]) * f, P[j][1] + (P[j + 1][1] - P[j][1]) * f]);
  }
  return out;
}
export function longueur(P) { let s = 0; for (let i = 1; i < P.length; i++) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return s; }
export const reechN = (P, n) => { const L = longueur(P); return reech(P, Math.max(.01, L / (n - 1))).slice(0, n); };
export function catmull(P, sg) {
  sg = sg || 6; const out = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let s = 0; s < sg; s++) {
      const t = s / sg, t2 = t * t, t3 = t2 * t;
      const f = k => .5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([f(0), f(1)]);
    }
  }
  out.push(P[P.length - 1].slice());
  return out;
}
function profil(nom, t) {
  if (nom === 'hachure') return t < .14 ? .35 + .65 * lisse(t / .14) : t < .34 ? 1 : 1 - .9 * lisse((t - .34) / .66);
  if (nom === 'fin') return .7 + .3 * Math.sin(Math.PI * t);
  if (nom === 'plat') return 1;
  if (t < .07) return .5 + .5 * lisse(t / .07);
  if (t > .82) return 1 - .78 * lisse((t - .82) / .18);
  return 1 - .2 * Math.sin((t - .07) / .75 * Math.PI) + .05 * Math.sin(t * 23 + 1.7);
}
export function preparer(P0, o) {
  let P = o.brut ? P0.map(q => q.slice()) : reech(P0, o.pas || 2.4);
  const n = P.length;
  if (o.tremble && !o.brut) {
    const b = bruit1(o.graine || 1), pas = o.pas || 2.4, Q = [];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], c = P[Math.min(n - 1, i + 1)];
      const dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy) || 1, s = i * pas;
      const off = b(s / 42) * o.tremble + b(s / 7 + 40) * o.tremble * .22;
      Q.push([P[i][0] - dy / l * off, P[i][1] + dx / l * off]);
    }
    P = Q;
  }
  const arc = new Float32Array(n);
  for (let i = 1; i < n; i++) arc[i] = arc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
  const L = arc[n - 1] || 1;
  const NX = new Float32Array(n), NY = new Float32Array(n);
  let somme = 0;
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)], c = P[Math.min(n - 1, i + 1)];
    const dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy) || 1;
    NX[i] = dy / l; NY[i] = -dx / l; somme += NX[i] * LUM[0] + NY[i] * LUM[1];
  }
  const sg = somme > 0 ? -1 : 1;
  const G = [], D = [], wMin = o.wMin, wMax = o.wMax, prof = o.profil || 'plume';
  for (let i = 0; i < n; i++) {
    const t = arc[i] / L;
    let w = wMin + (wMax - wMin) * profil(o.ferme ? 'plat' : prof, t);
    const nx = NX[i] * sg, ny = NY[i] * sg;
    w *= 1 - .34 * (nx * LUM[0] + ny * LUM[1]);
    if (w < wMin * .55) w = wMin * .55;
    G.push([P[i][0] + nx * w * .62, P[i][1] + ny * w * .62]);
    D.push([P[i][0] - nx * w * .38, P[i][1] - ny * w * .38]);
  }
  return { P, G, D, arc, L, n };
}
const f1 = v => Math.round(v * 10) / 10;
export function cheminFerme(pts) {
  const n = pts.length; if (n < 3) return '';
  let d = 'M' + f1((pts[n - 1][0] + pts[0][0]) / 2) + ' ' + f1((pts[n - 1][1] + pts[0][1]) / 2);
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    d += 'Q' + f1(a[0]) + ' ' + f1(a[1]) + ' ' + f1((a[0] + b[0]) / 2) + ' ' + f1((a[1] + b[1]) / 2);
  }
  return d + 'Z';
}
export function cheminRuban(T, q) {
  if (q >= 1) { if (!T.plein) T.plein = cheminFerme(T.G.concat(T.D.slice().reverse())); return T.plein; }
  const Lq = T.L * q;
  let i = 0; while (i < T.n - 2 && T.arc[i + 1] < Lq) i++;
  const sg = T.arc[i + 1] - T.arc[i] || 1, f = borne((Lq - T.arc[i]) / sg, 0, 1);
  const tip = [lin(T.P[i][0], T.P[i + 1][0], f), lin(T.P[i][1], T.P[i + 1][1], f)];
  const tau = Math.min(9, Lq * .45), G = [], D = [];
  for (let j = 0; j <= i; j++) {
    const dist = Lq - T.arc[j], c = dist < tau ? .3 + .7 * lisse(dist / tau) : 1, P = T.P[j];
    G.push([P[0] + (T.G[j][0] - P[0]) * c, P[1] + (T.G[j][1] - P[1]) * c]);
    D.push([P[0] + (T.D[j][0] - P[0]) * c, P[1] + (T.D[j][1] - P[1]) * c]);
  }
  return cheminFerme(G.concat([tip], D.reverse()));
}
export function pointDe(T, q) {
  const Lq = T.L * borne(q, 0, 1);
  let i = 0; while (i < T.n - 2 && T.arc[i + 1] < Lq) i++;
  const sg = T.arc[i + 1] - T.arc[i] || 1, f = borne((Lq - T.arc[i]) / sg, 0, 1);
  return [lin(T.P[i][0], T.P[i + 1][0], f), lin(T.P[i][1], T.P[i + 1][1], f)];
}

/* Un dessin SVG : des traits rangés par phases, révélés comme par une seule plume */
export class Dessin {
  constructor(svg, couleur) {
    this.svg = svg; this.couleur = couleur || ENCRE; this.traits = []; this.textes = [];
    this.g = document.createElementNS(NS, 'g'); if (svg) svg.appendChild(this.g);
  }
  trait(P, o) {
    if (!P || P.length < 2) return null;
    const T = preparer(P, o);
    T.phase = o.phase; T.op = o.op === undefined ? .86 : o.op; T.o = o;
    T.poids = T.L * (o.vitesse || 1) + (o.levee === undefined ? 10 : o.levee);
    T.q = -1;
    this.traits.push(T); return T;
  }
  texte(x, y, chaine, o) {
    const t = { x, y, chaine, phase: o.phase, taille: o.taille || 16, rot: o.rot || 0, ancre: o.ancre || 'start', op: o.op || .62, graisse: o.graisse || 500, espace: o.espace === undefined ? .16 : o.espace, telle: !!o.telle, n: -1 };
    this.textes.push(t); return t;
  }
  planifier() {
    const parPhase = {};
    for (const T of this.traits) (parPhase[T.phase] = parPhase[T.phase] || []).push(T);
    for (const k in parPhase) {
      const L = parPhase[k]; let tot = 0; L.forEach(T => tot += T.poids);
      let acc = 0; L.forEach(T => { T.t0 = acc / tot; acc += T.poids; T.t1 = acc / tot; });
    }
    this.parPhase = parPhase;
    const parPhaseT = {};
    for (const t of this.textes) (parPhaseT[t.phase] = parPhaseT[t.phase] || []).push(t);
    for (const k in parPhaseT) { const L = parPhaseT[k]; L.forEach((t, i) => { t.t0 = i / L.length; t.t1 = (i + 1) / L.length; }); }
  }
  monter() {
    this.planifier();
    const frag = document.createDocumentFragment();
    for (const T of this.traits) {
      const e = document.createElementNS(NS, 'path');
      e.setAttribute('fill', this.couleur); e.setAttribute('fill-opacity', T.op);
      T.el = e; frag.appendChild(e);
    }
    for (const t of this.textes) {
      const e = document.createElementNS(NS, 'text');
      e.setAttribute('x', t.x); e.setAttribute('y', t.y);
      e.setAttribute('fill', this.couleur); e.setAttribute('fill-opacity', t.op);
      e.setAttribute('text-anchor', t.ancre);
      e.setAttribute('style', `font:${t.graisse} ${t.taille}px Inter,sans-serif;letter-spacing:${t.espace}em;text-transform:${t.telle ? 'none' : 'uppercase'}`);
      if (t.rot) e.setAttribute('transform', `rotate(${t.rot} ${t.x} ${t.y})`);
      t.el = e; frag.appendChild(e);
    }
    this.g.appendChild(frag);
  }
  rendre(prog) {
    for (const T of this.traits) {
      if (T.morph) continue;
      const u = prog[T.phase] || 0;
      const frac = (T.L * (T.o.vitesse || 1)) / T.poids;
      const q = borne((u - T.t0) / (T.t1 - T.t0) / frac, 0, 1);
      if (q === T.q) continue;
      T.q = q;
      T.el.setAttribute('d', q <= 0 ? '' : cheminRuban(T, q));
    }
    for (const t of this.textes) {
      const u = prog[t.phase] || 0, n = Math.round(t.chaine.length * borne((u - t.t0) / (t.t1 - t.t0), 0, 1));
      if (n === t.n) continue; t.n = n; t.el.textContent = t.chaine.slice(0, n);
    }
  }
  /* la même révélation, peinte dans un canevas (la feuille de dessin du plan 7, qui part ensuite avec la page) */
  peindre(ctx, prog, alpha = 1) {
    if (!this.parPhase) this.planifier();
    ctx.fillStyle = this.couleur;
    for (const T of this.traits) {
      if (!(T.phase in prog)) continue;   /* seules les phases demandées */
      let d;
      if (T.morph) d = T.dMorph;
      else {
        const u = prog[T.phase] || 0;
        const frac = (T.L * (T.o.vitesse || 1)) / T.poids;
        const q = borne((u - T.t0) / (T.t1 - T.t0) / frac, 0, 1);
        if (q <= 0) continue;
        if (q >= 1) { if (!T.p2) T.p2 = new Path2D(cheminRuban(T, 1)); ctx.globalAlpha = T.op * alpha; ctx.fill(T.p2); continue; }
        d = cheminRuban(T, q);
      }
      if (!d) continue;
      ctx.globalAlpha = (T.morph ? (T.opMorph || T.op) : T.op) * alpha; ctx.fill(new Path2D(d));
    }
    for (const t of this.textes) {
      if (!(t.phase in prog)) continue;
      const u = prog[t.phase] || 0, n = Math.round(t.chaine.length * borne((u - t.t0) / (t.t1 - t.t0), 0, 1));
      if (n <= 0) continue;
      ctx.save(); ctx.globalAlpha = t.op * alpha; ctx.font = `${t.graisse} ${t.taille}px Inter, sans-serif`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = (t.espace * t.taille).toFixed(2) + 'px';
      ctx.textAlign = t.ancre === 'middle' ? 'center' : t.ancre === 'end' ? 'right' : 'left';
      ctx.translate(t.x, t.y); if (t.rot) ctx.rotate(t.rot * Math.PI / 180);
      ctx.fillText(t.telle ? t.chaine.slice(0, n) : t.chaine.slice(0, n).toUpperCase(), 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  /* la pointe de la plume : sur le trait en cours, ou en l'air entre deux traits */
  pointe(phase, u) {
    const L = this.parPhase[phase]; if (!L || !L.length) return null;
    if (u <= L[0].t0) return L[0].P[0];
    for (let i = 0; i < L.length; i++) {
      const T = L[i];
      if (u >= T.t0 && u <= T.t1) {
        const q = (u - T.t0) / (T.t1 - T.t0), Lq = q * T.poids, Lt = T.L * (T.o.vitesse || 1);
        if (Lq <= Lt) return pointDe(T, Lq / Lt);
        const N = L[i + 1], fin = T.P[T.n - 1];
        if (!N) return fin;
        const g = (Lq - Lt) / Math.max(1, T.poids - Lt);
        return [lin(fin[0], N.P[0][0], eDepl(g)), lin(fin[1], N.P[0][1], eDepl(g))];
      }
    }
    const D = L[L.length - 1]; return D.P[D.n - 1];
  }
}

/* ---- formes de base ---- */
export function ligne(x1, y1, x2, y2) { return [[x1, y1], [x2, y2]]; }
export function arcE(cx, cy, rx, ry, a0, a1, rot) {
  rot = rot || 0; const n = Math.max(10, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) / 3));
  const cr = Math.cos(rot), sr = Math.sin(rot), out = [];
  for (let i = 0; i <= n; i++) { const a = lin(a0, a1, i / n), x = Math.cos(a) * rx, y = Math.sin(a) * ry; out.push([cx + x * cr - y * sr, cy + x * sr + y * cr]); }
  return out;
}
export function perimetre(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); const P = [], q = Math.PI / 2;
  P.push([x, y + h - r]); P.push([x, y + r]);
  arcE(x + r, y + r, r, r, Math.PI, Math.PI + q).forEach(p => P.push(p));
  P.push([x + w - r, y]);
  arcE(x + w - r, y + r, r, r, -q, 0).forEach(p => P.push(p));
  P.push([x + w, y + h - r]);
  arcE(x + w - r, y + h - r, r, r, 0, q).forEach(p => P.push(p));
  P.push([x + r, y + h]);
  arcE(x + r, y + h - r, r, r, q, Math.PI).forEach(p => P.push(p));
  return reech(P, 2);
}
export function morceau(P, a, b) {
  const n = P.length, out = [];
  const i0 = Math.round(a * (n - 1)), i1 = Math.round(b * (n - 1));
  for (let i = i0; i <= i1; i++) out.push(P[((i % (n - 1)) + (n - 1)) % (n - 1)]);
  return out;
}
export function decaler(P, dx, dy) { return P.map(q => [q[0] + dx, q[1] + dy]); }
export function tourner(P, cx, cy, a) { const c = Math.cos(a), s = Math.sin(a); return P.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]); }

/* une forme fermée tracée à la main : deux traits qui se chevauchent, et une reprise plus légère */
export function formeMain(D, P, o) {
  const r = rng(o.graine || 3);
  const a0 = r() * .2, cut = .5 + r() * .08;
  D.trait(morceau(P, a0, a0 + cut + .04), Object.assign({}, o, { graine: (o.graine || 3) + 1 }));
  D.trait(morceau(P, a0 + cut - .02, a0 + 1.03), Object.assign({}, o, { graine: (o.graine || 3) + 2 }));
  if (o.reprise) {
    const b = r() * .6;
    D.trait(decaler(morceau(P, b, b + .28 + r() * .2), (r() - .5) * 1.6, (r() - .5) * 1.6), Object.assign({}, o, { wMax: o.wMax * .55, op: (o.op || .86) * .45, graine: (o.graine || 3) + 3 }));
  }
}
/* une ligne d'écriture griffonnée, sans lettres lisibles */
export function gribouillis(D, x, y, w, h, o) {
  const r = rng(o.graine || 9); let cx = x;
  while (cx < x + w - 5) {
    const lw = Math.min(x + w - cx, lin(16, 54, r()));
    if (lw < 8) break;
    const pts = [[cx, y - h * .2]]; let px = cx;
    while (px < cx + lw) {
      const s = lin(3.1, 5.2, r());
      const haut = r() < .13 ? h * 1.85 : h * lin(.75, 1.05, r());
      const bas = r() < .07 ? -h * .8 : 0;
      pts.push([px + s * .5 + haut * .12, y - haut]);
      pts.push([px + s, y - bas]);
      px += s;
    }
    D.trait(catmull(pts, 4), Object.assign({ profil: 'plume', pas: 1.4, levee: 6 }, o, { graine: (o.graine || 9) + Math.round(cx) }));
    cx += lw + lin(4, 8, r());
  }
}
/* hachures parallèles dans un polygone, coupées en traits courts un peu courbes */
export function hachures(D, poly, o) {
  const ang = (o.angle === undefined ? 40 : o.angle) * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
  const R = poly.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]);
  let y0 = Infinity, y1 = -Infinity; R.forEach(p => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
  const r = rng(o.graine || 7), pas = o.pas || 5, lm = (o.long || [10, 24])[0], lM = (o.long || [10, 24])[1], marge = o.marge === undefined ? 1.6 : o.marge;
  for (let y = y0 + pas * (.3 + .4 * r()); y < y1; y += pas * (.86 + .28 * r())) {
    const xs = [];
    for (let i = 0; i < R.length; i++) { const a = R[i], b = R[(i + 1) % R.length]; if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
    xs.sort((a, b) => a - b);
    for (let j = 0; j + 1 < xs.length; j += 2) {
      const xa = xs[j] + marge, xb = xs[j + 1] - marge;
      let x = xa + r() * lm * .45;
      while (x < xb) {
        let l = lin(lm, lM, r()); if (x + l > xb) l = xb - x;
        if (l > lm * .4) {
          const yy = y + (r() - .5) * pas * .25, bend = (r() - .5) * 1.4;
          const pts = [[x, yy], [x + l * .5, yy + bend], [x + l, yy + (r() - .5) * .9]].map(([u, v]) => [u * ca - v * sa, u * sa + v * ca]);
          const m = pts[1];
          if (!o.densite || r() < o.densite(m[0], m[1])) {
            D.trait(pts, { phase: o.phase, profil: 'hachure', wMin: o.wMin || .3, wMax: (o.wMax || 1.15) * lin(.8, 1.1, r()), op: (o.op || .5) * lin(.82, 1.12, r()), pas: 1.6, vitesse: .55, levee: 2.5 });
          }
        }
        x += l + lin(lm * .22, lm * .75, r());
      }
    }
  }
}
/* échantillonnage d'un chemin SVG */
let hote = null;
export function echantillonnerChemin(d, pas) {
  if (!hote) { hote = document.createElementNS(NS, 'svg'); hote.setAttribute('width', 0); hote.setAttribute('height', 0); hote.style.cssText = 'position:absolute;left:-9999px'; hote.setAttribute('aria-hidden', 'true'); document.body.appendChild(hote); }
  const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); hote.appendChild(p);
  const L = p.getTotalLength(), n = Math.max(8, Math.ceil(L / pas)), out = [];
  for (let i = 0; i <= n; i++) { const q = p.getPointAtLength(L * i / n); out.push([q.x, q.y]); }
  p.remove(); return out;
}
/* le glyphe de Marianne (tracé officiel du 30/09/2026) */
export const GLYPHE = {
  g: 'M213.08 223.85C205.87 233.7 194.11 249.6 185.27 281.93C180.23 264.28 171.16 252.49 144.25 223.14C106.81 182.3 93.64 177.05 83.01 173L83 389L23 389L23.01 98.54C55.38 88.29 95.97 102.32 136.05 138.07C177.18 174.75 192.57 194.94 213.08 223.85Z',
  d: 'M401 388.99L346 389L346 215.73C333.16 222 289.78 251.43 277.36 261.37C250.1 283.21 246.02 312.59 246.01 328.43L246.01 389L192.98 389L192.99 331.99C192.99 274.52 238.34 237.18 271.53 217.47C328.03 183.91 346.66 183 380.48 146.99C394.65 159.78 401.01 177.81 401.01 196.52L401 388.99Z',
  f: 'M416.08 47.16L407.35 130.22L387.54 116.43C359.01 158.27 324.53 175.39 299.15 189.69C274.59 203.53 218.53 233.37 197.79 278.89C199.05 263.64 217.84 230.29 246.35 204.59C288.91 166.23 325.58 150.04 359.1 95.71L340.12 82.05L416.08 47.16Z'
};

/* =====================================================================
   Peinture au canevas avec la même plume (mains, croquis provisoires)
   ===================================================================== */
export function peindreTrait(ctx, P, o) {
  if (!P || P.length < 2) return;
  const T = preparer(P, o);
  ctx.globalAlpha = o.op === undefined ? .9 : o.op;
  ctx.fill(new Path2D(cheminFerme(T.G.concat(T.D.slice().reverse()))));
}
/* un « dessin » qui peint au canevas au lieu de monter du SVG */
export class Peinture {
  constructor(ctx, couleur) { this.ctx = ctx; this.couleur = couleur || ENCRE_PLUME; }
  trait(P, o) { this.ctx.fillStyle = this.couleur; peindreTrait(this.ctx, P, o); }
  texte() {}
}
