import { h, crumb, setPage, loading, errorBox, fmtDate, toast } from './ui.js';
import { api, pApi, getSession, apiReady } from './api.js';
import { nameForm } from './quiz.js';

const starSvg = on => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'star'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('fill', on ? '#e0a52f' : 'none'); s.setAttribute('stroke', '#b8821b'); const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z'); s.append(p); return s; };

export function certView(c) {
  const g = c.type === 'game';
  return h('div', { class: 'certbox' }, h('div', { class: 'cert' + (g ? ' game' : ''), role: 'img', 'aria-label': 'Pratinjau sertifikat ' + c.name },
    h('div', null, h('img', { src: 'assets/logo.svg', alt: '' }), h('p', { class: 's' }, 'AnsepZero - Edukasi Karhutla')),
    h('div', null, h('p', { class: 't' }, g ? 'SERTIFIKAT PENYELESAIAN MISI PENJAGA HUTAN' : 'SERTIFIKAT KUIS PENJAGA HUTAN'), h('p', { class: 's' }, 'diberikan kepada'), h('p', { class: 'n' }, c.name),
      h('p', { class: 'd' }, g ? 'telah menyelesaikan simulasi edukasi pencegahan dan penanganan karhutla "Misi Penjaga Hutan" dengan skor ' + c.score + ' dari ' + c.max_score + ' dan perolehan bintang:' : 'telah menyelesaikan kelima level Kuis Penjaga Hutan AnsepZero (Dasar karhutla, Penyebab dan pencegahan, Dampak dan kesehatan, Keselamatan dan pelaporan, Evaluasi menyeluruh) dan memenuhi nilai kelulusan.'),
      g ? h('div', { style: 'margin-top:1cqw' }, ...[1, 2, 3].map(i => starSvg(i <= c.stars))) : null),
    h('div', null, h('p', { class: 'm' }, h('span', null, 'Tanggal: ' + fmtDate(c.issued_at)), h('span', null, 'Nomor: ' + c.cert_no)), h('p', { class: 'x' }, 'Sertifikat ini diterbitkan oleh platform edukasi AnsepZero dan bukan sertifikat resmi pemerintah atau sekolah. Verifikasi di halaman Sertifikat AnsepZero.'))));
}

// Hanya sertifikat yang dipilih yang dicetak (bagian lain disembunyikan lewat CSS print).
function printCert(section) {
  document.querySelectorAll('.print-host').forEach(x => x.classList.remove('print-host'));
  section.classList.add('print-host'); document.body.classList.add('print-one');
  window.addEventListener('afterprint', () => { document.body.classList.remove('print-one'); section.classList.remove('print-host'); }, { once: true });
  window.print();
}

export async function certPage(root) {
  setPage(root, crumb('Sertifikat'), h('h1', null, 'Sertifikat dan verifikasi'));
  const keep = () => [...root.children].slice(0, 2), mount = (...n) => root.replaceChildren(...keep(), ...n);
  const verifyBox = () => { const inp = h('input', { id: 'vn', placeholder: 'AZQ-2026-XXXX-XXXX', autocomplete: 'off', maxlength: 24 }), out = h('div', { 'aria-live': 'polite' });
    const f = h('form', { class: 'card' }, h('h2', null, 'Verifikasi nomor sertifikat'), h('label', { for: 'vn' }, 'Nomor sertifikat'), inp, h('div', { class: 'row' }, h('button', { class: 'btn', type: 'submit' }, 'Periksa')), out);
    f.addEventListener('submit', async e => { e.preventDefault(); out.replaceChildren(loading('Memeriksa...')); try { const r = await api('/api/certificates/verify?no=' + encodeURIComponent(inp.value.trim())); out.replaceChildren(r.valid ? h('div', { class: 'note ok' }, 'Valid. Atas nama ' + r.name + ', jenis ' + (r.type === 'quiz' ? 'kuis' : 'game') + ', terbit ' + fmtDate(r.issued_at) + '.') : h('div', { class: 'note err' }, 'Nomor tidak ditemukan.')); } catch (er) { out.replaceChildren(errorBox(er.message)); } });
    return f; };
  if (!apiReady()) return mount(errorBox('Server AnsepZero belum dikonfigurasi, sehingga sertifikat belum dapat diterbitkan atau diverifikasi.'));
  if (!getSession()) return mount(h('p', { class: 'prose' }, 'Sertifikat diterbitkan server setelah syarat terpenuhi. Mulai kuis atau mainkan game dengan nama tampilan yang sama di perangkat ini.'), nameForm(() => certPage(root), 'Masukkan nama tampilan'), verifyBox());
  mount(loading());
  let m; try { m = await pApi('/api/certificates/mine'); } catch (e) { return mount(errorBox(e.message, () => certPage(root)), verifyBox()); }
  const block = (type, label, hint) => {
    const c = m[type]; const out = h('div');
    const issue = async () => { try { const r = await pApi('/api/certificates/' + type, { method: 'POST' }); m[type] = r.certificate; certPage(root); } catch (e) { out.replaceChildren(h('div', { class: 'note err', role: 'alert' }, e.message)); } };
    return h('section', null, h('h2', null, label), c ? [certView(c), h('div', { class: 'row' }, h('button', { class: 'btn', onclick: ev => printCert(ev.target.closest('section')) }, 'Cetak / simpan PDF'), h('button', { class: 'btn sec', onclick: async () => { try { await navigator.clipboard.writeText(c.cert_no); toast('Nomor disalin.'); } catch { toast(c.cert_no); } } }, 'Salin nomor')), h('p', { class: 'hint' }, 'Pilih "Simpan sebagai PDF" pada dialog cetak. Atur kertas A4 lanskap.')]
      : [h('p', { class: 'hint' }, hint), h('button', { class: 'btn', onclick: issue }, 'Terbitkan sertifikat'), out]);
  };
  mount(block('quiz', 'Sertifikat kuis', 'Syarat: lulus kelima level kuis. Server memeriksa riwayatmu.'), block('game', 'Sertifikat game', 'Syarat: skor game berstatus tamat sudah tersimpan di cloud (mainkan sampai tamat di halaman Game dengan nama tampilan yang sama).'), verifyBox());
}
