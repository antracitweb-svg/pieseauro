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
  PREA_MULTE_ANUNTURI:'Ai trimis prea multe anunțuri sau cereri. Încearcă mai târziu.',NOT_FOUND:'Nu am găsit ce cauți.',LIMITA_ANUNTURI:'Ai atins limita de anunțuri active pentru contul gratuit. Șterge sau marchează ca vândute anunțurile vechi ca să poți publica altele.',LINK_INTERZIS:'Nu poți pune linkuri sau adrese de email în anunț. Cumpărătorii te contactează direct prin site.',PRET_NEREALIST:'Prețul pare prea mic. Pune un preț real sau lasă câmpul gol pentru „La cerere”.',VEHICUL_EXISTA:'Există deja un vehicul cu această marcă și acest model.',ADMIN_ONLY:'Doar administratorul are acces.',
  CUI_INVALID:'CIF / CUI invalid (ex: RO12345678 sau 12345678).',IBAN_INVALID:'Codul IBAN nu este valid.',REACTUALIZARE_PREA_DEVREME:'Poți reactualiza un anunț o singură dată la 24 de ore (și doar dacă este publicat).',STATUS_INVALIDE:'Status invalid.',PAROLA_GRESITA:'Parola curentă este greșită.',PAROLA_SLABA:'Parola este prea simplă. Evită parolele comune, doar cifre sau nickname/email în parolă.',SPATIU_POZE_DEPASIT:'Ai depășit spațiul disponibil pentru poze. Șterge poze sau anunțuri vechi.',PRET_INVALID:'Preț invalid.',CERERE_PROPRIE:'Nu poți face ofertă la propria cerere.',OFERTA_NU_MAI_E_DISPONIBILA:'Oferta nu mai este disponibilă.',INTERZIS:'Nu ai voie să faci această acțiune.',PREA_MULTE_OFERTE:'Ai trimis prea multe oferte. Încearcă mai târziu.',POZA_INVALIDA:'Una dintre poze nu este validă (JPG, PNG sau WebP).',POZE_PREA_MARI:'Pozele sunt prea mari în total. Șterge una sau încarcă poze mai mici.',AN_INVALID:'Anul trebuie să fie între 1950 și anul viitor.',OFERTA_EXISTA:'Ai deja o ofertă în așteptare la această cerere.',PREA_MULTE_MESAJE:'Ai trimis prea multe mesaje. Încearcă mai târziu.',MESAJ_INVALID:'Mesajul este gol sau prea lung.',DESTINATAR_INVALID:'Destinatar invalid.',ID_INVALID:'Cerere invalidă.',EROARE_SERVER:'A apărut o eroare pe server.',CANNOT_BLOCK_SELF:'Nu îți poți bloca propriul cont.',DATABASE_NOT_CONFIGURED:'Baza de date nu este configurată pe server.'
};
const CATEGORY_TREE = [
 ['Accesorii auto','🧰',['Covorașe și protecții','Huse scaune','Portbagaje și bare transversale','Cârlige de remorcare','Parasolare','Suporturi telefon','Alte accesorii']],
 ['Accesorii roți','🛞',['Jante aliaj','Jante tablă','Anvelope','Capace roți','Prezoane și piulițe','Distanțiere','Lanțuri de zăpadă','Alte accesorii roți']],
 ['Alimentare combustibil','⛽',['Pompă combustibil','Injectoare','Rampă injecție','Rezervor','Pompă înaltă presiune','Carburator','Corp accelerație','Conducte combustibil','Alte piese alimentare']],
 ['Aprindere','⚡',['Bujii','Bobine de inducție','Distribuitor','Cabluri bujii','Module de aprindere','Bujii incandescente','Alte piese aprindere']],
 ['Cabluri auto','🔌',['Cabluri accelerație','Cabluri ambreiaj','Cabluri frână de mână','Cabluri schimbător','Cabluri pornire','Instalații electrice','Alte cabluri']],
 ['Car audio','🔊',['Radio / Casetofon','Navigații / Multimedia','Boxe','Amplificatoare','Subwoofere','Antene','Alte piese car audio']],
 ['Caroserie','🚗',['Bară față','Bară spate','Aripi','Capote','Portbagaj / Hayon','Uși','Praguri','Oglinzi','Geamuri','Parbriz / Lunetă','Grile / Măști','Elemente de tablă','Alte piese caroserie']],
 ['Climatizare','❄️',['Compresor AC','Condensator','Radiator AC','Radiator încălzire','Ventilator habitaclu','Filtru polen','Panou climatizare','Alte piese climatizare']],
 ['Direcție','🎯',['Casetă direcție','Pompă servodirecție','Bieletă direcție','Capete de bară','Cardan volan','Volan','Rezervor servodirecție','Alte piese direcție']],
 ['Diverse','📦',[]],
 ['Electrică & Electronică Auto','🔋',['Alternator','Electromotor','Baterii','Senzori','Calculatoare / ECU','Relee și siguranțe','Butoane și comenzi','Motorașe ștergătoare','Alte piese electrice']],
 ['Evacuare','💨',['Catalizator','Filtru particule (DPF)','Tobă finală','Tobă intermediară','Colector evacuare','Țeavă evacuare','Sondă lambda','Alte piese evacuare']],
 ['Faruri stopuri lumini','💡',['Faruri','Stopuri','Proiectoare ceață','Lumini de zi','Semnalizări','Becuri','Lămpi interior','Alte lumini']],
 ['Filtre auto','🧴',['Filtru ulei','Filtru aer','Filtru combustibil','Filtru habitaclu','Alte filtre']],
 ['Frâne','🛑',['Discuri frână','Plăcuțe frână','Etrieri','Saboți și tamburi','Pompă frână','Servofrână','Furtunuri frână','ABS / ESP','Frână de mână','Alte piese frâne']],
 ['Instalații GPL','🔥',['Rezervoare GPL','Truse GPL','Injectoare GPL','Reductoare','Electrovalve','Alte piese GPL']],
 ['Interior','💺',['Scaune','Bord','Console centrale','Volan și airbag','Centuri de siguranță','Panouri uși','Mânere','Alte piese interior']],
 ['Motor','⚙️',['Bloc motor','Chiulasă','Pistoane și biele','Arbore cotit','Distribuție','Turbină','Pompă apă / ulei','Radiatoare și răcire','Carter','Suporți motor','Motor complet','Alte piese motor']],
 ['Suspensie','🔩',['Amortizatoare','Arcuri','Brațe suspensie','Bielete','Rulmenți roți','Fuzete','Bucșe','Bară stabilizatoare','Punte spate','Perne de aer','Alte piese suspensie']],
 ['Transmisie','🔧',['Cutie de viteze','Ambreiaj','Volantă','Planetare / Cardan','Diferențial','Cutie transfer','Alte piese transmisie']],
];
const CATEGORIES = CATEGORY_TREE.map(c=>[c[0],c[1]]);
const COUNTIES = ['Alba','Arad','Argeș','Bacău','Bihor','Bistrița-Năsăud','Botoșani','Brăila','Brașov','București','Buzău','Caraș-Severin','Călărași','Cluj','Constanța','Covasna','Dâmbovița','Dolj','Galați','Giurgiu','Gorj','Harghita','Hunedoara','Ialomița','Iași','Ilfov','Maramureș','Mehedinți','Mureș','Neamț','Olt','Prahova','Satu Mare','Sălaj','Sibiu','Suceava','Teleorman','Timiș','Tulcea','Vaslui','Vâlcea','Vrancea'];
const STATUS_LABEL = {pending:['În așteptare','pending'],approved:['Publicat','new'],sold:['Vândut','pending'],rejected:['Respins','bad'],blocked:['Blocat','bad'],deleted:['Șters','bad']};
const REPORT_REASONS = ['Preț înșelător','Piesa nu există / escrocherie','Conținut necorespunzător','Anunț duplicat','Altceva'];
const ROUTES = {home:'page-home',rezultate:'page-results',menu:'page-menu',cont:'page-account',cerere:'page-request-pick','cerere-noua':'page-request',vinde:'page-sell',dezmembrari:'page-dism',servicii:'page-services',admin:'page-admin',match:'page-match',requests:'page-requests',stores:'page-stores',saved:'page-saved','anunturile-mele':'page-mine','account-tool':'page-account-tool',privacy:'page-privacy',cookies:'page-cookies',terms:'page-terms','reset-password':'page-reset-password',settings:'page-settings','verify-email-change':'page-verify-email-change'};
const AUTH_ROUTES = new Set(['cont','cerere','cerere-noua','vinde','settings','admin','anunturile-mele']);
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
let catalogMakes = [];
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
  if(name==='home'){ $('#topSearchInput').value=''; $('#homeSearchInput').value=''; loadHome(); }
  else if(name==='rezultate') enterResults(params);
  else if(name==='cerere') safe(enterCarPick)();
  else if(name==='cerere-noua') safe(enterRequestForm)(params.get('from'));
  else if(name==='vinde') safe(enterSell)(params.get('edit'),params.get('t'));
  else if(name==='dezmembrari') loadDism();
  else if(name==='requests') loadRequests(params.get('t')==='mine');
  else if(name==='stores') loadStores(params.get('t')==='parks');
  else if(name==='saved') renderSaved();
  else if(name==='anunturile-mele') safe(enterMine)();
  else if(name==='cont') renderAccount();
  else if(name==='settings') safe(loadSettings)();
  else if(name==='verify-email-change') safe(confirmEmailChange)(params);
  else if(name==='admin') safe(loadAdmin)();
  else if(name==='menu') renderHeader();
  else if(name==='account-tool') renderAccountTool(params.get('view'), params.get('with'));
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

function renderAccountTool(view, withId){
  const data = {
    cart:{title:'Coșul meu',text:'Coșul este pregătit. Anunțurile adăugate în coș vor apărea aici.',action:'rezultate',label:'Vezi piesele'},
    offers:{title:'Oferte la cereri',text:'Aici vei putea trimite și gestiona ofertele pentru cererile de piese.',action:'requests',label:'Vezi cererile disponibile'},
    'orders-seller':{title:'Comenzi din oferte',text:'Comenzile acceptate din ofertele tale vor apărea aici.',action:null,label:null},
    'offers-received':{title:'Ofertele primite',text:'Ofertele primite la cererile tale vor apărea aici.',action:'requests?t=mine',label:'Vezi cererile mele'},
    orders:{title:'Comenzile mele',text:'Comenzile tale vor apărea aici după ce o ofertă este acceptată.',action:null,label:null},
    messages:{title:'Mesaje',text:'Conversațiile tale cu cumpărători și vânzători.',action:null,label:null},
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
    if(['offers','offers-received','orders','orders-seller','notifications','messages'].includes(view)) safe(()=>loadToolData(view,content,withId))();
  }
}

