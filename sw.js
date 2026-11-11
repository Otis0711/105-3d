// 離線模式（Service Worker）：網站開過一次後，程式與模型存在手機裡，現場沒有網路也能開。
// - 程式檔（html/js/css）：有網路先拿最新版，沒網路用存檔。
// - 模型資料 data/*?v=<匯出時間>：同一版本直接用存檔；Revit 重新匯出後 v 改變，會下載新版並刪掉舊版。
// - data/manifest.json：有網路先拿最新（才知道模型有沒有更新），沒網路用存檔。
const CACHE = 'w3d-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

const isData = u => /\/data\//.test(u.pathname) && !/manifest\.json$/.test(u.pathname);

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== location.origin) return;
  if (isData(u) && u.searchParams.has('v')) {
    // 模型資料：同版本直接用存檔
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok) c.put(req, r.clone());
      return r;
    }));
    return;
  }
  // 其他（網頁、程式、manifest）：網路優先，失敗時用存檔（忽略 ?v= 等參數）
  e.respondWith(fetch(req).then(r => {
    if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(u.origin + u.pathname, cp)); }
    return r;
  }).catch(async () => {
    const c = await caches.open(CACHE);
    const hit = (await c.match(req)) || (await c.match(u.origin + u.pathname)) || (req.mode === 'navigate' ? await c.match(new URL('./', location).href) : null);
    return hit || Response.error();
  }));
});

// 網頁載入完成後傳來「全部要存的檔案」，在背景存起來（多半直接從瀏覽器快取拿，不會重新下載）
self.addEventListener('message', e => {
  const m = e.data || {};
  if (m.type !== 'precache') return;
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // 刪掉舊版模型資料
    for (const k of await c.keys()) { const u = new URL(k.url); if (isData(u) && u.searchParams.get('v') !== m.v) await c.delete(k); }
    let ok = 0, fail = 0;
    for (const url of m.urls) {
      try {
        const abs = new URL(url, location).href;
        if (await c.match(abs)) { ok++; continue; }
        const r = await fetch(abs); if (!r.ok) throw 0;
        const u = new URL(abs);
        await c.put(isData(u) && u.searchParams.has('v') ? abs : u.origin + u.pathname, r); ok++;
      } catch { fail++; }
    }
    const cl = await self.clients.matchAll();
    cl.forEach(x => x.postMessage({ type: 'precached', ok, fail, v: m.v }));
  })());
});
