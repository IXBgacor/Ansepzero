# Misi Penjaga Hutan — v2.1 Alpha

> **Status: Alpha V2.1 — SEBAGIAN.** Dikerjakan bertahap dari Alpha 1.0. Yang sudah selesai & teruji tercantum di `CHANGELOG-v2.0.md` (V2.0) dan `CHANGELOG-v2.1.md` (V2.1); yang belum ada di bagian "Belum selesai". Seluruh fitur dan 30 misi Alpha 1.0 tetap berjalan.

## Menjalankan
**Desktop:** `python3 -m http.server 8124` di folder ini, buka `http://localhost:8124/` (Chrome/Edge/Firefox).
**Android:** unggah folder ke hosting statis (GitHub Pages/Netlify) lalu buka di Chrome Android; atau jalankan server di PC dan buka `http://IP-PC:8124/` dari HP di jaringan yang sama. Disarankan mode lanskap.
**Uji otomatis:** `pip install playwright && playwright install chromium`, jalankan server, lalu `python3 tests/uji-v20.py` (27 uji V2.0/V2.1) dan `python3 tests/uji-v10.py` (57 uji Alpha 1.0).

## Kontrol baru di V2.0
| | Desktop | Android |
|---|---|---|
| Interaksi | E / Enter (petunjuk hanya muncul bila ada target) | tombol INTERAKSI (muncul hanya dekat NPC/objek), di atas tombol LARI |
| Peta desa | **M** atau klik minimap | ketuk minimap bundar di kanan atas |
| Tutup peta | Esc / M / tombol ✕ | tombol ✕ |
| Kecilkan panel Bab & Misi | tombol “—” di panel, ketuk chip untuk membuka | sama |
| Zoom tampilan | roda mouse, tombol + / − | cubit dua jari, tombol + / − di kiri minimap |
| Zoom peta desa | tombol + / − di peta, geser untuk menggulir | sama |
| Pengaturan (suara, layar penuh, jeda) | ikon roda gigi kanan atas | ikon roda gigi kanan atas |
| Sepeda pribadi (dimiliki sejak awal) | tombol B | tombol SEPEDA di kiri tombol LARI |
| Naik kendaraan | dekati, tombol INTERAKSI / E (“Naik: …”) | tombol INTERAKSI |
| Mengemudi | WASD / panah, Shift = ngebut (+ sirene untuk ambulans & pemadam) | joystick, LARI = ngebut (+ sirene) |
| Turun | tombol INTERAKSI / E (“Turun: …”) | tombol INTERAKSI |

**Misi Kendaraan (v4.0):** setiap kendaraan punya misi sendiri. Saat naik muncul dialog konfirmasi **“Mulai misi / Tidak, hanya berkendara”**. Panel misi kecil muncul di kiri atas (mode PC: tengah atas); penanda kuning di minimap/peta desa menunjukkan target. Hanya satu misi aktif; memulai misi lain membatalkan yang berjalan. Misi selesai tersimpan dan bisa diulang.
| Kendaraan | Misi |
|---|---|
| Traktor (2 ladang) | Bajak seluruh petak ladang barat / timur Titik Kumpul |
| Mobil Pemadam | Padamkan 3 titik api di tepi Jalan Lintas Selatan: berhenti dekat api, selang menyemprot otomatis |
| Helikopter Damkar | Padamkan 3 hotspot lahan gambut dengan melayang di atasnya; tangki kecil, isi ulang dengan melayang di atas sungai/kanal |
| Ambulans | Jemput 3 warga di permukiman selatan (berhenti dekat warga), antar ke Puskesmas |

**Helikopter Damkar:** terparkir di helipad sebelah timur Pos Pemadam (dekat Jalan Lintas Selatan). Naik lewat tombol INTERAKSI, gerakkan joystick untuk lepas landas, terbang bebas di atas bangunan/air/pohon (LARI = ngebut, hanya dibatasi tepi peta). Tombol berubah menjadi **Mendarat**; pendaratan hanya berhasil di tanah lapang (bukan air/bangunan/pohon), lalu tekan lagi untuk turun.

**Kendaraan:** 2 traktor (dekat ladang, sebelah timur Titik Kumpul), ambulans (area darurat Puskesmas), mobil pemadam (depan garasi Pos Pemadam). Tabrakan memakai grid yang sama dengan pemain (air, bangunan, pohon, NPC tetap penghalang). Cutscene otomatis menurunkan pemain. Posisi kendaraan tidak disimpan (kembali parkir saat game dimulai ulang).
| Zoom tampilan | roda mouse, tombol + / − | cubit dua jari, tombol + / − di kiri minimap |
| Zoom peta besar | tombol + / − di peta, geser untuk menggulir | sama |
| Naik/turun kendaraan | E / Enter | tombol INTERAKSI ("Naik: …" / "Turun: …") |
| Mengemudi | WASD / panah, Shift = ngebut (+ sirene) | joystick, tombol LARI = ngebut (+ sirene) |
| Pengaturan (suara, layar penuh, jeda) | ikon gear kanan atas | ikon gear kanan atas |

