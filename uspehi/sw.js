/* Дневник побед работает и без сети: страница из сети, без сети из кэша. */
const VERSION = "uspehi-1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "Vasek.ttf"];
self.addEventListener("install", e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith("uspehi-") && x !== VERSION).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const nav = e.request.mode === "navigate";
  e.respondWith(nav
    ? fetch(e.request, { cache: "no-cache" }).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put("index.html", c)); return r; }).catch(() => caches.match("index.html"))
    : caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(VERSION).then(x => x.put(e.request, c)); } return r; })));
});
