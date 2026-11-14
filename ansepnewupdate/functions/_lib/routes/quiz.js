import {J,q1,qa,run,now,rnd,limited,readJson,authPlayer,guard,HttpError,threshold,recomputeScore} from '../util.js';
const POINTS_PER_CORRECT=10, MIN_SEC_PER_Q=2, LEVEL_Q=20, ASSESS_Q=10;
const route=ctx=>[].concat(ctx.params.route||[]).join('/');
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};

export const handle=guard(async ctx=>{
  const {request,env}=ctx,r=route(ctx);
  const p=await authPlayer(request,env); if(!p) throw new HttpError(401,'Kode pemain tidak valid');
  if(request.method==='GET'&&r==='progress'){
    const th=await threshold(env);
    const levels=await qa(env,"SELECT level,MAX(correct*100.0/total) best_pct,COUNT(*) tries FROM quiz_attempts WHERE player_id=? AND kind='level' AND submitted_at IS NOT NULL GROUP BY level",p.id);
    const asm=await qa(env,'SELECT kind,MAX(score_pct) best,COUNT(*) tries FROM learning_assessments WHERE player_id=? GROUP BY kind',p.id);
    const avail=await qa(env,"SELECT kind,level,COUNT(*) n FROM quiz_questions WHERE active=1 GROUP BY kind,level");
    const sc=await q1(env,'SELECT quiz_points,adventure_points,total_points,levels_done,missions_done FROM leaderboard_scores WHERE player_id=?',p.id);
    return J({threshold_pct:th,levels,assessments:asm,available:avail,score:sc||{quiz_points:0,adventure_points:0,total_points:0,levels_done:0,missions_done:0}});
  }
  if(request.method==='POST'&&r==='start'){
    if(await limited(env,'qstart:'+p.id,30,3600)) throw new HttpError(429,'Terlalu banyak percobaan. Coba lagi nanti.');
    const b=await readJson(request),kind=b.kind,level=Number(b.level);
    let qs;
    if(kind==='level'){
      if(!Number.isInteger(level)||level<1||level>5) throw new HttpError(400,'Level tidak valid');
      qs=await qa(env,"SELECT id,category,question,options_json FROM quiz_questions WHERE kind='level' AND level=? AND active=1 ORDER BY RANDOM() LIMIT ?",level,LEVEL_Q);
    }else if(kind==='pre'||kind==='post'){
      if(kind==='pre'&&await q1(env,"SELECT 1 x FROM learning_assessments WHERE player_id=? AND kind='pre'",p.id)) throw new HttpError(409,'Evaluasi awal hanya dapat diambil sekali');
      qs=await qa(env,'SELECT id,category,question,options_json FROM quiz_questions WHERE kind=? AND active=1 ORDER BY RANDOM() LIMIT ?',kind,ASSESS_Q);
    }else throw new HttpError(400,'Jenis kuis tidak valid');
    if(!qs.length) throw new HttpError(404,'Soal untuk bagian ini belum tersedia');
    const id='QA-'+rnd(8);
    await env.DB.batch([
      env.DB.prepare('INSERT INTO quiz_attempts(id,player_id,kind,level,started_at,total) VALUES(?,?,?,?,?,?)').bind(id,p.id,kind,kind==='level'?level:null,now(),qs.length),
      ...qs.map(q=>env.DB.prepare('INSERT INTO quiz_answers(attempt_id,question_id,chosen_index,is_correct,category) VALUES(?,?,NULL,0,?)').bind(id,q.id,q.category))
    ]);
    // kunci jawaban dan penjelasan TIDAK dikirim; opsi diacak, "i" = indeks asli
    return J({attempt_id:id,kind,level:kind==='level'?level:null,questions:qs.map(q=>({id:q.id,category:q.category,question:q.question,options:shuffle(JSON.parse(q.options_json).map((t,i)=>({i,t})))}))});
  }
  if(request.method==='POST'&&r==='answer'){
    if(await limited(env,'qans:'+p.id,600,3600)) throw new HttpError(429,'Terlalu banyak permintaan');
    const b=await readJson(request),qid=Number(b.question_id),ci=b.chosen_index;
    const at=await q1(env,'SELECT id,submitted_at FROM quiz_attempts WHERE id=? AND player_id=?',String(b.attempt_id||''),p.id);
    if(!at) throw new HttpError(404,'Sesi kuis tidak ditemukan');
    if(at.submitted_at) throw new HttpError(409,'Sesi kuis sudah selesai');
    const q=await q1(env,'SELECT q.correct_index,q.explanation,q.options_json FROM quiz_questions q JOIN quiz_answers a ON a.question_id=q.id WHERE a.attempt_id=? AND q.id=?',at.id,qid);
    if(!q) throw new HttpError(404,'Soal tidak ada di sesi ini');
    if(!Number.isInteger(ci)||ci<0||ci>=JSON.parse(q.options_json).length) throw new HttpError(400,'Pilihan tidak valid');
    const ok=ci===q.correct_index?1:0;
    const res=await run(env,'UPDATE quiz_answers SET chosen_index=?,is_correct=? WHERE attempt_id=? AND question_id=? AND chosen_index IS NULL',ci,ok,at.id,qid);
    if(res.meta.changes!==1) throw new HttpError(409,'Soal ini sudah dijawab');
    return J({is_correct:!!ok,correct_index:q.correct_index,explanation:q.explanation});
  }
  if(request.method==='POST'&&r==='finish'){
    const b=await readJson(request);
    const at=await q1(env,'SELECT * FROM quiz_attempts WHERE id=? AND player_id=?',String(b.attempt_id||''),p.id);
    if(!at) throw new HttpError(404,'Sesi kuis tidak ditemukan');
    const th=await threshold(env);
    const summary=async a=>({kind:a.kind,level:a.level,correct:a.correct,total:a.total,pct:Math.round(a.correct*1000/a.total)/10,points:a.points,passed:a.correct*100/a.total>=th,threshold_pct:th,duration_s:a.duration_s,
      by_category:await qa(env,'SELECT category,SUM(is_correct) correct,COUNT(*) total FROM quiz_answers WHERE attempt_id=? GROUP BY category',a.id)});
    if(at.submitted_at) return J({...await summary(at),already_submitted:true}); // idempotent: tidak ada skor ganda
    const t=now(),c=await q1(env,'SELECT SUM(is_correct) c,COUNT(*) n FROM quiz_answers WHERE attempt_id=?',at.id);
    const dur=t-at.started_at,flagged=dur<c.n*MIN_SEC_PER_Q?1:0,pts=at.kind==='level'?c.c*POINTS_PER_CORRECT:0;
    const res=await run(env,'UPDATE quiz_attempts SET submitted_at=?,correct=?,total=?,points=?,duration_s=?,flagged=? WHERE id=? AND submitted_at IS NULL',t,c.c,c.n,pts,dur,flagged,at.id);
    if(res.meta.changes!==1) throw new HttpError(409,'Sesi sudah diproses');
    if((at.kind==='pre'||at.kind==='post')&&!flagged) await run(env,'INSERT INTO learning_assessments(player_id,attempt_id,kind,correct,total,score_pct,created_at) VALUES(?,?,?,?,?,?,?)',p.id,at.id,at.kind,c.c,c.n,c.c*100.0/c.n,t);
    await recomputeScore(env,p.id);
    const fin=await q1(env,'SELECT * FROM quiz_attempts WHERE id=?',at.id);
    return J({...await summary(fin),flagged:!!flagged,flag_note:flagged?'Pengerjaan terlalu cepat; hasil ini tidak dihitung di leaderboard dan analitik.':undefined});
  }
  throw new HttpError(404,'Tidak ditemukan');
});
