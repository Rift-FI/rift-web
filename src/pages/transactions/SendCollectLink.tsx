import { JSX, MouseEvent, useState } from "react";
import { openTelegramLink, useLaunchParams } from "@telegram-apps/sdk-react";
import { useNavigate, useParams } from "react-router";
import { Checkbox, Slider, TextField } from "@mui/material";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { shareWalletAccess } from "../../utils/api/wallet";
import { colors } from "../../constants";
import { PopOver } from "../../components/global/PopOver";
import sharewallet from "../../assets/images/sharewallet.png";
import { formatUsd } from "../../utils/formatters";
import { Loading } from "../../assets/animations";
import { ChevronLeft, Telegram } from "../../assets/icons/actions";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import "../../styles/pages/sendcollectlink.scss";

export default function SendCollectLink(): JSX.Element {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { srccurrency, intent } = useParams();
  const { showerrorsnack } = useSnackbar();

  let localethBal = localStorage.getItem("ethbal");
  let localethUsdBal = localStorage.getItem("ethbalUsd");
  let localethValue = localStorage.getItem("ethvalue");
  let localBtcBal = localStorage.getItem("btcbal");
  let localBtcUsdBal = localStorage.getItem("btcbalUsd");
  let localBtcValue = localStorage.getItem("btcvalue");
  let localUSDCBal = "0";
  let localUsdcUsdBal = "0";
  let localUsdcValue = "0.99";

  const [depositAsset, setDepositAsset] = useState<string>(
    srccurrency as string
  );
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [accessAmnt, setAccessAmnt] = useState<string>("");
  const [ethQty, setEthQty] = useState<string>("");
  const [time, setTime] = useState<number>(30);
  const [processing, setProcessing] = useState<boolean>(false);
  const [noExpiry, setNoExpiry] = useState<boolean>(false);

  const marks = [
    { value: 30, label: "30" },
    { value: 60, label: "60" },
    { value: 90, label: "90" },
  ];

  const goBack = () => {
    srccurrency == "BTC"
      ? navigate("/btc-asset")
      : srccurrency == "ETH"
      ? navigate("/eth-asset/send")
      : navigate("/usdc-asset");
  };

  const openAssetPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleChange = (_event: Event, newValue: number | number[]) => {
    setTime(newValue as number);
  };

  const errorInUSDVal = (): boolean => {
    if (
      accessAmnt !== "" &&
      Number(accessAmnt) >=
        Number(
          depositAsset == "BTC"
            ? localBtcUsdBal
            : depositAsset == "ETH"
            ? localethUsdBal
            : localUsdcUsdBal
        )
    )
      return true;
    else return false;
  };

  const onShareWallet = async () => {
    if (depositAsset !== "ETH") {
      showerrorsnack("Feature coming soon, try sending ETH...");
      return;
    }

    if (accessAmnt == "" || errorInUSDVal()) {
      showerrorsnack(`Enter a valid amount`);
    } else {
      setProcessing(true);

      let usdAmountInETH = (Number(accessAmnt) / Number(localethValue)).toFixed(
        5
      );

      const { token } = await shareWalletAccess(
        noExpiry ? "1000d" : `${time}m`,
        usdAmountInETH
      );

      if (token) {
        const shareUrl = token + `%26intent=${intent}`;
        openTelegramLink(
          `https://t.me/share/url?url=${shareUrl}&text=Click to collect ${accessAmnt} USD from ${initData?.user?.username}`
        );
      } else {
        showerrorsnack(
          "Failed to generate shareable link, please try again..."
        );
      }

      setProcessing(false);
    }
  };

  useBackButton(goBack);

  return (
    <div id="sharewalletaccess">
      <img src={sharewallet} alt="share wallet" />

      <p className="title">
        Create a link that allows others to collect {depositAsset} from your
        wallet within a limited time
      </p>

      <div className="assetselector" onClick={openAssetPopOver}>
        <div className="img_desc">
          <img
            src={
              depositAsset == "BTC"
                ? btclogo
                : depositAsset == "ETH"
                ? ethlogo
                : usdclogo
            }
            alt="asset"
          />

          <p className="desc">
            {depositAsset}
            <span>
              {depositAsset == "BTC"
                ? "Bitcoin"
                : depositAsset == "ETH"
                ? "Ethereum"
                : "USD Coin"}
            </span>
          </p>
        </div>

        <span className="inv_icon">
          <ChevronLeft width={6} height={11} color={colors.textsecondary} />
        </span>
      </div>
      <PopOver anchorEl={anchorEl} setAnchorEl={setAnchorEl}>
        <div className="select_assets">
          <div
            className="img_desc"
            onClick={() => {
              setDepositAsset("BTC");
              setAnchorEl(null);
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
              setDepositAsset("ETH");
              setAnchorEl(null);
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
              setDepositAsset("USDC");
              setAnchorEl(null);
            }}
          >
            <img src={usdclogo} alt="asset" />

            <p className="desc">
              USDC <br /> <span>USD Coin</span>
            </p>
          </div>

          <p className="asset_tle">Choose the crypto you would like to send</p>
        </div>
      </PopOver>

      <p className="usd_balance ethereum_balance">
        <span className="my_bal">Balance</span> <br />
        {Number(
          depositAsset == "BTC"
            ? localBtcBal
            : depositAsset == "ETH"
            ? localethBal
            : localUSDCBal
        ).toFixed(5)}{" "}
        {depositAsset}
      </p>

      <TextField
        value={accessAmnt == "" ? "" : ethQty}
        onChange={(ev) => {
          setEthQty(ev.target.value);
          setAccessAmnt(
            (Number(ev.target.value) * Number(localethValue)).toFixed(2)
          );
        }}
        onKeyUp={() => errorInUSDVal()}
        error={errorInUSDVal()}
        label={`Quantity (${depositAsset})`}
        placeholder="0.05"
        fullWidth
        variant="standard"
        autoComplete="off"
        type="number"
        sx={{
          marginTop: "0.375rem",
          "& .MuiInputBase-input": {
            color: colors.textprimary,
          },
          "& .MuiInputLabel-root": {
            color: colors.textsecondary,
          },
          "& .MuiInput-underline:before": {
            borderBottomColor: colors.textsecondary,
          },
          "& .MuiInput-underline:hover:before": {
            borderBottomColor: colors.textsecondary,
          },
          "& .MuiInput-underline:after": {
            borderBottomColor: colors.accent,
          },
        }}
      />

      <TextField
        value={ethQty == "" ? "" : accessAmnt}
        onChange={(ev) => {
          const assetUsdValue =
            depositAsset == "BTC"
              ? localBtcValue
              : depositAsset == "ETH"
              ? localethValue
              : localUsdcValue;
          setAccessAmnt(ev.target.value);
          setEthQty(
            (Number(ev.target.value) / Number(assetUsdValue)).toFixed(5)
          );
        }}
        onKeyUp={() => errorInUSDVal()}
        error={errorInUSDVal()}
        label="Amount (USD)"
        placeholder="1.0"
        fullWidth
        variant="standard"
        autoComplete="off"
        type="number"
        sx={{
          marginTop: "0.875rem",
          "& .MuiInputBase-input": {
            color: colors.textprimary,
          },
          "& .MuiInputLabel-root": {
            color: colors.textsecondary,
          },
          "& .MuiInput-underline:before": {
            borderBottomColor: colors.textsecondary,
          },
          "& .MuiInput-underline:hover:before": {
            borderBottomColor: colors.textsecondary,
          },
          "& .MuiInput-underline:after": {
            borderBottomColor: colors.accent,
          },
        }}
      />

      <p className="usd_balance">
        <span className="my_bal">Your Balance</span> <br />
        {formatUsd(
          Number(
            depositAsset == "BTC"
              ? localBtcUsdBal
              : depositAsset == "ETH"
              ? localethUsdBal
              : localUsdcUsdBal
          )
        )}
      </p>

      <p className="timevalidlabel">
        Access Duration
        <br />
        <span>Set a time limit or select 'no expiry' for unlimited access</span>
      </p>

      <p className="valid_minutes">{time} minutes</p>
      <Slider
        value={time}
        onChange={handleChange}
        marks={marks}
        step={null}
        min={30}
        max={90}
        valueLabelDisplay="on"
        slotProps={{ valueLabel: { style: { color: colors.textprimary } } }}
        sx={{
          marginTop: "1.5rem",
          "& .MuiSlider-markLabel": {
            fontSize: "0.75rem",
            color: colors.textprimary,
          },
          "& .MuiSlider-thumb": {
            backgroundColor: colors.accent,
          },
          "& .MuiSlider-track": {
            backgroundColor: colors.accent,
          },
          "& .MuiSlider-rail": {
            backgroundColor: colors.textsecondary,
          },
          "& .MuiSlider-valueLabel": {
            fontSize: "0.625rem",
            color: colors.textprimary,
            backgroundColor: colors.accent,
          },
        }}
      />

      <div className="noexpiry">
        <Checkbox
          checked={noExpiry}
          onChange={(e) => setNoExpiry(e.target.checked)}
          disableRipple
          sx={{
            color: colors.textsecondary,
            paddingLeft: "unset",
            "&.Mui-checked": {
              color: colors.accent,
            },
          }}
        />

        <p>
          No Expiry <br />
          <span>The link you share will not expire</span>
        </p>
      </div>

      <button
        disabled={
          processing || ethQty == "" || accessAmnt == "" || errorInUSDVal()
        }
        onClick={onShareWallet}
      >
        {processing ? (
          <Loading width="1.5rem" height="1.5rem" />
        ) : (
          <>
            Send{" "}
            <Telegram
              color={
                processing ||
                ethQty == "" ||
                accessAmnt == "" ||
                errorInUSDVal()
                  ? colors.textsecondary
                  : colors.textprimary
              }
            />
          </>
        )}
      </button>
    </div>
  );
}
