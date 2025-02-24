import { JSX, useEffect, useState, MouseEvent } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { TextField } from "@mui/material";
import { PopOver } from "../../components/global/PopOver";
import { formatNumber, formatUsd } from "../../utils/formatters";
import { ChevronLeft, Stake } from "../../assets/icons/actions";
import { colors } from "../../constants";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import assets from "../../assets/images/icons/lendto.png";
import "../../styles/pages/createlend.scss";

export type assetType = "BTC" | "ETH" | "USDC" | "USD" | "HKDA" | "HKD";
export type assetUtility = "staking" | "trading" | "governance" | "liquidity";

export default function CreateLendAsset(): JSX.Element {
  const navigate = useNavigate();

  const [lendAmount, setLendAmount] = useState<string>("");
  const [assetReceipient, setAssetReceipient] = useState<string>("");
  const [assetType, setAssetType] = useState<assetType>("ETH");
  const [selectAssetUtility, setSelectAssetUtility] =
    useState<assetUtility>("staking");
  const [assetAnchorEl, setAssetAnchorEl] = useState<HTMLDivElement | null>(
    null
  );
  const [utilAnchorEl, setUtilAnchorEl] = useState<HTMLDivElement | null>(null);
  const [yieldDist, setYieldDist] = useState<number>(20);

  const btcbal = localStorage.getItem("btcbal");
  const ethbal = localStorage.getItem("ethbal");
  const usdcbal = localStorage.getItem("usdtbal");
  const btcbalUsd = localStorage.getItem("btcbalUsd");
  const ethbalUsd = localStorage.getItem("ethbalUsd");

  const openAssetPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setAssetAnchorEl(event.currentTarget);
  };

  const openUtilPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setUtilAnchorEl(event.currentTarget);
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

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isVisible()) {
      backButton.onClick(goBack);
    }

    return () => {
      backButton.offClick(goBack);
      backButton.unmount();
    };
  }, []);

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
          {assetType}&nbsp;&gt;&nbsp;
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

        <TextField
          value={lendAmount}
          onChange={(ev) => setLendAmount(ev.target.value)}
          label={`Loan Amount (${assetType})`}
          placeholder={`amount (${assetType})`}
          fullWidth
          variant="outlined"
          autoComplete="off"
          type="number"
          sx={{
            marginTop: "0.75rem",
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: colors.divider,
              },
              "& input": {
                color: colors.textprimary,
              },
              "&::placeholder": {
                color: colors.textsecondary,
                opacity: 1,
              },
            },
            "& .MuiInputLabel-root": {
              color: colors.textsecondary,
              fontSize: "0.875rem",
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: colors.accent,
            },
          }}
        />

        <div className="amntpercent">
          <button onClick={() => getLendAmtnPercent(0.25)}>25%</button>
          <button onClick={() => getLendAmtnPercent(0.5)}>50%</button>
          <button onClick={() => getLendAmtnPercent(0.75)}>75%</button>
        </div>
      </div>

      <div className="lendamount">
        <p className="ttle">
          Receipient <br />
          <span>You can use their Telegram username</span>
        </p>

        <TextField
          value={assetReceipient}
          onChange={(ev) => setAssetReceipient(ev.target.value)}
          label="Receipient"
          placeholder="telegram username"
          fullWidth
          variant="outlined"
          autoComplete="off"
          type="text"
          sx={{
            marginTop: "0.75rem",
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: colors.divider,
              },
              "& input": {
                color: colors.textprimary,
              },
              "&::placeholder": {
                color: colors.textsecondary,
                opacity: 1,
              },
            },
            "& .MuiInputLabel-root": {
              color: colors.textsecondary,
              fontSize: "0.875rem",
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: colors.accent,
            },
          }}
        />
      </div>

      <div className="lendutil">
        <p className="utilcase">
          Utility <br />
          <span>What would you like the lent amount to be used for ?</span>
        </p>

        <div className="assetselector" onClick={openUtilPopOver}>
          <div className="img_desc">
            <img src={assets} alt="asset" />

            <p className="desc">
              {selectAssetUtility} <br />
              <span>
                {selectAssetUtility == "staking"
                  ? "Asset will be staked in a DEX (StratoSphereX)"
                  : selectAssetUtility == "liquidity"
                  ? "Asset will provide liquidity for pools"
                  : "Asset will be traded in a DEX (StratosphereX)"}
              </span>
            </p>
          </div>

          <span className="inv_icon">
            <ChevronLeft width={6} height={11} color={colors.textsecondary} />
          </span>
        </div>

        <PopOver anchorEl={utilAnchorEl} setAnchorEl={setUtilAnchorEl}>
          {
            <div className="select_assets">
              <div
                className="img_desc"
                onClick={() => {
                  setSelectAssetUtility("staking");
                  setUtilAnchorEl(null);
                }}
              >
                <img src={assets} alt="asset" />

                <p className="desc">
                  Staking <br />
                  <span>Asset will be staked in a DEX (StratosphereX)</span>
                </p>
              </div>

              <div
                className="img_desc"
                onClick={() => {
                  setSelectAssetUtility("liquidity");
                  setUtilAnchorEl(null);
                }}
              >
                <img src={assets} alt="asset" />

                <p className="desc">
                  Liquidity <br />
                  <span>Asset will provide liquidity for pools</span>
                </p>
              </div>

              <div
                className="img_desc"
                onClick={() => {
                  setSelectAssetUtility("trading");
                  setUtilAnchorEl(null);
                }}
              >
                <img src={assets} alt="asset" />

                <p className="desc">
                  Trading <br />
                  <span>Asset will be traded in a DEX (StratosphereX)</span>
                </p>
              </div>

              <p className="asset_tle">Choose utility for the asset you lend</p>
            </div>
          }
        </PopOver>
      </div>

      <div className="yields">
        <p className="yielcase">
          Yield distribution <br />
          <span>How much would you like to keep from the yield ?</span>
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

      <button className="submit" onClick={goBack}>
        Lend {assetType} <Stake color={colors.textprimary} />
      </button>
    </section>
  );
}
