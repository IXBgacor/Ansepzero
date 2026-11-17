import {J,q1,qa,run,now,rnd,sha,ip,limited,readJson,guard,HttpError,threshold,recomputeScore} from '../util.js';
import {makeHash,verifyHash,dummyVerify,sameStr,requireAdmin,audit,csv} from '../admin.js';
const CATS=['penyebab','pencegahan','kesehatan','lingkungan','darurat'],KINDS=['level','pre','post'];
const S=(v,min,max,lbl)=>{v=String(v??'').trim();if(v.length<min||v.length>max)throw new HttpError(400,`${lbl} harus ${min}-${max} karakter`);return v;};
const I=(v,a,b,lbl)=>{v=Number(v);if(!Number.isInteger(v)||v<a||v>b)throw new HttpError(400,`${lbl} harus bilangan bulat ${a}-${b}`);return v;};
const B=v=>v?1:0;
const ENT={
  questions:{t:'quiz_questions',pk:'id',soft:'active',list:'SELECT * FROM quiz_questions ORDER BY kind,level,id',
    f:b=>{const o=Array.isArray(b.options)?b.options.map(x=>S(x,1,200,'Opsi')):(()=>{throw new HttpError(400,'Opsi harus berupa daftar');})();
      if(o.length<2||o.length>6)throw new HttpError(400,'Jumlah opsi 2-6');
      if(!CATS.includes(b.category))throw new HttpError(400,'Kategori tidak valid');if(!KINDS.includes(b.kind||'level'))throw new HttpError(400,'Jenis tidak valid');
      return {level:I(b.level,1,5,'Level'),category:b.category,kind:b.kind||'level',question:S(b.question,5,500,'Pertanyaan'),options_json:JSON.stringify(o),correct_index:I(b.correct_index,0,o.length-1,'Kunci'),explanation:S(b.explanation,5,600,'Penjelasan'),source_ref:b.source_ref?S(b.source_ref,1,200,'Sumber'):null,active:B(b.active??1)};}},
  content:{t:'education_content',pk:'slug',list:'SELECT * FROM education_content ORDER BY sort,slug',
    f:b=>{if(!/^[a-z0-9-]{2,40}$/.test(String(b.slug||'')))throw new HttpError(400,'Slug a-z, 0-9, tanda hubung');
      const src=Array.isArray(b.sources)?b.sources.slice(0,20).map(s=>({t:S(s.t,2,300,'Judul sumber'),u:(()=>{const u=String(s.u||'');if(!/^https?:\/\/[^\s]{4,500}$/.test(u))throw new HttpError(400,'URL sumber tidak valid');return u;})()})):[];
      return {slug:b.slug,title:S(b.title,2,150,'Judul'),body_md:S(b.body_md,5,8000,'Isi'),sources_json:JSON.stringify(src),sort:I(b.sort??0,0,999,'Urutan'),published:B(b.published),updated_at:now()};}},
  contacts:{t:'contacts',pk:'id',list:'SELECT * FROM contacts ORDER BY sort,id',
    f:b=>{const ph=String(b.phone_intl||'').replace(/\D/g,'');if(!/^(\d{3,4}|[1-9]\d{7,14})$/.test(ph))throw new HttpError(400,'Nomor format internasional tanpa + (contoh 6281234567890) atau kode pendek 3-4 digit (contoh 117)');
      return {name:S(b.name,2,100,'Nama'),phone_intl:ph,note:b.note?S(b.note,1,300,'Catatan'):null,verified:B(b.verified),sort:I(b.sort??0,0,999,'Urutan'),active:B(b.active??1)};}},
  announcements:{t:'announcements',pk:'id',list:'SELECT * FROM announcements ORDER BY created_at DESC',
    f:b=>({title:S(b.title,2,120,'Judul'),body:S(b.body,2,1000,'Isi'),published:B(b.published??1)})},
};
async function crud(env,adm,name,method,id,body){
  const e=ENT[name];
  if(method==='GET'&&id==null){const rows=await qa(env,e.list);return {rows:name==='questions'?rows.map(r=>({...r,options:JSON.parse(r.options_json)})):name==='content'?rows.map(r=>({...r,sources:JSON.parse(r.sources_json)})):rows};}
  if(method==='POST'){const v=e.f(body);if(name==='announcements')v.created_at=now();
    const cols=Object.keys(v);try{await run(env,`INSERT INTO ${e.t}(${cols.join(',')}) VALUES(${cols.map(()=>'?').join(',')})`,...cols.map(c=>v[c]));}catch(x){if(/UNIQUE|PRIMARY/.test(String(x.message)))throw new HttpError(409,'Sudah ada');throw x;}
    await audit(env,adm.id,`${name}.create`,v.slug||v.name||v.title||v.question);return {ok:true};}
  if(method==='PUT'&&id!=null){const v=e.f(name==='content'?{...body,slug:id}:body);delete v[e.pk];
    const cols=Object.keys(v),r=await run(env,`UPDATE ${e.t} SET ${cols.map(c=>c+'=?').join(',')} WHERE ${e.pk}=?`,...cols.map(c=>v[c]),id);
    if(!r.meta.changes)throw new HttpError(404,'Tidak ditemukan');await audit(env,adm.id,`${name}.update`,id);return {ok:true};}
  if(method==='DELETE'&&id!=null){const r=e.soft?await run(env,`UPDATE ${e.t} SET ${e.soft}=0 WHERE ${e.pk}=?`,id):await run(env,`DELETE FROM ${e.t} WHERE ${e.pk}=?`,id);
    if(!r.meta.changes)throw new HttpError(404,'Tidak ditemukan');await audit(env,adm.id,`${name}.${e.soft?'deactivate':'delete'}`,id);return {ok:true};}
  throw new HttpError(405,'Metode tidak didukung');
}
const sqlv=v=>v==null?'NULL':typeof v==='number'?String(v):"'"+String(v).replace(/'/g,"''")+"'";
const BACKUP=['players','quiz_questions','quiz_attempts','quiz_answers','learning_assessments','game_sessions','game_mission_defs','game_missions','leaderboard_scores','education_content','contacts','announcements','ispa_data','citizen_reports','app_settings','page_visits','audit_logs'];

export const handle=guard(async ctx=>{
  const {request,env}=ctx,seg=[].concat(ctx.params.route||[]),m=request.method,r0=seg[0],id=seg[1];
  // --- tanpa sesi ---
  if(m==='POST'&&r0==='setup'){
    if(!env.ADMIN_SETUP_TOKEN) throw new HttpError(503,'Secret ADMIN_SETUP_TOKEN belum diatur di Cloudflare');
    if(await limited(env,'setup:'+ip(request),5,3600)) throw new HttpError(429,'Terlalu banyak percobaan');
    const b=await readJson(request);
    if(!sameStr(await sha(String(b.token||'')),await sha(env.ADMIN_SETUP_TOKEN))) throw new HttpError(403,'Token setup salah');
    const u=String(b.username||'').toLowerCase();if(!/^[a-z0-9_.-]{3,30}$/.test(u))throw new HttpError(400,'Username 3-30 karakter (a-z, 0-9, _ . -)');
    const pw=String(b.password||'');if(pw.length<12||pw.length>200)throw new HttpError(400,'Password minimal 12 karakter');
    const h=await makeHash(pw),ex=await q1(env,'SELECT id FROM admin_users WHERE username=?',u);
    if(ex){await run(env,'UPDATE admin_users SET pass_hash=? WHERE id=?',h,ex.id);await run(env,'DELETE FROM admin_sessions WHERE admin_id=?',ex.id);await audit(env,ex.id,'admin.password_reset','via setup token');return J({ok:true,reset:true});}
    try{await run(env,'INSERT INTO admin_users(username,pass_hash,active,created_at) VALUES(?,?,1,?)',u,h,now());}catch(e){if(String(e.message).includes('ADMIN_LIMIT'))throw new HttpError(409,'Batas 5 admin aktif tercapai');throw e;}
    await audit(env,null,'admin.create',u+' (setup token)');return J({ok:true,created:true},201);
  }
  if(m==='POST'&&r0==='login'){
    const b=await readJson(request),u=String(b.username||'').toLowerCase().slice(0,30),pw=String(b.password||'').slice(0,200);
    if(await limited(env,'login-ip:'+ip(request),10,900)||await limited(env,'login-u:'+u,8,900)) throw new HttpError(429,'Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.');
    const a=await q1(env,'SELECT id,pass_hash FROM admin_users WHERE username=? AND active=1',u);
    const good=a?await verifyHash(pw,a.pass_hash):(await dummyVerify(pw),false);
    if(!good) throw new HttpError(401,'Username atau password salah');
    const t=rnd(32);await run(env,'INSERT INTO admin_sessions(token_hash,admin_id,expires_at) VALUES(?,?,?)',await sha(t),a.id,now()+8*3600);
    await run(env,'DELETE FROM admin_sessions WHERE expires_at<?',now());await audit(env,a.id,'admin.login','');
    return J({ok:true,username:u},200,{'set-cookie':`az_admin=${t}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=28800`});
  }
  // --- butuh sesi ---
  const write=m!=='GET',adm=await requireAdmin(request,env,write);
  if(m==='GET'&&r0==='me') return J({username:adm.username});
  if(m==='POST'&&r0==='logout'){const t=/az_admin=([0-9a-f]{64})/.exec(request.headers.get('cookie')||'')[1];await run(env,'DELETE FROM admin_sessions WHERE token_hash=?',await sha(t));return J({ok:true},200,{'set-cookie':'az_admin=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0'});}
  if(Object.hasOwn(ENT,r0)) return J(await crud(env,adm,r0,m,id==null?null:(r0==='content'?id:Number(id)),m==='GET'||m==='DELETE'?null:await readJson(request,20000)));
  if(r0==='demo-stats'&&m==='GET'){
    const row=await q1(env,"SELECT value FROM app_settings WHERE key='demo_stats'");
    let d={enabled:true,visits:84,players:11,assessed:4,met_criteria:2,comparable:1,improved:1,educational_missions_done:21};
    if(row?.value){try{d={...d,...JSON.parse(row.value)}}catch(e){}}
    return J(d);
  }
  if(r0==='demo-stats'&&m==='PUT'){
    const x=await readJson(request,5000);
    const d={
      enabled:!!x.enabled,
      visits:I(x.visits,0,10000000,'Kunjungan'),
      players:I(x.players,0,10000000,'Pemain unik'),
      assessed:I(x.assessed,0,10000000,'Peserta evaluasi'),
      met_criteria:I(x.met_criteria,0,10000000,'Memenuhi kriteria'),
      comparable:I(x.comparable,0,10000000,'Peserta evaluasi awal dan akhir'),
      improved:I(x.improved,0,10000000,'Menunjukkan peningkatan'),
      educational_missions_done:I(x.educational_missions_done,0,10000000,'Misi edukasi selesai')
    };
    if(d.met_criteria>d.assessed||d.improved>d.comparable)throw new HttpError(400,'Jumlah hasil tidak boleh melebihi jumlah peserta.');
    await run(env,"INSERT INTO app_settings(key,value) VALUES('demo_stats',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",JSON.stringify(d));
    await audit(env,adm.id,'demo_stats.update',JSON.stringify(d));
    return J({ok:true,...d});
  }
  if(m==='GET'&&r0==='summary'){
    const c=async s=>(await q1(env,s)).c;
    const th=await threshold(env);
    // Persentase dihitung dari skor leaderboard terhadap skor maksimal gabungan.
    // Pemain tanpa baris leaderboard dihitung 0 poin agar seluruh pemain terwakili.
    let comprehension=await q1(env,`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(CASE
          WHEN COALESCE(l.total_points,0)*100.0/2000 >= ?
          THEN 1 ELSE 0 END),0) AS understood,
        COALESCE(SUM(CASE
          WHEN COALESCE(l.total_points,0)*100.0/2000 < ?
          THEN 1 ELSE 0 END),0) AS not_understood
      FROM players p
      LEFT JOIN leaderboard_scores l ON l.player_id=p.id
    `,th,th);
    const demoRow=await q1(env,"SELECT value FROM app_settings WHERE key='demo_stats'");
    if(demoRow?.value){
      try{const d=JSON.parse(demoRow.value);if(d.enabled)comprehension={total:d.assessed,understood:d.met_criteria,not_understood:Math.max(0,d.assessed-d.met_criteria),threshold:th};}catch(e){}
    }
    return J({
      players:await c('SELECT COUNT(*) c FROM players'),
      reports_waiting:await c("SELECT COUNT(*) c FROM citizen_reports WHERE status='menunggu'"),
      flagged_attempts:await c('SELECT COUNT(*) c FROM quiz_attempts WHERE flagged=1'),
      flagged_missions:await c('SELECT COUNT(*) c FROM game_missions WHERE flagged=1'),
      questions:await c('SELECT COUNT(*) c FROM quiz_questions WHERE active=1'),
      content_published:await c('SELECT COUNT(*) c FROM education_content WHERE published=1'),
      content_draft:await c('SELECT COUNT(*) c FROM education_content WHERE published=0'),
      admins_active:await c('SELECT COUNT(*) c FROM admin_users WHERE active=1'),
      admin_limit:5,
      threshold:th,
      photos_enabled:!!env.PHOTOS,
      comprehension:{
        understood:comprehension?.understood||0,
        not_understood:comprehension?.not_understood||0,
        total:comprehension?.total||0,
        threshold:th,
        max_score:2000
      }
    });
  }
  if(m==='GET'&&r0==='reports') return J({rows:await qa(env,'SELECT id,description,lat,lng,location_text,photo_key,status,created_at,is_demo FROM citizen_reports ORDER BY created_at DESC LIMIT 200')});
  if(m==='PUT'&&r0==='reports'){const b=await readJson(request);if(!['menunggu','ditinjau','ditindaklanjuti'].includes(b.status))throw new HttpError(400,'Status tidak valid');
    const r=await run(env,'UPDATE citizen_reports SET status=? WHERE id=?',b.status,id);if(!r.meta.changes)throw new HttpError(404,'Tidak ditemukan');await audit(env,adm.id,'report.status',id+' -> '+b.status);return J({ok:true});}
  if(m==='DELETE'&&r0==='reports'){const rp=await q1(env,'SELECT photo_key FROM citizen_reports WHERE id=?',id);if(!rp)throw new HttpError(404,'Tidak ditemukan');
    if(rp.photo_key&&env.PHOTOS)await env.PHOTOS.delete(rp.photo_key);await run(env,'DELETE FROM citizen_reports WHERE id=?',id);await audit(env,adm.id,'report.delete',id);return J({ok:true});}
  if(m==='GET'&&r0==='missions') return J({rows:await qa(env,'SELECT mission_id,title,max_points,min_duration_s,educational,active,ord FROM game_mission_defs ORDER BY ord')});
  if(m==='PUT'&&r0==='missions'){const b=await readJson(request),v={max_points:I(b.max_points,0,10000,'Poin maks'),min_duration_s:I(b.min_duration_s,0,3600,'Durasi minimal'),active:B(b.active),educational:B(b.educational)};
    const r=await run(env,'UPDATE game_mission_defs SET max_points=?,min_duration_s=?,active=?,educational=? WHERE mission_id=?',v.max_points,v.min_duration_s,v.active,v.educational,String(id||''));if(!r.meta.changes)throw new HttpError(404,'Misi tidak ditemukan');
    for(const x of await qa(env,'SELECT DISTINCT player_id FROM game_missions'))await recomputeScore(env,x.player_id);
    await audit(env,adm.id,'mission.update',id+' '+JSON.stringify(v));return J({ok:true});}
  if(m==='GET'&&r0==='report-photo'){if(!env.PHOTOS)throw new HttpError(404,'Penyimpanan foto tidak aktif');if(!/^[0-9a-f]{32}$/.test(id||''))throw new HttpError(400,'Kunci tidak valid');
    const o=await env.PHOTOS.get(id);if(!o)throw new HttpError(404,'Foto tidak ada');return new Response(o.body,{headers:{'content-type':o.httpMetadata?.contentType||'image/jpeg','cache-control':'private, no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'"}});}
  if(m==='GET'&&r0==='flags') return J({attempts:await qa(env,'SELECT t.id,p.display_name name,t.kind,t.level,t.correct,t.total,t.duration_s FROM quiz_attempts t JOIN players p ON p.id=t.player_id WHERE t.flagged=1 ORDER BY t.submitted_at DESC LIMIT 100'),missions:await qa(env,'SELECT g.player_id,g.mission_id,p.display_name name,g.points,g.duration_s FROM game_missions g JOIN players p ON p.id=g.player_id WHERE g.flagged=1 ORDER BY g.completed_at DESC LIMIT 100')});
  if(m==='POST'&&r0==='flags'){const b=await readJson(request),ok=b.action==='approve';if(!ok&&b.action!=='reject')throw new HttpError(400,'Aksi tidak valid');
    let pid;
    if(b.type==='attempt'){const a=await q1(env,'SELECT * FROM quiz_attempts WHERE id=? AND flagged=1',String(b.id||''));if(!a)throw new HttpError(404,'Tidak ditemukan');pid=a.player_id;
      await run(env,'UPDATE quiz_attempts SET flagged=? WHERE id=?',ok?0:2,a.id);
      if(ok&&(a.kind==='pre'||a.kind==='post'))await run(env,'INSERT OR IGNORE INTO learning_assessments(player_id,attempt_id,kind,correct,total,score_pct,created_at) VALUES(?,?,?,?,?,?,?)',pid,a.id,a.kind,a.correct,a.total,a.correct*100.0/a.total,a.submitted_at);}
    else if(b.type==='mission'){const g=await q1(env,'SELECT player_id FROM game_missions WHERE player_id=? AND mission_id=? AND flagged=1',String(b.player_id||''),String(b.mission_id||''));if(!g)throw new HttpError(404,'Tidak ditemukan');pid=g.player_id;
      await run(env,'UPDATE game_missions SET flagged=? WHERE player_id=? AND mission_id=?',ok?0:2,pid,b.mission_id);}
    else throw new HttpError(400,'Jenis tidak valid');
    await recomputeScore(env,pid);await audit(env,adm.id,'flag.'+b.action,`${b.type} ${b.id||b.mission_id}`);return J({ok:true});}
  if(m==='GET'&&r0==='players') return J({rows:await qa(env,'SELECT p.id,p.display_name,p.created_at,COALESCE(l.total_points,0) total,COALESCE(l.hidden,0) hidden FROM players p LEFT JOIN leaderboard_scores l ON l.player_id=p.id ORDER BY total DESC LIMIT 200')});
  if(m==='PUT'&&r0==='players'){const b=await readJson(request);await run(env,'UPDATE leaderboard_scores SET hidden=? WHERE player_id=?',B(b.hidden),id);await audit(env,adm.id,'leaderboard.hide',id+' '+B(b.hidden));return J({ok:true});}
  if(m==='GET'&&r0==='settings') return J({pass_threshold:await threshold(env)});
  if(m==='PUT'&&r0==='settings'){const v=I((await readJson(request)).pass_threshold,1,100,'Ambang');await run(env,"INSERT INTO app_settings(key,value) VALUES('pass_threshold',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",String(v));await audit(env,adm.id,'settings.threshold',v);return J({ok:true,pass_threshold:v});}
  if(m==='GET'&&r0==='export'&&id==='aggregate.csv'){
    const c=async s=>(await q1(env,s)).c,th=await threshold(env);
    const rows=[['metrik','nilai','denominator','keterangan'],
      ['kunjungan_tercatat',await c('SELECT COALESCE(SUM(hits),0) c FROM page_visits'),'','jumlah kunjungan, bukan orang'],
      ['pemain_unik',await c('SELECT COUNT(*) c FROM players'),'','ID pemain berbeda'],
      ['peserta_evaluasi',await c('SELECT COUNT(DISTINCT player_id) c FROM learning_assessments'),'',''],
      ['memenuhi_kriteria',await c(`SELECT COUNT(*) c FROM (SELECT player_id FROM learning_assessments GROUP BY player_id HAVING MAX(score_pct)>=${th})`),await c('SELECT COUNT(DISTINCT player_id) c FROM learning_assessments'),`ambang ${th}% (keputusan desain)`],
      ['misi_edukasi_selesai',await c('SELECT COUNT(*) c FROM game_missions m JOIN game_mission_defs d USING(mission_id) WHERE d.educational=1 AND m.flagged=0'),'','']];
    for(const r of await qa(env,"SELECT level,COUNT(DISTINCT player_id) a FROM quiz_attempts WHERE kind='level' AND submitted_at IS NOT NULL AND flagged=0 GROUP BY level ORDER BY level"))rows.push(['level_'+r.level+'_pemain_mencoba',r.a,'','']);
    for(const r of await qa(env,'SELECT category,SUM(is_correct) c,COUNT(*) n FROM quiz_answers a JOIN quiz_attempts t ON t.id=a.attempt_id WHERE t.submitted_at IS NOT NULL AND t.flagged=0 AND a.chosen_index IS NOT NULL GROUP BY category'))rows.push(['kategori_'+r.category+'_benar',r.c,r.n,'jawaban benar / total jawaban']);
    await audit(env,adm.id,'export.aggregate','');
    return new Response(csv(rows),{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':'attachment; filename="ansepzero-agregat.csv"','cache-control':'no-store'}});
  }
  if(m==='GET'&&r0==='export'&&id==='backup.sql'){
    let out='-- Cadangan AnsepZero. Pulihkan: terapkan migrasi 0001-0005 pada database kosong, lalu tempel file ini di D1 Console.\n-- Tidak memuat akun admin, sesi, dan data rate limit.\n';
    for(const t of BACKUP){const rows=await qa(env,`SELECT * FROM ${t}`);for(const r of rows){const k=Object.keys(r);out+=`INSERT OR REPLACE INTO ${t}(${k.join(',')}) VALUES(${k.map(c=>sqlv(r[c])).join(',')});\n`;}}
    await audit(env,adm.id,'export.backup','');
    return new Response(out,{headers:{'content-type':'application/sql; charset=utf-8','content-disposition':'attachment; filename="ansepzero-cadangan.sql"','cache-control':'no-store'}});
  }
  if(r0==='admins'){
    if(m==='GET') return J({rows:await qa(env,'SELECT id,username,active,created_at FROM admin_users ORDER BY id'),limit:5});
    if(m==='POST'){const b=await readJson(request),u=String(b.username||'').toLowerCase(),pw=String(b.password||'');
      if(!/^[a-z0-9_.-]{3,30}$/.test(u))throw new HttpError(400,'Username 3-30 karakter');if(pw.length<12)throw new HttpError(400,'Password minimal 12 karakter');
      try{await run(env,'INSERT INTO admin_users(username,pass_hash,active,created_at) VALUES(?,?,1,?)',u,await makeHash(pw),now());}catch(e){const s=String(e.message);if(s.includes('ADMIN_LIMIT'))throw new HttpError(409,'Batas 5 admin aktif tercapai');if(s.includes('UNIQUE'))throw new HttpError(409,'Username sudah dipakai');throw e;}
      await audit(env,adm.id,'admin.create',u);return J({ok:true},201);}
    if(m==='PUT'){const b=await readJson(request),n=Number(id),on=B(b.active);
      if(!on&&n===adm.id)throw new HttpError(400,'Tidak bisa menonaktifkan akun sendiri');
      try{const r=await run(env,'UPDATE admin_users SET active=? WHERE id=?',on,n);if(!r.meta.changes)throw new HttpError(404,'Tidak ditemukan');}catch(e){if(String(e.message).includes('ADMIN_LIMIT'))throw new HttpError(409,'Batas 5 admin aktif tercapai');throw e;}
      if(!on)await run(env,'DELETE FROM admin_sessions WHERE admin_id=?',n);await audit(env,adm.id,on?'admin.activate':'admin.deactivate',String(n));return J({ok:true});}
  }
  if(m==='GET'&&r0==='audit') return J({rows:await qa(env,'SELECT a.at,u.username,a.action,a.detail FROM audit_logs a LEFT JOIN admin_users u ON u.id=a.admin_id ORDER BY a.id DESC LIMIT 100')});
  throw new HttpError(404,'Tidak ditemukan');
});
