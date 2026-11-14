# Uji browser v1.2.0: (1) kuis tidak macet saat jawaban gagal terkirim, (2) riwayat Penjaga Hutan AI bertahan saat dimuat ulang.
# Butuh: node --no-warnings tests/devserver.mjs 8790 --mockai
import json
from playwright.sync_api import sync_playwright
B='http://localhost:8790';res=[]
def ok(c,m):res.append(c);print(('LULUS ' if c else 'GAGAL ')+m)
with sync_playwright() as p:
    b=p.chromium.launch();c=b.new_context(viewport={'width':360,'height':740},is_mobile=True,has_touch=True);pg=c.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:150]))
    pg.goto(B+'/masuk/')
    code=pg.evaluate("fetch('/api/player',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({display_name:'Penguji'})}).then(r=>r.json()).then(j=>{localStorage.setItem('az.code',j.recovery_code);return j.recovery_code})")
    ok(bool(code),'pemain uji dibuat')
    pg.goto(B+'/kuis/');pg.wait_for_selector('#menu .opt',timeout=8000)
    pg.click('#menu .opt:has-text("Level 1")');pg.wait_for_selector('#opts .opt',timeout=8000)
    fail={'n':1}
    def h(route):
        if fail['n']>0: fail['n']-=1;route.abort()
        else: route.continue_()
    pg.route('**/api/quiz/answer',h)
    pg.click('#opts .opt >> nth=0');pg.wait_for_selector('#fb:not([hidden])',timeout=5000)
    ok('Tidak bisa menghubungi server' in pg.inner_text('#fb'),'galat jaringan ditampilkan jelas')
    ok(all(not x.is_disabled() for x in pg.query_selector_all('#opts .opt')),'pilihan jawaban aktif lagi setelah gagal (tidak macet)')
    pg.click('#opts .opt >> nth=0');pg.wait_for_selector('#next:not([hidden])',timeout=5000)
    ok(pg.inner_text('#qn').startswith('Soal 1 dari'),'percobaan ulang berhasil dan tombol Lanjut muncul')
    # selesaikan semua soal
    n=int(pg.inner_text('#qn').split(' dari ')[1])
    for i in range(n):
        if i>0:
            pg.wait_for_selector('#opts .opt');pg.click('#opts .opt >> nth=0');pg.wait_for_selector('#next:not([hidden])')
        pg.click('#next')
    pg.wait_for_selector('#s-res:not([hidden])',timeout=8000)
    ok('Benar' in pg.inner_text('#rb'),'kuis selesai dan hasil tampil: '+pg.inner_text('#rb')[:50])
    # chat
    pg.goto(B+'/penjaga-hutan/');pg.wait_for_selector('#q')
    pg.fill('#q','Apa itu gambut?');pg.click('#send')
    pg.locator('.msg.bot').nth(1).wait_for(timeout=8000);pg.wait_for_selector('.dots',state='detached',timeout=8000)
    pg.reload();pg.wait_for_selector('#q')
    t=pg.inner_text('#log')
    ok('Apa itu gambut?' in t and 'jawaban uji' in t,'riwayat percakapan bertahan setelah muat ulang')
    pg.click('#new');t=pg.inner_text('#log')
    ok('Apa itu gambut?' not in t,'Percakapan baru menghapus riwayat')
    pg.reload();pg.wait_for_selector('#q');ok('Apa itu gambut?' not in pg.inner_text('#log'),'setelah dihapus, muat ulang tidak memulihkan riwayat')
    ok(not errs,'tanpa galat JavaScript '+str(errs))
    b.close()
print('RINGKAS',sum(res),'/',len(res))
