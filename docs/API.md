# API AnsepZero
Semua respons JSON kecuali ekspor. Semua endpoint masuk lewat `functions/api/[[route]].js` yang meneruskan ke `functions/_lib/routes/*`. Pemain: `Authorization: Bearer <kode pemulihan>`. Admin: cookie sesi + header `x-az-csrf: 1` untuk non-GET.
## Publik
GET /api/health (diagnosis pemasangan: db, skema, tabel yang kurang) | /api/stats | /ispa | /contacts | /announcements | /content | /leaderboard?period=all|month|week | /analytics ; POST /api/visit ; GET /api/reports/{kode} (status saja)
POST /api/reports (JSON atau multipart: description, lat, lng, location_text, photo). 5 per jam per perangkat.
## Penjaga Hutan AI
GET /api/chat -> `{configured, max_chars}` (tanpa rahasia). POST /api/chat `{messages:[{role:'user'|'assistant',content}]}` (pesan terakhir harus `user`, maks 500 karakter; riwayat dipotong ke 6 pesan terakhir) -> `{reply, materials:[{slug,title,sources:[{t,u}]}], contacts:[{name,phone_intl,note,verified}], refused?}`. Galat: 400 validasi, 429 `rate`/`daily`, 503 `not_configured`/`quota`, 502 `unavailable`, 504 `timeout`; selalu `{error, code}`. Percakapan tidak disimpan.
## Pemain
POST /api/player {display_name} | GET, DELETE /api/player/me
## Kuis
GET /api/quiz/progress ; POST /api/quiz/start {kind:level|pre|post, level} ; POST /api/quiz/answer {attempt_id, question_id, chosen_index} ; POST /api/quiz/finish {attempt_id}
Poin level = 10 x benar (terbaik per level, maks 200/level). Selesai < 2 detik per soal = ditandai.
## Game
POST /api/game/start ; POST /api/game/mission {mission_id, points} ; POST /api/game/sync {mission_ids} ; GET /api/game/progress
Poin <= max misi; harus berurutan; sekali per misi; durasi minimal diukur server (10 dtk x langkah); bintang diturunkan server dari rasio poin (>=90% 3, >=70% 2).
## Skor total
Total = kuis (maks 1000) + petualangan (0-1000 = 1000 x poin tervalidasi / total poin maks misi aktif). Maks 2000. Progres edukasi = level lulus / 5.
## Admin (/api/admin/...)
POST setup, login, logout ; GET me, summary, audit ; CRUD questions, content, contacts, announcements ; GET reports, PUT/DELETE reports/{id}, GET report-photo/{key} ; GET missions, PUT missions/{id} ; GET flags, POST flags {type, id|player_id+mission_id, action} ; GET players, PUT players/{id} {hidden} ; GET/PUT settings ; GET/POST admins, PUT admins/{id} ; GET export/aggregate.csv, export/backup.sql