---
(Dokumentasi Alpha 1.0 di bawah ini tetap berlaku.)

# Misi Penjaga Hutan — v1.0 Alpha

Game edukasi 2D pixel-art (HTML5 Canvas, tanpa dependensi, tanpa langkah build) tentang pencegahan karhutla dan keselamatan warga di sebuah desa di Kalimantan Selatan.
Proyek ini **melanjutkan v0.6 Beta**: 30 misi, 6 bab, Misi Terakhir Evakuasi, sertifikat PDF, audio, dan seluruh aset lama dipertahankan.

## Menjalankan
**Desktop:** sajikan folder dengan server statis, mis. `python3 -m http.server 8000` lalu buka `http://localhost:8000/` di Chrome/Edge/Firefox. (Dari `file://` game tetap jalan, tetapi berkas WAV tidak dapat dimuat sehingga suara NPC memakai cadangan.)
**Android:** unggah folder ke hosting statis (GitHub Pages, Netlify, dsb.) dan buka alamatnya di Chrome Android; atau jalankan server di PC dan buka `http://IP-PC:8000/` dari HP di jaringan yang sama. Putar HP ke mode lanskap.

## Kontrol
| | Desktop | Android |
|---|---|---|
| Gerak | W A S D / panah | joystick kiri |
| **Lari (baru)** | tahan **Shift** | tahan tombol **LARI** (kiri tombol INTERAKSI) |
| Interaksi | E / Enter | tombol INTERAKSI |
| Dialog cerita | Enter / E / Spasi atau klik kotak | ketuk kotak / Lanjut |
| Jeda | Esc | tombol jeda |

Dialog cutscene punya tombol kecepatan: **Otomatis** (maju sendiri), **Manual** (menunggu ketukan), **Cepat**. Pilihan disimpan.

## Yang baru di v1.0 Alpha
1. **Cerita utama (±2,5 menit, dapat dilewati).** Pembukaan alam Kalimantan + judul animasi, masa kecil dan alasan tokoh peduli hutan, perjalanan nyata di peta (jalan tanah, jembatan, gerbang desa), bertemu Pak Lurah, Pak Lurah membuka Balai Desa dan menyerahkan perlengkapan (rompi, topi, radio HT, buku saku), warga bersorak, lalu hari pertama di Pos Jaga Hutan — tempat bermain yang sebenarnya, dengan Misi 1 langsung tersedia. Dapat diputar ulang dari menu.
2. **Persistent world state** (`js/worldstate.js`). Kondisi dunia terpisah dari animasi: api, warga, bangunan (pintu balai, jendela rumah, posko), evakuasi, progres cerita, perlengkapan. Setiap event hanya berlaku sekali; cutscene yang dilewati menghasilkan kondisi akhir yang sama; tersimpan di `localStorage` (`mph.v10.world`).
3. **Cutscene berbasis timeline** (`js/story.js`): skrip generator (`wait/fade/camGo/walk/say/par/sub`) di atas mesin cutscene lama (mode `manual`).
4. **Kompleks sekolah SMA Negeri 1 Rimba Asri** (peta kini 108×36; tata letak disusun ulang: jalur tengah, selasar di depan tiap deret gedung, halaman rumput berpagar tanaman, jalur taman): gerbang + pos satpam, halaman depan, Gedung Utama (ruang kepala sekolah, guru, TU), 3 gedung ruang kelas, laboratorium, perpustakaan, UKS, toilet, kantin, taman, parkir motor/sepeda, lapangan upacara/olahraga, pagar keliling, jalur paving, 9 NPC/objek informasi baru. Titik misi Papan Sekolah, Bu Sari, dan Dina dipindahkan ke sini.
5. **Lari**: pengali 1,75×; sprite lari khusus (badan condong ke depan, bahu berayun), bayangan gerak di belakang, debu, langkah terangkat 2 px, siklus animasi lebih cepat; diagonal tidak lebih cepat; collision utuh. Tombol sentuh LARI terpisah dari joystick dan INTERAKSI dan diuji dengan sentuhan multi-touch nyata.
6. **Ending baru**: cutscene "final" (pemadam memadamkan api) kini dilanjutkan cutscene **ending**: inspeksi area terbakar dari jarak aman, panorama hutan terselamatkan, pengumuman aman, warga + Pak Lurah pulang berjalan, posko dibongkar, perayaan dan banner "OPERASI PEMADAMAN BERHASIL". Setelah itu semua api/asap padam permanen; tanah hangus dan pohon gosong tetap terlihat.
7. **Evakuasi → pemulihan**: saat darurat jendela rumah tertutup dan posko dipasang; Pak Lurah ikut ke titik kumpul; warga tetap di sana sampai ancaman berakhir (tidak langsung normal setelah cutscene evakuasi), lalu pulang. Dialog warga berubah ke versi pasca-pemulihan.
8. **Audit titik misi otomatis** (`js/audit.js`): setiap pemuatan memeriksa semua titik interaksi misi (batas peta, tabrakan, keterjangkauan, pemilihan target di titik berdiri, cincin aman area bahaya) dan menulis `console.warn` bila ada masalah. Hasil v1.0: 61 titik valid.

