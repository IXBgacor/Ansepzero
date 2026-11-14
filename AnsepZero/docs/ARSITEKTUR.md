# Arsitektur
```
Browser (EdgeOne Pages: frontend statis) --HTTPS/JSON--> Cloudflare Worker (API) --binding--> Cloudflare D1
   |-- iframe game (same-origin) --postMessage--> halaman induk --> API
```
- Frontend: SPA vanilla JS (hash routing), tanpa build/dependensi. Admin di `/admin/`.
- Backend: `backend-cloudflare/src` (router `index.js`, `routes/*`, `lib/*`). SQL berparameter; tidak ada endpoint SQL bebas. CORS hanya untuk `ALLOWED_ORIGINS`.
- Database: migration `0001` (skema), `0002` (opt-in leaderboard), `0003` (100 soal, dibuat dari `data/bank.mjs` oleh `scripts/build-seed.mjs`).
- Sinkronisasi lokal -> cloud: progres kuis dan sesi dari server; game: localStorage game tetap, skor dikirim idempoten dengan status tersimpan / menunggu / gagal.
- Peringkat: kuis = level lulus, lalu rata-rata nilai terbaik; game = rasio skor terbaik peserta yang tamat. Dipisah. Publik hanya opt-in.
- Pembuatan ulang seed soal: `node scripts/build-seed.mjs` (memvalidasi 100 soal unik, 20/level, sebaran kunci).
- Batas keamanan: bearer token (bukan cookie), hash PBKDF2 admin, rate limit berbasis D1, validasi input, header `nosniff`, `no-store`.
