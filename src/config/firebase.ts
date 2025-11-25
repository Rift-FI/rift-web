import { initializeApp, FirebaseApp } from "firebase/app";
import { getMessaging, Messaging, isSupported } from "firebase/messaging";

// Firebase configuration
// Get these from your Firebase Console: Project Settings > General > Your apps > Web app
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // Optional
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Initialize Firebase app
 */
export const initializeFirebase = async (): Promise<FirebaseApp | null> => {
  if (typeof window === "undefined") {
    console.warn("Firebase: Window not available (SSR context)");
    return null;
  }

  try {
    // Check if Firebase messaging is supported
    const messagingSupported = await isSupported();
    
    if (!messagingSupported) {
      console.warn("Firebase Messaging is not supported in this browser");
      return null;
    }

    // Initialize Firebase app if not already initialized
    if (!app) {
      app = initializeApp(firebaseConfig);
      console.log("✅ [Firebase] App initialized");
    }

    return app;
  } catch (error) {
    console.error("❌ [Firebase] Failed to initialize:", error);
    return null;
  }
};

/**
 * Get Firebase Messaging instance
 */
export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  try {
    if (!app) {
      await initializeFirebase();
    }

    if (!app) {
      return null;
    }

    if (!messaging) {
      messaging = getMessaging(app);
      console.log("✅ [Firebase] Messaging initialized");
    }

    return messaging;
  } catch (error) {
    console.error("❌ [Firebase] Failed to get messaging:", error);
    return null;
  }
};

export { app, messaging };

