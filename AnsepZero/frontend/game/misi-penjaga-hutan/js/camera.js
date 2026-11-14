/* Kamera geser v0.5²: satu jari (sentuh/pena) atau tombol kiri mouse pada KANVAS menggeser pandangan peta.
   - Hanya event yang jatuh langsung di kanvas yang dihitung: tombol HUD, joystick, tombol INTERAKSI, dialog, daftar misi, jeda, dll. berada di atas kanvas dan tidak terpengaruh.
   - Joystick memakai pointer-nya sendiri (pointer capture di #joy), jadi geser kamera TIDAK pernah dianggap input joystick, dan pemain tidak ikut berjalan.
   - Ambang gerak (CAM_DRAG_THRESHOLD_*) menjaga ketukan biasa tidak menggeser kamera. Jari kedua di kanvas diabaikan (tidak ada pinch).
   - Logika offset, batas peta, dan kembali halus ke pemain ada di game.js. */
(function (M) {
  let cv = null, id = null, type = '', sx = 0, sy = 0, lx = 0, ly = 0, moved = false;
  const body = document.body, thr = t => (t === 'mouse' ? M.C.CAM_DRAG_THRESHOLD_MOUSE : M.C.CAM_DRAG_THRESHOLD_TOUCH) || 6;
  function end() {
    if (id !== null && cv && cv.hasPointerCapture && cv.hasPointerCapture(id)) { try { cv.releasePointerCapture(id); } catch (e) { /* abaikan */ } }
    id = null; moved = false; body.classList.remove('cam-drag'); M.Game.panEnd();
  }
  function down(e) {
    if (id !== null || (e.pointerType === 'mouse' && e.button !== 0) || !M.Game.canPan()) return;
    id = e.pointerId; type = e.pointerType; sx = lx = e.clientX; sy = ly = e.clientY; moved = false;
    try { cv.setPointerCapture(id); } catch (x) { /* abaikan */ }
  }
  function move(e) {
    if (e.pointerId !== id) return;
    if (!M.Game.canPan()) { end(); return; }
    if (!moved) {
      if (Math.hypot(e.clientX - sx, e.clientY - sy) < thr(type)) return;
      if (!M.Game.panStart()) { end(); return; }
      moved = true; lx = e.clientX; ly = e.clientY; body.classList.add('cam-drag'); return;       // mulai dari titik ini: tanpa lompatan sebesar ambang
    }
    M.Game.panMove(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY;
  }
  function init(canvas) {
    if (cv) return; cv = canvas; cv.style.touchAction = 'none';
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => cv.addEventListener(n, e => { if (e.pointerId === id) end(); }));
    cv.addEventListener('contextmenu', e => e.preventDefault());
    addEventListener('blur', end); document.addEventListener('visibilitychange', () => { if (document.hidden) end(); });
  }
  M.Camera = { init, end, get dragging() { return id !== null && moved; } };
})(window.MPH);
