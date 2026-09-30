const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_RENDER';
const pool = process.env.DATABASE_URL ? new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized:false}}) : null;

app.use(express.json({limit:'2mb'}));
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
 type TEXT NOT NULL CHECK(type IN ('piesa','masina','dezmembrari')),
 title TEXT NOT NULL, price NUMERIC(12,2) DEFAULT 0, condition TEXT, make TEXT, model TEXT, year TEXT,
 engine TEXT, fuel TEXT, county TEXT, city TEXT, category TEXT, oem TEXT,
 seller_type TEXT NOT NULL DEFAULT 'private', negotiable BOOLEAN DEFAULT FALSE,
 quantity INTEGER DEFAULT 1, delivery BOOLEAN DEFAULT FALSE, description TEXT DEFAULT '',
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


let vehicleCatalog = null;
let vehicleCatalogPromise = null;
const CATALOG_URL = 'https://cdn.jsdelivr.net/gh/vehiclesdb/vehiclesdb@latest/dist/vehicles.json';

async function loadVehicleCatalog(){
 if(vehicleCatalog) return vehicleCatalog;
 if(vehicleCatalogPromise) return vehicleCatalogPromise;
 vehicleCatalogPromise = fetch(CATALOG_URL, {headers:{'user-agent':'AutoPiese/1.0'}})
   .then(r=>{if(!r.ok) throw new Error('catalog http '+r.status); return r.json();})
   .then(data=>{vehicleCatalog=data; return data;})
   .catch(e=>{console.error('Vehicle catalog unavailable:',e.message); vehicleCatalog={version:'unavailable',makes:[]}; return vehicleCatalog;});
 return vehicleCatalogPromise;
}
function catalogMakes(kind='car'){
 const c=vehicleCatalog||{makes:[]};
 return (c.makes||[]).filter(m=>!kind || !m.kinds || m.kinds.includes(kind));
}
function catalogModels(make,kind='car'){
 const m=catalogMakes(kind).find(x=>x.name.toLowerCase()===String(make||'').toLowerCase() || x.slug===String(make||'').toLowerCase());
 return m ? (m.models||[]).filter(x=>!kind || !x.kind || x.kind===kind) : [];
}
async function dbReady(){
 if(!pool) return false;
 await pool.query(schema);
 // Safe migrations for databases created by earlier versions.
 const migrations = [
  "ALTER TABLE listings ADD COLUMN IF NOT EXISTS engine TEXT",
  "ALTER TABLE listings ADD COLUMN IF NOT EXISTS fuel TEXT",
  "ALTER TABLE listings ADD COLUMN IF NOT EXISTS city TEXT",
  "ALTER TABLE listings ADD COLUMN IF NOT EXISTS seller_type TEXT NOT NULL DEFAULT 'private'",
  "ALTER TABLE listings ADD COLUMN IF NOT EXISTS negotiable BOOLEAN DEFAULT FALSE",
  "ALTER TABLE listings ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1"
 ];
 for (const sql of migrations) await pool.query(sql);
 const adminEmail=process.env.ADMIN_EMAIL, adminPass=process.env.ADMIN_PASSWORD;
 if(adminEmail && adminPass){
   const r=await pool.query('SELECT id FROM users WHERE email=$1',[adminEmail.toLowerCase()]);
   if(!r.rowCount){const hash=await bcrypt.hash(adminPass,12);await pool.query("INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'admin')",['Administrator',adminEmail.toLowerCase(),hash]);}
 }
 return true;
}
function sign(user){return jwt.sign({id:user.id,role:user.role,email:user.email},JWT_SECRET,{expiresIn:'7d'});}
function auth(req,res,next){
 try{const token=req.cookies.session;if(!token) return res.status(401).json({error:'AUTH_REQUIRED'});req.user=jwt.verify(token,JWT_SECRET);next();}
 catch(e){return res.status(401).json({error:'AUTH_REQUIRED'});}
}
function admin(req,res,next){if(req.user.role!=='admin') return res.status(403).json({error:'ADMIN_ONLY'});next();}
function requireDb(req,res,next){if(!pool)return res.status(503).json({error:'DATABASE_NOT_CONFIGURED',message:'Configurează DATABASE_URL în Render.'});next();}

