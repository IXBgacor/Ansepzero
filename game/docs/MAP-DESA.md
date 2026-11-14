# Struktur peta v0.6 (64×36 petak, 16 px per petak)
Wilayah lama x 0–35, y 0–25 (tidak berubah, kecuali gerbang timur terbuka di baris 10–15 pada x 34–35). Sungai ±x 22 mengalir utara–selatan (jembatan di jalan). Jalan tanah utama: baris 12–13 dari x 3 sampai x 60 (melewati gerbang). Jalur hutan selatan: baris 30–31 dari x 3 sampai x 43 (menyambung ke titik kumpul).
| Area | Petak | Isi |
|---|---|---|
| Plaza desa | x 45–54, y 11–16 | paving batu, kios (2), sumur (papan info), lampu (4), bangku (2), Pak Lurah (49,10), Petugas Lapangan (47,13), Peta Jalur Evakuasi (46,10), Kentongan (44,14), Papan Pengumuman (55,11) |
| Balai Desa | x 51–55, y 8–10 | bangunan 5×3 |
| Rumah | 10 titik (39,9) (42,9) (39,16) (41,19) (45,19) (53,19) (57,9) (57,16) (57,20) (38,21) | 3 model rumah 3×2; pagar halaman di (39–40,11), (57–59,11) |
| Jalan desa | x 49–50, y 7–10 dan y 17–27 | jalan utara (pendek) dan **jalan evakuasi** ke selatan |
| Ladang | x 36–43,y 24–26 dan x 54–61,y 24–26 | petak tanaman, pagar, jerami |
| **Titik Kumpul** | x 44–56, y 28–33 | tanah aman berwarna terang, 3 tenda, bendera, peti, Petugas Posko (48,29), Papan Titik Kumpul (51,28); 9 slot berdiri warga |
| Area api | pusat (43,2) | dinding api tak terlihat radius 88 px (pemain/warga tidak bisa masuk) |
Hutan di sekeliling: kepadatan pohon rendah di desa, lebih rapat di luar; tepi peta berpohon rapat. Kamera boleh melewati tepi peta sampai 56 px (digambar sebagai hutan gelap).
Verifikasi otomatis (`uji-v06.py map`): ukuran, jumlah rumah/objek, collision rumah & balai, setiap NPC/objek punya tempat interaksi yang terjangkau, ≥ 97% petak bebas terjangkau dari titik awal, plaza/jalan evakuasi/titik kumpul 100% terjangkau.
