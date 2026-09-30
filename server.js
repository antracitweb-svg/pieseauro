const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const helmet = require('helmet');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_RENDER';
const pool = process.env.DATABASE_URL ? new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}) : null;
const CATALOG_URL = process.env.VEHICLE_CATALOG_URL || 'https://cdn.jsdelivr.net/gh/vehiclesdb/vehiclesdb@latest/dist/vehicles.json';
let catalogCache = null;
let catalogLoadedAt = 0;

app.set('trust proxy', 1);
app.use(helmet({contentSecurityPolicy:false, crossOriginEmbedderPolicy:false}));
app.use(express.json({limit:'4mb'}));
app.use(cookieParser());
app.use(express.static(__dirname));

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
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS seller_type TEXT',
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1',
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS negotiable BOOLEAN DEFAULT FALSE',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS show_phone BOOLEAN NOT NULL DEFAULT FALSE',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT',
  'CREATE UNIQUE INDEX IF NOT EXISTS users_nickname_unique_idx ON users(nickname) WHERE nickname IS NOT NULL',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE',
  'CREATE TABLE IF NOT EXISTS user_phones (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, phone TEXT NOT NULL, is_whatsapp BOOLEAN NOT NULL DEFAULT FALSE, verified BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id, phone))',
  'CREATE TABLE IF NOT EXISTS email_change_requests (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, new_email TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL, expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ)'
 ];
 for(const q of migrations) await pool.query(q);
 const adminEmail=process.env.ADMIN_EMAIL, adminPass=process.env.ADMIN_PASSWORD;
 await pool.query('DELETE FROM sessions WHERE expires_at < NOW()');
 if(adminEmail&&adminPass){const r=await pool.query('SELECT id FROM users WHERE email=$1',[adminEmail.toLowerCase()]);if(!r.rowCount){const hash=await bcrypt.hash(adminPass,12);await pool.query("INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'admin')",['Administrator',adminEmail.toLowerCase(),hash]);}}
 await pool.query("INSERT INTO user_phones(user_id,phone,verified) SELECT id,phone,email_verified FROM users WHERE phone IS NOT NULL AND phone<>'' AND NOT EXISTS (SELECT 1 FROM user_phones p WHERE p.user_id=users.id AND p.phone=users.phone)");
 return true;
}
function hashToken(token){return crypto.createHash('sha256').update(token).digest('hex');}
function safeCookieOptions(maxAge){return {httpOnly:true,sameSite:'lax',secure:true,path:'/',maxAge};}
async function createSession(user,req,remember=true){
 const token=crypto.randomBytes(32).toString('base64url');
 const days=remember?30:1;
 const expires=new Date(Date.now()+days*86400000);
 const ip=String(req.headers['x-forwarded-for']||req.ip||'').split(',')[0].trim();
 const ipHash=ip?hashToken(ip):'';
 await pool.query('INSERT INTO sessions(user_id,token_hash,expires_at,user_agent,ip_hash) VALUES($1,$2,$3,$4,$5)',[user.id,hashToken(token),expires, String(req.get('user-agent')||'').slice(0,500),ipHash]);
 return {token,maxAge:days*86400000};
}
async function auth(req,res,next){
 try{
  const token=req.cookies.session;
  if(!token)return res.status(401).json({error:'AUTH_REQUIRED'});
  const r=await pool.query('SELECT s.id session_id,s.expires_at,u.id,u.name,u.nickname,u.email,u.phone,u.show_phone,u.role,u.status FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW()',[hashToken(token)]);
  if(!r.rowCount)return res.status(401).json({error:'AUTH_REQUIRED'});
  const u=r.rows[0];
  if(u.status!=='active')return res.status(403).json({error:'ACCOUNT_BLOCKED'});
  req.sessionId=u.session_id; req.user=u;
  await pool.query('UPDATE sessions SET last_seen_at=NOW() WHERE id=$1',[u.session_id]);
  next();
 }catch(e){console.error(e);return res.status(401).json({error:'AUTH_REQUIRED'});}
}
function admin(req,res,next){if(req.user.role!=='admin')return res.status(403).json({error:'ADMIN_ONLY'});next();}
function requireDb(req,res,next){if(!pool)return res.status(503).json({error:'DATABASE_NOT_CONFIGURED',message:'Configurează DATABASE_URL în Render.'});next();}
function norm(s=''){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function slugify(s=''){return norm(s).replace(/\s+/g,'-').slice(0,120);}
function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

function normalizeCatalog(raw){
 const out=[];
 const push=(make,model,meta={})=>{
  if(!make||!model)return;
  const kind=String(meta.kind||'car').toLowerCase();
  if(!['car','van'].includes(kind))return;
  const years=Array.isArray(meta.years)?meta.years:(Array.isArray(meta.production_years)?meta.production_years:[]);
  out.push({
   id:meta.id||meta.slug||`catalog/${slugify(make)}/${slugify(model)}`,
   name:model, make:String(make), model:String(model),
   generation:meta.generation?.name||meta.generation_name||meta.generation||'',
   years, kind, engine:meta.engine||meta.engine_name||'', fuel:meta.fuel||meta.fuel_type||'', raw:meta
  });
 };
 const walk=(data, inheritedMake='')=>{
  if(Array.isArray(data)){
   for(const item of data){
    if(!item||typeof item!=='object')continue;
    const make=item.make?.name||item.make_name||item.make||item.brand?.name||item.brand||inheritedMake;
    const model=item.model?.name||item.model_name||item.model||item.name||'';
    if(make&&model)push(make,model,item);
    else if(inheritedMake && item.name)push(inheritedMake,item.name,item);
    else walk(item,inheritedMake);
   }
   return;
  }
  if(!data||typeof data!=='object')return;
  // Flat datasets: {vehicles:[...]} / {models:[...]}
  for(const key of ['vehicles','models','data']) if(Array.isArray(data[key])){walk(data[key],inheritedMake);return;}
  // VehiclesDB dist/vehicles.json is a nested make -> models projection.
  for(const [make,value] of Object.entries(data)){
   if(['version','meta','manifest'].includes(make))continue;
   if(Array.isArray(value)){
    for(const item of value){
     if(typeof item==='string')push(make,item,{});
     else if(Array.isArray(item))push(make,String(item[0]||''),item[1]&&typeof item[1]==='object'?item[1]:{});
     else if(item&&typeof item==='object')push(make,item.name||item.model||'',item);
    }
   }else if(value&&typeof value==='object'){
    // Accept {make:{model:{...}}} and {make:{models:[...]}} forms.
    if(Array.isArray(value.models))walk(value.models,make);
    else for(const [model,meta] of Object.entries(value)){
     if(model==='models'||model==='name')continue;
     if(typeof meta==='object')push(make,meta.name||meta.model||model,meta);
     else push(make,model,{});
    }
   }
  }
 };
 walk(raw);
 const seen=new Set();
 return out.filter(v=>{const k=`${norm(v.make)}|${norm(v.model)}`;if(seen.has(k))return false;seen.add(k);return true;});
}
async function getCatalog(){
 if(catalogCache && Date.now()-catalogLoadedAt<6*60*60*1000)return catalogCache;
 try{
  const r=await fetch(CATALOG_URL,{headers:{'User-Agent':'AutoPiese/1.0'}}); if(!r.ok)throw new Error('catalog '+r.status);
  catalogCache=normalizeCatalog(await r.json()); catalogLoadedAt=Date.now(); return catalogCache;
 }catch(e){
  if(catalogCache && catalogCache.length)return catalogCache;
  catalogCache=[
   ...Object.entries({BMW:['Seria 1','Seria 2','Seria 3','Seria 4','Seria 5','Seria 7','X1','X3','X5'],Volkswagen:['Golf','Passat','Polo','Tiguan','Touareg','Caddy'],Audi:['A3','A4','A5','A6','A8','Q3','Q5','Q7'],Dacia:['Bigster','Duster','Logan','Sandero','Spring','Jogger'],'Mercedes-Benz':['A-Class','C-Class','E-Class','S-Class','Sprinter'],Ford:['Fiesta','Focus','Mondeo','Kuga','Transit'],Opel:['Astra','Corsa','Insignia','Zafira'],Skoda:['Fabia','Octavia','Superb','Kodiaq']}).flatMap(([make,models])=>models.map(model=>({id:`fallback/${slugify(make)}/${slugify(model)}`,name:model,make,model,generation:'',years:[],kind:'car',engine:'',fuel:'',raw:{}})))];
  return catalogCache;
 }
}
function resolveText(catalog,q){
 const ts=norm(q).split(/\s+/).filter(x=>x.length>1); if(!ts.length)return null;
 const scored=catalog.map(v=>{const hay=norm([v.make,v.model,v.generation,v.name,v.engine].join(' '));const hits=ts.filter(t=>hay.includes(t)).length;return {v,score:hits/ts.length};}).filter(x=>x.score>=0.5).sort((a,b)=>b.score-a.score);
 if(!scored.length)return null; const x=scored[0].v; return {...x,confidence:scored[0].score};
}

app.get('/api/health',(req,res)=>res.json({ok:true,database:!!pool,catalog:'vehiclesdb',catalogLoaded:Array.isArray(catalogCache),catalogCount:Array.isArray(catalogCache)?catalogCache.length:0,auth:'secure-revocable-session-cookie'}));
app.get('/api/catalog/makes',async(req,res)=>{const c=await getCatalog();const makes=[...new Set(c.map(x=>x.make))].sort((a,b)=>a.localeCompare(b,'ro'));res.set('Cache-Control','public, max-age=3600');res.json({makes:makes.map(name=>({name})),count:makes.length});});
app.get('/api/catalog/models',async(req,res)=>{const make=String(req.query.make||'');const c=await getCatalog();const models=[...new Set(c.filter(x=>norm(x.make)===norm(make)).map(x=>x.model))].sort((a,b)=>a.localeCompare(b,'ro'));res.set('Cache-Control','public, max-age=3600');res.json({models:models.map(name=>({name})),count:models.length});});
app.get('/api/catalog/resolve',async(req,res)=>{const q=String(req.query.q||'').trim();if(!q)return res.json({match:null});const c=await getCatalog();const match=resolveText(c,q);res.json({match});});

app.get('/api/me',async(req,res)=>{
 if(!pool)return res.json({user:null,mode:'prototype'});
 try{
  const t=req.cookies.session; if(!t)return res.json({user:null});
  const r=await pool.query('SELECT s.id session_id,s.expires_at,u.id,u.name,u.nickname,u.email,u.phone,u.show_phone,u.role,u.status FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW()',[hashToken(t)]);
  if(!r.rowCount)return res.json({user:null});
  const u=r.rows[0];
  if(u.status!=='active')return res.json({user:null});
  await pool.query('UPDATE sessions SET last_seen_at=NOW() WHERE id=$1',[u.session_id]);
  res.json({user:u});
 }catch{res.json({user:null});}
});
async function sendMail(to,subject,text,html){
 const apiKey=process.env.RESEND_API_KEY;
 if(!apiKey) throw new Error('EMAIL_NOT_CONFIGURED');
 const from=process.env.RESEND_FROM || 'AutoPiese <onboarding@resend.dev>';
 const resp=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[to],subject,text,html})});
 let data={}; try{data=await resp.json();}catch{}
 if(!resp.ok){
   console.error('Resend error',resp.status,JSON.stringify(data));
   if(resp.status===403) throw new Error('EMAIL_TEST_ONLY');
   throw new Error('EMAIL_SEND_FAILED');
 }
 return data;
}
function appBaseUrl(req){return (process.env.APP_URL||`${req.protocol}://${req.get('host')}`).replace(/\/$/,'');}

