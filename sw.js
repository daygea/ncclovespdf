/* welovepdf service worker — installable + offline app shell.
   Bump CACHE when you change app files so clients pick up the update. */
const CACHE = 'welovepdf-v2';
const SHELL = [
  './', './index.html',
  './css/styles.css', './js/app.js',
  './js/pdf-lib.min.js', './js/pdf.min.js', './js/Sortable.min.js',
  './img/logo.png', './img/icon-192.png', './img/icon-512.png',
  './manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
          .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Same-origin: cache-first (ignore ?v= query), fall back to network then cache.
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then(hit =>
        hit || fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
          return res;
        }).catch(() => caches.match('./index.html'))
      )
    );
  }
  // Cross-origin (CDN scripts): just go to network; nothing to do offline.
});
