
const CACHE_NAME = 'funfactz-v8';
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

// Timer Map to keep track of active background alarms
const activeTimers = new Map();

// Listen for messages from the main app thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_ALARM') {
    const { fact, delayMs, id, url, category } = event.data;
    
    // Clear any existing timer for this specific alarm ID
    if (activeTimers.has(id)) {
      clearTimeout(activeTimers.get(id));
    }

    // Use event.waitUntil to extend the Service Worker's life
    event.waitUntil(new Promise((resolve) => {
      const timerId = setTimeout(async () => {
        try {
          await self.registration.showNotification(`FunFact: ${category} 💡`, {
            body: fact,
            tag: `funfact-alarm-${id}`,
            icon: 'https://ui-avatars.com/api/?name=F+F&background=10b981&color=fff&size=128',
            badge: 'https://ui-avatars.com/api/?name=FF&background=10b981&color=fff&size=96',
            data: { url },
            requireInteraction: true,
            vibrate: [200, 100, 200]
          });
        } catch (err) {
          console.error('Failed to show background notification:', err);
        }
        activeTimers.delete(id);
        resolve();
      }, delayMs);
      
      activeTimers.set(id, timerId);
    }));
  }
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
