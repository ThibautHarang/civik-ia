/* =====================================================================
   L'oiseau (sixième passe, F21) : une colombe à la plume, un rameau
   d'olivier au bec. Elle paraît au loin quand le guide dit 130 m, vole
   vers l'atelier (battement 1 2 3 4 3 2, huit à dix poses par seconde,
   fondu court entre deux poses), plane avant la pose, se pose sur le
   faîte du toit vers 60 m (fondu de la pose 4 vers l'oiseau posé), puis
   tourne la tête de temps en temps, le rameau frémit. La trajectoire est
   calculée par le monde (liée à p) ; ce module ne fait que dessiner.
   Fichiers : oiseau-planche.webp (quatre poses de largeur égale, l'œil au
   même point de chaque cellule ; l'oiseau vole vers la droite) et
   oiseau-pose.webp (posé, il regarde vers la gauche ; repère « pattes »).
   Sans eux, des poses provisoires sont dessinées en code.
   Les dessins arrivent en traits seuls : l'intérieur de la silhouette est
   rempli de papier (les traits fermés, puis tout ce qui n'est pas relié au
   bord de l'image), pour que l'oiseau ne soit pas transparent.
   ===================================================================== */
import { clamp, setT, setO, setV, el } from './outils.js';

const PAPIER = '#f6f2e8', ENCRE = '#1c2462';

/* remplit l'intérieur d'un dessin au trait (canevas modifié en place) */
function remplir(c0) {
  /* une marge transparente autour : l'extérieur doit pouvoir passer entre le rameau et le bord de l'image */
  const M = 8, c = document.createElement('canvas'); c.width = c0.width + 2 * M; c.height = c0.height + 2 * M; c.getContext('2d').drawImage(c0, M, M);
  const w = c.width, h = c.height, g = c.getContext('2d', { willReadFrequently: true });
  let d;
  try { d = g.getImageData(0, 0, w, h); } catch (e) { return c; }
  const a = d.data, n = w * h, encre = new Uint8Array(n);
  for (let i = 0; i < n; i++) encre[i] = a[i * 4 + 3] > 40 ? 1 : 0;
  /* les traits épaissis de 3 px, pour fermer les petites ouvertures */
  const R = 3, ep = new Uint8Array(n);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!encre[y * w + x]) continue;
    for (let dy = -R; dy <= R; dy++) { const yy = y + dy; if (yy < 0 || yy >= h) continue; for (let dx = -R; dx <= R; dx++) { const xx = x + dx; if (xx >= 0 && xx < w) ep[yy * w + xx] = 1; } }
  }
  /* l'extérieur : tout ce qui touche le bord sans traverser un trait */
  const ext = new Uint8Array(n), file = new Int32Array(n); let t = 0, q = 0;
  const pousser = i => { if (!ext[i] && !ep[i]) { ext[i] = 1; file[q++] = i; } };
  for (let x = 0; x < w; x++) { pousser(x); pousser((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { pousser(y * w); pousser(y * w + w - 1); }
  while (t < q) { const i = file[t++], x = i % w; if (x > 0) pousser(i - 1); if (x < w - 1) pousser(i + 1); if (i >= w) pousser(i - w); if (i < n - w) pousser(i + w); }
  /* le papier, sous l'encre (bord adouci par l'épaississement) */
  const f = document.createElement('canvas'); f.width = w; f.height = h;
  const fg = f.getContext('2d'), fd = fg.createImageData(w, h), b = fd.data;
  const pr = [0xf6, 0xf2, 0xe8];
  for (let i = 0; i < n; i++) if (!ext[i]) { b[i * 4] = pr[0]; b[i * 4 + 1] = pr[1]; b[i * 4 + 2] = pr[2]; b[i * 4 + 3] = 255; }
  fg.putImageData(fd, 0, 0);
  const sortie = document.createElement('canvas'); sortie.width = c0.width; sortie.height = c0.height;
  const sg = sortie.getContext('2d'); sg.filter = 'blur(.6px)'; sg.drawImage(f, -M, -M); sg.filter = 'none'; sg.drawImage(c0, 0, 0);
  return sortie;
}

/* les poses provisoires, à la plume, en attendant les fichiers (quatre ailes, de haut en bas ; vers la droite) */
function planchePro() {
  const cw = 359, ch = 401, c = document.createElement('canvas'); c.width = cw * 4; c.height = ch;
  const g = c.getContext('2d'); g.strokeStyle = ENCRE; g.lineCap = 'round'; g.lineJoin = 'round';
  [-62, -25, 6, 32].forEach((ang, i) => {
    g.save(); g.translate(i * cw + 180, 215);
    /* corps, tête, bec, queue */
    g.lineWidth = 4; g.fillStyle = PAPIER;
    g.beginPath(); g.moveTo(-120, 40); g.quadraticCurveTo(-60, 30, -20, 10); g.quadraticCurveTo(40, -18, 80, -16); g.quadraticCurveTo(102, -18, 106, -2); g.quadraticCurveTo(92, 16, 60, 22); g.quadraticCurveTo(0, 40, -60, 52); g.quadraticCurveTo(-110, 66, -140, 74); g.quadraticCurveTo(-136, 52, -120, 40); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(106, -4); g.lineTo(122, 2); g.lineTo(104, 6); g.stroke();
    g.fillStyle = ENCRE; g.beginPath(); g.arc(90, -8, 3.5, 0, Math.PI * 2); g.fill();
    /* le rameau */
    g.lineWidth = 2.5; g.beginPath(); g.moveTo(112, 2); g.quadraticCurveTo(130, -16, 142, -34); g.stroke();
    [[120, -8, -.9], [128, -20, .6], [136, -28, -.7], [141, -36, .3]].forEach(([x, y, a]) => { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.ellipse(0, -9, 3.5, 9, 0, 0, Math.PI * 2); g.fillStyle = PAPIER; g.fill(); g.stroke(); g.restore(); });
    /* l'aile, plumes en éventail */
    g.save(); g.translate(-10, 6); g.rotate(ang * Math.PI / 180); g.lineWidth = 3.5; g.fillStyle = PAPIER;
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-30, -70, -10, -150); g.quadraticCurveTo(30, -110, 50, -20); g.closePath(); g.fill(); g.stroke();
    g.lineWidth = 1.4; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(8 * k, -8 * k * .3); g.lineTo(-14 + k * 9, -150 + k * 22); g.stroke(); }
    g.restore(); g.restore();
  });
  return { image: c, cw, ch, oeil: [(180 + 90) / cw, (215 - 8) / ch] };
}
function posePro() {
  const w = 828, h = 661, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.strokeStyle = ENCRE; g.lineWidth = 6; g.lineJoin = 'round'; g.fillStyle = PAPIER;
  g.beginPath(); g.moveTo(150, 120); g.quadraticCurveTo(200, 50, 280, 90); g.quadraticCurveTo(330, 160, 420, 250); g.quadraticCurveTo(620, 380, 790, 590); g.quadraticCurveTo(600, 560, 430, 520); g.quadraticCurveTo(250, 520, 180, 380); g.quadraticCurveTo(150, 260, 170, 160); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(150, 125); g.lineTo(108, 150); g.lineTo(150, 145); g.stroke();
  g.fillStyle = ENCRE; g.beginPath(); g.arc(190, 105, 8, 0, Math.PI * 2); g.fill();
  g.lineWidth = 5; g.beginPath(); g.moveTo(330, 520); g.lineTo(300, 640); g.moveTo(380, 520); g.lineTo(370, 640); g.stroke();
  return { image: c, w, h, pattes: [.37, .98] };
}

