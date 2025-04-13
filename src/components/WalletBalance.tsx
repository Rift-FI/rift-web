import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@mui/material";
import {
  faCrown,
  faGlobe,
  faLayerGroup,
  faCode,
  faWindowRestore,
  faLink,
  faLightbulb,
  faCircleInfo,
  faCoins,
} from "@fortawesome/free-solid-svg-icons";
import { useTabs } from "../hooks/tabs";
import {
  walletBalance,
  mantraBalance,
  usdtBalance,
  wusdcBalance,
  wberaBalance,
} from "../utils/api/wallet";
import { getBtcUsdVal, getEthUsdVal } from "../utils/ethusd";
import {
  getMantraUsdVal,
  getBerachainUsdVal,
  getSphrUsdcRate,
} from "../utils/api/mantra";
import { getUnlockedTokens } from "../utils/api/airdrop";
import { formatUsd, formatNumber, numberFormat } from "../utils/formatters";
import { FaIcon } from "../assets/faicon";
import { colors } from "../constants";

import ethlogo from "../assets/images/eth.png";

import usdclogo from "../assets/images/labs/usdc.png";
import poelogo from "../assets/images/icons/poe.png";
import polymarketlogo from "../assets/images/icons/polymarket.png";
import berachainlogo from "../assets/images/icons/bera.webp";
import sphr from "../assets/images/sphere.jpg";

import "../styles/components/walletbalance.scss";
import {
  IconCircleArrowDownFilled,
  IconCircleArrowUpFilled,
  IconLink,
} from "@tabler/icons-react";

