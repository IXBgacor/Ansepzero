/* Kendaraan v3.0 — traktor, ambulans, mobil pemadam yang bisa dikendarai.
   - Dekati kendaraan -> tombol INTERAKSI "Naik: <nama>". Saat mengemudi, tombol berubah menjadi "Turun: <nama>" (satu-satunya aksi).
   - Joystick/WASD = kemudi (4 arah, kecepatan halus); LARI/Shift = ngebut (+ sirene & lampu rotator untuk ambulans/mobil pemadam).
   - Tabrakan memakai grid petak yang sama dengan pemain (air, bangunan, pohon, NPC, cincin api tetap penghalang). Kendaraan tidak bisa menembus peta.
   - Kamera tetap mengikuti pemain (posisi pemain = posisi kendaraan). Cutscene otomatis menurunkan pemain; kendaraan parkir disembunyikan selama cutscene.
   - Posisi parkir awal ada di DEFS (dicek kosong saat mulai; jika terhalang digeser ke petak bebas terdekat). Posisi kendaraan tidak disimpan ke save (kembali parkir saat game dimulai ulang). */
(function (M) {
  'use strict';
  const T = M.C.TILE, D = M.DIR, S = () => M.Sprites;
  const DEFS = [
    { id: 'traktor1', type: 'tractor', name: 'Traktor', x: 41 * T + 8, y: 27 * T + 8, dir: D.RIGHT, hw: 9, hh: 9, speed: 64, r: 38 },
    { id: 'traktor2', type: 'tractor', name: 'Traktor', x: 57 * T + 8, y: 27 * T + 8, dir: D.LEFT, hw: 9, hh: 9, speed: 64, r: 38 },
    { id: 'ambulans1', type: 'ambulance', name: 'Ambulans', x: 98 * T + 8, y: 37 * T + 8, dir: D.LEFT, hw: 13, hh: 11, speed: 100, r: 44, siren: true },
    { id: 'heli1', type: 'heli', name: 'Helikopter Damkar', x: 68 * T, y: 38 * T, dir: D.UP, hw: 16, hh: 16, speed: 118, r: 50, fly: true },
    { id: 'damkar1', type: 'firetruck', name: 'Mobil Pemadam', x: 58 * T, y: 39 * T + 12, dir: D.DOWN, hw: 12, hh: 12, speed: 92, r: 44, siren: true }
  ];
  let list = [], drv = null, acc = 0, engOn = false, sirOn = false, heliOn = false, sndT = 0;

  const hit = (x, y, hw, hh) => {
    const l = Math.floor((x - hw) / T), r = Math.floor((x + hw - 0.01) / T), t = Math.floor((y - hh) / T), b = Math.floor((y + hh - 0.01) / T);
    for (let ty = t; ty <= b; ty++) for (let tx = l; tx <= r; tx++) if (M.Map.isSolid(tx, ty)) return true;
    return false;
  };
  const hitP = (x, y) => {                                      // kotak kaki pemain (sama dengan player.js)
    const l = Math.floor((x - 4) / T), r = Math.floor((x + 3.99) / T), t = Math.floor((y - 5) / T), b = Math.floor((y - 0.01) / T);
    for (let ty = t; ty <= b; ty++) for (let tx = l; tx <= r; tx++) if (M.Map.isSolid(tx, ty)) return true;
    return false;
  };
  const inMap = (x, y, hw, hh) => x - hw >= 0 && y - hh >= 0 && x + hw <= M.Map.pxW && y + hh <= M.Map.pxH;
  function settle(v) {                                          // pastikan titik parkir bebas; jika tidak, cari petak bebas terdekat (spiral)
    if (inMap(v.x, v.y, v.hw, v.hh) && !hit(v.x, v.y, v.hw, v.hh)) return;
    for (let rad = 1; rad <= 80; rad += 2) for (let a = 0; a < 16; a++) { const x = v.x + Math.cos(a * Math.PI / 8) * rad, y = v.y + Math.sin(a * Math.PI / 8) * rad;
      if (inMap(x, y, v.hw, v.hh) && !hit(x, y, v.hw, v.hh)) { v.x = x; v.y = y; return; } }
  }
  function reset() {
    stopSnd(); drv = null;
    list = DEFS.map(d => Object.assign({}, d, { vx: 0, vy: 0, alt: 0, landing: false, home: { x: d.x, y: d.y, dir: d.dir } }));
    if (M.Map && M.Map.objects) list.forEach(v => { settle(v); v.home.x = v.x; v.home.y = v.y; });
  }
  const driving = () => !!drv;
  const poiOf = (v, extra) => Object.assign({ id: 'veh_' + v.id, kind: 'veh', name: v.name, verb: 'Naik', r: v.r, tx: (v.x - 8) / T, ty: (v.y - 8) / T, noclear: true, fixed: true, _veh: v }, extra);
  const cutscene = () => !!((M.Cutscene && M.Cutscene.active) || M.Game.cine);
  const pois = () => (drv || cutscene() ? [] : list.map(v => poiOf(v)));
  const exitPoi = () => Object.assign(poiOf(drv), { id: 'veh_exit', verb: drv.fly && drv.alt > 0.02 ? 'Mendarat' : 'Turun', r: 999, _veh: null, _vexit: true });

  function enter(v) {
    if (drv || M.Game.frozen || cutscene() || !v) return;
    drv = v; v.vx = v.vy = 0; v.landing = false; sync(); M.Camera && M.Camera.end && M.Camera.end();
    if (!(M.VMission && M.VMission.onEnter(v))) hint(v);          // bila ada konfirmasi misi, petunjuk kemudi ditampilkan setelah pilihan
  }
  function hint(v) {
    if (!M._toast || !v) return;
    M._toast(v.fly ? v.name + ': gerakkan joystick untuk lepas landas, LARI = ngebut. Tombol MENDARAT untuk turun.' : v.name + ': joystick = kemudi, LARI = ngebut' + (v.siren ? ' + sirene' : '') + '.');
  }
  function exit(force) {
    if (!drv) return true; const v = drv, P = M.Player.state;
    if (v.fly && v.alt > 0.02) {                                      // helikopter di udara: tombol = mulai mendarat; paksa (cutscene) = mendarat seketika di tempat bebas terdekat
      if (!force) { v.landing = true; return false; }
      v.alt = 0; v.landing = false; settle(v);
    }
    const cand = [[0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1], [-1, -1], [1, -1]];
    for (const ring of [8, 14, 22]) for (const [dx, dy] of cand) {
      const x = v.x + dx * (v.hw + ring), y = v.y + dy * (v.hh + ring) + 6;
      if (x > 6 && y > 8 && x < M.Map.pxW - 6 && y < M.Map.pxH && !hitP(x, y)) { P.x = x; P.y = y; P.dir = dy > 0 ? D.DOWN : dy < 0 ? D.UP : dx > 0 ? D.RIGHT : D.LEFT; return finish(); }
    }
    if (force) { P.x = v.x; P.y = v.y + 6; return finish(); }
    if (M._toast) M._toast('Tidak ada ruang untuk turun. Geser kendaraan ke tempat yang lebih lapang.');
    return false;
  }
  function finish() { drv.vx = drv.vy = 0; drv = null; if (M.VMission) M.VMission.onExit(); const P = M.Player.state; P.vx = P.vy = 0; stopSnd(); M.Game.setBottomBar && 0; return true; }
  function sync() { const P = M.Player.state, v = drv; P.x = v.x; P.y = v.y + 8; P.dir = v.dir; P.vx = P.vy = 0; P.run = false; }
  function face(v, ix, iy) {
    const ax = Math.abs(ix), ay = Math.abs(iy); let horiz = v.dir === D.LEFT || v.dir === D.RIGHT;
    if (horiz ? ay > ax * 1.3 : ax > ay * 1.3) horiz = !horiz;
    v.dir = horiz ? (ix > 0 ? D.RIGHT : D.LEFT) : (iy > 0 ? D.DOWN : D.UP);
  }
  function fly(v, dt) {                                              // helikopter: tanpa tabrakan tanah (terbang di atas bangunan/air/pohon), hanya dibatasi tepi peta
    const [ix, iy] = M.Input.get(), mag = Math.hypot(ix, iy); if (mag > 1e-4) face(v, ix, iy);
    if (!v.landing && (mag > 0.05 || v.alt > 0)) v.alt = Math.min(1, v.alt + dt * 1.1);              // gerak joystick = lepas landas; lalu melayang sampai MENDARAT ditekan
    if (v.landing) {
      if (v.alt <= 0.2 && (hit(v.x, v.y, v.hw, v.hh) || !inMap(v.x, v.y, v.hw, v.hh))) { v.landing = false; if (M._toast) M._toast('Tidak bisa mendarat di sini. Cari tanah lapang (bukan air, bangunan, atau pohon).'); }
      else { v.alt = Math.max(0, v.alt - dt * 1.1); if (v.alt <= 0) v.landing = false; }
    }
    const boost = mag > 0.05 && M.Input.running(), f = Math.max(0, Math.min(1, (v.alt - 0.25) / 0.5)), spd = v.speed * (boost ? 1.5 : 1) * f, a = 1 - Math.exp(-dt / (mag > 1e-4 ? 0.45 : 0.7));
    v.vx += (ix * spd - v.vx) * a; v.vy += (iy * spd - v.vy) * a; if (mag <= 1e-4 && Math.abs(v.vx) < 1.5 && Math.abs(v.vy) < 1.5) v.vx = v.vy = 0;
    const ox = v.x, oy = v.y; v.x = Math.max(v.hw, Math.min(M.Map.pxW - v.hw, v.x + v.vx * dt)); v.y = Math.max(v.hh, Math.min(M.Map.pxH - v.hh, v.y + v.vy * dt));
    v.moved = Math.hypot(v.x - ox, v.y - oy) / Math.max(dt, 1e-4); v.boost = boost && v.moved > 4; sync(); sound(dt);
  }
  function drive(dt) {
    const v = drv; if (!v) return; if (v.fly) return fly(v, dt); const [ix, iy] = M.Input.get(), mag = Math.hypot(ix, iy);
    if (mag > 1e-4) face(v, ix, iy);
    const boost = mag > 0.05 && M.Input.running(), spd = v.speed * (boost ? 1.35 : 1), a = 1 - Math.exp(-dt / (mag > 1e-4 ? 0.3 : 0.45));
    v.vx += (ix * spd - v.vx) * a; v.vy += (iy * spd - v.vy) * a; if (mag <= 1e-4 && Math.abs(v.vx) < 1.5 && Math.abs(v.vy) < 1.5) v.vx = v.vy = 0;
    const ox = v.x, oy = v.y;
    if (Math.abs(v.vx) > 1e-4) { const nx = v.x + v.vx * dt; if (inMap(nx, v.y, v.hw, v.hh) && !hit(nx, v.y, v.hw, v.hh)) v.x = nx; else v.vx = 0; }
    if (Math.abs(v.vy) > 1e-4) { const ny = v.y + v.vy * dt; if (inMap(v.x, ny, v.hw, v.hh) && !hit(v.x, ny, v.hw, v.hh)) v.y = ny; else v.vy = 0; }
    v.moved = Math.hypot(v.x - ox, v.y - oy) / Math.max(dt, 1e-4); v.boost = boost && v.moved > 4; sync(); sound(dt);
  }
  /* ---- suara: mesin selalu saat bergerak, sirene saat ngebut (kendaraan darurat). Diperbarui ≤ 5x/detik. ---- */
  function sound(dt) {
    sndT -= dt; if (sndT > 0) return; sndT = 0.2; const A = M.Audio, v = drv; if (!v || !A.cutPlay) return;
    if (v.fly) { if (!heliOn) { A.cutPlay('heli', { loop: true, gain: 0.12, fade: 0.5 }); heliOn = true; } return; }
    const mv = v.moved > 4;
    if (mv && !engOn) { A.cutPlay('engine', { loop: true, gain: 0.07, fade: 0.25 }); engOn = true; } else if (!mv && engOn) { A.cutStop('engine', 0.3); engOn = false; }
    const sir = !!(v.siren && v.boost); if (sir && !sirOn) { A.cutPlay('siren', { loop: true, gain: 0.06, fade: 0.2 }); sirOn = true; } else if (!sir && sirOn) { A.cutStop('siren', 0.3); sirOn = false; }
  }
  function stopSnd() { const A = M.Audio; if (A && A.cutStop) { if (engOn) A.cutStop('engine', 0.2); if (sirOn) A.cutStop('siren', 0.2); if (heliOn) A.cutStop('heli', 0.4); } engOn = sirOn = heliOn = false; }
  const idle = () => { if (engOn || sirOn || heliOn) stopSnd(); };
  function tick() { if (drv && cutscene()) exit(true); }              // cutscene mengambil alih: pemain otomatis turun
  function entities(l) {
    if (cutscene() && !drv) return;                                  // kendaraan parkir disembunyikan selama cutscene (truk cutscene sendiri yang tampil)
    const t = performance.now() / 1000;
    for (const v of list) {
      if (v.fly) {                                                   // helikopter: bayangan di tanah + badan terangkat sesuai ketinggian; saat terbang digambar di atas segalanya
        const air = v.alt || 0, spin = v === drv, fr = spin ? Math.floor(t * 24) % 4 : 0, lift = Math.round(air * 22);
        l.push({ y: v.y - 400, draw: (ctx, cx, cy) => { const k = 1 - 0.3 * air; ctx.globalAlpha = 0.3 - 0.12 * air; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(M.View.snap(v.x - cx), M.View.snap(v.y + 4 - cy), 17 * k, 11 * k, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; } });
        l.push({ y: air > 0.05 ? 1e6 : v.y + v.hh, draw: (ctx, cx, cy) => { const im = S().veh.heli[v.dir][fr], sh = spin && air > 0.9 ? Math.sin(t * 5) * 0.8 : 0; ctx.drawImage(im, M.View.snap(v.x - im.width / 2 - cx), M.View.snap(v.y - im.height / 2 - cy - lift + sh)); } });
        continue;
      }
      const sz = S().veh.size[v.type][v.dir], light = Math.floor(t * 4) % 2, active = v === drv && v.siren && v.boost, fr = v.siren ? (active ? light : 0) : (v.moved > 4 && v === drv ? light : 0);
      l.push({ y: v.y + v.hh, draw: (ctx, cx, cy) => { const im = S().veh[v.type][v.dir][fr] || S().veh[v.type][v.dir][0], sh = Math.round(((v.moved > 4 && v === drv) ? Math.sin(t * 40) * 0.4 : 0) * 10) / 10;
        ctx.drawImage(im, M.View.snap(v.x - im.width / 2 - cx), M.View.snap(v.y - im.height / 2 - cy + sh)); } });
    }
  }
  M.Vehicles = { hint, DEFS, reset, driving, pois, exitPoi, enter, exit, drive, tick, idle, entities, list: () => list, current: () => drv, hit };
})(window.MPH);
