-- Materi edukasi DRAF (published=0). Isi hanya merangkum klaim dari sumber yang tercantum.
-- Tim wajib memeriksa ulang terhadap dokumen resmi (BPBD, DLH, KLHK, Kemenkes) sebelum: UPDATE education_content SET published=1;
INSERT INTO education_content(slug,title,body_md,sources_json,sort,published,updated_at) VALUES
('pengertian','Pengertian karhutla dan kabut asap',
'Karhutla adalah singkatan dari kebakaran hutan dan lahan.
Kebakaran bisa merambat di permukaan, dan di lahan gambut api juga dapat membakar bahan organik di bawah permukaan tanah.
Asap dari kebakaran ini disebut kabut asap. Asap karhutla mengandung partikel halus PM2,5 yang dapat masuk ke saluran pernapasan.',
'[{"t":"Evaluasi Pencegahan Kebakaran Hutan dan Lahan Gambut di Kabupaten OKI (merujuk KLHK 2019)","u":"https://jurnalrekayasa.bunghatta.ac.id/index.php/JRFTSP/article/download/137/170"},{"t":"Kemenkes: Menkes, Pakai Masker dan Pantau Kualitas Udara untuk Cegah Dampak Asap Karhutla","u":"https://kemkes.go.id/id/menkes-pakai-masker-dan-pantau-kualitas-udara-untuk-cegah-dampak-asap-karhutla"}]',1,0,strftime('%s','now')),
('penyebab','Penyebab karhutla',
'KLHK menyebut tiga faktor penting: perilaku manusia, rusaknya ekosistem gambut, dan cuaca.
Salah satu pemicu dari manusia adalah membakar untuk membuka lahan karena dianggap mudah dan murah.
Penyebab langsung antara lain pembakaran dan kelalaian; penyebab tidak langsung antara lain alih fungsi hutan dan degradasi lahan.
Pembakaran hutan dan lahan adalah pelanggaran hukum. Ada pengecualian terbatas untuk kearifan lokal dengan syarat ketat; tanyakan aturan terbarunya ke dinas setempat sebelum mengandalkannya.',
'[{"t":"Republika: KLHK Sebut Tiga Faktor Utama Penyebab Karhutla (2019)","u":"https://news.republika.co.id/berita/py5wtk409/klhk-sebut-tiga-faktor-utama-penyebab-karhutla"},{"t":"DPR RI (P3DI): Info Singkat, Kebakaran Hutan dan Lahan (2017)","u":"https://berkas.dpr.go.id/pusaka/files/info_singkat/Info Singkat-IX-15-I-P3DI-Agustus-2017-189.pdf"},{"t":"Hukumonline: Pasal-pasal penjerat pelaku pembakar hutan dan lahan","u":"https://www.hukumonline.com/berita/a/melihat-pasal-pasal-penjerat-pelaku-pembakar-hutan-dan-lahan-lt5f16ba762542c/"}]',2,0,strftime('%s','now')),
('kesehatan','Dampak asap bagi kesehatan dan cara mengurangi paparan',
'Asap karhutla dapat menyebabkan iritasi mata, iritasi kulit, serta iritasi dan peradangan saluran pernapasan yang dikenal sebagai ISPA.
Semua orang berisiko. Kelompok yang lebih rentan: bayi, balita, ibu hamil, lansia, dan orang dengan penyakit paru kronik, penyakit jantung, atau asma.
Anjuran Kemenkes: tetap di dalam rumah; pakai masker bila harus keluar (N95 bila tersedia, jika tidak ada pakai masker yang ada); lindungi mata dan kulit; minum air putih yang cukup; hindari aktivitas fisik berat; terapkan hidup bersih dan sehat.
Jangan abaikan gejala seperti batuk atau iritasi mata dan kulit. Segera ke fasilitas kesehatan terdekat bila ada keluhan.
Data kasus ISPA bulanan Barito Kuala ada di beranda. Angka itu bukan bukti bahwa semua kasus disebabkan asap.',
'[{"t":"Kemenkes: Upaya Pencegahan, Kurangi Dampak Kabut Asap Bagi Kesehatan","u":"https://kemkes.go.id/eng/dampak-kabut-asap-bisa-dikurangi"},{"t":"InfoPublik (16 Oktober 2026): Menkes imbau kelompok rentan batasi aktivitas di luar rumah saat kabut asap","u":"https://infopublik.id/kategori/bencana/993442/menkes-imbau-kelompok-rentan-batasi-aktivitas-di-luar-rumah-saat-kabut-asap"},{"t":"Kemenkes: Menkes, Pakai Masker dan Pantau Kualitas Udara untuk Cegah Dampak Asap Karhutla","u":"https://kemkes.go.id/id/menkes-pakai-masker-dan-pantau-kualitas-udara-untuk-cegah-dampak-asap-karhutla"}]',3,0,strftime('%s','now')),
('pencegahan','Pencegahan kebakaran hutan, lahan, dan gambut',
'Pencegahan adalah langkah awal yang paling penting. Pengendalian karhutla mencakup pencegahan, pemadaman, penanganan pascakebakaran, dukungan evakuasi dan penyelamatan, serta dukungan manajemen.
Pelibatan masyarakat untuk membuka lahan tanpa bakar disebut sebagai kunci pencegahan.
Lahan gambut yang terjaga kebasahannya lewat pengelolaan tata air yang baik membantu mencegah kebakaran.
Kebakaran di lahan gambut sulit padam bila tidak ada hujan, sehingga mencegahnya jauh lebih efektif daripada memadamkannya.',
'[{"t":"DLHK Banten: Pencegahan Kebakaran Hutan (merujuk PermenLHK)","u":"https://dlhk.bantenprov.go.id/storage/dlhk/upload/article/2023/Pencegahan_Kebakaran_Hutan.pdf"},{"t":"Kontan: Pentingnya kolaborasi dan sinergi dalam mencegah kebakaran hutan dan lahan","u":"https://industri.kontan.co.id/news/pentingnya-kolaborasi-dan-sinergi-dalam-mencegah-kebakaran-hutan-dan-lahan"},{"t":"Mongabay: Kebakaran hutan dan lahan sampai September 2019 hampir 900 ribu hektar","u":"https://mongabay.co.id/2019/10/22/kebakaran-hutan-dan-lahan-sampai-september-2019-hampir-900-ribu-hektar/"}]',4,0,strftime('%s','now')),
('darurat','Langkah saat menemukan kebakaran dan evakuasi',
'BAGIAN INI BELUM BERSUMBER. Isi langkah darurat dan evakuasi harus disusun dari pedoman resmi BPBD atau Damkar Barito Kuala, lalu diisi lewat panel admin.
Sementara itu, hubungi pemadam lewat tombol di Pusat Bantuan. Laporan lewat situs bukan pengganti panggilan darurat.',
'[]',5,0,strftime('%s','now'));
