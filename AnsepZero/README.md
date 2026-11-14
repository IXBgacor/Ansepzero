# AnsepZero (v1.0.0-beta)

Platform edukasi karhutla: materi, kuis 5 level (100 soal), game Misi Penjaga Hutan, pelaporan via WhatsApp, sertifikat, dan panel admin.
Frontend statis (EdgeOne Pages) + backend Cloudflare Workers + D1. Deployment ke akun nyata BELUM dilakukan; lihat docs/TESTING.md untuk status jujur.

## Struktur
- `frontend/` situs (index.html, js/, css/, admin/, game/misi-penjaga-hutan/). Konfigurasi: `frontend/js/config.js`.
- `backend-cloudflare/` Worker API, `migrations/`, `data/bank.mjs` (bank soal), `tests/`, `scripts/`.
- `tests-e2e/` uji browser Playwright. `docs/` panduan.

## Menjalankan lokal (tanpa akun Cloudflare)
1. Backend uji (SQLite pengganti D1; data hilang saat berhenti): `cd backend-cloudflare && node --no-warnings tests/dev-server.mjs` (API di :8787, admin `super` / `superadmin-uji-12345`, HANYA untuk uji).
2. Frontend: `cd frontend && python3 -m http.server 8080`, lalu edit sementara `js/config.js` -> `API_BASE: 'http://localhost:8787'`. Buka http://localhost:8080.
3. Tes: `cd backend-cloudflare && npm test`; E2E: `sh tests-e2e/run.sh`.

## Produksi
Ikuti urut: `docs/PANDUAN-CLOUDFLARE.md` (D1, migration, superadmin, deploy Worker) -> `docs/PANDUAN-EDGEONE.md` (deploy frontend) -> `docs/PANDUAN-ADMIN.md`.

## Dokumen
ARSITEKTUR, API, PANDUAN-CLOUDFLARE, PANDUAN-EDGEONE, PANDUAN-ADMIN, PANDUAN-INTEGRASI-GAME, SERTIFIKAT, PRIVASI, TESTING, AUDIT-GAME.

## Yang masih placeholder
Nomor WhatsApp/kontak resmi (`config.js` kosong), peta kerawanan Batola, feed informasi terkini, penghapusan data otomatis. Tidak ada data dikarang.
