// Server uji lokal: file statis + semua endpoint Functions dengan D1 palsu (SQLite). Hanya untuk pengujian.
// Pakai: node --no-warnings tests/devserver.mjs [port] [--noapi]
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
import {makeDB} from './d1shim.mjs';
import {onRequest as api} from '../functions/api/[[route]].js';
const RULES=(()=>{if(!fs.existsSync('_headers'))return[];const rules=[];let cur=null;for(const line of fs.readFileSync('_headers','utf8').split('\n')){if(!line.trim())continue;if(!/^\s/.test(line)){cur={re:new RegExp('^'+line.trim().replace(/[.+?^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*')+'$'),h:{}};rules.push(cur)}else{const i=line.indexOf(':');cur.h[line.slice(0,i).trim()]=line.slice(i+1).trim()}}return rules})();
const hdr=p=>Object.assign({},...RULES.filter(r=>r.re.test(p)).map(r=>r.h));
const port=Number(process.argv[2]||8788),noapi=process.argv.includes('--noapi');
const MIGS=fs.readdirSync('migrations').filter(f=>/^\d{4}_.*\.sql$/.test(f)).sort().map(f=>`migrations/${f}`);
const env={DB:makeDB(MIGS),ADMIN_SETUP_TOKEN:'token-uji-lokal'};
if(process.argv.includes('--mockai')) env.AI={run:async(m,i)=>{const q=i.messages.at(-1).content;if(/lambat/i.test(q))await new Promise(r=>setTimeout(r,1500));if(/galat/i.test(q))throw new Error('boom');return {response:'Ini jawaban uji dari AI palsu (tidak dari model sungguhan). Kamu bertanya: '+q+'\n\n- Poin satu\n- Poin **tebal** dua\n\n'+'Kalimat panjang sekali '.repeat(40)};}}; // hanya uji lokal
export {env};
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.webp':'image/webp','.jpg':'image/jpeg'};
http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://x');
  if(u.pathname.startsWith('/api/')){
    if(noapi){res.writeHead(404,{'content-type':'text/html'});return res.end('<h1>404</h1>');}
    const chunks=[];for await(const c of req)chunks.push(c);const body=Buffer.concat(chunks);
    const seg=u.pathname.slice(5).split('/').filter(Boolean);
    const request=new Request(u,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:body});
    const r=await api({request,env,params:{route:seg}});
    const h={};r.headers.forEach((v,k)=>h[k]=v);res.writeHead(r.status,h);return res.end(Buffer.from(await r.arrayBuffer()));
  }
  let p=path.join(process.cwd(),decodeURIComponent(u.pathname));if(!p.startsWith(process.cwd())){res.writeHead(403);return res.end();}
  if(fs.existsSync(p)&&fs.statSync(p).isDirectory()){if(!u.pathname.endsWith('/')){res.writeHead(302,{location:u.pathname+'/'+u.search});return res.end();}p=path.join(p,'index.html');}
  if(!fs.existsSync(p)){const f=path.join(process.cwd(),'404.html');res.writeHead(404,{'content-type':'text/html; charset=utf-8',...hdr(u.pathname)});return res.end(fs.existsSync(f)?fs.readFileSync(f):'<h1>404</h1>');}
  res.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream',...hdr(u.pathname)});fs.createReadStream(p).pipe(res);
}).listen(port,()=>console.log('siap',port,noapi?'(tanpa API)':''));
