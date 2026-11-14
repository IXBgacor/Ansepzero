/* Titik interaksi v0.5 — Misi Terakhir. Posisi dalam petak (tx,ty). Semua dipasang sebelum peta dibangun agar area di sekitarnya bebas pohon.
   'bigfire' = kebakaran besar di bagian belakang (utara) peta; baru DITAMPILKAN setelah 30 misi selesai (lihat final.js). */
(function (M) {
  const npc = (id, tx, ty, name, sprite) => ({ id, kind: 'npc', tx, ty, name, verb: 'Bicara', sprite, icon: sprite, r: 30, solid: true, clear: 1 });
  const obj = (id, tx, ty, name, sprite, verb) => ({ id, kind: 'obj', tx, ty, name, verb: verb || 'Periksa', sprite, icon: sprite, r: 28, solid: true, clear: 1 });
  M.World.add([
    { id: 'bigfire', kind: 'hazard', tx: 17, ty: 2, name: 'Kebakaran Besar di Hutan Utara', verb: 'Amati', icon: 'flame', r: 0, solid: true, clear: 2, look: 'fire', ring: { min: 72, mid: 100, max: 130 }, puffs: 9 },
  ]);
})(window.MPH);
