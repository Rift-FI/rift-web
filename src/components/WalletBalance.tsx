import { JSX, useCallback, useEffect, useState } from "react";
import { getEthUsdVal } from "../utils/ethusd";
import "../styles/constants.css";
import "../styles/components/walletbalance.css";

interface accBalProps {
  balInEth?: number;
}

export const WalletBalance = ({ balInEth }: accBalProps): JSX.Element => {
  const [amountInUsd, setAmountInUsd] = useState<number>(0);
  const [geckoSuccess, setGeckoSuccess] = useState<boolean>(false);

  const getEthToUsd = useCallback(async () => {
    const res = await getEthUsdVal(balInEth);
    setAmountInUsd(res.ethInUSD);
    setGeckoSuccess(res.success);
  }, []);

  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  useEffect(() => {
    getEthToUsd();
  }, [balInEth]);

  return (
    <div id="walletbalance">
      <p className="bal">Available Balance</p>

      <p className="balinusd">
        {geckoSuccess ? `${usdFormatter.format(amountInUsd)}` : "- - -"}
        <span>{balInEth} ETH</span>
      </p>
    </div>
  );
};
