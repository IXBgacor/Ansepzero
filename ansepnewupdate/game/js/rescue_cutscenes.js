/* Cutscene v0.6: 'village' (pertama kali masuk desa), 'emergency' (awal keadaan darurat), 'final' (cutscene besar setelah evakuasi: kendaraan pemadam + helikopter menangani api
   sebagai pekerjaan petugas profesional; pemain tidak memadamkan api). Memakai mesin cutscene.js; 'final' menggantikan cutscene pemadam v0.5².
   Semua kendaraan di jalan tanah baris 12-13 (dicek tabrakan), petugas/warga memakai jalur BFS. Jumlah partikel dibatasi untuk perangkat Android kelas menengah. */
(function (M) {
  'use strict';
  const Cs = M.Cutscene, L = Cs.lib, { ease, lerp, clamp, poiC, camPath, walker, hash, D, T } = L, S = () => M.Sprites, V = M.View, VL = () => M.Village.L;
  const me = () => M.Game.camPose(), tile = (x, y) => ({ x: x * T + 8, y: y * T + 8 }), frame = (tm, n, f) => Math.floor(tm * f) % n;
  const loop = (au, k, g) => (g > 0.004 ? au.cutPlay(k, { loop: true, gain: g, fade: 0.6 }) : au.cutStop(k, 0.7));
  const txt = (ctx, s, x, y, cx, cy, col, size) => { ctx.save(); ctx.font = 'bold ' + (size || 6) + 'px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(s, Math.round(x - cx) + 0.6, Math.round(y - cy) + 0.6); ctx.fillStyle = col || '#fff'; ctx.fillText(s, Math.round(x - cx), Math.round(y - cy)); ctx.restore(); };
  const bubble = (ctx, s, x, y, cx, cy) => { ctx.save(); ctx.font = 'bold 6px monospace'; const w = Math.ceil(ctx.measureText(s).width) + 6, bx = Math.round(x - w / 2 - cx), by = Math.round(y - 12 - cy); ctx.fillStyle = '#fff'; ctx.fillRect(bx, by, w, 10); ctx.fillRect(bx + 3, by + 10, 3, 2); ctx.fillStyle = '#222'; ctx.textAlign = 'center'; ctx.fillText(s, bx + w / 2, by + 7.5); ctx.restore(); };
  const screenRect = (ctx, col, a) => { const s = L.screen(); ctx.globalAlpha = clamp(a, 0, 1); ctx.fillStyle = col; ctx.fillRect(0, 0, s.w, s.h); ctx.globalAlpha = 1; };
  const puffs = (ctx, x, y, tm, cx, cy, n, size, col, rise, drift) => { ctx.fillStyle = col; for (let i = 0; i < n; i++) { const ph = (tm * 0.28 + i / n) % 1; ctx.globalAlpha = Math.max(0, (1 - ph) * 0.55);
    L.disc(ctx, Math.round(x + Math.sin(ph * 6 + i * 2) * 3 + ph * (drift || 8) - cx), Math.round(y - ph * (rise || 40) - cy), Math.round(size * (0.6 + ph * 0.9))); } ctx.globalAlpha = 1; };
  const fireC = () => { const c = tile(VL().fire[0], VL().fire[1]); return c; };

  /* ========== 1. Pertama kali masuk desa ========== */
  Cs.define('village', {
    total: 9.2, skipAfter: 2,
    caps: [[0.3, 'Desa Rimba Asri'], [2.2, 'Rumah-rumah warga berdiri di tepi hutan.'], [5.2, 'Kenali jalur evakuasi dan titik kumpul desa.'], [8.2, '']],
    cam: camPath([{ t: 0, x: () => me().x, y: () => me().y, z: 1 }, { t: 1.0, x: () => me().x, y: () => me().y, z: 1 }, { t: 2.8, x: () => poiC('e_officer').x, y: () => poiC('e_officer').y - 10, z: 1.1 }, { t: 5.0, x: () => poiC('e_officer').x + 12, y: () => poiC('e_officer').y - 6, z: 1.15 },
      { t: 6.4, x: () => poiC('e_assembly').x, y: () => poiC('e_assembly').y - 6, z: 1.2 }, { t: 8.0, x: () => poiC('e_assembly').x, y: () => poiC('e_assembly').y - 6, z: 1.2 }, { t: 9.1, x: () => me().x, y: () => me().y, z: 1 }]),
    drawFx(ctx, cx, cy, tm, st, t) {
      const spark = (c, k) => ctx.drawImage(S().fx.spark[frame(tm + k * 0.4, 2, 5)], Math.round(c.x - 3.5 - cx), Math.round(c.y - 3.5 - cy));
      if (t > 3.2 && t < 6) { const c = poiC('e_board'); spark({ x: c.x - 9, y: c.y - 16 }, 0); spark({ x: c.x + 9, y: c.y - 14 }, 1); }
      if (t > 5.8 && t < 8.4) { const c = poiC('e_assembly'); spark({ x: c.x - 9, y: c.y - 16 }, 0); spark({ x: c.x + 9, y: c.y - 14 }, 1); }
    },
    audio(t, au) { loop(au, 'village', 0.16); loop(au, 'forest', 0.05); },
    events: [[1.0, au => au.cutPlay('whoosh', { gain: 0.14 })], [5.8, au => au.cutPlay('whoosh', { gain: 0.14 })], [7.9, au => au.cutPlay('chime', { gain: 0.35 })]]
  });

  /* ========== 2. Awal keadaan darurat ========== */
  Cs.define('emergency', {
    total: 15.4, skipAfter: 2,
    caps: [[0.4, 'Keadaan darurat!'], [2.4, 'Asap tebal terlihat dari utara. Angin membawanya ke arah desa.'], [6.2, 'Kentongan dibunyikan. Warga mulai bersiap.'], [9.8, 'Petugas memberi arahan: tenang dan ikuti jalur evakuasi.'], [13.2, 'Bantu warga menuju titik kumpul!'], [14.8, '']],
    cam: camPath([{ t: 0, x: () => me().x, y: () => me().y, z: 1 }, { t: 1.2, x: () => me().x, y: () => me().y, z: 1 }, { t: 3.2, x: () => fireC().x, y: () => fireC().y + 62, z: 1.05 }, { t: 5.6, x: () => fireC().x, y: () => fireC().y + 62, z: 1.05 },
      { t: 7.4, x: () => poiC('e_bell').x + 28, y: () => poiC('e_bell').y, z: 1.2 }, { t: 9.4, x: () => poiC('e_officer').x - 10, y: () => poiC('e_officer').y, z: 1.2 }, { t: 12.6, x: () => poiC('e_officer').x - 10, y: () => poiC('e_officer').y, z: 1.2 }, { t: 14.6, x: () => me().x, y: () => me().y, z: 1 }]),
    drawFx(ctx, cx, cy, tm, st, t) {
      const f = fireC(), h = (t < 1 ? 0 : t < 6 ? ease((t - 1) / 5) : 1) * 0.26;
      if (h > 0.004) screenRect(ctx, '#8a6a4a', h);
      if (t > 1.5) { const s = L.screen(); ctx.fillStyle = '#9a9488'; for (let i = 0; i < 7; i++) { ctx.globalAlpha = h * 0.7; const x = ((tm * (7 + i) + i * 61) % (s.w + 60)) - 30, y = (i * 29 + 10) % s.h; L.disc(ctx, Math.round(x), Math.round(y), 7 + (i % 3) * 3); } ctx.globalAlpha = 1; }
      puffs(ctx, f.x, f.y + 8, tm, cx, cy, 4, 5, '#6a6a70', 60, 40);
      if (t > 6.6 && t < 12) for (const id of ['v1', 'v2', 'v3', 'v5']) { const c = poiC(id); ctx.drawImage(S().fx.bang, Math.round(c.x - 4.5 - cx), Math.round(c.y - 26 + Math.sin(tm * 7 + c.x) * 1.5 - cy)); }
      if (t > 7.6 && t < 10) bubble(ctx, 'Ayo bersiap!', poiC('v2').x, poiC('v2').y - 8, cx, cy);
      if (t > 9.8 && t < 13) bubble(ctx, 'Tenang! Ikuti arahan!', poiC('e_officer').x, poiC('e_officer').y - 8, cx, cy);
      if (t > 3 && t < 6) { const p = 0.5 + 0.5 * Math.sin(tm * 4); screenRect(ctx, '#7a1a08', 0.06 + 0.05 * p); }
    },
    audio(t, au) { loop(au, 'alarm', t > 0.4 && t < 13 ? 0.2 : 0); loop(au, 'wind', t > 1 ? 0.1 : 0); loop(au, 'crowd', t > 6 ? 0.12 : 0); loop(au, 'fire', t > 1.5 && t < 6 ? 0.07 : 0); },
    events: [[1.2, au => au.cutPlay('whoosh', { gain: 0.16 })], [7.2, au => au.cutPlay('whoosh', { gain: 0.14 })], [9.6, au => au.cutPlay('radio-beep', { gain: 0.4 })], [13.2, au => au.cutPlay('chime', { gain: 0.3 })]]
  });

  /* ========== 3. Cutscene besar setelah evakuasi ('final') ========== */
  const GY = 216, FIGHT_GOALS = [[790, 64], [792, 92], [772, 112], [744, 124]];
  /* v2.0: truk keluar dari PINTU GARASI Pos Pemadam (region.js) -> Jalan Lintas Selatan -> jalan evakuasi (x 49-50) -> posisi siaga di ujung utara dekat hutan terbakar.
     Semua titik berada di jalan tanah nyata di peta; tidak ada truk yang muncul dari tepi layar. */
  const mkTruck = (i, t0) => { const R = M.Region.L.route, d = M.Region.L.station.doors[i % 2], sp = R.stops[i % 2];
    const pts = [{ x: d, y: 626 }, { x: d, y: R.laneY }, { x: R.northX, y: R.laneY }, { x: sp.x, y: sp.y }]; let len = 0; const seg = [];
    for (let k = 1; k < pts.length; k++) { const l = Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y); seg.push(l); len += l; }
    return { pts, seg, len, dur: 9.6, stop: sp, t0, x: pts[0].x, y: pts[0].y, dir: 'down', moving: false }; };
  const truckAt = (tr, t) => { const u = clamp((t - tr.t0) / tr.dur, 0, 1), e = 0.5 * u + 0.5 * u * (2 - u); let d = e * tr.len, k = 0; while (k < tr.seg.length - 1 && d > tr.seg[k]) { d -= tr.seg[k]; k++; }
    const a = tr.pts[k], b = tr.pts[k + 1], f = tr.seg[k] ? d / tr.seg[k] : 1; tr.x = lerp(a.x, b.x, f); tr.y = lerp(a.y, b.y, f);
    const dx = b.x - a.x, dy = b.y - a.y; tr.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); tr.moving = t >= tr.t0 && u < 1; };
  const fireKAt = t => t < 15 ? 1 : t < 21 ? lerp(1, 0.6, ease((t - 15) / 6)) : t < 30 ? lerp(0.6, 0.06, ease((t - 21) / 9)) : t < 33 ? lerp(0.06, 0, ease((t - 30) / 3)) : 0;
  const drops = [[20.8, 24.6, 28.2]];
  Cs.define('final', {
    total: 36, skipAfter: 3,
    caps: [[0.4, 'Desa Rimba Asri dilihat dari kejauhan.'], [3.0, 'Warga berkumpul di titik aman. Petugas memeriksa kondisi warga.'], [4.6, 'Alarm berbunyi. Truk pemadam keluar dari pos pemadam dan melaju lewat jalan desa.'], [11.6, 'Helikopter terlihat dari kejauhan.'],
      [15.0, 'Petugas profesional menangani kebakaran dari area aman.'], [20.0, 'Kendaraan pemadam dan helikopter bekerja bersama.'], [26.0, 'Api perlahan berkurang. Asap menipis.'], [31.4, 'Desa selamat. Semua warga aman.'], [35.0, '']],
    init() {
      const st = { fireK: 1, trucks: [mkTruck(0, 4.2), mkTruck(1, 5.0)], fighters: [], jet: 0, heli: null, off: null, bursts: [] };
      const pl = M.Player.state; if (!M.Village.inAssembly(pl.x, pl.y)) { const s = M.Evac.slotOf(8); pl.x = s.x + 12; pl.y = s.y - 6; pl.vx = pl.vy = 0; }
      const o = M.World.byId.e_off2, sx = o.tx * T + 8, sy = o.ty * T + 14, s1 = M.Evac.slotOf(1), s2 = M.Evac.slotOf(4), s3 = M.Evac.slotOf(2), pts = [{ x: sx, y: sy }, { x: s1.x - 12, y: s1.y - 6 }, { x: s2.x - 12, y: s2.y + 4 }, { x: s3.x + 12, y: s3.y }];
      const path = [pts[0]]; for (let i = 1; i < pts.length; i++) { const q = M.Map.findPath(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y); if (q) q.slice(1).forEach(z => path.push(z)); }
      st.off = { poi: o, w: walker(path, 30, 3.4), home: { x: sx, y: sy } };
      /* petugas pemadam: turun dari truk, berdiri di sisi selatan truk (jalur BFS) */
      for (let k = 0; k < 4; k++) { const tr = st.trucks[k % 2], start = { x: tr.stop.x + 22, y: tr.stop.y + (k > 1 ? 4 : -4) }, goal = { x: FIGHT_GOALS[k][0], y: FIGHT_GOALS[k][1] };
        const q = M.Map.findPath(start.x, start.y, goal.x, goal.y) || [start, goal]; st.fighters.push({ k, v: k % 3, w: walker(q, 40, 14.2 + (k % 2) * 0.9 + (k > 1 ? 0.2 : 0)), x: start.x, y: start.y, dir: D.DOWN, vis: false, arrived: false, tr }); }
      st.heli = { pts: [{ x: fireC().x + 340, y: fireC().y - 120 }, { x: fireC().x + 56, y: fireC().y - 14 }, { x: fireC().x + 46, y: fireC().y - 10 }], t0: 11.4 };
      return st;
    },
    cam: (() => { let k = null; return (t, st) => { if (!k || k.st !== st) { const asm = tile(49, 31), ft = fireC(); const f = camPath([{ t: 0, x: tile(50, 20).x, y: tile(50, 20).y, z: 1 }, { t: 2.6, x: tile(50, 21).x, y: tile(50, 21).y, z: 1 }, { t: 4.2, x: asm.x, y: asm.y - 4, z: 1.25 }, { t: 5.6, x: asm.x, y: asm.y - 4, z: 1.25 },
        { t: 7.4, x: () => st.trucks[0].x, y: () => st.trucks[0].y - 12, z: 1.2 }, { t: 13.8, x: () => st.trucks[0].x, y: () => st.trucks[0].y - 12, z: 1.2 }, { t: 16.0, x: ft.x - 10, y: ft.y + 26, z: 1.15 }, { t: 22.0, x: ft.x - 6, y: ft.y + 28, z: 1.15 }, { t: 24.0, x: tile(47, 7).x, y: ft.y + 56, z: 1.0 }, { t: 27.2, x: tile(47, 7).x, y: ft.y + 56, z: 1.0 }, { t: 29.0, x: ft.x - 8, y: ft.y + 36, z: 1.15 }, { t: 31.0, x: ft.x - 8, y: ft.y + 36, z: 1.15 }, { t: 32.8, x: asm.x, y: asm.y - 6, z: 1.2 }, { t: 35.3, x: asm.x, y: asm.y - 6, z: 1.2 }]); k = { st, f }; } return k.f(t); }; })(),
    fireK: t => fireKAt(t),
    update(t, dt, st) {
      st.fireK = fireKAt(t); st.jet = (t < 15 ? 0 : t < 16 ? t - 15 : t < 29 ? 1 : clamp(30 - t, 0, 1));
      st.trucks.forEach(tr => truckAt(tr, t));
      for (const f of st.fighters) { const r = f.w.at(t); f.vis = r.started && t >= 14.2; f.arrived = r.done; f.x = r.x; f.y = r.y; if (r.done) f.dir = D.UP; else if (r.dir != null) f.dir = r.dir; }
      const o = st.off; const r = o.w.at(t); o.poi._ov = { x: r.x - 8, y: r.y - 14, dir: r.dir != null ? r.dir : D.DOWN, moving: r.moving };
      st.bursts = st.bursts.filter(b => t - b.t < 1.6);
      for (const d of drops[0]) if (t >= d && !st.bursts.some(b => b.d === d)) st.bursts.push({ d, t });
      const h = st.heli, L0 = h.pts; const u = clamp((t - h.t0) / 6.5, 0, 1); let hx, hy; if (t < h.t0) { hx = L0[0].x; hy = L0[0].y; } else if (t < 30) { const e = ease(u); hx = lerp(L0[0].x, L0[1].x, e) + (t > 18 ? Math.sin(t * 0.9) * 6 : 0); hy = lerp(L0[0].y, L0[1].y, e) + (t > 18 ? Math.sin(t * 1.3) * 3 : 0); } else { const e = ease(clamp((t - 30) / 4.5, 0, 1)); hx = lerp(L0[1].x, L0[0].x + 120, e); hy = lerp(L0[1].y, L0[0].y - 30, e); }
      h.x = hx; h.y = hy; h.vis = t >= h.t0 - 0.2 && t < 34.6;
    },
    cleanup(st) { delete st.off.poi._ov; },
    entities(list, st, t) {
      const sp = S().truck4;
      st.trucks.forEach((tr, i) => list.push({ y: tr.y + 12 + i, draw: (ctx, cx, cy, tm) => { if (t < tr.t0) return; const bob = tr.moving ? (Math.floor(tm * 10) % 2) * 0.5 : 0, im = sp[tr.dir][Math.floor(tm * 4) % 2];
        ctx.globalAlpha = clamp((t - tr.t0) / 0.7, 0, 1); ctx.drawImage(im, V.snap(tr.x - im.width / 2 - cx), V.snap(tr.y - im.height / 2 - cy + bob)); ctx.globalAlpha = 1; } }));
      for (const f of st.fighters) if (f.vis) list.push({ y: f.y, draw: (ctx, cx, cy, tm) => ctx.drawImage(S().fighter[f.v][f.dir], V.snap(f.x - 8 - cx), V.snap(f.y - 14 - cy - (!f.arrived ? Math.floor(tm * 8 + f.k) % 2 : 0))) });
    },
    drawFx(ctx, cx, cy, tm, st, t) {
      const ft = fireC(), jet = st.jet;
      if (t < 12) screenRect(ctx, '#7a6a50', (t < 1 ? 0.12 : 0.14) * clamp((12 - t) / 3, 0, 1) + 0.04);
      if (jet > 0.02) st.fighters.forEach((f, k) => { if (!f.vis || !f.arrived) return;
        const nx = f.x - 5, ny = f.y - 9, gx = ft.x + 44 - k * 4, gy = ft.y + 8 + k * 14, n = Math.ceil(9 * jet);
        ctx.fillStyle = '#c8ccd2'; ctx.fillRect(Math.round(nx - 1 - cx), Math.round(ny - cy), 3, 2);
        for (let j = 0; j < n; j++) { const ph = (tm * 1.1 + k * 0.23 + j / 9) % 1, x = lerp(nx, gx, ph), y = lerp(ny, gy, ph) - Math.sin(Math.PI * ph) * 14; ctx.globalAlpha = ph > 0.9 ? 0.5 : 0.95; ctx.fillStyle = j % 2 ? '#e8f6ff' : '#8fcdf5'; ctx.fillRect(Math.round(x - cx), Math.round(y - cy), 2, 2); }
        ctx.globalAlpha = jet; for (let j = 0; j < 3; j++) { const h = (Math.floor(tm * 9) * 7 + j * 13 + k * 5) % 9; ctx.fillStyle = j % 2 ? '#fff' : '#a8d8f8'; ctx.fillRect(Math.round(gx + h - 4 - cx), Math.round(gy - (h * 3 + j * 2) % 7 - cy), 1, 1); } ctx.globalAlpha = 1; });
      const h = st.heli;
      if (h.vis) {
        ctx.globalAlpha = 0.25; ctx.fillStyle = '#000'; L.disc(ctx, Math.round(h.x + 20 - cx), Math.round(h.y + 70 - cy), 7); ctx.globalAlpha = 1;      // bayangan di tanah
        const im = S().heli[frame(tm, 2, 14)]; ctx.drawImage(im, Math.round(h.x - 20 - cx), Math.round(h.y - 12 - cy));
        if (t > 17 && t < 30) { const k = (t - 17) % 1; ctx.fillStyle = '#c8c8c8'; ctx.fillRect(Math.round(h.x - 1 - cx), Math.round(h.y + 12 - cy), 1, 16); ctx.drawImage(S().bucket, Math.round(h.x - 5 - cx), Math.round(h.y + 28 - cy)); }
      }
      st.bursts.forEach(b => { const age = t - b.t, hx = h.x, hy = h.y + 30; if (age < 0.9) { const u = age / 0.9, x = lerp(hx, ft.x - 10, u), y = lerp(hy, ft.y + 8, u * u); ctx.fillStyle = '#8fcdf5'; for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(x + (i % 3) * 3 - 3 - cx), Math.round(y - i * 2 - cy), 2, 3); }
        else { const u = (age - 0.9) / 0.7; puffs(ctx, ft.x - 10, ft.y + 10, tm, cx, cy, 4, 6, '#dfe6ea', 36, 4); ctx.globalAlpha = 1 - u; ctx.fillStyle = '#cfeaff'; for (let i = 0; i < 7; i++) ctx.fillRect(Math.round(ft.x - 10 + Math.cos(i) * (6 + u * 18) - cx), Math.round(ft.y + 8 + Math.sin(i * 2) * (3 + u * 8) - cy), 2, 1); ctx.globalAlpha = 1; } });
      if (t > 3.6 && t < 7) { const o = st.off.poi; bubble(ctx, t < 5.2 ? 'Semua aman?' : 'Tidak ada yang tertinggal.', poiC('e_off2').x, poiC('e_off2').y - 8, cx, cy); }
      if (t > 3 && t < 7.2) { const c = tile(49, 31); for (let i = 0; i < 3; i++) ctx.drawImage(S().fx.check, Math.round(c.x - 18 + i * 18 - cx), Math.round(c.y - 32 - cy)); }
      if (t > 31.6) { for (const id of ['v1', 'v3', 'v_anak']) { const c = poiC(id); ctx.drawImage(S().fx.heart, Math.round(c.x - 4.5 - cx), Math.round(c.y - 26 + Math.sin(tm * 3 + c.x) * 2 - cy)); } }
      if (t > 29) { puffs(ctx, ft.x - 6, ft.y + 6, tm, cx, cy, 3, 4, '#9a9aa0', 40, 14); }
    },
    audio(t, au) {
      const near = ease((t - 4) / 7);
      loop(au, 'crowd', t < 8 ? 0.1 : t > 31 ? 0.1 : 0.04); loop(au, 'wind', t < 12 ? 0.06 : 0.03);
      loop(au, 'engine', t > 4.0 && t < 15.5 ? 0.08 + 0.12 * near : 0); loop(au, 'siren', t > 4.0 && t < 15 ? 0.06 + 0.1 * near : 0);
      loop(au, 'heli', t > 10.5 && t < 34 ? (t < 17 ? 0.05 + 0.2 * ease((t - 10.5) / 6) : t < 30 ? 0.22 : 0.22 * clamp((34 - t) / 4, 0, 1)) : 0);
      loop(au, 'water', t > 15.5 && t < 29.5 ? 0.12 : 0); loop(au, 'fire', t < 33 ? 0.09 * fireKAt(t) : 0); loop(au, 'village', t > 31 ? 0.14 : 0);
    },
    events: [[3.0, au => au.cutPlay('whoosh', { gain: 0.14 })], [4.4, au => au.cutPlay('whoosh', { gain: 0.14 })], [11.0, au => au.cutPlay('radio-beep', { gain: 0.3 })], [14.0, au => au.cutPlay('brake', { gain: 0.3 })],
      [26.0, au => au.setTense(false, true)], [31.0, au => au.cutPlay('whoosh', { gain: 0.14 })], [33.6, au => au.cutPlay('chime', { gain: 0.45 })]]
  });

  /* ---------- pemicu cutscene desa (sekali) ---------- */
  const KEY = 'mph.v06'; let seen = {};
  const loadSeen = () => { try { const o = JSON.parse(M.Store.get(KEY) || 'null'); seen = o && o.seen && typeof o.seen === 'object' ? o.seen : {}; } catch (e) { seen = {}; } };
  const saveSeen = () => { try { M.Store.set(KEY, JSON.stringify({ v: 1, seen })); } catch (e) { /* abaikan */ } };
  function poll() {
    if (seen.village || M.C.VILLAGE_CUT === false || !M.Game.running || Cs.active || M.Game.frozen || M.Dialog.isOpen() || !M.Dialog.canOpen()) return;
    const pl = M.Player.state, tx = pl.x / T, ty = pl.y / T; if (tx >= 38 && tx <= 62 && ty >= 8 && ty <= 24) { seen.village = 1; saveSeen(); Cs.play('village', {}); }
  }
  loadSeen(); const o = Cs.update; Cs.update = dt => { o(dt); poll(); };
  M.Village.seen = () => Object.assign({}, seen);
  M.Village.markSeen = () => { seen.village = 1; saveSeen(); };      // v1.0: cerita pembuka sudah memperkenalkan desa
})(window.MPH);
