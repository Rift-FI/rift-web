import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { IoArrowBack, IoTrophyOutline } from "react-icons/io5";
import useLoyaltyStats from "@/hooks/data/use-loyalty-stats";
import useLoyaltyHistory, { LoyaltyActivity } from "@/hooks/data/use-loyalty-history";
import usePointValue from "@/hooks/data/use-point-value";
import useLeaderboard from "@/hooks/data/use-leaderboard";
import { formatNumberWithCommas } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const getRankBadge = (rank: number) => {
  switch (rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return rank;
  }
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

      {/* Stats Section - Minimalist */}
      {statsLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : stats ? (
        <div className="bg-gradient-to-br from-accent-primary to-accent-secondary p-5 rounded-xl">
          <h2 className="text-4xl font-bold text-white mb-1">
            {formatNumberWithCommas(stats.totalPoints)}
          </h2>
          <p className="text-white/80 text-sm">
            Rift Points
            {pointValue && pointValue.pointValue && stats.totalPoints > 0 
              && ` • $${(stats.totalPoints * pointValue.pointValue).toFixed(2)}`}
          </p>
        </div>
      ) : (
        <div className="text-center py-8 bg-surface-alt rounded-xl">
          <p className="text-text-subtle text-sm">Start transacting to earn points</p>
        </div>
      )}

      {/* History Section - With Details */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text-default mb-3">Recent Activity</h2>

        {historyLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <div className="space-y-2">
            {history.slice(0, 5).map((activity: LoyaltyActivity) => (
              <div
                key={activity.id}
                className="bg-surface-alt rounded-lg p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-xl">{getActivityIcon(activity.type)}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-default">
                        {getActivityLabel(activity.type)}
                      </p>
                      <p className="text-xs text-text-subtle mt-0.5">
                        ${activity.transactionValue.toFixed(2)} USD
                        {activity.metadata?.currency && ` • ${activity.metadata.currency}`}
                      </p>
                      <p className="text-xs text-text-subtle/70 mt-0.5">
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent-primary">
                      +{formatNumberWithCommas(activity.pointsEarned)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-surface-alt rounded-lg">
            <p className="text-sm text-text-subtle">No activity yet</p>
          </div>
        )}
      </div>

      {/* Leaderboard Section - Minimalist */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text-default mb-3">Top Users</h2>

        {leaderboardLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : leaderboard && leaderboard.length > 0 ? (
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((entry) => (
              <div
                key={entry.userId}
                className={`rounded-lg p-3 flex items-center justify-between ${
                  entry.rank <= 3 
                    ? 'bg-gradient-to-r from-accent-primary to-accent-secondary' 
                    : 'bg-surface-alt'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${entry.rank <= 3 ? 'text-white' : 'text-text-default'}`}>
                    {getRankBadge(entry.rank)}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${entry.rank <= 3 ? 'text-white' : 'text-text-default'}`}>
                      User {entry.userId.substring(0, 8)}...
                    </p>
                    <p className={`text-xs ${entry.rank <= 3 ? 'text-white/70' : 'text-text-subtle'}`}>
                      ${formatNumberWithCommas(entry.totalVolume)} transacted
                    </p>
                  </div>
                </div>
                <p className={`text-sm font-bold ${entry.rank <= 3 ? 'text-white' : 'text-accent-primary'}`}>
                  {formatNumberWithCommas(entry.totalPoints)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-surface-alt rounded-lg">
            <p className="text-sm text-text-subtle">No data yet</p>
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="mt-8 mb-6 bg-surface-alt rounded-lg p-3">
        <p className="text-xs text-text-subtle text-center">
          Earn points as you transact. Redeem soon! 🎉
        </p>
      </div>
    </motion.div>
  );
}

