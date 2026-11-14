/* Mesin cutscene v0.5⁴ — dipakai cutscene Misi Terakhir (di sini) dan cutscene tiap bab (js/chapter_cutscenes.js).
   Sebuah cutscene = definisi {total, init, cam(t,st), update(t,dt,st), entities(list,st), drawFx(ctx,cx,cy,tm,st), caps, events, audio(t,au,st), cleanup(st), fireK(t)}.
   Mesin: membekukan player (Game.freeze), memakai kamera sinematik (Game.setCine), bar sinematik + teks + dip hitam, tombol Lewati (setelah CUT_SKIP_AFTER dtk),
   ducking BGM, SFX lewat M.Audio.cut* (satu instance per nama). Waktu berjalan di loop game (dt) sehingga berhenti sendiri saat Jeda; SFX dihentikan saat jeda.
   Posisi aktor = fungsi waktu di atas jalur BFS (Map.findPath) yang menghindari pohon/batu/air/objek — tidak ada aktor yang menembus objek.
   Cutscene Misi Terakhir (id 'final'): "Bantuan petugas pemadam tiba." Hanya dimulai oleh final.js setelah objective akhir selesai. */
(function (M) {
  'use strict';
  const $ = id => document.getElementById(id), A = () => M.Audio, S = () => M.Sprites, D = M.DIR, V = M.View, T = M.C.TILE;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u;
  const defs = {};
  const C = { active: false, id: '', def: null, st: null, t: 0, skipping: false, fadeA: 0, onEnd: null, fired: {}, audAcc: 9, cap: -1, replay: false };

  /* ---------- pustaka bantu untuk definisi ---------- */
  const poiC = id => { const p = M.World.byId[id]; return p ? M.World.center(p) : { x: 0, y: 0 }; };
  const dirOf = (dx, dy) => Math.abs(dx) > Math.abs(dy) * 1.2 ? (dx > 0 ? D.RIGHT : D.LEFT) : (dy > 0 ? D.DOWN : D.UP);
  function camPath(keys) {                     // keys: [{t, x, y, z}] dengan x/y angka atau fungsi
    const v = (k, a) => typeof k[a] === 'function' ? k[a]() : k[a];
    return t => {
      let i = 0; while (i < keys.length - 2 && t >= keys[i + 1].t) i++;
      const a = keys[i], b = keys[i + 1], u = ease((t - a.t) / (b.t - a.t));
      return { x: lerp(v(a, 'x'), v(b, 'x'), u), y: lerp(v(a, 'y'), v(b, 'y'), u), z: lerp(a.z || 1, b.z || 1, u) };
    };
  }
  /* Aktor berjalan: titik jalur (kaki, piksel) -> posisi pada waktu t. */
  function walker(pts, speed, t0) {
    const seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); seg.push(l); L += l; }
    const last = pts[pts.length - 1];
    return { pts, len: L, dur: L / speed, t0, at(t) {
      let d = clamp((t - t0) * speed, 0, L), i = 0; if (t < t0 || L === 0) return { x: pts[0].x, y: pts[0].y, dir: pts.length > 1 ? dirOf(pts[1].x - pts[0].x, pts[1].y - pts[0].y) : D.DOWN, moving: false, done: L === 0, started: t >= t0 };
      while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
      const a = pts[i], b = pts[i + 1] || a, u = seg[i] ? d / seg[i] : 1, done = (t - t0) * speed >= L;
      return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), dir: done ? null : dirOf(b.x - a.x, b.y - a.y), moving: !done, done, started: true };
    }, end: last };
  }
  const disc = (ctx, x, y, r) => { for (let dy = -r; dy <= r; dy++) { const w = Math.floor(Math.sqrt(r * r - dy * dy)); ctx.fillRect(x - w, y + dy, w * 2 + 1, 1); } };
  const icon = (ctx, img, x, y, cx, cy) => ctx.drawImage(img, Math.round(x - img.width / 2 - cx), Math.round(y - img.height / 2 - cy));
  const screen = () => ({ w: V.w / (M.Game.cam.z || 1) + 2, h: V.h / (M.Game.cam.z || 1) + 2 });
  const hash = n => { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; };
  const lib = { ease, lerp, clamp, poiC, dirOf, camPath, walker, disc, icon, screen, hash, D, T };

  const setFade = a => { const e = $('cine-fade'); if (!e) return; e.hidden = a <= 0.001; e.style.opacity = String(a); };
  const setCap = i => { if (i === C.cap) return; C.cap = i; const e = $('cine-cap'), txt = i >= 0 ? (C.def.caps[i][1] || '') : ''; e.classList.remove('on'); if (txt) { e.textContent = txt; void e.offsetWidth; e.classList.add('on'); } };
  const capText = txt => { const e = $('cine-cap'); C.cap = -2; e.classList.remove('on'); if (txt) { e.textContent = txt; void e.offsetWidth; e.classList.add('on'); } };      // v1.0: teks lokasi/narasi singkat untuk cutscene skrip
  const skipAfter = () => (C.def && C.def.skipAfter != null ? C.def.skipAfter : (M.C.CUT_SKIP_AFTER == null ? 3 : M.C.CUT_SKIP_AFTER));

  /* ---------- siklus ---------- */
  function define(id, def) { defs[id] = def; }
  function start(o) {
    o = o || {}; const id = o.id || 'final', def = defs[id];
    if (C.active || !def || M.C.CUT_ENABLED === false) return false;
    const st = def.init ? def.init(o) : {}; if (st === false) return false;
    Object.assign(C, { active: true, id, def, st, t: 0, skipping: false, fadeA: o.chain ? 1 : 0, fired: {}, audAcc: 9, cap: -1, onEnd: o.onEnd || null, replay: !!o.replay });     // v1.0: o.chain = lanjutan dari cutscene sebelumnya (mulai dari layar hitam, tanpa kilatan)
    M.Game.freeze(true); M.Game.setCine(Object.assign({}, def.cam(0, st)));
    document.body.classList.add('cutscene'); const c = $('cine'); c.hidden = false; $('cine-skip').hidden = true; setFade(C.fadeA); requestAnimationFrame(() => c.classList.add('on'));
    A().cutPreload(); A().duck(true); return true;
  }
  function teardown() {
    const def = C.def, st = C.st; C.active = false; C.skipping = false;
    if (def && def.cleanup) { try { def.cleanup(st); } catch (e) { /* abaikan */ } }
    M.Game.setCine(null); document.body.classList.remove('cutscene'); document.body.style.removeProperty('--tk');
    const c = $('cine'); c.classList.remove('on'); c.hidden = true; $('cine-cap').classList.remove('on'); $('cine-skip').hidden = true;
    A().cutStopAll(1.0); A().duck(false); C.def = null; C.st = null;
  }
  function finish() { const cb = C.onEnd; C.onEnd = null; teardown(); C.fadeA = 1; setFade(1); M.Game.freeze(false); if (cb) cb(); }     // layar hitam lalu memudar kembali ke pemain
  function abort() { if (!C.active) return; C.onEnd = null; teardown(); C.fadeA = 0; setFade(0); M.Game.freeze(false); }
  function skip() { if (!C.active || C.skipping || C.t < skipAfter()) return false; C.skipping = true; return true; }
  function onPause() { if (C.active) A().cutStopAll(0.12); }
  function update(dt) {
    if (!C.active) { if (C.fadeA > 0) { C.fadeA = Math.max(0, C.fadeA - dt / 0.5); setFade(C.fadeA); } return; }
    if (!M.Game.frozen) M.Game.freeze(true);
    const def = C.def, st = C.st; C.t += dt; const t = C.t;
    if (def.manual) {                                                               // v1.0: cutscene berbasis skrip/timeline (story.js): durasi dinamis, fade diatur skrip, dialog berurutan
      if (C.skipping && !st._skipDone) { st._skipDone = true; if (def.onSkip) { try { def.onSkip(st); } catch (e) { console.error(e); } } }
      if (def.update) def.update(t, dt, st); M.Game.setCine(def.cam(t, st));
      const evs = def.events || []; evs.forEach((e, i) => { if (t >= e[0] && !C.fired[i]) { C.fired[i] = 1; e[1](A(), st); } });
      C.audAcc += dt; if (C.audAcc >= 0.2) { C.audAcc = 0; if (def.audio) def.audio(t, A(), st); }
      const sk = $('cine-skip'); if (sk.hidden && t >= skipAfter() && !C.skipping && !st.end) sk.hidden = false;
      if (C.skipping) { C.fadeA = Math.min(1, C.fadeA + dt / 0.3); sk.hidden = true; } else C.fadeA = clamp(st.fade == null ? 0 : st.fade, 0, 1);
      setFade(C.fadeA);
      if ((C.skipping && C.fadeA >= 1) || st.end) finish();
      return;
    }
    if (def.update) def.update(t, dt, st); M.Game.setCine(def.cam(t, st));
    if (def.fireK) document.body.style.setProperty('--tk', def.fireK(t).toFixed(3));
    (def.events || []).forEach((e, i) => { if (t >= e[0] && !C.fired[i]) { C.fired[i] = 1; e[1](A(), st); } });
    let ci = -1; for (let i = 0; i < def.caps.length; i++) if (t >= def.caps[i][0]) ci = i; if (ci >= 0) setCap(ci);
    C.audAcc += dt; if (C.audAcc >= 0.2) { C.audAcc = 0; if (def.audio) def.audio(t, A(), st); }
    const sk = $('cine-skip'); if (sk.hidden && t >= skipAfter() && !C.skipping) sk.hidden = false;
    if (C.skipping) { C.fadeA = Math.min(1, C.fadeA + dt / 0.3); sk.hidden = true; } else C.fadeA = clamp((t - (def.total - 0.7)) / 0.7, 0, 1);
    setFade(C.fadeA);
    if ((C.skipping && C.fadeA >= 1) || t >= def.total) finish();
  }
  const entities = list => { if (C.active && C.def.entities) C.def.entities(list, C.st, C.t); };
  const drawFx = (ctx, cx, cy, tm) => { if (C.active && C.def.drawFx) C.def.drawFx(ctx, cx, cy, tm, C.st, C.t); };
  function init() { const b = $('cine-skip'); if (b) b.addEventListener('click', () => skip()); }

  /* =============== Cutscene Misi Terakhir =============== */
  const WALK = 46, GY = 216, CLIPX = 48, TX0 = CLIPX - 46;
  const truckBlocked = x => { const l = Math.floor(x / T), r = Math.floor((x + 45) / T); for (let ty = 12; ty <= 13; ty++) for (let tx = l; tx <= r; tx++) if (M.Map.isSolid(tx, ty)) return true; return false; };
  const fireKAt = t => t < 8.8 ? 1 : t < 13.5 ? lerp(1, 0.5, ease((t - 8.8) / 4.7)) : t < 17.2 ? lerp(0.5, 0.12, ease((t - 13.5) / 3.7)) : t < 19.8 ? lerp(0.12, 0, ease((t - 17.2) / 2.6)) : 0;
  const jetAt = t => t < 8.8 ? 0 : t < 9.6 ? (t - 8.8) / 0.8 : t < 16.8 ? 1 : t < 18.4 ? (18.4 - t) / 1.6 : 0;
  define('final', {
    total: 22.8,
    caps: [[0.5, 'Bantuan petugas pemadam tiba.'], [9.0, 'Petugas memadamkan api.'], [17.4, 'Api padam. Lingkungan kembali aman.'], [21.6, '']],
    init() {
      const F = M.Final.fireCenter(); let stop = 190; while (stop > CLIPX && (truckBlocked(stop) || truckBlocked(stop - 20))) stop -= 4;       // pastikan jalur truk bebas objek
      const st = { F, stop, truck: { x: TX0, dir: 'right' }, fireK: 1, jet: 0, fighters: [] }, taken = [], sx = stop + 38, sy = 221;
      for (let i = 0; i < 4; i++) {
        const a = (62 + i * 26) * Math.PI / 180, gx = F.x + Math.cos(a) * 112, gy = F.y + Math.sin(a) * 112 + 14;
        const pts = M.Map.findPath(sx, sy, gx, gy, { avoid: (tx, ty) => taken.some(q => Math.abs(q[0] - tx) + Math.abs(q[1] - ty) < 2) });
        if (!pts) continue; const e = pts[pts.length - 1]; taken.push([Math.floor(e.x / T), Math.floor((e.y - 1) / T)]);
        st.fighters.push({ i, v: i % 3, w: walker(pts, WALK, 6.3 + i * 0.25), x: sx, y: sy, dir: D.UP, vis: false, arrived: false });
      }
      return st;
    },
    cam(t, st) {
      if (!st.k) st.k = camPath([{ t: 0, x: () => M.Game.camPose().x, y: () => M.Game.camPose().y, z: 1 }, { t: 1.3, x: () => M.Game.camPose().x, y: () => M.Game.camPose().y, z: 1 },
        { t: 3.8, x: () => st.truck.x + 23, y: GY - 12, z: 1.06 }, { t: 6.3, x: () => st.truck.x + 23, y: GY - 12, z: 1.08 },
        { t: 9.4, x: st.F.x, y: st.F.y + 60, z: 1.14 }, { t: 17.2, x: st.F.x, y: st.F.y + 48, z: 1.2 }, { t: 21.6, x: () => M.Game.camPose().x, y: () => M.Game.camPose().y, z: 1 }]);
      return st.k(t);
    },
    fireK: t => fireKAt(t),
    update(t, dt, st) {
      st.truck.x = lerp(TX0, st.stop, 1 - Math.pow(1 - clamp((t - 0.5) / 5.6, 0, 1), 2)); st.fireK = fireKAt(t); st.jet = jetAt(t);
      for (const f of st.fighters) { const r = f.w.at(t); f.vis = r.started; f.arrived = r.done; f.x = r.x; f.y = r.y; if (t >= 17.4) f.dir = D.DOWN; else if (r.done) f.dir = D.UP; else if (r.dir != null) f.dir = r.dir; }
    },
    entities(list, st) {
      const T_ = st.truck, sp = S().truck;
      list.push({ y: GY, draw: (ctx, cx, cy, tm) => {
        const bob = T_.x < st.stop - 2 ? (Math.floor(tm * 10) % 2) * 0.5 : 0; ctx.save(); ctx.beginPath(); ctx.rect(CLIPX - cx, 0, 4000, 4000); ctx.clip();       // truk muncul dari ujung jalan (tidak melewati pepohonan tepi)
        ctx.globalAlpha = clamp((T_.x - TX0) / 14, 0, 1); ctx.drawImage(sp[T_.dir][Math.floor(tm * 4) % 2], V.snap(T_.x - cx), V.snap(GY - 22 - cy + bob)); ctx.restore(); } });
      for (const f of st.fighters) if (f.vis) list.push({ y: f.y, draw: (ctx, cx, cy, tm) => { const bob = !f.arrived ? (Math.floor(tm * 8 + f.i) % 2) : 0; ctx.drawImage(S().fighter[f.v][f.dir], V.snap(f.x - 8 - cx), V.snap(f.y - 14 - cy - bob)); } });
    },
    drawFx(ctx, cx, cy, tm, st) {
      if (st.jet <= 0.01) return; const F = st.F;
      for (const f of st.fighters) {
        if (!f.vis || !f.arrived || f.dir !== D.UP) continue;
        const n = { x: f.x + 5, y: f.y - 9 }, d = Math.hypot(F.x - f.x, F.y - f.y) || 1, cnt = Math.ceil(10 * st.jet);
        const gx = F.x + (f.x - F.x) / d * 58, gy = F.y + (f.y - F.y) / d * 58;      // titik semprot = tepi area api (sisi petugas)
        ctx.fillStyle = '#c8ccd2'; ctx.fillRect(Math.round(n.x - 1 - cx), Math.round(n.y - cy), 3, 2);
        for (let j = 0; j < cnt; j++) {
          const ph = (tm * 1.9 + f.i * 0.17 + j / 10) % 1, x = lerp(n.x, gx, ph), y = lerp(n.y, gy, ph) - Math.sin(Math.PI * ph) * 17;
          ctx.globalAlpha = ph > 0.88 ? 0.5 : 0.95; ctx.fillStyle = j % 2 ? '#e8f6ff' : '#8fcdf5'; ctx.fillRect(Math.round(x - cx), Math.round(y - cy), 2, 2);
        }
        ctx.globalAlpha = st.jet; const sp = Math.floor(tm * 10 + f.i * 3);
        for (let j = 0; j < 4; j++) { const h = (sp * 7 + j * 13 + f.i * 5) % 9; ctx.fillStyle = j % 2 ? '#ffffff' : '#a8d8f8'; ctx.fillRect(Math.round(gx + h - 4 - cx), Math.round(gy - (h * 3 + j * 2) % 7 - cy), 1, 1); }
        ctx.globalAlpha = 1;
      }
    },
    audio(t, au) {
      const near = ease((t - 6) / 3), fk = fireKAt(t), wat = jetAt(t) * (t < 16.5 ? 1 : 0.8);
      const g = { siren: t < 6.4 ? 0.10 + 0.20 * ease(t / 4.5) : 0, engine: t < 6.4 ? 0.10 + 0.16 * ease(t / 3) : t < 12 ? 0.10 : 0,
                  water: wat > 0.01 ? 0.24 * wat * (0.6 + 0.4 * fk) : 0, fire: t < 19.8 ? fk * (0.10 + 0.22 * near) : 0, forest: t >= 16.6 ? 0.22 : 0 };
      Object.keys(g).forEach(k => { if (g[k] > 0.004) au.cutPlay(k, { loop: true, gain: g[k], fade: 0.4 }); else au.cutStop(k, 0.5); });
    },
    events: [[0.0, au => au.cutPlay('whoosh', { gain: 0.28 })], [6.1, au => au.cutPlay('brake', { gain: 0.5 })], [6.25, au => au.cutPlay('whoosh', { gain: 0.26 })],
      [16.8, au => au.setTense(false, true)], [17.0, au => au.cutPlay('whoosh', { gain: 0.26 })], [20.7, au => au.cutPlay('chime', { gain: 0.5 })]]
  });

  M.Cutscene = { init, define, has: id => !!defs[id], start, cap: capText, setFade, get manual() { return !!(C.active && C.def && C.def.manual); }, get state() { return C.st; }, get time() { return C.t; }, play: (id, o) => start(Object.assign({}, o, { id })), skip, abort, update, entities, drawFx, onPause, lib, get TOTAL() { return C.def ? C.def.total : 22.8; },
    get active() { return C.active; }, get id() { return C.id; }, get replay() { return C.replay; }, fireK: () => (C.active && C.def && C.def.fireK ? C.def.fireK(C.t) : 1),
    info: () => ({ active: C.active, id: C.id, t: C.t, total: C.def ? C.def.total : 0, fireK: C.active && C.def && C.def.fireK ? C.def.fireK(C.t) : 1, jet: C.st && C.st.jet || 0, skipping: C.skipping, fade: C.fadeA, skipVisible: !!$('cine-skip') && !$('cine-skip').hidden,
      caption: $('cine-cap') ? $('cine-cap').textContent : '', truckX: C.st && C.st.truck ? C.st.truck.x : 0, stop: C.st && C.st.stop, truckClip: CLIPX,
      fighters: C.st && C.st.fighters ? C.st.fighters.map(f => ({ x: f.x, y: f.y, vis: f.vis, arrived: f.arrived, dir: f.dir, pts: f.w.pts })) : [],
      paths: (() => { const o = []; const st = C.st; if (!st) return o; if (st.fighters) st.fighters.forEach(f => o.push({ id: 'f' + f.i, pts: f.w.pts, start: false })); if (st.w && st.w.pts) o.push({ id: 'officer', pts: st.w.pts, start: true }); else if (st.w) Object.keys(st.w).forEach(k => o.push({ id: k, pts: st.w[k].w.pts, start: true })); return o; })(),
      seeds: C.st && C.st.seeds ? C.st.seeds.map(q => ({ tx: q.tx, ty: q.ty })) : [], cam: { x: M.Game.cam.x, y: M.Game.cam.y, z: M.Game.cam.z } }) };
})(window.MPH);
