/* Sprite v1.0 (pixel art lewat Canvas, tanpa berkas gambar): kompleks sekolah (gedung, pagar, lapangan, kendaraan, perabot), NPC sekolah,
   ikon perlengkapan penjaga hutan, overlay pintu terbuka/jendela tertutup (state bangunan), dan efek ending. */
(function (M) {
  'use strict';
  const { cv, px } = M.util, S = M.Sprites;
  const mk = (w, h, fn) => { const c = cv(w, h), g = c.getContext('2d'); fn((col, x, y, ww, hh) => px(g, col, x, y, ww || 1, hh || 1), g); return c; };
  const txt = (g, s, x, y, col, size) => { g.save(); g.font = 'bold ' + (size || 5) + 'px monospace'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = col; g.fillText(s, x, y); g.restore(); };

  /* ---------- gedung: wall x bay; tiap bay 16 px. Tinggi gambar = h*16 + 10 (atap menjorok di atas jejak) ---------- */
  /* o: {wall, wallD, roof, roofD, trim, doors:[bay..], plaques:{bay:'teks'}, glass, sign:{text,bg,fg}, porch:bool, pitched:bool} */
  function building(w, h, o) {
    const W = w * 16, Hh = h * 16 + 10, roofH = 17 + (h - 2) * 3, wallTop = roofH + 2, wallBot = Hh - 5;
    return mk(W, Hh, (R, g) => {
      for (let y = 0; y < roofH; y++) {                                   // atap: genting berbaris + garis nok
        const col = y % 4 === 3 ? o.roofD : o.roof; R(col, 0, y, W, 1);
        if (y % 4 === 0) for (let x = (y / 4 % 2) * 4; x < W; x += 8) R(o.roofD, x, y, 1, 1);
      }
      R(o.roofHi || '#d98b6a', 0, 1, W, 1); R(o.roofD, 0, roofH - 1, W, 1); R('#00000040', 0, roofH, W, 2);       // nok, bibir atap, bayangan
      R(o.wall, 0, roofH, W, wallBot - roofH); R('#00000040', 0, roofH, W, 2); R(o.wallD, 0, wallTop, W, 1);     // v2.0: dinding mulai dari bibir atap (tidak ada celah transparan/rumput di bawah atap)
      R(o.trim, 0, wallBot - 5, W, 5);                                     // kaki dinding
      R('#00000026', 0, wallBot - 5, W, 1);
      for (let b = 0; b < w; b++) {                                        // per bay: pintu atau jendela
        const x0 = b * 16, isDoor = (o.doors || []).includes(b);
        if (isDoor) {
          R(o.doorTrim || '#4a2c12', x0 + 3, wallTop + 8, 10, wallBot - wallTop - 8); R(o.door || '#7a4a22', x0 + 4, wallTop + 9, 8, wallBot - wallTop - 9);
          R('#00000030', x0 + 4, wallTop + 9, 8, 1); R('#e8c860', x0 + 10, wallTop + 15, 1, 2); R('#9a6a3a', x0 + 8, wallTop + 9, 1, wallBot - wallTop - 9);
        } else {
          R(o.trim, x0 + 3, wallTop + 7, 10, 11); R(o.glass || '#8fd0f0', x0 + 4, wallTop + 8, 8, 9); R('#e8f6ff', x0 + 5, wallTop + 9, 2, 2); R('#ffffff', x0 + 8, wallTop + 8, 1, 9); R(o.trim, x0 + 4, wallTop + 12, 8, 1);
          R('#00000030', x0 + 3, wallTop + 18, 10, 1);
        }
        if (o.plaques && o.plaques[b]) { const tw = Math.max(9, o.plaques[b].length * 4 + 3); R('#1b4a3a', x0 + 8 - Math.floor(tw / 2), wallTop + 1, tw, 6); R('#f6efd8', x0 + 9 - Math.floor(tw / 2), wallTop + 2, tw - 2, 4); txt(g, o.plaques[b], x0 + 8.5, wallTop + 5.6, '#1b3a2a', 4); }
      }
      if (o.porch) {                                                       // teras utama: pilar + gable di tengah
        const cx = Math.floor(W / 2) - 20;
        R('#f0ece0', cx, wallTop - 1, 40, 3); R('#cfc8b4', cx, wallTop + 2, 40, 1);
        for (let i = 0; i < 6; i++) R('#cfc8b4', cx + 2 + i * 7, wallTop + 3, 1, 1);
        [0, 12, 26, 38].forEach(dx => { R('#f6f2e6', cx + dx, wallTop + 3, 3, wallBot - wallTop - 3); R('#bdb6a0', cx + dx + 2, wallTop + 3, 1, wallBot - wallTop - 3); });
        for (let i = 0; i < 8; i++) R(o.roofD, cx - 1 + i, roofH - 9 + i, 42 - 2 * i, 1);        // gable segitiga
      }
      if (o.sign) { const s = o.sign, tw = s.text.length * 4 + 6, x = Math.floor(W / 2 - tw / 2); R('#14301f', x, 2, tw, 8); R(s.bg || '#f6efd8', x + 1, 3, tw - 2, 6); txt(g, s.text, W / 2, 8.2, s.fg || '#1b3a2a', 5); }
      if (o.cross) { const x = o.cross; R('#ffffff', x - 5, wallTop + 1, 11, 7); R('#d8352a', x - 1, wallTop + 2, 3, 5); R('#d8352a', x - 3, wallTop + 3, 7, 3); }
      R(o.plinth || '#bdb7a4', 0, wallBot, W, 5); R('#a39d8a', 0, wallBot + 1, W, 1); R('#8c8674', 0, Hh - 1, W, 1); R('#5a5648', 0, wallBot, W, 1);                            // lantai teras + bayangan
    });
  }
  const PAL = {
    red: { roof: '#b84a3a', roofD: '#8a2a1a', roofHi: '#d98b6a' },
    blue: { roof: '#3f6fb0', roofD: '#2f5590', roofHi: '#7fa6d8' },
    green: { roof: '#4a8a4a', roofD: '#2f6a32', roofHi: '#86c27f' },
    grey: { roof: '#7c8088', roofD: '#585c64', roofHi: '#aab0b8' }
  };
  const mkb = (w, h, pal, wall, doors, extra) => building(w, h, Object.assign({}, PAL[pal], { wall, wallD: '#00000022', trim: '#d9d2bd', doors }, extra || {}));
  const V = S.vobj;
  S.mkBuilding = building; S.mkb = mkb; S.PAL = PAL;      // v2.0: dipakai sprites_v20.js (puskesmas, pos pemadam, pasar)
  V.sch_main = [building(20, 3, Object.assign({}, PAL.red, { wall: '#efe6c9', wallD: '#00000022', trim: '#d9d2bd', doors: [9, 10], porch: true, door: '#6b3a1a',
    sign: { text: 'SMA NEGERI 1 RIMBA ASRI', bg: '#f6efd8' }, plaques: { 2: 'GURU', 5: 'TU', 14: 'KEPSEK', 17: 'OSIS' } }))];
  V.sch_class = [mkb(8, 3, 'blue', '#f1ecd6', [1, 5], { plaques: { 1: 'X-1', 5: 'X-2' } }), mkb(8, 3, 'blue', '#f1ecd6', [1, 5], { plaques: { 1: 'X-3', 5: 'X-4' } }), mkb(8, 3, 'blue', '#f1ecd6', [1, 5], { plaques: { 1: 'XI-1', 5: 'XI-2' } }), mkb(8, 3, 'blue', '#f1ecd6', [1, 5], { plaques: { 1: 'XII-1', 5: 'XII-2' } })];
  V.sch_lab = [mkb(8, 3, 'green', '#e4efdc', [3], { glass: '#a8e0d0', plaques: { 3: 'LAB' }, sign: { text: 'LABORATORIUM', bg: '#e8f6e0' } })];
  V.sch_lib = [mkb(8, 3, 'red', '#f3e8d0', [3], { plaques: { 3: 'PERPUS' }, sign: { text: 'PERPUSTAKAAN', bg: '#f6efd8' } })];
  V.sch_uks = [mkb(4, 3, 'grey', '#f4f6f6', [2], { plaques: { 2: 'UKS' }, cross: 20 })];
  V.sch_wc = [mkb(4, 3, 'grey', '#d8ecf2', [0, 3], { plaques: { 0: 'WC', 3: 'WC' }, door: '#4a7a9a' })];
  V.sch_pos = [mkb(3, 2, 'green', '#e8e2c8', [1], { plaques: { 1: 'POS' } })];
  V.sch_canteen = [building(5, 3, Object.assign({}, PAL.green, { wall: '#f0dfb0', wallD: '#00000022', trim: '#d9c58a', doors: [2], door: '#8a5a2b', glass: '#f6d78a', sign: { text: 'KANTIN', bg: '#ffe9a0' } }))];

  /* ---------- properti sekolah ---------- */
  V.sch_pillar = [mk(16, 32, R => { R('#00000033', 2, 29, 12, 3); R('#a8412a', 3, 6, 10, 23); R('#c8644a', 3, 6, 3, 23); R('#7a2a1a', 11, 6, 2, 23); R('#e8dcc0', 2, 3, 12, 4); R('#cfc4a4', 2, 6, 12, 1); R('#e8dcc0', 2, 27, 12, 3); })];
  V.sch_bush = [mk(16, 16, (R, g) => { R('#00000026', 2, 13, 12, 3); const b = (c, x, y, r) => { g.fillStyle = c; for (let dy = -r; dy <= r; dy++) { const w = Math.floor(Math.sqrt(r * r - dy * dy)); g.fillRect(x - w, y + dy, w * 2 + 1, 1); } }; b('#2d7a2a', 5, 9, 4); b('#2d7a2a', 11, 9, 4); b('#3f9a38', 8, 7, 5); b('#6bc454', 6, 5, 2); R('#f2d34a', 4, 8, 1, 1); R('#f08aa8', 11, 6, 1, 1); R('#f08aa8', 8, 9, 1, 1); })];
  V.sch_planter = [mk(16, 16, R => { R('#00000026', 1, 13, 14, 3); R('#8a5a2b', 1, 8, 14, 6); R('#a8743a', 1, 8, 14, 1); R('#4a3018', 2, 9, 12, 2); ['#f08aa8', '#f2d34a', '#d8352a', '#ffffff'].forEach((c, i) => { R('#3f8a2f', 2 + i * 3, 5, 1, 4); R(c, 1 + i * 3, 3, 3, 3); R('#ffe9a0', 2 + i * 3, 4, 1, 1); }); })];
  V.sch_table = [mk(16, 16, R => { R('#00000026', 1, 13, 14, 3); R('#8a5a2b', 1, 6, 14, 5); R('#b8844a', 1, 6, 14, 1); R('#4a2c12', 2, 11, 2, 3); R('#4a2c12', 12, 11, 2, 3); R('#e8e8e8', 4, 7, 3, 2); R('#d8352a', 9, 7, 3, 2); })];
  V.sch_hoop = [mk(16, 32, R => { R('#00000033', 3, 29, 10, 3); R('#5a5e66', 7, 6, 2, 24); R('#f6f6f6', 3, 1, 10, 7); R('#d8352a', 6, 4, 4, 3); R('#3a3a3a', 3, 1, 10, 1); R('#ff9a2a', 5, 8, 6, 1); R('#ffffff', 5, 9, 1, 3); R('#ffffff', 10, 9, 1, 3); R('#ffffff', 7, 10, 2, 1); })];
  V.sch_goal = [mk(16, 24, R => { R('#00000026', 1, 21, 14, 3); R('#f6f6f6', 1, 4, 1, 17); R('#f6f6f6', 14, 4, 1, 17); R('#f6f6f6', 1, 4, 14, 1); for (let y = 5; y < 20; y += 3) R('#cfd4d8', 2, y, 12, 1); for (let x = 3; x < 14; x += 3) R('#cfd4d8', x, 5, 1, 15); })];
  V.sch_flagpole = [mk(16, 48, R => { R('#00000033', 4, 45, 8, 3); R('#cfd4d8', 7, 3, 2, 42); R('#ffffff', 7, 3, 1, 42); R('#e8c860', 6, 2, 4, 2); R('#d8352a', 9, 4, 6, 3); R('#ffffff', 9, 7, 6, 3); R('#a8a8a8', 5, 42, 6, 3); R('#8a8d93', 4, 44, 8, 2); })];
  V.sch_motor = [0, 1, 2].map(v => mk(16, 16, R => { const c = ['#d8352a', '#2f6aa8', '#2a2a2e'][v]; R('#00000030', 2, 13, 12, 3); R('#1a1a1e', 2, 4, 2, 9); R('#1a1a1e', 12, 4, 2, 9); R(c, 4, 6, 8, 5); R('#ffffff', 5, 7, 2, 1); R('#3a3a40', 6, 4, 4, 2); R('#8a8d93', 7, 3, 2, 1); R('#ffe070', 6, 11, 4, 1); }));
  V.sch_bike = [mk(16, 16, R => { R('#00000026', 2, 13, 12, 3); R('#26262a', 2, 4, 2, 9); R('#26262a', 12, 4, 2, 9); R('#e8c030', 4, 7, 8, 1); R('#e8c030', 7, 5, 1, 5); R('#8a8d93', 6, 3, 4, 1); R('#8a8d93', 8, 9, 1, 3); })];
  V.sch_rack = [mk(16, 16, R => { R('#00000026', 1, 13, 14, 3); R('#8a8d93', 1, 11, 14, 1); for (let x = 2; x < 15; x += 3) R('#8a8d93', x, 6, 1, 6); R('#6a6d73', 1, 12, 14, 1); })];
  V.sch_monument = [mk(32, 32, R => { R('#00000033', 3, 29, 26, 3); R('#9a9ea6', 3, 24, 26, 5); R('#b8bcc4', 3, 24, 26, 1); R('#8a8d93', 8, 18, 16, 6); R('#7a7e86', 11, 8, 10, 10); R('#9a9ea6', 12, 8, 3, 10); R('#2f9a58', 13, 11, 6, 1); R('#2f9a58', 15, 9, 2, 6); R('#ffd36a', 14, 4, 4, 4); R('#fff2b0', 15, 5, 1, 1); })];
  V.sch_gatesign = [mk(32, 24, (R, g) => { R('#00000030', 3, 21, 26, 3); R('#6b4423', 5, 14, 2, 8); R('#6b4423', 25, 14, 2, 8); R('#14301f', 1, 2, 30, 13); R('#f6efd8', 2, 3, 28, 11); R('#1b6a3a', 2, 3, 28, 2); txt(g, 'SMA NEGERI 1', 16, 9.3, '#1b3a2a', 4.6); txt(g, 'RIMBA ASRI', 16, 13, '#1b3a2a', 4.6); })];

  /* ---------- properti POI sekolah (16x16) ---------- */
  const prop = fn => mk(16, 16, (R, g) => fn(R, g));
  S.props.schoolmap = prop(R => { R('#5a3818', 3, 9, 2, 6); R('#5a3818', 11, 9, 2, 6); R('#1b4a3a', 1, 1, 14, 9); R('#f6efd8', 2, 2, 12, 7); R('#7bc87a', 3, 3, 4, 2); R('#c8a860', 8, 3, 5, 2); R('#6a9ad8', 3, 6, 4, 2); R('#e8a0a0', 8, 6, 5, 2); R('#3a3a3a', 7, 3, 1, 5); });
  S.props.schoolrule = prop(R => { R('#5a3818', 7, 9, 2, 6); R('#6b4423', 2, 1, 12, 9); R('#f6efd8', 3, 2, 10, 7); R('#d8352a', 4, 3, 8, 1); R('#3a3a3a', 4, 5, 7, 1); R('#3a3a3a', 4, 7, 5, 1); });
  S.props.schoolgarden = prop(R => { R('#8a5a2b', 2, 9, 12, 5); R('#4a3018', 3, 10, 10, 2); ['#f08aa8', '#f2d34a', '#d8352a'].forEach((c, i) => { R('#3f8a2f', 4 + i * 4, 6, 1, 4); R(c, 3 + i * 4, 4, 3, 3); }); });
  ['schoolmap', 'schoolrule', 'schoolgarden'].forEach(k => { S.icons[k] = S.props[k]; });

  /* ---------- NPC sekolah ---------- */
  const base = { skin: '#e0a878', hair: '#2a1a10', shirt: '#4a8a5a', pants: '#2e3340', boot: '#161616', belt: '#c8b060' };
  const NP = {
    satpam: { shirt: '#3a5a8a', pants: '#26324a', hat: 'cap', cap: '#26324a', brim: '#1a2236', band: '#e8c860', belt: '#e8c860' },
    kepsek: { shirt: '#7a4a22', pants: '#2a2a30', hair: '#3a3a3a', skin: '#d8a070', belt: '#3a2410' },
    guru: { shirt: '#2f8a8a', pants: '#2a2a30', hair: '#1a1a1a', skin: '#e0a878', belt: '#c8b060' },
    siswa1: { shirt: '#f4f4f4', pants: '#7a7e86', hair: '#1a1a1a', skin: '#e8b890', belt: '#7a7e86' },
    siswa2: { shirt: '#f4f4f4', pants: '#7a7e86', hair: '#4a2a14', skin: '#c89a70', belt: '#7a7e86' },
    kantin: { shirt: '#e8a040', pants: '#4a3a28', hair: '#2a1a10', skin: '#d8a070', belt: '#f6efd8' }
  };
  for (const k of Object.keys(NP)) { S.npc[k] = []; for (let d = 0; d < 4; d++) S.npc[k][d] = S.makePerson(Object.assign({}, base, NP[k]), d); S.icons[k] = S.npc[k][0]; }

  /* ---------- ikon perlengkapan penjaga hutan (16x16) ---------- */
  S.gear = {
    rompi: mk(16, 16, R => { R('#e8742a', 3, 3, 4, 10); R('#e8742a', 9, 3, 4, 10); R('#e8742a', 3, 3, 10, 3); R('#1a1a1a', 7, 3, 2, 1); R('#f6efd8', 3, 9, 4, 1); R('#f6efd8', 9, 9, 4, 1); R('#b85418', 3, 12, 4, 1); R('#b85418', 9, 12, 4, 1); }),
    topi: mk(16, 16, R => { R('#4f7f35', 4, 4, 8, 5); R('#6b4423', 4, 8, 8, 1); R('#3b5a2a', 2, 9, 12, 2); R('#6bb84a', 5, 5, 3, 1); R('#ffd36a', 7, 6, 2, 2); }),
    radio: mk(16, 16, R => { R('#3a3a40', 5, 5, 6, 9); R('#1a1a1e', 6, 6, 4, 3); R('#7be08f', 6, 6, 4, 1); R('#8a8d93', 7, 10, 2, 2); R('#3a3a40', 11, 1, 1, 5); R('#d8352a', 5, 4, 2, 1); }),
    buku: mk(16, 16, R => { R('#2f6aa8', 3, 3, 10, 11); R('#8fb8e8', 4, 4, 8, 9); R('#fff', 5, 6, 6, 1); R('#fff', 5, 8, 6, 1); R('#fff', 5, 10, 4, 1); R('#1f4a80', 3, 3, 1, 11); R('#d8352a', 11, 3, 1, 5); })
  };
  S.gearURL = k => S.gear[k].toDataURL('image/png');
  Object.keys(S.gear).forEach(k => { S.icons['gear_' + k] = S.gear[k]; });

  /* ---------- overlay state bangunan ---------- */
  /* pintu balai desa terbuka (gambar balai 80x48; pintu di x34..45, y26..43) */
  S.hallOpen = mk(80, 48, R => { R('#2a1a0e', 34, 26, 12, 18); R('#3a2414', 35, 27, 10, 16); R('#6b4a2a', 36, 38, 8, 5); R('#c8a870', 36, 40, 8, 1); R('#8a5a2b', 34, 26, 3, 18); R('#a8743a', 34, 26, 1, 18); R('#e8c860', 35, 35, 1, 2); });
  S.hallHalf = mk(80, 48, R => { R('#2a1a0e', 34, 26, 12, 18); R('#6b4423', 34, 26, 7, 18); R('#8a5a2b', 35, 27, 4, 16); R('#e8c860', 38, 36, 1, 2); });
  /* jendela rumah tertutup (daun jendela) saat evakuasi: jendela di x8..15 & x32..39, y20..26 pada gambar rumah 48x40 */
  S.houseShut = mk(48, 40, R => { [8, 32].forEach(x => { R('#5a3a1a', x - 1, 19, 10, 9); R('#7a5028', x, 20, 8, 7); for (let i = 0; i < 4; i++) R('#4a2c12', x, 21 + i * 2, 8, 1); R('#4a2c12', x + 3, 20, 1, 7); }); });
  /* tanah hangus besar + batang pohon gosong (pasca kebakaran), 16x16 dan 16x24 */
  S.charTree = mk(16, 24, R => { R('#00000030', 3, 21, 10, 3); R('#2a2018', 6, 8, 4, 14); R('#3a2a1c', 6, 8, 1, 14); R('#1a1410', 9, 8, 1, 14); R('#2a2018', 3, 11, 3, 1); R('#2a2018', 10, 7, 4, 1); R('#2a2018', 2, 10, 1, 2); R('#2a2018', 13, 6, 1, 2); R('#6e6e72', 7, 6, 2, 1); });
  S.ash = mk(16, 16, R => { R('#2a2622', 0, 0, 16, 16); R('#3a342e', 2, 3, 5, 3); R('#1a1612', 9, 8, 6, 4); R('#4a443c', 4, 10, 3, 2); R('#3a342e', 11, 2, 3, 2); R('#6e6a62', 6, 6, 1, 1); R('#6e6a62', 12, 12, 1, 1); });
  /* tunas hijau pemulihan (untuk adegan ending) */
  S.sapling = mk(16, 16, R => { R('#4a3018', 7, 11, 2, 3); R('#6bc454', 5, 8, 3, 3); R('#6bc454', 8, 6, 3, 3); R('#3f9a38', 6, 9, 2, 2); R('#a8f090', 9, 6, 1, 1); });
  /* ---------- sprite LARI (v1.0): dari frame jalan yang sudah ada, dicondongkan ke depan (shear per baris) + ayunan bahu; kanvas lebar +8 px (margin 4) ---------- */
  S.playerRun = [];
  for (let d = 0; d < 4; d++) {
    S.playerRun[d] = [];
    for (let f = 0; f < 4; f++) {
      const src = S.player[d][f], w = src.width, h = src.height, c = cv(w + 8, h), g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      for (let y = 0; y < h; y++) {
        const top = 1 - y / h;                                                // 1 di kepala, 0 di kaki
        let dx = 0;
        if (d === 3) dx = Math.round(top * 3.2); else if (d === 2) dx = -Math.round(top * 3.2);   // condong ke arah lari
        else dx = Math.round(top * ((f % 2) ? 1.6 : -1.6));                  // atas/bawah: bahu berayun kiri-kanan
        if (d <= 1 && f % 2 === 0 && y > h * 0.6) dx += (f === 0 ? 1 : -1);  // kaki melebar bergantian
        g.drawImage(src, 0, y, w, 1, 4 + dx, y, w, 1);
      }
      S.playerRun[d][f] = c;
    }
  }
})(window.MPH);
