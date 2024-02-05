async function cacheResources(resources) {
  const cache = await caches.open('v1');
  await cache.addAll(resources);
}

async function cacheResource(key, resource) {
  const cache = await caches.open('v1');
  return cache.put(key, resource);
}

async function fetchFromCacheFirst(request) {
  const cachedResponse = await fetchFromCache(request);
  // Skip serving the cache response in DEV
  if (cachedResponse && !import.meta.env.DEV) {
    return cachedResponse;
  }

  return await fetchFromNetwork(request);
}

async function fetchFromNetworkFirstAndUpdateCache(request) {
  try {
    return await fetchFromNetworkAndUpdateCache(request);
  } catch(e) {
    return await fetchFromCache(request);
  }
}

async function fetchFromNetworkFirst(request) {
  try {
    return await fetchFromNetwork(request);
  } catch(e) {
    return await fetchFromCache(request);
  }
}

async function fetchFromNetwork(request) {
  return fetch(request);
}

async function fetchFromNetworkAndUpdateCache(request) {
  const response = await fetchFromNetwork(request);
  if (response.ok) {
    const cache = await caches.open('v1');
    cache.put(request, response.clone());
    return response;
  }
  return response;
}

async function fetchFromCache(request) {
  if (request.url.endsWith('/sw.js')) {
    // Never serve sw.js from cache to avoid locking ourselves 
    // into a SW version
    return Promise.reject();
  }
  return caches.match(request);
}

const pluginManifest = {
  url: '/manifest.json',
  buildResourceList: (json) => {
    const resources = Object.values(json).filter(v => v !== 'sw.js').map(v => `/${v}`);
    return resources;
  },
}

const viteManifest = {
  url: '/vite-manifest.json',
  buildResourceList: (json) => {
    const resources = Object.values(json).filter(v => v !== 'sw.js').map(v => `/${v}`);
  },
}

async function cacheManifestResources(resourceManifest) {
  const { isCacheCurrent, updateCache } = await fetchResourceManifest(resourceManifest);
  if (isCacheCurrent) {
    console.debug('No changes in resource manifest. Skipping update.');
    return;
  }
  return await updateCache();
}

function isResourceEqual(first, second) {
  const firstEtag = first?.headers?.get('Etag');
  const secondEtag = second?.headers?.get('Etag');

  return !!firstEtag && firstEtag === secondEtag;
}

async function fetchResourceManifest(resourceManifest) {
  if (import.meta.env.DEV) {
    // We don't have a resource manifest in DEV
    // See https://github.com/DanielBaulig/esphome-web-app/issues/2
    return { isCacheCurrent: true, updateCache: async () => {} };
  }
  try {
    const [manifest, cachedManifest] = await Promise.all([
      fetch(resourceManifest.url, {cache: 'no-cache'}),
      caches.match(resourceManifest.url),
    ]);
    const isCacheCurrent = isResourceEqual(manifest, cachedManifest);

    const updateCache = async () => {
      const json = await manifest.clone().json();
      const resources = resourceManifest.buildResourceList(json);

      const [cache,] = await Promise.all([
        caches.open('v1'),
        cacheResources(resources)
      ]);
      cache.put(resourceManifest.url, manifest);
    }

    return { isCacheCurrent: isCacheCurrent, updateCache: updateCache };
  } catch(e) {
    // Network requests failed, we may be offline
    return { 
      isCacheCurrent: true, 
      updateCache: async () => {},
    };
  }
}

async function cacheAppResources() {
  console.debug('Updating app cache');
  return Promise.all([cacheManifestResources(pluginManifest), cacheResources([
    '/',
    '/icons/192.png',
    '/icons/256.png',
  ])]);
}

self.addEventListener("install", event => {
  event.waitUntil(cacheAppResources());
});

self.addEventListener('activate', event => {
  return self.clients.claim();
});

// See https://github.com/DanielBaulig/esphome-web-app/issues/1
// self.addEventListener('sync', (event) => {
//   console.log('SW: sync event')
//   if (event.tag === 'update-app-cache') {
//     console.log('SW: update-app-cache');
//     event.waitUntil(async () => {
//       const [updated,] = await cacheAppResources();
//       if (!updated) {
//         console.log('SW: app-cache is up to date');
//         return;
//       }
//       console.log('SW: app-cache was updated');
//       const clients = await clients.matchAll();
//       clients.forEach(client => client.postMessage({type: 'app-update'}));
//     });
//   }
// });

async function postMessage(clientId, message) {
  const client = await clients.get(clientId);
  client.postMessage(message);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Avoid handling requests not going to origin
  if (!request.url.startsWith(location.origin)) {
    console.debug('Bypassing request to different origin', request);

    // If we see a PNA request in the ServiceWorker, then the request
    // was not blocked by the mixed content policy.
    // This holds true at least currently in Chrome, which is the only
    // browser implementing PNA confirmation dialogs anyway.
    if (request.targetAddressSpace === 'private') {
      postMessage(event.clientId, 'pna_confirm');
    }

    return false;
  }
  
  if (request.mode === 'navigate') {
    console.log('Navigate request');
    // We want to make sure we update the app resource cache if 
    // we get a main resource navigation (i.e. we are loading the app)..
    const createNavigateResponse = async () => {
      const [response, {isCacheCurrent, updateCache}] = await Promise.all([
        // Fetch the main resource from the network and update the cache with it
        // Fallback to loading from cache
        fetchFromNetworkFirstAndUpdateCache(request),
        // At the same time try loading the resource manifest
        // If the local cache is not up to date with the resource 
        // manifest, we can re-cache the entire application before
        // continuing.
        fetchResourceManifest(pluginManifest)
      ]);

      if (!isCacheCurrent) {
        // Re-cache all resources if the resource manifest has changed
        // NOTE: Recaching the entire application may be slow on slower
        // connections, making the initial navigation to the app slow.
        // We can optimize this down the line. For now it's more important
        // that the app will work reliably even when later offline.
        await updateCache();
      }

      return response;
    };

    return event.respondWith(createNavigateResponse());
  }

  // The entire application should be loaded in the cache and up to date.
  return event.respondWith(fetchFromCacheFirst(request));
});
