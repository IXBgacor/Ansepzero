-- Misi Penjaga Hutan: definisi misi untuk validasi server. max_points dihitung dari data kampanye game (jumlah poin langkah).
-- min_duration_s = 10 detik x jumlah langkah: waktu minimum (diukur SERVER) sejak misi sebelumnya sebelum skor dianggap wajar.
ALTER TABLE game_mission_defs ADD COLUMN ord INTEGER NOT NULL DEFAULT 0;
INSERT INTO game_mission_defs(mission_id,title,max_points,min_duration_s,educational,active,ord) VALUES
('c1m1','Hutan, Penjaga Kehidupan',80,30,1,1,1),
('c1m2','Rumah Bagi Satwa',80,30,1,1,2),
('c1m3','Misteri Tanah Gambut',90,30,1,1,3),
('c1m4','Hutan, Air, dan Tanah',80,30,1,1,4),
('c1m5','Ujian Bab 1: Kuis Penjaga Pemula',100,10,1,1,5),
('patrol','Patroli Lingkungan',60,30,1,1,6),
('c2m2','Cuaca Kering, Api Mudah Menyebar',80,30,1,1,7),
('c2m3','Mengenali Sumber Penyulut',80,30,1,1,8),
('c2m4','Tingkat Kewaspadaan',100,20,1,1,9),
('c2m5','Tanda Awal Kebakaran',100,20,1,1,10),
('c3m1','Kabut Asap dan Kualitas Udara',80,30,1,1,11),
('c3m2','Luka pada Lahan dan Satwa',90,20,1,1,12),
('c3m3','Asap dan Kesehatan Warga',80,30,1,1,13),
('c3m4','Sekolah di Tengah Asap',90,30,1,1,14),
('c3m5','Dampak pada Ekonomi',90,30,1,1,15),
('friend','Sahabat Masyarakat',100,20,1,1,16),
('c4m2','Poster Peringatan',80,20,1,1,17),
('c4m3','Penyuluhan di Balai Desa',100,20,1,1,18),
('c4m4','Api Unggun yang Aman',90,30,1,1,19),
('c4m5','Jangan Bakar Sampah',90,30,1,1,20),
('c5m1','Kenali Tanda Kebakaran',100,20,1,1,21),
('c5m2','Tentukan Lokasi dengan Jelas',100,30,1,1,22),
('report','Laporan Bahaya',140,20,1,1,23),
('c5m4','Siapa yang Harus Dihubungi?',100,20,1,1,24),
('c5m5','Laporan Lengkap dari Jarak Aman',140,20,1,1,25),
('c6m1','Skenario: Pengunjung Merokok',100,10,1,1,26),
('c6m2','Skenario: Asap Mendekati Desa',120,20,1,1,27),
('c6m3','Pulihkan Lahan Gambut',100,30,1,1,28),
('c6m4','Patroli Gabungan',100,40,1,1,29),
('c6m5','Tantangan Akhir: Penjaga Hutan',200,30,1,1,30),
('final','Misi Terakhir (simulasi relawan)',100,60,0,1,31);
-- Kontak tambahan dari pemberitaan resmi InfoPublik (Oktober 2026): Posko Karhutla Kementerian Kehutanan (nasional, bukan khusus Batola). Perlu dikonfirmasi.
INSERT INTO contacts(name,phone_intl,note,verified,sort) VALUES('Posko Karhutla Kementerian Kehutanan (nasional)','6281310035000','Nomor WhatsApp dilaporkan InfoPublik (Okt 2026). Bukan kontak khusus Barito Kuala; konfirmasi ke instansi sebelum publikasi.',0,2);
