import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { FiArrowLeft, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { Crown, Trophy, Users, Clock, Gift, Zap } from "lucide-react";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import useAnalytics from "@/hooks/use-analytics";
import useWeeklyPool, { getCountdownToSunday } from "@/hooks/data/use-weekly-pool";
import RiftLoader from "@/components/ui/rift-loader";

export default function WeeklyPool() {
  const navigate = useNavigate();
  const isDesktop = useDesktopDetection();
  const { logEvent } = useAnalytics();
  const { data: pool, isLoading } = useWeeklyPool();
  const [countdown, setCountdown] = useState(getCountdownToSunday());
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    logEvent("PAGE_VISIT_WEEKLY_POOL");
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => setCountdown(getCountdownToSunday()),
      1000
    );
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !pool) {
    return (
      <div className="flex items-center justify-center h-screen bg-app-background">
        <RiftLoader message="Loading pool..." size="md" />
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
          Weekly Pool
        </h1>
        <div className="w-9" />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 overflow-y-auto ${
          isDesktop ? "p-8 max-w-4xl mx-auto w-full" : "p-4"
        }`}
      >
        {/* Prize Section */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-warning/30 to-warning/10 flex items-center justify-center"
          >
            <Trophy className="w-10 h-10 text-warning" />
          </motion.div>

          <h2
            className={`${
              isDesktop ? "text-5xl" : "text-4xl"
            } font-bold text-text-default mb-1`}
          >
            ${pool.prizeAmount}
          </h2>
          <p className="text-sm text-text-subtle">This week's prize</p>

          <div className="flex items-center justify-center gap-1 mt-2">
            <Users className="w-3.5 h-3.5 text-text-subtle" />
            <span className="text-xs text-text-subtle">
              {pool.qualifiedParticipants} qualified of{" "}
              {pool.totalParticipants} participants
            </span>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-2xl p-4 mb-4 border border-accent-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-default">
                Next Draw
              </p>
              <p className="text-xs text-text-subtle">Sunday at midnight</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { value: countdown.days, label: "Days" },
              { value: countdown.hours, label: "Hours" },
              { value: countdown.minutes, label: "Mins" },
              { value: countdown.seconds, label: "Secs" },
            ].map((item) => (
              <div key={item.label} className="bg-white/50 rounded-2xl p-2">
                <p className="text-xl font-bold text-accent-primary">
                  {item.value}
                </p>
                <p className="text-xs text-text-subtle">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Your Progress Card */}
        {pool.user && (
          <div
            className={`bg-surface-alt rounded-2xl ${
              isDesktop ? "p-6" : "p-4"
            } mb-4 border border-surface-subtle`}
          >
            <h3 className="text-sm font-semibold text-text-default mb-4">
              Your Progress
            </h3>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text-subtle">
                  $
                  {pool.user.effectiveVolume.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}{" "}
                  used{pool.user.multiplier > 1 ? " (with boost)" : ""}
                </span>
                <span className="text-text-subtle">$50 to qualify</span>
              </div>
              <div className="w-full h-3 bg-surface rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pool.user.progressPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    pool.user.isQualified
                      ? "bg-gradient-to-r from-success to-success/80"
                      : "bg-gradient-to-r from-accent-primary to-accent-primary/80"
                  }`}
                />
              </div>

              {pool.user.progressPercent >= 70 && !pool.user.isQualified && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-warning font-medium mt-1.5"
                >
                  Almost there! $
                  {(
                    pool.user.qualificationThreshold - pool.user.effectiveVolume
                  ).toLocaleString()}{" "}
                  more to qualify
                </motion.p>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xs text-text-subtle mb-1">Volume</p>
                <p className="text-sm font-semibold text-text-default">
                  ${pool.user.transactionVolume.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-subtle mb-1">Multiplier</p>
                <div className="flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3 text-warning" />
                  <p className="text-sm font-semibold text-warning">
                    {pool.user.multiplier.toFixed(1)}x
                  </p>
                </div>
                <p className="text-[10px] text-text-subtle">
                  {pool.user.referralCount} friend
                  {pool.user.referralCount !== 1 ? "s" : ""} invited
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-subtle mb-1">Status</p>
                {pool.user.isQualified ? (
                  <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-success/10 text-success rounded-full">
                    Qualified
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-surface text-text-subtle rounded-full">
                    {pool.user.progressPercent}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div
          className={`bg-surface-alt rounded-2xl ${
            isDesktop ? "p-6" : "p-4"
          } mb-4 border border-surface-subtle`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-default">
              Leaderboard
            </h3>
            <span className="text-xs text-text-subtle">Top 10</span>
          </div>

          <div className="space-y-2">
            {pool.leaderboard.map((entry, index) => (
              <motion.div
                key={entry.rank}
                initial={{ x: 4, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  entry.isCurrentUser
                    ? "bg-accent-primary/10 border border-accent-primary/20"
                    : "bg-app-background"
                }`}
              >
                {/* Rank */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    entry.rank === 1
                      ? "bg-warning/20"
                      : entry.rank === 2
                      ? "bg-gray-200"
                      : entry.rank === 3
                      ? "bg-amber-100"
                      : "bg-surface"
                  }`}
                >
                  {entry.rank === 1 ? (
                    <Crown className="w-3.5 h-3.5 text-warning" />
                  ) : (
                    <span className="text-xs font-semibold text-text-subtle">
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      entry.isCurrentUser
                        ? "text-accent-primary"
                        : "text-text-default"
                    }`}
                  >
                    {entry.displayName}
                  </p>
                </div>

                {/* Volume */}
                <p className="text-sm font-semibold text-text-default">
                  ${entry.effectiveVolume.toLocaleString()}
                </p>

                {/* Qualified dot */}
                {entry.isQualified && (
                  <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-surface-alt rounded-2xl border border-surface-subtle overflow-hidden mb-4">
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="w-full flex items-center justify-between p-4 hover:bg-surface-subtle/50 transition-colors"
          >
            <span className="text-sm font-medium text-text-default">
              How does Weekly Pool work?
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
                      "Use at least $50 this week (swaps, sends, payments, top-ups — it all counts)",
                      "Invite friends — if they use $50 total between them, you get a 1.2x boost for each friend",
                      "Every Sunday at midnight, one lucky winner is picked from everyone who qualified",
                      "$10 USD goes straight to the winner's wallet",
                    ].map((text, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-accent-primary/20 text-accent-primary text-xs flex items-center justify-center font-medium flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-app-background rounded-2xl p-3 space-y-2">
                    <p className="text-xs font-medium text-text-default">
                      How the referral boost works
                    </p>
                    <p className="text-xs">
                      Invite friends using your referral link. Once your
                      friends use <span className="font-semibold">$50 in total</span> between
                      them, you unlock a boost — 1.2x for each friend who's
                      been active. The more friends, the bigger the boost.
                    </p>
                    <p className="text-xs">
                      <span className="font-medium text-text-default">Example:</span>{" "}
                      You use $40 and have 2 active friends →
                      $40 x 1.44 ={" "}
                      <span className="font-semibold text-accent-primary">
                        $57.60
                      </span>{" "}
                      — that's enough to qualify!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Past Winners */}
        <div
          className={`bg-surface-alt rounded-2xl ${
            isDesktop ? "p-6" : "p-4"
          } mb-4 border border-surface-subtle`}
        >
          <h3 className="text-sm font-semibold text-text-default mb-3">
            Past Winners
          </h3>
          <div className="space-y-3">
            {pool.pastWinners.map((winner, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-default">
                    {winner.displayName}
                  </p>
                  <p className="text-xs text-text-subtle">
                    {winner.weekLabel}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5 text-success" />
                  <span className="text-sm font-semibold text-success">
                    ${winner.prizeAmount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-text-subtle/60 text-center mt-2 mb-6">
          Winner is selected randomly from qualified participants. $10 prize
          paid in USD.
        </p>
      </div>
    </motion.div>
  );
}
