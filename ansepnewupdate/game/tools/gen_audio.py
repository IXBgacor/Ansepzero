#!/usr/bin/env python3
"""Pembuat aset SFX Misi Penjaga Hutan v0.5⁴ (sintesis prosedural, tanpa sampel pihak ketiga).
Semua bunyi dibuat dari rumus (gelombang sinus/segitiga/persegi, derau, filter) sehingga TIDAK mengandung audio berhak cipta.
Dilepas sebagai CC0 / domain publik: bebas dipakai, diubah, dan diedarkan.
Butuh: Python 3, numpy, scipy.   Jalankan dari folder game:  python3 tools/gen_audio.py
Keluaran: WAV mono 22.05 kHz 16-bit -> assets/audio/sfx/npc/ dan assets/audio/sfx/cutscene/ (deterministik: seed tetap)."""
import os, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 22050
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'audio', 'sfx')
rng = np.random.default_rng(20261005)

def t_(sec): return np.arange(int(SR * sec)) / SR
def lp(x, f, o=2): b, a = butter(o, f / (SR / 2), 'low'); return lfilter(b, a, x)
def hp(x, f, o=2): b, a = butter(o, f / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, f1, f2, o=2): b, a = butter(o, [f1 / (SR / 2), f2 / (SR / 2)], 'band'); return lfilter(b, a, x)
def noise(n): return rng.standard_normal(n)
def norm(x, peak): m = np.max(np.abs(x)); return x * (peak / m) if m > 0 else x
def loopify(x, xf):
    """Buat loop mulus: ekor sepanjang xf dicampur ke kepala."""
    n = len(x) - xf; w = np.linspace(0, 1, xf); y = x[:n].copy(); y[:xf] = x[:xf] * w + x[n:n + xf] * (1 - w); return y
def save(sub, name, x, peak):
    d = os.path.join(ROOT, sub); os.makedirs(d, exist_ok=True)
    y = np.int16(np.clip(norm(x, peak), -1, 1) * 32767); wavfile.write(os.path.join(d, name), SR, y)
    print('%-8s %-26s %5.2f s  %5.1f KB' % (sub, name, len(y) / SR, os.path.getsize(os.path.join(d, name)) / 1024))

# ---------- NPC: "blip" bicara pendek bergaya pixel-art (6 varian) ----------
def blip(f0, contour, dur, duty=0.28, mix=0.35):
    t = t_(dur); f = f0 * contour(t / dur); ph = 2 * np.pi * np.cumsum(f) / SR
    tri = 2 / np.pi * np.arcsin(np.sin(ph)); sq = np.where((ph / (2 * np.pi)) % 1 < duty, 1.0, -1.0)
    x = (1 - mix) * tri + mix * 0.6 * sq
    env = np.minimum(1, t / 0.006) * np.exp(-t / (dur * 0.38)); env *= np.minimum(1, (dur - t) / 0.012)
    return lp(x * env, 3400, 2)
NPC = [
    (330, lambda u: 1 + 0.16 * u,            0.085), (390, lambda u: 1.12 - 0.20 * u,          0.080), (450, lambda u: 1 + 0.10 * np.sin(np.pi * u), 0.075),
    (360, lambda u: 0.92 + 0.28 * u ** 0.6,  0.090), (420, lambda u: 1.08 - 0.12 * np.sin(np.pi * u), 0.070), (300, lambda u: 1 + 0.22 * np.sin(2 * np.pi * u) * (1 - u), 0.095)]
for i, (f0, c, d) in enumerate(NPC, 1): save('npc', 'npc-blip-%d.wav' % i, blip(f0, c, d), 0.80)