## Bug yang diperbaiki
- **Tombol LARI tidak merespons di HP** (perbaikan pasca-rilis): wadah `#actions` menutupi tombol dan menelan sentuhan. Kini `#actions` tidak menangkap sentuhan dan tombol punya z-index lebih tinggi; diuji dengan multi-touch nyata (joystick + LARI: kecepatan 1,75×).
- Pintu Balai Desa tertutup kios (petak depan pintu solid) → kios kedua dipindah ke (51,14).
- Papan Sekolah/Bu Sari/Dina berada di hutan terpencil timur laut yang sempit → dipindah ke halaman depan sekolah (koordinat tetap, tervalidasi audit); teks petunjuk misi diperbarui.
- Api/asap tetap menyala dan zona bahaya tetap aktif setelah misi tamat → sekarang padam lewat world state (tidak hidup lagi setelah muat ulang atau pindah area).
- Warga/Pak Lurah tetap di titik kumpul selamanya setelah cerita selesai → kembali ke rumah.
- Misi lama yang menjaga alur: tidak ada target di luar peta, di balik objek, atau tak terjangkau (diaudit otomatis; pada baseline v0.6 semua 40 titik misi sudah valid, kini 61 titik termasuk sekolah dan Misi Terakhir).

## Struktur kode baru
```
js/worldstate.js  state dunia persisten + event idempoten + reconcile/migrasi
js/story.js       runner timeline, kotak dialog sinematik, cutscene intro & ending
js/school.js      tata letak/builder/dekal/NPC sekolah
js/sprites_v10.js sprite sekolah, NPC sekolah, ikon perlengkapan, overlay pintu/jendela, tanah hangus
js/audit.js       validator titik misi
css/v10.css       tombol LARI, dialog sinematik, judul, banner, kartu perlengkapan
tests/uji-v10.py  uji otomatis (Playwright) — memakai helper tests/uji-v06.py
```
Dimodifikasi: config, map, world, player, input, cutscene, final, evac, village, game, main, rescue_cutscenes, campaign_data, index.html.

## Penyimpanan & migrasi
Kunci lama (`mph.save`, `mph.v05`, `mph.chcut`, `mph.v06`, dst.) tidak berubah. Kunci baru: `mph.v10.world` (state dunia) dan `mph.v10.dlg` (kecepatan dialog). Pemuatan memvalidasi data; data rusak dipindah ke `mph.v10.world.corrupt` dan diganti default.
- **Save v0.6 yang sudah tamat:** otomatis dianggap pasca-ending (api padam, warga di rumah, perlengkapan ada); cerita pembuka tidak dipaksa (dapat diputar dari menu).
- **Save v0.6 di tengah permainan:** progres dipertahankan; cerita pembuka tidak dipaksa.
- **Permainan baru / Reset progres:** cerita pembuka diputar dari awal dan dunia kembali ke kondisi awal.
- Menghapus `mph.v10.world` saja akan menyelaraskan ulang state dari progres misi.

## Keterbatasan (jujur)
- Interior gedung sekolah **tidak dapat dimasuki** (tampak luar; pintu dan papan nama menunjukkan ruangan).
- Stamina lari **tidak** diimplementasikan (opsional di spesifikasi; sengaja dihindari agar tidak mengganggu misi).
- Sprite lari dibuat otomatis dari frame jalan yang ada (condong + ayunan bahu + bayangan gerak), bukan gambar tangan frame baru. Animasi "menanam" pada adegan masa kecil hanya gerakan bergantian dua frame.
- Cerita tidak punya pilihan dialog bercabang; tokoh pemain tidak berganti sprite setelah menerima rompi (sprite sudah berseragam).
- Pengujian dilakukan otomatis di Chromium headless (desktop dan emulasi layar sentuh). Belum diuji di perangkat Android fisik, Firefox, atau Safari.
- Cutscene intro/ending memakai efek suara/ambience sintesis yang sudah ada; tidak ada musik baru.
