# Panduan Sertifikat
- Dua jenis: kuis (hijau, nomor `AZQ-AAAA-XXXX-XXXX`) dan game (oranye, bintang + skor, `AZG-...`). Satu sertifikat per jenis per peserta.
- Terbit hanya lewat server: kuis = 5 level lulus; game = ada skor tamat di database. Mengubah JavaScript/localStorage/URL tidak memberi sertifikat karena server memeriksa riwayatnya.
- Nama pada sertifikat = nama tampilan saat terbit (disalin ke `name_snapshot`).
- Cetak: tombol "Cetak / simpan PDF" mencetak hanya sertifikat itu; pilih "Simpan sebagai PDF", kertas A4 lanskap. CSS `@page` mengatur A4 lanskap margin 10 mm; uji otomatis menghasilkan 1 halaman.
- Verifikasi: `#/sertifikat` (form publik) atau `GET /api/certificates/verify?no=`.
- Keterangan pada sertifikat menyatakan bukan sertifikat resmi pemerintah/sekolah.
- Batasan: bila pengguna mengganti nama tampilan setelah terbit, sertifikat lama tidak berubah.
