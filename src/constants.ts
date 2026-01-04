export const POSTHOG_KEY = "phc_5su0p9tKjaWpxMh1IsqCiKd2jcg8W084l4N4eCTRTwo";
export const POSTHOG_HOST = "https://us.i.posthog.com";

// Feature flags for login/signup methods
// Set to false to disable the method
export const AUTH_METHODS = {
  phone: true,           // Enable phone number + OTP login
  email: true,          // Disable email + OTP login
  usernamePassword: true, // Disable username + password login
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
