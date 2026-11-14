import worker from '../src/index.js';
import { makeDB } from './d1-shim.mjs';
import { hashPassword } from '../src/lib/util.js';

const db = makeDB();
const env = { DB: db, ALLOWED_ORIGINS: 'https://app.test' };
let pass = 0, fail = 0;
const ok = (c, name) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + name); };
async function call(method, path, { body, token, origin } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  if (origin) headers.Origin = origin;
  const res = await worker.fetch(new Request('https://api.test' + path, { method, headers, body: body ? JSON.stringify(body) : undefined }), env);
  return { status: res.status, data: await res.json().catch(() => null), headers: res.headers };
}
const uuid = () => crypto.randomUUID();

const raw = db._raw;
ok(raw.prepare('SELECT COUNT(*) n FROM quiz_questions').get().n === 100, 'seed: 100 soal');
ok([1,2,3,4,5].every(l => raw.prepare('SELECT COUNT(*) n FROM quiz_questions WHERE level=? AND active=1').get(l).n === 20), 'seed: 20 soal per level');
ok(raw.prepare('SELECT COUNT(DISTINCT question) n FROM quiz_questions').get().n === 100, 'seed: 100 pertanyaan unik');
ok(raw.prepare('SELECT COUNT(DISTINCT correct_index) n FROM quiz_questions').get().n === 4, 'seed: kunci tersebar A-D');
const answers = (l, mode) => raw.prepare('SELECT id, correct_index c FROM quiz_questions WHERE level=? AND active=1').all(l).map(q => ({ question_id: q.id, choice: mode === 'right' ? q.c : (q.c + 1) % 4 }));
// --- Dasar ---
ok((await call('GET', '/api/health')).data?.status === 'ok', 'health');
ok((await call('GET', '/api/tidak-ada')).status === 404, '404 endpoint tak dikenal');
ok((await call('GET', '/api/health', { origin: 'https://app.test' })).headers.get('Access-Control-Allow-Origin') === 'https://app.test', 'CORS origin diizinkan');
ok(!(await call('GET', '/api/health', { origin: 'https://jahat.test' })).headers.get('Access-Control-Allow-Origin'), 'CORS origin asing tidak diizinkan');

// --- Sesi peserta ---
const cid = uuid();
const s1 = await call('POST', '/api/participants/session', { body: { client_id: cid, display_name: 'Budi' } });
ok(s1.status === 201 && s1.data.token, 'sesi dibuat, token dikembalikan');
const T = s1.data.token;
ok((await call('POST', '/api/participants/session', { body: { client_id: cid, display_name: 'Budi' } })).status === 409, 'client_id ganda tanpa token ditolak');
const s2 = await call('POST', '/api/participants/session', { body: { client_id: cid, display_name: 'Budi' }, token: T });
ok(s2.status === 200 && !s2.data.created && !s2.data.token, 'refresh dengan token tidak membuat duplikat');
ok(raw.prepare('SELECT COUNT(*) n FROM participants').get().n === 1, 'peserta tidak terduplikasi');
ok((await call('POST', '/api/participants/session', { body: { client_id: uuid(), display_name: 'x' } })).status === 400, 'nama terlalu pendek ditolak');
ok((await call('GET', '/api/quiz/progress')).status === 401, 'progres tanpa token ditolak');

