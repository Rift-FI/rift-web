import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { IoArrowBack, IoTrophyOutline, IoFlameOutline, IoStarOutline, IoTimeOutline } from "react-icons/io5";
import useLoyaltyStats from "@/hooks/data/use-loyalty-stats";
import useLoyaltyHistory, { LoyaltyActivity } from "@/hooks/data/use-loyalty-history";
import usePointValue from "@/hooks/data/use-point-value";
import useLeaderboard from "@/hooks/data/use-leaderboard";
import { formatNumberWithCommas } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Removed - using accent colors instead

const getTierLabel = (tier: string) => {
  return tier.replace(/_/g, " ");
};

const getRankBadge = (rank: number) => {
  switch (rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return `#${rank}`;
  }
};

const getRankStyle = (rank: number) => {
  // Top 3 get special styling with app colors
  if (rank <= 3) {
    return "bg-gradient-to-br from-accent-primary to-accent-secondary shadow-lg border-2 border-accent-primary";
  }
  return "bg-surface-alt border border-surface-subtle";
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case "OFFRAMP":
      return "💸";
    case "ONRAMP":
      return "💵";
    case "AIRTIME":
      return "📱";
    case "PAYMENT":
      return "💳";
    case "BLOCKCHAIN_TXN":
      return "⛓️";
    default:
      return "📊";
  }
};

