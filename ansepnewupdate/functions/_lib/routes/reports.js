import {J,q1,run,now,rnd,ip,limited,readJson,guard,HttpError} from '../util.js';
const MAX_BODY=2_500_000,MAX_PHOTO=1_500_000;
const S=(v,min,max,l)=>{v=String(v??'').trim();if(v.length<min||v.length>max)throw new HttpError(400,`${l} harus ${min}-${max} karakter`);return v;};
const NOTE='Laporan tercatat di sistem AnsepZero dan belum otomatis diteruskan ke petugas. Untuk keadaan darurat, hubungi pemadam lewat Pusat Bantuan.';
function sniff(u8){ // jenis gambar dari byte awal, bukan dari nama/tipe kiriman pengguna
  if(u8[0]===0xFF&&u8[1]===0xD8&&u8[2]===0xFF) return 'image/jpeg';
  if(u8[0]===0x89&&u8[1]===0x50&&u8[2]===0x4E&&u8[3]===0x47) return 'image/png';
  if(u8[0]===0x52&&u8[1]===0x49&&u8[2]===0x46&&u8[3]===0x46&&u8[8]===0x57&&u8[9]===0x45&&u8[10]===0x42&&u8[11]===0x50) return 'image/webp';
  return null;
}
export const handle=guard(async ctx=>{
  const {request,env}=ctx,seg=[].concat(ctx.params.route||[]);
  if(request.method==='GET'&&seg.length===1){ // cek status: hanya status dan tanggal, tanpa lokasi
    if(!/^LP-[0-9A-F]{10}$/.test(seg[0])) throw new HttpError(404,'Kode laporan tidak valid');
    const r=await q1(env,'SELECT status,created_at FROM citizen_reports WHERE id=?',seg[0]);
    if(!r) throw new HttpError(404,'Laporan tidak ditemukan');return J(r);
  }
  if(request.method==='POST'&&seg.length===0){
    if(Number(request.headers.get('content-length')||0)>MAX_BODY) throw new HttpError(413,'Permintaan terlalu besar');
    if(await limited(env,'report:'+ip(request),5,3600)) throw new HttpError(429,'Terlalu banyak laporan dari perangkat ini. Jika darurat, hubungi pemadam.');
    let f,photo=null;
    if((request.headers.get('content-type')||'').includes('multipart/form-data')){const fd=await request.formData();f=Object.fromEntries([...fd.entries()].filter(([,v])=>typeof v==='string'));photo=fd.get('photo');}
    else f=await readJson(request);
    if(f.website) return J({id:'LP-0000000000',status:'menunggu',note:NOTE},201); // honeypot bot
    const description=S(f.description,10,1000,'Deskripsi');
    let lat=null,lng=null;
    if(f.lat!==''&&f.lat!=null||f.lng!==''&&f.lng!=null){lat=Number(f.lat);lng=Number(f.lng);if(!(lat>=-90&&lat<=90&&lng>=-180&&lng<=180))throw new HttpError(400,'Koordinat tidak valid');lat=Math.round(lat*1e5)/1e5;lng=Math.round(lng*1e5)/1e5;}
    const loc=f.location_text?S(f.location_text,3,200,'Keterangan lokasi'):null;
    if(lat==null&&!loc) throw new HttpError(400,'Isi lokasi: gunakan GPS atau tulis nama desa/patokan');
    let photo_key=null,photo_status='tidak ada';
    if(photo&&typeof photo==='object'&&photo.size>0){
      if(!env.PHOTOS) photo_status='penyimpanan foto belum diaktifkan';
      else{if(photo.size>MAX_PHOTO)throw new HttpError(413,'Foto maksimal 1,5 MB');const buf=new Uint8Array(await photo.arrayBuffer()),ct=sniff(buf);
        if(!ct)throw new HttpError(400,'Foto harus JPEG, PNG, atau WebP');photo_key=rnd(16);await env.PHOTOS.put(photo_key,buf,{httpMetadata:{contentType:ct}});photo_status='tersimpan';}
    }
    const id='LP-'+rnd(5).toUpperCase();
    await run(env,'INSERT INTO citizen_reports(id,description,lat,lng,location_text,photo_key,status,created_at) VALUES(?,?,?,?,?,?,?,?)',id,description,lat,lng,loc,photo_key,'menunggu',now());
    return J({id,status:'menunggu',photo:photo_status,note:NOTE},201);
  }
  throw new HttpError(404,'Tidak ditemukan');
});
