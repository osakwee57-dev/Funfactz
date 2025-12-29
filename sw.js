
const CACHE_NAME = 'funfactz-v5';
const ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/constants.ts',
  '/types.ts',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});

// Handle incoming notification interaction
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const factId = event.notification.data?.factId;
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and redirect
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          return client.focus().then(c => c.navigate(targetUrl));
        }
      }
      // Otherwise open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Listener for system-level re-scheduling if needed
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-alarms') {
    // This could be used for advanced re-syncing if the app is supported
  }
});
