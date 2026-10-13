/* =====================================================================
   P4 (seizième passe, 06/10/2026) : demander un travail à l'ouvrier
   (js/ouvrier.js, un fil à part) : décoder et relire une image, encoder
   un canevas, calculer le temps de l'écriture, hors du fil principal.
   La promesse est rejetée sans OffscreenCanvas ni Worker, ou avec
   ?ouvrier=0 (pour l'essai) : le film garde alors son calcul habituel.
   ===================================================================== */
let OUVRIER = null, idOuv = 0;
const enAttente = new Map();
export function ouvrier(op, m = {}, transfert = []) {
  if (OUVRIER === false || typeof OffscreenCanvas === 'undefined' || !window.Worker || new URLSearchParams(location.search).get('ouvrier') === '0') return Promise.reject(new Error('sans ouvrier'));
  if (!OUVRIER) {
    try {
      OUVRIER = new Worker(new URL('./ouvrier.js', import.meta.url));
      OUVRIER.onmessage = e => { const a = enAttente.get(e.data.id); if (!a) return; enAttente.delete(e.data.id); if (e.data.erreur) a[1](new Error(e.data.erreur)); else a[0](e.data); };
      OUVRIER.onerror = () => { OUVRIER = false; enAttente.forEach(a => a[1](new Error('ouvrier'))); enAttente.clear(); };
    } catch (e) { OUVRIER = false; return Promise.reject(e); }
  }
  const id = ++idOuv;
  return new Promise((ok, ko) => { enAttente.set(id, [ok, ko]); OUVRIER.postMessage(Object.assign({ id, op }, m), transfert); });
}
