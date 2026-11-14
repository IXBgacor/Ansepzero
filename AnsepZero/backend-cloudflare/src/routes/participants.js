import { HttpError, json, readJson, validKey, cleanName, randomToken, sha256, rateLimit, clientIp } from '../lib/util.js';

// POST /api/participants/session
export async function createSession(request, env) {
  if (!(await rateLimit(env.DB, 'sess:' + clientIp(request), 30, 3600))) throw new HttpError(429, 'RATE_LIMIT', 'Terlalu banyak permintaan. Coba lagi nanti.');
  const body = await readJson(request);
  const name = cleanName(body.display_name);
  if (!validKey(body.client_id)) throw new HttpError(400, 'BAD_CLIENT_ID', 'client_id tidak valid.');
  if (!name) throw new HttpError(400, 'BAD_NAME', 'Nama tampilan 2-30 karakter.');

  const existing = await env.DB.prepare('SELECT id, token_hash, display_name FROM participants WHERE client_id = ?').bind(body.client_id).first();
  if (existing) {
    const tok = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
    if (!tok || (await sha256(tok)) !== existing.token_hash) throw new HttpError(409, 'CLIENT_EXISTS', 'Sesi sudah ada; gunakan token yang tersimpan.');
    if (existing.display_name !== name) await env.DB.prepare('UPDATE participants SET display_name = ? WHERE id = ?').bind(name, existing.id).run();
    return json({ created: false, display_name: name });
  }
  const token = randomToken();
  try {
    await env.DB.prepare('INSERT INTO participants(client_id, token_hash, display_name) VALUES (?,?,?)').bind(body.client_id, await sha256(token), name).run();
  } catch (e) {
    throw new HttpError(409, 'CLIENT_EXISTS', 'Sesi sudah ada.');
  }
  return json({ created: true, display_name: name, token }, 201); // token hanya ditampilkan sekali
}
