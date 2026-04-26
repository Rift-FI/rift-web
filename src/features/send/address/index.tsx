import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { SendCryptoProvider, useSendContext } from "../context";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import { useDisclosure } from "@/hooks/use-disclosure";
import ActionButton from "@/components/ui/action-button";
import AddressAmount from "./components/AddressAmount";
import Confirmation from "./components/Confirmation";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";

// Stablecoin token IDs we recognise for chain-level restrictions.
const STABLECOIN_TOKEN_IDS = new Set(["usd-coin", "tether"]);
// Chains where on-chain transfers are not supported. Block them at the route.
const NO_ONCHAIN_SEND_CHAINS = new Set(["42220", "1135"]); // Celo, Lisk
const CHAIN_LABEL: Record<string, string> = {
  "42220": "Celo",
  "1135": "Lisk",
};

function SendToAddressCtr() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, switchCurrentStep } = useSendContext();
  const { userQuery } = useWalletAuth();
  const confirmation_disclosure = useDisclosure();
  const isDesktop = useDesktopDetection();

  const CURRENT_STEP = state?.watch("active");
  const SELECTED_TOKEN = state?.watch("token");
  const SELECTED_TOKEN_CHAIN = state?.watch("chain");
  const ADDRESS = state?.watch("recipient");
  const AMOUNT = state?.watch("amount");

  const AMOUNT_IS_VALID = useMemo(() => {
    const parsed = parseFloat(AMOUNT!);
    if (Number.isNaN(parsed)) return false;
    if (parsed == 0) return false;
    return true;
  }, [AMOUNT]);

  const onCancel = () => {
    navigate("/app");
  };

  const onNext = () => {
    // Since we skip token selection and go directly to address-search,
    // we only need to handle the address-search step
    if (CURRENT_STEP == "address-search" && ADDRESS && AMOUNT_IS_VALID) {
      confirmation_disclosure.onOpen();
    }
  };

  const _initializeStateValues = useCallback(() => {
    state?.setValue("mode", "send-to-address");

    // Use URL params if provided (e.g. from My Assets page), otherwise default to Base USDC
    const tokenParam = searchParams.get("token");
    const chainParam = searchParams.get("chain");
    const backendIdParam = searchParams.get("backendId");
    const tokenNameParam = searchParams.get("tokenName");
    const tokenIconParam = searchParams.get("tokenIcon");
    state?.setValue("token", tokenParam || "usd-coin");
    state?.setValue("chain", chainParam || "8453");
    if (backendIdParam) state?.setValue("backendId", backendIdParam);
    if (tokenNameParam) state?.setValue("tokenName", tokenNameParam);
    if (tokenIconParam) state?.setValue("tokenIcon", tokenIconParam);
    state?.setValue("active", "address-search");

    if (userQuery?.data?.externalId) {
      state?.setValue("authMethod", "external-id-password");
    }
    if (userQuery?.data?.phoneNumber) {
      state?.setValue("authMethod", "phone-otp");
    }
    if (userQuery?.data?.email) {
      state?.setValue("authMethod", "email-otp");
    }
  }, [userQuery?.data]);

  useEffect(() => {
    _initializeStateValues();
  }, [userQuery?.data]);

  const tokenIdFromUrl = (searchParams.get("token") || "usd-coin").toLowerCase();
  const chainFromUrl = searchParams.get("chain") || "8453";
  const sendBlocked =
    STABLECOIN_TOKEN_IDS.has(tokenIdFromUrl) &&
    NO_ONCHAIN_SEND_CHAINS.has(chainFromUrl);
  const blockedChainLabel = CHAIN_LABEL[chainFromUrl] || "this chain";
  const blockedTokenName =
    searchParams.get("tokenName") ||
    (tokenIdFromUrl === "tether" ? "USDT" : "USDC");

  if (sendBlocked) {
    const isLiskBlock = chainFromUrl === "1135";
    return (
      <div className={`w-full h-full flex flex-col ${isDesktop ? "p-8" : "p-4"} bg-app-background`}>
        <div className="flex items-center gap-3 mb-6">
          <ActionButton
            onClick={onCancel}
            variant="ghost"
            className="!w-auto !h-9 !px-3 text-sm bg-secondary hover:bg-surface-subtle"
          >
            Back
          </ActionButton>
          <h1 className={`font-semibold ${isDesktop ? "text-2xl" : "text-lg"} text-text-default`}>
            Send Crypto
          </h1>
        </div>

        <div className={`mx-auto ${isDesktop ? "max-w-xl mt-12" : "w-full mt-6"}`}>
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-amber-900 leading-tight">
                  {isLiskBlock
                    ? `${blockedTokenName} on ${blockedChainLabel} is not transferable`
                    : `On-chain transfers aren't supported on ${blockedChainLabel}`}
                </p>
                <p className="text-[13px] text-amber-800/90 mt-2 leading-relaxed">
                  {isLiskBlock
                    ? "On-chain sends, conversions, withdrawals to bank/mobile money, and cross-border transfers don't work for this token. Move funds via the issuing chain to access them."
                    : "On-chain sends and conversions don't work here. You can still withdraw to bank or mobile money, or send across borders."}
                </p>

                {!isLiskBlock && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => navigate("/app/withdraw")}
                      className="px-4 py-2 rounded-xl bg-amber-900 text-white text-[13px] font-semibold hover:bg-amber-900/90 transition-colors"
                    >
                      Withdraw to bank / mobile
                    </button>
                    <button
                      onClick={() => navigate("/app/pay")}
                      className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 text-[13px] font-semibold hover:bg-amber-100 transition-colors"
                    >
                      Send across borders
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={`w-full h-full flex flex-col ${isDesktop ? "p-8" : "p-4"}`}
    >
      {!isDesktop && (
        <div className="w-full fixed top-0 pt-2 bg-surface -mx-4 pb-2 px-2 z-10">
          <h2 className="text-center text-xl font-medium">Send Crypto</h2>
          <p className="text-center text-sm">Send to another wallet address</p>
        </div>
      )}

      {isDesktop && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Send Crypto</h2>
          <p className="text-sm text-gray-600">Send to another wallet address</p>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${isDesktop ? "" : "mt-15"}`}>
        <div className={isDesktop ? "max-w-2xl mx-auto" : ""}>
          <AddressAmount />
          <Confirmation {...confirmation_disclosure} />
        </div>
      </div>

      <div className={`flex flex-row flex-nowrap gap-3 ${isDesktop ? "mt-8 max-w-2xl mx-auto w-full" : "-mx-4 -mb-4 border-t border-border bg-app-background"} p-4 py-2`}>
        <ActionButton
          onClick={onCancel}
          variant="ghost"
          className={`font-medium border-0 bg-secondary hover:bg-surface-subtle transition-all ${isDesktop ? "flex-1" : ""} rounded-2xl`}
        >
          Cancel
        </ActionButton>

        <ActionButton
          onClick={onNext}
          variant="secondary"
          className={`font-medium border-0 ${isDesktop ? "flex-1" : ""} rounded-2xl`}
        >
          Confirm
        </ActionButton>
      </div>
    </motion.div>
  );

  return (
    <div className="h-full flex flex-col">
      {isDesktop ? (
        <DesktopPageLayout maxWidth="lg" className="h-full">
          {content}
        </DesktopPageLayout>
      ) : (
        content
      )}
    </div>
  );
}

export default function SendToAddress() {
  return (
    <SendCryptoProvider>
      <SendToAddressCtr />
    </SendCryptoProvider>
  );
}
