/* SideQuest service worker — notifications only.
   Intentionally does NOT cache anything, so the app is never served stale. */

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

// Clicking a notification focuses an open SideQuest tab, or opens one.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) {
      if ("focus" in w) { try { await w.focus(); } catch (_) {} return; }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});

// Server-sent push. Show a system notification unless a window is currently
// focused (you're looking right at the app) — then the in-app toast covers it.
// Switched tabs / another app / backgrounded / closed → show it. Test → always.
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) {}
  const title = d.title || "SideQuest";
  const opts = {
    body: d.body || "",
    tag: d.tag,
    icon: "icon-192.png",
    badge: "icon-192.png",
    data: { url: d.url || "/" },
  };
  e.waitUntil((async () => {
    if (d.test) { await self.registration.showNotification(title, opts); return; }
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // Stay quiet only if a window actually has focus (you're looking right at it)
    // — then the in-app toast covers it. Switched tabs / another app / closed →
    // show the system notification.
    const focused = wins.some(w => w.focused);
    if (focused) return;
    await self.registration.showNotification(title, opts);
  })());
});
