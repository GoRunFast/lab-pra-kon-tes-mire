/* Service Worker — ReadTodo (offline-first)
 * Strategy:
 *   - Precache app shell + local libraries on install
 *   - Cache-first for same-origin static assets (fast, offline-safe)
 *   - Network-first (fallback to cache) for navigation requests
 *   - Never cache non-GET requests
 * Bump CACHE_VERSION on every release so clients pick up new files.
 */

const CACHE_VERSION = 'readtodo-v4';
const CACHE_NAME = `app-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  './', './index.html', './style.css', './manifest.json',
  './dexie.min.js', './pdf.min.js', './pdf.worker.min.js', './jszip.min.js', './epub.min.js',
  './i18n.js', './ui.js', './db.js', './reader.js', './quiz.js', './app.js',
  './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(
        // Add individually so one bad path doesn't kill the whole install.
        PRECACHE_ASSETS.map((url) => cache.add(url).catch((err) => console.warn('[sw] precache failed:', url, err)))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('app-') && k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Navigation: network-first, fallback to cached shell
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // Same-origin static assets: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (!res || res.status !== 200 || res.type === 'opaque') return res;
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => new Response('', { status: 504, statusText: 'Offline' }));
      })
    );
    return;
  }

  // Cross-origin: network with cache fallback
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))));
  }
});
