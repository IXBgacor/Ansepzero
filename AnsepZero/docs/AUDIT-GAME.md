# Audit Game: Misi Penjaga Hutan v2.1 Alpha (hasil pemeriksaan nyata ZIP)

## Struktur
- Satu halaman statis: `index.html` (50 tag script, tanpa build, tanpa dependensi eksternal), `css/` (3 berkas), `js/` (~55 berkas, ±540 KB), `assets/audio/` (1 BGM mp3 4,3 MB + SFX wav), `docs/`, `tests/` (Playwright, Python), `tools/gen_audio.py`.
- Entry point: `index.html`. Namespace global: `window.MPH`. Jalankan dengan server statis (README game).

## Penyimpanan (localStorage)
Kunci: `mph.save`, `mph.v10.world`, `mph.vm`, `mph.chcut`, `mph.audio`. Dibungkus `js/storage.js` (aman bila localStorage diblokir).
Profil pemain (`js/final.js`): `name, stars (1-3), score, maxScore, finished, certNo, finishedAt`.

## Temuan penting untuk integrasi
1. Nomor sertifikat dan skor dibuat DI BROWSER (`final.js`, `certpdf.js`). Tidak sah sebagai bukti; backend AnsepZero harus menerbitkan nomor sendiri dan memverifikasi.
2. Tidak ada sistem sesi/identitas cloud. Hook yang perlu dibuat: saat `P.finished` menjadi true, kirim `postMessage` ke halaman induk (belum dipasang, perlu pengecekan titik tepat di `final.js`).
3. Game memakai simbol Unicode (centang, silang, bintang) pada UI. Aturan "tanpa emoji" perlu diputuskan: diganti SVG atau dibiarkan pada game beta.
4. Cakupan pengujian game sebelumnya: Chromium headless saja. Android fisik, Firefox, Safari BELUM diuji oleh pembuatnya.
5. Pilihan integrasi paling aman: `<iframe>` pada halaman `frontend/game/` dengan folder game utuh (menghindari konflik CSS/global/localStorage), plus `postMessage` ber-origin terperiksa.
6. Berkas `tests/`, `docs/riwayat`, `tools/` tidak perlu ikut ke deployment.

## Dari abstrak & chat tim (perlu masuk ke produk)
- Pengertian karhutla di materi pertama, Daftar Pustaka di akhir (sumber resmi DLH, BPBD).
- Pertolongan pertama ISPA, cara meminimalkan dampak kesehatan.
- Peta kerawanan Batola: HANYA jika datanya nyata (tim menyebut data.go.id, instansi Kab. Barito Kuala). Belum ada data diverifikasi: tampil "belum tersedia".
- Kontak BPBD/Damkar: butuh nomor resmi dari tim (jangan dikarang).
- Citizen reporting + GPS: tersedia sebagai pembuka WhatsApp berisi koordinat. Catatan: abstrak menyebut "aplikasi mobile" dan "hubungan otomatis ke Damkar"; website dan WhatsApp tidak bisa otomatis, harus ditulis jujur.
