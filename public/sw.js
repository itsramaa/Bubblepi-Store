// ponytail: minimal offline shell — upgrade to next-pwa for full offline support
self.addEventListener("install", (e) => e.waitUntil(
  caches.open("bubblepi-v1").then((c) => c.addAll(["/", "/favicon.ico"]))
))

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
