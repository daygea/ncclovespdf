/* welovepdf service worker — network-first for app code so new deploys are
   picked up immediately; cache-first for heavy libs/icons; offline fallback. */
const CACHE = 'welovepdf-v12';
const SHELL = [
  './', './index.html',
  './css/styles.css', './js/app.js',
  './js/pdf-lib.min.js', './js/pdf.min.js', './js/Sortable.min.js',
  './img/logo.png', './img/icon-192.png', './img/icon-512.png',
  './manifest.webmanifest'
];
// App-owned files that change on every deploy -> always try the network first.
const APP = /\/(?:app\.js|styles\.css|index\.html|manifest\.webmanifest)$|\/$/;

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
  if (url.origin !== self.location.origin) return; // CDN -> straight to network

  const networkFirst = req.mode === 'navigate' || APP.test(url.pathname);
  if (networkFirst) {
    // fresh deploys win; fall back to cache only when offline
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then(h => h || caches.match('./index.html')))
    );
  } else {
    // heavy immutable assets (libs, icons): cache-first
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then(h =>
        h || fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
      )
    );
  }
});
