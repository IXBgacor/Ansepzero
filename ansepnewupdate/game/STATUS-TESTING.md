# Status Pengujian v1.0 Alpha
Otomatis: `python3 -m http.server 8124` di folder game, lalu `python3 tests/uji-v10.py` (Playwright + Chromium headless). Bagian: `map`, `run`, `intro`, `ending`, `migrasi`.
Cakupan: audit 61 titik misi, peta & collision sekolah, lari (Shift + tombol sentuh, diagonal, collision), cerita pembuka (alur penuh, skip, replay, tidak terulang, state), evakuasi→pemulihan, ending berantai, hanya sekali, muat ulang, reset, migrasi save v0.6.
Hasil terakhir: lihat bagian bawah file ini yang diisi saat pengemasan.
Belum diuji: perangkat Android fisik, Firefox, Safari; kinerja HP kelas bawah diukur hanya lewat jumlah objek/lapisan (bukan FPS nyata).

## Hasil uji terakhir (rev. 2)
```
[lulus] [Audit] semua titik interaksi misi valid, terjangkau, di dalam peta (61 titik)
[lulus setelah perbaikan] [Map] peta 108x36, 10 bangunan sekolah -> {'w': 108, 'h': 36, 'objs': 854, 'sch': {'buildings': 10, 'skipped': ['sch_bush@68,15']}}
[lulus] [Map] jumlah objek wajar untuk Android (< 1500)
[lulus] [Sekolah] seluruh NPC/objek sekolah terjangkau
[lulus] [Sekolah] titik di dalam gedung/pagar/kantin bertabrakan (6/6)
[lulus] [Sekolah] pemain tidak menembus dinding gedung kelas saat berjalan ke utara
[lulus] [Sekolah] pemain tidak menembus pagar timur
[lulus] [Sekolah] gerbang barat dapat dilalui jalan tanah -> halaman depan
[lulus] [Bug] pintu Balai Desa tidak lagi terhalang kios (petak depan pintu bebas)
[lulus] [Teknis] tanpa error JS pada pemuatan peta
[lulus] [Lari] Shift membuat pemain lebih cepat (≈1.7x)
[lulus] [Lari] diagonal tidak lebih cepat dari lurus (jarak ≤ ~1.05× lurus)
[lulus] [Lari] tidak menembus collision (air/pohon) saat berlari
[lulus] [Lari] Shift dilepas -> kembali berjalan (Input.running false)
[lulus] [Lari] tombol LARI tampil di mode sentuh, tidak tumpang tindih dengan INTERAKSI maupun joystick
[lulus] [Lari] menahan tombol LARI mengaktifkan lari
[lulus] [Lari] melepas tombol LARI menghentikan lari
[lulus] [Lari] titik tombol LARI tidak tertutup elemen lain (elementFromPoint = btn-run)
[lulus] [Lari] sentuhan nyata: joystick + tahan LARI -> kecepatan ≈1.75x dan status lari aktif
[lulus] [Lari] sprite lari khusus tersedia (4 arah x 4 frame) dan berbeda dari sprite jalan
[lulus] [Story] cutscene pembuka otomatis mulai di permainan baru
[lulus] [Story] pembukaan selesai: judul tampil, dialog muncul, pintu balai terbuka, perlengkapan diterima
[lulus] [Story] world state: intro selesai, 4 perlengkapan tersimpan, pintu balai terbuka permanen
[lulus] [Story] pemain berakhir di lokasi kerja (titik awal) dan Pak Lurah kembali ke posisi aslinya
[lulus] [Story] semua override NPC bersih setelah cutscene
[lulus] [Story] misi pertama langsung tersedia (briefing/misi aktif misi 1)
[lulus] [Story] input normal setelah cutscene (pemain dapat bergerak, kamera mengikuti)
[lulus] [Story] tidak terulang setelah muat ulang halaman
[lulus] [Story] pintu balai tetap terbuka setelah muat ulang
[lulus] [Story] tombol Lewati muncul dan cutscene berhenti
[lulus] [Story] skip: state dunia sama dengan jalur penuh (intro, perlengkapan, pintu), pemain di titik awal
[lulus] [Story] skip: NPC tidak bergeser & tidak ada black screen
[lulus] [Story] skip: briefing misi 1 muncul setelah cerita
[lulus] [Story] putar ulang cerita pembuka berjalan
[lulus] [Story] putar ulang tidak mengubah world state maupun posisi
[lulus] [Teknis] tanpa error JS pada alur cerita
[lulus] [Evakuasi] darurat: jendela rumah tertutup & posko dipasang, warga berkumpul di titik kumpul
[lulus] [Evakuasi] seluruh warga selamat di titik kumpul, tidak ada NPC hilang/berlipat
[lulus] [Evakuasi] Pak Lurah ikut ke titik kumpul
[lulus] [Ending] urutan cutscene: final (pemadam) -> ending (inspeksi, warga pulang, perayaan)
[lulus] [Ending] semua api rangkaian karhutla utama padam di world state
[lulus] [Ending] hazard api tidak lagi aktif (tidak ada cincin/asap/zona bahaya)
[lulus] [Ending] fase evakuasi = recovered, ending tercatat sekali
[lulus] [Evakuasi] setelah pemulihan semua warga & Pak Lurah kembali ke rumah (tanpa override)
[lulus] [Evakuasi] rumah dibuka kembali, posko dibongkar (tenda/bendera/peti disembunyikan & tidak bertabrakan)
[lulus] [Ending] tanah hangus tetap terlihat (scorch aktif), api besar tidak ada di daftar POI
[lulus] [Ending] dialog penutup lalu layar tamat muncul, tidak terjebak di cutscene
[lulus] [Ending] layar ending terbuka sekali & game tidak terkunci setelah ditutup
[lulus] [Teknis] tidak black screen setelah ending
[lulus] [Ending] dialog warga berubah ke versi pasca-pemulihan
[lulus] [Save] muat ulang: api tetap padam, ending tercatat, fase recovered
[lulus] [Save] muat ulang: warga di rumah, tidak ada cutscene diputar ulang, hazard api nol
[lulus] [Save] muat ulang: hutan hangus masih tampak & pintu balai terbuka
[lulus] [Reset] reset progres mengembalikan api aktif & warga ke kondisi awal
[lulus] [Teknis] tanpa error JS pada alur evakuasi/ending
[lulus] [Migrasi] save v0.6 yang sudah tamat -> kondisi pasca-ending otomatis (api padam, warga di rumah, cerita pembuka tidak dipaksa)
[lulus] [Migrasi] sertifikat & nama lama tetap

TOTAL 56 / 57
```
