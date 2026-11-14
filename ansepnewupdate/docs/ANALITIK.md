# Analitik pemahaman karhutla
Hanya data peserta platform; bukan survei representatif penduduk Barito Kuala, dan hasil tes tidak membuktikan perubahan perilaku.
- Total kunjungan: jumlah kunjungan (satu per sesi browser); bukan orang. Pemain unik: ID pemain berbeda. Peserta evaluasi: pemain dengan minimal satu evaluasi awal/akhir yang sah.
- Memenuhi kriteria = peserta evaluasi dengan skor evaluasi terbaik >= ambang / peserta evaluasi. Ambang awal 80% adalah keputusan desain demonstrasi, bukan standar ilmiah resmi; ubah di Admin > Pengaturan.
- Peningkatan = peserta dengan evaluasi akhir terbaru > evaluasi awal pertama / peserta yang punya keduanya.
- Penyelesaian level = pemain lulus / pemain yang mencoba level itu (null jika belum ada yang mencoba). Kategori: jawaban benar / total jawaban. Soal tersulit: minimal 3 jawaban.
- Pemain yang belum tes tidak dihitung "tidak paham". Percobaan yang ditandai tidak dihitung sampai disetujui admin.
- Evaluasi awal hanya sekali. Soal evaluasi awal dan akhir setara tetapi tidak identik (set terpisah di bank soal: jenis `pre` dan `post`).
