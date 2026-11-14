/* Titik interaksi tambahan v0.4 (34 titik: 7 NPC, 23 objek, 4 area bahaya). Posisi dalam petak (tx, ty).
   Titik lama (officer, board, soil, campfire, joko, sign, smoke) ada di world.js dan tidak diubah.
   clear:1 = hanya 3x3 petak di sekitar titik yang dikosongkan dari pohon/batu (hutan tetap rimbun). */
(function (M) {
  const npc = (id, tx, ty, name, sprite) => ({ id, kind: 'npc', tx, ty, name, verb: 'Bicara', sprite, icon: sprite, r: 30, solid: true, clear: 1 });
  const obj = (id, tx, ty, name, verb) => ({ id, kind: 'obj', tx, ty, name, verb: verb || 'Periksa', sprite: id, icon: id, r: 28, solid: true, clear: 1 });
  const haz = (id, tx, ty, name, look, ring, puffs) => ({ id, kind: 'hazard', tx, ty, name, verb: 'Amati', icon: id, r: 0, solid: true, clear: 2, look, ring, puffs });
  M.World.add([
    /* Bab 1 — Kenali Hutan */
    obj('bigtree', 2, 9, 'Pohon Besar'), obj('nest', 8, 3, 'Sarang Burung'), obj('tracks', 5, 8, 'Jejak Satwa'),
    obj('peat', 4, 15, 'Tanah Gambut'), obj('canal', 6, 19, 'Kanal Pengering'), obj('riverside', 18, 9, 'Titik Pantau Sungai'),
    obj('seedling', 7, 6, 'Bibit Pohon'),
    /* Bab 2 — Waspada Api */
    obj('weather', 14, 21, 'Stasiun Cuaca'), obj('drygrass', 7, 15, 'Semak Kering'), obj('butt', 11, 14, 'Puntung Rokok'),
    obj('burnpile', 11, 22, 'Tumpukan Sampah Bekas Bakar'), obj('warnboard', 2, 12, 'Papan Kewaspadaan', 'Baca'),
    haz('smoke2', 2, 2, 'Asap Tipis di Semak', 'fire', { min: 56, mid: 76, max: 96 }, 3),
    /* Bab 3 — Dampak Karhutla */
    obj('airboard', 26, 5, 'Papan Kualitas Udara', 'Baca'), npc('rina', 25, 11, 'Bu Rina (warga)', 'rina'),
    obj('clinic', 31, 6, 'Pos Kesehatan'), npc('hadi', 33, 9, 'Pak Hadi (kader kesehatan)', 'hadi'),
    obj('school', 29, 2, 'Papan Sekolah', 'Baca'), npc('sari', 32, 3, 'Bu Sari (guru)', 'sari'),
    obj('market', 25, 20, 'Lapak Pasar'), npc('karto', 28, 19, 'Pak Karto (pedagang)', 'karto'),
    haz('burned', 19, 22, 'Lahan Bekas Terbakar', 'burnt', { min: 48, mid: 68, max: 92 }, 2),
    /* Bab 4 — Penjaga Masyarakat */
    npc('dina', 26, 2, 'Dina (siswa)', 'dina'), obj('poster', 30, 11, 'Papan Pengumuman', 'Baca'), Object.assign(npc('lurah', 49, 10, 'Pak Lurah', 'lurah'), { fixed: true, noclear: true }),
    obj('compost', 33, 17, 'Tempat Kompos'), npc('bima', 19, 14, 'Bima (pendaki)', 'bima'),
    /* Bab 5 — Pelaporan Aman */
    obj('tower', 13, 17, 'Menara Pantau'), obj('landmark', 15, 11, 'Patok Lokasi', 'Baca'), obj('phone', 10, 8, 'Pos Jaga (radio)', 'Gunakan'),
    haz('peatsmoke', 2, 22, 'Asap Tanah Gambut', 'peat', { min: 60, mid: 80, max: 100 }, 3),
    haz('flame', 32, 22, 'Api di Kejauhan', 'fire', { min: 56, mid: 76, max: 104 }, 5),
    /* Bab 6 — Misi Penyelamatan Lingkungan */
    obj('scenario', 2, 17, 'Papan Skenario Latihan', 'Baca'), obj('seedbed', 7, 22, 'Persemaian')
  ]);
})(window.MPH);
