import React, { useState, useMemo, useCallback } from "react";
import { FaSpinner } from "react-icons/fa6";
import { useTokenActivity } from "@/hooks/token/useTokenActivity";
import { useTokenDetails } from "@/hooks/token/useTokenDetails";

// Types
interface TokenActivityProps {
  readonly tokenID: string;
}

interface ActivityTransaction {
  readonly transaction_hash: string;
  readonly amount: string;
  readonly recipient_address: string;
  readonly created_at: string;
  readonly token: string;
  readonly chain: string;
  readonly user_email: string;
}

interface TokenImage {
  readonly small: string;
}

interface TokenInfo {
  readonly name: string;
  readonly symbol: string;
  readonly image?: TokenImage;
}

interface ActivityItemProps {
  readonly activity: ActivityTransaction;
  readonly tokenInfo: TokenInfo;
}

interface PaginationConfig {
  readonly limit: number;
  readonly page: number;
}

// Constants
const DEFAULT_PAGINATION: PaginationConfig = {
  limit: 20,
  page: 1,
} as const;

const ADDRESS_DISPLAY_CONFIG = {
  prefixLength: 6,
  suffixLength: 4,
} as const;

// Utility functions
const formatAddress = (address: string): string => {
  const { prefixLength, suffixLength } = ADDRESS_DISPLAY_CONFIG;
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
};

const getTokenImageUrl = (tokenInfo: TokenInfo): string => {
  return (
    tokenInfo.image?.small ||
    `https://via.placeholder.com/44x44?text=${tokenInfo.symbol.charAt(0)}`
  );
};

// Components
const LoadingState: React.FC = React.memo(() => (
  <div className="flex items-center justify-center flex-col mb-32">
    <FaSpinner
      className="animate-spin text-primary"
      size={20}
      aria-label="Loading token activity"
    />
    <span className="sr-only">Loading token activity...</span>
  </div>
));

const ErrorState: React.FC<{
  title: string;
  message: string;
}> = React.memo(({ title, message }) => (
  <div className="flex items-center justify-center flex-col mb-32">
    <h1 className="text-lg font-bold" role="alert">
      {title}
    </h1>
    <p className="text-xs text-gray-500">{message}</p>
  </div>
));

const ActivityItem: React.FC<ActivityItemProps> = React.memo(
  ({ activity, tokenInfo }) => (
    <div className="mb-4 p-4 bg-secondary rounded-lg mx-2 w-full">
      <div className="flex items-center gap-2">
        <img
          src={getTokenImageUrl(tokenInfo)}
          alt={`${tokenInfo.name} logo`}
          width={44}
          height={44}
          className="rounded-2xl"
          loading="lazy"
        />
        <div>
          <p className="text-lg font-semibold text-primary">
            {activity.amount} {tokenInfo.symbol}
          </p>
          <p className="text-xs text-textsecondary font-medium mt-1">
            To: {formatAddress(activity.recipient_address)}
          </p>
        </div>
      </div>
    </div>
  )
);

const ActivityList: React.FC<{
  activities: ActivityTransaction[];
  tokenInfo: TokenInfo;
  onLoadMore: () => void;
  hasMore: boolean;
}> = React.memo(({ activities, tokenInfo, onLoadMore, hasMore }) => {
  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center mb-4">
        <p className="text-sm text-gray-400 font-medium">No activity found</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center flex-col mb-4 mx-2">
      {activities.map((activity) => (
        <ActivityItem
          key={activity.transaction_hash}
          activity={activity}
          tokenInfo={tokenInfo}
        />
      ))}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center justify-center">
          {hasMore && (
            <button
              className="text-sm text-textsecondary font-medium hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent-secondary rounded px-2 py-1"
              onClick={onLoadMore}
              aria-label="Load more activities"
            >
              Load More
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// Custom hook for pagination logic
const usePagination = (
  initialConfig: PaginationConfig = DEFAULT_PAGINATION
) => {
  const [pagination, setPagination] = useState(initialConfig);

  const loadMore = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      page: prev.page + 1,
    }));
  }, []);

  const reset = useCallback(() => {
    setPagination(initialConfig);
  }, [initialConfig]);

  return {
    pagination,
    loadMore,
    reset,
  };
};

// Main Component
const TokenActivity: React.FC<TokenActivityProps> = ({ tokenID }) => {
  const { pagination, loadMore } = usePagination();

  const { tokenActivity, isLoadingTokenActivity, errorTokenActivity } =
    useTokenActivity(tokenID, pagination.limit, pagination.page);

  const { tokenDetails, isLoadingTokenDetails, errorTokenDetails } =
    useTokenDetails(tokenID);

  // Memoize computed values
  const isLoading = useMemo(
    () => isLoadingTokenActivity || isLoadingTokenDetails,
    [isLoadingTokenActivity, isLoadingTokenDetails]
  );

  const error = useMemo(
    () => errorTokenActivity || errorTokenDetails,
    [errorTokenActivity, errorTokenDetails]
  );

  const hasValidData = useMemo(
    () => tokenActivity && tokenDetails && !("status" in tokenDetails),
    [tokenActivity, tokenDetails]
  );

  const hasMoreActivities = useMemo(
    () => tokenActivity && tokenActivity.length >= pagination.limit,
    [tokenActivity, pagination.limit]
  );

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        title="Error"
        message={`Error loading token activity. ${
          error.message || "Please try again."
        }`}
      />
    );
  }

  // Data validation
  if (!hasValidData) {
    return (
      <ErrorState
        title="No Data"
        message="Unable to load token activity data."
      />
    );
  }

  // Type assertion after validation - we know these are defined at this point
  const validatedActivities = tokenActivity as ActivityTransaction[];
  const validatedTokenInfo = tokenDetails as TokenInfo;

  return (
    <ActivityList
      activities={validatedActivities}
      tokenInfo={validatedTokenInfo}
      onLoadMore={loadMore}
      hasMore={hasMoreActivities || false}
    />
  );
};

// Set display names for better debugging
LoadingState.displayName = "TokenActivity.LoadingState";
ErrorState.displayName = "TokenActivity.ErrorState";
ActivityItem.displayName = "TokenActivity.ActivityItem";
ActivityList.displayName = "TokenActivity.ActivityList";
TokenActivity.displayName = "TokenActivity";

export default TokenActivity;
