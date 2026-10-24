const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const helmet = require('helmet');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
let compression=null;try{compression=require('compression');}catch{}

const app = express();
// Erorile din handlere async ajung la handlerul global (răspuns 500) în loc să lase cererea agățată.
for(const m of ['get','post','put','patch','delete']){const orig=app[m].bind(app);app[m]=(p,...hs)=>orig(p,...hs.map(h=>typeof h==='function'&&h.length<4&&h.constructor&&h.constructor.name==='AsyncFunction'?(req,res,next)=>h(req,res,next).catch(next):h));}
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV==='production' || !!process.env.RENDER;
const PUBLIC_FILES = ['index.html','style.css','script.js'];
const ASSETS_DIR = path.join(__dirname,'assets');
const DB_URL = process.env.DATABASE_URL || '';
const DB_LOCAL = /localhost|127\.0\.0\.1/.test(DB_URL);
const pool = DB_URL ? new Pool({connectionString:DB_URL,ssl:DB_LOCAL?false:{rejectUnauthorized:process.env.DATABASE_SSL_STRICT==='true'},max:10,idleTimeoutMillis:30000}) : null;
if(pool)pool.on('error',e=>console.error('pg pool error',e.message));

/* ---------- poze în Supabase Storage (opțional) ---------- */
// Dacă SUPABASE_URL și SUPABASE_SERVICE_KEY sunt setate, pozele noi se încarcă în bucket, iar în baza de date rămâne doar linkul.
// Fără ele, pozele rămân ca înainte (base64 în PostgreSQL).
let SUPA_URL = (process.env.SUPABASE_URL||'').trim().replace(/\/(rest|storage|auth)\/v1.*$/,'').replace(/\/+$/,'');
try{ if(SUPA_URL) new URL(SUPA_URL); }catch{ console.error('SUPABASE_URL invalid (trebuie să înceapă cu https://) – pozele rămân în baza de date.'); SUPA_URL=''; }
const SUPA_KEY = (process.env.SUPABASE_SERVICE_KEY||'').trim();
const SUPA_BUCKET = (process.env.SUPABASE_BUCKET||'pieseauto').trim();
const STORAGE_ON = !!(SUPA_URL && SUPA_KEY);
const STORAGE_PUBLIC = STORAGE_ON ? SUPA_URL+'/storage/v1/object/public/'+SUPA_BUCKET+'/' : '';
const isDataImg = s => typeof s==='string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s);
const isStoredUrl = s => STORAGE_ON && typeof s==='string' && s.length<400 && s.startsWith(STORAGE_PUBLIC) && !s.includes('..') && /^[A-Za-z0-9_\-./]+$/.test(s.slice(STORAGE_PUBLIC.length));
async function uploadImage(dataUrl,userId){
  const m=/^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(dataUrl);
  const key='u'+userId+'/'+Date.now()+'-'+crypto.randomBytes(6).toString('hex')+'.'+(m[1]==='jpeg'?'jpg':m[1]);
  const r=await fetch(SUPA_URL+'/storage/v1/object/'+SUPA_BUCKET+'/'+key,{method:'POST',headers:{Authorization:'Bearer '+SUPA_KEY,apikey:SUPA_KEY,'Content-Type':'image/'+m[1],'cache-control':'max-age=31536000'},body:Buffer.from(m[2],'base64')});
  if(!r.ok){ console.error('Supabase Storage upload:',r.status,(await r.text()).slice(0,200)); throw new Error('STORAGE'); }
  return STORAGE_PUBLIC+key;
}
async function storeImages(images,userId){
  if(!STORAGE_ON) return images;
  return Promise.all(images.map(img=>isDataImg(img)?uploadImage(img,userId):img));
}
// Șterge din Supabase Storage toate pozele încărcate de un utilizator (chei u<id>/...) — apelat la ștergerea contului.
function deleteStoredImages(userId){
  if(!STORAGE_ON) return;
  fetch(SUPA_URL+'/storage/v1/object/'+SUPA_BUCKET,{method:'DELETE',headers:{Authorization:'Bearer '+SUPA_KEY,apikey:SUPA_KEY,'Content-Type':'application/json'},body:JSON.stringify({prefixes:['u'+userId+'/']})}).catch(e=>console.error('Supabase Storage delete:',e.message));
}
console.log(STORAGE_ON?'Poze: Supabase Storage (bucket '+SUPA_BUCKET+')':'Poze: salvate în baza de date (SUPABASE_URL / SUPABASE_SERVICE_KEY lipsesc)');
const { CURATED_VEHICLES } = require('./vehicles-catalog');
// Anunțurile noi se publică automat. Pentru moderare manuală setează AUTO_APPROVE=false în Render.
const AUTO_APPROVE = String(process.env.AUTO_APPROVE||'true').toLowerCase()!=='false';
const ACTIVE_LISTINGS_LIMIT = Number(process.env.ACTIVE_LISTINGS_LIMIT)||100;
const NEW_LISTING_STATUS = AUTO_APPROVE ? 'approved' : 'pending';
let catalogCache = null;
let catalogLoadedAt = 0;
let catalogRetryAt = 0;

