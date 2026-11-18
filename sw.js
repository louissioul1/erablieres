// Service worker : app utilisable hors ligne + tuiles de carte en cache
const V = "erab-v17";
const SHELL = ["./", "./index.html", "./app.js", "./config.js", "./base.js", "./manifest.webmanifest", "./icon.svg"];
const LIBS = /^(https:\/\/unpkg\.com|https:\/\/www\.gstatic\.com\/firebasejs|https:\/\/fonts\.(googleapis|gstatic)\.com)/;
const TILES = /(arcgisonline\.com|tile\.opentopomap\.org|tile\.openstreetmap\.org)/;
const MAX_TILES = 6000;
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("erab-v") && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
async function trim() { const c = await caches.open("erab-tuiles"); const ks = await c.keys(); for (let i = 0; i < ks.length - MAX_TILES; i++) await c.delete(ks[i]); }
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = r.url;
  if (TILES.test(u)) {
    e.respondWith(caches.open("erab-tuiles").then(async c => {
      const hit = await c.match(u); if (hit) return hit;
      try { const res = await fetch(r); if (res.ok || res.type === "opaque") { c.put(u, res.clone()); if (Math.random() < .02) trim(); } return res; }
      catch (err) { return new Response("", { status: 504 }); }
    })); return;
  }
  if (LIBS.test(u)) {
    e.respondWith(caches.open("erab-libs").then(async c => { const hit = await c.match(r); if (hit) return hit; const res = await fetch(r); if (res.ok || res.type === "opaque") c.put(r, res.clone()); return res; })); return;
  }
  if (new URL(u).origin === location.origin) {
    e.respondWith(fetch(r.url, { cache: "no-cache", credentials: "same-origin" }).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r, { ignoreSearch: true }).then(h => h || caches.match("./index.html"))));
  }
});
