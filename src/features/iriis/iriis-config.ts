import { getApiBase } from "@/lib/apiBase";

/**
 * Iriis integration config.
 *
 * The browser NEVER handles an Iriis JWT. It either:
 *   - Hits `${getApiBase()}/api/iriis/chat` with the user's Rift
 *     session token (Bearer). Rift backend authenticates the session
 *     and mints an Iriis JWT server-side for THAT user's identity —
 *     so per-user memory + tool scoping work correctly.
 *   - Falls back to `/api/iriis/chat` same-origin, which in local dev
 *     is handled by the Vite plugin (`vite-plugins/iriis-dev-proxy.ts`)
 *     that mints a generic dev token.
 *
 * Runtime picks whichever is available. No env-var gating needed.
 */

const CHAT_PATH = "/api/iriis/chat";

export interface IriisEndpoint {
  url: string;
  bearer: string | null;
}

export function resolveIriisEndpoint(): IriisEndpoint {
  const sessionToken =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  if (sessionToken) {
    return { url: `${getApiBase()}${CHAT_PATH}`, bearer: sessionToken };
  }
  return { url: CHAT_PATH, bearer: null };
}