app.post('/api/auth/forgot-password',requireDb,async(req,res)=>{
 try{
  const em=String(req.body.email||'').trim().toLowerCase();
  if(!em)return res.status(400).json({error:'EMAIL_REQUIRED'});
  const r=await pool.query('SELECT id,email,name FROM users WHERE email=$1 LIMIT 1',[em]);
  if(r.rowCount){
   const raw=crypto.randomBytes(32).toString('base64url');
   await pool.query('DELETE FROM password_resets WHERE user_id=$1 OR expires_at<NOW()',[r.rows[0].id]);
   await pool.query("INSERT INTO password_resets(user_id,token_hash,expires_at) VALUES($1,$2,NOW()+INTERVAL '30 minutes')",[r.rows[0].id,hashToken(raw)]);
   const link=`${appBaseUrl(req)}/#/reset-password?token=${encodeURIComponent(raw)}`;
   await sendMail(em,'AutoPiese – resetare parolă',`Salut, ${r.rows[0].name||''}\n\nPentru a schimba parola, deschide linkul (valabil 30 de minute):\n${link}\n\nDacă nu ai cerut resetarea parolei, ignoră acest mesaj.`,`<p>Salut, ${escapeHtml(r.rows[0].name||'')}!</p><p>Pentru a schimba parola, apasă pe buton:</p><p><a href="${link}">Resetează parola</a></p><p>Linkul este valabil 30 de minute.</p><p>Dacă nu ai cerut resetarea, ignoră acest mesaj.</p>`);
  }
  res.json({ok:true,message:'Dacă adresa există, am trimis instrucțiunile de resetare pe email.'});
 }catch(e){console.error(e);if(e.message==='EMAIL_NOT_CONFIGURED')return res.status(503).json({error:'EMAIL_NOT_CONFIGURED'});res.status(500).json({error:'SERVER_ERROR'});}
});

