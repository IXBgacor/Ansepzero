# Firebase: keputusan untuk versi 1.2.0 (jujur)

Permintaan pembaruan meminta Firestore (paket Spark) sebagai basis data utama. Versi 1.2.0 sengaja TIDAK memindahkan basis data dari Cloudflare D1. Alasannya teknis, bukan penolakan:

1. **Skor kuis dinilai di server.** Kunci jawaban tidak pernah dikirim ke browser; server mencatat tiap jawaban, waktu, dan menolak pengerjaan terlalu cepat. Di Firestore tanpa Cloud Functions (dilarang oleh paket Spark yang dipakai), Security Rules tidak bisa memeriksa jawaban kuis. Pilihannya hanya: (a) browser menghitung dan menulis skornya sendiri, sehingga siapa pun bisa menulis skor sempurna ke papan skor; atau (b) Worker Cloudflare tetap menjadi penulis tepercaya dan menulis ke Firestore memakai kunci akun layanan (service account) sebagai secret. Opsi (b) memindahkan data tetapi tidak menambah keamanan, dan menulis ulang seluruh lapisan data (satu pintu API, pembatas laju, 5 admin maksimum lewat trigger, analitik SQL).
2. **Tidak bisa diuji di sini.** Pengemasan dilakukan tanpa akses jaringan dan tanpa proyek Firebase milik Anda. Migrasi sebesar itu yang tidak teruji berisiko merusak kuis, yang justru prioritas utama.
3. D1 sudah diuji otomatis (142 pemeriksaan), berjalan di Cloudflare yang sama dengan situs, dan gratis pada skala proyek ini.

## Bagian Firebase yang aman ditambahkan nanti (belum dikerjakan)
- Firebase Authentication untuk login admin: server memverifikasi ID token Firebase lalu mencocokkan UID dengan daftar admin di D1 (bukan koleksi "admins" yang dibaca browser).
- Firestore untuk data yang tidak menentukan peringkat (mis. laporan warga) dengan Security Rules yang memvalidasi bentuk data dan koordinat.
Keduanya butuh proyek Firebase Anda (project ID, konfigurasi web) dan pengujian dengan proyek itu. Jangan mengisi konfigurasi Firebase buatan siapa pun; tidak ada nilai Firebase yang diisi di ZIP ini.
