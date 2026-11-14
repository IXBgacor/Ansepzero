# Catatan perubahan Alpha V2.0 (dari Alpha 1.0)

## Bug diperbaiki
- **Sekolah: rumput menembus dasar gedung.** Sprite gedung punya 5 px terbawah transparan sehingga ground rumput terlihat di bawah dinding. Dasar kini solid (plinth batu) dan seluruh jejak gedung dipaving (`sprites_v10.js`, `school.js`).
- **Teks dialog NPC sekolah tidak pernah tampil** (data `School.TEXT` tidak terhubung ke `Content.build`; NPC hanya mengucap kalimat generik). Kini terhubung lewat `Region.init()`.
- Label "Dekati NPC atau objek" & tombol INTERAKSI selalu memenuhi layar → kini kontekstual.
- Dialog menutup ±40% layar & menimpa NPC yang diajak bicara → panel pendek di bawah.
- Truk pemadam pada cutscene final muncul dari tepi peta barat → kini keluar dari garasi Pos Pemadam dan mengikuti jalan nyata.

## Fitur baru
- **Dunia 108×56** (tambahan 20 baris di selatan; wilayah lama tidak berubah sehingga koordinat misi lama tetap valid). Konfigurasi pusat: `js/region.js` (objek `L`) dan `js/places.js`.
- **Kawasan selatan**: Jalan Lintas Selatan, jalan evakuasi diperpanjang, 3 lorong + 16 rumah/warung (3 model rumah, rumah panggung, warung), **Pasar Desa** (balai pasar, 14 lapak 3 varian, parkir motor, papan, lampu, bongkar muat, 4 pedagang), **Puskesmas** (+ ambulans, area kendaraan darurat, perawat, dokter), **Pos Pemadam** (2 pintu garasi, apron, peralatan, 2 petugas), **Pos Kesehatan Darurat** di sebelah Titik Kumpul (tenda medis, tempat tidur, meja, petugas), **Lapangan Desa**.
- **Lahan gambut**: tanah gambut basah/kering (2 tile × 3 variasi), genangan, kanal drainase dengan tepian jelas + 2 kolam penampung, 2 jembatan + jembatan jalan di atas sungai, kayu tumbang, vegetasi rawa, pintu air, pos pantau, 3 titik edukasi (papan gambut, pemeriksaan kanal, pemantau gambut).
- **Minimap bundar** (mengikuti pemain, arah hadap, target misi aktif, area api, penanda di tepi untuk target di luar jendela) dan **Peta Desa** penuh: fasilitas berlabel, misi aktif/selesai/api, legenda, ketuk penanda → nama, tujuan, status, jarak & arah. Peta dasar digambar sekali (offscreen).
- **GUI**: judul/versi dipindah dari HUD; panel misi lebih kecil; tombol INTERAKSI di atas LARI (besar, responsif tinggi layar).
- **Dialog**: panel bawah ≤34% tinggi layar (pilihan di kolom kanan), teks muncul bertahap (ketuk menuntaskan, ketuk lagi melanjutkan), footer redundan disembunyikan.
- **Interaksi**: target di depan pemain diutamakan; label/tombol tersembunyi saat tidak ada target.
- **Cutscene final**: 2 truk keluar dari garasi → Jalan Lintas → jalan evakuasi → siaga di ujung utara; petugas turun dan menuju tepi area api (BFS); kamera mengikuti truk.

## Pembaruan lanjutan (umpan balik layout)
- **Bug atap:** garis semi-transparan di bawah atap membuat rumput terlihat di antara atap dan dinding (Pos Pemadam, Puskesmas, pasar, dan gedung sekolah). Dinding kini diisi mulai dari bibir atap; ada uji piksel otomatis.
- **Layout HUD sesuai referensi:** panel misi dipindah ke tengah bawah (ringkas; mode PC tetap kiri atas), tiga tombol kanan atas diganti **ikon roda gigi** (menu Suara / Layar Penuh / Jeda), minimap diperbesar (≈34% tinggi layar), tombol INTERAKSI & LARI dan label interaksi diperkecil (label tanpa awalan “[INTERAKSI]”).
- **Tampilan lebih tajam & zoom:** target tinggi pandang 170 → 210 piksel logis (skala piksel perangkat 6 → 5 pada HP umum: lebih banyak detail & area terlihat) dan **zoom** berupa langkah skala bilangan bulat (pixel art tetap tajam): tombol + / −, cubit dua jari, roda mouse, tombol keyboard + / −; level disimpan. **Peta desa** juga bisa di-zoom (hingga 3×) dan digeser.
- **Kendaraan yang bisa dikendarai:** traktor (2), ambulans, mobil pemadam — sprite 4 arah tampak atas/samping, lampu rotator & sirene, tabrakan memakai grid peta, tombol Naik/Turun lewat sistem interaksi, penanda di peta desa.

## Pembaruan v3.1
- **Sepeda pribadi sejak awal game:** tombol SEPEDA (atau B) naik/turun di mana saja. Kecepatan ≈1,9× jalan kaki, LARI saat bersepeda = kayuh cepat (+28%). Air/bangunan tetap penghalang. Otomatis turun saat berinteraksi dengan NPC/objek, naik kendaraan, atau cutscene. Petunjuk singkat muncul maksimal 2× per perangkat. Mode & posisi tidak disimpan.
- **Minimap dipindah ke sebelah ikon roda gigi** (satu baris, rata atas) sehingga kolom kanan di bawah roda gigi bebas.
- **Tombol zoom + / − dikecilkan** (26 px) dan ditempatkan di sisi kiri minimap.

