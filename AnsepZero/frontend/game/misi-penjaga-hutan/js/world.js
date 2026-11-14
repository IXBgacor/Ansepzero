/* Titik interaksi (NPC, objek, area bahaya): data posisi, gambar, penanda, dan cincin zona aman.
   v0.4: area bahaya (asap/api/lahan terbakar) kini bisa lebih dari satu dan punya cincin sendiri;
   titik baru ditambahkan lewat M.World.add() dari js/pois_v04.js. Posisi asap lama tidak berubah. */
(function (M) {
  const T = M.C.TILE, S = () => M.Sprites;
  const RING = { min: 72, mid: 92, max: 112 };       // px: <min = zona bahaya; min..max = jarak amati aman
  const pois = [
    { id: 'officer',  kind: 'npc', tx: 8,  ty: 10, name: 'Petugas Rimba',    verb: 'Bicara', sprite: 'officer', icon: 'officer', r: 30, solid: true },
    { id: 'board',    kind: 'obj', tx: 12, ty: 10, name: 'Papan Informasi',  verb: 'Periksa', sprite: 'board', icon: 'board', r: 28, solid: true },
    { id: 'soil',     kind: 'obj', tx: 10, ty: 18, name: 'Sampel Tanah',     verb: 'Periksa', sprite: 'soil', icon: 'soil', r: 28, solid: true },
    { id: 'campfire', kind: 'obj', tx: 16, ty: 16, name: 'Bekas Api Unggun', verb: 'Periksa', sprite: 'campfire', icon: 'campfire', r: 28, solid: true },
    { id: 'joko',     kind: 'npc', tx: 28, ty: 16, name: 'Pak Joko (warga)', verb: 'Bicara', sprite: 'warga', icon: 'warga', r: 30, solid: true },
    { id: 'sign',     kind: 'obj', tx: 28, ty: 9,  name: 'Penanda Bahaya',   verb: 'Baca', sprite: 'sign', icon: 'sign', r: 28, solid: true },
    { id: 'smoke',    kind: 'smoke', tx: 14, ty: 4, name: 'Asap di Kejauhan', verb: 'Amati', icon: 'smoke', r: 0, solid: true, clear: 3, look: 'fire', puffs: 7 }
  ];
  const reserved = new Set(), byId = {};
  pois.forEach(p => byId[p.id] = p);
  const isHazard = p => p.kind === 'smoke' || p.kind === 'hazard';
  const ringOf = p => p.ring || RING;
  function add(list) { for (const p of list) { if (byId[p.id]) throw new Error('POI ganda: ' + p.id); pois.push(p); byId[p.id] = p; } }
  const outOf = p => !!(M.WorldState && M.WorldState.fireOut(p.id));          // v1.0: api/asap yang sudah padam (world state)
  const hazards = () => pois.filter(p => isHazard(p) && !outOf(p));

  /* Dipanggil peta sebelum pohon dipasang: pastikan tiap titik di rumput bebas, lalu sisihkan area kosong. */
  function resolve(isFreeGrass) {
    reserved.clear();
    for (const p of pois) {
      if (!p.fixed && !isFreeGrass(p.tx, p.ty)) {
        let found = false;
        for (let r = 1; r <= 5 && !found; r++) for (let dy = -r; dy <= r && !found; dy++) for (let dx = -r; dx <= r && !found; dx++)
          if (isFreeGrass(p.tx + dx, p.ty + dy)) { p.tx += dx; p.ty += dy; found = true; }
      }
    }
    for (const p of pois) { const c = p.noclear ? 0 : (p.clear || 2);
      for (let dy = -c; dy <= c; dy++) for (let dx = -c; dx <= c; dx++) reserved.add((p.tx + dx) + ',' + (p.ty + dy)); }
  }
  const isReserved = (x, y) => reserved.has(x + ',' + y);
  const center = p => (p._ov ? { x: p._ov.x + 8, y: p._ov.y + 8 } : { x: p.tx * T + 8, y: p.ty * T + 8 });          // v0.6: _ov = posisi sementara NPC yang bergerak
  /* Penanda (!) hanya untuk titik yang punya langkah tersedia pada MISI AKTIF. */
  const pending = p => !outOf(p) && !!(M.Missions && M.Missions.stepsAt(p.id).length);

  function facing(p) {
    const pl = M.Player.state, c = center(p), dx = pl.x - c.x, dy = pl.y - 3 - c.y;
    if (Math.hypot(dx, dy) > 70) return M.DIR.DOWN;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? M.DIR.RIGHT : M.DIR.LEFT) : (dy > 0 ? M.DIR.DOWN : M.DIR.UP);
  }
  const hk = p => (p.id === 'bigfire' && M.Final && M.Final.fireK ? M.Final.fireK() : 1);      // v0.5²: intensitas api besar (1 = penuh; turun saat cutscene)
  function draw(ctx, p, cx, cy, time) {
    const x = p.tx * T - cx, y = p.ty * T - cy, s = S();
    if (p.kind === 'npc' && p._ov) { if (p._ov.a != null) ctx.globalAlpha = p._ov.a; ctx.drawImage(s.npc[p.sprite][p._ov.dir], Math.round(p._ov.x - cx), Math.round(p._ov.y - cy - (p._ov.moving ? Math.floor(time * 8) % 2 : 0))); ctx.globalAlpha = 1; }      // v0.5⁴: NPC berjalan (cutscene); v1.0: _ov.a = transparansi
    else if (p.kind === 'npc') ctx.drawImage(s.npc[p.sprite][facing(p)], x, y - (Math.floor(time * 1.5 + p.tx) % 2 ? 1 : 0) + 0);
    else if (isHazard(p)) {
      if (outOf(p)) ctx.drawImage(s.props.burnt, x, y);                    // v1.0: api padam -> tanah hangus tetap terlihat
      else if (p.look === 'burnt') ctx.drawImage(s.props.burnt, x, y);
      else if (p.look === 'peat') ctx.drawImage(s.props.peatpatch, x, y);
      else if (p.id === 'bigfire' && hk(p) < 0.12) { /* api besar sudah padam (cutscene) */ }
      else ctx.drawImage(s.fire[Math.floor(time * 4) % 2], x, y);
    }
    else ctx.drawImage(s.props[p.sprite], x, y);
  }
  function dots(ctx, c, cx, cy, rad, col, time) {
    ctx.fillStyle = col; const n = 72, off = Math.floor(time * 6), VW = M.C.VIEW_W, VH = M.C.VIEW_H;
    for (let i = 0; i < n; i++) { if ((i + off) % 3 === 0) continue;
      const a = i / n * Math.PI * 2, x = Math.round(c.x + Math.cos(a) * rad) - cx, y = Math.round(c.y + Math.sin(a) * rad) - cy;   // v0.4²: dibulatkan di koordinat DUNIA agar tidak bergetar saat kamera bergerak
      if (x >= -1 && y >= -1 && x < VW && y < VH) ctx.fillRect(x, y, 1, 1); }
  }
  /* Cincin di tanah: merah = zona bahaya, hijau = jalur amati (hijau hanya bila ada tugas amati yang tersedia). */
  function drawRings(ctx, cx, cy, time) {
    if (M.Cutscene && M.Cutscene.active) return;           // v0.5²: tanpa cincin bahaya saat cutscene
    const pl = M.Player.state;
    for (const p of pois) {
      if (!isHazard(p) || outOf(p)) continue;
      const c = center(p), R = ringOf(p);
      if (Math.hypot(pl.x - c.x, pl.y - 3 - c.y) > 190) continue;
      dots(ctx, c, cx, cy, R.min, '#ff4a3a', time);
      if (pending(p)) dots(ctx, c, cx, cy, R.mid, '#7be08f', time);
    }
  }
  function disc(ctx, x, y, r) { for (let dy = -r; dy <= r; dy++) { const w = Math.floor(Math.sqrt(r * r - dy * dy)); ctx.fillRect(x - w, y + dy, w * 2 + 1, 1); } }
  function drawOverlay(ctx, cx, cy, time) {
    const cur = M.Interact && M.Interact.current(), VW = M.C.VIEW_W, VH = M.C.VIEW_H;
    for (const sm of pois) {                          // kepulan asap tiap area bahaya yang terlihat
      if (!isHazard(sm) || outOf(sm)) continue;
      const c = center(sm), n = sm.puffs === undefined ? 5 : sm.puffs;
      if (c.x - cx < -40 || c.x - cx > VW + 40 || c.y - cy < -70 || c.y - cy > VH + 40) continue;
      for (let i = 0; i < n; i++) {
        const ph = (time * 0.22 + i / n) % 1, x = Math.round(c.x + Math.sin(ph * 6 + i) * 3 + ph * 10) - cx, y = Math.round(c.y - 4 - ph * (sm.puffs >= 7 ? 52 : 36)) - cy;
        if (x < -12 || x > VW + 12 || y < -12 || y > VH + 12) continue;
        ctx.globalAlpha = Math.max(0, (1 - ph) * (sm.puffs >= 7 ? 0.8 : 0.6) * hk(sm)); ctx.fillStyle = i % 2 ? '#8b8d94' : '#b3b5ba'; disc(ctx, x, y, (sm.puffs >= 7 ? 3 : 2) + Math.floor(ph * (sm.puffs >= 7 ? 6 : 4)));
      }
    }
    ctx.globalAlpha = 1;
    if (M.Cutscene && M.Cutscene.active) return;             // v0.5⁴: tanpa penanda (!) / panah saat cutscene
    for (const p of pois) {
      if (isHazard(p)) continue;
      const sx = p.tx * T - cx, sy = p.ty * T - cy; if (sx < -16 || sx > VW || sy < -16 || sy > VH + 8) continue;
      const bob = Math.floor(time * 3) % 2, s = S();
      if (p === cur) ctx.drawImage(s.arrow, sx + 4, sy - 7 + bob);
      else if (pending(p)) ctx.drawImage(s.marker, sx + 3, sy - 10 + bob);
    }
    for (const p of pois) {                           // penanda (!) di atas area bahaya yang punya tugas amati
      if (!isHazard(p) || outOf(p) || !pending(p)) continue;
      const sx = p.tx * T - cx, sy = p.ty * T - cy; if (sx < -16 || sx > VW || sy < -16 || sy > VH + 8) continue;
      ctx.drawImage(S().marker, sx + 3, sy - 12 + Math.floor(time * 3) % 2);
    }
  }
  /* Panah penunjuk tujuan di tepi layar (hanya bila target di luar layar). v0.4²: mengikuti ukuran layar dinamis dan
     menghindari panel HUD (tracker, joystick, tombol INTERAKSI, bilah petunjuk PC) yang berada di atas kanvas. */
  let hudRects = [];
  function setHudRects(list) { hudRects = list; }
  function drawGuide(ctx, cx, cy) {
    if (!M.Missions || M.Game.frozen) return;
    const ids = M.Missions.targets(); if (!ids.length) return;
    const pl = M.Player.state, V = M.View; let best = null, bd = 1e9;
    for (const id of ids) { const p = byId[id]; if (!p) continue; const c = center(p), d = Math.hypot(c.x - pl.x, c.y - pl.y); if (d < bd) { bd = d; best = c; } }
    if (!best) return;
    const sx = best.x - cx, sy = best.y - cy, sv = M.Game.safeView();
    if (sx > sv.l && sx < sv.r && sy > sv.t && sy < sv.b) return;            // sudah terlihat di layar
    const k = V.k, ins = { l: 22 / k, r: 22 / k, t: 56 / k, b: (22 + (M.Game.bottomBar ? M.Game.bottomBar() : 0)) / k };
    const L = ins.l, R = V.w - ins.r, Tp = ins.t, B = V.h - ins.b, mx = (L + R) / 2, my = (Tp + B) / 2, dx = sx - mx, dy = sy - my;
    const kk = Math.min(Math.abs((R - L) / 2 / (dx || 1e-6)), Math.abs((B - Tp) / 2 / (dy || 1e-6)));
    let x = mx + dx * kk, y = my + dy * kk; const a = Math.atan2(dy, dx);
    for (let pass = 0; pass < 2; pass++) for (const r of hudRects) {              // geser keluar dari panel HUD (koordinat piksel CSS -> logis)
      const rl = r.l / k - 10 / k, rr = r.r / k + 10 / k, rt = r.t / k - 10 / k, rb = r.b / k + 10 / k;
      if (x > rl && x < rr && y > rt && y < rb) {
        const c = [[rl - x, 0], [rr - x, 0], [0, rt - y], [0, rb - y]].filter(v => x + v[0] >= L && x + v[0] <= R && y + v[1] >= Tp && y + v[1] <= B);
        if (c.length) { c.sort((p, q) => Math.hypot(p[0], p[1]) - Math.hypot(q[0], q[1])); x += c[0][0]; y += c[0][1]; }
      }
    }
    ctx.save(); ctx.translate(V.snap(x), V.snap(y)); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -5); ctx.lineTo(-2, 0); ctx.lineTo(-4, 5); ctx.closePath();
    ctx.fillStyle = '#ffd36a'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#3a2410'; ctx.stroke(); ctx.restore();
  }
  M.World = { pois, byId, RING, add, hazards, isHazard, ringOf, resolve, isReserved, center, draw, drawRings, drawOverlay, drawGuide, setHudRects, pending };
})(window.MPH);
