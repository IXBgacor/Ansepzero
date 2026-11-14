import { h, icon, crumb, setPage, loading, errorBox, empty, toast } from './ui.js';
import { api, pApi, getSession, startSession, apiReady } from './api.js';

export function nameForm(onDone, title = 'Masukkan nama tampilan') {
  const inp = h('input', { id: 'dn', maxlength: 30, minlength: 2, autocomplete: 'nickname', required: true }), msg = h('div');
  const f = h('form', { class: 'card' }, h('h3', null, title), h('label', { for: 'dn' }, 'Nama tampilan atau alias'), inp,
    h('p', { class: 'hint' }, '2-30 karakter. Gunakan alias, bukan nama lengkap. Nama ini tampil di sertifikat. Tidak perlu email, telepon, atau lokasi.'), msg, h('button', { class: 'btn', type: 'submit' }, 'Lanjut'));
  f.addEventListener('submit', async e => { e.preventDefault(); msg.replaceChildren(); const v = inp.value.trim();
    if (v.length < 2) { msg.append(h('div', { class: 'note err', role: 'alert' }, 'Nama minimal 2 karakter.')); return; }
    if (!apiReady()) { msg.append(errorBox('Server AnsepZero belum dikonfigurasi (API_BASE kosong di js/config.js).')); return; }
    try { await startSession(v); onDone(); } catch (er) { msg.append(errorBox(er.message)); } });
  return f;
}

export async function quizPage(root) {
  setPage(root, crumb('Kuis'), h('h1', null, 'Kuis Penjaga Hutan'), loading());
  const body = root.lastChild;
  const mount = (...nodes) => { const keep = [...root.children].slice(0, 2); root.replaceChildren(...keep, ...nodes); };
  if (!apiReady()) return mount(errorBox('Server AnsepZero belum dikonfigurasi, sehingga kuis (yang dinilai server) belum dapat dipakai. Lihat docs/PANDUAN-EDGEONE.md untuk mengisi API_BASE.'));
  if (!getSession()) return mount(h('p', { class: 'prose' }, 'Kuis terdiri dari 5 level, masing-masing 20 soal. Lulus satu level (nilai minimal sesuai ambang) untuk membuka level berikutnya. Setiap percobaan dicatat.'), nameForm(() => quizPage(root), 'Mulai kuis'));
  dashboard();

  async function dashboard() {
    mount(loading());
    let pr; try { pr = await pApi('/api/quiz/progress'); } catch (e) { if (e.status === 401) return quizPage(root); return mount(errorBox(e.message, dashboard)); }
    const NAMES = ['Dasar karhutla', 'Penyebab dan pencegahan', 'Dampak dan kesehatan', 'Keselamatan dan pelaporan', 'Evaluasi menyeluruh'];
    mount(h('p', { class: 'prose' }, 'Halo, ', h('strong', null, pr.display_name), '. Nilai minimal lulus per level: ', h('strong', null, pr.threshold_percent + '%'), '. Level berikutnya terbuka setelah level sebelumnya lulus.'),
      h('div', { class: 'grid' }, ...pr.levels.map(l => h('div', { class: 'card' }, h('span', { class: 'badge ' + (l.passed ? 'ok' : (l.unlocked ? '' : 'lock')) }, l.passed ? 'Lulus' : l.unlocked ? 'Terbuka' : 'Terkunci'),
        h('h3', null, 'Level ' + l.level + ': ' + NAMES[l.level - 1]), h('p', { class: 'hint' }, 'Percobaan: ' + l.attempts + (l.best_percent != null ? ' | Nilai terbaik: ' + l.best_percent + '%' : '')),
        h('button', { class: 'btn', disabled: !l.unlocked, onclick: () => start(l.level) }, l.attempts ? 'Ulangi level' : 'Mulai level')))),
      pr.all_passed ? h('div', { class: 'note ok' }, 'Semua level lulus. ', h('a', { href: '#/sertifikat' }, 'Ambil sertifikat kuis')) : null,
      h('p', null, h('a', { href: '#/peringkat' }, 'Lihat papan peringkat')));
  }

  async function start(level) {
    mount(loading('Memuat soal...'));
    let data; try { data = await pApi('/api/quiz/questions?level=' + level); } catch (e) { return mount(errorBox(e.message, () => start(level))); }
    const qs = data.questions.map(q => q).sort(() => Math.random() - 0.5), answers = {}, attemptKey = crypto.randomUUID();
    let i = 0;
    const show = () => {
      const q = qs[i], chosen = answers[q.id];
      mount(h('p', { class: 'hint' }, 'Level ' + level + ' - soal ' + (i + 1) + ' dari ' + qs.length), h('div', { class: 'prog', role: 'progressbar', 'aria-valuenow': i + 1, 'aria-valuemax': qs.length }, h('i', { style: 'width:' + ((i + 1) / qs.length * 100) + '%' })),
        h('h2', null, q.question), h('div', { class: 'opts', role: 'radiogroup', 'aria-label': 'Pilihan jawaban' }, ...q.choices.map((c, k) => h('label', { class: 'opt' }, h('input', { type: 'radio', name: 'c', value: k, checked: chosen === k, onchange: () => { answers[q.id] = k; show(); } }), h('span', null, String.fromCharCode(65 + k) + '. ' + c)))),
        h('div', { class: 'row' }, h('button', { class: 'btn sec', disabled: i === 0, onclick: () => { i--; show(); } }, 'Sebelumnya'),
          i < qs.length - 1 ? h('button', { class: 'btn', disabled: chosen === undefined, onclick: () => { i++; show(); } }, 'Berikutnya') : h('button', { class: 'btn', disabled: Object.keys(answers).length < qs.length, onclick: submit }, 'Kirim jawaban')),
        h('p', { class: 'hint' }, 'Terjawab: ' + Object.keys(answers).length + ' dari ' + qs.length));
    };
    async function submit() {
      mount(loading('Menilai jawaban...'));
      try { const r = await pApi('/api/quiz/attempts', { method: 'POST', body: { level, attempt_key: attemptKey, answers: qs.map(q => ({ question_id: q.id, choice: answers[q.id] })) } }); result(level, qs, answers, r); }
      catch (e) { mount(errorBox(e.message + ' Jawabanmu masih tersimpan di halaman ini; kirim ulang tidak membuat percobaan ganda.', submit)); }
    }
    show();
  }

  function result(level, qs, answers, r) {
    const byId = Object.fromEntries(r.results.map(x => [x.question_id, x])), a = r.attempt;
    const wrong = qs.filter(q => !byId[q.id].correct);
    const item = q => { const x = byId[q.id]; return h('details', { class: 'card', open: !x.correct }, h('summary', null, h('span', { class: 'badge ' + (x.correct ? 'ok' : 'lock') }, x.correct ? 'Benar' : 'Salah'), ' ', q.question),
      h('div', { class: 'opts' }, ...q.choices.map((c, k) => h('div', { class: 'opt ' + (k === x.correct_index ? 'right' : (k === x.choice ? 'wrong' : '')) }, String.fromCharCode(65 + k) + '. ' + c + (k === x.correct_index ? ' (jawaban benar)' : (k === x.choice ? ' (jawabanmu)' : ''))))),
      h('p', null, h('strong', null, 'Pembahasan: '), x.explanation)); };
    mount(h('div', { class: 'note ' + (a.passed ? 'ok' : 'err'), role: 'status' }, h('h2', { style: 'margin:0' }, a.passed ? 'Lulus!' : 'Belum lulus'), h('p', null, 'Skor: ' + a.correct + ' dari ' + a.total + ' (' + a.percent + '%). Ambang kelulusan: ' + a.threshold_percent + '%.'), r.duplicate ? h('p', { class: 'hint' }, 'Ini hasil percobaan yang sama (tidak dihitung ganda).') : null),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => start(level) }, 'Ulangi level'), h('button', { class: 'btn sec', onclick: dashboard }, a.passed ? 'Ke daftar level' : 'Kembali ke daftar level'), level === 5 && a.passed ? h('a', { class: 'btn', href: '#/sertifikat' }, 'Ambil sertifikat') : null),
      h('h2', null, wrong.length ? 'Tinjau jawaban yang salah (' + wrong.length + ')' : 'Semua jawaban benar'), ...wrong.map(item),
      qs.length - wrong.length ? h('details', null, h('summary', null, 'Lihat jawaban yang benar (' + (qs.length - wrong.length) + ')'), ...qs.filter(q => byId[q.id].correct).map(item)) : null);
  }
}

