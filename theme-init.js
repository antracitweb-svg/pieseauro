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
try{ if(!Array.prototype.flat){ Object.defineProperty(Array.prototype,'flat',{configurable:true,writable:true,value:function(d){ d=d===undefined?1:Number(d); var f=function(a,n){ return a.reduce(function(r,x){ return r.concat(Array.isArray(x)&&n>0?f(x,n-1):x); },[]); }; return f(this,d); }}); } }catch(e){}
