/* Aplică tema salvată ÎNAINTE de randare, ca să nu apară „flash” de fundal alb.
   Fișier extern (nu inline) pentru a respecta Content-Security-Policy: script-src 'self'. */
try{ if(localStorage.getItem('theme')==='dark') document.documentElement.classList.add('dark'); }catch(e){}
