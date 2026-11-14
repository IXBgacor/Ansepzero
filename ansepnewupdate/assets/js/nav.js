/* Navigasi bersama: header (desktop) dan tab bawah (HP). Konten statis, tanpa data pengguna. */
(function () {
  var I = {
    home: '<path d="M3 11l9-8 9 8v10H3z"/>', book: '<path d="M4 5h7a3 3 0 013 3v12a2 2 0 00-2-2H4zM20 5h-7a3 3 0 00-3 3"/>',
    quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 115 0c0 1.5-2.5 2-2.5 3.5M12 17h.01"/>',
    game: '<rect x="3" y="7" width="18" height="11" rx="4"/><path d="M8 10v5M5.5 12.5h5M16 11h.01M18 14h.01"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>'
  };
  var main = [['/', 'Beranda', 'home'], ['/edukasi/', 'Belajar', 'book'], ['/kuis/', 'Kuis', 'quiz'], ['/game/', 'Main', 'game'], ['/lapor/', 'Lapor', 'alert']];
  var more = [['/penjaga-hutan/', 'Tanya AI'], ['/leaderboard/', 'Papan skor'], ['/statistik/', 'Analitik'], ['/peta/', 'Peta dan wilayah'], ['/#bantuan', 'Pusat bantuan'], ['/privasi/', 'Kebijakan privasi']];
  var path = location.pathname.replace(/index\.html$/, '');
  function on(h) { return h === '/' ? path === '/' : path.indexOf(h) === 0; }
  function svg(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[k] + '</svg>'; }
  var logo = '<svg width="34" height="34" viewBox="0 0 64 64" role="img" aria-label="Logo AnsepZero"><circle cx="32" cy="32" r="27" fill="none" stroke="#36d1e0" stroke-width="6"/><path d="M32 14l11 16H36l9 13H19l9-13h-7z" fill="#3fb97a"/><rect x="30" y="43" width="4" height="8" fill="#3fb97a"/></svg>';
  document.querySelectorAll('header.top,nav.bar,nav.tabbar,header.site').forEach(function (e) { e.remove(); });
  var h = document.createElement('header'); h.className = 'site';
  var all = main.map(function (x) { return [x[0], x[1]]; }).concat(more.slice(0, 5));
  h.innerHTML = '<div class="in"><a class="brand" href="/">' + logo + '<span>AnsepZero</span></a><nav class="dnav" aria-label="Menu utama">' +
    all.map(function (x) { return '<a href="' + x[0] + '"' + (on(x[0]) && x[0].indexOf('#') < 0 ? ' class="on" aria-current="page"' : '') + '>' + x[1] + '</a>'; }).join('') + '</nav></div>';
  document.body.insertBefore(h, document.body.firstChild);
  var bar = document.createElement('nav'); bar.className = 'tabbar'; bar.setAttribute('aria-label', 'Navigasi');
  bar.innerHTML = main.map(function (x) { return '<a href="' + x[0] + '"' + (on(x[0]) ? ' class="on" aria-current="page"' : '') + '>' + svg(x[2]) + x[1] + '</a>'; }).join('') +
    '<button type="button" id="az-more" aria-expanded="false" aria-controls="az-sheet">' + svg('menu') + 'Menu</button>';
  var sh = document.createElement('div'); sh.className = 'sheet'; sh.id = 'az-sheet'; sh.hidden = true;
  sh.innerHTML = more.map(function (x) { return '<a href="' + x[0] + '">' + x[1] + '</a>'; }).join('');
  document.body.appendChild(bar); document.body.appendChild(sh);
  var b = document.getElementById('az-more');
  function close() { sh.hidden = true; b.setAttribute('aria-expanded', 'false'); }
  b.addEventListener('click', function (e) { e.stopPropagation(); sh.hidden = !sh.hidden; b.setAttribute('aria-expanded', String(!sh.hidden)); });
  document.addEventListener('click', function (e) { if (!sh.contains(e.target)) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();
