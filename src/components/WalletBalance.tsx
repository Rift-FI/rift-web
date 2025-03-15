import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@mui/material";
import {
  faCircleArrowUp,
  faCirclePlus,
} from "@fortawesome/free-solid-svg-icons";
import {
  faEye,
  faEyeSlash,
  faExchangeAlt,
  faCrown,
  faGlobe,
  faArrowsRotate,
} from "@fortawesome/free-solid-svg-icons";
import { useTabs } from "../hooks/tabs";
import { walletBalance, mantraBalance } from "../utils/api/wallet";
import { getBtcUsdVal, getEthUsdVal } from "../utils/ethusd";
import { getMantraUsdVal } from "../utils/api/mantra";
import { formatUsd, formatNumber, numberFormat } from "../utils/formatters";
import { FaIcon } from "../assets/faicon";
import { colors } from "../constants";
import btclogo from "../assets/images/btc.png";
import ethlogo from "../assets/images/eth.png";
import mantralogo from "../assets/images/labs/mantralogo.jpeg";
import usdclogo from "../assets/images/labs/usdc.png";
import poelogo from "../assets/images/icons/poe.png";
import staketoken from "../assets/images/icons/lendto.png";
import polymarketlogo from "../assets/images/icons/polymarket.png";
import "../styles/components/walletbalance.scss";

export const WalletBalance = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const [showBalance, setShowBalance] = useState<boolean>(true);
  const [assetsFilter, setAssetsFilter] = useState<"all" | "web2" | "web3">(
    "all"
  );

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

  const onSendCrypto = () => {
    switchtab("sendcrypto");
  };

  const onDeposit = () => {
    navigate("/deposit");
  };

  const toggleTotalBalance = () => {
    setShowBalance(!showBalance);
  };

  return (
    <div id="walletbalance">
      <p className="bal" onClick={toggleTotalBalance}>
        Estimated Total Value(USD)&nbsp;
        <span className="toggle-bal">
          <FaIcon
            faIcon={showBalance ? faEye : faEyeSlash}
            color={colors.textsecondary}
            fontsize={12}
          />
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

        <div className="actions">
          <button onClick={onSendCrypto}>
            <FaIcon faIcon={faCircleArrowUp} color={colors.textprimary} />
          </button>

          <button onClick={onDeposit}>
            <FaIcon faIcon={faCirclePlus} color={colors.textprimary} />
          </button>
        </div>
      </div>

      <AppActions />

      <div className="polymarket">
        <p>
          Polymarket <span>Trading Coming Soon</span>
        </p>
        <img src={polymarketlogo} alt="polymarket" />
      </div>

      <div className="filters">
        <button
          className={assetsFilter == "all" ? "active" : ""}
          onClick={() => setAssetsFilter("all")}
        >
          All
        </button>
        <button
          className={assetsFilter == "web3" ? "active" : ""}
          onClick={() => setAssetsFilter("web3")}
        >
          Web3
        </button>
        <button
          className={assetsFilter == "web2" ? "active" : ""}
          onClick={() => setAssetsFilter("web2")}
        >
          Web2
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
          {(assetsFilter == "all" || assetsFilter == "web3") && (
            <>
              <Asset
                name="Mantra"
                symbol="OM"
                image={mantralogo}
                navigatelink="/om-asset"
                balance={Number(mantrabalance?.data?.balance)}
                balanceusd={
                  Number(mantrabalance?.data?.balance) * Number(mantrausdval)
                }
              />
              <Asset
                name="Bitcoin"
                symbol="BTC"
                image={btclogo}
                navigatelink="/btc-asset"
                balance={Number(btcethbalance?.btcBalance)}
                balanceusd={
                  Number(btcethbalance?.btcBalance) * Number(btcusdval)
                }
              />
              <Asset
                name="Ethereum"
                symbol="ETH"
                image={ethlogo}
                navigatelink="/eth-asset/send"
                balance={Number(btcethbalance?.balance)}
                balanceusd={Number(btcethbalance?.balance) * Number(ethusdval)}
              />
              <Asset
                name="USDC Coin"
                symbol="USDC"
                image={usdclogo}
                navigatelink="/usdc-asset"
                balance={0}
                balanceusd={0}
              />
              <Asset
                name="stIndexVault"
                symbol="stIndexVault"
                image={staketoken}
                navigatelink="/app"
                balance={0}
                balanceusd={0}
              />
              <Asset
                name="stBuffetVault"
                symbol="stBuffetVault"
                image={staketoken}
                navigatelink="/app"
                balance={0}
                balanceusd={0}
              />
            </>
          )}

          {(assetsFilter == "all" || assetsFilter == "web2") && (
            <Asset
              name="POE"
              symbol="GPT Powered Chatbot"
              image={poelogo}
              navigatelink="/web2"
              balanceusd={240}
            />
          )}
        </>
      )}
    </div>
  );
};

const AppActions = (): JSX.Element => {
  const navigate = useNavigate();

  const actionButtons = [
    { icon: faExchangeAlt, text: "Swap", screen: "/swap" },
    { icon: faGlobe, text: "Web2", screen: "/web2" },
    { icon: faArrowsRotate, text: "Lend", screen: "/lend" },
    { icon: faCrown, text: "Premium", screen: "/premiums" },
  ];

  return (
    <div className="actions">
      {actionButtons.map((btn, index) => (
        <div
          key={index}
          className="_action"
          onClick={() => {
            if (btn?.screen) {
              navigate(btn.screen);
            }
          }}
        >
          <span>{btn.text}</span>
          <span className="icons">
            <FaIcon
              faIcon={btn.icon}
              color={colors.textprimary}
              fontsize={12}
            />
          </span>
        </div>
      ))}
    </div>
  );
};

const Asset = ({
  name,
  symbol,
  image,
  navigatelink,
  balance,
  balanceusd,
}: {
  name: string;
  symbol: string;
  image: string;
  navigatelink: string;
  balance?: number;
  balanceusd: number;
}): JSX.Element => {
  const navigate = useNavigate();

  return (
    <div className="_asset" onClick={() => navigate(navigatelink)}>
      <div>
        <img src={image} alt="btc" />

        <p>
          {name}
          <span>{symbol}</span>
        </p>
      </div>

      <p className="balance">
        {balance && <span>{formatNumber(Number(balance))}</span>}
        <span className="fiat">{formatUsd(balanceusd)}</span>
      </p>
    </div>
  );
};
