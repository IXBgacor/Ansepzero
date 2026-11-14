import { HttpError, sha256 } from './util.js';

const bearer = r => (r.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();

export async function requireParticipant(request, env) {
  const token = bearer(request);
  if (!token) throw new HttpError(401, 'NO_TOKEN', 'Sesi peserta diperlukan.');
  const p = await env.DB.prepare('SELECT id, display_name FROM participants WHERE token_hash = ?').bind(await sha256(token)).first();
  if (!p) throw new HttpError(401, 'BAD_TOKEN', 'Sesi peserta tidak valid.');
  await env.DB.prepare("UPDATE participants SET last_seen_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?").bind(p.id).run();
  return p;
}

export async function requireAdmin(request, env, { superOnly = false } = {}) {
  const token = bearer(request);
  if (!token) throw new HttpError(401, 'NO_TOKEN', 'Login admin diperlukan.');
  const a = await env.DB.prepare(
    `SELECT u.id, u.username, u.role FROM admin_sessions s JOIN admin_users u ON u.id = s.admin_id
     WHERE s.token_hash = ? AND s.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now') AND u.active = 1`
  ).bind(await sha256(token)).first();
  if (!a) throw new HttpError(401, 'BAD_TOKEN', 'Sesi admin tidak valid atau kedaluwarsa.');
  if (superOnly && a.role !== 'superadmin') throw new HttpError(403, 'FORBIDDEN', 'Hanya superadmin.');
  return a;
}
