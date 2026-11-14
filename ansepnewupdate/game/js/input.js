/* Input v0.4²: joystick analog virtual (sentuh) + keyboard (panah/WASD, 8 arah) + DETEKSI MODE ADAPTIF.
   - Mode 'touch' (joystick + tombol INTERAKSI) atau 'pc' (keyboard + mouse, tanpa kontrol layar). Berganti otomatis tanpa reload:
       * Awal: 'touch' bila perangkat utamanya sentuh ((pointer:coarse) atau (hover:none)); selain itu 'pc'.
         Keberadaan layar sentuh saja TIDAK dianggap sentuh (laptop layar sentuh + mouse tetap mulai sebagai PC).
       * Sentuhan/pena nyata (pointerType touch|pen) -> 'touch'. Mouse nyata (pointerType mouse: klik atau gerak > 8 px) atau
         tombol game (WASD/panah/E/Enter/Esc) -> 'pc'. Event mouse tiruan setelah sentuhan tidak dihitung (jeda 700 ms).
       * Mode tidak berganti saat jari sedang menahan joystick.
   - Pilihan manual (Otomatis / Sentuh / Keyboard+Mouse) disimpan di 'mph.input' (terpisah dari save progres).
   - Joystick: satu pointer, zona mati radial, kecepatan naik halus 0..1, arah bebas 360° dengan tarikan lunak ke 8 arah yang KONTINU (tanpa lompatan sudut).
   get() -> [dx, dy] dengan panjang <= 1. */
