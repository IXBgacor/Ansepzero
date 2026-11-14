/* GUI v0.6 — ikon pixel-art (bukan emoji), panel misi yang bisa di-minimize, dan penggantian simbol emoji di seluruh UI dengan ikon pixel.
   - Ikon digambar dari kode (sprites_v06.js: S.ui) lalu dipasang sebagai variabel CSS --ic-*.
   - MutationObserver mengganti karakter emoji/simbol pada teks UI (mis. ★ ✔ ⚠ 🔊) menjadi <span class="px-ic i-..."> tanpa mengubah kode lain.
   - Status minimize panel disimpan selama sesi (sessionStorage 'mph.trmin'). */
(function (M) {
  const S = M.Sprites, MAP = { '★': 'star', '☆': 'star0', '✔': 'check', '☑': 'check', '✘': 'close', '✕': 'close', '⚠': 'warn', '☐': 'box', '⚑': 'flag', '🔊': 'sound', '🔇': 'mute', '🏅': 'medal', '📘': 'book', '🔒': 'lock', '▶': 'play', '▸': 'chev', '▾': 'down' };
  const ALT = Object.keys(MAP).join('|'), RE = new RegExp(ALT, 'g'), RT = new RegExp(ALT), $ = id => document.getElementById(id);
  function setVars() { const st = document.documentElement.style; Object.keys(S.ui).forEach(k => st.setProperty('--ic-' + k, 'url(' + S.uiURL(k) + ')')); }
  function iconize(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentNode && !/^(SCRIPT|STYLE|TEXTAREA|OUTPUT)$/.test(n.parentNode.nodeName) && RT.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) }), list = [];
    RE.lastIndex = 0; while (w.nextNode()) list.push(w.currentNode);
    for (const n of list) { RE.lastIndex = 0; const frag = document.createDocumentFragment(), t = n.nodeValue; let last = 0, m; RE.lastIndex = 0;
      while ((m = RE.exec(t))) { if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index))); const sp = document.createElement('span'); sp.className = 'px-ic i-' + MAP[m[0]]; sp.setAttribute('role', 'img'); sp.setAttribute('aria-label', MAP[m[0]]); frag.appendChild(sp); last = m.index + m[0].length; }
      if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last))); if (n.parentNode) n.parentNode.replaceChild(frag, n); }
  }
  let busy = false;
  function observe() {
    new MutationObserver(ms => { if (busy) return; busy = true; try { const seen = new Set(); for (const m of ms) { const r = m.type === 'characterData' ? m.target.parentNode : m.target; if (r && r.nodeType === 1 && !seen.has(r)) { seen.add(r); iconize(r); } } muteState(); } finally { busy = false; } })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  const muteState = () => { const b = $('btn-mute'); if (b) b.classList.toggle('is-muted', !!b.querySelector('.i-mute') || b.textContent.indexOf('🔇') >= 0); };

  /* ---------- panel misi: minimize / expand ---------- */
  const KEY = 'mph.trmin'; let min = false; try { min = sessionStorage.getItem(KEY) === '1'; } catch (e) { /* abaikan */ }       // v2.1: bisa dikecilkan lagi (diingat selama sesi)
  function applyMin(anim) {
    document.body.classList.toggle('tr-min', min); const b = $('tr-min'); if (b) { b.setAttribute('aria-label', min ? 'Buka panel misi' : 'Kecilkan panel misi'); b.setAttribute('aria-expanded', String(!min)); }
    try { sessionStorage.setItem(KEY, min ? '1' : '0'); } catch (e) { /* abaikan */ }
    setTimeout(() => window.dispatchEvent(new Event('resize')), anim ? 320 : 0);           // hitung ulang area aman HUD setelah animasi
  }
  function miniText() {
    const c = $('tr-count'), o = $('tr-objs'), mini = $('tr-mini'); if (!mini || !c) return;
    const cnt = (c.textContent || '').trim(), has = o && o.textContent.trim().length > 0;
    const t = ((/(\d+\/\d+)/.exec(cnt) || [])[1] ? 'Misi ' + (/(\d+\/\d+)/.exec(cnt))[1] : cnt || 'Misi') + (has ? ' · Objective aktif' : ''); if (mini.textContent !== t) mini.textContent = t;      // guard: hindari loop observer
  }
  function buildMin() {
    const tr = $('btn-missions'); if (!tr || $('tr-min')) return;
    const mini = document.createElement('span'); mini.id = 'tr-mini'; mini.className = 'tr-mini'; tr.appendChild(mini);
    const b = document.createElement('button'); b.type = 'button'; b.id = 'tr-min'; b.className = 'tr-minbtn'; b.setAttribute('data-nosfx', ''); tr.appendChild(b);
    b.addEventListener('click', e => { e.stopPropagation(); min = !min; M.Audio && M.Audio.sfx && M.Audio.sfx('select'); applyMin(true); });
    tr.addEventListener('click', e => { if (min) { e.stopPropagation(); e.preventDefault(); min = false; applyMin(true); } }, true);           // saat diminimalkan, ketuk chip = buka kembali
    new MutationObserver(miniText).observe(tr, { childList: true, subtree: true, characterData: true }); miniText(); applyMin(false);
  }
  function init() { setVars(); buildMin(); iconize(document.body); observe(); muteState(); }
  M.GUI = { init, iconize, isMin: () => min, setMin: v => { min = !!v; applyMin(true); } };
})(window.MPH);
