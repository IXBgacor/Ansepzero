/* v2.0 — Minimap bundar (mengikuti pemain) + Peta Desa penuh. Peta dasar digambar SEKALI ke kanvas luar-layar;
   minimap hanya menyalin potongan (diperbarui ≤ ~8x/detik dan hanya jika ada perubahan). Peta besar tidak memproses ulang dunia saat dibuka. */
(function (M) {
  'use strict';
  const T = 16, SC = 8, $ = id => document.getElementById(id), N = 96, WIN = 30;
  const COL = { 0: '#4a9a3a', 1: '#a9743a', 2: '#3a86d0', 3: '#7a5230', 4: '#b9b2a0', 5: '#8ab04a', 6: '#cfe8b0', 7: '#4a3224', 8: '#7a5a3a' };
  const BC = { pemadam: '#d8352a', puskesmas: '#f6f6f0', pasar_hall: '#4a8a4a', lapak: '#e8a040', warung: '#e8a040', stilt: '#b98a58', medtent: '#f6f6f0', ambulance: '#ffffff' };
  const C = { act: '#ffd36a', done: '#7be08f', fire: '#ff5a3a', me: '#ffffff', place: '#f6efd8' };
  let wmZ = 1, base = null, baseKey = '', W = 0, H = 0, mm, mctx, wcv, wctx, open = false, lastT = 0, lastKey = '', bound = false, picked = null;

  function buildBase() {
    const k = M.Map.pxW + ':' + M.Map.objects.length; if (base && k === baseKey) return; baseKey = k;
    W = M.Map.pxW / T; H = M.Map.pxH / T; base = M.util.cv(W * SC, H * SC); const g = base.getContext('2d');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { g.fillStyle = COL[M.Map.tileAt(x * T + 8, y * T + 8)] || COL[0]; g.fillRect(x * SC, y * SC, SC, SC); }
    for (const o of M.Map.objects) {
      if (o.type === 'tree') { g.fillStyle = '#1f6a2a'; g.fillRect(o.tx * SC + 1, o.ty * SC + 1, SC - 2, SC - 2); }
      else if ((o.w || 1) * (o.h || 1) > 1) { g.fillStyle = BC[o.type] || /^sch_(main|pos)|hall/.test(o.type) ? '#b84a3a' : /^sch_/.test(o.type) ? '#3f6fb0' : '#a8643c'; g.fillRect(o.tx * SC, o.ty * SC, (o.w || 1) * SC, (o.h || 1) * SC); g.fillStyle = '#00000044'; g.fillRect(o.tx * SC, (o.ty + (o.h || 1)) * SC - 2, (o.w || 1) * SC, 2); }
    }
  }
  const DIRS = ['Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut', 'Utara', 'Timur Laut'];
  const compass = (dx, dy) => DIRS[((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8];

  /* Semua penanda dihitung dari koordinat DUNIA (px) -> petak (px/16): satu sumber untuk minimap & peta besar. */
  function markers() {
    const out = [], act = new Set(), Ms = M.Missions;
    for (const id of Ms.targets()) {
      const p = M.World.byId[id]; if (!p) continue; act.add(id); const c = M.World.center(p), st = Ms.stepsAt(id);
      out.push({ kind: 'act', id, name: p.name, x: c.x / T, y: c.y / T, step: st.length ? st[0].s.label : '', mission: st.length ? st[0].m.title : '' });
    }
    if (M.VMission) for (const t of M.VMission.targets()) out.push({ kind: 'act', id: t.id, name: t.name, x: t.x, y: t.y, step: t.step, mission: t.mission });
    for (const h of M.World.hazards()) { const c = M.World.center(h); out.push({ kind: 'fire', id: h.id, name: h.name || 'Area bahaya', x: c.x / T, y: c.y / T, target: act.has(h.id) }); }
    for (const d of Ms.defs) if (Ms.complete(d.id)) for (const s of d.steps) { if (act.has(s.poi) || out.some(m => m.id === s.poi)) continue; const p = M.World.byId[s.poi]; if (!p) continue; const c = M.World.center(p); out.push({ kind: 'done', id: s.poi, name: p.name, x: c.x / T, y: c.y / T, mission: d.title }); }
    if (M.Vehicles) for (const v of M.Vehicles.list()) out.push({ kind: 'veh', id: v.id, name: v.name, x: v.x / T, y: v.y / T });
    for (const p of M.Places.list) out.push({ kind: 'place', id: p.id, name: p.name, x: p.tx + .5, y: p.ty + .5 });
    return out;
  }
  function tri(g, x, y, r, dir, col) {
    const a = dir === 3 ? 0 : dir === 0 ? Math.PI / 2 : dir === 2 ? Math.PI : -Math.PI / 2;
    g.fillStyle = '#06140d'; g.beginPath(); g.moveTo(x + Math.cos(a) * (r + 2), y + Math.sin(a) * (r + 2)); g.lineTo(x + Math.cos(a + 2.5) * (r + 2), y + Math.sin(a + 2.5) * (r + 2)); g.lineTo(x + Math.cos(a - 2.5) * (r + 2), y + Math.sin(a - 2.5) * (r + 2)); g.fill();
    g.fillStyle = col; g.beginPath(); g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.lineTo(x + Math.cos(a + 2.5) * r, y + Math.sin(a + 2.5) * r); g.lineTo(x + Math.cos(a - 2.5) * r, y + Math.sin(a - 2.5) * r); g.fill();
  }
  function dot(g, x, y, r, col) { g.fillStyle = '#06140d'; g.fillRect(x - r - 1, y - r - 1, 2 * r + 2, 2 * r + 2); g.fillStyle = col; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function drawMini(ms) {
    const g = mctx, pl = M.Player.state, px = pl.x / T, py = pl.y / T, k = N / WIN;
    const sx = clamp(px - WIN / 2, 0, W - WIN), sy = clamp(py - WIN / 2, 0, H - WIN);
    g.imageSmoothingEnabled = true; g.fillStyle = '#0b2a1f'; g.fillRect(0, 0, N, N); g.drawImage(base, sx * SC, sy * SC, WIN * SC, WIN * SC, 0, 0, N, N);
    for (const m of ms) {
      if (m.kind === 'place' || m.kind === 'done') continue;
      let x = (m.x - sx) * k, y = (m.y - sy) * k; const col = m.kind === 'fire' ? C.fire : C.act;
      if (m.kind === 'fire' && !m.target) { if (x < 0 || y < 0 || x > N || y > N) continue; }
      if (x < 4 || y < 4 || x > N - 4 || y > N - 4) {                      // target di luar jendela: penanda di tepi, searah target
        const a = Math.atan2(y - N / 2, x - N / 2); x = N / 2 + Math.cos(a) * (N / 2 - 8); y = N / 2 + Math.sin(a) * (N / 2 - 8); tri(g, x, y, 4, a > -0.78 && a <= 0.78 ? 3 : a > 0.78 && a <= 2.36 ? 0 : a > -2.36 && a <= -0.78 ? 1 : 2, col);
      } else dot(g, Math.round(x), Math.round(y), m.kind === 'act' ? 3 : 2, col);
    }
    tri(g, (px - sx) * k, (py - sy) * k, 4, pl.dir, C.me);
  }
  function drawBig(ms) {
    const g = wctx, pl = M.Player.state; g.imageSmoothingEnabled = false; g.drawImage(base, 0, 0);
    const lbl = (t, x, y) => { g.font = 'bold 11px monospace'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = '#06140d'; g.strokeText(t, x, y); g.fillStyle = C.place; g.fillText(t, x, y); };
    for (const m of ms) {                                              // urutan gambar: selesai -> fasilitas -> api -> misi aktif
      if (m.kind !== 'done') continue; dot(g, Math.round(m.x * SC), Math.round(m.y * SC), 2, C.done);
    }
    for (const m of ms) if (m.kind === 'place') { const x = Math.round(m.x * SC), y = Math.round(m.y * SC); dot(g, x, y, 3, C.place); lbl(m.name, x, y - 7); }
    for (const m of ms) if (m.kind === 'veh') { const x = Math.round(m.x * SC), y = Math.round(m.y * SC); dot(g, x, y, 3, '#8fd0f0'); }
    for (const m of ms) if (m.kind === 'fire') { const x = Math.round(m.x * SC), y = Math.round(m.y * SC); dot(g, x, y, 4, C.fire); }
    for (const m of ms) if (m.kind === 'act') { const x = Math.round(m.x * SC), y = Math.round(m.y * SC); g.strokeStyle = '#06140d'; g.lineWidth = 4; g.strokeRect(x - 8, y - 8, 16, 16); g.strokeStyle = C.act; g.lineWidth = 2; g.strokeRect(x - 8, y - 8, 16, 16); dot(g, x, y, 4, C.act); }
    tri(g, pl.x / T * SC, pl.y / T * SC, 7, pl.dir, C.me);
  }
  function info(m) {
    const el = $('wm-info'), pl = M.Player.state, a = M.Missions.active();
    let t;
    if (!m) { const st = M.Missions.availableSteps(); t = a ? 'Misi aktif: ' + a.title + (st.length ? ' · Tujuan: ' + st.map(x => x.s.label).join('; ') : '') : 'Semua misi selesai.'; }
    else {
      const dx = m.x - pl.x / T, dy = m.y - pl.y / T, d = Math.round(Math.hypot(dx, dy)), far = d <= 1 ? 'Anda di sini.' : 'Jarak ≈ ' + d + ' petak ke ' + compass(dx, dy) + '.';
      const status = m.kind === 'act' ? 'Aktif' : m.kind === 'done' ? 'Selesai' : m.kind === 'fire' ? (m.target ? 'Area api · target misi' : 'Area api') : m.kind === 'veh' ? 'Kendaraan · bisa dikendarai' : 'Fasilitas';
      t = m.name + ' — ' + status + (m.mission ? ' · ' + m.mission : '') + (m.step ? ' · Tujuan: ' + m.step : '') + ' · ' + far;
    }
    el.textContent = t;
  }
  /* zoom peta besar: lebar kanvas diskalakan, area geser (scroll) berpusat pada pemain */
  const WZ = [1, 1.6, 2.4, 3.2];
  function setWm(i, center) {
    i = Math.max(0, Math.min(WZ.length - 1, i)); wmZ = i; wcv.style.width = (WZ[i] * 100) + '%'; wcv.style.maxHeight = i ? 'none' : ''; $('wm-zin').disabled = i === WZ.length - 1; $('wm-zout').disabled = i === 0;
    const st = wcv.parentNode; if (center !== false) { const P = M.Player.state; st.scrollLeft = P.x / T / W * wcv.clientWidth - st.clientWidth / 2; st.scrollTop = P.y / T / H * wcv.clientHeight - st.clientHeight / 2; }
  }
  function openMap() {
    if (open || !M.Game.running || M.Game.frozen || M.Dialog.isOpen() || (M.Cutscene && M.Cutscene.active) || M.UI.panelOpen() || M.UI.evalOpen()) return;
    buildBase(); open = true; M.Audio.sfx('open'); M.Game.freeze(true); $('worldmap').hidden = false;
    wcv.width = W * SC; wcv.height = H * SC; picked = null; drawBig(markers()); info(null); setWm(0, false); try { $('wm-close').focus({ preventScroll: true }); } catch (e) { /* abaikan */ }
  }
  function closeMap(silent) {
    if (!open) return false; open = false; $('worldmap').hidden = true; if (silent !== true) M.Audio.sfx('close'); M.Game.freeze(false); return true;
  }
  function pick(e) {
    const r = wcv.getBoundingClientRect(), tx = (e.clientX - r.left) / r.width * W, ty = (e.clientY - r.top) / r.height * H, ms = markers();
    let best = null, bd = 3.2; const order = { act: 0, fire: 1, veh: 2, place: 2, done: 3 };
    for (const m of ms) { const d = Math.hypot(m.x - tx, m.y - ty) + order[m.kind] * 0.05; if (d < bd) { bd = d; best = m; } }
    picked = best; info(best);
  }
  function tick() {
    if (!bound || !M.Game.running || open) return; const t = performance.now(); if (t - lastT < 120) return; lastT = t;
    const pl = M.Player.state, key = Math.round(pl.x / 4) + ',' + Math.round(pl.y / 4) + ',' + pl.dir + '|' + M.Missions.targets().join(',') + '|' + M.World.hazards().length + '|' + M.Missions.completedCount() + '|' + (M.VMission ? M.VMission.key() : '');
    if (key === lastKey) return; lastKey = key; buildBase(); drawMini(markers());
  }
  function init() {
    if (bound) return; bound = true; mm = $('mm-cv'); mctx = mm.getContext('2d'); wcv = $('wm-cv'); wctx = wcv.getContext('2d');
    $('minimap').addEventListener('click', () => openMap());
    $('wm-close').addEventListener('click', () => closeMap());
    $('worldmap').addEventListener('click', e => { if (e.target.id === 'worldmap') closeMap(); });
    wcv.addEventListener('click', pick); $('wm-zin').addEventListener('click', () => setWm(wmZ + 1)); $('wm-zout').addEventListener('click', () => setWm(wmZ - 1));
    const old = M.UI.closeTopModal, oldAll = M.UI.closeAll;                 // Esc & "tutup semua" ikut menutup peta
    M.UI.closeTopModal = () => closeMap() || old(); M.UI.closeAll = function () { closeMap(true); return oldAll.apply(this, arguments); };
    addEventListener('keydown', e => { if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat && M.Game.running && !/INPUT|TEXTAREA/.test((document.activeElement || {}).nodeName || '')) { e.preventDefault(); open ? closeMap() : openMap(); } });
  }
  M.MapUI = { init, tick, open: openMap, close: closeMap, isOpen: () => open, markers, invalidate: () => { baseKey = ''; lastKey = ''; } };
})(window.MPH);
