# Misi Penjaga Hutan — Beta v0.5⁴

Game edukasi 2D pixel-art (HTML5 Canvas, tanpa dependensi). Lanjutan v0.5²: semua fitur lama dipertahankan (30 misi/6 bab, Misi Terakhir, dialog, kuis, skor, bintang, nama pemain, sertifikat PDF, pause, fullscreen, Android analog, PC keyboard/mouse, BGM, SFX, kamera geser, cutscene pemadam, localStorage). Lihat `CHANGELOG.md`, `KONTROL.md`, `AUDIO-ASET.md`, `STATUS-TESTING.md`.

## Menjalankan
Sajikan folder lewat server statis (`python3 -m http.server 8000` → `http://localhost:8000/`) atau hosting statis. Jangan dari `file://` bila ingin SFX WAV: browser memblokir `fetch` aset (game tetap jalan dengan bunyi sintesis cadangan).

## Yang baru di v0.5⁴
**1. Perbaikan bug cutscene menembus objek.** Penyebab: v0.5² menggerakkan mobil dan petugas pemadam pada garis lurus tanpa memeriksa peta. Sekarang semua aktor cutscene berjalan di atas **jalur BFS** (`Map.findPath`) yang menghindari pohon, batu, air, papan, dan NPC/objek, memakai hitbox kaki yang sama dengan pemain; setiap ruas jalur diverifikasi bebas tabrakan. Mobil pemadam hanya melaju di jalan tanah (dua petak lebar, dicek per petak) dan muncul dari ujung jalan (tidak lewat pepohonan tepi). Petugas keluar dari mobil, berputar menghindari pohon/sungai, lalu berdiri di luar dinding area api.
**2. Kamera geser lebih leluasa.** Kamera kini boleh melewati tepi peta sampai `CAM_OVERSCROLL` = 56 px (±3,5 petak) di semua sisi — tidak lebih. Area di luar peta digambar sebagai hutan gelap yang berlanjut dengan bayangan tepi. Tetap: player tidak ikut berjalan, joystick tidak terpengaruh, kamera kembali halus saat dilepas. Ubah margin lewat `CAM_OVERSCROLL` di `js/config.js`.
**3. Cutscene tiap bab (6 cutscene).** Diputar sekali setelah semua 5 misi sebuah bab selesai dan dialog "bab selesai" ditutup. Semuanya sesuai isi quest bab, dapat dilewati (tombol Lewati muncul setelah 2 dtk; Enter/E juga bisa), memakai kamera sinematik, bar sinematik, teks, dan SFX; player beku selama cutscene.
| Bab | Cutscene |
|---|---|
| 1 Kenali Hutan | pohon besar (daun jatuh, gelembung O₂) → sarang & burung terbang → kanal/gambut (riak, tetes air) → sungai |
| 2 Waspada Api | *simulasi* percikan: cuaca terik → puntung membara → percikan ke semak kering → api kecil membesar → "laporkan, jangan padamkan sendiri" |
| 3 Dampak | kabut asap menebal: papan AQI memerah, warga batuk, sekolah libur, pasar sepi; lalu udara kembali jernih |
| 4 Penjaga Masyarakat | empat warga berjalan ke Balai Desa menemui Pak Lurah; centang, hati, poster berkilau |
| 5 Pelaporan Aman | jarak aman dari asap → pin lokasi di patok → radio/112 → surat laporan terbang ke petugas → petugas berangkat |
| 6 Misi Penyelamatan | kanal terisi air → tujuh tunas tumbuh → pandangan ke utara: asap tebal muncul → "Saatnya Misi Terakhir!" |
Bab yang sudah selesai dapat diputar ulang lewat tombol **▶ Putar Cutscene Bab N** di panel "Bab & Misi" (saat bermain). Status "sudah diputar" tersimpan (`mph.chcut`) dan dihapus saat Reset Progres. Progres lama tidak memicu cutscene otomatis (hanya penyelesaian bab baru); gunakan tombol putar ulang. Matikan semua dengan `CH_CUT: false`.
**4. Tanda tempat ideal interaksi.** Untuk setiap tujuan misi aktif (NPC, objek, area bahaya "amati", dan objective Misi Terakhir) muncul **cincin emas berdenyut di tanah + panah kecil ke arah tujuan**. Berdiri di dalamnya: tanda berubah **hijau ✔**, dan dijamin tombol INTERAKSI/E aktif untuk tujuan yang benar.
- NPC/objek: tepat di depan (sisi bawah), jarak ±18–22 px.
- Area bahaya: pada jarak amati aman (cincin hijau), condong ke kiri/kanan dan dipilih agar hazard tetap terlihat di layar (dihitung ulang saat ukuran layar berubah), tidak di zona bahaya hazard lain.
- Semua posisi dihitung otomatis dan diverifikasi: bebas tabrakan, bisa dicapai dari titik awal, dan `Interact.scan()` memilih tujuan yang benar. `SPOT_MARKERS: false` mematikan tanda. Satu pengecualian: "api besar" latar Misi Terakhir tidak punya tanda karena bukan tujuan misi dan area sekitarnya penuh pohon/sungai.

## Alur
Nama → 30 misi (cutscene tiap bab) → kebakaran besar di utara → **Petugas Rimba** → **Ikut Membantu** (5 objective) atau **Selesai Sekarang** → (bila membantu) cutscene pemadam → dialog penutup → ending (skor, bintang, STATUS: TAMAT) → sertifikat PDF.

## Bintang & sertifikat
Tidak berubah dari v0.5 (lihat `docs/README-v0.5-riwayat.md`).

## Struktur baru
```
js/chapter_cutscenes.js  6 cutscene bab + pemicu + putar ulang
js/cutscene.js           mesin cutscene umum + cutscene Misi Terakhir (jalur BFS)
js/spots.js              tanda tempat ideal interaksi
js/sprites_v054.js       ikon efek (burung, kilau, hati, centang, pin, surat, koin, tunas, ...)
js/map.js                + footBlocked / lineClear / findPath / reachable
js/game.js               kamera: overscroll + area luar peta
tools/gen_audio.py       pembuat seluruh aset WAV (sintesis prosedural, CC0)
tests/                   uji otomatis (lihat STATUS-TESTING.md)
```
