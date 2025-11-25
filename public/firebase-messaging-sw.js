// Firebase Messaging Service Worker
// This file handles background notifications when the PWA is not open

// Import Firebase scripts
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"
);

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: "AIzaSyCBnpA7hXS816DrK-151ISOsg77T8RiOXM",
  authDomain: "rift-c881c.firebaseapp.com",
  projectId: "rift-c881c",
  storageBucket: "rift-c881c.firebasestorage.app",
  messagingSenderId: "156214387744",
  appId: "1:156214387744:web:60cc293c34ff99463cc845",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[Service Worker] Background message received:", payload);

  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: payload.notification?.icon || "/icon-192x192.jpg",
    badge: "/icon-192x192.jpg",
    data: {
      url:
        payload.data?.targetUrl ||
        payload.fcmOptions?.link ||
        "https://wallet.riftfi.xyz/app",
      ...payload.data,
    },
    tag: payload.data?.notificationId || "default",
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked:", event);

  event.notification.close();

  const targetUrl =
    event.notification.data?.url || "https://wallet.riftfi.xyz/app";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (let client of clientList) {
          if (
            client.url.startsWith(new URL(targetUrl).origin) &&
            "focus" in client
          ) {
            return client.focus().then(() => {
              // Navigate to target URL if needed
              if (client.url !== targetUrl) {
                return client.navigate(targetUrl);
              }
            });
          }
        }
        // If app is not open, open it
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
