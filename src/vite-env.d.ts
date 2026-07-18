/// <reference types="vite/client" />

interface ImportMetaEnv {
  // The SDK / API keys are asserted at module load in lib/rift.ts and
  // services/recovery-api.ts — declaring them as `string` (not `string?`)
  // lets fetch header objects type-check without every call site having
  // to narrow with `as string` casts. The runtime already blows up on
  // startup if either isn't supplied.
  readonly VITE_SDK_API_KEY: string;
  readonly VITE_API_URL: string;

  readonly VITE_TEST?: string;
  readonly VITE_ERROR_OUT?: string;
  readonly VITE_TEST_BROWSER_MODE?: string;
  // Sandbox / non-custodial build flavour. Default OFF; sandbox builds
  // set VITE_NON_CUSTODIAL=true + VITE_RIFT_ENVIRONMENT=sandbox.
  readonly VITE_NON_CUSTODIAL?: string;
  readonly VITE_RIFT_ENVIRONMENT?: "production" | "sandbox" | "development";
  readonly VITE_RIFT_API_BASE?: string;
  readonly VITE_PASSKEY_RP_ID?: string;
  readonly VITE_PASSKEY_RP_NAME?: string;

  // Iriis (Rift AI assistant) — see features/iriis/iriis-config.ts
  // Base URL of the deployed Iriis service. Defaults to the prod host.
  readonly VITE_IRIIS_URL?: string;
  // SANDBOX ONLY. A USER-role Iriis JWT so the in-app chat can call
  // /chat directly. Prod builds must proxy through the backend (see
  // docs/IRIIS-SANDBOX-CHAT.md) — this var stays unset there.
  readonly VITE_IRIIS_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
