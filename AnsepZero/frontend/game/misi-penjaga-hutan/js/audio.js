/* Audio v0.5² (dasar v0.4³) — mesin suara ringan.
   v0.5²: keseimbangan volume baru (SFX diperkuat + limiter, BGM diturunkan), suara NPC = blip pendek WAV satu kanal tanpa tumpukan,
         SFX cutscene (loop/sekali putar, satu instance per nama), ducking BGM, dan peralihan musik tegang yang halus.
   SFX : disintesis langsung dengan WebAudio (tanpa file, tanpa decode, tanpa memori tambahan). Satu AudioContext, satu node volume,
         batas suara bersamaan (MAX_VOICES), jeda minimum per jenis suara (cd), semua node dilepas saat selesai (tidak bocor).
   BGM : SATU elemen <audio> (streaming, tidak didecode ke memori), dibuat malas saat pertama dibutuhkan, loop, tidak pernah dobel.
         Berjalan hanya saat gameplay; pause/menu = fade-out lalu pause, resume = lanjut dari posisi yang sama.
   Pengaturan (mute, BGM/SFX on-off, volume) disimpan di localStorage kunci 'mph.audio' (terpisah dari save progres 'mph.save').
   Semua fungsi publik aman dipanggil kapan saja: tidak pernah melempar galat; bila audio gagal, game tetap berjalan. */
