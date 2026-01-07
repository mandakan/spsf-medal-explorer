const VERSION = 'build-75'
const BASE = new URL(self.registration.scope).pathname
const SCOPE_KEY = (BASE.replace(/^\/|\/$/g, '').replace(/[^\w-]/g, '_')) || 'root'
const STATIC_CACHE = `static-cache-${SCOPE_KEY}-${VERSION}`
const API_CACHE = `api-cache-${SCOPE_KEY}-${VERSION}`

const PRECACHE = [
  BASE,
  `${BASE}manifest.json`,
  `${BASE}favicon.ico`,
  `${BASE}icon-192.png`,
  `${BASE}icon-512.png`,
]

 // Warm static cache using Vite's asset manifest (cache per-URL, non-atomic)
async function warmFromViteManifest(cache) {
  try {
    const res = await fetch(`${BASE}asset-manifest.json`, { cache: 'no-cache' })
    if (!res.ok) return
    const manifest = await res.json()
    const urls = new Set()

    const addByKey = (key) => {
      const e = manifest[key]
      if (!e) return
      if (e.file) urls.add(`${BASE}${e.file}`)
      if (Array.isArray(e.css)) e.css.forEach((u) => urls.add(`${BASE}${u}`))
      if (Array.isArray(e.assets)) e.assets.forEach((u) => urls.add(`${BASE}${u}`))
      if (Array.isArray(e.imports)) e.imports.forEach(addByKey)
      if (Array.isArray(e.dynamicImports)) e.dynamicImports.forEach(addByKey)
    }

    if (manifest['index.html']) {
      addByKey('index.html')
    } else {
      Object.keys(manifest).forEach((k) => {
        const e = manifest[k]
        if (e && e.isEntry) addByKey(k)
      })
    }

    for (const url of urls) {
      try {
        const r = await fetch(url, { cache: 'no-cache' })
        if (r.ok) await cache.put(url, r.clone())
      } catch {
        // skip individual failures
      }
    }
  } catch {
    // no manifest available
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      await cache.addAll(PRECACHE)
      await warmFromViteManifest(cache)
      await self.skipWaiting()
    })()
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
    event.respondWith(fetch(req).catch(() => caches.match(BASE, { ignoreVary: true })))
    return
  }

  // Static assets: cache-first for same-origin JS/CSS/Fonts/Images
  const isSameOrigin = new URL(req.url).origin === self.location.origin
  if (isSameOrigin && ['script', 'style', 'font', 'image'].includes(req.destination)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req, { ignoreVary: true })
        if (cached) return cached
        try {
          const res = await fetch(req)
          const copy = res.clone()
          const cache = await caches.open(STATIC_CACHE)
          cache.put(req, copy)
          return res
        } catch {
          // No cache and offline
          return cached || Response.error()
        }
      })()
    )
    return
  }

  // API: network-first with cache write-through
  if (req.url.includes('/api/')) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req)
          const copy = res.clone()
          const cache = await caches.open(API_CACHE)
          cache.put(req, copy)
          return res
        } catch {
          const cached = await caches.match(req, { ignoreVary: true })
          if (cached) return cached
          return new Response('Offline', { status: 503, statusText: 'Offline' })
        }
      })()
    )
    return
  }

  // Default: network-first with offline fallback
  event.respondWith(fetch(req).catch(() => caches.match(req, { ignoreVary: true })))
})