// Lightweight in-memory throttling for authentication/recovery endpoints.
// This protects the app from accidental brute-force/recovery abuse without
// requiring another service. Entries expire automatically.
const authAttempts = new Map();
const recoveryAttempts = new Map();
// Cheile modificate se scriu periodic în Postgres (vezi flushRateState), ca limitările să supraviețuiască repornirilor.
const RL_DIRTY=new Map();
function markDirty(map,key){let s=RL_DIRTY.get(map);if(!s)RL_DIRTY.set(map,s=new Set());s.add(key);}
function throttle(map,key,limit,windowMs){
 const now=Date.now();
 const old=map.get(key)||[];
 const fresh=old.filter(t=>now-t<windowMs);
 if(fresh.length>=limit){ map.set(key,fresh); return false; }
 fresh.push(now); map.set(key,fresh); markDirty(map,key); return true;
}
setInterval(()=>{const now=Date.now();for(const m of [authAttempts,recoveryAttempts])for(const [k,v] of m){if(!v.length||now-v[v.length-1]>15*60*1000)m.delete(k);}},10*60*1000).unref();
function clientIp(req){return String(req.ip||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();}
function normalizeIdentifier(value){return String(value||'').trim();}
const COMMON_PW=new Set(['12345678','123456789','1234567890','11111111','00000000','87654321','password','password1','password123','parola123','parola1234','parola','parola1','parolamea','qwertyui','qwertyuiop','qwerty123','asdfghjk','asdfghjkl','abcd1234','abcdefgh','iloveyou','admin123','administrator','autopiese','autopiese1','autopiese123','test1234','testtest','welcome1','romania1','romania123','bucuresti','dacialogan','master123','letmein1','changeme','abc12345','1q2w3e4r','1qaz2wsx','zaq12wsx']);
function weakPassword(pw,ctx={}){
 const p=String(pw||''),l=p.toLowerCase();
 if(COMMON_PW.has(l))return true;
 if(/^(.)\1+$/.test(p))return true;
 if(/^\d+$/.test(p)&&p.length<12)return true;
 const local=String(ctx.email||'').split('@')[0].toLowerCase();
 if(local.length>=4&&l.includes(local))return true;
 const nick=String(ctx.nickname||'').toLowerCase();
 if(nick.length>=4&&l.includes(nick))return true;
 return false;
}
const NICK_RE=/^[A-Za-z0-9_.-]{3,30}$/;
const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Express 4 nu prinde excepțiile din handlere async; le trimitem la middleware-ul de erori.
for(const m of ['get','post','put','patch','delete']){
 const orig=app[m].bind(app);
 app[m]=(route,...handlers)=>{
  if(m==='get'&&handlers.length===0)return orig(route);
  return orig(route,...handlers.map(h=>typeof h==='function'&&h.length<4?(req,res,next)=>{try{const r=h(req,res,next);if(r&&typeof r.catch==='function')r.catch(next);}catch(e){next(e);}}:h));
 };
}
app.set('trust proxy', 1);
app.param('id',(req,res,next,v)=>/^\d{1,10}$/.test(v)?next():res.status(400).json({error:'DATE_INVALIDE'}));
app.use(helmet({
 contentSecurityPolicy:{useDefaults:false,directives:{
  defaultSrc:["'self'"],scriptSrc:["'self'"],scriptSrcAttr:["'none'"],styleSrc:["'self'","'unsafe-inline'"],
  imgSrc:["'self'","data:",...(STORAGE_ON?[new URL(SUPA_URL).origin]:[])],connectSrc:["'self'"],fontSrc:["'self'","data:"],objectSrc:["'none'"],
  baseUri:["'self'"],formAction:["'self'"],frameAncestors:["'none'"]}},
 crossOriginEmbedderPolicy:false}));
if(compression)app.use(compression());
// Limită mare (6 MB) doar pe rutele care primesc poze/CSV; restul primesc maximum 256 KB.
const JSON_SMALL=express.json({limit:'256kb'}),JSON_BIG=express.json({limit:'6mb'});
const BIG_JSON_RE=/^\/api\/(listings(\/(\d+|import))?|requests(\/\d+\/offers)?|offers\/\d+|account\/store)\/?$/;
app.use((req,res,next)=>(['POST','PUT','PATCH'].includes(req.method)&&BIG_JSON_RE.test(req.path))?JSON_BIG(req,res,next):JSON_SMALL(req,res,next));
app.use(cookieParser());
// Protecție CSRF suplimentară (pe lângă sameSite=lax): cererile care modifică date și vin cu un Origin străin sunt respinse.
// Cererile fără Origin (scripturi, unele clienți vechi) trec; browserele trimit Origin la orice POST/PUT/PATCH/DELETE.
app.use((req,res,next)=>{
 if(req.method==='GET'||req.method==='HEAD'||req.method==='OPTIONS')return next();
 const o=req.headers.origin;if(!o)return next();
 try{
  const allowed=new Set([String(req.headers.host||'').toLowerCase()]);
  for(const u of [process.env.APP_URL,process.env.RENDER_EXTERNAL_URL]){try{if(u)allowed.add(new URL(u).host.toLowerCase());}catch{}}
  if(allowed.has(new URL(o).host.toLowerCase()))return next();
 }catch{}
 return res.status(403).json({error:'ORIGIN_INVALID'});
});
// Cache scurt (10 s) pentru căutările publice; se golește la orice modificare de anunțuri/conturi.
let SEO_IDX=null;
const LIST_CACHE=new Map(),LIST_CACHE_TTL=10000,LIST_CACHE_MAX=300;
app.use((req,res,next)=>{if(req.method!=='GET'&&/^\/api\/(listings|admin\/listings|admin\/users|account|orders)/.test(req.path))res.on('finish',()=>{LIST_CACHE.clear();SEO_IDX=null;});next();});
// Doar aceste fișiere (și folderul assets/) sunt publice; server.js, package.json etc. NU sunt servite.
/* ===== BOT-GUARD:START — verificare de browser, limitare cereri, blocare scrapere ===== */
const dns=require('dns').promises;
const BOT_CHECK=IS_PROD&&String(process.env.BOT_CHECK||'true').toLowerCase()!=='false';
const BOT_BITS=Math.min(20,Math.max(10,Number(process.env.BOT_DIFFICULTY)||15));
// BOT_SECRET este obligatoriu în producție (când BOT_CHECK e activ). Nu mai derivăm cheia din DATABASE_URL/ADMIN_PASSWORD.
if(BOT_CHECK&&!process.env.BOT_SECRET){console.warn('ATENȚIE: BOT_SECRET lipsește. Folosesc o cheie temporară generată la pornire (verificările anti-bot se reiau după fiecare repornire). Setează BOT_SECRET în Render (min. 32 caractere aleatoare).');}
if(BOT_CHECK&&process.env.BOT_SECRET&&String(process.env.BOT_SECRET).length<32){console.warn('ATENȚIE: BOT_SECRET este prea scurt (recomandat minimum 32 de caractere).');}
// În dezvoltare (fără BOT_CHECK) cheia e aleatoare la fiecare pornire.
const BOT_SECRET=process.env.BOT_SECRET?crypto.createHash('sha256').update('bot|'+process.env.BOT_SECRET).digest('hex'):crypto.randomBytes(32).toString('hex');
const botHmac=v=>crypto.createHmac('sha256',BOT_SECRET).update(v).digest('base64url');
const uaHash=req=>crypto.createHash('sha256').update(String(req.headers['user-agent']||'')).digest('base64url').slice(0,16);
const safeEq=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y);};
function zeroBits(buf){let n=0;for(const b of buf){if(b===0){n+=8;continue;}n+=Math.clz32(b)-24;break;}return n;}
function newChallenge(req){const p=Buffer.from(JSON.stringify({t:Date.now(),n:crypto.randomBytes(9).toString('base64url'),u:uaHash(req),b:BOT_BITS})).toString('base64url');return p+'.'+botHmac(p);}
function hasPass(req){const [exp,u,sig]=String((req.cookies&&req.cookies.bv)||'').split('.');return !!(exp&&u&&sig&&Number(exp)>Date.now()&&safeEq(u,uaHash(req))&&safeEq(sig,botHmac(exp+'.'+u)));}
const GOOD_BOT_RE=/Googlebot|bingbot|Applebot|YandexBot/i;
const GOOD_HOST_RE=/\.(googlebot\.com|google\.com|search\.msn\.com|applebot\.apple\.com|yandex\.(ru|net|com))$/i;
const SOCIAL_RE=/facebookexternalhit|Facebot|WhatsApp|TelegramBot|Twitterbot|LinkedInBot|Slackbot|Discordbot/i;
const BAD_UA_RE=/curl|wget|python|aiohttp|httpx|scrapy|go-http-client|java\/|libwww|node-fetch|undici|axios|headless|phantom|selenium|puppeteer|playwright|httrack|crawler|spider|scraper/i;
const goodBotCache=new Map(),usedChal=new Map(),apiHits=new Map(),dataHits=new Map(),botAttempts=new Map();
// Googlebot/Bingbot se acceptă doar după verificare DNS inversă (nu doar după User-Agent, care se poate falsifica).
async function verifiedBot(ip,ua){
 if(!GOOD_BOT_RE.test(ua))return false;
 const c=goodBotCache.get(ip); if(c&&c.until>Date.now())return c.ok;
 let ok=false;
 try{for(const h of await dns.reverse(ip)){if(!GOOD_HOST_RE.test(h))continue;if((await dns.lookup(h,{all:true})).some(a=>a.address.toLowerCase()===ip.toLowerCase())){ok=true;break;}}}catch{}
 if(goodBotCache.size>2000)goodBotCache.clear();
 goodBotCache.set(ip,{ok,until:Date.now()+24*3600*1000});return ok;
}
setInterval(()=>{const now=Date.now();for(const m of [apiHits,dataHits,botAttempts])for(const [k,v] of m){if(!v.length||now-v[v.length-1]>10*60*1000)m.delete(k);}for(const [k,t] of usedChal)if(t<now)usedChal.delete(k);},5*60*1000).unref();
/* ===== Persistență limitări: scriere periodică în Postgres (tabel rate_state), citire la pornire ===== */
// Se salvează doar hărțile de securitate cu volum mic (auth, recuperare, bot-check, challenge-uri folosite).
// apiHits/dataHits au fereastră de 60 s, deci nu merită persistate.
const RL_NAMES=new Map([[authAttempts,'auth'],[recoveryAttempts,'recovery'],[botAttempts,'bot'],[usedChal,'chal']]);
const RL_BY_NAME=new Map([...RL_NAMES].map(([m,n])=>[n,m]));
let rlFlushing=false;
async function flushRateState(){
 if(!pool||rlFlushing||!RL_DIRTY.size)return;
 rlFlushing=true;
 try{
  const jobs=[...RL_DIRTY];RL_DIRTY.clear();
  const now=Date.now(),up=[[],[],[],[]],del=new Map();
  for(const [m,keys] of jobs){
   const name=RL_NAMES.get(m);if(!name)continue;
   for(const k of keys){
    if(k.length>200)continue;
    const v=m.get(k);
    if(v===undefined||(Array.isArray(v)&&!v.length)){(del.get(name)||del.set(name,[]).get(name)).push(k);continue;}
    up[0].push(name);up[1].push(k);
    if(Array.isArray(v)){up[2].push(v.join(','));up[3].push(now+2*3600*1000);}
    else{up[2].push(String(v));up[3].push(Number(v)+60*1000);}
   }
  }
  for(let i=0;i<up[0].length;i+=500){
   await pool.query('INSERT INTO rate_state(map,key,data,exp) SELECT * FROM unnest($1::text[],$2::text[],$3::text[],$4::bigint[]) ON CONFLICT (map,key) DO UPDATE SET data=EXCLUDED.data,exp=EXCLUDED.exp',up.map(a=>a.slice(i,i+500)));
  }
  for(const [name,keys] of del)await pool.query('DELETE FROM rate_state WHERE map=$1 AND key=ANY($2::text[])',[name,keys]);
 }catch(e){console.error('rate_state flush',e.message);}
 finally{rlFlushing=false;}
}
async function loadRateState(){
 if(!pool)return;
 try{
  const now=Date.now();
  await pool.query('DELETE FROM rate_state WHERE exp<$1',[now]);
  const r=await pool.query('SELECT map,key,data FROM rate_state');
  let n=0;
  for(const row of r.rows){
   const m=RL_BY_NAME.get(row.map);if(!m)continue;
   if(row.map==='chal'){m.set(row.key,Number(row.data));n++;continue;}
   const ts=row.data.split(',').map(Number).filter(t=>t>now-3600*1000&&t<=now);
   if(ts.length){m.set(row.key,ts);n++;}
  }
  console.log('Limitări restaurate din baza de date:',n);
 }catch(e){console.error('rate_state load',e.message);}
}
const BOT_JS=`(function(){var el=document.querySelector('script[data-c]');if(!el)return;var chal=el.getAttribute('data-c'),bits=Number(el.getAttribute('data-b'))||15,msg=document.getElementById('bc-msg'),enc=new TextEncoder();
function zb(h){var n=0;for(var i=0;i<h.length;i++){if(h[i]===0){n+=8;continue;}n+=Math.clz32(h[i])-24;break;}return n;}
function fail(t){msg.textContent=t;msg.className='bc-err';}
(async function(){try{if(!window.crypto||!crypto.subtle)throw new Error('nocrypto');var i=0;for(;;){var h=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(chal+':'+i)));if(zb(h)>=bits)break;i++;}
var r=await fetch('/api/botcheck',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({chal:chal,counter:i})});
if(r.ok){location.reload();return;}fail(r.status===429?'Prea multe încercări. Așteaptă câteva minute și reîncarcă pagina.':'Verificarea nu a reușit. Reîncarcă pagina.');}
catch(e){fail('Browserul nu a putut face verificarea. Folosește un browser actual, cu HTTPS și JavaScript activ.');}})();})();`;
function challengePage(req){
 const c=newChallenge(req);
 return `<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Verificăm browserul… | AutoParts</title><style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#0e0f12;color:#e9d3a8;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;text-align:center}.bc{padding:24px;max-width:420px}.bc h1{font-size:22px;margin:18px 0 8px;font-weight:650}.bc p{margin:0;color:#a89c86;font-size:15px;line-height:1.5}.bc .bc-err{color:#f0b4b4}.bc-spin{width:42px;height:42px;margin:0 auto;border-radius:50%;border:3px solid rgba(212,180,131,.25);border-top-color:#d4b483;animation:s .8s linear infinite}@keyframes s{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.bc-spin{animation-duration:3s}}</style></head><body><main class="bc"><div class="bc-spin" aria-hidden="true"></div><h1>Verificăm browserul…</h1><p id="bc-msg" role="status">Durează câteva secunde. Pagina se reîncarcă automat.</p><noscript><p class="bc-err">Activează JavaScript pentru a continua.</p></noscript></main><script src="/bot-check.js" data-c="${c}" data-b="${BOT_BITS}" defer></script></body></html>`;
}
app.get('/bot-check.js',(req,res)=>{res.set('Cache-Control','public, max-age=3600').type('application/javascript').send(BOT_JS);});
app.post('/api/botcheck',(req,res)=>{
 if(!throttle(botAttempts,clientIp(req),30,10*60*1000))return res.status(429).json({error:'PREA_MULTE_CERERI'});
 const {chal,counter}=req.body||{};
 if(typeof chal!=='string'||chal.length>400||!Number.isInteger(counter)||counter<0||counter>1e9)return res.status(400).json({error:'DATE_INVALIDE'});
 const [p,sig]=chal.split('.');
 if(!p||!sig||!safeEq(sig,botHmac(p)))return res.status(400).json({error:'BOT_CHECK'});
 let d;try{d=JSON.parse(Buffer.from(p,'base64url').toString());}catch{return res.status(400).json({error:'BOT_CHECK'});}
 const age=Date.now()-Number(d.t);
 if(!(age>=0&&age<5*60*1000)||d.u!==uaHash(req)||usedChal.has(d.n))return res.status(400).json({error:'BOT_CHECK'});
 if(zeroBits(crypto.createHash('sha256').update(chal+':'+counter).digest())<Number(d.b))return res.status(400).json({error:'BOT_CHECK'});
 usedChal.set(d.n,Date.now()+10*60*1000);markDirty(usedChal,d.n);
 const exp=Date.now()+12*3600*1000,u=uaHash(req);
 res.cookie('bv',exp+'.'+u+'.'+botHmac(exp+'.'+u),safeCookieOptions(12*3600*1000));
 res.json({ok:true});
});
const BOT_FREE=new Set(['/api/health','/robots.txt','/sitemap.xml','/bot-check.js','/api/botcheck','/style.css','/script.js','/favicon.ico']);
app.use(async(req,res,next)=>{
 try{
  const p=req.path,ip=clientIp(req),ua=String(req.headers['user-agent']||'');
  if(p.startsWith('/assets/')||BOT_FREE.has(p))return next();
  // Limitare de cereri pe IP (activă și când verificarea de browser e oprită).
  if(p.startsWith('/api/')){
   const tooMany=()=>res.status(429).set('Retry-After','60').json({error:'PREA_MULTE_CERERI'});
   if(!throttle(apiHits,ip,Number(process.env.API_RATE_PER_MIN)||600,60000))return tooMany();
   if(req.method==='GET'&&/^\/api\/(listings|requests|sellers|offers)/.test(p)&&!throttle(dataHits,ip,Number(process.env.DATA_RATE_PER_MIN)||200,60000))return tooMany();
  }
  if(!BOT_CHECK)return next();
  if(req.method==='GET'){
   if(SOCIAL_RE.test(ua)&&/^\/piese(-auto)?\//.test(p))return next();   // previzualizări WhatsApp/Facebook pentru linkurile de anunț
   if(await verifiedBot(ip,ua))return next();                     // Google/Bing/Apple/Yandex verificați prin DNS
  }
  if(!ua||BAD_UA_RE.test(ua))return res.status(403).type('text/plain').send('Acces refuzat.');
  if(hasPass(req))return next();
  if(req.method==='GET'&&String(req.headers.accept||'').includes('text/html'))return res.status(403).set({'Cache-Control':'no-store','X-Robots-Tag':'noindex'}).type('html').send(challengePage(req));
  return res.status(403).set('Cache-Control','no-store').json({error:'BOT_CHECK'});
 }catch(e){next(e);}
});
/* ===== BOT-GUARD:END ===== */
for(const f of PUBLIC_FILES) app.get('/'+f,(req,res)=>{res.set('Cache-Control','no-cache');res.sendFile(path.join(__dirname,f));});
app.use('/assets',express.static(ASSETS_DIR,{index:false,dotfiles:'ignore',maxAge:'7d'}));

const VEHICLE_SCHEMA=[
 "CREATE TABLE IF NOT EXISTS vehicles (id SERIAL PRIMARY KEY, make TEXT NOT NULL, model TEXT NOT NULL, make_norm TEXT NOT NULL, model_norm TEXT NOT NULL, generation TEXT, year_from INTEGER, year_to INTEGER, kind TEXT NOT NULL DEFAULT 'car', engine TEXT, fuel TEXT, source TEXT NOT NULL DEFAULT 'manual', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())",
 'CREATE UNIQUE INDEX IF NOT EXISTS vehicles_make_model_uq ON vehicles(make_norm,model_norm)',
 'CREATE INDEX IF NOT EXISTS vehicles_make_idx ON vehicles(make_norm)'
];
const schema = `
CREATE TABLE IF NOT EXISTS users (
 id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, phone TEXT, show_phone BOOLEAN NOT NULL DEFAULT FALSE,
 password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', status TEXT NOT NULL DEFAULT 'active',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS listings (
 id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
 type TEXT NOT NULL CHECK(type IN ('piesa','masina','dezmembrari')), title TEXT NOT NULL,
 price NUMERIC(12,2) DEFAULT 0, condition TEXT, make TEXT, model TEXT, generation TEXT, year TEXT,
 engine TEXT, fuel TEXT, vehicle_id TEXT, seller_type TEXT, quantity INTEGER DEFAULT 1, negotiable BOOLEAN DEFAULT FALSE,
 county TEXT, category TEXT, oem TEXT, delivery BOOLEAN DEFAULT FALSE, description TEXT DEFAULT '',
 status TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS favorites (
 user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
 PRIMARY KEY(user_id, listing_id)
);
CREATE TABLE IF NOT EXISTS part_requests (
 id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
 title TEXT NOT NULL, make TEXT, model TEXT, year TEXT, description TEXT, status TEXT NOT NULL DEFAULT 'open',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS reports (
 id SERIAL PRIMARY KEY, listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE, reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL, reason TEXT NOT NULL, details TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'open', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS admin_activity (
 id SERIAL PRIMARY KEY, admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL, action TEXT NOT NULL, target_type TEXT, target_id INTEGER, details TEXT DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS site_events (
 id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, kind TEXT NOT NULL, target_type TEXT, target_id INTEGER, details TEXT DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS site_events_created_idx ON site_events(created_at DESC);
CREATE INDEX IF NOT EXISTS site_events_kind_idx ON site_events(kind,created_at DESC);
CREATE TABLE IF NOT EXISTS sessions (
 id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, token_hash TEXT UNIQUE NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 expires_at TIMESTAMPTZ NOT NULL, user_agent TEXT DEFAULT '', ip_hash TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS password_resets (
 id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, token_hash TEXT UNIQUE NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS email_verifications (
 id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, token_hash TEXT UNIQUE NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL, verified_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS user_phones (
 id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, phone TEXT NOT NULL,
 is_whatsapp BOOLEAN NOT NULL DEFAULT FALSE, verified BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(user_id, phone)
);
CREATE TABLE IF NOT EXISTS email_change_requests (
 id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, new_email TEXT NOT NULL,
 token_hash TEXT UNIQUE NOT NULL, expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ
);`;

async function dbReady(){
 if(!pool)return false;
 await pool.query(schema);
 const migrations=[
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS generation TEXT',
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS engine TEXT',
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS fuel TEXT',
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS vehicle_id TEXT',
  "ALTER TABLE listings ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}'",
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS seller_type TEXT',
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1',
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS negotiable BOOLEAN DEFAULT FALSE',
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS subcategory TEXT',
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS km INTEGER',
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS vin TEXT',
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS parts_avail TEXT',
  "UPDATE listings SET category='Filtre auto' WHERE category='Filtre'",
  "UPDATE listings SET category='Faruri stopuri lumini' WHERE category='Iluminare'",
  "UPDATE listings SET category='Electrică & Electronică Auto' WHERE category='Electrică'",
  "UPDATE listings SET category='Accesorii roți' WHERE category='Roți'",
  "UPDATE listings SET category='Diverse' WHERE category='Altele'",
  "UPDATE listings SET category='Interioare auto' WHERE category='Interior'",
  "UPDATE listings SET category='Piese motoare' WHERE category='Motor'",
  "UPDATE listings SET category='Pompe și injectoare' WHERE category='Alimentare combustibil'",
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS show_phone BOOLEAN NOT NULL DEFAULT FALSE',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ',
  'CREATE UNIQUE INDEX IF NOT EXISTS users_nickname_unique_idx ON users(nickname) WHERE nickname IS NOT NULL',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS ship_county TEXT',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS ship_city TEXT',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS ship_details TEXT',
  'ALTER TABLE part_requests ADD COLUMN IF NOT EXISTS variant TEXT',
  'ALTER TABLE part_requests ADD COLUMN IF NOT EXISTS engine TEXT',
  'ALTER TABLE part_requests ADD COLUMN IF NOT EXISTS vin TEXT',
  'ALTER TABLE part_requests ADD COLUMN IF NOT EXISTS kind TEXT',
  'ALTER TABLE part_requests ADD COLUMN IF NOT EXISTS county TEXT',
  'ALTER TABLE part_requests ADD COLUMN IF NOT EXISTS city TEXT',
  'ALTER TABLE part_requests ADD COLUMN IF NOT EXISTS ship_address TEXT',
  "ALTER TABLE part_requests ADD COLUMN IF NOT EXISTS extra_parts TEXT DEFAULT '[]'",
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS bill_company TEXT',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS bill_cui TEXT',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS bill_regcom TEXT',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS bill_address TEXT',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS bill_bank TEXT',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS bill_iban TEXT',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS store_name TEXT',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS store_site TEXT',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS store_logo TEXT',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS bill_type TEXT',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS bill_name TEXT',
  'ALTER TABLE orders ADD COLUMN IF NOT EXISTS recipient_name TEXT',
  'ALTER TABLE orders ADD COLUMN IF NOT EXISTS recipient_phone TEXT',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS mail_msg BOOLEAN NOT NULL DEFAULT TRUE',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS mail_offer BOOLEAN NOT NULL DEFAULT TRUE',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS mail_order BOOLEAN NOT NULL DEFAULT TRUE',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS vacation BOOLEAN NOT NULL DEFAULT FALSE',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS vacation_until DATE',
  'CREATE TABLE IF NOT EXISTS user_blocks (blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(blocker_id,blocked_id))',
  'CREATE INDEX IF NOT EXISTS user_blocks_blocked_idx ON user_blocks(blocked_id)',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS mail_alert BOOLEAN NOT NULL DEFAULT TRUE',
  'CREATE TABLE IF NOT EXISTS saved_searches (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, label TEXT NOT NULL, qs TEXT NOT NULL, alerts BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_alert_at TIMESTAMPTZ, UNIQUE(user_id,qs))',
  'CREATE INDEX IF NOT EXISTS saved_searches_alerts_idx ON saved_searches(alerts) WHERE alerts',
  'CREATE TABLE IF NOT EXISTS saved_search_hits (search_id INTEGER NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE, listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE, PRIMARY KEY(search_id,listing_id))',
  "CREATE TABLE IF NOT EXISTS offers (id SERIAL PRIMARY KEY, request_id INTEGER NOT NULL REFERENCES part_requests(id) ON DELETE CASCADE, seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, price NUMERIC(12,2) NOT NULL, message TEXT, status TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())",
  "CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL, request_id INTEGER REFERENCES part_requests(id) ON DELETE SET NULL, buyer_id INTEGER REFERENCES users(id) ON DELETE SET NULL, seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL, title TEXT, price NUMERIC(12,2) NOT NULL, status TEXT NOT NULL DEFAULT 'new', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())",
  'ALTER TABLE orders ADD COLUMN IF NOT EXISTS listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL',
  'ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1',
  'ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_county TEXT',
  'ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_city TEXT',
  'ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_address TEXT',
  'ALTER TABLE orders ADD COLUMN IF NOT EXISTS note TEXT',
  "CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL, is_read BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())",
  'CREATE TABLE IF NOT EXISTS notifications (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, text TEXT NOT NULL, is_read BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())',
  'CREATE TABLE IF NOT EXISTS user_phones (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, phone TEXT NOT NULL, is_whatsapp BOOLEAN NOT NULL DEFAULT FALSE, verified BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id, phone))',
  'CREATE TABLE IF NOT EXISTS email_change_requests (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, new_email TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL, expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ)'
 ];
 migrations.push(
  'CREATE TABLE IF NOT EXISTS login_attempts (key TEXT NOT NULL, at TIMESTAMPTZ NOT NULL DEFAULT NOW())',
  'CREATE INDEX IF NOT EXISTS login_attempts_key_idx ON login_attempts(key,at)',
  'ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_reserved BOOLEAN NOT NULL DEFAULT FALSE',
  'ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_reason TEXT',
  'ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_seen_status TEXT',
  'ALTER TABLE orders ADD COLUMN IF NOT EXISTS awb TEXT',
  'ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_note TEXT',
  'CREATE TABLE IF NOT EXISTS rate_state (map TEXT NOT NULL, key TEXT NOT NULL, data TEXT NOT NULL, exp BIGINT NOT NULL, PRIMARY KEY(map,key))',
  'ALTER TABLE notifications ADD COLUMN IF NOT EXISTS kind TEXT',
  'CREATE TABLE IF NOT EXISTS seller_ratings (id SERIAL PRIMARY KEY, order_id INTEGER UNIQUE REFERENCES orders(id) ON DELETE CASCADE, seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, stars SMALLINT NOT NULL CHECK(stars BETWEEN 1 AND 5), comment TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ)',
  'CREATE INDEX IF NOT EXISTS seller_ratings_seller_idx ON seller_ratings(seller_id)',
  'CREATE TABLE IF NOT EXISTS buyer_ratings (id SERIAL PRIMARY KEY, order_id INTEGER UNIQUE REFERENCES orders(id) ON DELETE CASCADE, seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, stars SMALLINT NOT NULL CHECK(stars BETWEEN 1 AND 5), comment TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ)',
  'CREATE INDEX IF NOT EXISTS buyer_ratings_buyer_idx ON buyer_ratings(buyer_id)',
  'CREATE INDEX IF NOT EXISTS listings_status_created_idx ON listings(status,created_at DESC)',
  'CREATE INDEX IF NOT EXISTS listings_type_idx ON listings(type)',
  'CREATE INDEX IF NOT EXISTS listings_user_idx ON listings(user_id)',
  'CREATE INDEX IF NOT EXISTS listings_make_model_idx ON listings(make,model)',
  'CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id)',
  'CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at)',
  'CREATE INDEX IF NOT EXISTS part_requests_status_idx ON part_requests(status,created_at DESC)',
  ...VEHICLE_SCHEMA,
  'ALTER TABLE messages ADD COLUMN IF NOT EXISTS listing_id INTEGER',
  'ALTER TABLE messages ADD COLUMN IF NOT EXISTS ref_title TEXT',
  'ALTER TABLE messages ADD COLUMN IF NOT EXISTS arch_r BOOLEAN NOT NULL DEFAULT FALSE',
  'ALTER TABLE messages ADD COLUMN IF NOT EXISTS arch_s BOOLEAN NOT NULL DEFAULT FALSE',
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS phone_clicks INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS added_at TIMESTAMPTZ',
  'UPDATE listings SET added_at=created_at WHERE added_at IS NULL',
  'ALTER TABLE listings ALTER COLUMN added_at SET DEFAULT NOW()',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS promoted_until TIMESTAMPTZ',
  'CREATE TABLE IF NOT EXISTS credit_tx (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, amount INTEGER NOT NULL, balance_after INTEGER NOT NULL, kind TEXT NOT NULL, ref_id INTEGER, note TEXT, amount_lei NUMERIC(12,2), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())',
  'CREATE INDEX IF NOT EXISTS credit_tx_user_idx ON credit_tx(user_id,created_at DESC)',
  'CREATE INDEX IF NOT EXISTS listings_user_status_idx ON listings(user_id,status)',
  'ALTER TABLE offers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ',
  "ALTER TABLE part_requests ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}'",
  "ALTER TABLE offers ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}'",
  'CREATE TABLE IF NOT EXISTS listing_stats (listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE, day DATE NOT NULL, views INTEGER NOT NULL DEFAULT 0, phone_clicks INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(listing_id,day))',
  'CREATE INDEX IF NOT EXISTS offers_request_idx ON offers(request_id)',
  'CREATE INDEX IF NOT EXISTS offers_seller_idx ON offers(seller_id,created_at DESC)',
  'CREATE INDEX IF NOT EXISTS messages_recipient_idx ON messages(recipient_id,created_at DESC)',
  'CREATE INDEX IF NOT EXISTS messages_sender_idx ON messages(sender_id,created_at DESC)'
 );
 for(const q of migrations){ try{ await pool.query(q); }catch(e){ console.error('MIGRARE EȘUATĂ:',String(q).slice(0,160),'->',e.message); } }
 /* coloanele din messages sunt necesare pentru Primite/Trimise/Arhivate: le asigurăm separat, indiferent de alte migrări */
 for(const q of ['ALTER TABLE messages ADD COLUMN IF NOT EXISTS listing_id INTEGER','ALTER TABLE messages ADD COLUMN IF NOT EXISTS ref_title TEXT','ALTER TABLE messages ADD COLUMN IF NOT EXISTS arch_r BOOLEAN NOT NULL DEFAULT FALSE','ALTER TABLE messages ADD COLUMN IF NOT EXISTS arch_s BOOLEAN NOT NULL DEFAULT FALSE','ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT']){ try{ await pool.query(q); }catch(e){ console.error('MIGRARE messages EȘUATĂ:',q,'->',e.message); } }
 const adminEmail=process.env.ADMIN_EMAIL, adminPass=process.env.ADMIN_PASSWORD;
 await pool.query('DELETE FROM sessions WHERE expires_at < NOW()');
 await pool.query("DELETE FROM login_attempts WHERE at<NOW()-INTERVAL '1 hour'");
 if(adminPass&&(adminPass.length<12||weakPassword(adminPass,{email:adminEmail})))console.warn('ATENȚIE: ADMIN_PASSWORD este slabă. Folosește minimum 12 caractere și schimb-o după prima autentificare.');
 if(adminEmail&&adminPass){const r=await pool.query('SELECT id FROM users WHERE email=$1',[adminEmail.toLowerCase()]);if(!r.rowCount&&IS_PROD&&(adminPass.length<12||weakPassword(adminPass,{email:adminEmail}))){console.error('ADMIN_PASSWORD este prea slabă (minimum 12 caractere, fără parole comune): contul de administrator NU a fost creat. Setează o parolă puternică în Render și repornește.');}else if(!r.rowCount){const hash=await bcrypt.hash(adminPass,12);await pool.query("INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'admin')",['Administrator',adminEmail.toLowerCase(),hash]);}else{await pool.query("UPDATE users SET role='admin' WHERE email=$1 AND role<>'admin'",[adminEmail.toLowerCase()]);}}
 await pool.query("INSERT INTO user_phones(user_id,phone,verified) SELECT id,phone,email_verified FROM users WHERE phone IS NOT NULL AND phone<>'' AND NOT EXISTS (SELECT 1 FROM user_phones p WHERE p.user_id=users.id AND p.phone=users.phone)");
 return true;
}
const DUMMY_HASH=bcrypt.hashSync('autopiese-dummy-password',12);
async function loginBlocked(k1,k2){
 try{const r=await pool.query("SELECT COUNT(*) FILTER (WHERE key=$1)::int a, COUNT(*) FILTER (WHERE key=$2)::int b FROM login_attempts WHERE key IN ($1,$2) AND at>NOW()-INTERVAL '15 minutes'",[k1,k2]);return r.rows[0].a>=8||r.rows[0].b>=40;}catch(e){console.error('login_attempts',e.message);return false;}
}
async function loginFailed(k1,k2){try{await pool.query('INSERT INTO login_attempts(key) VALUES($1),($2)',[k1,k2]);}catch(e){console.error('login_attempts',e.message);}}
function hashToken(token){return crypto.createHash('sha256').update(token).digest('hex');}
function safeCookieOptions(maxAge){return {httpOnly:true,sameSite:'lax',secure:IS_PROD,path:'/',maxAge};}
async function createSession(user,req,remember=true){
 const token=crypto.randomBytes(32).toString('base64url');
 const days=remember?30:1;
 const expires=new Date(Date.now()+days*86400000);
 const ip=String(req.ip||'').trim();
 const ipHash=ip?hashToken(ip):'';
 await pool.query('INSERT INTO sessions(user_id,token_hash,expires_at,user_agent,ip_hash) VALUES($1,$2,$3,$4,$5)',[user.id,hashToken(token),expires, String(req.get('user-agent')||'').slice(0,500),ipHash]);
 return {token,maxAge:days*86400000};
}
async function auth(req,res,next){
 try{
  const token=req.cookies.session;
  if(!token)return res.status(401).json({error:'AUTH_REQUIRED'});
  const r=await pool.query('SELECT s.id session_id,s.expires_at,s.last_seen_at,u.id,u.name,u.nickname,u.email,u.phone,u.show_phone,u.role,u.status,u.email_verified FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW()',[hashToken(token)]);
  if(!r.rowCount)return res.status(401).json({error:'AUTH_REQUIRED'});
  const u=r.rows[0];
  if(u.status!=='active')return res.status(403).json({error:'ACCOUNT_BLOCKED'});
  req.sessionId=u.session_id; req.user=u;
  if(!u.last_seen_at||Date.now()-new Date(u.last_seen_at).getTime()>60000)pool.query('UPDATE sessions SET last_seen_at=NOW() WHERE id=$1',[u.session_id]).catch(e=>console.error('last_seen',e.message));
  next();
 }catch(e){console.error(e);return res.status(401).json({error:'AUTH_REQUIRED'});}
}
// Jurnal de evenimente de pe site (vizibil în Admin → Evenimente). Nu blochează și nu strică niciodată cererea.
function logEvent(uid,kind,type,id,details){if(!pool)return;const tid=id==null?null:Number(id);pool.query('INSERT INTO site_events(user_id,kind,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[uid||null,String(kind).slice(0,40),type||null,Number.isInteger(tid)?tid:null,String(details||'').slice(0,300)]).catch(e=>console.error('site_events',e.message));}
function admin(req,res,next){if(req.user.role!=='admin')return res.status(403).json({error:'ADMIN_ONLY'});next();}
function needVerified(req,res,next){if(REQUIRE_VERIFIED&&!req.user.email_verified&&req.user.role!=='admin')return res.status(403).json({error:'EMAIL_NOT_VERIFIED'});next();}
function requireDb(req,res,next){if(!pool)return res.status(503).json({error:'DATABASE_NOT_CONFIGURED',message:'Configurează DATABASE_URL în Render.'});next();}
const ah=fn=>(req,res)=>Promise.resolve(fn(req,res)).catch(e=>{console.error(e);if(!res.headersSent)res.status(500).json({error:'EROARE_SERVER'});});
const clip=(v,n)=>v==null||v===''?null:String(v).trim().slice(0,n);
/* ---------- statistici anunțuri (vizualizări / apăsări pe telefon) ----------
   STATS_RETENTION_DAYS (implicit 15) = câte zile apar în „Statistici anunțuri” (grafic pe zile).
   Contoarele zilnice se păstrează STATS_KEEP_DAYS zile (implicit 400), pentru tabelul „Statistici cont” pe 14 zile / 6 luni / 12 luni.
   Totalurile pe viață rămân în listings.views și listings.phone_clicks. */
const STATS_DAYS=Math.min(90,Math.max(1,Math.floor(Number(process.env.STATS_RETENTION_DAYS))||15));
const STATS_KEEP_DAYS=Math.min(800,Math.max(STATS_DAYS,Math.floor(Number(process.env.STATS_KEEP_DAYS))||400));
const TODAY_SQL="(NOW() AT TIME ZONE 'Europe/Bucharest')::date";
/* ---------- mod vacanță / utilizatori blocați ----------
   Vacanța e activă cât timp users.vacation=TRUE și (vacation_until e NULL sau >= azi). Fără dată = până o oprește utilizatorul;
   cu dată = reapar automat în ziua de după (nu e nevoie de job periodic). */
const VAC_SQL=a=>`(${a}.vacation AND (${a}.vacation_until IS NULL OR ${a}.vacation_until>=${TODAY_SQL}))`;
const NOT_VAC_LISTING=`NOT EXISTS (SELECT 1 FROM users vu WHERE vu.id=l.user_id AND ${VAC_SQL('vu')})`;
const BLK_IN=" AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE b.blocker_id=$1 AND b.blocked_id=m.sender_id)";
async function blockState(me,other){
 if(!me||!other)return {byMe:false,byThem:false};
 const r=await pool.query('SELECT COUNT(*) FILTER (WHERE blocker_id=$1)::int by_me, COUNT(*) FILTER (WHERE blocker_id=$2)::int by_them FROM user_blocks WHERE (blocker_id=$1 AND blocked_id=$2) OR (blocker_id=$2 AND blocked_id=$1)',[me,other]);
 return {byMe:r.rows[0].by_me>0,byThem:r.rows[0].by_them>0};
}
function bumpStat(listingId,col){
 if(!pool||!['views','phone_clicks'].includes(col))return;
 pool.query(`INSERT INTO listing_stats(listing_id,day,${col}) VALUES($1,${TODAY_SQL},1) ON CONFLICT(listing_id,day) DO UPDATE SET ${col}=listing_stats.${col}+1`,[listingId]).catch(e=>console.error('stats',e.message));
}
function purgeStats(){return pool?pool.query(`DELETE FROM listing_stats WHERE day<=${TODAY_SQL}-$1::int`,[STATS_KEEP_DAYS]).catch(e=>console.error('stats purge',e.message)):null;}
async function optUserId(req){
 try{
  const t=req.cookies&&req.cookies.session; if(!t)return null;
  const r=await pool.query('SELECT s.user_id FROM sessions s WHERE s.token_hash=$1 AND s.expires_at>NOW()',[hashToken(t)]);
  return r.rowCount?r.rows[0].user_id:null;
 }catch{return null;}
}
function norm(s=''){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function slugify(s=''){return norm(s).replace(/\s+/g,'-').slice(0,120);}
function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

let catalogLoading=null;
// Catalogul de mărci/modele este local (vehicles-catalog.js): nu depinde de internet sau de servicii externe.
function getCatalog(){
 if(!catalogCache){
  catalogCache=CURATED_VEHICLES.map(v=>({
   id:`curated/${slugify(v.make)}/${slugify(v.model)}`,
   name:v.model, make:v.make, model:v.model, generation:'', years:[],
   year_from:v.year_from, year_to:v.year_to, kind:v.kind||'car', engine:'', fuel:'', raw:{}
  }));
  catalogLoadedAt=Date.now();
 }
 return Promise.resolve(catalogCache);
}
function resolveText(catalog,q){
 const ts=norm(q).split(/\s+/).filter(x=>x.length>1); if(!ts.length)return null;
 const scored=catalog.map(v=>{const hay=norm([v.make,v.model,v.generation,v.name,v.engine].join(' '));const hits=ts.filter(t=>hay.includes(t)).length;const mt=norm(v.model).split(' ');const bonus=ts.filter(t=>mt.includes(t)).length*0.01;return {v,score:hits/ts.length+bonus};}).filter(x=>x.score>=0.5).sort((a,b)=>b.score-a.score);
 if(!scored.length)return null; const x=scored[0].v; return {...x,confidence:Math.min(1,scored[0].score)};
}

/* ---------- baza de date vehicule (Postgres) ---------- */
// Cheie comparabilă: fără diacritice, majuscule, spații sau cratime ("Land Rover" = "LandRover").
const vkey=s=>norm(s).replace(/\s+/g,'');
const VEHICLE_KINDS=['car','van','motorcycle','moped','truck','bus'];
const vstr=(x,n)=>typeof x==='string'&&x.trim()?x.trim().slice(0,n):null;
function yearRange(v){
 const nums=[];
 const scan=x=>{
  if(x==null)return;
  if(typeof x==='number'){nums.push(x);return;}
  if(typeof x==='string'){for(const m of x.matchAll(/(?:19|20)\d{2}/g))nums.push(Number(m[0]));return;}
  if(Array.isArray(x)){x.forEach(scan);return;}
  if(typeof x==='object')Object.values(x).forEach(scan);
 };
 scan(v.years);
 const r=v.raw&&typeof v.raw==='object'?v.raw:{};
 for(const k of ['year_from','year_start','start_year','yearFrom','production_start','year_end','end_year','year_to','yearTo','production_end'])scan(r[k]);
 const max=new Date().getFullYear()+2;
 const ok=nums.filter(n=>Number.isInteger(n)&&n>=1900&&n<=max);
 return ok.length?{from:Math.min(...ok),to:Math.max(...ok)}:{from:null,to:null};
}
let vehicleRows=null, vehicleRowsAt=0, vehicleSyncing=null;
function invalidateVehicles(){vehicleRows=null;vehicleRowsAt=0;}
// Sursa de adevăr pentru selecturile marcă/model: tabelul `vehicles`. Dacă baza nu e disponibilă sau e goală,
// se folosește catalogul în memorie (VehiclesDB / lista de rezervă), ca site-ul să nu rămână fără mărci.
async function getVehicleRows(){
 if(pool){
  if(vehicleRows&&Date.now()-vehicleRowsAt<5*60*1000)return vehicleRows;
  try{
   const r=await pool.query('SELECT id,make,model,generation,year_from,year_to,kind,engine,fuel,source FROM vehicles WHERE source IN (\'curated\',\'manual\') ORDER BY make,model');
   if(r.rowCount){vehicleRows=r.rows.map(x=>({...x,name:x.model}));vehicleRowsAt=Date.now();return vehicleRows;}
  }catch(e){console.error('vehicles read:',e.message);}
 }
 return getCatalog();
}
async function syncVehicleDb({reset=false}={}){
 if(!pool)return {ok:false,error:'DATABASE_NOT_CONFIGURED'};
 if(vehicleSyncing)return vehicleSyncing;
 vehicleSyncing=(async()=>{
  const cat=await getCatalog();
  // reset: șterge tot ce nu e adăugat manual (liste vechi/greșite) și reface lista standard.
  if(reset)await pool.query("DELETE FROM vehicles WHERE source<>'manual'");
  const map=new Map();
  for(const v of cat){
   const mk=vkey(v.make),mo=vkey(v.model); if(!mk||!mo)continue;
   const k=mk+'|'+mo; if(map.has(k))continue;
   map.set(k,[String(v.make).slice(0,60),String(v.model).slice(0,80),mk,mo,null,v.year_from||null,v.year_to||null,VEHICLE_KINDS.includes(v.kind)?v.kind:'car',null,null,'curated']);
  }
  const rows=[...map.values()];
  const conflict="ON CONFLICT (make_norm,model_norm) DO UPDATE SET make=EXCLUDED.make,model=EXCLUDED.model,year_from=EXCLUDED.year_from,year_to=EXCLUDED.year_to,kind=EXCLUDED.kind,source=EXCLUDED.source,updated_at=NOW() WHERE vehicles.source<>'manual'";
  for(let i=0;i<rows.length;i+=500){
   const ch=rows.slice(i,i+500), cols=Array.from({length:11},(_,c)=>ch.map(r=>r[c]));
   await pool.query(`INSERT INTO vehicles(make,model,make_norm,model_norm,generation,year_from,year_to,kind,engine,fuel,source) SELECT * FROM unnest($1::text[],$2::text[],$3::text[],$4::text[],$5::text[],$6::int[],$7::int[],$8::text[],$9::text[],$10::text[],$11::text[]) WHERE true ${conflict}`,cols);
  }
  invalidateVehicles();
  const total=(await pool.query('SELECT COUNT(*)::int n FROM vehicles')).rows[0].n;
  return {ok:true,source:'curated',processed:rows.length,total,fullCatalog:true};
 })().finally(()=>{vehicleSyncing=null;});
 return vehicleSyncing;
}
async function ensureVehicleDb(){
 if(!pool)return;
 try{
  const cat=await getCatalog();
  const r=(await pool.query("SELECT COUNT(*) FILTER (WHERE source='curated')::int AS nc, COUNT(*) FILTER (WHERE source NOT IN ('curated','manual'))::int AS nold FROM vehicles")).rows[0];
  // Listele vechi (VehiclesDB / rezervă) sunt înlocuite o singură dată cu lista standard.
  if(r.nold>0||r.nc<cat.length*0.9){const out=await syncVehicleDb({reset:true});console.log('Vehicle DB sync:',JSON.stringify(out));}
 }catch(e){console.error('Vehicle DB sync failed:',e.message);}
}

app.get('/api/health',(req,res)=>res.json({ok:true,database:!!pool,catalog:'local',catalogLoaded:Array.isArray(vehicleRows||catalogCache),catalogCount:(vehicleRows||catalogCache||[]).length,catalogSource:vehicleRows?'database':'local'}));
app.get('/api/catalog/makes',async(req,res)=>{
 const c=await getVehicleRows(); const seen=new Map();
 for(const x of c){const k=vkey(x.make);if(k&&!seen.has(k))seen.set(k,x.make);}
 const last=x=>/^alt[aă] marc[aă]$/i.test(x)?1:0;
 const makes=[...seen.values()].sort((a,b)=>last(a)-last(b)||a.localeCompare(b,'ro',{numeric:true}));
 res.set('Cache-Control','public, max-age=300');res.json({makes:makes.map(name=>({name})),count:makes.length,source:'local'});
});
app.get('/api/catalog/models',async(req,res)=>{
 const mk=vkey(req.query.make); const c=await getVehicleRows(); const seen=new Map();
 for(const x of c){if(vkey(x.make)!==mk)continue;const k=vkey(x.model);if(k&&!seen.has(k))seen.set(k,x);}
 const lastM=x=>/^alt model$/i.test(x)?1:0;
 const models=[...seen.values()].sort((a,b)=>lastM(a.model)-lastM(b.model)||String(a.model).localeCompare(String(b.model),'ro',{numeric:true}));
 res.set('Cache-Control','public, max-age=300');
 res.json({models:models.map(x=>({name:x.model,year_from:x.year_from||null,year_to:x.year_to||null,generation:x.generation||null,engine:x.engine||null,fuel:x.fuel||null,kind:x.kind||'car'})),count:models.length,source:'local'});
});
// Anii de fabricație posibili pentru un model (pentru sugestii în câmpul „An”).
app.get('/api/catalog/years',async(req,res)=>{
 const mk=vkey(req.query.make),mo=vkey(req.query.model); if(!mk||!mo)return res.json({years:[]});
 const c=await getVehicleRows(); const x=c.find(v=>vkey(v.make)===mk&&vkey(v.model)===mo);
 const cy=new Date().getFullYear(); const from=x&&x.year_from?Number(x.year_from):null; let to=x&&x.year_to?Number(x.year_to):null;
 if(!from)return res.json({years:[]});
 if(!to||to<from)to=cy; to=Math.min(to,cy+1);
 const years=[]; for(let y=to;y>=from;y--)years.push(y);
 res.set('Cache-Control','public, max-age=300');res.json({years,year_from:from,year_to:to});
});
app.get('/api/catalog/resolve',async(req,res)=>{const q=String(req.query.q||'').trim();if(!q)return res.json({match:null});const c=await getVehicleRows();const match=resolveText(c,q);res.json({match});});

/* ---------- administrare vehicule ---------- */
function parseVehicle(b){
 b=b||{};
 const make=vstr(b.make,60),model=vstr(b.model,80); if(!make||!model)return null;
 const yr=v=>v===''||v==null?null:Number(v);
 const yf=yr(b.year_from),yt=yr(b.year_to),max=new Date().getFullYear()+2;
 for(const y of [yf,yt])if(y!==null&&(!Number.isInteger(y)||y<1900||y>max))return null;
 if(yf&&yt&&yt<yf)return null;
 return {make,model,make_norm:vkey(make),model_norm:vkey(model),generation:vstr(b.generation,80),year_from:yf,year_to:yt,kind:VEHICLE_KINDS.includes(b.kind)?b.kind:'car',engine:vstr(b.engine,80),fuel:vstr(b.fuel,30)};
}
app.get('/api/admin/vehicles',auth,admin,requireDb,async(req,res)=>{
 const q=vkey(String(req.query.q||'').slice(0,60)); const limit=Math.min(200,Math.max(1,Number(req.query.limit)||100));
 const where=q?'WHERE (make_norm||model_norm) LIKE $1':'';
 const vals=q?['%'+q+'%']:[];
 const rows=(await pool.query(`SELECT id,make,model,generation,year_from,year_to,kind,engine,fuel,source FROM vehicles ${where} ORDER BY make,model LIMIT ${limit}`,vals)).rows;
 const st=(await pool.query("SELECT COUNT(*)::int total, COUNT(DISTINCT make_norm)::int makes, COUNT(*) FILTER (WHERE source='manual')::int manual FROM vehicles")).rows[0];
 res.json({vehicles:rows,stats:st});
});
app.post('/api/admin/vehicles',auth,admin,requireDb,async(req,res)=>{
 const v=parseVehicle(req.body); if(!v)return res.status(400).json({error:'DATE_INVALIDE'});
 const r=await pool.query("INSERT INTO vehicles(make,model,make_norm,model_norm,generation,year_from,year_to,kind,engine,fuel,source) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'manual') ON CONFLICT (make_norm,model_norm) DO UPDATE SET make=EXCLUDED.make,model=EXCLUDED.model,generation=EXCLUDED.generation,year_from=EXCLUDED.year_from,year_to=EXCLUDED.year_to,kind=EXCLUDED.kind,engine=EXCLUDED.engine,fuel=EXCLUDED.fuel,source='manual',updated_at=NOW() RETURNING id,make,model",
  [v.make,v.model,v.make_norm,v.model_norm,v.generation,v.year_from,v.year_to,v.kind,v.engine,v.fuel]);
 invalidateVehicles();
 await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,'save_vehicle','vehicle',r.rows[0].id,`${v.make} ${v.model}`]);
 res.status(201).json({vehicle:r.rows[0]});
});
app.patch('/api/admin/vehicles/:id',auth,admin,requireDb,async(req,res)=>{
 const v=parseVehicle(req.body); if(!v)return res.status(400).json({error:'DATE_INVALIDE'});
 try{
  const r=await pool.query("UPDATE vehicles SET make=$1,model=$2,make_norm=$3,model_norm=$4,generation=$5,year_from=$6,year_to=$7,kind=$8,engine=$9,fuel=$10,source='manual',updated_at=NOW() WHERE id=$11 RETURNING id,make,model",
   [v.make,v.model,v.make_norm,v.model_norm,v.generation,v.year_from,v.year_to,v.kind,v.engine,v.fuel,req.params.id]);
  if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});
  invalidateVehicles();
  await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,'update_vehicle','vehicle',req.params.id,`${v.make} ${v.model}`]);
  res.json({vehicle:r.rows[0]});
 }catch(e){if(e&&e.code==='23505')return res.status(409).json({error:'VEHICUL_EXISTA'});throw e;}
});
app.delete('/api/admin/vehicles/:id',auth,admin,requireDb,async(req,res)=>{
 const d=await pool.query('DELETE FROM vehicles WHERE id=$1 RETURNING id,make,model',[req.params.id]);
 if(!d.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 invalidateVehicles();
 await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,'delete_vehicle','vehicle',req.params.id,`${d.rows[0].make} ${d.rows[0].model}`]);
 res.json({ok:true});
});
// Resetare la lista standard de mărci/modele. Înregistrările adăugate manual nu sunt șterse.
app.post('/api/admin/vehicles/sync',auth,admin,requireDb,async(req,res)=>{
 const out=await syncVehicleDb({reset:true});
 await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,'sync_vehicles','vehicle',null,String(out.source||'')+' '+String(out.total||0)]);
 res.json(out);
});

