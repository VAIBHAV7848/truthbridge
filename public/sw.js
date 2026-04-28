const CACHE = 'tb-v1';
const OFFLINE_ROUTES = ['/', '/map', '/report', '/truth', '/feed'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(OFFLINE_ROUTES)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
