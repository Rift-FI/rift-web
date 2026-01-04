import Rift, { Environment } from "@rift-finance/wallet";
const sdk_api_key = import.meta.env.VITE_SDK_API_KEY;

if (!sdk_api_key) throw new Error("SET VITE_SDK_API_KEY to continue");


let rift: Rift;

try {
  rift = new Rift({
    environment: Environment.DEVELOPMENT,
    apiKey: sdk_api_key,
    timeout: 120_000,
  });

  // Debug: Log available services
  console.log("🔧 Rift SDK initialized:", {
    hasVault: !!rift.vault,
    vaultType: typeof rift.vault,
    hasWallet: !!rift.wallet,
    hasAuth: !!rift.auth,
    riftKeys: Object.keys(rift),
  });
} catch (error) {
  console.error("🔧 Rift SDK initialization failed:", error);
  throw error;
}

export default rift;
