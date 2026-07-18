/**
 * Iriis integration config. Reads Vite env, exposes the base URL + the
 * dev/sandbox token, and answers "is this build allowed to talk to Iriis
 * at all?".
 *
 * On sandbox this is fine: `VITE_IRIIS_TOKEN` is a short-lived USER-role
 * JWT that the sandbox deploy holds so we can test end-to-end without
 * routing every call through the backend first. Prod will proxy through
 * `POST /api/iriis/token` (see docs/IRIIS-SANDBOX-CHAT.md) — that switch
 * happens when we cut this feature to main.
 */

const DEFAULT_IRIIS_URL = "https://iriis.riftfi.com";

export const IRIIS_URL: string =
  (import.meta.env.VITE_IRIIS_URL as string | undefined)?.trim() ||
  DEFAULT_IRIIS_URL;

export const IRIIS_DEV_TOKEN: string =
  (import.meta.env.VITE_IRIIS_TOKEN as string | undefined)?.trim() || "";

export const IRIIS_ENABLED: boolean = Boolean(IRIIS_DEV_TOKEN);

export const IRIIS_ENVIRONMENT: "sandbox" | "production" | "development" =
  (import.meta.env.VITE_RIFT_ENVIRONMENT as
    | "sandbox"
    | "production"
    | "development"
    | undefined) || "development";