(function (M) {
  const DEAD = M.C.JOY_DEAD, SNAP = 7 * Math.PI / 180, STEP = Math.PI / 4, HALF = STEP / 2;
  const kb = [], codeMap = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
  const keyMap = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' };
  const dirOf = e => codeMap[e.code] || keyMap[(e.key || '').toLowerCase()];
  const joy = { id: null, x: 0, y: 0, mag: 0, el: null, knob: null };
  let runKey = false, runId = null, runEl = null;           // v1.0: tombol lari (Shift di PC, tombol LARI di layar sentuh)
  const PREF_KEY = 'mph.input';
  let pref = 'auto', mode = 'pc', lastTouchAt = -1e9, mouseTravel = 0, lastMouse = null;
  const listeners = [];

  /* Perangkat utama sentuh = pointer utama kasar/tanpa hover. Bila ada mouse/trackpad terpasang (any-pointer:fine + any-hover:hover) dan
     perangkat utama bukan kasar, anggap PC. Laptop layar sentuh umumnya melaporkan pointer utama 'fine' sehingga mulai sebagai PC. */
  const mq = q => { try { return matchMedia(q).matches; } catch (e) { return false; } };
  const coarse = () => mq('(pointer:coarse)') || mq('(hover:none)');
  function autoGuess() { return coarse() ? 'touch' : 'pc'; }
  function apply(m, force, why) {
    if (m === mode && !force) return;
    mode = m; document.body.classList.toggle('mode-touch', m === 'touch'); document.body.classList.toggle('mode-pc', m === 'pc');
    if (m === 'pc') releaseJoy(); kb.length = 0;
    listeners.slice().forEach(f => { try { f(m, why || 'pref'); } catch (e) { console.error(e); } });
  }
  function setPref(p) {
    pref = (p === 'touch' || p === 'pc') ? p : 'auto'; M.Store.set(PREF_KEY, pref);
    apply(pref === 'auto' ? autoGuess() : pref, false, 'pref');
  }
  function auto(m, why) { if (pref === 'auto' && joy.id === null) apply(m, false, why); }   // pindah otomatis hanya bila pilihan = Otomatis

  /* ---- deteksi perangkat aktif ---- */
  addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') { lastTouchAt = performance.now(); auto('touch', 'touch'); }
    else if (e.pointerType === 'mouse' && performance.now() - lastTouchAt > 700) auto('pc', 'mouse');
  }, true);
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') { lastTouchAt = performance.now(); return; }
    if (e.pointerType !== 'mouse' || performance.now() - lastTouchAt < 700) { lastMouse = null; return; }
    if (lastMouse) mouseTravel += Math.hypot(e.clientX - lastMouse.x, e.clientY - lastMouse.y);
    lastMouse = { x: e.clientX, y: e.clientY };
    if (mouseTravel > 8) { mouseTravel = 0; auto('pc', 'mouse'); }
  }, true);
  const GAME_KEYS = /^(Key[WASDE]|Arrow(Up|Down|Left|Right)|Enter|NumpadEnter|Escape)$/;
  addEventListener('keydown', e => { if (e.target && e.target.tagName === 'INPUT') return; if (!e.ctrlKey && !e.metaKey && !e.altKey && GAME_KEYS.test(e.code || '')) auto('pc', 'key'); }, true);

  /* ---- keyboard (gerak) ---- */
  addEventListener('keydown', e => { if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'Shift') { if (e.target && e.target.tagName === 'INPUT') return; runKey = true; auto('pc', 'key'); } });
  addEventListener('keyup', e => { if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'Shift') runKey = false; });
  addEventListener('keydown', e => {
    const d = dirOf(e); if (!d || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.shiftKey) runKey = true;
    if (!M.Game || !M.Game.running || M.Game.frozen) return;       // saat dialog/panel/menu: tidak merekam gerak, tidak menahan tombol panah
    e.preventDefault(); if (kb.indexOf(d) < 0) kb.push(d);
  });
  addEventListener('keyup', e => { const d = dirOf(e); if (!d) return; const i = kb.indexOf(d); if (i >= 0) kb.splice(i, 1); });
  addEventListener('blur', clear);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });

  function kbVec() {
    const x = (kb.includes('right') ? 1 : 0) - (kb.includes('left') ? 1 : 0), y = (kb.includes('down') ? 1 : 0) - (kb.includes('up') ? 1 : 0);
    if (x && y) return [x * Math.SQRT1_2, y * Math.SQRT1_2];
    return [x, y];
  }

  /* ---- joystick ---- */
  function show(dx, dy, on) {
    if (!joy.knob) return;
    joy.knob.style.transform = on ? 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)' : '';
    joy.el.classList.toggle('on', !!on);
  }
  function fromPoint(e) {
    const r = joy.el.getBoundingClientRect(), travel = Math.max(10, (r.width - joy.knob.offsetWidth) / 2);
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy), t = Math.min(1, len / travel);
    if (len > travel) { dx *= travel / len; dy *= travel / len; }
    show(dx, dy, true);
    if (t < DEAD) { joy.x = joy.y = joy.mag = 0; return; }
    let a = Math.atan2(dy, dx); const k = Math.round(a / STEP), dev = a - k * STEP, ad = Math.abs(dev);
    // tarikan lunak KONTINU: dalam ±SNAP -> tepat ke 8 arah; di luarnya dipetakan linear sampai ±45° sehingga tidak ada lompatan sudut
    a = k * STEP + (ad <= SNAP ? 0 : Math.sign(dev) * (ad - SNAP) * HALF / (HALF - SNAP));
    const s = Math.min(1, ((t - DEAD) / (1 - DEAD)) / 0.85);            // 0 di tepi zona mati, penuh pada ±85% jarak
    joy.x = Math.cos(a) * s; joy.y = Math.sin(a) * s; joy.mag = s;
    if (Math.abs(joy.x) < 1e-6) joy.x = 0; if (Math.abs(joy.y) < 1e-6) joy.y = 0;
  }
  function releaseJoy() {
    if (joy.id !== null && joy.el && joy.el.hasPointerCapture && joy.el.hasPointerCapture(joy.id)) { try { joy.el.releasePointerCapture(joy.id); } catch (e) { /* abaikan */ } }
    joy.id = null; joy.x = joy.y = joy.mag = 0; show(0, 0, false);
  }
  function bindJoystick(el) {
    joy.el = el; joy.knob = el.querySelector('.joy-knob');
    el.addEventListener('pointerdown', e => {
      if (joy.id !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault(); joy.id = e.pointerId; try { el.setPointerCapture(e.pointerId); } catch (x) { /* abaikan */ } fromPoint(e);
    });
    el.addEventListener('pointermove', e => { if (e.pointerId === joy.id) { e.preventDefault(); fromPoint(e); } });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => el.addEventListener(n, e => { if (e.pointerId === joy.id) releaseJoy(); }));
    el.addEventListener('contextmenu', e => e.preventDefault());
  }
  function bindRun(el) {                                   // v1.0: tombol LARI (tahan). Pointer sendiri -> tidak mengganggu joystick maupun tombol INTERAKSI
    runEl = el;
    const off = () => { runId = null; el.classList.remove('on'); };
    el.addEventListener('pointerdown', e => { if (runId !== null || (e.pointerType === 'mouse' && e.button !== 0)) return; e.preventDefault(); runId = e.pointerId; try { el.setPointerCapture(e.pointerId); } catch (x) { /* abaikan */ } el.classList.add('on'); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => el.addEventListener(n, e => { if (e.pointerId === runId) off(); }));
    el.addEventListener('contextmenu', e => e.preventDefault());
  }
  function clearRun() { runKey = false; runId = null; if (runEl) runEl.classList.remove('on'); }
  const running = () => !!(M.Game && M.Game.running && !M.Game.frozen && (runKey || runId !== null));
  function clear() { kb.length = 0; releaseJoy(); clearRun(); }
  function get() {
    if (joy.id !== null && joy.mag > 0) return [joy.x, joy.y];
    return kbVec();
  }
  function init() {
    const saved = M.Store.get(PREF_KEY); pref = (saved === 'touch' || saved === 'pc') ? saved : 'auto';
    apply(pref === 'auto' ? autoGuess() : pref, true);
  }
  init();
  M.Input = { bindJoystick, bindRun, running, get, clear, init, setPref, DEAD, onMode: f => listeners.push(f),
              get mode() { return mode; }, get pref() { return pref; },
              state: () => ({ run: running(), runKey, runId, id: joy.id, x: joy.x, y: joy.y, mag: joy.mag, keys: kb.slice(), mode, pref }) };
})(window.MPH);
