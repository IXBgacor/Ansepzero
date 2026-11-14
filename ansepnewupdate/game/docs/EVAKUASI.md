# Sistem evakuasi (js/evac.js) — Misi Terakhir "Evakuasi Desa"
**Prinsip:** keselamatan dan evakuasi; pemain tidak memadamkan api dan tidak diminta mendekatinya. Dinding api (radius 88 px) memblokir pemain dan warga; panduan/tanda selalu mengarah menjauhi api.
| # | Objective | Syarat selesai | Poin |
|---|---|---|---|
| 1 | Temui Petugas Lapangan | bicara dengan e_officer → status darurat + cutscene awal | 5 |
| 2 | Pelajari jalur evakuasi | jawab benar kuis di Peta Jalur Evakuasi | 10 |
| 3 | Bantu warga menemukan jalur aman | bicara dengan 5 warga (v1–v5); mereka berjalan sendiri | 20 |
| 4 | Arahkan warga ke titik kumpul | 5 warga tiba (counter n/5) | 15 |
| 5 | Pastikan yang butuh bantuan tidak tertinggal | Mbah Karsi & Dewi mengikuti pemain sampai area titik kumpul; Bu Lastri dibujuk tidak kembali mengambil barang (kuis) | 30 |
| 6 | Laporkan area desa sudah dievakuasi | bicara dengan Petugas Posko setelah #4 dan #5 | 10 |
| 7 | Tunggu arahan petugas | berdiri di titik kumpul 4 detik → cutscene besar | 10 |
Jawaban salah mengurangi 3 poin per salah (minimal setengah poin objective). Bintang: 3 bila skor misi ≥ 70% dan tanpa dipotong berlebih; aturan bintang v0.5 tidak berubah.
**AI warga:** jalur BFS 4-arah antar petak bebas + penghalusan (string-pull) dengan hitbox kaki; warga biasa `walk` ke slot; lansia/anak `follow` (menghitung ulang jalur ke pemain tiap 0,6 dtk, kecepatan 34/46 px/dtk < pemain 52) lalu `walk` ke slot saat masuk area titik kumpul. Progres (`talked`, `safe`) disimpan di `mph.v05` (`evac`).
**Pesan edukatif:** dialog petugas/warga/ending menekankan "nyawa adalah prioritas, barang dapat diganti", tidak kembali ke rumah/area bahaya, ikuti arahan petugas, bantu anak/lansia, tidak panik.
