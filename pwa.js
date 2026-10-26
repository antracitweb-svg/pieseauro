/* Înregistrează service worker-ul (PWA). Script separat: CSP permite doar 'self'. */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* offline parțial indisponibil — site-ul merge normal */ });
  });
}
