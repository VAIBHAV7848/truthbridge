const CACHE = 'tb-v2';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg'
];

// Install: cache shell and static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static assets, fallback to index.html for navigation
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Supabase/API requests: network only (don't cache)
  if (url.pathname.includes('/api/') || url.pathname.includes('/supabase/') || url.pathname.includes('/rest/')) {
    return;
  }

  // Static assets (JS, CSS, images, fonts): cache-first with background update
  if (/\.(js|css|png|jpg|jpeg|svg|gif|woff2?|webp)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then(cached => {
        const fetchPromise = fetch(request).then(networkRes => {
          if (networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE).then(c => c.put(request, clone));
          }
          return networkRes;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Navigation requests (HTML pages): network-first, fallback to cached index.html
  if (request.mode === 'navigate' || request.destination === 'document') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/') || caches.match('/index.html'))
    );
    return;
  }

  // Everything else: network-first
  e.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
