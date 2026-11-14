/* World State v1.0 — kondisi dunia yang PERSISTEN dan terpisah dari animasi cutscene.
   Cutscene hanya menjalankan event & memperlihatkan perubahan; kondisi akhirnya ditulis ke sini lewat WorldState.apply(eventId).
   - Setiap event hanya berlaku SEKALI (penanda `applied`), sehingga cutscene yang terpicu ulang tidak menggandakan perubahan.
   - Cutscene yang dilewati (skip) memanggil apply() yang sama, jadi kondisi akhir dunia selalu benar.
   - Disimpan di localStorage kunci 'mph.v10.world' (format v1); kunci save lama ('mph.save', 'mph.v05', 'mph.chcut', 'mph.v06') tidak diubah.
   - reconcile() menyelaraskan state dengan progres lama (misi + Final.P): save v0.6 yang sudah tamat otomatis berkondisi "pulih".
   Struktur:
     storyProgress {intro, stage}   gear []   fires {id: 'active'|'out'|'burnt'|'hidden'}   villagers {id: {at:'home'|'assembly'}}
     buildings {hall:{door}, houses:{shutters}, shelter:{state}}   evacuation {phase: none|active|sheltered|cleared|recovered}
     completedMissions []   ending {done}   applied {eventId:1} */
