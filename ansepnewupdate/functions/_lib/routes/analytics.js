import {J,q1,qa,guard,threshold} from '../util.js';
const pct=(n,d)=>d>0?Math.round(n*1000/d)/10:null;
// Analitik agregat pemahaman (publik, tanpa data pribadi). Percobaan yang ditandai (flagged) tidak dihitung.
export const handle=guard(async({request,env})=>{
  if(request.method!=='GET') return J({error:'Metode tidak didukung'},405);
  const th=await threshold(env),day=86400,since=Math.floor(Date.now()/1000)-30*day;
  const players=(await q1(env,'SELECT COUNT(*) c FROM players WHERE deleted=0')).c;
  const pre=(await q1(env,"SELECT COUNT(DISTINCT player_id) c FROM learning_assessments WHERE kind='pre'")).c;
  const assessed=(await q1(env,'SELECT COUNT(DISTINCT player_id) c FROM learning_assessments')).c;
  const met=(await q1(env,'SELECT COUNT(*) c FROM (SELECT player_id FROM learning_assessments GROUP BY player_id HAVING MAX(score_pct)>=?)',th)).c;
  const cmp=await q1(env,`SELECT COUNT(*) n,AVG(pre) avg_pre,AVG(post) avg_post,AVG(post-pre) delta,SUM(post>pre) improved FROM (SELECT player_id,
    (SELECT score_pct FROM learning_assessments x WHERE x.player_id=p.player_id AND kind='pre' ORDER BY created_at LIMIT 1) pre,
    (SELECT score_pct FROM learning_assessments x WHERE x.player_id=p.player_id AND kind='post' ORDER BY created_at DESC LIMIT 1) post
    FROM (SELECT DISTINCT player_id FROM learning_assessments) p) WHERE pre IS NOT NULL AND post IS NOT NULL`);
  const levels=[];
  for(let l=1;l<=5;l++){
    const a=await q1(env,"SELECT COUNT(DISTINCT player_id) att,COUNT(DISTINCT CASE WHEN correct*100.0/total>=? THEN player_id END) pass FROM quiz_attempts WHERE kind='level' AND level=? AND submitted_at IS NOT NULL AND flagged=0",th,l);
    levels.push({level:l,attempted:a.att,passed:a.pass,pass_pct_of_attempted:pct(a.pass,a.att)});
  }
  const avg=(await q1(env,"SELECT AVG(correct*100.0/total) a,COUNT(*) n FROM quiz_attempts WHERE kind='level' AND submitted_at IS NOT NULL AND flagged=0")).a;
  const okf="t.submitted_at IS NOT NULL AND t.flagged=0 AND a.chosen_index IS NOT NULL";
  const missed=await qa(env,`SELECT q.question,q.category,COUNT(*) answered,SUM(1-a.is_correct) wrong FROM quiz_answers a JOIN quiz_attempts t ON t.id=a.attempt_id JOIN quiz_questions q ON q.id=a.question_id WHERE ${okf} GROUP BY q.id HAVING answered>=3 ORDER BY wrong*1.0/answered DESC,answered DESC LIMIT 5`);
  const cats=await qa(env,`SELECT a.category,SUM(a.is_correct) correct,COUNT(*) total FROM quiz_answers a JOIN quiz_attempts t ON t.id=a.attempt_id WHERE ${okf} GROUP BY a.category ORDER BY a.category`);
  const ms=await q1(env,'SELECT COUNT(*) n,COUNT(DISTINCT m.player_id) p FROM game_missions m JOIN game_mission_defs d USING(mission_id) WHERE d.educational=1 AND m.flagged=0');
  const trend=async(sql)=>Object.fromEntries((await qa(env,sql,since)).map(r=>[r.d,r.n]));
  const tq=await trend("SELECT date(submitted_at,'unixepoch') d,COUNT(*) n FROM quiz_attempts WHERE submitted_at>=? AND flagged=0 GROUP BY d");
  const tp=await trend("SELECT date(created_at,'unixepoch') d,COUNT(*) n FROM players WHERE created_at>=? GROUP BY d");
  const tm=await trend("SELECT date(completed_at,'unixepoch') d,COUNT(*) n FROM game_missions WHERE completed_at>=? AND flagged=0 GROUP BY d");
  const days=[];for(let i=29;i>=0;i--)days.push(new Date((Math.floor(Date.now()/1000)-i*day)*1000).toISOString().slice(0,10));
  return J({threshold_pct:th,
    definitions:{unique_players:'ID pemain berbeda (bukan jumlah kunjungan)',assessed:'pemain yang menyelesaikan minimal satu evaluasi (awal/akhir)',met_pct:'memenuhi kriteria / peserta evaluasi',improved_pct:'evaluasi akhir terbaru > evaluasi awal pertama / peserta yang punya keduanya'},
    unique_players:players,pre_participants:pre,assessed,
    met:{count:met,den:assessed,pct:pct(met,assessed)},
    comparison:{den:cmp.n,avg_pre:cmp.avg_pre==null?null:Math.round(cmp.avg_pre*10)/10,avg_post:cmp.avg_post==null?null:Math.round(cmp.avg_post*10)/10,avg_change_points:cmp.delta==null?null:Math.round(cmp.delta*10)/10,improved:cmp.improved||0,improved_pct:pct(cmp.improved||0,cmp.n)},
    levels,avg_quiz_pct:avg==null?null:Math.round(avg*10)/10,most_missed:missed.map(m=>({...m,wrong_pct:pct(m.wrong,m.answered)})),
    categories:cats.map(c=>({...c,pct:pct(c.correct,c.total)})),
    educational_missions:{completed:ms.n,players:ms.p},
    trend:{days,quiz_attempts:days.map(d=>tq[d]||0),new_players:days.map(d=>tp[d]||0),missions:days.map(d=>tm[d]||0)},
    note:'Indikator pemahaman peserta platform. Hasil tes tidak membuktikan perubahan perilaku dan bukan survei representatif penduduk Barito Kuala.'});
},);
