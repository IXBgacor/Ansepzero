# Panduan Cloudflare (Workers + D1) untuk Pemula

Sumber resmi: [D1 Get started](https://developers.cloudflare.com/d1/get-started/) · [D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/) · [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/). Cek ulang bila perintah berbeda, karena Wrangler berkembang.

Semua perintah dijalankan di folder `backend-cloudflare/`. Perintah bertanda **[PRODUKSI]** mengubah database sungguhan.

## 1. Siapkan alat
1. Buat akun di https://dash.cloudflare.com (gratis cukup untuk mulai).
2. Pasang Node.js LTS (https://nodejs.org). Lalu: `npm install`
3. Masuk: `npx wrangler login` (browser terbuka; jangan kirim token ke siapa pun).

## 2. Buat database D1  **[PRODUKSI: membuat resource baru, tidak merusak data]**
`npx wrangler d1 create ansepzero-db`
Perintah mencetak `database_id`. Salin nilainya ke `wrangler.jsonc` pada `"database_id"` (ganti `ISI_DATABASE_ID_DI_SINI`). `database_id` bukan rahasia, tetapi tetap jangan dibagikan sembarangan. Cek ulang kapan saja: `npx wrangler d1 info ansepzero-db`.

## 3. Jalankan migration
- Lokal (aman, data uji): `npx wrangler d1 migrations apply ansepzero-db --local`
- **[PRODUKSI]** `npx wrangler d1 migrations apply ansepzero-db --remote`
Migration membuat tabel (0001), kolom opt-in peringkat (0002), dan mengisi 100 soal kuis (0003). Tidak ada perintah DROP. Jangan mengubah file migration yang sudah dijalankan; tambahkan file baru bila perlu.

Database lokal dan produksi terpisah. Kesalahan "no such table" biasanya berarti migration dijalankan di salah satunya saja.

## 4. Jalankan backend lokal dan uji health
`npx wrangler dev` (biasanya di http://localhost:8787), lalu buka http://localhost:8787/api/health. Hasil yang benar: `{"status":"ok",...}`.

## 5. Buat superadmin (sekali saja)
1. `npm run init-superadmin` (ketik username dan kata sandi >= 12 karakter; kata sandi tidak tampak dan tidak disimpan).
2. Skrip membuat `init-superadmin.sql` berisi HASH saja. Jalankan lokal: `npx wrangler d1 execute ansepzero-db --local --file=init-superadmin.sql`
3. **[PRODUKSI]** versi `--remote` dari perintah yang sama.
4. Hapus `init-superadmin.sql`. Hanya satu superadmin yang diizinkan database.

## 6. Variabel dan CORS
Di `wrangler.jsonc` bagian `vars`, isi `ALLOWED_ORIGINS` dengan alamat frontend persis (contoh `https://namasitus.edgeone.app`, tanpa `/` di akhir; beberapa alamat dipisah koma). Origin lain tidak mendapat header CORS. Saat ini tidak ada secret yang wajib; jangan menaruh secret di `vars` karena terlihat publik. Bila kelak ada: `npx wrangler secret put NAMA`.

## 7. Deploy Worker  **[PRODUKSI]**
`npx wrangler deploy` mencetak URL `https://ansepzero-api.<akun>.workers.dev`. Uji `<URL>/api/health`.

## 8. Menghubungkan frontend
Masukkan URL Worker ke `frontend/js/config.js` (`API_BASE`) dan alamat frontend ke `ALLOWED_ORIGINS` di Worker.

## 9. Pengujian dan log
- Tes otomatis logika API (tanpa akun): `npm test`. Catatan: tes memakai SQLite bawaan Node sebagai pengganti D1, jadi bukan pengganti uji pada D1 asli.
- Log produksi: `npx wrangler tail`. Kode hanya mencatat pesan galat, tanpa kata sandi atau token.

## 10. Menguji dari frontend (setelah Worker dan frontend dideploy)
1. Isi `API_BASE` di `frontend/js/config.js` dengan URL Worker (lihat PANDUAN-EDGEONE.md) dan pastikan alamat frontend ada di `ALLOWED_ORIGINS`.
2. **Skor kuis:** buka `#/kuis`, masukkan nama, kerjakan Level 1. Hasil (benar/salah + pembahasan) harus tampil.
3. **Skor game:** buka `#/game`, mainkan sampai tamat, isi nama tampilan; status harus berubah menjadi "Tersimpan ke cloud".
4. **Pastikan data masuk D1:** `npx wrangler d1 execute ansepzero-db --remote --command "SELECT COUNT(*) FROM quiz_attempts"` (hanya membaca). Atau lihat di panel admin: tab Percobaan kuis / Skor game.
5. **Panel admin:** buka `/admin/`, masuk dengan superadmin, periksa Ringkasan dan Bank soal.
6. **Log dan galat:** `npx wrangler tail` sambil mengulang langkah di atas; galat 4xx/5xx dan pesannya terlihat tanpa data rahasia.

## 11. Memisahkan data uji dan produksi
Gunakan dua database: `ansepzero-db` (produksi) dan `ansepzero-db-dev` (uji). Buat yang kedua dengan `npx wrangler d1 create ansepzero-db-dev` dan tambahkan lingkungan `env.dev` pada `wrangler.jsonc` dengan `database_id` berbeda, lalu `npx wrangler deploy --env dev`. Jangan pernah menjalankan perintah `--remote` pada database produksi untuk data coba-coba. Pengembangan lokal (`--local`) tidak menyentuh Cloudflare sama sekali.

## 12. Perintah yang TIDAK boleh dijalankan sembarangan
Perintah `DELETE`, `DROP`, atau `UPDATE` tanpa `WHERE` lewat `d1 execute --remote` akan mengubah/menghapus data produksi dan tidak dapat dibatalkan. Paket ini tidak memakainya. Untuk cadangan: `npx wrangler d1 export ansepzero-db --remote --output=cadangan.sql`.

## Keterbatasan
Panduan ini ditulis tanpa akses ke akun Cloudflare; langkah deploy BELUM diuji pada akun nyata. Bila ada perbedaan, utamakan dokumentasi resmi (tautan di atas).
