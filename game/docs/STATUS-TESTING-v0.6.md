# Status testing — Beta v0.6

**Metode:** otomatis, Playwright + Chromium headless di sandbox Linux. Android = *emulasi* (viewport 915×412 / 740×360 / 568×320, sentuhan via Chrome DevTools Protocol), BUKAN perangkat nyata. Audio diperiksa lewat node WebAudio/status, **tanpa pendengaran manusia**. Tampilan diperiksa lewat tangkapan layar sampel, bukan setiap frame. PDF diperiksa dengan `pypdf` (struktur) dan `pdftoppm` (render).
Jalankan: `python3 -m http.server 8124` di folder game, lalu `python3 tests/uji-v06.py [map|gui|evac|audio|migrasi]` (tiap bagian 0,5–4 menit).

## Hasil run terakhir (0 galat JavaScript)
| Skrip | Hasil |
|---|---|
| `tests/uji-v06.py map` | 16/16 |
| `tests/uji-v06.py gui` | 33/33 |
| `tests/uji-v06.py evac` (evakuasi + cutscene + ending + sertifikat PDF) | 24/24 |
| `tests/uji-v06.py audio` | 7/7 |
| `tests/uji-v06.py migrasi` | 5/5 |
| `tests/uji-v054.py` (regresi: kamera overscroll, cutscene 6 bab, tanda interaksi) | 71/71 |
| `tests/uji-android-emulasi.py` (disesuaikan alur evakuasi) | 21/21 |
| `tests/uji-validasi-reset-stabilitas.py` (30 misi, validasi konten, reset) | lolos |
| `node --check` semua `js/*.js`; muat dari `file://` | lolos |

## Daftar uji yang diminta
| Area | Status | Catatan |
|---|---|---|
| GUI: HUD, panel minimize, dialog, tombol, pause, audio, responsif | PASS (emulasi, 4 ukuran layar) | tombol HUD ≥ 40 px, tombol INTERAKSI ≥ 60×56, tanpa scroll horizontal, tanpa emoji pada teks, minimize/expand + simpan sesi, dialog ≤ 52% tinggi layar |
| Map: seluruh area dapat dijelajahi, collision, desa nyata, jalur jelas | PASS | ≥ 97% petak bebas terjangkau, plaza/jalan evakuasi/titik kumpul 100%, rumah & balai punya collision, 10 rumah |
| Evakuasi: warga muncul, bisa diarahkan, sampai titik aman, objective berubah, pemain tak perlu dekat api | PASS | seluruh alur lewat dialog sungguhan; jarak pemain minimum ke api ≥ 110 px; tak ada warga di area api / menembus objek (sampel berkala) |
| Cutscene: main, kamera sinematik, player terkunci, skip, helikopter, kendaraan, visual pemadaman, SFX, ending | PASS (status), visual diperiksa sampel | heli & truk muncul, `heli`/`water` SFX aktif, fireK 1 → ~0; skip & jeda bekerja |
| Sertifikat: nama, skor, bintang, nomor unik, PDF tidak terpotong | PASS | unduhan nyata (`expect_download`), PDF 1 halaman 842×595 pt valid, render tidak kosong, bingkai penuh. Nomor unik = acak per penamatan (format MPH-YYYYMMDD-XXXXXX), uji unik statistik tidak dilakukan |
| Kompatibilitas: Android, PC keyboard/mouse, fullscreen, camera drag, audio, localStorage | PASS (emulasi) | drag/overscroll (uji-v054), keyboard & prompt `[E]` PC, tombol sentuh tersembunyi di PC, migrasi save lama |
| Progres lama (migrasi) | PASS | nama, 30 misi, skor, sertifikat & nomor lama, pengaturan audio utuh |

## Belum diuji / batasan (jangan dianggap PASS)
- **Perangkat Android nyata** (kinerja kelas menengah, multi-touch, latensi audio), Firefox, Safari, rotasi layar di tengah cutscene. Di sandbox headless: 60 fps pada layar emulasi, heap JS ±10 MB — angka ini belum mewakili HP.
- **Audio tidak didengar manusia**: hierarki volume (dialog > SFX penting > ambience > BGM) hanya diverifikasi sebagai angka gain; kualitas bunyi sintesis (helikopter, alarm, dll.) belum dinilai.
- **Estetika**: GUI, desa, dan cutscene hanya dinilai lewat tangkapan layar sampel. Font bukan font pixel sejati (lihat `docs/ASET.md`).
- **Sertifikat PDF berupa gambar raster** (teks tidak dapat diseleksi/disalin). Nama panjang diperkecil otomatis; nama sangat panjang (> ±40 karakter) belum diuji.
- **Tes lama yang khusus alur v0.5 dipindah ke `tests/arsip-v05/` dan TIDAK dijalankan** (uji-desktop, uji-v05sq, uji-cutscene-android, uji-v052): alur Misi Terakhir lama dihapus. Cakupan setara baru: evakuasi/cutscene/sertifikat di `uji-v06.py`, kamera/cutscene bab/tanda interaksi di `uji-v054.py`. Pemeriksaan volume audio dari uji-v05sq hanya sebagian terulang (nilai default dan SFX NPC), bukan pengukuran peak bus.
- Save v0.5² yang *belum tamat* di Misi Terakhir akan memulai ulang objective Misi Terakhir (misi 1–30 aman).
- "Api besar" (latar) tidak memiliki tanda tempat interaksi (bukan tujuan misi).
