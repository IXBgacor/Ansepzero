# Deploy dari HP Android (tanpa Termux)
Langkah dan nama menu dashboard dapat berubah; jika berbeda, cari menu yang setara. Belum diuji end-to-end di akun Anda, tetapi `/api/health` dan `/uji/` memeriksa hasilnya.

## A. Pertama kali
**1. Kode ke GitHub.** GitHub web di HP tidak bisa mengunggah folder, jadi:
1. Buat repo kosong. Add file > Create new file, nama `.github/workflows/unzip.yml`, isi tempel dari `docs/unzip.yml` (ada di dalam ZIP). Commit.
2. Ganti nama `ansepzero-final.zip` menjadi `ansepzero.zip`, lalu Add file > Upload files (satu berkas itu). Commit.
3. Tab Actions > "Ekstrak ZIP" > Run workflow. Setelah hijau, repo berisi semua folder dan ZIP terhapus.
Cloudflare Pages "Direct Upload" tidak dianjurkan: fungsi API di `functions/` umumnya butuh sambungan Git atau Wrangler.

**2. Pages.** Workers & Pages > Create > Pages > Connect to Git > pilih repo. Framework: None. Build command: kosong. Output directory: kosong atau `.`. Deploy.

**3. Database D1.** Storage & Databases > D1 > Create database `ansepzero`. Di tab Console jalankan isi berkas berikut berurutan:
`migrations/0001_schema.sql` sampai `0008_sumber_ispa.sql`, lalu `0010_kontak_damkar.sql`, lalu `0011_soal_tambahan.sql`. (Nomor 0009 hanya ada di versi uji dan tidak dipakai di sini.)
Berkas 0001 memuat trigger (`CREATE TRIGGER ... BEGIN ... END;`). Jika Console menolaknya, jalankan bagian tabel dulu, lalu tiap trigger satu per satu.

**4. Binding dan secret.** Pages project > Settings > Bindings: tambah **D1 database**, variable `DB`. Opsional **R2 bucket**, variable `PHOTOS` (foto laporan). Settings > Variables and Secrets: tambah **Secret** `ADMIN_SETUP_TOKEN` (teks acak panjang, minimal 24 karakter). Setelah mengubah binding atau secret, deploy ulang.

| Nama | Jenis | Wajib | Fungsi |
|---|---|---|---|
| DB | Binding D1 | ya | database |
| ADMIN_SETUP_TOKEN | Secret | untuk membuat/memulihkan admin | token setup |
| PHOTOS | Binding R2 | tidak | foto laporan |
| GEMINI_API_KEY | Secret | untuk Penjaga Hutan AI (bagian D) | kunci Gemini, hanya di server |

**5. Periksa.** Buka `https://<domain>/uji/`: semua baris harus LULUS (foto dan admin boleh INFO). Atau `https://<domain>/api/health` (harus `db: true`, `schema: true`). Jika ada yang gagal, lihat `docs/TROUBLESHOOT.md`.

**6. Admin pertama.** Buka `/admin/` > "Setup admin pertama": isi token (nilai ADMIN_SETUP_TOKEN), username, password minimal 12 karakter. Tidak ada password bawaan. Maksimal 5 admin aktif (dijaga database). Setelah semua admin dibuat, secret boleh dihapus; simpan salinannya untuk pemulihan.
**Pemulihan akses:** pasang lagi secret, deploy ulang, pakai form setup dengan username yang sudah ada untuk password baru (sesi lama dicabut).

## B. Memperbarui versi yang sudah berjalan
1. Ulangi langkah A1 dengan ZIP baru (workflow `docs/unzip.yml` terbaru juga menghapus berkas rute API lama). Pages akan deploy otomatis.
2. Di D1 Console jalankan hanya migrasi yang belum pernah dijalankan (cek `/api/health`: `schema`). Jika sebelumnya memakai versi uji, jalankan `0010_kontak_damkar.sql` untuk mengembalikan kontak Damkar. Soal tambahan ada di `0011_soal_tambahan.sql` (jalankan sekali saja; menjalankannya dua kali menggandakan soal).
3. Buka `/uji/` dan pastikan versi di baris pertama adalah 1.2.0. Tidak ada migrasi database baru untuk versi 1.2.0 (versi ini hanya menambah penyedia Gemini, perbaikan kuis, dan riwayat chat di perangkat).

## C. Sebelum publikasi
Konfirmasi nomor Damkar ke instansi lalu centang "terverifikasi" di Admin > Kontak; periksa materi dengan guru pembimbing; tambah soal di Admin > Soal; jalankan checklist `SECURITY.md`.

## D. Mengaktifkan Penjaga Hutan AI (dari HP, tanpa Termux)
Tanpa langkah ini situs tetap berjalan normal; halaman `/penjaga-hutan/` hanya menampilkan pemberitahuan bahwa AI belum diaktifkan. Tidak ada migrasi database baru.
**Opsi 0 (direkomendasikan, sama seperti M.I.R.A.): Google Gemini.**
1. Buat kunci di Google AI Studio (aistudio.google.com > Get API key). Jangan menempelkannya di chat, repo, atau berkas JS.
2. Cloudflare Dashboard > Workers & Pages > proyek Pages Anda > Settings > Variables and Secrets > Add: Type **Secret**, nama persis `GEMINI_API_KEY`, isi kunci. (Opsional, variabel biasa `GEMINI_MODEL`, bawaan `gemini-2.5-flash`.)
3. Deploy ulang (Deployments > titik tiga > Retry deployment). Periksa `/api/health`: harus memuat `"ai":"gemini"`. Jika Gemini diatur, Gemini yang dipakai walau opsi lain juga ada.
**Opsi 1 (tanpa API key): Cloudflare Workers AI.**
1. Dashboard Cloudflare > Workers & Pages > proyek Pages Anda > Settings > Bindings > Add > **Workers AI**. Variable name harus persis `AI`. Simpan.
2. (Opsional) Settings > Variables and Secrets: variabel `AI_MODEL` untuk mengganti model (bawaan `@cf/meta/llama-3.1-8b-instruct`). Nama model harus ada di katalog Workers AI akun Anda.
3. Deploy ulang (Deployments > titik tiga di deployment terbaru > Retry deployment, atau commit kecil). Binding baru hanya terbaca setelah deploy ulang.
**Opsi 2: penyedia lain yang kompatibel OpenAI** (mis. OpenRouter, Groq; kuota dan harga mengikuti penyedia). Settings > Variables and Secrets:
| Nama | Jenis | Isi |
|---|---|---|
| AI_API_KEY | **Secret** (Encrypt) | kunci API dari penyedia. Jangan ditulis di repo, chat, atau berkas JS |
| AI_BASE_URL | Variabel biasa | alamat dasar `https://...` yang diakhiri `/v1` (server menambah `/chat/completions`) |
| AI_MODEL | Variabel biasa | nama model dari penyedia |
Jika opsi 2 lengkap, opsi 2 dipakai; jika tidak, binding `AI`. Deploy ulang setelah mengubah.
**Pengaturan opsional (variabel biasa):** `CHAT_IP_LIMIT` (bawaan 20 pertanyaan per 10 menit per jaringan), `CHAT_DAILY_LIMIT` (bawaan 800 pertanyaan per hari untuk seluruh situs; lindungi kuota).
**Periksa:** `/api/health` harus memuat `"ai":"workers-ai"` (atau `"external"`); `/uji/` baris "Penjaga Hutan AI" LULUS; lalu buka `/penjaga-hutan/` dari HP dan kirim satu pertanyaan.
Nama menu dashboard dapat berubah dan langkah ini belum diuji di akun Anda.
