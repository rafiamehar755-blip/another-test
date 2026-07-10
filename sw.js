const CACHE_NAME = 'ahmad-aluminium-v4'; // Incremented version to clear old cached traps

const ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'Ahmad_Aluminium_Logo.png',
  'Signature-Ahmad.png'
];

// Install Event - Force the new service worker to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate Event - Wipe out any old cached files automatically
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network-First for your app files, IGNORE external APIs to bypass CORS
self.addEventListener('fetch', (event) => {
  // ONLY handle requests made to your own website files
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline, fall back to the cache
          return caches.match(event.request);
        })
    );
  }
  // DO NOT call event.respondWith() for Google Sheets, WhatsApp, or other external domains!
  // This allows the browser to handle them natively, bypassing all service worker CORS restrictions.
});
