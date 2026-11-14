import { CONFIG } from '../js/config.js';
import { h, loading, errorBox, empty, toast, fmtDate } from '../js/ui.js';

const app = document.getElementById('app'), outBtn = document.getElementById('out');
const TK = 'az.admin';
const tok = () => sessionStorage.getItem(TK);
async function call(path, { method = 'GET', body, raw } = {}) {
  if (!CONFIG.API_BASE) throw new Error('API_BASE belum diisi di js/config.js.');
  let res; try { res = await fetch(CONFIG.API_BASE + path, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(tok() ? { Authorization: 'Bearer ' + tok() } : {}) }, body: body ? JSON.stringify(body) : undefined }); } catch { throw new Error('Tidak dapat terhubung ke server.'); }
  if (raw && res.ok) return res;
  const d = await res.json().catch(() => null);
  if (res.status === 401 && tok()) { sessionStorage.removeItem(TK); login('Sesi berakhir. Silakan masuk lagi.'); throw new Error('Sesi berakhir.'); }
  if (!res.ok) throw new Error(d?.error?.message || 'Permintaan gagal.'); return d;
}
function login(msg) {
  outBtn.style.display = 'none'; const u = h('input', { id: 'u', autocomplete: 'username', required: true }), p = h('input', { id: 'p', type: 'password', autocomplete: 'current-password', required: true }), m = h('div', null, msg ? h('div', { class: 'note err', role: 'alert' }, msg) : null);
  const f = h('form', { class: 'card', style: 'max-width:420px;margin:2rem auto' }, h('h1', { style: 'font-size:1.5rem' }, 'Masuk admin'), h('label', { for: 'u' }, 'Username'), u, h('label', { for: 'p' }, 'Kata sandi'), p, m, h('div', { class: 'row' }, h('button', { class: 'btn', type: 'submit' }, 'Masuk')));
  f.addEventListener('submit', async e => { e.preventDefault(); m.replaceChildren(); try { const r = await call('/api/admin/login', { method: 'POST', body: { username: u.value, password: p.value } }); sessionStorage.setItem(TK, r.token); sessionStorage.setItem(TK + '.role', r.role); shell(); } catch (er) { m.replaceChildren(h('div', { class: 'note err', role: 'alert' }, er.message)); } });
  app.replaceChildren(f);
}
outBtn.addEventListener('click', async () => { try { await call('/api/admin/logout', { method: 'POST' }); } catch {} sessionStorage.removeItem(TK); login(); });

const TABS = [['ringkasan', 'Ringkasan', ringkasan], ['peringkat', 'Peringkat', peringkat], ['percobaan', 'Percobaan kuis', percobaan], ['game', 'Skor game', gameScores], ['soal', 'Bank soal', soal], ['pengaturan', 'Pengaturan', pengaturan], ['akun', 'Akun admin', akun]];
function shell() {
  outBtn.style.display = ''; const panel = h('div'), tabs = h('div', { class: 'tabs', role: 'tablist' });
  const open = async (k, fn) => { [...tabs.children].forEach(b => b.setAttribute('aria-selected', String(b.dataset.k === k))); panel.replaceChildren(loading()); try { panel.replaceChildren(await fn()); } catch (e) { panel.replaceChildren(errorBox(e.message, () => open(k, fn))); } };
  TABS.forEach(([k, t, fn]) => tabs.append(h('button', { class: 'btn sec', role: 'tab', 'data-k': k, onclick: () => open(k, fn) }, t)));
  app.replaceChildren(tabs, panel); open('ringkasan', ringkasan);
}
const table = (cols, rows) => rows.length ? h('div', { class: 'tw' }, h('table', null, h('thead', null, h('tr', null, ...cols.map(c => h('th', null, c)))), h('tbody', null, ...rows.map(r => h('tr', null, ...r.map(x => h('td', null, x))))))) : empty('Belum ada data.');
const yn = v => v ? 'Ya' : 'Tidak';

