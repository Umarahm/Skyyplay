const CACHE_NAME = 'skyyplay-v1'
const urlsToCache = [
    '/',
    '/search',
    '/livesports',
    '/settings',
    '/manifest.json',
    '/logo.avif',
    '/placeholder-logo.png'
]

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache')
                return cache.addAll(urlsToCache)
            })
    )
})

// Fetch event
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return
    }

    // Skip Chrome extensions
    if (event.request.url.startsWith('chrome-extension://')) {
        return
    }

    // Skip TMDB API calls (we want fresh data)
    if (event.request.url.includes('api.themoviedb.org')) {
        return
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request)
            })
            .catch(() => {
                // Return a fallback page if both cache and network fail
                if (event.request.destination === 'document') {
                    return caches.match('/')
                }
            })
    )
})

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName)
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )
}) 