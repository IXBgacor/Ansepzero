/* UI & alur mulai: menu -> gerbang (landscape + layar penuh) -> gameplay.
   Gameplay hanya berjalan bila pemain sudah konfirmasi DAN (mode sentuh: orientasi landscape; mode PC: ukuran jendela bebas).
   v0.4²: mode input adaptif (sentuh <-> PC), tampilan penuh layar, router keyboard satu pintu. */
(function (M) {
  const $ = id => document.getElementById(id), canvas = $('game');
  const menu = $('menu'), gate = $('gate'), rotate = $('rotate'), hud = $('hud'), touch = $('touch'), stage = $('stage'), pchint = $('pchint');
  let started = false;   // sesi sudah pernah dimulai
  let want = false;      // pemain sudah konfirmasi ingin bermain
  let playing = false;   // loop game sedang berjalan
  const A = M.Audio;     // v0.4³: audio

  const root = document.documentElement;
  const reqFs = root.requestFullscreen || root.webkitRequestFullscreen;
  const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
  const canFs = !!reqFs;
  const canLock = !!(screen.orientation && screen.orientation.lock);
  const inFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const isLandscape = () => innerWidth > innerHeight;

  const isPC = () => M.Input.mode === 'pc';
  const needLandscape = () => !isPC();            // v0.4²: jendela PC boleh berbentuk apa pun
  function resize() {                              // kanvas = ukuran stage dalam piksel perangkat (lihat game.js)
    M.Game.resizeView(stage.clientWidth || innerWidth, stage.clientHeight || innerHeight, window.devicePixelRatio || 1); hudLayout();
  }
  const actions = $('actions'), tracker = $('btn-missions');
  function setControls(on) { $('btn-bike').hidden = !on; $('btn-run').hidden = !on; touch.hidden = !on; actions.hidden = !on; tracker.hidden = !on; pchint.hidden = !on; document.body.classList.toggle('playing', !!on); hudLayout(); }
  /* kotak HUD (piksel CSS) yang menutupi kanvas: dipakai panah penunjuk tujuan agar tidak tersembunyi di bawah panel */
  function hudLayout() {
    const rects = [];
    [tracker, $('hud') && $('hud').querySelector('.hud-btns'), touch.hidden ? null : $('joy'), (isPC() || $('btn-run').hidden) ? null : $('btn-run'), (isPC() || $('btn-bike').hidden) ? null : $('btn-bike'), $('minimap'), $('zoombar'), actions.hidden ? null : (isPC() ? actions : $('btn-act')), pchint.hidden ? null : pchint].forEach(e => {
      if (!e || e.hidden) return; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const r = e.getBoundingClientRect(); if (r.width > 0 && r.height > 0) rects.push({ l: r.left, r: r.right, t: r.top, b: r.bottom });
    });
    M.World.setHudRects(rects);
    M.Game.setBottomBar(!pchint.hidden && getComputedStyle(pchint).display !== 'none' ? pchint.offsetHeight : 0);
  }
  M.onHudLayout = hudLayout;
  let toastT;
  function toast(msg, kind) { const t = $('toast'); t.textContent = msg; t.className = kind || ''; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 5000); }
  M._toast = toast;

  function refreshStatus() {
    const o = $('st-orient'), f = $('st-fs'), land = isLandscape(), fs = inFs();
    o.hidden = !needLandscape();
    o.className = land ? 'ok' : 'bad'; o.textContent = 'Orientasi: ' + (land ? 'Landscape ✔' : 'Portrait ✘ (putar perangkat)');
    f.className = fs ? 'ok' : 'bad';
    f.textContent = 'Layar penuh: ' + (fs ? 'aktif ✔' : canFs ? 'belum aktif' : 'tidak didukung browser ini');
    document.querySelectorAll('.btn-fs').forEach(b => b.textContent = fs ? 'Keluar Layar Penuh' : 'Layar Penuh');
  }

  function showMenu() {                       // juga berfungsi sebagai Jeda
    const wasPlaying = playing;
    M.UI.closeAll(); M.UI.disarmReset(); M.UI.refreshMenu(); $('safety').hidden = true;
    want = false; playing = false; M.Game.stop(); if (M.Cutscene) M.Cutscene.onPause();      // v0.5²: SFX cutscene berhenti saat jeda
    if (wasPlaying && !document.hidden) A.sfx('pause'); A.bgmPause();      // v0.4³: jeda -> musik fade-out & berhenti sementara
    gate.hidden = true; rotate.hidden = true; hud.hidden = true; setControls(false); menu.hidden = false;
    $('btn-start').textContent = started ? 'Lanjutkan' : 'Mulai Game'; $('btn-restart').hidden = !started;
    refreshModeUI(); focusSoon($('btn-start'));
  }
  function focusSoon(b) { if (b && isPC()) setTimeout(() => { if (!b.closest('[hidden]')) try { b.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } }, 0); }
  function openGate() {
    menu.hidden = true; gate.hidden = false; $('gate-error').hidden = true; $('btn-gate-nofs').hidden = true;
    $('btn-gate-go').textContent = canFs ? 'Aktifkan Layar Penuh & Mulai' : 'Mulai';
    if (isPC()) {
      $('gate-msg').innerHTML = 'Untuk pengalaman terbaik, aktifkan <b>LAYAR PENUH</b> (opsional). Kontrol: <b>WASD/panah</b> bergerak, <b>E/Enter</b> interaksi, <b>Esc</b> jeda.';
      $('btn-gate-nofs').hidden = false; $('gate-note').textContent = canFs ? 'Layar penuh juga bisa dinyalakan dengan F11. Di layar penuh, Esc pertama dipakai browser untuk keluar layar penuh.' : 'Browser ini tidak mendukung tombol layar penuh.';
    } else {
      $('gate-msg').innerHTML = 'Untuk pengalaman bermain terbaik, putar perangkat ke mode <b>LANDSCAPE</b> dan aktifkan <b>LAYAR PENUH</b>.';
      $('gate-note').textContent = (canFs ? '' : 'Browser ini tidak mendukung layar penuh (mis. Safari iPhone). ') +
        (canLock ? 'Kunci landscape otomatis akan dicoba setelah layar penuh aktif.'
                 : 'Browser ini tidak bisa mengunci orientasi: putar HP ke landscape secara manual.');
    }
    refreshStatus(); focusSoon($('btn-gate-go'));
  }
  function fail(e) {
    const e1 = $('gate-error');
    e1.textContent = 'Layar penuh gagal diaktifkan' + (e && e.message ? ' (' + e.message + ')' : '') +
      '. Izinkan layar penuh lalu coba lagi, atau main tanpa layar penuh.';
    e1.hidden = false; $('btn-gate-go').textContent = 'Coba Lagi'; $('btn-gate-nofs').hidden = false;
  }
  async function enterFs() {
    const p = reqFs.call(root);
    if (p && p.then) await p; else await new Promise(r => setTimeout(r, 350));   // webkit lama tanpa Promise
    if (!inFs()) throw new Error('tidak aktif');
  }
  async function confirmStart(tryFs) {        // dipanggil dari klik tombol (interaksi pengguna)
    $('gate-error').hidden = true;
    if (tryFs && canFs && !inFs()) {
      try { await enterFs(); } catch (e) { fail(e); refreshStatus(); return; }
    }
    if (canLock) { try { await screen.orientation.lock('landscape'); } catch (e) { /* manual */ } }
    begin();
  }
  function begin() {
    const wasStarted = started; if (wasStarted) A.sfx('resume');
    started = true; want = true; menu.hidden = true; gate.hidden = true; evaluate();
  }
  /* Satu-satunya tempat yang memulai/menghentikan gameplay berdasarkan orientasi. */
  function evaluate() {
    resize(); refreshStatus();
    if (!want) return;
    if (isLandscape() || !needLandscape()) {
      rotate.hidden = true;
      if (!playing) { playing = true; hud.hidden = false; setControls(true); M.Game.start(); A.bgmStart(); }
    } else {
      if (playing) { M.Game.stop(); playing = false; A.bgmPause(); }
      hud.hidden = true; setControls(false); rotate.hidden = false;
    }
  }
  async function toggleFs() {
    try {
      if (inFs()) { (exitFs).call(document); if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); }
      else await enterFs();
    } catch (e) { toast('Layar penuh tidak bisa diaktifkan di browser ini.'); }
    refreshStatus();
  }
  function startOrResume() {                  // dari menu
    if (started && (isLandscape() || !needLandscape())) begin(); else { A.sfx('ui'); openGate(); }
  }

  /* ---------- mode input adaptif (v0.4²) ---------- */
  const PREF_LABEL = { auto: 'Otomatis', touch: 'Sentuh (HP/tablet)', pc: 'Keyboard + Mouse' };
  function refreshModeUI() {
    const b = $('btn-input'), m = M.Input.mode;
    b.textContent = 'Kontrol: ' + PREF_LABEL[M.Input.pref];
    $('input-note').textContent = (M.Input.pref === 'auto' ? 'Terdeteksi: ' : 'Dipilih: ') + (m === 'pc' ? 'keyboard + mouse' : 'layar sentuh') +
      '. Mode otomatis berganti sendiri saat Anda menyentuh layar atau memakai keyboard/mouse.';
  }
  function applyMode(m, why) {
    document.body.classList.toggle('mode-pc', m === 'pc'); document.body.classList.toggle('mode-touch', m !== 'pc');
    refreshModeUI(); resize();
    if (why !== 'pref' || started) evaluate();
    if (!gate.hidden) openGate();                       // teks gerbang mengikuti mode
    if (why === 'touch' || why === 'mouse' || why === 'key') M._modeToast && M._modeToast(m);
  }
  M._modeToast = m => { if (want && playing) toast(m === 'pc' ? 'Mode PC: keyboard + mouse' : 'Mode sentuh: joystick + tombol INTERAKSI', 'ok'); };
  M.Input.onMode(applyMode);
  document.body.classList.toggle('mode-pc', isPC()); document.body.classList.toggle('mode-touch', !isPC());

  M.Game.init(canvas); resize(); M.Input.bindJoystick($('joy')); M.Input.bindRun($('btn-run')); M.Camera.init(canvas); M.Cutscene.init(); M.Chapters.init(); M.GUI.init(); M.Certpdf.init();   // v0.5²
  M.Dialog.init(); M.Interact.init(); M.UI.init(); M.Region.init(); M.Bike.init(); M.VMission.init(); M.MapUI.init(); M.HUD2.init(); M.AudioUI.init(); M.Final.init(); M.Story.init(); M.Audit.run();   // v0.5; v1.0: cerita + audit titik misi
  if (M.Missions.loadStatus === 'corrupt') toast('Data progres rusak dan diabaikan. Progres dimulai dari awal.');
  else if (M.Missions.loadStatus === 'unavailable') toast('Penyimpanan lokal tidak tersedia: progres tidak akan tersimpan.');
  else if (M.Missions.loadStatus === 'future') toast('Data progres berasal dari versi game yang lebih baru. Progres tidak akan ditimpa.');
  else if (M.Missions.migrated) toast('Progres dari versi lama dipertahankan: ' + M.Missions.migrated.credited + ' misi lama dihitung selesai. Save lama dicadangkan otomatis.', 'ok');
  $('btn-start').onclick = startOrResume;
  $('btn-replay-intro').onclick = () => { M.Story.replayIntro(); startOrResume(); };
  $('btn-restart').onclick = () => { M.Game.restart(); startOrResume(); };
  $('btn-pause').onclick = showMenu;
  $('btn-input').onclick = () => { const o = ['auto', 'touch', 'pc'], i = o.indexOf(M.Input.pref); M.Input.setPref(o[(i + 1) % 3]); };
  document.querySelectorAll('#hud button').forEach(b => b.addEventListener('click', () => setTimeout(() => b.blur(), 0)));   // fokus tidak 'menempel' di tombol HUD (cegah Enter/Space ganda)
  $('btn-missions').addEventListener('click', () => setTimeout(() => $('btn-missions').blur(), 0));
  $('btn-how').onclick = () => { const h = $('howto'); h.hidden = !h.hidden; };
  $('btn-gate-go').onclick = () => confirmStart(true);
  $('btn-gate-nofs').onclick = () => confirmStart(false);
  $('btn-gate-back').onclick = showMenu;
  $('btn-rot-menu').onclick = showMenu;
  document.querySelectorAll('.btn-fs').forEach(b => { if (canFs) b.onclick = toggleFs; else b.hidden = true; });
  addEventListener('resize', evaluate); addEventListener('orientationchange', () => setTimeout(evaluate, 120));
  if (window.ResizeObserver) new ResizeObserver(() => resize()).observe(stage);
  if (window.visualViewport) visualViewport.addEventListener('resize', () => resize());
  if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', evaluate);
  document.addEventListener('fullscreenchange', evaluate); document.addEventListener('webkitfullscreenchange', evaluate);
  document.addEventListener('visibilitychange', () => { if (document.hidden && want) showMenu(); });
  /* Router keyboard SATU PINTU (v0.4²): menghindari input ganda antara dialog, menu, dan tombol terfokus. */
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key, confirm = k === 'Enter' || k === 'e' || k === 'E' || e.code === 'NumpadEnter';
    if (k === 'Escape') {
      if (M.UI.closeTopModal()) { e.preventDefault(); return; }       // dialog / evaluasi / daftar misi
      if (!gate.hidden) { showMenu(); return; }                        // gerbang -> menu
      if (want) { showMenu(); return; }                                // bermain -> jeda
      if (!menu.hidden && started) { startOrResume(); }                // jeda -> lanjut
      return;
    }
    if (M.Cutscene && M.Cutscene.active) { if (confirm || k === ' ') { if (!e.repeat && !M.Story.key()) M.Cutscene.skip(); e.preventDefault(); } return; }   // v0.5²: saat cutscene hanya Esc (jeda) dan Enter/E/Spasi (lewati, setelah tombol muncul)
    if (M.Dialog.isOpen()) { if (M.Dialog.handleKey(e)) e.preventDefault(); return; }
    if (confirm && !e.repeat && playing && !M.Game.frozen && !M.UI.panelOpen() && !M.UI.evalOpen()) { e.preventDefault(); M.Interact.trigger(); }
  });
  document.addEventListener('gesturestart', e => e.preventDefault());
  refreshStatus();
})(window.MPH);
