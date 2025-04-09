import { JSX, MouseEvent, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useSnackbar } from "../../hooks/snackbar";
import { useTabs } from "../../hooks/tabs";
import { useBackButton } from "../../hooks/backbutton";
import { formatUsd } from "../../utils/formatters";
import { shareWalletAccess } from "../../utils/api/wallet";
import { openTelegramLink } from "@telegram-apps/sdk-react";
import { PopOver } from "../../components/global/PopOver";
import { OutlinedTextInput } from "../../components/global/Inputs";
import { Slider, Checkbox } from "@mui/material";
import { Telegram } from "../../assets/icons/actions";
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
  const { switchtab } = useTabs();

  const localethBal = localStorage.getItem("ethbal");
  const localethUsdBal = localStorage.getItem("ethbalUsd");
  const localethValue = localStorage.getItem("ethvalue");
  const localBtcBal = localStorage.getItem("btcbal");
  const localBtcUsdBal = localStorage.getItem("btcbalUsd");
  const localBtcValue = localStorage.getItem("btcvalue");
  const localUSDCBal = localStorage.getItem("usdcbal");
  const localUsdcUsdBal = localStorage.getItem("usdcbal");
  const localUsdcValue = "0.99";
  const localMantraBal = localStorage.getItem("mantrabal");
  const localMantraUsdBal = localStorage.getItem("mantrabalusd");
  const localMantraValue = localStorage.getItem("mantrausdval");
  const prev_page = localStorage.getItem("prev_page");

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
    if (prev_page == null) {
      switchtab("home");
      navigate("/app");
    } else if (prev_page === "send-options") {
      switchtab("sendcrypto");
      navigate("/app");
    } else {
      navigate(prev_page);
    }
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

      const { token: collectlink } = await shareWalletAccess(
        noExpiry ? "8700h" : `${time}m`,
        ethQty,
        depositAsset
      );

      if (collectlink) {
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
    <div className="min-h-screen bg-[#0e0e0e] px-4 py-6 pb-24">
      <h1 className="text-[#f6f7f9] text-2xl font-bold mb-2 mt-6 text-center">
        Click to Collect
      </h1>

      <h2 className="text-gray-400 text-sm mb-6 text-center">
        Create a link that allows others to collect {depositAsset} from your
        wallet within a limited time
      </h2>

      {/* Asset Selector */}
      <div
        onClick={openAssetPopOver}
        className="flex items-center justify-between p-4 bg-[#212121] rounded-xl mb-6 cursor-pointer hover:bg-[#2a2a2a] transition-colors"
      >
        <div className="flex items-center gap-3">
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
            className="w-8 h-8 rounded-full"
          />
          <div>
            <p className="text-[#f6f7f9] font-medium">{depositAsset}</p>
            <p className="text-gray-400 text-sm">
              {depositAsset == "OM"
                ? "Mantra"
                : depositAsset == "BTC"
                ? "Bitcoin"
                : depositAsset == "ETH"
                ? "Ethereum"
                : "USD Coin"}
            </p>
          </div>
        </div>
        {/* <ChevronLeft width={6} height={11} color="#9CA3AF" /> */}
      </div>

      {/* Asset Balance */}
      <div className="bg-[#212121] rounded-xl p-4 mb-6">
        <p className="text-gray-400 text-sm mb-1">Balance</p>
        <p className="text-[#f6f7f9] font-medium">
          {Number(
            depositAsset == "OM"
              ? localMantraBal
              : depositAsset == "BTC"
              ? localBtcBal
              : depositAsset == "ETH"
              ? localethBal
              : localUSDCBal
          ).toFixed(5)}
          &nbsp;{depositAsset}
        </p>
        <p className="text-gray-400 text-sm font-medium">
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
      </div>

      {/* Input Fields */}
      <div className="space-y-4 mb-6">
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
      </div>

      {/* Time Duration Section */}
      <div className="mb-6">
        <div className="mb-4">
          <h3 className="text-[#f6f7f9] font-medium mb-1">Access Duration</h3>
          <p className="text-gray-400 text-sm">
            Set a time limit or select 'no expiry' for unlimited access
          </p>
        </div>

        <p className="text-[#f6f7f9] font-medium text-center mb-4">
          {time} minutes
        </p>

        <Slider
          value={time}
          onChange={handleChange}
          marks={marks}
          step={null}
          min={30}
          max={90}
          valueLabelDisplay="on"
          className="mb-4"
          sx={{
            "& .MuiSlider-markLabel": {
              fontSize: "0.75rem",
              color: "#f6f7f9",
            },
            "& .MuiSlider-thumb": {
              backgroundColor: "#ffb386",
            },
            "& .MuiSlider-track": {
              backgroundColor: "#ffb386",
            },
            "& .MuiSlider-rail": {
              backgroundColor: "#2a2a2a",
            },
            "& .MuiSlider-valueLabel": {
              fontSize: "0.625rem",
              color: "#0e0e0e",
              backgroundColor: "#ffb386",
            },
          }}
        />

        <div className="flex items-start gap-3 p-4 bg-[#212121] rounded-xl">
          <Checkbox
            checked={noExpiry}
            onChange={(e) => setNoExpiry(e.target.checked)}
            disableRipple
            sx={{
              color: "#9CA3AF",
              "&.Mui-checked": {
                color: "#ffb386",
              },
            }}
          />
          <div>
            <p className="text-[#f6f7f9] font-medium">No Expiry</p>
            <p className="text-gray-400 text-sm">
              The link you share will not expire
            </p>
          </div>
        </div>
      </div>

      {/* Asset Selection Popover */}
      <PopOver anchorEl={anchorEl} setAnchorEl={setAnchorEl}>
        <div className="p-4 space-y-4">
          {[
            { id: "OM", name: "Mantra", logo: mantralogo },
            { id: "BTC", name: "Bitcoin", logo: btclogo },
            { id: "ETH", name: "Ethereum", logo: ethlogo },
            { id: "USDC", name: "USD Coin", logo: usdclogo },
          ].map((asset) => (
            <div
              key={asset.id}
              onClick={() => {
                setDepositAsset(asset.id);
                setAnchorEl(null);
              }}
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[#2a2a2a] transition-colors"
            >
              <img
                src={asset.logo}
                alt={asset.name}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="text-[#f6f7f9] font-medium">{asset.id}</p>
                <p className="text-gray-400 text-sm">{asset.name}</p>
              </div>
            </div>
          ))}
        </div>
      </PopOver>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0e0e0e]">
        <button
          onClick={onShareWallet}
          disabled={
            processing || ethQty == "" || accessAmnt == "" || errorInUSDVal()
          }
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors ${
            processing || ethQty == "" || accessAmnt == "" || errorInUSDVal()
              ? "bg-[#212121] text-gray-400"
              : "bg-[#7be891] text-[#0e0e0e] hover:opacity-90"
          }`}
        >
          <Telegram
            color={
              processing || ethQty == "" || accessAmnt == "" || errorInUSDVal()
                ? "#9CA3AF"
                : "#0e0e0e"
            }
          />
          <span>{processing ? "Processing..." : "Send"}</span>
        </button>
      </div>
    </div>
  );
}
