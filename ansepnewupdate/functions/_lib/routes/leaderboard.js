import {J,qa,guard,threshold} from '../util.js';
const WIN={all:0,week:7*86400,month:30*86400};
// Papan skor publik. Tidak memuat ID, email, telepon, atau token. Filter periode = pemain yang skornya diperbarui pada periode itu.
export const handle=guard(async({request,env})=>{
  if(request.method!=='GET') return J({error:'Metode tidak didukung'},405);
  const u=new URL(request.url),period=Object.hasOwn(WIN,u.searchParams.get('period'))?u.searchParams.get('period'):'all';
  const since=WIN[period]?Math.floor(Date.now()/1000)-WIN[period]:0,th=await threshold(env);
  const rows=await qa(env,'SELECT l.player_id pid,p.display_name name,l.quiz_points,l.adventure_points,l.total_points,l.missions_done,l.levels_done FROM leaderboard_scores l JOIN players p ON p.id=l.player_id WHERE l.hidden=0 AND p.deleted=0 AND l.total_points>0 AND l.updated_at>=? ORDER BY l.total_points DESC,l.missions_done DESC,l.updated_at ASC LIMIT 50',since);
  const ids=rows.map(r=>r.pid),ph=ids.map(()=>'?').join(',');
  const met=new Set(ids.length?(await qa(env,`SELECT player_id FROM learning_assessments WHERE player_id IN (${ph}) GROUP BY player_id HAVING MAX(score_pct)>=?`,...ids,th)).map(x=>x.player_id):[]);
  const fin=new Set(ids.length?(await qa(env,`SELECT player_id FROM game_missions WHERE player_id IN (${ph}) AND mission_id='final' AND flagged=0`,...ids)).map(x=>x.player_id):[]);
  return J({period,threshold_pct:th,
    formula:'Total = skor kuis (maks 1000) + skor petualangan (0-1000, dinormalisasi dari poin misi tervalidasi server). Progres edukasi = level kuis lulus / 5.',
    rows:rows.map((r,i)=>{const a=[];
      if(r.levels_done) a.push(`Lulus ${r.levels_done} level kuis`);
      for(const t of [10,20,30]) if(r.missions_done>=t) a.push(`${t} misi selesai`);
      if(fin.has(r.pid)) a.push('Menamatkan Misi Terakhir (simulasi)');
      if(met.has(r.pid)) a.push('Memenuhi kriteria pemahaman');
      return {rank:i+1,name:r.name,quiz_points:r.quiz_points,adventure_points:r.adventure_points,total_points:r.total_points,missions_done:r.missions_done,education_progress_pct:Math.round(r.levels_done*100/5),achievements:a};})},
  200,{'cache-control':'public, max-age=30'});
});
