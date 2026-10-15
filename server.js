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
function throttle(map,key,limit,windowMs){
 const now=Date.now();
 const old=map.get(key)||[];
 const fresh=old.filter(t=>now-t<windowMs);
 if(fresh.length>=limit){ map.set(key,fresh); return false; }
 fresh.push(now); map.set(key,fresh); return true;
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
  imgSrc:["'self'","data:"],connectSrc:["'self'"],fontSrc:["'self'","data:"],objectSrc:["'none'"],
  baseUri:["'self'"],formAction:["'self'"],frameAncestors:["'none'"]}},
 crossOriginEmbedderPolicy:false}));
if(compression)app.use(compression());
app.use(express.json({limit:'6mb'}));
app.use(cookieParser());
// Cache scurt (10 s) pentru căutările publice; se golește la orice modificare de anunțuri/conturi.
const LIST_CACHE=new Map(),LIST_CACHE_TTL=10000,LIST_CACHE_MAX=300;
app.use((req,res,next)=>{if(req.method!=='GET'&&/^\/api\/(listings|admin\/listings|admin\/users|account)/.test(req.path))res.on('finish',()=>LIST_CACHE.clear());next();});
// Doar aceste fișiere (și folderul assets/) sunt publice; server.js, package.json etc. NU sunt servite.
/* ===== BOT-GUARD:START — verificare de browser, limitare cereri, blocare scrapere ===== */
const dns=require('dns').promises;
const BOT_CHECK=IS_PROD&&String(process.env.BOT_CHECK||'true').toLowerCase()!=='false';
const BOT_BITS=Math.min(20,Math.max(10,Number(process.env.BOT_DIFFICULTY)||15));
const BOT_BASE=process.env.BOT_SECRET||((DB_URL||process.env.ADMIN_PASSWORD)?DB_URL+'|'+(process.env.ADMIN_PASSWORD||''):'');
// Fără BOT_SECRET/DATABASE_URL, cheia e aleatoare (verificările se refac la fiecare repornire).
const BOT_SECRET=BOT_BASE?crypto.createHash('sha256').update('bot|'+BOT_BASE).digest('hex'):crypto.randomBytes(32).toString('hex');
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
const BOT_JS=`(function(){var el=document.querySelector('script[data-c]');if(!el)return;var chal=el.getAttribute('data-c'),bits=Number(el.getAttribute('data-b'))||15,msg=document.getElementById('bc-msg'),enc=new TextEncoder();
function zb(h){var n=0;for(var i=0;i<h.length;i++){if(h[i]===0){n+=8;continue;}n+=Math.clz32(h[i])-24;break;}return n;}
function fail(t){msg.textContent=t;msg.className='bc-err';}
(async function(){try{if(!window.crypto||!crypto.subtle)throw new Error('nocrypto');var i=0;for(;;){var h=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(chal+':'+i)));if(zb(h)>=bits)break;i++;}
var r=await fetch('/api/botcheck',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({chal:chal,counter:i})});
if(r.ok){location.reload();return;}fail(r.status===429?'Prea multe încercări. Așteaptă câteva minute și reîncarcă pagina.':'Verificarea nu a reușit. Reîncarcă pagina.');}
catch(e){fail('Browserul nu a putut face verificarea. Folosește un browser actual, cu HTTPS și JavaScript activ.');}})();})();`;
function challengePage(req){
 const c=newChallenge(req);
 return `<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Verificăm browserul… | AutoPiese</title><style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#0e0f12;color:#e9d3a8;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;text-align:center}.bc{padding:24px;max-width:420px}.bc h1{font-size:22px;margin:18px 0 8px;font-weight:650}.bc p{margin:0;color:#a89c86;font-size:15px;line-height:1.5}.bc .bc-err{color:#f0b4b4}.bc-spin{width:42px;height:42px;margin:0 auto;border-radius:50%;border:3px solid rgba(212,180,131,.25);border-top-color:#d4b483;animation:s .8s linear infinite}@keyframes s{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.bc-spin{animation-duration:3s}}</style></head><body><main class="bc"><div class="bc-spin" aria-hidden="true"></div><h1>Verificăm browserul…</h1><p id="bc-msg" role="status">Durează câteva secunde. Pagina se reîncarcă automat.</p><noscript><p class="bc-err">Activează JavaScript pentru a continua.</p></noscript></main><script src="/bot-check.js" data-c="${c}" data-b="${BOT_BITS}" defer></script></body></html>`;
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
 usedChal.set(d.n,Date.now()+10*60*1000);
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
   if(req.method==='GET'&&/^\/api\/(listings|requests|sellers|stores|offers)/.test(p)&&!throttle(dataHits,ip,Number(process.env.DATA_RATE_PER_MIN)||200,60000))return tooMany();
  }
  if(!BOT_CHECK)return next();
  if(req.method==='GET'){
   if(SOCIAL_RE.test(ua)&&/^\/piese\//.test(p))return next();   // previzualizări WhatsApp/Facebook pentru linkurile de anunț
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
 if(adminEmail&&adminPass){const r=await pool.query('SELECT id FROM users WHERE email=$1',[adminEmail.toLowerCase()]);if(!r.rowCount){const hash=await bcrypt.hash(adminPass,12);await pool.query("INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'admin')",['Administrator',adminEmail.toLowerCase(),hash]);}else{await pool.query("UPDATE users SET role='admin' WHERE email=$1 AND role<>'admin'",[adminEmail.toLowerCase()]);}}
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
  const r=await pool.query('SELECT s.id session_id,s.expires_at,u.id,u.name,u.nickname,u.email,u.phone,u.show_phone,u.role,u.status,u.email_verified FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW()',[hashToken(token)]);
  if(!r.rowCount)return res.status(401).json({error:'AUTH_REQUIRED'});
  const u=r.rows[0];
  if(u.status!=='active')return res.status(403).json({error:'ACCOUNT_BLOCKED'});
  req.sessionId=u.session_id; req.user=u;
  await pool.query('UPDATE sessions SET last_seen_at=NOW() WHERE id=$1',[u.session_id]);
  next();
 }catch(e){console.error(e);return res.status(401).json({error:'AUTH_REQUIRED'});}
}
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

