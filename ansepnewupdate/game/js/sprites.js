/* Placeholder pixel art yang digambar lewat Canvas (belum ada file gambar).
   Nanti cukup ganti isi M.Sprites dengan drawImage dari spritesheet PNG. */
(function (M) {
  const T = M.C.TILE;
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const rng = s => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const px = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  function blob(g, c, cx, cy, rx, ry) {
    g.fillStyle = c;
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++)
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.05) g.fillRect(cx + x, cy + y, 1, 1);
  }

  function grass(seed, flower) {
    const c = cv(T, T), g = c.getContext('2d'), R = rng(seed);
    px(g, '#4f9d3a', 0, 0, T, T);
    for (let i = 0; i < 9; i++) px(g, R() < .5 ? '#3f8a2f' : '#6bb84a', R() * T | 0, R() * T | 0, 1, R() < .5 ? 2 : 1);
    if (flower) { const f = flower === 1 ? '#f2d34a' : '#f08aa8'; px(g, f, 5 + (R() * 6 | 0), 5 + (R() * 6 | 0), 2, 2); }
    return c;
  }
  function dirt(seed) {
    const c = cv(T, T), g = c.getContext('2d'), R = rng(seed);
    px(g, '#b08050', 0, 0, T, T);
    for (let i = 0; i < 10; i++) px(g, R() < .5 ? '#8f6538' : '#c99a68', R() * T | 0, R() * T | 0, 2, 1);
    return c;
  }
  function water(f) {
    const c = cv(T, T), g = c.getContext('2d');
    px(g, '#2f7fd0', 0, 0, T, T);
    for (let r = 0; r < 4; r++) { const y = r * 4 + 1, o = (f * 4 + r * 5) % T; px(g, '#8cc8f5', o, y, 4, 1); px(g, '#8cc8f5', (o + 8) % T, y + 2, 3, 1); }
    return c;
  }
  function bridge() {
    const c = cv(T, T), g = c.getContext('2d');
    px(g, '#a8743c', 0, 0, T, T);
    for (let x = 0; x < T; x += 4) { px(g, '#7a5128', x + 3, 0, 1, T); px(g, '#c28d52', x, 2, 2, 1); }
    px(g, '#4a2c12', 0, 0, T, 2); px(g, '#4a2c12', 0, T - 2, T, 2);
    return c;
  }
  function tree() {
    const c = cv(T, 24), g = c.getContext('2d');
    px(g, '#5a3818', 6, 16, 4, 8); px(g, '#7a4f26', 6, 16, 1, 8);
    blob(g, '#1f5e22', 8, 11, 8, 8); blob(g, '#2f7d2e', 7, 9, 6, 6); blob(g, '#4ea03a', 5, 6, 3, 2);
    return c;
  }
  function rock() {
    const c = cv(T, T), g = c.getContext('2d');
    px(g, 'rgba(0,0,0,.25)', 2, 13, 12, 2);
    blob(g, '#6e7178', 8, 9, 6, 5); blob(g, '#8a8d93', 7, 8, 5, 4); blob(g, '#b3b6bb', 5, 6, 2, 1);
    return c;
  }

  /* Karakter penjaga hutan: 4 arah x 4 frame (diam, langkah A, diam, langkah B). */
  function ranger(dir, f) {
    const c = cv(16, 16), g = c.getContext('2d');
    const A = f === 1, B = f === 3;
    const SK = '#f0c090', UN = '#4f7f35', HAT = '#3b5a2a', BT = '#4a2f1a', PK = '#8a5a2b';
    px(g, 'rgba(0,0,0,.25)', 4, 14, 8, 2);
    if (dir < 2) {                                  // depan / belakang
      px(g, '#3b4a2a', 5, 12, 2, A ? 1 : 2); px(g, '#3b4a2a', 9, 12, 2, B ? 1 : 2);
      px(g, BT, 5, A ? 13 : 14, 2, 1); px(g, BT, 9, B ? 13 : 14, 2, 1);
      if (dir === 1) px(g, PK, 5, 8, 6, 4);
      px(g, UN, 4, 8, 8, 4); px(g, '#6b4423', 4, 11, 8, 1);
      px(g, UN, 3, 8 + (B ? 1 : 0), 1, 3); px(g, UN, 12, 8 + (A ? 1 : 0), 1, 3);
      px(g, SK, 3, 11 + (B ? 1 : 0), 1, 1); px(g, SK, 12, 11 + (A ? 1 : 0), 1, 1);
      px(g, dir === 0 ? SK : '#4a2f1a', 5, 4, 6, 4);
      if (dir === 0) { px(g, '#222', 6, 5, 1, 1); px(g, '#222', 9, 5, 1, 1); }
      px(g, HAT, 3, 3, 10, 1); px(g, '#4f7f35', 5, 0, 6, 3); px(g, '#6b4423', 5, 2, 6, 1);
    } else {                                        // samping (kiri = cermin kanan)
      const s = dir === 3 ? 1 : -1, cx = x => dir === 3 ? x : 15 - x;
      const r = (col, x, y, w, h) => px(g, col, dir === 3 ? x : 16 - x - w, y, w, h);
      const o1 = A ? 1 : B ? -1 : 0;
      r('#3b4a2a', 6 + o1, 12, 2, 2); r('#3b4a2a', 8 - o1, 12, 2, 2);
      r(BT, 6 + o1, 14, 3, 1); r(BT, 8 - o1, 14, 3, 1);
      r(PK, 3, 8, 3, 4); r(UN, 5, 8, 6, 4); r('#6b4423', 5, 11, 6, 1);
      r(UN, 7 - o1, 8, 2, 3); r(SK, 7 - o1, 11, 2, 1);
      r(SK, 5, 4, 6, 4); r('#222', 9, 5, 1, 1);
      r(HAT, 3, 3, 10, 1); r('#4f7f35', 5, 0, 6, 3); r('#6b4423', 5, 2, 6, 1);
    }
    return c;
  }

  const S = { grass: [grass(1), grass(2), grass(3), grass(4, 1), grass(5, 2)], dirt: [dirt(11), dirt(12), dirt(13)],
              water: [water(0), water(1)], bridge: bridge(), tree: tree(), rock: rock(), player: [] };
  for (let d = 0; d < 4; d++) { S.player[d] = []; for (let f = 0; f < 4; f++) S.player[d][f] = ranger(d, f); }
  M.Sprites = S; M.util = { cv, rng, px };
})(window.MPH);
