// Satu pintu masuk untuk semua endpoint /api/*. Dengan satu berkas ini, perilaku di Cloudflare Pages sama persis dengan yang diuji,
// tanpa bergantung pada aturan prioritas rute berkas. Berkas lain di functions/_lib tidak mengekspor onRequest, jadi bukan rute.
import {handle as player} from '../_lib/routes/player.js';
import {handle as quiz} from '../_lib/routes/quiz.js';
import {handle as game} from '../_lib/routes/game.js';
import {handle as reports} from '../_lib/routes/reports.js';
import {handle as admin} from '../_lib/routes/admin.js';
import {handle as leaderboard} from '../_lib/routes/leaderboard.js';
import {handle as analytics} from '../_lib/routes/analytics.js';
import {handle as chat} from '../_lib/routes/chat.js';
import {handle as pub} from '../_lib/routes/public.js';
const MAP={player,quiz,game,reports,admin,leaderboard,analytics,chat};
export async function onRequest(ctx){
  const seg=[].concat(ctx.params.route||[]);
  const own=seg.length>0&&Object.hasOwn(MAP,seg[0]); // hasOwn: '/api/constructor' tidak boleh memanggil Object
  return (own?MAP[seg[0]]:pub)({...ctx,params:{...ctx.params,route:own?seg.slice(1):seg}});
}
