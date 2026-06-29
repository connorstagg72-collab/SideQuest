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

// Server-sent push. Show a system notification only when the app isn't open in
// any window — when it's open (focused or backgrounded) the in-app UI handles it,
// so we don't double up.
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
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (wins.length > 0) return;   // app is open somewhere → let the page notify
    await self.registration.showNotification(title, opts);
  })());
});