## Pembaruan v3.2 — sepeda digambar ulang + animasi
- Tampak samping: dua roda berjari-jari (berputar), rangka merah (tabung jok, atas, bawah, garpu), jok, stang, engkol; pengendara duduk condong ke depan dengan ransel, lengan memegang stang.
- **Animasi kayuh 8 bingkai per putaran engkol:** kaki mengayuh dengan IK dua tulang (paha-betis mengikuti pedal, lutut menekuk ke depan), badan sedikit berayun, alur ban bergerak di tampak depan/belakang. Kecepatan animasi mengikuti jarak tempuh (kayuh cepat saat LARI); berhenti = diam di bingkai awal.
- Tampak depan dan belakang digambar terpisah (belakang: ransel & rambut).

## Pembaruan v3.3 — Helikopter Damkar
- **Helikopter damkar yang bisa dikendarai**, terparkir di **helipad** baru (paving + lingkaran + huruf H) di timur Pos Pemadam; ada di peta desa sebagai kendaraan dan tempat “Helipad Damkar”.
- Sprite tampak atas 4 arah, baling-baling berputar (4 bingkai), tangki air di bawah perut, bayangan di tanah yang mengecil/memudar saat naik; saat terbang digambar di atas segalanya.
- **Penerbangan:** gerak joystick = lepas landas (±0,9 dtk), lalu melayang saat joystick dilepas; terbang bebas melewati bangunan/air/pohon (hanya tepi peta yang membatasi); LARI = ngebut ×1,5; suara baling-baling (sample `heli-loop`).
- **Mendarat:** tombol berubah “Mendarat”; pendaratan **ditolak** di atas air/bangunan/pohon (helikopter naik lagi + petunjuk), berhasil di tanah lapang; setelah menyentuh tanah tombol menjadi “Turun”. Cutscene saat terbang memaksa pendaratan di tempat bebas terdekat.

## Pembaruan v4.0 — Misi Kendaraan
- **5 misi, satu per kendaraan** (modul `js/vmission.js`, terpisah dari 30 misi kampanye): traktor ×2 (bajak ladang, petak yang dibajak tampak berubah), mobil pemadam (3 api tepi jalan, semprot otomatis saat berhenti dekat api), helikopter (3 hotspot gambut; **tangki kecil → wajib isi ulang di atas air**), ambulans (jemput 3 warga → antar ke Puskesmas).
- **Dialog konfirmasi sebelum misi** (“Mulai misi / Tidak, hanya berkendara”) saat naik kendaraan; tidak muncul lagi bila misi itu sedang berjalan; misi yang sudah selesai ditawarkan “Ulangi misi”; peringatan bila misi lain akan dibatalkan.
- **Panel misi ringkas** (judul, tujuan, bar progres, petunjuk); penanda target kuning di minimap & peta desa; saat turun dari kendaraan misi, panel & peta menunjuk kendaraannya.
- **Penyimpanan:** misi selesai disimpan (`mph.vm`). Bug ditemukan & diperbaiki saat uji: `Store` hanya menyimpan string, bukan objek.
- **Perbaikan dialog konfirmasi:** ikon, teks tidak tertutup toast, deskripsi dipersingkat agar muat panel dialog yang pendek.
- Efek visual: api berkobar dengan asap & bar padam, semprotan air (busur dari selang / jatuh dari helikopter), percikan isi ulang, warga dengan cincin & bar jemput, zona antar Puskesmas.

## Pembaruan v4.1 — panel Bab & Misi bisa dikecilkan
- Tombol “—” di pojok kanan atas panel Bab & Misi (tengah bawah) mengecilkannya jadi **chip satu baris** (“Misi n/30 · Objective aktif”); ketuk chip untuk membuka lagi. Pilihan diingat selama sesi (sessionStorage). Chip tidak menutupi joystick, tombol LARI/SEPEDA, atau minimap (diuji). Di mode PC berlaku sama di kiri atas.

## Catatan jujur tentang “HD”
Aset gambar tetap pixel art 16 px (tidak digambar ulang beresolusi tinggi). “Lebih HD” dicapai lewat kepadatan piksel yang lebih halus + zoom tajam, bukan seni baru.

## Belum selesai (jujur)
- **Sistem state kebakaran 4 tingkat & efek hutan terbakar baru**: tidak diubah; memakai sistem Alpha 1.0 (`worldstate.js` fireOut, `final.js` pohon hangus). Belum ada state "sedang ditangani" per titik.
- **Pos kesehatan darurat tidak berubah menurut status darurat** (selalu terlihat); cutscene evakuasi tidak diubah.
- **NPC warga berjalan/aktivitas harian** (kembali ke rumah, berkumpul) tidak ditambahkan; NPC baru statis.
- **Interior bangunan**, **zoom/drag peta**, **pilihan percabangan baru**, **misi baru** di kawasan gambut/pasar/kesehatan (hanya titik edukasi, bukan misi bertahap).
- **Blokir interaksi menembus dinding** (NPC/objek sendiri solid; tidak ditambah ray-check agar tidak memutus misi).
- **Pengujian di perangkat Android sungguhan** belum dilakukan — hanya emulasi sentuh di Chromium headless. `tests/uji-v06.py` (usang sejak Alpha 1.0) tetap 3 gagal + 1 timeout seperti pada Alpha 1.0 asli.
- Misi kendaraan **tidak memengaruhi** progres/skor kampanye dan tidak mengubah `worldstate` (api misi kendaraan adalah titik tersendiri, bukan hotspot kampanye); belum ada hadiah/skor khusus.
- Titik api/warga misi kendaraan tetap & tidak acak; tidak ada batas waktu.
- Kendaraan: tidak ada interaksi dengan NPC (tak bisa menabrak/melukai), tidak ada misi yang memakainya, posisi tidak disimpan.
- Tidak ada pengukuran FPS di HP; di headless biaya render peta 0,8–0,9 ms/frame (setara Alpha 1.0).
