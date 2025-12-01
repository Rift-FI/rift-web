/**
 * Utility to clear Pusher Beams cache
 * Use this when switching instance IDs or for debugging
 */

export const clearPusherBeamsCache = async (): Promise<void> => {
  try {
    console.log("🧹 [Pusher Beams] Clearing cache...");

    // 1. Clear IndexedDB
    const databases = await indexedDB.databases();
    const pusherDatabases = databases.filter(
      (db) => db.name?.includes("pusher") || db.name?.includes("beams")
    );

    for (const db of pusherDatabases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
        console.log(`✅ [Pusher Beams] Deleted database: ${db.name}`);
      }
    }

    // 2. Clear localStorage keys related to Pusher
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes("pusher") || key.includes("beams"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      console.log(`✅ [Pusher Beams] Removed localStorage: ${key}`);
    });

    // 3. Unregister service workers (except if already active)
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        const scriptURL = registration.active?.scriptURL || "";
        if (scriptURL.includes("service-worker.js")) {
          await registration.unregister();
          console.log(`✅ [Pusher Beams] Unregistered: ${scriptURL}`);
        }
      }
    }

    console.log("✅ [Pusher Beams] Cache cleared successfully!");
    console.log("🔄 Please refresh the page to reinitialize");
  } catch (error) {
    console.error("❌ [Pusher Beams] Failed to clear cache:", error);
  }
};

/**
 * Force clear and reload
 */
export const clearPusherBeamsAndReload = async (): Promise<void> => {
  await clearPusherBeamsCache();
  setTimeout(() => {
    window.location.reload();
  }, 500);
};
