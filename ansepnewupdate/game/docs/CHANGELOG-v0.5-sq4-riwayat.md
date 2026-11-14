# Changelog

## Beta v0.5⁴ (dari v0.5²)
**Perbaikan bug**
- Cutscene pemadam menembus objek (mobil/petugas lewat pohon/batu/air): kini jalur BFS bebas tabrakan; truk hanya di jalan tanah dan muncul dari ujung jalan.
**Baru**
- Kamera geser boleh melewati tepi peta sedikit (`CAM_OVERSCROLL` 56 px); area luar peta digambar sebagai hutan gelap + bayangan tepi.
- Cutscene untuk setiap bab (6): bab 1 hutan hidup, 2 simulasi percikan api, 3 dampak asap, 4 warga berkumpul, 5 alur lapor, 6 pemulihan lahan + asap di utara. Sekali putar per bab, dapat dilewati, putar ulang dari panel Bab & Misi, status tersimpan (`mph.chcut`).
- Tanda emas/hijau di tanah untuk tempat ideal berinteraksi pada tujuan misi aktif (termasuk objective Misi Terakhir dan area bahaya).
- 5 SFX baru (kicau burung, tetes air, bip radio, tunas tumbuh, angin rendah) — sintesis, CC0.
- Mesin cutscene umum (`Cutscene.define/play`), pustaka `Cutscene.lib` (kamera, walker BFS, efek), `Map.findPath/footBlocked/lineClear/reachable`.
**Diubah**
- Versi → Beta v0.5⁴. NPC dapat dipindah sementara saat cutscene (`poi._ov`) dan dipulihkan setelahnya.
- Penanda (!) dan panah NPC disembunyikan selama cutscene.
- Tes lama memakai `tests/_pre.py` (menandai cutscene bab sudah diputar) agar alur tes tidak terhalang.
**Tidak diubah**: 30 misi, kuis, skor, bintang, sertifikat, audio v0.5², cutscene pemadam (alur, durasi, SFX), localStorage lama — progres aman.
