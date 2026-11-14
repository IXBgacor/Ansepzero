/* Loop utama (requestAnimationFrame), kamera, dan urutan render.
   v0.5²: kamera = pengikut pemain + offset geser (drag) yang kembali halus saat dilepas + mode sinematik (pusat & zoom diatur cutscene). Semua dibatasi batas peta.
   v0.4²: kanvas memenuhi layar pada resolusi PERANGKAT. Skala (piksel perangkat per piksel logis) selalu bilangan bulat agar pixel art tajam;
   ukuran pandangan (VIEW_W x VIEW_H, piksel logis) dihitung dari layar sehingga tidak ada pita hitam. Kamera dan karakter dibulatkan ke
   piksel perangkat (bukan piksel logis), sehingga gerak halus tanpa getaran akibat pembulatan. */
(function (M) {
  const T = M.C.TILE, V = M.View;
  let ctx, canvas, running = false, last = 0, time = 0, ready = false, frozen = false, bottomPx = 0;
  const cam = { x: 0, y: 0, z: 1 };
  const pan = { x: 0, y: 0, dragging: false, hold: 0 };    // v0.5²: offset kamera akibat geser (piksel logis)
  let cine = null;                                         // v0.5²: {x,y,z} = pusat dunia + zoom saat cutscene; null = kamera biasa

  function init(cv) {
    canvas = cv; ctx = canvas.getContext('2d', { alpha: false });
    M.Map.build(); M.Map.applyStates(); M.Player.reset(); resize(innerWidth, innerHeight); ready = true;
  }
  /* Hitung skala & ukuran pandangan dari ukuran stage (piksel CSS). */
  function resize(cssW, cssH, dprIn) {
    const dpr = dprIn || window.devicePixelRatio || 1, devW = Math.max(1, Math.round(cssW * dpr)), devH = Math.max(1, Math.round(cssH * dpr));
    const s1 = Math.round(devH / M.C.VIEW_TARGET_H), s2 = Math.floor(devW / M.C.VIEW_MIN_W);
    let s = Math.max(1, Math.min(s1, s2));
    const sMax = Math.max(3, Math.floor(devW / 150)); s = Math.max(2, Math.min(sMax, s + (M.C.ZOOM_OFF || 0)));         // v2.0: zoom = langkah skala bilangan bulat (pixel art tetap tajam)
    M.C.ZOOM_BASE = Math.max(1, Math.min(s1, s2)); M.C.ZOOM_S = s; M.C.ZOOM_SMAX = sMax;
    const vw = Math.ceil(devW / s), vh = Math.ceil(devH / s);
    V.s = s; V.dpr = dpr; V.k = s / dpr; V.w = vw; V.h = vh; M.C.VIEW_W = vw; M.C.VIEW_H = vh;
    canvas.width = vw * s; canvas.height = vh * s;
    canvas.style.width = (canvas.width / dpr) + 'px'; canvas.style.height = (canvas.height / dpr) + 'px';
    ctx.imageSmoothingEnabled = false;
    if (ready) render();
  }
  /* Area pandangan yang dianggap "terlihat jelas" (tidak tertutup HUD atas) dalam piksel logis. */
  function safeView() { const k = V.k; return { l: 8, r: V.w - 8, t: 44 / k, b: V.h - bottomPx / k }; }
  function setBottomBar(px) { bottomPx = px || 0; }
  const bottomBar = () => bottomPx;

  function camAxis(p, view, map) { return view >= map ? V.snap((map - view) / 2) : V.snap(Math.max(0, Math.min(map - view, p - view / 2))); }
  /* Kamera pengikut pemain (tanpa offset geser). Dipakai juga oleh interact.js agar "terlihat di layar" tidak ikut berubah saat kamera digeser. */
  function baseCam() { const p = M.Player.state, m = M.Map; return { x: camAxis(p.x, V.w, m.pxW), y: camAxis(p.y - 8, V.h, m.pxH) }; }
  /* Rentang offset geser yang masih di dalam peta: kamera tidak boleh menampilkan area di luar peta. */
  function panRange(b) {
    const m = M.Map, o = M.C.CAM_OVERSCROLL == null ? 56 : M.C.CAM_OVERSCROLL;          // v0.5⁴: kamera geser boleh melewati tepi peta sejauh o piksel (≈3 petak), tidak lebih
    const rx = V.w >= m.pxW ? [-o, o] : [-b.x - o, m.pxW - V.w - b.x + o], ry = V.h >= m.pxH ? [-o, o] : [-b.y - o, m.pxH - V.h - b.y + o];
    const cap = M.C.CAM_MAX_PAN || 9999; return { x0: Math.max(rx[0], -cap), x1: Math.min(rx[1], cap), y0: Math.max(ry[0], -cap), y1: Math.min(ry[1], cap) };
  }
  function clampPan(b) { const r = panRange(b || baseCam()); pan.x = Math.max(r.x0, Math.min(r.x1, pan.x)); pan.y = Math.max(r.y0, Math.min(r.y1, pan.y)); }
  const canPan = () => running && !frozen && !cine && M.C.CAM_DRAG !== false && !(M.HUD2 && M.HUD2.pinching());
  function panStart() { if (!canPan()) return false; pan.dragging = true; return true; }
  function panMove(dxCss, dyCss) {                       // dx/dy = gerak jari/mouse (piksel CSS) sejak event terakhir
    if (!pan.dragging || !canPan()) { if (pan.dragging) panEnd(); return; }
    const g = (M.C.CAM_DRAG_INVERT ? 1 : -1) / V.k; pan.x += dxCss * g; pan.y += dyCss * g; clampPan();
  }
  function panEnd() { if (!pan.dragging) return; pan.dragging = false; pan.hold = M.C.CAM_RETURN_HOLD == null ? 0.18 : M.C.CAM_RETURN_HOLD; }
  /* Kembali ke pemain dengan easing eksponensial (bebas laju frame). Pemain mulai berjalan = langsung kembali (tanpa jeda). */
  function updatePan(dt) {
    if (pan.dragging) { if (!canPan()) panEnd(); else { clampPan(); return; } }
    if (pan.x === 0 && pan.y === 0) return;
    const mv = M.Input.get(); if (!frozen && (mv[0] || mv[1])) pan.hold = 0;
    if (pan.hold > 0) { pan.hold -= dt; return; }
    const a = 1 - Math.exp(-dt / (M.C.CAM_RETURN_TAU || 0.17)); pan.x -= pan.x * a; pan.y -= pan.y * a;
    if (Math.hypot(pan.x, pan.y) < 0.12) pan.x = pan.y = 0;
    clampPan();
  }
  function setCine(c) { const was = !!cine; cine = c ? { x: c.x, y: c.y, z: Math.max(1, c.z || 1) } : null; if (cine && !was) { panEnd(); pan.x = pan.y = 0; pan.hold = 0; } if (!cine) { pan.x = pan.y = 0; pan.hold = 0; } }
  const camPose = () => { const p = M.Player.state; return { x: p.x, y: p.y - 8 }; };   // pusat dunia yang diikuti kamera biasa (untuk cutscene)
  function render() {
    const p = M.Player.state, m = M.Map, s = V.s;
    let cx, cy, z = 1;
    if (cine) { z = cine.z; cx = V.snap(camAxisF(cine.x, V.w / z, m.pxW)); cy = V.snap(camAxisF(cine.y, V.h / z, m.pxH)); }
    else { const b = baseCam(); clampPan(b); cx = V.snap(b.x + pan.x); cy = V.snap(b.y + pan.y); }
    ctx.setTransform(s * z, 0, 0, s * z, 0, 0); ctx.imageSmoothingEnabled = false;
    cam.x = cx; cam.y = cy; cam.z = z;
    const vw = V.w / z, vh = V.h / z, out = cx < 0 || cy < 0 || cx + vw > m.pxW || cy + vh > m.pxH;
    if (out) { ctx.fillStyle = '#0d2c1d'; ctx.fillRect(0, 0, Math.ceil(vw) + 1, Math.ceil(vh) + 1); }
    m.drawGround(ctx, cx, cy, time);
    if (out) drawOutside(ctx, cx, cy, vw, vh);
    M.World.drawRings(ctx, cx, cy, time);
    if (M.Evac) M.Evac.drawGround(ctx, cx, cy, time);             // v0.6: jalur evakuasi + batas area aman
    if (M.Spots) M.Spots.draw(ctx, cx, cy, time);                  // v0.5⁴: tanda tempat ideal interaksi (di tanah)
    const list = [];
    for (const o of m.objects) {
      const sx = o.tx * T - cx, sy = o.ty * T - cy, ow = (o.w || 1) * T, oh = (o.h || 1) * T;
      if (sx > -ow && sx < V.w / z + 2 && sy > -oh - 16 && sy < V.h / z + 32) list.push({ y: (o.ty + (o.h || 1)) * T, o });
    }
    for (const poi of M.World.pois) {
      const ox = poi._ov ? poi._ov.x : poi.tx * T, oy = poi._ov ? poi._ov.y : poi.ty * T, sx = ox - cx, sy = oy - cy;      // v0.5⁴: _ov = posisi sementara NPC berjalan saat cutscene
      if (sx > -T && sx < V.w / z + T && sy > -T && sy < V.h / z + 24) list.push({ y: poi._ov ? oy + T : (poi.ty + 1) * T, poi });
    }
    if (!(M.Vehicles && M.Vehicles.driving())) list.push({ y: p.y, player: true });
    if (M.Vehicles) M.Vehicles.entities(list); if (M.VMission) M.VMission.entities(list);                       // v2.0: kendaraan (traktor, ambulans, mobil pemadam)
    if (M.Cutscene && M.Cutscene.active) M.Cutscene.entities(list);        // v0.5²: mobil & petugas pemadam ikut urutan kedalaman
    list.sort((a, b) => a.y - b.y);
    for (const e of list) e.player ? M.Player.draw(ctx, cx, cy) : e.poi ? M.World.draw(ctx, e.poi, cx, cy, time) : e.draw ? e.draw(ctx, cx, cy, time) : m.drawObject(ctx, e.o, cx, cy);
    M.World.drawOverlay(ctx, cx, cy, time);
    if (M.Cutscene && M.Cutscene.active) M.Cutscene.drawFx(ctx, cx, cy, time);   // percikan air
    M.World.drawGuide(ctx, cx, cy);                 // panah tujuan di tepi layar (hanya bila target di luar layar)
  }
  /* v0.5⁴: area di luar peta (hanya terlihat saat kamera digeser keluar tepi) digambar sebagai hutan gelap yang berlanjut. */
  function drawOutside(ctx, cx, cy, vw, vh) {
    const m = M.Map, S = M.Sprites, x0 = Math.floor(cx / T) - 1, x1 = Math.ceil((cx + vw) / T), y0 = Math.floor(cy / T) - 1, y1 = Math.ceil((cy + vh) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (tx >= 0 && ty >= 0 && tx < M.C.MAP_W && ty < M.C.MAP_H) continue;
      const h = (Math.imul(tx, 73856093) ^ Math.imul(ty, 19349663)) >>> 0; ctx.fillStyle = h % 5 ? '#143a24' : '#0f3020'; ctx.fillRect(tx * T - cx, ty * T - cy, T, T);
      if (h % 100 < 78) ctx.drawImage(S.tree, tx * T - cx, ty * T + T - 24 - cy);
    }
    ctx.globalAlpha = 0.28; ctx.fillStyle = '#04100a';                    // bayangan tepi: peta terasa berakhir di sini
    ctx.fillRect(-cx - 400, -cy - 400, 400, m.pxH + 800); ctx.fillRect(m.pxW - cx, -cy - 400, 400, m.pxH + 800); ctx.fillRect(-cx, -cy - 400, m.pxW, 400); ctx.fillRect(-cx, m.pxH - cy, m.pxW, 400); ctx.globalAlpha = 1;
  }
  const camAxisF = (p, view, map) => view >= map ? (map - view) / 2 : Math.max(0, Math.min(map - view, p - view / 2));
  function frame(now) {
    if (!running) return;
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; time += dt;   // v0.4²: dt tidak pernah negatif (bug frame pertama)
    if (M.Vehicles) M.Vehicles.tick(dt); if (M.Bike) M.Bike.tick(dt); if (M.VMission) M.VMission.tick(dt);
    if (!frozen) M.Player.update(dt); else M.Player.settle();
    updatePan(dt); if (M.Cutscene) M.Cutscene.update(dt);
    M.Interact.update(); if (M.UI) M.UI.tick(); if (M.MapUI) M.MapUI.tick(); render();
    requestAnimationFrame(frame);
  }
  function start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(t => { last = Math.min(last, t); frame(t); }); }
  function stop() { running = false; panEnd(); M.Input.clear(); }
  addEventListener('resize', () => { if (M.Spots) M.Spots.reset(); });          // v0.5⁴: tempat ideal bergantung ukuran layar (hazard harus terlihat)
  function freeze(on) { frozen = !!on; document.body.classList.toggle('frozen', frozen); if (on) { panEnd(); pan.hold = 0; M.Input.clear(); } }   // v0.5²: dialog/panel/cutscene membatalkan geser; kamera kembali ke pemain secara halus
  M.Game = { init, start, stop, freeze, resize, resizeView: resize, render, bottomBar, safeView, setBottomBar, cam, baseCam, panStart, panMove, panEnd, canPan, setCine, camPose, pan,
    panState: () => ({ x: pan.x, y: pan.y, dragging: pan.dragging, hold: pan.hold }), get cine() { return !!cine; }, get frozen() { return frozen; }, get running() { return running; }, restart: () => { M.Player.reset(); render(); }, get ready() { return ready; } };
})(window.MPH);
