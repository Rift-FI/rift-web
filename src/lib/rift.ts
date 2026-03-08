import Rift, { Environment } from "@rift-finance/wallet";
const sdk_api_key = import.meta.env.VITE_SDK_API_KEY;

if (!sdk_api_key) throw new Error("SET VITE_SDK_API_KEY to continue");

const rift = new Rift({
  environment: Environment.DEVELOPMENT,
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

export default rift;
