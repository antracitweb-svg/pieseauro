'use strict';
/* AutoPiese V26 — frontend (fără handlere inline, compatibil cu CSP) */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const ERR = {
  INVALID_LOGIN:'Email/nickname sau parolă incorectă.',ACCOUNT_BLOCKED:'Contul este blocat.',EMAIL_EXISTS:'Există deja un cont cu acest email.',
  NICKNAME_EXISTS:'Nickname-ul este deja folosit.',NICKNAME_INVALID:'Nickname-ul trebuie să aibă 3–30 de caractere (litere, cifre, _ . -).',
  DATE_INVALIDE:'Verifică datele introduse.',AUTH_REQUIRED:'Trebuie să te autentifici.',
  EMAIL_NOT_CONFIGURED:'Trimiterea emailurilor nu este configurată încă pe server.',EMAIL_SENDER_NOT_CONFIGURED:'Lipsește expeditorul email (RESEND_FROM).',
  EMAIL_SENDER_INVALID:'Adresa configurată pentru RESEND_FROM nu este validă.',EMAIL_SENDER_NOT_VERIFIED:'Expeditorul email nu este verificat în Resend.',
  EMAIL_PROVIDER_FORBIDDEN:'Serviciul de email a refuzat trimiterea. Verifică cheia API și expeditorul.',EMAIL_RATE_LIMIT:'Prea multe cereri către serviciul de email. Încearcă peste câteva minute.',
  EMAIL_SEND_FAILED:'Emailul nu a putut fi trimis. Încearcă din nou.',RECOVERY_RATE_LIMIT:'Ai cerut prea multe resetări. Încearcă peste 15 minute.',
  LOGIN_RATE_LIMIT:'Prea multe încercări. Încearcă din nou mai târziu.',RESET_EXPIRED:'Linkul a expirat sau a fost deja folosit.',
  EMAIL_REQUIRED:'Introdu o adresă de email validă.',SERVER_ERROR:'A apărut o eroare pe server.',MAX_PHONES:'Poți avea maximum 4 numere de telefon.',
  PHONE_EXISTS:'Acest număr este deja adăugat.',PHONE_INVALID:'Număr de telefon invalid.',STARE_INVALIDA:'Alege starea piesei.',
  PREA_MULTE_ANUNTURI:'Ai trimis prea multe anunțuri sau cereri. Încearcă mai târziu.',NOT_FOUND:'Nu am găsit ce cauți.',ADMIN_ONLY:'Doar administratorul are acces.',
  STATUS_INVALIDE:'Status invalid.',CANNOT_BLOCK_SELF:'Nu îți poți bloca propriul cont.',DATABASE_NOT_CONFIGURED:'Baza de date nu este configurată pe server.'
};
const CATEGORIES = [['Motor','⚙️'],['Transmisie','🔧'],['Frâne','🛑'],['Iluminare','💡'],['Caroserie','🚗'],['Suspensie','🔩'],['Roți','🛞'],['Electrică','🔌'],['Interior','💺'],['Climatizare','❄️'],['Evacuare','💨'],['Filtre','🧴'],['Altele','📦']];
const COUNTIES = ['Alba','Arad','Argeș','Bacău','Bihor','Bistrița-Năsăud','Botoșani','Brăila','Brașov','București','Buzău','Caraș-Severin','Călărași','Cluj','Constanța','Covasna','Dâmbovița','Dolj','Galați','Giurgiu','Gorj','Harghita','Hunedoara','Ialomița','Iași','Ilfov','Maramureș','Mehedinți','Mureș','Neamț','Olt','Prahova','Satu Mare','Sălaj','Sibiu','Suceava','Teleorman','Timiș','Tulcea','Vaslui','Vâlcea','Vrancea'];
const STATUS_LABEL = {pending:['În așteptare','pending'],approved:['Publicat','new'],rejected:['Respins','bad'],blocked:['Blocat','bad']};
const REPORT_REASONS = ['Preț înșelător','Piesa nu există / escrocherie','Conținut necorespunzător','Anunț duplicat','Altceva'];
const ROUTES = {home:'page-home',rezultate:'page-results',menu:'page-menu',cont:'page-account',cerere:'page-request',vinde:'page-sell',dezmembrari:'page-dism',servicii:'page-services',admin:'page-admin',match:'page-match',requests:'page-requests',stores:'page-stores',saved:'page-saved','account-tool':'page-account-tool',privacy:'page-privacy',cookies:'page-cookies',terms:'page-terms','reset-password':'page-reset-password',settings:'page-settings','verify-email-change':'page-verify-email-change'};
const AUTH_ROUTES = new Set(['cont','cerere','vinde','settings','admin']);
const FILTER_FIELDS = {filterType:'type',filterCategory:'category',filterMake:'make',filterModel:'model',filterCondition:'condition',filterCounty:'county',maxPrice:'maxPrice',filterSeller:'seller_type',sortListings:'sort'};

/* ---------- utilitare ---------- */
function readJSON(key, def){ try{ const v=JSON.parse(localStorage.getItem(key)); return v==null?def:v; }catch{ return def; } }
function writeJSON(key, v){ try{ localStorage.setItem(key, JSON.stringify(v)); }catch{} }
function esc(s=''){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function money(n){ return Number(n)>0 ? new Intl.NumberFormat('ro-RO').format(Number(n))+' lei' : 'La cerere'; }
function fmtDate(iso){ const d=new Date(iso); return isNaN(d)?'':d.toLocaleDateString('ro-RO'); }
function slug(s=''){ return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120); }
let toastTimer;
function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.remove('hidden'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.add('hidden'),3200); }
function setMsg(el, text, kind){ el.textContent=text||''; el.classList.toggle('error-message',kind==='error'); el.classList.toggle('ok-message',kind==='ok'); }
const safe = fn => (...a) => Promise.resolve().then(()=>fn(...a)).catch(e=>toast(e.message||'A apărut o eroare.'));


/* ---------- validare vizuală uniformă ---------- */
function clearFieldError(field){
  if(!field) return;
  field.classList.remove('field-error');
  field.removeAttribute('aria-invalid');
  const wrap=field.closest('label');
  if(wrap) wrap.classList.remove('has-error');
  const msg=wrap?.querySelector('.field-error-message');
  if(msg) msg.remove();
}
function showFieldError(field,message='Completează acest câmp.'){
  if(!field) return;
  field.classList.add('field-error'); field.setAttribute('aria-invalid','true');
  const wrap=field.closest('label');
  if(wrap){
    wrap.classList.add('has-error');
    let msg=wrap.querySelector('.field-error-message');
    if(!msg){msg=document.createElement('small');msg.className='field-error-message';wrap.appendChild(msg);}
    msg.textContent=message;
  }
}
function validateForm(form){
  if(!form) return true;
  let first=null;
  form.querySelectorAll('input,select,textarea').forEach(clearFieldError);
  form.querySelectorAll('input,select,textarea').forEach(field=>{
    if(field.disabled||field.type==='hidden'||field.type==='checkbox'||field.type==='file') return;
    const value=String(field.value||'').trim();
    if(field.required&&!value){showFieldError(field,'Completează acest câmp.');if(!first)first=field;return;}
    if(field.type==='email'&&value&&!field.checkValidity()){showFieldError(field,'Introdu o adresă de email validă.');if(!first)first=field;return;}
    if(field.minLength>0&&value&&value.length<field.minLength){showFieldError(field,`Introdu cel puțin ${field.minLength} caractere.`);if(!first)first=field;return;}
    if(field.type==='number'&&value&&!field.checkValidity()){showFieldError(field,'Introdu o valoare validă.');if(!first)first=field;}
  });
  if(first){first.focus({preventScroll:true});first.scrollIntoView({behavior:'smooth',block:'center'});return false;}
  return true;
}
function initFormValidation(){
  document.addEventListener('invalid',e=>{
    const f=e.target;
    if(f instanceof HTMLElement&&f.matches('input,select,textarea')) showFieldError(f,f.type==='email'?'Introdu o adresă de email validă.':'Completează acest câmp.');
  },true);
  document.addEventListener('input',e=>{const f=e.target;if(f instanceof HTMLElement&&f.matches('input,select,textarea')&&String(f.value||'').trim())clearFieldError(f);});
  document.addEventListener('change',e=>{const f=e.target;if(f instanceof HTMLElement&&f.matches('input,select,textarea')&&String(f.value||''))clearFieldError(f);});
  document.querySelectorAll('form').forEach(form=>form.addEventListener('submit',e=>{if(!validateForm(form))e.preventDefault();},true));
}

let currentUser = null;
let favorites = readJSON('autopiese_fav', []).map(Number).filter(Number.isFinite);
const modelCache = new Map();
const state = { mode:'search', filters:{}, loaded:[], total:0, offset:0, token:0, extra:{}, sellImages:[] };