app.post('/api/auth/reset-password',requireDb,async(req,res)=>{
 try{
  const token=String(req.body.token||''), password=String(req.body.password||'');
  if(!token||password.length<8)return res.status(400).json({error:'DATE_INVALIDE'});
  const r=await pool.query('SELECT id,user_id FROM password_resets WHERE token_hash=$1 AND expires_at>NOW() AND used_at IS NULL LIMIT 1',[hashToken(token)]);
  if(!r.rowCount)return res.status(400).json({error:'RESET_EXPIRED'});
  const hash=await bcrypt.hash(password,12);
  await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2',[hash,r.rows[0].user_id]);
  await pool.query('UPDATE password_resets SET used_at=NOW() WHERE id=$1',[r.rows[0].id]);
  await pool.query('DELETE FROM sessions WHERE user_id=$1',[r.rows[0].user_id]);
  res.json({ok:true});
 }catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}
});

app.get('/api/account/settings',requireDb,auth,async(req,res)=>{
 try{
  const u=(await pool.query('SELECT id,name,nickname,email,phone,show_phone,email_verified FROM users WHERE id=$1',[req.user.id])).rows[0];
  const phones=(await pool.query('SELECT id,phone,is_whatsapp,verified,created_at FROM user_phones WHERE user_id=$1 ORDER BY id',[req.user.id])).rows;
  res.json({user:u,phones});
 }catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}
});
app.patch('/api/account/profile',requireDb,auth,async(req,res)=>{
 try{
  const name=String(req.body.name||'').trim(), nickname=String(req.body.nickname||'').trim();
  if(!name||nickname.length<3||nickname.length>30)return res.status(400).json({error:'DATE_INVALIDE'});
  const exists=await pool.query('SELECT id FROM users WHERE LOWER(nickname)=LOWER($1) AND id<>$2',[nickname,req.user.id]);
  if(exists.rowCount)return res.status(409).json({error:'NICKNAME_EXISTS'});
  const r=await pool.query('UPDATE users SET name=$1,nickname=$2 WHERE id=$3 RETURNING id,name,nickname,email,phone,show_phone,email_verified',[name,nickname,req.user.id]);
  res.json({user:r.rows[0]});
 }catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}
});
app.post('/api/account/email-change',requireDb,auth,async(req,res)=>{
 try{
  const em=String(req.body.email||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em))return res.status(400).json({error:'EMAIL_REQUIRED'});
  const exists=await pool.query('SELECT id FROM users WHERE email=$1 AND id<>$2',[em,req.user.id]);
  if(exists.rowCount)return res.status(409).json({error:'EMAIL_EXISTS'});
  const raw=crypto.randomBytes(32).toString('base64url');
  await pool.query('DELETE FROM email_change_requests WHERE user_id=$1 OR expires_at<NOW()',[req.user.id]);
  await pool.query("INSERT INTO email_change_requests(user_id,new_email,token_hash,expires_at) VALUES($1,$2,$3,NOW()+INTERVAL '30 minutes')",[req.user.id,em,hashToken(raw)]);
  const link=`${appBaseUrl(req)}/#/verify-email-change?token=${encodeURIComponent(raw)}`;
  await sendMail(em,'AutoPiese – confirmă noua adresă de email',`Ai cerut schimbarea adresei de email pentru contul AutoPiese. Confirmă în 30 de minute: ${link}`,
   `<p>Ai cerut schimbarea adresei de email pentru contul AutoPiese.</p><p><a href="${link}">Confirmă noua adresă de email</a></p><p>Linkul este valabil 30 de minute.</p>`);
  res.json({ok:true,message:'Ți-am trimis un link de confirmare pe noua adresă de email.'});
 }catch(e){console.error(e);if(e.message==='EMAIL_NOT_CONFIGURED')return res.status(503).json({error:'EMAIL_NOT_CONFIGURED'});res.status(500).json({error:'SERVER_ERROR'});}
});
app.post('/api/account/email-change/confirm',requireDb,async(req,res)=>{
 try{
  const token=String(req.body.token||'');
  const r=await pool.query('SELECT id,user_id,new_email FROM email_change_requests WHERE token_hash=$1 AND expires_at>NOW() AND used_at IS NULL LIMIT 1',[hashToken(token)]);
  if(!r.rowCount)return res.status(400).json({error:'RESET_EXPIRED'});
  const exists=await pool.query('SELECT id FROM users WHERE email=$1 AND id<>$2',[r.rows[0].new_email,r.rows[0].user_id]);
  if(exists.rowCount)return res.status(409).json({error:'EMAIL_EXISTS'});
  await pool.query('UPDATE users SET email=$1,email_verified=TRUE WHERE id=$2',[r.rows[0].new_email,r.rows[0].user_id]);
  await pool.query('UPDATE email_change_requests SET used_at=NOW() WHERE id=$1',[r.rows[0].id]);
  await pool.query('DELETE FROM sessions WHERE user_id=$1',[r.rows[0].user_id]);
  res.json({ok:true,message:'Adresa de email a fost schimbată. Autentifică-te din nou.'});
 }catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}
});
app.post('/api/account/phones',requireDb,auth,async(req,res)=>{
 try{
  const phone=String(req.body.phone||'').trim().replace(/\s+/g,' '), whatsapp=Boolean(req.body.is_whatsapp);
  if(!phone)return res.status(400).json({error:'DATE_INVALIDE'});
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
  const id=Number(req.params.id), whatsapp=Boolean(req.body.is_whatsapp);
  const r=await pool.query('UPDATE user_phones SET is_whatsapp=$1 WHERE id=$2 AND user_id=$3 RETURNING id,phone,is_whatsapp,verified',[whatsapp,id,req.user.id]);
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
  const {name,nickname,email,phone,password,remember=true}=req.body;
  if(!name||!nickname||!email||!password||password.length<8)return res.status(400).json({error:'DATE_INVALIDE'});
  const em=email.trim().toLowerCase(), nick=nickname.trim();
  if(nick.length<3||nick.length>30)return res.status(400).json({error:'NICKNAME_INVALID'});
  const exists=await pool.query('SELECT id,email,nickname FROM users WHERE email=$1 OR LOWER(nickname)=LOWER($2)',[em,nick]);
  if(exists.rowCount)return res.status(409).json({error:exists.rows[0].email===em?'EMAIL_EXISTS':'NICKNAME_EXISTS'});
  const hash=await bcrypt.hash(password,12);
  const r=await pool.query('INSERT INTO users(name,nickname,email,phone,password_hash) VALUES($1,$2,$3,$4,$5) RETURNING id,name,nickname,email,phone,show_phone,role,status',[name.trim(),nick,em,phone||null,hash]);
  const session=await createSession(r.rows[0],req,remember!==false);
  res.cookie('session',session.token,safeCookieOptions(session.maxAge));
  res.status(201).json({user:r.rows[0]});
 }catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}
});
app.post('/api/auth/login',requireDb,async(req,res)=>{
 try{
  const {identifier,password,remember=true}=req.body; const id=String(identifier||'').trim();
  const r=await pool.query("SELECT * FROM users WHERE LOWER(email)=LOWER($1) OR LOWER(COALESCE(nickname,''))=LOWER($1) LIMIT 1",[id]);
  if(!r.rowCount||!(await bcrypt.compare(password||'',r.rows[0].password_hash)))return res.status(401).json({error:'INVALID_LOGIN'});
  if(r.rows[0].status!=='active')return res.status(403).json({error:'ACCOUNT_BLOCKED'});
  const u=r.rows[0]; const session=await createSession(u,req,remember!==false);
  res.cookie('session',session.token,safeCookieOptions(session.maxAge));
  res.json({user:{id:u.id,name:u.name,nickname:u.nickname,email:u.email,phone:u.phone,show_phone:u.show_phone,role:u.role,status:u.status}});
 }catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}
});
app.post('/api/auth/logout',async(req,res)=>{try{const token=req.cookies.session;if(pool&&token)await pool.query('DELETE FROM sessions WHERE token_hash=$1',[hashToken(token)]);}catch{}res.clearCookie('session',{httpOnly:true,sameSite:'lax',secure:true,path:'/'});res.json({ok:true});});
app.post('/api/auth/logout-all',auth,requireDb,async(req,res)=>{await pool.query('DELETE FROM sessions WHERE user_id=$1',[req.user.id]);res.clearCookie('session',{httpOnly:true,sameSite:'lax',secure:true,path:'/'});res.json({ok:true});});
app.get('/api/auth/sessions',auth,requireDb,async(req,res)=>{const r=await pool.query('SELECT id,created_at,last_seen_at,expires_at,user_agent FROM sessions WHERE user_id=$1 ORDER BY last_seen_at DESC',[req.user.id]);res.json({sessions:r.rows});});
app.delete('/api/auth/sessions/:id',auth,requireDb,async(req,res)=>{await pool.query('DELETE FROM sessions WHERE id=$1 AND user_id=$2',[Number(req.params.id),req.user.id]);res.json({ok:true});});
app.patch('/api/me',auth,requireDb,async(req,res)=>{try{const {phone,show_phone}=req.body;const r=await pool.query('UPDATE users SET phone=$1, show_phone=$2 WHERE id=$3 RETURNING id,name,email,phone,show_phone,role,status',[phone||null,!!show_phone,req.user.id]);res.json({user:r.rows[0]});}catch(e){res.status(500).json({error:'SERVER_ERROR'});}});

