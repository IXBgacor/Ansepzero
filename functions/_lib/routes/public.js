
// API publik AnsepZero (Cloudflare Pages Functions). Binding D1: DB
const J=(o,s=200,c='no-store')=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':c,'x-content-type-options':'nosniff'}});
const q1=(env,sql,...a)=>env.DB.prepare(sql).bind(...a).first();
const qa=async(env,sql,...a)=>(await env.DB.prepare(sql).bind(...a).all()).results;
const pct=(n,d)=>d>0?Math.round(n*1000/d)/10:null;

async function limited(env,key,max,win){
  const now=Math.floor(Date.now()/1000);
  key=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key)))].map(x=>x.toString(16).padStart(2,'0')).join('');
  await env.DB.prepare('INSERT INTO rate_limits(k,n,reset_at) VALUES(?,1,?) ON CONFLICT(k) DO UPDATE SET n=CASE WHEN reset_at<? THEN 1 ELSE n+1 END, reset_at=CASE WHEN reset_at<? THEN ? ELSE reset_at END').bind(key,now+win,now,now,now+win).run();
  return (await q1(env,'SELECT n FROM rate_limits WHERE k=?',key)).n>max;
}

const routes={
  async stats(env){
    const th=Number((await q1(env,"SELECT value v FROM app_settings WHERE key='pass_threshold'"))?.v||80);
    const players=(await q1(env,'SELECT COUNT(*) c FROM players WHERE deleted=0')).c;
    const taken=(await q1(env,'SELECT COUNT(DISTINCT player_id) c FROM learning_assessments')).c;
    const met=(await q1(env,'SELECT COUNT(*) c FROM (SELECT player_id FROM learning_assessments GROUP BY player_id HAVING MAX(score_pct)>=?)',th)).c;
    const both=(await q1(env,"SELECT COUNT(*) c FROM (SELECT player_id FROM learning_assessments GROUP BY player_id HAVING SUM(kind='pre')>0 AND SUM(kind='post')>0)")).c;
    const up=(await q1(env,"SELECT COUNT(*) c FROM (SELECT player_id FROM learning_assessments GROUP BY player_id HAVING SUM(kind='pre')>0 AND SUM(kind='post')>0 AND (SELECT score_pct FROM learning_assessments x WHERE x.player_id=learning_assessments.player_id AND kind='post' ORDER BY created_at DESC LIMIT 1)>(SELECT score_pct FROM learning_assessments x WHERE x.player_id=learning_assessments.player_id AND kind='pre' ORDER BY created_at LIMIT 1))")).c;
    const visits=(await q1(env,'SELECT COALESCE(SUM(hits),0) c FROM page_visits')).c;
    const missions=(await q1(env,'SELECT COUNT(*) c FROM game_missions m JOIN game_mission_defs d USING(mission_id) WHERE d.educational=1')).c;

    const displayRow=await q1(env,"SELECT value v FROM app_settings WHERE key='stats_display'");
    let display={};
    try{if(displayRow?.v)display=JSON.parse(displayRow.v)}catch(e){}

    const demo=display.demo||{};
    const demoEnabled=demo.enabled===true;
    return {
      threshold_pct:th,
      visits:demoEnabled?demo.visits:visits,
      players:demoEnabled?demo.players:players,
      assessed:demoEnabled?demo.assessed:taken,
      met_criteria:demoEnabled?demo.met_criteria:met,
      met_pct:demoEnabled?demo.met_pct:pct(met,taken),
      met_pct_denominator:'peserta evaluasi',
      comparable:demoEnabled?demo.comparable:both,
      improved:demoEnabled?demo.improved:up,
      improved_pct:demoEnabled?demo.improved_pct:pct(up,both),
      improved_pct_denominator:'peserta dengan evaluasi awal dan akhir',
      educational_missions_done:demoEnabled?demo.educational_missions_done:missions,
      note:demoEnabled?'Data simulasi untuk demonstrasi, bukan hasil penelitian atau data aktual.':(display.note??'Indikator pemahaman peserta platform, bukan survei representatif penduduk Barito Kuala.'),
      display:display.cards||{}
    };
  },

  async ispa(env){
    const rows=await qa(env,'SELECT period,label,cases,is_partial,note FROM ispa_data ORDER BY period');
    const src=(await q1(env,"SELECT value v FROM app_settings WHERE key='ispa_source'"))?.v||null;
    return {rows,source:src,disclaimer:'Jumlah kasus ISPA bulanan, bukan bukti penyebab tiap kasus (tidak hanya karhutla/asap). Bukan data real-time.'};
  },

  async contacts(env){
    return {rows:await qa(env,'SELECT id,name,phone_intl,note,verified FROM contacts WHERE active=1 ORDER BY sort,id')};
  },

  async announcements(env){
    return {rows:await qa(env,'SELECT id,title,body,created_at FROM announcements WHERE published=1 ORDER BY created_at DESC LIMIT 5')};
  },

  async content(env){
    const rows=await qa(env,'SELECT slug,title,body_md,sources_json FROM education_content WHERE published=1 ORDER BY sort');
    return {rows:rows.map(r=>({slug:r.slug,title:r.title,body_md:r.body_md,sources:JSON.parse(r.sources_json)}))};
  }
};

