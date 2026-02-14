/* Simple PWA service worker
   Cache-first for static assets; network-first for API.
*/

const CACHE = 'tg-mobile-v1';
const STATIC_ASSETS = [
  '/mobile.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE ? caches.delete(k) : null))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first for API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return res;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for other GET
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(hit => hit || fetch(event.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return res;
      }))
    );
  }
});