app.get('/api/listings',requireDb,async(req,res)=>{
 const {q,type,condition,make,model,year,county,maxPrice,delivery,status='approved'}=req.query; let where=["l.status=$1","l.type <> 'masina'"],vals=[status],i=2;
 if(q){const terms=norm(q).split(/\s+/).filter(Boolean);for(const term of terms){where.push(`(LOWER(COALESCE(l.title,'')) LIKE $${i} OR LOWER(COALESCE(l.oem,'')) LIKE $${i} OR LOWER(COALESCE(l.description,'')) LIKE $${i} OR LOWER(COALESCE(l.make,'')) LIKE $${i} OR LOWER(COALESCE(l.model,'')) LIKE $${i} OR LOWER(COALESCE(l.generation,'')) LIKE $${i} OR LOWER(COALESCE(l.engine,'')) LIKE $${i})`);vals.push('%'+term+'%');i++;}}
 for(const [key,col] of [['type','l.type'],['condition','l.condition'],['make','l.make'],['model','l.model'],['year','l.year'],['county','l.county']]){if(req.query[key]){where.push(`${col}=$${i}`);vals.push(req.query[key]);i++;}}
 if(maxPrice){where.push(`l.price <= $${i}`);vals.push(Number(maxPrice));i++;} if(delivery==='true')where.push('l.delivery=true');
 const r=await pool.query(`SELECT l.*,u.name seller_name,u.phone seller_phone,u.show_phone seller_show_phone FROM listings l LEFT JOIN users u ON u.id=l.user_id WHERE ${where.join(' AND ')} ORDER BY l.created_at DESC LIMIT 200`,vals);res.json({listings:r.rows});
});
app.post('/api/listings',auth,requireDb,async(req,res)=>{const x=req.body;if(!['piesa','dezmembrari'].includes(x.type)||!x.title)return res.status(400).json({error:'DATE_INVALIDE'});if(x.type==='piesa'&&!['Nouă','Second-hand'].includes(x.condition))return res.status(400).json({error:'STARE_INVALIDE'});const r=await pool.query(`INSERT INTO listings(user_id,type,title,price,condition,make,model,generation,year,engine,fuel,vehicle_id,seller_type,quantity,negotiable,county,category,oem,delivery,description,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'pending') RETURNING *`,[req.user.id,x.type,x.title,Number(x.price)||0,x.condition||null,x.make||null,x.model||null,x.generation||null,x.year||null,x.engine||null,x.fuel||null,x.vehicle_id||null,x.seller_type||null,Math.max(1,Number(x.quantity)||1),!!x.negotiable,x.county||null,x.category||null,x.oem||null,!!x.delivery,x.description||'']);res.status(201).json({listing:r.rows[0]});});
app.post('/api/requests',auth,requireDb,async(req,res)=>{const {title,make,model,year,description}=req.body;if(!title)return res.status(400).json({error:'DATE_INVALIDE'});const r=await pool.query('INSERT INTO part_requests(user_id,title,make,model,year,description) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[req.user.id,title,make||null,model||null,year||null,description||'']);res.status(201).json({request:r.rows[0]});});

app.get('/api/admin/overview',auth,admin,requireDb,async(req,res)=>{try{const q=async(s)=>Number((await pool.query(s)).rows[0].n);const recent=await pool.query(`SELECT l.id,l.title,l.price,l.status,l.type,l.created_at,u.name seller_name FROM listings l LEFT JOIN users u ON u.id=l.user_id ORDER BY l.created_at DESC LIMIT 8`);res.json({stats:{users:await q('SELECT COUNT(*) n FROM users'),activeUsers:await q("SELECT COUNT(*) n FROM users WHERE status='active'"),listings:await q('SELECT COUNT(*) n FROM listings'),approved:await q("SELECT COUNT(*) n FROM listings WHERE status='approved'"),pending:await q("SELECT COUNT(*) n FROM listings WHERE status='pending'"),rejected:await q("SELECT COUNT(*) n FROM listings WHERE status='rejected'"),reports:await q("SELECT COUNT(*) n FROM reports WHERE status='open'"),requests:await q("SELECT COUNT(*) n FROM part_requests WHERE status='open'")},recent:recent.rows});}catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}});
app.get('/api/admin/listings',auth,admin,requireDb,async(req,res)=>{const r=await pool.query('SELECT l.*,u.name seller_name,u.email seller_email,u.phone seller_phone,u.show_phone seller_show_phone FROM listings l LEFT JOIN users u ON u.id=l.user_id ORDER BY l.created_at DESC LIMIT 300');res.json({listings:r.rows});});
app.patch('/api/admin/listings/:id',auth,admin,requireDb,async(req,res)=>{const status=req.body.status;if(!['pending','approved','rejected','blocked'].includes(status))return res.status(400).json({error:'STATUS_INVALIDE'});const r=await pool.query('UPDATE listings SET status=$1 WHERE id=$2 RETURNING *',[status,req.params.id]);await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,'update_listing','listing',req.params.id,status]);res.json({listing:r.rows[0]});});
app.delete('/api/admin/listings/:id',auth,admin,requireDb,async(req,res)=>{await pool.query('DELETE FROM listings WHERE id=$1',[req.params.id]);res.json({ok:true});});
app.get('/api/admin/users',auth,admin,requireDb,async(req,res)=>{const r=await pool.query('SELECT id,name,email,phone,role,status,created_at FROM users ORDER BY created_at DESC LIMIT 500');res.json({users:r.rows});});
app.patch('/api/admin/users/:id',auth,admin,requireDb,async(req,res)=>{const status=req.body.status;if(!['active','blocked'].includes(status))return res.status(400).json({error:'STATUS_INVALIDE'});if(Number(req.params.id)===Number(req.user.id)&&status==='blocked')return res.status(400).json({error:'CANNOT_BLOCK_SELF'});const r=await pool.query('UPDATE users SET status=$1 WHERE id=$2 RETURNING id,name,email,phone,role,status',[status,req.params.id]);await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,status==='blocked'?'block_user':'unblock_user','user',req.params.id,'']);res.json({user:r.rows[0]});});
app.get('/api/admin/requests',auth,admin,requireDb,async(req,res)=>{const r=await pool.query('SELECT r.*,u.name user_name,u.email user_email FROM part_requests r LEFT JOIN users u ON u.id=r.user_id ORDER BY r.created_at DESC LIMIT 500');res.json({requests:r.rows});});
app.patch('/api/admin/requests/:id',auth,admin,requireDb,async(req,res)=>{const status=req.body.status;if(!['open','matched','closed'].includes(status))return res.status(400).json({error:'STATUS_INVALIDE'});const r=await pool.query('UPDATE part_requests SET status=$1 WHERE id=$2 RETURNING *',[status,req.params.id]);await pool.query('INSERT INTO admin_activity(admin_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)',[req.user.id,'update_request','request',req.params.id,status]);res.json({request:r.rows[0]});});
app.get('/api/admin/activity',auth,admin,requireDb,async(req,res)=>{const r=await pool.query('SELECT a.*,u.name admin_name,u.email admin_email FROM admin_activity a LEFT JOIN users u ON u.id=a.admin_id ORDER BY a.created_at DESC LIMIT 500');res.json({activity:r.rows});});
app.get('/api/admin/reports',auth,admin,requireDb,async(req,res)=>{const r=await pool.query(`SELECT r.*,l.title listing_title,u.name reporter_name FROM reports r LEFT JOIN listings l ON l.id=r.listing_id LEFT JOIN users u ON u.id=r.reporter_id ORDER BY r.created_at DESC LIMIT 500`);res.json({reports:r.rows});});
app.patch('/api/admin/reports/:id',auth,admin,requireDb,async(req,res)=>{const status=req.body.status;if(!['open','reviewed','closed'].includes(status))return res.status(400).json({error:'STATUS_INVALIDE'});const r=await pool.query('UPDATE reports SET status=$1 WHERE id=$2 RETURNING *',[status,req.params.id]);res.json({report:r.rows[0]});});
app.post('/api/reports',auth,requireDb,async(req,res)=>{const {listing_id,reason,details}=req.body;if(!listing_id||!reason)return res.status(400).json({error:'DATE_INVALIDE'});const r=await pool.query('INSERT INTO reports(listing_id,reporter_id,reason,details) VALUES($1,$2,$3,$4) RETURNING *',[listing_id,req.user.id,reason,details||'']);res.status(201).json({report:r.rows[0]});});

