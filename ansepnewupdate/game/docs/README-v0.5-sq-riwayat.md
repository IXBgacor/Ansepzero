# Misi Penjaga Hutan — Beta v0.5⁴

Game edukasi 2D pixel-art (HTML5 Canvas, tanpa dependensi). Lanjutan v0.5²: semua fitur lama dipertahankan (30 misi/6 bab, Misi Terakhir, dialog, kuis, skor, bintang, nama pemain, sertifikat PDF, pause, fullscreen, Android analog, PC keyboard/mouse, BGM, SFX, localStorage, kamera geser, cutscene pemadam). Lihat `CHANGELOG.md`, `KONTROL.md`, `AUDIO-ASET.md`, `STATUS-TESTING.md`.

## Menjalankan
Sajikan folder lewat server statis (`python3 -m http.server 8000` → `http://localhost:8000/`) atau hosting statis. Jangan dari `file://`: aset WAV tidak bisa dimuat (SFX NPC memakai bunyi sintesis cadangan; game tetap jalan).

## Yang baru di v0.5⁴
**1. Perbaikan bug cutscene menembus objek.** Penyebab: mobil & petugas pemadam bergerak lurus tanpa memeriksa peta. Sekarang: mobil hanya melintasi ruas jalan tanah yang diperiksa bebas objek (muncul dari ujung jalan dengan fade, tidak melewati pepohonan tepi) dan petugas berjalan di jalur BFS (`Map.findPath`) yang menghindari pohon/batu/air/objek serta dinding area api, dihaluskan dan setiap ruasnya dijamin bebas tabrakan hitbox kaki. Semua aktor cutscene bab memakai mekanisme yang sama.
**2. Kamera geser lebih leluasa.** Kamera boleh melewati tepi peta sejauh `CAM_OVERSCROLL` = 56 px (≈3,5 petak) ke segala arah, tidak lebih. Area di luar peta digambar sebagai hutan gelap yang berlanjut dengan bayangan di tepi peta. Sisanya sama: player tidak berjalan, joystick tidak terpengaruh, kembali halus ke player saat dilepas.
**3. Cutscene tiap bab (6 cutscene, ±15–19 dtk, dapat dilewati setelah 2 dtk).** Diputar sekali saat 5 misi sebuah bab selesai, setelah dialog penutup misi ditutup:
 1. *Kenali Hutan* — tur pohon besar (O₂, daun jatuh), sarang & burung terbang, kanal/gambut (riak, tetes air), sungai.
 2. *Waspada Api* — simulasi: cuaca panas, puntung menyala, percikan jatuh ke semak kering, api kecil membesar; ditutup anjuran lapor, bukan memadamkan sendiri.
 3. *Dampak* — kabut asap menebal; papan AQI memerah, warga batuk, sekolah libur, pasar sepi; udara menjernih di akhir.
 4. *Penjaga Masyarakat* — Joko, Bima, Rina, Dina berjalan ke Balai Desa menemui Pak Lurah; centang & hati.
 5. *Pelaporan Aman* — cincin jarak aman di sekitar asap, pin lokasi, gelombang radio + "112", surat terbang ke petugas yang lalu berangkat.
 6. *Pemulihan Lahan* — kanal terisi air, 7 tunas tumbuh di dekat persemaian, lalu kamera ke utara: asap tebal → "Saatnya Misi Terakhir!".
 Bab yang sudah selesai dapat diputar ulang dari panel **Bab & Misi** (tombol "▶ Putar Cutscene Bab N", hanya saat di dalam permainan). Status sudah-diputar: `mph.chcut`; dihapus saat Reset Progres. Progres lama tidak memicu cutscene bab yang sudah selesai sebelumnya (hanya yang baru diselesaikan) — gunakan tombol putar ulang. Matikan semua: `CH_CUT: false` di `js/config.js`.
**4. Tanda tempat ideal untuk interaksi.** Untuk tujuan misi aktif (NPC, objek, atau area "amati") muncul **cincin emas berdenyut + panah kecil di tanah**, tepat di posisi berdiri yang ideal: di depan NPC/objek, atau di cincin jarak aman (sisi yang membuat area bahaya tetap terlihat di layar). Berdiri di sana → berubah **hijau ✔** dan tombol INTERAKSI/E pasti aktif untuk tujuan itu. Posisi dihitung otomatis dan diverifikasi: bebas tabrakan, bisa dicapai, dan `Interact.scan()` memilih tujuan yang benar. Atur lewat `SPOT_MARKERS` di `js/config.js`. (Api besar final tidak diberi tanda: bukan tujuan misi, dan area sekitarnya terhalang sungai/asap lain.)

## Alur
Nama → 30 misi (cutscene di akhir tiap bab) → kebakaran besar di utara → **Petugas Rimba** → **Ikut Membantu** (5 objective) atau **Selesai Sekarang** → (bila membantu) cutscene pemadam → dialog penutup → ending → Dapatkan Sertifikat.

## Bintang & sertifikat
Tidak berubah dari v0.5 (lihat `docs/README-v0.5-riwayat.md`).

## Struktur
```
js/chapter_cutscenes.js  6 cutscene bab + pemicu + putar ulang
js/cutscene.js           mesin cutscene umum + cutscene Misi Terakhir
js/spots.js              tanda tempat ideal interaksi
js/map.js                + footBlocked / findPath (BFS) / reachable
js/sprites_v054.js       efek pixel art (burung, kilau, hati, centang, pin, surat, koin, tunas ...)
js/game.js               kamera: overscroll, area luar peta, urutan render
tools/gen_audio.py       pembuat seluruh aset WAV (sintesis, CC0)
tests/                   skrip uji (lihat STATUS-TESTING.md)
docs/                    dokumen versi sebelumnya
```
