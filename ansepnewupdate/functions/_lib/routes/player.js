import {J,q1,run,now,rnd,sha,ip,limited,readJson,authPlayer,cleanName,guard,HttpError} from '../util.js';
const route=ctx=>[].concat(ctx.params.route||[]).join('/');
export const handle=guard(async ctx=>{
  const {request,env}=ctx,r=route(ctx);
  if(request.method==='POST'&&r===''){ // buat pemain: tanpa akun, tanpa data pribadi
    const name=cleanName((await readJson(request)).display_name); // validasi dulu: salah ketik tidak menghabiskan kuota
    if(await limited(env,'newplayer:'+ip(request),60,3600)) throw new HttpError(429,'Terlalu banyak pemain baru dari jaringan ini. Coba lagi dalam satu jam atau pakai kode pemulihan.');
    const id='AZ-'+rnd(4).toUpperCase(), secret=rnd(24);
    await run(env,'INSERT INTO players(id,display_name,secret_hash,created_at,last_seen) VALUES(?,?,?,?,?)',id,name,await sha(secret),now(),now());
    return J({id,display_name:name,recovery_code:id+'.'+secret,note:'Simpan kode pemulihan. Kode ini satu-satunya cara melanjutkan progres di perangkat lain dan tidak bisa dipulihkan jika hilang.'},201);
  }
  const p=await authPlayer(request,env); if(!p) throw new HttpError(401,'Kode pemain tidak valid');
  if(request.method==='GET'&&r==='me'){await run(env,'UPDATE players SET last_seen=? WHERE id=?',now(),p.id);return J({id:p.id,display_name:p.display_name});}
  if(request.method==='DELETE'&&r==='me'){ // hapus seluruh data pemain
    const b=[`DELETE FROM quiz_answers WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE player_id=?)`,'DELETE FROM learning_assessments WHERE player_id=?','DELETE FROM quiz_attempts WHERE player_id=?','DELETE FROM game_missions WHERE player_id=?','DELETE FROM game_sessions WHERE player_id=?','DELETE FROM leaderboard_scores WHERE player_id=?','DELETE FROM players WHERE id=?'];
    await env.DB.batch(b.map(s=>env.DB.prepare(s).bind(p.id)));
    return J({deleted:true});
  }
  throw new HttpError(404,'Tidak ditemukan');
});
