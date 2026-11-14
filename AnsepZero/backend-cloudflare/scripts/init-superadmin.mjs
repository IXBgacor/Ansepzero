// Membuat berkas SQL untuk akun superadmin. Kata sandi diketik tersembunyi dan TIDAK disimpan; hanya hash yang ditulis.
// Pemakaian: node scripts/init-superadmin.mjs   ->  lalu jalankan perintah yang dicetak.
import readline from 'node:readline';
import { writeFileSync } from 'node:fs';
import { hashPassword } from '../src/lib/util.js';

function ask(q, hidden) {
  return new Promise(res => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = s => { if (s.includes(q)) process.stdout.write(q); };
    rl.question(q, a => { rl.close(); if (hidden) process.stdout.write('\n'); res(a); });
  });
}
const username = (await ask('Username superadmin (3-30 karakter): ')).trim();
if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) { console.error('Username tidak valid.'); process.exit(1); }
const p1 = await ask('Kata sandi (min. 12 karakter): ', true);
const p2 = await ask('Ulangi kata sandi: ', true);
if (p1 !== p2 || p1.length < 12) { console.error('Kata sandi tidak cocok atau kurang dari 12 karakter.'); process.exit(1); }
const hash = await hashPassword(p1);
writeFileSync('init-superadmin.sql', `INSERT INTO admin_users(username, password_hash, role) VALUES ('${username}', '${hash}', 'superadmin');\n`);
console.log('\nBerkas init-superadmin.sql dibuat (hanya berisi hash). Jalankan SALAH SATU:');
console.log('  Lokal     : npx wrangler d1 execute ansepzero-db --local  --file=init-superadmin.sql');
console.log('  PRODUKSI  : npx wrangler d1 execute ansepzero-db --remote --file=init-superadmin.sql');
console.log('Lalu HAPUS init-superadmin.sql.');
