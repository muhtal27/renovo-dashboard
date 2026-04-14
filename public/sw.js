// Renovo AI — Service Worker v4
// Strategies: precache shell, network-first HTML, stale-while-revalidate assets
// Cache is versioned per deploy — old caches are deleted on activate.

const CACHE_VERSION = 'mnyeqc7n'
const CACHE_NAME = `renovo-v4-${CACHE_VERSION}`
const OFFLINE_URL = '/offline'

// Critical shell assets to precache on install
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/renovo-ai-icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// ── Install: precache critical assets ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ── Activate: clean old caches, take control ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch: smart routing by request type ──
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET, cross-origin, API, and auth requests
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/login')
  ) {
    return
  }

  // HTML navigation → network-first, fall back to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    )
    return
  }

  // Next.js hashed static assets → network-first (ensures fresh code on deploy)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Other static assets (images, fonts) → stale-while-revalidate
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
            }
            return response
          })
          .catch(() => cached)

        return cached || networkFetch
      })
    )
    return
  }

  // Everything else → network only, silent fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})

// ── Notify clients when a new version is available ──
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

function isStaticAsset(pathname) {
  return /\.(?:js|css|png|jpg|jpeg|svg|webp|avif|ico|woff2?|ttf|eot)$/i.test(pathname)
}
