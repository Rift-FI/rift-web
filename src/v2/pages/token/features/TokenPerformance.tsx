import React from "react";
import { colors } from "@/constants";
import TokenRow from "../components/TokenRow";

interface TokenPerformanceProps {
  volume: number;
  trades: number;
  traders: number;
}

interface TokenRowItem {
  title: string;
  value: string | number;
  extras?: string;
}

function TokenPerformance({ volume, trades, traders }: TokenPerformanceProps) {
  const performanceDetails: TokenRowItem[] = [
    {
      title: "Volume",
      value: volume.toLocaleString(),
    },
    {
      title: "Trades",
      value: trades.toLocaleString(),
    },
    {
      title: "Traders",
      value: traders.toLocaleString(),
    },
  ];
  return (
    <div className="flex flex-col gap-1 bg-accent rounded-md p-2 mx-2">
      {performanceDetails.map((detail, index) => (
        <div
          className="border-b border-primary"
          style={{
            borderBottomWidth: performanceDetails.length - 1 === index ? 0 : 1,
            borderColor: colors.divider,
          }}
        >
          <TokenRow key={index} title={detail.title} value={detail.value} />
        </div>
      ))}
    </div>
  );
}

export default TokenPerformance;
