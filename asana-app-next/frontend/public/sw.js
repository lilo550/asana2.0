// Service Worker fuer Web Push. Laeuft ausserhalb des React-Baums im
// Browser, empfaengt Push-Events auch wenn kein Tab der App offen ist.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Neue Benachrichtigung", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Neue Benachrichtigung";
  const options = {
    body: data.body || "",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Klick auf die Notification: direkter Link zur relevanten Seite.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});