export const WalletBalance = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const [assetsFilter, setAssetsFilter] = useState<"all" | "web2" | "web3">(
    "all"
  );
  const [showInfoCard, setShowInfoCard] = useState<
    "none" | "web2" | "clicktocollect"
  >("none");

  const { data: btcethbalance, isLoading: btcethLoading } = useQuery({
    queryKey: ["btceth"],
    queryFn: walletBalance,
  });
  const { isLoading: mantraLoading } = useQuery({
    queryKey: ["mantrabalance"],
    queryFn: mantraBalance,
  });
  const { data: usdtbalance, isLoading: usdtballoading } = useQuery({
    queryKey: ["usdcbalance"],
    queryFn: usdtBalance,
  });
  const { data: wberabalance, isLoading: wberabaloading } = useQuery({
    queryKey: ["wBerabalance"],
    queryFn: wberaBalance,
  });

  const { data: usdcbalance, isLoading: usdcballoading } = useQuery({
    queryKey: ["wusdcbalance"],
    queryFn: wusdcBalance,
  });

  const { isLoading: mantrausdloading } = useQuery({
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
  const { data: berachainusdval, isLoading: berachainusdloading } = useQuery({
    queryKey: ["berachainusd"],
    queryFn: getBerachainUsdVal,
  });
  const { data: unlockedTokensData, isLoading: unlockedTokensLoading } =
    useQuery({
      queryKey: ["unlockedTokens"],
      queryFn: getUnlockedTokens,
    });

  const { data: sphrUsdcRateData, isLoading: sphrUsdcRateLoading } = useQuery({
    queryKey: ["sphrUsdcRate"],
    queryFn: getSphrUsdcRate,
  });

  const sphrAmount = Number(unlockedTokensData?.amount);

  const sphrUsdcRate = Number(sphrUsdcRateData?.data?.currentRate);
  const wberaUsdPrice = Number(berachainusdval);
  // alert(`The amount is ${sphrAmount} and ${wberaAmount} and ${sphrWberaRate}`);

  const sphrUsdValue = sphrAmount * sphrUsdcRate * wberaUsdPrice;
  const wberaUsdValue = Number(wberabalance?.data?.balance) * wberaUsdPrice;

  const walletusdbalance: number =
    Number(btcethbalance?.btcBalance) * Number(btcusdval) +
    Number(btcethbalance?.balance) * Number(ethusdval) +
    Number(usdtbalance?.data?.balance) +
    sphrUsdValue +
    wberaUsdValue;

  localStorage.setItem("btcbal", String(btcethbalance?.btcBalance));
  localStorage.setItem("spherebal", String(unlockedTokensData?.amount));

  localStorage.setItem(
    "WBERAbal",
    String(Number(unlockedTokensData?.unlocked))
  );
  localStorage.setItem(
    "WBERAbalUsd",
    String(Number(unlockedTokensData?.unlocked) * Number(berachainusdval))
  );
  localStorage.setItem(
    "btcbalUsd",
    String(Number(btcethbalance?.btcBalance) * Number(btcusdval))
  );
  localStorage.setItem("ethbal", String(btcethbalance?.balance));
  localStorage.setItem(
    "ethbalUsd",
    String(Number(btcethbalance?.balance) * Number(ethusdval))
  );

  localStorage.setItem("usdcbal", usdtbalance?.data?.balance as string);
  localStorage.setItem("wusdcbal", usdcbalance?.data?.balance as string);
  localStorage.setItem("ethvalue", String(ethusdval));
  localStorage.setItem("btcvalue", String(btcusdval));

  const onSendCrypto = () => {
    switchtab("sendcrypto");
  };

  const onDeposit = () => {
    navigate("/deposit");
  };

  const toggleInfoCard = (type: "web2" | "clicktocollect") => {
    setShowInfoCard(showInfoCard === type ? "none" : type);
  };

  return (
    <div id="">
      <div className="">
        <div className="bg-[#212523] rounded-xl p-2 h-44 flex flex-col justify-between mt-2">
          <p className="text-gray-400 text-sm">
            Estimated Total Value(USD)&nbsp;
          </p>
          <p className="text-[#f6f7f9] text-3xl font-bold">
            {btcethLoading ||
            berachainusdloading ||
            usdcballoading ||
            mantraLoading ||
            mantrausdloading ||
            btcusdloading ||
            ethusdloading ||
            sphrUsdcRateLoading ? (
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

          <div className="flex items-center justify-between w-full">
            <button
              onClick={onSendCrypto}
              className="flex items-center flex-col rounded-full p-2"
            >
              <IconCircleArrowUpFilled color="#f6f7f9" size={40} />
              <span className="text-xs text-[#f6f7f9]">Send</span>
            </button>

            <button
              onClick={onDeposit}
              className="flex items-center flex-col rounded-full p-2"
            >
              <IconCircleArrowDownFilled color="#f6f7f9" size={40} />
              <span className="text-xs text-[#f6f7f9]">Deposit</span>
            </button>

            {/* <button
              onClick={onConvertFiat}
              className="flex items-center flex-col rounded-full p-2"
            >
              <IconCirclePercentageFilled color="#f6f7f9" size={40} />
              <span className="text-xs text-[#f6f7f9]">Swap</span>
            </button> */}

            <button
              onClick={onSendCrypto}
              className="flex items-center flex-col rounded-full p-2"
            >
              <IconLink color="#f6f7f9" size={40} />
              <span className="text-xs text-[#f6f7f9]">Payment Link</span>
            </button>
          </div>
        </div>

        {showInfoCard === "clicktocollect" && (
          <div className="info-card">
            <div className="info-header">
              <h3>
                <FaIcon faIcon={faLink} color={colors.primary} fontsize={14} />
                Click-to-Collect Links
              </h3>
              <button onClick={() => setShowInfoCard("none")}>×</button>
            </div>
            <div className="info-content">
              <div className="step">
                <div className="step-number">1</div>
                <p>
                  Create a payment link without needing recipient's wallet
                  address
                </p>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <p>
                  Share the link with anyone via message, email or social media
                </p>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <p>
                  Recipient clicks link to collect funds, even without a Sphere
                  account
                </p>
              </div>
              <button className="action-button" onClick={onSendCrypto}>
                Create a Payment Link
              </button>
            </div>
          </div>
        )}

        <AppActions onInfoToggle={toggleInfoCard} />

        {showInfoCard === "web2" && (
          <div className="info-card">
            <div className="info-header">
              <h3>
                <FaIcon
                  faIcon={faWindowRestore}
                  color={colors.primary}
                  fontsize={14}
                />
                Web2 Assets
              </h3>
              <button onClick={() => setShowInfoCard("none")}>×</button>
            </div>
            <div className="info-content">
              <p>
                Store and monetize your Web2 assets like API keys securely on
                our platform:
              </p>
              <ul>
                <li>
                  <span className="icon-bullet">
                    <FaIcon
                      faIcon={faLightbulb}
                      color={colors.primary}
                      fontsize={12}
                    />
                  </span>
                  Securely store API keys with distributed encryption
                </li>
                <li>
                  <span className="icon-bullet">
                    <FaIcon
                      faIcon={faLightbulb}
                      color={colors.primary}
                      fontsize={12}
                    />
                  </span>
                  Share access permissions without exposing your actual keys
                </li>
                <li>
                  <span className="icon-bullet">
                    <FaIcon
                      faIcon={faLightbulb}
                      color={colors.primary}
                      fontsize={12}
                    />
                  </span>
                  Earn passive income by lending your unused API keys
                </li>
              </ul>
              <button
                className="action-button"
                onClick={() => navigate("/web2")}
              >
                Explore Web2 Assets
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 w-full bg-[#212523] rounded-xl p-2 my-4 mb-4">
          <div className="flex items-center gap-2">
            <img
              src={polymarketlogo}
              alt="polymarket"
              className="w-8 h-8 rounded-full"
            />
            <p className=" text-[#f6f7f9]">Polymarket</p>
          </div>
          <p className="text-xs text-[#f6f7f9] leading-relaxed">
            Polymarket is a platform for creating and trading prediction markets
            on Ethereum.
          </p>
          <p className="text-xs text-[#f6f7f9] text-center">Coming Soon</p>
        </div>
        <h1 className="text-xl text-[#f6f7f9] font-bold my-1 mt-8">
          My Assets
        </h1>
        <div className="flex justify-between items-center p-2 border-[1px] border-[#34404f] rounded-xl bg-[#212523] my-1 ">
          <button
            className={
              assetsFilter == "all"
                ? "bg-[#ffb386] flex items-center gap-1 p-2 rounded-2xl w-1/3 justify-center"
                : "flex items-center gap-1 p-2 rounded-xl"
            }
            onClick={() => setAssetsFilter("all")}
          >
            <FaIcon
              faIcon={faLayerGroup}
              color={assetsFilter == "all" ? "black" : colors.textprimary}
              fontsize={10}
            />
            <span
              className={
                assetsFilter == "all"
                  ? "text-black text-sm"
                  : "text-[#f6f7f9] text-sm"
              }
            >
              All
            </span>
          </button>
          <button
            className={
              assetsFilter == "web3"
                ? "bg-[#ffb386] flex items-center gap-1 p-2 rounded-2xl w-1/3 justify-center"
                : "flex items-center gap-1 p-2 rounded-xl "
            }
            onClick={() => setAssetsFilter("web3")}
          >
            <FaIcon
              faIcon={faCode}
              color={assetsFilter == "web3" ? "black" : colors.textprimary}
              fontsize={10}
            />
            <span
              className={
                assetsFilter == "web3"
                  ? "text-black text-sm"
                  : "text-[#f6f7f9] text-sm"
              }
            >
              Web3
            </span>
          </button>
          <button
            className={
              assetsFilter == "web2"
                ? "bg-[#ffb386] flex justify-center items-center gap-1 p-2 w-1/3 rounded-xl"
                : "flex items-center justify-center gap-1 p-2 rounded-2xl"
            }
            onClick={() => setAssetsFilter("web2")}
          >
            <FaIcon
              faIcon={faWindowRestore}
              color={assetsFilter == "web2" ? "black" : colors.textprimary}
              fontsize={10}
            />
            <span
              className={
                assetsFilter == "web2"
                  ? "text-black text-sm"
                  : "text-[#f6f7f9] text-sm"
              }
            >
              Web2
            </span>
          </button>
        </div>
      </div>

      {btcethLoading ||
      mantraLoading ||
      usdtballoading ||
      mantrausdloading ||
      btcusdloading ||
      ethusdloading ||
      sphrUsdcRateLoading ? (
        <div className="">
          <Skeleton
            variant="text"
            width="100%"
            height="5rem"
            animation="wave"
            className="h-20 bg-[#212121] rounded-xl border-[1px] border-[#34404f]"
          />
          <Skeleton
            variant="text"
            width="100%"
            height="5rem"
            animation="wave"
            className="h-20 bg-[#212121] rounded-xl border-[1px] border-[#34404f]"
          />
          <Skeleton
            variant="text"
            width="100%"
            height="5rem"
            animation="wave"
            className="h-20 bg-[#212121] rounded-xl border-[1px] border-[#34404f]"
          />
        </div>
      ) : (
        <div className="">
          {(assetsFilter == "all" || assetsFilter == "web3") && (
            <>
              <Asset
                name="Sphere"
                symbol="SPHR (Non-transferable)"
                image={sphr}
                // navigatelink="/sphere-asset/send" // Removed to make non-transferable from list
                balance={
                  unlockedTokensLoading ? (
                    <Skeleton width={40} />
                  ) : (
                    formatNumber(Number(unlockedTokensData?.amount ?? 0))
                  )
                }
                balanceusd={
                  unlockedTokensLoading ||
                  berachainusdloading ||
                  sphrUsdcRateLoading ? (
                    <Skeleton width={50} />
                  ) : (
                    formatUsd(sphrUsdValue)
                  )
                }
              />
              <Asset
                name="Berachain"
                symbol="WBera"
                image={berachainlogo}
                navigatelink="/wbera-asset/send" // Removed to make non-transferable from list
                balance={
                  wberabaloading ? (
                    <Skeleton width={40} />
                  ) : (
                    formatNumber(Number(wberabalance?.data?.balance))
                  )
                }
                balanceusd={
                  wberabaloading || berachainusdloading || wberaUsdPrice ? (
                    <Skeleton width={50} />
                  ) : (
                    formatUsd(wberaUsdValue)
                  )
                }
              />
              <Asset
                name="Ethereum"
                symbol="ETH (Ethereum mainnet)"
                image={ethlogo}
                navigatelink="/eth-asset/send"
                balance={Number(btcethbalance?.balance)}
                balanceusd={Number(btcethbalance?.balance) * Number(ethusdval)}
              />
              <Asset
                name="USDC "
                symbol="USDC (Polygon)"
                image={usdclogo}
                navigatelink="/usdc-asset/send"
                balance={Number(usdtbalance?.data?.balance)}
                balanceusd={Number(usdtbalance?.data?.balance)}
              />
              <Asset
                name="USDC "
                symbol="USDC (Berachain)"
                image={usdclogo}
                navigatelink="/wusdc-asset/send"
                balance={Number(usdcbalance?.data?.balance)}
                balanceusd={Number(usdcbalance?.data?.balance)}
              />
            </>
          )}

          {(assetsFilter == "all" || assetsFilter == "web2") && (
            <Asset
              name="AI chatbot"
              symbol="GPT Powered Chatbot"
              image={poelogo}
              navigatelink="/web2"
              balanceusd={50}
            />
          )}
        </div>
      )}
    </div>
  );
};

const AppActions = ({
  onInfoToggle,
}: {
  onInfoToggle: (type: "web2" | "clicktocollect") => void;
}): JSX.Element => {
  const navigate = useNavigate();

  const actionButtons = [
    // { icon: faExchangeAlt, text: "Swap", screen: "/swap" },
    {
      icon: faGlobe,
      text: "Web2",
      screen: "/web2",
      infoButton: true,
      infoType: "web2" as const,
    },
    { icon: faCoins, text: "Lend", screen: "/lend" },
    { icon: faCrown, text: "Premium", screen: "/premiums" },
  ];

  return (
    <div className="my-4">
      <h1 className="text-xl text-[#f6f7f9] font-bold my-1">Quick Actions</h1>
      <div className=" flex justify-between items-center">
        {actionButtons.map((btn, index) => (
          <div
            key={index}
            className={` rounded-2xl p-2 max-w-28 min-w-20 h-24 flex flex-col items-center justify-center cursor-pointer hover:scale-95 transition-all duration-300 ${
              btn.text === "Premium" ? "bg-[#ffb386]" : "bg-[#212523]"
            }`}
          >
            <div
              className="flex flex-col gap-2 items-center justify-center"
              onClick={() => {
                if (btn?.screen) {
                  navigate(btn.screen);
                }
              }}
            >
              <span className="icons">
                <FaIcon
                  faIcon={btn.icon}
                  color={btn.text === "Premium" ? "black" : "#f6f7f9"}
                  fontsize={15}
                />
              </span>
              <span
                className={`${
                  btn.text === "Premium"
                    ? "text-black font-bold"
                    : "text-[#f6f7f9]"
                } text-xs flex items-center gap-2`}
              >
                {btn.text}
                {btn.infoButton && (
                  <button
                    className="info-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInfoToggle(btn.infoType);
                    }}
                  >
                    <FaIcon
                      faIcon={faCircleInfo}
                      color={colors.textprimary}
                      fontsize={14}
                    />
                  </button>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
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
  balance?: React.ReactNode;
  balanceusd: React.ReactNode;
}): JSX.Element => {
  const navigate = useNavigate();

  return (
    <div
      className="flex justify-between items-center p-2 border-[1px] border-[#34404f] rounded-xl bg-[#212523] my-4 h-20"
      onClick={() => (navigatelink ? navigate(navigatelink) : () => {})}
    >
      <div className="flex items-center gap-2">
        <img
          src={image}
          alt={name.toLowerCase()}
          className="w-8 h-8 rounded-full"
        />

        <p className="text-sm text-[#f6f7f9] flex flex-col gap-1">
          {name}
          <span className="text-xs text-[#f6f7f9]">{symbol}</span>
        </p>
      </div>

      <p className="text-sm text-[#f6f7f9] flex flex-col gap-1 items-end">
        {balance && (
          <span>
            {typeof balance == "number"
              ? formatNumber(Number(balance))
              : balance}
          </span>
        )}
        <span className="text-xs text-[#f6f7f9]">
          {typeof balanceusd === "string"
            ? balanceusd
            : typeof balanceusd == "number"
            ? formatUsd(balanceusd)
            : balanceusd}
        </span>
      </p>
    </div>
  );
};
