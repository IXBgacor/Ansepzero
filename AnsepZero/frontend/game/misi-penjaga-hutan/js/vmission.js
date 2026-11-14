/* Misi Kendaraan v4.0 — setiap kendaraan punya misi sendiri (terpisah dari 30 misi kampanye; tidak mengubah skor/progres kampanye).
   - Naik kendaraan -> dialog KONFIRMASI "Mulai misi / Tidak, hanya berkendara" (muncul sekali per naik; tidak muncul bila misi itu sedang berjalan).
   - Traktor (2 ladang): bajak seluruh petak ladang. Mobil pemadam: berhenti dekat 3 titik api tepi jalan, selang menyemprot otomatis.
     Helikopter: padamkan 3 hotspot lahan gambut dengan melayang di atasnya; tangki air kecil -> isi ulang dengan melayang di atas sungai/kanal.
     Ambulans: jemput 3 warga di permukiman selatan lalu antar ke Puskesmas.
   - Hanya satu misi aktif; misi lain yang sedang berjalan dibatalkan bila memulai yang baru. Misi selesai tersimpan (localStorage 'mph.vm'); boleh diulang.
   - Penanda target tampil di minimap & peta desa (kuning = target aktif); panel ringkas di kiri atas. */
(function (M) {
  'use strict';
  const T = M.C.TILE, KEY = 'mph.vm', $ = id => document.getElementById(id), lerp = (a, b, t) => a + (b - a) * t;
  const tc = (tx, ty) => ({ x: tx * T + 8, y: ty * T + 8 });
  const FIRE_TRUCK = [[30, 38], [42, 38], [76, 38]], FIRE_HELI = [[9, 46], [27, 47], [16, 52]], TANK_CAP = 2;
  const PICK = [{ x: 728, y: 720, spr: 'warga3', name: 'Bu Sari' }, { x: 936, y: 720, spr: 'pedagang2', name: 'Pak Dedi' }, { x: 728, y: 848, spr: 'warga', name: 'Pak Rahmat' }];
  const ZONE = { x: 1464, y: 648, r: 48, name: 'Puskesmas Rimba Asri' };
  const DEFS = {
    traktor1: { id: 'traktor1', vid: 'traktor1', type: 'tractor', title: 'Bertani: Bajak Ladang Barat', field: () => M.Village.L.fieldA,
      desc: 'Bajak seluruh petak ladang barat dengan traktor. Menyiapkan lahan tanpa membakar menjaga hutan dan gambut tetap aman.',
      done: 'Ladang barat sudah dibajak. Membuka lahan tanpa api mencegah kebakaran yang merambat ke hutan dan gambut.' },
    traktor2: { id: 'traktor2', vid: 'traktor2', type: 'tractor', title: 'Bertani: Bajak Ladang Timur', field: () => M.Village.L.fieldB,
      desc: 'Bajak seluruh petak ladang timur. Telusuri tiap barisnya sampai tanahnya gembur.',
      done: 'Ladang timur selesai dibajak. Tanah yang gembur dan lembap lebih subur dan tidak perlu dibakar.' },
    damkar1: { id: 'damkar1', vid: 'damkar1', type: 'firetruck', title: 'Pemadaman Semak di Tepi Jalan',
      desc: 'Ada 3 titik api kecil di tepi Jalan Lintas Selatan. Berhenti dekat api — selang menyemprot otomatis sampai padam.',
      done: 'Ketiga titik api padam. Api kecil yang dipadamkan cepat tidak sempat menjalar ke permukiman dan hutan.' },
    heli1: { id: 'heli1', vid: 'heli1', type: 'heli', title: 'Pemadaman Udara: Hotspot Gambut',
      desc: 'Padamkan 3 hotspot di lahan gambut barat dengan melayang di atasnya. Tangki kecil: isi ulang di atas sungai atau kanal.',
      done: 'Hotspot gambut padam. Api gambut menjalar di bawah tanah dan sulit dipadamkan dari darat — helikopter membantu menjangkau lahan yang sulit dilalui.' },
    ambulans1: { id: 'ambulans1', vid: 'ambulans1', type: 'ambulance', title: 'Evakuasi Warga ke Puskesmas',
      desc: 'Jemput 3 warga terdampak asap di permukiman selatan (berhenti dekat warga), lalu antar ke Puskesmas.',
      done: 'Semua warga tiba di Puskesmas. Saat asap tebal, kelompok rentan perlu dievakuasi lebih dulu.' }
  };
  let S = { active: null, done: {}, run: null }, pending = null, dirty = true, acc = 0, lastPanel = '';
  try { const d = JSON.parse(M.Store.get(KEY) || 'null'); if (d && d.done) S.done = d.done; } catch (e) { /* abaikan */ }
  const save = () => { try { M.Store.set(KEY, JSON.stringify({ v: 1, done: S.done })); } catch (e) { /* abaikan */ } };
  const cutscene = () => !!((M.Cutscene && M.Cutscene.active) || M.Game.cine);
  const cur = () => (S.active ? DEFS[S.active] : null);
  const veh = () => { const v = M.Vehicles.current(); const m = cur(); return m && v && v.id === m.vid ? v : null; };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function start(id) {
    const m = DEFS[id]; if (!m) return false; const r = { t: 0 };
    if (m.type === 'tractor') { const f = m.field(); r.tiles = []; for (let y = f[1]; y <= f[3]; y++) for (let x = f[0]; x <= f[2]; x++) r.tiles.push({ x, y, d: false }); r.need = Math.ceil(r.tiles.length * 0.92); }
    else if (m.type === 'firetruck') r.fires = FIRE_TRUCK.map(p => Object.assign(tc(p[0], p[1]), { hp: 1, out: false, on: false }));
    else if (m.type === 'heli') { r.fires = FIRE_HELI.map(p => Object.assign(tc(p[0], p[1]), { hp: 1, out: false, on: false })); r.tank = TANK_CAP; r.fill = false; }
    else if (m.type === 'ambulance') { r.res = PICK.map(p => Object.assign({ hold: 0, got: false }, p)); r.phase = 'pickup'; r.zone = 0; }
    S.active = id; S.run = r; dirty = true; if (M.Audio) M.Audio.sfx('mission'); if (M._toast) M._toast('Misi dimulai: ' + m.title); return true;
  }
  function cancel() { S.active = null; S.run = null; pending = null; dirty = true; }
  function finish() {
    const m = cur(); if (!m) return; S.done[m.id] = 1; save(); S.active = null; S.run = null; dirty = true;
    if (M.Audio) M.Audio.sfx('reward');
    const node = { title: 'Misi selesai!', icon: 'officer', tone: 'info', pages: [m.title + ' — selesai!', m.done], footer: 'Misi Kendaraan' };
    if (!M.Dialog.show(node) && M._toast) M._toast('Misi selesai: ' + m.title);
  }
  function onEnter(v) {                                              // true = ada konfirmasi/pesan misi (petunjuk kemudi ditunda/ditiadakan)
    const m = DEFS[v.id]; if (!m) return false; if (S.active === m.id) { if (M._toast) M._toast('Lanjutkan misi: ' + m.title); dirty = true; return true; }
    pending = m.id; return true;
  }
  function onExit() { pending = null; dirty = true; }
  function confirmNode(m) {
    const was = !!S.done[m.id], other = S.active && S.active !== m.id ? ' (Misi lain yang berjalan dibatalkan.)' : '';
    return { title: 'Misi: ' + m.title, icon: 'officer', tone: 'info', footer: 'Misi Kendaraan', pages: [(was ? 'Sudah pernah selesai — ulangi? ' : '') + m.desc + other],
      choices: [{ label: was ? 'Ulangi misi' : 'Mulai misi', pick: () => { start(m.id); return null; } }, { label: 'Tidak, hanya berkendara', pick: () => { M.Vehicles.hint(M.Vehicles.current()); return null; } }] };
  }

  /* ---------- logika per jenis misi ---------- */
  const slow = (v, lim) => (v.moved || 0) < lim;
  function update(dt) {
    const m = cur(), r = S.run, v = veh(); if (!m || !r || !v) return; r.t += dt;
    if (m.type === 'tractor') { let n = 0; for (const t of r.tiles) { if (!t.d && Math.hypot(t.x * T + 8 - v.x, t.y * T + 8 - v.y) <= 13) { t.d = true; dirty = true; } if (t.d) n++; } r.n = n; if (n >= r.need) finish(); }
    else if (m.type === 'firetruck') { let left = 0; for (const f of r.fires) { if (f.out) continue; f.on = dist(f, v) < 80 && slow(v, 14); if (f.on) { f.hp -= dt / 3.2; dirty = true; if (f.hp <= 0) { f.out = true; f.on = false; if (M.Audio) M.Audio.sfx('correct'); } } if (!f.out) left++; } if (!left) finish(); }
    else if (m.type === 'heli') {
      const high = v.alt > 0.85 && slow(v, 26); r.fill = false; r.drop = null;
      if (high && r.tank < TANK_CAP && M.Map.tileAt(v.x, v.y) === M.T.WATER) { r.fill = true; r.tank = Math.min(TANK_CAP, r.tank + dt * 0.9); dirty = true; }
      let left = 0; for (const f of r.fires) { if (f.out) continue; f.on = false; if (high && r.tank > 0 && dist(f, v) < 46) { f.on = true; r.drop = f; f.hp -= dt / 2; r.tank = Math.max(0, r.tank - dt * 0.5); dirty = true; if (f.hp <= 0) { f.out = true; f.on = false; if (M.Audio) M.Audio.sfx('correct'); } } if (!f.out) left++; }
      if (!left) finish();
    } else if (m.type === 'ambulance') {
      if (r.phase === 'pickup') { let got = 0; for (const p of r.res) { if (!p.got) { if (dist(p, v) < 42 && slow(v, 12)) { p.hold += dt; if (p.hold >= 1) { p.got = true; dirty = true; if (M.Audio) M.Audio.sfx('correct'); } } else p.hold = Math.max(0, p.hold - dt); } if (p.got) got++; } r.got = got; if (got === r.res.length) { r.phase = 'deliver'; dirty = true; if (M._toast) M._toast('Semua warga di ambulans. Antar ke Puskesmas!'); } }
      else if (dist(ZONE, v) < ZONE.r && slow(v, 12)) { r.zone += dt; if (r.zone >= 1.2) finish(); } else r.zone = Math.max(0, r.zone - dt);
    }
  }
  function info() {                                                  // teks panel
    const m = cur(), r = S.run; if (!m || !r) return null; const v = veh(); let obj = '', frac = 0, extra = '';
    if (m.type === 'tractor') { const n = r.n || 0; frac = Math.min(1, n / r.need); obj = 'Bajak ladang: ' + n + '/' + r.tiles.length + ' petak'; }
    else if (m.type === 'firetruck') { const out = r.fires.filter(f => f.out).length; frac = out / r.fires.length; obj = 'Padamkan api: ' + out + '/' + r.fires.length; extra = 'Berhenti dekat api'; }
    else if (m.type === 'heli') { const out = r.fires.filter(f => f.out).length; frac = out / r.fires.length; obj = 'Padamkan hotspot: ' + out + '/' + r.fires.length; extra = 'Tangki air ' + Math.round(r.tank / TANK_CAP * 100) + '%' + (r.tank <= 0.01 ? ' — isi di sungai/kanal' : ''); }
    else { const got = r.got || 0; frac = r.phase === 'pickup' ? got / (r.res.length * 2) : 0.5 + Math.min(0.5, r.zone / 2.4); obj = r.phase === 'pickup' ? 'Jemput warga: ' + got + '/' + r.res.length : 'Antar ke Puskesmas'; extra = r.phase === 'pickup' ? 'Berhenti dekat warga' : 'Berhenti di depan Puskesmas'; }
    if (!v) extra = 'Naik ' + (M.Vehicles.list().find(x => x.id === m.vid) || {}).name + ' untuk melanjutkan';
    return { title: m.title, obj, frac, extra };
  }
  function panel() {
    const el = $('vmpanel'); if (!el) return; const i = !cutscene() && info(), k = i ? [i.title, i.obj, Math.round(i.frac * 100), i.extra].join('|') : ''; if (k === lastPanel) return; lastPanel = k;
    el.hidden = !i; if (!i) return; $('vm-title').textContent = i.title; $('vm-obj').textContent = i.obj; $('vm-fill').style.width = Math.round(i.frac * 100) + '%'; $('vm-extra').textContent = i.extra;
  }
  function tick(dt) {
    if (M.Game.frozen) return; dt = Math.min(dt || 0.016, 0.1);
    if (pending && M.Vehicles.driving() && M.Dialog.canOpen() && !cutscene()) { const v = M.Vehicles.current(), m = DEFS[pending]; pending = null; if (v && m && v.id === m.vid) M.Dialog.show(confirmNode(m)); }
    if (S.active && !cutscene()) update(dt);
    acc += dt; if (acc > 0.15 || dirty) { acc = 0; dirty = false; panel(); }
  }

  /* ---------- gambar: lapisan tanah (bajakan), api, warga, zona, semprotan ---------- */
  function entities(l) {
    const r = S.run, m = cur(); if (!m || !r || cutscene()) return; const t = performance.now() / 1000, SPR = M.Sprites, sn = M.View.snap;
    if (m.type === 'tractor') l.push({ y: -1e6, draw: (ctx, cx, cy) => { for (const q of r.tiles) if (q.d) { ctx.fillStyle = '#5a3a1e'; ctx.fillRect(sn(q.x * T - cx), sn(q.y * T - cy), T, T); ctx.fillStyle = '#7a5230'; for (let k = 2; k < T; k += 4) ctx.fillRect(sn(q.x * T - cx), sn(q.y * T + k - cy), T, 1); ctx.fillStyle = '#3f2810'; ctx.fillRect(sn(q.x * T - cx), sn(q.y * T + T - 1 - cy), T, 1); } } });
    if (m.type === 'firetruck' || m.type === 'heli') {
      for (const f of r.fires) {
        if (f.out) continue;
        l.push({ y: f.y, draw: (ctx, cx, cy) => {
          const k = 1.2 + 1.3 * (0.35 + 0.65 * f.hp), im = SPR.fire[Math.floor(t * 5 + f.x) % 2], w = im.width * k, h = im.height * k;
          ctx.globalAlpha = 0.35; ctx.fillStyle = '#6a6a6a'; for (let i = 0; i < 3; i++) { const u = (t * 0.6 + i / 3) % 1; ctx.beginPath(); ctx.arc(sn(f.x - cx + Math.sin(t + i) * 3), sn(f.y - h * 0.7 - u * 18 - cy), 3 + u * 4, 0, 6.3); ctx.fill(); } ctx.globalAlpha = 1;
          ctx.drawImage(im, sn(f.x - w / 2 - cx), sn(f.y + 4 - h - cy), w, h);
          if (f.hp < 1) { ctx.fillStyle = '#000a'; ctx.fillRect(sn(f.x - 10 - cx), sn(f.y + 8 - cy), 20, 3); ctx.fillStyle = '#4fc0ff'; ctx.fillRect(sn(f.x - 9 - cx), sn(f.y + 9 - cy), Math.max(0, 18 * (1 - f.hp)), 1); } } });
      }
      const v = veh(); if (v) {
        for (const f of r.fires) if (f.on) l.push({ y: 1e6 + 1, draw: (ctx, cx, cy) => {                 // semprotan: mobil = busur dari selang, helikopter = air jatuh dari tangki
          const x0 = v.x, y0 = v.fly ? v.y - Math.round((v.alt || 0) * 22) + 4 : v.y - 8, x1 = f.x, y1 = f.y - 6; ctx.fillStyle = '#9fdcff';
          for (let i = 0; i < 12; i++) { const u = (t * 2.6 + i / 12) % 1; ctx.fillRect(sn(lerp(x0, x1, u) - cx), sn(lerp(y0, y1, u) - (v.fly ? 0 : Math.sin(Math.PI * u) * 10) - cy), 2, 2); } } });
        if (r.fill) l.push({ y: 1e6 + 1, draw: (ctx, cx, cy) => { ctx.globalAlpha = 0.6; ctx.fillStyle = '#d8f0ff'; for (let i = 0; i < 6; i++) { const u = (t * 3 + i / 6) % 1; ctx.fillRect(sn(v.x - 8 + i * 3 - cx), sn(v.y + 2 - u * 10 - cy), 2, 2); } ctx.globalAlpha = 1; } });
      }
    }
    if (m.type === 'ambulance') {
      for (const p of r.res) if (!p.got) l.push({ y: p.y, draw: (ctx, cx, cy) => { const im = SPR.npc[p.spr][0], pu = 0.6 + 0.4 * Math.sin(t * 4);
        ctx.globalAlpha = 0.5 * pu; ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(sn(p.x - cx), sn(p.y + 1 - cy), 14, 7, 0, 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.drawImage(im, sn(p.x - im.width / 2 - cx), sn(p.y - im.height + 2 - cy)); if (p.hold > 0) { ctx.fillStyle = '#000a'; ctx.fillRect(sn(p.x - 9 - cx), sn(p.y - 22 - cy), 18, 3); ctx.fillStyle = '#7be08f'; ctx.fillRect(sn(p.x - 8 - cx), sn(p.y - 21 - cy), 16 * Math.min(1, p.hold), 1); } } });
      if (r.phase === 'deliver') l.push({ y: -9e5, draw: (ctx, cx, cy) => { const pu = 0.5 + 0.5 * Math.sin(t * 4); ctx.globalAlpha = 0.25 + 0.2 * pu; ctx.fillStyle = '#7be08f'; ctx.beginPath(); ctx.ellipse(sn(ZONE.x - cx), sn(ZONE.y - cy), ZONE.r, ZONE.r * 0.6, 0, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = '#7be08f'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#d8352a'; ctx.fillRect(sn(ZONE.x - 2 - cx), sn(ZONE.y - 7 - cy), 4, 14); ctx.fillRect(sn(ZONE.x - 7 - cx), sn(ZONE.y - 2 - cy), 14, 4); } });
    }
  }
  /* ---------- penanda untuk minimap/peta (satuan petak) ---------- */
  function targets() {
    const m = cur(), r = S.run, out = []; if (!m || !r) return out; const v = veh(), vn = (M.Vehicles.list().find(x => x.id === m.vid) || {}), px = o => ({ x: o.x / T, y: o.y / T });
    if (!v) { out.push({ id: 'vm_veh', name: vn.name, x: vn.x / T, y: vn.y / T, step: 'Naik untuk melanjutkan misi', mission: m.title }); return out; }
    if (m.type === 'tractor') { const f = m.field(); out.push({ id: 'vm_field', name: 'Ladang', x: (f[0] + f[2] + 1) / 2, y: (f[1] + f[3] + 1) / 2, step: 'Bajak seluruh petak', mission: m.title }); }
    else if (m.type === 'firetruck' || m.type === 'heli') r.fires.forEach((f, i) => { if (!f.out) out.push(Object.assign({ id: 'vm_fire' + i, name: m.type === 'heli' ? 'Hotspot gambut' : 'Titik api', step: 'Padamkan', mission: m.title }, px(f))); });
    else if (r.phase === 'pickup') r.res.forEach((p, i) => { if (!p.got) out.push(Object.assign({ id: 'vm_res' + i, name: p.name, step: 'Jemput warga', mission: m.title }, px(p))); });
    else out.push(Object.assign({ id: 'vm_zone', name: ZONE.name, step: 'Antar warga', mission: m.title }, px(ZONE)));
    return out;
  }
  const key = () => (S.active || '-') + ':' + (S.run ? (S.run.n || 0) + '/' + (S.run.got || 0) + '/' + (S.run.fires ? S.run.fires.filter(f => f.out).length : 0) + '/' + (S.run.phase || '') : '') + ':' + (M.Vehicles.driving() ? 1 : 0);
  function init() { const el = $('vmpanel'); if (el) el.addEventListener('click', () => { if (M._toast && S.active) M._toast(cur().desc); }); }
  M.VMission = { DEFS, init, tick, entities, targets, key, start, cancel, onEnter, onExit, info, state: () => S, confirmNode, FIRE_TRUCK, FIRE_HELI, PICK, ZONE, TANK_CAP, done: id => !!S.done[id] };
})(window.MPH);
