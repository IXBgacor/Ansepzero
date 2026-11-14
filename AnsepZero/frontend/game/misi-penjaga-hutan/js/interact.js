/* Deteksi jangkauan & tombol INTERAKSI. Tombol aktif hanya jika ada target yang sah. Listener dipasang sekali.
   v0.4: mendukung banyak area bahaya (asap/api/lahan terbakar), masing-masing dengan cincin sendiri. */
(function (M) {
  const $ = id => document.getElementById(id), W = () => M.World;
  let btn, hintEl, actEl, bound = false, cur = null, lastKey = '', inDanger = {};

  /* Satu-satunya tempat yang menentukan target; trigger() memakai ulang agar tidak bergantung cache. */
  function scan() {
    const pl = M.Player.state, px = pl.x, py = pl.y - 3, res = { poi: null, hint: '', danger: false, zone: 'far', tzone: 'none' }, cam = M.Game.baseCam(), sv = M.Game.safeView();   // v0.5²: kamera pengikut (bukan kamera yang digeser)
    const vis = (sx, sy) => sx > sv.l && sx < sv.r && sy > sv.t && sy < sv.b;      // v0.4²: batas "terlihat" mengikuti ukuran layar & HUD
    if (M.Vehicles && M.Vehicles.driving()) { res.poi = M.Vehicles.exitPoi(); return res; }       // v2.0: saat mengemudi, satu-satunya aksi = Turun
    let best = null, bs = 9;
    for (const p of (M.Vehicles ? W().pois.concat(M.Vehicles.pois()) : W().pois)) {
      if (!p._veh && W().isHazard(p)) continue;
      const c = W().center(p), s = Math.hypot(px - c.x, py - c.y) / p.r;
      const fx = pl.dir === 3 ? 1 : pl.dir === 2 ? -1 : 0, fy = pl.dir === 0 ? 1 : pl.dir === 1 ? -1 : 0;   // v2.0: target di depan pemain diutamakan
      const sc = s - (((c.x - px) * fx + (c.y - py) * fy) > 0 ? 0.15 : 0);
      if (s <= 1 && sc < bs) { bs = sc; best = p; }
    }
    let nearest = null, nd = 1e9, safeH = null, sd = 1e9, anyOff = false;
    const tgt = M.Missions.targets();
    for (const h of W().hazards()) {
      const c = W().center(h), d = Math.hypot(px - c.x, py - c.y), R = W().ringOf(h);
      if (d < nd) { nd = d; nearest = h; }
      const zone = d < R.min ? 'danger' : d > 190 ? 'far' : d > R.max ? 'near' : 'safe';
      if (zone === 'danger') res.danger = true;
      if (zone === 'safe') { const sx = c.x - cam.x, sy = c.y - cam.y; if (vis(sx, sy)) { if (d < sd) { sd = d; safeH = h; } } else anyOff = true; }
      if (tgt.includes(h.id) && M.Missions.stepsAt(h.id).some(x => x.s.t === 'observe')) {   // status untuk tracker: hanya hazard yang jadi tujuan
        const sx = c.x - cam.x, sy = c.y - cam.y;
        res.tzone = zone === 'safe' && !vis(sx, sy) ? 'offscreen' : zone; res.tz = res.tzone;
      }
    }
    if (nearest) { const R = W().ringOf(nearest); res.d = nd; res.zone = nd < R.min ? 'danger' : nd > 190 ? 'far' : nd > R.max ? 'near' : 'safe'; }
    if (best) res.poi = best;
    else if (res.danger) res.hint = 'Terlalu dekat dengan asap/api! Mundur.';
    else if (safeH) res.poi = safeH;
    else if (anyOff) { res.hint = 'Geser posisi agar area bahaya terlihat di layar.'; res.zone = 'offscreen'; }
    return res;
  }
  /* Masuk zona bahaya dihitung SEKALI per kunjungan per area (histeresis 10 px) dan hanya bila ada tugas "amati" area itu yang belum selesai. */
  function trackDanger() {
    const pl = M.Player.state;
    for (const h of W().hazards()) {
      const c = W().center(h), d = Math.hypot(pl.x - c.x, pl.y - 3 - c.y), R = W().ringOf(h);
      if (d < R.min) { if (!inDanger[h.id]) { inDanger[h.id] = true; M.Missions.noteDanger(h.id); } }
      else if (d > R.min + 10) inDanger[h.id] = false;
    }
  }
  function update() {
    if (!bound) return;
    const frozen = M.Game.frozen; let r = { poi: null, hint: '', danger: false, zone: 'far', tzone: 'none' };
    if (!frozen) r = scan();
    cur = r.poi;
    if (!frozen) trackDanger();
    const text = frozen ? '' : (r.poi ? r.poi.verb + ': ' + r.poi.name : (r.hint || 'Dekati NPC atau objek'));
    const key = (r.poi ? r.poi.id : '-') + '|' + text + '|' + (r.danger ? 1 : 0) + '|' + frozen + '|' + r.tzone;
    if (key === lastKey) return; lastKey = key;
    btn.disabled = !r.poi; hintEl.textContent = text; hintEl.classList.toggle('warn', !!r.hint && !r.poi);
    actEl.classList.toggle('idle', !r.poi && !r.hint);   // v2.0: tanpa target & tanpa peringatan -> tombol & label disembunyikan
    actEl.classList.toggle('ready', !!r.poi); actEl.classList.toggle('warn', !!r.hint && !r.poi);   // v0.4²: dipakai CSS mode PC (petunjuk [E])
    if (!frozen) { M.UI.setSafety(r.danger); M.UI.setZone(r.tzone); }
  }
  function trigger() {
    if (!bound || !M.Game.running || M.Game.frozen || !M.Dialog.canOpen()) return;
    const t = scan(); if (!t.poi) return;
    if (M.Bike && M.Bike.riding()) M.Bike.dismount();                // v3.1: berinteraksi = turun dari sepeda
    if (t.poi._vexit) { M.Audio.sfx('interact'); M.Vehicles.exit(); lastKey = ''; return; }        // v2.0: kendaraan
    if (t.poi._veh) { M.Audio.sfx('interact'); M.Vehicles.enter(t.poi._veh); lastKey = ''; return; }
    const node = M.Content.build(t.poi); if (node) { M.Audio.sfx('interact'); M.Dialog.show(node); lastKey = ''; }
  }
  function init() {
    if (bound) return; bound = true; btn = $('btn-act'); hintEl = $('act-hint'); actEl = $('actions');
    btn.addEventListener('pointerdown', e => { if (e.button > 0) return; e.preventDefault(); trigger(); });
    btn.addEventListener('click', e => { if (e.detail === 0) trigger(); });       // hanya aktivasi non-pointer (keyboard)
    /* v0.4²: tombol E/Enter ditangani satu pintu oleh main.js (agar tidak ada input ganda dengan dialog/menu). */
  }
  M.Interact = { init, update, scan, trigger, current: () => cur };
})(window.MPH);
