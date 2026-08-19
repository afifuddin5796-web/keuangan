// Versi cache dinaikkan supaya browser mau menimpa Service Worker lama
// yang sudah kadung ter-install di HP kamu dengan versi yang sudah diperbaiki.
const CACHE_NAME = 'anggaran-app-v2';
const OFFLINE_URL = './index.html';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

// INSTALL: simpan semua asset inti ke cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .catch((err) => console.error('Gagal precache saat install:', err))
  );
  self.skipWaiting();
});

// ACTIVATE: hapus cache versi lama & langsung ambil alih semua tab
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null))
      ))
      .then(() => self.clients.claim())
  );
});

// FETCH: cache-first, dengan fallback ke index.html saat benar-benar offline
// dan resource yang diminta belum pernah tersimpan di cache.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          // Setiap kali online, diam-diam lengkapi cache dengan versi terbaru
          if (
            networkResponse &&
            networkResponse.ok &&
            event.request.url.startsWith(self.location.origin)
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline total & tidak ada di cache.
          // Untuk permintaan buka halaman (navigasi), tetap tampilkan app dari cache
          // alih-alih halaman error "Situs tidak dapat dijangkau".
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});
