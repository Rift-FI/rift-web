/**
 * Pusher Beams Service Worker
 *
 * This service worker handles push notifications from Pusher Beams
 */

// Import Pusher Beams service worker library - REQUIRED
importScripts("https://js.pusher.com/beams/service-worker.js");

console.log("✅ [Pusher Beams SW] Service Worker loaded");

// Optional: Custom notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log(
    "[Pusher Beams SW] Notification clicked:",
    event.notification.data
  );

  // Close the notification
  event.notification.close();

  // Get the URL from notification data
  const urlToOpen =
    event.notification.data?.url ||
    event.notification.data?.deep_link ||
    "https://wallet.riftfi.xyz/app";

  // Open or focus the app
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (
            client.url.includes(new URL(urlToOpen).hostname) &&
            "focus" in client
          ) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
