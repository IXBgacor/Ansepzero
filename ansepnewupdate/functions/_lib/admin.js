import {q1,run,now,rnd,sha,HttpError} from './util.js';
const ITER=100000, enc=new TextEncoder();
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function derive(pw,saltHex,iter){
  const k=await crypto.subtle.importKey('raw',enc.encode(pw),'PBKDF2',false,['deriveBits']);
  return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:enc.encode(saltHex),iterations:iter},k,256));
}
const same=(a,b)=>{if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;};
export async function makeHash(pw){const s=rnd(16);return `pbkdf2$${ITER}$${s}$${await derive(pw,s,ITER)}`;}
export async function verifyHash(pw,stored){const p=String(stored||'').split('$');if(p.length!==4||p[0]!=='pbkdf2')return false;return same(await derive(pw,p[2],Number(p[1])),p[3]);}
let dummy;export async function dummyVerify(pw){dummy??=await makeHash('dummy-password-x');await verifyHash(pw,dummy);}
export const sameStr=same;
const cookie=r=>/(?:^|;\s*)az_admin=([0-9a-f]{64})/.exec(r.headers.get('cookie')||'')?.[1];
export async function requireAdmin(request,env,write){
  const t=cookie(request); if(!t) throw new HttpError(401,'Belum masuk');
  const a=await q1(env,'SELECT u.id,u.username FROM admin_sessions s JOIN admin_users u ON u.id=s.admin_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1',await sha(t),now());
  if(!a) throw new HttpError(401,'Sesi berakhir');
  if(write&&request.headers.get('x-az-csrf')!=='1') throw new HttpError(403,'Header keamanan tidak ada');
  return a;
}
export const audit=(env,id,action,detail)=>run(env,'INSERT INTO audit_logs(admin_id,action,detail,at) VALUES(?,?,?,?)',id,action,String(detail??'').slice(0,500),now());
export const csv=rows=>rows.map(r=>r.map(c=>{c=c==null?'':String(c);if(/^[=+\-@\t\r]/.test(c))c="'"+c;return /[",\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c;}).join(',')).join('\n');
