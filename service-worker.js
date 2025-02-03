const CACHE_NAME = 'smart-design-v1';
const OFFLINE_URL = '/index.html';

const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/index.js',
  '/project-calculator.html',
  '/project-calculator.js',
  '/project-sheets.html',
  '/project-sheets.js',
  '/large-project.html',
  '/large-project.js',
  '/settings.html',
  '/settings.js',
  '/styles.css',
  '/logo.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(CACHE_ASSETS);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // IMPORTANT: Clone the request. A request is a stream and can only be consumed once.
        let fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // IMPORTANT: Clone the response. A response is a stream and can only be consumed once.
          let responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // If both fail, show a generic fallback
        return caches.match(OFFLINE_URL);
      })
  );
});

// Background sync for unsaved data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-projects') {
    event.waitUntil(syncProjects());
  }
});

async function syncProjects() {
  try {
    // Fetch and sync any offline-created projects
    const offlineProjects = JSON.parse(localStorage.getItem('offlineProjects') || '[]');
    
    if (offlineProjects.length > 0) {
      // In a real app, you would send these to a server
      localStorage.removeItem('offlineProjects');
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}