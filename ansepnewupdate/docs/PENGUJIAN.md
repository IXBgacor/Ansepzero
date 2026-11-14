# Menguji setelah deploy (dari HP)
0. Buka `/uji/`: semua baris LULUS (foto dan admin boleh INFO). Tombol "Salin laporan" menyalin hasilnya.
1. Buka `/api/stats`: harus JSON, bukan galat 503.
2. Beranda: statistik 0 atau "Belum ada data" (bukan angka rekaan); grafik ISPA 10 batang, Oktober putus-putus.
3. Kuis: buat pemain, catat kode pemulihan, ambil Evaluasi awal. Cek `/statistik/`: peserta evaluasi 1.
4. Uji peningkatan: selesaikan Level 1, lalu Evaluasi akhir (butuh waktu wajar, minimal 2 detik per soal agar tidak ditandai). Cek `/statistik/`: pembanding awal-akhir terisi.
5. Leaderboard: `/leaderboard/` menampilkan pemain setelah ada skor sah. Uji kecurangan: selesaikan kuis sangat cepat; hasilnya muncul di Admin > Tinjauan dan tidak di papan skor.
6. Game: buka `/game/`, masukkan nama; selesaikan misi pertama; cek toast "Skor misi tersimpan" dan papan skor. Misi yang diselesaikan terlalu cepat ditahan untuk tinjauan.
7. Lapor: kirim laporan dengan GPS lalu tanpa GPS; cek di Admin > Laporan; cek status memakai kode laporan.
8. Admin: login, ubah ambang kelulusan, tambah soal, terbitkan materi, unduh CSV dan cadangan SQL.
9. Hapus data: tombol "Hapus data saya" di Kuis; pemain hilang dari papan skor.
10. Penjaga Hutan AI (setelah AI diaktifkan; lihat `docs/PENJAGA-HUTAN-AI.md` bagian pengujian manual): `/api/health` memuat `ai`, `/uji/` LULUS, kirim pertanyaan karhutla, pertanyaan di luar topik, dan permintaan berbahaya.
Otomatis (Node 22+): `node --no-warnings tests/api.test.mjs && node --no-warnings tests/game.test.mjs && node --no-warnings tests/admin.test.mjs && node --no-warnings tests/chat.test.mjs`. Chat memakai penyedia model palsu. Uji browser chat: `node --no-warnings tests/devserver.mjs 8788 --mockai` lalu `python3 tests/e2e/penjaga_hutan.py`.

## Uji lokal tanpa Cloudflare
`node --no-warnings tests/devserver.mjs 8788` menjalankan situs lengkap (halaman + API) dengan database SQLite sementara di `http://localhost:8788`. Tambahkan `--noapi` untuk meniru hosting statis tanpa Functions. Skrip browser: `python3 tests/e2e/layout.py` (tata letak 3 ukuran layar), `alur_masuk.py` (masuk, game, kuis), `misi_game.py` (misi dilaporkan ke server); sesuaikan port di bagian atas skrip.