# ---------- Cutscene ----------
# mesin diam (loop 2 dtk, 28 Hz = 56 siklus utuh)
t = t_(2.0); eng = sum(a * np.sin(2 * np.pi * 28 * k * t + k) for k, a in zip((1, 2, 3, 4, 5), (1, .7, .45, .3, .15)))
eng = eng * (1 + 0.45 * np.sin(2 * np.pi * 14 * t)) + 0.5 * lp(noise(len(t)), 220)
save('cutscene', 'engine-idle-loop.wav', lp(eng, 900), 0.55)
# sirene "wail" (loop 3 dtk; frekuensi periodik -> fase siklus utuh)
t = t_(3.0); f = 760 + 320 * np.sin(2 * np.pi * t / 3.0 - np.pi / 2); ph = 2 * np.pi * np.cumsum(f) / SR
sir = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
save('cutscene', 'siren-wail-loop.wav', lp(sir, 4200), 0.40)
# desis rem udara (satu kali)
t = t_(0.9); env = np.minimum(1, t / 0.02) * np.exp(-t / 0.28); hs = hp(noise(len(t)), 1800) * env + 0.35 * lp(noise(len(t)), 500) * np.exp(-t / 0.15)
save('cutscene', 'brake-hiss.wav', hs, 0.55)
# semprotan air (loop 2 dtk)
n = int(SR * 2.4); w = bp(noise(n), 1400, 7500); fl = 0.75 + 0.25 * lp(noise(n), 18, 1) / 0.6; w = w * np.clip(fl, 0.4, 1.2)
save('cutscene', 'water-spray-loop.wav', loopify(w, int(SR * 0.4)), 0.50)
# api berderak (loop 3 dtk)
n = int(SR * 3.4); x = 0.35 * lp(noise(n), 260, 2) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.7 * t_(3.4)))
for _ in range(95):
    p = rng.integers(0, n - 400); L = rng.integers(60, 360); a = rng.uniform(0.15, 1.0) ** 2; e = np.exp(-np.arange(L) / (L * 0.22))
    x[p:p + L] += hp(noise(L), rng.uniform(900, 2600), 1) * e * a * 0.9
save('cutscene', 'fire-crackle-loop.wav', loopify(x, int(SR * 0.4)), 0.50)
# suasana hutan (loop 4 dtk): angin lembut + kicau burung
n = int(SR * 4.4); tt = t_(4.4); wind = bp(noise(n), 180, 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.25 * tt + 1) ** 2) * 0.55
for st in (0.5, 0.78, 1.85, 2.1, 2.9, 3.15):          # dua-tiga kicau berurutan
    L = int(SR * 0.11); u = np.arange(L) / L; f = (3000 + 900 * np.sin(np.pi * u * 2.2) + rng.integers(-300, 300)) ; ph = 2 * np.pi * np.cumsum(f) / SR
    c = np.sin(ph) * np.sin(np.pi * u) ** 1.5 * 0.5; p = int(SR * st); wind[p:p + L] += c
save('cutscene', 'forest-ambience-loop.wav', loopify(wind, int(SR * 0.4)), 0.50)
# whoosh transisi antar-adegan
t = t_(0.6); u = t / 0.6; sw = np.zeros(len(t)); base = noise(len(t))
for k in range(0, len(t), 512):
    c = 300 * (10 ** (u[min(k, len(u) - 1)])); sw[k:k + 512] = bp(base[max(0, k - 256):k + 768], max(80, c * 0.7), min(9000, c * 1.4), 1)[256 if k else 0:][:len(sw[k:k + 512])] if False else 0
w = lp(base, 3000) * 0 + noise(len(t)); w = bp(w, 400, 3800, 1) * np.sin(np.pi * u) ** 2
save('cutscene', 'scene-whoosh.wav', w, 0.40)
# lonceng penutup lembut (arpeggio C-E-G-C)
t = t_(1.9); out = np.zeros(len(t))
for i, fr in enumerate((523.25, 659.25, 783.99, 1046.5)):
    s = int(SR * 0.16 * i); tt = np.arange(len(t) - s) / SR
    out[s:] += (np.sin(2 * np.pi * fr * tt) + 0.25 * np.sin(2 * np.pi * 2 * fr * tt)) * np.exp(-tt / 0.55) * np.minimum(1, tt / 0.004) * (0.8 if i < 3 else 1.0)
dly = np.zeros(len(out)); d = int(SR * 0.21); dly[d:] = out[:-d] * 0.35; save('cutscene', 'ending-chime.wav', out + dly, 0.55)

# ================= v0.5⁴: SFX tambahan untuk cutscene bab =================
# kicau burung (satu kali, 1.8 dtk): tiga rangkaian "tit-tit" menanjak/menurun
t = t_(1.8); out = np.zeros(len(t))
for st, f0, f1, n in ((0.05, 3200, 4300, 3), (0.65, 4300, 3000, 2), (1.1, 3600, 4600, 4)):
    for k in range(n):
        s0 = int(SR * (st + k * 0.085)); L = int(SR * 0.06); u = np.arange(L) / L; f = f0 + (f1 - f0) * u
        out[s0:s0 + L] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * u) ** 1.2 * 0.8
