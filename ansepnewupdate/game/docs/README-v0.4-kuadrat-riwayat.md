# Misi Penjaga Hutan — Beta v0.4²

Game edukasi 30 misi (6 bab) tentang menjaga hutan. Buka `index.html` lewat server lokal (mis. `python3 -m http.server`) atau hosting statis.
v0.4² adalah pembaruan dari v0.4: misi, skor, dialog, kuis, dan penyimpanan (`localStorage` kunci `mph.save`) **tidak diubah**, sehingga progres lama tetap terbaca.

## Kontrol

**Android / layar sentuh** (wajib landscape; portrait menampilkan layar "putar perangkat")
- Joystick virtual kiri-bawah: gerak (analog, 360°).
- Tombol **INTERAKSI** kanan-bawah: bicara / periksa / amati.
- Ketuk tombol dan pilihan jawaban di layar. Tombol **Jeda** dan **Layar Penuh** di kanan-atas.

**PC (keyboard + mouse)** — joystick dan tombol INTERAKSI disembunyikan; petunjuk kontrol tampil di bawah layar
- **W A S D** / **panah**: bergerak.
- **E** atau **Enter**: interaksi; di dialog = lanjut / konfirmasi pilihan yang disorot.
- **1–9**: pilih jawaban kuis langsung. **↑ ↓ / W S**: pindah sorotan jawaban.
- **Esc**: tutup dialog/panel; bila tidak ada yang terbuka = jeda; di menu jeda = lanjutkan.
- **Mouse**: klik tombol, pilihan jawaban, daftar misi.
- Catatan: pada layar penuh browser, Esc pertama dipakai browser untuk keluar layar penuh.

**Deteksi mode** (otomatis, tanpa reload): mulai dari perangkat utama (HP/tablet = sentuh; selainnya = PC). Menyentuh layar → mode sentuh; memakai mouse (klik/gerak) atau tombol game → mode PC. Laptop layar sentuh dengan mouse mulai sebagai PC. Mode tidak berganti saat joystick sedang ditahan. Bisa dikunci manual lewat menu: **Kontrol: Otomatis / Sentuh / Keyboard + Mouse**.

## Changelog v0.4 → v0.4²
- **Layar penuh & tata letak:** kanvas memenuhi layar pada resolusi perangkat (tanpa pita hitam); skala bilangan bulat agar pixel art tetap tajam, area pandang menyesuaikan rasio layar. HUD mengikuti area aman (notch), dialog/panel tidak tertutup bilah petunjuk PC, panah tujuan menghindari panel HUD.
- **Gerak halus:** dt tidak pernah negatif; kecepatan dihaluskan (percepatan/perlambatan eksponensial, bebas laju frame); joystick dengan zona mati, kecepatan naik bertahap, dan tarikan ke 8 arah yang kontinu; kamera dan karakter dibulatkan ke piksel perangkat (bukan piksel logis); animasi jalan mengikuti kecepatan nyata.
- **Mode PC:** WASD/panah, E/Enter, Esc, 1–9, mouse; bilah petunjuk kontrol; petunjuk `[E]` saat dekat objek.
- **Deteksi input adaptif** dengan pilihan manual (disimpan di kunci terpisah `mph.input`).
- **Router keyboard satu pintu:** mencegah input ganda; halaman pilihan kuis tidak memilih otomatis saat Enter/E ditekan.
- Jendela PC tidak lagi wajib landscape. Label versi: Beta v0.4².

## Status pengujian
Diuji otomatis dengan Chromium 141 headless (Playwright) — **bukan** pada perangkat fisik:
- Lolos: PC 1280×720 dan jendela potret 600×900 (WASD, E, Enter, Esc, klik, jeda/lanjut, kuis via keyboard dan mouse, tanpa error JS); emulasi Android landscape 568×320 s.d. 915×412 (joystick, INTERAKSI, tanpa HUD saling menimpa/keluar layar); portrait Android → layar putar perangkat; pergantian sentuh↔keyboard/mouse tanpa reload; simulasi laptop layar sentuh; kecepatan jalan stabil 52 px/dtk (kamera maju 4–5 piksel perangkat/frame).
- **Belum diuji:** perangkat Android/iOS nyata, layar sentuh laptop nyata, layar penuh sungguhan dan kunci orientasi (headless tidak mendukung), kinerja pada HP lama, Safari/Firefox, ke-30 misi dimainkan sampai tamat, dan migrasi dari save v0.4 yang sudah berisi progres panjang (kode misi/penyimpanan tidak diubah, hanya dicek bahwa `mph.save` tetap tertulis).
