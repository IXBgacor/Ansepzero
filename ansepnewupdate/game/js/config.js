/* Konfigurasi global & namespace. Semua modul menempel pada window.MPH. */
window.MPH = {
  C: { TILE: 16, VIEW_W: 240, VIEW_H: 160, MAP_W: 108, MAP_H: 56,
       SPEED: 52, ANIM_FPS: 8, VERSION: 'v2.1 Alpha',
       BGM_FILE: 'assets/audio/bgm/Pixel_Reverb.mp3',   /* v0.4³: file musik latar (ganti nama file di sini bila memakai file lain) */
       /* v0.5²: SFX suara NPC = rangkaian "blip" sangat pendek (WAV) yang dijadwalkan di timeline WebAudio: satu kanal, tidak pernah bertumpuk,
          berhenti saat halaman dialog berganti/ditutup. userFiles = file SFX Anda sendiri (diisi -> dipakai SEBAGAI PENGGANTI blip bawaan; diputar sekali per halaman).
          volume = pengali volume SFX; blipMs = jarak antar-blip; maxBlips = jumlah blip maksimum per halaman. */
       NPC_SFX: { files: ['assets/audio/sfx/npc/npc-blip-1.wav', 'assets/audio/sfx/npc/npc-blip-2.wav', 'assets/audio/sfx/npc/npc-blip-3.wav', 'assets/audio/sfx/npc/npc-blip-4.wav', 'assets/audio/sfx/npc/npc-blip-5.wav', 'assets/audio/sfx/npc/npc-blip-6.wav'],
                  userFiles: [], volume: 0.55, blipMs: 105, minBlips: 2, maxBlips: 7, charsPerBlip: 9, cooldownMs: 120, userMaxMs: 1800, assetStatus: 'ASET BAWAAN (dibuat sendiri, bebas hak cipta)' },
       /* v0.5²: aset SFX cutscene (dimuat malas saat cutscene pertama kali dibutuhkan). Folder: assets/audio/sfx/cutscene/ */
       CUT_SFX: { dir: 'assets/audio/sfx/cutscene/', files: { engine: 'engine-idle-loop.wav', siren: 'siren-wail-loop.wav', brake: 'brake-hiss.wav', water: 'water-spray-loop.wav', fire: 'fire-crackle-loop.wav', forest: 'forest-ambience-loop.wav', whoosh: 'scene-whoosh.wav', chime: 'ending-chime.wav',
                       bird: 'bird-chirp.wav', drip: 'drip.wav', 'radio-beep': 'radio-beep.wav', sprout: 'sprout.wav', wind: 'wind-low-loop.wav',
                       alarm: 'alarm-loop.wav', heli: 'heli-loop.wav', crowd: 'crowd-murmur-loop.wav', village: 'village-ambience-loop.wav' } },
       /* v0.5⁴: CAM_OVERSCROLL = berapa piksel kamera geser boleh melewati tepi peta (≈3 petak); CH_CUT=false mematikan cutscene bab; SPOT_MARKERS=false mematikan tanda tempat interaksi. */
       RUN_MULT: 1.75, RUN_ANIM: 1.9, INTRO_ENABLED: true, INTRO_SKIP_AFTER: 1.5, DLG_SPEED: 'normal',   /* v1.0: lari (pengali kecepatan), cutscene cerita pembuka */
       CAM_OVERSCROLL: 56, CH_CUT: true, SPOT_MARKERS: true,
       /* v0.5²: keseimbangan volume. SFX_BOOST = penguat tetap SFX (dilindungi limiter agar tidak pecah); BGM_DUCK = pengali BGM saat cutscene. Bawaan slider: lihat DEF di audio.js. */
       SFX_BOOST: 2.4, BGM_DUCK: 0.5,
       /* v0.5²: kamera. CAM_DRAG_INVERT=false -> peta mengikuti jari (geser ke kanan = peta bergeser ke kanan, kamera ke kiri).
          true -> kamera mengikuti arah geser. CAM_DRAG_THRESHOLD = jarak (px CSS) sebelum sentuhan dianggap geser; CAM_RETURN_TAU = kehalusan kembali ke pemain (dtk); CAM_RETURN_HOLD = jeda setelah jari dilepas (dtk). */
       CAM_DRAG: true, CAM_DRAG_INVERT: false, CAM_DRAG_THRESHOLD_TOUCH: 8, CAM_DRAG_THRESHOLD_MOUSE: 5, CAM_RETURN_TAU: 0.17, CAM_RETURN_HOLD: 0.18, CAM_MAX_PAN: 9999,
       /* v0.5²: cutscene misi terakhir. SKIP_AFTER = detik sebelum tombol Lewati muncul. */
       CUT_SKIP_AFTER: 3, CUT_ENABLED: true,
       BGM_TENSE_FILE: '', BGM_TENSE_RATE: 0.82,   /* v0.5: musik tegang Misi Terakhir. Kosong = musik biasa diperlambat (BGM_TENSE_RATE); isi nama file bila punya musik tegang sendiri */
       VIEW_TARGET_H: 210, VIEW_MIN_W: 240,   /* v0.4²: ukuran pandangan dihitung dari layar (lihat game.js); VIEW_W/VIEW_H diisi ulang saat resize */
       ACCEL_TAU: 0.055, DECEL_TAU: 0.04,     /* v0.4²: peredaman kecepatan gerak (detik) */
       JOY_DEAD: 0.18,            /* v0.4: zona mati joystick (fraksi jari-jari) */
       SHOW_VERIFY_TAGS: true },  /* v0.4: tampilkan tag "Perlu verifikasi" di daftar misi; set false sebelum publikasi */
  T: { GRASS: 0, DIRT: 1, WATER: 2, BRIDGE: 3, PLAZA: 4, CROP: 5, SAFE: 6, PEAT: 7, PEATD: 8 },
  DIR: { DOWN: 0, UP: 1, LEFT: 2, RIGHT: 3 }
};
/* Notifikasi ringan (diisi main.js saat siap). */
/* v0.4²: tampilan (view) dinamis. s = piksel perangkat per piksel logis (bilangan bulat), k = piksel CSS per piksel logis.
   snap() membulatkan ke piksel PERANGKAT (bukan piksel logis) sehingga gerakan kamera/karakter halus tetapi tetap tajam. */
window.MPH.View = { s: 1, k: 1, dpr: 1, w: 240, h: 160, snap: function (v) { return Math.round(v * window.MPH.View.s) / window.MPH.View.s; } };
window.MPH.notify = function (msg, kind) { if (window.MPH._toast) window.MPH._toast(msg, kind); else console.warn(msg); };
