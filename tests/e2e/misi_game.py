from playwright.sync_api import sync_playwright
import json,re
OK=lambda c,m:print(('LULUS ' if c else 'GAGAL ')+m)
with sync_playwright() as p:
    b=p.chromium.launch();c=b.new_context(viewport={'width':390,'height':780},is_mobile=True,has_touch=True)
    c.route('**/*',lambda r:r.abort() if 'localhost' not in r.request.url and not r.request.url.startswith('data:') else r.continue_())
    pg=c.new_page();pg.goto('http://localhost:8788/masuk/')
    code=pg.evaluate("fetch('/api/player',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({display_name:'Pemadam Uji'})}).then(r=>r.json()).then(j=>{localStorage.setItem('az.code',j.recovery_code);return j.recovery_code})")
    pg.goto('http://localhost:8788/game/');pg.wait_for_selector('#az-pill',timeout=15000)
    r=pg.evaluate("""()=>{const M=window.MPH,d=M.Missions.defs[0];let guard=0;
      while(!M.Missions.complete(d.id)&&guard++<50){for(const s of d.steps){const x=M.Missions.mark(d.id,s.id);}}
      return {id:d.id,done:M.Missions.complete(d.id),steps:d.steps.length}}""")
    OK(r['done'],f"misi {r['id']} diselesaikan di game ({r['steps']} langkah)")
    pg.wait_for_timeout(2500)
    prog=pg.evaluate("""(c)=>fetch('/api/game/progress',{headers:{authorization:'Bearer '+c}}).then(r=>r.json())""",code)
    OK(any(x['mission_id']==r['id'] for x in prog['done']),'bridge melapor ke server: '+json.dumps(prog['done'])[:90])
    OK(prog['done'] and prog['done'][0]['flagged']==1,'selesai instan ditandai untuk tinjauan (anti-curang)')
    lb=pg.evaluate("fetch('/api/leaderboard').then(r=>r.json())");OK(lb['rows']==[],'poin yang ditahan belum masuk papan skor')
    pg.screenshot(path='/tmp/shots/game_mobile2.png')
    b.close()
