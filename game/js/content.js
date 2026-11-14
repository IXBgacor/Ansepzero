/* Isi dialog v0.4: dibangun dari data kampanye (js/campaign_data.js). Tidak ada instruksi mendekati api atau memadamkan kebakaran sendirian.
   Langkah 'visit'/'observe' menampilkan halaman materi; 'quiz' menampilkan soal bertahap (salah = umpan balik + "Coba lagi", poin berkurang). */
(function (M) {
  const Ms = M.Missions;
  const foot = id => () => { const d = Ms.def(id), p = Ms.progress(id); return 'Bab ' + d.ch + ' · Misi ' + d.code + ' ' + d.title + ' · ' + p.done + '/' + p.total + (p.complete ? ' · Selesai ✔' : '') + ' · Skor ' + Ms.score().total; };
  /* Catatan penutup misi: skor misi, materi singkat, penutup bab, dan (bila semua selesai) evaluasi akhir. */
  function doneNote(mid, res) {
    if (!res || !res.completedNow) return [];
    const d = Ms.def(mid), pages = ['★ Misi selesai: ' + d.title + '! Skor misi: ' + Ms.missionScore(mid) + '/' + Ms.missionMax(mid) + '.'];
    if (d.edu) pages.push('📘 Materi singkat: ' + d.edu);
    if (res.chapterDone) { const c = Ms.chapter(d.ch); pages.push('🏅 Bab ' + c.id + ' selesai: ' + c.title + '! Skor bab: ' + Ms.chapterScore(c.id) + '/' + Ms.chapterMax(c.id) + '.'); }
    if (Ms.allComplete()) { pages.push('Hebat! Semua 30 misi selesai. Terima kasih, Penjaga Hutan. Tetap waspada dan ajak orang lain peduli hutan! Namun lihat ke utara: hutan besar terbakar. Temui Petugas Rimba untuk Misi Terakhir (v0.5).'); M.UI.requestEval(); }
    else if (Ms.active()) pages.push('Misi berikutnya akan muncul setelah dialog ini ditutup.');
    return pages;
  }
  const info = (title, icon, pages, tone) => ({ title, icon, tone: tone || 'info', pages });

  /* Soal bertahap. intro = halaman pengantar (hanya sebelum soal pertama). */
  function quizNode(m, st, poi, intro) {
    const qs = st.qs, multi = qs.length > 1;
    function qNode(i, pre) {
      const q = qs[i];
      return { title: poi.name, icon: poi.icon, tone: 'info', badge: multi ? 'Soal ' + (i + 1) + '/' + qs.length : '', pages: (pre || []).concat([q.text]), footer: foot(m.id),
        choices: q.o.map(o => ({ label: o.label, pick: () => answer(i, o) })) };
    }
    function answer(i, o) {
      M.Audio.sfx(o.good ? 'correct' : 'wrong', { delay: 0.1 });       // v0.4³: umpan balik suara jawaban
      if (o.good) {
        if (i < qs.length - 1) return Object.assign(qNode(i + 1, [o.fb]), { tone: 'good', badge: '✔ Tepat · soal ' + (i + 2) + '/' + qs.length + ' berikutnya' });
        const res = Ms.mark(m.id, st.id);
        if (!res.ok) return info(poi.name, poi.icon, ['Selesaikan langkah sebelumnya terlebih dulu.']);
        return { title: poi.name, icon: poi.icon, tone: 'good', badge: '✔ Tepat · +' + res.pts, pages: [o.fb].concat(doneNote(m.id, res)), footer: foot(m.id) };
      }
      Ms.addStat(m.id, st.id);
      const n = Ms.stepStat(m.id, st.id);
      return { title: poi.name, icon: poi.icon, tone: 'bad', badge: '✘ Kurang tepat', pages: [o.fb], footer: () => foot(m.id)() + ' · Salah ' + n + 'x (poin berkurang)',
        choices: [{ label: 'Coba lagi', pick: () => qNode(i) }] };
    }
    return qNode(0, intro && intro.length ? intro : (st.intro || []));
  }

  /* Dialog untuk satu langkah yang tersedia; langkah 'quiz' bertanda chain digabung dengan langkah syaratnya dalam satu dialog. */
  function stepNode(poi, a) {
    const m = a.m, st = a.s;
    if (st.t === 'quiz') return quizNode(m, st, poi, null);
    const res = Ms.mark(m.id, st.id);
    if (!res.ok) return info(poi.name, poi.icon, ['Selesaikan langkah sebelumnya terlebih dulu.'], 'warn');
    const nx = m.steps.find(x => x.chain && x.t === 'quiz' && x.poi === poi.id && x.requires.includes(st.id) && Ms.availableSteps().some(y => y.s === x));
    if (nx) { const n = quizNode(m, nx, poi, st.pages); n.badge = n.badge || (res.changed ? '+' + res.pts + ' poin' : ''); return n; }
    const extra = doneNote(m.id, res);
    return { title: poi.name, icon: poi.icon, tone: extra.length ? 'good' : 'info', badge: res.changed ? '+' + res.pts + ' poin' : '', pages: st.pages.concat(extra), footer: foot(m.id) };
  }

  /* Titik tanpa tugas pada misi aktif: ulas materi yang sudah dipelajari, atau teks umum. Tidak memberi poin. */
  function idleNode(poi) {
    const done = Ms.stepsAnywhere(poi.id).filter(x => Ms.has(x.m.id, x.s.id));
    const withText = done.find(x => x.s.after) || done.find(x => x.s.pages);
    let pages;
    if (withText) pages = (withText.s.after || withText.s.pages).slice();
    else if (M.World.isHazard(poi)) pages = ['Tetap di jarak aman dan jangan mendekat. Jika melihat asap atau api yang mencurigakan, laporkan ke petugas atau 112.'];
    else if (poi.kind === 'npc') pages = ['“Halo, Penjaga Hutan! Sedang tidak ada yang bisa kubantu sekarang. Semangat menjaga hutan!”'];
    else pages = ['Tidak ada tugas misi di sini sekarang.'];
    const a = Ms.availableSteps()[0], act = Ms.active();
    const fut = withText ? null : Ms.stepsAnywhere(poi.id).find(x => !Ms.complete(x.m.id) && x.m !== act);
    if (fut) pages.push('Titik ini akan dipakai pada misi “' + fut.m.title + '” (Misi ' + fut.m.code + ', belum dibuka). Selesaikan misi aktif lebih dulu, lalu kembali.');
    if (act && a) pages.push('Tujuan sekarang (Misi ' + act.code + ' ' + act.title + '): ' + a.s.label + '.');
    return { title: poi.name, icon: poi.icon, tone: 'info', badge: withText ? 'Ulasan materi' : '', pages, footer: act ? foot(act.id) : null };
  }
  const B = {
    officer(poi) {
      const act = Ms.active();
      if (!act) return { title: poi.name, icon: poi.icon, tone: 'good', pages: ['Kerja bagus, Penjaga Hutan! Semua 30 misi sudah selesai.', 'Ingat selalu: lihat asap atau api, jauhi dan laporkan. Keselamatanmu yang utama.'],
        choices: [{ label: 'Lihat evaluasi akhir', pick: () => { M.UI.requestEval(); } }, { label: 'Tutup', pick: () => null }] };
      const a = Ms.availableSteps()[0];
      return info(poi.name, poi.icon, [
        'Halo, Penjaga Hutan! Tugasmu: mengenali hutan, mencegah kebakaran, dan melaporkan bahaya dengan aman.',
        'Aturan keselamatan: jangan mendekati api atau asap tebal, dan jangan memadamkan kebakaran sendirian. Amati dari jauh, lalu laporkan.',
        'Misi dikerjakan berurutan; tombol Bab & Misi di kiri atas menampilkan progres dan skor.',
        'Misi sekarang (' + (act.index + 1) + '/' + Ms.defs.length + '): ' + act.title + '. ' + act.goal + (a ? ' Tujuan berikutnya: ' + a.s.label + '.' : '') + ' Petunjuk: ' + act.hint]);
    },
    sign(poi) { return info(poi.name, poi.icon, [
      'AWAS! Area rawan kebakaran hutan dan lahan.',
      'Jika melihat asap atau api: jangan didekati, menjauh dengan tenang, lalu laporkan ke petugas atau nomor darurat 112.'], 'warn'); }
  };
  /* Briefing saat misi baru aktif (otomatis, sekali per misi). */
  function briefing(m) {
    const first = Ms.chapterMissions(m.ch)[0] === m, c = Ms.chapter(m.ch), pages = [];
    if (first) pages.push('BAB ' + c.id + ' — ' + c.title + '. ' + c.intro);
    pages.push(m.brief, 'Tujuan: ' + m.goal + ' Petunjuk: ' + m.hint + ' Hadiah: hingga ' + Ms.missionMax(m.id) + ' poin.');
    return { sfx: first ? 'chapter' : 'newMission', title: 'Misi ' + m.code + ': ' + m.title, icon: 'officer', tone: 'info', badge: (m.index + 1) + '/' + Ms.defs.length, pages, footer: () => 'Bab ' + c.id + ' · ' + c.title + ' · Selesai ' + Ms.completedCount() + '/' + Ms.defs.length + ' · Skor ' + Ms.score().total };
  }
  function build(poi) {
    if (poi.id === 'sign') return B.sign(poi);
    const av = Ms.stepsAt(poi.id);
    if (av.length) return stepNode(poi, av[0]);
    return poi.id === 'officer' ? B.officer(poi) : idleNode(poi);
  }
  M.Content = { build, briefing, doneNote };
})(window.MPH);