app.get('/api/me',async(req,res)=>{
 if(!pool)return res.json({user:null,mode:'no-database'});
 try{
  const t=req.cookies.session; if(!t)return res.json({user:null,verification:VERIF});
  const r=await pool.query('SELECT s.id session_id,s.expires_at,u.id,u.name,u.nickname,u.email,u.phone,u.show_phone,u.role,u.status,u.email_verified,(u.avatar IS NOT NULL) has_avatar FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW()',[hashToken(t)]);
  if(!r.rowCount)return res.json({user:null,verification:VERIF});
  const u=r.rows[0];
  if(u.status!=='active')return res.json({user:null,verification:VERIF});
  await pool.query('UPDATE sessions SET last_seen_at=NOW() WHERE id=$1',[u.session_id]);
  res.json({user:u,verification:VERIF});
 }catch{res.json({user:null,verification:VERIF});}
});
async function sendMail(to,subject,text,html){
 const apiKey=process.env.RESEND_API_KEY;
 const from=String(process.env.RESEND_FROM||'').trim();
 if(!apiKey) throw new Error('EMAIL_NOT_CONFIGURED');
 if(!from) throw new Error('EMAIL_SENDER_NOT_CONFIGURED');
 if(!from.includes('@')) throw new Error('EMAIL_SENDER_INVALID');
 const resp=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[to],subject,text,html})});
 let data={}; try{data=await resp.json();}catch{}
 if(!resp.ok){
   console.error('Resend error',resp.status,JSON.stringify(data));
   const msg=String(data?.message||data?.error||'').toLowerCase();
   if(resp.status===403 && /(domain|sender|from|verified|verify)/.test(msg)) throw new Error('EMAIL_SENDER_NOT_VERIFIED');
   if(resp.status===403) throw new Error('EMAIL_PROVIDER_FORBIDDEN');
   if(resp.status===429) throw new Error('EMAIL_RATE_LIMIT');
   throw new Error('EMAIL_SEND_FAILED');
 }
 return data;
}
function maskEmail(e){const [u,d]=String(e||'').split('@');return (u||'').slice(0,2)+'***@'+(d||'');}
function appBaseUrl(req){
 // Linkurile din emailuri (resetare parolă etc.) nu trebuie să depindă de antetul Host trimis de client.
 const fixed=process.env.APP_URL||process.env.RENDER_EXTERNAL_URL;
 if(fixed)return fixed.replace(/\/$/,'');
 const host=String(req.get('host')||'');
 const safe=/^[A-Za-z0-9.-]+(:\d{1,5})?$/.test(host)?host:'localhost';
 return `${req.protocol}://${safe}`;
}

// ---- Confirmare email la înregistrare ----
// Se trimite doar dacă Resend e configurat. Obligativitatea se activează cu REQUIRE_VERIFIED_EMAIL=true (și doar dacă emailurile funcționează).
const MAIL_READY=!!(process.env.RESEND_API_KEY&&String(process.env.RESEND_FROM||'').includes('@'));
const REQUIRE_VERIFIED=process.env.REQUIRE_VERIFIED_EMAIL==='true'&&MAIL_READY;
if(process.env.REQUIRE_VERIFIED_EMAIL==='true'&&!MAIL_READY)console.warn('REQUIRE_VERIFIED_EMAIL=true este ignorat: RESEND_API_KEY/RESEND_FROM nu sunt configurate.');
const VERIF={enabled:MAIL_READY,required:REQUIRE_VERIFIED};
async function sendVerificationEmail(req,user){
 const raw=crypto.randomBytes(32).toString('base64url');
 await pool.query('DELETE FROM email_verifications WHERE user_id=$1 OR expires_at<NOW()',[user.id]);
 await pool.query("INSERT INTO email_verifications(user_id,token_hash,expires_at) VALUES($1,$2,NOW()+INTERVAL '24 hours')",[user.id,hashToken(raw)]);
 const link=`${appBaseUrl(req)}/#/verify-email?token=${encodeURIComponent(raw)}`;
 try{
  await sendMail(user.email,'AutoParts – confirmă adresa de email',`Salut, ${user.name||''}\n\nConfirmă adresa de email deschizând linkul (valabil 24 de ore):\n${link}\n\nDacă nu ți-ai creat cont pe AutoParts, ignoră acest mesaj.`,`<p>Salut, ${escapeHtml(user.name||'')}!</p><p>Confirmă adresa de email apăsând pe link:</p><p><a href="${link}">Confirmă emailul</a></p><p>Linkul este valabil 24 de ore.</p><p>Dacă nu ți-ai creat cont pe AutoParts, ignoră acest mesaj.</p>`);
 }catch(e){await pool.query('DELETE FROM email_verifications WHERE user_id=$1',[user.id]).catch(()=>{});throw e;}
}

app.post('/api/auth/forgot-password',requireDb,async(req,res)=>{
 try{
  const em=String((req.body||{}).email||'').trim().toLowerCase();
  if(!em||em.length>254)return res.status(400).json({error:'EMAIL_REQUIRED'});
  const key=`${clientIp(req)}:${em}`;
  if(!throttle(recoveryAttempts,key,3,15*60*1000))return res.status(429).json({error:'RECOVERY_RATE_LIMIT'});
  const r=await pool.query('SELECT id,email,name FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1',[em]);
  // Always use the same success response for unknown addresses.
  if(!r.rowCount){console.log('Recovery: niciun cont pentru',maskEmail(em));return res.json({ok:true,message:'Dacă adresa există, vei primi instrucțiunile de resetare pe email.'});}

  const raw=crypto.randomBytes(32).toString('base64url');
  const userId=r.rows[0].id;
  await pool.query('DELETE FROM password_resets WHERE user_id=$1 OR expires_at<NOW()',[userId]);
  await pool.query("INSERT INTO password_resets(user_id,token_hash,expires_at) VALUES($1,$2,NOW()+INTERVAL '30 minutes')",[userId,hashToken(raw)]);
  const link=`${appBaseUrl(req)}/#/reset-password?token=${encodeURIComponent(raw)}`;
  try{
   const sent=await sendMail(em,'AutoParts – resetare parolă',`Salut, ${r.rows[0].name||''}\n\nPentru a schimba parola, deschide linkul (valabil 30 de minute):\n${link}\n\nDacă nu ai cerut resetarea parolei, ignoră acest mesaj.`,`<p>Salut, ${escapeHtml(r.rows[0].name||'')}!</p><p>Pentru a schimba parola, apasă pe buton:</p><p><a href=\"${link}\">Resetează parola</a></p><p>Linkul este valabil 30 de minute.</p><p>Dacă nu ai cerut resetarea, ignoră acest mesaj.</p>`);
   console.log('Recovery: Resend a acceptat emailul pentru',maskEmail(em),'id:',(sent&&sent.id)||'?');
  }catch(mailErr){
   // Never leave a valid reset token behind when delivery failed.
   await pool.query('DELETE FROM password_resets WHERE user_id=$1',[userId]);
   throw mailErr;
  }
  res.json({ok:true,message:'Dacă adresa există, vei primi instrucțiunile de resetare pe email.'});
 }catch(e){
  console.error('Password recovery error:',e);
  const known=['EMAIL_NOT_CONFIGURED','EMAIL_SENDER_NOT_CONFIGURED','EMAIL_SENDER_INVALID','EMAIL_SENDER_NOT_VERIFIED','EMAIL_PROVIDER_FORBIDDEN','EMAIL_RATE_LIMIT'];
  if(known.includes(e.message))return res.status(e.message==='EMAIL_RATE_LIMIT'?429:503).json({error:e.message});
  if(e.message==='RECOVERY_RATE_LIMIT')return res.status(429).json({error:e.message});
  res.status(500).json({error:'SERVER_ERROR'});
 }
});

app.post('/api/auth/verify-email',requireDb,async(req,res)=>{
 try{
  const token=String((req.body||{}).token||'');
  if(!token||token.length>200)return res.status(400).json({error:'RESET_EXPIRED'});
  const r=await pool.query('SELECT id,user_id FROM email_verifications WHERE token_hash=$1 AND expires_at>NOW() AND verified_at IS NULL LIMIT 1',[hashToken(token)]);
  if(!r.rowCount)return res.status(400).json({error:'RESET_EXPIRED'});
  await pool.query('UPDATE users SET email_verified=TRUE WHERE id=$1',[r.rows[0].user_id]);
  await pool.query('UPDATE email_verifications SET verified_at=NOW() WHERE id=$1',[r.rows[0].id]);
  res.json({ok:true,message:'Adresa de email a fost confirmată. Mulțumim!'});
 }catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}
});
app.post('/api/auth/resend-verification',auth,requireDb,async(req,res)=>{
 try{
  if(req.user.email_verified)return res.json({ok:true,message:'Adresa ta de email este deja confirmată.'});
  if(!throttle(recoveryAttempts,'verify:'+req.user.id,3,15*60*1000))return res.status(429).json({error:'RECOVERY_RATE_LIMIT'});
  await sendVerificationEmail(req,req.user);
  res.json({ok:true,message:'Ți-am trimis un email de confirmare. Verifică și folderul Spam.'});
 }catch(e){
  console.error('Verification mail error:',e.message);
  const known=['EMAIL_NOT_CONFIGURED','EMAIL_SENDER_NOT_CONFIGURED','EMAIL_SENDER_INVALID','EMAIL_SENDER_NOT_VERIFIED','EMAIL_PROVIDER_FORBIDDEN','EMAIL_RATE_LIMIT'];
  if(known.includes(e.message))return res.status(e.message==='EMAIL_RATE_LIMIT'?429:503).json({error:e.message});
  res.status(500).json({error:'SERVER_ERROR'});
 }
});

app.post('/api/auth/reset-password',requireDb,async(req,res)=>{
 const token=String((req.body||{}).token||'').trim();
 const password=String((req.body||{}).password||'');
 if(!token||token.length>200||password.length<8||password.length>72)return res.status(400).json({error:'DATE_INVALIDE'});
 if(weakPassword(password))return res.status(400).json({error:'PAROLA_SLABA'});
 if(!throttle(recoveryAttempts,'reset:'+clientIp(req),10,15*60*1000))return res.status(429).json({error:'RECOVERY_RATE_LIMIT'});
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  const r=await client.query('SELECT id,user_id FROM password_resets WHERE token_hash=$1 AND expires_at>NOW() AND used_at IS NULL LIMIT 1 FOR UPDATE',[hashToken(token)]);
  if(!r.rowCount){await client.query('ROLLBACK');return res.status(400).json({error:'RESET_EXPIRED'});}
  const hash=await bcrypt.hash(password,12);
  await client.query('UPDATE users SET password_hash=$1 WHERE id=$2',[hash,r.rows[0].user_id]);
  await client.query('UPDATE password_resets SET used_at=NOW() WHERE id=$1',[r.rows[0].id]);
  await client.query('DELETE FROM password_resets WHERE user_id=$1 AND id<>$2',[r.rows[0].user_id,r.rows[0].id]);
  await client.query('DELETE FROM sessions WHERE user_id=$1',[r.rows[0].user_id]);
  await client.query('COMMIT');
  res.json({ok:true});
 }catch(e){
  try{await client.query('ROLLBACK');}catch{}
  console.error('Password reset error:',e);
  res.status(500).json({error:'SERVER_ERROR'});
 }finally{client.release();}
});

app.put('/api/account/details',requireDb,auth,async(req,res)=>{
 try{
  const b=req.body||{}, t=(v,max)=>{const x=String(v==null?'':v).trim().replace(/\s+/g,' ');return x.length>max?null:x;};
  const f={ship_county:t(b.ship_county,60),ship_city:t(b.ship_city,80),ship_details:t(b.ship_details,300),bill_company:t(b.bill_company,120),bill_name:t(b.bill_name,120),bill_type:t(b.bill_type,3),bill_cui:t(b.bill_cui,20),bill_regcom:t(b.bill_regcom,30),bill_address:t(b.bill_address,300),bill_bank:t(b.bill_bank,80),bill_iban:t(b.bill_iban,40)};
  if(Object.values(f).some(v=>v===null))return res.status(400).json({error:'DATE_INVALIDE'});
  if(f.bill_type&&!['pf','pj'].includes(f.bill_type))return res.status(400).json({error:'DATE_INVALIDE'});
  if(f.bill_cui&&!/^(RO)?\s?\d{2,10}$/i.test(f.bill_cui))return res.status(400).json({error:'CUI_INVALID'});
  if(f.bill_iban){
   const iban=f.bill_iban.replace(/\s+/g,'').toUpperCase();
   const ok=/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)&&(()=>{const r=(iban.slice(4)+iban.slice(0,4)).replace(/[A-Z]/g,c=>c.charCodeAt(0)-55);let m=0;for(const d of r)m=(m*10+Number(d))%97;return m===1;})();
   if(!ok)return res.status(400).json({error:'IBAN_INVALID'});
   f.bill_iban=iban;
  }
  const keys=Object.keys(f), vals=keys.map(k=>f[k]||null);
  await pool.query(`UPDATE users SET ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} WHERE id=$${keys.length+1}`,[...vals,req.user.id]);
  res.json({ok:true});
 }catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}
});
app.get('/api/account/settings',requireDb,auth,async(req,res)=>{
 try{
  const u=(await pool.query('SELECT id,name,nickname,email,phone,show_phone,email_verified,ship_county,ship_city,ship_details,bill_company,bill_type,bill_name,bill_cui,bill_regcom,bill_address,bill_bank,bill_iban,store_name,store_site,(store_logo IS NOT NULL) has_logo,(avatar IS NOT NULL) has_avatar,mail_msg,mail_offer,mail_order,mail_alert,vacation,vacation_until::text vacation_until FROM users WHERE id=$1',[req.user.id])).rows[0];
  const phones=(await pool.query('SELECT id,phone,is_whatsapp,verified,created_at FROM user_phones WHERE user_id=$1 ORDER BY id',[req.user.id])).rows;
  res.json({user:u,phones});
 }catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}
});
app.patch('/api/account/profile',requireDb,auth,async(req,res)=>{
 try{
  const name=String((req.body||{}).name||'').trim(), nickname=String((req.body||{}).nickname||'').trim();
  if(!name||name.length>100||!NICK_RE.test(nickname))return res.status(400).json({error:'NICKNAME_INVALID'});
  const exists=await pool.query('SELECT id FROM users WHERE LOWER(nickname)=LOWER($1) AND id<>$2',[nickname,req.user.id]);
  if(exists.rowCount)return res.status(409).json({error:'NICKNAME_EXISTS'});
  const r=await pool.query('UPDATE users SET name=$1,nickname=$2 WHERE id=$3 RETURNING id,name,nickname,email,phone,show_phone,email_verified',[name,nickname,req.user.id]);
  res.json({user:r.rows[0]});
 }catch(e){if(e&&e.code==='23505')return res.status(409).json({error:'NICKNAME_EXISTS'});console.error(e);res.status(500).json({error:'SERVER_ERROR'});}
});
app.post('/api/account/email-change',requireDb,auth,async(req,res)=>{
 try{
  const em=String((req.body||{}).email||'').trim().toLowerCase();
  const curPass=String((req.body||{}).password||'');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)||em.length>254)return res.status(400).json({error:'EMAIL_REQUIRED'});
  if(!throttle(authAttempts,'em:'+req.user.id,5,15*60*1000))return res.status(429).json({error:'LOGIN_RATE_LIMIT'});
  const me=(await pool.query('SELECT password_hash FROM users WHERE id=$1',[req.user.id])).rows[0];
  if(!me||!curPass||!(await bcrypt.compare(curPass.slice(0,72),me.password_hash)))return res.status(401).json({error:'PAROLA_GRESITA'});
  const exists=await pool.query('SELECT id FROM users WHERE LOWER(email)=$1 AND id<>$2',[em,req.user.id]);
  if(exists.rowCount)return res.status(409).json({error:'EMAIL_EXISTS'});
  const raw=crypto.randomBytes(32).toString('base64url');
  await pool.query('DELETE FROM email_change_requests WHERE user_id=$1 OR expires_at<NOW()',[req.user.id]);
  await pool.query("INSERT INTO email_change_requests(user_id,new_email,token_hash,expires_at) VALUES($1,$2,$3,NOW()+INTERVAL '30 minutes')",[req.user.id,em,hashToken(raw)]);
  const link=`${appBaseUrl(req)}/#/verify-email-change?token=${encodeURIComponent(raw)}`;
  try{ await sendMail(em,'AutoParts – confirmă noua adresă de email',`Ai cerut schimbarea adresei de email pentru contul AutoParts. Confirmă în 30 de minute: ${link}`,
   `<p>Ai cerut schimbarea adresei de email pentru contul AutoParts.</p><p><a href="${link}">Confirmă noua adresă de email</a></p><p>Linkul este valabil 30 de minute.</p>`);
  }catch(mailErr){ await pool.query('DELETE FROM email_change_requests WHERE user_id=$1',[req.user.id]); throw mailErr; }
  res.json({ok:true,message:'Ți-am trimis un link de confirmare pe noua adresă de email.'});
 }catch(e){console.error(e);const known=['EMAIL_NOT_CONFIGURED','EMAIL_SENDER_NOT_CONFIGURED','EMAIL_SENDER_INVALID','EMAIL_SENDER_NOT_VERIFIED','EMAIL_PROVIDER_FORBIDDEN','EMAIL_RATE_LIMIT','EMAIL_SEND_FAILED'];if(known.includes(e.message))return res.status(e.message==='EMAIL_RATE_LIMIT'?429:503).json({error:e.message});res.status(500).json({error:'SERVER_ERROR'});}
});
app.post('/api/account/email-change/confirm',requireDb,async(req,res)=>{
 try{
  const token=String((req.body||{}).token||'');
  const r=await pool.query('SELECT id,user_id,new_email FROM email_change_requests WHERE token_hash=$1 AND expires_at>NOW() AND used_at IS NULL LIMIT 1',[hashToken(token)]);
  if(!r.rowCount)return res.status(400).json({error:'RESET_EXPIRED'});
  const exists=await pool.query('SELECT id FROM users WHERE LOWER(email)=LOWER($1) AND id<>$2',[r.rows[0].new_email,r.rows[0].user_id]);
  if(exists.rowCount)return res.status(409).json({error:'EMAIL_EXISTS'});
  await pool.query('UPDATE users SET email=$1,email_verified=TRUE WHERE id=$2',[r.rows[0].new_email,r.rows[0].user_id]);
  await pool.query('UPDATE email_change_requests SET used_at=NOW() WHERE id=$1',[r.rows[0].id]);
  await pool.query('DELETE FROM sessions WHERE user_id=$1',[r.rows[0].user_id]);
  res.json({ok:true,message:'Adresa de email a fost schimbată. Autentifică-te din nou.'});
 }catch(e){if(e&&e.code==='23505')return res.status(409).json({error:'EMAIL_EXISTS'});console.error(e);res.status(500).json({error:'SERVER_ERROR'});}
});
app.post('/api/account/phones',requireDb,auth,async(req,res)=>{
 try{
  const phone=String(req.body.phone||'').trim().replace(/\s+/g,' '), whatsapp=Boolean(req.body.is_whatsapp);
  if(!/^\+?[0-9 ().-]{6,20}$/.test(phone))return res.status(400).json({error:'PHONE_INVALID'});
  const count=await pool.query('SELECT COUNT(*)::int AS n FROM user_phones WHERE user_id=$1',[req.user.id]);
  if(count.rows[0].n>=4)return res.status(400).json({error:'MAX_PHONES'});
  const dup=await pool.query('SELECT id FROM user_phones WHERE user_id=$1 AND phone=$2',[req.user.id,phone]);
  if(dup.rowCount)return res.status(409).json({error:'PHONE_EXISTS'});
  const r=await pool.query('INSERT INTO user_phones(user_id,phone,is_whatsapp,verified) VALUES($1,$2,$3,FALSE) RETURNING id,phone,is_whatsapp,verified',[req.user.id,phone,whatsapp]);
  res.status(201).json({phone:r.rows[0],message:'Numărul a fost adăugat. Verificarea prin SMS poate fi conectată cu un furnizor SMS.'});
 }catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}
});
app.patch('/api/account/phones/:id',requireDb,auth,async(req,res)=>{
 try{
  const id=Number(req.params.id), body=req.body||{};
  const sets=[], vals=[];
  if(body.phone!==undefined){
   const phone=String(body.phone||'').trim().replace(/\s+/g,' ');
   if(!/^\+?[0-9 ().-]{6,20}$/.test(phone))return res.status(400).json({error:'PHONE_INVALID'});
   const dup=await pool.query('SELECT id FROM user_phones WHERE user_id=$1 AND phone=$2 AND id<>$3',[req.user.id,phone,id]);
   if(dup.rowCount)return res.status(409).json({error:'PHONE_EXISTS'});
   vals.push(phone); sets.push(`phone=$${vals.length}`); sets.push('verified=FALSE');
  }
  if(body.is_whatsapp!==undefined){ vals.push(Boolean(body.is_whatsapp)); sets.push(`is_whatsapp=$${vals.length}`); }
  if(!sets.length)return res.status(400).json({error:'DATE_INVALIDE'});
  vals.push(id,req.user.id);
  const r=await pool.query(`UPDATE user_phones SET ${sets.join(',')} WHERE id=$${vals.length-1} AND user_id=$${vals.length} RETURNING id,phone,is_whatsapp,verified`,vals);
  if(!r.rowCount)return res.status(404).json({error:'DATE_INVALIDE'});
  res.json({phone:r.rows[0]});
 }catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}
});
app.delete('/api/account/phones/:id',requireDb,auth,async(req,res)=>{
 try{
  const id=Number(req.params.id);
  const r=await pool.query('DELETE FROM user_phones WHERE id=$1 AND user_id=$2 RETURNING id',[id,req.user.id]);
  if(!r.rowCount)return res.status(404).json({error:'DATE_INVALIDE'});
  res.json({ok:true});
 }catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}
});

app.post('/api/auth/register',requireDb,async(req,res)=>{
 try{
  const {name,nickname,email,phone,password,remember=true,accept_terms}=req.body||{};
  if(accept_terms!==true)return res.status(400).json({error:'TERMENI_NEACCEPTATI'});
  if(typeof name!=='string'||typeof nickname!=='string'||typeof email!=='string'||typeof password!=='string'||!name.trim()||!nickname.trim()||password.length<8||password.length>72||name.length>100||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())||(phone&&!/^\+?[0-9 ().-]{6,20}$/.test(String(phone).trim())))return res.status(400).json({error:'DATE_INVALIDE'});
  const em=email.trim().toLowerCase(), nick=nickname.trim();
  if(!NICK_RE.test(nick))return res.status(400).json({error:'NICKNAME_INVALID'});
  if(weakPassword(password,{email:em,nickname:nick}))return res.status(400).json({error:'PAROLA_SLABA'});
  if(!throttle(authAttempts,'reg:'+clientIp(req),10,60*60*1000))return res.status(429).json({error:'LOGIN_RATE_LIMIT'});
  const exists=await pool.query('SELECT id,email,nickname FROM users WHERE LOWER(email)=$1 OR LOWER(nickname)=LOWER($2)',[em,nick]);
  if(exists.rowCount)return res.status(409).json({error:String(exists.rows[0].email).toLowerCase()===em?'EMAIL_EXISTS':'NICKNAME_EXISTS'});
  const hash=await bcrypt.hash(password,12);
  const r=await pool.query('INSERT INTO users(name,nickname,email,phone,password_hash,terms_accepted_at) VALUES($1,$2,$3,$4,$5,NOW()) RETURNING id,name,nickname,email,phone,show_phone,role,status,email_verified',[name.trim(),nick,em,phone?String(phone).trim():null,hash]);
  if(r.rows[0].phone){try{await pool.query('INSERT INTO user_phones(user_id,phone) VALUES($1,$2) ON CONFLICT DO NOTHING',[r.rows[0].id,r.rows[0].phone]);}catch(e){console.error(e);}}
  if(MAIL_READY)sendVerificationEmail(req,r.rows[0]).catch(e=>console.error('verify mail',e.message));
  const session=await createSession(r.rows[0],req,remember!==false);
  res.cookie('session',session.token,safeCookieOptions(session.maxAge));
  res.status(201).json({user:r.rows[0]});
 }catch(e){if(e&&e.code==='23505')return res.status(409).json({error:/nickname/i.test(String(e.constraint||e.detail||''))?'NICKNAME_EXISTS':'EMAIL_EXISTS'});console.error(e);res.status(500).json({error:'SERVER_ERROR'});}
});
app.post('/api/auth/login',requireDb,async(req,res)=>{
 try{
  const {identifier,password,remember=true}=req.body||{};
  const id=normalizeIdentifier(identifier);
  if(!id||!String(password||''))return res.status(400).json({error:'DATE_INVALIDE'});
  const key=`${clientIp(req)}:${id.toLowerCase()}`;
  // Limită pe IP, indiferent de identificator: fiecare încercare costă un bcrypt (CPU).
  if(!throttle(authAttempts,'loginip:'+clientIp(req),40,15*60*1000))return res.status(429).json({error:'LOGIN_RATE_LIMIT'});
  if(!throttle(authAttempts,key,8,15*60*1000)||!throttle(authAttempts,'acct:'+id.toLowerCase(),40,15*60*1000)||await loginBlocked('ip:'+key,'acct:'+id.toLowerCase()))return res.status(429).json({error:'LOGIN_RATE_LIMIT'});
  const r=await pool.query("SELECT * FROM users WHERE LOWER(email)=LOWER($1) OR LOWER(COALESCE(nickname,''))=LOWER($1) LIMIT 1",[id]);
  // Comparăm mereu cu un hash (și pentru conturi inexistente) ca să nu se poată afla ce emailuri există după timpul de răspuns.
  const okPass=await bcrypt.compare(String(password).slice(0,72),r.rowCount?r.rows[0].password_hash:DUMMY_HASH);
  if(!r.rowCount||!okPass){await loginFailed('ip:'+key,'acct:'+id.toLowerCase());return res.status(401).json({error:'INVALID_LOGIN'});}
  if(r.rows[0].status!=='active')return res.status(403).json({error:'ACCOUNT_BLOCKED'});
  authAttempts.delete(key);markDirty(authAttempts,key);
  pool.query('DELETE FROM login_attempts WHERE key=$1',['ip:'+key]).catch(()=>{});
  const u=r.rows[0]; const session=await createSession(u,req,remember!==false);
  res.cookie('session',session.token,safeCookieOptions(session.maxAge));
  res.json({user:{id:u.id,name:u.name,nickname:u.nickname,email:u.email,phone:u.phone,show_phone:u.show_phone,role:u.role,status:u.status,email_verified:u.email_verified}});
 }catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}
});
app.post('/api/auth/logout',async(req,res)=>{try{const token=req.cookies.session;if(pool&&token)await pool.query('DELETE FROM sessions WHERE token_hash=$1',[hashToken(token)]);}catch{}res.clearCookie('session',{httpOnly:true,sameSite:'lax',secure:IS_PROD,path:'/'});res.json({ok:true});});
app.post('/api/account/password',auth,requireDb,ah(async(req,res)=>{
 const cur=String((req.body&&req.body.current)||''),nw=String((req.body&&req.body.password)||'');
 if(!cur||nw.length<8||nw.length>72)return res.status(400).json({error:'DATE_INVALIDE'});
 if(weakPassword(nw,{email:req.user.email,nickname:req.user.nickname}))return res.status(400).json({error:'PAROLA_SLABA'});
 if(!throttle(authAttempts,'pw:'+req.user.id,5,15*60*1000))return res.status(429).json({error:'LOGIN_RATE_LIMIT'});
 const u=(await pool.query('SELECT password_hash FROM users WHERE id=$1',[req.user.id])).rows[0];
 if(!u||!(await bcrypt.compare(cur,u.password_hash)))return res.status(401).json({error:'PAROLA_GRESITA'});
 await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2',[await bcrypt.hash(nw,12),req.user.id]);
 await pool.query('DELETE FROM sessions WHERE user_id=$1 AND id<>$2',[req.user.id,req.sessionId]);
 res.json({ok:true});
}));
app.post('/api/auth/logout-all',auth,requireDb,async(req,res)=>{await pool.query('DELETE FROM sessions WHERE user_id=$1',[req.user.id]);res.clearCookie('session',{httpOnly:true,sameSite:'lax',secure:IS_PROD,path:'/'});res.json({ok:true});});
app.get('/api/auth/sessions',auth,requireDb,ah(async(req,res)=>{const r=await pool.query('SELECT id,created_at,last_seen_at,expires_at,user_agent,(id=$2) AS current FROM sessions WHERE user_id=$1 AND expires_at>NOW() ORDER BY (id=$2) DESC,last_seen_at DESC LIMIT 50',[req.user.id,req.sessionId]);res.json({sessions:r.rows});}));
// „Deconectează celelalte dispozitive”: toate sesiunile în afară de cea curentă. Definit înaintea rutei /:id.
app.delete('/api/auth/sessions/others',auth,requireDb,ah(async(req,res)=>{const r=await pool.query('DELETE FROM sessions WHERE user_id=$1 AND id<>$2',[req.user.id,req.sessionId]);res.json({ok:true,removed:r.rowCount});}));
app.delete('/api/auth/sessions/:id',auth,requireDb,ah(async(req,res)=>{
 if(!/^\d{1,10}$/.test(req.params.id))return res.status(400).json({error:'ID_INVALID'});
 const id=Number(req.params.id),r=await pool.query('DELETE FROM sessions WHERE id=$1 AND user_id=$2',[id,req.user.id]);
 if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 const current=id===req.sessionId; if(current)res.clearCookie('session',{httpOnly:true,sameSite:'lax',secure:IS_PROD,path:'/'});
 res.json({ok:true,current});
}));
app.patch('/api/me',auth,requireDb,async(req,res)=>{try{const {phone,show_phone}=req.body||{};if(phone&&!/^\+?[0-9 ().-]{6,20}$/.test(String(phone).trim()))return res.status(400).json({error:'PHONE_INVALID'});const r=await pool.query('UPDATE users SET phone=$1, show_phone=$2 WHERE id=$3 RETURNING id,name,nickname,email,phone,show_phone,role,status',[clip(phone,30),!!show_phone,req.user.id]);res.json({user:r.rows[0]});}catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}});
app.patch('/api/account/privacy',requireDb,auth,async(req,res)=>{try{const r=await pool.query('UPDATE users SET show_phone=$1 WHERE id=$2 RETURNING show_phone',[!!(req.body||{}).show_phone,req.user.id]);res.json({show_phone:r.rows[0].show_phone});}catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}});

