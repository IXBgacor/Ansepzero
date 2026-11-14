import { HttpError, json, readJson, intIn, randomToken } from '../lib/util.js';
import { requireAdmin } from '../lib/auth.js';
import { board } from './leaderboard.js';

const page = url => { const s = new URL(url).searchParams; return { limit: Math.min(Math.max(parseInt(s.get('limit')) || 50, 1), 200), offset: Math.max(parseInt(s.get('offset')) || 0, 0) }; };
const audit = (db, id, a, d) => db.prepare('INSERT INTO audit_logs(admin_id, action, detail) VALUES (?,?,?)').bind(id, a, d || null).run();

export async function leaderboard(request, env) { await requireAdmin(request, env); return json(await board(env.DB, { publicOnly: false, limit: 50 })); }

export async function quizAttempts(request, env) {
  await requireAdmin(request, env); const { limit, offset } = page(request.url);
  const r = await env.DB.prepare('SELECT a.id, p.display_name AS name, a.level, a.correct_count, a.total_count, a.percent, a.passed, a.threshold_percent, a.created_at FROM quiz_attempts a JOIN participants p ON p.id = a.participant_id ORDER BY a.id DESC LIMIT ? OFFSET ?').bind(limit, offset).all();
  return json({ attempts: r.results });
}
export async function gameScores(request, env) {
  await requireAdmin(request, env); const { limit, offset } = page(request.url);
  const r = await env.DB.prepare('SELECT g.id, p.display_name AS name, g.game_version, g.score, g.max_score, g.stars, g.missions_done, g.finished, g.created_at FROM game_scores g JOIN participants p ON p.id = g.participant_id ORDER BY g.id DESC LIMIT ? OFFSET ?').bind(limit, offset).all();
  return json({ scores: r.results });
}

// ---- Bank soal ----
function validQuestion(b, partial) {
  const out = {};
  if (!partial || 'question' in b) { if (typeof b.question !== 'string' || b.question.trim().length < 5 || b.question.length > 300) throw new HttpError(400, 'BAD_QUESTION', 'Pertanyaan 5-300 karakter.'); out.question = b.question.trim(); }
  if (!partial || 'choices' in b) {
    if (!Array.isArray(b.choices) || b.choices.length !== 4 || b.choices.some(c => typeof c !== 'string' || !c.trim() || c.length > 160) || new Set(b.choices.map(c => c.trim())).size !== 4) throw new HttpError(400, 'BAD_CHOICES', 'Harus 4 pilihan berbeda (maks 160 karakter).');
    out.choices_json = JSON.stringify(b.choices.map(c => c.trim()));
  }
  if (!partial || 'correct_index' in b) { if (intIn(b.correct_index, 0, 3) === null) throw new HttpError(400, 'BAD_KEY', 'correct_index harus 0-3.'); out.correct_index = b.correct_index; }
  if (!partial || 'explanation' in b) { if (typeof b.explanation !== 'string' || b.explanation.trim().length < 5 || b.explanation.length > 500) throw new HttpError(400, 'BAD_EXPLANATION', 'Penjelasan 5-500 karakter.'); out.explanation = b.explanation.trim(); }
  if ('source' in b) out.source = typeof b.source === 'string' ? b.source.slice(0, 200) : null;
  if ('active' in b) { if (typeof b.active !== 'boolean') throw new HttpError(400, 'BAD_ACTIVE', 'active harus boolean.'); out.active = b.active ? 1 : 0; }
  return out;
}
export async function listQuestions(request, env) {
  await requireAdmin(request, env);
  const level = intIn(Number(new URL(request.url).searchParams.get('level')), 1, 5);
  const r = await (level ? env.DB.prepare('SELECT * FROM quiz_questions WHERE level = ? ORDER BY id').bind(level) : env.DB.prepare('SELECT * FROM quiz_questions ORDER BY id')).all();
  return json({ questions: r.results.map(q => ({ ...q, choices: JSON.parse(q.choices_json), choices_json: undefined, active: !!q.active })) });
}
export async function createQuestion(request, env) {
  const a = await requireAdmin(request, env); const b = await readJson(request, 5000);
  const level = intIn(b.level, 1, 5); if (!level) throw new HttpError(400, 'BAD_LEVEL', 'Level harus 1-5.');
  const q = validQuestion(b, false); const id = `L${level}-X${randomToken(3)}`;
  await env.DB.prepare('INSERT INTO quiz_questions(id, level, question, choices_json, correct_index, explanation, source, active) VALUES (?,?,?,?,?,?,?,?)').bind(id, level, q.question, q.choices_json, q.correct_index, q.explanation, q.source ?? null, q.active ?? 1).run();
  await audit(env.DB, a.id, 'question_create', id); return json({ id }, 201);
}
export async function updateQuestion(request, env, id) {
  const a = await requireAdmin(request, env); const b = await readJson(request, 5000);
  if (!(await env.DB.prepare('SELECT 1 x FROM quiz_questions WHERE id = ?').bind(id).first())) throw new HttpError(404, 'NOT_FOUND', 'Soal tidak ditemukan.');
  const q = validQuestion(b, true); const keys = Object.keys(q);
  if (!keys.length) throw new HttpError(400, 'EMPTY', 'Tidak ada perubahan.');
  await env.DB.prepare(`UPDATE quiz_questions SET ${keys.map(k => k + ' = ?').join(', ')} WHERE id = ?`).bind(...keys.map(k => q[k]), id).run(); // nama kolom dari daftar tetap di atas, bukan input
  await audit(env.DB, a.id, 'question_update', id); return json({ ok: true });
}