const OFFER_ST={pending:'În așteptare',accepted:'Acceptată',rejected:'Respinsă'}, ORDER_ST={new:'Nouă'};
async function loadToolData(view, box, withId){
  const money=v=>esc(Number(v).toLocaleString('ro-RO'))+' lei';
  let items=[];
  if(view==='offers'||view==='offers-received'){
    const r=await api(view==='offers'?'/api/offers/mine':'/api/offers/received');
    items=r.offers.map(o=>`<div class="info-card tool-item"><b>${esc(o.request_title)}</b><p>${money(o.price)}${view==='offers-received'&&o.seller_name?' · '+esc(o.seller_name):''} · ${esc(OFFER_ST[o.status]||o.status)} · ${fmtDate(o.created_at)}</p>${o.message?`<p class="muted">${esc(o.message)}</p>`:''}<div class="row">${view==='offers-received'&&o.status==='pending'?`<button class="btn primary small" data-offer-accept="${o.id}">Acceptă oferta</button>`:''}<button class="btn ghost small" data-go="account-tool?view=messages&with=${view==='offers'?o.buyer_id:o.seller_id}">Scrie mesaj</button></div></div>`);
  }else if(view==='orders'||view==='orders-seller'){
    const r=await api('/api/orders'), role=view==='orders'?'buyer':'seller';
    items=r.orders.filter(o=>o.role===role).map(o=>`<div class="info-card tool-item"><b>${esc(o.title||'Comandă')}</b><p>${money(o.price)} · ${esc(ORDER_ST[o.status]||o.status)} · ${fmtDate(o.created_at)}</p></div>`);
  }else if(view==='messages'){
    if(withId){
      const r=await api('/api/messages/'+encodeURIComponent(withId)), nm=esc(r.other.name||'Utilizator');
      box.insertAdjacentHTML('beforeend',`<div class="tool-list"><b>${nm}</b>${r.messages.map(m=>`<div class="info-card tool-item"><p>${esc(m.body)}</p><p class="muted">${m.mine?'Tu':nm} · ${fmtDate(m.created_at)}</p></div>`).join('')||'<p class="muted">Niciun mesaj încă.</p>'}<form class="clean-form" id="msgForm" data-to="${esc(withId)}"><textarea id="msgBody" rows="3" maxlength="2000" placeholder="Scrie un mesaj…" required></textarea><button class="btn primary">Trimite</button></form></div>`);
      return;
    }
    const r=await api('/api/messages');
    items=r.threads.map(t=>`<button type="button" class="info-card tool-item" data-go="account-tool?view=messages&with=${t.other}" style="text-align:left"><b>${esc(t.name||'Utilizator')}${t.unread>0?' ●':''}</b><p>${esc(t.body.slice(0,120))}</p><p class="muted">${fmtDate(t.created_at)}</p></button>`);
  }else if(view==='notifications'){
    const r=await api('/api/notifications');
    items=r.notifications.map(n=>`<div class="info-card tool-item"><p>${n.is_read?'':'● '}${esc(n.text)}</p><p class="muted">${fmtDate(n.created_at)}</p></div>`);
    api('/api/notifications/read',{method:'POST'}).catch(()=>{});
  }
  box.insertAdjacentHTML('beforeend',`<div class="tool-list">${items.join('')||'<p class="muted">Nu există nimic de afișat încă.</p>'}</div>`);
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
  setOptions($('#filterCounty'),'Toate județele',COUNTIES);
  setOptions($('#sellCounty'),'Alege județul',COUNTIES);
  setOptions($('#reqCounty'),'Alege județul',COUNTIES);
  $('#catGrid').innerHTML = CATEGORIES.map(([n,i])=>`<button class="cat" data-cat="${esc(n)}"><span>${i}</span>${esc(n)}</button>`).join('');
}
async function loadCatalog(attempt=0){
  let makes = [];
  try{ makes = ((await api('/api/catalog/makes')).makes||[]).map(x=>x.name); }catch{}
  if(makes.length) catalogMakes = makes;
  if(!makes.length){ if(attempt<3) setTimeout(()=>loadCatalog(attempt+1), 4000*(attempt+1)); else toast('Nu am putut încărca lista de mărci. Reîncarcă pagina.'); return; }
  for(const [id,first] of [['filterMake','Toate mărcile'],['homeMake','Alege marca'],['matchMake','Alege marca'],['sellMake','Alege marca'],['reqMake','Alege marca'],['garageMake','Alege marca']]){
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

const yearsCache = new Map();
async function loadYears(make, model){
  const dl = $('#yearList'); if(!dl) return;
  if(!make || !model){ dl.innerHTML = ''; return; }
  const key = make+'|'+model;
  let years = yearsCache.get(key);
  if(!years){
    try{ years = (await api('/api/catalog/years?make='+encodeURIComponent(make)+'&model='+encodeURIComponent(model))).years||[]; yearsCache.set(key,years); }
    catch{ years = []; }
  }
  dl.innerHTML = years.map(y=>`<option value="${y}"></option>`).join('');
}

/* ---------- carduri ---------- */
function card(x, o={}){
  const fav = favorites.includes(x.id);
  const meta = [x.make,x.model,x.year].filter(Boolean).join(' · ') || (x.category || 'Piesă auto');
  const kmTxt = x.type==='dezmembrari' && x.km!=null ? Number(x.km).toLocaleString('ro-RO')+' km' : '';
  const partChips = x.type==='dezmembrari' && x.parts_avail ? `<div class="part-chips">${String(x.parts_avail).split(',').map(t=>t.trim()).filter(Boolean).slice(0,5).map(t=>`<b>${esc(t)}</b>`).join('')}</div>` : '';
  const st = o.mine ? (STATUS_LABEL[x.status]||['',''] ) : null;
  const firstImage = Array.isArray(x.images) && x.images[0] ? x.images[0] : '';
  const img = firstImage
    ? `<button type="button" class="listing-image-button" data-lightbox-src="${esc(firstImage)}" data-lightbox-alt="${esc(x.title)}" aria-label="Vezi poza mai mare"><img src="${esc(firstImage)}" alt="${esc(x.title)}" loading="lazy"><span class="image-zoom-hint">⌕</span></button>`
    : `<div class="listing-placeholder">${x.type==='dezmembrari'?'🚗':'⚙️'}</div>`;
  return `<article class="listing" data-open="${x.id}" tabindex="0">
    <div class="listing-image">${img}</div>
    <div class="listing-body">
      <div class="listing-top"><h3>${esc(x.title)}</h3>${o.mine?'':`<button class="listing-fav" data-fav="${x.id}" aria-label="Favorite">${fav?'♥':'♡'}</button>`}</div>
      <div class="listing-meta">${esc(meta)}${x.type==='dezmembrari'?(kmTxt?` · ${esc(kmTxt)}`:''):(x.category?` · ${esc(x.category)}`:'')}</div>${partChips}
      ${x.description?`<p class="listing-desc">${esc(x.description)}</p>`:''}
      <div class="listing-bottom">
        <div><div class="listing-price">${money(x.price)}</div><div class="listing-location">${esc(x.county||'România')}${x.delivery?' · Livrare':''}${x.seller_name?` · ${esc(x.seller_name)}`:''}</div></div>
        <div class="listing-actions">
          ${x.condition?`<span class="badge ${x.condition==='Nouă'?'new':''}">${esc(x.condition)}</span>`:''}
          ${st&&st[0]?`<span class="badge ${st[1]}">${st[0]}</span>`:''}
          ${o.mine&&(x.status==='approved'||x.status==='sold')?`<button class="btn ghost small" data-sold-listing="${x.id}" data-to="${x.status==='sold'?'approved':'sold'}">${x.status==='sold'?'Repune la vânzare':'Marchează vândut'}</button>`:''}${o.mine&&x.status!=='blocked'?`<button class="btn ghost small" data-edit-listing="${x.id}">Editează</button>`:''}${o.mine?`<button class="btn danger small" data-del-listing="${x.id}">Șterge</button>`:''}
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
  $$('[data-fav="'+id+'"]').forEach(b=>{ b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); });
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
  if(params.get('g')==='0') state.extra.g='0';
  const g = garageActive();
  if(g && state.mode==='search' && !state.extra.seller_id && !params.get('make') && params.get('g')!=='0'){ state.filters.make = g.make; state.filters.model = g.model; }
  renderGarageBanner();
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
  renderGarageBanner();
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
function fmtPhone(p){
  const raw=String(p||'').trim(); let d=raw.replace(/[^\d+]/g,'');
  if(d.startsWith('+40')) d='0'+d.slice(3); else if(d.startsWith('0040')) d='0'+d.slice(4);
  if(/^0\d{9}$/.test(d)) return d.slice(0,4)+' '+d.slice(4,7)+' '+d.slice(7);
  return raw;
}
function contactHtml(phones, who, sellerId, own){
  const msgBtn = (sellerId && !own) ? `<button type="button" class="btn ghost msg-btn" data-go="account-tool?view=messages&with=${esc(String(sellerId))}">✉️ Trimite mesaj</button>` : '';
  if(!phones || !phones.length) return `<p class="phone-none">📵 ${who} nu a afișat un număr de telefon.</p>${msgBtn}`;
  return phones.map(p=>{
    const tel=String(p.phone).replace(/[^\d+]/g,'');
    return `<div class="phone-card"><div class="phone-num">📞 <span>${esc(fmtPhone(p.phone))}</span>${p.is_whatsapp?'<em class="wa-tag">WhatsApp</em>':''}</div><div class="phone-actions"><a class="btn primary" href="tel:${esc(tel)}">Sună acum</a>${p.is_whatsapp?`<a class="btn wa" target="_blank" rel="noopener noreferrer" href="${esc(waLink(p.phone))}">WhatsApp</a>`:''}</div></div>`;
  }).join('')+msgBtn;
}
function detailHtml(x, phones, canContact){
  const fav = favorites.includes(x.id);
  const rows = [['Stare',x.condition],['Categorie',[x.category,x.subcategory].filter(Boolean).join(' › ')],['Cod OEM',x.oem],['Motor',x.engine],['Kilometri',x.km!=null?Number(x.km).toLocaleString('ro-RO')+' km':''],['Generație',x.generation],['Livrare',x.delivery?'Da':'Nu'],['Tip vânzător',x.seller_type],['Publicat',fmtDate(x.created_at)],['ID anunț','#'+x.id]].filter(r=>r[1]);
  const spec = [['Marcă',x.make],['Model',x.model],['An',x.year]].filter(r=>r[1]);
  const phone1 = (phones||[]).slice(0,1);
  const callbar = (canContact && phone1.length) ? `<div class="ad-callbar"><a class="btn primary" href="tel:${esc(String(phone1[0].phone).replace(/[^\d+]/g,''))}">📞 ${esc(fmtPhone(phone1[0].phone))}</a>${phone1[0].is_whatsapp?`<a class="btn wa" target="_blank" rel="noopener noreferrer" href="${esc(waLink(phone1[0].phone))}">WhatsApp</a>`:''}</div>` : '';
  const galleryImages = Array.isArray(x.images) ? x.images.filter(Boolean) : [];
  const gallery = galleryImages.length ? `<div class="detail-gallery">${galleryImages.map((src,i)=>`<button type="button" class="detail-gallery-item" data-lightbox-src="${esc(src)}" data-lightbox-alt="${esc(x.title)}" data-lightbox-index="${i}" aria-label="Vezi poza ${i+1} mai mare"><img src="${esc(src)}" alt="${esc(x.title)} - poza ${i+1}" loading="lazy"></button>`).join('')}</div>` : '';
  const seller = esc(x.seller_name || 'Vânzător');
  return `<div class="ad">
  <div class="ad-main">
    ${gallery}
    <h2>${esc(x.title)}</h2>
    <p class="ad-sub">${[x.county,fmtDate(x.created_at)].filter(Boolean).map(esc).join(' · ')}</p>
    <div class="ad-price-m">${money(x.price)}${x.negotiable&&Number(x.price)>0?' <small class="muted">· negociabil</small>':''}</div>
    ${spec.length?`<div class="ad-car"><small>Compatibil cu</small><div class="ad-spec">${spec.map(r=>`<div><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')}</div></div>`:''}
    ${x.type==='dezmembrari'&&x.parts_avail?`<h3 class="ad-h">Piese disponibile</h3><div class="part-chips big">${String(x.parts_avail).split(',').map(t=>t.trim()).filter(Boolean).map(t=>`<b>${esc(t)}</b>`).join('')}</div>`:''}
    ${x.description?`<h3 class="ad-h">Descriere</h3><p class="detail-desc">${esc(x.description)}</p>`:''}
    <h3 class="ad-h">Detalii</h3>
    <dl class="detail-grid">${rows.map(r=>`<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>
  </div>
  <aside class="ad-side">
    <div class="ad-card">
      <div class="detail-top"><span class="badge">${x.type==='dezmembrari'?'Dezmembrări':'Piesă auto'}</span>${x.condition?`<span class="badge ${x.condition==='Nouă'?'new':''}">${esc(x.condition)}</span>`:''}</div>
      <div class="detail-price">${money(x.price)}${x.negotiable&&Number(x.price)>0?' <small class="muted">· negociabil</small>':''}</div>
      <p class="ad-ship">${x.delivery?'🚚 Livrare disponibilă':'📍 Ridicare personală'}</p>
    </div>
    <div class="ad-card">
      <div class="seller-head"><span class="seller-avatar">${seller.charAt(0).toUpperCase()}</span><div><b>${seller}</b><small>${esc(x.seller_type||'')}${x.county?' · '+esc(x.county):''}</small></div></div>
      ${canContact?`<div class="contact-box"><b>Contactează vânzătorul</b>${contactHtml(phone1,'Vânzătorul',x.user_id,currentUser&&currentUser.id===x.user_id)}</div>`:'<p class="muted">Anunțul este în moderare și nu este încă vizibil public.</p>'}
    </div>
    <div class="contact-row">
      <button class="btn ghost small" data-fav="${x.id}" aria-label="Favorite">${fav?'♥':'♡'} Favorit</button>
      ${canContact?`<button class="btn ghost small" data-copy-link="${x.id}">Copiază linkul</button><button class="btn ghost small" data-show-report="1">Raportează</button>`:''}
    </div>
  </aside>
  </div>
  <div class="report-box hidden" id="reportBox"><b>Raportează anunțul</b>
    <select id="reportReason">${REPORT_REASONS.map(r=>`<option>${esc(r)}</option>`).join('')}</select>
    <textarea id="reportDetails" rows="3" maxlength="2000" placeholder="Detalii (opțional)"></textarea>
    <button class="btn danger small" data-send-report="${x.id}">Trimite raportarea</button><p class="form-note" id="reportMsg"></p></div>${callbar}`;
}
async function openDetail(id, own){
  const modal = $('#detailModal'), box = $('#detailContent');
  box.innerHTML = '<p class="muted">Se încarcă…</p>'; modal.classList.remove('hidden');
  try{
    const r = await api('/api/listings/'+id+(own?'?noview=1':''));
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
  $('#requestsTitle').textContent = mine ? 'Cererile mele' : 'Piese căutate de cumpărători';
  $('#requestsCrumb').textContent = $('#requestsTitle').textContent;
  $('#requestsSub').textContent = mine ? 'Cererile publicate de tine.' : 'Cereri publicate de cumpărători. Ai piesa? Contactează-l.';
  grid.innerHTML = '<p class="muted">Se încarcă…</p>';
  try{
    const r = await api(mine ? '/api/requests/mine' : '/api/requests');
    grid.innerHTML = r.requests.map(x=>`<article class="info-card" data-request="${x.id}">
      <b>${esc([x.make,x.model,x.year].filter(Boolean).join(' · ')||'Orice mașină')}</b><h3>${esc(x.title)}</h3>
      ${x.description?`<p>${esc(x.description.slice(0,160))}${x.description.length>160?'…':''}</p>`:''}
      <p class="muted">${esc(mine ? (x.status==='open'?'Deschisă':x.status) : (x.user_name||'Cumpărător'))} · ${fmtDate(x.created_at)}</p>
      <div class="contact-slot">${mine?`<button class="btn danger small" data-del-request="${x.id}">Șterge</button>`:`<button class="btn ghost small" data-req-contact="${x.id}">Contactează</button> <button class="btn primary small" data-offer-request="${x.id}">Oferă piesa</button>`}</div></article>`).join('');
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
  const title = parks ? 'Parcuri partenere' : 'Magazine verificate';
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
  }catch(err){ if(err.code==='EMAIL_EXISTS'){ $('#registerStep2').classList.add('hidden'); $('#registerStep1').classList.remove('hidden'); } setMsg(msg,err.message,'error'); }
}
function startRegister(){
  $('#loginForm').classList.add('hidden'); $('#registerForm').classList.remove('hidden');
  $('#registerStep1').classList.remove('hidden'); $('#registerStep2').classList.add('hidden');
  $('#authTitle').textContent = 'Creează cont'; setMsg($('#registerMessage'),'');
}
function registerStep1(){
  const e = $('#regEmail'); if(!e.reportValidity()) return;
  $$('#registerStep2 input').forEach(clearFieldError); $('#registerStep1').classList.add('hidden'); $('#registerStep2').classList.remove('hidden'); $('#regNickname').focus();
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


/* ---------- alegere categorie (fereastră ca pe pieseauto.ro) ---------- */
const carNorm = t => String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const catUI = { main:null };
function setCategory(cat, sub){
  $('#sellCategory').value = cat || ''; $('#sellSubcategory').value = sub || '';
  const t = $('#sellCategoryText'), b = $('#sellCategoryBtn');
  t.textContent = cat ? (sub ? cat+' › '+sub : cat) : 'Alege categoria';
  b.classList.toggle('has-value', !!cat); if(cat) b.classList.remove('field-error');
}
function openCatModal(){
  catUI.main = null; $('#catSearch').value = ''; renderCatList();
  $('#catModal').classList.remove('hidden'); document.body.classList.add('no-scroll');
  if(window.matchMedia('(pointer:fine)').matches) setTimeout(()=>$('#catSearch').focus({preventScroll:true}),40);
}
function closeCatModal(){ $('#catModal').classList.add('hidden'); document.body.classList.remove('no-scroll'); }
function renderCatList(){
  const q = carNorm($('#catSearch').value.trim()), list = $('#catList'), back = $('#catBack'), title = $('#catSubTitle');
  const row = (c,sub,label,small,arrow)=>`<li><button type="button" class="catpick-row" ${arrow?`data-cat-open="${esc(c)}"`:`data-cat-pick="${esc(c)}" data-sub-pick="${esc(sub||'')}"`}><span class="cp-t">${esc(label)}${small?`<small>${esc(small)}</small>`:''}</span>${arrow?'<span class="cp-arrow" aria-hidden="true">›</span>':''}</button></li>`;
  let html = '';
  if(q){
    back.classList.add('hidden'); title.textContent = 'Rezultate:';
    for(const [n,ico,subs] of CATEGORY_TREE){
      if(carNorm(n).includes(q)) html += row(n,'',ico+' '+n,'',false);
      for(const sb of subs) if(carNorm(sb).includes(q) || carNorm(n+' '+sb).includes(q)) html += row(n,sb,sb,n,false);
    }
    if(!html) html = '<li class="catpick-empty">Nu am găsit nicio categorie. Încearcă alt cuvânt sau alege „Diverse”.</li>';
  }else if(catUI.main){
    const node = CATEGORY_TREE.find(c=>c[0]===catUI.main);
    back.classList.remove('hidden'); title.textContent = catUI.main;
    html = row(node[0],'','Toate din '+node[0],'',false) + node[2].map(sb=>row(node[0],sb,sb,'',false)).join('');
  }else{
    back.classList.add('hidden'); title.textContent = 'Selectează din listă:';
    html = CATEGORY_TREE.map(([n,ico,subs])=>row(n,'',n,'',subs.length>0)).join('');
  }
  list.innerHTML = html; list.scrollTop = 0;
}

/* ---------- „Pentru ce mașină?” completat automat din titlu / descriere ---------- */
const MAKE_ALIASES = { 'vw':'Volkswagen','mercedes':'Mercedes-Benz','mercedes benz':'Mercedes-Benz','merc':'Mercedes-Benz','citroën':'Citroen','alfa':'Alfa Romeo','landrover':'Land Rover','range rover':'Land Rover','rolls royce':'Rolls-Royce','ssang yong':'SsangYong','vauxhall':'Opel','mini cooper':'Mini' };
const BMW_CHASSIS = { 'Seria 1':['e81','e82','e87','e88','f20','f21'], 'Seria 3':['e30','e36','e46','e90','e91','e92','e93','f30','f31'], 'Seria 5':['e34','e39','e60','e61','f10','f11'], 'Seria 7':['e38','e65','e66','f01'], 'X5':['e53','e70','f15'], 'X3':['e83','f25'], 'X1':['e84'], 'Z4':['e85','e89'] };
const RX_ESC = t => t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const wordRx = (pat) => new RegExp('(^|[^a-z0-9])(?:'+pat+')(?![a-z0-9])','i');
function flexName(name){ return RX_ESC(carNorm(name)).replace(/[\s-]+/g,'[\\s.-]*'); }
function makePattern(make){
  const parts = [flexName(make)];
  for(const [al,mk] of Object.entries(MAKE_ALIASES)) if(mk===make) parts.push(flexName(al));
  return parts.join('|');
}
function findMake(text, makes){
  const t = carNorm(text); if(!t.trim()) return '';
  let best = '', pos = 1e9;
  for(const mk of makes){
    const m = wordRx(makePattern(mk)).exec(t);
    if(m && m.index<pos){ pos = m.index; best = mk; }
  }
  return best;
}
function modelPatterns(make, model){
  const n = carNorm(model), pats = [flexName(model)];
  let m;
  if((m = /^seria (\d)$/.exec(n))){ pats.push('serie[\\s.-]*'+m[1], 'series[\\s.-]*'+m[1], m[1]+'[\\s.-]*(?:er|series)', m[1]+'\\d\\d(?:i|d|xd|e)?'); }
  else if((m = /^clasa ([a-z])$/.exec(n))){ pats.push(m[1]+'[\\s.-]*class', m[1]+'[\\s.-]*klasse', m[1]+'[\\s.-]*\\d{3}'); }
  return pats;
}
function findModel(text, make, models){
  const t = carNorm(text); let best = '', bestLen = 0, bestPos = 1e9;
  const mkRx = makePattern(make);
  for(const model of models){
    if(/^alt model$/i.test(model)) continue;
    const n = carNorm(model);
    const short = /^\d{1,2}$/.test(n);
    for(const pat of modelPatterns(make, model)){
      const rx = short ? new RegExp('(?:'+mkRx+')[\\s.-]*(?:'+pat+')(?![a-z0-9])','i') : wordRx(pat);
      const m = rx.exec(t);
      if(m && (n.length>bestLen || (n.length===bestLen && m.index<bestPos))){ best = model; bestLen = n.length; bestPos = m.index; }
    }
  }
  if(!best && make==='BMW'){
    for(const [model,codes] of Object.entries(BMW_CHASSIS)){
      if(models.includes(model) && wordRx(codes.join('|')).test(t)){ best = model; break; }
    }
  }
  return best;
}
function findYear(text){
  const max = new Date().getFullYear()+1, t = String(text||''), rx = /\d{4}/g; let m;
  while((m = rx.exec(t))){
    const y = Number(m[0]), before = t[m.index-1] || ' ', after = t.slice(m.index+4, m.index+12);
    if(y<1950 || y>max) continue;
    if(/[\w.,/]/.test(before) || /^[\w.,]/.test(after)) continue;
    if(/^\s*(lei|ron|eur|euro|€|km|cc|cm|mm|kg|bar|rpm|buc|ani)\b/i.test(after)) continue;
    return String(y);
  }
  return '';
}
async function getModels(make){
  let models = modelCache.get(make);
  if(!models){
    try{ models = ((await api('/api/catalog/models?make='+encodeURIComponent(make))).models||[]).map(x=>x.name); modelCache.set(make,models); }
    catch{ models = []; }
  }
  return models;
}
state.carManual = { make:false, model:false, year:false }; state.carAuto = { make:false, model:false, year:false }; state.detectToken = 0;
let detectTimer = null;
function scheduleDetect(){ clearTimeout(detectTimer); detectTimer = setTimeout(()=>safe(detectVehicle)(), 380); }
function showAutoCar(){
  const el = $('#sellAutoCar'), a = state.carAuto;
  const parts = [a.make&&$('#sellMake').value, a.model&&$('#sellModel').value, a.year&&$('#sellYear').value].filter(Boolean);
  el.classList.toggle('hidden', !parts.length);
  el.textContent = parts.length ? '✨ Completat automat: '+parts.join(' · ')+'. Poți modifica dacă nu e corect.' : '';
}
async function detectVehicle(){
  const man = state.carManual; if(man.make && man.model && man.year) return;
  const makes = [...$('#sellMake').options].map(o=>o.value).filter(Boolean); if(!makes.length) return;
  const title = $('#sellTitle').value, desc = $('#sellDescription').value, token = ++state.detectToken;
  const all = title+' '+desc;
  let make = man.make ? $('#sellMake').value : (findMake(title,makes) || findMake(desc,makes));
  let model = '';
  if(make && !man.model){ const models = await getModels(make); if(token!==state.detectToken) return; model = findModel(all, make, models); }
  if(make && !man.make && $('#sellMake').value!==make){
    $('#sellMake').value = make; state.carAuto.make = true; state.carAuto.model = false;
    await loadModels(make,'sellModel'); if(token!==state.detectToken) return;
  }
  if(model && !man.model && $('#sellModel').value!==model){
    $('#sellModel').value = model; state.carAuto.model = true;
  }
  if(make) loadYears($('#sellMake').value, $('#sellModel').value);
  if(!man.year){
    const y = findYear(all);
    if(y && $('#sellYear').value!==y){ $('#sellYear').value = y; state.carAuto.year = true; }
  }
  showAutoCar();
}
function resetCarAuto(manual){ state.carManual = { make:manual, model:manual, year:manual }; state.carAuto = { make:false, model:false, year:false }; state.detectToken++; const el=$('#sellAutoCar'); if(el){ el.classList.add('hidden'); el.textContent=''; } }

/* ---------- telefonul afișat în anunț ---------- */
async function loadSellPhone(){
  const box = $('#sellPhoneInfo'); if(!box) return;
  if(!currentUser){ box.textContent = 'Intră în cont pentru a publica.'; return; }
  try{
    const r = await api('/api/account/settings');
    state.phones = r.phones || []; state.sellShowPhone = !!r.user.show_phone; renderSellPhone();
  }catch(e){ box.textContent = 'Nu am putut încărca telefonul din cont.'; }
}
function renderSellPhone(){
  const box = $('#sellPhoneInfo'), p = (state.phones||[])[0];
  if(p){
    box.innerHTML = `<div class="sp-num">📞 <b>${esc(fmtPhone(p.phone))}</b></div>
      <label class="check"><input type="checkbox" id="sellPhoneShow" ${state.sellShowPhone?'checked':''}> Afișează telefonul în anunț</label>
      <label class="check"><input type="checkbox" id="sellPhoneWa" ${p.is_whatsapp?'checked':''}> Am WhatsApp pe acest număr</label>
      <small class="sf-hint">Se folosește primul număr din contul tău. Îl poți schimba din <a href="#/settings">Setări cont</a>.</small>`;
  }else{
    box.innerHTML = `<input id="sellPhoneNew" type="tel" inputmode="tel" autocomplete="tel" placeholder="07xx xxx xxx">
      <label class="check"><input type="checkbox" id="sellPhoneWa" checked> Am WhatsApp pe acest număr</label>
      <small class="sf-hint">Numărul se salvează în contul tău și apare în anunț, cu butoane de apel și WhatsApp.</small>`;
  }
}
async function applySellPhone(){
  const p = (state.phones||[])[0];
  if(p){
    const waEl = $('#sellPhoneWa'), showEl = $('#sellPhoneShow'); if(!waEl||!showEl) return;
    if(waEl.checked !== !!p.is_whatsapp) await api('/api/account/phones/'+p.id,{method:'PATCH',body:JSON.stringify({is_whatsapp:waEl.checked})});
    if(showEl.checked !== state.sellShowPhone){ await api('/api/account/privacy',{method:'PATCH',body:JSON.stringify({show_phone:showEl.checked})}); if(currentUser) currentUser.show_phone = showEl.checked; }
  }else{
    const inp = $('#sellPhoneNew'), val = inp ? inp.value.trim() : ''; if(!val) return;
    await api('/api/account/phones',{method:'POST',body:JSON.stringify({phone:val,is_whatsapp:$('#sellPhoneWa').checked})});
    await api('/api/account/privacy',{method:'PATCH',body:JSON.stringify({show_phone:true})}); if(currentUser) currentUser.show_phone = true;
  }
}

/* ---------- baloane de informare (i) ---------- */
function showInfoPop(btn){
  const pop = $('#infoPop'); pop.textContent = btn.dataset.info || '';
  pop.classList.remove('hidden');
  const r = btn.getBoundingClientRect(), w = Math.min(280, window.innerWidth-24);
  pop.style.width = w+'px';
  pop.style.left = Math.max(12, Math.min(window.innerWidth-w-12, r.left + r.width/2 - w/2)) + 'px';
  pop.style.top = (window.scrollY + r.bottom + 8) + 'px';
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
    if(file.size>20*1024*1024)return reject(new Error('O poză poate avea maximum 20 MB.'));
    const reader=new FileReader(); reader.onload=()=>{
      const img=new Image(); img.onload=()=>{
        const TARGET=520000;
        for(const max of [1600,1280,1000,800]){
          const scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
          const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(img.naturalWidth*scale)); c.height=Math.max(1,Math.round(img.naturalHeight*scale));
          const ctx=c.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height); ctx.drawImage(img,0,0,c.width,c.height);
          let q=.82, out=c.toDataURL('image/jpeg',q);
          while(out.length>TARGET && q>.5){q-=.08; out=c.toDataURL('image/jpeg',q);}
          if(out.length<=TARGET)return resolve(out);
        }
        reject(new Error('Poza este prea mare după comprimare.'));
      }; img.onerror=()=>reject(new Error('Poza nu a putut fi citită.')); img.src=reader.result;
    }; reader.onerror=()=>reject(new Error('Poza nu a putut fi încărcată.')); reader.readAsDataURL(file);
  });
}
async function handleSellImages(e){
  let files=[...e.target.files]; e.target.value='';
  const room=8-state.sellImages.length;
  if(files.length>room){toast(room>0?`Poți adăuga încă ${room} poze (maximum 8). Le-am luat pe primele.`:'Ai deja 8 poze.'); files=files.slice(0,Math.max(0,room));}
  if(!files.length) return;
  state.sellBusy=true; $('#sellImageCount').textContent='Se procesează pozele…';
  try{ for(const file of files){try{state.sellImages.push(await fileToDataUrl(file));}catch(err){toast(err.message);}} }
  finally{ state.sellBusy=false; renderSellImages(); }
}


/* ---------- preselecție mașină pentru cereri ---------- */
// Mașinile salvate sunt cele din cererile anterioare ale utilizatorului (fără duplicate).
let savedCars = [];
async function loadSavedCars(){
  const r = await api('/api/requests/mine');
  const seen = new Set(); savedCars = [];
  for(const x of r.requests||[]){
    if(!x.make || !x.model) continue;
    const key = [x.make,x.model,x.year,x.variant,x.engine,x.vin].map(v=>String(v||'').trim().toLowerCase()).join('|');
    if(seen.has(key)) continue; seen.add(key);
    savedCars.push({id:x.id,make:x.make,model:x.model,year:x.year||'',variant:x.variant||'',engine:x.engine||'',vin:x.vin||''});
  }
  return savedCars;
}
function carLabel(c){ return [c.make,c.model,c.year,c.engine].filter(Boolean).join(' '); }
async function enterCarPick(){
  const list = $('#carPickList'); list.innerHTML = '';
  try{ await loadSavedCars(); }catch{ savedCars = []; }
  // Fără mașini salvate, trimitem direct la formularul gol.
  if(!savedCars.length){ history.replaceState(null,'','#/cerere-noua'); route(); return; }
  list.innerHTML = savedCars.map(c=>`<button type="button" class="cp-item" data-car-from="${c.id}"><span>${esc(carLabel(c))}</span><i>›</i></button>`).join('');
}
function ensureOption(el, val){
  if(val && ![...el.options].some(o=>o.value===val)){ const o=document.createElement('option'); o.value=val; o.textContent=val; el.appendChild(o); }
  el.value = val || '';
}
async function enterRequestForm(fromId){
  const form = $('#requestForm'); form.reset(); $('#reqExtra').innerHTML = ''; setMsg($('#requestMessage'),'');
  await loadModels('','reqModel');
  if(!fromId){
    const g = garageActive();
    if(g){ ensureOption($('#reqMake'), g.make); await loadModels(g.make,'reqModel'); ensureOption($('#reqModel'), g.model); loadYears(g.make,g.model); if(g.year) $('#reqYear').value = g.year; }
    return;
  }
  let c = savedCars.find(x=>String(x.id)===String(fromId));
  if(!c){ try{ await loadSavedCars(); }catch{} c = savedCars.find(x=>String(x.id)===String(fromId)); }
  if(!c) return;
  ensureOption($('#reqMake'), c.make);
  await loadModels(c.make,'reqModel');
  ensureOption($('#reqModel'), c.model);
  loadYears(c.make,c.model);
  $('#reqYear').value = c.year; $('#reqVariant').value = c.variant; $('#reqEngine').value = c.engine; $('#reqVin').value = c.vin;
  $('#reqTitle').focus();
}

/* ---------- formulare ---------- */
function addReqPart(){
  const box=$('#reqExtra'); if(box.children.length>=9){ toast('Maximum 10 piese într-o cerere.'); return; }
  const d=document.createElement('div'); d.className='req-part';
  d.innerHTML='<label>Piesă suplimentară<input class="rp-title" maxlength="150" placeholder="Denumire piesă"></label><label>Cod sau detalii<textarea class="rp-details" rows="2" maxlength="500"></textarea></label><button type="button" class="btn ghost rp-del">Șterge piesa</button>';
  box.appendChild(d);
}
async function submitRequest(e){
  e.preventDefault(); const msg = $('#requestMessage'); setMsg(msg,'');
  const year = $('#reqYear').value.trim();
  if(year && !/^\d{4}$/.test(year)){ setMsg(msg,'Anul trebuie să aibă 4 cifre.','error'); return; }
  if(!$('#reqKind').value){ setMsg(msg,'Alege ce oferte vrei (noi, second-hand sau ambele).','error'); return; }
  if(!$('#reqCounty').value){ setMsg(msg,'Alege județul de livrare.','error'); return; }
  const extra=[...document.querySelectorAll('#reqExtra .req-part')].map(p=>({title:p.querySelector('.rp-title').value.trim(),details:p.querySelector('.rp-details').value.trim()})).filter(x=>x.title);
  try{
    await api('/api/requests',{method:'POST',body:JSON.stringify({title:$('#reqTitle').value.trim(),make:$('#reqMake').value,model:$('#reqModel').value,year,description:$('#reqDescription').value,variant:$('#reqVariant').value.trim(),engine:$('#reqEngine').value.trim(),vin:$('#reqVin').value.trim(),kind:$('#reqKind').value,county:$('#reqCounty').value,city:$('#reqCity').value.trim(),extra_parts:extra})});
    e.target.reset(); $('#reqExtra').innerHTML=''; await loadModels('','reqModel');
    setMsg(msg,'Cererea a fost trimisă. O găsești în Cererile mele.','ok');
  }catch(err){ setMsg(msg,err.message,'error'); }
}
function syncSellType(){
  const d = $('#sellType').value==='dezmembrari';
  $('#sellConditionWrap').classList.toggle('hidden', d);
  $('#sellDismBlock').classList.toggle('hidden', !d);
  $('#sellCategoryField').classList.toggle('hidden', d);
}
function setSellMode(editId){
  state.editId = editId || null;
  $('#sellHeading').textContent = editId ? 'Editează anunțul' : 'Adaugă o piesă';
  $('#sellSub').textContent = editId ? 'Modificările la titlu, descriere, poze sau datele mașinii trec din nou prin verificare.' : 'Publicarea unui anunț necesită autentificare.';
  $('#sellSubmit').textContent = editId ? 'Salvează modificările' : 'Publică anunțul';
  $('#sellCancelEdit').classList.toggle('hidden', !editId);
}
function resetSellForm(){
  $('#sellForm').reset(); state.sellImages=[]; renderSellImages(); $('#sellDelivery').checked=true;
  syncSellType(); loadModels('','sellModel'); setCategory('',''); resetCarAuto(false);
}
async function enterSell(editParam,mode){
  const id = Number(editParam)||0;
  loadSellPhone();
  if(!id){
    if(state.editId){ resetSellForm(); } state.sellFilled=null; setSellMode(null);
    const dism = mode==='dism';
    if(dism){
      $('#sellType').value='dezmembrari'; syncSellType();
      $('#sellHeading').textContent='Adaugă o mașină la dezmembrat';
      $('#sellSub').textContent='Spune ce mașină dezmembrezi și ce piese sunt disponibile.';
    } else if(state.sellDism){
      $('#sellType').value='piesa'; syncSellType();
    }
    state.sellDism = dism; return;
  }
  const wasEditing = state.editId===id;
  setSellMode(id); setMsg($('#sellMessage'),'');
  const r = await api('/api/listings/mine/'+id).catch(err=>{ setSellMode(null); toast(err.message); navigate('anunturile-mele'); return null; });
  if(!r) return;
  if(wasEditing && state.sellFilled===id) return;
  const x = r.listing;
  $('#sellType').value = x.type; $('#sellSellerType').value = x.seller_type || 'Persoană fizică';
  syncSellType();
  $('#sellTitle').value = x.title||''; $('#sellDescription').value = x.description||'';
  setCategory(x.category||'', x.subcategory||''); resetCarAuto(true); $('#sellMake').value = x.make||'';
  await loadModels(x.make||'','sellModel'); $('#sellModel').value = x.model||''; loadYears(x.make||'',x.model||'');
  if(x.model && $('#sellModel').value!==x.model){ const o=document.createElement('option'); o.value=o.textContent=x.model; $('#sellModel').appendChild(o); $('#sellModel').value=x.model; }
  if(x.make && $('#sellMake').value!==x.make){ const o=document.createElement('option'); o.value=o.textContent=x.make; $('#sellMake').appendChild(o); $('#sellMake').value=x.make; }
  $('#sellYear').value = x.year||''; $('#sellOem').value = x.oem||'';
  $('#sellEngine').value = x.engine||''; $('#sellKm').value = x.km!=null ? String(x.km) : ''; $('#sellVin').value = x.vin||''; $('#sellParts').value = x.parts_avail||'';
  $('#sellPrice').value = Number(x.price)>0 ? String(Number(x.price)) : '';
  $('#sellCondition').value = x.condition || 'Second-hand'; $('#sellCounty').value = x.county||'';
  $('#sellDelivery').checked = !!x.delivery; $('#sellNegotiable').checked = !!x.negotiable;
  state.sellImages = Array.isArray(x.images) ? x.images.filter(Boolean) : []; renderSellImages();
  state.sellFilled = id;
}
async function submitSell(e){
  e.preventDefault(); const msg = $('#sellMessage'); setMsg(msg,'');
  if(state.sellBusy){ setMsg(msg,'Așteaptă să se termine procesarea pozelor.','error'); return; }
  const btn = $('#sellSubmit'); if(btn && btn.disabled) return;
  const year = $('#sellYear')?.value.trim() || '', type = $('#sellType').value;
  if(year && !/^\d{4}$/.test(year)){ setMsg(msg,'Anul trebuie să aibă 4 cifre.','error'); return; }
  if(year && (Number(year)<1950 || Number(year)>new Date().getFullYear()+1)){ setMsg(msg,ERR.AN_INVALID,'error'); return; }
  const focusBad = (el, text)=>{ setMsg(msg,text,'error'); if(el){ el.classList.add('field-error'); el.scrollIntoView({block:'center',behavior:'smooth'}); if(el.focus) el.focus({preventScroll:true}); } };
  ['sellTitle','sellMake','sellModel','sellCounty'].forEach(i=>$('#'+i).classList.remove('field-error')); $('#sellCategoryBtn').classList.remove('field-error');
  if($('#sellTitle').value.trim().length<3){ focusBad($('#sellTitle'),'Scrie piesa pe care o vinzi (minimum 3 caractere).'); return; }
  if(type!=='dezmembrari' && !$('#sellCategory').value){ focusBad($('#sellCategoryBtn'),'Alege categoria piesei.'); return; }
  if(!$('#sellMake').value){ focusBad($('#sellMake'),'Alege marca mașinii. Se completează automat dacă o scrii în titlu sau descriere.'); return; }
  if(!$('#sellModel').value){ focusBad($('#sellModel'),'Alege modelul mașinii (sau „Alt model”).'); return; }
  if(!$('#sellCounty').value){ focusBad($('#sellCounty'),'Alege județul.'); return; }
  if(btn){ btn.disabled=true; btn.textContent='Se trimite…'; }
  try{
    await applySellPhone();
    const payload = JSON.stringify({type,title:$('#sellTitle').value.trim(),price:$('#sellPrice').value||0,condition:type==='dezmembrari'?'Second-hand':$('#sellCondition').value,category:$('#sellCategory').value,subcategory:$('#sellSubcategory').value,seller_type:$('#sellSellerType').value,make:$('#sellMake').value,model:$('#sellModel').value,year,oem:$('#sellOem').value.trim(),county:$('#sellCounty').value,description:$('#sellDescription').value,delivery:$('#sellDelivery').checked,negotiable:$('#sellNegotiable').checked,images:state.sellImages,engine:$('#sellEngine').value.trim(),km:$('#sellKm').value,vin:$('#sellVin').value.trim(),parts_avail:$('#sellParts').value.trim()});
    const editing = state.editId;
    const r = editing ? await api('/api/listings/'+editing,{method:'PATCH',body:payload}) : await api('/api/listings',{method:'POST',body:payload});
    resetSellForm(); setSellMode(null); state.sellFilled=null;
    const live = r.listing && r.listing.status==='approved';
    setMsg(msg, editing ? (r.resubmitted ? 'Modificările au fost salvate și anunțul a fost trimis din nou la verificare.' : 'Modificările au fost salvate.') : (live ? 'Anunțul a fost publicat. Te ducem la Anunțurile mele…' : 'Anunțul a fost trimis pentru verificare. Te ducem la Anunțurile mele…'),'ok');
    setTimeout(()=>navigate('anunturile-mele'),1200);
  }catch(err){ setMsg(msg,err.message,'error'); }
  finally{ if(btn){ btn.disabled=false; btn.textContent=state.editId?'Salvează modificările':'Publică anunțul'; } }
}

/* ---------- setări cont ---------- */
async function loadSettings(){
  const r = await api('/api/account/settings');
  state.phones = r.phones; state.phoneEdit = null;
  $('#settingsName').value = r.user.name || ''; $('#settingsNickname').value = r.user.nickname || '';
  $('#settingsEmailText').textContent = r.user.email || '';
  $('#settingsEmailOk').classList.toggle('hidden', !r.user.email_verified);
  $('#showPhoneToggle').checked = !!r.user.show_phone;
  const sc = $('#shipCounty'); if(sc.options.length<2) sc.insertAdjacentHTML('beforeend', COUNTIES.map(c=>`<option>${esc(c)}</option>`).join(''));
  const u = r.user;
  sc.value = u.ship_county || ''; $('#shipCity').value = u.ship_city || ''; $('#shipDetails').value = u.ship_details || '';
  $('#billCompany').value = u.bill_company || ''; $('#billCui').value = u.bill_cui || ''; $('#billRegcom').value = u.bill_regcom || '';
  $('#billAddress').value = u.bill_address || ''; $('#billBank').value = u.bill_bank || ''; $('#billIban').value = u.bill_iban || '';
  renderPhones();
}
async function saveDetails(e){
  e.preventDefault(); const msg = $('#detailsMsg'); setMsg(msg,'');
  try{
    await api('/api/account/details',{method:'PUT',body:JSON.stringify({ship_county:$('#shipCounty').value,ship_city:$('#shipCity').value,ship_details:$('#shipDetails').value,bill_company:$('#billCompany').value,bill_cui:$('#billCui').value,bill_regcom:$('#billRegcom').value,bill_address:$('#billAddress').value,bill_bank:$('#billBank').value,bill_iban:$('#billIban').value})});
    await loadSettings(); setMsg(msg,'Datele au fost salvate.','ok');
  }catch(err){ setMsg(msg,err.message,'error'); }
}
function renderPhones(){
  const ph = state.phones || [], edit = state.phoneEdit;
  let html = '';
  for(let i=0;i<4;i++){
    const p = ph[i], key = p ? String(p.id) : 'new-'+i, editing = edit===key;
    const num = editing
      ? `<input class="set-phone-input" id="phoneEditInput" type="tel" inputmode="tel" value="${p?esc(p.phone):''}" placeholder="07xx xxx xxx" autocomplete="tel"><button type="button" class="set-btn" data-ph-save="${key}">Salvează</button><button type="button" class="set-btn" data-ph-cancel="1">Anulează</button>`
      : `<span class="set-phone">${p?esc(fmtPhone(p.phone)):'<i class="set-empty"></i>'}</span><button type="button" class="set-ico" data-ph-edit="${key}" aria-label="${p?'Editează numărul':'Adaugă număr'}" title="${p?'Editează':'Adaugă număr'}">✎</button><button type="button" class="set-ico set-del" ${p?`data-del-phone="${p.id}"`:'disabled'} aria-label="Șterge numărul" title="Șterge">🗑</button>${p?(p.verified?'<span class="set-ok">✓ Verificat</span>':'<span class="set-muted">Neverificat</span>'):''}`;
    html += `<div class="set-phone-card"><label>Telefon ${i+1}:</label><div class="set-line">${num}</div>${p&&!editing?`<div class="set-wa"><span>🟢 WhatsApp</span><button type="button" role="switch" aria-checked="${p.is_whatsapp?'true':'false'}" class="set-switch ${p.is_whatsapp?'on':''}" data-wa-phone="${p.id}" aria-label="WhatsApp"><i></i></button><button type="button" class="set-info" data-ph-info="1" aria-label="Informații">i</button></div>`:''}</div>`;
  }
  $('#phoneList').innerHTML = html;
  const inp = $('#phoneEditInput'); if(inp) inp.focus();
}
document.addEventListener('click', async e=>{
  if(!(e.target.closest && e.target.closest('#page-settings'))) return;
  let el;
  if((el=e.target.closest('[data-set-toggle]'))){ $('#'+el.dataset.setToggle).classList.toggle('hidden'); return; }
  if((el=e.target.closest('[data-ph-edit]'))){ state.phoneEdit = el.dataset.phEdit; renderPhones(); return; }
  if(e.target.closest('[data-ph-cancel]')){ state.phoneEdit = null; renderPhones(); return; }
  if(e.target.closest('[data-ph-info]')){ toast('Cu WhatsApp activ, cumpărătorii te pot contacta direct pe WhatsApp la acest număr.'); return; }
  if((el=e.target.closest('[data-ph-save]'))){
    const key = el.dataset.phSave, val = $('#phoneEditInput').value.trim(), msg = $('#phoneMsg'); setMsg(msg,'');
    try{
      if(key.startsWith('new-')) await api('/api/account/phones',{method:'POST',body:JSON.stringify({phone:val,is_whatsapp:false})});
      else await api('/api/account/phones/'+key,{method:'PATCH',body:JSON.stringify({phone:val})});
      await loadSettings(); setMsg(msg,'Numărul a fost salvat. Verificarea prin SMS nu este activă încă.','ok');
    }catch(err){ setMsg(msg,err.message,'error'); }
  }
});
async function saveProfile(e){
  e.preventDefault(); const msg = $('#profileSettingsMsg'); setMsg(msg,'');
  try{
    const r = await api('/api/account/profile',{method:'PATCH',body:JSON.stringify({name:$('#settingsName').value.trim(),nickname:$('#settingsNickname').value.trim()})});
    currentUser = {...currentUser, ...r.user}; renderHeader(); setMsg(msg,'Datele au fost salvate.','ok');
  }catch(err){ setMsg(msg,err.message,'error'); }
}
async function requestEmailChange(e){
  e.preventDefault(); const msg = $('#emailChangeMsg'); setMsg(msg,'');
  try{ const r = await api('/api/account/email-change',{method:'POST',body:JSON.stringify({email:$('#settingsNewEmail').value,password:$('#settingsEmailPassword').value})}); $('#settingsEmailPassword').value=''; setMsg(msg,r.message,'ok'); }
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
    const get = async (u,k) => { try{ return (await api(u))[k] || []; }catch(e){ console.error('admin',u,e.message); return []; } };
    const ovr = await api('/api/admin/overview');
    const [users,listings,requests,reports,activity,offers,orders] = await Promise.all([get('/api/admin/users','users'),get('/api/admin/listings','listings'),get('/api/admin/requests','requests'),get('/api/admin/reports','reports'),get('/api/admin/activity','activity'),get('/api/admin/offers','offers'),get('/api/admin/orders','orders')]);
    adminData = {s:ovr.stats,users,listings,requests,reports,activity,offers,orders};
    renderAdmin();
  }catch(e){ $('#adminContent').innerHTML = `<p>${esc(e.message)}</p>`; }
}
function adminBtns(kind, id, items){ return items.map(([label,status])=>`<button class="btn ghost small" data-admin="${kind}" data-id="${id}" data-status="${status}">${label}</button>`).join(''); }
function renderAdmin(){
  const d = adminData, s = d.s;
  const tabs = [['dashboard','Dashboard'],['listings',`Anunțuri${s.pending?` (${s.pending})`:''}`],['users','Utilizatori'],['requests','Cereri piese'],['offers','Oferte'],['orders','Comenzi'],['reports',`Raportări${s.reports?` (${s.reports})`:''}`],['activity','Activitate'],['vehicles','Mașini']];
  let body = '';
  if(adminTab==='dashboard') body = `<div class="stat-grid"><div class="stat"><b>Utilizatori</b><h3>${s.users}</h3><small>${s.activeUsers} activi</small></div><div class="stat"><b>Anunțuri</b><h3>${s.listings}</h3><small>${s.approved} aprobate · ${s.pending} în așteptare · ${s.rejected} respinse</small></div><div class="stat"><b>Raportări deschise</b><h3>${s.reports}</h3></div><div class="stat"><b>Cereri deschise</b><h3>${s.requests}</h3></div></div>`;
  if(adminTab==='dashboard') body += `<div class="stat-grid" style="margin-top:12px"><div class="stat"><b>Oferte</b><h3>${s.offers||0}</h3></div><div class="stat"><b>Comenzi</b><h3>${s.orders||0}</h3></div><div class="stat"><b>Mesaje trimise</b><h3>${s.messages||0}</h3><small>doar numărul, conținutul e privat</small></div></div>`;
  if(adminTab==='offers') body = `<div class="admin-list">${d.offers.map(x=>`<article class="info-card"><b>#${x.id} · ${esc(x.request_title)}</b><p>${money(x.price)} · ${esc(x.status)} · ${fmtDate(x.created_at)}</p><small>Vânzător: ${esc(x.seller_name||'—')} · Cumpărător: ${esc(x.buyer_name||'—')}</small></article>`).join('')||'<p>Nu există oferte.</p>'}</div>`;
  if(adminTab==='orders') body = `<div class="admin-list">${d.orders.map(x=>`<article class="info-card"><b>#${x.id} · ${esc(x.title||'Comandă')}</b><p>${money(x.price)} · ${esc(x.status)} · ${fmtDate(x.created_at)}</p><small>Vânzător: ${esc(x.seller_name||'—')} · Cumpărător: ${esc(x.buyer_name||'—')}</small></article>`).join('')||'<p>Nu există comenzi.</p>'}</div>`;
  if(adminTab==='listings') body = `${s.pending?`<div class="admin-actions" style="margin:0 0 12px"><button class="btn primary small" data-admin="approve-all">Aprobă toate cele ${s.pending} în așteptare</button></div>`:''}<div class="admin-list">${d.listings.map(x=>{const st=STATUS_LABEL[x.status]||[x.status,''];return `<article class="info-card"><b>#${x.id} · ${esc(x.title)}</b> <span class="badge ${st[1]}">${esc(st[0])}</span><p>${money(x.price)} · ${esc(x.type)} · ${esc(x.county||'—')} · ${fmtDate(x.created_at)}</p><p>${esc(x.seller_name||'Fără vânzător')} · ${esc(x.seller_email||'')}</p>${x.description?`<p>${esc(x.description.slice(0,200))}</p>`:''}<div class="admin-actions">${adminBtns('listing',x.id,[['Aprobă','approved'],['Respinge','rejected'],['Blochează','blocked']])}<button class="btn danger small" data-admin="listing-del" data-id="${x.id}">Șterge</button></div></article>`;}).join('')||'<p>Nu există anunțuri.</p>'}</div>`;
  if(adminTab==='users') body = `<div class="admin-list">${d.users.map(x=>`<article class="info-card"><b>#${x.id} · ${esc(x.name||'—')}</b><p>${esc(x.email)} · ${esc(x.role)} · ${esc(x.status)}</p><div class="admin-actions">${adminBtns('user',x.id,[['Activează','active'],['Blochează','blocked']])}</div></article>`).join('')||'<p>Nu există utilizatori.</p>'}</div>`;
  if(adminTab==='requests') body = `<div class="admin-list">${d.requests.map(x=>`<article class="info-card"><b>#${x.id} · ${esc(x.title)}</b><p>${esc(x.user_name||'—')} · ${esc(x.status)}</p><div class="admin-actions">${adminBtns('request',x.id,[['Deschisă','open'],['Potrivită','matched'],['Închisă','closed']])}</div></article>`).join('')||'<p>Nu există cereri.</p>'}</div>`;
  if(adminTab==='reports') body = `<div class="admin-list">${d.reports.map(x=>`<article class="info-card"><b>#${x.id} · ${esc(x.reason)}</b><p>${esc(x.listing_title||'Anunț')} · ${esc(x.reporter_name||'—')} · ${esc(x.status)}</p>${x.details?`<p>${esc(x.details)}</p>`:''}<div class="admin-actions">${adminBtns('report',x.id,[['Marchează verificată','reviewed'],['Închide','closed']])}</div></article>`).join('')||'<p>Nu există raportări.</p>'}</div>`;
  if(adminTab==='activity') body = `<div class="admin-list">${d.activity.map(x=>`<article class="info-card"><b>${esc(x.action)}</b><p>${esc(x.admin_name||'Admin')} · ${new Date(x.created_at).toLocaleString('ro-RO')}</p><small>${esc(x.target_type||'')} #${x.target_id||''} · ${esc(x.details||'')}</small></article>`).join('')||'<p>Nu există activitate.</p>'}</div>`;
  if(adminTab==='vehicles') body = '<div id="vehAdmin"><p>Se încarcă baza de vehicule…</p></div>';
  $('#adminContent').innerHTML = `<div class="admin-tabs">${tabs.map(([k,l])=>`<button class="btn ghost ${k===adminTab?'active':''}" data-admin-tab="${k}">${l}</button>`).join('')}</div>${body}`;
  if(adminTab==='vehicles') safe(loadAdminVehicles)();
}
let vehQuery = '';
const KIND_LABEL = {car:'Autoturism',van:'Utilitară',motorcycle:'Motocicletă',moped:'Moped',truck:'Camion',bus:'Autobuz'};
const SRC_LABEL = {manual:'manual',curated:'listă standard',vehiclesdb:'listă veche',fallback:'listă veche'};
async function loadAdminVehicles(){
  const box = $('#vehAdmin'); if(!box) return;
  const d = await api('/api/admin/vehicles?limit=100&q='+encodeURIComponent(vehQuery));
  const st = d.stats||{};
  const rows = d.vehicles.map(x=>{
    const yrs = x.year_from ? `${x.year_from}–${x.year_to||'prezent'}` : '—';
    return `<article class="info-card"><b>${esc(x.make)} ${esc(x.model)}</b> <span class="badge">${esc(KIND_LABEL[x.kind]||x.kind)}</span><p>${esc(yrs)}${x.generation?' · '+esc(x.generation):''}${x.engine?' · '+esc(x.engine):''}${x.fuel?' · '+esc(x.fuel):''}</p><small>Sursă: ${esc(SRC_LABEL[x.source]||x.source)}</small><div class="admin-actions"><button class="btn danger small" data-veh="del" data-id="${x.id}">Șterge</button></div></article>`;
  }).join('') || '<p>Nu am găsit vehicule.</p>';
  box.innerHTML = `<div class="stat-grid"><div class="stat"><b>Vehicule</b><h3>${st.total||0}</h3></div><div class="stat"><b>Mărci</b><h3>${st.makes||0}</h3></div><div class="stat"><b>Adăugate manual</b><h3>${st.manual||0}</h3></div></div>
  <div class="admin-actions" style="margin:14px 0"><input id="vehSearch" placeholder="Caută marcă sau model…" value="${esc(vehQuery)}" style="flex:1;min-width:180px;padding:10px;border:1px solid #d6e1ec;border-radius:10px"><button class="btn ghost small" data-veh="search">Caută</button><button class="btn ghost small" data-veh="sync">Resetează la lista standard</button></div>
  <div class="info-card" style="margin-bottom:14px"><b>Adaugă sau actualizează un vehicul</b><p class="form-note">Dacă marca și modelul există deja, înregistrarea este actualizată și marcată „manual” (nu va fi suprascrisă la sincronizare).</p>
  <div class="two"><input id="vehMake" placeholder="Marcă (ex. Dacia)"><input id="vehModel" placeholder="Model (ex. Duster)"></div>
  <div class="two" style="margin-top:8px"><input id="vehFrom" inputmode="numeric" maxlength="4" placeholder="An început (ex. 2010)"><input id="vehTo" inputmode="numeric" maxlength="4" placeholder="An sfârșit (gol = în producție)"></div>
  <div class="two" style="margin-top:8px"><input id="vehGen" placeholder="Generație (opțional)"><input id="vehEngine" placeholder="Motor (opțional)"></div>
  <div class="two" style="margin-top:8px"><select id="vehFuel"><option value="">Combustibil (opțional)</option><option>Benzină</option><option>Motorină</option><option>GPL</option><option>Hibrid</option><option>Electric</option></select><select id="vehKind">${Object.entries(KIND_LABEL).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></div>
  <button class="btn primary full" style="margin-top:10px" data-veh="add">Salvează vehiculul</button></div>
  <div class="admin-list">${rows}</div>`;
}
async function vehAction(el){
  const act = el.dataset.veh;
  if(act==='search'){ vehQuery = $('#vehSearch').value.trim(); await loadAdminVehicles(); return; }
  if(act==='del'){ if(!confirm('Ștergi acest vehicul din baza de date?')) return; await api('/api/admin/vehicles/'+el.dataset.id,{method:'DELETE'}); modelCache.clear(); yearsCache.clear(); await loadAdminVehicles(); return; }
  if(act==='sync'){
    if(!confirm('Resetezi lista de mărci și modele la lista standard? Vehiculele adăugate manual rămân.')) return;
    toast('Se reface lista de mărci și modele…');
    const r = await api('/api/admin/vehicles/sync',{method:'POST'});
    toast(`Lista standard a fost restaurată: ${r.total} vehicule în baza de date.`);
    modelCache.clear(); yearsCache.clear(); await loadAdminVehicles(); loadCatalog(); return;
  }
  if(act==='add'){
    const body = {make:$('#vehMake').value.trim(),model:$('#vehModel').value.trim(),year_from:$('#vehFrom').value.trim(),year_to:$('#vehTo').value.trim(),generation:$('#vehGen').value.trim(),engine:$('#vehEngine').value.trim(),fuel:$('#vehFuel').value,kind:$('#vehKind').value};
    if(!body.make || !body.model){ toast('Completează marca și modelul.'); return; }
    await api('/api/admin/vehicles',{method:'POST',body:JSON.stringify(body)});
    toast('Vehicul salvat.'); modelCache.clear(); yearsCache.clear(); await loadAdminVehicles(); loadCatalog();
  }
}
async function adminAction(el){
  const {admin:kind,id,status} = el.dataset;
  if(kind==='listing') await api(`/api/admin/listings/${id}`,{method:'PATCH',body:JSON.stringify({status})});
  else if(kind==='approve-all'){ if(!confirm('Aprobi toate anunțurile aflate în așteptare?')) return; const r=await api('/api/admin/listings/approve-all',{method:'POST'}); toast(`Aprobate: ${r.approved}.`); }
  else if(kind==='listing-del'){ if(!confirm('Ștergi definitiv anunțul?')) return; await api(`/api/admin/listings/${id}`,{method:'DELETE'}); }
  else if(kind==='user') await api(`/api/admin/users/${id}`,{method:'PATCH',body:JSON.stringify({status})});
  else if(kind==='request') await api(`/api/admin/requests/${id}`,{method:'PATCH',body:JSON.stringify({status})});
  else if(kind==='report') await api(`/api/admin/reports/${id}`,{method:'PATCH',body:JSON.stringify({status})});
  await loadAdmin();
}


/* ---------- garajul meu ---------- */
function garageData(){ const g = readJSON('autopiese_garage',{cars:[],active:null}); if(!Array.isArray(g.cars)) g.cars=[]; return g; }
function garageActive(){ const g=garageData(); return g.cars.find(c=>c.id===g.active) || null; }
function garageName(c){ return c ? [c.make,c.model].filter(Boolean).join(' ') + (c.year?' '+c.year:'') : ''; }
function updateGarageUI(){
  const c = garageActive(), el = $('#garageLabel'); if(!el) return;
  el.textContent = c ? [c.make,c.model].filter(Boolean).join(' ') : 'Garajul meu';
  $('#garageBtn').classList.toggle('on', !!c);
  const hm = $('#homeMake'); if(c && hm && !hm.value){ hm.value = c.make; loadModels(c.make,'homeModel').then(()=>{ $('#homeModel').value = c.model; }); }
}
function renderGarageList(){
  const g = garageData(), box = $('#garageList');
  box.innerHTML = g.cars.length ? g.cars.map(c=>`<div class="garage-item${c.id===g.active?' active':''}"><button type="button" class="garage-pick" data-garage-use="${esc(c.id)}"><b>${esc(garageName(c))}</b><small>${c.id===g.active?'Mașina activă':'Folosește această mașină'}</small></button><button type="button" class="garage-del" data-garage-del="${esc(c.id)}" aria-label="Șterge">×</button></div>`).join('')
    + (g.active ? '<button type="button" class="text-btn" data-garage-off>Fără mașină activă</button>' : '')
    : '<p class="muted">Garajul e gol. Adaugă prima mașină mai jos.</p>';
}
function openGarage(){ renderGarageList(); setMsg($('#garageMsg'),''); $('#garageModal').classList.remove('hidden'); }
function renderGarageBanner(){
  const b = $('#garageBanner'); if(!b) return;
  const g = garageActive(), f = state.filters||{};
  if(g && state.mode==='search' && f.make===g.make && (f.model||'')===g.model){
    b.innerHTML = `<span>🚗 Piese pentru <b>${esc(garageName(g))}</b></span><button type="button" data-garage-all>Arată toate piesele</button>`;
    b.classList.remove('hidden');
  } else b.classList.add('hidden');
}
function garageSave(e){
  e.preventDefault();
  const make=$('#garageMake').value, model=$('#garageModel').value, year=$('#garageYear').value.trim(), msg=$('#garageMsg');
  if(!make||!model){ setMsg(msg,'Alege marca și modelul.','error'); return; }
  if(year && (!/^\d{4}$/.test(year) || Number(year)<1950 || Number(year)>new Date().getFullYear()+1)){ setMsg(msg,'Anul trebuie să aibă 4 cifre.','error'); return; }
  const g = garageData(); if(g.cars.length>=10){ setMsg(msg,'Poți ține maximum 10 mașini în garaj.','error'); return; }
  const id = 'c'+Date.now().toString(36);
  g.cars.push({id,make,model,year}); g.active = id; writeJSON('autopiese_garage',g);
  $('#garageForm').reset(); loadModels('','garageModel'); renderGarageList(); updateGarageUI();
  setMsg(msg,'Mașina a fost salvată în garaj.','ok');
}
function garageUse(id){ const g=garageData(); g.active=id; writeJSON('autopiese_garage',g); renderGarageList(); updateGarageUI(); toast('Mașina activă: '+garageName(garageActive())); }
function garageDelete(id){ const g=garageData(); g.cars=g.cars.filter(c=>c.id!==id); if(g.active===id) g.active=null; writeJSON('autopiese_garage',g); renderGarageList(); updateGarageUI(); }
function garageOff(){ const g=garageData(); g.active=null; writeJSON('autopiese_garage',g); renderGarageList(); updateGarageUI(); }

/* ---------- căutare care recunoaște mașina din text ---------- */
const foldTxt = t => String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const MAKE_ALIAS = { vw:'volkswagen', merc:'mercedes', mercedes:'mercedes', benz:'mercedes' };
async function smartSearch(q){
  const out = { make:'', model:'', rest:q };
  if(!catalogMakes.length) return out;
  let t = ' '+foldTxt(q)+' ';
  let make = '', hit = '';
  const byLen = [...catalogMakes].sort((a,b)=>foldTxt(b).length-foldTxt(a).length);
  for(const m of byLen){
    const fm = foldTxt(m), first = fm.split(' ')[0];
    if(t.includes(' '+fm+' ')){ make=m; hit=fm; break; }
    if(fm.includes(' ') && t.includes(' '+first+' ')){ make=m; hit=first; break; }
  }
  if(!make){
    for(const [al,full] of Object.entries(MAKE_ALIAS)){
      if(t.includes(' '+al+' ')){ const m = byLen.find(x=>foldTxt(x).startsWith(full)); if(m){ make=m; hit=al; break; } }
    }
  }
  if(!make) return out;
  t = t.replace(' '+hit+' ',' ');
  let models = modelCache.get(make);
  if(!models){ try{ models=((await api('/api/catalog/models?make='+encodeURIComponent(make))).models||[]).map(x=>x.name); modelCache.set(make,models); }catch{ models=[]; } }
  let model = '';
  for(const m of [...models].sort((a,b)=>foldTxt(b).length-foldTxt(a).length)){
    const fm = foldTxt(m); if(fm && t.includes(' '+fm+' ')){ model=m; t=t.replace(' '+fm+' ',' '); break; }
  }
  t = t.replace(/ (19[5-9]\d|20[0-3]\d) /g,' ').replace(/\s+/g,' ').trim();
  return { make, model, rest:t };
}

/* ---------- acțiuni UI ---------- */
function doAction(a){
  if(a==='account') currentUser ? navigate('cont') : openAuth('cont');
  else if(a==='request') navigate('cerere');
  else if(a==='sell') navigate('vinde');
  else if(a==='sell-dism') navigate('vinde?t=dism');
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
  else if(a==='listings') navigate('anunturile-mele');
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
  if((el=t.closest('[data-edit-listing]'))){ e.stopPropagation(); navigate('vinde?edit='+Number(el.dataset.editListing)); return; }
  if((el=t.closest('[data-sold-listing]'))){ e.stopPropagation(); const id=Number(el.dataset.soldListing), to=el.dataset.to; safe(async()=>{ await api('/api/listings/'+id+'/status',{method:'PATCH',body:JSON.stringify({status:to})}); const it=state.loaded.find(x=>x.id===id); if(it) it.status=to; renderList(); toast(to==='sold'?'Anunțul a fost marcat ca vândut.':'Anunțul este din nou la vânzare.'); })(); return; }
  if((el=t.closest('[data-del-listing]'))){ e.stopPropagation(); const id=Number(el.dataset.delListing); if(confirm('Ștergi acest anunț?')) safe(async()=>{ await api('/api/listings/'+id,{method:'DELETE'}); state.loaded=state.loaded.filter(x=>x.id!==id); state.total=state.loaded.length; renderList(); toast('Anunțul a fost șters.'); })(); return; }
  if((el=t.closest('[data-del-request]'))){ const id=el.dataset.delRequest; if(confirm('Ștergi această cerere?')) safe(async()=>{ await api('/api/requests/'+id,{method:'DELETE'}); loadRequests(true); })(); return; }
  if((el=t.closest('[data-offer-request]'))){ if(!currentUser){ openAuth(location.hash.replace(/^#\//,'')); return; } $('#offerRequestId').value=el.dataset.offerRequest; $('#offerPrice').value=''; $('#offerMessage').value=''; setMsg($('#offerMessageStatus'),''); $('#offerModal').classList.remove('hidden'); return; }
  if((el=t.closest('[data-offer-accept]'))){ if(confirm('Accepți această ofertă?')) safe(async()=>{ await api('/api/offers/'+el.dataset.offerAccept+'/accept',{method:'POST'}); toast('Ofertă acceptată. Comanda a fost creată.'); renderAccountTool('offers-received'); })(); return; }
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
  if((el=t.closest('[data-veh]'))){ safe(vehAction)(el); return; }
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
document.addEventListener('submit', e=>{ const f=e.target.closest&&e.target.closest('#msgForm'); if(!f) return; e.preventDefault(); safe(async()=>{ await api('/api/messages',{method:'POST',body:JSON.stringify({to:Number(f.dataset.to),body:$('#msgBody').value})}); renderAccountTool('messages',f.dataset.to); })(); });
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
  saveRecentSearch(q); $('#topSearchInput').value=q; closeSearchOverlay();
  smartSearch(q).then(r=>{ if(r.make){ toast('Am recunoscut mașina: '+[r.make,r.model].filter(Boolean).join(' ')); openSearch({q:r.rest, make:r.make, model:r.model}); } else openSearch({q}); }).catch(()=>openSearch({q}));
}

function wire(){
  $('#topSearchForm').addEventListener('submit', e=>{ e.preventDefault(); submitSearchQuery($('#topSearchInput').value); });
  $('#topSearchBtn').addEventListener('click', ()=>{
    const hp=$('#page-home'), hi=$('#homeSearchInput');
    if(hp && hp.classList.contains('active') && hi){ if(hi.value.trim()) submitSearchQuery(hi.value); else { hi.scrollIntoView({block:'center',behavior:'smooth'}); hi.focus({preventScroll:true}); } return; }
    openSearchOverlay();
  });
  $('#searchOverlayBack').addEventListener('click', closeSearchOverlay);
  $('#searchOverlayForm').addEventListener('submit', e=>{ e.preventDefault(); submitSearchQuery($('#searchOverlayInput').value); });
  $('#clearRecentSearches').addEventListener('click', ()=>{ localStorage.removeItem('autopiese_recent_searches'); renderRecentSearches(); });
  $('#recentSearchList').addEventListener('click', e=>{ const b=e.target.closest('[data-recent-search]'); if(b) submitSearchQuery(b.dataset.recentSearch); });
  $('#homeRequestBtn').addEventListener('click', ()=>doAction('request'));
  $('#garageBtn').addEventListener('click', openGarage);
  $('#garageForm').addEventListener('submit', garageSave);
  $('#garageMake').addEventListener('change', e=>loadModels(e.target.value,'garageModel'));
  $('#garageModal').addEventListener('click', e=>{
    const u=e.target.closest('[data-garage-use]'), d=e.target.closest('[data-garage-del]'), o=e.target.closest('[data-garage-off]');
    if(u) garageUse(u.dataset.garageUse); else if(d) garageDelete(d.dataset.garageDel); else if(o) garageOff();
  });
  $('#garageBanner').addEventListener('click', async e=>{ if(e.target.closest('[data-garage-all]')){ $('#filterMake').value=''; await loadModels('','filterModel','Toate modelele'); state.extra.g='0'; onFilterChange(); } });
  updateGarageUI();
  $('#cartBtn').addEventListener('click', ()=>doAction('cart'));
  $('#homeSearchForm').addEventListener('submit', e=>{ e.preventDefault(); submitSearchQuery($('#homeSearchInput').value); });
  $('#resultsSearchForm').addEventListener('submit', e=>{ e.preventDefault(); if(state.mode!=='search') return; onFilterChange(); });
  $('#homeMake').addEventListener('change', e=>loadModels(e.target.value,'homeModel'));
  $('#homeVehicleBtn').addEventListener('click', ()=>{ const make=$('#homeMake').value; if(!make){ toast('Alege marca mașinii.'); return; } openSearch({make, model:$('#homeModel').value}); });
  $('#matchMake').addEventListener('change', e=>loadModels(e.target.value,'matchModel'));
  $('#reqMake').addEventListener('change', e=>loadModels(e.target.value,'reqModel'));
  $('#sellCancelEdit').addEventListener('click',()=>{ resetSellForm(); setSellMode(null); state.sellFilled=null; navigate('anunturile-mele'); });
  $('#sellMake').addEventListener('change', e=>{ state.carManual.make=true; state.carManual.model=false; state.carAuto.make=state.carAuto.model=false; loadModels(e.target.value,'sellModel').then(()=>{ scheduleDetect(); showAutoCar(); }); });
  $('#sellModel').addEventListener('change', ()=>{ state.carManual.model=true; state.carAuto.model=false; loadYears($('#sellMake').value,$('#sellModel').value); showAutoCar(); });
  $('#sellYear').addEventListener('input', ()=>{ state.carManual.year=true; state.carAuto.year=false; showAutoCar(); });
  $('#sellTitle').addEventListener('input', scheduleDetect);
  $('#sellDescription').addEventListener('input', scheduleDetect);
  $('#sellCategoryBtn').addEventListener('click', openCatModal);
  $('#catClose').addEventListener('click', closeCatModal);
  $('#catBack').addEventListener('click', ()=>{ catUI.main=null; renderCatList(); });
  $('#catSearch').addEventListener('input', renderCatList);
  $('#catModal').addEventListener('click', e=>{
    if(e.target===$('#catModal')){ closeCatModal(); return; }
    const o = e.target.closest('[data-cat-open]'); if(o){ catUI.main=o.dataset.catOpen; renderCatList(); return; }
    const p = e.target.closest('[data-cat-pick]'); if(p){ setCategory(p.dataset.catPick, p.dataset.subPick); closeCatModal(); }
  });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ if(!$('#catModal').classList.contains('hidden')) closeCatModal(); $('#infoPop').classList.add('hidden'); } });
  document.addEventListener('click', e=>{ const b=e.target.closest('.info-dot'); if(b){ e.preventDefault(); showInfoPop(b); return; } if(!e.target.closest('#infoPop')) $('#infoPop').classList.add('hidden'); });
  $('#matchModel').addEventListener('change', ()=>loadYears($('#matchMake').value,$('#matchModel').value));
  $('#reqModel').addEventListener('change', ()=>loadYears($('#reqMake').value,$('#reqModel').value));
  $('#matchForm').addEventListener('submit', e=>{ e.preventDefault(); const make=$('#matchMake').value, model=$('#matchModel').value, q=[$('#matchEngine').value.trim(),$('#matchPart').value.trim()].filter(Boolean).join(' '); if(!make&&!q){ toast('Alege marca sau scrie piesa căutată.'); return; } openSearch({q,make,model}); });
  $('#sellType').addEventListener('change', syncSellType);
  Object.keys(FILTER_FIELDS).forEach(id=>{ if(id!=='filterMake') $('#'+id).addEventListener('change', onFilterChange); });
  $('#filterMake').addEventListener('change', async e=>{ await loadModels(e.target.value,'filterModel','Toate modelele'); onFilterChange(); });
  $('#withDelivery').addEventListener('change', onFilterChange);
  $('#clearFilters').addEventListener('click', ()=>{ $$('#filters select').forEach(s=>s.value=''); $('#maxPrice').value=''; $('#withDelivery').checked=false; $('#sortListings').value='new'; loadModels('','filterModel','Toate modelele').then(onFilterChange); });
  $('#filterToggle').addEventListener('click', ()=>$('#filters').classList.toggle('open'));
  $('#pagination').addEventListener('click', e=>{ const b=e.target.closest('[data-page]'); if(b) safe(()=>goToResultsPage(b.dataset.page))(); });
  $('#saveSearchBtn').addEventListener('click', saveCurrentSearch);
  $('#favoritesBtn').addEventListener('click', ()=>navigate('rezultate?mode=fav'));
  $('#accountBtn').addEventListener('click', ()=>doAction('account'));
  $('#menuBtn').addEventListener('click', ()=>navigate('menu'));
  $('#closeMenu').addEventListener('click', ()=>navigate('home'));
  $('#logoutBtn').addEventListener('click', logout);
  $('#passwordChangeForm').addEventListener('submit', e=>{ e.preventDefault(); const m=$('#pwChangeMsg'); setMsg(m,''); api('/api/account/password',{method:'POST',body:JSON.stringify({current:$('#pwCurrent').value,password:$('#pwNew').value})}).then(()=>{ $('#pwCurrent').value=$('#pwNew').value=''; setMsg(m,'Parola a fost schimbată. Celelalte dispozitive au fost deconectate.','ok'); }).catch(err=>setMsg(m,err.message,'error')); });
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
  $('#carPickList').addEventListener('click', e=>{ const b=e.target.closest('[data-car-from]'); if(b) navigate('cerere-noua?from='+b.dataset.carFrom); });
  $('#carPickNew').addEventListener('click', ()=>navigate('cerere-noua'));
  $('#reqAddPart').addEventListener('click', addReqPart);
  $('#reqExtra').addEventListener('click', e=>{ const b=e.target.closest('.rp-del'); if(b) b.closest('.req-part').remove(); });
  $('#registerForm').addEventListener('submit', e=>{ if($('#registerStep2').classList.contains('hidden')){ e.preventDefault(); e.stopImmediatePropagation(); registerStep1(); } }, true);
  $('#offerForm').addEventListener('submit', e=>{ e.preventDefault(); safe(async()=>{ const id=$('#offerRequestId').value; await api('/api/requests/'+id+'/offers',{method:'POST',body:JSON.stringify({price:$('#offerPrice').value,message:$('#offerMessage').value})}); $('#offerModal').classList.add('hidden'); toast('Oferta a fost trimisă.'); })(); });
  $('#sellForm').addEventListener('submit', submitSell);
  $('#sellImages').addEventListener('change', handleSellImages);
  $('#profileSettingsForm').addEventListener('submit', saveProfile);
  $('#emailChangeForm').addEventListener('submit', requestEmailChange);
  $('#phoneAddForm').addEventListener('submit', addPhone);
  $('#detailsForm').addEventListener('submit', saveDetails);
  $('#showPhoneToggle').addEventListener('change', togglePrivacy);
  $('#settingsForgotPassword').addEventListener('click', ()=>{ if(currentUser&&currentUser.email){ $('#forgotEmail').value=currentUser.email; setMsg($('#forgotMessage'),''); $('#forgotModal').classList.remove('hidden'); } });
  window.addEventListener('hashchange', route);
}


/* ---------- Anunțurile mele (format PieseAuto.ro: tab-uri, căutare, 30 pe pagină) ---------- */
const MINE_PER_PAGE = 30, MINE_EXPIRE_DAYS = 30;
const mine = { items:[], tab:'active', q:'', cat:'', type:'', sort:'new', page:1, sel:new Set() };
const MINE_TABS = [['active','Active'],['sold','Stoc epuizat'],['expire','Expiră'],['promo','Promovate'],['deleted','Șterse']];
const mineNorm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function mineTabItems(tab){
  const old = Date.now() - MINE_EXPIRE_DAYS*86400000;
  if(tab==='active') return mine.items.filter(x=>x.status!=='sold' && x.status!=='deleted');
  if(tab==='sold') return mine.items.filter(x=>x.status==='sold');
  if(tab==='expire') return mine.items.filter(x=>x.status==='approved' && new Date(x.created_at).getTime() < old);
  if(tab==='deleted') return mine.items.filter(x=>x.status==='deleted');
  return [];
}
function mineVisible(){
  let a = mineTabItems(mine.tab);
  if(mine.cat) a = a.filter(x=>x.category===mine.cat);
  if(mine.type) a = a.filter(x=>x.type===mine.type);
  const q = mineNorm(mine.q).trim();
  if(q){
    const id = q.replace(/^#/,'');
    a = a.filter(x=> /^\d+$/.test(id) ? String(x.id)===id : q.split(/\s+/).every(t=>mineNorm([x.title,x.oem,x.make,x.model,x.category].join(' ')).includes(t)));
  }
  const p = x=>Number(x.price)||0, d = x=>new Date(x.created_at).getTime();
  const by = {new:(x,y)=>d(y)-d(x), old:(x,y)=>d(x)-d(y), pasc:(x,y)=>p(x)-p(y), pdesc:(x,y)=>p(y)-p(x), views:(x,y)=>(y.views||0)-(x.views||0)};
  return a.slice().sort(by[mine.sort]||by.new);
}
async function enterMine(){
  $('#mineList').innerHTML = '<p class="muted">Se încarcă…</p>';
  const sel = $('#mineCat'); if(sel && sel.options.length<2) sel.insertAdjacentHTML('beforeend', CATEGORIES.map(c=>`<option>${esc(c[0])}</option>`).join(''));
  const r = await api('/api/listings/mine');
  mine.items = r.listings || []; state.loaded = mine.items; mine.sel.clear(); mine.page = 1;
  renderMine();
}
function mineRow(x){
  const img = Array.isArray(x.images) && x.images[0];
  const st = STATUS_LABEL[x.status] || [x.status,''];
  const del = x.status==='deleted', locked = x.status==='blocked';
  const showBadge = x.status!=='approved';
  const btns = del
    ? `<button type="button" class="mine-act" data-m-restore="${x.id}" title="Restaurează" aria-label="Restaurează">↺</button><button type="button" class="mine-act" data-m-del="${x.id}" title="Șterge definitiv" aria-label="Șterge definitiv">🗑</button>`
    : `<button type="button" class="mine-act" data-m-promo="${x.id}" title="Promovează" aria-label="Promovează">📢</button><button type="button" class="mine-act" data-m-bump="${x.id}" title="Reactualizează" aria-label="Reactualizează">↑</button>${locked?'':`<button type="button" class="mine-act" data-m-edit="${x.id}" title="Editează" aria-label="Editează">✎</button>`}${x.status==='approved'||x.status==='sold'?`<button type="button" class="mine-act" data-m-sold="${x.id}" data-to="${x.status==='sold'?'approved':'sold'}" title="${x.status==='sold'?'Repune în stoc':'Stoc epuizat'}" aria-label="${x.status==='sold'?'Repune în stoc':'Stoc epuizat'}">${x.status==='sold'?'⟲':'✓'}</button>`:''}<button type="button" class="mine-act" data-m-del="${x.id}" title="Șterge" aria-label="Șterge">🗑</button>`;
  return `<article class="mine-row">
    <label class="mine-check"><input type="checkbox" data-m-check="${x.id}" ${mine.sel.has(x.id)?'checked':''} aria-label="Selectează anunțul"></label>
    <button type="button" class="mine-thumb" data-m-open="${x.id}" aria-label="Deschide anunțul">${img?`<img src="${esc(img)}" alt="" loading="lazy">`:'<span>📷</span>'}</button>
    <div class="mine-body">
      <button type="button" class="mine-name" data-m-open="${x.id}">${esc(x.title)}</button>
      ${showBadge?`<span class="badge ${st[1]}">${esc(st[0])}</span>`:''}
      <div class="mine-acts">${btns}</div>
    </div>
    <div class="mine-meta"><span>👁 ${Number(x.views)||0}</span><span>${Number(x.quantity)||1} buc.</span><b>${esc(money(x.price))}</b></div>
  </article>`;
}
function renderMine(){
  const all = mineVisible(), total = all.length, pages = Math.max(1, Math.ceil(total/MINE_PER_PAGE));
  mine.page = Math.min(Math.max(1, mine.page), pages);
  const from = (mine.page-1)*MINE_PER_PAGE, slice = all.slice(from, from+MINE_PER_PAGE);
  $('#mineTabs').innerHTML = MINE_TABS.map(([k,l])=>`<button type="button" role="tab" class="mine-tab ${mine.tab===k?'on':''}" data-m-tab="${k}">${l}${k!=='promo'?` <small>${mineTabItems(k).length}</small>`:''}</button>`).join('');
  const titles = {active:'Anunțuri active',sold:'Anunțuri cu stoc epuizat',expire:'Anunțuri care expiră',promo:'Anunțuri promovate',deleted:'Anunțuri șterse'};
  $('#mineCount').textContent = total ? `${titles[mine.tab]} (${from+1} - ${from+slice.length} din ${total})` : titles[mine.tab];
  const empty = {active:'Nu ai anunțuri active.',sold:'Nu ai anunțuri cu stoc epuizat.',expire:`Nu ai anunțuri publicate de peste ${MINE_EXPIRE_DAYS} de zile.`,promo:'Nu ai anunțuri promovate. Promovarea va fi disponibilă în curând.',deleted:'Nu ai anunțuri șterse.'};
  $('#mineList').innerHTML = slice.length ? slice.map(mineRow).join('') : `<div class="empty">${mine.q||mine.cat||mine.type?'Niciun anunț nu corespunde filtrelor.':empty[mine.tab]}</div>`;
  $('#minePager').innerHTML = pages>1 ? `<button type="button" class="btn ghost small" data-m-page="${mine.page-1}" ${mine.page<=1?'disabled':''}>‹ Înapoi</button><span>Pagina ${mine.page} din ${pages}</span><button type="button" class="btn ghost small" data-m-page="${mine.page+1}" ${mine.page>=pages?'disabled':''}>Înainte ›</button>` : '';
  const ids = slice.map(x=>x.id);
  $('#mineAll').checked = ids.length>0 && ids.every(i=>mine.sel.has(i));
  const n = mine.sel.size, bulk = $('#mineBulk');
  bulk.classList.toggle('hidden', !n);
  bulk.innerHTML = n ? `<span>${n} selectate</span>` + (mine.tab==='deleted'
    ? `<button type="button" class="btn ghost small" data-m-bulk="restore">Restaurează</button><button type="button" class="btn danger small" data-m-bulk="del">Șterge definitiv</button>`
    : `${mine.tab==='sold'?'<button type="button" class="btn ghost small" data-m-bulk="instock">Repune în stoc</button>':'<button type="button" class="btn ghost small" data-m-bulk="sold">Stoc epuizat</button>'}<button type="button" class="btn danger small" data-m-bulk="del">Șterge</button>`) : '';
}
async function mineDo(ids, kind){
  let ok = 0, last = '';
  for(const id of ids){
    try{
      if(kind==='sold'||kind==='instock') await api('/api/listings/'+id+'/status',{method:'PATCH',body:JSON.stringify({status:kind==='sold'?'sold':'approved'})});
      else if(kind==='restore') await api('/api/listings/'+id+'/restore',{method:'PATCH'});
      else if(kind==='del') await api('/api/listings/'+id,{method:'DELETE'});
      else if(kind==='bump') await api('/api/listings/'+id+'/bump',{method:'POST'});
      ok++;
    }catch(e){ last = e.message; }
  }
  mine.sel.clear();
  const r = await api('/api/listings/mine'); mine.items = r.listings||[]; state.loaded = mine.items; renderMine();
  toast(ok===ids.length ? 'Gata.' : (ok? `${ok} din ${ids.length} actualizate. ${last}` : last||'Nu s-a putut face modificarea.'));
}
document.addEventListener('click', e=>{
  const pg = e.target.closest && e.target.closest('#page-mine'); if(!pg) return;
  let el;
  if((el=e.target.closest('[data-m-tab]'))){ mine.tab=el.dataset.mTab; mine.page=1; mine.sel.clear(); renderMine(); return; }
  if((el=e.target.closest('[data-m-page]'))){ mine.page=Number(el.dataset.mPage)||1; renderMine(); window.scrollTo({top:0,behavior:'smooth'}); return; }
  if((el=e.target.closest('[data-m-open]'))){ openDetail(Number(el.dataset.mOpen), true); return; }
  if((el=e.target.closest('[data-m-edit]'))){ navigate('vinde?edit='+Number(el.dataset.mEdit)); return; }
  if((el=e.target.closest('[data-m-promo]'))){ toast('Promovarea anunțurilor va fi disponibilă în curând.'); return; }
  if((el=e.target.closest('[data-m-bump]'))){ safe(()=>mineDo([Number(el.dataset.mBump)],'bump'))(); return; }
  if((el=e.target.closest('[data-m-sold]'))){ safe(()=>mineDo([Number(el.dataset.mSold)], el.dataset.to==='sold'?'sold':'instock'))(); return; }
  if((el=e.target.closest('[data-m-restore]'))){ safe(()=>mineDo([Number(el.dataset.mRestore)],'restore'))(); return; }
  if((el=e.target.closest('[data-m-del]'))){ const id=Number(el.dataset.mDel), hard=mine.tab==='deleted'; if(confirm(hard?'Ștergi definitiv acest anunț? Nu se mai poate recupera.':'Muți anunțul în „Șterse”?')) safe(()=>mineDo([id],'del'))(); return; }
  if((el=e.target.closest('[data-m-bulk]'))){ const k=el.dataset.mBulk, ids=[...mine.sel]; if(k==='del' && !confirm(mine.tab==='deleted'?'Ștergi definitiv anunțurile selectate?':'Muți anunțurile selectate în „Șterse”?')) return; safe(()=>mineDo(ids,k))(); return; }
  if(e.target.closest('#mineFilterBtn')){ $('#mineFilterPanel').classList.toggle('hidden'); return; }
  if(e.target.closest('#mineSortBtn')){ $('#mineSortPanel').classList.toggle('hidden'); return; }
  if(e.target.closest('#mineFilterReset')){ mine.cat=''; mine.type=''; $('#mineCat').value=''; $('#mineType').value=''; mine.page=1; renderMine(); return; }
});
document.addEventListener('change', e=>{
  if(!(e.target.closest && e.target.closest('#page-mine'))) return;
  const t = e.target;
  if(t.matches('[data-m-check]')){ const id=Number(t.dataset.mCheck); t.checked? mine.sel.add(id) : mine.sel.delete(id); renderMine(); }
  else if(t.id==='mineAll'){ const slice = mineVisible().slice((mine.page-1)*MINE_PER_PAGE, mine.page*MINE_PER_PAGE); slice.forEach(x=> t.checked? mine.sel.add(x.id) : mine.sel.delete(x.id)); renderMine(); }
  else if(t.id==='mineCat'){ mine.cat=t.value; mine.page=1; renderMine(); }
  else if(t.id==='mineType'){ mine.type=t.value; mine.page=1; renderMine(); }
  else if(t.id==='mineSort'){ mine.sort=t.value; mine.page=1; renderMine(); }
});
document.addEventListener('submit', e=>{
  if(e.target.id!=='mineSearchForm') return; e.preventDefault();
  mine.q = $('#mineSearch').value; mine.page=1; renderMine();
});

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

/* apăsare vizibilă pe telefon */
document.addEventListener('touchstart',()=>{},{passive:true});
