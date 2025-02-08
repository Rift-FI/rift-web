import { JSX, useEffect } from "react";
import { backButton, useLaunchParams } from "@telegram-apps/sdk-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Skeleton } from "@mui/material";
import { useTabs } from "../../hooks/tabs";
import { useAppDialog } from "../../hooks/dialog";
import { getMantraUsdVal } from "../../utils/api/mantra";
import { mantraBalance, walletBalance } from "../../utils/api/wallet";
import { getBtcUsdVal, getEthUsdVal } from "../../utils/ethusd";
import { fetchAirWllxBalances } from "../../utils/api/awllx";
import { formatNumber, formatUsd, numberFormat } from "../../utils/formatters";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/mantralogo.jpeg";
import airwallex from "../../assets/images/awx.png";
import "../../styles/pages/assets/allaseets.scss";

export default function AllAssets(): JSX.Element {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { openAppDialog } = useAppDialog();

  const { data: btcethbalance, isLoading: btcethLoading } = useQuery({
    queryKey: ["btceth"],
    queryFn: walletBalance,
  });
  const { data: mantrabalance, isLoading: mantraLoading } = useQuery({
    queryKey: ["mantra"],
    queryFn: mantraBalance,
  });
  const { data: mantrausdval, isLoading: mantrausdloading } = useQuery({
    queryKey: ["mantrausd"],
    queryFn: getMantraUsdVal,
  });
  const { data: btcusdval, isLoading: btcusdloading } = useQuery({
    queryKey: ["btcusd"],
    queryFn: getBtcUsdVal,
  });
  const { data: ethusdval, isLoading: ethusdloading } = useQuery({
    queryKey: ["ethusd"],
    queryFn: getEthUsdVal,
  });
  const { data: airwallexData, isLoading: awxLoading } = useQuery({
    queryKey: ["airwallexbalances"],
    queryFn: () => fetchAirWllxBalances(initData?.user?.username as string),
  });

  const walletusdbalance: number =
    Number(btcethbalance?.btcBalance) * Number(btcusdval) +
    Number(btcethbalance?.balance) * Number(ethusdval) +
    Number(mantrabalance?.data?.balance) * Number(mantrausdval) +
    Number(airwallexData?.balances?.balances?.HKD) / 7.79 +
    Number(airwallexData?.balances?.balances?.USD);

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const onimportAwx = () => {
    openAppDialog("awxkeyimport", "Import AirWallex API Key");
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(goBack);
    }

    return () => {
      backButton.offClick(goBack);
      backButton.unmount();
    };
  }, []);

  return (
    <section id="allaseets">
      <div id="walletbalance">
        <p className="bal">Wallet Balance</p>

        <p className="balinusd">
          {btcethLoading ||
          mantraLoading ||
          mantrausdloading ||
          btcusdloading ||
          ethusdloading ||
          awxLoading ? (
            <Skeleton
              variant="text"
              width="50%"
              height="2.5rem"
              animation="wave"
            />
          ) : String(walletusdbalance).split(".")[0]?.length - 1 >= 7 ? (
            "$" + numberFormat(walletusdbalance)
          ) : (
            formatUsd(walletusdbalance)
          )}
        </p>

        {btcethLoading ||
        mantraLoading ||
        mantrausdloading ||
        btcusdloading ||
        ethusdloading ? (
          <>
            <Skeleton
              variant="text"
              width="100%"
              height="3.75rem"
              animation="wave"
            />
            <Skeleton
              variant="text"
              width="100%"
              height="3.75rem"
              animation="wave"
            />
            <Skeleton
              variant="text"
              width="100%"
              height="3.75rem"
              animation="wave"
            />
            <Skeleton
              variant="text"
              width="100%"
              height="3.75rem"
              animation="wave"
            />
            <Skeleton
              variant="text"
              width="100%"
              height="3.75rem"
              animation="wave"
            />
          </>
        ) : (
          <>
            <div className="_asset" onClick={() => navigate("/om-asset")}>
              <div>
                <img src={usdclogo} alt="btc" />

                <p>
                  Mantra
                  <span>OM</span>
                </p>
              </div>

              <p className="balance">
                <span>
                  {formatNumber(Number(mantrabalance?.data?.balance))}
                </span>

                <span className="fiat">
                  {formatUsd(
                    Number(mantrabalance?.data?.balance) * Number(mantrausdval)
                  )}
                </span>
              </p>
            </div>

            <div className="_asset" onClick={() => navigate("/btc-asset")}>
              <div>
                <img src={btclogo} alt="btc" />

                <p>
                  Bitcoin
                  <span>BTC</span>
                </p>
              </div>

              <p className="balance">
                <span>{formatNumber(Number(btcethbalance?.btcBalance))}</span>

                <span className="fiat">
                  {formatUsd(
                    Number(btcethbalance?.btcBalance) * Number(btcusdval)
                  )}
                </span>
              </p>
            </div>

            <div className="_asset" onClick={() => navigate("/eth-asset/send")}>
              <div>
                <img src={ethlogo} alt="btc" />

                <p>
                  Ethereum
                  <span>ETH</span>
                </p>
              </div>

              <p className="balance">
                <span>{formatNumber(Number(btcethbalance?.balance))}</span>

                <span className="fiat">
                  {formatUsd(
                    Number(btcethbalance?.balance) * Number(ethusdval)
                  )}
                </span>
              </p>
            </div>

            <div
              className="currencybalance"
              onClick={() =>
                airwallexData?.status == 404
                  ? openAppDialog("awxkeyimport", "Import Airwallex Key")
                  : navigate(
                      `/hkd-asset/${airwallexData?.balances?.balances?.HKD}`
                    )
              }
            >
              <div className="flag_symbol">
                <span className="flag">🇭🇰</span>
                <p className="symbol">HKD</p>
              </div>

              <div className="avail_total">
                <p className="avail">
                  {airwallexData?.balances?.balances?.HKD.toFixed(2) || 0}
                </p>
                <span>HKD</span>
              </div>
            </div>

            <div
              className="currencybalance"
              onClick={() =>
                airwallexData?.status == 404
                  ? openAppDialog("awxkeyimport", "Import Airwallex Key")
                  : navigate(
                      `/usd-asset/${airwallexData?.balances?.balances?.USD}`
                    )
              }
            >
              <div className="flag_symbol">
                <span className="flag">🇺🇸</span>
                <p className="symbol">USD</p>
              </div>

              <div className="avail_total">
                <p className="avail">
                  {airwallexData?.balances?.balances?.USD.toFixed(2) || 0}
                </p>
                <span>USD</span>
              </div>
            </div>
          </>
        )}
      </div>

      {airwallexData?.status == 404 && (
        <>
          <p className="message">
            An Airwallex key allows you to view your USD & HKD balances and buy
            OM (using USD/HKD)
          </p>

          <div className="airwallex" onClick={onimportAwx}>
            <span>Import AirWallex Key</span>
            <img src={airwallex} alt="airwallex" />
          </div>
        </>
      )}
    </section>
  );
}
