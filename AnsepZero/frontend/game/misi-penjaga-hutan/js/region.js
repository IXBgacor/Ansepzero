/* Kawasan Selatan v2.0 — perluasan dunia ke selatan (y 36-55) tanpa mengubah wilayah lama (x 0-107, y 0-35).
   Isi (semua koordinat petak, SATU tempat konfigurasi di objek L):
   - Jalan Lintas Selatan (y 40-41) menghubungkan: jalan hutan barat daya, jalan evakuasi desa (x 49-50), pasar, puskesmas, lapangan desa.
   - Permukiman selatan: 15 rumah (3 model + rumah panggung) + warung di sepanjang 3 lorong (y 44-45, 48-49, 52-53) dan jalur utara-selatan x 49-50.
   - Pasar Desa (x 64-87, y 42-53), Puskesmas (x 88-95, y 36-38), Pos Pemadam (x 52-59, y 36-38), Pos Kesehatan Darurat (x 57-63, y 28-33), Lapangan Desa.
   - Kawasan lahan gambut + kanal drainase (x 4-37, y 42-53) dengan jembatan, kayu tumbang, vegetasi rawa, genangan.
   - Jalur kendaraan pemadam: pintu garasi -> Jalan Lintas -> jalan evakuasi (x 49-50) -> ujung utara dekat area kebakaran (dipakai cutscene final). */
