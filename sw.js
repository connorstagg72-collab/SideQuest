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

// Future-ready: if a push server is added later, this renders the message.
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) {}
  const title = d.title || "SideQuest";
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || "",
    tag: d.tag,
    data: { url: d.url || "/" },
  }));
});