function bars(title, data, key) {
  if (!data.length) return h('div', { class: 'card' }, h('h3', null, title), empty('Belum ada data.'));
  const max = Math.max(...data.map(d => d[key])), W = 600, H = 140, bw = Math.max(6, Math.floor(W / data.length) - 4);
  const ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg'); s.setAttribute('viewBox', `0 0 ${W} ${H + 24}`); s.setAttribute('role', 'img'); s.setAttribute('aria-label', title);
  data.forEach((d, i) => { const r = document.createElementNS(ns, 'rect'), hh = Math.max(2, d[key] / max * H); r.setAttribute('x', i * (bw + 4)); r.setAttribute('y', H - hh); r.setAttribute('width', bw); r.setAttribute('height', hh); r.setAttribute('fill', '#2f7d4f'); const t = document.createElementNS(ns, 'title'); t.textContent = d.d + ': ' + d[key]; r.append(t); s.append(r); });
  return h('div', { class: 'card' }, h('h3', null, title + ' (30 hari terakhir)'), s, h('p', { class: 'hint' }, data[0].d + ' s.d. ' + data.at(-1).d + ' | puncak: ' + max));
}
async function ringkasan() {
  const [o, b] = await Promise.all([call('/api/admin/overview'), call('/api/admin/settings')]); const c = o.comprehension;
  return h('div', null, h('p', { class: 'hint' }, 'Diperbarui: ' + new Date(o.updated_at).toLocaleString('id-ID') + ' | Periode: ' + o.period),
    h('div', { class: 'kpi' }, ...[['Peserta unik', o.participants_unique], ['Percobaan kuis', o.quiz.attempts], ['Peserta mengerjakan kuis', o.quiz.participants_with_attempt], ['Sesi game (skor terkirim)', o.game.sessions], ['Game tamat', o.game.finished_sessions], ['Sertifikat kuis', o.certificates.quiz || 0], ['Sertifikat game', o.certificates.game || 0], ['Ambang lulus', o.threshold_percent + '%']].map(([t, v]) => h('div', { class: 'card' }, h('b', null, v), t))),
    h('div', { class: 'card', style: 'margin-top:1rem' }, h('h3', null, 'Persentase pemahaman'), c.percent == null ? h('p', null, 'Belum ada data') : h('p', null, h('strong', { style: 'font-size:1.6rem' }, c.percent + '%'), ' = ' + c.numerator + ' / ' + c.denominator + ' x 100%'), h('p', { class: 'hint' }, c.definition + '. Statistik game terpisah dan tidak dipakai sebagai bukti pemahaman.')),
    h('h3', null, 'Per level'), table(['Level', 'Percobaan', 'Peserta', 'Peserta lulus'], o.quiz.per_level.map(l => [l.level, l.attempts, l.people, l.passed_people])),
    h('div', { class: 'grid' }, bars('Percobaan kuis per hari', o.daily.quiz_attempts, 'attempts'), bars('Sesi game per hari', o.daily.game_sessions, 'sessions')),
    h('div', { class: 'card' }, h('h3', null, 'Status sistem'), h('p', null, 'Backend: terhubung | Database: ' + o.database + ' | Akun admin aktif: ' + o.admins.active + '/' + o.admins.max)),
    h('div', { class: 'row' }, h('button', { class: 'btn sec', onclick: () => dl('quiz') }, 'Ekspor CSV kuis'), h('button', { class: 'btn sec', onclick: () => dl('game') }, 'Ekspor CSV game')));
}
async function dl(type) { try { const r = await call('/api/admin/export?type=' + type, { raw: true }); const a = h('a', { href: URL.createObjectURL(await r.blob()), download: 'ansepzero-' + type + '.csv' }); document.body.append(a); a.click(); a.remove(); } catch (e) { toast(e.message); } }
async function peringkat() { const d = await call('/api/admin/leaderboard'); return h('div', null, h('p', { class: 'hint' }, 'Admin melihat semua peserta (nama tampilan). Peringkat publik hanya peserta yang opt-in.'), h('h3', null, 'Kuis'), table(['#', 'Nama', 'Level lulus', 'Rata-rata nilai terbaik'], d.quiz.map((r, i) => [i + 1, r.name, r.levels_passed + '/5', r.avg_best_percent + '%'])), h('h3', null, 'Game (tamat)'), table(['#', 'Nama', 'Skor', 'Persen', 'Bintang'], d.game.map((r, i) => [i + 1, r.name, r.score + '/' + r.max_score, r.percent + '%', r.stars]))); }
async function percobaan() { const d = await call('/api/admin/quiz-attempts?limit=100'); return table(['Waktu', 'Nama', 'Level', 'Skor', '%', 'Lulus'], d.attempts.map(a => [new Date(a.created_at).toLocaleString('id-ID'), a.name, a.level, a.correct_count + '/' + a.total_count, a.percent, yn(a.passed)])); }
async function gameScores() { const d = await call('/api/admin/game-scores?limit=100'); return table(['Waktu', 'Nama', 'Versi', 'Skor', 'Bintang', 'Misi', 'Tamat'], d.scores.map(s => [new Date(s.created_at).toLocaleString('id-ID'), s.name, s.game_version, s.score + '/' + s.max_score, s.stars, s.missions_done, yn(s.finished)])); }

