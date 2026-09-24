/* Служебный работник кассы. Страница берётся из сети, при отсутствии сети — из запаса.
   Данные (script.google.com) идут мимо: цифры хранит сама страница в localStorage. Шрифты (fonts/) кладутся в запас заранее. */
const CACHE = 'kassa-20260924-1235';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './fonts/Geologica-500-cyrillic.woff2', './fonts/Geologica-500-latin.woff2', './fonts/Geologica-600-cyrillic.woff2', './fonts/Geologica-600-latin.woff2', './fonts/Geologica-700-cyrillic.woff2', './fonts/Geologica-700-latin.woff2', './fonts/GolosText-400-cyrillic.woff2', './fonts/GolosText-400-latin.woff2', './fonts/GolosText-500-cyrillic.woff2', './fonts/GolosText-500-latin.woff2', './fonts/GolosText-600-cyrillic.woff2', './fonts/GolosText-600-latin.woff2', './fonts/Manrope-500-cyrillic.woff2', './fonts/Manrope-500-latin.woff2', './fonts/Manrope-600-cyrillic.woff2', './fonts/Manrope-600-latin.woff2', './fonts/Manrope-700-cyrillic.woff2', './fonts/Manrope-700-latin.woff2', './fonts/Manrope-800-cyrillic.woff2', './fonts/Manrope-800-latin.woff2', './fonts/MartianMono-500-cyrillic.woff2', './fonts/MartianMono-500-latin.woff2', './fonts/Unbounded-500-cyrillic.woff2', './fonts/Unbounded-500-latin.woff2', './fonts/Unbounded-600-cyrillic.woff2', './fonts/Unbounded-600-latin.woff2', './fonts/fonts.css'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf('/kassa/beta/') === 0) return;
  e.respondWith(
    fetch(req).then(r => {
      if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
