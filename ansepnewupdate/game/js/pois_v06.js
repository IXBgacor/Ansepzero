/* Titik interaksi v0.6 — Desa Rimba Asri. fixed:true = posisi tidak digeser oleh peta (berdiri di plaza/jalan/halaman).
   Warga evakuasi (kind 'npc', solid:false) digerakkan oleh js/evac.js lewat poi._ov saat Misi Terakhir; sebelumnya mereka berdiri di rumahnya dan memberi info edukatif. */
(function (M) {
  const npc = (id, tx, ty, name, sprite, o) => Object.assign({ id, kind: 'npc', tx, ty, name, verb: 'Bicara', sprite, icon: sprite, r: 30, solid: true, noclear: true, fixed: true }, o || {});
  const obj = (id, tx, ty, name, sprite, verb) => ({ id, kind: 'obj', tx, ty, name, verb: verb || 'Periksa', sprite, icon: sprite, r: 28, solid: true, noclear: true, fixed: true });
  M.World.add([
    npc('e_officer', 47, 13, 'Petugas Lapangan', 'officer'), npc('e_off2', 48, 29, 'Petugas Posko Titik Kumpul', 'posko'),
    obj('e_board', 46, 10, 'Peta Jalur Evakuasi', 'evboard', 'Baca'), obj('e_bell', 44, 14, 'Kentongan Desa', 'bell', 'Periksa'),
    obj('e_notice', 55, 11, 'Papan Pengumuman Balai Desa', 'hallnote', 'Baca'), obj('e_well', 47, 15, 'Sumur Warga', 'wellinfo', 'Periksa'), obj('e_assembly', 51, 28, 'Papan Titik Kumpul', 'assembly', 'Baca'),
    npc('v1', 41, 14, 'Pak Darto', 'vil1', { solid: false, evac: 'regular' }), npc('v2', 43, 11, 'Mbak Ayu', 'vil2', { solid: false, evac: 'regular' }),
    npc('v3', 55, 14, 'Pak Ujang', 'vil3', { solid: false, evac: 'regular' }), npc('v4', 52, 18, 'Mas Rudi', 'vil4', { solid: false, evac: 'regular' }),
    npc('v5', 47, 18, 'Bu Ningsih', 'vil5', { solid: false, evac: 'regular' }),
    npc('v_mbah', 59, 14, 'Mbah Karsi (lansia)', 'elder', { solid: false, evac: 'follow', speed: 34 }), npc('v_anak', 44, 17, 'Dewi (anak)', 'child', { solid: false, evac: 'follow', speed: 46 }),
    npc('v_ibu', 56, 18, 'Bu Lastri', 'ibu', { solid: false, evac: 'belongings' })
  ]);
  const b = M.World.byId.bigfire; if (b) { b.tx = 43; b.ty = 2; b.fixed = true; }
})(window.MPH);
