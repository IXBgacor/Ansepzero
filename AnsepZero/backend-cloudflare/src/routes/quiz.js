import { HttpError, json, readJson, validKey, intIn, rateLimit } from '../lib/util.js';
import { requireParticipant } from '../lib/auth.js';

export const getThreshold = async db => Number((await db.prepare("SELECT value FROM app_settings WHERE key='pass_percent'").first())?.value) || 80;

async function passedLevels(db, pid) {
  const r = await db.prepare('SELECT DISTINCT level FROM quiz_attempts WHERE participant_id = ? AND passed = 1').bind(pid).all();
  return new Set(r.results.map(x => x.level));
}
function assertUnlocked(level, passed) {
  if (level > 1 && !passed.has(level - 1)) throw new HttpError(403, 'LEVEL_LOCKED', `Level ${level} terkunci. Lulus level ${level - 1} dahulu.`);
}

// GET /api/quiz/progress
export async function progress(request, env) {
  const p = await requireParticipant(request, env);
  const threshold = await getThreshold(env.DB);
  const rows = (await env.DB.prepare('SELECT level, COUNT(*) attempts, MAX(percent) best_percent, MAX(passed) passed FROM quiz_attempts WHERE participant_id = ? GROUP BY level').bind(p.id).all()).results;
  const by = Object.fromEntries(rows.map(r => [r.level, r]));
  const levels = [];
  for (let l = 1; l <= 5; l++) {
    const r = by[l] || { attempts: 0, best_percent: null, passed: 0 };
    levels.push({ level: l, attempts: r.attempts, best_percent: r.best_percent, passed: !!r.passed, unlocked: l === 1 || !!(by[l - 1] && by[l - 1].passed) });
  }
  return json({ display_name: p.display_name, threshold_percent: threshold, levels, all_passed: levels.every(x => x.passed) });
}

// GET /api/quiz/questions?level=N  (tanpa kunci jawaban)
export async function questions(request, env) {
  const p = await requireParticipant(request, env);
  const level = intIn(Number(new URL(request.url).searchParams.get('level')), 1, 5);
  if (!level) throw new HttpError(400, 'BAD_LEVEL', 'Level harus 1-5.');
  assertUnlocked(level, await passedLevels(env.DB, p.id));
  const rows = (await env.DB.prepare('SELECT id, question, choices_json FROM quiz_questions WHERE level = ? AND active = 1 ORDER BY id').bind(level).all()).results;
  if (!rows.length) throw new HttpError(404, 'NO_QUESTIONS', 'Soal level ini belum tersedia.');
  return json({ level, questions: rows.map(r => ({ id: r.id, question: r.question, choices: JSON.parse(r.choices_json) })) });
}

async function resultsFor(db, attemptId) {
  const rows = (await db.prepare(
    `SELECT a.question_id, a.choice_index, a.is_correct, q.correct_index, q.explanation, q.source
     FROM quiz_answers a JOIN quiz_questions q ON q.id = a.question_id WHERE a.attempt_id = ? ORDER BY a.question_id`).bind(attemptId).all()).results;
  return rows.map(r => ({ question_id: r.question_id, choice: r.choice_index, correct: !!r.is_correct, correct_index: r.correct_index, explanation: r.explanation, source: r.source }));
}

// POST /api/quiz/attempts  { level, attempt_key, answers:[{question_id, choice}] }
export async function submitAttempt(request, env) {
  const p = await requireParticipant(request, env);
  if (!(await rateLimit(env.DB, 'att:' + p.id, 60, 3600))) throw new HttpError(429, 'RATE_LIMIT', 'Terlalu banyak percobaan. Coba lagi nanti.');
  const body = await readJson(request, 30000);
  const level = intIn(body.level, 1, 5);
  if (!level) throw new HttpError(400, 'BAD_LEVEL', 'Level harus 1-5.');
  if (!validKey(body.attempt_key)) throw new HttpError(400, 'BAD_KEY', 'attempt_key tidak valid.');
  if (!Array.isArray(body.answers)) throw new HttpError(400, 'BAD_ANSWERS', 'answers harus berupa array.');

  // Pengiriman ulang dengan kunci sama -> kembalikan hasil tersimpan (tidak membuat percobaan baru)
  const dup = await env.DB.prepare('SELECT * FROM quiz_attempts WHERE participant_id = ? AND attempt_key = ?').bind(p.id, body.attempt_key).first();
  if (dup) return json({ duplicate: true, attempt: shape(dup), results: await resultsFor(env.DB, dup.id) });

  assertUnlocked(level, await passedLevels(env.DB, p.id));
  const qs = (await env.DB.prepare('SELECT id, correct_index FROM quiz_questions WHERE level = ? AND active = 1').bind(level).all()).results;
  if (!qs.length) throw new HttpError(404, 'NO_QUESTIONS', 'Soal level ini belum tersedia.');
  const given = new Map();
  for (const a of body.answers) {
    if (!a || typeof a.question_id !== 'string' || !intIn(a.choice, 0, 3) && a.choice !== 0) throw new HttpError(400, 'BAD_ANSWERS', 'Format jawaban tidak valid.');
    if (given.has(a.question_id)) throw new HttpError(400, 'DUP_ANSWER', 'Jawaban ganda untuk satu soal.');
    given.set(a.question_id, a.choice);
  }
  if (given.size !== qs.length || !qs.every(q => given.has(q.id))) throw new HttpError(400, 'INCOMPLETE', 'Semua soal level ini harus dijawab.');

  const threshold = await getThreshold(env.DB);
  const correct = qs.filter(q => given.get(q.id) === q.correct_index).length;
  const percent = Math.round((correct / qs.length) * 1000) / 10;
  const passed = percent >= threshold ? 1 : 0;
  const stmts = [env.DB.prepare('INSERT INTO quiz_attempts(participant_id, level, attempt_key, correct_count, total_count, percent, passed, threshold_percent) VALUES (?,?,?,?,?,?,?,?)').bind(p.id, level, body.attempt_key, correct, qs.length, percent, passed, threshold)];
  for (const q of qs) stmts.push(env.DB.prepare('INSERT INTO quiz_answers(attempt_id, question_id, choice_index, is_correct) SELECT id, ?, ?, ? FROM quiz_attempts WHERE participant_id = ? AND attempt_key = ?').bind(q.id, given.get(q.id), given.get(q.id) === q.correct_index ? 1 : 0, p.id, body.attempt_key));
  await env.DB.batch(stmts);
  const row = await env.DB.prepare('SELECT * FROM quiz_attempts WHERE participant_id = ? AND attempt_key = ?').bind(p.id, body.attempt_key).first();
  return json({ duplicate: false, attempt: shape(row), results: await resultsFor(env.DB, row.id) }, 201);
}
const shape = r => ({ level: r.level, correct: r.correct_count, total: r.total_count, percent: r.percent, passed: !!r.passed, threshold_percent: r.threshold_percent, created_at: r.created_at });
