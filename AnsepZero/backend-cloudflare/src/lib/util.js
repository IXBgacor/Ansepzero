// Utilitas umum: respons JSON, CORS, error terkontrol, kripto, rate limit.
export class HttpError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

export function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const h = { 'Vary': 'Origin' };
  if (origin && allowed.includes(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    h['Access-Control-Allow-Methods'] = 'GET, POST, PATCH, OPTIONS';
    h['Access-Control-Max-Age'] = '600';
  }
  return h;
}

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', ...extra }
  });
}

export async function readJson(request, maxBytes = 20000) {
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError(413, 'TOO_LARGE', 'Data terlalu besar.');
  try { return JSON.parse(text || '{}'); }
  catch { throw new HttpError(400, 'BAD_JSON', 'Format JSON tidak valid.'); }
}

const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
export async function sha256(text) { return hex(await crypto.subtle.digest('SHA-256', enc.encode(text))); }
export function randomToken(bytes = 32) { return hex(crypto.getRandomValues(new Uint8Array(bytes))); }

// PBKDF2-SHA256, 100.000 iterasi (batas maksimum di Workers).
export async function hashPassword(password, saltHex, iter = 100000) {
  const salt = saltHex ? Uint8Array.from(saltHex.match(/../g).map(h => parseInt(h, 16))) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256);
  return `pbkdf2$${iter}$${hex(salt)}$${hex(bits)}`;
}
export async function verifyPassword(password, stored) {
  const [, iter, salt] = stored.split('$');
  const again = await hashPassword(password, salt, Number(iter));
  return timingSafeEqual(again, stored);
}
export function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

const UUID = /^[0-9a-fA-F-]{16,64}$/;
export function validKey(v) { return typeof v === 'string' && UUID.test(v); }
export function cleanName(v) {
  if (typeof v !== 'string') return null;
  const s = v.normalize('NFKC').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim();
  return s.length >= 2 && s.length <= 30 ? s : null;
}
export function intIn(v, min, max) { return Number.isInteger(v) && v >= min && v <= max ? v : null; }

// Rate limit sederhana berbasis D1 (jendela tetap). Mengembalikan true bila masih boleh.
export async function rateLimit(db, key, limit, windowSec) {
  const now = Math.floor(Date.now() / 1000);
  const row = await db.prepare('SELECT window_start, count FROM rate_limits WHERE key = ?').bind(key).first();
  if (!row || now - row.window_start >= windowSec) {
    await db.prepare('INSERT INTO rate_limits(key, window_start, count) VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET window_start=excluded.window_start, count=1').bind(key, now).run();
    return true;
  }
  if (row.count >= limit) return false;
  await db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').bind(key).run();
  return true;
}
export const clientIp = r => r.headers.get('CF-Connecting-IP') || 'unknown';
