import React, { useMemo } from "react";
import { FaSpinner } from "react-icons/fa6";
import { useTokenDetails } from "@/hooks/token/useTokenDetails";
import TokenRow from "./TokenRow";
import { TokenDetails as TokenInfo } from "@/hooks/token/useTokenDetails";
import { formatNumberUsd, shortenString } from "@/lib/utils";

interface TokenDetailsProps {
  readonly tokenID: string;
}

interface TokenRowData {
  readonly title: string;
  readonly value: string | number;
  readonly id: string;
}

const DETAIL_FIELDS = [
  {
    key: "symbol",
    title: "Symbol",
    transform: (data: TokenInfo) => data.symbol.toUpperCase(),
  },
  {
    key: "name",
    title: "Name",
    transform: (data: TokenInfo) =>
      data.name?.length > 18
        ? shortenString(data.name, { leading: 8, shorten: true })
        : data.name,
  },
  {
    key: "rank",
    title: "Market Cap Rank",
    transform: (data: TokenInfo) => data.market_cap_rank,
  },
  {
    key: "price",
    title: "Current Price",
    transform: (data: TokenInfo) =>
      formatNumberUsd(data.market_data.current_price.usd || 0),
  },
  {
    key: "pricechange",
    title: "24 Hour Price Change",
    transform: (data: TokenInfo) =>
      formatNumberUsd(data.market_data.price_change_24h_in_currency.usd || 0),
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
  {
    key: "cap",
    title: "Market Cap",
    transform: (data: TokenInfo) =>
      formatNumberUsd(data.market_data.market_cap.usd || 0),
  },
] as const;

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
  <div className="flex flex-col gap-1 rounded-2xl mx-2 bg-accent">
    {details.map((detail, index) => (
      <div
        key={detail.id}
        className="border-b border-app-background last:border-b-0"
        style={{
          borderBottomWidth: details.length - 1 === index ? 0 : "0.5px",
        }}
      >
        <TokenRow title={detail.title} value={detail.value} />
      </div>
    ))}
  </div>
));

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

const TokenDetails: React.FC<TokenDetailsProps> = ({ tokenID }) => {
  const { tokenDetails, isLoadingTokenDetails, errorTokenDetails } =
    useTokenDetails(tokenID);

  const detailsData = useTokenDetailsData(tokenDetails);

  if (isLoadingTokenDetails) {
    return <LoadingState />;
  }

  if (errorTokenDetails) {
    return (
      <ErrorState
        error={errorTokenDetails.message || "Unknown error occurred"}
      />
    );
  }

  if (!tokenDetails || "status" in tokenDetails) {
    return <ErrorState error="Token details are not available" />;
  }

  if (detailsData.length === 0) {
    return <ErrorState error="No token details found" />;
  }

  return <TokenDetailsList details={detailsData} />;
};

LoadingState.displayName = "TokenDetails.LoadingState";
ErrorState.displayName = "TokenDetails.ErrorState";
TokenDetailsList.displayName = "TokenDetails.TokenDetailsList";
TokenDetails.displayName = "TokenDetails";

export default TokenDetails;
