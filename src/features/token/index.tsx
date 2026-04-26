import { useParams, useNavigate } from "react-router";
import { openLink } from "@telegram-apps/sdk-react";
import { motion } from "motion/react";
import { MdPublic } from "react-icons/md";
import { FiArrowLeft } from "react-icons/fi";
import { AlertTriangle } from "lucide-react";
import { useTokenDetails } from "@/hooks/token/useTokenDetails";
import { usePlatformDetection } from "@/utils/platform";
import { useBackButton } from "@/hooks/use-backbutton";
import { Button } from "@/components/ui/button";
import { PriceChart } from "./components/PriceChart";
import PriceContainer from "./components/PriceContainer";
import TokenContainer from "./components/TokenContainer";
import TokenDetails from "./components/TokenDetails";
import Title from "./components/Title";
import { shortenString } from "@/lib/utils";

const STABLECOIN_TOKEN_IDS = new Set(["usd-coin", "tether"]);
// Chains where every form of transfer is unsupported. Currently Lisk only.
const FULLY_UNSUPPORTED_CHAINS = new Set(["1135", "lisk", "LISK"]);
const CHAIN_LABELS: Record<string, string> = {
  "1135": "Lisk",
  lisk: "Lisk",
  LISK: "Lisk",
};

export default function TokenInfo() {
  const { tokenId, chain, balance } = useParams() as {
    tokenId: string;
    chain: string;
    balance: string;
  };
  const navigate = useNavigate();
  const { isTelegram } = usePlatformDetection();
  const { tokenDetails } = useTokenDetails(tokenId);

  const isStablecoin = STABLECOIN_TOKEN_IDS.has((tokenId || "").toLowerCase());
  const isFullyBlocked =
    isStablecoin && FULLY_UNSUPPORTED_CHAINS.has(chain || "");
  const chainLabel = CHAIN_LABELS[chain] || chain;
  const tokenSymbol = (tokenId === "tether" ? "USDT" : "USDC");

  const onOpenLink = () => {
    if (isTelegram) {
      openLink(tokenDetails?.links?.homepage[0] as string);
    } else {
      window.open(tokenDetails?.links?.homepage[0] as string);
    }
  };

  const onGoBack = () => {
    navigate("/app");
  };

  useBackButton(onGoBack);

  return (
    <motion.div
      initial={{ x: -8, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="w-full h-full overflow-y-auto p-4 px-2"
    >
      <div className="fixed top-0 left-0 right-0 py-3 bg-surface z-10">
        <Button
          onClick={onGoBack}
          variant="ghost"
          className="w-9 h-9 ml-2 rounded-full bg-accent cursor-pointer"
        >
          <FiArrowLeft className="text-4xl" />
        </Button>

        <span className="absolute left-1/2 -translate-x-1/2 transform text-xl font-medium capitalize text-center">
          {tokenId?.length > 18
            ? shortenString(tokenId, { leading: 8, shorten: true })
            : tokenId}
        </span>
      </div>

      <PriceContainer id={tokenId} />

      {/* Chain-restriction notice — only Lisk stablecoins right now. */}
      {isFullyBlocked && (
        <div className="mx-2 mt-3 rounded-2xl border border-amber-300 bg-amber-50 p-3.5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-amber-900 leading-tight">
                {tokenSymbol} on {chainLabel} is not transferable
              </p>
              <p className="text-[12px] text-amber-800/90 mt-1.5 leading-snug">
                On-chain sends, conversions, withdrawals to bank/mobile money,
                and cross-border transfers don't work for this token. Move
                funds via the issuing chain to access them.
              </p>
            </div>
          </div>
        </div>
      )}

      <PriceChart tokenID={tokenId} />

      <Title title="Your Balance" />
      <TokenContainer tokenID={tokenId} userBalance={parseFloat(balance)} />

      <Title title="Info" />
      <TokenDetails tokenID={tokenId} />

      <Title title="About" />
      <p className="text-md text-text-subtle mx-2">
        {tokenDetails?.description?.en}
      </p>

      <Title title="Links" />
      <span
        onClick={onOpenLink}
        className="flex flex-row items-center justify-start gap-1 p-1 px-2 w-fit bg-secondary rounded-full text-sm font-medium text-text-default cursor-pointer"
      >
        <MdPublic className="text-xl" /> Website
      </span>
    </motion.div>
  );
}
