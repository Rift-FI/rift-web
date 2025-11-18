// Webpushr Service Worker
// Import Webpushr's service worker - this handles push events automatically
importScripts("https://cdn.webpushr.com/sw-server.min.js");

// NOTE: We DON'T handle 'push' events here - Webpushr's sw-server.min.js handles them
// We ONLY customize the click behavior to redirect to our app

// Override notification click to redirect to /app
self.addEventListener("notificationclick", function (event) {
  console.log("Notification clicked:", event);

  event.notification.close();

  // Get the target URL from the notification data, default to /app
  const targetUrl =
    event.notification.data?.targetUrl || "https://wallet.riftfi.xyz/app";

  console.log("Redirecting to:", targetUrl);

  // Open or focus the app
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // If a window is already open, focus it and navigate
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if ("focus" in client) {
            client.focus();
            // Navigate to the target URL
            client.postMessage({
              type: "NOTIFICATION_CLICKED",
              url: targetUrl,
            });
            return;
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Webpushr's sw-server.min.js automatically handles:
// - 'push' events (receiving notifications)
// - Displaying notifications with proper formatting
// - Managing notification queue
// We just customize the click behavior above
