# Pemecahan masalah
Mulai dari sini: buka `https://<domain-anda>/uji/` (diagnosis otomatis) atau `/api/health`.

| Yang terlihat | Artinya | Perbaikan |
|---|---|---|
| Halaman `/api/health` tampil 404 / halaman kosong | Situs berjalan sebagai situs statis; folder `functions/` tidak dipakai | Pasang lewat Cloudflare Pages yang tersambung ke repo GitHub (bukan upload langsung/ZIP). Pastikan folder `functions` ada di akar repo. |
| `"db": false` | Binding D1 belum ada | Pages > Settings > Bindings > D1, nama variabel `DB`, lalu deploy ulang. |
| `"schema": false` dan daftar `missing` | Migrasi belum lengkap | Jalankan semua migrasi (0001 sampai 0011, kecuali 0009) berurutan di D1 Console. Jika trigger ditolak, jalankan tiap trigger sendiri. `game_mission_defs.ord` berarti 0005 belum jalan. |
| Saat memasukkan nama muncul "Server API tidak ditemukan" | Sama dengan baris pertama | Gunakan mode tamu untuk mencoba game; perbaiki pemasangan untuk menyimpan skor. |
| "Terlalu banyak pemain baru dari jaringan ini" | Pembatas laju: 60 pemain baru per jam per jaringan (satu Wi-Fi sekolah dihitung satu jaringan) | Tunggu satu jam atau pakai kode pemulihan yang sudah ada. |
| Perilaku API aneh setelah memperbarui | Berkas rute lama (`functions/api/player`, `quiz`, `game`, `reports`, `admin`) masih ada di repo | Hapus folder/berkas itu di GitHub, atau pakai workflow `docs/unzip.yml` terbaru yang menghapusnya otomatis. |
| "Nama tampilan 2-20 karakter..." | Nama berisi simbol, atau memuat 7 angka atau lebih | Pakai huruf, angka, spasi, `_ . -`. |
| Penyimpanan browser dinonaktifkan | Mode privat memblokir localStorage | Pakai mode biasa, atau main sebagai tamu. |
| Skor misi "menunggu tinjauan" | Misi selesai lebih cepat dari batas wajar, atau progres lama dari perangkat | Admin > Tinjauan > Setujui. Batas waktu bisa diubah di Admin > Misi. |
| Kuis "Soal belum tersedia", atau level berisi kurang dari 20 soal | Migrasi 0004/0007/0011 belum dijalankan | Jalankan migrasi tersebut. |
| Level berisi lebih dari 20 soal atau soal terlihat ganda | `0011_soal_tambahan.sql` terjalankan dua kali | Di D1 Console hapus duplikat: `DELETE FROM quiz_questions WHERE id NOT IN (SELECT MIN(id) FROM quiz_questions GROUP BY kind,level,question);` |
| Admin: "Secret ADMIN_SETUP_TOKEN belum diatur" | Secret belum dibuat | Pages > Settings > Variables and Secrets > tambah Secret, deploy ulang. |
| Foto laporan "penyimpanan foto belum diaktifkan" | Binding R2 `PHOTOS` belum ada | Opsional; tambah bucket R2 dan binding `PHOTOS`. |

## Penjaga Hutan AI tidak menjawab
- `misconfigured` / "belum dikonfigurasi dengan benar": Gemini menolak kunci atau nama model. Periksa secret `GEMINI_API_KEY` (tanpa spasi/tanda kutip) dan variabel `GEMINI_MODEL`, lalu deploy ulang.
- Halaman menampilkan "belum diaktifkan": secret `GEMINI_API_KEY` (minimal 20 karakter), binding `AI` atau tiga variabel `AI_API_KEY`, `AI_BASE_URL` (harus `https://`), `AI_MODEL` belum lengkap, atau belum deploy ulang. Cek `/api/health`: bidang `ai`.
- "Kuota habis": jatah harian Workers AI atau kuota penyedia habis. Tunggu reset atau turunkan `CHAT_DAILY_LIMIT`; lihat penggunaan di dashboard.
- "Terlalu banyak pertanyaan"/"batas harian": pembatas laju aktif (`CHAT_IP_LIMIT`, `CHAT_DAILY_LIMIT`).
- "Tidak dapat dihubungi" (502): nama model salah atau penyedia gangguan. Coba `AI_MODEL` lain.
- Jawaban terlalu lama (504): coba lagi; model besar bisa lambat.
- Halaman bilang API tidak ditemukan: situs belum dipasang dengan Pages Functions (lihat bagian lain di atas).
