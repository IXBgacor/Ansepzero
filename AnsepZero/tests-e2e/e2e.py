"""Uji E2E AnsepZero (Playwright + Chromium). Butuh: API uji di :8787 dan frontend statis di :8080.
Jalankan: python3 e2e.py   (lihat docs/TESTING.md). API_BASE & WA_NUMBER diinjeksi lewat intersepsi config.js (file asli tidak diubah)."""
import json, re, sys, urllib.request, io
from playwright.sync_api import sync_playwright

WEB, API = 'http://localhost:8080', 'http://localhost:8787'
ADMIN_PASS = 'superadmin-uji-12345'
res = []
def ok(c, name, extra=''):
    res.append(c); print(('PASS ' if c else 'FAIL ') + name + (' -- ' + str(extra) if (extra and not c) else ''))

def req(path, method='GET', body=None, token=None):
    r = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body else None, headers={'Content-Type': 'application/json', **({'Authorization': 'Bearer ' + token} if token else {})})
    return json.loads(urllib.request.urlopen(r).read())
admin = req('/api/admin/login', 'POST', {'username': 'super', 'password': ADMIN_PASS})['token']
keys = {q['question']: q['correct_index'] for q in req('/api/admin/questions', token=admin)['questions']}
print('Kunci dimuat untuk', len(keys), 'soal')

def cfg(wa=''):
    return f"export const CONFIG = {{ API_BASE: '{API}', WA_NUMBER: '{wa}', CONTACTS: [] }};"
def new_page(ctx, wa=''):
    p = ctx.new_page(); errs = []
    p.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    p.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' else None)
    p.on('response', lambda r: errs.append(f'HTTP {r.status} {r.url}') if r.status >= 400 and '/api/' not in r.url else None)
    p.route(WEB + '/js/config.js', lambda r: r.fulfill(body=cfg(wa), content_type='application/javascript'))
    return p, errs

ROUTES = ['', 'edukasi', 'penyebab', 'dampak', 'pencegahan', 'informasi', 'lapor', 'game', 'kuis', 'peringkat', 'sertifikat', 'tentang', 'referensi', 'privasi', 'tidak-ada']
VIEWPORTS = {'android-360': (360, 740), 'iphone-390': (390, 844), 'tablet-768': (768, 1024), 'desktop-1280': (1280, 800)}

