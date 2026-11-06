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
