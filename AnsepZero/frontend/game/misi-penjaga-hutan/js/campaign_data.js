/* DATA KAMPANYE v0.4 — 6 bab x 5 misi = 30 misi. Edit file ini untuk memperbarui isi misi (tanpa menyentuh mesin misi).

   Struktur misi:  { id, ch, title, desc, goal, hint, brief, steps[], edu, tip, verify? }
   Jenis langkah (step):
     visit    periksa objek / bicara dengan NPC          { id, t, poi, label, pts, pages[] }
     observe  amati area bahaya dari JARAK AMAN (cincin hijau) { id, t:'observe', poi, label, pts, pages[] }
     quiz     pilih tindakan / kuis, 1..n soal            { id, t:'quiz', poi, label, pts, qs[] }
   Opsional per langkah: requires:[id langkah], chain:true (digabung dalam satu dialog setelah langkah syaratnya), intro:[], after:[]
   Soal dibuat dengan Q(teks, [benar, umpanBalik], [salah, umpanBalik], ...) — pilihan pertama = benar; urutan diacak tetap (stabil) per soal.
   verify:{note} menandai materi yang HARUS dicek ke sumber resmi sebelum publikasi.
   ID misi lama dipertahankan agar progres v0.3 terbaca: patrol, friend, report. */
(function (M) {
  const V = (id, poi, label, pts, pages, x) => Object.assign({ id, t: 'visit', poi, label, pts, pages }, x || {});
  const OB = (id, poi, label, pts, pages, x) => Object.assign({ id, t: 'observe', poi, label, pts, pages }, x || {});
  const QZ = (id, poi, label, pts, qs, x) => Object.assign({ id, t: 'quiz', poi, label, pts, qs }, x || {});
  function Q(text, ...opts) {
    const o = opts.map((x, i) => ({ label: x[0], fb: x[1], good: i === 0 }));
    let h = 7; for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const r = [], a = o.slice(); while (a.length) { h = (h * 1664525 + 1013904223) >>> 0; r.push(a.splice(h % a.length, 1)[0]); }
    return { text, o: r };
  }
  /* Soal dengan urutan pilihan TETAP (dipakai misi lama agar identik dengan v0.3). */
  const QF = (text, ...opts) => ({ text, o: opts.map(x => ({ label: x[0], fb: x[1], good: !!x[2] })) });

  const chapters = [
    { id: 1, title: 'Kenali Hutan', desc: 'Fungsi hutan, lahan gambut, dan ekosistem.', intro: 'Sebelum menjaga hutan, kenali dulu apa yang dijaga: fungsi hutan, tanah gambut, dan makhluk hidup di dalamnya.' },
    { id: 2, title: 'Waspada Api', desc: 'Penyebab karhutla, cuaca kering, dan sumber penyulut.', intro: 'Karhutla hampir selalu bermula dari sumber api dan lahan yang kering. Kenali penyebabnya agar bisa dicegah.' },
    { id: 3, title: 'Dampak Karhutla', desc: 'Asap, lingkungan, kesehatan, sekolah, dan ekonomi.', intro: 'Kebakaran hutan dan lahan memengaruhi udara, alam, kesehatan, sekolah, dan ekonomi. Lihat dampaknya, dengan tetap aman.' },
    { id: 4, title: 'Penjaga Masyarakat', desc: 'Edukasi warga dan pencegahan kebakaran.', intro: 'Pencegahan paling kuat dimulai dari warga. Ajak, ingatkan, dan beri contoh cara yang aman.' },
    { id: 5, title: 'Pelaporan Aman', desc: 'Mengenali indikasi kebakaran, menentukan lokasi, dan melapor.', intro: 'Jika melihat tanda kebakaran: jauhi, amati dari jarak aman, tentukan lokasi dengan jelas, lalu laporkan ke petugas.' },
    { id: 6, title: 'Misi Penyelamatan Lingkungan', desc: 'Keputusan dalam skenario dan tantangan akhir.', intro: 'Saatnya menerapkan semuanya: ambil keputusan dalam skenario, pulihkan lingkungan, dan selesaikan tantangan akhir.' }
  ];

  const missions = [
    /* ================= BAB 1 — KENALI HUTAN ================= */
    { id: 'c1m1', ch: 1, title: 'Hutan, Penjaga Kehidupan', desc: 'Pelajari fungsi hutan bagi manusia dan alam.',
      goal: 'Dengarkan Petugas Rimba, periksa Pohon Besar, lalu jawab pertanyaannya.',
      hint: 'Petugas Rimba ada di dekat titik awal. Pohon Besar ada di tepi hutan sebelah barat.',
      brief: 'Selamat datang di Hutan Rimba Asri, Penjaga Hutan! Mulailah dengan mengenali apa saja yang hutan berikan kepada kita. Aturan keselamatan nomor satu: jangan pernah mendekati api atau asap dan jangan memadamkan kebakaran sendirian. Amati dari jauh, lalu laporkan.',
      steps: [
        V('s1', 'officer', 'Dengarkan penjelasan Petugas Rimba', 20, ['Hutan bukan sekadar kumpulan pohon. Hutan menyerap karbon dioksida dan melepas oksigen, menahan air hujan, menjaga tanah agar tidak mudah longsor, dan menjadi rumah bagi banyak satwa.', 'Hutan juga memberi manfaat bagi warga: sumber air, hasil hutan bukan kayu, dan udara yang lebih sejuk. Karena itu hutan perlu dijaga bersama.']),
        V('s2', 'bigtree', 'Periksa Pohon Besar', 20, ['Pohon besar ini sudah berdiri sangat lama. Akarnya mencengkeram tanah, tajuknya menaungi tumbuhan di bawahnya, dan batangnya menyimpan karbon.', 'Pohon setua ini tidak tergantikan dalam sekejap: butuh bertahun-tahun agar sebuah bibit tumbuh sebesar ini.']),
        QZ('s3', 'officer', 'Jawab pertanyaan Petugas Rimba', 40, [
          Q('Manakah yang BUKAN fungsi hutan bagi lingkungan?',
            ['Membuat tanah mudah longsor dan air cepat hilang', 'Betul! Justru sebaliknya: akar pohon menahan tanah dan hutan membantu menyerap air hujan.'],
            ['Menjadi rumah bagi satwa', 'Itu memang fungsi hutan, jadi bukan jawaban pertanyaan ini. Cari hal yang merugikan.'],
            ['Menyerap karbon dioksida', 'Itu juga fungsi hutan yang penting. Cari hal yang tidak termasuk fungsi hutan.'])], { requires: ['s1', 's2'] })],
      edu: 'Hutan menyerap karbon dioksida, menahan air dan tanah, serta menjadi habitat satwa. Menjaga hutan berarti menjaga udara, air, dan penghidupan kita.',
      tip: 'Hutan menahan tanah dan air serta menyerap karbon, jadi kerusakannya merugikan semua orang.' },

    { id: 'c1m2', ch: 1, title: 'Rumah Bagi Satwa', desc: 'Kenali ekosistem hutan: makhluk hidup yang saling bergantung.',
      goal: 'Periksa Sarang Burung dan Jejak Satwa, lalu jawab pertanyaan tentang ekosistem.',
      hint: 'Sarang Burung ada di utara; Jejak Satwa di barat laut Petugas Rimba.',
      brief: 'Hutan adalah ekosistem: tumbuhan, hewan, tanah, dan air saling terhubung. Cari tanda-tandanya, tetapi jangan ganggu penghuninya.',
      steps: [
        V('s1', 'nest', 'Periksa Sarang Burung', 20, ['Sarang ini berisi telur burung. Burung memakan serangga dan menyebarkan biji buah, sehingga ikut menumbuhkan hutan baru.', 'Jangan mengganggu sarang atau mengambil telurnya. Biarkan induknya kembali dengan tenang.']),
        V('s2', 'tracks', 'Periksa Jejak Satwa', 20, ['Jejak kaki di tanah menandakan ada satwa yang lewat. Setiap satwa punya peran: ada yang memakan tumbuhan, ada yang memangsa, ada yang menyebarkan biji.', 'Amati dari jauh, jangan mengikuti atau memburu satwa. Jejaknya cukup dicatat.']),
        QZ('s3', 'tracks', 'Jawab pertanyaan ekosistem', 40, [
          Q('Mengapa kebakaran hutan membahayakan ekosistem?',
            ['Habitat dan sumber makanan satwa rusak, sehingga rantai makanan ikut terganggu', 'Tepat! Dalam ekosistem, kerusakan di satu bagian merambat ke bagian lain.'],
            ['Satwa akan senang karena lahan jadi terbuka', 'Kurang tepat. Satwa kehilangan tempat tinggal, makanan, dan tempat berlindung.'],
            ['Hanya pohon yang terdampak, hewan tidak', 'Kurang tepat. Hewan bergantung pada pohon untuk makan dan berlindung, jadi ikut terdampak.'])], { requires: ['s1', 's2'] })],
      edu: 'Dalam ekosistem, semua makhluk hidup saling bergantung. Merusak satu bagian, misalnya lewat kebakaran, mengganggu bagian lainnya.',
      tip: 'Ekosistem saling terkait; kebakaran merusak habitat dan rantai makanan.' },

    { id: 'c1m3', ch: 1, title: 'Misteri Tanah Gambut', desc: 'Kenali lahan gambut dan alasan gambut kering sangat rawan terbakar.',
      goal: 'Periksa Tanah Gambut dan Kanal Pengering, lalu jawab pertanyaan tentang menjaga gambut.',
      hint: 'Tanah Gambut ada di barat daya; Kanal Pengering tak jauh di selatannya.',
      brief: 'Di sebagian wilayah Indonesia, hutan tumbuh di atas tanah gambut. Mari kenali tanah istimewa ini.',
      steps: [
        V('s1', 'peat', 'Periksa Tanah Gambut', 25, ['Gambut terbentuk dari sisa tumbuhan yang menumpuk sangat lama dalam kondisi tergenang air, sehingga membusuk lambat. Gambut menyimpan banyak karbon dan berfungsi seperti spons yang menahan air.', 'Selama gambut tetap basah, ia sulit terbakar.']),
        V('s2', 'canal', 'Periksa Kanal Pengering', 25, ['Kanal yang dibuat untuk mengeringkan lahan membuat air gambut mengalir keluar. Gambut yang kering mudah terbakar, apinya bisa membara di bawah permukaan sehingga sulit dipadamkan, dan menghasilkan banyak asap.', 'Salah satu upaya pemulihan adalah menyekat kanal agar air tertahan dan membasahi kembali gambut (rewetting).']),
        QZ('s3', 'peat', 'Jawab pertanyaan tentang gambut', 40, [
          Q('Agar lahan gambut tidak mudah terbakar, apa yang perlu dijaga?',
            ['Gambut tetap basah (permukaan airnya terjaga)', 'Tepat! Gambut yang basah sulit terbakar. Karena itu penyekatan kanal dan pembasahan kembali penting.'],
            ['Kanal dibuat lebih dalam agar cepat kering', 'Berbahaya! Gambut yang kering mudah terbakar dan sulit dipadamkan.'],
            ['Gambut dibiarkan kering agar mudah ditanami', 'Kurang tepat. Gambut kering justru sangat rawan terbakar.'])], { requires: ['s1', 's2'] })],
      edu: 'Gambut menyimpan banyak karbon dan bekerja seperti spons. Jika dikeringkan, gambut mudah terbakar dan apinya sulit dipadamkan, jadi gambut harus dijaga tetap basah.',
      tip: 'Gambut kering mudah terbakar dan apinya bisa membara di bawah tanah; jaga agar tetap basah.',
      verify: { note: 'Fakta gambut (pembentukan, simpanan karbon, rewetting, sekat kanal): cek ke BRGM dan KLHK.' } },

    { id: 'c1m4', ch: 1, title: 'Hutan, Air, dan Tanah', desc: 'Pahami hubungan hutan dengan air dan tanah.',
      goal: 'Periksa Titik Pantau Sungai dan Bibit Pohon, lalu jawab pertanyaan.',
      hint: 'Titik Pantau Sungai di tepi barat sungai (utara jembatan); Bibit Pohon di barat laut, dekat Pos Jaga.',
      brief: 'Air jernih dan tanah yang kokoh adalah hadiah dari hutan. Mari kita buktikan.',
      steps: [
        V('s1', 'riverside', 'Periksa Titik Pantau Sungai', 20, ['Air sungai di sini jernih. Akar pohon di tepinya menahan tanah supaya tidak terkikis dan membuat sungai keruh.', 'Di hutan yang sehat, tanah dan serasah menyerap air hujan perlahan sehingga air tersimpan dan mengalir lebih terkendali.']),
        V('s2', 'seedling', 'Periksa Bibit Pohon', 20, ['Bibit pohon jenis setempat ini sedang tumbuh. Menanam kembali pohon (reboisasi) membantu memulihkan tanah dan air.', 'Tumbuh besar butuh bertahun-tahun, jadi mencegah kerusakan jauh lebih baik daripada memperbaikinya.']),
        QZ('s3', 'riverside', 'Jawab pertanyaan tentang air dan tanah', 40, [
          Q('Apa manfaat pohon di tepi sungai?',
            ['Akarnya menahan tanah sehingga tepi sungai tidak mudah longsor dan air tidak mudah keruh', 'Betul! Akar pohon seperti jangkar bagi tanah.'],
            ['Tidak ada manfaat; sebaiknya semua ditebang', 'Kurang tepat. Tanpa pohon, tepi sungai mudah terkikis dan air menjadi keruh.'],
            ['Hanya sebagai hiasan', 'Kurang tepat. Pohon di tepi sungai punya peran nyata menahan tanah dan menaungi air.'])], { requires: ['s1', 's2'] })],
      edu: 'Akar pohon menahan tanah dan hutan membantu menyerap air hujan. Hutan yang sehat menjaga air tetap jernih dan tanah tetap kokoh.',
      tip: 'Pohon menahan tanah dan menjaga air; menanam dan merawatnya memulihkan lingkungan.' },

    { id: 'c1m5', ch: 1, title: 'Ujian Bab 1: Kuis Penjaga Pemula', desc: 'Kuis singkat untuk menguji pemahaman Bab 1.',
      goal: 'Jawab 3 pertanyaan kuis dari Petugas Rimba.', hint: 'Temui Petugas Rimba di dekat titik awal.',
      brief: 'Saatnya ujian singkat! Jawab tiga pertanyaan tentang hutan, gambut, dan ekosistem.',
      steps: [QZ('s1', 'officer', 'Jawab 3 pertanyaan kuis', 100, [
        Q('Manakah pernyataan yang benar tentang hutan?',
          ['Hutan menahan air dan tanah serta menjadi rumah satwa', 'Benar! Hutan punya banyak fungsi penting.'],
          ['Hutan hanya berguna jika semuanya ditebang', 'Salah. Menebang semuanya merusak fungsi hutan bagi air, tanah, udara, dan satwa.'],
          ['Hutan tidak berpengaruh pada udara dan air', 'Salah. Hutan sangat berpengaruh pada udara dan air.']),
        Q('Mengapa gambut yang kering berbahaya?',
          ['Mudah terbakar, apinya bisa membara di bawah tanah dan sulit dipadamkan', 'Benar! Karena itu gambut harus dijaga tetap basah.'],
          ['Gambut kering justru tidak bisa terbakar', 'Salah. Gambut kering sangat mudah terbakar.'],
          ['Gambut kering menyerap lebih banyak air hujan', 'Salah. Gambut yang kering justru sulit menyerap air kembali dan rawan terbakar.']),
        Q('Bagaimana sikap yang tepat terhadap satwa liar di hutan?',
          ['Amati dari jauh dan tidak mengganggu', 'Benar! Satwa liar sebaiknya dibiarkan hidup tenang di habitatnya.'],
          ['Didekati dan diberi makan', 'Kurang tepat. Mendekati dan memberi makan bisa membahayakan satwa maupun manusia.'],
          ['Ditangkap untuk dibawa pulang', 'Salah. Satwa liar tidak boleh ditangkap sembarangan.'])])],
      edu: 'Bab 1 selesai: hutan menjaga air, tanah, udara, dan satwa; gambut harus tetap basah; satwa liar dihormati dari jauh.',
      tip: 'Ulangi Bab 1: fungsi hutan, gambut harus tetap basah, dan satwa dihormati dari jauh.' },

    /* ================= BAB 2 — WASPADA API ================= */
    { id: 'patrol', ch: 2, title: 'Patroli Lingkungan', desc: 'Patroli di sekitar jalan tanah untuk memeriksa titik rawan.',
      goal: 'Periksa 3 objek lingkungan di area hutan.', hint: 'Cari objek bertanda kuning di sekitar jalan tanah.',
      brief: 'Sekarang perhatikan titik-titik rawan kebakaran. Lakukan patroli sederhana di sekitar jalan tanah.',
      steps: [
        V('board', 'board', 'Periksa Papan Informasi', 20, ['Papan memuat peta jalur patroli dan aturan kawasan hutan.', 'Aturan utama: jangan buang puntung rokok sembarangan, jangan membakar lahan, dan laporkan asap atau api yang terlihat.']),
        V('soil', 'soil', 'Periksa Sampel Tanah', 20, ['Tanah di sini kering dan retak. Daun serta ranting kering di atasnya sangat mudah terbakar saat kemarau.', 'Catat sebagai area rawan. Tugas kita: cegah sumber api (puntung rokok, api unggun) dan ingatkan warga.']),
        V('campfire', 'campfire', 'Periksa Bekas Api Unggun', 20, ['Cincin batu bekas api unggun. Tidak ada asap maupun bara, abunya sudah dingin.', 'Api unggun harus dipastikan padam total sebelum ditinggal. Jika kamu menemukan bara atau asap dan tidak yakin aman, jauhi dan laporkan ke petugas.'])],
      edu: 'Tanah dan daun kering mudah terbakar saat kemarau; sumber api seperti puntung rokok dan api unggun harus dicegah.',
      tip: 'Daun dan tanah kering mudah terbakar; cegah sumber api dan ingatkan warga.' },

    { id: 'c2m2', ch: 2, title: 'Cuaca Kering, Api Mudah Menyebar', desc: 'Pahami bagaimana cuaca kering dan angin mempercepat api.',
      goal: 'Periksa Stasiun Cuaca dan Semak Kering, lalu jawab pertanyaan.',
      hint: 'Stasiun Cuaca di selatan; Semak Kering tak jauh di selatan titik awal.',
      brief: 'Api butuh bahan bakar, panas, dan udara. Cuaca kering membuat bahan bakar siap terbakar. Cek kondisi cuaca hari ini.',
      steps: [
        V('s1', 'weather', 'Periksa Stasiun Cuaca', 20, ['Papan stasiun cuaca sederhana ini mencatat: berminggu-minggu tanpa hujan, udara panas, kelembapan rendah, dan angin bertiup cukup kencang.', 'Kombinasi ini membuat daun, ranting, dan rumput cepat mengering. Jika ada api, penyebarannya bisa sangat cepat.']),
        V('s2', 'drygrass', 'Periksa Semak Kering', 20, ['Rumput dan semak ini kering seperti kertas. Bahan seperti ini disebut bahan bakar: mudah menyala dan membantu api merambat.', 'Tugas penjaga: jangan menambah risiko. Jauhkan sumber api dari semak kering dan laporkan jika ada tanda bahaya.']),
        QZ('s3', 'weather', 'Jawab pertanyaan tentang cuaca', 40, [
          Q('Kapan risiko karhutla paling tinggi?',
            ['Saat kemarau panjang: panas, kering, dan berangin', 'Tepat! Cuaca seperti itu membuat api mudah menyala dan menyebar.'],
            ['Saat hujan deras sepanjang hari', 'Kurang tepat. Hujan deras membuat bahan bakar basah sehingga risiko lebih rendah.'],
            ['Saat tanah basah dan embun tebal', 'Kurang tepat. Tanah dan daun yang basah lebih sulit terbakar.'])], { requires: ['s1', 's2'] })],
      edu: 'Kemarau panjang, udara panas, kelembapan rendah, dan angin kencang membuat semak dan serasah kering mudah terbakar dan api menyebar cepat.',
      tip: 'Kemarau, panas, kering, dan angin kencang membuat api cepat menyebar.' },

    { id: 'c2m3', ch: 2, title: 'Mengenali Sumber Penyulut', desc: 'Kenali hal-hal yang bisa memicu kebakaran agar bisa dicegah.',
      goal: 'Periksa Puntung Rokok dan Tumpukan Sampah Bekas Bakar, lalu jawab 2 pertanyaan.',
      hint: 'Puntung Rokok di selatan jalan tanah; Tumpukan Sampah Bekas Bakar di selatan jauh, dekat Persemaian.',
      brief: 'Banyak kasus karhutla dipicu aktivitas manusia, sengaja maupun lalai. Kenali sumber penyulutnya.',
      steps: [
        V('s1', 'butt', 'Periksa Puntung Rokok', 20, ['Puntung rokok yang masih membara bisa menyulut daun dan rumput kering. Jangan membuang puntung sembarangan: padamkan, lalu buang ke tempat sampah.', 'Di kawasan hutan saat kemarau, sebaiknya tidak merokok sama sekali.']),
        V('s2', 'burnpile', 'Periksa Tumpukan Sampah Bekas Bakar', 20, ['Bekas pembakaran sampah ini sudah mati, tetapi membakar sampah atau sisa tanaman dekat semak kering sering menjadi awal kebakaran besar. Angin bisa membawa bara beterbangan.', 'Cara aman: kurangi, pilah, kompos, atau kumpulkan untuk diangkut. Jangan membakar di dekat lahan kering.']),
        QZ('s3', 'burnpile', 'Jawab 2 pertanyaan sumber penyulut', 40, [
          Q('Mana yang termasuk sumber penyulut karhutla?',
            ['Puntung rokok yang dibuang sembarangan', 'Tepat! Puntung yang masih membara bisa menyulut api.'],
            ['Embun pagi di daun', 'Kurang tepat. Embun justru membasahi bahan bakar.'],
            ['Genangan air di kanal', 'Kurang tepat. Air bukan penyulut api.']),
          Q('Warga ingin membakar tumpukan sampah dekat semak kering. Saran terbaik?',
            ['Jangan dibakar; pilah, kompos, atau angkut ke tempat pembuangan', 'Tepat! Cara itu jauh lebih aman.'],
            ['Boleh, asal dibakar malam hari', 'Salah. Malam hari tidak ada yang mengawasi; api bisa merambat tanpa diketahui.'],
            ['Boleh, ditinggal pergi karena nanti padam sendiri', 'Berbahaya! Api yang ditinggal bisa membesar tertiup angin.'])], { requires: ['s1', 's2'] })],
      edu: 'Puntung rokok, pembakaran sampah dan lahan, serta api unggun yang tidak dipadamkan adalah sumber penyulut yang bisa dicegah.',
      tip: 'Puntung rokok dan pembakaran sampah/lahan adalah penyulut yang bisa dicegah.',
      verify: { note: 'Pernyataan bahwa banyak karhutla dipicu aktivitas manusia: cek angka/rujukan resmi KLHK atau BNPB.' } },

    { id: 'c2m4', ch: 2, title: 'Tingkat Kewaspadaan', desc: 'Pelajari cara membaca tingkat kewaspadaan kebakaran dan tindakan yang sesuai.',
      goal: 'Baca Papan Kewaspadaan, lalu pilih tindakan untuk 3 kondisi.',
      hint: 'Papan Kewaspadaan di ujung barat jalan tanah, dekat titik awal.',
      brief: 'Petugas memakai tingkat kewaspadaan untuk menentukan tindakan. Pelajari contohnya di papan.',
      steps: [
        V('s1', 'warnboard', 'Baca Papan Kewaspadaan', 20, ['Papan ini memakai contoh empat tingkat kewaspadaan: Rendah, Sedang, Tinggi, dan Ekstrem. Makin tinggi tingkatnya, makin kering cuacanya dan makin mudah api menyebar.', 'Nama dan batas tingkat resmi dapat berbeda antarinstansi. Ikuti informasi dari BMKG, pemerintah daerah, atau petugas setempat.']),
        QZ('s2', 'warnboard', 'Pilih tindakan untuk 3 kondisi', 80, [
          Q('Tingkat EKSTREM: sangat kering dan berangin. Tindakan paling tepat?',
            ['Tidak membuat api sama sekali, memantau, dan melaporkan tanda bahaya', 'Tepat! Pada kondisi ekstrem, sekecil apa pun api sangat berbahaya.'],
            ['Tetap membakar sampah, asal sebentar', 'Berbahaya! Api sebentar pun bisa tertiup angin dan membesar.'],
            ['Membuat api unggun besar di tepi hutan', 'Berbahaya! Itu sumber penyulut yang sangat berisiko.']),
          Q('Tingkat RENDAH: bolehkah membuka lahan dengan membakar?',
            ['Tetap tidak; membakar lahan berisiko dan umumnya dilarang', 'Tepat! Tingkat rendah bukan izin membakar. Ikuti aturan setempat.'],
            ['Boleh, karena tingkat sedang rendah', 'Kurang tepat. Kondisi bisa berubah cepat, dan membakar lahan umumnya dilarang.'],
            ['Boleh jika dilakukan diam-diam', 'Salah. Membakar diam-diam justru lebih berbahaya karena tidak ada yang mengawasi.']),
          Q('Kamu mencium bau asap saat tingkat TINGGI. Langkah pertama?',
            ['Menjaga jarak, mengamati arah asap dari tempat aman, lalu melapor', 'Tepat! Keselamatan dulu, lalu laporan yang jelas.'],
            ['Mencari sumber asap sampai ketemu', 'Berbahaya! Jangan mendekati sumber asap.'],
            ['Menunggu sampai asapnya besar dulu', 'Kurang tepat. Makin cepat dilaporkan, makin kecil kerusakannya.'])], { requires: ['s1'] })],
      edu: 'Makin tinggi tingkat kewaspadaan, makin ketat kita: tidak membuat api, aktif memantau, dan cepat melapor. Ikuti informasi resmi setempat.',
      tip: 'Pada tingkat kewaspadaan tinggi, jangan membuat api sama sekali dan cepat melapor.',
      verify: { note: 'Nama dan batas tingkat kewaspadaan di papan hanya contoh; cek istilah resmi sistem peringkat bahaya kebakaran BMKG/KLHK.' } },

    { id: 'c2m5', ch: 2, title: 'Tanda Awal Kebakaran', desc: 'Temukan tanda awal kebakaran dari jarak aman.',
      goal: 'Amati Asap Tipis di Semak dari cincin hijau, lalu pilih tindakan yang benar.',
      hint: 'Asap tipis ada di pojok barat laut. Berhenti di cincin hijau; jangan masuk cincin merah.',
      brief: 'Ada laporan warga tentang asap tipis di semak. Periksa DARI JARAK AMAN. Jangan mendekat.',
      steps: [
        OB('s1', 'smoke2', 'Amati asap tipis dari jarak aman', 40, ['Dari jarak aman, kamu melihat asap tipis naik dari semak kering. Belum tampak api besar, tetapi api kecil bisa membesar sangat cepat saat kemarau.', 'Kamu tidak perlu dan tidak boleh mendekat. Cukup amati dan catat.']),
        QZ('s2', 'smoke2', 'Pilih tindakan yang tepat', 60, [
          Q('Apa langkah yang paling tepat sekarang?',
            ['Tetap jauh, catat lokasi dan ciri asap, lalu segera laporkan ke petugas', 'Tepat! Laporan cepat dari jarak aman adalah cara terbaik membantu.'],
            ['Mendekat lalu menginjak-injak api kecil', 'Berbahaya! Api bisa membesar dan asapnya berbahaya. Jangan mendekat.'],
            ['Menunggu dulu untuk melihat apakah membesar', 'Kurang tepat. Menunda laporan membuat api makin sulit dikendalikan.'])], { chain: true, requires: ['s1'] })],
      edu: 'Asap tipis bisa jadi tanda awal kebakaran. Amati dari jarak aman, catat lokasi dan arah asap, lalu laporkan, jangan didekati.',
      tip: 'Saat melihat asap tipis: jangan mendekat, catat lokasinya, lalu laporkan.' },

    /* ================= BAB 3 — DAMPAK KARHUTLA ================= */
    { id: 'c3m1', ch: 3, title: 'Kabut Asap dan Kualitas Udara', desc: 'Pahami bagaimana asap karhutla memengaruhi kualitas udara.',
      goal: 'Baca Papan Kualitas Udara, bicara dengan Bu Rina, lalu jawab pertanyaan.',
      hint: 'Papan Kualitas Udara di timur laut (seberang sungai); Bu Rina di timur, utara jalan tanah.',
      brief: 'Asap karhutla tidak berhenti di lokasi api. Angin membawanya ke desa-desa jauh. Lihat dampaknya pada udara.',
      steps: [
        V('s1', 'airboard', 'Baca Papan Kualitas Udara', 20, ['Papan ini menampilkan contoh indeks kualitas udara dengan kategori: Baik, Sedang, Tidak Sehat, Sangat Tidak Sehat, dan Berbahaya. Saat asap karhutla tebal, kategori bisa naik ke tingkat tidak sehat atau lebih buruk.', 'Angka dan kategori resmi diumumkan pemerintah (di Indonesia dikenal sebagai ISPU). Selalu periksa informasi terbaru.']),
        V('s2', 'rina', 'Bicara dengan Bu Rina', 20, ['Bu Rina: “Beberapa hari ini langit kuning dan matahari tampak redup. Jarak pandang pendek, bau asap sampai ke dalam rumah.”', 'Bu Rina: “Anak-anak jadi lebih sering di dalam rumah. Semoga apinya cepat padam.”']),
        QZ('s3', 'rina', 'Jawab pertanyaan kualitas udara', 40, [
          Q('Papan menunjukkan kategori TIDAK SEHAT. Apa yang sebaiknya dilakukan warga?',
            ['Mengurangi aktivitas di luar ruangan dan mengikuti informasi serta anjuran resmi', 'Tepat! Pantau informasi resmi dan hindari paparan asap yang tidak perlu.'],
            ['Tetap berolahraga berat di luar seperti biasa', 'Kurang tepat. Aktivitas berat di luar membuat kita menghirup lebih banyak udara tercemar.'],
            ['Mengabaikannya karena asap hilang sendiri', 'Kurang tepat. Kita perlu menjaga diri selama kualitas udara buruk.'])], { requires: ['s1', 's2'] })],
      edu: 'Asap karhutla menurunkan kualitas udara dan jarak pandang di wilayah luas. Saat udara tidak sehat, kurangi aktivitas luar ruangan dan ikuti anjuran resmi.',
      tip: 'Saat udara tidak sehat, kurangi aktivitas di luar dan ikuti anjuran resmi.',
      verify: { note: 'Kategori ISPU dan istilahnya: cek Permen LHK tentang ISPU dan publikasi KLHK/BMKG terbaru.' } },

    { id: 'c3m2', ch: 3, title: 'Luka pada Lahan dan Satwa', desc: 'Lihat dampak kebakaran pada lingkungan dari jarak aman.',
      goal: 'Amati Lahan Bekas Terbakar dari jarak aman, lalu pilih jawaban tentang dampaknya.',
      hint: 'Lahan bekas terbakar ada di selatan, dekat sungai. Berhenti di cincin hijau; jangan masuk cincin merah.',
      brief: 'Ada lahan yang baru terbakar. Walau apinya tampak padam, tanahnya masih bisa berbahaya. Amati dari tepi saja.',
      steps: [
        OB('s1', 'burned', 'Amati lahan bekas terbakar dari jarak aman', 40, ['Dari tepi yang aman, kamu melihat pohon hangus, tanah gundul, dan abu. Lahan seperti ini kehilangan penutup tanah sehingga lebih mudah tererosi saat hujan.', 'Jangan masuk. Bara bisa tersisa di bawah permukaan (terutama di tanah gambut), dan tanah yang tampak padam masih bisa sangat panas.']),
        QZ('s2', 'burned', 'Jawab pertanyaan tentang dampak', 50, [
          Q('Apa dampak jangka panjang kebakaran terhadap lahan dan satwa?',
            ['Habitat hilang, tanah mudah tererosi, dan pemulihan memakan waktu lama', 'Tepat! Karena itu pencegahan jauh lebih baik daripada pemulihan.'],
            ['Tidak ada; hutan langsung pulih dalam seminggu', 'Salah. Pemulihan hutan butuh waktu sangat lama, bahkan bertahun-tahun.'],
            ['Tanah bertambah subur dan semua satwa kembali dalam sehari', 'Salah. Satwa kehilangan rumah dan makanan; kembalinya butuh waktu lama.'])], { chain: true, requires: ['s1'] })],
      edu: 'Kebakaran menghilangkan habitat, membuat tanah mudah tererosi, dan melepas karbon. Pemulihan butuh waktu lama; lahan bekas terbakar tidak boleh dimasuki sembarangan.',
      tip: 'Kebakaran merusak habitat dan tanah dalam waktu lama; lahan bekas terbakar tidak boleh dimasuki.' },

    { id: 'c3m3', ch: 3, title: 'Asap dan Kesehatan Warga', desc: 'Kenali dampak asap bagi kesehatan dan sikap yang tepat secara umum.',
      goal: 'Baca info di Pos Kesehatan, bicara dengan Pak Hadi, lalu jawab pertanyaan.',
      hint: 'Pos Kesehatan dan Pak Hadi ada di timur laut, seberang sungai.',
      brief: 'Asap bukan hanya mengganggu pandangan. Pelajari dampaknya pada kesehatan secara umum. Ingat: kamu bukan tenaga medis.',
      steps: [
        V('s1', 'clinic', 'Baca info di Pos Kesehatan', 20, ['Poster Pos Kesehatan: asap kebakaran dapat membuat mata perih, batuk, serta iritasi hidung dan tenggorokan. Anak-anak, lansia, ibu hamil, dan orang dengan penyakit pernapasan atau jantung lebih rentan.', 'Poster mengingatkan: ikuti anjuran tenaga kesehatan dan pemerintah setempat.']),
        V('s2', 'hadi', 'Bicara dengan Pak Hadi', 20, ['Pak Hadi (kader kesehatan): “Saat asap tebal, sebaiknya tetap di dalam ruangan dengan pintu dan jendela tertutup, kurangi aktivitas berat di luar, dan pantau pengumuman resmi.”', '“Kalau harus keluar, pakai masker sesuai anjuran petugas kesehatan. Soal keluhan atau obat, tanyakan kepada tenaga kesehatan, jangan menebak sendiri.”']),
        QZ('s3', 'hadi', 'Jawab pertanyaan kesehatan', 40, [
          Q('Seorang warga lansia mengeluh sesak napas saat asap tebal. Tindakan terbaik?',
            ['Segera menghubungi tenaga kesehatan atau layanan darurat; jangan mengobati sendiri', 'Tepat! Sesak napas perlu penanganan tenaga kesehatan.'],
            ['Menyuruhnya jogging supaya parunya kuat', 'Berbahaya! Aktivitas berat di udara berasap bisa memperburuk keadaan.'],
            ['Memberinya obat apa saja yang ada di rumah', 'Berbahaya! Jangan memberi obat tanpa petunjuk tenaga kesehatan.'])], { requires: ['s1', 's2'] })],
      edu: 'Asap dapat mengganggu pernapasan, terutama pada kelompok rentan. Saat asap tebal, kurangi aktivitas luar dan segera hubungi tenaga kesehatan bila ada keluhan berat.',
      tip: 'Saat asap tebal, kurangi aktivitas luar; keluhan berat ditangani tenaga kesehatan.',
      verify: { note: 'Seluruh pernyataan kesehatan (kelompok rentan, tindakan di dalam ruangan, masker): cek ke Kementerian Kesehatan RI/WHO sebelum publikasi.' } },

    { id: 'c3m4', ch: 3, title: 'Sekolah di Tengah Asap', desc: 'Lihat bagaimana asap mengganggu sekolah dan apa yang sebaiknya dilakukan.',
      goal: 'Baca Papan Sekolah, bicara dengan Bu Sari, lalu pilih tindakan yang tepat.',
      hint: 'Papan Sekolah dan Bu Sari ada di halaman depan SMA Negeri 1 Rimba Asri, di timur Desa Rimba Asri (ikuti jalan tanah ke timur melewati desa).',
      brief: 'Saat udara tidak sehat, sekolah harus mengambil keputusan penting demi keselamatan murid.',
      steps: [
        V('s1', 'school', 'Baca Papan Sekolah', 20, ['Papan sekolah memuat jadwal upacara, olahraga, dan kegiatan di halaman. Saat asap tebal, kegiatan di luar ruangan menjadi berisiko bagi murid.', 'Murid yang masih kecil lebih mudah terdampak asap.']),
        V('s2', 'sari', 'Bicara dengan Bu Sari', 20, ['Bu Sari (guru): “Pekan ini kami batalkan upacara dan olahraga di halaman. Banyak murid batuk dan orang tua cemas.”'], { requires: ['s1'] }),
        QZ('s3', 'sari', 'Pilih tindakan sekolah', 50, [
          Q('Udara tidak sehat. Apa yang sebaiknya dilakukan sekolah?',
            ['Membatalkan kegiatan luar ruangan, mengikuti arahan dinas pendidikan/pemerintah daerah, dan memberi kabar kepada orang tua', 'Tepat! Keselamatan murid diutamakan dan keputusan mengikuti arahan resmi.'],
            ['Tetap upacara dan olahraga seperti biasa', 'Kurang tepat. Kegiatan luar ruangan saat udara tidak sehat berisiko bagi murid.'],
            ['Menyuruh murid berlari mengelilingi halaman agar parunya kuat', 'Berbahaya! Aktivitas berat di udara berasap justru berisiko.'])], { chain: true, requires: ['s2'] })],
      edu: 'Saat udara tidak sehat, sekolah sebaiknya mengurangi kegiatan luar ruangan, mengikuti arahan resmi, dan mengabari orang tua.',
      tip: 'Saat udara tidak sehat, batalkan kegiatan luar ruangan dan ikuti arahan resmi.',
      verify: { note: 'Kebijakan sekolah saat udara tidak sehat (libur/belajar dari rumah) ditetapkan pemda/dinas pendidikan; cek aturan setempat.' } },

    { id: 'c3m5', ch: 3, title: 'Dampak pada Ekonomi', desc: 'Pelajari dampak ekonomi karhutla bagi warga dan daerah.',
      goal: 'Periksa Lapak Pasar, bicara dengan Pak Karto, lalu jawab pertanyaan.',
      hint: 'Lapak Pasar dan Pak Karto di tenggara, seberang jembatan.',
      brief: 'Kebakaran dan asap juga memukul dompet warga. Dengarkan cerita dari pasar.',
      steps: [
        V('s1', 'market', 'Periksa Lapak Pasar', 20, ['Lapak pasar tampak sepi. Saat asap tebal, pembeli berkurang, hasil kebun sulit dikirim, dan banyak orang menunda keluar rumah.', 'Kerugian ekonomi bukan hanya di lokasi kebakaran, tetapi juga di desa-desa yang terkena asap.']),
        V('s2', 'karto', 'Bicara dengan Pak Karto', 20, ['Pak Karto: “Dagangan saya sepi seminggu ini. Kebun tetangga juga rusak terkena api, panennya gagal.”'], { requires: ['s1'] }),
        QZ('s3', 'karto', 'Jawab pertanyaan ekonomi', 50, [
          Q('Manakah contoh dampak ekonomi karhutla?',
            ['Gagal panen, usaha sepi, biaya pengobatan, dan perjalanan terganggu', 'Tepat! Dampaknya meluas ke banyak sisi kehidupan warga.'],
            ['Semua usaha untung dan harga tanah selalu naik', 'Salah. Karhutla umumnya menimbulkan kerugian, bukan keuntungan.'],
            ['Tidak ada dampak ekonomi sama sekali', 'Salah. Banyak warga kehilangan pendapatan dan menanggung biaya tambahan.'])], { chain: true, requires: ['s2'] })],
      edu: 'Karhutla dan asap dapat menyebabkan gagal panen, usaha sepi, biaya kesehatan, serta gangguan perjalanan. Mencegah jauh lebih hemat daripada menanggung kerugian.',
      tip: 'Karhutla merugikan ekonomi warga: gagal panen, usaha sepi, biaya kesehatan.' },

    /* ================= BAB 4 — PENJAGA MASYARAKAT ================= */
    { id: 'friend', ch: 4, title: 'Sahabat Masyarakat', desc: 'Bicara dengan warga dan pilih tindakan pencegahan karhutla yang tepat.',
      goal: 'Bicara dengan warga dan pilih tindakan pencegahan karhutla yang tepat.', hint: 'Pak Joko ada di tenggara, seberang jembatan.',
      brief: 'Saatnya turun ke masyarakat. Seorang warga bernama Pak Joko sedang bingung membersihkan ladangnya.',
      steps: [
        V('talk', 'joko', 'Bicara dengan Pak Joko', 20, ['Halo, Penjaga Hutan! Musim kemarau begini ladang saya penuh semak dan jerami kering.']),
        QZ('answer', 'joko', 'Pilih tindakan pencegahan yang tepat', 80, [
          QF('Cara paling cepat membersihkannya katanya dibakar saja. Menurutmu, apa yang sebaiknya saya lakukan?',
            ['Bakar saja, asal ditunggui sebentar.', 'Hati-hati! Api kecil bisa cepat membesar tertiup angin, apalagi saat kemarau. Ditinggal sebentar saja bisa merambat ke hutan. Membuka lahan dengan membakar umumnya dilarang dan sangat berisiko.'],
            ['Bakar malam hari supaya tidak ketahuan.', 'Membakar diam-diam justru lebih berbahaya: tidak ada yang mengawasi jika api meluas, dan itu melanggar aturan. Api tidak boleh dipakai untuk membersihkan lahan.'],
            ['Jangan dibakar. Cacah atau kompos sisa tanaman; jika ada asap mencurigakan, lapor ke petugas.', 'Betul sekali! Mengomposkan atau memanfaatkan sisa tanaman jauh lebih aman. Kita juga bisa saling mengingatkan tetangga agar tidak membakar lahan.', true])],
          { chain: true, requires: ['talk'], after: ['Terima kasih, Penjaga Hutan! Saya akan ajak tetangga mengomposkan sisa tanaman, bukan membakarnya.'] })],
      edu: 'Jangan membuka atau membersihkan lahan dengan membakar. Cacah atau kompos sisa tanaman, dan laporkan asap yang mencurigakan.',
      tip: 'Membakar lahan, walau “sebentar” atau diam-diam, bisa merambat ke hutan. Pilih cara aman: cacah atau kompos sisa tanaman.' },

    { id: 'c4m2', ch: 4, title: 'Poster Peringatan', desc: 'Bantu warga membuat poster pesan pencegahan karhutla.',
      goal: 'Bicara dengan Dina, lalu pilih pesan terbaik di Papan Pengumuman.',
      hint: 'Dina ada di halaman depan SMA Negeri 1 Rimba Asri (timur, setelah desa); Papan Pengumuman di timur, dekat jalan tanah.',
      brief: 'Dina, murid sekolah, ingin membuat poster pencegahan karhutla untuk warga. Bantu dia memilih pesannya.',
      steps: [
        V('s1', 'dina', 'Bicara dengan Dina', 20, ['Dina: “Kak Penjaga Hutan! Aku mau bikin poster supaya warga tidak membakar lahan. Tapi aku bingung pesannya apa.”', 'Dina: “Nanti ke Papan Pengumuman di dekat jalan, ya. Pasangkan pesan yang paling tepat.”']),
        QZ('s2', 'poster', 'Pilih pesan poster yang tepat', 60, [
          Q('Pesan poster mana yang paling tepat dan jelas?',
            ['“Jangan bakar lahan! Lihat asap atau api: jauhi dan laporkan ke petugas atau 112.”', 'Tepat! Pesannya singkat, jelas, dan mengajarkan langkah aman.'],
            ['“Bakar saja sampahnya, cepat selesai!”', 'Salah. Pesan ini justru mendorong tindakan yang berbahaya.'],
            ['“Kalau ada api kecil, padamkan sendiri tanpa bantuan.”', 'Berbahaya! Memadamkan api sendirian berisiko. Pesan yang benar: jauhi dan laporkan.'])], { requires: ['s1'] })],
      edu: 'Pesan pencegahan yang baik itu singkat dan jelas: jangan bakar lahan; lihat asap atau api, jauhi, dan laporkan.',
      tip: 'Pesan pencegahan yang benar: jangan bakar lahan; lihat asap atau api, jauhi dan laporkan.' },

    { id: 'c4m3', ch: 4, title: 'Penyuluhan di Balai Desa', desc: 'Sampaikan pesan pencegahan karhutla kepada warga bersama Pak Lurah.',
      goal: 'Bicara dengan Pak Lurah, lalu pilih pesan inti penyuluhan (3 pertanyaan).',
      hint: 'Pak Lurah di ujung timur jalan tanah, dekat Papan Pengumuman.',
      brief: 'Pak Lurah mengundangmu menyampaikan penyuluhan singkat kepada warga.',
      steps: [
        V('s1', 'lurah', 'Bicara dengan Pak Lurah', 20, ['Pak Lurah: “Warga sedang berkumpul, Penjaga Hutan. Tolong sampaikan pesan pencegahan karhutla yang paling penting. Saya akan bantu menilai jawabanmu.”']),
        QZ('s2', 'lurah', 'Pilih pesan inti penyuluhan', 80, [
          Q('Pesan pertama untuk warga tentang membuka lahan?',
            ['Jangan membuka lahan dengan membakar; cari cara lain yang lebih aman dan ikuti aturan setempat', 'Tepat! Membakar lahan sangat berisiko dan umumnya dilarang.'],
            ['Boleh membakar asal luasnya kecil', 'Kurang tepat. Api kecil pun bisa merambat tertiup angin.'],
            ['Boleh membakar di musim kemarau karena abunya jadi pupuk', 'Salah. Kemarau justru waktu paling berbahaya untuk membakar.']),
          Q('Bagaimana mengajak warga ikut menjaga hutan?',
            ['Saling mengingatkan, melapor jika melihat asap atau api, dan menjaga lahan sekitar tetap bersih', 'Tepat! Menjaga hutan adalah tugas bersama.'],
            ['Menyerahkan semuanya kepada petugas tanpa ikut peduli', 'Kurang tepat. Petugas sangat terbantu oleh laporan warga.'],
            ['Menyalahkan satu orang tanpa mencari tahu', 'Kurang tepat. Fokuslah pada pencegahan dan pelaporan, bukan saling menyalahkan.']),
          Q('Warga melihat api kecil di kebun. Pesan keselamatan yang benar?',
            ['Utamakan keselamatan: menjauh, beri tahu warga lain, dan laporkan ke petugas; jangan menghadapinya sendirian', 'Tepat! Penanganan api adalah tugas petugas terlatih dengan peralatan lengkap.'],
            ['Semua warga menyerbu api dengan ember', 'Berbahaya! Mendekati api tanpa pelatihan dan peralatan bisa mencelakakan warga.'],
            ['Memotret dari dekat lalu mengunggah ke media sosial', 'Berbahaya dan tidak membantu. Menjauh dan melapor jauh lebih penting.'])], { chain: true, requires: ['s1'] })],
      edu: 'Pesan inti untuk warga: jangan membakar lahan, saling mengingatkan, dan jika ada api: menjauh, beri tahu warga lain, laporkan ke petugas.',
      tip: 'Pesan inti: jangan bakar lahan; jika ada api, menjauh dan laporkan ke petugas.',
      verify: { note: 'Aturan larangan membuka lahan dengan membakar (termasuk pengecualian kearifan lokal) dan praktik pemadaman oleh warga: cek UU PPLH, aturan daerah, dan arahan BNPB/KLHK.' } },

    { id: 'c4m4', ch: 4, title: 'Api Unggun yang Aman', desc: 'Beri saran kepada pendaki agar tidak menyebabkan kebakaran.',
      goal: 'Bicara dengan Bima, beri saran yang tepat, lalu periksa Bekas Api Unggun.',
      hint: 'Bima berada di sisi barat jembatan, dekat Bekas Api Unggun.',
      brief: 'Seorang pendaki bernama Bima berencana membuat api unggun. Bantu dia berkemah dengan aman.',
      steps: [
        V('s1', 'bima', 'Bicara dengan Bima', 20, ['Bima: “Halo! Malam ini dingin. Aku mau bikin api unggun di dekat semak ini supaya hangat. Boleh, kan?”']),
        QZ('s2', 'bima', 'Beri saran kepada Bima', 50, [
          Q('Saran terbaik untuk Bima?',
            ['Jangan menyalakan api di dekat semak kering. Hanya di tempat yang diizinkan, jauh dari bahan mudah terbakar, dan pastikan padam total sebelum pergi', 'Tepat! Api unggun hanya aman bila tempatnya benar dan padam total.'],
            ['Boleh, asal apinya besar supaya hangat', 'Berbahaya! Api besar justru lebih mudah menyebar.'],
            ['Boleh, dan tinggalkan saja saat tidur karena akan padam sendiri', 'Berbahaya! Api yang ditinggal bisa membesar atau bara menyulut semak.'])], { chain: true, requires: ['s1'] }),
        V('s3', 'campfire', 'Periksa Bekas Api Unggun', 20, ['Dari jarak aman, bekas api unggun yang ditinggalkan tampak tanpa asap maupun bara. Abu yang tampak dingin kadang masih menyimpan bara di dalamnya.', 'Jangan disentuh atau diinjak untuk memastikan. Jika ragu masih ada bara, jauhi dan laporkan ke petugas.'], { requires: ['s2'] })],
      edu: 'Api unggun hanya di tempat yang diizinkan, jauh dari semak kering, dan harus padam total sebelum ditinggal. Jika ragu masih ada bara, jauhi dan laporkan.',
      tip: 'Api unggun: tempat yang diizinkan, jauh dari semak kering, dan padam total sebelum ditinggal.' },

    { id: 'c4m5', ch: 4, title: 'Jangan Bakar Sampah', desc: 'Ajak warga mengelola sampah dan sisa tanaman tanpa dibakar.',
      goal: 'Periksa Tempat Kompos, bicara dengan Bu Rina, lalu beri saran yang tepat.',
      hint: 'Tempat Kompos di tenggara (ujung timur); Bu Rina di timur, utara jalan tanah.',
      brief: 'Banyak warga membakar sampah karena praktis. Tunjukkan cara yang lebih aman.',
      steps: [
        V('s1', 'compost', 'Periksa Tempat Kompos', 20, ['Tempat kompos sederhana ini mengubah daun, sisa sayur, dan sisa tanaman menjadi pupuk. Tidak perlu api, tidak ada asap.', 'Sampah yang tidak bisa dikompos dapat dipilah dan dikumpulkan untuk diangkut atau disetor ke bank sampah.']),
        V('s2', 'rina', 'Bicara dengan Bu Rina', 20, ['Bu Rina: “Tetangga saya biasa membakar tumpukan daun dan sampah di belakang rumah. Katanya paling cepat. Saya khawatir apinya merembet.”'], { requires: ['s1'] }),
        QZ('s3', 'rina', 'Beri saran untuk tetangga Bu Rina', 50, [
          Q('Apa saran terbaik untuk tetangga Bu Rina?',
            ['Kompos daun dan sisa sayur, pilah sampah lain untuk diangkut, dan jangan membakar', 'Tepat! Cara ini aman, bersih, dan bermanfaat.'],
            ['Bakar saja asal dijaga sambil sesekali masuk rumah', 'Berbahaya! Api yang ditinggal sebentar pun bisa merembet.'],
            ['Bakar tengah malam agar tidak mengganggu', 'Berbahaya! Tidak ada yang mengawasi jika api membesar.'])], { chain: true, requires: ['s2'] })],
      edu: 'Daun dan sisa sayur bisa dikompos; sampah lain dipilah dan diangkut. Membakar sampah di dekat lahan kering sangat berisiko.',
      tip: 'Jangan bakar sampah: kompos sisa tanaman, pilah dan angkut sampah lain.' },

    /* ================= BAB 5 — PELAPORAN AMAN ================= */
    { id: 'c5m1', ch: 5, title: 'Kenali Tanda Kebakaran', desc: 'Kenali tanda-tanda kebakaran hutan dan lahan sejak dini.',
      goal: 'Baca daftar tanda di Menara Pantau, lalu jawab 2 pertanyaan.', hint: 'Menara Pantau berada di tengah-selatan peta.',
      brief: 'Makin cepat tanda kebakaran dikenali, makin cepat petugas bergerak.',
      steps: [
        V('s1', 'tower', 'Baca daftar tanda di Menara Pantau', 20, ['Di Menara Pantau tertempel daftar tanda awal kebakaran: asap tipis atau tebal, bau asap, nyala api, semak atau tanah yang menghitam, dan langit yang tampak kuning atau jingga dari arah tertentu.', 'Dari menara, petugas mengamati dari jauh. Warga biasa cukup mengamati dari tempat aman dan tidak perlu mendekat.']),
        QZ('s2', 'tower', 'Jawab 2 pertanyaan tanda kebakaran', 80, [
          Q('Mana yang merupakan tanda kemungkinan kebakaran?',
            ['Asap naik dari semak dan tercium bau asap', 'Tepat! Asap dan bau asap adalah tanda yang perlu diwaspadai.'],
            ['Embun tipis di rumput pagi hari', 'Bukan. Embun adalah air yang menempel di rumput.'],
            ['Kupu-kupu beterbangan di bunga', 'Bukan. Itu pemandangan biasa di hutan.']),
          Q('Kamu melihat tanda-tanda itu. Sikap pertama yang benar?',
            ['Menjauh ke tempat aman, mengamati dari jauh, lalu melapor', 'Tepat! Keselamatan dulu, lalu laporan.'],
            ['Mendekat untuk memastikan', 'Berbahaya! Jangan mendekat ke asap atau api.'],
            ['Mengabaikannya', 'Kurang tepat. Tanda kecil bisa menjadi kebakaran besar.'])], { requires: ['s1'] })],
      edu: 'Tanda awal kebakaran: asap, bau asap, nyala api, tanah atau semak menghitam. Amati dari tempat aman dan laporkan, jangan didekati.',
      tip: 'Tanda kebakaran: asap, bau asap, nyala, tanah menghitam. Amati dari jauh dan laporkan.' },

    { id: 'c5m2', ch: 5, title: 'Tentukan Lokasi dengan Jelas', desc: 'Amati asap dari jarak aman dan tentukan lokasinya dengan patokan yang jelas.',
      goal: 'Amati Asap Tanah Gambut dari jarak aman, baca Patok Lokasi, lalu pilih deskripsi lokasi terbaik.',
      hint: 'Asap tanah gambut di pojok barat daya; Patok Lokasi di dekat Papan Informasi, utara jalan tanah.',
      brief: 'Petugas butuh lokasi yang jelas. Cari patokan, lalu tentukan arah dan perkiraan jarak.',
      steps: [
        OB('s1', 'peatsmoke', 'Amati asap tanah gambut dari jarak aman', 40, ['Dari jarak aman, kamu melihat asap tipis keluar dari tanah gambut tanpa nyala api yang jelas. Api di gambut bisa membara di bawah tanah dan tetap berbahaya.', 'Jangan mendekat atau menginjak tanahnya: permukaan bisa tampak utuh padahal di bawahnya sangat panas.']),
        V('s2', 'landmark', 'Baca Patok Lokasi', 20, ['Patok Lokasi: “Jalur Patroli Rimba Asri, Patok 02”. Patok seperti ini membantu petugas menemukan titik yang kamu laporkan.', 'Laporan yang baik memuat patokan (patok, jembatan, papan), arah, perkiraan jarak, dan ciri lahan.']),
        QZ('s3', 'landmark', 'Pilih deskripsi lokasi terbaik', 40, [
          Q('Mana deskripsi lokasi yang paling jelas untuk dilaporkan?',
            ['Sekitar 300 meter ke arah timur dari Patok 02 dekat jembatan, di lahan gambut, asap tipis', 'Tepat! Ada patokan, arah, jarak perkiraan, dan ciri lahan.'],
            ['Di hutan sana, ada asap', 'Kurang jelas. Petugas tidak bisa menemukan lokasi dari keterangan seperti itu.'],
            ['Di dekat rumah saya, kira-kira', 'Kurang jelas. Petugas tidak tahu di mana rumahmu dan seberapa dekat.'])], { requires: ['s1', 's2'] })],
      edu: 'Lokasi yang jelas memuat patokan (patok/jembatan/papan), arah, perkiraan jarak, dan ciri lahan. Asap di gambut tetap berbahaya walau tanpa api terlihat.',
      tip: 'Lokasi yang jelas: patokan, arah, perkiraan jarak, dan ciri lahan.' },

    { id: 'report', ch: 5, title: 'Laporan Bahaya', desc: 'Amati asap dari jarak aman, lalu pilih tindakan pelaporan yang benar.',
      goal: 'Amati asap dari jarak aman, lalu pilih tindakan pelaporan yang benar.',
      hint: 'Asap ada di utara jalan tanah. Amati dari samping dalam jarak aman (ikuti cincin hijau), jangan masuk cincin merah.',
      brief: 'Ada asap tebal di kejauhan. Amati dari jarak aman, lalu putuskan cara melaporkannya.',
      steps: [
        OB('observe', 'smoke', 'Amati asap dari jarak aman', 60, ['Dari jarak aman, kamu melihat kepulan asap tebal naik dari balik pepohonan. Mungkin ada kebakaran lahan.', 'Jangan mendekat. Api dan asap bisa menyebar cepat, dan asapnya berbahaya jika terhirup.']),
        QZ('report', 'smoke', 'Pilih tindakan pelaporan yang benar', 80, [
          QF('Apa yang sebaiknya kamu lakukan sekarang?',
            ['Mendekat dan memadamkan api sendiri dengan air.', 'Jangan! Kebakaran lahan menyebar cepat dan asapnya berbahaya. Memadamkan api adalah tugas petugas terlatih dengan peralatan lengkap. Tugasmu: menjauh dan melapor.'],
            ['Tetap di jarak aman, lalu laporkan ke petugas atau 112: lokasi, arah asap, perkiraan luas.', 'Tepat! Laporan yang jelas (lokasi, arah asap, perkiraan luas, waktu) membantu petugas bergerak cepat. Setelah melapor, tetap jauhi lokasi dan ikuti arahan petugas.', true],
            ['Abaikan saja, mungkin cuma asap biasa.', 'Asap yang sumbernya tidak jelas bisa jadi tanda kebakaran. Makin cepat dilaporkan, makin kecil kerusakannya. Lebih baik melapor walau ternyata bukan kebakaran besar.'])],
          { chain: true, requires: ['observe'], after: ['Laporanmu sudah diterima dan petugas yang menangani. Tetap jaga jarak dan jangan mendekat.'] })],
      edu: 'Lihat asap atau api: jauhi, amati dari jarak aman, laporkan (lokasi, arah asap, perkiraan luas), lalu ikuti arahan petugas.',
      tip: 'Saat melihat asap: jangan dekati dan jangan padamkan sendiri. Tetap di jarak aman lalu laporkan ke petugas atau 112 (lokasi, arah asap, perkiraan luas).',
      verify: { note: 'Rujukan nomor darurat 112 dan alur pelaporan karhutla: cek ke BNPB/Kominfo dan kontak resmi pemda setempat.' } },

    { id: 'c5m4', ch: 5, title: 'Siapa yang Harus Dihubungi?', desc: 'Pelajari pihak yang harus dihubungi saat melihat kebakaran.',
      goal: 'Baca daftar kontak di Pos Jaga, lalu jawab 2 pertanyaan.', hint: 'Pos Jaga (radio) di barat laut, dekat Petugas Rimba.',
      brief: 'Melapor ke pihak yang tepat menghemat waktu berharga.',
      steps: [
        V('s1', 'phone', 'Baca daftar kontak di Pos Jaga', 20, ['Di Pos Jaga terpasang daftar kontak darurat: nomor darurat nasional 112, petugas pemadam kebakaran atau penanggulangan karhutla setempat, BPBD, serta aparat desa dan petugas Pos Jaga.', 'Di bawahnya ada catatan: simpan nomor resmi di daerahmu dan pastikan nomornya masih berlaku.']),
        QZ('s2', 'phone', 'Jawab 2 pertanyaan pelaporan', 80, [
          Q('Kepada siapa laporan sebaiknya disampaikan?',
            ['Petugas berwenang: 112, pemadam/petugas karhutla setempat, atau aparat desa', 'Tepat! Petugas berwenanglah yang bisa bertindak cepat.'],
            ['Hanya bercerita kepada teman di media sosial', 'Kurang tepat. Teman tidak bisa memadamkan atau mengirim bantuan.'],
            ['Tidak perlu melapor; pasti sudah ada yang tahu', 'Kurang tepat. Jangan berasumsi; laporan tambahan sering membantu.']),
          Q('Apa yang sebaiknya dilakukan setelah melapor?',
            ['Tetap menjauh, mengikuti arahan petugas, dan menjawab pertanyaan petugas dengan tenang', 'Tepat! Ikuti arahan dan tetap aman.'],
            ['Kembali mendekat untuk memantau dari dekat', 'Berbahaya! Jangan kembali mendekati lokasi.'],
            ['Menutup telepon lalu melupakannya', 'Kurang tepat. Petugas mungkin perlu informasi tambahan darimu.'])], { requires: ['s1'] })],
      edu: 'Laporkan ke petugas berwenang (112, pemadam/petugas karhutla setempat, atau aparat desa). Setelah melapor, tetap menjauh dan ikuti arahan.',
      tip: 'Lapor ke petugas berwenang (112/pemadam/aparat desa), lalu tetap menjauh dan ikuti arahan.',
      verify: { note: 'Daftar pihak yang dihubungi dan penggunaan 112 untuk karhutla di daerah target: cek ke Kominfo, BNPB/BPBD, dan pemda setempat.' } },

    { id: 'c5m5', ch: 5, title: 'Laporan Lengkap dari Jarak Aman', desc: 'Amati api di kejauhan dari jarak aman, lalu susun laporan lengkap kepada petugas.',
      goal: 'Amati Api di Kejauhan dari cincin hijau, lalu susun laporan di Pos Jaga (4 pertanyaan).',
      hint: 'Api ada di pojok tenggara (seberang jembatan, jauh di selatan). Setelah itu kembali ke Pos Jaga di barat laut.',
      brief: 'Ada api di kejauhan! Tetap aman, amati sekilas dari jarak aman, lalu susun laporan lengkap.',
      steps: [
        OB('s1', 'flame', 'Amati api di kejauhan dari jarak aman', 40, ['Dari jarak aman, kamu melihat nyala api kecil di kejauhan dengan asap yang mulai naik. Api bisa membesar cepat karena angin.', 'Cukup amati dan catat: lokasi, arah asap, dan perkiraan luas. Segera mundur ke tempat aman dan pergi melapor.']),
        QZ('s2', 'phone', 'Susun laporan lengkap', 100, [
          Q('Hal pertama sebelum melapor?',
            ['Memastikan dirimu sudah berada di tempat aman', 'Tepat! Keselamatan pelapor yang utama.'],
            ['Mendekat agar bisa menjelaskan lebih detail', 'Berbahaya! Jangan mendekat demi laporan yang lebih detail.'],
            ['Memotret dari jarak sangat dekat', 'Berbahaya! Foto tidak sebanding dengan risikonya.']),
          Q('Informasi lokasi apa yang paling membantu petugas?',
            ['Patokan jelas, arah, dan perkiraan jarak', 'Tepat! Itu membuat petugas cepat menemukan lokasi.'],
            ['Hanya mengatakan “di hutan”', 'Kurang jelas. Hutan itu luas.'],
            ['Tidak perlu menyebut lokasi', 'Salah. Lokasi adalah informasi paling penting.']),
          Q('Selain lokasi, apa lagi yang perlu disampaikan?',
            ['Apa yang terlihat (api/asap), perkiraan luas, arah asap, dan nomor kontakmu', 'Tepat! Laporan lengkap membantu petugas menyiapkan bantuan.'],
            ['Hanya nama temanmu', 'Kurang tepat. Itu tidak membantu menangani kebakaran.'],
            ['Menebak penyebabnya dengan pasti tanpa melihat', 'Kurang tepat. Sampaikan apa yang kamu lihat, bukan dugaan.']),
          Q('Petugas meminta kamu menunggu di tempat aman. Apa yang kamu lakukan?',
            ['Menunggu di tempat aman dan mengikuti arahan', 'Tepat! Petugas yang akan menangani.'],
            ['Kembali mendekati api untuk menunjukkan jalan', 'Berbahaya! Cukup beri petunjuk lewat telepon.'],
            ['Mengajak warga lain mendekat untuk melihat', 'Berbahaya! Jangan membuat orang lain berada dekat bahaya.'])], { requires: ['s1'] })],
      edu: 'Laporan lengkap: pastikan dirimu aman, sebut lokasi dengan patokan, apa yang terlihat, perkiraan luas, arah asap, dan kontakmu. Lalu tunggu di tempat aman.',
      tip: 'Laporan lengkap: lokasi berpatokan, yang terlihat, perkiraan luas, arah asap, dan kontak; tetap di tempat aman.' },

    /* ================= BAB 6 — MISI PENYELAMATAN LINGKUNGAN ================= */
    { id: 'c6m1', ch: 6, title: 'Skenario: Pengunjung Merokok', desc: 'Ambil keputusan pada skenario pengunjung yang merokok di dekat semak kering.',
      goal: 'Baca Papan Skenario dan pilih tindakan yang tepat di 3 tahap.', hint: 'Papan Skenario di ujung barat, di selatan titik awal.',
      brief: 'Saatnya berlatih mengambil keputusan. Papan Skenario menyiapkan situasi; pilih tindakan paling aman.',
      steps: [QZ('s1', 'scenario', 'Putuskan tindakan di 3 tahap', 100, [
        Q('Skenario 1: seorang pengunjung merokok di tepi jalur, dekat rumput kering. Langkah pertama yang aman?',
          ['Menyapa sopan, mengingatkan bahaya merokok di area kering, dan meminta ia berhenti serta membuang puntung dengan aman', 'Tepat! Mengingatkan dengan sopan adalah cara aman dan efektif.'],
          ['Diam saja supaya tidak ribut', 'Kurang tepat. Mengingatkan dengan sopan bisa mencegah kebakaran.'],
          ['Merebut rokoknya dengan paksa', 'Kurang tepat. Tindakan kasar bisa memicu pertengkaran. Ingatkan dengan sopan.']),
        Q('Pengunjung membuang puntung ke rumput dan asap tipis mulai muncul. Apa yang kamu lakukan?',
          ['Menjauh ke tempat aman, mengajak pengunjung ikut menjauh, lalu melapor ke petugas', 'Tepat! Jangan mendekati asap; laporkan dari jarak aman.'],
          ['Mendekat dan menginjak-injak asap itu', 'Berbahaya! Api kecil bisa cepat membesar. Jangan mendekat.'],
          ['Pergi tanpa memberi tahu siapa pun', 'Kurang tepat. Tanpa laporan, api bisa membesar tanpa diketahui.']),
        Q('Setelah petugas datang, apa yang kamu lakukan?',
          ['Memberikan informasi lokasi dan kejadian, lalu mengikuti arahan petugas dari jarak aman', 'Tepat! Informasimu membantu petugas bekerja cepat.'],
          ['Menyalahkan pengunjung dengan suara keras', 'Kurang tepat. Fokus pada keselamatan dan informasi yang jelas.'],
          ['Masuk ke area untuk ikut memadamkan', 'Berbahaya! Biarkan petugas terlatih yang menangani.'])],
        { intro: ['Papan Skenario menampilkan situasi latihan: seorang pengunjung merokok di tepi jalur hutan, tidak jauh dari rumput kering saat kemarau.'] })],
      edu: 'Ingatkan dengan sopan, jauhi asap, laporkan, dan ikuti arahan petugas. Jangan memadamkan sendiri dan jangan beradu fisik.',
      tip: 'Ingatkan dengan sopan; jika ada asap, menjauh dan laporkan; biarkan petugas yang memadamkan.' },

    { id: 'c6m2', ch: 6, title: 'Skenario: Asap Mendekati Desa', desc: 'Latihan mengambil keputusan saat asap tebal mendekati permukiman.',
      goal: 'Bicara dengan Pak Lurah dan pilih tindakan yang tepat di 3 tahap.', hint: 'Pak Lurah di timur, dekat Papan Pengumuman.',
      brief: 'Pak Lurah menerima kabar: asap tebal bergerak ke arah desa. Bantu mengambil keputusan.',
      steps: [
        V('s1', 'lurah', 'Bicara dengan Pak Lurah', 20, ['Pak Lurah: “Asap tebal mendekat dari arah hutan. Warga mulai panik. Apa yang harus kita utamakan?”']),
        QZ('s2', 'lurah', 'Putuskan tindakan di 3 tahap', 100, [
          Q('Apa prioritas utama?',
            ['Keselamatan warga, terutama anak, lansia, dan yang sakit', 'Tepat! Nyawa dan kesehatan warga lebih penting dari barang.'],
            ['Mengamankan barang-barang dulu, warga belakangan', 'Salah. Keselamatan manusia selalu didahulukan.'],
            ['Menunggu sampai asap benar-benar sampai', 'Kurang tepat. Persiapan lebih awal menyelamatkan lebih banyak orang.']),
          Q('Dari mana warga mendapat arahan?',
            ['Menghubungi petugas berwenang dan mengikuti arahan atau jalur evakuasi yang ditetapkan', 'Tepat! Arahan resmi menghindari kepanikan.'],
            ['Setiap warga memutuskan sendiri-sendiri', 'Kurang tepat. Tanpa koordinasi, warga bisa saling berbenturan.'],
            ['Berjalan mendekat ke sumber asap untuk melihat', 'Berbahaya! Jangan mendekati sumber asap.']),
          Q('Seorang warga ingin menerobos asap tebal untuk mengambil ternak. Saran yang tepat?',
            ['Jangan menerobos; nyawa lebih penting. Sampaikan kepada petugas agar dibantu', 'Tepat! Jangan membahayakan diri demi barang atau ternak.'],
            ['Silakan, asal cepat', 'Berbahaya! Asap tebal bisa membuat kehilangan arah dan sulit bernapas.'],
            ['Ajak banyak orang ikut menerobos', 'Berbahaya! Itu melipatgandakan risiko.'])], { chain: true, requires: ['s1'] })],
      edu: 'Saat asap mendekat: utamakan keselamatan warga rentan, ikuti arahan petugas atau jalur evakuasi, dan jangan menerobos asap tebal.',
      tip: 'Saat asap mendekat: utamakan keselamatan, ikuti arahan petugas, jangan menerobos asap tebal.',
      verify: { note: 'Prosedur evakuasi dan koordinasi desa saat asap tebal: cek pedoman BNPB/BPBD dan rencana kontinjensi daerah.' } },

    { id: 'c6m3', ch: 6, title: 'Pulihkan Lahan Gambut', desc: 'Terapkan pengetahuan untuk memulihkan lahan gambut agar tidak mudah terbakar lagi.',
      goal: 'Periksa Kanal dan Persemaian, lalu pilih langkah pemulihan terbaik.', hint: 'Kanal di barat daya; Persemaian di selatan, sisi barat.',
      brief: 'Pencegahan terbaik adalah pemulihan. Bantu tim restorasi memulihkan lahan gambut.',
      steps: [
        V('s1', 'canal', 'Periksa sekat kanal', 25, ['Tim restorasi memasang sekat kanal dari papan kayu agar air tidak mengalir keluar dan permukaan air gambut naik kembali.', 'Gambut yang lebih basah jauh lebih sulit terbakar.']),
        V('s2', 'seedbed', 'Periksa Persemaian', 25, ['Di persemaian, bibit jenis tumbuhan asli setempat disiapkan untuk menutup lahan terbuka.', 'Pilih jenis yang sesuai dengan lahan dan libatkan warga agar tanaman dirawat setelah ditanam.']),
        QZ('s3', 'seedbed', 'Pilih langkah pemulihan terbaik', 50, [
          Q('Langkah pemulihan yang paling tepat?',
            ['Menyekat kanal untuk membasahi gambut, menanam jenis asli setempat, dan melibatkan warga merawatnya', 'Tepat! Itu pemulihan yang menjaga gambut tetap basah dan lestari.'],
            ['Mengeringkan gambut lebih dalam lalu membakar sisa tanaman', 'Berbahaya! Itu justru menyebabkan kebakaran.'],
            ['Membiarkan lahan terbuka tanpa tindakan', 'Kurang tepat. Lahan terbuka dan kering sangat rawan terbakar.'])], { requires: ['s1', 's2'] })],
      edu: 'Memulihkan gambut: sekat kanal agar tetap basah, tanam jenis asli setempat, dan libatkan warga untuk merawatnya.',
      tip: 'Pulihkan gambut: sekat kanal, tanam jenis asli, libatkan warga.',
      verify: { note: 'Metode restorasi gambut (sekat kanal, revegetasi jenis asli): cek ke BRGM sebelum publikasi.' } },

    { id: 'c6m4', ch: 6, title: 'Patroli Gabungan', desc: 'Patroli keliling dan putuskan status tiap titik yang diperiksa.',
      goal: 'Periksa 4 titik (Bekas Api Unggun, Semak Kering, Kanal, Menara Pantau) dan pilih tindakan di tiap titik.',
      hint: 'Titik ada di barat dan tengah peta; ikuti penanda kuning (!). Urutan bebas.',
      brief: 'Patroli gabungan bersama petugas: di tiap titik, putuskan apakah aman atau perlu tindakan.',
      steps: [
        QZ('s1', 'campfire', 'Titik 1: Bekas Api Unggun', 25, [Q('Titik 1: bekas api unggun terlihat abu saja, tanpa asap dan tanpa bara. Tindakan?',
          ['Catat sebagai aman dari jarak pandang; jangan disentuh. Jika ragu ada bara, jauhi dan laporkan', 'Tepat! Catat dan jangan menyentuh abu yang mungkin masih menyimpan bara.'],
          ['Injak-injak abunya sampai habis', 'Berbahaya! Abu bisa menyimpan bara panas.'],
          ['Tinggalkan tanpa mencatat apa pun', 'Kurang tepat. Catatan patroli membantu pemantauan.'])]),
        QZ('s2', 'drygrass', 'Titik 2: Semak Kering', 25, [Q('Titik 2: semak kering di tepi jalur. Tindakan?',
          ['Catat sebagai titik rawan dan ingatkan warga agar tidak ada api di dekatnya', 'Tepat! Pencegahan dimulai dari mengenali titik rawan.'],
          ['Bakar semaknya supaya bersih', 'Berbahaya! Membakar semak kering bisa memicu kebakaran besar.'],
          ['Abaikan saja', 'Kurang tepat. Titik rawan perlu dicatat dan diwaspadai.'])]),
        QZ('s3', 'canal', 'Titik 3: Kanal', 25, [Q('Titik 3: kanal dengan sekat papan, tetapi air tampak rendah. Tindakan?',
          ['Laporkan air yang rendah kepada tim restorasi agar gambut dijaga tetap basah', 'Tepat! Permukaan air gambut yang rendah meningkatkan risiko kebakaran.'],
          ['Bongkar sekatnya agar air cepat habis', 'Berbahaya! Air yang habis membuat gambut kering dan rawan terbakar.'],
          ['Tidak perlu dicatat', 'Kurang tepat. Kondisi air gambut penting dipantau.'])]),
        QZ('s4', 'tower', 'Titik 4: Menara Pantau', 25, [Q('Titik 4: dari menara tampak asap tipis di kejauhan. Tindakan?',
          ['Catat arah dan perkiraan jarak, tetap di tempat aman, lalu laporkan ke petugas', 'Tepat! Pengamatan dari jauh dan laporan jelas adalah tugas penjaga.'],
          ['Turun dan berlari ke arah asap', 'Berbahaya! Jangan mendekati asap.'],
          ['Menunggu sampai ada orang lain yang melapor', 'Kurang tepat. Jangan berasumsi orang lain sudah melapor.'])])],
      edu: 'Patroli yang baik: periksa, catat, dan ambil tindakan aman di tiap titik. Titik rawan dicatat, kondisi air gambut dipantau, tanda asap dilaporkan.',
      tip: 'Patroli: catat titik rawan, pantau air gambut, laporkan tanda asap dari tempat aman.' },

    { id: 'c6m5', ch: 6, title: 'Tantangan Akhir: Penjaga Hutan', desc: 'Gabungkan semua pelajaran: amati dari jarak aman, laporkan, lalu jawab ujian akhir.',
      goal: 'Amati asap dari jarak aman, susun laporan di Pos Jaga, lalu jawab ujian akhir dari Petugas Rimba.',
      hint: 'Asap di utara (cincin hijau), lalu Pos Jaga di barat laut, lalu Petugas Rimba.',
      brief: 'Ini tantangan terakhir! Buktikan bahwa kamu Penjaga Hutan yang siap bertugas.',
      steps: [
        OB('s1', 'smoke', 'Amati asap dari jarak aman', 40, ['Dari jarak aman, asap tampak kembali naik di balik pepohonan. Kali ini kamu tahu apa yang harus dilakukan: tetap jauh, catat, lalu laporkan.']),
        QZ('s2', 'phone', 'Susun laporan di Pos Jaga', 60, [
          Q('Susunan laporan yang paling tepat?',
            ['Lokasi dengan patokan, apa yang terlihat, perkiraan luas dan arah asap, serta nomor kontak', 'Tepat! Laporan lengkap dan jelas.'],
            ['“Ada asap,” lalu telepon ditutup', 'Kurang tepat. Petugas butuh lokasi dan rincian.'],
            ['Cerita panjang tentang kejadian minggu lalu', 'Kurang tepat. Fokus pada kejadian sekarang.']),
          Q('Setelah melapor, petugas meminta kamu menjauh. Kamu...',
            ['Menjauh dan memberi tahu warga sekitar agar ikut menjauh dengan tenang', 'Tepat! Keselamatan bersama.'],
            ['Mendekat untuk membantu', 'Berbahaya! Ikuti arahan petugas.'],
            ['Pergi tanpa memberi tahu siapa pun', 'Kurang tepat. Warga sekitar perlu tahu agar aman.']),
          Q('Apa prinsip emas Penjaga Hutan?',
            ['Lihat asap atau api → jauhi → laporkan → ajak orang lain peduli', 'Tepat! Itu rangkuman semua yang kamu pelajari.'],
            ['Lihat api → padamkan sendiri secepatnya', 'Berbahaya! Itu bukan tugas kita.'],
            ['Lihat asap → abaikan', 'Salah. Jangan abaikan tanda bahaya.'])], { requires: ['s1'] }),
        QZ('s3', 'officer', 'Jawab ujian akhir', 100, [
          Q('Ujian 1: apa fungsi hutan yang benar?',
            ['Menyerap karbon, menahan air dan tanah, serta menjadi rumah satwa', 'Benar!'],
            ['Hanya sebagai tempat membuang sampah', 'Salah.'],
            ['Membuat tanah mudah longsor', 'Salah.']),
          Q('Ujian 2: agar gambut tidak mudah terbakar, gambut harus...',
            ['Tetap basah', 'Benar!'],
            ['Dikeringkan', 'Salah. Gambut kering mudah terbakar.'],
            ['Dibakar sedikit demi sedikit', 'Salah. Membakar gambut sangat berbahaya.']),
          Q('Ujian 3: mana sumber penyulut yang bisa dicegah?',
            ['Puntung rokok dan pembakaran sampah atau lahan', 'Benar!'],
            ['Embun dan hujan', 'Salah.'],
            ['Air kanal', 'Salah.']),
          Q('Ujian 4: saat udara tidak sehat akibat asap, sebaiknya...',
            ['Kurangi aktivitas luar ruangan dan ikuti anjuran resmi; keluhan berat ke tenaga kesehatan', 'Benar!'],
            ['Berolahraga berat di luar', 'Salah.'],
            ['Mengobati sendiri dengan obat apa saja', 'Salah.']),
          Q('Ujian 5: kamu melihat api besar. Langkah yang benar?',
            ['Menjauh ke tempat aman lalu melapor ke petugas atau 112', 'Benar!'],
            ['Mendekat dan memadamkan sendiri', 'Salah. Berbahaya.'],
            ['Mengamati dari dekat sambil merekam', 'Salah. Berbahaya.'])], { requires: ['s2'] })],
      edu: 'Kamu telah menyelesaikan seluruh kampanye: kenali hutan, waspadai api, pahami dampak, ajak warga, lapor dengan aman, dan ambil keputusan tepat. Tetap jaga hutan!',
      tip: 'Ulangi prinsip emas: lihat asap atau api → jauhi → laporkan → ajak orang lain peduli.' }
  ];

  M.CampaignData = { chapters, missions };
})(window.MPH);
