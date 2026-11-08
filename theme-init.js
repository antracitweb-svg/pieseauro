/* Aplică tema salvată ÎNAINTE de randare, ca să nu apară „flash” de fundal alb.
   Fișier extern (nu inline) pentru a respecta Content-Security-Policy: script-src 'self'. */
try{ if(localStorage.getItem('theme')==='dark') document.documentElement.classList.add('dark'); }catch(e){}
/* Aspectul ales pentru anunțuri (grilă / listă), separat pe pagini, aplicat înainte de randare ca să nu apară un „salt”.
   Acasă: implicit grilă. „Vezi toate” și „Autoturisme avariate”: implicit listă. */
try{
  var __h=location.hash||'', __id='homeFeed', __d='grid';
  if(/^#\/rezultate/.test(__h)){ __id='listingGrid'; __d='list'; }
  else if(/^#\/avariate/.test(__h)){ __id='avarGrid'; __d='list'; }
  else if(/^#\/(?!home|$)/.test(__h)){ __id=''; }
  if(__id){ var __v=localStorage.getItem('autopiese_view_'+__id); document.documentElement.setAttribute('data-view',(__v==='grid'||__v==='list')?__v:__d); }
}catch(e){}

/* Mod diagnostic pentru dispozitive greu de depanat (ex. televizoare): deschide site-ul cu ?debug=1
   Afișează jos pe ecran browserul, dimensiunea, erorile JavaScript și starea cererilor către server.
   Scris în ES5 (fără sintaxă nouă), ca să ruleze și pe browsere vechi. Nu face nimic fără ?debug=1. */
try{
  if(/[?&]debug=1(&|$|#)/.test(location.search)){
    var __dbgLines=[], __dbgEl=null;
    var __dbgDraw=function(){
      try{
        if(!__dbgEl){
          if(!document.body)return;
          __dbgEl=document.createElement('pre');
          __dbgEl.style.cssText='position:fixed;left:0;right:0;bottom:0;max-height:45%;overflow:auto;margin:0;padding:8px 10px;background:#000;color:#0f0;font:14px/1.35 monospace;z-index:2147483647;white-space:pre-wrap;word-break:break-all';
          document.body.appendChild(__dbgEl);
        }
        __dbgEl.textContent=__dbgLines.join('\n');
      }catch(e){}
    };
    var __dbg=function(t){__dbgLines.push(t);if(__dbgLines.length>40)__dbgLines.shift();__dbgDraw();};
    window.addEventListener('error',function(e){__dbg('EROARE JS: '+(e&&e.message)+' @ '+(e&&e.filename?String(e.filename).split('/').pop():'')+':'+(e&&e.lineno));});
    window.addEventListener('unhandledrejection',function(e){var r=e&&e.reason;__dbg('PROMISE: '+(r&&r.message?r.message:r));});
    document.addEventListener('DOMContentLoaded',function(){
      __dbg('UA: '+navigator.userAgent);
      __dbg('Ecran: '+window.innerWidth+'x'+window.innerHeight+' dpr='+window.devicePixelRatio+' | subtle='+(!!(window.crypto&&window.crypto.subtle))+' | cookie='+(navigator.cookieEnabled));
      var test=function(url){
        var t0=new Date().getTime();
        try{
          fetch(url,{credentials:'same-origin'}).then(function(r){
            return r.text().then(function(tx){__dbg(url+' -> '+r.status+' ('+(new Date().getTime()-t0)+' ms, '+tx.length+' B)'+(r.ok?'':' '+tx.slice(0,80)));});
          })['catch'](function(e){__dbg(url+' -> EȘEC rețea: '+(e&&e.message));});
        }catch(e){__dbg(url+' -> fetch indisponibil: '+(e&&e.message));}
      };
      test('/api/health');
      test('/api/listings?limit=3&offset=0');
      setTimeout(function(){
        var imgs=document.querySelectorAll('img'),ok=0,bad=0,i;
        for(i=0;i<imgs.length;i++){if(imgs[i].complete&&imgs[i].naturalWidth>0)ok++;else bad++;}
        __dbg('Imagini: '+imgs.length+' total, '+ok+' încărcate, '+bad+' neîncărcate | carduri: '+document.querySelectorAll('.ar-row').length);
        if(imgs[0])__dbg('Prima imagine: '+(imgs[0].currentSrc||imgs[0].src||'').slice(0,120));
      },8000);
    });
  }
}catch(e){}

/* Compatibilitate browsere vechi (TV): Array.prototype.flat lipsește sub Chrome 69 */
try{ if(!Array.prototype.flat){ Object.defineProperty(Array.prototype,'flat',{configurable:true,writable:true,value:function(d){ d=d===undefined?1:Number(d); var fl=function(a,n){ var out=[],i,x; for(i=0;i<a.length;i++){ if(!(i in a)) continue; x=a[i]; if(Array.isArray(x)&&n>0){ out.push.apply(out,fl(x,n-1)); } else { out.push(x); } } return out; }; return fl(this,d); }}); } }catch(e){}

/* Efectul „liquid glass” rămâne activ peste tot. Dacă pe un dispozitiv e prea greu, ?glass=0 îl oprește (se reține în localStorage), ?glass=1 îl repornește. */
try{
  var __gm=/[?&]glass=([01])(&|$|#)/.exec(location.search);
  if(__gm){ try{ localStorage.setItem('glass',__gm[1]); }catch(e){} }
  var __gp=null; try{ __gp=localStorage.getItem('glass'); }catch(e){}
  if(__gp==='0') document.documentElement.classList.add('no-glass');
}catch(e){}

/* Detectează browserele fără „gap” pe flexbox (Chromium < 84, ex. unele televizoare) și pune clasa no-flex-gap, folosită de CSS pentru alternative cu margini. */
try{
  var __fg=document.createElement('div');
  __fg.style.cssText='display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden;left:-9999px';
  var __a=document.createElement('div'),__b=document.createElement('div');
  __a.style.height='1px'; __b.style.height='1px'; __fg.appendChild(__a); __fg.appendChild(__b);
  document.documentElement.appendChild(__fg);
  var __okgap=(__fg.scrollHeight===3);
  document.documentElement.removeChild(__fg);
  if(!__okgap) document.documentElement.classList.add('no-flex-gap');
}catch(e){}

/* Compatibilitate browsere vechi (ex. televizor cu Chromium < 69): funcții JavaScript lipsă.
   Fără ele apăreau erori de tip „flatMap is not a function” și paginile rămâneau goale. */
try{
  if(!Array.prototype.flatMap){
    Object.defineProperty(Array.prototype,'flatMap',{configurable:true,writable:true,value:function(cb,thisArg){
      var out=[],i,r; for(i=0;i<this.length;i++){ if(!(i in this)) continue; r=cb.call(thisArg,this[i],i,this); if(Array.isArray(r)){ out.push.apply(out,r); } else { out.push(r); } } return out; }});
  }
  if(!Object.fromEntries){
    Object.fromEntries=function(it){ var o={},e,i; var arr=Array.isArray(it)?it:Array.prototype.slice.call(it); for(i=0;i<arr.length;i++){ e=arr[i]; o[e[0]]=e[1]; } return o; };
  }
  if(!String.prototype.trimStart){ String.prototype.trimStart=function(){ return this.replace(/^\s+/,''); }; }
  if(!String.prototype.trimEnd){ String.prototype.trimEnd=function(){ return this.replace(/\s+$/,''); }; }
  if(typeof Promise!=='undefined'){
    if(!Promise.prototype['finally']){
      Promise.prototype['finally']=function(f){ var P=this.constructor||Promise; return this.then(function(v){ return P.resolve(f()).then(function(){ return v; }); },function(e){ return P.resolve(f()).then(function(){ throw e; }); }); };
    }
    if(!Promise.allSettled){
      Promise.allSettled=function(list){ var arr=Array.prototype.slice.call(list); return Promise.all(arr.map(function(p){ return Promise.resolve(p).then(function(v){ return {status:'fulfilled',value:v}; },function(r){ return {status:'rejected',reason:r}; }); })); };
    }
  }
}catch(e){}
