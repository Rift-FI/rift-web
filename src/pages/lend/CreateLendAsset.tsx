import { JSX, useState, MouseEvent } from "react";
import { useNavigate } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { formatNumber, formatUsd } from "../../utils/formatters";
import { PopOver } from "../../components/global/PopOver";
import { SubmitButton } from "../../components/global/Buttons";
import { RadioButton } from "../../components/global/Radios";
import { BottomButtonContainer } from "../../components/Bottom";
import { OutlinedTextInput } from "../../components/global/Inputs";
import { ChevronLeft, Stake } from "../../assets/icons/actions";
import { colors } from "../../constants";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import "../../styles/pages/createlend.scss";

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

  const [lendAmount, setLendAmount] = useState<string>("");
  const [assetType, setAssetType] = useState<assetType>("ETH");
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

  useBackButton(goBack);

  return (
    <section id="createlend">
      <p className="title">
        Lend Crypto
        <br />
        <span>Earn yields by letting others use your crypto assets</span>
      </p>

      <div className="assetselector" onClick={openAssetPopOver}>
        <div className="img_desc">
          <img
            src={
              assetType == "BTC"
                ? btclogo
                : assetType == "ETH"
                ? ethlogo
                : usdclogo
            }
            alt="asset"
          />

          <p className="desc">
            {assetType} <br />
            <span>
              {assetType == "BTC"
                ? "Bitcoin"
                : assetType == "ETH"
                ? "Ethereum"
                : "USD Coin"}
            </span>
          </p>
        </div>

        <span className="inv_icon">
          <ChevronLeft width={6} height={11} color={colors.textsecondary} />
        </span>
      </div>
      <PopOver anchorEl={assetAnchorEl} setAnchorEl={setAssetAnchorEl}>
        {
          <div className="select_assets">
            <div
              className="img_desc"
              onClick={() => {
                setAssetType("BTC");
                setAssetAnchorEl(null);
              }}
            >
              <img src={btclogo} alt="asset" />

              <p className="desc">
                BTC <br /> <span>Bitcoin</span>
              </p>
            </div>

            <div
              className="img_desc"
              onClick={() => {
                setAssetType("ETH");
                setAssetAnchorEl(null);
              }}
            >
              <img src={ethlogo} alt="asset" />

              <p className="desc">
                ETH <br /> <span>Ethereum</span>
              </p>
            </div>

            <div
              className="img_desc"
              onClick={() => {
                setAssetType("USDC");
                setAssetAnchorEl(null);
              }}
            >
              <img src={usdclogo} alt="asset" />

              <p className="desc">
                USDC <br /> <span>USD Coin</span>
              </p>
            </div>

            <p className="asset_tle">Select an asset you would like to lend</p>
          </div>
        }
      </PopOver>

      <div className="balances">
        <p className="tle">Balance</p>
        <p className="cryptobal">
          {assetType == "BTC"
            ? formatNumber(Number(btcbal))
            : assetType == "ETH"
            ? formatNumber(Number(ethbal))
            : formatNumber(Number(usdcbal))}
          &nbsp;
          {assetType}&nbsp;~&nbsp;
          <span className="fiatbal">
            {assetType == "BTC"
              ? formatUsd(Number(btcbalUsd))
              : assetType == "ETH"
              ? formatUsd(Number(ethbalUsd))
              : formatUsd(Number(usdcbal))}
          </span>
        </p>
      </div>

      <div className="lendamount">
        <p className="ttle">
          Loan Amount <br />
          <span>How much of your {assetType} would you like to lend ?</span>
        </p>

        <OutlinedTextInput
          inputType="text"
          placeholder={`amount (${assetType})`}
          inputlabalel={`Loan Amount (${assetType})`}
          inputState={lendAmount}
          setInputState={setLendAmount}
          sxstyles={{ marginTop: "0.75rem" }}
        />

        <div className="amntpercent">
          <button onClick={() => getLendAmtnPercent(0.25)}>25%</button>
          <button onClick={() => getLendAmtnPercent(0.5)}>50%</button>
          <button onClick={() => getLendAmtnPercent(0.75)}>75%</button>
        </div>
      </div>

      <div className="lendutil">
        <p className="utilcase">
          Utility <br />
          <span>What would you like the lent amount to be used for ?</span>
        </p>

        <RadioButton
          title="Staking"
          description="Asset will be staked in a DEX (StratosphereX)"
          ischecked={selectAssetUtility == "staking"}
          sxstyles={{ marginTop: "0.5rem" }}
          onclick={() => setSelectAssetUtility("staking")}
        />

        <RadioButton
          title="Liquidity"
          description="Asset will provide liquidity for pools"
          ischecked={selectAssetUtility == "liquidity"}
          sxstyles={{ marginTop: "0.5rem" }}
          onclick={() => setSelectAssetUtility("liquidity")}
        />

        <RadioButton
          title="Trading"
          description="Asset will be traded in a DEX (StratosphereX)"
          ischecked={selectAssetUtility == "trading"}
          sxstyles={{ marginTop: "0.5rem" }}
          onclick={() => setSelectAssetUtility("trading")}
        />
      </div>

      <div className="yields">
        <p className="yielcase">
          Profits distribution <br />
          <span>How much would you like to keep from the profits ?</span>
        </p>

        <div className="keeps">
          <button
            onClick={() => setYieldDist(20)}
            style={{
              backgroundColor:
                yieldDist == 20 ? colors.success : colors.divider,
            }}
          >
            20%
          </button>
          <button
            onClick={() => setYieldDist(30)}
            style={{
              backgroundColor:
                yieldDist == 30 ? colors.success : colors.divider,
            }}
          >
            30%
          </button>
          <button
            onClick={() => setYieldDist(40)}
            style={{
              backgroundColor:
                yieldDist == 40 ? colors.success : colors.divider,
            }}
          >
            40%
          </button>
          <button
            onClick={() => setYieldDist(50)}
            style={{
              backgroundColor:
                yieldDist == 50 ? colors.success : colors.divider,
            }}
          >
            50%
          </button>
          <button
            onClick={() => setYieldDist(60)}
            style={{
              backgroundColor:
                yieldDist == 60 ? colors.success : colors.divider,
            }}
          >
            60%
          </button>
        </div>
      </div>

      <BottomButtonContainer>
        <SubmitButton
          text={`Lend ${assetType}`}
          icon={<Stake color={colors.textprimary} />}
          sxstyles={{
            padding: "0.625rem",
            borderRadius: "1.5rem",
            backgroundColor: colors.success,
          }}
          onclick={goBack}
        />
      </BottomButtonContainer>
    </section>
  );
}
