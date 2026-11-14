# Integrasi Game Misi Penjaga Hutan

**Sumber:** `Misi-Penjaga-Hutan-Alpha-v2_6.zip` (v2.1 Alpha). Audit rinci: AUDIT-GAME.md.

## Cara integrasi
Game ditaruh UTUH di `frontend/game/misi-penjaga-hutan/` (tanpa `tests/`, `docs/`, `tools/`) dan dibuka lewat `<iframe>` pada halaman `#/game`. Kode game tidak diubah, hanya dua penambahan: berkas `js/az-bridge.js` dan satu tag `<script>` di akhir `index.html`. Karena iframe, CSS, variabel global (`window.MPH`), dan event game terisolasi dari situs. Kunci penyimpanan game `mph.*` tidak bentrok dengan `az.*` milik situs. Tombol "Kembali ke AnsepZero" tidak menghapus progres karena progres ada di localStorage game.

## Alur skor
1. Peserta bermain; game menyimpan progres seperti biasa (`mph.v05` untuk hasil akhir).
2. `az-bridge.js` (di dalam game) memeriksa tiap 3 detik apakah game sudah tamat; bila ya, mengirim `postMessage` ke halaman induk dengan target origin = origin situs sendiri (bukan `*`).
3. Halaman induk hanya menerima pesan bila `origin` sama, `source` adalah iframe game, dan `type` = `ansepzero:game-result`.
4. Induk menghitung `submission_key` = SHA-256 dari (nomor sertifikat lokal game + waktu selesai), lalu `POST /api/game/scores` dengan token sesi peserta.
5. Server memeriksa rentang: `0 <= score <= max_score <= 100000`, bintang 0-3, misi 0-60, tamat harus >= 1 bintang, versi berformat aman; waktu selesai diisi server. `submission_key` unik per peserta sehingga pengiriman ulang tidak membuat baris baru.
6. Sertifikat game (`POST /api/certificates/game`) hanya terbit bila ada skor tamat di database; nomor dibuat server, skor diambil dari database (bukan dari klien).

## Identitas sesi
Game tidak tahu identitas peserta; halaman induk yang memegang sesi (nama tampilan). Sebelum ada sesi, skor ditahan (`az.pendingGame`) dengan status "menunggu sinkronisasi" dan dikirim setelah nama diisi.

## Jika jaringan gagal
Status "Gagal menyimpan ke cloud ... menunggu sinkronisasi" tampil dan tombol "Coba kirim ulang" tersedia. Skor tidak pernah dilaporkan tersimpan bila API gagal. Progres game tetap aman di perangkat.

## Keterbatasan (jujur)
- Logika game berjalan di browser: pemain yang mengubah localStorage atau memanggil API sendiri dapat mengirim skor yang tampak sah selama dalam rentang. TIDAK anticheat. Server hanya membatasi rentang, mencegah duplikat dan membatasi laju (30 kiriman/jam/peserta).
- Nomor sertifikat bawaan game (lokal) tidak dianggap sah; yang sah hanya nomor `AZG-...` dari server.
- `missions_done` dibaca dari `MPH.Missions.completedCount()` bila tersedia, kalau tidak 0.
- Audio, kontrol, kamera, layar penuh, PDF sertifikat bawaan game tetap milik game; layar penuh dari tombol AnsepZero memakai Fullscreen API pada pembungkus iframe.
- Status uji game di perangkat Android fisik, Firefox, Safari: BELUM DAPAT DIUJI (lihat TESTING.md).
