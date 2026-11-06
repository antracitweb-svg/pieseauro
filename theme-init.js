/* Aplică tema salvată ÎNAINTE de randare, ca să nu apară „flash” de fundal alb.
   Fișier extern (nu inline) pentru a respecta Content-Security-Policy: script-src 'self'. */
try{ if(localStorage.getItem('theme')==='dark') document.documentElement.classList.add('dark'); }catch(e){}
/* Aspectul ales pentru anunțuri (grilă / listă), aplicat înainte de randare ca să nu apară un „salt”. */
try{ var __v=localStorage.getItem('autopiese_view'); if(__v==='grid'||__v==='list') document.documentElement.setAttribute('data-view',__v); }catch(e){}
