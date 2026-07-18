/**
 * Dev-only Vite plugin: proxies `POST /api/iriis/chat` from the app to
 * the deployed Iriis service, minting a per-request USER-role JWT
 * server-side so no token ever touches the browser bundle.
 *
 * With this plugin, `pnpm dev` is all you need:
 *   1. Put IRIIS_JWT_SECRET (Iriis Railway's JWT_SECRET value) in
 *      `app/.env.local`. Optional: IRIIS_URL (defaults to
 *      https://iriis.riftfi.com).
 *   2. `pnpm dev`
 *   3. Click the Iriis button in the app. Zero token minting for the
 *      user, zero token in the frontend bundle.
 *
 * In production, the same path (`/api/iriis/chat`) is served by a real
 * Rift backend endpoint that authenticates the actual signed-in user
 * and mints the token from that identity — see
 * docs/IRIIS-SANDBOX-CHAT.md.
 */

import type { Plugin, Connect } from "vite";
import { SignJWT } from "jose";
import type { IncomingMessage, ServerResponse } from "node:http";

const DEFAULT_IRIIS_URL = "https://iriis.riftfi.com";

interface Options {
  /** Path the frontend calls. Defaults to `/api/iriis/chat`. */
  path?: string;
  /** Env var name holding Iriis's JWT_SECRET. Defaults to IRIIS_JWT_SECRET. */
  secretEnv?: string;
  /** Env var name holding Iriis URL. Defaults to IRIIS_URL. */
  urlEnv?: string;
}

export function iriisDevProxy(opts: Options = {}): Plugin {
  const chatPath = opts.path ?? "/api/iriis/chat";
  const secretEnv = opts.secretEnv ?? "IRIIS_JWT_SECRET";
  const urlEnv = opts.urlEnv ?? "IRIIS_URL";

  return {
    name: "iriis-dev-proxy",
    apply: "serve",

    configureServer(server) {
      const iriisUrl = (process.env[urlEnv] || DEFAULT_IRIIS_URL).replace(/\/$/, "");
      const secret = process.env[secretEnv] || "";

      if (!secret) {
        // eslint-disable-next-line no-console
        console.warn(
          `\n[iriis-dev-proxy] ${secretEnv} is not set. The Iriis chat button will show a placeholder message.\n` +
            `Set it in app/.env.local (same value as JWT_SECRET on the Iriis Railway service) and restart dev.\n`
        );
      } else {
        // eslint-disable-next-line no-console
        console.log(`[iriis-dev-proxy] active → ${iriisUrl} (secret via ${secretEnv})`);
      }

      const secretBytes = secret ? new TextEncoder().encode(secret) : null;

      const mint = async (): Promise<string> => {
        if (!secretBytes) throw new Error("no secret");
        return await new SignJWT({
          rift_user_id: "local-dev",
          email: "dev@rift.local",
          role: "user",
          channel: "inapp",
          session_id: "local-dev-session",
        })
          .setProtectedHeader({ alg: "HS256" })
          .setSubject("local-dev")
          .setIssuedAt()
          .setExpirationTime("1h")
          .sign(secretBytes);
      };

      const handler: Connect.NextHandleFunction = async (
        req: IncomingMessage,
        res: ServerResponse,
        next
      ) => {
        if (req.method !== "POST") {
          next();
          return;
        }

        const body = await readJson(req).catch(() => null);
        if (!body || typeof body.message !== "string") {
          res.statusCode = 400;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "missing 'message' string" }));
          return;
        }

        if (!secretBytes) {
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(
            JSON.stringify({
              reply:
                "Iriis isn't wired up in this local dev build. Set IRIIS_JWT_SECRET in app/.env.local and restart the dev server.",
              _dev_hint: `Set ${secretEnv} in .env.local`,
            })
          );
          return;
        }

        try {
          const token = await mint();
          const upstream = await fetch(`${iriisUrl}/chat`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ message: body.message }),
          });

          const text = await upstream.text();
          res.statusCode = upstream.status;
          res.setHeader(
            "content-type",
            upstream.headers.get("content-type") || "application/json"
          );
          res.end(text);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("[iriis-dev-proxy] upstream error:", err);
          res.statusCode = 502;
          res.setHeader("content-type", "application/json");
          res.end(
            JSON.stringify({
              error: "iriis upstream failed",
              detail: err instanceof Error ? err.message : String(err),
            })
          );
        }
      };

      server.middlewares.use(chatPath, handler);
    },
  };
}

async function readJson(req: IncomingMessage): Promise<{ message?: unknown }> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}
