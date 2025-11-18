import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/contexts/NotificationContext";

/**
 * Debug component to help troubleshoot notification issues
 * Add this to your Profile page during development to debug notifications
 */
export const NotificationDebug = () => {
  const [subscriberId, setSubscriberId] = useState<string | null>(null);
  const [serviceWorkers, setServiceWorkers] = useState<
    readonly ServiceWorkerRegistration[]
  >([]);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const { subscriptions } = useNotifications();

  useEffect(() => {
    // Get current permission
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    // Get service workers
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        setServiceWorkers(regs);
      });
    }

    // Get Webpushr subscriber ID
    if (window.webpushr && typeof window.webpushr === "function") {
      window.webpushr("fetch_id", (sid: string) => {
        setSubscriberId(sid);
      });
    }
  }, []);

  const handleTestNotification = async () => {
    if (!subscriberId) {
      alert("No subscriber ID found. Please enable notifications first.");
      return;
    }

    const message = `Test from browser at ${new Date().toLocaleTimeString()}`;

    alert(
      `Copy this subscriber ID and use it in your curl command:\n\n${subscriberId}\n\nOr use the Rift SDK method in your backend.`
    );
  };

  const handleShowDebugInfo = () => {
    const info = {
      permission: Notification.permission,
      subscriberId: subscriberId,
      serviceWorkersCount: serviceWorkers.length,
      webpushrLoaded: typeof window.webpushr !== "undefined",
      subscriptionsInRift: subscriptions.subscriptions.length,
      activeSubscriptions: subscriptions.activeCount,
    };

    console.log("=== NOTIFICATION DEBUG INFO ===");
    console.log(JSON.stringify(info, null, 2));
    console.log("Service Workers:", serviceWorkers);
    console.log("Rift Subscriptions:", subscriptions);
    console.log("===========================");

    alert("Debug info logged to console. Check DevTools Console.");
  };

  return (
    <div className="mt-6 p-4 border-2 border-yellow-500 rounded-lg bg-yellow-50 dark:bg-yellow-950">
      <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mb-3">
        🔧 Notification Debug Panel
      </h3>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="font-medium">Browser Permission:</span>
          <span
            className={`px-2 py-1 rounded ${
              permission === "granted"
                ? "bg-green-100 text-green-800"
                : permission === "denied"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {permission}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium">Webpushr Subscriber ID:</span>
          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {subscriberId || "Not found"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium">Service Workers:</span>
          <span>{serviceWorkers.length} registered</span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium">Rift Subscriptions:</span>
          <span>{subscriptions.activeCount} active</span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium">Webpushr Loaded:</span>
          <span>
            {typeof window.webpushr !== "undefined" ? "✅ Yes" : "❌ No"}
          </span>
        </div>
      </div>

      {subscriberId && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">
            Your Subscriber ID (use in curl):
          </p>
          <code className="text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded block break-all">
            {subscriberId}
          </code>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleShowDebugInfo}
          className="flex-1"
        >
          Log Debug Info
        </Button>

        <Button
          size="sm"
          onClick={handleTestNotification}
          disabled={!subscriberId}
          className="flex-1"
        >
          Get Subscriber ID
        </Button>
      </div>

      <div className="mt-4 pt-4 border-t border-yellow-400">
        <p className="text-xs text-yellow-900 dark:text-yellow-100">
          💡 <strong>Most Common Issue:</strong> Subscriber ID mismatch
        </p>
        <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
          The ID in your curl command must match the ID from Webpushr. Click
          "Get Subscriber ID" above.
        </p>
      </div>
    </div>
  );
};