async function soal() {
  const wrap = h('div'), lv = h('select', { 'aria-label': 'Level' }, ...[1, 2, 3, 4, 5].map(l => h('option', { value: l }, 'Level ' + l)));
  const list = h('div'); async function load() { list.replaceChildren(loading()); try { const d = await call('/api/admin/questions?level=' + lv.value); const act = d.questions.filter(q => q.active).length; list.replaceChildren(h('p', { class: act === 20 ? 'hint' : 'note' }, 'Soal aktif: ' + act + (act === 20 ? '' : ' (standar 20 per level)')), ...d.questions.map(q => editor(q))); } catch (e) { list.replaceChildren(errorBox(e.message, load)); } }
  function editor(q) { const t = h('textarea', null, q.question), ch = q.choices.map(c => h('input', { value: c })), k = h('select', null, ...[0, 1, 2, 3].map(i => h('option', { value: i, selected: i === q.correct_index }, 'Kunci: ' + String.fromCharCode(65 + i)))), ex = h('textarea', null, q.explanation), act = h('input', { type: 'checkbox', checked: q.active });
    return h('details', { class: 'card' }, h('summary', null, (q.active ? '' : '[nonaktif] ') + q.id + ' - ' + q.question), h('label', null, 'Pertanyaan'), t, ...ch.map((c, i) => h('div', null, h('label', null, 'Pilihan ' + String.fromCharCode(65 + i)), c)), h('label', null, 'Kunci jawaban'), k, h('label', null, 'Penjelasan'), ex, h('label', { class: 'opt' }, act, 'Aktif'),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: async () => { try { await call('/api/admin/questions/' + q.id, { method: 'PATCH', body: { question: t.value, choices: ch.map(c => c.value), correct_index: Number(k.value), explanation: ex.value, active: act.checked } }); toast('Tersimpan.'); load(); } catch (e) { toast(e.message); } } }, 'Simpan'))); }
  const nt = h('textarea'), nc = [0, 1, 2, 3].map(() => h('input')), nk = h('select', null, ...[0, 1, 2, 3].map(i => h('option', { value: i }, 'Kunci: ' + String.fromCharCode(65 + i)))), ne = h('textarea');
  const add = h('details', { class: 'card' }, h('summary', null, 'Tambah soal baru'), h('label', null, 'Pertanyaan'), nt, ...nc.map((c, i) => h('div', null, h('label', null, 'Pilihan ' + String.fromCharCode(65 + i)), c)), h('label', null, 'Kunci'), nk, h('label', null, 'Penjelasan'), ne, h('div', { class: 'row' }, h('button', { class: 'btn', onclick: async () => { try { await call('/api/admin/questions', { method: 'POST', body: { level: Number(lv.value), question: nt.value, choices: nc.map(c => c.value), correct_index: Number(nk.value), explanation: ne.value } }); toast('Soal ditambahkan.'); load(); } catch (e) { toast(e.message); } } }, 'Tambah')));
  lv.addEventListener('change', load); wrap.append(h('div', { class: 'row' }, lv), add, list); load(); return wrap;
}
async function pengaturan() { const s = await call('/api/admin/settings'), v = h('input', { type: 'number', min: 50, max: 100, value: s.pass_percent });
  return h('div', { class: 'card' }, h('h3', null, 'Ambang kelulusan'), h('label', { for: 'pp' }, 'Persen minimal per level (50-100)'), Object.assign(v, { id: 'pp' }), h('p', { class: 'hint' }, 'Berlaku untuk percobaan berikutnya. Percobaan lama tetap memakai ambang saat dinilai. Pada 20 soal, 80% = minimal 16 benar.'), h('div', { class: 'row' }, h('button', { class: 'btn', onclick: async () => { try { await call('/api/admin/settings', { method: 'POST', body: { pass_percent: Number(v.value) } }); toast('Tersimpan.'); } catch (e) { toast(e.message); } } }, 'Simpan'))); }
async function akun() {
  if (sessionStorage.getItem(TK + '.role') !== 'superadmin') return h('div', { class: 'note' }, 'Hanya superadmin yang dapat mengelola akun admin.');
  const d = await call('/api/admin/users'), u = h('input', { autocomplete: 'off' }), p = h('input', { type: 'password', autocomplete: 'new-password' });
  return h('div', null, h('p', { class: 'hint' }, 'Maksimal ' + d.max_active + ' akun aktif (termasuk superadmin).'), table(['Username', 'Peran', 'Status', 'Aksi'], d.users.map(x => [x.username, x.role, x.active ? 'Aktif' : 'Nonaktif', x.role === 'superadmin' ? '-' : h('button', { class: 'btn sec', onclick: async () => { try { await call('/api/admin/users/' + x.id, { method: 'PATCH', body: { active: !x.active } }); shell(); } catch (e) { toast(e.message); } } }, x.active ? 'Nonaktifkan' : 'Aktifkan')])),
    h('div', { class: 'card' }, h('h3', null, 'Tambah admin'), h('label', null, 'Username (3-30: huruf, angka, _ . -)'), u, h('label', null, 'Kata sandi (min. 12 karakter)'), p, h('div', { class: 'row' }, h('button', { class: 'btn', onclick: async () => { try { await call('/api/admin/users', { method: 'POST', body: { username: u.value, password: p.value } }); toast('Akun dibuat.'); shell(); } catch (e) { toast(e.message); } } }, 'Buat akun'))));
}
tok() ? shell() : login();
