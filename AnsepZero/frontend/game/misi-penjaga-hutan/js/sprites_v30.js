/* Sprite v3.0 (Canvas pixel art): kendaraan yang bisa dikendarai — traktor, ambulans, mobil pemadam. S.veh[tipe][arah][bingkai] (arah: 0 bawah, 1 atas, 2 kiri, 3 kanan).
   Samping (kiri/kanan) dan atas (bawah/atas) digambar terpisah agar proporsinya benar; bingkai 2 = lampu rotator/asap berganti. */
(function (M) {
  'use strict';
  const { cv, px } = M.util, S = M.Sprites;
  const mk = (w, h, fn) => { const c = cv(w, h), g = c.getContext('2d'); fn((col, x, y, ww, hh) => px(g, col, x, y, ww || 1, hh || 1), g); return c; };
  const mirror = c => { const m = cv(c.width, c.height), g = m.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return m; };
  const flipV = c => { const m = cv(c.width, c.height), g = m.getContext('2d'); g.translate(0, c.height); g.scale(1, -1); g.drawImage(c, 0, 0); return m; };
  const set = (side, top) => ({ 3: side, 2: side.map(mirror), 0: top, 1: top.map(flipV) });
  /* ---------- traktor ---------- */
  const tSide = f => mk(30, 24, R => {
    R('#00000030', 3, 21, 24, 3);
    R('#1a1a1a', 4, 8, 7, 14); R('#1a1a1a', 2, 10, 11, 10); R('#3a3a3a', 5, 11, 5, 8); R('#9a9a9a', f ? 7 : 6, 13, 1, 4);                  // roda belakang besar
    R('#1a1a1a', 22, 14, 6, 8); R('#4a4a4a', 24, 16, 2, 4);                                                                           // roda depan kecil
    R('#2f8a3a', 10, 13, 8, 7); R('#2f8a3a', 17, 10, 11, 9); R('#46b04a', 17, 10, 11, 2); R('#222', 28, 12, 2, 6); R('#ffe070', 28, 11, 2, 1);   // bodi + kap mesin + grill + lampu
    R('#2a2a2a', 9, 9, 6, 3); R('#5a5a5a', 8, 5, 1, 6); R('#5a5a5a', 15, 5, 1, 6); R('#d8352a', 6, 3, 12, 3); R('#a82018', 6, 5, 12, 1);       // kursi + kanopi
    R('#555', 23, 4, 2, 7); R('#999', 23, 3, 2, 1); if (f) { R('#cfcfcf', 24, 1, 2, 2); R('#e0e0e0', 25, 0, 1, 1); } else R('#cfcfcf', 23, 1, 2, 1); });
  const tTop = f => mk(22, 30, R => {
    R('#00000028', 3, 27, 16, 3);
    R('#1a1a1a', 0, 3, 5, 12); R('#1a1a1a', 17, 3, 5, 12); R('#3a3a3a', 1, 5, 3, 8); R('#3a3a3a', 18, 5, 3, 8); R('#1a1a1a', 3, 21, 3, 7); R('#1a1a1a', 16, 21, 3, 7);
    R('#2f8a3a', 5, 3, 12, 25); R('#46b04a', 7, 16, 8, 11); R('#2b7a34', 10, 16, 2, 11); R('#222', 8, 27, 6, 2); R('#ffe070', 7, 27, 2, 1); R('#ffe070', 13, 27, 2, 1);
    R('#d8352a', 3, 1, 16, 12); R('#a82018', 3, 1, 16, 1); R('#e8604a', 4, 2, 14, 1); R('#2a2a2a', 9, 6, 4, 4);
    R('#555', 15, 17, 2, 3); R(f ? '#cfcfcf' : '#999', 15, f ? 14 : 15, 2, 2); });
  S.veh = { tractor: set([tSide(0), tSide(1)], [tTop(0), tTop(1)]) };
  /* ---------- ambulans ---------- */
  const aSide = f => mk(38, 24, R => {
    R('#00000030', 3, 21, 32, 3); R('#f6f6f0', 2, 5, 26, 14); R('#dcdcd4', 2, 5, 26, 1); R('#e8e8e0', 28, 8, 9, 11); R('#9ad0f0', 30, 9, 6, 5); R('#cfe8f6', 31, 10, 2, 2);
    R('#d8352a', 2, 13, 35, 2); R('#d8352a', 12, 7, 3, 7); R('#d8352a', 10, 9, 7, 3); R(f ? '#3a7aff' : '#ff3a2a', 8, 3, 5, 2); R(f ? '#ff3a2a' : '#3a7aff', 18, 3, 5, 2);
    R('#111', 6, 17, 7, 6); R('#111', 26, 17, 7, 6); R('#9a9aa2', 8, 19, 2, 2); R('#9a9aa2', 28, 19, 2, 2); R('#ffe070', 36, 15, 2, 2); });
  const aTop = f => mk(24, 40, R => {
    R('#00000028', 3, 37, 18, 3); R('#f6f6f0', 2, 2, 20, 34); R('#dcdcd4', 2, 2, 20, 1);
    R('#d8352a', 10, 9, 4, 14); R('#d8352a', 5, 14, 14, 4); R(f ? '#3a7aff' : '#ff3a2a', 3, 27, 7, 2); R(f ? '#ff3a2a' : '#3a7aff', 14, 27, 7, 2);
    R('#e8e8e0', 3, 29, 18, 7); R('#9ad0f0', 4, 31, 16, 4); R('#cfe8f6', 5, 32, 5, 1);
    R('#111', 0, 5, 3, 9); R('#111', 21, 5, 3, 9); R('#111', 0, 26, 3, 9); R('#111', 21, 26, 3, 9); R('#ffe070', 3, 36, 3, 1); R('#ffe070', 18, 36, 3, 1); });
  S.veh.ambulance = set([aSide(0), aSide(1)], [aTop(0), aTop(1)]);
  /* ---------- mobil pemadam (samping memakai sprite truk cutscene) ---------- */
  const fTop = f => mk(26, 48, R => {
    R('#00000028', 3, 45, 20, 3); R('#b0221a', 2, 2, 22, 42); R('#d8352a', 2, 2, 22, 2);
    R('#8a8d93', 10, 6, 6, 26); for (let y = 7; y < 32; y += 3) R('#5c5f66', 10, y, 6, 1);
    R('#7f1a14', 3, 8, 5, 9); R('#7f1a14', 18, 8, 5, 9); R('#7f1a14', 3, 19, 5, 9); R('#7f1a14', 18, 19, 5, 9); R('#e8e8e8', 2, 31, 22, 1);
    R('#c8281e', 2, 33, 22, 12); R('#9ad0f0', 4, 39, 18, 4); R('#cfe8f6', 5, 40, 5, 1); R(f ? '#3a7aff' : '#ff3a2a', 5, 35, 6, 2); R(f ? '#ff3a2a' : '#3a7aff', 15, 35, 6, 2);
    R('#111', 0, 7, 3, 10); R('#111', 23, 7, 3, 10); R('#111', 0, 33, 3, 10); R('#111', 23, 33, 3, 10); R('#ffe070', 3, 45, 4, 1); R('#ffe070', 19, 45, 4, 1); });
  const fSide = S.truck.right;
  S.veh.firetruck = set(fSide, [fTop(0), fTop(1)]);
  /* ---------- helikopter damkar (tampak atas; dasar menghadap atas, diputar kelipatan 90 derajat) ---------- */
  const heliBase = f => mk(46, 46, (R, g) => {
    R('#444', 14, 14, 2, 19); R('#444', 30, 14, 2, 19); R('#555', 14, 18, 18, 1); R('#555', 14, 28, 18, 1);                               // ski pendarat + palang
    R('#b0221a', 22, 33, 3, 11); R('#d8352a', 22, 33, 1, 11); R('#b0221a', 19, 41, 9, 2); R('#e8e8e8', 20, 41, 7, 1); R('#555', 26, 38, 1, 5);   // ekor, sirip, rotor ekor
    R('#c42a1e', 17, 13, 12, 20); R('#d8352a', 18, 10, 10, 4); R('#d8352a', 19, 8, 8, 3); R('#b0221a', 17, 30, 12, 3); R('#d8352a', 18, 14, 4, 17); // badan merah
    R('#9ad0f0', 19, 9, 8, 5); R('#cfe8f6', 20, 10, 3, 2); R('#6aa0c0', 19, 13, 8, 1);                                                   // kaca kokpit
    R('#f6f6f0', 17, 21, 12, 2); R('#f6f6f0', 20, 25, 6, 1); R(f % 2 ? '#3a7aff' : '#ff3a2a', 21, 15, 4, 1);                           // garis putih + lampu
    R('#7a7e86', 19, 34, 8, 4); R('#e8a020', 21, 34, 4, 3);                                                                              // tangki air (bucket) di bawah perut
    g.globalAlpha = 0.16; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(23, 21, 21, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;       // cakram baling-baling
    const a = f * Math.PI / 4 + 0.3; for (let s = 0; s < 2; s++) { const ang = a + s * Math.PI; for (let t = 1; t <= 21; t += 0.7) { R('#2a2a2a', 23 + Math.cos(ang) * t, 21 + Math.sin(ang) * t, 1, 1); if (t > 14) R('#d8352a', 23 + Math.cos(ang) * t, 21 + Math.sin(ang) * t, 1, 1); } }
    R('#222', 22, 20, 3, 3); R('#888', 23, 21, 1, 1);                                                                                    // poros
  });
  const rotC = (c, a) => { const o = cv(c.width, c.height), g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.translate(o.width / 2, o.height / 2); g.rotate(a); g.drawImage(c, -c.width / 2, -c.height / 2); return o; };
  const hb = [0, 1, 2, 3].map(heliBase);
  S.veh.heli = { 1: hb, 3: hb.map(c => rotC(c, Math.PI / 2)), 0: hb.map(c => rotC(c, Math.PI)), 2: hb.map(c => rotC(c, -Math.PI / 2)) };
  S.veh.size = { tractor: { 0: [22, 30], 1: [22, 30], 2: [30, 24], 3: [30, 24] }, ambulance: { 0: [24, 40], 1: [24, 40], 2: [38, 24], 3: [38, 24] }, firetruck: { 0: [26, 48], 1: [26, 48], 2: [46, 24], 3: [46, 24] }, heli: { 0: [46, 46], 1: [46, 46], 2: [46, 46], 3: [46, 46] } };
})(window.MPH);
