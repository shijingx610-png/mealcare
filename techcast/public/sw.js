// サービスワーカー
// ---------------------------------------------------------------------------
// 目的は 2 つだけ。
//  1. ホーム画面から開けるアプリにする（PWA の要件）
//  2. 圏外でも過去の番組を開けるようにする（台本は端末に保存済みなので画面さえ出れば読める）
//
// ニュースの取得結果はキャッシュしない。古い番組が新しい顔で出てくるほうが害が大きい。

const CACHE = 'techcast-shell-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
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
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API は常にネットワーク。鮮度が命なのでキャッシュしない。
  if (url.pathname.startsWith('/api/')) return;

  // 画面遷移はネットワーク優先、落ちたらキャッシュ（圏外でも開ける）
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  // 静的アセットはキャッシュ優先。取れたら裏で更新しておく。
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
