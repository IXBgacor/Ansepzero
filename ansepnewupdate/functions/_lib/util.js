export const J=(o,s=200,h={})=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...h}});
export const q1=(env,sql,...a)=>env.DB.prepare(sql).bind(...a).first();
export const qa=async(env,sql,...a)=>(await env.DB.prepare(sql).bind(...a).all()).results;
export const run=(env,sql,...a)=>env.DB.prepare(sql).bind(...a).run();
export const now=()=>Math.floor(Date.now()/1000);
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
export const rnd=n=>hex(crypto.getRandomValues(new Uint8Array(n)));
export const sha=async s=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
export const ip=r=>r.headers.get('cf-connecting-ip')||'x';
export async function limited(env,key,max,win){
  const t=now();key=await sha(key); // IP tidak disimpan mentah
  if(Math.random()<0.02) await run(env,'DELETE FROM rate_limits WHERE reset_at<?',t-3600);
  await run(env,'INSERT INTO rate_limits(k,n,reset_at) VALUES(?,1,?) ON CONFLICT(k) DO UPDATE SET n=CASE WHEN reset_at<? THEN 1 ELSE n+1 END, reset_at=CASE WHEN reset_at<? THEN ? ELSE reset_at END',key,t+win,t,t,t+win);
  return (await q1(env,'SELECT n FROM rate_limits WHERE k=?',key)).n>max;
}
export async function readJson(request,max=4096){
  const t=await request.text(); if(t.length>max) throw new HttpError(413,'Permintaan terlalu besar');
  try{const o=JSON.parse(t||'{}'); if(o===null||typeof o!=='object') throw 0; return o;}catch(e){throw new HttpError(400,'JSON tidak valid');}
}
export class HttpError extends Error{constructor(s,m){super(m);this.status=s;}}
// Auth pemain: Authorization: Bearer <id>.<secret48hex>; hanya hash secret yang disimpan.
export async function authPlayer(request,env){
  const m=/^Bearer (AZ-[0-9A-F]{8})\.([0-9a-f]{48})$/.exec(request.headers.get('authorization')||'');
  if(!m) return null;
  const p=await q1(env,'SELECT id,display_name,secret_hash FROM players WHERE id=?',m[1]);
  if(!p) return null;
  const h=await sha(m[2]); let d=0; for(let i=0;i<h.length;i++) d|=h.charCodeAt(i)^p.secret_hash.charCodeAt(i);
  return d===0?p:null;
}
export function cleanName(s){
  s=String(s??'').normalize('NFKC').replace(/\s+/g,' ').trim();
  if(!/^[\p{L}\p{N} _.,'’-]{2,20}$/u.test(s)) throw new HttpError(400,'Nama tampilan 2-20 karakter (huruf, angka, spasi, titik, koma, apostrof, strip)');
  if((s.match(/\d/g)||[]).length>=7) throw new HttpError(400,'Jangan memakai nomor telepon atau data pribadi sebagai nama');
  return s;
}
export async function threshold(env){return Number((await q1(env,"SELECT value v FROM app_settings WHERE key='pass_threshold'"))?.v||80);}
// Skor total (server): kuis (maks 200/level, 1000 total) + petualangan dinormalisasi 0-1000 dari poin misi tervalidasi. Maks total 2000.
export async function recomputeScore(env,pid){
  const th=await threshold(env);
  const quiz=(await q1(env,"SELECT COALESCE(SUM(m),0) c FROM (SELECT MAX(points) m FROM quiz_attempts WHERE player_id=? AND kind='level' AND submitted_at IS NOT NULL AND flagged=0 GROUP BY level)",pid)).c;
  const lv=(await q1(env,"SELECT COUNT(*) c FROM (SELECT level FROM quiz_attempts WHERE player_id=? AND kind='level' AND submitted_at IS NOT NULL AND flagged=0 GROUP BY level HAVING MAX(correct*100.0/total)>=?)",pid,th)).c;
  const adv=await q1(env,'SELECT COALESCE(SUM(points),0) p,COUNT(*) n FROM game_missions WHERE player_id=? AND flagged=0',pid);
  const mx=(await q1(env,'SELECT COALESCE(SUM(max_points),0) m FROM game_mission_defs WHERE active=1')).m;
  const advScaled=mx>0?Math.round(1000*adv.p/mx):0; // skor petualangan dinormalisasi ke skala 0-1000
  await run(env,'INSERT INTO leaderboard_scores(player_id,quiz_points,adventure_points,total_points,missions_done,levels_done,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(player_id) DO UPDATE SET quiz_points=excluded.quiz_points,adventure_points=excluded.adventure_points,total_points=excluded.total_points,missions_done=excluded.missions_done,levels_done=excluded.levels_done,updated_at=excluded.updated_at',pid,quiz,advScaled,quiz+advScaled,adv.n,lv,now());
}
export const guard=fn=>async ctx=>{try{if(!ctx.env.DB) return J({error:'Database D1 belum dihubungkan (binding DB).'},503);return await fn(ctx);}catch(e){return e instanceof HttpError?J({error:e.message},e.status):J({error:'Kesalahan server'},500);}};
