import {
  Dispatch,
  JSX,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router";
import { walletBalance, uSdTBalance } from "../utils/api/wallet";
import { getBtcUsdVal, getEthUsdVal } from "../utils/ethusd";
import { ArrowRight } from "../assets/icons";
import { colors } from "../constants";
import "../styles/components/walletbalance.css";

interface props {
  refreshing: boolean;
  setRefreshing: Dispatch<SetStateAction<boolean>>;
}

export const WalletBalance = ({
  refreshing,
  setRefreshing,
}: props): JSX.Element => {
  const navigate = useNavigate();

  const [accBalLoading, setAccBalLoading] = useState<boolean>(false);
  const [accBalance, setAccBalance] = useState<number>(0);
  const [btcAccBalance, setBtcAccAccBalance] = useState<number>(0);
  const [btcAccBalanceUsd, setBtcAccAccBalanceUsd] = useState<number>(0);
  const [usdtAccBalance, setusdtAccBalance] = useState<number>(0);
  const [amountInUsd, setAmountInUsd] = useState<number>(0);
  const [geckoSuccess, setGeckoSuccess] = useState<boolean>(false);

  const getWalletBalance = useCallback(async () => {
    setAccBalLoading(true);

    let access: string | null = localStorage.getItem("token");

    const { btcBalance, balance } = await walletBalance(access as string);
    const { ethInUSD, success } = await getEthUsdVal(Number(balance));
    const { btcQtyInUSD } = await getBtcUsdVal(Number(btcBalance));
    const { data } = await uSdTBalance(access as string);

    setAccBalance(Number(balance));
    setBtcAccAccBalance(btcBalance);
    setusdtAccBalance(Number(data?.balance));

    setBtcAccAccBalanceUsd(btcQtyInUSD);
    setAmountInUsd(ethInUSD);

    localStorage.setItem("btcbal", String(btcBalance));
    localStorage.setItem("btcbalUsd", String(btcQtyInUSD));
    localStorage.setItem("ethbal", balance);
    localStorage.setItem("ethbalUsd", String(ethInUSD));
    localStorage.setItem("usdtbal", data?.balance);

    setAccBalLoading(false);
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
        {geckoSuccess
          ? `${usdFormatter.format(
              btcAccBalanceUsd + amountInUsd + usdtAccBalance
            )}`
          : "- - -"}
      </p>
      <p className="_asset" onClick={() => navigate("/btc-asset")}>
        <span>
          {accBalLoading ? "- - -" : btcAccBalance?.toFixed(8)}
          &nbsp;BTC
        </span>
        <ArrowRight color={colors.textsecondary} />
      </p>
      <p className="_asset" onClick={() => navigate("/eth-asset")}>
        <span>
          {accBalLoading ? "- - -" : accBalance?.toFixed(8)}
          &nbsp;ETH
        </span>
        <ArrowRight color={colors.textsecondary} />
      </p>
      <p className="_asset _l_asset" onClick={() => navigate("/usdt-asset")}>
        <span>
          {accBalLoading ? "- - -" : usdtAccBalance?.toFixed(8)}
          &nbsp;USDT
        </span>
        <ArrowRight color={colors.textsecondary} />
      </p>
    </div>
  );
};
