import { h, icon, crumb, setPage, toast, empty } from './ui.js';
import { PAGES, REFS } from './content.js';
import { CONFIG } from './config.js';
import { getSession, startSession, api, pApi, apiReady, sha256Hex } from './api.js';
import { nameForm } from './quiz.js';

const link = (href, text, cls = 'btn') => h('a', { class: cls, href }, text);
const ext = (href, text) => h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, text);

export function home(root) {
  setPage(root,
    h('section', { class: 'hero' }, h('div', null,
      h('h1', null, 'Cegah karhutla, jaga hutan, lindungi napas kita.'),
      h('p', null, 'AnsepZero adalah platform edukasi tentang kebakaran hutan dan lahan, kabut asap, pencegahan, dan keselamatan. Belajar, uji pemahamanmu, dan mainkan misi Penjaga Hutan.'),
      h('div', { class: 'row' }, link('#/kuis', 'Mulai kuis', 'btn'), link('#/game', 'Main Misi Penjaga Hutan', 'btn light'), link('#/edukasi', 'Pelajari dulu', 'btn ghost'))),
      h('img', { class: 'art', src: 'assets/logo.svg', alt: 'Logo AnsepZero: pohon dan api kecil dalam lingkaran hijau' })),
    h('h2', null, 'Mulai dari mana?'),
    h('div', { class: 'grid' },
      ...[['book', 'Edukasi karhutla', 'Pengertian, penyebab, dan dampak.', '#/edukasi'], ['shield', 'Pencegahan dan keselamatan', 'Apa yang dilakukan sebelum dan saat kebakaran.', '#/pencegahan'], ['quiz', 'Kuis Penjaga Hutan', '5 level, 100 soal, bersertifikat.', '#/kuis'], ['game', 'Misi Penjaga Hutan', 'Game petualangan pixel-art edukatif.', '#/game'], ['report', 'Lapor indikasi karhutla', 'Siapkan laporan ke petugas lewat WhatsApp.', '#/lapor'], ['news', 'Informasi terkini', 'Tautan ke sumber resmi.', '#/informasi']]
        .map(([i, t, d, href]) => h('a', { class: 'card', href, style: 'text-decoration:none;color:inherit' }, icon(i), h('h3', null, t), h('p', null, d)))),
    h('div', { class: 'note' }, h('strong', null, 'Melihat api atau asap yang tidak terkendali? '), 'Jauhi lokasi dan hubungi petugas melalui kontak resmi. ', link('#/lapor', 'Buka panduan pelaporan', 'btn sec')));
}

export function eduPage(root, key) {
  const p = PAGES[key];
  const more = Object.entries(PAGES).filter(([k]) => k !== key);
  setPage(root, crumb(p.title), h('h1', null, p.title), h('p', { class: 'prose' }, p.intro),
    h('div', { class: 'prose' }, ...p.sections.map(([t, ps]) => h('section', null, h('h2', null, t), ...ps.map(x => h('p', null, x))))),
    h('p', { class: 'hint' }, 'Sumber materi: lihat ', link('#/referensi', 'Referensi', ''), '.'),
    h('h2', null, 'Lanjut belajar'), h('div', { class: 'row' }, ...more.map(([k, v]) => link('#/' + k, v.title, 'btn sec')), link('#/kuis', 'Uji dengan kuis', 'btn')));
}

export function info(root) {
  setPage(root, crumb('Informasi terkini'), h('h1', null, 'Informasi terkini'),
    h('div', { class: 'note' }, h('strong', null, 'Status: belum diperbarui. '), 'AnsepZero belum terhubung ke feed atau API data resmi, sehingga tidak menampilkan berita, titik api, tingkat polusi, atau statistik daerah. Kami tidak membuat data sendiri.'),
    h('h2', null, 'Periksa langsung di sumber resmi'),
    h('ul', { class: 'prose' }, ...REFS.slice(0, 6).map(([t, u]) => h('li', null, ext(u, t)))),
    h('h2', null, 'Peta kerawanan karhutla Batola'),
    h('div', { class: 'card' }, icon('map'), h('p', null, 'Belum tersedia. Peta hanya akan ditampilkan bila memakai data resmi yang dapat dijelaskan sumber dan tanggal pembaruannya (misalnya data instansi di Satu Data Indonesia atau BPBD). Titik rawan tidak dikarang.')));
}

