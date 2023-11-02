async function cacheResources(resources) {
  const cache = await caches.open('v1');
  console.debug('SW: Caching Resources', resources);
  await cache.addAll(resources);
}

async function tryPrivate() {
  const response = fetch('http://neewer-controller-9c58d8.local/', { targetAddressSpace: 'private' });
  console.log('SW: Trying local fetch', response);
}

async function serveFromCache(request) {
  const cachedResponse = await caches.match(request);
  console.debug('Looking for request in cache', request);
  if (cachedResponse) {
    console.debug('Found in cache', request, cachedResponse);
    return cachedResponse;
  }

  console.debug('SW: Forward request', request);
  return await fetch(request);
}

async function fetchManifest() {
  const response = await fetch('/manifest.json');
  return await response.json();
}

async function cacheManifestResources() {
  if (import.meta.env.DEV) {
    console.log('SW: Skipping precaching resources in DEV');
    return Promise.resolve();
  }
  const manifest = await fetchManifest();
  const resources = Object.values(manifest).filter(v => v !== 'sw.js').map(v => `/${v}`);
  return await cacheResources(resources);
}

self.addEventListener("install", event => {
  console.debug('SW: installed');
  event.waitUntil(Promise.all([cacheManifestResources(), cacheResources([
    '/index.html',
    '/icons/256.png',
  ])]));
});

self.addEventListener('activate', event => {
  console.debug('SW: activated');
  tryPrivate();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  console.debug('SW: fetch', request);
  // Avoid handling CORS requests to ESP32
  if (request.mode == 'cors' && !request.url.startsWith(location.origin)) {
    console.debug('SW: Skipping CORS request', request);
    return false;
  }
  return event.respondWith(serveFromCache(event.request));
});
