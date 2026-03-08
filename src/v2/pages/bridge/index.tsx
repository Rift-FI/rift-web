import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { IoChevronBack, IoSwapVertical } from "react-icons/io5";
import { ChevronDown, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  useBridgeRoutes,
  useBridgeQuote,
  useBridgeExecute,
} from "@/hooks/data/use-bridge";
import useTokenBalance from "@/hooks/data/use-token-balance";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";
import ActionButton from "@/components/ui/action-button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatFloatNumber } from "@/lib/utils";

// Supported chains
const SUPPORTED_CHAINS = ["BASE", "ETHEREUM", "POLYGON", "ARBITRUM", "CELO"] as const;

const CHAIN_ID_MAP: Record<string, string> = {
  ARBITRUM: "42161",
  BASE: "8453",
  POLYGON: "137",
  ETHEREUM: "1",
  CELO: "42220",
};

const CHAIN_LABELS: Record<string, string> = {
  ARBITRUM: "Arbitrum",
  BASE: "Base",
  POLYGON: "Polygon",
  ETHEREUM: "Ethereum",
  CELO: "Celo",
};

const CHAIN_ICONS: Record<string, string> = {
  ARBITRUM: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
  BASE: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
  POLYGON: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
  ETHEREUM: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  CELO: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/celo/info/logo.png",
};

// Only USDC and USDT can be converted (same token, different chain)
const CONVERTIBLE_TOKENS = ["USDC", "USDT"] as const;

const TOKEN_ICONS: Record<string, string> = {
  USDC: "https://coin-images.coingecko.com/coins/images/6319/small/usdc.png",
  USDT: "https://coin-images.coingecko.com/coins/images/325/small/Tether.png",
};

const TOKEN_ID_MAP: Record<string, string> = {
  USDC: "usd-coin",
  USDT: "tether",
};

function getBackendId(chain: string, token: string) {
  return `${chain}-${token}`;
}

type ConvertStep = "form" | "executing" | "success" | "failed";

