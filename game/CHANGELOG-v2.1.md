# Catatan perubahan Alpha V2.1 (dari V2.0)

## Bug diperbaiki
- **Celah rumput di bawah atap** pada puskesmas, pos pemadam, pasar, dan semua gedung dari generator gedung (baris bayangan semi-transparan 2 px tepat di bawah atap). Dinding kini mulai dari bibir atap; diuji: nol piksel transparan pada sprite gedung besar.

## Tata letak GUI (mengikuti referensi & coretan)
- Panel misi kiri atas **dipindah ke tengah bawah** (ringkas: bab/misi, skor, nama misi, tujuan, progres). Di mode PC tetap di kiri atas agar tidak menabrak bilah petunjuk keyboard.
- Tiga tombol kanan atas (suara, layar penuh, jeda) **diganti satu ikon gear** yang membuka menu berisi ketiganya.
- **Minimap diperbesar** (±140 px di HP lanskap, sebelumnya ±104 px), diletakkan di bawah ikon gear.
- **Tombol INTERAKSI & LARI diperkecil**; label target diperkecil dan tanpa awalan "[INTERAKSI]". Tetap bertumpuk vertikal.
- Pesan/popup bawah digeser naik agar tidak menabrak panel misi.

## Fitur baru
- **Zoom**: tombol + / −, cubit dua jari, roda mouse, tombol keyboard +/−. Zoom memakai langkah skala bilangan bulat sehingga pixel art tetap tajam. Level tersimpan. Skala dasar dibuat lebih halus (VIEW_TARGET_H 170 → 210): lebih banyak peta terlihat dan piksel lebih rapat.
- **Peta besar**: zoom 1×–3,2× (tombol + / −) dan bisa digeser; penanda kendaraan ditambahkan + legenda.
- **Kendaraan yang bisa dikemudikan**: 2 traktor (dekat ladang), ambulans (parkir puskesmas), mobil pemadam (depan garasi pos pemadam). Sprite 4 arah (tampak atas/samping), tabrakan memakai grid petak (air, bangunan, pohon, NPC tetap menghalangi), LARI = ngebut dan menyalakan sirene + lampu rotator untuk ambulans/mobil pemadam, suara mesin, pemain otomatis turun saat cutscene, kendaraan parkir disembunyikan selama cutscene.

## Belum selesai (jujur)
- **"HD" sebatas skala render lebih halus + zoom tajam**; aset sprite tetap pixel art 16 px (belum digambar ulang beresolusi tinggi).
- Kendaraan belum punya **misi** khusus; posisi kendaraan tidak disimpan ke save; tidak ada tabrakan antar-kendaraan/NPC berjalan (NPC bersifat petak padat); traktor belum mengolah lahan.
- Tidak ada mekanik selang/penyemprotan dari mobil pemadam yang dikemudikan.
- Seluruh daftar "Belum selesai" di `CHANGELOG-v2.0.md` (state kebakaran 4 tingkat, pos kesehatan menurut status darurat, NPC berjalan, interior, misi baru) **masih berlaku**.
- Belum diuji di perangkat Android sungguhan (hanya emulasi sentuh Chromium headless, DPR 2,6); gestur cubit diuji dengan event pointer sintetis.