// --- Kuis ---
const q1 = await call('GET', '/api/quiz/questions?level=1', { token: T });
ok(q1.status === 200 && q1.data.questions.length === 20 && !JSON.stringify(q1.data).includes('correct'), 'soal level 1 tanpa kunci jawaban');
ok((await call('GET', '/api/quiz/questions?level=2', { token: T })).status === 403, 'level 2 terkunci');
ok((await call('POST', '/api/quiz/attempts', { token: T, body: { level: 2, attempt_key: uuid(), answers: answers(2,'right') } })).status === 403, 'kirim jawaban level terkunci ditolak');
ok((await call('POST', '/api/quiz/attempts', { token: T, body: { level: 1, attempt_key: uuid(), answers: answers(1,'right').slice(0, 2) } })).status === 400, 'jawaban tidak lengkap ditolak');
const k1 = uuid();
const bad = await call('POST', '/api/quiz/attempts', { token: T, body: { level: 1, attempt_key: k1, answers: answers(1,'right').map((a, i) => i === 0 ? a : { ...a, choice: (a.choice + 1) % 4 }) } });
ok(bad.status === 201 && bad.data.attempt.correct === 1 && !bad.data.attempt.passed, 'penilaian server: 1/20 tidak lulus');
ok(bad.data.results.find(r => r.question_id === 'L1-002').explanation, 'pembahasan dikembalikan');
const dup = await call('POST', '/api/quiz/attempts', { token: T, body: { level: 1, attempt_key: k1, answers: answers(1,'right') } });
ok(dup.data.duplicate && dup.data.attempt.correct === 1, 'kirim ulang kunci sama tidak membuat percobaan baru');
ok((await call('GET', '/api/quiz/questions?level=2', { token: T })).status === 403, 'level 2 tetap terkunci setelah gagal');
ok((await call('POST', '/api/certificates/quiz', { token: T })).status === 403, 'sertifikat kuis ditolak sebelum lulus');
for (let l = 1; l <= 5; l++) {
  const r = await call('POST', '/api/quiz/attempts', { token: T, body: { level: l, attempt_key: uuid(), answers: answers(l,'right') } });
  ok(r.data?.attempt?.passed === true, `level ${l} lulus 100%`);
}
ok(raw.prepare('SELECT COUNT(*) n FROM quiz_attempts WHERE participant_id=1 AND level=1').get().n === 2, 'riwayat percobaan lama dipertahankan');
const prog = await call('GET', '/api/quiz/progress', { token: T });
ok(prog.data.all_passed && prog.data.levels[0].attempts === 2, 'progres: semua lulus, riwayat 2 percobaan level 1');
const cq = await call('POST', '/api/certificates/quiz', { token: T });
const noQ = cq.data?.certificate?.cert_no;
ok(/^AZQ-\d{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(noQ), 'sertifikat kuis terbit dengan format nomor benar');
ok((await call('POST', '/api/certificates/quiz', { token: T })).data.certificate.cert_no === noQ, 'penerbitan ulang idempoten (nomor sama)');
const v = await call('GET', '/api/certificates/verify?no=' + noQ);
ok(v.data.valid && v.data.name === 'Budi' && !('score' in v.data), 'verifikasi publik valid, data minimal');
ok((await call('GET', '/api/certificates/verify?no=AZQ-2026-AAAA-BBBB')).data.valid === false, 'nomor palsu tidak valid');
ok((await call('GET', '/api/certificates/verify?no=salah')).status === 400, 'format nomor salah ditolak');

// --- Game ---
const gk = uuid();
const gBody = { submission_key: gk, game_version: '2.1-alpha', score: 80, max_score: 100, stars: 3, missions_done: 30, finished: true };
ok((await call('POST', '/api/certificates/game', { token: T })).status === 403, 'sertifikat game ditolak sebelum skor tamat tercatat');
ok((await call('POST', '/api/game/scores', { token: T, body: { ...gBody, score: 999 } })).status === 400, 'skor melebihi maksimum ditolak');
ok((await call('POST', '/api/game/scores', { token: T, body: { ...gBody, stars: 7 } })).status === 400, 'bintang di luar rentang ditolak');
ok((await call('POST', '/api/game/scores', { token: T, body: gBody })).status === 201, 'skor game tersimpan');
ok((await call('POST', '/api/game/scores', { token: T, body: gBody })).data.duplicate === true, 'pengiriman ganda tidak menambah baris');
ok(raw.prepare('SELECT COUNT(*) n FROM game_scores').get().n === 1, 'hanya 1 baris skor game');
const cg = await call('POST', '/api/certificates/game', { token: T });
ok(/^AZG-/.test(cg.data?.certificate?.cert_no) && cg.data.certificate.score === 80, 'sertifikat game memakai skor dari database');

// --- Admin ---
const sh = await hashPassword('superadmin-pass-123');
raw.prepare("INSERT INTO admin_users(username, password_hash, role) VALUES ('super', ?, 'superadmin')").run(sh);
ok((await call('GET', '/api/admin/overview')).status === 401, 'overview tanpa login ditolak');
ok((await call('GET', '/api/admin/overview', { token: T })).status === 401, 'token peserta tidak bisa dipakai untuk admin');
ok((await call('POST', '/api/admin/login', { body: { username: 'super', password: 'salah' } })).status === 401, 'login salah ditolak');
const lg = await call('POST', '/api/admin/login', { body: { username: 'super', password: 'superadmin-pass-123' } });
ok(lg.status === 200 && lg.data.role === 'superadmin', 'login benar');
const A = lg.data.token;
const ov = await call('GET', '/api/admin/overview', { token: A });
ok(ov.data.participants_unique === 1 && ov.data.comprehension.numerator === 1 && ov.data.comprehension.denominator === 1 && ov.data.comprehension.percent === 100, 'overview: pemahaman 1/1 = 100%');
ok(ov.data.game.finished_sessions === 1 && ov.data.certificates.quiz === 1 && ov.data.certificates.game === 1, 'overview: game & sertifikat benar');
ok(!JSON.stringify(ov.data).includes('password'), 'overview tidak memuat data sensitif');
for (let i = 1; i <= 4; i++) ok((await call('POST', '/api/admin/users', { token: A, body: { username: 'admin' + i, password: 'password-panjang-' + i } })).status === 201, `admin ke-${i} dibuat`);
ok((await call('POST', '/api/admin/users', { token: A, body: { username: 'admin5', password: 'password-panjang-5' } })).status === 409, 'akun aktif ke-6 ditolak (batas 5)');
ok((await call('POST', '/api/admin/users', { token: A, body: { username: 'lemah', password: 'pendek' } })).status === 400, 'kata sandi lemah ditolak');
const a1 = await call('POST', '/api/admin/login', { body: { username: 'admin1', password: 'password-panjang-1' } });
ok((await call('POST', '/api/admin/users', { token: a1.data.token, body: { username: 'x'.repeat(5), password: 'password-panjang-9' } })).status === 403, 'admin biasa tidak bisa mengelola akun');
ok((await call('PATCH', '/api/admin/users/2', { token: A, body: { active: false } })).status === 200, 'superadmin menonaktifkan admin');
ok((await call('GET', '/api/admin/overview', { token: a1.data.token })).status === 401, 'sesi admin yang dinonaktifkan dicabut');
ok((await call('PATCH', '/api/admin/users/1', { token: A, body: { active: false } })).status === 400, 'superadmin tidak bisa dinonaktifkan');
ok((await call('POST', '/api/admin/logout', { token: A })).status === 200 && (await call('GET', '/api/admin/overview', { token: A })).status === 401, 'logout mencabut sesi');
let limited = false; for (let i = 0; i < 10; i++) if ((await call('POST', '/api/admin/login', { body: { username: 'ratetest', password: 'x' } })).status === 429) limited = true;
ok(limited, 'pembatasan percobaan login (429)');
ok(raw.prepare('SELECT COUNT(*) n FROM audit_logs').get().n > 0, 'audit log tercatat');

// --- Leaderboard, bank soal, pengaturan, ekspor ---
ok((await call('GET', '/api/leaderboard')).data.quiz.length === 0, 'leaderboard publik kosong sebelum opt-in (tanpa skor palsu)');
ok((await call('POST', '/api/participants/leaderboard', { token: T, body: { visible: true } })).data.visible === true, 'peserta opt-in leaderboard');
const lbp = await call('GET', '/api/leaderboard');
ok(lbp.data.quiz[0].name === 'Budi' && lbp.data.quiz[0].levels_passed === 5 && lbp.data.game[0].percent === 80, 'leaderboard: kuis 5 level & game 80%');
ok(!JSON.stringify(lbp.data).includes('client') && !JSON.stringify(lbp.data).includes('token'), 'leaderboard tanpa data pribadi/teknis');
const A2 = (await call('POST', '/api/admin/login', { body: { username: 'super', password: 'superadmin-pass-123' } })).data.token;
ok((await call('GET', '/api/admin/questions?level=1')).status === 401, 'bank soal tanpa login ditolak');
const ql = await call('GET', '/api/admin/questions?level=1', { token: A2 });
ok(ql.data.questions.length === 20 && 'correct_index' in ql.data.questions[0], 'admin melihat bank soal + kunci');
const nq = await call('POST', '/api/admin/questions', { token: A2, body: { level: 1, question: 'Soal tambahan uji?', choices: ['a','b','c','d'], correct_index: 2, explanation: 'Penjelasan uji.' } });
ok(nq.status === 201, 'admin menambah soal');
ok((await call('POST', '/api/admin/questions', { token: A2, body: { level: 1, question: 'Soal sama pilihan?', choices: ['a','a','c','d'], correct_index: 2, explanation: 'Penjelasan uji.' } })).status === 400, 'pilihan ganda sama ditolak');
ok((await call('PATCH', '/api/admin/questions/' + nq.data.id, { token: A2, body: { active: false } })).status === 200, 'admin menonaktifkan soal');
ok((await call('POST', '/api/admin/settings', { token: A2, body: { pass_percent: 30 } })).status === 400, 'ambang < 50 ditolak');
ok((await call('POST', '/api/admin/settings', { token: A2, body: { pass_percent: 90 } })).data.pass_percent === 90 && (await call('GET', '/api/quiz/progress', { token: T })).data.threshold_percent === 90, 'ambang kelulusan dapat diubah admin');
raw.prepare("UPDATE participants SET display_name = '=HYPERLINK(1)' WHERE id = 1").run();
const csvRes = await worker.fetch(new Request('https://api.test/api/admin/export?type=quiz', { headers: { Authorization: 'Bearer ' + A2 } }), env);
ok((await csvRes.text()).includes('"\'=HYPERLINK(1)"'), 'ekspor CSV menetralkan formula');
ok((await call('GET', '/api/admin/overview', { token: A2 })).data.daily.quiz_attempts.length >= 1, 'overview memuat deret harian');

console.log(`\nHasil: ${pass} PASS, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
