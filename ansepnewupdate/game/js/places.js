/* v2.0 — KONFIGURASI PUSAT fasilitas desa (koordinat petak). Dipakai peta/minimap. Tambah fasilitas baru di sini saja.
   kind: school | hall | plaza | shelter | gate | market | health | fire | forest | peat */
(function (M) {
  'use strict';
  const list = [
    { id: 'pl_school', name: 'SMA Negeri 1', kind: 'school', tx: 88, ty: 20 },
    { id: 'pl_gate', name: 'Gerbang Sekolah', kind: 'gate', tx: 66, ty: 12 },
    { id: 'pl_hall', name: 'Balai Desa', kind: 'hall', tx: 53, ty: 8 },
    { id: 'pl_plaza', name: 'Plaza Desa', kind: 'plaza', tx: 49, ty: 14 },
    { id: 'pl_helipad', name: 'Helipad Damkar', kind: 'fire', tx: 67, ty: 36 },
    { id: 'pl_shelter', name: 'Titik Kumpul', kind: 'shelter', tx: 50, ty: 30 }
  ];
  const byId = {}; list.forEach(p => { byId[p.id] = p; });
  M.Places = { list, byId, add: p => { if (!byId[p.id]) { list.push(p); byId[p.id] = p; } } };
})(window.MPH);
