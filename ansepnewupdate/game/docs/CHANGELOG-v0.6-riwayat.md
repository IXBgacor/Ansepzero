# Changelog

## Beta v0.6 (dari v0.5⁴)
**Dunia** — peta 64×36 (wilayah lama identik); gerbang desa; jalan ke timur; jalur hutan selatan; Desa Rimba Asri (10 rumah, balai, plaza, ladang, tenda titik kumpul, dst.); area api dipindah ke utara desa; tile baru: plaza, ladang, area aman.
**Evakuasi** — Misi Terakhir diganti menjadi *Evakuasi Desa* (7 objective); 8 warga bergerak dengan jalur BFS; lansia & anak mengikuti pemain; dialog "barang atau keselamatan"; panah jalur evakuasi + batas area aman; counter di objective.
**Cutscene** — 'village' (sekali), 'emergency', dan 'final' baru (mobil pemadam, helikopter + ember air, api/asap berkurang); jalur kendaraan di jalan; 4 SFX baru + 5 sebelumnya = total 17 aset cutscene.
**GUI** — tema pixel baru (css/v06.css), ikon pixel menggantikan emoji, HUD ikon, panel misi minimize/expand, dialog lebih ringkas, prompt `[E]`/`[INTERAKSI]`.
**Sertifikat** — PDF asli via tombol DOWNLOAD SERTIFIKAT PDF; layout A4 lanskap; ringkasan penyelesaian.
**Migrasi** — save objective lama (belum tamat) direset ke Evakuasi Desa tanpa menghapus nama/misi/skor; save tamat utuh.
**Perbaikan** — `Map.findPath` tidak lagi menyerempet sudut dari posisi awal non-pusat; POI `clear:0`/`noclear`; culling objek besar.
**Dihapus** — POI & dialog Misi Terakhir simulasi relawan (f_warga, f_kit, f_route, f_notes, f_cmd) dan cutscene pemadam jalan kaki v0.5²; pilihan "Selesai Sekarang". Alasannya: gameplay diganti evakuasi tanpa mendekati api.
**Tes** — `tests/uji-v06.py` (85 uji), regresi disesuaikan; tes yang khusus alur lama dipindah ke `tests/arsip-v05/` (tidak dijalankan).
