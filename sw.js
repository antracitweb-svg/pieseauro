/* Service worker AutoParts — PWA cu funcționare offline parțială.
   Reguli:
   - API-urile (/api/*) NU se cache-uiesc niciodată (date mereu proaspete).
   - Navigarea: network-first, cu fallback la index.html din cache când e offline.
   - Shell static (css/js/iconițe): stale-while-revalidate.
*/
const VERSION = 'autoparts-v45';
const SHELL = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/theme-init.js',
  '/analytics.js',
  '/ajutor.html',
  '/manifest.webmanifest',
  '/assets/icon-192.svg',
  '/assets/icon-512.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // API-urile și tracking-ul nu trec niciodată prin cache
  if (url.pathname.startsWith('/api/')) return;

  // Navigare (pagini): network-first, fallback offline la shell
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          // în shell se păstrează doar pagina reală (nu pagina de verificare 403 / erorile)
          if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put('/index.html', copy)).catch(() => {}); }
          return res;
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  // Resurse statice: stale-while-revalidate
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

/* ===== Web Push ===== */
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  const title = d.title || 'AutoParts';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      // Dacă site-ul e deschis și vizibil, badge-ul din pagină (SSE) e suficient — nu afișăm notificare dublă.
      if (wins.some((c) => c.visibilityState === 'visible')) return;
      return self.registration.showNotification(title, {
        body: d.body || '',
        icon: '/assets/icon-192.svg',
        badge: '/assets/icon-192.svg',
        tag: d.tag || 'autoparts',
        renotify: true,
        data: { url: d.url || '/#/account-tool?view=notifications' }
      });
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const c of wins) {
        if ('focus' in c) { c.navigate(url).catch(() => {}); return c.focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('pushsubscriptionchange', (e) => {
  // Abonamentul s-a reînnoit în browser: pagina îl retrimite la următoarea deschidere (initPushState).
  e.waitUntil(Promise.resolve());
});
