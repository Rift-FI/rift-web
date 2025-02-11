import { JSX } from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useAppDialog } from "../../hooks/dialog";
import { fetchAirWllxBalances } from "../../utils/api/awllx";
import airwallex from "../../assets/images/awx.png";
import "../../styles/components/tabs/home/fiatbalances.scss";

export const FiatBalances = (): JSX.Element => {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { openAppDialog } = useAppDialog();

  const { data: airwallexData } = useQuery({
    queryKey: ["airwallexbalances"],
    queryFn: () => fetchAirWllxBalances(initData?.user?.username as string),
  });

  const onimportAwx = () => {
    openAppDialog("awxkeyimport", "Import AirWallex API Key");
  };

  return (
    <div className="fiat_balances">
      <p className="_title">Airwallex Balances</p>

      {airwallexData?.status == 404 ? (
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
      ) : (
        <>
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
  );
};
