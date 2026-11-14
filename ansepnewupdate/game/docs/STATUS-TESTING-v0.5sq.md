# Status testing — Beta v0.5²

**Metode:** otomatis, Playwright + Chromium headless, di sandbox Linux. Android = *emulasi* (viewport 915×412 / 740×360 / 568×320, sentuhan lewat Chrome DevTools Protocol), BUKAN perangkat Android nyata. Audio diperiksa lewat node WebAudio/analyser dan status elemen — **tidak ada telinga manusia** yang mendengarkan hasilnya.
Jalankan sendiri: `python3 -m http.server 8124` di folder game, lalu `python3 tests/uji-v05sq.py` (dst.).

## Hasil (semua lolos pada run terakhir, 0 galat JavaScript)
| Skrip | Hasil |
|---|---|
| `tests/uji-v05sq.py` (khusus v0.5²) | 89/89 |
| `tests/uji-cutscene-android.py` | 15/15 |
| `tests/uji-desktop.py` (regresi v0.5, disesuaikan) | 40/40 |
| `tests/uji-android-emulasi.py` (regresi v0.5) | 21/21 |
| `tests/uji-validasi-reset-stabilitas.py` | lolos (30 misi, validasi konten kosong, reset) |
| `node --check` semua `js/*.js` | lolos |
Uji tambahan manual-skrip: memuat dari `file://` → game jalan, aset WAV gagal dimuat → fallback sintesis aktif, tanpa galat.

## Daftar uji yang diminta
| Item | Status | Catatan |
|---|---|---|
| Drag kamera Android | PASS (emulasi) | |
| Kamera kembali ke player setelah release | PASS (emulasi) | easing monoton, tanpa lompat, offset akhir 0 |
| Drag tidak membuat player berjalan / bukan input joystick | PASS (emulasi) | posisi player identik; joystick `id=null` |
| Kamera tidak keluar batas peta | PASS | 4 arah, seret ekstrem |
| Mouse camera pan di PC | PASS | |
| Keyboard tetap normal | PASS | |
| BGM lebih pelan | PASS (angka) | gain −6,2 dB; elemen BGM mengikuti nilai baru. Belum didengar manusia |
| SFX lebih jelas | PASS (angka) | gain +8,7 dB, peak bus terukur 0,15–1,0 (limiter). Belum didengar manusia |
| NPC SFX tidak bertumpuk | PASS | |
| Cutscene berjalan, SFX cutscene berjalan | PASS (status WebAudio) | 8 aset termuat; instance aktif per fase terverifikasi; **kualitas bunyi tidak dinilai** |
| Player tidak dapat bergerak saat cutscene | PASS | |
| Tombol Lewati | PASS | klik, ketuk (3 ukuran layar), Enter |
| Ending tetap menghasilkan sertifikat | PASS | termasuk `page.pdf` Chromium (±PDF valid) |
| Tidak ada error JavaScript | PASS | pada semua skrip di atas |

## Belum diuji / batasan (jangan dianggap PASS)
- Perangkat Android nyata (multi-touch asli, performa, latensi audio, layar berponi, kebijakan autoplay Android/iOS), Firefox, Safari.
- Penilaian pendengaran: keseimbangan BGM vs SFX vs dialog, enak/tidaknya blip NPC, realisme SFX cutscene (sintesis sederhana).
- Pembuatan berkas PDF lewat dialog cetak peramban sungguhan (hanya `page.pdf` yang diuji).
- Ketuk/geser saat pergantian orientasi layar di tengah cutscene.
- Tes lama v0.5 yang dihapus/diganti: 2 uji SFX NPC format m4a/mp3 (sistem lama sudah diganti); uji setara baru ada di `uji-v05sq.py`.
