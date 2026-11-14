// Pengganti D1 untuk uji lokal memakai node:sqlite (Node 22+). Hanya untuk pengujian.
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
export function makeDB(files){
  const db=new DatabaseSync(':memory:'); for(const f of files) db.exec(fs.readFileSync(f,'utf8'));
  const stmt=(sql,args=[])=>({bind:(...a)=>stmt(sql,a),
    first:async()=>db.prepare(sql).get(...args)??null,
    all:async()=>({results:db.prepare(sql).all(...args)}),
    run:async()=>{const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};}});
  return {prepare:s=>stmt(s),batch:async ss=>{db.exec('BEGIN');try{const o=[];for(const s of ss)o.push(await s.run());db.exec('COMMIT');return o;}catch(e){db.exec('ROLLBACK');throw e;}},raw:db};
}
