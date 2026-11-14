# Status Pengujian

Dijalankan pada lingkungan pembuat (Node 22, Chromium headless via Playwright, API uji lokal dengan SQLite pengganti D1). Cara mengulang: `cd backend-cloudflare && npm test` dan `sh tests-e2e/run.sh` (butuh `pip install playwright` + `playwright install chromium`).

## Hasil
| Area | Status | Keterangan |
|---|---|---|
| Logika API (75 tes) | PASS | `npm test`; validasi, penilaian, penguncian, idempotensi, batas 5 admin, 401/403, rate limit, CORS header, ekspor CSV, leaderboard |
| Seed 100 soal | PASS | 100 unik, 20/level, 4 pilihan, kunci tersebar merata (25/25/25/25) |
| E2E: semua halaman terbuka | PASS | 15 rute pada 4 viewport |
| E2E: tanpa overflow horizontal | PASS | 360 px (Android), 390 px (setara iPhone), 768 px (tablet), 1280 px (desktop) |
| E2E: tanpa error konsol / resource 404 | PASS | termasuk halaman game (iframe) |
| E2E: navigasi mobile | PASS | |
| E2E: pelaporan (validasi, WhatsApp, GPS ditolak) | PASS | tautan WhatsApp diperiksa, pesan tidak otomatis terkirim |
| E2E: kuis (gagal, pembahasan, kunci level, ulang, lulus, riwayat) | PASS | riwayat 2 percobaan terbukti di database uji |
| E2E: game dimuat, objek MPH, kanvas | PASS | |
| E2E: skor game -> API, tanpa duplikat, status gagal/menunggu, kirim ulang | PASS | memakai hasil game yang disimulasikan lewat localStorage |
| E2E: sertifikat (kuis, game, verifikasi, ditolak tanpa syarat) | PASS | |
| E2E: PDF A4 lanskap sertifikat = 1 halaman | PASS | Chromium |
| E2E: admin (login/salah/logout, statistik 1/1, bank soal, peringkat, akun) | PASS | |
| Tidak ada emoji pada antarmuka utama | PASS | |
| Tidak ada secret di frontend/ZIP | PASS | pemindaian pola; lihat bawah |
| Worker pada Wrangler & D1 asli | BELUM DAPAT DIUJI | tanpa akses jaringan/akun Cloudflare |
| Migration pada D1 asli (`d1 migrations apply`) | BELUM DAPAT DIUJI | SQL diuji pada SQLite |
| CORS preflight dari browser ke Worker asli | BELUM DAPAT DIUJI | logika header diuji, bukan lintas-origin nyata |
| Deploy EdgeOne Pages | BELUM DAPAT DIUJI | tanpa akun |
| Game: bermain sampai tamat secara manual | BELUM DAPAT DIUJI | hanya pemuatan dan jembatan skor yang diuji |
| Game: kontrol analog Android, sentuh, audio/BGM/SFX | BELUM DAPAT DIUJI | butuh perangkat/pendengaran nyata |
| Android fisik, iPhone fisik, Safari, Firefox | BELUM DAPAT DIUJI | hanya Chromium dengan viewport setara |
| Cetak PDF di Safari/Firefox, printer sungguhan | BELUM DAPAT DIUJI | |
| Kontras warna terukur (WCAG), audit pembaca layar | BELUM DAPAT DIUJI | warna dipilih berkontras tinggi tetapi belum diukur; navigasi keyboard hanya diperiksa sebagian (fokus terlihat, tombol asli) |
| Peta kerawanan, feed berita, kontak BPBD/Damkar | BELUM TERSEDIA | menunggu data resmi (ditampilkan sebagai belum tersedia) |
