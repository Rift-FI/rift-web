import { colors } from "@/constants";

interface BalanceContainerProps {
  balance: string;
  usdPriceChange: number;
  percentPriceChange: number;
}

function BalanceContainer({
  balance,
  usdPriceChange,
  percentPriceChange,
}: BalanceContainerProps) {
  const isPositive = usdPriceChange > 0;
  let usdPriceChangeDisplay;
  let percentPriceChangeDisplay;
  if (!isPositive) {
    const usdPrice = usdPriceChange.toString().replace("-", "");
    const percentPrice = percentPriceChange.toString().replace("-", "");
    usdPriceChangeDisplay = `-$${usdPrice}`;
    percentPriceChangeDisplay = `-${percentPrice}%`;
  } else {
    usdPriceChangeDisplay = `$${usdPriceChange}`;
    percentPriceChangeDisplay = `${percentPriceChange}%`;
  }
  return (
    <div className="w-full flex flex-col items-center justify center mt-16">
      <p
        className={`text-5xl font-bold`}
        style={{
          color: colors.textprimary,
        }}
      >
        ${balance}
      </p>
      <div className="flex flex-row items-center justify-center my-2">
        <p
          className={`text-xl font-semibold text-center `}
          style={{
            color: isPositive ? colors.success : colors.danger,
          }}
        >
          {usdPriceChangeDisplay}
        </p>
        <p
          className={`text-sm font-semibold mx-1 rounded-sm py.5 px-1`}
          style={{
            color: colors.primary,
            backgroundColor: isPositive ? colors.success : colors.danger,
          }}
        >
          {percentPriceChangeDisplay}
        </p>
      </div>
    </div>
  );
}

export default BalanceContainer;
