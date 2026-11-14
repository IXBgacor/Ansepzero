// Server API LOKAL untuk uji (BUKAN produksi): Worker yang sama + SQLite pengganti D1 (data hilang saat berhenti).
// Pakai: DEV_ADMIN_PASS='kata-sandi-uji-123' node --no-warnings tests/dev-server.mjs
import http from 'node:http';
import worker from '../src/index.js';
import { makeDB } from './d1-shim.mjs';
import { hashPassword } from '../src/lib/util.js';
const db = makeDB();
const pass = process.env.DEV_ADMIN_PASS || 'superadmin-uji-12345';
db._raw.prepare("INSERT INTO admin_users(username, password_hash, role) VALUES ('super', ?, 'superadmin')").run(await hashPassword(pass));
const env = { DB: db, ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:8080' };
http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks);
  const r = await worker.fetch(new Request('http://localhost:8787' + req.url, { method: req.method, headers: req.headers, body }), env);
  res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer()));
}).listen(8787, () => console.log('API uji di http://localhost:8787 (admin: super / ' + (process.env.DEV_ADMIN_PASS ? '[dari env]' : pass) + ')'));
