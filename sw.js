const CACHE = 'fss-v6';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png', './xlsx.min.js', './exceljs.min.js'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (!req.url.startsWith('http')) return;

  // HTML / navegación: network-first (siempre la versión fresca si hay internet;
  // cae al cache solo si está offline). Evita que queden versiones viejas pegadas.
  const isHTML = req.mode === 'navigate' || req.destination === 'document' ||
                 req.url.endsWith('/') || req.url.endsWith('/index.html');
  if (isHTML) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // Resto de assets (xlsx, exceljs, icono, manifest): cache-first.
  e.respondWith(
    caches.match(req).then(r => r || fetch(req))
  );
});
