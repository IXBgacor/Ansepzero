# Panduan Admin

**Alamat:** `/admin/` pada situs frontend. Tidak tampil di navigasi publik; ini BUKAN pengamanan. Semua endpoint admin diperiksa token dan peran di backend.

## Inisialisasi superadmin (sekali)
Lihat PANDUAN-CLOUDFLARE.md bagian 5 (`npm run init-superadmin`). Tidak ada kata sandi bawaan di kode. Hanya satu superadmin yang dapat ada (dijamin indeks unik database).

## Aturan akun
- Maksimal 5 akun admin aktif total (superadmin + 4). Batas ditegakkan atomik di SQL.
- Hanya superadmin yang membuat/menonaktifkan akun lain; tidak ada pendaftaran publik.
- Kata sandi minimal 12 karakter, disimpan sebagai hash PBKDF2-SHA256 (100.000 iterasi).
- Sesi 8 jam; logout mencabut sesi; menonaktifkan akun mencabut semua sesinya. Login dibatasi 8 percobaan/15 menit per IP+username.
- Token sesi disimpan di `sessionStorage` (hilang saat tab ditutup) dan dikirim lewat header Authorization.

## Menu
Ringkasan (peserta unik, percobaan, game, sertifikat, grafik 30 hari, status sistem, ekspor CSV) · Peringkat · Percobaan kuis · Skor game · Bank soal (ubah, tambah, nonaktifkan) · Pengaturan (ambang lulus 50-100) · Akun admin (superadmin).

## Definisi statistik
Persentase pemahaman = peserta dengan nilai terbaik level 5 >= ambang / peserta yang pernah mengerjakan level 5 x 100%. Ditampilkan beserta pembilang, penyebut, periode (seluruh waktu), dan waktu pembaruan; bila penyebut 0: "Belum ada data". Peserta unik, percobaan, sesi game, dan peserta lulus dihitung terpisah. Data game tidak dipakai sebagai bukti pemahaman.

## Catatan bank soal
Menonaktifkan/menambah soal mengubah jumlah soal aktif per level (standar 20; admin diberi peringatan). Level dinilai dari seluruh soal aktif. Ekspor CSV hanya memuat nama tampilan.
