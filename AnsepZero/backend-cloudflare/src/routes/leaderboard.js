import { json, readJson, HttpError } from '../lib/util.js';
import { requireParticipant } from '../lib/auth.js';

// Aturan peringkat (transparan):
// KUIS   : jumlah level lulus (terbanyak) > rata-rata nilai terbaik per level yang dikerjakan > peserta yang mendaftar lebih dulu.
// GAME   : hanya yang tamat; rasio skor/skor-maks dari skor TERBAIK > jumlah bintang > pendaftar lebih dulu.
// Kuis dan game dipisah. Publik hanya menampilkan peserta yang memilih tampil (opt-in), memakai nama tampilan.
export async function board(db, { publicOnly, limit }) {
  const w = publicOnly ? 'WHERE p.public_leaderboard = 1' : '';
  const quiz = (await db.prepare(
    `WITH best AS (SELECT participant_id, level, MAX(percent) bp, MAX(passed) ps FROM quiz_attempts GROUP BY participant_id, level)
     SELECT p.display_name AS name, SUM(best.ps) AS levels_passed, ROUND(AVG(best.bp),1) AS avg_best_percent
     FROM best JOIN participants p ON p.id = best.participant_id ${w}
     GROUP BY p.id ORDER BY levels_passed DESC, avg_best_percent DESC, p.id ASC LIMIT ?`).bind(limit).all()).results;
  const game = (await db.prepare(
    `SELECT p.display_name AS name, g.score, g.max_score, g.stars, MAX(1.0 * g.score / g.max_score) AS ratio
     FROM game_scores g JOIN participants p ON p.id = g.participant_id ${w ? w + ' AND' : 'WHERE'} g.finished = 1
     GROUP BY p.id ORDER BY ratio DESC, g.stars DESC, p.id ASC LIMIT ?`).bind(limit).all()).results
     .map(r => ({ name: r.name, score: r.score, max_score: r.max_score, stars: r.stars, percent: Math.round(r.ratio * 1000) / 10 }));
  return { quiz, game };
}
// GET /api/leaderboard (publik)
export async function publicBoard(request, env) { return json({ rules: 'Hanya peserta yang memilih tampil. Kuis: level lulus lalu rata-rata nilai terbaik. Game: skor terbaik (persen) peserta yang tamat.', ...(await board(env.DB, { publicOnly: true, limit: 20 })) }); }
// POST /api/participants/leaderboard { visible: boolean }
export async function setVisibility(request, env) {
  const p = await requireParticipant(request, env);
  const b = await readJson(request, 200);
  if (typeof b.visible !== 'boolean') throw new HttpError(400, 'BAD_BODY', 'visible harus boolean.');
  await env.DB.prepare('UPDATE participants SET public_leaderboard = ? WHERE id = ?').bind(b.visible ? 1 : 0, p.id).run();
  return json({ visible: b.visible });
}