const LIST_COLS="(COALESCE(l.promoted_until,'epoch'::timestamptz)>NOW()) AS promoted,l.promoted_until,l.id,l.user_id,l.type,l.title,l.price,l.condition,l.make,l.model,l.generation,l.year,l.engine,l.fuel,l.vehicle_id,l.seller_type,l.quantity,l.negotiable,l.county,l.category,l.subcategory,l.oem,l.delivery,l.description,l.status,l.created_at,l.views,l.km,l.parts_avail,(CASE WHEN l.images[1] LIKE 'data:%' THEN ARRAY['/api/listings/'||l.id||'/img/0'] ELSE l.images[1:1] END) AS images,COALESCE(array_length(l.images,1),0)::int AS image_count";
// Media calificativelor: ca vânzător (de la cumpărători) și ca cumpărător (de la vânzători).
const RATE_SQL=(tbl,col,uid,al)=>`(SELECT ROUND(AVG(stars),1)::float FROM ${tbl} WHERE ${col}=${uid}) ${al}_avg,(SELECT COUNT(*)::int FROM ${tbl} WHERE ${col}=${uid}) ${al}_n`;
const SELLER_RATE=(uid,al)=>RATE_SQL('seller_ratings','seller_id',uid,al);
const BUYER_RATE=(uid,al)=>RATE_SQL('buyer_ratings','buyer_id',uid,al);
const SELLER_COLS="COALESCE(u.nickname,u.name) seller_name,u.created_at seller_since,(SELECT COUNT(*)::int FROM listings sl WHERE sl.user_id=l.user_id AND sl.status='approved') seller_ads,"+SELLER_RATE('l.user_id','seller_rating');
const LISTING_SELECT=`SELECT ${LIST_COLS},${SELLER_COLS} FROM listings l LEFT JOIN users u ON u.id=l.user_id`;
const CATEGORIES=['Accesorii auto','Accesorii roți','Aprindere','Cabluri auto','Car audio','Caroserie','Climatizare','Direcție','Diverse','Electrică & Electronică Auto','Evacuare','Faruri stopuri lumini','Filtre auto','Frâne','Instalații GPL','Interioare auto','Întreținere auto','Jante & Anvelope','Navigație GPS','Pachete revizie','Piese moto','Piese motoare','Pompe și injectoare','Punte și rulmenți','Răcire','Scule auto','Suspensie','Transmisie','Tuning','Turbo','Ulei auto','Xenon',
 // nume vechi, păstrate doar ca anunțurile existente să rămână editabile (se migrează la pornire)
 'Alimentare combustibil','Interior','Motor','Iluminare','Roți','Electrică','Filtre','Altele'];
