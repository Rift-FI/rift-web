import {
  Dispatch,
  JSX,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { walletBalance } from "../utils/api/wallet";
import { getEthUsdVal } from "../utils/ethusd";
import "../styles/components/walletbalance.css";

interface props {
  refreshing: boolean;
  setRefreshing: Dispatch<SetStateAction<boolean>>;
}

export const WalletBalance = ({
  refreshing,
  setRefreshing,
}: props): JSX.Element => {
  const [accBalLoading, setAccBalLoading] = useState<boolean>(false);
  const [accBalance, setAccBalance] = useState<number | undefined>(undefined);
  const [amountInUsd, setAmountInUsd] = useState<number>(0);
  const [geckoSuccess, setGeckoSuccess] = useState<boolean>(false);

  const getWalletBalance = useCallback(async () => {
    setAccBalLoading(true);

    let access: string | null = localStorage.getItem("token");

    const { balance } = await walletBalance(access as string);
    const { ethInUSD, success } = await getEthUsdVal(Number(balance));

    setAccBalance(Number(balance));
    setAccBalLoading(false);

    setAmountInUsd(ethInUSD);
    setGeckoSuccess(success);
    setRefreshing(false);
  }, []);

  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "symbol",
    compactDisplay: "short",
    unitDisplay: "short",
  });

  useEffect(() => {
    getWalletBalance();
  }, [refreshing]);

  return (
    <div id="walletbalance">
      <p className="bal">Your Balance</p>

      <p className="balinusd">
        {geckoSuccess ? `${usdFormatter.format(amountInUsd)}` : "- - -"}
        <span>{accBalLoading ? "- - -" : `${accBalance?.toFixed(8)} ETH`}</span>
      </p>
    </div>
  );
};