const getActivityLabel = (type: string) => {
  switch (type) {
    case "OFFRAMP":
      return "Withdrawal";
    case "ONRAMP":
      return "Deposit";
    case "AIRTIME":
      return "Airtime Purchase";
    case "PAYMENT":
      return "Payment";
    case "BLOCKCHAIN_TXN":
      return "Blockchain Transaction";
    default:
      return type;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function Loyalty() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useLoyaltyStats();
  const { data: history, isLoading: historyLoading } = useLoyaltyHistory();
  const { data: pointValue } = usePointValue();
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard(10);

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full overflow-y-auto mb-18 p-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/app/profile")}
          className="p-2 hover:bg-surface-subtle rounded-full transition-colors"
        >
          <IoArrowBack className="w-5 h-5 text-text-default" />
        </button>
        <h1 className="text-2xl font-bold text-text-default">Rift Points</h1>
      </div>

      {/* Stats Section */}
      {statsLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      ) : stats ? (
        <div className="space-y-6 mb-8">
          {/* Main Points Card - Enhanced */}
          <div className="bg-gradient-to-br from-accent-primary to-accent-secondary p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <IoTrophyOutline className="w-6 h-6 text-white" />
              <span className="text-white/90 text-sm font-medium">
                {getTierLabel(stats.tier)}
              </span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-2">
              {formatNumberWithCommas(stats.totalPoints)}
            </h2>
            <p className="text-white/90 text-base font-medium">
              Rift Points
              {pointValue && ` • $${(stats.totalPoints * pointValue.pointValue).toFixed(2)} USD`}
            </p>
          </div>

          {/* Stats Grid - Enhanced with better spacing */}
          {(stats.currentStreak > 0 || stats.longestStreak > 0 || stats.transactionCount > 0 || stats.lastActivityDate) && (
            <div className="grid grid-cols-2 gap-3">
              {/* Current Streak - Only show if > 0 */}
              {stats.currentStreak > 0 && (
                <div className="bg-surface-alt border border-surface-subtle rounded-xl p-4 hover:border-accent-primary/50 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <IoFlameOutline className="w-5 h-5 text-accent-primary" />
                    <span className="text-text-subtle text-xs font-medium">Current Streak</span>
                  </div>
                  <p className="text-3xl font-bold text-text-default">
                    {stats.currentStreak}
                  </p>
                  <p className="text-text-subtle text-xs mt-1">
                    days in a row
                  </p>
                </div>
              )}

              {/* Longest Streak - Only show if > 0 */}
              {stats.longestStreak > 0 && (
                <div className="bg-surface-alt border border-surface-subtle rounded-xl p-4 hover:border-accent-primary/50 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <IoStarOutline className="w-5 h-5 text-accent-primary" />
                    <span className="text-text-subtle text-xs font-medium">Best Streak</span>
                  </div>
                  <p className="text-3xl font-bold text-text-default">
                    {stats.longestStreak}
                  </p>
                  <p className="text-text-subtle text-xs mt-1">
                    days record
                  </p>
                </div>
              )}

              {/* Transaction Count */}
              {stats.transactionCount > 0 && (
                <div className="bg-surface-alt border border-surface-subtle rounded-xl p-4 hover:border-accent-primary/50 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📊</span>
                    <span className="text-text-subtle text-xs font-medium">Transactions</span>
                  </div>
                  <p className="text-3xl font-bold text-text-default">
                    {stats.transactionCount}
                  </p>
                  <p className="text-text-subtle text-xs mt-1">
                    total completed
                  </p>
                </div>
              )}

              {/* Last Activity - Only show if valid date */}
              {stats.lastActivityDate && formatDate(stats.lastActivityDate) !== "Invalid Date" && (
                <div className="bg-surface-alt border border-surface-subtle rounded-xl p-4 hover:border-accent-primary/50 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <IoTimeOutline className="w-5 h-5 text-accent-primary" />
                    <span className="text-text-subtle text-xs font-medium">Last Activity</span>
                  </div>
                  <p className="text-base font-semibold text-text-default">
                    {formatDate(stats.lastActivityDate)}
                  </p>
                  <p className="text-text-subtle text-xs mt-1">
                    most recent
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <IoTrophyOutline className="w-16 h-16 text-text-subtle mx-auto mb-4 opacity-50" />
          <p className="text-text-subtle">No Rift Points yet</p>
          <p className="text-text-subtle text-sm mt-2">
            Start making transactions to earn points!
          </p>
        </div>
      )}

      {/* History Section - Enhanced */}
      <div className="mt-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-text-default">
            💰 Earning History
          </h2>
          <p className="text-xs text-text-subtle mt-1">
            Your recent points activity
          </p>
        </div>

        {historyLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <div className="space-y-3">
            {history.map((activity: LoyaltyActivity) => (
              <div
                key={activity.id}
                className="bg-surface-alt border border-surface-subtle rounded-xl p-4 hover:border-accent-primary/30 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-default">
                        {getActivityLabel(activity.type)}
                      </p>
                      <p className="text-xs text-text-subtle mt-1">
                        ${activity.transactionValue.toFixed(2)} USD
                        {activity.metadata?.currency && ` • ${activity.metadata.currency}`}
                      </p>
                      <p className="text-xs text-text-subtle/70 mt-1">
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-accent-primary">
                      +{formatNumberWithCommas(activity.pointsEarned)}
                    </p>
                    <p className="text-xs text-text-subtle">points</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-surface-alt border border-surface-subtle rounded-xl">
            <span className="text-4xl mb-3 block">📊</span>
            <p className="text-sm text-text-subtle">No earning history yet</p>
            <p className="text-xs text-text-subtle mt-1">Start transacting to earn points!</p>
          </div>
        )}
      </div>

      {/* Leaderboard Section - Enhanced with podium styling */}
      <div className="mt-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-text-default">
            🏆 Global Leaderboard
          </h2>
          <p className="text-xs text-text-subtle mt-1">
            Top users ranked by total points earned
          </p>
        </div>

        {leaderboardLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : leaderboard && leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.userId}
                className={`${getRankStyle(entry.rank)} rounded-xl p-4 flex items-center justify-between hover:scale-[1.02] transition-all`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                    entry.rank <= 3 
                      ? 'bg-white/20 text-white' 
                      : 'bg-accent/20 text-accent-primary'
                  }`}>
                    {getRankBadge(entry.rank)}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${entry.rank <= 3 ? 'text-white' : 'text-text-default'}`}>
                      User {entry.userId.substring(0, 8)}...
                    </p>
                    <p className={`text-xs ${entry.rank <= 3 ? 'text-white/80' : 'text-text-subtle'}`}>
                      {getTierLabel(entry.tier)} • ${formatNumberWithCommas(entry.totalVolume)} volume
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${entry.rank <= 3 ? 'text-white' : 'text-accent-primary'}`}>
                    {formatNumberWithCommas(entry.totalPoints)}
                  </p>
                  <p className={`text-xs ${entry.rank <= 3 ? 'text-white/70' : 'text-text-subtle'}`}>
                    points
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-surface-alt border border-surface-subtle rounded-xl">
            <span className="text-4xl mb-3 block">🏆</span>
            <p className="text-sm text-text-subtle">No leaderboard data yet</p>
            <p className="text-xs text-text-subtle mt-1">Be the first to climb the ranks!</p>
          </div>
        )}
      </div>

      {/* Info Note - Simple disclaimer */}
      <div className="mt-10 mb-6 bg-surface-alt/50 border border-surface-subtle rounded-xl p-4">
        <p className="text-xs text-text-subtle leading-relaxed">
          💡 Earn more Rift Points as you transact. Pay for stuff, redeem to cash, and more — coming soon!
        </p>
      </div>
    </motion.div>
  );
}