const SELLER_TYPES=['Persoană fizică','Firmă','Parc dezmembrări'];
const fold=c=>`translate(LOWER(COALESCE(${c},'')),'ăâîșşțţéèêëáàäãåíìïóòôöõúùûüçñšžčřěýÿ','aaisstteeeeaaaaaiiiooooouuuucnszcreyy')`;
const flat=c=>`regexp_replace(${fold(c)},'[^a-z0-9]+','','g')`;
app.get('/api/listings/mine',auth,requireDb,async(req,res)=>{
 const r=await pool.query(`SELECT ${LIST_COLS},l.added_at FROM listings l WHERE l.user_id=$1 ORDER BY l.created_at DESC LIMIT 500`,[req.user.id]);
 res.json({listings:r.rows});
});
app.get('/api/favorites',auth,requireDb,async(req,res)=>{
 const r=await pool.query("SELECT listing_id FROM favorites WHERE user_id=$1",[req.user.id]);
 res.json({favorites:r.rows.map(x=>x.listing_id)});
});
app.post('/api/favorites/:id',auth,requireDb,async(req,res)=>{
 const ok=await pool.query("SELECT 1 FROM listings WHERE id=$1 AND status='approved'",[req.params.id]);
 if(!ok.rowCount)return res.status(404).json({error:'DATE_INVALIDE'});
 await pool.query("INSERT INTO favorites(user_id,listing_id) VALUES($1,$2) ON CONFLICT DO NOTHING",[req.user.id,req.params.id]);
 res.json({ok:true});
});
app.delete('/api/favorites/:id',auth,requireDb,async(req,res)=>{
 await pool.query("DELETE FROM favorites WHERE user_id=$1 AND listing_id=$2",[req.user.id,req.params.id]);
 res.json({ok:true});
});
function buildListingFilter(query){
 const {q,delivery}=query; const where=["l.status='approved'","l.type <> 'masina'",NOT_VAC_LISTING],vals=[];let i=1;
 if(q){
  const terms=norm(String(q).slice(0,100)).split(/\s+/).filter(Boolean).slice(0,8);
  for(const term of terms){
   const cols=['l.title','l.oem','l.description','l.make','l.model','l.generation','l.engine','l.category','l.year','l.fuel'].map(c=>`${fold(c)} LIKE $${i}`);
   // Coduri OEM scrise cu spații/liniuțe în anunț (ex. "1K0 615 301") se găsesc și când sunt căutate lipite.
   if(/\d/.test(term)&&term.length>=4)cols.push(`${flat('l.oem')} LIKE $${i}`);
   where.push('('+cols.join(' OR ')+')');vals.push('%'+term+'%');i++;
  }
 }
 let condClause=null;
 for(const [key,col] of [['type','l.type'],['condition','l.condition'],['year','l.year'],['seller_type','l.seller_type']]){
  if(query[key]){where.push(`${col}=$${i}`);if(key==='condition')condClause={at:where.length-1,param:i};vals.push(String(query[key]).slice(0,100));i++;}
 }
 // Marcă/model/județ/categorie: fără diferențe de majuscule, diacritice, spații sau cratime ("Land Rover" = "LandRover").
 for(const [key,col] of [['make','l.make'],['model','l.model'],['county','l.county'],['category','l.category']]){
  const v=norm(String(query[key]||'').slice(0,100)).replace(/\s+/g,'');
  if(v){where.push(`${flat(col)}=$${i}`);vals.push(v);i++;}
 }
 if(/^\d{1,10}$/.test(String(query.seller_id||''))){where.push(`l.user_id=$${i}`);vals.push(Number(query.seller_id));i++;}
 const mp=Number(query.maxPrice);
 if(query.maxPrice!==undefined&&query.maxPrice!==''&&Number.isFinite(mp)){where.push(`l.price <= $${i}`);vals.push(mp);i++;}
 if(delivery==='true')where.push('l.delivery=true');
 return {where,vals,condClause};
}
app.get('/api/listings',requireDb,ah(async(req,res)=>{
 const ckey=req.originalUrl,hit=LIST_CACHE.get(ckey);
 if(hit&&Date.now()-hit.at<LIST_CACHE_TTL)return res.json(hit.body);
 // Public: doar anunțuri aprobate. Statusul NU este controlat din query string.
 const {where,vals,condClause}=buildListingFilter(req.query);
 // Anunțurile fără preț (0) apar la final și la sortare crescătoare.
 const order={price_asc:'(COALESCE(l.price,0)=0) ASC, l.price ASC, l.id DESC',price_desc:'l.price DESC NULLS LAST, l.id DESC'}[req.query.sort]||'(COALESCE(l.promoted_until,\'epoch\'::timestamptz)>NOW()) DESC, l.created_at DESC, l.id DESC';
 const limit=Math.min(60,Math.max(1,Math.floor(Number(req.query.limit))||30)), offset=Math.min(100000,Math.max(0,Math.floor(Number(req.query.offset))||0));
 // Facete: câte anunțuri sunt Noi / Second-hand pentru aceeași căutare (filtrul de stare nu se aplică, dar parametrul rămâne folosit).
 const fWhere=where.map((w,ix)=>condClause&&ix===condClause.at?`($${condClause.param}::text IS NOT NULL)`:w);
 const [cnt,r,fc]=await Promise.all([pool.query(`SELECT COUNT(*)::int n FROM listings l WHERE ${where.join(' AND ')}`,vals),pool.query(`${LISTING_SELECT} WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`,vals),pool.query(`SELECT l.condition c,COUNT(*)::int n FROM listings l WHERE ${fWhere.join(' AND ')} GROUP BY l.condition`,vals)]);
 const facets={condition:{}};for(const row of fc.rows)if(row.c)facets.condition[row.c]=row.n;
 const body={listings:r.rows,total:cnt.rows[0].n,limit,offset,facets};
 if(LIST_CACHE.size>=LIST_CACHE_MAX)LIST_CACHE.clear();
 LIST_CACHE.set(ckey,{at:Date.now(),body});
 res.json(body);
}));
// Poza unui anunț ca fișier (cache în browser). Pozele vechi sunt base64 în DB; listele trimit doar acest URL scurt.
app.get('/api/listings/:id/img/:n(\\d{1,2})',requireDb,ah(async(req,res)=>{
 const n=Math.max(0,Math.floor(Number(req.params.n))||0);
 const r=await pool.query("SELECT images[$2::int] img FROM listings WHERE id=$1 AND status NOT IN ('blocked','rejected')",[req.params.id,n+1]);
 const img=r.rowCount?(r.rows[0].img||''):'';
 if(/^https?:\/\//.test(img))return res.redirect(302,img);
 const m=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+\/=]+)$/.exec(img);
 if(!m)return res.status(404).end();
 res.set({'Content-Type':m[1],'Cache-Control':'public, max-age=86400'}).send(Buffer.from(m[2],'base64'));
}));
app.get('/api/listings/:id',requireDb,async(req,res)=>{
 const r=await pool.query(`SELECT l.*,${SELLER_COLS},u.show_phone seller_show_phone,${VAC_SQL('u')} seller_vacation,CASE WHEN ${VAC_SQL('u')} THEN u.vacation_until::text END seller_vacation_until FROM listings l LEFT JOIN users u ON u.id=l.user_id WHERE l.id=$1 AND l.status='approved'`,[req.params.id]);
 if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 const x=r.rows[0]; let phones=[];
 if(req.query.noview!=='1'){const me=await optUserId(req);if(!me||me!==x.user_id){pool.query('UPDATE listings SET views=views+1 WHERE id=$1',[x.id]).catch(()=>{});bumpStat(x.id,'views');x.views=(Number(x.views)||0)+1;}}
 if(x.seller_show_phone&&x.user_id)phones=(await pool.query('SELECT phone,is_whatsapp FROM user_phones WHERE user_id=$1 ORDER BY id LIMIT 4',[x.user_id])).rows;
 delete x.seller_show_phone;
 res.json({listing:x,phones});
});
app.post('/api/listings/:id/phone-click',requireDb,ah(async(req,res)=>{
 // Apăsare pe „Sună” / WhatsApp. Maximum 5 pe oră per vizitator și anunț (fără umflarea cifrelor); proprietarul nu se numără.
 if(!throttle(authAttempts,'pc:'+clientIp(req)+':'+req.params.id,5,10*60*1000))return res.json({ok:true,counted:false});
 const r=await pool.query("SELECT id,user_id FROM listings WHERE id=$1 AND status='approved'",[req.params.id]);
 if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 const me=await optUserId(req);
 if(me&&me===r.rows[0].user_id)return res.json({ok:true,counted:false});
 await pool.query('UPDATE listings SET phone_clicks=phone_clicks+1 WHERE id=$1',[r.rows[0].id]);
 bumpStat(r.rows[0].id,'phone_clicks');
 res.json({ok:true,counted:true});
}));
app.get('/api/stats/mine',auth,requireDb,ah(async(req,res)=>{
 const [dd,ls,st,fv,ms]=await Promise.all([
  pool.query(`SELECT to_char(d,'YYYY-MM-DD') day FROM generate_series(${TODAY_SQL}-($1::int-1),${TODAY_SQL},'1 day') d ORDER BY d`,[STATS_DAYS]),
  pool.query("SELECT id,title,status,views,phone_clicks FROM listings WHERE user_id=$1 AND status<>'deleted' ORDER BY created_at DESC LIMIT 200",[req.user.id]),
  pool.query(`SELECT s.listing_id,to_char(s.day,'YYYY-MM-DD') day,s.views,s.phone_clicks FROM listing_stats s JOIN listings l ON l.id=s.listing_id WHERE l.user_id=$1 AND s.day>${TODAY_SQL}-$2::int`,[req.user.id,STATS_DAYS]),
  pool.query('SELECT f.listing_id,COUNT(*)::int n FROM favorites f JOIN listings l ON l.id=f.listing_id WHERE l.user_id=$1 GROUP BY f.listing_id',[req.user.id]),
  pool.query('SELECT listing_id,COUNT(*)::int n FROM messages WHERE recipient_id=$1 AND listing_id IS NOT NULL GROUP BY listing_id',[req.user.id])
 ]);
 const days=dd.rows.map(x=>x.day), idx=new Map(days.map((d,i)=>[d,i]));
 const by=new Map(ls.rows.map(l=>[l.id,{id:l.id,title:l.title,status:l.status,total_views:Number(l.views)||0,total_phone:Number(l.phone_clicks)||0,fav:0,msgs:0,v:days.map(()=>0),p:days.map(()=>0)}]));
 for(const r of fv.rows){const e=by.get(r.listing_id);if(e)e.fav=r.n;}
 for(const r of ms.rows){const e=by.get(r.listing_id);if(e)e.msgs=r.n;}
 for(const r of st.rows){const e=by.get(r.listing_id),i=idx.get(r.day);if(e&&i!==undefined){e.v[i]=r.views;e.p[i]=r.phone_clicks;}}
 res.json({retention_days:STATS_DAYS,days,listings:[...by.values()]});
}));
app.get('/api/stats/account',auth,requireDb,ah(async(req,res)=>{
 const range=['14d','6m','12m'].includes(req.query.range)?req.query.range:'12m';
 const unit=range==='14d'?'day':'month', n=range==='14d'?14:(range==='6m'?6:12);
 const t=(await pool.query(`SELECT to_char(${TODAY_SQL},'YYYY-MM-DD') d`)).rows[0].d;
 const y=Number(t.slice(0,4)), m=Number(t.slice(5,7)), dd=Number(t.slice(8,10));
 const cols=[];
 for(let i=n-1;i>=0;i--){const x=unit==='day'?new Date(Date.UTC(y,m-1,dd-i)):new Date(Date.UTC(y,m-1-i,1));cols.push(x.toISOString().slice(0,10));}
 const idx=new Map(cols.map((c,i)=>[c,i])), P=[req.user.id,unit,cols[0]];
 const tz=c=>`(${c} AT TIME ZONE 'Europe/Bucharest')`;
 const bk=c=>`to_char(date_trunc($2::text,${tz(c)})::date,'YYYY-MM-DD')`;
 const bkd=`to_char(date_trunc($2::text,s.day::timestamp)::date,'YYYY-MM-DD')`;
 const q=(n,sql,p)=>pool.query(sql,p).catch(e=>{console.error('stats/account '+n+':',e.message);return {rows:[]};});
 const [ad,vw,of,od,fs]=await Promise.all([
  q('ad',`SELECT ${bk('created_at')} b,COUNT(*)::int n FROM listings WHERE user_id=$1 AND ${tz('created_at')}::date>=$3::date AND $2::text<>'' GROUP BY 1`,P),
  q('vw',`SELECT ${bkd} b,COALESCE(SUM(s.views),0)::int v,COALESCE(SUM(s.phone_clicks),0)::int p FROM listing_stats s JOIN listings l ON l.id=s.listing_id WHERE l.user_id=$1 AND s.day>=$3::date AND $2::text<>'' GROUP BY 1`,P),
  q('of',`SELECT ${bk('o.created_at')} b,COUNT(*)::int n,COUNT(*) FILTER (WHERE o.status='accepted')::int won,COUNT(*) FILTER (WHERE o.status='rejected')::int lost,COUNT(*) FILTER (WHERE o.status='pending' AND pr.status<>'open')::int idle FROM offers o JOIN part_requests pr ON pr.id=o.request_id WHERE o.seller_id=$1 AND ${tz('o.created_at')}::date>=$3::date AND $2::text<>'' GROUP BY 1`,P),
  q('od',`SELECT ${bk('created_at')} b,COALESCE(SUM(price),0)::float val FROM orders WHERE seller_id=$1 AND ${tz('created_at')}::date>=$3::date AND $2::text<>'' GROUP BY 1`,P),
  q('fs',`SELECT to_char(MIN(s.day),'YYYY-MM-DD') d FROM listing_stats s JOIN listings l ON l.id=s.listing_id WHERE l.user_id=$1`,[req.user.id])
 ]);
 const z=()=>cols.map(()=>0), rows={added:z(),offers:z(),won:z(),lost:z(),inactive:z(),ord_o_v:z(),views:z(),phone:z()};
 const put=(rs,fn)=>{for(const r of rs){const i=idx.get(r.b);if(i!==undefined)fn(r,i);}};
 put(ad.rows,(r,i)=>{rows.added[i]=r.n;});
 put(vw.rows,(r,i)=>{rows.views[i]=r.v;rows.phone[i]=r.p;});
 put(of.rows,(r,i)=>{rows.offers[i]=r.n;rows.won[i]=r.won;rows.lost[i]=r.lost;rows.inactive[i]=r.idle;});
 put(od.rows,(r,i)=>{rows.ord_o_v[i]=Math.round(r.val);});
 res.json({range,unit,cols,rows,views_since:(fs.rows[0]||{}).d||null});
}));
app.patch('/api/listings/:id/status',auth,requireDb,async(req,res)=>{
 const to=String((req.body||{}).status||'');
 if(!['sold','approved'].includes(to))return res.status(400).json({error:'STATUS_INVALIDE'});
 // Proprietarul poate comuta doar între „publicat” și „vândut”; restul statusurilor (moderare) rămân la admin.
 const r=await pool.query("UPDATE listings SET status=$1 WHERE id=$2 AND user_id=$3 AND status IN ('approved','sold') RETURNING id,status",[to,req.params.id,req.user.id]);
 if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 logEvent(req.user.id,to==='sold'?'listing_sold':'listing_resale','listing',r.rows[0].id,'');
 res.json({listing:r.rows[0]});
});
app.delete('/api/listings/:id',auth,requireDb,async(req,res)=>{
 // Prima ștergere = mutare în „Șterse” (status 'deleted'); a doua = ștergere definitivă.
 const soft=await pool.query("UPDATE listings SET status='deleted' WHERE id=$1 AND user_id=$2 AND status<>'deleted' RETURNING id",[req.params.id,req.user.id]);
 if(soft.rowCount)return res.json({ok:true,deleted:'soft'});
 const hard=await pool.query("DELETE FROM listings WHERE id=$1 AND user_id=$2 AND status='deleted' RETURNING id",[req.params.id,req.user.id]);
 if(!hard.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 res.json({ok:true,deleted:'hard'});
});
app.patch('/api/listings/:id/restore',auth,requireDb,async(req,res)=>{
 // Restaurarea republică anunțul (sau îl trimite la moderare dacă AUTO_APPROVE=false).
 const r=await pool.query("UPDATE listings SET status=$3 WHERE id=$1 AND user_id=$2 AND status='deleted' RETURNING id,status",[req.params.id,req.user.id,NEW_LISTING_STATUS]);
 if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 res.json({listing:r.rows[0]});
});
app.post('/api/listings/:id/bump',auth,requireDb,async(req,res)=>{
 // Reactualizare: anunțul urcă în listă; maximum o dată la 24 de ore.
 const r=await pool.query("UPDATE listings SET created_at=NOW() WHERE id=$1 AND user_id=$2 AND status='approved' AND created_at<NOW()-INTERVAL '24 hours' RETURNING id,created_at",[req.params.id,req.user.id]);
 if(!r.rowCount)return res.status(400).json({error:'REACTUALIZARE_PREA_DEVREME'});
 res.json({listing:r.rows[0]});
});

/* ===== Credite și promovare anunțuri ===== */
const PROMO_PLANS={3:5,7:10,30:30}; // zile -> credite
async function creditMove(db,uid,amount,kind,refId,note,lei){
  const u=await db.query('UPDATE users SET credits=credits+$2 WHERE id=$1 AND credits+$2>=0 RETURNING credits',[uid,amount]);
  if(!u.rowCount)return null;
  await db.query('INSERT INTO credit_tx(user_id,amount,balance_after,kind,ref_id,note,amount_lei) VALUES($1,$2,$3,$4,$5,$6,$7)',[uid,amount,u.rows[0].credits,kind,refId||null,note?String(note).slice(0,200):null,lei||null]);
  return u.rows[0].credits;
}
app.get('/api/credits',auth,requireDb,ah(async(req,res)=>{
  const b=await pool.query('SELECT credits FROM users WHERE id=$1',[req.user.id]);
  const t=await pool.query('SELECT id,amount,balance_after,kind,ref_id,note,amount_lei,created_at FROM credit_tx WHERE user_id=$1 ORDER BY id DESC LIMIT 100',[req.user.id]);
  res.json({balance:(b.rows[0]&&b.rows[0].credits)||0,plans:Object.entries(PROMO_PLANS).map(([days,cost])=>({days:Number(days),cost})),tx:t.rows});
}));
app.post('/api/listings/:id/promote',auth,requireDb,ah(async(req,res)=>{
  const days=Math.floor(Number((req.body||{}).days)),cost=PROMO_PLANS[days];
  if(!cost)return res.status(400).json({error:'PLAN_INVALID'});
  const id=Math.floor(Number(req.params.id));
  if(!Number.isInteger(id)||id<=0)return res.status(404).json({error:'NOT_FOUND'});
  const c=await pool.connect();
  try{
    await c.query('BEGIN');
    const l=await c.query("SELECT id,title FROM listings WHERE id=$1 AND user_id=$2 AND status='approved' FOR UPDATE",[id,req.user.id]);
    if(!l.rowCount){await c.query('ROLLBACK');return res.status(404).json({error:'NOT_FOUND'});}
    const bal=await creditMove(c,req.user.id,-cost,'promo',id,'Promovare '+days+(days===1?' zi: ':' zile: ')+l.rows[0].title);
    if(bal===null){await c.query('ROLLBACK');return res.status(402).json({error:'CREDITE_INSUFICIENTE'});}
    const r=await c.query("UPDATE listings SET promoted_until=GREATEST(COALESCE(promoted_until,NOW()),NOW())+($2::int*INTERVAL '1 day') WHERE id=$1 RETURNING promoted_until",[id,days]);
    await c.query('COMMIT');
    res.json({ok:true,balance:bal,promoted_until:r.rows[0].promoted_until});
  }catch(e){try{await c.query('ROLLBACK');}catch{}throw e;}
  finally{c.release();}
}));
app.post('/api/admin/users/:id/credits',auth,admin,requireDb,ah(async(req,res)=>{
  const uid=Math.floor(Number(req.params.id)),amount=Math.trunc(Number((req.body||{}).amount));
  if(!Number.isInteger(uid)||uid<=0||!Number.isFinite(amount)||amount===0||Math.abs(amount)>100000)return res.status(400).json({error:'DATE_INVALIDE'});
  const lei=Number((req.body||{}).lei)>0?Number(req.body.lei):null;
  const note=String((req.body||{}).note||'').trim().slice(0,200)||(amount>0?'Credite adăugate de administrator':'Credite retrase de administrator');
  const bal=await creditMove(pool,uid,amount,lei&&amount>0?'topup':'admin',null,note,lei);
  if(bal===null)return res.status(400).json({error:'SOLD_INSUFICIENT'});
  await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,'credits','user',uid,(amount>0?'+':'')+amount+' · '+note]);
  notify(uid,amount>0?'Ai primit '+amount+' credite în cont.':'Au fost retrase '+(-amount)+' credite din cont.');
  res.json({ok:true,balance:bal});
}));
app.get('/api/sellers',requireDb,async(req,res)=>{
 const r=await pool.query("SELECT u.id,COALESCE(u.nickname,u.name) name,COUNT(*)::int n,BOOL_OR(l.type='dezmembrari') dism,MAX(l.county) county,(SELECT ROUND(AVG(stars),1)::float FROM seller_ratings sr WHERE sr.seller_id=u.id) rating_avg,(SELECT COUNT(*)::int FROM seller_ratings sr WHERE sr.seller_id=u.id) rating_n FROM listings l JOIN users u ON u.id=l.user_id WHERE l.status='approved' AND NOT "+VAC_SQL('u')+" GROUP BY u.id,u.nickname,u.name ORDER BY n DESC LIMIT 100");
 res.json({sellers:r.rows});
});
/* ===== Notificări email, export date, ștergere cont ===== */
app.put('/api/account/notif-prefs',requireDb,auth,ah(async(req,res)=>{
  const b=req.body||{};
  await pool.query('UPDATE users SET mail_msg=$1,mail_offer=$2,mail_order=$3,mail_alert=COALESCE($5,mail_alert) WHERE id=$4',[!!b.mail_msg,!!b.mail_offer,!!b.mail_order,req.user.id,b.mail_alert===undefined?null:!!b.mail_alert]);
  res.json({ok:true});
}));
app.get('/api/account/export',requireDb,auth,ah(async(req,res)=>{
  if(!throttle(authAttempts,'exp:'+req.user.id,3,60*60*1000))return res.status(429).json({error:'PREA_MULTE_CERERI'});
  const uid=req.user.id,q=async sql=>(await pool.query(sql,[uid])).rows;
  const [account,phones,listings,favorites,requests,offers,orders,messages,notifications,reports,blocked,saved]=await Promise.all([
    q('SELECT id,name,nickname,email,phone,show_phone,role,status,email_verified,created_at,terms_accepted_at,ship_county,ship_city,ship_details,bill_company,bill_cui,bill_regcom,bill_address,bill_bank,bill_iban,store_name,store_site,mail_msg,mail_offer,mail_order,mail_alert,vacation,vacation_until FROM users WHERE id=$1'),
    q('SELECT phone,is_whatsapp,verified,created_at FROM user_phones WHERE user_id=$1 ORDER BY id'),
    q('SELECT id,type,title,price,condition,make,model,generation,year,engine,fuel,category,subcategory,oem,vin,km,quantity,negotiable,delivery,county,description,status,views,COALESCE(cardinality(images),0) image_count,created_at FROM listings WHERE user_id=$1 ORDER BY id'),
    q('SELECT listing_id FROM favorites WHERE user_id=$1'),
    q('SELECT id,title,make,model,year,description,status,created_at FROM part_requests WHERE user_id=$1 ORDER BY id'),
    q('SELECT id,request_id,price,message,status,created_at FROM offers WHERE seller_id=$1 ORDER BY id'),
    q('SELECT id,title,price,quantity,status,created_at,(buyer_id=$1) AS as_buyer FROM orders WHERE buyer_id=$1 OR seller_id=$1 ORDER BY id'),
    q('SELECT id,sender_id,recipient_id,body,created_at FROM messages WHERE sender_id=$1 OR recipient_id=$1 ORDER BY id'),
    q('SELECT text,is_read,created_at FROM notifications WHERE user_id=$1 ORDER BY id'),
    q('SELECT listing_id,reason,details,status,created_at FROM reports WHERE reporter_id=$1 ORDER BY id'),
    q('SELECT blocked_id,created_at FROM user_blocks WHERE blocker_id=$1 ORDER BY created_at'),
    q('SELECT label,qs,alerts,created_at FROM saved_searches WHERE user_id=$1 ORDER BY id')
  ]);
  const data={exported_at:new Date().toISOString(),note:'Pozele nu sunt incluse (doar numărul lor). Parola nu se exportă.',account:account[0]||null,phones,listings,favorites:favorites.map(f=>f.listing_id),requests,offers,orders,messages,notifications,reports,blocked_users:blocked,saved_searches:saved};
  res.set({'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="autoparts-date-cont-'+uid+'.json"','Cache-Control':'no-store'});
  res.send(JSON.stringify(data,null,2));
}));
app.post('/api/account/delete',requireDb,auth,ah(async(req,res)=>{
  if(!throttle(authAttempts,'del:'+req.user.id,5,15*60*1000))return res.status(429).json({error:'LOGIN_RATE_LIMIT'});
  if(req.user.role==='admin')return res.status(403).json({error:'ADMIN_NU_SE_STERGE'});
  const pw=String((req.body&&req.body.password)||'');
  const u=(await pool.query('SELECT password_hash FROM users WHERE id=$1',[req.user.id])).rows[0];
  if(!pw||!u||!(await bcrypt.compare(pw,u.password_hash)))return res.status(401).json({error:'PAROLA_GRESITA'});
  const open=await pool.query("SELECT 1 FROM orders WHERE (buyer_id=$1 OR seller_id=$1) AND status IN ('new','confirmed','shipped','suspended') LIMIT 1",[req.user.id]);
  if(open.rowCount)return res.status(409).json({error:'COMENZI_ACTIVE'});
  const c=await pool.connect();
  try{
    await c.query('BEGIN');
    await c.query('DELETE FROM listings WHERE user_id=$1',[req.user.id]);
    await c.query('DELETE FROM part_requests WHERE user_id=$1',[req.user.id]);
    await c.query('DELETE FROM users WHERE id=$1',[req.user.id]);
    await c.query('COMMIT');
  }catch(e){try{await c.query('ROLLBACK');}catch{}throw e;}finally{c.release();}
  deleteStoredImages(req.user.id);
  logEvent(null,'account_delete','user',req.user.id,(req.user.nickname||req.user.name||'')+' · '+(req.user.email||''));
  res.clearCookie('session',{httpOnly:true,sameSite:'lax',secure:IS_PROD,path:'/'});
  res.json({ok:true});
}));
/* ===== Poză de profil (avatar) ===== */
const AVATAR_MAX=200000;
app.get('/api/users/:id(\\d+)/avatar',requireDb,ah(async(req,res)=>{
  const r=await pool.query("SELECT avatar,store_logo FROM users WHERE id=$1 AND status='active'",[Number(req.params.id)]);
  const row=r.rows[0]||{}; const v=row.avatar||row.store_logo;
  if(!v){res.set('Cache-Control','public, max-age=300');return res.status(404).end();}
  const m=/^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(v);
  if(m){res.set('Cache-Control','public, max-age=300').type('image/'+m[1]).send(Buffer.from(m[2],'base64'));return;}
  if(isStoredUrl(v)){res.set('Cache-Control','public, max-age=300');return res.redirect(302,v);}
  res.status(404).end();
}));
app.put('/api/account/avatar',requireDb,auth,ah(async(req,res)=>{
  const b=req.body||{};
  if(b.remove===true){await pool.query('UPDATE users SET avatar=NULL WHERE id=$1',[req.user.id]);return res.json({ok:true,has_avatar:false});}
  if(!isDataImg(b.avatar)||b.avatar.length>AVATAR_MAX)return res.status(400).json({error:'POZA_INVALIDA'});
  let url;
  try{url=(await storeImages([b.avatar],req.user.id))[0];}catch{return res.status(502).json({error:'STORAGE_EROARE'});}
  await pool.query('UPDATE users SET avatar=$1 WHERE id=$2',[url,req.user.id]);
  res.json({ok:true,has_avatar:true});
}));
/* ===== Logo-uri magazine (rând în subsolul site-ului) ===== */
const STORE_LOGO_MAX=450000;
app.get('/api/stores/logos',requireDb,ah(async(req,res)=>{
  const r=await pool.query("SELECT u.id,COALESCE(NULLIF(u.store_name,''),NULLIF(u.bill_company,''),u.nickname,u.name) name,COUNT(l.id)::int n FROM users u JOIN listings l ON l.user_id=u.id AND l.status='approved' WHERE u.status='active' AND u.store_logo IS NOT NULL GROUP BY u.id ORDER BY n DESC,u.id LIMIT 30");
  res.set('Cache-Control','public, max-age=300');
  res.json({stores:r.rows});
}));
app.get('/api/stores/:id(\\d+)/logo',requireDb,ah(async(req,res)=>{
  const r=await pool.query("SELECT store_logo FROM users WHERE id=$1 AND status='active'",[Number(req.params.id)]);
  const v=r.rows[0]&&r.rows[0].store_logo;
  if(!v)return res.status(404).end();
  const m=/^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(v);
  if(m){res.set('Cache-Control','public, max-age=300').type('image/'+m[1]).send(Buffer.from(m[2],'base64'));return;}
  if(isStoredUrl(v)){res.set('Cache-Control','public, max-age=300');return res.redirect(302,v);}
  res.status(404).end();
}));
app.put('/api/account/store',requireDb,auth,ah(async(req,res)=>{
  const b=req.body||{};
  const name=String(b.store_name||'').trim().slice(0,60);
  const site=String(b.store_site||'').trim().slice(0,200);
  if(site&&!/^https?:\/\/[^\s<>"']+$/i.test(site))return res.status(400).json({error:'SITE_INVALID'});
  const cur=(await pool.query('SELECT store_logo FROM users WHERE id=$1',[req.user.id])).rows[0]||{};
  let logo=cur.store_logo||null;
  if(b.remove_logo===true)logo=null;
  else if(b.logo){
    if(!isDataImg(b.logo)||b.logo.length>STORE_LOGO_MAX)return res.status(400).json({error:'LOGO_INVALID'});
    logo=(await storeImages([b.logo],req.user.id))[0];
  }
  await pool.query('UPDATE users SET store_name=$1,store_site=$2,store_logo=$3 WHERE id=$4',[name||null,site||null,logo,req.user.id]);
  res.json({ok:true,has_logo:!!logo});
}));
app.get('/api/sellers/:id',requireDb,ah(async(req,res)=>{
 const id=Number(req.params.id);
 if(!Number.isInteger(id)||id<=0)return res.status(404).json({error:'NOT_FOUND'});
 const u=(await pool.query("SELECT id,COALESCE(nickname,name) nick,show_phone,bill_company,created_at,"+VAC_SQL('users')+" on_vac,vacation_until::text vac_until FROM users WHERE id=$1 AND status='active'",[id])).rows[0];
 if(!u)return res.status(404).json({error:'NOT_FOUND'});
 const s=(await pool.query("SELECT COUNT(*)::int n,COALESCE(BOOL_OR(type='dezmembrari'),FALSE) dism,(ARRAY_AGG(seller_type ORDER BY created_at DESC))[1] seller_type,(ARRAY_AGG(county ORDER BY created_at DESC) FILTER (WHERE county IS NOT NULL AND county<>''))[1] county FROM listings WHERE user_id=$1 AND status='approved'",[id])).rows[0];
 const phones=u.show_phone?(await pool.query('SELECT phone,is_whatsapp FROM user_phones WHERE user_id=$1 ORDER BY id',[id])).rows:[];
 const isCompany=s.dism||(s.seller_type&&s.seller_type!=='Persoană fizică');
 const me=await optUserId(req); const blocked=me&&me!==id?(await blockState(me,id)).byMe:false;
 const rt=(await pool.query('SELECT ROUND(AVG(stars),1)::float avg,COUNT(*)::int n FROM seller_ratings WHERE seller_id=$1',[id])).rows[0];
 const bt=(await pool.query('SELECT ROUND(AVG(stars),1)::float avg,COUNT(*)::int n FROM buyer_ratings WHERE buyer_id=$1',[id])).rows[0];
 res.json({seller:{rating:{avg:rt.avg,count:rt.n},buyer_rating:{avg:bt.avg,count:bt.n},id:u.id,name:u.nick,seller_type:s.seller_type||null,dism:s.dism,county:s.county||null,count:s.n,since:u.created_at,company:isCompany&&u.bill_company?u.bill_company:null,phones,vacation:u.on_vac?{until:u.vac_until}:null,blocked_by_me:blocked}});
}));
// Validare comună pentru publicare și editare anunț. Returnează {error,status} sau {v}.
function parseListing(x){
 const bad=(error,status=400)=>({error,status});
 if(!['piesa','dezmembrari'].includes(x.type)||typeof x.title!=='string'||x.title.trim().length<3||x.title.length>150)return bad('DATE_INVALIDE');
 if(x.type==='dezmembrari'&&!String(x.category||'').trim())x.category='Diverse';
 if(!String(x.category||'').trim()||!CATEGORIES.includes(x.category)||!String(x.make||'').trim()||!String(x.model||'').trim()||!String(x.county||'').trim())return bad('DATE_INVALIDE');
 if(x.type==='piesa'&&!['Nouă','Second-hand'].includes(x.condition))return bad('STARE_INVALIDA');
 const price=Number(x.price)||0; if(price<0||price>10000000)return bad('DATE_INVALIDE');
 // Moderare automată (ca pe site-urile de profil): fără linkuri/emailuri în text și fără prețuri neserioase.
 if(price>0&&price<5)return bad('PRET_NEREALIST');
 if(/(https?:\/\/|www\.|\b[a-z0-9-]{2,}\.(ro|com|net|org|eu|info|biz|shop|store|online|site|xyz)\b|\S+@\S+\.\S+)/i.test(String(x.title||'')+' '+String(x.description||'')))return bad('LINK_INTERZIS');
 if(x.year!=null&&String(x.year).trim()!==''){const ys=String(x.year).trim(),yr=Number(ys);if(!/^\d{4}$/.test(ys)||yr<1950||yr>new Date().getFullYear()+1)return bad('AN_INVALID');}
 if(x.seller_type&&!SELLER_TYPES.includes(x.seller_type))return bad('DATE_INVALIDE');
 if(x.km!=null&&String(x.km).trim()!==''){const k=Number(x.km);if(!Number.isFinite(k)||k<0||k>3000000)return bad('DATE_INVALIDE');}
 const images=Array.isArray(x.images)?x.images.slice(0,8):[];
 for(const img of images){if(typeof img!=='string'||!(isDataImg(img)||isStoredUrl(img)))return bad('POZA_INVALIDA');if(img.length>700000)return bad('POZE_PREA_MARI');}
 if(images.reduce((n,v)=>n+v.length,0)>4500000)return bad('POZE_PREA_MARI');
 return {v:{type:x.type,title:x.title.trim(),price,condition:x.type==='dezmembrari'?(clip(x.condition,30)||'Second-hand'):clip(x.condition,30),make:clip(x.make,60),model:clip(x.model,80),
  year:clip(x.year,10),seller_type:clip(x.seller_type,30),quantity:x.quantity==null?null:Math.min(9999,Math.max(1,Number(x.quantity)||1)),negotiable:!!x.negotiable,county:clip(x.county,60),
  category:clip(x.category,60),subcategory:clip(x.subcategory,80),oem:clip(x.oem,60),delivery:!!x.delivery,description:String(x.description||'').slice(0,5000),images,
  generation:clip(x.generation,80),engine:clip(x.engine,80),fuel:clip(x.fuel,30),vehicle_id:clip(x.vehicle_id,120),
  km:(x.km==null||String(x.km).trim()==='')?null:Math.round(Number(x.km)),vin:clip(String(x.vin||'').toUpperCase().replace(/[^A-Z0-9]/g,''),30),
  parts_avail:clip(String(x.parts_avail||'').split(',').map(t=>t.trim()).filter(Boolean).slice(0,30).join(', '),600)}};
}
const imgBytes=a=>a.reduce((n,v)=>n+v.length,0);
async function imageQuotaExceeded(userId,images,excludeId=0,excludeOfferId=0){
 const used=(await pool.query("SELECT ((SELECT COALESCE(SUM(length(array_to_string(images,''))),0) FROM listings WHERE user_id=$1 AND id<>$2)+(SELECT COALESCE(SUM(length(array_to_string(images,''))),0) FROM part_requests WHERE user_id=$1)+(SELECT COALESCE(SUM(length(array_to_string(images,''))),0) FROM offers WHERE seller_id=$1 AND id<>$3))::bigint n",[userId,excludeId,excludeOfferId])).rows[0].n;
 return Number(used)+imgBytes(images)>60*1024*1024;
}
// Poze pentru cereri si oferte (aceleasi reguli ca la anunturi, dar maximum 6).
function parseExtraImages(raw,max=6){
 if(raw==null)return {images:[]};
 if(!Array.isArray(raw))return {error:'POZA_INVALIDA'};
 const images=raw.slice(0,max);
 for(const img of images){if(typeof img!=='string'||!(isDataImg(img)||isStoredUrl(img)))return {error:'POZA_INVALIDA'};if(img.length>700000)return {error:'POZE_PREA_MARI'};}
 if(imgBytes(images)>4500000)return {error:'POZE_PREA_MARI'};
 return {images};
}
app.post('/api/listings',auth,needVerified,requireDb,async(req,res)=>{
 if(!throttle(authAttempts,'lst:'+req.user.id,30,60*60*1000))return res.status(429).json({error:'PREA_MULTE_ANUNTURI'});
 const p=parseListing(req.body||{}); if(p.error)return res.status(p.status).json({error:p.error});
 const v=p.v;
 if(await imageQuotaExceeded(req.user.id,v.images))return res.status(413).json({error:'SPATIU_POZE_DEPASIT'});
 try{v.images=await storeImages(v.images,req.user.id);}catch{return res.status(502).json({error:'STORAGE_EROARE'});}
 // Cont gratuit: maximum 100 de anunțuri active (la început; schimbabil cu ACTIVE_LISTINGS_LIMIT) (publicate sau în așteptare; cele vândute nu se numără), ca pe site-urile de profil. Adminul nu are limită.
 if(req.user.role!=='admin'){const act=await pool.query("SELECT COUNT(*)::int n FROM listings WHERE user_id=$1 AND status IN ('approved','pending')",[req.user.id]);if(act.rows[0].n>=ACTIVE_LISTINGS_LIMIT)return res.status(403).json({error:'LIMITA_ANUNTURI'});}
 const r=await pool.query(`INSERT INTO listings(user_id,type,title,price,condition,make,model,generation,year,engine,fuel,vehicle_id,seller_type,quantity,negotiable,county,category,oem,delivery,description,images,status,subcategory,km,vin,parts_avail) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26) RETURNING *`,
  [req.user.id,v.type,v.title,v.price,v.condition,v.make,v.model,v.generation,v.year,v.engine,v.fuel,v.vehicle_id,v.seller_type,v.quantity||1,v.negotiable,v.county,v.category,v.oem,v.delivery,v.description,v.images,NEW_LISTING_STATUS,v.subcategory,v.km,v.vin,v.parts_avail]);
 if(NEW_LISTING_STATUS==='approved')alertForListings([r.rows[0].id]);
 logEvent(req.user.id,'listing_create','listing',r.rows[0].id,v.title);
 res.status(201).json({listing:r.rows[0]});
});
// Anunțul propriu, cu toate pozele, în orice stare (pentru formularul de editare).
app.get('/api/listings/mine/:id',auth,requireDb,async(req,res)=>{
 const r=await pool.query('SELECT * FROM listings WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);
 if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 res.json({listing:r.rows[0]});
});
// Editare anunț. Prețul, livrarea, județul etc. se schimbă direct; textul, pozele și datele piesei/mașinii
// trimit anunțul din nou la moderare (ca să nu se poată schimba conținutul după aprobare).
app.patch('/api/listings/:id',auth,needVerified,requireDb,async(req,res)=>{
 const cur=(await pool.query('SELECT * FROM listings WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id])).rows[0];
 if(!cur)return res.status(404).json({error:'NOT_FOUND'});
 if(cur.status==='blocked')return res.status(403).json({error:'INTERZIS'});
 const p=parseListing(req.body||{}); if(p.error)return res.status(p.status).json({error:p.error});
 const v=p.v;
 if(await imageQuotaExceeded(req.user.id,v.images,cur.id))return res.status(413).json({error:'SPATIU_POZE_DEPASIT'});
 try{v.images=await storeImages(v.images,req.user.id);}catch{return res.status(502).json({error:'STORAGE_EROARE'});}
 const norm2=a=>String(a==null?'':a).trim();
 const contentChanged=['type','title','description','category','subcategory','make','model','oem','year'].some(k=>norm2(cur[k])!==norm2(v[k]))||JSON.stringify([...(cur.images||[])].sort())!==JSON.stringify([...(v.images||[])].sort());
 let status=cur.status;
 if(contentChanged&&['approved','sold','rejected'].includes(cur.status)){
  // Aprobare automată: anunțurile publicate/vândute rămân în starea lor după editare; cele respinse de admin revin la moderare.
  if(!AUTO_APPROVE||cur.status==='rejected'){
   const pend=await pool.query("SELECT COUNT(*)::int n FROM listings WHERE user_id=$1 AND status='pending'",[req.user.id]);
   if(pend.rows[0].n>=20)return res.status(429).json({error:'PREA_MULTE_ANUNTURI'});
   status='pending';
  }
 }
 const r=await pool.query('UPDATE listings SET type=$1,title=$2,price=$3,condition=$4,make=$5,model=$6,year=$7,seller_type=$8,quantity=$9,negotiable=$10,county=$11,category=$12,oem=$13,delivery=$14,description=$15,images=$16,status=$17,subcategory=$20,km=$21,vin=$22,parts_avail=$23,engine=$24 WHERE id=$18 AND user_id=$19 RETURNING id,status',
  [v.type,v.title,v.price,v.condition,v.make,v.model,v.year,v.seller_type,v.quantity||cur.quantity||1,v.negotiable,v.county,v.category,v.oem,v.delivery,v.description,v.images,status,cur.id,req.user.id,v.subcategory,v.km,v.vin,v.parts_avail,v.engine]);
 logEvent(req.user.id,'listing_edit','listing',cur.id,v.title+(status==='pending'&&cur.status!=='pending'?' (retrimis la moderare)':''));
 res.json({listing:r.rows[0],resubmitted:status==='pending'&&cur.status!=='pending'});
});

app.get('/api/requests',requireDb,async(req,res)=>{
 const r=await pool.query("SELECT r.id,r.title,r.make,r.model,r.year,r.variant,r.engine,r.kind,r.county,r.city,r.extra_parts,r.description,r.created_at,r.images[1:1] images,r.user_id,COALESCE(u.nickname,u.name) user_name,"+BUYER_RATE('r.user_id','user_rating')+" FROM part_requests r LEFT JOIN users u ON u.id=r.user_id WHERE r.status='open' ORDER BY r.created_at DESC LIMIT 100");
 res.json({requests:r.rows});
});
app.get('/api/requests/mine',auth,requireDb,async(req,res)=>{
 const r=await pool.query("SELECT r.id,r.title,r.make,r.model,r.year,r.variant,r.engine,r.vin,r.description,r.extra_parts,r.status,r.created_at,r.images[1:1] images,GREATEST(0,CEIL(EXTRACT(EPOCH FROM (r.created_at+INTERVAL '10 minutes'-NOW()))))::int edit_secs,(SELECT COUNT(*)::int FROM offers o WHERE o.request_id=r.id) offers_count,(SELECT COUNT(*)::int FROM offers o WHERE o.request_id=r.id AND o.status='pending') offers_pending FROM part_requests r WHERE r.user_id=$1 ORDER BY r.created_at DESC LIMIT 200",[req.user.id]);
 res.json({requests:r.rows});
});
app.get('/api/requests/mine/:id',auth,requireDb,ah(async(req,res)=>{
 const q=await pool.query("SELECT r.id,r.title,r.make,r.model,r.year,r.variant,r.engine,r.vin,r.kind,r.county,r.city,r.ship_address,r.description,r.extra_parts,r.status,r.created_at,r.images,GREATEST(0,CEIL(EXTRACT(EPOCH FROM (r.created_at+INTERVAL '10 minutes'-NOW()))))::int edit_secs FROM part_requests r WHERE r.id=$1 AND r.user_id=$2",[req.params.id,req.user.id]);
 if(!q.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 const o=await pool.query("SELECT o.id,o.price,o.message,o.images,o.status,o.created_at,o.updated_at,o.seller_id,CASE WHEN o.status='accepted' THEN COALESCE(NULLIF(u.bill_company,''),NULLIF(u.name,''),u.nickname) ELSE COALESCE(NULLIF(u.bill_company,''),u.nickname,u.name) END seller_name,COALESCE(u.nickname,u.name) seller_nick,NULLIF(u.bill_company,'') company,CASE WHEN o.status='accepted' THEN u.name END seller_person,(u.store_logo IS NOT NULL) seller_has_logo,(u.avatar IS NOT NULL OR u.store_logo IS NOT NULL) seller_has_avatar,u.phone user_phone,(SELECT od.id FROM orders od WHERE od.offer_id=o.id LIMIT 1) order_id,(SELECT od.created_at FROM orders od WHERE od.offer_id=o.id LIMIT 1) resolved_at,(SELECT od.status FROM orders od WHERE od.offer_id=o.id LIMIT 1) order_status,(SELECT od.status_reason FROM orders od WHERE od.offer_id=o.id LIMIT 1) order_reason,(SELECT sr.stars FROM seller_ratings sr JOIN orders od ON od.id=sr.order_id WHERE od.offer_id=o.id LIMIT 1) given_stars,(SELECT sr.comment FROM seller_ratings sr JOIN orders od ON od.id=sr.order_id WHERE od.offer_id=o.id LIMIT 1) given_comment,"+SELLER_RATE('o.seller_id','seller_rating')+" FROM offers o LEFT JOIN users u ON u.id=o.seller_id WHERE o.request_id=$1 ORDER BY (o.status='accepted') DESC,(o.status='pending') DESC,o.price ASC,o.created_at DESC",[req.params.id]);
 const ids=[...new Set(o.rows.filter(x=>x.status!=='rejected'&&x.seller_id).map(x=>x.seller_id))];
 const ph=ids.length?(await pool.query('SELECT user_id,phone,is_whatsapp FROM user_phones WHERE user_id=ANY($1::int[]) ORDER BY id',[ids])).rows:[];
 const offers=o.rows.map(x=>{
  let phones=x.status==='rejected'?[]:ph.filter(p=>p.user_id===x.seller_id).map(p=>({phone:p.phone,is_whatsapp:p.is_whatsapp}));
  if(!phones.length&&x.status!=='rejected'&&x.user_phone)phones=[{phone:x.user_phone,is_whatsapp:false}];
  const {user_phone,...rest}=x; return {...rest,phones};
 });
 res.json({request:q.rows[0],offers});
}));
app.get('/api/requests/:id(\\d+)',requireDb,ah(async(req,res)=>{
 const r=await pool.query("SELECT r.id,r.title,r.make,r.model,r.year,r.variant,r.engine,r.kind,r.county,r.city,r.extra_parts,r.description,r.created_at,r.images,r.user_id,COALESCE(u.nickname,u.name) user_name,"+BUYER_RATE('r.user_id','user_rating')+" FROM part_requests r LEFT JOIN users u ON u.id=r.user_id WHERE r.id=$1 AND r.status='open'",[req.params.id]);
 if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 res.json({request:r.rows[0]});
}));
app.get('/api/requests/:id/contact',auth,requireDb,async(req,res)=>{
 const q=await pool.query("SELECT user_id FROM part_requests WHERE id=$1 AND status='open'",[req.params.id]);
 if(!q.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 const u=(await pool.query('SELECT show_phone FROM users WHERE id=$1',[q.rows[0].user_id])).rows[0];
 const phones=u&&u.show_phone?(await pool.query('SELECT phone,is_whatsapp FROM user_phones WHERE user_id=$1 ORDER BY id',[q.rows[0].user_id])).rows:[];
 res.json({phones});
});
app.delete('/api/requests/:id',auth,requireDb,async(req,res)=>{
 const d=await pool.query('DELETE FROM part_requests WHERE id=$1 AND user_id=$2 RETURNING id',[req.params.id,req.user.id]);
 if(!d.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 res.json({ok:true});
});
app.patch('/api/requests/:id',auth,needVerified,requireDb,ah(async(req,res)=>{
 if(!/^\d{1,10}$/.test(req.params.id))return res.status(400).json({error:'ID_INVALID'});
 if(!throttle(authAttempts,'reqedit:'+req.user.id,30,60*60*1000))return res.status(429).json({error:'PREA_MULTE_ANUNTURI'});
 const {title,make,model,year,description,variant,engine,vin,kind,county,city,ship_address,extra_parts,images:rawImages}=req.body||{};
 if(typeof title!=='string'||title.trim().length<3||title.length>150)return res.status(400).json({error:'DATE_INVALIDE'});
 let newImages=null;
 if(rawImages!==undefined){const pi=parseExtraImages(rawImages,6);if(pi.error)return res.status(400).json({error:pi.error});if(pi.images.length&&await imageQuotaExceeded(req.user.id,pi.images))return res.status(413).json({error:'SPATIU_POZE_DEPASIT'});try{newImages=await storeImages(pi.images,req.user.id);}catch{return res.status(502).json({error:'STORAGE_EROARE'});}}
 const extra=JSON.stringify((Array.isArray(extra_parts)?extra_parts:[]).slice(0,9).map(p=>({title:clip(p&&p.title,150),details:clip(p&&p.details,500)})).filter(p=>p.title));
 // Modificarea e permisă doar proprietarului, doar în primele 10 minute de la publicare.
 const r=await pool.query("UPDATE part_requests SET title=$3,make=$4,model=$5,year=$6,description=$7,variant=$8,engine=$9,vin=$10,kind=$11,county=$12,city=$13,extra_parts=$14,ship_address=$15,images=COALESCE($16::text[],images) WHERE id=$1 AND user_id=$2 AND status='open' AND created_at>NOW()-INTERVAL '10 minutes' RETURNING id,title,status,created_at",[req.params.id,req.user.id,title.trim(),clip(make,60),clip(model,80),clip(year,10),String(description||'').slice(0,5000),clip(variant,60),clip(engine,60),clip(vin,30),['noi','second-hand','ambele'].includes(kind)?kind:'ambele',clip(county,60),clip(city,80),extra,clip(ship_address,300),newImages]);
 if(!r.rowCount){const ex=await pool.query('SELECT 1 FROM part_requests WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);return ex.rowCount?res.status(403).json({error:'EDIT_EXPIRAT'}):res.status(404).json({error:'NOT_FOUND'});}
 res.json({request:r.rows[0]});
}));
app.post('/api/requests',auth,needVerified,requireDb,async(req,res)=>{if(!throttle(authAttempts,'req:'+req.user.id,10,60*60*1000))return res.status(429).json({error:'PREA_MULTE_ANUNTURI'});const {title,make,model,year,description,variant,engine,vin,kind,county,city,ship_address,extra_parts,images:rawImages}=req.body||{};if(typeof title!=='string'||title.trim().length<3||title.length>150)return res.status(400).json({error:'DATE_INVALIDE'});const pi=parseExtraImages(rawImages,6);if(pi.error)return res.status(400).json({error:pi.error});if(pi.images.length&&await imageQuotaExceeded(req.user.id,pi.images))return res.status(413).json({error:'SPATIU_POZE_DEPASIT'});try{pi.images=await storeImages(pi.images,req.user.id);}catch{return res.status(502).json({error:'STORAGE_EROARE'});}const r=await pool.query('INSERT INTO part_requests(user_id,title,make,model,year,description,variant,engine,vin,kind,county,city,extra_parts,images,ship_address) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id,title,status,created_at',[req.user.id,title.trim(),clip(make,60),clip(model,80),clip(year,10),String(description||'').slice(0,5000),clip(variant,60),clip(engine,60),clip(vin,30),['noi','second-hand','ambele'].includes(kind)?kind:'ambele',clip(county,60),clip(city,80),JSON.stringify((Array.isArray(extra_parts)?extra_parts:[]).slice(0,9).map(p=>({title:clip(p&&p.title,150),details:clip(p&&p.details,500)})).filter(p=>p.title)),pi.images,clip(ship_address,300)]);res.status(201).json({request:r.rows[0]});});

app.get('/api/admin/overview',auth,admin,requireDb,async(req,res)=>{try{const q=async(s)=>Number((await pool.query(s)).rows[0].n);const recent=await pool.query(`SELECT l.id,l.title,l.price,l.status,l.type,l.created_at,u.name seller_name FROM listings l LEFT JOIN users u ON u.id=l.user_id ORDER BY l.created_at DESC LIMIT 8`);res.json({stats:{users:await q('SELECT COUNT(*) n FROM users'),activeUsers:await q("SELECT COUNT(*) n FROM users WHERE status='active'"),listings:await q('SELECT COUNT(*) n FROM listings'),approved:await q("SELECT COUNT(*) n FROM listings WHERE status='approved'"),pending:await q("SELECT COUNT(*) n FROM listings WHERE status='pending'"),rejected:await q("SELECT COUNT(*) n FROM listings WHERE status='rejected'"),reports:await q("SELECT COUNT(*) n FROM reports WHERE status='open'"),requests:await q("SELECT COUNT(*) n FROM part_requests WHERE status='open'"),offers:await q('SELECT COUNT(*) n FROM offers'),orders:await q('SELECT COUNT(*) n FROM orders'),messages:await q('SELECT COUNT(*) n FROM messages')},recent:recent.rows});}catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}});
app.get('/api/admin/listings',auth,admin,requireDb,async(req,res)=>{const r=await pool.query('SELECT l.id,l.user_id,l.type,l.title,l.price,l.condition,l.make,l.model,l.year,l.county,l.category,l.oem,l.description,l.status,l.created_at,l.views,COALESCE(array_length(l.images,1),0) image_count,u.name seller_name,u.email seller_email,u.phone seller_phone,u.show_phone seller_show_phone FROM listings l LEFT JOIN users u ON u.id=l.user_id ORDER BY (l.status=\'pending\') DESC, l.created_at DESC LIMIT 300');res.json({listings:r.rows});});
app.patch('/api/admin/listings/:id',auth,admin,requireDb,async(req,res)=>{const status=req.body.status;if(!['pending','approved','rejected','blocked'].includes(status))return res.status(400).json({error:'STATUS_INVALIDE'});const r=await pool.query('UPDATE listings SET status=$1 WHERE id=$2 RETURNING *',[status,req.params.id]);if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,'update_listing','listing',req.params.id,status]);if(status==='approved')alertForListings([r.rows[0].id]);res.json({listing:r.rows[0]});});
app.post('/api/admin/listings/approve-all',auth,admin,requireDb,ah(async(req,res)=>{const r=await pool.query("UPDATE listings SET status='approved' WHERE status='pending' RETURNING id");await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,'approve_all','listing',null,String(r.rowCount)]);alertForListings(r.rows.map(x=>x.id));res.json({approved:r.rowCount});}));
app.get('/api/admin/listings/:id/img/:n',auth,admin,requireDb,ah(async(req,res)=>{
 const n=Math.max(0,Math.floor(Number(req.params.n))||0);
 const r=await pool.query('SELECT images[$2::int] img FROM listings WHERE id=$1',[req.params.id,n+1]);
if(r.rowCount&&/^https?:\/\//.test(r.rows[0].img||''))return res.redirect(r.rows[0].img);
 const m=r.rowCount&&/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(r.rows[0].img||'');
 if(!m)return res.status(404).end();
 res.set({'Content-Type':m[1],'Cache-Control':'private, max-age=3600'}).send(Buffer.from(m[2],'base64'));
}));
app.get('/api/admin/listings/:id',auth,admin,requireDb,ah(async(req,res)=>{
 const r=await pool.query('SELECT l.*,u.name seller_name,u.email seller_email,u.phone seller_phone FROM listings l LEFT JOIN users u ON u.id=l.user_id WHERE l.id=$1',[req.params.id]);
 if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 const x=r.rows[0]; x.image_count=Array.isArray(x.images)?x.images.length:0; delete x.images;
 res.json({listing:x});
}));
app.delete('/api/admin/listings/:id',auth,admin,requireDb,async(req,res)=>{const d=await pool.query('DELETE FROM listings WHERE id=$1 RETURNING id',[req.params.id]);if(!d.rowCount)return res.status(404).json({error:'NOT_FOUND'});await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,'delete_listing','listing',req.params.id,'']);res.json({ok:true});});
app.get('/api/admin/users',auth,admin,requireDb,async(req,res)=>{const r=await pool.query('SELECT id,name,email,phone,role,status,created_at,credits,(store_logo IS NOT NULL) has_logo FROM users ORDER BY created_at DESC LIMIT 500');res.json({users:r.rows});});
app.patch('/api/admin/users/:id',auth,admin,requireDb,async(req,res)=>{const status=req.body.status;if(status==='remove_logo'){const uid=Number(req.params.id)||0;const rr=await pool.query('UPDATE users SET store_logo=NULL WHERE id=$1',[uid]);if(!rr.rowCount)return res.status(404).json({error:'NOT_FOUND'});await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,'remove_store_logo','user',uid,'']);return res.json({ok:true});}if(!['active','blocked'].includes(status))return res.status(400).json({error:'STATUS_INVALIDE'});if(Number(req.params.id)===Number(req.user.id)&&status==='blocked')return res.status(400).json({error:'CANNOT_BLOCK_SELF'});const r=await pool.query('UPDATE users SET status=$1 WHERE id=$2 RETURNING id,name,email,phone,role,status',[status,req.params.id]);if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,status==='blocked'?'block_user':'unblock_user','user',req.params.id,'']);res.json({user:r.rows[0]});});
app.get('/api/admin/requests',auth,admin,requireDb,async(req,res)=>{const r=await pool.query('SELECT r.*,u.name user_name,u.email user_email FROM part_requests r LEFT JOIN users u ON u.id=r.user_id ORDER BY r.created_at DESC LIMIT 500');res.json({requests:r.rows});});
app.patch('/api/admin/requests/:id',auth,admin,requireDb,async(req,res)=>{const status=req.body.status;if(!['open','matched','closed'].includes(status))return res.status(400).json({error:'STATUS_INVALIDE'});const r=await pool.query('UPDATE part_requests SET status=$1 WHERE id=$2 RETURNING *',[status,req.params.id]);if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,'update_request','request',req.params.id,status]);res.json({request:r.rows[0]});});
app.get('/api/admin/offers',auth,admin,requireDb,ah(async(req,res)=>{const r=await pool.query('SELECT o.id,o.price,o.status,o.created_at,q.title request_title,u.name seller_name,b.name buyer_name FROM offers o JOIN part_requests q ON q.id=o.request_id LEFT JOIN users u ON u.id=o.seller_id LEFT JOIN users b ON b.id=q.user_id ORDER BY o.created_at DESC LIMIT 300');res.json({offers:r.rows});}));
app.get('/api/admin/orders',auth,admin,requireDb,ah(async(req,res)=>{const r=await pool.query('SELECT o.id,o.title,o.price,o.status,o.created_at,u.name seller_name,b.name buyer_name FROM orders o LEFT JOIN users u ON u.id=o.seller_id LEFT JOIN users b ON b.id=o.buyer_id ORDER BY o.created_at DESC LIMIT 300');res.json({orders:r.rows});}));
app.get('/api/admin/activity',auth,admin,requireDb,async(req,res)=>{const r=await pool.query('SELECT a.*,u.name admin_name,u.email admin_email FROM admin_activity a LEFT JOIN users u ON u.id=a.admin_id ORDER BY a.created_at DESC LIMIT 500');res.json({activity:r.rows});});
app.get('/api/admin/reports',auth,admin,requireDb,async(req,res)=>{const r=await pool.query(`SELECT r.*,l.title listing_title,u.name reporter_name FROM reports r LEFT JOIN listings l ON l.id=r.listing_id LEFT JOIN users u ON u.id=r.reporter_id ORDER BY r.created_at DESC LIMIT 500`);res.json({reports:r.rows});});
app.get('/api/admin/events',auth,admin,requireDb,ah(async(req,res)=>{
 const kind=String(req.query.kind||'').slice(0,40);
 const r=await pool.query(`SELECT e.id,e.kind,e.target_type,e.target_id,e.details,e.created_at,e.user_id,COALESCE(u.nickname,u.name) user_name,u.email user_email FROM site_events e LEFT JOIN users u ON u.id=e.user_id ${kind?'WHERE e.kind=$1':''} ORDER BY e.created_at DESC,e.id DESC LIMIT 300`,kind?[kind]:[]);
 res.json({events:r.rows});
}));
// Rezumat pentru funcțiile noi: vacanță, blocări, calificative, căutări salvate, sesiuni, importuri.
app.get('/api/admin/features',auth,admin,requireDb,ah(async(req,res)=>{
 const q=(sql,p)=>pool.query(sql,p).catch(e=>{console.error('admin/features',e.message);return {rows:[]};});
 const [vac,blk,blkN,sr,br,ss,ses,imp,sc,bc]=await Promise.all([
  q(`SELECT u.id,COALESCE(u.nickname,u.name) name,u.email,u.vacation_until::text until,(SELECT COUNT(*)::int FROM listings l WHERE l.user_id=u.id AND l.status='approved') ads FROM users u WHERE ${VAC_SQL('u')} ORDER BY u.id DESC LIMIT 200`),
  q('SELECT b.created_at,b.blocker_id,COALESCE(x.nickname,x.name) blocker,b.blocked_id,COALESCE(y.nickname,y.name) blocked FROM user_blocks b JOIN users x ON x.id=b.blocker_id JOIN users y ON y.id=b.blocked_id ORDER BY b.created_at DESC LIMIT 100'),
  q('SELECT COUNT(*)::int n FROM user_blocks'),
  q("SELECT 'seller' kind,r.id,r.stars,r.comment,r.created_at,r.order_id,r.buyer_id rater_id,COALESCE(b.nickname,b.name) rater,r.seller_id rated_id,COALESCE(s.nickname,s.name) rated FROM seller_ratings r JOIN users b ON b.id=r.buyer_id JOIN users s ON s.id=r.seller_id ORDER BY r.created_at DESC LIMIT 100"),
  q("SELECT 'buyer' kind,r.id,r.stars,r.comment,r.created_at,r.order_id,r.seller_id rater_id,COALESCE(s.nickname,s.name) rater,r.buyer_id rated_id,COALESCE(b.nickname,b.name) rated FROM buyer_ratings r JOIN users b ON b.id=r.buyer_id JOIN users s ON s.id=r.seller_id ORDER BY r.created_at DESC LIMIT 100"),
  q('SELECT COUNT(*)::int total,COUNT(*) FILTER (WHERE alerts)::int alerts FROM saved_searches'),
  q('SELECT COUNT(*)::int n,COUNT(DISTINCT user_id)::int users FROM sessions WHERE expires_at>NOW()'),
  q("SELECT COUNT(*)::int n FROM site_events WHERE kind='import' AND created_at>NOW()-INTERVAL '30 days'"),
  q('SELECT COUNT(*)::int n,COALESCE(ROUND(AVG(stars),2),0)::float avg FROM seller_ratings'),
  q('SELECT COUNT(*)::int n,COALESCE(ROUND(AVG(stars),2),0)::float avg FROM buyer_ratings')
 ]);
 const ratings=[...sr.rows,...br.rows].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,100);
 res.json({vacation:vac.rows,blocks:{total:(blkN.rows[0]||{}).n||0,latest:blk.rows},ratings:{seller:sc.rows[0]||{n:0,avg:0},buyer:bc.rows[0]||{n:0,avg:0},latest:ratings},saved:ss.rows[0]||{total:0,alerts:0},sessions:ses.rows[0]||{n:0,users:0},imports30:(imp.rows[0]||{}).n||0});
}));
// Șterge un calificativ abuziv (rămâne urma în jurnalul de activitate).
app.delete('/api/admin/ratings/:kind/:id',auth,admin,requireDb,ah(async(req,res)=>{
 const tbl={seller:'seller_ratings',buyer:'buyer_ratings'}[req.params.kind];
 if(!tbl||!/^\d{1,10}$/.test(req.params.id))return res.status(400).json({error:'ID_INVALID'});
 const d=await pool.query(`DELETE FROM ${tbl} WHERE id=$1 RETURNING id,stars`,[Number(req.params.id)]);
 if(!d.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,'delete_rating',req.params.kind+'_rating',d.rows[0].id,d.rows[0].stars+' stele']);
 res.json({ok:true});
}));
app.patch('/api/admin/reports/:id',auth,admin,requireDb,async(req,res)=>{const status=req.body.status;if(!['open','reviewed','closed'].includes(status))return res.status(400).json({error:'STATUS_INVALIDE'});const r=await pool.query('UPDATE reports SET status=$1 WHERE id=$2 RETURNING *',[status,req.params.id]);if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,'update_report','report',req.params.id,status]);res.json({report:r.rows[0]});});
app.post('/api/reports',auth,requireDb,async(req,res)=>{if(!throttle(authAttempts,'rep:'+req.user.id,20,60*60*1000))return res.status(429).json({error:'PREA_MULTE_ANUNTURI'});const {listing_id,reason,details}=req.body||{};if(!/^\d{1,10}$/.test(String(listing_id))||typeof reason!=='string'||!reason.trim()||reason.length>200)return res.status(400).json({error:'DATE_INVALIDE'});if(!(await pool.query('SELECT 1 FROM listings WHERE id=$1',[listing_id])).rowCount)return res.status(404).json({error:'DATE_INVALIDE'});const r=await pool.query('INSERT INTO reports(listing_id,reporter_id,reason,details) VALUES($1,$2,$3,$4) RETURNING *',[listing_id,req.user.id,reason.trim(),String(details||'').slice(0,2000)]);res.status(201).json({report:r.rows[0]});});


