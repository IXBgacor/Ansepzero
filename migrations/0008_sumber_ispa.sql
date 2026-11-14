-- Memperbarui atribusi sumber data ISPA pada database yang sudah berjalan (aman dijalankan ulang).
UPDATE app_settings SET value='Dinas Kesehatan Marabahan (Kabupaten Barito Kuala): dokumen "Data Program ISPA Tahun 2026", tanggal dokumen 15 Oktober 2026, disediakan pemilik proyek. Data Oktober hanya sampai 12 Oktober 2026.' WHERE key='ispa_source';
