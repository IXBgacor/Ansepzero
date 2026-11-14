# Changelog

## Beta v0.5² (dari v0.5)
**Baru**
- SFX NPC diganti: rangkaian blip WAV pendek terjadwal, satu kanal, tanpa tumpukan; file SFX pemain dapat dipasang lewat `NPC_SFX.userFiles` (menggantikan blip bawaan).
- Keseimbangan volume: bawaan BGM 50%→35%, SFX 80%→85%, penguat SFX 2,4× + limiter, BGM di-duck 50% saat cutscene; migrasi aman untuk pengaturan lama (`mph.audio` ber-`ver: 2`).
- Kamera geser (Android satu jari / PC drag mouse) dengan batas peta, kembali halus ke player, tidak menggerakkan player/joystick, batal otomatis oleh dialog/panel/jeda/cutscene.
- Cutscene Misi Terakhir "Bantuan petugas pemadam tiba." (mobil & petugas pemadam, semprotan air, api/asap berkurang, kamera sinematik, bar sinematik, teks, tombol Lewati Cutscene setelah 3 dtk) + 8 SFX cutscene.
- Dialog penutup, status "STATUS: TAMAT ✔" pada layar ending (skor akhir, bintang, tombol sertifikat tetap).
- Musik tegang berhenti dengan transisi halus (laju musik naik bertahap) saat misi final tamat.
**Diubah**
- Versi → Beta v0.5². Alur "Ikut Membantu": objective akhir → cutscene → dialog penutup → ending (sebelumnya langsung ending). "Selesai Sekarang" tidak berubah.
- `interact.js`: pengecekan "terlihat di layar" memakai kamera pengikut (bukan kamera yang sedang digeser).
- Cincin zona bahaya disembunyikan selama cutscene; asap/api besar mengikuti intensitas cutscene.
**Tidak diubah**: 30 misi, kuis, skor, bintang, nama pemain, sertifikat, pause, fullscreen, Android analog, PC keyboard, BGM/SFX sintesis lama, localStorage (`mph.save`, `mph.v05`, `mph.audio`, `mph.input`) — progres lama aman.
**Dikeluarkan**: tidak ada fitur yang dihapus. `npc-talk.m4a/.mp3` dipindah ke `assets/audio/sfx/npc/_lama-v0.5/`.