with sync_playwright() as pw:
    b = pw.chromium.launch()
    # ---------- Halaman, error, overflow, responsif ----------
    for vn, (w, hgt) in VIEWPORTS.items():
        ctx = b.new_context(viewport={'width': w, 'height': hgt}); p, errs = new_page(ctx)
        bad_over, bad_h1 = [], []
        for r in ROUTES:
            p.goto(f'{WEB}/#/{r}'); p.wait_for_timeout(350 if r != 'game' else 1500)
            if p.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1'): bad_over.append(r)
            if not p.locator('main h1').count(): bad_h1.append(r)
        ok(not bad_over, f'[{vn}] tanpa overflow horizontal di {len(ROUTES)} halaman', bad_over)
        ok(not bad_h1, f'[{vn}] semua halaman punya judul', bad_h1)
        ok(not errs, f'[{vn}] tanpa error konsol/404 resource', errs[:3])
        if w == 360:
            p.goto(WEB + '/#/'); vis = p.locator('#nav').is_visible(); p.click('#menuBtn'); ok(not vis and p.locator('#nav').is_visible(), 'navigasi mobile: menu tertutup lalu terbuka')
            p.click('#nav >> text=Edukasi'); p.wait_for_timeout(200); ok(p.locator('h1').first.inner_text() == 'Edukasi Karhutla' and not p.locator('#nav').is_visible(), 'navigasi mobile: pindah halaman & menu menutup')
        ctx.close()
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}); p, _ = new_page(ctx); p.goto(WEB + '/#/tidak-ada'); ok('tidak ditemukan' in p.inner_text('main').lower(), 'halaman 404 SPA tampil'); ctx.close()
    emo = re.compile('[\U0001F300-\U0001FAFF\u2600-\u27BF]')
    ctx = b.new_context(); p, _ = new_page(ctx); txt = ''
    for r in ROUTES[:-1]:
        p.goto(f'{WEB}/#/{r}'); p.wait_for_timeout(200); txt += p.inner_text('body')
    ok(not emo.search(txt), 'tidak ada emoji pada antarmuka utama'); ctx.close()

    # ---------- Pelaporan ----------
    ctx = b.new_context(permissions=[]); p, e = new_page(ctx); p.goto(WEB + '/#/lapor')
    ok(p.locator('button:has-text("Siapkan pesan WhatsApp")').is_disabled(), 'lapor: tombol WA nonaktif saat nomor belum dikonfigurasi'); ctx.close()
    ctx = b.new_context(); p, e = new_page(ctx, wa='628123456789'); p.goto(WEB + '/#/lapor')
    p.click('button:has-text("Siapkan pesan WhatsApp")'); ok(p.locator('.note.err[role=alert]').count() == 1, 'lapor: validasi wajib isi')
    p.fill('#loc', 'Jalan Contoh, Desa Uji'); p.fill('#desc', 'Asap tebal dari semak.')
    with ctx.expect_page() as pop:
        ctx.route('https://wa.me/**', lambda r: r.fulfill(body='ok')); p.click('button:has-text("Siapkan pesan WhatsApp")')
    u = pop.value.url; ok(u.startswith('https://wa.me/628123456789?text=') and 'Desa%20Uji' in u, 'lapor: tautan WhatsApp berisi pesan terisi', u)
    p.click('button:has-text("Isi koordinat dari GPS")'); p.wait_for_timeout(800); ok('izin ditolak' in p.inner_text('main') or 'tidak dapat' in p.inner_text('main').lower(), 'lapor: GPS ditolak -> pesan fallback manual'); ctx.close()

    # ---------- Kuis ----------
    ctx = b.new_context(viewport={'width': 390, 'height': 844}); p, errs = new_page(ctx); p.goto(WEB + '/#/kuis')
    p.fill('#dn', 'Tester Uji'); p.click('button:has-text("Lanjut")'); p.wait_for_selector('text=Level 1: Dasar karhutla')
    ok(p.locator('button:has-text("Mulai level")').nth(1).is_disabled(), 'kuis: level 2 terkunci di UI')
    def run_level(correct):
        for i in range(20):
            q = p.locator('main h2').inner_text(); ci = keys[q]
            p.locator('.opt').nth(ci if correct else (ci + 1) % 4).click()
            if i < 19: p.click('button:has-text("Berikutnya")')
        p.click('button:has-text("Kirim jawaban")'); p.wait_for_selector('.note.ok, .note.err')
    p.locator('button:has-text("Mulai level")').first.click(); p.wait_for_selector('text=soal 1 dari 20')
    run_level(False); ok('Belum lulus' in p.inner_text('main') and 'Pembahasan' in p.inner_text('main') and '0 dari 20' in p.inner_text('main'), 'kuis: gagal -> skor & pembahasan ditampilkan')
    p.click('button:has-text("Kembali ke daftar level")'); p.wait_for_selector('text=Level 1: Dasar')
    ok(p.locator('button:has-text("Mulai level")').nth(1).is_disabled(), 'kuis: level 2 tetap terkunci setelah gagal')
    p.locator('button:has-text("Ulangi level")').first.click(); p.wait_for_selector('text=soal 1 dari 20'); run_level(True)
    ok('Lulus!' in p.inner_text('main') and '20 dari 20' in p.inner_text('main'), 'kuis: ulang -> lulus 20/20')
    p.click('button:has-text("Ke daftar level")'); p.wait_for_selector('text=Level 2')
    ok(p.locator('button:has-text("Mulai level"), button:has-text("Ulangi level")').nth(1).is_enabled(), 'kuis: level 2 terbuka setelah lulus')
    ok(not p.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1'), 'kuis: tanpa overflow di HP')
    ses = json.loads(p.evaluate("localStorage.getItem('az.session')")); T = ses['token']
    att = req('/api/admin/quiz-attempts', token=admin)['attempts']; ok(len(att) == 2 and sorted(a['passed'] for a in att) == [0, 1], 'kuis: riwayat 2 percobaan tersimpan di database')
    for l in range(2, 6):
        qs = [q for q in req('/api/admin/questions?level=%d' % l, token=admin)['questions']]
        req('/api/quiz/attempts', 'POST', {'level': l, 'attempt_key': 'abcdef0123456789abcdef%d' % l, 'answers': [{'question_id': q['id'], 'choice': q['correct_index']} for q in qs]}, token=T)
    p.reload(); p.wait_for_selector('text=Semua level lulus'); ok(True, 'kuis: semua level lulus (level 2-5 via API)')

    # ---------- Game + sinkronisasi skor ----------
    p.goto(WEB + '/#/game'); p.wait_for_timeout(2500)
    fr = p.frame_locator('iframe'); ok(p.locator('iframe').count() == 1 and p.frames[1].evaluate('typeof window.MPH') == 'object', 'game: dimuat di iframe, objek MPH tersedia')
    ok(p.frames[1].evaluate("document.querySelectorAll('canvas').length") >= 1, 'game: kanvas ada')
    p.evaluate("localStorage.setItem('mph.v05', JSON.stringify({v:1,ver:'v2.1 Alpha',name:'Tester',finished:true,stars:3,score:80,maxScore:100,certNo:'MPH-LOKAL-1',finishedAt:'2026-10-13T00:00:00Z'}))")
    p.wait_for_selector('text=Tersimpan ke cloud', timeout=9000); ok(True, 'game: bridge mengirim hasil -> status "Tersimpan ke cloud"')
    sc = req('/api/admin/game-scores', token=admin)['scores']; ok(len(sc) == 1 and sc[0]['score'] == 80 and sc[0]['stars'] == 3, 'game: skor masuk database', sc)
    p.evaluate("document.querySelector('iframe').contentWindow.postMessage({type:'ansepzero:request-result'}, location.origin)"); p.wait_for_timeout(4000)
    ok(len(req('/api/admin/game-scores', token=admin)['scores']) == 1, 'game: pengiriman ulang tidak membuat duplikat')
    p.route('**/api/game/scores', lambda r: r.abort()); p.evaluate("localStorage.setItem('mph.v05', JSON.stringify({v:1,ver:'v2.1 Alpha',name:'Tester',finished:true,stars:2,score:90,maxScore:100,certNo:'MPH-LOKAL-2',finishedAt:'2026-10-13T01:00:00Z'}))")
    p.wait_for_selector('text=Gagal menyimpan ke cloud', timeout=9000); ok(True, 'game: jaringan gagal -> status "gagal/menunggu sinkronisasi" (tidak pura-pura tersimpan)')
    p.unroute('**/api/game/scores'); p.click('button:has-text("Coba kirim ulang")'); p.wait_for_selector('text=Tersimpan ke cloud'); ok(len(req('/api/admin/game-scores', token=admin)['scores']) == 2, 'game: kirim ulang manual berhasil')

    # ---------- Sertifikat ----------
    p.goto(WEB + '/#/sertifikat'); p.wait_for_selector('text=Sertifikat kuis')
    p.locator('button:has-text("Terbitkan sertifikat")').first.click(); p.wait_for_selector('.cert')
    cn = re.search(r'AZQ-\d{4}-[A-Z0-9]{4}-[A-Z0-9]{4}', p.inner_text('.cert')); ok(bool(cn) and 'Tester Uji' in p.inner_text('.cert'), 'sertifikat kuis: nama & nomor tampil')
    p.locator('button:has-text("Terbitkan sertifikat")').first.click(); p.wait_for_selector('.cert >> nth=1')
    ok('SERTIFIKAT PENYELESAIAN MISI' in p.inner_text('main') and 'skor 90 dari 100' in p.inner_text('main'), 'sertifikat game: skor terbaik dari database')
    p.fill('#vn', cn.group(0)); p.click('button:has-text("Periksa")'); p.wait_for_selector('.note.ok:has-text("Valid")'); ok(True, 'verifikasi: nomor valid dikenali')
    p.fill('#vn', 'AZQ-2026-ZZZZ-ZZZZ'); p.click('button:has-text("Periksa")'); p.wait_for_selector('text=tidak ditemukan'); ok(True, 'verifikasi: nomor palsu ditolak')
    p.evaluate("window.print = () => {}"); p.locator('button:has-text("Cetak / simpan PDF")').first.click(); ok(p.evaluate("document.body.classList.contains('print-one')"), 'sertifikat: mode cetak 1 sertifikat aktif saat tombol cetak ditekan')
    p.emulate_media(media='print'); pdf = p.pdf(format='A4', landscape=True, print_background=True, prefer_css_page_size=True)
    pages = len(re.findall(rb'/Type\s*/Page[^s]', pdf)); ok(pages == 1, f'sertifikat: cetak PDF A4 lanskap = {pages} halaman (tidak terpotong)'); open('/tmp/sertifikat-uji.pdf', 'wb').write(pdf)
    p.emulate_media(media='screen'); ctx.close()

    # sertifikat tanpa syarat
    ctx = b.new_context(); p, _ = new_page(ctx); p.goto(WEB + '/#/sertifikat'); p.fill('#dn', 'Peserta Baru'); p.click('button:has-text("Lanjut")'); p.wait_for_selector('text=Sertifikat kuis')
    p.locator('button:has-text("Terbitkan sertifikat")').first.click(); p.wait_for_selector('.note.err'); ok('kelima level' in p.inner_text('.note.err') or 'lulus' in p.inner_text('.note.err'), 'sertifikat: ditolak server tanpa syarat'); 
    p.evaluate("localStorage.setItem('az.fake','1')"); ctx.close()

    # ---------- Admin ----------
    ctx = b.new_context(viewport={'width': 390, 'height': 844}); p, errs = new_page(ctx); p.goto(WEB + '/admin/'); p.wait_for_selector('text=Masuk admin')
    ok('Admin' in p.inner_text('header') and not p.locator('nav a:has-text("Admin")').count(), 'admin: tidak ada di navigasi publik')
    p.fill('#u', 'super'); p.fill('#p', 'salah'); p.click('button:has-text("Masuk")'); p.wait_for_selector('.note.err'); ok(True, 'admin: login salah ditolak')
    p.fill('#p', ADMIN_PASS); p.click('button:has-text("Masuk")'); p.wait_for_selector('text=Persentase pemahaman')
    t = p.inner_text('main'); ok('100%' in t and '1 / 1' in t, 'admin: persentase pemahaman = pembilang/penyebut (1/1)')
    ok(not p.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1'), 'admin: tanpa overflow di HP')
    p.click('button[role=tab]:has-text("Bank soal")'); p.wait_for_selector('summary:has-text("L1-001")'); ok(p.locator('details.card').count() >= 21, 'admin: bank soal tampil (20 soal + form tambah)')
    p.click('button[role=tab]:has-text("Peringkat")'); p.wait_for_selector('text=Tester Uji'); ok(True, 'admin: peringkat tampil')
    p.click('button[role=tab]:has-text("Akun admin")'); p.wait_for_selector('text=Maksimal 5'); ok(True, 'admin: pengelolaan akun (superadmin)')
    p.click('#out'); p.wait_for_selector('text=Masuk admin'); ok(p.evaluate("sessionStorage.getItem('az.admin')") is None, 'admin: logout menghapus sesi')
    ok(not [e for e in errs if '401' not in e], 'admin: tanpa error konsol', errs[:3]); ctx.close()
    b.close()
print(f'\nHasil E2E: {sum(res)} PASS, {len(res) - sum(res)} FAIL'); sys.exit(0 if all(res) else 1)
