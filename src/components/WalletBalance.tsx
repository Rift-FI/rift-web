import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@mui/material";
import { walletBalance, mantraBalance } from "../utils/api/wallet";
import { getBtcUsdVal, getEthUsdVal } from "../utils/ethusd";
import { getMantraUsdVal } from "../utils/api/mantra";
import { formatUsd, formatNumber, numberFormat } from "../utils/formatters";
import btclogo from "../assets/images/btc.png";
import ethlogo from "../assets/images/eth.png";
import usdclogo from "../assets/images/labs/mantralogo.jpeg";
import "../styles/components/walletbalance.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import {
  faExchangeAlt, // Swap
  faLayerGroup, // Stake
  faCrown, // Premium
  faGlobe, // Web2
  faFlask, // Labs
  faGift, // Airdrops
} from "@fortawesome/free-solid-svg-icons";

export const WalletBalance = (): JSX.Element => {
  const actionButtons = [
    { icon: faExchangeAlt, text: "Swap", screen: null },
    { icon: faLayerGroup, text: "Stake", screen: null },
    { icon: faCrown, text: "Premium", screen: null },
    { icon: faGlobe, text: "Web2", screen: "web2" },
    { icon: faFlask, text: "Labs", screen: null },
    { icon: faGift, text: "Airdrops", screen: null },
  ];
  const navigate = useNavigate();
  const [showBalances, setShowBalance] = useState<boolean>(true);

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

  return (
    <div id="walletbalance">
      <p className="bal">
        Estimated total value(USD){" "}
        <span className="toggle-bal">
          <FontAwesomeIcon
            onClick={() => {
              setShowBalance((showbalance: boolean) => {
                return !showbalance;
              });
            }}
            icon={showBalances ? faEye : faEyeSlash}
          ></FontAwesomeIcon>
        </span>
      </p>

      <p className="balinusd">
        {showBalances ? (
          btcethLoading ||
          mantraLoading ||
          mantrausdloading ||
          btcusdloading ||
          ethusdloading ? (
            <Skeleton
              variant="text"
              width="50%"
              height="2.5rem"
              animation="wave"
            />
          ) : String(walletusdbalance).split(".")[0]?.length - 1 >= 7 ? (
            "$" + numberFormat(Math.abs(walletusdbalance)).replace(/[()]/g, "") // Fixes parentheses issue
          ) : (
            formatUsd(walletusdbalance)
          )
        ) : null}

        <button
          className="btn"
          onClick={() => {
            navigate("/deposit");
          }}
        >
          Add funds
        </button>
      </p>

      <div className="actions">
        {actionButtons.map((btn, index) => (
          <button
            key={index}
            className="btn"
            onClick={() => {
              if (btn?.screen) {
                navigate(`/${btn?.screen}`);
              }
            }}
          >
            <FontAwesomeIcon icon={btn.icon} className="icon" />
            <span>{btn.text}</span>
          </button>
        ))}
      </div>
      <p className="subheading">
        <p className="sub">Name</p>
        <p className="sub">Balance</p>
        <p className="sub">Chg% 24h</p>
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
              <span>{formatNumber(Number(mantrabalance?.data?.balance))}</span>

              <span className="fiat">
                {formatUsd(
                  Number(mantrabalance?.data?.balance) * Number(mantrausdval)
                )}
              </span>
            </p>
            <p className={`chg positive`}>
              <span>+0.4%</span>
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
            <p className={`chg negative`}>
              <span>-0.1%</span>
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
            <p className={`chg positive`}>
              <span>+0.009%</span>
            </p>
          </div>
        </>
      )}
    </div>
  );
};
