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
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
