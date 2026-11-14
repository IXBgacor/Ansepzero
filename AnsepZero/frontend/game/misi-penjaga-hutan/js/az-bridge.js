/* Jembatan AnsepZero (tambahan; kode game lain TIDAK diubah).
   Aktif hanya bila game dibuka di dalam iframe. Membaca hasil akhir dari localStorage 'mph.v05' (milik game, hanya dibaca)
   dan mengirim ringkasan ke halaman induk SAMA-ORIGIN lewat postMessage. Tidak menulis ke database. */
(function () {
  if (window.parent === window) return;
  var last = '';
  function snap() {
    try {
      var raw = localStorage.getItem('mph.v05'); if (!raw) return null;
      var o = JSON.parse(raw); if (!o || !o.finished || !o.certNo) return null;
      var done = 0; try { done = window.MPH.Missions.completedCount() || 0; } catch (e) {}
      return { local_ref: o.certNo + '|' + o.finishedAt, game_version: String(o.ver || 'unknown').replace(/[^0-9A-Za-z._-]/g, '-').slice(0, 20),
        score: o.score, max_score: o.maxScore, stars: o.stars, missions_done: done, finished: true };
    } catch (e) { return null; }
  }
  function tick() { var s = snap(); if (!s || s.local_ref === last) return; last = s.local_ref; window.parent.postMessage({ type: 'ansepzero:game-result', payload: s }, location.origin); }
  setInterval(tick, 3000);
  window.addEventListener('message', function (e) { if (e.origin === location.origin && e.data && e.data.type === 'ansepzero:request-result') { last = ''; tick(); } });
})();
