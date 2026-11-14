/* SMA Negeri 1 Rimba Asri v1.0 — kompleks sekolah di sisi timur desa (x 66-105, y 4-32), dibangun dengan sistem tilemap + objek yang sudah ada.
   Tata letak (petak): gerbang barat di jalan tanah baris 12-13 -> halaman depan + pos satpam -> poros jalan (selasar) menuju gedung utama (kepala sekolah, guru, TU)
   -> sayap ruang kelas / laboratorium / perpustakaan / UKS / toilet dikelompokkan di kiri-kanan jalur tengah -> kantin + taman di timur -> parkir motor & sepeda dan lapangan
   upacara/olahraga di barat daya. Pagar keliling digambar ke lapisan tanah (bukan objek) dan diberi tabrakan; gedung = objek besar bertabrakan penuh.
   Ruang di dalam gedung TIDAK dapat dimasuki (tampak luar saja); pintu & papan nama menunjukkan fungsi ruangan. Poros jalan/jalur pejalan kaki berupa petak paving agar jalur jelas. */
(function (M) {
  'use strict';
  const TL = M.T, T = M.C.TILE, S = () => M.Sprites;
  const L = {
    fence: [66, 4, 105, 32], gate: [12, 13],                                  // x0,y0,x1,y1 ; baris gerbang (celah pagar barat)
    axis: [66, 12, 98, 13], front: [67, 8, 76, 17], block: [78, 9, 97, 31], spine: [86, 9, 89, 31], parking: [67, 18, 76, 22], field: [67, 23, 77, 31], canteenYard: [98, 12, 104, 17],
    gardenNE: [99, 5, 104, 11], gardenSE: [99, 18, 104, 31],
    buildings: [                                                              // [tipe sprite, varian, tx, ty, w, h, nama]
      ['sch_main', 0, 78, 6, 20, 3, 'Gedung Utama'], ['sch_class', 0, 78, 15, 8, 3, 'Ruang Kelas X-1/X-2'], ['sch_class', 1, 90, 15, 8, 3, 'Ruang Kelas X-3/X-4'],
      ['sch_lab', 0, 78, 21, 8, 3, 'Laboratorium'], ['sch_lib', 0, 90, 21, 8, 3, 'Perpustakaan'], ['sch_class', 2, 78, 27, 8, 3, 'Ruang Kelas XI'],
      ['sch_uks', 0, 90, 27, 4, 3, 'Ruang UKS'], ['sch_wc', 0, 94, 27, 4, 3, 'Toilet'], ['sch_pos', 0, 67, 8, 3, 2, 'Pos Keamanan'], ['sch_canteen', 0, 99, 13, 5, 3, 'Kantin']
    ]
  };
  const inR = (x, y, r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
  const inFence = (x, y) => inR(x, y, L.fence);
  const isGate = (x, y) => x === L.fence[0] && y >= L.gate[0] && y <= L.gate[1];

  function fenceTiles() {
    const o = [], [x0, y0, x1, y1] = L.fence;
    for (let x = x0; x <= x1; x++) { o.push([x, y0, 'h']); o.push([x, y1, 'h']); }
    for (let y = y0 + 1; y < y1; y++) { if (!isGate(x0, y) && !(y >= 11 && y <= 14)) o.push([x0, y, 'v']); o.push([x1, y, 'v']); }
    return o;
  }
  /* ---------- tanah ---------- */
  function paint(ground, at) {
    const fill = (r, t) => { for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) ground[at(x, y)] = t; };
    const P = TL.PLAZA;
    fill(L.axis, P); fill(L.parking, P); fill(L.field, P); fill(L.canteenYard, P);                         // poros jalan, parkir, lapangan, halaman kantin = paving; sisanya halaman rumput
    fill([67, 10, 70, 11], P); fill([72, 10, 75, 11], P); fill([70, 14, 73, 16], P);                          // apron pos satpam, jalur papan sekolah, alas monumen
    fill(L.spine, P);                                                                                         // jalur tengah (selasar utama) dari pintu gedung utama ke selatan
    [9, 18, 24, 30].forEach(y => fill([78, y, 97, y], P));                                                    // selasar di depan tiap deret gedung (pintu menghadap selatan)
    L.buildings.forEach(b => fill([b[2], b[3], b[2] + b[4] - 1, b[3] + b[5] - 1], P));                    // v2.0: fondasi paving di bawah SELURUH jejak gedung (tak ada rumput yang tembus)
    fill([77, 18, 77, 22], P);                                                                                // sambungan parkir/lapangan -> selasar
    fill([101, 6, 101, 11], P); fill([101, 18, 101, 31], P);                                                  // jalur taman timur laut & tenggara
    [[82, 19], [93, 19], [82, 25], [93, 25]].forEach(g => { ground[at(g[0], g[1])] = P; });                    // celah pagar tanaman menuju halaman rumput
  }
  /* ---------- objek ---------- */
  function build(api) {
    const { objects, solid, at } = api, placed = { buildings: 0, skipped: [] };
    const put = (type, tx, ty, w, h, v) => {
      for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) if (solid[at(x, y)]) { placed.skipped.push(type + '@' + tx + ',' + ty); return false; }
      for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) solid[at(x, y)] = 1;
      objects.push({ type, tx, ty, w, h, v: v || 0 }); return true;
    };
    fenceTiles().forEach(f => { solid[at(f[0], f[1])] = 1; });                                         // pagar: tabrakan (gambar di lapisan tanah)
    L.buildings.forEach(b => { if (put(b[0], b[2], b[3], b[4], b[5], b[1])) placed.buildings++; });
    const P = (t, x, y, w, h, v) => put(t, x, y, w || 1, h || 1, v), row = (t, y, x0, x1, skip) => { for (let x = x0; x <= x1; x++) if (!skip || !skip.includes(x)) P(t, x, y); };
    P('sch_pillar', 66, 11); P('sch_pillar', 66, 14);                                                  // tiang gerbang (celah jalan baris 12-13)
    P('sch_gatesign', 67, 15, 2, 1); P('sch_monument', 71, 15, 2, 2); P('sch_flagpole', 72, 23);
    /* halaman depan: taman tertata di kiri-kanan jalur */
    [[68, 17], [69, 17], [74, 17], [75, 16]].forEach(p => P('sch_planter', p[0], p[1])); [[76, 9], [76, 10], [76, 16], [70, 9]].forEach(p => P('sch_bush', p[0], p[1]));
    P('bench', 74, 14); P('bench', 75, 14); P('lamp', 77, 11); P('lamp', 77, 14); P('lamp', 70, 12 - 1 - 1);
    [[67, 5], [70, 5], [73, 5], [76, 5], [68, 6], [72, 6], [75, 7], [69, 7]].forEach(p => P('tree', p[0], p[1]));
    /* gedung utama: selasar y9, halaman rumput y10-11 berpagar tanaman, tiang bendera tak ada (bendera di lapangan) */
    row('sch_bush', 11, 78, 85, [80, 83]); row('sch_bush', 11, 90, 97, [92, 95]); [[79, 10], [84, 10], [91, 10], [96, 10]].forEach(p => P('sch_planter', p[0], p[1])); [[81, 10], [94, 10]].forEach(p => P('tree', p[0], p[1]));
    P('lamp', 85, 10); P('lamp', 90, 10);
    /* deret kelas/lab/perpus: pagar tanaman memanjang di sisi utara tiap lorong rumput, dengan celah */
    [19, 25].forEach(y => { row('sch_bush', y, 78, 85, [82]); row('sch_bush', y, 90, 97, [93]); });
    [[80, 20], [84, 20], [91, 20], [96, 20], [80, 26], [84, 26], [91, 26], [96, 26]].forEach(p => P('bench', p[0], p[1]));
    P('lamp', 85, 18); P('lamp', 90, 18); P('lamp', 85, 24); P('lamp', 90, 24); P('lamp', 85, 30); P('lamp', 90, 30);
    row('sch_bush', 31, 78, 85); row('sch_bush', 31, 90, 97);
    /* parkir + lapangan */
    [[68, 19, 0], [69, 19, 1], [70, 19, 2], [72, 19, 0], [73, 19, 1], [68, 21, 2], [70, 21, 0], [71, 21, 1], [73, 21, 2], [74, 21, 0]].forEach(p => P('sch_motor', p[0], p[1], 1, 1, p[2]));
    [[75, 19], [75, 21]].forEach(p => P('sch_rack', p[0], p[1])); P('sch_bike', 76, 19); P('sch_bike', 76, 21);
    P('sch_hoop', 67, 27); P('sch_hoop', 77, 27); P('sch_goal', 72, 31); P('lamp', 77, 23);
    /* kantin + taman: meja di halaman kantin, jalur taman dikapit pohon dan bangku */
    [[99, 17], [103, 17]].forEach(p => P('sch_table', p[0], p[1])); P('lamp', 98, 11); P('lamp', 98, 14);
    [[100, 6], [102, 6], [103, 7], [100, 9], [103, 10], [100, 11], [102, 11]].forEach(p => P('tree', p[0], p[1])); P('bench', 100, 7); P('bench', 102, 8); 
    [[100, 19], [102, 19], [100, 22], [102, 22], [100, 25], [102, 25], [100, 28], [102, 28], [100, 31], [103, 21], [103, 24], [103, 27], [103, 30], [99, 20], [99, 29]].forEach(p => P('tree', p[0], p[1]));
    P('bench', 100, 23); P('bench', 102, 26); P('bench', 100, 29 - 0);
     [[99, 18], [99, 21], [99, 24], [99, 27], [104, 19], [104, 22], [104, 25], [104, 28], [104, 31]].forEach(p => P('sch_bush', p[0], p[1]));
    return placed;
  }
  /* ---------- hiasan di lapisan tanah (digambar sekali) ---------- */
  function decals(g) {
    const s = S(), tile = (img, x, y) => g.drawImage(img, x * T, y * T);
    const fh = M.util.cv(T, T), fv = M.util.cv(T, T);
    (function () { const a = fh.getContext('2d'), b = fv.getContext('2d'), R = (c, x, y, w, h, ctx) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
      for (const ctx of [a]) { R('#00000026', 0, 12, 16, 3, ctx); R('#7a2a1a', 0, 3, 16, 2, ctx); R('#a8412a', 0, 3, 16, 1, ctx); R('#4a4e56', 0, 6, 16, 1, ctx); R('#4a4e56', 0, 11, 16, 1, ctx); for (let x = 2; x < 16; x += 3) R('#5a5e66', x, 5, 1, 7, ctx); }
      R('#00000026', 2, 12, 12, 4, b); R('#7a2a1a', 5, 0, 6, 16, b); R('#a8412a', 5, 0, 2, 16, b); R('#c8644a', 5, 0, 1, 16, b); R('#4a4e56', 3, 0, 1, 16, b); R('#4a4e56', 12, 0, 1, 16, b); R('#5a5e66', 3, 3, 10, 1, b); R('#5a5e66', 3, 9, 10, 1, b); })();
    fenceTiles().forEach(f => { if (f[2] === 'h') { tile(fh, f[0], f[1]); if ((f[0] - L.fence[0]) % 4 === 0) { g.fillStyle = '#c8644a'; g.fillRect(f[0] * T + 6, f[1] * T + 1, 4, 11); g.fillStyle = '#e8dcc0'; g.fillRect(f[0] * T + 5, f[1] * T, 6, 2); } } else tile(fv, f[0], f[1]); });
    const px_ = (c, a, x, y, w, h) => { g.globalAlpha = a; g.fillStyle = c; g.fillRect(x, y, w, h); g.globalAlpha = 1; };
    const [pa, pb, pc, pd] = L.parking, [fa, fb, fc, fd] = L.field;
    px_('#55585e', 0.88, pa * T, pb * T, (pc - pa + 1) * T, (pd - pb + 1) * T);                         // aspal parkir + garis petak
    g.fillStyle = '#e8e8e8'; for (let x = pa; x <= pc + 1; x++) { g.fillRect(x * T, 19 * T + 1, 1, 14); g.fillRect(x * T, 21 * T + 1, 1, 14); }
    g.fillRect(pa * T + 2, 20 * T + 8, (pc - pa + 1) * T - 4, 1);
    px_('#6f8aa0', 0.55, fa * T, fb * T, (fc - fa + 1) * T, (fd - fb + 1) * T);                         // lapangan: karet biru-abu + marka putih
    const X0 = fa * T + 6, Y0 = fb * T + 6, FW = (fc - fa + 1) * T - 12, FH = (fd - fb + 1) * T - 12;
    g.fillStyle = '#ffffff'; g.fillRect(X0, Y0, FW, 1); g.fillRect(X0, Y0 + FH - 1, FW, 1); g.fillRect(X0, Y0, 1, FH); g.fillRect(X0 + FW - 1, Y0, 1, FH); g.fillRect(X0, Y0 + (FH >> 1), FW, 1);
    const cx = X0 + (FW >> 1), cy = Y0 + (FH >> 1); for (let a = 0; a < 64; a++) { const t = a / 64 * Math.PI * 2; g.fillRect(Math.round(cx + Math.cos(t) * 18), Math.round(cy + Math.sin(t) * 18), 1, 1); }
    g.fillStyle = '#d8352a'; g.fillRect(X0 + 1, cy - 12, 14, 1); g.fillRect(X0 + 1, cy + 12, 14, 1); g.fillRect(X0 + 14, cy - 12, 1, 25); g.fillRect(X0 + FW - 15, cy - 12, 14, 1); g.fillRect(X0 + FW - 15, cy + 12, 14, 1); g.fillRect(X0 + FW - 15, cy - 12, 1, 25);
    g.fillStyle = '#ffffff'; for (let y = Y0 + 4; y < Y0 + FH - 4; y += 6) { g.fillRect(cx - 1, y, 2, 1); }                  // garis barisan upacara
    px_('#9ab07a', 0.5, 86 * T - 1, 9 * T, 1, 22 * T); px_('#9ab07a', 0.5, 90 * T, 9 * T, 1, 22 * T);       // tepi jalur tengah (selasar)
    for (let x = 86; x <= 89; x++) for (let y = 9; y <= 31; y++) if (inR(x, y, L.block) && (y % 2) === 0 && (x === 87 || x === 88)) px_('#c9c3ad', 0.35, x * T + 2, y * T + 6, 12, 4);
    px_('#e6d8a8', 0.5, 98 * T, 12 * T, 7 * T, 6 * T);                                                     // lantai kantin
  }

  /* ---------- NPC & objek sekolah ---------- */
  const npc = (id, tx, ty, name, sprite) => ({ id, kind: 'npc', tx, ty, name, verb: 'Bicara', sprite, icon: sprite, r: 30, solid: true, noclear: true, fixed: true });
  const obj = (id, tx, ty, name, sprite, verb) => ({ id, kind: 'obj', tx, ty, name, verb: verb || 'Baca', sprite, icon: sprite, r: 28, solid: true, noclear: true, fixed: true });
  M.World.add([
    npc('sk_satpam', 69, 11, 'Pak Satpam', 'satpam'), npc('sk_kepsek', 90, 10, 'Kepala Sekolah', 'kepsek'), npc('sk_guru', 82, 24, 'Pak Guru IPA', 'guru'),
    npc('sk_siswa1', 73, 26, 'Rafi (siswa)', 'siswa1'), npc('sk_siswa2', 98, 20, 'Nadia (siswa)', 'siswa2'), npc('sk_kantin', 101, 16, 'Bu Kantin', 'kantin'),
    obj('sk_map', 70, 14, 'Denah Sekolah', 'schoolmap'), obj('sk_rules', 84, 18, 'Papan Tata Tertib', 'schoolrule'), obj('sk_garden', 103, 9, 'Taman Sekolah', 'schoolgarden', 'Periksa')
  ]);
  /* v1.0: titik misi sekolah lama (Papan Sekolah, Bu Sari, Dina) dipindahkan dari hutan timur laut ke kompleks sekolah baru (koordinat tetap, tidak digeser peta). */
  [['school', 72, 10], ['sari', 74, 11], ['dina', 70, 16]].forEach(a => { const q = M.World.byId[a[0]]; if (q) { q.tx = a[1]; q.ty = a[2]; q.fixed = true; q.noclear = true; q.clear = 0; } });
  const TEXT = {
    sk_satpam: ['Pak Satpam: “Selamat datang di SMA Negeri 1 Rimba Asri. Semua tamu lapor di pos ini dulu, ya.”', 'Pak Satpam: “Kalau ada asap tebal, bel sekolah dibunyikan dan kami arahkan murid ke ruang kelas yang tertutup. Lapangan upacara jadi titik kumpul bila harus keluar gedung.”'],
    sk_kepsek: ['Kepala Sekolah: “Selamat datang, Penjaga Hutan. Tahun lalu kami sempat meliburkan sekolah berhari-hari karena kabut asap.”', 'Kepala Sekolah: “Sekolah harus aman: kegiatan luar ruangan dikurangi saat udara tidak sehat, orang tua diberi kabar, dan kami mengikuti arahan resmi dinas.”'],
    sk_guru: ['Pak Guru IPA: “Di laboratorium kami belajar kenapa gambut menyimpan banyak karbon dan kenapa kebakarannya sulit dipadamkan.”', 'Pak Guru IPA: “Asap karhutla berisi partikel halus (PM2.5) yang bisa masuk jauh ke paru-paru. Pakai masker yang sesuai dan tetap di dalam ruangan saat udara buruk.”'],
    sk_siswa1: ['Rafi: “Dulu kami upacara di lapangan ini, tapi saat asap tebal upacara dibatalkan. Langit sampai kuning!”', 'Rafi: “Sekarang tim PMR sekolah punya masker cadangan dan tahu cara menolong teman yang sesak napas.”'],
    sk_siswa2: ['Nadia: “Kami di OSIS bikin poster ‘Jangan Bakar Lahan’ dan memasangnya di taman sekolah.”', 'Nadia: “Kalau lihat asap atau api, kami laporkan ke guru dan ke 112. Tidak ada yang mencoba memadamkan sendiri.”'],
    sk_kantin: ['Bu Kantin: “Es teh dan gorengan hangat! Pesan dulu sebelum jam istirahat habis.”', 'Bu Kantin: “Kalau udara berasap, jendela kantin saya tutup dan pelanggan dianjurkan makan di dalam. Jangan lupa cuci tangan.”'],
    sk_map: ['DENAH SEKOLAH: gerbang & pos keamanan di barat; halaman depan; Gedung Utama (kepala sekolah, guru, TU) di utara; ruang kelas, laboratorium, perpustakaan, UKS, toilet di tengah; kantin & taman di timur; parkir dan lapangan upacara/olahraga di barat daya.', 'Titik kumpul darurat sekolah: lapangan upacara. Jalur pejalan kaki ditandai paving; jangan menghalangi pintu gedung.'],
    sk_rules: ['TATA TERTIB: datang tepat waktu, jaga kebersihan, jangan membuang sampah sembarangan, dan jangan membakar sampah di lingkungan sekolah.', 'SIAGA ASAP: bila indeks udara tidak sehat, kegiatan di luar ruangan dikurangi, jendela ditutup, dan murid mengikuti arahan guru.'],
    sk_garden: ['TAMAN SEKOLAH: murid menanam bibit pohon dan membuat kompos dari daun kering. Bekas daun tidak dibakar, tetapi dikomposkan.']
  };
  const handles = poi => !!poi && Object.prototype.hasOwnProperty.call(TEXT, poi.id);
  const build_ = poi => ({ title: poi.name, icon: poi.icon, tone: 'info', pages: TEXT[poi.id], footer: 'SMA Negeri 1 Rimba Asri' });
  M.School = { L, inR, inFence, isGate, paint, build, decals, handles, buildNode: build_, TEXT, fenceTiles, inside: (px, py) => inFence(Math.floor(px / T), Math.floor((py - 1) / T)) };
})(window.MPH);
