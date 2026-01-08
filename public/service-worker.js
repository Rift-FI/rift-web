/**
 * Pusher Beams Service Worker
 * This service worker handles push notifications from Pusher Beams
 */
importScripts("https://js.pusher.com/beams/service-worker.js");

self.addEventListener("notificationclick", (event) => {
  console.log(
    "[Pusher Beams SW] Notification clicked:",
    event.notification.data,
  );

  event.notification.close();

  const urlToOpen =
    event.notification.data?.url ||
    event.notification.data?.deep_link ||
    "https://wallet.riftfi.xyz/app";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (
            client.url.includes(new URL(urlToOpen).hostname) &&
            "focus" in client
          ) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});