app.get('/api/catalog/status',async(req,res)=>{
 try{const c=await loadVehicleCatalog();res.json({version:c.version||'unknown',makes:c.makes?.length||0,ready:Array.isArray(c.makes)&&c.makes.length>0});}
 catch(e){res.status(503).json({error:'CATALOG_UNAVAILABLE'});}
});
app.get('/api/catalog/makes',async(req,res)=>{
 const c=await loadVehicleCatalog(); const kind=req.query.kind||'car';
 res.json({version:c.version||'unknown',makes:catalogMakes(kind).map(m=>({slug:m.slug,name:m.name,kinds:m.kinds}))});
});
app.get('/api/catalog/models',async(req,res)=>{
 const c=await loadVehicleCatalog(); const kind=req.query.kind||'car';
 const models=catalogModels(req.query.make,kind);
 res.json({version:c.version||'unknown',models:models.map(m=>({slug:m.slug,name:m.name,body_type:m.body_type,body_types:m.body_types}))});
});

app.get('/api/health',async(req,res)=>{res.json({ok:true,database:!!pool});});
app.get('/api/me',async(req,res)=>{
 if(!pool)return res.json({user:null,mode:'prototype'});
 try{const t=req.cookies.session;if(!t)return res.json({user:null});const p=jwt.verify(t,JWT_SECRET);const r=await pool.query('SELECT id,name,email,phone,role,status FROM users WHERE id=$1',[p.id]);res.json({user:r.rows[0]||null});}catch{res.json({user:null});}
});
app.post('/api/auth/register',requireDb,async(req,res)=>{
 try{const {name,email,phone,password}=req.body;if(!name||!email||!password||password.length<8)return res.status(400).json({error:'DATE_INVALIDE'});const em=email.trim().toLowerCase();const exists=await pool.query('SELECT id FROM users WHERE email=$1',[em]);if(exists.rowCount)return res.status(409).json({error:'EMAIL_EXISTS'});const hash=await bcrypt.hash(password,12);const r=await pool.query('INSERT INTO users(name,email,phone,password_hash) VALUES($1,$2,$3,$4) RETURNING id,name,email,phone,role,status',[name.trim(),em,phone||null,hash]);res.cookie('session',sign(r.rows[0]),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:7*86400000});res.status(201).json({user:r.rows[0]});}
 catch(e){res.status(500).json({error:'SERVER_ERROR'});}
});
app.post('/api/auth/login',requireDb,async(req,res)=>{
 try{const {email,password}=req.body;const r=await pool.query('SELECT * FROM users WHERE email=$1',[String(email||'').trim().toLowerCase()]);if(!r.rowCount||!(await bcrypt.compare(password||'',r.rows[0].password_hash)))return res.status(401).json({error:'INVALID_LOGIN'});if(r.rows[0].status!=='active')return res.status(403).json({error:'ACCOUNT_BLOCKED'});const u=r.rows[0];res.cookie('session',sign(u),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:7*86400000});res.json({user:{id:u.id,name:u.name,email:u.email,phone:u.phone,role:u.role,status:u.status}});}
 catch(e){res.status(500).json({error:'SERVER_ERROR'});}
});
app.post('/api/auth/logout',(req,res)=>{res.clearCookie('session');res.json({ok:true});});

