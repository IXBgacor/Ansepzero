/* Peta: data tile, objek (pohon/batu), tabrakan, dan penggambaran. */
(function (M) {
  const { TILE: T, MAP_W: W, MAP_H: H } = M.C, TL = M.T, S = M.Sprites;
  const ground = new Uint8Array(W * H), variant = new Uint8Array(W * H), solid = new Uint8Array(W * H);
  const objects = [], waterTiles = [];
  let layer;
  const spawn = { x: 6 * T + 8, y: 12 * T + 14 };

  function build() {
    const LW = 36, LH = 26, OW = 64, R = M.util.rng(2024), RV = M.util.rng(606), RS = M.util.rng(1010), at = (x, y) => y * W + x;     // v1.0: OW = lebar peta v0.6 (64) -> wilayah lama dibangkitkan identik; wilayah sekolah (x>=64) memakai RNG sendiri (RS)
    const SC = M.School;     // v0.6: wilayah lama 36x26 dibangkitkan identik (RNG sama); wilayah baru memakai RNG sendiri
    const legacyV = []; for (let i = 0; i < LW * LH; i++) legacyV.push(R() * 100 | 0);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) variant[at(x, y)] = (x < LW && y < LH) ? legacyV[y * LW + x] : (x < OW ? (RV() * 100 | 0) : (RS() * 100 | 0));
    const riverX = y => 22 + Math.round(2 * Math.sin(y * 0.45));
    for (let y = 0; y < H; y++) for (let x = riverX(y) - 1; x <= riverX(y) + 1; x++) ground[at(x, y)] = TL.WATER;
    for (let x = 3; x < W - 3; x++) for (let y = 12; y <= 13; y++) {            // jalan tanah + jembatan (kini sampai ke desa)
      const i = at(x, y); ground[i] = ground[i] === TL.WATER ? TL.BRIDGE : TL.DIRT;
    }
    for (let y = 13; y < 23; y++) { ground[at(8, y)] = TL.DIRT; ground[at(9, y)] = TL.DIRT; }
    for (let x = 3; x <= 43; x++) for (let y = 30; y <= 31; y++) { const i = at(x, y); ground[i] = ground[i] === TL.WATER ? TL.BRIDGE : TL.DIRT; }   // v0.6: jalur hutan selatan (menghubungkan titik kumpul ke hutan barat daya)
    M.Village.paint(ground, at); SC.paint(ground, at); M.Region.paint(ground, at);      // v2.0: kawasan selatan (gambut, kanal, pasar, puskesmas, pos pemadam, permukiman)
    for (let i = 0; i < W * H; i++) solid[i] = ground[i] === TL.WATER ? 1 : 0;
    M.World.resolve((x, y) => x > 1 && y > 1 && x < LW - 2 && y < LH - 2 && ground[at(x, y)] === TL.GRASS && !solid[at(x, y)]);   // titik interaksi lama (hanya wilayah lama)

    const put = (type, x, y) => {
      const i = at(x, y);
      if (ground[i] !== TL.GRASS || solid[i]) return;
      if (M.Region.noForest(x, y)) return;                                       // v2.0: kawasan selatan ditata manual (region.js)
      if (Math.hypot(x - 6, y - 12) < 3 || M.World.isReserved(x, y)) return;
      if (type === 'tree' && x >= 34 && x < LW && y >= 10 && y <= 15) return;     // gerbang desa
      solid[i] = 1; objects.push({ type, tx: x, ty: y });
    };
    for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
      const edge = x === 0 || y === 0 || x === LW - 1 || y === LH - 1;
      const edge2 = x === 1 || y === 1 || x === LW - 2 || y === LH - 2;
      if (edge || (edge2 && R() < .6)) put('tree', x, y);
      else { const p = R(); if (p < .08) put('tree', x, y); else if (p < .105) put('rock', x, y); }
    }
    for (let k = 0; k < 7; k++) {                                             // rumpun pohon (wilayah lama)
      const cx = 3 + R() * (LW - 6) | 0, cy = 3 + R() * (LH - 6) | 0;
      for (let j = 0; j < 9; j++) put('tree', cx + (R() * 5 | 0) - 2, cy + (R() * 5 | 0) - 2);
    }
    /* desa dulu (rumah/balai/tenda...), lalu hutan di sekelilingnya */
    const placed = M.Village.build({ objects, solid, at, free: (x, y) => x > 1 && y > 1 && x < W - 2 && y < H - 2 && !solid[at(x, y)] && !M.World.isReserved(x, y) && (ground[at(x, y)] === TL.GRASS || ground[at(x, y)] === TL.PLAZA || ground[at(x, y)] === TL.SAFE) });
    M.Map.villageInfo = placed; M.Map.schoolInfo = SC.build({ objects, solid, at }); M.Map.regionInfo = M.Region.build({ objects, solid, at, ground });
    for (let y = 0; y < H; y++) for (let x = 0; x < OW; x++) {                 // hutan wilayah v0.6 (urutan RNG identik dengan v0.6)
      if (x < LW && y < LH) continue;
      const edge = x === 0 || y === 0 || x === OW - 1 || y === H - 1, edge2 = x === 1 || y === 1 || x === OW - 2 || y === H - 2;
      const inV = x >= 36 && y >= 3 && y <= 34 && x <= 62, dens = inV ? 0.035 : (x < 36 ? 0.08 : 0.12);
      if (edge || (edge2 && RV() < .7)) put('tree', x, y);
      else { const p = RV(); if (p < dens) put('tree', x, y); else if (p < dens + (inV ? 0.006 : 0.02)) put('rock', x, y); }
    }
    for (let k = 0; k < 9; k++) { const cx = 3 + RV() * (OW - 6) | 0, cy = 3 + RV() * 30 | 0; if (cx < 36 && cy < LH) continue; if (cx >= 36 && cy >= 3 && cy <= 34) continue; for (let j = 0; j < 9; j++) put('tree', cx + (RV() * 5 | 0) - 2, cy + (RV() * 5 | 0) - 2); }
    for (let y = 0; y < H; y++) for (let x = OW; x < W; x++) {                 // v1.0: hutan di sekitar kompleks sekolah (pagar sekolah = batas); bagian dalam pagar ditata manual (school.js)
      if (SC.inFence(x, y)) continue;
      const edge = x === W - 1 || y === 0 || y === H - 1, edge2 = x === W - 2 || y === 1 || y === H - 2, p = RS();
      if (edge || (edge2 && p < .75)) put('tree', x, y); else if (p < 0.13) put('tree', x, y); else if (p < 0.145) put('rock', x, y);
    }
    objects.sort((a, b) => (a.ty + (a.h || 1)) - (b.ty + (b.h || 1)) || a.tx - b.tx);
    for (const p of M.World.pois) if (p.solid) solid[at(p.tx, p.ty)] = 1;     // NPC/objek interaktif ikut menabrak

    layer = M.util.cv(W * T, H * T);
    const g = layer.getContext('2d');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = at(x, y), v = variant[i], t = ground[i];
      let s;
      if (t === TL.WATER) { s = S.water[0]; waterTiles.push(i); }
      else if (t === TL.DIRT) s = S.dirt[v % 3];
      else if (t === TL.PLAZA) s = S.plaza[v % 3];
      else if (t === TL.CROP) s = S.crop[v % 2];
      else if (t === TL.SAFE) s = S.safe[(x + y) % 2];
      else if (t === TL.BRIDGE) s = S.bridge;
      else if (t === TL.PEAT) s = S.peat[v % 3];
      else if (t === TL.PEATD) s = S.peatd[v % 3];
      else s = S.grass[v < 70 ? v % 3 : v < 85 ? 3 : v < 95 ? 4 : v % 3];
      g.drawImage(s, x * T, y * T);
    }
    M.School.decals(g); M.Region.decals(g);                                                        // v1.0: pagar, aspal parkir, marka lapangan (digambar sekali di lapisan tanah)
  }

  const isSolid = (tx, ty) => tx < 0 || ty < 0 || tx >= W || ty >= H || solid[ty * W + tx] === 1;

  function drawGround(ctx, cx, cy, time) {
    const VW = M.C.VIEW_W, VH = M.C.VIEW_H;
    ctx.drawImage(layer, -cx, -cy); if (M.Final && M.Final.drawScorch) M.Final.drawScorch(ctx, cx, cy);                       // v0.4²: seluruh lapisan digeser (mendukung kamera pecahan & peta lebih kecil dari layar)
    const f = Math.floor(time * 2) % 2, x0 = Math.max(0, Math.floor(cx / T)), y0 = Math.max(0, Math.floor(cy / T));
    for (let y = y0; y <= y0 + VH / T + 1 && y < H; y++) for (let x = x0; x <= x0 + VW / T + 1 && x < W; x++)
      if (ground[y * W + x] === TL.WATER) ctx.drawImage(S.water[f], x * T - cx, y * T - cy);
  }
  function drawObject(ctx, o, cx, cy) {
    if (o.hidden) return;
    if (S.vobj[o.type]) {
      const im = S.vobj[o.type][o.v || 0], X = o.tx * T - cx, Y = (o.ty + (o.h || 1)) * T - im.height - cy; ctx.drawImage(im, X, Y);
      const WS = M.WorldState;                                                  // v1.0: state bangunan (jendela rumah tertutup saat evakuasi, pintu Balai Desa terbuka)
      if (o.type === 'house' && WS && WS.shuttered()) ctx.drawImage(S.houseShut, X, Y);
      else if (o.type === 'hall' && WS && (WS.doorOpen() || M.Map.doorFx)) ctx.drawImage(M.Map.doorFx === 'half' ? S.hallHalf : S.hallOpen, X, Y);
      return;
    }
    if (o.type === 'tree' && M.Final && M.Final.scorched(o.tx, o.ty)) ctx.drawImage(S.charTree, o.tx * T - cx, o.ty * T + T - 24 - cy);
    else if (o.type === 'tree') ctx.drawImage(S.tree, o.tx * T - cx, o.ty * T + T - 24 - cy);
    else ctx.drawImage(S.rock, o.tx * T - cx, o.ty * T - cy);
  }
  const tileAt = (px, py) => { const x = Math.floor(px / T), y = Math.floor(py / T); return (x < 0 || y < 0 || x >= W || y >= H) ? TL.GRASS : ground[y * W + x]; };   // v0.4³: jenis petak (suara langkah)
  /* v0.5⁴: tabrakan kaki (hitbox sama dengan player: lebar 8, tinggi 5) memakai M.Map.isSolid TERKINI (termasuk dinding area api dari final.js). */
  const HW = 4, HH = 5;
  function footBlocked(x, y) {
    const sol = M.Map.isSolid, l = Math.floor((x - HW) / T), r = Math.floor((x + HW - 0.01) / T), t = Math.floor((y - HH) / T), b = Math.floor((y - 0.01) / T);
    for (let ty = t; ty <= b; ty++) for (let tx = l; tx <= r; tx++) if (sol(tx, ty)) return true;
    return false;
  }
  function lineClear(x0, y0, x1, y1) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2));
    for (let i = 0; i <= n; i++) if (footBlocked(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n)) return false;
    return true;
  }
  /* Jalur BFS 4-arah pada petak bebas (tanpa menembus pohon/batu/air/objek). Titik awal/tujuan berupa posisi KAKI (piksel).
     Bila tujuan tidak bisa dicapai, dipakai petak terjangkau terdekat dari tujuan. Hasil: daftar titik yang sudah dihaluskan (string-pull) dan
     setiap ruasnya dijamin bebas tabrakan oleh footBlocked; null bila titik awal sendiri terjebak. */
  function findPath(fx, fy, gx, gy, o) {
    o = o || {}; const sol = M.Map.isSolid, avoid = o.avoid || null, free = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !sol(x, y) && !(avoid && avoid(x, y));
    const sx = Math.floor(fx / T), sy = Math.floor((fy - 1) / T); if (!free(sx, sy) && !o.startAnywhere) return null;
    const par = new Int32Array(W * H).fill(-2), q = [sy * W + sx]; par[sy * W + sx] = -1;
    for (let h = 0; h < q.length; h++) {
      const c = q[h], cx = c % W, cy = (c / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (free(nx, ny) && par[ny * W + nx] === -2) { par[ny * W + nx] = c; q.push(ny * W + nx); } }
    }
    const gtx = Math.floor(gx / T), gty = Math.floor((gy - 1) / T); let best = -1, bd = 1e9;
    for (const c of q) { const d = Math.hypot((c % W) - gtx, ((c / W) | 0) - gty); if (d < bd) { bd = d; best = c; } }
    if (best < 0) return null;
    const tiles = []; for (let c = best; c >= 0; c = par[c]) tiles.push(c); tiles.reverse();
    let pts = tiles.map(c => ({ x: (c % W) * T + 8, y: ((c / W) | 0) * T + 14 }));
    if (Math.hypot(pts[0].x - fx, pts[0].y - fy) > 0.5) pts.unshift({ x: fx, y: fy }); else pts[0] = { x: fx, y: fy };      // v0.6: awal = posisi asli; bila bukan di tengah petak, ruas pertama menuju tengah petak sendiri (tidak menyerempet sudut)
    if (best === gty * W + gtx && !footBlocked(gx, gy)) pts[pts.length - 1] = { x: gx, y: gy };
    const out = [pts[0]]; let a = 0;
    while (a < pts.length - 1) { let j = pts.length - 1; while (j > a + 1 && !lineClear(pts[a].x, pts[a].y, pts[j].x, pts[j].y)) j--; out.push(pts[j]); a = j; }
    return out;
  }
  const pathLen = pts => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); return L; };
  /* petak terjangkau dari titik awal pemain (hanya ground/objek statis, tanpa dinding api) */
  let reach = null;
  function reachable(tx, ty) {
    if (!reach) {
      reach = new Uint8Array(W * H); const sx = Math.floor(spawn.x / T), sy = Math.floor((spawn.y - 1) / T), q = [sy * W + sx]; reach[q[0]] = 1;
      for (let h = 0; h < q.length; h++) { const c = q[h], cx = c % W, cy = (c / W) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && !solid[ny * W + nx] && !reach[ny * W + nx]) { reach[ny * W + nx] = 1; q.push(ny * W + nx); } } }
    }
    return tx >= 0 && ty >= 0 && tx < W && ty < H && reach[ty * W + tx] === 1;
  }
  /* v1.0: objek yang disembunyikan mengikuti world state (tenda/bendera/peti posko dibongkar setelah desa pulih): tabrakan ikut berubah */
  function applyStates() {
    const WS = M.WorldState, A = M.Village.L.assembly, hide = !!(WS && WS.sheltersStowed());
    for (const o of objects) { if (!/^(tent|flag|crate)$/.test(o.type) || o.tx < A[0] || o.tx > A[2] || o.ty < A[1] || o.ty > A[3]) continue;
      o.hidden = hide; for (let y = o.ty; y < o.ty + (o.h || 1); y++) for (let x = o.tx; x < o.tx + (o.w || 1); x++) solid[y * W + x] = hide ? 0 : 1; }
    reach = null;
  }
  M.Map = { applyStates, build, isSolid, tileAt, drawGround, drawObject, objects, spawn, pxW: W * T, pxH: H * T, footBlocked, lineClear, findPath, pathLen, reachable };
})(window.MPH);