save('cutscene', 'bird-chirp.wav', lp(out, 6500), 0.50)
# tetes air (0.6 dtk)
t = t_(0.6); f = 1500 * np.exp(-t * 7) + 380; d = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.07) * np.minimum(1, t / 0.002)
d2 = np.zeros(len(t)); o = int(SR * 0.17); d2[o:] = d[:-o] * 0.4; save('cutscene', 'drip.wav', d + d2, 0.55)
# bip radio + derau (1.0 dtk)
t = t_(1.0); x = np.zeros(len(t))
for s0 in (0.05, 0.28):
    a = int(SR * s0); L = int(SR * 0.14); tt = np.arange(L) / SR; x[a:a + L] += np.sin(2 * np.pi * 1480 * tt) * np.minimum(1, tt / 0.004) * np.minimum(1, (0.14 - tt) / 0.01) * 0.8
st_ = bp(noise(len(t)), 900, 3500, 1) * 0.22 * np.exp(-t / 0.35) * (np.sin(2 * np.pi * 37 * t) > -0.4); save('cutscene', 'radio-beep.wav', x + st_, 0.50)
# tunas tumbuh (0.7 dtk): "pop" naik + kilau
t = t_(0.7); f = 420 + 700 * (1 - np.exp(-t * 9)); p_ = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16) * np.minimum(1, t / 0.004)
gl = np.zeros(len(t)); a = int(SR * 0.12); tt = t_(0.7)[:len(t) - a]; gl[a:] = (np.sin(2 * np.pi * 1800 * tt) + 0.5 * np.sin(2 * np.pi * 2700 * tt)) * np.exp(-tt / 0.14) * 0.35
save('cutscene', 'sprout.wav', p_ + gl, 0.50)
# angin rendah (loop 4 dtk) untuk suasana berkabut
n = int(SR * 4.4); tt = t_(4.4); w = bp(noise(n), 90, 520) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.23 * tt + 0.4) ** 2) + 0.25 * lp(noise(n), 160)
save('cutscene', 'wind-low-loop.wav', loopify(w, int(SR * 0.4)), 0.50)

# ================= v0.6: SFX desa / evakuasi / helikopter =================
# alarm desa dua nada (loop 3 dtk)
t = t_(3.0); f = np.where((t * 2) % 1 < 0.5, 880.0, 660.0); a = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.8 + 0.2 * np.sin(2 * np.pi * 8 * t))
save('cutscene', 'alarm-loop.wav', lp(a + 0.25 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR), 3800), 0.45)
# helikopter: derau tersaring dimodulasi 11 Hz (22 siklus utuh per 2 dtk) + dengung rendah
t = t_(2.0); n = noise(len(t)); chop = (0.55 + 0.45 * np.sin(2 * np.pi * 11 * t)) ** 2
h = lp(n, 650) * chop * 1.4 + 0.5 * np.sin(2 * np.pi * 66 * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 11 * t)) + 0.18 * np.sin(2 * np.pi * 210 * t) + 0.25 * bp(n, 1500, 2600, 1) * chop
save('cutscene', 'heli-loop.wav', h, 0.55)
# gumaman warga (loop 4 dtk)
n = int(SR * 4.4); base = bp(noise(n), 220, 1400); env = lp(np.abs(noise(n)), 7, 1); env = env / (np.max(env) + 1e-9)
voice = base * (0.25 + 0.75 * env ** 1.5); save('cutscene', 'crowd-murmur-loop.wav', loopify(voice, int(SR * 0.4)), 0.45)
# suasana desa (loop 4 dtk): angin lembut, kicau jauh, ketukan kayu
n = int(SR * 4.4); tt = t_(4.4); v = bp(noise(n), 150, 800) * (0.45 + 0.4 * np.sin(2 * np.pi * 0.2 * tt + 2) ** 2) * 0.5
for st in (0.9, 2.3, 3.4):
    L = int(SR * 0.09); u = np.arange(L) / L; ff = 3300 + 700 * np.sin(np.pi * u * 2); ph = 2 * np.pi * np.cumsum(ff) / SR; p0 = int(SR * st); v[p0:p0 + L] += np.sin(ph) * np.sin(np.pi * u) * 0.3
for st in (1.6, 3.9):
    L = int(SR * 0.12); u = np.arange(L) / SR; p0 = int(SR * st); v[p0:p0 + L] += np.sin(2 * np.pi * 420 * u) * np.exp(-u / 0.025) * 0.45
save('cutscene', 'village-ambience-loop.wav', loopify(v, int(SR * 0.4)), 0.45)
