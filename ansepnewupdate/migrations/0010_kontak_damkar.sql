-- Mengembalikan kontak Damkar Marabahan setelah versi uji (nomor tester). Aman dijalankan pada database mana pun:
-- jika nomor tester tidak ada, tidak ada yang berubah.
UPDATE contacts SET active=1 WHERE phone_intl IN ('6281310035000','117') AND EXISTS(SELECT 1 FROM contacts WHERE phone_intl='6285787920502');
UPDATE contacts SET name='Pemadam Kebakaran (Damkar) Marabahan', phone_intl='6282192825967', note='Nomor Damkar Marabahan dari pemilik proyek. Perlu dikonfirmasi ke instansi terkait sebelum situs dipublikasikan.', verified=0, active=1 WHERE phone_intl='6285787920502';
