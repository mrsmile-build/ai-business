const CACHE = "aibusiness-v1.8.3";
self.addEventListener("install", function (e) { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })
  );
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.indexOf("/api/") === 0) return;
  e.respondWith(
    fetch(req).then(function (res) {
      try { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); } catch (err) {}
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || Response.error(); });
    })
  );
});