/* ---------- oferte, comenzi, notificări ---------- */
const mailGate=new Map();
const MAIL_COL={msg:'mail_msg',offer:'mail_offer',order:'mail_order',alert:'mail_alert'};
async function mailNotify(uid,kind,text){
  try{
    const col=MAIL_COL[kind];
    if(!uid||!col||!process.env.RESEND_API_KEY||!process.env.RESEND_FROM)return;
    const k=uid+':'+kind,now=Date.now();
    if(now-(mailGate.get(k)||0)<10*60*1000)return;
    const u=(await pool.query('SELECT email,email_verified,status,'+col+' pref FROM users WHERE id=$1',[uid])).rows[0];
    if(!u||u.status!=='active'||!u.email_verified||!u.pref)return;
    if(mailGate.size>5000)mailGate.clear();
    mailGate.set(k,now);
    const t=String(text).replace(/[\r\n]+/g,' ').slice(0,300);
    const base=String(process.env.APP_URL||process.env.RENDER_EXTERNAL_URL||'').replace(/\/+$/,'');
    await sendMail(u.email,'AutoParts: '+t.slice(0,80),t+(base?'\n\nVezi detalii: '+base+'/#/account-tool':'')+'\n\nPoți opri aceste emailuri din Setări cont → Notificări pe email.');
  }catch(e){console.error('mailNotify',e.message);}
}
const notify=(uid,text,kind)=>{if(!uid)return null;if(kind)mailNotify(uid,kind,text);return pool.query('INSERT INTO notifications(user_id,text,kind) VALUES($1,$2,$3)',[uid,String(text).slice(0,300),kind||null]).catch(()=>{});};
app.post('/api/requests/:id/offers',auth,needVerified,requireDb,ah(async(req,res)=>{
 if(!/^\d{1,10}$/.test(req.params.id))return res.status(400).json({error:'ID_INVALID'});
 if(!throttle(authAttempts,'offer:'+req.user.id,30,60*60*1000))return res.status(429).json({error:'PREA_MULTE_OFERTE'});
 const price=Number(req.body&&req.body.price),message=String((req.body&&req.body.message)||'').trim().slice(0,2000);
 if(!isFinite(price)||price<0||price>10000000)return res.status(400).json({error:'PRET_INVALID'});
 const pi=parseExtraImages(req.body&&req.body.images,6);if(pi.error)return res.status(400).json({error:pi.error});
 if(pi.images.length&&await imageQuotaExceeded(req.user.id,pi.images))return res.status(413).json({error:'SPATIU_POZE_DEPASIT'});
 const r=(await pool.query("SELECT id,user_id,title FROM part_requests WHERE id=$1 AND status='open'",[req.params.id])).rows[0];
 if(!r)return res.status(404).json({error:'NOT_FOUND'});
 if(r.user_id===req.user.id)return res.status(400).json({error:'CERERE_PROPRIE'});
 if(r.user_id){const bs=await blockState(req.user.id,r.user_id);if(bs.byMe||bs.byThem)return res.status(403).json({error:bs.byMe?'BLOCAT_DE_TINE':'BLOCAT'});}
 if((await pool.query("SELECT 1 FROM offers WHERE request_id=$1 AND seller_id=$2 AND status='pending'",[r.id,req.user.id])).rowCount)return res.status(409).json({error:'OFERTA_EXISTA'});
 try{pi.images=await storeImages(pi.images,req.user.id);}catch{return res.status(502).json({error:'STORAGE_EROARE'});}
 const o=await pool.query('INSERT INTO offers(request_id,seller_id,price,message,images) VALUES($1,$2,$3,$4,$5) RETURNING id',[r.id,req.user.id,price,message,pi.images]);
 await notify(r.user_id,'Ofertă nouă la cererea „'+r.title+'”: '+price+' lei','offer');
 res.json({ok:true,id:o.rows[0].id});
}));
app.get('/api/offers/mine',auth,requireDb,ah(async(req,res)=>{
 const one=/^\d{1,10}$/.test(String(req.query.id||''))?Number(req.query.id):0;
 const r=await pool.query("SELECT o.id,o.price,o.message,o.status,o.created_at,o.updated_at,"+(one?'o.images':'o.images[1:1]')+" images,"+(one?'q.images':'q.images[1:1]')+" req_images,q.id request_id,q.title request_title,q.user_id buyer_id,q.status request_status,q.make,q.model,q.year,q.variant,q.engine,q.kind,q.county,q.city,q.description,q.extra_parts,CASE WHEN o.status='accepted' THEN q.vin END vin,CASE WHEN o.status='accepted' THEN q.ship_address END ship_address,COALESCE(u.nickname,u.name) buyer_name,"+BUYER_RATE('q.user_id','buyer_rating')+" FROM offers o JOIN part_requests q ON q.id=o.request_id LEFT JOIN users u ON u.id=q.user_id WHERE o.seller_id=$1"+(one?' AND o.id=$2':'')+" ORDER BY o.created_at DESC LIMIT 200",one?[req.user.id,one]:[req.user.id]);
 const ids=[...new Set(r.rows.filter(x=>x.status==='accepted').map(x=>x.buyer_id))];
 const ph=ids.length?(await pool.query('SELECT user_id,phone,is_whatsapp FROM user_phones WHERE user_id=ANY($1::int[]) ORDER BY id',[ids])).rows:[];
 res.json({offers:r.rows.map(x=>({...x,phones:x.status==='accepted'?ph.filter(p=>p.user_id===x.buyer_id).map(p=>({phone:p.phone,is_whatsapp:p.is_whatsapp})):[]}))});
}));
app.patch('/api/offers/:id',auth,needVerified,requireDb,ah(async(req,res)=>{
 if(!throttle(authAttempts,'offer:'+req.user.id,30,60*60*1000))return res.status(429).json({error:'PREA_MULTE_OFERTE'});
 if(!/^\d{1,10}$/.test(req.params.id))return res.status(400).json({error:'ID_INVALID'});
 const price=Number(req.body&&req.body.price),message=String((req.body&&req.body.message)||'').trim().slice(0,2000);
 if(!isFinite(price)||price<0||price>10000000)return res.status(400).json({error:'PRET_INVALID'});
 let newImages=null;
 if(req.body&&req.body.images!==undefined){const pi=parseExtraImages(req.body.images,6);if(pi.error)return res.status(400).json({error:pi.error});if(pi.images.length&&await imageQuotaExceeded(req.user.id,pi.images,0,Number(req.params.id)))return res.status(413).json({error:'SPATIU_POZE_DEPASIT'});try{newImages=await storeImages(pi.images,req.user.id);}catch{return res.status(502).json({error:'STORAGE_EROARE'});}}
 const r=await pool.query("UPDATE offers o SET price=$1,message=$2,images=COALESCE($5::text[],o.images),updated_at=NOW() FROM part_requests q WHERE o.id=$3 AND o.seller_id=$4 AND o.status='pending' AND q.id=o.request_id AND q.status='open' RETURNING o.id,q.user_id buyer_id,q.title",[price,message,req.params.id,req.user.id,newImages]);
 if(!r.rowCount)return res.status(409).json({error:'OFERTA_NU_MAI_E_DISPONIBILA'});
 await notify(r.rows[0].buyer_id,'Oferta la cererea „'+r.rows[0].title+'” a fost modificată: '+price+' lei','offer');
 res.json({ok:true});
}));
app.delete('/api/offers/:id',auth,requireDb,ah(async(req,res)=>{
 const r=await pool.query("DELETE FROM offers o USING part_requests q WHERE o.id=$1 AND o.seller_id=$2 AND o.status='pending' AND q.id=o.request_id RETURNING q.user_id buyer_id,q.title",[req.params.id,req.user.id]);
 if(!r.rowCount)return res.status(409).json({error:'OFERTA_NU_MAI_E_DISPONIBILA'});
 await notify(r.rows[0].buyer_id,'O ofertă la cererea „'+r.rows[0].title+'” a fost retrasă.','offer');
 res.json({ok:true});
}));
app.post('/api/offers/:id/reject',auth,requireDb,ah(async(req,res)=>{
 const r=await pool.query("UPDATE offers o SET status='rejected' FROM part_requests q WHERE o.id=$1 AND q.id=o.request_id AND q.user_id=$2 AND o.status='pending' RETURNING o.seller_id,q.title",[req.params.id,req.user.id]);
 if(!r.rowCount)return res.status(409).json({error:'OFERTA_NU_MAI_E_DISPONIBILA'});
 await notify(r.rows[0].seller_id,'Oferta ta pentru „'+r.rows[0].title+'” a fost refuzată.','offer');
 res.json({ok:true});
}));
app.get('/api/offers/received',auth,requireDb,ah(async(req,res)=>{
 const r=await pool.query('SELECT o.id,o.price,o.message,o.status,o.created_at,o.seller_id,o.images[1:1] images,q.images[1:1] req_images,q.id request_id,q.title request_title,COALESCE(u.nickname,u.name) seller_name,'+SELLER_RATE('o.seller_id','seller_rating')+' FROM offers o JOIN part_requests q ON q.id=o.request_id LEFT JOIN users u ON u.id=o.seller_id WHERE q.user_id=$1 ORDER BY o.created_at DESC LIMIT 200',[req.user.id]);
 res.json({offers:r.rows});
}));
app.post('/api/offers/:id/accept',auth,requireDb,ah(async(req,res)=>{
 if(!/^\d{1,10}$/.test(req.params.id))return res.status(400).json({error:'ID_INVALID'});
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  const o=(await c.query('SELECT o.*,q.user_id buyer_id,q.status rstatus,q.title FROM offers o JOIN part_requests q ON q.id=o.request_id WHERE o.id=$1 FOR UPDATE OF o,q',[req.params.id])).rows[0];
  if(!o){await c.query('ROLLBACK');return res.status(404).json({error:'NOT_FOUND'});}
  if(o.buyer_id!==req.user.id){await c.query('ROLLBACK');return res.status(403).json({error:'INTERZIS'});}
  if(o.status!=='pending'||o.rstatus!=='open'){await c.query('ROLLBACK');return res.status(409).json({error:'OFERTA_NU_MAI_E_DISPONIBILA'});}
  await c.query("UPDATE offers SET status='accepted' WHERE id=$1",[o.id]);
  await c.query("UPDATE offers SET status='rejected' WHERE request_id=$1 AND id<>$2 AND status='pending'",[o.request_id,o.id]);
  await c.query("UPDATE part_requests SET status='matched' WHERE id=$1",[o.request_id]);
  const ord=await c.query('INSERT INTO orders(offer_id,request_id,buyer_id,seller_id,title,price) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[o.id,o.request_id,o.buyer_id,o.seller_id,o.title,o.price]);
  await c.query('COMMIT');
  await notify(o.seller_id,'Oferta ta pentru „'+o.title+'” a fost acceptată. Comandă nouă.','offer');
  res.json({ok:true,order_id:ord.rows[0].id});
 }catch(e){try{await c.query('ROLLBACK');}catch{}throw e;}finally{c.release();}
}));

