/* Cutscene tiap bab v0.5⁴ — diputar sekali ketika semua 5 misi sebuah bab selesai (setelah dialog penutup misi ditutup), sesuai isi quest bab itu:
   1 Kenali Hutan (pohon, satwa, gambut, sungai) · 2 Waspada Api (simulasi percikan dari puntung) · 3 Dampak (asap, udara, kesehatan, sekolah, ekonomi)
   4 Penjaga Masyarakat (warga berkumpul di Balai Desa) · 5 Pelaporan Aman (jarak aman, lokasi, radio/112, petugas bergerak) · 6 Pemulihan Lahan (kanal, bibit, lalu asap di utara).
   Semua aktor berjalan di atas jalur BFS yang menghindari objek. Dapat dilewati (setelah 2 dtk) dan diputar ulang dari panel "Bab & Misi" (bab yang sudah selesai).
   Status "sudah diputar" disimpan di localStorage 'mph.chcut' dan dihapus saat reset progres. Matikan semua: M.C.CH_CUT = false. */
(function (M) {
  'use strict';
  const L = M.Cutscene.lib, { ease, lerp, clamp, poiC, camPath, walker, hash, D, T } = L, S = () => M.Sprites, fx = () => S().fx, V = M.View;
  const me = () => M.Game.camPose(), pl = () => me();
  const at = (id, dx, dy) => () => poiC(id).x + (dx || 0), aty = (id, dy) => () => poiC(id).y + (dy || 0);
  const tile = (tx, ty) => ({ x: tx * T + 8, y: ty * T + 8 });
  const frame = (tm, n, f) => Math.floor(tm * f) % n;
  const spark = (ctx, x, y, tm, cx, cy, k) => { const im = fx().spark[frame(tm + (k || 0) * 0.37, 2, 5)]; ctx.drawImage(im, Math.round(x - 3.5 - cx), Math.round(y - 3.5 - cy)); };
  const sparks = (ctx, id, tm, cx, cy, t0, t1, t) => { if (t < t0 || t > t1) return; const c = poiC(id), a = clamp(Math.min((t - t0) / 0.4, (t1 - t) / 0.4), 0, 1); ctx.globalAlpha = a;
    for (let i = 0; i < 3; i++) spark(ctx, c.x + (i - 1) * 11, c.y - 14 - (i % 2) * 6 + Math.sin(tm * 3 + i) * 1.5, tm, cx, cy, i); ctx.globalAlpha = 1; };
  const puffs = (ctx, x, y, tm, cx, cy, n, size, col, rise) => { ctx.fillStyle = col; for (let i = 0; i < n; i++) { const ph = (tm * 0.3 + i / n) % 1; ctx.globalAlpha = Math.max(0, (1 - ph) * 0.6);
    L.disc(ctx, Math.round(x + Math.sin(ph * 6 + i * 2) * 3 + ph * 8 - cx), Math.round(y - ph * (rise || 40) - cy), Math.round(size * (0.6 + ph * 0.9))); } ctx.globalAlpha = 1; };
  const txt = (ctx, s, x, y, cx, cy, col, size) => { ctx.save(); ctx.font = 'bold ' + (size || 6) + 'px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(s, Math.round(x - cx) + 0.6, Math.round(y - cy) + 0.6); ctx.fillStyle = col || '#fff'; ctx.fillText(s, Math.round(x - cx), Math.round(y - cy)); ctx.restore(); };
  const bubble = (ctx, s, x, y, cx, cy) => { ctx.save(); ctx.font = 'bold 6px monospace'; const w = Math.ceil(ctx.measureText(s).width) + 6, bx = Math.round(x - w / 2 - cx), by = Math.round(y - 12 - cy); ctx.fillStyle = '#fff'; ctx.fillRect(bx, by, w, 10); ctx.fillRect(bx + 3, by + 10, 3, 2); ctx.fillStyle = '#222'; ctx.textAlign = 'center'; ctx.fillText(s, bx + w / 2, by + 7.5); ctx.restore(); };
  const screenRect = (ctx, col, a) => { const s = L.screen(); ctx.globalAlpha = clamp(a, 0, 1); ctx.fillStyle = col; ctx.fillRect(0, 0, s.w, s.h); ctx.globalAlpha = 1; };
  const lowFire = (au, g) => (g > 0.004 ? au.cutPlay('fire', { loop: true, gain: g, fade: 0.5 }) : au.cutStop('fire', 0.6));
  const loop = (au, k, g) => (g > 0.004 ? au.cutPlay(k, { loop: true, gain: g, fade: 0.5 }) : au.cutStop(k, 0.6));

  /* ========== BAB 1 — Kenali Hutan ========== */
  M.Cutscene.define('ch1', {
    total: 15, skipAfter: 2,
    caps: [[0.4, 'Bab 1 selesai — Kenali Hutan.'], [2.2, 'Pohon menyejukkan udara dan menahan tanah.'], [5.4, 'Hutan adalah rumah bagi burung dan satwa.'], [8.6, 'Gambut dan sungai menyimpan air. Jaga tetap basah.'], [12.0, 'Hutan yang sehat menjaga kita semua.'], [14.2, '']],
    cam: camPath([{ t: 0, x: () => me().x, y: () => me().y, z: 1 }, { t: 1.2, x: () => me().x, y: () => me().y, z: 1 }, { t: 3.2, x: at('bigtree'), y: aty('bigtree', -8), z: 1.3 }, { t: 5.2, x: at('bigtree'), y: aty('bigtree', -8), z: 1.3 },
      { t: 6.8, x: at('nest'), y: aty('nest', -4), z: 1.35 }, { t: 8.4, x: at('nest'), y: aty('nest', -4), z: 1.35 }, { t: 9.8, x: tile(5, 17).x, y: tile(5, 17).y, z: 1.2 }, { t: 11.4, x: tile(5, 17).x, y: tile(5, 17).y, z: 1.2 },
      { t: 12.6, x: at('riverside'), y: aty('riverside'), z: 1.2 }, { t: 13.6, x: at('riverside'), y: aty('riverside'), z: 1.2 }, { t: 14.9, x: () => me().x, y: () => me().y, z: 1 }]),
    drawFx(ctx, cx, cy, tm, st, t) {
      const tr = poiC('bigtree'), ne = poiC('nest'), ca = poiC('canal'), pe = poiC('peat'), ri = poiC('riverside');
      if (t > 1.5 && t < 7) { const k = clamp(Math.min((t - 1.5) / 1, (7 - t) / 1), 0, 1); for (let i = 0; i < 9; i++) { const ph = (t * 0.32 + i / 9) % 1; ctx.globalAlpha = k * 0.9; ctx.fillStyle = i % 3 ? '#4a9a3a' : '#8ad04a';
        ctx.fillRect(Math.round(tr.x + (hash(i) - 0.5) * 46 + Math.sin(ph * 7 + i) * 5 - cx), Math.round(tr.y - 26 + ph * 40 - cy), 2, 1); } ctx.globalAlpha = 1; }
      if (t > 2.6 && t < 6) { for (let i = 0; i < 4; i++) { const ph = (t * 0.4 + i / 4) % 1; ctx.globalAlpha = Math.min(1, (1 - ph) * 1.4); ctx.fillStyle = '#d8f4ff'; L.disc(ctx, Math.round(tr.x + 8 + (i - 1.5) * 9 - cx), Math.round(tr.y - 12 - ph * 30 - cy), 2); ctx.globalAlpha = 1; } txt(ctx, 'O₂', tr.x + 20, tr.y - 32 - Math.sin(tm * 3) * 1.5, cx, cy, '#d8f4ff', 7); }
      sparks(ctx, 'bigtree', tm, cx, cy, 3.0, 5.2, t);
      if (t > 6.0 && t < 12.2) for (let b = 0; b < 3; b++) { const age = t - 6.0 - b * 0.55; if (age < 0) continue; const bx = ne.x + age * 26, by = ne.y - 6 - age * 8 + Math.sin(age * 3.4 + b) * 5; ctx.drawImage(fx().bird[frame(tm + b, 2, 8)], Math.round(bx - 4.5 - cx), Math.round(by - 3 - cy)); }
      sparks(ctx, 'nest', tm, cx, cy, 6.8, 8.6, t);
      if (t > 9.0 && t < 12.4) { for (let r = 0; r < 3; r++) { const ph = (t * 0.7 + r / 3) % 1, rad = 3 + ph * 15; ctx.globalAlpha = (1 - ph) * 0.9; ctx.fillStyle = '#bfe4ff'; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; ctx.fillRect(Math.round(ca.x + Math.cos(a) * rad - cx), Math.round(ca.y + 8 + Math.sin(a) * rad * 0.45 - cy), 1, 1); } } ctx.globalAlpha = 1;
        for (let i = 0; i < 3; i++) { const ph = (t * 0.9 + i / 3) % 1; ctx.drawImage(fx().drop, Math.round(pe.x - 2 + (i - 1) * 7 - cx), Math.round(pe.y - 12 + ph * 16 - cy)); } }
      sparks(ctx, 'canal', tm, cx, cy, 9.8, 11.4, t);
      if (t > 11.6 && t < 14) for (let i = 0; i < 8; i++) { const on = Math.floor(tm * 4 + i * 1.7) % 3 === 0; if (on) { ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(ri.x + 36 + (hash(i + 9) - 0.5) * 22 - cx), Math.round(ri.y - 40 + hash(i + 3) * 70 - cy), 2, 1); } }
      sparks(ctx, 'riverside', tm, cx, cy, 12.4, 14, t);
    },
    audio(t, au) { loop(au, 'forest', t < 14 ? 0.2 : 0.12); },
    events: [[1.2, au => au.cutPlay('whoosh', { gain: 0.16 })], [5.2, au => au.cutPlay('whoosh', { gain: 0.16 })], [5.9, au => au.cutPlay('bird', { gain: 0.45 })], [8.4, au => au.cutPlay('whoosh', { gain: 0.16 })],
      [9.3, au => au.cutPlay('drip', { gain: 0.5 })], [10.0, au => au.cutPlay('drip', { gain: 0.45 })], [10.7, au => au.cutPlay('drip', { gain: 0.5 })], [12.5, au => au.cutPlay('whoosh', { gain: 0.14 })], [12.6, au => au.cutPlay('chime', { gain: 0.4 })]]
  });

  /* ========== BAB 2 — Waspada Api (simulasi) ========== */
  const FL = [[0, 0, 7.6], [-12, 5, 8.4], [11, 6, 9.0], [-5, -10, 9.6], [13, -6, 10.2]];
  M.Cutscene.define('ch2', {
    total: 15.4, skipAfter: 2,
    caps: [[0.4, 'Simulasi: bagaimana api kecil bermula.'], [2.6, 'Cuaca kering membuat semak mudah terbakar.'], [5.2, 'Satu puntung rokok bisa menjadi sumber api.'], [8.2, 'Api kecil cepat membesar jika dibiarkan.'], [11.2, 'Cegah sejak awal. Lapor, jangan padamkan sendiri!'], [14.2, '']],
    cam: camPath([{ t: 0, x: () => me().x, y: () => me().y, z: 1 }, { t: 1.2, x: () => me().x, y: () => me().y, z: 1 }, { t: 3.0, x: () => (poiC('drygrass').x + poiC('butt').x) / 2, y: () => poiC('drygrass').y - 4, z: 1.5 },
      { t: 13.0, x: () => (poiC('drygrass').x + poiC('butt').x) / 2, y: () => poiC('drygrass').y - 4, z: 1.5 }, { t: 15.0, x: () => me().x, y: () => me().y, z: 1 }]),
    drawFx(ctx, cx, cy, tm, st, t) {
      const g = poiC('drygrass'), b = poiC('butt'), fa = t < 12 ? 1 : clamp((13.6 - t) / 1.6, 0, 1);
      const heat = (t < 11.2 ? ease((t - 1.5) / 2) : clamp((13.4 - t) / 2.2, 0, 1)) * 0.13; if (heat > 0.005) { screenRect(ctx, '#ff9a30', heat); ctx.globalAlpha = heat * 2.2; ctx.fillStyle = '#ffe0a0'; const s = L.screen(); for (let y = 6; y < s.h; y += 9) ctx.fillRect(0, y + Math.sin(tm * 2 + y) * 1.5, s.w, 1); ctx.globalAlpha = 1; }
      if (t > 4.2 && t < 12.6) { const blink = 0.55 + 0.45 * Math.sin(tm * 9); ctx.globalAlpha = blink * fa; ctx.fillStyle = '#ff5a20'; ctx.fillRect(Math.round(b.x - 1 - cx), Math.round(b.y + 2 - cy), 3, 2); ctx.fillStyle = '#ffd060'; ctx.fillRect(Math.round(b.x - cx), Math.round(b.y + 2 - cy), 1, 1); ctx.globalAlpha = 1; if (t < 8) puffs(ctx, b.x, b.y, tm, cx, cy, 3, 2, '#b3b5ba', 22); }
      if (t > 6.2 && t < 8.2) for (let i = 0; i < 6; i++) { const ph = clamp((t - 6.2 - i * 0.12) / 1.0, 0, 1); if (ph <= 0 || ph >= 1) continue; ctx.fillStyle = i % 2 ? '#ffd060' : '#ff7a30'; ctx.fillRect(Math.round(lerp(b.x, g.x, ph) - cx), Math.round(lerp(b.y, g.y, ph) - Math.sin(ph * Math.PI) * 14 - cy), 1, 1); }
      let n = 0; for (const f of FL) if (t >= f[2]) n++;
      if (n) { ctx.globalAlpha = 0.35 * fa; ctx.fillStyle = '#3a2412'; const rx = 8 + n * 3.4, ry = 5 + n * 1.8; for (let dy = -Math.ceil(ry); dy <= ry; dy++) { const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)))); ctx.fillRect(Math.round(g.x - w - cx), Math.round(g.y + 4 + dy - cy), w * 2, 1); } ctx.globalAlpha = 1; }
      for (const f of FL) { if (t < f[2]) continue; ctx.globalAlpha = fa * Math.min(1, (t - f[2]) / 0.4); ctx.drawImage(S().fire[frame(tm + f[0], 2, 4)], Math.round(g.x - 8 + f[0] - cx), Math.round(g.y - 8 + f[1] - cy)); ctx.globalAlpha = 1; }
      if (n) puffs(ctx, g.x, g.y - 6, tm, cx, cy, 2 + n * 2, 2 + (n > 2 ? 1 : 0), '#8b8d94', 30 + n * 6);
      if (t > 11.2 && t < 14) { const bounce = Math.sin(tm * 6) * 1.5; ctx.drawImage(fx().bang, Math.round(g.x - 4.5 - cx), Math.round(g.y - 36 + bounce - cy)); }
    },
    audio(t, au) { loop(au, 'forest', 0.1); let n = 0; for (const f of FL) if (t >= f[2]) n++; lowFire(au, n ? clamp(0.06 + n * 0.05, 0, 0.3) * (t < 12 ? 1 : clamp((13.6 - t) / 1.6, 0, 1)) : 0); },
    events: [[1.2, au => au.cutPlay('whoosh', { gain: 0.16 })], [4.2, au => au.cutPlay('radio-beep', { gain: 0.18 })], [11.3, au => au.cutPlay('radio-beep', { gain: 0.5 })], [13.6, au => au.cutPlay('chime', { gain: 0.4 })]]
  });

  /* ========== BAB 3 — Dampak Karhutla ========== */
  const haze3 = t => t < 1 ? 0 : t < 8 ? 0.4 * ease((t - 1) / 7) : t < 12.6 ? 0.4 : 0.4 - 0.34 * ease((t - 12.6) / 4.2);
  M.Cutscene.define('ch3', {
    total: 17.6, skipAfter: 2,
    caps: [[0.4, 'Bab 3 selesai — Dampak Karhutla.'], [2.4, 'Asap menurunkan kualitas udara.'], [5.6, 'Warga mudah batuk dan sesak napas.'], [8.8, 'Sekolah bisa libur karena udara tidak sehat.'], [12.0, 'Pasar sepi, ekonomi pun terganggu.'], [15.0, 'Mencegah karhutla melindungi kita semua.'], [16.8, '']],
    cam: camPath([{ t: 0, x: () => me().x, y: () => me().y, z: 1 }, { t: 1.0, x: () => me().x, y: () => me().y, z: 1 }, { t: 2.6, x: at('airboard'), y: aty('airboard', -2), z: 1.45 }, { t: 5.0, x: at('airboard'), y: aty('airboard', -2), z: 1.45 },
      { t: 6.2, x: tile(32, 7.6).x, y: tile(32, 7.6).y, z: 1.35 }, { t: 8.2, x: tile(32, 7.6).x, y: tile(32, 7.6).y, z: 1.35 }, { t: 9.4, x: tile(30.5, 2.8).x, y: tile(30.5, 2.8).y, z: 1.35 }, { t: 11.4, x: tile(30.5, 2.8).x, y: tile(30.5, 2.8).y, z: 1.35 },
      { t: 12.6, x: tile(26.6, 19.6).x, y: tile(26.6, 19.6).y, z: 1.35 }, { t: 14.6, x: tile(26.6, 19.6).x, y: tile(26.6, 19.6).y, z: 1.35 }, { t: 16.2, x: () => me().x, y: () => me().y, z: 1 }, { t: 17.4, x: () => me().x, y: () => me().y, z: 1 }]),
    drawFx(ctx, cx, cy, tm, st, t) {
      const h = haze3(t), ab = poiC('airboard'), hd = poiC('hadi'), sc = poiC('school'), ka = poiC('karto');
      if (h > 0.004) { screenRect(ctx, '#8a8268', h); const s = L.screen(); ctx.fillStyle = '#b6ad90'; for (let i = 0; i < 9; i++) { ctx.globalAlpha = h * 0.55; const x = ((tm * (6 + i * 1.3) + i * 53) % (s.w + 60)) - 30, y = (i * 37 + 12) % s.h; L.disc(ctx, Math.round(x), Math.round(y), 8 + (i % 3) * 3); } ctx.globalAlpha = 1; }
      if (t > 2.6 && t < 8) { const k = ease((t - 2.8) / 2); ctx.fillStyle = '#10151a'; ctx.fillRect(Math.round(ab.x - 11 - cx), Math.round(ab.y - 26 - cy), 22, 6); const col = k < 0.35 ? '#4fcf5a' : k < 0.7 ? '#f0c030' : '#e0402e'; ctx.fillStyle = col; ctx.fillRect(Math.round(ab.x - 10 - cx), Math.round(ab.y - 25 - cy), Math.round(20 * k), 4); txt(ctx, 'AQI', ab.x, ab.y - 29, cx, cy, '#fff', 6);
        if (k > 0.8) ctx.drawImage(fx().bang, Math.round(ab.x + 13 - cx), Math.round(ab.y - 33 + Math.sin(tm * 6) - cy)); }
      if (t > 6.2 && t < 9) { const k = Math.floor(tm * 3) % 2; bubble(ctx, k ? 'Uhuk!' : 'Uhuk uhuk!', hd.x, hd.y - 8 - Math.sin(tm * 8) * 0.8, cx, cy); }
      if (t > 9.6 && t < 12.2) { ctx.drawImage(fx().cross, Math.round(sc.x - 4.5 - cx), Math.round(sc.y - 22 + Math.sin(tm * 5) - cy)); txt(ctx, 'LIBUR', sc.x, sc.y - 28, cx, cy, '#ffd36a', 6); }
      if (t > 12.8 && t < 15.2) { for (let i = 0; i < 3; i++) { const ph = (tm * 0.7 + i / 3) % 1; ctx.globalAlpha = 1 - ph * 0.8; ctx.drawImage(fx().coin, Math.round(ka.x - 12 + i * 12 - cx), Math.round(ka.y - 36 + ph * 26 - cy)); } ctx.globalAlpha = 1; bubble(ctx, 'Sepi...', ka.x, ka.y - 8, cx, cy); }
      if (t > 15 && t < 17) for (const id of ['airboard', 'school', 'karto']) { const c = poiC(id); spark(ctx, c.x + 6, c.y - 14 + Math.sin(tm * 3) * 1.5, tm, cx, cy, c.x); }
    },
    audio(t, au) { au.cutPlay('wind', { loop: true, gain: 0.04 + 0.2 * (haze3(t) / 0.4), fade: 0.6 }); lowFire(au, t > 1.5 && t < 13 ? 0.05 : 0); loop(au, 'forest', t > 15 ? 0.18 : 0); },
    events: [[2.4, au => au.cutPlay('whoosh', { gain: 0.15 })], [5.6, au => au.cutPlay('whoosh', { gain: 0.15 })], [8.8, au => au.cutPlay('whoosh', { gain: 0.15 })], [12.0, au => au.cutPlay('whoosh', { gain: 0.15 })], [15.0, au => au.cutPlay('chime', { gain: 0.42 })]]
  });

  /* ========== BAB 4 — Penjaga Masyarakat ========== */
  const CH4 = ['joko', 'bima', 'rina', 'dina'];
  M.Cutscene.define('ch4', {
    total: 17.8, skipAfter: 2,
    caps: [[0.4, 'Bab 4 selesai — Penjaga Masyarakat.'], [1.8, 'Warga berkumpul di Balai Desa.'], [10.0, 'Pak Lurah mengajak warga menjaga hutan.'], [12.4, 'Jangan bakar sampah. Buat api unggun dengan aman.'], [15.0, 'Pencegahan paling kuat dimulai dari warga.'], [17.0, '']],
    init() {
      const goals = [[31, 12], [32, 13], [30, 13], [31, 14]], taken = [], st = { w: {} }, lc = poiC('lurah'); let i = 0;
      for (const id of CH4) {
        const p = M.World.byId[id], sx = p.tx * T + 8, sy = p.ty * T + 14, g = goals[i++];
        const pts = M.Map.findPath(sx, sy, g[0] * T + 8, g[1] * T + 14, { startAnywhere: true, avoid: (tx, ty) => taken.some(q => Math.abs(q[0] - tx) + Math.abs(q[1] - ty) < 2) }); if (!pts) continue;
        const e = pts[pts.length - 1]; taken.push([Math.floor(e.x / T), Math.floor((e.y - 1) / T)]);
        const t0 = 1.6 + i * 0.3, len = M.Map.pathLen(pts), sp = Math.max(44, len / (9.4 - t0)); st.w[id] = { p, w: walker(pts, sp, t0), face: L.dirOf(lc.x - e.x, lc.y - e.y) };
      }
      return st;
    },
    cam(t, st) {
      if (!st.k) { const lc = poiC('lurah'), mean = () => { let x = 0, y = 0, n = 0; for (const id of CH4) { const q = st.w[id]; if (q) { const r = q.w.at(Math.min(t_, 9.4)); x += r.x; y += r.y; n++; } } return n ? { x: x / n, y: y / n } : lc; };
        let t_ = 0; st.k = tt => { t_ = tt; const m = mean(), u = ease((tt - 5.5) / 3.5), z = lerp(1.05, 1.35, ease((tt - 6) / 4)); let p;
          if (tt < 1.2) p = me(); else if (tt < 2.6) { const a = me(), u2 = ease((tt - 1.2) / 1.4); p = { x: lerp(a.x, m.x, u2), y: lerp(a.y, m.y, u2) }; } else p = { x: lerp(m.x, lc.x - 20, u), y: lerp(m.y, lc.y, u) };
          if (tt > 15.8) { const u3 = ease((tt - 15.8) / 1.8), q = me(); p = { x: lerp(p.x, q.x, u3), y: lerp(p.y, q.y, u3) }; }
          return { x: p.x, y: p.y, z: tt < 1.2 ? 1 : tt > 15.8 ? lerp(z, 1, ease((tt - 15.8) / 1.8)) : z }; }; }
      return st.k(t);
    },
    update(t, dt, st) { for (const id of CH4) { const q = st.w[id]; if (!q) continue; const r = q.w.at(t); q.p._ov = { x: r.x - 8, y: r.y - 14, dir: r.dir != null ? r.dir : q.face, moving: r.moving }; } },
    cleanup(st) { for (const id of CH4) { const p = M.World.byId[id]; if (p) delete p._ov; } },
    drawFx(ctx, cx, cy, tm, st, t) {
      const lc = poiC('lurah'), po = poiC('poster');
      if (t > 10 && t < 15.6) { bubble(ctx, t < 12.4 ? '...' : 'Ayo!', lc.x, lc.y - 8, cx, cy); }
      if (t > 10.4 && t < 15.6) for (let i = 0; i < 3; i++) spark(ctx, po.x + (i - 1) * 8, po.y - 14 - (i % 2) * 5 + Math.sin(tm * 3 + i), tm, cx, cy, i);
      CH4.forEach((id, i) => { const q = st.w[id]; if (!q) return; const r = q.w.at(t), t1 = 12.6 + i * 0.7; if (r.done && t > t1 && t < 15.8) ctx.drawImage(fx().check, Math.round(r.x - 4.5 - cx), Math.round(r.y - 32 - Math.min(1, (t - t1) * 3) * 2 - cy));
        if (r.done && t > 15.0 && t < 17) ctx.drawImage(fx().heart, Math.round(r.x - 4.5 + (i % 2 ? 6 : -6) - cx), Math.round(r.y - 38 - Math.sin(tm * 3 + i) * 2 - cy)); });
    },
    audio(t, au) { loop(au, 'forest', 0.2); },
    events: [[1.6, au => au.cutPlay('whoosh', { gain: 0.15 })], [12.6, au => au.cutPlay('sprout', { gain: 0.3 })], [13.3, au => au.cutPlay('sprout', { gain: 0.3 })], [14.0, au => au.cutPlay('sprout', { gain: 0.3 })], [14.7, au => au.cutPlay('sprout', { gain: 0.3 })], [15.2, au => au.cutPlay('chime', { gain: 0.42 })]]
  });

  /* ========== BAB 5 — Pelaporan Aman ========== */
  M.Cutscene.define('ch5', {
    total: 18.4, skipAfter: 2,
    caps: [[0.4, 'Bab 5 selesai — Pelaporan Aman.'], [2.0, 'Lihat asap? Jauhi dan amati dari jarak aman.'], [6.0, 'Tentukan lokasi dengan jelas.'], [9.4, 'Laporkan lewat radio atau 112.'], [13.2, 'Laporan diterima. Petugas segera bergerak!'], [17.0, '']],
    init() {
      const o = M.World.byId.officer, sm = poiC('smoke'), sx = o.tx * T + 8, sy = o.ty * T + 14;
      const pts = M.Map.findPath(sx, sy, sm.x + 12, sm.y + 150, { startAnywhere: true }); return { o, w: pts ? walker(pts, 54, 14.0) : null, ox: sx, oy: sy };
    },
    cam(t, st) {
      if (!st.k) { const of = () => (st.w ? st.w.at(Math.max(t_, 0)) : { x: st.ox, y: st.oy }); let t_ = 0;
        const k = camPath([{ t: 0, x: () => me().x, y: () => me().y, z: 1 }, { t: 1.2, x: () => me().x, y: () => me().y, z: 1 }, { t: 3.2, x: at('smoke'), y: aty('smoke', 22), z: 1.15 }, { t: 5.6, x: at('smoke'), y: aty('smoke', 22), z: 1.15 },
          { t: 7.0, x: at('landmark'), y: aty('landmark'), z: 1.5 }, { t: 9.0, x: at('landmark'), y: aty('landmark'), z: 1.5 }, { t: 10.4, x: at('phone'), y: aty('phone'), z: 1.5 }, { t: 12.2, x: at('phone'), y: aty('phone'), z: 1.5 },
          { t: 13.6, x: () => (poiC('phone').x + st.ox) / 2, y: () => (poiC('phone').y + st.oy) / 2, z: 1.4 }, { t: 14.4, x: () => of().x, y: () => of().y - 8, z: 1.3 }, { t: 17.0, x: () => of().x, y: () => of().y - 8, z: 1.3 },
          { t: 18.2, x: () => me().x, y: () => me().y, z: 1 }]); st.k = tt => { t_ = tt; return k(tt); }; }
      return st.k(t);
    },
    update(t, dt, st) { if (!st.w) return; const r = st.w.at(t); if (t >= 14.0) st.o._ov = { x: r.x - 8, y: r.y - 14, dir: r.dir != null ? r.dir : D.UP, moving: r.moving }; },
    cleanup(st) { delete st.o._ov; },
    drawFx(ctx, cx, cy, tm, st, t) {
      const sm = poiC('smoke'), lm = poiC('landmark'), ph = poiC('phone'), of = M.World.center(st.o), R = M.World.ringOf(M.World.byId.smoke);
      if (t > 3.2 && t < 6.4) { const a = clamp(Math.min((t - 3.2) / 0.6, (6.4 - t) / 0.5), 0, 1); ctx.globalAlpha = a; ctx.fillStyle = '#7be08f'; for (let i = 0; i < 90; i++) { if ((i + Math.floor(tm * 6)) % 3 === 0) continue; const an = i / 90 * Math.PI * 2; ctx.fillRect(Math.round(sm.x + Math.cos(an) * R.mid * 1.3 - cx), Math.round(sm.y + Math.sin(an) * R.mid * 1.3 - cy), 1, 1); }
        txt(ctx, 'JARAK AMAN', sm.x, sm.y + R.mid * 1.3 + 9, cx, cy, '#7be08f', 6); ctx.globalAlpha = 1; }
      if (t > 7.0 && t < 10) { const k = clamp((t - 7.1) / 0.7, 0, 1), y = lerp(-46, -12, k * k) + (k >= 1 ? -Math.abs(Math.sin((t - 7.8) * 7)) * 4 * Math.max(0, 1 - (t - 7.8) / 0.8) : 0); ctx.drawImage(fx().pin, Math.round(lm.x - 4.5 - cx), Math.round(lm.y + y - 6 - cy)); if (t > 7.9) txt(ctx, 'LOKASI', lm.x, lm.y + 22, cx, cy, '#ffd36a', 6); }
      if (t > 10.4 && t < 13.4) { for (let r = 0; r < 3; r++) { const p = (t * 0.9 + r / 3) % 1, rad = 4 + p * 22; ctx.globalAlpha = (1 - p); ctx.fillStyle = '#ffd36a'; for (let i = 0; i < 22; i++) { const an = -Math.PI * 0.9 + i / 21 * Math.PI * 0.8; ctx.fillRect(Math.round(ph.x + Math.cos(an) * rad - cx), Math.round(ph.y - 10 + Math.sin(an) * rad - cy), 1, 1); } } ctx.globalAlpha = 1;
        if (t > 11 && t < 13) bubble(ctx, '112', ph.x, ph.y - 18, cx, cy); }
      if (t > 11.8 && t < 13.6) { const k = ease((t - 11.8) / 1.8), x = lerp(ph.x, of.x, k), y = lerp(ph.y, of.y, k) - Math.sin(k * Math.PI) * 18; for (let i = 1; i < 5; i++) { const kk = Math.max(0, k - i * 0.05); ctx.globalAlpha = 0.6 - i * 0.12; spark(ctx, lerp(ph.x, of.x, kk), lerp(ph.y, of.y, kk) - Math.sin(kk * Math.PI) * 18, tm, cx, cy, i); } ctx.globalAlpha = 1; ctx.drawImage(fx().mail, Math.round(x - 5.5 - cx), Math.round(y - 4 - cy)); }
      if (t > 13.5 && t < 14.8) ctx.drawImage(fx().bang, Math.round(of.x - 4.5 - cx), Math.round(of.y - 26 + Math.sin(tm * 8) - cy));
    },
    audio(t, au) { loop(au, 'forest', 0.1); loop(au, 'siren', t > 14 && t < 18 ? 0.07 : 0); },
    events: [[1.2, au => au.cutPlay('whoosh', { gain: 0.15 })], [6.4, au => au.cutPlay('whoosh', { gain: 0.15 })], [7.8, au => au.cutPlay('drip', { gain: 0.55 })], [9.8, au => au.cutPlay('whoosh', { gain: 0.15 })],
      [10.6, au => au.cutPlay('radio-beep', { gain: 0.5 })], [13.5, au => au.cutPlay('chime', { gain: 0.4 })]]
  });

  /* ========== BAB 6 — Pemulihan Lahan, lalu asap di utara ========== */
  M.Cutscene.define('ch6', {
    total: 19.4, skipAfter: 2,
    caps: [[0.4, 'Bab 6 selesai — Misi Penyelamatan Lingkungan.'], [2.2, 'Kanal disekat agar gambut tetap basah.'], [6.4, 'Bibit ditanam untuk memulihkan lahan.'], [11.0, 'Lingkungan pulih berkat kerja sama warga.'], [14.2, 'Namun di utara, asap tebal mulai muncul…'], [17.4, 'Saatnya Misi Terakhir!'], [18.8, '']],
    init() {
      const sb = M.World.byId.seedbed, cand = []; for (let dy = -3; dy <= 3; dy++) for (let dx = -4; dx <= 4; dx++) { const tx = sb.tx + dx, ty = sb.ty + dy; if ((dx || dy) && !M.Map.isSolid(tx, ty) && M.Map.reachable(tx, ty) && ty > 1) cand.push({ tx, ty, d: Math.hypot(dx * 1.2, dy) + hash(tx * 31 + ty) * 0.6 }); }
      cand.sort((a, b) => a.d - b.d); const pick = cand.slice(0, 7).sort((a, b) => a.ty - b.ty || a.tx - b.tx); pick.forEach((q, i) => { q.t0 = 6.9 + i * 0.55; q.fired = false; }); return { seeds: pick };
    },
    cam: camPath([{ t: 0, x: () => me().x, y: () => me().y, z: 1 }, { t: 1.2, x: () => me().x, y: () => me().y, z: 1 }, { t: 3.0, x: at('canal'), y: aty('canal', 4), z: 1.45 }, { t: 6.0, x: at('canal'), y: aty('canal', 4), z: 1.45 },
      { t: 7.4, x: at('seedbed'), y: aty('seedbed', -6), z: 1.4 }, { t: 11.2, x: at('seedbed'), y: aty('seedbed', -6), z: 1.4 }, { t: 12.4, x: () => me().x, y: () => me().y, z: 1.1 }, { t: 13.4, x: () => me().x, y: () => me().y, z: 1.1 },
      { t: 15.4, x: () => poiC('bigfire').x, y: () => poiC('bigfire').y + 70, z: 1.0 }, { t: 18.6, x: () => poiC('bigfire').x, y: () => poiC('bigfire').y + 62, z: 1.1 }, { t: 19.3, x: () => poiC('bigfire').x, y: () => poiC('bigfire').y + 62, z: 1.1 }]),
    update(t, dt, st) { for (const q of st.seeds) if (!q.fired && t >= q.t0) { q.fired = true; M.Audio.cutPlay('sprout', { gain: 0.38 }); } },
    entities(list, st, t) { for (const q of st.seeds) list.push({ y: (q.ty + 1) * T - 1, draw: (ctx, cx, cy) => {
      const age = t - q.t0; if (age < 0) return; const stg = age < 1.1 ? 0 : age < 2.2 ? 1 : 2; ctx.drawImage(fx().sprout[stg], q.tx * T - cx, q.ty * T - cy); } }); },
    drawFx(ctx, cx, cy, tm, st, t) {
      const ca = poiC('canal');
      if (t > 2.4 && t < 12.5) { const k = ease((t - 2.8) / 3.2); const rx = 3 + 17 * k, ry = 2 + 5 * k, X = Math.round(ca.x - cx), Y = Math.round(ca.y + 12 - cy); ctx.fillStyle = '#2f7fd0'; for (let dy = -Math.ceil(ry); dy <= ry; dy++) { const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)))); ctx.fillRect(X - w, Y + dy, w * 2, 1); }
        ctx.fillStyle = '#bfe4ff'; for (let i = 0; i < 6; i++) if (Math.floor(tm * 3 + i) % 3 === 0) ctx.fillRect(X + Math.round((hash(i) - 0.5) * rx * 1.6), Y + Math.round((hash(i + 5) - 0.5) * ry), 2, 1);
        if (t < 6.2) for (let i = 0; i < 3; i++) { const ph = (t * 1.1 + i / 3) % 1; ctx.drawImage(fx().drop, Math.round(ca.x - 2 + (i - 1) * 9 - cx), Math.round(ca.y - 10 + ph * 20 - cy)); } }
      for (const q of st.seeds) { const age = t - q.t0; if (age > 2.1 && age < 3.6) spark(ctx, q.tx * T + 8, q.ty * T - 2 - (age - 2.1) * 3, tm, cx, cy, q.tx); }
      if (t > 11 && t < 13) sparks0(ctx, 'seedbed', tm, cx, cy, t);
      if (t > 14.2) { const k = clamp((t - 14.2) / 1.2, 0, 1) * (t > 19 ? clamp((19.4 - t) / 0.4, 0, 1) : 1), p = 0.5 + 0.5 * Math.sin(tm * 3); screenRect(ctx, '#6a1608', k * (0.12 + 0.08 * p)); if (t > 15.4) { const bf = poiC('bigfire'); ctx.drawImage(fx().bang, Math.round(bf.x - 4.5 - cx), Math.round(bf.y - 58 + Math.sin(tm * 5) * 1.5 - cy)); } }
    },
    audio(t, au) { loop(au, 'forest', t < 13.4 ? 0.18 : 0); loop(au, 'water', t > 2.8 && t < 6.4 ? 0.05 : 0); loop(au, 'wind', t > 13.8 ? 0.16 : 0); loop(au, 'siren', t > 14.4 ? 0.09 : 0); },
    events: [[1.2, au => au.cutPlay('whoosh', { gain: 0.16 })], [3.2, au => au.cutPlay('drip', { gain: 0.5 })], [4.0, au => au.cutPlay('drip', { gain: 0.45 })], [4.8, au => au.cutPlay('drip', { gain: 0.5 })], [7.0, au => au.cutPlay('whoosh', { gain: 0.15 })],
      [11.0, au => au.cutPlay('chime', { gain: 0.42 })], [13.6, au => au.cutPlay('whoosh', { gain: 0.2 })], [14.4, au => au.cutPlay('radio-beep', { gain: 0.3 })]]
  });
  function sparks0(ctx, id, tm, cx, cy, t) { const c = poiC(id); for (let i = 0; i < 3; i++) spark(ctx, c.x + (i - 1) * 12, c.y - 20 - (i % 2) * 6 + Math.sin(tm * 3 + i), tm, cx, cy, i); }

  /* ========== Pemicu, penyimpanan, dan putar ulang ========== */
  const KEY = 'mph.chcut'; let seen = new Set(), pending = null, replayReq = null;
  function load() { try { const o = JSON.parse(M.Store.get(KEY) || 'null'); seen = new Set(o && Array.isArray(o.ids) ? o.ids.filter(n => n >= 1 && n <= 6) : []); } catch (e) { seen = new Set(); } }
  function save() { try { M.Store.set(KEY, JSON.stringify({ v: 1, ids: Array.from(seen) })); } catch (e) { /* abaikan */ } }
  function poll() {
    if (!M.Game.running || M.Cutscene.active || M.Game.frozen || M.Dialog.isOpen() || !M.Dialog.canOpen()) return;
    if (replayReq) { const ch = replayReq; replayReq = null; M.Cutscene.play('ch' + ch, { replay: true }); return; }
    if (pending) { const ch = pending; pending = null; seen.add(ch); save(); M.Cutscene.play('ch' + ch, {}); }
  }
  function init() {
    load();
    M.Missions.onChange(ev => {
      if (!ev) return; if (ev.type === 'reset') { seen.clear(); pending = null; replayReq = null; save(); return; }
      if (ev.chapterDone && M.C.CH_CUT !== false) { const ch = M.Missions.def(ev.mid).ch; if (!seen.has(ch) && M.Cutscene.has('ch' + ch)) { pending = ch; M.Audio.cutPreload(); } }
    });
    const o = M.Cutscene.update; M.Cutscene.update = dt => { o(dt); poll(); };
  }
  M.Chapters = { init, replay: ch => { if (M.Cutscene.has('ch' + ch) && M.Missions.chapterProgress(ch).complete) { replayReq = ch; return true; } return false; }, seen: () => Array.from(seen), pending: () => pending, clearPending: () => { pending = null; } };
})(window.MPH);
