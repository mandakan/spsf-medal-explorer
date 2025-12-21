const VERSION = 'v1.0.1'
const BASE = new URL(self.registration.scope).pathname
const STATIC_CACHE = `static-cache-${VERSION}`
const API_CACHE = `api-cache-${VERSION}`

const PRECACHE = [
  BASE,
  `${BASE}manifest.json`,
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => ![STATIC_CACHE, API_CACHE].includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request

  // SPA navigations: network-first with cached index fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(BASE))
    )
    return
  }

  // Images: cache-first
  if (req.destination === 'image') {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    )
    return
  }

  // API: network-first with cache write-through
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
  event.respondWith(fetch(req).catch(() => caches.match(req)))
})
