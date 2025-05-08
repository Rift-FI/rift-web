import { MouseEvent, useState, useEffect } from "react";
import { useLaunchParams, openLink } from "@telegram-apps/sdk-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import Lottie from "lottie-react";
import { PopOver } from "../../components/global/PopOver";
import { useTabs } from "../../hooks/tabs";
import { useBackButton } from "../../hooks/backbutton";
import { OFFRAMP_BASEURL } from "../../utils/api/config";
import { getEthUsdVal } from "../../utils/ethusd";
import { getBerachainUsdVal } from "../../utils/api/mantra";
import loading from "../../assets/animations/loading-deposit.json";
import success from "../../assets/animations/success.json";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import beralogo from "../../assets/images/icons/bera.webp";
import mpesa from "../../assets/images/mpesa1.png";

const KESUSDT = 125;

export default function DepositMpesa() {
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { initData } = useLaunchParams();
  const tgUserId: string = String(initData?.user?.id as number);

  // Updated state type to include WUSDC
  const [depositAsset, setDepositAsset] = useState<
    "WBERA" | "ETH" | "USDC" | "WUSDC"
  >("ETH");
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDepositSuccess, setIsDepositSuccess] = useState(false);
  const ethaddress = localStorage.getItem("ethaddress") as string;
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [amountType, setAmountType] = useState<"KES" | "ASSET">("KES");
  const [kesValue, setKesValue] = useState<number | null>(null);
  const [assetValue, setAssetValue] = useState<number | null>(null);

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const openAssetPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMpesaDeposit = async () => {
    if (amount == "") {
      toast.error("Please enter an amount", {
        style: {
          backgroundColor: "#212121",
          color: "#f6f7f9",
          borderRadius: "10px",
          padding: "10px",
          textAlign: "center",
        },
      });
      return;
    }
    if (email == "") {
      toast.error("Please enter an email", {
        style: {
          backgroundColor: "#212121",
          color: "#f6f7f9",
          borderRadius: "10px",
        },
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${OFFRAMP_BASEURL}/api/onramp/payments`, {
        method: "POST",
        body: JSON.stringify({
          email,
          amount: Number(amount),
          currency: "KES",
          paymentMethod: "mobile_money",
          mobileProvider: "mpesa",
          cryptoAsset:
            depositAsset === "USDC"
              ? "POL-USDC"
              : depositAsset === "WUSDC"
              ? "BERA-USDC"
              : depositAsset,
          cryptoWalletAddress: ethaddress,
          externalReference: tgUserId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      const url = data?.data?.paymentUrl;

      openLink(url);
    } catch (error) {
      setIsLoading(false);

      toast.error("Error depositing funds", {
        style: {
          backgroundColor: "#212121",
          color: "#f6f7f9",
          borderRadius: "10px",
        },
      });
      console.error(error);
    }
  };

  const convertToKES = async (amount: number, asset: string) => {
    const lowerCaseAsset = asset.toLowerCase();
    switch (lowerCaseAsset) {
      case "eth":
        return amount * (await getEthUsdVal()) * KESUSDT;
      case "usdc":
        return amount * KESUSDT;
      case "wusdc":
        return amount * KESUSDT;
      case "wbera":
        return amount * (await getBerachainUsdVal()) * KESUSDT;
      default:
        return amount;
    }
  };

  const convertToAsset = async (amount: number, asset: string) => {
    const lowerCaseAsset = asset.toLowerCase();
    switch (lowerCaseAsset) {
      case "eth":
        return amount / (await getEthUsdVal()) / KESUSDT;
      case "usdc":
        return amount / KESUSDT;
      case "wusdc":
        return amount / KESUSDT;
      case "wbera":
        return amount / (await getBerachainUsdVal()) / KESUSDT;
    }
  };

  useEffect(() => {
    if (amount && amountType === "ASSET") {
      convertToKES(Number(amount), depositAsset).then((val) =>
        setKesValue(val)
      );
    } else {
      setKesValue(null);
    }
  }, [amount, depositAsset, amountType]);

  useEffect(() => {
    if (amount && amountType === "KES") {
      convertToAsset(Number(amount), depositAsset).then((val) =>
        setAssetValue(val !== undefined ? val : null)
      );
    } else {
      setAssetValue(null);
    }
  }, [amount, depositAsset, amountType]);

  useBackButton(goBack);

  return (
    <div>
      <h1 className="text-2xl font-bold text-center mt-4">
        Deposit Crypto using M-PESA
      </h1>
      <p className="text-center text-gray-400 text-sm">
        Deposit crypto to your Sphere wallet using M-PESA
      </p>
      <div className="flex w-full items-center justify-center my-12">
        <img src={mpesa} alt="mpesa" className="w-24 h-24 rounded-full" />
      </div>
      {/* Asset Selector Section */}
      <div className="mx-2">
        <p className="text-[#f6f7f9] font-medium mb-2">Choose Asset</p>
        <div
          onClick={openAssetPopOver}
          className="flex items-center justify-between p-3 bg-[#2a2e2c] rounded-xl border border-[#34404f] cursor-pointer hover:bg-[#34404f] transition-colors"
        >
          <div className="flex items-center gap-3">
            <img
              src={
                depositAsset == "WBERA"
                  ? beralogo
                  : depositAsset == "ETH"
                  ? ethlogo
                  : usdclogo // Covers USDC and WUSDC
              }
              className="w-8 h-8 rounded-full"
              alt={depositAsset}
            />
            <div>
              <p className="text-sm text-[#f6f7f9] font-medium">
                {depositAsset == "WUSDC" ? "USDC.e" : depositAsset}
              </p>
              <span className="text-xs text-gray-400">
                {
                  depositAsset == "WBERA"
                    ? "Berachain"
                    : depositAsset == "ETH"
                    ? "Ethereum"
                    : depositAsset == "USDC"
                    ? "USD Coin (Polygon)"
                    : "USDC (Berachain)" // WUSDC
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PopOver for Asset Selection - Added WUSDC */}
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
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-[#34404f] transition-colors"
              onClick={() => {
                setDepositAsset(asset.id as typeof depositAsset);
                setAnchorEl(null);
              }}
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

      <div className="my-4 mt-8 mx-2">
        <div className="flex items-center justify-between bg-[#2a2e2c] p-2 rounded-xl border border-[#34404f]">
          <div
            className={`${
              amountType === "KES"
                ? "bg-[#ffb386] text-black"
                : "bg-[#2a2e2c] text-[#f6f7f9]"
            } p-2 rounded-xl w-1/2`}
            onClick={() => setAmountType("KES")}
          >
            <p className="text-sm font-medium text-center">KES</p>
          </div>
          <div
            className={`${
              amountType === "ASSET"
                ? "bg-[#ffb386] text-black"
                : "bg-[#2a2e2c] text-[#f6f7f9]"
            } p-2 rounded-xl w-1/2`}
            onClick={() => setAmountType("ASSET")}
          >
            <p className="text-sm font-medium text-center">{depositAsset}</p>
          </div>
        </div>
      </div>
      <div className="">
        <div className="my-4 mt-8 mx-2">
          <div
            className={`${amountType == "KES" ? "flex flex-col" : "hidden"}`}
          >
            <p className="text-[#f6f7f9] font-medium mb-1">Amount</p>
            <p className="text-gray-400 text-xs mb-4">
              The amount in KES you want to deposit.
            </p>
            <input
              type="text"
              className="w-full p-2 py-4 rounded-xl border border-[#34404f] bg-[#2a2e2c] text-sm text-[#f6f7f9] focus:outline-none focus:ring-2 focus:ring-[#ffb386] focus:border-[#ffb386]"
              placeholder="Enter amount in KES"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-gray-400 text-xs mt-2 text-center font-bold">
              {assetValue !== null ? assetValue.toLocaleString() : ""}{" "}
              {depositAsset}
            </p>
          </div>
          <div
            className={`${amountType == "ASSET" ? "flex flex-col" : "hidden"}`}
          >
            <p className="text-[#f6f7f9] font-medium mb-1">Amount</p>
            <p className="text-gray-400 text-xs mb-4">
              The amount in {depositAsset} you want to deposit.
            </p>
            <input
              type="text"
              className="w-full p-2 py-4 rounded-xl border border-[#34404f] bg-[#2a2e2c] text-sm text-[#f6f7f9] focus:outline-none focus:ring-2 focus:ring-[#ffb386] focus:border-[#ffb386]"
              placeholder={`Enter amount in ${depositAsset}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-gray-400 text-xs mt-2 text-center font-bold">
              {kesValue !== null ? kesValue.toLocaleString() : ""} KES
            </p>
          </div>
        </div>
        {/* Deposit Address Section */}
        <div className="my-4 mt-8 mx-2">
          <p className="text-[#f6f7f9] font-medium mb-1">Email</p>
          <p className="text-gray-400 text-xs mb-4">
            Enter your email to receive a payment notification.
          </p>
          <input
            type="text"
            className="w-full p-2 py-4 rounded-xl border border-[#34404f] bg-[#2a2e2c] text-sm text-[#f6f7f9] focus:outline-none focus:ring-2 focus:ring-[#ffb386] focus:border-[#ffb386]"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex w-full items-center justify-center absolute bottom-1 left-0 right-0">
          <button
            className="w-full p-2 py-4 mx-2 rounded-xl border border-[#34404f] bg-[#ffb386] text-sm text-[#0e0e0e] font-semibold"
            onClick={handleMpesaDeposit}
          >
            Deposit
          </button>
        </div>

        {isLoading && (
          <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
            style={{ minHeight: "100vh" }}
          >
            <div className="flex items-center justify-between w-full mx-4"></div>
            <Lottie
              animationData={loading}
              autoPlay
              loop
              className="animation"
              style={{ width: "60vw", maxWidth: 400 }}
            />
            <h1 className="font-bold text-white text-md">
              Processing transaction
            </h1>
            <p className="text-gray-400 text-xs">
              Buying {depositAsset} with{" "}
              {amountType == "KES"
                ? amount
                : kesValue !== null
                ? kesValue.toLocaleString()
                : ""}{" "}
              KES
            </p>
          </div>
        )}
        {isDepositSuccess && (
          <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
            style={{ minHeight: "100vh" }}
          >
            <Lottie
              animationData={success}
              autoPlay
              loop={false}
              className="animation"
              style={{ width: "60vw", maxWidth: 400 }}
            />
            <h1 className="font-bold text-white text-md mt-2">
              {depositAsset} is on its way!
            </h1>
            <p className="text-gray-400 text-xs mt-2">
              Successfully deposited {depositAsset} with{" "}
              {amountType == "KES"
                ? amount
                : kesValue !== null
                ? kesValue.toLocaleString()
                : ""}{" "}
              KES
            </p>
            <div className="flex w-full items-center justify-center mt-8">
              <button
                className="w-1/2 p-2 py-3 mx-2 rounded-xl border border-[#34404f] bg-[#ffb386] text-sm text-[#0e0e0e] font-semibold"
                onClick={() => {
                  setIsDepositSuccess(false);
                  setIsLoading(false);
                }}
              >
                View in Wallet
              </button>
              <button
                className="w-1/2 p-2 py-3 mx-2 rounded-xl border border-[#ffb386] bg-transparent text-sm text-[#f0f7f9] font-semibold"
                onClick={() => {
                  setIsDepositSuccess(false);
                  setIsLoading(false);
                }}
              >
                Transaction Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
