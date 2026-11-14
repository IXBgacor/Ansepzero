/* Placeholder pixel art tambahan (v0.2): NPC, objek interaktif, api, penanda. Digambar lewat Canvas. */
(function (M) {
  const { cv, px } = M.util, S = M.Sprites, D = M.DIR;
  function blob(g, c, cx, cy, rx, ry) { g.fillStyle = c;
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.05) g.fillRect(cx + x, cy + y, 1, 1); }
  function headgear(g, p, r) {
    if (p.hat === 'cap') { r(p.brim, 3, 3, 10, 1); r(p.cap, 5, 0, 6, 3); r(p.band, 5, 2, 6, 1); }
    else if (p.hat === 'helmet') { r(p.brim, 3, 3, 10, 1); r(p.cap, 4, 0, 8, 3); r(p.band, 4, 2, 8, 1); r(p.brim, 7, 1, 2, 1); }   // v0.5²: helm petugas pemadam
    else if (p.hat === 'straw') { r('#c8a040', 2, 3, 12, 1); r('#e0c060', 5, 1, 6, 2); }
    else { r(p.hair, 5, 3, 6, 2); r(p.hair, 4, 4, 1, 3); r(p.hair, 11, 4, 1, 3); }
  }
  function person(p, dir) {
    const c = cv(16, 16), g = c.getContext('2d');
    px(g, 'rgba(0,0,0,.25)', 4, 14, 8, 2);
    const R = (col, x, y, w, h) => px(g, col, x, y, w, h);
    if (dir < 2) {
      R(p.pants, 5, 12, 2, 2); R(p.pants, 9, 12, 2, 2); R(p.boot, 5, 14, 2, 1); R(p.boot, 9, 14, 2, 1);
      R(p.shirt, 4, 8, 8, 4); R(p.belt, 4, 11, 8, 1); R(p.shirt, 3, 8, 1, 3); R(p.shirt, 12, 8, 1, 3); R(p.skin, 3, 11, 1, 1); R(p.skin, 12, 11, 1, 1);
      R(dir === 0 ? p.skin : (p.hair || p.cap), 5, 4, 6, 4);
      if (dir === 0) { R('#222', 6, 5, 1, 1); R('#222', 9, 5, 1, 1); }
      headgear(g, p, R);
    } else {
      const r = (col, x, y, w, h) => px(g, col, dir === 3 ? x : 16 - x - w, y, w, h);
      r(p.pants, 6, 12, 2, 2); r(p.pants, 8, 12, 2, 2); r(p.boot, 6, 14, 3, 1); r(p.boot, 8, 14, 3, 1);
      r(p.shirt, 5, 8, 6, 4); r(p.belt, 5, 11, 6, 1); r(p.shirt, 7, 8, 2, 3); r(p.skin, 7, 11, 2, 1);
      r(p.skin, 5, 4, 6, 4); r('#222', 9, 5, 1, 1);
      headgear(g, p, r);
    }
    return c;
  }
  S.makePerson = person;                                  // v0.4: dipakai sprites_v04.js untuk NPC baru
  const officer = { skin: '#f0c090', hair: '#3a2a1a', shirt: '#3c64b0', pants: '#2b3a5a', boot: '#2a1a0a', belt: '#1c2a46', hat: 'cap', cap: '#25437a', brim: '#1c3260', band: '#f0c030' };
  const warga = { skin: '#e0a878', hair: '#2a1a10', shirt: '#b84a3a', pants: '#4a4a6a', boot: '#3a2410', belt: '#6b4423', hat: 'straw' };
  S.npc = { officer: [], warga: [] };
  for (let d = 0; d < 4; d++) { S.npc.officer[d] = person(officer, d); S.npc.warga[d] = person(warga, d); }

  function fire(f) {
    const c = cv(16, 16), g = c.getContext('2d'), h = f ? 1 : 0;
    blob(g, '#2a2420', 8, 12, 7, 3); blob(g, '#3b3028', 8, 11, 5, 2);
    px(g, '#d8431a', 5, 9, 7, 3); px(g, '#f0902a', 6, 7 - h, 5, 5); px(g, '#f6d040', 7, 8 - h, 3, 3);
    px(g, '#d8431a', 4 + h, 10, 1, 2); px(g, '#d8431a', 11 - h, 10, 1, 2);
    return c;
  }
  S.fire = [fire(0), fire(1)];

  const board = (() => { const c = cv(16, 16), g = c.getContext('2d');
    px(g, 'rgba(0,0,0,.25)', 2, 14, 12, 2); px(g, '#5a3818', 3, 10, 2, 5); px(g, '#5a3818', 11, 10, 2, 5);
    px(g, '#6b4423', 1, 2, 14, 9); px(g, '#e2d3a4', 2, 3, 12, 7);
    px(g, '#8a7a50', 3, 4, 7, 1); px(g, '#8a7a50', 3, 6, 9, 1); px(g, '#8a7a50', 3, 8, 6, 1); px(g, '#4ea03a', 11, 4, 2, 2); return c; })();
  const soil = (() => { const c = cv(16, 16), g = c.getContext('2d');
    blob(g, '#9a7048', 8, 12, 7, 3); blob(g, '#b08050', 7, 11, 5, 2);
    px(g, '#5a3a1a', 4, 12, 3, 1); px(g, '#5a3a1a', 7, 13, 1, 1); px(g, '#5a3a1a', 9, 11, 3, 1); px(g, '#5a3a1a', 11, 12, 1, 2);
    px(g, '#5a3818', 7, 4, 2, 8); px(g, '#6b4423', 3, 1, 10, 5); px(g, '#c28d52', 4, 2, 8, 3); px(g, '#4a2c12', 6, 3, 4, 1); px(g, '#4a2c12', 7, 4, 2, 1); return c; })();
  const campfire = (() => { const c = cv(16, 16), g = c.getContext('2d');
    [[3, 10], [5, 8], [8, 7], [11, 8], [13, 10], [11, 13], [8, 14], [5, 13]].forEach(([x, y]) => { px(g, '#6e7178', x - 1, y - 1, 3, 3); px(g, '#8a8d93', x - 1, y - 1, 3, 2); });
    px(g, '#3a3835', 5, 9, 6, 4); px(g, '#6a6660', 6, 10, 2, 1); px(g, '#6a6660', 9, 12, 1, 1); return c; })();
  const sign = (() => { const c = cv(16, 16), g = c.getContext('2d');
    px(g, 'rgba(0,0,0,.25)', 4, 14, 8, 2); px(g, '#5a3818', 7, 10, 2, 5);
    for (let y = 1; y <= 10; y++) { const hw = Math.round((y - 1) * 7 / 9); px(g, '#d8352a', 7 - hw, y, hw * 2 + 2, 1); if (y > 3 && hw > 1) px(g, '#f6d040', 8 - hw + 1, y, hw * 2 - 2, 1); }
    px(g, '#3a1a10', 7, 5, 2, 3); px(g, '#3a1a10', 7, 9, 2, 1); return c; })();
  S.props = { board, soil, campfire, sign };

  S.marker = (() => { const c = cv(10, 10), g = c.getContext('2d');
    blob(g, '#7a4a08', 5, 5, 4, 4); blob(g, '#f2c230', 5, 5, 3, 3); px(g, '#4a2a08', 4, 2, 2, 4); px(g, '#4a2a08', 4, 7, 2, 1); return c; })();
  S.arrow = (() => { const c = cv(8, 5), g = c.getContext('2d');
    px(g, '#000', 0, 0, 8, 2); px(g, '#000', 1, 2, 6, 1); px(g, '#000', 2, 3, 4, 1);
    px(g, '#fff', 1, 0, 6, 1); px(g, '#fff', 2, 1, 4, 1); px(g, '#fff', 3, 2, 2, 1); return c; })();
  S.icons = { officer: S.npc.officer[0], warga: S.npc.warga[0], board, soil, campfire, sign, smoke: S.fire[0] };
})(window.MPH);
