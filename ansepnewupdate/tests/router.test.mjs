// Menguji pintu masuk /api/* yang sama dengan yang dipakai Cloudflare Pages, plus pembatas laju pemain baru.
import {makeDB} from './d1shim.mjs';
import fs from 'node:fs';
import {onRequest as api} from '../functions/api/[[route]].js';
const MIGS=fs.readdirSync('migrations').filter(f=>/^\d{4}_.*\.sql$/.test(f)).sort().map(f=>`migrations/${f}`);
const env={DB:makeDB(MIGS),ADMIN_SETUP_TOKEN:'token-uji-router'};let fail=0;const ok=(c,m)=>{console.log((c?'LULUS ':'GAGAL ')+m);if(!c)fail++;};
const call=async(route,{method='GET',body,headers={}}={})=>{const res=await api({request:new Request('http://x/api/'+route.join('/'),{method,headers:{'content-type':'application/json',...headers},body:body?JSON.stringify(body):undefined}),env,params:{route}});
  return {s:res.status,j:await res.json().catch(()=>null)}};
let r=await call(['health']);ok(r.s===200&&r.j.schema===true&&r.j.version==='1.2.0','health lewat pintu masuk: skema lengkap, versi 1.1.0');
r=await call(['constructor']);ok(r.s===404,'/api/constructor tidak memanggil Object (404)');
r=await call(['__proto__']);ok(r.s===404,'/api/__proto__ ditolak (404)');
r=await call(['zzz','abc']);ok(r.s===404&&r.j.error,'rute tidak dikenal: 404 JSON');
r=await call(['stats']);ok(r.s===200&&typeof r.j.players==='number','rute publik /api/stats lewat pintu masuk');
r=await call(['leaderboard'],{method:'POST'});ok(r.s===405,'leaderboard hanya GET (405)');
r=await call(['analytics'],{method:'DELETE'});ok(r.s===405,'analytics hanya GET (405)');
r=await call(['leaderboard']);ok(r.s===200&&Array.isArray(r.j.rows),'leaderboard GET lewat pintu masuk');
r=await call(['quiz','progress']);ok(r.s===401,'quiz tanpa kode pemain: 401');
r=await call(['admin','me']);ok(r.s===401&&r.j.error,'admin tanpa sesi: 401 JSON');
r=await call(['admin','summary']);ok(r.s===401,'ringkasan admin tanpa sesi: 401');
// nol segmen sisa: POST /api/player
r=await call(['player'],{method:'POST',body:{display_name:"Ani O'Neil, S."}});ok(r.s===201&&r.j.display_name==="Ani O'Neil, S.",'nama dengan apostrof, koma, titik diterima; /api/player (tanpa sisa segmen) berfungsi');
const tok=r.j.recovery_code;
r=await call(['player','me'],{headers:{authorization:'Bearer '+tok}});ok(r.s===200,'/api/player/me lewat pintu masuk');
for(const bad of ['<b>x</b>','a','x'.repeat(25),'081234567890']){r=await call(['player'],{method:'POST',body:{display_name:bad}});if(r.s!==400)ok(false,'nama buruk lolos: '+bad)}
ok(true,'nama buruk (HTML, terlalu pendek/panjang, nomor telepon) ditolak');
// salah ketik tidak menghabiskan kuota
for(let i=0;i<80;i++)await call(['player'],{method:'POST',body:{display_name:'<'}});
r=await call(['player'],{method:'POST',body:{display_name:'Setelah Salah Ketik'}});ok(r.s===201,'80 salah ketik tidak mengunci pembuatan pemain');
// jaringan sekolah: banyak siswa dari satu IP
let made=1,blocked=0;for(let i=0;i<70;i++){r=await call(['player'],{method:'POST',body:{display_name:'Siswa '+i}});r.s===201?made++:blocked+=r.s===429?1:0}
ok(made>=55&&made<=62&&blocked>=5,`satu kelas (~50 siswa) dari satu jaringan masih bisa membuat pemain; pembatas aktif di sekitar 60/jam (dibuat ${made}, ditahan ${blocked})`);
console.log(fail?`\n${fail} UJI GAGAL`:'\nSemua uji lulus');process.exit(fail?1:0);
