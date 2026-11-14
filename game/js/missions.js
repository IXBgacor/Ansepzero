/* Mesin misi v0.4: kampanye 30 misi berurutan (6 bab) dari js/campaign_data.js.
   Prinsip lama dipertahankan: misi selesai hanya bila SEMUA langkah terpenuhi (dihitung dari langkah, bukan flag);
   skor diturunkan dari langkah + statistik kesalahan; API lama (mark, active, score, addStat, ...) tetap ada.
   Penyimpanan: kunci 'mph.save', format v3. v1/v2 (v0.2/v0.3) dibaca dan dimigrasi; save lama dicadangkan di 'mph.save.v03.bak'. */
(function (M) {
  const KEY = 'mph.save', BAK = 'mph.save.v03.bak', BAD = 'mph.save.corrupt', FMT = 3;
  const chapters = M.CampaignData.chapters, defs = M.CampaignData.missions, byId = {};
  defs.forEach((d, i) => {
    d.name = d.title; d.index = i; d.code = d.ch + '.' + (defs.filter(x => x.ch === d.ch).indexOf(d) + 1); byId[d.id] = d;
    for (const s of d.steps) {                                    // aturan pengurang poin (sama dengan v0.3 untuk misi lama)
      s.requires = s.requires || [];
      if (s.t === 'quiz') { s.stat = 'wrong'; s.penalty = Math.max(5, Math.round(s.pts * 0.3 / 5) * 5); s.min = Math.max(5, Math.round(s.pts * 0.25)); }
      else if (s.t === 'observe') { s.stat = 'danger'; s.penalty = Math.max(5, Math.round(s.pts * 0.25 / 5) * 5); s.min = Math.round(s.pts * 0.33); }
    }
  });
  const state = {}, stats = {}, seen = new Set();
  defs.forEach(d => { state[d.id] = new Set(); stats[d.id] = {}; });
  const listeners = []; let loadStatus = 'empty', migrated = null, saveWarned = false, noSave = false;

  const def = id => byId[id], chapter = n => chapters.find(c => c.id === n);
  const idx = id => (byId[id] ? byId[id].index : -1);
  const has = (m, s) => !!(state[m] && state[m].has(s));
  const progress = id => { const d = byId[id], done = d.steps.filter(s => state[id].has(s.id)).length; return { done, total: d.steps.length, complete: done === d.steps.length }; };
  const complete = id => progress(id).complete;
  const allComplete = () => defs.every(d => complete(d.id));
  const completedCount = () => defs.filter(d => complete(d.id)).length;
  const isUnlocked = id => { const i = idx(id); return i >= 0 && defs.slice(0, i).every(d => complete(d.id)); };   // berurutan
  const active = () => defs.find(d => !complete(d.id)) || null;
  const status = id => complete(id) ? 'Selesai' : isUnlocked(id) ? 'Aktif' : 'Terkunci';
  const chapterMissions = n => defs.filter(d => d.ch === n);
  const chapterProgress = n => { const l = chapterMissions(n), done = l.filter(d => complete(d.id)).length; return { done, total: l.length, complete: done === l.length, unlocked: isUnlocked(l[0].id) }; };
  const chapterScore = n => chapterMissions(n).reduce((a, d) => a + missionScore(d.id), 0);
  const chapterMax = n => chapterMissions(n).reduce((a, d) => a + missionMax(d.id), 0);

  /* ---- langkah yang tersedia pada misi aktif ---- */
  const stepOk = (d, s) => !state[d.id].has(s.id) && s.requires.every(r => state[d.id].has(r));
  function availableSteps() { const d = active(); return d ? d.steps.filter(s => stepOk(d, s)).map(s => ({ m: d, s })) : []; }
  const stepsAt = poi => availableSteps().filter(x => x.s.poi === poi);
  const targets = () => Array.from(new Set(availableSteps().map(x => x.s.poi)));
  const stepsAnywhere = poi => { const r = []; for (const d of defs) for (const s of d.steps) if (s.poi === poi) r.push({ m: d, s }); return r; };

  /* ---- skor (diturunkan dari langkah + statistik) ---- */
  const stepStat = (mid, sid) => (stats[mid] && stats[mid][sid]) || 0;
  const stat = (mid, kind) => byId[mid].steps.filter(s => s.stat === kind).reduce((a, s) => a + stepStat(mid, s.id), 0);
  function objPoints(mid, sid) {
    const s = byId[mid] && byId[mid].steps.find(x => x.id === sid);
    if (!s || !has(mid, sid)) return 0;
    return s.stat ? Math.max(s.min, s.pts - s.penalty * stepStat(mid, sid)) : s.pts;
  }
  const missionMax = id => byId[id].steps.reduce((a, s) => a + s.pts, 0);
  const missionScore = id => byId[id].steps.reduce((a, s) => a + objPoints(id, s.id), 0);
  const score = () => ({ total: defs.reduce((a, d) => a + missionScore(d.id), 0), max: defs.reduce((a, d) => a + missionMax(d.id), 0) });

  /* Catat kesalahan/masuk zona bahaya pada satu langkah (hanya bila misi terbuka & langkah tersedia). k = id langkah atau jenis stat. */
  function addStat(mid, k) {
    const d = byId[mid]; if (!d || !isUnlocked(mid)) return false;
    const s = d.steps.find(x => x.id === k) || d.steps.find(x => x.stat === k && stepOk(d, x));
    if (!s || !s.stat || !stepOk(d, s)) return false;
    stats[mid][s.id] = Math.min(99, stepStat(mid, s.id) + 1); save(); emit({ type: 'stat', mid, sid: s.id }); return true;
  }
  function noteDanger(hid) {                        // pemain masuk zona bahaya area `hid`
    const a = availableSteps().find(x => x.s.t === 'observe' && x.s.poi === hid);
    return a ? addStat(a.m.id, a.s.id) : false;
  }

  /* ---- simpan / muat ---- */
  function serialize() {
    const m = {}, st = {}; defs.forEach(d => { m[d.id] = Array.from(state[d.id]); const o = {}; for (const k in stats[d.id]) if (stats[d.id][k]) o[k] = stats[d.id][k]; if (Object.keys(o).length) st[d.id] = o; });
    return JSON.stringify({ v: FMT, ver: M.C.VERSION, m, st, seen: Array.from(seen) });
  }
  function save() {
    if (noSave) return false;
    const ok = M.Store.set(KEY, serialize());
    if (!ok && !saveWarned) { saveWarned = true; M.notify('Progres tidak bisa disimpan (penyimpanan penuh/diblokir). Progres hanya bertahan selama halaman terbuka.'); }
    if (ok) saveWarned = false;
    return ok;
  }
  function clearAll() { defs.forEach(d => { state[d.id].clear(); stats[d.id] = {}; }); seen.clear(); }
  function load() {
    clearAll(); migrated = null; noSave = false;
    const raw = M.Store.get(KEY);
    if (raw == null) { loadStatus = M.Store.available ? 'empty' : 'unavailable'; return; }
    try {
      const o = JSON.parse(raw);
      if (!o || typeof o !== 'object' || !(o.v >= 1) || !o.m || typeof o.m !== 'object' || Array.isArray(o.m)) throw new Error('format');
      if (o.v > FMT) { loadStatus = 'future'; noSave = true; return; }       // save dari versi lebih baru: jangan ditimpa
      for (const d of defs) {                                                // langkah divalidasi urut; syarat wajib ada
        const arr = Array.isArray(o.m[d.id]) ? o.m[d.id] : [];
        for (const s of d.steps) if (arr.includes(s.id) && s.requires.every(r => state[d.id].has(r))) state[d.id].add(s.id);
        const st = o.st && typeof o.st === 'object' ? o.st[d.id] : null;
        if (st && typeof st === 'object') {
          for (const s of d.steps) {
            let k = s.id; if (o.v === 2) k = s.stat === 'wrong' ? 'wrong' : s.stat === 'danger' ? 'danger' : null;   // v0.3: {wrong, danger} per misi
            if (!k || !s.stat) continue; const n = Number(st[k]);
            if (Number.isInteger(n) && n >= 0) stats[d.id][s.id] = Math.min(99, n);
          }
        }
      }
      if (o.v === FMT && Array.isArray(o.seen)) o.seen.forEach(id => { if (byId[id]) seen.add(id); });
      loadStatus = 'loaded';
      if (o.v < FMT) {                                                       // MIGRASI: cadangkan save lama, tandai misi lama sebagai sudah dibriefing
        if (M.Store.get(BAK) == null) M.Store.set(BAK, raw);
        defs.forEach(d => { if (state[d.id].size) seen.add(d.id); });
        migrated = { from: o.v, credited: completedCount() }; save();
      }
    } catch (e) {
      clearAll(); if (M.Store.get(BAD) == null) M.Store.set(BAD, raw);       // salinan data rusak disimpan, tidak langsung dibuang
      M.Store.remove(KEY); loadStatus = 'corrupt';
    }
  }
  /* Tandai satu langkah. Mengembalikan {ok, changed, completedNow, chapterDone, pts}. */
  function mark(mid, sid) {
    const d = byId[mid], s = d && d.steps.find(x => x.id === sid);
    if (!s) return { ok: false, changed: false, completedNow: false };
    if (!isUnlocked(mid)) return { ok: false, changed: false, completedNow: false, reason: 'locked' };
    if (state[mid].has(sid)) return { ok: true, changed: false, completedNow: false, pts: objPoints(mid, sid) };
    if (s.requires.some(r => !state[mid].has(r))) return { ok: false, changed: false, completedNow: false, reason: 'requires' };
    const was = complete(mid); state[mid].add(sid);
    const done = !was && complete(mid), pts = objPoints(mid, sid), chDone = done && chapterProgress(d.ch).complete;
    const saved = save();
    emit({ type: done ? 'mission' : 'objective', mid, sid, pts, next: done ? active() : null, chapterDone: chDone });
    return { ok: true, changed: true, completedNow: done, chapterDone: chDone, pts, saved };
  }
  const markSeen = id => { if (byId[id] && !seen.has(id)) { seen.add(id); save(); } };
  const wasSeen = id => seen.has(id);
  function reset() {
    clearAll(); noSave = false; loadStatus = 'empty';
    const ok = M.Store.available ? M.Store.remove(KEY) : true;      // cadangan v0.3 tidak dihapus
    emit({ type: 'reset' }); return ok;
  }
  const emit = ev => listeners.forEach(f => { try { f(ev); } catch (e) { console.error(e); } });
  const onChange = f => listeners.push(f);

  /* Validasi data kampanye (galat dilaporkan ke console; dipakai juga oleh pengujian). */
  function validate() {
    const errs = [], ids = new Set();
    if (defs.length !== 30) errs.push('jumlah misi ' + defs.length);
    for (const d of defs) {
      if (ids.has(d.id)) errs.push('id ganda ' + d.id); ids.add(d.id);
      if (!chapter(d.ch)) errs.push('bab tak dikenal ' + d.id);
      for (const k of ['title', 'desc', 'goal', 'hint', 'brief', 'edu', 'tip']) if (!d[k]) errs.push(d.id + ' tanpa ' + k);
      const sids = new Set();
      for (const s of d.steps) {
        if (sids.has(s.id)) errs.push('langkah ganda ' + d.id + '.' + s.id); sids.add(s.id);
        if (!M.World.byId[s.poi]) errs.push(d.id + '.' + s.id + ' poi tak ada: ' + s.poi);
        if (s.t === 'observe' && !(M.World.byId[s.poi] && M.World.isHazard(M.World.byId[s.poi]))) errs.push(d.id + '.' + s.id + ' observe bukan area bahaya');
        if (s.t === 'quiz' && !(s.qs && s.qs.length && s.qs.every(q => q.o.filter(o => o.good).length === 1))) errs.push(d.id + '.' + s.id + ' soal tidak valid');
        if (s.t !== 'quiz' && !(s.pages && s.pages.length)) errs.push(d.id + '.' + s.id + ' tanpa halaman');
        for (const r of s.requires) if (!d.steps.some(x => x.id === r)) errs.push(d.id + '.' + s.id + ' requires tak ada ' + r);
      }
    }
    return errs;
  }
  load();
  M.Missions = { defs, chapters, def, chapter, has, progress, complete, allComplete, completedCount, status, mark, reset, onChange,
    isUnlocked, active, stat, stepStat, addStat, noteDanger, objPoints, missionScore, missionMax, score,
    chapterMissions, chapterProgress, chapterScore, chapterMax, availableSteps, stepsAt, targets, stepsAnywhere, markSeen, wasSeen, isSeen: wasSeen, setSeen: markSeen, validate, save,
    get loadStatus() { return loadStatus; }, get migrated() { return migrated; } };
})(window.MPH);
