
const CACHE_NAME = 'funfactz-v7';
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

// Handle notification tap (The "WhatsApp" style tap-to-open)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Try to find an existing window of the app and focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then((focusedClient) => {
            // Navigate the focused client to the deep link
            return focusedClient.navigate(targetUrl);
          });
        }
      }
      // 2. If no window is open, open a new one with the deep link
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Reschedule in background if system supports it
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-alarms') {
    // This allows the app to refresh schedules in the background periodically
  }
});
