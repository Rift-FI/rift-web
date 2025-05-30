import TokenRow from "../components/TokenRow";
import { IPerformanceData } from "@/hooks/token/useTokenDetails";

interface TokenPerformanceProps {
  performanceData: IPerformanceData;
}

interface TokenRowItem {
  title: string;
  value: string | number;
  extras?: string;
}

function TokenPerformance({ performanceData }: TokenPerformanceProps) {
  const performanceDetails: TokenRowItem[] = [
    {
      title: "Volume",
      value: performanceData.volume.toLocaleString(),
    },
    {
      title: "Trades",
      value: performanceData.trades.toLocaleString(),
    },
    {
      title: "Traders",
      value: performanceData.traders.toLocaleString(),
    },
  ];
  return (
    <div className="flex flex-col gap-1 bg-accent rounded-md p-2 mx-2">
      {performanceDetails.map((detail, index) => (
        <div
          className="border-b border-gray-600"
          style={{
            borderBottomWidth:
              performanceDetails.length - 1 === index ? 0 : "0.5px",
          }}
        >
          <TokenRow key={index} title={detail.title} value={detail.value} />
        </div>
      ))}
    </div>
  );
}

export default TokenPerformance;
