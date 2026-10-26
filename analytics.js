/* Analytics intern — trimite evenimente către /api/track (fără scripturi externe, respectă CSP).
   Serverul le înaintează către Plausible doar dacă PLAUSIBLE_DOMAIN e configurat;
   altfel sunt ignorate silențios. Nu trimite date personale. */
(function(){
  const seen=new Set();
  function track(name,props){
    try{
      if(!name||typeof name!=='string')return;
      if(navigator.doNotTrack==='1'||window.doNotTrack==='1')return;
      const key=name+'|'+(props?JSON.stringify(props):'');
      if(seen.has(key))return;            // un eveniment per sesiune de pagină
      seen.add(key);
      const body={n:name,u:location.pathname+location.hash};
      if(props)body.r=JSON.stringify(props).slice(0,300);
      const data=JSON.stringify(body);
      if(navigator.sendBeacon){
        navigator.sendBeacon('/api/track',new Blob([data],{type:'application/json'}));
      }else{
        fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:data,keepalive:true}).catch(()=>{});
      }
    }catch(e){/* analytics nu are voie să strice UI-ul */}
  }
  window.track=track;
  // eveniment de bază: vizualizare pagină la fiecare schimbare de rută
  let last='';
  function pageview(){
    const p=location.pathname+location.hash;
    if(p===last)return;
    last=p;
    track('pageview');
  }
  window.addEventListener('hashchange',pageview);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',pageview);
  else pageview();
})();
