import Rift, { Environment } from "@rift-finance/wallet";
const sdk_api_key = import.meta.env.VITE_SDK_API_KEY;

if (!sdk_api_key) throw new Error("SET VITE_SDK_API_KEY to continue");

// Build-flavour switch. Sandbox flavour (v3 / non-custodial) sets
// VITE_RIFT_ENVIRONMENT=sandbox + VITE_NON_CUSTODIAL=true. Production
// + Development match the historical behaviour.
function resolveEnv(): Environment {
  const flavour = String(
    import.meta.env.VITE_RIFT_ENVIRONMENT || ""
  ).toLowerCase();
  if (flavour === "production") return Environment.PRODUCTION;
  if (flavour === "sandbox") {
    // SDK 1.4.x doesn't have an explicit SANDBOX enum value; sandbox is
    // really "DEVELOPMENT pointed at sandbox.riftfi.com via baseUrl
    // override" (the override is configured in nonCustodial.ts for the
    // raw v3 calls; the SDK itself talks to whatever its baseUrl is).
    return Environment.DEVELOPMENT;
  }
  return Environment.DEVELOPMENT;
}

const rift = new Rift({
  environment: resolveEnv(),
  apiKey: sdk_api_key,
  timeout: 60_000,
});

// Disable SDK's built-in retry logic to prevent duplicate mutations (e.g. double withdrawals).
// The SDK defaults to 3 retries on 5xx errors, but if the server processes the request
// before returning an error, retries create duplicate transactions.
const httpClient = (rift as any).httpClient;
httpClient.executeWithRetry = async function (url: string, options: any) {
  return fetch(url, {
    ...options,
    cache: "no-store",
  });
};

// Sandbox / production override: when an explicit base URL is supplied
// (sandbox build sets VITE_RIFT_API_BASE=https://sandbox.riftfi.com),
// point the SDK's httpClient at it. v1 SDK doesn't expose `baseUrl` as
// a constructor option so we patch the internal field.
const overrideBase = import.meta.env.VITE_RIFT_API_BASE;
if (overrideBase) {
  httpClient.baseUrl = String(overrideBase).replace(/\/$/, "");
}

export default rift;
