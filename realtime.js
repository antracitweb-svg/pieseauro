/* AutoParts — timp real prin Server-Sent Events.
   O singură conexiune per tab, doar pentru utilizatorii autentificați.
   Reconectare automată cu backoff exponențial; se oprește la logout sau când tab-ul e ascuns
   mai mult de 5 minute (economie de baterie pe mobil). */
(function(){
  'use strict';

  var ES = window.EventSource;
  if(!ES) return; // browser vechi: site-ul funcționează normal, doar fără live

  var source = null;
  var retry = 0;
  var retryTimer = null;
  var hiddenAt = 0;
  var stopped = true;
  var listeners = { message: [], notification: [], ready: [] };

  function emit(kind, data){
    var list = listeners[kind] || [];
    for(var i = 0; i < list.length; i++){
      try { list[i](data); } catch(e){ /* un handler defect nu trebuie să blocheze restul */ }
    }
  }

  function scheduleRetry(){
    if(stopped) return;
    // 2s, 4s, 8s, 16s, apoi maxim 30s
    var wait = Math.min(30000, 2000 * Math.pow(2, retry));
    retry++;
    clearTimeout(retryTimer);
    retryTimer = setTimeout(connect, wait);
  }

  function connect(){
    if(stopped || source) return;
    try {
      source = new ES('/api/stream', { withCredentials: true });
    } catch(e){ scheduleRetry(); return; }

    source.addEventListener('open', function(){ retry = 0; });
    source.addEventListener('ready', function(){ retry = 0; });

    source.addEventListener('message', function(ev){
      try { emit('message', JSON.parse(ev.data)); } catch(e){}
    });
    source.addEventListener('notification', function(ev){
      try { emit('notification', JSON.parse(ev.data)); } catch(e){}
    });

    source.addEventListener('error', function(){
      // Serverul a închis sau rețeaua a căzut: EventSource reîncearcă singur,
      // dar după un 401/403 rămâne blocat, așa că recreăm conexiunea controlat.
      if(source && source.readyState === ES.CLOSED){
        try { source.close(); } catch(e){}
        source = null;
        scheduleRetry();
      }
    });
  }

  function start(){
    if(!stopped) return;
    stopped = false;
    retry = 0;
    connect();
  }

  function stop(){
    stopped = true;
    clearTimeout(retryTimer);
    if(source){ try { source.close(); } catch(e){} source = null; }
  }

  function on(kind, fn){
    if(!listeners[kind]) listeners[kind] = [];
    listeners[kind].push(fn);
    return function(){ off(kind, fn); };
  }

  function off(kind, fn){
    var list = listeners[kind];
    if(!list) return;
    var i = list.indexOf(fn);
    if(i >= 0) list.splice(i, 1);
  }

  // Pagina ascunsă mult timp: închidem conexiunea; la revenire o redeschidem.
  document.addEventListener('visibilitychange', function(){
    if(document.hidden){
      hiddenAt = Date.now();
      return;
    }
    if(hiddenAt && Date.now() - hiddenAt > 5 * 60 * 1000){
      stop();
      start();
    }
    hiddenAt = 0;
  });

  window.addEventListener('online', function(){ if(stopped === false) return; });

  window.AutoPartsLive = {
    start: start,
    stop: stop,
    on: on,
    off: off,
    isOpen: function(){ return !!source && source.readyState === ES.OPEN; }
  };
})();
