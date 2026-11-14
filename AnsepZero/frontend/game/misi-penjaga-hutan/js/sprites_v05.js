/* Sprite v0.5² (placeholder pixel art lewat Canvas): petugas pemadam (4 arah, 3 variasi) dan mobil pemadam (2 arah, 2 bingkai lampu). Dipakai cutscene misi terakhir. */
(function (M) {
  const { cv, px } = M.util, S = M.Sprites;
  const base = { skin: '#e0a878', hair: '#2a1a10', shirt: '#d8641a', pants: '#2e3340', boot: '#161616', belt: '#e8e0a0', hat: 'helmet', cap: '#c42a1e', brim: '#8a1a12', band: '#f0e060' };
  const variants = [base, Object.assign({}, base, { skin: '#f0c090', hair: '#3a2a1a', cap: '#e0c030', brim: '#a88a18', band: '#c42a1e' }), Object.assign({}, base, { skin: '#b9825a', shirt: '#c8501a' })];
  S.fighter = variants.map(v => [0, 1, 2, 3].map(d => S.makePerson(v, d)));

  function truckFrame(f) {
    const c = cv(46, 24), g = c.getContext('2d'), R = (col, x, y, w, h) => px(g, col, x, y, w, h);
    R('rgba(0,0,0,.28)', 3, 21, 40, 3);
    R('#b0221a', 2, 8, 28, 10); R('#d8352a', 2, 7, 28, 2); R('#c8281e', 30, 5, 13, 13); R('#d8352a', 30, 4, 13, 2);          // bak + kabin
    R('#e8e8e8', 2, 12, 41, 1); R('#8a8d93', 3, 3, 26, 2); for (let x = 5; x < 28; x += 3) R('#5c5f66', x, 3, 1, 2);          // garis putih + tangga di atap
    R('#7f1a14', 6, 9, 7, 7); R('#7f1a14', 16, 9, 7, 7); R('#a82018', 7, 10, 5, 5); R('#a82018', 17, 10, 5, 5);               // pintu kompartemen
    R('#9ad0f0', 35, 6, 6, 5); R('#d8f0ff', 36, 7, 2, 2); R('#d0d0d4', 42, 15, 3, 3); R('#ffe070', 43, 12, 2, 2);               // kaca, bemper, lampu depan
    R(f ? '#3a7aff' : '#ff3a2a', 32, 2, 4, 2); R(f ? '#ff3a2a' : '#3a7aff', 37, 2, 4, 2);                                       // lampu rotator (2 bingkai)
    [[9, 19], [35, 19]].forEach(([x, y]) => { R('#111', x - 3, y - 3, 7, 6); R('#2a2a2e', x - 2, y - 4, 5, 8); R('#9a9aa2', x, y - 1, 2, 2); });
    return c;
  }
  const mirror = c => { const m = cv(c.width, c.height), g = m.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return m; };
  const tr = [truckFrame(0), truckFrame(1)];
  S.truck = { right: tr, left: tr.map(mirror), w: 46, h: 24 };
})(window.MPH);