export function lapor(root) {
  const f = h('form', { novalidate: true });
  const loc = h('input', { id: 'loc', required: true, maxlength: 200, autocomplete: 'off' }), desc = h('textarea', { id: 'desc', required: true, maxlength: 600 });
  const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const time = h('input', { id: 'tm', type: 'datetime-local', value: now.toISOString().slice(0, 16) }), who = h('input', { id: 'who', maxlength: 60, autocomplete: 'off' });
  const coord = h('input', { id: 'co', maxlength: 60, placeholder: 'Opsional, mis. -3.0000, 114.0000', inputmode: 'text' });
  const gpsMsg = h('p', { class: 'hint', 'aria-live': 'polite' });
  const preview = h('pre', { style: 'white-space:pre-wrap;word-break:break-word;background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:.8rem' });
  const err = h('div');
  const build = () => ['LAPORAN INDIKASI KARHUTLA (AnsepZero)', 'Lokasi: ' + loc.value.trim(), 'Waktu pengamatan: ' + (time.value ? time.value.replace('T', ' ') : '-'), 'Deskripsi: ' + desc.value.trim(),
    coord.value.trim() ? 'Koordinat: ' + coord.value.trim() + ' (https://maps.google.com/?q=' + encodeURIComponent(coord.value.trim()) + ')' : null, who.value.trim() ? 'Pelapor: ' + who.value.trim() : null].filter(Boolean).join('\n');
  const check = () => { err.replaceChildren(); if (!loc.value.trim() || !desc.value.trim()) { err.append(h('div', { class: 'note err', role: 'alert' }, 'Lokasi dan deskripsi wajib diisi.')); return false; } preview.textContent = build(); return true; };
  const gps = h('button', { type: 'button', class: 'btn sec', onclick: () => {
    if (!navigator.geolocation) { gpsMsg.textContent = 'Perangkat tidak mendukung GPS. Isi lokasi secara manual.'; return; }
    gpsMsg.textContent = 'Mencari lokasi...';
    navigator.geolocation.getCurrentPosition(p => { coord.value = p.coords.latitude.toFixed(5) + ', ' + p.coords.longitude.toFixed(5); gpsMsg.textContent = 'Koordinat terisi (akurasi sekitar ' + Math.round(p.coords.accuracy) + ' m). Periksa sebelum mengirim.'; },
      () => { gpsMsg.textContent = 'Lokasi tidak dapat diambil atau izin ditolak. Isi lokasi secara manual; ini tidak menghalangi pelaporan.'; }, { enableHighAccuracy: true, timeout: 12000 });
  } }, 'Isi koordinat dari GPS');
  const wa = h('button', { type: 'button', class: 'btn', disabled: !CONFIG.WA_NUMBER, onclick: () => { if (!check()) return; window.open('https://wa.me/' + CONFIG.WA_NUMBER + '?text=' + encodeURIComponent(build()), '_blank', 'noopener'); } }, 'Siapkan pesan WhatsApp');
  const copy = h('button', { type: 'button', class: 'btn sec', onclick: async () => { if (!check()) return; try { await navigator.clipboard.writeText(build()); toast('Pesan disalin.'); } catch { toast('Gagal menyalin. Salin manual dari kotak pratinjau.'); } } }, 'Salin pesan');
  f.append(h('label', { for: 'loc' }, 'Lokasi kejadian (wajib)'), loc, h('label', { for: 'desc' }, 'Deskripsi indikasi (wajib)'), desc, h('label', { for: 'tm' }, 'Waktu pengamatan'), time,
    h('label', { for: 'co' }, 'Koordinat (opsional)'), coord, h('div', { class: 'row' }, gps), gpsMsg, h('label', { for: 'who' }, 'Nama pelapor (opsional)'), who, err, h('div', { class: 'row' }, wa, copy));
  f.addEventListener('submit', e => e.preventDefault());
  [loc, desc, time, who, coord].forEach(i => i.addEventListener('input', () => { if (loc.value.trim() && desc.value.trim()) preview.textContent = build(); }));
  setPage(root, crumb('Lapor'), h('h1', null, 'Lapor indikasi karhutla'),
    h('div', { class: 'note' }, h('strong', null, 'Penting: '), 'AnsepZero hanya membuka WhatsApp dengan pesan yang sudah disiapkan. Kamu tetap harus memeriksa dan mengirimnya sendiri. Membuka WhatsApp tidak berarti laporan sudah diterima petugas. Dalam keadaan darurat, hubungi petugas langsung dan utamakan keselamatan.'),
    CONFIG.WA_NUMBER ? null : h('div', { class: 'note err' }, 'Nomor WhatsApp petugas belum dikonfigurasi (WA_NUMBER di js/config.js). Tombol WhatsApp dinonaktifkan; gunakan "Salin pesan" dan kirim lewat kontak resmi.'),
    f, h('h2', null, 'Pratinjau pesan'), preview, h('p', { class: 'hint' }, 'Lokasi presisi tidak wajib. Data pada formulir ini tidak dikirim ke server AnsepZero.'),
    h('h2', null, 'Kontak resmi'),
    CONFIG.CONTACTS.length ? h('ul', null, ...CONFIG.CONTACTS.map(c => h('li', null, c.nama + ': ' + c.telepon))) : h('div', { class: 'note' }, 'Daftar kontak BPBD dan pemadam kebakaran belum diisi karena nomor resmi belum diverifikasi.'));
}

