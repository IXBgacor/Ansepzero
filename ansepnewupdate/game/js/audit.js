/* Audit titik interaksi misi v1.0 — memeriksa SEMUA langkah misi saat game dimuat dan melaporkan masalah ke console (console.warn).
   Pemeriksaan per titik (POI) yang dipakai misi: 1) ada di daftar POI; 2) koordinat petak di dalam batas peta; 3) petak POI tidak berada di luar jalur
   (di dalam air/di bawah objek solid lain selain dirinya); 4) titik berdiri ideal (Spots) ada, bebas tabrakan & di dalam peta; 5) terjangkau dari titik awal
   (BFS petak bebas, tanpa dinding api); 6) di titik berdiri itu Interact memilih TARGET yang benar (tombol interaksi aktif hanya pada jarak yang sesuai);
   7) untuk area bahaya: titik amati berada di cincin aman (bukan zona bahaya). Koordinat selalu koordinat DUNIA (petak/piksel peta), bukan layar,
   sehingga tidak berubah oleh kamera, zoom, atau perubahan ukuran layar. Hasil: M.Audit.last (daftar masalah) dan M.Audit.rows. */
(function (M) {
  'use strict';
  const T = M.C.TILE;
  function run(opts) {
    const issues = [], rows = [], W = M.World, ids = new Set(); M.Missions.defs.forEach(d => d.steps.forEach(s => ids.add(s.poi)));
    (M.Evac && M.Evac.ALL || []).concat(['e_officer', 'e_board', 'e_assembly', 'e_off2']).forEach(i => ids.add(i));          // Misi Terakhir
    M.School.TEXT && Object.keys(M.School.TEXT).forEach(i => ids.add(i));
    M.Region && Object.keys(M.Region.TEXT).forEach(i => ids.add(i));          // v2.0: NPC/objek kawasan selatan
    for (const id of ids) {
      const p = W.byId[id], bad = []; if (!p) { issues.push(id + ': POI tidak ada'); continue; }
      if (p.tx < 0 || p.ty < 0 || p.tx >= M.C.MAP_W || p.ty >= M.C.MAP_H) bad.push('di luar batas peta (' + p.tx + ',' + p.ty + ')');
      else if (p.tx < 1 || p.ty < 1 || p.tx > M.C.MAP_W - 2 || p.ty > M.C.MAP_H - 2) bad.push('menempel tepi peta');
      let sp = null; try { sp = M.Spots.spotOf(p); } catch (e) { /* abaikan */ }
      if (!sp) bad.push('tidak punya titik berdiri yang valid');
      else {
        const tx = Math.floor(sp.x / T), ty = Math.floor((sp.y - 1) / T);
        if (sp.x < 0 || sp.y < 0 || sp.x > M.Map.pxW || sp.y > M.Map.pxH) bad.push('titik berdiri di luar peta');
        if (M.Map.footBlocked(sp.x, sp.y)) bad.push('titik berdiri menabrak objek solid');
        if (!M.Map.reachable(tx, ty)) bad.push('titik berdiri tidak terjangkau dari titik awal');
        if (!W.isHazard(p)) { const b = M.Spots.bestAt(sp.x, sp.y); if (b !== p) bad.push('di titik berdiri, interaksi memilih ' + (b ? b.id : 'tidak ada')); }
        else { const c = W.center(p), d = Math.hypot(sp.x - c.x, sp.y - 3 - c.y), R = W.ringOf(p); if (d < R.min || d > R.max) bad.push('titik amati di luar cincin aman (' + Math.round(d) + 'px)'); }
      }
      rows.push({ id, tx: p.tx, ty: p.ty, spot: sp, ok: bad.length === 0 }); bad.forEach(b => issues.push(id + ': ' + b));
    }
    /* objek penting di dalam kompleks sekolah/desa tidak boleh di luar peta */
    M.Map.objects.forEach(o => { if (o.tx < 0 || o.ty < 0 || o.tx + (o.w || 1) > M.C.MAP_W || o.ty + (o.h || 1) > M.C.MAP_H) issues.push('objek ' + o.type + ' di luar peta (' + o.tx + ',' + o.ty + ')'); });
    M.Audit.last = issues; M.Audit.rows = rows;
    if (issues.length) issues.forEach(i => console.warn('[Audit titik misi] ' + i)); else if (!opts || !opts.quiet) console.info('[Audit titik misi] ' + rows.length + ' titik OK');
    return issues;
  }
  M.Audit = { run, last: [], rows: [] };
})(window.MPH);
