// Service worker basique de TopSoum (docs/PROJET.md 5.4 : PWA installable,
// cache offline partiel). Ecrit a la main, sans lib : trois caches versionnes.
//
// - Assets Next (/_next/static, hashes donc immuables) : cache d'abord.
// - Pages publiques (/, /search, /product/...) et API produits : reseau
//   d'abord, cache en secours -> les produits deja consultes restent visibles
//   hors ligne (la banniere "Connexion perdue" signale que les prix peuvent
//   etre anciens).
// - Jamais mis en cache : auth, favoris, admin, clics (donnees personnelles
//   ou actions), et tout ce qui n'est pas un GET same-origin.
//
// Changer CACHE_VERSION a chaque modification de ce fichier : les anciens
// caches sont supprimes a l'activation.

const CACHE_VERSION = "v1";
const STATIC_CACHE = `topsoum-static-${CACHE_VERSION}`;
const PAGES_CACHE = `topsoum-pages-${CACHE_VERSION}`;
const API_CACHE = `topsoum-api-${CACHE_VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE, API_CACHE];

// HTML statique sans JS (voir public/offline.html pour la raison).
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/manifest.json", "/icon.svg"];

/** Bornes des caches reseau-d'abord (les plus anciennes entrees sont supprimees). */
const MAX_PAGES = 30;
const MAX_API_RESPONSES = 50;

const NEVER_CACHED_PREFIXES = ["/api/auth", "/api/favorites", "/api/admin", "/api/offers", "/admin", "/favorites"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => !CURRENT_CACHES.includes(name)).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (NEVER_CACHED_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return;

  if (url.pathname.startsWith("/_next/static/") || PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname.startsWith("/api/products/")) {
    event.respondWith(networkFirst(request, API_CACHE, MAX_API_RESPONSES));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, PAGES_CACHE, MAX_PAGES).catch(async () => (await caches.match(OFFLINE_URL)) ?? Response.error()),
    );
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      await trimCache(cache, maxEntries);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - maxEntries)).map((key) => cache.delete(key)));
}
