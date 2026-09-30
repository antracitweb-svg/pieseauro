const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_RENDER';
const pool = process.env.DATABASE_URL ? new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}) : null;
const CATALOG_URL = process.env.VEHICLE_CATALOG_URL || 'https://cdn.jsdelivr.net/gh/vehiclesdb/vehiclesdb@latest/dist/vehicles.json';
let catalogCache = null;
let catalogLoadedAt = 0;

app.use(express.json({limit:'4mb'}));
app.use(cookieParser());
app.use(express.static(__dirname));

const schema = `
CREATE TABLE IF NOT EXISTS users (
 id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, phone TEXT,
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
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS negotiable BOOLEAN DEFAULT FALSE'
 ];
 for(const q of migrations) await pool.query(q);
 const adminEmail=process.env.ADMIN_EMAIL, adminPass=process.env.ADMIN_PASSWORD;
 if(adminEmail&&adminPass){const r=await pool.query('SELECT id FROM users WHERE email=$1',[adminEmail.toLowerCase()]);if(!r.rowCount){const hash=await bcrypt.hash(adminPass,12);await pool.query("INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'admin')",['Administrator',adminEmail.toLowerCase(),hash]);}}
 return true;
}
function sign(user){return jwt.sign({id:user.id,role:user.role,email:user.email},JWT_SECRET,{expiresIn:'7d'});}
function auth(req,res,next){try{const token=req.cookies.session;if(!token)return res.status(401).json({error:'AUTH_REQUIRED'});req.user=jwt.verify(token,JWT_SECRET);next();}catch{return res.status(401).json({error:'AUTH_REQUIRED'});}}
function admin(req,res,next){if(req.user.role!=='admin')return res.status(403).json({error:'ADMIN_ONLY'});next();}
function requireDb(req,res,next){if(!pool)return res.status(503).json({error:'DATABASE_NOT_CONFIGURED',message:'Configurează DATABASE_URL în Render.'});next();}
function norm(s=''){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function slugify(s=''){return norm(s).replace(/\s+/g,'-').slice(0,120);}

function normalizeCatalog(raw){
 let arr=Array.isArray(raw)?raw:(raw?.vehicles||raw?.models||raw?.data||[]);
 return arr.map(v=>{
  const make=v.make?.name||v.make_name||v.make||v.brand?.name||v.brand||'';
  const model=v.model?.name||v.model_name||v.model||'';
  const generation=v.generation?.name||v.generation_name||v.generation||'';
  const years=Array.isArray(v.years)?v.years:(Array.isArray(v.production_years)?v.production_years:[]);
  return {id:v.id||'',name:v.name||model,make,model,generation,years,kind:v.kind||'car',engine:v.engine||v.engine_name||'',fuel:v.fuel||v.fuel_type||'',raw:v};
 }).filter(v=>v.make&&v.model);
}
async function getCatalog(){
 if(catalogCache && Date.now()-catalogLoadedAt<6*60*60*1000)return catalogCache;
 try{
  const r=await fetch(CATALOG_URL,{headers:{'User-Agent':'AutoPiese/1.0'}}); if(!r.ok)throw new Error('catalog '+r.status);
  catalogCache=normalizeCatalog(await r.json()); catalogLoadedAt=Date.now(); return catalogCache;
 }catch(e){
  if(catalogCache)return catalogCache;
  catalogCache=[
   ...Object.entries({BMW:['Seria 1','Seria 2','Seria 3','Seria 4','Seria 5','Seria 7','X1','X3','X5'],Volkswagen:['Golf','Passat','Polo','Tiguan','Touareg','Caddy'],Audi:['A3','A4','A5','A6','A8','Q3','Q5','Q7'],Dacia:['Logan','Duster','Sandero','Spring'],'Mercedes-Benz':['A-Class','C-Class','E-Class','S-Class','Sprinter'],Ford:['Fiesta','Focus','Mondeo','Kuga','Transit'],Opel:['Astra','Corsa','Insignia','Zafira'],Skoda:['Fabia','Octavia','Superb','Kodiaq']}).flatMap(([make,models])=>models.map(model=>({id:`fallback/${slugify(make)}/${slugify(model)}`,name:model,make,model,generation:'',years:[],kind:'car',engine:'',fuel:'',raw:{}})))];
  return catalogCache;
 }
}
function resolveText(catalog,q){
 const ts=norm(q).split(/\s+/).filter(x=>x.length>1); if(!ts.length)return null;
 const scored=catalog.map(v=>{const hay=norm([v.make,v.model,v.generation,v.name,v.engine].join(' '));const hits=ts.filter(t=>hay.includes(t)).length;return {v,score:hits/ts.length};}).filter(x=>x.score>=0.5).sort((a,b)=>b.score-a.score);
 if(!scored.length)return null; const x=scored[0].v; return {...x,confidence:scored[0].score};
}

app.get('/api/health',(req,res)=>res.json({ok:true,database:!!pool,catalog:'vehiclesdb'}));
app.get('/api/catalog/makes',async(req,res)=>{const c=await getCatalog();const makes=[...new Set(c.map(x=>x.make))].sort((a,b)=>a.localeCompare(b,'ro'));res.json({makes:makes.map(name=>({name}))});});
app.get('/api/catalog/models',async(req,res)=>{const make=String(req.query.make||'');const c=await getCatalog();const models=[...new Set(c.filter(x=>norm(x.make)===norm(make)).map(x=>x.model))].sort((a,b)=>a.localeCompare(b,'ro'));res.json({models:models.map(name=>({name}))});});
app.get('/api/catalog/resolve',async(req,res)=>{const q=String(req.query.q||'').trim();if(!q)return res.json({match:null});const c=await getCatalog();const match=resolveText(c,q);res.json({match});});

app.get('/api/me',async(req,res)=>{if(!pool)return res.json({user:null,mode:'prototype'});try{const t=req.cookies.session;if(!t)return res.json({user:null});const p=jwt.verify(t,JWT_SECRET);const r=await pool.query('SELECT id,name,email,phone,role,status FROM users WHERE id=$1',[p.id]);res.json({user:r.rows[0]||null});}catch{res.json({user:null});}});
app.post('/api/auth/register',requireDb,async(req,res)=>{try{const {name,email,phone,password}=req.body;if(!name||!email||!password||password.length<8)return res.status(400).json({error:'DATE_INVALIDE'});const em=email.trim().toLowerCase();const exists=await pool.query('SELECT id FROM users WHERE email=$1',[em]);if(exists.rowCount)return res.status(409).json({error:'EMAIL_EXISTS'});const hash=await bcrypt.hash(password,12);const r=await pool.query('INSERT INTO users(name,email,phone,password_hash) VALUES($1,$2,$3,$4) RETURNING id,name,email,phone,role,status',[name.trim(),em,phone||null,hash]);res.cookie('session',sign(r.rows[0]),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:7*86400000});res.status(201).json({user:r.rows[0]});}catch(e){console.error(e);res.status(500).json({error:'SERVER_ERROR'});}});
app.post('/api/auth/login',requireDb,async(req,res)=>{try{const {email,password}=req.body;const r=await pool.query('SELECT * FROM users WHERE email=$1',[String(email||'').trim().toLowerCase()]);if(!r.rowCount||!(await bcrypt.compare(password||'',r.rows[0].password_hash)))return res.status(401).json({error:'INVALID_LOGIN'});if(r.rows[0].status!=='active')return res.status(403).json({error:'ACCOUNT_BLOCKED'});const u=r.rows[0];res.cookie('session',sign(u),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:7*86400000});res.json({user:{id:u.id,name:u.name,email:u.email,phone:u.phone,role:u.role,status:u.status}});}catch(e){res.status(500).json({error:'SERVER_ERROR'});}});
app.post('/api/auth/logout',(req,res)=>{res.clearCookie('session');res.json({ok:true});});

app.get('/api/listings',requireDb,async(req,res)=>{
 const {q,type,condition,make,model,year,county,maxPrice,delivery,status='approved'}=req.query; let where=['l.status=$1'],vals=[status],i=2;
 if(q){const terms=norm(q).split(/\s+/).filter(Boolean);for(const term of terms){where.push(`(LOWER(COALESCE(l.title,'')) LIKE $${i} OR LOWER(COALESCE(l.oem,'')) LIKE $${i} OR LOWER(COALESCE(l.description,'')) LIKE $${i} OR LOWER(COALESCE(l.make,'')) LIKE $${i} OR LOWER(COALESCE(l.model,'')) LIKE $${i} OR LOWER(COALESCE(l.generation,'')) LIKE $${i} OR LOWER(COALESCE(l.engine,'')) LIKE $${i})`);vals.push('%'+term+'%');i++;}}
 for(const [key,col] of [['type','l.type'],['condition','l.condition'],['make','l.make'],['model','l.model'],['year','l.year'],['county','l.county']]){if(req.query[key]){where.push(`${col}=$${i}`);vals.push(req.query[key]);i++;}}
 if(maxPrice){where.push(`l.price <= $${i}`);vals.push(Number(maxPrice));i++;} if(delivery==='true')where.push('l.delivery=true');
 const r=await pool.query(`SELECT l.*,u.name seller_name FROM listings l LEFT JOIN users u ON u.id=l.user_id WHERE ${where.join(' AND ')} ORDER BY l.created_at DESC LIMIT 200`,vals);res.json({listings:r.rows});
});
app.post('/api/listings',auth,requireDb,async(req,res)=>{const x=req.body;if(!x.type||!x.title)return res.status(400).json({error:'DATE_INVALIDE'});if(x.type==='piesa'&&!['Nouă','Second-hand'].includes(x.condition))return res.status(400).json({error:'STARE_INVALIDE'});const r=await pool.query(`INSERT INTO listings(user_id,type,title,price,condition,make,model,generation,year,engine,fuel,vehicle_id,seller_type,quantity,negotiable,county,category,oem,delivery,description,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'pending') RETURNING *`,[req.user.id,x.type,x.title,Number(x.price)||0,x.condition||null,x.make||null,x.model||null,x.generation||null,x.year||null,x.engine||null,x.fuel||null,x.vehicle_id||null,x.seller_type||null,Math.max(1,Number(x.quantity)||1),!!x.negotiable,x.county||null,x.category||null,x.oem||null,!!x.delivery,x.description||'']);res.status(201).json({listing:r.rows[0]});});
app.post('/api/requests',auth,requireDb,async(req,res)=>{const {title,make,model,year,description}=req.body;if(!title)return res.status(400).json({error:'DATE_INVALIDE'});const r=await pool.query('INSERT INTO part_requests(user_id,title,make,model,year,description) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[req.user.id,title,make||null,model||null,year||null,description||'']);res.status(201).json({request:r.rows[0]});});

app.get('/api/admin/overview',auth,admin,requireDb,async(req,res)=>{const q=async(s)=>Number((await pool.query(s)).rows[0].n);res.json({stats:{users:await q('SELECT COUNT(*) n FROM users'),listings:await q('SELECT COUNT(*) n FROM listings'),pending:await q("SELECT COUNT(*) n FROM listings WHERE status='pending'"),reports:0,requests:await q('SELECT COUNT(*) n FROM part_requests')}});});
app.get('/api/admin/listings',auth,admin,requireDb,async(req,res)=>{const r=await pool.query('SELECT l.*,u.name seller_name,u.email seller_email FROM listings l LEFT JOIN users u ON u.id=l.user_id ORDER BY l.created_at DESC LIMIT 300');res.json({listings:r.rows});});
app.patch('/api/admin/listings/:id',auth,admin,requireDb,async(req,res)=>{const status=req.body.status;if(!['pending','approved','rejected','blocked'].includes(status))return res.status(400).json({error:'STATUS_INVALIDE'});const r=await pool.query('UPDATE listings SET status=$1 WHERE id=$2 RETURNING *',[status,req.params.id]);res.json({listing:r.rows[0]});});
app.delete('/api/admin/listings/:id',auth,admin,requireDb,async(req,res)=>{await pool.query('DELETE FROM listings WHERE id=$1',[req.params.id]);res.json({ok:true});});
app.get('/api/admin/users',auth,admin,requireDb,async(req,res)=>{const r=await pool.query('SELECT id,name,email,phone,role,status,created_at FROM users ORDER BY created_at DESC LIMIT 300');res.json({users:r.rows});});
app.patch('/api/admin/users/:id',auth,admin,requireDb,async(req,res)=>{const status=req.body.status;if(!['active','blocked'].includes(status))return res.status(400).json({error:'STATUS_INVALIDE'});const r=await pool.query('UPDATE users SET status=$1 WHERE id=$2 RETURNING id,name,email,phone,role,status',[status,req.params.id]);res.json({user:r.rows[0]});});

app.get('/robots.txt',(req,res)=>{res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${req.protocol}://${req.get('host')}/sitemap.xml\n`);});
app.get('/sitemap.xml',async(req,res)=>{let urls=[`${req.protocol}://${req.get('host')}/`];if(pool){try{const r=await pool.query("SELECT id,title,created_at FROM listings WHERE status='approved' ORDER BY created_at DESC LIMIT 5000");urls.push(...r.rows.map(x=>`${req.protocol}://${req.get('host')}/piese/${x.id}-${slugify(x.title)}`));}catch{}}res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(u=>`<url><loc>${escapeXml(u)}</loc></url>`).join('')+'</urlset>');});
function escapeXml(s){return String(s).replace(/[<>&'\"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]));}
app.get('/piese/:idSlug',async(req,res,next)=>{if(!pool)return next();const id=Number(String(req.params.idSlug).split('-')[0]);if(!id)return next();try{const r=await pool.query("SELECT l.*,u.name seller_name FROM listings l LEFT JOIN users u ON u.id=l.user_id WHERE l.id=$1 AND l.status='approved'",[id]);if(!r.rowCount)return next();const x=r.rows[0];const canonical=`${req.protocol}://${req.get('host')}/piese/${x.id}-${slugify(x.title)}`;const product={"@context":"https://schema.org","@type":"Product",name:x.title,description:x.description||x.title,sku:x.oem||String(x.id),brand:x.make?{"@type":"Brand",name:x.make}:undefined,offers:{"@type":"Offer",price:Number(x.price||0),priceCurrency:'RON',availability:'https://schema.org/InStock',url:canonical}};const clean=JSON.stringify(product).replace(/</g,'\\u003c');res.type('html').send(`<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(x.title)} | AutoPiese</title><meta name="description" content="${escapeHtml((x.description||x.title).slice(0,155))}"><link rel="canonical" href="${escapeHtml(canonical)}"><script type="application/ld+json">${clean}</script></head><body><main style="font-family:Arial,sans-serif;max-width:900px;margin:40px auto;padding:20px"><h1>${escapeHtml(x.title)}</h1><p><b>${escapeHtml(x.make||'')} ${escapeHtml(x.model||'')}</b> ${escapeHtml(x.year||'')}</p><p>${escapeHtml(x.description||'')}</p><h2>${Number(x.price||0)>0?new Intl.NumberFormat('ro-RO').format(Number(x.price))+' lei':'La cerere'}</h2><p>Vânzător: ${escapeHtml(x.seller_name||'')}</p><p><a href="/">Înapoi la AutoPiese</a></p></main></body></html>`);}catch{return next();}});
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
(async()=>{try{if(pool)await dbReady();app.listen(PORT,()=>console.log(`PieseAuto running on ${PORT}`));}catch(e){console.error(e);process.exit(1);}})();
