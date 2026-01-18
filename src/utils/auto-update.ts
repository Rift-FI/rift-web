/**
 * Auto-update utility for PWA
 * 
 * Checks for new versions and forces a hard refresh when needed.
 * This helps users who have cached old versions of the app.
 */

// Current app version - UPDATE THIS when deploying new versions
export const APP_VERSION = "1.0.2";

/**
 * Clear all caches (service worker caches, browser caches)
 */
async function clearAllCaches(): Promise<void> {
  // Clear service worker caches
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  }

  // Unregister all service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(registration => registration.unregister())
    );
  }
}

/**
 * Manual function to force clear cache and refresh
 * Can be called from settings or when user reports issues
 */
export async function forceClearCacheAndRefresh(): Promise<void> {
  await clearAllCaches();
  window.location.reload();
}