async function api(url, opt={}){
  let r;
  try{
    r = await fetch(url,{credentials:'same-origin',...opt,headers:{'Content-Type':'application/json',...(opt.headers||{})}});
  }catch{ throw new Error('Nu mă pot conecta la server. Verifică internetul.'); }
  let d = {};
  try{ d = await r.json(); }catch{}
  if(!r.ok){
    if(r.status===401 && d.error==='AUTH_REQUIRED' && currentUser){ currentUser=null; renderHeader(); }
    const e = new Error(ERR[d.error] || d.message || 'A apărut o eroare.');
    e.code = d.error; e.status = r.status; throw e;
  }
  return d;
}

/* ---------- navigare ---------- */
function parseHash(){
  const raw = location.hash.replace(/^#\/?/,'');
  const [name, qs] = raw.split('?');
  return { name: name || 'home', params: new URLSearchParams(qs||'') };
}
function navigate(x){ const target='#/'+x; if(location.hash===target) route(); else location.hash=target; }
function needsAuth(name, params){ return AUTH_ROUTES.has(name) || (name==='requests' && params.get('t')==='mine') || (name==='rezultate' && ['mine'].includes(params.get('mode'))); }
function showPage(id){ $$('.page').forEach(p=>p.classList.toggle('active',p.id===id)); window.scrollTo(0,0); }

function route(){
  const { name, params } = parseHash();
  const id = ROUTES[name];
  if(!id){ navigate('home'); return; }
  if(needsAuth(name, params) && !currentUser){
    showPage('page-home'); loadHome();
    openAuth(location.hash.replace(/^#\//,''));
    return;
  }
  showPage(id);
  if(name==='home'){ $('#topSearchInput').value=''; loadHome(); }
  else if(name==='rezultate') enterResults(params);
  else if(name==='dezmembrari') loadDism();
  else if(name==='requests') loadRequests(params.get('t')==='mine');
  else if(name==='stores') loadStores(params.get('t')==='parks');
  else if(name==='saved') renderSaved();
  else if(name==='cont') renderAccount();
  else if(name==='settings') safe(loadSettings)();
  else if(name==='verify-email-change') safe(confirmEmailChange)(params);
  else if(name==='admin') safe(loadAdmin)();
  else if(name==='menu') renderHeader();
  else if(name==='account-tool') renderAccountTool(params.get('view'));
}

function renderHeader(){
  const label = currentUser ? (currentUser.nickname || currentUser.name || 'Contul meu') : 'Intră în cont';
  $('#accountLabel').textContent = label;
  $('#menuAccountText').textContent = currentUser ? label : 'Intră în cont';
  const isAdmin = !!(currentUser && currentUser.role==='admin');
  $('#adminMenu').classList.toggle('hidden', !isAdmin);
  const ad = $('#accountAdmin'); if(ad) ad.classList.toggle('hidden', !isAdmin);
  $('#favCount').textContent = favorites.length;
}
function renderAccount(){
  $('#accountHello').textContent = `Salut, ${currentUser.nickname || currentUser.name || 'utilizator'}!`;
  renderHeader();
}

function renderAccountTool(view){
  const data = {
    cart:{title:'Coșul meu',text:'Coșul este pregătit. Anunțurile adăugate în coș vor apărea aici.',action:'rezultate',label:'Vezi piesele'},
    offers:{title:'Oferte la cereri',text:'Aici vei putea trimite și gestiona ofertele pentru cererile de piese.',action:'requests',label:'Vezi cererile disponibile'},
    'orders-seller':{title:'Comenzi din oferte',text:'Comenzile acceptate din ofertele tale vor apărea aici.',action:null,label:null},
    'offers-received':{title:'Ofertele primite',text:'Ofertele primite la cererile tale vor apărea aici.',action:'requests?t=mine',label:'Vezi cererile mele'},
    orders:{title:'Comenzile mele',text:'Comenzile tale vor apărea aici după ce o ofertă este acceptată.',action:null,label:null},
    messages:{title:'Mesaje',text:'Mesageria dintre cumpărători și vânzători va apărea aici.',action:null,label:null},
    notifications:{title:'Notificări',text:'Notificările contului vor apărea aici când există activitate nouă.',action:null,label:null},
    credits:{title:'Credite',text:'Soldul și creditele contului vor apărea aici când funcția de creditare este activată.',action:null,label:null},
    transactions:{title:'Tranzacții',text:'Istoricul tranzacțiilor va apărea aici după implementarea plăților.',action:null,label:null},
    invoices:{title:'Facturi',text:'Facturile vor apărea aici după implementarea plăților și facturării.',action:null,label:null}
  };
  const d=data[view]||{title:'Cont',text:'Secțiunea nu a fost găsită.',action:null,label:null};
  $('#accountToolTitle').textContent=d.title;
  $('#accountToolSub').textContent=d.text;
  const content=$('#accountToolContent');
  if(content){
    content.innerHTML=`<div class="info-card account-tool-card"><p>${esc(d.text)}</p>${d.action?`<button class="btn primary" data-action="${esc(d.action)}">${esc(d.label)}</button>`:''}</div>`;
  }
}

/* ---------- selecturi / catalog ---------- */
function setOptions(sel, first, items){
  const keep = sel.value;
  sel.innerHTML = `<option value="">${esc(first)}</option>` + items.map(v=>`<option>${esc(v)}</option>`).join('');
  if(keep && items.includes(keep)) sel.value = keep;
}
function fillStaticSelects(){
  const cats = CATEGORIES.map(c=>c[0]);
  setOptions($('#filterCategory'),'Toate',cats);
  setOptions($('#sellCategory'),'Alege categoria',cats);
  setOptions($('#filterCounty'),'Toate județele',COUNTIES);
  setOptions($('#sellCounty'),'Alege județul',COUNTIES);
  $('#catGrid').innerHTML = CATEGORIES.map(([n,i])=>`<button class="cat" data-cat="${esc(n)}"><span>${i}</span>${esc(n)}</button>`).join('');
}
async function loadCatalog(){
  let makes = [];
  try{ makes = ((await api('/api/catalog/makes')).makes||[]).map(x=>x.name); }catch{}
  if(!makes.length) return;
  for(const [id,first] of [['filterMake','Toate mărcile'],['homeMake','Alege marca'],['matchMake','Alege marca'],['sellMake','Alege marca'],['reqMake','Alege marca']]){
    const el = $('#'+id); if(el) setOptions(el, first, makes);
  }
}
async function loadModels(make, selectId, first='Alege modelul'){
  const el = $('#'+selectId); if(!el) return;
  if(!make){ setOptions(el, first, []); return; }
  let models = modelCache.get(make);
  if(!models){
    try{ models = ((await api('/api/catalog/models?make='+encodeURIComponent(make))).models||[]).map(x=>x.name); modelCache.set(make,models); }
    catch{ models = []; }
  }
  setOptions(el, first, models);
}

/* ---------- carduri ---------- */
function card(x, o={}){
  const fav = favorites.includes(x.id);
  const meta = [x.make,x.model,x.year].filter(Boolean).join(' · ') || (x.category || 'Piesă auto');
  const st = o.mine ? (STATUS_LABEL[x.status]||['',''] ) : null;
  const firstImage = Array.isArray(x.images) && x.images[0] ? x.images[0] : '';
  const img = firstImage
    ? `<button type="button" class="listing-image-button" data-lightbox-src="${esc(firstImage)}" data-lightbox-alt="${esc(x.title)}" aria-label="Vezi poza mai mare"><img src="${esc(firstImage)}" alt="${esc(x.title)}" loading="lazy"><span class="image-zoom-hint">⌕</span></button>`
    : `<div class="listing-placeholder">${x.type==='dezmembrari'?'🚗':'⚙️'}</div>`;
  return `<article class="listing" data-open="${x.id}" tabindex="0">
    <div class="listing-image">${img}</div>
    <div class="listing-body">
      <div class="listing-top"><h3>${esc(x.title)}</h3>${o.mine?'':`<button class="listing-fav" data-fav="${x.id}" aria-label="Favorite">${fav?'♥':'♡'}</button>`}</div>
      <div class="listing-meta">${esc(meta)}${x.category?` · ${esc(x.category)}`:''}</div>
      ${x.description?`<p class="listing-desc">${esc(x.description)}</p>`:''}
      <div class="listing-bottom">
        <div><div class="listing-price">${money(x.price)}</div><div class="listing-location">${esc(x.county||'România')}${x.delivery?' · Livrare':''}${x.seller_name?` · ${esc(x.seller_name)}`:''}</div></div>
        <div class="listing-actions">
          ${x.condition?`<span class="badge ${x.condition==='Nouă'?'new':''}">${esc(x.condition)}</span>`:''}
          ${st&&st[0]?`<span class="badge ${st[1]}">${st[0]}</span>`:''}
          ${o.mine?`<button class="btn danger small" data-del-listing="${x.id}">Șterge</button>`:''}
        </div>
      </div>
    </div></article>`;
}

function updateFavUI(){
  $('#favCount').textContent = favorites.length;
  $$('[data-fav]').forEach(b=>{ const on=favorites.includes(Number(b.dataset.fav)); b.textContent=(on?'♥':'♡')+(b.classList.contains('btn')?' Favorit':''); });
}
function toggleFavorite(id){
  const was = favorites.includes(id);
  favorites = was ? favorites.filter(x=>x!==id) : [...favorites, id];
  writeJSON('autopiese_fav', favorites);
  updateFavUI();
  if(currentUser) api('/api/favorites/'+id,{method:was?'DELETE':'POST'}).catch(()=>{});
  if(state.mode==='fav' && was){ state.loaded = state.loaded.filter(x=>x.id!==id); state.total = state.loaded.length; renderList(); }
  toast(was ? 'Eliminat din favorite.' : 'Adăugat la favorite.');
}
async function syncFavorites(){
  if(!currentUser) return;
  try{
    const f = (await api('/api/favorites')).favorites || [];
    const merged = [...new Set([...f.map(Number), ...favorites])];
    favorites = merged; writeJSON('autopiese_fav', favorites);
    merged.filter(id=>!f.includes(id)).forEach(id=>api('/api/favorites/'+id,{method:'POST'}).catch(()=>{}));
  }catch{}
  updateFavUI();
}

/* ---------- acasă ---------- */
async function loadHome(){
  const box = $('#homeListings');
  try{
    const r = await api('/api/listings?limit=6');
    box.innerHTML = r.listings.length ? r.listings.map(x=>card(x)).join('') : '<div class="empty">Încă nu sunt anunțuri publicate. <button class="link" data-action="sell">Publică primul anunț</button></div>';
  }catch(e){ box.innerHTML = `<p class="muted">${esc(e.message)}</p>`; }
}

/* ---------- rezultate ---------- */
function filtersToParams(){
  const p = new URLSearchParams();
  for(const [k,v] of Object.entries(state.filters)) if(v!==undefined && v!=='') p.set(k,v);
  for(const [k,v] of Object.entries(state.extra)) if(v) p.set(k,v);
  if(state.mode!=='search') p.set('mode',state.mode);
  return p;
}
function openSearch(extra={}){
  const p = new URLSearchParams();
  for(const [k,v] of Object.entries(extra)) if(v) p.set(k,v);
  navigate('rezultate' + (p.toString()?'?'+p.toString():''));
}
function enterResults(params){
  const mode = params.get('mode');
  state.mode = (mode==='mine'||mode==='fav') ? mode : 'search';
  $('#page-results').dataset.mode = state.mode;
  state.filters = {}; state.extra = {};
  for(const k of ['q','type','category','make','model','condition','county','maxPrice','seller_type','sort','delivery']) if(params.get(k)) state.filters[k]=params.get(k);
  for(const k of ['seller_id','sname']) if(params.get(k)) state.extra[k]=params.get(k);
  applyFiltersToUI().then(()=>loadResults(true));
}
async function applyFiltersToUI(){
  const f = state.filters;
  $('#resultsSearch').value = f.q || '';
  $('#topSearchInput').value = f.q || '';
  for(const [id,key] of Object.entries(FILTER_FIELDS)){ const el=$('#'+id); if(el && id!=='filterModel') el.value = f[key] || (id==='sortListings'?'new':''); }
  $('#withDelivery').checked = f.delivery==='true';
  await loadModels(f.make,'filterModel','Toate modelele');
  $('#filterModel').value = f.model || '';
}
function collectFilters(){
  const f = {};
  const q = $('#resultsSearch').value.trim(); if(q) f.q = q;
  for(const [id,key] of Object.entries(FILTER_FIELDS)){ const v=$('#'+id).value; if(v && !(key==='sort'&&v==='new')) f[key]=v; }
  if($('#withDelivery').checked) f.delivery='true';
  return f;
}
function onFilterChange(){
  state.filters = collectFilters();
  history.replaceState(null,'','#/rezultate'+(filtersToParams().toString()?'?'+filtersToParams().toString():''));
  $('#topSearchInput').value = state.filters.q || '';
  loadResults(true);
}
async function loadResults(reset){
  if(state.mode==='mine') return loadMine();
  if(state.mode==='fav') return loadFavoritesView();
  if(reset){ state.page = 1; state.offset = 0; state.loaded = []; }
  const token = ++state.token;
  const qs = new URLSearchParams({...state.filters, ...(state.extra.seller_id?{seller_id:state.extra.seller_id}:{}), limit:'30', offset:String(state.offset)});
  if(reset) $('#listingGrid').innerHTML = '<p class="muted">Se încarcă…</p>';
  try{
    const r = await api('/api/listings?'+qs.toString());
    if(token!==state.token) return;
    state.total = r.total; state.loaded = r.listings; state.offset = (state.page-1)*30;
    renderList();
  }catch(e){
    if(token!==state.token) return;
    $('#listingGrid').innerHTML = `<div class="empty">${esc(e.message)}</div>`;
    $('#resultCount').textContent = ''; $('#pagination').innerHTML=''; $('#noResults').classList.add('hidden');
  }
}
async function goToResultsPage(page){
  const pages=Math.max(1,Math.ceil(state.total/30));
  state.page=Math.min(pages,Math.max(1,Number(page)||1));
  state.offset=(state.page-1)*30;
  await loadResults(false);
  const top=document.querySelector('#page-results .page-head');
  if(top) top.scrollIntoView({behavior:'smooth',block:'start'});
}

async function loadMine(){
  const token = ++state.token;
  $('#listingGrid').innerHTML = '<p class="muted">Se încarcă…</p>';
  const r = await api('/api/listings/mine').catch(e=>{ $('#listingGrid').innerHTML=`<div class="empty">${esc(e.message)}</div>`; return null; });
  if(!r || token!==state.token) return;
  state.loaded = r.listings; state.total = r.listings.length; renderList();
}
async function loadFavoritesView(){
  const token = ++state.token;
  $('#listingGrid').innerHTML = '<p class="muted">Se încarcă…</p>';
  const ids = favorites.slice(0,60);
  const res = await Promise.allSettled(ids.map(id=>api('/api/listings/'+id)));
  if(token!==state.token) return;
  const gone = [];
  state.loaded = [];
  res.forEach((r,i)=>{ if(r.status==='fulfilled') state.loaded.push(r.value.listing); else if(r.reason && r.reason.status===404) gone.push(ids[i]); });
  if(gone.length){ favorites = favorites.filter(id=>!gone.includes(id)); writeJSON('autopiese_fav',favorites); updateFavUI(); }
  state.total = state.loaded.length; renderList();
}
function renderList(){
  const mine = state.mode==='mine';
  let title = 'Piese auto';
  if(mine) title = 'Anunțurile mele';
  else if(state.mode==='fav') title = 'Favorite';
  else if(state.extra.sname) title = 'Anunțurile vânzătorului ' + state.extra.sname;
  else if(state.filters.q) title = `Rezultate pentru „${state.filters.q}”`;
  else if(state.filters.category) title = state.filters.category;
  else if(state.filters.type==='dezmembrari') title = 'Dezmembrări auto';
  $('#resultsTitle').textContent = title;
  $('#crumbCurrent').textContent = title;
  $('#resultCount').textContent = state.total===1 ? '1 anunț' : `${state.total} anunțuri`;
  $('#listingGrid').innerHTML = state.loaded.map(x=>card(x,{mine})).join('');
  $('#noResults').classList.toggle('hidden', state.loaded.length>0);
  renderPagination();
}

function renderPagination(){
  const box=$('#pagination');
  if(!box) return;
  if(state.mode!=='search' || state.total<=30){ box.innerHTML=''; return; }
  const pages=Math.ceil(state.total/30), current=state.page;
  const items=[];
  if(current>1) items.push(`<button class="page-btn" data-page="${current-1}" aria-label="Pagina anterioară">‹</button>`);
  const from=Math.max(1,current-2), to=Math.min(pages,current+2);
  if(from>1){ items.push(`<button class="page-btn" data-page="1">1</button>`); if(from>2) items.push('<span class="page-dots">…</span>'); }
  for(let p=from;p<=to;p++) items.push(`<button class="page-btn ${p===current?'active':''}" data-page="${p}" aria-current="${p===current?'page':'false'}">${p}</button>`);
  if(to<pages){ if(to<pages-1) items.push('<span class="page-dots">…</span>'); items.push(`<button class="page-btn" data-page="${pages}">${pages}</button>`); }
  if(current<pages) items.push(`<button class="page-btn" data-page="${current+1}" aria-label="Pagina următoare">›</button>`);
  box.innerHTML=items.join('');
}


/* ---------- vizualizare foto ---------- */
let lightboxImages = [];
let lightboxIndex = 0;
function openLightbox(src, images=[], index=0, alt='Poza anunțului'){
  const list = Array.isArray(images) && images.length ? images : [src];
  lightboxImages = list.filter(Boolean);
  lightboxIndex = Math.max(0, Math.min(Number(index)||0, lightboxImages.length-1));
  const modal = $('#imageLightbox'), image = $('#imageLightboxImg');
  if(!modal || !image || !lightboxImages.length) return;
  image.alt = alt || 'Poza anunțului';
  modal.classList.remove('hidden');
  document.body.classList.add('lightbox-open');
  renderLightbox();
}
function renderLightbox(){
  const modal=$('#imageLightbox'), image=$('#imageLightboxImg'), counter=$('#imageLightboxCounter');
  if(!modal||!image||!lightboxImages.length) return;
  image.src=lightboxImages[lightboxIndex];
  if(counter) counter.textContent=`${lightboxIndex+1} / ${lightboxImages.length}`;
  const prev=$('#imageLightboxPrev'), next=$('#imageLightboxNext');
  if(prev) prev.disabled=lightboxImages.length<2;
  if(next) next.disabled=lightboxImages.length<2;
}
function closeLightbox(){
  const modal=$('#imageLightbox'); if(!modal) return;
  modal.classList.add('hidden'); document.body.classList.remove('lightbox-open');
  const image=$('#imageLightboxImg'); if(image) image.removeAttribute('src');
}
function moveLightbox(step){
  if(lightboxImages.length<2) return;
  lightboxIndex=(lightboxIndex+step+lightboxImages.length)%lightboxImages.length;
  renderLightbox();
}

/* ---------- detaliu anunț ---------- */
function waLink(phone){
  let d = String(phone).replace(/[^\d]/g,'');
  if(d.startsWith('00')) d = d.slice(2); else if(d.startsWith('0')) d = '40'+d.slice(1);
  return 'https://wa.me/'+d;
}
function contactHtml(phones, who){
  if(!phones || !phones.length) return `<p class="muted">${who} nu a afișat un număr de telefon.</p>`;
  return phones.map(p=>`<div class="contact-row"><a class="btn primary" href="tel:${esc(String(p.phone).replace(/[^\d+]/g,''))}">📞 ${esc(p.phone)}</a>${p.is_whatsapp?`<a class="btn wa" target="_blank" rel="noopener noreferrer" href="${esc(waLink(p.phone))}">WhatsApp</a>`:''}</div>`).join('');
}
function detailHtml(x, phones, canContact){
  const fav = favorites.includes(x.id);
  const rows = [['Stare',x.condition],['Categorie',x.category],['Marcă',x.make],['Model',x.model],['An',x.year],['Generație',x.generation],['Motor',x.engine],['Cod OEM',x.oem],['Județ',x.county],['Livrare',x.delivery?'Da':'Nu'],['Vânzător',x.seller_name],['Tip vânzător',x.seller_type],['Publicat',fmtDate(x.created_at)]].filter(r=>r[1]);
  const galleryImages = Array.isArray(x.images) ? x.images.filter(Boolean) : [];
  const gallery = galleryImages.length ? `<div class="detail-gallery">${galleryImages.map((src,i)=>`<button type="button" class="detail-gallery-item" data-lightbox-src="${esc(src)}" data-lightbox-alt="${esc(x.title)}" data-lightbox-index="${i}" aria-label="Vezi poza ${i+1} mai mare"><img src="${esc(src)}" alt="${esc(x.title)} - poza ${i+1}" loading="lazy"></button>`).join('')}</div>` : '';
  return `<div class="detail-top"><span class="badge">${x.type==='dezmembrari'?'Dezmembrări':'Piesă auto'}</span>${x.condition?`<span class="badge ${x.condition==='Nouă'?'new':''}">${esc(x.condition)}</span>`:''}</div>
  ${gallery}
  <h2>${esc(x.title)}</h2>
  <div class="detail-price">${money(x.price)}${x.negotiable&&Number(x.price)>0?' <small class="muted">· negociabil</small>':''}</div>
  <dl class="detail-grid">${rows.map(r=>`<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>
  ${x.description?`<p class="detail-desc">${esc(x.description)}</p>`:''}
  ${canContact?`<div class="contact-box"><b>Contactează vânzătorul</b>${contactHtml(phones,'Vânzătorul')}</div>`:'<p class="muted">Anunțul este în moderare și nu este încă vizibil public.</p>'}
  <div class="contact-row">
    <button class="btn ghost small" data-fav="${x.id}" aria-label="Favorite">${fav?'♥':'♡'} Favorit</button>
    ${canContact?`<button class="btn ghost small" data-copy-link="${x.id}">Copiază linkul</button><button class="btn ghost small" data-show-report="1">Raportează anunțul</button>`:''}
  </div>
  <div class="report-box hidden" id="reportBox"><b>Raportează anunțul</b>
    <select id="reportReason">${REPORT_REASONS.map(r=>`<option>${esc(r)}</option>`).join('')}</select>
    <textarea id="reportDetails" rows="3" maxlength="2000" placeholder="Detalii (opțional)"></textarea>
    <button class="btn danger small" data-send-report="${x.id}">Trimite raportarea</button><p class="form-note" id="reportMsg"></p></div>`;
}
async function openDetail(id){
  const modal = $('#detailModal'), box = $('#detailContent');
  box.innerHTML = '<p class="muted">Se încarcă…</p>'; modal.classList.remove('hidden');
  try{
    const r = await api('/api/listings/'+id);
    box.innerHTML = detailHtml(r.listing, r.phones, true);
  }catch(e){
    const own = state.loaded.find(x=>x.id===id);
    if(own && e.status===404) box.innerHTML = detailHtml(own, [], false);
    else box.innerHTML = `<p>${esc(e.message)}</p>`;
  }
}
async function sendReport(id){
  if(!currentUser){ openAuth(null); return; }
  const msg = $('#reportMsg');
  try{
    await api('/api/reports',{method:'POST',body:JSON.stringify({listing_id:id,reason:$('#reportReason').value,details:$('#reportDetails').value})});
    setMsg(msg,'Mulțumim! Raportarea a fost trimisă către administratori.','ok');
  }catch(e){ setMsg(msg,e.message,'error'); }
}
async function copyLink(id){
  const x = $('#detailContent h2'); const url = `${location.origin}/piese/${id}-${slug(x?x.textContent:'')}`;
  try{ await navigator.clipboard.writeText(url); toast('Linkul a fost copiat.'); }catch{ toast(url); }
}

/* ---------- dezmembrări, cereri, magazine ---------- */
async function loadDism(){
  const grid = $('#dismGrid'); $('#dismEmpty').classList.add('hidden');
  try{
    const r = await api('/api/listings?type=dezmembrari&limit=40');
    grid.innerHTML = r.listings.map(x=>card(x)).join('');
    $('#dismEmpty').classList.toggle('hidden', r.listings.length>0);
  }catch(e){ grid.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
async function loadRequests(mine){
  const grid = $('#requestGrid'); $('#requestsEmpty').classList.add('hidden');
  $('#requestsTitle').textContent = mine ? 'Cererile mele' : 'Cereri de piese';
  $('#requestsCrumb').textContent = $('#requestsTitle').textContent;
  $('#requestsSub').textContent = mine ? 'Cererile publicate de tine.' : 'Cereri publicate de cumpărători. Ai piesa? Contactează-l.';
  grid.innerHTML = '<p class="muted">Se încarcă…</p>';
  try{
    const r = await api(mine ? '/api/requests/mine' : '/api/requests');
    grid.innerHTML = r.requests.map(x=>`<article class="info-card" data-request="${x.id}">
      <b>${esc([x.make,x.model,x.year].filter(Boolean).join(' · ')||'Orice mașină')}</b><h3>${esc(x.title)}</h3>
      ${x.description?`<p>${esc(x.description.slice(0,160))}${x.description.length>160?'…':''}</p>`:''}
      <p class="muted">${esc(mine ? (x.status==='open'?'Deschisă':x.status) : (x.user_name||'Cumpărător'))} · ${fmtDate(x.created_at)}</p>
      <div class="contact-slot">${mine?`<button class="btn danger small" data-del-request="${x.id}">Șterge</button>`:`<button class="btn ghost small" data-req-contact="${x.id}">Contactează</button>`}</div></article>`).join('');
    $('#requestsEmpty').classList.toggle('hidden', r.requests.length>0);
  }catch(e){ grid.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
async function requestContact(id, btn){
  if(!currentUser){ openAuth('requests'); return; }
  const r = await api(`/api/requests/${id}/contact`);
  btn.closest('.contact-slot').innerHTML = contactHtml(r.phones,'Cumpărătorul');
}
async function loadStores(parks){
  const grid = $('#storesGrid'); $('#storesEmpty').classList.add('hidden');
  const title = parks ? 'Parcuri de dezmembrări auto' : 'Magazine de piese auto';
  $('#storesTitle').textContent = title; $('#storesCrumb').textContent = title;
  grid.innerHTML = '<p class="muted">Se încarcă…</p>';
  try{
    let list = (await api('/api/sellers')).sellers || [];
    if(parks) list = list.filter(s=>s.dism);
    grid.innerHTML = list.map(s=>`<article class="info-card"><span class="badge">${s.dism?'DEZMEMBRĂRI':'VÂNZĂTOR'}</span><h3>${esc(s.name)}</h3><p>${s.n} ${s.n===1?'anunț':'anunțuri'}${s.county?' · '+esc(s.county):''}</p><button class="btn ghost small" data-seller="${s.id}" data-sname="${esc(s.name)}">Vezi anunțurile</button></article>`).join('');
    $('#storesEmpty').classList.toggle('hidden', list.length>0);
  }catch(e){ grid.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

/* ---------- căutări salvate ---------- */
function getSaved(){
  return readJSON('autopiese_saved_searches',[]).map(s=>typeof s==='string'?{label:s,qs:'q='+encodeURIComponent(s)}:s).filter(s=>s&&s.qs!==undefined);
}
function saveCurrentSearch(){
  const p = filtersToParams(); p.delete('mode');
  const label = [state.filters.q, state.filters.category, state.filters.make, state.filters.model, state.filters.county].filter(Boolean).join(' · ');
  if(!label){ toast('Scrie întâi ce piesă cauți sau alege un filtru.'); return; }
  const saved = getSaved().filter(s=>s.qs!==p.toString());
  saved.unshift({label, qs:p.toString()});
  writeJSON('autopiese_saved_searches', saved.slice(0,20));
  toast('Căutarea a fost salvată.');
}
function renderSaved(){
  const list = getSaved();
  $('#savedList').innerHTML = list.length ? list.map((s,i)=>`<div class="saved-row"><button class="link" data-saved-open="${i}">${esc(s.label)}</button><button class="btn danger small" data-saved-del="${i}">Șterge</button></div>`).join('') : '<div class="saved-row muted">Nu ai căutări salvate.</div>';
}

/* ---------- autentificare ---------- */
function openAuth(next){
  window.__afterAuth = next || null;
  $('#loginForm').classList.remove('hidden'); $('#registerForm').classList.add('hidden');
  $('#authTitle').textContent = 'Intră în cont';
  setMsg($('#loginMessage'),''); $('#authModal').classList.remove('hidden');
  setTimeout(()=>$('#loginIdentifier').focus(),0);
}
function closeModal(modal){
  modal.classList.add('hidden');
  if(modal.id==='authModal' && window.__afterAuth){
    window.__afterAuth = null;
    const { name, params } = parseHash();
    if(needsAuth(name, params) && !currentUser){ history.replaceState(null,'','#/'); route(); }
  }
}
async function afterLogin(user, msg){
  currentUser = user; renderHeader(); $('#authModal').classList.add('hidden');
  toast(msg); syncFavorites();
  const next = window.__afterAuth; window.__afterAuth = null;
  if(next) navigate(next);
}
async function login(e){
  e.preventDefault(); const msg = $('#loginMessage'); setMsg(msg,'');
  try{
    const r = await api('/api/auth/login',{method:'POST',body:JSON.stringify({identifier:$('#loginIdentifier').value,password:$('#loginPassword').value,remember:$('#rememberLogin').checked})});
    $('#loginPassword').value = ''; await afterLogin(r.user,'Te-ai autentificat.');
  }catch(err){ setMsg(msg,err.message,'error'); }
}
async function register(e){
  e.preventDefault(); const msg = $('#registerMessage'); setMsg(msg,'');
  if($('#regPassword').value!==$('#regPassword2').value){ setMsg(msg,'Parolele nu coincid.','error'); return; }
  try{
    const r = await api('/api/auth/register',{method:'POST',body:JSON.stringify({name:$('#regName').value.trim(),nickname:$('#regNickname').value.trim(),email:$('#regEmail').value.trim(),phone:$('#regPhone').value.trim(),password:$('#regPassword').value,remember:$('#rememberRegister').checked})});
    $('#regPassword').value = $('#regPassword2').value = ''; await afterLogin(r.user,'Cont creat.');
  }catch(err){ setMsg(msg,err.message,'error'); }
}
function startRegister(){
  $('#loginForm').classList.add('hidden'); $('#registerForm').classList.remove('hidden');
  $('#registerStep1').classList.remove('hidden'); $('#registerStep2').classList.add('hidden');
  $('#authTitle').textContent = 'Creează cont'; setMsg($('#registerMessage'),'');
}
function registerStep1(){
  const e = $('#regEmail'); if(!e.reportValidity()) return;
  $('#registerStep1').classList.add('hidden'); $('#registerStep2').classList.remove('hidden'); $('#regNickname').focus();
}
async function logout(){
  try{ await api('/api/auth/logout',{method:'POST'}); }catch{}
  currentUser = null; renderHeader(); navigate('home'); toast('Ai ieșit din cont.');
}
async function logoutAll(){
  if(!confirm('Te deconectezi de pe toate dispozitivele?')) return;
  await api('/api/auth/logout-all',{method:'POST'});
  currentUser = null; renderHeader(); navigate('home'); toast('Ai fost deconectat de peste tot.');
}
async function forgotPassword(e){
  e.preventDefault(); const msg = $('#forgotMessage'); setMsg(msg,'');
  try{ const r = await api('/api/auth/forgot-password',{method:'POST',body:JSON.stringify({email:$('#forgotEmail').value})}); setMsg(msg,r.message||'Verifică emailul.','ok'); }
  catch(err){ setMsg(msg,err.message,'error'); }
}
async function resetPasswordSubmit(e){
  e.preventDefault(); const msg = $('#resetMessage'); setMsg(msg,'');
  const token = parseHash().params.get('token');
  const p1 = $('#resetPassword').value;
  if(!token){ setMsg(msg,'Link invalid.','error'); return; }
  if(p1.length<8){ setMsg(msg,'Parola trebuie să aibă minimum 8 caractere.','error'); return; }
  if(p1!==$('#resetPassword2').value){ setMsg(msg,'Parolele nu coincid.','error'); return; }
  try{
    await api('/api/auth/reset-password',{method:'POST',body:JSON.stringify({token,password:p1})});
    currentUser = null; renderHeader(); e.target.reset();
    setMsg(msg,'Parola a fost schimbată. Te poți autentifica.','ok');
    setTimeout(()=>{ history.replaceState(null,'','#/'); route(); openAuth(null); },1200);
  }catch(err){ setMsg(msg,err.message,'error'); }
}

/* ---------- poze anunt ---------- */
function renderSellImages(){
  const box=$('#sellImagePreview'), count=$('#sellImageCount');
  if(!box||!count)return;
  box.innerHTML=state.sellImages.map((src,i)=>`<div class="sell-image-item"><img src="${src}" alt="Poza ${i+1}"><button type="button" class="sell-image-remove" data-remove-sell-image="${i}" aria-label="Șterge poza">×</button></div>`).join('');
  count.textContent=state.sellImages.length?`${state.sellImages.length}/8 poze selectate`:'';
}
function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{
    if(!/^image\/(jpeg|png|webp)$/.test(file.type))return reject(new Error('Sunt acceptate doar JPG, PNG sau WebP.'));
    if(file.size>12*1024*1024)return reject(new Error('O poză poate avea maximum 12 MB.'));
    const reader=new FileReader(); reader.onload=()=>{
      const img=new Image(); img.onload=()=>{
        const max=1600, scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
        const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(img.naturalWidth*scale)); c.height=Math.max(1,Math.round(img.naturalHeight*scale));
        const ctx=c.getContext('2d'); ctx.drawImage(img,0,0,c.width,c.height);
        let q=.82, out=c.toDataURL('image/jpeg',q);
        while(out.length>650000 && q>.45){q-=.07; out=c.toDataURL('image/jpeg',q);}
        if(out.length>700000)return reject(new Error('Poza este prea mare după comprimare.'));
        resolve(out);
      }; img.onerror=()=>reject(new Error('Poza nu a putut fi citită.')); img.src=reader.result;
    }; reader.onerror=()=>reject(new Error('Poza nu a putut fi încărcată.')); reader.readAsDataURL(file);
  });
}
async function handleSellImages(e){
  const files=[...e.target.files];
  if(state.sellImages.length+files.length>8){toast('Poți adăuga maximum 8 poze.'); e.target.value=''; return;}
  for(const file of files){try{state.sellImages.push(await fileToDataUrl(file));}catch(err){toast(err.message);}}
  e.target.value=''; renderSellImages();
}

/* ---------- formulare ---------- */
async function submitRequest(e){
  e.preventDefault(); const msg = $('#requestMessage'); setMsg(msg,'');
  const year = $('#reqYear').value.trim();
  if(year && !/^\d{4}$/.test(year)){ setMsg(msg,'Anul trebuie să aibă 4 cifre.','error'); return; }
  try{
    await api('/api/requests',{method:'POST',body:JSON.stringify({title:$('#reqTitle').value.trim(),make:$('#reqMake').value,model:$('#reqModel').value,year,description:$('#reqDescription').value})});
    e.target.reset(); await loadModels('','reqModel');
    setMsg(msg,'Cererea a fost trimisă. O găsești în Cererile mele.','ok');
  }catch(err){ setMsg(msg,err.message,'error'); }
}
async function submitSell(e){
  e.preventDefault(); const msg = $('#sellMessage'); setMsg(msg,'');
  const year = $('#sellYear')?.value.trim() || '', type = $('#sellType').value;
  if(year && !/^\d{4}$/.test(year)){ setMsg(msg,'Anul trebuie să aibă 4 cifre.','error'); return; }
  try{
    await api('/api/listings',{method:'POST',body:JSON.stringify({type,title:$('#sellTitle').value.trim(),price:$('#sellPrice').value||0,condition:type==='dezmembrari'?'Second-hand':$('#sellCondition').value,category:$('#sellCategory').value,seller_type:$('#sellSellerType').value,make:$('#sellMake').value,model:$('#sellModel').value,year,oem:$('#sellOem').value.trim(),county:$('#sellCounty').value,description:$('#sellDescription').value,delivery:$('#sellDelivery').checked,negotiable:$('#sellNegotiable').checked,images:state.sellImages})});
    e.target.reset(); state.sellImages=[]; renderSellImages(); $('#sellDelivery').checked = true; await loadModels('','sellModel'); $('#sellConditionWrap').classList.remove('hidden');
    setMsg(msg,'Anunțul a fost trimis pentru verificare. Îl vezi în Anunțurile mele.','ok');
  }catch(err){ setMsg(msg,err.message,'error'); }
}

/* ---------- setări cont ---------- */
async function loadSettings(){
  const r = await api('/api/account/settings');
  state.phones = r.phones;
  $('#settingsName').value = r.user.name || ''; $('#settingsNickname').value = r.user.nickname || '';
  $('#settingsCurrentEmail').textContent = `Email actual: ${r.user.email}${r.user.email_verified?' ✓ verificat':''}`;
  $('#showPhoneToggle').checked = !!r.user.show_phone;
  $('#phoneList').innerHTML = r.phones.map(p=>`<div class="phone-row"><span>${esc(p.phone)}${p.is_whatsapp?' · WhatsApp':''}</span><span><button type="button" class="text-btn" data-wa-phone="${p.id}">${p.is_whatsapp?'Scoate WhatsApp':'Marchează WhatsApp'}</button> <button type="button" class="text-btn danger-text" data-del-phone="${p.id}">Șterge</button></span></div>`).join('') || '<p class="form-note">Nu ai numere adăugate.</p>';
  $('#phoneAddForm').classList.toggle('hidden', r.phones.length>=4);
}
async function saveProfile(e){
  e.preventDefault(); const msg = $('#profileSettingsMsg'); setMsg(msg,'');
  try{
    const r = await api('/api/account/profile',{method:'PATCH',body:JSON.stringify({name:$('#settingsName').value.trim(),nickname:$('#settingsNickname').value.trim()})});
    currentUser = {...currentUser, ...r.user}; renderHeader(); setMsg(msg,'Datele au fost salvate.','ok');
  }catch(err){ setMsg(msg,err.message,'error'); }
}
async function requestEmailChange(e){
  e.preventDefault(); const msg = $('#emailChangeMsg'); setMsg(msg,'');
  try{ const r = await api('/api/account/email-change',{method:'POST',body:JSON.stringify({email:$('#settingsNewEmail').value})}); setMsg(msg,r.message,'ok'); }
  catch(err){ setMsg(msg,err.message,'error'); }
}
async function addPhone(e){
  e.preventDefault(); const msg = $('#phoneMsg'); setMsg(msg,'');
  try{
    await api('/api/account/phones',{method:'POST',body:JSON.stringify({phone:$('#newPhone').value,is_whatsapp:$('#newPhoneWhatsApp').checked})});
    $('#newPhone').value=''; $('#newPhoneWhatsApp').checked=false; await loadSettings(); setMsg(msg,'Numărul a fost adăugat.','ok');
  }catch(err){ setMsg(msg,err.message,'error'); }
}
async function togglePrivacy(){
  const msg = $('#privacyMsg'), want = $('#showPhoneToggle').checked;
  try{
    const r = await api('/api/account/privacy',{method:'PATCH',body:JSON.stringify({show_phone:want})});
    currentUser.show_phone = r.show_phone;
    setMsg(msg, r.show_phone ? 'Telefonul va fi vizibil în anunțurile tale.' : 'Telefonul nu mai este afișat public.','ok');
  }catch(err){ $('#showPhoneToggle').checked = !want; setMsg(msg,err.message,'error'); }
}
async function confirmEmailChange(params){
  const token = params.get('token'), el = $('#verifyEmailChangeMsg');
  if(!token){ el.textContent='Link invalid.'; return; }
  try{ const r = await api('/api/account/email-change/confirm',{method:'POST',body:JSON.stringify({token})}); currentUser=null; renderHeader(); el.textContent=r.message; }
  catch(e){ el.textContent=e.message; }
}

/* ---------- administrare ---------- */
let adminTab = 'dashboard', adminData = null;
async function loadAdmin(){
  if(!currentUser || currentUser.role!=='admin'){ navigate('home'); toast('Zona de administrare este disponibilă doar administratorului.'); return; }
  try{
    const [ov,lu,ll,lr,lp,la] = await Promise.all([api('/api/admin/overview'),api('/api/admin/users'),api('/api/admin/listings'),api('/api/admin/requests'),api('/api/admin/reports'),api('/api/admin/activity')]);
    adminData = {s:ov.stats,users:lu.users,listings:ll.listings,requests:lr.requests,reports:lp.reports,activity:la.activity};
    renderAdmin();
  }catch(e){ $('#adminContent').innerHTML = `<p>${esc(e.message)}</p>`; }
}
function adminBtns(kind, id, items){ return items.map(([label,status])=>`<button class="btn ghost small" data-admin="${kind}" data-id="${id}" data-status="${status}">${label}</button>`).join(''); }
function renderAdmin(){
  const d = adminData, s = d.s;
  const tabs = [['dashboard','Dashboard'],['listings',`Anunțuri${s.pending?` (${s.pending})`:''}`],['users','Utilizatori'],['requests','Cereri piese'],['reports',`Raportări${s.reports?` (${s.reports})`:''}`],['activity','Activitate']];
  let body = '';
  if(adminTab==='dashboard') body = `<div class="stat-grid"><div class="stat"><b>Utilizatori</b><h3>${s.users}</h3><small>${s.activeUsers} activi</small></div><div class="stat"><b>Anunțuri</b><h3>${s.listings}</h3><small>${s.approved} aprobate · ${s.pending} în așteptare · ${s.rejected} respinse</small></div><div class="stat"><b>Raportări deschise</b><h3>${s.reports}</h3></div><div class="stat"><b>Cereri deschise</b><h3>${s.requests}</h3></div></div>`;
  if(adminTab==='listings') body = `<div class="admin-list">${d.listings.map(x=>{const st=STATUS_LABEL[x.status]||[x.status,''];return `<article class="info-card"><b>#${x.id} · ${esc(x.title)}</b> <span class="badge ${st[1]}">${esc(st[0])}</span><p>${money(x.price)} · ${esc(x.type)} · ${esc(x.county||'—')} · ${fmtDate(x.created_at)}</p><p>${esc(x.seller_name||'Fără vânzător')} · ${esc(x.seller_email||'')}</p>${x.description?`<p>${esc(x.description.slice(0,200))}</p>`:''}<div class="admin-actions">${adminBtns('listing',x.id,[['Aprobă','approved'],['Respinge','rejected'],['Blochează','blocked']])}<button class="btn danger small" data-admin="listing-del" data-id="${x.id}">Șterge</button></div></article>`;}).join('')||'<p>Nu există anunțuri.</p>'}</div>`;
  if(adminTab==='users') body = `<div class="admin-list">${d.users.map(x=>`<article class="info-card"><b>#${x.id} · ${esc(x.name||'—')}</b><p>${esc(x.email)} · ${esc(x.role)} · ${esc(x.status)}</p><div class="admin-actions">${adminBtns('user',x.id,[['Activează','active'],['Blochează','blocked']])}</div></article>`).join('')||'<p>Nu există utilizatori.</p>'}</div>`;
  if(adminTab==='requests') body = `<div class="admin-list">${d.requests.map(x=>`<article class="info-card"><b>#${x.id} · ${esc(x.title)}</b><p>${esc(x.user_name||'—')} · ${esc(x.status)}</p><div class="admin-actions">${adminBtns('request',x.id,[['Deschisă','open'],['Potrivită','matched'],['Închisă','closed']])}</div></article>`).join('')||'<p>Nu există cereri.</p>'}</div>`;
  if(adminTab==='reports') body = `<div class="admin-list">${d.reports.map(x=>`<article class="info-card"><b>#${x.id} · ${esc(x.reason)}</b><p>${esc(x.listing_title||'Anunț')} · ${esc(x.reporter_name||'—')} · ${esc(x.status)}</p>${x.details?`<p>${esc(x.details)}</p>`:''}<div class="admin-actions">${adminBtns('report',x.id,[['Marchează verificată','reviewed'],['Închide','closed']])}</div></article>`).join('')||'<p>Nu există raportări.</p>'}</div>`;
  if(adminTab==='activity') body = `<div class="admin-list">${d.activity.map(x=>`<article class="info-card"><b>${esc(x.action)}</b><p>${esc(x.admin_name||'Admin')} · ${new Date(x.created_at).toLocaleString('ro-RO')}</p><small>${esc(x.target_type||'')} #${x.target_id||''} · ${esc(x.details||'')}</small></article>`).join('')||'<p>Nu există activitate.</p>'}</div>`;
  $('#adminContent').innerHTML = `<div class="admin-tabs">${tabs.map(([k,l])=>`<button class="btn ghost ${k===adminTab?'active':''}" data-admin-tab="${k}">${l}</button>`).join('')}</div>${body}`;
}
async function adminAction(el){
  const {admin:kind,id,status} = el.dataset;
  if(kind==='listing') await api(`/api/admin/listings/${id}`,{method:'PATCH',body:JSON.stringify({status})});
  else if(kind==='listing-del'){ if(!confirm('Ștergi definitiv anunțul?')) return; await api(`/api/admin/listings/${id}`,{method:'DELETE'}); }
  else if(kind==='user') await api(`/api/admin/users/${id}`,{method:'PATCH',body:JSON.stringify({status})});
  else if(kind==='request') await api(`/api/admin/requests/${id}`,{method:'PATCH',body:JSON.stringify({status})});
  else if(kind==='report') await api(`/api/admin/reports/${id}`,{method:'PATCH',body:JSON.stringify({status})});
  await loadAdmin();
}

/* ---------- acțiuni UI ---------- */
function doAction(a){
  if(a==='account') currentUser ? navigate('cont') : openAuth('cont');
  else if(a==='request') navigate('cerere');
  else if(a==='sell') navigate('vinde');
  else if(a==='requests') navigate('requests');
  else if(a==='parks') navigate('stores?t=parks');
  else if(a==='stores') navigate('stores');
  else if(a==='dism') navigate('dezmembrari');
  else if(a==='services') navigate('servicii');
  else if(a==='match') navigate('match');
  else if(a==='admin') navigate('admin');
  else if(a==='cart') navigate('account-tool?view=cart');
  else if(a==='rezultate') navigate('rezultate');
}
function accountAction(a){
  if(a==='settings') navigate('settings');
  else if(a==='listings') navigate('rezultate?mode=mine');
  else if(a==='favorites') navigate('rezultate?mode=fav');
  else if(a==='requests') navigate('requests?t=mine');
  else if(a==='saved') navigate('saved');
  else if(['offers','orders-seller','offers-received','orders','messages','notifications','credits','transactions','invoices'].includes(a)) navigate('account-tool?view='+encodeURIComponent(a));
}

document.addEventListener('click', e=>{
  const t = e.target;
  if(t.classList && t.classList.contains('modal')){ closeModal(t); return; }
  let el;
  if((el=t.closest('[data-fav]'))){ e.stopPropagation(); toggleFavorite(Number(el.dataset.fav)); return; }
  if((el=t.closest('[data-del-listing]'))){ e.stopPropagation(); const id=Number(el.dataset.delListing); if(confirm('Ștergi acest anunț?')) safe(async()=>{ await api('/api/listings/'+id,{method:'DELETE'}); state.loaded=state.loaded.filter(x=>x.id!==id); state.total=state.loaded.length; renderList(); toast('Anunțul a fost șters.'); })(); return; }
  if((el=t.closest('[data-del-request]'))){ const id=el.dataset.delRequest; if(confirm('Ștergi această cerere?')) safe(async()=>{ await api('/api/requests/'+id,{method:'DELETE'}); loadRequests(true); })(); return; }
  if((el=t.closest('[data-req-contact]'))){ safe(requestContact)(el.dataset.reqContact, el); return; }
  if((el=t.closest('[data-seller]'))){ openSearch({seller_id:el.dataset.seller, sname:el.dataset.sname}); return; }
  if((el=t.closest('[data-cat]'))){ openSearch({category:el.dataset.cat}); return; }
  if((el=t.closest('[data-search-dism]'))){ openSearch({q:el.dataset.searchDism}); return; }
  if((el=t.closest('[data-saved-open]'))){ const s=getSaved()[Number(el.dataset.savedOpen)]; if(s) navigate('rezultate?'+s.qs); return; }
  if((el=t.closest('[data-saved-del]'))){ const list=getSaved(); list.splice(Number(el.dataset.savedDel),1); writeJSON('autopiese_saved_searches',list); renderSaved(); return; }
  if((el=t.closest('[data-lightbox-src]'))){
    const src=el.dataset.lightboxSrc;
    let images=[src], index=0;
    const gallery=el.closest('.detail-gallery');
    if(gallery){ images=$$('.detail-gallery-item', gallery).map(b=>b.dataset.lightboxSrc).filter(Boolean); index=Math.max(0, Number(el.dataset.lightboxIndex)||0); }
    openLightbox(src, images, index, el.dataset.lightboxAlt||'Poza anunțului');
    return;
  }
  if((el=t.closest('[data-image-close]'))){ closeLightbox(); return; }
  if((el=t.closest('[data-image-prev]'))){ moveLightbox(-1); return; }
  if((el=t.closest('[data-image-next]'))){ moveLightbox(1); return; }
  if((el=t.closest('[data-copy-link]'))){ copyLink(Number(el.dataset.copyLink)); return; }
  if((el=t.closest('[data-show-report]'))){ $('#reportBox').classList.toggle('hidden'); return; }
  if((el=t.closest('[data-send-report]'))){ safe(sendReport)(Number(el.dataset.sendReport)); return; }
  if((el=t.closest('[data-wa-phone]'))){ const id=Number(el.dataset.waPhone); const row=(state.phones||[]).find(p=>p.id===id); if(row) safe(async()=>{ await api('/api/account/phones/'+id,{method:'PATCH',body:JSON.stringify({is_whatsapp:!row.is_whatsapp})}); await loadSettings(); })(); return; }
  if((el=t.closest('[data-del-phone]'))){ const id=el.dataset.delPhone; if(confirm('Ștergi acest număr?')) safe(async()=>{ await api('/api/account/phones/'+id,{method:'DELETE'}); await loadSettings(); })(); return; }
  if((el=t.closest('[data-admin-tab]'))){ adminTab=el.dataset.adminTab; renderAdmin(); return; }
  if((el=t.closest('[data-admin]'))){ safe(adminAction)(el); return; }
  if((el=t.closest('[data-action]'))){ doAction(el.dataset.action); return; }
  if((el=t.closest('[data-account]'))){ accountAction(el.dataset.account); return; }
  if((el=t.closest('[data-go]'))){ navigate(el.dataset.go); return; }
  if((el=t.closest('[data-legal]'))){ navigate(el.dataset.legal); return; }
  if((el=t.closest('[data-back]'))){ if(history.length>1) history.back(); else navigate('home'); return; }
  if((el=t.closest('[data-close]'))){ closeModal(el.closest('.modal')); return; }
  if((el=t.closest('[data-password-toggle]'))){
    const input = document.getElementById(el.dataset.passwordToggle); if(!input) return;
    const show = input.type==='password'; input.type = show?'text':'password';
    el.textContent = show?'◌':'◉'; el.setAttribute('aria-label', show?'Ascunde parola':'Arată parola'); return;
  }
  if((el=t.closest('[data-open]'))){ openDetail(Number(el.dataset.open)); return; }
});
document.addEventListener('click', e=>{ const b=e.target.closest('[data-remove-sell-image]'); if(b){ state.sellImages.splice(Number(b.dataset.removeSellImage),1); renderSellImages(); } });
document.addEventListener('keydown', e=>{
  if(!$('#imageLightbox')?.classList.contains('hidden')){
    if(e.key==='Escape'){ e.preventDefault(); closeLightbox(); return; }
    if(e.key==='ArrowLeft'){ e.preventDefault(); moveLightbox(-1); return; }
    if(e.key==='ArrowRight'){ e.preventDefault(); moveLightbox(1); return; }
  }
  if(e.key==='Escape'){ const m=$$('.modal').find(x=>!x.classList.contains('hidden')); if(m) closeModal(m); }
  if((e.key==='Enter'||e.key===' ') && e.target.matches && e.target.matches('.listing[data-open]')){ e.preventDefault(); openDetail(Number(e.target.dataset.open)); }
});

function getRecentSearches(){ return readJSON('autopiese_recent_searches',[]).filter(x=>typeof x==='string'&&x.trim()).slice(0,10); }
function saveRecentSearch(q){
  q=String(q||'').trim(); if(!q) return;
  const arr=getRecentSearches().filter(x=>x.toLowerCase()!==q.toLowerCase());
  arr.unshift(q); writeJSON('autopiese_recent_searches',arr.slice(0,10));
}
function renderRecentSearches(){
  const box=$('#recentSearchList'); if(!box) return;
  const arr=getRecentSearches();
  box.innerHTML=arr.length ? arr.map(q=>`<button type="button" class="recent-search-item" data-recent-search="${esc(q)}"><span>⌕</span><b>${esc(q)}</b><i>↖</i></button>`).join('') : '<p class="recent-empty">Nu ai căutări recente.</p>';
}
function openSearchOverlay(value=''){
  const ov=$('#searchOverlay'), input=$('#searchOverlayInput'); if(!ov||!input) return;
  input.value=value||$('#topSearchInput').value.trim()||state.filters.q||'';
  ov.classList.remove('hidden'); ov.setAttribute('aria-hidden','false'); document.body.classList.add('search-open');
  renderRecentSearches(); setTimeout(()=>input.focus(),20);
}
function closeSearchOverlay(){
  const ov=$('#searchOverlay'); if(!ov) return;
  ov.classList.add('hidden'); ov.setAttribute('aria-hidden','true'); document.body.classList.remove('search-open');
}
function submitSearchQuery(q){
  q=String(q||'').trim();
  if(!q){ toast('Scrie ce piesă cauți.'); return; }
  saveRecentSearch(q); $('#topSearchInput').value=q; closeSearchOverlay(); openSearch({q});
}

function wire(){
  $('#topSearchForm').addEventListener('submit', e=>{ e.preventDefault(); submitSearchQuery($('#topSearchInput').value); });
  $('#topSearchBtn').addEventListener('click', ()=>openSearchOverlay());
  $('#searchOverlayBack').addEventListener('click', closeSearchOverlay);
  $('#searchOverlayForm').addEventListener('submit', e=>{ e.preventDefault(); submitSearchQuery($('#searchOverlayInput').value); });
  $('#clearRecentSearches').addEventListener('click', ()=>{ localStorage.removeItem('autopiese_recent_searches'); renderRecentSearches(); });
  $('#recentSearchList').addEventListener('click', e=>{ const b=e.target.closest('[data-recent-search]'); if(b) submitSearchQuery(b.dataset.recentSearch); });
  $('#homeRequestBtn').addEventListener('click', ()=>doAction('request'));
  $('#homeDismBtn').addEventListener('click', ()=>doAction('dism'));
  $('#cartBtn').addEventListener('click', ()=>doAction('cart'));
  $('#heroSearchForm').addEventListener('submit', e=>{ e.preventDefault(); openSearch({q:$('#searchInput').value.trim()}); });
  $('#resultsSearchForm').addEventListener('submit', e=>{ e.preventDefault(); if(state.mode!=='search') return; onFilterChange(); });
  $('#homeMake').addEventListener('change', e=>loadModels(e.target.value,'homeModel'));
  $('#homeVehicleBtn').addEventListener('click', ()=>{ const make=$('#homeMake').value; if(!make){ toast('Alege marca mașinii.'); return; } openSearch({make, model:$('#homeModel').value}); });
  $('#matchMake').addEventListener('change', e=>loadModels(e.target.value,'matchModel'));
  $('#reqMake').addEventListener('change', e=>loadModels(e.target.value,'reqModel'));
  $('#sellMake').addEventListener('change', e=>loadModels(e.target.value,'sellModel'));
  $('#matchForm').addEventListener('submit', e=>{ e.preventDefault(); const make=$('#matchMake').value, model=$('#matchModel').value, q=[$('#matchEngine').value.trim(),$('#matchPart').value.trim()].filter(Boolean).join(' '); if(!make&&!q){ toast('Alege marca sau scrie piesa căutată.'); return; } openSearch({q,make,model}); });
  $('#sellType').addEventListener('change', e=>$('#sellConditionWrap').classList.toggle('hidden', e.target.value==='dezmembrari'));
  Object.keys(FILTER_FIELDS).forEach(id=>{ if(id!=='filterMake') $('#'+id).addEventListener('change', onFilterChange); });
  $('#filterMake').addEventListener('change', async e=>{ await loadModels(e.target.value,'filterModel','Toate modelele'); onFilterChange(); });
  $('#withDelivery').addEventListener('change', onFilterChange);
  $('#clearFilters').addEventListener('click', ()=>{ $$('#filters select').forEach(s=>s.value=''); $('#maxPrice').value=''; $('#withDelivery').checked=false; $('#sortListings').value='relevance'; loadModels('','filterModel','Toate modelele').then(onFilterChange); });
  $('#filterToggle').addEventListener('click', ()=>$('#filters').classList.toggle('open'));
  $('#pagination').addEventListener('click', e=>{ const b=e.target.closest('[data-page]'); if(b) safe(()=>goToResultsPage(b.dataset.page))(); });
  $('#saveSearchBtn').addEventListener('click', saveCurrentSearch);
  $('#favoritesBtn').addEventListener('click', ()=>navigate('rezultate?mode=fav'));
  $('#accountBtn').addEventListener('click', ()=>doAction('account'));
  $('#menuBtn').addEventListener('click', ()=>navigate('menu'));
  $('#closeMenu').addEventListener('click', ()=>navigate('home'));
  $('#logoutBtn').addEventListener('click', logout);
  $('#logoutAllBtn').addEventListener('click', safe(logoutAll));
  $('#loginForm').addEventListener('submit', login);
  $('#registerForm').addEventListener('submit', register);
  $('#showRegister').addEventListener('click', startRegister);
  $('#showLogin').addEventListener('click', ()=>{ $('#registerForm').classList.add('hidden'); $('#loginForm').classList.remove('hidden'); $('#authTitle').textContent='Intră în cont'; });
  $('#registerNext').addEventListener('click', registerStep1);
  $('#registerBack').addEventListener('click', ()=>{ $('#registerStep2').classList.add('hidden'); $('#registerStep1').classList.remove('hidden'); $('#regEmail').focus(); });
  $('#forgotPasswordBtn').addEventListener('click', ()=>{ $('#forgotEmail').value=$('#loginIdentifier').value.includes('@')?$('#loginIdentifier').value:''; setMsg($('#forgotMessage'),''); $('#forgotModal').classList.remove('hidden'); });
  $('#forgotForm').addEventListener('submit', forgotPassword);
  $('#resetPasswordForm').addEventListener('submit', resetPasswordSubmit);
  $('#requestForm').addEventListener('submit', submitRequest);
  $('#sellForm').addEventListener('submit', submitSell);
  $('#sellImages').addEventListener('change', handleSellImages);
  $('#profileSettingsForm').addEventListener('submit', saveProfile);
  $('#emailChangeForm').addEventListener('submit', requestEmailChange);
  $('#phoneAddForm').addEventListener('submit', addPhone);
  $('#showPhoneToggle').addEventListener('change', togglePrivacy);
  $('#settingsForgotPassword').addEventListener('click', ()=>{ if(currentUser&&currentUser.email){ $('#forgotEmail').value=currentUser.email; setMsg($('#forgotMessage'),''); $('#forgotModal').classList.remove('hidden'); } });
  window.addEventListener('hashchange', route);
}

(async function init(){
  initFormValidation();
  fillStaticSelects();
  wire();
  try{ const r = await api('/api/me'); currentUser = r.user || null; }catch{ currentUser = null; }
  renderHeader();
  syncFavorites();
  route();
  loadCatalog().then(()=>{ if(parseHash().name==='rezultate') applyFiltersToUI(); });
})();