app.get('/api/listings',requireDb,async(req,res)=>{
 const {q,type,condition,make,model,year,engine,county,seller_type,maxPrice,delivery,status='approved'}=req.query;let where=['l.status=$1'], vals=[status], i=2;
 if(q){where.push(`(LOWER(l.title) LIKE LOWER($${i}) OR LOWER(COALESCE(l.oem,'')) LIKE LOWER($${i}) OR LOWER(COALESCE(l.description,'')) LIKE LOWER($${i}) OR LOWER(COALESCE(l.make,'')) LIKE LOWER($${i}) OR LOWER(COALESCE(l.model,'')) LIKE LOWER($${i}))`);vals.push('%'+q+'%');i++;}
 for(const [key,col] of [['type','l.type'],['condition','l.condition'],['make','l.make'],['model','l.model'],['year','l.year'],['engine','l.engine'],['county','l.county'],['seller_type','l.seller_type']]){if(req.query[key]){where.push(`${col}=$${i}`);vals.push(req.query[key]);i++;}}
 if(maxPrice){where.push(`l.price <= $${i}`);vals.push(Number(maxPrice));i++;} if(delivery==='true')where.push('l.delivery=true');
 const r=await pool.query(`SELECT l.*,u.name seller_name FROM listings l LEFT JOIN users u ON u.id=l.user_id WHERE ${where.join(' AND ')} ORDER BY l.created_at DESC LIMIT 100`,vals);res.json({listings:r.rows});
});
app.post('/api/listings',auth,requireDb,async(req,res)=>{
 const x=req.body;
 if(!x.type||!x.title) return res.status(400).json({error:'DATE_INVALIDE'});
 if(x.type==='piesa'&&!['Nouă','Second-hand'].includes(x.condition)) return res.status(400).json({error:'STARE_INVALIDE'});
 const sellerType=['private','business','dismantler'].includes(x.seller_type)?x.seller_type:'private';
 const qty=Math.max(1,Number(x.quantity)||1);
 const r=await pool.query(
  `INSERT INTO listings(user_id,type,title,price,condition,make,model,year,engine,fuel,county,city,category,oem,seller_type,negotiable,quantity,delivery,description,status)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'pending') RETURNING *`,
  [req.user.id,x.type,String(x.title).trim(),Number(x.price)||0,x.condition||null,x.make||null,x.model||null,x.year||null,
   x.engine||null,x.fuel||null,x.county||null,x.city||null,x.category||null,x.oem||null,sellerType,!!x.negotiable,qty,!!x.delivery,x.description||'']
 );
 res.status(201).json({listing:r.rows[0]});
});
app.post('/api/requests',auth,requireDb,async(req,res)=>{const {title,make,model,year,description}=req.body;if(!title)return res.status(400).json({error:'DATE_INVALIDE'});const r=await pool.query('INSERT INTO part_requests(user_id,title,make,model,year,description) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[req.user.id,title,make||null,model||null,year||null,description||'']);res.status(201).json({request:r.rows[0]});});

app.get('/api/admin/overview',auth,admin,requireDb,async(req,res)=>{const q=async(s)=>Number((await pool.query(s)).rows[0].n);res.json({stats:{users:await q('SELECT COUNT(*) n FROM users'),listings:await q('SELECT COUNT(*) n FROM listings'),pending:await q("SELECT COUNT(*) n FROM listings WHERE status='pending'"),reports:0,requests:await q('SELECT COUNT(*) n FROM part_requests')}});});
app.get('/api/admin/listings',auth,admin,requireDb,async(req,res)=>{const r=await pool.query('SELECT l.*,u.name seller_name,u.email seller_email FROM listings l LEFT JOIN users u ON u.id=l.user_id ORDER BY l.created_at DESC LIMIT 200');res.json({listings:r.rows});});
app.patch('/api/admin/listings/:id',auth,admin,requireDb,async(req,res)=>{const status=req.body.status;if(!['pending','approved','rejected','blocked'].includes(status))return res.status(400).json({error:'STATUS_INVALIDE'});const r=await pool.query('UPDATE listings SET status=$1 WHERE id=$2 RETURNING *',[status,req.params.id]);res.json({listing:r.rows[0]});});
app.delete('/api/admin/listings/:id',auth,admin,requireDb,async(req,res)=>{await pool.query('DELETE FROM listings WHERE id=$1',[req.params.id]);res.json({ok:true});});
app.get('/api/admin/users',auth,admin,requireDb,async(req,res)=>{const r=await pool.query('SELECT id,name,email,phone,role,status,created_at FROM users ORDER BY created_at DESC LIMIT 200');res.json({users:r.rows});});
app.patch('/api/admin/users/:id',auth,admin,requireDb,async(req,res)=>{const status=req.body.status;if(!['active','blocked'].includes(status))return res.status(400).json({error:'STATUS_INVALIDE'});const r=await pool.query('UPDATE users SET status=$1 WHERE id=$2 RETURNING id,name,email,phone,role,status',[status,req.params.id]);res.json({user:r.rows[0]});});

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
(async()=>{try{if(pool)await dbReady();app.listen(PORT,()=>console.log(`PieseAuto running on ${PORT}`));}catch(e){console.error(e);process.exit(1);}})();
