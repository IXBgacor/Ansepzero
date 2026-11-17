// Frontend AnsepZero: semua angka berasal dari API/D1. Teks disisipkan lewat textContent (anti-XSS).
const $=s=>document.querySelector(s);
const nf=n=>Number(n).toLocaleString('id-ID');
const h=(t,a={},...k)=>{const e=document.createElement(t);for(const[x,v]of Object.entries(a))e.setAttribute(x,v);for(const c of k)e.append(c);return e};
async function api(p){const r=await fetch('/api/'+p);if(!r.ok)throw new Error(r.status);return r.json()}
const fail=(el,msg)=>{el.replaceChildren(h('div',{class:'empty'},msg))};
const pctTxt=(v)=>v==null?'Belum ada data':v.toString().replace('.',',')+'%';

async function stats(){
  const el=$('#stats');
  try{
    const s=await api('stats');
    const defaults=[
      ['visits','Kunjungan',nf(s.visits),'jumlah kunjungan tercatat'],
      ['players','Pemain unik',nf(s.players),'berdasarkan ID pemain'],
      ['assessed','Peserta evaluasi',nf(s.assessed),'menyelesaikan evaluasi'],
      ['met','Memenuhi kriteria',pctTxt(s.met_pct),`${nf(s.met_criteria)} dari ${nf(s.assessed)} ${s.met_pct_denominator}, ambang ${s.threshold_pct}%`],
      ['improved','Menunjukkan peningkatan',pctTxt(s.improved_pct),`${nf(s.improved)} dari ${nf(s.comparable)} ${s.improved_pct_denominator}`],
      ['missions','Misi edukasi selesai',nf(s.educational_missions_done),'tercatat di server']
    ];
    const cards=s.display||{};
    const items=defaults.filter(([key])=>cards[key]?.visible!==false).map(([key,label,value,desc])=>[
      cards[key]?.label||label,value,cards[key]?.description??desc
    ]);
    el.replaceChildren(...items.map(([l,n,d])=>h('div',{class:'stat'},h('div',{class:'n'+(n==='Belum ada data'?' na':'')},n),h('div',{class:'l'},l),h('div',{class:'d'},d))));
    $('#stats-note').textContent=s.note||'';
  }catch(e){fail(el,'Statistik belum dapat dimuat. Pastikan database D1 sudah dihubungkan dan migrasi diterapkan.')}
}
async function announcements(){
  const el=$('#ann');
  try{
    const{rows}=await api('announcements');
    if(!rows.length)return fail(el,'Belum ada informasi terbaru.');
    el.replaceChildren(...rows.map(r=>h('div',{class:'panel',style:'margin-bottom:10px'},h('h3',{},r.title),h('p',{},r.body))));
  }catch(e){fail(el,'Informasi belum dapat dimuat.')}
}
function barChart(rows){
  const max=Math.max(...rows.map(r=>r.cases)),box=h('div',{class:'hbars',role:'img','aria-label':'Diagram batang kasus ISPA per bulan, Januari sampai 12 Oktober 2026'});
  for(const r of rows){const t=h('div',{class:'t'},h('i',{class:r.is_partial?'part':'',style:'width:'+Math.max(2,r.cases/max*100)+'%'}));box.append(h('div',{class:'hb'},h('span',{},r.label),t,h('b',{},nf(r.cases))))}
  return box;
}
async function ispa(){
  const el=$('#ispa-chart');
  try{
    const d=await api('ispa');
    if(!d.rows.length)return fail(el,'Data ISPA belum tersedia.');
    el.replaceChildren(barChart(d.rows));
    const part=d.rows.find(r=>r.is_partial);
    $('#ispa-note').textContent=(part?(part.note+' (batang putus-putus). '):'')+d.disclaimer+' Sumber: '+(d.source||'tidak tercatat')+'.';
  }catch(e){fail(el,'Data ISPA belum dapat dimuat.')}
}
async function contacts(){
  const el=$('#contacts');
  try{
    const{rows}=await api('contacts');
    if(!rows.length)return fail(el,'Belum ada kontak layanan.');
    el.replaceChildren(...rows.map(c=>{
      const num=String(c.phone_intl).replace(/\D/g,'');
      const box=h('div',{class:'panel contact'});
      const info=h('div',{},h('b',{},c.name),h('div',{class:'note'},c.verified?'Terverifikasi':(c.note||'Belum diverifikasi')));
      const short=num.length<=4,a1=h('a',{class:'btn pri',href:(short?'tel:':'tel:+')+num},'Telepon '+(short?num:''));
      const acts=[a1];if(!short)acts.push(h('a',{class:'btn',href:'https://wa.me/'+num,target:'_blank',rel:'noopener'},'WhatsApp'));
      box.append(info,h('div',{class:'btns',style:'margin:0'},...acts));return box;
    }));
  }catch(e){fail(el,'Kontak belum dapat dimuat.')}
}
if(!sessionStorage.getItem('az.v')){sessionStorage.setItem('az.v','1');fetch('/api/visit',{method:'POST'}).catch(()=>{})}
stats();announcements();ispa();contacts();
