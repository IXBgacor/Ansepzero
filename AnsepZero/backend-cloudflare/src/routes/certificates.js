import { HttpError, json, randomToken, rateLimit, clientIp } from '../lib/util.js';
import { requireParticipant } from '../lib/auth.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newNo(type) {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const code = [...bytes].map(b => ALPHABET[b % 32]).join('');
  return `AZ${type === 'quiz' ? 'Q' : 'G'}-${new Date().getUTCFullYear()}-${code.slice(0, 4)}-${code.slice(4)}`;
}
async function insertCert(db, type, p, gameScoreId) {
  for (let i = 0; i < 5; i++) {
    try {
      await db.prepare('INSERT INTO certificates(cert_no, type, participant_id, name_snapshot, game_score_id) VALUES (?,?,?,?,?)').bind(newNo(type), type, p.id, p.display_name, gameScoreId).run();
      return;
    } catch (e) {
      const again = await db.prepare('SELECT 1 x FROM certificates WHERE participant_id = ? AND type = ?').bind(p.id, type).first();
      if (again) return; // sudah diterbitkan oleh permintaan paralel
    }
  }
  throw new HttpError(500, 'CERT_FAIL', 'Gagal menerbitkan sertifikat.');
}
async function view(db, pid, type) {
  const c = await db.prepare('SELECT c.cert_no, c.type, c.name_snapshot, c.issued_at, g.score, g.max_score, g.stars, g.missions_done FROM certificates c LEFT JOIN game_scores g ON g.id = c.game_score_id WHERE c.participant_id = ? AND c.type = ?').bind(pid, type).first();
  return c ? { cert_no: c.cert_no, type: c.type, name: c.name_snapshot, issued_at: c.issued_at, ...(c.type === 'game' ? { score: c.score, max_score: c.max_score, stars: c.stars, missions_done: c.missions_done } : { levels: 5 }) } : null;
}

// POST /api/certificates/quiz  -> hanya jika kelima level sudah lulus (dicek di server)
export async function issueQuiz(request, env) {
  const p = await requireParticipant(request, env);
  const r = await env.DB.prepare('SELECT COUNT(DISTINCT level) n FROM quiz_attempts WHERE participant_id = ? AND passed = 1').bind(p.id).first();
  if (r.n < 5) throw new HttpError(403, 'NOT_ELIGIBLE', 'Selesaikan dan lulus kelima level terlebih dahulu.');
  await insertCert(env.DB, 'quiz', p, null);
  return json({ certificate: await view(env.DB, p.id, 'quiz') });
}

// POST /api/certificates/game -> hanya jika ada skor game berstatus tamat di server
export async function issueGame(request, env) {
  const p = await requireParticipant(request, env);
  const g = await env.DB.prepare('SELECT id FROM game_scores WHERE participant_id = ? AND finished = 1 ORDER BY score DESC LIMIT 1').bind(p.id).first();
  if (!g) throw new HttpError(403, 'NOT_ELIGIBLE', 'Belum ada penyelesaian game yang tercatat di server.');
  await insertCert(env.DB, 'game', p, g.id);
  return json({ certificate: await view(env.DB, p.id, 'game') });
}

// GET /api/certificates/mine
export async function mine(request, env) {
  const p = await requireParticipant(request, env);
  return json({ quiz: await view(env.DB, p.id, 'quiz'), game: await view(env.DB, p.id, 'game') });
}

// GET /api/certificates/verify?no=...  (publik, data minimal)
export async function verify(request, env) {
  if (!(await rateLimit(env.DB, 'ver:' + clientIp(request), 60, 600))) throw new HttpError(429, 'RATE_LIMIT', 'Terlalu banyak pengecekan.');
  const no = (new URL(request.url).searchParams.get('no') || '').trim().toUpperCase();
  if (!/^AZ[QG]-\d{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(no)) throw new HttpError(400, 'BAD_NO', 'Format nomor sertifikat tidak valid.');
  const c = await env.DB.prepare('SELECT type, name_snapshot, issued_at FROM certificates WHERE cert_no = ?').bind(no).first();
  return json(c ? { valid: true, type: c.type, name: c.name_snapshot, issued_at: c.issued_at } : { valid: false });
}
