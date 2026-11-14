import { h } from './ui.js';
import * as P from './pages.js';
import { quizPage, peringkat } from './quiz.js';
import { certPage } from './cert.js';

const NAV = [['#/', 'Beranda'], ['#/edukasi', 'Edukasi'], ['#/penyebab', 'Penyebab'], ['#/dampak', 'Dampak'], ['#/pencegahan', 'Pencegahan'], ['#/informasi', 'Informasi'], ['#/lapor', 'Lapor'], ['#/game', 'Game'], ['#/kuis', 'Kuis'], ['#/peringkat', 'Peringkat'], ['#/sertifikat', 'Sertifikat']];
const R = { '': r => P.home(r), edukasi: r => P.eduPage(r, 'edukasi'), penyebab: r => P.eduPage(r, 'penyebab'), dampak: r => P.eduPage(r, 'dampak'), pencegahan: r => P.eduPage(r, 'pencegahan'), informasi: P.info, lapor: P.lapor, game: P.game, kuis: quizPage, peringkat, sertifikat: certPage, tentang: P.tentang, referensi: P.referensi, privasi: P.privasi };
const app = document.getElementById('app'), nav = document.getElementById('nav'), btn = document.getElementById('menuBtn');
function route() {
  if (app._cleanup) { app._cleanup(); app._cleanup = null; }
  const path = (location.hash.replace(/^#\/?/, '').split('?')[0]) || '';
  [...nav.children].forEach(a => a.getAttribute('href') === '#/' + path || (path === '' && a.getAttribute('href') === '#/') ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false');
  try { (R[path] || P.notFound)(app); } catch (e) { console.error(e); app.replaceChildren(h('div', { class: 'note err' }, 'Halaman gagal dimuat. Muat ulang halaman.')); }
}
nav.append(...NAV.map(([href, t]) => h('a', { href }, t)));
btn.addEventListener('click', () => { const o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', String(o)); });
window.addEventListener('hashchange', route); route();
