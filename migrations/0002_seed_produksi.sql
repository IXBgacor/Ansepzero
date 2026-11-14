-- Data dari pemilik proyek (bukan DEMO). Sumber: Dinas Kesehatan Marabahan (Kab. Barito Kuala), dokumen "Data Program ISPA Tahun 2026", tanggal dokumen 15 Oktober 2026.
INSERT INTO ispa_data(period,label,cases,is_partial,note) VALUES
('2026-01','Januari',3183,0,NULL),('2026-02','Februari',2266,0,NULL),('2026-03','Maret',2135,0,NULL),
('2026-04','April',1957,0,NULL),('2026-05','Mei',1442,0,NULL),('2026-06','Juni',1935,0,NULL),
('2026-07','Juli',2489,0,NULL),('2026-08','Agustus',3002,0,NULL),('2026-09','September',3144,0,NULL),
('2026-10','Okt 1-12',671,1,'Data parsial sampai 12 Oktober 2026');
INSERT INTO contacts(name,phone_intl,note,verified,sort) VALUES
('Pemadam Kebakaran (Damkar) Marabahan','6282192825967','Nomor Damkar Marabahan dari pemilik proyek. Perlu dikonfirmasi ke instansi terkait sebelum situs dipublikasikan.',0,1);
INSERT INTO app_settings(key,value) VALUES('pass_threshold','80'),('ispa_source','Dinas Kesehatan Marabahan (Kabupaten Barito Kuala): dokumen "Data Program ISPA Tahun 2026", tanggal dokumen 15 Oktober 2026, disediakan pemilik proyek. Data Oktober hanya sampai 12 Oktober 2026.');
