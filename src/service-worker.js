const VERSION = 'v1.0.0'
const STATIC_CACHE = `static-cache-${VERSION}`
const API_CACHE = `api-cache-${VERSION}`

const PRECACHE = [
  '/',              // may be redirected by dev server
  '/manifest.json', // manifest
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, API_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request

  // Images: cache-first
  if (req.destination === 'image') {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    )
    return
  }

  // API: network-first
  if (req.url.includes('/api/')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(API_CACHE).then((cache) => cache.put(req, copy))
          return res
        })
        .catch(() => caches.match(req))
    )
    return
  }

  // Default: network-first with offline fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  )
})
