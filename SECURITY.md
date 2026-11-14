# Keamanan
## Yang diterapkan
- Admin: password di-hash PBKDF2-SHA256 (100.000 iterasi, salt acak); sesi acak 256-bit, hanya hash yang disimpan, berlaku 8 jam; cookie HttpOnly, Secure, SameSite=Strict, Path=/api/admin; setiap perubahan butuh header `x-az-csrf`; semua endpoint admin diperiksa di server; login dibatasi (10 per 15 menit per jaringan, 8 per akun); tidak ada registrasi publik, password default, atau endpoint pengambil secret.
- Batas 5 admin aktif: trigger database (atomik); diuji dengan dua permintaan bersamaan.
- Pemain: tanpa akun; kode pemulihan 192-bit, hanya hash disimpan; nama tampilan divalidasi (menolak nomor telepon, simbol HTML); hak hapus data.
- Skor: kunci jawaban hanya di server; satu jawaban per soal; penilaian dan total dihitung server; selesai ganda tidak menggandakan skor; pengerjaan terlalu cepat ditandai dan dikeluarkan dari papan skor/analitik sampai ditinjau admin.
- Basis data: semua query memakai prepared statement; input divalidasi (panjang, tipe, rentang); batas ukuran permintaan; pembatas laju (kunci di-hash; IP tidak disimpan mentah).
- XSS: halaman baru menyisipkan teks dengan `textContent`/DOM, bukan `innerHTML` data pengguna; `_headers` menambah CSP pada halaman non-game dan header dasar di semua halaman.
- Foto laporan: jenis dicek dari byte awal, maks 1,5 MB, hanya admin yang dapat melihat, disajikan dengan CSP ketat. Lokasi pelapor tidak pernah publik.
- CSV: sel yang diawali = + - @ dinetralkan.
- Mode tamu (game tanpa masuk) hanya ada di sisi browser: tidak ada skor yang dikirim ke server.
- `/api/health` hanya menyebut status dan nama tabel yang kurang, tanpa data.
- Semua API lewat satu pintu masuk (`functions/api/[[route]].js`); berkas di `functions/_lib` tidak menjadi rute.
- Pembatas pemain baru: 60 per jam per jaringan (cukup untuk satu kelas yang memakai satu Wi-Fi sekolah), dihitung setelah nama lolos validasi.
- Penjaga Hutan AI: API key hanya sebagai Secret/binding di server, tidak pernah dikirim ke browser atau dimasukkan ke prompt; input divalidasi (maks 500 karakter, riwayat maks 6 pesan, peran dibatasi); pembatas laju per jaringan dan batas harian global; percakapan tidak disimpan; keluaran model dibersihkan dari nomor telepon dan tautan yang tidak ada di database; permintaan membakar lahan atau menghindari petugas ditolak sebelum menyentuh model; kontak darurat selalu dari database, bukan dari model; galat penyedia dipetakan ke pesan ramah tanpa detail internal; jawaban ditampilkan dengan `textContent`.
## Batasan yang harus dipahami
- Semua berkas di repo ikut terpublikasi sebagai berkas statis (termasuk `migrations/`, `docs/`, `tests/`). Repo tidak berisi rahasia; secret hanya ada di pengaturan Cloudflare. Jangan pernah menaruh token atau password di repo.
- Skor petualangan berasal dari game di browser. Server membatasi poin per misi, urutan, sekali per misi, dan waktu (diukur server), tetapi pemain yang paham teknis tetap bisa memalsukan misi dengan waktu wajar. Progres lama dari perangkat diterima dengan status ditahan untuk tinjauan admin.
- Kode pemulihan adalah rahasia pembawa: siapa pun yang memilikinya dapat memakai progres itu. Hilang = tidak bisa dipulihkan.
- Pembatas laju berbasis database dan jaringan; untuk serangan serius aktifkan Cloudflare WAF/Rate Limiting dan pertimbangkan Turnstile di form laporan.
- CSP memakai `unsafe-inline` karena skrip inline; folder `game/` belum diberi CSP agar tidak merusak game lama.
- Penjaga Hutan AI: riwayat percakapan dikirim oleh browser sehingga dapat dipalsukan pengguna; penyaring kata dan instruksi sistem mengurangi, tidak menghilangkan, risiko jawaban keliru atau penyalahgunaan (jailbreak). Model dapat salah atau mengarang meski sudah dilarang. Isi pertanyaan dikirim ke penyedia AI yang memiliki kebijakan datanya sendiri. Aktifkan juga WAF/Rate Limiting Cloudflare untuk `/api/chat`.
- Cadangan SQL memuat nama pemain dan lokasi laporan: simpan aman.
- Nomor Damkar dari pemilik proyek belum diverifikasi independen.
## Checklist sebelum publikasi
- [ ] Secret ADMIN_SETUP_TOKEN dibuat acak; tidak ada secret/token di repo (cek riwayat commit).
- [ ] Hanya akun admin yang diperlukan aktif (maks 5); password panjang dan unik.
- [ ] D1 terhubung sebagai `DB`; migrasi 0001-0005 diterapkan; coba `/api/stats` mengembalikan JSON.
- [ ] Materi diperiksa tim terhadap sumber resmi lalu diterbitkan; bagian darurat diisi dari BPBD/Damkar.
- [ ] Nomor kontak dikonfirmasi instansi, lalu tandai terverifikasi.
- [ ] Uji dari HP: kuis, game (nama, misi pertama tercatat), papan skor, lapor tanpa/ dengan GPS, admin.
- [ ] Kebijakan privasi disesuaikan; tentukan siapa yang menjawab permintaan hapus laporan.
- [ ] Jika AI diaktifkan: cek `/api/health` (tanpa rahasia), tetapkan `CHAT_DAILY_LIMIT` sesuai kuota, uji beberapa pertanyaan di luar topik dan permintaan berbahaya, baca ulang halaman privasi.
- [ ] Aktifkan WAF/Rate Limiting Cloudflare; pantau Admin > Tinjauan dan Audit.
- [ ] Unduh cadangan SQL pertama dan simpan.