app.post('/api/messages',auth,needVerified,requireDb,ah(async(req,res)=>{
 const b=req.body||{}, body=String(b.body||'').trim();
 let to=Number(b.to);
 // „Trimite un mesaj”: destinatarul poate fi ales după nickname.
 if(!Number.isInteger(to)&&typeof b.to_nick==='string'&&b.to_nick.trim()){
  const f=(await pool.query("SELECT id FROM users WHERE LOWER(nickname)=LOWER($1) AND status='active'",[b.to_nick.trim().slice(0,30)])).rows[0];
  if(!f)return res.status(404).json({error:'DESTINATAR_NEGASIT'});
  to=f.id;
 }
 if(!Number.isInteger(to)||to<=0||to===req.user.id)return res.status(400).json({error:'DESTINATAR_INVALID'});
 if(!body||body.length>2000)return res.status(400).json({error:'MESAJ_INVALID'});
 if(!throttle(authAttempts,'msg:'+req.user.id,60,60*60*1000))return res.status(429).json({error:'PREA_MULTE_MESAJE'});
 const u=(await pool.query("SELECT id FROM users WHERE id=$1 AND status='active'",[to])).rows[0];
 if(!u)return res.status(404).json({error:'NOT_FOUND'});
 {const bs=await blockState(req.user.id,to);if(bs.byMe||bs.byThem)return res.status(403).json({error:bs.byMe?'BLOCAT_DE_TINE':'BLOCAT'});}
 // Referință opțională către un anunț (apare ca „Ref: titlu” în Mesagerie).
 let listingId=null, refTitle=null;
 if(/^\d{1,10}$/.test(String(b.listing_id||''))){
  const l=(await pool.query("SELECT id,title FROM listings WHERE id=$1 AND status='approved'",[Number(b.listing_id)])).rows[0];
  if(l){listingId=l.id;refTitle=l.title;}
 }
 await pool.query('INSERT INTO messages(sender_id,recipient_id,body,listing_id,ref_title) VALUES($1,$2,$3,$4,$5)',[req.user.id,to,body,listingId,refTitle]);
 await notify(to,'Mesaj nou de la '+(req.user.nickname||req.user.name||'un utilizator'),'msg');
 res.json({ok:true});
}));
// Mesagerie: lista de mesaje pe căsuțe (primite / trimise / arhivate). Definit înaintea rutei /:uid.
app.get('/api/messages/box',auth,requireDb,ah(async(req,res)=>{
 const box=['inbox','sent','archived'].includes(req.query.box)?req.query.box:'inbox';
 const where={
  inbox:'m.recipient_id=$1 AND NOT m.arch_r'+BLK_IN,
  sent:'m.sender_id=$1 AND NOT m.arch_s',
  archived:'((m.recipient_id=$1 AND m.arch_r'+BLK_IN+') OR (m.sender_id=$1 AND m.arch_s))'
 }[box];
 const r=await pool.query(`SELECT m.id,m.body,m.created_at,m.is_read,m.listing_id,m.ref_title,(m.sender_id=$1) mine,
   CASE WHEN m.sender_id=$1 THEN m.recipient_id ELSE m.sender_id END other,
   COALESCE(u.nickname,u.name) other_name
  FROM messages m JOIN users u ON u.id=(CASE WHEN m.sender_id=$1 THEN m.recipient_id ELSE m.sender_id END)
  WHERE ${where} ORDER BY m.created_at DESC,m.id DESC LIMIT 300`,[req.user.id]);
 const c=(await pool.query(`SELECT COUNT(*) FILTER (WHERE recipient_id=$1 AND NOT arch_r AND NOT is_read AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE b.blocker_id=$1 AND b.blocked_id=messages.sender_id))::int unread FROM messages WHERE recipient_id=$1`,[req.user.id])).rows[0];
 res.json({messages:r.rows,unread:c.unread,box});
}));
app.post('/api/messages/archive',auth,requireDb,ah(async(req,res)=>{
 const ids=(Array.isArray(req.body&&req.body.ids)?req.body.ids:[]).map(Number).filter(n=>Number.isInteger(n)&&n>0).slice(0,200);
 if(!ids.length)return res.status(400).json({error:'DATE_INVALIDE'});
 const on=!(req.body&&req.body.archive===false);
 await pool.query('UPDATE messages SET arch_r=$3 WHERE id=ANY($1::int[]) AND recipient_id=$2',[ids,req.user.id,on]);
 await pool.query('UPDATE messages SET arch_s=$3 WHERE id=ANY($1::int[]) AND sender_id=$2',[ids,req.user.id,on]);
 res.json({ok:true});
}));
app.post('/api/messages/read',auth,requireDb,ah(async(req,res)=>{
 const ids=(Array.isArray(req.body&&req.body.ids)?req.body.ids:[]).map(Number).filter(n=>Number.isInteger(n)&&n>0).slice(0,200);
 if(ids.length)await pool.query('UPDATE messages SET is_read=TRUE WHERE id=ANY($1::int[]) AND recipient_id=$2',[ids,req.user.id]);
 res.json({ok:true});
}));
app.get('/api/messages',auth,requireDb,ah(async(req,res)=>{
 const r=await pool.query(`SELECT t.other,COALESCE(u.nickname,u.name) AS name,t.body,t.created_at,t.unread FROM (SELECT other,body,created_at,SUM(ui) OVER (PARTITION BY other) unread,ROW_NUMBER() OVER (PARTITION BY other ORDER BY created_at DESC,id DESC) rn FROM (SELECT CASE WHEN sender_id=$1 THEN recipient_id ELSE sender_id END other,body,created_at,id,CASE WHEN recipient_id=$1 AND NOT is_read THEN 1 ELSE 0 END ui FROM messages WHERE (sender_id=$1 OR recipient_id=$1) AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE b.blocker_id=$1 AND b.blocked_id=(CASE WHEN sender_id=$1 THEN recipient_id ELSE sender_id END))) m) t JOIN users u ON u.id=t.other WHERE t.rn=1 ORDER BY t.created_at DESC LIMIT 100`,[req.user.id]);
 res.json({threads:r.rows.map(x=>({...x,unread:Number(x.unread)}))});
}));
app.get('/api/messages/:uid',auth,requireDb,ah(async(req,res)=>{
 if(!/^\d{1,10}$/.test(req.params.uid))return res.status(400).json({error:'ID_INVALID'});
 const other=(await pool.query("SELECT id,COALESCE(nickname,name) AS name FROM users WHERE id=$1 AND status='active'",[req.params.uid])).rows[0];
 if(!other)return res.status(404).json({error:'NOT_FOUND'});
 const m=await pool.query('SELECT id,body,created_at,listing_id,ref_title,(sender_id=$1) mine FROM messages WHERE (sender_id=$1 AND recipient_id=$2) OR (sender_id=$2 AND recipient_id=$1) ORDER BY created_at,id LIMIT 500',[req.user.id,other.id]);
 await pool.query('UPDATE messages SET is_read=TRUE WHERE recipient_id=$1 AND sender_id=$2 AND NOT is_read',[req.user.id,other.id]);
 const bs=await blockState(req.user.id,other.id);
 res.json({other,messages:m.rows,blocked_by_me:bs.byMe,blocked_me:bs.byThem});
}));
app.post('/api/orders',auth,needVerified,requireDb,ah(async(req,res)=>{
 if(!throttle(authAttempts,'order:'+req.user.id,20,60*60*1000))return res.status(429).json({error:'PREA_MULTE_COMENZI'});
 const b=req.body||{}, id=Number(b.listing_id);
 if(!Number.isInteger(id)||id<=0)return res.status(400).json({error:'ID_INVALID'});
 const l=(await pool.query('SELECT id,user_id,title,price,quantity,delivery,status FROM listings WHERE id=$1',[id])).rows[0];
 if(!l||l.status!=='approved'||!l.user_id)return res.status(404).json({error:'NOT_FOUND'});
 if(l.user_id===req.user.id)return res.status(400).json({error:'COMANDA_PROPRIE'});
 {const bs=await blockState(req.user.id,l.user_id);if(bs.byMe||bs.byThem)return res.status(403).json({error:bs.byMe?'BLOCAT_DE_TINE':'BLOCAT'});}
 if((await pool.query('SELECT 1 FROM users u WHERE u.id=$1 AND '+VAC_SQL('u'),[l.user_id])).rowCount)return res.status(409).json({error:'VANZATOR_IN_VACANTA'});
 const avail=Math.max(1,Number(l.quantity)||1), qty=Math.floor(Number(b.quantity)||1);
 if(qty<1||qty>avail)return res.status(400).json({error:'CANTITATE_INVALIDA'});
 const county=clip(b.ship_county,60), city=clip(b.ship_city,80), addr=clip(b.ship_address,300), note=clip(b.note,500);
 const rName=clip(b.recipient_name,100), rPhone=clip(b.recipient_phone,25);
 if(rPhone&&!/^\+?[0-9 ().-]{6,20}$/.test(rPhone))return res.status(400).json({error:'TELEFON_INVALID'});
 if(!county||(l.delivery&&(!city||!addr)))return res.status(400).json({error:'ADRESA_LIPSA'});
 const dup=await pool.query("SELECT 1 FROM orders WHERE buyer_id=$1 AND listing_id=$2 AND status='new' LIMIT 1",[req.user.id,l.id]);
 if(dup.rowCount)return res.status(409).json({error:'COMANDA_EXISTA'});
 // Stocul se rezervă atomic la comandă (UPDATE condiționat): doi cumpărători nu pot lua aceeași bucată.
 const c=await pool.connect();
 let r;
 try{
  await c.query('BEGIN');
  const up=await c.query("UPDATE listings SET quantity=COALESCE(quantity,1)-$2 WHERE id=$1 AND status='approved' AND COALESCE(quantity,1)>=$2 RETURNING quantity",[l.id,qty]);
  if(!up.rowCount){await c.query('ROLLBACK');return res.status(409).json({error:'CANTITATE_INVALIDA'});}
  if(Number(up.rows[0].quantity)<=0)await c.query("UPDATE listings SET status='sold' WHERE id=$1 AND status='approved'",[l.id]);
  r=await c.query('INSERT INTO orders(buyer_id,seller_id,listing_id,title,price,quantity,ship_county,ship_city,ship_address,note,stock_reserved,recipient_name,recipient_phone) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,$11,$12) RETURNING id',[req.user.id,l.user_id,l.id,l.title,(Number(l.price)||0)*qty,qty,county,city,addr,note,rName||null,rPhone||null]);
  await c.query('COMMIT');
 }catch(e){try{await c.query('ROLLBACK');}catch{}throw e;}finally{c.release();}
 await notify(l.user_id,'Comandă nouă pentru „'+l.title+'” ('+qty+' buc.). Vezi „Comenzi primite”.','order');
 res.status(201).json({ok:true,order_id:r.rows[0].id});
}));
app.get('/api/orders',auth,requireDb,ah(async(req,res)=>{
 // Cumpărătorul a deschis „Comenzile mele”: marcăm starea curentă ca văzută (insigna dispare până la următoarea schimbare de status).
 if(req.query.seen==='buyer')await pool.query('UPDATE orders SET buyer_seen_status=status WHERE buyer_id=$1 AND buyer_seen_status IS DISTINCT FROM status',[req.user.id]);
 const r=await pool.query("SELECT o.id,o.title,o.price,o.status,o.created_at,o.quantity,o.listing_id,o.ship_county,o.ship_city,o.ship_address,o.note,o.recipient_name,o.recipient_phone,o.status_reason,o.awb,CASE WHEN o.seller_id=$1 THEN o.seller_note END seller_note,(COALESCE(array_length(l.images,1),0)>0) has_thumb,CASE WHEN o.buyer_id=$1 THEN 'buyer' ELSE 'seller' END role,CASE WHEN o.buyer_id=$1 THEN o.seller_id ELSE o.buyer_id END other_id,COALESCE(NULLIF(u.bill_company,''),NULLIF(u.name,''),u.nickname) other_name,NULLIF(u.bill_company,'') other_company,u.name other_person,(u.store_logo IS NOT NULL) other_has_logo,(u.avatar IS NOT NULL OR u.store_logo IS NOT NULL) other_has_avatar,CASE WHEN o.buyer_id=$1 THEN sr.stars ELSE br.stars END given_stars,CASE WHEN o.buyer_id=$1 THEN sr.comment ELSE br.comment END given_comment,CASE WHEN o.buyer_id=$1 THEN br.stars ELSE sr.stars END got_stars,CASE WHEN o.buyer_id=$1 THEN br.comment ELSE sr.comment END got_comment,CASE WHEN o.buyer_id=$1 THEN (SELECT ROUND(AVG(stars),1)::float FROM seller_ratings WHERE seller_id=o.seller_id) ELSE (SELECT ROUND(AVG(stars),1)::float FROM buyer_ratings WHERE buyer_id=o.buyer_id) END other_rating_avg,CASE WHEN o.buyer_id=$1 THEN (SELECT COUNT(*)::int FROM seller_ratings WHERE seller_id=o.seller_id) ELSE (SELECT COUNT(*)::int FROM buyer_ratings WHERE buyer_id=o.buyer_id) END other_rating_n FROM orders o LEFT JOIN users u ON u.id=(CASE WHEN o.buyer_id=$1 THEN o.seller_id ELSE o.buyer_id END) LEFT JOIN seller_ratings sr ON sr.order_id=o.id LEFT JOIN buyer_ratings br ON br.order_id=o.id LEFT JOIN listings l ON l.id=o.listing_id WHERE o.buyer_id=$1 OR o.seller_id=$1 ORDER BY o.created_at DESC LIMIT 200",[req.user.id]);
 const ids=[...new Set(r.rows.map(x=>x.other_id).filter(Boolean))];
 const ph=ids.length?(await pool.query('SELECT user_id,phone,is_whatsapp FROM user_phones WHERE user_id=ANY($1::int[]) ORDER BY id',[ids])).rows:[];
 res.json({orders:r.rows.map(x=>({...x,phones:ph.filter(p=>p.user_id===x.other_id).map(p=>({phone:p.phone,is_whatsapp:p.is_whatsapp}))}))});
}));
app.patch('/api/orders/:id/status',auth,requireDb,ah(async(req,res)=>{
 const to=String((req.body||{}).status||'');
 if(!['confirmed','shipped','completed','suspended','cancelled'].includes(to))return res.status(400).json({error:'STATUS_INVALIDE'});
 const o=(await pool.query('SELECT id,buyer_id,seller_id,title,status,listing_id,quantity,stock_reserved FROM orders WHERE id=$1 AND (buyer_id=$2 OR seller_id=$2)',[req.params.id,req.user.id])).rows[0];
 if(!o)return res.status(404).json({error:'NOT_FOUND'});
 const seller=o.seller_id===req.user.id;
 if(!seller&&!(to==='cancelled'&&o.status==='new'))return res.status(403).json({error:'INTERZIS'});
 if(['cancelled','completed'].includes(o.status))return res.status(409).json({error:'COMANDA_INCHISA'});
 // Tranziții permise (aceleași ca butoanele din interfață): „finalizată” doar după „expediată”.
 const NEXT={new:['confirmed','shipped','completed','suspended','cancelled'],confirmed:['shipped','completed','suspended','cancelled'],shipped:['completed','suspended','cancelled'],suspended:['confirmed','shipped','completed','cancelled']};
 // Vânzătorul trebuie să explice cumpărătorului de ce suspendă sau anulează comanda.
 const reason=clip((req.body||{}).reason,500);
 if(reason&&/(https?:\/\/|www\.)/i.test(reason))return res.status(400).json({error:'LINK_INTERZIS'});
 if(seller&&['suspended','cancelled'].includes(to)&&(!reason||reason.length<3))return res.status(400).json({error:'MOTIV_OBLIGATORIU'});
 const restock=!(seller&&(req.body||{}).restock===false);
 if(!(NEXT[o.status]||[]).includes(to))return res.status(409).json({error:'STATUS_INVALIDE'});
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  const u=await c.query('UPDATE orders SET status=$1,status_reason=$4'+(to==='cancelled'?',stock_reserved=FALSE':'')+' WHERE id=$2 AND status=$3 RETURNING id',[to,o.id,o.status,(['suspended','cancelled','completed'].includes(to)&&reason)?reason:null]);
  if(!u.rowCount){await c.query('ROLLBACK');return res.status(409).json({error:'COMANDA_INCHISA'});}
  if(to==='cancelled'&&o.stock_reserved&&o.listing_id&&restock){
   // Stocul rezervat se întoarce; un anunț „vândut” automat (stoc 0) revine la „publicat”.
   await c.query("UPDATE listings SET quantity=COALESCE(quantity,0)+$2,status=CASE WHEN status='sold' AND COALESCE(quantity,0)<=0 THEN 'approved' ELSE status END WHERE id=$1",[o.listing_id,Number(o.quantity)||1]);
  }
  await c.query('COMMIT');
 }catch(e){try{await c.query('ROLLBACK');}catch{}throw e;}finally{c.release();}
 const L={confirmed:'confirmată',shipped:'expediată',completed:'finalizată',suspended:'suspendată',cancelled:'anulată'};
 await notify(seller?o.buyer_id:o.seller_id,'Comanda pentru „'+(o.title||'piesă')+'” a fost '+L[to]+(seller?' de vânzător':'')+'.'+(reason&&['suspended','cancelled','completed'].includes(to)?' Mesaj: '+reason:''),'order');
 res.json({ok:true,status:to});
}));
app.get('/api/orders/:id(\\d+)/thumb',auth,requireDb,ah(async(req,res)=>{
 const r=await pool.query('SELECT l.images[1] img FROM orders o JOIN listings l ON l.id=o.listing_id WHERE o.id=$1 AND (o.buyer_id=$2 OR o.seller_id=$2)',[req.params.id,req.user.id]);
 const img=r.rows[0]&&r.rows[0].img;
 if(!img)return res.status(404).end();
 const m=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+\/=]+)$/.exec(img);
 res.set('Cache-Control','private, max-age=3600');
 if(m){res.type('image/'+m[1]);return res.send(Buffer.from(m[2],'base64'));}
 if(/^https?:\/\//.test(img))return res.redirect(302,img);
 res.status(404).end();
}));
app.get('/api/orders/:id(\\d+)/listing',auth,requireDb,ah(async(req,res)=>{
 const r=await pool.query(`SELECT l.*,${SELLER_COLS},u.show_phone seller_show_phone,${VAC_SQL('u')} seller_vacation,CASE WHEN ${VAC_SQL('u')} THEN u.vacation_until::text END seller_vacation_until FROM orders o JOIN listings l ON l.id=o.listing_id LEFT JOIN users u ON u.id=l.user_id WHERE o.id=$1 AND (o.buyer_id=$2 OR o.seller_id=$2)`,[req.params.id,req.user.id]);
 if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 const x=r.rows[0]; let phones=[];
 if(x.seller_show_phone&&x.user_id)phones=(await pool.query('SELECT phone,is_whatsapp FROM user_phones WHERE user_id=$1 ORDER BY id LIMIT 4',[x.user_id])).rows;
 delete x.seller_show_phone;
 res.json({listing:x,phones});
}));
app.patch('/api/orders/:id(\\d+)/details',auth,requireDb,ah(async(req,res)=>{
 const o=(await pool.query('SELECT id,buyer_id,seller_id,title,awb FROM orders WHERE id=$1 AND seller_id=$2',[req.params.id,req.user.id])).rows[0];
 if(!o)return res.status(404).json({error:'NOT_FOUND'});
 const b=req.body||{}, sets=[], vals=[o.id];
 let newAwb=null;
 if(Object.prototype.hasOwnProperty.call(b,'awb')){
  const awb=(clip(b.awb,40)||'').replace(/\s+/g,'');
  if(awb&&!/^[A-Za-z0-9._-]{3,40}$/.test(awb))return res.status(400).json({error:'AWB_INVALID'});
  vals.push(awb||null);sets.push('awb=$'+vals.length);
  if(awb&&awb!==o.awb)newAwb=awb;
 }
 if(Object.prototype.hasOwnProperty.call(b,'seller_note')){
  vals.push(clip(b.seller_note,1000)||null);sets.push('seller_note=$'+vals.length);
 }
 if(!sets.length)return res.status(400).json({error:'NIMIC_DE_SALVAT'});
 await pool.query('UPDATE orders SET '+sets.join(',')+' WHERE id=$1',vals);
 if(newAwb&&o.buyer_id)await notify(o.buyer_id,'Comanda pentru „'+(o.title||'piesă')+'” are AWB: '+newAwb+'.','order');
 res.json({ok:true});
}));
app.get('/api/notifications',auth,requireDb,ah(async(req,res)=>{
 const r=await pool.query('SELECT id,text,is_read,created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[req.user.id]);
 res.json({notifications:r.rows});
}));
app.post('/api/notifications/read',auth,requireDb,ah(async(req,res)=>{await pool.query('UPDATE notifications SET is_read=TRUE WHERE user_id=$1',[req.user.id]);res.json({ok:true});}));

/* ===== Calificative pentru vânzători ===== */
// Doar cumpărătorul unei comenzi FINALIZATE poate da (sau modifica) calificativul, o singură dată pe comandă.
app.put('/api/orders/:id(\\d+)/rating',auth,requireDb,ah(async(req,res)=>{
 if(!throttle(authAttempts,'rate:'+req.user.id,30,60*60*1000))return res.status(429).json({error:'PREA_MULTE_CERERI'});
 const b=req.body||{}, stars=Number(b.stars);
 if(!Number.isInteger(stars)||stars<1||stars>5)return res.status(400).json({error:'CALIFICATIV_INVALID'});
 const comment=clip(b.comment,500);
 if(comment&&/(https?:\/\/|www\.|\S+@\S+\.\S+)/i.test(comment))return res.status(400).json({error:'LINK_INTERZIS'});
 const o=(await pool.query('SELECT id,buyer_id,seller_id,status,title FROM orders WHERE id=$1',[req.params.id])).rows[0];
 if(!o||!o.buyer_id||!o.seller_id)return res.status(404).json({error:'NOT_FOUND'});
 const asBuyer=o.buyer_id===req.user.id, asSeller=o.seller_id===req.user.id;
 if(!asBuyer&&!asSeller)return res.status(404).json({error:'NOT_FOUND'});
 if(asBuyer&&asSeller)return res.status(403).json({error:'INTERZIS'});
 if(o.status!=='completed')return res.status(409).json({error:'COMANDA_NEFINALIZATA'});
 // cumpărătorul califică vânzătorul (seller_ratings), vânzătorul califică cumpărătorul (buyer_ratings)
 const tbl=asBuyer?'seller_ratings':'buyer_ratings', rated=asBuyer?o.seller_id:o.buyer_id, col=asBuyer?'seller_id':'buyer_id';
 const prev=(await pool.query(`SELECT 1 FROM ${tbl} WHERE order_id=$1`,[o.id])).rowCount;
 await pool.query(`INSERT INTO ${tbl}(order_id,seller_id,buyer_id,stars,comment) VALUES($1,$2,$3,$4,$5)
  ON CONFLICT(order_id) DO UPDATE SET stars=EXCLUDED.stars,comment=EXCLUDED.comment,updated_at=NOW()`,[o.id,o.seller_id,o.buyer_id,stars,comment]);
 if(!prev)await notify(rated,'Ai primit un calificativ de '+stars+' '+(stars===1?'stea':'stele')+' pentru comanda „'+(o.title||'piesă')+'”.','rating');
 const rt=(await pool.query(`SELECT ROUND(AVG(stars),1)::float avg,COUNT(*)::int n FROM ${tbl} WHERE ${col}=$1`,[rated])).rows[0];
 logEvent(req.user.id,prev?'rating_edit':'rating','order',o.id,stars+'★ pentru '+(asBuyer?'vânzătorul':'cumpărătorul')+' #'+rated+(comment?' · '+comment.slice(0,120):''));
 res.json({ok:true,stars,comment,rating:{avg:rt.avg,count:rt.n}});
}));
// Public: media și ultimele calificative ale unui utilizator, separat ca vânzător și ca cumpărător.
app.get('/api/sellers/:id(\\d+)/ratings',requireDb,ah(async(req,res)=>{
 const id=Number(req.params.id);
 const lim=req.query.all==='1'?200:20;
 const pack=async(tbl,rated,rater)=>{
  const sum=(await pool.query(`SELECT ROUND(AVG(stars),1)::float avg,COUNT(*)::int n FROM ${tbl} WHERE ${rated}=$1`,[id])).rows[0];
  const list=(await pool.query(`SELECT r.stars,r.comment,r.created_at,COALESCE(NULLIF(u.nickname,''),split_part(u.name,' ',1),'Utilizator') who FROM ${tbl} r LEFT JOIN users u ON u.id=r.${rater} WHERE r.${rated}=$1 ORDER BY r.created_at DESC LIMIT ${lim}`,[id])).rows;
  const dist={};(await pool.query(`SELECT stars,COUNT(*)::int n FROM ${tbl} WHERE ${rated}=$1 GROUP BY stars`,[id])).rows.forEach(x=>{dist[x.stars]=x.n;});
  return {avg:sum.avg,count:sum.n,ratings:list,dist};
 };
 res.set('Cache-Control','no-store');
 res.json({seller:await pack('seller_ratings','seller_id','buyer_id'),buyer:await pack('buyer_ratings','buyer_id','seller_id')});
}));

/* ===== Import CSV (parcuri de dezmembrări) ===== */
const IMPORT_MAX_ROWS=300;
const IMPORT_COUNTIES=['Alba','Arad','Argeș','Bacău','Bihor','Bistrița-Năsăud','Botoșani','Brăila','Brașov','București','Buzău','Caraș-Severin','Călărași','Cluj','Constanța','Covasna','Dâmbovița','Dolj','Galați','Giurgiu','Gorj','Harghita','Hunedoara','Ialomița','Iași','Ilfov','Maramureș','Mehedinți','Mureș','Neamț','Olt','Prahova','Satu Mare','Sălaj','Sibiu','Suceava','Teleorman','Timiș','Tulcea','Vaslui','Vâlcea','Vrancea'];
const impKey=v=>String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const IMP_CAT=new Map(CATEGORIES.map(c=>[impKey(c),c])), IMP_COUNTY=new Map(IMPORT_COUNTIES.map(c=>[impKey(c),c]));
const impYes=v=>/^(1|da|yes|true|y|x|adevarat)$/.test(impKey(v));
const impNum=v=>{let t=String(v==null?'':v).toLowerCase().replace(/lei|ron|eur|€|\s/g,'');if(t==='')return 0;if(t.includes('.')&&t.includes(','))t=t.replace(/\./g,'').replace(',','.');else if(t.includes(','))t=t.replace(',','.');else if(/^\d{1,3}(\.\d{3})+$/.test(t))t=t.replace(/\./g,'');const n=Number(t);return Number.isFinite(n)?n:NaN;};
const IMP_ERR={DATE_INVALIDE:'Date invalide (titlu, marcă, model sau județ)',PRET_NEREALIST:'Preț prea mic (pune 0 pentru „La cerere”)',LINK_INTERZIS:'Linkurile și adresele de email nu sunt permise în text',AN_INVALID:'An invalid (4 cifre, între 1950 și anul viitor)',STARE_INVALIDA:'Stare invalidă (Nouă sau Second-hand)'};
function normImportRow(r){
 const g=k=>r&&r[k]!=null?String(r[k]).trim():'';
 const t=impKey(g('type'));
 const type=(t===''||t.startsWith('piesa'))?'piesa':(t.startsWith('dezmembr')?'dezmembrari':null);
 if(!type)return {err:'Tip necunoscut (folosește „piesa” sau „dezmembrari”)'};
 if(g('title').length<3)return {err:'Titlu lipsă sau prea scurt'};
 if(g('title').length>150)return {err:'Titlu prea lung (maximum 150 de caractere)'};
 if(!g('make'))return {err:'Marca lipsește'};
 if(!g('model'))return {err:'Modelul lipsește'};
 const ck0=impKey(g('county')), county=IMP_COUNTY.get(ck0)||([...IMP_COUNTY].find(([k])=>ck0.startsWith(k+' '))||[])[1];
 if(!g('county'))return {err:'Județul lipsește'};
 if(!county)return {err:'Județ necunoscut: '+g('county').slice(0,30)};
 const cat=g('category')?IMP_CAT.get(impKey(g('category'))):'Diverse';
 if(!cat)return {err:'Categorie necunoscută: '+g('category').slice(0,40)};
 const price=impNum(g('price')); if(Number.isNaN(price))return {err:'Preț invalid'};
 let condition=g('condition'); const ck=impKey(condition);
 if(ck===''||/^(second hand|sh|folosit|folosita|uzat|uzata|used)$/.test(ck))condition='Second-hand';
 else if(/^(noua|nou|new)$/.test(ck))condition='Nouă'; else return {err:'Stare invalidă (Nouă sau Second-hand)'};
 let seller_type=g('seller_type'); if(seller_type){const st=SELLER_TYPES.find(x=>impKey(x)===impKey(seller_type)); if(!st)return {err:'Tip vânzător necunoscut'}; seller_type=st;} else seller_type='Parc dezmembrări';
 const km=g('km')===''?null:Number(String(g('km')).replace(/[^\d]/g,''));
 if(g('km')!==''&&!Number.isFinite(km))return {err:'Kilometri invalizi'};
 return {x:{type,title:g('title'),price,condition,make:g('make'),model:g('model'),year:g('year'),category:cat,subcategory:g('subcategory'),county,
  quantity:g('quantity')===''?1:Math.max(1,Math.round(Number(g('quantity'))||1)),oem:g('oem'),engine:g('engine'),fuel:g('fuel'),km,vin:g('vin'),parts_avail:g('parts_avail'),
  delivery:impYes(g('delivery')),negotiable:impYes(g('negotiable')),description:g('description'),seller_type,images:[]}};
}
// Rândurile vin deja separate în coloane de pe telefon/PC. {dry:true} doar verifică și nu salvează nimic.
// Utile → Actualizare prețuri: crește/scade în masă prețurile anunțurilor active (publicate sau în așteptare) ale utilizatorului.
// Cu preview:true doar calculează și arată o previzualizare. Anunțurile fără preț („La cerere”) nu se ating; prețul rămâne între 5 și 10.000.000 lei.
app.post('/api/listings/bulk-price',auth,needVerified,requireDb,ah(async(req,res)=>{
 if(!throttle(authAttempts,'bulkprice:'+req.user.id,30,60*60*1000))return res.status(429).json({error:'PREA_MULTE_CERERI'});
 const b=req.body||{};
 const mode=b.mode==='amount'?'amount':'percent', dir=b.direction==='down'?-1:1, val=Number(b.value);
 if(!Number.isFinite(val)||val<=0||(mode==='percent'&&val>90)||(mode==='amount'&&val>1000000))return res.status(400).json({error:'DATE_INVALIDE'});
 const cond=['Nouă','Second-hand'].includes(b.condition)?b.condition:null;
 const rows=(await pool.query("SELECT id,title,price FROM listings WHERE user_id=$1 AND status IN ('approved','pending') AND price>0 AND ($2::text IS NULL OR condition=$2) ORDER BY created_at DESC LIMIT 2000",[req.user.id,cond])).rows;
 const calc=p=>Math.min(10000000,Math.max(5,Math.round(mode==='percent'?p*(1+dir*val/100):p+dir*val)));
 const changes=rows.map(r=>({id:r.id,title:r.title,old:Number(r.price),next:calc(Number(r.price))})).filter(c=>c.next!==c.old);
 if(b.preview)return res.json({count:changes.length,total:rows.length,sample:changes.slice(0,5).map(c=>({title:c.title,old:c.old,next:c.next}))});
 if(!changes.length)return res.json({updated:0});
 await pool.query('UPDATE listings l SET price=v.p FROM UNNEST($1::int[],$2::numeric[]) AS v(id,p) WHERE l.id=v.id AND l.user_id=$3',[changes.map(c=>c.id),changes.map(c=>c.next),req.user.id]);
 logEvent(req.user.id,'price_bulk','user',req.user.id,changes.length+' prețuri '+(dir>0?'majorate':'reduse')+' cu '+val+(mode==='percent'?'%':' lei'));
 res.json({updated:changes.length});
}));
app.post('/api/listings/import',auth,needVerified,requireDb,ah(async(req,res)=>{
 const b=req.body||{}, dry=!!b.dry, rows=b.rows;
 if(!Array.isArray(rows)||!rows.length)return res.status(400).json({error:'CSV_GOL'});
 if(rows.length>IMPORT_MAX_ROWS)return res.status(400).json({error:'PREA_MULTE_RANDURI'});
 if(!throttle(authAttempts,(dry?'impd:':'imp:')+req.user.id,dry?40:10,60*60*1000))return res.status(429).json({error:'PREA_MULTE_CERERI'});
 const existing=await pool.query("SELECT lower(title) t,lower(COALESCE(oem,'')) o FROM listings WHERE user_id=$1 AND status IN ('approved','pending')",[req.user.id]);
 const seen=new Set(existing.rows.map(x=>x.t+'|'+x.o));
 let room=Infinity;
 if(req.user.role!=='admin'){const act=await pool.query("SELECT COUNT(*)::int n FROM listings WHERE user_id=$1 AND status IN ('approved','pending')",[req.user.id]);room=Math.max(0,ACTIVE_LISTINGS_LIMIT-act.rows[0].n);}
 const ok=[], bad=[];
 rows.forEach((raw,i)=>{
  const line=i+2, title=String((raw&&raw.title)||'').slice(0,80);
  const n=normImportRow(raw); if(n.err){bad.push({line,title,error:n.err});return;}
  const p=parseListing(n.x); if(p.error){bad.push({line,title,error:IMP_ERR[p.error]||'Date invalide'});return;}
  const key=p.v.title.toLowerCase()+'|'+String(p.v.oem||'').toLowerCase();
  if(seen.has(key)){bad.push({line,title,error:'Duplicat (există deja un anunț cu același titlu și cod OEM)',skipped:true});return;}
  if(ok.length>=room){bad.push({line,title,error:'Limita de '+ACTIVE_LISTINGS_LIMIT+' de anunțuri active a fost atinsă'});return;}
  seen.add(key); ok.push({line,v:p.v});
 });
 if(dry)return res.json({dry:true,total:rows.length,valid:ok.length,invalid:bad.length,errors:bad.slice(0,100)});
 const ids=[], client=await pool.connect();
 try{
  await client.query('BEGIN');
  for(const {v} of ok){
   const r=await client.query(`INSERT INTO listings(user_id,type,title,price,condition,make,model,generation,year,engine,fuel,vehicle_id,seller_type,quantity,negotiable,county,category,oem,delivery,description,images,status,subcategory,km,vin,parts_avail) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26) RETURNING id`,
    [req.user.id,v.type,v.title,v.price,v.condition,v.make,v.model,v.generation,v.year,v.engine,v.fuel,v.vehicle_id,v.seller_type,v.quantity||1,v.negotiable,v.county,v.category,v.oem,v.delivery,v.description,v.images,NEW_LISTING_STATUS,v.subcategory,v.km,v.vin,v.parts_avail]);
   ids.push(r.rows[0].id);
  }
  await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
 if(NEW_LISTING_STATUS==='approved'&&ids.length)alertForListings(ids);
 logEvent(req.user.id,'import','user',req.user.id,ids.length+' anunțuri importate, '+bad.length+' respinse din '+rows.length+' rânduri');
 res.status(201).json({dry:false,total:rows.length,imported:ids.length,invalid:bad.length,errors:bad.slice(0,100),status:NEW_LISTING_STATUS});
}));

/* ===== Contoare pentru insigne (meniu, mesaje, comenzi, oferte, alerte, anunțuri care expiră) ===== */
app.get('/api/counts',auth,requireDb,ah(async(req,res)=>{
 const r=(await pool.query(`SELECT
  (SELECT COUNT(*)::int FROM messages m WHERE m.recipient_id=$1 AND NOT m.arch_r AND NOT m.is_read AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE b.blocker_id=$1 AND b.blocked_id=m.sender_id)) AS messages,
  (SELECT COUNT(*)::int FROM orders WHERE seller_id=$1 AND status='new') AS orders_seller,
  (SELECT COUNT(*)::int FROM orders WHERE buyer_id=$1 AND status IN ('confirmed','shipped') AND buyer_seen_status IS DISTINCT FROM status) AS orders_buyer,
  (SELECT COUNT(*)::int FROM offers o JOIN part_requests q ON q.id=o.request_id WHERE q.user_id=$1 AND q.status='open' AND o.status='pending') AS offers_received,
  (SELECT COUNT(*)::int FROM notifications WHERE user_id=$1 AND NOT is_read AND kind='alert') AS alerts,
  (SELECT COUNT(*)::int FROM listings WHERE user_id=$1 AND status='approved' AND created_at < NOW() - INTERVAL '30 days') AS expire`,[req.user.id])).rows[0];
 const total=r.messages+r.orders_seller+r.orders_buyer+r.offers_received+r.alerts+r.expire;
 res.set('Cache-Control','no-store');
 res.json({...r,total});
}));

/* ===== Mod vacanță ===== */
app.put('/api/account/vacation',requireDb,auth,ah(async(req,res)=>{
 const b=req.body||{}, on=b.on===true; let until=null;
 if(on&&b.until!=null&&String(b.until).trim()!==''){
  const v=String(b.until).trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return res.status(400).json({error:'DATA_INVALIDA'});
  let ok=false;
  try{ok=(await pool.query(`SELECT ($1::date>=${TODAY_SQL} AND $1::date<=${TODAY_SQL}+365) ok`,[v])).rows[0].ok;}catch{ok=false;}
  if(!ok)return res.status(400).json({error:'DATA_INVALIDA'});
  until=v;
 }
 const r=await pool.query('UPDATE users SET vacation=$1,vacation_until=$2 WHERE id=$3 RETURNING vacation,vacation_until::text vacation_until',[on,until,req.user.id]);
 logEvent(req.user.id,on?'vacation_on':'vacation_off','user',req.user.id,on?(until?'până la '+until:'fără dată'):'');
 res.json({vacation:r.rows[0].vacation,vacation_until:r.rows[0].vacation_until});
}));
/* ===== Utilizatori blocați ===== */
app.get('/api/blocks',auth,requireDb,ah(async(req,res)=>{
 const r=await pool.query('SELECT b.blocked_id id,COALESCE(u.nickname,u.name) name,b.created_at FROM user_blocks b JOIN users u ON u.id=b.blocked_id WHERE b.blocker_id=$1 ORDER BY b.created_at DESC LIMIT 200',[req.user.id]);
 res.json({blocks:r.rows});
}));
app.post('/api/blocks',auth,requireDb,ah(async(req,res)=>{
 if(!throttle(authAttempts,'blk:'+req.user.id,60,60*60*1000))return res.status(429).json({error:'PREA_MULTE_CERERI'});
 const b=req.body||{}; let id=Number(b.user_id);
 if(!Number.isInteger(id)&&typeof b.nickname==='string'&&b.nickname.trim()){
  const f=(await pool.query('SELECT id FROM users WHERE LOWER(nickname)=LOWER($1)',[b.nickname.trim().slice(0,30)])).rows[0];
  if(!f)return res.status(404).json({error:'DESTINATAR_NEGASIT'});
  id=f.id;
 }
 if(!Number.isInteger(id)||id<=0||id===req.user.id)return res.status(400).json({error:'DATE_INVALIDE'});
 const t=(await pool.query('SELECT id,role FROM users WHERE id=$1',[id])).rows[0];
 if(!t)return res.status(404).json({error:'NOT_FOUND'});
 if(t.role==='admin')return res.status(400).json({error:'NU_SE_POATE_BLOCA'});
 if(Number((await pool.query('SELECT COUNT(*) n FROM user_blocks WHERE blocker_id=$1',[req.user.id])).rows[0].n)>=200)return res.status(400).json({error:'MAX_BLOCARI'});
 const ib=await pool.query('INSERT INTO user_blocks(blocker_id,blocked_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[req.user.id,id]);
 if(ib.rowCount)logEvent(req.user.id,'block','user',id,'');
 res.json({ok:true});
}));
app.delete('/api/blocks/:uid',auth,requireDb,ah(async(req,res)=>{
 if(!/^\d{1,10}$/.test(req.params.uid))return res.status(400).json({error:'ID_INVALID'});
 const db=await pool.query('DELETE FROM user_blocks WHERE blocker_id=$1 AND blocked_id=$2',[req.user.id,Number(req.params.uid)]);
 if(db.rowCount)logEvent(req.user.id,'unblock','user',Number(req.params.uid),'');
 res.json({ok:true});
}));
/* ===== Căutări salvate + alerte pentru anunțuri noi =====
   Căutarea se salvează pe cont (qs = parametrii din URL-ul rezultatelor). La fiecare aprobare de anunț (admin, „aprobă tot” sau publicare
   automată) se verifică căutările cu alerte active, cu ACELEAȘI filtre ca în căutarea publică (buildListingFilter). saved_search_hits
   împiedică alerta dublă pentru același anunț (ex. după editare + reaprobare). Alerta = notificare în site (+ email dacă e activat). */
const SAVED_KEYS=['q','type','condition','year','seller_type','make','model','county','category','seller_id','maxPrice','delivery','sort','sname'];
const SAVED_FILTER_KEYS=['q','type','condition','year','seller_type','make','model','county','category','seller_id','maxPrice','delivery'];
const MAX_SAVED_SEARCHES=30;
function cleanSavedQs(raw){
 const src=new URLSearchParams(String(raw||'').slice(0,800)),out=new URLSearchParams();
 for(const k of SAVED_KEYS){const v=String(src.get(k)||'').trim().slice(0,100);if(v)out.set(k,v);}
 return SAVED_FILTER_KEYS.some(k=>out.has(k))?out.toString():null;
}
async function alertForListings(ids){
 try{
  if(!pool||!Array.isArray(ids))return;
  ids=ids.map(Number).filter(n=>Number.isInteger(n)&&n>0).slice(0,500);
  if(!ids.length)return;
  const ss=(await pool.query("SELECT s.id,s.user_id,s.label,s.qs FROM saved_searches s JOIN users u ON u.id=s.user_id WHERE s.alerts AND u.status='active' ORDER BY s.id LIMIT 5000")).rows;
  for(const s of ss){
   const f=buildListingFilter(Object.fromEntries(new URLSearchParams(s.qs))), k=f.vals.length;
   // anunțul trebuie să treacă filtrele, să nu fie al celui care caută și să nu existe blocare între cei doi
   const m=await pool.query(`SELECT l.id,l.title FROM listings l WHERE l.id=ANY($${k+1}::int[]) AND l.user_id IS DISTINCT FROM $${k+2} AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE (b.blocker_id=$${k+2} AND b.blocked_id=l.user_id) OR (b.blocker_id=l.user_id AND b.blocked_id=$${k+2})) AND ${f.where.join(' AND ')} ORDER BY l.id`,[...f.vals,ids,s.user_id]);
   if(!m.rowCount)continue;
   const fresh=await pool.query('INSERT INTO saved_search_hits(search_id,listing_id) SELECT $1,x FROM unnest($2::int[]) x ON CONFLICT DO NOTHING RETURNING listing_id',[s.id,m.rows.map(x=>x.id)]);
   if(!fresh.rowCount)continue;
   const first=m.rows.find(x=>x.id===fresh.rows[0].listing_id)||m.rows[0];
   const label=String(s.label).slice(0,60);
   await notify(s.user_id,fresh.rowCount===1?`Anunț nou pentru căutarea „${label}”: ${String(first.title).slice(0,120)}`:`${fresh.rowCount} anunțuri noi pentru căutarea „${label}”`,'alert');
   await pool.query('UPDATE saved_searches SET last_alert_at=NOW() WHERE id=$1',[s.id]);
  }
 }catch(e){console.error('alertForListings',e.message);}
}
app.get('/api/saved-searches',auth,requireDb,ah(async(req,res)=>{
 const r=await pool.query('SELECT id,label,qs,alerts,created_at,last_alert_at FROM saved_searches WHERE user_id=$1 ORDER BY created_at DESC,id DESC LIMIT 100',[req.user.id]);
 res.json({searches:r.rows});
}));
app.post('/api/saved-searches',auth,requireDb,ah(async(req,res)=>{
 if(!throttle(authAttempts,'ssr:'+req.user.id,60,60*60*1000))return res.status(429).json({error:'PREA_MULTE_CERERI'});
 const b=req.body||{}, qs=cleanSavedQs(b.qs), label=clip(b.label,120);
 if(!qs||!label)return res.status(400).json({error:'DATE_INVALIDE'});
 const c=(await pool.query('SELECT COUNT(*)::int n,COALESCE(BOOL_OR(qs=$2),FALSE) has FROM saved_searches WHERE user_id=$1',[req.user.id,qs])).rows[0];
 if(!c.has&&c.n>=MAX_SAVED_SEARCHES)return res.status(400).json({error:'MAX_CAUTARI'});
 const alerts=b.alerts!==false;
 // import=true (mutarea căutărilor locale pe cont): nu suprascrie o căutare deja salvată.
 const r=await pool.query(`INSERT INTO saved_searches(user_id,label,qs,alerts) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,qs) DO ${b.import===true?'NOTHING':'UPDATE SET label=EXCLUDED.label,alerts=EXCLUDED.alerts'} RETURNING id,label,qs,alerts`,[req.user.id,label,qs,alerts]);
 res.status(201).json({search:r.rows[0]||null});
}));
app.patch('/api/saved-searches/:id',auth,requireDb,ah(async(req,res)=>{
 if(!/^\d{1,10}$/.test(req.params.id))return res.status(400).json({error:'ID_INVALID'});
 const r=await pool.query('UPDATE saved_searches SET alerts=$1 WHERE id=$2 AND user_id=$3 RETURNING id,alerts',[(req.body||{}).alerts===true,Number(req.params.id),req.user.id]);
 if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 res.json({search:r.rows[0]});
}));
app.delete('/api/saved-searches/:id',auth,requireDb,ah(async(req,res)=>{
 if(!/^\d{1,10}$/.test(req.params.id))return res.status(400).json({error:'ID_INVALID'});
 await pool.query('DELETE FROM saved_searches WHERE id=$1 AND user_id=$2',[Number(req.params.id),req.user.id]);
 res.json({ok:true});
}));
app.get('/robots.txt',(req,res)=>{res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\n\n${['GPTBot','ChatGPT-User','OAI-SearchBot','ClaudeBot','anthropic-ai','Google-Extended','CCBot','PerplexityBot','Bytespider','Amazonbot','Applebot-Extended','Diffbot','ImagesiftBot','Omgilibot','cohere-ai','meta-externalagent'].map(b=>`User-agent: ${b}\nDisallow: /\n`).join('\n')}\nSitemap: ${appBaseUrl(req)}/sitemap.xml\n`);});
app.get('/sitemap.xml',async(req,res)=>{
 const base=appBaseUrl(req); const urls=[base+'/'];
 if(pool){try{const ix=await getSeoIndex();urls.push(base+'/piese-auto');for(const c of ix.catBySlug.values())urls.push(`${base}/piese-auto/${c.slug}`);for(const m of ix.makeBySlug.values()){urls.push(`${base}/piese-auto/${m.slug}`);for(const d of m.models.values()){urls.push(`${base}/piese-auto/${m.slug}/${d.slug}`);for(const c of d.cats.values())if(c.n>=SEO_MIN_COMBO)urls.push(`${base}/piese-auto/${m.slug}/${d.slug}/${c.slug}`);}}}catch(e){console.error(e);}}
 if(pool){try{const r=await pool.query("SELECT l.id,l.title,l.created_at FROM listings l WHERE l.status='approved' AND "+NOT_VAC_LISTING+" ORDER BY l.created_at DESC LIMIT 5000");urls.push(...r.rows.map(x=>`${base}/piese/${x.id}-${slugify(x.title)}`));}catch(e){console.error(e);}}
 res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(u=>`<url><loc>${escapeXml(u)}</loc></url>`).join('')+'</urlset>');
});
function escapeXml(s){return String(s).replace(/[<>&'"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]));}
/* ===== SEO: pagini pe categorie, marcă și model (/piese-auto/...) ===== */
const SEO_PAGE_SIZE=30, SEO_IDX_TTL=5*60*1000, SEO_MIN_COMBO=Math.max(1,Math.floor(Number(process.env.SEO_MIN_COMBO))||2);
const seoKey=s=>norm(s).replace(/\s+/g,'');
function seoPlural(n,one,many){return n===1?`1 ${one}`:`${new Intl.NumberFormat('ro-RO').format(n)} ${many}`;}
// Index în memorie: categorii, mărci și modele care au cel puțin un anunț aprobat (se reface la 5 minute sau după modificări).
async function getSeoIndex(){
 if(SEO_IDX&&Date.now()-SEO_IDX.at<SEO_IDX_TTL)return SEO_IDX;
 const r=await pool.query(`SELECT l.category,l.make,l.model,COUNT(*)::int n FROM listings l WHERE l.status='approved' AND l.type<>'masina' AND ${NOT_VAC_LISTING} GROUP BY l.category,l.make,l.model`);
 const cats=new Map(),makes=new Map();
 const bump=(map,key,name,n)=>{let e=map.get(key);if(!e){e={key,n:0,names:new Map()};map.set(key,e);}e.n+=n;e.names.set(name,(e.names.get(name)||0)+n);return e;};
 for(const row of r.rows){
  const cat=String(row.category||'').trim(),mk=String(row.make||'').trim(),md=String(row.model||'').trim();
  if(cat&&CATEGORIES.includes(cat))bump(cats,seoKey(cat),cat,row.n);
  if(mk){const m=bump(makes,seoKey(mk),mk,row.n);m.models=m.models||new Map();if(md){const me=bump(m.models,seoKey(md),md,row.n);if(cat&&CATEGORIES.includes(cat)){me.cats=me.cats||new Map();bump(me.cats,seoKey(cat),cat,row.n);}}}
 }
 const best=e=>[...e.names.entries()].sort((a,b)=>b[1]-a[1])[0][0];
 const fin=map=>{const out=new Map();for(const e of map.values()){e.name=best(e);e.slug=slugify(e.name);if(e.slug)out.set(e.slug,e);}return out;};
 const catBySlug=fin(cats),makeBySlug=fin(makes);
 for(const m of makeBySlug.values()){m.models=m.models?fin(m.models):new Map();for(const d of m.models.values())d.cats=d.cats?fin(d.cats):new Map();}
 SEO_IDX={at:Date.now(),catBySlug,makeBySlug};
 return SEO_IDX;
}

function seoShell(req,{title,desc,canonical,robots,ld,body,prev,next}){
 const ldTags=(ld||[]).map(o=>`<script type="application/ld+json">${JSON.stringify(o).replace(/</g,'\\u003c')}</script>`).join('');
 const links=(prev?`<link rel="prev" href="${escapeHtml(prev)}">`:'')+(next?`<link rel="next" href="${escapeHtml(next)}">`:'');
 return `<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(desc)}">${robots?`<meta name="robots" content="${robots}">`:''}<link rel="canonical" href="${escapeHtml(canonical)}">${links}<meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(desc)}"><meta property="og:url" content="${escapeHtml(canonical)}"><link rel="stylesheet" href="/style.css">${ldTags}</head><body class="ssr-body"><header class="topbar"><div class="container topbar-in"><a class="logo" href="/"><span class="logo-a">Auto</span><span class="logo-b">Parts</span></a><nav class="ssr-nav"><a href="/piese-auto">Categorii</a><a href="/#/rezultate">Caută piese</a></nav></div></header><main class="container ssr-page">${body}</main><footer class="ssr-foot container"><a href="/">AutoParts</a> · <a href="/piese-auto">Piese auto pe categorii și mărci</a></footer></body></html>`;
}
const seoCrumbs=(items)=>`<nav class="crumbs" aria-label="Navigare">${items.map((c,i)=>i===items.length-1?`<span>${escapeHtml(c[0])}</span>`:`<a href="${escapeHtml(c[1])}">${escapeHtml(c[0])}</a>`).join(' › ')}</nav>`;
const seoCrumbLd=(base,items)=>({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items.map((c,i)=>({'@type':'ListItem',position:i+1,name:c[0],item:base+c[1]}))});
const seoChips=(arr)=>arr.length?`<ul class="ssr-chips">${arr.map(([label,href,n])=>`<li><a href="${escapeHtml(href)}">${escapeHtml(label)} <small>${n}</small></a></li>`).join('')}</ul>`:'';
function seoRow(x){
 const price=Number(x.price||0)>0?new Intl.NumberFormat('ro-RO').format(Number(x.price))+' lei':'La cerere';
 const img=Array.isArray(x.images)&&/^https?:\/\//.test(x.images[0]||'')?`<img class="ssr-thumb" src="${escapeHtml(x.images[0])}" alt="${escapeHtml(x.title)}" loading="lazy" width="96" height="96">`:'<span class="ssr-thumb ssr-thumb-empty" aria-hidden="true"></span>';
 const meta=[x.make,x.model,x.year,x.condition,x.county].filter(Boolean).join(' · ');
 return `<li class="ssr-item"><a class="ssr-item-link" href="/piese/${x.id}-${slugify(x.title)}">${img}<span class="ssr-item-txt"><b>${escapeHtml(x.title)}</b><small>${escapeHtml(meta)}</small></span><span class="ssr-item-price">${price}</span></a></li>`;
}
// Randează o pagină de listare (categorie / marcă / model) cu paginare, linkuri interne și date structurate.
async function seoListingPage(req,res,o){
 const page=Math.min(500,Math.max(1,Math.floor(Number(req.query.p))||1)), offset=(page-1)*SEO_PAGE_SIZE;
 const {where,vals}=buildListingFilter(o.filter);
 const [cnt,rows,agg]=await Promise.all([
  pool.query(`SELECT COUNT(*)::int n FROM listings l WHERE ${where.join(' AND ')}`,vals),
  pool.query(`SELECT l.id,l.title,l.price,l.condition,l.make,l.model,l.year,l.county,l.images[1:1] AS images FROM listings l WHERE ${where.join(' AND ')} ORDER BY l.created_at DESC, l.id DESC LIMIT ${SEO_PAGE_SIZE} OFFSET ${offset}`,vals),
  pool.query(`SELECT MIN(NULLIF(l.price,0)) pmin,MAX(l.price) pmax,COUNT(DISTINCT l.county)::int counties FROM listings l WHERE ${where.join(' AND ')}`,vals)
 ]);
 const total=cnt.rows[0].n; if(!total||(page>1&&!rows.rowCount))return seoNotFound(req,res);
 const base=appBaseUrl(req), pages=Math.ceil(total/SEO_PAGE_SIZE);
 const url=p=>base+o.path+(p>1?`?p=${p}`:'');
 const a=agg.rows[0], pmin=Number(a.pmin||0), pmax=Number(a.pmax||0), fmt=n=>new Intl.NumberFormat('ro-RO').format(n);
 const intro=`${o.intro} Găsești ${seoPlural(total,'anunț','anunțuri')} de la vânzători din ${a.counties>1?seoPlural(a.counties,'județ','județe'):'România'}${pmin?`, cu prețuri între ${fmt(pmin)} și ${fmt(pmax)} lei`:''}. Contactezi direct vânzătorul, fără comision.`;
 const title=`${o.h1}${page>1?` – pagina ${page}`:''} | AutoParts`;
 const desc=`${o.h1}: ${seoPlural(total,'anunț','anunțuri')}${pmin?` de la ${fmt(pmin)} lei`:''}. Piese noi și second hand, contact direct cu vânzătorul pe AutoParts.`.slice(0,158);
 const pager=pages>1?`<nav class="ssr-pager" aria-label="Pagini">${page>1?`<a rel="prev" href="${escapeHtml(o.path+(page>2?`?p=${page-1}`:''))}">‹ Înapoi</a>`:'<span></span>'}<span>Pagina ${page} din ${pages}</span>${page<pages?`<a rel="next" href="${escapeHtml(o.path+`?p=${page+1}`)}">Înainte ›</a>`:'<span></span>'}</nav>`:'';
 const ld=[seoCrumbLd(base,o.crumbs),{'@context':'https://schema.org','@type':'CollectionPage',name:o.h1,url:url(page),description:desc,mainEntity:{'@type':'ItemList',numberOfItems:total,itemListElement:rows.rows.map((x,i)=>({'@type':'ListItem',position:offset+i+1,url:`${base}/piese/${x.id}-${slugify(x.title)}`,name:x.title}))}}];
 const body=`${seoCrumbs(o.crumbs)}<h1>${escapeHtml(o.h1)}</h1><p class="ssr-intro">${escapeHtml(intro)}</p>${o.extra||''}<ul class="ssr-list">${rows.rows.map(seoRow).join('')}</ul>${pager}<p class="ssr-cta"><a class="btn primary" href="${escapeHtml(o.spa)}">Filtrează și caută în rezultate</a> <a class="btn ghost" href="/#/cerere-noua">Primește oferte piese</a></p>`;
 res.set('Cache-Control','public, max-age=300').type('html').send(seoShell(req,{title,desc,canonical:url(page),ld,body,prev:page>1?url(page-1):'',next:page<pages?url(page+1):''}));
}
function seoNotFound(req,res){
 const body=`<h1>Nu am găsit anunțuri aici</h1><p class="ssr-intro">Momentan nu există anunțuri active pentru această pagină. Încearcă o altă categorie sau marcă.</p><p class="ssr-cta"><a class="btn primary" href="/piese-auto">Vezi toate categoriile</a></p>`;
 res.status(404).set('Cache-Control','no-store').type('html').send(seoShell(req,{title:'Pagină indisponibilă | AutoParts',desc:'Pagina nu mai are anunțuri active.',canonical:appBaseUrl(req)+'/piese-auto',robots:'noindex,follow',body}));
}
const topN=(map,n)=>[...map.values()].sort((a,b)=>b.n-a.n||a.name.localeCompare(b.name,'ro')).slice(0,n);

// Hub: toate categoriile și mărcile cu anunțuri.
app.get('/piese-auto',ah(async(req,res,next)=>{
 if(!pool)return next();
 const ix=await getSeoIndex(),base=appBaseUrl(req);
 if(!ix.catBySlug.size&&!ix.makeBySlug.size)return seoNotFound(req,res);
 const crumbs=[['AutoParts','/'],['Piese auto','/piese-auto']];
 const body=`${seoCrumbs(crumbs)}<h1>Piese auto second hand și noi</h1><p class="ssr-intro">Răsfoiește anunțurile pe categorie de piese sau pe marca mașinii tale.</p><h2>Categorii</h2>${seoChips(topN(ix.catBySlug,60).map(e=>[e.name,`/piese-auto/${e.slug}`,e.n]))}<h2>Mărci auto</h2>${seoChips(topN(ix.makeBySlug,300).map(e=>[e.name,`/piese-auto/${e.slug}`,e.n]))}`;
 res.set('Cache-Control','public, max-age=300').type('html').send(seoShell(req,{title:'Piese auto pe categorii și mărci | AutoParts',desc:'Piese auto noi și second hand, pe categorii și mărci. Contact direct cu vânzătorul.',canonical:base+'/piese-auto',ld:[seoCrumbLd(base,crumbs)],body}));
}));
// Categorie sau marcă (categoria are prioritate la același slug).
app.get('/piese-auto/:slug',ah(async(req,res,next)=>{
 if(!pool)return next();
 const slug=String(req.params.slug||'').toLowerCase(); if(!/^[a-z0-9-]{1,120}$/.test(slug))return next();
 const ix=await getSeoIndex();
 const cat=ix.catBySlug.get(slug);
 if(cat){
  const byMake=new Map();
  const r=await pool.query(`SELECT l.make,COUNT(*)::int n FROM listings l WHERE l.status='approved' AND l.type<>'masina' AND ${NOT_VAC_LISTING} AND ${flat('l.category')}=$1 AND COALESCE(l.make,'')<>'' GROUP BY l.make`,[cat.key]);
  const mkByKey=new Map([...ix.makeBySlug.values()].map(m=>[m.key,m]));
  for(const row of r.rows){const m=mkByKey.get(seoKey(row.make));if(m)byMake.set(m.slug,{name:m.name,slug:m.slug,n:(byMake.get(m.slug)?.n||0)+row.n});}
  const makes=topN(byMake,24);
  const crumbs=[['AutoParts','/'],['Piese auto','/piese-auto'],[cat.name,`/piese-auto/${cat.slug}`]];
  const extra=makes.length?`<h2>${escapeHtml(cat.name)} după marcă</h2>${seoChips(makes.map(m=>[m.name,`/piese-auto/${m.slug}`,m.n]))}`:'';
  return seoListingPage(req,res,{filter:{category:cat.name},path:`/piese-auto/${cat.slug}`,spa:`/#/rezultate?category=${encodeURIComponent(cat.name)}`,h1:`${cat.name} – piese auto second hand și noi`,intro:`Anunțuri pentru ${cat.name.toLowerCase()} de la vânzători din toată țara.`,crumbs,extra});
 }
 const mk=ix.makeBySlug.get(slug);
 if(!mk)return seoNotFound(req,res);
 const crumbs=[['AutoParts','/'],['Piese auto','/piese-auto'],[mk.name,`/piese-auto/${mk.slug}`]];
 const extra=mk.models.size?`<h2>Modele ${escapeHtml(mk.name)}</h2>${seoChips(topN(mk.models,60).map(m=>[`${mk.name} ${m.name}`,`/piese-auto/${mk.slug}/${m.slug}`,m.n]))}`:'';
 return seoListingPage(req,res,{filter:{make:mk.name},path:`/piese-auto/${mk.slug}`,spa:`/#/rezultate?make=${encodeURIComponent(mk.name)}`,h1:`Piese auto ${mk.name} – second hand și noi`,intro:`Piese pentru mașini ${mk.name}: caroserie, motor, suspensie, frâne și altele.`,crumbs,extra});
}));
// Model: /piese-auto/skoda/superb
app.get('/piese-auto/:make/:model',ah(async(req,res,next)=>{
 if(!pool)return next();
 const ms=String(req.params.make||'').toLowerCase(),ds=String(req.params.model||'').toLowerCase();
 if(!/^[a-z0-9-]{1,120}$/.test(ms)||!/^[a-z0-9-]{1,120}$/.test(ds))return next();
 const ix=await getSeoIndex(),mk=ix.makeBySlug.get(ms),md=mk&&mk.models.get(ds);
 if(!md)return seoNotFound(req,res);
 const r=await pool.query(`SELECT l.category,COUNT(*)::int n FROM listings l WHERE l.status='approved' AND l.type<>'masina' AND ${NOT_VAC_LISTING} AND ${flat('l.make')}=$1 AND ${flat('l.model')}=$2 AND COALESCE(l.category,'')<>'' GROUP BY l.category ORDER BY n DESC`,[mk.key,md.key]);
 const full=`${mk.name} ${md.name}`;
 const crumbs=[['AutoParts','/'],['Piese auto','/piese-auto'],[mk.name,`/piese-auto/${mk.slug}`],[md.name,`/piese-auto/${mk.slug}/${md.slug}`]];
 const extra=r.rows.length?`<h2>Categorii de piese pentru ${escapeHtml(full)}</h2>${seoChips(r.rows.map(x=>{const cs=slugify(x.category),ce=md.cats.get(cs);return [x.category,ce&&ce.n>=SEO_MIN_COMBO?`/piese-auto/${mk.slug}/${md.slug}/${cs}`:`/#/rezultate?make=${encodeURIComponent(mk.name)}&model=${encodeURIComponent(md.name)}&category=${encodeURIComponent(x.category)}`,x.n];}))}`:'';
 return seoListingPage(req,res,{filter:{make:mk.name,model:md.name},path:`/piese-auto/${mk.slug}/${md.slug}`,spa:`/#/rezultate?make=${encodeURIComponent(mk.name)}&model=${encodeURIComponent(md.name)}`,h1:`Piese auto ${full} – second hand și noi`,intro:`Piese pentru ${full}, de la parcuri de dezmembrări, firme și persoane fizice.`,crumbs,extra});
}));

