/* Cache only the explicit offline notice. Never substitute the home page for a result/incident route. */
const CACHE = 'jagawarga-offline-v3';
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.add('/offline.html')).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('jagawarga-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
 if(event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin || event.request.mode !== 'navigate' || new URL(event.request.url).pathname.startsWith('/api/')) return;
 event.respondWith(fetch(event.request).catch(async () => (await caches.match('/offline.html')) || new Response('Koneksi tidak tersedia. Tidak ada pemeriksaan yang dijalankan.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})));
});
