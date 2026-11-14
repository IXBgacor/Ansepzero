# Misi Penjaga Hutan — Beta v0.3 (Tahap 3: sistem misi)

Fondasi visual, pergerakan, interaksi & misi. HTML + CSS + JavaScript murni, Canvas 2D, tanpa framework, tanpa build.

## Struktur
```
index.html          halaman & menu awal
css/style.css       tampilan responsif, menu, D-pad
js/config.js        konstanta & namespace (window.MPH)
js/sprites.js       placeholder pixel art via Canvas (ganti dengan PNG nanti)
js/map.js           peta, objek, tabrakan, render tile
js/input.js         keyboard + D-pad sentuh
js/player.js        karakter, animasi, tabrakan
js/game.js          loop requestAnimationFrame, kamera, urutan gambar
js/main.js          menu, fullscreen, resize
--- v0.3: js/evaluation.js (baru) + missions.js, ui.js, content.js, world.js, interact.js, game.js, main.js, index.html, css diubah ---
--- baru di v0.2 ---
js/storage.js       pembungkus localStorage yang aman (tidak melempar galat)
js/sprites_v02.js   placeholder pixel art: petugas, warga, papan, sampel tanah, bekas api unggun, penanda, api
js/world.js         titik interaksi (NPC/objek/asap), penanda, cincin zona bahaya/aman
js/missions.js      definisi 3 misi, progres, validasi syarat, simpan/muat
js/dialog.js        panel dialog + pilihan, anti-ketuk-ganda
js/content.js       teks dialog & umpan balik edukatif
js/interact.js      deteksi jangkauan, tombol INTERAKSI (touch + tombol E)
js/ui.js            panel Misi, tracker, banner keselamatan, reset progres
js/evaluation.js    (v0.3) ringkasan skor, peringkat bintang, catatan belajar
```
Modul memakai script biasa (bukan ES module) agar bisa dibuka langsung dari file tanpa server.

## Menjalankan
- **Paling mudah:** ekstrak ZIP, klik dua kali `index.html`.
- **Server lokal (disarankan untuk tes HP):** di folder proyek jalankan `python3 -m http.server 8080`,
  lalu buka `http://localhost:8080`. Di Android (Wi-Fi sama): `http://IP-KOMPUTER:8080`.

## Kontrol
Keyboard: panah / WASD. Sentuh: geser jempol pada D-pad kiri bawah. Esc atau tombol Jeda = jeda dan kembali ke menu.

## Checklist pengujian
- [ ] Menu muncul; "Mulai Main" membuka peta; "Cara Bermain" membuka/menutup petunjuk
- [ ] Panah dan WASD menggerakkan karakter ke 4 arah, sprite menghadap arah benar
- [ ] Animasi kaki berjalan saat bergerak, kembali diam saat berhenti atau menabrak
- [ ] Tidak tembus pohon, batu, sungai, maupun tepi peta
- [ ] Jembatan kayu bisa dilewati untuk menyeberang sungai
- [ ] Air beranimasi; kamera mengikuti dan berhenti di tepi peta
- [ ] Karakter tampil di depan/belakang pohon sesuai posisi (urutan kedalaman)
- [ ] D-pad sentuh: tekan, geser antar arah, lepas = berhenti (tes di Android Chrome)
- [ ] Layar Penuh masuk/keluar (menu & HUD); di Android mencoba kunci landscape
- [ ] Ubah ukuran jendela/rotasi HP: kanvas menyesuaikan, pixel tetap tajam
- [ ] Tombol Jeda → "Lanjutkan" kembali ke posisi semula; "Mulai Ulang" mengembalikan ke awal
- [ ] Pindah tab/aplikasi: game otomatis berhenti ke menu
- [ ] Gerak lancar (sekitar 60 FPS) di HP Android kelas menengah

## Update v0.3: sistem misi (objektif, skor, evaluasi, simpan progres)
Dikembangkan dari v0.2 tanpa membuat ulang game. Peta, sprite, kontrol, dialog, dan isi edukasi tetap; yang berubah ada di lapisan misi.

