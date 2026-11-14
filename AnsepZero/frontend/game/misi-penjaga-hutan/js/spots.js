/* Tanda "tempat ideal untuk interaksi" v0.5⁴.
   Untuk setiap tujuan misi aktif (M.Missions.targets(): NPC/objek/area bahaya) digambar penanda di TANAH berupa cincin emas berdenyut + panah kecil yang menunjuk ke tujuan.
   Berdiri di penanda = pasti dalam jangkauan: tombol INTERAKSI/[E] aktif untuk tujuan yang benar. Penanda berubah hijau (✔) saat pemain sudah di tempat.
   Posisi dihitung sekali per titik (lalu disimpan) dan DIJAMIN: bebas tabrakan, bisa dicapai dari titik awal, dan Interact.scan() memilih titik yang benar.
   - NPC/objek: tepat di depan (sisi bawah/selatan, lalu sisi lain), jarak ±18-22 px dari pusat.
   - Area bahaya (tugas "amati"): di cincin hijau (jarak amati aman), condong ke sisi kiri/kanan agar area bahaya tetap terlihat di layar. */
(function (M) {
  const T = M.C.TILE, W = () => M.World, cache = {};
  const feetOK = (x, y) => { const tx = Math.floor(x / T), ty = Math.floor((y - 1) / T); return !M.Map.footBlocked(x, y) && M.Map.reachable(tx, ty) && x > 20 && y > 24 && x < M.Map.pxW - 20 && y < M.Map.pxH - 14; };
  /* titik interaksi yang dipakai Interact.scan(): (x, y-3) dalam jangkauan s<=1; di sini dipilih target terdekat berdasarkan s */
  function bestAt(x, y) {
    let best = null, bs = 9;
    for (const p of W().pois) { if (W().isHazard(p)) continue; const c = W().center(p), s = Math.hypot(x - c.x, y - 3 - c.y) / p.r; if (s <= 1 && s < bs) { bs = s; best = p; } }
    return best;
  }
  function compute(p) {
    const c = W().center(p);
    if (!W().isHazard(p)) {
      const cands = [];
      for (const d of [20, 18, 22, 16, 24]) for (let k = 0; k < 16; k++) {
        const a = Math.PI / 2 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 8;   // mulai dari selatan, melebar ke samping lalu ke utara
        cands.push({ x: Math.round(c.x + Math.cos(a) * d), y: Math.round(c.y + Math.sin(a) * d + 3), pen: Math.abs(Math.cos(a - Math.PI / 2) - 1) * 6 + (d - 20) * (d > 20 ? 0.4 : 0.3) });
      }
      cands.sort((a, b) => a.pen - b.pen);
      for (const q of cands) if (feetOK(q.x, q.y) && bestAt(q.x, q.y) === p && Math.hypot(q.x - c.x, q.y - 3 - c.y) / p.r <= 0.85) return { x: q.x, y: q.y, kind: 'near' };
      return null;
    }
    const R = W().ringOf(p), wall = p.id === 'bigfire' ? 94 : 0, cands = [];
    for (const rad of [R.mid, R.mid + 6, R.mid - 6, R.mid + 12, R.mid - 10, R.mid + 18, R.mid - 14, R.mid + 24, R.mid - 18]) for (let k = 0; k < 48; k++) {
      if (rad < R.min + 6 || rad > R.max - 6) continue;
      const a = k * Math.PI / 24, x = Math.round(c.x + Math.cos(a) * rad), y = Math.round(c.y + Math.sin(a) * rad + 3);
      cands.push({ x, y, rad, pen: Math.abs(Math.sin(a)) * 10 + Math.abs(rad - R.mid) * 0.2 + (a > Math.PI / 2 && a < Math.PI * 1.5 ? 0.1 : 0) });
    }
    cands.sort((a, b) => a.pen - b.pen);
    const others = W().pois.filter(h => h !== p && W().isHazard(h)), V = M.View;
    /* hazard harus tampil di dalam "safeView" (di luar panel HUD) dengan kamera pengikut berdiri di titik itu; pakai kandidat terbaik yang terlihat, kalau tak ada pakai yang terbaik saja */
    const visible = q => {
      const m = M.Map, camx = V.w >= m.pxW ? (m.pxW - V.w) / 2 : Math.max(0, Math.min(m.pxW - V.w, q.x - V.w / 2)), camy = V.h >= m.pxH ? (m.pxH - V.h) / 2 : Math.max(0, Math.min(m.pxH - V.h, q.y - 8 - V.h / 2));
      const sv = M.Game.safeView(), sx = c.x - camx, sy = c.y - camy; return sx > sv.l && sx < sv.r && sy > sv.t && sy < sv.b;
    };
    let fallback = null;
    for (const q of cands) {
      const tc = { x: Math.floor(q.x / T) * T + 8, y: Math.floor((q.y - 1) / T) * T + 8 }, d = Math.hypot(q.x - c.x, q.y - 3 - c.y);
      if (!(feetOK(q.x, q.y) && d >= R.min + 6 && d <= R.max - 6 && Math.hypot(tc.x - c.x, tc.y - c.y) >= Math.max(R.min + 2, wall) && !bestAt(q.x, q.y))) continue;
      const clash = others.some(h => { const hc = W().center(h), hr = W().ringOf(h), dh = Math.hypot(q.x - hc.x, q.y - 3 - hc.y); return dh < hr.min + 6 || (dh <= hr.max && dh <= d + 2); });   // jangan di zona bahaya hazard lain / jangan lebih dekat ke hazard lain
      if (clash) continue;
      if (visible(q)) return { x: q.x, y: q.y, kind: 'ring' };
      if (!fallback) fallback = { x: q.x, y: q.y, kind: 'ring' };
    }
    return fallback;
  }
  const spotOf = p => { if (!(p.id in cache)) cache[p.id] = compute(p); return cache[p.id]; };
  const reset = () => { for (const k of Object.keys(cache)) delete cache[k]; };

  function draw(ctx, cx, cy, time) {
    if (M.C.SPOT_MARKERS === false || !M.Missions || (M.Cutscene && M.Cutscene.active)) return;
    const ids = M.Missions.targets(), pl = M.Player.state, VW = M.View.w, VH = M.View.h;
    for (const id of ids) {
      const p = W().byId[id]; if (!p || W().pois.indexOf(p) < 0) continue; const sp = spotOf(p); if (!sp) continue;
      const sx = sp.x - cx, sy = sp.y - cy; if (sx < -16 || sy < -16 || sx > VW + 16 || sy > VH + 16) continue;
      const on = Math.hypot(pl.x - sp.x, pl.y - sp.y) < 7, pulse = (Math.sin(time * 4) + 1) / 2, c = W().center(p);
      const col = on ? '#7be08f' : '#ffd36a', dark = on ? '#1f7a3a' : '#8a5a10', X = Math.round(sx), Y = Math.round(sy - 2);   // pusat penanda sedikit di atas kaki (di tanah di bawah badan)
      ctx.save();
      ctx.globalAlpha = on ? 0.30 : 0.22 + 0.10 * pulse; ctx.fillStyle = col; for (let dy = -5; dy <= 5; dy++) { const w = Math.floor(Math.sqrt(30 - dy * dy)); ctx.fillRect(X - w, Y + Math.round(dy * 0.6), w * 2 + 1, 1); }   // cakram (elips pipih)
      ctx.globalAlpha = 0.95; const rx = 8 + (on ? 0 : Math.round(pulse * 2)), ry = Math.round(rx * 0.6), n = 28;
      for (let i = 0; i < n; i++) { if (!on && (i + Math.floor(time * 6)) % 4 === 0) continue; const a = i / n * Math.PI * 2; ctx.fillStyle = i % 2 ? col : dark; ctx.fillRect(X + Math.round(Math.cos(a) * rx), Y + Math.round(Math.sin(a) * ry), 1, 1); }
      if (on) { ctx.fillStyle = '#fff'; ctx.fillRect(X - 3, Y, 1, 1); ctx.fillRect(X - 2, Y + 1, 1, 1); ctx.fillRect(X - 1, Y + 2, 1, 1); ctx.fillRect(X, Y + 1, 1, 1); ctx.fillRect(X + 1, Y, 1, 1); ctx.fillRect(X + 2, Y - 1, 1, 1); ctx.fillRect(X + 3, Y - 2, 1, 1); }
      else {                                                                    // panah kecil di tanah menunjuk ke tujuan
        const a = Math.atan2(c.y - sp.y, c.x - sp.x), r0 = 11 + Math.round(pulse * 2), ax = X + Math.round(Math.cos(a) * r0), ay = Y + Math.round(Math.sin(a) * r0 * 0.7);
        ctx.translate(ax, ay); ctx.rotate(a); ctx.fillStyle = dark; ctx.fillRect(-3, -3, 1, 7); ctx.fillStyle = col; ctx.fillRect(-2, -2, 1, 5); ctx.fillRect(-1, -1, 1, 3); ctx.fillRect(0, 0, 1, 1);
      }
      ctx.restore();
    }
  }
  M.Spots = { spotOf, reset, draw, bestAt };
})(window.MPH);
