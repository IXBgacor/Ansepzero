# Misi Penjaga Hutan — Beta v0.4³ FINAL

Game edukasi 2D pixel-art (HTML5 Canvas, tanpa dependensi). Lanjutan dari Beta v0.4² dengan penambahan **sistem audio**.
Semua fitur v0.4² dipertahankan: 30 misi / 6 bab, dialog, kuis, skor, progres tersimpan, pause, fullscreen, mode PC & Android, analog, responsif.

## Cara menjalankan
Sajikan folder lewat server statis (mis. `python3 -m http.server 8000` lalu buka `http://localhost:8000/`) atau unggah ke hosting statis.
Membuka `index.html` langsung dari `file://` juga bisa dimainkan, namun beberapa browser membatasi pemutaran media dari `file://`.

## Struktur audio
```
assets/audio/bgm/Pixel_Reverb.mp3   backsound (file asli Anda, tidak diubah)
js/audio.js                         mesin audio: SFX (sintesis WebAudio), BGM (1 elemen <audio>), pengaturan + localStorage
js/audio_ui.js                      panel Pengaturan Audio, tombol 🔊 HUD, bunyi klik tombol umum
js/config.js                        BGM_FILE = lokasi file backsound
```
- **SFX tidak memakai file**: disintesis saat dibutuhkan (nol unduhan, nol decode, tidak ada memori tambahan). Satu `AudioContext`, batas 12 suara bersamaan, jeda minimum per jenis suara, node dilepas setelah selesai.
- **BGM**: satu elemen `<audio>` streaming (tidak didecode ke memori), dibuat saat pertama dibutuhkan, loop, tidak pernah dimainkan ganda.
- Daftar SFX: langkah kaki (beda nada: rumput/tanah/jembatan), `interact`, `dlgOpen`/`dlgClose`, `talk` (3 blip pendek bernada rendah, bukan suara manusia; nada tetap per pembicara), `select`, `correct`, `wrong`, `reward` (skor), `mission` (misi selesai), `newMission`/`chapter` (briefing misi/pergantian bab), `ui`, `open`/`close` (panel), `pause`/`resume`.
- Langkah kaki hanya berbunyi saat karakter benar-benar bergerak (satu bunyi saat mulai, lalu tiap kaki menapak); menabrak dinding, dialog, dan pause = diam.

## Kontrol
**PC:** `W A S D` / panah = jalan · `E` / `Enter` / `Spasi` = interaksi · `1`–`9` atau klik = pilih jawaban · `Enter`/klik = lanjut dialog · `Esc` = tutup dialog/panel, atau jeda · tombol HUD: 🔊 suara, Layar Penuh, Jeda, Bab & Misi.
**Android:** analog kiri = jalan · tombol **INTERAKSI** = bicara/periksa · ketuk pilihan jawaban · tombol HUD sama. Game butuh layar landscape (ada layar putar-perangkat).

## Pengaturan BGM / SFX
- **🔊 di HUD** = Mute/Unmute semua suara (kapan saja saat bermain).
- **Menu → Pengaturan Audio**: Mute, BGM ON/OFF, SFX ON/OFF, Volume BGM, Volume SFX (0–100%). Tersimpan otomatis di `localStorage` (kunci `mph.audio`, terpisah dari progres `mph.save`).
- Panel dibuka dari menu/jeda. Saat panel terbuka BGM diputar sebagai pratinjau; saat ditutup berhenti lagi. Slider SFX berbunyi contoh saat dilepas.
- BGM hanya berjalan saat gameplay. Jeda, menu, layar potret, atau tab disembunyikan = fade-out lalu pause; lanjut dari posisi yang sama.
- Bila browser menolak autoplay, game tetap jalan, muncul pemberitahuan, dan musik dicoba lagi pada ketukan/tombol berikutnya. Bila file BGM gagal dimuat, game jalan tanpa musik dan panel menampilkan pesannya.
- Catatan iOS Safari: browser tidak mengizinkan volume elemen audio diubah lewat skrip, sehingga slider Volume BGM kemungkinan tidak berpengaruh di sana (Mute/ON-OFF tetap bekerja). Belum diuji di iOS.

## Cara mengganti backsound
1. Taruh file baru di `assets/audio/bgm/` (mp3/ogg/m4a).
2. Ubah `BGM_FILE` di `js/config.js`, mis. `'assets/audio/bgm/lagu-baru.mp3'` — atau cukup timpa `Pixel_Reverb.mp3` dengan nama yang sama.
3. Muat ulang. Tidak ada kode lain yang perlu diubah.

## Changelog
**v0.4³ FINAL**
- Baru: sistem audio (SFX sintesis + BGM streaming), Pengaturan Audio, tombol 🔊 HUD, penyimpanan pengaturan.
- Hook audio: langkah kaki (`player.js`), dialog/talk (`dialog.js`), interaksi (`interact.js`), kuis (`content.js`), reward/misi (`ui.js`), pause/resume/BGM (`main.js`), jenis petak untuk bunyi langkah (`map.js`).
- Versi dinaikkan; README lama dipindah ke `docs/`. Format save progres tidak berubah.

## Hasil testing
Dijalankan otomatis pada build final memakai **Chromium headless (Playwright)**, termasuk emulasi Android (Pixel 7, sentuh via CDP) pada 915×412, 740×360, 568×320. Ini **bukan** uji di perangkat nyata.

| Uji | Hasil |
|---|---|
| Perilaku audio (diam = sunyi, langkah, dialog, pause/resume, mute, simpan & muat volume, tidak ada BGM ganda, suara kembali 0 setelah 400 SFX beruntun) | 28/28 lulus |
| Skenario gagal (autoplay ditolak [disimulasikan], BGM 404, tanpa WebAudio, localStorage rusak/di luar rentang, render offline SFX) | 12/12 lulus |
| Panel audio & pratinjau BGM, slider volume | 11/11 lulus |
| PC: WASD, kuis dengan mouse, panel misi, layar penuh, jendela potret, tab tersembunyi | 12/12 lulus |
| Android emulasi ×3 ukuran: joystick, INTERAKSI, mute, jeda, rotasi, layout HUD & panel | 60/60 lulus |
| Kompatibilitas save v0.4² (12 misi) → terbaca utuh, dilanjutkan sampai tamat | 8/8 lulus |
| Kampanye penuh 30 misi lewat keyboard, dibandingkan dengan v0.4² | 30/30 selesai; skor per misi, progres, dan statistik identik (2735/2940); 0 error JS |
| Performa/memori (jalan 90 dtk, GC paksa) | heap mendatar seperti v0.4² (selisih ≈ +0,1 MB); 1 elemen audio; 0 suara tertinggal. Dengan CPU 4× lebih lambat FPS v0.4² dan v0.4³ saling tumpang tindih. |

**Belum diuji / batasan:** perangkat Android atau iOS nyata, Safari/Firefox, kenyamanan dan keseimbangan suara secara pendengaran (hanya amplitudo & durasi yang diukur — nada/volume mungkin perlu disetel), pemutaran BGM melalui `file://`, dan kebijakan autoplay browser asli (hanya disimulasikan).
