// Service worker de HispanApp: guarda la app en el dispositivo para poder usarla sin conexión.
// - La página (index.html) se pide primero a internet para recibir siempre la última versión;
//   si no hay conexión, se usa la copia guardada.
// - El icono, el manifest y las tipografías se sirven desde la copia guardada y se actualizan en segundo plano.
// Firebase, Lemon Squeezy y YouTube no pasan por aquí: necesitan conexión.

const CACHE = 'hispanapp-v1';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-512.PNG'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Página principal: red primero, copia guardada si no hay conexión
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
          }
          return res;
        })
        .catch(() =>
          caches.match('./index.html').then((cached) => cached || caches.match('./'))
        )
    );
    return;
  }

  // Archivos propios y tipografías: copia guardada al instante y actualización en segundo plano
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin || FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const network = fetch(req)
            .then((res) => {
              if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
              return res;
            })
            .catch(() => cached || Response.error());
          return cached || network;
        })
      )
    );
  }
});
