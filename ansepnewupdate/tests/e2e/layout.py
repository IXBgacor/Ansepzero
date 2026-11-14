import json,sys
from playwright.sync_api import sync_playwright
BASE='http://localhost:8788'
PAGES=['/','/edukasi/','/masuk/','/penjaga-hutan/','/leaderboard/','/statistik/','/lapor/','/peta/','/privasi/','/admin/','/uji/']
VPS={'mobile':dict(viewport={'width':360,'height':740},is_mobile=True,has_touch=True,device_scale_factor=2),
     'tablet':dict(viewport={'width':820,'height':1180},is_mobile=True,has_touch=True),
     'desktop':dict(viewport={'width':1280,'height':800})}
res=[]
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,vp in VPS.items():
        ctx=b.new_context(**vp);ctx.route('**/*',lambda r:r.abort() if 'localhost' not in r.request.url and not r.request.url.startswith('data:') else r.continue_())
        for path in PAGES:
            pg=ctx.new_page();errs=[]
            pg.on('pageerror',lambda e:errs.append(str(e)[:120]))
            pg.on('console',lambda m:errs.append(m.text[:120]) if m.type=='error' and 'ERR_FAILED' not in m.text and 'Failed to load resource' not in m.text else None)
            pg.goto(BASE+path,wait_until='load',timeout=15000)
            pg.wait_for_timeout(700)
            over=pg.evaluate("()=>{const w=innerWidth;const bad=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>w+1&&getComputedStyle(e).position!=='fixed'&&!e.closest('svg')&&!e.closest('.rings')&&!e.closest('.tabs')&&!e.closest('.quick')}).slice(0,3).map(e=>e.tagName+'.'+e.className);return {sw:document.documentElement.scrollWidth,w,bad}}")
            ok=over['sw']<=over['w']+1
            res.append((name,path,ok,over['bad'] if not ok else '',errs[:2]))
            pg.screenshot(path=f"/tmp/shots/{name}_{path.strip('/').replace('/','_') or 'home'}.png",full_page=True)
            pg.close()
        ctx.close()
    b.close()
for r in res: print(('OK  ' if r[2] and not r[4] else 'CEK '),r[0],r[1],r[3],r[4])
