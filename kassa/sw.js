/* Служебный работник кассы (25.10.2026). Страница — из сети с ожиданием 3 с, иначе из запаса; шрифты и просмотрщик PDF — из постоянных запасов,
   которые не перекачиваются при каждой выкладке. Данные (script.google.com) идут мимо: цифры хранит сама страница в localStorage. */
const PAGE = 'kassa-20261026-1834';
const FONTS = 'kassa-fonts-fd533d3c', PDFJS = 'kassa-pdfjs-3.11.174';   // имя запаса шрифтов — от содержимого (ревизия 25.10.2026): правка шрифтов дойдёт до телефонов
const KEEP = [PAGE, FONTS, PDFJS];
const PAGE_ASSETS = ['./', './index.html', './manifest.webmanifest'];
const FONT_ASSETS = ['./fonts/fonts.css', './fonts/Manrope-500-cyrillic.woff2', './fonts/Manrope-500-latin.woff2', './fonts/MartianMono-500-cyrillic.woff2', './fonts/MartianMono-500-latin.woff2'];
const PDF_ASSETS = ['./vendor/pdf.min.js', './vendor/pdf.worker.min.js'];
const NET_WAIT = 3000;

self.addEventListener('install', e => {
  e.waitUntil(Promise.all([
    caches.open(PAGE).then(c => c.addAll(PAGE_ASSETS)),
    caches.open(FONTS).then(c => Promise.all(FONT_ASSETS.map(u => c.match(u).then(r => r || c.add(u))))),
    caches.open(PDFJS).then(c => Promise.all(PDF_ASSETS.map(u => c.match(u).then(r => r || c.add(u)))))
  ]).then(() => self.skipWaiting()));   // ошибка установки не глушится: старый работник остаётся, запас не пропадает
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.indexOf('kassa-') === 0 && KEEP.indexOf(k) < 0).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function netOrCache(req, cacheName) {
  return new Promise(resolve => {
    let done = false;
    const finish = r => { if (!done) { done = true; resolve(r); } };
    const fallback = () => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : null)).then(r => r || Response.error());   // всегда ответ (ревизия 25.10.2026)
    const timer = setTimeout(() => caches.match(req, { ignoreSearch: true }).then(r => { if (r) finish(r); }), NET_WAIT);
    fetch(req).then(r => {
      clearTimeout(timer);
      if (r && r.ok) { const copy = r.clone(); caches.open(cacheName).then(c => c.put(new Request(req.url.split('?')[0]), copy)).catch(() => {}); }
      finish(r);
    }).catch(() => { clearTimeout(timer); fallback().catch(() => Response.error()).then(finish); });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf('/kassa/beta/') === 0) return;
  if (/\/fonts\//.test(url.pathname) || /\/vendor\//.test(url.pathname)) {   // статика: сначала запас
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req).then(x => {
      if (x && x.ok) { const copy = x.clone(); caches.open(/\/fonts\//.test(url.pathname) ? FONTS : PDFJS).then(c => c.put(req, copy)).catch(() => {}); }
      return x;
    })));
    return;
  }
  e.respondWith(netOrCache(req, PAGE));
});
