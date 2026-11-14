/* HUD v3.0: ikon pengaturan (gear) yang membuka audio / layar penuh / jeda, dan ZOOM peta.
   Zoom = langkah skala bilangan bulat (piksel perangkat per piksel logis) sehingga pixel art tetap tajam di semua level.
   Kontrol: tombol + / −, cubit dua jari di peta, roda mouse, tombol keyboard + dan −. Level disimpan di 'mph.zoom'. */
(function (M) {
  'use strict';
  const $ = id => document.getElementById(id), body = document.body, KEY = 'mph.zoom';
  let pinching = false, ptrs = new Map(), d0 = 0, wheelT = 0;

  /* ---------- ikon gear (digambar sekali) ---------- */
  function gearIcon() {
    const c = M.util.cv(16, 16), g = c.getContext('2d'); g.fillStyle = '#f6efd8';
    [[7, 0, 2, 3], [7, 13, 2, 3], [0, 7, 3, 2], [13, 7, 3, 2], [2, 2, 3, 3], [11, 2, 3, 3], [2, 11, 3, 3], [11, 11, 3, 3], [3, 3, 10, 10]].forEach(r => g.fillRect(r[0], r[1], r[2], r[3]));
    g.clearRect(6, 6, 4, 4); g.fillStyle = '#f6efd8'; g.fillRect(7, 7, 2, 2); g.fillStyle = '#0f3b2e'; g.fillRect(6, 6, 4, 1); g.fillRect(6, 9, 4, 1); g.fillRect(6, 7, 1, 2); g.fillRect(9, 7, 1, 2);
    return c.toDataURL();
  }
  function setGear(on) { body.classList.toggle('gear-open', !!on); $('btn-gear').setAttribute('aria-expanded', on ? 'true' : 'false'); }

  /* ---------- zoom ---------- */
  const level = () => M.C.ZOOM_OFF || 0;
  function apply() {
    const stage = $('stage') || document.body;
    M.Game.resizeView(stage.clientWidth || innerWidth, stage.clientHeight || innerHeight, window.devicePixelRatio || 1);
    if (M.Spots) M.Spots.reset(); if (M.onHudLayout) M.onHudLayout(); if (M.MapUI) M.MapUI.invalidate();
    const s = M.C.ZOOM_S, lo = 2, hi = M.C.ZOOM_SMAX; $('zoom-in').disabled = s >= hi; $('zoom-out').disabled = s <= lo;
  }
  function setZoom(off) {
    const base = M.C.ZOOM_BASE || 1, lo = 2 - base, hi = (M.C.ZOOM_SMAX || 8) - base; off = Math.max(lo, Math.min(hi, off));
    if (off === level()) { apply(); return; } M.C.ZOOM_OFF = off; M.Store.set(KEY, off); apply();
  }
  const zoomIn = () => setZoom(level() + 1), zoomOut = () => setZoom(level() - 1);

  /* ---------- cubit dua jari di kanvas ---------- */
  function bindPinch(cv) {
    const dist = () => { const p = [...ptrs.values()]; return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); };
    cv.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size === 2) { pinching = true; d0 = dist(); if (M.Camera) M.Camera.end(); } }, true);
    cv.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size !== 2 || !pinching) return;
      const d = dist(); if (d0 > 8 && d / d0 > 1.35) { zoomIn(); d0 = d; } else if (d0 > 8 && d / d0 < 0.74) { zoomOut(); d0 = d; }
    }, true);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => cv.addEventListener(n, e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinching = false; }, true));
    cv.addEventListener('wheel', e => { if (!M.Game.running || M.Game.frozen) return; e.preventDefault(); const t = performance.now(); if (t - wheelT < 140) return; wheelT = t; e.deltaY < 0 ? zoomIn() : zoomOut(); }, { passive: false });
  }
  function init() {
    const gi = gearIcon(); $('btn-gear').style.backgroundImage = 'url(' + gi + ')';
    $('btn-gear').addEventListener('click', e => { e.stopPropagation(); setGear(!body.classList.contains('gear-open')); });
    $('gear-menu').addEventListener('click', () => setTimeout(() => setGear(false), 0));
    document.addEventListener('pointerdown', e => { if (body.classList.contains('gear-open') && !e.target.closest('.hud-btns')) setGear(false); }, true);
    const saved = M.Store.get(KEY); if (typeof saved === 'number') M.C.ZOOM_OFF = saved;
    $('zoom-in').addEventListener('click', zoomIn); $('zoom-out').addEventListener('click', zoomOut);
    addEventListener('keydown', e => { if (e.ctrlKey || e.metaKey || e.altKey || !M.Game.running || (e.target && e.target.tagName === 'INPUT')) return; if (e.key === '+' || e.key === '=') zoomIn(); else if (e.key === '-' || e.key === '_') zoomOut(); });
    bindPinch($('game') || document.querySelector('canvas'));
    apply();
  }
  M.HUD2 = { init, zoomIn, zoomOut, setZoom, level, pinching: () => pinching, setGear };
})(window.MPH);
