import React, { useMemo } from "react";
import { FaSpinner } from "react-icons/fa6";
import TokenRow from "../components/TokenRow";
import { useTokenDetails } from "@/hooks/token/useTokenDetails";

// Types
interface TokenDetailsProps {
  readonly tokenID: string;
}

interface TokenRowData {
  readonly title: string;
  readonly value: string | number;
  readonly id: string; // For stable keys
}

interface TokenMarketData {
  readonly current_price: {
    readonly usd: number;
  };
  readonly price_change_percentage_24h: number;
  readonly price_change_24h_in_currency: {
    readonly usd: number;
  };
  readonly total_supply?: number;
  readonly circulating_supply?: number;
  readonly max_supply?: number;
}

interface TokenInfo {
  readonly id: string;
  readonly symbol: string;
  readonly name: string;
  readonly market_data: TokenMarketData;
}

// Constants
const DETAIL_FIELDS = [
  {
    key: "symbol",
    title: "Symbol",
    transform: (data: TokenInfo) => data.symbol.toUpperCase(),
  },
  { key: "name", title: "Name", transform: (data: TokenInfo) => data.name },
  {
    key: "decimals",
    title: "Decimals",
    transform: (data: TokenInfo) => data.market_data.total_supply || 0,
  },
  {
    key: "totalSupply",
    title: "Total Supply",
    transform: (data: TokenInfo) =>
      data.market_data.total_supply?.toLocaleString() || "N/A",
  },
  {
    key: "circulatingSupply",
    title: "Circulating Supply",
    transform: (data: TokenInfo) =>
      data.market_data.circulating_supply?.toLocaleString() || "N/A",
  },
  {
    key: "maxSupply",
    title: "Max Supply",
    transform: (data: TokenInfo) =>
      data.market_data.max_supply?.toLocaleString() || "N/A",
  },
] as const;

// Components
const LoadingState: React.FC = React.memo(() => (
  <div className="flex justify-center items-center bg-accent rounded-md p-4 mx-2">
    <FaSpinner
      className="animate-spin text-primary"
      size={20}
      aria-label="Loading token details"
    />
    <span className="sr-only">Loading token details...</span>
  </div>
));

const ErrorState: React.FC<{
  error?: string;
}> = React.memo(({ error }) => (
  <div className="flex justify-center items-center bg-accent rounded-md p-4 mx-2">
    <div className="text-center">
      <p className="text-danger text-sm" role="alert">
        Error loading token details
      </p>
      {error && <p className="text-danger text-xs mt-1">{error}</p>}
    </div>
  </div>
));

const TokenDetailsList: React.FC<{
  details: TokenRowData[];
}> = React.memo(({ details }) => (
  <div className="flex flex-col gap-1 rounded-2xl px-2 mx-2 bg-accent">
    {details.map((detail, index) => (
      <div
        key={detail.id}
        className="border-b border-surface-subtle last:border-b-0"
        style={{
          borderBottomWidth: details.length - 1 === index ? 0 : "0.5px",
        }}
      >
        <TokenRow title={detail.title} value={detail.value} />
      </div>
    ))}
  </div>
));

// Custom hook for data transformation
const useTokenDetailsData = (tokenInfo: TokenInfo | null): TokenRowData[] => {
  return useMemo(() => {
    if (!tokenInfo) return [];

    return DETAIL_FIELDS.map((field) => ({
      id: field.key,
      title: field.title,
      value: field.transform(tokenInfo),
    }));
  }, [tokenInfo]);
};

// Main Component
const TokenDetails: React.FC<TokenDetailsProps> = ({ tokenID }) => {
  const { tokenDetails, isLoadingTokenDetails, errorTokenDetails } =
    useTokenDetails(tokenID);

  const detailsData = useTokenDetailsData(tokenDetails);

  // Loading state
  if (isLoadingTokenDetails) {
    return <LoadingState />;
  }

  // Error state
  if (errorTokenDetails) {
    return (
      <ErrorState
        error={errorTokenDetails.message || "Unknown error occurred"}
      />
    );
  }

  // Data validation
  if (!tokenDetails || "status" in tokenDetails) {
    return <ErrorState error="Token details are not available" />;
  }

  // Empty state
  if (detailsData.length === 0) {
    return <ErrorState error="No token details found" />;
  }

  return <TokenDetailsList details={detailsData} />;
};

// Set display names for better debugging
LoadingState.displayName = "TokenDetails.LoadingState";
ErrorState.displayName = "TokenDetails.ErrorState";
TokenDetailsList.displayName = "TokenDetails.TokenDetailsList";
TokenDetails.displayName = "TokenDetails";

export default TokenDetails;
