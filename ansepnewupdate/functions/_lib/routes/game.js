import {J,q1,qa,run,now,limited,readJson,authPlayer,guard,HttpError,recomputeScore} from '../util.js';
const route=ctx=>[].concat(ctx.params.route||[]).join('/');
// Skor petualangan dibatasi server: poin <= max misi, sekali per misi, wajib berurutan, waktu diukur server.
// Batasan jujur: server tidak dapat melihat isi gameplay, jadi ini mempersulit manipulasi sederhana, bukan menjamin anti-curang.
export const handle=guard(async ctx=>{
  const {request,env}=ctx,r=route(ctx);
  const p=await authPlayer(request,env); if(!p) throw new HttpError(401,'Kode pemain tidak valid');
  if(request.method==='GET'&&r==='progress'){
    const done=await qa(env,'SELECT mission_id,stars,points,flagged FROM game_missions WHERE player_id=?',p.id);
    const defs=await q1(env,'SELECT COUNT(*) n,COALESCE(SUM(max_points),0) m FROM game_mission_defs WHERE active=1');
    return J({done,total_missions:defs.n,max_points:defs.m});
  }
  if(request.method==='POST'&&r==='start'){
    await run(env,'INSERT INTO game_sessions(id,player_id,started_at,last_event_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET last_event_at=excluded.last_event_at',p.id,p.id,now(),now());
    return J({ok:true});
  }
  if(request.method==='POST'&&r==='mission'){
    if(await limited(env,'gm:'+p.id,120,3600)) throw new HttpError(429,'Terlalu banyak permintaan');
    const b=await readJson(request),mid=String(b.mission_id||''),claimed=Math.max(0,Math.floor(Number(b.points)||0));
    const d=await q1(env,'SELECT * FROM game_mission_defs WHERE mission_id=? AND active=1',mid);
    if(!d) throw new HttpError(404,'Misi tidak dikenal');
    const ex=await q1(env,'SELECT stars,points,flagged FROM game_missions WHERE player_id=? AND mission_id=?',p.id,mid);
    if(ex) return J({already:true,stars:ex.stars,points:ex.points,flagged:!!ex.flagged});
    const miss=await q1(env,'SELECT COUNT(*) n FROM game_mission_defs d WHERE d.active=1 AND d.ord<? AND NOT EXISTS(SELECT 1 FROM game_missions m WHERE m.player_id=? AND m.mission_id=d.mission_id)',d.ord,p.id);
    if(miss.n>0) throw new HttpError(409,'Selesaikan misi sebelumnya terlebih dahulu');
    const s=await q1(env,'SELECT started_at FROM game_sessions WHERE id=?',p.id);
    const last=await q1(env,'SELECT MAX(completed_at) t FROM game_missions WHERE player_id=?',p.id);
    const ref=Math.max(s?.started_at||0,last?.t||0),t=now();
    if(!s) throw new HttpError(409,'Sesi permainan belum dimulai');
    const dur=t-ref,flagged=dur<d.min_duration_s?1:0;
    const pts=Math.min(claimed,d.max_points),ratio=d.max_points?pts/d.max_points:0,stars=ratio>=0.9?3:ratio>=0.7?2:1;
    const res=await run(env,'INSERT OR IGNORE INTO game_missions(player_id,mission_id,stars,points,duration_s,completed_at,flagged) VALUES(?,?,?,?,?,?,?)',p.id,mid,stars,pts,dur,t,flagged);
    if(res.meta.changes!==1) throw new HttpError(409,'Misi sudah tercatat');
    await recomputeScore(env,p.id);
    return J({points:pts,stars,flagged:!!flagged,flag_note:flagged?'Penyelesaian terlalu cepat; poin ditahan untuk ditinjau admin.':undefined});
  }
  if(request.method==='POST'&&r==='sync'){ // progres lama dari perangkat ini: dicatat, ditahan untuk tinjauan admin (flagged)
    const b=await readJson(request,8192),ids=Array.isArray(b.mission_ids)?b.mission_ids.slice(0,40).map(String):[];
    const defs=await qa(env,'SELECT mission_id,ord,max_points FROM game_mission_defs WHERE active=1 ORDER BY ord');
    const have=new Set((await qa(env,'SELECT mission_id FROM game_missions WHERE player_id=?',p.id)).map(x=>x.mission_id)),want=new Set(ids);
    let n=0;
    for(const d of defs){ if(!want.has(d.mission_id)) break; // hanya urutan berkelanjutan dari awal
      if(have.has(d.mission_id)) continue;
      const r2=await run(env,'INSERT OR IGNORE INTO game_missions(player_id,mission_id,stars,points,duration_s,completed_at,flagged) VALUES(?,?,1,?,NULL,?,1)',p.id,d.mission_id,d.max_points,now());
      n+=r2.meta.changes; }
    if(n) await recomputeScore(env,p.id);
    return J({imported:n,note:n?'Progres lama dicatat dan menunggu tinjauan admin sebelum masuk leaderboard.':undefined});
  }
  throw new HttpError(404,'Tidak ditemukan');
});