app.get('/api/health',(req,res)=>res.json({ok:true,database:!!pool,catalog:'local',catalogLoaded:Array.isArray(vehicleRows||catalogCache),catalogCount:(vehicleRows||catalogCache||[]).length,catalogSource:vehicleRows?'database':'local',auth:'secure-revocable-session-cookie'}));
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
 if(!pool)return res.json({user:null,mode:'prototype'});
 try{
  const t=req.cookies.session; if(!t)return res.json({user:null,verification:VERIF});
  const r=await pool.query('SELECT s.id session_id,s.expires_at,u.id,u.name,u.nickname,u.email,u.phone,u.show_phone,u.role,u.status,u.email_verified FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW()',[hashToken(t)]);
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
  await sendMail(user.email,'AutoPiese – confirmă adresa de email',`Salut, ${user.name||''}\n\nConfirmă adresa de email deschizând linkul (valabil 24 de ore):\n${link}\n\nDacă nu ți-ai creat cont pe AutoPiese, ignoră acest mesaj.`,`<p>Salut, ${escapeHtml(user.name||'')}!</p><p>Confirmă adresa de email apăsând pe link:</p><p><a href="${link}">Confirmă emailul</a></p><p>Linkul este valabil 24 de ore.</p><p>Dacă nu ți-ai creat cont pe AutoPiese, ignoră acest mesaj.</p>`);
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
  if(!r.rowCount)return res.json({ok:true,message:'Dacă adresa există, vei primi instrucțiunile de resetare pe email.'});

  const raw=crypto.randomBytes(32).toString('base64url');
  const userId=r.rows[0].id;
  await pool.query('DELETE FROM password_resets WHERE user_id=$1 OR expires_at<NOW()',[userId]);
  await pool.query("INSERT INTO password_resets(user_id,token_hash,expires_at) VALUES($1,$2,NOW()+INTERVAL '30 minutes')",[userId,hashToken(raw)]);
  const link=`${appBaseUrl(req)}/#/reset-password?token=${encodeURIComponent(raw)}`;
  try{
   await sendMail(em,'AutoPiese – resetare parolă',`Salut, ${r.rows[0].name||''}\n\nPentru a schimba parola, deschide linkul (valabil 30 de minute):\n${link}\n\nDacă nu ai cerut resetarea parolei, ignoră acest mesaj.`,`<p>Salut, ${escapeHtml(r.rows[0].name||'')}!</p><p>Pentru a schimba parola, apasă pe buton:</p><p><a href=\"${link}\">Resetează parola</a></p><p>Linkul este valabil 30 de minute.</p><p>Dacă nu ai cerut resetarea, ignoră acest mesaj.</p>`);
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
 const client=await pool.connect();
 try{
  const token=String((req.body||{}).token||'').trim();
  const password=String((req.body||{}).password||'');
  if(!token||password.length<8||password.length>72)return res.status(400).json({error:'DATE_INVALIDE'});
  if(weakPassword(password))return res.status(400).json({error:'PAROLA_SLABA'});
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
  const f={ship_county:t(b.ship_county,60),ship_city:t(b.ship_city,80),ship_details:t(b.ship_details,300),bill_company:t(b.bill_company,120),bill_cui:t(b.bill_cui,20),bill_regcom:t(b.bill_regcom,30),bill_address:t(b.bill_address,300),bill_bank:t(b.bill_bank,80),bill_iban:t(b.bill_iban,40)};
  if(Object.values(f).some(v=>v===null))return res.status(400).json({error:'DATE_INVALIDE'});
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
  const u=(await pool.query('SELECT id,name,nickname,email,phone,show_phone,email_verified,ship_county,ship_city,ship_details,bill_company,bill_cui,bill_regcom,bill_address,bill_bank,bill_iban FROM users WHERE id=$1',[req.user.id])).rows[0];
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
  try{ await sendMail(em,'AutoPiese – confirmă noua adresă de email',`Ai cerut schimbarea adresei de email pentru contul AutoPiese. Confirmă în 30 de minute: ${link}`,
   `<p>Ai cerut schimbarea adresei de email pentru contul AutoPiese.</p><p><a href="${link}">Confirmă noua adresă de email</a></p><p>Linkul este valabil 30 de minute.</p>`);
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
  if(!throttle(authAttempts,key,8,15*60*1000)||!throttle(authAttempts,'acct:'+id.toLowerCase(),40,15*60*1000)||await loginBlocked('ip:'+key,'acct:'+id.toLowerCase()))return res.status(429).json({error:'LOGIN_RATE_LIMIT'});
  const r=await pool.query("SELECT * FROM users WHERE LOWER(email)=LOWER($1) OR LOWER(COALESCE(nickname,''))=LOWER($1) LIMIT 1",[id]);
  // Comparăm mereu cu un hash (și pentru conturi inexistente) ca să nu se poată afla ce emailuri există după timpul de răspuns.
  const okPass=await bcrypt.compare(String(password).slice(0,72),r.rowCount?r.rows[0].password_hash:DUMMY_HASH);
  if(!r.rowCount||!okPass){await loginFailed('ip:'+key,'acct:'+id.toLowerCase());return res.status(401).json({error:'INVALID_LOGIN'});}
  if(r.rows[0].status!=='active')return res.status(403).json({error:'ACCOUNT_BLOCKED'});
  authAttempts.delete(key);
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
app.get('/api/auth/sessions',auth,requireDb,async(req,res)=>{const r=await pool.query('SELECT id,created_at,last_seen_at,expires_at,user_agent FROM sessions WHERE user_id=$1 ORDER BY last_seen_at DESC',[req.user.id]);res.json({sessions:r.rows});});
app.delete('/api/auth/sessions/:id',auth,requireDb,async(req,res)=>{await pool.query('DELETE FROM sessions WHERE id=$1 AND user_id=$2',[Number(req.params.id),req.user.id]);res.json({ok:true});});
app.patch('/api/me',auth,requireDb,async(req,res)=>{try{const {phone,show_phone}=req.body||{};if(phone&&!/^\+?[0-9 ().-]{6,20}$/.test(String(phone).trim()))return res.status(400).json({error:'PHONE_INVALID'});const r=await pool.query('UPDATE users SET phone=$1, show_phone=$2 WHERE id=$3 RETURNING id,name,nickname,email,phone,show_phone,role,status',[clip(phone,30),!!show_phone,req.user.id]);res.json({user:r.rows[0]});}catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}});
app.patch('/api/account/privacy',requireDb,auth,async(req,res)=>{try{const r=await pool.query('UPDATE users SET show_phone=$1 WHERE id=$2 RETURNING show_phone',[!!(req.body||{}).show_phone,req.user.id]);res.json({show_phone:r.rows[0].show_phone});}catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}});

const LIST_COLS="l.id,l.user_id,l.type,l.title,l.price,l.condition,l.make,l.model,l.generation,l.year,l.engine,l.fuel,l.vehicle_id,l.seller_type,l.quantity,l.negotiable,l.county,l.category,l.subcategory,l.oem,l.delivery,l.description,l.status,l.created_at,l.views,l.km,l.parts_avail,l.images[1:1] AS images,COALESCE(array_length(l.images,1),0)::int AS image_count";
const SELLER_COLS="COALESCE(u.nickname,u.name) seller_name,u.created_at seller_since,(SELECT COUNT(*)::int FROM listings sl WHERE sl.user_id=l.user_id AND sl.status='approved') seller_ads";
const LISTING_SELECT=`SELECT ${LIST_COLS},${SELLER_COLS} FROM listings l LEFT JOIN users u ON u.id=l.user_id`;
const CATEGORIES=['Accesorii auto','Accesorii roți','Alimentare combustibil','Aprindere','Cabluri auto','Car audio','Caroserie','Climatizare','Direcție','Diverse','Electrică & Electronică Auto','Evacuare','Faruri stopuri lumini','Filtre auto','Frâne','Instalații GPL','Interior','Motor','Suspensie','Transmisie',
 'Iluminare','Roți','Electrică','Filtre','Altele'];
const SELLER_TYPES=['Persoană fizică','Firmă','Parc dezmembrări'];
const fold=c=>`translate(LOWER(COALESCE(${c},'')),'ăâîșşțţéèêëáàäãåíìïóòôöõúùûüçñšžčřěýÿ','aaisstteeeeaaaaaiiiooooouuuucnszcreyy')`;
const flat=c=>`regexp_replace(${fold(c)},'[^a-z0-9]+','','g')`;
app.get('/api/listings/mine',auth,requireDb,async(req,res)=>{
 const r=await pool.query(`SELECT ${LIST_COLS} FROM listings l WHERE l.user_id=$1 ORDER BY l.created_at DESC LIMIT 500`,[req.user.id]);
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
app.get('/api/listings',requireDb,async(req,res)=>{
 const ckey=req.originalUrl,hit=LIST_CACHE.get(ckey);
 if(hit&&Date.now()-hit.at<LIST_CACHE_TTL)return res.json(hit.body);
 // Public: doar anunțuri aprobate. Statusul NU este controlat din query string.
 const {q,delivery}=req.query; const where=["l.status='approved'","l.type <> 'masina'"],vals=[];let i=1;
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
  if(req.query[key]){where.push(`${col}=$${i}`);if(key==='condition')condClause={at:where.length-1,param:i};vals.push(String(req.query[key]).slice(0,100));i++;}
 }
 // Marcă/model/județ/categorie: fără diferențe de majuscule, diacritice, spații sau cratime ("Land Rover" = "LandRover").
 for(const [key,col] of [['make','l.make'],['model','l.model'],['county','l.county'],['category','l.category']]){
  const v=norm(String(req.query[key]||'').slice(0,100)).replace(/\s+/g,'');
  if(v){where.push(`${flat(col)}=$${i}`);vals.push(v);i++;}
 }
 if(/^\d{1,10}$/.test(String(req.query.seller_id||''))){where.push(`l.user_id=$${i}`);vals.push(Number(req.query.seller_id));i++;}
 const mp=Number(req.query.maxPrice);
 if(req.query.maxPrice!==undefined&&req.query.maxPrice!==''&&Number.isFinite(mp)){where.push(`l.price <= $${i}`);vals.push(mp);i++;}
 if(delivery==='true')where.push('l.delivery=true');
 // Anunțurile fără preț (0) apar la final și la sortare crescătoare.
 const order={price_asc:'(COALESCE(l.price,0)=0) ASC, l.price ASC, l.id DESC',price_desc:'l.price DESC NULLS LAST, l.id DESC'}[req.query.sort]||'l.created_at DESC, l.id DESC';
 const limit=Math.min(60,Math.max(1,Math.floor(Number(req.query.limit))||30)), offset=Math.min(100000,Math.max(0,Math.floor(Number(req.query.offset))||0));
 // Facete: câte anunțuri sunt Noi / Second-hand pentru aceeași căutare (filtrul de stare nu se aplică, dar parametrul rămâne folosit).
 const fWhere=where.map((w,ix)=>condClause&&ix===condClause.at?`($${condClause.param}::text IS NOT NULL)`:w);
 const [cnt,r,fc]=await Promise.all([pool.query(`SELECT COUNT(*)::int n FROM listings l WHERE ${where.join(' AND ')}`,vals),pool.query(`${LISTING_SELECT} WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`,vals),pool.query(`SELECT l.condition c,COUNT(*)::int n FROM listings l WHERE ${fWhere.join(' AND ')} GROUP BY l.condition`,vals)]);
 const facets={condition:{}};for(const row of fc.rows)if(row.c)facets.condition[row.c]=row.n;
 const body={listings:r.rows,total:cnt.rows[0].n,limit,offset,facets};
 if(LIST_CACHE.size>=LIST_CACHE_MAX)LIST_CACHE.clear();
 LIST_CACHE.set(ckey,{at:Date.now(),body});
 res.json(body);
});
app.get('/api/listings/:id',requireDb,async(req,res)=>{
 const r=await pool.query(`SELECT l.*,${SELLER_COLS},u.show_phone seller_show_phone FROM listings l LEFT JOIN users u ON u.id=l.user_id WHERE l.id=$1 AND l.status='approved'`,[req.params.id]);
 if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 const x=r.rows[0]; let phones=[];
 if(req.query.noview!=='1'){const me=await optUserId(req);if(!me||me!==x.user_id){pool.query('UPDATE listings SET views=views+1 WHERE id=$1',[x.id]).catch(()=>{});bumpStat(x.id,'views');x.views=(Number(x.views)||0)+1;}}
 if(x.seller_show_phone&&x.user_id)phones=(await pool.query('SELECT phone,is_whatsapp FROM user_phones WHERE user_id=$1 ORDER BY id LIMIT 1',[x.user_id])).rows;
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
app.get('/api/sellers',requireDb,async(req,res)=>{
 const r=await pool.query("SELECT u.id,COALESCE(u.nickname,u.name) name,COUNT(*)::int n,BOOL_OR(l.type='dezmembrari') dism,MAX(l.county) county FROM listings l JOIN users u ON u.id=l.user_id WHERE l.status='approved' GROUP BY u.id,u.nickname,u.name ORDER BY n DESC LIMIT 100");
 res.json({sellers:r.rows});
});
app.get('/api/sellers/:id',requireDb,ah(async(req,res)=>{
 const id=Number(req.params.id);
 if(!Number.isInteger(id)||id<=0)return res.status(404).json({error:'NOT_FOUND'});
 const u=(await pool.query("SELECT id,COALESCE(nickname,name) nick,show_phone,bill_company,created_at FROM users WHERE id=$1 AND status='active'",[id])).rows[0];
 if(!u)return res.status(404).json({error:'NOT_FOUND'});
 const s=(await pool.query("SELECT COUNT(*)::int n,COALESCE(BOOL_OR(type='dezmembrari'),FALSE) dism,(ARRAY_AGG(seller_type ORDER BY created_at DESC))[1] seller_type,(ARRAY_AGG(county ORDER BY created_at DESC) FILTER (WHERE county IS NOT NULL AND county<>''))[1] county FROM listings WHERE user_id=$1 AND status='approved'",[id])).rows[0];
 const phones=u.show_phone?(await pool.query('SELECT phone,is_whatsapp FROM user_phones WHERE user_id=$1 ORDER BY id',[id])).rows:[];
 const isCompany=s.dism||(s.seller_type&&s.seller_type!=='Persoană fizică');
 res.json({seller:{id:u.id,name:u.nick,seller_type:s.seller_type||null,dism:s.dism,county:s.county||null,count:s.n,since:u.created_at,company:isCompany&&u.bill_company?u.bill_company:null,phones}});
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
 for(const img of images){if(typeof img!=='string'||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(img))return bad('POZA_INVALIDA');if(img.length>700000)return bad('POZE_PREA_MARI');}
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
 for(const img of images){if(typeof img!=='string'||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(img))return {error:'POZA_INVALIDA'};if(img.length>700000)return {error:'POZE_PREA_MARI'};}
 if(imgBytes(images)>4500000)return {error:'POZE_PREA_MARI'};
 return {images};
}
app.post('/api/listings',auth,needVerified,requireDb,async(req,res)=>{
 if(!throttle(authAttempts,'lst:'+req.user.id,30,60*60*1000))return res.status(429).json({error:'PREA_MULTE_ANUNTURI'});
 const p=parseListing(req.body||{}); if(p.error)return res.status(p.status).json({error:p.error});
 const v=p.v;
 if(await imageQuotaExceeded(req.user.id,v.images))return res.status(413).json({error:'SPATIU_POZE_DEPASIT'});
 // Cont gratuit: maximum 100 de anunțuri active (la început; schimbabil cu ACTIVE_LISTINGS_LIMIT) (publicate sau în așteptare; cele vândute nu se numără), ca pe site-urile de profil. Adminul nu are limită.
 if(req.user.role!=='admin'){const act=await pool.query("SELECT COUNT(*)::int n FROM listings WHERE user_id=$1 AND status IN ('approved','pending')",[req.user.id]);if(act.rows[0].n>=ACTIVE_LISTINGS_LIMIT)return res.status(403).json({error:'LIMITA_ANUNTURI'});}
 const r=await pool.query(`INSERT INTO listings(user_id,type,title,price,condition,make,model,generation,year,engine,fuel,vehicle_id,seller_type,quantity,negotiable,county,category,oem,delivery,description,images,status,subcategory,km,vin,parts_avail) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26) RETURNING *`,
  [req.user.id,v.type,v.title,v.price,v.condition,v.make,v.model,v.generation,v.year,v.engine,v.fuel,v.vehicle_id,v.seller_type,v.quantity||1,v.negotiable,v.county,v.category,v.oem,v.delivery,v.description,v.images,NEW_LISTING_STATUS,v.subcategory,v.km,v.vin,v.parts_avail]);
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
 res.json({listing:r.rows[0],resubmitted:status==='pending'&&cur.status!=='pending'});
});

app.get('/api/requests',requireDb,async(req,res)=>{
 const r=await pool.query("SELECT r.id,r.title,r.make,r.model,r.year,r.variant,r.engine,r.kind,r.county,r.city,r.extra_parts,r.description,r.created_at,r.images[1:1] images,COALESCE(u.nickname,u.name) user_name FROM part_requests r LEFT JOIN users u ON u.id=r.user_id WHERE r.status='open' ORDER BY r.created_at DESC LIMIT 100");
 res.json({requests:r.rows});
});
app.get('/api/requests/mine',auth,requireDb,async(req,res)=>{
 const r=await pool.query("SELECT r.id,r.title,r.make,r.model,r.year,r.variant,r.engine,r.vin,r.description,r.extra_parts,r.status,r.created_at,r.images[1:1] images,(SELECT COUNT(*)::int FROM offers o WHERE o.request_id=r.id) offers_count,(SELECT COUNT(*)::int FROM offers o WHERE o.request_id=r.id AND o.status='pending') offers_pending FROM part_requests r WHERE r.user_id=$1 ORDER BY r.created_at DESC LIMIT 200",[req.user.id]);
 res.json({requests:r.rows});
});
app.get('/api/requests/mine/:id',auth,requireDb,ah(async(req,res)=>{
 const q=await pool.query('SELECT id,title,make,model,year,variant,engine,vin,kind,county,city,ship_address,description,extra_parts,status,created_at,images FROM part_requests WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);
 if(!q.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 const o=await pool.query("SELECT o.id,o.price,o.message,o.images,o.status,o.created_at,o.updated_at,o.seller_id,COALESCE(NULLIF(u.bill_company,''),u.nickname,u.name) seller_name,COALESCE(u.nickname,u.name) seller_nick,NULLIF(u.bill_company,'') company,u.phone user_phone FROM offers o LEFT JOIN users u ON u.id=o.seller_id WHERE o.request_id=$1 ORDER BY (o.status='accepted') DESC,(o.status='pending') DESC,o.price ASC,o.created_at DESC",[req.params.id]);
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
 const r=await pool.query("SELECT r.id,r.title,r.make,r.model,r.year,r.variant,r.engine,r.kind,r.county,r.city,r.extra_parts,r.description,r.created_at,r.images,COALESCE(u.nickname,u.name) user_name FROM part_requests r LEFT JOIN users u ON u.id=r.user_id WHERE r.id=$1 AND r.status='open'",[req.params.id]);
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
app.post('/api/requests',auth,needVerified,requireDb,async(req,res)=>{if(!throttle(authAttempts,'req:'+req.user.id,10,60*60*1000))return res.status(429).json({error:'PREA_MULTE_ANUNTURI'});const {title,make,model,year,description,variant,engine,vin,kind,county,city,ship_address,extra_parts,images:rawImages}=req.body||{};if(typeof title!=='string'||title.trim().length<3||title.length>150)return res.status(400).json({error:'DATE_INVALIDE'});const pi=parseExtraImages(rawImages,6);if(pi.error)return res.status(400).json({error:pi.error});if(pi.images.length&&await imageQuotaExceeded(req.user.id,pi.images))return res.status(413).json({error:'SPATIU_POZE_DEPASIT'});const r=await pool.query('INSERT INTO part_requests(user_id,title,make,model,year,description,variant,engine,vin,kind,county,city,extra_parts,images,ship_address) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id,title,status,created_at',[req.user.id,title.trim(),clip(make,60),clip(model,80),clip(year,10),String(description||'').slice(0,5000),clip(variant,60),clip(engine,60),clip(vin,30),['noi','second-hand','ambele'].includes(kind)?kind:'ambele',clip(county,60),clip(city,80),JSON.stringify((Array.isArray(extra_parts)?extra_parts:[]).slice(0,9).map(p=>({title:clip(p&&p.title,150),details:clip(p&&p.details,500)})).filter(p=>p.title)),pi.images,clip(ship_address,300)]);res.status(201).json({request:r.rows[0]});});

app.get('/api/admin/overview',auth,admin,requireDb,async(req,res)=>{try{const q=async(s)=>Number((await pool.query(s)).rows[0].n);const recent=await pool.query(`SELECT l.id,l.title,l.price,l.status,l.type,l.created_at,u.name seller_name FROM listings l LEFT JOIN users u ON u.id=l.user_id ORDER BY l.created_at DESC LIMIT 8`);res.json({stats:{users:await q('SELECT COUNT(*) n FROM users'),activeUsers:await q("SELECT COUNT(*) n FROM users WHERE status='active'"),listings:await q('SELECT COUNT(*) n FROM listings'),approved:await q("SELECT COUNT(*) n FROM listings WHERE status='approved'"),pending:await q("SELECT COUNT(*) n FROM listings WHERE status='pending'"),rejected:await q("SELECT COUNT(*) n FROM listings WHERE status='rejected'"),reports:await q("SELECT COUNT(*) n FROM reports WHERE status='open'"),requests:await q("SELECT COUNT(*) n FROM part_requests WHERE status='open'"),offers:await q('SELECT COUNT(*) n FROM offers'),orders:await q('SELECT COUNT(*) n FROM orders'),messages:await q('SELECT COUNT(*) n FROM messages')},recent:recent.rows});}catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}});
app.get('/api/admin/listings',auth,admin,requireDb,async(req,res)=>{const r=await pool.query('SELECT l.id,l.user_id,l.type,l.title,l.price,l.condition,l.make,l.model,l.year,l.county,l.category,l.oem,l.description,l.status,l.created_at,l.views,COALESCE(array_length(l.images,1),0) image_count,u.name seller_name,u.email seller_email,u.phone seller_phone,u.show_phone seller_show_phone FROM listings l LEFT JOIN users u ON u.id=l.user_id ORDER BY (l.status=\'pending\') DESC, l.created_at DESC LIMIT 300');res.json({listings:r.rows});});
app.patch('/api/admin/listings/:id',auth,admin,requireDb,async(req,res)=>{const status=req.body.status;if(!['pending','approved','rejected','blocked'].includes(status))return res.status(400).json({error:'STATUS_INVALIDE'});const r=await pool.query('UPDATE listings SET status=$1 WHERE id=$2 RETURNING *',[status,req.params.id]);if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,'update_listing','listing',req.params.id,status]);res.json({listing:r.rows[0]});});
app.post('/api/admin/listings/approve-all',auth,admin,requireDb,ah(async(req,res)=>{const r=await pool.query("UPDATE listings SET status='approved' WHERE status='pending' RETURNING id");await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,'approve_all','listing',null,String(r.rowCount)]);res.json({approved:r.rowCount});}));
app.get('/api/admin/listings/:id/img/:n',auth,admin,requireDb,ah(async(req,res)=>{
 const n=Math.max(0,Math.floor(Number(req.params.n))||0);
 const r=await pool.query('SELECT images[$2::int] img FROM listings WHERE id=$1',[req.params.id,n+1]);
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
app.get('/api/admin/users',auth,admin,requireDb,async(req,res)=>{const r=await pool.query('SELECT id,name,email,phone,role,status,created_at FROM users ORDER BY created_at DESC LIMIT 500');res.json({users:r.rows});});
app.patch('/api/admin/users/:id',auth,admin,requireDb,async(req,res)=>{const status=req.body.status;if(!['active','blocked'].includes(status))return res.status(400).json({error:'STATUS_INVALIDE'});if(Number(req.params.id)===Number(req.user.id)&&status==='blocked')return res.status(400).json({error:'CANNOT_BLOCK_SELF'});const r=await pool.query('UPDATE users SET status=$1 WHERE id=$2 RETURNING id,name,email,phone,role,status',[status,req.params.id]);if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,status==='blocked'?'block_user':'unblock_user','user',req.params.id,'']);res.json({user:r.rows[0]});});
app.get('/api/admin/requests',auth,admin,requireDb,async(req,res)=>{const r=await pool.query('SELECT r.*,u.name user_name,u.email user_email FROM part_requests r LEFT JOIN users u ON u.id=r.user_id ORDER BY r.created_at DESC LIMIT 500');res.json({requests:r.rows});});
app.patch('/api/admin/requests/:id',auth,admin,requireDb,async(req,res)=>{const status=req.body.status;if(!['open','matched','closed'].includes(status))return res.status(400).json({error:'STATUS_INVALIDE'});const r=await pool.query('UPDATE part_requests SET status=$1 WHERE id=$2 RETURNING *',[status,req.params.id]);if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,'update_request','request',req.params.id,status]);res.json({request:r.rows[0]});});
app.get('/api/admin/offers',auth,admin,requireDb,ah(async(req,res)=>{const r=await pool.query('SELECT o.id,o.price,o.status,o.created_at,q.title request_title,u.name seller_name,b.name buyer_name FROM offers o JOIN part_requests q ON q.id=o.request_id LEFT JOIN users u ON u.id=o.seller_id LEFT JOIN users b ON b.id=q.user_id ORDER BY o.created_at DESC LIMIT 300');res.json({offers:r.rows});}));
app.get('/api/admin/orders',auth,admin,requireDb,ah(async(req,res)=>{const r=await pool.query('SELECT o.id,o.title,o.price,o.status,o.created_at,u.name seller_name,b.name buyer_name FROM orders o LEFT JOIN users u ON u.id=o.seller_id LEFT JOIN users b ON b.id=o.buyer_id ORDER BY o.created_at DESC LIMIT 300');res.json({orders:r.rows});}));
app.get('/api/admin/activity',auth,admin,requireDb,async(req,res)=>{const r=await pool.query('SELECT a.*,u.name admin_name,u.email admin_email FROM admin_activity a LEFT JOIN users u ON u.id=a.admin_id ORDER BY a.created_at DESC LIMIT 500');res.json({activity:r.rows});});
app.get('/api/admin/reports',auth,admin,requireDb,async(req,res)=>{const r=await pool.query(`SELECT r.*,l.title listing_title,u.name reporter_name FROM reports r LEFT JOIN listings l ON l.id=r.listing_id LEFT JOIN users u ON u.id=r.reporter_id ORDER BY r.created_at DESC LIMIT 500`);res.json({reports:r.rows});});
app.patch('/api/admin/reports/:id',auth,admin,requireDb,async(req,res)=>{const status=req.body.status;if(!['open','reviewed','closed'].includes(status))return res.status(400).json({error:'STATUS_INVALIDE'});const r=await pool.query('UPDATE reports SET status=$1 WHERE id=$2 RETURNING *',[status,req.params.id]);if(!r.rowCount)return res.status(404).json({error:'NOT_FOUND'});await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,'update_report','report',req.params.id,status]);res.json({report:r.rows[0]});});
app.post('/api/reports',auth,requireDb,async(req,res)=>{if(!throttle(authAttempts,'rep:'+req.user.id,20,60*60*1000))return res.status(429).json({error:'PREA_MULTE_ANUNTURI'});const {listing_id,reason,details}=req.body||{};if(!/^\d{1,10}$/.test(String(listing_id))||typeof reason!=='string'||!reason.trim()||reason.length>200)return res.status(400).json({error:'DATE_INVALIDE'});if(!(await pool.query('SELECT 1 FROM listings WHERE id=$1',[listing_id])).rowCount)return res.status(404).json({error:'DATE_INVALIDE'});const r=await pool.query('INSERT INTO reports(listing_id,reporter_id,reason,details) VALUES($1,$2,$3,$4) RETURNING *',[listing_id,req.user.id,reason.trim(),String(details||'').slice(0,2000)]);res.status(201).json({report:r.rows[0]});});


/* ---------- oferte, comenzi, notificări ---------- */
const notify=(uid,text)=>uid?pool.query('INSERT INTO notifications(user_id,text) VALUES($1,$2)',[uid,String(text).slice(0,300)]).catch(()=>{}):null;
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
 if((await pool.query("SELECT 1 FROM offers WHERE request_id=$1 AND seller_id=$2 AND status='pending'",[r.id,req.user.id])).rowCount)return res.status(409).json({error:'OFERTA_EXISTA'});
 const o=await pool.query('INSERT INTO offers(request_id,seller_id,price,message,images) VALUES($1,$2,$3,$4,$5) RETURNING id',[r.id,req.user.id,price,message,pi.images]);
 await notify(r.user_id,'Ofertă nouă la cererea „'+r.title+'”: '+price+' lei');
 res.json({ok:true,id:o.rows[0].id});
}));
app.get('/api/offers/mine',auth,requireDb,ah(async(req,res)=>{
 const one=/^\d{1,10}$/.test(String(req.query.id||''))?Number(req.query.id):0;
 const r=await pool.query("SELECT o.id,o.price,o.message,o.status,o.created_at,o.updated_at,"+(one?'o.images':'o.images[1:1]')+" images,"+(one?'q.images':'q.images[1:1]')+" req_images,q.id request_id,q.title request_title,q.user_id buyer_id,q.status request_status,q.make,q.model,q.year,q.variant,q.engine,q.kind,q.county,q.city,q.description,q.extra_parts,CASE WHEN o.status='accepted' THEN q.vin END vin,CASE WHEN o.status='accepted' THEN q.ship_address END ship_address,COALESCE(u.nickname,u.name) buyer_name FROM offers o JOIN part_requests q ON q.id=o.request_id LEFT JOIN users u ON u.id=q.user_id WHERE o.seller_id=$1"+(one?' AND o.id=$2':'')+" ORDER BY o.created_at DESC LIMIT 200",one?[req.user.id,one]:[req.user.id]);
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
 if(req.body&&req.body.images!==undefined){const pi=parseExtraImages(req.body.images,6);if(pi.error)return res.status(400).json({error:pi.error});if(pi.images.length&&await imageQuotaExceeded(req.user.id,pi.images,0,Number(req.params.id)))return res.status(413).json({error:'SPATIU_POZE_DEPASIT'});newImages=pi.images;}
 const r=await pool.query("UPDATE offers o SET price=$1,message=$2,images=COALESCE($5::text[],o.images),updated_at=NOW() FROM part_requests q WHERE o.id=$3 AND o.seller_id=$4 AND o.status='pending' AND q.id=o.request_id AND q.status='open' RETURNING o.id,q.user_id buyer_id,q.title",[price,message,req.params.id,req.user.id,newImages]);
 if(!r.rowCount)return res.status(409).json({error:'OFERTA_NU_MAI_E_DISPONIBILA'});
 await notify(r.rows[0].buyer_id,'Oferta la cererea „'+r.rows[0].title+'” a fost modificată: '+price+' lei');
 res.json({ok:true});
}));
app.delete('/api/offers/:id',auth,requireDb,ah(async(req,res)=>{
 const r=await pool.query("DELETE FROM offers o USING part_requests q WHERE o.id=$1 AND o.seller_id=$2 AND o.status='pending' AND q.id=o.request_id RETURNING q.user_id buyer_id,q.title",[req.params.id,req.user.id]);
 if(!r.rowCount)return res.status(409).json({error:'OFERTA_NU_MAI_E_DISPONIBILA'});
 await notify(r.rows[0].buyer_id,'O ofertă la cererea „'+r.rows[0].title+'” a fost retrasă.');
 res.json({ok:true});
}));
app.post('/api/offers/:id/reject',auth,requireDb,ah(async(req,res)=>{
 const r=await pool.query("UPDATE offers o SET status='rejected' FROM part_requests q WHERE o.id=$1 AND q.id=o.request_id AND q.user_id=$2 AND o.status='pending' RETURNING o.seller_id,q.title",[req.params.id,req.user.id]);
 if(!r.rowCount)return res.status(409).json({error:'OFERTA_NU_MAI_E_DISPONIBILA'});
 await notify(r.rows[0].seller_id,'Oferta ta pentru „'+r.rows[0].title+'” a fost refuzată.');
 res.json({ok:true});
}));
app.get('/api/offers/received',auth,requireDb,ah(async(req,res)=>{
 const r=await pool.query('SELECT o.id,o.price,o.message,o.status,o.created_at,o.seller_id,q.id request_id,q.title request_title,COALESCE(u.nickname,u.name) seller_name FROM offers o JOIN part_requests q ON q.id=o.request_id LEFT JOIN users u ON u.id=o.seller_id WHERE q.user_id=$1 ORDER BY o.created_at DESC LIMIT 200',[req.user.id]);
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
  await notify(o.seller_id,'Oferta ta pentru „'+o.title+'” a fost acceptată. Comandă nouă.');
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
 // Referință opțională către un anunț (apare ca „Ref: titlu” în Mesagerie).
 let listingId=null, refTitle=null;
 if(/^\d{1,10}$/.test(String(b.listing_id||''))){
  const l=(await pool.query("SELECT id,title FROM listings WHERE id=$1 AND status='approved'",[Number(b.listing_id)])).rows[0];
  if(l){listingId=l.id;refTitle=l.title;}
 }
 await pool.query('INSERT INTO messages(sender_id,recipient_id,body,listing_id,ref_title) VALUES($1,$2,$3,$4,$5)',[req.user.id,to,body,listingId,refTitle]);
 await notify(to,'Mesaj nou de la '+(req.user.nickname||req.user.name||'un utilizator'));
 res.json({ok:true});
}));
// Mesagerie: lista de mesaje pe căsuțe (primite / trimise / arhivate). Definit înaintea rutei /:uid.
app.get('/api/messages/box',auth,requireDb,ah(async(req,res)=>{
 const box=['inbox','sent','archived'].includes(req.query.box)?req.query.box:'inbox';
 const where={
  inbox:'m.recipient_id=$1 AND NOT m.arch_r',
  sent:'m.sender_id=$1 AND NOT m.arch_s',
  archived:'((m.recipient_id=$1 AND m.arch_r) OR (m.sender_id=$1 AND m.arch_s))'
 }[box];
 const r=await pool.query(`SELECT m.id,m.body,m.created_at,m.is_read,m.listing_id,m.ref_title,(m.sender_id=$1) mine,
   CASE WHEN m.sender_id=$1 THEN m.recipient_id ELSE m.sender_id END other,
   COALESCE(u.nickname,u.name) other_name
  FROM messages m JOIN users u ON u.id=(CASE WHEN m.sender_id=$1 THEN m.recipient_id ELSE m.sender_id END)
  WHERE ${where} ORDER BY m.created_at DESC,m.id DESC LIMIT 300`,[req.user.id]);
 const c=(await pool.query(`SELECT COUNT(*) FILTER (WHERE recipient_id=$1 AND NOT arch_r AND NOT is_read)::int unread FROM messages WHERE recipient_id=$1`,[req.user.id])).rows[0];
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
 const r=await pool.query(`SELECT t.other,COALESCE(u.nickname,u.name) AS name,t.body,t.created_at,t.unread FROM (SELECT other,body,created_at,SUM(ui) OVER (PARTITION BY other) unread,ROW_NUMBER() OVER (PARTITION BY other ORDER BY created_at DESC,id DESC) rn FROM (SELECT CASE WHEN sender_id=$1 THEN recipient_id ELSE sender_id END other,body,created_at,id,CASE WHEN recipient_id=$1 AND NOT is_read THEN 1 ELSE 0 END ui FROM messages WHERE sender_id=$1 OR recipient_id=$1) m) t JOIN users u ON u.id=t.other WHERE t.rn=1 ORDER BY t.created_at DESC LIMIT 100`,[req.user.id]);
 res.json({threads:r.rows.map(x=>({...x,unread:Number(x.unread)}))});
}));
app.get('/api/messages/:uid',auth,requireDb,ah(async(req,res)=>{
 if(!/^\d{1,10}$/.test(req.params.uid))return res.status(400).json({error:'ID_INVALID'});
 const other=(await pool.query("SELECT id,COALESCE(nickname,name) AS name FROM users WHERE id=$1 AND status='active'",[req.params.uid])).rows[0];
 if(!other)return res.status(404).json({error:'NOT_FOUND'});
 const m=await pool.query('SELECT id,body,created_at,listing_id,ref_title,(sender_id=$1) mine FROM messages WHERE (sender_id=$1 AND recipient_id=$2) OR (sender_id=$2 AND recipient_id=$1) ORDER BY created_at,id LIMIT 500',[req.user.id,other.id]);
 await pool.query('UPDATE messages SET is_read=TRUE WHERE recipient_id=$1 AND sender_id=$2 AND NOT is_read',[req.user.id,other.id]);
 res.json({other,messages:m.rows});
}));
app.post('/api/orders',auth,needVerified,requireDb,ah(async(req,res)=>{
 if(!throttle(authAttempts,'order:'+req.user.id,20,60*60*1000))return res.status(429).json({error:'PREA_MULTE_COMENZI'});
 const b=req.body||{}, id=Number(b.listing_id);
 if(!Number.isInteger(id)||id<=0)return res.status(400).json({error:'ID_INVALID'});
 const l=(await pool.query('SELECT id,user_id,title,price,quantity,delivery,status FROM listings WHERE id=$1',[id])).rows[0];
 if(!l||l.status!=='approved'||!l.user_id)return res.status(404).json({error:'NOT_FOUND'});
 if(l.user_id===req.user.id)return res.status(400).json({error:'COMANDA_PROPRIE'});
 const avail=Math.max(1,Number(l.quantity)||1), qty=Math.floor(Number(b.quantity)||1);
 if(qty<1||qty>avail)return res.status(400).json({error:'CANTITATE_INVALIDA'});
 const county=clip(b.ship_county,60), city=clip(b.ship_city,80), addr=clip(b.ship_address,300), note=clip(b.note,500);
 if(!county||(l.delivery&&(!city||!addr)))return res.status(400).json({error:'ADRESA_LIPSA'});
 const dup=await pool.query("SELECT 1 FROM orders WHERE buyer_id=$1 AND listing_id=$2 AND status='new' LIMIT 1",[req.user.id,l.id]);
 if(dup.rowCount)return res.status(409).json({error:'COMANDA_EXISTA'});
 const r=await pool.query('INSERT INTO orders(buyer_id,seller_id,listing_id,title,price,quantity,ship_county,ship_city,ship_address,note) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',[req.user.id,l.user_id,l.id,l.title,(Number(l.price)||0)*qty,qty,county,city,addr,note]);
 await notify(l.user_id,'Comandă nouă pentru „'+l.title+'” ('+qty+' buc.). Vezi „Comenzi primite”.');
 res.status(201).json({ok:true,order_id:r.rows[0].id});
}));
app.get('/api/orders',auth,requireDb,ah(async(req,res)=>{
 const r=await pool.query("SELECT o.id,o.title,o.price,o.status,o.created_at,o.quantity,o.listing_id,o.ship_county,o.ship_city,o.ship_address,o.note,CASE WHEN o.buyer_id=$1 THEN 'buyer' ELSE 'seller' END role,CASE WHEN o.buyer_id=$1 THEN o.seller_id ELSE o.buyer_id END other_id,COALESCE(NULLIF(u.bill_company,''),u.nickname,u.name) other_name FROM orders o LEFT JOIN users u ON u.id=(CASE WHEN o.buyer_id=$1 THEN o.seller_id ELSE o.buyer_id END) WHERE o.buyer_id=$1 OR o.seller_id=$1 ORDER BY o.created_at DESC LIMIT 200",[req.user.id]);
 const ids=[...new Set(r.rows.map(x=>x.other_id).filter(Boolean))];
 const ph=ids.length?(await pool.query('SELECT user_id,phone,is_whatsapp FROM user_phones WHERE user_id=ANY($1::int[]) ORDER BY id',[ids])).rows:[];
 res.json({orders:r.rows.map(x=>({...x,phones:ph.filter(p=>p.user_id===x.other_id).map(p=>({phone:p.phone,is_whatsapp:p.is_whatsapp}))}))});
}));
app.patch('/api/orders/:id/status',auth,requireDb,ah(async(req,res)=>{
 const to=String((req.body||{}).status||'');
 if(!['confirmed','shipped','completed','cancelled'].includes(to))return res.status(400).json({error:'STATUS_INVALIDE'});
 const o=(await pool.query('SELECT id,buyer_id,seller_id,title,status FROM orders WHERE id=$1 AND (buyer_id=$2 OR seller_id=$2)',[req.params.id,req.user.id])).rows[0];
 if(!o)return res.status(404).json({error:'NOT_FOUND'});
 const seller=o.seller_id===req.user.id;
 if(!seller&&!(to==='cancelled'&&o.status==='new'))return res.status(403).json({error:'INTERZIS'});
 if(['cancelled','completed'].includes(o.status))return res.status(409).json({error:'COMANDA_INCHISA'});
 await pool.query('UPDATE orders SET status=$1 WHERE id=$2',[to,o.id]);
 const L={confirmed:'confirmată',shipped:'expediată',completed:'finalizată',cancelled:'anulată'};
 await notify(seller?o.buyer_id:o.seller_id,'Comanda pentru „'+(o.title||'piesă')+'” a fost '+L[to]+'.');
 res.json({ok:true,status:to});
}));
app.get('/api/notifications',auth,requireDb,ah(async(req,res)=>{
 const r=await pool.query('SELECT id,text,is_read,created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[req.user.id]);
 res.json({notifications:r.rows});
}));
app.post('/api/notifications/read',auth,requireDb,ah(async(req,res)=>{await pool.query('UPDATE notifications SET is_read=TRUE WHERE user_id=$1',[req.user.id]);res.json({ok:true});}));

app.get('/robots.txt',(req,res)=>{res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\n\n${['GPTBot','ChatGPT-User','OAI-SearchBot','ClaudeBot','anthropic-ai','Google-Extended','CCBot','PerplexityBot','Bytespider','Amazonbot','Applebot-Extended','Diffbot','ImagesiftBot','Omgilibot','cohere-ai','meta-externalagent'].map(b=>`User-agent: ${b}\nDisallow: /\n`).join('\n')}\nSitemap: ${appBaseUrl(req)}/sitemap.xml\n`);});
app.get('/sitemap.xml',async(req,res)=>{
 const base=appBaseUrl(req); const urls=[base+'/'];
 if(pool){try{const r=await pool.query("SELECT id,title,created_at FROM listings WHERE status='approved' ORDER BY created_at DESC LIMIT 5000");urls.push(...r.rows.map(x=>`${base}/piese/${x.id}-${slugify(x.title)}`));}catch(e){console.error(e);}}
 res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(u=>`<url><loc>${escapeXml(u)}</loc></url>`).join('')+'</urlset>');
});
function escapeXml(s){return String(s).replace(/[<>&'"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]));}
app.get('/piese/:idSlug',async(req,res,next)=>{
 if(!pool)return next();
 const id=Number(String(req.params.idSlug).split('-')[0]); if(!Number.isInteger(id)||id<=0)return next();
 try{
  const r=await pool.query("SELECT l.*,COALESCE(u.nickname,u.name) seller_name FROM listings l LEFT JOIN users u ON u.id=l.user_id WHERE l.id=$1 AND l.status='approved'",[id]);
  if(!r.rowCount)return next();
  const x=r.rows[0]; const base=appBaseUrl(req); const slug=slugify(x.title);
  if(req.params.idSlug!==`${x.id}-${slug}`)return res.redirect(301,`/piese/${x.id}-${slug}`);
  const canonical=`${escapeHtml(base)}/piese/${x.id}-${slug}`;
  const product={'@context':'https://schema.org','@type':'Product',name:x.title,description:x.description||x.title,sku:x.oem||String(x.id),brand:x.make?{'@type':'Brand',name:x.make}:undefined,itemCondition:x.condition==='Nouă'?'https://schema.org/NewCondition':'https://schema.org/UsedCondition',offers:{'@type':'Offer',price:Number(x.price||0),priceCurrency:'RON',availability:'https://schema.org/InStock',url:canonical}};
  const clean=JSON.stringify(product).replace(/</g,'\\u003c');
  const price=Number(x.price||0)>0?new Intl.NumberFormat('ro-RO').format(Number(x.price))+' lei':'La cerere';
  res.set('Cache-Control','public, max-age=300').type('html').send(`<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(x.title)} | AutoPiese</title><meta name="description" content="${escapeHtml((x.description||x.title).slice(0,155))}"><link rel="canonical" href="${escapeHtml(canonical)}"><link rel="stylesheet" href="/style.css"><script type="application/ld+json">${clean}</script></head><body><header class="topbar"><div class="container topbar-in"><a class="logo" href="/"><span class="logo-a">Auto</span><span class="logo-b">Piese</span></a></div></header><main class="container ssr-page"><p class="crumbs"><a href="/">AutoPiese</a> › ${escapeHtml(x.category||'Piese auto')}</p><h1>${escapeHtml(x.title)}</h1><p class="ssr-meta">${escapeHtml([x.make,x.model,x.year].filter(Boolean).join(' · '))}</p><p class="ssr-price">${price}</p><p>${escapeHtml(x.description||'')}</p><dl class="ssr-dl"><dt>Stare</dt><dd>${escapeHtml(x.condition||'—')}</dd><dt>Cod OEM</dt><dd>${escapeHtml(x.oem||'—')}</dd><dt>Județ</dt><dd>${escapeHtml(x.county||'—')}</dd><dt>Vânzător</dt><dd>${escapeHtml(x.seller_name||'—')}</dd></dl><p><a class="btn primary" href="/#/rezultate">Vezi toate anunțurile</a></p></main></body></html>`);
 }catch(e){console.error(e);return next();}
});

app.use('/api',(req,res)=>res.status(404).json({error:'NOT_FOUND'}));
app.get('*',(req,res)=>{if(path.extname(req.path))return res.status(404).type('text/plain').send('Not found');res.set('Cache-Control','no-cache');res.sendFile(path.join(__dirname,'index.html'));});
app.use((err,req,res,next)=>{console.error('Unhandled error:',err);if(res.headersSent)return next(err);if(err&&err.type==='entity.too.large')return res.status(413).json({error:'DATE_INVALIDE'});if(err instanceof SyntaxError&&err.status===400)return res.status(400).json({error:'DATE_INVALIDE'});res.status(500).json({error:'SERVER_ERROR'});});
process.on('unhandledRejection',e=>console.error('unhandledRejection',e));
(async()=>{
 try{
  if(pool)await dbReady();
  const server=app.listen(PORT,()=>console.log(`AutoPiese V26 running on ${PORT}`));
  if(pool){ensureVehicleDb();setInterval(ensureVehicleDb,12*3600*1000).unref();}
  /* anti-adormire: se apeleaza singur pe adresa publica, ca Render sa vada trafic (dezactivare: KEEP_AWAKE=0) */
  const selfUrl=process.env.APP_URL||process.env.RENDER_EXTERNAL_URL;
  if(selfUrl&&process.env.KEEP_AWAKE!=='0'&&typeof fetch==='function'){
    const ping=()=>fetch(selfUrl.replace(/\/$/,'')+'/api/health',{signal:AbortSignal.timeout(15000)}).catch(()=>{});
    setInterval(ping,10*60*1000).unref(); setTimeout(ping,60*1000).unref();
  }
  if(pool)setInterval(()=>pool.query("DELETE FROM login_attempts WHERE at<NOW()-INTERVAL '1 hour'").catch(()=>{}),30*60*1000).unref();
  if(pool){purgeStats();setInterval(purgeStats,60*60*1000).unref();}
  if(pool)setInterval(()=>pool.query('DELETE FROM sessions WHERE expires_at < NOW()').catch(e=>console.error('session cleanup',e.message)),60*60*1000).unref();
  const stop=()=>{server.close(()=>{(pool?pool.end():Promise.resolve()).finally(()=>process.exit(0));});setTimeout(()=>process.exit(0),8000).unref();};
  process.on('SIGTERM',stop);process.on('SIGINT',stop);
 }catch(e){console.error(e);process.exit(1);}
})();
