/* v0.5² (dasar v0.5): setelah objective akhir simulasi selesai -> cutscene bantuan pemadam (cutscene.js) -> dialog penutup -> layar ending/skor/bintang/status tamat -> sertifikat.
   Cutscene hanya untuk pilihan "Ikut Membantu" yang menuntaskan simulasi, diputar tepat sekali per penamatan (penanda pendingCut hanya di memori), tidak ulang saat menu dibuka.
   v0.5 — Profil pemain (nama), Misi Terakhir (kebakaran besar + simulasi relawan), bintang akhir, ending, dan sertifikat.
   Penyimpanan TERPISAH dari progres misi: kunci 'mph.v05' (format v1). Save 'mph.save' (v0.2–v0.4³) tidak disentuh sehingga migrasi aman. */
(function (M) {
  const $ = id => document.getElementById(id), Ms = () => M.Missions, A = () => M.Audio, KEY = 'mph.v05', BAD = 'mph.v05.corrupt';
  const PTS = 20, MAXPTS = 100, LIMIT = 40;
  const def = () => ({ v: 1, name: '', choice: null, done: [], wrong: {}, evac: { emerg: false, talked: {}, safe: {} }, finished: false, stars: 0, score: 0, maxScore: 0, reasons: [], certNo: '', finishedAt: '' });
  let P = def(), pendingEnd = false, nameOpen = false, nameForced = false, endOpen = false, certOpen = false, vis = false, bound = false, tenseOn = false, pendingCut = false, pendingClosing = false;
  const sh = (text, a) => { let h = 7; for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0; const r = []; a = a.slice(); while (a.length) { h = (h * 1664525 + 1013904223) >>> 0; r.push(a.splice(h % a.length, 1)[0]); } return r; };

  /* ---------- penyimpanan + migrasi aman ---------- */
  function load() {
    const raw = M.Store.get(KEY); if (raw == null) return;
    try {
      const o = JSON.parse(raw); if (!o || typeof o !== 'object' || !(o.v >= 1)) throw new Error('format');
      const d = def(); if (o.v > 1) { P.locked = true; return; }               // dari versi lebih baru: jangan ditimpa
      d.name = typeof o.name === 'string' ? o.name.replace(/\s+/g, ' ').trim().slice(0, LIMIT) : '';
      d.choice = o.choice === 'help' || o.choice === 'skip' ? o.choice : null;
      d.done = Array.isArray(o.done) ? OBJ.map(x => x.id).filter(id => o.done.includes(id)) : [];
      if (o.wrong && typeof o.wrong === 'object') OBJ.forEach(x => { const n = Number(o.wrong[x.id]); if (Number.isInteger(n) && n > 0) d.wrong[x.id] = Math.min(99, n); });
      if (o.evac && typeof o.evac === 'object') { const e = o.evac; d.evac = { emerg: !!e.emerg, talked: {}, safe: {} }; ['talked', 'safe'].forEach(k => { if (e[k] && typeof e[k] === 'object') Object.keys(e[k]).forEach(id => { if (/^(v|lurah)/.test(id) && e[k][id]) d.evac[k][id] = 1; }); }); }
      else if (!o.finished) { d.done = []; d.choice = null; d.wrong = {}; }       // v0.6: save v0.5 yang belum tamat memakai objective lama (simulasi relawan) -> mulai ulang Misi Terakhir saja; nama & misi lain aman
      d.finished = !!o.finished; d.stars = [1, 2, 3].includes(o.stars) ? o.stars : 0; d.score = Number(o.score) || 0; d.maxScore = Number(o.maxScore) || 0;
      d.reasons = Array.isArray(o.reasons) ? o.reasons.filter(x => typeof x === 'string').slice(0, 8) : [];
      d.certNo = typeof o.certNo === 'string' ? o.certNo.slice(0, 40) : ''; d.finishedAt = typeof o.finishedAt === 'string' ? o.finishedAt.slice(0, 40) : '';
      if (d.finished && (!d.stars || !d.certNo)) d.finished = false;            // data tamat tidak lengkap: hitung ulang saat memenuhi syarat
      P = d;
    } catch (e) { if (M.Store.get(BAD) == null) M.Store.set(BAD, raw); M.Store.remove(KEY); P = def(); }
  }
  const save = () => { if (P.locked) return false; return M.Store.set(KEY, JSON.stringify({ v: 1, ver: M.C.VERSION, name: P.name, choice: P.choice, done: P.done, evac: P.evac, wrong: P.wrong, finished: P.finished, stars: P.stars, score: P.score, maxScore: P.maxScore, reasons: P.reasons, certNo: P.certNo, finishedAt: P.finishedAt })); };

  /* ---------- data objective simulasi relawan (aman: tugas pendukung di bawah arahan petugas) ---------- */
  /* v0.6: Misi Terakhir = Evakuasi Desa (tanpa memadamkan api). Objective digerakkan oleh js/evac.js. */
  const EVs = () => M.Evac;
  const OBJ = [
    { id: 'meet', pts: 5, poi: 'e_officer', label: 'Temui Petugas Lapangan di plaza desa' },
    { id: 'learn', pts: 10, poi: 'e_board', label: 'Pelajari jalur evakuasi di Peta Jalur Evakuasi' },
    { id: 'guide', pts: 20, poi: 'v1', get label() { return 'Bantu warga menemukan jalur aman (' + EVs().count('talked') + '/5)'; } },
    { id: 'gather', pts: 15, poi: 'e_assembly', get label() { return 'Arahkan warga ke titik kumpul (' + EVs().count('safeReg') + '/5 tiba)'; } },
    { id: 'assist', pts: 30, poi: 'v_mbah', get label() { return 'Pastikan lansia, anak, dan warga yang butuh bantuan tidak tertinggal (' + EVs().count('safeSpecial') + '/3)'; } },
    { id: 'report', pts: 10, poi: 'e_off2', label: 'Laporkan: area desa sudah dievakuasi' },
    { id: 'wait', pts: 10, poi: 'e_assembly', label: 'Tunggu arahan petugas di titik kumpul' }
  ];
  const byPoi = {};
  const objPts = o => P.done.includes(o.id) ? Math.max(Math.ceil(o.pts / 2), o.pts - 3 * (P.wrong[o.id] || 0)) : 0;
  const finalPts = () => OBJ.reduce((a, o) => a + objPts(o), 0);
  const finalDone = () => OBJ.every(o => P.done.includes(o.id));
  const nextObj = () => P.choice === 'help' ? OBJ.find(o => !P.done.includes(o.id)) || null : null;
  const allMissions = () => Ms().allComplete();
  const cutOn = () => !!(M.Cutscene && M.Cutscene.active);
  const fireVisible = () => allMissions() && !M.WorldState.fireOut('bigfire') && (!P.finished || pendingCut || cutOn());      // v0.5²: api tetap tampil sampai cutscene selesai
  const fireK = () => (cutOn() ? M.Cutscene.fireK() : 1);
  const targetPoi = () => !allMissions() || P.finished ? null : !P.choice ? 'e_officer' : (nextObj() ? EVs().target() : null);
  const nextLabel = () => { const o = nextObj(); return o ? o.label : ''; };
  function completeObj(id) { const o = OBJ.find(x => x.id === id); if (!o || P.done.includes(id)) return false; P.done.push(id); if (id === 'report') M.WorldState.apply('evacuation_sheltered'); save(); refreshTracker(); const last = finalDone(); A().sfx(last ? 'mission' : 'reward', { delay: 0.3 }); if (last) finish(); return true; }
  const fireCenter = () => { const p = M.World.byId.bigfire; return p ? M.World.center(p) : { x: 280, y: 40 }; };

  /* ---------- bintang & skor akhir ---------- */
  function calc() {
    const sc = Ms().score(), pct = sc.max ? sc.total / sc.max : 0, help = P.choice === 'help' && finalDone(), good = pct >= 0.7;
    const stars = help ? (good ? 3 : 2) : (good ? 2 : 1), fp = finalPts();
    const reasons = ['✔ Seluruh misi kampanye selesai (' + Ms().completedCount() + '/' + Ms().defs.length + ')',
      (good ? '✔' : '✘') + ' Skor kuis & misi ' + sc.total + '/' + sc.max + ' (' + Math.round(pct * 100) + '%; bintang penuh butuh minimal 70%)',
      help ? '✔ Simulasi Misi Terakhir diselesaikan (' + OBJ.length + '/' + OBJ.length + ' objective, +' + fp + ' poin)' : '✘ Simulasi Misi Terakhir dilewati (tanpa poin misi final)'];
    return { stars, reasons, score: sc.total + fp, maxScore: sc.max + MAXPTS };
  }
  function mkCert() { const d = new Date(), p2 = n => String(n).padStart(2, '0'); let r = ''; const al = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    try { const b = new Uint8Array(6); crypto.getRandomValues(b); b.forEach(x => r += al[x % al.length]); } catch (e) { for (let i = 0; i < 6; i++) r += al[Math.random() * al.length | 0]; }
    return 'MPH-' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + r; }
  function canFinish() { return allMissions() && !P.finished && (P.choice === 'skip' || (P.choice === 'help' && finalDone())); }
  function finish() {
    if (!canFinish()) return false;
    const c = calc(); P.finished = true; P.stars = c.stars; P.score = c.score; P.maxScore = c.maxScore; P.reasons = c.reasons; P.certNo = mkCert(); P.finishedAt = new Date().toISOString(); save(); refreshTracker();
    if (P.choice === 'help' && M.Cutscene && M.C.CUT_ENABLED !== false) { pendingCut = true; if (M.Audio) M.Audio.cutPreload(); } else { pendingEnd = true; M.WorldState.apply('ending_complete'); M.Evac.recover(); }   // v0.5²: cutscene hanya setelah objective akhir diselesaikan
    return true;
  }
  const certAllowed = () => P.finished && !!P.certNo && !!P.name && allMissions();
  const dateText = iso => { try { return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return iso.slice(0, 10); } };

  /* ---------- dialog Misi Terakhir ---------- */
  const foot = () => P.choice === 'help' ? 'Evakuasi Desa · ' + P.done.length + '/' + OBJ.length + ' · +' + finalPts() + ' poin' : 'Misi Terakhir — Evakuasi Desa';
  const build = poi => M.Evac.build(poi);

  /* ---------- tampilan: kebakaran besar, asap, suasana tegang ---------- */
  function sync() {
    M.Evac.tick();
    const v = fireVisible(), W = M.World;
    if (v !== vis) {
      vis = v; const p = W.byId.bigfire, i = W.pois.indexOf(p);
      if (v && i < 0) W.pois.push(p); else if (!v && i >= 0) W.pois.splice(i, 1);
      if (v) { const c = fireCenter(), pl = M.Player.state; if (Math.hypot(pl.x - c.x, pl.y - c.y) < 96 + 12) { pl.x = 49 * 16 + 8; pl.y = 14 * 16 + 14; } }   // pemain tidak boleh terjebak di area api
    }
    if (v !== tenseOn) { tenseOn = v; A().setTense(v, !v); document.body.classList.toggle('tense', v); }
    if (pendingCut && !M.Game.frozen && !M.Dialog.isOpen() && M.Dialog.canOpen()) {                       // dialog "FINAL COMPLETED" sudah ditutup -> putar cutscene (sekali)
      pendingCut = false;                                                                                  // v1.0: rangkaian ending = 'final' (api padam) -> 'ending' (inspeksi, hutan terselamatkan, warga pulang, perayaan) -> dialog penutup -> layar tamat
      const afterEnding = () => { M.WorldState.apply('ending_complete'); M.Evac.recover(); pendingClosing = true; };
      const afterFinal = () => { M.WorldState.apply('fires_out'); sync(); if (!M.Cutscene.play('ending', { chain: true, onEnd: afterEnding })) afterEnding(); };
      if (!M.Cutscene.start({ onEnd: afterFinal })) { afterFinal(); }
    }
    if (pendingClosing && !M.Game.frozen && !M.Dialog.isOpen() && M.Dialog.canOpen()) {                    // cutscene selesai, kamera sudah kembali ke pemain -> dialog penutup
      const poi = M.World.byId.e_off2; if (M.Dialog.show(closing(poi))) { pendingClosing = false; pendingEnd = true; }
    }
    if (pendingEnd && !M.Game.frozen && !M.Dialog.isOpen()) { pendingEnd = false; openEnd(); }
  }
  function closing(poi) {
    return { title: poi.name, icon: poi.icon, tone: 'good', badge: 'Evakuasi Desa selesai', footer: 'Misi Terakhir — Evakuasi Desa',
      pages: ['Petugas Posko: “Seluruh warga selamat, tidak ada yang tertinggal. Api ditangani tim pemadam dan helikopter — pekerjaan profesional yang butuh pelatihan dan peralatan khusus.”',
        'Bu Lastri: “Tadi saya hampir kembali ke rumah mengambil surat-surat. Untung kamu mengingatkan. Barang dapat diganti, tetapi keselamatan manusia tidak.”',
        'Petugas Posko: “Ingat selalu: saat keadaan darurat, nyawa adalah prioritas. Kenali jalur evakuasi, ikuti arahan petugas, bantu warga yang rentan, dan jangan kembali ke area berbahaya demi mengambil barang.”',
        'Pencegahan paling kuat dimulai dari kita: jangan membakar lahan, pastikan api unggun mati, dan laporkan asap atau api ke 112. Terima kasih, Penjaga Hutan!'] };
  }
  function drawFire(ctx, cx, cy, time) {
    const S = M.Sprites, c = fireCenter(), T = 16, V = M.View, k = fireK();
    ctx.save(); ctx.globalAlpha = 0.14 * k; ctx.fillStyle = '#3a0c06'; ctx.fillRect(0, 0, V.w, V.h);               // langit/lingkungan memerah-gelap
    ctx.globalAlpha = (0.16 + 0.04 * Math.sin(time * 5)) * k; ctx.fillStyle = '#ff6a1f'; ctx.fillRect(Math.round(c.x - 110 - cx), Math.round(c.y - 40 - cy), 220, 96); ctx.restore();
    for (let i = 0; i < 14; i++) {                                                                                // pita api di sekeliling pusat (semua di dalam zona bahaya = tidak bisa dimasuki)
      if (k <= ((i * 5) % 14 + 0.5) / 14) continue;                                // api berkurang satu per satu saat k turun (cutscene)
      const a = i / 14 * Math.PI * 2 + 0.3, r = 36 + (i % 3) * 14, x = Math.round(c.x + Math.cos(a) * r * 1.3 - 8 - cx), y = Math.round(c.y + Math.sin(a) * r * 0.55 - 10 - cy);
      if (x > -16 && x < V.w && y > -16 && y < V.h) ctx.drawImage(S.fire[(Math.floor(time * 4) + i) % 2], x, y);
    }
    for (let i = 0; i < 4; i++) { const x = Math.round(c.x - 70 + i * 46 - 8 - cx), y = Math.round(c.y + 62 - cy); if (x > -16 && x < V.w && y > -16 && y < V.h) ctx.drawImage(S.props.burnt, x, y); }   // tanah hangus
    ctx.fillStyle = '#6e7077'; ctx.save();
    for (let i = 0; i < 8; i++) { const ph = (time * 0.16 + i / 8) % 1, x = Math.round(c.x - 60 + i * 17 + Math.sin(ph * 5 + i) * 4 - cx), y = Math.round(c.y - 10 - ph * 120 - cy), r = 4 + Math.floor(ph * 9);
      if (x < -20 || x > V.w + 20 || y < -20 || y > V.h + 20) continue; ctx.globalAlpha = Math.max(0, (1 - ph) * 0.55 * k); for (let dy = -r; dy <= r; dy++) { const w = Math.floor(Math.sqrt(r * r - dy * dy)); ctx.fillRect(x - w, y + dy, w * 2 + 1, 1); } }
    ctx.restore();
  }

  /* ---------- layar nama ---------- */
  function cleanName(s) { return String(s || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, LIMIT); }
  function openName(forced) { nameOpen = true; nameForced = !!forced; const i = $('name-in'); i.value = P.name; $('name-err').hidden = true; $('name-cancel').hidden = !!forced; $('namesec').hidden = false; $('name-title').textContent = P.name ? 'Ubah nama Penjaga Hutan' : 'Siapa nama Penjaga Hutan?'; setTimeout(() => { try { i.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } }, 50); }
  function closeName() { nameOpen = false; $('namesec').hidden = true; if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); M.UI.refreshMenu(); }
  function submitName() {
    const n = cleanName($('name-in').value);
    if (n.length < 2) { $('name-err').textContent = 'Tulis minimal 2 huruf untuk nama kamu.'; $('name-err').hidden = false; return; }
    P.name = n; const ok = save(); closeName(); if (!ok) M.notify('Nama tidak bisa disimpan di perangkat ini (penyimpanan diblokir). Nama hanya bertahan selama halaman terbuka.');
  }

  /* ---------- ending & sertifikat ---------- */
  function el(t, c, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function openEnd() {
    if (!P.finished || endOpen) return; endOpen = true; A().sfx('open'); const b = $('end-body'); b.textContent = '';
    b.append(el('p', 'ev-rank', 'Perjalananmu sebagai Penjaga Hutan selesai!'), el('p', 'ev-status', 'STATUS: TAMAT ✔'), el('p', 'ev-stars', '★'.repeat(P.stars) + '☆'.repeat(3 - P.stars)), el('p', 'ev-score', P.name),
      el('p', 'ev-msg', 'Skor total: ' + P.score + ' / ' + P.maxScore + ' · Misi selesai: ' + Ms().completedCount() + '/' + Ms().defs.length));
    const c1 = el('div', 'mp-card'); c1.appendChild(el('h3', null, 'Alasan perolehan bintang')); const u1 = el('ul'); P.reasons.forEach(r => u1.appendChild(el('li', null, r))); c1.appendChild(u1);
    if (P.choice === 'skip') c1.appendChild(el('p', 'mp-num', 'Pilihan “Selesai Sekarang” tetap menamatkan perjalananmu, tetapi tidak mendapat seluruh poin misi final.'));
    const c2 = el('div', 'mp-card'); c2.appendChild(el('h3', null, 'Ringkasan pembelajaran')); const u2 = el('ul');
    ['Lihat asap atau api: jauhi, amati dari jarak aman, lalu laporkan ke petugas atau 112.', 'Penanganan kebakaran besar dilakukan petugas terlatih; relawan membantu sesuai arahan.', 'Utamakan keselamatan: jaga jalur evakuasi, ikuti informasi resmi, lindungi diri dari asap.', 'Pencegahan dimulai dari kita: jangan membakar lahan, matikan api, dan ajak orang lain peduli.'].forEach(x => u2.appendChild(el('li', null, x)));
    c2.appendChild(u2); b.append(c1, c2); $('endsec').hidden = false; M.Game.freeze(true); b.scrollTop = 0; $('end-cert').focus({ preventScroll: true });
  }
  function closeEnd(silent) { if (!endOpen) return; if (silent !== true) A().sfx('close'); endOpen = false; $('endsec').hidden = true; M.Game.freeze(false); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }
  function fitCert() { const box = $('cert-box'), c = $('cert'); if (!box) return; const W = 297 * 96 / 25.4, H = 210 * 96 / 25.4, vw = Math.max(240, innerWidth - 16), vh = Math.max(160, innerHeight - 70), s = Math.min(1, vw / W, vh / H);
    c.style.transform = 'scale(' + s + ')'; box.style.width = Math.floor(W * s) + 'px'; box.style.height = Math.floor(H * s) + 'px'; }
  function openCert() {
    if (!certAllowed()) { M.notify('Sertifikat hanya bisa dibuat setelah perjalananmu tamat.'); return false; }
    const n = P.name; $('c-name').textContent = n; $('c-name').style.fontSize = n.length > 30 ? '8.5mm' : n.length > 20 ? '11mm' : '14mm';
    $('c-stars').textContent = '★'.repeat(P.stars) + '☆'.repeat(3 - P.stars); $('c-score').textContent = P.score + ' / ' + P.maxScore; $('c-date').textContent = dateText(P.finishedAt); $('c-no').textContent = P.certNo;
    $('c-stars-n').textContent = P.stars + ' dari 3 bintang'; certOpen = true; if (endOpen) closeEnd(true); $('certsec').hidden = false; document.body.classList.add('cert-open'); M.Game.freeze(true); fitCert(); $('cert-print').focus({ preventScroll: true }); return true;
  }
  function closeCert() { if (!certOpen) return; certOpen = false; $('certsec').hidden = true; document.body.classList.remove('cert-open'); if (!M.Game.running) return; M.Game.freeze(false); }
  function printCert() { if (!certOpen || !certAllowed()) return; try { window.print(); } catch (e) { M.notify('Dialog cetak tidak tersedia. Gunakan menu browser: Cetak → Simpan sebagai PDF.'); } }

  /* ---------- tracker & menu ---------- */
  function refreshTracker() {
    if (!allMissions()) return; const tc = $('tr-ch'), tn = $('tr-name'), to = $('tr-objs'), tf = $('tr-fill'), cnt = $('tr-count'); to.textContent = '';
    if (P.finished) { tc.textContent = 'Perjalanan tamat'; tn.textContent = '★'.repeat(P.stars) + ' · ' + P.name; tf.style.width = '100%'; to.appendChild(el('span', 'tr-obj on', 'Skor ' + P.score + '/' + P.maxScore)); cnt.textContent = 'Tamat'; return; }
    tc.textContent = 'Misi Terakhir'; tn.textContent = 'Misi Terakhir — Evakuasi Desa';
    if (!P.choice) { tf.style.width = '0%'; to.appendChild(el('span', 'tr-obj', '☐ Temui Petugas Lapangan di desa')); cnt.textContent = '30/30 misi'; }
    else { const nx = nextObj(); tf.style.width = (P.done.length / OBJ.length * 100) + '%'; to.appendChild(el('span', 'tr-obj', '☐ ' + (nx ? nx.label : 'Selesai') + ' · ' + P.done.length + '/' + OBJ.length)); cnt.textContent = 'Evakuasi ' + P.done.length + '/' + OBJ.length; }
  }
  function refreshMenuExtra() { const n = $('menu-name'); if (n) n.textContent = P.name ? 'Penjaga Hutan: ' + P.name : ''; $('btn-end').hidden = !P.finished; if (allMissions() && !P.finished) { $('menu-prog').textContent += ' · Misi Terakhir menunggu'; } }

  function reset() { const keep = P.name; M.Evac.state.pendingEmerg = false; if (M.Cutscene) M.Cutscene.abort(); P = def(); P.name = keep; pendingEnd = false; pendingCut = false; pendingClosing = false; save(); M.WorldState.reset(false); M.Map.applyStates(); M.Evac.reset(); sync(); if (endOpen) closeEnd(true); if (certOpen) closeCert(); refreshMenuExtra(); }
  function init() {
    if (bound) return; bound = true; load(); M.Evac.init(); M.WorldState.reconcile({ initial: true }); M.Map.applyStates(); M.Evac.reset();
    const U = M.UI, Mi = M.Missions, orig = { req: U.requestEval, top: U.closeTopModal, evOpen: U.evalOpen, tick: U.tick, menu: U.refreshMenu, close: U.closeAll };
    U.requestEval = () => { if (P.finished) orig.req(); else { refreshTracker(); } };                          // sebelum tamat: Misi Terakhir dulu, evaluasi menyusul
    U.evalOpen = () => orig.evOpen() || endOpen || certOpen || nameOpen;
    U.closeTopModal = () => { if (nameOpen) { if (!nameForced) closeName(); return true; } if (certOpen) { closeCert(); return true; } if (endOpen) { closeEnd(); return true; } return orig.top(); };
    U.closeAll = () => { orig.close(); closeEnd(true); if (certOpen) closeCert(); };
    U.tick = () => { sync(); orig.tick(); };
    U.refreshMenu = () => { orig.menu(); refreshMenuExtra(); };
    const oBuild = M.Content.build; M.Content.build = poi => (M.Final.handles(poi) ? build(poi) : null) || oBuild(poi);
    const oAt = Mi.stepsAt; Mi.stepsAt = poi => { const r = oAt(poi); return r.length || targetPoi() !== poi ? r : [{ m: {}, s: { t: 'visit' } }]; };   // memunculkan penanda (!) pada tujuan Misi Terakhir
    const oT = Mi.targets; Mi.targets = () => { const t = targetPoi(); return t ? [t] : oT(); };
    const oD = M.World.draw; M.World.draw = (ctx, p, cx, cy, tm) => oD(ctx, p, cx, cy, tm);
    const oO = M.World.drawOverlay; M.World.drawOverlay = (ctx, cx, cy, tm) => { oO(ctx, cx, cy, tm); if (vis) drawFire(ctx, cx, cy, tm); };
    const oS = M.Map.isSolid; M.Map.isSolid = (tx, ty) => { if (oS(tx, ty)) return true; if (!vis) return false; const c = fireCenter(); return Math.hypot(tx * 16 + 8 - c.x, ty * 16 + 8 - c.y) < 88; };   // area api = dinding tak terlihat
    const pi = M.World.pois.indexOf(M.World.byId.bigfire); if (pi >= 0) M.World.pois.splice(pi, 1);          // api besar disembunyikan sampai 30 misi selesai
    Mi.onChange(ev => { if (ev && ev.type === 'reset') reset(); refreshTracker(); sync(); });
    $('name-ok').onclick = submitName; $('name-cancel').onclick = () => { if (!nameForced) closeName(); };
    $('name-in').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); submitName(); } else if (e.key === 'Escape' && !nameForced) closeName(); });
    $('btn-name').onclick = () => openName(false); $('btn-end').onclick = () => { if (P.finished) openEnd(); };
    $('end-cert').onclick = openCert; $('end-close').onclick = () => closeEnd(); $('end-x').onclick = () => closeEnd();
    $('cert-print').onclick = printCert; $('cert-close').onclick = closeCert; addEventListener('resize', () => { if (certOpen) fitCert(); });
    if (!P.name) openName(true); refreshTracker(); refreshMenuExtra(); sync();
    if (P.locked) M.notify('Data Misi Terakhir berasal dari versi game yang lebih baru dan tidak akan ditimpa.');
  }
  const handles = poi => !!poi && M.Evac.handles(poi);
  /* ---------- v1.0: bekas kebakaran (tetap terlihat setelah api padam) ---------- */
  let scorchList = null;
  const scorchOn = () => M.WorldState.fireOut('bigfire') && allMissions();
  function scorchPts() { if (scorchList) return scorchList; const c = fireCenter(), T = 16; scorchList = [];
    for (let ty = Math.floor((c.y - 70) / T); ty <= Math.floor((c.y + 70) / T); ty++) for (let tx = Math.floor((c.x - 120) / T); tx <= Math.floor((c.x + 120) / T); tx++) {
      if (tx < 0 || ty < 0) continue; const dx = (tx * T + 8 - c.x) / 120, dy = (ty * T + 8 - c.y) / 70, d = dx * dx + dy * dy, h = (Math.imul(tx, 73856093) ^ Math.imul(ty, 19349663)) >>> 0;
      if (d < 1 && (h % 100) < 80 - d * 45) scorchList.push([tx * T, ty * T]); }
    return scorchList; }
  const scorched = (tx, ty) => { if (!scorchOn()) return false; const c = fireCenter(), dx = (tx * 16 + 8 - c.x) / 125, dy = (ty * 16 + 8 - c.y) / 75; return dx * dx + dy * dy < 1; };
  function drawScorch(ctx, cx, cy) { if (!scorchOn()) return; const S = M.Sprites, V = M.View; for (const p of scorchPts()) { const x = p[0] - cx, y = p[1] - cy; if (x > -16 && y > -16 && x < V.w + 16 && y < V.h + 16) ctx.drawImage(S.ash, x, y); } }
  M.Final = { scorched, drawScorch, dateText, init, handles, build, OBJ, completeObj, nextLabel, save: () => save(), get P() { return P; }, fireCenter, fireK, closing, finalPts, calc, canFinish, certAllowed, openCert, openEnd, fireVisible, targetPoi, sync,
    _test: { finish: () => finish(), setName: n => { P.name = cleanName(n); save(); }, state: () => JSON.parse(JSON.stringify(P)), fireCenter } };
})(window.MPH);
