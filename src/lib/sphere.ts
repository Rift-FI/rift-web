import Sphere, { Environment } from "@stratosphere-network/wallet";
const sdk_api_key = import.meta.env.VITE_SDK_API_KEY;

if (!sdk_api_key) throw new Error("SET VITE_SDK_API_KEY to continue");

const sphere = new Sphere({
  environment: Environment.DEVELOPMENT,
    apiKey: sdk_api_key,
    timeout: 120_000
})

export default sphere;
