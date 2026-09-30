const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const STORAGE = 'autopiese_listings_v3';
const FALLBACK_MAKES = ['Abarth','Alfa Romeo','Audi','BMW','Chevrolet','Citroën','Dacia','Fiat','Ford','Honda','Hyundai','Jaguar','Jeep','Kia','Land Rover','Lexus','Mazda','Mercedes-Benz','Mitsubishi','Nissan','Opel','Peugeot','Porsche','Renault','Seat','Skoda','Subaru','Suzuki','Tesla','Toyota','Volkswagen','Volvo'];
const FALLBACK_MODELS = {BMW:['Seria 1','Seria 2','Seria 3','Seria 4','Seria 5','Seria 7','X1','X3','X5'],Volkswagen:['Golf','Passat','Polo','Tiguan','Touareg','Caddy'],Audi:['A3','A4','A5','A6','A8','Q3','Q5','Q7'],Dacia:['Bigster','Duster','Logan','Sandero','Spring','Jogger'],'Mercedes-Benz':['A-Class','C-Class','E-Class','S-Class','Sprinter'],Ford:['Fiesta','Focus','Mondeo','Kuga','Transit'],Opel:['Astra','Corsa','Insignia','Zafira'],Skoda:['Fabia','Octavia','Superb','Kodiaq']};
let vehicleCatalog = [];
let listings = JSON.parse(localStorage.getItem(STORAGE) || 'null') || [
 {id:1,type:'piesa',title:'Far dreapta BMW Seria 3 E90',price:450,condition:'Second-hand',make:'BMW',model:'Seria 3',year:'2008',county:'Cluj',category:'Caroserie',oem:'E90-63117161678',delivery:true,description:'Far original, verificat, stare bună.',icon:'💡'},
 {id:2,type:'piesa',title:'Motor 1.5 dCi Dacia Logan',price:3200,condition:'Second-hand',make:'Dacia',model:'Logan',year:'2012',county:'București',category:'Motor',oem:'K9K',delivery:true,description:'Motor complet, verificat.',icon:'⚙️'},
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
 const ftype=$('#filterType')?.value||'all', fcond=$('#filterCondition')?.value||'', max=Number($('#maxPrice')?.value)||Infinity, fcounty=$('#filterCounty')?.value||'', fcat=$('#filterCategory')?.value||'', seller=$('#filterSeller')?.value||'', delivery=$('#withDelivery')?.checked;
 const sort=$('#sortListings')?.value||'relevance'; const activeType=$('.chip.active')?.dataset.type||'all'; const grid=$('#listingGrid'); if(!grid)return; grid.innerHTML='';
 let data=listings.filter(x=>x.type!=='masina').filter(x=>{const hay=norm([x.title,x.make,x.model,x.generation,x.engine,x.category,x.oem,x.description,x.desc].join(' ')); const qok=!q||tokens(q).every(t=>hay.includes(t)); return qok&&(!make||norm(x.make)===norm(make))&&(!model||norm(x.model)===norm(model))&&(!year||String(x.year)===String(year))&&(!condition||x.condition===condition)&&(!county||x.county===county)&&(ftype==='all'||x.type===ftype)&&(!fcond||x.condition===fcond)&&Number(x.price||0)<=max&&(!fcounty||x.county===fcounty)&&(!fcat||norm(x.category)===norm(fcat))&&(!seller||x.seller_type===seller)&&(!delivery||x.delivery)&&(activeType==='all'||x.type===activeType)});
 if(sort==='price_asc') data.sort((a,b)=>(Number(a.price)||0)-(Number(b.price)||0));
 if(sort==='price_desc') data.sort((a,b)=>(Number(b.price)||0)-(Number(a.price)||0));
 if(sort==='updated_desc') data.sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
 data.forEach(x=>grid.appendChild(card(x)));
 const shown=data.length; $('#resultCount').textContent=`${shown} anunț${shown===1?'':'uri'}`; $('#noResults')?.classList.toggle('hidden',shown!==0); if($('#favCount'))$('#favCount').textContent=favorites.length; if($('#accountFavCount'))$('#accountFavCount').textContent=favorites.length;
 if($('#activeSearchLabel')) $('#activeSearchLabel').textContent=q?`Rezultate pentru „${$('#searchInput').value.trim()}”`:'Toate anunțurile';
}
function card(x){const a=document.createElement('article');a.className='listing';a.innerHTML=`<div class="listing-visual"><span class="visual-icon">${x.icon||'🔧'}</span><span class="visual-code">${esc(x.make||'')} ${esc(x.model||'')}</span></div><div class="listing-body"><div class="meta"><span class="tag ${x.condition==='Nouă'?'green':''}">${typeLabel(x.type)} · ${esc(x.condition||'')}</span><span>${esc(x.county||'România')}</span></div><h3>${esc(x.title)}</h3><p>${esc(x.description||x.desc||'Anunț publicat de vânzător.')}</p><div class="price-row"><span class="price">${money(x.price)}</span><button class="heart" data-fav="${x.id}" aria-label="Favorite">${favorites.includes(x.id)?'♥':'♡'}</button></div></div>`;a.querySelector('.heart').onclick=e=>{e.stopPropagation();toggleFav(x.id)};a.onclick=()=>openDetail(x);return a;}
function toggleFav(id){favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];save();renderListings();toast(favorites.includes(id)?'Adăugat la favorite.':'Eliminat din favorite.');}
function phoneDigits(phone=''){return String(phone).replace(/[^0-9+]/g,'').replace(/^00/,'+');}
function openDetail(x){const phone=(x.seller_show_phone&&x.seller_phone)?phoneDigits(x.seller_phone):'';const wa=phone?phone.replace(/^\+/,'').replace(/^0/,'40'):'';const msg=encodeURIComponent(`Bună! Sunt interesat(ă) de anunțul „${x.title}” de pe AutoPiese.`);$('#detailContent').innerHTML=`<div class="eyebrow">${typeLabel(x.type)}</div><h2>${esc(x.title)}</h2><div class="detail-grid"><div class="detail-info"><small>Preț</small><b>${money(x.price)}</b></div><div class="detail-info"><small>Locație</small><b>${esc(x.county||'România')}</b></div><div class="detail-info"><small>Marcă / model</small><b>${esc([x.make,x.model].filter(Boolean).join(' · ')||'—')}</b></div><div class="detail-info"><small>An / motor</small><b>${esc([x.year,x.engine].filter(Boolean).join(' · ')||'—')}</b></div><div class="detail-info"><small>Cod OEM</small><b>${esc(x.oem||'—')}</b></div><div class="detail-info"><small>Livrare</small><b>${x.delivery?'Da':'Ridicare / discută cu vânzătorul'}</b></div></div><p>${esc(x.description||x.desc||'')}</p><div class="contact-actions">${phone?`<a class="btn primary" href="tel:${esc(phone)}">📞 Sună ${esc(x.seller_phone)}</a><a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/${esc(wa)}?text=${msg}">💬 WhatsApp</a>`:'<span class="form-note">Vânzătorul nu afișează numărul de telefon.</span>'}<button class="btn ghost" onclick="toast('Mesageria internă va fi conectată în etapa următoare.')">✉️ Mesaj</button></div>`;openModal('detailModal');}

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
$('#loginBtn')?.addEventListener('click',()=>{if(currentUser) openAccountMenu(); else openModal('authModal');}); $('#footerLogin')?.addEventListener('click',()=>openModal('authModal'));
$('#authLoginTab')?.addEventListener('click',()=>authMode(false)); $('#authRegisterTab')?.addEventListener('click',()=>authMode(true));
$('#loginForm')?.addEventListener('submit',async e=>{e.preventDefault();try{const r=await api('/api/auth/login',{method:'POST',body:{email:$('#loginEmail').value,password:$('#loginPassword').value}});currentUser=r.user;closeModal('authModal');updateUserUI();toast('Te-ai autentificat.');}catch(err){$('#authMessage').textContent=err.message;}});
$('#registerForm')?.addEventListener('submit',async e=>{e.preventDefault();try{const r=await api('/api/auth/register',{method:'POST',body:{name:$('#regName').value,email:$('#regEmail').value,phone:$('#regPhone').value,show_phone:$('#regShowPhone')?.checked||false,password:$('#regPassword').value}});currentUser=r.user;closeModal('authModal');updateUserUI();toast('Cont creat cu succes.');}catch(err){$('#registerMessage').textContent=err.message;}});
async function loadUser(){try{const r=await api('/api/me');currentUser=r.user||null;updateUserUI();}catch{}}
function updateUserUI(){
 if($('#loginBtn'))$('#loginBtn').textContent=currentUser?(currentUser.role==='admin'?'Admin: '+currentUser.name:currentUser.name):'Autentificare';
 $('#adminBarLinks')?.classList.toggle('hidden',!(currentUser&&currentUser.role==='admin'));
 if($('#accountMenuTitle')) $('#accountMenuTitle').textContent=currentUser?(currentUser.role==='admin'?'Contul meu · Administrator':'Contul meu'):'Contul meu';
 if($('#accountFavCount')) $('#accountFavCount').textContent=favorites.length;
}
function openAdminBar(tab='dashboard'){
 if(!currentUser||currentUser.role!=='admin'){openModal('authModal');toast('Autentifică-te cu contul de administrator.');return;}
 openModal('adminModal');
 $$('[data-admin-tab]').forEach(x=>x.classList.toggle('active',x.dataset.adminTab===tab));
 renderAdmin(tab);
} 
$$('[data-bar-admin]').forEach(b=>b.addEventListener('click',()=>openAdminBar(b.dataset.barAdmin)));
function openAccountMenu(){if(!currentUser){openModal('authModal');return;} updateUserUI(); openModal('accountMenuModal');}
function showMine(){closeModal('accountMenuModal'); const grid=$('#listingGrid'); if(!grid)return; location.hash='anunturi'; grid.innerHTML=''; const mine=listings.filter(x=>currentUser&&String(x.user_id||'')===String(currentUser.id)); mine.forEach(x=>grid.appendChild(card(x))); $('#resultCount').textContent=`${mine.length} anunț${mine.length===1?'':'uri'} ale tale`; $('#activeSearchLabel').textContent='Anunțurile mele';}
function showAccountSection(kind){
 if(kind==='listings'){showMine();return;}
 if(kind==='favorites'){$('#favoritesBtn').click();closeModal('accountMenuModal');return;}
 if(kind==='settings'){closeModal('accountMenuModal');openAccount();return;}
 if(kind==='requests'){closeModal('accountMenuModal');openModal('requestModal');return;}
 if(kind==='saved'){const saved=JSON.parse(localStorage.getItem('autopiese_saved_searches')||'[]');closeModal('accountMenuModal');toast(saved.length?`Ai ${saved.length} căutare${saved.length===1?'':'i'} salvate.`:'Nu ai încă căutări salvate.');return;}
 if(kind==='messages'){closeModal('accountMenuModal');toast('Mesajele sunt pregătite pentru modulul de comunicare dintre cumpărători și vânzători.');return;}
}
$$('[data-account-action]').forEach(b=>b.addEventListener('click',()=>showAccountSection(b.dataset.accountAction)));
$('#accountLogoutMenu')?.addEventListener('click',()=>$('#logoutBtn')?.click());

function openAccount(){if(!currentUser){openModal('authModal');return;}$('#accName').value=currentUser.name||'';$('#accEmail').value=currentUser.email||'';$('#accPhone').value=currentUser.phone||'';$('#accShowPhone').checked=!!currentUser.show_phone;$('#accountMessage').textContent='';openModal('accountModal');}
$('#accountForm')?.addEventListener('submit',async e=>{e.preventDefault();try{const r=await api('/api/me',{method:'PATCH',body:{phone:$('#accPhone').value.trim(),show_phone:$('#accShowPhone').checked}});currentUser=r.user;updateUserUI();$('#accountMessage').textContent='Datele au fost salvate.';}catch(err){$('#accountMessage').textContent=err.message;}});
$('#logoutBtn')?.addEventListener('click',async()=>{try{await api('/api/auth/logout',{method:'POST'});}catch{}currentUser=null;updateUserUI();closeModal('accountModal');toast('Ai ieșit din cont.');});
async function syncListings(){try{const r=await api('/api/listings');if(Array.isArray(r.listings)&&r.listings.length){listings=r.listings.map(x=>({...x,price:Number(x.price)||0,description:x.description||'',icon:x.type==='masina'?'🚗':x.type==='dezmembrari'?'♻️':'🔧'}));save();renderListings();}}catch{}}
async function ensureUser(){await loadUser();if(currentUser)return true;openModal('authModal');return false;}

$$('[data-publish-type]').forEach(b=>b.addEventListener('click',()=>{ const type=b.dataset.publishType; $('#pubType').value=type; $('#publishStep1').classList.add('hidden'); $('#publishForm').classList.remove('hidden'); $('#conditionWrap').classList.toggle('hidden',type!=='piesa'); $('#partCategoryWrap').classList.toggle('hidden',type!=='piesa'); $('#pubDelivery').closest('.check')?.classList.toggle('hidden',false); $('#pubTitle').placeholder=type==='piesa'?'Ex. Alternator Dacia Bigster 1.2':'Ex. Dacia Bigster 1.2 pentru dezmembrare'; $('#pubDescription').placeholder=type==='piesa'?'Descrie piesa, compatibilitatea, starea și eventualele defecte...':'Descrie mașina donatoare și piesele disponibile...'; $('#publishStep3').classList.add('hidden'); $('#pubTitle').focus(); }));
$('#backPublish')?.addEventListener('click',()=>{$('#publishForm').classList.add('hidden');$('#publishStep1').classList.remove('hidden');});
$('#publishBtn')?.addEventListener('click',async()=>{if(await ensureUser()){openModal('publishModal');$('#publishStep1').classList.remove('hidden');$('#publishForm').classList.add('hidden');$('#publishStep3').classList.add('hidden');}});
$('#footerPublish')?.addEventListener('click',()=>$('#publishBtn')?.click());
let titleTimer; $('#pubTitle')?.addEventListener('input',()=>{clearTimeout(titleTimer);titleTimer=setTimeout(async()=>{const v=await applyVehicleFromText($('#pubTitle').value);if(v)toast(`Am identificat: ${[v.make,v.model,v.year,v.engine].filter(Boolean).join(' · ')}`);},500);});
$('#pubPhotos')?.addEventListener('change',e=>{const box=$('#photoPreview');if(!box)return;box.innerHTML='';[...e.target.files].slice(0,8).forEach(file=>{const img=document.createElement('img');img.alt=file.name;img.src=URL.createObjectURL(file);box.appendChild(img);});});
$('#pubMake')?.addEventListener('change',e=>loadPublishModels(e.target.value));
$('#publishForm')?.addEventListener('submit',async e=>{e.preventDefault();if(!(await ensureUser()))return;const type=$('#pubType').value;const title=$('#pubTitle').value.trim();if(!title){toast('Adaugă un titlu pentru anunț.');return;}if(type==='piesa'&&!$('#pubCategory').value){toast('Alege categoria piesei.');return;}const payload={type,title,price:Number($('#pubPrice').value)||0,condition:type==='piesa'?$('#pubCondition').value:'Second-hand',make:$('#pubMake').value,model:$('#pubModel').value,year:$('#pubYear').value,engine:$('#pubEngine')?.value.trim()||'',generation:$('#pubGeneration')?.value.trim()||'',county:$('#pubCounty').value,seller_type:$('#pubSellerType')?.value||'particular',category:type==='piesa'?$('#pubCategory').value:'Dezmembrări',oem:$('#pubOem').value.trim(),delivery:$('#pubDelivery').checked,negotiable:$('#pubNegotiable')?.checked||false,quantity:Number($('#pubQuantity')?.value)||1,description:$('#pubDescription').value};try{const r=await api('/api/listings',{method:'POST',body:payload});listings.unshift({...r.listing,price:Number(r.listing.price)||0,description:r.listing.description,icon:type==='piesa'?'🔧':'♻️'});save();$('#publishForm').classList.add('hidden');$('#publishStep3').classList.remove('hidden');renderListings();}catch(err){toast(err.message);}});

$('#requestBtn')?.addEventListener('click',async()=>{if(await ensureUser())openModal('requestModal');});
$('#requestForm')?.addEventListener('submit',async e=>{e.preventDefault();const inputs=e.target.querySelectorAll('input,textarea,select');const vals=[...inputs].map(x=>x.value);try{await api('/api/requests',{method:'POST',body:{title:vals[1]||vals[0],make:'',model:'',year:'',description:vals.join(' | ')}});closeModal('requestModal');toast('Cererea a fost trimisă.');}catch(err){toast(err.message);}});

const adminTabs={
 dashboard:()=>`<div class="admin-toolbar"><div><div class="eyebrow">Control center</div><h3>Dashboard</h3><p class="admin-sub">Imagine de ansamblu asupra platformei și activității recente.</p></div><button class="btn primary" data-admin-action="listings">Verifică anunțurile</button></div><div class="stat-grid admin-stat-grid"><div class="stat"><small>Utilizatori</small><b id="stUsers">—</b><span class="stat-note">conturi create</span></div><div class="stat"><small>Anunțuri</small><b id="stListings">—</b><span class="stat-note">toate statusurile</span></div><div class="stat warning"><small>În așteptare</small><b id="stPending">—</b><span class="stat-note">necesită moderare</span></div><div class="stat"><small>Aprobate</small><b id="stApproved">—</b><span class="stat-note">vizibile public</span></div><div class="stat"><small>Cereri piese</small><b id="stRequests">—</b><span class="stat-note">deschise</span></div><div class="stat warning"><small>Raportări</small><b id="stReports">—</b><span class="stat-note">de verificat</span></div></div><div class="admin-section"><div class="admin-section-head"><div><h4>Activitate recentă</h4><p>Ultimele anunțuri introduse în platformă.</p></div><button class="text-btn" data-admin-action="listings">Vezi toate →</button></div><div id="adminRecent">Se încarcă...</div></div>`,
 listings:()=>`<div class="admin-toolbar"><div><div class="eyebrow">Moderare</div><h3>Anunțuri</h3><p class="admin-sub">Aprobă, respinge, blochează sau șterge anunțuri.</p></div></div><div class="admin-filters"><input id="adminListingSearch" placeholder="Caută titlu, OEM, vânzător..."><select id="adminListingStatus"><option value="all">Toate statusurile</option><option value="pending">În așteptare</option><option value="approved">Aprobate</option><option value="rejected">Respinse</option><option value="blocked">Blocate</option></select></div><div id="adminListings">Se încarcă...</div>`,
 users:()=>`<div class="admin-toolbar"><div><div class="eyebrow">Comunitate</div><h3>Utilizatori</h3><p class="admin-sub">Gestionează conturile și accesul la platformă.</p></div></div><div class="admin-filters"><input id="adminUserSearch" placeholder="Caută nume sau email..."><select id="adminUserStatus"><option value="all">Toate</option><option value="active">Activi</option><option value="blocked">Blocați</option></select></div><div id="adminUsers">Se încarcă...</div>`,
 requests:()=>`<div class="admin-toolbar"><div><div class="eyebrow">Lead-uri</div><h3>Cereri de piese</h3><p class="admin-sub">Urmărește cererile clienților și statusul lor.</p></div></div><div id="adminRequests">Se încarcă...</div>`,
 reports:()=>`<div class="admin-toolbar"><div><div class="eyebrow">Siguranță</div><h3>Raportări</h3><p class="admin-sub">Verifică sesizările trimise pentru anunțuri.</p></div></div><div id="adminReports">Se încarcă...</div>`,
 categories:()=>`<div class="admin-toolbar"><div><div class="eyebrow">Catalog</div><h3>Categorii și compatibilitate</h3><p class="admin-sub">Structura folosită de formularul de publicare și căutare.</p></div></div><div class="admin-category-grid">${['Motor','Caroserie','Electrică','Frâne','Suspensie','Transmisie','Interior','Roți & anvelope','Iluminare','Climatizare','Direcție','Evacuare','Altele'].map(x=>`<div class="admin-category"><span>🔧</span><b>${x}</b><small>Activă</small></div>`).join('')}</div>`,
 settings:()=>`<div class="admin-toolbar"><div><div class="eyebrow">Platformă</div><h3>Setări</h3><p class="admin-sub">Configurări generale ale marketplace-ului.</p></div></div><div class="admin-settings"><div><b>Moderare anunțuri</b><span>Anunțurile noi intră în așteptare înainte de publicare.</span><strong>ACTIV</strong></div><div><b>Conturi utilizatori</b><span>Utilizatorii se pot înregistra și își pot administra propriile anunțuri.</span><strong>ACTIV</strong></div><div><b>Plăți online</b><span>Nu sunt activate în această versiune.</span><strong>INACTIV</strong></div><div><b>Catalog auto</b><span>Compatibilitatea este rezolvată prin catalogul VehiclesDB.</span><strong>ACTIV</strong></div></div>`
};
function adminTable(rows,heads){return `<div class="admin-table-wrap"><table class="admin-table"><thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`}
async function renderAdmin(tab='dashboard'){
 const c=$('#adminContent'); c.innerHTML=adminTabs[tab]();
 try{
  if(tab==='dashboard'){
   const r=await api('/api/admin/overview'); const s=r.stats;
   $('#stUsers').textContent=s.users; $('#stListings').textContent=s.listings; $('#stPending').textContent=s.pending; $('#stApproved').textContent=s.approved; $('#stRequests').textContent=s.requests; $('#stReports').textContent=s.reports;
   $('#adminRecent').innerHTML=adminTable((r.recent||[]).map(x=>`<tr><td><b>${esc(x.title)}</b><small class="table-muted">${esc(x.seller_name||'Utilizator')}</small></td><td>${money(x.price)}</td><td><span class="status ${x.status}">${esc(x.status)}</span></td><td><button data-admin-open-listings="1">Gestionează</button></td></tr>`).join('')||'<tr><td colspan="4">Nu există activitate.</td></tr>',['Anunț','Preț','Status','']);
  }
  if(tab==='listings'){
   const r=await api('/api/admin/listings'); const draw=()=>{const q=norm($('#adminListingSearch')?.value||'');const st=$('#adminListingStatus')?.value||'all';const data=r.listings.filter(x=>(st==='all'||x.status===st)&&(!q||norm([x.title,x.oem,x.make,x.model,x.seller_name,x.seller_email].join(' ')).includes(q)));$('#adminListings').innerHTML=adminTable(data.map(x=>`<tr><td><b>${esc(x.title)}</b><small class="table-muted">${esc(x.make||'')} ${esc(x.model||'')} · ${esc(x.seller_name||'—')}</small></td><td>${money(x.price)}</td><td><span class="status ${x.status}">${esc(x.status)}</span></td><td class="actions"><button data-a="${x.id}" data-s="approved">Aprobă</button><button data-a="${x.id}" data-s="rejected">Respinge</button><button data-a="${x.id}" data-s="blocked">Blochează</button><button class="danger" data-delete="${x.id}">Șterge</button></td></tr>`).join('')||'<tr><td colspan="4">Nu există anunțuri.</td></tr>',['Anunț / vânzător','Preț','Status','Acțiuni']);}; draw(); $('#adminListingSearch').oninput=draw; $('#adminListingStatus').onchange=draw; $$('[data-a]').forEach(b=>b.onclick=()=>adminStatus(b.dataset.a,b.dataset.s)); $$('[data-delete]').forEach(b=>b.onclick=()=>adminDeleteListing(b.dataset.delete));
  }
  if(tab==='users'){
   const r=await api('/api/admin/users'); const draw=()=>{const q=norm($('#adminUserSearch')?.value||'');const st=$('#adminUserStatus')?.value||'all';const data=r.users.filter(x=>(st==='all'||x.status===st)&&(!q||norm([x.name,x.email,x.phone].join(' ')).includes(q)));$('#adminUsers').innerHTML=adminTable(data.map(x=>`<tr><td><b>${esc(x.name)}</b><small class="table-muted">${esc(x.email)}</small></td><td><span class="role ${x.role}">${esc(x.role)}</span></td><td><span class="status ${x.status}">${esc(x.status)}</span></td><td>${x.status==='active'?`<button data-user="${x.id}" data-us="blocked">Blochează</button>`:`<button data-user="${x.id}" data-us="active">Deblochează</button>`}</td></tr>`).join('')||'<tr><td colspan="4">Nu există utilizatori.</td></tr>',['Utilizator','Rol','Status','Acțiuni']);}; draw(); $('#adminUserSearch').oninput=draw; $('#adminUserStatus').onchange=draw; $$('[data-user]').forEach(b=>b.onclick=()=>adminUserStatus(b.dataset.user,b.dataset.us));
  }
  if(tab==='requests'){const r=await api('/api/admin/requests');$('#adminRequests').innerHTML=adminTable((r.requests||[]).map(x=>`<tr><td><b>${esc(x.title)}</b><small class="table-muted">${esc(x.user_name||'Utilizator')} · ${esc(x.user_email||'')}</small></td><td>${esc([x.make,x.model,x.year].filter(Boolean).join(' · ')||'—')}</td><td><span class="status ${x.status}">${esc(x.status)}</span></td><td><select data-request="${x.id}"><option value="open" ${x.status==='open'?'selected':''}>Deschisă</option><option value="matched" ${x.status==='matched'?'selected':''}>Potrivită</option><option value="closed" ${x.status==='closed'?'selected':''}>Închisă</option></select></td></tr>`).join('')||'<tr><td colspan="4">Nu există cereri.</td></tr>',['Cerere / client','Vehicul','Status','Actualizare']); $$('[data-request]').forEach(x=>x.onchange=()=>adminRequestStatus(x.dataset.request,x.value));}
  if(tab==='reports'){const r=await api('/api/admin/reports');$('#adminReports').innerHTML=adminTable((r.reports||[]).map(x=>`<tr><td><b>${esc(x.listing_title||'Anunț șters')}</b><small class="table-muted">${esc(x.reason)}</small></td><td>${esc(x.reporter_name||'—')}</td><td><span class="status ${x.status}">${esc(x.status)}</span></td><td><select data-report="${x.id}"><option value="open" ${x.status==='open'?'selected':''}>Deschisă</option><option value="reviewed" ${x.status==='reviewed'?'selected':''}>Verificată</option><option value="closed" ${x.status==='closed'?'selected':''}>Închisă</option></select></td></tr>`).join('')||'<tr><td colspan="4">Nu există raportări.</td></tr>',['Anunț / motiv','Raportat de','Status','Actualizare']); $$('[data-report]').forEach(x=>x.onchange=()=>adminReportStatus(x.dataset.report,x.value));}
 }catch(e){c.insertAdjacentHTML('beforeend',`<div class="admin-error">${esc(e.message)}</div>`)}
}
async function adminStatus(id,status){try{await api('/api/admin/listings/'+id,{method:'PATCH',body:{status}});toast('Statusul anunțului a fost actualizat.');renderAdmin('listings');}catch(e){toast(e.message)}}
async function adminDeleteListing(id){if(!confirm('Ștergi definitiv acest anunț?'))return;try{await api('/api/admin/listings/'+id,{method:'DELETE'});toast('Anunț șters.');renderAdmin('listings')}catch(e){toast(e.message)}}
async function adminUserStatus(id,status){try{await api('/api/admin/users/'+id,{method:'PATCH',body:{status}});toast('Utilizator actualizat.');renderAdmin('users')}catch(e){toast(e.message)}}
async function adminRequestStatus(id,status){try{await api('/api/admin/requests/'+id,{method:'PATCH',body:{status}});toast('Cererea a fost actualizată.');renderAdmin('requests')}catch(e){toast(e.message)}}
async function adminReportStatus(id,status){try{await api('/api/admin/reports/'+id,{method:'PATCH',body:{status}});toast('Raportarea a fost actualizată.');renderAdmin('reports')}catch(e){toast(e.message)}}
async function openAdmin(){try{const m=await api('/api/me');currentUser=m.user||currentUser;if(!currentUser||currentUser.role!=='admin'){openModal('authModal');toast('Autentifică-te cu contul de administrator.');return;}openModal('adminModal');renderAdmin('dashboard')}catch{toast('Panoul de administrare necesită baza de date.')}}
$$('[data-admin-tab]').forEach(b=>b.addEventListener('click',()=>{$$('[data-admin-tab]').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderAdmin(b.dataset.adminTab);}));
$('#adminContent')?.addEventListener('click',e=>{const b=e.target.closest('[data-admin-action], [data-admin-open-listings]');if(!b)return;const tab='listings';$$('[data-admin-tab]').forEach(x=>{x.classList.toggle('active',x.dataset.adminTab===tab)});renderAdmin(tab);});
$('#menuBtn')?.addEventListener('click',()=>$('#mobileNav')?.classList.toggle('hidden'));
$('#saveSearchBtn')?.addEventListener('click',async()=>{if(!(await ensureUser()))return;const saved=JSON.parse(localStorage.getItem('autopiese_saved_searches')||'[]');const item={q:$('#searchInput').value.trim(),make:$('#make').value,model:$('#model').value,year:$('#year').value,condition:$('#condition').value,county:$('#county').value,created_at:new Date().toISOString()}; if(!item.q&&!item.make&&!item.model&&!item.year&&!item.condition&&!item.county){toast('Completează cel puțin un criteriu de căutare.');return;} saved.unshift(item);localStorage.setItem('autopiese_saved_searches',JSON.stringify(saved.slice(0,20)));toast('Căutarea a fost salvată.');});
$('#clearSearch')?.addEventListener('click',()=>{['#searchInput','#make','#model','#year','#condition','#county','#filterType','#filterCondition','#maxPrice','#filterCategory','#filterSeller','#sortListings'].forEach(id=>{const e=$(id);if(e)e.value=id==='#filterType'?'all':id==='#sortListings'?'relevance':''});if($('#withDelivery'))$('#withDelivery').checked=false;$('.chip.active')?.classList.remove('active');document.querySelector('.chip[data-type="all"]')?.classList.add('active');renderListings();});
['#filterCategory','#filterSeller','#sortListings'].forEach(id=>$(id)?.addEventListener('change',renderListings));
$('#searchInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();location.hash='anunturi';renderListings();}});


fillYearSelects(); loadCatalog(); loadUser(); syncListings(); renderListings();
