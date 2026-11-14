import { HttpError, json, readJson, hashPassword, verifyPassword, randomToken, sha256, rateLimit, clientIp } from '../lib/util.js';
import { requireAdmin } from '../lib/auth.js';
import { getThreshold } from './quiz.js';

const MAX_ADMINS = 5, SESSION_HOURS = 8;
const audit = (db, id, action, detail) => db.prepare('INSERT INTO audit_logs(admin_id, action, detail) VALUES (?,?,?)').bind(id, action, detail || null).run();
let dummyHash; // untuk menyamakan waktu saat username tidak ada

// POST /api/admin/login
export async function login(request, env) {
  const b = await readJson(request, 2000);
  const username = typeof b.username === 'string' ? b.username.trim().slice(0, 40) : '';
  const password = typeof b.password === 'string' ? b.password.slice(0, 200) : '';
  if (!(await rateLimit(env.DB, `login:${clientIp(request)}:${username.toLowerCase()}`, 8, 900))) throw new HttpError(429, 'RATE_LIMIT', 'Terlalu banyak percobaan login. Tunggu 15 menit.');
  const u = await env.DB.prepare('SELECT id, password_hash, role, username FROM admin_users WHERE username = ? AND active = 1').bind(username).first();
  dummyHash ||= await hashPassword('dummy-password');
  const ok = await verifyPassword(password, u ? u.password_hash : dummyHash);
  if (!u || !ok) throw new HttpError(401, 'BAD_LOGIN', 'Username atau kata sandi salah.');
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_HOURS * 3600e3).toISOString();
  await env.DB.prepare('INSERT INTO admin_sessions(token_hash, admin_id, expires_at) VALUES (?,?,?)').bind(await sha256(token), u.id, expires).run();
  await env.DB.prepare("DELETE FROM admin_sessions WHERE expires_at < strftime('%Y-%m-%dT%H:%M:%fZ','now')").run();
  await audit(env.DB, u.id, 'login');
  return json({ token, expires_at: expires, username: u.username, role: u.role });
}

// POST /api/admin/logout
export async function logout(request, env) {
  const a = await requireAdmin(request, env);
  const tok = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(await sha256(tok)).run();
  await audit(env.DB, a.id, 'logout');
  return json({ ok: true });
}

// GET /api/admin/overview
export async function overview(request, env) {
  await requireAdmin(request, env);
  const db = env.DB, one = async (sql) => (await db.prepare(sql).first());
  const threshold = await getThreshold(db);
  const participants = (await one('SELECT COUNT(*) n FROM participants')).n;
  const attempts = (await one('SELECT COUNT(*) n, COUNT(DISTINCT participant_id) people FROM quiz_attempts'));
  const perLevel = (await db.prepare('SELECT level, COUNT(*) attempts, COUNT(DISTINCT participant_id) people, COUNT(DISTINCT CASE WHEN passed=1 THEN participant_id END) passed_people FROM quiz_attempts GROUP BY level ORDER BY level').all()).results;
  const final = await one('SELECT COUNT(DISTINCT participant_id) den, COUNT(DISTINCT CASE WHEN percent >= ' + Number(threshold) + ' THEN participant_id END) num FROM quiz_attempts WHERE level = 5');
  const game = await one('SELECT COUNT(*) sessions, COUNT(DISTINCT participant_id) people, COALESCE(SUM(finished),0) finished FROM game_scores');
  const certs = (await db.prepare('SELECT type, COUNT(*) n FROM certificates GROUP BY type').all()).results;
  const daily = (await db.prepare("SELECT substr(created_at,1,10) d, COUNT(*) attempts FROM quiz_attempts WHERE created_at >= date('now','-29 days') GROUP BY d ORDER BY d").all()).results;
  const gdaily = (await db.prepare("SELECT substr(created_at,1,10) d, COUNT(*) sessions FROM game_scores WHERE created_at >= date('now','-29 days') GROUP BY d ORDER BY d").all()).results;
  const adminCount = (await one('SELECT COUNT(*) n FROM admin_users WHERE active = 1')).n;
  return json({
    updated_at: new Date().toISOString(), period: 'seluruh waktu', threshold_percent: threshold,
    participants_unique: participants, quiz: { attempts: attempts.n, participants_with_attempt: attempts.people, per_level: perLevel },
    comprehension: { definition: 'Peserta dengan nilai terbaik level 5 >= ambang / peserta yang pernah mengerjakan level 5',
      numerator: final.num, denominator: final.den, percent: final.den ? Math.round((final.num / final.den) * 1000) / 10 : null,
      label: final.den ? null : 'Belum ada data' },
    game: { sessions: game.sessions, participants: game.people, finished_sessions: game.finished, note: 'Statistik game dipisahkan dari indikator pemahaman kuis.' },
    certificates: Object.fromEntries(certs.map(c => [c.type, c.n])),
    daily: { quiz_attempts: daily, game_sessions: gdaily },
    admins: { active: adminCount, max: MAX_ADMINS }, database: 'ok'
  });
}