export async function peringkat(root) {
  setPage(root, crumb('Peringkat'), h('h1', null, 'Papan peringkat'), loading());
  const keep = () => [...root.children].slice(0, 2);
  if (!apiReady()) return root.replaceChildren(...keep(), errorBox('Server AnsepZero belum dikonfigurasi.'));
  try {
    const d = await api('/api/leaderboard');
    const tbl = (cols, rows, mk) => rows.length ? h('div', { class: 'tw' }, h('table', null, h('thead', null, h('tr', null, h('th', null, '#'), ...cols.map(c => h('th', null, c)))), h('tbody', null, ...rows.map((r, i) => h('tr', null, h('td', null, i + 1), ...mk(r).map(x => h('td', null, x))))))) : empty('Belum ada peserta yang tampil.');
    const s = getSession(); const opt = s ? h('label', { class: 'opt' }, h('input', { type: 'checkbox', onchange: async e => { try { await pApi('/api/participants/leaderboard', { method: 'POST', body: { visible: e.target.checked } }); toast(e.target.checked ? 'Namamu tampil di peringkat.' : 'Namamu disembunyikan.'); peringkat(root); } catch (er) { e.target.checked = !e.target.checked; toast(er.message); } } }), h('span', null, 'Tampilkan nama tampilanku di papan peringkat publik (' + s.name + ')')) : h('p', { class: 'hint' }, 'Mulai kuis atau simpan skor game untuk memilih tampil di peringkat.');
    root.replaceChildren(...keep(), h('p', { class: 'prose hint' }, d.rules), opt, h('h2', null, 'Kuis'), tbl(['Nama', 'Level lulus', 'Rata-rata nilai terbaik'], d.quiz, r => [r.name, r.levels_passed + '/5', r.avg_best_percent + '%']), h('h2', null, 'Game Misi Penjaga Hutan'), tbl(['Nama', 'Skor', 'Persen', 'Bintang'], d.game, r => [r.name, r.score + '/' + r.max_score, r.percent + '%', r.stars + '/3']));
  } catch (e) { root.replaceChildren(...keep(), errorBox(e.message, () => peringkat(root))); }
}
