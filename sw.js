/* Service worker AutoParts — PWA cu funcționare offline parțială.
   Reguli:
   - API-urile (/api/*) NU se cache-uiesc niciodată (date mereu proaspete).
   - Navigarea: network-first, cu fallback la index.html din cache când e offline.
   - Shell static (css/js/iconițe): stale-while-revalidate.
*/
const VERSION = 'autoparts-v7';
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
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put('/index.html', copy)).catch(() => {});
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