**Misi berurutan.** Misi 2 (Sahabat Masyarakat) terbuka setelah Misi 1 (Patroli Lingkungan) selesai; Misi 3 (Laporan Bahaya) setelah Misi 2. Objek/NPC milik misi yang masih terkunci tetap bisa dihampiri, tetapi dialognya menjelaskan misi mana yang harus diselesaikan dulu (badge "Terkunci") dan tidak mencatat objektif apa pun. Penanda kuning (!) hanya muncul untuk objektif misi yang sedang aktif. Aturan ini juga dijaga di `Missions.mark()`/`addStat()`, bukan hanya di dialog.

**Objektif & progres langsung.** Tracker di kiri atas (ketuk untuk membuka daftar misi) menampilkan misi aktif, bilah progres, daftar objektif bercentang, dan skor berjalan; semuanya berubah seketika saat objektif tercapai. Di Misi 3 ada baris status langsung: *Cari asap / Dekati cincin hijau / Jarak aman / Geser agar asap terlihat / Zona bahaya*. Popup kecil di tengah bawah menampilkan poin dan misi baru; popup menunggu sampai dialog/panel tertutup.

**Skor (maksimum 300).**
| Misi | Objektif (poin) | Pengurang |
|---|---|---|
| 1 Patroli (60) | Papan 20 · Sampel Tanah 20 · Api Unggun 20 | tidak ada |
| 2 Sahabat Masyarakat (100) | Bicara 20 · Jawaban tepat 80 | −25 per jawaban salah, minimal 20 |
| 3 Laporan Bahaya (140) | Amati dari jarak aman 60 · Laporan tepat 80 | −15 per masuk zona bahaya (minimal 20); −25 per jawaban salah (minimal 20) |
Masuk zona bahaya dihitung sekali per kunjungan (histeresis 10 px) dan hanya selama objektif "amati" belum selesai. Poin dihitung dari objektif + statistik, jadi selalu konsisten dengan progres. Tidak ada penalti waktu (agar pemain tidak terdorong terburu-buru mendekati asap).

**Evaluasi akhir.** Tampil otomatis setelah dialog penutup Misi 3 ditutup: bintang (≥90% = 3, ≥70% = 2, selain itu 1), gelar, skor/persentase, rincian per misi, dan catatan belajar sesuai kesalahan pemain. Bisa dibuka lagi dari menu utama, panel Misi, atau lewat Petugas Rimba. Tombol **Ulangi dari Awal** (ketuk 2x) menghapus progres, skor, dan statistik.

**Penyimpanan.** Kunci `mph.save` tetap sama; format naik ke `{v:2, ver, m:{misi:[objektif]}, st:{misi:{wrong, danger}}}`. Save v0.2 (`v:1`) tetap terbaca. Karena misi kini berurutan, progres v0.2 untuk misi yang melompati urutan dikosongkan dan pemain diberi tahu lewat toast; misi yang sudah selesai berurutan tetap utuh (skor save lama = tanpa kesalahan tercatat). Data rusak, versi asing, id asing, angka statistik tidak valid (negatif/teks/desimal/terlalu besar), serta localStorage diblokir/penuh ditangani tanpa galat.

**Perubahan kecil lain.** Banner "Zona bahaya" dipindah ke kanan atas agar tidak menimpa tracker yang kini lebih tinggi. Tombol Misi di kiri atas kini berisi tracker. Versi di judul/menu/HUD jadi Beta v0.3.

## Checklist pengujian Android (Chrome) — v0.3, **belum diuji di HP nyata**
- [ ] Tracker kiri atas terbaca, tidak menutupi joystick; ketuk membuka daftar misi (beberapa ukuran/rasio layar, notch)
- [ ] Misi 2 & 3 terkunci di awal: Pak Joko/asap menampilkan dialog "Terkunci", tidak ada progres tercatat
- [ ] Patroli: tiap objek memberi +20, tracker dan skor langsung berubah; popup tampil setelah dialog ditutup; periksa ulang tidak menambah poin
- [ ] Misi 2: jawaban salah mengurangi poin & hitungan "Salah Nx"; jawaban benar menyelesaikan dan membuka Misi 3
- [ ] Misi 3: status langsung berubah saat berjalan (jauh → cincin hijau → aman → bahaya); masuk cincin merah menambah hitungan sekali, bukan berulang-ulang di tepi
- [ ] Setelah Misi 3 selesai dan dialog ditutup, evaluasi tampil; bisa digulir sampai tombol Tutup/Ulangi dari Awal
- [ ] Tutup browser lalu buka lagi: progres, skor, statistik, dan tombol "Lihat Evaluasi Akhir" di menu pulih
- [ ] Ulangi dari Awal / Reset Progres Misi (ketuk 2x) menghapus semuanya, tetap kosong setelah refresh
- [ ] Joystick di kiri ditahan sambil mengetuk INTERAKSI di kanan: keduanya bekerja (multi-sentuh)
- [ ] Rotasi ke portrait saat evaluasi/dialog/panel terbuka: overlay putar; kembali landscape tanpa ketukan nyasar
- [ ] Gerak tetap lancar (±60 FPS) di HP kelas menengah, termasuk di dekat asap

