// Testează fulfillCheckoutSession (creditarea plăților Stripe) fără server/Postgres real: extrage funcția din server.js și o rulează cu un „pool” simulat.
const test=require('node:test'),assert=require('node:assert');
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
const a=src.indexOf('async function fulfillCheckoutSession'),b=src.indexOf('// Webhook Stripe',a);
assert.ok(a>0&&b>a,'fulfillCheckoutSession nu a fost găsită în server.js');
const body=src.slice(a,b);

function makeEnv(){
  const state={payments:new Map(),credits:{7:0},notified:[],log:[]};
  // „pool” simulat: INSERT ON CONFLICT DO NOTHING RETURNING id (UNIQUE pe session_id), UPDATE credite, tranzacții ignorate
  const client={async query(sql,params){
    if(/^INSERT INTO payments/.test(sql)){ const sid=params[1]; await new Promise(r=>setTimeout(r,5)); if(state.payments.has(sid))return{rowCount:0,rows:[]}; state.payments.set(sid,params); return{rowCount:1,rows:[{id:state.payments.size}]}; }
    return{rowCount:0,rows:[]};
  },release(){}};
  const pool={connect:async()=>client};
  const creditMove=async(db,uid,amount)=>{state.credits[uid]=(state.credits[uid]||0)+amount;return state.credits[uid];};
  const notify=(uid,t)=>state.notified.push([uid,t]);
  const CREDIT_PACKS={s:{credits:50,lei:25,label:'50 credite'},m:{credits:120,lei:50,label:'120 credite'}};
  const fn=new Function('pool','creditMove','notify','CREDIT_PACKS','console',body+'\nreturn fulfillCheckoutSession;')(pool,creditMove,notify,CREDIT_PACKS,{error(){}});
  return{state,fn};
}
const sess=(o={})=>({id:'cs_test_1',payment_status:'paid',client_reference_id:'7',currency:'ron',amount_total:2500,metadata:{pack:'s'},...o});

test('plata plătită adaugă creditele o singură dată',async()=>{
  const {state,fn}=makeEnv();
  assert.equal(await fn(sess()),'added');
  assert.equal(state.credits[7],50);
  assert.equal(state.notified.length,1);
});
test('două cereri simultane pentru aceeași plată nu dublează creditele',async()=>{
  const {state,fn}=makeEnv();
  const r=await Promise.all([fn(sess()),fn(sess()),fn(sess())]);
  assert.deepEqual(r.slice().sort(),['added','duplicate','duplicate']);
  assert.equal(state.credits[7],50);
  assert.equal(state.notified.length,1);
});
test('a doua apelare (ex. webhook după pagina de succes) este duplicat',async()=>{
  const {state,fn}=makeEnv();
  await fn(sess()); assert.equal(await fn(sess()),'duplicate'); assert.equal(state.credits[7],50);
});
test('sesiune neplătită, sumă greșită sau monedă greșită sunt ignorate',async()=>{
  const {state,fn}=makeEnv();
  assert.equal(await fn(sess({payment_status:'unpaid'})),'ignored');
  assert.equal(await fn(sess({amount_total:100})),'ignored');
  assert.equal(await fn(sess({currency:'eur'})),'ignored');
  assert.equal(await fn(sess({metadata:{pack:'xx'}})),'ignored');
  assert.equal(await fn(sess({client_reference_id:'abc'})),'ignored');
  assert.equal(state.credits[7],0);
});
