import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@mui/material";
import {
  faCircleArrowUp,
  faCirclePlus,
} from "@fortawesome/free-solid-svg-icons";
import {
  faExchangeAlt,
  faCrown,
  faGlobe,
  faArrowsRotate,
  faLayerGroup,
  faCode,
  faWindowRestore,
} from "@fortawesome/free-solid-svg-icons";
import { useTabs } from "../hooks/tabs";
import { walletBalance, mantraBalance, usdtBalance } from "../utils/api/wallet";
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
import polymarketlogo from "../assets/images/icons/polymarket.png";
import "../styles/components/walletbalance.scss";

export const WalletBalance = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const [assetsFilter, setAssetsFilter] = useState<"all" | "web2" | "web3">(
    "all"
  );

  const { data: btcethbalance, isLoading: btcethLoading } = useQuery({
    queryKey: ["btceth"],
    queryFn: walletBalance,
  });
  const { data: mantrabalance, isLoading: mantraLoading } = useQuery({
    queryKey: ["mantrabalance"],
    queryFn: mantraBalance,
  });
  const { data: usdtbalance, isLoading: usdtballoading } = useQuery({
    queryKey: ["usdcbalance"],
    queryFn: usdtBalance,
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
    Number(mantrabalance?.data?.balance) * Number(mantrausdval) +
    Number(usdtbalance?.data?.balance);

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
  localStorage.setItem("usdcbal", usdtbalance?.data?.balance as string);
  localStorage.setItem("mantrausdval", String(mantrausdval));
  localStorage.setItem("ethvalue", String(ethusdval));
  localStorage.setItem("btcvalue", String(btcusdval));

  const onSendCrypto = () => {
    switchtab("sendcrypto");
  };

  const onDeposit = () => {
    navigate("/deposit");
  };

  const onConvertFiat = () => {
    navigate("/convertfiat");
  };

  return (
    <div id="walletbalance">
      <div className="non-scrollable-content">
        <p className="bal">Estimated Total Value(USD)&nbsp;</p>

        <div className="balusd_addfunds">
          <p className="balinusd">
            {btcethLoading ||
            mantraLoading ||
            mantrausdloading ||
            btcusdloading ||
            ethusdloading ? (
              <Skeleton
                variant="text"
                width={60}
                height="2rem"
                animation="wave"
              />
            ) : String(walletusdbalance).split(".")[0]?.length - 1 >= 5 ? (
              "$" +
              numberFormat(Math.abs(walletusdbalance)).replace(/[()]/g, "")
            ) : (
              formatUsd(walletusdbalance)
            )}
          </p>

          <div className="actions">
            <button onClick={onSendCrypto}>
              <FaIcon faIcon={faCircleArrowUp} color={colors.textprimary} />
            </button>

            <button onClick={onDeposit}>
              <FaIcon faIcon={faCirclePlus} color={colors.textprimary} />
            </button>

            <button onClick={onConvertFiat}>
              <FaIcon faIcon={faArrowsRotate} color={colors.textprimary} />
            </button>
          </div>
        </div>

        <AppActions />

        <div className="polymarket">
          <p>
            Polymarket <span>Soon</span>
          </p>
          <img src={polymarketlogo} alt="polymarket" />
        </div>

        <div className="filters">
          <button
            className={assetsFilter == "all" ? "active" : ""}
            onClick={() => setAssetsFilter("all")}
          >
            <FaIcon
              faIcon={faLayerGroup}
              color={colors.textprimary}
              fontsize={10}
            />
            <span>All</span>
          </button>
          <button
            className={assetsFilter == "web3" ? "active" : ""}
            onClick={() => setAssetsFilter("web3")}
          >
            <FaIcon faIcon={faCode} color={colors.textprimary} fontsize={10} />
            <span>Web3</span>
          </button>
          <button
            className={assetsFilter == "web2" ? "active" : ""}
            onClick={() => setAssetsFilter("web2")}
          >
            <FaIcon
              faIcon={faWindowRestore}
              color={colors.textprimary}
              fontsize={10}
            />
            <span>Web2</span>
          </button>
        </div>
      </div>

      {btcethLoading ||
      mantraLoading ||
      usdtballoading ||
      mantrausdloading ||
      btcusdloading ||
      ethusdloading ? (
        <div className="scrollable-assets">
          <Skeleton
            variant="text"
            width="100%"
            height="3rem"
            animation="wave"
          />
          <Skeleton
            variant="text"
            width="100%"
            height="3rem"
            animation="wave"
          />
          <Skeleton
            variant="text"
            width="100%"
            height="3rem"
            animation="wave"
          />
        </div>
      ) : (
        <div className="scrollable-assets">
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
                symbol="ETH (Sepolia)"
                image={ethlogo}
                navigatelink="/eth-asset/send"
                balance={Number(btcethbalance?.balance)}
                balanceusd={Number(btcethbalance?.balance) * Number(ethusdval)}
              />
              <Asset
                name="USDC Coin"
                symbol="USDC (Sepolia)"
                image={usdclogo}
                navigatelink="/usdc-asset/send"
                balance={Number(usdtbalance?.data?.balance)}
                balanceusd={Number(usdtbalance?.data?.balance)}
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
        </div>
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
          <span className="icons">
            <FaIcon
              faIcon={btn.icon}
              color={colors.textprimary}
              fontsize={12}
            />
          </span>
          <span className="text">{btn.text}</span>
        </div>
      ))}
    </div>
  );
};

export const Asset = ({
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
  navigatelink?: string;
  balance?: number | string;
  balanceusd: number | string;
}): JSX.Element => {
  const navigate = useNavigate();

  return (
    <div
      className="_asset"
      onClick={() => (navigatelink ? navigate(navigatelink) : () => {})}
    >
      <div>
        <img src={image} alt={name.toLowerCase()} />

        <p>
          {name}
          <span>{symbol}</span>
        </p>
      </div>

      <p className="balance">
        {balance && (
          <span>
            {typeof balance == "number"
              ? formatNumber(Number(balance))
              : balance}
          </span>
        )}
        <span className="fiat">
          {typeof balanceusd == "number" ? formatUsd(balanceusd) : balanceusd}
        </span>
      </p>
    </div>
  );
};
