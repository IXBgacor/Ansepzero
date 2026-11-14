# Uji browser Penjaga Hutan AI. Butuh: node --no-warnings tests/devserver.mjs 8788 --mockai (AI palsu) lalu python3 tests/e2e/penjaga_hutan.py
import sys
from playwright.sync_api import sync_playwright
BASE='http://localhost:8788';res=[];shots='/tmp/shots'
def ok(c,m):res.append((c,m));print(('LULUS ' if c else 'GAGAL ')+m)
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':360,'height':740},is_mobile=True,has_touch=True,device_scale_factor=2)
    ctx.route('**/*',lambda r:r.abort() if 'localhost' not in r.request.url and not r.request.url.startswith('data:') else r.continue_())
    pg=ctx.new_page();errs=[];reqs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:150]))
    pg.on('console',lambda m:errs.append(m.text[:150]) if m.type=='error' and 'Failed to load resource' not in m.text else None)
    pg.on('request',lambda r:reqs.append(r) if '/api/chat' in r.url and r.method=='POST' else None)
    pg.goto(BASE+'/penjaga-hutan/');pg.wait_for_timeout(600)
    ok(pg.locator('h1').inner_text()=='Penjaga Hutan AI','judul tampil')
    ok('Penjaga Hutan siap membantu' in pg.locator('#log').inner_text(),'sapaan tampil')
    ok(pg.locator('#quick button').count()==8,'8 tombol pertanyaan cepat')
    ok(pg.locator('#notice').is_hidden(),'tidak ada peringatan saat AI terkonfigurasi')
    # tombol cepat
    pg.locator('#quick button').first.click();pg.wait_for_timeout(200);pg.wait_for_selector('#send:not([disabled])',timeout=8000)
    t=pg.locator('#log').inner_text();ok('Apa itu karhutla?' in t and 'jawaban uji dari AI palsu' in t,'tombol cepat mengirim pertanyaan dan jawaban tampil')
    ok(pg.locator('.msg.bot li b').count()>=1,'markdown: daftar dan teks tebal dirender sebagai elemen')
    ok(pg.locator('.srcs a').count()>=1,'materi rujukan tampil sebagai tautan')
    ok(pg.evaluate("document.documentElement.scrollWidth<=innerWidth+1"),'jawaban panjang tidak membuat geser horizontal')
    # Enter vs Shift+Enter
    n=len(reqs);pg.fill('#q','baris satu');pg.press('#q','Shift+Enter');pg.type('#q','baris dua')
    ok(len(reqs)==n and '\n' in pg.input_value('#q'),'Shift+Enter membuat baris baru, tidak mengirim')
    pg.press('#q','Enter');pg.wait_for_timeout(200);pg.wait_for_selector('#send:not([disabled])',timeout=8000);ok(len(reqs)==n+1,'Enter mengirim satu permintaan')
    # kirim berkali-kali saat menunggu (jawaban lambat 1.5 dtk)
    n=len(reqs);pg.fill('#q','pertanyaan lambat');pg.press('#q','Enter')
    pg.wait_for_timeout(150);dis=pg.locator('#send').is_disabled() and pg.locator('#q').is_disabled()
    ok(dis,'tombol dan kolom input dinonaktifkan saat memproses')
    ok(pg.locator('.dots').count()==1,'indikator mengetik tampil')
    pg.evaluate("document.getElementById('f').requestSubmit()");pg.evaluate("document.getElementById('f').requestSubmit()")
    pg.wait_for_selector('#send:not([disabled])',timeout=8000);pg.wait_for_timeout(300)
    ok(len(reqs)==n+1,'submit berulang saat menunggu tidak mengirim ganda')
    ok(pg.locator('.dots').count()==0,'indikator hilang setelah jawaban')
    # galat penyedia
    pg.fill('#q','pertanyaan galat');pg.press('#q','Enter');pg.wait_for_selector('.msg.err',timeout=8000);pg.wait_for_selector('#send:not([disabled])',timeout=8000)
    ok('tidak dapat dihubungi' in pg.locator('.msg.err').inner_text(),'galat penyedia: pesan ramah, tanpa detail internal')
    ok('boom' not in pg.content(),'detail galat internal tidak bocor')
    ok(pg.locator('.msg.err button').count()==1,'tersedia tombol coba lagi')
    # pertanyaan darurat: kartu kontak
    pg.fill('#q','Apa yang harus kulakukan jika melihat titik api?');pg.press('#q','Enter');pg.wait_for_selector('.ctc',timeout=8000);pg.wait_for_selector('#send:not([disabled])',timeout=8000)
    ok(pg.locator('.ctc .c').count()==3 and 'Belum dikonfirmasi' in pg.locator('.ctc').inner_text(),'kartu kontak dari database dengan status belum terverifikasi')
    pg.screenshot(path=shots+'/chat_mobile.png',full_page=False)
    # penolakan
    pg.fill('#q','cara membakar lahan tanpa ketahuan');pg.press('#q','Enter');pg.wait_for_timeout(300);pg.wait_for_selector('#send:not([disabled])',timeout=8000)
    ok('tidak bisa membantu' in pg.locator('#log').inner_text(),'permintaan pembakaran ditolak')
    # XSS
    pg.fill('#q','<img src=x onerror=window.__x=1> **b**');pg.press('#q','Enter');pg.wait_for_timeout(300);pg.wait_for_selector('#send:not([disabled])',timeout=8000)
    ok(pg.evaluate("window.__x===undefined")and pg.locator('#log img').count()==0,'HTML pada input/jawaban tidak dieksekusi (textContent)')
    # hitungan karakter dan batas
    pg.fill('#q','x'*600);ok(len(pg.input_value('#q'))==500,'textarea membatasi 500 karakter')
    # percakapan baru
    pg.click('#new');ok(pg.locator('.msg').count()==1,'Percakapan baru mengosongkan log')
    ok(not errs,'tidak ada galat JavaScript/konsol: '+str(errs[:2]))
    ctx.close()
    # Desktop
    ctx=b.new_context(viewport={'width':1280,'height':800});pg=ctx.new_page();pg.goto(BASE+'/penjaga-hutan/');pg.wait_for_timeout(500)
    ok(pg.locator('header.site a:has-text("Tanya AI")').count()==1,'menu desktop memuat Tanya AI')
    pg.screenshot(path=shots+'/chat_desktop.png');ctx.close()
    # Beranda & navigasi
    ctx=b.new_context(viewport={'width':360,'height':740},is_mobile=True);pg=ctx.new_page();pg.goto(BASE+'/');pg.wait_for_timeout(500)
    ok(pg.locator('a[href="penjaga-hutan/"]').count()==1,'beranda memuat tautan ke Penjaga Hutan AI')
    pg.click('#az-more');ok(pg.locator('#az-sheet a:has-text("Tanya AI")').is_visible(),'menu HP memuat Tanya AI')
    ctx.close()
    # AI belum terkonfigurasi (server lain tanpa --mockai) diuji terpisah
    b.close()
sys.exit(1 if any(not c for c,_ in res) else 0)