export function game(root) {
  const stat = h('p', { role: 'status', 'aria-live': 'polite' }), box = h('div'), frame = h('iframe', { class: 'frame', src: 'game/misi-penjaga-hutan/index.html', title: 'Misi Penjaga Hutan', allow: 'fullscreen; autoplay', allowfullscreen: true });
  const wrap = h('div', { class: 'frame-wrap' }, frame);
  const PEND = 'az.pendingGame';
  const setStat = (t, kind) => { stat.className = 'note ' + (kind || ''); stat.textContent = t; };
  async function send(payload) {
    const key = await sha256Hex(payload.local_ref);
    const body = { submission_key: key, game_version: payload.game_version, score: payload.score, max_score: payload.max_score, stars: payload.stars, missions_done: payload.missions_done, finished: true };
    if (!apiReady()) { setStat('Server AnsepZero belum dikonfigurasi. Skor hanya tersimpan di perangkat ini.', 'err'); return; }
    if (!getSession()) { localStorage.setItem(PEND, JSON.stringify(body)); setStat('Menunggu sinkronisasi: masukkan nama tampilan di bawah untuk menyimpan skor ke cloud.'); return; }
    try { const r = await pApi('/api/game/scores', { method: 'POST', body }); localStorage.removeItem(PEND); setStat(r.duplicate ? 'Tersimpan ke cloud (sudah tercatat sebelumnya).' : 'Tersimpan ke cloud.', 'ok'); }
    catch (e) { localStorage.setItem(PEND, JSON.stringify(body)); setStat('Gagal menyimpan ke cloud (' + e.message + ') - menunggu sinkronisasi. Skor tetap aman di perangkat.', 'err'); box.replaceChildren(h('button', { class: 'btn sec', onclick: retry }, 'Coba kirim ulang')); }
  }
  async function retry() { const p = localStorage.getItem(PEND); if (!p) { setStat('Tidak ada skor yang menunggu.'); return; } try { const r = await pApi('/api/game/scores', { method: 'POST', body: JSON.parse(p) }); localStorage.removeItem(PEND); setStat('Tersimpan ke cloud.', 'ok'); box.replaceChildren(); } catch (e) { setStat('Masih gagal: ' + e.message, 'err'); } }
  const onMsg = e => { if (e.origin !== location.origin || e.source !== frame.contentWindow || e.data?.type !== 'ansepzero:game-result') return; send(e.data.payload); };
  window.addEventListener('message', onMsg); root._cleanup = () => window.removeEventListener('message', onMsg);
  const form = () => { box.replaceChildren(getSession() ? h('p', { class: 'hint' }, 'Nama tampilan: ' + getSession().name) : nameForm(async () => { form(); if (localStorage.getItem(PEND)) retry(); else frame.contentWindow?.postMessage({ type: 'ansepzero:request-result' }, location.origin); }, 'Simpan skor game ke cloud (opsional)')); };
  setPage(root, crumb('Game'), h('h1', null, 'Misi Penjaga Hutan'),
    h('p', { class: 'prose' }, 'Game petualangan pixel-art edukatif versi beta (v2.1 Alpha). Progres game tersimpan otomatis di perangkat ini, jadi aman jika kamu berpindah halaman AnsepZero lalu kembali. Kontrol: WASD/panah dan E di PC; joystick dan tombol di layar pada HP (disarankan mode lanskap).'),
    wrap, h('div', { class: 'row' }, h('button', { class: 'btn sec', onclick: () => (wrap.requestFullscreen ? wrap.requestFullscreen() : toast('Layar penuh tidak didukung browser ini.')) }, 'Layar penuh'), link('#/', 'Kembali ke AnsepZero', 'btn sec')),
    h('h2', null, 'Skor ke cloud'), stat, box,
    h('p', { class: 'hint' }, 'Skor dikirim dari browser sehingga tidak antimanipulasi; server hanya memeriksa rentang nilai dan mencegah pengiriman ganda. Sertifikat game diterbitkan server di halaman ', link('#/sertifikat', 'Sertifikat', '')), '.');
  if (localStorage.getItem(PEND)) setStat('Ada skor yang menunggu sinkronisasi.'); form();
}

