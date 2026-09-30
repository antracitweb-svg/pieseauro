const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const STORAGE = 'autopiese_listings_v3';
const FALLBACK_MAKES = ['Abarth','Alfa Romeo','Audi','BMW','Chevrolet','Citroën','Dacia','Fiat','Ford','Honda','Hyundai','Jaguar','Jeep','Kia','Land Rover','Lexus','Mazda','Mercedes-Benz','Mitsubishi','Nissan','Opel','Peugeot','Porsche','Renault','Seat','Skoda','Subaru','Suzuki','Tesla','Toyota','Volkswagen','Volvo'];
const FALLBACK_MODELS = {BMW:['Seria 1','Seria 2','Seria 3','Seria 4','Seria 5','Seria 7','X1','X3','X5'],Volkswagen:['Golf','Passat','Polo','Tiguan','Touareg','Caddy'],Audi:['A3','A4','A5','A6','A8','Q3','Q5','Q7'],Dacia:['Bigster','Duster','Logan','Sandero','Spring','Jogger'],'Mercedes-Benz':['A-Class','C-Class','E-Class','S-Class','Sprinter'],Ford:['Fiesta','Focus','Mondeo','Kuga','Transit'],Opel:['Astra','Corsa','Insignia','Zafira'],Skoda:['Fabia','Octavia','Superb','Kodiaq']};
let vehicleCatalog = [];
let listings = JSON.parse(localStorage.getItem(STORAGE) || 'null') || [
 {id:1,type:'piesa',title:'Far dreapta BMW Seria 3 E90',price:450,condition:'Second-hand',make:'BMW',model:'Seria 3',year:'2008',county:'Cluj',category:'Caroserie',oem:'E90-63117161678',delivery:true,description:'Far original, verificat, stare bună.',icon:'💡'},
 {id:2,type:'piesa',title:'Motor 1.5 dCi Dacia Logan',price:3200,condition:'Second-hand',make:'Dacia',model:'Logan',year:'2012',county:'București',category:'Motor',oem:'K9K',delivery:true,description:'Motor complet, verificat.',icon:'⚙️'},
 {id:3,type:'masina',title:'Volkswagen Golf 7 1.6 TDI',price:10900,condition:'Second-hand',make:'Volkswagen',model:'Golf',year:'2017',county:'Timiș',category:'Mașină',delivery:false,description:'Diesel, manuală, acte în regulă.',icon:'🚗'},
 {id:4,type:'piesa',title:'Jante aliaj Audi 18 inch',price:2000,condition:'Second-hand',make:'Audi',model:'A4',year:'2017',county:'Cluj',category:'Roți',delivery:true,description:'Set 4 bucăți, stare bună.',icon:'⭕'},
 {id:5,type:'piesa',title:'Alternator BMW 320d',price:750,condition:'Nouă',make:'BMW',model:'Seria 3',year:'2010',county:'Brașov',category:'Electrică',oem:'12317802619',delivery:true,description:'Piesă nouă, ambalată.',icon:'⚡'},
 {id:6,type:'dezmembrari',title:'Dezmembrez BMW Seria 3 E90 320d',price:0,condition:'Second-hand',make:'BMW',model:'Seria 3',year:'2008',county:'Cluj',category:'Dezmembrări',delivery:true,description:'Motor, cutie, caroserie, interior și electronice disponibile.',icon:'♻️'},
 {id:7,type:'piesa',title:'Cutie viteze VW Golf 6',price:1850,condition:'Second-hand',make:'Volkswagen',model:'Golf',year:'2010',county:'Iași',category:'Transmisie',delivery:true,description:'Cutie manuală, verificată.',icon:'◈'},
 {id:8,type:'piesa',title:'Amortizoare față Dacia Logan',price:420,condition:'Nouă',make:'Dacia',model:'Logan',year:'2019',county:'București',category:'Suspensie',delivery:true,description:'Set amortizoare față, noi.',icon:'⌁'}
];
let favorites = JSON.parse(localStorage.getItem('autopiese_fav') || '[]');
let currentUser = null;

