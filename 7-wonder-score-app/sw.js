/* Service Worker for 世界の七不思議 得点計算 (PWA).
   IMPORTANT (GitHub Pages): a service worker only controls pages inside
   its own folder scope, so for the install / offline behaviour to cover
   the app this file must sit NEXT TO index.html (the site root), not
   inside assets/. The page tries to register ./sw.js first and then
   ./assets/sw.js; copy this file to the root alongside index.html when
   publishing, and registration will pick it up automatically.
   Strategy: cache-first for the app shell (index + manifest + icons),
   network falling back to cache for everything else, so a game in
   progress keeps working offline. Bump CACHE_VERSION on each release. */
var CACHE_VERSION = "7wonders-score-v2";
var CORE_ASSETS = [
  "./",
  "./index.html",
  "./assets/manifest.webmanifest",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-180.png",
  "./assets/icon-maskable-512.png"
];
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return cache.addAll(CORE_ASSETS).catch(function () { /* a missing asset must not block install */ });
    }).then(function () { return self.skipWaiting(); })
  );
});
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE_VERSION ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(function (cached) {
      var network = fetch(event.request).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (cache) { cache.put(event.request, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
