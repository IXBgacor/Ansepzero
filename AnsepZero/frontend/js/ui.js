// Pembantu DOM. Semua teks dari server/pengguna dimasukkan lewat textContent (aman dari XSS).
export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'html') e.innerHTML = v; else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}
const P = {
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5', fire: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z', health: 'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', quiz: 'M9 9a3 3 0 1 1 4 2.8c-.7.4-1 1-1 1.7M12 17.5v.01M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0', game: 'M6 9h12a4 4 0 0 1 4 4v2a3 3 0 0 1-5 2l-1-1H8l-1 1a3 3 0 0 1-5-2v-2a4 4 0 0 1 4-4zM8 12v3M6.5 13.5h3',
  report: 'M5 3v18M5 4h12l-2 4 2 4H5', cert: 'M5 4h14v12H5zM9 16l-1 5 4-2 4 2-1-5', news: 'M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5', trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M10 17h4',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14', star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z'
};
export function icon(name, cls = 'ic') { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', cls); s.setAttribute('aria-hidden', 'true'); s.setAttribute('fill', name === 'star' ? 'currentColor' : 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', P[name] || P.book); s.append(p); return s; }
export const loading = (t = 'Memuat...') => h('div', { class: 'state', role: 'status' }, h('div', { class: 'spin' }), t);
export const errorBox = (msg, retry) => h('div', { class: 'note err', role: 'alert' }, h('strong', null, 'Terjadi kendala. '), msg, retry ? h('div', { class: 'row' }, h('button', { class: 'btn sec', onclick: retry }, 'Coba lagi')) : null);
export const empty = t => h('div', { class: 'state' }, t);
export function toast(msg) { const t = h('div', { class: 'toast', role: 'status' }, msg); document.body.append(t); setTimeout(() => t.remove(), 3500); }
export const crumb = (...parts) => h('div', { class: 'crumb' }, h('a', { href: '#/' }, 'Beranda'), ...parts.map(p => [' / ', p]));
export const fmtDate = iso => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
export function setPage(root, ...nodes) { root.replaceChildren(...nodes); root.focus({ preventScroll: true }); window.scrollTo(0, 0); }
