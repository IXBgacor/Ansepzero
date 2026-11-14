# Misi Penjaga Hutan — Beta v0.6

Game edukasi 2D pixel-art (HTML5 Canvas, tanpa dependensi, tanpa langkah build) tentang pencegahan karhutla dan keselamatan saat evakuasi. **Dibangun di atas v0.5⁴** (superset dari v0.5²): seluruh fitur lama dipertahankan — 30 misi/6 bab, kuis, skor, bintang, nama pemain, sertifikat, pause, fullscreen, analog Android, keyboard/mouse PC, kamera geser, BGM/SFX, cutscene bab, tanda tempat interaksi, localStorage.
Dokumen: `CHANGELOG.md` · `KONTROL.md` · `docs/MAP-DESA.md` · `docs/EVAKUASI.md` · `docs/ASET.md` · `AUDIO-ASET.md` · `STATUS-TESTING.md`.

## Menjalankan
Sajikan folder lewat server statis (`python3 -m http.server 8000` → `http://localhost:8000/`) atau hosting statis. Dari `file://` game tetap jalan, tetapi aset WAV tidak dapat dimuat (SFX NPC memakai bunyi sintesis cadangan).

## Prioritas v0.6: dunia → desa → evakuasi → cutscene → UI → sertifikat → optimasi
1. **Dunia lebih besar & hidup.** Peta 36×26 → **64×36 petak**. Wilayah lama tidak berubah (dibangkitkan dengan RNG yang sama; hanya gerbang timur dibuka dan area api dipindah). Ditambah: jalan tanah ke timur, jalur hutan selatan, hutan barat daya, ladang, jerami, dan **Desa Rimba Asri**.
2. **Desa nyata** (x 36–62): 10 rumah (3 model), balai desa, plaza berpaving dengan kios, sumur, lampu, bangku, pagar, ladang, jalan desa, papan informasi, kentongan, papan pengumuman, 5 warga + lansia + anak + ibu, Pak Lurah, dan Petugas Lapangan. Warga memberi info edukatif singkat (jalur evakuasi, jangan panik, ikuti petugas, bantu anak/lansia, jangan kembali demi barang). Tidak ada instruksi mendekati/memadamkan api.
3. **Sistem evakuasi.** Titik Kumpul (tenda, bendera, papan) di selatan; jalur panah hijau di tanah dari plaza ke titik kumpul; batas area aman putus-putus; warga bergerak lewat jalur BFS; counter objective; lihat `docs/EVAKUASI.md`.
4. **Misi Terakhir — Evakuasi Desa** (7 objective, 100 poin): temui petugas → pelajari jalur → bantu warga → arahkan ke titik kumpul → pastikan lansia/anak/warga yang butuh bantuan tidak tertinggal (termasuk dialog "barang atau keselamatan?") → lapor → tunggu arahan. Pemain tidak pernah mendekati api (dinding api tak terlihat + panduan).
5. **Cutscene baru** (semua dapat dilewati): masuk desa (sekali), awal darurat (alarm, asap, kentongan, warga bersiap), dan **cutscene besar** ±36 dtk setelah evakuasi: desa dari kejauhan → warga berkumpul & petugas memeriksa → mobil pemadam tiba → helikopter dari kejauhan → petugas profesional bekerja dari area aman → helikopter menjatuhkan air → api & asap berkurang → pemain berdiri bersama warga → dialog penutup ("Saat keadaan darurat, nyawa adalah prioritas. Barang dapat diganti, tetapi keselamatan manusia tidak.") → ending.
6. **GUI baru.** Panel/tombol pixel-art bergaya hutan, ikon pixel (digambar dari kode) menggantikan seluruh emoji, HUD ringkas, tombol sentuh besar, animasi UI ringan (langkah, bukan halus berat), dialog maks ±46% tinggi layar. **Panel misi bisa di-minimize** (tombol kecil; saat kecil hanya "Misi n/30 · Objective aktif"; ketuk untuk membuka; status tersimpan selama sesi). Prompt interaksi: PC `[E] Bicara: …`, Android `[INTERAKSI] Bicara: …`; analog & tombol Android tersembunyi di mode PC.
7. **Sertifikat PDF sungguhan.** Tombol **DOWNLOAD SERTIFIKAT PDF** membuat berkas PDF A4 lanskap langsung di browser (tanpa dialog cetak): nama, skor akhir, bintang, tanggal, nomor unik, ringkasan penyelesaian, pesan keselamatan, dan pernyataan bahwa ini bukan sertifikat resmi pemerintah. Tombol "Cetak (Simpan sebagai PDF)" tetap ada sebagai cadangan.
8. **Progres & migrasi.** Semua kunci localStorage lama tetap dipakai. Save v0.5² yang belum tamat: nama, 30 misi, dan skor tetap; hanya objective Misi Terakhir dimulai ulang (objective lama sudah tidak ada). Save yang sudah tamat tetap tamat dengan sertifikat dan nomor aslinya.
9. **Optimasi Android.** Peta digambar ke satu layer canvas (sekali), objek dikulling per frame (459 objek), partikel dibatasi (≤ 9 titik per semprotan, ≤ 7 awan per efek), tanpa gambar/font eksternal (semua sprite dari kode), audio: satu elemen BGM + SFX dimuat malas, loop SFX satu instance per nama, tidak ada filter berat. Di sandbox headless 60 fps; **belum diukur di perangkat Android nyata**.

## Struktur kode (baru di v0.6)
```
js/village.js            tata letak desa + builder rumah/balai/tenda/...
js/pois_v06.js           titik interaksi desa (petugas, papan, warga)
js/evac.js               sistem evakuasi (AI warga, dialog, jalur, objective)
js/rescue_cutscenes.js   cutscene desa / darurat / pemadam + helikopter
js/gui06.js              ikon pixel, minimize panel misi, pengganti emoji
js/certpdf.js            pembuat PDF sertifikat (canvas -> JPEG -> PDF)
js/sprites_v06.js        sprite desa, warga, helikopter, ikon GUI
css/v06.css              tema GUI baru (menimpa style.css)
js/map.js, final.js, game.js, world.js  diperluas (map 64x36, alur evakuasi, culling objek besar, NPC bergerak)
tools/gen_audio.py       pembuat seluruh aset WAV (sintesis, CC0)
```
