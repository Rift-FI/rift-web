import { JSX, MouseEvent, useState } from "react";
import { openTelegramLink, useLaunchParams } from "@telegram-apps/sdk-react";
import { useNavigate, useParams } from "react-router";
import { Checkbox, Slider } from "@mui/material";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { shareWalletAccess } from "../../utils/api/wallet";
import { colors } from "../../constants";
import { PopOver } from "../../components/global/PopOver";
import { SubmitButton } from "../../components/global/Buttons";
import { BottomButtonContainer } from "../../components/Bottom";
import { OutlinedTextInput } from "../../components/global/Inputs";
import sharewallet from "../../assets/images/sharewallet.png";
import { formatUsd } from "../../utils/formatters";
import { ChevronLeft, Telegram } from "../../assets/icons/actions";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
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
  let localUSDCBal = localStorage.getItem("usdcbal");
  let localUsdcUsdBal = localStorage.getItem("usdcbal");
  let localUsdcValue = "0.99";
  let localMantraBal = localStorage.getItem("mantrabal");
  let localMantraUsdBal = localStorage.getItem("mantrabalusd");
  let localMantraValue = localStorage.getItem("mantrausdval");

  const [depositAsset, setDepositAsset] = useState<string>(
    srccurrency as string
  );
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [accessAmnt, setAccessAmnt] = useState<string>("");
  const [ethQty, setEthQty] = useState<string>("");
  const [time, setTime] = useState<number>(30);
  const [processing, setProcessing] = useState<boolean>(false);
  const [noExpiry, setNoExpiry] = useState<boolean>(false);

  const assetUsdValue =
    depositAsset == "OM"
      ? localMantraValue
      : depositAsset == "BTC"
      ? localBtcValue
      : depositAsset == "ETH"
      ? localethValue
      : localUsdcValue;

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
          depositAsset == "OM"
            ? localMantraUsdBal
            : depositAsset == "BTC"
            ? localBtcUsdBal
            : depositAsset == "ETH"
            ? localethUsdBal
            : localUsdcUsdBal
        )
    )
      return true;
    else return false;

    return false;
  };

  const onShareWallet = async () => {
    if (accessAmnt == "" || errorInUSDVal()) {
      showerrorsnack(`Enter a valid amount`);
    } else {
      setProcessing(true);

      let usdAmountInETH = (Number(accessAmnt) / Number(localethValue)).toFixed(
        5
      );

      const { token: collectlink } = await shareWalletAccess(
        noExpiry ? "8700d" : `${time}m`,
        usdAmountInETH,
        depositAsset
      );

      if (collectlink) {
        console.log(collectlink);

        const shareUrl = collectlink + `%26intent=${intent}`;
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
              depositAsset == "OM"
                ? mantralogo
                : depositAsset == "BTC"
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
              {depositAsset == "OM"
                ? "Mantra"
                : depositAsset == "BTC"
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
              setDepositAsset("OM");
              setAnchorEl(null);
            }}
          >
            <img src={mantralogo} alt="asset" />

            <p className="desc">
              OM <br /> <span>Mantra</span>
            </p>
          </div>

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
        </div>
      </PopOver>

      <p className="usd_balance ethereum_balance">
        <span className="my_bal">Balance</span> <br />
        {Number(
          depositAsset == "OM"
            ? localMantraBal
            : depositAsset == "BTC"
            ? localBtcBal
            : depositAsset == "ETH"
            ? localethBal
            : localUSDCBal
        ).toFixed(5)}
        &nbsp;
        {depositAsset}
      </p>

      <OutlinedTextInput
        inputType="number"
        placeholder="0.05"
        inputlabalel={`Quantity (${depositAsset})`}
        inputState={accessAmnt == "" ? "" : ethQty}
        setInputState={setEthQty}
        onkeyup={() => {
          setAccessAmnt((Number(ethQty) * Number(assetUsdValue)).toFixed(2));
        }}
        hasError={errorInUSDVal()}
        sxstyles={{ marginTop: "0.875rem" }}
      />

      <OutlinedTextInput
        inputType="number"
        placeholder="100"
        inputlabalel="Amount (USD)"
        inputState={ethQty == "" ? "" : accessAmnt}
        setInputState={setAccessAmnt}
        onkeyup={() => {
          setEthQty((Number(accessAmnt) / Number(assetUsdValue)).toFixed(5));
        }}
        hasError={errorInUSDVal()}
        sxstyles={{ marginTop: "0.875rem" }}
      />

      <p className="usd_balance">
        <span className="my_bal">Your Balance</span> <br />
        {formatUsd(
          Number(
            depositAsset == "OM"
              ? localMantraUsdBal
              : depositAsset == "BTC"
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

      <BottomButtonContainer>
        <SubmitButton
          text="Send"
          icon={
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
          }
          sxstyles={{
            gap: "0.5rem",
            borderRadius: "1.25rem",

            backgroundColor:
              processing || ethQty == "" || accessAmnt == "" || errorInUSDVal()
                ? colors.divider
                : colors.success,
          }}
          isDisabled={
            processing || ethQty == "" || accessAmnt == "" || errorInUSDVal()
          }
          isLoading={processing}
          onclick={onShareWallet}
        />
      </BottomButtonContainer>
    </div>
  );
}
