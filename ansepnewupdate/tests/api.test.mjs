import {makeDB} from './d1shim.mjs';
import {handle as playerH} from '../functions/_lib/routes/player.js';
import {handle as quizH} from '../functions/_lib/routes/quiz.js';
import {onRequest as pubH} from '../functions/api/[[route]].js';
const env={DB:makeDB(['0001_schema','0002_seed_produksi','0003_edukasi_draf','0004_soal_awal','0005_game','0006_materi_lengkap','0007_soal_lengkap','0008_sumber_ispa','0010_kontak_damkar','0011_soal_tambahan'].map(f=>`migrations/${f}.sql`))};
let fail=0;const ok=(c,m)=>{console.log((c?'LULUS ':'GAGAL ')+m);if(!c)fail++;};
const call=async(h,path,method='GET',body,tok)=>{
  const r=new Request('http://x/api/'+path,{method,headers:{'content-type':'application/json',...(tok?{authorization:'Bearer '+tok}:{})},body:body?JSON.stringify(body):undefined});
  const seg=(h===pubH?path.split('/'):path.split('/').slice(1)).filter(Boolean);const res=await h({request:r,env,params:{route:seg}});return {s:res.status,j:await res.json()};
};
// pemain
let r=await call(playerH,'player','POST',{display_name:'0812345678'});ok(r.s===400,'nama berisi nomor telepon ditolak');
r=await call(playerH,'player','POST',{display_name:'Ani <b>'});ok(r.s===400,'nama dengan karakter HTML ditolak');
r=await call(playerH,'player','POST',{display_name:'Ani Hutan'});ok(r.s===201&&r.j.recovery_code,'buat pemain');
const tok=r.j.recovery_code,pid=r.j.id;
r=await call(playerH,'player/me','GET',null,tok);ok(r.s===200&&r.j.display_name==='Ani Hutan','login dengan kode');
r=await call(playerH,'player/me','GET',null,tok.slice(0,-1)+(tok.slice(-1)==='0'?'1':'0'));ok(r.s===401,'kode salah ditolak');
r=await call(quizH,'quiz/progress','GET');ok(r.s===401,'tanpa kode ditolak');
// kuis level 1
r=await call(quizH,'quiz/start','POST',{kind:'level',level:1},tok);ok(r.s===200&&r.j.questions.length===20,'mulai level 1 (20 soal)');
ok(!JSON.stringify(r.j).includes('correct')&&!JSON.stringify(r.j).includes('explanation'),'kunci jawaban tidak bocor ke browser');
const att=r.j.attempt_id,qs=r.j.questions;
r=await call(quizH,'quiz/start','POST',{kind:'level',level:9},tok);ok(r.s===400,'level tidak valid ditolak');
// jawab: 7 benar, 3 salah. Browser tidak tahu kunci; ambil dari DB untuk simulasi
let right=0;
for(let i=0;i<qs.length;i++){
  const key=env.DB.raw.prepare('SELECT correct_index k FROM quiz_questions WHERE id=?').get(qs[i].id).k;
  const pick=i<7?key:qs[i].options.find(o=>o.i!==key).i;
  const a=await call(quizH,'quiz/answer','POST',{attempt_id:att,question_id:qs[i].id,chosen_index:pick},tok);
  if(a.j.is_correct)right++; if(i===0){ok(!!a.j.explanation,'penjelasan muncul setelah menjawab');
    const again=await call(quizH,'quiz/answer','POST',{attempt_id:att,question_id:qs[i].id,chosen_index:key},tok);ok(again.s===409,'jawaban tidak bisa diubah');}
}
ok(right===7,'7 jawaban benar dinilai server');
// selesai terlalu cepat -> ditandai
r=await call(quizH,'quiz/finish','POST',{attempt_id:att},tok);ok(r.s===200&&r.j.correct===7&&r.j.flagged===true,'selesai terlalu cepat ditandai, skor server benar');
let lb=env.DB.raw.prepare('SELECT * FROM leaderboard_scores WHERE player_id=?').get(pid);ok(lb.quiz_points===0,'sesi ditandai tidak masuk leaderboard');
r=await call(quizH,'quiz/finish','POST',{attempt_id:att},tok);ok(r.j.already_submitted===true,'finish ganda tidak menggandakan skor');
// sesi normal: ubah waktu mulai ke belakang agar tidak ditandai
r=await call(quizH,'quiz/start','POST',{kind:'level',level:1},tok);const a2=r.j.attempt_id;
for(const q of r.j.questions){const key=env.DB.raw.prepare('SELECT correct_index k FROM quiz_questions WHERE id=?').get(q.id).k;await call(quizH,'quiz/answer','POST',{attempt_id:a2,question_id:q.id,chosen_index:key},tok);}
env.DB.raw.prepare('UPDATE quiz_attempts SET started_at=started_at-120 WHERE id=?').run(a2);
r=await call(quizH,'quiz/finish','POST',{attempt_id:a2},tok);ok(r.j.pct===100&&r.j.passed&&!r.j.flagged&&r.j.points===200,'level 1 sempurna: 200 poin (20 soal x 10), lulus');
lb=env.DB.raw.prepare('SELECT * FROM leaderboard_scores WHERE player_id=?').get(pid);ok(lb.quiz_points===200&&lb.total_points===200&&lb.levels_done===1,'leaderboard dihitung server');
// evaluasi awal sekali saja, tercatat di analitik
r=await call(quizH,'quiz/start','POST',{kind:'pre'},tok);const a3=r.j.attempt_id;
for(const q of r.j.questions){const key=env.DB.raw.prepare('SELECT correct_index k FROM quiz_questions WHERE id=?').get(q.id).k;await call(quizH,'quiz/answer','POST',{attempt_id:a3,question_id:q.id,chosen_index:key},tok);}
env.DB.raw.prepare('UPDATE quiz_attempts SET started_at=started_at-120 WHERE id=?').run(a3);
r=await call(quizH,'quiz/finish','POST',{attempt_id:a3},tok);ok(r.j.passed&&r.j.pct===100,'evaluasi awal selesai');
r=await call(quizH,'quiz/start','POST',{kind:'pre'},tok);ok(r.s===409,'evaluasi awal tidak bisa diulang');
r=await call(pubH,'stats');ok(r.j.players===1&&r.j.assessed===1&&r.j.met_criteria===1&&r.j.met_pct===100&&r.j.comparable===0&&r.j.improved_pct===null,'statistik publik dari database, belum ada pembanding awal-akhir');
// hapus data
r=await call(playerH,'player/me','DELETE',null,tok);ok(r.j.deleted,'hapus data pemain');
ok(env.DB.raw.prepare('SELECT (SELECT COUNT(*) FROM players)+(SELECT COUNT(*) FROM quiz_attempts)+(SELECT COUNT(*) FROM learning_assessments)+(SELECT COUNT(*) FROM leaderboard_scores) n').get().n===0,'semua data pemain terhapus');
console.log(fail?`\n${fail} UJI GAGAL`:'\nSemua uji lulus');process.exit(fail?1:0);
