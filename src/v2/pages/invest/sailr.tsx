import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  FiArrowLeft,
  FiChevronDown,
  FiChevronUp,
  FiExternalLink,
  FiRefreshCw,
} from "react-icons/fi";
import { IoWalletOutline } from "react-icons/io5";
import { CgSpinner } from "react-icons/cg";
import { Check, X, AlertCircle } from "lucide-react";
import ActionButton from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import useSailrBalance from "@/hooks/data/use-sailr-balance";
import { useBuySailr, useSellSailr, useSellUSDe } from "@/hooks/data/use-sailr-trade";

type TradeMode = "buy" | "sell" | "withdraw" | null;
type TradeStep = "input" | "quote" | "executing" | "success" | "failed";

export default function SailrDetail() {
  const navigate = useNavigate();
  const [showExplanation, setShowExplanation] = useState(false);
  const [tradeMode, setTradeMode] = useState<TradeMode>(null);
  const [tradeStep, setTradeStep] = useState<TradeStep>("input");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch balances
  const {
    data: balances,
    isLoading: balancesLoading,
    refetch: refetchBalances,
  } = useSailrBalance();

  // Trading hooks
  const {
    getQuote: getBuyQuote,
    executeBuy,
    quote: buyQuote,
    loading: buyLoading,
    error: buyError,
    clearQuote: clearBuyQuote,
  } = useBuySailr();

  const {
    getQuote: getSellQuote,
    executeSell,
    quote: sellQuote,
    loading: sellLoading,
    error: sellError,
    clearQuote: clearSellQuote,
  } = useSellSailr();

  const {
    getQuote: getWithdrawQuote,
    executeSell: executeWithdraw,
    quote: withdrawQuote,
    loading: withdrawLoading,
    error: withdrawError,
    clearQuote: clearWithdrawQuote,
  } = useSellUSDe();

  const isLoading = buyLoading || sellLoading || withdrawLoading;
  const error = buyError || sellError || withdrawError;
  const quote = tradeMode === "buy" ? buyQuote : tradeMode === "sell" ? sellQuote : withdrawQuote;

  // Handle refresh with animation
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchBalances();
    // Keep spinning for at least 1 second for visual feedback
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Open trade drawer
  const openTradeDrawer = (mode: TradeMode) => {
    setTradeMode(mode);
    setTradeStep("input");
    setAmount("");
    setTxHash(null);
    clearBuyQuote();
    clearSellQuote();
    clearWithdrawQuote();
  };

  // Close trade drawer
  const closeTradeDrawer = () => {
    setTradeMode(null);
    setTradeStep("input");
    setAmount("");
    setTxHash(null);
    clearBuyQuote();
    clearSellQuote();
    clearWithdrawQuote();
  };

  // Handle get quote
  const handleGetQuote = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    let result;
    if (tradeMode === "buy") {
      result = await getBuyQuote(numAmount);
    } else if (tradeMode === "sell") {
      result = await getSellQuote(numAmount);
    } else if (tradeMode === "withdraw") {
      result = await getWithdrawQuote(numAmount);
    }

    if (result) {
      setTradeStep("quote");
    }
  };

  // Handle execute trade
  const handleExecuteTrade = async () => {
    const numAmount = parseFloat(amount);
    setTradeStep("executing");

    try {
      let result;
      if (tradeMode === "buy") {
        result = await executeBuy(numAmount);
      } else if (tradeMode === "sell") {
        result = await executeSell(numAmount, true);
      } else if (tradeMode === "withdraw") {
        result = await executeWithdraw(numAmount, true);
      }

      if (result) {
        setTxHash(result.swapTransactions?.[0] || null);
        setTradeStep("success");
        // Refresh balances
        setTimeout(() => refetchBalances(), 3000);
      }
    } catch (err) {
      setTradeStep("failed");
    }
  };

  // Get explorer URL based on trade type
  const getExplorerUrl = (hash: string) => {
    if (tradeMode === "buy") {
      return `https://explorer.berachain.com/tx/${hash}`;
    }
    return `https://basescan.org/tx/${hash}`;
  };

  // Get drawer title based on trade mode
  const getDrawerTitle = () => {
    switch (tradeMode) {
      case "buy":
        return "Buy SAILR";
      case "sell":
        return "Sell SAILR";
      case "withdraw":
        return "Withdraw Dividends";
      default:
        return "";
    }
  };

  // Get success message based on trade mode
  const getSuccessMessage = () => {
    switch (tradeMode) {
      case "buy":
        return "SAILR tokens will be delivered to your EOA on Berachain";
      case "sell":
        return "USDC has been transferred to your smart wallet on Base";
      case "withdraw":
        return "Your dividends have been converted to USDC and transferred to your wallet";
      default:
        return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col min-h-screen bg-app-background"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-surface-subtle">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-surface-subtle transition-colors"
        >
          <FiArrowLeft className="w-5 h-5 text-text-default" />
        </button>
        <h1 className="text-lg font-semibold text-text-default">Sail.r</h1>
        <a
          href="https://www.liquidroyalty.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 -mr-2 rounded-full hover:bg-surface-subtle transition-colors"
        >
          <FiExternalLink className="w-5 h-5 text-text-subtle" />
        </a>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {/* Logo & Balance */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-black flex items-center justify-center shadow-lg">
            <img
              src="https://www.liquidroyalty.com/sailr_logo.svg"
              alt="Sail.r"
              className="w-14 h-14 object-contain"
            />
          </div>
          {balancesLoading ? (
            <div className="flex items-center justify-center gap-2">
              <CgSpinner className="animate-spin text-accent-primary" />
              <span className="text-text-subtle">Loading balance...</span>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-text-default mb-1">
                {balances?.sailrFormatted || "0"} SAILR
              </h2>
              <p className="text-sm text-text-subtle">Your Balance</p>
            </>
          )}
        </div>

        {/* Dividends Card */}
        <div className="bg-surface-alt rounded-xl p-4 mb-6 border border-surface-subtle">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-subtle">Total Dividends</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-green-500">
                {balances?.usdeFormatted || "0"} USDe
              </span>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || balancesLoading}
                className="p-1 rounded-full hover:bg-surface-subtle transition-colors disabled:opacity-50"
                title="Refresh balances"
              >
                <FiRefreshCw
                  className={`w-4 h-4 text-accent-primary ${
                    isRefreshing || balancesLoading ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>
          </div>
          {balances && balances.usde > 0 && (
            <button
              onClick={() => openTradeDrawer("withdraw")}
              className="mt-3 w-full py-2 px-4 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors active:scale-98"
            >
              Withdraw Dividends
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => openTradeDrawer("buy")}
            className="flex flex-col items-center gap-2 p-4 bg-accent-primary rounded-xl text-white hover:opacity-90 transition-opacity active:scale-95"
          >
            <IoWalletOutline className="w-6 h-6" />
            <span className="text-sm font-medium">Buy SAILR</span>
          </button>

          <button
            onClick={() => openTradeDrawer("sell")}
            className="flex flex-col items-center gap-2 p-4 bg-surface-alt rounded-xl text-text-default border border-surface-subtle hover:bg-surface-subtle transition-colors active:scale-95"
          >
            <IoWalletOutline className="w-6 h-6" />
            <span className="text-sm font-medium">Sell SAILR</span>
          </button>
        </div>

        {/* Collapsible Explanation */}
        <div className="bg-surface-alt rounded-xl border border-surface-subtle overflow-hidden">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full flex items-center justify-between p-4 hover:bg-surface-subtle transition-colors"
          >
            <span className="text-sm font-medium text-text-default">
              What is Sail.r?
            </span>
            {showExplanation ? (
              <FiChevronUp className="w-5 h-5 text-text-subtle" />
            ) : (
              <FiChevronDown className="w-5 h-5 text-text-subtle" />
            )}
          </button>

          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3 text-sm text-text-subtle">
                  <p>
                    Sail.r gives you royalty rights to a top Amazon seller doing
                    $15M+ in annual revenue.
                  </p>
                  <p>
                    When you own Sail.r tokens, you receive monthly dividend
                    payments based on the shop's performance.
                  </p>
                  <p>
                    <strong className="text-text-default">How it works:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Buy Sail.r tokens using USDC</li>
                    <li>Receive monthly dividends automatically</li>
                    <li>Sell tokens when you want to exit</li>
                  </ul>
                  <a
                    href="https://www.liquidroyalty.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent-primary font-medium"
                  >
                    Learn more <FiExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Disclaimer */}
        <p className="mt-6 text-xs text-text-subtle text-center">
          Investment involves risk. Not financial advice.
        </p>
      </div>

      {/* Trade Drawer */}
      <Drawer
        open={tradeMode !== null}
        onClose={closeTradeDrawer}
        onOpenChange={(open) => {
          if (!open) closeTradeDrawer();
        }}
      >
        <DrawerContent className="min-h-fit max-h-[80vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>{getDrawerTitle()}</DrawerTitle>
            <DrawerDescription>
              {tradeMode === "buy"
                ? "Purchase SAILR tokens with USDC"
                : tradeMode === "sell"
                ? "Sell your SAILR tokens for USDC"
                : "Convert your USDe dividends to USDC"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 overflow-y-auto">
            {/* Input Step */}
            {tradeStep === "input" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-text-default">
                  {getDrawerTitle()}
                </h3>

                <div className="space-y-2">
                  <label className="text-sm text-text-subtle">
                    {tradeMode === "buy"
                      ? "USDC Amount"
                      : tradeMode === "sell"
                      ? "SAILR Amount"
                      : "USDe Amount"}
                  </label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={tradeMode === "buy" ? "1.0" : tradeMode === "sell" ? "0.005" : "1.0"}
                    min="0"
                    step={tradeMode === "buy" ? "0.01" : tradeMode === "sell" ? "0.001" : "0.1"}
                    className="text-lg"
                  />
                  {tradeMode === "sell" && balances && (
                    <p className="text-xs text-text-subtle">
                      Available: {balances.sailrFormatted} SAILR
                    </p>
                  )}
                  {tradeMode === "withdraw" && balances && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-subtle">
                        Available: {balances.usdeFormatted} USDe
                      </p>
                      <button
                        type="button"
                        onClick={() => setAmount(balances.usde.toString())}
                        className="text-xs text-accent-primary font-medium hover:underline"
                      >
                        Max
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="text-xs text-text-subtle space-y-1">
                  {tradeMode === "buy" ? (
                    <>
                      <p>💡 SAILR tokens will be delivered to your EOA on Berachain</p>
                      <p>⚡ Gas fees included in total cost</p>
                    </>
                  ) : tradeMode === "sell" ? (
                    <>
                      <p>💡 SAILR must be in your EOA on Berachain</p>
                      <p>⚡ Gas fees deducted from proceeds</p>
                    </>
                  ) : (
                    <>
                      <p>💡 USDe dividends will be converted to USDC</p>
                      <p>⚡ Gas fees deducted from proceeds</p>
                    </>
                  )}
                </div>

                <ActionButton
                  onClick={handleGetQuote}
                  disabled={!amount || isLoading}
                  loading={isLoading}
                >
                  Get Quote
                </ActionButton>
              </motion.div>
            )}

            {/* Quote Step */}
            {tradeStep === "quote" && quote && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-text-default">
                  {tradeMode === "buy"
                    ? "Purchase Summary"
                    : tradeMode === "sell"
                    ? "Sale Summary"
                    : "Withdrawal Summary"}
                </h3>

                <div className="bg-surface-alt rounded-xl p-4 space-y-3">
                  {tradeMode === "buy" && buyQuote && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-subtle">USDC to Swap</span>
                        <span className="text-text-default">
                          {buyQuote.usdcToSwapFormatted}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-subtle">Gas Refund</span>
                        <span className="text-text-default">
                          {buyQuote.fees.gasRefundFormatted}
                        </span>
                      </div>
                      <div className="border-t border-surface-subtle pt-3 flex justify-between">
                        <span className="font-medium text-text-default">
                          Total Cost
                        </span>
                        <span className="font-semibold text-text-default">
                          {buyQuote.totalUsdcNeededFormatted}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-500 font-medium">
                          You'll Receive
                        </span>
                        <span className="text-green-500 font-semibold">
                          {buyQuote.estimatedSailRFormatted}
                        </span>
                      </div>
                    </>
                  )}

                  {tradeMode === "sell" && sellQuote && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-subtle">SAILR to Sell</span>
                        <span className="text-text-default">
                          {sellQuote.sailrToSellFormatted}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-subtle">Gross USDC</span>
                        <span className="text-text-default">
                          {sellQuote.estimatedUsdcGrossFormatted}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-subtle">Gas Refund</span>
                        <span className="text-red-400">
                          -{sellQuote.fees.gasRefundFormatted}
                        </span>
                      </div>
                      <div className="border-t border-surface-subtle pt-3 flex justify-between">
                        <span className="font-medium text-text-default">
                          Net USDC
                        </span>
                        <span className="font-semibold text-green-500">
                          {sellQuote.estimatedUsdcNetFormatted}
                        </span>
                      </div>
                    </>
                  )}

                  {tradeMode === "withdraw" && withdrawQuote && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-subtle">USDe to Convert</span>
                        <span className="text-text-default">
                          {withdrawQuote.usdeToSellFormatted}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-subtle">Gross USDC</span>
                        <span className="text-text-default">
                          {withdrawQuote.estimatedUsdcGrossFormatted}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-subtle">Gas Fee</span>
                        <span className="text-red-400">
                          -{withdrawQuote.fees.gasRefundFormatted}
                        </span>
                      </div>
                      {withdrawQuote.priceInfo?.effectiveRate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-text-subtle">Exchange Rate</span>
                          <span className="text-text-default">
                            {withdrawQuote.priceInfo.effectiveRate}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-surface-subtle pt-3 flex justify-between">
                        <span className="font-medium text-text-default">
                          Net USDC
                        </span>
                        <span className="font-semibold text-green-500">
                          {withdrawQuote.estimatedUsdcNetFormatted}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <ActionButton
                    variant="ghost"
                    onClick={() => setTradeStep("input")}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </ActionButton>
                  <ActionButton
                    onClick={handleExecuteTrade}
                    disabled={isLoading}
                    loading={isLoading}
                    className="flex-1"
                  >
                    {tradeMode === "buy"
                      ? "Confirm Purchase"
                      : tradeMode === "sell"
                      ? "Confirm Sale"
                      : "Confirm Withdrawal"}
                  </ActionButton>
                </div>
              </motion.div>
            )}

            {/* Executing Step */}
            {tradeStep === "executing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 space-y-4"
              >
                <CgSpinner className="w-12 h-12 text-accent-primary animate-spin" />
                <p className="text-lg font-medium text-text-default">
                  Processing Transaction...
                </p>
                <p className="text-sm text-text-subtle text-center">
                  This may take a few moments. Please don't close this screen.
                </p>
              </motion.div>
            )}

            {/* Success Step */}
            {tradeStep === "success" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-text-default">
                  {tradeMode === "buy"
                    ? "Purchase Successful!"
                    : tradeMode === "sell"
                    ? "Sale Successful!"
                    : "Withdrawal Successful!"}
                </h3>
                <p className="text-sm text-text-subtle text-center">
                  {getSuccessMessage()}
                </p>

                {txHash && (
                  <a
                    href={getExplorerUrl(txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-accent-primary text-sm font-medium hover:underline"
                  >
                    View Transaction <FiExternalLink className="w-3 h-3" />
                  </a>
                )}

                <ActionButton onClick={closeTradeDrawer} className="mt-4">
                  Done
                </ActionButton>
              </motion.div>
            )}

            {/* Failed Step */}
            {tradeStep === "failed" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-text-default">
                  Transaction Failed
                </h3>
                <p className="text-sm text-text-subtle text-center">
                  {error || "Something went wrong. Please try again."}
                </p>

                <div className="flex gap-3 w-full mt-4">
                  <ActionButton
                    variant="ghost"
                    onClick={closeTradeDrawer}
                    className="flex-1"
                  >
                    Cancel
                  </ActionButton>
                  <ActionButton
                    onClick={() => setTradeStep("input")}
                    className="flex-1"
                  >
                    Try Again
                  </ActionButton>
                </div>
              </motion.div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </motion.div>
  );
}
