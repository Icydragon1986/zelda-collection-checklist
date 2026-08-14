const CACHE_NAME = "triforce-checklist-pwa-v2";
const APP_ROOT = new URL("./", self.registration.scope).toString();
const APP_SHELL = [
  APP_ROOT,
  new URL("manifest.webmanifest", APP_ROOT).toString(),
  new URL("triforce-checklist-logo.png", APP_ROOT).toString(),
  new URL("pwa-192.png", APP_ROOT).toString(),
  new URL("pwa-512.png", APP_ROOT).toString(),
  new URL("pwa-maskable-512.png", APP_ROOT).toString()
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(APP_ROOT, copy));
        return response;
      })
      .catch(() => caches.match(APP_ROOT)));
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    }
    return response;
  })));
});
