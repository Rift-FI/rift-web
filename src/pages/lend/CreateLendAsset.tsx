import { JSX, useState, MouseEvent } from "react";
import { useNavigate } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useAppDrawer } from "../../hooks/drawer";
import { formatNumber, formatUsd } from "../../utils/formatters";
import { CryptoPopOver } from "../../components/global/PopOver";
import { RadioButton } from "../../components/global/Radios";
import { BottomButtonContainer } from "../../components/Bottom";
import { OutlinedTextInput } from "../../components/global/Inputs";
import { ComingSoon, Stake } from "../../assets/icons/actions";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import wusdlogo from "../../assets/images/wusd.png";

export type assetType =
  | "OM"
  | "BTC"
  | "ETH"
  | "USDC"
  | "USD"
  | "HKDA"
  | "HKD"
  | "WUSD";
export type assetUtility = "staking" | "trading" | "governance" | "liquidity";

export default function CreateLendAsset(): JSX.Element {
  const navigate = useNavigate();
  const { openAppDrawerWithKey } = useAppDrawer();

  const [lendAmount, setLendAmount] = useState<string>("");
  const [assetType, setAssetType] =
    useState<Exclude<assetType, "USD" | "HKD">>("ETH");
  const [selectAssetUtility, setSelectAssetUtility] =
    useState<assetUtility>("staking");
  const [assetAnchorEl, setAssetAnchorEl] = useState<HTMLDivElement | null>(
    null
  );
  const [yieldDist, setYieldDist] = useState<number>(20);

  const btcbal = localStorage.getItem("btcbal");
  const ethbal = localStorage.getItem("ethbal");
  const usdcbal = localStorage.getItem("usdtbal");
  const btcbalUsd = localStorage.getItem("btcbalUsd");
  const ethbalUsd = localStorage.getItem("ethbalUsd");

  const openAssetPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setAssetAnchorEl(event.currentTarget);
  };

  const getLendAmtnPercent = (percent: number) => {
    let amount = String();

    if (assetType == "BTC") amount = (Number(btcbal) * percent).toFixed(5);
    if (assetType == "ETH") amount = (Number(ethbal) * percent).toFixed(5);
    if (assetType == "USDC") amount = (Number(usdcbal) * percent).toFixed(5);

    if (amount.includes(".")) {
      amount = amount.replace(/0*$/, "");

      if (amount.endsWith(".")) {
        amount = amount.slice(0, -1);
      }
    }

    setLendAmount(amount);
  };

  const goBack = () => {
    navigate("/lend");
  };

  const onSubmitLend = () => {
    openAppDrawerWithKey("sendlendlink", "lend-link-goes-here", "Crypto");
  };

  useBackButton(goBack);

  return (
    <section className="h-screen bg-[#0e0e0e] px-4 pb-20 overflow-y-scroll">
      <ComingSoon />

      <div className="mt-4 mb-6">
        <h1 className="text-[#f6f7f9] text-2xl font-bold mb-1">Lend Crypto</h1>
        <p className="text-gray-400 text-sm">
          Earn profits by letting others use your crypto assets
        </p>
      </div>

      <div
        className="bg-[#212121] rounded-2xl p-4 flex items-center justify-between cursor-pointer"
        onClick={openAssetPopOver}
      >
        <div className="flex items-center gap-3">
          {assetType == "HKDA" ? (
            <span className="text-2xl">🇭🇰</span>
          ) : (
            <img
              src={
                assetType == "BTC"
                  ? btclogo
                  : assetType == "ETH"
                  ? ethlogo
                  : assetType == "OM"
                  ? mantralogo
                  : assetType == "WUSD"
                  ? wusdlogo
                  : usdclogo
              }
              alt="asset"
              className="w-10 h-10 rounded-full object-contain"
            />
          )}
          <div>
            <p className="text-[#f6f7f9] text-lg font-semibold">{assetType}</p>
            <span className="text-gray-400 text-sm">
              {assetType == "BTC"
                ? "Bitcoin"
                : assetType == "ETH"
                ? "Ethereum"
                : assetType == "HKDA"
                ? "HKDA"
                : assetType == "OM"
                ? "Mantra"
                : assetType == "WUSD"
                ? "Worldwide USD"
                : "USD Coin"}
            </span>
          </div>
        </div>
      </div>

      <CryptoPopOver
        anchorEl={assetAnchorEl}
        setAnchorEl={setAssetAnchorEl}
        setCurrency={setAssetType}
        sxstyles={{ width: "100%" }}
      />

      <div className="mt-6">
        <p className="text-gray-400 text-sm mb-1">Balance</p>
        <p className="text-[#f6f7f9] text-lg">
          <span className="font-semibold">
            {assetType == "BTC"
              ? formatNumber(Number(btcbal))
              : assetType == "ETH"
              ? formatNumber(Number(ethbal))
              : formatNumber(Number(usdcbal))}
            &nbsp;{assetType}
          </span>
          <span className="text-gray-400 mx-2">~</span>
          <span className="text-gray-400">
            {assetType == "BTC"
              ? formatUsd(Number(btcbalUsd))
              : assetType == "ETH"
              ? formatUsd(Number(ethbalUsd))
              : formatUsd(Number(usdcbal))}
          </span>
        </p>
      </div>

      <div className="mt-6">
        <div className="mb-4">
          <h2 className="text-[#f6f7f9] text-lg font-semibold mb-1">
            Loan Amount
          </h2>
          <p className="text-gray-400 text-sm">
            How much of your {assetType} would you like to lend?
          </p>
        </div>

        <OutlinedTextInput
          inputType="text"
          placeholder={`amount (${assetType})`}
          inputlabalel={`Loan Amount (${assetType})`}
          inputState={lendAmount}
          setInputState={setLendAmount}
          sxstyles={{ marginTop: "0.75rem" }}
        />

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => getLendAmtnPercent(0.25)}
            className="px-4 py-2 rounded-xl bg-[#212121] text-[#f6f7f9] text-sm hover:bg-[#2a2a2a] transition-colors"
          >
            25%
          </button>
          <button
            onClick={() => getLendAmtnPercent(0.5)}
            className="px-4 py-2 rounded-xl bg-[#212121] text-[#f6f7f9] text-sm hover:bg-[#2a2a2a] transition-colors"
          >
            50%
          </button>
          <button
            onClick={() => getLendAmtnPercent(0.75)}
            className="px-4 py-2 rounded-xl bg-[#212121] text-[#f6f7f9] text-sm hover:bg-[#2a2a2a] transition-colors"
          >
            75%
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-4">
          <h2 className="text-[#f6f7f9] text-lg font-semibold mb-1">Utility</h2>
          <p className="text-gray-400 text-sm">
            What would you like the lent amount to be used for?
          </p>
        </div>

        <div className="space-y-3">
          <RadioButton
            title="Staking Delegation"
            description="Asset will be staked in a DEX (StratosphereX)"
            ischecked={selectAssetUtility == "staking"}
            onclick={() => setSelectAssetUtility("staking")}
          />
          <RadioButton
            title="Liquidity Provision"
            description="Asset will provide liquidity for pools"
            ischecked={selectAssetUtility == "liquidity"}
            onclick={() => setSelectAssetUtility("liquidity")}
          />
          <RadioButton
            title="Marketplace purchases"
            description="Asset will be used for marketplace purchases"
            ischecked={selectAssetUtility == "trading"}
            onclick={() => setSelectAssetUtility("trading")}
          />
          <RadioButton
            title="Governance voting"
            description="Asset will be used for governance voting"
            ischecked={selectAssetUtility == "governance"}
            onclick={() => setSelectAssetUtility("governance")}
          />
        </div>
      </div>

      <div className="mt-6 mb-20">
        <div className="mb-4">
          <h2 className="text-[#f6f7f9] text-lg font-semibold mb-1">
            Profits distribution
          </h2>
          <p className="text-gray-400 text-sm">
            How much would you like to keep from the profits realized?
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[20, 30, 40, 50, 60].map((percent) => (
            <button
              key={percent}
              onClick={() => setYieldDist(percent)}
              className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                yieldDist === percent
                  ? "bg-[#ffb386] text-[#0e0e0e]"
                  : "bg-[#212121] hover:bg-[#2a2a2a] text-[#f6f7f9]"
              }`}
            >
              {percent}%
            </button>
          ))}
        </div>
      </div>

      <BottomButtonContainer>
        <button
          onClick={onSubmitLend}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#ffb386] rounded-2xl text-[#0e0e0e] font-semibold"
        >
          <Stake color="#0e0e0e" />
          <span>Lend {assetType}</span>
        </button>
      </BottomButtonContainer>
    </section>
  );
}