// Categorie + marcă + model: /piese-auto/skoda/superb/caroserie (doar cu cel puțin SEO_MIN_COMBO anunțuri)
app.get('/piese-auto/:make/:model/:cat',ah(async(req,res,next)=>{
 if(!pool)return next();
 const ms=String(req.params.make||'').toLowerCase(),ds=String(req.params.model||'').toLowerCase(),cs=String(req.params.cat||'').toLowerCase();
 if(![ms,ds,cs].every(v=>/^[a-z0-9-]{1,120}$/.test(v)))return next();
 const ix=await getSeoIndex(),mk=ix.makeBySlug.get(ms),md=mk&&mk.models.get(ds),ce=md&&md.cats.get(cs);
 if(!ce||ce.n<SEO_MIN_COMBO)return seoNotFound(req,res);
 const full=`${mk.name} ${md.name}`, base=`/piese-auto/${mk.slug}/${md.slug}`;
 const crumbs=[['AutoParts','/'],['Piese auto','/piese-auto'],[mk.name,`/piese-auto/${mk.slug}`],[md.name,base],[ce.name,`${base}/${ce.slug}`]];
 const others=topN(md.cats,30).filter(c=>c.slug!==ce.slug&&c.n>=SEO_MIN_COMBO).map(c=>[`${c.name} ${full}`,`${base}/${c.slug}`,c.n]);
 const extra=`<p class="ssr-intro"><a href="${escapeHtml(base)}">Toate piesele pentru ${escapeHtml(full)}</a> · <a href="${escapeHtml('/piese-auto/'+ce.slug)}">${escapeHtml(ce.name)} pentru alte mărci</a></p>${others.length?`<h2>Alte piese pentru ${escapeHtml(full)}</h2>${seoChips(others)}`:''}`;
 return seoListingPage(req,res,{filter:{make:mk.name,model:md.name,category:ce.name},path:`${base}/${ce.slug}`,spa:`/#/rezultate?make=${encodeURIComponent(mk.name)}&model=${encodeURIComponent(md.name)}&category=${encodeURIComponent(ce.name)}`,h1:`${ce.name} ${full} – second hand și noi`,intro:`${ce.name} pentru ${full}, de la parcuri de dezmembrări, firme și persoane fizice.`,crumbs,extra});
}));
app.get('/piese/:idSlug',async(req,res,next)=>{
 if(!pool)return next();
 const id=Number(String(req.params.idSlug).split('-')[0]); if(!Number.isInteger(id)||id<=0)return next();
 try{
  const r=await pool.query("SELECT l.*,COALESCE(u.nickname,u.name) seller_name,"+VAC_SQL('u')+" on_vac FROM listings l LEFT JOIN users u ON u.id=l.user_id WHERE l.id=$1 AND l.status='approved'",[id]);
  if(!r.rowCount)return next();
  const x=r.rows[0]; const base=appBaseUrl(req); const slug=slugify(x.title);
  if(req.params.idSlug!==`${x.id}-${slug}`)return res.redirect(301,`/piese/${x.id}-${slug}`);
  const canonical=`${escapeHtml(base)}/piese/${x.id}-${slug}`;
  const product={'@context':'https://schema.org','@type':'Product',name:x.title,description:x.description||x.title,sku:x.oem||String(x.id),brand:x.make?{'@type':'Brand',name:x.make}:undefined,itemCondition:x.condition==='Nouă'?'https://schema.org/NewCondition':'https://schema.org/UsedCondition',offers:{'@type':'Offer',price:Number(x.price||0),priceCurrency:'RON',availability:x.on_vac?'https://schema.org/OutOfStock':'https://schema.org/InStock',url:canonical}};
  const clean=JSON.stringify(product).replace(/</g,'\\u003c');
  const price=Number(x.price||0)>0?new Intl.NumberFormat('ro-RO').format(Number(x.price))+' lei':'La cerere';
  res.set('Cache-Control','public, max-age=300').type('html').send(`<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(x.title)} | AutoParts</title><meta name="description" content="${escapeHtml((x.description||x.title).slice(0,155))}"><link rel="canonical" href="${escapeHtml(canonical)}"><link rel="stylesheet" href="/style.css"><script type="application/ld+json">${clean}</script></head><body><header class="topbar"><div class="container topbar-in"><a class="logo" href="/"><span class="logo-a">Auto</span><span class="logo-b">Parts</span></a></div></header><main class="container ssr-page"><p class="crumbs"><a href="/">AutoParts</a> › ${escapeHtml(x.category||'Piese auto')}</p><h1>${escapeHtml(x.title)}</h1><p class="ssr-meta">${escapeHtml([x.make,x.model,x.year].filter(Boolean).join(' · '))}</p><p class="ssr-price">${price}</p><p>${escapeHtml(x.description||'')}</p><dl class="ssr-dl"><dt>Stare</dt><dd>${escapeHtml(x.condition||'—')}</dd><dt>Cod OEM</dt><dd>${escapeHtml(x.oem||'—')}</dd><dt>Județ</dt><dd>${escapeHtml(x.county||'—')}</dd><dt>Vânzător</dt><dd>${escapeHtml(x.seller_name||'—')}</dd></dl><p><a class="btn primary" href="/#/rezultate">Vezi toate anunțurile</a></p></main></body></html>`);
 }catch(e){console.error(e);return next();}
});

app.use('/api',(req,res)=>res.status(404).json({error:'NOT_FOUND'}));
app.get('*',(req,res)=>{if(path.extname(req.path))return res.status(404).type('text/plain').send('Not found');res.set('Cache-Control','no-cache');res.sendFile(path.join(__dirname,'index.html'));});
app.use((err,req,res,next)=>{console.error('Unhandled error:',err);if(res.headersSent)return next(err);if(err&&err.type==='entity.too.large')return res.status(413).json({error:'DATE_INVALIDE'});if(err instanceof SyntaxError&&err.status===400)return res.status(400).json({error:'DATE_INVALIDE'});res.status(500).json({error:'SERVER_ERROR'});});
process.on('unhandledRejection',e=>console.error('unhandledRejection',e));
(async()=>{
 try{
  if(pool)await dbReady();
  if(pool)await loadRateState();
  const server=app.listen(PORT,()=>console.log(`AutoParts V26 running on ${PORT}`));
  if(pool){ensureVehicleDb();setInterval(ensureVehicleDb,12*3600*1000).unref();}
  /* anti-adormire: se apeleaza singur pe adresa publica, ca Render sa vada trafic (dezactivare: KEEP_AWAKE=0) */
  const selfUrl=process.env.APP_URL||process.env.RENDER_EXTERNAL_URL;
  if(selfUrl&&process.env.KEEP_AWAKE!=='0'&&typeof fetch==='function'){
    const ping=()=>fetch(selfUrl.replace(/\/$/,'')+'/api/health',{signal:AbortSignal.timeout(15000)}).catch(()=>{});
    setInterval(ping,10*60*1000).unref(); setTimeout(ping,60*1000).unref();
  }
  if(pool)setInterval(()=>pool.query("DELETE FROM site_events WHERE created_at<NOW()-INTERVAL '180 days'").catch(()=>{}),6*3600*1000).unref();
  if(pool)setInterval(()=>pool.query("DELETE FROM login_attempts WHERE at<NOW()-INTERVAL '1 hour'").catch(()=>{}),30*60*1000).unref();
  if(pool){setInterval(flushRateState,10*1000).unref();setInterval(()=>pool.query('DELETE FROM rate_state WHERE exp<$1',[Date.now()]).catch(()=>{}),30*60*1000).unref();}
  if(pool){purgeStats();setInterval(purgeStats,60*60*1000).unref();}
  if(pool)setInterval(()=>pool.query('DELETE FROM sessions WHERE expires_at < NOW()').catch(e=>console.error('session cleanup',e.message)),60*60*1000).unref();
  const stop=()=>{server.close(()=>{(pool?flushRateState().catch(()=>{}).then(()=>pool.end()):Promise.resolve()).finally(()=>process.exit(0));});setTimeout(()=>process.exit(0),8000).unref();};
  process.on('SIGTERM',stop);process.on('SIGINT',stop);
 }catch(e){console.error(e);process.exit(1);}
})();