// ---- Pengaturan ----
export async function getSettings(request, env) { await requireAdmin(request, env); return json({ pass_percent: Number((await env.DB.prepare("SELECT value FROM app_settings WHERE key='pass_percent'").first()).value) }); }
export async function setSettings(request, env) {
  const a = await requireAdmin(request, env); const b = await readJson(request, 200);
  const v = intIn(b.pass_percent, 50, 100); if (v === null) throw new HttpError(400, 'BAD_THRESHOLD', 'Ambang kelulusan 50-100.');
  await env.DB.prepare("UPDATE app_settings SET value = ? WHERE key = 'pass_percent'").bind(String(v)).run();
  await audit(env.DB, a.id, 'threshold_set', String(v)); return json({ pass_percent: v });
}

// ---- Ekspor CSV (nama tampilan saja; sel diawali = + - @ dinetralkan) ----
const cell = v => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
export async function exportCsv(request, env) {
  const a = await requireAdmin(request, env);
  const type = new URL(request.url).searchParams.get('type');
  let head, rows;
  if (type === 'quiz') { head = ['nama_tampilan', 'level', 'benar', 'total', 'persen', 'lulus', 'waktu']; rows = (await env.DB.prepare('SELECT p.display_name n, a.level, a.correct_count, a.total_count, a.percent, a.passed, a.created_at FROM quiz_attempts a JOIN participants p ON p.id=a.participant_id ORDER BY a.id').all()).results.map(r => [r.n, r.level, r.correct_count, r.total_count, r.percent, r.passed, r.created_at]); }
  else if (type === 'game') { head = ['nama_tampilan', 'versi', 'skor', 'skor_maks', 'bintang', 'misi', 'tamat', 'waktu']; rows = (await env.DB.prepare('SELECT p.display_name n, g.game_version, g.score, g.max_score, g.stars, g.missions_done, g.finished, g.created_at FROM game_scores g JOIN participants p ON p.id=g.participant_id ORDER BY g.id').all()).results.map(r => [r.n, r.game_version, r.score, r.max_score, r.stars, r.missions_done, r.finished, r.created_at]); }
  else throw new HttpError(400, 'BAD_TYPE', 'type harus quiz atau game.');
  await audit(env.DB, a.id, 'export', type);
  return new Response([head, ...rows].map(r => r.map(cell).join(',')).join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="ansepzero-${type}.csv"`, 'Cache-Control': 'no-store' } });
}
