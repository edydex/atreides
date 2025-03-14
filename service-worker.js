// Minimal service worker that does almost nothing, added purely for passing PWA checkers, and set off less red flags during app verification process.
const CACHE_NAME = "pwa-cache-v1";
const OFFLINE_URL = "/index.html";

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
    );
    self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(OFFLINE_URL))
        );
    }
});
