/* Evaluasi akhir v0.4: skor, peringkat bintang, rincian per bab, dan catatan belajar dari kesalahan tiap misi. */
(function (M) {
  const Ms = M.Missions;
  function rank(pct) {
    if (pct >= 90) return { stars: 3, title: 'Penjaga Hutan Teladan', msg: 'Luar biasa! Kamu paham cara mencegah dan melaporkan bahaya karhutla dengan aman.' };
    if (pct >= 70) return { stars: 2, title: 'Penjaga Hutan Andal', msg: 'Bagus! Masih ada beberapa hal yang bisa diperkuat. Baca catatan belajar di bawah.' };
    return { stars: 1, title: 'Penjaga Hutan Pemula', msg: 'Awal yang baik. Ulangi misi untuk memperkuat pemahamanmu tentang keselamatan karhutla.' };
  }
  function summary() {
    const sc = Ms.score(), pct = sc.max ? Math.round(sc.total / sc.max * 100) : 0, r = rank(pct), miss = [];
    const rows = Ms.chapters.map(c => {
      let wrong = 0, danger = 0;
      for (const d of Ms.chapterMissions(c.id)) { const w = Ms.stat(d.id, 'wrong'), g = Ms.stat(d.id, 'danger'); wrong += w; danger += g; if (w || g) miss.push({ d, w, g }); }
      const notes = []; if (wrong) notes.push('Jawaban kurang tepat: ' + wrong + 'x'); if (danger) notes.push('Masuk zona bahaya: ' + danger + 'x'); if (!notes.length) notes.push('Tanpa kesalahan ✔');
      return { id: c.id, name: 'Bab ' + c.id + ' · ' + c.title, score: Ms.chapterScore(c.id), max: Ms.chapterMax(c.id), notes };
    });
    miss.sort((a, b) => (b.w + b.g) - (a.w + a.g));
    const tips = miss.slice(0, 5).map(x => 'Misi ' + x.d.code + ' ' + x.d.title + ': ' + x.d.tip + (x.g ? ' Jaga jarak dari asap dan api (masuk zona bahaya ' + x.g + 'x).' : ''));
    if (miss.length > 5) tips.push('Dan ' + (miss.length - 5) + ' misi lain punya jawaban yang perlu diulang. Buka Bab & Misi untuk meninjau materinya.');
    if (!tips.length) tips.push('Kamu menjawab dengan tepat dan menjaga jarak aman. Pertahankan!');
    tips.push('Aturan emas: lihat asap atau api → jauhi → laporkan ke petugas atau 112 → ajak orang lain peduli.');
    return { total: sc.total, max: sc.max, pct, stars: r.stars, title: r.title, msg: r.msg, rows, tips };
  }
  M.Eval = { summary, rank };
})(window.MPH);
