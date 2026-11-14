/* Sepeda pribadi v3.1 — dimiliki pemain sejak awal game. Tombol SEPEDA (atau B) naik/turun di mana saja.
   - Naik sepeda: kecepatan ~1,9x jalan kaki; LARI/Shift saat bersepeda = kayuh cepat (+28%). Tabrakan memakai hitbox pemain yang sama (jalan setapak & jembatan tetap bisa dilalui, air tidak).
   - Otomatis turun saat: bicara/berinteraksi dengan NPC atau objek, naik kendaraan, cutscene, atau game dimulai ulang. Posisi/mode tidak disimpan. */
(function (M) {
  'use strict';
  const D = M.DIR, S = M.Sprites, MULT = 1.9, BOOST = 1.28;
  let riding = false, dist = 0, bound = false, free = 0, bikes = null;
  const cutscene = () => !!((M.Cutscene && M.Cutscene.active) || M.Game.cine);
  const can = () => M.Game.running && !M.Game.frozen && !cutscene() && !(M.Vehicles && M.Vehicles.driving()) && !M.Dialog.isOpen();
  const $ = id => document.getElementById(id);
  function sync() { const b = $('btn-bike'); if (b) { b.classList.toggle('on', riding); b.setAttribute('aria-pressed', riding ? 'true' : 'false'); } }
  function mount() { if (riding || !can()) return false; riding = true; dist = 0; sync(); return true; }
  function dismount() { if (!riding) return false; riding = false; sync(); return true; }
  const toggle = () => (riding ? dismount() : mount());

  /* ---- sprite pengendara + sepeda (digambar sekali, prosedural). 8 bingkai = satu putaran engkol:
     kaki mengayuh (IK dua tulang: paha-betis mengikuti pedal), roda berputar, badan sedikit berayun di tampak depan/belakang. ---- */
  const COL = { hat: '#487a38', hatD: '#3a6a2e', band: '#6b4524', skin: '#f0c090', shirt: '#4f8a3f', shirtD: '#3f7132', pack: '#7a4a24', pants: '#33402c', pantsF: '#232d1e', boot: '#2a1a10', hair: '#3a2a1a',
                frame: '#d8352a', frameD: '#a82018', tire: '#1a1a1a', rim: '#b8b8b8', spoke: '#8a8a8a', metal: '#555', grip: '#2a2a2a' };
  function build() {
    const mk = (w, h, fn) => { const c = M.util.cv(w, h), g = c.getContext('2d'); g.imageSmoothingEnabled = false; fn(g); return c; };
    const R = (g, col, x, y, w, h) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w || 1, h || 1); };
    const line = (g, col, x0, y0, x1, y1, th) => { const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2)); for (let i = 0; i <= n; i++) R(g, col, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, th || 1, th || 1); };
    const mirror = c => { const m = M.util.cv(c.width, c.height), g = m.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return m; };
    const wheel = (g, cx, cy, q) => {                                       // roda: ban + pelek + 4 jari-jari yang berputar (q = 0..3, langkah 22,5 derajat)
      for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) { const d = Math.hypot(x, y); if (d >= 3.2 && d <= 4.6) R(g, COL.tire, cx + x, cy + y); else if (d >= 2.6 && d < 3.2) R(g, COL.rim, cx + x, cy + y); }
      for (let k = 0; k < 4; k++) { const a = q * Math.PI / 8 + k * Math.PI / 2; for (let t = 0.8; t <= 2.5; t += 0.5) R(g, COL.spoke, cx + Math.cos(a) * t, cy + Math.sin(a) * t); }
      R(g, '#d8d8d8', cx, cy);
    };
    const leg = (g, col, hx, hy, fx, fy) => {                              // kaki: paha (5,8) + betis (6,2), lutut menekuk ke depan (+x)
      const A = 5.8, B = 6.2, dx = fx - hx, dy = fy - hy, d = Math.min(Math.hypot(dx, dy), A + B - 0.2), al = Math.atan2(dy, dx), be = Math.acos(Math.max(-1, Math.min(1, (A * A + d * d - B * B) / (2 * A * d))));
      const k1 = { x: hx + Math.cos(al - be) * A, y: hy + Math.sin(al - be) * A }, k2 = { x: hx + Math.cos(al + be) * A, y: hy + Math.sin(al + be) * A }, k = k1.x > k2.x ? k1 : k2;
      const ex = hx + Math.cos(al) * d, ey = hy + Math.sin(al) * d;
      line(g, col, hx, hy, k.x, k.y, 2); line(g, col, k.x, k.y, ex, ey, 2); R(g, COL.boot, ex - 1, ey - 1, 3, 2); R(g, COL.metal, ex - 1, ey + 1, 3, 1);
    };
    /* ---------- tampak samping (menghadap kanan), W=26, H=28, tanah di y=26 ---------- */
    const G = 26, side = k => mk(26, 28, g => {
      const ph = k * Math.PI / 4, cr = 2.2, cxn = 10, cyn = 23, px1 = cxn + Math.cos(ph) * cr, py1 = cyn + Math.sin(ph) * cr, px2 = cxn - Math.cos(ph) * cr, py2 = cyn - Math.sin(ph) * cr, sw = (k === 2 || k === 6) ? 1 : 0;
      R(g, '#00000030', 3, G, 20, 2); wheel(g, 5, 22, k % 4); wheel(g, 19, 22, k % 4);
      leg(g, COL.pantsF, 9, 13, px2, py2);                                                               // kaki jauh (lebih gelap), di belakang rangka
      line(g, COL.frameD, 10, 23, 9, 16); line(g, COL.frame, 9, 16, 16, 16); line(g, COL.frame, 10, 23, 16, 16); line(g, COL.frameD, 10, 23, 5, 22); line(g, COL.frameD, 9, 16, 5, 22); line(g, COL.metal, 16, 16, 19, 22);   // rangka + garpu
      R(g, COL.metal, 8, 22, 5, 1); R(g, '#777', 9, 22, 2, 2); R(g, COL.grip, 7, 14, 5, 2); R(g, COL.metal, 9, 16, 1, 1); line(g, COL.metal, 16, 16, 16, 13); R(g, COL.grip, 16, 12, 4, 1); R(g, COL.metal, 19, 13, 1, 2);   // engkol, jok, stem, stang
      R(g, COL.pack, 8, 7 + sw, 3, 5); R(g, '#5e381b', 8, 11 + sw, 3, 1);                                  // ransel di punggung
      line(g, COL.shirtD, 9, 13, 13, 8 + sw, 3); line(g, COL.shirt, 10, 12, 14, 8 + sw, 2);            // badan condong ke depan
      leg(g, COL.pants, 9, 13, px1, py1);                                                                  // kaki dekat (menutup rangka)
      line(g, COL.shirt, 13, 9 + sw, 16, 11, 2); line(g, COL.skin, 16, 11, 19, 12, 1); R(g, COL.skin, 19, 12, 1, 1);               // lengan ke stang
      R(g, COL.skin, 12, 3 + sw, 5, 5); R(g, '#222', 15, 5 + sw, 1, 1); R(g, COL.hatD, 11, 2 + sw, 7, 1); R(g, COL.hat, 12, 0 + sw, 5, 2); R(g, COL.band, 12, 1 + sw, 5, 1);   // kepala + topi
    });
    /* ---------- tampak depan / belakang, W=16, H=28 ---------- */
    const FG = 26, vert = (k, back) => mk(16, 28, g => {
      const ph = k * Math.PI / 4, sn = Math.sin(ph), sway = Math.round(sn * 0.9), xo = Math.round(Math.cos(ph) * 0.9), yl = 21 + sn * 2, yr = 21 - sn * 2;
      R(g, '#00000030', 3, FG, 10, 2);
      R(g, COL.tire, 7, 15, 2, 11); for (let y = 15 + ((k * 2) % 4); y < 26; y += 4) R(g, '#4a4a4a', 7, y, 2, 1);                       // roda (alur ban bergerak)
      R(g, COL.frameD, 7, 17, 2, 5); R(g, COL.frame, 7, 12, 2, 5);                                                                        // rangka
      R(g, COL.pantsF, 3 + xo, 14, 2, yl - 14); R(g, COL.boot, 2 + xo, yl - 1, 3, 2); R(g, COL.metal, 2 + xo, yl + 1, 3, 1);                           // kaki kiri
      R(g, COL.pants, 11 - xo, 14, 2, yr - 14); R(g, COL.boot, 11 - xo, yr - 1, 3, 2); R(g, COL.metal, 11 - xo, yr + 1, 3, 1);                         // kaki kanan
      R(g, COL.metal, 2, 11, 12, 1); R(g, COL.grip, 1, 11, 2, 1); R(g, COL.grip, 13, 11, 2, 1);                                           // stang
      if (!back) { R(g, COL.shirt, 5 + sway, 6, 6, 7); R(g, COL.shirtD, 5 + sway, 12, 6, 1); } else { R(g, COL.pack, 5 + sway, 6, 6, 7); R(g, '#5e381b', 5 + sway, 12, 6, 1); R(g, COL.shirt, 4 + sway, 7, 1, 4); R(g, COL.shirt, 11 + sway, 7, 1, 4); }
      line(g, COL.shirt, 5 + sway, 8, 2, 11, 1); line(g, COL.shirt, 10 + sway, 8, 13, 11, 1); R(g, COL.skin, 1, 11, 1, 1); R(g, COL.skin, 14, 11, 1, 1);   // lengan ke stang
      R(g, back ? COL.hair : COL.skin, 6 + sway, 2, 5, 4); R(g, COL.hatD, 5 + sway, 2, 7, 1); R(g, COL.hat, 6 + sway, 0, 5, 2); R(g, COL.band, 6 + sway, 1, 5, 1);
      if (!back) { R(g, '#222', 7 + sway, 4, 1, 1); R(g, '#222', 9 + sway, 4, 1, 1); }
    });
    const out = { 3: [], 2: [], 0: [], 1: [] };
    for (let k = 0; k < 8; k++) { const sd = side(k); out[3].push(sd); out[2].push(mirror(sd)); out[0].push(vert(k, false)); out[1].push(vert(k, true)); }
    return out;
  }
  function draw(ctx, cx, cy, P) {
    bikes = bikes || build(); const moving = Math.hypot(P.vx, P.vy) > 3, f = moving ? Math.floor(dist / 7) % 8 : 0, im = bikes[P.dir][f];
    ctx.drawImage(im, M.View.snap(P.x - im.width / 2 - cx), M.View.snap(P.y - 26 - cy));
  }
  function tick(dt) {
    if (riding && (cutscene() || (M.Vehicles && M.Vehicles.driving()))) dismount();
    if (!bound || riding) return;                                           // petunjuk singkat (maks. 2x per perangkat, setelah 4 dtk bebas bermain)
    if (can()) { free += dt || 0.016; if (free > 4) { free = -1e9; const n = M.Store.get('mph.bikehint') || 0; if (n < 2) { M.Store.set('mph.bikehint', n + 1); if (M._toast) M._toast('Kamu punya sepeda! Tombol SEPEDA (atau B) untuk naik/turun.'); } } }
  }
  function init() {
    if (bound) return; bound = true; const b = $('btn-bike');
    b.addEventListener('pointerdown', e => { if (e.button > 0) return; e.preventDefault(); toggle(); });
    b.addEventListener('click', e => { if (e.detail === 0) toggle(); });
    addEventListener('keydown', e => { if ((e.key === 'b' || e.key === 'B') && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat && M.Game.running && !/INPUT|TEXTAREA/.test((document.activeElement || {}).nodeName || '')) { e.preventDefault(); toggle(); } });
  }
  M.Bike = { init, tick, mount, dismount, toggle, riding: () => riding, mult: run => MULT * (run ? BOOST : 1), advance: (moved, dt) => { dist += moved * dt; }, draw, frames: () => (bikes = bikes || build()) };
})(window.MPH);
