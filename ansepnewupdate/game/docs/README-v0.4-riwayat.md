# Misi Penjaga Hutan — Beta v0.4 (Kampanye 30 misi + joystick analog)

Game edukasi pixel art tentang pencegahan dan pelaporan kebakaran hutan dan lahan (karhutla). HTML + CSS + JavaScript murni, Canvas 2D, **tanpa library, tanpa build, tanpa file gambar** (seluruh sprite digambar lewat Canvas). Total ±190 KB.

> Status: **Beta**. Diuji otomatis di Chromium 141 headless (Playwright) dengan emulasi sentuhan. **Belum diuji di perangkat Android nyata** (lihat bagian "Yang belum diuji").

## Cara menjalankan
1. Ekstrak ZIP, buka `index.html` di browser (Chrome Android atau desktop). Tidak perlu server.
2. Tekan **Mulai Game** → di gerbang, **Aktifkan Layar Penuh & Mulai** (atau **Main tanpa layar penuh**). Putar HP ke **landscape**.
3. Kontrol:
   - **HP:** geser jempol di **joystick** kiri bawah (makin jauh, makin cepat; sentuhan kecil di tengah diabaikan). Tombol **INTERAKSI** di kanan bawah. **Jeda** di kanan atas. Ketuk kotak misi di kiri atas untuk daftar bab/misi.
   - **Komputer (untuk uji):** panah / W A S D (bisa diagonal), **E** = interaksi, **Esc** = jeda/tutup.
4. Progres tersimpan otomatis di `localStorage` perangkat.

## Perubahan v0.3 → v0.4
**1. Kontrol analog.** D-pad lama **diganti** (sesuai permintaan) dengan joystick virtual analog. Gerak 360° halus dengan "tarikan lunak" ke 8 arah (±7°) agar mudah berjalan lurus/diagonal; kecepatan naik bertahap setelah zona mati 18%; diagonal tidak lebih cepat. Satu jari memegang joystick, jari lain bebas menekan INTERAKSI/Jeda (multi-sentuh). Joystick otomatis disembunyikan dan input dilepas saat dialog/menu/panel terbuka. Keyboard tetap berfungsi (kini diagonal).

**2. Kampanye 30 misi (6 bab × 5).** Data ada di file terpisah `js/campaign_data.js`; mesin di `js/missions.js`. Tiap misi punya ID, judul, deskripsi, tujuan, petunjuk, briefing NPC, langkah yang bisa diselesaikan, materi edukasi singkat, hadiah skor, dan status Terkunci/Aktif/Selesai. Misi dibuka berurutan. Gameplay bervariasi: periksa objek, bicara dengan warga, pilih tindakan, **amati tanda bahaya dari jarak aman**, kuis singkat/berseri, dan menyusun laporan. 41 titik interaksi di peta (7 lama + 34 baru).

**3. Keselamatan.** Tidak ada langkah yang meminta mendekati api/asap, menerobos asap, atau memadamkan sendiri; jawaban benar selalu: *menjauh → catat → laporkan ke petugas/112*. Area bahaya punya cincin merah (zona bahaya, mengurangi poin) dan hijau (jarak amati aman). Materi kesehatan dibuat umum dan mengarahkan ke tenaga kesehatan. 11 misi bertanda ⚑ perlu verifikasi sumber resmi (lihat bawah).

**4. Progres & skor.** Tracker menampilkan bab, misi aktif, tujuan aktif, skor, dan selesai x/30. Format simpanan naik ke **v3** dengan **migrasi aman** dari v0.2/v0.3: save lama dibaca, **tidak ada progres direset**, dan salinan aslinya disimpan di `localStorage['mph.save.v03.bak']`. Save rusak disalin ke `mph.save.corrupt` (tidak dibuang diam-diam); save dari versi lebih baru tidak ditimpa. Tombol Reset tetap butuh konfirmasi dua ketukan dan tidak menghapus cadangan.

**5. UI.** Layar **Bab & Misi** (bisa dibuka dari menu maupun saat bermain), tracker ringkas (±10% kanvas), briefing misi otomatis sekali per misi, penanda penutupan bab, panah kuning di tepi layar menuju tujuan yang di luar layar, evaluasi akhir per bab.

