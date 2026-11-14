# Misi Penjaga Hutan — Beta v0.5

Game edukasi 2D pixel-art (HTML5 Canvas, tanpa dependensi). Lanjutan v0.4³ FINAL: 30 misi/6 bab, dialog, kuis, skor, pause, fullscreen, PC & Android, audio — semuanya dipertahankan. Baru di v0.5: nama peserta, SFX NPC, Misi Terakhir, bintang akhir, ending, sertifikat PDF. Lihat `CHANGELOG.md` dan `KONTROL.md`.

## Menjalankan
Sajikan folder lewat server statis (`python3 -m http.server 8000` → `http://localhost:8000/`) atau hosting statis. Membuka `index.html` dari `file://` bisa, tetapi beberapa browser membatasi media dari `file://`.

## Alur
Nama → 30 misi → (kebakaran besar muncul di utara, musik tegang) bicara dengan **Petugas Rimba** → pilih **Ikut Membantu** (5 objective simulasi, urut: warga → perlengkapan → jalur evakuasi → catatan kondisi → lapor Komandan Lapangan) atau **Selesai Sekarang** → ending → Dapatkan Sertifikat.
Simulasi hanya tugas pendukung relawan di bawah arahan petugas; tidak ada instruksi memadamkan kebakaran. Area api memiliki penghalang tak terlihat; pemain tidak bisa berjalan ke sana.

## Bintang
Skor misi = skor 30 misi (maks 2940). Misi final: 5 objective × 20 poin (−5 per jawaban salah, minimal 10).
| Bintang | Syarat |
|---|---|
| ⭐⭐⭐ | 30 misi + simulasi final selesai, skor misi ≥ 70% |
| ⭐⭐ | simulasi final selesai tetapi skor misi < 70%, ATAU simulasi dilewati dengan skor misi ≥ 70% |
| ⭐ | simulasi dilewati dan skor misi < 70% |
Alasan bintang ditampilkan di layar ending. Ambang 70% dapat diubah di `calc()` pada `js/final.js`.

## Struktur audio
```
assets/audio/bgm/Pixel_Reverb.mp3         musik latar (tidak diubah); saat Misi Terakhir diputar lebih lambat/rendah (BGM_TENSE_RATE)
assets/audio/sfx/npc/npc-talk.m4a         SFX NPC (file Anda: npc.m4a)
assets/audio/sfx/npc/npc-talk.mp3         salinan mp3 (cadangan format, dibuat dari file yang sama)
js/audio.js                               SFX sintesis + BGM + suara NPC dari file (voice/npcStop/setTense)
js/config.js                              BGM_FILE, BGM_TENSE_FILE, BGM_TENSE_RATE, NPC_SFX
```
## Mengganti SFX NPC
1. Taruh file baru di `assets/audio/sfx/npc/` (mp3/ogg/m4a; disarankan 0,5–4 detik).
2. Ubah `NPC_SFX.files` di `js/config.js` (dicoba berurutan; yang gagal dimuat dilewati). Atur `volume`, `minMs`/`maxMs`/`msPerChar` (lama bunyi per halaman dialog) dan `cooldownMs`.
3. Kosongkan `files` untuk memakai bunyi sintesis lama. Status aset saat ini: **ASET TERSEDIA** (file Anda sudah dipasang).
Catatan: file Anda berdurasi ±4,3 dtk; game memutarnya maksimal `maxMs` (2,4 dtk) per halaman dialog lalu menghentikannya. Bila ingin bunyi lebih pendek/halus, potong file atau kecilkan `maxMs`.
Musik tegang khusus: isi `BGM_TENSE_FILE` bila punya file sendiri (belum ada; sekarang memakai musik biasa yang diperlambat).

## Cara kerja sertifikat
- Dibuat hanya bila `Final.P.finished` benar, nomor sertifikat ada, nama ada, dan 30 misi selesai; sebelum itu `openCert()` menolak.
- Isi: nama, judul "Sertifikat Penyelesaian Misi Penjaga Hutan", keterangan penyelesaian simulasi edukasi, bintang, skor akhir, tanggal, nomor unik (`MPH-YYYYMMDD-XXXXXX`, 6 karakter acak dari `crypto.getRandomValues`; dibuat sekali, disimpan).
- Tombol **Download / Cetak Sertifikat PDF** memanggil `window.print()`; CSS cetak (`@page A4 landscape`, margin 0) hanya mencetak sertifikat. Pilih "Simpan sebagai PDF" di dialog browser. Tertulis di sertifikat bahwa ini bukan sertifikat resmi pemerintah/sekolah.
- Mengubah nama setelah tamat memperbarui nama pada sertifikat (nomor, skor, tanggal tetap).

## Status testing (jujur)
Dijalankan otomatis dengan **Chromium headless (Playwright)**; skrip ada di `tests/`. Ini **bukan** uji perangkat nyata.
| Uji | Hasil |
|---|---|
| Desktop 1100×620: nama (validasi, simpan, reload, ubah), misi final terkunci pada 0 dan 29 misi, terbuka pada 30, kebakaran/BGM tegang, tidak bisa berjalan ke api, dialog pilihan, jawaban salah/benar, urutan objective, 5 objective → tamat, bintang 3/2/1, ending, sertifikat (isi & tidak terpotong), PDF cetak, nomor unik, persistensi reload, save v0.4³ 12 misi terbaca, data v0.5 rusak, NPC SFX (tidak bertumpuk, berhenti, fallback format & file hilang) | 41/41 lulus |
| Android emulasi (touch/CDP) 915×412, 740×360, 568×320: layar nama, joystick, tombol INTERAKSI, dialog muat, ending & sertifikat via sentuh (915×412) | 21/21 lulus |
| Validasi data 30 misi, jarak titik misi final dari zona bahaya (semua di luar cincin merah), Reset Progres (nama tetap, tamat terhapus), jalan 12 dtk di mode Misi Terakhir | lulus, 0 error JS |
| PDF cetak (Chromium `page.pdf`, A4 landscape) | 1 halaman, 841,92×594,96 pt, teks nama/judul/nomor ada |

**Belum diuji / batasan:** perangkat Android/iOS nyata; Firefox dan Safari; dialog "Simpan sebagai PDF" di browser nyata (hanya `page.pdf` Chromium); kebijakan autoplay asli dan keseimbangan suara secara pendengaran (SFX NPC & musik tegang hanya diukur ada/tidaknya, bukan enak/tidaknya); kenyamanan keyboard layar HP saat mengetik nama; permainan penuh 30 misi lewat input nyata pada v0.5 (pada uji ini 30 misi ditandai selesai via API untuk menguji Misi Terakhir; kode 30 misi tidak diubah dan datanya lolos `Missions.validate()`); koordinat objective Misi Terakhir berdekatan dengan objek lama di beberapa tempat (margin ke zona asap lama minimal 14 px) sehingga posisi bisa disetel ulang di `js/pois_v05.js` setelah dicoba langsung.
