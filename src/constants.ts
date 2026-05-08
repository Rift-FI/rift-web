export const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY || "phc_5su0p9tKjaWpxMh1IsqCiKd2jcg8W084l4N4eCTRTwo";
export const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

// Google OAuth client ID (Web). Must match the GOOGLE_CLIENT_ID(S) env on the
// backend. Set VITE_GOOGLE_CLIENT_ID per-environment in .env.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Apple Sign In Service ID (Web). Looks like "com.rift.web". Must match
// APPLE_CLIENT_ID(S) on the backend. Set VITE_APPLE_CLIENT_ID per-environment.
export const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID || "";
// Where Apple posts the credential after the user authorizes. Apple requires
// this URL to be registered in the Service ID's "Return URLs" — even when
// using popup mode it's used as the postMessage origin. Defaults to the
// current page so single-page popup flow works out of the box.
export const APPLE_REDIRECT_URI =
  import.meta.env.VITE_APPLE_REDIRECT_URI ||
  (typeof window !== "undefined" ? window.location.origin : "");

// Feature flags for login/signup methods
// Set to false to disable the method
export const AUTH_METHODS = {
  phone: true,           // Enable phone number + OTP login
  email: true,          // Disable email + OTP login
  usernamePassword: true, // Disable username + password login
  google: true,          // Continue with Google
  apple: true,           // Continue with Apple
};

export enum colors {
  surface = "#E9F1F4",
  surfacesubtle = "#FFFFFF",
  surfacealt = "#F8F9FA", // Slightly different shade to avoid duplicate
  textdefault = "#1F2D3A",
  textsubtle = "#4A5568", // Slightly different shade to avoid duplicate
  accentprimary = "#2E8C96",
  accentsecondary = "#2A7A84", // Slightly different shade to avoid duplicate
  success = "#30a46c",
  warning = "#ffd13f",
  danger = "#e54d2e",
  tintpurple = "#e2dffe",
  tintsuccess = "#adddc0",
  tintwarning = "#ffffc4",
  tintdanger = "#ffdadc",
}