// GET /api/admin/users  (superadmin)
export async function listUsers(request, env) {
  await requireAdmin(request, env, { superOnly: true });
  return json({ users: (await env.DB.prepare('SELECT id, username, role, active, created_at FROM admin_users ORDER BY id').all()).results, max_active: MAX_ADMINS });
}

// POST /api/admin/users  (superadmin) { username, password }
export async function createUser(request, env) {
  const a = await requireAdmin(request, env, { superOnly: true });
  const b = await readJson(request, 2000);
  if (typeof b.username !== 'string' || !/^[a-zA-Z0-9_.-]{3,30}$/.test(b.username)) throw new HttpError(400, 'BAD_USERNAME', 'Username 3-30 karakter (huruf, angka, _ . -).');
  if (typeof b.password !== 'string' || b.password.length < 12 || b.password.length > 100) throw new HttpError(400, 'WEAK_PASSWORD', 'Kata sandi minimal 12 karakter.');
  const hash = await hashPassword(b.password);
  // Batas 5 akun aktif ditegakkan secara atomik di SQL
  let r;
  try {
    r = await env.DB.prepare("INSERT INTO admin_users(username, password_hash, role) SELECT ?, ?, 'admin' WHERE (SELECT COUNT(*) FROM admin_users WHERE active = 1) < ?").bind(b.username, hash, MAX_ADMINS).run();
  } catch { throw new HttpError(409, 'USERNAME_TAKEN', 'Username sudah dipakai.'); }
  if (r.meta.changes === 0) throw new HttpError(409, 'ADMIN_LIMIT', `Batas ${MAX_ADMINS} akun admin aktif tercapai.`);
  await audit(env.DB, a.id, 'admin_create', b.username);
  return json({ ok: true }, 201);
}

// PATCH /api/admin/users/:id  (superadmin) { active: boolean }
export async function setUserActive(request, env, id) {
  const a = await requireAdmin(request, env, { superOnly: true });
  const b = await readJson(request, 500);
  if (typeof b.active !== 'boolean') throw new HttpError(400, 'BAD_BODY', 'active harus boolean.');
  const u = await env.DB.prepare('SELECT id, role, username FROM admin_users WHERE id = ?').bind(id).first();
  if (!u) throw new HttpError(404, 'NOT_FOUND', 'Akun tidak ditemukan.');
  if (u.role === 'superadmin') throw new HttpError(400, 'PROTECTED', 'Superadmin tidak dapat dinonaktifkan.');
  if (b.active) {
    const r = await env.DB.prepare('UPDATE admin_users SET active = 1 WHERE id = ? AND (SELECT COUNT(*) FROM admin_users WHERE active = 1) < ?').bind(id, MAX_ADMINS).run();
    if (r.meta.changes === 0 && !(await env.DB.prepare('SELECT 1 x FROM admin_users WHERE id = ? AND active = 1').bind(id).first())) throw new HttpError(409, 'ADMIN_LIMIT', `Batas ${MAX_ADMINS} akun admin aktif tercapai.`);
  } else {
    await env.DB.batch([env.DB.prepare('UPDATE admin_users SET active = 0 WHERE id = ?').bind(id), env.DB.prepare('DELETE FROM admin_sessions WHERE admin_id = ?').bind(id)]);
  }
  await audit(env.DB, a.id, b.active ? 'admin_activate' : 'admin_deactivate', u.username);
  return json({ ok: true });
}
