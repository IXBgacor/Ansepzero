/* Story v1.0 — cutscene berbasis TIMELINE (generator) di atas mesin cutscene.js (mode `manual`) + cerita utama (intro) & ending.
   Skrip = function* yang meng-`yield` langkah: wait, fade, camTo/camGo, walk, say (dialog), par (paralel), sub, call, title, banner, gearCard.
   Pemisahan data & animasi: skrip hanya MENJALANKAN event; kondisi akhir dunia ditulis lewat M.WorldState.apply() di `finalize*`, yang dipanggil pada
   akhir normal MAUPUN saat dilewati (cleanup) -> hasil identik. Posisi NPC memakai poi._ov (sementara) dan selalu dibersihkan.
   Dialog: Otomatis / Manual / Cepat (disimpan 'mph.v10.dlg'); ketuk kotak, tombol Lanjut, atau Enter/E/Spasi untuk melanjutkan. */
(function (M) {
  'use strict';
  const $ = id => document.getElementById(id), T = M.C.TILE, W = () => M.World, A = () => M.Audio, S = () => M.Sprites, D = M.DIR, V = M.View;
  const Cs = M.Cutscene, L = Cs.lib, { ease, lerp, clamp, walker } = L;
  const foot = (tx, ty) => ({ x: tx * T + 8, y: ty * T + 14 }), poiHome = id => { const p = W().byId[id]; return foot(p.tx, p.ty); };
  const path = (a, b) => M.Map.findPath(a.x, a.y, b.x, b.y, { startAnywhere: true }) || [a, b];
  const spot = id => { const s = M.Spots.spotOf(W().byId[id]); return s ? { x: s.x, y: s.y } : poiHome(id); };
  const setCam = (st, x, y, z) => { st.camAnim = null; st.follow = null; st.cam = { x, y, z }; };

  /* ================= kotak dialog sinematik ================= */
  const MODES = ['auto', 'manual', 'fast'], MLABEL = { auto: 'Otomatis', manual: 'Manual', fast: 'Cepat' };
  let mode = (() => { const v = M.Store.get('mph.v10.dlg'); return MODES.includes(v) ? v : 'auto'; })(), adv = false, cur = null;
  function setMode(m) { mode = m; M.Store.set('mph.v10.dlg', m); const b = $('say-spd'); if (b) b.textContent = MLABEL[m]; }
  const Say = {
    get visible() { return !!cur; }, get mode() { return mode; },
    advance() { if (!cur) return false; adv = true; return true; },
    cycle() { setMode(MODES[(MODES.indexOf(mode) + 1) % 3]); },
    hide() { cur = null; adv = false; const e = $('cine-say'); if (e) e.hidden = true; if (A()) A().npcStop(); }
  };
  function sayStep(name, text, o) {
    o = o || {}; let typed = 0, wt = 0;
    return { start() { cur = { name, text }; adv = false; const e = $('cine-say'); e.hidden = false; e.classList.toggle('narr', !name); $('say-name').textContent = name || ''; $('say-name').hidden = !name; $('say-txt').textContent = ''; A().voice(name || 'Narator', text); },
      tick(dt) {
        typed = Math.min(text.length, typed + (mode === 'fast' ? 90 : 34) * dt); $('say-txt').textContent = text.slice(0, Math.floor(typed));
        const all = typed >= text.length; let fin = false;
        if (adv) { adv = false; if (!all) { typed = text.length; $('say-txt').textContent = text; wt = 0; return false; } fin = true; }
        else if (all && mode !== 'manual') { wt += dt; if (wt >= (o.hold || Math.max(mode === 'fast' ? 0.7 : 1.5, text.length * (mode === 'fast' ? 0.02 : 0.042)))) fin = true; }
        if (fin) { Say.hide(); return true; } return false;
      } };
  }

  /* ================= runner timeline ================= */
  function runner(genFn, st) {
    const gen = genFn(st); let step = null, done = false;
    return { get done() { return done; }, tick(dt) {
      let g = 0;
      while (!done && g++ < 200) {
        if (!step) { const n = gen.next(); if (n.done) { done = true; break; } step = n.value; if (step && step.start) step.start(); }
        if (!step || !step.tick) { step = null; continue; }
        if (!step.tick(dt)) break;
        step = null; dt = 0;
      }
      return done; } };
  }
  const wait = sec => { let t = 0; return { tick(dt) { t += dt; return t >= sec; } }; };
  const call = fn => ({ start() { fn(); } });
  const sub = genFn => { let r = null; return { start() { r = null; }, tick(dt) { if (!r) r = runner(genFn, Cs.state); return r.tick(dt); } }; };
  const par = (...steps) => { const fin = steps.map(() => false); return { start() { steps.forEach(s => s.start && s.start()); }, tick(dt) { let all = true; steps.forEach((s, i) => { if (!fin[i]) { if (!s.tick || s.tick(dt)) fin[i] = true; else all = false; } }); return all; } }; };
  const fade = (to, dur) => { let from, t = 0; return { start() { from = Cs.state.fade; t = 0; }, tick(dt) { t += dt; Cs.state.fade = lerp(from, to, ease(t / dur)); return t >= dur; } }; };
  const camGo = (x, y, z, dur) => ({ start() { const st = Cs.state; st.follow = null; st.camAnim = { a: { x: st.cam.x, y: st.cam.y, z: st.cam.z }, b: { x, y, z }, t: 0, dur }; } });
  const camTo = (x, y, z, dur) => par(camGo(x, y, z, dur), wait(dur));
  const say = (n, t, o) => sayStep(n, t, o);
  const pEnt = () => ({ set(x, y, dir, mv) { const P = M.Player.state; P.x = x; P.y = y; if (dir != null) P.dir = dir; P.frame = mv ? Math.floor(Cs.time * 8) % 4 : 0; P.run = false; }, get x() { return M.Player.state.x; }, get y() { return M.Player.state.y; } });
  const nEnt = id => { const p = W().byId[id]; return { id, set(x, y, dir, mv, a) { p._ov = { x: x - 8, y: y - 14, dir: dir == null ? D.DOWN : dir, moving: !!mv, a: a == null ? 1 : a }; }, clear() { delete p._ov; }, get x() { return p._ov ? p._ov.x + 8 : poiHome(id).x; }, get y() { return p._ov ? p._ov.y + 14 : poiHome(id).y; } }; };
  const xEnt = (st, sprite, v) => { const e = { sprite, v: v || 0, x: 0, y: 0, dir: D.DOWN, mv: false, vis: true, hop: false, set(x, y, dir, mv) { e.x = x; e.y = y; if (dir != null) e.dir = dir; e.mv = !!mv; } }; st.extra.push(e); return e; };
  const walk = (ent, pts, speed) => { let w, t = 0, last = D.DOWN; return { start() { w = walker(pts, speed, 0); t = 0; }, tick(dt) { t += dt; const r = w.at(t); if (r.dir != null) last = r.dir; ent.set(r.x, r.y, r.dir == null ? last : r.dir, r.moving); return r.done; } }; };
  const title = on => call(() => { const e = $('cine-title'); e.hidden = false; void e.offsetWidth; e.classList.toggle('on', on); if (!on) setTimeout(() => { if (!e.classList.contains('on')) e.hidden = true; }, 900); });
  const banner = (a, b) => call(() => { const e = $('cine-banner'); $('banner-main').textContent = a; $('banner-sub').textContent = b || ''; e.hidden = false; e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); A().cutPlay('chime', { gain: 0.5 }); });
  const gearCard = () => call(() => {
    const e = $('cine-gear'); e.textContent = ''; const h = document.createElement('p'); h.textContent = 'Perlengkapan Penjaga Hutan diterima'; e.appendChild(h);
    const row = document.createElement('div'); e.appendChild(row);
    Object.keys(M.WorldState.GEAR).forEach((k, i) => { const f = document.createElement('figure'); f.style.animationDelay = (i * 0.45) + 's'; const im = document.createElement('img'); im.src = S().gearURL(k); im.alt = ''; const c = document.createElement('figcaption'); c.textContent = M.WorldState.GEAR[k]; f.append(im, c); row.appendChild(f); setTimeout(() => { if (Cs.active) A().sfx('reward'); }, 300 + i * 450); });
    e.hidden = false; e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); M.WorldState.apply('gear_granted'); });
  const hideCards = () => call(() => { ['cine-gear', 'cine-banner'].forEach(i => { const e = $(i); e.classList.remove('on'); e.hidden = true; }); });
  const sfx = (k, g) => call(() => A().cutPlay(k, { gain: g || 0.3 }));
  const cap = t => call(() => Cs.cap(t));

  /* ================= efek ================= */
  const birds = n => { const b = []; for (let i = 0; i < n; i++) b.push({ x: i * 37 - 40, y: 8 + (i * 23) % 70, sp: 14 + (i % 4) * 3, ph: i * 0.7 }); return b; };
  function drawBirds(ctx, cx, cy, tm, st) {
    if (!st.birdsOn) return; ctx.fillStyle = '#1a1a22'; const o = st.birdOrg;
    for (const b of st.birds) { const x = o.x - 100 + ((b.x + tm * b.sp) % 260), y = o.y + b.y + Math.sin(tm * 1.3 + b.ph) * 4, f = Math.floor(tm * 6 + b.ph * 3) % 2, sx = Math.round(x - cx), sy = Math.round(y - cy);
      ctx.fillRect(sx, sy + (f ? 1 : 0), 2, 1); ctx.fillRect(sx - 2, sy + (f ? 0 : 1), 2, 1); ctx.fillRect(sx + 2, sy + (f ? 0 : 1), 2, 1); ctx.fillRect(sx - 3, sy + (f ? -1 : 2), 1, 1); ctx.fillRect(sx + 4, sy + (f ? -1 : 2), 1, 1); }
  }
  function tint(ctx, st) {
    const s = L.screen();
    if (st.warm) { ctx.globalAlpha = st.warm; ctx.fillStyle = '#ffd9a0'; ctx.fillRect(0, 0, s.w, s.h); }
    if (st.haze > 0.01) { ctx.globalAlpha = st.haze; ctx.fillStyle = '#9a7a40'; ctx.fillRect(0, 0, s.w, s.h); } ctx.globalAlpha = 1;
  }
  function wisps(ctx, c, tm, cx, cy, k) {
    if (k <= 0.02) return; ctx.fillStyle = '#9a9ca2';
    for (let i = 0; i < 6; i++) { const ph = (tm * 0.2 + i / 6) % 1; ctx.globalAlpha = Math.max(0, (1 - ph) * 0.5 * k); L.disc(ctx, Math.round(c.x - 30 + i * 12 + Math.sin(ph * 5 + i) * 3 - cx), Math.round(c.y - ph * 50 - cy), 3 + Math.floor(ph * 5)); } ctx.globalAlpha = 1;
  }
  const baseUpdate = (t, dt, st) => {
    if (st.camAnim) { const a = st.camAnim; a.t += dt; const u = ease(a.t / a.dur); st.cam = { x: lerp(a.a.x, a.b.x, u), y: lerp(a.a.y, a.b.y, u), z: lerp(a.a.z, a.b.z, u) }; if (a.t >= a.dur) st.camAnim = null; }
    if (st.follow) { const f = st.follow, k = 1 - Math.exp(-dt / 0.25); st.cam.x += (f.x - st.cam.x) * k; st.cam.y += (f.y - 8 - st.cam.y) * k; }
    if (st.r && !st.r.done && !st.stop) { try { st.r.tick(dt); } catch (e) { console.error('[Story]', e); st.end = true; } if (st.r.done) st.end = true; }
  };
  const baseAudio = (t, au, st) => { const a = st.amb || {}; ['forest', 'bird', 'wind', 'village', 'crowd', 'water', 'fire'].forEach(k => { const g = a[k] || 0; if (g > 0.004) au.cutPlay(k, { loop: true, gain: g, fade: 0.6 }); else au.cutStop(k, 0.7); }); };
  const entitiesOf = (list, st) => { for (const e of st.extra) if (e.vis) list.push({ y: e.y, draw: (ctx, cx, cy, tm) => { const bob = (e.mv || e.hop) ? Math.floor(tm * 8) % 2 : 0, img = e.sprite === 'fighter' ? S().fighter[e.v][e.dir] : S().npc[e.sprite][e.dir]; ctx.drawImage(img, V.snap(e.x - 8 - cx), V.snap(e.y - 14 - cy - bob)); } }); };
  const newSt = (o, extra) => Object.assign({ fade: 1, cam: { x: 0, y: 0, z: 1 }, follow: null, camAnim: null, amb: {}, extra: [], birds: birds(9), birdsOn: false, birdOrg: { x: 0, y: 0 }, haze: 0, warm: 0, end: false, stop: false }, extra || {});

  /* =================== CERITA UTAMA: INTRO =================== */
  function finalizeIntro(st) {
    if (st.replay) { const s = st.saved, P = M.Player.state; if (s) { P.x = s.x; P.y = s.y; P.dir = s.dir; } }
    else { M.WorldState.apply('intro_complete'); M.Player.reset(); if (M.Village.markSeen) M.Village.markSeen(); }
    M.Map.doorFx = null; ['lurah', 'officer', 'e_officer', 'v1', 'v2', 'v3', 'v4', 'v5'].forEach(id => { const p = W().byId[id]; if (p) delete p._ov; });
    ['cine-gear', 'cine-title', 'cine-banner'].forEach(i => { const e = $(i); if (e) { e.hidden = true; e.classList.remove('on'); } });
    Say.hide(); M.Map.applyStates();
  }
  function* introScript(st) {
    const nm = M.Final.P.name || 'Penjaga Hutan', P = pEnt(), lurah = nEnt('lurah'), cheer = ['v1', 'v2', 'v3', 'v4', 'v5', 'e_officer'].map(nEnt);
    /* 1. pembukaan: alam Kalimantan */
    st.fade = 1; st.warm = 0.1; st.birdsOn = true; st.birdOrg = { x: 26 * T, y: 4 * T }; setCam(st, 27 * T, 7 * T, 1); st.amb = { forest: 0.2, wind: 0.08 };
    yield sfx('whoosh', 0.2); yield fade(0, 2.2);
    yield camGo(22 * T, 12 * T, 1.08, 14); yield cap('Kalimantan Selatan');
    yield par(sub(function* () { yield wait(1.5); yield say('', 'Kalimantan Selatan. Sungai-sungai berkelok di antara hutan yang masih hijau.'); yield say('', 'Di tepinya, desa-desa kecil hidup berdampingan dengan alam: menanam, berdagang, dan saling menjaga.'); }),
      sub(function* () { yield wait(3.2); yield sfx('bird', 0.35); yield title(true); yield wait(5.2); yield title(false); }));
    yield camGo(27 * T, 17 * T, 1.1, 5); yield cap('Warga beraktivitas di tepi sungai');
    yield say('', 'Pagi di sini selalu dimulai dengan suara burung dan percakapan warga di pasar.', { hold: 2.4 });
    /* 2. kehidupan karakter */
    yield fade(1, 1.0); yield cap(''); st.birdsOn = false; st.warm = 0.06;
    const sd = spot('seedbed'); P.set(sd.x, sd.y, D.UP, false); setCam(st, sd.x, sd.y, 1.25); st.amb = { forest: 0.16, wind: 0.05 };
    yield fade(0, 1.0); yield cap('Dusun di hulu sungai, beberapa tahun lalu');
    st.dig = true; yield say('', nm + ' tumbuh di dusun kecil di hulu sungai. Sejak kecil, ia ikut ibunya membersihkan sungai dan menanam bibit di persemaian desa.'); st.dig = false;
    yield say('', 'Ia belajar bahwa hutan memberi air bersih, udara segar, dan penghidupan bagi semua orang.');
    P.set(sd.x, sd.y, D.UP, false); const sm = poiHome('smoke');
    yield par(camTo(sm.x, sm.y + 36, 1.15, 5.5), sub(function* () { yield wait(0.8); st.hazeGo = true; yield say('', 'Namun setiap kemarau, kabut asap datang. Langit menguning, sekolah diliburkan, dan adik-adik batuk berhari-hari.'); }));
    st.amb = { wind: 0.14 }; yield say(nm, 'Hutan ini rumah kita semua. Aku tidak mau hanya menonton ketika ia terbakar.');
    yield say('', 'Sejak hari itu, ia bertekad menjadi bagian dari mereka yang menjaga hutan.');
    /* 3. perjalanan menuju desa (lokasi nyata di peta) */
    yield fade(1, 1.0); st.hazeGo = false; st.haze = 0; yield cap('');
    const sp = M.Map.spawn, gate = foot(50, 14);
    P.set(sp.x, sp.y, D.RIGHT, false); setCam(st, sp.x + 40, sp.y, 1.1); st.warm = 0.1; st.birdsOn = true; st.birdOrg = { x: 12 * T, y: 6 * T }; st.amb = { forest: 0.2, wind: 0.05 };
    yield fade(0, 1.0); yield cap('Jalan tanah menuju Desa Rimba Asri');
    const pts = path(sp, gate); st.follow = P;
    yield par(walk(P, pts, 66), sub(function* () {
      yield wait(1.2); yield say('', 'Suatu pagi, kabar datang: Desa Rimba Asri mencari seorang penjaga hutan.');
      yield say('', 'Perjalanan menyusuri jalan tanah, menyeberangi jembatan kayu di atas sungai.'); st.amb = { forest: 0.12, wind: 0.05, water: 0.18 };
      yield wait(2.5); yield cap('Gerbang Desa Rimba Asri'); st.amb = { village: 0.2, forest: 0.08 };
      yield say('', 'Di seberang sungai, atap rumah warga mulai terlihat di antara pepohonan. Jalan desa berjajar rapi menuju plaza.'); }));
    P.set(gate.x, gate.y, D.UP, false); st.follow = null; st.birdsOn = false;
    /* 4. pertemuan dengan Pak Lurah */
    yield camGo(50 * T, 12 * T, 1.3, 2.2); yield cap('Plaza Desa Rimba Asri'); st.amb = { village: 0.22, crowd: 0.1 };
    yield par(walk(lurah, path(poiHome('lurah'), foot(50, 12)), 40), sub(function* () { yield wait(0.6); yield say('', 'Di plaza, Pak Lurah sudah menunggu.'); }));
    P.set(gate.x, gate.y, D.UP, false);
    yield say('Pak Lurah', 'Selamat datang di Desa Rimba Asri. Kamu ' + nm + ', bukan? Kabar tentang kepedulianmu pada hutan sudah sampai ke sini.');
    yield say(nm, 'Terima kasih, Pak Lurah. Saya ingin membantu menjaga hutan dan warga.');
    yield say('Pak Lurah', 'Tiap kemarau hutan kita makin kering. Satu puntung rokok atau api unggun yang lupa dimatikan bisa menjadi kebakaran besar, apalagi di lahan gambut.');
    yield say('Pak Lurah', 'Asapnya masuk ke rumah, sekolah, dan paru-paru anak-anak. Bantuan dari kota sering datang terlambat.');
    yield say('Pak Lurah', 'Karena itu desa membutuhkan penjaga hutan: yang berpatroli, mengajak warga waspada, dan melapor dengan benar saat ada tanda bahaya.');
    yield say(nm, 'Saya siap. Saya akan belajar dan bekerja dengan sungguh-sungguh.');
    /* 5. pengangkatan: Pak Lurah membuka Balai Desa (pintu tetap terbuka sesudahnya) */
    const door = foot(53, 11); yield camGo(53 * T, 10 * T, 1.3, 1.6);
    yield say('Pak Lurah', 'Tunggu sebentar. Perlengkapan untukmu ada di Balai Desa.');
    yield walk(lurah, path(foot(50, 12), door), 42); lurah.set(door.x, door.y, D.UP, false);
    yield call(() => { M.Map.doorFx = 'half'; A().cutPlay('whoosh', { gain: 0.2 }); }); yield wait(0.5);
    yield call(() => { M.WorldState.apply('hall_door_open'); M.Map.doorFx = null; A().sfx('open'); }); yield wait(0.5);
    let at = 0; yield { tick(dt) { at += dt; lurah.set(door.x, door.y - lerp(0, 12, at / 0.8), D.UP, true, 1 - clamp(at / 0.8, 0, 1)); return at >= 0.8; } };
    yield wait(1.4); at = 0; yield { tick(dt) { at += dt; lurah.set(door.x, door.y - lerp(12, 0, at / 0.8), D.DOWN, true, clamp(at / 0.8, 0, 1)); return at >= 0.8; } };
    yield walk(lurah, path(door, foot(50, 12)), 42); lurah.set(50 * T + 8, 12 * T + 14, D.DOWN, false);
    yield camGo(49 * T, 12 * T, 1.25, 1.5); yield wait(0.6);
    yield say('Pak Lurah', 'Atas nama warga Desa Rimba Asri, saya serahkan perlengkapan ini kepadamu.'); yield gearCard(); yield wait(2.8);
    yield say('Pak Lurah', 'Mulai hari ini, kamu resmi menjadi Penjaga Hutan Desa Rimba Asri.');
    yield hideCards(); yield camGo(48 * T, 13 * T, 1.0, 1.6);
    cheer.forEach(c => { const h = poiHome(c.id); c.set(h.x, h.y, D.DOWN, true); }); yield sfx('chime', 0.35);
    yield say('', 'Warga dan petugas bertepuk tangan menyambutnya.', { hold: 2.2 }); cheer.forEach(c => c.clear());
    yield say('Pak Lurah', 'Hutan adalah sumber air, udara bersih, dan penghidupan kita. Kamu akan menjadi yang terdepan menjaganya, bersama kami semua.');
    yield say(nm, 'Saya berjanji akan menjaga hutan dan warga desa ini.');
    yield say('Pak Lurah', 'Pos jaga hutan ada di sisi barat, dekat sungai. Petugas Rimba menunggumu di sana. Jangan pernah mendekati api sendirian.');
    /* 6. awal pekerjaan: lokasi kerja sungguhan di gameplay */
    yield fade(1, 1.0); yield cap(''); st.amb = { forest: 0.2, wind: 0.05 }; lurah.clear(); M.Map.doorFx = null;
    M.Player.reset(); const P0 = M.Player.state; P.set(P0.x, P0.y, D.RIGHT, false); setCam(st, 7 * T, 11 * T, 1.25); st.warm = 0.12;
    yield fade(0, 1.2); yield cap('Pos Jaga Hutan');
    yield say('', 'Keesokan paginya, hari pertamamu sebagai Penjaga Hutan dimulai.');
    yield say('Petugas Rimba', 'Kamu sudah sampai! Selamat bergabung. Di sinilah kita memulai: mengenali hutan, mewaspadai api, dan menjaga warga.');
    yield say('Petugas Rimba', 'Misi pertamamu sudah menunggu. Bicaralah denganku untuk briefing.');
    yield fade(1, 0.9); st.end = true;
  }
  Cs.define('intro', {
    manual: true, total: 0, caps: [], skipAfter: M.C.INTRO_SKIP_AFTER || 1.5,
    init(o) { const P = M.Player.state, st = newSt(o, { cam: { x: P.x, y: P.y, z: 1 }, hazeGo: false, dig: false, replay: !!o.replay, saved: { x: P.x, y: P.y, dir: P.dir } }); st.r = runner(introScript, st); $('cine').classList.add('manual'); return st; },
    cam: (t, st) => ({ x: st.cam.x, y: st.cam.y, z: st.cam.z }),
    update(t, dt, st) { if (st.hazeGo) st.haze = Math.min(0.32, st.haze + dt * 0.05); baseUpdate(t, dt, st); if (st.dig) { M.Player.state.frame = Math.floor(t * 3) % 2 ? 1 : 3; } },
    entities: entitiesOf, audio: baseAudio,
    drawFx(ctx, cx, cy, tm, st) { drawBirds(ctx, cx, cy, tm, st); tint(ctx, st); },
    onSkip(st) { st.stop = true; Say.hide(); },
    cleanup(st) { finalizeIntro(st); $('cine').classList.remove('manual'); }
  });

  /* =================== ENDING: inspeksi, hutan terselamatkan, warga pulang, perayaan =================== */
  function finalizeEnding() {
    M.WorldState.apply('ending_complete'); M.Evac.recover(); M.Map.applyStates();
    const P = M.Player.state, e = foot(50, 15); P.x = e.x; P.y = e.y; P.dir = D.DOWN; P.vx = P.vy = 0; P.frame = 0;
    ['cine-banner', 'cine-gear'].forEach(i => { const b = $(i); if (b) { b.hidden = true; b.classList.remove('on'); } }); Say.hide();
  }
  function* endingScript(st) {
    const P = pEnt(), F = M.Final.fireCenter(), nm = M.Final.P.name || 'Penjaga Hutan', lurah = nEnt('lurah');
    st.fade = 1; st.amb = { forest: 0.1, wind: 0.1 };
    /* A. inspeksi area terbakar dari jarak aman */
    const start = foot(50, 9), full = path(start, { x: F.x + 34, y: F.y + 104 });
    let acc = 0, cut = 0; for (let i = full.length - 1; i > 0 && acc < 80; i--) { acc += Math.hypot(full[i].x - full[i - 1].x, full[i].y - full[i - 1].y); cut = i - 1; }
    const trim = full.slice(cut), end = trim[trim.length - 1], rng = xEnt(st, 'officer'), fl = [0, 1, 2].map(i => xEnt(st, 'fighter', i));
    fl.forEach((f, i) => { const a = (68 + i * 30) * Math.PI / 180, q = M.Map.findPath(end.x, end.y, F.x + Math.cos(a) * 108, F.y + Math.sin(a) * 108 + 10, { startAnywhere: true }) || [end]; const e = q[q.length - 1]; f.set(e.x, e.y, D.UP, false); });
    const t0 = trim[0]; P.set(t0.x, t0.y, D.UP, false); rng.set(t0.x - 14, t0.y + 8, D.UP, false); setCam(st, F.x, F.y + 70, 1.2); st.smoke = 1;
    yield fade(0, 1.4); yield cap('Hutan Utara: bekas kebakaran');
    yield par(walk(P, trim, 40), walk(rng, trim.map(p => ({ x: p.x - 14, y: p.y + 8 })), 40), sub(function* () {
      yield wait(0.8); yield say('Petugas Rimba', 'Api terakhir sudah padam. Tim pemadam, periksa sekali lagi titik panasnya. Kita tetap menjaga jarak aman.');
      st.smokeFade = true; yield say('Petugas Pemadam', 'Siap. Tidak ada lagi titik api maupun bara yang menyala, Pak. Asapnya juga sudah menipis.'); }));
    P.set(end.x, end.y, D.UP, false); rng.set(end.x - 14, end.y + 8, D.UP, false); st.smokeFade = true;
    yield say(nm, 'Tanahnya hangus dan pohon-pohon menghitam… tetapi hutan ini akan tumbuh lagi.');
    yield say('Petugas Rimba', 'Benar. Dampaknya akan terlihat bertahun-tahun, karena itu pencegahan jauh lebih baik daripada pemadaman.');
    /* B. hutan yang terselamatkan */
    yield fade(1, 0.9); yield cap(''); st.smoke = 0; setCam(st, 14 * T, 7 * T, 1); st.birdsOn = true; st.birdOrg = { x: 20 * T, y: 3 * T }; st.amb = { forest: 0.22, wind: 0.05 };
    st.extra.forEach(e => { e.vis = false; });
    yield fade(0, 1.0); yield sfx('bird', 0.4); yield camGo(56 * T, 7 * T, 1, 11); yield cap('Seluruh titik api padam'); st.sprout = 0.01;
    yield say('', 'Seluruh titik api di hutan kini padam. Asap menghilang dan langit kembali biru.');
    yield say('', 'Hutan terselamatkan berkat kerja sama petugas, relawan, dan warga yang tetap tenang.');
    /* C. warga kembali ke rumah */
    yield fade(1, 0.9); st.birdsOn = false; yield cap(''); st.sprout = 0; st.amb = { village: 0.2, crowd: 0.12 };
    setCam(st, 50 * T, 31 * T, 1.15);
    const movers = M.Evac.MOVERS, ents = movers.map(id => ({ id, e: nEnt(id) }));
    ents.forEach(o => { const q = M.Evac.actors[o.id]; if (q) o.e.set(q.x, q.y, D.DOWN, false); });
    yield fade(0, 1.0); yield cap('Titik Kumpul Desa');
    yield say('Petugas Posko', 'Perhatian, seluruh warga! Api sudah padam dan kondisi aman. Keadaan darurat dicabut, bapak dan ibu boleh kembali ke rumah.');
    yield say('Mbah Karsi', 'Alhamdulillah… terima kasih, semuanya.');
    const walkers = ents.map((o, i) => { const q = M.Evac.actors[o.id], h = M.Evac.homeOf(o.id); const pts = M.Map.findPath(q.x, q.y, h.x, h.y, { startAnywhere: true }) || [{ x: q.x, y: q.y }, h]; return walk(o.e, pts, o.id === 'v_mbah' ? 30 : o.id === 'v_anak' ? 38 : 42 + (i % 3) * 3); });
    st.amb = { village: 0.2, crowd: 0.18 }; yield sfx('whoosh', 0.2);
    yield par(...walkers.map((w, i) => sub(function* () { yield wait(i * 0.35); yield w; })), sub(function* () { yield wait(1.0); yield camGo(49 * T, 20 * T, 1.0, 9); yield say('', 'Satu per satu warga pulang. Jalan desa kembali ramai, jendela rumah dibuka, dan posko darurat dibongkar.', { hold: 3 }); }));
    yield call(() => { M.Evac.recover(); ents.forEach(o => o.e.clear()); });
    /* D. perayaan */
    yield fade(1, 0.9); yield cap('');
    const pa = foot(50, 15), pb = foot(49, 15); P.set(pa.x, pa.y, D.DOWN, false); const rg = xEnt(st, 'officer'); rg.set(pb.x, pb.y, D.DOWN, false);
    const hoppers = ['v1', 'v2', 'v3', 'v4', 'v5', 'e_officer'].map(nEnt);
    setCam(st, 49 * T, 13 * T, 1.15); st.warm = 0.1; st.amb = { village: 0.2, crowd: 0.1 };
    yield fade(0, 1.0); yield cap('Plaza Desa Rimba Asri');
    yield walk(lurah, path(poiHome('lurah'), foot(49, 13)), 42); lurah.set(49 * T + 8, 13 * T + 14, D.DOWN, false);
    yield say('Pak Lurah', 'Terima kasih, Penjaga Hutan. Berkat kamu, petugas, dan seluruh warga, hutan dan desa kita selamat.');
    st.hop = true; rg.hop = true; hoppers.forEach(h => { const q = poiHome(h.id); h.set(q.x, q.y, D.DOWN, true); }); lurah.set(49 * T + 8, 13 * T + 14, D.DOWN, true);
    yield banner('OPERASI PEMADAMAN BERHASIL', 'Hutan terselamatkan. Desa kembali pulih.'); yield wait(4);
    st.hop = false; rg.hop = false; P.set(pa.x, pa.y, D.DOWN, false); hoppers.forEach(h => h.clear()); lurah.set(49 * T + 8, 13 * T + 14, D.DOWN, false);
    yield say(nm, 'Pekerjaan kita belum selesai. Menjaga hutan berarti mencegah, mengingatkan, dan mengajak semua orang peduli.');
    yield say('Petugas Rimba', 'Betul. Bumi Kalimantan butuh penjaga seperti kamu. Selamat bertugas.');
    yield fade(1, 1.0); lurah.clear(); st.end = true;
  }
  Cs.define('ending', {
    manual: true, total: 0, caps: [], skipAfter: 2,
    init(o) { const st = newSt(o, { smoke: 0, smokeFade: false, sprout: 0, hop: false }); st.r = runner(endingScript, st); $('cine').classList.add('manual'); return st; },
    cam: (t, st) => ({ x: st.cam.x, y: st.cam.y, z: st.cam.z }),
    update(t, dt, st) { if (st.smokeFade) st.smoke = Math.max(0, st.smoke - dt / 7); if (st.sprout > 0) st.sprout = Math.min(1, st.sprout + dt / 5); baseUpdate(t, dt, st); if (st.hop) M.Player.state.frame = Math.floor(t * 4) % 2 ? 1 : 3; },
    entities: entitiesOf, audio: baseAudio,
    drawFx(ctx, cx, cy, tm, st) {
      const F = M.Final.fireCenter(); wisps(ctx, F, tm, cx, cy, st.smoke); drawBirds(ctx, cx, cy, tm, st);
      if (st.sprout > 0) { ctx.globalAlpha = st.sprout; for (let i = 0; i < 9; i++) ctx.drawImage(S().sapling, Math.round(F.x - 80 + i * 20 - cx), Math.round(F.y + 20 + (i * 17) % 40 - cy)); ctx.globalAlpha = 1; }
      tint(ctx, st);
    },
    onSkip(st) { st.stop = true; Say.hide(); },
    cleanup(st) { finalizeEnding(); $('cine').classList.remove('manual'); }
  });

  /* =================== pemicu & UI =================== */
  let replayQ = false;
  function tick() {
    if (replayQ && M.Game.running && !M.Game.frozen && !Cs.active && M.Dialog.canOpen() && !M.UI.panelOpen() && !M.UI.evalOpen()) { replayQ = false; Cs.play('intro', { replay: true }); return; }
    if (M.C.INTRO_ENABLED === false || M.WorldState.introDone() || M.WorldState.locked) return;
    if (!M.Game.running || M.Game.frozen || Cs.active || !M.Dialog.canOpen() || M.Dialog.isOpen() || M.UI.evalOpen() || M.UI.panelOpen() || !M.Final.P.name) return;
    Cs.play('intro', {});
  }
  const replayIntro = () => { replayQ = true; return true; };
  function init() {
    const sp = $('say-spd'), nx = $('say-next'), box = $('cine-say'); if (!sp) return; setMode(mode);
    sp.addEventListener('click', e => { e.stopPropagation(); Say.cycle(); }); nx.addEventListener('click', e => { e.stopPropagation(); Say.advance(); }); box.addEventListener('click', () => Say.advance());
    const U = M.UI, oT = U.tick; U.tick = () => { tick(); oT(); };      // cerita pembuka lebih dulu daripada briefing misi 1
    const oM = U.refreshMenu; U.refreshMenu = () => { oM(); const g = $('menu-gear'); if (g) { const l = M.WorldState.gear().map(k => M.WorldState.GEAR[k]); g.textContent = l.length ? 'Perlengkapan: ' + l.join(', ') : ''; } };
    M.WorldState.onChange(ev => { if (ev.type !== 'villager') M.Map.applyStates(); });
  }
  const key = () => { if (!Cs.manual) return false; Say.advance(); return true; };
  M.Story = { init, Say, replayIntro, key, tick, runner, steps: { wait, fade, camTo, say, walk, par, sub, call } };
})(window.MPH);
