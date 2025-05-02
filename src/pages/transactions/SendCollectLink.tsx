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
import { Slider } from "@mui/material";
import { Telegram } from "../../assets/icons/actions";
import { SubmitButton } from "../../components/global/Buttons";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import beralogo from "../../assets/images/icons/bera.webp";
import { colors } from "@/constants";
import { useAppDrawer } from "@/hooks/drawer";

export default function SendCollectLink(): JSX.Element {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { srccurrency, intent } = useParams();
  const { showerrorsnack } = useSnackbar();
  const { switchtab } = useTabs();
  const { openAppDrawer } = useAppDrawer();

  const ethBal = localStorage.getItem("ethbal");
  const ethBalUsd = localStorage.getItem("ethbalUsd");
  const ethUsdValue = localStorage.getItem("ethvalue");
  const usdcBal = localStorage.getItem("usdcbal");
  const wusdcBal = localStorage.getItem("wusdcbal");
  const wberaBal = localStorage.getItem("WBERAbal");
  const wberaBalUsd = localStorage.getItem("WBERAbalUsd");
  const wberaUsdValue = localStorage.getItem("WberaUsdVal");
  const txverified = localStorage.getItem("txverified");
  const prev_page = localStorage.getItem("prev_page");

  const [depositAsset, setDepositAsset] = useState<string>(
    srccurrency as string
  );
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [accessAmnt, setAccessAmnt] = useState<string>("");
  const [cryptoAmount, setCryptoAmount] = useState<string>("");
  const [time, setTime] = useState<number>(30);
  const [processing, setProcessing] = useState<boolean>(false);
  const [noExpiry] = useState<boolean>(false);

  const assetUsdValue =
    depositAsset == "ETH"
      ? Number(ethUsdValue || 0)
      : depositAsset == "WBERA"
      ? Number(wberaUsdValue || 0)
      : 0.99;

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
    const usdBalance =
      depositAsset === "WBERA"
        ? Number(wberaBalUsd || 0)
        : depositAsset === "ETH"
        ? Number(ethBalUsd || 0)
        : depositAsset === "USDC"
        ? Number(usdcBal || 0)
        : depositAsset === "WUSDC"
        ? Number(wusdcBal || 0)
        : 0;

    const accessAmntNum = Number(accessAmnt);
    // alert(accessAmnt);
    return accessAmntNum > usdBalance;
  };

  const onShareWallet = async () => {
    if (accessAmnt == "" || cryptoAmount == "" || errorInUSDVal()) {
      showerrorsnack(`Enter a valid amount`);
    } else if (txverified == null) {
      openAppDrawer("verifytxwithotp");
    } else {
      setProcessing(true);

      const { token: collectlink } = await shareWalletAccess(
        noExpiry ? "8700h" : `${time}m`,
        cryptoAmount,
        depositAsset
      );

      if (collectlink) {
        localStorage.removeItem("txverified");

        const shareUrl = collectlink + `%26intent=${intent}`;
        openTelegramLink(
          `https://t.me/share/url?url=${shareUrl}&text=Click to collect ${accessAmnt} USD from ${
            initData?.user?.username || initData?.user?.id
          }`
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

  // Restructure for scrolling content area and fixed button
  return (
    // Main container: Full height, flex column
    <div className="flex flex-col h-screen bg-[#0e0e0e] text-[#f6f7f9]">
      {/* Scrollable Content Area */}
      <div className="flex-grow overflow-y-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center mt-6">
          <h1 className="text-[#f6f7f9] text-2xl font-bold mb-2">
            Click to Collect
          </h1>
          <h2 className="text-gray-400 text-sm">
            Create a link that allows others to collect {depositAsset} from your
            wallet within a limited time
          </h2>
        </div>

        {/* Asset Selector */}
        <div
          onClick={openAssetPopOver}
          className="flex items-center justify-between p-4 bg-[#2a2e2c] rounded-xl border border-[#34404f] cursor-pointer hover:bg-[#34404f] transition-colors"
        >
          <div className="flex items-center gap-3">
            <img
              src={
                depositAsset == "WBERA"
                  ? beralogo
                  : depositAsset == "USDC"
                  ? usdclogo
                  : depositAsset == "ETH"
                  ? ethlogo
                  : depositAsset == "WUSDC"
                  ? usdclogo
                  : usdclogo
              }
              alt={depositAsset}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <p className="text-[#f6f7f9] font-medium">{depositAsset}</p>
              <p className="text-gray-400 text-sm">
                {depositAsset == "WBERA"
                  ? "Berachain"
                  : depositAsset == "ETH"
                  ? "Ethereum"
                  : depositAsset == "USDC"
                  ? "USD Coin (Polygon)"
                  : depositAsset == "WUSDC"
                  ? "USDC.e"
                  : "USD Coin"}
              </p>
            </div>
          </div>
        </div>

        {/* Asset Balance */}
        <div className="bg-[#2a2e2c] rounded-xl p-4 border border-[#34404f]">
          <p className="text-gray-400 text-sm mb-1">Balance</p>

          <p className="text-gray-400 text-sm font-medium">
            {depositAsset == "WBERA"
              ? wberaBal
              : depositAsset == "ETH"
              ? ethBal
              : depositAsset == "WUSDC"
              ? wusdcBal
              : usdcBal}
            &nbsp; ~&nbsp;
            {formatUsd(
              depositAsset == "WBERA"
                ? Number(wberaBalUsd)
                : depositAsset == "ETH"
                ? Number(ethBalUsd)
                : depositAsset == "WUSDC"
                ? Number(wusdcBal)
                : Number(usdcBal)
            )}
          </p>
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          <OutlinedTextInput
            inputType="number"
            placeholder="0.00"
            inputlabalel={`Quantity (${depositAsset})`}
            inputState={accessAmnt == "" ? "" : cryptoAmount}
            setInputState={setCryptoAmount}
            onkeyup={() => {
              const usdValue = Number(cryptoAmount) * assetUsdValue;
              setAccessAmnt(isNaN(usdValue) ? "" : usdValue.toFixed(2));
            }}
            hasError={errorInUSDVal()}
          />

          <OutlinedTextInput
            inputType="number"
            placeholder="0.00"
            inputlabalel="Amount (USD)"
            inputState={cryptoAmount == "" ? "" : accessAmnt}
            setInputState={setAccessAmnt}
            onkeyup={() => {
              const cryptoVal =
                assetUsdValue > 0 ? Number(accessAmnt) / assetUsdValue : 0;
              setCryptoAmount(isNaN(cryptoVal) ? "" : cryptoVal.toFixed(5));
            }}
            hasError={errorInUSDVal()}
          />
        </div>

        {/* Time Duration Section */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-[#f6f7f9] font-medium mb-1">Access Duration</h3>
            <p className="text-gray-400 text-sm">
              Set a time limit or select 'no expiry' for unlimited access
            </p>
          </div>

          {!noExpiry && (
            <>
              <p className="text-[#f6f7f9] font-medium text-center">
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
                sx={{
                  "& .MuiSlider-markLabel": {
                    fontSize: "0.75rem",
                    color: "#9ca3af",
                  },
                  "& .MuiSlider-thumb": { backgroundColor: "#ffb386" },
                  "& .MuiSlider-track": { backgroundColor: "#ffb386" },
                  "& .MuiSlider-rail": { backgroundColor: "#34404f" },
                  "& .MuiSlider-valueLabel": {
                    fontSize: "0.625rem",
                    color: "#212523",
                    backgroundColor: "#ffb386",
                  },
                }}
              />
            </>
          )}
        </div>

        {/* Asset Selection Popover (positions based on anchor) */}
        <PopOver anchorEl={anchorEl} setAnchorEl={setAnchorEl}>
          <div className="bg-[#2a2e2c] p-2 rounded-lg shadow-lg border border-[#34404f] w-60">
            {[
              {
                id: "WBERA",
                symbol: "WBERA",
                name: "Berachain",
                logo: beralogo,
              },
              { id: "ETH", symbol: "ETH", name: "Ethereum", logo: ethlogo },
              {
                id: "USDC",
                symbol: "USDC",
                name: "USDC (Polygon)",
                logo: usdclogo,
              },
              {
                id: "WUSDC",
                symbol: "USDC.e",
                name: "USDC (Berachain)",
                logo: usdclogo,
              },
            ].map((asset) => (
              <div
                key={asset.id}
                onClick={() => {
                  setDepositAsset(asset.id);
                  setAnchorEl(null);
                  setAccessAmnt("");
                  setCryptoAmount("");
                }}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-[#34404f] transition-colors"
              >
                <img
                  src={asset.logo}
                  alt={asset.name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-[#f6f7f9] font-medium text-sm">
                    {asset.symbol}
                  </p>
                  <p className="text-gray-400 text-xs">{asset.name}</p>
                </div>
              </div>
            ))}
          </div>
        </PopOver>
      </div>

      <div className="shrink-0 p-4 bg-[#212523] border-t border-[#34404f]">
        <SubmitButton
          text={
            txverified == null
              ? "Verify To Send Link"
              : processing
              ? "Processing..."
              : "Generate & Share Link"
          }
          icon={
            <Telegram
              color={
                processing ||
                cryptoAmount == "" ||
                accessAmnt == "" ||
                errorInUSDVal()
                  ? colors.textsecondary
                  : colors.primary
              }
            />
          }
          isDisabled={
            processing ||
            cryptoAmount == "" ||
            accessAmnt == "" ||
            errorInUSDVal()
          }
          isLoading={processing}
          onclick={onShareWallet}
          sxstyles={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "2rem",
            fontSize: "0.875rem",
            fontWeight: "bold",
          }}
        />
      </div>
    </div>
  );
}
