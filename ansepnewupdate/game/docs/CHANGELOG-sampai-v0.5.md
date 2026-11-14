# Changelog

## Beta v0.5 (dari v0.4³ FINAL)
**Baru**
- Layar "Siapa nama Penjaga Hutan?" saat pertama kali buka; menu **Ubah Nama**; nama dipakai di tracker, ending, dan sertifikat. Tidak ada data pribadi lain yang diminta.
- SFX suara NPC dari file (`assets/audio/sfx/npc/`), dikontrol: satu elemen audio, tidak bertumpuk, berhenti saat halaman berganti/dialog ditutup, fallback ke bunyi sintesis bila file hilang/format tak didukung. Konfigurasi di `js/config.js` → `NPC_SFX`.
- **Misi Terakhir — Penjaga Hutan**: terbuka setelah 30 misi selesai. Kebakaran besar di utara peta (api, asap, tanah hangus, tint merah, denyut vinyet), BGM menjadi lebih lambat/rendah (tegang), area api tidak bisa dimasuki.
- Pilihan akhir: **Ikut Membantu** (5 objective simulasi relawan di bawah arahan petugas, +100 poin) atau **Selesai Sekarang** (dengan konfirmasi).
- Sistem bintang akhir 1–3 dengan alasan perolehan; layar ending; **sertifikat A4 landscape** yang dapat dicetak / disimpan sebagai PDF lewat dialog cetak browser; nomor sertifikat unik; hanya bisa dibuat setelah tamat.
**Diubah**
- Versi → Beta v0.5. Setelah misi ke-30, evaluasi akhir lama tidak lagi otomatis muncul; ending baru tampil setelah Misi Terakhir. Evaluasi akhir lama tetap bisa dibuka dari menu.
- `input.js`: mengetik di kolom nama tidak lagi memicu pergantian mode kontrol.
**Tidak diubah**: 30 misi, kuis, skor, pause, fullscreen, mode Android/PC, BGM, SFX sintesis, pengaturan audio, format save `mph.save` (v3).
**Penyimpanan**: data baru di kunci terpisah `mph.v05` (nama, pilihan akhir, objective, bintang, skor, status tamat, nomor sertifikat, tanggal). `mph.save` tidak disentuh, jadi progres lama aman. Data `mph.v05` rusak dicadangkan ke `mph.v05.corrupt`; data dari versi lebih baru tidak ditimpa. "Reset Progres Misi" juga mereset Misi Terakhir/ending (nama dipertahankan).
