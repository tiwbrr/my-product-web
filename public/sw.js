self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Sell ID", body: event.data.text() };
  }

  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const visibleHome = clients.find((client) => {
      const url = new URL(client.url);
      return client.visibilityState === "visible" && url.pathname === "/";
    });
    if (visibleHome) {
      visibleHome.postMessage({ type: "CHAT_PUSH" });
      return;
    }
    return self.registration.showNotification(data.title || "Sell ID", {
      body: data.body || "มีข้อความแชทใหม่",
      icon: data.icon || "/favicon.ico",
      badge: data.badge || "/favicon.ico",
      tag: data.tag || "sell-id-chat",
      renotify: true,
      silent: false,
      data: { url: data.url || "/#chat" },
    });
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/#chat", self.location.origin).href;

  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      if (client.url.startsWith(self.location.origin)) {
        client.navigate(targetUrl);
        return client.focus();
      }
    }
    return self.clients.openWindow(targetUrl);
  }));
});
