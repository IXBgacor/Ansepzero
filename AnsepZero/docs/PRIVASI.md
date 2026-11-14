# Catatan Privasi (teknis)
Teks kebijakan untuk pengguna ada di halaman `#/privasi`. Ringkasan teknis:
- Data peserta: `display_name` (alias), `client_id` acak, hash token (token asli tidak disimpan), skor/riwayat, sertifikat. Tanpa email/telepon/alamat/GPS.
- Formulir lapor karhutla tidak mengirim data ke server.
- Leaderboard publik opt-in (bawaan tidak tampil). Admin melihat nama tampilan saja.
- Verifikasi sertifikat publik: jenis, nama tampilan, tanggal.
- Log server: hanya pesan galat tanpa token/kata sandi. `audit_logs` mencatat tindakan admin.
- Penghapusan data cloud belum otomatis (prosedur manual lewat pengelola). Tambahkan fitur ini bila dibutuhkan.
- Bila memakai analitik/iklan pihak ketiga di masa depan, perbarui kebijakan.
