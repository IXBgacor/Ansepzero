import { CONFIG } from './config.js';
const SKEY = 'az.session';
export const apiReady = () => !!CONFIG.API_BASE;
export function getSession() { try { return JSON.parse(localStorage.getItem(SKEY)) || null; } catch { return null; } }
function saveSession(s) { try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch { /* penyimpanan diblokir */ } }
export function clearSession() { try { localStorage.removeItem(SKEY); } catch {} }

export class ApiError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }
export async function api(path, { method = 'GET', body, token } = {}) {
  if (!CONFIG.API_BASE) throw new ApiError(0, 'NO_API', 'Server AnsepZero belum dikonfigurasi (API_BASE kosong di js/config.js).');
  let res;
  try {
    res = await fetch(CONFIG.API_BASE + path, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  } catch { throw new ApiError(0, 'NETWORK', 'Tidak dapat terhubung ke server. Periksa koneksi internet.'); }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error?.code || 'ERROR', data?.error?.message || 'Permintaan gagal.');
  return data;
}
// Panggilan sebagai peserta. Bila token ditolak (sesi hilang di server), sesi lokal dibersihkan.
export async function pApi(path, opts = {}) {
  const s = getSession(); if (!s) throw new ApiError(401, 'NO_SESSION', 'Masukkan nama tampilan dahulu.');
  try { return await api(path, { ...opts, token: s.token }); }
  catch (e) { if (e.status === 401) clearSession(); throw e; }
}
export async function startSession(displayName) {
  const old = getSession();
  const client_id = old?.client_id || crypto.randomUUID();
  const r = await api('/api/participants/session', { method: 'POST', body: { client_id, display_name: displayName }, token: old?.token });
  saveSession({ client_id, token: r.token || old?.token, name: r.display_name });
  return getSession();
}
export async function sha256Hex(text) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
