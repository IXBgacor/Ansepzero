/* Panel dialog: halaman teks + pilihan. Listener dipasang sekali (delegasi). Dengan jeda anti-ketuk-ganda. */
(function (M) {
  const $ = id => document.getElementById(id), now = () => performance.now(), A = M.Audio;
  let root, box, nameEl, badgeEl, icEl, textEl, actEl, footEl, xBtn;
  let raf = 0, revealing = false, vEl = null, hEl = null, node = null, page = 0, open = false, guardUntil = 0, coolUntil = 0, reached = false, bound = false, sel = -1;

  function icon(key) { const g = icEl.getContext('2d'); g.clearRect(0, 0, 16, 16); g.imageSmoothingEnabled = false;
    const s = M.Sprites.icons && M.Sprites.icons[key]; if (s) g.drawImage(s, 0, 0); }
  function btn(label, a, i) { const b = document.createElement('button'); b.type = 'button'; b.className = a === 'choice' ? 'dlg-choice' : 'dlg-next';
    b.textContent = label; b.dataset.a = a; if (i != null) b.dataset.i = i; actEl.appendChild(b); return b; }
  /* v2.0: teks muncul bertahap. Seluruh teks tetap ada di DOM (bagian belum tampil disembunyikan) sehingga tata letak tidak bergeser. */
  const SYM = /[★☆✔☑✘✕⚠☐⚑🔊🔇🏅📘🔒▶]/, REDUCE = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function stopType() { if (raf) cancelAnimationFrame(raf); raf = 0; revealing = false; }
  function finishType() { if (!revealing) return false; stopType(); vEl.textContent += hEl.textContent; hEl.textContent = ''; return true; }
  function typeText(full) {
    stopType(); textEl.textContent = '';
    if (!full || full.length < 8 || SYM.test(full) || REDUCE()) { textEl.textContent = full || ''; return; }
    vEl = document.createElement('span'); hEl = document.createElement('span'); hEl.style.visibility = 'hidden'; hEl.textContent = full; textEl.append(vEl, hEl);
    let n = 0; revealing = true;
    const step = () => { n = Math.min(full.length, n + 2); vEl.textContent = full.slice(0, n); hEl.textContent = full.slice(n);
      if (n < full.length) raf = requestAnimationFrame(step); else { raf = 0; revealing = false; } };
    raf = requestAnimationFrame(step);
  }
  function render() {
    const last = page >= node.pages.length - 1;
    box.dataset.tone = node.tone || 'info'; nameEl.textContent = node.title || '';
    badgeEl.textContent = node.badge || ''; badgeEl.hidden = !node.badge; icon(node.icon);
    typeText(node.pages[page]); textEl.scrollTop = 0;
    actEl.textContent = '';
    if (!last) btn('Lanjut ▸', 'next');
    else if (node.choices && node.choices.length) node.choices.forEach((c, i) => btn((i + 1) + '. ' + c.label, 'choice', i));
    else btn('Tutup', 'close');
    if (last && !reached) { reached = true; if (node.onLastPage) node.onLastPage(); }
    const f = typeof node.footer === 'function' ? node.footer() : node.footer;
    footEl.textContent = f || ''; footEl.hidden = !f;
    guardUntil = now() + 280;                       // abaikan ketukan ulang yang terlalu cepat
    sel = -1;
    const isChoice = !!actEl.querySelector('.dlg-choice');
    /* v0.4²: halaman pilihan TIDAK menyorot jawaban otomatis (mencegah Enter/E yang masih tertahan memilih jawaban 1 tanpa sengaja). */
    const first = isChoice ? null : actEl.querySelector('button'); if (first) { try { first.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } }
    if (isChoice && document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  function act(a, i) {
    if (!open || now() < guardUntil) return;
    if (a === 'next' && finishType()) return;       // ketuk pertama menuntaskan teks, ketuk berikutnya melanjutkan
    if (a === 'next') { page++; render(); A.voice(node.title, node.pages[page]); }
    else if (a === 'close') close();
    else if (a === 'choice') {
      const c = node.choices[i]; if (!c) return;
      A.sfx('select');
      const res = c.pick ? c.pick() : null;
      if (res && res.pages) { node = res; page = 0; reached = false; render(); } else close();
    }
  }
  function show(n) {
    if (open || now() < coolUntil || !n || !n.pages || !n.pages.length) return false;
    init(); open = true; node = n; page = 0; reached = false; root.hidden = false; M.Game.freeze(true); render();
    if (n.sfx) A.sfx(n.sfx); else { if (!A.recent('interact', 160)) A.sfx('dlgOpen'); A.voice(n.title, n.pages[0]); }   // v0.5: NPC = file SFX; lainnya = blip sintesis: bunyi buka dialog + blip bicara pendek
    return true;
  }
  function close(silent) {
    if (!open) return; stopType(); A.npcStop(); if (silent !== true) A.sfx('dlgClose'); open = false; node = null; root.hidden = true; coolUntil = now() + 350;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    M.Game.freeze(false);
  }
  function init() {
    if (bound) return; bound = true;
    root = $('dialog'); box = $('dlg-box'); nameEl = $('dlg-name'); badgeEl = $('dlg-badge'); icEl = $('dlg-ic');
    textEl = $('dlg-text'); actEl = $('dlg-actions'); footEl = $('dlg-foot'); xBtn = $('dlg-x');
    actEl.addEventListener('click', e => { const b = e.target.closest('button'); if (b) act(b.dataset.a, +b.dataset.i); });
    textEl.addEventListener('click', () => { if (open) finishType(); });
    xBtn.addEventListener('click', () => { if (open && now() >= guardUntil) close(); });
  }
  /* Keyboard dialog (dipanggil main.js, satu pintu): Enter/E = lanjut/tutup atau konfirmasi pilihan yang disorot;
     angka 1-9 = pilih jawaban langsung; panah/W S = pindah sorotan. Mengembalikan true bila tombol dipakai. */
  function setSel(i) {
    const bs = actEl.querySelectorAll('.dlg-choice'); if (!bs.length) return;
    sel = (i + bs.length) % bs.length; bs.forEach((b, j) => b.classList.toggle('sel', j === sel));
    try { bs[sel].focus({ preventScroll: false }); } catch (e) { /* abaikan */ }
  }
  function handleKey(e) {
    if (!open || e.ctrlKey || e.metaKey || e.altKey) return false;
    const k = e.key, code = e.code || '', choices = actEl.querySelectorAll('.dlg-choice');
    if (/^[1-9]$/.test(k)) { if (e.repeat) return true; const b = choices[+k - 1]; if (b) act('choice', +b.dataset.i); return true; }
    if (code === 'ArrowDown' || code === 'KeyS' || code === 'ArrowUp' || code === 'KeyW') {
      if (choices.length) { if (!e.repeat) setSel(sel < 0 ? (code === 'ArrowUp' || code === 'KeyW' ? choices.length - 1 : 0) : sel + (code === 'ArrowDown' || code === 'KeyS' ? 1 : -1)); }
      else if (code === 'ArrowDown' || code === 'KeyS') textEl.scrollTop += 40; else textEl.scrollTop -= 40;      // teks panjang: gulir
      return true;
    }
    if (k === 'Enter' || code === 'NumpadEnter' || code === 'KeyE' || k === ' ') {
      if (e.repeat) return true;
      if (choices.length) { if (sel >= 0 && choices[sel]) act('choice', +choices[sel].dataset.i); }   // tanpa sorotan: tidak melakukan apa pun
      else { const b = actEl.querySelector('button'); if (b) act(b.dataset.a); }
      return true;
    }
    return false;
  }
  M.Dialog = { init, show, close, handleKey, isOpen: () => open, canOpen: () => !open && now() >= coolUntil };
})(window.MPH);
