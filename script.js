/* Promovarea anunțurilor: pune true când există plăți/credite reale */
var PROMO_ON=true;
'use strict';
/* AutoParts V26 — frontend (fără handlere inline, compatibil cu CSP) */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

const ERR = {
  AWB_INVALID:'AWB-ul poate conține doar litere, cifre și . _ - (3–40 caractere).',NIMIC_DE_SALVAT:'Nu ai modificat nimic.',CERERE_PROPRIE:'Aceasta este cererea ta.',MARCAJ_INVALID:'Marcaj necunoscut.',
  INVALID_LOGIN:'Email/nickname sau parolă incorectă.',ACCOUNT_BLOCKED:'Contul este blocat.',EMAIL_EXISTS:'Există deja un cont cu acest email.',
  NICKNAME_EXISTS:'Nickname-ul este deja folosit.',COMENZI_ACTIVE:'Ai comenzi în curs. Finalizează sau anulează comenzile înainte de a șterge contul.',ADMIN_NU_SE_STERGE:'Conturile de administrator nu se pot șterge din interfață.',SITE_INVALID:'Adresa site-ului trebuie să înceapă cu http:// sau https://.',LOGO_INVALID:'Logo invalid sau prea mare (maximum ~450 KB după comprimare).',NICKNAME_INVALID:'Nickname-ul trebuie să aibă 3–30 de caractere (litere, cifre, _ . -).',
  DATE_INVALIDE:'Verifică datele introduse.',AUTH_REQUIRED:'Trebuie să te autentifici.',
  EMAIL_NOT_CONFIGURED:'Trimiterea emailurilor nu este configurată încă pe server.',EMAIL_SENDER_NOT_CONFIGURED:'Lipsește expeditorul email (RESEND_FROM).',
  EMAIL_SENDER_INVALID:'Adresa configurată pentru RESEND_FROM nu este validă.',EMAIL_SENDER_NOT_VERIFIED:'Expeditorul email nu este verificat în Resend.',
  EMAIL_PROVIDER_FORBIDDEN:'Serviciul de email a refuzat trimiterea. Verifică cheia API și expeditorul.',EMAIL_RATE_LIMIT:'Prea multe cereri către serviciul de email. Încearcă peste câteva minute.',
  EMAIL_SEND_FAILED:'Emailul nu a putut fi trimis. Încearcă din nou.',RECOVERY_RATE_LIMIT:'Ai cerut prea multe resetări. Încearcă peste 15 minute.',
  LOGIN_RATE_LIMIT:'Prea multe încercări. Încearcă din nou mai târziu.',RESET_EXPIRED:'Linkul a expirat sau a fost deja folosit.',
  EMAIL_REQUIRED:'Introdu o adresă de email validă.',SERVER_ERROR:'A apărut o eroare pe server.',EMAIL_NOT_VERIFIED:'Confirmă adresa de email (verifică mesajul primit) ca să poți continua.',MAX_PHONES:'Poți avea maximum 4 numere de telefon.',
  PHONE_EXISTS:'Acest număr este deja adăugat.',TELEFON_INVALID:'Telefonul destinatarului nu este valid.',PHONE_INVALID:'Număr de telefon invalid.',STARE_INVALIDA:'Alege starea piesei.',
  CALIFICATIV_INVALID:'Alege un număr de stele între 1 și 5.',COMANDA_NEFINALIZATA:'Poți da calificativ doar după ce comanda este finalizată.',CSV_GOL:'Fișierul nu conține rânduri de importat.',PREA_MULTE_RANDURI:'Fișierul are prea multe rânduri. Importă cel mult 300 odată.',
  EDIT_EXPIRAT:'Au trecut cele 10 minute în care puteai modifica cererea.',PREA_MULTE_ANUNTURI:'Ai trimis prea multe anunțuri sau cereri. Încearcă mai târziu.',NOT_FOUND:'Nu am găsit ce cauți.',MAX_CAUTARI:'Ai atins limita de 30 de căutări salvate. Șterge una ca să poți salva alta.',BLOCAT:'Nu poți trimite acestui utilizator.',BLOCAT_DE_TINE:'Ai blocat acest utilizator. Deblochează-l din Setări cont ca să continui.',VANZATOR_IN_VACANTA:'Vânzătorul este în vacanță și nu primește comenzi acum.',DATA_INVALIDA:'Data aleasă nu este validă (cel mult 365 de zile de acum).',NU_SE_POATE_BLOCA:'Acest utilizator nu poate fi blocat.',MAX_BLOCARI:'Ai atins limita de 200 de utilizatori blocați.',BOT_CHECK:'Verificarea de securitate a expirat. Reîncarcă pagina.',PREA_MULTE_CERERI:'Prea multe cereri într-un timp scurt. Încearcă din nou peste un minut.',STAFF_ONLY:'Zona de administrare este doar pentru administratori și moderatori.',ROL_INVALID:'Rol invalid.',ROL_PROPRIU:'Nu îți poți schimba singur rolul.',ADMIN_PRINCIPAL:'Contul principal de administrator (din setările Render) nu poate fi retrogradat.',ULTIMUL_ADMIN:'Nu poți retrograda ultimul administrator activ.',CONT_BLOCAT:'Contul este blocat. Deblochează-l mai întâi.',CREDITE_INSUFICIENTE:'Nu ai destule credite pentru această acțiune. Adaugă credite din Contul meu.',LIMITA_ANUNTURI:'Ai atins limita de anunțuri active pentru contul gratuit. Șterge sau marchează ca vândute anunțurile vechi ca să poți publica altele.',LINK_INTERZIS:'Nu poți pune linkuri sau adrese de email în anunț. Cumpărătorii te contactează direct prin site.',PRET_NEREALIST:'Prețul pare prea mic. Pune un preț real sau lasă câmpul gol pentru „La cerere”.',VEHICUL_EXISTA:'Există deja un vehicul cu această marcă și acest model.',ADMIN_ONLY:'Doar administratorul are acces.',
  CUI_INVALID:'CIF / CUI invalid (ex: RO12345678 sau 12345678).',IBAN_INVALID:'Codul IBAN nu este valid.',REACTUALIZARE_PREA_DEVREME:'Poți reactualiza un anunț o singură dată la 24 de ore (și doar dacă este publicat).',STATUS_INVALIDE:'Status invalid.',PAROLA_GRESITA:'Parola curentă este greșită.',TERMENI_NEACCEPTATI:'Trebuie să accepți Termenii și Politica de confidențialitate.',PAROLA_SLABA:'Parola este prea simplă. Evită parolele comune, doar cifre sau nickname/email în parolă.',SPATIU_POZE_DEPASIT:'Ai depășit spațiul disponibil pentru poze. Șterge poze sau anunțuri vechi.',PRET_INVALID:'Preț invalid.',CERERE_PROPRIE:'Nu poți face ofertă la propria cerere.',OFERTA_NU_MAI_E_DISPONIBILA:'Oferta nu mai este disponibilă.',INTERZIS:'Nu ai voie să faci această acțiune.',PREA_MULTE_OFERTE:'Ai trimis prea multe oferte. Încearcă mai târziu.',POZA_INVALIDA:'Una dintre poze nu este validă (JPG, PNG sau WebP).',POZE_PREA_MARI:'Pozele sunt prea mari în total. Șterge una sau încarcă poze mai mici.',AN_INVALID:'Anul trebuie să fie între 1950 și anul viitor.',OFERTA_EXISTA:'Ai deja o ofertă în așteptare la această cerere.',PREA_MULTE_MESAJE:'Ai trimis prea multe mesaje. Încearcă mai târziu.',MESAJ_INVALID:'Mesajul este gol sau prea lung.',DESTINATAR_INVALID:'Destinatar invalid.',ID_INVALID:'Cerere invalidă.',EROARE_SERVER:'A apărut o eroare pe server.',COMANDA_PROPRIE:'Nu poți comanda propriul anunț.',CANTITATE_INVALIDA:'Cantitatea cerută nu este disponibilă.',ADRESA_LIPSA:'Completează județul, localitatea și adresa de livrare.',STORAGE_EROARE:'Pozele nu au putut fi încărcate. Încearcă din nou.',COMANDA_EXISTA:'Ai deja o comandă în așteptare pentru acest anunț.',COMANDA_INCHISA:'Comanda este deja închisă.',PREA_MULTE_COMENZI:'Ai trimis prea multe comenzi. Încearcă mai târziu.',CANNOT_BLOCK_SELF:'Nu îți poți bloca propriul cont.',DATABASE_NOT_CONFIGURED:'Baza de date nu este configurată pe server.',DESTINATAR_NEGASIT:'Nu am găsit niciun utilizator cu acest nickname.',
  PLATA_ONLINE_INDISPONIBILA:'Plata online nu este activată încă. Până atunci, administratorul îți poate adăuga credite în cont.',PLAN_INVALID:'Pachet de credite invalid.',SESIUNE_INVALIDA:'Sesiunea de plată nu aparține contului tău.'
};
const CATEGORY_TREE = [
 ['Accesorii auto','🧰',['Covorașe și protecții','Huse scaune','Portbagaje și bare transversale','Cârlige de remorcare','Parasolare','Suporturi telefon','Camere video auto','Alte accesorii']],
 ['Accesorii roți','🛞',['Capace roți','Prezoane și piulițe','Inele centrare','Distanțiere','Senzori TPMS','Lanțuri de zăpadă','Alte accesorii roți']],
 ['Aprindere','⚡',['Bujii','Bobine de inducție','Distribuitor','Cabluri bujii','Module de aprindere','Bujii incandescente','Alte piese aprindere']],
 ['Cabluri auto','🔌',['Cabluri accelerație','Cabluri ambreiaj','Cabluri frână de mână','Cabluri schimbător','Cabluri pornire','Cabluri remorcare','Instalații electrice','Alte cabluri']],
 ['Car audio','🔊',['Radio / Casetofon','Navigații / Multimedia','Boxe','Amplificatoare','Subwoofere','Antene','Alte piese car audio']],
 ['Caroserie','🚗',['Usă față','Usă spate','Usă hayon / Portbagaj','Capotă','Bară față','Bară spate','Aripă față','Aripă spate','Portieră','Prag','Podea / Planșeu','Panou față','Panou spate','Stâlp A','Stâlp B','Stâlp C','Cadru față','Cadru spate','Grille / Mască','Oglinzi','Geamuri','Parbriz','Lunetă','Plafon','Elemente de tablă','Alte piese caroserie']],
 ['Climatizare','❄️',['Compresor AC','Condensator','Radiator AC','Radiator încălzire','Ventilator habitaclu','Filtru polen','Panou climatizare','Uscător','Alte piese climatizare']],
 ['Direcție','🎯',['Casetă direcție','Pompă servodirecție','Bieletă direcție','Capete de bară','Cardan volan','Volan','Rezervor servodirecție','Alte piese direcție']],
 ['Diverse','📦',[]],
 ['Electrică & Electronică Auto','🔋',['Alternator','Electromotor','Baterii','Senzori','Calculatoare / ECU','Relee și siguranțe','Butoane și comenzi','Motorașe ștergătoare','Întrerupătoare','Modul confort','Chei și telecomenzi','Instalație electrică','Alte piese electrice']],
 ['Evacuare','💨',['Catalizator','Filtru particule (DPF)','Tobă finală','Tobă intermediară','Colector evacuare','Țeavă evacuare','Sondă lambda','Supapă EGR','Alte piese evacuare']],
 ['Faruri stopuri lumini','💡',['Faruri','Stopuri','Proiectoare ceață','Lumini de zi','Semnalizări','Becuri','Lămpi interior','Alte lumini']],
 ['Filtre auto','🧴',['Filtru ulei','Filtru aer','Filtru combustibil','Filtru habitaclu','Filtru cutie automată','Alte filtre']],
 ['Frâne','🛑',['Discuri frână față','Discuri frână spate','Plăcuțe frână față','Plăcuțe frână spate','Etrieri față','Etrieri spate','Saboți și tamburi','Pompă frână','Servofrână','Furtunuri frână','ABS / ESP','Frână de mână','Cilindru frână','Lichid de frână','Alte piese frâne']],
 ['Instalații GPL','🔥',['Rezervoare GPL','Truse GPL','Injectoare GPL','Reductoare','Electrovalve','Alte piese GPL']],
 ['Interioare auto','💺',['Scaune față','Scaune spate','Banchetă spate','Bord','Consolă centrală','Volan','Airbag','Centuri de siguranță','Panouri uși','Tapiserie / Mochete','Plafon / Ciel','Cotiere','Mânere','Torpedou','Cotieră centrală','Alte piese interior']],
 ['Întreținere auto','🧽',['Soluții de curățare','Ceruire și lustruire','Aditivi','Lichid parbriz','Lichid de frână','Antigel','Alte produse întreținere']],
 ['Jante & Anvelope','🛞',['Jante aliaj','Jante tablă','Anvelope vară','Anvelope iarnă','Anvelope all-season','Alte jante și anvelope']],
 ['Navigație GPS','🧭',['Sisteme de navigație','Hărți și actualizări','Suporturi GPS','Camere marșarier','Alte produse GPS']],
 ['Pachete revizie','🧾',['Pachet ulei + filtre','Pachet distribuție','Pachet frâne','Pachet ambreiaj','Alte pachete']],
 ['Piese moto','🏍️',['Frâne moto','Filtre moto','Transmisie moto','Anvelope moto','Electrice moto','Ulei moto','Alte piese moto']],
 ['Piese motoare','⚙️',['Bloc motor','Chiulasă','Pistoane și biele','Arbore cotit','Distribuție','Garnituri','Supape','Pompă ulei','Pompă apă / ulei','Radiatoare și răcire','Carter','Suporți motor','Cuzineți','Turbină','Motor complet','Alte piese motor']],
 ['Pompe și injectoare','⛽',['Pompă combustibil','Pompă înaltă presiune','Injectoare','Rampă injecție','Regulator presiune','Rezervor','Carburator','Corp accelerație','Conducte combustibil','Alte piese alimentare']],
 ['Punte și rulmenți','🔘',['Rulmenți roți față','Rulmenți roți spate','Butuci față','Butuci spate','Planetare','Cuzineți punte','Elemente de punte','Fuzete','Punte față','Punte spate','Alte piese punte']],
 ['Răcire','🌡️',['Radiator apă','Pompă apă','Termostat','Ventilator răcire','Vas expansiune','Furtunuri răcire','Intercooler','Alte piese răcire']],
 ['Scule auto','🛠️',['Chei și truse','Cricuri și elevatoare','Scule diagnoză','Aparate de testare','Scule specializate','Alte scule']],
 ['Suspensie','🔩',['Amortizatoare','Arcuri','Brațe suspensie','Bielete','Rulmenți roți','Fuzete','Bucșe','Bară stabilizatoare','Punte spate','Perne de aer','Alte piese suspensie']],
 ['Transmisie','🔧',['Cutie de viteze','Ambreiaj','Volantă','Planetare / Cardan','Diferențial','Cutie transfer','Alte piese transmisie']],
 ['Tuning','🏁',['Filtre sport','Evacuare sport','Spoilere','Suspensii sport','Elemente de aspect','Alte piese tuning']],
 ['Turbo','🌀',['Turbosuflante','Kituri reparație turbo','Actuatoare turbo','Furtunuri și conducte turbo','Alte piese turbo']],
 ['Ulei auto','🛢️',['Ulei motor','Ulei cutie de viteze','Ulei diferențial','Ulei servodirecție','Lichide hidraulice','Alte uleiuri']],
 ['Xenon','🔦',['Becuri xenon','Balasturi','Kituri xenon','Drivere de aprindere','Lentile și proiectoare','Alte piese xenon']],
];
const CATEGORIES = CATEGORY_TREE.map(c=>[c[0],c[1]]);
const COUNTIES = ['Alba','Arad','Argeș','Bacău','Bihor','Bistrița-Năsăud','Botoșani','Brăila','Brașov','București','Buzău','Caraș-Severin','Călărași','Cluj','Constanța','Covasna','Dâmbovița','Dolj','Galați','Giurgiu','Gorj','Harghita','Hunedoara','Ialomița','Iași','Ilfov','Maramureș','Mehedinți','Mureș','Neamț','Olt','Prahova','Satu Mare','Sălaj','Sibiu','Suceava','Teleorman','Timiș','Tulcea','Vaslui','Vâlcea','Vrancea'];
const STATUS_LABEL = {pending:['În așteptare','pending'],approved:['Publicat','new'],sold:['Vândut','pending'],rejected:['Respins','bad'],blocked:['Blocat','bad'],deleted:['Șters','bad']};
const REPORT_REASONS = ['Preț înșelător','Piesa nu există / escrocherie','Conținut necorespunzător','Anunț duplicat','Altceva'];
const ROUTES = {home:'page-home',rezultate:'page-results',menu:'page-menu',cont:'page-account',cerere:'page-request-pick','cerere-noua':'page-request',vinde:'page-sell',dezmembrari:'page-dism',servicii:'page-services',admin:'page-admin',match:'page-match',requests:'page-requests',stores:'page-stores',saved:'page-saved','anunturile-mele':'page-mine','account-tool':'page-account-tool',mesagerie:'page-messages',privacy:'page-privacy',rules:'page-rules',contact:'page-contact',cookies:'page-cookies',terms:'page-terms','reset-password':'page-reset-password',settings:'page-settings','verify-email-change':'page-verify-email-change','verify-email':'page-verify-email'};
const AUTH_ROUTES = new Set(['cont','cerere','cerere-noua','vinde','settings','admin','anunturile-mele','mesagerie']);
const FILTER_FIELDS = {filterType:'type',filterCategory:'category',filterMake:'make',filterModel:'model',filterCondition:'condition',filterCounty:'county',minPrice:'minPrice',maxPrice:'maxPrice',yearFrom:'yearFrom',yearTo:'yearTo',filterFuel:'fuel',filterSeller:'seller_type',sortListings:'sort'};

/* ---------- utilitare ---------- */
function readJSON(key, def){ try{ const v=JSON.parse(localStorage.getItem(key)); return v==null?def:v; }catch{ return def; } }
function writeJSON(key, v){ try{ localStorage.setItem(key, JSON.stringify(v)); }catch{} }
function esc(s=''){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function cleanOemAlt(raw){
 const list=Array.isArray(raw)?raw:String(raw||'').split(/[,;\n|]+/);
 const out=[],seen=new Set();
 for(const item of list){
  const code=String(item||'').toUpperCase().replace(/[^A-Z0-9 .\/-]/g,'').replace(/\s+/g,' ').trim().slice(0,40);
  if(!code)continue;
  const key=code.replace(/[^A-Z0-9]/g,'');
  if(!key||seen.has(key))continue;
  seen.add(key);out.push(code);
  if(out.length>=12)break;
 }
 return out.join(', ')||null;
}
function money(n){ return Number(n)>0 ? new Intl.NumberFormat('ro-RO').format(Number(n))+' lei' : 'La cerere'; }
/* Reducere: procent valid (1-50) doar dacă există preț; prețul nou se rotunjește la leu. */
function discOf(x){ const d=Math.round(Number(x&&x.discount_percent)||0); return (Number(x&&x.price)>0 && d>0 && d<=50) ? d : 0; }
function discPrice(x){ return Math.round(Number(x.price)*(1-discOf(x)/100)); }
function priceHtml(x){
  const d=discOf(x);
  return d ? `<span class="price-old"><del>${esc(money(x.price))}</del></span> <span class="price-new">${esc(money(discPrice(x)))}</span> <span class="price-pct">-${d}%</span>` : esc(money(x.price));
}
/* Anunț promovat: insignă + dată de expirare */
function promoUntilTxt(x){ const d=new Date(x&&x.promoted_until); return isNaN(d)?'':d.toLocaleDateString('ro-RO',{day:'numeric',month:'short'}); }
function promoBadge(){ return '<span class="promo-badge" title="Anunț promovat"><span aria-hidden="true">⭐</span> Promovat</span>'; }
function fmtDate(iso){ const d=new Date(iso); return isNaN(d)?'':d.toLocaleDateString('ro-RO'); }
function fmtDateTime(iso){
  const d=new Date(iso); if(isNaN(d)) return '';
  return d.toLocaleDateString('ro-RO',{day:'numeric',month:'short',year:'numeric'})+', '+d.toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'});
}
function fmtAgo(iso){
  const d=new Date(iso); if(isNaN(d)) return '';
  const m=Math.floor((Date.now()-d.getTime())/60000);
  if(m<1) return 'chiar acum';
  if(m<60) return 'acum '+(m===1?'un minut':m+' minute');
  const h=Math.floor(m/60); if(h<24) return 'acum '+(h===1?'o oră':h+' ore');
  const z=Math.floor(h/24); if(z<30) return 'acum '+(z===1?'o zi':z+' zile');
  const l=Math.floor(z/30); if(l<12) return 'acum '+(l===1?'o lună':l+' luni');
  const a=Math.floor(l/12); return 'acum '+(a===1?'un an':a+' ani');
}
function fmtRelDay(iso){
  const d=new Date(iso); if(isNaN(d)) return '';
  const t=d.toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'}), day=x=>new Date(x.getFullYear(),x.getMonth(),x.getDate()).getTime();
  const diff=Math.round((day(new Date())-day(d))/86400000);
  return diff===0?'Azi, '+t:(diff===1?'Ieri, '+t:fmtDateTime(iso));
}
function fmtUpdated(iso){
  const d=new Date(iso); if(isNaN(d)) return '';
  const now=new Date(), y=new Date(now); y.setDate(now.getDate()-1);
  const hm=d.toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'});
  if(d.toDateString()===now.toDateString()) return 'Actualizat azi la '+hm;
  if(d.toDateString()===y.toDateString()) return 'Actualizat ieri la '+hm;
  return 'Actualizat la '+d.toLocaleDateString('ro-RO',{day:'2-digit',month:'short',year:'numeric'});
}
const SELLER_SHORT={'Parc dezmembrări':'Parc dezmembrări','Firmă':'Firmă','Persoană fizică':'Particular'};
function adsLabel(n){ n=Number(n)||0; return n===1?'1 anunț':n+' anunțuri'; }
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
const state = { mode:'search', filters:{}, loaded:[], total:0, offset:0, token:0, extra:{}, sellImages:[], reqImages:[], offerImages:[] };

async function api(url, opt={}){
  const isGet = !opt.method || String(opt.method).toUpperCase()==='GET';
  let r, txt='', d = {}, tries = 0;
  for(;;){
    try{
      r = await fetch(url,{credentials:'same-origin',...opt,headers:{'Content-Type':'application/json',...(opt.headers||{})}});
    }catch{
      if(isGet && tries++<2){ await new Promise(s=>setTimeout(s,2500)); continue; }
      throw new Error('Nu mă pot conecta la server. Verifică internetul.');
    }
    // Serverul gratuit Render se trezește greu: 502/503/504 la GET se reîncearcă automat.
    if(isGet && [502,503,504].includes(r.status) && tries++<2){ await new Promise(s=>setTimeout(s,2500)); continue; }
    break;
  }
  try{ txt = await r.text(); }catch{}
  let badJson = false;
  if(txt){ try{ d = JSON.parse(txt); }catch{ badJson = true; d = {}; } }
  if(!r.ok){
    if(r.status===401 && d.error==='AUTH_REQUIRED' && currentUser){ currentUser=null; renderHeader(); }
    if(r.status===403 && d.error==='BOT_CHECK'){ try{ const last=Number(sessionStorage.getItem('bc_reload'))||0; if(Date.now()-last>60000){ sessionStorage.setItem('bc_reload',String(Date.now())); location.reload(); } }catch{} }
    const e = new Error(ERR[d.error] || d.message || (badJson ? 'Serverul nu a răspuns corect (pornește sau este suprasolicitat). Încearcă din nou în câteva secunde.' : 'A apărut o eroare.'));
    e.code = d.error; e.status = r.status; throw e;
  }
  if(badJson){ const e = new Error('Serverul a trimis un răspuns invalid. Reîncarcă pagina și încearcă din nou.'); e.code='BAD_JSON'; e.status=r.status; throw e; }
  if(currentUser && !/^\/api\/counts/.test(url) && (/^\/api\/(messages|notifications|orders|offers|requests|listings\/mine)/.test(url) || (opt.method && opt.method!=='GET'))) scheduleCounts();
  return d;
}

/* ---------- Contoare / insigne (total în meniu, număr pe fiecare buton) ---------- */
let counts = null, countsTimer = null, countsBusy = false;
function scheduleCounts(){ clearTimeout(countsTimer); countsTimer = setTimeout(refreshCounts, 700); }
function badgeText(n){ n = Number(n)||0; return n<=0 ? '' : (n>99 ? '99+' : String(n)); }
function renderCounts(){
  const c = counts || {};
  const map = { total:c.total, expire:c.expire, messages:c.messages, orders_seller:c.orders_seller, orders_buyer:c.orders_buyer, offers_received:c.offers_received, alerts:c.alerts, sec_seller:(c.expire||0)+(c.orders_seller||0), sec_buyer:(c.offers_received||0)+(c.orders_buyer||0), sec_msgs:(c.messages||0)+(c.alerts||0) };
  const mb = document.getElementById('menuBadge'); if(mb) mb.textContent = badgeText(c.total);
  document.querySelectorAll('[data-cnt]').forEach(el=>{ el.textContent = badgeText(map[el.dataset.cnt]); });
  renderNotifSummary();
}
async function refreshCounts(){
  if(!currentUser){ counts = null; renderCounts(); return; }
  if(countsBusy) return; countsBusy = true;
  try{ counts = await api('/api/counts'); }catch{ /* păstrăm ultimele valori */ }
  countsBusy = false; renderCounts();
}
setInterval(()=>{ if(currentUser && !document.hidden) refreshCounts(); }, 60000);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden && currentUser) refreshCounts(); });

/* ---------- navigare ---------- */
function parseHash(){
  const raw = location.hash.replace(/^#\/?/,'');
  const [name, qs] = raw.split('?');
  return { name: name || 'home', params: new URLSearchParams(qs||'') };
}
function navigate(x){ const target='#/'+x; if(location.hash===target) route(); else location.hash=target; }
function needsAuth(name, params){ return AUTH_ROUTES.has(name) || (name==='account-tool' && !['cart','reviews'].includes(params.get('view'))) || (name==='requests' && params.get('t')==='mine') || (name==='rezultate' && ['mine'].includes(params.get('mode'))); }
function showPage(id){ $$('.page').forEach(p=>p.classList.toggle('active',p.id===id)); window.scrollTo(0,0); }

const BN_MAP={home:'home',rezultate:'rezultate',saved:'rezultate',vinde:'vinde',mesagerie:'mesagerie',cont:'cont',settings:'cont','anunturile-mele':'cont'};
function setBottomNav(name){ const t=BN_MAP[name]||''; $$('#bottomNav [data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab===t)); }
const SKEL=Array(6).fill('<div class="ar-row ar-skel"><div class="skel ar-thumb"></div><div class="ar-main"><div class="skel skel-line"></div><div class="skel skel-line short"></div></div></div>').join('');
function route(){
  const dm=$('#detailModal'); if(dm) dm.classList.add('hidden'); const rm=$('#requestModal'); if(rm) rm.classList.add('hidden'); closeLightbox();
  const { name, params } = parseHash();
  if(name==='menu'){ history.replaceState(null,'',location.pathname+location.search+'#/home'); route(); openMenu(); return; }
  closeMenu(true);
  const id = ROUTES[name];
  if(!id){ navigate('home'); return; }
  if(needsAuth(name, params) && !currentUser){
    showPage('page-home'); loadHome();
    openAuth(location.hash.replace(/^#\//,''));
    return;
  }
  showPage(id); setBottomNav(name);
  if(name==='home'){ $('#topSearchInput').value=''; $('#homeSearchInput').value=''; loadHome(); }
  else if(name==='rezultate') enterResults(params);
  else if(name==='cerere') safe(enterCarPick)();
  else if(name==='cerere-noua') safe(enterRequestForm)(params.get('from'),params.get('edit'));
  else if(name==='vinde') safe(enterSell)(params.get('edit'),params.get('t'));
  else if(name==='dezmembrari') loadDism();
  else if(name==='requests') loadRequests(params.get('t')==='mine');
  else if(name==='stores') loadStores(params.get('t')==='parks');
  else if(name==='saved') renderSaved();
  else if(name==='anunturile-mele') safe(enterMine)(params.get('tab'));
  else if(name==='cont') renderAccount();
  else if(name==='settings') safe(loadSettings)();
  else if(name==='verify-email-change') safe(confirmEmailChange)(params);
  else if(name==='verify-email') safe(confirmEmail)(params);
  else if(name==='admin') safe(loadAdmin)();
  else if(name==='mesagerie') safe(enterMessages)(params.get('box'));
  else if(name==='account-tool'){
    if(params.get('view')==='messages' && !params.get('with')){ history.replaceState(null,'','#/mesagerie'); route(); return; }
    renderAccountTool(params.get('view'), params.get('with'), params.get('ref'));
    const pay=params.get('pay');
    if(pay){
      toast(pay==='ok'?'Plata a fost procesată. Creditele au fost adăugate în cont. ✅':'Plata a fost anulată. Nu ai fost taxat.');
      history.replaceState(null,'','#/account-tool?view='+(params.get('view')||'credits'));
    }
  }
  if(name==='servicii'){ renderServices(); loadServices(); }
}

/* ---------- meniu lateral (panou suprapus, liquid glass) ---------- */
function openMenu(){
  const d=$('#menuDrawer'); if(!d || d.classList.contains('open')) return;
  renderHeader();
  d.removeAttribute('inert'); d.setAttribute('aria-hidden','false');
  document.documentElement.classList.add('menu-open');
  $('#menuBtn').setAttribute('aria-expanded','true');
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ d.classList.add('open'); $('#menuScrim').classList.add('open'); }));
  setTimeout(()=>{ if(d.classList.contains('open')) $('#closeMenu').focus({preventScroll:true}); },60);
}
function closeMenu(instant){
  const d=$('#menuDrawer'); if(!d || !d.classList.contains('open')) return;
  const hadFocus=d.contains(document.activeElement);
  d.classList.remove('open'); $('#menuScrim').classList.remove('open');
  d.setAttribute('aria-hidden','true'); d.setAttribute('inert','');
  document.documentElement.classList.remove('menu-open');
  $('#menuBtn').setAttribute('aria-expanded','false');
  if(hadFocus && !instant) $('#menuBtn').focus({preventScroll:true});
}

function renderHeader(){
  const label = currentUser ? (currentUser.nickname || currentUser.name || 'Contul meu') : 'Intră în cont';
  $('#accountLabel').textContent = label;
  $('#menuAccountText').textContent = currentUser ? label : 'Intră în cont';
  const isAdmin = !!(currentUser && (currentUser.role==='admin' || currentUser.role==='moderator'));
  $('#adminMenu').classList.toggle('hidden', !isAdmin);
  const ad = $('#accountAdmin'); if(ad) ad.classList.toggle('hidden', !isAdmin);
  $('#favCount').textContent = favorites.length;
  renderVerifyBanner();
  refreshCounts();
}
/* ---------- Poză de profil ---------- */
const avInit = n => esc((String(n||'').trim().charAt(0)||'?').toUpperCase());
function avatarSpan(id,name,cls,has){
  const img=(id&&has!==false)?`<img src="/api/users/${Number(id)}/avatar" alt="" loading="lazy" decoding="async" data-av>`:'';
  return `<span class="${cls} av-img"><i>${avInit(name)}</i>${img}</span>`;
}
/* CSP nu permite onerror inline: dacă poza lipsește, rămâne litera */
document.addEventListener('error',e=>{ const t=e.target; if(t&&t.tagName==='IMG'&&t.hasAttribute('data-av')) t.remove(); },true);
function avatarToDataUrl(file){
  return new Promise((resolve,reject)=>{
    if(!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error('Alege o poză JPG, PNG sau WebP.'));
    const rd=new FileReader();
    rd.onload=()=>{ const img=new Image(); img.onload=()=>{
      const S=320, side=Math.min(img.width,img.height), sx=(img.width-side)/2, sy=(img.height-side)/2;
      const cv=document.createElement('canvas'); cv.width=cv.height=S; const ctx=cv.getContext('2d');
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,S,S); ctx.drawImage(img,sx,sy,side,side,0,0,S,S);
      let out=cv.toDataURL('image/jpeg',.85); if(out.length>190000) out=cv.toDataURL('image/jpeg',.6);
      if(out.length>190000) return reject(new Error('Poza este prea complexă. Încearcă alta.'));
      resolve(out);
    }; img.onerror=()=>reject(new Error('Imaginea nu a putut fi citită.')); img.src=rd.result; };
    rd.onerror=()=>reject(new Error('Fișierul nu a putut fi citit.')); rd.readAsDataURL(file);
  });
}
/* Poza de profil: o apăsare = poza mărită (cu coș pentru ștergere); fără poză: alegi una direct */
function setupAvatarHold(){
  const btn=$('#avatarBtn'); if(!btn||btn.dataset.hold) return; btn.dataset.hold='1';
  let ov=null;
  function closePreview(){ if(ov){ ov.remove(); ov=null; } }
  function openPreview(){
    const img=btn.querySelector('img[data-av]'); if(!img) return;
    closePreview();
    ov=document.createElement('div'); ov.className='avatar-preview'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-label','Poza de profil');
    const big=document.createElement('img'); big.src=img.src; big.alt='Poza de profil';
    ov.append(big);
    const del=document.createElement('button'); del.type='button'; del.className='avatar-del'; del.textContent='🗑️'; del.setAttribute('aria-label','Șterge poza'); del.title='Șterge poza';
    del.addEventListener('click',ev=>{ ev.stopPropagation(); if(confirm('Ștergi poza de profil?')){ closePreview(); removeAvatar(); } });
    ov.append(del);
    ov.addEventListener('click',closePreview);
    document.body.appendChild(ov);
  }
  btn.addEventListener('click',()=>{
    if(currentUser&&currentUser.has_avatar===true) openPreview(); else $('#avatarFile').click();
  });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closePreview(); });
}
/* Poza altui utilizator: o apăsare pe poză din cardul vânzătorului o deschide mărită */
document.addEventListener('click',e=>{
  const img=e.target.closest&&e.target.closest('.seller-avatar img[data-av]'); if(!img) return;
  e.preventDefault(); e.stopPropagation();
  const old=document.querySelector('.avatar-preview'); if(old) old.remove();
  const ov=document.createElement('div'); ov.className='avatar-preview'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-label','Poza de profil');
  const big=document.createElement('img'); big.src=img.src; big.alt='Poza de profil';
  ov.append(big);
  const close=()=>{ ov.remove(); document.removeEventListener('keydown',onKey); };
  const onKey=ev=>{ if(ev.key==='Escape') close(); };
  ov.addEventListener('click',close); document.addEventListener('keydown',onKey);
  document.body.appendChild(ov);
},true);
/* Panourile care se deschid (Contact, Filtrare, Sortare, Notificări) se închid când apeși în afara lor */
document.addEventListener('click',e=>{
  const t=e.target; if(!t||!t.closest) return;
  $$('.contact-fold').forEach(f=>{
    const p=f.querySelector('.contact-panel'); if(!p||p.classList.contains('hidden')||f.contains(t)) return;
    p.classList.add('hidden'); const b=f.querySelector('[data-contact-toggle]'); if(b){ b.setAttribute('aria-expanded','false'); b.classList.remove('open'); }
  });
  const f=$('#filters');
  if(f&&f.classList.contains('open')&&!f.contains(t)&&!t.closest('#filterToggle')) f.classList.remove('open');
  [['#mineFilterPanel','#mineFilterBtn'],['#mineSortPanel','#mineSortBtn'],['#msgFilterPanel','#msgFilterBtn'],['#notifSummary','#notifBtn']].forEach(([pi,bi])=>{
    const p=$(pi); if(!p||p.classList.contains('hidden')||p.contains(t)||t.closest(bi)) return;
    p.classList.add('hidden'); const b=$(bi); if(b&&b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded','false');
  });
});
function renderAccountAvatar(bust){
  const b=$('#avatarBtn'); if(!b||!currentUser) return;
  const has=currentUser.has_avatar===true;
  b.innerHTML='<i>👤</i>'+(has?`<img src="/api/users/${Number(currentUser.id)}/avatar${bust?'?v='+bust:''}" alt="" data-av>`:'');
}
async function onAvatarPick(){
  const inp=$('#avatarFile'), f=inp.files[0]; if(!f) return;
  try{
    const data=await avatarToDataUrl(f);
    await api('/api/account/avatar',{method:'PUT',body:JSON.stringify({avatar:data})});
    currentUser.has_avatar=true; renderAccountAvatar(Date.now()); toast('Poza de profil a fost salvată.');
  }catch(err){ toast(err.message||'Poza nu a putut fi salvată.'); }
  inp.value='';
}
async function removeAvatar(){
  try{ await api('/api/account/avatar',{method:'PUT',body:JSON.stringify({remove:true})}); currentUser.has_avatar=false; renderAccountAvatar(); toast('Poza de profil a fost ștearsă.'); }
  catch(err){ toast(err.message||'Poza nu a putut fi ștearsă.'); }
}
function syncBillType(){
  const t=(document.querySelector('input[name="billType"]:checked')||{}).value;
  $('#billPfBox').classList.toggle('hidden',t==='pj'); $('#billPjBox').classList.toggle('hidden',t!=='pj');
}
function renderAccountRatings(){
  const el=$('#accRating'); if(!el||!currentUser) return;
  el.innerHTML='';
  api('/api/sellers/'+currentUser.id+'/ratings').then(r=>{
    if(!currentUser||!el.isConnected) return;
    const part=(label,role,p)=>`<button type="button" class="text-btn acc-rate-row" data-reviews="${Number(currentUser.id)}" data-role="${role}">${label} `+(p&&p.count?`${starsHtml(p.avg)} <b>${esc(String(p.avg).replace('.',','))}</b> (${p.count})`:`<span class="muted">fără calificative</span>`)+`</button>`;
    el.innerHTML=part('Vânzător','seller',r.seller)+part('Cumpărător','buyer',r.buyer);
  }).catch(()=>{});
}
function renderAccount(){
  $('#accountHello').textContent = `Salut, ${currentUser.nickname || currentUser.name || 'utilizator'}!`;
  renderAccountAvatar();
  renderAccountRatings();
  api('/api/credits').then(r=>{ const el=$('#accCredits'); if(el) el.textContent=r.balance; }).catch(()=>{});
  api('/api/account/settings').then(r=>{ if(currentUser&&r.user){ currentUser.has_avatar=!!r.user.has_avatar; renderAccountAvatar(); } }).catch(()=>{});
  renderHeader();
  /* pe telefon pornește cu o singură secțiune deschisă */
  if(window.matchMedia('(max-width:800px)').matches){
    $$('#page-account .account-sections details[open]').forEach((d,i)=>{ if(i>0) d.removeAttribute('open'); });
  }
}

function renderAccountTool(view, withId, refId){
  const data = {
    cart:{title:'Coșul meu',text:'Anunțurile pe care vrei să le ții la îndemână.',action:'rezultate',label:'Vezi piesele'},
    offers:{title:'Răspunsuri la cereri',text:'Aici vei putea trimite și gestiona ofertele pentru cererile de piese.',action:'requests',label:'Vezi cererile disponibile'},
    'orders-seller':{title:'Comenzi primite',text:'Comenzile primite din anunțurile tale și din ofertele acceptate vor apărea aici.',action:null,label:null},
    'offers-received':{title:'Ofertele primite',text:'Ofertele primite la cererile tale vor apărea aici.',action:'requests?t=mine',label:'Vezi cererile mele'},
    orders:{title:'Comenzile mele',text:'Comenzile tale vor apărea aici după ce comanzi o piesă sau după ce o ofertă este acceptată.',action:null,label:null},
    messages:{title:'Mesaje',text:'Conversațiile tale cu cumpărători și vânzători.',action:null,label:null},
    notifications:{title:'Notificări',text:'Notificările contului vor apărea aici când există activitate nouă.',action:null,label:null},
    credits:{title:'Credite',text:'Soldul și creditele contului vor apărea aici când funcția de creditare este activată.',action:null,label:null},
    transactions:{title:'Tranzacții',text:'Comenzile tale, ca cumpărător și ca vânzător.',action:null,label:null},
    invoices:{title:'Facturi',text:'Facturile emise pentru contul tău.',action:null,label:null},
    stats:{title:'Statistici',text:'Statistici pe cont (pe zile și luni) și pe fiecare anunț.',action:null,label:null},
    'offer-questions':{title:'Întrebări de la cumpărători',text:'Întrebările cumpărătorilor despre ofertele tale.',action:null,label:null},
    'bulk-price':{title:'Actualizare prețuri',text:'Modifici dintr-o dată prețurile anunțurilor tale active.',action:null,label:null},
    generator:{title:'Generator de anunțuri',text:'Completezi câteva date și primești titlul și descrierea gata de folosit.',action:null,label:null},
    b2b:{title:'B2B',text:'Instrumente pentru parcuri de dezmembrări, service-uri și magazine cu stoc mare.',action:null,label:null},
    order:{title:'Comanda ta',text:'Detaliile comenzii.',action:null,label:null},
    reviews:{title:'Recenzii',text:'',action:null,label:null},
    ratings:{title:'Calificativele mele',text:'Calificativele primite ca vânzător și ca cumpărător.',action:null,label:null}
  };
  if(view==='order'){ if(withId) lastOrderId=withId; else withId=lastOrderId; }
  { const eb=$('#accountToolEyebrow'); if(eb) eb.textContent=view==='reviews'?'RECENZII':'CONT'; }
  currentToolView=view;
  { const pg=$('#page-account-tool'); if(pg) pg.classList.toggle('is-reviews',view==='reviews'); }
  const d=data[view]||{title:'Cont',text:'Secțiunea nu a fost găsită.',action:null,label:null};
  $('#accountToolTitle').textContent=d.title;
  $('#accountToolSub').textContent=d.text;
  const content=$('#accountToolContent');
  if(content){
    if(view==='order'||view==='reviews'){ content.innerHTML=''; $('#accountToolSub').textContent=''; }
    else content.innerHTML=`<div class="info-card account-tool-card"><p>${esc(d.text)}</p>${d.action?`<button class="btn primary" data-action="${esc(d.action)}">${esc(d.label)}</button>`:''}</div>`;
    if(['offers','offers-received','orders','orders-seller','order','reviews','notifications','messages','cart','transactions','invoices','credits','stats'].includes(view)) safe(()=>loadToolData(view,content,withId,refId))();
    if(['offer-questions','bulk-price','generator','b2b','ratings'].includes(view)) safe(()=>renderUtilTool(view,content))();
  }
}


/* ---------- Utile: actualizare prețuri, generator, B2B, calificative, întrebări pe oferte ---------- */
function copyText(txt,okMsg){
  const done=()=>toast(okMsg||'Copiat.');
  if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(done,()=>toast('Nu am putut copia. Selectează textul manual.')); return; }
  const ta=document.createElement('textarea'); ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); done(); }catch{ toast('Nu am putut copia. Selectează textul manual.'); } ta.remove();
}
const lei=v=>esc(Number(v).toLocaleString('ro-RO'))+' lei';
async function renderUtilTool(view, box){
  if(view==='offer-questions'){
    box.innerHTML='<div class="info-card"><p class="muted">Se încarcă…</p></div>';
    let list=[];
    try{ const r=await api('/api/offer-questions'); list=r.questions||[]; }
    catch(e){ box.innerHTML=`<div class="info-card"><p class="muted">${esc(e.message)}</p></div>`; return; }
    if(!list.length){
      box.innerHTML=`<div class="info-card account-tool-card"><p>Nu ai încă întrebări pe ofertele tale. Când un cumpărător întreabă ceva despre o ofertă, întrebarea apare aici și poți răspunde direct.</p><button class="btn primary" data-go="mesagerie">Deschide Mesaje</button></div>`;
      return;
    }
    box.innerHTML='<div class="tool-list">'+list.map(q=>{
      const answered=!!q.answer;
      return `<div class="info-card tool-item oq-item" data-oq="${q.id}">
        <b>${esc(q.buyer_nick||'Cumpărător')} <span class="oq-req">· ${esc(q.request_title||'')}</span></b>
        <p class="oq-body">${esc(q.body)}</p>
        ${answered
          ? `<div class="oq-answer"><b>Răspunsul tău</b><p>${esc(q.answer)}</p><p class="muted">${esc(fmtDate(q.answered_at))}</p></div>`
          : `<div class="oq-form"><textarea class="oq-input" rows="2" maxlength="2000" placeholder="Scrie răspunsul pentru cumpărător…"></textarea><button type="button" class="btn primary" data-oq-send="${q.id}">Trimite răspunsul</button></div>`}
        <p class="muted">${esc(fmtDate(q.created_at))}${q.price?` · ${lei(q.price)}`:''}</p>
      </div>`;
    }).join('')+'</div>';
    return;
  }
  if(view==='b2b'){
    box.innerHTML=`<div class="info-card account-tool-card util-form"><p>Pentru parcuri de dezmembrări, service-uri și magazine care au multe piese: publici și ții la zi stocul rapid.</p>
      <button type="button" class="btn primary" data-csv-import>⇪ Import CSV (anunțuri în masă)</button>
      <button type="button" class="btn ghost" data-go="account-tool?view=bulk-price">Actualizare prețuri în masă</button>
      <button type="button" class="btn ghost" data-go="account-tool?view=generator">Generator de anunțuri</button></div>`;
    return;
  }
  if(view==='ratings'){
    box.innerHTML='<div class="info-card"><p class="muted">Se încarcă…</p></div>';
    const r=await api('/api/sellers/'+currentUser.id+'/ratings');
    const stars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
    const block=(t,p)=>`<div class="info-card tool-item"><b>${t}</b><p>${p.count?`<span class="stars">★</span> ${esc(String(p.avg))} din 5 · ${p.count} ${p.count===1?'calificativ':'calificative'}`:'Încă nu ai calificative.'}</p></div>`+
      p.ratings.map(x=>`<div class="info-card tool-item"><b>${stars(x.stars)}</b><p>${esc(x.comment||'Fără comentariu')}</p><p class="muted">${esc(x.who)} · ${fmtDate(x.created_at)}</p></div>`).join('');
    box.innerHTML='<div class="tool-list">'+block('Ca vânzător',r.seller)+block('Ca cumpărător',r.buyer)+'</div>';
    return;
  }
  if(view==='bulk-price'){
    box.innerHTML=`<div class="info-card clean-form util-form">
      <p class="form-note">Modifici prețul anunțurilor active (publicate sau în așteptare). Anunțurile fără preț („La cerere”) nu se schimbă. Prețul final rămâne între 5 și 10.000.000 lei, rotunjit la leu întreg. Vezi mai întâi o previzualizare.</p>
      <label>Operație<select id="bpDir"><option value="up">Creștere de preț</option><option value="down">Scădere de preț</option></select></label>
      <label>Valoare<input id="bpVal" type="number" inputmode="decimal" min="0" step="any" placeholder="ex. 10"></label>
      <label>Tip valoare<select id="bpMode"><option value="percent">Procent (%)</option><option value="amount">Sumă fixă (lei)</option></select></label>
      <label>Se aplică la<select id="bpCond"><option value="">Toate anunțurile</option><option value="Nouă">Doar piese noi</option><option value="Second-hand">Doar second-hand</option></select></label>
      <div class="row"><button type="button" class="btn ghost" id="bpPreview">Previzualizare</button><button type="button" class="btn primary hidden" id="bpApply">Aplică modificarea</button></div>
      <div class="util-out" id="bpOut" aria-live="polite"></div></div>`;
    const out=$('#bpOut',box), apply=$('#bpApply',box);
    const body=prev=>({preview:prev||undefined,direction:$('#bpDir',box).value,mode:$('#bpMode',box).value,value:Number($('#bpVal',box).value),condition:$('#bpCond',box).value});
    ['input','change'].forEach(ev=>box.addEventListener(ev,()=>{ apply.classList.add('hidden'); }));
    $('#bpPreview',box).addEventListener('click',safe(async()=>{
      const b=body(true); if(!(b.value>0)){ out.innerHTML='<p class="error-message">Introdu o valoare mai mare ca 0.</p>'; apply.classList.add('hidden'); return; }
      const r=await api('/api/listings/bulk-price',{method:'POST',body:JSON.stringify(b)});
      if(!r.count){ out.innerHTML=`<p class="muted">Niciun anunț nu s-ar modifica (${r.total} anunțuri cu preț verificate).</p>`; apply.classList.add('hidden'); return; }
      out.innerHTML=`<p><b>${r.count}</b> din ${r.total} anunțuri își schimbă prețul. Exemple:</p>`+r.sample.map(x=>`<div class="util-sample"><span>${esc(x.title)}</span><b>${lei(x.old)} → ${lei(x.next)}</b></div>`).join('');
      apply.textContent=`Aplică pe ${r.count} anunțuri`; apply.classList.remove('hidden');
    }));
    apply.addEventListener('click',safe(async()=>{
      const b=body(false); if(!confirm('Modifici prețurile acestor anunțuri? Acțiunea nu se poate anula automat.')) return;
      apply.disabled=true;
      try{ const r=await api('/api/listings/bulk-price',{method:'POST',body:JSON.stringify(b)});
        out.innerHTML=`<p class="ok-message">Gata: ${r.updated} prețuri actualizate.</p>`; apply.classList.add('hidden'); toast(r.updated+' prețuri actualizate.'); }
      finally{ apply.disabled=false; }
    }));
    return;
  }
  if(view==='generator'){
    box.innerHTML=`<div class="info-card clean-form util-form">
      <label>Piesa<input id="gnPart" maxlength="60" placeholder="ex. Far dreapta"></label>
      <label>Marca<input id="gnMake" maxlength="40" placeholder="ex. BMW"></label>
      <label>Model<input id="gnModel" maxlength="40" placeholder="ex. Seria 3 E90"></label>
      <label>An (opțional)<input id="gnYear" maxlength="9" placeholder="ex. 2008"></label>
      <label>Motorizare (opțional)<input id="gnEngine" maxlength="40" placeholder="ex. 2.0 diesel"></label>
      <label>Cod OEM (opțional)<input id="gnOem" maxlength="40" placeholder="ex. 63117161959"></label>
      <label>Stare<select id="gnCond"><option>Second-hand</option><option>Nouă</option></select></label>
      <label>Alte detalii (opțional)<textarea id="gnNotes" maxlength="300" placeholder="ex. mică zgârietură pe carcasă, funcționează perfect"></textarea></label>
      <div class="row"><button type="button" class="btn primary" id="gnGo">Generează</button></div>
      <div class="util-out" id="gnOut"></div></div>`;
    $('#gnGo',box).addEventListener('click',()=>{
      const v=id=>$('#'+id,box).value.trim(), part=v('gnPart'), make=v('gnMake'), model=v('gnModel');
      const out=$('#gnOut',box);
      if(!part||!make||!model){ out.innerHTML='<p class="error-message">Completează piesa, marca și modelul.</p>'; return; }
      const year=v('gnYear'), engine=v('gnEngine'), oem=v('gnOem'), cond=$('#gnCond',box).value, notes=v('gnNotes');
      const title=[part,make,model,year].filter(Boolean).join(' ').slice(0,150);
      const desc=[
        `${part} pentru ${make} ${model}${year?`, an ${year}`:''}${engine?`, motorizare ${engine}`:''}.`,
        `Stare: ${cond}.`,
        oem?`Cod OEM: ${oem}.`:'',
        notes?notes.replace(/\s+/g,' '):'',
        'Verifică compatibilitatea cu seria de șasiu sau cu codul OEM înainte de comandă. Trimit poze suplimentare la cerere.'
      ].filter(Boolean).join('\n');
      out.innerHTML=`<label>Titlu<input id="gnTitle" readonly value="${esc(title)}"></label><label>Descriere<textarea id="gnDesc" rows="7" readonly>${esc(desc)}</textarea></label>
        <div class="row"><button type="button" class="btn ghost" id="gnCopyT">Copiază titlul</button><button type="button" class="btn ghost" id="gnCopyD">Copiază descrierea</button><button type="button" class="btn primary" data-go="vinde">Adaugă anunț</button></div>`;
      $('#gnCopyT',out).addEventListener('click',()=>copyText(title,'Titlu copiat.'));
      $('#gnCopyD',out).addEventListener('click',()=>copyText(desc,'Descriere copiată.'));
    });
    return;
  }
}

const OFFER_ST={pending:'În așteptare',accepted:'Acceptată',rejected:'Respinsă'}, ORDER_ST={new:'Nouă',confirmed:'Confirmată',shipped:'Expediată',completed:'Finalizată',suspended:'Suspendată',cancelled:'Anulată'};
const CR_KIND={promo:'Promovare anunț',topup:'Încărcare credite',admin:'Ajustare de la administrator'};
const CREDIT_PACKS=[{id:'s',credits:50,lei:25,label:'50 credite'},{id:'m',credits:120,lei:50,label:'120 credite'},{id:'l',credits:300,lei:100,label:'300 credite'},{id:'xl',credits:700,lei:200,label:'700 credite'}];
async function loadToolData(view, box, withId, refId){
  const money=v=>esc(Number(v).toLocaleString('ro-RO'))+' lei';
  let items=[];
  if(view==='cart'){
    const ids=cartIds(); const res=await Promise.allSettled(ids.map(id=>api('/api/listings/'+id+'?noview=1')));
    const ok=[],gone=[]; res.forEach((r,i)=>{ if(r.status==='fulfilled') ok.push(r.value.listing); else if(r.reason&&r.reason.status===404) gone.push(ids[i]); });
    if(gone.length) writeJSON('autopiese_cart',ids.filter(i=>!gone.includes(i)));
    const total=ok.reduce((n,x)=>n+(discOf(x)?discPrice(x):(Number(x.price)||0)),0);
    items=ok.map(x=>{ const im=Array.isArray(x.images)&&x.images[0]?x.images[0]:''; return `<article class="ar-row" data-open="${x.id}" tabindex="0" role="link" aria-label="${esc(x.title)}"><div class="ar-thumb">${im?`<img src="${esc(im)}" alt="" loading="lazy" decoding="async">`:phHtml(x)}</div><div class="ar-main"><h3 class="ar-title">${esc(x.title)}</h3><div class="ar-sub">📍 ${esc(x.county||'România')}${x.seller_name?' · '+esc(x.seller_name):''}</div></div><div class="ar-acts"><button type="button" class="ar-btn ar-wide ar-primary" data-order="${x.id}">🛍️ Comandă</button><button type="button" class="ar-btn ar-del" data-cart-del="${x.id}" title="Elimină din coș" aria-label="Elimină din coș">🗑</button></div><div class="ar-foot"><span class="ar-views">👁 ${Number(x.views)||0}</span><span class="ar-qty">${Number(x.quantity)||1} buc.</span><span class="ar-price">${esc(money(x.price))}</span></div></article>`; });
    if(ok.length) items.push(`<div class="info-card tool-item"><b>Total estimat: ${esc(money(total))}</b><p class="muted">Apasă „Comandă” la fiecare piesă ca vânzătorul să primească comanda ta cu adresa de livrare. Plata se face direct cu vânzătorul.</p></div>`);
  }else if(view==='transactions'){
    const r=await api('/api/orders');
    items=r.orders.map(orderCardHtml);
  }else if(view==='credits'){
    const r=await api('/api/credits');
    const rows=r.tx.map(x=>`<div class="cr-row"><div><b>${esc(CR_KIND[x.kind]||x.kind)}</b><small>${esc(x.note||'')}${x.note?' · ':''}${esc(fmtDateTime(x.created_at))}</small></div><span class="cr-amt ${x.amount>0?'plus':'minus'}">${x.amount>0?'+':''}${x.amount}</span></div>`).join('');
    const packs=CREDIT_PACKS.map(p=>`<button type="button" class="btn primary cr-pack" data-buy-pack="${p.id}"><b>${p.label}</b><small>${p.lei} lei</small></button>`).join('');
    box.innerHTML=`<div class="tool-list">
      <div class="info-card cr-balance"><small>Credite în cont</small><b>${r.balance}</b></div>
      <div class="info-card tool-item"><b>Cât costă promovarea unui anunț</b><p>${r.plans.map(p=>`${p.days} zile — ${p.cost} credite`).join(' · ')}</p><p class="muted">Anunțul promovat apare primul în rezultate și în lista „Promovate” din Anunțurile mele.</p></div>
      <div class="info-card tool-item"><b>Încarcă credite online</b><p>Plată securizată cu cardul. Creditele ajung în cont imediat după plată.</p><div class="cr-packs">${packs}</div><p class="muted" id="crFallback" hidden>Plata online nu este activată încă. Până atunci, administratorul îți poate adăuga credite în cont.</p></div>
      <div class="info-card tool-item"><b>Istoric</b>${rows||'<p class="muted">Nicio mișcare încă.</p>'}</div></div>`;
    $$('.cr-pack',box).forEach(b=>b.addEventListener('click',async()=>{
      const old=b.innerHTML; b.disabled=true; b.innerHTML='Se pregătește plata…';
      try{
        const r2=await api('/api/payments/checkout',{method:'POST',body:JSON.stringify({pack:b.dataset.buyPack})});
        if(r2.url) window.location.href=r2.url; else throw new Error('Serverul nu a returnat linkul de plată.');
      }catch(err){
        b.disabled=false; b.innerHTML=old;
        const fb=$('#crFallback'); if(fb) fb.hidden=false;
        toast(err.message||'Nu am putut inițializa plata.');
      }
    }));
    return;
  }else if(view==='invoices'){
    const r=await api('/api/credits');
    const inv=r.tx.filter(x=>x.kind==='topup');
    items=inv.length?inv.map(x=>`<div class="info-card tool-item"><b>AP-${String(x.id).padStart(6,'0')}</b><p>${x.amount} credite${x.amount_lei?' · '+money(x.amount_lei):''}</p><p class="muted">${esc(fmtDateTime(x.created_at))}${x.note?' · '+esc(x.note):''}</p></div>`).concat(['<p class="muted ord-empty">Documentele de mai sus confirmă încărcarea creditelor. Factura fiscală o emite operatorul, pe baza datelor din Setări cont.</p>']):['<div class="info-card tool-item"><p>Nu există facturi emise. Completează datele de facturare în Setări cont ca să fie gata când vei avea nevoie.</p><div class="row"><button class="btn ghost small" data-go="settings">Deschide Setări cont</button></div></div>'];
  }else if(view==='stats'){
    statsPick='all'; statsView='cont'; accStats.data=null; accStats.sel.clear();
    box.insertAdjacentHTML('beforeend','<div id="statsBox"><div id="statsSwitch"></div><div id="statsBody"></div></div>'); drawStatsSwitch(); drawAccStats();
    const pAc=api('/api/stats/account?range='+accStats.range).then(d=>{ accStats.data=d; if(statsView==='cont') drawAccStats(); }).catch(e=>{ const b=$('#statsBody'); if(b&&statsView==='cont') b.innerHTML=accTabsHtml()+'<p class="muted">Nu am putut încărca statisticile contului. '+esc(e.message||'')+'</p>'; });
    const pLs=api('/api/stats/mine').then(d=>{ statsData=d; if(statsView!=='cont') drawStats(); }).catch(()=>{});
    await Promise.all([pAc,pLs]); return;
  }else if(view==='offers'){
    const r=await api('/api/offers/mine'); offersMine=r.offers;
    drawOffersReceived(box,r.offers,money,offerMineRowHtml,['request_title','buyer_name','message'],'oferte trimise'); return;
  }else if(view==='offers-received'){
    const r=await api('/api/offers/received');
    drawOffersReceived(box,r.offers,money); return;
  }else if(view==='orders'||view==='orders-seller'){
    const r=await api('/api/orders'+(view==='orders'?'?seen=buyer':'')), role=view==='orders'?'buyer':'seller';
    drawOrdersList(box,r.orders.filter(o=>o.role===role),view); return;
  }else if(view==='reviews'){
    await drawReviewsPage(box,withId,refId==='buyer'?'buyer':'seller'); return;
  }else if(view==='order'){
    const r=await api('/api/orders'), o=r.orders.find(x=>String(x.id)===String(withId));
    $('#accountToolTitle').textContent=o?'Comanda nr. '+o.id:'Comanda ta';
    if(!o){ box.innerHTML='<div class="info-card"><p class="muted">Comanda nu a fost găsită.</p><button type="button" class="btn ghost small" data-go="account-tool?view=orders">Comenzile mele</button></div>'; return; }
    box.innerHTML=orderDetailHtml(o); return;
  }else if(view==='messages'){
    if(withId){
      const r=await api('/api/messages/'+encodeURIComponent(withId)), nm=esc(r.other.name||'Utilizator');
      box.insertAdjacentHTML('beforeend',`<div class="tool-list"><div class="thread-head"><span class="thread-who">${avatarSpan(r.other.id,r.other.name||'U','mrow-av')}<b>${nm}</b></span><button type="button" class="text-btn" data-block-toggle="${esc(withId)}" data-blocked="${r.blocked_by_me?1:0}">${r.blocked_by_me?'Deblochează':'🚫 Blochează'}</button></div>${r.messages.map(m=>`<div class="info-card tool-item"><p>${esc(m.body)}</p>${m.ref_title&&m.listing_id?`<p class="muted">Ref: <button type="button" class="ref-link" data-open="${m.listing_id}">${esc(m.ref_title)}</button></p>`:''}<p class="muted">${m.mine?'Tu':nm} · ${fmtDate(m.created_at)}</p></div>`).join('')||'<p class="muted">Niciun mesaj încă.</p>'}${/^\d+$/.test(refId||'')?`<p class="muted">Mesajul tău va avea ca referință anunțul #${esc(refId)}.</p>`:''}${(r.blocked_by_me||r.blocked_me)?`<p class="muted">${r.blocked_by_me?'Ai blocat acest utilizator. Deblochează-l ca să îi poți scrie.':'Nu poți trimite mesaje acestui utilizator.'}</p>`:`<form class="clean-form" id="msgForm" data-to="${esc(withId)}" data-ref="${esc(/^\d+$/.test(refId||'')?refId:'')}"><textarea id="msgBody" rows="3" maxlength="2000" placeholder="Scrie un mesaj…" required></textarea><button class="btn primary">Trimite</button></form>`}</div>`);
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

/* ---------- comenzi din anunțuri / coș ---------- */

/* ---------- Comenzi: listă cu taburi + pagină de detaliu ---------- */
const ORD_TABS=[['active','Active',['new','confirmed','shipped']],['suspended','Suspendate',['suspended']],['completed','Finalizate',['completed']],['cancelled','Anulate',['cancelled']],['all','Toate',null]];
let ordTab='active';
let lastOrderId='';
function ordCls(st){ return st==='completed'?'ok':(st==='cancelled'?'bad':((st==='new'||st==='suspended')?'wait':'go')); }
function orderRowHtml(o){
  const money=Number(o.price||0).toLocaleString('ro-RO')+' lei', seller=o.role==='seller';
  const thumb=o.has_thumb?`<img src="/api/orders/${o.id}/thumb" alt="" loading="lazy" decoding="async">`:phHtml(null);
  return `<article class="ar-row ord-row" data-go="account-tool?view=order&with=${o.id}" tabindex="0" role="link" aria-label="Comanda nr. ${o.id}">
    <div class="ar-thumb">${thumb}</div>
    <div class="ar-main"><div class="ar-sub">Comanda nr. ${o.id}</div><h3 class="ar-title">${esc(o.title||'Comandă')}${Number(o.quantity)>1?' × '+Number(o.quantity):''}</h3>${o.other_name?`<div class="ar-meta">${seller?'Cumpărător':'Vânzător'}: ${esc(o.other_name)}</div>`:''}</div>
    <div class="ar-foot"><span class="ar-views">${esc(ORDER_ST[o.status]||o.status)}</span><span class="ar-qty">${esc(fmtDateTime(o.created_at))}</span><span class="ar-price">${esc(money)}</span></div></article>`;
}
function drawOrdersList(box,list,view){
  const inTab=(o,t)=>{ const d=ORD_TABS.find(x=>x[0]===t); return !d[2]||d[2].includes(o.status); };
  if(!ORD_TABS.some(t=>t[0]===ordTab)) ordTab='active';
  box.innerHTML=`<div class="ord-wrap"><div class="util-form ord-search"><input type="search" id="ordSearch" placeholder="Caută în comenzi" aria-label="Caută în comenzi" autocomplete="off"></div>
    <div class="acc-tabs ord-tabs" role="tablist">${ORD_TABS.map(t=>`<button type="button" role="tab" class="acc-tab ord-tab" data-ord-tab="${t[0]}">${t[1]} <em>${list.filter(o=>inTab(o,t[0])).length}</em></button>`).join('')}</div>
    <div class="ord-count" id="ordCount"></div><div class="ar-list ord-list" id="ordList"></div></div>`;
  const draw=()=>{
    const q=($('#ordSearch').value||'').trim().toLowerCase();
    const rows=list.filter(o=>inTab(o,ordTab)&&(!q||[o.id,o.title,o.other_name].join(' ').toLowerCase().includes(q)));
    $$('.ord-tab',box).forEach(b=>{ const on=b.dataset.ordTab===ordTab; b.classList.toggle('on',on); b.setAttribute('aria-selected',on?'true':'false'); });
    const lbl=(ORD_TABS.find(t=>t[0]===ordTab)||[])[1]||'';
    $('#ordCount').textContent=rows.length?`Comenzi ${lbl.toLowerCase()} (${rows.length})`:'';
    $('#ordList').innerHTML=rows.map(orderRowHtml).join('')||`<p class="muted ord-empty">${q?'Nicio comandă găsită.':'Nu există comenzi în această categorie.'}</p>`;
  };
  $('#ordSearch').addEventListener('input',draw);
  box.querySelector('.ord-tabs').addEventListener('click',e=>{ const b=e.target.closest('[data-ord-tab]'); if(!b) return; ordTab=b.dataset.ordTab; draw(); });
  box.addEventListener('keydown',e=>{ const r=e.target.closest&&e.target.closest('.ord-row'); if(r&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); navigate(r.dataset.go); } });
  draw();
}
function orderDetailHtml(o){
  const money=v=>esc(Number(v||0).toLocaleString('ro-RO'))+' lei', seller=o.role==='seller', qty=Math.max(1,Number(o.quantity)||1);
  const addr=[o.ship_address,o.ship_city,o.ship_county].filter(Boolean).join(', ');
  const closed=['cancelled','completed'].includes(o.status), btns=[];
  if(seller&&!closed){
    if(o.status==='new') btns.push(['confirmed','Confirmă comanda','primary']);
    if(o.status==='new'||o.status==='confirmed') btns.push(['shipped','Marchează expediată','primary']);
    btns.push(['completed','Finalizată','primary']);
    if(o.status==='suspended') btns.push(['confirmed','Reia comanda','ghost']); else btns.push(['suspended','Suspendată','ghost']);
    btns.push(['cancelled','Anulată','danger']);
  }else if(!seller&&o.status==='new') btns.push(['cancelled','Anulează comanda','danger']);
  const thumb=o.has_thumb?`<img src="/api/orders/${o.id}/thumb" alt="" loading="lazy" decoding="async">`:phHtml(null);
  const prod=o.listing_id?`<button type="button" class="seller-link ord-link" data-order-listing="${o.id}">${esc(o.title||'Comandă')}</button>`:`<span>${esc(o.title||'Comandă')}</span>`;
  const unit=Number(o.price||0)/qty;
  const party=o.other_name?`<div class="ord-party"><div class="ord-party-name">${(!seller&&o.other_id)?`<button type="button" class="seller-link" data-seller-profile="${o.other_id}">${esc(o.other_name)}</button>`:esc(o.other_name)}</div><div class="rate-line">${ratingLine({avg:o.other_rating_avg,count:o.other_rating_n},o.other_id,seller?'buyer':'seller')}</div>${(o.other_company&&o.other_person&&o.other_person!==o.other_company)?`<div class="ord-line">👤 ${esc(o.other_person)}</div>`:''}${o.other_id?`<button type="button" class="btn ghost small" data-go="account-tool?view=messages&with=${o.other_id}">✉ Scrie mesaj</button>`:''}</div>`:'';
  const reasonOn=o.status_reason&&['suspended','cancelled','completed'].includes(o.status);
  return `<div class="ord-detail">
    <div class="ord-head"><h3>Comanda nr. ${o.id} din ${esc(fmtDateTime(o.created_at))}</h3><button type="button" class="ar-btn ord-print" data-order-print="${o.id}" aria-label="Tipărește comanda" title="Tipărește">🖨</button></div>
    <div class="ord-status-box"><span class="ord-st">${esc(ORDER_ST[o.status]||o.status)}</span>${reasonOn?`<p class="ord-reason"><b>${seller?'Mesajul tău către cumpărător':'Mesaj de la vânzător'}:</b> ${esc(o.status_reason)}</p>`:''}</div>
    <div class="ord-prod"><div class="ar-thumb ord-big" data-order-listing="${o.id}">${thumb}</div><div class="ord-prod-main">${prod}<div class="ord-qty">${qty} buc. × ${money(unit)}</div></div></div>
    <div class="ord-totals"><div><span>Cost produse:</span><b>${money(o.price)}</b></div></div>
    <h4 class="ord-sec">${seller?'Date cumpărător și livrare':'Vânzător și livrare'}</h4>
    ${party}
    ${(seller&&o.phones&&o.phones.length)?contactHtml(o.phones,'Cumpărătorul'):''}
    ${(!seller&&o.phones&&o.phones.length)?contactHtml(o.phones,'Vânzătorul'):''}
    ${(o.recipient_name||o.recipient_phone)?`<div class="ord-kv"><small>Destinatar</small><span>${esc(o.recipient_name||'—')}${o.recipient_phone?' · '+esc(fmtPhone(o.recipient_phone)):''}</span></div>`:''}
    <div class="ord-kv"><small>Adresa de livrare</small><span>${esc(addr||'—')}</span></div>
    <div class="ord-kv"><small>Observații client</small><span>${o.note?esc(o.note):'– nu sunt –'}</span></div>
    ${(!seller&&o.awb)?`<div class="ord-kv"><small>AWB</small><span><b>${esc(o.awb)}</b></span></div>`:''}
    ${o.got_stars?`<div class="ord-kv"><small>Calificativ primit</small><span>${starsHtml(o.got_stars)}${o.got_comment?' · „'+esc(o.got_comment)+'”':''}</span></div>`:''}
    ${seller?`<h4 class="ord-sec">Observații vânzător</h4><p class="ord-hint">Aceste observații le vezi doar tu, pentru gestionarea comenzii.</p><div class="util-form"><textarea id="ordSellerNote" rows="4" maxlength="1000">${esc(o.seller_note||'')}</textarea><button type="button" class="btn ghost small" data-order-save="note" data-oid="${o.id}">Salvează observațiile</button></div>
    <h4 class="ord-sec">AWB</h4><p class="ord-hint">Cumpărătorul vede AWB-ul și primește o notificare.</p><div class="util-form ord-awb"><input id="ordAwb" maxlength="40" value="${esc(o.awb||'')}" placeholder="Număr AWB" autocomplete="off"><button type="button" class="btn primary small" data-order-save="awb" data-oid="${o.id}">Salvează AWB</button></div>`:''}
    ${(btns.length||o.status==='completed'||o.listing_id)?`<h4 class="ord-sec">${btns.length?'Schimbă statusul comenzii':'Opțiuni'}</h4><div class="ord-actions">${btns.map(b=>`<button type="button" class="btn ${b[2]} small" data-order-status="${o.id}" data-to="${b[0]}" data-by-seller="${seller?1:0}" data-has-listing="${o.listing_id?1:0}" data-title="${esc(o.title||'comanda')}">${b[1]}</button>`).join('')}${(o.status==='completed'&&o.other_id)?`<button type="button" class="btn ${o.given_stars?'ghost':'primary'} small" data-rate-order="${o.id}" data-stars="${o.given_stars||0}" data-comment="${esc(o.given_comment||'')}" data-seller-name="${esc(o.other_name||'')}">${o.given_stars?'★ '+o.given_stars+' · Modifică calificativul':(seller?'☆ Califică cumpărătorul':'☆ Califică vânzătorul')}</button>`:''}${o.listing_id?`<button type="button" class="btn ghost small" data-order-listing="${o.id}">Vezi anunțul</button>`:''}</div>`:''}
  </div>`;
}

/* ---------- Oferte primite: același aspect ca la comenzi (căutare + taburi + rânduri) ---------- */
const OFF_TABS=[['pending','În așteptare',['pending']],['accepted','Acceptate',['accepted']],['rejected','Respinse',['rejected']],['all','Toate',null]];
let offTab='pending';
function offerRowHtml(o,money){
  const pend=o.status==='pending', im=(o.images&&o.images[0])||(o.req_images&&o.req_images[0])||'';
  const cls=o.status==='accepted'?'ok':(o.status==='rejected'?'bad':'wait');
  return `<article class="ar-row ar-req ord-row" data-open-request="${o.request_id}" data-mode="mine" tabindex="0" role="link" aria-label="${esc(o.request_title)}">
    <div class="ar-thumb">${im?`<img src="${esc(im)}" alt="" loading="lazy" decoding="async">`:'<span class="ar-ph">💬</span>'}</div>
    <div class="ar-main"><h3 class="ar-title">${esc(o.request_title)}</h3><div class="ar-meta">${o.seller_name?(o.seller_id?`<button type="button" class="seller-link" data-seller-profile="${o.seller_id}">${esc(o.seller_name)}</button>`:esc(o.seller_name))+' '+rateInline(o.seller_rating_avg,o.seller_rating_n,o.seller_id,'seller'):'Vânzător'}</div>${o.message?`<p class="ar-desc">${esc(o.message.slice(0,140))}${o.message.length>140?'…':''}</p>`:''}</div>
    <div class="ar-acts"><button type="button" class="ar-btn ar-wide ar-primary" data-open-request="${o.request_id}" data-mode="mine">Cererea și ofertanții</button>${pend?`<button type="button" class="ar-btn" data-offer-accept="${o.id}" title="Acceptă oferta" aria-label="Acceptă oferta">✓</button>`:''}${o.seller_id?`<button type="button" class="ar-btn" data-go="account-tool?view=messages&with=${o.seller_id}" title="Scrie mesaj" aria-label="Scrie mesaj">✉</button>`:''}</div>
    <div class="ar-foot"><span class="ar-views">${esc(OFFER_ST[o.status]||o.status)}</span><span class="ar-qty">${esc(fmtDate(o.created_at))}</span><span class="ar-price">${esc(money(o.price))}</span></div></article>`;
}
function offerMineRowHtml(o,money){
  const open=o.request_status==='open', pend=o.status==='pending';
  const st=pend&&!open?'Cererea s-a închis':(OFFER_ST[o.status]||o.status);
  const im=(o.req_images&&o.req_images[0])||(o.images&&o.images[0])||'';
  const car=[o.make,o.model,o.year].filter(Boolean).join(' · ')||'Orice mașină';
  return `<article class="ar-row ar-req ord-row" data-offer-open="${o.id}" tabindex="0" role="link" aria-label="${esc(o.request_title)}">
    <div class="ar-thumb">${im?`<img src="${esc(im)}" alt="" loading="lazy" decoding="async">`:'<span class="ar-ph">💬</span>'}</div>
    <div class="ar-main"><h3 class="ar-title">${esc(o.request_title)}</h3><div class="ar-meta">${esc(car)}</div>${o.message?`<p class="ar-desc">${esc(o.message.slice(0,140))}${o.message.length>140?'…':''}</p>`:''}<div class="ar-sub">${o.buyer_name?'Cumpărător: '+esc(o.buyer_name)+' '+rateInline(o.buyer_rating_avg,o.buyer_rating_n,o.buyer_id,'buyer'):''}</div></div>
    <div class="ar-acts"><button type="button" class="ar-btn ar-wide ar-primary" data-offer-open="${o.id}">Vezi cererea</button>${pend&&open?`<button type="button" class="ar-btn ar-edit" data-offer-edit="${o.id}" title="Editează oferta" aria-label="Editează oferta">✎</button><button type="button" class="ar-btn ar-del" data-offer-del="${o.id}" title="Retrage oferta" aria-label="Retrage oferta">🗑</button>`:''}${o.buyer_id?`<button type="button" class="ar-btn" data-go="account-tool?view=messages&with=${o.buyer_id}" title="Scrie mesaj" aria-label="Scrie mesaj">✉</button>`:''}</div>
    <div class="ar-foot"><span class="ar-views">${esc(st)}</span><span class="ar-qty">${esc(fmtDate(o.created_at))}</span><span class="ar-price">${esc(money(o.price))}</span></div></article>`;
}
function drawOffersReceived(box,list,money,rowFn,fields,what){
  rowFn=rowFn||offerRowHtml; fields=fields||['request_title','seller_name','message']; what=what||'oferte';
  const inTab=(o,t)=>{ const d=OFF_TABS.find(x=>x[0]===t); return !d[2]||d[2].includes(o.status); };
  if(!OFF_TABS.some(t=>t[0]===offTab)) offTab='pending';
  box.innerHTML=`<div class="ord-wrap"><div class="util-form ord-search"><input type="search" id="offSearch" placeholder="Caută în oferte" aria-label="Caută în oferte" autocomplete="off"></div>
    <div class="acc-tabs ord-tabs" role="tablist">${OFF_TABS.map(t=>`<button type="button" role="tab" class="acc-tab ord-tab" data-off-tab="${t[0]}">${t[1]} <em>${list.filter(o=>inTab(o,t[0])).length}</em></button>`).join('')}</div>
    <div class="ord-count" id="offCount"></div><div class="ar-list ord-list" id="offList"></div></div>`;
  const draw=()=>{
    const q=($('#offSearch').value||'').trim().toLowerCase();
    const rows=list.filter(o=>inTab(o,offTab)&&(!q||fields.map(f=>o[f]||'').join(' ').toLowerCase().includes(q)));
    $$('.ord-tab',box).forEach(b=>{ const on=b.dataset.offTab===offTab; b.classList.toggle('on',on); b.setAttribute('aria-selected',on?'true':'false'); });
    const lbl=(OFF_TABS.find(t=>t[0]===offTab)||[])[1]||'';
    $('#offCount').textContent=rows.length?`${what==='oferte'?'Oferte':'Oferte trimise'} ${lbl.toLowerCase()} (${rows.length})`:'';
    $('#offList').innerHTML=rows.map(o=>rowFn(o,money)).join('')||`<p class="muted ord-empty">${q?'Nicio ofertă găsită.':'Nu există oferte în această categorie.'}</p>`;
  };
  $('#offSearch').addEventListener('input',draw);
  box.querySelector('.ord-tabs').addEventListener('click',e=>{ const b=e.target.closest('[data-off-tab]'); if(!b) return; offTab=b.dataset.offTab; draw(); });
  box.addEventListener('keydown',e=>{ const r=e.target.closest&&e.target.closest('.ar-row[data-open-request]'); if(r&&e.target===r&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); r.click(); } });
  draw();
}

/* ---------- Pagina de recenzii (vânzător / cumpărător) ---------- */
async function drawReviewsPage(box,uid,role){
  box.innerHTML='<div class="info-card"><p class="muted">Se încarcă…</p></div>';
  const id=Number(uid);
  if(!id){ box.innerHTML='<div class="info-card"><p class="muted">Utilizator invalid.</p></div>'; return; }
  const [sp,rt]=await Promise.all([api('/api/sellers/'+id).catch(()=>null),api('/api/sellers/'+id+'/ratings?all=1')]);
  const name=(sp&&sp.seller&&sp.seller.name)||'Utilizator';
  $('#accountToolTitle').textContent=name;
  const part=rt[role]||{avg:null,count:0,ratings:[]};
  const dist=[0,0,0,0,0,0]; if(part.dist) for(const k in part.dist) dist[Number(k)]=Number(part.dist[k])||0; else (part.ratings||[]).forEach(x=>{ dist[x.stars]++; });
  const total=part.count||0;
  const tab=(r,t,p)=>`<button type="button" class="acc-tab${role===r?' on':''}" data-go="account-tool?view=reviews&with=${id}&ref=${r}" role="tab" aria-selected="${role===r}">${t} <em>${(p&&p.count)||0}</em></button>`;
  const bars=[5,4,3,2,1].map(n=>`<div class="rv-bar"><span>${n} ★</span><i><u style="width:${total?Math.round(dist[n]/total*100):0}%"></u></i><small>${dist[n]}</small></div>`).join('');
  const list=(part.ratings||[]).map(x=>`<article class="rv-item"><div class="rv-top">${starsHtml(x.stars)}<b>${esc(x.who||'Utilizator')}</b><small>${esc(fmtDate(x.created_at))}</small></div><p>${x.comment?esc(x.comment):'<span class="muted">Fără comentariu</span>'}</p></article>`).join('');
  const hero=`<div class="rv-hero"><span class="rv-av"><i>👤</i><img src="/api/users/${id}/avatar" alt="" onerror="this.remove()"></span><div class="rv-hero-txt"><b class="rv-hero-title">Recenzii</b><span class="rv-hero-name">${esc(name)}</span><small class="rv-hero-acc">Cont standard</small></div><button type="button" class="back" data-back>← Înapoi</button></div>`;
  box.innerHTML=`<div class="rv-wrap">${hero}
    <div class="acc-tabs ord-tabs" role="tablist">${tab('seller','Ca vânzător',rt.seller)}${tab('buyer','Ca cumpărător',rt.buyer)}</div>
    ${total?`<div class="rv-summary"><div class="rv-score"><b>${esc(String(part.avg).replace('.',','))}</b><span>din 5</span>${starsHtml(part.avg)}<small>${total} ${total===1?'recenzie':'recenzii'}</small></div><div class="rv-bars">${bars}</div></div>
    <div class="ord-count">Recenzii ${role==='seller'?'ca vânzător':'ca cumpărător'} (${total})</div><div class="rv-list">${list}</div>${total>(part.ratings||[]).length?'<p class="muted ord-empty">Se afișează cele mai recente recenzii.</p>':''}`:`<p class="muted ord-empty">Nu există recenzii ${role==='seller'?'ca vânzător':'ca cumpărător'} încă.</p>`}
    <div class="row" style="margin-top:14px"><button type="button" class="btn ghost small" data-seller-profile="${id}">Vezi profilul</button></div></div>`;
}
async function openOrderListing(oid){
  const modal=$('#detailModal'), box=$('#detailContent');
  box.innerHTML='<p class="muted">Se încarcă…</p>'; modal.classList.remove('hidden');
  try{
    const r=await api('/api/orders/'+encodeURIComponent(oid)+'/listing');
    const live=r.listing.status==='approved';
    box.innerHTML=(live?'':'<p class="form-note">Acest anunț nu mai este activ (vândut sau retras). Îl vezi pentru că ai comandat piesa.</p>')+detailHtml(r.listing,r.phones,live);
  }catch(e){ box.innerHTML='<p>'+esc(e.status===404?'Anunțul a fost șters și nu mai poate fi afișat.':(e.message||'Eroare.'))+'</p>'; }
}
function printOrder(o){
  const w=window.open('','_blank'); if(!w){ toast('Permite ferestrele pop-up ca să tipărești.'); return; }
  const addr=[o.ship_address,o.ship_city,o.ship_county].filter(Boolean).join(', ');
  w.document.write(`<!doctype html><meta charset="utf-8"><title>Comanda nr. ${o.id}</title><style>body{font:15px/1.5 system-ui,sans-serif;margin:28px;color:#111}h1{font-size:20px}td{padding:4px 12px 4px 0;vertical-align:top}</style><h1>Comanda nr. ${o.id} din ${esc(fmtDateTime(o.created_at))}</h1><table><tr><td>Status</td><td>${esc(ORDER_ST[o.status]||o.status)}</td></tr><tr><td>Produs</td><td>${esc(o.title||'')} × ${Number(o.quantity)||1}</td></tr><tr><td>Total</td><td>${esc(Number(o.price||0).toLocaleString('ro-RO'))} lei</td></tr><tr><td>${o.role==='seller'?'Cumpărător':'Vânzător'}</td><td>${esc(o.other_name||'')}</td></tr>${(o.recipient_name||o.recipient_phone)?`<tr><td>Destinatar</td><td>${esc(o.recipient_name||'')} ${esc(o.recipient_phone||'')}</td></tr>`:''}<tr><td>Adresa de livrare</td><td>${esc(addr)}</td></tr>${o.awb?`<tr><td>AWB</td><td>${esc(o.awb)}</td></tr>`:''}</table>`);
  w.document.close(); w.focus(); w.print();
}
function orderCardHtml(o){
  const money=v=>esc(Number(v).toLocaleString('ro-RO'))+' lei', seller=o.role==='seller';
  const addr=[o.ship_address,o.ship_city,o.ship_county].filter(Boolean).join(', ');
  const closed=['cancelled','completed'].includes(o.status);
  const btns=[];
  if(seller&&!closed){
    if(o.status==='new') btns.push(['confirmed','Confirmă comanda','primary']);
    if(o.status==='new'||o.status==='confirmed') btns.push(['shipped','Marchează expediată','primary']);
    btns.push(['completed','Finalizată','primary']);
    if(o.status==='suspended') btns.push(['confirmed','Reia comanda','ghost']); else btns.push(['suspended','Suspendată','ghost']);
    btns.push(['cancelled','Anulată','danger']);
  }else if(!seller&&o.status==='new') btns.push(['cancelled','Anulează comanda','danger']);
  const cls=(o.status==='new'||o.status==='suspended')?'pending':(o.status==='cancelled'?'bad':'new');
  return `<div class="info-card tool-item"><b>${esc(o.title||'Comandă')}${Number(o.quantity)>1?' × '+Number(o.quantity):''}</b><p>${seller?'Vânzare':'Cumpărare'} · ${money(o.price)} · <span class="badge ${cls}">${esc(ORDER_ST[o.status]||o.status)}</span> · ${fmtDate(o.created_at)}</p>${o.other_name?`<div class="order-party">${(!seller&&o.other_id)?`<button type="button" class="req-offer-logo order-logo" data-seller-profile="${o.other_id}" aria-label="Profil ${esc(o.other_name)}"><span>${esc(o.other_name.charAt(0).toUpperCase())}</span>${o.other_has_avatar?`<img src="/api/users/${o.other_id}/avatar" alt="" loading="lazy" decoding="async" data-av>`:''}</button>`:(o.other_id?`<span class="req-offer-logo order-logo"><span>${esc(o.other_name.charAt(0).toUpperCase())}</span>${o.other_has_avatar?`<img src="/api/users/${o.other_id}/avatar" alt="" loading="lazy" decoding="async" data-av>`:''}</span>`:'')}<div><p class="muted" style="margin:0">${seller?'Cumpărător':'Vânzător'}: ${(!seller&&o.other_id)?`<button type="button" class="seller-link" data-seller-profile="${o.other_id}">${esc(o.other_name)}</button>`:esc(o.other_name)}</p>${(o.other_company&&o.other_person&&o.other_person!==o.other_company)?`<p class="muted" style="margin:2px 0 0">👤 Persoană: <b>${esc(o.other_person)}</b></p>`:''}</div></div><div class="rate-line">${ratingLine({avg:o.other_rating_avg,count:o.other_rating_n},o.other_id,seller?'buyer':'seller')}</div>`:''}${(o.recipient_name||o.recipient_phone)?`<p>👤 Destinatar: <b>${esc(o.recipient_name||'—')}</b>${o.recipient_phone?' · 📞 '+esc(fmtPhone(o.recipient_phone)):''}</p>`:''}${addr?`<p>📍 Livrare: ${esc(addr)}</p>`:''}${o.note?`<p class="muted">Mesaj: ${esc(o.note)}</p>`:''}${(o.status_reason&&['suspended','cancelled','completed'].includes(o.status))?`<p class="order-reason"><b>${seller?'Mesajul tău către cumpărător':'Mesaj de la vânzător'}:</b> ${esc(o.status_reason)}</p>`:''}${o.got_stars?`<p>Calificativ primit: ${starsHtml(o.got_stars)}${o.got_comment?' · „'+esc(o.got_comment)+'”':''}</p>`:''}${(seller&&o.phones&&o.phones.length)?contactHtml(o.phones,'Cumpărătorul'):''}<div class="row">${btns.map(b=>`<button type="button" class="btn ${b[2]} small" data-order-status="${o.id}" data-to="${b[0]}" data-by-seller="${seller?1:0}" data-has-listing="${o.listing_id?1:0}" data-title="${esc(o.title||'comanda')}">${b[1]}</button>`).join('')}${(o.status==='completed'&&o.other_id)?`<button type="button" class="btn ${o.given_stars?'ghost':'primary'} small" data-rate-order="${o.id}" data-stars="${o.given_stars||0}" data-comment="${esc(o.given_comment||'')}" data-seller-name="${esc(o.other_name||'')}">${o.given_stars?'★ '+o.given_stars+' · Modifică calificativul':(seller?'☆ Califică cumpărătorul':'☆ Califică vânzătorul')}</button>`:''}${o.listing_id?`<button type="button" class="btn ghost small" data-open="${o.listing_id}">Vezi anunțul</button>`:''}</div></div>`;
}
async function openOrder(id){
  if(!currentUser){ openAuth(location.hash.replace(/^#\//,'')); return; }
  const x=(await api('/api/listings/'+id+'?noview=1')).listing;
  if(!x) return;
  $('#orderListingId').value=x.id; state.orderDelivery=!!x.delivery;
  $('#orderSummary').textContent=x.title+' · '+Number(x.price||0).toLocaleString('ro-RO')+' lei / buc.';
  const q=$('#orderQty'); q.max=Math.max(1,Number(x.quantity)||1); q.value=1;
  $('#orderDeliveryHint').textContent=x.delivery?'Completează adresa unde vrei să primești piesa.':'Vânzătorul nu a bifat livrare: poți lăsa adresa goală și stabiliți ridicarea personală.';
  const sc=$('#orderCounty'); if(sc.options.length<2) sc.insertAdjacentHTML('beforeend',COUNTIES.map(c=>`<option>${esc(c)}</option>`).join(''));
  sc.value=''; $('#orderCity').value=''; $('#orderAddress').value=''; $('#orderNote').value=''; $('#orderName').value=''; $('#orderPhone').value=''; $('#orderName').placeholder='Nume din cont'; $('#orderPhone').placeholder='Telefon din cont'; setMsg($('#orderMsg'),'');
  try{ const rs=await api('/api/account/settings'), u=rs.user||{}; sc.value=u.ship_county||''; $('#orderCity').value=u.ship_city||''; $('#orderAddress').value=u.ship_details||'';
    if(u.name) $('#orderName').placeholder=u.name; const ph=((rs.phones||[])[0]||{}).phone||u.phone; if(ph) $('#orderPhone').placeholder=fmtPhone(ph); }catch{}
  $('#orderModal').classList.remove('hidden');
}
async function submitOrder(){
  const msg=$('#orderMsg'); setMsg(msg,'');
  const body={listing_id:Number($('#orderListingId').value),quantity:Number($('#orderQty').value)||1,ship_county:$('#orderCounty').value,ship_city:$('#orderCity').value.trim(),ship_address:$('#orderAddress').value.trim(),note:$('#orderNote').value.trim(),recipient_name:$('#orderName').value.trim(),recipient_phone:$('#orderPhone').value.trim()};
  if(!body.ship_county){ setMsg(msg,'Alege județul.','error'); return; }
  if(state.orderDelivery&&(!body.ship_city||!body.ship_address)){ setMsg(msg,'Completează localitatea și adresa de livrare.','error'); return; }
  try{
    await api('/api/orders',{method:'POST',body:JSON.stringify(body)});
    writeJSON('autopiese_cart',cartIds().filter(i=>i!==body.listing_id));
    closeModal($('#orderModal')); toast('Comanda a fost trimisă vânzătorului.'); navigate('account-tool?view=orders');
  }catch(err){ setMsg(msg,err.message,'error'); }
}

/* ---------- Statistici cont (tabel pe perioade) ---------- */
let statsView='cont';
const accStats={range:'12m',data:null,sel:new Set()};
const ACC_ROWS=[['added','Anunțuri adăugate'],['ord_l','Comenzi din anunțuri'],['ord_l_v','Valoare comenzi din anunțuri (lei)'],['cr_p','Credite promovări anunțuri'],['cr_up','Credite UP anunțuri'],['offers','Oferte cereri',1],['won','Oferte câștigătoare'],['ord_o_v','Valoare comenzi din oferte cereri (lei)'],['lost','Oferte necâștigătoare'],['inactive','Oferte inactive'],['rv_pr','Calificative primite pozitive'],['rv_nr','Calificative primite negative'],['rv_pg','Calificative acordate pozitive'],['rv_ng','Calificative acordate negative'],['views','Vizualizări anunțuri'],['phone','Afișări telefon anunțuri'],['o_views','Vizualizări oferte cereri',1],['o_phone','Afișări telefon oferte cereri']];
const MONTHS_RO=['Ian.','Feb.','Mar.','Apr.','Mai','Iun.','Iul.','Aug.','Sept.','Oct.','Nov.','Dec.'];
const accColLabel=(d,u)=>(u==='month'?MONTHS_RO[Number(d.slice(5,7))-1]:d.slice(8,10)+'.'+d.slice(5,7))+'<br>'+d.slice(0,4);
const accShort=(d,u)=>u==='month'?MONTHS_RO[Number(d.slice(5,7))-1]+' '+d.slice(2,4):d.slice(8,10)+'.'+d.slice(5,7);
const ACC_COLORS=['#0d6efd','#f59e0b','#16a34a','#dc2626','#7c3aed','#0891b2'];
function drawStatsSwitch(){
  const b=$('#statsSwitch'); if(!b) return;
  b.innerHTML=`<select id="statsViewSel" class="acc-title-sel" aria-label="Tip statistici"><option value="cont"${statsView==='cont'?' selected':''}>Statistici cont</option><option value="anunturi"${statsView==='anunturi'?' selected':''}>Statistici anunțuri</option></select>`;
}
function drawStatsPage(){ drawStatsSwitch(); if(statsView==='cont') drawAccStats(); else drawStats(); }
function accChartSvg(D,keys){
  const W=640,H=260,pl=44,pr=14,pt=14,pb=40,iw=W-pl-pr,ih=H-pt-pb,n=D.cols.length;
  const series=keys.map(k=>D.rows[k]||D.cols.map(()=>0));
  const max=Math.max(4,...series.flat().map(Number)), top=Math.ceil(max/4)*4;
  const X=i=>pl+(n===1?iw/2:i*iw/(n-1)), Y=v=>pt+ih-(Number(v)||0)/top*ih;
  let g='';
  for(let i=0;i<=4;i++){ const y=pt+ih-ih*i/4, val=Math.round(top*i/4); g+=`<line x1="${pl}" y1="${y}" x2="${W-pr}" y2="${y}" stroke="#e3e9f1"/><text x="${pl-6}" y="${y+3}" font-size="10" fill="#6c7f97" text-anchor="end">${val}</text>`; }
  const every=Math.ceil(n/8);
  D.cols.forEach((d,i)=>{ if(i%every===0||i===n-1) g+=`<text x="${X(i).toFixed(1)}" y="${H-pb+16}" font-size="10" fill="#6c7f97" text-anchor="middle">${accShort(d,D.unit)}</text>`; });
  series.forEach((a,si)=>{
    const c=ACC_COLORS[si%ACC_COLORS.length];
    g+=`<polyline fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round" points="${a.map((v,i)=>X(i).toFixed(1)+','+Y(v).toFixed(1)).join(' ')}"/>`;
    a.forEach((v,i)=>{ g+=`<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3.5" fill="${c}"><title>${accShort(D.cols[i],D.unit)}: ${v}</title></circle>`; });
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Grafic statistici cont" preserveAspectRatio="xMidYMid meet">${g}</svg>`;
}
function drawAccChart(){
  const box=$('#accChart'), D=accStats.data; if(!box||!D) return;
  const keys=ACC_ROWS.map(r=>r[0]).filter(k=>accStats.sel.has(k));
  if(!keys.length){ box.innerHTML=''; return; }
  const name=k=>(ACC_ROWS.find(r=>r[0]===k)||[,k])[1];
  box.innerHTML=`<div class="stats-legend">${keys.map((k,i)=>`<span><i class="lg acc-c${i%ACC_COLORS.length}"></i>${esc(name(k))}</span>`).join('')}</div><div class="stats-chart">${accChartSvg(D,keys)}</div>`;
}
function accTabsHtml(){
  const tab=(r,t)=>`<button type="button" class="acc-tab${accStats.range===r?' on':''}" data-acc-range="${r}" role="tab" aria-selected="${accStats.range===r}">${t}</button>`;
  return `<div class="acc-tabs" role="tablist">${tab('14d','14 zile')}${tab('6m','6 luni')}${tab('12m','12 luni')}</div>`;
}
function drawAccStats(){
  const box=$('#statsBody'); if(!box||statsView!=='cont') return;
  const D=accStats.data; if(!D){ box.innerHTML=accTabsHtml()+'<p class="muted">Se încarcă…</p>'; return; }
  const nf=v=>new Intl.NumberFormat('ro-RO').format(Number(v)||0);
  const head=D.cols.map(c=>`<th>${accColLabel(c,D.unit)}</th>`).join('');
  const body=ACC_ROWS.map(([k,label,trend])=>{
    const a=D.rows[k]||D.cols.map(()=>0);
    const tds=a.map((v,i)=>{ let ar=''; if(trend&&i>0){ if(v<a[i-1]) ar=' <i class="acc-dn">↓</i>'; else if(v>a[i-1]) ar=' <i class="acc-up">↑</i>'; } return `<td>${nf(v)}${ar}</td>`; }).join('');
    return `<tr${trend?' class="acc-hl"':''}><th scope="row"><label class="acc-lbl"><input type="checkbox" data-acc-row="${k}"${accStats.sel.has(k)?' checked':''}><span>${esc(label)}</span></label></th>${tds}</tr>`;
  }).join('');
  const nodata='Rândurile fără date (credite, calificative, comenzi din anunțuri, statistici la oferte) vor fi completate când funcția respectivă este activată.';
  const note=D.views_since?`<p class="muted stats-note">Vizualizările și afișările de telefon sunt numărate zilnic începând cu ${dmy(D.views_since)}; pentru perioadele anterioare apar 0. ${nodata}</p>`:`<p class="muted stats-note">${nodata}</p>`;
  box.innerHTML=`${accTabsHtml()}<div class="acc-scroll"><table class="acc-table"><thead><tr><th></th>${head}</tr></thead><tbody>${body}</tbody></table></div>
    <button type="button" id="accGraphBtn" class="btn ghost acc-graph-btn"${accStats.sel.size?'':' disabled'}>Afișează grafic</button><div id="accChart"></div>${note}`;
  drawAccChart();
}

/* ---------- statistici anunțuri (Utile) ---------- */
let statsData=null, statsPick='all', currentToolView='', offersMine=[], requestsCache=new Map(), currentRequestModal=null;
const sumLast=(a,n)=>a.slice(Math.max(0,a.length-n)).reduce((t,v)=>t+(Number(v)||0),0);
const dmy=d=>d.slice(8,10)+'.'+d.slice(5,7)+'.'+d.slice(0,4), dm=d=>d.slice(8,10)+'.'+d.slice(5,7);
let statsRange=0; // 0 = toate zilele păstrate, altfel numărul de zile afișate
function statsScope(){
  const L=statsData.listings;
  if(statsPick!=='all'){ const x=L.find(l=>String(l.id)===String(statsPick)); if(x) return {title:x.title,v:x.v,p:x.p,tv:x.total_views,tp:x.total_phone,fav:x.fav||0,ms:x.msgs||0}; statsPick='all'; }
  return {title:'Toate anunțurile',v:statsData.days.map((_,i)=>L.reduce((t,l)=>t+l.v[i],0)),p:statsData.days.map((_,i)=>L.reduce((t,l)=>t+l.p[i],0)),tv:L.reduce((t,l)=>t+l.total_views,0),tp:L.reduce((t,l)=>t+l.total_phone,0),fav:L.reduce((t,l)=>t+(l.fav||0),0),ms:L.reduce((t,l)=>t+(l.msgs||0),0)};
}
function statsChartSvg(days,v,p){
  const W=640,H=240,pl=36,pr=8,pt=14,pb=36,iw=W-pl-pr,ih=H-pt-pb,n=days.length;
  const max=Math.max(4,...v,...p), top=Math.ceil(max/4)*4, gw=iw/n, bw=Math.max(2,Math.min(22,gw*.38));
  let g='';
  for(let i=0;i<=4;i++){ const y=pt+ih-ih*i/4, val=Math.round(top*i/4); g+=`<line x1="${pl}" y1="${y}" x2="${W-pr}" y2="${y}" stroke="#e3e9f1" stroke-width="1"/><text x="${pl-6}" y="${y+3}" font-size="10" fill="#6c7f97" text-anchor="end">${val}</text>`; }
  const every=Math.ceil(n/15);
  days.forEach((d,i)=>{
    const x0=pl+i*gw+(gw-2*bw-2)/2, hv=v[i]/top*ih, hp=p[i]/top*ih;
    g+=`<rect x="${x0.toFixed(1)}" y="${(pt+ih-hv).toFixed(1)}" width="${bw.toFixed(1)}" height="${hv.toFixed(1)}" rx="2" fill="#0d6efd"><title>${dmy(d)}: ${v[i]} vizualizări</title></rect>`;
    g+=`<rect x="${(x0+bw+2).toFixed(1)}" y="${(pt+ih-hp).toFixed(1)}" width="${bw.toFixed(1)}" height="${hp.toFixed(1)}" rx="2" fill="#f59e0b"><title>${dmy(d)}: ${p[i]} apăsări pe telefon</title></rect>`;
    if(i%every===0||i===n-1) g+=`<text x="${(pl+i*gw+gw/2).toFixed(1)}" y="${H-pb+16}" font-size="10" fill="#6c7f97" text-anchor="middle">${dm(d)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Grafic vizualizări și apăsări pe telefon pe zile" preserveAspectRatio="xMidYMid meet">${g}</svg>`;
}
function drawStats(){
  const box=$('#statsBody'); if(!box) return;
  if(!statsData){ box.innerHTML='<p class="muted">Se încarcă…</p>'; return; }
  const D=statsData, N=D.days.length, sc=statsScope();
  if(!D.listings.length){ box.innerHTML='<div class="info-card"><p class="muted">Nu ai încă anunțuri. Statisticile apar după ce publici primul anunț.</p></div>'; return; }
  const n=(statsRange>0&&statsRange<N)?statsRange:N, from=N-n;
  const days=D.days.slice(from), sv=sc.v.slice(from), sp=sc.p.slice(from);
  const sumV=sv.reduce((t,x)=>t+x,0), sumP=sp.reduce((t,x)=>t+x,0);
  const rate=sumV?Math.round(sumP/sumV*1000)/10:0;
  const label=n===N?`ultimele ${N} zile`:`ultimele ${n} zile`;
  const cards=[
    ['👁','Vizualizări',sumV,label],
    ['📞','Apăsări pe telefon / WhatsApp',sumP,`${rate}% din vizualizări`],
    ['♥','În favorite',sc.fav,'total, la zi'],
    ['✉','Mesaje primite',sc.ms,'total, din anunț'],
    ['Σ','Total de la publicare',sc.tv,`${sc.tp} apăsări pe telefon`]
  ];
  const opts=['<option value="all">Toate anunțurile</option>'].concat(D.listings.map(l=>`<option value="${l.id}"${String(l.id)===String(statsPick)?' selected':''}>${esc(l.title.slice(0,70))}</option>`)).join('');
  const rangeBtn=(v,t)=>`<button type="button" class="stats-range-btn${(statsRange===v||(v===0&&(statsRange<=0||statsRange>=N)))?' on':''}" data-stats-range="${v}">${t}</button>`;
  const ranges=[rangeBtn(7,'7 zile')].concat(N>7?[rangeBtn(0,`Toate (${N} zile)`)]:[]).join('');
  const per=D.listings.map(l=>({l,v:sumLast(l.v,n),p:sumLast(l.p,n)})).sort((a,b)=>b.v-a.v||b.p-a.p);
  const maxV=Math.max(1,...per.map(x=>x.v));
  const rows=per.map(({l,v,p})=>`<tr data-stats-pick="${l.id}"${String(l.id)===String(statsPick)?' class="sel"':''}><td class="st-title">${esc(l.title)}${l.status!=='approved'?` <small class="muted">(${l.status==='sold'?'vândut':esc(l.status)})</small>`:''}<span class="st-bar"><i style="width:${Math.round(v/maxV*100)}%"></i></span></td><td>${v}</td><td>${p}</td><td>${l.fav||0}</td><td>${l.msgs||0}</td><td>${v?Math.round(p/v*1000)/10:0}%</td><td>${l.total_views}</td></tr>`).join('');
  const dayRows=days.map((d,i)=>[d,sv[i],sp[i]]).reverse().map(([d,a,b],i)=>`<tr><td>${dmy(d)}${i===0?' <small class="muted">(azi)</small>':''}</td><td>${a}</td><td>${b}</td></tr>`).join('');
  box.innerHTML=`<div class="info-card stats-card">
    <div class="stats-top"><label class="stats-pick">Statistici pentru<select id="statsSelect">${opts}</select></label><div class="stats-range" role="group" aria-label="Perioadă">${ranges}</div></div>
    <div class="stat-grid stats-kpis">${cards.map(c=>`<div class="stat"><span class="stat-ico" aria-hidden="true">${c[0]}</span><small class="stat-name">${esc(c[1])}</small><h3>${c[2]}</h3><small>${esc(c[3])}</small></div>`).join('')}</div>
    <h3 class="ad-h">Evoluție pe zile · ${esc(sc.title.slice(0,60))}</h3>
    <div class="stats-legend"><span><i class="lg v"></i>Vizualizări</span><span><i class="lg p"></i>Apăsări pe telefon / WhatsApp</span></div>
    <div class="stats-chart">${statsChartSvg(days,sv,sp)}</div>
    <details class="stats-days"><summary>Tabel pe zile</summary><div class="stats-scroll"><table class="stats-table"><thead><tr><th>Zi</th><th>👁 Vizualizări</th><th>📞 Apăsări tel.</th></tr></thead><tbody>${dayRows}</tbody></table></div></details>
    <h3 class="ad-h">Pe fiecare anunț · ${label}</h3>
    <p class="muted">Apasă pe un anunț ca să-i vezi graficul. Sunt ordonate după vizualizări.</p>
    <div class="stats-scroll"><table class="stats-table stats-listings"><thead><tr><th>Anunț</th><th>👁 Vizualizări</th><th>📞 Telefon</th><th>♥ Favorite</th><th>✉ Mesaje</th><th>Rată contact</th><th>Total 👁</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="muted stats-note">Zilele se păstrează ${D.retention_days} zile, apoi dispar din grafic. Totalurile „de la publicare”, favoritele și mesajele rămân. „Rată contact” = apăsări pe telefon împărțite la vizualizări. Vizitele tale pe propriile anunțuri nu se numără, iar apăsările repetate de la același vizitator sunt limitate.</p></div>`;
}

/* ---------- cereri: fereastră cu detalii + oferte ---------- */
function reqExpTxt(d){ const n=Math.ceil((new Date(d).getTime()-Date.now())/86400000); return n<=0?'astăzi':(n===1?'mâine':'în '+n+' zile'); }
const REQ_ST={open:'Deschisă',matched:'Ofertă acceptată',closed:'Închisă'}, REQ_KIND={noi:'Piese noi','second-hand':'Piese second-hand',ambele:'Noi sau second-hand'};
function reqDetailsHtml(x){
  const rows=[['Marcă',x.make],['Model',x.model],['An',x.year],['Variantă',x.variant],['Motor',x.engine],['Serie șasiu (VIN)',x.vin],['Caut',REQ_KIND[x.kind]],['Locație',[x.city,x.county].filter(Boolean).join(', ')],['Adresa de livrare',x.ship_address],['Publicată',x.created_at?fmtDate(x.created_at):'']].filter(r=>r[1]);
  let extra=[]; try{ extra=typeof x.extra_parts==='string'?JSON.parse(x.extra_parts||'[]'):(x.extra_parts||[]); }catch{}
  extra=Array.isArray(extra)?extra.filter(p=>p&&p.title):[];
  return `${x.description?`<h3 class="ad-h">Descriere</h3><p class="detail-desc">${esc(x.description)}</p>`:''}
    ${extra.length?`<h3 class="ad-h">Piese căutate în plus (${extra.length})</h3><ul class="req-extra">${extra.map(p=>`<li><b>${esc(p.title)}</b>${p.details?`<br><span class="muted">${esc(p.details)}</span>`:''}</li>`).join('')}</ul>`:''}
    ${rows.length?`<h3 class="ad-h">Detalii</h3><dl class="detail-grid">${rows.map(r=>`<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>`:''}`;
}
/* Pagina unei cereri / oferte: același format ca pagina unui anunț (breadcrumb, carusel foto, titlu, coloană laterală, bară fixă jos pe telefon) */
function reqCrumbs(){ return `<nav class="ad-crumbs" aria-label="Navigare">${[...arguments].filter(Boolean).map(t=>`<span>${esc(t)}</span>`).join('<i>›</i>')}</nav>`; }
function reqCarSub(x){ return [x.make,x.model,x.year].filter(Boolean).join(' · ')||'Orice mașină'; }
function reqSpecHtml(x){
  const spec=[['Marcă',x.make],['Model',x.model],['An',x.year]].filter(r=>r[1]);
  return spec.length?`<div class="ad-car"><small>Piesa se potrivește la</small><div class="ad-spec">${spec.map(r=>`<div><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')}</div></div>`:'';
}
function myRequestHtml(x, offers){
  const open=x.status==='open', mn=v=>new Intl.NumberFormat('ro-RO').format(Number(v))+' lei';
  const list=[...offers].sort((a,b)=>(b.status==='accepted')-(a.status==='accepted')).map(o=>{
    const pend=o.status==='pending', won=o.status==='accepted', lost=o.status==='rejected';
    const sname=o.seller_id?`<button type="button" class="seller-link" data-seller-profile="${o.seller_id}" title="Vezi profilul și calificativele">${esc(o.seller_name||'Vânzător')}</button>`:`<b>${esc(o.seller_name||'Vânzător')}</b>`;
    const slogo=o.seller_id?`<button type="button" class="req-offer-logo" data-seller-profile="${o.seller_id}" aria-label="Profil ${esc(o.seller_name||'vânzător')}"><span>${esc((o.seller_name||'V').charAt(0).toUpperCase())}</span>${o.seller_has_avatar===false?'':`<img src="/api/users/${o.seller_id}/avatar" alt="" loading="lazy" decoding="async" data-av>`}</button>`:'';
    const canRate=won&&o.order_id&&o.order_status==='completed';
    const rateBtn=canRate?`<button type="button" class="btn ${o.given_stars?'ghost':'primary'} small" data-rate-order="${o.order_id}" data-stars="${o.given_stars||0}" data-comment="${esc(o.given_comment||'')}" data-seller-name="${esc(o.seller_name||'vânzător')}">${o.given_stars?'★ '+o.given_stars+' · Modifică calificativul':'☆ Dă calificativ vânzătorului'}</button>`:'';
    const rateHint=(won&&o.order_id&&['suspended','cancelled'].includes(o.order_status))?`<p class="order-reason req-rate-hint"><b>Comanda a fost ${o.order_status==='suspended'?'suspendată':'anulată'} de vânzător.</b>${o.order_reason?' Mesaj: '+esc(o.order_reason):''}</p>`:((won&&o.order_id&&!canRate)?`<p class="muted req-rate-hint">Poți da calificativul după ce comanda este marcată ca finalizată.</p>`:'');
    return `<article class="info-card req-offer${won?' is-won':''}${lost?' is-lost':''}">${won?`<div class="req-win-ribbon">🏆 Ofertă câștigătoare</div>${o.resolved_at?`<div class="req-win-date">Data rezolvării: ${esc(fmtDateTime(o.resolved_at))}</div>`:''}`:''}<div class="req-offer-head">${slogo}<div class="req-offer-who">${sname}${o.company?' <span class="badge">Firmă</span>':''}${o.seller_person&&o.seller_person!==o.seller_name?`<div class="req-offer-person">👤 Persoană: <b>${esc(o.seller_person)}</b></div>`:''}${o.company&&o.seller_nick?`<small class="muted"> · cont: ${esc(o.seller_nick)}</small>`:''}<div class="rate-line">${ratingLine({avg:o.seller_rating_avg,count:o.seller_rating_n},o.seller_id,'seller')}</div></div><div class="req-offer-price">${mn(o.price)}</div></div>
      <p class="muted"><span class="badge ${o.status==='accepted'?'new':(o.status==='rejected'?'bad':'pending')}">${esc(OFFER_ST[o.status]||o.status)}</span> · ${fmtDate(o.created_at)}${o.updated_at?' · modificată '+fmtDate(o.updated_at):''}</p>
      ${o.message?`<p class="req-offer-msg">${esc(o.message)}</p>`:''}
      ${imgGalleryHtml(o.images,'Poză ofertă')}
      ${o.status!=='rejected'?`<div class="req-offer-phones">${contactHtml(o.phones,'Ofertantul')}</div>`:''}
      <div class="row">${pend&&open?`<button type="button" class="btn primary small" data-offer-accept="${o.id}">Acceptă oferta</button><button type="button" class="btn danger small" data-offer-reject="${o.id}">Refuză</button>`:''}${o.seller_id?`<button type="button" class="btn ghost small" data-seller-msg="${o.seller_id}">✉️ Scrie mesaj</button>`:''}${rateBtn}</div>${rateHint}</article>`;
  }).join('');
  const btns=[];
  if(Number(x.edit_secs)>0) btns.push(`<button type="button" class="btn ghost small" data-edit-request="${x.id}" data-edit-until="${Date.now()+Number(x.edit_secs)*1000}">✎ Editează (mai ai ${Math.ceil(Number(x.edit_secs)/60)} min)</button>`);
  if(x.status==='closed') btns.push(`<button type="button" class="btn primary small" data-react-request="${x.id}">↻ Reactivează (7 zile)</button>`);
  btns.push(`<button type="button" class="btn danger small" data-del-request="${x.id}">🗑 Șterge cererea</button>`);
  const per=btns.length<=3?Math.max(btns.length,1):Math.ceil(btns.length/2);
  const np=offers.filter(o=>o.status==='pending').length;
  return `<div class="ad rq">
  <div class="ad-main">
    ${reqCrumbs('Cererile mele',x.make,x.model)}
    <div class="ad-owner"><div class="ad-owner-btns" style="--per:${per}">${btns.join('')}</div><p class="ad-owner-info">${esc(REQ_ST[x.status]||x.status)}${x.status==='open'&&x.expires_at?' · expiră '+reqExpTxt(x.expires_at):''} · ${offers.length} ${offers.length===1?'ofertă':'oferte'}${np?` (${np} în așteptare)`:''}</p><p class="ad-owner-dates">Data publicării: ${esc(fmtDateTime(x.created_at))}</p></div>
    ${imgGalleryHtml(x.images,x.title||'Cerere',true)}
    <div class="ad-titlerow"><h2>${esc(x.title)}</h2></div>
    <p class="ad-sub">${esc(reqCarSub(x))}</p>
    <div class="ad-chips"><span class="badge ${open?'pending':'new'}">${esc(REQ_ST[x.status]||x.status)}</span>${x.kind?`<span class="lchip">${esc(REQ_KIND[x.kind]||'')}</span>`:''}</div>
    ${reqSpecHtml(x)}
    ${reqDetailsHtml(x)}
  </div>
  <aside class="ad-side">
    <h3 class="ad-h rq-offers-h">Oferte primite:</h3>
    ${list||'<p class="muted">Nu ai primit încă nicio ofertă. Vânzătorii vor apărea aici cu nume, preț și telefon.</p>'}
  </aside>
  </div>`;
}
function myOfferHtml(o){
  const open=o.request_status==='open', pend=o.status==='pending', mn=v=>new Intl.NumberFormat('ro-RO').format(Number(v))+' lei';
  const editable=pend&&open;
  const callbar=`<div class="ad-callbar">${o.buyer_id?`<button type="button" class="btn ghost" data-seller-msg="${o.buyer_id}">✉️ Scrie mesaj</button>`:''}${editable?`<button type="button" class="btn primary" data-offer-edit="${o.id}">Editează oferta</button>`:''}</div>`;
  return `<div class="ad rq">
  <div class="ad-main">
    ${reqCrumbs('Ofertele mele',o.make,o.model)}
    ${imgGalleryHtml(o.req_images,o.request_title||'Cerere',true)}
    <div class="ad-titlerow"><h2>${esc(o.request_title)}</h2></div>
    <p class="ad-sub">Cerere de la ${esc(o.buyer_name||'cumpărător')} ${rateInline(o.buyer_rating_avg,o.buyer_rating_n,o.buyer_id,'buyer')}</p>
    <div class="ad-chips">${o.kind?`<span class="lchip">${esc(REQ_KIND[o.kind]||'')}</span>`:''}<span class="badge ${open?'pending':'new'}">${esc(REQ_ST[o.request_status]||o.request_status||'')}</span></div>
    ${reqSpecHtml(o)}
    <h3 class="ad-h">Ce caută cumpărătorul</h3>${reqDetailsHtml({...o,created_at:undefined})}
  </div>
  <aside class="ad-side">
    <h3 class="ad-h rq-offers-h">Oferta mea</h3>
    <div class="info-card req-offer"><div class="req-offer-head"><div><span class="badge ${o.status==='accepted'?'new':(o.status==='rejected'?'bad':'pending')}">${esc(pend&&!open?'Cererea s-a închis':(OFFER_ST[o.status]||o.status))}</span> <small class="muted">${fmtDate(o.created_at)}${o.updated_at?' · modificată '+fmtDate(o.updated_at):''}</small></div><div class="req-offer-price">${mn(o.price)}</div></div>
      ${o.message?`<p class="req-offer-msg">${esc(o.message)}</p>`:'<p class="muted">Fără mesaj.</p>'}
      ${imgGalleryHtml(o.images,'Poza ofertei mele')}
      <div class="row">${editable?`<button type="button" class="btn primary small rq-desk" data-offer-edit="${o.id}">Editează oferta</button><button type="button" class="btn danger small" data-offer-del="${o.id}">Retrage oferta</button>`:''}<button type="button" class="btn ghost small rq-desk" data-seller-msg="${o.buyer_id}">✉️ Scrie mesaj</button></div></div>
    ${o.status==='accepted'?`<h3 class="ad-h">Datele cumpărătorului</h3><div class="info-card"><b>${esc(o.buyer_name||'Cumpărător')}</b><div class="rate-line">${ratingLine({avg:o.buyer_rating_avg,count:o.buyer_rating_n},o.buyer_id,'buyer')}</div>${(o.ship_address||o.city||o.county)?`<p>📍 Livrare: ${esc([o.ship_address,o.city,o.county].filter(Boolean).join(', '))}</p>`:''}${contactHtml(o.phones,'Cumpărătorul')}</div>`:''}
  </aside>
  </div>${callbar}`;
}
function publicRequestHtml(x){
  const where=[x.city,x.county].filter(Boolean).join(', ');
  const uidn=Number(x.user_id)||0, mine=!!(currentUser&&Number(currentUser.id)===uidn), n=Number(x.offers_count)||0;
  const nr=Number(x.user_rating_n)||0, pos=Number(x.buyer_pos)||0, since=x.buyer_since?new Date(x.buyer_since).getFullYear():'';
  const num=v=>Number(v)||0, mk=(m,label)=>`<button type="button" class="btn ghost" data-req-mark="${m}" data-req-id="${x.id}">${label}</button>`;
  const offerBtn=mine?'':(x.my_offer?`<button type="button" class="btn primary" data-offer-open="${x.my_offer_id}">Oferta mea ›</button>`:`<button type="button" class="btn primary" data-offer-request="${x.id}">Propune ofertă</button>`);
  const askBtn=(!mine&&uidn)?`<button type="button" class="btn ghost" data-seller-msg="${uidn}">❓ Pune întrebare</button>`:'';
  const laterBtn=mine?'':(x.my_mark==='later'?mk('none','🕒 Scoate din „mai târziu”'):mk('later','🕒 Ofertez mai târziu'));
  const ignBtn=mine?'':(x.my_mark==='ignored'?mk('none','↩ Nu mai ignora'):mk('ignored','🚫 Ignoră cererea'));
  const callbar=mine?'':`<div class="ad-callbar">${askBtn}${offerBtn}</div>`;
  return `<div class="ad rq">
  <div class="ad-main">
    ${reqCrumbs('Piese căutate',x.make,x.model,x.county)}
    ${imgGalleryHtml(x.images,x.title||'Cerere',true)}
    <p class="rq-eyebrow">Cerere de ofertă:</p>
    <div class="ad-titlerow"><h2>${esc(x.title)}</h2></div>
    <p class="ad-sub">${esc(reqCarSub(x))}${where?' · 📍 '+esc(where):''}</p>
    <div class="ad-chips"><span class="badge pending">Cerere deschisă</span>${x.kind?`<span class="lchip">${esc(REQ_KIND[x.kind]||'')}</span>`:''}<span class="lchip">${n} ${n===1?'ofertă':'oferte'}</span></div>
    ${reqSpecHtml(x)}
    ${reqDetailsHtml(x)}
  </div>
  <aside class="ad-side">
    <div class="ad-card rq-card rq-actions-card">
      ${mine?'<p class="muted">Aceasta este cererea ta. O gestionezi din „Cererile mele”.</p>':`<div class="rq-act-grid">${offerBtn}${askBtn}${laterBtn}${ignBtn}</div>`}
      <div class="contact-slot req-actions" id="reqContactSlot"><button type="button" class="btn ghost small rq-phone" data-req-contact="${x.id}">📞 Vezi telefonul cumpărătorului</button></div>
    </div>
    <div class="ad-card rq-card rq-buyer">
      <h3 class="ad-h">Cumpărător</h3>
      <div class="seller-head">${avatarSpan(x.user_id,x.user_name||'C','seller-avatar')}<div><b>${esc(x.user_name||'Cumpărător')}</b><div class="rate-line">${ratingLine({avg:x.user_rating_avg,count:x.user_rating_n},x.user_id,'buyer')}</div></div></div>
      <p class="rq-buyer-line">${nr?Math.round(pos/nr*100)+'% calificative pozitive':'Fără calificative încă'}</p>
      ${since?`<p class="muted rq-since">Membru din ${since}</p>`:''}
      <div class="rq-stats"><div><span>Cereri cu oferte</span><b>${num(x.buyer_with_offers)}</b></div><div><span>Cereri anulate</span><b>${num(x.buyer_closed)}</b></div><div><span>Cereri cu câștigător</span><b>${num(x.buyer_matched)}</b></div></div>
    </div>
    <div class="rq-foot"><span>🔄 Publicată ${esc(fmtAgo(x.created_at))}</span><button type="button" class="rq-foot-link" data-req-similar="${esc(x.title)}">⇄ Caută piese similare</button><button type="button" class="rq-foot-link" data-legal="contact">⚑ Raportează</button></div>
  </aside>
  </div>${callbar}`;
}
async function openRequestModal(id, mode){
  const modal=$('#requestModal'), box=$('#requestContent');
  box.innerHTML='<p class="muted">Se încarcă…</p>'; modal.classList.remove('hidden'); currentRequestModal={id,mode};
  try{
    if(mode==='mine'){ const r=await api('/api/requests/mine/'+id); box.innerHTML=myRequestHtml(r.request,r.offers); }
    else if(mode==='offer'){ offersMine=(await api('/api/offers/mine?id='+id)).offers; const o=offersMine.find(x=>x.id===id); box.innerHTML=o?myOfferHtml(o):'<p>Oferta nu mai există.</p>'; }
    else { let x=requestsCache.get(id); try{ const f=await api('/api/requests/'+id); x={...(x||{}),...f.request}; }catch{} box.innerHTML=x?publicRequestHtml(x):'<p>Cererea nu mai este disponibilă.</p>'; }
  }catch(e){ box.innerHTML=`<p>${esc(e.message)}</p>`; }
}
function refreshAfterOfferChange(){
  if(!$('#requestModal').classList.contains('hidden') && currentRequestModal && currentRequestModal.mode!=='public') openRequestModal(currentRequestModal.id,currentRequestModal.mode);
  if(currentToolView==='offers'||currentToolView==='offers-received') renderAccountTool(currentToolView);
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
function cardMine(x){
  const st=STATUS_LABEL[x.status]||['',''];
  const im=Array.isArray(x.images)&&x.images[0]?x.images[0]:'';
  const img=im?`<img src="${esc(im)}" alt="${esc(x.title)}" loading="lazy" decoding="async">`:`<div class="listing-placeholder">${phIcon(x)}</div>`;
  const canSold=(x.status==='approved'||x.status==='sold');
  const btns=[
    canSold?`<button type="button" class="mr-btn" data-sold-listing="${x.id}" data-to="${x.status==='sold'?'approved':'sold'}" title="${x.status==='sold'?'Repune la vânzare':'Marchează vândut'}" aria-label="${x.status==='sold'?'Repune la vânzare':'Marchează vândut'}">${x.status==='sold'?'↺':'✓'}</button>`:'',
    x.status!=='blocked'?`<button type="button" class="mr-btn" data-edit-listing="${x.id}" title="Editează" aria-label="Editează">✎</button>`:'',
    `<button type="button" class="mr-btn mr-del" data-del-listing="${x.id}" title="Șterge" aria-label="Șterge">🗑</button>`
  ].join('');
  return `<article class="listing mine-row${x.promoted?' is-promoted':''}" data-open="${x.id}" tabindex="0">
    <div class="mr-top"><div class="mr-img">${img}</div>
      <div class="mr-main"><h3 class="mr-title">${esc(x.title)}</h3>${st[0]?`<span class="badge ${st[1]}">${st[0]}</span>`:''}${x.promoted?`<span class="badge promo">⭐ Promovat până pe ${esc(promoUntilTxt(x))}</span>`:''}<div class="mr-acts">${btns}</div></div></div>
    <div class="mr-foot"><span class="mr-views" title="Vizualizări">👁 ${Number(x.views)||0}</span><span>${Number(x.quantity)||1} buc.</span><b>${priceHtml(x)}</b></div></article>`;
}
/* Format compact (ca în „Anunțurile mele”): poză stânga, titlu, butoane, apoi vizualizări · bucăți · preț. Folosit peste tot unde apar anunțuri. */
/* Iconițe pentru anunțuri fără poză (desenate în cod, culorile site-ului) */
const PH_ICONS={"car": "<svg viewBox=\"0 0 64 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M4 29v-7c0-2 1.2-3 3-3.5l9-2.5 6-7.5h20l8 7.5 8 2.5c2 .5 3 1.5 3 3.5v7\"/><path d=\"M4 29h8M22 29h20M52 29h8M25 11.5l-4.5 7h12v-7zM36 11.5v7h10.5l-6-7z\"/><circle cx=\"17\" cy=\"29.5\" r=\"5\"/><circle cx=\"47\" cy=\"29.5\" r=\"5\"/></svg>", "engine": "<svg viewBox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M12 20h22l4 4v11H12z\"/><path d=\"M18 20v-6h12v6M7 27h5M38 28h4M18 27h14M18 31h14\"/></svg>", "brake": "<svg viewBox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><circle cx=\"24\" cy=\"24\" r=\"16\"/><circle cx=\"24\" cy=\"24\" r=\"5\"/><circle cx=\"34.0\" cy=\"24.0\" r=\"1.4\"/><circle cx=\"29.0\" cy=\"32.7\" r=\"1.4\"/><circle cx=\"19.0\" cy=\"32.7\" r=\"1.4\"/><circle cx=\"14.0\" cy=\"24.0\" r=\"1.4\"/><circle cx=\"19.0\" cy=\"15.3\" r=\"1.4\"/><circle cx=\"29.0\" cy=\"15.3\" r=\"1.4\"/><path d=\"M36 10a18 18 0 0 1 6 9\"/></svg>", "light": "<svg viewBox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M8 15c8-5 20-5 28 0v18c-8 5-20 5-28 0z\"/><circle cx=\"22\" cy=\"24\" r=\"5.5\"/><path d=\"M40 19h5M40 24h5M40 29h5\"/></svg>", "body": "<svg viewBox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M8 37V19c0-3 2-5 5-5h15c3 0 5 1 7 4l5 7v12z\"/><path d=\"M14 19h12l6 7H14zM30 32h6\"/></svg>", "susp": "<svg viewBox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M24 5v8M20 13h8v6h-8z\"/><path d=\"M16 22h16l-16 4.5h16l-16 4.5h16l-16 4.5h16\"/><path d=\"M24 36v3\"/><circle cx=\"24\" cy=\"42\" r=\"3\"/></svg>", "wheel": "<svg viewBox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><circle cx=\"24\" cy=\"24\" r=\"17\"/><circle cx=\"24\" cy=\"24\" r=\"12\"/><circle cx=\"24\" cy=\"24\" r=\"3.5\"/><path d=\"M24.0 20.5L24.0 12.0M27.3 22.9L35.4 20.3M26.1 26.8L31.1 33.7M21.9 26.8L16.9 33.7M20.7 22.9L12.6 20.3\"/></svg>", "elec": "<svg viewBox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M7 19h34v20H7z\"/><path d=\"M13 19v-4h7v4M28 19v-4h7v4M12 29h8M16 25v8M29 29h8\"/></svg>", "interior": "<svg viewBox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><circle cx=\"24\" cy=\"24\" r=\"17\"/><circle cx=\"24\" cy=\"24\" r=\"4\"/><path d=\"M7.5 22c5 1 11 1.5 12.5 2M40.5 22c-5 1-11 1.5-12.5 2M24 28v13\"/></svg>", "gear": "<svg viewBox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><circle cx=\"19\" cy=\"28\" r=\"10\"/><circle cx=\"19\" cy=\"28\" r=\"3.5\"/><path d=\"M29.0 28.0L32.0 28.0M26.1 35.1L28.2 37.2M19.0 38.0L19.0 41.0M11.9 35.1L9.8 37.2M9.0 28.0L6.0 28.0M11.9 20.9L9.8 18.8M19.0 18.0L19.0 15.0M26.1 20.9L28.2 18.8\"/><circle cx=\"36\" cy=\"14\" r=\"5.5\"/><circle cx=\"36\" cy=\"14\" r=\"1.8\"/><path d=\"M41.5 14.0L44.0 14.0M38.8 18.8L40.0 20.9M33.2 18.8L32.0 20.9M30.5 14.0L28.0 14.0M33.2 9.2L32.0 7.1M38.8 9.2L40.0 7.1\"/></svg>"};
function phKind(x){
  if(x && x.type==='dezmembrari') return 'car';
  const t=(((x&&x.category)||'')+' '+((x&&x.subcategory)||'')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if(/moto|chiulas|piston|turbo|distribu|evacuar|racire|pompe|injector|aprindere|filtre|ulei/.test(t)) return 'engine';
  if(/fran|disc|placut/.test(t)) return 'brake';
  if(/ilumin|farur|stopur|lumini|xenon|lampa|proiector/.test(t)) return 'light';
  if(/caroser|aripa|usa|bara|capota|oglind|grila|haion/.test(t)) return 'body';
  if(/suspens|amortiz|directie|bascul|punte|rulment/.test(t)) return 'susp';
  if(/roti|jant|anvelop|cauciuc/.test(t)) return 'wheel';
  if(/electr|cabluri|acumulator|baterie|alternator|senzor|calculator|audio|navigatie|gps|climatiz/.test(t)) return 'elec';
  if(/interio|volan|scaun|bord|consola/.test(t)) return 'interior';
  if(/transmis|cutie|ambreiaj|diferential|cardan/.test(t)) return 'gear';
  return 'car';
}
function phIcon(x){ return PH_ICONS[phKind(x)]||PH_ICONS.car; }
function phHtml(x){ return `<span class="ar-ph">${phIcon(x)}<small>Fără poză</small></span>`; }
function adRowHtml(x, eager){
  const fav = favorites.includes(x.id);
  const isDism = x.type==='dezmembrari';
  const im = Array.isArray(x.images) && x.images[0] ? x.images[0] : '';
  const nImg = Number(x.image_count)||0;
  const thumb = im ? `<img src="${esc(im)}" alt="" ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async">` : phHtml(x);
  const compat = [x.make,x.model,x.year].filter(Boolean).join(' ') + (x.engine?' · '+x.engine:'');
  const meta = [compat || x.category || 'Piesă auto'];
  if(compat && x.category && !isDism) meta.push(x.category);
  if(isDism && x.km!=null && x.km!=='') meta.push(Number(x.km).toLocaleString('ro-RO')+' km');
  const chips = [
    x.condition ? `<span class="badge ${x.condition==='Nouă'?'new':''}">${esc(x.condition)}</span>` : '',
    x.discount_percent && Number(x.discount_percent)>0 ? `<span class="badge discount">-${Number(x.discount_percent)}%</span>` : '',
    x.oem ? `<span class="lchip lchip-oem" title="Cod OEM">OEM ${esc(x.oem)}</span>` : '',
    x.oem_alt ? `<span class="lchip lchip-oem" title="Coduri OEM alternative">+${String(x.oem_alt).split(',').filter(t=>t.trim()).length} coduri</span>` : '',
    x.delivery ? `<span class="lchip lchip-ship">🚚 Livrare</span>` : '',
    ...(isDism && x.parts_avail ? String(x.parts_avail).split(',').map(t=>t.trim()).filter(Boolean).slice(0,3).map(t=>`<span class="lchip">${esc(t)}</span>`) : [])
  ].join('');
  const sType = SELLER_SHORT[x.seller_type] || '';
  const dtRaw = fmtUpdated(x.created_at).replace(/^Actualizat /,'').replace(/^la /,'');
  const sub = [`<span class="ar-loc">📍 ${esc(x.county||'România')}</span>`, dtRaw ? `<span class="ar-dt"><span class="dt-pre">Actualizat </span>${esc(dtRaw)}</span>` : '', x.seller_name ? `<span class="ar-sl">${esc(x.seller_name)+(sType?' ('+esc(sType)+')':'')}</span>` : ''].filter(Boolean).join('');
  const hasPrice = Number(x.price)>0;
  const isPromo = !!x.promoted;
  const disc = Number(x.discount_percent||0);
  return `<article class="ar-row${isPromo?' is-promoted':''}${disc>0?' discounted':''}" data-open="${x.id}" tabindex="0" role="link" aria-label="${esc(x.title)}${isPromo?' (anunț promovat)':''}${disc>0?' (reducere '+disc+'%)':''}">
    <div class="ar-thumb">${thumb}${isPromo?`<span class="promo-badge" title="Anunț promovat până pe ${esc(promoUntilTxt(x))}"><span aria-hidden="true">⭐</span> Promovat</span>`:''}${disc>0?`<span class="discount-badge" title="Reducere ${disc}%">-${disc}%</span>`:''}${nImg>1?`<span class="photo-count" aria-label="${nImg} poze">📷 ${nImg}</span>`:''}</div>
    <div class="ar-main">
      <h3 class="ar-title">${esc(x.title)}</h3>
      <div class="ar-meta">${meta.map(esc).join(' · ')}</div>
      ${chips?`<div class="ar-chips">${chips}</div>`:''}
      <div class="ar-sub">${sub}</div>
    </div>
    <div class="ar-acts"><button type="button" class="ar-btn ar-fav${fav?' on':''}" data-fav="${x.id}" title="Favorite" aria-label="Favorite">${fav?'♥':'♡'}</button></div>
    <div class="ar-foot"><span class="ar-views" title="Vizualizări">👁 ${Number(x.views)||0}</span><span class="ar-qty">${Number(x.quantity)||1} buc.</span><span class="ar-price">${disc>0&&hasPrice?`<del>${esc(money(x.price))}</del> <strong>${esc(money(Math.round(Number(x.price)*(1-disc/100))))}</strong><small>-${disc}%</small>`:`${esc(money(x.price))}${hasPrice&&x.negotiable?'<small>negociabil</small>':''}`}</span></div></article>`;
}

/* Anunțuri noi pe pagina de start */
async function loadHome(attempt=0){
  const box=$('#homeFeed'), wrap=$('#homeFeedWrap'); if(!box||!wrap) return;
  if(!box.dataset.loaded){ wrap.classList.remove('hidden'); box.innerHTML=SKEL; }
  try{
    const r=await api('/api/listings?limit=12&offset=0');
    const list=(r&&r.listings)||[];
    if(!list.length){ wrap.classList.add('hidden'); box.innerHTML=''; return; }
    wrap.classList.remove('hidden');
    box.innerHTML=list.map((x,i)=>card(x,{eager:i<3})).join(''); box.dataset.loaded='1';
    updateFavUI();
  }catch(e){
    if(box.dataset.loaded) return;
    if(attempt<3){ setTimeout(()=>loadHome(attempt+1), 4000); return; }
    wrap.classList.add('hidden'); box.innerHTML='';
  }
}
function card(x, o={}){
  if(o.mine) return cardMine(x);
  return adRowHtml(x, o.eager);
}

function updateFavUI(){
  $('#favCount').textContent = favorites.length;
  $$('[data-fav]').forEach(b=>{ const on=favorites.includes(Number(b.dataset.fav)); b.textContent=(on?'♥':'♡')+(b.classList.contains('btn')?' Favorit':''); b.classList.toggle('on',on); });
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

/* ---------- coș (salvat pe dispozitiv) ---------- */
function cartIds(){ return readJSON('autopiese_cart',[]).map(Number).filter(Number.isFinite); }
function toggleCart(id,btn){
  const c=cartIds(), has=c.includes(id), n=has?c.filter(x=>x!==id):[...c,id];
  writeJSON('autopiese_cart',n.slice(0,50));
  if(btn&&btn.dataset.cart) btn.textContent=has?'🛒 Adaugă în coș':'✓ În coș';
  toast(has?'Eliminat din coș.':'Adăugat în coș.');
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
  for(const k of ['q','type','category','make','model','condition','county','minPrice','maxPrice','yearFrom','yearTo','fuel','seller_type','sort','delivery']) if(params.get(k)) state.filters[k]=params.get(k);
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
  if(reset) $('#listingGrid').innerHTML = SKEL;
  try{
    const r = await api('/api/listings?'+qs.toString());
    if(token!==state.token) return;
    state.total = r.total; state.loaded = r.listings; state.facets = r.facets||null; state.offset = (state.page-1)*30;
    renderList();
    if(reset && window.track) window.track('search',{q:String(state.filters.q||'').slice(0,60),type:String(state.filters.type||'')});
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
  const top=document.querySelector('#page-results.seller-view #sellerBanner')||document.querySelector('#page-results .page-head');
  if(top) top.scrollIntoView({behavior:'smooth',block:'start'});
}

async function loadMine(){
  const token = ++state.token;
  $('#listingGrid').innerHTML = SKEL;
  const r = await api('/api/listings/mine').catch(e=>{ $('#listingGrid').innerHTML=`<div class="empty">${esc(e.message)}</div>`; return null; });
  if(!r || token!==state.token) return;
  state.loaded = r.listings; state.total = r.listings.length; renderList();
}
async function loadFavoritesView(){
  const token = ++state.token;
  $('#listingGrid').innerHTML = SKEL;
  const ids = favorites.slice(0,60);
  const res = await Promise.allSettled(ids.map(id=>api('/api/listings/'+id)));
  if(token!==state.token) return;
  const gone = [];
  state.loaded = [];
  res.forEach((r,i)=>{ if(r.status==='fulfilled') state.loaded.push(r.value.listing); else if(r.reason && r.reason.status===404) gone.push(ids[i]); });
  if(gone.length){ favorites = favorites.filter(id=>!gone.includes(id)); writeJSON('autopiese_fav',favorites); updateFavUI(); }
  state.total = state.loaded.length; renderList();
}
function renderSellerBanner(){
  const box=$('#sellerBanner'), pg=$('#page-results'); if(!box||!pg) return;
  const id=state.extra.seller_id, name=state.extra.sname;
  if(!id||!name||state.mode!=='search'){ box.classList.add('hidden'); pg.classList.remove('seller-view'); return; }
  pg.classList.add('seller-view'); box.classList.remove('hidden');
  if(box.dataset.sid===String(id)) return;
  box.dataset.sid=String(id);
  box.innerHTML=`<span class="sb-av">${avatarSpan(id,name,'seller-avatar')}</span><div class="sb-main"><small class="sb-label">Anunțurile vânzătorului</small><b class="sb-name">${esc(name)}</b><div class="sb-rate"></div></div><div class="sb-side"><button type="button" class="back" data-back>← Înapoi</button><small class="sb-count"></small></div>`;
  api('/api/sellers/'+Number(id)+'/ratings').then(r=>{
    if(box.dataset.sid!==String(id)) return;
    const part=(label,p)=>p&&p.count?`<span class="acc-rate-row">${label} ${starsHtml(p.avg)} <b>${esc(String(p.avg).replace('.',','))}</b> (${p.count})</span>`:'';
    const el=box.querySelector('.sb-rate'); if(el) el.innerHTML=[part('Vânzător',r.seller),part('Cumpărător',r.buyer)].filter(Boolean).join('');
  }).catch(()=>{});
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
  renderSellerBanner();
  $('#crumbCurrent').textContent = title;
  $('#resultCount').textContent = state.total===1 ? '1 anunț' : `${state.total} anunțuri`; { const sc=document.querySelector('#sellerBanner .sb-count'); if(sc) sc.textContent=$('#resultCount').textContent; }
  $('#listingGrid').innerHTML = state.loaded.map(x=>card(x,{mine})).join('');
  $('#noResults').classList.toggle('hidden', state.loaded.length>0);
  renderFacets(); renderRelated(); renderRequestCta();
  renderPagination();
}

function renderFacets(){
  const box=$('#facetBar'); if(!box) return;
  const c=(state.facets&&state.facets.condition)||{}, nNew=c['Nouă']||0, nUsed=c['Second-hand']||0;
  if(state.mode!=='search' || (!nNew && !nUsed)){ box.innerHTML=''; return; }
  const cur=state.filters.condition||'';
  const chip=(val,label,n)=>`<button type="button" class="facet${cur===val?' on':''}" data-facet-cond="${esc(val)}" aria-pressed="${cur===val}">${label} <b>${n.toLocaleString('ro-RO')}</b></button>`;
  box.innerHTML = chip('','Toate',nNew+nUsed)+chip('Nouă','Nou',nNew)+chip('Second-hand','Second hand',nUsed);
}
function renderRelated(){
  const box=$('#relatedSearches'); if(!box) return;
  if(state.mode!=='search' || state.loaded.length<2){ box.innerHTML=''; return; }
  const f=state.filters, seen=new Set(), items=[];
  for(const x of state.loaded){
    if(x.category && x.category!==f.category && !seen.has('c'+x.category)){ seen.add('c'+x.category); items.push({label:x.category,p:{category:x.category}}); }
    if(x.make && x.model && !(f.make===x.make && f.model===x.model) && !seen.has('v'+x.make+x.model)){ seen.add('v'+x.make+x.model); items.push({label:x.make+' '+x.model,p:{make:x.make,model:x.model}}); }
  }
  const pick=items.slice(0,6);
  box.innerHTML = pick.length ? `<span class="rel-label">Vezi și:</span>`+pick.map((it,i)=>`<button type="button" class="rel-chip" data-rel='${esc(JSON.stringify(it.p))}'>${esc(it.label)}</button>`).join('') : '';
}
function renderRequestCta(){
  const box=$('#requestCta'); if(!box) return;
  if(state.mode!=='search'){ box.innerHTML=''; return; }
  box.innerHTML = `<div class="cta-request"><div><b>Nu ai găsit piesa potrivită?</b><span>Spune ce cauți și primești oferte de preț direct de la vânzători.</span></div><button type="button" class="btn primary" data-action="request">Cere oferte</button></div>`;
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
let lightboxAlt = 'Poza anunțului';
/* Înlocuim elementul <img> la fiecare poză: browserul nu mai poate afișa poza anterioară (ex. din „Cereri piese”) cât se încarcă cea nouă */
function freshLightboxImg(){
  const old=$('#imageLightboxImg'); if(!old) return null;
  const img=document.createElement('img'); img.id='imageLightboxImg'; img.alt=lightboxAlt;
  old.replaceWith(img); return img;
}
function openLightbox(src, images=[], index=0, alt='Poza anunțului'){
  const list = Array.isArray(images) && images.length ? images : [src];
  lightboxImages = list.filter(Boolean);
  lightboxIndex = Math.max(0, Math.min(Number(index)||0, lightboxImages.length-1));
  lightboxAlt = alt || 'Poza anunțului';
  const modal = $('#imageLightbox');
  if(!modal || !lightboxImages.length) return;
  modal.classList.remove('hidden');
  document.body.classList.add('lightbox-open');
  renderLightbox();
}
function renderLightbox(){
  const modal=$('#imageLightbox'), counter=$('#imageLightboxCounter');
  if(!modal||!lightboxImages.length) return;
  const image=freshLightboxImg(); if(!image) return;
  image.src=lightboxImages[lightboxIndex];
  if(counter) counter.textContent=`${lightboxIndex+1} / ${lightboxImages.length}`;
  const prev=$('#imageLightboxPrev'), next=$('#imageLightboxNext');
  if(prev) prev.disabled=lightboxImages.length<2;
  if(next) next.disabled=lightboxImages.length<2;
}
function closeLightbox(){
  const modal=$('#imageLightbox'); if(!modal) return;
  modal.classList.add('hidden'); document.body.classList.remove('lightbox-open');
  lightboxImages=[]; lightboxIndex=0;
  freshLightboxImg();
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
function contactHtml(phones, who, sellerId, own, listingId){
  if(!phones || !phones.length) return `<p class="phone-none">📵 ${who} nu a afișat un număr de telefon.</p>`;
  return phones.map(p=>{
    const tel=String(p.phone).replace(/[^\d+]/g,''), tr=listingId?` data-track-phone="${Number(listingId)}"`:'';
    return `<div class="contact-line"><a class="btn tel" href="tel:${esc(tel)}"${tr}>📞 ${esc(fmtPhone(p.phone))}</a>${p.is_whatsapp?`<a class="btn wa" target="_blank" rel="noopener noreferrer" href="${esc(waLink(p.phone))}"${tr}>WhatsApp</a>`:''}</div>`;
  }).join('');
}
/* buton "Contact": telefonul, WhatsApp și mesajul stau ascunse până apeși */
function contactFoldHtml(inner){
  return `<div class="contact-fold"><button type="button" class="btn contact-toggle" data-contact-toggle aria-expanded="false"><span>📞 Contact</span><i aria-hidden="true">▾</i></button><div class="contact-panel hidden">${inner}</div></div>`;
}
let detailPhones = [];
function detailHtml(x, phones, canContact){
  const fav = favorites.includes(x.id);
  const rows = [['Stare',x.condition],['Categorie',[x.category,x.subcategory].filter(Boolean).join(' › ')],['Cod OEM',x.oem],['Coduri alternative',x.oem_alt],['Motor',x.engine],['Kilometri',x.km!=null?Number(x.km).toLocaleString('ro-RO')+' km':''],['Generație',x.generation],['Livrare',x.delivery?'Da':'Nu'],['Tip vânzător',x.seller_type],['Publicat',fmtDate(x.created_at)],['ID anunț','#'+x.id]].filter(r=>r[1]);
  const spec = [['Marcă',x.make],['Model',x.model],['An',x.year]].filter(r=>r[1]);
  const phone1 = (phones||[]).slice(0,1);
  detailPhones = (phones||[]).slice(0,4);
  let callbar = '';
  if(canContact){
    const ph = phone1.length ? `<button type="button" class="btn primary ad-call" data-phones-open="${Number(x.id)}"><span class="ad-call-ico" aria-hidden="true">📞</span><span>Contact</span></button>` : '';
    const cart = `<button type="button" class="btn ghost ad-cartbtn" data-cart="${x.id}">${cartIds().includes(x.id)?'✓ În coș':'🛒 Adaugă în coș'}</button>`;
    callbar = `<div class="ad-callbar">${ph}${x.seller_vacation?'':cart}</div>`;
  }
  const galleryImages = Array.isArray(x.images) ? x.images.filter(Boolean) : [];
  const gallery = galleryImages.length ? `<div class="ad-gal"><div class="detail-gallery ad-slider" data-slider>${galleryImages.map((src,i)=>`<button type="button" class="detail-gallery-item" data-lightbox-src="${esc(src)}" data-lightbox-alt="${esc(x.title)}" data-lightbox-index="${i}" aria-label="Vezi poza ${i+1} mai mare"><img src="${esc(src)}" alt="${esc(x.title)} - poza ${i+1}" ${i===0?'fetchpriority="high"':'loading="lazy"'} decoding="async"></button>`).join('')}</div>${galleryImages.length>1?`<button type="button" class="ad-nav prev" data-ad-slide="-1" aria-label="Poza anterioară">‹</button><button type="button" class="ad-nav next" data-ad-slide="1" aria-label="Poza următoare">›</button><span class="ad-count">1 / ${galleryImages.length}</span><div class="ad-dots" aria-hidden="true">${galleryImages.map((_,i)=>`<i class="${i===0?'on':''}"></i>`).join('')}</div>`:''}</div>` : '<div class="ad-gal ad-gal-empty"><span>⚙️</span><small>Fără poze</small></div>';
  const crumbs = ['Piese auto', x.category, x.make, x.model, x.county].filter(Boolean).map(t=>`<span>${esc(t)}</span>`).join('<i>›</i>');
  const seller = esc(x.seller_name || 'Vânzător');
  const isOwner = !!(currentUser && x.user_id && currentUser.id===x.user_id);
  const ownSt = x.status || ((state.loaded.find(l=>l.id===x.id)||{}).status) || '';
  const ownLbl = (STATUS_LABEL[ownSt]||[''])[0];
  const ownBtns = [];
  if(isOwner){
    if(ownSt==='approved'&&PROMO_ON) ownBtns.push(`<button type="button" class="btn small ad-promo" data-d-promo="${x.id}">${x.promoted?'📣 Prelungește promovarea':'📣 Promovează'}</button>`);
    if(ownSt!=='blocked') ownBtns.push(`<button type="button" class="btn ghost small" data-edit-listing="${x.id}">✎ Editează</button>`);
    if(ownSt==='approved') ownBtns.push(`<button type="button" class="btn ghost small" data-d-bump="${x.id}">↑ Actualizează (UP)</button>`);
    if(ownSt==='approved'||ownSt==='sold') ownBtns.push(`<button type="button" class="btn ghost small" data-sold-listing="${x.id}" data-to="${ownSt==='sold'?'approved':'sold'}">${ownSt==='sold'?'↺ Repune la vânzare':'✓ Marchează vândut'}</button>`);
    ownBtns.push(`<button type="button" class="btn danger small" data-del-listing="${x.id}">🗑 Șterge</button>`);
  }
  const ownPer = ownBtns.length<=3 ? Math.max(ownBtns.length,1) : Math.ceil(ownBtns.length/2);
  const ownerBox = isOwner ? `<div class="ad-owner"><div class="ad-owner-btns" style="--per:${ownPer}">${ownBtns.join('')}</div><p class="ad-owner-info">${[ownLbl?esc(ownLbl):'',x.views!=null?(Number(x.views)||0)+' vizualizări':''].filter(Boolean).join(' · ')}</p><p class="ad-owner-dates">Data adăugării: ${esc(fmtDateTime(x.added_at||x.created_at))}<br>Data ultimei actualizări: ${esc(fmtDateTime(x.created_at))} (${esc(fmtAgo(x.created_at))})</p></div>` : '';
  return `<div class="ad">
  <div class="ad-main">
    <nav class="ad-crumbs" aria-label="Navigare anunț">${crumbs}</nav>
    ${ownerBox}${gallery}
    ${x.seller_vacation?`<div class="vac-banner">🌴 Vânzătorul este în vacanță${x.seller_vacation_until?' până la '+esc(fmtDate(x.seller_vacation_until+'T00:00:00')):''}. Poți trimite mesaje, dar comenzile sunt oprite până se întoarce.</div>`:''}
    <div class="ad-titlerow"><h2>${esc(x.title)}</h2><div class="ad-ico-col"><button type="button" class="ad-ico${fav?' on':''}" data-fav="${x.id}" aria-label="Favorite">${fav?'♥':'♡'}</button><button type="button" class="ad-ico" data-copy-link="${x.id}" aria-label="Distribuie anunțul">⤴</button></div></div>
    <div class="ad-price-m">${priceHtml(x)}${x.negotiable&&Number(x.price)>0?' <small class="muted">· negociabil</small>':''}</div>
    <p class="ad-sub">${[x.county,fmtUpdated(x.created_at)].filter(Boolean).map(esc).join(' · ')}</p>
    <div class="ad-chips">${x.condition?`<span class="badge ${x.condition==='Nouă'?'new':''}">${esc(x.condition)}</span>`:''}${Number(x.quantity)>1?`<span class="lchip">${Number(x.quantity)} buc. disponibile</span>`:''}${x.delivery?'<span class="lchip lchip-ship">🚚 Livrare</span>':''}${x.negotiable&&Number(x.price)>0?'<span class="lchip">Preț negociabil</span>':''}</div>
    ${garageFitHtml(x)}
    ${spec.length?`<div class="ad-car"><small>Compatibil cu</small><div class="ad-spec">${spec.map(r=>`<div><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')}</div></div>`:''}
    ${x.type==='dezmembrari'&&x.parts_avail?`<h3 class="ad-h">Piese disponibile</h3><div class="part-chips big">${String(x.parts_avail).split(',').map(t=>t.trim()).filter(Boolean).map(t=>`<b>${esc(t)}</b>`).join('')}</div>`:''}
    ${x.description?`<h3 class="ad-h">Descriere</h3><p class="detail-desc">${esc(x.description)}</p>`:''}
    <h3 class="ad-h">Detalii</h3>
    <dl class="detail-grid">${rows.map(r=>`<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>
  </div>
  <aside class="ad-side">
    <div class="ad-card">
      <div class="detail-top">${x.promoted?'<span class="badge promo">⭐ Promovat</span>':''}<span class="badge">${x.type==='dezmembrari'?'Dezmembrări':'Piesă auto'}</span>${x.condition?`<span class="badge ${x.condition==='Nouă'?'new':''}">${esc(x.condition)}</span>`:''}</div>
      <div class="detail-price">${priceHtml(x)}${x.negotiable&&Number(x.price)>0?' <small class="muted">· negociabil</small>':''}</div>
      <p class="ad-ship">${x.delivery?'🚚 Livrare disponibilă':'📍 Ridicare personală'}</p>
    </div>
    <div class="ad-card">
      <div class="seller-head">${avatarSpan(x.user_id,x.seller_name||'V','seller-avatar')}<div><b>${x.user_id?`<button type="button" class="seller-link" data-seller-profile="${Number(x.user_id)}">${seller}</button>`:seller}</b><small>${esc(x.seller_type||'')}${x.county?' · '+esc(x.county):''}</small><div class="rate-line">${ratingLine({avg:x.seller_rating_avg,count:x.seller_rating_n},x.user_id,'seller')}</div></div></div>
      ${x.seller_ads?`<p class="seller-stats">${adsLabel(x.seller_ads)} active${x.seller_since?` · pe AutoParts din ${new Date(x.seller_since).getFullYear()}`:''}${x.user_id?` · <button type="button" class="seller-link" data-seller-profile="${Number(x.user_id)}">Vezi toate</button>`:''}</p>`:''}
      ${canContact?`<div class="contact-box">${contactFoldHtml(contactHtml(phone1,'Vânzătorul',x.user_id,currentUser&&currentUser.id===x.user_id,x.id)+((x.user_id&&!(currentUser&&currentUser.id===x.user_id))?'<button type="button" class="btn ghost contact-msg" data-msg-open="1">✉️ Trimite mesaj</button>':''))}</div>`:'<p class="muted">Anunțul este în moderare și nu este încă vizibil public.</p>'}
    </div>
    <div class="contact-row">
            ${canContact?`${(currentUser&&currentUser.id===x.user_id)?'':(x.seller_vacation?'<button class="btn ghost small" disabled>🛍️ Indisponibil (vacanță)</button>':'<button class="btn primary small" data-order="'+x.id+'">🛍️ Comandă</button>')}${(currentUser&&currentUser.id===x.user_id)?'':`<button class="btn ghost small ad-cart-side" data-cart="${x.id}">${cartIds().includes(x.id)?'✓ În coș':'🛒 Adaugă în coș'}</button>`}<button class="btn ghost small" data-show-report="1">Raportează</button>`:''}
    </div>
    ${(canContact&&x.user_id&&!(currentUser&&currentUser.id===x.user_id))?`<div class="msg-box hidden" id="msgBox" data-to="${Number(x.user_id)}" data-listing="${x.id}"><b>Mesaj pentru ${seller}</b>
      <div class="msg-quick"><button type="button" data-msg-quick="Bună ziua! Mai este disponibilă piesa?">Mai este disponibilă?</button><button type="button" data-msg-quick="Bună ziua! Care este ultimul preț?">Ultimul preț?</button><button type="button" data-msg-quick="Bună ziua! Se poate livra în ">Se poate livra?</button>${x.negotiable&&Number(x.price)>0?'<button type="button" data-msg-quick="Bună ziua! Aș putea oferi ___ lei pentru piesă. Vă convine?">Propune un preț</button>':''}</div>
      <textarea id="msgText" rows="3" maxlength="2000" placeholder="Scrie mesajul tău…">Bună ziua! Mai este disponibilă piesa?</textarea>
      <button type="button" class="btn primary small" data-send-msg="1">Trimite mesajul</button><p class="form-note" id="msgStatus"></p></div>`:''}
  </aside>
  </div>
  <div class="report-box hidden" id="reportBox"><b>Raportează anunțul</b>
    <select id="reportReason">${REPORT_REASONS.map(r=>`<option>${esc(r)}</option>`).join('')}</select>
    <textarea id="reportDetails" rows="3" maxlength="2000" placeholder="Detalii (opțional)"></textarea>
    <button class="btn danger small" data-send-report="${x.id}">Trimite raportarea</button><p class="form-note" id="reportMsg"></p></div>${canContact&&x.make?'<section class="similar-box" id="similarBox" aria-live="polite"></section>':''}${callbar}`;
}
async function openDetail(id, own){
  const modal = $('#detailModal'), box = $('#detailContent');
  box.innerHTML = '<p class="muted">Se încarcă…</p>'; modal.classList.remove('hidden');
  try{
    const r = await api('/api/listings/'+id+(own?'?noview=1':''));
    box.innerHTML = detailHtml(r.listing, r.phones, true);
    loadSimilar(r.listing);
  }catch(e){
    const own = state.loaded.find(x=>x.id===id);
    if(own && e.status===404) box.innerHTML = detailHtml(own, [], false);
    else box.innerHTML = `<p>${esc(e.message)}</p>`;
  }
}
async function loadSimilar(x){
  const box=$('#similarBox'); if(!box||!x||!x.make) return;
  try{
    const qs=new URLSearchParams({make:x.make,limit:'7'}); if(x.model) qs.set('model',x.model); if(x.category) qs.set('category',x.category);
    let r=await api('/api/listings?'+qs.toString());
    let items=r.listings.filter(l=>l.id!==x.id);
    if(items.length<3 && x.category){ qs.delete('category'); r=await api('/api/listings?'+qs.toString()); items=r.listings.filter(l=>l.id!==x.id); }
    if(!$('#similarBox')||!items.length) return;
    $('#similarBox').innerHTML=`<h3 class="ad-h">Anunțuri similare</h3><div class="listing-grid similar-grid ar-list">${items.slice(0,4).map(l=>card(l)).join('')}</div>`;
  }catch{}
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
  const ttl = x ? x.textContent : 'Anunț AutoParts';
  if(navigator.share){ try{ await navigator.share({title:ttl,url}); return; }catch(e){ if(e&&e.name==='AbortError') return; } }
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
const SVC_TYPES={reparatii:'Reparări generale',paint:'Vopsitorie și tinichigerie',mecanic:'Mecanică',istoric:'Istoric vehicul'};
const svcState={all:[],loaded:false,loading:false,county:'',type:'',q:''};
function svcFiltered(){
  return svcState.all.filter(s=>{
    if(svcState.county && String(s.county||'')!==svcState.county) return false;
    if(svcState.type && String(s.type||'')!==svcState.type) return false;
    if(svcState.q){
      const q=svcState.q.toLowerCase();
      const hay=[s.title,s.address,s.city,s.county].filter(Boolean).join(' ').toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
}
function svcCardHtml(s){
  const where=[s.address||s.city,s.county].filter(Boolean).join(', ');
  const rating=Number(s.rating)||0;
  const stars=rating>0?`<span class="svc-rating" title="${rating}/5">★ ${rating.toFixed(1)}</span>`:'<span class="svc-rating muted">Fără recenzii</span>';
  const typeLabel=SVC_TYPES[s.type]||s.type||'Service auto';
  // Program de lucru: text liber ("L-V 08:00-18:00, S 09:00-13:00").
  const hours=s.hours?`<p class="svc-hours">🕒 ${esc(s.hours)}</p>`:'';
  // Link hartă fără librării externe (CSP rămâne strict): coordonate dacă există, altfel adresa căutată.
  const mapQ=(s.lat!=null&&s.lng!=null)?`${s.lat},${s.lng}`:where;
  const mapUrl=mapQ?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQ)}`:'';
  const mapLink=mapUrl?`<a class="svc-map" href="${esc(mapUrl)}" target="_blank" rel="noopener noreferrer">🗺 Hartă</a>`:'';
  const phone=s.phone?`<a class="svc-phone" href="tel:${esc(String(s.phone).replace(/[^\d+]/g,''))}">📞 ${esc(s.phone)}</a>`:'';
  return `<article class="service-card" data-id="${esc(String(s.id||''))}">
    <div class="service-info"><h3>${esc(s.title||'Service auto')}</h3>${where?`<p class="muted">📍 ${esc(where)}</p>`:''}${hours}</div>
    <div class="service-meta"><span class="badge">${esc(typeLabel)}</span>${stars}</div>
    <div class="svc-actions">${phone}${mapLink}${(currentUser&&currentUser.role==='admin'&&s.id)?`<button type="button" class="btn ghost small" data-svc-del="${esc(String(s.id))}">Șterge (admin)</button>`:''}</div>
  </article>`;
}
function renderServices(services){
  const grid=$('#serviceGrid'), empty=$('#serviceEmpty');
  if(!grid) return;
  if(Array.isArray(services)) svcState.all=services;
  // populează lista de județe o singură dată, din datele primite
  const sel=$('#serviceCounty');
  if(sel && sel.options.length<=1){
    // Toate județele, nu doar cele care au deja ateliere (altfel lista e goală cât timp catalogul e gol).
    sel.insertAdjacentHTML('beforeend',COUNTIES.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join(''));
  }
  const list=svcFiltered();
  if(!list.length){
    grid.classList.add('hidden');
    if(empty){
      empty.classList.remove('hidden');
      empty.textContent=svcState.loading?'Se încarcă service-urile…':(svcState.all.length?'Nu există service-uri cu aceste filtre. Încearcă altă combinație.':'Momentan nu există service-uri înregistrate. Revino curând.');
    }
    return;
  }
  grid.classList.remove('hidden'); if(empty) empty.classList.add('hidden');
  grid.innerHTML=list.map(svcCardHtml).join('');
}
async function loadServices(){
  if(svcState.loading) return;
  svcState.loading=true;
  try{ renderServices(); }catch(e){}
  try{
    const r=await api('/api/services');
    svcState.all=Array.isArray(r.services)?r.services:[];
  }catch(e){
    svcState.all=[];
    const empty=$('#serviceEmpty');
    if(empty){ empty.classList.remove('hidden'); empty.textContent=e.message||'Nu am putut încărca lista de service-uri.'; }
  }finally{
    svcState.loading=false;
    renderServices();
  }
}

function extraPartsHtml(x){
  let list = [];
  try{ list = typeof x.extra_parts === 'string' ? JSON.parse(x.extra_parts || '[]') : (x.extra_parts || []); }catch{ list = []; }
  if(!Array.isArray(list) || !list.length) return '';
  const items = list.filter(p=>p && p.title).map(p=>esc(p.title) + (p.details ? ' (' + esc(String(p.details).slice(0,80)) + ')' : ''));
  if(!items.length) return '';
  return `<p class="muted">+ ${items.length} ${items.length===1?'piesă suplimentară':'piese suplimentare'}: ${items.join('; ')}</p>`;
}
function extraPartsCount(x){
  let list = [];
  try{ list = typeof x.extra_parts === 'string' ? JSON.parse(x.extra_parts || '[]') : (x.extra_parts || []); }catch{ list = []; }
  return Array.isArray(list) ? list.filter(p=>p && p.title).length : 0;
}
/* Cerere în același format compact ca anunțurile */
function reqRowHtml(x, mine){
  const mode = mine ? 'mine' : 'public', n = Number(x.offers_count)||0, np = Number(x.offers_pending)||0;
  if(mine){
    const car0 = [x.make,x.model,x.year].filter(Boolean).join(' · ') || 'Orice mașină';
    const edit = Number(x.edit_secs)>0 ? `<button type="button" class="rq-btn rq-icon" data-edit-request="${x.id}" data-edit-until="${Date.now()+Number(x.edit_secs)*1000}" title="Modifică (mai ai ${Math.ceil(Number(x.edit_secs)/60)} min)" aria-label="Modifică cererea">✎</button>` : '';
    const main = x.status==='matched' ? `<button type="button" class="rq-btn rq-win" data-open-request="${x.id}" data-mode="mine">🏆 Oferta câștigătoare ›</button>`
      : `<button type="button" class="rq-btn" data-open-request="${x.id}" data-mode="mine">${x.status==='open'?'Vezi cererea și ofertele':'Vezi cererea'} ›</button>`;
    return `<article class="rq-row" data-request="${x.id}" data-open-request="${x.id}" data-mode="mine" tabindex="0" role="link" aria-label="${esc(x.title)}">
      <h3 class="rq-title">${esc(x.title)}</h3>
      <div class="rq-car">${esc(car0)}</div>
      <div class="rq-line"><span>${n} ${n===1?'ofertă':'oferte'}${np?` (${np} noi)`:''}</span><span>${esc(fmtDateTime(x.created_at))}</span></div>
      <div class="rq-acts">${main}${edit}${x.status==='closed'?`<button type="button" class="rq-btn" data-react-request="${x.id}" title="Reactivează pentru încă 7 zile">↻ Reactivează</button>`:''}<button type="button" class="rq-btn rq-icon" data-del-request="${x.id}" title="Șterge" aria-label="Șterge cererea">🗑</button></div></article>`;
  }
  const carBase=[x.make,x.model,x.year].filter(Boolean).join(' '), carTail=[x.variant,x.engine].filter(Boolean).join(' · ');
  const carTitle=(carBase+(carTail?(carBase?', ':'')+carTail:''))||'Orice mașină';
  const ex=extraPartsCount(x), cnt=Number(x.offers_count)||0, where=[x.county,x.city].filter(Boolean).join(', ');
  const tag=x.my_offer?'<span class="rq-tag ok">Ai ofertat</span>':(x.my_mark==='later'?'<span class="rq-tag">Ofertez mai târziu</span>':(x.my_mark==='ignored'?'<span class="rq-tag mute">Ignorată</span>':''));
  return `<article class="rq-pub-row" data-request="${x.id}" data-open-request="${x.id}" data-mode="public" tabindex="0" role="link" aria-label="${esc(x.title)}">
    <h3 class="rq-pub-car">${cnt===0?'<i class="rq-dot" title="Nicio ofertă încă" aria-label="Nicio ofertă încă"></i>':''}${esc(carTitle)}</h3>
    <div class="rq-pub-part"><i class="rq-chev" aria-hidden="true">›</i><span class="rq-pub-name">${esc(x.title)}</span>${ex?` <span class="rq-pub-more">+${ex}</span>`:''}${cnt?` <span class="rq-pub-cnt">(${cnt} ${cnt===1?'ofertă':'oferte'})</span>`:''}</div>
    <div class="rq-pub-meta"><span>${esc(fmtRelDay(x.created_at))}</span>${where?`<span>📍 ${esc(where)}</span>`:''}${tag}</div>
  </article>`;
}
/* Cererile mele: tab-uri Active / Inactive / Rezolvate + căutare în titlu */
let rqAll=[], rqTab='open', rqQ='';
function renderMineRequests(){
  const grid=$('#requestGrid'); if(!grid) return;
  const cnt=st=>rqAll.filter(x=>x.status===st).length;
  $$('#rqTabs [data-rq-tab]').forEach(b=>{ const on=b.dataset.rqTab===rqTab; b.classList.toggle('on',on); b.setAttribute('aria-selected',on?'true':'false'); const sm=b.querySelector('small'); if(sm) sm.textContent=cnt(b.dataset.rqTab); });
  const q=rqQ.trim().toLowerCase();
  const list=rqAll.filter(x=>x.status===rqTab && (!q || String(x.title||'').toLowerCase().includes(q)));
  grid.innerHTML=list.map(x=>reqRowHtml(x,true)).join('');
  $('#rqCount').textContent=`Cereri (${list.length?'1 - '+list.length:'0'} din ${list.length})`;
  const em=$('#requestsEmpty'); em.textContent=q?'Nu am găsit cereri cu acest titlu.':'Nu ai cereri în această secțiune.'; em.classList.toggle('hidden',list.length>0);
}
document.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('[data-rq-tab]'); if(!b) return; rqTab=b.dataset.rqTab; renderMineRequests(); });
/* Filtre pentru pagina „Ateliere și servicii” */
document.addEventListener('click',async e=>{
  const btn=e.target.closest&&e.target.closest('[data-oq-send]'); if(!btn) return;
  const id=btn.dataset.oqSend;
  const item=btn.closest('.oq-item');
  const ta=item&&item.querySelector('.oq-input');
  const answer=ta?ta.value.trim():'';
  if(!answer){ toast('Scrie un răspuns înainte de a trimite.'); if(ta) ta.focus(); return; }
  btn.disabled=true; const old=btn.textContent; btn.textContent='Se trimite…';
  try{
    await api('/api/offer-questions/'+encodeURIComponent(id)+'/answer',{method:'POST',body:{answer}});
    toast('Răspunsul a fost trimis. ✅');
    const box=$('#accountToolContent');
    if(box) renderUtilTool('offer-questions',box);
  }catch(err){ toast(err.message); btn.disabled=false; btn.textContent=old; }
});
document.addEventListener('change',e=>{
  if(e.target&&e.target.id==='serviceCounty'){ svcState.county=e.target.value; renderServices(); }
  if(e.target&&e.target.id==='serviceType'){ svcState.type=e.target.value; renderServices(); }
});
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('#serviceClear'); if(!b) return;
  svcState.county=''; svcState.type=''; svcState.q='';
  const c=$('#serviceCounty'), t=$('#serviceType');
  if(c) c.value=''; if(t) t.value='';
  renderServices();
});
/* ---- Înregistrare atelier ---- */
function openServiceModal(){
  if(!currentUser){ openAuth('servicii'); return; }
  const sel=$('#svcCounty');
  if(sel && sel.options.length<2) sel.insertAdjacentHTML('beforeend',COUNTIES.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join(''));
  setMsg($('#svcMsg'),'');
  $('#serviceModal').classList.remove('hidden');
}
async function submitService(e){
  e.preventDefault();
  const v=id=>($(id).value||'').trim();
  const msg=$('#svcMsg');
  const title=v('#svcTitle'), phone=v('#svcPhone'), county=v('#svcCounty'), type=v('#svcType');
  if(title.length<3){ setMsg(msg,'Scrie numele atelierului (minim 3 caractere).','error'); return; }
  if(!type){ setMsg(msg,'Alege tipul de serviciu.','error'); return; }
  if(!county){ setMsg(msg,'Alege județul.','error'); return; }
  if(phone.replace(/\D/g,'').length<6){ setMsg(msg,'Scrie un număr de telefon valid.','error'); return; }
  const btn=$('#svcSubmit'); btn.disabled=true;
  try{
    await api('/api/services',{method:'POST',body:JSON.stringify({title,type,county,phone,city:v('#svcCity'),address:v('#svcAddress'),hours:v('#svcHours')})});
    $('#serviceForm').reset(); closeModal($('#serviceModal')); toast('Atelierul a fost adăugat.');
    svcState.county=''; svcState.type=''; const c=$('#serviceCounty'), t=$('#serviceType'); if(c) c.value=''; if(t) t.value='';
    await loadServices();
  }catch(err){ setMsg(msg,err.message||'Nu am putut salva atelierul. Încearcă din nou.','error'); }
  finally{ btn.disabled=false; }
}
document.addEventListener('submit',e=>{ if(e.target&&e.target.id==='serviceForm') submitService(e); });
document.addEventListener('click',async e=>{
  if(e.target.closest&&e.target.closest('#serviceAddBtn')){ openServiceModal(); return; }
  const del=e.target.closest&&e.target.closest('[data-svc-del]'); if(!del) return;
  if(!confirm('Ștergi acest atelier din listă?')) return;
  try{ await api('/api/admin/services/'+encodeURIComponent(del.dataset.svcDel),{method:'DELETE'}); toast('Atelier șters.'); await loadServices(); }
  catch(err){ toast(err.message||'Nu am putut șterge atelierul.'); }
});
document.addEventListener('submit',e=>{ if(e.target&&e.target.id==='rqSearchForm'){ e.preventDefault(); rqQ=$('#rqSearch').value; renderMineRequests(); } });
document.addEventListener('input',e=>{ if(e.target&&e.target.id==='rqSearch'){ rqQ=e.target.value; renderMineRequests(); } });
/* Piese căutate de cumpărători (pentru vânzători): stare personală, filtre, „Ofertez mai târziu” / „Ignoră” */
const rqPub={all:[],state:'new',f:{make:'',model:'',kind:'',county:'',offers:'',sort:'new',q:''}};
function rqPubFiltered(){
  const f=rqPub.f, q=f.q.trim().toLowerCase(), st=currentUser?rqPub.state:'all';
  const list=rqPub.all.filter(x=>{
    if(st==='offered'&&!x.my_offer) return false;
    if(st==='later'&&x.my_mark!=='later') return false;
    if(st==='ignored'&&x.my_mark!=='ignored') return false;
    if(st==='new'&&(x.my_offer||x.my_mark==='ignored')) return false;
    if(st==='all'&&x.my_mark==='ignored') return false;
    if(f.make&&x.make!==f.make) return false;
    if(f.model&&x.model!==f.model) return false;
    if(f.kind&&x.kind&&x.kind!=='ambele'&&x.kind!==f.kind) return false;
    if(f.county&&x.county!==f.county) return false;
    if(f.offers==='none'&&Number(x.offers_count)>0) return false;
    if(f.offers==='some'&&!(Number(x.offers_count)>0)) return false;
    if(q&&![x.title,x.description,x.make,x.model,x.variant,x.engine].some(v=>String(v||'').toLowerCase().includes(q))) return false;
    return true;
  });
  const t=x=>new Date(x.created_at).getTime(), cn=x=>Number(x.offers_count)||0;
  if(f.sort==='old') list.sort((a,b)=>t(a)-t(b));
  else if(f.sort==='offers') list.sort((a,b)=>cn(b)-cn(a)||t(b)-t(a));
  else list.sort((a,b)=>t(b)-t(a));
  return list;
}
function rqChipsHtml(){
  const f=rqPub.f, c=[];
  if(f.make) c.push(['make',f.make]);
  if(f.model) c.push(['model',f.model]);
  if(f.kind) c.push(['kind',REQ_KIND[f.kind]||f.kind]);
  if(f.county) c.push(['county',f.county]);
  if(f.offers) c.push(['offers',f.offers==='none'?'Fără oferte':'Cu oferte']);
  if(f.q.trim()) c.push(['q','„'+f.q.trim()+'”']);
  if(f.sort!=='new') c.push(['sort',f.sort==='old'?'Cele mai vechi':'Cele mai multe oferte']);
  return c.map(([k,l])=>`<button type="button" class="rq-chip" data-rq-chip="${k}" aria-label="Elimină filtrul ${esc(l)}">${esc(l)} <i aria-hidden="true">✕</i></button>`).join('');
}
function renderPubRequests(){
  const grid=$('#requestGrid'), bar=$('#rqPubBar'); if(!grid||!bar) return;
  const sel=$('#rqState'); if(sel){ sel.closest('.rq-state').classList.toggle('hidden',!currentUser); sel.value=rqPub.state; }
  const list=rqPubFiltered();
  grid.innerHTML=list.map(x=>reqRowHtml(x,false)).join('');
  const chips=$('#rqChips'); chips.innerHTML=rqChipsHtml(); chips.classList.toggle('hidden',!chips.innerHTML);
  $('#rqPubCount').textContent=`Cereri (${list.length?'1 - '+list.length:'0'} din ${list.length})`;
  const em=$('#requestsEmpty'); em.textContent=rqPub.all.length?'Nicio cerere nu se potrivește cu starea sau filtrele alese.':'Nu există cereri deschise.'; em.classList.toggle('hidden',list.length>0);
}
function rqFillFilter(f){
  const uniq=a=>[...new Set(a.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'ro'));
  const opt=(arr,cur,all)=>`<option value="">${all}</option>`+arr.map(v=>`<option value="${esc(v)}"${v===cur?' selected':''}>${esc(v)}</option>`).join('');
  $('#rqfMake').innerHTML=opt(uniq(rqPub.all.map(x=>x.make)),f.make,'Toate mărcile');
  $('#rqfModel').innerHTML=opt(uniq(rqPub.all.filter(x=>!f.make||x.make===f.make).map(x=>x.model)),f.model,'Toate modelele');
  $('#rqfCounty').innerHTML=opt(COUNTIES,f.county,'Toate județele');
  $('#rqfKind').value=f.kind; $('#rqfOffers').value=f.offers; $('#rqfSort').value=f.sort; $('#rqfQ').value=f.q;
}
function rqReadFilter(){ return {make:$('#rqfMake').value,model:$('#rqfModel').value,kind:$('#rqfKind').value,county:$('#rqfCounty').value,offers:$('#rqfOffers').value,sort:$('#rqfSort').value||'new',q:$('#rqfQ').value}; }
async function reqMark(id,mark){
  if(!currentUser){ openAuth(location.hash.replace(/^#\//,'')); return; }
  if(mark==='none') await api('/api/requests/'+id+'/mark',{method:'DELETE'});
  else await api('/api/requests/'+id+'/mark',{method:'POST',body:JSON.stringify({mark})});
  const val=mark==='none'?null:mark;
  const a=rqPub.all.find(r=>Number(r.id)===id); if(a) a.my_mark=val;
  const c=requestsCache.get(id); if(c) c.my_mark=val;
  toast(mark==='later'?'Am salvat cererea la „Ofertez mai târziu”.':(mark==='ignored'?'Cererea e ignorată. O găsești la „Ignorate”.':'Gata, am scos marcajul.'));
  const rm=$('#requestModal');
  if(mark==='ignored') closeModal(rm);
  else if(rm&&!rm.classList.contains('hidden')&&currentRequestModal&&Number(currentRequestModal.id)===id) openRequestModal(id,'public');
  const pg=$('#page-requests'); if(pg&&pg.classList.contains('active')) renderPubRequests();
}
document.addEventListener('click',e=>{
  const t=e.target; if(!t||!t.closest) return; let el;
  if(t.closest('#rqFilterOpen')){ rqFillFilter(rqPub.f); $('#rqFilterModal').classList.remove('hidden'); return; }
  if(t.closest('#rqfApply')){ rqPub.f=rqReadFilter(); closeModal($('#rqFilterModal')); renderPubRequests(); return; }
  if(t.closest('#rqfReset')){ rqPub.f={make:'',model:'',kind:'',county:'',offers:'',sort:'new',q:''}; closeModal($('#rqFilterModal')); renderPubRequests(); return; }
  if((el=t.closest('[data-rq-chip]'))){ const k=el.dataset.rqChip; rqPub.f[k]=(k==='sort'?'new':''); if(k==='make') rqPub.f.model=''; renderPubRequests(); return; }
  if((el=t.closest('[data-req-mark]'))){ safe(reqMark)(Number(el.dataset.reqId),el.dataset.reqMark); return; }
  if((el=t.closest('[data-req-similar]'))){ openSearch({q:el.dataset.reqSimilar}); return; }
});
document.addEventListener('change',e=>{
  const t=e.target; if(!t) return;
  if(t.id==='rqState'){ rqPub.state=t.value; renderPubRequests(); }
  else if(t.id==='rqfMake'){ const f=rqReadFilter(); f.model=''; rqFillFilter(f); }
});
async function loadRequests(mine){
  const grid = $('#requestGrid'); $('#requestsEmpty').classList.add('hidden');
  $('#requestsTitle').textContent = mine ? 'Cererile mele' : 'Piese căutate de cumpărători';
  $('#requestsCrumb').textContent = $('#requestsTitle').textContent;
  { const pg=$('#page-requests'), pc=pg&&pg.querySelector('.container'); if(pg) pg.classList.toggle('req-mine',!!mine); if(pc) pc.classList.toggle('narrow',!!mine); }
  { const ph=$('#page-requests .page-head'); if(ph) ph.classList.add('hd-compact'); const mb=$('#rqMineBar'); if(mb) mb.classList.toggle('hidden',!mine); grid.classList.toggle('rq-list',!!mine); const pb=$('#rqPubBar'); if(pb) pb.classList.toggle('hidden',!!mine); const ab=$('#rqAddBtn'); if(ab) ab.classList.toggle('hidden',!!mine); grid.classList.toggle('rq-pub-list',!mine); }
  $('#requestsSub').textContent = mine ? 'Cererile publicate de tine.' : 'Cereri publicate de cumpărători. Ai piesa? Contactează-l.';
  grid.innerHTML = '<p class="muted">Se încarcă…</p>';
  try{
    const r = await api(mine ? '/api/requests/mine' : '/api/requests');
    requestsCache=new Map(r.requests.map(x=>[x.id,x]));
    if(mine){ rqAll=r.requests; renderMineRequests(); }
    else { rqPub.all=r.requests; renderPubRequests(); }
  }catch(e){ grid.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
async function requestContact(id, btn){
  if(!currentUser){ openAuth('requests'); return; }
  const r = await api(`/api/requests/${id}/contact`);
  const inModal = btn.closest('#requestModal') && $('#reqContactSlot');
  const slot = inModal || btn.closest('.contact-slot');
  if(!slot) return;
  slot.innerHTML = contactHtml(r.phones,'Cumpărătorul');
  if(inModal){ const cb=btn.closest('.ad-callbar'); if(cb) cb.querySelectorAll('[data-req-contact]').forEach(b=>b.remove()); slot.scrollIntoView({block:'center',behavior:'smooth'}); }
}
async function loadStores(parks){
  const grid = $('#storesGrid'); $('#storesEmpty').classList.add('hidden');
  const title = parks ? 'Parcuri partenere' : 'Magazine verificate';
  $('#storesTitle').textContent = title; $('#storesCrumb').textContent = title;
  grid.innerHTML = '<p class="muted">Se încarcă…</p>';
  try{
    let list = (await api('/api/sellers')).sellers || [];
    if(parks) list = list.filter(s=>s.dism);
    grid.innerHTML = list.map(s=>`<article class="info-card"><div class="seller-head">${avatarSpan(s.id,s.name,'seller-avatar')}<div><span class="badge">${s.dism?'DEZMEMBRĂRI':'VÂNZĂTOR'}</span><h3>${esc(s.name)}</h3></div></div><p class="rate-line">${ratingLine({avg:s.rating_avg,count:s.rating_n},s.id,'seller')}</p><p>${s.n} ${s.n===1?'anunț':'anunțuri'}${s.county?' · '+esc(s.county):''}</p><button class="btn ghost small" data-seller="${s.id}" data-sname="${esc(s.name)}">Vezi anunțurile</button></article>`).join('');
    $('#storesEmpty').classList.toggle('hidden', list.length>0);
  }catch(e){ grid.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

/* ---------- căutări salvate ---------- */
function getSaved(){
  return readJSON('autopiese_saved_searches',[]).map(s=>typeof s==='string'?{label:s,qs:'q='+encodeURIComponent(s)}:s).filter(s=>s&&s.qs!==undefined);
}
async function saveCurrentSearch(){
  const p = filtersToParams(); p.delete('mode');
  const label = [state.filters.q, state.filters.category, state.filters.make, state.filters.model, state.filters.county].filter(Boolean).join(' · ');
  if(!label){ toast('Scrie întâi ce piesă cauți sau alege un filtru.'); return; }
  if(currentUser){
    try{ await api('/api/saved-searches',{method:'POST',body:JSON.stringify({label,qs:p.toString(),alerts:true})}); toast('Căutarea a fost salvată. Te anunțăm când apare un anunț nou care i se potrivește.'); }
    catch(e){ toast(e.message); }
    return;
  }
  const saved = getSaved().filter(s=>s.qs!==p.toString());
  saved.unshift({label, qs:p.toString()});
  writeJSON('autopiese_saved_searches', saved.slice(0,20));
  toast('Căutarea a fost salvată pe acest dispozitiv. Intră în cont ca să primești alerte pentru anunțuri noi.');
}
async function renderSaved(){
  const box=$('#savedList');
  if(!currentUser){
    const list = getSaved();
    box.innerHTML = (list.length ? list.map((s,i)=>`<div class="saved-row"><button class="link" data-saved-open="${i}">${esc(s.label)}</button><button class="btn danger small" data-saved-del="${i}">Șterge</button></div>`).join('') : '<div class="saved-row muted">Nu ai căutări salvate.</div>') + '<div class="saved-row muted">Intră în cont ca să păstrezi căutările pe cont și să primești o alertă când apar anunțuri noi care li se potrivesc.</div>';
    return;
  }
  box.innerHTML='<div class="saved-row muted">Se încarcă…</div>';
  try{
    /* căutările salvate înainte pe acest dispozitiv se mută o singură dată pe cont, cu alertele oprite */
    const local=getSaved();
    if(local.length){
      const keep=[];
      for(const s of local.slice(0,30)){
        try{ await api('/api/saved-searches',{method:'POST',body:JSON.stringify({label:s.label,qs:s.qs,alerts:false,import:true})}); }
        catch(e){ if(!e.status || e.status>=500 || e.status===429 || e.code==='MAX_CAUTARI') keep.push(s); }
      }
      writeJSON('autopiese_saved_searches', keep);
    }
    const list=(await api('/api/saved-searches')).searches||[];
    box.innerHTML = list.length ? list.map(x=>`<div class="saved-row"><button class="link" data-saved-go="${esc(x.qs)}">${esc(x.label)}</button><label class="check saved-alert"><input type="checkbox" data-saved-alert="${x.id}" ${x.alerts?'checked':''}> 🔔 Alerte</label><button class="btn danger small" data-saved-rm="${x.id}">Șterge</button></div>`).join('') : '<div class="saved-row muted">Nu ai căutări salvate.</div>';
  }catch(e){ box.innerHTML=`<div class="saved-row muted">${esc(e.message||'Nu am putut încărca căutările salvate.')}</div>`; }
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
  if(!modal) return;
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
  if(!$('#regTerms').checked){ setMsg(msg,'Pentru a crea contul trebuie să accepți Termenii și Politica de confidențialitate.','error'); return; }
  try{
    const r = await api('/api/auth/register',{method:'POST',body:JSON.stringify({name:$('#regName').value.trim(),nickname:$('#regNickname').value.trim(),email:$('#regEmail').value.trim(),phone:$('#regPhone').value.trim(),password:$('#regPassword').value,remember:$('#rememberRegister').checked,accept_terms:$('#regTerms').checked})});
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
// Denumiri vechi de subcategorii -> denumirea nouă echivalentă (anunțurile existente rămân valide la editare).
const SUB_ALIAS = {'uși':'Usă față','usi':'Usă față','capote':'Capotă','aripe':'Aripă față','praguri':'Prag','grile / măști':'Grille / Mască','grille / masca':'Grille / Mască','portbagaj / hayon':'Usă hayon / Portbagaj','panouri uși':'Panouri uși','scaune':'Scaune față','console centrale':'Consolă centrală','plafoane':'Plafon / Ciel','volan și airbag':'Volan','discuri frână':'Discuri frână față','plăcuțe frână':'Plăcuțe frână față','etrieri':'Etrieri față','rulmenți roți':'Rulmenți roți față','butuci':'Butuci față'};
function normSub(sub){
  const key=String(sub||'').trim();
  return SUB_ALIAS[key.toLowerCase()]||key;
}
function setCategory(cat, sub){
  sub = normSub(sub);
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

/* ---------- completare automată mașină: cerere, potrivire, garaj (identic cu formularul de vânzare) ---------- */
const CAR_AUTO = {
  req:    { make:'reqMake',    model:'reqModel',    year:'reqYear',    src:['reqTitle','reqDescription'], msg:'reqAutoCar' },
  match:  { make:'matchMake',  model:'matchModel',  year:'matchYear',  src:['matchPart'],                 msg:'matchAutoCar' },
  garage: { make:'garageMake', model:'garageModel', year:'garageYear', src:['garageText'],                msg:'garageAutoCar' },
};
for(const c of Object.values(CAR_AUTO)){ c.manual = { make:false, model:false, year:false }; c.auto = { make:false, model:false, year:false }; c.token = 0; c.timer = null; }
function showAutoCarFor(c){
  const el = $('#'+c.msg); if(!el) return;
  const a = c.auto, parts = [a.make&&$('#'+c.make).value, a.model&&$('#'+c.model).value, a.year&&$('#'+c.year).value].filter(Boolean);
  el.classList.toggle('hidden', !parts.length);
  el.textContent = parts.length ? '✨ Completat automat: '+parts.join(' · ')+'. Poți modifica dacă nu e corect.' : '';
}
async function detectVehicleFor(c){
  const man = c.manual; if(man.make && man.model && man.year) return;
  const mk = $('#'+c.make), md = $('#'+c.model), yr = $('#'+c.year); if(!mk || !md || !yr) return;
  const makes = [...mk.options].map(o=>o.value).filter(Boolean); if(!makes.length) return;
  const texts = c.src.map(id=>($('#'+id)||{}).value||''), all = texts.join(' '), token = ++c.token;
  let make = man.make ? mk.value : (texts.map(t=>findMake(t,makes)).find(Boolean) || '');
  let model = '';
  if(make && !man.model){ const models = await getModels(make); if(token!==c.token) return; model = findModel(all, make, models); }
  if(make && !man.make && mk.value!==make){
    mk.value = make; c.auto.make = true; c.auto.model = false;
    await loadModels(make, c.model); if(token!==c.token) return;
  }
  if(model && !man.model && md.value!==model){ md.value = model; c.auto.model = true; }
  if(make) loadYears(mk.value, md.value);
  if(!man.year){
    const y = findYear(all);
    if(y && yr.value!==y){ yr.value = y; c.auto.year = true; }
  }
  showAutoCarFor(c);
}
function resetCarAutoFor(key, lock){
  const c = CAR_AUTO[key]; clearTimeout(c.timer); c.token++;
  c.manual = { make:!!(lock&&lock.make), model:!!(lock&&lock.model), year:!!(lock&&lock.year) };
  c.auto = { make:false, model:false, year:false };
  const el = $('#'+c.msg); if(el){ el.classList.add('hidden'); el.textContent = ''; }
}
function scheduleDetectFor(key){ const c = CAR_AUTO[key]; clearTimeout(c.timer); c.timer = setTimeout(()=>safe(detectVehicleFor)(c), 380); }
function bindCarAuto(key){
  const c = CAR_AUTO[key];
  $('#'+c.make).addEventListener('change', e=>{ c.manual.make=true; c.manual.model=false; c.auto.make=c.auto.model=false; loadModels(e.target.value,c.model).then(()=>{ scheduleDetectFor(key); showAutoCarFor(c); }); });
  $('#'+c.model).addEventListener('change', ()=>{ c.manual.model=true; c.auto.model=false; loadYears($('#'+c.make).value,$('#'+c.model).value); showAutoCarFor(c); });
  $('#'+c.year).addEventListener('input', ()=>{ c.manual.year=true; c.auto.year=false; showAutoCarFor(c); });
  c.src.forEach(id=>$('#'+id).addEventListener('input', ()=>scheduleDetectFor(key)));
}

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
  const last=state.sellImages.length-1;
  box.innerHTML=state.sellImages.map((src,i)=>`<div class="sell-image-item"><img src="${src}" alt="Poza ${i+1}">${i===0?'<span class="sell-image-cover">Principală</span>':''}<button type="button" class="sell-image-remove" data-remove-sell-image="${i}" aria-label="Șterge poza">×</button><div class="sell-image-move"><button type="button" data-move-sell-image="${i}" data-dir="-1" aria-label="Mută poza ${i+1} mai devreme"${i===0?' disabled':''}>‹</button><button type="button" data-move-sell-image="${i}" data-dir="1" aria-label="Mută poza ${i+1} mai târziu"${i===last?' disabled':''}>›</button></div></div>`).join('');
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


/* ---------- poze la cereri și oferte ---------- */
const IMG_BOXES={reqImages:{prev:'#reqImagePreview',count:'#reqImageCount',max:6},offerImages:{prev:'#offerImagePreview',count:'#offerImageCount',max:6}};
function renderImgBox(key){
  const c=IMG_BOXES[key], box=$(c.prev), count=$(c.count); if(!box||!count) return;
  const arr=state[key], last=arr.length-1;
  box.innerHTML=arr.map((src,i)=>`<div class="sell-image-item"><img src="${src}" alt="Poza ${i+1}">${i===0?'<span class="sell-image-cover">Principală</span>':''}<button type="button" class="sell-image-remove" data-remove-img="${key}:${i}" aria-label="Șterge poza">×</button><div class="sell-image-move"><button type="button" data-move-img="${key}:${i}" data-dir="-1" aria-label="Mută poza ${i+1} mai devreme"${i===0?' disabled':''}>‹</button><button type="button" data-move-img="${key}:${i}" data-dir="1" aria-label="Mută poza ${i+1} mai târziu"${i===last?' disabled':''}>›</button></div></div>`).join('');
  count.textContent=arr.length?`${arr.length}/${c.max} poze selectate`:'';
}
async function handleImgBox(e){
  const key=e.target.dataset.imgKey, c=IMG_BOXES[key]; if(!c) return;
  let files=[...e.target.files]; e.target.value='';
  const room=c.max-state[key].length;
  if(files.length>room){ toast(room>0?`Poți adăuga încă ${room} poze (maximum ${c.max}). Le-am luat pe primele.`:`Ai deja ${c.max} poze.`); files=files.slice(0,Math.max(0,room)); }
  if(!files.length) return;
  state[key+'Busy']=true; $(c.count).textContent='Se procesează pozele…';
  try{ for(const file of files){ try{ state[key].push(await fileToDataUrl(file)); }catch(err){ toast(err.message); } } }
  finally{ state[key+'Busy']=false; renderImgBox(key); }
}
function imgGalleryHtml(images, alt, big){
  const list=(Array.isArray(images)?images:[]).filter(Boolean); if(!list.length) return '';
  const n=list.length;
  return `<div class="ad-gal${big?'':' req-gal'}"><div class="detail-gallery ad-slider${big?'':' req-slider'}" data-slider>${list.map((src,i)=>`<button type="button" class="detail-gallery-item" data-lightbox-src="${esc(src)}" data-lightbox-alt="${esc(alt)}" data-lightbox-index="${i}" aria-label="Vezi poza ${i+1} mai mare"><img src="${esc(src)}" alt="${esc(alt)} - poza ${i+1}" loading="lazy" decoding="async"></button>`).join('')}</div>${n>1?`<button type="button" class="ad-nav prev" data-ad-slide="-1" aria-label="Poza anterioară">‹</button><button type="button" class="ad-nav next" data-ad-slide="1" aria-label="Poza următoare">›</button><span class="ad-count">1 / ${n}</span><div class="ad-dots" aria-hidden="true">${list.map((_,i)=>`<i class="${i===0?'on':''}"></i>`).join('')}</div>`:''}</div>`;
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
/* Compatibilitate cu mașina activă din garaj (după marcă și model) */
function garageFitHtml(x){
  const g = garageActive(); if(!g || !x || !x.make || x.type==='dezmembrari') return '';
  const nm = esc(garageName(g)), noModel = !x.model || /^alt model$/i.test(x.model);
  if(x.make!==g.make || (!noModel && x.model!==g.model)) return `<div class="ad-fit bad">⚠ Piesa este pentru ${esc([x.make,noModel?'':x.model].filter(Boolean).join(' '))}, nu pentru mașina ta activă (${nm}).</div>`;
  if(noModel) return '';
  return `<div class="ad-fit ok">✓ Aceeași marcă și același model ca mașina ta: <b>${nm}</b>. Verifică anul și codul OEM înainte de comandă.</div>`;
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
function setReqMode(editId){
  const form=$('#requestForm'); form.dataset.editId=editId||'';
  const h=document.querySelector('#page-request h2'); if(h) h.textContent=editId?'Modifică cererea':'Primește oferte piese';
  const b=form.querySelector('button[type="submit"]'); if(b) b.textContent=editId?'Salvează modificările':'Trimite cererea';
}
async function fillRequestEdit(id){
  const r=(await api('/api/requests/mine/'+id)).request;
  if(!r||!(Number(r.edit_secs)>0)){ toast('Au trecut cele 10 minute în care puteai modifica cererea.'); navigate('requests?t=mine'); return; }
  setReqMode(id);
  $('#reqTitle').value=r.title||''; $('#reqDescription').value=r.description||'';
  const parts=Array.isArray(r.extra_parts)?r.extra_parts:[];
  parts.forEach(p=>{ addReqPart(); const d=$('#reqExtra').lastElementChild; d.querySelector('.rp-title').value=p.title||''; d.querySelector('.rp-details').value=p.details||''; });
  ensureOption($('#reqMake'), r.make||''); await loadModels(r.make||'','reqModel'); ensureOption($('#reqModel'), r.model||'');
  if(r.make&&r.model) loadYears(r.make,r.model);
  resetCarAutoFor('req',{make:true,model:true,year:true});
  $('#reqYear').value=r.year||''; $('#reqVariant').value=r.variant||''; $('#reqEngine').value=r.engine||''; $('#reqVin').value=r.vin||'';
  $('#reqKind').value=r.kind||''; $('#reqCounty').value=r.county||''; $('#reqCity').value=r.city||''; $('#reqAddress').value=r.ship_address||'';
  state.reqImages=(r.images||[]).filter(Boolean); renderImgBox('reqImages');
  setMsg($('#requestMessage'),'Mai poți modifica cererea ~'+Math.max(1,Math.ceil(Number(r.edit_secs)/60))+' min.','');
}
async function enterRequestForm(fromId, editId){
  const form = $('#requestForm'); form.reset(); resetCarAutoFor('req'); $('#reqExtra').innerHTML = ''; setMsg($('#requestMessage'),''); state.reqImages=[]; renderImgBox('reqImages');
  setReqMode('');
  if(editId){ await loadModels('','reqModel'); await fillRequestEdit(editId); return; }
  api('/api/account/settings').then(r=>{ const u=r.user||{}; if(!$('#reqCounty').value&&u.ship_county) $('#reqCounty').value=u.ship_county; if(!$('#reqCity').value) $('#reqCity').value=u.ship_city||''; if(!$('#reqAddress').value) $('#reqAddress').value=u.ship_details||''; }).catch(()=>{});
  await loadModels('','reqModel');
  if(!fromId){
    const g = garageActive();
    if(g){ ensureOption($('#reqMake'), g.make); await loadModels(g.make,'reqModel'); ensureOption($('#reqModel'), g.model); loadYears(g.make,g.model); if(g.year) $('#reqYear').value = g.year; resetCarAutoFor('req',{make:true,model:true,year:!!g.year}); }
    return;
  }
  let c = savedCars.find(x=>String(x.id)===String(fromId));
  if(!c){ try{ await loadSavedCars(); }catch{} c = savedCars.find(x=>String(x.id)===String(fromId)); }
  if(!c) return;
  ensureOption($('#reqMake'), c.make);
  await loadModels(c.make,'reqModel');
  ensureOption($('#reqModel'), c.model);
  loadYears(c.make,c.model);
  resetCarAutoFor('req',{make:true,model:true,year:!!c.year});
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
  if(state.reqImagesBusy){ setMsg(msg,'Așteaptă să se proceseze pozele.','error'); return; }
  const extra=[...document.querySelectorAll('#reqExtra .req-part')].map(p=>({title:p.querySelector('.rp-title').value.trim(),details:p.querySelector('.rp-details').value.trim()})).filter(x=>x.title);
  try{
    const editId=$('#requestForm').dataset.editId||'';
    await api(editId?'/api/requests/'+editId:'/api/requests',{method:editId?'PATCH':'POST',body:JSON.stringify({title:$('#reqTitle').value.trim(),make:$('#reqMake').value,model:$('#reqModel').value,year,description:$('#reqDescription').value,variant:$('#reqVariant').value.trim(),engine:$('#reqEngine').value.trim(),vin:$('#reqVin').value.trim(),kind:$('#reqKind').value,county:$('#reqCounty').value,city:$('#reqCity').value.trim(),ship_address:$('#reqAddress').value.trim(),extra_parts:extra,images:state.reqImages})});
    e.target.reset(); resetCarAutoFor('req'); $('#reqExtra').innerHTML=''; state.reqImages=[]; renderImgBox('reqImages'); await loadModels('','reqModel'); setReqMode('');
    if(editId){ toast('Cererea a fost modificată.'); navigate('requests?t=mine'); return; }
    setMsg(msg,'Cererea a fost trimisă. O găsești în Cererile mele.','ok');
  }catch(err){ setMsg(msg,err.message,'error'); }
}
const SELL_TEXT = {
  piesa:{title:'Piesa care o vinzi', titleInfo:'Scrie ce piesă vinzi și pentru ce mașină. Ex: Far dreapta BMW Seria 3 E90.', titlePh:'ex. Far dreapta BMW Seria 3 2008',
    desc:'Descrie piesa', descInfo:'Descrie starea piesei, codul OEM și orice detaliu important. Marca, modelul și anul se completează automat din text.', descPh:'Descrie piesa, starea și detaliile importante...'},
  dezmembrari:{title:'Mașina de dezmembrat', titleInfo:'Scrie marca, modelul, anul și motorizarea mașinii. Ex: BMW Seria 3 E90 2008, 2.0 diesel.', titlePh:'ex. BMW Seria 3 E90 2008',
    desc:'Descrie piesele', descInfo:'Scrie ce piese sunt disponibile, în ce stare se află și orice detaliu important. Marca, modelul și anul se completează automat din text.', descPh:'Descrie piesele disponibile, starea lor și detaliile importante...'}
};
function syncSellType(){
  const d = $('#sellType').value==='dezmembrari';
  $('#sellConditionWrap').classList.toggle('hidden', d);
  $('#sellDismBlock').classList.toggle('hidden', !d);
  $('#sellCategoryField').classList.toggle('hidden', d);
  const T = SELL_TEXT[d?'dezmembrari':'piesa'];
  $('#sellTitleLabel').textContent = T.title; $('#sellTitleInfo').dataset.info = T.titleInfo; $('#sellTitle').placeholder = T.titlePh;
  $('#sellDescLabel').textContent = T.desc;   $('#sellDescInfo').dataset.info = T.descInfo;   $('#sellDescription').placeholder = T.descPh;
}
function setSellMode(editId){
  state.editId = editId || null;
  $('#sellHeading').textContent = editId ? 'Editează anunțul' : 'Adaugă o piesă';
  $('#sellSub').textContent = editId ? 'Modificările la titlu, descriere, poze sau datele mașinii trec din nou prin verificare.' : 'Publicarea unui anunț necesită autentificare.';
  $('#sellSubmit').textContent = editId ? 'Salvează modificările' : 'Publică anunțul';
  $('#sellCancelEdit').classList.toggle('hidden', !editId);
}
function updateDiscountPreview(){
  const out=$('#sellDiscountEstimate'); if(!out) return;
  const p=Number($('#sellPrice').value)||0, d=Math.round(Number($('#sellDiscount').value)||0);
  if(p>0 && d>0 && d<=50) out.innerHTML=`Se va afișa: <del>${esc(money(p))}</del> <b>${esc(money(Math.round(p*(1-d/100))))}</b> <b>-${d}%</b>`;
  else if(d>50) out.textContent='Reducerea maximă este 50%.';
  else out.textContent='0-50% reducere. Pe anunț apare prețul vechi tăiat și prețul nou.';
}
document.addEventListener('input',e=>{ if(e.target&&(e.target.id==='sellPrice'||e.target.id==='sellDiscount')) updateDiscountPreview(); });
function resetSellForm(){
  $('#sellForm').reset(); updateDiscountPreview(); state.sellImages=[]; renderSellImages(); $('#sellDelivery').checked=true;
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
  $('#sellYear').value = x.year||''; $('#sellOem').value = x.oem||''; $('#sellOemAlt').value = x.oem_alt||'';
  $('#sellEngine').value = x.engine||''; $('#sellKm').value = x.km!=null ? String(x.km) : ''; $('#sellVin').value = x.vin||''; $('#sellParts').value = x.parts_avail||'';
  $('#sellPrice').value = Number(x.price)>0 ? String(Number(x.price)) : '';
  $('#sellDiscount').value = Number(x.discount_percent)>0 ? String(Math.round(Number(x.discount_percent))) : ''; updateDiscountPreview();
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
  if($('#sellTitle').value.trim().length<3){ focusBad($('#sellTitle'), type==='dezmembrari' ? 'Scrie mașina de dezmembrat (minimum 3 caractere).' : 'Scrie piesa pe care o vinzi (minimum 3 caractere).'); return; }
  if(type!=='dezmembrari' && !$('#sellCategory').value){ focusBad($('#sellCategoryBtn'),'Alege categoria piesei.'); return; }
  if(!$('#sellMake').value){ focusBad($('#sellMake'),'Alege marca mașinii. Se completează automat dacă o scrii în titlu sau descriere.'); return; }
  if(!$('#sellModel').value){ focusBad($('#sellModel'),'Alege modelul mașinii (sau „Alt model”).'); return; }
  if(!$('#sellCounty').value){ focusBad($('#sellCounty'),'Alege județul.'); return; }
  if(btn){ btn.disabled=true; btn.textContent='Se trimite…'; }
  try{
    await applySellPhone();
    const payload = JSON.stringify({type,title:$('#sellTitle').value.trim(),price:$('#sellPrice').value||0,condition:type==='dezmembrari'?'Second-hand':$('#sellCondition').value,category:$('#sellCategory').value,subcategory:$('#sellSubcategory').value,seller_type:$('#sellSellerType').value,make:$('#sellMake').value,model:$('#sellModel').value,year,oem:$('#sellOem').value.trim(),oem_alt:$('#sellOemAlt').value.trim(),county:$('#sellCounty').value,description:$('#sellDescription').value,delivery:$('#sellDelivery').checked,negotiable:$('#sellNegotiable').checked,images:state.sellImages,engine:$('#sellEngine').value.trim(),km:$('#sellKm').value,vin:$('#sellVin').value.trim(),parts_avail:$('#sellParts').value.trim(),discount_percent:Math.max(0,Math.min(50,Math.round(Number($('#sellDiscount').value)||0)))});
    const editing = state.editId;
    let r;
    if(editing) r = await api('/api/listings/'+editing,{method:'PATCH',body:payload});
    else{
      try{ r = await api('/api/listings',{method:'POST',body:payload}); }
      catch(err){
        if(err.code!=='COST_CONFIRM' || !confirm(err.message+' Continui?')) throw err;
        r = await api('/api/listings',{method:'POST',body:JSON.stringify({...JSON.parse(payload),confirm_cost:true})});
      }
    }
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
  $('#billCompany').value = u.bill_company || ''; $('#billName').value = u.bill_name || '';
  const bt = u.bill_type || ((u.bill_company||u.bill_cui)?'pj':'pf'); $$('input[name="billType"]').forEach(r=>{ r.checked = r.value===bt; }); syncBillType(); $('#billCui').value = u.bill_cui || ''; $('#billRegcom').value = u.bill_regcom || '';
  $('#billAddress').value = u.bill_address || ''; $('#billBank').value = u.bill_bank || ''; $('#billIban').value = u.bill_iban || '';
  $('#storeName').value = u.store_name || ''; $('#storeSite').value = u.store_site || '';
  state.storeLogo = undefined; state.storeLogoRemove = false; $('#storeLogoFile').value = '';
  const pv = $('#storeLogoPreview');
  if(u.has_logo){ pv.src = '/api/stores/'+u.id+'/logo?v='+Date.now(); pv.classList.remove('hidden'); $('#storeLogoRemove').classList.remove('hidden'); }
  else { pv.removeAttribute('src'); pv.classList.add('hidden'); $('#storeLogoRemove').classList.add('hidden'); }
  $('#mailMsg').checked = u.mail_msg !== false; $('#mailOffer').checked = u.mail_offer !== false; $('#mailOrder').checked = u.mail_order !== false; $('#mailAlert').checked = u.mail_alert !== false;
  $('#deletePassword').value = ''; $('#deleteConfirm').checked = false;
  $('#vacationOn').checked = !!u.vacation; $('#vacationUntil').value = u.vacation_until || '';
  $('#vacationUntil').min = new Date().toISOString().slice(0,10); $('#vacationUntil').disabled = !u.vacation; setMsg($('#vacationMsg'),'');
  renderPhones();
  loadSessions().catch(()=>{}); loadBlocks().catch(()=>{});
}
async function saveNotifPrefs(e){
  e.preventDefault(); const msg=$('#notifMsg'); setMsg(msg,'');
  try{ await api('/api/account/notif-prefs',{method:'PUT',body:JSON.stringify({mail_msg:$('#mailMsg').checked,mail_offer:$('#mailOffer').checked,mail_order:$('#mailOrder').checked,mail_alert:$('#mailAlert').checked})}); setMsg(msg,'Preferințele au fost salvate.','ok'); }
  catch(err){ setMsg(msg,err.message,'error'); }
}
/* ---------- mod vacanță, utilizatori blocați, sesiuni active ---------- */
function uaLabel(ua){
  const s=String(ua||'');
  const dev=/iPhone/.test(s)?'iPhone':/iPad/.test(s)?'iPad':/Android/.test(s)?'Android':/Windows/.test(s)?'Windows':/Mac OS X|Macintosh/.test(s)?'Mac':/Linux|X11/.test(s)?'Linux':'dispozitiv necunoscut';
  const br=/Edg\//.test(s)?'Edge':/OPR\/|Opera/.test(s)?'Opera':/Firefox\//.test(s)?'Firefox':/Chrome\/|CriOS\//.test(s)?'Chrome':/Safari\//.test(s)?'Safari':'Browser';
  return br+' pe '+dev;
}
function fmtDateTimeShort(iso){ const d=new Date(iso); return isNaN(d)?'':d.toLocaleString('ro-RO',{dateStyle:'short',timeStyle:'short'}); }
async function loadSessions(){
  const box=$('#sessionList'); if(!box) return;
  const r=await api('/api/auth/sessions'), list=r.sessions||[];
  box.innerHTML=list.map(x=>`<div class="sess-row"><div><b>${esc(uaLabel(x.user_agent))}</b>${x.current?' <span class="badge new">Acest dispozitiv</span>':''}<small>Ultima activitate: ${esc(fmtDateTimeShort(x.last_seen_at))} · conectat pe ${esc(fmtDate(x.created_at))}</small></div>${x.current?'':`<button type="button" class="set-btn" data-session-del="${x.id}">Deconectează</button>`}</div>`).join('')||'<p class="muted">Nu există sesiuni active.</p>';
  $('#sessionsOthersBtn').classList.toggle('hidden', list.filter(x=>!x.current).length===0);
}
async function loadBlocks(){
  const box=$('#blockList'); if(!box) return;
  const r=await api('/api/blocks'), list=r.blocks||[];
  box.innerHTML=list.map(b=>`<div class="block-row"><div><b>${esc(b.name||'Utilizator')}</b><small>blocat pe ${esc(fmtDate(b.created_at))}</small></div><button type="button" class="set-btn" data-unblock="${b.id}">Deblochează</button></div>`).join('')||'<p class="muted">Nu ai blocat pe nimeni.</p>';
}
async function saveVacation(e){
  e.preventDefault(); const msg=$('#vacationMsg'); setMsg(msg,'');
  try{
    const on=$('#vacationOn').checked, until=$('#vacationUntil').value||null;
    const r=await api('/api/account/vacation',{method:'PUT',body:JSON.stringify({on,until})});
    setMsg(msg, r.vacation ? ('Modul vacanță este activ'+(r.vacation_until?' până la '+fmtDate(r.vacation_until+'T00:00:00'):'')+'. Anunțurile tale sunt ascunse din căutări.') : 'Modul vacanță este oprit. Anunțurile tale sunt din nou vizibile.','ok');
  }catch(err){ setMsg(msg,err.message,'error'); }
}
async function addBlock(e){
  e.preventDefault(); const msg=$('#blockMsg'), inp=$('#blockNick'); setMsg(msg,'');
  const nick=inp.value.trim(); if(!nick) return;
  try{ await api('/api/blocks',{method:'POST',body:JSON.stringify({nickname:nick})}); inp.value=''; await loadBlocks(); setMsg(msg,'Utilizatorul a fost blocat.','ok'); }
  catch(err){ setMsg(msg,err.message,'error'); }
}
async function toggleBlock(uid,isBlocked){
  if(!isBlocked && !confirm('Blochezi acest utilizator? Nu îți va mai putea trimite mesaje, comenzi sau oferte.')) return false;
  if(isBlocked) await api('/api/blocks/'+encodeURIComponent(uid),{method:'DELETE'});
  else await api('/api/blocks',{method:'POST',body:JSON.stringify({user_id:Number(uid)})});
  toast(isBlocked?'Utilizatorul a fost deblocat.':'Utilizatorul a fost blocat.');
  return true;
}
document.addEventListener('click', e=>{
  const t=e.target; if(!(t&&t.closest)) return; let el;
  if((el=t.closest('[data-session-del]'))){ safe(async()=>{ await api('/api/auth/sessions/'+el.dataset.sessionDel,{method:'DELETE'}); await loadSessions(); toast('Dispozitivul a fost deconectat.'); })(); return; }
  if(t.closest('#sessionsOthersBtn')){ if(!confirm('Te deconectezi de pe toate celelalte dispozitive? Rămâi conectat doar aici.')) return; safe(async()=>{ const r=await api('/api/auth/sessions/others',{method:'DELETE'}); await loadSessions(); toast(r.removed?`Ai deconectat ${r.removed} ${r.removed===1?'dispozitiv':'dispozitive'}.`:'Nu mai există alte dispozitive conectate.'); })(); return; }
  if((el=t.closest('[data-unblock]'))){ safe(async()=>{ if(await toggleBlock(el.dataset.unblock,true)) await loadBlocks(); })(); return; }
  if((el=t.closest('[data-block-toggle]'))){ const uid=el.dataset.blockToggle, was=el.dataset.blocked==='1'; safe(async()=>{ if(await toggleBlock(uid,was)) renderAccountTool('messages',uid); })(); return; }
  if((el=t.closest('[data-seller-block]'))){ const uid=el.dataset.sellerBlock, was=el.dataset.blocked==='1'; safe(async()=>{ if(await toggleBlock(uid,was)) openSellerProfile(uid); })(); return; }
});
document.addEventListener('change', e=>{
  const t=e.target; if(!t) return;
  if(t.id==='vacationOn') $('#vacationUntil').disabled=!t.checked;
  if(t.matches&&t.matches('[data-saved-alert]')){
    const on=t.checked;
    safe(async()=>{ try{ await api('/api/saved-searches/'+t.dataset.savedAlert,{method:'PATCH',body:JSON.stringify({alerts:on})}); toast(on?'Alertele sunt pornite pentru această căutare.':'Alertele sunt oprite pentru această căutare.'); }catch(err){ t.checked=!on; throw err; } })();
  }
});
async function exportMyData(){
  const msg=$('#dangerMsg'), btn=$('#exportBtn'); setMsg(msg,''); btn.disabled=true;
  try{
    const r=await fetch('/api/account/export',{credentials:'same-origin'});
    if(!r.ok){ let m='Nu am putut genera exportul.'; try{ const d=await r.json(); if(d&&d.error&&ERR[d.error]) m=ERR[d.error]; }catch{} throw new Error(m); }
    const url=URL.createObjectURL(await r.blob()), a=document.createElement('a');
    a.href=url; a.download='autoparts-datele-mele.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),2000);
    setMsg(msg,'Fișierul a fost descărcat.','ok');
  }catch(err){ setMsg(msg,err.message,'error'); }
  btn.disabled=false;
}
async function deleteMyAccount(e){
  e.preventDefault(); const msg=$('#dangerMsg'); setMsg(msg,'');
  if(!$('#deletePassword').value){ setMsg(msg,'Introdu parola curentă.','error'); return; }
  if(!$('#deleteConfirm').checked){ setMsg(msg,'Bifează confirmarea.','error'); return; }
  if(!confirm('Sigur ștergi contul? Acțiunea este definitivă.')) return;
  try{
    await api('/api/account/delete',{method:'POST',body:JSON.stringify({password:$('#deletePassword').value})});
    currentUser=null; renderHeader(); navigate('home'); toast('Contul a fost șters.'); loadFooterLogos();
  }catch(err){ setMsg(msg,err.message,'error'); }
}
function logoToDataUrl(file){
  return new Promise((resolve,reject)=>{
    if(!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error('Sunt acceptate doar JPG, PNG sau WebP.'));
    if(file.size>10*1024*1024) return reject(new Error('Logo-ul poate avea maximum 10 MB.'));
    const rd=new FileReader(); rd.onload=()=>{
      const img=new Image(); img.onload=()=>{
        const sc=Math.min(1,480/img.naturalWidth,240/img.naturalHeight);
        const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(img.naturalWidth*sc)); c.height=Math.max(1,Math.round(img.naturalHeight*sc));
        const ctx=c.getContext('2d'); ctx.drawImage(img,0,0,c.width,c.height);
        let out=c.toDataURL('image/png');
        if(out.length>400000) out=c.toDataURL('image/webp',.85);
        if(out.length>400000||!/^data:image\/(png|webp)/.test(out)){ ctx.globalCompositeOperation='destination-over'; ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height); out=c.toDataURL('image/jpeg',.85); }
        if(out.length>440000) return reject(new Error('Logo-ul este prea complex. Încearcă o imagine mai simplă.'));
        resolve(out);
      }; img.onerror=()=>reject(new Error('Imaginea nu a putut fi citită.')); img.src=rd.result;
    }; rd.onerror=()=>reject(new Error('Fișierul nu a putut fi citit.')); rd.readAsDataURL(file);
  });
}
async function onStoreLogoPick(){
  const f=$('#storeLogoFile').files[0]; if(!f) return; const msg=$('#storeMsg'); setMsg(msg,'');
  try{ state.storeLogo=await logoToDataUrl(f); state.storeLogoRemove=false; const pv=$('#storeLogoPreview'); pv.src=state.storeLogo; pv.classList.remove('hidden'); $('#storeLogoRemove').classList.remove('hidden'); }
  catch(err){ state.storeLogo=undefined; $('#storeLogoFile').value=''; setMsg(msg,err.message,'error'); }
}
async function saveStore(e){
  e.preventDefault(); const msg=$('#storeMsg'); setMsg(msg,'');
  try{
    const body={store_name:$('#storeName').value,store_site:$('#storeSite').value};
    if(state.storeLogo) body.logo=state.storeLogo;
    if(state.storeLogoRemove) body.remove_logo=true;
    await api('/api/account/store',{method:'PUT',body:JSON.stringify(body)});
    await loadSettings(); loadFooterLogos(); setMsg(msg,'Profilul de magazin a fost salvat.','ok');
  }catch(err){ setMsg(msg,err.message,'error'); }
}
/* rândul de logo-uri din subsol (prima pagină rămâne neschimbată) */
async function loadFooterLogos(){
  const box=$('#footerLogos'), strip=$('#logoStrip'); if(!box||!strip) return;
  try{
    const r=await fetch('/api/stores/logos',{credentials:'same-origin'}); if(!r.ok) return;
    const list=((await r.json()).stores)||[];
    if(!list.length){ box.classList.add('hidden'); strip.innerHTML=''; return; }
    strip.innerHTML=list.map(s=>`<button type="button" class="logo-item" data-seller-profile="${s.id}" title="${esc(s.name)}" aria-label="${esc(s.name)}"><img src="/api/stores/${s.id}/logo" alt="${esc(s.name)}" loading="lazy" decoding="async"></button>`).join('');
    box.classList.remove('hidden');
  }catch{}
}
async function saveDetails(e){
  e.preventDefault(); const msg = $('#detailsMsg'); setMsg(msg,'');
  try{
    await api('/api/account/details',{method:'PUT',body:JSON.stringify({ship_county:$('#shipCounty').value,ship_city:$('#shipCity').value,ship_details:$('#shipDetails').value,bill_type:(document.querySelector('input[name="billType"]:checked')||{}).value||'',bill_name:$('#billName').value,bill_company:$('#billCompany').value,bill_cui:$('#billCui').value,bill_regcom:$('#billRegcom').value,bill_address:$('#billAddress').value,bill_bank:$('#billBank').value,bill_iban:$('#billIban').value})});
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
async function confirmEmail(params){
  const token = params.get('token'), el = $('#verifyEmailMsg');
  if(!token){ el.textContent='Link invalid.'; return; }
  try{ const r = await api('/api/auth/verify-email',{method:'POST',body:JSON.stringify({token})}); if(currentUser) currentUser.email_verified = true; renderHeader(); el.textContent = r.message; }
  catch(e){ el.textContent = e.message; }
}
function renderVerifyBanner(){
  const b = $('#verifyBanner'); if(!b) return;
  const v = window.__verif;
  b.classList.toggle('hidden', !(currentUser && currentUser.email_verified===false && v && v.enabled));
}
document.addEventListener('click', async e=>{
  const b = e.target.closest('#resendVerifyBtn'); if(!b) return;
  b.disabled = true;
  try{ const r = await api('/api/auth/resend-verification',{method:'POST',body:'{}'}); toast(r.message||'Email trimis.'); }
  catch(err){ toast(err.message); }
  finally{ setTimeout(()=>{ b.disabled = false; },4000); }
});
async function confirmEmailChange(params){
  const token = params.get('token'), el = $('#verifyEmailChangeMsg');
  if(!token){ el.textContent='Link invalid.'; return; }
  try{ const r = await api('/api/account/email-change/confirm',{method:'POST',body:JSON.stringify({token})}); currentUser=null; renderHeader(); el.textContent=r.message; }
  catch(e){ el.textContent=e.message; }
}

/* ---------- administrare ---------- */
let adminEvKind = 'all';
let adminTab = 'dashboard', adminData = null, adminFilter = 'all', adminQuery = '', adminOpenId = null;
function adminListRows(){
  const q = adminQuery.trim().toLowerCase();
  const L = adminData.listings.filter(x=>(adminFilter==='all'||x.status===adminFilter) && (!q || [x.id,x.title,x.seller_name,x.seller_email,x.make,x.model,x.oem].join(' ').toLowerCase().includes(q)));
  if(!L.length) return '<p class="muted">Nu există anunțuri pentru filtrul ales.</p>';
  return L.map(x=>{
    const st = STATUS_LABEL[x.status]||[x.status,''], n = Number(x.image_count)||0;
    return `<article class="adm-row" data-admin-open="${x.id}">
      <div class="adm-thumb">${n?`<img loading="lazy" decoding="async" alt="" src="/api/admin/listings/${x.id}/img/0">`:'<span>📷</span>'}${n>1?`<span class="adm-count">${n} poze</span>`:''}</div>
      <div class="adm-main"><b>#${x.id} · ${esc(x.title)}</b> <span class="badge ${st[1]}">${esc(st[0])}</span>
        <p>${money(x.price)} · ${esc(x.type)} · ${esc(x.county||'—')} · ${fmtDate(x.created_at)} · 👁 ${Number(x.views)||0}</p>
        <p class="muted">${esc(x.seller_name||'Fără vânzător')} · ${esc(x.seller_email||'')}</p>
        <div class="admin-actions">${adminBtns('listing',x.id,[['Aprobă','approved'],['Respinge','rejected'],['Blochează','blocked']])}<button class="btn ghost small" data-admin="listing-edit" data-id="${x.id}">Editează</button>${currentUser.role==='admin'?`<button class="btn danger small" data-admin="listing-del" data-id="${x.id}">Șterge</button>`:''}</div></div>
    </article>`;
  }).join('');
}
function adminListingsHtml(){
  const s = adminData.s, all = adminData.listings;
  const cnt = k => k==='all' ? all.length : all.filter(x=>x.status===k).length;
  const chips = [['all','Toate'],['pending','În așteptare'],['approved','Publicate'],['sold','Vândute'],['rejected','Respinse'],['blocked','Blocate'],['deleted','Șterse']]
    .map(([k,l])=>`<button type="button" class="adm-chip${adminFilter===k?' on':''}" data-adm-filter="${k}">${l} <i>${cnt(k)}</i></button>`).join('');
  return `${s.pending?`<div class="admin-actions" style="margin:0 0 12px"><button class="btn primary small" data-admin="approve-all">Aprobă toate cele ${s.pending} în așteptare</button></div>`:''}
    <div class="adm-toolbar"><input id="adminSearch" type="search" placeholder="Caută după titlu, ID, vânzător, email, marcă, OEM…" value="${esc(adminQuery)}"><div class="adm-chips">${chips}</div></div>
    <div class="admin-list adm-list" id="adminListBox">${adminListRows()}</div>`;
}
async function openAdminListing(id){
  adminOpenId = id;
  const modal = $('#adminListingModal'), box = $('#adminListingBody');
  box.innerHTML = '<p class="muted">Se încarcă…</p>'; modal.classList.remove('hidden');
  const x = (await api('/api/admin/listings/'+id)).listing, n = Number(x.image_count)||0;
  const st = STATUS_LABEL[x.status]||[x.status,''];
  const row = (l,v)=> v||v===0 ? `<div><small>${l}</small><b>${esc(v)}</b></div>` : '';
  const imgs = n ? `<div class="adm-gallery"><div class="adm-main-img" id="admMainBox"><img id="admMainImg" alt="" src="/api/admin/listings/${x.id}/img/0"></div>${n>1?`<div class="adm-thumbs">${Array.from({length:n},(_,i)=>`<button type="button" class="${i?'':'on'}" data-adm-img="${i}"><img loading="lazy" alt="" src="/api/admin/listings/${x.id}/img/${i}"></button>`).join('')}</div>`:''}</div>` : '<p class="muted">Anunțul nu are poze.</p>';
  box.innerHTML = `<h3 class="adm-title">#${x.id} · ${esc(x.title)}</h3><p><span class="badge ${st[1]}">${esc(st[0])}</span> <b class="adm-price">${money(x.price)}</b>${x.negotiable?' · negociabil':''}</p>${imgs}
    <div class="adm-grid">${row('Tip',x.type)}${row('Stare',x.condition)}${row('Marcă',x.make)}${row('Model',x.model)}${row('An',x.year)}${row('Motor',x.engine)}${row('Combustibil',x.fuel)}${row('Categorie',x.category)}${row('OEM',x.oem)}${row('Cantitate',x.quantity)}${row('Județ',x.county)}${row('Livrare',x.delivery?'Da':'Nu')}${row('Vizualizări',x.views)}${row('Publicat',x.created_at?new Date(x.created_at).toLocaleString('ro-RO'):'')}</div>
    ${x.description?`<div class="adm-desc"><small>Descriere</small><p>${esc(x.description).replace(/\n/g,'<br>')}</p></div>`:''}
    <div class="adm-seller"><small>Vânzător</small><p><b>${esc(x.seller_name||'Fără vânzător')}</b> · ${esc(x.seller_email||'')}${x.seller_phone?' · '+esc(x.seller_phone):''}</p></div>
    <div class="admin-actions">${adminBtns('listing',x.id,[['Aprobă','approved'],['Respinge','rejected'],['Blochează','blocked']])}<button class="btn ghost small" data-admin="listing-edit" data-id="${x.id}">Editează</button>${currentUser.role==='admin'?`<button class="btn danger small" data-admin="listing-del" data-id="${x.id}">Șterge</button>`:''}</div>`;
}
async function loadAdmin(){
  if(!currentUser || (currentUser.role!=='admin' && currentUser.role!=='moderator')){ navigate('home'); toast('Zona de administrare este disponibilă doar administratorilor și moderatorilor.'); return; }
  try{
    const get = async (u,k) => { try{ return (await api(u))[k] || []; }catch(e){ console.error('admin',u,e.message); return []; } };
    const ovr = await api('/api/admin/overview');
    const full = currentUser.role==='admin', none = async()=>[];
    const [users,listings,requests,reports,activity,offers,orders,messages] = await Promise.all([get('/api/admin/users','users'),get('/api/admin/listings','listings'),get('/api/admin/requests','requests'),get('/api/admin/reports','reports'),full?get('/api/admin/activity','activity'):none(),full?get('/api/admin/offers','offers'):none(),full?get('/api/admin/orders','orders'):none(),full?get('/api/admin/messages','messages'):none()]);
    const events = full ? await get('/api/admin/events','events') : [];
    let feat = null; if(full){ try{ feat = await api('/api/admin/features'); }catch(e){ console.error('admin features',e.message); } }
    adminData = {s:ovr.stats,users,listings,requests,reports,activity,offers,orders,messages,events,feat};
    renderAdmin();
  }catch(e){ $('#adminContent').innerHTML = `<p>${esc(e.message)}</p>`; }
}
function adminBtns(kind, id, items){ return items.map(([label,status])=>`<button class="btn ghost small" data-admin="${kind}" data-id="${id}" data-status="${status}">${label}</button>`).join(''); }
const EV_LABEL = {listing_create:['📝','Anunț nou'],listing_edit:['✏️','Anunț editat'],listing_sold:['✅','Marcat vândut'],listing_resale:['♻️','Repus la vânzare'],import:['📥','Import CSV'],price_bulk:['💰','Prețuri actualizate'],vacation_on:['🌴','Vacanță pornită'],vacation_off:['🏠','Vacanță oprită'],block:['🚫','Utilizator blocat'],unblock:['↩️','Blocare ridicată'],rating:['⭐','Calificativ nou'],rating_edit:['⭐','Calificativ modificat'],account_delete:['🗑️','Cont șters']};
const evWhen = d => new Date(d).toLocaleString('ro-RO');
function adminEventsHtml(){
  const all = adminData.events || [];
  const kinds = Object.keys(EV_LABEL).filter(k=>all.some(e=>e.kind===k));
  const chips = [['all','Toate',all.length]].concat(kinds.map(k=>[k,EV_LABEL[k][1],all.filter(e=>e.kind===k).length]))
    .map(([k,l,n])=>`<button type="button" class="adm-chip${adminEvKind===k?' on':''}" data-ev-filter="${k}">${esc(l)} <i>${n}</i></button>`).join('');
  const rows = all.filter(e=>adminEvKind==='all'||e.kind===adminEvKind).map(e=>{
    const [ic,lb] = EV_LABEL[e.kind]||['•',e.kind];
    const who = e.user_name ? `${esc(e.user_name)}${e.user_email?' · '+esc(e.user_email):''}` : 'Cont șters / necunoscut';
    return `<article class="info-card"><b>${ic} ${esc(lb)}</b><p>${who} · ${evWhen(e.created_at)}</p><small>${esc(e.target_type||'')}${e.target_id?' #'+e.target_id:''}${e.details?' · '+esc(e.details):''}</small></article>`;
  }).join('') || '<p class="muted">Nu există evenimente încă. Apar de acum încolo, pe măsură ce utilizatorii folosesc site-ul (păstrate 180 de zile).</p>';
  return `<div class="adm-toolbar"><div class="adm-chips">${chips}</div></div><div class="admin-list">${rows}</div>`;
}
function adminFeaturesHtml(){
  const f = adminData.feat;
  if(!f) return '<p class="muted">Nu am putut încărca rezumatul funcțiilor noi.</p>';
  const rt = f.ratings||{seller:{},buyer:{},latest:[]};
  const stat = (t,v,sm)=>`<div class="stat"><b>${t}</b><h3>${v}</h3>${sm?`<small>${sm}</small>`:''}</div>`;
  const cards = `<div class="stat-grid">${stat('Sesiuni active',f.sessions.n,f.sessions.users+' utilizatori')}${stat('În vacanță',f.vacation.length,'vânzători')}${stat('Blocări',f.blocks.total,'între utilizatori')}${stat('Căutări salvate',f.saved.total,f.saved.alerts+' cu alerte')}</div>
    <div class="stat-grid" style="margin-top:12px">${stat('Calificative vânzători',rt.seller.n||0,rt.seller.n?'medie '+String(rt.seller.avg).replace('.',','):'')}${stat('Calificative cumpărători',rt.buyer.n||0,rt.buyer.n?'medie '+String(rt.buyer.avg).replace('.',','):'')}${stat('Importuri CSV',f.imports30,'ultimele 30 de zile')}</div>`;
  const vac = f.vacation.length ? f.vacation.map(u=>`<article class="info-card"><b>🌴 ${esc(u.name||'—')}</b> <small>#${u.id} · ${esc(u.email||'')}</small><p>${u.until?'Până la '+esc(fmtDate(u.until+'T00:00:00')):'Fără dată de întoarcere'} · ${u.ads} anunțuri ascunse din căutări</p></article>`).join('') : '<p class="muted">Niciun vânzător în vacanță.</p>';
  const blk = f.blocks.latest.length ? f.blocks.latest.map(b=>`<article class="info-card"><b>🚫 ${esc(b.blocker)} a blocat ${esc(b.blocked)}</b><p class="muted">#${b.blocker_id} → #${b.blocked_id} · ${evWhen(b.created_at)}</p></article>`).join('') : '<p class="muted">Nicio blocare.</p>';
  const rat = rt.latest.length ? rt.latest.map(r=>`<article class="info-card"><b>${starsHtml(r.stars)} ${r.stars}/5 · ${esc(r.rated)} <small>(${r.kind==='seller'?'vânzător':'cumpărător'})</small></b><p class="muted">de la ${esc(r.rater)} · comanda #${r.order_id} · ${evWhen(r.created_at)}</p>${r.comment?`<p>${esc(r.comment)}</p>`:''}<div class="admin-actions"><button class="btn ghost small" data-admin="rating-edit" data-rkind="${r.kind}" data-id="${r.id}" data-stars="${r.stars}" data-comment="${esc(r.comment||'')}">Editează</button><button class="btn danger small" data-admin="rating-del" data-rkind="${r.kind}" data-id="${r.id}">Șterge calificativul</button></div></article>`).join('') : '<p class="muted">Niciun calificativ încă.</p>';
  return `${cards}<h3 class="ad-h">Vânzători în vacanță</h3><div class="admin-list">${vac}</div><h3 class="ad-h">Blocări recente</h3><div class="admin-list">${blk}</div><h3 class="ad-h">Calificative recente</h3><div class="admin-list">${rat}</div>`;
}
function renderAdmin(){
  const d = adminData, s = d.s;
  const tabs = [['dashboard','Dashboard'],['listings',`Anunțuri${s.pending?` (${s.pending})`:''}`],['users','Utilizatori'],['requests','Cereri piese'],['offers','Oferte'],['orders','Comenzi'],['messages','Mesaje'],['credits','Credite'],['reports',`Raportări${s.reports?` (${s.reports})`:''}`],['events','Evenimente'],['features','Funcții noi'],['activity','Activitate'],['vehicles','Mașini']].filter(t=>currentUser.role==='admin'||['dashboard','listings','users','requests','reports'].includes(t[0]));
  if(!tabs.some(t=>t[0]===adminTab)) adminTab='dashboard';
  let body = '';
  if(adminTab==='dashboard') body = `<div class="stat-grid"><div class="stat"><b>Utilizatori</b><h3>${s.users}</h3><small>${s.activeUsers} activi</small></div><div class="stat"><b>Anunțuri</b><h3>${s.listings}</h3><small>${s.approved} aprobate · ${s.pending} în așteptare · ${s.rejected} respinse</small></div><div class="stat"><b>Raportări deschise</b><h3>${s.reports}</h3></div><div class="stat"><b>Cereri deschise</b><h3>${s.requests}</h3></div></div>`;
  if(adminTab==='dashboard') body += `<div class="stat-grid" style="margin-top:12px"><div class="stat"><b>Oferte</b><h3>${s.offers||0}</h3></div><div class="stat"><b>Comenzi</b><h3>${s.orders||0}</h3></div><div class="stat"><b>Mesaje trimise</b><h3>${s.messages||0}</h3><small>doar numărul, conținutul e privat</small></div></div>`;
  if(adminTab==='offers') body = `<div class="admin-list">${d.offers.map(x=>`<article class="info-card"><b>#${x.id} · ${esc(x.request_title)}</b><p>${money(x.price)} · ${esc(x.status)} · ${fmtDate(x.created_at)}</p><small>Vânzător: ${esc(x.seller_name||'—')} · Cumpărător: ${esc(x.buyer_name||'—')}</small><div class="admin-actions"><button class="btn danger small" data-admin="offer-del" data-id="${x.id}">Șterge oferta</button></div></article>`).join('')||'<p>Nu există oferte.</p>'}</div>`;
  if(adminTab==='orders') body = `<div class="admin-list">${d.orders.map(x=>`<article class="info-card"><b>#${x.id} · ${esc(x.title||'Comandă')}</b><p>${money(x.price)} · ${esc(x.status)} · ${fmtDate(x.created_at)}</p><small>Vânzător: ${esc(x.seller_name||'—')} · Cumpărător: ${esc(x.buyer_name||'—')}</small><div class="admin-actions"><button class="btn danger small" data-admin="order-del" data-id="${x.id}">Șterge comanda</button></div></article>`).join('')||'<p>Nu există comenzi.</p>'}</div>`;
  if(adminTab==='listings') body = adminListingsHtml();
  if(adminTab==='messages') body = `<div class="admin-list"><div class="info-card"><b>Moderare mesaje</b><p class="muted">Ultimele 200 de mesaje. Caută după text sau email. Ștergerea unui mesaj e definitivă și rămâne în jurnal.</p></div>${(adminData.messages||[]).map(x=>`<article class="info-card"><b>#${x.id} · ${esc(x.sender_name||'—')} → ${esc(x.recipient_name||'—')}</b><p class="muted">${esc(x.sender_email||'')} · ${evWhen(x.created_at)}</p><p>${esc(String(x.body||'').slice(0,300))}</p><div class="admin-actions"><button class="btn danger small" data-admin="msg-del" data-id="${x.id}">Șterge mesajul</button></div></article>`).join('')||'<p>Nu există mesaje.</p>'}</div>`;
  if(adminTab==='credits') body = `<div class="admin-list"><div class="info-card"><b>Credite în conturi</b><p class="muted">Adaugă credite unui utilizator (cu număr negativ le retragi). Utilizatorul le folosește la promovarea anunțurilor.</p></div>${d.users.slice().sort((a,b)=>(Number(b.credits)||0)-(Number(a.credits)||0)).map(x=>`<article class="info-card"><b>#${x.id} · ${esc(x.name||'—')}</b><p>${esc(x.email)} · <b>${Number(x.credits)||0}</b> credite</p><div class="admin-actions"><button class="btn primary small" data-admin="user-credits" data-id="${x.id}">+ Credite</button></div></article>`).join('')}</div>`;
  if(adminTab==='users'){
    const isAd = currentUser.role==='admin', ROLE_LBL = {admin:'administrator',moderator:'moderator',user:'utilizator'};
    body = `<div class="admin-list">${d.users.map(x=>{
      const canAct = isAd || x.role==='user', self = Number(x.id)===Number(currentUser.id);
      const roleBtns = (isAd && !self) ? ['user','moderator','admin'].filter(r=>r!==x.role).map(r=>`<button class="btn ghost small" data-admin="user-role" data-id="${x.id}" data-role="${r}">${r==='user'?(x.role==='admin'?'Scoate admin':'Scoate moderator'):('Fă '+ROLE_LBL[r])}</button>`).join('') : '';
      return `<article class="info-card"><b>#${x.id} · ${esc(x.name||'—')}</b><p>${esc(x.email)} · ${esc(ROLE_LBL[x.role]||x.role)} · ${esc(x.status)}</p>${(x.req_posted||x.offers_sent)?`<p class="muted">${x.req_posted?`Cumpărător: ${x.req_posted} cereri · ${x.req_resolved||0} rezolvate · ${x.req_cancelled||0} anulate · ${x.req_expired||0} expirate`:''}${x.req_posted&&x.offers_sent?' | ':''}${x.offers_sent?`Vânzător: ${x.offers_sent} oferte · ${x.offers_won||0} câștigate`:''}</p>`:''}<div class="admin-actions">${isAd?`<button class="btn ghost small" data-admin="user-credits" data-id="${x.id}">Credite: ${Number(x.credits)||0}</button>`:''}${canAct?adminBtns('user',x.id,[['Activează','active'],['Blochează','blocked'],...(x.has_logo?[['Șterge logo','remove_logo']]:[])]):''}${roleBtns}${isAd&&x.role!=='admin'?`<button class="btn danger small" data-admin="user-del" data-id="${x.id}">Șterge contul</button>`:''}</div></article>`;
    }).join('')||'<p>Nu există utilizatori.</p>'}</div>`;
  }
  if(adminTab==='requests') body = `<div class="admin-list">${d.requests.map(x=>`<article class="info-card"><b>#${x.id} · ${esc(x.title)}</b><p>${esc(x.user_name||'—')} · ${esc(x.status)}</p><div class="admin-actions">${adminBtns('request',x.id,[['Deschisă','open'],['Potrivită','matched'],['Închisă','closed']])}</div></article>`).join('')||'<p>Nu există cereri.</p>'}</div>`;
  if(adminTab==='reports') body = `<div class="admin-list">${d.reports.map(x=>`<article class="info-card"><b>#${x.id} · ${esc(x.reason)}</b><p>${esc(x.listing_title||'Anunț')} · ${esc(x.reporter_name||'—')} · ${esc(x.status)}</p>${x.details?`<p>${esc(x.details)}</p>`:''}<div class="admin-actions">${adminBtns('report',x.id,[['Marchează verificată','reviewed'],['Închide','closed']])}</div></article>`).join('')||'<p>Nu există raportări.</p>'}</div>`;
  if(adminTab==='activity') body = `<div class="admin-list">${d.activity.map(x=>`<article class="info-card"><b>${esc(x.action)}</b><p>${esc(x.admin_name||'Admin')} · ${new Date(x.created_at).toLocaleString('ro-RO')}</p><small>${esc(x.target_type||'')} #${x.target_id||''} · ${esc(x.details||'')}</small></article>`).join('')||'<p>Nu există activitate.</p>'}</div>`;
  if(adminTab==='events') body = adminEventsHtml();
  if(adminTab==='features') body = adminFeaturesHtml();
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
  else if(kind==='listing-del'){ if(!confirm('Ștergi definitiv anunțul?')) return; await api(`/api/admin/listings/${id}`,{method:'DELETE'}); if(String(adminOpenId)===String(id)){ adminOpenId=null; closeModal($('#adminListingModal')); } }
  else if(kind==='user-credits'){ const v=prompt('Câte credite adaugi? (număr negativ ca să retragi)','10'); if(v===null) return; const n=Math.trunc(Number(String(v).replace(',','.'))); if(!n){ toast('Număr invalid.'); return; } const note=prompt('Notă (opțional)','')||''; await api(`/api/admin/users/${id}/credits`,{method:'POST',body:JSON.stringify({amount:n,note})}); toast('Creditele au fost actualizate.'); }
  else if(kind==='user'){
    if(status==='blocked'){
      const reason=prompt('Motivul blocării (obligatoriu, îl vede utilizatorul):','');
      if(reason===null) return;
      if(!reason.trim()){ toast('Motivul este obligatoriu.'); return; }
      await api(`/api/admin/users/${id}`,{method:'PATCH',body:JSON.stringify({status,reason:reason.trim()})});
    } else await api(`/api/admin/users/${id}`,{method:'PATCH',body:JSON.stringify({status})});
  }
  else if(kind==='user-role'){
    const role=el.dataset.role, lbl={user:'utilizator obișnuit',moderator:'moderator',admin:'administrator'}[role];
    if(!confirm('Schimbi rolul acestui cont în '+lbl+'?'+(role==='admin'?' Va avea acces complet la administrare, inclusiv credite și ștergerea conturilor.':''))) return;
    await api(`/api/admin/users/${id}/role`,{method:'PATCH',body:JSON.stringify({role})}); toast('Rolul a fost schimbat.');
  }
  else if(kind==='user-del'){ if(!confirm('Ștergi DEFINITIV acest cont? Se șterg și anunțurile, mesajele și ofertele lui. Acțiunea nu poate fi anulată.')) return; if(prompt('Scrie ȘTERGE pentru confirmare:','')!=='ȘTERGE'){ toast('Anulat.'); return; } await api(`/api/admin/users/${id}`,{method:'DELETE'}); toast('Contul a fost șters.'); }
  else if(kind==='listing-edit'){
    const l=(adminData.listings||[]).find(x=>String(x.id)===String(id))||{};
    const title=prompt('Titlu anunț:',l.title||''); if(title===null) return;
    const price=prompt('Preț (lei):',String(l.price??'')); if(price===null) return;
    if(!title.trim()){ toast('Titlul nu poate fi gol.'); return; }
    if(price!==''&&(!Number.isFinite(Number(price))||Number(price)<0)){ toast('Preț invalid.'); return; }
    await api(`/api/admin/listings/${id}`,{method:'PATCH',body:JSON.stringify({title:title.trim(),price:price===''?0:Number(price)})});
    toast('Anunțul a fost actualizat.');
  }
  else if(kind==='rating-edit'){
    const stars=prompt('Note (1-5):',String(el.dataset.stars||'')); if(stars===null) return;
    const s=Number(stars); if(!Number.isInteger(s)||s<1||s>5){ toast('Notele trebuie să fie între 1 și 5.'); return; }
    const comment=prompt('Textul recenziei:',el.dataset.comment||''); if(comment===null) return;
    await api(`/api/admin/ratings/${el.dataset.rkind}/${id}`,{method:'PATCH',body:JSON.stringify({stars:s,comment})});
    toast('Recenzia a fost actualizată.');
  }
  else if(kind==='rating-del'){ if(!confirm('Ștergi acest calificativ? Acțiunea rămâne în jurnalul de activitate.')) return; await api(`/api/admin/ratings/${el.dataset.rkind}/${id}`,{method:'DELETE'}); }
  else if(kind==='msg-del'){ if(!confirm('Ștergi definitiv acest mesaj?')) return; await api(`/api/admin/messages/${id}`,{method:'DELETE'}); toast('Mesaj șters.'); }
  else if(kind==='offer-del'){ if(!confirm('Ștergi această ofertă?')) return; await api(`/api/admin/offers/${id}`,{method:'DELETE'}); toast('Oferta a fost ștearsă.'); }
  else if(kind==='order-del'){ if(!confirm('Ștergi această comandă? Se pierde și istoricul ei.')) return; await api(`/api/admin/orders/${id}`,{method:'DELETE'}); toast('Comanda a fost ștearsă.'); }
  else if(kind==='request') await api(`/api/admin/requests/${id}`,{method:'PATCH',body:JSON.stringify({status})});
  else if(kind==='report') await api(`/api/admin/reports/${id}`,{method:'PATCH',body:JSON.stringify({status})});
  else if(kind==='rating-del'){ if(!confirm('Ștergi acest calificativ? Acțiunea rămâne în jurnalul de activitate.')) return; await api(`/api/admin/ratings/${el.dataset.rkind}/${id}`,{method:'DELETE'}); }
  await loadAdmin();
  if(adminOpenId && !$('#adminListingModal').classList.contains('hidden')) await openAdminListing(adminOpenId);
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
  box.innerHTML = g.cars.length ? g.cars.map(c=>`<div class="garage-item${c.id===g.active?' active':''}"><button type="button" class="garage-pick" data-garage-use="${esc(c.id)}"><b>${esc(garageName(c))}</b><small>${c.id===g.active?'Mașina activă':'Folosește această mașină'}</small></button><button type="button" class="garage-see" data-garage-parts="${esc(c.id)}">Vezi piese</button><button type="button" class="garage-del" data-garage-del="${esc(c.id)}" aria-label="Șterge">×</button></div>`).join('')
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
  $('#garageForm').reset(); resetCarAutoFor('garage'); loadModels('','garageModel'); renderGarageList(); updateGarageUI();
  setMsg(msg,'Mașina a fost salvată în garaj. Apasă „Vezi piese” lângă ea ca să vezi piesele potrivite.','ok');
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
  else if(a==='requests?t=mine') navigate('requests?t=mine');
}
function accountAction(a){
  if(a==='settings') navigate('settings');
  else if(a==='listings') navigate('anunturile-mele');
  else if(a==='listings-expire') navigate('anunturile-mele?tab=expire');
  else if(a==='favorites') navigate('rezultate?mode=fav');
  else if(a==='requests') navigate('requests?t=mine');
  else if(a==='saved') navigate('saved');
  else if(a==='messages') navigate('mesagerie');
  else if(['offers','orders-seller','offers-received','orders','messages','notifications','credits','transactions','invoices','stats','offer-questions','bulk-price','generator','b2b','ratings'].includes(a)) navigate('account-tool?view='+encodeURIComponent(a));
}


async function sendListingMessage(btn){
  const box=$('#msgBox'); if(!box) return;
  const body=$('#msgText').value.trim(), st=$('#msgStatus');
  if(!body){ setMsg(st,'Scrie un mesaj.','error'); return; }
  btn.disabled=true; setMsg(st,'Se trimite…');
  try{
    await api('/api/messages',{method:'POST',body:JSON.stringify({to:Number(box.dataset.to),body,listing_id:Number(box.dataset.listing)})});
    setMsg(st,'Mesaj trimis. Răspunsul îl vei primi în Contul meu → Mesaje.','ok');
    $('#msgText').value=''; toast('Mesaj trimis.');
  }catch(e){ setMsg(st,e.message||'Mesajul nu a putut fi trimis.','error'); }
  finally{ btn.disabled=false; }
}
async function openSellerProfile(id){
  const modal=$('#sellerModal'), box=$('#sellerContent');
  box.innerHTML='<p class="muted">Se încarcă…</p>'; modal.classList.remove('hidden');
  try{
    const s=(await api('/api/sellers/'+id)).seller, nm=esc(s.name||'Vânzător');
    const own=currentUser&&currentUser.id===s.id;
    const rows=[['Tip vânzător',s.dism?'Dezmembrări':s.seller_type],['Firmă',s.company],['Județ',s.county],['Pe site din',s.since?fmtDate(s.since):''],['Anunțuri active',String(s.count)]].filter(r=>r[1]);
    const phones=contactHtml(s.phones||[],'Vânzătorul',s.id,own,null), canMsg=!own, hasPh=(s.phones||[]).length>0;
    box.innerHTML=`<div class="seller-head">${avatarSpan(s.id,s.name||'V','seller-avatar')}<div><b>${nm}</b><small>${esc(s.dism?'Dezmembrări':(s.seller_type||'Vânzător'))}</small><div class="rate-line">Ca vânzător: ${ratingLine(s.rating,s.id,'seller')}</div><div class="rate-line">Ca cumpărător: ${ratingLine(s.buyer_rating,s.id,'buyer')}</div></div></div>
    <dl class="detail-grid">${rows.map(r=>`<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>
    ${s.vacation?`<div class="vac-banner">🌴 Vânzătorul este în vacanță${s.vacation.until?' până la '+esc(fmtDate(s.vacation.until+'T00:00:00')):''}.</div>`:''}
    ${(hasPh||canMsg)?contactFoldHtml(phones+(canMsg?`<button type="button" class="btn ghost contact-msg" data-seller-msg="${s.id}">✉️ Trimite mesaj</button>`:'')):''}
    <div class="contact-row"><button type="button" class="btn ghost small" data-seller="${s.id}" data-sname="${nm}">Vezi anunțurile</button>${(own||!currentUser)?'':`<button type="button" class="btn ghost small" data-seller-block="${s.id}" data-blocked="${s.blocked_by_me?1:0}">${s.blocked_by_me?'Deblochează':'🚫 Blochează'}</button>`}</div><div class="rate-list hidden" id="sellerRatings"></div>`;
    if((s.rating&&s.rating.count)||(s.buyer_rating&&s.buyer_rating.count)) loadSellerRatings(s.id);
  }catch(e){ box.innerHTML=`<p>${esc(e.message||'Profilul nu a putut fi încărcat.')}</p>`; }
}
/* Contul meu: pe telefon (<=800px) se deschide o singură secțiune o dată; pe desktop rămân independente */
document.addEventListener('click', e=>{
  const sum = e.target.closest && e.target.closest('.account-sections summary');
  if(!sum || !window.matchMedia('(max-width:800px)').matches) return;
  const cur = sum.parentElement;
  if(cur.hasAttribute('open')) return;
  $$('.account-sections details[open]').forEach(d=>{ if(d!==cur) d.removeAttribute('open'); });
});
document.addEventListener('click', e=>{
  const t = e.target;
  if(t.classList && t.classList.contains('modal')){ closeModal(t); return; }
  let el;
  if((el=t.closest('[data-phones-open]'))){
    e.stopPropagation();
    const lid=Number(el.dataset.phonesOpen), pm=$('#phonesModal'), pc=$('#phonesContent');
    pc.innerHTML=`<div class="eyebrow">CONTACT</div><h2>Contactează vânzătorul</h2>${contactHtml(detailPhones,'Vânzătorul',null,false,lid)}${$('#msgBox')?'<button type="button" class="btn ghost contact-msg" data-msg-open="1">✉️ Trimite mesaj</button>':''}`;
    pm.classList.remove('hidden');
    if(window.track) window.track('contact_seller');
    return;
  }
  if((el=t.closest('[data-fav]'))){ e.stopPropagation(); toggleFavorite(Number(el.dataset.fav)); return; }
  if((el=t.closest('[data-cart]'))){ e.stopPropagation(); toggleCart(Number(el.dataset.cart),el); return; }
  if((el=t.closest('[data-cart-del]'))){ toggleCart(Number(el.dataset.cartDel)); renderAccountTool('cart'); return; }
  if((el=t.closest('[data-edit-listing]'))){ e.stopPropagation(); { const dm=$('#detailModal'); if(dm) dm.classList.add('hidden'); } navigate('vinde?edit='+Number(el.dataset.editListing)); return; }
  if((el=t.closest('[data-d-promo]'))){ e.stopPropagation(); safe(promoDialog)(Number(el.dataset.dPromo)); return; }
  if((el=t.closest('[data-promo-go]'))){ e.stopPropagation(); safe(()=>promoGo(el))(); return; }
  if((el=t.closest('[data-promo-credits]'))){ $('#promoModal').classList.add('hidden'); navigate('account-tool?view=credits'); return; }
  if((el=t.closest('[data-d-bump]'))){ e.stopPropagation(); const id=Number(el.dataset.dBump); safe(async()=>{
    const r=await api('/api/listings/'+id+'/bump',{method:'POST'});
    const nd=r&&r.listing&&r.listing.created_at;
    const it=(state.loaded||[]).find(x=>x.id===id); if(it&&nd) it.created_at=nd;
    if(typeof mine!=='undefined'&&mine.items){ const mi=mine.items.find(x=>x.id===id); if(mi&&nd) mi.created_at=nd; }
    try{ renderList(); }catch{}
    openDetail(id,true); toast('Anunțul a fost actualizat și urcă în listă.');
  })(); return; }
  if((el=t.closest('[data-sold-listing]'))){ e.stopPropagation(); const id=Number(el.dataset.soldListing), to=el.dataset.to; safe(async()=>{ await api('/api/listings/'+id+'/status',{method:'PATCH',body:JSON.stringify({status:to})}); const it=state.loaded.find(x=>x.id===id); if(it) it.status=to; renderList(); { const dm=$('#detailModal'); if(dm&&!dm.classList.contains('hidden')) openDetail(id,true); } toast(to==='sold'?'Anunțul a fost marcat ca vândut.':'Anunțul este din nou la vânzare.'); })(); return; }
  if((el=t.closest('[data-del-listing]'))){ e.stopPropagation(); const id=Number(el.dataset.delListing); if(confirm('Ștergi acest anunț?')) safe(async()=>{ await api('/api/listings/'+id,{method:'DELETE'}); state.loaded=state.loaded.filter(x=>x.id!==id); state.total=state.loaded.length; renderList(); { const dm=$('#detailModal'); if(dm) dm.classList.add('hidden'); } toast('Anunțul a fost șters.'); })(); return; }
  if((el=t.closest('[data-edit-request]'))){ if(Date.now()>Number(el.dataset.editUntil||0)){ toast('Au trecut cele 10 minute în care puteai modifica cererea.'); loadRequests(true); return; } navigate('cerere-noua?edit='+el.dataset.editRequest); return; }
  if((el=t.closest('[data-react-request]'))){ const id=el.dataset.reactRequest; safe(async()=>{ await api('/api/requests/'+id+'/reactivate',{method:'POST'}); { const rm=$('#requestModal'); if(rm) rm.classList.add('hidden'); } toast('Cererea e din nou activă pentru încă 7 zile.'); rqTab='open'; loadRequests(true); })(); return; }
  if((el=t.closest('[data-del-request]'))){ const id=el.dataset.delRequest; if(confirm('Ștergi această cerere?')) safe(async()=>{ await api('/api/requests/'+id,{method:'DELETE'}); { const rm=$('#requestModal'); if(rm) rm.classList.add('hidden'); } toast('Cererea a fost ștearsă.'); loadRequests(true); })(); return; }
  if((el=t.closest('[data-track-phone]'))){ try{ fetch('/api/listings/'+Number(el.dataset.trackPhone)+'/phone-click',{method:'POST',keepalive:true,credentials:'same-origin'}).catch(()=>{}); }catch{} }
  if((el=t.closest('[data-order]'))){ e.stopPropagation(); safe(openOrder)(Number(el.dataset.order)); return; }
  if((el=t.closest('[data-order-listing]'))){ safe(openOrderListing)(el.dataset.orderListing); return; }
  if((el=t.closest('[data-order-save]'))){ const oid=el.dataset.oid, kind=el.dataset.orderSave;
    const body=kind==='awb'?{awb:($('#ordAwb')||{}).value||''}:{seller_note:($('#ordSellerNote')||{}).value||''};
    safe(async()=>{ await api('/api/orders/'+oid+'/details',{method:'PATCH',body:JSON.stringify(body)}); toast(kind==='awb'?'AWB salvat.':'Observațiile au fost salvate.'); renderAccountTool('order',oid); })(); return; }
  if((el=t.closest('[data-order-print]'))){ const oid=el.dataset.orderPrint; safe(async()=>{ const r=await api('/api/orders'); const o=r.orders.find(x=>String(x.id)===String(oid)); if(o) printOrder(o); })(); return; }
  if((el=t.closest('[data-order-status]'))){ const oid=el.dataset.orderStatus, to=el.dataset.to;
    if(el.dataset.bySeller==='1'&&(to==='suspended'||to==='cancelled')){ openOrderReason(oid,to,el.dataset.hasListing==='1',el.dataset.title); return; }
    if(to==='cancelled'&&!confirm('Sigur vrei să anulezi comanda?')) return;
    if(to==='completed'&&!confirm('Marchezi comanda ca finalizată?')) return; safe(async()=>{ await api('/api/orders/'+oid+'/status',{method:'PATCH',body:JSON.stringify({status:to})}); toast('Comanda a fost actualizată.'); renderAccountTool(currentToolView||'orders'); })(); return; }
  if((el=t.closest('[data-offer-request]'))){ if(!currentUser){ openAuth(location.hash.replace(/^#\//,'')); return; } $('#offerEditId').value=''; $('#offerTitle').textContent='Trimite o ofertă'; $('#offerRequestId').value=el.dataset.offerRequest; $('#offerPrice').value=''; $('#offerMessage').value=''; state.offerImages=[]; state.offerImagesLoaded=false; renderImgBox('offerImages'); setMsg($('#offerMessageStatus'),''); $('#offerModal').classList.remove('hidden'); return; }
  if((el=t.closest('[data-offer-accept]'))){ if(confirm('Accepți această ofertă? Celelalte oferte vor fi respinse.')) safe(async()=>{ await api('/api/offers/'+el.dataset.offerAccept+'/accept',{method:'POST'}); toast('Ofertă acceptată. Comanda a fost creată. După finalizare poți califica vânzătorul.'); refreshAfterOfferChange(); })(); return; }
  if((el=t.closest('[data-offer-reject]'))){ if(confirm('Refuzi această ofertă?')) safe(async()=>{ await api('/api/offers/'+el.dataset.offerReject+'/reject',{method:'POST'}); toast('Oferta a fost refuzată.'); refreshAfterOfferChange(); })(); return; }
  if((el=t.closest('[data-offer-edit]'))){ const o=offersMine.find(x=>x.id===Number(el.dataset.offerEdit)); if(!o) return; $('#offerRequestId').value=o.request_id; $('#offerEditId').value=o.id; $('#offerTitle').textContent='Modifică oferta'; $('#offerPrice').value=o.price; $('#offerMessage').value=o.message||''; setMsg($('#offerMessageStatus'),''); state.offerImages=[]; state.offerImagesLoaded=false; renderImgBox('offerImages'); $('#offerModal').classList.remove('hidden'); api('/api/offers/mine?id='+o.id).then(r=>{ const f=(r.offers||[])[0]; state.offerImages=((f&&f.images)||[]).filter(Boolean); state.offerImagesLoaded=true; renderImgBox('offerImages'); }).catch(()=>{}); return; }
  if((el=t.closest('[data-offer-del]'))){ if(confirm('Retragi această ofertă? Cumpărătorul nu o va mai vedea.')) safe(async()=>{ await api('/api/offers/'+el.dataset.offerDel,{method:'DELETE'}); toast('Oferta a fost retrasă.'); $('#requestModal').classList.add('hidden'); refreshAfterOfferChange(); })(); return; }
  if((el=t.closest('[data-acc-range]'))){ const r=el.dataset.accRange; if(accStats.range===r&&accStats.data) return; accStats.range=r; accStats.data=null; drawAccStats(); api('/api/stats/account?range='+r).then(d=>{ if(accStats.range!==r) return; accStats.data=d; drawAccStats(); }).catch(e=>{ const b=$('#statsBody'); if(b&&accStats.range===r) b.insertAdjacentHTML('beforeend','<p class="muted">Nu am putut încărca statisticile. '+esc((e&&e.message)||'')+'</p>'); }); return; }
  if(t.closest('#accGraphBtn')){ drawAccChart(); const c=$('#accChart'); if(c) c.scrollIntoView({block:'nearest',behavior:'smooth'}); return; }
  if((el=t.closest('[data-stats-range]'))){ statsRange=Number(el.dataset.statsRange)||0; drawStats(); return; }
  if((el=t.closest('[data-stats-pick]'))){ statsPick=el.dataset.statsPick; drawStats(); const sb=$('#statsBox'); if(sb) sb.scrollIntoView({block:'start',behavior:'smooth'}); return; }
  if((el=t.closest('[data-reviews]'))){ e.stopPropagation(); $$('.modal').forEach(m=>m.classList.add('hidden')); navigate('account-tool?view=reviews&with='+Number(el.dataset.reviews)+'&ref='+(el.dataset.role==='buyer'?'buyer':'seller')); return; }
  if((el=t.closest('[data-seller-profile]'))){ e.stopPropagation(); openSellerProfile(Number(el.dataset.sellerProfile)); return; }
  if((el=t.closest('[data-open-request],[data-offer-open]'))){
    const inner=t.closest('button,a');
    if(!(inner && inner!==el && el.contains(inner))){
      if(el.dataset.offerOpen) openRequestModal(Number(el.dataset.offerOpen),'offer');
      else openRequestModal(Number(el.dataset.openRequest), el.dataset.mode||'public');
      return;
    }
  }
  if((el=t.closest('[data-contact-toggle]'))){
    const pnl=el.parentElement.querySelector('.contact-panel'); if(pnl){ const open=pnl.classList.toggle('hidden')===false; el.setAttribute('aria-expanded',open?'true':'false'); el.classList.toggle('open',open); }
    return;
  }
  if((el=t.closest('[data-req-contact]'))){ safe(requestContact)(el.dataset.reqContact, el); return; }
  if((el=t.closest('[data-msg-open]'))){
    { const pm0=$('#phonesModal'); if(pm0) pm0.classList.add('hidden'); }
    if(!currentUser){ openAuth(location.hash.replace(/^#\//,'')); return; }
    const b=$('#msgBox'); if(b){ b.classList.toggle('hidden'); if(!b.classList.contains('hidden')){ b.scrollIntoView({block:'nearest',behavior:'smooth'}); const ta=$('#msgText'); ta.focus(); ta.setSelectionRange(ta.value.length,ta.value.length); } }
    return;
  }
  if((el=t.closest('[data-msg-quick]'))){ const ta=$('#msgText'); if(ta){ ta.value=el.dataset.msgQuick; ta.focus(); ta.setSelectionRange(ta.value.length,ta.value.length); } return; }
  if((el=t.closest('[data-send-msg]'))){ sendListingMessage(el); return; }
  if((el=t.closest('[data-facet-cond]'))){ const sel=$('#filterCondition'); if(sel){ sel.value=el.dataset.facetCond; onFilterChange(); } return; }
  if((el=t.closest('[data-rel]'))){ try{ const p=JSON.parse(el.dataset.rel); const next={...state.filters}; delete next.sort; if(p.category) delete next.category; if(p.make){ delete next.make; delete next.model; } openSearch({...next,...p}); }catch{} return; }
  if((el=t.closest('[data-seller-profile]'))){ openSellerProfile(Number(el.dataset.sellerProfile)); return; }
  if((el=t.closest('[data-seller-msg]'))){
    if(!currentUser){ openAuth(location.hash.replace(/^#\//,'')); return; }
    $$('.modal').forEach(m=>m.classList.add('hidden')); navigate('account-tool?view=messages&with='+Number(el.dataset.sellerMsg)); return;
  }
  if((el=t.closest('[data-seller]'))){ $$('.modal').forEach(m=>m.classList.add('hidden')); openSearch({seller_id:el.dataset.seller, sname:el.dataset.sname}); return; }
  if((el=t.closest('[data-cat]'))){ openSearch({category:el.dataset.cat}); return; }
  if((el=t.closest('[data-search-dism]'))){ openSearch({q:el.dataset.searchDism}); return; }
  if((el=t.closest('[data-saved-go]'))){ navigate('rezultate?'+el.dataset.savedGo); return; }
  if((el=t.closest('[data-saved-rm]'))){ safe(async()=>{ await api('/api/saved-searches/'+el.dataset.savedRm,{method:'DELETE'}); await renderSaved(); })(); return; }
  if((el=t.closest('[data-saved-open]'))){ const s=getSaved()[Number(el.dataset.savedOpen)]; if(s) navigate('rezultate?'+s.qs); return; }
  if((el=t.closest('[data-saved-del]'))){ const list=getSaved(); list.splice(Number(el.dataset.savedDel),1); writeJSON('autopiese_saved_searches',list); renderSaved(); return; }
  if((el=t.closest('[data-ad-slide]'))){ const g=el.closest('.ad-gal'), sl=g&&g.querySelector('.ad-slider'); if(sl) sl.scrollBy({left:Number(el.dataset.adSlide)*sl.clientWidth,behavior:'smooth'}); return; }
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
  if((el=t.closest('[data-ev-filter]'))){ adminEvKind=el.dataset.evFilter; renderAdmin(); return; }
  if((el=t.closest('[data-adm-filter]'))){ adminFilter=el.dataset.admFilter; renderAdmin(); return; }
  if((el=t.closest('[data-adm-img]'))){ const m=$('#admMainImg'); if(m) m.src=el.querySelector('img').src.replace(/\/img\/\d+$/,'/img/'+el.dataset.admImg); $$('#adminListingBody [data-adm-img]').forEach(b=>b.classList.toggle('on',b===el)); return; }
  if((el=t.closest('#notifBtn'))){ toggleNotifSummary(); return; }
  if((el=t.closest('[data-notif-go]'))){ const b=$('#notifSummary'); if(b) b.classList.add('hidden'); const nb=$('#notifBtn'); if(nb) nb.setAttribute('aria-expanded','false'); accountAction(el.dataset.notifGo); return; }
  if((el=t.closest('[data-admin-open]'))){ safe(openAdminListing)(el.dataset.adminOpen); return; }
  if((el=t.closest('[data-action]'))){ doAction(el.dataset.action); return; }
  if((el=t.closest('[data-account]'))){ accountAction(el.dataset.account); return; }
  if((el=t.closest('[data-go]'))){ navigate(el.dataset.go); return; }
  if((el=t.closest('[data-legal]'))){ const am=$('#authModal'); if(am) am.classList.add('hidden'); navigate(el.dataset.legal); return; }
  if((el=t.closest('[data-back]'))){ if(history.length>1) history.back(); else navigate('home'); return; }
  if((el=t.closest('[data-close]'))){ closeModal(el.closest('.modal')); return; }
  if((el=t.closest('[data-password-toggle]'))){
    const input = document.getElementById(el.dataset.passwordToggle); if(!input) return;
    const show = input.type==='password'; input.type = show?'text':'password';
    el.textContent = show?'◌':'◉'; el.setAttribute('aria-label', show?'Ascunde parola':'Arată parola'); return;
  }
  if((el=t.closest('[data-open]'))){ openDetail(Number(el.dataset.open), state.mode==='mine'); return; }
});
document.addEventListener('click', e=>{ const b=e.target.closest('[data-remove-sell-image]'); if(b){ state.sellImages.splice(Number(b.dataset.removeSellImage),1); renderSellImages(); return; }
  const m=e.target.closest('[data-move-sell-image]'); if(m){ const i=Number(m.dataset.moveSellImage), k=i+Number(m.dataset.dir), a=state.sellImages; if(k>=0&&k<a.length){ [a[i],a[k]]=[a[k],a[i]]; renderSellImages(); } } });
document.addEventListener('submit', e=>{ const f=e.target.closest&&e.target.closest('#msgForm'); if(!f) return; e.preventDefault(); safe(async()=>{ await api('/api/messages',{method:'POST',body:JSON.stringify({to:Number(f.dataset.to),body:$('#msgBody').value,listing_id:f.dataset.ref?Number(f.dataset.ref):undefined})}); renderAccountTool('messages',f.dataset.to,f.dataset.ref); })(); });
document.addEventListener('keydown', e=>{
  if(!$('#imageLightbox')?.classList.contains('hidden')){
    if(e.key==='Escape'){ e.preventDefault(); closeLightbox(); return; }
    if(e.key==='ArrowLeft'){ e.preventDefault(); moveLightbox(-1); return; }
    if(e.key==='ArrowRight'){ e.preventDefault(); moveLightbox(1); return; }
  }
  if(e.key==='Escape'){ const m=$$('.modal').filter(x=>!x.classList.contains('hidden')).pop(); if(m) closeModal(m); }
  if((e.key==='Enter'||e.key===' ') && e.target.matches && e.target.matches('.listing[data-open],.ar-row[data-open]')){ e.preventDefault(); openDetail(Number(e.target.dataset.open)); }
  if((e.key==='Enter'||e.key===' ') && e.target.matches && e.target.matches('.ar-row[data-offer-open]')){ e.preventDefault(); openRequestModal(Number(e.target.dataset.offerOpen),'offer'); }
  if((e.key==='Enter'||e.key===' ') && e.target.matches && e.target.matches('.ar-row[data-open-request],.rq-pub-row[data-open-request]')){ e.preventDefault(); openRequestModal(Number(e.target.dataset.openRequest), e.target.dataset.mode||'public'); }
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
  $('#garageModal').addEventListener('click', e=>{
    const u=e.target.closest('[data-garage-use]'), d=e.target.closest('[data-garage-del]'), o=e.target.closest('[data-garage-off]'), p=e.target.closest('[data-garage-parts]');
    if(p){ const car=garageData().cars.find(c=>c.id===p.dataset.garageParts); if(car){ garageUse(car.id); $('#garageModal').classList.add('hidden'); openSearch({make:car.make, model:car.model}); } }
    else if(u) garageUse(u.dataset.garageUse); else if(d) garageDelete(d.dataset.garageDel); else if(o) garageOff();
  });
  $('#garageBanner').addEventListener('click', async e=>{ if(e.target.closest('[data-garage-all]')){ $('#filterMake').value=''; await loadModels('','filterModel','Toate modelele'); state.extra.g='0'; onFilterChange(); } });
  updateGarageUI();
  $('#cartBtn').addEventListener('click', ()=>doAction('cart'));
  $('#homeSearchForm').addEventListener('submit', e=>{ e.preventDefault(); submitSearchQuery($('#homeSearchInput').value); });
  $('#resultsSearchForm').addEventListener('submit', e=>{ e.preventDefault(); if(state.mode!=='search') return; onFilterChange(); });
  $('#homeMake').addEventListener('change', e=>loadModels(e.target.value,'homeModel'));
  $('#homeVehicleBtn').addEventListener('click', ()=>{ const make=$('#homeMake').value; if(!make){ toast('Alege marca mașinii.'); return; } openSearch({make, model:$('#homeModel').value}); });
  ['req','match','garage'].forEach(bindCarAuto);
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
  $('#matchForm').addEventListener('submit', e=>{ e.preventDefault(); const make=$('#matchMake').value, model=$('#matchModel').value, q=[$('#matchEngine').value.trim(),$('#matchPart').value.trim()].filter(Boolean).join(' '); if(!make&&!q){ toast('Alege marca sau scrie piesa căutată.'); return; } openSearch({q,make,model}); });
  $('#sellType').addEventListener('change', syncSellType);
  Object.keys(FILTER_FIELDS).forEach(id=>{ if(id!=='filterMake') $('#'+id).addEventListener('change', onFilterChange); });
  $('#filterMake').addEventListener('change', async e=>{ await loadModels(e.target.value,'filterModel','Toate modelele'); onFilterChange(); });
  $('#withDelivery').addEventListener('change', onFilterChange);
  $('#clearFilters').addEventListener('click', ()=>{ $$('#filters select').forEach(s=>s.value=''); ['#minPrice','#maxPrice','#yearFrom','#yearTo'].forEach(id=>{ const el=$(id); if(el) el.value=''; }); $('#withDelivery').checked=false; $('#sortListings').value='new'; loadModels('','filterModel','Toate modelele').then(onFilterChange); });
  $('#filterToggle').addEventListener('click', ()=>$('#filters').classList.toggle('open'));
  $('#pagination').addEventListener('click', e=>{ const b=e.target.closest('[data-page]'); if(b) safe(()=>goToResultsPage(b.dataset.page))(); });
  $('#saveSearchBtn').addEventListener('click', saveCurrentSearch);
  $('#favoritesBtn').addEventListener('click', ()=>navigate('rezultate?mode=fav'));
  $('#accountBtn').addEventListener('click', ()=>doAction('account'));
  $('#menuBtn').addEventListener('click', ()=>{ if($('#menuDrawer').classList.contains('open')) closeMenu(); else openMenu(); });
  // Dark mode — buton din header, preferință salvată în localStorage
  (function initTheme(){
    const btn=$('#themeBtn'); if(!btn) return;
    const root=document.documentElement;
    const apply=on=>{ root.classList.toggle('dark',on); btn.textContent=on?'☀️':'🌙'; btn.setAttribute('aria-pressed',on?'true':'false'); };
    let on=false; try{on=localStorage.getItem('theme')==='dark';}catch(e){}
    apply(on);
    btn.addEventListener('click',()=>{ on=!on; apply(on); try{localStorage.setItem('theme',on?'dark':'light');}catch(e){} });
  })();
  $('#closeMenu').addEventListener('click', ()=>closeMenu());
  $('#menuScrim').addEventListener('click', ()=>closeMenu());
  $('#menuDrawer').addEventListener('click', e=>{ if(e.target.closest('[data-action],[data-go],[data-account]')) closeMenu(true); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && $('#menuDrawer').classList.contains('open') && $('#imageLightbox')?.classList.contains('hidden') && !document.querySelector('.modal:not(.hidden)')){ e.preventDefault(); closeMenu(); } });
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
  $('#orderForm').addEventListener('submit', e=>{ e.preventDefault(); safe(submitOrder)(); });
  $('#offerForm').addEventListener('submit', e=>{ e.preventDefault(); safe(async()=>{ const editId=$('#offerEditId').value; if(state.offerImagesBusy){ toast('Așteaptă să se proceseze pozele.'); return; } const payload={price:$('#offerPrice').value,message:$('#offerMessage').value}; if(!editId||state.offerImagesLoaded) payload.images=state.offerImages; const body=JSON.stringify(payload); if(editId) await api('/api/offers/'+editId,{method:'PATCH',body}); else await api('/api/requests/'+$('#offerRequestId').value+'/offers',{method:'POST',body}); $('#offerModal').classList.add('hidden'); state.offerImages=[]; state.offerImagesLoaded=false; renderImgBox('offerImages'); toast(editId?'Oferta a fost modificată.':'Oferta a fost trimisă.'); refreshAfterOfferChange(); })(); });
  document.addEventListener('change', e=>{
    const x=e.target; if(!x) return;
    if(x.id==='statsViewSel'){ statsView=x.value==='anunturi'?'anunturi':'cont'; drawStatsPage(); return; }
    if(x.matches&&x.matches('[data-acc-row]')){ if(x.checked) accStats.sel.add(x.dataset.accRow); else accStats.sel.delete(x.dataset.accRow); const b=$('#accGraphBtn'); if(b) b.disabled=!accStats.sel.size; if(!accStats.sel.size) drawAccChart(); }
  });
  document.addEventListener('change', e=>{ if(e.target&&e.target.id==='statsSelect'){ statsPick=e.target.value; drawStats(); } });
  $('#sellForm').addEventListener('submit', submitSell);
  $('#sellImages').addEventListener('change', handleSellImages);
  ['reqImages','offerImages'].forEach(id=>{ const el=$('#'+id); if(el) el.addEventListener('change', handleImgBox); });
  document.addEventListener('click', e=>{
    const b=e.target.closest('[data-remove-img]');
    if(b){ const [k,i]=b.dataset.removeImg.split(':'); state[k].splice(Number(i),1); renderImgBox(k); return; }
    const m=e.target.closest('[data-move-img]');
    if(m){ const [k,i]=m.dataset.moveImg.split(':'), a=state[k], from=Number(i), to=from+Number(m.dataset.dir); if(to>=0&&to<a.length){ [a[from],a[to]]=[a[to],a[from]]; renderImgBox(k); } }
  });
  $('#profileSettingsForm').addEventListener('submit', saveProfile);
  $('#emailChangeForm').addEventListener('submit', requestEmailChange);
  $('#phoneAddForm').addEventListener('submit', addPhone);
  $('#detailsForm').addEventListener('submit', saveDetails);
  $$('input[name="billType"]').forEach(r=>r.addEventListener('change', syncBillType));
  setupAvatarHold();
  $('#avatarFile').addEventListener('change', onAvatarPick);
  $('#storeForm').addEventListener('submit', saveStore);
  $('#notifForm').addEventListener('submit', saveNotifPrefs);
  $('#vacationForm').addEventListener('submit', saveVacation);
  $('#blockForm').addEventListener('submit', addBlock);
  $('#exportBtn').addEventListener('click', exportMyData);
  $('#dangerForm').addEventListener('submit', deleteMyAccount);
  $('#storeLogoFile').addEventListener('change', onStoreLogoPick);
  $('#storeLogoRemove').addEventListener('click', ()=>{ state.storeLogo=undefined; state.storeLogoRemove=true; $('#storeLogoFile').value=''; $('#storeLogoPreview').classList.add('hidden'); $('#storeLogoRemove').classList.add('hidden'); });
  $('#showPhoneToggle').addEventListener('change', togglePrivacy);
  $('#settingsForgotPassword').addEventListener('click', ()=>{ if(currentUser&&currentUser.email){ $('#forgotEmail').value=currentUser.email; setMsg($('#forgotMessage'),''); $('#forgotModal').classList.remove('hidden'); } });
  window.addEventListener('hashchange', route);
}


/* ---------- Anunțurile mele (format PieseAuto.ro: tab-uri, căutare, 30 pe pagină) ---------- */
const MINE_PER_PAGE = 30, MINE_EXPIRE_WARN_DAYS = 7;
const mine = { quota:null, items:[], tab:'active', q:'', cat:'', type:'', sort:'new', page:1, sel:new Set() };

/* ---------- Promovare anunț (cu credite) ---------- */
async function promoDialog(id){
  const m=$('#promoModal'), b=$('#promoBody'); if(!m||!b) return;
  b.innerHTML='<p class="muted">Se încarcă…</p>'; m.classList.remove('hidden');
  try{
    const r=await api('/api/credits');
    const none=r.plans.every(p=>r.balance<p.cost);
    const cur=(mine.items||[]).find(i=>i.id===id)||(state.loaded||[]).find(i=>i.id===id)||{};
    const ext=!!cur.promoted;
    b.innerHTML=`<h2>${ext?'Prelungește promovarea':'Promovează anunțul'}</h2>${ext&&promoUntilTxt(cur)?`<p class="form-note">Anunțul este promovat până pe <b>${esc(promoUntilTxt(cur))}</b>. Zilele noi se adaugă după această dată.</p>`:''}<p class="form-note">Anunțul promovat apare primul în rezultate. Ai <b>${r.balance}</b> credite.</p><div class="promo-plans">${r.plans.map(p=>`<button type="button" class="btn ${r.balance>=p.cost?'primary':'ghost'} promo-plan" data-promo-go="${id}" data-days="${p.days}" ${r.balance>=p.cost?'':'disabled'}><b>${p.days} zile</b><span>${p.cost} credite</span></button>`).join('')}</div>${none?'<p class="form-note">Nu ai destule credite. <button type="button" class="text-btn" data-promo-credits>Vezi cum primești credite</button></p>':''}`;
  }catch(e){ b.innerHTML='<p>'+esc(e.message||'Nu am putut încărca creditele.')+'</p>'; }
}
async function promoGo(el){
  const id=Number(el.dataset.promoGo), days=Number(el.dataset.days);
  el.disabled=true;
  try{
    const r=await api('/api/listings/'+id+'/promote',{method:'POST',body:JSON.stringify({days})});
    $('#promoModal').classList.add('hidden');
    const ac=$('#accCredits'); if(ac) ac.textContent=r.balance;
    toast('Anunțul este promovat '+days+' zile.');
    const lst=await api('/api/listings/mine'); mine.items=lst.listings||[]; state.loaded=mine.items; if($('#mineList')) renderMine();
  }catch(e){ el.disabled=false; toast(e.status===402?'Nu ai destule credite.':(e.message||'Nu am putut promova anunțul.')); }
}
const MINE_TABS = [['active','Active'],['sold','Stoc epuizat'],['expire','Expiră'],['promo','Promovate'],['deleted','Șterse']];
const mineNorm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function mineSet(r){ mine.items = (r&&r.listings)||[]; mine.quota = (r&&r.quota)||null; state.loaded = mine.items; }
const minePaid = x => !!x.paid_until && new Date(x.paid_until).getTime() > Date.now();
// Estimează costul în credite al unei prelungiri / reactualizări (același calcul ca pe server).
function mineCost(ids, kind){
  const q = mine.quota; if(!q || !q.cost || q.limit==null) return 0;
  let free = Math.max(0, q.limit - q.unpaid_active), total = 0;
  for(const id of ids){
    const x = mine.items.find(i=>i.id===id); if(!x) continue;
    if(kind==='renew'){ if(minePaid(x)) total += q.cost; }
    else if(kind==='restore'){ if(minePaid(x)) continue; if(free>0) free--; else total += q.cost; }
  }
  return total;
}
function mineAskCost(ids, kind){
  const c = mineCost(ids, kind); if(!c) return true;
  return confirm(`Această acțiune costă ${c} credite (anunțuri peste cele ${mine.quota.limit} gratuite, câte ${mine.quota.cost} pentru 30 de zile). Ai ${mine.quota.balance} credite. Continui?`);
}
const mineExpMs = x => x.expires_at ? new Date(x.expires_at).getTime() : new Date(x.created_at).getTime()+30*86400000;
const mineExpiring = x => x.status==='approved' && mineExpMs(x) <= Date.now()+MINE_EXPIRE_WARN_DAYS*86400000;
const mineExpDays = x => Math.max(0, Math.ceil((mineExpMs(x)-Date.now())/86400000));
function mineTabItems(tab){
  if(tab==='active') return mine.items.filter(x=>x.status!=='sold' && x.status!=='deleted');
  if(tab==='sold') return mine.items.filter(x=>x.status==='sold');
  if(tab==='expire') return mine.items.filter(mineExpiring);
  if(tab==='deleted') return mine.items.filter(x=>x.status==='deleted');
  if(tab==='promo') return mine.items.filter(x=>x.promoted && x.status==='approved');
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
async function enterMine(tab){
  if(tab && MINE_TABS.some(t=>t[0]===tab)){ mine.tab = tab; } 
  $('#mineList').innerHTML = '<p class="muted">Se încarcă…</p>';
  const sel = $('#mineCat'); if(sel && sel.options.length<2) sel.insertAdjacentHTML('beforeend', CATEGORIES.map(c=>`<option>${esc(c[0])}</option>`).join(''));
  const r = await api('/api/listings/mine');
  mineSet(r); mine.sel.clear(); mine.page = 1;
  renderMine();
}
const MI={
  promo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10v4h3l5 4V6L7 10H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1-4L16.5 4.5a1.8 1.8 0 0 1 2.5 0l.5.5a1.8 1.8 0 0 1 0 2.5L8 19l-4 1z"/><path d="M14.5 6.5l3 3"/></svg>',
  ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5v5h5"/><path d="M4.5 10A8 8 0 1 1 5 15"/></svg>',
  del:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12M10 11v6M14 11v6"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 12S5.5 5.5 12 5.5 22.5 12 22.5 12 18.5 18.5 12 18.5 1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>'
};
function mineRow(x){
  const img = Array.isArray(x.images) && x.images[0];
  const st = STATUS_LABEL[x.status] || [x.status,''];
  const del = x.status==='deleted', locked = x.status==='blocked';
  const showBadge = x.status!=='approved';
  const expSoon = mineExpiring(x), dd = expSoon ? mineExpDays(x) : 0;
  const btns = del
    ? `<button type="button" class="mine-act" data-m-restore="${x.id}" title="Reactualizează" aria-label="Reactualizează">${MI.up}</button><button type="button" class="mine-act" data-m-del="${x.id}" title="Șterge definitiv" aria-label="Șterge definitiv">${MI.del}</button>`
    : `${expSoon?`<button type="button" class="mine-act mine-act-txt" data-m-renew="${x.id}" title="Activează (încă 30 de zile)" aria-label="Activează">${MI.ok}<span>Activează</span></button>`:''}${PROMO_ON?`<button type="button" class="mine-act" data-m-promo="${x.id}" title="${x.promoted?'Prelungește promovarea':'Promovează'}" aria-label="${x.promoted?'Prelungește promovarea':'Promovează'}">${MI.promo}</button>`:''}<button type="button" class="mine-act" data-m-bump="${x.id}" title="Reactualizează" aria-label="Reactualizează">${MI.up}</button>${locked?'':`<button type="button" class="mine-act" data-m-edit="${x.id}" title="Editează" aria-label="Editează">${MI.edit}</button>`}${x.status==='approved'||x.status==='sold'?`<button type="button" class="mine-act" data-m-sold="${x.id}" data-to="${x.status==='sold'?'approved':'sold'}" title="${x.status==='sold'?'Repune în stoc':'Stoc epuizat'}" aria-label="${x.status==='sold'?'Repune în stoc':'Stoc epuizat'}">${x.status==='sold'?MI.back:MI.ok}</button>`:''}<button type="button" class="mine-act" data-m-del="${x.id}" title="Șterge" aria-label="Șterge">${MI.del}</button>`;
  return `<article class="mine-row${x.promoted?' is-promoted':''}">
    <label class="mine-check"><input type="checkbox" data-m-check="${x.id}" ${mine.sel.has(x.id)?'checked':''} aria-label="Selectează anunțul"></label>
    <button type="button" class="mine-thumb" data-m-open="${x.id}" aria-label="Deschide anunțul">${img?`<img src="${esc(img)}" alt="" loading="lazy" decoding="async">`:'<span>📷</span>'}</button>
    <div class="mine-body">
      <button type="button" class="mine-name" data-m-open="${x.id}">${esc(x.title)}</button>
      ${minePaid(x)?`<span class="badge paid">💳 Plătit până pe ${esc(new Date(x.paid_until).toLocaleDateString('ro-RO',{day:'numeric',month:'short'}))}</span>`:''}${expSoon?`<span class="badge expire">⏳ Expiră ${dd<=0?'astăzi':(dd===1?'mâine':'în '+dd+' zile')}</span>`:''}${showBadge?`<span class="badge ${st[1]}">${esc(st[0])}</span>`:(x.promoted?`<span class="badge promo">⭐ Promovat${promoUntilTxt(x)?' până pe '+esc(promoUntilTxt(x)):''}</span>`:'')}
      <div class="mine-acts">${btns}</div>
    </div>
    <div class="mine-meta"><span class="mine-views">${MI.eye} ${Number(x.views)||0}</span><span>${Number(x.quantity)||1} buc.</span><b>${priceHtml(x)}</b></div>
  </article>`;
}
function renderMine(){
  const all = mineVisible(), total = all.length, pages = Math.max(1, Math.ceil(total/MINE_PER_PAGE));
  mine.page = Math.min(Math.max(1, mine.page), pages);
  const from = (mine.page-1)*MINE_PER_PAGE, slice = all.slice(from, from+MINE_PER_PAGE);
  $('#mineTabs').innerHTML = MINE_TABS.map(([k,l])=>`<button type="button" role="tab" class="mine-tab ${mine.tab===k?'on':''}" data-m-tab="${k}">${l}${` <small>${mineTabItems(k).length}</small>`}</button>`).join('');
  const titles = {active:'Anunțuri active',sold:'Anunțuri cu stoc epuizat',expire:'Anunțuri care expiră',promo:'Anunțuri promovate',deleted:'Anunțuri șterse'};
  $('#mineCount').textContent = total ? `${titles[mine.tab]} (${from+1} - ${from+slice.length} din ${total})` : titles[mine.tab];
  const empty = {active:'Nu ai anunțuri active.',sold:'Nu ai anunțuri cu stoc epuizat.',expire:`Niciun anunț nu expiră în următoarele ${MINE_EXPIRE_WARN_DAYS} zile.`,promo:'Nu ai anunțuri promovate. Promovarea va fi disponibilă în curând.',deleted:'Nu ai anunțuri șterse.'};
  $('#mineList').innerHTML = slice.length ? slice.map(mineRow).join('') : `<div class="empty">${mine.q||mine.cat||mine.type?'Niciun anunț nu corespunde filtrelor.':empty[mine.tab]}</div>`;
  $('#minePager').innerHTML = pages>1 ? `<button type="button" class="btn ghost small" data-m-page="${mine.page-1}" ${mine.page<=1?'disabled':''}>‹ Înapoi</button><span>Pagina ${mine.page} din ${pages}</span><button type="button" class="btn ghost small" data-m-page="${mine.page+1}" ${mine.page>=pages?'disabled':''}>Înainte ›</button>` : '';
  const ha = $('#mineHeadActs');
  if(ha){
    const nAll = all.length, b = (k,l,cls)=> `<button type="button" class="btn ${cls||'ghost'} small" data-m-all="${k}">${l}</button>`;
    ha.innerHTML = !nAll ? '' : (mine.tab==='expire' ? b('renew',`Activează toate (${nAll})`,'primary')+b('del','Șterge toate','danger')
      : '');
  }
  const ids = slice.map(x=>x.id);
  $('#mineAll').checked = ids.length>0 && ids.every(i=>mine.sel.has(i));
  const n = mine.sel.size, bulk = $('#mineBulk');
  bulk.classList.toggle('hidden', !n);
  bulk.innerHTML = n ? `<span>${n} selectate</span>` + (mine.tab==='deleted'
    ? `<button type="button" class="btn ghost small" data-m-bulk="restore">Reactualizează</button><button type="button" class="btn danger small" data-m-bulk="del">Șterge definitiv</button>`
    : `${mine.tab==='expire'?'<button type="button" class="btn ghost small" data-m-bulk="renew">Activează</button>':''}${mine.tab==='sold'?'<button type="button" class="btn ghost small" data-m-bulk="instock">Repune în stoc</button>':'<button type="button" class="btn ghost small" data-m-bulk="sold">Stoc epuizat</button>'}<button type="button" class="btn danger small" data-m-bulk="del">Șterge</button>`) : '';
}
async function mineDo(ids, kind){
  if(kind==='del'||kind==='restore'||kind==='renew'){
    const action = kind==='del' ? (mine.tab==='deleted' ? 'purge' : 'delete') : kind;
    let msg = 'Gata.';
    try{
      let done = 0, skipped = 0, lim = false, spent = 0, poor = false;
      for(let i=0;i<ids.length;i+=500){
        const r = await api('/api/listings/bulk',{method:'POST',body:JSON.stringify({action,ids:ids.slice(i,i+500)})});
        done += r.done||0; skipped += r.skipped||0; lim = lim || !!r.limit_hit; spent += r.spent||0; poor = poor || !!r.insufficient;
      }
      msg = action==='renew' ? `${done} anunțuri active încă 30 de zile.` : action==='restore' ? `${done} anunțuri reactualizate (încă 30 de zile).` : action==='purge' ? `${done} anunțuri șterse definitiv.` : `${done} anunțuri mutate în „Șterse”.`;
      if(spent) msg += ` Au fost folosite ${spent} credite.`;
      if(poor) msg += ' Nu ai avut destule credite pentru toate.';
      if(lim) msg += ' Ai atins limita de anunțuri active.';
    }catch(e){ msg = e.message || 'Nu s-a putut face modificarea.'; }
    mine.sel.clear();
    const r = await api('/api/listings/mine'); mineSet(r); renderMine();
    toast(msg); refreshCounts && refreshCounts();
    return;
  }
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
  const r = await api('/api/listings/mine'); mineSet(r); renderMine();
  toast(ok===ids.length ? 'Gata.' : (ok? `${ok} din ${ids.length} actualizate. ${last}` : last||'Nu s-a putut face modificarea.'));
}
document.addEventListener('click', e=>{
  const pg = e.target.closest && e.target.closest('#page-mine'); if(!pg) return;
  let el;
  if((el=e.target.closest('[data-m-tab]'))){ mine.tab=el.dataset.mTab; mine.page=1; mine.sel.clear(); renderMine(); return; }
  if((el=e.target.closest('[data-m-page]'))){ mine.page=Number(el.dataset.mPage)||1; renderMine(); window.scrollTo({top:0,behavior:'smooth'}); return; }
  if((el=e.target.closest('[data-m-open]'))){ openDetail(Number(el.dataset.mOpen), true); return; }
  if((el=e.target.closest('[data-m-edit]'))){ navigate('vinde?edit='+Number(el.dataset.mEdit)); return; }
  if((el=e.target.closest('[data-m-promo]'))){ safe(promoDialog)(Number(el.dataset.mPromo)); return; }
  if((el=e.target.closest('[data-m-bump]'))){ safe(()=>mineDo([Number(el.dataset.mBump)],'bump'))(); return; }
  if((el=e.target.closest('[data-m-sold]'))){ safe(()=>mineDo([Number(el.dataset.mSold)], el.dataset.to==='sold'?'sold':'instock'))(); return; }
  if((el=e.target.closest('[data-m-renew]'))){ const id=Number(el.dataset.mRenew); if(mineAskCost([id],'renew')) safe(()=>mineDo([id],'renew'))(); return; }
  if((el=e.target.closest('[data-m-all]'))){
    const k=el.dataset.mAll, ids=mineVisible().map(x=>x.id);
    const q={renew:`Activezi toate cele ${ids.length} anunțuri pentru încă 30 de zile?`,del:`Muți toate cele ${ids.length} anunțuri în „Șterse”?`,restore:`Reactualizezi toate cele ${ids.length} anunțuri pentru încă 30 de zile?`,purge:`Ștergi DEFINITIV toate cele ${ids.length} anunțuri? Nu se mai pot recupera.`}[k];
    if(ids.length && confirm(q) && mineAskCost(ids, k)) safe(()=>mineDo(ids, k==='purge'?'del':k))();
    return;
  }
  if((el=e.target.closest('[data-m-restore]'))){ const id=Number(el.dataset.mRestore); if(mineAskCost([id],'restore')) safe(()=>mineDo([id],'restore'))(); return; }
  if((el=e.target.closest('[data-m-del]'))){ const id=Number(el.dataset.mDel), hard=mine.tab==='deleted'; if(confirm(hard?'Ștergi definitiv acest anunț? Nu se mai poate recupera.':'Muți anunțul în „Șterse”?')) safe(()=>mineDo([id],'del'))(); return; }
  if((el=e.target.closest('[data-m-bulk]'))){ const k=el.dataset.mBulk, ids=[...mine.sel]; if(k==='del' && !confirm(mine.tab==='deleted'?'Ștergi definitiv anunțurile selectate?':'Muți anunțurile selectate în „Șterse”?')) return; if((k==='renew'||k==='restore') && !mineAskCost(ids,k)) return; safe(()=>mineDo(ids,k))(); return; }
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


/* ---------- Mesagerie (Primite / Trimise / Arhivate / Trimite un mesaj) ---------- */
const MSG_PER_PAGE = 30;
const MSG_TABS = [['inbox','Primite'],['sent','Trimise'],['archived','Arhivate'],['compose','Trimite un mesaj']];
const msgs = { box:'inbox', items:[], unread:0, q:'', unreadOnly:false, page:1, sel:new Set() };
const msgFmtDate = iso => { const d=new Date(iso); return isNaN(d)?'':d.toLocaleDateString('ro-RO',{day:'2-digit',month:'short',year:'numeric'}); };
const MSG_USER_ICO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6z"/></svg>';
async function enterMessages(box){
  msgs.box = MSG_TABS.some(t=>t[0]===box) ? box : 'inbox';
  msgs.q=''; msgs.unreadOnly=false; msgs.page=1; msgs.sel.clear();
  $('#msgSearch').value=''; $('#msgUnreadOnly').checked=false; setMsg($('#msgComposeMsg'),'');
  await loadMessages();
}
async function loadMessages(){
  if(msgs.box==='compose'){ renderMessages(); return; }
  renderMessagesChrome();
  $('#msgList').innerHTML = '<p class="muted">Se încarcă…</p>';
  try{
    const r = await api('/api/messages/box?box='+msgs.box);
    msgs.items = r.messages || []; msgs.unread = r.unread || 0;
  }catch(e){ msgs.items=[]; $('#msgList').innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
  renderMessages();
}
function msgVisible(){
  const q = mineNorm(msgs.q).trim();
  return msgs.items.filter(m=>{
    if(msgs.unreadOnly && !(msgs.box==='inbox' && !m.is_read)) return false;
    if(!q) return true;
    const hay = mineNorm([m.other_name,m.body,m.ref_title].join(' '));
    return q.split(/\s+/).every(t=>hay.includes(t));
  });
}
function renderMessagesChrome(){
  $('#msgTabs').innerHTML = MSG_TABS.map(([k,l])=>`<button type="button" role="tab" class="mine-tab ${msgs.box===k?'on':''}" data-ms-tab="${k}">${l}${k==='inbox'&&msgs.unread?` <small>${msgs.unread}</small>`:''}</button>`).join('');
  const compose = msgs.box==='compose';
  $('#msgBoxView').classList.toggle('hidden', compose);
  $('#msgComposeWrap').classList.toggle('hidden', !compose);
}
function msgRow(m){
  const go = `account-tool?view=messages&with=${m.other}${m.listing_id?'&ref='+m.listing_id:''}`;
  const unread = msgs.box==='inbox' && !m.is_read;
  const name = esc(m.other_name || 'Utilizator');
  return `<article class="mrow${unread?' unread':''}">
    <label class="mine-check"><input type="checkbox" data-ms-check="${m.id}" ${msgs.sel.has(m.id)?'checked':''} aria-label="Selectează mesajul"></label>
    <div class="mrow-main">
      <button type="button" class="mrow-head" data-go="${esc(go)}"><span class="mrow-user">${avatarSpan(m.other,m.other_name||'U','mrow-av')}<span class="mrow-name">${m.mine&&msgs.box!=='inbox'?'Către ':''}${name}</span>${unread?'<em class="mrow-dot" aria-label="Necitit"></em>':''}</span><span class="mrow-date">${msgFmtDate(m.created_at)}</span></button>
      <button type="button" class="mrow-body" data-go="${esc(go)}">${m.mine?'<span class="mrow-ok">✓</span> ':''}${esc(m.body)}</button>
      ${m.ref_title&&m.listing_id?`<div class="mrow-ref">Ref: <button type="button" class="ref-link" data-open="${m.listing_id}">${esc(m.ref_title)}</button></div>`:''}
    </div></article>`;
}
function renderMessages(){
  renderMessagesChrome();
  if(msgs.box==='compose') return;
  const all = msgVisible(), total = all.length, pages = Math.max(1, Math.ceil(total/MSG_PER_PAGE));
  msgs.page = Math.min(Math.max(1, msgs.page), pages);
  const from = (msgs.page-1)*MSG_PER_PAGE, slice = all.slice(from, from+MSG_PER_PAGE);
  $('#msgCount').textContent = total ? `Mesaje (${from+1} - ${from+slice.length} din ${total})` : 'Mesaje (0)';
  const empty = {inbox:'Nu ai mesaje primite.',sent:'Nu ai mesaje trimise.',archived:'Nu ai mesaje arhivate.'};
  $('#msgList').innerHTML = slice.length ? slice.map(msgRow).join('') : `<div class="empty">${(msgs.q||msgs.unreadOnly)?'Niciun mesaj nu corespunde filtrelor.':empty[msgs.box]}</div>`;
  $('#msgPager').innerHTML = pages>1 ? `<button type="button" class="btn ghost small" data-ms-page="${msgs.page-1}" ${msgs.page<=1?'disabled':''}>‹ Înapoi</button><span>Pagina ${msgs.page} din ${pages}</span><button type="button" class="btn ghost small" data-ms-page="${msgs.page+1}" ${msgs.page>=pages?'disabled':''}>Înainte ›</button>` : '';
  const ids = slice.map(m=>m.id);
  $('#msgAll').checked = ids.length>0 && ids.every(i=>msgs.sel.has(i));
  const n = msgs.sel.size, bulk = $('#msgBulk');
  bulk.classList.toggle('hidden', !n);
  bulk.innerHTML = n ? `<span>${n} selectate</span>` + (msgs.box==='inbox'?'<button type="button" class="btn ghost small" data-ms-bulk="read">Marchează citite</button>':'') + (msgs.box==='archived'?'<button type="button" class="btn ghost small" data-ms-bulk="unarchive">Dezarhivează</button>':'<button type="button" class="btn ghost small" data-ms-bulk="archive">Arhivează</button>') : '';
}
async function msgBulk(kind){
  const ids = [...msgs.sel]; if(!ids.length) return;
  if(kind==='read') await api('/api/messages/read',{method:'POST',body:JSON.stringify({ids})});
  else await api('/api/messages/archive',{method:'POST',body:JSON.stringify({ids,archive:kind==='archive'})});
  msgs.sel.clear(); await loadMessages();
  toast(kind==='archive'?'Mesajele au fost arhivate.':kind==='unarchive'?'Mesajele au fost dezarhivate.':'Mesajele au fost marcate ca citite.');
}
document.addEventListener('click', e=>{
  if(!(e.target.closest && e.target.closest('#page-messages'))) return;
  let el;
  if((el=e.target.closest('[data-ms-tab]'))){ msgs.box=el.dataset.msTab; msgs.page=1; msgs.sel.clear(); safe(loadMessages)(); return; }
  if((el=e.target.closest('[data-ms-page]'))){ msgs.page=Number(el.dataset.msPage)||1; renderMessages(); window.scrollTo({top:0,behavior:'smooth'}); return; }
  if((el=e.target.closest('[data-ms-bulk]'))){ safe(msgBulk)(el.dataset.msBulk); return; }
  if(e.target.closest('#msgFilterBtn')){ $('#msgFilterPanel').classList.toggle('hidden'); return; }
});
document.addEventListener('change', e=>{
  if(!(e.target.closest && e.target.closest('#page-messages'))) return;
  const t = e.target;
  if(t.matches('[data-ms-check]')){ const id=Number(t.dataset.msCheck); t.checked? msgs.sel.add(id) : msgs.sel.delete(id); renderMessages(); }
  else if(t.id==='msgAll'){ msgVisible().slice((msgs.page-1)*MSG_PER_PAGE, msgs.page*MSG_PER_PAGE).forEach(m=> t.checked? msgs.sel.add(m.id) : msgs.sel.delete(m.id)); renderMessages(); }
  else if(t.id==='msgUnreadOnly'){ msgs.unreadOnly=t.checked; msgs.page=1; renderMessages(); }
});
document.addEventListener('input', e=>{
  if(e.target.id!=='msgSearch') return;
  msgs.q=e.target.value; msgs.page=1; renderMessages();
});
document.addEventListener('submit', e=>{
  if(e.target.id!=='msgComposeForm') return; e.preventDefault(); if(!$('#msgToNick').value.trim() || !$('#msgComposeBody').value.trim()) return;
  const msg=$('#msgComposeMsg'); setMsg(msg,'');
  (async()=>{
    try{
      await api('/api/messages',{method:'POST',body:JSON.stringify({to_nick:$('#msgToNick').value.trim(),body:$('#msgComposeBody').value})});
      $('#msgComposeForm').reset(); toast('Mesajul a fost trimis.');
      msgs.box='sent'; msgs.page=1; msgs.sel.clear(); await loadMessages();
    }catch(err){ setMsg(msg,err.message,'error'); }
  })();
});

/* ---------- Calificative pentru vânzători ---------- */
function starsHtml(avg){ const p=Math.max(0,Math.min(100,(Number(avg)||0)/5*100)); return `<span class="stars" style="--p:${p}%" aria-hidden="true">★★★★★</span>`; }
function revLink(inner,uid,role){ return uid?`<button type="button" class="rate-link" data-reviews="${Number(uid)}" data-role="${role==='buyer'?'buyer':'seller'}" title="Vezi recenziile" aria-label="Vezi recenziile">${inner}</button>`:inner; }
function ratingLine(r,uid,role){
  if(!r||!r.count) return '<span class="muted">Fără calificative încă</span>';
  return revLink(`${starsHtml(r.avg)} <b>${esc(String(r.avg).replace('.',','))}</b> <span class="muted">(${r.count} ${r.count===1?'calificativ':'calificative'})</span>`,uid,role);
}
function rateInline(avg,n,uid,role){ n=Number(n)||0; return n?revLink(`<span class="rate-inline">${starsHtml(avg)} <b>${esc(String(avg).replace('.',','))}</b> <small>(${n})</small></span>`,uid,role):'<span class="rate-inline muted"><small>fără calificative</small></span>'; }
async function loadSellerRatings(id){
  const box=$('#sellerRatings'); if(!box) return;
  try{
    const r=await api('/api/sellers/'+id+'/ratings');
    const part=(t,p)=>(p&&p.ratings&&p.ratings.length)?`<b>${t}</b>`+p.ratings.map(x=>`<div class="rate-item">${starsHtml(x.stars)} <b>${esc(x.who||'Utilizator')}</b><small>${fmtDate(x.created_at)}</small>${x.comment?`<p>${esc(x.comment)}</p>`:''}</div>`).join(''):'';
    const html=part('Ce spun cumpărătorii despre el ca vânzător',r.seller)+part('Ce spun vânzătorii despre el ca cumpărător',r.buyer);
    if(!html) return; box.innerHTML=html; box.classList.remove('hidden');
  }catch{}
}
function openOrderReason(id,to,hasListing,title){
  const cancel=to==='cancelled';
  $('#orderReasonId').value=id; $('#orderReasonTo').value=to; $('#orderReasonText').value=''; $('#orderNoStock').checked=false;
  $('#orderReasonEyebrow').textContent=cancel?'ANULARE COMANDĂ':'SUSPENDARE COMANDĂ';
  $('#orderReasonTitle').textContent=(cancel?'Anulezi: ':'Suspenzi: ')+title;
  $('#orderReasonNote').textContent=cancel?'Cumpărătorul primește mesajul tău și vede comanda ca anulată.':'Comanda rămâne în așteptare, iar cumpărătorul primește mesajul tău. O poți relua oricând.';
  $('#orderReasonText').placeholder=cancel?'Ex: Piesa s-a vândut între timp / nu mai este în stoc.':'Ex: Verific stocul și revin cu un răspuns până mâine.';
  $('#orderRestockRow').classList.toggle('hidden',!(cancel&&hasListing));
  setMsg($('#orderReasonMsg'),''); $('#orderReasonModal').classList.remove('hidden');
  setTimeout(()=>{ try{ $('#orderReasonText').focus(); }catch{} },50);
}
document.addEventListener('submit', e=>{
  if(e.target.id!=='orderReasonForm') return; e.preventDefault();
  const reason=$('#orderReasonText').value.trim(), msg=$('#orderReasonMsg');
  if(reason.length<3){ setMsg(msg,'Scrie un mesaj pentru cumpărător.','error'); return; }
  safe(async()=>{
    await api('/api/orders/'+$('#orderReasonId').value+'/status',{method:'PATCH',body:JSON.stringify({status:$('#orderReasonTo').value,reason,restock:!$('#orderNoStock').checked})});
    closeModal($('#orderReasonModal')); toast('Comanda a fost actualizată, iar cumpărătorul a primit mesajul.'); renderAccountTool(currentToolView||'orders');
  })().catch(()=>{});
});
function setRateStars(n){
  n=Number(n)||0; $('#rateStars').dataset.value=String(n);
  $$('#rateStars [data-rate-star]').forEach(b=>{ const on=Number(b.dataset.rateStar)<=n; b.classList.toggle('on',on); b.setAttribute('aria-checked',Number(b.dataset.rateStar)===n?'true':'false'); });
}
document.addEventListener('click', e=>{
  const t=e.target; let el;
  if((el=t.closest && t.closest('[data-rate-order]'))){
    $('#rateOrderId').value=el.dataset.rateOrder; $('#rateTitle').textContent='Calificativ pentru '+(el.dataset.sellerName||'utilizator');
    $('#rateComment').value=el.dataset.comment||''; setRateStars(el.dataset.stars); setMsg($('#rateMsg'),'');
    $('#rateModal').classList.remove('hidden'); return;
  }
  if((el=t.closest && t.closest('[data-rate-star]'))){ setRateStars(el.dataset.rateStar); return; }
});
document.addEventListener('submit', e=>{
  if(e.target.id!=='rateForm') return; e.preventDefault();
  const stars=Number($('#rateStars').dataset.value)||0, msg=$('#rateMsg');
  if(!stars){ setMsg(msg,'Alege numărul de stele.','error'); return; }
  safe(async()=>{
    await api('/api/orders/'+$('#rateOrderId').value+'/rating',{method:'PUT',body:JSON.stringify({stars,comment:$('#rateComment').value})});
    closeModal($('#rateModal')); toast('Mulțumim! Calificativul a fost salvat.'); renderAccountTool(currentToolView||'orders');
  })().catch(()=>{});
});

/* ---------- Import CSV (parcuri de dezmembrări) ---------- */
const CSV_ALIASES = {
  type:['tip','type'], title:['titlu','denumire','title','nume'], make:['marca','make','brand'], model:['model'], year:['an','anul','year','anfabricatie'],
  category:['categorie','category'], subcategory:['subcategorie'], condition:['stare','conditie','condition'], price:['pret','price'],
  quantity:['cantitate','buc','stoc','quantity'], oem:['oem','cod','codoem','codpiesa'], county:['judet','county'], engine:['motorizare','motor','engine'],
  fuel:['combustibil','fuel'], km:['km','kilometri'], vin:['vin','seriesasiu'], parts_avail:['piesedisponibile','piese'],
  delivery:['livrare','delivery'], negotiable:['negociabil','negotiable'], description:['descriere','description'], seller_type:['tipvanzator']
};
const CSV_TEMPLATE = 'tip;titlu;marca;model;an;categorie;stare;pret;cantitate;oem;judet;motorizare;combustibil;km;vin;piese_disponibile;livrare;negociabil;descriere\n'
  + 'piesa;Grila centrala bara fata VW Passat B8;Volkswagen;Passat;2018;Caroserie;Second-hand;350;1;3G0853651;Cluj;;;;;;da;da;Stare buna, fara crapaturi\n'
  + 'piesa;Alternator Ford Fiesta MK6 1.4 TDCi;Ford;Fiesta;2007;Electrică & Electronică Auto;Second-hand;180;2;;Timiș;1.4 TDCi;Diesel;;;;da;nu;\n'
  + 'dezmembrari;Dezmembrez Audi A4 B8 2.0 TDI;Audi;A4;2011;;Second-hand;0;1;;Ilfov;2.0 TDI;Diesel;245000;WAUZZZ8K0BA000000;motor, cutie viteze, bara fata, faruri, usi;nu;nu;Mașină în curs de dezmembrare\n';
const csvKey = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const csvState = { rows:[], valid:0 };
function parseCsv(text){
  text = String(text||'').replace(/^\uFEFF/,'');
  const first = text.split(/\r?\n/,1)[0] || '';
  const cnt = c => first.split(c).length-1;
  const delim = [';','\t',','].sort((a,b)=>cnt(b)-cnt(a))[0];
  const rows=[]; let row=[], cur='', q=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(q){ if(ch==='"'){ if(text[i+1]==='"'){ cur+='"'; i++; } else q=false; } else cur+=ch; }
    else if(ch==='"') q=true;
    else if(ch===delim){ row.push(cur); cur=''; }
    else if(ch==='\n'||ch==='\r'){ if(ch==='\r'&&text[i+1]==='\n') i++; row.push(cur); cur=''; rows.push(row); row=[]; }
    else cur+=ch;
  }
  if(cur!==''||row.length){ row.push(cur); rows.push(row); }
  return rows.filter(r=>r.some(c=>String(c).trim()!==''));
}
function csvToObjects(text){
  const table=parseCsv(text); if(table.length<2) return { rows:[], missing:[], unknown:[] };
  const idx={}, unknown=[];
  table[0].forEach((h,i)=>{ const k=csvKey(h); const canon=Object.keys(CSV_ALIASES).find(c=>CSV_ALIASES[c].includes(k)); if(canon&&!(canon in idx)) idx[canon]=i; else if(String(h).trim()&&!canon) unknown.push(String(h).trim()); });
  const missing=['title','make','model','county'].filter(k=>!(k in idx));
  const rows=table.slice(1).map(r=>{ const o={}; for(const k in idx) o[k]=r[idx[k]]!=null?String(r[idx[k]]).trim():''; return o; });
  return { rows, missing, unknown };
}
function csvDecode(buf){
  try{ return new TextDecoder('utf-8',{fatal:true}).decode(buf); }
  catch{ return new TextDecoder('windows-1250').decode(buf); }
}
function csvShowErrors(errors, more){
  $('#csvErrors').innerHTML = (errors||[]).map(x=>`<div><b>Rândul ${x.line}</b>${x.title?' · '+esc(x.title):''} — ${esc(x.error)}</div>`).join('') + (more>0?`<div class="muted">… și încă ${more} rânduri cu probleme.</div>`:'');
}
async function csvCheck(){
  const st=$('#csvStatus'), go=$('#csvGo'); go.classList.add('hidden'); $('#csvErrors').innerHTML='';
  st.className='csv-status'; st.textContent='Se verifică fișierul…';
  try{
    const r=await api('/api/listings/import',{method:'POST',body:JSON.stringify({rows:csvState.rows,dry:true})});
    csvState.valid=r.valid;
    st.className='csv-status '+(r.valid?'ok':'bad');
    st.textContent=`${r.total} rânduri citite · ${r.valid} gata de import · ${r.invalid} cu probleme`;
    csvShowErrors(r.errors, r.invalid-(r.errors||[]).length);
    if(r.valid>0){ go.textContent=`Importă ${r.valid} ${r.valid===1?'anunț':'anunțuri'}`; go.classList.remove('hidden'); go.disabled=false; }
  }catch(e){ st.className='csv-status bad'; st.textContent=e.message||'Fișierul nu a putut fi verificat.'; }
}
document.addEventListener('click', e=>{
  const t=e.target; let el;
  if(t.closest && t.closest('#csvImportBtn,[data-csv-import]')){
    csvState.rows=[]; csvState.valid=0; $('#csvFile').value=''; $('#csvStatus').textContent=''; $('#csvStatus').className='csv-status'; $('#csvErrors').innerHTML=''; $('#csvGo').classList.add('hidden');
    $('#csvModal').classList.remove('hidden'); return;
  }
  if(t.closest && t.closest('#csvTemplate')){
    const blob=new Blob(['\uFEFF'+CSV_TEMPLATE],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download='model-import-anunturi.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); return;
  }
  if((el=t.closest && t.closest('#csvGo'))){
    if(!csvState.valid || !confirm(`Creezi ${csvState.valid} anunțuri din acest fișier?`)) return;
    el.disabled=true; const st=$('#csvStatus'); st.className='csv-status'; st.textContent='Se importă…';
    safe(async()=>{
      try{
        const r=await api('/api/listings/import',{method:'POST',body:JSON.stringify({rows:csvState.rows})});
        st.className='csv-status ok'; st.textContent=`Gata! ${r.imported} ${r.imported===1?'anunț creat':'anunțuri create'}${r.invalid?` · ${r.invalid} sărite`:''}.`;
        csvShowErrors(r.errors, r.invalid-(r.errors||[]).length); el.classList.add('hidden'); csvState.rows=[]; csvState.valid=0;
        toast(`${r.imported} anunțuri importate.`);
        if(typeof enterMine==='function') await enterMine();
      }catch(err){ st.className='csv-status bad'; st.textContent=err.message||'Importul a eșuat.'; el.disabled=false; }
    })();
    return;
  }
});
document.addEventListener('change', e=>{
  if(e.target.id!=='csvFile') return;
  const f=e.target.files&&e.target.files[0]; if(!f) return;
  const st=$('#csvStatus'); st.className='csv-status'; $('#csvErrors').innerHTML=''; $('#csvGo').classList.add('hidden');
  if(f.size>2*1024*1024){ st.className='csv-status bad'; st.textContent='Fișierul este prea mare (maximum 2 MB).'; return; }
  f.arrayBuffer().then(buf=>{
    const r=csvToObjects(csvDecode(buf));
    if(r.missing.length){ st.className='csv-status bad'; st.textContent='Lipsesc coloanele obligatorii: '+r.missing.join(', ')+'. Descarcă modelul CSV și respectă numele coloanelor.'; return; }
    if(!r.rows.length){ st.className='csv-status bad'; st.textContent='Fișierul nu conține rânduri de importat.'; return; }
    if(r.rows.length>300){ st.className='csv-status bad'; st.textContent=`Fișierul are ${r.rows.length} rânduri. Importă cel mult 300 odată.`; return; }
    csvState.rows=r.rows; csvCheck();
  }).catch(()=>{ st.className='csv-status bad'; st.textContent='Fișierul nu a putut fi citit.'; });
});

/* ===== Timp real (SSE) — mesaje și notificări fără refresh ===== */
function initLive(){
  const live = window.AutoPartsLive;
  if(!live) return;            // browser fără EventSource
  if(!currentUser){ live.stop(); return; }
  live.start();

  // Mesaj nou primit: actualizează lista dacă utilizatorul e în Mesagerie, altfel doar badge-ul.
  live.on('message', m=>{
    if(!m || !m.id) return;
    const h=parseHash();
    const onMessages = h.name==='account-tool' && h.params.get('view')==='messages';
    if(onMessages && msgs.box==='inbox'){
      // evită dublurile dacă mesajul a fost deja adăugat de refresh
      if(!msgs.items.some(x=>String(x.id)===String(m.id))){
        msgs.items.unshift({id:m.id,body:m.body,created_at:m.created_at,is_read:false,other:m.from,other_name:m.from_name,mine:false,ref_title:m.ref_title});
        msgs.unread=(msgs.unread||0)+1;
        renderMessages();
      }
    }
    bumpUnreadBadge();
  });

  // Orice notificare nouă: reîncarcă badge-ul din server (o singură cerere, sursă de adevăr).
  live.on('notification', ()=>{ bumpUnreadBadge(); });
}

// Refolosește contoarele existente (refreshCounts) — o singură sursă de adevăr pentru badge-uri.
let badgeTimer=null;
function bumpUnreadBadge(){
  clearTimeout(badgeTimer);
  badgeTimer=setTimeout(()=>{ try{ refreshCounts(); }catch(e){} },400);
}

(async function init(){
  initFormValidation();
  fillStaticSelects();
  wire();
  try{ const r = await api('/api/me'); currentUser = r.user || null; window.__verif = r.verification || null; }catch{ currentUser = null; }
  renderHeader();
  initLive();
  syncFavorites();
  route();
  loadFooterLogos();
  loadCatalog().then(()=>{ if(parseHash().name==='rezultate') applyFiltersToUI(); });
})();

/* meniul de jos: rămâne vizibil; se retrage doar cât timp meniul lateral e deschis (html.menu-open în CSS) */
(function(){
  const nav=document.getElementById('bottomNav'); if(!nav) return;
  nav.classList.add('show');
})();

/* apăsare vizibilă pe telefon */
document.addEventListener('touchstart',()=>{},{passive:true});

document.addEventListener('input', e=>{ if(e.target&&e.target.id==='adminSearch'){ adminQuery=e.target.value; const b=$('#adminListBox'); if(b) b.innerHTML=adminListRows(); } });

/* ---------- ferestre: o singură fereastră deschisă + butonul Înapoi le închide ---------- */
/* - când se deschide o fereastră, cele din spate se închid (în afară de login)
   - deschiderea adaugă o intrare în istoric (pushState, fără hashchange => lista din spate nu se reîncarcă)
   - Înapoi (telefon/browser) închide fereastra în loc să scoată omul din pagină
   - închiderea cu ×, Escape sau click pe fundal elimină intrarea (history.back), fără „Înapoi” inutil */
(function modalHistory(){
  const AUTH='authModal';                       // login-ul nu are intrare în istoric (are propriul flux: __afterAuth)
  const all=[...document.querySelectorAll('.modal')];
  if(!all.length || !window.MutationObserver) return;
  const shown=new Set();
  const isOpen=m=>!m.classList.contains('hidden');
  const hasEntry=()=>{ const s=history.state; return !!(s && s.modal); };
  try{ if(hasEntry()) history.replaceState(null,'',location.href); }catch{}   // după reload nu rămâne o intrare goală

  const obs=new MutationObserver(muts=>{
    for(const r of muts){
      const el=r.target, id=el.id, open=isOpen(el);
      if(open && !shown.has(id)){
        shown.add(id);
        if(id===AUTH) continue;
        // închide celelalte ferestre din spate (login-ul rămâne)
        all.forEach(m=>{ if(m!==el && m.id!==AUTH && isOpen(m)) m.classList.add('hidden'); });
        try{
          const st={modal:id};
          if(hasEntry()) history.replaceState(st,'',location.href);   // înlocuiește fereastra anterioară
          else history.pushState(st,'',location.href);                // intrare nouă în istoric
        }catch{}
      }else if(!open && shown.has(id)){
        shown.delete(id);
        if(id===AUTH) continue;
        // dacă între timp s-a făcut o navigare sau s-a deschis altă fereastră, nu mai facem back
        setTimeout(()=>{ const s=history.state; if(s && s.modal===id && !shown.has(id)) history.back(); },0);
      }
    }
  });
  all.forEach(m=>obs.observe(m,{attributes:true,attributeFilter:['class']}));

  // Înapoi / Înainte din browser: închide fereastra deschisă dacă intrarea de istoric nu mai e a ei
  window.addEventListener('popstate',e=>{
    const want=e.state && e.state.modal;
    all.forEach(m=>{ if(m.id!==AUTH && m.id!==want && isOpen(m)) m.classList.add('hidden'); });
  });
})();

/* carusel poze anunț: sincronizează punctele și contorul */
document.addEventListener('scroll',e=>{
  const sl=e.target;
  if(!sl||!sl.classList||!sl.classList.contains('ad-slider')) return;
  const i=Math.max(0,Math.round(sl.scrollLeft/Math.max(1,sl.clientWidth)));
  const box=sl.closest('.ad-gal'); if(!box) return;
  $$('.ad-dots i',box).forEach((d,k)=>d.classList.toggle('on',k===i));
  const c=box.querySelector('.ad-count'); if(c) c.textContent=(i+1)+' / '+sl.children.length;
},true);


/* ---------- rezumat notificări (Contul meu) ---------- */
const NOTIF_ROWS=[['messages','✉','mesaje necitite','messages'],['orders_seller','📦','comenzi noi din oferte','orders-seller'],['orders_buyer','🧾','comenzi în curs','orders'],['offers_received','💬','oferte primite la cereri','offers-received'],['alerts','🔔','alerte din căutări salvate','notifications'],['expire','⏳','anunțuri care expiră curând','listings-expire']];
function toggleNotifSummary(){
  const b=$('#notifSummary'), btn=$('#notifBtn'); if(!b) return;
  const open=b.classList.toggle('hidden')===false;
  if(btn) btn.setAttribute('aria-expanded',open?'true':'false');
  renderNotifSummary();
}
function renderNotifSummary(){
  const b=$('#notifSummary'); if(!b||b.classList.contains('hidden')) return;
  const c=counts||{};
  const rows=NOTIF_ROWS.filter(r=>Number(c[r[0]])>0);
  b.innerHTML=rows.length?rows.map(r=>`<button type="button" class="notif-row" data-notif-go="${r[3]}"><span class="nr-ico">${r[1]}</span><span class="nr-txt"><b>${Number(c[r[0]])}</b> ${r[2]}</span><i>›</i></button>`).join(''):'<p class="muted notif-empty">Nu ai noutăți. Totul este la zi ✓</p>';
}

/* ---------- glisare poze: lightbox + poza principală admin ---------- */
function addSwipe(el, onSwipe){
  let x0=0,y0=0,t0=0,on=false;
  el.addEventListener('touchstart',e=>{ if(e.touches.length!==1){ on=false; return; } on=true; x0=e.touches[0].clientX; y0=e.touches[0].clientY; t0=Date.now(); },{passive:true});
  el.addEventListener('touchend',e=>{
    if(!on) return; on=false;
    const t=e.changedTouches[0], dx=t.clientX-x0, dy=t.clientY-y0;
    if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.3 && Date.now()-t0<800) onSwipe(dx<0?1:-1);
  },{passive:true});
}
(function(){
  const lb=document.getElementById('imageLightbox'); if(lb) addSwipe(lb,d=>moveLightbox(d));
  document.addEventListener('touchstart',e=>{
    const box=e.target.closest&&e.target.closest('#admMainBox'); if(!box||box._sw) return; box._sw=1;
    addSwipe(box,d=>{
      const btns=$$('#adminListingBody [data-adm-img]'); if(btns.length<2) return;
      let i=btns.findIndex(b=>b.classList.contains('on')); if(i<0) i=0;
      btns[(i+d+btns.length)%btns.length].click();
    });
  },{passive:true,capture:true});
})();

/* ---------- tooltip-uri pe pictograme ---------- */
(function(){
  const tip=document.createElement('div'); tip.id='uiTip'; tip.setAttribute('role','tooltip'); tip.className='ui-tip'; document.body.appendChild(tip);
  let timer=null, hideT=null, cur=null, lastTouch=0, suppressClick=0;
  function target(n){
    const el=n&&n.closest&&n.closest('button,a,[role="button"],[data-tip]'); if(!el) return null;
    if(!(el.dataset.tip||el.getAttribute('aria-label')||el.getAttribute('title'))) return null;
    if(!el.dataset.tip){
      const txt=(el.textContent||'').replace(/\s+/g,' ').trim();
      if(txt.length>6) return null;
    }
    return el;
  }
  function label(el){
    if(!el.dataset.tip) el.dataset.tip=el.getAttribute('title')||el.getAttribute('aria-label')||'';
    if(el.hasAttribute('title')){ el.removeAttribute('title'); if(!el.getAttribute('aria-label')) el.setAttribute('aria-label',el.dataset.tip); }
    return el.dataset.tip;
  }
  function show(el){
    const t=label(el); if(!t) return; cur=el; tip.textContent=t; tip.classList.add('on'); tip.style.left='0px'; tip.style.top='0px';
    const r=el.getBoundingClientRect(), w=tip.offsetWidth, h=tip.offsetHeight;
    let x=r.left+r.width/2-w/2; x=Math.max(6,Math.min(x,innerWidth-w-6));
    let y=r.top-h-8; if(y<6) y=r.bottom+8;
    tip.style.left=Math.round(x)+'px'; tip.style.top=Math.round(y)+'px';
  }
  function hide(){ clearTimeout(timer); clearTimeout(hideT); timer=null; cur=null; tip.classList.remove('on'); }
  document.addEventListener('mouseover',e=>{
    if(Date.now()-lastTouch<900) return;
    const el=target(e.target); if(!el||el===cur) return;
    hide(); label(el); timer=setTimeout(()=>show(el),500);
  });
  document.addEventListener('mouseout',e=>{ const el=target(e.target); if(el && !el.contains(e.relatedTarget)) hide(); });
  document.addEventListener('mousedown',hide);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') hide(); },true);
  document.addEventListener('scroll',hide,true);
  document.addEventListener('focusin',e=>{ const el=target(e.target); if(el && el.matches(':focus-visible')){ hide(); show(el); } });
  document.addEventListener('focusout',hide);
  /* telefon: apăsare lungă ~0,5 s */
  document.addEventListener('touchstart',e=>{
    lastTouch=Date.now(); hide();
    const el=target(e.target); if(!el||e.touches.length!==1) return; label(el);
    timer=setTimeout(()=>{ show(el); suppressClick=Date.now(); hideT=setTimeout(hide,2000); },750);
  },{passive:true});
  const release=()=>{ lastTouch=Date.now(); if(tip.classList.contains('on')){ clearTimeout(hideT); hideT=setTimeout(hide,700); } else { clearTimeout(timer); timer=null; } };
  document.addEventListener('touchend',release,{passive:true});
  document.addEventListener('touchcancel',release,{passive:true});
  document.addEventListener('touchmove',()=>{ if(!tip.classList.contains('on')) hide(); },{passive:true});
  document.addEventListener('contextmenu',e=>{ if(Date.now()-lastTouch<1500 && target(e.target)) e.preventDefault(); });
  /* după apăsarea lungă nu se execută acțiunea butonului */
  document.addEventListener('click',e=>{
    if(suppressClick && Date.now()-suppressClick<1200 && target(e.target)){ e.stopImmediatePropagation(); e.preventDefault(); suppressClick=0; }
    hide();
  },true);
})();

/* === Ferestre ca pe desktop: _ □ X + mutare (doar laptop / ecrane mari, peste 820px) === */
(function(){
  const TITLES={detailModal:'Anunț',requestModal:'Cerere de piesă',adminListingModal:'Anunț (admin)',csvModal:'Import anunțuri CSV',garageModal:'Mașina ta',serviceModal:'Adaugă atelier'};
  const mq=window.matchMedia('(min-width:821px)');
  const I_MIN='<svg viewBox="0 0 14 14"><path d="M2 10h10"/></svg>';
  const I_MAX='<svg viewBox="0 0 14 14"><rect x="2.5" y="2.5" width="9" height="9"/></svg>';
  const I_RES='<svg viewBox="0 0 14 14"><rect x="2.5" y="4.5" width="7" height="7"/><path d="M4.5 4.5V2.5h7v7h-2"/></svg>';
  const I_X='<svg viewBox="0 0 14 14"><path d="M2.5 2.5l9 9M11.5 2.5l-9 9"/></svg>';

  function setup(modal){
    const card=modal.querySelector('.modal-card'); if(!card) return;
    const st={x:0,y:0,min:false,max:false};
    let drag=null, lastTitle='', wasOpen=!modal.classList.contains('hidden');

    const bar=document.createElement('div'); bar.className='wc-bar';
    bar.innerHTML='<div class="wc-title"></div><div class="wc-btns">'+
      '<button type="button" class="wc-btn" data-wc="min" aria-label="Minimizează" title="Minimizează">'+I_MIN+'</button>'+
      '<button type="button" class="wc-btn" data-wc="max" aria-label="Mărește" title="Mărește">'+I_MAX+'</button>'+
      '<button type="button" class="wc-btn" data-close aria-label="Închide" title="Închide">'+I_X+'</button></div>';
    card.insertBefore(bar,card.firstChild);
    modal.classList.add('wc-on');
    const titleEl=bar.querySelector('.wc-title'), maxBtn=bar.querySelector('[data-wc="max"]'), minBtn=bar.querySelector('[data-wc="min"]');

    function paint(){
      modal.classList.toggle('wc-min',st.min);
      modal.classList.toggle('wc-max',st.max&&!st.min);
      card.style.setProperty('--wc-x',st.x+'px'); card.style.setProperty('--wc-y',st.y+'px');
      maxBtn.innerHTML=st.max?I_RES:I_MAX;
      const lbl=st.max?'Readu la mărimea mică':'Mărește'; maxBtn.title=lbl; maxBtn.setAttribute('aria-label',lbl);
      const l2=st.min?'Restaurează':'Minimizează'; minBtn.title=l2; minBtn.setAttribute('aria-label',l2);
    }
    function reset(){ st.x=0; st.y=0; st.min=false; st.max=false; paint(); }

    function updateTitle(){
      const h=card.querySelector('h2');
      const t=(h&&h.textContent.trim())||TITLES[modal.id]||'';
      if(t===lastTitle) return;
      if(st.min&&lastTitle&&h){ st.min=false; paint(); }   // s-a deschis alt anunț cât era minimizată
      lastTitle=t; titleEl.textContent=t;
    }

    bar.addEventListener('click',e=>{
      const b=e.target.closest('[data-wc]'); if(!b) return;
      if(b.dataset.wc==='min') st.min=!st.min;
      else if(st.min) st.min=false;
      else st.max=!st.max;
      paint();
    });
    bar.addEventListener('dblclick',e=>{
      if(e.target.closest('.wc-btn')||st.min||!mq.matches) return;
      st.max=!st.max; paint();
    });

    bar.addEventListener('pointerdown',e=>{
      if(e.button!==0||e.target.closest('.wc-btn')||st.max||st.min||!mq.matches) return;
      const r=card.getBoundingClientRect();
      drag={sx:e.clientX,sy:e.clientY,x0:st.x,y0:st.y,r:r,s:(r.width/card.offsetWidth)||1};
      try{ bar.setPointerCapture(e.pointerId); }catch(_){}
      bar.classList.add('wc-drag'); e.preventDefault();
    });
    bar.addEventListener('pointermove',e=>{
      if(!drag) return;
      let dx=e.clientX-drag.sx, dy=e.clientY-drag.sy; const r=drag.r;
      dx=Math.min(Math.max(dx,150-r.right),window.innerWidth-r.right);      // butoanele _ □ X rămân mereu pe ecran
      dy=Math.min(Math.max(dy,-r.top),window.innerHeight-40-r.top);         // bara nu iese sus/jos din ecran
      st.x=drag.x0+dx/drag.s; st.y=drag.y0+dy/drag.s; paint();
    });
    const endDrag=()=>{ drag=null; bar.classList.remove('wc-drag'); };
    bar.addEventListener('pointerup',endDrag);
    bar.addEventListener('pointercancel',endDrag);
    bar.addEventListener('lostpointercapture',endDrag);

    window.addEventListener('resize',()=>{
      if(modal.classList.contains('hidden')||st.max||st.min||(!st.x&&!st.y)) return;
      const r=bar.getBoundingClientRect();
      if(r.top<0||r.top>window.innerHeight-40||r.right<150||r.right>window.innerWidth+1){ st.x=0; st.y=0; paint(); }
    });

    // la deschidere / închidere: pornește mereu din centru, mărime mică
    new MutationObserver(()=>{
      const open=!modal.classList.contains('hidden');
      if(open!==wasOpen){ wasOpen=open; reset(); lastTitle=''; }
      if(open) updateTitle();
    }).observe(modal,{attributes:true,attributeFilter:['class']});
    // titlul urmează conținutul anunțului (se încarcă după deschidere)
    new MutationObserver(muts=>{
      if(muts.every(m=>bar.contains(m.target))) return;
      updateTitle();
    }).observe(card,{childList:true,subtree:true,characterData:true});

    paint(); updateTitle();
  }

  ['detailModal','requestModal','adminListingModal','csvModal','garageModal','serviceModal'].forEach(id=>{ const m=document.getElementById(id); if(m) setup(m); });
})();

/* Sincronizare poză profil în meniu (mutat din index.html: CSP nu permite scripturi inline) */
(function(){
  var btn=document.getElementById('avatarBtn'),box=document.getElementById('menuAvatar');
  if(!btn||!box)return;
  function sync(){
    var src=btn.querySelector('img'); src=src&&src.getAttribute('src');
    var cur=box.querySelector('img');
    if(src){
      if(!cur){cur=document.createElement('img');cur.alt='';box.appendChild(cur);}
      if(cur.getAttribute('src')!==src)cur.setAttribute('src',src);
      box.classList.add('has-photo');
    }else{
      if(cur)cur.remove();
      box.classList.remove('has-photo');
    }
  }
  new MutationObserver(sync).observe(btn,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
  sync();
})();


/* Fir de navigare „AutoParts › Pagina” pe toate paginile cu casetă (titlul se actualizează singur) */
(function(){
  const fixed={'page-account':'Contul meu','page-admin':'Administrare'};
  document.querySelectorAll('section.page').forEach(pg=>{
    const c=pg.querySelector(':scope>.container'); if(!c||c.querySelector('.crumbs')) return;
    const h2=c.querySelector('.page-head h2'), fx=fixed[pg.id];
    if(!h2&&!fx) return;
    const p=document.createElement('p'); p.className='crumbs';
    p.innerHTML='<a href="#/">AutoParts</a> › <span></span>';
    const sp=p.lastElementChild;
    c.insertBefore(p,c.firstChild);
    const upd=()=>{ sp.textContent = fx || (pg.classList.contains('is-reviews') ? 'Recenzii' : h2.textContent.trim()); };
    upd();
    if(h2) new MutationObserver(upd).observe(h2,{childList:true,characterData:true,subtree:true});
    new MutationObserver(upd).observe(pg,{attributes:true,attributeFilter:['class']});
  });
})();


/* ===== Buton „Ajutor” în chenarul fiecărei pagini: fereastră care coboară cu explicații =====
   Textele sunt într-un singur loc (HELP / TOOL). Pagina fără text propriu primește explicația generală. */
(function helpSheet(){
  const L=(t,d)=>({t,d});
  const HELP={
    'page-results':{title:'Piese auto',intro:'Aici vezi anunțurile care se potrivesc căutării tale.',items:[
      L('Căutare','Scrie codul OEM, numele piesei sau marca și modelul, apoi apasă butonul de căutare.'),
      L('Filtre','Restrâng lista după categorie, marcă, model, stare, județ, preț sau tipul vânzătorului. Pe telefon se deschid cu butonul Filtrare.'),
      L('Ordonare','Alegi dacă vezi întâi cele mai noi, cele mai ieftine sau cele mai scumpe anunțuri.'),
      L('Salvează căutarea','Salvează căutarea curentă. Primești o notificare când apare un anunț nou care i se potrivește (e nevoie de cont).'),
      L('Inimioara de pe anunț','Adaugă anunțul la Favorite, ca să îl găsești ușor mai târziu.'),
      L('Deschide un anunț','Apasă pe el ca să vezi pozele, detaliile și datele vânzătorului. De acolo îl poți contacta sau comanda.'),
      L('Nu găsești piesa?','Folosește „Primește oferte piese”. Vânzătorii îți trimit oferte.')]},
    'seller':{title:'Anunțurile vânzătorului',intro:'Lista cu toate anunțurile active ale acestui vânzător.',items:[
      L('Înapoi','Te întoarce la pagina de unde ai venit.'),
      L('Calificativ și stele','Părerea cumpărătorilor care au comandat de la el. Apasă pe ele ca să vezi recenziile.'),
      L('Anunțurile','Apasă pe un anunț ca să vezi detaliile și să scrii vânzătorului.')]},
    'page-request-pick':{title:'Cerere de piese: alege mașina',intro:'Primul pas ca să primești oferte de la vânzători.',items:[
      L('Alege mașina ta','Apasă pe o mașină salvată în Garajul meu. Datele ei se completează singure în cerere.'),
      L('+ Adaugă o cerere pentru altă mașină','Pentru o mașină care nu e în garaj. Completezi datele de la zero.')]},
    'page-request':{title:'Cerere de piese',intro:'Spui ce piesă cauți, iar vânzătorii îți trimit oferte cu preț.',items:[
      L('Denumire piesă','Scrie clar ce cauți. Ex: „Bară față Dacia Logan 2005 roșie”.'),
      L('Codul piesei sau detalii','Cod OEM, stare dorită, orice detaliu care ajută vânzătorul.'),
      L('+ Adaugă încă o piesă','Ceri mai multe piese pentru aceeași mașină, în aceeași cerere.'),
      L('Mașina','Marca, modelul, anul, motorizarea și seria de șasiu (VIN). Cu VIN-ul, vânzătorii găsesc piesa exactă.'),
      L('Doresc oferte de piese','Alegi piese noi, second-hand sau ambele.'),
      L('Livrare','Județul este obligatoriu. Adresa completă e opțională și o vede doar vânzătorul a cărui ofertă o accepți.'),
      L('Poze','Până la 6 poze, de exemplu cu piesa veche.'),
      L('Trimite cererea','Publică cererea. O poți modifica doar în primele 10 minute după publicare.')]},
    'page-sell':{title:'Postează un anunț',intro:'Completezi datele piesei, iar anunțul este verificat de echipă înainte să apară în căutări.',items:[
      L('Titlu','Piesa, marca, modelul și anii compatibili. Marca și modelul se completează singure din titlu.'),
      L('Descriere','Starea piesei, codul OEM și orice defect.'),
      L('Categoria','Alege categoria piesei, ca să fie găsită mai ușor.'),
      L('Poze','Până la 8 poze clare, făcute la lumină, din mai multe unghiuri.'),
      L('Pentru ce mașină','Marcă, model, an, motorizare, kilometri și VIN. Cu cât sunt mai complete, cu atât anunțul e mai ușor de găsit.'),
      L('Preț','Cumpărătorii compară rapid după preț.'),
      L('Tip anunț, Vând ca, Stare','Piesă sau mașină la dezmembrat; persoană fizică sau firmă; nouă sau second-hand.'),
      L('Județ și Cod OEM','Județul te ajută să fii găsit local. Mulți cumpărători caută după codul OEM.'),
      L('Publică anunțul','Trimite anunțul la verificare. Până la aprobare îl vezi în Contul meu → Anunțurile mele, cu starea „În așteptare”.'),
      L('Renunță la modificări','Apare când editezi un anunț. Închide editarea fără să salveze.')]},
    'page-dism':{title:'Mașini pentru piese',intro:'Vehicule aflate la dezmembrare, cu piesele lor disponibile.',items:[
      L('Cardul mașinii','Arată mașina, anul, motorul și ce piese sunt disponibile. Apasă pe el ca să întrebi vânzătorul.'),
      L('＋ Adaugă o mașină la dezmembrat','Pentru parcuri și dezmembrări: publici mașina, iar cumpărătorii te contactează pentru piese.')]},
    'page-services':{title:'Ateliere și montaj',intro:'Zona pentru service-uri și reparații.',items:[
      L('În curând','Vom putea căuta service-uri după județ, localitate și tip de lucrare. Deocamdată pagina nu are funcții.')]},
    'page-match':{title:'Se potrivește mașinii mele?',intro:'Verifici ce piese sunt compatibile cu mașina ta.',items:[
      L('Marcă, model, an, motor','Alege mașina. Datele se completează și automat, pe măsură ce scrii.'),
      L('Piesa căutată','Ex: far dreapta sau turbocompresor.'),
      L('Caută piese compatibile','Îți arată doar anunțurile care se potrivesc mașinii alese.')]},
    'page-requests':{title:'Piese căutate de cumpărători',intro:'Cereri publicate de cumpărători. Dacă ai piesa, trimiți o ofertă.',items:[
      L('Starea cererilor','Lista de sus (de exemplu „Nu am ofertat încă”) alege ce cereri vezi: toate, cele la care ai ofertat, cele amânate sau cele ignorate.'),
      L('Filtrează','Restrânge cererile după marcă, model, tip de piese, județ, număr de oferte sau cuvinte cheie.'),
      L('Deschide o cerere','Apasă pe ea ca să vezi detaliile și pozele cumpărătorului.'),
      L('Trimite o ofertă','Scrii prețul, un mesaj și, dacă vrei, poze. Cumpărătorul vede și telefoanele din contul tău.'),
      L('Ofertez mai târziu','Muți cererea în lista ta de amânate.'),
      L('Ignoră','Ascunzi cererea. O găsești în „Ignorate”.'),
      L('Raportează','Anunți echipa dacă o cerere pare suspectă sau încalcă regulile.'),
      L('Adaugă cerere de piese','Pentru când cauți tu o piesă.')]},
    'requests-mine':{title:'Cererile mele de piese',intro:'Cererile publicate de tine și ofertele primite.',items:[
      L('Active, Inactive, Rezolvate','Filele împart cererile după stare. Cele active primesc oferte.'),
      L('Caută în titlu','Găsești repede o cerere după cuvinte din titlu.'),
      L('Ofertele primite','Deschide o cerere ca să vezi ofertele. Poți accepta, respinge sau pune întrebări.'),
      L('Acceptă oferta','Se creează o comandă, iar vânzătorul primește adresa de livrare.'),
      L('Editare','Cererea se poate modifica doar în primele 10 minute după publicare.')]},
    'page-stores':{title:'Magazine și parcuri',intro:'Vânzători verificați și parcuri de dezmembrări.',items:[
      L('Cardul vânzătorului','Apasă pe el ca să vezi toate anunțurile lui, calificativele și datele de contact.')]},
    'page-mine':{title:'Anunțurile mele',intro:'Aici gestionezi anunțurile pe care le-ai publicat.',items:[
      L('Cum postezi un anunț','Din meniu apasă „Postează un anunț”. Completezi titlul, pozele, mașina și prețul, apoi „Publică anunțul”. Anunțul apare întâi „În așteptare”, până îl verifică echipa.'),
      L('Filele: Active, Stoc epuizat, Expiră, Promovate, Șterse','Împart anunțurile după stare. La „Expiră” vezi anunțurile care expiră în următoarele 7 zile; le poți activa (încă 30 de zile) sau șterge. Cele expirate trec automat în „Șterse”, de unde le poți reactualiza.'),
      L('Reactualizează (săgeata în sus)','Aduce anunțul din nou sus în listă. Nu se poate face prea des.'),
      L('Editează (creionul)','Modifici anunțul. Dacă schimbi pozele, categoria, marca, modelul, anul, codul OEM sau tipul, anunțul este verificat din nou.'),
      L('Stoc epuizat / Repune în stoc','Marchezi piesa vândută, ca să nu mai fii sunat degeaba. Același buton o repune la vânzare.'),
      L('Promovează','Apare doar când promovarea este activă. Pune anunțul în față.'),
      L('Șterge (coșul)','Mută anunțul în „Șterse”. De acolo îl poți restaura sau șterge definitiv.'),
      L('Bife și acțiuni în masă','Bifează mai multe anunțuri ca să le modifici o dată.')]},
    'page-messages':{title:'Mesagerie',intro:'Conversațiile tale cu cumpărători și vânzători.',items:[
      L('Primite, Trimise, Arhivate','Filele împart mesajele după locul în care se află.'),
      L('Trimite un mesaj','Scrii unui utilizator, de exemplu pentru un anunț care te interesează.'),
      L('Arhivează','Scoate conversația din „Primite”, fără să o șteargă.'),
      L('Blochează','Oprește mesajele de la o persoană care te deranjează. Lista blocaților e în Setări, unde îi poți debloca.')]},
    'page-saved':{title:'Căutări salvate',intro:'Căutările pe care le-ai salvat cu inimioara ♡.',items:[
      L('Deschide o căutare','Apasă pe ea ca să rulezi din nou căutarea.'),
      L('Ștergere','Elimină căutarea din listă.'),
      L('Alerte','Ca să primești email când apare un anunț nou, bifează „Alerte pentru căutările salvate” în Setări.')]},
    'page-account':{title:'Contul meu',intro:'Punctul de pornire pentru tot ce ține de contul tău.',items:[
      L('🔔 Notificări','Rezumatul activității noi: mesaje, oferte, comenzi.'),
      L('Poza de profil','Apasă pe avatar ca să o schimbi.'),
      L('VÂND','Anunțurile mele, răspunsurile tale la cereri, vânzările din cereri și întrebările de la cumpărători.'),
      L('CUMPĂR','Cererile tale de piese, ofertele primite, favorite, comenzile și căutările salvate.'),
      L('CONVERSAȚII','Mesajele și notificările contului.'),
      L('INSTRUMENTE','Import CSV, actualizare de prețuri, generator de anunțuri, statistici și B2B. Sunt utile mai ales pentru parcuri și magazine.'),
      L('BANI','Credite, tranzacții și facturi. Momentan sunt doar informative.'),
      L('CALIFICATIVE','Stelele primite ca vânzător și ca cumpărător.'),
      L('SETĂRI','Datele contului, livrarea, notificările, modul vacanță, blocații și ștergerea contului.'),
      L('Ieșire din cont','Te deconectează.'),
      L('Retrimite emailul de confirmare','Apare cât timp adresa de email nu este confirmată.')]},
    'page-settings':{title:'Setări cont',intro:'Aici îți schimbi datele și preferințele.',items:[
      L('1. Date personale','Nickname, nume, email și parolă. Emailul nou trebuie confirmat.'),
      L('2. Date de livrare','Adresa și telefoanele pe care le vede vânzătorul când comanzi.'),
      L('4. Profil firmă / parc','Logo sau poză, pentru vânzătorii care au firmă sau parc.'),
      L('5. Notificări pe email','Alegi ce emailuri primești, inclusiv alertele pentru căutările salvate.'),
      L('6. Mod vacanță','Ascunde anunțurile până la data aleasă (maximum 365 de zile). Mesajele merg în continuare.'),
      L('7. Utilizatori blocați','Lista celor blocați, cu buton de deblocare.'),
      L('8. Sesiuni active','Dispozitivele conectate la contul tău. Le poți deconecta.'),
      L('9. Datele mele și ștergerea contului','Descarci datele tale sau ștergi contul. Contul nu se poate șterge cât ai comenzi în curs.')]},
    'page-admin':{title:'Administrare',intro:'Panoul pentru administratori.',items:[
      L('Moderare anunțuri','Aprobi sau respingi anunțurile în așteptare. Respingerea trimite motivul vânzătorului.'),
      L('Utilizatori','Vezi conturile și poți bloca sau debloca un cont.'),
      L('Cereri și raportări','Verifici cererile de piese și conținutul raportat de utilizatori.'),
      L('Activitatea administratorilor','Istoricul acțiunilor făcute de administratori.')]},
    'page-privacy':{title:'Politica de confidențialitate',intro:'Cum sunt folosite datele tale.',items:[L('Ce găsești aici','Ce date colectăm, de ce, cât le păstrăm și cum îți exerciți drepturile. Datele contului le poți descărca sau șterge din Setări.')]},
    'page-cookies':{title:'Politica de cookie-uri',intro:'Ce cookie-uri folosește site-ul.',items:[L('Ce găsești aici','Folosim doar cookie-ul de sesiune, necesar pentru autentificare. Nu folosim cookie-uri de urmărire.')]},
    'page-rules':{title:'Regulament de publicare',intro:'Regulile pe care trebuie să le respecte anunțurile.',items:[L('Ce găsești aici','Ce se poate publica și ce nu. Un anunț respins nu respectă acest regulament: corectează-l și trimite-l din nou.')]},
    'page-contact':{title:'Contact și raportare',intro:'Cum ne scrii sau raportezi un conținut.',items:[L('Ce găsești aici','Datele de contact și pașii pentru a raporta un anunț, un mesaj sau un utilizator suspect.')]},
    'page-terms':{title:'Termeni și condiții',intro:'Regulile de folosire a AutoParts.',items:[L('Ce găsești aici','AutoParts pune în legătură cumpărătorii cu vânzătorii. Vânzarea se face între ei. Aici sunt drepturile și obligațiile fiecăruia.')]},
    'page-reset-password':{title:'Schimbă parola',intro:'Alegi o parolă nouă.',items:[
      L('Parolă nouă și confirmare','Cel puțin 8 caractere. Scrie-o de două ori, la fel.'),
      L('◉ (ochiul)','Arată sau ascunde parola.'),
      L('Link valabil','Linkul din email e valabil 30 de minute și se poate folosi o singură dată.')]},
    'page-verify-email':{title:'Confirmă emailul',intro:'Verificăm linkul primit pe email.',items:[L('Ce se întâmplă','Dacă linkul e valid, adresa se confirmă singură. Dacă a expirat, cere un email nou din Contul meu.')]},
    'page-verify-email-change':{title:'Confirmă emailul nou',intro:'Verificăm linkul pentru schimbarea adresei.',items:[L('Ce se întâmplă','Dacă linkul e valid, adresa nouă devine adresa contului. Dacă a expirat, cere schimbarea din nou din Setări.')]}
  };
  /* secțiunile din Contul meu (pagina „account-tool”), după cheia din meniu: [titlu, introducere, elemente] */
  const TOOL={
    cart:['Coșul meu','Anunțurile pe care vrei să le ții la îndemână.',[L('Vezi piesele','Te duce la lista de anunțuri.')]],
    offers:['Răspunsuri la cereri','Ofertele pe care le-ai trimis la cererile cumpărătorilor.',[L('File după stare','În așteptare, Acceptate, Respinse sau Toate.'),L('Editează','Modifici oferta cât timp nu a fost acceptată.'),L('Retrage','Ștergi oferta trimisă.'),L('Vezi cererile disponibile','Te duce la lista cererilor la care poți trimite oferta.')]],
    'orders-seller':['Comenzi primite','Comenzile venite din anunțurile tale și din ofertele acceptate.',[L('File după stare','Active, Suspendate, Finalizate, Anulate sau Toate.'),L('Butoanele comenzii','Confirmi, marchezi expediată sau finalizată ori anulezi comanda. La anulare scrii cumpărătorului un mesaj.'),L('Calificativ','După finalizare poți da o notă cumpărătorului.')]],
    'offers-received':['Ofertele primite','Ofertele vânzătorilor la cererile tale.',[L('Acceptă oferta','Se creează o comandă, iar vânzătorul primește adresa de livrare.'),L('Respinge','Refuzi oferta. Vânzătorul este anunțat.'),L('Întrebări','Poți scrie vânzătorului înainte să decizi.'),L('Vezi cererile mele','Te duce la cererile tale de piese.')]],
    orders:['Comenzile mele','Piesele pe care le-ai comandat.',[L('File după stare','Active, Suspendate, Finalizate, Anulate sau Toate.'),L('Anulează','Poți anula cât timp comanda nu a fost expediată.'),L('Calificativ','După finalizare dai o notă vânzătorului. Nota se vede public, lângă numele lui.')]],
    order:['Comandă','Detaliile unei comenzi.',[L('Stare','Arată în ce etapă este comanda.'),L('Date de livrare','Adresa și telefoanele stabilite pentru livrare.'),L('Mesaj','Poți scrie celeilalte părți despre comandă.')]],
    messages:['Mesaje','Conversațiile tale cu cumpărători și vânzători.',[L('Deschide o conversație','Apasă pe ea ca să citești și să răspunzi.'),L('Blochează','Oprește mesajele de la acea persoană.')]],
    notifications:['Notificări','Activitatea nouă din cont.',[L('Notificare','Apasă pe ea ca să ajungi direct la mesajul, oferta sau comanda respectivă.')]],
    credits:['Credite','Soldul contului.',[L('Sold','Momentan funcția de credite este doar informativă.')]],
    transactions:['Tranzacții','Comenzile tale, ca cumpărător și ca vânzător.',[L('Listă','Vezi istoricul comenzilor. Momentan este doar informativ.')]],
    invoices:['Facturi','Facturile emise pentru contul tău.',[L('Listă','Momentan este doar informativ.')]],
    stats:['Statistici','Cum se comportă anunțurile tale.',[L('Perioada','Alegi ce interval vezi: pe zile sau pe luni.'),L('Pe anunț','Vezi cum merge fiecare anunț în parte.')]],
    'offer-questions':['Întrebări de la cumpărători','Întrebările cumpărătorilor despre ofertele tale.',[L('Răspunde','Scrii răspunsul. Cumpărătorul îl primește imediat.')]],
    'bulk-price':['Actualizare prețuri','Schimbi dintr-o dată prețurile anunțurilor active.',[L('Mod de modificare','Alegi cum se schimbă prețurile.'),L('Aplică','Modifică toate anunțurile alese. Verifică rezultatul după aceea.')]],
    generator:['Generator de anunțuri','Primești titlul și descrierea gata scrise.',[L('Datele piesei','Completezi câteva date despre piesă.'),L('Generează','Obții un text pe care îl poți copia în anunț.')]],
    b2b:['B2B','Instrumente pentru parcuri, service-uri și magazine cu stoc mare.',[L('Import CSV','Încarci dintr-o dată toate piesele, din Contul meu → INSTRUMENTE.'),L('Actualizare prețuri','Schimbi prețurile în masă.')]],
    ratings:['Calificativele mele','Stelele primite ca vânzător și ca cumpărător.',[L('Medie și număr','Cât de mulțumiți sunt cei cu care ai lucrat.'),L('Comentarii','Părerile scrise. Se văd public, lângă numele tău.')]],
    reviews:['Recenzii','Părerile cumpărătorilor despre un vânzător.',[L('Stele și comentarii','Notele date după comenzile finalizate.')]],
    favorites:['Favorite','Anunțurile pe care le-ai salvat cu inimioara ♡.',[L('Deschide','Apasă pe anunț ca să îl vezi.'),L('Inimioara','O apeși din nou ca să scoți anunțul din Favorite.')]],
    saved:['Căutări salvate','Căutările pe care le urmărești.',[L('Deschide','Rulezi din nou căutarea.'),L('Alerte','Se activează din Setări, la „Alerte pentru căutările salvate”.')]],
    requests:['Cererile mele de piese','Cererile publicate de tine.',[L('Active, Inactive, Rezolvate','Împart cererile după stare.'),L('Ofertele','Deschide o cerere ca să vezi ofertele primite.')]],
    settings:['Setări','Datele contului și preferințele.',[L('Secțiunile','Date personale, livrare, notificări, modul vacanță, blocați, sesiuni și ștergerea contului.')]]
  };
  const GENERIC={title:'Ajutor',intro:'Explicații pentru această pagină.',items:[
    L('Înapoi','Te întoarce la pagina anterioară.'),
    L('Mai mult ajutor','Pagina completă de ajutor are pașii, regulile de siguranță și răspunsurile la întrebările dese.')]};

  const $h=(s,r=document)=>r.querySelector(s);
  function resolve(btn){
    const pg=btn.closest('section.page'); const id=pg?pg.id:'';
    if(btn.closest('.seller-banner')||(pg&&pg.classList.contains('seller-view'))) return HELP.seller;
    if(id==='page-requests') return /[?&]t=mine/.test(location.hash)?HELP['requests-mine']:HELP['page-requests'];
    if(id==='page-account-tool'){
      let v=''; try{ v=currentToolView; }catch{}
      const t=TOOL[v]; if(t) return {title:t[0],intro:t[1],items:t[2]};
      return {title:($h('#accountToolTitle')||{}).textContent||'Contul meu',intro:($h('#accountToolSub')||{}).textContent||'',items:[L('Înapoi','Te întoarce în Contul meu.')]};
    }
    return HELP[id]||GENERIC;
  }

  /* ---- fereastra care coboară ---- */
  let sheet,lastFocus;
  function build(){
    sheet=document.createElement('div'); sheet.id='helpSheet'; sheet.className='hs hidden';
    sheet.innerHTML='<div class="hs-back" data-hs-close></div><div class="hs-card" role="dialog" aria-modal="true" aria-labelledby="hsTitle" tabindex="-1"><button type="button" class="hs-x" data-hs-close aria-label="Închide ajutorul">×</button><div class="hs-eyebrow">AJUTOR</div><h2 id="hsTitle"></h2><p class="hs-intro"></p><div class="hs-list"></div><a class="hs-more" href="/ajutor.html">Pagina completă de ajutor și întrebări frecvente →</a></div>';
    document.body.appendChild(sheet);
    sheet.addEventListener('click',e=>{ if(e.target.closest('[data-hs-close]')) close(); });
  }
  const escH=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function open(btn){
    if(!sheet) build();
    const h=resolve(btn);
    $h('#hsTitle',sheet).textContent='Ajutor: '+h.title;
    const intro=$h('.hs-intro',sheet); intro.textContent=h.intro||''; intro.hidden=!h.intro;
    $h('.hs-list',sheet).innerHTML=h.items.map(i=>'<div class="hs-item"><b>'+escH(i.t)+'</b><span>'+escH(i.d)+'</span></div>').join('');
    lastFocus=document.activeElement;
    sheet.classList.remove('hidden');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ sheet.classList.add('open'); $h('.hs-card',sheet).scrollTop=0; $h('.hs-x',sheet).focus({preventScroll:true}); }));
    document.documentElement.classList.add('hs-lock');
  }
  function close(){
    if(!sheet||sheet.classList.contains('hidden')) return;
    sheet.classList.remove('open'); document.documentElement.classList.remove('hs-lock');
    setTimeout(()=>{ if(!sheet.classList.contains('open')) sheet.classList.add('hidden'); },260);
    if(lastFocus&&lastFocus.focus) try{ lastFocus.focus({preventScroll:true}); }catch{}
  }
  document.addEventListener('click',e=>{ const b=e.target.closest('[data-help-open]'); if(b){ e.preventDefault(); open(b); } });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') close(); });
  window.addEventListener('hashchange',close);

  /* ---- butonul în chenarele paginilor (se reface singur dacă chenarul e redesenat) ---- */
  const BTN='<button type="button" class="help-btn" data-help-open aria-label="Ajutor"><span class="help-q" aria-hidden="true">?</span><span class="help-t">Ajutor</span></button>';
  function ensure(){
    document.querySelectorAll('section.page .page-head, section.page .rv-hero, #page-account .acc-user, .seller-banner').forEach(box=>{
      if(box.querySelector(':scope>.help-btn')) return;
      if(box.classList.contains('page-head') && !box.querySelector(':scope>.back')) return;
      box.insertAdjacentHTML('beforeend',BTN);
    });
  }
  let raf=0; const sched=()=>{ if(raf) return; raf=requestAnimationFrame(()=>{ raf=0; ensure(); }); };
  ensure();
  new MutationObserver(sched).observe(document.body,{childList:true,subtree:true});
})();
