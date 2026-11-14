# Changelog

## Beta v0.5⁴ (dari v0.5²)
**Diperbaiki**
- Cutscene pemadam: mobil/petugas menembus objek → kini memakai jalan tanah yang diperiksa dan jalur BFS bebas tabrakan; truk muncul dari ujung jalan (clip + fade).
**Baru**
- Kamera geser boleh melewati tepi peta sejauh 56 px (`CAM_OVERSCROLL`); area luar peta digambar sebagai hutan gelap.
- 6 cutscene bab (satu per bab, sesuai isi quest) + putar ulang dari panel Bab & Misi; status `mph.chcut`.
- Tanda tempat ideal interaksi (cincin emas → hijau ✔) untuk tujuan misi aktif; posisi dihitung & diverifikasi otomatis.
- Pencari jalur (`Map.findPath`, `Map.footBlocked`, `Map.lineClear`, `Map.reachable`).
- 5 SFX baru: kicau burung, tetes air, bip radio, tunas tumbuh, angin rendah (total aset cutscene 13).
**Diubah**
- Mesin cutscene digeneralisasi (`M.Cutscene.define/play`); cutscene Misi Terakhir dipertahankan sebagai id `final`.
- NPC dapat berjalan sementara saat cutscene (`poi._ov`) dan dikembalikan sesudahnya.
- Penanda (!) / panah dan cincin bahaya disembunyikan selama cutscene.
- Versi → Beta v0.5⁴.
**Tidak diubah**: 30 misi, kuis, skor, bintang, nama, sertifikat, pause, fullscreen, Android analog, PC, BGM/SFX, volume, localStorage, kamera geser (kecuali margin), cutscene pemadam (selain perbaikan jalur).
