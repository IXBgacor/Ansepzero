/* UI audio v0.4³: panel Pengaturan Audio (BGM ON/OFF, SFX ON/OFF, volume BGM, volume SFX), tombol Mute/Unmute di HUD,
   dan bunyi klik tombol umum. Panel dibuka dari menu/jeda; Esc menutupnya (lewat M.UI.closeTopModal). */
(function (M) {
  const $ = id => document.getElementById(id), A = M.Audio;
  let open = false, bound = false;
  const pct = v => Math.round(v * 100);

  function refresh() {
    if (!bound) return;
    const s = A.status();
    const hb = $('btn-mute'); hb.textContent = s.muted ? '🔇' : '🔊';
    hb.setAttribute('aria-pressed', String(s.muted)); hb.setAttribute('aria-label', s.muted ? 'Nyalakan suara' : 'Matikan suara'); hb.title = s.muted ? 'Suara senyap — ketuk untuk menyalakan' : 'Ketuk untuk membisukan suara';
    $('au-mute').textContent = s.muted ? '🔇 Suara: SENYAP (ketuk untuk menyalakan)' : '🔊 Suara: AKTIF (ketuk untuk membisukan)';
    for (const k of ['bgm', 'sfx']) {
      const on = s[k + 'On'], b = $('au-' + k + '-on'), sl = $('au-' + k + '-vol'), v = pct(s[k + 'Vol']);
      b.textContent = on ? 'ON' : 'OFF'; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('off', !on);
      if (+sl.value !== v) sl.value = v; $('au-' + k + '-out').textContent = v + '%'; sl.setAttribute('aria-valuetext', v + ' persen'); sl.disabled = !on;
    }
    let t = '';
    if (s.muted) t = 'Mute aktif: semua suara dibisukan.';
    else if (s.bgmState === 'failed') t = 'Musik latar tidak dapat dimuat (file assets/audio/bgm/ hilang atau tidak didukung). Game tetap bisa dimainkan tanpa musik.';
    else if (s.bgmState === 'blocked') t = 'Browser menahan musik otomatis. Ketuk layar atau tombol ON sekali untuk menyalakannya.';
    if (!s.storage) t += (t ? ' ' : '') + 'Penyimpanan lokal tidak tersedia: pengaturan tidak akan diingat.';
    $('au-status').textContent = t; $('au-status').hidden = !t;
  }
  function openPanel() {
    if (open) return; open = true; $('audiosec').hidden = false; refresh();
    A.sfx('open'); A.preview(true);                       // musik diputar selama panel terbuka agar volume bisa didengar
    const b = $('au-mute'); if (b && M.Input.mode === 'pc') try { b.focus({ preventScroll: true }); } catch (e) { /* abaikan */ }
  }
  function closePanel(silent) {
    if (!open) return; open = false; $('audiosec').hidden = true; A.preview(false);
    if (!silent) A.sfx('close');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  function init() {
    if (bound) return; bound = true;
    $('btn-audio').addEventListener('click', openPanel);
    $('au-close').addEventListener('click', () => closePanel()); $('au-ok').addEventListener('click', () => closePanel());
    $('btn-mute').addEventListener('click', () => { A.toggleMute(); setTimeout(() => $('btn-mute').blur(), 0); });
    $('au-mute').addEventListener('click', () => A.toggleMute());
    for (const k of ['bgm', 'sfx']) {
      $('au-' + k + '-on').addEventListener('click', () => A.setOn(k, !A.settings[k + 'On']));
      const sl = $('au-' + k + '-vol');
      sl.addEventListener('input', () => A.setVolume(k, sl.value / 100, false));
      sl.addEventListener('change', () => { A.setVolume(k, sl.value / 100, true); if (k === 'sfx') A.sfx('reward'); });   // contoh bunyi saat slider dilepas
    }
    $('au-test').addEventListener('click', () => { A.sfx('correct'); });
    /* bunyi klik tombol umum; tombol yang punya bunyi sendiri ditandai data-nosfx, tombol dialog diatur dialog.js */
    document.addEventListener('click', e => {
      const b = e.target && e.target.closest ? e.target.closest('button') : null;
      if (!b || b.disabled || b.hasAttribute('data-nosfx') || b.closest('#dialog')) return;
      A.sfx('ui');
    }, true);
    A.onChange(refresh); refresh();
  }
  M.AudioUI = { init, open: openPanel, close: closePanel, isOpen: () => open, refresh };
})(window.MPH);
