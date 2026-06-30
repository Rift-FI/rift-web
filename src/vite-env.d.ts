/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SDK_API_KEY?: string;
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
