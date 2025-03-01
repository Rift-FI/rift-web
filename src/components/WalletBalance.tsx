import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { walletBalance, mantraBalance } from "../utils/api/wallet";
import { getBtcUsdVal, getEthUsdVal } from "../utils/ethusd";
import { getMantraUsdVal } from "../utils/api/mantra";
import { formatUsd, formatNumber, numberFormat } from "../utils/formatters";
import { SubmitButton } from "./global/Buttons";
import { Add } from "../assets/icons/actions";
import { colors } from "../constants";
import btclogo from "../assets/images/btc.png";
import ethlogo from "../assets/images/eth.png";
import mantralogo from "../assets/images/labs/mantralogo.jpeg";
import usdclogo from "../assets/images/labs/usdc.png";
import poelogo from "../assets/images/icons/poe.png";
import "../styles/components/walletbalance.scss";

export const WalletBalance = (): JSX.Element => {
  const navigate = useNavigate();

  const [showBalance, setShowBalance] = useState<boolean>(true);

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

  const walletusdbalance: number =
    Number(btcethbalance?.btcBalance) * Number(btcusdval) +
    Number(btcethbalance?.balance) * Number(ethusdval) +
    Number(mantrabalance?.data?.balance) * Number(mantrausdval);

  localStorage.setItem("btcbal", String(btcethbalance?.btcBalance));
  localStorage.setItem(
    "btcbalUsd",
    String(Number(btcethbalance?.btcBalance) * Number(btcusdval))
  );
  localStorage.setItem("ethbal", String(btcethbalance?.balance));
  localStorage.setItem(
    "ethbalUsd",
    String(Number(btcethbalance?.balance) * Number(ethusdval))
  );
  localStorage.setItem("mantrabal", String(mantrabalance?.data?.balance));
  localStorage.setItem(
    "mantrabalusd",
    String(Number(mantrabalance?.data?.balance) * Number(mantrausdval))
  );
  localStorage.setItem("mantrausdval", String(mantrausdval));
  localStorage.setItem("ethvalue", String(ethusdval));
  localStorage.setItem("btcvalue", String(btcusdval));

  const onPoe = () => {
    navigate("/web2");
  };

  const toggleTotalBalance = () => {
    setShowBalance(!showBalance);
  };

  return (
    <div id="walletbalance">
      <p className="bal" onClick={toggleTotalBalance}>
        Estimated Total Value(USD)&nbsp;
        <span className="toggle-bal">
          <FontAwesomeIcon
            icon={showBalance ? faEye : faEyeSlash}
          ></FontAwesomeIcon>
        </span>
      </p>

      <div className="balusd_addfunds">
        <p className="balinusd">
          {showBalance ? (
            btcethLoading ||
            mantraLoading ||
            mantrausdloading ||
            btcusdloading ||
            ethusdloading ? (
              <Skeleton
                variant="text"
                width={64}
                height="2.5rem"
                animation="wave"
              />
            ) : String(walletusdbalance).split(".")[0]?.length - 1 >= 5 ? (
              "$" +
              numberFormat(Math.abs(walletusdbalance)).replace(/[()]/g, "")
            ) : (
              formatUsd(walletusdbalance)
            )
          ) : (
            "******"
          )}
        </p>

        <SubmitButton
          text="Deposit"
          icon={<Add width={14} height={14} color={colors.textprimary} />}
          sxstyles={{ width: "fit-content", padding: "0.375rem 2.5rem" }}
          onclick={() => navigate("/deposit")}
        />
      </div>

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
              <img src={mantralogo} alt="btc" />

              <p>
                Mantra
                <span>OM</span>
              </p>
            </div>

            <p className="balance">
              <span>{formatNumber(Number(mantrabalance?.data?.balance))}</span>
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
                {formatUsd(Number(btcethbalance?.balance) * Number(ethusdval))}
              </span>
            </p>
          </div>

          <div className="_asset" onClick={() => navigate("/usdc-asset")}>
            <div>
              <img src={usdclogo} alt="usdc" />

              <p>
                USD Coin
                <span>USDC</span>
              </p>
            </div>

            <p className="balance">
              <span>0</span>

              <span className="fiat">{formatUsd(0)}</span>
            </p>
          </div>

          <div className="_asset poe_asset" onClick={onPoe}>
            <div>
              <img src={poelogo} alt="usdc" />

              <p>
                POE
                <span>GPT Powered Chatbot</span>
              </p>
            </div>

            <p className="balance">
              <span className="fiat">{formatUsd(240)}</span>
            </p>
          </div>
        </>
      )}
    </div>
  );
};
