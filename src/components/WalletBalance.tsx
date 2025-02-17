import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import {
  faExchangeAlt,
  faLayerGroup,
  faCrown,
  faGlobe,
  faFlask,
  faGift,
} from "@fortawesome/free-solid-svg-icons";
import { openTelegramLink } from "@telegram-apps/sdk-react";
import { useTabs } from "../hooks/tabs";
import { walletBalance, mantraBalance } from "../utils/api/wallet";
import { getBtcUsdVal, getEthUsdVal } from "../utils/ethusd";
import { getMantraUsdVal } from "../utils/api/mantra";
import { formatUsd, formatNumber, numberFormat } from "../utils/formatters";
import btclogo from "../assets/images/btc.png";
import ethlogo from "../assets/images/eth.png";
import usdclogo from "../assets/images/labs/mantralogo.jpeg";
import { Stake } from "../assets/icons/actions";
import { colors } from "../constants";
import "../styles/components/walletbalance.scss";

export const WalletBalance = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const [showBalances, setShowBalance] = useState<boolean>(true);

  const actionButtons = [
    { icon: faGlobe, text: "Web2", screen: "web2" },
    { icon: faGift, text: "Airdrops", screen: "rewards/nil" },
    { icon: faLayerGroup, text: "Stake", screen: null },
    { icon: faCrown, text: "Premium", screen: "premiums" },
  ];

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

  const onLabs = () => {
    switchtab("labs");
  };

  const onSwap = () => {
    openTelegramLink("https://t.me/stratospherex_bot/stratospherex");
  };

  return (
    <div id="walletbalance">
      <p className="bal">
        Estimated total value(USD)&nbsp;
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

      <div className="balusd_addfunds">
        <p className="balinusd">
          {showBalances ? (
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
            ) : String(walletusdbalance).split(".")[0]?.length - 1 >= 7 ? (
              "$" +
              numberFormat(Math.abs(walletusdbalance)).replace(/[()]/g, "") // Fixes parentheses issue
            ) : (
              formatUsd(walletusdbalance)
            )
          ) : (
            "******"
          )}
        </p>

        <button className="addfunds" onClick={() => navigate("/deposit")}>
          Add funds <Stake width={6} height={11} color={colors.textprimary} />
        </button>
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
                <em className="price_change positive">+0.4%</em>&nbsp;
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
                <em className="price_change negative">-0.1%</em>&nbsp;
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
                <em className="price_change positive">+0.009%</em>&nbsp;
                {formatUsd(Number(btcethbalance?.balance) * Number(ethusdval))}
              </span>
            </p>
          </div>
        </>
      )}

      <div className="actions">
        <div className="_action" onClick={onLabs}>
          <span>Labs</span>
          <FontAwesomeIcon icon={faFlask} className="icon" />
        </div>

        <div className="_action" onClick={onSwap}>
          <span>Swap</span>
          <FontAwesomeIcon icon={faExchangeAlt} className="icon" />
        </div>

        {actionButtons.map((btn, index) => (
          <div
            key={index}
            className="_action"
            onClick={() => {
              if (btn?.screen) {
                navigate(`/${btn?.screen}`);
              }
            }}
          >
            <span>{btn.text}</span>
            <FontAwesomeIcon icon={btn.icon} className="icon" />
          </div>
        ))}
      </div>
    </div>
  );
};
