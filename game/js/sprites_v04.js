/* Placeholder pixel art v0.4: 7 NPC baru, 22 objek, 2 tampilan area bahaya. Digambar lewat Canvas (tanpa file gambar). */
(function (M) {
  const { cv, px } = M.util, S = M.Sprites;
  function blob(g, c, cx, cy, rx, ry) { g.fillStyle = c;
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.05) g.fillRect(cx + x, cy + y, 1, 1); }
  const prop = fn => { const c = cv(16, 16), g = c.getContext('2d'); px(g, 'rgba(0,0,0,.22)', 2, 14, 12, 2); fn(g, (col, x, y, w, h) => px(g, col, x, y, w, h)); return c; };

  /* ---- NPC (memakai generator orang dari sprites_v02) ---- */
  const base = { belt: '#3a2a1a', boot: '#2a1a0a' };
  const P = {
    sari:  Object.assign({ skin: '#e8b890', hair: '#1a1a1a', shirt: '#8a3fa0', pants: '#3a3a5a', belt: '#5a2a70' }, { boot: base.boot }),
    rina:  Object.assign({ skin: '#d8a070', hair: '#3a2010', shirt: '#d8a030', pants: '#5a3a2a', belt: '#8a6a20' }, { boot: base.boot }),
    karto: Object.assign({ skin: '#c89060', hat: 'straw', shirt: '#4a8a5a', pants: '#5a4a3a', belt: '#2a5a3a' }, { boot: base.boot }),
    dina:  Object.assign({ skin: '#f0c090', hair: '#2a1a10', shirt: '#e05a7a', pants: '#3a4a7a', belt: '#a03a5a' }, { boot: base.boot }),
    bima:  Object.assign({ skin: '#e0a878', hat: 'cap', cap: '#d8721a', brim: '#a0500e', band: '#f6efd8', shirt: '#556b2f', pants: '#3a3a2a', belt: '#2a3a1a' }, { boot: base.boot }),
    hadi:  Object.assign({ skin: '#d8a070', hair: '#2a1a10', shirt: '#f0f0f0', pants: '#3a5a7a', belt: '#8a9aa0' }, { boot: base.boot }),
    lurah: Object.assign({ skin: '#d8a070', hat: 'cap', cap: '#1a1a1a', brim: '#1a1a1a', band: '#d8b030', shirt: '#7a5230', pants: '#2a2a2a', belt: '#3a2410' }, { boot: base.boot })
  };
  for (const k of Object.keys(P)) { S.npc[k] = []; for (let d = 0; d < 4; d++) S.npc[k][d] = S.makePerson(P[k], d); }

  /* ---- Objek interaktif ---- */
  const props = {
    bigtree: prop((g, R) => { R('#5a3818', 6, 8, 4, 7); R('#7a4f26', 6, 8, 1, 7); blob(g, '#1f5e22', 8, 5, 7, 5); blob(g, '#2f7d2e', 7, 4, 5, 3); R('#4ea03a', 4, 2, 3, 1); }),
    nest: prop((g, R) => { R('#5a3818', 1, 9, 14, 2); R('#7a4f26', 1, 9, 14, 1); blob(g, '#a88040', 8, 8, 4, 2); R('#c8a060', 5, 8, 6, 1); R('#e8e0c8', 7, 6, 1, 2); R('#e8e0c8', 9, 6, 1, 2); R('#4ea03a', 2, 6, 2, 3); R('#4ea03a', 12, 6, 2, 3); }),
    tracks: prop((g, R) => { blob(g, '#b08050', 8, 10, 7, 3); [[4, 9], [7, 11], [10, 9], [12, 11]].forEach(([x, y]) => { R('#5a3a1a', x, y, 2, 2); R('#5a3a1a', x - 1, y - 1, 1, 1); R('#5a3a1a', x + 2, y - 1, 1, 1); }); }),
    peat: prop((g, R) => { blob(g, '#3a2a1c', 8, 10, 7, 4); blob(g, '#2a1c12', 7, 9, 5, 2); R('#4a6f8a', 10, 9, 3, 1); R('#6a5a40', 4, 11, 2, 1); R('#5a3818', 7, 2, 2, 7); R('#e8e0c8', 5, 1, 6, 3); R('#8a7a50', 6, 2, 4, 1); }),
    canal: prop((g, R) => { R('#6b4a2a', 0, 7, 16, 7); R('#3f7fb0', 1, 8, 14, 5); R('#6fb0e0', 3, 9, 4, 1); R('#6fb0e0', 10, 11, 3, 1); R('#7a4f26', 7, 6, 3, 8); R('#9a6a36', 7, 6, 1, 8); }),
    riverside: prop((g, R) => { R('#5a3818', 7, 6, 2, 9); R('#2f7fd0', 2, 1, 12, 6); R('#6b4423', 2, 1, 12, 1); R('#6b4423', 2, 6, 12, 1); R('#cfe8ff', 4, 3, 3, 1); R('#cfe8ff', 8, 4, 4, 1); R('#2f7fd0', 1, 12, 3, 2); }),
    seedling: prop((g, R) => { blob(g, '#6b4423', 8, 12, 5, 2); R('#3f8a2f', 7, 5, 2, 8); blob(g, '#6bb84a', 5, 6, 2, 1); blob(g, '#4ea03a', 11, 5, 2, 1); blob(g, '#6bb84a', 8, 3, 2, 2); }),
    weather: prop((g, R) => { R('#8a8d93', 7, 3, 2, 12); R('#e8e8e8', 4, 6, 8, 5); R('#b0b4ba', 5, 7, 6, 1); R('#b0b4ba', 5, 9, 6, 1); R('#d8352a', 9, 1, 5, 2); R('#d8352a', 13, 0, 1, 4); }),
    drygrass: prop((g, R) => { blob(g, '#9a7048', 8, 12, 6, 2); [[3, 11, 6], [5, 10, 8], [7, 9, 9], [9, 10, 8], [11, 11, 6], [13, 12, 5]].forEach(([x, y, h]) => { R('#c8a040', x, y - h + 4, 1, h); R('#e0c060', x + 1, y - h + 6, 1, h - 3); }); }),
    butt: prop((g, R) => { blob(g, '#b08050', 8, 11, 6, 3); R('#f2f2f2', 5, 10, 5, 2); R('#d8a040', 4, 10, 1, 2); R('#f0902a', 10, 10, 2, 2); R('#aaaaaa', 11, 7, 1, 2); R('#cccccc', 12, 5, 1, 2); R('#aaaaaa', 11, 3, 1, 1); }),
    burnpile: prop((g, R) => { blob(g, '#3a3835', 8, 11, 6, 3); blob(g, '#6a6660', 7, 10, 4, 2); R('#2a2420', 3, 8, 6, 1); R('#2a2420', 8, 7, 5, 1); R('#2a2420', 5, 6, 1, 3); R('#8a8d93', 11, 12, 2, 1); }),
    warnboard: prop((g, R) => { R('#5a3818', 3, 10, 2, 5); R('#5a3818', 11, 10, 2, 5); R('#6b4423', 1, 1, 14, 10); R('#2a3a2a', 2, 2, 12, 8); R('#4ea03a', 3, 3, 10, 1); R('#f2d34a', 3, 5, 10, 1); R('#f0902a', 3, 7, 10, 1); R('#d8352a', 3, 9, 10, 1); }),
    airboard: prop((g, R) => { R('#5a3818', 7, 10, 2, 5); R('#1c2a46', 1, 1, 14, 9); R('#e2d3a4', 2, 2, 12, 2); R('#4ea03a', 3, 6, 2, 3); R('#f2d34a', 6, 5, 2, 4); R('#f0902a', 9, 4, 2, 5); R('#d8352a', 12, 3, 2, 6); }),
    school: prop((g, R) => { R('#e8d8a8', 2, 7, 12, 7); R('#b84a3a', 1, 4, 14, 3); R('#8a2a1a', 1, 6, 14, 1); R('#6b4423', 7, 10, 3, 4); R('#7fc4e8', 3, 8, 3, 3); R('#7fc4e8', 11, 8, 2, 3); R('#5a3818', 8, 0, 1, 4); R('#d8352a', 9, 0, 3, 2); }),
    market: prop((g, R) => { R('#6b4423', 2, 7, 12, 7); R('#d8352a', 1, 3, 14, 4); R('#f2f2f2', 3, 3, 2, 4); R('#f2f2f2', 7, 3, 2, 4); R('#f2f2f2', 11, 3, 2, 4); R('#4ea03a', 3, 8, 3, 2); R('#f0902a', 7, 8, 3, 2); R('#d8352a', 11, 8, 2, 2); R('#a07040', 3, 11, 10, 2); }),
    clinic: prop((g, R) => { R('#f0f0f0', 2, 6, 12, 8); R('#3c64b0', 1, 3, 14, 3); R('#6b4423', 11, 9, 2, 5); R('#2f9a58', 6, 7, 2, 5); R('#2f9a58', 4, 9, 6, 2); R('#7fc4e8', 3, 8, 2, 2); }),
    poster: prop((g, R) => { R('#5a3818', 7, 9, 2, 6); R('#6b4423', 2, 1, 12, 9); R('#f6efd8', 3, 2, 10, 7); R('#d8352a', 4, 3, 8, 2); R('#3a3a3a', 4, 6, 6, 1); R('#3a3a3a', 4, 8, 4, 1); R('#4ea03a', 10, 6, 2, 2); }),
    compost: prop((g, R) => { R('#6b4423', 2, 7, 12, 7); R('#4a2c12', 3, 8, 10, 5); blob(g, '#4f7f35', 8, 7, 5, 2); R('#6bb84a', 5, 5, 2, 2); R('#c8a040', 9, 5, 2, 1); R('#8a5a2b', 2, 7, 12, 1); }),
    phone: prop((g, R) => { R('#3c64b0', 3, 7, 10, 7); R('#25437a', 3, 7, 10, 1); R('#e8e8e8', 5, 9, 6, 2); R('#222', 8, 1, 1, 6); R('#d8352a', 7, 0, 3, 2); R('#f6d040', 4, 12, 2, 1); R('#4ea03a', 8, 12, 2, 1); }),
    tower: prop((g, R) => { R('#6b4423', 3, 7, 2, 8); R('#6b4423', 11, 7, 2, 8); R('#8a5a2b', 5, 10, 6, 1); R('#8a5a2b', 2, 5, 12, 3); R('#b84a3a', 2, 2, 12, 3); R('#8a2a1a', 4, 1, 8, 1); R('#7fc4e8', 5, 5, 6, 2); }),
    landmark: prop((g, R) => { R('#b8b8b8', 6, 3, 4, 11); R('#d8d8d8', 6, 3, 1, 11); R('#f2c230', 6, 6, 4, 3); R('#3a3a3a', 7, 7, 2, 1); R('#4ea03a', 4, 12, 2, 2); R('#4ea03a', 10, 12, 2, 2); }),
    seedbed: prop((g, R) => { R('#6b4423', 1, 8, 14, 6); R('#4a2c12', 2, 9, 12, 4); [3, 6, 9, 12].forEach((x, i) => { R('#3f8a2f', x, 6 - (i % 2), 1, 4); R('#6bb84a', x - 1, 5 - (i % 2), 3, 2); }); }),
    scenario: prop((g, R) => { R('#5a3818', 3, 10, 2, 5); R('#5a3818', 11, 10, 2, 5); R('#6b4423', 1, 1, 14, 10); R('#f0902a', 2, 2, 12, 2); R('#f6efd8', 2, 4, 12, 6); R('#3a3a3a', 4, 5, 3, 1); R('#3a3a3a', 4, 7, 6, 1); R('#d8352a', 10, 5, 2, 3); }),
    burnt: prop((g, R) => { blob(g, '#1c1a18', 8, 11, 7, 3); blob(g, '#2a2420', 7, 10, 5, 2); R('#2a2420', 3, 4, 2, 7); R('#3a3228', 3, 4, 1, 7); R('#2a2420', 10, 3, 2, 8); R('#3a3228', 10, 3, 1, 8); R('#4a4640', 6, 12, 3, 1); }),
    peatpatch: prop((g, R) => { blob(g, '#2a2018', 8, 11, 7, 3); blob(g, '#3a2a1c', 7, 10, 5, 2); R('#6a5a40', 4, 11, 2, 1); R('#6a5a40', 10, 10, 2, 1); R('#8a8d93', 7, 8, 2, 1); })
  };
  Object.assign(S.props, props);

  /* ---- Ikon dialog (16x16) ---- */
  Object.keys(P).forEach(k => { S.icons[k] = S.npc[k][0]; });
  Object.keys(props).forEach(k => { S.icons[k] = props[k]; });
  S.icons.smoke2 = S.fire[0]; S.icons.flame = S.fire[0]; S.icons.burned = props.burnt; S.icons.peatsmoke = props.peatpatch;
})(window.MPH);
