// Modul bersama AnsepZero: akses API dengan pesan galat yang jelas + penyimpanan kode pemain.
export const LK='az.code';
export const getCode=()=>{try{return localStorage.getItem(LK)}catch(e){return null}};
export const setCode=c=>{try{localStorage.setItem(LK,c);return localStorage.getItem(LK)===c}catch(e){return false}};
export const clearCode=()=>{try{localStorage.removeItem(LK)}catch(e){}};
const E=(status,msg)=>Object.assign(new Error(msg),{status});
function hint(s,json){
  if(s===404&&!json) return 'Server API tidak ditemukan (404). Situs ini belum dipasang dengan Cloudflare Pages Functions, jadi skor belum bisa disimpan. Lihat DEPLOYMENT.md.';
  if(s===503) return 'Server belum siap: database D1 belum terhubung (binding DB).';
  if(s===429) return 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.';
  if(s>=500) return 'Server bermasalah ('+s+'). Pemilik situs dapat membuka /api/health untuk diagnosis.';
  return 'Permintaan gagal ('+s+').';
}
export async function api(path,method='GET',body){
  const code=getCode();let r;
  try{r=await fetch('/api/'+path,{method,headers:{'content-type':'application/json',...(code?{authorization:'Bearer '+code}:{})},body:body?JSON.stringify(body):undefined});}
  catch(e){throw E(0,'Tidak bisa menghubungi server. Periksa koneksi internet.');}
  const isJson=(r.headers.get('content-type')||'').includes('json');
  let j={};if(isJson)j=await r.json().catch(()=>({}));
  if(!r.ok) throw E(r.status,j.error||hint(r.status,isJson));
  if(!isJson) throw E(r.status,'Respons server bukan JSON. Situs mungkin belum dipasang dengan Functions (lihat DEPLOYMENT.md).');
  return j;
}
export async function health(){
  try{const r=await fetch('/api/health');if(!(r.headers.get('content-type')||'').includes('json'))return {api:false};return await r.json();}catch(e){return null;}
}
export function healthMessage(h){
  if(h===null) return {ok:false,text:'Tidak bisa menghubungi server. Periksa koneksi internet.'};
  if(h.api===false) return {ok:false,text:'Backend belum aktif: API tidak ditemukan. Situs ini berjalan sebagai situs statis tanpa Functions, jadi nama dan skor belum bisa disimpan.'};
  if(!h.db) return {ok:false,text:'Database D1 belum terhubung. Pemilik situs perlu menambah binding "DB" di Cloudflare Pages lalu deploy ulang.'};
  if(h.schema===false) return {ok:false,text:'Database belum lengkap'+(h.missing&&h.missing.length?': belum ada '+h.missing.slice(0,4).join(', ')+(h.missing.length>4?', dan lainnya':''):'')+'. Terapkan semua migrasi di folder migrations (0001 sampai 0011, kecuali 0009 yang khusus versi uji) di D1 Console.'};
  return {ok:true,text:''};
}
export const rememberName=n=>{try{localStorage.setItem('az.name',String(n||''))}catch(e){}};