### Fitur lama yang dipertahankan / diubah (tanpa penghapusan diam-diam)
| Fitur lama | Status v0.4 |
|---|---|
| 3 misi v0.3 (`patrol`, `friend`, `report`): ID, teks dialog, urutan jawaban, poin | **Dipertahankan**, kini jadi misi ke-6, 16, 23 di Bab 2, 4, 5 (◆ di daftar) |
| 7 titik lama (Petugas, Papan, Sampel Tanah, Bekas Api Unggun, Pak Joko, Penanda Bahaya, Asap) dan posisinya | Dipertahankan; peta & seed sama |
| Gerbang landscape + layar penuh, Jeda, Mulai Ulang, Reset, evaluasi bintang | Dipertahankan |
| Dialog "misi belum dibuka" per objek | **Diubah**: objek milik misi yang belum terbuka menampilkan pesan umum + nama misi terkait (karena kini ada 30 misi) |
| Progres v0.3 | Dimigrasi; misi lama yang sudah selesai tetap selesai walau misi Bab 1 masih harus dikerjakan (urutan baru) |
| D-pad | **Diganti** joystick (permintaan eksplisit) |
| Dialog "Misi berikutnya" di akhir misi | **Diganti** briefing otomatis misi berikutnya |

## Daftar 30 misi
◆ = misi lama v0.3 yang dipertahankan · ⚑ = materi perlu verifikasi sumber resmi · Total hadiah maksimum: **2940 poin**. Jawaban salah mengurangi poin langkah (minimum 25%); masuk zona bahaya saat tugas amati juga mengurangi poin.

**Bab 1 — Kenali Hutan** (Fungsi hutan, lahan gambut, dan ekosistem.)

| # | ID | Misi | Gameplay | Hadiah |
|---|----|------|----------|--------|
| 1 | `c1m1` | Hutan, Penjaga Kehidupan | periksa/bicara + kuis/pilih tindakan (1 soal) | 80 |
| 2 | `c1m2` | Rumah Bagi Satwa | periksa/bicara + kuis/pilih tindakan (1 soal) | 80 |
| 3 | `c1m3` | Misteri Tanah Gambut ⚑ | periksa/bicara + kuis/pilih tindakan (1 soal) | 90 |
| 4 | `c1m4` | Hutan, Air, dan Tanah | periksa/bicara + kuis/pilih tindakan (1 soal) | 80 |
| 5 | `c1m5` | Ujian Bab 1: Kuis Penjaga Pemula | kuis/pilih tindakan (3 soal) | 100 |

**Bab 2 — Waspada Api** (Penyebab karhutla, cuaca kering, dan sumber penyulut.)

| # | ID | Misi | Gameplay | Hadiah |
|---|----|------|----------|--------|
| 6 | `patrol` | Patroli Lingkungan ◆ | periksa/bicara | 60 |
| 7 | `c2m2` | Cuaca Kering, Api Mudah Menyebar | periksa/bicara + kuis/pilih tindakan (1 soal) | 80 |
| 8 | `c2m3` | Mengenali Sumber Penyulut ⚑ | periksa/bicara + kuis/pilih tindakan (2 soal) | 80 |
| 9 | `c2m4` | Tingkat Kewaspadaan ⚑ | periksa/bicara + kuis/pilih tindakan (3 soal) | 100 |
| 10 | `c2m5` | Tanda Awal Kebakaran | amati jarak aman + kuis/pilih tindakan (1 soal) | 100 |

**Bab 3 — Dampak Karhutla** (Asap, lingkungan, kesehatan, sekolah, dan ekonomi.)

| # | ID | Misi | Gameplay | Hadiah |
|---|----|------|----------|--------|
| 11 | `c3m1` | Kabut Asap dan Kualitas Udara ⚑ | periksa/bicara + kuis/pilih tindakan (1 soal) | 80 |
| 12 | `c3m2` | Luka pada Lahan dan Satwa | amati jarak aman + kuis/pilih tindakan (1 soal) | 90 |
| 13 | `c3m3` | Asap dan Kesehatan Warga ⚑ | periksa/bicara + kuis/pilih tindakan (1 soal) | 80 |
| 14 | `c3m4` | Sekolah di Tengah Asap ⚑ | periksa/bicara + kuis/pilih tindakan (1 soal) | 90 |
| 15 | `c3m5` | Dampak pada Ekonomi | periksa/bicara + kuis/pilih tindakan (1 soal) | 90 |

**Bab 4 — Penjaga Masyarakat** (Edukasi warga dan pencegahan kebakaran.)

| # | ID | Misi | Gameplay | Hadiah |
|---|----|------|----------|--------|
| 16 | `friend` | Sahabat Masyarakat ◆ | periksa/bicara + kuis/pilih tindakan (1 soal) | 100 |
| 17 | `c4m2` | Poster Peringatan | periksa/bicara + kuis/pilih tindakan (1 soal) | 80 |
| 18 | `c4m3` | Penyuluhan di Balai Desa ⚑ | periksa/bicara + kuis/pilih tindakan (3 soal) | 100 |
| 19 | `c4m4` | Api Unggun yang Aman | periksa/bicara + kuis/pilih tindakan (1 soal) | 90 |
| 20 | `c4m5` | Jangan Bakar Sampah | periksa/bicara + kuis/pilih tindakan (1 soal) | 90 |