const NEED=[
  'players','quiz_questions','quiz_attempts','quiz_answers',
  'learning_assessments','game_sessions','game_mission_defs',
  'game_missions','leaderboard_scores','education_content',
  'contacts','announcements','ispa_data','citizen_reports',
  'admin_users','admin_sessions','audit_logs','app_settings',
  'rate_limits','page_visits','admin_limit_ins','admin_limit_upd'
];

const aiProvider=env=>
  (typeof env.GEMINI_API_KEY==='string'&&env.GEMINI_API_KEY.trim().length>=20)
    ?'gemini'
    :env.AI_API_KEY&&env.AI_BASE_URL&&env.AI_MODEL
      ?'external'
      :(env.AI&&typeof env.AI.run==='function'?'workers-ai':null);

async function health(env){
  const o={
    api:true,
    version:'1.2.0',
    db:!!env.DB,
    schema:null,
    missing:[],
    admin_setup_token:!!env.ADMIN_SETUP_TOKEN,
    photos:!!env.PHOTOS,
    ai:aiProvider(env)
  };

  if(!env.DB)return o;

  try{
    const names=new Set((await qa(env,"SELECT name FROM sqlite_master WHERE type IN ('table','trigger')")).map(r=>r.name));
    o.missing=NEED.filter(n=>!names.has(n));

    if(names.has('game_mission_defs')){
      const cols=(await qa(env,'PRAGMA table_info(game_mission_defs)')).map(r=>r.name);
      if(!cols.includes('ord'))o.missing.push('game_mission_defs.ord (migrasi 0005)');
    }

    o.schema=o.missing.length===0;

    if(o.schema){
      o.questions=(await q1(env,'SELECT COUNT(*) c FROM quiz_questions WHERE active=1')).c;
      o.content_published=(await q1(env,'SELECT COUNT(*) c FROM education_content WHERE published=1')).c;
      o.missions=(await q1(env,'SELECT COUNT(*) c FROM game_mission_defs')).c;
    }
  }catch(e){
    o.schema=false;
    o.error='Database tidak dapat dibaca';
  }

  return o;
}

export async function handle({request,env,params}){
  const path=[].concat(params.route||[]).join('/');

  try{
    if(request.method==='GET'&&path==='health')
      return J(await health(env));

    if(!env.DB)
      return J({error:'Database D1 belum dihubungkan (binding DB).'},503);

    if(request.method==='POST'&&path==='visit'){
      const ip=request.headers.get('cf-connecting-ip')||'x';

      if(await limited(env,'visit:'+ip,30,3600))
        return J({ok:true});

      await env.DB.prepare('INSERT INTO page_visits(day,hits) VALUES(?,1) ON CONFLICT(day) DO UPDATE SET hits=hits+1')
        .bind(new Date().toISOString().slice(0,10)).run();

      return J({ok:true});
    }

    if(request.method==='GET'&&Object.hasOwn(routes,path))
      return J(
        await routes[path](env),
        200,
        path==='stats'?'public, max-age=30':'public, max-age=120'
      );

    return J({error:'Tidak ditemukan'},404);

  }catch(e){
    return J({error:'Kesalahan server'},500);
  }
}
