# Daftar aset audio & sumber — v0.6

| File | Jenis | Dipakai untuk | Sumber / lisensi |
|---|---|---|---|
| `assets/audio/bgm/Pixel_Reverb.mp3` | musik | BGM (tidak diubah dari v0.5) | File milik pemilik proyek (diberikan sejak v0.4³). Lisensi: mengikuti yang dimiliki pemilik proyek — **tidak saya verifikasi**. |
| `assets/audio/sfx/npc/npc-blip-1…6.wav` | SFX | suara NPC berbicara | Dibuat sendiri dengan `tools/gen_audio.py` (sintesis gelombang). CC0 / domain publik. |
| `assets/audio/sfx/cutscene/engine-idle-loop.wav` | SFX loop | mesin mobil pemadam | sintesis `tools/gen_audio.py`, CC0 |
| `…/siren-wail-loop.wav` | SFX loop | sirene | sintesis, CC0 |
| `…/brake-hiss.wav` | SFX | rem udara saat berhenti | sintesis, CC0 |
| `…/water-spray-loop.wav` | SFX loop | semprotan air | sintesis, CC0 |
| `…/fire-crackle-loop.wav` | SFX loop | api berderak | sintesis, CC0 |
| `…/forest-ambience-loop.wav` | SFX loop | ambience hutan (angin + kicau) | sintesis, CC0 |
| `…/scene-whoosh.wav` | SFX | transisi antar-adegan | sintesis, CC0 |
| `…/ending-chime.wav` | SFX | lonceng penutup | sintesis, CC0 |
| `…/bird-chirp.wav` | SFX | kicau burung (cutscene bab 1) | sintesis, CC0 |
| `…/drip.wav` | SFX | tetes air (bab 1, 5, 6) | sintesis, CC0 |
| `…/radio-beep.wav` | SFX | bip radio (bab 2, 5, 6) | sintesis, CC0 |
| `…/sprout.wav` | SFX | tunas tumbuh / centang (bab 4, 6) | sintesis, CC0 |
| `…/wind-low-loop.wav` | SFX loop | angin rendah, kabut asap (bab 3, 6) | sintesis, CC0 |
| `…/bird-chirp.wav` | SFX | kicau burung (cutscene bab 1) | sintesis `tools/gen_audio.py`, CC0 |
| `…/drip.wav` | SFX | tetes air (bab 1, 5, 6) | sintesis, CC0 |
| `…/radio-beep.wav` | SFX | bip radio/peringatan (bab 2, 5, 6) | sintesis, CC0 |
| `…/sprout.wav` | SFX | tunas tumbuh / centang (bab 4, 6) | sintesis, CC0 |
| `…/wind-low-loop.wav` | SFX loop | angin rendah, kabut asap (bab 3, 6) | sintesis, CC0 |
| `…/alarm-loop.wav` | SFX loop | alarm desa dua nada (cutscene darurat) | sintesis `tools/gen_audio.py`, CC0 |
| `…/heli-loop.wav` | SFX loop | rotor helikopter (cutscene pemadam) | sintesis, CC0 |
| `…/crowd-murmur-loop.wav` | SFX loop | gumaman warga | sintesis, CC0 |
| `…/village-ambience-loop.wav` | SFX loop | suasana desa (angin, kicau jauh, ketukan kayu) | sintesis, CC0 |
| `assets/audio/sfx/npc/_lama-v0.5/npc-talk.m4a / .mp3` | SFX | tidak dipakai (arsip v0.5) | File dari pemilik proyek (`npc.m4a`) |

**Catatan jujur tentang sumber.** Permintaan awal adalah mencari SFX dari sumber legal/royalty-free di internet. Lingkungan pembuatan versi ini **tidak punya akses internet**, jadi tidak ada sampel pihak ketiga yang diunduh. Sebagai gantinya semua SFX baru **dibuat dari nol secara matematis** (osilator, derau, filter) sehingga tidak mengandung audio berhak cipta dan tidak memerlukan atribusi. Kualitasnya bergaya 8-bit/sederhana — bunyi api, air, dan mesin adalah perkiraan sintetis, bukan rekaman nyata. Bila Anda ingin rekaman nyata, ganti file dengan nama sama (atau ubah `CUT_SFX.files` / `NPC_SFX` di `js/config.js`) dengan aset dari sumber seperti Freesound (pilih lisensi CC0), Kenney.nl (CC0), atau OpenGameArt, lalu catat sumbernya di tabel ini. Hasil sintesis dapat dibuat ulang: `python3 tools/gen_audio.py` (butuh numpy + scipy).

**Hierarki volume v0.6** (gain efektif relatif, dengan SFX_BOOST 2,4 dan sfxVol 85%): dialog (blip NPC 0,55) > SFX penting (chime/bip/rem 0,3–0,5) > ambience (≤ 0,22) > BGM (0,12; ×0,5 saat cutscene). Diverifikasi sebagai angka di `tests/uji-v06.py audio`; **belum didengar manusia**.
