# Dokumentasi API AnsepZero

Basis URL: URL Worker. Semua respons JSON. Galat: `{"error":{"code","message"}}`.
Autentikasi: header `Authorization: Bearer <token>`. Token peserta didapat dari `POST /api/participants/session`; token admin dari login. Token tidak memakai cookie, sehingga tidak rentan CSRF; frontend menyimpannya di `sessionStorage` (admin) / `localStorage` (peserta).

| Metode & jalur | Auth | Fungsi |
|---|---|---|
| GET /api/health | - | Cek Worker dan D1 |
| POST /api/participants/session | - | Body `{client_id, display_name}`. 201 + `token` (sekali). Kirim ulang dengan token yang sama = 200 tanpa duplikat; tanpa token = 409 |
| GET /api/quiz/progress | peserta | Progres 5 level, ambang, status kunci |
| GET /api/quiz/questions?level=N | peserta | Soal tanpa kunci. 403 `LEVEL_LOCKED` bila terkunci |
| POST /api/quiz/attempts | peserta | Body `{level, attempt_key, answers:[{question_id, choice 0-3}]}`. Dinilai di server; seluruh soal level wajib dijawab. `attempt_key` sama = hasil lama (idempoten) |
| POST /api/game/scores | peserta | Body `{submission_key, game_version, score, max_score, stars 0-3, missions_done, finished}`. Waktu selesai diisi server |
| GET /api/game/progress | peserta | Skor terbaik |
| POST /api/certificates/quiz | peserta | Terbit hanya jika 5 level lulus (cek server) |
| POST /api/certificates/game | peserta | Terbit hanya jika ada skor game tamat di server |
| GET /api/certificates/mine | peserta | Data sertifikat milik sendiri |
| GET /api/certificates/verify?no= | - | Verifikasi publik: `valid`, jenis, nama tampilan, tanggal |
| POST /api/admin/login | - | `{username, password}`; maks 8 percobaan/15 menit per IP+username; sesi 8 jam |
| POST /api/admin/logout | admin | Mencabut sesi |
| GET /api/admin/overview | admin | Statistik, persentase pemahaman (pembilang/penyebut) |
| GET/POST /api/admin/users | superadmin | Daftar / buat admin (maks 5 akun aktif total) |
| PATCH /api/admin/users/:id | superadmin | `{active:boolean}` |
| GET /api/leaderboard | - | Peringkat publik (opt-in), kuis & game terpisah |
| POST /api/participants/leaderboard | peserta | `{visible:boolean}` tampil/sembunyi di peringkat publik |
| GET /api/admin/leaderboard | admin | Peringkat lengkap (nama tampilan) |
| GET /api/admin/quiz-attempts?limit&offset | admin | Riwayat percobaan kuis |
| GET /api/admin/game-scores?limit&offset | admin | Riwayat skor game |
| GET/POST /api/admin/questions | admin | Daftar (dengan kunci) / tambah soal |
| PATCH /api/admin/questions/:id | admin | Ubah soal (parsial) / aktif-nonaktif |
| GET/POST /api/admin/settings | admin | Ambang lulus `{pass_percent: 50-100}` |
| GET /api/admin/export?type=quiz\|game | admin | CSV (sel formula dinetralkan) |

Kode galat: `BAD_JSON, TOO_LARGE, BAD_*` (400), `NO_TOKEN/BAD_TOKEN/BAD_LOGIN` (401), `LEVEL_LOCKED/NOT_ELIGIBLE/FORBIDDEN` (403), `NOT_FOUND` (404), `CLIENT_EXISTS/ADMIN_LIMIT/USERNAME_TAKEN` (409), `RATE_LIMIT` (429), `INTERNAL` (500).

## Aturan dan keterbatasan
- Pemahaman = peserta dengan nilai terbaik level 5 >= ambang / peserta yang pernah mengerjakan level 5 (seluruh waktu). Statistik game dipisahkan.
- Kunci jawaban baru dikirim setelah peserta menjawab (untuk pembahasan). Peserta yang mengulang level dapat melihat kunci dari percobaan sebelumnya; ini diterima karena tujuannya edukasi.
- Skor game dikirim dari browser: server hanya memvalidasi rentang dan idempotensi, bukan jalannya permainan. TIDAK antimanipulasi.
- Hapus soal tidak disediakan (gunakan nonaktifkan) agar riwayat jawaban tetap utuh.