app.get('/robots.txt',(req,res)=>{res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${req.protocol}://${req.get('host')}/sitemap.xml\n`);});
app.get('/sitemap.xml',async(req,res)=>{let urls=[`${req.protocol}://${req.get('host')}/`];if(pool){try{const r=await pool.query("SELECT id,title,created_at FROM listings WHERE status='approved' ORDER BY created_at DESC LIMIT 5000");urls.push(...r.rows.map(x=>`${req.protocol}://${req.get('host')}/piese/${x.id}-${slugify(x.title)}`));}catch{}}res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(u=>`<url><loc>${escapeXml(u)}</loc></url>`).join('')+'</urlset>');});
function escapeXml(s){return String(s).replace(/[<>&'\"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]));}
app.get('/piese/:idSlug',async(req,res,next)=>{if(!pool)return next();const id=Number(String(req.params.idSlug).split('-')[0]);if(!id)return next();try{const r=await pool.query("SELECT l.*,u.name seller_name,u.phone seller_phone,u.show_phone seller_show_phone FROM listings l LEFT JOIN users u ON u.id=l.user_id WHERE l.id=$1 AND l.status='approved'",[id]);if(!r.rowCount)return next();const x=r.rows[0];const canonical=`${req.protocol}://${req.get('host')}/piese/${x.id}-${slugify(x.title)}`;const product={"@context":"https://schema.org","@type":"Product",name:x.title,description:x.description||x.title,sku:x.oem||String(x.id),brand:x.make?{"@type":"Brand",name:x.make}:undefined,offers:{"@type":"Offer",price:Number(x.price||0),priceCurrency:'RON',availability:'https://schema.org/InStock',url:canonical}};const clean=JSON.stringify(product).replace(/</g,'\\u003c');res.type('html').send(`<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(x.title)} | AutoPiese</title><meta name="description" content="${escapeHtml((x.description||x.title).slice(0,155))}"><link rel="canonical" href="${escapeHtml(canonical)}"><script type="application/ld+json">${clean}</script></head><body><main style="font-family:Arial,sans-serif;max-width:900px;margin:40px auto;padding:20px"><h1>${escapeHtml(x.title)}</h1><p><b>${escapeHtml(x.make||'')} ${escapeHtml(x.model||'')}</b> ${escapeHtml(x.year||'')}</p><p>${escapeHtml(x.description||'')}</p><h2>${Number(x.price||0)>0?new Intl.NumberFormat('ro-RO').format(Number(x.price))+' lei':'La cerere'}</h2><p>Vânzător: ${escapeHtml(x.seller_name||'')}</p><p><a href="/">Înapoi la AutoPiese</a></p></main></body></html>`);}catch{return next();}});
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
(async()=>{try{if(pool)await dbReady();app.listen(PORT,()=>console.log(`PieseAuto running on ${PORT}`));}catch(e){console.error(e);process.exit(1);}})();
