# AnsepZero

Platform edukasi dan permainan pencegahan kebakaran hutan dan lahan (karhutla) untuk masyarakat Kabupaten Barito Kuala, Kalimantan Selatan.

## Isi
| Bagian | Lokasi | Keterangan |
|---|---|---|
| Beranda, statistik, ISPA, bantuan | `index.html` | angka dari database |
| Pusat edukasi (9 materi + daftar pustaka) | `edukasi/` | dari database, sudah terbit |
| Masuk pemain | `masuk/` | nama tampilan, kode pemulihan, mode tamu, diagnosis server |
| Kuis (5 level + evaluasi awal/akhir) | `kuis/`, `functions/api/quiz` | penilaian di server |
| Misi Penjaga Hutan | `game/` | game lama + `bridge.js` ke server |
| Papan skor, analitik | `leaderboard/`, `statistik/` | dari database |
| Penjaga Hutan AI (chatbot edukasi) | `penjaga-hutan/`, `functions/_lib/routes/chat.js` | butuh secret `GEMINI_API_KEY` (atau binding Workers AI / provider OpenAI-compatible); lihat `docs/PENJAGA-HUTAN-AI.md` |
| Pelaporan warga, peta | `lapor/`, `peta/` | foto butuh R2; data hotspot belum terhubung |
| Admin | `admin/`, `functions/api/admin` | tidak ditautkan publik; dijaga server |
| Privasi | `privasi/` | |

Arsitektur: satu repo di Cloudflare Pages. Frontend statis (HTML/CSS/JS tanpa build). API di `functions/` (Pages Functions). Database D1 (binding `DB`). Foto laporan opsional di R2 (binding `PHOTOS`). Semua API lewat satu pintu masuk (`functions/api/[[route]].js`) yang meneruskan ke `functions/_lib/routes/*`. Diagnosis pemasangan: `/uji/` (halaman) dan `GET /api/health`. Juga ada `404.html`, `robots.txt`, dan `_headers` (header keamanan).

## Status jujur
- **Diuji otomatis (142 pemeriksaan, Node + SQLite pengganti D1):** pemain, kuis, game, papan skor, analitik, admin, laporan, integritas materi dan soal, endpoint health, pintu masuk API dan pembatas laju. Jalankan `node --no-warnings tests/api.test.mjs`, `game`, `admin`, `content`, `router` (Node 22+).
- **Diuji di browser (Chromium headless, Playwright, server lokal dengan API asli dan header keamanan `_headers` aktif):** 10 halaman x 3 ukuran layar (360, 820, 1280 px) tanpa geser horizontal, tanpa galat konsol, tanpa pelanggaran CSP; alur masuk ke game, kuis 20 soal, kode basi, situs tanpa API, mode tamu; satu misi game dilaporkan ke server; 404 dan diagnosis `/uji/`. Skrip: `tests/e2e/` (butuh `pip install playwright`, `playwright install chromium`, `node tests/devserver.mjs`).
- **Penjaga Hutan AI, diuji otomatis dengan penyedia model PALSU** (`node --no-warnings tests/chat.test.mjs`, 64 pemeriksaan; `python3 tests/e2e/penjaga_hutan.py` dengan `node --no-warnings tests/devserver.mjs 8788 --mockai`): validasi, penyaring, pembatas laju, pencarian materi, pembersih keluaran, galat/timeout/kuota, tampilan HP dan desktop. Mutu jawaban model sungguhan BELUM diuji.
- **BELUM diuji:** model AI sungguhan (Workers AI atau provider lain), HP fisik, Cloudflare Pages/D1/R2 asli, GitHub Action ekstrak ZIP, jaringan lambat sungguhan.
- Bank soal: 116 soal (100 soal level: 20 per level; evaluasi awal 8, evaluasi akhir 8). Soal dapat ditambah lewat Admin > Soal.
- Materi diturunkan dari sumber yang tercantum (BNPB, Kemenkes, Permen LHK, KLHK, DPR, pemberitaan, dan karya ilmiah). Beberapa sumber sekunder: tim sebaiknya memeriksa ulang ke dokumen resmi BPBD/DLH/KLHK. Panduan darurat khusus Barito Kuala belum ada (hanya panduan umum bersumber BNPB).
- Data hotspot/wilayah rawan belum terhubung. Nomor Damkar Marabahan dari pemilik proyek belum dikonfirmasi instansi; BNPB 117 dan Posko Kemenhut dari pemberitaan, juga belum dikonfirmasi.
- Tampilan di dalam game (`game/`) tetap dari versi sebelumnya; hanya pintu masuknya yang dibuat ulang.
- Skor petualangan tidak bisa diverifikasi penuh server (lihat SECURITY.md).

Versi: 1.2.0 (1.1.0 + Gemini + perbaikan kuis). Perubahan 1.2.0: (1) penyedia Google Gemini untuk Penjaga Hutan AI (secret `GEMINI_API_KEY`, kunci hanya di server); (2) kuis tidak lagi macet jika pengiriman jawaban gagal karena jaringan: pilihan aktif lagi dan bisa dicoba ulang; (3) riwayat chat bertahan saat halaman dimuat ulang (hanya di perangkat). Basis data TETAP Cloudflare D1; alasan tidak memindahkan ke Firebase ada di `docs/FIREBASE.md`.
Pengujian 1.2.0: `node --no-warnings tests/chat.test.mjs` (87 pemeriksaan, termasuk 25 untuk Gemini dengan `fetch` PALSU, bukan Google sungguhan) dan `python3 tests/e2e/pulih_galat.py` (butuh `node --no-warnings tests/devserver.mjs 8790 --mockai`). Gemini sungguhan, Cloudflare asli, dan HP fisik BELUM diuji. Dokumen lain: `DEPLOYMENT.md`, `SECURITY.md`, `docs/TROUBLESHOOT.md`, `docs/API.md`, `docs/ANALITIK.md`, `docs/PENGUJIAN.md`, `docs/BACKUP.md`.