## Hasil uji simulasi v0.3 (Chromium 141 headless via Playwright, **bukan HP nyata**)
239 pemeriksaan otomatis lulus, 0 gagal, tanpa galat JavaScript (3 skrip: alur, penyimpanan, tata letak). Mencakup: pemutaran penuh ketiga misi dari awal sampai evaluasi (ketukan emulasi sentuh), penguncian urutan, poin & pengurang, statistik zona bahaya + histeresis, tracker/popup/status langsung, evaluasi otomatis dan dari menu/panel/Petugas, reload & pemulihan, reset 2 ketukan, migrasi save v0.2 (lengkap, acak-urutan, sebagian), data rusak/dimanipulasi, localStorage diblokir dan penuh, ambang bintang & lantai poin, tata letak (tracker, banner, popup, D-pad, tombol INTERAKSI, dialog, panel, evaluasi) di 6 ukuran landscape 568×320 hingga 915×412, keyboard (panah/WASD/E/Escape/angka), jeda/rotasi saat modal terbuka, tidak ada listener ganda setelah 3x Jeda/Lanjutkan. Dua kesalahan ditemukan dan diperbaiki selama pengujian: tombol ✕ evaluasi belum bergaya, dan petunjuk gulir evaluasi di layar pendek.
Perbandingan waktu eksekusi per frame (headless, hanya relatif): v0.2 rata-rata 0,13–0,17 ms, v0.3 0,12–0,23 ms; ±60 frame/detik.
**Tidak bisa disimulasikan / belum diuji:** sentuhan multi-jari sungguhan, pengunci orientasi dan layar penuh Android, notch/safe-area nyata, performa dan keterbacaan di HP, Safari/iOS. Pada uji, posisi pemain sering dipindahkan langsung (teleportasi) ke dekat objek; berjalan nyata dengan keyboard hanya diuji sampai mendekati Papan Informasi.

## Masalah yang belum selesai / catatan
- Belum ada uji di HP Android nyata (lihat checklist di atas).
- Nilai poin, pengurang, dan ambang bintang adalah keputusan desain awal (`js/missions.js`, `js/evaluation.js`); perlu disetel setelah uji main.
- Tracker tidak bisa dilipat dan menutupi sebagian peta kiri atas (±236×95 px).
- Di layar landscape pendek, rincian evaluasi harus digulir (ada petunjuk gulir).
- Satu slot simpan, tanpa skor tertinggi atau riwayat percobaan; tidak ada pencatatan waktu.
- Teks edukasi (termasuk rujukan 112) belum ditinjau ahli/pihak berwenang.
- Cloudflare belum diintegrasikan (sesuai permintaan). Sprite masih placeholder Canvas.

## Update v0.2: interaksi, misi, dialog
**Interaksi.** Dekati NPC/objek (bertanda kuning bila relevan untuk misi), tombol **INTERAKSI** (kanan bawah, atau tombol **E** di keyboard) menyala hanya bila ada target dalam jangkauan. Label di atas tombol menyebut targetnya. Tombol diletakkan di sisi kanan, joystick di kiri; dialog/panel membekukan gerakan.

