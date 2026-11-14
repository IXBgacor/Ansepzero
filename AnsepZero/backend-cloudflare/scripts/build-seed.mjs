// Membuat migrations/0003_seed_questions.sql dari data/bank.mjs + validasi bank soal.
import { writeFileSync } from 'node:fs';
import { BANK, SOURCES } from '../data/bank.mjs';
const esc = s => String(s).replace(/'/g, "''");
const rows = [], seen = new Set(), dist = [0, 0, 0, 0];
for (const level of [1, 2, 3, 4, 5]) {
  const list = BANK[level];
  if (list.length !== 20) throw new Error(`Level ${level} harus 20 soal, ada ${list.length}`);
  list.forEach((r, i) => {
    if (r.length !== 6) throw new Error(`Format salah L${level}-${i + 1}`);
    const [q, right, w1, w2, w3, exp] = r;
    if (seen.has(q)) throw new Error('Soal ganda: ' + q); seen.add(q);
    if (new Set([right, w1, w2, w3]).size !== 4) throw new Error(`Pilihan ganda sama L${level}-${i + 1}`);
    const pos = (i + level) % 4, wrong = [w1, w2, w3], choices = [];
    for (let k = 0, w = 0; k < 4; k++) choices.push(k === pos ? right : wrong[w++]);
    dist[pos]++;
    const id = `L${level}-${String(i + 1).padStart(3, '0')}`;
    rows.push(`('${id}',${level},'${esc(q)}','${esc(JSON.stringify(choices))}',${pos},'${esc(exp)}','${esc(SOURCES[level])}',1)`);
  });
}
if (rows.length !== 100) throw new Error('Total harus 100');
writeFileSync(new URL('../migrations/0003_seed_questions.sql', import.meta.url),
  '-- Dibuat otomatis oleh scripts/build-seed.mjs (100 soal, 5 level x 20). Jangan edit manual.\nINSERT INTO quiz_questions(id, level, question, choices_json, correct_index, explanation, source, active) VALUES\n' + rows.join(',\n') + ';\n');
console.log('OK 100 soal unik; sebaran posisi kunci A-D:', dist.join('/'));
