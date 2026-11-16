 
/* Jembatan AnsepZero <-> Misi Penjaga Hutan. Tidak mengubah mesin game: hanya membaca status misi dan melapor ke server.
   Server yang menentukan skor (batas poin, urutan, waktu). Identitas pemain dibuat di halaman /masuk/ (kode di localStorage 'az.code').
   Jika server tidak bisa dihubungi, game tetap bisa dimainkan (skor tidak tersimpan). */
(function () {
  const M = window.MPH, LK = 'az.code';
  if (!M || !M.Missions) return;

  const css = document.createElement('style');
  css.textContent = `
    #az-pill {
      position: fixed;
      left: max(8px, env(safe-area-inset-left));
      top: max(8px, env(safe-area-inset-top));
      bottom: auto;
      z-index: 9999;
      max-width: calc(100vw - 16px);
      font: 11px system-ui;
      background: rgba(13,20,17,.85);
      color: #98ad9f;
      padding: 5px 10px;
      border-radius: 999px;
    }
    #az-pill a {
      color: #3cc8d8;
    }
  `;
  document.head.appendChild(css);

  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const code = () => get(LK);
  const guest = () => { try { return sessionStorage.getItem('az.guest') === '1'; } catch (e) { return false; } };

  async function api(p, m, b) {
    const c = code();
    const r = await fetch('/api/' + p, {
      method: m || 'GET',
      headers: Object.assign(
        { 'content-type': 'application/json' },
        c ? { authorization: 'Bearer ' + c } : {}
      ),
      body: b ? JSON.stringify(b) : undefined
    });
    const ok = (r.headers.get('content-type') || '').indexOf('json') >= 0;
    const j = ok ? await r.json().catch(() => ({})) : {};
    if (!r.ok || !ok) throw Object.assign(new Error(j.error || 'Gagal'), { status: r.status });
    return j;
  }

  const el = (t, a, ...k) => {
    const e = document.createElement(t);
    for (const x in (a || {})) e.setAttribute(x, a[x]);
    k.forEach(c => e.append(c));
    return e;
  };

  const note = t => {
    try { if (M.notify) M.notify(t); } catch (e) { /* abaikan */ }
  };

  const pill = (...k) => {
    const old = document.getElementById('az-pill');
    if (old) old.remove();
    document.body.appendChild(el('div', { id: 'az-pill' }, ...k));
  };

  let reported = new Set(), reportedPts = 0, busy = false, started = false, failures = 0;

  async function check() {
    if (busy || !started) return;
    busy = true;

    try {
      for (const d of M.Missions.defs) {
        if (!M.Missions.complete(d.id)) break;
        if (reported.has(d.id)) continue;

        const total = M.Missions.score().total;
        const r = await api('game/mission', 'POST', {
          mission_id: d.id,
          points: Math.max(0, total - reportedPts)
        });

        reported.add(d.id);
        reportedPts = total;
        failures = 0;

        note(
          r.already ? 'Misi sudah tercatat' :
          r.flagged ? 'Misi tercatat, poin menunggu tinjauan' :
          'Skor misi tersimpan: +' + r.points + ' poin'
        );
      }

      const F = M.Final && M.Final.P;
      if (F && F.finished && !reported.has('final') && M.Missions.allComplete()) {
        const r = await api('game/mission', 'POST', {
          mission_id: 'final',
          points: Math.max(0, Math.floor(F.score || 0))
        });

        reported.add('final');
        note('Misi Terakhir tercatat: +' + r.points + ' poin');
      }
    } catch (e) {
      if (e.status === 409 && /Sesi/.test(e.message)) {
        try { await api('game/start', 'POST'); } catch (x) { /* abaikan */ }
      } else if (++failures === 3) {
        note('Skor belum tersimpan: server tidak merespons. Game tetap bisa dimainkan.');
      }
    }

    busy = false;
  }

  async function boot() {
    if (!code()) {
      if (guest()) {
        pill(
          'Mode tamu: skor tidak tersimpan | ',
          el('a', { href: '/masuk/?next=game' }, 'Masuk'),
          ' | ',
          el('a', { href: '/' }, 'Beranda')
        );
        return;
      }

      location.replace('/masuk/?next=game');
      return;
    }

    let me;

    try {
      me = await api('player/me');
    } catch (e) {
      if (e.status === 401) {
        try { localStorage.removeItem(LK); } catch (x) { /* abaikan */ }
        location.replace('/masuk/?next=game');
        return;
      }

      pill(
        'Server tidak terhubung: skor tidak tersimpan | ',
        el('a', { href: '/' }, 'Beranda')
      );
      return;
    }

    try {
      localStorage.setItem('az.name', me.display_name);
    } catch (e) { /* abaikan */ }

    try {
      await api('game/start', 'POST');
    } catch (e) {
      pill(
        'Server belum siap: skor tidak tersimpan | ',
        el('a', { href: '/' }, 'Beranda')
      );
      return;
    }

    const local = M.Missions.defs
      .filter(d => M.Missions.complete(d.id))
      .map(d => d.id);

    if (local.length) {
      try {
        const s = await api('game/sync', 'POST', { mission_ids: local });
        if (s.imported) note(s.note);
      } catch (e) { /* abaikan */ }
    }

    local.forEach(i => reported.add(i));
    reportedPts = M.Missions.score().total;

    try {
      if (M.Final && M.Final.P && !M.Final.P.name) {
        M.Final.P.name = me.display_name;
        M.Final.save();
      }
    } catch (e) { /* abaikan */ }

    pill(
      'Pemain: ' + me.display_name + ' | ',
      el('a', { href: '/leaderboard/' }, 'Papan skor'),
      ' | ',
      el('a', { href: '/' }, 'Beranda')
    );

    started = true;
    M.Missions.onChange(() => setTimeout(check, 300));
    setInterval(check, 5000);
    check();
  }

  boot();
})();
