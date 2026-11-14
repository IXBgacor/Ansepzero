from playwright.sync_api import sync_playwright
import re,json
OK=lambda c,m:print(('LULUS ' if c else 'GAGAL ')+m)
with sync_playwright() as p:
    b=p.chromium.launch()
    c=b.new_context(viewport={'width':390,'height':780},is_mobile=True,has_touch=True)
    c.route('**/*',lambda r:r.abort() if 'localhost' not in r.request.url and not r.request.url.startswith('data:') else r.continue_())
    pg=c.new_page();msgs=[];pg.on('console',lambda m:msgs.append(m.text) if m.type=='error' and 'Failed to load resource' not in m.text else None);pg.on('pageerror',lambda e:msgs.append(str(e)))
    # header CSP benar-benar terkirim dan tidak merusak halaman
    r=pg.goto('http://localhost:8788/kuis/');OK('script-src' in (r.headers.get('content-security-policy') or '') and r.headers.get('x-content-type-options')=='nosniff','header keamanan terkirim di /kuis/')
    r=pg.goto('http://localhost:8788/game/');OK(r.headers.get('content-security-policy') is None and r.headers.get('x-content-type-options')=='nosniff','/game/ hanya header dasar (tanpa CSP)')
    # 404 dan pengalihan folder
    r=pg.goto('http://localhost:8788/tidak-ada');OK(r.status==404 and 'Halaman tidak ditemukan' in pg.inner_text('h1'),'alamat tidak dikenal: 404 dengan halaman bermerek')
    pg.goto('http://localhost:8788/leaderboard');OK(pg.url.endswith('/leaderboard/'),'/leaderboard dialihkan ke /leaderboard/')
    # diagnosis pemasangan
    pg.goto('http://localhost:8788/uji/');
    for _ in range(80):
        if 'berjalan' not in pg.inner_text('#sum') and pg.locator('#res .it').count()>=17: break
        pg.wait_for_timeout(250)
    s=pg.inner_text('#sum');rows=pg.locator('#res .it').all_inner_texts();OK('0 gagal' in s,'/uji/ di bawah CSP: '+s)
    for r_ in rows:
        if 'GAGAL' in r_:print('   >',r_.replace('\n',' | ')[:150])
    OK(any('Damkar) Marabahan (6282192825967)' in r_ for r_ in rows),'kontak: Damkar Marabahan 6282192825967 (belum diverifikasi)')
    OK(any('versi 1.2.0' in r_ for r_ in rows),'versi 1.2.0 terbaca')
    # beranda: kontak dan CSP
    pg.goto('http://localhost:8788/');pg.wait_for_selector('#contacts a')
    hrefs=pg.eval_on_selector_all('#contacts a','e=>e.map(x=>x.href)');print('   kontak:',hrefs)
    OK('tel:+6282192825967' in hrefs and 'https://wa.me/6282192825967' in hrefs and 'tel:117' in hrefs,'beranda: Damkar Marabahan (telepon+WA) dan 117 (kode pendek)')
    OK(not pg.locator('.testbar').count(),'tanpa spanduk versi uji')
    OK('Dinas Kesehatan Marabahan' in pg.inner_text('#ispa-note'),'catatan ISPA: Dinas Kesehatan Marabahan')
    pg.wait_for_timeout(800);OK(not [m for m in msgs if 'Content Security' in m or 'Refused' in m],'tidak ada pelanggaran CSP di konsol'+(' '+str([m for m in msgs][:2]) if msgs else ''))
    c.close();b.close()
