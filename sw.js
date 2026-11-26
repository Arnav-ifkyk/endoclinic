// sw.js — makes the app open instantly and work offline.
// Bump VERSION whenever you upload new app files.
const VERSION = 'endo-v27';
const SHELL = ['./', 'index.html', 'app.html', 'config.js', 'refdata.js', 'growth.js', 'charts.js', 'print.js', 'store.js', 'helpers.js', 'app.js', 'logo.png', 'logo.png?v=6', 'assets/logo.png', 'assets/fonts/newsreader-latin-opsz-normal.woff2', 'assets/fonts/newsreader-latin-opsz-italic.woff2', 'assets/fonts/instrument-sans-latin-wght-normal.woff2', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))); });
self.addEventListener('message', e => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.hostname.endsWith('supabase.co')) return; // never cache patient data requests
  const isShell = u.origin === location.origin;
  if (isShell) {
    // network first for app files (bypassing stale HTTP cache so updates arrive immediately), cache as fallback when offline
    e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { const c = r.clone(); caches.open(VERSION).then(ca => ca.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
  } else if (/fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(u.hostname)) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSION).then(ca => ca.put(e.request, c)); return r; })));
  }
});
