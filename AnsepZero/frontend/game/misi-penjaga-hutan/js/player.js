/* Karakter utama v0.4²: gerak analog dengan peredaman kecepatan (percepatan/perlambatan halus), tabrakan per sumbu,
   animasi jalan mengikuti kecepatan nyata. Menghadap sumbu dominan dengan histeresis agar tidak berkedip di diagonal. */
(function (M) {
  const { TILE: T, SPEED, ANIM_FPS } = M.C, D = M.DIR, S = M.Sprites;
  const HW = 4, HH = 5;                                   // hitbox kaki: lebar 8, tinggi 5 px
  const P = { x: 0, y: 0, dir: D.DOWN, frame: 0, t: 0, vx: 0, vy: 0, run: false };
  const dust = [];                                      // v1.0: debu kecil saat berlari (maks 8 partikel)
  let stepping = false, lastFrame = 0;                  // v0.4³: status untuk suara langkah (hanya saat benar-benar bergerak)

  function hit(x, y) {
    const l = Math.floor((x - HW) / T), r = Math.floor((x + HW - 0.01) / T);
    const t = Math.floor((y - HH) / T), b = Math.floor((y - 0.01) / T);
    for (let ty = t; ty <= b; ty++) for (let tx = l; tx <= r; tx++) if (M.Map.isSolid(tx, ty)) return true;
    return false;
  }
  function reset() { if (M.VMission) M.VMission.cancel(); if (M.Bike) M.Bike.dismount(); if (M.Vehicles) M.Vehicles.reset(); P.x = M.Map.spawn.x; P.y = M.Map.spawn.y; P.dir = D.DOWN; P.frame = 0; P.t = 0; P.vx = P.vy = 0; P.run = false; dust.length = 0; }
  function face(ix, iy) {
    const ax = Math.abs(ix), ay = Math.abs(iy); let horiz = P.dir === D.LEFT || P.dir === D.RIGHT;
    if (horiz ? ay > ax * 1.3 : ax > ay * 1.3) horiz = !horiz;
    if (ay < 1e-6) horiz = true; else if (ax < 1e-6) horiz = false;
    P.dir = horiz ? (ix > 0 ? D.RIGHT : D.LEFT) : (iy > 0 ? D.DOWN : D.UP);
  }
  /* Dipanggil saat game dibekukan (dialog/panel): hentikan gerak & animasi tanpa menggeser posisi. */
  function settle() { if (M.Vehicles) M.Vehicles.idle(); P.vx = P.vy = 0; P.t = 0; P.frame = 0; P.run = false; stepping = false; lastFrame = 0; }
  function update(dt) {
    if (M.Vehicles && M.Vehicles.driving()) { M.Vehicles.drive(dt); return; }          // v2.0: sedang mengemudi
    const [ix, iy] = M.Input.get(), mag = Math.hypot(ix, iy);
    if (mag > 1e-4) face(ix, iy);
    // v0.4²: kecepatan mendekati target secara eksponensial (bebas dari laju frame) -> tidak patah saat input berubah/berhenti
    const rid = !!(M.Bike && M.Bike.riding()), run = mag > 0.05 && M.Input.running(), spd = SPEED * (rid ? M.Bike.mult(run) : run ? (M.C.RUN_MULT || 1.7) : 1); P.run = run && !rid;     // v1.0: lari = pengali kecepatan; vektor input sudah dinormalkan -> diagonal tidak lebih cepat
    const tx = ix * spd, ty = iy * spd, tau = mag > 1e-4 ? M.C.ACCEL_TAU : M.C.DECEL_TAU, a = 1 - Math.exp(-dt / tau);
    P.vx += (tx - P.vx) * a; P.vy += (ty - P.vy) * a;
    if (mag <= 1e-4 && Math.abs(P.vx) < 1.5 && Math.abs(P.vy) < 1.5) P.vx = P.vy = 0;
    const ox = P.x, oy = P.y;
    if (Math.abs(P.vx) > 1e-4) {
      const nx = P.x + P.vx * dt;
      if (!hit(nx, P.y)) P.x = nx;
      else { P.x = P.vx > 0 ? Math.floor((nx + HW) / T) * T - HW - 0.01 : (Math.floor((nx - HW) / T) + 1) * T + HW; P.vx = 0; }
    }
    if (Math.abs(P.vy) > 1e-4) {
      const ny = P.y + P.vy * dt;
      if (!hit(P.x, ny)) P.y = ny;
      else { P.y = P.vy > 0 ? Math.floor(ny / T) * T - 0.01 : (Math.floor((ny - HH) / T) + 1) * T + HH; P.vy = 0; }
    }
    P.x = Math.max(HW, Math.min(M.Map.pxW - HW, P.x)); P.y = Math.max(HH, Math.min(M.Map.pxH, P.y));
    const moved = Math.hypot(P.x - ox, P.y - oy) / Math.max(dt, 1e-4);      // kecepatan nyata (px/dtk), 0 bila menabrak
    if (rid) { M.Bike.advance(moved, dt); P.frame = 0; P.t = 0; stepping = false; dust.length = 0; lastFrame = 0; return; }       // v3.1: bersepeda (tanpa animasi langkah/debu/suara langkah)
    if (moved > 4 && mag > 1e-4) { P.t += dt * Math.max(0.55, Math.min(1.15, moved / spd)) * (run ? (M.C.RUN_ANIM || 1.9) : 1); P.frame = Math.floor(P.t * ANIM_FPS) % 4; }
    else if (moved <= 4 && mag <= 1e-4) { P.t = 0; P.frame = 0; }
    /* v0.4³: langkah kaki — satu bunyi saat mulai berjalan, lalu tiap kaki menapak (frame 0/2). Berhenti/menabrak/dialog = diam. */
    if (moved > 4 && mag > 1e-4) {
      if (!stepping) { stepping = true; M.Audio.step(M.Map.tileAt(P.x, P.y - 1)); }
      else if (P.frame !== lastFrame && (P.frame === 0 || P.frame === 2)) M.Audio.step(M.Map.tileAt(P.x, P.y - 1));
    } else stepping = false;
    if (run && moved > 4 && P.frame !== lastFrame && (P.frame === 0 || P.frame === 2)) { if (dust.length >= 8) dust.shift(); dust.push({ x: P.x + (Math.random() * 4 - 2), y: P.y - 1, t: 0 }); }
    for (let i = dust.length - 1; i >= 0; i--) { dust[i].t += dt; if (dust[i].t > 0.28) dust.splice(i, 1); }
    lastFrame = P.frame;
  }
  function draw(ctx, cx, cy) {
    if (M.Vehicles && M.Vehicles.driving()) return;
    if (M.Bike && M.Bike.riding()) { M.Bike.draw(ctx, cx, cy, P); return; }
    for (const d of dust) { ctx.globalAlpha = 0.5 * (1 - d.t / 0.28); ctx.fillStyle = '#e4d6ae'; const r = 2 + Math.floor(d.t * 8); ctx.fillRect(Math.round(d.x - cx - r / 2), Math.round(d.y - cy - d.t * 8), r, r); }
    ctx.globalAlpha = 1;
    if (P.run) {                                                              // v1.0: sprite lari (condong ke depan) + bayangan gerak di belakang + tubuh terangkat tiap langkah
      const lift = (P.frame === 1 || P.frame === 3) ? 2 : 0, im = S.playerRun[P.dir][P.frame], bx = M.View.snap(P.x - 12 - cx), by = M.View.snap(P.y - 14 - cy - lift);
      const vx = P.dir === 2 ? 1 : P.dir === 3 ? -1 : 0, vy = P.dir === 1 ? 1 : P.dir === 0 ? -1 : 0;
      ctx.globalAlpha = 0.16; ctx.drawImage(im, bx + vx * 7, by + vy * 5 + lift); ctx.globalAlpha = 0.3; ctx.drawImage(im, bx + vx * 3, by + vy * 2 + lift); ctx.globalAlpha = 1;
      ctx.drawImage(im, bx, by); return;
    }
    ctx.drawImage(S.player[P.dir][P.frame], M.View.snap(P.x - 8 - cx), M.View.snap(P.y - 14 - cy));
  }
  M.Player = { state: P, reset, update, settle, draw };
})(window.MPH);