function save(){ localStorage.setItem(STORAGE, JSON.stringify(listings)); localStorage.setItem('autopiese_fav', JSON.stringify(favorites)); }
function toast(msg){ const t=$('#toast'); if(!t)return; t.textContent=msg; t.classList.remove('hidden'); clearTimeout(window.__toast); window.__toast=setTimeout(()=>t.classList.add('hidden'),2600); }
function money(n){ return Number(n)>0 ? new Intl.NumberFormat('ro-RO').format(Number(n))+' lei' : 'La cerere'; }
function typeLabel(t){ return t==='masina'?'MAȘINĂ':t==='dezmembrari'?'DEZMEMBRARE':'PIESĂ'; }
function esc(s=''){ return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function norm(s=''){ return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
function tokens(s){ return norm(s).split(/\s+/).filter(x=>x.length>1); }

async function api(url, options={}){
 const r=await fetch(url,{method:options.method||'GET',headers:{'Content-Type':'application/json',...(options.headers||{})},body:options.body?JSON.stringify(options.body):undefined});
 let d={}; try{d=await r.json()}catch{}
 if(!r.ok){const map={AUTH_REQUIRED:'Trebuie să te autentifici.',EMAIL_EXISTS:'Există deja un cont cu acest email.',INVALID_LOGIN:'Email sau parolă incorectă.',ACCOUNT_BLOCKED:'Contul este blocat.',DATABASE_NOT_CONFIGURED:'Baza de date nu este configurată încă.',ADMIN_ONLY:'Acces permis doar administratorului.',DATE_INVALIDE:'Completează corect câmpurile.',STARE_INVALIDE:'Alege Nouă sau Second-hand.'}; throw new Error(map[d.error]||d.message||'A apărut o eroare.');}
 return d;
}

function vehicleName(v){ return [v.make,v.model,v.generation,v.engine].filter(Boolean).join(' '); }
function normalizeVehicleRecord(v){
 const make=v.make?.name||v.make_name||v.make||v.brand?.name||v.brand||'';
 const model=v.model?.name||v.model_name||v.model||'';
 const generation=v.generation?.name||v.generation_name||v.generation||'';
 const years=Array.isArray(v.years)?v.years:(Array.isArray(v.production_years)?v.production_years:[]);
 return {id:v.id||'',make,model,generation,years,kind:v.kind||'car',raw:v};
}

function fillYearSelects(){
  ['#year','#pubYear'].forEach(id=>{const s=$(id);if(!s)return;const current=s.value;s.innerHTML='<option value="">'+(id==='#year'?'An':'Alege anul')+'</option>';for(let y=2026;y>=1980;y--){const o=document.createElement('option');o.value=String(y);o.textContent=String(y);s.appendChild(o);}if(current)s.value=current;});
}

async function loadCatalog(){
 try{
   const r=await api('/api/catalog/makes');
   const makes=r.makes||[]; fillMakes(makes.map(x=>typeof x==='string'?x:x.name).filter(Boolean));
 }catch{ fillMakes(FALLBACK_MAKES); }
}
async function loadModels(make){
 const sel=$('#model'); if(!sel)return;
 sel.innerHTML='<option value="">Model</option>'; sel.disabled=!make; if(!make)return;
 try{const r=await api('/api/catalog/models?make='+encodeURIComponent(make)); const models=r.models||[]; models.forEach(m=>{const o=document.createElement('option');o.value=typeof m==='string'?m:m.name;o.textContent=o.value;sel.appendChild(o);});}
 catch{(FALLBACK_MODELS[make]||[]).forEach(m=>{const o=document.createElement('option');o.value=m;o.textContent=m;sel.appendChild(o);});}
}
function fillMakes(makes){ const unique=[...new Set(makes)].sort((a,b)=>a.localeCompare(b,'ro')); ['#make','#pubMake'].forEach(id=>{const s=$(id);if(!s)return;const first=s=== $('#pubMake')?'Detectare automată':'Marca';s.innerHTML=`<option value="">${first}</option>`;unique.forEach(m=>{const o=document.createElement('option');o.value=m;o.textContent=m;s.appendChild(o);});}); }

async function identifyVehicleText(text){
 const q=String(text||'').trim(); if(!q)return null;
 try{ const r=await api('/api/catalog/resolve?q='+encodeURIComponent(q)); if(r.match)return r.match; }catch{}
 const nq=norm(q); const candidates=[];
 vehicleCatalog.forEach(v=>{const hay=norm(vehicleName(v)); if(!hay)return; const ts=tokens(q); const score=ts.reduce((n,t)=>n+(hay.includes(t)?1:0),0)/(ts.length||1); if(score>=.5)candidates.push({v,score});});
 candidates.sort((a,b)=>b.score-a.score); return candidates[0]?.v?{...candidates[0].v,confidence:candidates[0].score}:null;
}
async function applyVehicleFromText(text){
 const match=await identifyVehicleText(text); if(!match)return null;
 const m=match.make?.name||match.make; const model=match.model?.name||match.model; const year=match.year||match.years?.[0]||''; const engine=match.engine||match.engine_name||'';
 if(m){const pm=$('#pubMake'); if(pm){pm.value=m; await loadPublishModels(m,model);}}
 if(year&&$('#pubYear'))$('#pubYear').value=String(year);
 if(engine&&$('#pubEngine'))$('#pubEngine').value=engine;
 if(match.generation&&$('#pubGeneration'))$('#pubGeneration').value=match.generation;
 return {make:m,model,year,engine,generation:match.generation||'',vehicle_id:match.id||''};
}
async function loadPublishModels(make, selected=''){
 const sel=$('#pubModel'); if(!sel)return; sel.innerHTML='<option value="">Model</option>'; sel.disabled=!make; if(!make)return;
 try{const r=await api('/api/catalog/models?make='+encodeURIComponent(make)); (r.models||[]).forEach(m=>{const name=typeof m==='string'?m:m.name;const o=document.createElement('option');o.value=name;o.textContent=name;sel.appendChild(o);});}
 catch{(FALLBACK_MODELS[make]||[]).forEach(name=>{const o=document.createElement('option');o.value=name;o.textContent=name;sel.appendChild(o);});}
 if(selected){const found=[...sel.options].find(o=>norm(o.value)===norm(selected)); if(found)sel.value=found.value; else {const o=document.createElement('option');o.value=selected;o.textContent=selected;sel.appendChild(o);sel.value=selected;}}
}

function renderListings(){
 const q=norm($('#searchInput')?.value||''); const make=$('#make')?.value||'', model=$('#model')?.value||'', year=$('#year')?.value||'', condition=$('#condition')?.value||'', county=$('#county')?.value||'';
 const ftype=$('#filterType')?.value||'all', fcond=$('#filterCondition')?.value||'', max=Number($('#maxPrice')?.value)||Infinity, fcounty=$('#filterCounty')?.value||'', delivery=$('#withDelivery')?.checked;
 const activeType=$('.chip.active')?.dataset.type||'all'; const grid=$('#listingGrid'); if(!grid)return; grid.innerHTML=''; let shown=0;
 listings.forEach(x=>{const hay=norm([x.title,x.make,x.model,x.generation,x.engine,x.category,x.oem,x.description,x.desc].join(' ')); const qok=!q||tokens(q).every(t=>hay.includes(t)); const ok=qok&&(!make||norm(x.make)===norm(make))&&(!model||norm(x.model)===norm(model))&&(!year||String(x.year)===String(year))&&(!condition||x.condition===condition)&&(!county||x.county===county)&&(ftype==='all'||x.type===ftype)&&(!fcond||x.condition===fcond)&&Number(x.price||0)<=max&&(!fcounty||x.county===fcounty)&&(!delivery||x.delivery)&&(activeType==='all'||x.type===activeType); if(!ok)return; shown++;grid.appendChild(card(x));});
 $('#resultCount').textContent=`${shown} anunț${shown===1?'':'uri'}`; $('#noResults')?.classList.toggle('hidden',shown!==0); if($('#favCount'))$('#favCount').textContent=favorites.length;
}
function card(x){const a=document.createElement('article');a.className='listing';a.innerHTML=`<div class="listing-visual"><span class="visual-icon">${x.icon||'🔧'}</span><span class="visual-code">${esc(x.make||'')} ${esc(x.model||'')}</span></div><div class="listing-body"><div class="meta"><span class="tag ${x.condition==='Nouă'?'green':''}">${typeLabel(x.type)} · ${esc(x.condition||'')}</span><span>${esc(x.county||'România')}</span></div><h3>${esc(x.title)}</h3><p>${esc(x.description||x.desc||'Anunț publicat de vânzător.')}</p><div class="price-row"><span class="price">${money(x.price)}</span><button class="heart" data-fav="${x.id}" aria-label="Favorite">${favorites.includes(x.id)?'♥':'♡'}</button></div></div>`;a.querySelector('.heart').onclick=e=>{e.stopPropagation();toggleFav(x.id)};a.onclick=()=>openDetail(x);return a;}
function toggleFav(id){favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];save();renderListings();toast(favorites.includes(id)?'Adăugat la favorite.':'Eliminat din favorite.');}
function openDetail(x){$('#detailContent').innerHTML=`<div class="eyebrow">${typeLabel(x.type)}</div><h2>${esc(x.title)}</h2><div class="detail-grid"><div class="detail-info"><small>Preț</small><b>${money(x.price)}</b></div><div class="detail-info"><small>Locație</small><b>${esc(x.county||'România')}</b></div><div class="detail-info"><small>Marcă / model</small><b>${esc([x.make,x.model].filter(Boolean).join(' · ')||'—')}</b></div><div class="detail-info"><small>An / motor</small><b>${esc([x.year,x.engine].filter(Boolean).join(' · ')||'—')}</b></div><div class="detail-info"><small>Cod OEM</small><b>${esc(x.oem||'—')}</b></div><div class="detail-info"><small>Livrare</small><b>${x.delivery?'Da':'Ridicare / discută cu vânzătorul'}</b></div></div><p>${esc(x.description||x.desc||'')}</p><button class="btn primary" onclick="toast('Mesajul către vânzător va fi conectat în etapa de mesagerie.')">Contactează vânzătorul</button>`;openModal('detailModal');}

function openModal(id){$('#'+id)?.classList.remove('hidden');}
function closeModal(id){$('#'+id)?.classList.add('hidden');}
$$('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));

$('#make')?.addEventListener('change',async e=>{await loadModels(e.target.value);renderListings();});
$('#model')?.addEventListener('change',renderListings);
['year','condition','county','filterType','filterCondition','maxPrice','filterCounty','withDelivery'].forEach(id=>$('#'+id)?.addEventListener('change',renderListings));
$('#searchBtn')?.addEventListener('click',renderListings); $('#searchInput')?.addEventListener('input',renderListings);
$$('[data-search]').forEach(b=>b.addEventListener('click',()=>{$('#searchInput').value=b.dataset.search;renderListings();location.hash='anunturi';}));
$$('[data-quick]').forEach(b=>b.addEventListener('click',()=>{$('#searchInput').value=b.dataset.quick;renderListings();location.hash='anunturi';}));
$$('[data-type]').forEach(b=>b.addEventListener('click',()=>{$$('[data-type]').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderListings();}));
$('#advancedBtn')?.addEventListener('click',()=>$('#advancedPanel')?.classList.toggle('hidden'));
$('#clearFilters')?.addEventListener('click',()=>{$$('[id^="filter"],#make,#model,#year,#condition,#county,#maxPrice').forEach(x=>{if(x.tagName==='SELECT')x.value='';else x.value='';});if($('#withDelivery'))$('#withDelivery').checked=false;renderListings();});
$('#favoritesBtn')?.addEventListener('click',()=>{const grid=$('#listingGrid');grid.innerHTML='';listings.filter(x=>favorites.includes(x.id)).forEach(x=>grid.appendChild(card(x)));$('#resultCount').textContent=`${favorites.length} favorite`;location.hash='anunturi';});

function authMode(register){$('#authTitle').textContent=register?'Creează cont':'Autentificare';$('#loginForm').classList.toggle('hidden',register);$('#registerForm').classList.toggle('hidden',!register);$('#authLoginTab').classList.toggle('active',!register);$('#authRegisterTab').classList.toggle('active',register);}
$('#loginBtn')?.addEventListener('click',()=>openModal('authModal')); $('#footerLogin')?.addEventListener('click',()=>openModal('authModal'));
$('#authLoginTab')?.addEventListener('click',()=>authMode(false)); $('#authRegisterTab')?.addEventListener('click',()=>authMode(true));
$('#loginForm')?.addEventListener('submit',async e=>{e.preventDefault();try{const r=await api('/api/auth/login',{method:'POST',body:{email:$('#loginEmail').value,password:$('#loginPassword').value}});currentUser=r.user;closeModal('authModal');updateUserUI();toast('Te-ai autentificat.');}catch(err){$('#authMessage').textContent=err.message;}});
$('#registerForm')?.addEventListener('submit',async e=>{e.preventDefault();try{const r=await api('/api/auth/register',{method:'POST',body:{name:$('#regName').value,email:$('#regEmail').value,phone:$('#regPhone').value,password:$('#regPassword').value}});currentUser=r.user;closeModal('authModal');updateUserUI();toast('Cont creat cu succes.');}catch(err){$('#registerMessage').textContent=err.message;}});
async function loadUser(){try{const r=await api('/api/me');currentUser=r.user||null;updateUserUI();}catch{}}
function updateUserUI(){if($('#loginBtn'))$('#loginBtn').textContent=currentUser?(currentUser.role==='admin'?'Admin: '+currentUser.name:currentUser.name):'Autentificare';}
async function syncListings(){try{const r=await api('/api/listings');if(Array.isArray(r.listings)&&r.listings.length){listings=r.listings.map(x=>({...x,price:Number(x.price)||0,description:x.description||'',icon:x.type==='masina'?'🚗':x.type==='dezmembrari'?'♻️':'🔧'}));save();renderListings();}}catch{}}
async function ensureUser(){await loadUser();if(currentUser)return true;openModal('authModal');return false;}

$$('[data-publish-type]').forEach(b=>b.addEventListener('click',()=>{ $('#pubType').value=b.dataset.publishType; $('#publishStep1').classList.add('hidden'); $('#publishForm').classList.remove('hidden'); $('#conditionWrap').classList.toggle('hidden',b.dataset.publishType!=='piesa'); $('#publishStep3').classList.add('hidden'); $('#pubTitle').focus(); }));
$('#backPublish')?.addEventListener('click',()=>{$('#publishForm').classList.add('hidden');$('#publishStep1').classList.remove('hidden');});
$('#publishBtn')?.addEventListener('click',async()=>{if(await ensureUser()){openModal('publishModal');$('#publishStep1').classList.remove('hidden');$('#publishForm').classList.add('hidden');$('#publishStep3').classList.add('hidden');}});
$('#footerPublish')?.addEventListener('click',()=>$('#publishBtn')?.click());
let titleTimer; $('#pubTitle')?.addEventListener('input',()=>{clearTimeout(titleTimer);titleTimer=setTimeout(async()=>{const v=await applyVehicleFromText($('#pubTitle').value);if(v)toast(`Am identificat: ${[v.make,v.model,v.year,v.engine].filter(Boolean).join(' · ')}`);},500);});
$('#pubMake')?.addEventListener('change',e=>loadPublishModels(e.target.value));
$('#publishForm')?.addEventListener('submit',async e=>{e.preventDefault();if(!(await ensureUser()))return;const payload={type:$('#pubType').value,title:$('#pubTitle').value.trim(),price:Number($('#pubPrice').value)||0,condition:$('#pubCondition').value,make:$('#pubMake').value,model:$('#pubModel').value,year:$('#pubYear').value,engine:$('#pubEngine')?.value.trim()||'',generation:$('#pubGeneration')?.value.trim()||'',county:$('#pubCounty').value,category:'',oem:$('#pubOem').value.trim(),delivery:$('#pubDelivery').checked,negotiable:$('#pubNegotiable')?.checked||false,quantity:Number($('#pubQuantity')?.value)||1,description:$('#pubDescription').value};try{const r=await api('/api/listings',{method:'POST',body:payload});listings.unshift({...r.listing,price:Number(r.listing.price)||0,description:r.listing.description,icon:'🔧'});save();$('#publishForm').classList.add('hidden');$('#publishStep3').classList.remove('hidden');renderListings();}catch(err){toast(err.message);}});

$('#requestBtn')?.addEventListener('click',async()=>{if(await ensureUser())openModal('requestModal');});
$('#requestForm')?.addEventListener('submit',async e=>{e.preventDefault();const inputs=e.target.querySelectorAll('input,textarea,select');const vals=[...inputs].map(x=>x.value);try{await api('/api/requests',{method:'POST',body:{title:vals[1]||vals[0],make:'',model:'',year:'',description:vals.join(' | ')}});closeModal('requestModal');toast('Cererea a fost trimisă.');}catch(err){toast(err.message);}});

const adminTabs={
 dashboard:()=>'<h3>Dashboard</h3><div class="stat-grid"><div class="stat"><small>Utilizatori</small><b id="stUsers">—</b></div><div class="stat"><small>Anunțuri</small><b id="stListings">—</b></div><div class="stat"><small>În așteptare</small><b id="stPending">—</b></div><div class="stat"><small>Cereri</small><b id="stRequests">—</b></div></div>',
 listings:()=>'<h3>Gestionare anunțuri</h3><div id="adminListings">Se încarcă...</div>',
 users:()=>'<h3>Utilizatori</h3><div id="adminUsers">Se încarcă...</div>',
 requests:()=>'<h3>Cereri de piese</h3><p>Cereri reale vor fi afișate aici.</p>', reports:()=>'<h3>Raportări</h3><p>Modul de raportare va fi conectat în etapa de moderare.</p>', categories:()=>'<h3>Categorii</h3><p>Categoriile vor putea fi administrate din baza de date.</p>', settings:()=>'<h3>Setări</h3><p>Setările platformei.</p>'
};
async function renderAdmin(tab='dashboard'){const c=$('#adminContent');c.innerHTML=adminTabs[tab]();try{if(tab==='dashboard'){const r=await api('/api/admin/overview');$('#stUsers').textContent=r.stats.users;$('#stListings').textContent=r.stats.listings;$('#stPending').textContent=r.stats.pending;$('#stRequests').textContent=r.stats.requests;} if(tab==='listings'){const r=await api('/api/admin/listings');$('#adminListings').innerHTML=r.listings.map(x=>`<div class="admin-box"><b>${esc(x.title)}</b><p>${esc(x.seller_name||'—')} · ${money(x.price)} · ${esc(x.status)}</p><button class="btn ghost" data-approve="${x.id}">Aprobă</button> <button class="btn ghost" data-reject="${x.id}">Respinge</button></div>`).join('')||'<p>Nu există anunțuri.</p>';$$('[data-approve]').forEach(b=>b.onclick=()=>adminStatus(b.dataset.approve,'approved'));$$('[data-reject]').forEach(b=>b.onclick=()=>adminStatus(b.dataset.reject,'rejected'));} if(tab==='users'){const r=await api('/api/admin/users');$('#adminUsers').innerHTML=r.users.map(x=>`<div class="admin-box"><b>${esc(x.name)}</b><p>${esc(x.email)} · ${esc(x.role)} · ${esc(x.status)}</p></div>`).join('')||'<p>Nu există utilizatori.</p>';}}catch(e){c.insertAdjacentHTML('beforeend',`<p>${esc(e.message)}</p>`);}}
async function adminStatus(id,status){try{await api('/api/admin/listings/'+id,{method:'PATCH',body:{status}});toast('Status actualizat.');renderAdmin('listings');}catch(e){toast(e.message);}}
async function openAdmin(){try{const m=await api('/api/me');if(!m.user||m.user.role!=='admin'){openModal('authModal');toast('Autentifică-te cu contul de administrator.');return;}openModal('adminModal');renderAdmin('dashboard');}catch{toast('Panoul de administrare necesită baza de date.');}}
$('#footerAdmin')?.addEventListener('click',openAdmin);$('#mobileAdmin')?.addEventListener('click',openAdmin);$$('[data-admin-tab]').forEach(b=>b.addEventListener('click',()=>{$$('[data-admin-tab]').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderAdmin(b.dataset.adminTab);}));
$('#menuBtn')?.addEventListener('click',()=>$('#mobileNav')?.classList.toggle('hidden'));

fillYearSelects(); loadCatalog(); loadUser(); syncListings(); renderListings();
