from playwright.sync_api import sync_playwright
import re
OK=lambda c,m:print(('LULUS ' if c else 'GAGAL ')+m)
def mk(b,**kw):
    c=b.new_context(viewport={'width':390,'height':780},is_mobile=True,has_touch=True,**kw)
    c.route('**/*',lambda r:r.abort() if 'localhost' not in r.request.url and not r.request.url.startswith('data:') else r.continue_());return c
with sync_playwright() as p:
    b=p.chromium.launch()
    # ---- A: server lengkap
    c=mk(b);pg=c.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:150]))
    pg.goto('http://localhost:8788/game/',timeout=20000)
    pg.wait_for_url(re.compile('/masuk/'),timeout=8000);OK('/masuk/?next=game' in pg.url,'game tanpa identitas dialihkan ke halaman masuk: '+pg.url)
    OK(pg.locator('#hb').is_hidden(),'tidak ada peringatan backend saat server siap')
    pg.click('#nm');pg.keyboard.type('Penjaga Uji',delay=40)
    OK(pg.input_value('#nm')=='Penjaga Uji','mengetik nama berhasil (keyboard)')
    pg.tap('#go');pg.wait_for_url(re.compile('/game/'),timeout=10000);OK(True,'setelah masuk kembali ke /game/')
    pg.wait_for_selector('#az-pill',timeout=15000);t=pg.inner_text('#az-pill');OK('Pemain: Penjaga Uji' in t,'bridge aktif: '+t)
    pg.wait_for_timeout(1500);pg.screenshot(path='/tmp/shots/game_mobile.png');OK(pg.locator('#namesec').is_hidden(),'game tidak meminta nama lagi (dipakai nama dari masuk)');OK('Penjaga Uji' in (pg.evaluate("localStorage.getItem('mph.v05')") or ''),'nama tersimpan di data game')
    OK(not [e for e in errs if 'az-' in e or 'bridge' in e],'tanpa galat dari bridge')
    if errs:print('   catatan galat halaman:',errs[:2])
    # muat ulang: tetap di game
    pg.reload();pg.wait_for_selector('#az-pill',timeout=15000);OK('/game/' in pg.url,'muat ulang tetap di game dengan identitas tersimpan')
    # kuis end-to-end memakai identitas yang sama
    q=c.new_page();q.goto('http://localhost:8788/kuis/');q.wait_for_selector('#menu .opt',timeout=8000)
    labels=q.locator('#menu .opt').all_inner_texts();OK(len(labels)==7,'menu kuis: evaluasi awal, 5 level, evaluasi akhir')
    OK(all('belum tersedia' not in l for l in labels),'semua level kini punya soal')
    q.locator('#menu .opt').nth(2).click()  # Level 2
    q.wait_for_selector('#opts .opt',timeout=8000);n=int(re.search(r'dari (\d+)',q.inner_text('#qn')).group(1));OK(n==20,'level 2 berisi 20 soal')
    for i in range(n):
        q.locator('#opts .opt').first.click();q.wait_for_selector('#fb:not([hidden])');q.click('#next')
    q.wait_for_selector('#s-res:not([hidden])',timeout=8000);OK('Benar' in q.inner_text('#rb'),'hasil kuis tampil: '+q.inner_text('#rb')[:70])
    q.screenshot(path='/tmp/shots/kuis_result_mobile.png')
    # kode tersimpan dipakai halaman masuk -> langsung lanjut
    c.close()
    # ---- B: kode basi
    c=mk(b);pg=c.new_page();pg.goto('http://localhost:8788/masuk/')
    pg.evaluate("localStorage.setItem('az.code','AZ-DEADBEEF.'+'0'.repeat(48))");pg.goto('http://localhost:8788/game/',timeout=20000)
    pg.wait_for_url(re.compile('/masuk/'),timeout=10000);OK(True,'kode tidak valid: dialihkan ke masuk')
    OK(pg.evaluate("localStorage.getItem('az.code')")is None,'kode basi dihapus');c.close()
    # ---- C: tanpa API (situs statis)
    c=mk(b);pg=c.new_page();pg.goto('http://localhost:8789/game/',timeout=20000);pg.wait_for_url(re.compile('/masuk/'),timeout=8000)
    pg.wait_for_selector('#hb:not([hidden])',timeout=8000);OK('Backend belum aktif' in pg.inner_text('#hb'),'diagnosis tampil: '+pg.inner_text('#hb')[:60])
    pg.click('#nm');pg.keyboard.type('Uji Tanpa API');pg.tap('#go');pg.wait_for_selector('#err:not(:empty)',timeout=8000)
    e=pg.inner_text('#err');OK('Server API tidak ditemukan' in e or 'bukan JSON' in e,'pesan galat jelas (bukan "Gagal"): '+e[:80])
    pg.screenshot(path='/tmp/shots/masuk_noapi_mobile.png')
    OK(pg.locator('#guest').is_visible(),'tombol mode tamu tersedia')
    pg.tap('#gb');pg.wait_for_url(re.compile('localhost:8789/game/'),timeout=8000)
    pg.wait_for_selector('#az-pill',timeout=15000);OK('Mode tamu' in pg.inner_text('#az-pill'),'game dapat dimainkan sebagai tamu: '+pg.inner_text('#az-pill')[:40])
    c.close();b.close()