export function tentang(root) { setPage(root, crumb('Tentang'), h('h1', null, 'Tentang AnsepZero'), h('div', { class: 'prose' },
  h('p', null, 'AnsepZero adalah sistem informasi edukasi tentang asap kebakaran hutan dan lahan, dikembangkan oleh tim pelajar SMAN 1 Marabahan, Kabupaten Barito Kuala, sebagai bagian dari karya ilmiah (LKITR).'),
  h('p', null, 'Fitur: edukasi karhutla, kuis 5 level, game Misi Penjaga Hutan, pelaporan melalui WhatsApp, dan sertifikat. Fitur yang membutuhkan data resmi (peta kerawanan, berita terkini, kontak petugas) ditampilkan sebagai belum tersedia sampai datanya diverifikasi.'),
  h('p', null, 'AnsepZero adalah media edukasi, bukan sistem tanggap darurat. Pada keadaan darurat, hubungi petugas resmi.'))); }
export function referensi(root) { setPage(root, crumb('Referensi'), h('h1', null, 'Referensi dan sumber informasi'), h('p', { class: 'prose' }, 'Materi disusun dari pengetahuan umum tentang karhutla dan merujuk lembaga berikut. Tim perlu mencantumkan tanggal akses dan rujukan dokumen spesifik pada Daftar Pustaka laporan.'), h('ol', { class: 'prose' }, ...REFS.map(([t, u]) => h('li', null, ext(u, t))))); }
export function privasi(root) { setPage(root, crumb('Privasi'), h('h1', null, 'Kebijakan privasi'), h('div', { class: 'prose' },
  h('h2', null, 'Data yang dikumpulkan'), h('p', null, 'Nama tampilan (alias, 2-30 karakter; jangan memakai nama lengkap), pengenal acak sesi di perangkat, jawaban dan skor kuis, ringkasan hasil game (skor, bintang, misi, status tamat), dan nomor sertifikat. Tidak ada email, nomor telepon, alamat, atau lokasi yang diwajibkan.'),
  h('h2', null, 'Tujuan'), h('p', null, 'Menyimpan progres, memberi penilaian, menerbitkan dan memverifikasi sertifikat, serta statistik agregat untuk pengelola.'),
  h('h2', null, 'Papan peringkat'), h('p', null, 'Bawaan: tidak tampil. Nama tampilanmu hanya muncul di peringkat publik bila kamu mencentang pilihan tampil, dan dapat dimatikan kapan saja.'),
  h('h2', null, 'Sertifikat'), h('p', null, 'Nama pada sertifikat adalah nama tampilanmu saat terbit. Verifikasi publik hanya menampilkan jenis, nama tampilan, dan tanggal.'),
  h('h2', null, 'Pelaporan karhutla'), h('p', null, 'Formulir laporan tidak mengirim data ke server AnsepZero. Isinya hanya dipakai untuk menyusun pesan WhatsApp yang kamu kirim sendiri. Lokasi GPS hanya dibaca atas izinmu.'),
  h('h2', null, 'Penyimpanan lokal dan penghapusan'), h('p', null, 'Progres game dan sesi disimpan di browser. Menghapus data situs di browser menghapus progres lokal. Permintaan penghapusan data cloud belum otomatis; hubungi pengelola AnsepZero dengan menyebutkan nama tampilan dan nomor sertifikat.'))); }
export function notFound(root) { setPage(root, h('h1', null, 'Halaman tidak ditemukan'), h('p', null, 'Alamat yang kamu tuju tidak ada.'), link('#/', 'Kembali ke beranda')); }
