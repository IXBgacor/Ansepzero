// Konfigurasi publik frontend. TIDAK BOLEH berisi secret/token/password.
export const CONFIG = {
  // URL Cloudflare Worker, contoh: 'https://ansepzero-api.namaakun.workers.dev' (tanpa garis miring akhir).
  // Kosong = fitur cloud (kuis, sertifikat, skor) menampilkan status "belum dikonfigurasi".
  API_BASE: '',
  // Nomor WhatsApp petugas, format internasional tanpa + (contoh '62812xxxxxxx'). WAJIB diverifikasi tim sebelum diisi.
  WA_NUMBER: '',
  // Daftar kontak resmi (isi HANYA setelah nomor diverifikasi). Contoh: { nama: 'BPBD Barito Kuala', telepon: '...', sumber: 'URL/dokumen' }
  CONTACTS: []
};
