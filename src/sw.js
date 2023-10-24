async function cacheResources(resources) {
  const cache = await caches.open('v1');
  console.debug('Caching Resources', resources);
  await cache.addAll(resources);
}

async function serveFromCache(request) {
  const response = fetch('http://neewer-controller-9c58d8.local/');
  const cachedResponse = await caches.match(request);
  console.debug('Looking for request in cache', request);
  if (cachedResponse) {
    console.debug('Found in cache', request, cachedResponse);
    return cachedResponse;
  }

  console.debug('Forwarding request', request);
  return await fetch(request);
}

async function fetchManifest() {
  const response = await fetch('/manifest.json');
  return await response.json();
}

async function cacheManifestResources() {
  if (import.meta.env.DEV) {
    return Promise.resolve();
  }
  const manifest = await fetchManifest();
  const resources = Object.values(manifest).filter(v => v !== 'sw.js').map(v => `/${v}`);
  return await cacheResources(resources);
}

self.addEventListener("install", event => {
  console.debug('Worker installed');
  event.waitUntil(Promise.all([cacheManifestResources(), cacheResources([
    '/index.html',
    '/icons/256.png',
  ])]));
});

self.addEventListener('activate', event => {
  console.debug('Worker activated');
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  console.debug('Worker fetch', request);
  // Avoid handling CORS requests to ESP32
  if (request.mode == 'cors' && !request.url.startsWith(location.origin)) {
    console.debug('Skipping CORS request', request);
    return;
  }
  return event.respondWith(serveFromCache(event.request));
});