export default function Convert() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDesktop = useDesktopDetection();

  const initialSourceChain = searchParams.get("sourceChain") || "BASE";
  const initialDestChain = searchParams.get("destChain") || (initialSourceChain === "ETHEREUM" ? "BASE" : "ETHEREUM");
  const initialToken = searchParams.get("token") || "USDC";
  const initialAmount = searchParams.get("amount") || "";

  const [token, setToken] = useState(initialToken);
  const [sourceChain, setSourceChain] = useState(initialSourceChain);
  const [destChain, setDestChain] = useState(initialDestChain);
  const [amount, setAmount] = useState(initialAmount);
  const [step, setStep] = useState<ConvertStep>("form");
  const [txHash, setTxHash] = useState<string | null>(null);

  // Picker state
  const [pickerOpen, setPickerOpen] = useState<"token" | "sourceChain" | "destChain" | null>(null);

  // Data hooks
  const { isLoading: routesLoading } = useBridgeRoutes();
  const executeMutation = useBridgeExecute();

  // Debounced quote
  const [debouncedAmount, setDebouncedAmount] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedAmount(amount), 400);
    return () => clearTimeout(t);
  }, [amount]);

  const { data: quote, isLoading: quoteLoading } = useBridgeQuote({
    sourceChain,
    destinationChain: destChain,
    token,
    amount: debouncedAmount,
    enabled: sourceChain !== destChain,
  });

  // Balance for source chain token
  const { data: sourceBalance } = useTokenBalance({
    token: TOKEN_ID_MAP[token] || token.toLowerCase(),
    chain: CHAIN_ID_MAP[sourceChain],
    backendId: getBackendId(sourceChain, token),
  });

  const amountNum = parseFloat(amount) || 0;
  const balanceAmount = sourceBalance?.amount ?? 0;
  const insufficientBalance = amountNum > balanceAmount;
  const sameChain = sourceChain === destChain;
  const canConvert = amountNum > 0 && !insufficientBalance && !sameChain && !!sourceChain && !!destChain && !!token;

  // Available dest chains = all supported chains except source
  const destChainOptions = SUPPORTED_CHAINS.filter((c) => c !== sourceChain);

  const handleSwap = () => {
    const tmp = sourceChain;
    setSourceChain(destChain);
    setDestChain(tmp);
  };

  const handleConvert = async () => {
    if (!canConvert) return;

    setStep("executing");
    try {
      const result = await executeMutation.mutateAsync({
        sourceChain,
        destinationChain: destChain,
        token,
        amount,
      });

      if (result.timedOut) {
        toast.error("Conversion timed out. It may still complete — check your transaction history.");
        setTxHash(result.transactionHash || null);
        setStep("success");
        return;
      }

      setTxHash(result.transactionHash);
      setStep("success");
    } catch (err: any) {
      toast.error(err.message || "Conversion failed");
      setStep("form");
    }
  };

  const handleReset = () => {
    setStep("form");
    setAmount("");
    setTxHash(null);
  };

  const renderForm = () => (
    <div className="space-y-3">
      {/* Token selector */}
      <div className="flex items-center gap-2 mb-1">
        <p className="text-xs font-medium text-text-subtle">Token</p>
        <button
          onClick={() => setPickerOpen("token")}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-subtle/60 hover:bg-surface-subtle border border-border transition-colors"
        >
          <img src={TOKEN_ICONS[token]} alt="" className="w-5 h-5 rounded-full" />
          <span className="text-sm font-semibold text-text-default">{token}</span>
          <ChevronDown className="w-3.5 h-3.5 text-text-subtle" />
        </button>
      </div>

      {/* FROM card */}
      <div className="rounded-2xl bg-surface-subtle/60 border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-text-subtle">From</p>
          <button
            onClick={() => setPickerOpen("sourceChain")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-app-background hover:bg-surface-subtle border border-border transition-colors"
          >
            {CHAIN_ICONS[sourceChain] && (
              <img src={CHAIN_ICONS[sourceChain]} alt="" className="w-5 h-5 rounded-full" />
            )}
            <span className="text-sm font-medium text-text-default">{CHAIN_LABELS[sourceChain]}</span>
            <ChevronDown className="w-3.5 h-3.5 text-text-subtle" />
          </button>
        </div>
        <input
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-app-background rounded-xl px-3 py-3 border border-border outline-none text-lg font-semibold text-text-default placeholder:text-text-subtle/40"
        />
        <div className="flex items-center justify-end gap-1.5 mt-1.5">
          <p className="text-xs text-text-subtle">
            Bal: {formatFloatNumber(balanceAmount)} {token}
          </p>
          <button
            onClick={() => setAmount(formatFloatNumber(balanceAmount).toString())}
            className="text-xs font-medium text-accent-primary"
          >
            Max
          </button>
        </div>
      </div>

      {/* Swap button */}
      <div className="flex justify-center -my-1 z-10 relative">
        <button
          onClick={handleSwap}
          className="p-2.5 rounded-full bg-surface border-2 border-border hover:bg-surface-subtle transition-colors active:scale-95 shadow-sm"
        >
          <IoSwapVertical className="w-4.5 h-4.5 text-accent-primary" />
        </button>
      </div>

      {/* TO card */}
      <div className="rounded-2xl bg-surface-subtle/60 border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-text-subtle">To</p>
          <button
            onClick={() => setPickerOpen("destChain")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-app-background hover:bg-surface-subtle border border-border transition-colors"
          >
            {CHAIN_ICONS[destChain] && (
              <img src={CHAIN_ICONS[destChain]} alt="" className="w-5 h-5 rounded-full" />
            )}
            <span className="text-sm font-medium text-text-default">{CHAIN_LABELS[destChain]}</span>
            <ChevronDown className="w-3.5 h-3.5 text-text-subtle" />
          </button>
        </div>
        <div className="w-full bg-app-background rounded-xl px-3 py-3 border border-border">
          {quoteLoading && amountNum > 0 ? (
            <div className="flex items-center gap-2 text-lg text-text-subtle">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Fetching quote...</span>
            </div>
          ) : quote && amountNum > 0 && !sameChain ? (
            <p className="text-lg font-semibold text-text-default">{quote.outputAmount} {token}</p>
          ) : (
            <p className="text-lg font-semibold text-text-subtle/30">0.00</p>
          )}
        </div>
      </div>

      {/* Errors */}
      {sameChain && amount && (
        <p className="text-sm text-danger font-medium px-1">Source and destination chain must be different</p>
      )}
      {insufficientBalance && amount && !sameChain && (
        <p className="text-sm text-danger font-medium px-1">Insufficient {token} balance</p>
      )}

      {/* Quote details */}
      <AnimatePresence>
        {quote && !quoteLoading && amountNum > 0 && !sameChain && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl bg-accent-primary/5 border border-accent-primary/10 p-3 space-y-1.5"
          >
            <div className="flex justify-between text-sm">
              <span className="text-text-subtle">Fee</span>
              <span className="text-text-subtle">{quote.fee} {token} ({(quote.feeBps / 100).toFixed(2)}%)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-subtle">Est. time</span>
              <span className="text-text-subtle">{quote.estimatedTime}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Convert button */}
      <ActionButton
        onClick={handleConvert}
        disabled={!canConvert || quoteLoading}
        variant="secondary"
        className="w-full rounded-2xl font-medium"
      >
        {routesLoading ? "Loading..." : "Convert"}
      </ActionButton>

      {/* Token picker */}
      <Drawer open={pickerOpen === "token"} onClose={() => setPickerOpen(null)} onOpenChange={(o) => !o && setPickerOpen(null)}>
        <DrawerContent className="bg-surface">
          <DrawerHeader className="p-4">
            <DrawerTitle>Select Token</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-1.5">
            {CONVERTIBLE_TOKENS.map((t) => (
              <button
                key={t}
                onClick={() => { setToken(t); setPickerOpen(null); }}
                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors ${
                  t === token ? "bg-accent-primary/10 border border-accent-primary/20" : "hover:bg-surface-subtle"
                }`}
              >
                <img src={TOKEN_ICONS[t]} alt="" className="w-8 h-8 rounded-full" />
                <p className="text-sm font-medium text-text-default">{t}</p>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Source chain picker */}
      <Drawer open={pickerOpen === "sourceChain"} onClose={() => setPickerOpen(null)} onOpenChange={(o) => !o && setPickerOpen(null)}>
        <DrawerContent className="bg-surface">
          <DrawerHeader className="p-4">
            <DrawerTitle>From Chain</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-1.5">
            {SUPPORTED_CHAINS.map((chain) => (
              <button
                key={chain}
                onClick={() => {
                  setSourceChain(chain);
                  if (destChain === chain) {
                    setDestChain(SUPPORTED_CHAINS.find((c) => c !== chain) || "BASE");
                  }
                  setPickerOpen(null);
                }}
                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors ${
                  chain === sourceChain ? "bg-accent-primary/10 border border-accent-primary/20" : "hover:bg-surface-subtle"
                }`}
              >
                <img src={CHAIN_ICONS[chain]} alt="" className="w-8 h-8 rounded-full" />
                <p className="text-sm font-medium text-text-default">{CHAIN_LABELS[chain]}</p>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Dest chain picker */}
      <Drawer open={pickerOpen === "destChain"} onClose={() => setPickerOpen(null)} onOpenChange={(o) => !o && setPickerOpen(null)}>
        <DrawerContent className="bg-surface">
          <DrawerHeader className="p-4">
            <DrawerTitle>To Chain</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-1.5">
            {destChainOptions.map((chain) => (
              <button
                key={chain}
                onClick={() => { setDestChain(chain); setPickerOpen(null); }}
                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors ${
                  chain === destChain ? "bg-accent-primary/10 border border-accent-primary/20" : "hover:bg-surface-subtle"
                }`}
              >
                <img src={CHAIN_ICONS[chain]} alt="" className="w-8 h-8 rounded-full" />
                <p className="text-sm font-medium text-text-default">{CHAIN_LABELS[chain]}</p>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );

  const renderExecuting = () => (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Loader2 className="w-12 h-12 text-accent-primary animate-spin" />
      <p className="text-lg font-semibold text-text-default">Converting {token}</p>
      <p className="text-sm text-text-subtle text-center">
        {CHAIN_LABELS[sourceChain]} → {CHAIN_LABELS[destChain]}
      </p>
      <p className="text-xs text-text-subtle">This can take up to 2 minutes...</p>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <CheckCircle2 className="w-14 h-14 text-green-500" />
      <p className="text-lg font-semibold text-text-default">Conversion Initiated</p>
      <p className="text-sm text-text-subtle text-center">
        {amount} {token} from {CHAIN_LABELS[sourceChain]} → {CHAIN_LABELS[destChain]}
      </p>
      <p className="text-xs text-text-subtle text-center">
        Tokens typically arrive within 1-5 minutes.
      </p>
      {txHash && (
        <p className="text-xs text-text-subtle break-all text-center mt-2">
          Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
        </p>
      )}
      <ActionButton onClick={handleReset} variant="secondary" className="w-full rounded-2xl font-medium mt-4">
        Convert Again
      </ActionButton>
      <button onClick={() => navigate("/app/assets")} className="text-sm text-accent-primary font-medium">
        View Assets
      </button>
    </div>
  );

  const renderFailed = () => (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <XCircle className="w-14 h-14 text-red-500" />
      <p className="text-lg font-semibold text-text-default">Conversion Failed</p>
      <p className="text-sm text-text-subtle text-center">
        Something went wrong. Your funds are safe.
      </p>
      <ActionButton onClick={handleReset} variant="secondary" className="w-full rounded-2xl font-medium mt-4">
        Try Again
      </ActionButton>
    </div>
  );

  const content = (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      {!isDesktop && (
        <div className="flex-shrink-0 z-40 bg-surface backdrop-blur-sm border-b border-surface-alt">
          <div className="flex items-center gap-3 p-4">
            <button
              onClick={() => navigate("/app/assets")}
              className="p-1.5 hover:bg-surface-subtle rounded-xl transition-colors"
            >
              <IoChevronBack className="w-5 h-5 text-text-default" />
            </button>
            <h1 className="text-lg font-semibold text-text-default">Convert</h1>
          </div>
        </div>
      )}

      {isDesktop && (
        <div className="flex-shrink-0 bg-white rounded-2xl p-6 mx-8 mt-8 mb-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/app/assets")}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <IoChevronBack className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Convert</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 ml-11">Move USDC or USDT between chains</p>
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 overflow-y-auto ${isDesktop ? "px-8 pb-8" : "px-4 pb-4 pt-4"}`}>
        <div className={isDesktop ? "max-w-lg mx-auto" : ""}>
          {step === "form" && renderForm()}
          {step === "executing" && renderExecuting()}
          {step === "success" && renderSuccess()}
          {step === "failed" && renderFailed()}
        </div>
      </div>
    </motion.div>
  );

  if (isDesktop) {
    return (
      <DesktopPageLayout maxWidth="lg" className="h-full">
        {content}
      </DesktopPageLayout>
    );
  }

  return <div className="h-full flex flex-col bg-app-background">{content}</div>;
}