**Misi** (otomatis aktif; selesai hanya bila SEMUA langkah terpenuhi, dihitung dari langkah, bukan flag):
1. *Patroli Lingkungan*: periksa Papan Informasi, Sampel Tanah, Bekas Api Unggun (3 objek).
2. *Sahabat Masyarakat*: bicara dengan Pak Joko (tenggara, seberang jembatan), lalu pilih tindakan pencegahan yang tepat. Jawaban salah memberi umpan balik + "Coba lagi".
3. *Laporan Bahaya*: amati asap (utara jalan tanah) dari **jarak aman** (cincin hijau, 72–112 px dan asap terlihat di layar), lalu pilih tindakan pelaporan yang benar.
Tombol **Misi** (kiri atas) membuka daftar: nama, tujuan, progres, daftar langkah, status (Belum dimulai / Berlangsung / Selesai).

**Keamanan edukatif.** Tidak ada teks yang menyuruh mendekati api atau memadamkan kebakaran sendirian; opsi itu hanya muncul sebagai jawaban salah dengan penjelasan bahayanya. Cincin merah di sekitar asap = zona bahaya: tombol amati nonaktif dan muncul banner "Mundur". Petugas dan papan peringatan mengulang aturannya.

**Penyimpanan.** Kunci `mph.save` di localStorage (format `{v:1,m:{misi:[langkah]}}`), disimpan setiap ada perubahan. Saat dimuat: JSON rusak diabaikan (+ pemberitahuan), id asing dibuang, langkah yang syaratnya belum ada dibuang. Bila localStorage tidak ada/penuh: game tetap jalan, progres hanya di memori, pemain diberi tahu. **Reset Progres Misi** ada di menu (ketuk dua kali untuk konfirmasi). Tombol "Mulai Ulang" lama tetap hanya mengembalikan posisi.

**Catatan teknis.** Semua listener global dipasang sekali (tombol INTERAKSI, E, dialog, panel). Dialog punya jeda anti-ketuk-ganda (280 ms antar aksi, 350 ms sebelum bisa dibuka lagi). Tombol INTERAKSI memakai `pointerdown` agar tetap bekerja saat jempol lain menahan joystick. Peta lama dipertahankan (seed sama); hanya area 5x5 di sekitar titik interaksi dikosongkan dari pohon/batu.

## Checklist pengujian Android (Chrome) — v0.2, **belum diuji di HP nyata**
- [ ] Gerak D-pad, tabrakan, jembatan, animasi: tetap seperti v0.1
- [ ] Gerbang landscape & layar penuh: tetap berfungsi (lihat checklist di atas)
- [ ] Jauh dari objek: tombol INTERAKSI abu-abu/nonaktif; dekat papan/NPC: menyala & label benar
- [ ] Satu ketukan INTERAKSI membuka tepat satu dialog; ketukan cepat berulang tidak membuka ulang
- [ ] Tahan joystick dengan jempol kiri sambil mengetuk INTERAKSI dengan jempol kanan: keduanya bekerja
- [ ] Tombol INTERAKSI & label tidak menutupi joystick (coba beberapa HP/rasio layar)
- [ ] Dialog terbaca nyaman di landscape, semua pilihan terjangkau/tergulir, tombol >=44px, tidak terpotong notch
- [ ] Ketuk "Lanjut" dua kali cepat hanya maju satu halaman
- [ ] Patroli: periksa 3 objek; progres 1/3, 2/3 tidak menyelesaikan misi; 3/3 menyelesaikan
- [ ] Sahabat Masyarakat: jawaban salah -> umpan balik edukatif + Coba lagi; benar -> selesai
- [ ] Laporan Bahaya: dekat asap (cincin merah) tombol mati + banner; jarak aman tombol hidup; jawaban salah tidak menyelesaikan; benar menyelesaikan
- [ ] Tutup tab/browser lalu buka lagi: progres misi pulih; tracker & daftar Misi sesuai
- [ ] Menu -> Reset Progres Misi (ketuk 2x): progres kosong, tetap kosong setelah refresh
- [ ] Mode penyamaran/penyimpanan diblokir: game tetap jalan, ada pemberitahuan
- [ ] Putar ke portrait saat dialog terbuka: overlay putar; kembali landscape: dialog tetap ada, tidak ada ketuk nyasar
- [ ] Jeda saat dialog terbuka: menu muncul; Lanjutkan berjalan normal
- [ ] Layar penuh masuk/keluar tidak merusak HUD, tombol INTERAKSI, atau dialog
- [ ] Performa tetap lancar saat asap beranimasi