(function (M) {
  'use strict';
  const KEY = 'mph.audio', MAX_VOICES = 12;
  const OLD_DEF = { bgmVol: 0.5, sfxVol: 0.8 }, VER = 2;          // v0.5²: bawaan baru; pengaturan lama yang masih bawaan lama (belum pernah diubah) dimigrasikan
  const DEF = { muted: false, bgmOn: true, sfxOn: true, bgmVol: 0.35, sfxVol: 0.85 };
  const set = Object.assign({}, DEF), listeners = [], lastAt = {};
  let ctx = null, sfxGain = null, limiter = null, out = null, noiseBuf = null, voices = 0, gestureSeen = false, primed = false, ctxFailed = false, dirty = false;
  const nowMs = () => performance.now();
  const clamp01 = v => { v = Number(v); return isFinite(v) ? Math.max(0, Math.min(1, v)) : 0; };
  const curve = v => v * v;                                   // kurva volume yang lebih sesuai dengan telinga
  const sfxLevel = () => curve(set.sfxVol) * (M.C.SFX_BOOST || 1);

  /* ---------- pengaturan tersimpan ---------- */
  (function load() {
    const raw = M.Store.get(KEY); if (!raw) return;
    try {
      const o = JSON.parse(raw); if (!o || typeof o !== 'object') return;
      ['muted', 'bgmOn', 'sfxOn'].forEach(k => { if (typeof o[k] === 'boolean') set[k] = o[k]; });
      ['bgmVol', 'sfxVol'].forEach(k => { if (typeof o[k] === 'number') set[k] = clamp01(o[k]); });
      if (o.ver !== VER) ['bgmVol', 'sfxVol'].forEach(k => { if (typeof o[k] === 'number' && Math.abs(o[k] - OLD_DEF[k]) < 1e-9) set[k] = DEF[k]; });   // hanya nilai bawaan lama yang diganti; pilihan pemain tetap
    } catch (e) { /* data rusak: pakai bawaan */ }
  })();
  function save() { dirty = false; return M.Store.set(KEY, JSON.stringify(Object.assign({ ver: VER }, set))); }
  const flush = () => { if (dirty) save(); };
  const emit = () => listeners.slice().forEach(f => { try { f(); } catch (e) { console.error(e); } });

  /* ---------- konteks SFX ---------- */
  function makeCtx() {
    if (ctx || ctxFailed) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { ctxFailed = true; return null; }
    try {
      ctx = new AC(); sfxGain = ctx.createGain(); sfxGain.gain.value = sfxLevel();
      try { limiter = ctx.createDynamicsCompressor(); limiter.threshold.value = -9; limiter.knee.value = 4; limiter.ratio.value = 18; limiter.attack.value = 0.002; limiter.release.value = 0.12; sfxGain.connect(limiter); limiter.connect(ctx.destination); }   // limiter: SFX diperkuat tanpa pecah
      catch (e2) { limiter = null; sfxGain.connect(ctx.destination); }
      out = sfxGain;
    } catch (e) { ctx = null; sfxGain = null; limiter = null; out = null; ctxFailed = true; }
    return ctx;
  }
  const tryResume = c => { try { const p = c.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* abaikan */ } };
  /* Gerakan pengguna pertama (ketuk/klik/tombol): buka kunci audio. Dipasang sekali, murah (hanya cek flag). */
  function onGesture() {
    gestureSeen = true;
    if (!set.muted && set.sfxOn) {
      const c = makeCtx();
      if (c) {
        if (c.state === 'suspended') tryResume(c);
        if (!primed) { primed = true; npcLoad(c); try { const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0); } catch (e) { /* abaikan */ } }
      }
    }
    if (blocked && (wantBgm || previewBgm)) applyBgm();       // coba lagi musik yang tadi ditolak browser
  }
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(t => addEventListener(t, onGesture, { capture: true, passive: true }));

  /* ---------- pembangkit suara ---------- */
  function osc(c, t, type, f0, f1, dur, vol, atk) {
    if (voices >= MAX_VOICES || !out) return;
    const o = c.createOscillator(), g = c.createGain(); atk = atk || 0.005;
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); voices++;
    o.onended = () => { voices--; try { o.disconnect(); g.disconnect(); } catch (e) { /* abaikan */ } };
    o.start(t); o.stop(t + dur + 0.03);
  }
  function noise(c, t, dur, vol, ftype, freq, q) {
    if (voices >= MAX_VOICES || !out) return;
    if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
      const n = Math.floor(c.sampleRate * 0.15), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; noiseBuf = b;
    }
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noiseBuf; f.type = ftype; f.frequency.value = freq; f.Q.value = q || 0.7;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out); voices++;
    s.onended = () => { voices--; try { s.disconnect(); f.disconnect(); g.disconnect(); } catch (e) { /* abaikan */ } };
    s.start(t, Math.random() * 0.04); s.stop(t + dur + 0.02);
  }
  const R = (a, b) => a + Math.random() * (b - a);

  /* cd = jeda minimum (ms) antar pemutaran jenis yang sama -> tidak pernah menumpuk atau berulang tiap frame */
  const DEFS = {
    step:      { cd: 140, f(c, t, surf) {                        // surf = jenis petak (M.T): jembatan kayu / tanah / rumput
      if (surf === M.T.BRIDGE) { noise(c, t, 0.05, 0.3, 'bandpass', R(1200, 1500), 1.2); osc(c, t, 'triangle', R(180, 205), 120, 0.07, 0.22); }
      else if (surf === M.T.DIRT) noise(c, t, 0.07, 0.64, 'lowpass', R(850, 1000), 0.7);
      else noise(c, t, 0.06, 0.5, 'lowpass', R(620, 820), 0.6); } },
    ui:        { cd: 60,  f(c, t) { osc(c, t, 'square', 880, 660, 0.05, 0.11); } },
    open:      { cd: 90,  f(c, t) { osc(c, t, 'triangle', 523, 659, 0.08, 0.22); osc(c, t + 0.07, 'triangle', 784, 784, 0.1, 0.2); } },
    close:     { cd: 90,  f(c, t) { osc(c, t, 'triangle', 659, 523, 0.08, 0.22); osc(c, t + 0.07, 'triangle', 392, 392, 0.1, 0.2); } },
    dlgOpen:   { cd: 120, f(c, t) { osc(c, t, 'triangle', 440, 587, 0.09, 0.22); osc(c, t + 0.08, 'triangle', 587, 740, 0.1, 0.2); } },
    dlgClose:  { cd: 120, f(c, t) { osc(c, t, 'triangle', 740, 587, 0.08, 0.2); osc(c, t + 0.07, 'triangle', 587, 392, 0.1, 0.2); } },
    interact:  { cd: 120, f(c, t) { osc(c, t, 'sine', 620, 940, 0.09, 0.3); osc(c, t, 'triangle', 1240, 1240, 0.04, 0.07); } },
    select:    { cd: 70,  f(c, t) { osc(c, t, 'triangle', 500, 640, 0.06, 0.24); } },
    /* suara dialog: 3 "blip" pendek bernada rendah (bukan suara manusia); tinggi nada tetap per pembicara (seed dari nama) */
    talk:      { cd: 220, f(c, t, seed) {
      const base = 170 + ((seed | 0) % 8) * 24;
      for (let i = 0; i < 3; i++) { const fr = base * (i === 1 ? 1.14 : 1) * R(0.96, 1.04); osc(c, t + i * 0.07, 'square', fr, fr * 0.97, 0.05, 0.09); } } },
    correct:   { cd: 150, f(c, t) { [523, 659, 784].forEach((fr, i) => osc(c, t + i * 0.08, 'square', fr, fr, 0.12, 0.12)); osc(c, t + 0.24, 'triangle', 1047, 1047, 0.2, 0.18); } },
    wrong:     { cd: 200, f(c, t) { osc(c, t, 'sawtooth', 220, 160, 0.16, 0.16); osc(c, t + 0.14, 'sawtooth', 165, 110, 0.24, 0.16); } },
    reward:    { cd: 120, f(c, t) { osc(c, t, 'square', 988, 988, 0.06, 0.15); osc(c, t + 0.06, 'square', 1319, 1319, 0.16, 0.15); } },
    mission:   { cd: 400, f(c, t) { [523, 659, 784, 1047].forEach((fr, i) => osc(c, t + i * 0.1, 'square', fr, fr, 0.13, 0.11));
      [784, 1047, 1319].forEach(fr => osc(c, t + 0.4, 'triangle', fr, fr, 0.55, 0.14)); } },
    newMission:{ cd: 300, f(c, t) { osc(c, t, 'triangle', 392, 392, 0.09, 0.22); osc(c, t + 0.09, 'triangle', 523, 523, 0.09, 0.22); osc(c, t + 0.18, 'triangle', 659, 659, 0.18, 0.22); } },
    chapter:   { cd: 500, f(c, t) { [392, 494, 587, 784].forEach((fr, i) => osc(c, t + i * 0.13, 'triangle', fr, fr, 0.18, 0.22));
      [784, 988].forEach(fr => osc(c, t + 0.52, 'triangle', fr, fr, 0.6, 0.18)); } },
    pause:     { cd: 200, f(c, t) { osc(c, t, 'sine', 660, 330, 0.14, 0.24); } },
    resume:    { cd: 200, f(c, t) { osc(c, t, 'sine', 330, 660, 0.14, 0.24); } }
  };

  /* Putar satu SFX. opts: {delay: detik, arg}. Mengembalikan true bila benar-benar dijadwalkan. */
  function sfx(name, opts) {
    try {
      const def = DEFS[name];
      if (!def || set.muted || !set.sfxOn || !gestureSeen || document.hidden) return false;
      const t = nowMs(); if (t - (lastAt[name] || -1e9) < def.cd) return false;
      const c = makeCtx(); if (!c) return false;
      if (c.state !== 'running') { tryResume(c); return false; }     // belum aktif: jangan menumpuk jadwal suara lama
      lastAt[name] = t;
      def.f(c, c.currentTime + 0.005 + ((opts && opts.delay) || 0), opts && opts.arg);
      return true;
    } catch (e) { return false; }
  }
  const recent = (name, ms) => nowMs() - (lastAt[name] || -1e9) < ms;
  const hash = s => { let h = 7; s = String(s || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  const step = surf => sfx('step', { arg: surf });
  const talk = who => sfx('talk', { arg: hash(who) });

  /* ---------- v0.5²: suara NPC ----------
     Bawaan: rangkaian blip WAV pendek, DIJADWALKAN di timeline WebAudio (sampel-akurat). Satu kanal: npcStop() menghentikan semua blip terjadwal sebelum rangkaian baru;
     jarak antar-blip >= durasi blip (tidak pernah bertumpuk) dan tidak ada pemutaran per-frame (hanya dipanggil dialog sekali per halaman).
     Jika M.C.NPC_SFX.userFiles diisi: file milik pemain dipakai sebagai pengganti (satu elemen <audio>, diputar sekali per halaman, dipotong userMaxMs). */
  const NB = { bufs: [], state: 'idle', srcs: [], last: 0, endT: null, playing: false };
  const NV = { el: null, idx: 0, failed: false, stopT: null, playing: false };
  const npcCfg = () => M.C.NPC_SFX || {}, userFile = () => (npcCfg().userFiles || [])[NV.idx];
  function npcLoad(c) {
    if (NB.state !== 'idle') return; const files = npcCfg().files || [];
    if (!c || !files.length || typeof fetch !== 'function') { NB.state = 'failed'; return; }
    NB.state = 'loading';
    Promise.all(files.map(f => fetch(f).then(r => { if (!r.ok) throw new Error('http'); return r.arrayBuffer(); })
      .then(buf => new Promise((res, rej) => { try { const p = c.decodeAudioData(buf, res, rej); if (p && p.catch) p.catch(rej); } catch (e) { rej(e); } })).catch(() => null)))
      .then(a => { NB.bufs = a.filter(Boolean); NB.state = NB.bufs.length ? 'ready' : 'failed'; }).catch(() => { NB.state = 'failed'; });   // gagal (mis. file:// atau file hilang) -> blip sintesis lama
  }
  function npcStopBlips() {
    clearTimeout(NB.endT); NB.endT = null;
    NB.srcs.splice(0).forEach(o => { try { o.src.onended = null; o.src.stop(); o.src.disconnect(); o.g.disconnect(); } catch (e) { /* abaikan */ } });
    NB.playing = false;
  }
  function npcBlips(who, text) {
    const c = npcCfg(), cx = makeCtx(); if (!cx || !out || !NB.bufs.length) return false;
    if (cx.state !== 'running') { tryResume(cx); return false; }
    npcStopBlips(); NB.last = nowMs();
    const len = String(text || '').length, n = Math.max(c.minBlips || 2, Math.min(c.maxBlips || 7, Math.round(len / (c.charsPerBlip || 9)))), seed = hash(who);
    const rate = 0.84 + (seed % 9) * 0.05, step = (c.blipMs || 105) / 1000, vol = c.volume == null ? 0.55 : c.volume; let t = cx.currentTime + 0.01;
    for (let i = 0; i < n; i++) {
      const buf = NB.bufs[(seed + i * 5 + (len >> 2)) % NB.bufs.length], r = rate * (1 + (((seed >> 3) + i * 7) % 7 - 3) * 0.015);
      const src = cx.createBufferSource(), g = cx.createGain(); src.buffer = buf; src.playbackRate.value = r; g.gain.value = vol * (i === n - 1 ? 0.75 : 1);
      src.connect(g); g.connect(out); const o = { src, g }; NB.srcs.push(o);
      src.onended = () => { const k = NB.srcs.indexOf(o); if (k >= 0) NB.srcs.splice(k, 1); try { src.disconnect(); g.disconnect(); } catch (e) { /* abaikan */ } };
      src.start(t); t += Math.max(step, buf.duration / r + 0.015);                // blip berikutnya baru mulai setelah blip ini selesai
    }
    NB.playing = true; NB.endT = setTimeout(() => { NB.playing = false; NB.endT = null; }, Math.ceil((t - cx.currentTime) * 1000) + 30);
    return true;
  }
  /* ---- jalur file milik pemain (userFiles) ---- */
  function userAdvance(from) { if (NV.idx !== from || NV.failed) return; NV.idx++; NV.playing = false; if (userFile() && NV.el) { try { NV.el.src = userFile(); } catch (e) { NV.failed = true; } } else NV.failed = true; }
  function userEl() {
    if (NV.el || NV.failed) return NV.el;
    if (!userFile()) { NV.failed = true; return null; }
    try { const e = new Audio(); e.preload = 'auto'; e.addEventListener('error', () => userAdvance(NV.idx)); e.src = userFile(); NV.el = e; } catch (x) { NV.failed = true; }
    return NV.el;
  }
  function userStop() { clearTimeout(NV.stopT); NV.stopT = null; if (NV.el && NV.playing) { try { NV.el.pause(); NV.el.currentTime = 0; } catch (e) { /* abaikan */ } } NV.playing = false; }
  function voiceUser(who) {
    const c = npcCfg(), e = userEl(); if (!e || NV.failed) return false;
    const t = nowMs(); if (t - NB.last < (c.cooldownMs || 120)) return false;
    userStop(); NB.last = t; e.volume = Math.max(0, Math.min(1, sfxLevel() * (c.volume == null ? 0.55 : c.volume))); try { e.currentTime = 0; } catch (x) { /* abaikan */ }
    let p; try { p = e.play(); } catch (x) { p = null; return false; }
    const at = NV.idx; NV.playing = true; if (p && p.catch) p.catch(err => { NV.playing = false; if (err && err.name !== 'NotAllowedError' && err.name !== 'AbortError') userAdvance(at); });
    NV.stopT = setTimeout(userStop, c.userMaxMs || 1800); return true;
  }
  function npcStop() { npcStopBlips(); userStop(); }
  function isNpc(name) { return !!(M.World && M.World.pois.some(p => p.kind === 'npc' && p.name === name)); }
  /* Dipanggil dialog tiap halaman: NPC = blip WAV (atau file pemain); selain NPC / aset gagal = blip sintesis lama. */
  function voice(who, text) {
    try {
      if (!isNpc(who)) { npcStop(); return talk(who); }
      if (set.muted || !set.sfxOn || !gestureSeen || document.hidden) { npcStop(); return false; }
      const c = npcCfg(); if ((c.userFiles || []).length && !NV.failed) { npcStopBlips(); if (voiceUser(who)) return true; }
      const t = nowMs(); if (t - NB.last < (c.cooldownMs || 120)) return false;
      if (NB.state === 'idle') { const x = makeCtx(); if (x) npcLoad(x); }
      if (NB.state !== 'ready') return talk(who);
      return npcBlips(who, text);
    } catch (e) { return false; }
  }

  /* ---------- v0.5²: SFX cutscene (loop / sekali putar) ----------
     Satu instance per nama (memutar nama yang sama saat masih aktif hanya mengubah volumenya). Aset dimuat malas lewat cutPreload(). Semua berhenti bila mute/SFX OFF. */
  const CS = { bufs: {}, state: 'idle', active: {}, want: {} };
  function cutLoad() {
    if (CS.state !== 'idle') return; const c = makeCtx(), cfg = M.C.CUT_SFX || {}, files = cfg.files || {};
    if (!c || typeof fetch !== 'function') { if (ctxFailed || typeof fetch !== 'function') CS.state = 'failed'; return; }
    CS.state = 'loading';
    Promise.all(Object.keys(files).map(k => fetch((cfg.dir || '') + files[k]).then(r => { if (!r.ok) throw new Error('http'); return r.arrayBuffer(); })
      .then(buf => new Promise((res, rej) => { try { const p = c.decodeAudioData(buf, res, rej); if (p && p.catch) p.catch(rej); } catch (e) { rej(e); } }))
      .then(b => { CS.bufs[k] = b; }).catch(() => { /* aset ini gagal: cutscene tetap jalan tanpa bunyinya */ })))
      .then(() => { CS.state = 'ready'; Object.keys(CS.want).forEach(k => { const o = CS.want[k]; delete CS.want[k]; cutPlay(k, o); }); });
  }
  function cutPlay(name, o) {
    try {
      o = o || {}; if (set.muted || !set.sfxOn || !gestureSeen || document.hidden) return false;
      const c = makeCtx(); if (!c || !out) return false;
      if (c.state !== 'running') { tryResume(c); CS.want[name] = o; return false; }
      const gain = o.gain == null ? 0.6 : o.gain, a = CS.active[name];
      if (a) { a.g.gain.cancelScheduledValues(c.currentTime); a.g.gain.setTargetAtTime(gain, c.currentTime, (o.fade || 0.3) / 3); return true; }      // sudah aktif: jangan buat instance kedua
      if (CS.state === 'idle') cutLoad();
      const buf = CS.bufs[name]; if (!buf) { if (CS.state !== 'ready') CS.want[name] = o; return false; }
      const src = c.createBufferSource(), g = c.createGain(), now = c.currentTime;
      src.buffer = buf; src.loop = !!o.loop; g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(gain, now + (o.fade == null ? 0.15 : o.fade));
      src.connect(g); g.connect(out); const rec = { src, g }; CS.active[name] = rec;
      src.onended = () => { if (CS.active[name] === rec) delete CS.active[name]; try { src.disconnect(); g.disconnect(); } catch (e) { /* abaikan */ } };
      src.start(now + (o.delay || 0)); return true;
    } catch (e) { return false; }
  }
  function cutStop(name, fade) {
    delete CS.want[name]; const a = CS.active[name]; if (!a) return; delete CS.active[name];
    try { const c = ctx, now = c.currentTime, f = Math.max(0, fade == null ? 0.4 : fade); a.g.gain.cancelScheduledValues(now); a.g.gain.setValueAtTime(a.g.gain.value, now); a.g.gain.linearRampToValueAtTime(0, now + f); a.src.onended = () => { try { a.src.disconnect(); a.g.disconnect(); } catch (e) { /* abaikan */ } }; a.src.stop(now + f + 0.03); }
    catch (e) { try { a.src.stop(); } catch (x) { /* abaikan */ } }
  }
  function cutStopAll(fade) { CS.want = {}; Object.keys(CS.active).forEach(k => cutStop(k, fade)); }
  function cutPreload() { try { if (!set.muted && set.sfxOn && gestureSeen) cutLoad(); } catch (e) { /* abaikan */ } }
  const cutActive = () => Object.keys(CS.active);
  let duck = false;
  function setDuck(on) { on = !!on; if (on === duck) return; duck = on; if (el && !el.paused) fade('in', 700); }

  /* ---------- BGM ---------- */
  let tense = false, el = null, wantBgm = false, previewBgm = false, blocked = false, failed = false, pending = false, warned = false, fadeT = null;
  const bgmGain = () => curve(set.bgmVol) * (duck ? (M.C.BGM_DUCK == null ? 0.5 : M.C.BGM_DUCK) : 1);
  const bgmAllowed = () => !set.muted && set.bgmOn && !failed;
  const bgmWanted = () => (wantBgm || previewBgm) && bgmAllowed();
  function elOf() {
    if (el) return el;
    try {
      el = new Audio(); el.loop = true; el.preload = 'auto'; el.volume = 0;
      el.addEventListener('error', () => { failed = true; pending = false; stopFade(); emit(); });   // file hilang/rusak: game jalan terus tanpa musik
      el.addEventListener('playing', () => { blocked = false; pending = false; emit(); });
      el.src = tense && M.C.BGM_TENSE_FILE ? M.C.BGM_TENSE_FILE : M.C.BGM_FILE; applyRate(true);
    } catch (e) { el = null; failed = true; }
    return el;
  }
  /* v0.5²: laju musik tegang berubah bertahap (ramp) bila diminta, bukan melompat. */
  let curRate = 1, rateT = null;
  const rateTarget = () => tense && !M.C.BGM_TENSE_FILE ? (M.C.BGM_TENSE_RATE || 0.82) : 1;
  function putRate(r) { curRate = r; if (!el) return; try { el.playbackRate = r; el.preservesPitch = false; el.mozPreservesPitch = false; el.webkitPreservesPitch = false; } catch (e) { /* abaikan */ } }
  function applyRate(now) {
    const tg = rateTarget(); clearInterval(rateT); rateT = null;
    if (now || !el || Math.abs(tg - curRate) < 0.002) { putRate(tg); return; }
    rateT = setInterval(() => { const d = tg - curRate; if (Math.abs(d) < 0.006) { clearInterval(rateT); rateT = null; putRate(tg); } else putRate(curRate + Math.sign(d) * 0.006); }, 50);
  }
  function setTense(on, ramp) { on = !!on; if (on === tense) return; tense = on; if (M.C.BGM_TENSE_FILE && el) { const was = !el.paused; try { el.src = on ? M.C.BGM_TENSE_FILE : M.C.BGM_FILE; if (was) el.play().catch(() => {}); } catch (e) { /* abaikan */ } } applyRate(!ramp); }
  const setVol = v => { if (el) { try { el.volume = Math.max(0, Math.min(1, v)); } catch (e) { /* abaikan */ } } };
  function stopFade() { if (fadeT) { clearInterval(fadeT); fadeT = null; } }
  function fade(dir, ms, done) {                                // satu timer saja; fade baru membatalkan yang lama
    stopFade(); if (!el) { if (done) done(); return; }
    const from = el.volume, t0 = nowMs();
    fadeT = setInterval(() => {
      const k = Math.min(1, (nowMs() - t0) / ms);
      setVol(dir === 'in' ? from + (bgmGain() - from) * k : from * (1 - k));
      if (k >= 1) { stopFade(); if (done) done(); }
    }, 40);
  }
  function startBgm() {
    const e = elOf(); if (!e || failed) return;
    if (!e.paused) { fade('in', 400); return; }                 // sudah berjalan: jangan play() lagi (tidak ada instance ganda)
    if (pending) return; pending = true;
    let p; try { p = e.play(); } catch (err) { p = Promise.reject(err); }
    if (p && p.then) {
      p.then(() => { pending = false; blocked = false; if (bgmWanted()) fade('in', 700); else { try { e.pause(); } catch (x) { /* abaikan */ } } emit(); })
       .catch(err => {
         pending = false; if (err && err.name === 'AbortError') return;       // dihentikan sebelum sempat mulai: bukan galat
         if (err && err.name === 'NotAllowedError') { blocked = true; if (!warned) { warned = true; M.notify('Browser menahan musik otomatis. Ketuk layar atau tombol suara sekali untuk menyalakannya.'); } }
         else failed = true;
         emit();
       });
    } else { pending = false; fade('in', 700); }
  }
  function stopBgm() {
    if (!el) return;
    if (el.paused && !pending) { stopFade(); return; }
    fade('out', 350, () => { if (!bgmWanted()) { try { el.pause(); } catch (e) { /* abaikan */ } } });
  }
  function applyBgm() { try { if (bgmWanted()) startBgm(); else stopBgm(); } catch (e) { /* abaikan */ } }

  /* ---------- API pengaturan ---------- */
  function setMuted(m) { m = !!m; if (m === set.muted) return; set.muted = m; if (m) { npcStop(); cutStopAll(0.05); } save(); applyBgm(); emit(); }
  function setOn(kind, on) { set[kind === 'bgm' ? 'bgmOn' : 'sfxOn'] = !!on; if (kind !== 'bgm' && !on) { npcStop(); cutStopAll(0.05); } save(); if (kind === 'bgm') applyBgm(); emit(); }
  function setVolume(kind, v, commit) {
    v = clamp01(v);
    if (kind === 'bgm') { set.bgmVol = v; if (el && !el.paused && !fadeT) setVol(bgmGain()); }
    else { set.sfxVol = v; if (sfxGain) sfxGain.gain.value = sfxLevel(); }
    if (commit) save(); else dirty = true;
    emit();
  }
  const status = () => Object.assign({}, set, { bgmState: failed ? 'failed' : blocked ? 'blocked' : (el && !el.paused) ? 'playing' : 'idle', sfxReady: !!ctx && ctx.state === 'running', storage: M.Store.available });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    flush(); stopFade(); npcStop();
    if (el && !el.paused) { try { el.pause(); } catch (e) { /* abaikan */ } }
    if (ctx && ctx.state === 'running') { try { const p = ctx.suspend(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* abaikan */ } }
  });
  addEventListener('pagehide', flush);

  /* Alat uji (dipakai pengujian otomatis; tidak dipakai game): render satu SFX secara offline lalu ukur puncak & durasi. */
  async function renderTest(name, arg) {
    const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext, rate = 44100, oc = new OC(1, rate * 2, rate);
    const sOut = out, sNoise = noiseBuf, sVoices = voices, g = oc.createGain(); g.connect(oc.destination); out = g; noiseBuf = null; voices = 0;
    try { DEFS[name].f(oc, 0.01, arg); const d = (await oc.startRendering()).getChannelData(0); let peak = 0, sum = 0, last = 0;
      for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; sum += d[i] * d[i]; if (a > 0.001) last = i; }
      return { peak, rms: Math.sqrt(sum / d.length), endSec: last / rate }; }
    finally { out = sOut; noiseBuf = sNoise; voices = sVoices; }
  }

  M.Audio = {
    sfx, step, talk, recent, names: Object.keys(DEFS), voice, npcStop, setTense, duck: setDuck,
    cutPlay, cutStop, cutStopAll, cutPreload, cutActive,
    npcStatus: () => ({ state: NB.state, loaded: NB.bufs.length, playing: NB.playing || NV.playing, scheduled: NB.srcs.length, failed: NB.state === 'failed', user: (npcCfg().userFiles || []).length > 0 }),
    bgmStart() { wantBgm = true; applyBgm(); },
    bgmPause() { wantBgm = false; applyBgm(); },
    preview(on) { previewBgm = !!on; applyBgm(); },            // pratinjau musik saat panel pengaturan terbuka
    setMuted, toggleMute() { setMuted(!set.muted); }, setOn, setVolume, status,
    onChange(f) { listeners.push(f); },
    get settings() { return Object.assign({}, set); },
    _test: { renderTest, voices: () => voices, el: () => el, ctx: () => ctx, wanted: () => wantBgm, sfxGainValue: () => sfxGain ? sfxGain.gain.value : null, bgmTarget: () => bgmGain(), rate: () => curRate, ducked: () => duck, cutState: () => ({ state: CS.state, loaded: Object.keys(CS.bufs), active: Object.keys(CS.active) }), npcBlipCount: () => NB.srcs.length,
      /* penyadap level bus SFX (hanya untuk pengujian): peak/rms dari sinyal setelah limiter */
      tap: () => { const c = makeCtx(); if (!c || !sfxGain) return null; const an = c.createAnalyser(); an.fftSize = 2048; (limiter || sfxGain).connect(an); const d = new Float32Array(an.fftSize); return { read() { an.getFloatTimeDomainData(d); let pk = 0, sm = 0; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > pk) pk = a; sm += d[i] * d[i]; } return { peak: pk, rms: Math.sqrt(sm / d.length) }; } }; } }
  };
})(window.MPH);
