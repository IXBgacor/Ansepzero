import { HttpError, json, readJson, validKey, intIn, rateLimit } from '../lib/util.js';
import { requireParticipant } from '../lib/auth.js';

const MAX_SCORE_CAP = 100000, MAX_MISSIONS = 60;

// POST /api/game/scores
// Catatan: skor dari browser TIDAK antimanipulasi. Server hanya memeriksa rentang dan konsistensi.
export async function submitScore(request, env) {
  const p = await requireParticipant(request, env);
  if (!(await rateLimit(env.DB, 'game:' + p.id, 30, 3600))) throw new HttpError(429, 'RATE_LIMIT', 'Terlalu banyak pengiriman.');
  const b = await readJson(request);
  if (!validKey(b.submission_key)) throw new HttpError(400, 'BAD_KEY', 'submission_key tidak valid.');
  if (typeof b.game_version !== 'string' || !/^[0-9A-Za-z._-]{1,20}$/.test(b.game_version)) throw new HttpError(400, 'BAD_VERSION', 'game_version tidak valid.');
  const maxScore = intIn(b.max_score, 1, MAX_SCORE_CAP), score = maxScore === null ? null : intIn(b.score, 0, maxScore);
  const stars = intIn(b.stars, 0, 3), missions = intIn(b.missions_done, 0, MAX_MISSIONS);
  if (maxScore === null || score === null || stars === null || missions === null || typeof b.finished !== 'boolean')
    throw new HttpError(400, 'BAD_SCORE', 'Nilai skor, bintang, misi, atau status tidak valid.');
  if (b.finished && stars < 1) throw new HttpError(400, 'BAD_SCORE', 'Game tamat harus memiliki minimal 1 bintang.');
  const finishedAt = b.finished ? new Date().toISOString() : null; // waktu dari server, bukan dari klien

  const res = await env.DB.prepare('INSERT INTO game_scores(participant_id, submission_key, game_version, score, max_score, stars, missions_done, finished, finished_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(participant_id, submission_key) DO NOTHING')
    .bind(p.id, b.submission_key, b.game_version, score, maxScore, stars, missions, b.finished ? 1 : 0, finishedAt).run();
  const duplicate = res.meta.changes === 0;
  return json({ saved: true, duplicate }, duplicate ? 200 : 201);
}

// GET /api/game/progress  -> skor terbaik peserta
export async function gameProgress(request, env) {
  const p = await requireParticipant(request, env);
  const best = await env.DB.prepare('SELECT score, max_score, stars, missions_done, finished FROM game_scores WHERE participant_id = ? ORDER BY finished DESC, score DESC LIMIT 1').bind(p.id).first();
  return json({ best: best ? { ...best, finished: !!best.finished } : null });
}