(function (M) {
  'use strict';
  const KEY = 'mph.v10.world', BAD = 'mph.v10.world.corrupt', FMT = 1;
  const FIRE_IDS = ['smoke', 'smoke2', 'flame', 'peatsmoke', 'bigfire'];      // rangkaian karhutla utama (api/asap aktif)
  const VIL = ['v1', 'v2', 'v3', 'v4', 'v5', 'v_mbah', 'v_anak', 'v_ibu', 'lurah'];
  const GEAR = { rompi: 'Rompi Penjaga Hutan', topi: 'Topi Penjaga Hutan', radio: 'Radio HT', buku: 'Buku Saku Lapangan' };
  const def = () => ({
    v: FMT, storyProgress: { intro: false, stage: 'new' }, gear: [],
    fires: { smoke: 'active', smoke2: 'active', flame: 'active', peatsmoke: 'active', bigfire: 'hidden' },
    villagers: VIL.reduce((o, id) => (o[id] = { at: 'home' }, o), {}),
    buildings: { hall: { door: 'closed' }, houses: { shutters: 'open' }, shelter: { state: 'ready' } },
    evacuation: { phase: 'none' }, completedMissions: [], ending: { done: false }, applied: {}
  });
  let S = def(), locked = false, listeners = [], loadStatus = 'empty';

  const emit = ev => listeners.slice().forEach(f => { try { f(ev); } catch (e) { console.error(e); } });
  function save() { if (locked) return false; S.completedMissions = M.Missions ? M.Missions.defs.filter(d => M.Missions.complete(d.id)).map(d => d.id) : S.completedMissions; return M.Store.set(KEY, JSON.stringify(Object.assign({ ver: M.C.VERSION }, S))); }

  /* ---------- memuat + validasi (data tidak valid diabaikan per-bagian, tidak merusak game) ---------- */
  function load() {
    const raw = M.Store.get(KEY); if (raw == null) { loadStatus = M.Store.available ? 'empty' : 'unavailable'; return; }
    try {
      const o = JSON.parse(raw); if (!o || typeof o !== 'object' || !(o.v >= 1)) throw new Error('format');
      if (o.v > FMT) { locked = true; loadStatus = 'future'; return; }
      const d = def(), sp = o.storyProgress || {};
      d.storyProgress.intro = !!sp.intro; d.storyProgress.stage = ['new', 'intro_done', 'emergency', 'ending_done'].includes(sp.stage) ? sp.stage : (sp.intro ? 'intro_done' : 'new');
      d.gear = Array.isArray(o.gear) ? o.gear.filter(g => GEAR[g]) : [];
      if (o.fires && typeof o.fires === 'object') FIRE_IDS.forEach(id => { if (['active', 'out', 'burnt', 'hidden'].includes(o.fires[id])) d.fires[id] = o.fires[id]; });
      if (o.villagers && typeof o.villagers === 'object') VIL.forEach(id => { const v = o.villagers[id]; if (v && (v.at === 'home' || v.at === 'assembly')) d.villagers[id].at = v.at; });
      const b = o.buildings || {};
      if (b.hall && (b.hall.door === 'open' || b.hall.door === 'closed')) d.buildings.hall.door = b.hall.door;
      if (b.houses && (b.houses.shutters === 'open' || b.houses.shutters === 'shuttered')) d.buildings.houses.shutters = b.houses.shutters;
      if (b.shelter && ['ready', 'deployed', 'stowed'].includes(b.shelter.state)) d.buildings.shelter.state = b.shelter.state;
      if (o.evacuation && ['none', 'active', 'sheltered', 'cleared', 'recovered'].includes(o.evacuation.phase)) d.evacuation.phase = o.evacuation.phase;
      d.ending.done = !!(o.ending && o.ending.done);
      if (o.applied && typeof o.applied === 'object') Object.keys(o.applied).forEach(k => { if (/^[a-z0-9_]{1,40}$/.test(k) && o.applied[k]) d.applied[k] = 1; });
      S = d; loadStatus = 'loaded';
    } catch (e) { if (M.Store.get(BAD) == null) M.Store.set(BAD, raw); M.Store.remove(KEY); S = def(); loadStatus = 'corrupt'; }
  }

  /* ---------- event world-state: tiap event idempoten ---------- */
  const EV = {
    intro_complete() { S.storyProgress.intro = true; if (S.storyProgress.stage === 'new') S.storyProgress.stage = 'intro_done'; S.buildings.hall.door = 'open'; GEAR_ALL.forEach(g => { if (!S.gear.includes(g)) S.gear.push(g); }); },
    hall_door_open() { S.buildings.hall.door = 'open'; },
    gear_granted() { GEAR_ALL.forEach(g => { if (!S.gear.includes(g)) S.gear.push(g); }); },
    emergency_start() { if (S.evacuation.phase === 'none') S.evacuation.phase = 'active'; S.buildings.houses.shutters = 'shuttered'; S.buildings.shelter.state = 'deployed'; S.storyProgress.stage = 'emergency'; if (S.fires.bigfire === 'hidden') S.fires.bigfire = 'active'; },
    evacuation_sheltered() { if (S.evacuation.phase === 'active' || S.evacuation.phase === 'none') S.evacuation.phase = 'sheltered'; },
    fires_out() {                                                       // semua api/asap rangkaian karhutla utama padam; tanah hangus tetap terlihat
      FIRE_IDS.forEach(id => { S.fires[id] = 'out'; });
      if (S.evacuation.phase !== 'recovered') S.evacuation.phase = 'cleared';
    },
    villagers_home() {                                                  // ancaman berakhir: warga pulang, posko darurat dibongkar, rumah dibuka
      VIL.forEach(id => { S.villagers[id].at = 'home'; });
      S.evacuation.phase = 'recovered'; S.buildings.houses.shutters = 'open'; S.buildings.shelter.state = 'stowed';
    },
    ending_complete() { EV.fires_out(); EV.villagers_home(); S.ending.done = true; S.storyProgress.stage = 'ending_done'; }
  };
  const GEAR_ALL = Object.keys(GEAR);

  /* apply(id): true bila baru diterapkan, false bila sudah pernah (aman dipanggil berulang) */
  function apply(id) {
    if (!EV[id]) { console.warn('[WorldState] event tidak dikenal: ' + id); return false; }
    if (S.applied[id]) return false;
    S.applied[id] = 1; EV[id](); save(); emit({ type: 'event', id }); return true;
  }
  /* Penempatan warga saat evakuasi dicatat langsung (bukan event): at = 'assembly' | 'home' */
  function setVillager(id, at) { if (!S.villagers[id] || S.villagers[id].at === at) return; S.villagers[id].at = at; save(); emit({ type: 'villager', id, at }); }

  /* Selaraskan state dengan progres lama/baru. Dipanggil saat init, setelah reset, dan setelah migrasi. Sumber kebenaran:
     Final.P (evakuasi/tamat) + Missions (misi selesai). Tidak pernah memundurkan kondisi yang sudah pulih. */
  function reconcile(opts) {
    const F = M.Final && M.Final.P, Ms = M.Missions; if (!F || !Ms) return;
    const anyMission = Ms.completedCount() > 0 || !!F.finished || !!(F.evac && F.evac.emerg);
    if (opts && opts.initial && !S.storyProgress.intro && anyMission && !S.applied.intro_complete) { S.storyProgress.intro = true; S.storyProgress.stage = 'intro_done'; S.applied.intro_migrated = 1; }   // save lama: pemain sudah berpengalaman -> cerita pembuka tidak dipaksa
    if (S.storyProgress.intro) { S.buildings.hall.door = 'open'; GEAR_ALL.forEach(g => { if (!S.gear.includes(g)) S.gear.push(g); }); }
    if (F.evac && F.evac.emerg && !S.applied.emergency_start) { S.applied.emergency_start = 1; EV.emergency_start(); }
    if (F.done && F.done.includes('report') && S.evacuation.phase === 'active') S.evacuation.phase = 'sheltered';
    if (F.finished && !S.ending.done) { S.applied.ending_complete = 1; EV.ending_complete(); }           // sudah tamat (save lama, atau muat ulang saat cutscene ending): kondisi pasca-ending
    if (!F.finished && S.ending.done) { S.ending.done = false; }
    if (!F.finished && !(F.evac && F.evac.emerg) && S.evacuation.phase !== 'none' && !pendingFinish) { /* reset lama: dunia kembali ke awal */ const keepIntro = S.storyProgress.intro, g = S.gear.slice(), ap = S.applied.intro_complete; S = def(); if (keepIntro) { S.storyProgress.intro = true; S.storyProgress.stage = 'intro_done'; S.gear = g; if (ap) S.applied.intro_complete = 1; S.buildings.hall.door = 'open'; } }
    save(); emit({ type: 'reconcile' });
  }
  let pendingFinish = false;

  function reset(keepIntro) {
    S = def(); if (keepIntro) { S.storyProgress.intro = true; S.storyProgress.stage = 'intro_done'; S.buildings.hall.door = 'open'; GEAR_ALL.forEach(g => S.gear.push(g)); S.applied.intro_complete = 1; }
    save(); emit({ type: 'reset' });
  }

  const fireState = id => S.fires[id] || 'active';
  const fireOut = id => S.fires[id] === 'out';
  load();
  M.WorldState = { get state() { return S; }, apply, reconcile, reset, save, load, setVillager, fireState, fireOut, FIRE_IDS, VIL, GEAR, onChange: f => listeners.push(f),
    applied: id => !!S.applied[id], get locked() { return locked; }, get loadStatus() { return loadStatus; },
    doorOpen: () => S.buildings.hall.door === 'open', shuttered: () => S.buildings.houses.shutters === 'shuttered', sheltersStowed: () => S.buildings.shelter.state === 'stowed',
    phase: () => S.evacuation.phase, introDone: () => !!S.storyProgress.intro, endingDone: () => !!S.ending.done, gear: () => S.gear.slice(),
    snapshot: () => JSON.parse(JSON.stringify(S)), _setPendingFinish: v => { pendingFinish = !!v; } };
})(window.MPH);