**Bab 5 — Pelaporan Aman** (Mengenali indikasi kebakaran, menentukan lokasi, dan melapor.)

| # | ID | Misi | Gameplay | Hadiah |
|---|----|------|----------|--------|
| 21 | `c5m1` | Kenali Tanda Kebakaran | periksa/bicara + kuis/pilih tindakan (2 soal) | 100 |
| 22 | `c5m2` | Tentukan Lokasi dengan Jelas | amati jarak aman + periksa/bicara + kuis/pilih tindakan (1 soal) | 100 |
| 23 | `report` | Laporan Bahaya ⚑ ◆ | amati jarak aman + kuis/pilih tindakan (1 soal) | 140 |
| 24 | `c5m4` | Siapa yang Harus Dihubungi? ⚑ | periksa/bicara + kuis/pilih tindakan (2 soal) | 100 |
| 25 | `c5m5` | Laporan Lengkap dari Jarak Aman | amati jarak aman + kuis/pilih tindakan (4 soal) | 140 |

**Bab 6 — Misi Penyelamatan Lingkungan** (Keputusan dalam skenario dan tantangan akhir.)

| # | ID | Misi | Gameplay | Hadiah |
|---|----|------|----------|--------|
| 26 | `c6m1` | Skenario: Pengunjung Merokok | kuis/pilih tindakan (3 soal) | 100 |
| 27 | `c6m2` | Skenario: Asap Mendekati Desa ⚑ | periksa/bicara + kuis/pilih tindakan (3 soal) | 120 |
| 28 | `c6m3` | Pulihkan Lahan Gambut ⚑ | periksa/bicara + kuis/pilih tindakan (1 soal) | 100 |
| 29 | `c6m4` | Patroli Gabungan | kuis/pilih tindakan (4 soal) | 100 |
| 30 | `c6m5` | Tantangan Akhir: Penjaga Hutan | amati jarak aman + kuis/pilih tindakan (8 soal) | 200 |


## Materi yang HARUS diverifikasi sebelum publikasi (⚑)
Tag "⚑ Perlu verifikasi" tampil di daftar misi selama `SHOW_VERIFY_TAGS: true` di `js/config.js` (set `false` sebelum publikasi).
- **Misteri Tanah Gambut** (`c1m3`): Fakta gambut (pembentukan, simpanan karbon, rewetting, sekat kanal): cek ke BRGM dan KLHK.
- **Mengenali Sumber Penyulut** (`c2m3`): Pernyataan bahwa banyak karhutla dipicu aktivitas manusia: cek angka/rujukan resmi KLHK atau BNPB.
- **Tingkat Kewaspadaan** (`c2m4`): Nama dan batas tingkat kewaspadaan di papan hanya contoh; cek istilah resmi sistem peringkat bahaya kebakaran BMKG/KLHK.
- **Kabut Asap dan Kualitas Udara** (`c3m1`): Kategori ISPU dan istilahnya: cek Permen LHK tentang ISPU dan publikasi KLHK/BMKG terbaru.
- **Asap dan Kesehatan Warga** (`c3m3`): Seluruh pernyataan kesehatan (kelompok rentan, tindakan di dalam ruangan, masker): cek ke Kementerian Kesehatan RI/WHO sebelum publikasi.
- **Sekolah di Tengah Asap** (`c3m4`): Kebijakan sekolah saat udara tidak sehat (libur/belajar dari rumah) ditetapkan pemda/dinas pendidikan; cek aturan setempat.
- **Penyuluhan di Balai Desa** (`c4m3`): Aturan larangan membuka lahan dengan membakar (termasuk pengecualian kearifan lokal) dan praktik pemadaman oleh warga: cek UU PPLH, aturan daerah, dan arahan BNPB/KLHK.
- **Laporan Bahaya** (`report`): Rujukan nomor darurat 112 dan alur pelaporan karhutla: cek ke BNPB/Kominfo dan kontak resmi pemda setempat.
- **Siapa yang Harus Dihubungi?** (`c5m4`): Daftar pihak yang dihubungi dan penggunaan 112 untuk karhutla di daerah target: cek ke Kominfo, BNPB/BPBD, dan pemda setempat.
- **Skenario: Asap Mendekati Desa** (`c6m2`): Prosedur evakuasi dan koordinasi desa saat asap tebal: cek pedoman BNPB/BPBD dan rencana kontinjensi daerah.
- **Pulihkan Lahan Gambut** (`c6m3`): Metode restorasi gambut (sekat kanal, revegetasi jenis asli): cek ke BRGM sebelum publikasi.


