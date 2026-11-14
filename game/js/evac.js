/* Sistem Evakuasi Desa v0.6 — inti Misi Terakhir "Evakuasi Desa".
   Fokus keselamatan: pemain TIDAK pernah mendekati api. Warga (5 biasa + lansia + anak + ibu yang ingin mengambil barang) digerakkan lewat jalur BFS (Map.findPath)
   ke titik kumpul. Warga biasa berjalan sendiri setelah diberi arahan; lansia & anak mengikuti pemain; Bu Lastri dibujuk agar tidak kembali mengambil barang.
   Progres disimpan di Final.P.evac ({emerg, talked, safe}). Objective: meet, learn, guide, gather, assist, report, wait (lihat final.js). */
(function (M) {
  'use strict';
  const T = 16, V = () => M.Village, W = () => M.World, P = () => M.Final.P;
  const REG = ['v1', 'v2', 'v3', 'v4', 'v5'], SPEC = ['v_mbah', 'v_anak', 'v_ibu'], ALL = REG.concat(SPEC);
  const STAFF = ['lurah'], MOVERS = REG.concat(SPEC, STAFF);      // v1.0: Pak Lurah ikut ke titik kumpul saat darurat & pulang saat pulih
  const A = {}, S = { last: 0, waitT: 0, pendingEmerg: false, route: null, t: 0 };
  const done = id => P().done.includes(id), E = () => P().evac, emerg = () => !!(E() && E().emerg);
  const slotOf = i => { const s = V().L.slots[i % V().L.slots.length]; return { x: s[0] * T + 8, y: s[1] * T + 14 }; };
  const foot = () => 'Evakuasi Desa · ' + P().done.length + '/' + M.Final.OBJ.length + ' · +' + M.Final.finalPts() + ' poin';
  const count = k => k === 'talked' ? REG.filter(i => E().talked[i]).length : k === 'safeReg' ? REG.filter(i => E().safe[i]).length : k === 'safeSpecial' ? SPEC.filter(i => E().safe[i]).length : ALL.filter(i => E().safe[i]).length;
  const dlg = (poi, o) => Object.assign({ title: poi.name, icon: poi.icon, tone: 'info', footer: foot }, o);

  function mkActors() {
    MOVERS.forEach((id, i) => { const p = W().byId[id]; if (!p) return; A[id] = { id, p, i, mode: 'idle', x: p.tx * T + 8, y: p.ty * T + 14, hx: p.tx * T + 8, hy: p.ty * T + 14, dir: 0, path: null, pi: 1, speed: p.speed || 44, moving: false, repath: 0 }; });
  }
  function applySave() {
    const rec = M.WorldState.phase() === 'recovered';
    for (const id of MOVERS) { const a = A[id]; if (!a) continue;
      if (rec) { a.x = a.hx; a.y = a.hy; a.mode = 'idle'; a.path = null; a.moving = false; sync(a); }
      else if (E().safe[id]) { const s = slotOf(a.i); a.x = s.x; a.y = s.y; a.mode = 'safe'; a.dir = M.DIR.DOWN; sync(a); }
      else if (E().talked[id] && REG.includes(id)) { a.pendingWalk = true; } }
  }
  const sync = a => { if (a.mode === 'idle' && a.x === a.hx && a.y === a.hy) delete a.p._ov; else { a.p._ov = { x: a.x - 8, y: a.y - 14, dir: a.dir, moving: a.moving }; a.p.tx = Math.floor(a.x / T); a.p.ty = Math.floor((a.y - 1) / T); } };
  function walkTo(a, x, y, mode) { const pts = M.Map.findPath(a.x, a.y, x, y); a.path = pts && pts.length > 1 ? pts : [{ x: a.x, y: a.y }, { x, y }]; a.pi = 1; a.mode = mode || 'walk'; }
  function advance(a, dt) {
    let left = a.speed * dt; a.moving = false;
    while (left > 0 && a.path && a.pi < a.path.length) {
      const q = a.path[a.pi], dx = q.x - a.x, dy = q.y - a.y, d = Math.hypot(dx, dy);
      if (d <= left) { a.x = q.x; a.y = q.y; left -= d; a.pi++; } else { a.x += dx / d * left; a.y += dy / d * left; left = 0; }
      if (d > 0.01) { a.moving = true; a.dir = M.Cutscene.lib.dirOf(dx, dy); }
    }
    return !(a.path && a.pi < a.path.length);
  }
  function arrive(a) { a.mode = 'safe'; a.moving = false; a.dir = M.DIR.DOWN; a.path = null; E().safe[a.id] = 1; M.WorldState.setVillager(a.id, 'assembly'); M.Final.save(); M.Audio.sfx('select'); }
  function update(dt) {
    for (const id of MOVERS) {
      const a = A[id]; if (!a || a.mode === 'safe' && !a.path) { if (a) sync(a); continue; }
      if (a.pendingWalk && a.mode === 'idle') { a.pendingWalk = false; const s = slotOf(a.i); walkTo(a, s.x, s.y); }
      if (a.pendingFollow && a.mode === 'idle') { a.pendingFollow = false; a.mode = 'follow'; }
      if (a.mode === 'walk') { if (advance(a, dt)) arrive(a); }
      else if (a.mode === 'follow') {
        if (V().inAssembly(a.x, a.y)) { const s = slotOf(a.i); walkTo(a, s.x, s.y); }
        else { const pl = M.Player.state, d = Math.hypot(pl.x - a.x, pl.y - a.y);
          if (d > 26) { a.repath -= dt; if (a.repath <= 0 || !a.path) { const pts = M.Map.findPath(a.x, a.y, pl.x, pl.y); a.path = pts && pts.length > 1 ? pts : null; a.pi = 1; a.repath = 0.6; } if (a.path) advance(a, dt); } else a.moving = false; }
      }
      sync(a);
    }
  }
  function tick() {
    const now = performance.now(), dt = Math.min(0.1, (now - (S.last || now)) / 1000); S.last = now; S.t += dt;
    if (!A.v1) return; if (!M.Final.fireVisible() || !E()) return;
    const busy = M.Game.frozen || M.Dialog.isOpen() || M.Cutscene.active;
    if (S.pendingEmerg && !busy && M.Dialog.canOpen() && M.Game.running) { S.pendingEmerg = false; M.Cutscene.play('emergency', {}); }
    if (!busy && M.Game.running) update(dt); else if (!M.Game.frozen) for (const id of MOVERS) { const a = A[id]; if (a) sync(a); }
    if (emerg() && !P().finished && !busy && M.Game.running) { const a = A.lurah; if (a && a.mode === 'idle' && !E().safe.lurah && M.Final.P.done.includes('learn')) { const s = slotOf(a.i); walkTo(a, s.x, s.y); } }
    if (!emerg() || P().finished) return;
    if (!done('guide') && count('talked') === REG.length) M.Final.completeObj('guide');
    if (done('guide') && !done('gather') && count('safeReg') === REG.length) M.Final.completeObj('gather');
    if (!done('assist') && count('safeSpecial') === SPEC.length) M.Final.completeObj('assist');
    if (done('report') && !done('wait') && !busy && M.Game.running) {
      const pl = M.Player.state; if (V().inAssembly(pl.x, pl.y)) { S.waitT += dt; if (S.waitT >= 4) M.Final.completeObj('wait'); } else S.waitT = Math.max(0, S.waitT - dt * 2);
    }
  }
  /* ---------- dialog ---------- */
  const IDLE = { v1: 'Pak Darto: “Halaman rumah sudah saya sapu. Kalau ada asap, saya langsung hubungi petugas. Jangan bakar sampah sembarangan, ya.”',
    v2: 'Mbak Ayu: “Di rumah kami sudah ada daftar nomor darurat: 112 dan petugas desa. Tempel di dekat pintu!”', v3: 'Pak Ujang: “Kalau ada kebakaran, ikuti arahan petugas dan jalur evakuasi. Jangan panik.”',
    v4: 'Mas Rudi: “Saya biasa membantu tetangga yang sudah tua. Saat darurat, yang rentan harus dibantu lebih dulu.”', v5: 'Bu Ningsih: “Tas siaga kami berisi masker, senter, dan dokumen penting. Selalu siap di dekat pintu.”',
    v_mbah: 'Mbah Karsi: “Dulu hutan di sini lebat sekali. Sekarang tugas kita menjaganya bersama-sama.”', v_anak: 'Dewi: “Aku suka main di lapangan titik kumpul! Kata Bu Guru itu tempat aman kalau ada bahaya.”', v_ibu: 'Bu Lastri: “Rumah kami dekat balai desa. Kalau ada pengumuman, kentongan dipukul.”' };
  const AFTER = { v1: 'Pak Darto: “Rumah sudah kami buka lagi. Terima kasih, Penjaga Hutan! Saya akan ikut ronda api tiap kemarau.”', v2: 'Mbak Ayu: “Anak-anak sudah main di halaman lagi. Kami jaga supaya tidak ada yang bakar sampah.”', v3: 'Pak Ujang: “Tadi tegang sekali, tapi semua selamat. Jalur evakuasi sekarang kami hafal.”',
    v4: 'Mas Rudi: “Warga rentan kini punya pendamping tetap saat darurat. Pelajaran berharga.”', v5: 'Bu Ningsih: “Tas siaga saya periksa lagi tiap bulan. Masker dan senter selalu siap.”', v_mbah: 'Mbah Karsi: “Mbah bisa tidur nyenyak lagi. Hutan kita masih ada. Terima kasih, Nak.”',
    v_anak: 'Dewi: “Aku mau jadi penjaga hutan juga kalau sudah besar!”', v_ibu: 'Bu Lastri: “Surat-surat saya aman. Yang terpenting, kita semua selamat.”', lurah: 'Pak Lurah: “Desa kembali normal berkat kerja sama kita. Teruslah berpatroli dan mengedukasi warga, Penjaga Hutan.”',
    e_officer: 'Petugas Lapangan: “Keadaan darurat dicabut. Tetap waspada: jangan membakar lahan dan laporkan asap ke 112.”', e_off2: 'Petugas Posko: “Posko darurat sudah dibongkar. Terima kasih atas bantuanmu.”' };
  function quiz(poi, badge, q, opts, okPages, onOk, oid) {
    const node = pre => ({ title: poi.name, icon: poi.icon, tone: 'info', badge, pages: (pre || []).concat([q]), footer: foot, choices: opts.map(x => ({ label: x[0], pick: () => {
      M.Audio.sfx(x[2] ? 'correct' : 'wrong', { delay: 0.1 });
      if (!x[2]) { P().wrong[oid] = Math.min(99, (P().wrong[oid] || 0) + 1); M.Final.save(); return { title: poi.name, icon: poi.icon, tone: 'bad', badge: 'Kurang tepat', pages: [x[1]], footer: foot, choices: [{ label: 'Coba lagi', pick: () => node([]) }] }; }
      onOk(); return { title: poi.name, icon: poi.icon, tone: 'good', badge: 'Tepat', pages: [x[1]].concat(okPages), footer: foot }; } })) });
    return node([]);
  }
  function build(poi) {
    const id = poi.id, a = A[id], dn = k => done(k);
    if (M.WorldState.phase() === 'recovered' && AFTER[id]) return dlg(poi, { tone: 'good', badge: 'Desa pulih', pages: [AFTER[id]] });
    if (!M.Final.fireVisible()) {                                                         // sebelum keadaan darurat: info edukatif ringan
      if (IDLE[id]) return dlg(poi, { pages: [IDLE[id]] });
      const info = { e_officer: ['Petugas Lapangan: “Selamat datang di Desa Rimba Asri. Setiap rumah di sini punya jalur evakuasi menuju Titik Kumpul di selatan. Hafalkan jalurnya sebelum ada keadaan darurat.”'],
        e_off2: ['Petugas Posko: “Titik kumpul ini area terbuka yang jauh dari pepohonan lebat. Kalau ada bahaya, semua warga berkumpul di sini.”'], e_board: ['Peta Jalur Evakuasi: dari plaza desa, ikuti jalan tanah ke selatan sampai Titik Kumpul. Tanda panah hijau menunjukkan arah.'],
        e_assembly: ['TITIK KUMPUL: area aman bagi seluruh warga saat evakuasi. Jangan menghalangi jalur kendaraan darurat.'], e_bell: ['Kentongan Desa: dipukul bertalu-talu sebagai tanda bahaya. Dengar dan segera berkumpul sesuai arahan.'],
        e_notice: ['Pengumuman Balai Desa: Nomor darurat 112. Laporkan asap atau api dari jarak aman, jangan didekati. Jangan membakar lahan.'], e_well: ['Sumur Warga: air bersih untuk kebutuhan sehari-hari. Air sumur bukan untuk melawan api besar, itu tugas petugas.'] };
      return info[id] ? dlg(poi, { pages: info[id] }) : null;
    }
    const p = P();
    if (id === 'e_officer') {
      if (!p.choice) {
        p.choice = 'help'; p.evac.emerg = true; S.pendingEmerg = true; M.WorldState.apply('emergency_start'); M.Final.save(); M.Audio.sfx('newMission'); M.Final.completeObj('meet');
        return dlg(poi, { tone: 'warn', badge: 'Keadaan Darurat', sfx: 'chapter', pages: ['Penjaga Hutan, lihat ke utara: kebakaran hutan meluas dan asapnya terbawa angin ke arah desa. Kita harus EVAKUASI warga sekarang.',
          'Tugasmu: pelajari jalur evakuasi di papan peta, bantu warga menuju Titik Kumpul di selatan, dan pastikan tidak ada yang tertinggal. Kita TIDAK mendekati api — pemadaman adalah pekerjaan petugas terlatih.',
          'Tenang, jangan panik, dan ikuti arahan resmi. Saat keadaan darurat, nyawa adalah prioritas.'] });
      }
      return dlg(poi, { pages: ['Petugas Lapangan: “Objective sekarang: ' + (M.Final.nextLabel() || 'selesai') + '. Ikuti jalur evakuasi bertanda panah, jangan mendekati asap.”'] });
    }
    if (!emerg()) return dlg(poi, { pages: ['Bicaralah dengan Petugas Lapangan di plaza desa lebih dulu.'] });
    if (id === 'e_board') {
      if (dn('learn')) return dlg(poi, { tone: 'good', badge: 'Selesai', pages: ['Jalur: plaza desa → jalan selatan → Titik Kumpul. Tanda panah emas di tanah menunjukkan arah.'] });
      return quiz(poi, 'Pelajari jalur', 'Ke mana warga harus menuju saat evakuasi?', [['Ke Titik Kumpul di selatan lewat jalur evakuasi bertanda panah.', 'Tepat. Titik kumpul adalah area terbuka yang jauh dari asap dan ditentukan petugas.', true], ['Ke tepi hutan supaya bisa melihat api.', 'Kurang tepat. Mendekati api atau asap sangat berbahaya.'], ['Pulang dulu mengambil barang-barang.', 'Kurang tepat. Barang bisa diganti, keselamatan tidak.']],
        ['Jalur: plaza desa → jalan selatan → Titik Kumpul. Panah emas di tanah akan memandu kamu dan warga.', 'Objective berikutnya: Bantu warga menemukan jalur aman.'], () => M.Final.completeObj('learn'), 'learn');
    }
    if (REG.includes(id)) {
      if (!dn('learn')) return dlg(poi, { pages: [poi.name + ': “Asapnya makin dekat! Tolong pelajari jalur evakuasi di papan peta dulu, lalu kembali ke sini.”'] });
      if (E().safe[id]) return dlg(poi, { tone: 'good', badge: 'Aman', pages: ['“Terima kasih! Saya sudah di titik kumpul. Barang bisa diganti, yang penting kita selamat.”'] });
      if (E().talked[id]) return dlg(poi, { pages: ['“Saya sedang menuju titik kumpul lewat jalur evakuasi. Terima kasih arahannya!”'] });
      E().talked[id] = 1; a.pendingWalk = true; M.Final.save(); M.Audio.sfx('reward');
      return dlg(poi, { tone: 'warn', badge: 'Arahkan warga (' + count('talked') + '/5)', pages: [poi.name + ': “Ada asap dari hutan! Saya harus ke mana?”', 'Tenang dulu. Ikuti jalan tanah ke selatan sampai Titik Kumpul, ikuti panah emas. Jangan berlari, jangan kembali ke rumah, dan jangan mendekati asap.', '“Baik, saya berangkat sekarang. Terima kasih sudah menenangkan saya!”'] });
    }
    if (id === 'v_mbah' || id === 'v_anak') {
      if (!dn('learn')) return dlg(poi, { pages: ['“Kami ikut kalau sudah tahu jalurnya. Pelajari peta jalur evakuasi dulu, ya.”'] });
      if (E().safe[id]) return dlg(poi, { tone: 'good', badge: 'Aman', pages: ['“Terima kasih sudah menemani sampai titik kumpul.”'] });
      if (a.mode === 'follow' || a.mode === 'walk') return dlg(poi, { pages: ['“Saya ikut di belakangmu. Antar sampai Titik Kumpul, jangan terlalu cepat.”'] });
      a.pendingFollow = true; E().talked[id] = 1; M.Final.save(); M.Audio.sfx('reward');
      return dlg(poi, { tone: 'warn', badge: 'Bantu warga rentan', pages: id === 'v_mbah' ? ['Mbah Karsi: “Nak, kaki Mbah sudah tidak kuat berjalan cepat…”', 'Pelan saja, Mbah. Saya temani sampai Titik Kumpul. Mbah ikut di belakang saya, kita lewat jalan tanah ke selatan. Warga yang membutuhkan bantuan harus didampingi.']
        : ['Dewi: “Aku takut, Kak… ada asap.”', 'Tidak apa-apa, Dewi. Pegang tanganku, jangan jauh-jauh. Kita jalan bersama ke Titik Kumpul di selatan. Anak-anak harus didampingi orang dewasa.'] });
    }
    if (id === 'v_ibu') {
      if (!dn('learn')) return dlg(poi, { pages: ['“Saya harus ke rumah mengambil barang! Eh, sebentar… bagaimana jalur evakuasinya? Coba lihat papan peta dulu.”'] });
      if (E().safe[id]) return dlg(poi, { tone: 'good', badge: 'Aman', pages: ['“Kamu benar. Barang bisa dibeli lagi, tapi nyawa tidak. Terima kasih!”'] });
      if (E().talked[id]) return dlg(poi, { pages: ['“Saya sedang jalan ke titik kumpul. Sudah ikhlas soal barang-barang itu.”'] });
      return quiz(poi, 'Barang atau keselamatan?', 'Bu Lastri: “Surat-surat dan perhiasan masih di dalam rumah! Saya mau kembali mengambilnya sebentar saja.” Apa jawabanmu?',
        [['Jangan kembali, Bu. Barang bisa diganti, keselamatan tidak. Mari ke titik kumpul.', 'Tepat. Kembali ke area berbahaya hanya untuk mengambil barang bisa membuat kita terjebak asap atau api. Petugas dapat membantu urusan dokumen setelah aman.', true],
         ['Silakan, tapi cepat ya.', 'Kurang tepat. “Sebentar” saja bisa berbahaya. Asap dan api bergerak lebih cepat dari perkiraan.'], ['Saya temani ambil, kita lari bersama.', 'Kurang tepat. Dua orang masuk bahaya itu lebih berbahaya. Prioritaskan keselamatan.']],
        ['Bu Lastri: “Benar juga… barang bisa diganti, nyawa tidak. Saya ikut ke titik kumpul sekarang.”'], () => { E().talked.v_ibu = 1; a.pendingWalk = true; M.Final.save(); }, 'assist');
    }
    if (id === 'e_off2') {
      if (dn('report')) return dlg(poi, { tone: 'good', badge: 'Dilaporkan', pages: ['Petugas Posko: “Terima kasih. Berdirilah bersama warga di titik kumpul dan tunggu arahan. Tim pemadam sedang dalam perjalanan.”', done('wait') ? 'Semua aman.' : 'Objective: Tunggu arahan petugas di titik kumpul.'] });
      if (dn('gather') && dn('assist')) { M.Final.completeObj('report'); return dlg(poi, { tone: 'good', badge: 'Laporan diterima', pages: ['Laporan: seluruh warga, termasuk lansia dan anak-anak, sudah berada di Titik Kumpul.', 'Petugas Posko: “Kerja bagus, Penjaga Hutan! Tidak ada warga yang tertinggal. Sekarang tunggu arahan di sini bersama warga. Tim pemadam sedang menuju lokasi.”'] }); }
      return dlg(poi, { pages: ['Petugas Posko: “Warga di titik kumpul: ' + count('all') + '/8. Pastikan lansia, anak, dan semua warga sampai dengan selamat sebelum melapor.”'] });
    }
    if (id === 'e_assembly') return dlg(poi, { badge: 'Titik Kumpul', pages: ['TITIK KUMPUL: ' + count('all') + '/8 warga sudah tiba. Pastikan tidak ada yang tertinggal.'] });
    if (id === 'e_bell') return dlg(poi, { pages: ['Kentongan sudah dipukul. Semua warga diminta bersiap dan mengikuti arahan petugas.'] });
    if (id === 'e_notice') return dlg(poi, { pages: ['Pengumuman: warga diminta menuju Titik Kumpul. Nomor darurat 112.'] });
    if (id === 'e_well') return dlg(poi, { pages: ['Jangan menimba air untuk melawan api besar. Utamakan evakuasi.'] });
    return null;
  }
  const handles = poi => !!poi && (ALL.includes(poi.id) || /^e_/.test(poi.id) || (poi.id === 'lurah' && M.WorldState.phase() === 'recovered'));
  function target() {
    if (!M.Final.P.choice) return 'e_officer';
    if (!done('learn')) return 'e_board';
    if (!done('guide')) return REG.find(i => !E().talked[i]);
    const sp = SPEC.find(i => !E().safe[i] && A[i] && A[i].mode === 'idle'); if (!done('gather') && !sp) return 'e_assembly';
    if (!done('assist') && sp) return sp;
    if (!done('gather')) return 'e_assembly';
    if (!done('assist')) return 'e_assembly';
    if (!done('report')) return 'e_off2';
    return 'e_assembly';
  }
  /* ---------- gambar: jalur evakuasi + area titik kumpul ---------- */
  function route() { if (!S.route) { const L = V().L, a = M.Map.findPath(L.routeFrom[0] * T + 8, L.routeFrom[1] * T + 14, L.routeTo[0] * T + 8, L.routeTo[1] * T + 14); S.route = a || []; } return S.route; }
  function drawGround(ctx, cx, cy, tm) {
    if (!emerg() || P().finished || (M.Cutscene && M.Cutscene.active)) return;
    const pts = route(), n = pts.length; if (n < 2) return; const vw = M.View.w, vh = M.View.h;
    let acc = 0; const off = (tm * 14) % 22;
    for (let i = 1; i < n; i++) {
      const a = pts[i - 1], b = pts[i], d = Math.hypot(b.x - a.x, b.y - a.y), ang = Math.atan2(b.y - a.y, b.x - a.x);
      for (let s = (22 - (acc % 22) + off) % 22; s < d; s += 22) {
        const x = a.x + Math.cos(ang) * s - cx, y = a.y + Math.sin(ang) * s - 4 - cy; if (x < -8 || y < -8 || x > vw + 8 || y > vh + 8) continue;
        ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(ang); ctx.globalAlpha = 0.9; ctx.fillStyle = '#1f7a3a'; ctx.fillRect(-4, -3, 1, 6); ctx.fillRect(-3, -2, 1, 4); ctx.fillRect(-2, -1, 1, 2); ctx.fillRect(-1, 0, 4, 1);
        ctx.fillStyle = '#7be08f'; ctx.fillRect(-3, -2, 1, 4); ctx.fillRect(-2, -1, 1, 2); ctx.fillRect(-1, 0, 4, 1); ctx.restore();
      }
      acc += d;
    }
    const r = V().L.assembly, x0 = r[0] * T - cx, y0 = r[1] * T - cy, w = (r[2] - r[0] + 1) * T, h = (r[3] - r[1] + 1) * T;       // batas area aman (garis putus hijau)
    if (x0 < vw && y0 < vh && x0 + w > 0 && y0 + h > 0) { ctx.globalAlpha = 0.6 + 0.3 * Math.sin(tm * 3); ctx.fillStyle = '#ffffff'; for (let x = 0; x < w; x += 6) { ctx.fillRect(Math.round(x0 + x), Math.round(y0), 3, 1); ctx.fillRect(Math.round(x0 + x), Math.round(y0 + h - 1), 3, 1); } for (let y = 0; y < h; y += 6) { ctx.fillRect(Math.round(x0), Math.round(y0 + y), 1, 3); ctx.fillRect(Math.round(x0 + w - 1), Math.round(y0 + y), 1, 3); } ctx.globalAlpha = 1; }
  }
  function init() {
    mkActors(); if (!P().evac) P().evac = { emerg: false, talked: {}, safe: {} }; applySave();
  }
  /* v1.0: ancaman berakhir -> semua warga & Pak Lurah kembali ke rumah/lokasi normal (dipanggil setelah cutscene ending atau saat dilewati) */
  function recover() { for (const id of MOVERS) { const a = A[id]; if (!a) continue; a.mode = 'idle'; a.x = a.hx; a.y = a.hy; a.path = null; a.moving = false; a.pendingWalk = a.pendingFollow = false; sync(a); } M.WorldState.apply('villagers_home'); M.Map.applyStates(); }
  function reset() { for (const id of MOVERS) { const a = A[id]; if (!a) continue; a.mode = 'idle'; a.x = a.hx; a.y = a.hy; a.path = null; a.pendingWalk = a.pendingFollow = false; a.moving = false; a.p.tx = Math.floor(a.hx / T); a.p.ty = Math.floor((a.hy - 1) / T); delete a.p._ov; } S.waitT = 0; S.pendingEmerg = false; S.route = null; }
  function resync() { reset(); if (!P().evac) P().evac = { emerg: false, talked: {}, safe: {} }; applySave(); }
  M.Evac = { recover, STAFF, MOVERS, homeOf: id => A[id] ? { x: A[id].hx, y: A[id].hy } : null, init, tick, build, handles, target, count, drawGround, reset: resync, REG, SPEC, ALL, actors: A, state: S, slotOf, inEvac: emerg };
})(window.MPH);
