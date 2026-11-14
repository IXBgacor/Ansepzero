# Panduan EdgeOne Pages (frontend)

Frontend AnsepZero adalah situs statis (HTML/CSS/JS, tanpa build). Backend (Cloudflare Worker + D1) dideploy TERPISAH; EdgeOne tidak otomatis menjalankan Worker atau menghubungkan D1. Antarmuka EdgeOne dapat berubah; ikuti dokumentasi resmi EdgeOne Pages (https://edgeone.ai/document) bila langkah di bawah berbeda. Deployment belum dilakukan oleh pembuat paket ini (tidak ada akses akun).

1. **Folder yang di-deploy:** `frontend/` (berisi `index.html`, `admin/`, `game/`, `css/`, `js/`, `assets/`).
2. **Build command:** kosongkan (tidak ada build). **Output directory:** `frontend` (atau `./` bila repo Git hanya berisi isi folder frontend).
3. **Cara unggah:** (a) hubungkan repository Git yang berisi proyek ini, atau (b) unggah folder `frontend` lewat fitur upload/direct upload bila tersedia di akunmu.
4. **Isi konfigurasi:** edit `frontend/js/config.js` SEBELUM deploy:
   - `API_BASE`: URL Worker (mis. `https://ansepzero-api.namaakun.workers.dev`), tanpa `/` di akhir.
   - `WA_NUMBER`: nomor WhatsApp petugas yang SUDAH diverifikasi (format `62812...`, tanpa `+`). Kosong = tombol WhatsApp nonaktif.
   - `CONTACTS`: daftar kontak resmi BPBD/Damkar (jangan diisi sebelum diverifikasi).
   Semua nilai di file ini PUBLIK. Jangan menaruh secret, token, atau password di sini maupun di environment variable frontend.
5. **CORS:** setelah mendapat alamat situs (mis. `https://namasitus.edgeone.app`), tambahkan ke `ALLOWED_ORIGINS` di `backend-cloudflare/wrangler.jsonc`, lalu `npx wrangler deploy` ulang. Tanpa ini browser memblokir pemanggilan API.
6. **Uji CORS dan error:** buka situs, tekan F12 > Console dan Network. Buka `#/kuis`, masukkan nama; bila muncul error "CORS" berarti alamat situs belum ada di `ALLOWED_ORIGINS`. Cari resource berstatus 404 (merah) di tab Network.
7. **Memperbarui situs:** ubah file, commit/unggah ulang, deploy. Sesudah mengubah JS, lakukan muat ulang paksa (Ctrl+Shift+R) karena cache.
8. **Domain sendiri:** tersedia di pengaturan domain EdgeOne Pages bila akunmu mendukung; ikuti petunjuk DNS di sana. Tambahkan domain itu juga ke `ALLOWED_ORIGINS`.
9. **Panel admin:** `https://<situsmu>/admin/` (lihat PANDUAN-ADMIN.md). Halaman ini tidak ada di navigasi publik, tetapi keamanannya ada di backend, bukan pada kerahasiaan alamat.
