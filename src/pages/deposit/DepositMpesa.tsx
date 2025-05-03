import mpesa from "../../assets/images/mpesa1.png";
import { PopOver } from "../../components/global/PopOver";
import { MouseEvent, useState } from "react";
import { useNavigate } from "react-router";
import { useTabs } from "../../hooks/tabs";
import { useBackButton } from "../../hooks/backbutton";
import loading from "../../assets/animations/loading-deposit.json";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import beralogo from "../../assets/images/icons/bera.webp";
import Lottie from "lottie-react";
import kenya from "../../assets/images/ke.webp";
import { toast } from "react-toastify";
function DepositMpesa() {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  // Updated state type to include WUSDC
  const [depositAsset, setDepositAsset] = useState<
    "WBERA" | "ETH" | "USDC" | "WUSDC"
  >("ETH");
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [amountType, setAmountType] = useState<"KES" | "ASSET">("KES");

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const openAssetPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMpesaDeposit = () => {
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
    if (phoneNumber == "") {
      toast.error("Please enter a phone number", {
        style: {
          backgroundColor: "#212121",
          color: "#f6f7f9",
          borderRadius: "10px",
        },
      });
      return;
    }
    setIsLoading(true);
    // handle mpesa deposit, and listen for the response
  };
  const convertToKES = (amount: number, asset: string) => {
    const lowerCaseAsset = asset.toLowerCase();
    switch (lowerCaseAsset) {
      case "eth":
        return amount * 238425.52;
      case "usdc":
        return amount * 129;
      case "wusdc":
        return amount * 129;
      case "wbera":
        return amount * 455.46;
      default:
        return amount;
    }
  };

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
              {convertToKES(Number(amount), depositAsset).toLocaleString()} KES
            </p>
          </div>
        </div>
        {/* Deposit Address Section */}
        <div className="my-4 mt-8 mx-2">
          <p className="text-[#f6f7f9] font-medium mb-1">Phone Number</p>
          <p className="text-gray-400 text-xs mb-4">
            Enter your phone number to receive a payment notification.
          </p>
          <div className="items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-20 h-12 rounded-md border border-[#34404f] bg-[#2a2e2c]">
                <img
                  src={kenya}
                  alt="kenya"
                  className="w-[90%] rounded-md h-[90%]"
                />
              </div>
              <input
                type="text"
                className="w-full p-2 py-4 rounded-xl border border-[#34404f] bg-[#2a2e2c] text-sm text-[#f6f7f9] focus:outline-none focus:ring-2 focus:ring-[#ffb386] focus:border-[#ffb386]"
                placeholder="701838690"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-center absolute bottom-10 left-0 right-0">
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
            <div className="flex items-center justify-between w-full mx-4">
              <p></p>
              <p
                className="px-4 font-semibold text-red-500 text-2xl"
                onClick={() => setIsLoading(false)}
              >
                X
              </p>
            </div>
            <Lottie
              animationData={loading}
              autoPlay
              loop
              className="animation"
              style={{ width: "60vw", maxWidth: 400 }}
            />
            <h1 className="font-bold text-white text-md">
              Sending STK push to +254 {phoneNumber}
            </h1>
            <p className="text-gray-400 text-xs">
              Buying {depositAsset} with{" "}
              {convertToKES(Number(amount), depositAsset).toLocaleString()} KES
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DepositMpesa;
