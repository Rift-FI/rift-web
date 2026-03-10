import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { FiArrowLeft, FiChevronDown, FiChevronUp } from "react-icons/fi";
import {
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Share2,
} from "lucide-react";
import { IoCopyOutline, IoLogoWhatsapp } from "react-icons/io5";
import { FaTelegram } from "react-icons/fa";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import useAnalytics from "@/hooks/use-analytics";
import useUser from "@/hooks/data/use-user";
import { getReferralLink } from "@/utils/referral";
import ActionButton from "@/components/ui/action-button";
import RiftLoader from "@/components/ui/rift-loader";
import {
  useReferralFeeBalance,
  useReferralFeeEntries,
  useClaimReferralFees,
  useReferralFeeClaims,
} from "@/hooks/data/use-referral-fees";

function formatTimeUntil(dateString: string): string {
  const now = new Date();
  const target = new Date(dateString);
  const diff = Math.max(0, target.getTime() - now.getTime());

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function PerpetualEarnings() {
  const navigate = useNavigate();
  const isDesktop = useDesktopDetection();
  const { logEvent } = useAnalytics();
  const { data: user } = useUser();

  const { data: balance, isLoading: balanceLoading } = useReferralFeeBalance();
  const { data: entriesData } = useReferralFeeEntries();
  const { data: claimsData } = useReferralFeeClaims();
  const claimMutation = useClaimReferralFees();

  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const referralCode = user?.referralCode || "";
  const referralLink = getReferralLink(referralCode);

  useEffect(() => {
    logEvent("PAGE_VISIT_PERPETUAL_EARNINGS");
  }, []);

  const handleClaim = async () => {
    try {
      const result = await claimMutation.mutateAsync();
      if (result.status === "COMPLETED") {
        toast.success(
          `Claimed $${result.amountUsd.toFixed(2)} to your wallet!`
        );
        logEvent("REFERRAL_FEE_CLAIMED", {
          amount_usd: result.amountUsd,
        });
      } else {
        toast.error("Claim failed. Please try again later.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to claim");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied!");
      logEvent("REFERRAL_LINK_COPIED", { source: "perpetual_earnings" });
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShareWhatsApp = () => {
    logEvent("REFERRAL_LINK_SHARED", {
      source: "perpetual_earnings",
      method: "whatsapp",
    });
    const text = encodeURIComponent(
      `Join me on Rift and start using your global dollar account! Every time you transact, I earn a little — and you get a great experience.\n\n${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleShareTelegram = () => {
    logEvent("REFERRAL_LINK_SHARED", {
      source: "perpetual_earnings",
      method: "telegram",
    });
    const text = encodeURIComponent(
      `Join me on Rift — your global dollar account for payments, transfers & more!`
    );
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`,
      "_blank"
    );
  };

  if (balanceLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-app-background">
        <RiftLoader message="Loading earnings..." size="md" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col min-h-screen bg-app-background"
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-4 ${
          isDesktop ? "border-b-0" : "border-b border-surface-subtle"
        }`}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full transition-colors hover:bg-surface-subtle"
        >
          <FiArrowLeft className="w-5 h-5 text-text-default" />
        </button>
        <h1 className="text-lg font-semibold text-text-default">
          Referral Earnings
        </h1>
        <div className="w-9" />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 overflow-y-auto ${
          isDesktop ? "p-8 max-w-4xl mx-auto w-full" : "p-4"
        }`}
      >
        {/* Hero / Balance */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
          </div>

          <p className="text-sm text-text-subtle mb-1">Unclaimed earnings</p>
          <h2
            className={`${
              isDesktop ? "text-5xl" : "text-4xl"
            } font-bold text-text-default`}
          >
            ${balance?.totalUsd.toFixed(2) ?? "0.00"}
          </h2>
          {balance && balance.entryCount > 0 && (
            <p className="text-xs text-text-subtle mt-1">
              From {balance.entryCount} transaction
              {balance.entryCount !== 1 ? "s" : ""} by your referrals
            </p>
          )}
        </div>

        {/* Claim Button */}
        <div className="mb-4">
          {balance?.canClaim ? (
            <ActionButton
              onClick={handleClaim}
              loading={claimMutation.isPending}
              disabled={!balance?.totalUsd || balance.totalUsd === 0}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <DollarSign className="w-4 h-4 mr-1" />
              {balance.totalUsd > 0
                ? "Claim earnings"
                : "Nothing to claim yet"}
            </ActionButton>
          ) : (
            <div className="bg-surface-alt rounded-2xl p-4 border border-surface-subtle text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-text-subtle" />
                <p className="text-sm font-medium text-text-default">
                  Next claim available
                </p>
              </div>
              <p className="text-lg font-bold text-accent-primary">
                {balance?.nextClaimDate
                  ? formatTimeUntil(balance.nextClaimDate)
                  : "—"}
              </p>
              <p className="text-xs text-text-subtle mt-1">
                You can claim once per week
              </p>
            </div>
          )}
        </div>

        {/* Invite Friends Section */}
        <div
          className={`bg-surface-alt rounded-2xl ${
            isDesktop ? "p-6" : "p-4"
          } mb-4 border border-surface-subtle`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="w-4 h-4 text-text-default" />
            <h3 className="text-sm font-semibold text-text-default">
              Invite friends, earn forever
            </h3>
          </div>
          <p className="text-xs text-text-subtle mb-3">
            Share your link — every time your friends send money, pay bills, or
            cash out, you earn 0.3% of each transaction. No limits, no expiry.
          </p>

          {/* Referral code */}
          {referralCode && (
            <div
              onClick={handleCopyLink}
              className="flex items-center gap-2 p-3 bg-app-background rounded-xl cursor-pointer hover:bg-surface-subtle transition-colors mb-3"
            >
              <p className="flex-1 text-sm text-text-subtle truncate">
                {referralLink}
              </p>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <IoCopyOutline className="text-emerald-600" />
              </div>
            </div>
          )}

          {/* Share buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-1.5 p-2.5 bg-app-background rounded-xl hover:bg-surface-subtle transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gray-500/10 flex items-center justify-center">
                <IoCopyOutline className="text-gray-500 text-base" />
              </div>
              <span className="text-[10px] text-text-subtle">Copy</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex flex-col items-center gap-1.5 p-2.5 bg-app-background rounded-xl hover:bg-surface-subtle transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
                <IoLogoWhatsapp className="text-green-500 text-base" />
              </div>
              <span className="text-[10px] text-text-subtle">WhatsApp</span>
            </button>

            <button
              onClick={handleShareTelegram}
              className="flex flex-col items-center gap-1.5 p-2.5 bg-app-background rounded-xl hover:bg-surface-subtle transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                <FaTelegram className="text-blue-500 text-base" />
              </div>
              <span className="text-[10px] text-text-subtle">Telegram</span>
            </button>
          </div>
        </div>

        {/* Recent Earnings */}
        {entriesData && entriesData.entries.length > 0 && (
          <div
            className={`bg-surface-alt rounded-2xl ${
              isDesktop ? "p-6" : "p-4"
            } mb-4 border border-surface-subtle`}
          >
            <h3 className="text-sm font-semibold text-text-default mb-3">
              Recent Earnings
            </h3>
            <div className="space-y-2">
              {entriesData.entries.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-app-background rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-default">
                        Referral fee
                      </p>
                      <p className="text-[10px] text-text-subtle">
                        {new Date(entry.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600">
                    +{entry.currency} {entry.amountLocal.toLocaleString()}
                  </p>
                </div>
              ))}
              {entriesData.entries.length > 5 && (
                <p className="text-xs text-text-subtle text-center pt-1">
                  +{entriesData.entries.length - 5} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Claim History */}
        {claimsData && claimsData.claims.length > 0 && (
          <div className="bg-surface-alt rounded-2xl border border-surface-subtle overflow-hidden mb-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between p-4 hover:bg-surface-subtle/50 transition-colors"
            >
              <span className="text-sm font-medium text-text-default">
                Past Claims
              </span>
              {showHistory ? (
                <FiChevronUp className="w-5 h-5 text-text-subtle" />
              ) : (
                <FiChevronDown className="w-5 h-5 text-text-subtle" />
              )}
            </button>
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-2">
                    {claimsData.claims.map((claim) => (
                      <div
                        key={claim.id}
                        className="flex items-center justify-between p-3 bg-app-background rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              claim.status === "COMPLETED"
                                ? "bg-emerald-500/10"
                                : claim.status === "PENDING"
                                ? "bg-amber-500/10"
                                : "bg-red-500/10"
                            }`}
                          >
                            {claim.status === "COMPLETED" ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            ) : claim.status === "PENDING" ? (
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-red-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-default">
                              ${claim.amountUsd.toFixed(2)} USD
                            </p>
                            <p className="text-[10px] text-text-subtle">
                              {new Date(claim.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-[10px] font-medium ${
                              claim.status === "COMPLETED"
                                ? "text-emerald-600"
                                : claim.status === "PENDING"
                                ? "text-amber-500"
                                : "text-red-500"
                            }`}
                          >
                            {claim.status === "COMPLETED"
                              ? "Sent"
                              : claim.status === "PENDING"
                              ? "Processing"
                              : "Failed"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-surface-alt rounded-2xl border border-surface-subtle overflow-hidden mb-4">
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="w-full flex items-center justify-between p-4 hover:bg-surface-subtle/50 transition-colors"
          >
            <span className="text-sm font-medium text-text-default">
              How does it work?
            </span>
            {showHowItWorks ? (
              <FiChevronUp className="w-5 h-5 text-text-subtle" />
            ) : (
              <FiChevronDown className="w-5 h-5 text-text-subtle" />
            )}
          </button>
          <AnimatePresence>
            {showHowItWorks && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3 text-sm text-text-subtle">
                  <div className="space-y-2.5">
                    {[
                      "Share your referral link with friends and family",
                      "When they sign up and start using Rift, you earn 0.3% every time they send money, pay, or cash out",
                      "Your earnings pile up — claim them once a week and it lands in your wallet",
                      "There's no cap and no expiry. As long as they keep using Rift, you keep earning",
                    ].map((text, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 text-xs flex items-center justify-center font-medium flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-app-background rounded-2xl p-3 space-y-1.5">
                    <p className="text-xs font-medium text-text-default">
                      Quick example
                    </p>
                    <p className="text-xs">
                      You refer 5 friends. They do $800 in
                      transactions this week. You earn 0.3% ={" "}
                      <span className="font-semibold text-emerald-600">
                        $2.40
                      </span>
                      . Claim it and it lands in your wallet.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer note */}
        <p className="text-xs text-text-subtle/60 text-center mt-2 mb-6">
          Earnings are from cash-out and pay transactions only.
        </p>
      </div>
    </motion.div>
  );
}
