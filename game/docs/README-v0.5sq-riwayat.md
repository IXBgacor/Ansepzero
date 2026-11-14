# Misi Penjaga Hutan — Beta v0.5²

Game edukasi 2D pixel-art (HTML5 Canvas, tanpa dependensi). Lanjutan v0.5: semua fitur lama dipertahankan (30 misi/6 bab, Misi Terakhir, dialog, kuis, skor, bintang, nama pemain, sertifikat PDF, pause, fullscreen, Android analog, PC keyboard/mouse, BGM, SFX, localStorage). Baru di v0.5²: SFX NPC baru, volume audio diseimbangkan, kamera geser, dan cutscene bantuan pemadam. Lihat `CHANGELOG.md`, `KONTROL.md`, `AUDIO-ASET.md`.

## Menjalankan
Sajikan folder lewat server statis (`python3 -m http.server 8000` → `http://localhost:8000/`) atau hosting statis. Disarankan jangan dari `file://`: browser memblokir `fetch` aset WAV sehingga SFX NPC/cutscene memakai bunyi sintesis cadangan (game tetap jalan).

## Yang baru di v0.5²
**1. SFX NPC.** Bunyi "blip" pendek bergaya pixel-art (6 file WAV) yang dijadwalkan sebagai satu rangkaian per halaman dialog: 2–7 blip, jarak antar-blip ≥ durasi blip, rangkaian lama dihentikan sebelum yang baru, berhenti saat halaman berganti/dialog ditutup/mute. Tidak diputar tiap frame. Aset di `assets/audio/sfx/npc/`. **File SFX milik Anda:** isi `NPC_SFX.userFiles` di `js/config.js` (mis. `['assets/audio/sfx/npc/punya-saya.mp3']`) → dipakai sebagai pengganti blip bawaan (satu elemen audio, satu bunyi per halaman, dipotong `userMaxMs`). File `npc-talk.m4a/.mp3` dari v0.5 disimpan di `assets/audio/sfx/npc/_lama-v0.5/` (tidak dipakai lagi; aktifkan lewat `userFiles` bila mau).
**2. Volume.** Bawaan baru BGM 35% (sebelumnya 50%) dan SFX 85% (sebelumnya 80%) + penguat SFX `SFX_BOOST = 2.4` dengan limiter (anti-pecah). Perhitungan gain: BGM ≈ −6,2 dB, SFX ≈ +8,7 dB dibanding v0.5 (sebelum limiter). Saat cutscene, BGM diturunkan setengah (`BGM_DUCK`). Pengaturan lama yang masih bawaan lama dimigrasikan; angka yang pernah Anda ubah sendiri tidak disentuh. BGM ON/OFF, SFX ON/OFF, slider volume, dan penyimpanan `mph.audio` tetap ada. BGM tetap satu elemen `<audio>`; tidak ada instance ganda.
**3. Kamera geser.** Android: satu jari pada peta menggeser pandangan; PC: tahan klik kiri lalu seret. Player tidak ikut berjalan, input joystick tidak terpengaruh (pointer joystick terpisah), ketukan kecil (< 8 px sentuh / 5 px mouse) tidak dihitung geser. Dilepas → kamera kembali halus (easing eksponensial ~0,17 dtk, jeda 0,18 dtk; langsung kembali bila player mulai berjalan). Batas peta ditegakkan di setiap frame. Geser dibatalkan otomatis oleh dialog, panel, jeda, dan cutscene; tombol HUD/joystick/INTERAKSI/dialog berada di atas kanvas sehingga tidak memicu geser. Atur lewat `CAM_*` di `js/config.js` (`CAM_DRAG_INVERT` membalik arah).
**4. Kamera UX.** Kembali ke player dibulatkan ke piksel perangkat (tanpa getar), posisi player tidak diubah. Saat dialog/cutscene aktif, kamera mengikuti kebutuhannya (cutscene = kamera sinematik).
**5–7. Cutscene & ending.** Setelah objective akhir ("Ikut Membantu") selesai dan dialog FINAL COMPLETED ditutup → cutscene ±23 dtk: "Bantuan petugas pemadam tiba." (mobil pemadam datang, 4 petugas berjalan ke lokasi, semprotan air, api/asap berkurang bertahap, suasana merah mereda, ambience hutan). Kamera: ikut player → ikut mobil → pan/zoom ke area api → kembali ke player, dengan bar sinematik, teks, dan dip hitam. Player beku; Esc = jeda; tombol **Lewati Cutscene** muncul setelah 3 dtk (Enter/E juga bisa setelah itu). Sesudahnya: dialog penutup → layar ending (skor akhir, bintang, **STATUS: TAMAT**) → tombol sertifikat PDF. "Selesai Sekarang" tidak memutar cutscene. Cutscene hanya diputar sekali saat penamatan (tidak diputar ulang dari menu atau setelah reload; ending bisa dilihat lagi lewat "Lihat Ending & Sertifikat").
**6. SFX cutscene.** Sirene, mesin, rem udara, semprotan air, api berderak, ambience hutan, whoosh transisi, lonceng penutup. Satu instance per nama, dihentikan saat jeda/mute/SFX OFF/selesai/dilewati. Lihat `AUDIO-ASET.md`.

## Alur
Nama → 30 misi → kebakaran besar di utara → **Petugas Rimba** → **Ikut Membantu** (5 objective) atau **Selesai Sekarang** → (bila membantu) cutscene → dialog penutup → ending → Dapatkan Sertifikat. Simulasi tetap hanya tugas pendukung relawan di bawah arahan petugas; area api punya penghalang tak terlihat.

## Bintang (tidak berubah dari v0.5)
| Bintang | Syarat |
|---|---|
| ⭐⭐⭐ | 30 misi + simulasi final selesai, skor misi ≥ 70% |
| ⭐⭐ | simulasi final selesai tetapi skor misi < 70%, ATAU simulasi dilewati dengan skor misi ≥ 70% |
| ⭐ | simulasi dilewati dan skor misi < 70% |

## Sertifikat
Seperti v0.5: hanya setelah tamat; nama, judul, bintang, skor, tanggal, nomor unik `MPH-YYYYMMDD-XXXXXX`; tombol memanggil `window.print()` (A4 lanskap) → "Simpan sebagai PDF".

## Struktur baru
```
js/camera.js      penangan geser kamera (pointer events pada kanvas)
js/cutscene.js    cutscene misi terakhir (timeline, kamera sinematik, SFX, tombol Lewati)
js/sprites_v05.js mobil pemadam & petugas pemadam (placeholder pixel art)
js/game.js        kamera: pengikut + offset geser + mode sinematik + batas peta
js/audio.js       mesin audio: keseimbangan volume, limiter, blip NPC, SFX cutscene, ducking
tools/gen_audio.py  pembuat seluruh aset WAV (sintesis prosedural, CC0)
tests/            skrip uji otomatis (lihat STATUS-TESTING.md)
```
Riwayat: `docs/` (README dan changelog versi sebelumnya).
