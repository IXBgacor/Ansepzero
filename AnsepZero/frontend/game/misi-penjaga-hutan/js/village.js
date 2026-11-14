/* Desa Rimba Asri v0.6 — tata letak desa di sisi timur peta (x 36-63) + area titik kumpul di selatan.
   Peta lama (x 0-35, y 0-25) tidak berubah: pohon/batu lama dibangkitkan dengan RNG yang sama. Gerbang desa = jalan tanah baris 12-13 yang kini menembus tepi timur lama.
   Semua koordinat dalam petak. Dipanggil oleh map.js saat build(). Data layout juga diekspor (M.Village) untuk evakuasi, cutscene, dan uji. */
(function (M) {
  const TL = M.T;
  const L = {
    plaza: [45, 11, 54, 16], assembly: [44, 28, 56, 33], fieldA: [36, 24, 43, 26], fieldB: [54, 24, 61, 26],
    roadsNS: [[49, 7, 50, 10], [49, 17, 50, 27]],
    houses: [[39, 9, 0], [42, 9, 2], [39, 16, 1], [41, 19, 0], [45, 19, 1], [53, 19, 2], [57, 9, 1], [57, 16, 0], [57, 20, 2], [38, 21, 1]],
    hall: [51, 8],
    stalls: [[46, 11, 0], [51, 14, 1]]   /* v1.0: kios kedua dipindah dari (52,11) karena menutup pintu Balai Desa */, lamps: [[45, 11], [54, 11], [45, 16], [54, 16]], benches: [[48, 16], [51, 16]],
    fences: [[39, 11], [40, 11], [57, 11], [58, 11], [59, 11], [36, 23], [37, 23], [38, 23], [60, 23], [61, 23]],
    tents: [[45, 29, 0], [53, 29, 1], [53, 32, 2]], flags: [[47, 29]], crates: [[47, 32], [55, 31], [44, 32]], hay: [[60, 27], [36, 28], [62, 22]],
    /* tempat berdiri warga di titik kumpul (petak) */
    slots: [[47, 31], [49, 31], [51, 31], [47, 33], [49, 33], [51, 33], [48, 32], [50, 32], [46, 30]],
    routeFrom: [49, 14], routeTo: [49, 30], fire: [43, 2]
  };
  const inRect = (x, y, r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
  function paint(ground, at) {
    const fill = (r, t) => { for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) ground[at(x, y)] = t; };
    L.roadsNS.forEach(r => fill(r, TL.DIRT)); fill(L.plaza, TL.PLAZA); fill(L.assembly, TL.SAFE); fill(L.fieldA, TL.CROP); fill(L.fieldB, TL.CROP);
    for (let y = 26; y <= 27; y++) for (let x = 49; x <= 50; x++) ground[at(x, y)] = TL.DIRT;
  }
  /* api: {ground, solid, objects, at, W, H, free(x,y) -> boleh dipasang (rumput/plaza/safe, bebas, bukan area cadangan POI)} */
  function build(api) {
    const { objects, solid, at } = api, placed = { houses: 0, skipped: [] };
    const big = (type, tx, ty, w, h, v) => {
      for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) if (!api.free(x, y)) { placed.skipped.push(type + '@' + tx + ',' + ty); return false; }
      for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) solid[at(x, y)] = 1;
      objects.push({ type, tx, ty, w, h, v: v || 0 }); return true;
    };
    L.houses.forEach(h => { if (big('house', h[0], h[1], 3, 2, h[2])) placed.houses++; });
    big('hall', L.hall[0], L.hall[1], 5, 3, 0);
    L.stalls.forEach(s => big('stall', s[0], s[1], 2, 1, s[2])); L.tents.forEach(t => big('tent', t[0], t[1], 2, 2, t[2]));
    L.lamps.forEach(p => big('lamp', p[0], p[1], 1, 1)); L.benches.forEach(p => big('bench', p[0], p[1], 1, 1)); L.fences.forEach(p => big('fence', p[0], p[1], 1, 1));
    L.flags.forEach(p => big('flag', p[0], p[1], 1, 1)); L.crates.forEach(p => big('crate', p[0], p[1], 1, 1)); L.hay.forEach(p => big('hay', p[0], p[1], 1, 1));
    return placed;
  }
  M.Village = { L, paint, build, inRect, inVillage: (x, y) => x >= 36 && y >= 3 && y <= 34, inAssembly: (px, py) => inRect(Math.floor(px / 16), Math.floor((py - 1) / 16), L.assembly) };
})(window.MPH);
