/* Sprite v2.0 (pixel art lewat Canvas): tanah gambut, rumah panggung, warung, lapak pasar, pasar desa, puskesmas, pos pemadam, ambulans,
   perlengkapan pos kesehatan, vegetasi rawa, NPC baru, dan truk pemadam 4 arah. */
(function (M) {
  'use strict';
  const { cv, px } = M.util, S = M.Sprites, V = S.vobj;
  const mk = (w, h, fn) => { const c = cv(w, h), g = c.getContext('2d'); fn((col, x, y, ww, hh) => px(g, col, x, y, ww || 1, hh || 1), g); return c; };
  const hs = n => { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; };

  /* ---------- tanah gambut: basah (gelap) & kering (lebih terang) ---------- */
  const peat = (base, d1, d2, hi, seed) => mk(16, 16, R => { R(base, 0, 0, 16, 16);
    for (let i = 0; i < 26; i++) { const x = (hs(seed * 97 + i) * 16) | 0, y = (hs(seed * 131 + i * 7) * 16) | 0; R(i % 3 ? d1 : d2, x, y, 1 + (i % 2), 1); }
    for (let i = 0; i < 5; i++) R(hi, (hs(seed * 53 + i * 11) * 15) | 0, (hs(seed * 71 + i * 5) * 15) | 0, 1, 1); });
  S.peat = [peat('#4a3224', '#3a251a', '#2f1d14', '#5e4430', 1), peat('#4d3626', '#3b271b', '#33201a', '#634a34', 2), peat('#47301f', '#382418', '#2c1b12', '#5a402c', 3)];
  S.peatd = [peat('#6b4c32', '#5a3f29', '#7d5c3e', '#8a6a48', 4), peat('#6e4f35', '#5b4029', '#80603f', '#8c6c4a', 5), peat('#684a30', '#573c27', '#7a5a3a', '#886846', 6)];

  /* ---------- rumah panggung 3x2 (48 x 46) ---------- */
  V.stilt = [0, 1].map(v => mk(48, 46, R => {
    const wall = v ? '#b98a58' : '#c9a068', roof = v ? '#3f6fb0' : '#8a4a2a', roofD = v ? '#2f5590' : '#6a3a1c';
    [4, 14, 24, 34, 42].forEach(x => { R('#5a3818', x, 34, 2, 12); R('#3f2810', x + 1, 34, 1, 12); }); R('#00000030', 2, 44, 44, 2);
    R('#7a5230', 0, 32, 48, 3); R('#5a3818', 0, 35, 48, 1); R('#8a6038', 10, 38, 4, 1); R('#8a6038', 12, 41, 4, 1);      // lantai + tangga kayu
    R(wall, 2, 17, 44, 15); for (let x = 5; x < 46; x += 4) R('#00000022', x, 17, 1, 15); R('#00000030', 2, 17, 44, 1);
    R('#4a2c12', 19, 20, 10, 12); R('#6b3a1a', 20, 21, 8, 11); R('#e8c860', 26, 27, 1, 2);
    [5, 33].forEach(x => { R('#4a2c12', x, 21, 10, 8); R('#8fd0f0', x + 1, 22, 8, 6); R('#ffffff', x + 4, 22, 1, 6); });
    for (let y = 0; y < 17; y++) { const inset = Math.max(0, 11 - y); R(y % 4 === 3 ? roofD : roof, inset, y, 48 - inset * 2 + (y > 12 ? 0 : 0), 1); }
    R('#00000040', 0, 17, 48, 1); R('#d98b6a', 11, 0, 26, 1); }));
  /* ---------- warung 2x2 (32 x 40) ---------- */
  V.warung = [0, 1].map(v => mk(32, 40, R => {
    const a = v ? '#2f8a8a' : '#d8352a';
    R('#e8d8a8', 1, 14, 30, 24); R('#00000022', 1, 14, 30, 1); R('#7a5230', 3, 26, 26, 3); R('#5a3818', 3, 29, 26, 9);
    for (let x = 0; x < 32; x += 4) { R(x % 8 ? '#f6efd8' : a, x, 6, 4, 10); R('#00000028', x, 15, 4, 1); }
    R(a, 0, 4, 32, 3); R('#14301f', 7, 0, 18, 5); R('#f6efd8', 8, 1, 16, 3);
    R('#e8a040', 6, 22, 4, 4); R('#7be08f', 12, 22, 4, 4); R('#d8352a', 18, 22, 4, 4); R('#8a5a2b', 3, 38, 26, 2); }));
  /* ---------- lapak pasar 2x1 (32 x 28), 3 varian ---------- */
  const lapak = (cn, ca, goods) => mk(32, 28, R => {
    for (let x = 0; x < 32; x += 4) { R(x % 8 ? ca : cn, x, 2, 4, 9); R('#00000028', x, 10, 4, 1); } R(cn, 0, 0, 32, 3);
    R('#5a3818', 2, 11, 2, 15); R('#5a3818', 28, 11, 2, 15); R('#00000024', 2, 24, 28, 4);
    R('#7a5230', 1, 16, 30, 4); R('#8a6038', 1, 16, 30, 1); goods.forEach((g, i) => { R(g, 3 + i * 5, 12, 4, 4); R('#00000022', 3 + i * 5, 15, 4, 1); }); });
  V.lapak = [lapak('#d8352a', '#f6efd8', ['#7be08f', '#e8a040', '#d8352a', '#f2d34a', '#7be08f', '#e8a040']), lapak('#2f8a8a', '#f6efd8', ['#b6d870', '#d8352a', '#b6d870', '#e8a040', '#f08aa8', '#7be08f']), lapak('#e0a020', '#8a4a1a', ['#8fd0f0', '#f6efd8', '#8fd0f0', '#7a7e86', '#f6efd8', '#8fd0f0'])];
  V.peti = [mk(16, 16, R => { R('#00000030', 1, 13, 14, 3); R('#a8743a', 1, 4, 14, 10); R('#7a5230', 1, 4, 14, 1); R('#7a5230', 1, 8, 14, 1); R('#5a3818', 1, 13, 14, 1); R('#5a3818', 7, 4, 2, 10); })];
  V.trash = [mk(16, 18, R => { R('#00000030', 2, 15, 12, 3); R('#3a6a4a', 3, 5, 10, 11); R('#2a4a34', 3, 5, 10, 1); R('#4a8a5a', 4, 7, 2, 7); R('#2a4a34', 2, 3, 12, 3); R('#7be08f', 7, 9, 2, 3); })];
  V.pot = [mk(16, 18, R => { R('#00000024', 3, 15, 10, 3); R('#b8603a', 4, 10, 8, 6); R('#8a4020', 4, 10, 8, 1); R('#3f8a2f', 6, 3, 1, 8); R('#4faa3f', 4, 4, 4, 3); R('#4faa3f', 8, 2, 4, 4); R('#f08aa8', 5, 3, 2, 2); })];
  V.laundry = [mk(32, 26, R => { R('#5a3818', 2, 4, 2, 22); R('#5a3818', 28, 4, 2, 22); R('#cfcfcf', 2, 5, 28, 1); R('#00000022', 2, 24, 28, 2);
    R('#e8e0c8', 5, 6, 6, 9); R('#d8352a', 13, 6, 5, 7); R('#3f6fb0', 20, 6, 7, 10); R('#f2d34a', 9, 6, 3, 5); })];
  /* ---------- bangunan besar via generator gedung sekolah ---------- */
  const B = S.mkBuilding, PAL = S.PAL;
  V.pasar_hall = [B(10, 3, Object.assign({}, PAL.green, { wall: '#d9c79a', wallD: '#00000022', trim: '#bfae80', doors: [2, 7], sign: { text: 'PASAR DESA', bg: '#f6efd8' }, plinth: '#a8a090' }))];
  V.puskesmas = [B(8, 3, Object.assign({}, PAL.blue, { wall: '#f6f6f0', wallD: '#00000018', trim: '#cfd8d8', doors: [3, 4], cross: 64, sign: { text: 'PUSKESMAS', bg: '#f6efd8' }, porch: false, plinth: '#c4c8c4' }))];
  V.pemadam = [(() => { const c = B(8, 3, Object.assign({}, PAL.red, { wall: '#ead8c0', wallD: '#00000020', trim: '#cdb89a', doors: [], sign: { text: 'POS PEMADAM', bg: '#f6efd8' }, plinth: '#a8a090' })), g = c.getContext('2d');
    [[6, 52], [70, 52]].forEach(d => { g.fillStyle = '#3a3d44'; g.fillRect(d[0] - 2, 26, d[1] + 4, 27); g.fillStyle = '#8a8d93'; g.fillRect(d[0], 28, d[1], 25);
      for (let y = 30; y < 53; y += 3) { g.fillStyle = '#6c7078'; g.fillRect(d[0], y, d[1], 1); } g.fillStyle = '#d8352a'; g.fillRect(d[0] + d[1] / 2 - 3, 29, 6, 2); }); return c; })()];
  V.ambulance = [mk(32, 24, R => { R('#00000030', 2, 20, 28, 4); R('#f6f6f0', 2, 7, 26, 13); R('#e8e8e0', 24, 9, 7, 11); R('#9ad0f0', 25, 10, 5, 4); R('#d8352a', 2, 14, 26, 2); R('#d8352a', 11, 8, 3, 7); R('#d8352a', 9, 10, 7, 3); R('#3a7aff', 6, 5, 4, 2); R('#ff3a2a', 18, 5, 4, 2); R('#111', 6, 18, 6, 5); R('#111', 22, 18, 6, 5); R('#9a9aa2', 8, 20, 2, 2); R('#9a9aa2', 24, 20, 2, 2); })];
  V.medtent = [mk(48, 44, R => { R('#00000028', 2, 40, 44, 4); R('#f6f6f0', 2, 14, 44, 26); R('#dcdcd4', 2, 14, 44, 2);
    for (let y = 0; y < 14; y++) { const i = Math.max(0, 12 - y); R(y % 3 === 2 ? '#e0e0d8' : '#f6f6f0', i, y, 48 - i * 2, 1); } R('#d8352a', 0, 12, 48, 3); R('#d8352a', 21, 2, 6, 9); R('#d8352a', 18, 5, 12, 3);
    R('#3a3d44', 16, 22, 16, 18); R('#1f2226', 18, 24, 12, 16); R('#9a9aa2', 2, 38, 44, 2); })];
  V.bed = [mk(16, 16, R => { R('#00000028', 1, 13, 14, 3); R('#9aa0a8', 1, 6, 14, 7); R('#f6f6f0', 2, 7, 12, 5); R('#8fd0f0', 2, 7, 5, 5); R('#cfd4d8', 1, 12, 2, 3); R('#cfd4d8', 13, 12, 2, 3); })];
  V.medtable = [mk(16, 16, R => { R('#00000028', 1, 13, 14, 3); R('#cfd4d8', 1, 6, 14, 3); R('#9aa0a8', 2, 9, 2, 5); R('#9aa0a8', 12, 9, 2, 5); R('#d8352a', 4, 3, 4, 3); R('#f6f6f0', 6, 4, 2, 1); R('#7be08f', 10, 3, 3, 3); })];
  V.hosehack = [mk(16, 18, R => { R('#5a3818', 2, 2, 12, 14); R('#c42a1e', 3, 3, 10, 12); for (let i = 0; i < 4; i++) R('#e8e0a0', 5, 5 + i * 3, 6, 1); R('#f6efd8', 6, 1, 4, 2); })];
  /* ---------- vegetasi rawa & kayu tumbang ---------- */
  V.log = [mk(32, 16, R => { R('#00000028', 1, 12, 30, 3); R('#5a3a20', 1, 5, 30, 8); R('#7a5230', 1, 5, 30, 2); R('#3f2810', 1, 11, 30, 2); R('#8a6038', 28, 5, 4, 8); R('#4a3018', 30, 7, 1, 4); R('#3f8a2f', 8, 4, 5, 2); R('#3f8a2f', 18, 5, 4, 1); })];
  V.reed = [0, 1].map(v => mk(16, 20, R => { R('#00000020', 3, 17, 10, 3); [[4, 4], [7, 1], [10, 5], [13, 3]].slice(v).forEach((q, i) => { R(i % 2 ? '#6aa04a' : '#4f8a3a', q[0], q[1] + 4, 1, 14 - q[1]); R('#7a5230', q[0] - 1, q[1] + 1, 3, 4); R('#5a3a20', q[0], q[1], 1, 1); }); R('#4f8a3a', 2, 15, 3, 1); R('#4f8a3a', 10, 16, 4, 1); }));
  V.sluice = [mk(32, 24, R => { R('#00000028', 2, 20, 28, 4); R('#6a6e76', 2, 6, 5, 16); R('#6a6e76', 25, 6, 5, 16); R('#4a4e56', 2, 6, 28, 3); R('#8a8d93', 7, 9, 18, 10); R('#6c7078', 7, 12, 18, 1); R('#6c7078', 7, 15, 18, 1); R('#d8352a', 14, 3, 4, 4); R('#e8c860', 15, 4, 2, 2); })];
  S.props.peatboard = mk(16, 16, R => { R('#5a3818', 3, 9, 2, 6); R('#5a3818', 11, 9, 2, 6); R('#3a2a1c', 1, 1, 14, 9); R('#8a6a48', 2, 2, 12, 7); R('#4faa3f', 3, 3, 4, 3); R('#3a86d0', 8, 3, 4, 2); R('#f6efd8', 3, 7, 9, 1); });
  S.props.healthboard = mk(16, 16, R => { R('#5a3818', 3, 9, 2, 6); R('#5a3818', 11, 9, 2, 6); R('#f6f6f0', 1, 1, 14, 9); R('#d8352a', 7, 2, 2, 7); R('#d8352a', 4, 4, 8, 2); });
  S.props.firerack = mk(16, 16, R => { R('#5a3818', 7, 9, 2, 6); R('#c42a1e', 2, 1, 12, 9); R('#f6efd8', 4, 3, 8, 1); R('#f6efd8', 4, 5, 8, 1); R('#e8e0a0', 4, 7, 5, 1); });
  S.props.pasarboard = mk(16, 16, R => { R('#5a3818', 3, 9, 2, 6); R('#5a3818', 11, 9, 2, 6); R('#2f6a3a', 1, 1, 14, 9); R('#f6efd8', 2, 2, 12, 7); R('#e8a040', 3, 3, 3, 3); R('#d8352a', 7, 3, 3, 3); R('#7be08f', 11, 3, 2, 3); R('#3a3a3a', 3, 7, 9, 1); });
  ['peatboard', 'healthboard', 'firerack', 'pasarboard'].forEach(k => { S.icons[k] = S.props[k]; });
  /* ---------- NPC baru ---------- */
  const base = { skin: '#e0a878', hair: '#2a1a10', shirt: '#4a8a5a', pants: '#2e3340', boot: '#161616', belt: '#c8b060' };
  const NP = {
    pedagang: { shirt: '#6aa04a', pants: '#4a3a28', hair: '#2a1a10', skin: '#d8a070', belt: '#f6efd8' },
    pedagang2: { shirt: '#c05a3a', pants: '#3a3a40', hair: '#1a1a1a', skin: '#c89a70', belt: '#f6efd8' },
    perawat: { shirt: '#f6f6f0', pants: '#4a8a9a', hair: '#1a1a1a', skin: '#e8b890', belt: '#d8352a' },
    dokter: { shirt: '#e8f0f0', pants: '#2a3a4a', hair: '#3a3a3a', skin: '#d8a070', belt: '#8a8d93' },
    damkar: { shirt: '#d8641a', pants: '#2e3340', hat: 'helmet', cap: '#c42a1e', brim: '#8a1a12', band: '#f0e060', belt: '#e8e0a0' },
    warga3: { shirt: '#b84a8a', pants: '#3a3a50', hair: '#3a1a10', skin: '#e0a878', belt: '#c8b060' }
  };
  for (const k of Object.keys(NP)) { S.npc[k] = []; for (let d = 0; d < 4; d++) S.npc[k][d] = S.makePerson(Object.assign({}, base, NP[k]), d); S.icons[k] = S.npc[k][0]; }
  /* ---------- truk pemadam 4 arah (putar 90 derajat dari sprite horizontal) ---------- */
  const rot = (c, a) => { const o = cv(c.height, c.width), g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.translate(o.width / 2, o.height / 2); g.rotate(a); g.drawImage(c, -c.width / 2, -c.height / 2); return o; };
  S.truck4 = { right: S.truck.right, left: S.truck.left, up: S.truck.right.map(c => rot(c, -Math.PI / 2)), down: S.truck.right.map(c => rot(c, Math.PI / 2)) };
})(window.MPH);
