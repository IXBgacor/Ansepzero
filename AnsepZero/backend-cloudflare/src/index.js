import { HttpError, json, corsHeaders } from './lib/util.js';
import * as participants from './routes/participants.js';
import * as quiz from './routes/quiz.js';
import * as game from './routes/game.js';
import * as certs from './routes/certificates.js';
import * as admin from './routes/admin.js';
import * as lb from './routes/leaderboard.js';
import * as adm2 from './routes/admin2.js';

const routes = [
  ['GET', '/api/health', async (_r, env) => { await env.DB.prepare('SELECT 1').first(); return json({ status: 'ok', time: new Date().toISOString() }); }],
  ['POST', '/api/participants/session', participants.createSession],
  ['GET', '/api/quiz/progress', quiz.progress],
  ['GET', '/api/quiz/questions', quiz.questions],
  ['POST', '/api/quiz/attempts', quiz.submitAttempt],
  ['POST', '/api/game/scores', game.submitScore],
  ['GET', '/api/game/progress', game.gameProgress],
  ['POST', '/api/certificates/quiz', certs.issueQuiz],
  ['POST', '/api/certificates/game', certs.issueGame],
  ['GET', '/api/certificates/mine', certs.mine],
  ['GET', '/api/certificates/verify', certs.verify],
  ['POST', '/api/admin/login', admin.login],
  ['POST', '/api/admin/logout', admin.logout],
  ['GET', '/api/admin/overview', admin.overview],
  ['GET', '/api/admin/users', admin.listUsers],
  ['POST', '/api/admin/users', admin.createUser],
  ['GET', '/api/leaderboard', lb.publicBoard],
  ['POST', '/api/participants/leaderboard', lb.setVisibility],
  ['GET', '/api/admin/leaderboard', adm2.leaderboard],
  ['GET', '/api/admin/quiz-attempts', adm2.quizAttempts],
  ['GET', '/api/admin/game-scores', adm2.gameScores],
  ['GET', '/api/admin/questions', adm2.listQuestions],
  ['POST', '/api/admin/questions', adm2.createQuestion],
  ['GET', '/api/admin/settings', adm2.getSettings],
  ['POST', '/api/admin/settings', adm2.setSettings],
  ['GET', '/api/admin/export', adm2.exportCsv]
];

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    try {
      const m = url.pathname.match(/^\/api\/admin\/users\/(\d+)$/);
      if (m && request.method === 'PATCH') return withCors(await admin.setUserActive(request, env, Number(m[1])), cors);
      const qm = url.pathname.match(/^\/api\/admin\/questions\/([A-Za-z0-9-]{3,20})$/);
      if (qm && request.method === 'PATCH') return withCors(await adm2.updateQuestion(request, env, qm[1]), cors);
      const hit = routes.find(r => r[0] === request.method && r[1] === url.pathname);
      if (!hit) {
        const pathExists = routes.some(r => r[1] === url.pathname);
        throw new HttpError(pathExists ? 405 : 404, pathExists ? 'METHOD_NOT_ALLOWED' : 'NOT_FOUND', 'Endpoint tidak ditemukan.');
      }
      return withCors(await hit[2](request, env), cors);
    } catch (e) {
      if (e instanceof HttpError) return withCors(json({ error: { code: e.code, message: e.message } }, e.status), cors);
      console.error('Kesalahan tak terduga:', e && e.message); // tanpa stack, password, atau token
      return withCors(json({ error: { code: 'INTERNAL', message: 'Terjadi kesalahan pada server.' } }, 500), cors);
    }
  }
};
function withCors(res, cors) { for (const [k, v] of Object.entries(cors)) res.headers.set(k, v); return res; }
