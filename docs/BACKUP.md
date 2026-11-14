# Cadangan dan pemulihan
**Dari HP (browser saja):** Admin > Ekspor > Unduh cadangan SQL. Berisi semua tabel kecuali akun admin, sesi, dan pembatas laju. Simpan di tempat aman (memuat nama pemain dan lokasi laporan). Lakukan rutin, misalnya mingguan.
**Pulihkan:** pada database D1 kosong terapkan semua migrasi (0001 sampai 0011, kecuali 0009), lalu tempel isi berkas cadangan di D1 Console (pecah jika terlalu panjang). Akun admin dibuat ulang lewat form setup. Foto di R2 tidak ikut dalam cadangan SQL.
**Resmi Cloudflare (butuh Wrangler/terminal):** `wrangler d1 export <nama>` untuk ekspor SQL, dan Time Travel (`wrangler d1 time-travel restore`) untuk kembali ke titik waktu dalam 30 hari terakhir (menurut dokumentasi Cloudflare saat ini; verifikasi). Opsi ini tidak diwajibkan oleh proyek ini.

## Catatan: memperbarui label kontak Damkar pada database yang sudah berjalan
Edit lewat Admin > Kontak, atau di D1 Console:
`UPDATE contacts SET name='Pemadam Kebakaran (Damkar) Marabahan', note='Nomor Damkar Marabahan dari pemilik proyek. Perlu dikonfirmasi ke instansi terkait sebelum situs dipublikasikan.' WHERE phone_intl='6282192825967';`
