import { getApiBase } from "@/lib/apiBase";

/**
 * Iriis integration config.
 *
 * The browser NEVER handles an Iriis JWT. It either:
 *   - Hits `${getApiBase()}/api/iriis/chat` with the user's Rift
 *     session token (Bearer) + the SDK API key (x-api-key). The Rift
 *     backend authenticates the caller and mints an Iriis JWT
 *     server-side for THAT user's identity.
 *   - Falls back to `/api/iriis/chat` same-origin (dev), which is
 *     handled by the Vite plugin (vite-plugins/iriis-dev-proxy.ts).
 *
 * Both headers matter: sphere-format ES256 tokens go through the
 * legacy verification path in backend/middleware/auth.ts which
 * requires x-api-key. Session-format HS256 tokens don't need it, but
 * we send it anyway — the backend just ignores it in that branch.
 */

const CHAT_PATH = "/api/iriis/chat";

export interface IriisEndpoint {
  url: string;
  bearer: string | null;
  apiKey: string | null;
}

export function resolveIriisEndpoint(): IriisEndpoint {
  const sessionToken =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  const apiKey =
    (import.meta.env.VITE_SDK_API_KEY as string | undefined) || null;

  if (sessionToken) {
    return {
      url: `${getApiBase()}${CHAT_PATH}`,
      bearer: sessionToken,
      apiKey,
    };
  }
  return { url: CHAT_PATH, bearer: null, apiKey: null };
}