## Struktur file
```
index.html, css/style.css
js/config.js  storage.js  sprites.js  sprites_v02.js  map.js  player.js  dialog.js  game.js  main.js   (lama)
js/sprites_v04.js   7 NPC + 24 objek/area bahaya baru (Canvas)            [baru]
js/pois_v04.js      34 titik interaksi baru (posisi petak)                [baru]
js/campaign_data.js DATA 30 misi: edit di sini                            [baru]
js/world.js  input.js  missions.js  content.js  interact.js  ui.js  evaluation.js   (diubah)
docs/README-v0.3-riwayat.md   README lama (riwayat)
```
Menambah/ubah misi: edit `js/campaign_data.js`; titik baru: `js/pois_v04.js`. `Missions.validate()` memeriksa data (poi tak ada, soal tanpa tepat satu jawaban benar, dst.).

## Fitur yang SUDAH diuji (otomatis, Chromium 141 headless + emulasi sentuh)
88 pemeriksaan, 0 gagal, 0 error console pada seluruh tes:
- **Keterjangkauan:** 41/41 titik interaksi bisa dicapai berjalan dari titik awal dengan fisika tabrakan asli (terjauh ±11 dtk) dan terdeteksi tombol INTERAKSI.
- **Playthrough UI 30 misi:** semua 30 misi (66 langkah) diselesaikan lewat tombol E + klik dialog; skor 2940/2940; evaluasi akhir muncul; progres 30/30 utuh setelah reload. *Perpindahan antar titik di tes ini memakai teleport* (jalan kaki dibuktikan terpisah di tes keterjangkauan).
- **Logika:** misi berikutnya terkunci; langkah ber-syarat tidak bisa dilompati; jawaban salah → umpan balik + "Coba lagi" + poin berkurang; zona bahaya (banner, tombol nonaktif, penalti 1× per kunjungan); amati hanya dari cincin hijau.
- **Migrasi save:** fixture v2 berformat v0.3 asli (misi selesai, sebagian, statistik salah/bahaya, cadangan persis, toast), v1, save rusak, save v99 tidak ditimpa.
- **Joystick (sentuhan nyata via CDP):** dead zone, kecepatan 30%/60%/100% = 14/31/53 px/dtk, 8 arah tepat, 20° tidak dibulatkan & 3° ditarik ke 0°, lepas jari, pointercancel, multi-sentuh dengan INTERAKSI, joystick tidak aktif saat dialog.
- **Keyboard:** panah/WASD (diagonal 52 px/dtk), E, Esc.
- **UI:** Jeda/Lanjutkan/Mulai Ulang (progres tetap), Reset 2-ketukan, menu→Bab & Misi, tracker, briefing sekali per misi (dan muncul lagi setelah reset), portrait → minta putar.
- **Tata letak:** 6 ukuran landscape (568×320 … 960×440): joystick/INTERAKSI/Jeda/tracker tidak saling menimpa, semua dalam layar, semuanya menerima sentuhan.
- **Performa:** 60 fps, heap ±10 MB (headless).

## Yang BELUM diuji / keterbatasan (jujur)
- **Belum diuji di HP Android nyata** (layar penuh, kunci orientasi, rasa joystick, notch/safe-area). Di headless, layar penuh tidak tersedia sehingga jalur "Main tanpa layar penuh" yang diuji. CSS memakai `env(safe-area-inset-*)` tetapi tidak diverifikasi di perangkat bertakik.
- Playthrough 30 misi memakai teleport antar titik (lihat di atas); belum ada uji berjalan kaki 30 misi berturut-turut secara real-time.
- Skenario jawaban salah diuji pada beberapa misi, bukan semua 55 soal.
- Isi edukasi **belum ditinjau ahli**; lihat daftar ⚑. Statistik dan istilah resmi (ISPU, tingkat kewaspadaan, 112, BRGM) harus dicek.
- Placeholder pixel art buatan kode, belum aset final. Tidak ada audio.
- Peta v0.3 dipertahankan; 34 titik baru membuat peta ramai. Posisi sebagian titik digeser otomatis oleh generator peta ke rumput bebas terdekat.
- Misi dikerjakan sangat berurutan; tidak ada mode memilih misi bebas.
