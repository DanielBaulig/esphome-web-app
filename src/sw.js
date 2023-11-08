async function cacheResources(resources) {
  const cache = await caches.open('v1');
  await cache.addAll(resources);
}

async function fetchFromCacheFirst(request) {
  const cachedResponse = await fetchFromCache(request);
  if (cachedResponse) {
    console.log('cache hit', cachedResponse);
    return cachedResponse;
  }

  return await fetchFromNetworkAndCache(request);
}

async function fetchFromNetworkFirst(request) {
  try {
    return fetchFromNetworkAndCache(request);
  } catch(e) {
    return fetchFromCache(request);
  }
}

async function fetchFromNetwork(request) {
  return fetch(request);
}

async function fetchFromNetworkAndCache(request) {
  const response = await fetchFromNetwork(request);
  if (response.ok) {
    const cache = await caches.open('v1');
    cache.put(request, response.clone());
    return response;
  }
  return response;
}

async function fetchFromCache(request) {
  return caches.match(request);
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
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  console.debug('SW: fetch', request);
  // Avoid handling CORS requests to ESP32
  if (request.mode == 'cors' && !request.url.startsWith(location.origin)) {
    console.debug('SW: Skipping CORS request', request);
    return false;
  }
  // Avoid handling chrome-extension requests
  if (request.url.startsWith('chrome-extension')) {
    console.debug('SW: Skipping chrome-extension request', request);
    return false;
  }
  return event.respondWith(fetchFromCacheFirst(event.request));
});