export function creerOiseau(racine, vPl, vPo) {
  /* la planche : quatre cellules de largeur égale */
  let pl, po;
  if (vPl && vPl.reel) {
    const n = vPl.reperes.poses || 4, cw = vPl.reperes.largeur_pose || vPl.w / n, c = document.createElement('canvas'); c.width = vPl.w; c.height = vPl.h;
    c.getContext('2d').drawImage(vPl.image, 0, 0);
    pl = { image: remplir(c), cw, ch: vPl.h, oeil: vPl.reperes.oeil || [.78, .42], n };
  } else pl = Object.assign(planchePro(), { n: 4 });
  if (vPo && vPo.reel) {
    const c = document.createElement('canvas'); c.width = vPo.w; c.height = vPo.h; c.getContext('2d').drawImage(vPo.image, 0, 0);
    po = { image: remplir(c), w: vPo.w, h: vPo.h, pattes: vPo.reperes.pattes || [.37, .98] };
  } else po = posePro();
  const url = cv => cv.toDataURL('image/png');
  const srcPl = url(pl.image), srcPo = url(po.image);

  /* le vol : une seule cellule à la fois (septième passe, G2 : des poses nettes, sans fondu qui écrase l'amplitude) */
  const vol = el(`<div class="ep oiseau oiseau-vol" aria-hidden="true" style="width:${pl.cw}px;height:${pl.ch}px"><i style="background-image:url(${srcPl});background-size:${pl.cw * pl.n}px ${pl.ch}px"></i></div>`);
  const ca = vol.children[0];
  /* posé : le corps, et la tête découpée qui tourne autour du cou (le rameau part avec elle) */
  const TETE = [[0, 0], [.42, 0], [.42, .22], [.36, .3], [.16, .34], [0, .34]], PIVOT = [.27, .31];
  const poly = q => 'polygon(' + q.map(([x, y]) => (x * 100).toFixed(1) + '% ' + (y * 100).toFixed(1) + '%').join(',') + ')';
  const corpsPoly = [[.42, 0], [1, 0], [1, 1], [0, 1], [0, .34], [.16, .34], [.36, .3], [.42, .22]];
  const pose = el(`<div class="ep oiseau oiseau-pose" aria-hidden="true" style="width:${po.w}px;height:${po.h}px"><img alt="" src="${srcPo}" style="clip-path:${poly(corpsPoly)}"><img alt="" class="oiseau-tete" src="${srcPo}" style="clip-path:${poly(TETE)};transform-origin:${PIVOT[0] * 100}% ${PIVOT[1] * 100}%"></div>`);
  const tete = pose.children[1];
  racine.append(vol, pose);
  /* tailles dans le monde (m) : la cellule de vol, la hauteur de l'oiseau posé (au moins celle de la plaque) */
  const L_VOL = .84, H_POSE = .62;
  /* les pattes de l'oiseau en vol, dans sa cellule (pour un battement sur place, pattes sur le faîte) */
  const PATTES_VOL = [.43, .77];

  const poseX = i => `${(-i * pl.cw).toFixed(1)}px 0`;
  let cle = -1;
  function montrerVol(x, y, s, mir, idx, assiette, bob, op, ancre) {
    const A = ancre || pl.oeil, ax = A[0] * pl.cw, ay = A[1] * pl.ch;
    setV(vol, op > .01); setO(vol, op);
    setT(vol, `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(assiette || 0).toFixed(2)}deg) scale(${(s * mir).toFixed(4)},${s.toFixed(4)}) translate(${-ax}px,${(-ay + (bob || 0)).toFixed(1)}px)`);
    if (idx !== cle) { cle = idx; ca.style.backgroundPosition = poseX(idx); }
  }
  /* o.vol : { x, y (l'œil à l'écran), kpx (px par m), miroir, idx (pose 0 à 3), assiette (degrés), bob (px d'image),
     op, min (taille minimale de la cellule à l'écran, px) } ;
     o.pose : { x, y (les pattes à l'écran), kpx, miroir, op, tete, frisson (degrés), saut (px écran),
     battement : null ou { idx, op } (il bat des ailes sur place : le vol se raccroche à son œil) } */
  function placer(o) {
    if (!o) { setV(vol, false); setV(pose, false); return; }
    let volVu = false;
    if (o.vol && o.vol.op > .01) {
      const v = o.vol, s = Math.max(v.kpx * L_VOL, v.min || 0) / pl.cw;
      montrerVol(v.x, v.y, s, v.miroir ? -1 : 1, v.idx, v.assiette, v.bob, v.op); volVu = true;
    }
    if (o.pose && o.pose.op > .01) {
      const q = o.pose, s = q.kpx * H_POSE / po.h, ax = q.pattes || po.pattes, mp = q.miroir ? -1 : 1, y = q.y - (q.saut || 0);
      const b = q.battement, opP = q.op * (b ? 1 - b.op : 1);
      setV(pose, opP > .01); setO(pose, opP);
      setT(pose, `translate(${q.x.toFixed(1)}px,${y.toFixed(1)}px) scale(${(s * mp).toFixed(4)},${s.toFixed(4)}) translate(${-po.pattes[0] * po.w}px,${-po.pattes[1] * po.h}px)`);
      setT(tete, `rotate(${((q.tete || 0) + (q.frisson || 0)).toFixed(2)}deg)`);
      if (b && b.op > .01) {
        /* le bref battement sur place : l'oiseau en vol, pattes sur le faîte, corps redressé */
        const mv = q.miroir ? 1 : -1;
        montrerVol(q.x, y, q.kpx * L_VOL * .92 / pl.cw, mv, b.idx, mv * -24, 0, q.op * b.op, PATTES_VOL); volVu = true;
      }
    } else setV(pose, false);
    if (!volVu) setV(vol, false);
  }
  return { placer, elements: [vol, pose] };
}