(function (M) {
  'use strict';
  const TL = M.T, T = M.C.TILE;
  const hs = n => { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; };
  const L = {
    south: 36,                                                                    // baris pertama wilayah baru
    roads: { lintas: [3, 40, 104, 41], evac: [49, 34, 50, 53], forest: [6, 32, 7, 39], north: [49, 4, 50, 6], lane1: [5, 44, 63, 45], lane2: [38, 48, 62, 49], lane3: [38, 52, 62, 53], conn: [38, 44, 39, 53],
             bridgeW: [12, 46, 13, 53], bridgeE: [28, 46, 29, 53] },
    paving: { market: [64, 42, 87, 53], fireApron: [52, 39, 59, 39], healthApron: [86, 39, 101, 39], healthPark: [96, 36, 101, 38], field: [90, 44, 103, 51], post: [57, 28, 63, 33], heli: [64, 36, 71, 39] },
    peat: [4, 42, 37, 53], canal: [5, 49, 36, 50], pondW: [4, 48, 8, 51], pondE: [34, 48, 37, 51],
    station: { x: 52, y: 36, w: 8, h: 3, doors: [864, 928] },
    puskesmas: { x: 88, y: 36 }, market: { hall: [66, 43] },
    houses: [ ['house', 40, 42, 0], ['stilt', 44, 42, 0], ['house', 52, 42, 1], ['house', 56, 42, 2], ['stilt', 60, 42, 1],
              ['house', 40, 46, 2], ['house', 44, 46, 0], ['house', 52, 46, 1], ['warung', 56, 46, 0, 2, 2], ['house', 60, 46, 2],
              ['stilt', 40, 50, 1], ['house', 44, 50, 1], ['house', 52, 50, 2], ['house', 56, 50, 0], ['stilt', 60, 50, 0], ['warung', 63, 46, 1, 2, 2] ],
    /* jalur truk pemadam (piksel dunia): keluar pintu garasi -> belok barat di Jalan Lintas -> utara lewat jalan evakuasi -> posisi siaga dekat hutan terbakar */
    route: { laneY: 656, northX: 808, stops: [{ x: 808, y: 100 }, { x: 808, y: 156 }] }
  };
  const inR = (x, y, r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
  const noForest = (x, y) => y >= L.south && x >= 3 && x <= 104 && y <= 53;

  function paint(ground, at) {
    const fill = (r, t, only) => { for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) { const i = at(x, y); if (!only || only(ground[i])) ground[i] = t; } };
    const road = r => { for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) { const i = at(x, y); ground[i] = ground[i] === TL.WATER ? TL.BRIDGE : TL.DIRT; } };
    for (let y = L.peat[1]; y <= L.peat[3]; y++) for (let x = L.peat[0]; x <= L.peat[2]; x++) {       // gambut: basah (gelap) + patch kering, tepi lebih kering
      const i = at(x, y); if (ground[i] !== TL.GRASS) continue; const edge = x <= 6 || x >= 35 || y === L.peat[1] || y >= 52;
      ground[i] = hs(x * 73 + y * 19) < (edge ? 0.6 : 0.22) ? TL.PEATD : TL.PEAT; }
    fill(L.pondW, TL.WATER); fill(L.pondE, TL.WATER); fill(L.canal, TL.WATER);                         // kanal + dua kolam penampung
    Object.values(L.roads).forEach(road);
    const P = L.paving; ['market', 'fireApron', 'healthApron', 'healthPark', 'field', 'heli'].forEach(k => fill(P[k], TL.PLAZA, g => g !== TL.WATER && g !== TL.BRIDGE)); fill(P.post, TL.SAFE, g => g === TL.GRASS);
  }

  /* ---------- objek ---------- */
  const okG = g => g === TL.PEAT || g === TL.GRASS || g === TL.PLAZA || g === TL.PEATD || g === TL.SAFE;
  function build(api) {
    const { objects, solid, at, ground } = api, placed = { objects: 0, skipped: [] };
    const put = (type, tx, ty, w, h, v) => { w = w || 1; h = h || 1;
      for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) if (x < 1 || y < 1 || x > M.C.MAP_W - 2 || y > M.C.MAP_H - 2 || solid[at(x, y)] || !okG(ground[at(x, y)])) { placed.skipped.push(type + '@' + tx + ',' + ty); return false; }
      for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) solid[at(x, y)] = 1; objects.push({ type, tx, ty, w, h, v: v || 0 }); placed.objects++; return true; };
    const soft = (type, tx, ty, w, h, v) => { const n = placed.skipped.length; const r = put(type, tx, ty, w, h, v); if (!r) placed.skipped.length = n; return r; };   // dekorasi: boleh dilewati tanpa dihitung masalah
    L.houses.forEach(h => put(h[0], h[1], h[2], h[4] || 3, h[5] || 2, h[3]));
    put('pasar_hall', L.market.hall[0], L.market.hall[1], 10, 3, 0);
    put('puskesmas', L.puskesmas.x, L.puskesmas.y, 8, 3, 0);
    put('pemadam', L.station.x, L.station.y, 8, 3, 0); put('hosehack', 60, 38, 1, 1, 0); put('sch_flagpole', 51, 38, 1, 1);
    put('medtent', 58, 29, 3, 2, 0); put('medtent', 58, 32, 3, 2, 0); put('bed', 62, 30, 1, 1); put('bed', 62, 32, 1, 1); put('medtable', 61, 31, 1, 1);
    [[65, 48, 0], [69, 48, 1], [73, 48, 2], [77, 48, 0], [81, 48, 1], [85, 48, 2], [67, 52, 1], [71, 52, 2], [75, 52, 0], [79, 52, 1], [83, 52, 2], [78, 44, 2], [82, 44, 0], [78, 46, 1]].forEach(s => put('lapak', s[0], s[1], 2, 1, s[2]));
    [[64, 52], [65, 53], [64, 53]].forEach(p => put('peti', p[0], p[1])); [[67, 47], [75, 47], [83, 47], [48, 43], [51, 43], [48, 47], [51, 47], [48, 51], [51, 51], [86, 39], [96, 39], [90, 52], [103, 52]].forEach(p => put('lamp', p[0], p[1]));
    [[72, 47], [79, 47], [92, 52], [95, 52], [98, 52], [101, 52], [63, 43]].forEach(p => soft('bench', p[0], p[1]));
    [[84, 45, 0], [85, 45, 1], [86, 45, 2]].forEach(p => put('sch_motor', p[0], p[1], 1, 1, p[2])); put('sch_rack', 83, 45); put('sch_hoop', 90, 47); put('sch_hoop', 103, 47);
    [[64, 46], [86, 47], [39, 43], [63, 47], [88, 39]].forEach(p => soft('trash', p[0], p[1])); [[43, 43], [47, 42], [55, 43], [59, 43], [43, 47], [55, 47], [47, 50], [43, 51], [55, 51], [59, 51]].forEach(p => soft('pot', p[0], p[1]));
    soft('laundry', 47, 46, 2, 1); soft('laundry', 53, 54 - 2, 2, 1);
    /* gambut: kayu tumbang, vegetasi rawa, semak, pohon jarang, pintu air + pos pantau */
    [[9, 47], [14, 52], [31, 47], [7, 43], [34, 52]].forEach(p => soft('log', p[0], p[1], 2, 1));
    soft('sluice', 17, 48, 2, 1); put('house', 25, 51, 3, 2, 2);
    for (let y = L.peat[1]; y <= L.peat[3]; y++) for (let x = L.peat[0]; x <= L.peat[2]; x++) {
      const g = ground[at(x, y)]; if (g !== TL.PEAT && g !== TL.PEATD) continue; const r = hs(x * 31 + y * 17 + 5), nearCanal = y >= 47 && y <= 52;
      if (r < (nearCanal ? 0.11 : 0.03)) soft('reed', x, y, 1, 1, r < 0.05 ? 1 : 0); else if (r > 0.97) soft('tree', x, y); else if (r > 0.93 && g === TL.PEATD) soft('sch_bush', x, y);
    }
    /* pohon pelindung di permukiman, pasar, lapangan: jarang & hanya di rumput kosong (tidak menutup pintu/jalan karena jalan = tanah/paving) */
    for (let y = L.south; y <= 53; y++) for (let x = 40; x <= 103; x++) { if (ground[at(x, y)] !== TL.GRASS || solid[at(x, y)]) continue;
      const r = hs(x * 57 + y * 29 + 11); if (r < 0.045 && !(x >= 48 && x <= 51)) soft('tree', x, y); else if (r > 0.985) soft('sch_bush', x, y); }
    for (let y = 0; y < M.C.MAP_H; y++) for (let x = 0; x < 4; x++) if (y >= L.south && !solid[at(x, y)] && ground[at(x, y)] === TL.GRASS) soft('tree', x, y);
    return placed;
  }

  /* ---------- hiasan lapisan tanah: genangan gambut, tepi kanal, marka parkir & lapangan ---------- */
  function decals(g) {
    const t = (x, y) => M.Map.tileAt(x * T + 8, y * T + 8), a = (c, al, x, y, w, h) => { g.globalAlpha = al; g.fillStyle = c; g.fillRect(x, y, w, h); g.globalAlpha = 1; };
    for (let y = L.peat[1]; y <= L.peat[3]; y++) for (let x = L.peat[0]; x <= L.peat[2]; x++) {
      const k = t(x, y);
      if ((k === TL.PEAT || k === TL.PEATD) && hs(x * 11 + y * 41 + 3) > 0.9) { const w = 7 + ((x + y) % 4), h = 3 + (x % 2); a('#2a4a5a', .85, x * T + 3, y * T + 8, w, h); a('#5a8aa0', .6, x * T + 4, y * T + 8, w - 3, 1); }   // genangan kecil
      if (k === TL.WATER) for (const [dx, dy, c] of [[0, -1, 'n'], [0, 1, 's'], [-1, 0, 'w'], [1, 0, 'e']]) { const n = t(x + dx, y + dy); if (n === TL.WATER || n === TL.BRIDGE) continue;       // tepian kanal jelas
        a('#241408', .9, c === 'e' ? x * T + 14 : x * T, c === 's' ? y * T + 14 : y * T, c === 'n' || c === 's' ? T : 2, c === 'n' || c === 's' ? 2 : T); }
    }
    const f = L.paving.field, X0 = f[0] * T + 8, Y0 = f[1] * T + 8, FW = (f[2] - f[0] + 1) * T - 16, FH = (f[3] - f[1] + 1) * T - 16;       // lapangan desa
    a('#6f8aa0', .5, f[0] * T, f[1] * T, (f[2] - f[0] + 1) * T, (f[3] - f[1] + 1) * T);
    g.fillStyle = '#fff'; g.fillRect(X0, Y0, FW, 1); g.fillRect(X0, Y0 + FH, FW, 1); g.fillRect(X0, Y0, 1, FH); g.fillRect(X0 + FW, Y0, 1, FH + 1); g.fillRect(X0 + (FW >> 1), Y0, 1, FH);
    const hl = L.paving.heli, hx = (hl[0] + hl[2] + 1) * T / 2, hy = (hl[1] + hl[3] + 1) * T / 2;                                                // helipad: lingkaran + huruf H
    a('#4a4d52', .9, hl[0] * T, hl[1] * T, (hl[2] - hl[0] + 1) * T, (hl[3] - hl[1] + 1) * T); g.strokeStyle = '#f0e060'; g.lineWidth = 2; g.beginPath(); g.arc(hx, hy, 26, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#f6efd8'; g.fillRect(hx - 10, hy - 12, 4, 24); g.fillRect(hx + 6, hy - 12, 4, 24); g.fillRect(hx - 10, hy - 2, 20, 4);
    const hp = L.paving.healthPark; a('#55585e', .85, hp[0] * T, hp[1] * T, (hp[2] - hp[0] + 1) * T, (hp[3] - hp[1] + 1) * T);                     // area kendaraan darurat (aspal) + marka
    g.fillStyle = '#e8e8e8'; for (let y = hp[1]; y <= hp[3]; y++) g.fillRect(hp[0] * T + 2, y * T + 8, (hp[2] - hp[0] + 1) * T - 4, 1);
    const fa = L.paving.fireApron; a('#55585e', .8, fa[0] * T, fa[1] * T, (fa[2] - fa[0] + 1) * T, T);                                              // apron garasi pos pemadam
    g.fillStyle = '#ffd36a'; for (let x = fa[0] * T + 4; x < (fa[2] + 1) * T; x += 12) g.fillRect(x, fa[1] * T + 14, 6, 1);
  }

  /* ---------- NPC & objek interaktif ---------- */
  const npc = (id, tx, ty, name, sprite) => ({ id, kind: 'npc', tx, ty, name, verb: 'Bicara', sprite, icon: sprite, r: 30, solid: true, noclear: true, fixed: true });
  const obj = (id, tx, ty, name, sprite, verb) => ({ id, kind: 'obj', tx, ty, name, verb: verb || 'Baca', sprite, icon: sprite, r: 28, solid: true, noclear: true, fixed: true });
  M.World.add([
    npc('pm_ani', 65, 49, 'Bu Ani (sayur)', 'pedagang'), npc('pm_dedi', 73, 49, 'Pak Dedi (ikan)', 'pedagang2'), npc('pm_rina', 81, 49, 'Bu Rina (perlengkapan)', 'pedagang'), npc('pm_warung', 56, 48, 'Bu Warung', 'warga3'), obj('pm_board', 69, 47, 'Papan Pasar Desa', 'pasarboard'),
    npc('pk_perawat', 94, 39, 'Perawat Sari', 'perawat'), npc('pk_dokter', 90, 39, 'dr. Budi', 'dokter'), obj('pk_board', 87, 40 - 1 + 0, 'Papan Puskesmas', 'healthboard'),
    npc('fs_komandan', 51, 39, 'Komandan Regu Damkar', 'damkar'), npc('fs_damkar', 60, 39, 'Petugas Pemadam', 'damkar'), obj('fs_board', 61, 38, 'Peralatan Pemadam', 'firerack', 'Periksa'),
    npc('pp_petugas', 57, 31, 'Petugas Pos Kesehatan', 'perawat'), obj('pp_board', 57, 29, 'Papan Pos Kesehatan Darurat', 'healthboard'),
    obj('pt_board', 14, 46, 'Papan Edukasi Gambut', 'peatboard'), obj('pt_canal', 30, 46, 'Pemeriksaan Kanal', 'peatboard', 'Periksa'), npc('pt_pantau', 26, 53, 'Pak Rahmat (pemantau gambut)', 'warga')
  ]);
  const TEXT = {
    pm_ani: ['Bu Ani: “Sayur segar dari ladang desa! Kalau kemarau panjang, harga cabai ikut naik karena lahan sulit diairi.”', 'Bu Ani: “Kami tidak membakar sisa sayur. Sisanya dikomposkan, supaya tidak ada asap di sekitar pasar.”'],
    pm_dedi: ['Pak Dedi: “Ikan dari sungai dan kanal. Saat air kanal terlalu dangkal, ikan susah dicari — lahan gambut yang kering juga ikut mudah terbakar.”', 'Pak Dedi: “Kalau pasar berasap, kami tutup lapak dan membantu warga lansia pindah ke tempat aman dulu.”'],
    pm_rina: ['Bu Rina: “Saya menjual masker dan botol air. Saat asap tebal, masker kain biasa kurang melindungi — pilih masker N95 yang menempel rapat di wajah.”', 'Bu Rina: “Anak-anak, lansia, dan ibu hamil sebaiknya tinggal di dalam ruangan saat udara tidak sehat.”'],
    pm_warung: ['Bu Warung: “Mau teh hangat? Dulu kami masak pakai kayu di halaman. Sekarang kami dianjurkan memakai kompor dan tidak membuang bara sembarangan.”'],
    pm_board: ['PASAR DESA RIMBA ASRI: buka setiap hari 06.00–16.00. Buang sampah pada tempatnya dan DILARANG membakar sampah di area pasar.', 'JALUR EVAKUASI: dari pasar, ikuti Jalan Lintas Selatan ke barat lalu ke utara melalui jalan evakuasi menuju Titik Kumpul.'],
    pk_perawat: ['Perawat Sari: “Selamat datang di Puskesmas. Saat kabut asap, keluhan yang sering datang: batuk, mata perih, dan sesak.”', 'Perawat Sari: “Itu bukan diagnosis ya — kalau keluhan berat, segera periksa ke tenaga kesehatan. Dalam keadaan darurat hubungi 112.”'],
    pk_dokter: ['dr. Budi: “Asap karhutla mengandung partikel halus (PM2.5) yang bisa masuk jauh ke paru-paru. Mengurangi aktivitas di luar ruangan itu langkah paling mudah.”', 'dr. Budi: “Cuci muka, minum air cukup, dan gunakan masker saat harus keluar. Kalau sesak tidak membaik, jangan menunggu.”'],
    pk_board: ['PUSKESMAS RIMBA ASRI: pendaftaran, ruang pemeriksaan, ruang tunggu, dan ruang tindakan. Area depan untuk kendaraan darurat — jangan menghalangi ambulans.'],
    fs_komandan: ['Komandan Regu: “Pos Pemadam ini sengaja berada di Jalan Lintas Selatan. Dari sini kendaraan bisa langsung ke jalan evakuasi dan masuk ke arah hutan utara tanpa melewati rumah warga.”', 'Komandan Regu: “Warga cukup melapor lewat 112. Memadamkan api besar adalah pekerjaan tim terlatih dengan peralatan lengkap.”'],
    fs_damkar: ['Petugas Pemadam: “Kami memeriksa selang, pompa, dan tangki air setiap pagi. Peralatan harus siap kapan pun alarm berbunyi.”'],
    fs_board: ['PERALATAN POS PEMADAM: selang, nozzle, helm, sepatu pelindung, dan radio. Peralatan ini hanya untuk petugas terlatih.'],
    pp_petugas: ['Petugas Pos Kesehatan: “Pos ini dibuka saat keadaan darurat karhutla: pemeriksaan sederhana, istirahat, dan air minum untuk warga yang terdampak asap.”', 'Petugas Pos Kesehatan: “Warga yang sesak berat atau pingsan segera kami arahkan ke Puskesmas dengan ambulans.”'],
    pp_board: ['POS KESEHATAN DARURAT: dekat Titik Kumpul. Beda dengan Puskesmas: pos ini bersifat sementara untuk membantu warga saat evakuasi, sedangkan Puskesmas melayani sehari-hari.'],
    pt_board: ['LAHAN GAMBUT: tanah gambut menyimpan banyak karbon dan air. Jika dikeringkan lewat kanal, gambut menjadi sangat mudah terbakar dan apinya bisa merambat di bawah tanah.', 'PEMULIHAN: menjaga muka air tetap tinggi (membasahi kembali gambut), menanam tumbuhan asli rawa, dan memantau kanal membantu mencegah kebakaran.'],
    pt_canal: ['PEMERIKSAAN KANAL: kanal ini mengalirkan air dari lahan gambut ke sungai. Pintu air membantu menahan air supaya gambut tetap basah di musim kemarau.', 'Catatan petugas: muka air aman = gambut lembap. Jika air surut jauh di bawah tepi kanal, laporkan ke petugas desa.'],
    pt_pantau: ['Pak Rahmat: “Saya memantau tinggi air kanal dan kelembapan tanah gambut tiap pekan. Gambut yang basah sulit terbakar.”', 'Pak Rahmat: “Kalau melihat asap tipis dari tanah, jangan diinjak atau ditimbun sendiri. Laporkan segera ke Pos Pemadam atau 112.”']
  };
  const handles = poi => !!poi && Object.prototype.hasOwnProperty.call(TEXT, poi.id);
  const buildNode = poi => ({ title: poi.name, icon: poi.icon, tone: 'info', pages: TEXT[poi.id], footer: 'Desa Rimba Asri' });
  function init() {                                    // v2.0: sambungkan teks NPC kawasan baru & NPC sekolah (teks sekolah sebelumnya tidak pernah terhubung ke Content.build)
    if (M.Region.hooked) return; M.Region.hooked = true; const o = M.Content.build;
    M.Content.build = poi => { if (poi && !M.Missions.stepsAt(poi.id).length) { if (handles(poi)) return buildNode(poi); if (M.School.handles(poi)) return M.School.buildNode(poi); } return o(poi); };
  }
  M.Region = { L, inR, noForest, paint, build, decals, TEXT, handles, buildNode, init, hooked: false };
})(window.MPH);
