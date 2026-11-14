/* Sertifikat PDF v0.6 — membuat berkas PDF SUNGGUHAN di browser (tanpa dialog cetak): sertifikat digambar ke canvas A4 lanskap (1754x1240 px = 150 dpi),
   diubah ke JPEG, lalu dibungkus PDF minimal (1 halaman 842x595 pt, objek image DCTDecode) dan diunduh lewat Blob. Tombol "Cetak" (print-to-PDF) tetap ada sebagai cadangan.
   Isi: nama, skor akhir, bintang, tanggal, nomor sertifikat, ringkasan penyelesaian. Catatan: penghargaan permainan edukasi, BUKAN sertifikat resmi pemerintah. */
(function (M) {
  const $ = id => document.getElementById(id), CW = 1754, CH = 1240;
  const slug = s => String(s || 'pemain').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'pemain';
  function star(g, x, y, s, on) { const R = (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(x + a * s, y + b * s, w * s, h * s); }, col = on ? '#e8a820' : '#c9c2ac', hi = on ? '#fff0a0' : '#d8d2bc';
    R(col, 7, 1, 2, 4); R(col, 5, 4, 6, 3); R(col, 1, 5, 14, 3); R(col, 3, 8, 10, 3); R(col, 2, 11, 4, 3); R(col, 10, 11, 4, 3); R(hi, 7, 3, 1, 2); }
  function fit(g, text, maxW, size, weight) { let s = size; do { g.font = weight + ' ' + s + 'px ui-monospace,"Courier New",monospace'; s -= 4; } while (g.measureText(text).width > maxW && s > 28); }
  function render(info) {
    const c = document.createElement('canvas'); c.width = CW; c.height = CH; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.fillStyle = '#f6efd8'; g.fillRect(0, 0, CW, CH);
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#2f6a3a' : '#c8a040'; g.fillRect(24 + i * 6, 24 + i * 6, CW - 48 - i * 12, CH - 48 - i * 12); g.fillStyle = '#f6efd8'; g.fillRect(30 + i * 6, 30 + i * 6, CW - 60 - i * 12, CH - 60 - i * 12); }
    g.fillStyle = '#2f6a3a'; g.fillRect(70, 70, CW - 140, 6); g.fillRect(70, CH - 76, CW - 140, 6);
    const tree = M.Sprites.tree; if (tree) { [[110, 120], [CW - 110 - 96, 120], [110, CH - 120 - 144], [CW - 110 - 96, CH - 120 - 144]].forEach(([x, y]) => g.drawImage(tree, x, y, 96, 144)); }
    g.textAlign = 'center'; g.fillStyle = '#2f6a3a'; g.font = '800 34px ui-monospace,"Courier New",monospace'; g.fillText('MISI PENJAGA HUTAN  ·  EVAKUASI DESA', CW / 2, 190);
    g.fillStyle = '#6b4423'; g.font = '800 96px ui-monospace,"Courier New",monospace'; g.fillText('SERTIFIKAT', CW / 2, 300); g.fillStyle = '#c8a040'; g.fillRect(CW / 2 - 260, 322, 520, 8);
    g.fillStyle = '#3a2a14'; g.font = '500 34px ui-monospace,"Courier New",monospace'; g.fillText('Dengan bangga diberikan kepada', CW / 2, 410);
    g.fillStyle = '#1f4a28'; fit(g, info.name, 1100, 108, '800'); g.fillText(info.name, CW / 2, 530); g.fillStyle = '#c8a040'; g.fillRect(CW / 2 - 560, 556, 1120, 6);
    g.fillStyle = '#3a2a14'; g.font = '500 32px ui-monospace,"Courier New",monospace';
    g.fillText('yang telah menyelesaikan petualangan edukasi pencegahan karhutla', CW / 2, 622); g.fillText('sebagai Penjaga Hutan, termasuk Misi Terakhir:', CW / 2, 662); g.fillText('mengevakuasi warga Desa Rimba Asri dengan selamat.', CW / 2, 702);
    for (let i = 0; i < 3; i++) star(g, CW / 2 - 156 + i * 108, 728, 6, i < info.stars);
    g.fillStyle = '#3a2a14'; g.font = '800 40px ui-monospace,"Courier New",monospace'; g.fillText('Skor akhir: ' + info.score + ' / ' + info.maxScore + '   ·   ' + info.stars + ' dari 3 bintang', CW / 2, 872);
    g.font = '500 28px ui-monospace,"Courier New",monospace'; g.fillStyle = '#4a3a24'; g.fillText(info.summary, CW / 2, 918);
    g.fillStyle = '#6b4423'; g.font = '800 30px ui-monospace,"Courier New",monospace'; g.fillText('“Nyawa adalah prioritas. Barang dapat diganti, keselamatan manusia tidak.”', CW / 2, 984);
    g.textAlign = 'left'; g.fillStyle = '#3a2a14'; g.font = '500 28px ui-monospace,"Courier New",monospace'; g.fillText('Tanggal: ' + info.date, 330, 1058); g.fillText('Nomor: ' + info.no, 330, 1098);
    g.textAlign = 'right'; g.fillText('Tim Misi Penjaga Hutan', CW - 330, 1058); g.fillStyle = '#2f6a3a'; g.fillRect(CW - 330 - 380, 1074, 380, 4);
    g.textAlign = 'center'; g.fillStyle = '#7a6a50'; g.font = '500 22px ui-monospace,"Courier New",monospace'; g.fillText('Penghargaan permainan edukasi — bukan sertifikat resmi pemerintah atau lembaga negara.', CW / 2, 1140);
    return c;
  }
  const enc = s => { const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 255; return a; };
  function makePDF(jpeg, w, h) {                        // PDF 1.4 minimal: 1 halaman A4 lanskap (842x595 pt), 1 gambar JPEG
    const parts = [], off = []; let len = 0; const push = u => { parts.push(u); len += u.length; };
    const obj = (n, head, stream) => { off[n] = len; push(enc(n + ' 0 obj\n' + head + (stream ? '\nstream\n' : '\n'))); if (stream) { push(stream); push(enc('\nendstream\n')); } push(enc('endobj\n')); };
    push(enc('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>'); obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im0 5 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 4 0 R >>');
    const content = enc('q 842 0 0 595 0 0 cm /Im0 Do Q'); obj(4, '<< /Length ' + content.length + ' >>', content);
    obj(5, '<< /Type /XObject /Subtype /Image /Width ' + w + ' /Height ' + h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.length + ' >>', jpeg);
    const xr = len; let x = 'xref\n0 6\n0000000000 65535 f \n'; for (let i = 1; i <= 5; i++) x += String(off[i]).padStart(10, '0') + ' 00000 n \n';
    push(enc(x + 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF\n'));
    const out = new Uint8Array(len); let p = 0; parts.forEach(u => { out.set(u, p); p += u.length; }); return out;
  }
  function info() {
    const P = M.Final.P, Ms = M.Missions, d = M.Final.dateText ? M.Final.dateText(P.finishedAt) : P.finishedAt.slice(0, 10);
    return { name: P.name, score: P.score, maxScore: P.maxScore, stars: P.stars, date: d, no: P.certNo,
      summary: Ms.completedCount() + '/' + Ms.defs.length + ' misi selesai  ·  ' + P.done.length + '/' + M.Final.OBJ.length + ' objective evakuasi  ·  ' + (M.Evac ? M.Evac.count('all') : 8) + '/8 warga selamat' };
  }
  function build() {
    const inf = info(), cv = render(inf), b64 = cv.toDataURL('image/jpeg', 0.92).split(',')[1], bin = atob(b64), jp = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) jp[i] = bin.charCodeAt(i);
    return { bytes: makePDF(jp, CW, CH), name: 'Sertifikat-Penjaga-Hutan-' + slug(inf.name) + '-' + inf.no + '.pdf', info: inf };
  }
  function download() {
    if (!M.Final.certAllowed()) return false;
    const r = build(), blob = new Blob([r.bytes], { type: 'application/pdf' }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = r.name; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 15000);
    M.Audio.sfx('reward'); if (M.notify) M.notify('Sertifikat PDF diunduh: ' + r.name); M.Certpdf.last = { name: r.name, size: r.bytes.length }; return true;
  }
  function init() { const b = $('cert-pdf'); if (b) b.onclick = download; const s = $('c-sum'); }
  M.Certpdf = { init, build, download, render, makePDF, last: null };
})(window.MPH);
