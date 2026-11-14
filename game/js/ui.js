/* UI v0.4: tracker ringkas (bab, misi aktif, tujuan, skor, selesai x/30), layar Bab & Misi, briefing misi otomatis,
   popup poin/bab, evaluasi akhir, reset progres. */
(function (M) {
  const $ = id => document.getElementById(id), Ms = () => M.Missions;
  let bound = false, panelOpen = false, panelMenu = false, evalOpen = false, evalPending = false, zone = 'far';
  let armed = false, armT = null, evArmed = false, evArmT = null;
  const popQ = []; let popBusy = false, popT = null;
  function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  /* ---------- tracker (HUD) ---------- */
  function refreshTracker() {
    const act = Ms().active(), sc = Ms().score(), n = Ms().defs.length, objs = $('tr-objs'); objs.textContent = '';
    $('tr-score').textContent = 'Skor ' + sc.total; $('tr-count').textContent = Ms().completedCount() + '/' + n + ' selesai';
    if (!act) {
      $('tr-ch').textContent = 'Kampanye tamat'; $('tr-name').textContent = 'Semua misi selesai ✔'; $('tr-fill').style.width = '100%';
      objs.appendChild(el('span', 'tr-obj on', 'Ketuk untuk lihat hasil · ' + sc.total + '/' + sc.max));
    } else {
      const p = Ms().progress(act.id), nx = Ms().availableSteps()[0];
      $('tr-ch').textContent = 'Bab ' + act.ch + '/' + Ms().chapters.length + ' · Misi ' + (act.index + 1) + '/' + n;
      $('tr-name').textContent = act.title; $('tr-fill').style.width = (p.done / p.total * 100) + '%';
      objs.appendChild(el('span', 'tr-obj', '☐ ' + (nx ? nx.s.label : act.goal) + ' · ' + p.done + '/' + p.total));
    }
    refreshLive();
  }
  /* Status langsung bila tujuan sekarang adalah "amati area bahaya": zona bahaya / jarak aman / belum terlihat. */
  function refreshLive() {
    const live = $('tr-live'), obs = Ms().availableSteps().find(x => x.s.t === 'observe'); let txt = '', cls = '';
    if (obs && Ms().targets().includes(obs.s.poi) && !M.Game.frozen) {
      if (zone === 'danger') { txt = '⚠ Zona bahaya! Mundur.'; cls = 'bad'; }
      else if (zone === 'safe') { txt = '✔ Jarak aman: tekan INTERAKSI'; cls = 'ok'; }
      else if (zone === 'offscreen') txt = 'Geser agar area terlihat';
      else if (zone === 'near') txt = 'Dekati cincin hijau (jangan lebih dekat)';
      else if (zone === 'far') txt = 'Ikuti panah kuning ke area bahaya';
    }
    if (live.textContent !== txt) live.textContent = txt;
    live.className = 'tr-live ' + cls; live.hidden = !txt;
  }
  function setZone(z) { if (z === zone) return; zone = z; refreshLive(); }

  function refreshMenu() {
    const sc = Ms().score(), a = Ms().active();
    $('menu-prog').textContent = 'Progres: ' + Ms().completedCount() + '/' + Ms().defs.length + ' misi selesai' + (a ? ' · Bab ' + a.ch + ' · Misi aktif: ' + a.title : ' · Tamat') + ' · Skor ' + sc.total + '/' + sc.max + (M.Store.available ? '' : ' (tidak tersimpan)');
    $('btn-eval').hidden = !Ms().allComplete();
  }

  /* ---------- layar daftar bab & misi ---------- */
  function missionBody(d) {
    const b = el('div', 'mp-body'), p = Ms().progress(d.id), lock = !Ms().isUnlocked(d.id) && !p.complete;
    if (lock) { b.appendChild(el('p', 'mp-hint', 'Terbuka setelah misi sebelumnya selesai.')); return b; }
    b.appendChild(el('p', null, d.desc)); b.appendChild(el('p', 'mp-goal', 'Tujuan: ' + d.goal));
    const bar = el('div', 'mp-bar'); bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', String(p.total)); bar.setAttribute('aria-valuenow', String(p.done));
    const fill = document.createElement('i'); fill.style.width = (p.done / p.total * 100) + '%'; bar.appendChild(fill); b.appendChild(bar);
    b.appendChild(el('p', 'mp-num', 'Progres: ' + p.done + '/' + p.total + ' · Skor: ' + Ms().missionScore(d.id) + '/' + Ms().missionMax(d.id) + ' (hadiah hingga ' + Ms().missionMax(d.id) + ' poin)'));
    const ul = document.createElement('ul');
    for (const s of d.steps) { const on = Ms().has(d.id, s.id); ul.appendChild(el('li', on ? 'on' : '', (on ? '☑ ' : '☐ ') + s.label + (on ? '  +' + Ms().objPoints(d.id, s.id) : '  (maks ' + s.pts + ')'))); }
    b.appendChild(ul);
    if (!p.complete) b.appendChild(el('p', 'mp-hint', 'Petunjuk: ' + d.hint));
    else if (d.edu) b.appendChild(el('p', 'mp-edu', '📘 ' + d.edu));
    if (d.verify && M.C.SHOW_VERIFY_TAGS) b.appendChild(el('p', 'mp-verify', '⚑ Perlu verifikasi sumber resmi sebelum publikasi'));
    return b;
  }
  function renderPanel() {
    const list = $('mp-list'); list.textContent = ''; const sc = Ms().score(), act = Ms().active(), n = Ms().defs.length;
    list.appendChild(el('p', 'mp-total', (act ? 'Bab aktif: ' + act.ch + '. ' + Ms().chapter(act.ch).title + ' · Misi aktif: ' + (act.index + 1) + '. ' + act.title : 'Kampanye tamat') +
      ' · Selesai ' + Ms().completedCount() + '/' + n + ' · Skor ' + sc.total + '/' + sc.max));
    for (const c of Ms().chapters) {
      const cp = Ms().chapterProgress(c.id), cs = Ms().chapterScore(c.id), isAct = !!act && act.ch === c.id;
      const lockCh = !cp.complete && !isAct && Ms().chapterMissions(c.id).every(d => !Ms().isUnlocked(d.id) && !Ms().progress(d.id).done);
      const ch = document.createElement('details'); ch.className = 'mp-ch' + (cp.complete ? ' done' : '') + (lockCh ? ' locked' : ''); if (isAct) ch.open = true;
      const sm = document.createElement('summary');
      const head = el('div', 'mp-head'); head.append(el('h3', null, (lockCh ? '🔒 ' : '') + 'Bab ' + c.id + ' · ' + c.title), el('span', 'mp-st', cp.complete ? 'Selesai ✔' : isAct ? 'Aktif' : lockCh ? 'Terkunci' : cp.done + '/' + cp.total));
      const bar = el('div', 'mp-bar'); const fill = document.createElement('i'); fill.style.width = (cp.done / cp.total * 100) + '%'; bar.appendChild(fill);
      sm.append(head, bar, el('p', 'mp-num', c.desc + ' · ' + cp.done + '/' + cp.total + ' misi · ' + cs + '/' + Ms().chapterMax(c.id) + ' poin')); ch.appendChild(sm);
      if (cp.complete && !panelMenu && M.Chapters && M.Cutscene.has('ch' + c.id)) {             // v0.5⁴: putar ulang cutscene bab yang sudah selesai
        const row = el('div', 'mp-replay'), rb = document.createElement('button'); rb.type = 'button'; rb.className = 'btn-alt mp-rp'; rb.textContent = '▶ Putar Cutscene Bab ' + c.id; rb.addEventListener('click', () => { if (M.Chapters.replay(c.id)) closePanel(true); }); row.appendChild(rb); ch.appendChild(row);
      }
      for (const d of Ms().chapterMissions(c.id)) {
        const st = Ms().status(d.id), md = document.createElement('details'); md.className = 'mp-ms ' + (st === 'Selesai' ? 'done' : st === 'Aktif' ? 'act' : 'locked'); if (st === 'Aktif') md.open = true;
        const s2 = document.createElement('summary'); s2.append(el('span', 'mp-ico', st === 'Selesai' ? '✔' : st === 'Aktif' ? '▶' : '🔒'), el('span', 'mp-mt', d.code + '  ' + d.title), el('span', 'mp-st', st));
        md.append(s2, missionBody(d)); ch.appendChild(md);
      }
      list.appendChild(ch);
    }
    if (Ms().allComplete()) { const b = el('button', 'btn-main mp-eval', 'Lihat Evaluasi Akhir'); b.type = 'button'; b.addEventListener('click', () => { closePanel(); requestEval(); }); list.appendChild(b); }
  }
  function openPanel(fromMenu) {
    const menu = fromMenu === true;
    if (panelOpen || evalOpen || M.Dialog.isOpen() || (!menu && !M.Game.running)) return;
    panelOpen = true; panelMenu = menu; M.Audio.sfx('open'); renderPanel(); const root = $('missions'); root.classList.toggle('over-menu', menu); root.hidden = false;
    if (!menu) M.Game.freeze(true);
    const x = $('mp-close'); if (x) x.focus({ preventScroll: true });
  }
  function closePanel(silent) {
    if (!panelOpen) return; if (silent !== true) M.Audio.sfx('close'); panelOpen = false; $('missions').hidden = true; $('missions').classList.remove('over-menu');
    if (!panelMenu) M.Game.freeze(false);
    panelMenu = false; if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  /* ---------- evaluasi akhir ---------- */
  function renderEval() {
    const d = M.Eval.summary(), box = $('ev-body'); box.textContent = '';
    box.append(el('p', 'ev-stars', '★'.repeat(d.stars) + '☆'.repeat(3 - d.stars)), el('p', 'ev-rank', d.title),
      el('p', 'ev-score', 'Skor akhir: ' + d.total + ' / ' + d.max + ' (' + d.pct + '%)'), el('p', 'ev-msg', d.msg), el('p', 'ev-hint', '▾ Gulir ke bawah: rincian per bab & catatan belajar'));
    for (const r of d.rows) { const c = el('article', 'mp-card'); const h = el('div', 'mp-head');
      h.append(el('h3', null, r.name), el('span', 'mp-st', r.score + '/' + r.max)); c.append(h, el('p', 'mp-num', r.notes.join(' · '))); box.appendChild(c); }
    const t = el('div', 'mp-card ev-tips'); t.appendChild(el('h3', null, 'Catatan belajar'));
    const ul = document.createElement('ul'); d.tips.forEach(x => ul.appendChild(el('li', null, x))); t.appendChild(ul); box.appendChild(t);
    box.scrollTop = 0;
  }
  function updateEvalHint() {                         // petunjuk gulir hanya jika isi lebih tinggi dari kotak & belum digulir
    const box = $('ev-body'), h = box.querySelector('.ev-hint'); if (h) h.hidden = box.scrollHeight <= box.clientHeight + 2 || box.scrollTop > 8;
  }
  function requestEval() { if (Ms().allComplete()) evalPending = true; }       // tampil begitu dialog/panel tertutup (lihat tick)
  function openEval() {
    if (evalOpen || !Ms().allComplete() || M.Dialog.isOpen()) return;
    if (panelOpen) closePanel(true);
    evalOpen = true; M.Audio.sfx('open'); renderEval(); $('evalsec').hidden = false; if (M.Game.running) M.Game.freeze(true); updateEvalHint(); const b = $('ev-ok'); if (b) b.focus({ preventScroll: true });
  }
  function closeEval(silent) { if (!evalOpen) return; if (silent !== true) M.Audio.sfx('close'); evalOpen = false; $('evalsec').hidden = true; disarmEvalReset(); M.Game.freeze(false); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }

  /* ---------- popup poin/bab (antre; tampil hanya saat permainan tidak sedang dibekukan dialog/panel) ---------- */
  function pop(text, kind) { popQ.push({ text, kind: kind || '' }); }
  function clearPop() { popQ.length = 0; clearTimeout(popT); popBusy = false; $('popup').hidden = true; }
  function tick() {
    if (M.Game.frozen) return;
    if (evalPending) { evalPending = false; popQ.length = 0; openEval(); return; }
    const a = Ms().active();                            // briefing otomatis saat misi baru aktif
    if (a && !Ms().isSeen(a.id) && M.Dialog.canOpen()) { if (M.Dialog.show(M.Content.briefing(a))) Ms().setSeen(a.id); return; }
    if (popBusy || !popQ.length) return;
    const it = popQ.shift(), p = $('popup'); popBusy = true;
    p.textContent = it.text; p.className = it.kind; p.hidden = false; p.style.animation = 'none'; void p.offsetWidth; p.style.animation = '';
    popT = setTimeout(() => { p.hidden = true; popBusy = false; }, 2400);
  }
  function onMissionEvent(ev) {
    refreshTracker(); refreshMenu(); if (panelOpen) renderPanel();
    if (!ev) return;
    if (ev.type === 'reset') { clearPop(); evalPending = false; return; }
    if (ev.type === 'objective') {
      M.Audio.sfx('reward', { delay: 0.5 });                        // v0.4³: skor/reward (setelah bunyi jawaban)
      const s = Ms().def(ev.mid).steps.find(x => x.id === ev.sid); pop('✔ ' + (s ? s.label : 'Langkah') + ' · +' + ev.pts + ' poin', 'ok');
    } else if (ev.type === 'mission') {
      M.Audio.sfx('mission', { delay: 0.5 });                       // v0.4³: misi selesai
      pop('★ Misi selesai: ' + Ms().def(ev.mid).title + ' · ' + Ms().missionScore(ev.mid) + '/' + Ms().missionMax(ev.mid), 'star');
      if (ev.chapterDone) pop('🏅 Bab ' + Ms().def(ev.mid).ch + ' selesai: ' + Ms().chapter(Ms().def(ev.mid).ch).title, 'star');
    }
  }

  /* ---------- umum ---------- */
  function closeTopModal() {
    if (M.AudioUI && M.AudioUI.isOpen()) { M.AudioUI.close(); return true; }
    if (M.Dialog.isOpen()) { M.Dialog.close(); return true; }
    if (evalOpen) { closeEval(); return true; }
    if (panelOpen) { closePanel(); return true; }
    return false;
  }
  function closeAll() { if (M.Dialog.isOpen()) M.Dialog.close(true); closeEval(true); closePanel(true); if (M.AudioUI) M.AudioUI.close(true); clearPop(); }
  const setSafety = on => { const s = $('safety'); if (s.hidden === on) s.hidden = !on; };

  function disarm() { armed = false; clearTimeout(armT); $('btn-reset').textContent = 'Reset Progres Misi'; }
  function onReset() {
    const b = $('btn-reset');
    if (!armed) { armed = true; b.textContent = 'Yakin? Ketuk lagi untuk hapus progres'; armT = setTimeout(disarm, 4000); return; }
    disarm(); const ok = Ms().reset();
    M.notify(ok ? 'Progres misi dan skor dihapus. Mulai dari awal.' : 'Progres direset, tetapi data tersimpan gagal dihapus.', ok ? 'ok' : undefined);
  }
  function disarmEvalReset() { evArmed = false; clearTimeout(evArmT); const b = $('ev-reset'); if (b) b.textContent = 'Ulangi dari Awal'; }
  function onEvalReset() {
    const b = $('ev-reset');
    if (!evArmed) { evArmed = true; b.textContent = 'Yakin? Ketuk lagi (skor dihapus)'; evArmT = setTimeout(disarmEvalReset, 4000); return; }
    disarmEvalReset(); const ok = Ms().reset(); closeEval(true);
    M.notify(ok ? 'Progres misi dan skor dihapus. Mulai dari awal.' : 'Progres direset, tetapi data tersimpan gagal dihapus.', ok ? 'ok' : undefined);
  }
  function init() {
    if (bound) return; bound = true;
    $('btn-missions').addEventListener('click', () => openPanel(false));
    $('btn-chapters').addEventListener('click', () => openPanel(true));
    $('mp-close').addEventListener('click', () => closePanel());
    $('btn-reset').addEventListener('click', onReset);
    $('btn-eval').addEventListener('click', openEval);
    $('ev-body').addEventListener('scroll', updateEvalHint, { passive: true });
    $('ev-ok').addEventListener('click', () => closeEval()); $('ev-close').addEventListener('click', () => closeEval()); $('ev-reset').addEventListener('click', onEvalReset);
    Ms().onChange(onMissionEvent);
    refreshTracker(); refreshMenu();
  }
  M.UI = { init, tick, openPanel, closePanel, openEval, closeEval, requestEval, closeTopModal, closeAll, setSafety, setZone, refreshMenu,
           panelOpen: () => panelOpen, evalOpen: () => evalOpen, disarmReset: () => { disarm(); disarmEvalReset(); } };
})(window.MPH);