## Hasil uji simulasi v0.2 (Chromium 141 headless via Playwright, **bukan HP nyata**)
Lulus 72 pemeriksaan otomatis, tanpa galat JavaScript: pergerakan dengan keyboard sungguhan (termasuk berjalan dari titik awal ke Pak Joko dan ke titik amati asap); jangkauan & status tombol; satu dialog per aksi, anti-ketuk-ganda, cooldown; progres 1/3-3/3 dan syarat berurutan; ketiga misi sampai selesai; jawaban salah/benar; zona bahaya & jarak aman; simpan, muat ulang halaman, reset; localStorage penuh/tidak tersedia/rusak/dimanipulasi; posisi tombol vs joystick di 6 ukuran landscape (568x320 hingga 915x412); dialog di 568x320; Escape/Jeda saat dialog; tidak ada listener ganda setelah 3x Jeda/Lanjutkan; portrait saat dialog.
**Tidak bisa disimulasikan / belum diuji:** sentuhan multi-jari sungguhan (joystick + INTERAKSI), pengunci orientasi & layar penuh Android, notch/safe-area nyata, performa di HP. Ketuk pada uji memakai emulasi sentuhan Playwright.

## Update v0.1: gerbang landscape & layar penuh
Alur: Menu → **Mulai Game** → layar peringatan → **Aktifkan Layar Penuh & Mulai** → game berjalan hanya jika landscape.
- Layar penuh diminta langsung dari klik tombol (syarat browser). Lalu dicoba `screen.orientation.lock('landscape')`; bila tidak didukung, layar peringatan meminta pemutaran manual.
- Portrait (sebelum atau saat bermain): game berhenti dan overlay "Putar perangkat" tampil; otomatis lanjut saat landscape.
- Layar penuh ditolak/gagal: pesan galat, tombol **Coba Lagi**, dan **Main tanpa layar penuh**. Bila API tidak ada (mis. Safari iPhone), tombol berubah menjadi **Mulai**.
- Saat bermain: tombol **Layar Penuh/Keluar Layar Penuh** (jika didukung) dan **Jeda**.
- "Lanjutkan" dari menu langsung masuk bila sudah landscape; bila portrait, kembali lewat layar peringatan.

## Checklist pengujian Android (Chrome)
Hasil simulasi desktop ada di bagian bawah; semua poin di bawah **belum diuji di HP nyata**.
- [ ] Portrait, menu → Mulai Game: layar peringatan tampil, game belum jalan, status "Portrait ✘"
- [ ] Portrait, tekan Aktifkan Layar Penuh & Mulai: layar penuh aktif; kunci landscape berhasil (layar berputar sendiri) ATAU overlay "Putar perangkat" tampil
- [ ] Putar HP manual ke landscape: overlay hilang, game mulai otomatis, D-pad & HUD tidak tertutup
- [ ] Landscape, tekan tombol: langsung main, layar peringatan hilang
- [ ] Saat bermain putar ke portrait: game berhenti + overlay; putar balik: lanjut
- [ ] Tolak layar penuh (mis. izin diblokir/mode tertentu): pesan galat + "Coba Lagi" + "Main tanpa layar penuh" berfungsi, tidak ada crash
- [ ] Browser tanpa Fullscreen/Orientation API (mis. Safari iPhone): catatan tampil, tombol "Mulai", tetap bisa main
- [ ] Tombol Keluar Layar Penuh di HUD keluar dari fullscreen; Jeda membuka menu → Lanjutkan
- [ ] Layar peringatan terbaca & tidak terpotong di landscape HP (bisa di-scroll)
- [ ] Peta, tabrakan, animasi, D-pad tetap berfungsi seperti sebelumnya

## Hasil uji simulasi (Chromium headless, Playwright; bukan HP nyata)
Lolos: portrait → gerbang → overlay putar → otomatis mulai saat landscape; landscape + fullscreen berhasil; fullscreen ditolak (galat, "Coba Lagi", main tanpa layar penuh); API fullscreen tidak ada; putar ke portrait saat bermain menghentikan game; karakter bergerak; Jeda → "Lanjutkan"; tanpa galat JavaScript. Penguncian orientasi, perilaku layar penuh Android, dan sentuhan tidak bisa disimulasikan.
